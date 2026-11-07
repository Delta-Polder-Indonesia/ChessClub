/**
 * Uji P2 Latihan Repertoar — komponen `LatihanRepertoar` ASLI di jsdom dengan
 * IndexedDB palsu: pohon cabang, latihan massal, dan layar statistik.
 *
 * Yang dijaga:
 *  1. Pohon cabang menggabungkan awalan langkah yang sama (e4 dipakai dua
 *     pembukaan) dan bercabang hanya saat jalurnya berbeda; klik simpul
 *     membuka garis pemiliknya.
 *  2. Latihan massal memakai antrean lintas jalur (urut `dueAt`), menyelesaikan
 *     seluruh posisi jatuh tempo, dan tetap menjadwalkan ulang kartu (SRS).
 *  3. Layar statistik menampilkan angka dari kartu + rekor tanpa menulis apa pun.
 *
 * Jalankan: node scripts/uji-repertoar-ui.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";
import "fake-indexeddb/auto";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { MemoryRouter } = await import("react-router-dom");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { default: LatihanRepertoar } = await import(
  "../src/halaman/LatihanRepertoar/LatihanRepertoar.jsx"
);
const { buatKartuDariJalur, indeksJalurPembukaan } = await import(
  "../src/halaman/LatihanRepertoar/repertoarLogika.js"
);
const { bacaKartuRepertoar, simpanKartuRepertoar } = await import(
  "../src/halaman/LatihanRepertoar/repertoarStorage.js"
);

const act = React.act ?? (await import("react-dom/test-utils")).act;

let lulus = 0;
let gagal = 0;
function hasil(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
    process.exitCode = 1;
  }
}

const [sicilia, kingPawn] = indeksJalurPembukaan([
  { eco: "B20", opening: "Sicilian Defence", moves: "e2e4 c7c5 g1f3 d7d6", games: 40 },
  { eco: "C20", opening: "King Pawn Game", moves: "e2e4 e7e5 g1f3 b8c6 f1b5", games: 12 },
]);

const sekarang = Date.now();
// Hitam pada Sicilian: dua kartu (c5, d6); Putih pada King Pawn: tiga kartu.
const kartuSicilia = buatKartuDariJalur(sicilia, "b", sekarang).map((kartu) => ({
  ...kartu,
  dueAt: sekarang - 2000,
}));
const kartuKingPawn = buatKartuDariJalur(kingPawn, "w", sekarang);
const semuaKartu = [...kartuSicilia, ...kartuKingPawn];

if (kartuSicilia.length !== 2 || kartuKingPawn.length !== 3) {
  throw new Error(
    `prasyarat uji gagal: sicilia ${kartuSicilia.length}, king pawn ${kartuKingPawn.length}`,
  );
}
await simpanKartuRepertoar(semuaKartu);

const catatanGalat = [];
const galatAsli = console.error;
console.error = (...argumen) => {
  catatanGalat.push(argumen.join(" "));
  galatAsli(...argumen);
};

const wadah = document.createElement("div");
document.body.appendChild(wadah);
const root = createRoot(wadah);

await act(async () => {
  root.render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/program-kami/latihan-repertoar"] },
      React.createElement(I18nProvider, null, React.createElement(LatihanRepertoar)),
    ),
  );
});
await act(async () => {
  await new Promise((selesai) => setTimeout(selesai, 100));
});

const el = (pemilih) => wadah.querySelector(pemilih);
const semua = (pemilih) => [...wadah.querySelectorAll(pemilih)];
const petak = (sq) => el(`[data-petak="${sq}"]`);
const tombol = (teks, akar = wadah) =>
  [...akar.querySelectorAll("button")].find((b) => b.textContent.trim() === teks);
const tunggu = async (ms = 80) => {
  await act(async () => {
    await new Promise((selesai) => setTimeout(selesai, ms));
  });
};
/**
 * Kunci i18n yang tercetak mentah ("papan.repertoarX") berarti kuncinya tidak
 * ada di kamus. `uji:i18n` tidak bisa melihat `t(kunci)` yang kuncinya berasal
 * dari variabel/daftar, jadi layar-layar di sini diperiksa langsung.
 */
