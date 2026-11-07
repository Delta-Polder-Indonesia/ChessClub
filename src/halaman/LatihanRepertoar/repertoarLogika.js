import { Chess } from "chess.js";

const HARI = 24 * 60 * 60 * 1000;
const SEPULUH_MENIT = 10 * 60 * 1000;

/**
 * Plafon jarak tinjauan. Tanpa batas, pengali 2,5× pada "Mudah" menumbuhkan
 * interval tanpa henti (10× tinjauan ≈ 8 tahun) sehingga kartu praktis hilang
 * dari jadwal. Satu tahun adalah plafon yang dipakai aplikasi serupa.
 */
export const BATAS_INTERVAL_MS = 365 * HARI;

/**
 * Ambang "sudah dikuasai" untuk progres kartu katalog: kartu yang jarak
 * tinjauannya sudah mencapai tiga minggu dianggap menempel di ingatan.
 * Ambang ini sengaja dihitung dari `intervalMs` (bukan `repetitions`) supaya
 * kartu lama yang dinilai "Sulit" berulang tidak ikut dihitung matang.
 */
export const INTERVAL_MATANG_MS = 21 * HARI;

export function idJalurPembukaan({ eco, nama, warna }) {
  return encodeURIComponent(`${eco}|${nama}|${warna}`);
}

/**
 * Ringkas buku Lichess menjadi satu jalur latihan per nama/ECO.
 * Memilih jalur terpanjang yang masih praktis, dengan jumlah partai sebagai
 * pemutus seri. Fungsi menerima data mentah hanya ketika mode repertoar dibuka.
 */
export function indeksJalurPembukaan(daftar) {
  const pilihan = new Map();
  for (const entri of Array.isArray(daftar) ? daftar : []) {
    const eco = String(entri.eco || entri.code || "?");
    const nama = String(entri.opening || entri.name || "").trim();
    const moves = String(entri.moves || entri.uci || "").trim().split(/\s+/).filter(Boolean);
    if (!nama || moves.length < 2) continue;

    const id = `${eco}|${nama}`;
    const lama = pilihan.get(id);
    const kandidat = {
      id,
      eco,
      nama,
      moves: moves.slice(0, 24),
      jumlahPartai: Number(entri.games) || 0,
    };
    if (
      !lama ||
      kandidat.moves.length > lama.moves.length ||
      (kandidat.moves.length === lama.moves.length && kandidat.jumlahPartai > lama.jumlahPartai)
    ) {
      pilihan.set(id, kandidat);
    }
  }
  return [...pilihan.values()].sort((a, b) => a.eco.localeCompare(b.eco) || a.nama.localeCompare(b.nama));
}

/** Bangun kartu satu langkah untuk setiap giliran warna yang akan dilatih. */
export function buatKartuDariJalur(jalur, warna, sekarang = Date.now()) {
  if (!jalur?.moves?.length || !["w", "b"].includes(warna)) return [];
  const game = new Chess();
  const lineId = idJalurPembukaan({ eco: jalur.eco, nama: jalur.nama, warna });
  const kartu = [];

  for (let indeks = 0; indeks < jalur.moves.length; indeks += 1) {
    const uci = jalur.moves[indeks];
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const giliranPemain = game.turn() === warna;
    const fen = giliranPemain ? game.fen() : null;

    let pindah;
    try {
      pindah = game.move({ from, to, ...(promotion ? { promotion } : {}) });
    } catch {
      return kartu;
    }
    if (!pindah) return kartu;

    if (giliranPemain) {
      kartu.push({
        id: `${lineId}:${indeks}`,
        lineId,
        eco: jalur.eco,
        nama: jalur.nama,
        warna,
        ply: indeks,
        fen,
        expectedUci: `${pindah.from}${pindah.to}${pindah.promotion || ""}`,
        expectedSan: pindah.san,
        dueAt: sekarang,
        intervalMs: 0,
        repetitions: 0,
        lastGrade: null,
        lastReviewedAt: null,
        createdAt: sekarang,
        diperbarui: sekarang,
      });
    }
  }
  return kartu;
}

