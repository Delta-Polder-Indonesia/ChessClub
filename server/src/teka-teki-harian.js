/**
 * Teka-teki Harian Chess.com — pengambil data di sisi server.
 *
 * Kenapa lewat server, bukan langsung dari browser:
 * - `api.chess.com` tidak mengirim header CORS untuk pemanggilan lintas asal,
 *   jadi `fetch` dari halaman akan gagal di peramban;
 * - satu titik cache bersama (lihat `chessGet`) mencegah ratusan pengunjung
 *   memukul Chess.com serentak;
 * - User-Agent resmi situs (`konfigurasi.chess.ua`) tetap terkirim, sesuai
 *   kebiasaan API Chess.com.
 *
 * Endpoint yang dipakai adalah API PUBLIK resmi Chess.com:
 *   GET /pub/puzzle               → teka-teki hari ini (UTC)
 *   GET /pub/puzzle/YYYY-MM-DD    → arsip satu tanggal
 *
 * Catatan penting soal data: soal, judul, dan tautan tetap milik Chess.com.
 * Situs ini TIDAK menyalin/menyimpan arsip soal ke dalam repo (seperti yang
 * dilakukan proyek pengikis pihak ketiga); yang disimpan hanya cache memori
 * jangka pendek agar halaman tidak membanjiri API mereka. Tautan ke halaman
 * aslinya selalu ditampilkan supaya pengunjung bisa menyelesaikan soal di
 * sana.
 */
import { GalatChess, chessGet } from "./chess.js";

/** Tanggal yang diterima: persis `YYYY-MM-DD`. */
const POLA_TANGGAL = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Cache teka-teki hari ini — Chess.com memperbaruinya sekali sehari. */
const CACHE_HARI_INI_DETIK = 10 * 60;

/** Arsip satu tanggal tidak akan berubah lagi; cache sehari penuh. */
const CACHE_ARSIP_DETIK = 24 * 60 * 60;

/** Tanggal UTC hari ini dalam bentuk `YYYY-MM-DD`. */
export function tanggalHariIni(sekarang = new Date()) {
  return sekarang.toISOString().slice(0, 10);
}

/**
 * Validasi tanggal kalender sungguhan (bukan sekadar pola).
 * `2026-02-31` ditolak karena tidak ada di kalender.
 *
 * @returns {string|null} tanggal yang sama bila sah, `null` bila tidak.
 */
export function tanggalSah(nilai) {
  if (typeof nilai !== "string") return null;
  const cocok = POLA_TANGGAL.exec(nilai);
  if (!cocok) return null;
  const [, tahun, bulan, hari] = cocok.map(Number);
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari));
  if (
    tanggal.getUTCFullYear() !== tahun ||
    tanggal.getUTCMonth() !== bulan - 1 ||
    tanggal.getUTCDate() !== hari
  ) {
    return null;
  }
  return nilai;
}

/** Geser tanggal `YYYY-MM-DD` sebanyak `hari` (boleh negatif). */
export function geserTanggal(nilai, hari) {
  const tanggal = tanggalSah(nilai);
  if (!tanggal) return null;
  const langkah = Number(hari);
  if (!Number.isFinite(langkah)) return null;
  const [, tahun, bulan, hari0] = POLA_TANGGAL.exec(tanggal).map(Number);
  const hasil = new Date(Date.UTC(tahun, bulan - 1, hari0 + langkah));
  return hasil.toISOString().slice(0, 10);
}

/** FEN dianggap layak bila punya 6 bagian dan 8 baris papan. */
function fenLayak(fen) {
  if (typeof fen !== "string") return false;
  const bagian = fen.trim().split(/\s+/);
  if (bagian.length < 4) return false;
  return bagian[0].split("/").length === 8 && /^[1-8pnbrqkPNBRQK/]+$/.test(bagian[0]);
}

/**
 * Rapikan jawaban mentah Chess.com menjadi bentuk yang dipakai klien.
 *
 * Semua kolom bersifat opsional kecuali `fen`; judul/tautan/gambar boleh
 * hilang tanpa membuat halaman kosong. Bila FEN tidak ada atau rusak, soal
 * dianggap tidak tersedia — papan kosong lebih membingungkan daripada pesan
 * "belum tersedia".
 */
export function normalisasiTekaTeki(mentah, { tanggal } = {}) {
  if (!mentah || typeof mentah !== "object") return null;
  const fen = typeof mentah.fen === "string" ? mentah.fen.trim() : "";
  if (!fenLayak(fen)) return null;

  const pgn = typeof mentah.pgn === "string" ? mentah.pgn.trim() : "";
  const judul =
    typeof mentah.title === "string" && mentah.title.trim()
      ? mentah.title.trim()
      : "";
  const url =
    typeof mentah.url === "string" && /^https?:\/\//i.test(mentah.url)
      ? mentah.url
      : tanggal
        ? `https://www.chess.com/daily-chess-puzzle/${tanggal}`
        : "https://www.chess.com/daily-chess-puzzle";
  const gambar =
    typeof mentah.image === "string" && /^https?:\/\//i.test(mentah.image)
      ? mentah.image
      : null;

  // `publish_time` Chess.com dalam detik; abaikan nilai tak masuk akal.
  const detik = Number(mentah.publish_time);
  const terbitPada =
    Number.isFinite(detik) && detik > 0
      ? new Date(detik * 1000).toISOString()
      : null;

  return {
    tersedia: true,
    tanggal: tanggalSah(tanggal) || null,
    judul,
    fen,
    pgn,
    url,
    gambar,
    terbitPada,
    sumber: "chess.com",
  };
}

/**
 * Ambil teka-teki harian untuk satu tanggal.
 *
 * Mengembalikan SELALU objek berbentuk sama; ketiadaan soal bukan galat:
 *   { tersedia: false, tanggal, alasan: "masa-depan" | "tidak-ada" | "data-tidak-lengkap" }
 *
 * Galat jaringan/galat Chess.com dilempar sebagai `GalatChess` agar pemanggil
 * (rute HTTP) bisa membedakan "belum ada soal" dari "Chess.com bermasalah".
 */
export async function ambilTekaTekiHarian({ tanggal, sekarang } = {}) {
  const hariIni = tanggalHariIni(sekarang);
  const diminta = tanggalSah(tanggal) || hariIni;

  // Tanggal masa depan tidak mungkin punya soal — jangan buang permintaan
  // ke Chess.com hanya untuk mendapat 404.
  if (diminta > hariIni) {
    return { tersedia: false, tanggal: diminta, alasan: "masa-depan" };
  }

  const hariIniDiminta = diminta === hariIni;
  const jalur = hariIniDiminta ? "/puzzle" : `/puzzle/${diminta}`;

  const hasil = await chessGet(jalur, {
    cacheDetik: hariIniDiminta ? CACHE_HARI_INI_DETIK : CACHE_ARSIP_DETIK,
  });

  if (!hasil?.ada) {
    return { tersedia: false, tanggal: diminta, alasan: "tidak-ada" };
  }

  const soal = normalisasiTekaTeki(hasil.data, { tanggal: diminta });
  if (!soal) {
    return { tersedia: false, tanggal: diminta, alasan: "data-tidak-lengkap" };
  }
  return soal;
}

export { GalatChess };
