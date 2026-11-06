/**
 * Penerjemah posisi Teka-Teki ke PGN untuk halaman Analisa.
 * Murni: hanya chess.js + data soal, tanpa React.
 */
import { Chess } from "chess.js";
import { parseLangkah } from "../../../lib/tekaTeki.js";

/**
 * Susun teks PGN standar (lengkap dengan SetUp + FEN) untuk dikirim ke Papan
 * Analisa. Mengembalikan "" bila soal tidak dapat dipetakan ke PGN.
 */
export function bangunPgnUntukAnalisa(m) {
  if (!m) return "";
  if (m.pgnAnalisa) return m.pgnAnalisa;
  try {
    const catur = new Chess(m.fen);
    for (const teks of String(m.moves || "").split(";").filter(Boolean)) {
      const { from, to, promo } = parseLangkah(teks);
      catur.move({ from, to, ...(promo ? { promotion: promo } : {}) });
    }
    const header = [
      `[Event "${(m.judulSoal || m.turnamen || `Teka-Teki #${m.problemid}`).replace(/"/g, "'")}"]`,
      `[White "${(m.pemainPutih || "Putih").replace(/"/g, "'")}"]`,
      `[Black "${(m.pemainHitam || "Hitam").replace(/"/g, "'")}"]`,
      ...(m.eloPutih ? [`[WhiteElo "${m.eloPutih}"]`] : []),
      ...(m.eloHitam ? [`[BlackElo "${m.eloHitam}"]`] : []),
      `[SetUp "1"]`,
      `[FEN "${m.fen}"]`,
      `[Result "*"]`,
    ];
    const langkahPgn = catur.pgn().replace(/^\[[^\]]*\]\s*/gm, "").trim();
    return `${header.join("\n")}\n\n${langkahPgn || "*"}`;
  } catch {
    return "";
  }
}
