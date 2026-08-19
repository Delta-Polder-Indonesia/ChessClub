import React from "react";

/**
 * Bidak catur — mendukung 13 set bidak dari src/asets/.
 *
 * Huruf bidak: K Q R B N P = putih, k q r b n p = hitam.
 * Prop `set` menentukan gaya bidak (default: "bidak").
 */

/* ---------- set "bidak" (Chessnut — Alexis Luengas, Apache 2.0) ---------- */

import bidak_RK from "../../asets/bidak/raja-putih.svg";
import bidak_RQ from "../../asets/bidak/ratu-putih.svg";
import bidak_RB from "../../asets/bidak/benteng-putih.svg";
import bidak_RG from "../../asets/bidak/gajah-putih.svg";
import bidak_RKU from "../../asets/bidak/kuda-putih.svg";
import bidak_BP from "../../asets/bidak/bidak-putih.svg";
import bidak_rk from "../../asets/bidak/raja-hitam.svg";
import bidak_rq from "../../asets/bidak/ratu-hitam.svg";
import bidak_rb from "../../asets/bidak/benteng-hitam.svg";
import bidak_rg from "../../asets/bidak/gajah-hitam.svg";
import bidak_rku from "../../asets/bidak/kuda-hitam.svg";
import bidak_bp from "../../asets/bidak/bidak-hitam.svg";

/* ---------- set standar (wK/bK notation) ---------- */

// alpha
import alpha_wK from "../../asets/alpha/wK.svg";
import alpha_wQ from "../../asets/alpha/wQ.svg";
import alpha_wR from "../../asets/alpha/wR.svg";
import alpha_wB from "../../asets/alpha/wB.svg";
import alpha_wN from "../../asets/alpha/wN.svg";
import alpha_wP from "../../asets/alpha/wP.svg";
import alpha_bK from "../../asets/alpha/bK.svg";
import alpha_bQ from "../../asets/alpha/bQ.svg";
import alpha_bR from "../../asets/alpha/bR.svg";
import alpha_bB from "../../asets/alpha/bB.svg";
import alpha_bN from "../../asets/alpha/bN.svg";
import alpha_bP from "../../asets/alpha/bP.svg";

// california
import california_wK from "../../asets/california/wK.svg";
import california_wQ from "../../asets/california/wQ.svg";
import california_wR from "../../asets/california/wR.svg";
import california_wB from "../../asets/california/wB.svg";
import california_wN from "../../asets/california/wN.svg";
import california_wP from "../../asets/california/wP.svg";
import california_bK from "../../asets/california/bK.svg";
import california_bQ from "../../asets/california/bQ.svg";
import california_bR from "../../asets/california/bR.svg";
import california_bB from "../../asets/california/bB.svg";
import california_bN from "../../asets/california/bN.svg";
import california_bP from "../../asets/california/bP.svg";

// cardinal
import cardinal_wK from "../../asets/cardinal/wK.svg";
import cardinal_wQ from "../../asets/cardinal/wQ.svg";
import cardinal_wR from "../../asets/cardinal/wR.svg";
import cardinal_wB from "../../asets/cardinal/wB.svg";
import cardinal_wN from "../../asets/cardinal/wN.svg";
import cardinal_wP from "../../asets/cardinal/wP.svg";
import cardinal_bK from "../../asets/cardinal/bK.svg";
import cardinal_bQ from "../../asets/cardinal/bQ.svg";
import cardinal_bR from "../../asets/cardinal/bR.svg";
import cardinal_bB from "../../asets/cardinal/bB.svg";
import cardinal_bN from "../../asets/cardinal/bN.svg";
import cardinal_bP from "../../asets/cardinal/bP.svg";

// cburnett
import cburnett_wK from "../../asets/cburnett/wK.svg";
import cburnett_wQ from "../../asets/cburnett/wQ.svg";
import cburnett_wR from "../../asets/cburnett/wR.svg";
import cburnett_wB from "../../asets/cburnett/wB.svg";
import cburnett_wN from "../../asets/cburnett/wN.svg";
import cburnett_wP from "../../asets/cburnett/wP.svg";
import cburnett_bK from "../../asets/cburnett/bK.svg";
import cburnett_bQ from "../../asets/cburnett/bQ.svg";
import cburnett_bR from "../../asets/cburnett/bR.svg";
import cburnett_bB from "../../asets/cburnett/bB.svg";
import cburnett_bN from "../../asets/cburnett/bN.svg";
import cburnett_bP from "../../asets/cburnett/bP.svg";

// dubrovny
import dubrovny_wK from "../../asets/dubrovny/wK.svg";
import dubrovny_wQ from "../../asets/dubrovny/wQ.svg";
import dubrovny_wR from "../../asets/dubrovny/wR.svg";
import dubrovny_wB from "../../asets/dubrovny/wB.svg";
import dubrovny_wN from "../../asets/dubrovny/wN.svg";
import dubrovny_wP from "../../asets/dubrovny/wP.svg";
import dubrovny_bK from "../../asets/dubrovny/bK.svg";
import dubrovny_bQ from "../../asets/dubrovny/bQ.svg";
import dubrovny_bR from "../../asets/dubrovny/bR.svg";
import dubrovny_bB from "../../asets/dubrovny/bB.svg";
import dubrovny_bN from "../../asets/dubrovny/bN.svg";
import dubrovny_bP from "../../asets/dubrovny/bP.svg";

