const PENGGANTI_PENUH = new Map([
  ["Queen's Pawn Game: Veresov, Richter Attack", "Richter-Veresov Attack"],
  [
    "Indian Defense: King's Indian Variation, Fianchetto Variation",
    "King's Indian Defense: Fianchetto Variation",
  ],
  ["Queen's Pawn, Mengarini Attack", "Queen's Pawn Game: Mengarini Attack"],
  [
    "Italian Game: Giuoco Pianissimo, Normal",
    "Italian Game: Giuoco Pianissimo, Normal Variation",
  ],
  [
    "Sicilian Defense: French Variation, Normal",
    "Sicilian Defense: French Variation, Normal Variation",
  ],
  [
    "Sicilian Defense: French Variation, Open",
    "Sicilian Defense: French Variation, Open Variation",
  ],
  [
    "Sicilian Defense: Closed, Traditional",
    "Closed Sicilian: Traditional Variation",
  ],
]);

const PENGGANTI_KELUARGA = [
  {
    dari: "Queen's Pawn Game: Accelerated London System",
    ke: "London System: Accelerated Variation",
  },
  {
    dari: "Indian Defense: Accelerated London System",
    ke: "London System: Accelerated Variation",
  },
  { dari: "Queen's Pawn Game: London System", ke: "London System" },
  { dari: "Indian Defense: London System", ke: "London System" },
  { dari: "Queen's Pawn Game: Colle System", ke: "Colle System" },
  { dari: "Indian Defense: Colle System", ke: "Colle System" },
  { dari: "Queen's Pawn Game: Torre Attack", ke: "Torre Attack" },
  { dari: "Queen's Pawn Game: Barry Attack", ke: "Barry Attack" },
  { dari: "Queen's Pawn Game: Stonewall Attack", ke: "Stonewall Attack" },
  { dari: "Queen's Pawn Game: Veresov Attack", ke: "Veresov Attack" },
  {
    dari: "Indian Defense: Budapest Gambit Accepted",
    ke: "Budapest Gambit Accepted",
  },
  { dari: "Indian Defense: Budapest Gambit", ke: "Budapest Gambit" },
  { dari: "Indian Defense: Budapest Defense", ke: "Budapest Defense" },
  { dari: "Indian Defense: Anti-Grünfeld", ke: "Anti-Grünfeld Defense" },
  {
    dari: "Indian Defense: Gibbins-Weidenhagen Gambit Accepted",
    ke: "Gibbins-Weidenhagen Gambit Accepted",
  },
  {
    dari: "Indian Defense: Gibbins-Weidenhagen Gambit",
    ke: "Gibbins-Weidenhagen Gambit",
  },
  {
    dari: "Indian Defense: Dzindzi-Indian Defense",
    ke: "Dzindzi-Indian Defense",
  },
  { dari: "Indian Defense: West Indian Defense", ke: "West Indian Defense" },
  { dari: "Indian Defense: Czech-Indian", ke: "Czech-Indian Defense" },
  { dari: "Indian Defense: Spielmann-Indian", ke: "Spielmann-Indian Defense" },
  { dari: "Sicilian Defense: Closed", ke: "Closed Sicilian" },
  { dari: "Sicilian Defense: Old Sicilian", ke: "Old Sicilian" },
];

const POLA_AKHIR_STANDAR =
  /( Line| Variation| Gambit| Attack| Defense| Defence| System| Opening| Game| Accepted| Declined)$/;

function gabungTurunan(namaDasar, turunan) {
  if (!turunan) return namaDasar;
  return namaDasar.includes(":")
    ? `${namaDasar}, ${turunan}`
    : `${namaDasar}: ${turunan}`;
}

function gantiKeluarga(nama) {
  for (const aturan of PENGGANTI_KELUARGA) {
    if (nama === aturan.dari) return aturan.ke;
    const awal = `${aturan.dari}, `;
    if (nama.startsWith(awal)) {
      return gabungTurunan(aturan.ke, nama.slice(awal.length));
    }
  }
  return nama;
}

function rapikanNamaBarisDenganWith(nama) {
  const adaDengan = /\bwith\b/.test(nama);
  if (!adaDengan) return nama;

  let hasil = nama
    .replace(/, with \.\. /g, ", ...")
    .replace(/: with \.\. /g, ": ...")
    .replace(/, with /g, ", ")
    .replace(/: with /g, ": ");

  if (!POLA_AKHIR_STANDAR.test(hasil)) hasil += " Line";
  return hasil;
}

function rapikanKeluargaTanpaTitikDua(nama) {
  const cocok = nama.match(
    /^(King's Indian Attack|London System|Polish Opening|Queen's Indian Defense|Rapport-Jobava System|Vienna Gambit),\s+(.+)$/
  );
  if (!cocok) return nama;
  return `${cocok[1]}: ${cocok[2]}`;
}

export function standarkanNamaPembukaan(input) {
  let nama = String(input || "").trim();
  if (!nama) return nama;

  nama = PENGGANTI_PENUH.get(nama) || nama;
  nama = gantiKeluarga(nama);
  nama = rapikanNamaBarisDenganWith(nama);
  nama = rapikanKeluargaTanpaTitikDua(nama);
  nama = nama.replace(/\bModern Variations\b/g, "Modern Variation");
  nama = nama.replace(/, Normal$/g, ", Normal Variation");
  nama = nama.replace(/: Normal$/g, ": Normal Variation");
  return nama;
}

export function normalkanPohonPembukaan(node) {
  if (!node || typeof node !== "object") return node;

  const hasil = { ...node };
  if (Array.isArray(node.n)) {
    hasil.n = node.n.map(([eco, nama, stat]) => [
      eco,
      standarkanNamaPembukaan(nama),
      stat,
    ]);
  }

  if (node.c && typeof node.c === "object") {
    hasil.c = Object.fromEntries(
      Object.entries(node.c).map(([kunci, anak]) => [
        kunci,
        normalkanPohonPembukaan(anak),
      ])
    );
  }

  return hasil;
}
