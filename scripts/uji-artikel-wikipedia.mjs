/**
 * Uji logika pemilihan artikel Wikipedia untuk pembukaan (tanpa jaringan).
 *
 * Fixture di bawah adalah cuplikan respons nyata dari Action API
 * en.wikipedia.org (generator=search + prop=extracts). Uji ini memastikan
 * kandidat yang tepat terpilih untuk kasus yang rawan meleset:
 *  - ejaan Inggris ("Sicilian Defense" → artikel "Sicilian Defence"),
 *  - nama artikel yang berbeda ("Wayward Queen Attack" → "Danvers Opening"),
 *  - variasi vs artikel keluarga yang lebih umum ("Open Game"),
 *  - nama yang tidak punya artikel → null.
 *
 * Jalankan: node scripts/uji-artikel-wikipedia.mjs  (keluar 1 bila gagal)
 */
import {
  tokenKata,
  pecahNamaPembukaan,
  pilihKandidat,
  ambilArtikelPembukaan,
} from "../src/lib/artikelWikipedia.js";

let gagal = 0;
const cek = (pesan, kondisi) => {
  if (kondisi) {
    console.log(`  ✓ ${pesan}`);
  } else {
    gagal += 1;
    console.error(`  ✗ ${pesan}`);
  }
};

console.log("tokenKata — normalisasi kata:");
cek(
  "ejaan Inggris disamakan (defence → defense)",
  JSON.stringify(tokenKata("Caro–Kann Defence")) ===
    JSON.stringify(["caro", "kann", "defense"])
);
cek(
  "posesif dan tanda baca dibuang",
  JSON.stringify(tokenKata("King's Pawn Game")) ===
    JSON.stringify(["king", "pawn", "game"])
);

console.log("pecahNamaPembukaan — keluarga vs variasi:");
{
  const { keluarga, variasi } = pecahNamaPembukaan(
    "Sicilian Defense: Najdorf Variation"
  );
  cek(
    "keluarga = teks sebelum titik dua",
    JSON.stringify(keluarga) === JSON.stringify(["sicilian", "defense"])
  );
  cek(
    "variasi = teks setelah titik dua",
    JSON.stringify(variasi) === JSON.stringify(["najdorf", "variation"])
  );
}

console.log("pilihKandidat — kasus respons API nyata:");

/* 1 — nama persis ada artikelnya; artikel umum "Open Game" jadi penggoda. */
{
  const terbaik = pilihKandidat(
    [
      {
        index: 1,
        title: "King's Pawn Game",
        extract:
          "The King's Pawn Game is any chess opening starting with the move: 1. e4. It is the most popular opening move in chess, followed by 1.d4, the Queen's Pawn Game.",
      },
      {
        index: 2,
        title: "Open Game",
        extract:
          "Open Game (or Double King's Pawn Opening) is a generic term for a family of chess openings beginning with the moves: 1. e4 e5. Other responses to 1.e4 are termed Semi-Open Games.",
      },
    ],
    "King's Pawn Game"
  );
  cek("King's Pawn Game → artikelnya sendiri", terbaik?.title === "King's Pawn Game");
}

/* 2 — ejaan Amerika vs Inggris + kandidat tak relevan. */
{
  const terbaik = pilihKandidat(
    [
      {
        index: 1,
        title: "Caro–Kann Defence",
        extract:
          "The Caro–Kann Defence is a chess opening beginning with the moves: 1. e4 c6. Black prepares to contest the centre with 2...d5. It is a common defence against 1.e4.",
      },
      {
        index: 2,
        title: "List of chess gambits",
        extract:
          "This is a list of chess openings that are gambits. The gambits are organized into sections by the parent chess opening.",
      },
      {
        index: 3,
        title: "Scandinavian Defense",
        extract:
          "The Scandinavian Defense (or Center Counter Defense, or Center Counter Game) is a chess opening beginning with the moves: 1. e4 d5.",
      },
    ],
    "Caro-Kann Defense"
  );
  cek("Caro-Kann Defense → Caro–Kann Defence", terbaik?.title === "Caro–Kann Defence");
}

