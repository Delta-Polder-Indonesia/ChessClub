/**
 * Mode Tantangan — aturan murni, tanpa React dan tanpa DOM.
 *
 * Bedanya dengan latihan biasa:
 *   - **Latihan** memakai satu kartu per posisi dengan penjadwalan ulang
 *     (SRS): kartu yang sudah dikuasai hilang dari jadwal sampai jatuh tempo.
 *   - **Tantangan** menjalankan SELURUH jalur berurutan dari awal, tanpa
 *     petunjuk, dengan batas waktu per langkah. Sekali salah atau kehabisan
 *     waktu, percobaan selesai dan diulang dari langkah pertama.
 *
 * Aturan penilaian sengaja deterministik supaya bisa diuji tanpa jam sungguhan:
 * semua fungsi menerima `durasiMs` sebagai argumen, tidak pernah membaca
 * `Date.now()` sendiri.
 *
 * Langkah dianggap benar bila petak asal/tujuannya sama dengan langkah buku —
 * aturan yang sama dengan latihan (`cocokLangkahBuku`), jadi pilihan bidak
 * promosi tidak pernah membuat langkah yang benar dinilai salah.
 */
import { cocokLangkahBuku, uraiUci } from "./repertoarLogika.js";

/** Batas waktu menjawab satu langkah. */
export const BATAS_WAKTU_LANGKAH_MS = 30_000;
/** Di bawah ambang ini langkah dinilai "cepat" dan dapat bonus poin. */
export const AMBANG_CEPAT_MS = 3_000;
export const POIN_DASAR = 10;
export const POIN_CEPAT = 5;

/** Kunci `localStorage` untuk rekor tantangan per jalur. */
export const KUNCI_REKOR = "kci.papan.tantangan.v1";

/**
 * Susun daftar soal tantangan dari kartu satu jalur.
 *
 * Kartu repertoar sudah menyimpan posisi SEBELUM langkah pemain (`fen`) beserta
 * langkah buku (`expectedUci`), jadi tidak perlu membuka buku pembukaan lagi:
 * tantangan tetap bisa dimainkan walau katalog pembukaan tidak dimuat.
 *
 * @param {Array<object>} daftarKartu kartu milik satu `lineId`
 * @returns {Array<{ply:number, fen:string, expectedUci:string, expectedSan:string}>}
 */
export function susunTantangan(daftarKartu = []) {
  return (Array.isArray(daftarKartu) ? daftarKartu : [])
    .filter((kartu) => kartu && kartu.fen && kartu.expectedUci)
    .slice()
    .sort((a, b) => (Number(a.ply) || 0) - (Number(b.ply) || 0))
    .map((kartu) => ({
      ply: Number(kartu.ply) || 0,
      fen: kartu.fen,
      expectedUci: String(kartu.expectedUci),
      expectedSan: String(kartu.expectedSan || ""),
    }));
}

/** Poin satu langkah benar: dasar, plus bonus bila dijawab cepat. */
export function poinLangkah(durasiMs) {
  const durasi = Number(durasiMs);
  return POIN_DASAR + (Number.isFinite(durasi) && durasi <= AMBANG_CEPAT_MS ? POIN_CEPAT : 0);
}

/**
 * Nilai satu jawaban.
 *
 * @param {object} p
 * @param {string} p.expectedUci langkah buku
 * @param {string|null} [p.jawabanUci] langkah pemain; `null` berarti waktu habis
 * @param {number} [p.durasiMs] waktu menjawab
 * @param {number} [p.batasMs] batas waktu yang berlaku
 * @returns {{benar: boolean, alasan: "waktu"|"salah"|null, poin: number}}
 */