const kunciMentah = () => wadah.textContent.match(/papan\.[a-zA-Z]+/g) || [];

const klik = async (target) => {
  if (!target) throw new Error("target klik tidak ditemukan");
  await act(async () => {
    target.click();
  });
  await tunggu();
};

/* ------------------------------------------------------- pohon cabang */

const kartuKatalog = semua("[data-kartu-repertoar]");
hasil("katalog tidak mencetak kunci i18n mentah", kunciMentah().length === 0, kunciMentah()[0]);
hasil("dua jalur tersimpan tampil di katalog", kartuKatalog.length === 2, `${kartuKatalog.length}`);

const pohon = el("[data-pohon-cabang]");
hasil("panel pohon cabang tersedia di katalog", Boolean(pohon));
const simpulPohon = semua("[data-pohon-cabang] [role='treeitem']");
hasil("pohon memuat delapan langkah unik", simpulPohon.length === 8, `${simpulPohon.length}`);
hasil(
  "langkah pertama digabung jadi satu simpul (e4)",
  simpulPohon[0]?.textContent.includes("e4"),
  simpulPohon[0]?.textContent,
);
const anakE4 = petakPohon("e4").querySelectorAll(":scope > ul > li");
hasil("e4 bercabang dua (e5 vs c5)", anakE4.length === 2, `${anakE4.length}`);
hasil(
  "ringkasan pohon menyebut jumlah langkah dan garis",
  pohon?.textContent.includes("8 langkah") && pohon?.textContent.includes("2 garis"),
  pohon?.textContent.slice(0, 120),
);

// Klik cabang c5 → halaman pembukaan garis Sicilian.
const simpulC5 = [...petakPohon("e4").querySelectorAll("[role='treeitem']")].find((item) =>
  item.textContent.includes("c5"),
);
await klik(simpulC5?.querySelector("button"));
hasil("klik simpul membuka halaman pembukaan", !el("[data-pohon-cabang]"));
hasil(
  "pembukaan yang terbuka adalah garis pemilik simpul",
  wadah.textContent.includes("Sicilian Defence"),
);

await klik(el("header button[aria-label]"));
hasil("kembali ke katalog setelah membuka pohon", Boolean(el("[data-kartu-repertoar]")));

/* ----------------------------------------------------- latihan massal */

const tombolMassal = tombol("Latih 5 jatuh tempo");
hasil("tombol latihan massal menampilkan jumlah jatuh tempo", Boolean(tombolMassal));
hasil("tombol latihan massal aktif", tombolMassal?.disabled === false);

await klik(tombolMassal);
hasil("sesi latihan massal terbuka", Boolean(el("[data-dasbor-latihan]")));
hasil("layar latihan tidak mencetak kunci i18n mentah", kunciMentah().length === 0, kunciMentah()[0]);
hasil("penanda latihan massal tampil", Boolean(el("[data-latihan-massal]")));
hasil(
  "antrean dimulai dari jalur yang paling lama tertunda",
  el("[data-dasbor-latihan]")?.textContent.includes("Sicilian Defence"),
);

/**
 * Jawab satu kartu: klik petak asal/tujuan dari langkah buku kartu itu, lalu
 * nilai "Baik" supaya SRS menjadwalkannya ulang seperti alur latihan biasa.
 */
async function jawabKartu(kartu) {
  await klik(petak(kartu.expectedUci.slice(0, 2)));
  await klik(petak(kartu.expectedUci.slice(2, 4)));
  await klik(tombol("Baik", el("[data-dasbor-latihan]")));
}

await jawabKartu(kartuSicilia[0]);
hasil(
  "kartu kedua masih dari jalur yang sama (c5 → d6)",
  el("[data-dasbor-latihan]")?.textContent.includes("Sicilian Defence"),
);
await jawabKartu(kartuSicilia[1]);