/** Jadwalkan kartu setelah penilaian mandiri, tanpa mengirim data ke server. */
export function jadwalkanKartu(kartu, nilai, sekarang = Date.now()) {
  const repetisi = Number(kartu.repetitions) || 0;
  const intervalLama = Number(kartu.intervalMs) || 0;
  let intervalMs;
  let repetitions;

  switch (nilai) {
    case "again":
      intervalMs = SEPULUH_MENIT;
      repetitions = 0;
      break;
    case "hard":
      intervalMs = Math.max(HARI, intervalLama ? intervalLama * 1.2 : HARI);
      repetitions = repetisi + 1;
      break;
    case "easy":
      intervalMs = Math.max(7 * HARI, intervalLama ? intervalLama * 2.5 : 7 * HARI);
      repetitions = repetisi + 1;
      break;
    case "good":
    default:
      intervalMs = Math.max(3 * HARI, intervalLama ? intervalLama * 2 : 3 * HARI);
      repetitions = repetisi + 1;
      break;
  }

  intervalMs = Math.min(intervalMs, BATAS_INTERVAL_MS);

  return {
    ...kartu,
    dueAt: sekarang + intervalMs,
    intervalMs,
    repetitions,
    lastGrade: nilai,
    lastReviewedAt: sekarang,
    // Dipakai `repertoarStorage.js` untuk memilih rekaman terbaru saat
    // menggabungkan IndexedDB dengan cermin localStorage.
    diperbarui: sekarang,
  };
}

/**
 * Uraikan satu langkah UCI (`e2e4`, `e7e8q`) menjadi argumen `chess.js`.
 */
export function uraiUci(uci) {
  const teks = String(uci || "").trim();
  if (teks.length < 4) return null;
  return {
    from: teks.slice(0, 2),
    to: teks.slice(2, 4),
    ...(teks.length > 4 ? { promotion: teks[4] } : {}),
  };
}

/**
 * Cocokkan langkah pemain dengan langkah buku.
 *
 * Hanya petak asal/tujuan yang dinilai: ketika buku mempromosikan bidak,
 * pilihan bidak promosi pemain (ratu/kuda/benteng/gajah) tidak boleh membuat
 * langkah yang benar dianggap salah — posisi akhirnya tetap mengikuti buku.
 */
export function cocokLangkahBuku(pindah, expectedUci) {
  if (!pindah || !expectedUci) return false;
  return `${pindah.from}${pindah.to}` === String(expectedUci).slice(0, 4);
}

/**
 * Ringkasan satu jalur untuk kartu katalog: jumlah posisi, berapa yang sudah
 * dikuasai, persentase, dan FEN akhir untuk gambar papan mini.
 *
 * FEN akhir diambil dari kartu terdalam (`ply` terbesar) lalu langkah
 * `expectedUci` kartu itu dijalankan — kartu menyimpan posisi SEBELUM langkah
 * pemain, sehingga tanpa langkah tambahan papannya akan tampak mundur satu ply.
 */
export function progresJalur(kartuJalur = []) {
  const daftar = (Array.isArray(kartuJalur) ? kartuJalur : []).filter(Boolean);
  const total = daftar.length;
  const matang = daftar.filter((kartu) => (Number(kartu.intervalMs) || 0) >= INTERVAL_MATANG_MS).length;

  const terdalam = daftar.reduce(
    (pilihan, kartu) => (!pilihan || Number(kartu.ply) > Number(pilihan.ply) ? kartu : pilihan),
    null,
  );

  let fenAkhir = null;
  if (terdalam?.fen) {
    try {
      const game = new Chess(terdalam.fen);
      const urai = uraiUci(terdalam.expectedUci);
      if (urai && game.move(urai)) fenAkhir = game.fen();
    } catch {
      fenAkhir = null;
    }
  }

  return {
    total,
    matang,
    persen: total ? Math.round((matang / total) * 100) : 0,
    fenAkhir,
  };
}

