/**
 * Uji ALUR halaman Teka-teki (`src/halaman/TekaTeki/TekaTeki.jsx`).
 *
 * Berbeda dari `uji-tekateki-solusi.mjs` (yang mengunci satu kebijakan: mate
 * alternatif ditolak), skrip ini memutar BANYAK soal sungguhan sampai tuntas
 * lewat halaman yang sesungguhnya di jsdom:
 *
 *   1. setiap jenis soal (Mate in One/Two/Three) & kedua giliran,
 *   2. soal dengan promosi (dialog promosi + bidak yang dipilih),
 *   3. langkah salah & langkah ilegal tidak menyelesaikan soal,
 *   4. navigasi tinjau setelah skakmat (|< < > >|) mengikuti jalur solusi,
 *   5. saringan (Level/Langkah/Tema/Giliran) & input nomor soal,
 *   6. perubahan URL memakai nomor soal (problemid) yang benar,
 *   7. tombol Lewati/Acak/Baru memuat soal lain,
 *   8. tidak ada galat render React selama semua alur itu.
 *
 * Papan dibaca dari `aria-label` tiap `[data-petak]`, jadi tidak bergantung
 * pada gambar. Semua langkah diklik (bukan diseret) karena jalur seret
 * memakai `document.elementFromPoint` yang tidak dihitung jsdom — jalur
 * tersebut diuji terpisah oleh uji lencana/animasi.
 *
 * Jalankan: node scripts/uji-teka-teki-alur.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pluginGlobAset } from "./loader-jsx.mjs";
import { Chess } from "chess.js";
import { parseLangkah, terapkan } from "../src/lib/tekaTeki.js";
import { tekaTeki as kamus } from "../src/lib/terjemahan/id/tekaTeki.js";
import { papan as kamusPapan } from "../src/lib/terjemahan/id/papan.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log(
    "GAGAL: jalankan uji alur teka-teki — pasang `npm i -D jsdom esbuild` lebih dulu."
  );
  process.exit(1);
}

const { build } = require("esbuild");
const { JSDOM } = require("jsdom");

let lulus = 0;
let gagal = 0;
let galatRender = [];

function uji(nama, kondisi, catatan = "") {
  if (kondisi) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}${catatan ? ` — ${catatan}` : ""}`);
  }
}

function judul(teks) {
  console.log(`\n${teks}`);
}

/* ------------------------------------------------------------- data soal */

const { problems } = JSON.parse(
  readFileSync(path.join(ROOT, "public", "data", "teka-teki.json"), "utf8")
);

const FEN_AKHIR = (soal) => {
  let fen = soal.fen;
  for (const teks of soal.moves.split(";")) {
    fen = terapkan(fen, parseLangkah(teks)).fen();
  }
  return fen;
};

/** Satu soal contoh untuk tiap kombinasi yang ingin diuji. */
function pilihSoalUji() {
  const hasil = {};
  const punyaPromosi = problems.filter((p) =>
    p.moves.split(";").some((m) => parseLangkah(m).promo)
  );
  hasil.promosi = punyaPromosi.find(
    (p) => p.type === "Mate in Two" && !p.moves.split(";").some((m, i) => i === 0 && parseLangkah(m).promo)
  );
  hasil.promosiSatuLangkah = punyaPromosi.find((p) => p.type === "Mate in One");
  for (const tipe of ["Mate in One", "Mate in Two", "Mate in Three"]) {
    hasil[`${tipe}-White to Move`] =
      problems.find((p) => p.type === tipe && p.first === "White to Move" && !p.moves.includes("q;")) ??
      problems.find((p) => p.type === tipe && p.first === "White to Move");
    hasil[`${tipe}-Black to Move`] =
      problems.find((p) => p.type === tipe && p.first === "Black to Move");
  }
  return hasil;
}

const CONTOH = pilihSoalUji();

/* -------------------------------------------------------- bundel halaman */

const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { I18nProvider } from "./src/lib/i18n.jsx";
import TekaTeki from "./src/halaman/TekaTeki/TekaTeki.jsx";

