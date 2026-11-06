/**
 * Anti-cheat — lapisan DASAR: konstanta ambang, utilitas eval, metrik
 * kandidat MultiPV, dan statistik waktu pikiran.
 *
 * Fase 5 memecah `antiCheat.js` (1487 baris) menjadi empat lapisan dengan
 * arah ketergantungan satu jalur:
 *
 *   dasar → kalibrasi → skor → agregat
 *
 * Modul ini tidak boleh mengimpor tiga lainnya — kalau suatu saat perlu,
 * berarti ada bagian yang salah tempat.
 */
import { invertColor } from "../penilaian.js";
import { tandaMate } from "../evaluasi.js";
import { MULTI_PV } from "../engine.js";

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
export const LEVEL_SEMENTARA = "sementara";

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
  /**
   * Ketajaman posisi (selisih cp kandidat #1 vs #3): ≤ angka ini = posisi
   * SULIT (kandidat terbaik berdekatan, keputusan tidak jelas — di sinilah
   * pemakai engine paling terlihat), ≥ kandidatMudah = posisi MUDAH (satu
   * langkah jauh lebih baik). Posisi di antara kedua ambang tidak
   * dimasukkan ke salah satu keranjang.
   */
  kandidatSulit: 20,
  kandidatMudah: 100,
  /** Pasangan (waktu pikir, peringkat) minimum sebelum korelasi dihitung. */
  korelasiSampelMinimum: 12,
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

export function batasi01(angka) {
  if (!Number.isFinite(angka)) return 0;
  return Math.min(1, Math.max(0, angka));
}

export function rataRata(daftar) {
  if (!daftar.length) return NaN;
  return daftar.reduce((acc, cur) => acc + cur, 0) / daftar.length;
}

