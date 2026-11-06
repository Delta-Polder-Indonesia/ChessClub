/**
 * Operasi tingkat akun yang menyentuh banyak baris sekaligus: menggabungkan
 * nama pemain dalam satu koleksi dan mengosongkan seluruh basis data.
 *
 * Dependensi: `./migrasi.js` (koneksi, store, cadangan) dan bus revisi dari
 * `./index.js`. Kode dipindahkan apa adanya dari `basisData.js`.
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

/**
 * Gabungkan dua pemain dalam satu koleksi: semua partai yang memakai nama
 * `namaAsli` (baik di baris putih maupun hitam) diganti menjadi `namaTujuan`.
 * Teks PGN ikut diselaraskan pada header `[White "…"]` / `[Black "…"]` agar
 * konsisten saat dianalisa / diekspor. ID partai sengaja dipertahankan agar
 * tidak mengubah kunci utama dan tidak menciptakan duplikat baru.
 *
 * @param {string} koleksiId koleksi tempat nama pemain digabungkan.
 * @param {string} namaAsli nama pemain yang akan diganti.
 * @param {string} namaTujuan nama pemain pengganti (tujuan penggabungan).
 * @returns {Promise<{diubah: number, nama: string}>}
 */
export async function gabungkanPemain(koleksiId, namaAsliRaw, namaTujuanRaw) {
  const asli = String(namaAsliRaw || "").trim();
  const tujuan = String(namaTujuanRaw || "").trim();
  if (!koleksiId || !asli || !tujuan) return { diubah: 0, nama: "" };

  const cocokNama = (nama) => String(nama || "").trim().toLowerCase() === asli.toLowerCase();

  /** Ganti hanya header `[White "…"]` / `[Black "…"]` pada baris PGN. */
  function gantiTag(pgn, tag) {
    return String(pgn || "")
      .split("\n")
      .map((baris) => {
        const m = new RegExp(`^\\[${tag}\\s+"([^"]*)"\\]$`, "i").exec(baris.trim());
        if (m && m[1].trim().toLowerCase() === asli.toLowerCase()) {
          return `[${tag} "${tujuan}"]`;
        }
        return baris;
      })
      .join("\n");
  }
  const selaraskanPgn = (pgn) => gantiTag(gantiTag(pgn, "White"), "Black");

  let diubah = 0;
  const db = await bukaDB();

  /* --- Cadangan memori --- */
  if (!db) {
    const ids = [];
    for (const [id, p] of memoriPartai.entries()) {
      if (p.koleksiId === koleksiId && (cocokNama(p.whiteName) || cocokNama(p.blackName))) {
        ids.push(id);
      }
    }
    for (const id of ids) {
      const p = memoriPartai.get(id);
      const baru = { ...p, pgn: selaraskanPgn(p.pgn) };
      if (cocokNama(p.whiteName)) baru.whiteName = tujuan;
      if (cocokNama(p.blackName)) baru.blackName = tujuan;
      memoriPartai.set(id, baru);
      diubah++;
    }
    if (diubah > 0) {
      simpanFallbackKeStorage();
      naikkanRevisi();
    }
    return { diubah, nama: tujuan };
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI], "readwrite");
      tx.oncomplete = () => {
        if (diubah > 0) naikkanRevisi();
      };
      const store = tx.objectStore(STORE_PARTAI);
      const idx = store.index("koleksiWaktu");
      const BAWAH = -Infinity;
      const ATAS = Infinity;
      const req = idx.openCursor(IDBKeyRange.bound([koleksiId, BAWAH], [koleksiId, ATAS]), "next");

      req.onsuccess = (e) => {
        const kursor = e.target.result;
        if (!kursor) {
          resolve({ diubah, nama: tujuan });
          return;
        }
        const p = kursor.value;
        if (p && (cocokNama(p.whiteName) || cocokNama(p.blackName))) {
          const baru = { ...p, pgn: selaraskanPgn(p.pgn) };
          if (cocokNama(p.whiteName)) baru.whiteName = tujuan;
          if (cocokNama(p.blackName)) baru.blackName = tujuan;
          kursor.update(baru);
          diubah++;
        }
        kursor.continue();
      };
      req.onerror = () => resolve({ diubah, nama: tujuan });
    } catch {
      resolve({ diubah: 0, nama: "" });
    }
  });
}

/**
 * Kosongkan seluruh basis data (semua partai & koleksi).
 */
export async function bersihkanBasisData() {
  const db = await bukaDB();
  if (!db) {
    memoriPartai.clear();
    memoriKoleksi.clear();
    simpanFallbackKeStorage();
    naikkanRevisi();
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI, STORE_KOLEKSI], "readwrite");
      tx.objectStore(STORE_PARTAI).clear();
      tx.objectStore(STORE_KOLEKSI).clear();
      tx.oncomplete = () => {
        naikkanRevisi();
        resolve(true);
      };
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}
