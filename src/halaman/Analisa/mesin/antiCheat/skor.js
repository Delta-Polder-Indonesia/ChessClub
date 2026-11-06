/**
 * Anti-cheat — lapisan SKOR PER PARTAI: `skorKecurigaan` dan `hitungSkorKecurigaan`,
 * termasuk pengumpul per fase (`kumpulBaru`/`catat`/`rampingkan`) yang dipakai
 * untuk meringkas satu partai.
 *
 * Bergantung pada `./dasar.js` (metrik mentah) dan `./kalibrasi.js`
 * (komponen 0–100); tidak menyentuh agregat riwayat.
 */
import { langkahTerpaksa } from "../evaluasi.js";
import { DAFTAR_FASE, FASE_PEMBUKAAN, faseBerikutnya, papanDariFen } from "../fase.js";
import {
  akurasiMove,
  anotasiMove,
  cpBaku,
  harmonikDariJumlah,
  inversAkurasi,
  kerugianMove,
  petaAnotasiKosong,
} from "../akurasi.js";
import {
  AMBANG,
  BOBOT,
  LEVEL_SEMENTARA,
  bulat1,
  kehilanganMenangPermille,
  kerugianCentipawn,
  kerugianKandidatCp,
  ketajamanKandidat,
  korelasiSpearman,
  normalkanSan,
  pemainLangkah,
  peringkatLangkahDalam,
  statistikWaktu,
  waktuBerpikir,
} from "./dasar.js";
import {
  komponenAcpl,
  komponenKecocokan,
  komponenPeringkat,
  komponenWaktu,
  tingkatDariSkor,
} from "./kalibrasi.js";

/**
 * Gabungkan metrik menjadi satu skor 0–100.
 *
 * Metrik yang tidak tersedia (`null`) dikeluarkan dari rata-rata berbobot dan
 * bobot sisanya dinormalkan ulang — partai tanpa data jam tetap dinilai, hanya
 * bertumpu pada kecocokan langkah + ACPL. Jumlah langkah yang dinilai
 * menyusutkan skor (`n / (n + 12)`): sepuluh langkah sempurna jauh lebih lemah
 * buktinya daripada delapan puluh langkah sempurna.
 */