/**
 * Rekonstruksi daftar langkah satu jalur dari kartu yang tersimpan.
 *
 * Kartu hanya menyimpan langkah PEMILIK jalur (`expectedUci`) beserta FEN
 * sebelum langkah itu; langkah lawan tidak disimpan. Untungnya kartu
 * berurutan berjarak dua ply, jadi langkah lawan bisa ditemukan dengan
 * mencoba langkah-langkah sah dari posisi sesudah langkah kita sampai ada
 * yang menghasilkan FEN kartu berikutnya (FEN selalu berbeda antar langkah,
 * sehingga tidak ada dua kandidat untuk posisi yang sama).
 *
 * Fungsi ini murni dan tidak menyentuh penyimpanan: kartu lama yang dibuat
 * sebelum fitur pohon cabang ada tetap bisa digambar tanpa migrasi data.
 *
 * @param {Array<object>} daftarKartu kartu satu `lineId`
 * @returns {{moves: string[], san: string[], fens: string[]}} `fens[i]` adalah
 *   posisi SEBELUM `moves[i]`; jalur yang rusak dipotong di langkah terakhir
 *   yang masih bisa dipastikan, bukan dilempar sebagai galat.
 */
export function rekonstruksiJalur(daftarKartu = []) {
  const kartu = (Array.isArray(daftarKartu) ? daftarKartu : [])
    .filter((item) => item && item.fen && item.expectedUci && Number.isFinite(Number(item.ply)))
    .slice()
    .sort((a, b) => Number(a.ply) - Number(b.ply));
  const kosong = { moves: [], san: [], fens: [] };
  if (!kartu.length) return kosong;

  const petaKartu = new Map(kartu.map((item) => [item.fen, item]));
  const game = new Chess();
  const moves = [];
  const san = [];
  const fens = [];
  const plyTerakhir = Number(kartu[kartu.length - 1].ply) || 0;
  // Ply terakhir milik pemilik jalur; satu langkah lawan sesudahnya tidak
  // diperlukan untuk menggambar pohon.
  const batas = Math.min(plyTerakhir + 1, 60);

  while (moves.length < batas) {
    const fenSekarang = game.fen();
    const kartuDiSini = petaKartu.get(fenSekarang);

    if (kartuDiSini) {
      const urai = uraiUci(kartuDiSini.expectedUci);
      let pindah = null;
      try {
        pindah = urai ? game.move(urai) : null;
      } catch {
        // Kartu rusak: jalur berhenti di langkah terakhir yang pasti.
      }
      if (!pindah) break;
      fens.push(fenSekarang);
      moves.push(`${pindah.from}${pindah.to}${pindah.promotion || ""}`);
      san.push(pindah.san);
      continue;
    }

    // Bukan posisi kartu → langkah lawan. Cari langkah sah menuju FEN kartu
    // berikutnya; bila tidak ketemu, jalur berhenti di sini (kartu bolong).
    const berikut = kartu.find((item) => Number(item.ply) > moves.length);
    if (!berikut) break;
    let pindahLawan = null;
    for (const kandidat of game.moves({ verbose: true })) {
      const uji = new Chess(fenSekarang);
      try {
        uji.move({
          from: kandidat.from,
          to: kandidat.to,
          ...(kandidat.promotion ? { promotion: kandidat.promotion } : {}),
        });
      } catch {
        continue;
      }
      if (uji.fen() === berikut.fen) {
        pindahLawan = kandidat;
        break;
      }
    }
    if (!pindahLawan) break;
    game.move({
      from: pindahLawan.from,
      to: pindahLawan.to,
      ...(pindahLawan.promotion ? { promotion: pindahLawan.promotion } : {}),
    });
    fens.push(fenSekarang);
    moves.push(`${pindahLawan.from}${pindahLawan.to}${pindahLawan.promotion || ""}`);
    san.push(pindahLawan.san);
  }

  return { moves, san, fens };
}