// gioco
import gioco_wK from "../../asets/gioco/wK.svg";
import gioco_wQ from "../../asets/gioco/wQ.svg";
import gioco_wR from "../../asets/gioco/wR.svg";
import gioco_wB from "../../asets/gioco/wB.svg";
import gioco_wN from "../../asets/gioco/wN.svg";
import gioco_wP from "../../asets/gioco/wP.svg";
import gioco_bK from "../../asets/gioco/bK.svg";
import gioco_bQ from "../../asets/gioco/bQ.svg";
import gioco_bR from "../../asets/gioco/bR.svg";
import gioco_bB from "../../asets/gioco/bB.svg";
import gioco_bN from "../../asets/gioco/bN.svg";
import gioco_bP from "../../asets/gioco/bP.svg";

// governor
import governor_wK from "../../asets/governor/wK.svg";
import governor_wQ from "../../asets/governor/wQ.svg";
import governor_wR from "../../asets/governor/wR.svg";
import governor_wB from "../../asets/governor/wB.svg";
import governor_wN from "../../asets/governor/wN.svg";
import governor_wP from "../../asets/governor/wP.svg";
import governor_bK from "../../asets/governor/bK.svg";
import governor_bQ from "../../asets/governor/bQ.svg";
import governor_bR from "../../asets/governor/bR.svg";
import governor_bB from "../../asets/governor/bB.svg";
import governor_bN from "../../asets/governor/bN.svg";
import governor_bP from "../../asets/governor/bP.svg";

// icpieces
import icpieces_wK from "../../asets/icpieces/wK.svg";
import icpieces_wQ from "../../asets/icpieces/wQ.svg";
import icpieces_wR from "../../asets/icpieces/wR.svg";
import icpieces_wB from "../../asets/icpieces/wB.svg";
import icpieces_wN from "../../asets/icpieces/wN.svg";
import icpieces_wP from "../../asets/icpieces/wP.svg";
import icpieces_bK from "../../asets/icpieces/bK.svg";
import icpieces_bQ from "../../asets/icpieces/bQ.svg";
import icpieces_bR from "../../asets/icpieces/bR.svg";
import icpieces_bB from "../../asets/icpieces/bB.svg";
import icpieces_bN from "../../asets/icpieces/bN.svg";
import icpieces_bP from "../../asets/icpieces/bP.svg";

// maestro
import maestro_wK from "../../asets/maestro/wK.svg";
import maestro_wQ from "../../asets/maestro/wQ.svg";
import maestro_wR from "../../asets/maestro/wR.svg";
import maestro_wB from "../../asets/maestro/wB.svg";
import maestro_wN from "../../asets/maestro/wN.svg";
import maestro_wP from "../../asets/maestro/wP.svg";
import maestro_bK from "../../asets/maestro/bK.svg";
import maestro_bQ from "../../asets/maestro/bQ.svg";
import maestro_bR from "../../asets/maestro/bR.svg";
import maestro_bB from "../../asets/maestro/bB.svg";
import maestro_bN from "../../asets/maestro/bN.svg";
import maestro_bP from "../../asets/maestro/bP.svg";

// merida
import merida_wK from "../../asets/merida/wK.svg";
import merida_wQ from "../../asets/merida/wQ.svg";
import merida_wR from "../../asets/merida/wR.svg";
import merida_wB from "../../asets/merida/wB.svg";
import merida_wN from "../../asets/merida/wN.svg";
import merida_wP from "../../asets/merida/wP.svg";
import merida_bK from "../../asets/merida/bK.svg";
import merida_bQ from "../../asets/merida/bQ.svg";
import merida_bR from "../../asets/merida/bR.svg";
import merida_bB from "../../asets/merida/bB.svg";
import merida_bN from "../../asets/merida/bN.svg";
import merida_bP from "../../asets/merida/bP.svg";

// staunty
import staunty_wK from "../../asets/staunty/wK.svg";
import staunty_wQ from "../../asets/staunty/wQ.svg";
import staunty_wR from "../../asets/staunty/wR.svg";
import staunty_wB from "../../asets/staunty/wB.svg";
import staunty_wN from "../../asets/staunty/wN.svg";
import staunty_wP from "../../asets/staunty/wP.svg";
import staunty_bK from "../../asets/staunty/bK.svg";
import staunty_bQ from "../../asets/staunty/bQ.svg";
import staunty_bR from "../../asets/staunty/bR.svg";
import staunty_bB from "../../asets/staunty/bB.svg";
import staunty_bN from "../../asets/staunty/bN.svg";
import staunty_bP from "../../asets/staunty/bP.svg";

