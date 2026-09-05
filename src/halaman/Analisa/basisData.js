/**
 * Basis Data Lokal untuk Halaman Analisa (IndexedDB dengan Fallback).
 *
 * Menyimpan seluruh permainan yang ditarik dari Chess.com, Lichess.org,
 * maupun diimpor dari file/teks PGN ke penyimpanan IndexedDB peramban.
 * Dengan basis data ini:
 *  - Data partai & seluruh langkah tersimpan secara persisten di peramban.
 *  - Membuka akun yang pernah ditarik berlangsung instan (0 ms) tanpa menunggu
 *    antrean permintaan API Chess.com / Lichess.
 *  - Pengguna dapat mencari, menyaring (hasil, kelas waktu), mengekspor PGN,
 *    dan langsung menganalisa partai mana pun dari panel Database.
 *
 * Bila IndexedDB diblokir (mode penyamaran ketat / lingkungan uji jsdom),
 * modul ini otomatis beralih ke memori + localStorage cadangan tanpa melempar galat.
 */
import { Chess } from "chess.js";

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
    // Simpan maksimal 100 partai terbaru di localStorage sebagai cadangan darurat
    const arrPartai = Array.from(memoriPartai.values()).slice(-100);
    localStorage.setItem(AWALAN_STORAGE + "partai", JSON.stringify(arrPartai));
  } catch {
    /* kuota penuh */
  }
}

/** Buka koneksi IndexedDB dengan penanganan galat aman. */
function bukaDB() {
  if (!punyaIndexedDB()) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(NAMA_DB, VERSI_DB);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
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
      req.onsuccess = (e) => resolve(e.target.result);
    } catch {
      resolve(null);
    }
  });
}

/** Buat ID deterministik untuk satu partai agar tidak terjadi duplikasi. */
export function buatIdPartai(p, platform = "chessCom", username = "") {
  if (p.id) return String(p.id);
  const plat = (p.platform || platform || "chessCom").toLowerCase();
  const user = (p.username || username || "").toLowerCase();
  if (p.url) {
    const akhir = String(p.url).trim().split("/").filter(Boolean).pop();
    if (akhir) return `${plat}:${user ? user + ":" : ""}${akhir}`;
  }
  const w = String(p.whiteName || "").trim().toLowerCase();
  const b = String(p.blackName || "").trim().toLowerCase();
  const t = Number(p.timestamp) || 0;
  const ply = Number(p.plyCount) || 0;
  return `${plat}:${user}:${w}_vs_${b}_${t}_${ply}`;
}

/**
 * Normalisasi data partai agar formatnya seragam dan aman disimpan.
 */
export function normalisasiDataPartai(p, platform = "chessCom", username = "") {
  const plat = String(p.platform || platform || "chessCom").trim();
  const user = String(p.username || username || "").trim();
  const pgn = typeof p.pgn === "string" ? p.pgn : "";
  let plyCount = Number(p.plyCount) || 0;

  if (!plyCount && pgn) {
    try {
      const catur = new Chess();
      catur.loadPgn(pgn);
      plyCount = catur.history().length;
    } catch {
      plyCount = 0;
    }
  }

  const wName = String(p.whiteName ?? p.white?.username ?? "").trim();
  const bName = String(p.blackName ?? p.black?.username ?? "").trim();
  const wElo = Number(p.whiteElo ?? p.white?.rating) || 0;
  const bElo = Number(p.blackElo ?? p.black?.rating) || 0;

  let hasil = p.result;
  if (!hasil) {
    if (p.white?.result === "win") hasil = "white";
    else if (p.black?.result === "win") hasil = "black";
    else hasil = "draw";
  }

  const timestamp = Number(p.timestamp) || (p.end_time ? p.end_time * 1000 : Date.now());
  const id = buatIdPartai({ ...p, whiteName: wName, blackName: bName, timestamp, plyCount }, plat, user);

  return {
    id,
    koleksiId: `${plat}:${user.toLowerCase()}`,
    platform: plat,
    username: user,
    url: p.url || "",
    pgn,
    whiteName: wName,
    blackName: bName,
    whiteElo: wElo,
    blackElo: bElo,
    result: hasil,
    timestamp,
    timeClass: p.timeClass || p.time_class || "unknown",
    plyCount,
    disimpanPada: p.disimpanPada || Date.now(),
  };
}

