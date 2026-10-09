import { useState } from "react";
import { KUNCI_GAYA, KUNCI_NYALA, GAYA_KOMENTATOR } from "../lib/komentator.js";

function bacaSimpanan(kunci, bawaan) {
  try {
    const nilai = localStorage.getItem(kunci);
    return nilai === null ? bawaan : nilai;
  } catch {
    return bawaan;
  }
}

function tulisSimpanan(kunci, nilai) {
  try {
    localStorage.setItem(kunci, nilai);
  } catch {
    /* mode privat / kuota penuh — abaikan */
  }
}

/** Hook preferensi komentator (nyala + gaya), dipakai kartu dan pemanggilnya. */
export function usePreferensiKomentator() {
  const [nyala, setNyalaState] = useState(() => bacaSimpanan(KUNCI_NYALA, "1") !== "0");
  const [gaya, setGayaState] = useState(() => {
    const g = bacaSimpanan(KUNCI_GAYA, "santai");
    return GAYA_KOMENTATOR.includes(g) ? g : "santai";
  });
  const setNyala = (v) => {
    setNyalaState(v);
    tulisSimpanan(KUNCI_NYALA, v ? "1" : "0");
  };
  const setGaya = (g) => {
    if (!GAYA_KOMENTATOR.includes(g)) return;
    setGayaState(g);
    tulisSimpanan(KUNCI_GAYA, g);
  };
  return { nyala, setNyala, gaya, setGaya };
}
