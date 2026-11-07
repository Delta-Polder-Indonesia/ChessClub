/**
 * Penyimpanan latihan repertoar — IndexedDB sebagai gudang utama, `localStorage`
 * sebagai cermin.
 *
 * Kenapa dua tempat: IndexedDB bisa menolak penulisan (kuota penuh, mode privat,
 * tab lain memblokir). Dulu kartu yang gagal ditulis hanya masuk `localStorage`,
 * padahal pembacaan selalu memprioritaskan IndexedDB — akibatnya kartu itu
 * terlihat di layar lalu **hilang setelah halaman dimuat ulang**.
 *
 * Aturan sekarang:
 *   1. setiap penulisan/penghapusan selalu menyentuh cermin `localStorage`
 *      (yang bertahan setelah reload), lalu IndexedDB;
 *   2. pembacaan menggabungkan kedua sumber per `id`, memilih rekaman terbaru
 *      (lihat `stempel`), sehingga tidak ada data yang tertinggal;
 *   3. penghapusan menulis *tombstone* dulu, jadi jalur yang sudah dihapus tidak
 *      bisa dihidupkan lagi oleh sisa data di IndexedDB;
 *   4. setelah IndexedDB sehat kembali, kartu yang tertinggal di cermin
 *      dimigrasikan balik dan tombstone yang sudah beres dibersihkan.
 */
const DATABASE = "kci-papan-repertoar";
const STORE = "kartu";
const VERSION = 1;
const CERMIN_KEY = "kci.papan.repertoar.v1";
const HAPUS_KEY = "kci.papan.repertoar.hapus.v1";

let janjiDatabase;

function bukaDatabase() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (janjiDatabase) return janjiDatabase;

  janjiDatabase = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("lineId", "lineId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB gagal dibuka"));
    request.onblocked = () => reject(new Error("IndexedDB sedang diblokir tab lain"));
  }).catch((error) => {
    janjiDatabase = null;
    throw error;
  });
  return janjiDatabase;
}

/** Buka database tanpa melempar: `null` berarti harus jalan mode cermin saja. */
async function cobaBuka() {
  try {
    return await bukaDatabase();
  } catch {
    return null;
  }
}

/* ── Cermin localStorage ───────────────────────────────────────────── */

function penyimpananLokal() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Safari mode privat bisa melempar saat properti diakses.
    return null;
  }
}

function bacaDaftar(kunci) {
  const ls = penyimpananLokal();
  if (!ls) return [];
  try {
    const parsed = JSON.parse(ls.getItem(kunci) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function tulisDaftar(kunci, daftar) {
  const ls = penyimpananLokal();
  if (!ls) return false;
  try {
    ls.setItem(kunci, JSON.stringify(daftar));
    return true;
  } catch {
    // Kuota penuh / mode privat: cermin dilewati, IndexedDB tetap dicoba.
    return false;
  }
}

function bacaCermin() {
  return bacaDaftar(CERMIN_KEY).filter((kartu) => kartu && kartu.id);
}

function tulisCermin(daftar) {
  return tulisDaftar(CERMIN_KEY, daftar);
}

function bacaTombstone() {
  return bacaDaftar(HAPUS_KEY).map((lineId) => String(lineId || "")).filter(Boolean);
}

function tulisTombstone(daftar) {
  return tulisDaftar(HAPUS_KEY, [...new Set(daftar)]);
}

/* ── Penggabungan dua sumber ───────────────────────────────────────── */

/**
 * Kapan sebuah kartu dianggap "lebih baru".
 *
 * Kartu lama (sebelum ada `diperbarui`) tetap bisa dibandingkan lewat
 * `lastReviewedAt`/`createdAt`, jadi tidak perlu migrasi skema.
 */
function stempel(kartu) {
  return Math.max(
    Number(kartu?.diperbarui) || 0,
    Number(kartu?.lastReviewedAt) || 0,
    Number(kartu?.createdAt) || 0,
  );
}

/** Gabungkan beberapa daftar kartu per `id`; rekaman terbaru menang. */
export function gabungKartu(...sumber) {
  const peta = new Map();
  for (const daftar of sumber) {
    for (const kartu of Array.isArray(daftar) ? daftar : []) {
      if (!kartu || !kartu.id) continue;
      const lama = peta.get(kartu.id);
      if (!lama || stempel(kartu) >= stempel(lama)) peta.set(kartu.id, kartu);
    }
  }
  return [...peta.values()];
}

/* ── Operasi IndexedDB ─────────────────────────────────────────────── */

function hasilRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Permintaan IndexedDB gagal"));
  });
}

