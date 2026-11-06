/**
 * CRUD koleksi (satu koleksi = satu akun/platform) + ekspor PGN koleksi.
 *
 * Dependensi: `./migrasi.js` (koneksi, store, cadangan), bus revisi dari
 * `./index.js`, dan `ambilDaftarPartai` dari `./partai.js` untuk ekspor.
 * Kode dipindahkan apa adanya dari `basisData.js`.
 */
import {
  STORE_PARTAI,
  STORE_KOLEKSI,
  memoriPartai,
  memoriKoleksi,
  bukaDB,
  simpanFallbackKeStorage,
} from "./migrasi.js";
import { naikkanRevisi } from "./index.js";
import { ambilDaftarPartai } from "./partai.js";

/**
 * Pastikan sebuah koleksi akun ada di basis (meski belum ada partai).
 * Dipakai saat user mendaftar akun baru — agar langsung muncul di Database
 * tanpa harus tarik data dulu.
 */
export async function pastikanKoleksi({ platform = "", username = "" } = {}) {
  const plat = String(platform || "").trim();
  const user = String(username || "").trim();
  if (!plat || !user) return null;
  const koleksiId = `${plat}:${user.toLowerCase()}`;
  const label = user
    ? `${user} ${plat === "chessCom" ? "Chess.com" : plat === "lichessOrg" ? "Lichess.org" : plat}`
    : plat;

  const db = await bukaDB();
  if (!db) {
    if (!memoriKoleksi.has(koleksiId)) {
      memoriKoleksi.set(koleksiId, {
        id: koleksiId,
        platform: plat,
        username: user,
        label,
        jumlahPartai: 0,
        terakhirDisinkronkan: Date.now(),
        dibuatPada: Date.now(),
      });
      simpanFallbackKeStorage();
      naikkanRevisi();
    }
    return memoriKoleksi.get(koleksiId) || null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_KOLEKSI], "readwrite");
      const store = tx.objectStore(STORE_KOLEKSI);
      const reqGet = store.get(koleksiId);
      reqGet.onsuccess = () => {
        const ada = reqGet.result;
        if (ada) {
          resolve(ada);
          return;
        }
        const baru = {
          id: koleksiId,
          platform: plat,
          username: user,
          label,
          jumlahPartai: 0,
          terakhirDisinkronkan: Date.now(),
          dibuatPada: Date.now(),
        };
        store.put(baru);
        tx.oncomplete = () => {
          naikkanRevisi();
          resolve(baru);
        };
        tx.onerror = () => resolve(baru);
      };
      reqGet.onerror = () => {
        const baru = {
          id: koleksiId,
          platform: plat,
          username: user,
          label,
          jumlahPartai: 0,
          terakhirDisinkronkan: Date.now(),
          dibuatPada: Date.now(),
        };
        try {
          store.put(baru);
          naikkanRevisi();
        } catch { /* IndexedDB penuh/tutup — data tetap dikirim ke pemanggil */ }
        resolve(baru);
      };
    } catch {
      resolve(null);
    }
  });
}


/**
 * Ambil daftar semua koleksi / akun yang tersimpan di basis data.
 */
export async function ambilSemuaKoleksi() {
  const db = await bukaDB();
  if (!db) {
    return Array.from(memoriKoleksi.values()).sort((a, b) => b.terakhirDisinkronkan - a.terakhirDisinkronkan);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_KOLEKSI], "readonly");
      const store = tx.objectStore(STORE_KOLEKSI);
      const req = store.getAll();
      req.onsuccess = () => {
        const daftar = Array.isArray(req.result) ? req.result : [];
        daftar.sort((a, b) => (b.terakhirDisinkronkan || 0) - (a.terakhirDisinkronkan || 0));
        resolve(daftar);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

/**
 * Hapus seluruh partai dalam satu koleksi akun.
 */
export async function hapusKoleksi(koleksiId) {
  if (!koleksiId) return false;
  const db = await bukaDB();
  if (!db) {
    memoriKoleksi.delete(koleksiId);
    for (const [id, p] of memoriPartai.entries()) {
      if (p.koleksiId === koleksiId) memoriPartai.delete(id);
    }
    simpanFallbackKeStorage();
    naikkanRevisi();
    return true;
  }

  return new Promise((resolve) => {
    let selesai = false;
    const akhiri = (ok) => {
      if (!selesai) {
        selesai = true;
        resolve(ok);
      }
    };
    try {
      const tx = db.transaction([STORE_PARTAI, STORE_KOLEKSI], "readwrite");
      const storePartai = tx.objectStore(STORE_PARTAI);
      const storeKoleksi = tx.objectStore(STORE_KOLEKSI);

      tx.oncomplete = () => {
        naikkanRevisi();
        akhiri(true);
      };
      tx.onerror = () => akhiri(false);
      tx.onabort = () => akhiri(false);

      storeKoleksi.delete(koleksiId);

      /*
       * Hapus partai lewat kursor indeks — BUKAN `getAll` + `delete` per id.
       * `getAll` memuat SELURUH teks PGN semua koleksi ke memori hanya untuk
       * menghapus satu koleksi; kursor indeks hanya menyentuh baris yang
       * cocok. Basis warisan tanpa indeks "koleksiWaktu" (versi lama) jatuh
       * ke pindai seluruh store dengan pemeriksaan `koleksiId` per baris.
       */
      let sumber = storePartai;
      let rentang;
      try {
        if (storePartai.indexNames.contains("koleksiWaktu")) {
          sumber = storePartai.index("koleksiWaktu");
          rentang = IDBKeyRange.bound([koleksiId, -Infinity], [koleksiId, Infinity]);
        }
      } catch {
        sumber = storePartai;
        rentang = undefined;
      }
      const req = sumber.openCursor(rentang);
      req.onsuccess = (e) => {
        const kursor = e.target.result;
        if (!kursor) return; // selesai — tx.oncomplete yang menyelesaikan
        if (kursor.value?.koleksiId === koleksiId) kursor.delete();
        kursor.continue();
      };
      req.onerror = () => akhiri(false);
    } catch {
      akhiri(false);
    }
  });
}

/**
 * Ekspor semua partai (atau hasil filter) menjadi satu berkas string PGN multi-game.
 */
export async function eksporPgnKoleksi(opsi = {}) {
  const { partai } = await ambilDaftarPartai({ ...opsi, limit: 0 });
  return partai.map((p) => p.pgn.trim()).filter(Boolean).join("\n\n");
}
