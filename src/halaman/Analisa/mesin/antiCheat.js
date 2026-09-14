/**
 * Skor kecurigaan penggunaan engine (anti-cheat) berbasis hasil analisis PGN.
 *
 * Dua tingkat perhitungan:
 *  1. PER PARTAI — `hitungSkorKecurigaan(moves)` memakan array `moves` hasil
 *     `parsePGN()` (lihat ./engine.js) dan mengembalikan `{ w, b }`.
 *  2. AGREGAT RIWAYAT — `agregatSkorPemain(daftarHasilPartai, username)`
 *     menggabungkan banyak partai menjadi satu gambaran per pemain.
 *
 * DUA GENERASI METRIK (keduanya hidup berdampingan):
 *  - GENERASI 1 (selalu tersedia): kecocokan top-1 (`engineMatchRate`) dan
 *    ACPL dari selisih eval antarposisi.
 *  - GENERASI 2 (bila `moves[i].kandidat` ada, hasil pencarian MultiPV):
 *    peringkat langkah pemain di antara MULTI_PV kandidat terbaik posisi
 *    sebelumnya, kecocokan top-3/top-5, dan kehilangan centipawn langsung
 *    terhadap kandidat terbaik pada pencarian yang SAMA — jauh lebih tajam
 *    daripada top-1, karena langkah "hampir terbaik" (peringkat 2, selisih
 *    8 cp) tidak lagi dihitung sama dengan langkah buruk (peringkat 6+).
 *    Semua metrik generasi 2 bernilai null bila data kandidat tidak ada
 *    (analisis lama, atau partai hasil cache sebelum fitur ini) dan skor
 *    otomatis menormalkan ulang bobotnya.
 *
 * Keluarannya PROBABILISTIK: angka untuk dibaca manusia (pengurus/turnamen),
 * BUKAN vonis. Kecocokan langkah dengan engine naik secara alami seiring
 * kekuatan pemain, kontrol waktu yang panjang, dan fase akhirpartai yang
 * sederhana; semua itu membuat pemain jujur bisa tampak "mirip engine".
 * Karena itu setiap metrik disajikan mentah di samping skor gabungan, dan UI
 * wajib menyertakan sanggahan (lihat `deteksiEngine.jsx`).
 *
 * Semua fungsi di sini MURNI (gaya ./penilaian.js): tidak ada React, tidak
 * ada DOM, tidak ada pemanggilan engine — hanya membaca output yang sudah
 * dihasilkan ./engine.js (impor `MULTI_PV` hanyalah konstanta).
 *
 * KONVENSI EVAL (penting, jangan diubah tanpa membaca ./penilaian.js):
 * `staticEval` berbentuk mentah UCI — `["cp", "34"]` atau `["mate", "2"]` —
 * relatif terhadap PIHAK YANG BERGILIR pada posisi tersebut. Pada satu entri
 * `moves[i]`:
 *   - `previousStaticEvals[0]` = eval SESUDAH langkah `san` dimainkan,
 *     giliran = `color` (lawan pemain);
 *   - `previousStaticEvals[1]` = eval SEBELUM langkah itu, giliran = pemain.
 * Dengan begitu kerugian langkah (centipawn, dari sudut pemain yang bergerak)
 * adalah `cp(prev[1]) + cp(prev[0])` untuk KEDUA warna — lihat penurunan di
 * `kerugianCentipawn`. Skor kandidat MultiPV juga dari sudut pihak yang
 * bergilir (= pemain), sehingga selisih antarkandidat boleh langsung
 * dikurangkan tanpa pembalikan tanda.
 */

import { invertColor } from "./penilaian.js";
import { DAFTAR_FASE, FASE_PEMBUKAAN, faseBerikutnya, papanDariFen } from "./fase.js";
import { MULTI_PV } from "./engine.js";

/** Ikut diekspor supaya konsumen modul ini tak perlu mengimpor ./engine.js. */
export { MULTI_PV };

/** Skor `["mate", n]` diperlakukan setara keunggulan sebesar ini (centipawn). */
export const CP_MATE = 10000;

/**
 * Kerugian satu langkah dipotong di sini. Tanpa batas, kehilangan menteri lalu
 * menemukan langkah terbaik menghasilkan "kerugian" ribuan centipawn yang
 * mendominasi rata-rata; 1000 cp (10 bidak) sudah jauh di atas kerugian wajar
 * satu langkah dan dipakai Lichess sebagai batas clamp eval.
 */
export const BATAS_KERUGIAN = 1000;

/** Jumlah minimum sampel waktu sebelum konsistensi jam dihitung. */
export const SAMPEL_WAKTU_MINIMUM = 8;

/** Level keluaran — dipetakan ke `analisa.antiCheat.level.<kunci>` di kamus. */
export const LEVEL_RENDAH = "rendah";
export const LEVEL_SEDANG = "sedang";
export const LEVEL_TINGGI = "tinggi";

