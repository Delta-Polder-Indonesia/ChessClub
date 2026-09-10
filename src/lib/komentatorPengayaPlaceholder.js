import { komentatorPapan as enPapan } from "./terjemahan/en/komentator.js";

const TAMBAHAN_EN = {
  santai: {
    biasa: ["{pihak} keeps the move simple with {san}.", "{san} keeps the position moving without forcing anything."],
    buku: ["{san} is still part of the known {pembukaan} line."],
    tangkap: ["{pihak} takes {korban} on {petak}; the material count changes."],
    tangkapUntung: ["{pihak} comes out ahead after taking {korban} on {petak}."],
    skak: ["{pihak} gives check with {san}, so {lawan} has to respond."],
  },
  formal: {
    biasa: ["{pihak} plays {san}, maintaining the current structure."],
  },
};

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

function tambahkan(target, tambahan) {
  for (const [gaya, kategori] of Object.entries(tambahan)) {
    if (!target[gaya]) continue;
    for (const [kunci, kalimat] of Object.entries(kategori)) {
      if (!Array.isArray(target[gaya][kunci])) continue;
      target[gaya][kunci].push(...kalimat);
    }
  }
}

function normalisasi(teks) {
  return teks.replace(/\{(side|opponent|piece|square|victim|opening|leading|value|mate|suggestion)\}/g, (_, kunci) => `{${PETA_PLACEHOLDER[kunci]}}`);
}

tambahkan(enPapan, TAMBAHAN_EN);

for (const gaya of Object.values(enPapan)) {
  if (!gaya || typeof gaya !== "object") continue;
  for (const kategori of Object.values(gaya)) {
    if (!Array.isArray(kategori)) continue;
    for (let i = 0; i < kategori.length; i += 1) {
      if (typeof kategori[i] === "string") kategori[i] = normalisasi(kategori[i]);
    }
  }
}