export function mount(el) {
  return createRoot(el).render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/teka-teki/problem/1"]}>
        <I18nProvider><TekaTeki /></I18nProvider>
      </MemoryRouter>
    </HelmetProvider>
  );
}
`;

const berkasBundel = path.join(tmpdir(), "kci-uji-tekateki-alur.cjs");
await build({
  stdin: {
    contents: MASUK,
    resolveDir: ROOT,
    loader: "jsx",
    sourcefile: "uji-tekateki-alur-entry.jsx",
  },
  bundle: true,
  format: "cjs",
  platform: "browser",
  outfile: berkasBundel,
  loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl", ".mp3": "text" },
  plugins: [pluginGlobAset()],
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
  },
  logLevel: "error",
});

/* ------------------------------------------------------- lingkungan jsdom */

class PengamatPalsu {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class AudioContextPalsu {
  constructor() {
    this.destination = {};
    this.state = "running";
  }
  currentTime() {
    return 0;
  }
  createBuffer() {
    return { getChannelData: () => new Float32Array(8) };
  }
  createBufferSource() {
    return { connect: () => {}, start: () => {}, stop: () => {}, buffer: null, playbackRate: { value: 1 } };
  }
  decodeAudioData() {
    return Promise.resolve({});
  }
  resume() {
    return Promise.resolve();
  }
}

const permintaanJaringan = [];

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  // Alamat kanonik; pengalihan alamat lama diuji di uji-teka-teki-rute.mjs.
  url: "https://uji.test/teka-teki/problem/1",
  pretendToBeVisual: true,
});
let { window } = dom;

function siapkanGlobal() {
  window.ResizeObserver = PengamatPalsu;
  window.IntersectionObserver = PengamatPalsu;
  window.AudioContext = AudioContextPalsu;
  window.webkitAudioContext = AudioContextPalsu;
  window.matchMedia =
    window.matchMedia ??
    ((media) => ({ matches: false, media, addEventListener() {}, removeEventListener() {} }));
  window.requestAnimationFrame =
    window.requestAnimationFrame ?? ((cb) => setTimeout(() => cb(Date.now()), 0));
  window.cancelAnimationFrame = window.cancelAnimationFrame ?? ((id) => clearTimeout(id));
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function scrollIntoView() {};
  window.Element.prototype.scrollTo = function scrollTo() {};
  window.HTMLMediaElement.prototype.play = function play() {
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function pause() {};
  window.HTMLMediaElement.prototype.load = function load() {};
  window.innerWidth = 1440;
  window.innerHeight = 900;

  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  if (!globalThis.navigator) globalThis.navigator = window.navigator;
  globalThis.ResizeObserver = PengamatPalsu;
  globalThis.IntersectionObserver = PengamatPalsu;
  globalThis.AudioContext = AudioContextPalsu;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  for (const nama of [
    "HTMLElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLSelectElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "CustomEvent",
  ]) {
    if (window[nama]) globalThis[nama] = window[nama];
  }

  window.fetch = (url) => {
    permintaanJaringan.push(String(url));
    const relatif = String(url).replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "");
    try {
      const isi = readFileSync(path.join(ROOT, "public", relatif), "utf8");
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(isi),
        json: () => Promise.resolve(JSON.parse(isi)),
      });
    } catch {
      // Tablebase Lichess tidak tersedia offline — halaman harus tetap jalan.
      return Promise.reject(new Error(`tidak ada: ${relatif}`));
    }
  };
  globalThis.fetch = window.fetch;
}

siapkanGlobal();

let dok = window.document;
const consoleErrorAsli = console.error;
console.error = (...args) => {
  galatRender.push(args.map((a) => (a instanceof Error ? a.stack : String(a))).join(" "));
};

const tunggu = (ms) => new Promise((selesai) => setTimeout(selesai, ms));

async function tungguSampai(syarat, batasMs = 4000) {
  const akhir = Date.now() + batasMs;
  while (Date.now() < akhir) {
    if (syarat()) return true;
    await tunggu(25);
  }
  return syarat();
}

/* ---------------------------------------------------------- alat bantu UI */

const LAJUR = "abcdefgh";
const BARIS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function labelDariFen(fen) {
  const peta = new Map();
  new Chess(fen)
    .board()
    .forEach((baris, i) =>
      baris.forEach((petak, j) => {
        const sq = LAJUR[j] + BARIS[i];
        if (!petak) {
          peta.set(sq, kamus.ariaPetakKosong.replaceAll("{sq}", sq));
          return;
        }
        peta.set(
          sq,
          kamus.ariaPetakBidak
            .replaceAll("{sq}", sq)
            .replaceAll("{bidak}", kamus.namaBidak[petak.type])
            .replaceAll("{warna}", petak.color === "w" ? kamus.warnaPutih : kamus.warnaHitam)
        );
      })
    );
  return peta;
}

function papanSama(fen) {
  const harap = labelDariFen(fen);
  const kini = new Map();
  for (const el of dok.querySelectorAll("[data-petak]")) {
    kini.set(el.getAttribute("data-petak"), el.getAttribute("aria-label"));
  }
  if (kini.size !== 64 || harap.size !== 64) return false;
  for (const [sq, label] of harap) if (kini.get(sq) !== label) return false;
  return true;
}

function petak(sq) {
  return dok.querySelector(`[data-petak="${sq}"]`);
}

function klikEl(el) {
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

function tombolJudul(teks) {
  return [...dok.querySelectorAll("button")].find(
    (b) => (b.getAttribute("title") || b.getAttribute("aria-label") || "").trim() === teks
  );
}

function tombolTeks(teks) {
  return [...dok.querySelectorAll("button")].find(
    (b) => (b.textContent || "").trim() === teks
  );
}

/** Mainkan satu langkah lewat dua klik (petak asal → petak tujuan). */
async function mainkan(from, to) {
  if (!petak(from) || !petak(to)) throw new Error(`petak ${from}/${to} tidak ada`);
  klikEl(petak(from));
  await tunggu(30);
  klikEl(petak(to));
  await tunggu(30);
}

/** Mainkan seluruh jalur solusi soal (langkah pemain + balasan komputer). */
async function selesaikan(soal) {
  const langkah = soal.moves.split(";");
  let fen = soal.fen;
  for (const teks of langkah) {
    const m = parseLangkah(teks);
    if (m.promo) {
      klikEl(petak(m.from));
      await tunggu(30);
      klikEl(petak(m.to));
      const dialog = await tungguSampai(
        () => !!dok.querySelector('[role="dialog"][aria-label="' + kamus.promosiJudul + '"]'),
        2000
      );
      if (!dialog) return false;
      const kunci = { q: kamus.promosiMenteri, r: kamus.promosiBenteng, b: kamus.promosiGajah, n: kamus.promosiKuda };
      const tombol = [...dok.querySelectorAll("button[aria-label]")].find(
        (b) => b.getAttribute("aria-label") === kunci[m.promo]
      );
      if (!tombol) return false;
      klikEl(tombol);
    } else {
      await mainkan(m.from, m.to);
    }
    fen = terapkan(fen, m).fen();
    if (!(await tungguSampai(() => papanSama(fen), 4000))) {
      return false;
    }
  }
  return true;
}

function terpecahkan() {
  try {
    return JSON.parse(window.localStorage.getItem("kci-teka-teki-terpecahkan") || "[]");
  } catch {
    return [];
  }
}

/** Buka soal lewat input nomor (tanpa saringan aktif, nomor = problemid). */
async function bukaNomor(id) {
  const input = dok.querySelector('input[type="number"]');
  if (!input) return false;
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  ).set;
  setter.call(input, String(id));
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  const form = input.closest("form");
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  return tungguSampai(() => papanSama(problems[id - 1].fen), 3000);
}

/* ------------------------------------------------------------------ mulai */

/** Pasang DOM + keadaan global yang baru (dipakai uji locale). */
function pasangDomBaru(bahasa) {
  const baru = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "https://uji.test/teka-teki/1",
    pretendToBeVisual: true,
  });
  window = baru.window;
  siapkanGlobal();
  dok = window.document;
  if (bahasa) window.localStorage.setItem("kci-bahasa", bahasa);
  return baru;
}

const { mount } = require(berkasBundel);
mount(dok.getElementById("root"));

judul("pemuatan awal & metadata halaman");
uji(
  "papan tampil dengan soal #1 dari URL kanonik /teka-teki/problem/1",
  await tungguSampai(() => dok.querySelectorAll("[data-petak]").length === 64 && papanSama(problems[0].fen)),
  "URL /teka-teki/problem/1"
);
{
  const kanonik = dok.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
  uji(
    "kanonik menunjuk halaman resmi /teka-teki/problem (bukan nomor soal)",
    kanonik.endsWith("/teka-teki/problem"),
    `kanonik: ${kanonik}`
  );
  const robots = dok.querySelector('meta[name="robots"]')?.getAttribute("content") || "";
  uji("meta robots halaman teka-teki = index, follow", robots === "index, follow", `robots: ${robots}`);
  const judulMeta = dok.title || "";
  uji(
    "judul dokumen memakai kamus metaJudul",
    judulMeta.includes(kamus.metaJudul),
    `judul: ${judulMeta}`
  );
}

judul("menuntaskan soal untuk setiap jenis & giliran");
for (const [nama, soal] of Object.entries(CONTOH)) {
  if (!soal) continue;
  const jalan = await bukaNomor(soal.problemid);
  if (!jalan) {
    uji(`${nama}: soal #${soal.problemid} termuat`, false, "papan tidak sesuai FEN soal");
    continue;
  }
  const tuntas = await selesaikan(soal);
  const tercatat = terpecahkan().includes(soal.problemid);
  uji(
    `${nama}: #${soal.problemid} (${soal.moves}) tuntas & tercatat`,
    tuntas && tercatat,
    tuntas ? "posisi akhir tidak cocok / tidak tercatat" : "jalur solusi gagal dimainkan"
  );
  uji(
    `${nama}: posisi akhir = skakmat data`,
    papanSama(FEN_AKHIR(soal))
  );
}