export function skorKecurigaan({ engineMatchRate, acpl, konsistensiWaktu, rataPeringkat, jumlahLangkah, sampel }) {
  // Kebijakan pukul rata: rating/gelar/identitas tidak memengaruhi skor.
  // Parameter ratingPemain dipertahankan agar pemanggil lama tetap kompatibel.
  const kal = { kecocokanDasar: AMBANG.kecocokanDasar, acplAcuan: AMBANG.acplAcuan };
  const komponenMentah = {
    kecocokan: komponenKecocokan(engineMatchRate, kal.kecocokanDasar),
    peringkat: komponenPeringkat(rataPeringkat),
    acpl: komponenAcpl(acpl, kal.acplAcuan),
    waktu: komponenWaktu(konsistensiWaktu),
  };

  // Penyusutan memakai denominator milik metrik itu sendiri, bukan jumlah
  // semua langkah yang layak. Dua sampel MultiPV dari 80 langkah tidak boleh
  // terlihat seolah didukung oleh 80 sampel.
  // sampel opsional demi kompatibilitas pemanggil lama; jalur produksi
  // selalu memasok hitungan mentah masing-masing metrik.
  const hitungan = {};
  for (const kunci of Object.keys(BOBOT)) {
    const nilai = sampel?.[kunci];
    hitungan[kunci] = Number.isFinite(nilai)
      ? Math.max(0, nilai)
      : Number.isFinite(jumlahLangkah) ? Math.max(0, jumlahLangkah) : 0;
  }
  // Komponen publik tetap menunjukkan metrik mentah (0–100). Penyusutan
  // hanya memengaruhi skor gabungan, agar UI tidak menyamarkan nilai metrik.
  const komponen = { ...komponenMentah };
  const komponenSkor = {};
  for (const kunci of Object.keys(BOBOT)) {
    const nilai = komponenMentah[kunci];
    const n = hitungan[kunci];
    komponenSkor[kunci] = nilai === null || n <= 0
      ? null
      : nilai * (n / (n + AMBANG.penyusutanLangkah));
  }

  let bobotTerpakai = 0;
  let jumlahBerbobot = 0;
  for (const kunci of Object.keys(BOBOT)) {
    const nilai = komponenSkor[kunci];
    if (nilai === null) continue;
    bobotTerpakai += BOBOT[kunci];
    jumlahBerbobot += BOBOT[kunci] * nilai;
  }
  const metrikAktif = Object.keys(komponenSkor).filter((kunci) => komponenSkor[kunci] !== null);
  const sampelMetrik = { ...hitungan };
  const jumlahMetrikAktif = metrikAktif.length;
  // Top-1 dan peringkat MultiPV sama-sama mengukur pemilihan langkah; jangan
  // menyebut keduanya sebagai dua domain bukti berbeda. Hitungan pemilihan
  // produksi berasal dari partisi tanpa-peringkat + berperingkat yang terpisah.
  const sampelPemilihan =
    Number.isFinite(sampel?.kecocokan) && Number.isFinite(sampel?.peringkat)
      ? Math.max(0, sampel.kecocokan) + Math.max(0, sampel.peringkat)
      : Math.max(hitungan.kecocokan, hitungan.peringkat);
  // Domain baru dihitung sebagai cakupan memadai bila sampelnya setidaknya
  // sebesar skala penyusutan (12). Ini guard konservatif agar satu sampel tipis
  // tidak membuka level kategoris; bukan ambang signifikansi statistik.
  const domainBukti = [
    ...((komponenSkor.kecocokan !== null || komponenSkor.peringkat !== null) &&
      sampelPemilihan >= AMBANG.penyusutanLangkah ? ["pemilihan"] : []),
    ...(komponenSkor.acpl !== null && hitungan.acpl >= AMBANG.penyusutanLangkah ? ["kualitas"] : []),
    ...(komponenSkor.waktu !== null && hitungan.waktu >= AMBANG.penyusutanLangkah ? ["waktu"] : []),
  ];
  const jumlahDomainBukti = domainBukti.length;
  const cakupanTerbatas = jumlahDomainBukti < 2;

  // Cakupan dilaporkan terpisah dari skor: renormalisasi bobot yang tersedia
  // memang membuat skor tetap dapat dihitung, tetapi satu metrik bukan bukti
  // lintas-metrik. Ini bukan probabilitas terkalibrasi.
  if (!bobotTerpakai) {
    return { skor: null, level: null, komponen, metrikAktif, jumlahMetrikAktif, domainBukti, jumlahDomainBukti, sampelMetrik, cakupanTerbatas };
  }

  // Setiap komponen sudah divalidasi terhadap jumlah sampelnya sendiri.
  // Jangan mewajibkan sampel kecocokan top-1: ACPL atau MultiPV masih bisa
  // punya data sah meski saran bestMove tidak tersedia.
  const skor = Math.round(jumlahBerbobot / bobotTerpakai);
  // Jangan memberi label rendah/sedang/tinggi ketika hanya satu komponen
  // tersedia: skor numerik tetap informatif, tetapi levelnya masih sementara.
  const level = cakupanTerbatas ? LEVEL_SEMENTARA : tingkatDariSkor(skor);

  return { skor, level, komponen, metrikAktif, jumlahMetrikAktif, domainBukti, jumlahDomainBukti, sampelMetrik, cakupanTerbatas };
}

/* ------------------------------------------------------- tingkat per partai */

function kumpulBaru() {
  return {
    langkahDinilai: 0,
    langkahCocok: 0,
    langkahDinilaiTanpaPeringkat: 0,
    langkahCocokTanpaPeringkat: 0,
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
    // Metrik kondisional (fase 2) — perilaku, bukan sekadar rata-rata.
    sulitDinilai: 0,
    sulitCocok: 0,
    mudahDinilai: 0,
    mudahCocok: 0,
    streakKini: 0,
    streakTerpanjang: 0,
    pasanganWaktuRangking: [],
    /*
     * Metrik sepadan platform lain (./akurasi.js). Yang disimpan MENTAH:
     * harmonic mean tidak bisa dirata-rata antarpartai, jadi yang dibawa ke
     * agregat adalah `akurasiInversJumlah` (= Σ 1/max(1, akurasi)) dan
     * `akurasiSampel`, lalu `harmonikDariJumlah` menyusun ulang nilainya.
     */
    akurasiSampel: 0,
    akurasiJumlah: 0,
    akurasiInversJumlah: 0,
    kerugianBakuSampel: 0,
    kerugianBakuJumlah: 0,
    anotasi: petaAnotasiKosong(),
  };
}

