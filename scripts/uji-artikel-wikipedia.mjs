/**
 * Uji logika referensi pembukaan berbasis Wikibooks (tanpa jaringan).
 *
 * Meski nama berkas historisnya masih `uji-artikel-wikipedia.mjs`, sumber yang
 * diuji sekarang adalah Wikibooks "Chess Opening Theory".
 *
 * Jalankan: node scripts/uji-artikel-wikipedia.mjs  (keluar 1 bila gagal)
 */
import {
  tokenKata,
  pecahNamaPembukaan,
  pilihKandidat,
  adalahArtikelCatur,
  segmenJudulWikibooks,
  daftarJudulWikibooks,
  daftarNamaAlternatifPembukaan,
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

console.log("judul Wikibooks — jalur langkah SAN:");
cek(
  "segmen langkah putih benar",
  segmenJudulWikibooks("e4", 0) === "1. e4"
);
cek(
  "segmen langkah hitam benar",
  segmenJudulWikibooks("c5", 1) === "1...c5"
);
cek(
  "judul terdalam lalu turun ke induk",
  JSON.stringify(daftarJudulWikibooks(["e4", "c5", "Nf3"])) ===
    JSON.stringify([
      "Chess Opening Theory/1. e4/1...c5/2. Nf3",
      "Chess Opening Theory/1. e4/1...c5",
      "Chess Opening Theory/1. e4",
      "Chess Opening Theory",
    ])
);

console.log("alias nama pembukaan — beda istilah Lichess vs Wikibooks:");
cek(
  "King's Pawn Game ikut mencoba King's Pawn opening",
  JSON.stringify(daftarNamaAlternatifPembukaan("King's Pawn Game")) ===
    JSON.stringify([
      "King's Pawn Game",
      "King's Pawn Opening",
      "King's Pawn opening",
    ])
);
cek(
  "Queen's Pawn Game ikut mencoba Queen's Pawn opening",
  JSON.stringify(daftarNamaAlternatifPembukaan("Queen's Pawn Game")) ===
    JSON.stringify([
      "Queen's Pawn Game",
      "Queen's Pawn Opening",
      "Queen's Pawn opening",
    ])
);

console.log("pilihKandidat — hanya halaman Chess Opening Theory yang relevan:");
{
  const terbaik = pilihKandidat(
    [
      {
        index: 1,
        title: "Chess Opening Theory/1. e4/1...c6",
        extract:
          "1...c6 is the Caro-Kann defence, a solid chess opening against 1. e4.",
      },
      {
        index: 2,
        title: "Cookbook/Cake",
        extract: "A cake is a sweet baked dessert.",
      },
      {
        index: 3,
        title: "Chess Opening Theory/1. e4/1...c5",
        extract:
          "1...c5 is the Sicilian defence, a sharp chess opening against 1. e4.",
      },
    ],
    "Caro-Kann Defense"
  );
  cek(
    "Caro-Kann Defense → halaman Caro-Kann di Wikibooks",
    terbaik?.title === "Chess Opening Theory/1. e4/1...c6"
  );
}

console.log("adalahArtikelCatur — buang hasil non-catur:");
{
  const chessArtikel = {
    title: "Chess Opening Theory/1. e4/1...e5",
    extract:
      "1...e5 is a chess opening response that contests the centre and develops the bishop.",
  };
  const bukanCatur = {
    title: "Cookbook/Cake",
    extract: "Cake batter is baked until golden brown.",
  };
  cek("artikel catur terdeteksi", adalahArtikelCatur(chessArtikel) === true);
  cek("halaman non-catur ditolak", adalahArtikelCatur(bukanCatur) === false);
}

console.log("alur ambilArtikelPembukaan — dengan fetch stub:");

const permintaanStub = [];

const HALAMAN_WIKI = (judul, isi, ekstra = {}) => ({
  title: judul,
  extract: isi,
  fullurl: `https://en.wikibooks.org/wiki/${judul
    .split("/")
    .map((bagian) => encodeURIComponent(bagian.replace(/ /g, "_")))
    .join("/")}`,
  ...ekstra,
});

const STUB = {
  "judul|Chess Opening Theory/1. e4/1...c5": {
    pages: {
      1: HALAMAN_WIKI(
        "Chess Opening Theory/1. e4/1...c5",
        "1...c5 is the Sicilian defence, a counter-attacking chess opening. White often continues with 2. Nf3 to reach the Open Sicilian.",
        {
          thumbnail: { source: "https://upload.wikimedia.org/example/sicilian.png" },
        }
      ),
    },
  },
  "judulIntroKosong|Chess Opening Theory/1. e4": {
    pages: {
      11: HALAMAN_WIKI("Chess Opening Theory/1. e4", ""),
    },
  },
  "judulPenuh|Chess Opening Theory/1. e4": {
    pages: {
      12: HALAMAN_WIKI(
        "Chess Opening Theory/1. e4",
        "1. e4, advancing the king's pawn, is the most popular first move in chess and leads to the King's Pawn opening."
      ),
    },
  },
  "judul|Chess Opening Theory/1. e4/1...e5/2. Nf3/2...Nc6": {
    pages: {
      2: HALAMAN_WIKI(
        "Chess Opening Theory/1. e4/1...e5/2. Nf3/2...Nc6",
        "2...Nc6 is the normal variation. It defends e5, develops a piece, and prepares the main roads to the Ruy Lopez and the Italian Game."
      ),
    },
  },
  "judul|Chess Opening Theory/1. e4/1...e5/2. Nf3": {
    pages: {
      3: HALAMAN_WIKI(
        "Chess Opening Theory/1. e4/1...e5/2. Nf3",
        "2. Nf3 attacks e5 and is the king's knight opening.",
      ),
    },
  },
  "cari|Caro-Kann Defense": {
    pages: {
      4: {
        index: 1,
        ...HALAMAN_WIKI(
          "Chess Opening Theory/1. e4/1...c6",
          "1...c6 is the Caro-Kann defence, a solid chess opening that prepares ...d5 against White's centre."
        ),
      },
      5: {
        index: 2,
        ...HALAMAN_WIKI(
          "Chess Opening Theory/1. e4/1...c5",
          "1...c5 is the Sicilian defence, a sharp chess opening with asymmetrical play."
        ),
      },
      6: {
        index: 3,
        title: "Cookbook/Cake",
        extract: "Cake is a sweet dessert.",
        fullurl: "https://en.wikibooks.org/wiki/Cookbook/Cake",
      },
    },
  },
  "cari|Scotch Game": {
    pages: {
      7: {
        index: 1,
        ...HALAMAN_WIKI(
          "Chess Opening Theory/1. e4/1...e5/2. Nf3/2...Nc6/3. d4",
          "The Scotch Game is an open chess opening. White strikes in the centre immediately with 3. d4."
        ),
      },
    },
  },
  "cari|King's Pawn opening": {
    pages: {
      8: {
        index: 1,
        ...HALAMAN_WIKI(
          "Chess Opening Theory/1. e4",
          "1. e4, advancing the king's pawn, is the most popular first move in chess and leads to the King's Pawn opening."
        ),
      },
    },
  },
};

globalThis.fetch = async (url, opsi = {}) => {
  const u = new URL(String(url));
  permintaanStub.push(u.hostname + u.search);

  if (u.hostname === "en.wikibooks.org") {
    const judul = u.searchParams.get("titles");
    if (judul) {
      if (judul === "Chess Opening Theory/1. e4") {
        const kunci = u.searchParams.has("exintro")
          ? "judulIntroKosong|Chess Opening Theory/1. e4"
          : "judulPenuh|Chess Opening Theory/1. e4";
        return { ok: true, json: async () => ({ query: STUB[kunci] }) };
      }
      const kunci = `judul|${judul}`;
      if (!STUB[kunci]) {
        return {
          ok: true,
          json: async () => ({
            query: { pages: { "-1": { title: judul, missing: "" } } },
          }),
        };
      }
      return { ok: true, json: async () => ({ query: STUB[kunci] }) };
    }

    const kunci = `cari|${u.searchParams.get("gsrsearch")}`;
    if (!STUB[kunci]) {
      return { ok: true, json: async () => ({ query: { pages: {} } }) };
    }
    return { ok: true, json: async () => ({ query: STUB[kunci] }) };
  }

  if (u.hostname === "translate.googleapis.com") {
    const q =
      new URLSearchParams(opsi.body || "").get("q") ?? u.searchParams.get("q");
    if (String(q).includes("Scotch Game")) throw new Error("penerjemah padam");
    return {
      ok: true,
      json: async () => [[[`ID·${q}`, q]], null, "en"],
    };
  }

  throw new Error(`stub tak mengenal ${u.hostname}`);
};

{
  // a — jalur langkah persis dipakai; versi Indonesia berasal dari terjemahan otomatis.
  const a = await ambilArtikelPembukaan(
    { nama: "Sicilian Defense", langkahSan: ["e4", "c5"] },
    "id"
  );
  cek("judul tetap memakai nama pembukaan aktif", a?.judul === "Sicilian Defense");
  cek(
    "url mengarah ke halaman Wikibooks sesuai langkah",
    (a?.url || "").includes("Chess_Opening_Theory/1._e4/1...c5")
  );
  cek(
    "ringkasan berhasil diterjemahkan",
    (a?.ringkasan || "").split("\n").every((p) => p.startsWith("ID·"))
  );
  cek("ditandai terjemahanOtomatis", a?.terjemahanOtomatis === true);

  // b — halaman terdalam hilang → jatuh ke induk terdekat yang tersedia.
  permintaanStub.length = 0;
  const b = await ambilArtikelPembukaan(
    {
      nama: "Ruy Lopez",
      langkahSan: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    },
    "en"
  );
  cek("fallback ke bahasa Inggris untuk UI en", b?.bahasa === "en");
  cek(
    "fallback ke induk 2...Nc6 saat 3.Bb5 belum ada",
    (b?.url || "").includes("Chess_Opening_Theory/1._e4/1...e5/2._Nf3/2...Nc6")
  );
  cek(
    "judul tetap mengikuti nama pembukaan aktif",
    b?.judul === "Ruy Lopez"
  );
  cek(
    "permintaan pertama memang mencoba halaman terdalam",
    permintaanStub[0]?.includes("titles=Chess+Opening+Theory%2F1.+e4%2F1...e5%2F2.+Nf3%2F2...Nc6%2F3.+Bb5")
  );

  // c — tanpa konteks langkah, sistem jatuh ke pencarian nama di Wikibooks.
  const c = await ambilArtikelPembukaan("Caro-Kann Defense", "en");
  cek(
    "pencarian nama menemukan Caro-Kann yang tepat",
    (c?.url || "").includes("Chess_Opening_Theory/1._e4/1...c6")
  );

  // d — penerjemah gagal → artikel Inggris tetap tampil.
  const d = await ambilArtikelPembukaan("Scotch Game", "id");
  cek("fallback ke bahasa Inggris", d?.bahasa === "en");
  cek("tanpa tanda terjemahan otomatis", d?.terjemahanOtomatis === false);
  cek(
    "ringkasan Inggris utuh",
    (d?.ringkasan || "").startsWith("The Scotch Game")
  );

  // e — halaman judul kadang intro-nya kosong; sistem harus retry tanpa exintro.
  permintaanStub.length = 0;
  const e = await ambilArtikelPembukaan(
    { nama: "King's Pawn Game", langkahSan: ["e4"] },
    "en"
  );
  cek(
    "1.e4 tetap dapat ringkasan walau intro judul kosong",
    (e?.ringkasan || "").includes("king's pawn")
  );
  cek(
    "retry tanpa exintro benar-benar terjadi",
    permintaanStub.some(
      (p) => p.includes("titles=Chess+Opening+Theory%2F1.+e4") && !p.includes("exintro=1")
    )
  );

  // f — nama Lichess memakai "Game", tetapi Wikibooks punya "opening".
  permintaanStub.length = 0;
  const f = await ambilArtikelPembukaan("King's Pawn Game", "en");
  cek(
    "fallback nama King's Pawn Game → King's Pawn opening",
    (f?.url || "").includes("Chess_Opening_Theory/1._e4")
  );
  cek(
    "kueri alternatif benar-benar dicoba",
    permintaanStub.some((p) => p.includes("gsrsearch=King%27s+Pawn+opening"))
  );

  // g — cache: panggilan ulang tidak memicu fetch baru.
  const jumlah = permintaanStub.length;
  const g = await ambilArtikelPembukaan(
    { nama: "Sicilian Defense", langkahSan: ["e4", "c5"] },
    "id"
  );
  cek("hasil cache sama", g?.bahasa === "id" && g?.terjemahanOtomatis === true);
  cek("tanpa permintaan jaringan baru", permintaanStub.length === jumlah);
}

if (gagal) {
  console.error(`\n${gagal} pemeriksaan gagal.`);
  process.exit(1);
}
console.log("\nSemua pemeriksaan referensi Wikibooks lulus.");
