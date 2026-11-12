import { Chess } from "chess.js";

export const KUNCI_HAPUS_BIDAK = "__hapus_bidak__";

/** Null when this FEN can represent a position reached by legal chess play. */
export function validasiPosisiSusun(fen) {
  try {
    const peta = petaDariFen(fen);
    const rajaPutih = Object.values(peta).filter((simbol) => simbol === "K").length;
    const rajaHitam = Object.values(peta).filter((simbol) => simbol === "k").length;
    if (rajaPutih !== 1 || rajaHitam !== 1) return "posisiPerluRaja";
    if (Object.entries(peta).some(([petak, simbol]) => simbol.toLowerCase() === "p" && /[18]$/.test(petak))) {
      return "posisiPionIlegal";
    }
    const game = new Chess(fen);
    const raja = { w: [], b: [] };
    for (const baris of game.board()) {
      for (const bidak of baris) {
        if (bidak?.type === "k") raja[bidak.color].push(bidak.square);
      }
    }
    const rajaLawan = game.turn() === "w" ? "b" : "w";
    if (game.isAttacked(raja[rajaLawan][0], game.turn())) return "posisiRajaDiserang";
    return null;
  } catch {
    return "posisiTidakSah";
  }
}

/** Ubah field susunan bidak FEN menjadi peta `petak -> simbol bidak`. */
export function petaDariFen(fen) {
  const posisi = String(fen || "").trim().split(/\s+/)[0] || "";
  const ranks = posisi.split("/");
  if (ranks.length !== 8) throw new Error("Susunan FEN harus memiliki delapan baris.");

  const peta = {};
  ranks.forEach((rank, y) => {
    let x = 0;
    for (const simbol of rank) {
      if (/^[1-8]$/.test(simbol)) {
        x += Number(simbol);
      } else if (/^[pnbrqkPNBRQK]$/.test(simbol)) {
        if (x > 7) throw new Error("Susunan FEN tidak valid.");
        peta[`${String.fromCharCode(97 + x)}${8 - y}`] = simbol;
        x += 1;
      } else {
        throw new Error("Susunan FEN berisi simbol bidak yang tidak dikenal.");
      }
    }
    if (x !== 8) throw new Error("Setiap baris FEN harus berisi delapan petak.");
  });
  return peta;
}

/** Bangun FEN posisi edit; hak rokade dan en passant direset demi konsistensi. */
export function fenDariPeta(peta, giliran = "w") {
  const ranks = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    let kosong = 0;
    let baris = "";
    for (let file = 0; file < 8; file += 1) {
      const simbol = peta[`${String.fromCharCode(97 + file)}${rank}`];
      if (simbol) {
        if (!/^[pnbrqkPNBRQK]$/.test(simbol)) {
          throw new Error("Simbol bidak tidak valid.");
        }
        if (kosong) baris += kosong;
        kosong = 0;
        baris += simbol;
      } else {
        kosong += 1;
      }
    }
    if (kosong) baris += kosong;
    ranks.push(baris);
  }
  return `${ranks.join("/")} ${giliran === "b" ? "b" : "w"} - - 0 1`;
}

/** Ubah satu petak tanpa memaksa posisi sementara menjadi posisi legal. */
export function aturBidak(fen, petak, simbol) {
  if (!/^[a-h][1-8]$/.test(petak)) return fen;
  const peta = petaDariFen(fen);
  if (simbol) peta[petak] = simbol;
  else delete peta[petak];
  return fenDariPeta(peta, String(fen).trim().split(/\s+/)[1]);
}


/** Ubah satu hak rokade pada field ketiga FEN tanpa alterasi field lain. */
export function aturHakRokade(fen, hak, ativo) {
  if (!["K", "Q", "k", "q"].includes(hak)) return fen;
  const ruas = String(fen || "").trim().split(/\s+/);
  if (ruas.length < 6) return fen;
  const hakSaatIni = ruas[2] === "-" ? "" : ruas[2];
  const hakBerikutnya = ativo
    ? [...new Set([...hakSaatIni, hak])].join("")
    : hakSaatIni.replace(hak, "");
  ruas[2] = hakBerikutnya
    ? "KQkq".split("").filter((simbol) => hakBerikutnya.includes(simbol)).join("")
    : "-";
  return ruas.join(" ");
}
