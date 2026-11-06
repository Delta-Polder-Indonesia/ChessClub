/**
 * Anti-cheat — lapisan AGREGAT RIWAYAT: menggabungkan banyak partai menjadi
 * satu gambaran per pemain (agregat, tren, baris ringkasan).
 *
 * Lapisan teratas: boleh membaca `./skor.js`, `./kalibrasi.js`, dan
 * `./dasar.js`; tidak ada lapisan lain yang mengimpornya.
 */
import { DAFTAR_FASE } from "../fase.js";
import { harmonikDariJumlah, petaAnotasiKosong } from "../akurasi.js";
import {
  AMBANG,
  MIN_LANGKAH_AGGREGAT,
  MIN_PARTAI_AGGREGAT,
  bulat1,
  pemainLangkah,
  rataRata,
} from "./dasar.js";
import { ratingDariMetadata } from "./kalibrasi.js";
import { hitungSkorKecurigaan, skorKecurigaan } from "./skor.js";

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
  // Jangan buang partai hanya karena bestMove/top-1 tidak tersedia:
  // ACPL atau peringkat MultiPV tetap bisa menjadi bukti statistik yang sah.
  if (
    !ringkas ||
    !(ringkas.langkahDinilai || ringkas.langkahAcpl || ringkas.kandidatSampel)
  ) return null;

  // Rating pemain pada partai ini: eksplisit dari pemanggil, atau dibaca
  // dari metadata PGN sesuai warna. Non-finite → null (tanpa kalibrasi).
  // null, undefined, dan string kosong berarti rating tidak diketahui.
  // Number(null) / Number("") menghasilkan 0, yang keliru mengaktifkan band Elo terendah.
  const nilaiRating = item.rating;
  let rating =
    nilaiRating == null || (typeof nilaiRating === "string" && !nilaiRating.trim())
      ? null
      : Number(nilaiRating);
  if (!Number.isFinite(rating) || rating <= 0) {
    const dariMetadata = ratingDariMetadata(item.metadata);
    rating = warna === "w" ? dariMetadata.w : dariMetadata.b;
  }

  return {
    id: item.id ? String(item.id) : "",
    timestamp: Number(item.timestamp) || 0,
    warna,
    lawan: item.lawan ?? namaLawan(item.metadata, warna),
    timeClass: item.timeClass ? String(item.timeClass) : "",
    langkahDinilai: ringkas.langkahDinilai,
    langkahCocok: ringkas.langkahCocok,
    langkahDinilaiTanpaPeringkat: ringkas.langkahDinilaiTanpaPeringkat ?? ringkas.langkahDinilai,
    langkahCocokTanpaPeringkat: ringkas.langkahCocokTanpaPeringkat ?? ringkas.langkahCocok,
    engineMatchRate: ringkas.engineMatchRate,
    langkahAcpl: ringkas.langkahAcpl,
    totalKerugian: ringkas.totalKerugian,
    acpl: ringkas.acpl,
    rating: Number.isFinite(rating) ? rating : null,
    // Metrik kandidat MultiPV (jumlah mentah untuk penjumlahan ulang).
    kandidatSampel: ringkas.kandidatSampel ?? 0,
    langkahTop3: ringkas.langkahTop3 ?? 0,
    langkahTop5: ringkas.langkahTop5 ?? 0,
    peringkatJumlah: ringkas.peringkatJumlah ?? 0,
    kerugianKandidatJumlah: ringkas.kerugianKandidatJumlah ?? 0,
    kerugianKandidatSampel: ringkas.kerugianKandidatSampel ?? 0,
    menangHilangJumlah: ringkas.menangHilangJumlah ?? 0,
    menangHilangSampel: ringkas.menangHilangSampel ?? 0,
    // Metrik kondisional (jumlah mentah; korelasi dirata-rata berbobot sampel).
    sulitDinilai: ringkas.sulitDinilai ?? 0,
    sulitCocok: ringkas.sulitCocok ?? 0,
    mudahDinilai: ringkas.mudahDinilai ?? 0,
    mudahCocok: ringkas.mudahCocok ?? 0,
    streakTerpanjang: ringkas.streakTerpanjang ?? 0,
    sampelKorelasi: ringkas.sampelKorelasi ?? 0,
    korelasiWaktuKualitas: ringkas.korelasiWaktuKualitas ?? null,
    konsistensiWaktu: ringkas.konsistensiWaktu,
    rincianWaktu: ringkas.rincianWaktu ?? null,
    // Metrik sepadan platform lain — jumlah mentah untuk penjumlahan ulang.
    akurasiSampel: ringkas.akurasiSampel ?? 0,
    akurasiJumlah: ringkas.akurasiJumlah ?? 0,
    akurasiInversJumlah: ringkas.akurasiInversJumlah ?? 0,
    kerugianBakuSampel: ringkas.kerugianBakuSampel ?? 0,
    kerugianBakuJumlah: ringkas.kerugianBakuJumlah ?? 0,
    anotasi: ringkas.anotasi ?? petaAnotasiKosong(),
    // Nilai siap tampil untuk tabel per partai di laporan peninjauan.
    akurasi: ringkas.akurasi ?? null,
    akurasiAritmetik: ringkas.akurasiAritmetik ?? null,
    acplBaku: ringkas.acplBaku ?? null,
    perFase: ringkas.perFase ?? null,
    skor: ringkas.skor,
    level: ringkas.level,
  };
}

