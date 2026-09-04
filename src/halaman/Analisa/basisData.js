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
const VERSI_DB = 1;
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
        if (!db.objectStoreNames.contains(STORE_PARTAI)) {
          const sPartai = db.createObjectStore(STORE_PARTAI, { keyPath: "id" });
          sPartai.createIndex("platform", "platform", { unique: false });
          sPartai.createIndex("username", "username", { unique: false });
          sPartai.createIndex("kombinasi", ["platform", "username"], { unique: false });
          sPartai.createIndex("timestamp", "timestamp", { unique: false });
        }
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

/**
 * Ambil daftar partai dengan opsi penyaringan, pencarian, dan pengurutan.
 */
export async function ambilDaftarPartai(opsi = {}) {
  const {
    koleksiId = "",
    platform = "",
    username = "",
    cari = "",
    hasil = "", // "white" | "black" | "draw" | "win" | "loss"
    timeClass = "", // "blitz" | "rapid" | "bullet" | "classical"
    urut = "tanggal", // "tanggal" | "pemain" | "langkah" | "hasil"
    arah = "desc",
    limit = 0,
    offset = 0,
  } = opsi;

  const db = await bukaDB();
  let semua = [];

  if (!db) {
    semua = Array.from(memoriPartai.values());
    if (platform) {
      semua = semua.filter((p) => p.platform?.toLowerCase() === platform.toLowerCase());
    }
    if (username) {
      semua = semua.filter((p) => p.username?.toLowerCase() === username.toLowerCase());
    }
  } else {
    semua = await new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_PARTAI], "readonly");
        const store = tx.objectStore(STORE_PARTAI);
        let req;
        if (platform && username) {
          req = store.index("kombinasi").getAll(IDBKeyRange.only([platform, username]));
        } else if (platform) {
          req = store.index("platform").getAll(IDBKeyRange.only(platform));
        } else if (username) {
          req = store.index("username").getAll(IDBKeyRange.only(username));
        } else {
          req = store.getAll();
        }
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // Filter koleksiId jika ada
  if (koleksiId) {
    semua = semua.filter((p) => p.koleksiId === koleksiId);
  }

  // Filter pencarian
  if (cari && cari.trim()) {
    const kata = cari.trim().toLowerCase();
    semua = semua.filter(
      (p) =>
        p.whiteName?.toLowerCase().includes(kata) ||
        p.blackName?.toLowerCase().includes(kata) ||
        p.pgn?.toLowerCase().includes(kata)
    );
  }

  // Filter hasil
  if (hasil) {
    if (hasil === "white" || hasil === "black" || hasil === "draw") {
      semua = semua.filter((p) => p.result === hasil);
    } else if (hasil === "win" && username) {
      semua = semua.filter(
        (p) =>
          (p.result === "white" && p.whiteName.toLowerCase() === username.toLowerCase()) ||
          (p.result === "black" && p.blackName.toLowerCase() === username.toLowerCase())
      );
    } else if (hasil === "loss" && username) {
      semua = semua.filter(
        (p) =>
          (p.result === "white" && p.whiteName.toLowerCase() !== username.toLowerCase()) ||
          (p.result === "black" && p.blackName.toLowerCase() !== username.toLowerCase())
      );
    }
  }

  // Filter timeClass
  if (timeClass && timeClass !== "all") {
    semua = semua.filter((p) => p.timeClass?.toLowerCase() === timeClass.toLowerCase());
  }

  // Pengurutan
  const pengali = arah === "asc" ? 1 : -1;
  semua.sort((a, b) => {
    if (urut === "tanggal") return (a.timestamp - b.timestamp) * pengali;
    if (urut === "langkah") return ((a.plyCount ?? 0) - (b.plyCount ?? 0)) * pengali;
    if (urut === "pemain") {
      const cmp = (a.whiteName || "").localeCompare(b.whiteName || "");
      return (cmp || (a.blackName || "").localeCompare(b.blackName || "")) * pengali;
    }
    if (urut === "hasil") {
      const val = (r) => (r === "white" ? 1 : r === "black" ? -1 : 0);
      return (val(a.result) - val(b.result)) * pengali;
    }
    return (a.timestamp - b.timestamp) * pengali;
  });

  const total = semua.length;
  const partai = limit > 0 ? semua.slice(offset, offset + limit) : semua;

  return { partai, total };
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
 */
export async function hitungStatistikBasisData() {
  const { partai } = await ambilDaftarPartai();
  let putihMenang = 0;
  let hitamMenang = 0;
  let seri = 0;
  const platformCounts = { chessCom: 0, lichessOrg: 0, impor: 0 };

  for (const p of partai) {
    if (p.result === "white") putihMenang++;
    else if (p.result === "black") hitamMenang++;
    else seri++;

    const plat = p.platform || "chessCom";
    if (platformCounts[plat] !== undefined) platformCounts[plat]++;
    else platformCounts[plat] = (platformCounts[plat] || 0) + 1;
  }

  const koleksi = await ambilSemuaKoleksi();

  return {
    totalPartai: partai.length,
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