export const AMBANG = Object.freeze({
  /** Kecocokan engine (%) di bawah angka ini tidak menyumbang skor. */
  kecocokanDasar: 45,
  /** ACPL (centipawn) di atas angka ini tidak menyumbang skor. */
  acplAcuan: 45,
  /** Koefisien variasi waktu ≥ angka ini = "tidak konsisten" (skor waktu 0). */
  variasiWaktuAcuan: 0.75,
  /** Penyusutan sampel: n langkah dinilai → bobot n / (n + angka ini). */
  penyusutanLangkah: 12,
  /**
   * Peringkat rata-rata di mana komponen peringkat mencapai nol —
   * MULTI_PV + 1, yaitu langkah yang tidak masuk daftar kandidat mana pun.
   * Peringkat 1 = skor 100, linear turun sampai nol di sini.
   */
  peringkatJenuh: MULTI_PV + 1,
  /** Batas bawah level "sedang" dan "tinggi" pada skor 0–100. */
  sedang: 35,
  tinggi: 70,
  /** Kemiringan tren (poin skor per partai) untuk menyebut arah naik/turun. */
  tren: 1.5,
});

/**
 * Bobot komponen skor gabungan; dinormalkan ulang bila ada metrik null.
 *
 * `peringkat` (rata-rata peringkat MultiPV) diberi bobot besar karena paling
 * sulit dipalsukan secara alami: pemain jujur yang kuat bisa mencocokkan
 * top-1 pada posisi mudah, tapi mempertahankan peringkat rata-rata mendekati
 * 1 pada ratusan posisi beragam hampir mustahil tanpa bantuan engine.
 */
export const BOBOT = Object.freeze({ kecocokan: 0.3, peringkat: 0.25, acpl: 0.25, waktu: 0.2 });

/** Agregat dianggap andal bila setidaknya sebanyak ini partai/langkah. */
export const MIN_PARTAI_AGGREGAT = 3;
export const MIN_LANGKAH_AGGREGAT = 60;

/* --------------------------------------------------------------- utilitas */

function batasi01(angka) {
  if (!Number.isFinite(angka)) return 0;
  return Math.min(1, Math.max(0, angka));
}

function rataRata(daftar) {
  if (!daftar.length) return NaN;
  return daftar.reduce((acc, cur) => acc + cur, 0) / daftar.length;
}

function bulat1(angka) {
  return Number.isFinite(angka) ? Math.round(angka * 10) / 10 : null;
}

/**
 * SAN siap dibandingkan. chess.js selalu menghasilkan bentuk yang sama untuk
 * langkah pemain (`history({verbose:true})`) dan untuk usulan engine
 * (`moveToSan`), jadi penormaan ini hanya jaring pengaman untuk tanda
 * tambahan (`+`, `#`, `!`, `?`) dan ejaan rokade `0-0`.
 */