/** Kemiringan garis regresi paling sederhana: poin skor per partai. */
export function kemiringanTren(daftarSkor) {
  if (!Array.isArray(daftarSkor)) return null;

  // Skor yang hilang bukan nol. Pertahankan indeks partai asli agar kemiringan
  // tetap dihitung per posisi waktu, tanpa mengarang nilai untuk data kosong.
  const nilai = daftarSkor
    .map((skor, indeks) => ({ x: indeks, y: skor }))
    .filter(({ y }) => Number.isFinite(y));
  const n = nilai.length;
  if (n < MIN_PARTAI_AGGREGAT) return null;

  const rataX = rataRata(nilai.map(({ x }) => x));
  const rataY = rataRata(nilai.map(({ y }) => y));
  let pembilang = 0;
  let penyebut = 0;
  for (const { x, y } of nilai) {
    pembilang += (x - rataX) * (y - rataY);
    penyebut += (x - rataX) ** 2;
  }
  return penyebut ? pembilang / penyebut : null;
}

function arahTren(kemiringan) {
  if (!Number.isFinite(kemiringan)) return null;
  if (kemiringan >= AMBANG.tren) return "naik";
  if (kemiringan <= -AMBANG.tren) return "turun";
  return "stabil";
}

function totalPartaiTanpaPeringkatDinilai(partai) {
  return partai.reduce((total, baris) => total + (baris.langkahDinilaiTanpaPeringkat || 0), 0);
}

function totalPartaiTanpaPeringkatCocok(partai) {
  return partai.reduce((total, baris) => total + (baris.langkahCocokTanpaPeringkat || 0), 0);
}