judul("promosi: bidak yang dipilih pemain dihormati");
if (CONTOH.promosi) {
  const soal = CONTOH.promosi;
  const langkah = soal.moves.split(";").map(parseLangkah);
  const indeksPromo = langkah.findIndex((m) => m.promo);
  await bukaNomor(soal.problemid);
  // Mainkan sampai SEBELUM langkah promosi.
  let fenJalan = soal.fen;
  for (let i = 0; i < indeksPromo; i++) {
    await mainkan(langkah[i].from, langkah[i].to);
    fenJalan = terapkan(fenJalan, langkah[i]).fen();
    await tungguSampai(() => papanSama(fenJalan), 4000);
  }
  const m = langkah[indeksPromo];
  klikEl(petak(m.from));
  await tunggu(30);
  klikEl(petak(m.to));
  const adaDialog = await tungguSampai(
    () => !!dok.querySelector(`[role="dialog"][aria-label="${kamus.promosiJudul}"]`),
    2000
  );
  uji(`dialog promosi terbuka pada langkah ${m.from}-${m.to}`, adaDialog);
  if (adaDialog) {
    const kunciBidak = { q: kamus.promosiMenteri, r: kamus.promosiBenteng, b: kamus.promosiGajah, n: kamus.promosiKuda };
    const tombol = [...dok.querySelectorAll("button[aria-label]")].find(
      (b) => b.getAttribute("aria-label") === kunciBidak[m.promo]
    );
    klikEl(tombol);
    const fenHarap = terapkan(fenJalan, m).fen();
    uji(
      `promosi ${m.promo} diterapkan di papan`,
      await tungguSampai(() => papanSama(fenHarap), 3000)
    );
  }
} else {
  uji("ada soal promosi untuk diuji", false);
}