/* 3 — artikel variasi bernama lain: judul tak cocok, tetapi isinya
       menyebut "Wayward Queen Attack" sebagai alias. */
{
  const terbaik = pilihKandidat(
    [
      {
        index: 1,
        title: "Open Game",
        extract:
          "Open Game (or Double King's Pawn Opening) is a generic term for a family of chess openings beginning with the moves: 1. e4 e5.",
      },
      {
        index: 2,
        title: "Danvers Opening",
        extract:
          "The Danvers Opening is an unorthodox chess opening characterized by the moves: 1. e4 e5 2. Qh5. It is also known as the Kentucky Opening, Queen's Attack, Queen's Excursion, Wayward Queen Attack, Patzer Opening, and Parham Attack.",
      },
      {
        index: 3,
        title: "Sicilian Defence",
        extract:
          "The Sicilian Defence is a chess opening that begins with the following moves: 1. e4 c5.",
      },
    ],
    "King's Pawn Game: Wayward Queen Attack"
  );
  cek(
    "King's Pawn Game: Wayward Queen Attack → Danvers Opening",
    terbaik?.title === "Danvers Opening"
  );
}

/* 4 — artikel variasi spesifik harus menang atas artikel keluarga. */
{
  const terbaik = pilihKandidat(
    [
      {
        index: 1,
        title: "Sicilian Defence, Najdorf Variation",
        extract:
          "The Najdorf Variation is a variation of the Sicilian Defence that begins with the moves: 1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6.",
      },
      {
        index: 2,
        title: "Sicilian Defence",
        extract:
          "The Sicilian Defence is a chess opening that begins with the following moves: 1. e4 c5. The earliest recorded notes on the Sicilian Defence date back to the late 16th century.",
      },
    ],
    "Sicilian Defense: Najdorf Variation"
  );
  cek(
    "Sicilian Defense: Najdorf Variation → artikel variasinya",
    terbaik?.title === "Sicilian Defence, Najdorf Variation"
  );
}

/* 5 — nama tanpa artikel relevan → null (bukan artikel acak). */
{
  const terbaik = pilihKandidat(
    [
      {
        index: 1,
        title: "Sicilian Defence",
        extract:
          "The Sicilian Defence is a chess opening that begins with the following moves: 1. e4 c5.",
      },
    ],
    "Ular Kabung Serpent Attack"
  );
  cek("nama tak dikenal → null", terbaik === null);
}

/* ------------------------------------------------------------------ */
console.log("alur ambilArtikelPembukaan — dengan fetch stub:");

const permintaanStub = [];

const EN_HALAMAN = (judul, isi, ekstra = {}) => ({
  title: judul,
  extract: isi,
  fullurl: `https://en.wikipedia.org/wiki/${judul.replace(/ /g, "_")}`,
  ...ekstra,
});

const STUB = {
  "en|Sicilian Defense": {
    pages: {
      1: {
        index: 1,
        ...EN_HALAMAN(
          "Sicilian Defence",
          "The Sicilian Defence is a chess opening that begins with the following moves:\n\n1. e4 c5",
          { langlinks: [{ lang: "id", "*": "Pertahanan Sisilia" }] }
        ),
      },
    },
  },
  "id|Pertahanan Sisilia": {
    pages: {
      2: {
        title: "Pertahanan Sisilia",
        extract:
          "Pertahanan Sisilia adalah pembukaan catur yang dimulai dengan gerakan berikut:\n\n1. e4 c5",
        fullurl: "https://id.wikipedia.org/wiki/Pertahanan_Sisilia",
      },
    },
  },
  "en|King's Pawn Game": {
    pages: {
      3: {
        index: 1,
        ...EN_HALAMAN(
          "King's Pawn Game",
          "The King's Pawn Game is any chess opening starting with the move:\n\n1. e4\nIt is the most popular opening move in chess."
        ),
      },
      4: {
        index: 2,
        ...EN_HALAMAN(
          "Open Game",
          "Open Game is a generic term for a family of chess openings beginning with the moves 1. e4 e5."
        ),
      },
    },
  },
  "en|Scotch Game": {
    pages: {
      5: {
        index: 1,
        ...EN_HALAMAN(
          "Scotch Game",
          "The Scotch Game is a chess opening strategy.\n\n1. e4 e5 2. Nf3 Nc6 3. d4"
        ),
      },
    },
  },
};

