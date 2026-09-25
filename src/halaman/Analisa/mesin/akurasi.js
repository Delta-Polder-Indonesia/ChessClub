/**
 * Metrik kualitas langkah gaya lichess / en-croissant (win chance, akurasi,
 * centipawn loss, anotasi NAG).
 *
 * Modul ini ADA KARENA angka kita sebelumnya tidak bisa dibandingkan dengan
 * angka yang dilihat orang di lichess / en-croissant:
 *   - akurasi kita (port Brilliant-Chess, `playersAccuracy.jsx`) adalah peta
 *     LABEL → poin tetap (100/90/70/30/20/0) yang dirata-rata biasa;
 *   - lichess/en-croissant menghitung akurasi dari SELISIH PELUANG MENANG
 *     (win chance) dengan kurva eksponensial, lalu merangkumnya dengan
 *     HARMONIC MEAN.
 * Keduanya menghasilkan angka yang berbeda jauh untuk partai yang sama, jadi
 * laporan anti-cheat yang kita terbitkan tidak bisa disandingkan dengan
 * laporan dari platform lain tanpa modul ini.
 *
 * SUMBER ACUAN (dibaca 2026-09-18, branch `master`):
 *   - en-croissant `src/utils/score.ts`
 *       getWinChance, normalizeScore (CP_CEILING = 1000), getAccuracy,
 *       getCPLoss, getAnnotation, INITIAL_SCORE = cp 15;
 *   - en-croissant `src/utils/chess.ts` → `getGameStats()`
 *       CPL  = mean(cplosses)            (rata-rata aritmetik)
 *       akurasi = harmonicMean(accuracies)  ← BUKAN rata-rata biasa
 *   - en-croissant `src/utils/misc.ts` → `harmonicMean(arr) = n / Σ 1/max(1, a)`
 *   - asal rumusnya, lichess:
 *       `scalachess/core/src/main/scala/eval.scala`
 *         Cp.CEILING = 1000, Cp.initial = 15,
 *         winningChances(cp) = 2 / (1 + exp(-0.00368208 * cp)) - 1,
 *         WinPercent = 50 + 50 * winningChances(cp.ceiled),
 *         mate → ceilingWithSignum (±1000);
 *       `lila/modules/analyse/src/main/AccuracyPercent.scala`
 *         103.1668100711649 * exp(-0.04354415386753951 * winDiff) - 3.166924740191411
 *         lalu `raw + 1` ("uncertainty bonus"), dibatasi [0, 100].
 *
 * BEDA HALUS yang perlu diketahui sebelum menyunting:
 *   1. Konstanta. Kita memakai angka en-croissant (103.1668 / -0.04354 /
 *      -3.1669) supaya hasilnya SAMA PERSIS dengan en-croissant, bukan lichess
 *      penuh digit. Selisihnya kecil tapi terlihat di desimal ke-2
 *      (contoh 0 → -500 cp: 19.07 ala en-croissant vs 19.06 ala lichess).
 *      Uji di `scripts/uji-anticheat.mjs` mengunci nilai en-croissant.
 *   2. lichess punya jalan pintas `after >= before → 100`. Di sini tidak
 *      perlu: selisih ≤ 0 membuat hasil ≥ 100 lalu dipotong `batas01pct`,
 *      jadi keluarannya sama.
 *   3. lichess 2025 merangkum akurasi partai sebagai rata-rata dari
 *      (weighted mean berbobot volatilitas) dan (harmonic mean) dengan
 *      jendela geser 2–8 ply. en-croissant hanya memakai harmonic mean.
 *      Kita mengikuti en-croissant (`rataHarmonik`), dan tetap mengekspos
 *      rata-rata aritmetiknya untuk pembanding.
 *   4. `rataHarmonik` mengembalikan `null` untuk daftar kosong, sementara
 *      en-croissant menghasilkan NaN. Ini penyimpangan SENGAJA: UI kita
 *      menampilkan "-" untuk `null`, dan NaN akan lolos sebagai "NaN".
 *
 * Semuanya MURNI: tanpa React, tanpa DOM, tanpa pemanggilan engine. Yang
 * boleh diimpor modul ini hanya konstanta; jangan impor ./antiCheat.js ke
 * sini — arah dependensinya antiCheat → akurasi, bukan sebaliknya.
 *
 * KONVENSI EVAL (sama dengan ./antiCheat.js dan ./penilaian.js):
 * `staticEval` berbentuk mentah UCI — `["cp", "34"]` atau `["mate", "2"]` —
 * relatif terhadap PIHAK YANG BERGILIRAN. Pada satu entri `moves[i]`:
 *   - `previousStaticEvals[1]` = eval SEBELUM langkah, giliran = pemain;
 *   - `previousStaticEvals[0]` = eval SESUDAH langkah, giliran = lawan,
 *     jadi tandanya harus DIBALIK agar terbaca dari sudut pemain.
 * Karena itu kerugian langkah = sebelum + sesudah (bukan dikurang) —
 * penurunan lengkapnya ada di komentar `kerugianCentipawn` ./antiCheat.js.
 */

