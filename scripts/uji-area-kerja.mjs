/**
 * Uji AREA KERJA fitur Analisa — komponen `AreaKerja` ASLI di jsdom.
 *
 * Diperiksa (aksesibilitas lapisan layar):
 *  1. Mount awal TIDAK mencuri fokus (pengguna belum berpindah ke mana-mana).
 *  2. Berpindah ke layar Akun/Deteksi engine/Database/Impor: lapisan muncul (`data-uji`),
 *     bisa difokus programatik (`tabIndex -1`), dan fokus DIBAWA ke sana
 *     (pembaca layar mengumumkannya, Tab mulai dari dalam).
 *  3. Escape menutup lapisan kembali ke papan.
 *
 * Jalankan: node scripts/uji-area-kerja.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { KonteksMesin } = await import("../src/halaman/Analisa/konteks/mesinKonteks.js");
const { default: AnalyzeContextProvider } = await import("../src/halaman/Analisa/konteks/analyze.jsx");
const { AnalyzeContext } = await import("../src/halaman/Analisa/konteks/analyzeKonteks.js");
const { default: AreaKerja } = await import("../src/halaman/Analisa/komponen/areaKerja.jsx");

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

const NILAI_MESIN_PALSU = {
  idEngine: "engine-palsu",
  gantiEngine: () => {},
  status: "siap",
  galat: "",
  siapkan: async () => null,
  setop: () => {},
  ambilMesin: () => null,
  didukung: true,
};

const el = document.getElementById("root");
const root = createRoot(el);

let ctx = null;
function Probe() {
  ctx = React.useContext(AnalyzeContext);
  return null;
}

act(() => {
  root.render(
    React.createElement(
      I18nProvider,
      null,
      React.createElement(
        KonteksMesin.Provider,
        { value: NILAI_MESIN_PALSU },
        React.createElement(
          AnalyzeContextProvider,
          null,
          React.createElement(Probe),
          React.createElement(AreaKerja)
        )
      )
    )
  );
});

const lapisan = () => el.querySelector("[data-uji^='layar-']");

console.log("== mount awal ==");
hasil('tampilan awal "bermain"', ctx.tampilan[0] === "bermain", ctx.tampilan[0]);
hasil("tanpa lapisan overlay", lapisan() === null);
hasil("fokus TIDAK dicuri (tetap body)", document.activeElement === document.body, document.activeElement?.tagName);

async function keTampilan(nama) {
  await act(async () => {
    ctx.tampilan[1](nama);
    await new Promise((r) => setTimeout(r, 20));
  });
}

async function tekanEscape() {
  await act(async () => {
    document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((r) => setTimeout(r, 20));
  });
}

for (const nama of ["database", "akun", "deteksi-engine", "impor"]) {
  console.log(`\n== layar ${nama} ==`);
  await keTampilan(nama);
  const lapis = lapisan();
  hasil("lapisan muncul", lapis !== null && lapis.getAttribute("data-uji") === `layar-${nama}`, lapis?.getAttribute("data-uji"));
  hasil("tabIndex -1 (fokus programatik)", lapis?.getAttribute("tabindex") === "-1", lapis?.getAttribute("tabindex"));
  hasil("fokus dibawa ke lapisan", document.activeElement === lapis, document.activeElement?.tagName);
  await tekanEscape();
  hasil("Escape → kembali ke papan", ctx.tampilan[0] === "bermain" && lapisan() === null, ctx.tampilan[0]);
}

console.log("\n== Akun dan Deteksi engine terpisah ==");
await act(async () => ctx.akun[1]({ platform: "chessCom", username: "ujiakun" }));
await keTampilan("akun");
const tombolAkun = Array.from(lapisan().querySelectorAll("button"));
hasil("layar Akun tidak memiliki pintasan Deteksi engine", !tombolAkun.some((b) => b.textContent.trim() === "Deteksi engine"));
hasil(
  "kartu kanan layar Akun tetap ada dalam keadaan kosong tanpa tab Ringkasan/Peringkat/Pembukaan",
  Boolean(lapisan()?.querySelector('[data-uji="akun-kartu-kanan"]'))
    && !["Ringkasan", "Peringkat", "Pembukaan"].some((label) => tombolAkun.some((b) => b.textContent.trim() === label)),
);
hasil("layar Akun tetap aktif saat dibuka", ctx.tampilan[0] === "akun");
await keTampilan("deteksi-engine");
hasil("layar Deteksi engine tetap bisa dibuka terpisah", lapisan()?.getAttribute("data-layar") === "deteksi-engine");
hasil("akun terpilih tetap dipakai di layar Deteksi engine", ctx.akun[0].username === "ujiakun" && lapisan()?.querySelector('[data-uji="deteksi-akun"]')?.value === "ujiakun");
await tekanEscape();
act(() => root.unmount());

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
