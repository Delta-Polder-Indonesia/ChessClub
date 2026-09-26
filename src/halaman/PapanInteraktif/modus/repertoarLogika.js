import { Chess } from "chess.js";

const HARI = 24 * 60 * 60 * 1000;
const SEPULUH_MENIT = 10 * 60 * 1000;

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
      intervalMs = Math.max(7 * HARI, intervalLama ? intervalLama * 2.5 : 0);
      repetitions = repetisi + 1;
      break;
    case "good":
    default:
      intervalMs = Math.max(3 * HARI, intervalLama ? intervalLama * 2 : 0);
      repetitions = repetisi + 1;
      break;
  }

  return {
    ...kartu,
    dueAt: sekarang + intervalMs,
    intervalMs,
    repetitions,
    lastGrade: nilai,
    lastReviewedAt: sekarang,
  };
}

export function kartuBerikutnya(kartu, lineId, sekarang = Date.now()) {
  return (
    kartu
      .filter((item) => item.lineId === lineId && Number(item.dueAt) <= sekarang)
      .sort((a, b) => Number(a.dueAt) - Number(b.dueAt) || a.ply - b.ply)[0] || null
  );
}
