/**
 * Substrat penyimpanan basis data Analisa (IndexedDB + cadangan localStorage).
 *
 * Bagian ini hanya memuat hal-hal yang berubah BERSAMA ketika bentuk
 * penyimpanan berubah: nama basis, versi skema, nama object store, daftar
 * indeks saat `onupgradeneeded`, koneksi singleton, serta jalur cadangan
 * memori + localStorage ketika IndexedDB tidak bisa dibuka.
 *
 * Sengaja tidak memuat satu pun query/CRUD partai — semuanya ada di
 * `./partai.js`. Modul ini adalah daun: ia tidak mengimpor modul database
 * lain, sehingga tidak ada siklus impor.
 *
 * Pemecahan dari `basisData.js` (Fase 1, murni pemisahan berkas): tidak ada
 * perubahan perilaku, nama store, versi basis, maupun bentuk data.
 */

const NAMA_DB = "kci_catur_database_v1";
/*
 * Versi 2 menambah indeks gabungan berakhiran `timestamp`
 * (`platformWaktu`, `usernameWaktu`, `kombinasiWaktu`). Tanpa indeks itu,
 * mengambil "halaman ke-N" berarti membaca SELURUH isi store lebih dulu —
 * ribuan partai berikut teks PGN-nya — lalu membuang 99% hasilnya. Dengan
 * indeks ini kursor bisa langsung melompat ke offset halaman dan hanya
 * membaca sebanyak baris yang ditampilkan.
 */
const VERSI_DB = 2;
const STORE_PARTAI = "partai";
const STORE_KOLEKSI = "koleksi";
const AWALAN_STORAGE = "kci-analisa-db-";

/* --- Penyimpanan Fallback (Memori + localStorage) --- */
const memoriPartai = new Map();
const memoriKoleksi = new Map();

function punyaIndexedDB() {
  try {
    return typeof window !== "undefined" && Boolean(window.indexedDB);
  } catch {
    return false;
  }
}

function muatFallbackDariStorage() {
  if (typeof localStorage === "undefined") return;
  try {
    const rawKoleksi = localStorage.getItem(AWALAN_STORAGE + "koleksi");
    if (rawKoleksi) {
      const arr = JSON.parse(rawKoleksi);
      if (Array.isArray(arr)) {
        for (const k of arr) if (k?.id) memoriKoleksi.set(k.id, k);
      }
    }
    const rawPartai = localStorage.getItem(AWALAN_STORAGE + "partai");
    if (rawPartai) {
      const arr = JSON.parse(rawPartai);
      if (Array.isArray(arr)) {
        for (const p of arr) if (p?.id) memoriPartai.set(p.id, p);
      }
    }
  } catch {
    /* abaikan kegagalan JSON / kuota localStorage */
  }
}
muatFallbackDariStorage();

function simpanFallbackKeStorage() {
  if (typeof localStorage === "undefined") return;
  try {
    const arrKoleksi = Array.from(memoriKoleksi.values());
    localStorage.setItem(AWALAN_STORAGE + "koleksi", JSON.stringify(arrKoleksi));
    // Simpan maksimal 100 partai TERBARU di localStorage sebagai cadangan
    // darurat. Urutkan berdasar timestamp dulu: Map disusun berdasar urutan
    // sisipan, jadi `.slice(-100)` begitu saja bisa menyimpan partai lama
    // yang dimuat belakangan dan justru membuang partai terbaru.
    const arrPartai = Array.from(memoriPartai.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 100);
    localStorage.setItem(AWALAN_STORAGE + "partai", JSON.stringify(arrPartai));
  } catch {
    /* kuota penuh */
  }
}

/*
 * Koneksi IndexedDB dipakai ULANG (singleton), bukan dibuka ulang di setiap
 * kueri. Versi lama memanggil `indexedDB.open()` ~10 tempat tanpa pernah
 * `db.close()`: pindah-pindah menu Akun ↔ Database berkali-kali membuka
 * popup baru → ratusan koneksi hidup menumpuk di peramban, transaksi saling
 * mengunci, dan memori tab membengkak sampai halaman macet/crash. Satu
 * koneksi singleton aman dipakai banyak transaksi secara paralel.
 */
let koneksiDB = null;
let janjiKoneksi = null;

/** Buka (atau ambil kembali) koneksi IndexedDB dengan penanganan galat aman. */
function bukaDB() {
  if (!punyaIndexedDB()) return Promise.resolve(null);
  if (koneksiDB) return Promise.resolve(koneksiDB);
  if (janjiKoneksi) return janjiKoneksi;

  janjiKoneksi = new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(NAMA_DB, VERSI_DB);
      req.onerror = () => {
        janjiKoneksi = null;
        resolve(null);
      };
      req.onblocked = () => {
        janjiKoneksi = null;
        resolve(null);
      };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        let sPartai;
        if (!db.objectStoreNames.contains(STORE_PARTAI)) {
          sPartai = db.createObjectStore(STORE_PARTAI, { keyPath: "id" });
        } else {
          // Store sudah ada (peningkatan versi): ambil dari transaksi upgrade.
          sPartai = e.target.transaction.objectStore(STORE_PARTAI);
        }
        const pastikanIndeks = (nama, jalur) => {
          if (!sPartai.indexNames.contains(nama)) {
            sPartai.createIndex(nama, jalur, { unique: false });
          }
        };
        pastikanIndeks("platform", "platform");
        pastikanIndeks("username", "username");
        pastikanIndeks("kombinasi", ["platform", "username"]);
        pastikanIndeks("timestamp", "timestamp");
        // Indeks berurut waktu — dipakai paginasi kursor.
        pastikanIndeks("platformWaktu", ["platform", "timestamp"]);
        pastikanIndeks("usernameWaktu", ["username", "timestamp"]);
        pastikanIndeks("kombinasiWaktu", ["platform", "username", "timestamp"]);
        pastikanIndeks("koleksiWaktu", ["koleksiId", "timestamp"]);
        if (!db.objectStoreNames.contains(STORE_KOLEKSI)) {
          db.createObjectStore(STORE_KOLEKSI, { keyPath: "id" });
        }
      };
      req.onsuccess = (e) => {
        const db = e.target.result;
        // Bila tab lain menutup/menaikkan versi basis, buang koneksi mati
        // ini supaya panggilan berikutnya membuka ulang, bukan menggantung.
        db.onversionchange = () => {
          try {
            db.close();
          } catch {
            /* abaikan */
          }
          koneksiDB = null;
          janjiKoneksi = null;
        };
        db.onclose = () => {
          koneksiDB = null;
          janjiKoneksi = null;
        };
        koneksiDB = db;
        janjiKoneksi = null;
        resolve(db);
      };
    } catch {
      janjiKoneksi = null;
      resolve(null);
    }
  });
  return janjiKoneksi;
}

/** Buat ID deterministik untuk satu partai agar tidak terjadi duplikasi. */

/*
 * Permukaan internal modul ini. Hanya nama-nama di bawah yang boleh dipakai
 * modul database lain; `NAMA_DB`, `VERSI_DB`, `AWALAN_STORAGE`,
 * `punyaIndexedDB`, dan `muatFallbackDariStorage` sengaja tetap privat.
 */
export {
  STORE_PARTAI,
  STORE_KOLEKSI,
  memoriPartai,
  memoriKoleksi,
  simpanFallbackKeStorage,
  bukaDB,
};