function catat(target, {
  cocok = null,
  kerugian = null,
  detik = null,
  peringkat = null,
  kerugianKandidat = null,
  kehilanganMenang = null,
  kategori = null,
  akurasiBaku = null,
  kerugianBaku = null,
  anotasi = "",
}) {
  if (cocok !== null) {
    target.langkahDinilai++;
    if (cocok) target.langkahCocok++;
    if (peringkat === null) {
      target.langkahDinilaiTanpaPeringkat++;
      if (cocok) target.langkahCocokTanpaPeringkat++;
    }
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
  if (kategori === "sulit" || kategori === "mudah") {
    const kunci = kategori === "sulit" ? "sulit" : "mudah";
    target[`${kunci}Dinilai`]++;
    if (cocok) target[`${kunci}Cocok`]++;
  }
  // Metrik sepadan platform lain (./akurasi.js).
  if (akurasiBaku !== null) {
    const invers = inversAkurasi(akurasiBaku);
    if (invers !== null) {
      target.akurasiSampel++;
      target.akurasiJumlah += akurasiBaku;
      target.akurasiInversJumlah += invers;
    }
  }
  if (kerugianBaku !== null) {
    target.kerugianBakuSampel++;
    target.kerugianBakuJumlah += kerugianBaku;
  }
  if (anotasi && Object.hasOwn(target.anotasi, anotasi)) target.anotasi[anotasi]++;
}

function rampingkan(kumpul, { denganSkor = true, rating = null } = {}) {
  const engineMatchRate = kumpul.langkahDinilai ? (kumpul.langkahCocok / kumpul.langkahDinilai) * 100 : null;
  const acpl = kumpul.langkahAcpl ? kumpul.totalKerugian / kumpul.langkahAcpl : null;
  const rataPeringkat = kumpul.kandidatSampel ? kumpul.peringkatJumlah / kumpul.kandidatSampel : null;
  const acplKandidat = kumpul.kerugianKandidatSampel ? kumpul.kerugianKandidatJumlah / kumpul.kerugianKandidatSampel : null;
  const rataKehilanganMenang = kumpul.menangHilangSampel ? kumpul.menangHilangJumlah / kumpul.menangHilangSampel : null;
  const korelasi = korelasiSpearman(kumpul.pasanganWaktuRangking);
  // Metrik sepadan platform lain: harmonic mean (en-croissant) + pembandingnya.
  const akurasi = harmonikDariJumlah(kumpul.akurasiInversJumlah, kumpul.akurasiSampel);
  const akurasiAritmetik = kumpul.akurasiSampel ? kumpul.akurasiJumlah / kumpul.akurasiSampel : null;
  const acplBaku = kumpul.kerugianBakuSampel ? kumpul.kerugianBakuJumlah / kumpul.kerugianBakuSampel : null;
  const ringkas = {
    langkahDinilai: kumpul.langkahDinilai,
    langkahCocok: kumpul.langkahCocok,
    langkahDinilaiTanpaPeringkat: kumpul.langkahDinilaiTanpaPeringkat,
    langkahCocokTanpaPeringkat: kumpul.langkahCocokTanpaPeringkat,
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
    // Metrik kondisional (laporan untuk peninjau, bukan komponen skor).
    sulitDinilai: kumpul.sulitDinilai,
    sulitCocok: kumpul.sulitCocok,
    kecocokanSulit: kumpul.sulitDinilai ? bulat1((kumpul.sulitCocok / kumpul.sulitDinilai) * 100) : null,
    mudahDinilai: kumpul.mudahDinilai,
    mudahCocok: kumpul.mudahCocok,
    kecocokanMudah: kumpul.mudahDinilai ? bulat1((kumpul.mudahCocok / kumpul.mudahDinilai) * 100) : null,
    streakTerpanjang: kumpul.streakTerpanjang,
    sampelKorelasi: kumpul.pasanganWaktuRangking.length,
    korelasiWaktuKualitas: korelasi !== null ? Math.round(korelasi * 100) / 100 : null,
    /*
     * Metrik sepadan platform lain (./akurasi.js). Nilai mentah ikut dibawa
     * supaya agregat lintas partai bisa menyusun harmonic mean secara eksak.
     */
    akurasiSampel: kumpul.akurasiSampel,
    akurasiJumlah: kumpul.akurasiJumlah,
    akurasiInversJumlah: kumpul.akurasiInversJumlah,
    akurasi: bulat1(akurasi),
    akurasiAritmetik: bulat1(akurasiAritmetik),
    kerugianBakuSampel: kumpul.kerugianBakuSampel,
    kerugianBakuJumlah: kumpul.kerugianBakuJumlah,
    acplBaku: bulat1(acplBaku),
    anotasi: { ...kumpul.anotasi },
  };
  if (!denganSkor) return ringkas;

  const waktu = statistikWaktu(kumpul.detik);
  // Avoid double-counting positions represented by both top-1 and MultiPV rank.
  // If this game has no usable rank samples, retain all valid top-1 evidence.
  const sampelKecocokanSkor = kumpul.kandidatSampel > 0
    ? kumpul.langkahDinilaiTanpaPeringkat
    : kumpul.langkahDinilai;
  const cocokKecocokanSkor = kumpul.kandidatSampel > 0
    ? kumpul.langkahCocokTanpaPeringkat
    : kumpul.langkahCocok;
  const engineMatchRateSkor = sampelKecocokanSkor
    ? (cocokKecocokanSkor / sampelKecocokanSkor) * 100
    : null;
  const { skor, level, komponen, metrikAktif, jumlahMetrikAktif, domainBukti, jumlahDomainBukti, sampelMetrik, cakupanTerbatas } = skorKecurigaan({
    engineMatchRate: engineMatchRateSkor,
    acpl,
    rataPeringkat,
    konsistensiWaktu: waktu?.konsistensi ?? null,
    jumlahLangkah: kumpul.langkahDinilai,
    ratingPemain: rating,
    sampel: {
      kecocokan: sampelKecocokanSkor,
      peringkat: kumpul.kandidatSampel,
      acpl: kumpul.langkahAcpl,
      waktu: kumpul.detik.length,
    },
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
    metrikAktif,
    jumlahMetrikAktif,
    domainBukti,
    jumlahDomainBukti,
    sampelMetrik,
    cakupanTerbatas,
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
 * @param {{ rating?: { w?: number|null, b?: number|null } }} [opsi]
 *   Rating Elo pemain per warna (dari metadata PGN) — mengaktifkan
 *   kalibrasi ambang komponen kecocokan/ACPL; tanpa itu ambang global.
 * @returns {{ w: object, b: object, jumlahLangkah: number }} metrik per warna:
 *   `engineMatchRate`, `acpl`, `konsistensiWaktu` (+ `rincianWaktu`),
 *   `perFase`, `komponen`, `skor` (0–100), `level`, ditambah metrik sepadan
 *   platform lain: `akurasi` (harmonic mean), `akurasiAritmetik`, `acplBaku`,
 *   dan hitungan `anotasi` NAG.
 */
export function hitungSkorKecurigaan(moves, { rating = {} } = {}) {
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
      warna !== null && Boolean(move.san) && !langkahTerpaksa(move) && move.moveRating !== "book";

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
      /*
       * Keranjang ketajaman posisi (sulit/mudah) dibaca dari kandidat yang
       * SAMA dengan peringkat. Kategori null = posisi netral (tidak masuk
       * kedua keranjang) atau kandidat tidak ada.
       */
      const tajam = ketajamanKandidat(daftar[i - 1]?.kandidat);
      const kategori =
        tajam === null ? null : tajam <= AMBANG.kandidatSulit ? "sulit" : tajam >= AMBANG.kandidatMudah ? "mudah" : null;
      /*
       * Metrik sepadan platform lain (./akurasi.js). Ketiganya dibaca dari
       * entri yang sama dengan metrik lama — `previousStaticEvals` untuk
       * akurasi/ACPL, dan kandidat entri SEBELUMNYA untuk anotasi.
       * `previousStaticEvals[2]` adalah eval dua ply sebelumnya, yaitu posisi
       * saat pemain yang sama bergerak lagi, sehingga tidak perlu dibalik
       * tandanya (lihat `cpBaku`).
       */
      const akurasiBaku = akurasiMove(move);
      const kerugianBaku = kerugianMove(move);
      const anotasi = anotasiMove(move, daftar[i - 1]?.kandidat, cpBaku(move.previousStaticEvals?.[2], false));
      catat(akum[warna], {
        cocok,
        kerugian,
        detik,
        peringkat,
        kerugianKandidat,
        kehilanganMenang,
        kategori,
        akurasiBaku,
        kerugianBaku,
        anotasi,
      });
      catat(akumFase[fase][warna], {
        cocok,
        kerugian,
        detik,
        peringkat,
        kerugianKandidat,
        kehilanganMenang,
        akurasiBaku,
        kerugianBaku,
        anotasi,
      });
      jumlahLangkah++;

      /*
       * Streak langkah terbaik beruntun + pasangan waktu↔peringkat untuk
       * korelasi Spearman. Keduanya hanya pada akumulator warna (bukan
       * per fase) dan hanya bila langkah punya data peringkat.
       */
      if (peringkat !== null) {
        const target = akum[warna];
        target.streakKini = peringkat === 1 ? target.streakKini + 1 : 0;
        if (target.streakKini > target.streakTerpanjang) target.streakTerpanjang = target.streakKini;
        if (detik !== null) target.pasanganWaktuRangking.push({ detik, peringkat });
      }
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
    w: {
      warna: "w",
      ...rampingkan(akum.w, { rating: rating?.w ?? null }),
      perFase: ringkasPerFase({ opening: akumFase.opening.w, middlegame: akumFase.middlegame.w, endgame: akumFase.endgame.w }),
    },
    b: {
      warna: "b",
      ...rampingkan(akum.b, { rating: rating?.b ?? null }),
      perFase: ringkasPerFase({ opening: akumFase.opening.b, middlegame: akumFase.middlegame.b, endgame: akumFase.endgame.b }),
    },
    jumlahLangkah,
  };
}