/**
 * Susun pohon cabang dari beberapa garis satu pembukaan.
 *
 * Awalan langkah yang sama digambar sekali; percabangan muncul hanya ketika
 * dua garis benar-benar berbeda. Setiap simpul menandai garis mana yang
 * melewatinya (`garisIds`) dan kartu latihan mana yang dijawab di posisi itu
 * (`kartu`), sehingga UI bisa menampilkan mana yang jatuh tempo atau matang.
 *
 * @param {Array<{lineId:string, warna:string, daftarKartu:Array<object>}>} garisList
 * @returns {{anak: Array<object>, jumlahGaris: number, jumlahLangkah: number}}
 */
export function susunPohonCabang(garisList = []) {
  const akar = { anak: [], garisIds: [] };
  let jumlahLangkah = 0;
  let jumlahGaris = 0;

  for (const garis of Array.isArray(garisList) ? garisList : []) {
    if (!garis?.lineId) continue;
    const { moves, san, fens } = rekonstruksiJalur(garis.daftarKartu);
    if (!moves.length) continue;
    jumlahGaris += 1;

    let simpul = akar;
    if (!simpul.garisIds.includes(garis.lineId)) simpul.garisIds.push(garis.lineId);

    for (let ply = 0; ply < moves.length; ply += 1) {
      const uci = moves[ply];
      let berikut = simpul.anak.find((item) => item.uci === uci);
      if (!berikut) {
        berikut = {
          kunci: `${garis.lineId}:${ply}:${uci}`,
          uci,
          san: san[ply],
          ply,
          warna: ply % 2 === 0 ? "w" : "b",
          nomor: Math.floor(ply / 2) + 1,
          garisIds: [],
          kartu: [],
          anak: [],
        };
        simpul.anak.push(berikut);
        jumlahLangkah += 1;
      }
      if (!berikut.garisIds.includes(garis.lineId)) berikut.garisIds.push(garis.lineId);

      // Kartu milik posisi SEBELUM langkah ini: pemain menjawab dengan langkah
      // yang sama, jadi simpul ini adalah soal latihan untuk garis tersebut.
      const kartu = (garis.daftarKartu || []).find(
        (item) => item && item.fen === fens[ply] && item.expectedUci === uci,
      );
      if (kartu) berikut.kartu.push(kartu);

      simpul = berikut;
    }
  }

  return { anak: akar.anak, jumlahGaris, jumlahLangkah };
}

/**
 * Angka ringkas untuk layar statistik repertoar.
 *
 * Semua nilai diturunkan dari kartu yang sudah tersimpan plus peta rekor
 * tantangan (`{ [lineId]: { streakTerbaik, poin } }`), jadi layar statistik
 * tidak menulis apa pun ke penyimpanan.
 */
export function ringkasStatistik(kartuList = [], { sekarang = Date.now(), rekor = {} } = {}) {
  const daftar = (Array.isArray(kartuList) ? kartuList : []).filter(Boolean);
  const nilai = { again: 0, hard: 0, good: 0, easy: 0 };
  const jalur = new Set();
  let jatuhTempo = 0;
  let matang = 0;
  let intervalTertinggiMs = 0;
  let ditinjauTerakhirMs = 0;

  for (const kartu of daftar) {
    if (kartu.lineId) jalur.add(kartu.lineId);
    if (Number(kartu.dueAt) <= Number(sekarang)) jatuhTempo += 1;
    if ((Number(kartu.intervalMs) || 0) >= INTERVAL_MATANG_MS) matang += 1;
    intervalTertinggiMs = Math.max(intervalTertinggiMs, Number(kartu.intervalMs) || 0);
    if (kartu.lastReviewedAt) {
      ditinjauTerakhirMs = Math.max(ditinjauTerakhirMs, Number(kartu.lastReviewedAt) || 0);
    }
    if (kartu.lastGrade && nilai[kartu.lastGrade] !== undefined) nilai[kartu.lastGrade] += 1;
  }

  const dinilai = nilai.again + nilai.hard + nilai.good + nilai.easy;
  const benar = nilai.good + nilai.easy;

  let jalurTantangan = 0;
  let poinTantangan = 0;
  let streakTantangan = 0;
  for (const lineId of jalur) {
    const catatan = rekor?.[lineId];
    if (!catatan) continue;
    if (Number(catatan.poin) > 0 || Number(catatan.streakTerbaik) > 0) jalurTantangan += 1;
    poinTantangan += Number(catatan.poin) || 0;
    streakTantangan = Math.max(streakTantangan, Number(catatan.streakTerbaik) || 0);
  }

  return {
    jalur: jalur.size,
    posisi: daftar.length,
    jatuhTempo,
    matang,
    persenMatang: daftar.length ? Math.round((matang / daftar.length) * 100) : 0,
    dinilai,
    benar,
    akurasi: dinilai ? Math.round((benar / dinilai) * 100) : null,
    nilai,
    intervalTertinggiMs,
    ditinjauTerakhirMs: ditinjauTerakhirMs || null,
    tantangan: { jalur: jalurTantangan, poin: poinTantangan, streakTerbaik: streakTantangan },
  };
}