globalThis.fetch = async (url, opsi = {}) => {
  const u = new URL(String(url));
  permintaanStub.push(u.hostname + u.search);
  if (u.hostname === "en.wikipedia.org") {
    const kunci = `en|${u.searchParams.get("gsrsearch")}`;
    if (!STUB[kunci]) throw new Error(`stub tak mengenal ${kunci}`);
    return { ok: true, json: async () => ({ query: STUB[kunci] }) };
  }
  if (u.hostname === "id.wikipedia.org") {
    const kunci = `id|${u.searchParams.get("titles")}`;
    if (!STUB[kunci]) throw new Error(`stub tak mengenal ${kunci}`);
    return { ok: true, json: async () => ({ query: STUB[kunci] }) };
  }
  if (u.hostname === "translate.googleapis.com") {
    const q = new URLSearchParams(opsi.body || "").get("q") ?? u.searchParams.get("q");
    // Skenario gagal: penerjemah menolak teks "Scotch Game".
    if (String(q).includes("Scotch Game")) throw new Error("penerjemah padam");
    return {
      ok: true,
      json: async () => [[[`ID·${q}`, q]], null, "en"],
    };
  }
  throw new Error(`stub tak mengenal ${u.hostname}`);
};

{
  // a — artikel Indonesia asli via langlinks; penerjemah tidak dipanggil.
  const a = await ambilArtikelPembukaan("Sicilian Defense", "id");
  cek("versi asli Indonesia dipakai", a?.judul === "Pertahanan Sisilia");
  cek("bukan terjemahan otomatis", a?.terjemahanOtomatis === false);
  const kePenerjemah = permintaanStub.filter((p) =>
    p.startsWith("translate.googleapis.com")
  ).length;
  cek("penerjemah tidak dipanggil", kePenerjemah === 0);

  // b — tanpa versi Indonesia → terjemahan otomatis.
  const b = await ambilArtikelPembukaan("King's Pawn Game", "id");
  cek(
    "ringkasan berhasil diterjemahkan",
    (b?.ringkasan || "").split("\n").every((p) => p.startsWith("ID·"))
  );
  cek("bahasa berubah jadi id", b?.bahasa === "id");
  cek("ditandai terjemahanOtomatis", b?.terjemahanOtomatis === true);
  cek(
    "url sumber tetap artikel Inggris",
    (b?.url || "").startsWith("https://en.wikipedia.org/wiki/")
  );

  // c — penerjemah gagal → artikel Inggris tetap tampil.
  const c = await ambilArtikelPembukaan("Scotch Game", "id");
  cek("fallback ke bahasa Inggris", c?.bahasa === "en");
  cek("tanpa tanda terjemahan otomatis", c?.terjemahanOtomatis === false);
  cek("ringkasan Inggris utuh", (c?.ringkasan || "").startsWith("The Scotch Game"));

  // d — cache: panggilan ulang tidak memicu fetch baru.
  const jumlah = permintaanStub.length;
  const d = await ambilArtikelPembukaan("King's Pawn Game", "id");
  cek("hasil cache sama", d?.bahasa === "id" && d?.terjemahanOtomatis === true);
  cek("tanpa permintaan jaringan baru", permintaanStub.length === jumlah);

  // e — UI Inggris tidak menyentuh penerjemah sama sekali.
  permintaanStub.length = 0;
  const e = await ambilArtikelPembukaan("King's Pawn Game", "en");
  cek("UI en → artikel en", e?.bahasa === "en");
  cek(
    "UI en tanpa panggilan penerjemah",
    permintaanStub.every((p) => !p.startsWith("translate.googleapis.com"))
  );
}

if (gagal) {
  console.error(`\n${gagal} pemeriksaan gagal.`);
  process.exit(1);
}
console.log("\nSemua pemeriksaan artikel Wikipedia lulus.");