export function normalkanSan(san) {
  return String(san ?? "")
    .trim()
    .replace(/[+#!?]+$/g, "")
    .replace(/^0-0(-0)?$/, (m) => (m.length > 3 ? "O-O-O" : "O-O"));
}

/**
 * `staticEval` mentah UCI → centipawn dari sudut pihak yang bergilir.
 * `null` bila datanya tidak ada/rusak (mis. `["mate"]` pada posisi skakmat —
 * tidak punya makna centipawn dan memang harus dilewati).
 */
export function nilaiCentipawn(staticEval) {
  if (!Array.isArray(staticEval) || staticEval.length < 2) return null;
  const angka = Number(staticEval[1]);
  if (!Number.isFinite(angka)) return null;
  return staticEval[0] === "mate" ? Math.sign(angka) * CP_MATE : angka;
}

/**
 * Kerugian langkah dalam centipawn, dari sudut pemain yang bergerak.
 *
 * Penurunan (cp = `nilaiCentipawn`, yaitu nilai UCI mentah dari sudut pihak
 * yang bergilir):
 *   sebelum langkah → yang bergilir PEMAIN, jadi cp(prev[1]) sudah terbaca
 *   dari sudut pemain dan dipakai apa adanya;
 *   sesudah langkah → yang bergilir LAWAN, jadi cp(prev[0]) harus dibalik
 *   tandanya untuk dibaca dari sudut pemain.
 *   rugi = eval(sudut pemain, sebelum) - eval(sudut pemain, sesudah)
 *        = cp(prev[1]) - (-cp(prev[0]))
 *        = cp(prev[1]) + cp(prev[0])
 * Rumusnya identik untuk Putih dan Hitam karena yang menentukan tanda adalah
 * siapa yang bergilir, bukan warna pemainnya. Hasil negatif (langkah yang
 * justru menaikkan eval karena lawan sebelumnya blunder) dianggap 0, dan nilai
 * di atas `BATAS_KERUGIAN` dipotong.
 */
export function kerugianCentipawn(move) {
  const riwayat = move?.previousStaticEvals;
  const sebelum = nilaiCentipawn(riwayat?.[1]);
  const sesudah = nilaiCentipawn(riwayat?.[0]);
  if (sebelum === null || sesudah === null) return null;
  return Math.min(Math.max(sebelum + sesudah, 0), BATAS_KERUGIAN);
}

/* --------------------------------------------- kandidat MultiPV (gen-2) */

/** Skor centipawn satu entri kandidat `{cp, mate}` (sudut pihak yang bergilir). */
export function cpKandidat(entri) {
  if (!entri) return null;
  if (entri.mate !== null && entri.mate !== undefined) return Math.sign(entri.mate) * CP_MATE;
  return Number.isFinite(entri.cp) ? entri.cp : null;
}

/**
 * Peringkat langkah `uci` (string UCI) di antara `kandidat` MultiPV posisi
 * sebelumnya — 1-based, mengikuti `entri.peringkat` dari engine.
 *
 * Langkah yang TIDAK masuk daftar kandidat dikembalikan sebagai
 * `MULTI_PV + 1` (paling buruk yang bisa dikatakan data): bukan `null`,
 * karena "di luar top-5" itu sendiri informasi. `null` hanya bila data
 * kandidat memang tidak ada (analisis tanpa MultiPV / cache lama).
 */
export function peringkatLangkahDalam(uci, kandidat) {
  if (!uci || !Array.isArray(kandidat) || !kandidat.length) return null;
  const indeks = kandidat.findIndex((k) => k?.uci === uci);
  if (indeks >= 0) return kandidat[indeks]?.peringkat ?? indeks + 1;
  return MULTI_PV + 1;
}

/**
 * Kehilangan centipawn langkah `uci` terhadap kandidat TERBAIK pada
 * pencarian yang sama — lebih konsisten daripada ACPL antarposisi karena
 * kedua eval berasal dari satu iterasi pencarian (hash/depth identik).
 * `null` bila langkah tidak ada di kandidat atau skornya tidak terbaca.
 */
export function kerugianKandidatCp(uci, kandidat) {
  if (!uci || !Array.isArray(kandidat) || kandidat.length < 2) return null;
  const terbaik = cpKandidat(kandidat[0]);
  const entri = kandidat.find((k) => k?.uci === uci);
  const dipilih = cpKandidat(entri);
  if (terbaik === null || dipilih === null) return null;
  return Math.min(Math.max(terbaik - dipilih, 0), BATAS_KERUGIAN);
}

/**
 * Kehilangan peluang menang (permille WDL) langkah `uci` terhadap kandidat
 * terbaik — versi "probabilistik" dari `kerugianKandidatCp`; WDL lebih stabil
 * lintas jenis posisi daripada centipawn mentah. Hanya laporan, tidak masuk
 * skor. `null` bila WDL tidak tersedia (engine tanpa UCI_ShowWDL).
 */
export function kehilanganMenangPermille(uci, kandidat) {
  if (!uci || !Array.isArray(kandidat) || kandidat.length < 2) return null;
  const wdlTerbaik = kandidat[0]?.wdl;
  const entri = kandidat.find((k) => k?.uci === uci);
  const wdlDipilih = entri?.wdl;
  if (!Array.isArray(wdlTerbaik) || !Array.isArray(wdlDipilih)) return null;
  const selisih = (wdlTerbaik[0] ?? 0) - (wdlDipilih[0] ?? 0);
  return Number.isFinite(selisih) ? Math.max(0, selisih) : null;
}

/**
 * Warna pemain yang MELAKUKAN langkah pada `moves[indeks]`.
 *
 * `move.color` adalah pihak yang bergilir SESUDAH langkah dimainkan, jadi
 * pemainnya adalah kebalikannya. Entri `moves[0]` adalah posisi awal (tanpa
 * `san`) dan dikembalikan `null`. Bila `color` hilang, urutan indeks dipakai
 * sebagai cadangan: `moves[1]` selalu langkah Putih pertama.
 */
export function pemainLangkah(move, indeks) {
  if (!move || indeks <= 0) return null;
  if (move.color === "w" || move.color === "b") return invertColor(move.color);
  return indeks % 2 === 1 ? "w" : "b";
}

/**
 * Waktu pikir (detik) untuk langkah pada `moves[indeks]`, dibaca dari
 * `move.clock` ({ white, black }) yang ditempel `parsePGN`.
 * `null` bila jam tidak tersedia (`clock` null) atau selisihnya negatif —
 * selisih negatif terjadi bila increment lebih besar dari waktu pikir (umum
 * di bullet dengan premove) atau jam melompat karena data PGN tidak lengkap.
 */
export function waktuBerpikir(moves, indeks, warna) {
  const kunci = warna === "w" ? "white" : "black";
  const sesudah = moves[indeks]?.clock?.[kunci];
  const sebelum = indeks > 0 ? moves[indeks - 1]?.clock?.[kunci] : null;
  if (!Number.isFinite(sebelum) || !Number.isFinite(sesudah)) return null;
  const selisih = sebelum - sesudah;
  return selisih < 0 ? null : selisih;
}

/**
 * Statistik jam: rata-rata, deviasi baku, koefisien variasi, dan
 * `konsistensi` 0–1 (1 = waktu pikir nyaris seragam setiap langkah, pola yang
 * khas pemakaian engine; 0 = sangat bervariasi, pola khas manusia).
 * `null` bila sampelnya terlalu sedikit untuk disimpulkan.
 */
export function statistikWaktu(daftar) {
  const sampel = (Array.isArray(daftar) ? daftar : []).filter((n) => Number.isFinite(n) && n >= 0);
  if (sampel.length < SAMPEL_WAKTU_MINIMUM) return null;
  const rata = rataRata(sampel);
  if (!(rata > 0)) {
    return { jumlahSampel: sampel.length, rataRata: 0, deviasiBaku: 0, koefisienVariasi: 0, konsistensi: 1 };
  }
  const varian = rataRata(sampel.map((n) => (n - rata) ** 2));
  const deviasiBaku = Math.sqrt(Math.max(0, varian));
  const koefisienVariasi = deviasiBaku / rata;
  return {
    jumlahSampel: sampel.length,
    rataRata: rata,
    deviasiBaku,
    koefisienVariasi,
    konsistensi: batasi01(1 - koefisienVariasi / AMBANG.variasiWaktuAcuan),
  };
}

/* ------------------------------------------------------------- skor 0-100 */

/** Skor komponen 0–100 untuk tingkat kecocokan langkah dengan engine. */
export function komponenKecocokan(engineMatchRate) {
  if (!Number.isFinite(engineMatchRate)) return null;
  const skala = (engineMatchRate - AMBANG.kecocokanDasar) / (100 - AMBANG.kecocokanDasar);
  return Math.round(batasi01(skala) * 100);
}

/**
 * Skor komponen 0–100 untuk peringkat rata-rata MultiPV: 1 → 100 (selalu
 * memilih langkah terbaik engine), linear turun sampai 0 pada
 * `AMBANG.peringkatJenuh` (= MULTI_PV + 1, rata-rata di luar daftar).
 */
export function komponenPeringkat(rataPeringkat) {
  if (!Number.isFinite(rataPeringkat)) return null;
  const skala = (AMBANG.peringkatJenuh - rataPeringkat) / (AMBANG.peringkatJenuh - 1);
  return Math.round(batasi01(skala) * 100);
}

/** Skor komponen 0–100 untuk ACPL (makin kecil makin mencurigakan). */
export function komponenAcpl(acpl) {
  if (!Number.isFinite(acpl)) return null;
  return Math.round(batasi01((AMBANG.acplAcuan - acpl) / AMBANG.acplAcuan) * 100);
}

/** Skor komponen 0–100 untuk konsistensi waktu pikir. */
export function komponenWaktu(konsistensiWaktu) {
  if (!Number.isFinite(konsistensiWaktu)) return null;
  return Math.round(batasi01(konsistensiWaktu) * 100);
}

/** Skor 0–100 → "rendah" | "sedang" | "tinggi" (null bila skor tidak ada). */
export function tingkatDariSkor(skor) {
  if (!Number.isFinite(skor)) return null;
  if (skor >= AMBANG.tinggi) return LEVEL_TINGGI;
  if (skor >= AMBANG.sedang) return LEVEL_SEDANG;
  return LEVEL_RENDAH;
}

/**
 * Gabungkan metrik menjadi satu skor 0–100.
 *
 * Metrik yang tidak tersedia (`null`) dikeluarkan dari rata-rata berbobot dan
 * bobot sisanya dinormalkan ulang — partai tanpa data jam tetap dinilai, hanya
 * bertumpu pada kecocokan langkah + ACPL. Jumlah langkah yang dinilai
 * menyusutkan skor (`n / (n + 12)`): sepuluh langkah sempurna jauh lebih lemah
 * buktinya daripada delapan puluh langkah sempurna.
 */
export function skorKecurigaan({ engineMatchRate, acpl, konsistensiWaktu, rataPeringkat, jumlahLangkah }) {
  const komponen = {
    kecocokan: komponenKecocokan(engineMatchRate),
    peringkat: komponenPeringkat(rataPeringkat),
    acpl: komponenAcpl(acpl),
    waktu: komponenWaktu(konsistensiWaktu),
  };

  let bobotTerpakai = 0;
  let jumlahBerbobot = 0;
  for (const kunci of Object.keys(BOBOT)) {
    const nilai = komponen[kunci];
    if (nilai === null) continue;
    bobotTerpakai += BOBOT[kunci];
    jumlahBerbobot += BOBOT[kunci] * nilai;
  }
  if (!bobotTerpakai) return { skor: null, level: null, komponen };

  const gabungan = jumlahBerbobot / bobotTerpakai;
  const langkah = Number.isFinite(jumlahLangkah) ? Math.max(0, jumlahLangkah) : 0;
  const faktorSampel = langkah / (langkah + AMBANG.penyusutanLangkah);
  const skor = Math.round(gabungan * faktorSampel);

  return { skor, level: tingkatDariSkor(skor), komponen };
}

/* ------------------------------------------------------- tingkat per partai */

function kumpulBaru() {
  return {
    langkahDinilai: 0,
    langkahCocok: 0,
    langkahAcpl: 0,
    totalKerugian: 0,
    detik: [],
    // Metrik generasi 2 (kandidat MultiPV) — semua nol bila data tidak ada.
    kandidatSampel: 0,
    langkahTop3: 0,
    langkahTop5: 0,
    peringkatJumlah: 0,
    kerugianKandidatJumlah: 0,
    kerugianKandidatSampel: 0,
    menangHilangJumlah: 0,
    menangHilangSampel: 0,
  };
}

function catat(target, { cocok = null, kerugian = null, detik = null, peringkat = null, kerugianKandidat = null, kehilanganMenang = null }) {
  if (cocok !== null) {
    target.langkahDinilai++;
    if (cocok) target.langkahCocok++;
  }
  if (kerugian !== null) {
    target.langkahAcpl++;
    target.totalKerugian += kerugian;
  }
  if (detik !== null) target.detik.push(detik);
  if (peringkat !== null) {
    target.kandidatSampel++;
    target.peringkatJumlah += peringkat;
    if (peringkat <= 3) target.langkahTop3++;
    if (peringkat <= 5) target.langkahTop5++;
  }
  if (kerugianKandidat !== null) {
    target.kerugianKandidatSampel++;
    target.kerugianKandidatJumlah += kerugianKandidat;
  }
  if (kehilanganMenang !== null) {
    target.menangHilangSampel++;
    target.menangHilangJumlah += kehilanganMenang;
  }
}

function rampingkan(kumpul, { denganSkor = true } = {}) {
  const engineMatchRate = kumpul.langkahDinilai ? (kumpul.langkahCocok / kumpul.langkahDinilai) * 100 : null;
  const acpl = kumpul.langkahAcpl ? kumpul.totalKerugian / kumpul.langkahAcpl : null;
  const rataPeringkat = kumpul.kandidatSampel ? kumpul.peringkatJumlah / kumpul.kandidatSampel : null;
  const acplKandidat = kumpul.kerugianKandidatSampel ? kumpul.kerugianKandidatJumlah / kumpul.kerugianKandidatSampel : null;
  const rataKehilanganMenang = kumpul.menangHilangSampel ? kumpul.menangHilangJumlah / kumpul.menangHilangSampel : null;
  const ringkas = {
    langkahDinilai: kumpul.langkahDinilai,
    langkahCocok: kumpul.langkahCocok,
    engineMatchRate: bulat1(engineMatchRate),
    langkahAcpl: kumpul.langkahAcpl,
    // Jumlah mentah ikut dibawa supaya agregat lintas partai bisa menjumlah
    // ulang secara eksak, bukan merata-ratakan angka yang sudah dibulatkan.
    totalKerugian: kumpul.totalKerugian,
    acpl: bulat1(acpl),
    // Metrik kandidat MultiPV — jumlah mentah + nilai siap tampil.
    kandidatSampel: kumpul.kandidatSampel,
    langkahTop3: kumpul.langkahTop3,
    langkahTop5: kumpul.langkahTop5,
    peringkatJumlah: kumpul.peringkatJumlah,
    kecocokanTop3: kumpul.kandidatSampel ? bulat1((kumpul.langkahTop3 / kumpul.kandidatSampel) * 100) : null,
    kecocokanTop5: kumpul.kandidatSampel ? bulat1((kumpul.langkahTop5 / kumpul.kandidatSampel) * 100) : null,
    rataPeringkat: bulat1(rataPeringkat),
    kerugianKandidatJumlah: kumpul.kerugianKandidatJumlah,
    kerugianKandidatSampel: kumpul.kerugianKandidatSampel,
    acplKandidat: bulat1(acplKandidat),
    menangHilangJumlah: kumpul.menangHilangJumlah,
    menangHilangSampel: kumpul.menangHilangSampel,
    rataKehilanganMenang: bulat1(rataKehilanganMenang),
  };
  if (!denganSkor) return ringkas;

  const waktu = statistikWaktu(kumpul.detik);
  const { skor, level, komponen } = skorKecurigaan({
    engineMatchRate,
    acpl,
    rataPeringkat,
    konsistensiWaktu: waktu?.konsistensi ?? null,
    jumlahLangkah: kumpul.langkahDinilai,
  });
  return {
    ...ringkas,
    // `engineMatchRate`/`acpl` pada keluaran publik sudah dibulatkan 1 desimal;
    // skor dihitung dari nilai mentah agar pembulatan tidak menggeser level.
    konsistensiWaktu: waktu ? Math.round(waktu.konsistensi * 100) / 100 : null,
    rincianWaktu: waktu,
    komponen,
    skor,
    level,
  };
}

function ringkasPerFase(akumFase) {
  const hasil = {};
  for (const fase of DAFTAR_FASE) hasil[fase] = rampingkan(akumFase[fase], { denganSkor: false });
  return hasil;
}

/**
 * Skor kecurigaan satu partai.
 *
 * @param {object[]} moves array `moves` hasil `parsePGN()` — `moves[0]` adalah
 *   posisi awal (tanpa `san`), sisanya satu entri per langkah dengan
 *   `san`, `color`, `moveRating`, `bestMoveSan`, `previousStaticEvals`,
 *   `fen`, dan `clock`.
 * @returns {{ w: object, b: object, jumlahLangkah: number }} metrik per warna:
 *   `engineMatchRate`, `acpl`, `konsistensiWaktu` (+ `rincianWaktu`),
 *   `perFase`, `komponen`, `skor` (0–100), dan `level`.
 */
export function hitungSkorKecurigaan(moves) {
  const daftar = Array.isArray(moves) ? moves : [];
  const akum = { w: kumpulBaru(), b: kumpulBaru() };
  const akumFase = {};
  for (const fase of DAFTAR_FASE) akumFase[fase] = { w: kumpulBaru(), b: kumpulBaru() };

  let fase = FASE_PEMBUKAAN;
  let jumlahLangkah = 0;

  for (let i = 0; i < daftar.length; i++) {
    const move = daftar[i];
    if (!move) continue;

    const warna = pemainLangkah(move, i);
    // Langkah paksa (satu-satunya langkah legal) dan langkah buku dikeluarkan:
    // keduanya tidak mengatakan apa pun tentang keputusan pemain.
    const layakDinilai =
      warna !== null && Boolean(move.san) && move.moveRating !== "forced" && move.moveRating !== "book";

    if (layakDinilai) {
      /*
       * Usulan engine untuk langkah INI tersimpan pada entri SEBELUMNYA:
       * `moves[i].bestMoveSan` dihitung dari `moves[i].fen` (posisi SESUDAH
       * langkah dimainkan) sehingga milik pemain berikutnya. Membandingkan
       * `san` dengan `bestMoveSan` pada entri yang sama berarti mengadu
       * langkah Putih dengan saran untuk Hitam. Sama pula untuk `kandidat`:
       * peringkat langkah `daftar[i].uci` diukur terhadap
       * `daftar[i - 1].kandidat` (kandidat posisi yang dihadapi pemain).
       */
      const saran = daftar[i - 1]?.bestMoveSan;
      const cocok = saran ? normalkanSan(move.san) === normalkanSan(saran) : null;
      const kerugian = kerugianCentipawn(move);
      const detik = waktuBerpikir(daftar, i, warna);
      const peringkat = peringkatLangkahDalam(move.uci, daftar[i - 1]?.kandidat);
      const kerugianKandidat = kerugianKandidatCp(move.uci, daftar[i - 1]?.kandidat);
      const kehilanganMenang = kehilanganMenangPermille(move.uci, daftar[i - 1]?.kandidat);
      catat(akum[warna], { cocok, kerugian, detik, peringkat, kerugianKandidat, kehilanganMenang });
      catat(akumFase[fase][warna], { cocok, kerugian, detik, peringkat, kerugianKandidat, kehilanganMenang });
      jumlahLangkah++;
    }

    /*
     * Fase dimajukan pada SETIAP langkah yang FEN-nya terbaca, termasuk
     * langkah paksa/buku. Panel Akurasi melewati langkah tanpa rating;
     * perbedaannya paling banyak beberapa ply dan hanya muncul bila ada
     * langkah paksa tepat di batas fase.
     */
    fase = faseBerikutnya(fase, papanDariFen(move.fen));
  }

  return {
    w: { warna: "w", ...rampingkan(akum.w), perFase: ringkasPerFase({ opening: akumFase.opening.w, middlegame: akumFase.middlegame.w, endgame: akumFase.endgame.w }) },
    b: { warna: "b", ...rampingkan(akum.b), perFase: ringkasPerFase({ opening: akumFase.opening.b, middlegame: akumFase.middlegame.b, endgame: akumFase.endgame.b }) },
    jumlahLangkah,
  };
}

/* ------------------------------------------------ agregat riwayat pemain */

/** Warna `username` pada satu partai, dari metadata `parsePGN`. */
export function warnaPemainDariMetadata(metadata, username) {
  const nama = String(username ?? "").trim().toLowerCase();
  const pemain = metadata?.players;
  if (!nama || !Array.isArray(pemain)) return null;
  if (String(pemain[0]?.name ?? "").trim().toLowerCase() === nama) return "w";
  if (String(pemain[1]?.name ?? "").trim().toLowerCase() === nama) return "b";
  return null;
}

function namaLawan(metadata, warna) {
  const pemain = metadata?.players;
  if (!Array.isArray(pemain)) return "";
  return String((warna === "w" ? pemain[1] : pemain[0])?.name ?? "");
}

/**
 * Cadangan terakhir bila pemanggil tidak memberi `warna` dan metadata tidak
 * memuat `username`: warna pemain yang melakukan langkah pertama, yaitu Putih.
 * Hanya relevan untuk pemanggilan tanpa nama akun (mis. uji); alur Dashboard
 * selalu punya `metadata.players`.
 */
function warnaDariMoves(moves) {
  return Array.isArray(moves) ? pemainLangkah(moves[1], 1) : null;
}

/** Satu partai → baris agregat. `null` bila partainya tidak bisa dipakai. */
function barisPartai(item, username) {
  if (!item) return null;
  const hasil = item.hasil ?? (Array.isArray(item.moves) ? hitungSkorKecurigaan(item.moves) : null);
  if (!hasil) return null;
  const warna =
    item.warna === "w" || item.warna === "b"
      ? item.warna
      : warnaPemainDariMetadata(item.metadata, username) ?? warnaDariMoves(item.moves);
  if (warna !== "w" && warna !== "b") return null;
  const ringkas = hasil[warna];
  if (!ringkas || !ringkas.langkahDinilai) return null;

  return {
    id: item.id ? String(item.id) : "",
    timestamp: Number(item.timestamp) || 0,
    warna,
    lawan: item.lawan ?? namaLawan(item.metadata, warna),
    timeClass: item.timeClass ? String(item.timeClass) : "",
    langkahDinilai: ringkas.langkahDinilai,
    langkahCocok: ringkas.langkahCocok,
    engineMatchRate: ringkas.engineMatchRate,
    langkahAcpl: ringkas.langkahAcpl,
    totalKerugian: ringkas.totalKerugian,
    acpl: ringkas.acpl,
    // Metrik kandidat MultiPV (jumlah mentah untuk penjumlahan ulang).
    kandidatSampel: ringkas.kandidatSampel ?? 0,
    langkahTop3: ringkas.langkahTop3 ?? 0,
    langkahTop5: ringkas.langkahTop5 ?? 0,
    peringkatJumlah: ringkas.peringkatJumlah ?? 0,
    kerugianKandidatJumlah: ringkas.kerugianKandidatJumlah ?? 0,
    kerugianKandidatSampel: ringkas.kerugianKandidatSampel ?? 0,
    menangHilangJumlah: ringkas.menangHilangJumlah ?? 0,
    menangHilangSampel: ringkas.menangHilangSampel ?? 0,
    konsistensiWaktu: ringkas.konsistensiWaktu,
    rincianWaktu: ringkas.rincianWaktu ?? null,
    perFase: ringkas.perFase ?? null,
    skor: ringkas.skor,
    level: ringkas.level,
  };
}

/** Kemiringan garis regresi paling sederhana: poin skor per partai. */
export function kemiringanTren(daftarSkor) {
  const nilai = daftarSkor.map((s) => (Number.isFinite(s) ? s : 0));
  const n = nilai.length;
  if (n < MIN_PARTAI_AGGREGAT) return null;
  const rataX = (n - 1) / 2;
  const rataY = rataRata(nilai);
  let pembilang = 0;
  let penyebut = 0;
  for (let i = 0; i < n; i++) {
    pembilang += (i - rataX) * (nilai[i] - rataY);
    penyebut += (i - rataX) ** 2;
  }
  return penyebut ? pembilang / penyebut : null;
}

function arahTren(kemiringan) {
  if (!Number.isFinite(kemiringan)) return null;
  if (kemiringan >= AMBANG.tren) return "naik";
  if (kemiringan <= -AMBANG.tren) return "turun";
  return "stabil";
}

function hasilKosong(username) {
  return {
    username: String(username ?? ""),
    jumlahPartai: 0,
    jumlahLangkah: 0,
    andal: false,
    engineMatchRate: null,
    acpl: null,
    kandidatSampel: 0,
    kecocokanTop3: null,
    kecocokanTop5: null,
    rataPeringkat: null,
    acplKandidat: null,
    rataKehilanganMenang: null,
    konsistensiWaktu: null,
    rincianWaktu: null,
    komponen: { kecocokan: null, peringkat: null, acpl: null, waktu: null },
    skor: null,
    level: null,
    perFase: Object.fromEntries(
      DAFTAR_FASE.map((f) => [
        f,
        {
          langkahDinilai: 0,
          langkahCocok: 0,
          engineMatchRate: null,
          langkahAcpl: 0,
          totalKerugian: 0,
          acpl: null,
          kandidatSampel: 0,
          kecocokanTop3: null,
          kecocokanTop5: null,
          rataPeringkat: null,
          acplKandidat: null,
        },
      ])
    ),
    tren: null,
    partai: [],
  };
}

/**
 * Gabungkan hasil per partai menjadi satu gambaran per pemain.
 *
 * Rata-rata engine-match dan ACPL DIBERATI jumlah langkah yang dinilai, jadi
 * partai panjang tidak tenggelam oleh partai 8 langkah. Konsistensi waktu
 * diberati jumlah sampel jam. Skor agregat memakai rumus yang sama dengan
 * skor per partai sehingga kedua tingkat bisa dibandingkan langsung.
 *
 * @param {object[]} daftarHasilPartai tiap entri minimal
 *   `{ id, timestamp, warna, hasil }` (hasil = keluaran
 *   `hitungSkorKecurigaan`) ATAU `{ id, timestamp, moves, metadata }` — bila
 *   `hasil` tidak ada tetapi `moves` ada, skor partai dihitung di sini.
 * @param {string} username dipakai untuk menentukan warna bila `warna` tidak
 *   diberikan (dicocokkan dengan `metadata.players`).
 */
export function agregatSkorPemain(daftarHasilPartai, username = "") {
  const partai = (Array.isArray(daftarHasilPartai) ? daftarHasilPartai : [])
    .map((item) => barisPartai(item, username))
    .filter(Boolean)
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  if (!partai.length) return hasilKosong(username);

  /*
   * Metrik kepala dijumlah ulang dari hitungan mentah (langkah cocok /
   * langkah dinilai, total kerugian / langkah ber-ACPL). Hasilnya identik
   * dengan rata-rata berbobot jumlah langkah — partai 8 langkah tidak bisa
   * menenggelamkan partai 80 langkah — tetapi tanpa galat pembulatan.
   */
  let totalLangkahDinilai = 0;
  let totalLangkahCocok = 0;
  let totalLangkahAcpl = 0;
  let totalKerugian = 0;
  let bobotWaktu = 0;
  let jumlahWaktu = 0;
  // Penjumlah ulang metrik kandidat MultiPV dari hitungan mentah.
  let totalKandidatSampel = 0;
  let totalLangkahTop3 = 0;
  let totalLangkahTop5 = 0;
  let totalPeringkatJumlah = 0;
  let totalKerugianKandidat = 0;
  let totalKerugianKandidatSampel = 0;
  let totalMenangHilang = 0;
  let totalMenangHilangSampel = 0;
  const akumFase = {};
  for (const f of DAFTAR_FASE)
    akumFase[f] = {
      langkahDinilai: 0,
      langkahCocok: 0,
      langkahAcpl: 0,
      totalKerugian: 0,
      kandidatSampel: 0,
      langkahTop3: 0,
      langkahTop5: 0,
      peringkatJumlah: 0,
      kerugianKandidatJumlah: 0,
      kerugianKandidatSampel: 0,
    };

  for (const baris of partai) {
    totalLangkahDinilai += baris.langkahDinilai || 0;
    totalLangkahCocok += baris.langkahCocok || 0;
    totalLangkahAcpl += baris.langkahAcpl || 0;
    totalKerugian += Number.isFinite(baris.totalKerugian) ? baris.totalKerugian : 0;
    totalKandidatSampel += baris.kandidatSampel || 0;
    totalLangkahTop3 += baris.langkahTop3 || 0;
    totalLangkahTop5 += baris.langkahTop5 || 0;
    totalPeringkatJumlah += baris.peringkatJumlah || 0;
    totalKerugianKandidat += baris.kerugianKandidatJumlah || 0;
    totalKerugianKandidatSampel += baris.kerugianKandidatSampel || 0;
    totalMenangHilang += baris.menangHilangJumlah || 0;
    totalMenangHilangSampel += baris.menangHilangSampel || 0;
    const sampelWaktu = baris.rincianWaktu?.jumlahSampel ?? 0;
    if (Number.isFinite(baris.konsistensiWaktu) && sampelWaktu) {
      jumlahWaktu += sampelWaktu * baris.konsistensiWaktu;
      bobotWaktu += sampelWaktu;
    }
    for (const f of DAFTAR_FASE) {
      const faseBaris = baris.perFase?.[f];
      if (!faseBaris) continue;
      const a = akumFase[f];
      a.langkahDinilai += faseBaris.langkahDinilai || 0;
      a.langkahCocok += faseBaris.langkahCocok || 0;
      a.langkahAcpl += faseBaris.langkahAcpl || 0;
      a.totalKerugian += faseBaris.totalKerugian || 0;
      a.kandidatSampel += faseBaris.kandidatSampel || 0;
      a.langkahTop3 += faseBaris.langkahTop3 || 0;
      a.langkahTop5 += faseBaris.langkahTop5 || 0;
      a.peringkatJumlah += faseBaris.peringkatJumlah || 0;
      a.kerugianKandidatJumlah += faseBaris.kerugianKandidatJumlah || 0;
      a.kerugianKandidatSampel += faseBaris.kerugianKandidatSampel || 0;
    }
  }

  const engineMatchRate = totalLangkahDinilai ? (totalLangkahCocok / totalLangkahDinilai) * 100 : null;
  const acpl = totalLangkahAcpl ? totalKerugian / totalLangkahAcpl : null;
  const rataPeringkat = totalKandidatSampel ? totalPeringkatJumlah / totalKandidatSampel : null;
  const konsistensiWaktu = bobotWaktu ? jumlahWaktu / bobotWaktu : null;

  const perFase = {};
  for (const f of DAFTAR_FASE) {
    const a = akumFase[f];
    perFase[f] = {
      langkahDinilai: a.langkahDinilai,
      langkahCocok: a.langkahCocok,
      engineMatchRate: a.langkahDinilai ? bulat1((a.langkahCocok / a.langkahDinilai) * 100) : null,
      langkahAcpl: a.langkahAcpl,
      totalKerugian: a.totalKerugian,
      acpl: a.langkahAcpl ? bulat1(a.totalKerugian / a.langkahAcpl) : null,
      kandidatSampel: a.kandidatSampel,
      kecocokanTop3: a.kandidatSampel ? bulat1((a.langkahTop3 / a.kandidatSampel) * 100) : null,
      kecocokanTop5: a.kandidatSampel ? bulat1((a.langkahTop5 / a.kandidatSampel) * 100) : null,
      rataPeringkat: a.kandidatSampel ? bulat1(a.peringkatJumlah / a.kandidatSampel) : null,
      acplKandidat: a.kerugianKandidatSampel ? bulat1(a.kerugianKandidatJumlah / a.kerugianKandidatSampel) : null,
    };
  }

  const { skor, level, komponen } = skorKecurigaan({
    engineMatchRate,
    acpl,
    rataPeringkat,
    konsistensiWaktu,
    jumlahLangkah: totalLangkahDinilai,
  });

  const tren = {
    // Poin ringan untuk grafik; rincian per partai ada di `partai`.
    poin: partai.map((b) => ({ id: b.id, timestamp: b.timestamp, warna: b.warna, lawan: b.lawan, skor: b.skor, level: b.level })),
    kemiringan: kemiringanTren(partai.map((b) => b.skor)),
    arah: null,
  };
  tren.arah = arahTren(tren.kemiringan);

  return {
    username: String(username ?? ""),
    jumlahPartai: partai.length,
    jumlahLangkah: totalLangkahDinilai,
    andal: partai.length >= MIN_PARTAI_AGGREGAT && totalLangkahDinilai >= MIN_LANGKAH_AGGREGAT,
    engineMatchRate: bulat1(engineMatchRate),
    acpl: bulat1(acpl),
    // Metrik kandidat MultiPV pada tingkat agregat.
    kandidatSampel: totalKandidatSampel,
    kecocokanTop3: totalKandidatSampel ? bulat1((totalLangkahTop3 / totalKandidatSampel) * 100) : null,
    kecocokanTop5: totalKandidatSampel ? bulat1((totalLangkahTop5 / totalKandidatSampel) * 100) : null,
    rataPeringkat: bulat1(rataPeringkat),
    acplKandidat: totalKerugianKandidatSampel ? bulat1(totalKerugianKandidat / totalKerugianKandidatSampel) : null,
    rataKehilanganMenang: totalMenangHilangSampel ? bulat1(totalMenangHilang / totalMenangHilangSampel) : null,
    konsistensiWaktu: Number.isFinite(konsistensiWaktu) ? Math.round(konsistensiWaktu * 100) / 100 : null,
    rincianWaktu: { jumlahSampel: bobotWaktu },
    komponen,
    skor,
    level,
    perFase,
    tren,
    partai,
  };
}