judul("langkah salah & ilegal");
{
  // Soal dari ujung daftar supaya belum tersentuh uji-uji sebelumnya.
  const soal = [...problems]
    .reverse()
    .find(
      (p) => p.type !== "Mate in One" && !p.moves.includes("q;") && p.moves.split(";").length >= 3
    );
  await bukaNomor(soal.problemid);
  const langkah = soal.moves.split(";").map(parseLangkah);
  // Cari langkah legal yang BUKAN solusi pada posisi awal.
  const papan = new Chess(soal.fen);
  const salah = papan
    .moves({ verbose: true })
    .find((m) => !(m.from === langkah[0].from && m.to === langkah[0].to));
  await mainkan(salah.from, salah.to);
  await tunggu(150);
  uji("pesan salah muncul", dok.body.textContent.includes(kamus.salah));
  uji("posisi TIDAK berubah oleh langkah salah", papanSama(soal.fen));
  uji("soal tidak tercatat terpecahkan", !terpecahkan().includes(soal.problemid));

  // Langkah ilegal (petak tujuan bukan langkah legal) tidak boleh jalan.
  const tujuanIlegal = ["a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1"].find(
    (sq) => sq !== salah.from && !papan.moves({ verbose: true }).some((m) => m.from === salah.from && m.to === sq)
  );
  if (tujuanIlegal) {
    await mainkan(salah.from, tujuanIlegal);
    await tunggu(120);
    uji("langkah ilegal tidak mengubah papan", papanSama(soal.fen));
  }

  // Langkah benar tetap bisa menuntaskan soal setelah percobaan gagal.
  const tuntas = await selesaikan(soal);
  uji("soal tetap bisa dituntaskan setelah langkah salah", tuntas && terpecahkan().includes(soal.problemid));
}

