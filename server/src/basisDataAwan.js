/**
 * Klien Basis Data Awan Catur (Chess Cloud Database — chessdb.cn).
 *
 * Dipakai papan interaktif SETELAH partai keluar dari buku pembukaan lokal:
 * buku lokal hanya memuat teori (lichess-org/chess-openings), sedangkan CDB
 * menyimpan penilaian mesin untuk posisi-posisi lanjutan. Panggilan dilakukan
 * dari SERVER, bukan browser, karena:
 *   - CSP situs membatasi `connect-src` (chessdb.cn tidak diizinkan), dan
 *   - cdb.php tidak mengirim header CORS.
 *
 * Tiga hal yang dijaga di sini:
 * - SOPAN: hanya aksi baca (`queryall`), `learn=0` supaya kueri kita tidak
 *   menambah beban antrean analisis mereka, dan TIDAK memakai `queue`.
 * - CACHE: hasil posisi yang sudah diketahui disimpan 12 jam; posisi yang
 *   belum ada disimpan 30 menit saja (siapa tahu menyusul).
 * - TENGGANG/ULANG: permintaan menggantung tidak boleh membekukan server;
 *   5xx/429 dicoba ulang sekali, 4xx tidak.
 */
const DASAR = "https://www.chessdb.cn/cdb.php";
const TENGGANG_MS = 5000;
const PERCOBAAN = 2;
const KONKURENSI_MAKS = 4;
const CACHE_MAKS = 500;
const TTL_DIKETAHUI_MS = 12 * 60 * 60 * 1000;
const TTL_BELUM_ADA_MS = 30 * 60 * 1000;
/** Skor di atas ini adalah penanda kemenangan paksa/kotak (bukan pion). */
const AMBANG_SKOR_PAKSA = 10000;
const UA = "BlunderSkuad/1.0 (+basis data awan papan interaktif)";
const MAKS_LANGKAH = 10;

const cache = new Map(); // posisi -> { kedaluwarsa, nilai }

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

/** Galat dengan status HTTP siap pakai (dibaca server/src/permintaan.js). */
export class GalatAwan extends Error {
  constructor(pesan, { status = 502, sebab = "awan-gagal" } = {}) {
    super(pesan);
    this.name = "GalatAwan";
    this.status = status;
    this.sebab = sebab;
  }
}

/* ---------------------------------------------------- pembatas konkurensi */

let aktif = 0;
const antrean = [];

async function kunciKonkurensi() {
  if (aktif < KONKURENSI_MAKS) {
    aktif += 1;
    return;
  }
  await new Promise((r) => antrean.push(r));
  aktif += 1;
}

function lepasKonkurensi() {
  aktif -= 1;
  const lanjut = antrean.shift();
  if (lanjut) lanjut();
}

/* --------------------------------------------------------------- utilitas */

function angka(nilai) {
  if (nilai === null || nilai === undefined || nilai === "") return null;
  const n = Number(nilai);
  return Number.isFinite(n) ? n : null;
}

function dariCache(posisi) {
  const item = cache.get(posisi);
  if (!item) return null;
  if (Date.now() > item.kedaluwarsa) {
    cache.delete(posisi);
    return null;
  }
  return item.nilai;
}

function keCache(posisi, nilai, ttlMs) {
  cache.set(posisi, { nilai, kedaluwarsa: Date.now() + ttlMs });
  while (cache.size > CACHE_MAKS) {
    cache.delete(cache.keys().next().value);
  }
}

/** Kosongkan cache — dipakai uji supaya tiap kasus berdiri sendiri. */
export function bersihkanCacheAwan() {
  cache.clear();
  antrean.length = 0;
  aktif = 0;
}

/* ------------------------------------------------------------ FEN & urai */

const BARIS_PAPAN = /^[rnbqkpRNBQKP1-8]+$/;
const HAK_ROKADE = /^([KQkq]{1,4}|-)$/;
const PETAK_EN_PASSANT = /^(-|[a-h][36])$/;

/**
 * Bersihkan & lengkapi FEN sebelum dikirim ke pihak ketiga. Mengembalikan
 * null bila tidak sah — FEN sampah tidak boleh sampai ke cdb.php.
 */
export function bersihkanFen(fen) {
  const bagian = String(fen || "").trim().split(/\s+/).filter(Boolean);
  if (bagian.length < 2) return null;
  const [papan, giliran, rokade = "-", enPassant = "-", setengah = "0", penuh = "1"] = bagian;
  if (giliran !== "w" && giliran !== "b") return null;
  const baris = papan.split("/");
  if (baris.length !== 8) return null;
  for (const b of baris) {
    if (!BARIS_PAPAN.test(b)) return null;
    let kotak = 0;
    for (const c of b) kotak += /[1-8]/.test(c) ? Number(c) : 1;
    if (kotak !== 8) return null;
  }
  if (!HAK_ROKADE.test(rokade)) return null;
  if (!PETAK_EN_PASSANT.test(enPassant)) return null;
  if (!/^\d+$/.test(setengah) || !/^\d+$/.test(penuh)) return null;
  return [papan, giliran, rokade, enPassant, setengah, penuh].join(" ");
}

/** Satu langkah dari balasan CDB (JSON `{uci,san,score,rank,winrate,note}`). */
function rapikanLangkah(b) {
  const uci = String(b?.uci ?? b?.move ?? "").trim().toLowerCase();
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null;
  const skor = angka(b.score);
  return {
    uci,
    san: b.san ? String(b.san).trim() : null,
    // Skor sentipion dari sudut pandang pihak yang jalan (positif = unggul).
    skorCp: skor !== null && Math.abs(skor) < AMBANG_SKOR_PAKSA ? skor : null,
    rank: angka(b.rank),
    winrate: angka(b.winrate),
    catatan: b.note ? String(b.note).trim() : null,
  };
}

