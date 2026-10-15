/**
 * Animasi geser bidak — logika MURNI (tanpa React/DOM) untuk papan bersama
 * `PapanTekaTeki`.
 *
 * Mengapa ada: papan dirender ulang dari FEN, jadi setiap langkah membuat
 * bidak hilang di petak asal dan muncul seketika di petak tujuan ("berkedip").
 * Papan chess.com/lichess/boldchess meluncurkan bidaknya. Untuk bisa
 * meluncurkan, papan perlu tahu petak ASAL tiap bidak yang berpindah — dan
 * satu-satunya data yang dimiliki papan adalah FEN sebelum dan sesudah.
 *
 * Modul ini menyimpulkan perpindahan itu dengan membandingkan dua FEN, tanpa
 * bergantung pada prop langkah dari tiap halaman pemakai (TekaTeki,
 * TekaTekiRush, PapanInteraktif, ManusiaVsMesin, LatihanRepertoar).
 */

export const LAJUR = ["a", "b", "c", "d", "e", "f", "g", "h"];

/**
 * Lama luncuran (ms). Disamakan PERSIS dengan referensi isepic-chess-ui
 * (`_CFG.animationTime: 300`): bidak meluncur 300 ms lalu mendarat halus,
 * bukan menyentak.
 * Ubah di SATU tempat ini — papan dan ujinya membaca tetapan yang sama.
 */
export const DURASI_GESER = 300;

/**
 * Lama luncuran saat sistem meminta pengurangan gerak
 * (`prefers-reduced-motion: reduce`). Tetap meluncur supaya perpindahan bidak
 * masih bisa diikuti mata, hanya dipersingkat.
 */
export const DURASI_GESER_MINIM = 120;

/**
 * Kurva luncuran. `"ease"` = easing bawaan CSS — persis apa yang dipakai
 * isepic-chess-ui (`transition: top 300ms, left 300ms` tanpa timing function):
 * berangkat ringan, mendarat melandai.
 */
export const KURVA_GESER = "ease";

/** Ubah bagian posisi FEN menjadi peta petak → huruf bidak ("e4" → "P"). */
export function petaBidak(fen) {
  const peta = {};
  const posisi = String(fen || "").split(" ")[0];
  let baris = 8;
  let kolom = 0;
  for (const ch of posisi) {
    if (ch === "/") {
      baris -= 1;
      kolom = 0;
    } else if (ch >= "1" && ch <= "8") {
      kolom += Number(ch);
    } else {
      if (LAJUR[kolom] && baris >= 1 && baris <= 8) peta[LAJUR[kolom] + baris] = ch;
      kolom += 1;
    }
  }
  return peta;
}

/** Posisi petak di LAYAR (kolom/baris 0..7) sesuai orientasi papan. */
export function posisiLayar(petak, orientasi = "w") {
  const kolom = LAJUR.indexOf(petak[0]);
  const baris = Number(petak[1]);
  return {
    kolom: orientasi === "w" ? kolom : 7 - kolom,
    baris: orientasi === "w" ? 8 - baris : baris - 1,
  };
}

function warnaDari(bidak) {
  return bidak === bidak.toUpperCase() ? "w" : "b";
}

function koordinat(petak) {
  return { x: LAJUR.indexOf(petak[0]), y: Number(petak[1]) };
}

/**
 * Bentuk langkah masuk akal untuk jenis bidaknya (tanpa memeriksa halangan).
 * Arah bidak pion sengaja TIDAK dibatasi supaya navigasi mundur di daftar
 * langkah ikut meluncur, bukan berkedip.
 */
function bentukLangkahSah(bidak, dari, ke) {
  const a = koordinat(dari);
  const b = koordinat(ke);
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  if (!dx && !dy) return false;
  switch (bidak.toLowerCase()) {
    case "p":
      return dx <= 1 && dy >= 1 && dy <= 2 && (dx === 0 || dy === 1);
    case "n":
      return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
    case "b":
      return dx === dy;
    case "r":
      return dx === 0 || dy === 0;
    case "q":
      return dx === dy || dx === 0 || dy === 0;
    case "k":
      // dx 2 = rokade (raja melompat dua petak).
      return dy <= 1 && dx <= 2;
    default:
      return false;
  }
}

/** Pasangan promosi: pion ↔ menteri/benteng/gajah/kuda sewarna, beda satu baris. */
function pasanganPromosi(asal, tujuan, dari, ke) {
  if (warnaDari(asal) !== warnaDari(tujuan)) return false;
  const a = asal.toLowerCase();
  const b = tujuan.toLowerCase();
  const promosi = ["q", "r", "b", "n"];
  const majuKeBidak = a === "p" && promosi.includes(b);
  const mundurKePion = b === "p" && promosi.includes(a);
  if (!majuKeBidak && !mundurKePion) return false;
  const p = koordinat(dari);
  const q = koordinat(ke);
  return Math.abs(q.x - p.x) <= 1 && Math.abs(q.y - p.y) === 1;
}

function jarakPetak(dari, ke) {
  const a = koordinat(dari);
  const b = koordinat(ke);
  return Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
}

