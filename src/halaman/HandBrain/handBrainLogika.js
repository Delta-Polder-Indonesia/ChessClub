/**
 * Logika murni mode Hand & Brain (varian lokal, dua pemain di satu perangkat).
 *
 * Aturan:
 *  1. Setiap giliran, sistem MENGUNDI satu jenis bidak dari bidak yang punya
 *     langkah legal untuk pihak yang sedang bergiliran.
 *  2. Pemain hanya boleh memindahkan bidak berjenis undian itu.
 *  3. Karena undian hanya diambil dari jenis yang punya langkah legal, pemain
 *     tidak pernah terjebak tanpa langkah. Sisa aturan catur (skak, mat,
 *     remis) tetap dijalankan chess.js.
 *  4. Promosi otomatis ke ratu (varian cepat; tidak ada dialog pilihan).
 *
 * State partai = { langkah: string[] (UCI), jenis: string|null }. Papan selalu
 * dibangun ulang dari `langkah` supaya histori utuh dan deteksi pengulangan
 * posisi (remis tiga kali) tetap benar. Modul ini tanpa React/DOM agar bisa
 * diuji di Node dan dipakai langsung oleh UI.
 */
import { Chess } from "chess.js";

/** Urutan tetap jenis bidak (kode chess.js). */
export const JENIS_BIDAK = ["p", "n", "b", "r", "q", "k"];

/** Bangun papan dengan histori penuh dari daftar langkah UCI. */
export function papanDariLangkah(langkah) {
  const game = new Chess();
  for (const uci of langkah) {
    game.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci.length > 4 ? { promotion: uci[4] } : {}),
    });
  }
  return game;
}

/** Jenis bidak (kode chess.js) yang punya langkah legal di posisi `fen`. */
export function jenisBerlangkah(fen) {
  const game = new Chess(fen);
  const ada = new Set(game.moves({ verbose: true }).map((m) => m.piece));
  return JENIS_BIDAK.filter((j) => ada.has(j));
}

/**
 * Undi jenis bidak untuk giliran ini: seragam di antara jenis yang punya
 * langkah legal. Mengembalikan null bila tidak ada langkah (partai selesai).
 * `rng` dapat diganti untuk pengujian deterministik.
 */
export function undiJenis(fen, rng = Math.random) {
  const pilihan = jenisBerlangkah(fen);
  if (pilihan.length === 0) return null;
  const indeks = Math.min(pilihan.length - 1, Math.floor(rng() * pilihan.length));
  return pilihan[indeks];
}

/** Partai baru dari posisi awal, dengan undian pertama. */
export function buatPartai(rng = Math.random) {
  const fen = new Chess().fen();
  return { langkah: [], jenis: undiJenis(fen, rng) };
}

/** Status akhir partai untuk posisi `game`. */
export function statusPartai(game) {
  if (game.isCheckmate()) {
    return { selesai: true, hasil: "skakmat", pemenang: game.turn() === "w" ? "b" : "w" };
  }
  if (game.isDraw()) return { selesai: true, hasil: "seri", pemenang: null };
  return { selesai: false, hasil: null, pemenang: null };
}

/**
 * Coba mainkan langkah dari `dari` ke `ke` oleh pemain yang sedang bergiliran.
 *
 * @returns {{ok: true, partai: object, san: string, status: object}
 *   | {ok: false, alasan: "selesai"|"jenis"|"tidak-legal"}}
 *   `alasan: "jenis"` = langkah legal tetapi bukan jenis bidak undian.
 */
export function mainkanLangkah(partai, dari, ke, rng = Math.random) {
  const game = papanDariLangkah(partai.langkah);
  if (game.isGameOver()) return { ok: false, alasan: "selesai" };

  const sesuai = game.moves({ verbose: true }).filter((m) => m.from === dari && m.to === ke);
  if (sesuai.length === 0) return { ok: false, alasan: "tidak-legal" };

  const milikJenis = sesuai.filter((m) => m.piece === partai.jenis);
  if (milikJenis.length === 0) return { ok: false, alasan: "jenis" };

  // Promosi: pilih opsi ratu (chess.js mengurutkan kuda lebih dulu, jadi
  // jangan ambil elemen pertama — lihat catatan aturan no. 4).
  const kandidat = milikJenis.find((m) => !m.promotion || m.promotion === "q");
  const promosi = kandidat.promotion ? "q" : "";
  const uci = `${dari}${ke}${promosi}`;

  // Pakai ulang papan yang sudah berhistori (tanpa replay ulang seluruh partai).
  game.move({ from: dari, to: ke, ...(promosi ? { promotion: promosi } : {}) });
  const langkahBaru = [...partai.langkah, uci];
  const status = statusPartai(game);
  const jenisBaru = status.selesai ? null : undiJenis(game.fen(), rng);

  return {
    ok: true,
    partai: { langkah: langkahBaru, jenis: jenisBaru },
    san: kandidat.san,
    status,
  };
}

/** Semua langkah legal bidak berjenis `jenis` untuk posisi partai (verbose). */
export function langkahDiizinkan(partai) {
  if (!partai.jenis) return [];
  const game = papanDariLangkah(partai.langkah);
  return game.moves({ verbose: true }).filter((m) => m.piece === partai.jenis);
}