export function nilaiLangkahTantangan({
  expectedUci,
  jawabanUci = null,
  durasiMs = 0,
  batasMs = BATAS_WAKTU_LANGKAH_MS,
}) {
  if (!jawabanUci) return { benar: false, alasan: "waktu", poin: 0 };
  if (Number(durasiMs) > Number(batasMs)) return { benar: false, alasan: "waktu", poin: 0 };

  const benar = cocokLangkahBuku(uraiUci(jawabanUci), expectedUci);
  if (!benar) return { benar: false, alasan: "salah", poin: 0 };
  return { benar: true, alasan: null, poin: poinLangkah(durasiMs) };
}

/**
 * Ringkasan satu percobaan tantangan.
 *
 * `alasan` hanya diisi bila percobaan gagal: `"salah"` (langkah bukan buku)
 * atau `"waktu"` (batas waktu langkah habis).
 *
 * @param {{total:number, benar:number, streakTerbaik:number, poin:number, alasan?:string|null}} p
 */
export function ringkasTantangan({ total = 0, benar = 0, streakTerbaik = 0, poin = 0, alasan = null }) {
  const jumlahSoal = Math.max(0, Number(total) || 0);
  const jumlahBenar = Math.min(jumlahSoal, Math.max(0, Number(benar) || 0));
  const selesai = jumlahSoal > 0 && jumlahBenar === jumlahSoal;

  return {
    total: jumlahSoal,
    benar: jumlahBenar,
    akurasi: jumlahSoal ? Math.round((jumlahBenar / jumlahSoal) * 100) : 0,
    selesai,
    alasan: selesai ? null : alasan || "salah",
    streakTerbaik: Math.max(0, Number(streakTerbaik) || 0),
    poin: Math.max(0, Number(poin) || 0),
  };
}

/**
 * Baca rekor satu jalur. Penyimpanan boleh tidak ada (mode privat, kuota
 * penuh) — dalam hal itu rekor dianggap nol, bukan melempar galat.
 *
 * @param {string} lineId
 * @param {Storage} [penyimpanan]
 * @returns {{streakTerbaik: number, poin: number}}
 */
export function bacaRekor(lineId, penyimpanan = globalThis.localStorage) {
  const kosong = { streakTerbaik: 0, poin: 0 };
  if (!lineId || !penyimpanan) return kosong;
  try {
    const mentah = JSON.parse(penyimpanan.getItem(KUNCI_REKOR) || "{}");
    const rekor = mentah?.[lineId];
    if (!rekor) return kosong;
    return {
      streakTerbaik: Math.max(0, Number(rekor.streakTerbaik) || 0),
      poin: Math.max(0, Number(rekor.poin) || 0),
    };
  } catch {
    return kosong;
  }
}

/**
 * Catat hasil percobaan bila mengalahkan rekor lama.
 *
 * @param {string} lineId
 * @param {{streakTerbaik:number, poin:number}} hasil
 * @param {Storage} [penyimpanan]
 * @returns {{rekor: {streakTerbaik:number, poin:number}, baru: boolean, tersimpan: boolean}}
 */
export function catatRekor(lineId, hasil, penyimpanan = globalThis.localStorage) {
  const lama = bacaRekor(lineId, penyimpanan);
  const baru = {
    streakTerbaik: Math.max(lama.streakTerbaik, Math.max(0, Number(hasil?.streakTerbaik) || 0)),
    poin: Math.max(lama.poin, Math.max(0, Number(hasil?.poin) || 0)),
  };
  const lebihBaik = baru.streakTerbaik > lama.streakTerbaik || baru.poin > lama.poin;
  if (!lineId || !penyimpanan || !lebihBaik) return { rekor: lama, baru: false, tersimpan: false };

  try {
    const mentah = JSON.parse(penyimpanan.getItem(KUNCI_REKOR) || "{}");
    const isi = { ...(mentah && typeof mentah === "object" ? mentah : {}), [lineId]: baru };
    penyimpanan.setItem(KUNCI_REKOR, JSON.stringify(isi));
    return { rekor: baru, baru: true, tersimpan: true };
  } catch {
    // Penyimpanan menolak (kuota penuh / mode privat): rekor hanya sesi ini.
    return { rekor: baru, baru: true, tersimpan: false };
  }
}
