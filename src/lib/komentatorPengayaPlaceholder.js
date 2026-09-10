import { komentatorPapan as enPapan } from "./terjemahan/en/komentator.js";

const PETA_PLACEHOLDER = {
  side: "pihak",
  opponent: "lawan",
  piece: "bidak",
  square: "petak",
  victim: "korban",
  opening: "pembukaan",
  leading: "unggul",
  value: "nilai",
  mate: "mat",
  suggestion: "saran",
};

function normalisasi(teks) {
  return teks.replace(/\{(side|opponent|piece|square|victim|opening|leading|value|mate|suggestion)\}/g, (_, kunci) => `{${PETA_PLACEHOLDER[kunci]}}`);
}

for (const gaya of Object.values(enPapan)) {
  if (!gaya || typeof gaya !== "object") continue;
  for (const kategori of Object.values(gaya)) {
    if (!Array.isArray(kategori)) continue;
    for (let i = 0; i < kategori.length; i += 1) {
      if (typeof kategori[i] === "string") kategori[i] = normalisasi(kategori[i]);
    }
  }
}