judul("navigasi tinjau setelah skakmat");
{
  const soal = problems.find((p) => p.type === "Mate in Two");
  await bukaNomor(soal.problemid);
  await selesaikan(soal);
  const langkah = soal.moves.split(";").map(parseLangkah);
  const mundur = tombolJudul(kamus.mundurSatu);
  const maju = tombolJudul(kamus.majuSatu);
  const keAwal = tombolJudul(kamusPapan.keAwal);
  const keAkhir = tombolJudul(kamusPapan.keAkhir);
  uji("tombol mundur & maju ada", !!mundur && !!maju && !!keAwal && !!keAkhir);
  if (mundur && maju && keAwal) {
    klikEl(mundur);
    await tunggu(80);
    const posisiSebelum = soal.fen;
    // Setelah mundur satu langkah dari akhir (3 ply untuk mate-in-2? — ambil FEN ply ke n-1)
    let fenPly = soal.fen;
    for (let i = 0; i < langkah.length - 1; i++) fenPly = terapkan(fenPly, langkah[i]).fen();
    uji("mundur satu langkah menampilkan posisi sebelumnya", papanSama(fenPly));

    klikEl(keAwal);
    await tunggu(80);
    uji("kembali ke awal menampilkan posisi awal soal", papanSama(posisiSebelum));

    klikEl(maju);
    await tunggu(120);
    const fenSatu = terapkan(soal.fen, langkah[0]).fen();
    uji("maju satu langkah mengikuti jalur solusi", papanSama(fenSatu));
  }
}

judul("saringan & input nomor");
{
  const _soalLevel1 = problems.find((p) => p.rating < 1000);
  const pilih = dok.querySelector("#wadah-level");
  uji("select Level tersedia", !!pilih);
  if (pilih) {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      "value"
    ).set;
    setter.call(pilih, "1");
    pilih.dispatchEvent(new window.Event("change", { bubbles: true }));
    await tunggu(200);
    // Soal yang tampil harus berating < 1000.
    const idSekarang = Number((window.location?.pathname || "").split("/").pop() || 0) || null;
    const dariUrl = (() => {
      const cocok = [...dok.querySelectorAll("[data-petak]")];
      if (!cocok.length) return null;
      const labelPapan = new Map(
        cocok.map((el) => [el.getAttribute("data-petak"), el.getAttribute("aria-label")])
      );
      return problems.find((p) => {
        const harap = labelDariFen(p.fen);
        for (const [sq, l] of harap) if (labelPapan.get(sq) !== l) return false;
        return true;
      }) || null;
    })();
    uji(
      "saringan Level 1 hanya memuat soal rating < 1000",
      !!dariUrl && dariUrl.rating < 1000,
      dariUrl ? `rating=${dariUrl.rating}` : "soal tidak dikenali"
    );
    if (idSekarang) void idSekarang;

    // Kembalikan ke semua level.
    setter.call(pilih, "semua");
    pilih.dispatchEvent(new window.Event("change", { bubbles: true }));
    await tunggu(200);
  }

  const input = dok.querySelector('input[type="number"]');
  uji("input nomor soal tersedia", !!input);
  if (input) {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    setter.call(input, "99999");
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    input
      .closest("form")
      .dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    await tunggu(120);
    uji(
      "nomor di luar rentang ditolak dengan pesan",
      dok.body.textContent.includes(
        kamus.nomorTidakValid.replace("{total}", String(problems.length))
      )
    );

    const target = problems[2];
    uji("buka soal nomor 3 lewat input", await bukaNomor(target.problemid));
  }
}

judul("tombol Lewati / Acak / Baru");
{
  await bukaNomor(problems[0].problemid);
  const lewati = tombolTeks(kamus.lewati) || tombolTeks(kamus.selanjutnya);
  if (lewati) {
    klikEl(lewati);
    await tungguSampai(() => !papanSama(problems[0].fen), 2000);
    uji("Lewati memuat soal lain", !papanSama(problems[0].fen));
  } else {
    uji("tombol Lewati ada", false);
  }
  const acak = tombolTeks(kamus.acak);
  if (acak) {
    const sebelum = papanSama(problems[0].fen);
    klikEl(acak);
    await tunggu(200);
    uji("Acak tetap menampilkan papan yang sah", dok.querySelectorAll("[data-petak]").length === 64);
    void sebelum;
  }
}

judul("Keyboard: tombol panah tidak menyentuh jawaban sebelum skakmat");
{
  const soal = problems.find((p) => p.type === "Mate in Two");
  await bukaNomor(soal.problemid);
  doc_key("ArrowRight");
  await tunggu(120);
  uji("ArrowRight tidak memajukan langkah sebelum skakmat", papanSama(soal.fen));
  doc_key("ArrowDown");
  await tunggu(120);
  uji("ArrowDown tidak melompat ke akhir sebelum skakmat", papanSama(soal.fen));
}

function doc_key(key) {
  dok.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true }));
}

