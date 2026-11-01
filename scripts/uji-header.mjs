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

// 4. Navigasi: "Teka-teki Harian" tidak lagi anak langsung Program Kami
//    (dulu ia terdaftar sebaris dengan "Teka-teki Catur"), melainkan berada
//    di grup "Alat Papan" bersama Lawan Bot — satu keluarga alat papan.
const { MENU_UTAMA } = await import("../src/menu.js");
const programKami = MENU_UTAMA.find((m) => m.title === "nav.programKami");
const anakLangsung = (programKami?.children || [])
  .filter((c) => !c.children)
  .map((c) => c.path);
const grupAlat = (programKami?.children || []).find(
  (c) => c.title === "nav.alatPapan"
);
const jalurGrup = (grupAlat?.children || []).map((c) => c.path);
hasil(
  "Teka-teki Harian bukan lagi anak langsung Program Kami",
  !anakLangsung.includes("/teka-teki-harian"),
  `anak langsung: ${anakLangsung.join(", ")}`
);
hasil(
  "Teka-teki Harian ada di grup Alat Papan",
  jalurGrup.includes("/teka-teki-harian"),
  `isi grup: ${jalurGrup.join(", ") || "(kosong)"}`
);
hasil(
  "grup Alat Papan juga memuat Lawan Bot",
  jalurGrup.includes("/papan-interaktif/manusia-vs-mesin")
);
hasil(
  "grup Alat Papan menuju /papan-interaktif",
  grupAlat?.path === "/papan-interaktif"
);

// 5. Submenu grup benar-benar bisa dibuka di DOM: tombol panah di samping
//    tautan grup memperlihatkan tautan Teka-teki Harian.
const liGrup = [...document.querySelectorAll("li")].find(
  (li) =>
    li.querySelector('a[href="/papan-interaktif"]') &&
    li.querySelector("button[aria-expanded]")
);
const tombolSub = liGrup?.querySelector("button[aria-expanded]");
hasil("tombol pembuka submenu Alat Papan ada", Boolean(tombolSub));
if (tombolSub) {
  await act(async () => {
    tombolSub.click();
  });
}
hasil(
  "submenu Alat Papan memuat tautan Teka-teki Harian",
  Boolean(document.querySelector('a[href="/teka-teki-harian"]')),
  "tautan /teka-teki-harian tidak tampil setelah submenu dibuka"
);

// Bersih-bersih: tutup drawer (Escape lewat handler dialog) tidak wajib —
// unmount cukup.
await act(async () => {
  root.unmount();
});

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal === 0) console.log("OK — sakelar bahasa dapat diakses di semua keadaan header.");