/** Urutkan: rank CDB lebih dulu (0 = terbaik), lalu skor menurun. */
function urutkanLangkah(daftar) {
  return daftar
    .slice()
    .sort((a, b) => {
      const ra = a.rank === null ? Number.MAX_SAFE_INTEGER : a.rank;
      const rb = b.rank === null ? Number.MAX_SAFE_INTEGER : b.rank;
      if (ra !== rb) return ra - rb;
      return (b.skorCp ?? -Infinity) - (a.skorCp ?? -Infinity);
    })
    .slice(0, MAKS_LANGKAH);
}

function uraiJson(teks) {
  let data;
  try {
    data = JSON.parse(teks);
  } catch {
    return [];
  }
  const daftar = Array.isArray(data) ? data : Array.isArray(data?.moves) ? data.moves : [];
  return daftar.map(rapikanLangkah).filter(Boolean);
}

/** Format teks: `move:d2d4,score:31,rank:100,note:!|move:g1f3,...`. */
function uraiTeks(teks) {
  const hasil = [];
  for (const potong of teks.split("|")) {
    if (!potong.trim()) continue;
    const bidang = {};
    for (const pasangan of potong.split(",")) {
      const pisah = pasangan.indexOf(":");
      if (pisah < 0) continue;
      bidang[pasangan.slice(0, pisah).trim()] = pasangan.slice(pisah + 1).trim();
    }
    const langkah = rapikanLangkah(bidang);
    if (langkah) hasil.push(langkah);
  }
  return hasil;
}

/**
 * Urai balasan cdb.php menjadi bentuk yang stabil untuk UI.
 *
 * @returns {{diketahui: boolean, akhir: string|null, langkah: Array<object>}}
 *          `akhir` = "checkmate" | "stalemate" bila posisi sudah berakhir.
 */
export function uraiBalasanAwan(teks) {
  const bersih = String(teks || "").trim();
  if (!bersih) return { diketahui: false, akhir: null, langkah: [] };
  if (bersih === "unknown") return { diketahui: false, akhir: null, langkah: [] };
  if (bersih === "nobestmove") return { diketahui: false, akhir: null, langkah: [] };
  if (bersih === "checkmate" || bersih === "stalemate") {
    return { diketahui: true, akhir: bersih, langkah: [] };
  }
  if (bersih === "invalid board") {
    throw new GalatAwan("Basis data awan menolak posisi ini.", {
      status: 502,
      sebab: "awan-tolak-posisi",
    });
  }
  const langkah = urutkanLangkah(bersih.startsWith("[") ? uraiJson(bersih) : uraiTeks(bersih));
  return { diketahui: langkah.length > 0, akhir: null, langkah };
}

/* ---------------------------------------------------------------- jaringan */

async function ambilTeks(url, fetchImpl) {
  let galatTerakhir = new GalatAwan("Basis data awan tidak dapat dihubungi.", {
    status: 503,
    sebab: "awan-tidak-terjangkau",
  });
  for (let percobaan = 1; percobaan <= PERCOBAAN; percobaan += 1) {
    await kunciKonkurensi();
    const kendali = new AbortController();
    const jam = setTimeout(() => kendali.abort(), TENGGANG_MS);
    try {
      const res = await fetchImpl(url, {
        signal: kendali.signal,
        headers: { Accept: "application/json, text/plain;q=0.8", "User-Agent": UA },
      });
      if (res.ok) return await res.text();
      galatTerakhir = new GalatAwan(`Basis data awan menjawab ${res.status}.`, {
        status: 502,
        sebab: "awan-balas-galat",
      });
      // 4xx (selain 429) tidak akan membaik dengan diulang.
      if (res.status < 500 && res.status !== 429) break;
    } catch {
      /* jaringan/abort -> galatTerakhir tetap "tidak terjangkau" */
    } finally {
      clearTimeout(jam);
      lepasKonkurensi();
    }
    if (percobaan < PERCOBAAN) await tidur(250 * percobaan);
  }
  throw galatTerakhir;
}

/**
 * Tanya basis data awan untuk satu posisi (aksi `queryall`, tanpa `queue`).
 * Hasil sukses selalu berisi `diketahui` + daftar `langkah` (maks. 10).
 */
export async function tanyaAwan(fen, { fetchImpl = globalThis.fetch } = {}) {
  const posisi = bersihkanFen(fen);
  if (!posisi) {
    throw new GalatAwan("Posisi (FEN) tidak sah.", { status: 400, sebab: "fen-tidak-sah" });
  }
  if (typeof fetchImpl !== "function") {
    throw new GalatAwan("Pengambilan data awan tidak tersedia.", {
      status: 503,
      sebab: "awan-tidak-tersedia",
    });
  }
  const tersimpan = dariCache(posisi);
  if (tersimpan) return { ...tersimpan, dariCache: true };

  const url =
    `${DASAR}?action=queryall&board=${encodeURIComponent(posisi)}` +
    "&json=1&showall=0&learn=0";
  const urai = uraiBalasanAwan(await ambilTeks(url, fetchImpl));
  const hasil = {
    sumber: "chessdb",
    posisi,
    diambilPada: new Date().toISOString(),
    ...urai,
  };
  keCache(posisi, hasil, urai.diketahui ? TTL_DIKETAHUI_MS : TTL_BELUM_ADA_MS);
  return hasil;
}