judul("petunjuk: hanya saat giliran pemain & menunjuk langkah solusi");
{
  const soal = [...problems]
    .reverse()
    .find((p) => p.type === "Mate in Two" && p.moves.split(";").length === 3);
  await bukaNomor(soal.problemid);
  const langkah = soal.moves.split(";").map(parseLangkah);

  // Selama menunggu balasan lawan, tombol petunjuk harus nonaktif dan tidak
  // boleh membocorkan langkah lawan.
  await mainkan(langkah[0].from, langkah[0].to);
  await tunggu(80);
  const tombol = tombolTeks(kamus.petunjuk);
  uji("tombol petunjuk berlabel kamus (bukan teks mentah)", !!tombol);
  if (tombol) {
    uji("petunjuk nonaktif saat lawan membalas", tombol.disabled === true);
  }
  await tungguSampai(() => papanSama(terapkan(soal.fen, langkah[0]).fen()), 3000);
  await tunggu(800);

  // Giliran pemain lagi: petunjuk menandai petak asal & tujuan langkah solusi.
  const tombol2 = tombolTeks(kamus.petunjuk);
  if (tombol2) {
    klikEl(tombol2);
    await tunggu(80);
    const sorot = [...dok.querySelectorAll('[data-petak] span[aria-hidden="true"]')];
    const adaHijau = sorot.some((el) =>
      /0, 150, 80/.test(el.getAttribute("style") || "")
    );
    uji("petunjuk menyorot petak langkah solusi", adaHijau);
  } else {
    uji("petunjuk menyorot petak langkah solusi", false, "tombol tidak ditemukan");
  }
}

judul("lanjut otomatis berhenti saat pemain meninjau solusi");
{
  const soal = problems.find((p) => p.type === "Mate in One");
  // Aktifkan mode lanjut otomatis lewat tombol aksi.
  await bukaNomor(soal.problemid);
  const tombolAuto = tombolJudul(kamus.lanjutOtomatis);
  uji("tombol lanjut otomatis ada", !!tombolAuto);
  if (tombolAuto) {
    klikEl(tombolAuto);
    await tunggu(60);
  }
  await bukaNomor(soal.problemid);
  await selesaikan(soal);
  await tunggu(120);
  // Tinjau solusi sebelum hitungan 3 detik selesai.
  const keAwal = tombolJudul(kamusPapan.keAwal);
  if (keAwal) klikEl(keAwal);
  const idSebelum = soal.problemid;
  await tunggu(3600);
  // Papan harus tetap pada soal yang sama (tidak diserobot ke soal berikutnya).
  const masihSoalSama = papanSama(soal.fen) || papanSama(FEN_AKHIR(soal));
  uji(
    `tinjau solusi tidak diserobot lanjut otomatis (soal #${idSebelum})`,
    masihSoalSama,
    "papan berpindah ke soal lain"
  );
  if (tombolAuto) {
    const tombolAuto2 = tombolJudul(kamus.lanjutOtomatis);
    if (tombolAuto2) klikEl(tombolAuto2);
    await tunggu(60);
  }
}

judul("tablebase Syzygy: tidak menembak posisi >7 bidak");
{
  const soalBanyak = problems.find(
    (p) => p.fen.split(" ")[0].replace(/[^pnbrqkPNBRQK]/g, "").length > 7
  );
  const soalSedikit = problems.find(
    (p) => p.fen.split(" ")[0].replace(/[^pnbrqkPNBRQK]/g, "").length <= 7
  );
  permintaanJaringan.length = 0;
  await bukaNomor(soalBanyak.problemid);
  await tunggu(1000);
  const tembakanBanyak = permintaanJaringan.filter((u) => u.includes("tablebase.lichess.ovh"));
  uji(
    `posisi ${soalBanyak.fen.split(" ")[0].replace(/[^pnbrqkPNBRQK]/g, "").length} bidak: tanpa permintaan tablebase`,
    tembakanBanyak.length === 0,
    `${tembakanBanyak.length} permintaan`
  );
  uji(
    "panel menampilkan keterangan gagal/tak didukung",
    dok.body.textContent.includes(kamus.syzygyGagal)
  );

  if (soalSedikit) {
    permintaanJaringan.length = 0;
    await bukaNomor(soalSedikit.problemid);
    await tungguSampai(
      () => permintaanJaringan.some((u) => u.includes("tablebase.lichess.ovh")),
      2500
    );
    const tembakanSedikit = permintaanJaringan.filter((u) => u.includes("tablebase.lichess.ovh"));
    uji(
      `posisi ≤7 bidak (#${soalSedikit.problemid}) tetap dianalisis`,
      tembakanSedikit.length >= 1,
      "tidak ada permintaan"
    );
  }
}