/**
 * Kelompokkan ringkasan jalur per pembukaan (ECO + nama) untuk halaman
 * bergaya "Garis 1/2": satu pembukaan bisa punya dua garis bila pengguna
 * melatih sisi Putih dan Hitam sekaligus.
 *
 * Urutan garis: Putih dulu, lalu Hitam; di dalam sisi yang sama, garis dengan
 * progres tertinggi tampil lebih dulu supaya stepper membuka yang termahir.
 */
export function kelompokkanPerPembukaan(jalurList = []) {
  const map = new Map();
  for (const jalur of Array.isArray(jalurList) ? jalurList : []) {
    if (!jalur || !jalur.lineId) continue;
    const kunci = `${jalur.eco}|${jalur.nama}`;
    let grup = map.get(kunci);
    if (!grup) {
      grup = { kunci, eco: jalur.eco, nama: jalur.nama, garis: [], jumlah: 0, jatuhTempo: 0 };
      map.set(kunci, grup);
    }
    grup.garis.push(jalur);
    grup.jumlah += Number(jalur.jumlah) || 0;
    grup.jatuhTempo += Number(jalur.jatuhTempo) || 0;
  }

  return [...map.values()]
    .map((grup) => {
      const urutanSisi = (jalur) => (jalur.warna === "w" ? 0 : 1);
      const garis = [...grup.garis].sort(
        (a, b) =>
          urutanSisi(a) - urutanSisi(b) || (Number(b.persen) || 0) - (Number(a.persen) || 0),
      );
      // Persen pembukaan = rata-rata berbobot jumlah posisi tiap garis.
      const berbobot = garis.reduce(
        (jumlah, baris) => jumlah + (Number(baris.persen) || 0) * (Number(baris.jumlah) || 0),
        0,
      );
      return {
        ...grup,
        garis,
        persen: grup.jumlah ? Math.round(berbobot / grup.jumlah) : 0,
      };
    })
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

/**
 * Posisi akhir sebuah jalur untuk pratinjau (papan statis di layar pemilihan).
 * Mengembalikan `null` bila jalur kosong atau ada langkah yang tidak sah —
 * papan lalu tidak ditampilkan, bukan menampilkan posisi yang menyesatkan.
 */
export function posisiAkhirJalur(moves) {
  const daftar = Array.isArray(moves) ? moves : [];
  if (!daftar.length) return null;
  const game = new Chess();
  let terakhir = null;
  const san = [];
  for (const uci of daftar) {
    const urai = uraiUci(uci);
    if (!urai) return null;
    try {
      const pindah = game.move(urai);
      terakhir = { from: pindah.from, to: pindah.to };
      san.push(pindah.san);
    } catch {
      return null;
    }
  }
  return { fen: game.fen(), terakhir, san };
}

export function kartuBerikutnya(kartu, lineId, sekarang = Date.now()) {
  return (
    kartu
      .filter((item) => item.lineId === lineId && Number(item.dueAt) <= sekarang)
      .sort((a, b) => Number(a.dueAt) - Number(b.dueAt) || a.ply - b.ply)[0] || null
  );
}