/** Pilih petak asal paling masuk akal untuk satu bidak yang muncul. */
function pilihAsal(sisa, tujuan) {
  let terpilih = -1;
  let terdekat = Infinity;
  sisa.forEach((calon, i) => {
    const sama = calon.bidak === tujuan.bidak;
    const cocok = sama
      ? bentukLangkahSah(calon.bidak, calon.petak, tujuan.petak)
      : pasanganPromosi(calon.bidak, tujuan.bidak, calon.petak, tujuan.petak);
    if (!cocok) return;
    const jarak = jarakPetak(calon.petak, tujuan.petak);
    if (jarak < terdekat) {
      terdekat = jarak;
      terpilih = i;
    }
  });
  return terpilih;
}

/**
 * Simpulkan perpindahan bidak antara dua FEN.
 *
 * @param {string} fenLama FEN sebelum perubahan
 * @param {string} fenBaru FEN sesudah perubahan
 * @returns {{dari: string, ke: string, bidak: string}[]} daftar luncuran
 *   (kosong bila perubahan posisi TIDAK bisa dijelaskan oleh satu langkah —
 *   mis. soal baru, muat FEN/PGN, atau lompat beberapa langkah sekaligus;
 *   dalam hal itu papan memang harus langsung menampilkan posisi baru).
 */
export function geseranDariFen(fenLama, fenBaru) {
  if (!fenLama || !fenBaru || fenLama === fenBaru) return [];
  const lama = petaBidak(fenLama);
  const baru = petaBidak(fenBaru);
  const keluar = [];
  const masuk = [];
  for (const petak of new Set([...Object.keys(lama), ...Object.keys(baru)])) {
    const a = lama[petak];
    const b = baru[petak];
    if (a && a !== b) keluar.push({ petak, bidak: a });
    if (b && b !== a) masuk.push({ petak, bidak: b });
  }
  // Satu langkah menggeser paling banyak dua bidak (rokade); en passant
  // mengosongkan dua petak. Lebih dari itu = posisi diganti, bukan dilangkahi.
  if (!masuk.length || masuk.length > 2 || keluar.length > 2) return [];
  const sisa = [...keluar];
  const hasil = [];
  for (const tujuan of masuk) {
    const i = pilihAsal(sisa, tujuan);
    // Ada bidak yang muncul tanpa asal yang masuk akal → posisi diganti.
    if (i < 0) return [];
    const [asal] = sisa.splice(i, 1);
    hasil.push({ dari: asal.petak, ke: tujuan.petak, bidak: tujuan.bidak });
  }
  // Satu langkah hanya menggerakkan bidak SATU warna dan selalu membalik
  // giliran. Tanpa syarat ini, lompat dua langkah di daftar riwayat (mis.
  // 1.e4 e5 sekaligus) ikut terbaca sebagai "satu langkah" dan dua bidak
  // meluncur bersamaan — bukan yang ditampilkan papan mana pun.
  const warna = new Set(hasil.map((g) => warnaDari(g.bidak)));
  if (warna.size > 1) return [];
  const giliranLama = String(fenLama).split(" ")[1];
  const giliranBaru = String(fenBaru).split(" ")[1];
  if (giliranLama && giliranBaru && giliranLama === giliranBaru) return [];
  return hasil;
}

/** Pergeseran piksel satu luncuran di layar, sesuai orientasi & ukuran petak. */
export function geseranPiksel(geseran, orientasi, ukuranPetak) {
  const a = posisiLayar(geseran.dari, orientasi);
  const b = posisiLayar(geseran.ke, orientasi);
  return {
    x: (b.kolom - a.kolom) * ukuranPetak,
    y: (b.baris - a.baris) * ukuranPetak,
  };
}

/**
 * Gaya luncuran yang meniru `komponen/game/board.jsx` di Report Analisa
 * (`animateMove`): 150 ms, linear, tanpa efek pudar bidak yang dimakan.
 * Tidak dipakai halaman mana pun saat ini — semua papan memakai gaya bawaan
 * di bawah (lebih lambat & halus, seperti chess.com). Gaya ini disimpan lewat
 * prop `gayaGeser="analisa"` bila diperlukan lagi.
 */
export const GAYA_ANALISA = Object.freeze({
  durasi: 150,
  kurva: "linear",
  pudar: false,
});

/**
 * Konfigurasi luncuran untuk satu papan.
 * - `"analisa"`: persis gaya Report Analisa (`GAYA_ANALISA`).
 * - lainnya: gaya bawaan — 300 ms `ease` TANPA pudar, sama persis dengan
 *   isepic-chess-ui: bidak dimakan hilang seketika, bidak hasil langkah
 *   muncul begitu meluncuran mendarat.
 */
export function konfigurasiGeser(gaya) {
  if (gaya === "analisa") return { ...GAYA_ANALISA };
  return { durasi: durasiGeser(), kurva: KURVA_GESER, pudar: false };
}

/** Pengguna meminta animasi dikurangi (setelan sistem)? */
export function kurangiGerak() {
  try {
    return !!globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  } catch {
    return false;
  }
}

/**
 * Lama luncuran yang dipakai papan saat ini. Dipisah dari tetapan supaya
 * setelan "kurangi gerak" hanya MEMPERSINGKAT luncuran, bukan mematikannya —
 * papan tanpa luncuran sama sekali itulah yang dulu terasa "berkedip".
 */
export function durasiGeser() {
  return kurangiGerak() ? DURASI_GESER_MINIM : DURASI_GESER;
}
