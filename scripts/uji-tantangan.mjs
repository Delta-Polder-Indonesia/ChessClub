/**
 * Uji Mode Tantangan Latihan Repertoar — komponen `LatihanRepertoar` ASLI di
 * jsdom, dengan penyimpanan IndexedDB palsu (`fake-indexeddb`).
 *
 * Yang dijaga:
 *  1. Entri mode ada di dua tempat: kartu katalog dan panel pembukaan.
 *  2. Panel tantangan memakai papan & tata letak yang sama dengan latihan,
 *     tetapi tanpa panel jadwal tinjauan.
 *  3. Langkah buku memajukan percobaan; langkah lain atau waktu habis
 *     menghentikannya dengan alasan yang benar dan rekor tersimpan terpisah.
 *  4. Tantangan TIDAK menyentuh jadwal SRS kartu latihan (repetitions sama).
 *
 * Jalankan: node scripts/uji-tantangan.mjs
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

// Satu jalur putih tiga langkah: e4, Nf3, Bb5 (hitam membalas e5, Nc6).
const jalur = indeksJalurPembukaan([
  { eco: "C20", opening: "King Pawn Game", moves: "e2e4 e7e5 g1f3 b8c6 f1b5", games: 20 },
]);
const kartuAwal = buatKartuDariJalur(jalur[0], "w", Date.now());
if (kartuAwal.length !== 3) {
  throw new Error(`prasyarat uji gagal: kartu jalur = ${kartuAwal.length}, seharusnya 3`);
}
await simpanKartuRepertoar(kartuAwal);

// React memperingatkan lewat console.error; diuji terpisah di akhir.
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
// Tunggu pembacaan IndexedDB selesai (efek memuat kartu).
await act(async () => {
  await new Promise((selesai) => setTimeout(selesai, 80));
});

const el = (pemilih) => wadah.querySelector(pemilih);
const petak = (sq) => el(`[data-petak="${sq}"]`);
const tombol = (teks, akar = wadah) =>
  [...akar.querySelectorAll("button")].find((b) => b.textContent.trim() === teks);
const klik = async (target) => {
  await act(async () => {
    target.click();
  });
  await act(async () => {
    await new Promise((selesai) => setTimeout(selesai, 20));
  });
};
const panel = () => el("[data-dasbor-tantangan]");

/* ------------------------------------------------------------ entri mode */

hasil("kartu jalur tersimpan muncul di katalog", Boolean(el("[data-kartu-repertoar]")));
hasil("kartu katalog punya tombol Tantangan", Boolean(tombol("Tantangan")));

await klik(tombol("Tantangan"));

hasil("panel tantangan tampil", Boolean(panel()));
hasil("judul panel = Mode Tantangan", panel()?.querySelector("h1")?.textContent === "Mode Tantangan");
hasil("papan tantangan tampil", Boolean(el("[data-papan-tantangan]")));
hasil("penghitung waktu tampil", Boolean(el("[role='timer']")));
hasil(
  "tidak memakai panel latihan (SRS)",
  !el("[data-dasbor-latihan]") && !el("[role='progressbar']"),
);
hasil("kemajuan langkah benar", panel()?.textContent.includes("Langkah 1 dari 3"));
hasil("deskripsi menyebut batas 30 detik", panel()?.textContent.includes("30 detik"));
hasil("papan mulai dari posisi awal", Boolean(petak("e2")) && Boolean(petak("e8")));

/* --------------------------------------------------- langkah buku pertama */

const sasaranSebelum = petak("e4").children.length;
await klik(petak("e2"));
hasil("petak asal terpilih menandai sasaran langkah", petak("e4").children.length > sasaranSebelum);

await klik(petak("e4"));
hasil("langkah buku pertama memajukan ke langkah 2", panel()?.textContent.includes("Langkah 2 dari 3"));
hasil("poin bertambah setelah langkah cepat", /Poin\s*15/.test(panel()?.textContent || ""));
hasil("percobaan belum berakhir", !el("[data-hasil-tantangan]"));
const label = (sq) => petak(sq)?.getAttribute("aria-label") || "";
hasil(
  "posisi soal kedua sudah memuat langkah lawan dan bidak masih di tempatnya",
  label("e4").includes("putih") &&
    label("e5").includes("hitam") &&
    label("e2") === "petak e2, kosong" &&
    label("g1").includes("kuda"),
  [label("e2"), label("e4"), label("e5"), label("g1")].join(" | "),
);