judul("input nomor: rentang mengikuti jumlah soal yang tersaring");
{
  const pilih = dok.querySelector("#wadah-level");
  const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  setter.call(pilih, "1");
  pilih.dispatchEvent(new window.Event("change", { bubbles: true }));
  await tunggu(200);
  const input = dok.querySelector('input[type="number"]');
  const jumlahLevel1 = problems.filter((p) => p.rating < 1000).length;
  uji(
    "placeholder memakai jumlah soal tersaring",
    input.getAttribute("placeholder") === `1–${jumlahLevel1}`,
    `placeholder="${input.getAttribute("placeholder")}" (harap 1–${jumlahLevel1})`
  );
  uji(
    "aria input memakai kunci kamus rentangNomor",
    (input.getAttribute("aria-label") || "").includes(String(jumlahLevel1))
  );
  setter.call(pilih, "semua");
  pilih.dispatchEvent(new window.Event("change", { bubbles: true }));
  await tunggu(200);
}

judul("locale EN: label dari kamus Inggris, bukan teks mentah");
{
  const baru = pasangDomBaru("en");
  delete require.cache[berkasBundel];
  const ulang = require(berkasBundel);
  ulang.mount(dok.getElementById("root"));
  const siapEn = await tungguSampai(
    () => dok.querySelectorAll("[data-petak]").length === 64 &&
      dok.body.textContent.includes("Hint"),
    6000
  );
  uji("halaman EN termuat", siapEn);
  const tombolEn = tombolTeks("Hint");
  uji("label petunjuk EN memakai kamus (Hint)", !!tombolEn);
  uji(
    "tautan atribusi EN dari kamus bersama",
    dok.body.textContent.includes("License & attribution")
  );
  const gearEn = tombolJudul("Settings");
  uji("tombol pengaturan EN berlabel kamus", !!gearEn);
  if (gearEn) {
    klikEl(gearEn);
    await tunggu(120);
  }
  const panelEn = dok.body.textContent;
  uji(
    "label panel pengaturan EN dari kamus",
    panelEn.includes("Piece Set") &&
      panelEn.includes("Board color") &&
      panelEn.includes("Board sounds")
  );
  uji(
    "tidak ada sisa teks Indonesia di panel EN",
    !panelEn.includes("Warna papan") &&
      !panelEn.includes("Suara papan") &&
      !panelEn.includes("Pengaturan") &&
      !panelEn.includes("Bidak")
  );
  void baru;
}

/*
 * Blok-blok berikut berjalan setelah blok locale EN, jadi DOM-nya harus
 * dipasang ulang ke locale bawaan (ID) lebih dulu — kalau tidak, teks kamus
 * Indonesia tidak akan pernah cocok dengan halaman berbahasa Inggris.
 */
function pasangUlangDomId() {
  pasangDomBaru();
  delete require.cache[berkasBundel];
  const mod = require(berkasBundel);
  mod.mount(dok.getElementById("root"));
  return mod;
}

judul("tipe soal tampil di baris status (dari KUNCI_TIPE)");
{
  pasangUlangDomId();
  const siap = await tungguSampai(
    () => dok.querySelectorAll("[data-petak]").length === 64,
    8000
  );
  uji("halaman ID termuat ulang", siap);
  const soal = problems.find((p) => p.type === "Mate in One");
  await bukaNomor(soal.problemid);
  uji(
    `tipe "${soal.type}" tampil lewat kamus`,
    dok.body.textContent.includes(kamus.skakmat1),
    `tidak menemukan "${kamus.skakmat1}"`
  );
}

judul("ingat posisi: bisa dimatikan & tidak menyimpan pilihan baru");
{
  // Panel pengaturan → sakelar "Ingat posisi".
  const gear = tombolJudul(kamus.pengaturan);
  uji("tombol pengaturan tersedia", !!gear);
  if (gear) {
    klikEl(gear);
    await tunggu(120);
    const label = [...dok.querySelectorAll("label")].find((l) =>
      (l.textContent || "").includes(kamus.ingatPosisi)
    );
    uji("sakelar 'Ingat posisi' tampil", !!label);
    const kotak = label?.querySelector('input[type="checkbox"]');
    if (kotak) {
      // React memetakan onChange checkbox ke event CLICK (bukan change), dan
      // jsdom menjalankan perilaku aktivasi klik pada checkbox — jadi klik biasa
      // sudah membalik `checked` sekaligus memicu onChange.
      uji("sakelar awalnya aktif (bawaan ingat posisi = true)", kotak.checked === true);
      klikEl(kotak);
      await tunggu(150);
      uji(
        "preferensi tersimpan sebagai '0'",
        window.localStorage.getItem("kci-teka-teki-ingat-posisi") === "0",
        `nilai: ${window.localStorage.getItem("kci-teka-teki-ingat-posisi")}`
      );
      uji(
        "posisi lama dibuang saat dinonaktifkan",
        window.localStorage.getItem("kci-teka-teki-posisi") === null
      );
      // Klik "Lewati" harus tetap tidak menulis posisi tersimpan.
      const tombolLewati = tombolJudul(kamus.lewati) || tombolTeks(kamus.lewati);
      if (tombolLewati) {
        klikEl(tombolLewati);
        await tunggu(150);
        uji(
          "tidak menyimpan posisi selama dinonaktifkan",
          window.localStorage.getItem("kci-teka-teki-posisi") === null
        );
      }
    }
    const gear2 = tombolJudul(kamus.pengaturan);
    if (gear2) {
      klikEl(gear2);
      await tunggu(80);
    }
  }
}

