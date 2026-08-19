import React from "react";

/**
 * Bidak catur bergaya ala chess.com — set "Chessnut" karya Alexis Luengas
 * (lisensi Apache 2.0, lihat src/asets/bidak/README.md).
 *
 * Huruf bidak: K Q R B N P = putih, k q r b n p = hitam.
 */

import rajaPutih from "../../asets/bidak/raja-putih.svg";
import ratuPutih from "../../asets/bidak/ratu-putih.svg";
import bentengPutih from "../../asets/bidak/benteng-putih.svg";
import gajahPutih from "../../asets/bidak/gajah-putih.svg";
import kudaPutih from "../../asets/bidak/kuda-putih.svg";
import bidakPutih from "../../asets/bidak/bidak-putih.svg";
import rajaHitam from "../../asets/bidak/raja-hitam.svg";
import ratuHitam from "../../asets/bidak/ratu-hitam.svg";
import bentengHitam from "../../asets/bidak/benteng-hitam.svg";
import gajahHitam from "../../asets/bidak/gajah-hitam.svg";
import kudaHitam from "../../asets/bidak/kuda-hitam.svg";
import bidakHitam from "../../asets/bidak/bidak-hitam.svg";

const PETA_BIDAK = {
  K: rajaPutih,
  Q: ratuPutih,
  R: bentengPutih,
  B: gajahPutih,
  N: kudaPutih,
  P: bidakPutih,
  k: rajaHitam,
  q: ratuHitam,
  r: bentengHitam,
  b: gajahHitam,
  n: kudaHitam,
  p: bidakHitam,
};

const NAMA_BIDAK = {
  K: "Raja putih",
  Q: "Menteri putih",
  R: "Benteng putih",
  B: "Gajah putih",
  N: "Kuda putih",
  P: "Bidak putih",
  k: "Raja hitam",
  q: "Menteri hitam",
  r: "Benteng hitam",
  b: "Gajah hitam",
  n: "Kuda hitam",
  p: "Bidak hitam",
};

export function ChessPiece({ piece, className = "w-full h-full" }) {
  const sumber = piece ? PETA_BIDAK[piece] : null;
  if (!sumber) return null;
  return (
    <img
      src={sumber}
      alt={NAMA_BIDAK[piece]}
      className={className}
      draggable={false}
    />
  );
}