import { invertColor } from "./penilaian.js";
import { batasiCp, CP_CEILING, FAKTOR_PELUANG, peluangMenang } from "./peluang.js";
import { cpBaku, tandaMate } from "./evaluasi.js";

/*
 * Kurva peluang tinggal di ./peluang.js (satu rumus untuk seluruh halaman:
 * akurasi, anti-cheat, dan ambang klasifikasi di ./penilaian.js). Diekspor
 * ulang di sini supaya pemanggil lama tidak perlu berubah.
 */
export { batasiCp, CP_CEILING, FAKTOR_PELUANG, peluangMenang };
/*
 * `cpBaku` tinggal di ./evaluasi.js (satu definisi untuk semua modul);
 * diekspor ulang agar pemanggil lama — ./langkahKritis.js, ./antiCheat.js —
 * tidak perlu berubah dan identitas fungsinya tetap sama.
 */
export { cpBaku };

/** Eval posisi awal bila tidak dianalisis (`Cp.initial` / `INITIAL_SCORE`). */
export const CP_AWAL = 15;

/** Konstanta kurva akurasi — SALINAN ANGKA en-croissant, lihat kepala modul. */
export const KURVA_AKURASI = Object.freeze({
  a: 103.1668,
  k: -0.04354,
  b: -3.1669,
  /** "uncertainty bonus" lichess; juga penjamin langkah sempurna = 100. */
  bonus: 1,
});

/** Anotasi NAG dasar yang dihitung `anotasiLangkah` (urutan berat → ringan). */
export const DAFTAR_ANOTASI = Object.freeze(["??", "?", "?!", "!!", "!", "!?"]);

/** Ambang selisih win chance (poin persen) → anotasi, dari `getAnnotation`. */
export const AMBANG_ANOTASI = Object.freeze({ blunder: 20, mistake: 10, dubious: 5, great: 10, interesting: 5 });

/* --------------------------------------------------------------- dasar */

function batas01pct(angka) {
  return Math.min(100, Math.max(0, angka));
}

/* `cpBaku` diimpor dari ./evaluasi.js (lihat re-ekspor di atas). */

/**
 * Akurasi satu langkah, 0–100 — `getAccuracy` en-croissant.
 * Kedua argumen HARUS sudah dari sudut pemain yang bergerak.
 */
export function akurasiLangkah(sebelumCp, sesudahCp) {
  if (!Number.isFinite(sebelumCp) || !Number.isFinite(sesudahCp)) return null;
  const selisih = peluangMenang(sebelumCp) - peluangMenang(sesudahCp);
  return batas01pct(KURVA_AKURASI.a * Math.exp(KURVA_AKURASI.k * selisih) + KURVA_AKURASI.b + KURVA_AKURASI.bonus);
}

/**
 * Kehilangan centipawn satu langkah — `getCPLoss` en-croissant.
 * Tanpa batas atas sendiri: kedua cp sudah dipotong ±1000 oleh `cpBaku`,
 * jadi kerugian maksimum yang mungkin adalah 2000 (bukan 1000 seperti
 * `BATAS_KERUGIAN` ./antiCheat.js — itulah salah satu sebab angka ACPL kita
 * lama tidak sama dengan lichess).
 */
export function kerugianLangkah(sebelumCp, sesudahCp) {
  if (!Number.isFinite(sebelumCp) || !Number.isFinite(sesudahCp)) return null;
  return Math.max(0, sebelumCp - sesudahCp);
}

/** Pasangan (sebelum, sesudah) cp baku dari satu entri `parsePGN`. */
export function pasanganCpMove(move) {
  const riwayat = move?.previousStaticEvals;
  const sebelum = cpBaku(riwayat?.[1], false);
  const sesudah = cpBaku(riwayat?.[0], true);
  if (sebelum === null || sesudah === null) return null;
  return { sebelum, sesudah };
}

