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
