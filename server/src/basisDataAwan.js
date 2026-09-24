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
 *   5xx/429/jaringan dicoba sekali lagi lewat alamat cadangan, 4xx tidak.
 *
 * Format balasan cdb.php (diverifikasi langsung ke layanan, Sep 2026):
 *   - `json=1` → OBJEK: `{"status":"ok","moves":[{uci,san,score,rank,note,
 *     winrate}], "ply":5}`; status lain: "unknown", "checkmate",
 *     "stalemate", "invalid board". `score` bisa "??" (belum dinilai — tetap
 *     disertakan, ditandai `dinilai:false`) dan `winrate` berupa teks
 *     ("50.00").
 *   - tanpa `json` → teks `move:a7a6,score:0,rank:2,note:! (32-04),winrate:50.00|...`
 *   - `rank`: 2 = langkah terbaik ("!"), 1 = bagus, 0 = buruk/belum dinilai.
 */
/** Alamat dicoba berurutan; yang kedua hanya dipakai bila yang pertama gagal
 * di jaringan/5xx (bukan saat menolak dengan 4xx). */
const ALAMAT = ["https://www.chessdb.cn/cdb.php", "https://chessdb.cn/cdb.php"];
const TENGGANG_MS = 8000;
const KONKURENSI_MAKS = 4;
const CACHE_MAKS = 500;
const TTL_DIKETAHUI_MS = 12 * 60 * 60 * 1000;
const TTL_BELUM_ADA_MS = 30 * 60 * 1000;
/** Skor di atas ini adalah penanda kemenangan paksa/kotak (bukan pion). */
const AMBANG_SKOR_PAKSA = 10000;
const UA = "BlunderSkuad/1.0 (+basis data awan papan interaktif)";
/** Batas langkah bernilai yang dikirim — supaya respons & cache tetap kecil. */
const MAKS_LANGKAH_DINILAI = 20;
/**
 * Batas langkah "??" (belum dinilai). Posisi nyaris tidak pernah punya > 40
 * langkah legal, jadi batas ini hanya pengaman; `jumlahBelumDinilai` tetap
 * melaporkan jumlah asli bila sampai dipotong.
 */
const MAKS_LANGKAH_BELUM_DINILAI = 40;

const cache = new Map(); // posisi -> { kedaluwarsa, nilai }

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