/** Akurasi (0–100) satu entri `parsePGN`, atau `null` bila eval tidak ada. */
export function akurasiMove(move) {
  const pasangan = pasanganCpMove(move);
  return pasangan ? akurasiLangkah(pasangan.sebelum, pasangan.sesudah) : null;
}

/** Kerugian cp baku satu entri `parsePGN`, atau `null`. */
export function kerugianMove(move) {
  const pasangan = pasanganCpMove(move);
  return pasangan ? kerugianLangkah(pasangan.sebelum, pasangan.sesudah) : null;
}

/* ------------------------------------------------------------ anotasi */

/**
 * Anotasi NAG satu langkah — `getAnnotation` en-croissant.
 *
 * @param {object} arg
 * @param {number} arg.sebelumCp eval sebelum langkah, sudut pemain.
 * @param {number} arg.sesudahCp eval sesudah langkah, sudut pemain.
 * @param {number|null} [arg.duaLangkahLaluCp] eval dua ply sebelumnya
 *   (sudut pemain) — hanya dipakai cabang "!" / "!!".
 * @param {Array} [arg.kandidat] kandidat MultiPV posisi yang dihadapi pemain
 *   (`moves[i - 1].kandidat`); indeks 0 = terbaik, 1 = kedua.
 * @param {string} [arg.uci] langkah yang dimainkan dalam UCI.
 * @param {boolean} [arg.sacrifice] hasil `isSacrifice` untuk langkah ini.
 * @returns {""|"??"|"?"|"?!"|"!!"|"!"|"!?"} "" = langkah tanpa catatan.
 */
export function anotasiLangkah({ sebelumCp, sesudahCp, duaLangkahLaluCp = null, kandidat = [], uci = "", sacrifice = false } = {}) {
  if (!Number.isFinite(sebelumCp) || !Number.isFinite(sesudahCp)) return "";
  const selisih = peluangMenang(sebelumCp) - peluangMenang(sesudahCp);
  if (selisih > AMBANG_ANOTASI.blunder) return "??";
  if (selisih > AMBANG_ANOTASI.mistake) return "?";
  if (selisih > AMBANG_ANOTASI.dubious) return "?!";

  const daftar = Array.isArray(kandidat) ? kandidat : [];
  if (daftar.length > 1) {
    const terbaik = cpBakuDariKandidat(daftar[0]);
    const kedua = cpBakuDariKandidat(daftar[1]);
    const langkahTerbaik = Boolean(uci) && daftar[0]?.uci === uci;
    if (
      terbaik !== null &&
      kedua !== null &&
      peluangMenang(terbaik) - peluangMenang(kedua) > AMBANG_ANOTASI.great &&
      langkahTerbaik
    ) {
      if (sacrifice) return "!!";
      if (Number.isFinite(duaLangkahLaluCp) && peluangMenang(terbaik) - peluangMenang(duaLangkahLaluCp) > AMBANG_ANOTASI.interesting) {
        return "!";
      }
    } else if (sacrifice && sesudahCp > -200) {
      return "!?";
    }
  }
  return "";
}

/** Skor cp baku satu entri kandidat MultiPV (`{cp, mate}` sudut yg bergilir). */
function cpBakuDariKandidat(entri) {
  if (!entri) return null;
  if (entri.mate !== null && entri.mate !== undefined) {
    // Mate 0 = baris ini sudah mati (bukan remis); skor tak-terbaca = null,
    // bukan 0 — lihat `tandaMate` ./evaluasi.js.
    const tanda = tandaMate(entri.mate);
    return tanda === null ? null : batasiCp(CP_CEILING * tanda);
  }
  return Number.isFinite(entri.cp) ? batasiCp(entri.cp) : null;
}

/**
 * Anotasi untuk entri `moves[i]`.
 *
 * @param {object} move entri `parsePGN`.
 * @param {Array} [kandidatSebelumnya] `moves[i - 1].kandidat` — kandidat posisi
 *   yang DIHADAPI pemain, bukan kandidat sesudah langkahnya.
 * @param {number|null} [duaLangkahLaluCp] eval dua ply sebelumnya.
 */
