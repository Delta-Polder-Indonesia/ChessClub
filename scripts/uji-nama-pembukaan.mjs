import { readFile } from "node:fs/promises";
import {
  normalkanPohonPembukaan,
  standarkanNamaPembukaan,
} from "../src/lib/namaPembukaan.js";

let gagal = 0;
const cek = (pesan, kondisi) => {
  if (kondisi) {
    console.log(`  ✓ ${pesan}`);
  } else {
    gagal += 1;
    console.error(`  ✗ ${pesan}`);
  }
};

console.log("standarkanNamaPembukaan — kasus representatif:");
cek(
  "Queen's Pawn Game: London System → London System",
  standarkanNamaPembukaan("Queen's Pawn Game: London System") ===
    "London System"
);
cek(
  "Accelerated London tetap hierarkis dan rapi",
  standarkanNamaPembukaan(
    "Queen's Pawn Game: Accelerated London System, Steinitz Countergambit"
  ) === "London System: Accelerated Variation, Steinitz Countergambit"
);
cek(
  "Budapest di bawah Indian Defense dibakukan",
  standarkanNamaPembukaan("Indian Defense: Budapest Gambit Accepted, Main Line") ===
    "Budapest Gambit Accepted: Main Line"
);
cek(
  "baris 'with' jadi 'Line' yang lebih standar",
  standarkanNamaPembukaan("Queen's Indian Defense, with e3, Bb4+ Line") ===
    "Queen's Indian Defense: e3, Bb4+ Line"
);
cek(
  "Closed Sicilian dibakukan",
  standarkanNamaPembukaan("Sicilian Defense: Closed, Traditional") ===
    "Closed Sicilian: Traditional Variation"
);
cek(
  "Normal → Normal Variation",
  standarkanNamaPembukaan("Italian Game: Giuoco Pianissimo, Normal") ===
    "Italian Game: Giuoco Pianissimo, Normal Variation"
);
cek(
  "Modern Variations → Modern Variation",
  standarkanNamaPembukaan("Sicilian Defense: Modern Variations, Main Line") ===
    "Sicilian Defense: Modern Variation, Main Line"
);
cek(
  "nama yang sudah standar tetap utuh",
  standarkanNamaPembukaan("Scotch Game: Classical Variation") ===
    "Scotch Game: Classical Variation"
);

console.log("normalkanPohonPembukaan — pohon legacy ikut dibakukan:");
{
  const pohon = normalkanPohonPembukaan({
    n: [["D00", "Queen's Pawn Game: London System", null]],
    c: {
      d2d4: {
        n: [["B20", "Sicilian Defense: Closed, Traditional", null]],
      },
    },
  });
  cek("nama akar dibakukan", pohon.n?.[0]?.[1] === "London System");
  cek(
    "nama anak dibakukan",
    pohon.c?.d2d4?.n?.[0]?.[1] === "Closed Sicilian: Traditional Variation"
  );
}

const POLA_TERLARANG = [
  /^Queen's Pawn Game: (Accelerated London System|London System|Colle System|Torre Attack|Barry Attack|Stonewall Attack|Veresov Attack)\b/,
  /^Indian Defense: (Accelerated London System|Budapest Defense|Budapest Gambit(?: Accepted)?|Anti-Grünfeld|Colle System|Czech-Indian|Dzindzi-Indian Defense|Gibbins-Weidenhagen Gambit(?: Accepted)?|London System|Spielmann-Indian|West Indian Defense)\b/,
  /^Queen's Pawn, Mengarini Attack$/,
  /, with /,
  /: with /,
  /\bModern Variations\b/,
  /, Normal$/,
];

console.log("audit public/data/buku-pembukaan.json — pola non-standar utama harus hilang:");
{
  const data = JSON.parse(
    await readFile(new URL("../public/data/buku-pembukaan.json", import.meta.url), "utf8")
  );
  const nama = [...new Set(data.map((item) => item.opening).filter(Boolean))];
  const sisa = nama.filter((item) => POLA_TERLARANG.some((pola) => pola.test(item)));
  cek("tidak ada pola non-standar yang tersisa", sisa.length === 0);
}

console.log("audit public/data/teka-teki.json — nama pembukaan konsisten dengan explorer:");
{
  const data = JSON.parse(
    await readFile(new URL("../public/data/teka-teki.json", import.meta.url), "utf8")
  );
  const nama = [
    ...new Set((data.problems || []).map((item) => item.pembukaan).filter(Boolean)),
  ];
  const sisa = nama.filter((item) => POLA_TERLARANG.some((pola) => pola.test(item)));
  cek("tidak ada pola non-standar yang tersisa di teka-teki", sisa.length === 0);
}

if (gagal) {
  console.error(`\n${gagal} pemeriksaan gagal.`);
  process.exit(1);
}
console.log("\nSemua pemeriksaan nama pembukaan lulus.");