// tatiana
import tatiana_wK from "../../asets/tatiana/wK.svg";
import tatiana_wQ from "../../asets/tatiana/wQ.svg";
import tatiana_wR from "../../asets/tatiana/wR.svg";
import tatiana_wB from "../../asets/tatiana/wB.svg";
import tatiana_wN from "../../asets/tatiana/wN.svg";
import tatiana_wP from "../../asets/tatiana/wP.svg";
import tatiana_bK from "../../asets/tatiana/bK.svg";
import tatiana_bQ from "../../asets/tatiana/bQ.svg";
import tatiana_bR from "../../asets/tatiana/bR.svg";
import tatiana_bB from "../../asets/tatiana/bB.svg";
import tatiana_bN from "../../asets/tatiana/bN.svg";
import tatiana_bP from "../../asets/tatiana/bP.svg";

/* ---------- peta bidak per set ---------- */

function petaSet(wK, wQ, wR, wB, wN, wP, bK, bQ, bR, bB, bN, bP) {
  return { K: wK, Q: wQ, R: wR, B: wB, N: wN, P: wP, k: bK, q: bQ, r: bR, b: bB, n: bN, p: bP };
}

const SET_PETA = {
  bidak: petaSet(
    bidak_RK, bidak_RQ, bidak_RB, bidak_RG, bidak_RKU, bidak_BP,
    bidak_rk, bidak_rq, bidak_rb, bidak_rg, bidak_rku, bidak_bp
  ),
  alpha: petaSet(alpha_wK, alpha_wQ, alpha_wR, alpha_wB, alpha_wN, alpha_wP, alpha_bK, alpha_bQ, alpha_bR, alpha_bB, alpha_bN, alpha_bP),
  california: petaSet(california_wK, california_wQ, california_wR, california_wB, california_wN, california_wP, california_bK, california_bQ, california_bR, california_bB, california_bN, california_bP),
  cardinal: petaSet(cardinal_wK, cardinal_wQ, cardinal_wR, cardinal_wB, cardinal_wN, cardinal_wP, cardinal_bK, cardinal_bQ, cardinal_bR, cardinal_bB, cardinal_bN, cardinal_bP),
  cburnett: petaSet(cburnett_wK, cburnett_wQ, cburnett_wR, cburnett_wB, cburnett_wN, cburnett_wP, cburnett_bK, cburnett_bQ, cburnett_bR, cburnett_bB, cburnett_bN, cburnett_bP),
  dubrovny: petaSet(dubrovny_wK, dubrovny_wQ, dubrovny_wR, dubrovny_wB, dubrovny_wN, dubrovny_wP, dubrovny_bK, dubrovny_bQ, dubrovny_bR, dubrovny_bB, dubrovny_bN, dubrovny_bP),
  gioco: petaSet(gioco_wK, gioco_wQ, gioco_wR, gioco_wB, gioco_wN, gioco_wP, gioco_bK, gioco_bQ, gioco_bR, gioco_bB, gioco_bN, gioco_bP),
  governor: petaSet(governor_wK, governor_wQ, governor_wR, governor_wB, governor_wN, governor_wP, governor_bK, governor_bQ, governor_bR, governor_bB, governor_bN, governor_bP),
  icpieces: petaSet(icpieces_wK, icpieces_wQ, icpieces_wR, icpieces_wB, icpieces_wN, icpieces_wP, icpieces_bK, icpieces_bQ, icpieces_bR, icpieces_bB, icpieces_bN, icpieces_bP),
  maestro: petaSet(maestro_wK, maestro_wQ, maestro_wR, maestro_wB, maestro_wN, maestro_wP, maestro_bK, maestro_bQ, maestro_bR, maestro_bB, maestro_bN, maestro_bP),
  merida: petaSet(merida_wK, merida_wQ, merida_wR, merida_wB, merida_wN, merida_wP, merida_bK, merida_bQ, merida_bR, merida_bB, merida_bN, merida_bP),
  staunty: petaSet(staunty_wK, staunty_wQ, staunty_wR, staunty_wB, staunty_wN, staunty_wP, staunty_bK, staunty_bQ, staunty_bR, staunty_bB, staunty_bN, staunty_bP),
  tatiana: petaSet(tatiana_wK, tatiana_wQ, tatiana_wR, tatiana_wB, tatiana_wN, tatiana_wP, tatiana_bK, tatiana_bQ, tatiana_bR, tatiana_bB, tatiana_bN, tatiana_bP),
};

export const DAFTAR_SET = [
  { id: "bidak", nama: "Chessnut" },
  { id: "alpha", nama: "Alpha" },
  { id: "california", nama: "California" },
  { id: "cardinal", nama: "Cardinal" },
  { id: "cburnett", nama: "CBurnett" },
  { id: "dubrovny", nama: "Dubrovny" },
  { id: "gioco", nama: "Gioco" },
  { id: "governor", nama: "Governor" },
  { id: "icpieces", nama: "ICPieces" },
  { id: "maestro", nama: "Maestro" },
  { id: "merida", nama: "Merida" },
  { id: "staunty", nama: "Staunty" },
  { id: "tatiana", nama: "Tatiana" },
];

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

export function ChessPiece({ piece, set = "merida", className = "w-full h-full" }) {
  const peta = SET_PETA[set] || SET_PETA.bidak;
  const sumber = piece ? peta[piece] : null;
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