export function anotasiMove(move, kandidatSebelumnya = [], duaLangkahLaluCp = null) {
  const pasangan = pasanganCpMove(move);
  if (!pasangan) return "";
  return anotasiLangkah({
    sebelumCp: pasangan.sebelum,
    sesudahCp: pasangan.sesudah,
    duaLangkahLaluCp,
    kandidat: kandidatSebelumnya,
    uci: move?.uci ?? "",
    sacrifice: Boolean(move?.sacrifice),
  });
}

/** Peta anotasi → 0 untuk semua kunci `DAFTAR_ANOTASI`. */
export function petaAnotasiKosong() {
  return Object.fromEntries(DAFTAR_ANOTASI.map((a) => [a, 0]));
}

/* ---------------------------------------------------------- agregasi */

/**
 * Harmonic mean ala en-croissant: `n / Σ 1/max(1, a)`.
 *
 * `max(1, a)` mencegah satu langkah 0% membuat seluruh partai 0. Sifatnya yang
 * penting untuk kita: harmonic mean jauh lebih kejam terhadap beberapa langkah
 * buruk daripada rata-rata biasa, jadi "98 langkah sempurna + 2 blunder" tidak
 * lagi terlihat seperti partai sempurna.
 *
 * @returns {number|null} `null` untuk daftar kosong (lihat kepala modul).
 */
export function rataHarmonik(daftar) {
  const bersih = (Array.isArray(daftar) ? daftar : []).filter(Number.isFinite);
  if (!bersih.length) return null;
  const jumlah = bersih.reduce((acc, cur) => acc + 1 / Math.max(1, cur), 0);
  return jumlah ? bersih.length / jumlah : null;
}

/** Rata-rata aritmetik biasa; `null` untuk daftar kosong. */
export function rataRataAngka(daftar) {
  const bersih = (Array.isArray(daftar) ? daftar : []).filter(Number.isFinite);
  if (!bersih.length) return null;
  return bersih.reduce((acc, cur) => acc + cur, 0) / bersih.length;
}

/**
 * Rangkum daftar akurasi per langkah menjadi sepasang angka siap simpan:
 * `{ akurasi, akurasiAritmetik }` (keduanya `null` bila tidak ada sampel).
 *
 * Untuk agregasi lintas partai JANGAN panggil ini per partai lalu
 * merata-ratakan hasilnya — harmonic mean tidak bisa dirata-rata. Bawa
 * `jumlahInvers` + `jumlahLangkah` mentah dan panggil
 * `harmonikDariJumlah(jumlahInvers, jumlahLangkah)` di tingkat agregat.
 */
export function ringkasAkurasi(daftarAkurasi) {
  const bersih = (Array.isArray(daftarAkurasi) ? daftarAkurasi : []).filter(Number.isFinite);
  if (!bersih.length) return { akurasi: null, akurasiAritmetik: null };
  return {
    akurasi: rataHarmonik(bersih),
    akurasiAritmetik: rataRataAngka(bersih),
  };
}

/**
 * Harmonic mean dari jumlah mentah — bentuk yang bisa dijumlah antarpartai:
 * `n / Σ 1/max(1, a)` = `jumlahLangkah / jumlahInvers`.
 */
export function harmonikDariJumlah(jumlahInvers, jumlahLangkah) {
  if (!Number.isFinite(jumlahInvers) || !Number.isFinite(jumlahLangkah) || jumlahLangkah <= 0 || jumlahInvers <= 0) {
    return null;
  }
  return jumlahLangkah / jumlahInvers;
}

/** `1 / max(1, akurasi)` — satuan yang dijumlah untuk agregasi harmonik. */
export function inversAkurasi(akurasi) {
  return Number.isFinite(akurasi) ? 1 / Math.max(1, akurasi) : null;
}

/* --------------------------------------------- pemetaan warna pemain */

/**
 * Warna pemain yang MELAKUKAN langkah pada `moves[indeks]` — aturan yang sama
 * dengan `pemainLangkah` di ./antiCheat.js (duplikat kecil yang disengaja
 * supaya modul ini tidak mengimpor balik ./antiCheat.js; dijaga agar tetap
 * sama oleh uji di `scripts/uji-anticheat.mjs`).
 */
export function pemainDariEntri(move, indeks) {
  if (!move || indeks <= 0) return null;
  if (move.color === "w" || move.color === "b") return invertColor(move.color);
  return indeks % 2 === 1 ? "w" : "b";
}
