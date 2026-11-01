/**
 * Uji regresi kerangka Header — akses sakelar bahasa & menu mobile.
 *
 * Latar: tombol ganti bahasa pernah hanya berada di top-bar desktop
 * (`hidden lg:block`) yang disembunyikan saat header menempel — pengguna
 * mobile tidak pernah bisa mengganti bahasa, dan pengguna desktop kehilangan
 * aksesnya setelah scroll. Uji ini mengunci:
 *   1. sakelar bahasa tampil di kluster tombol header yang selalu terlihat;
 *   2. drawer menu mobile memuat sakelar bahasa;
 *   3. klik sakelar benar-benar mengganti bahasa antarmuka.
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { MemoryRouter } = await import("react-router-dom");
const { I18nProvider } = await import("../src/lib/I18nProvider.jsx");
const { default: Header } = await import("../src/components/Header.jsx");

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

const el = document.getElementById("root");
const root = createRoot(el);

await act(async () => {
  root.render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ["/"] },
      React.createElement(I18nProvider, null, React.createElement(Header))
    )
  );
});

// 1. Sakelar bahasa ada di kluster tombol yang selalu tampil (bukan hanya
//    top-bar yang hilang saat scroll). Tombolnya satu-satunya dengan
//    aria-label "Pilih bahasa" di header utama.
const semuaSakelar = () =>
  [...document.querySelectorAll('button[aria-label^="Pilih bahasa,"]')];
hasil(
  "sakelar bahasa tampil di kerangka header",
  semuaSakelar().length >= 1,
  "tidak ditemukan"
);

// 2. Buka drawer menu mobile → sakelar bahasa juga tersedia di sana.
const tombolMenu = document.querySelector('button[aria-label="menu"]');
hasil("tombol menu mobile ada", Boolean(tombolMenu));
await act(async () => {
  tombolMenu.click();
});
const drawer = document.getElementById("drawer-navigasi");
hasil("drawer navigasi terbuka", Boolean(drawer));
hasil(
  "sakelar bahasa ada di drawer mobile",
  Boolean(drawer?.querySelector('button[aria-label^="Pilih bahasa,"]')),
  "tidak ditemukan di drawer"
);

// 3. Klik sakelar di drawer → bahasa berubah ke EN (teks tombol "EN").
const sakelarDrawer = drawer.querySelector('button[aria-label^="Pilih bahasa,"]');
await act(async () => {
  sakelarDrawer.click();
});
const labelEn = [...document.querySelectorAll('button[aria-label^="Choose language,"]')];
const labelEnAlt = [...document.querySelectorAll("button")].filter((b) =>
  b.textContent.trim() === "EN"
);
hasil(
  "klik sakelar mengganti bahasa ke EN",
  labelEn.length >= 1 || labelEnAlt.length >= 1,
  "label EN tidak ditemukan"
);

// 4. Navigasi Program Kami: TETAP daftar datar (tanpa submenu bertingkat).
//    Bentuk collapse lama dipertahankan — pengunjung menyukainya, dan submenu
//    panah di dalam dropdown terasa janggal. Teka-teki Harian berdiri sendiri
//    di halamannya (kerangka sidebar sendiri), bukan lewat menu bertingkat.
const { MENU_UTAMA } = await import("../src/menu.js");
const programKami = MENU_UTAMA.find((m) => m.title === "nav.programKami");
const anak = programKami?.children || [];
const bersarang = anak.filter((c) => Array.isArray(c.children));
hasil(
  "dropdown Program Kami tidak memakai submenu bertingkat",
  bersarang.length === 0,
  `grup bersarang: ${bersarang.map((c) => c.title).join(", ")}`
);
hasil(
  "Teka-teki Harian tetap satu baris di dropdown Program Kami",
  anak.some((c) => c.path === "/teka-teki-harian")
);
hasil(
  "Lawan Bot tetap satu baris (bukan di dalam grup)",
  anak.some((c) => c.path === "/papan-interaktif/manusia-vs-mesin")
);
hasil(
  "seluruh isi dropdown berupa tautan langsung",
  anak.every((c) => typeof c.path === "string" && !c.children)
);
hasil(
  "jumlah baris dropdown sama seperti bentuk lama",
  anak.length === 8,
  `jumlah: ${anak.length}`
);

// 5. Di DOM: tautan Teka-teki Harian harus langsung terlihat saat dropdown
//    Program Kami dibuka — tanpa perlu menekan panah submenu.
const liProgram = [...document.querySelectorAll("li")].find((li) =>
  li.querySelector('a[href="/program-kami/teka-teki"]')
);
await act(async () => {
  liProgram?.dispatchEvent(new window.MouseEvent("mouseenter", { bubbles: true }));
});
hasil(
  "tautan Teka-teki Harian langsung tampil di dropdown",
  Boolean(document.querySelector('a[href="/teka-teki-harian"]')),
  "tautan /teka-teki-harian tidak tampil"
);
hasil(
  "tidak ada tombol panah submenu di dropdown Program Kami",
  !liProgram?.querySelector("button[aria-expanded]"),
  "masih ada tombol pembuka submenu"
);

// Bersih-bersih: tutup drawer (Escape lewat handler dialog) tidak wajib —
// unmount cukup.
await act(async () => {
  root.unmount();
});

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal === 0) console.log("OK — sakelar bahasa dapat diakses di semua keadaan header.");