/**
 * Simpan banyak partai sekaligus ke IndexedDB (dan update metadata koleksi).
 */
export async function simpanBanyakPartai(daftarPartai, { platform = "chessCom", username = "" } = {}) {
  if (!Array.isArray(daftarPartai) || daftarPartai.length === 0) {
    return { tersimpan: 0, total: 0 };
  }

  const plat = platform.trim();
  const user = username.trim();
  const koleksiId = `${plat}:${user.toLowerCase()}`;
  const daftarNormal = daftarPartai.map((p) => normalisasiDataPartai(p, plat, user)).filter((p) => p.pgn);

  const db = await bukaDB();
  if (!db) {
    // Fallback memori
    for (const p of daftarNormal) memoriPartai.set(p.id, p);
    const hitung = Array.from(memoriPartai.values()).filter((p) => p.koleksiId === koleksiId).length;
    memoriKoleksi.set(koleksiId, {
      id: koleksiId,
      platform: plat,
      username: user,
      label: user ? `${plat === "chessCom" ? "Chess.com" : plat === "lichessOrg" ? "Lichess.org" : plat} · ${user}` : plat,
      jumlahPartai: hitung,
      terakhirDisinkronkan: Date.now(),
      dibuatPada: memoriKoleksi.get(koleksiId)?.dibuatPada || Date.now(),
    });
    simpanFallbackKeStorage();
    return { tersimpan: daftarNormal.length, total: hitung };
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI, STORE_KOLEKSI], "readwrite");
      const storePartai = tx.objectStore(STORE_PARTAI);
      const storeKoleksi = tx.objectStore(STORE_KOLEKSI);

      for (const p of daftarNormal) {
        storePartai.put(p);
      }

      const reqCount = storePartai.index("kombinasi").count(IDBKeyRange.only([plat, user]));
      reqCount.onsuccess = () => {
        const total = reqCount.result || daftarNormal.length;
        storeKoleksi.put({
          id: koleksiId,
          platform: plat,
          username: user,
          label: user ? `${plat === "chessCom" ? "Chess.com" : plat === "lichessOrg" ? "Lichess.org" : plat} · ${user}` : plat,
          jumlahPartai: total,
          terakhirDisinkronkan: Date.now(),
          dibuatPada: Date.now(),
        });
      };

      tx.oncomplete = () => {
        resolve({ tersimpan: daftarNormal.length, total: daftarNormal.length });
      };
      tx.onerror = () => {
        resolve({ tersimpan: 0, total: 0 });
      };
    } catch {
      resolve({ tersimpan: 0, total: 0 });
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

/* ── Lapisan kueri: paginasi berbasis kursor ───────────────────────── */

/**
 * Pilih indeks paling sempit yang tersedia untuk kombinasi filter pemilik,
 * lengkap dengan rentang kuncinya. Semua indeks di sini berakhiran
 * `timestamp` sehingga kursornya sudah urut waktu — tidak perlu memuat
 * seluruh partai hanya untuk mengurutkannya.
 */
function pilihIndeks(store, platform, username, koleksiId) {
  const punya = (nama) => {
    try {
      return store.indexNames.contains(nama);
    } catch {
      return false;
    }
  };
  const BAWAH = -Infinity;
  const ATAS = Infinity;

  /*
   * Koleksi didahulukan. Selain paling sering dipakai (pengguna memilih satu
   * akun di panel Database), ini juga menutup bug lama: `koleksiId` disimpan
   * dengan username huruf kecil, sedangkan field `username` menyimpan ejaan
   * asli. Mencocokkan lewat indeks [platform, username] karena itu meleset
   * untuk akun ber-huruf besar dan tabelnya tampak kosong.
   */
  if (koleksiId && punya("koleksiWaktu")) {
    return {
      sumber: store.index("koleksiWaktu"),
      rentang: IDBKeyRange.bound([koleksiId, BAWAH], [koleksiId, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: true,
    };
  }

  if (platform && username && punya("kombinasiWaktu")) {
    return {
      sumber: store.index("kombinasiWaktu"),
      rentang: IDBKeyRange.bound([platform, username, BAWAH], [platform, username, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: false,
    };
  }
  if (platform && !username && punya("platformWaktu")) {
    return {
      sumber: store.index("platformWaktu"),
      rentang: IDBKeyRange.bound([platform, BAWAH], [platform, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: false,
    };
  }
  if (username && !platform && punya("usernameWaktu")) {
    return {
      sumber: store.index("usernameWaktu"),
      rentang: IDBKeyRange.bound([username, BAWAH], [username, ATAS]),
      urutWaktu: true,
      pemilikTerpenuhi: false,
    };
  }
  if (!platform && !username && punya("timestamp")) {
    return { sumber: store.index("timestamp"), rentang: null, urutWaktu: true, pemilikTerpenuhi: false };
  }

  /* Basis data lama (belum punya indeks gabungan berwaktu): tetap jalan,
     hanya tanpa keuntungan lompat-offset. */
  if (platform && username && punya("kombinasi")) {
    return { sumber: store.index("kombinasi"), rentang: IDBKeyRange.only([platform, username]), urutWaktu: false, pemilikTerpenuhi: false };
  }
  if (platform && punya("platform")) {
    return { sumber: store.index("platform"), rentang: IDBKeyRange.only(platform), urutWaktu: false, pemilikTerpenuhi: false };
  }
  if (username && punya("username")) {
    return { sumber: store.index("username"), rentang: IDBKeyRange.only(username), urutWaktu: false, pemilikTerpenuhi: false };
  }
  return { sumber: store, rentang: null, urutWaktu: false, pemilikTerpenuhi: false };
}

/** Buang teks PGN dari satu baris daftar (tabel hanya butuh metadatanya). */
function tanpaTeksPgn(partai) {
  if (!partai || typeof partai !== "object") return partai;
  const { pgn, ...sisa } = partai;
  return sisa;
}

/**
 * Penyaring sisi klien untuk hal-hal yang tidak bisa dilayani indeks:
 * koleksi, kata kunci, hasil, dan kelas waktu.
 */
function buatPenyaring({ koleksiId, cari, hasil, timeClass, username }) {
  const kata = cari && cari.trim() ? cari.trim().toLowerCase() : "";
  const kelas = timeClass && timeClass !== "all" ? timeClass.toLowerCase() : "";
  const nama = (username || "").toLowerCase();

  return (p) => {
    if (!p) return false;
    if (koleksiId && p.koleksiId !== koleksiId) return false;
    if (kata) {
      const cocok =
        p.whiteName?.toLowerCase().includes(kata) ||
        p.blackName?.toLowerCase().includes(kata) ||
        p.pgn?.toLowerCase().includes(kata);
      if (!cocok) return false;
    }
    if (hasil) {
      if (hasil === "white" || hasil === "black" || hasil === "draw") {
        if (p.result !== hasil) return false;
      } else if (hasil === "win" && nama) {
        const menang =
          (p.result === "white" && p.whiteName?.toLowerCase() === nama) ||
          (p.result === "black" && p.blackName?.toLowerCase() === nama);
        if (!menang) return false;
      } else if (hasil === "loss" && nama) {
        const kalah =
          (p.result === "white" && p.whiteName?.toLowerCase() !== nama) ||
          (p.result === "black" && p.blackName?.toLowerCase() !== nama);
        if (!kalah) return false;
      }
    }
    if (kelas && p.timeClass?.toLowerCase() !== kelas) return false;
    return true;
  };
}

function bandingkan(urut, arah) {
  const pengali = arah === "asc" ? 1 : -1;
  return (a, b) => {
    if (urut === "langkah") return ((a.plyCount ?? 0) - (b.plyCount ?? 0)) * pengali;
    if (urut === "pemain") {
      const cmp = (a.whiteName || "").localeCompare(b.whiteName || "");
      return (cmp || (a.blackName || "").localeCompare(b.blackName || "")) * pengali;
    }
    if (urut === "hasil") {
      const nilai = (r) => (r === "white" ? 1 : r === "black" ? -1 : 0);
      return (nilai(a.result) - nilai(b.result)) * pengali;
    }
    return (a.timestamp - b.timestamp) * pengali;
  };
}

/** Jalankan kursor pada indeks terpilih; `pada(nilai)` boleh mengembalikan "stop". */
function telusuriKursor(sumber, rentang, arah, pada) {
  return new Promise((selesai) => {
    try {
      const req = sumber.openCursor(rentang, arah);
      req.onsuccess = (e) => {
        const kursor = e.target.result;
        if (!kursor) {
          selesai(true);
          return;
        }
        const hasil = pada(kursor);
        if (hasil === "stop") {
          selesai(true);
          return;
        }
        if (hasil === "lanjut" || hasil === undefined) kursor.continue();
      };
      req.onerror = () => selesai(false);
    } catch {
      selesai(false);
    }
  });
}

function hitungCepat(sumber, rentang) {
  return new Promise((selesai) => {
    try {
      const req = sumber.count(rentang);
      req.onsuccess = () => selesai(req.result || 0);
      req.onerror = () => selesai(0);
    } catch {
      selesai(0);
    }
  });
}

/**
 * Ambil daftar partai dengan opsi penyaringan, pencarian, dan pengurutan.
 *
 * PENTING — hanya satu halaman yang dibaca dari IndexedDB.
 * Sebelumnya fungsi ini memanggil `store.getAll()`: seluruh partai (berikut
 * teks PGN masing-masing, ribuan baris) dimuat ke memori setiap kali tabel
 * berpindah halaman, lalu dipotong dengan `slice`. Sekarang:
 *
 *  - tanpa filter & urut tanggal → jumlah total diambil lewat `count()`,
 *    lalu kursor `advance(offset)` melompat langsung ke halaman yang diminta
 *    dan hanya membaca `limit` rekaman;
 *  - dengan filter → kursor tetap menelusuri (perlu untuk menghitung total),
 *    tetapi hanya baris di jendela halaman yang disimpan, sisanya dibuang;
 *  - `sertakanPgn: false` membuang teks PGN dari hasil — tabel hanya perlu
 *    metadata, dan PGN penuh diambil sesuai kebutuhan lewat `ambilPartai(id)`.
 *
 * @param {object} opsi
 * @param {boolean} [opsi.sertakanPgn=true] sertakan teks PGN pada tiap baris.
 * @returns {Promise<{partai: object[], total: number}>}
 */
export async function ambilDaftarPartai(opsi = {}) {
  const {
    koleksiId = "",
    platform = "",
    username = "",
    cari = "", // cocokkan nama pemain atau isi PGN
    hasil = "", // "white" | "black" | "draw" | "win" | "loss"
    timeClass = "", // "blitz" | "rapid" | "bullet" | "classical"
    urut = "tanggal", // "tanggal" | "pemain" | "langkah" | "hasil"
    arah = "desc",
    limit = 0,
    offset = 0,
    sertakanPgn = true,
  } = opsi;

  const saringDasar = buatPenyaring({ koleksiId, cari, hasil, timeClass, username });
  const rapikan = (p) => (sertakanPgn ? p : tanpaTeksPgn(p));
  const db = await bukaDB();

  /* --- Cadangan memori (IndexedDB diblokir / lingkungan uji) --- */
  if (!db) {
    let semua = Array.from(memoriPartai.values());
    if (platform) semua = semua.filter((p) => p.platform?.toLowerCase() === platform.toLowerCase());
    if (username) semua = semua.filter((p) => p.username?.toLowerCase() === username.toLowerCase());
    semua = semua.filter(saringDasar);
    semua.sort(bandingkan(urut, arah));
    const total2 = semua.length;
    const potong = limit > 0 ? semua.slice(offset, offset + limit) : semua;
    return { partai: potong.map(rapikan), total: total2 };
  }

  let store;
  try {
    store = db.transaction([STORE_PARTAI], "readonly").objectStore(STORE_PARTAI);
  } catch {
    return { partai: [], total: 0 };
  }

  const { sumber, rentang, urutWaktu, pemilikTerpenuhi } = pilihIndeks(
    store,
    platform,
    username,
    koleksiId
  );
  // Bila indeksnya sudah dibatasi pada satu koleksi, penyaring koleksi tidak
  // perlu dijalankan lagi — dan itulah yang membuka jalur cepat.
  const saring = pemilikTerpenuhi
    ? buatPenyaring({ koleksiId: "", cari, hasil, timeClass, username })
    : saringDasar;
  const adaSaringan = Boolean((koleksiId && !pemilikTerpenuhi) || cari || hasil || timeClass);
  const arahKursor = arah === "asc" ? "next" : "prev";
  const bisaLompat = urutWaktu && !adaSaringan && urut === "tanggal";

  /* --- Jalur cepat: langsung lompat ke halaman yang diminta --- */
  if (bisaLompat) {
    const total = await hitungCepat(sumber, rentang);
    if (limit <= 0) {
      // Pemanggil memang meminta semuanya (mis. ekspor PGN).
      const semua = [];
      await telusuriKursor(sumber, rentang, arahKursor, (kursor) => {
        semua.push(rapikan(kursor.value));
      });
      return { partai: semua, total };
    }
    if (offset >= total) return { partai: [], total };

    const baris = [];
    let sudahLompat = offset <= 0;
    await telusuriKursor(sumber, rentang, arahKursor, (kursor) => {
      if (!sudahLompat) {
        sudahLompat = true;
        kursor.advance(offset); // lompati offset tanpa membaca isinya
        return "tunggu";
      }
      baris.push(rapikan(kursor.value));
      return baris.length >= limit ? "stop" : "lanjut";
    });
    return { partai: baris, total };
  }

  /* --- Jalur bersaring: telusuri, tapi simpan seperlunya saja --- */
  const perluUrutUlang = urut !== "tanggal" || !urutWaktu;
  const kumpulan = [];
  const jendela = [];
  let cocok = 0;

  await telusuriKursor(sumber, rentang, arahKursor, (kursor) => {
    const nilai = kursor.value;
    if (!saring(nilai)) return "lanjut";
    if (perluUrutUlang) {
      // Perlu semua yang cocok untuk diurutkan — tapi tanpa teks PGN,
      // jadi memorinya tetap kecil meski partainya ribuan.
      kumpulan.push(tanpaTeksPgn(nilai));
      cocok++;
      return "lanjut";
    }
    if (cocok >= offset && (limit <= 0 || jendela.length < limit)) {
      jendela.push(rapikan(nilai));
    }
    cocok++;
    return "lanjut";
  });

  if (!perluUrutUlang) return { partai: jendela, total: cocok };

  kumpulan.sort(bandingkan(urut, arah));
  const potong = limit > 0 ? kumpulan.slice(offset, offset + limit) : kumpulan;
  if (!sertakanPgn) return { partai: potong, total: kumpulan.length };

  // Hanya baris yang benar-benar tampil yang PGN-nya diambil kembali.
  const lengkap = await Promise.all(
    potong.map(async (p) => (p.pgn ? p : (await ambilPartai(p.id)) || p))
  );
  return { partai: lengkap, total: kumpulan.length };
}

/**
 * Ambil 1 partai berdasarkan ID.
 */
export async function ambilPartai(id) {
  if (!id) return null;
  const db = await bukaDB();
  if (!db) return memoriPartai.get(id) || null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI], "readonly");
      const store = tx.objectStore(STORE_PARTAI);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Hapus 1 partai dari basis data.
 */
export async function hapusPartai(id) {
  if (!id) return false;
  const db = await bukaDB();
  if (!db) {
    const partai = memoriPartai.get(id);
    if (partai) {
      memoriPartai.delete(id);
      simpanFallbackKeStorage();
      return true;
    }
    return false;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI], "readwrite");
      const store = tx.objectStore(STORE_PARTAI);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
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
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI, STORE_KOLEKSI], "readwrite");
      const storePartai = tx.objectStore(STORE_PARTAI);
      const storeKoleksi = tx.objectStore(STORE_KOLEKSI);

      storeKoleksi.delete(koleksiId);

      const reqAll = storePartai.getAll();
      reqAll.onsuccess = () => {
        const semua = reqAll.result || [];
        for (const p of semua) {
          if (p.koleksiId === koleksiId) storePartai.delete(p.id);
        }
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
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
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_PARTAI, STORE_KOLEKSI], "readwrite");
      tx.objectStore(STORE_PARTAI).clear();
      tx.objectStore(STORE_KOLEKSI).clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Hitung ringkasan statistik basis data (total partai, koleksi, menang, kalah, seri).
 *
 * Dihitung sambil menelusuri kursor: tidak ada larik besar yang dibangun dan
 * teks PGN tidak pernah ikut ditumpuk di memori. Dulu fungsi ini memanggil
 * `ambilDaftarPartai()` tanpa limit — artinya seluruh basis data dimuat hanya
 * untuk menjumlahkan menang/kalah setiap kali panel Database dibuka.
 */
export async function hitungStatistikBasisData() {
  let putihMenang = 0;
  let hitamMenang = 0;
  let seri = 0;
  let totalPartai = 0;
  const platformCounts = { chessCom: 0, lichessOrg: 0, impor: 0 };

  const tally = (p) => {
    totalPartai++;
    if (p.result === "white") putihMenang++;
    else if (p.result === "black") hitamMenang++;
    else seri++;
    const plat = p.platform || "chessCom";
    platformCounts[plat] = (platformCounts[plat] || 0) + 1;
  };

  const db = await bukaDB();
  if (!db) {
    for (const p of memoriPartai.values()) tally(p);
  } else {
    let store;
    try {
      store = db.transaction([STORE_PARTAI], "readonly").objectStore(STORE_PARTAI);
    } catch {
      store = null;
    }
    if (store) {
      await telusuriKursor(store, null, "next", (kursor) => {
        tally(kursor.value);
      });
    }
  }

  const koleksi = await ambilSemuaKoleksi();

  return {
    totalPartai,
    totalKoleksi: koleksi.length,
    putihMenang,
    hitamMenang,
    seri,
    platformCounts,
  };
}

/**
 * Ekspor semua partai (atau hasil filter) menjadi satu berkas string PGN multi-game.
 */
export async function eksporPgnKoleksi(opsi = {}) {
  const { partai } = await ambilDaftarPartai({ ...opsi, limit: 0 });
  return partai.map((p) => p.pgn.trim()).filter(Boolean).join("\n\n");
}

/**
 * Pisahkan string PGN yang mungkin memuat beberapa partai sekaligus,
 * lalu simpan semuanya ke basis data di bawah koleksi "impor:default".
 */
export async function imporPgnKeBasisData(teksPgn, { label = "Impor PGN" } = {}) {
  if (!teksPgn || !teksPgn.trim()) return { tersimpan: 0 };
  const raw = teksPgn.trim();

  // Pisahkan berdasarkan awal tag [Event
  const blokPartai = [];
  const baris = raw.split("\n");
  let buffer = [];

  for (const b of baris) {
    if (/^\s*\[Event\s+/i.test(b) && buffer.length > 0) {
      const gabung = buffer.join("\n").trim();
      if (gabung) blokPartai.push(gabung);
      buffer = [b];
    } else {
      buffer.push(b);
    }
  }
  if (buffer.length > 0) {
    const gabung = buffer.join("\n").trim();
    if (gabung) blokPartai.push(gabung);
  }

  const hasilPartai = [];
  for (const blok of blokPartai) {
    try {
      const catur = new Chess();
      catur.loadPgn(blok);
      const headers = catur.header ? catur.header() : {};
      const moves = catur.history();
      if (moves.length === 0 && !headers.FEN) continue;

      const wName = headers.White || "Putih";
      const bName = headers.Black || "Hitam";
      const wElo = Number(headers.WhiteElo) || 0;
      const bElo = Number(headers.BlackElo) || 0;
      let hasil = "draw";
      if (headers.Result === "1-0") hasil = "white";
      else if (headers.Result === "0-1") hasil = "black";

      hasilPartai.push({
        id: `impor:${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        platform: "impor",
        username: "impor",
        pgn: blok,
        whiteName: wName,
        blackName: bName,
        whiteElo: wElo,
        blackElo: bElo,
        result: hasil,
        timestamp: Date.now(),
        timeClass: headers.TimeControl ? "custom" : "unknown",
        plyCount: moves.length,
      });
    } catch {
      /* PGN rusak dilewati */
    }
  }

  if (hasilPartai.length === 0) {
    return { tersimpan: 0 };
  }

  return await simpanBanyakPartai(hasilPartai, { platform: "impor", username: "impor" });
}