hasil(
  "antrean berpindah jalur setelah jalur pertama selesai",
  el("[data-dasbor-latihan]")?.textContent.includes("King Pawn Game"),
  el("[data-dasbor-latihan]")?.textContent.slice(0, 200),
);
hasil(
  "penanda massal menyebut sisa antrean",
  el("[data-latihan-massal]")?.textContent.includes("2 posisi lain di antrean"),
  el("[data-latihan-massal]")?.textContent,
);

for (const kartu of kartuKingPawn) await jawabKartu(kartu);

hasil(
  "antrean massal selesai setelah semua kartu dinilai",
  wadah.textContent.includes("Antrean massal selesai"),
);
const kartuSetelah = await bacaKartuRepertoar();
hasil(
  "semua kartu dijadwalkan ulang oleh SRS (tidak ada yang tetap jatuh tempo)",
  kartuSetelah.every((kartu) => Number(kartu.dueAt) > Date.now()),
  kartuSetelah.map((kartu) => kartu.dueAt - Date.now()).join(","),
);
hasil(
  "setiap kartu mendapat nilai Baik",
  kartuSetelah.every((kartu) => kartu.lastGrade === "good"),
);

await klik(tombol("Kembali ke repertoar"));
hasil("kembali ke katalog dari sesi massal", Boolean(el("[data-kartu-repertoar]")));
hasil(
  "tidak ada lagi yang jatuh tempo setelah sesi massal",
  Boolean(tombol("Latih 0 jatuh tempo")) && tombol("Latih 0 jatuh tempo").disabled,
);

// Latihan per jalur tetap menunggu jadwal (perilaku lama tidak berubah).
await klik(semua("[data-kartu-repertoar]")[0].querySelector("button"));
hasil(
  "tombol latihan per jalur kembali nonaktif sampai jatuh tempo",
  Boolean(tombol("Belum jatuh tempo")),
);

/* ---------------------------------------------------------- statistik */

await klik(el("header button[aria-label]"));
await klik(tombol("Statistik"));

const statistik = el("[data-statistik-repertoar]");
hasil("layar statistik terbuka", Boolean(statistik));
hasil("statistik tidak mencetak kunci i18n mentah", kunciMentah().length === 0, kunciMentah()[0]);
hasil(
  "judul statistik benar",
  statistik?.querySelector("h1")?.textContent === "Statistik repertoar",
);
hasil("jumlah jalur terhitung", /Jalur\s*2/.test(statistik?.textContent || ""), statistik?.textContent.match(/Jalur\s*\d+/)?.[0]);
hasil("jumlah posisi terhitung", /Posisi\s*5/.test(statistik?.textContent || ""), statistik?.textContent.match(/Posisi\s*\d+/)?.[0]);
hasil("jatuh tempo nol setelah sesi", /Jatuh tempo\s*0/.test(statistik?.textContent || ""));
hasil("akurasi 100% setelah semua dijawab benar", statistik?.textContent.includes("100%"));
hasil("distribusi nilai menyebut Baik", statistik?.textContent.includes("Baik"));
hasil(
  "daftar per pembukaan memuat kedua pembukaan",
  statistik?.textContent.includes("Sicilian Defence") &&
    statistik?.textContent.includes("King Pawn Game"),
);

await klik(el("[data-statistik-repertoar] button[aria-label]"));
hasil("kembali ke katalog dari statistik", Boolean(el("[data-kartu-repertoar]")));

/* ------------------------------------------------------------------ tutup */

const galatReact = catatanGalat.filter(
  (baris) => baris.includes("Warning:") || baris.includes("Error:"),
);
hasil("tidak ada peringatan/galat React", galatReact.length === 0, galatReact[0]);

await act(async () => {
  root.unmount();
});
wadah.remove();
console.error = galatAsli;

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);

/** Simpul pohon yang menampilkan langkah tertentu. */
function petakPohon(san) {
  return [...document.querySelectorAll("[data-pohon-cabang] [role='treeitem']")].find(
    (item) => item.getAttribute("aria-label")?.endsWith(` ${san}`),
  );
}