/* ------------------------------------------------ langkah salah + rekor */

await klik(petak("a2"));
await klik(petak("a3"));

const hasilSalah = el("[data-hasil-tantangan]");
hasil("langkah salah menghentikan percobaan", Boolean(hasilSalah));
hasil(
  "hasil menyebut langkah buku yang seharusnya",
  hasilSalah?.textContent.includes("Nf3"),
  hasilSalah?.textContent.slice(0, 140),
);
hasil("akurasi 1 dari 3 = 33%", hasilSalah?.textContent.includes("33%"));
hasil("rekor baru diumumkan", hasilSalah?.textContent.includes("Rekor baru!"));

const rekor = JSON.parse(globalThis.localStorage.getItem("kci.papan.tantangan.v1") || "{}");
const kunciRekor = Object.keys(rekor);
hasil(
  "rekor tersimpan per jalur di localStorage",
  kunciRekor.length === 1 && rekor[kunciRekor[0]].streakTerbaik === 1 && rekor[kunciRekor[0]].poin === 15,
  JSON.stringify(rekor),
);

/* --------------------------------------------------- ulangi dan kembali */

await klik(tombol("Coba lagi"));
hasil("Coba lagi mengulang dari langkah 1", panel()?.textContent.includes("Langkah 1 dari 3"));
hasil("skor percobaan direset", !panel()?.textContent.includes("Rekor baru!"));
hasil("papan kembali ke posisi awal", Boolean(petak("e2")));

await klik(el("[data-dasbor-tantangan] button[aria-label]"));
hasil("tombol kembali membuka katalog", Boolean(el("[data-kartu-repertoar]")));

/* ------------------------------------------------------- jalur sempurna */

await klik(tombol("Tantangan"));
for (const [dari, ke] of [["e2", "e4"], ["g1", "f3"], ["f1", "b5"]]) {
  await klik(petak(dari));
  await klik(petak(ke));
}

const hasilSelesai = el("[data-hasil-tantangan]");
hasil("semua langkah benar menutup percobaan", hasilSelesai?.textContent.includes("Selesai"));
hasil("akurasi sempurna 100%", hasilSelesai?.textContent.includes("100%"));
hasil("total poin 3 × 15", /Poin\s*45/.test(hasilSelesai?.textContent || ""));

const kartuAkhir = await bacaKartuRepertoar();
const srsUtuh = kartuAwal.every((awal) => {
  const akhir = kartuAkhir.find((item) => item.id === awal.id);
  return akhir && akhir.repetitions === awal.repetitions && akhir.dueAt === awal.dueAt;
});
hasil("tantangan tidak mengubah jadwal SRS kartu latihan", srsUtuh);

/* -------------------------------------------- entri dari panel pembukaan */

await klik(tombol("Kembali ke repertoar", panel()));
await klik(tombol("Mulai belajar"));
const tombolPanel = tombol("Mulai tantangan");
hasil("panel pembukaan punya tombol Mulai tantangan", Boolean(tombolPanel));

await klik(tombolPanel);
hasil("tantangan bisa dimulai dari panel pembukaan", Boolean(panel()));

/* ------------------------------------------------------------ waktu habis */

const nowAsli = Date.now;
Date.now = () => nowAsli() + 40_000;
await act(async () => {
  await new Promise((selesai) => setTimeout(selesai, 400));
});
Date.now = nowAsli;

const hasilWaktu = el("[data-hasil-tantangan]");
hasil("waktu habis menghentikan percobaan", hasilWaktu?.textContent.includes("Waktu habis"));
hasil("waktu habis menyebut langkah yang benar", hasilWaktu?.textContent.includes("e4"));
hasil("timer berhenti di 0 detik", (el("[role='timer']")?.textContent || "").includes("0"));

await klik(tombol("Kembali ke repertoar", panel()));
hasil("kembali dari tantangan membuka panel pembukaan lagi", Boolean(tombol("Mulai tantangan")));

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