/** Galat dengan status HTTP siap pakai (dibaca server/src/permintaan.js). */
export class GalatAwan extends Error {
  constructor(pesan, { status = 502, sebab = "awan-gagal", rincian = null } = {}) {
    super(pesan);
    this.name = "GalatAwan";
    this.status = status;
    this.sebab = sebab;
    this.rincian = rincian;
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

/** Satu langkah dari balasan CDB (`{uci,san,score,rank,winrate,note}`). */
function rapikanLangkah(b) {
  const uci = String(b?.uci ?? b?.move ?? "").trim().toLowerCase();
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null;
  const skor = angka(b.score);
  // Skor "??" = langkah yang belum pernah dinilai CDB. Tetap disertakan
  // (ditandai `dinilai: false`) supaya daftar sama kayanya dengan situs
  // queryc_en — UI menampilkannya terlipat dengan label "belum dianalisis".
  const dinilai = skor !== null;
  // Skor mat paksa (± ≥ 10000) tidak muat skala pion: `skorCp` null, tapi
  // bedakan dari "??" lewat `mat` supaya UI menulis "Mat", bukan "—".
  const mat = dinilai && Math.abs(skor) >= AMBANG_SKOR_PAKSA;
  return {
    uci,
    san: b.san ? String(b.san).trim() : null,
    dinilai,
    // Skor sentipion dari sudut pandang pihak yang jalan (positif = unggul).
    skorCp: dinilai && !mat ? skor : null,
    mat,
    rank: angka(b.rank),
    winrate: angka(b.winrate),
    catatan: b.note ? String(b.note).trim() : null,
    // Skor mentah hanya untuk mengurutkan (termasuk penanda mat paksa).
    _skor: skor,
  };
}

/**
 * Urutkan: yang dinilai lebih dulu (rank CDB menurun = 2 terbaik, lalu skor
 * menurun), disusul yang belum dinilai dalam urutan asli CDB. Batas terpisah:
 * dinilai maks. 20, belum dinilai maks. 40.
 */
function urutkanLangkah(daftar) {
  const dinilai = daftar
    .filter((l) => l.dinilai)
    .sort((a, b) => {
      const ra = a.rank === null ? -1 : a.rank;
      const rb = b.rank === null ? -1 : b.rank;
      if (ra !== rb) return rb - ra;
      return b._skor - a._skor;
    })
    .slice(0, MAKS_LANGKAH_DINILAI);
  const belumDinilai = daftar.filter((l) => !l.dinilai).slice(0, MAKS_LANGKAH_BELUM_DINILAI);
  return [...dinilai, ...belumDinilai].map(({ _skor, ...langkah }) => langkah);
}

function galatTakDikenal(contoh) {
  return new GalatAwan("Balasan basis data awan tidak dikenali.", {
    status: 502,
    sebab: "awan-balasan-tak-dikenal",
    rincian: String(contoh || "").slice(0, 120),
  });
}

/** Status teks CDB → hasil baku; `null` bila bukan status yang dikenal. */
function dariStatus(status) {
  if (status === "unknown" || status === "nobestmove") {
    return { diketahui: false, akhir: null, langkah: [], jumlahDinilai: 0, jumlahBelumDinilai: 0 };
  }
  if (status === "checkmate" || status === "stalemate") {
    return { diketahui: true, akhir: status, langkah: [], jumlahDinilai: 0, jumlahBelumDinilai: 0 };
  }
  if (status === "invalid board") {
    throw new GalatAwan("Basis data awan menolak posisi ini.", {
      status: 502,
      sebab: "awan-tolak-posisi",
    });
  }
  return null;
}

function hasilLangkah(mentah) {
  const semua = mentah.map(rapikanLangkah).filter(Boolean);
  // "Diketahui" = ada ≥ 1 langkah YANG BERNILAI. Posisi yang semua langkahnya
  // "??" belum dianggap diketahui — cache pendek & panel menawarkan engine.
  const jumlahDinilai = semua.filter((l) => l.dinilai).length;
  return {
    diketahui: jumlahDinilai > 0,
    akhir: null,
    langkah: urutkanLangkah(semua),
    jumlahDinilai,
    jumlahBelumDinilai: semua.length - jumlahDinilai,
  };
}

/**
 * Urai balasan cdb.php menjadi bentuk yang stabil untuk UI.
 *
 * Balasan yang TIDAK dikenali (HTML halaman blokir, JSON asing, dsb.) dilempar
 * sebagai galat — jangan pernah diam-diam dianggap "posisi belum ada", karena
 * itulah yang dulu membuat panel tampak kosong tanpa penjelasan.
 *
 * @returns {{diketahui: boolean, akhir: string|null, langkah: Array<object>,
 *            jumlahDinilai: number, jumlahBelumDinilai: number}}
 *          `akhir` = "checkmate" | "stalemate" bila posisi sudah berakhir;
 *          `diketahui` = true bila ada ≥ 1 langkah bernilai (skor numerik)
 *          atau posisi sudah berakhir — semua "??" saja TIDAK cukup.
 */
export function uraiBalasanAwan(teks) {
  const bersih = String(teks || "").trim();
  if (!bersih) return { diketahui: false, akhir: null, langkah: [] };

  if (bersih.startsWith("{") || bersih.startsWith("[")) {
    let data;
    try {
      data = JSON.parse(bersih);
    } catch {
      throw galatTakDikenal(bersih);
    }
    if (Array.isArray(data)) return hasilLangkah(data);
    const status = String(data?.status ?? "").trim().toLowerCase();
    if (status === "ok") {
      return hasilLangkah(Array.isArray(data.moves) ? data.moves : []);
    }
    const hasil = dariStatus(status);
    if (hasil) return hasil;
    throw galatTakDikenal(bersih);
  }

  const hasil = dariStatus(bersih.toLowerCase());
  if (hasil) return hasil;

  // Format teks: `move:d2d4,score:31,rank:2,note:!|move:g1f3,...`.
  if (!/(^|\|)\s*move:/.test(bersih)) throw galatTakDikenal(bersih);
  const mentah = [];
  for (const potong of bersih.split("|")) {
    if (!potong.trim()) continue;
    const bidang = {};
    for (const pasangan of potong.split(",")) {
      const pisah = pasangan.indexOf(":");
      if (pisah < 0) continue;
      bidang[pasangan.slice(0, pisah).trim()] = pasangan.slice(pisah + 1).trim();
    }
    mentah.push(bidang);
  }
  return hasilLangkah(mentah);
}

/* ---------------------------------------------------------------- jaringan */

/** Kode penyebab kegagalan jaringan yang ringkas & aman untuk log. */
function penyebabJaringan(e, habisWaktu) {
  if (habisWaktu) return "tenggang-habis";
  const kode = e?.cause?.code || e?.code;
  if (typeof kode === "string" && /^[A-Z0-9_]{2,40}$/.test(kode)) return kode;
  return e?.name === "AbortError" ? "dibatalkan" : "jaringan";
}

/**
 * Satu baris JSON per kegagalan di log server/function (Vercel → Logs).
 * Tanpa ini, 503 di produksi tidak bisa dibedakan antara DNS gagal, IP
 * datacenter diblokir, atau layanan lambat.
 */
function catatGagal(info) {
  try {
    console.warn(`[kci] basis data awan gagal: ${JSON.stringify(info)}`);
  } catch {
    /* log tidak boleh menjatuhkan permintaan */
  }
}

/**
 * Ambil teks mentah cdb.php. Alamat di `ALAMAT` dicoba berurutan: kegagalan
 * jaringan/tenggang/5xx/429 pindah ke alamat berikutnya, sedangkan 4xx lain
 * (penolakan tegas) langsung dilaporkan — alamat lain tidak akan membaik.
 */
async function ambilTeks(kueri, fetchImpl) {
  let galatTerakhir = new GalatAwan("Basis data awan tidak dapat dihubungi.", {
    status: 503,
    sebab: "awan-tidak-terjangkau",
  });
  for (let i = 0; i < ALAMAT.length; i += 1) {
    const alamat = ALAMAT[i];
    const host = new URL(alamat).host;
    await kunciKonkurensi();
    const kendali = new AbortController();
    let habisWaktu = false;
    const jam = setTimeout(() => {
      habisWaktu = true;
      kendali.abort();
    }, TENGGANG_MS);
    let lanjut = true;
    try {
      const res = await fetchImpl(`${alamat}?${kueri}`, {
        signal: kendali.signal,
        headers: { Accept: "application/json, text/plain;q=0.8", "User-Agent": UA },
      });
      if (res.ok) return await res.text();
      galatTerakhir = new GalatAwan(`Basis data awan menjawab ${res.status}.`, {
        status: 502,
        sebab: `awan-http-${res.status}`,
      });
      catatGagal({ host, pesan: galatTerakhir.message, penyebab: `http-${res.status}` });
      // 4xx (selain 429) tidak akan membaik dengan alamat lain.
      if (res.status < 500 && res.status !== 429) lanjut = false;
    } catch (e) {
      const penyebab = penyebabJaringan(e, habisWaktu);
      catatGagal({
        host,
        pesan: String(e?.message || e).slice(0, 200),
        sebab: e?.cause ? String(e.cause?.message || e.cause).slice(0, 200) : null,
        penyebab,
      });
      galatTerakhir = new GalatAwan(
        habisWaktu
          ? "Basis data awan tidak menjawab tepat waktu."
          : "Basis data awan tidak dapat dihubungi.",
        { status: 503, sebab: habisWaktu ? "awan-tenggang-habis" : "awan-tidak-terjangkau" }
      );
    } finally {
      clearTimeout(jam);
      lepasKonkurensi();
    }
    if (!lanjut) break;
    if (i < ALAMAT.length - 1) await tidur(250);
  }
  throw galatTerakhir;
}

/**
 * Tanya basis data awan untuk satu posisi (aksi `queryall`, tanpa `queue`).
 * Hasil sukses selalu berisi `diketahui` + daftar `langkah` (dinilai lebih
 * dulu, maks. 20 bernilai + 40 belum dinilai) + `jumlahDinilai` /
 * `jumlahBelumDinilai` (jumlah asli sebelum pemotongan batas).
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

  const kueri =
    `action=queryall&board=${encodeURIComponent(posisi)}` + "&json=1&showall=0&learn=0";
  const teks = await ambilTeks(kueri, fetchImpl);
  let urai;
  try {
    urai = uraiBalasanAwan(teks);
  } catch (e) {
    if (e instanceof GalatAwan && e.sebab === "awan-balasan-tak-dikenal") {
      catatGagal({ pesan: e.message, penyebab: "balasan-tak-dikenal", contoh: e.rincian });
    }
    throw e;
  }
  const hasil = {
    sumber: "chessdb",
    posisi,
    diambilPada: new Date().toISOString(),
    ...urai,
  };
  keCache(posisi, hasil, urai.diketahui ? TTL_DIKETAHUI_MS : TTL_BELUM_ADA_MS);
  return hasil;
}