export function bulat1(angka) {
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
 * `null` bila datanya tidak ada/rusak (mis. bentuk warisan `["mate"]` tanpa
 * angka — tidak punya makna centipawn dan memang harus dilewati).
 * Skakmat yang sudah dikirim (`["mate", "0"]`) = pihak bergilir mati, jadi
 * −`CP_MATE`, BUKAN 0 — `Math.sign` mentah dilarang di sini karena mengubah
 * 0 menjadi 0 (lihat `tandaMate` di ./evaluasi.js).
 */
export function nilaiCentipawn(staticEval) {
  if (!Array.isArray(staticEval) || staticEval.length < 2) return null;
  // Payload absen = tidak ada info (konsisten dengan ["mate"] warisan → null):
  // `Number(null)` adalah 0, jadi tanpa baris ini ["cp",null] menyamar jadi 0.
  const mentah = staticEval[1];
  if (mentah === null || mentah === undefined || mentah === "") return null;
  const angka = Number(mentah);
  if (!Number.isFinite(angka)) return null;
  return staticEval[0] === "mate" ? tandaMate(angka) * CP_MATE : angka;
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
  if (entri.mate !== null && entri.mate !== undefined) {
    // Mate 0 = baris ini sudah mati (−CP_MATE); skor tak-terbaca = `null`,
    // bukan NaN — lihat `tandaMate` di ./evaluasi.js.
    const tanda = tandaMate(entri.mate);
    return tanda === null ? null : tanda * CP_MATE;
  }
  return Number.isFinite(entri.cp) ? entri.cp : null;
}

/**
 * Daftar MultiPV sah bila UCI dan peringkat unik serta peringkatnya kontigu.
 * Urutan array tidak dijadikan asumsi: data harus selalu dipilih berdasarkan
 * `peringkat`, bukan posisi indeks yang kebetulan datang dari engine/cache.
 */
function daftarKandidatValid(kandidat) {
  if (!Array.isArray(kandidat) || !kandidat.length || kandidat.length > MULTI_PV) return false;
  const peringkat = kandidat.map((k) => k?.peringkat);
  const uciValid = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
  return kandidat.every(
    (k) =>
      typeof k?.uci === "string" &&
      uciValid.test(k.uci) &&
      Number.isInteger(k?.peringkat) &&
      k.peringkat >= 1 &&
      k.peringkat <= MULTI_PV
  ) &&
    new Set(kandidat.map((k) => k.uci)).size === kandidat.length &&
    new Set(peringkat).size === kandidat.length &&
    peringkat.every((rank) => rank <= kandidat.length) &&
    Array.from({ length: kandidat.length }, (_, i) => i + 1).every((rank) => peringkat.includes(rank));
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
  if (!uci || !daftarKandidatValid(kandidat)) return null;
  const indeks = kandidat.findIndex((k) => k.uci === uci);
  if (indeks >= 0) return kandidat[indeks].peringkat;
  // Hanya simpulkan "di luar kandidat" bila daftar memang lengkap sampai
  // jumlah MultiPV yang diminta. Daftar parsial tidak cukup untuk memberi
  // peringkat terburuk; misalnya pencarian dibatalkan atau posisi terminal.
  if (kandidat.length < MULTI_PV) return null;
  return MULTI_PV + 1;
}

/**
 * Kehilangan centipawn langkah `uci` terhadap kandidat TERBAIK pada
 * pencarian yang sama — lebih konsisten daripada ACPL antarposisi karena
 * kedua eval berasal dari satu iterasi pencarian (hash/depth identik).
 * `null` bila langkah tidak ada di kandidat atau skornya tidak terbaca.
 */
export function kerugianKandidatCp(uci, kandidat) {
  if (!uci || !daftarKandidatValid(kandidat) || kandidat.length < 2) return null;
  const terbaik = cpKandidat(kandidat.find((k) => k.peringkat === 1));
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
  if (!uci || !daftarKandidatValid(kandidat) || kandidat.length < 2) return null;
  const wdlTerbaik = kandidat.find((k) => k.peringkat === 1)?.wdl;
  const entri = kandidat.find((k) => k?.uci === uci);
  const wdlDipilih = entri?.wdl;
  const wdlValid = (wdl) =>
    Array.isArray(wdl) && wdl.length >= 3 && wdl.every((n) => Number.isFinite(n) && n >= 0);
  if (!wdlValid(wdlTerbaik) || !wdlValid(wdlDipilih)) return null;
  const selisih = wdlTerbaik[0] - wdlDipilih[0];
  return Number.isFinite(selisih) ? Math.max(0, selisih) : null;
}

/**
 * Ketajaman posisi: selisih centipawn antara kandidat #1 dan kandidat #3
 * (atau kandidat terakhir bila kurang dari tiga). Kecil = posisi sulit
 * (beberapa langkah hampir sama baiknya — justru di sini manusia sering
 * "salah" dan pemakai engine tetap sempurna), besar = posisi mudah.
 * `null` bila kandidat tidak bisa dibandingkan.
 */
export function ketajamanKandidat(kandidat) {
  if (!daftarKandidatValid(kandidat) || kandidat.length < 2) return null;
  const terbaik = cpKandidat(kandidat.find((k) => k.peringkat === 1));
  const pembanding = cpKandidat(kandidat.find((k) => k.peringkat === Math.min(3, kandidat.length)));
  if (terbaik === null || pembanding === null) return null;
  return Math.max(0, terbaik - pembanding);
}

/**
 * Korelasi pangkat Spearman antara waktu pikir (detik) dan peringkat
 * kandidat — dari pasangan `{ detik, peringkat }`.
 *
 * Pola MANUSIA: makin lama berpikir makin baik langkahnya → peringkat
 * menurun saat detik naik → korelasi NEGATIF. Pemakai engine: kualitas
 * langkah tidak bergantung waktu (jawaban selalu ada) → korelasi ≈ 0 atau
 * bahkan positif. Peringkat seri memakai peringkat rata-rata; varians nol
 * pada salah satu sisi (semua waktu sama, semua peringkat sama) → `null`
 * karena tidak ada informasi. `null` juga bila sampel < AMBANG minimum.
 */
export function korelasiSpearman(pasangan) {
  const bersih = (Array.isArray(pasangan) ? pasangan : []).filter(
    (p) => Number.isFinite(p?.detik) && Number.isFinite(p?.peringkat)
  );
  if (bersih.length < AMBANG.korelasiSampelMinimum) return null;

  const peringkatKecil = (kunci) => {
    const urut = bersih.map((p, i) => ({ i, v: p[kunci] })).sort((a, b) => a.v - b.v);
    const pangkat = new Array(urut.length);
    let i = 0;
    while (i < urut.length) {
      let j = i;
      while (j + 1 < urut.length && urut[j + 1].v === urut[i].v) j++;
      const rata = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) pangkat[urut[k].i] = rata;
      i = j + 1;
    }
    return pangkat;
  };

  const pangkatDetik = peringkatKecil("detik");
  const pangkatPeringkat = peringkatKecil("peringkat");
  const n = bersih.length;
  const rataDetik = rataRata(pangkatDetik);
  const rataPeringkat = rataRata(pangkatPeringkat);
  let pembilang = 0;
  let kuadratDetik = 0;
  let kuadratPeringkat = 0;
  for (let i = 0; i < n; i++) {
    const a = pangkatDetik[i] - rataDetik;
    const b = pangkatPeringkat[i] - rataPeringkat;
    pembilang += a * b;
    kuadratDetik += a * a;
    kuadratPeringkat += b * b;
  }
  if (!kuadratDetik || !kuadratPeringkat) return null;
  return pembilang / Math.sqrt(kuadratDetik * kuadratPeringkat);
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
 * `null` bila jam tidak tersedia, increment tidak diketahui pada data
 * PGN terstruktur, atau selisih terkoreksi tetap negatif (jam melompat/data
 * tidak lengkap). Increment yang diketahui ditambahkan kembali ke selisih jam.
 */
export function waktuBerpikir(moves, indeks, warna) {
  const kunci = warna === "w" ? "white" : "black";
  const clockKini = moves[indeks]?.clock;
  const clockSebelum = indeks > 0 ? moves[indeks - 1]?.clock : null;
  const sesudah = clockKini?.[kunci];
  const sebelum = clockSebelum?.[kunci];
  if (!Number.isFinite(sebelum) || !Number.isFinite(sesudah)) return null;

  // Parser PGN menandai increment yang tidak diketahui dengan null. Dalam
  // kasus itu selisih jam tidak bisa diterjemahkan aman menjadi waktu pikir:
  // jangan memasukkannya sebagai bukti, terutama bila ada increment/stage.
  const incrementDiketahui = clockKini && Object.hasOwn(clockKini, "incrementSeconds");
  if (incrementDiketahui && (!Number.isFinite(clockKini.incrementSeconds) || clockKini.incrementSeconds < 0)) {
    return null;
  }
  const increment = incrementDiketahui ? clockKini.incrementSeconds : 0;
  const selisih = sebelum - sesudah + increment;
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
  // Semua nilai nol tidak menunjukkan waktu pikir yang seragam secara bermakna:
  // ini bisa berasal dari pembulatan clock/premove atau metadata PGN yang kasar.
  // Jangan mengubah data waktu yang tidak informatif menjadi bukti kecurigaan.
  if (!(rata > 0)) return null;
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