function bacaIdb(db) {
  const transaction = db.transaction(STORE, "readonly");
  return hasilRequest(transaction.objectStore(STORE).getAll());
}

function tulisIdb(db, daftar) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    for (const kartu of daftar) store.put(kartu);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Gagal menyimpan kartu"));
    transaction.onabort = () => reject(transaction.error || new Error("Penyimpanan dibatalkan"));
  });
}

function hapusIdb(db, lineId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, "readwrite");
    const store = transaction.objectStore(STORE);
    const request = store.index("lineId").openCursor(IDBKeyRange.only(lineId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Gagal menghapus repertoar"));
    transaction.onabort = () => reject(transaction.error || new Error("Penghapusan dibatalkan"));
  });
}

/* ── API publik ────────────────────────────────────────────────────── */

/** Baca semua kartu: gabungan IndexedDB + cermin, sudah bebas jalur terhapus. */
export async function bacaKartuRepertoar() {
  const db = await cobaBuka();
  let dariIdb = [];
  let idbSiap = false;
  if (db) {
    try {
      dariIdb = await bacaIdb(db);
      idbSiap = true;
    } catch {
      idbSiap = false;
    }
  }

  const tombstone = new Set(bacaTombstone());
  const gabungan = gabungKartu(dariIdb, bacaCermin()).filter(
    (kartu) => !tombstone.has(kartu.lineId),
  );
  tulisCermin(gabungan);
  if (!idbSiap) return gabungan;

  // 1) Bereskan penghapusan yang dulu gagal: kalau sekarang berhasil, tombstone
  //    tidak diperlukan lagi.
  if (tombstone.size) {
    const sisa = new Set();
    for (const lineId of tombstone) {
      try {
        await hapusIdb(db, lineId);
      } catch {
        sisa.add(lineId);
      }
    }
    if (sisa.size !== tombstone.size) tulisTombstone([...sisa]);
  }

  // 2) Migrasi kartu yang dulu hanya sempat mendarat di cermin.
  const idDiIdb = new Set(dariIdb.map((kartu) => kartu.id));
  const tertunda = gabungan.filter((kartu) => !idDiIdb.has(kartu.id));
  if (tertunda.length) {
    try {
      await tulisIdb(db, tertunda);
    } catch {
      // Tetap tersedia lewat cermin sampai IndexedDB bisa menerima lagi.
    }
  }

  return gabungan;
}

/**
 * Simpan kartu. Mengembalikan `true` bila data tersimpan di salah satu tempat
 * yang bertahan setelah reload (cermin dihitung), `false` bila dua-duanya gagal.
 */
export async function simpanKartuRepertoar(daftarBaru) {
  const masuk = (Array.isArray(daftarBaru) ? daftarBaru : []).filter((kartu) => kartu?.id);
  if (!masuk.length) return true;

  const cermin = gabungKartu(bacaCermin(), masuk);
  const cerminTersimpan = tulisCermin(cermin);

  const db = await cobaBuka();
  if (!db) return cerminTersimpan;

  try {
    const dariIdb = await bacaIdb(db);
    const peta = new Map(dariIdb.map((kartu) => [kartu.id, kartu]));
    const perlu = cermin.filter((kartu) => {
      const lama = peta.get(kartu.id);
      return !lama || stempel(kartu) >= stempel(lama);
    });
    if (perlu.length) await tulisIdb(db, perlu);
    tulisCermin(gabungKartu(dariIdb, perlu));
    return true;
  } catch {
    return cerminTersimpan;
  }
}

/** Hapus seluruh kartu satu jalur; tombstone mencegahnya muncul lagi. */
export async function hapusJalurRepertoar(lineId) {
  const target = String(lineId || "");
  if (!target) return true;

  tulisTombstone([...bacaTombstone(), target]);
  const cerminTersimpan = tulisCermin(bacaCermin().filter((kartu) => kartu.lineId !== target));

  const db = await cobaBuka();
  if (!db) return cerminTersimpan;

  try {
    await hapusIdb(db, target);
    tulisTombstone(bacaTombstone().filter((id) => id !== target));
    return true;
  } catch {
    return cerminTersimpan;
  }
}