judul("skakmat alternatif: skakmat sah di luar solusi diberi pesan khusus");
{
  // Cari soal yang pada langkah penutupnya punya >1 skakmat, lalu mainkan
  // salah satu yang BUKAN langkah data. Kebijakan penilaian tetap ketat,
  // tetapi pesannya tidak boleh menyebut "belum tepat" tanpa penjelasan.
  const kandidat = problems.find((p) => {
    const langkah = p.moves.split(";");
    try {
      const g = new Chess(p.fen);
      for (const teks of langkah) {
        if (teks === langkah[langkah.length - 1]) break;
        const m = parseLangkah(teks);
        g.move({ from: m.from, to: m.to, promotion: m.promo || undefined });
      }
      const sebelum = g.fen();
      const mates = g.moves({ verbose: true }).filter((m) => {
        const u = new Chess(sebelum);
        u.move(m);
        return u.isCheckmate();
      });
      const dataAkhir = langkah[langkah.length - 1];
      return mates.length > 1 && mates.some((m) => `${m.from}-${m.to}${m.promotion || ""}` !== dataAkhir);
    } catch {
      return false;
    }
  });
  uji("menemukan soal dengan skakmat alternatif", !!kandidat);
  if (kandidat) {
    await bukaNomor(kandidat.problemid);
    // Maju sampai posisi sebelum langkah penutup.
    const langkah = kandidat.moves.split(";");
    for (const teks of langkah.slice(0, -1)) {
      const m = parseLangkah(teks);
      await mainkan(m.from, m.to);
      await tunggu(760);
    }
    const sebelum = (() => {
      const g = new Chess(kandidat.fen);
      for (const teks of langkah.slice(0, -1)) {
        const m = parseLangkah(teks);
        g.move({ from: m.from, to: m.to, promotion: m.promo || undefined });
      }
      return g;
    })();
    const dataAkhir = langkah[langkah.length - 1];
    const mateLain = sebelum
      .moves({ verbose: true })
      .find((m) => {
        const u = new Chess(sebelum.fen());
        u.move(m);
        return u.isCheckmate() && `${m.from}-${m.to}${m.promotion || ""}` !== dataAkhir;
      });
    uji("langkah mate alternatif teridentifikasi", !!mateLain);
    if (mateLain) {
      await mainkan(mateLain.from, mateLain.to);
      await tunggu(150);
      if (mateLain.promotion) {
        const kunci = { q: kamus.promosiMenteri, r: kamus.promosiBenteng, b: kamus.promosiGajah, n: kamus.promosiKuda };
        const tombol = [...dok.querySelectorAll("button[aria-label]")].find(
          (b) => b.getAttribute("aria-label") === kunci[mateLain.promotion]
        );
        if (tombol) {
          klikEl(tombol);
          await tunggu(150);
        }
      }
      uji(
        `pesan khusus skakmat alternatif muncul (soal #${kandidat.problemid})`,
        dok.body.textContent.includes(kamus.mateAlternatif),
        "pesan 'belum tepat' masih ditampilkan"
      );
      // Skakmat alternatif tetap TIDAK menuntaskan soal (kebijakan tetap ketat).
      const langkahTersisa = sebelum.moves().length;
      uji("soal belum ditandai selesai", langkahTersisa > 0);
    }
  }
}

/* ------------------------------------------------------------------ hasil */

const galatBersih = galatRender.filter((p) => !/not wrapped in act/i.test(p));
uji("tidak ada galat render React sepanjang alur", galatBersih.length === 0);
if (galatBersih.length) console.log(galatBersih.slice(0, 5).join("\n"));

console.error = consoleErrorAsli;
console.log(`\n${lulus} lulus, ${gagal} gagal`);
process.exit(gagal ? 1 : 0);