function hasilKosong(username) {
  return {
    username: String(username ?? ""),
    jumlahPartai: 0,
    jumlahLangkah: 0,
    andal: false,
    engineMatchRate: null,
    langkahDinilaiTanpaPeringkat: 0,
    langkahCocokTanpaPeringkat: 0,
    acpl: null,
    rating: null,
    kandidatSampel: 0,
    kecocokanTop3: null,
    kecocokanTop5: null,
    rataPeringkat: null,
    acplKandidat: null,
    rataKehilanganMenang: null,
    sulitDinilai: 0,
    kecocokanSulit: null,
    mudahDinilai: 0,
    kecocokanMudah: null,
    streakTerpanjang: 0,
    sampelKorelasi: 0,
    korelasiWaktuKualitas: null,
    konsistensiWaktu: null,
    rincianWaktu: null,
    // Metrik sepadan platform lain (./akurasi.js).
    akurasiSampel: 0,
    akurasiJumlah: 0,
    akurasiInversJumlah: 0,
    akurasi: null,
    akurasiAritmetik: null,
    kerugianBakuSampel: 0,
    kerugianBakuJumlah: 0,
    acplBaku: null,
    anotasi: petaAnotasiKosong(),
    komponen: { kecocokan: null, peringkat: null, acpl: null, waktu: null },
    metrikAktif: [],
    jumlahMetrikAktif: 0,
    sampelMetrik: { kecocokan: 0, peringkat: 0, acpl: 0, waktu: 0 },
    cakupanTerbatas: true,
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
          akurasiSampel: 0,
          akurasi: null,
          akurasiAritmetik: null,
          kerugianBakuSampel: 0,
          acplBaku: null,
          anotasi: petaAnotasiKosong(),
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
  let totalKecocokanSkorDinilai = 0;
  let totalKecocokanSkorCocok = 0;
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
  // Metrik kondisional: kecocokan sulit/mudah dijumlah ulang mentah,
  // streak diambil maksimumnya, korelasi dirata-rata berbobot sampel.
  let totalSulitDinilai = 0;
  let totalSulitCocok = 0;
  let totalMudahDinilai = 0;
  let totalMudahCocok = 0;
  let streakMaksimum = 0;
  let bobotKorelasi = 0;
  let jumlahKorelasi = 0;
  // Metrik sepadan platform lain: dijumlah MENTAH agar harmonic mean eksak.
  let totalAkurasiSampel = 0;
  let totalAkurasiJumlah = 0;
  let totalAkurasiInvers = 0;
  let totalKerugianBakuSampel = 0;
  let totalKerugianBaku = 0;
  const totalAnotasi = petaAnotasiKosong();
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
      akurasiSampel: 0,
      akurasiJumlah: 0,
      akurasiInversJumlah: 0,
      kerugianBakuSampel: 0,
      kerugianBakuJumlah: 0,
      anotasi: petaAnotasiKosong(),
    };

  for (const baris of partai) {
    totalLangkahDinilai += baris.langkahDinilai || 0;
    totalLangkahCocok += baris.langkahCocok || 0;
    // Across history, use top-1 only where a valid MultiPV rank is absent.
    if ((baris.kandidatSampel || 0) > 0) {
      totalKecocokanSkorDinilai += baris.langkahDinilaiTanpaPeringkat || 0;
      totalKecocokanSkorCocok += baris.langkahCocokTanpaPeringkat || 0;
    } else {
      totalKecocokanSkorDinilai += baris.langkahDinilai || 0;
      totalKecocokanSkorCocok += baris.langkahCocok || 0;
    }
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
    totalSulitDinilai += baris.sulitDinilai || 0;
    totalSulitCocok += baris.sulitCocok || 0;
    totalMudahDinilai += baris.mudahDinilai || 0;
    totalMudahCocok += baris.mudahCocok || 0;
    streakMaksimum = Math.max(streakMaksimum, baris.streakTerpanjang || 0);
    /*
     * Partai yang dianalisis sebelum metrik ini ada (atau dibaca dari cache
     * versi lama) tidak membawa jumlah mentahnya; `|| 0` membuatnya tidak
     * menyumbang apa-apa, jadi `akurasi` agregat tetap null bila tidak ada
     * satu partai pun yang punya data.
     */
    totalAkurasiSampel += baris.akurasiSampel || 0;
    totalAkurasiJumlah += baris.akurasiJumlah || 0;
    totalAkurasiInvers += baris.akurasiInversJumlah || 0;
    totalKerugianBakuSampel += baris.kerugianBakuSampel || 0;
    totalKerugianBaku += baris.kerugianBakuJumlah || 0;
    for (const kunciAnotasi of Object.keys(totalAnotasi)) {
      totalAnotasi[kunciAnotasi] += baris.anotasi?.[kunciAnotasi] || 0;
    }
    if (Number.isFinite(baris.korelasiWaktuKualitas) && (baris.sampelKorelasi || 0) > 0) {
      jumlahKorelasi += baris.sampelKorelasi * baris.korelasiWaktuKualitas;
      bobotKorelasi += baris.sampelKorelasi;
    }
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
      a.akurasiSampel += faseBaris.akurasiSampel || 0;
      a.akurasiJumlah += faseBaris.akurasiJumlah || 0;
      a.akurasiInversJumlah += faseBaris.akurasiInversJumlah || 0;
      a.kerugianBakuSampel += faseBaris.kerugianBakuSampel || 0;
      a.kerugianBakuJumlah += faseBaris.kerugianBakuJumlah || 0;
      for (const kunciAnotasi of Object.keys(a.anotasi)) a.anotasi[kunciAnotasi] += faseBaris.anotasi?.[kunciAnotasi] || 0;
    }
  }

  const engineMatchRate = totalLangkahDinilai ? (totalLangkahCocok / totalLangkahDinilai) * 100 : null;
  const engineMatchRateSkor = totalKecocokanSkorDinilai
    ? (totalKecocokanSkorCocok / totalKecocokanSkorDinilai) * 100
    : null;
  const acpl = totalLangkahAcpl ? totalKerugian / totalLangkahAcpl : null;
  const rataPeringkat = totalKandidatSampel ? totalPeringkatJumlah / totalKandidatSampel : null;
  const konsistensiWaktu = bobotWaktu ? jumlahWaktu / bobotWaktu : null;

  // Median rating partai yang punya data — acuan kalibrasi ambang agregat.
  const daftarRating = partai
    .map((b) => b.rating)
    .filter((r) => Number.isFinite(r))
    .sort((a, b) => a - b);
  let ratingMedan = null;
  if (daftarRating.length) {
    const tengah = Math.floor(daftarRating.length / 2);
    ratingMedan =
      daftarRating.length % 2
        ? daftarRating[tengah]
        : (daftarRating[tengah - 1] + daftarRating[tengah]) / 2;
  }

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
      akurasiSampel: a.akurasiSampel,
      akurasi: bulat1(harmonikDariJumlah(a.akurasiInversJumlah, a.akurasiSampel)),
      akurasiAritmetik: a.akurasiSampel ? bulat1(a.akurasiJumlah / a.akurasiSampel) : null,
      kerugianBakuSampel: a.kerugianBakuSampel,
      acplBaku: a.kerugianBakuSampel ? bulat1(a.kerugianBakuJumlah / a.kerugianBakuSampel) : null,
      anotasi: { ...a.anotasi },
    };
  }

  const sampelMetrik = {
    kecocokan: totalKecocokanSkorDinilai,
    peringkat: totalKandidatSampel,
    acpl: totalLangkahAcpl,
    waktu: bobotWaktu,
  };
  const { skor, level, komponen, metrikAktif, jumlahMetrikAktif, domainBukti, jumlahDomainBukti, cakupanTerbatas } = skorKecurigaan({
    engineMatchRate: engineMatchRateSkor,
    acpl,
    rataPeringkat,
    konsistensiWaktu,
    jumlahLangkah: totalLangkahDinilai,
    ratingPemain: ratingMedan,
    sampel: sampelMetrik,
  });

  const tren = {
    // Poin ringan untuk grafik; rincian per partai ada di `partai`.
    poin: partai.map((b) => ({
      id: b.id,
      timestamp: b.timestamp,
      warna: b.warna,
      lawan: b.lawan,
      skor: b.skor,
      level: b.level,
      // Ikut dibawa supaya tren akurasi/ACPL bisa digambar tanpa membuka
      // rincian per partai.
      akurasi: b.akurasi,
      acplBaku: b.acplBaku,
    })),
    kemiringan: kemiringanTren(partai.map((b) => b.skor)),
    arah: null,
  };
  tren.arah = arahTren(tren.kemiringan);

  return {
    username: String(username ?? ""),
    jumlahPartai: partai.length,
    jumlahLangkah: totalLangkahDinilai,
    // Keandalan jumlah data mengikuti metrik skor dengan sampel terbanyak,
    // bukan hanya top-1. Maksimum menghindari penghitungan ganda pada posisi
    // yang dapat menyumbang ke lebih dari satu metrik.
    andal: partai.length >= MIN_PARTAI_AGGREGAT && Math.max(...Object.values(sampelMetrik)) >= MIN_LANGKAH_AGGREGAT,
    engineMatchRate: bulat1(engineMatchRate),
    langkahDinilaiTanpaPeringkat: totalPartaiTanpaPeringkatDinilai(partai),
    langkahCocokTanpaPeringkat: totalPartaiTanpaPeringkatCocok(partai),
    acpl: bulat1(acpl),
    rating: ratingMedan,
    /*
     * Metrik sepadan platform lain (./akurasi.js). Harmonic mean disusun dari
     * jumlah mentah, bukan dirata-rata dari angka per partai — merata-rata
     * harmonic mean per partai akan menghasilkan angka yang salah.
     */
    akurasiSampel: totalAkurasiSampel,
    akurasi: bulat1(harmonikDariJumlah(totalAkurasiInvers, totalAkurasiSampel)),
    akurasiAritmetik: totalAkurasiSampel ? bulat1(totalAkurasiJumlah / totalAkurasiSampel) : null,
    kerugianBakuSampel: totalKerugianBakuSampel,
    acplBaku: totalKerugianBakuSampel ? bulat1(totalKerugianBaku / totalKerugianBakuSampel) : null,
    anotasi: { ...totalAnotasi },
    // Metrik kandidat MultiPV pada tingkat agregat.
    kandidatSampel: totalKandidatSampel,
    kecocokanTop3: totalKandidatSampel ? bulat1((totalLangkahTop3 / totalKandidatSampel) * 100) : null,
    kecocokanTop5: totalKandidatSampel ? bulat1((totalLangkahTop5 / totalKandidatSampel) * 100) : null,
    rataPeringkat: bulat1(rataPeringkat),
    acplKandidat: totalKerugianKandidatSampel ? bulat1(totalKerugianKandidat / totalKerugianKandidatSampel) : null,
    rataKehilanganMenang: totalMenangHilangSampel ? bulat1(totalMenangHilang / totalMenangHilangSampel) : null,
    kecocokanSulit: totalSulitDinilai ? bulat1((totalSulitCocok / totalSulitDinilai) * 100) : null,
    kecocokanMudah: totalMudahDinilai ? bulat1((totalMudahCocok / totalMudahDinilai) * 100) : null,
    streakTerpanjang: streakMaksimum,
    korelasiWaktuKualitas: bobotKorelasi ? Math.round((jumlahKorelasi / bobotKorelasi) * 100) / 100 : null,
    konsistensiWaktu: Number.isFinite(konsistensiWaktu) ? Math.round(konsistensiWaktu * 100) / 100 : null,
    rincianWaktu: { jumlahSampel: bobotWaktu },
    komponen,
    skor,
    level,
    metrikAktif,
    jumlahMetrikAktif,
    domainBukti,
    jumlahDomainBukti,
    sampelMetrik,
    cakupanTerbatas,
    perFase,
    tren,
    partai,
  };
}
