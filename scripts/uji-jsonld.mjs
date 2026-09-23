/**
 * Uji DATA TERSTRUKTUR JSON-LD — khususnya BreadcrumbList.
 *
 * Latar belakang: Search Console melaporkan "URL di kolom 'id' tidak valid
 * (dalam 'itemListElement.item')" karena properti `item` breadcrumb berisi
 * URL relatif ("/" atau "/media-dan-informasi"). Google memperlakukan
 * `item` sebagai `@id` dan mewajibkan URL absolut http(s).
 *
 * Uji ini merender komponen BreadcrumbJsonLd yang ASLI di jsdom, membaca
 * skrip ld+json yang dirender Helmet (bukan hanya di <head>: jsonld dirender
 * di tempat monternya, head elements saja yang di-hoist jsdom ke <head>),
 * dan mengunci:
 *   1. setiap item yang punya `item` memakai URL absolut http(s);
 *   2. posisi berurutan mulai dari 1;
 *   3. item terakhir (halaman aktif) boleh tanpa `item`;
 *   4. helper urlAbsolut berperilaku benar untuk "/", path relatif, dan URL
 *      yang sudah absolut.
 *
 * Jalankan: node scripts/uji-jsonld.mjs
 */
import "./lingkungan-jsdom.mjs";
import { register } from "node:module";

register(new URL("./loader-jsx.mjs", import.meta.url));

// react-helmet-async v3 menjadwalkan pembaruan <head> lewat
// requestAnimationFrame GLOBAL (bukan window.requestAnimationFrame milik
// jsdom), jadi sediakan polyfill rAF berbasis setTimeout bila belum ada.
if (typeof globalThis.requestAnimationFrame === "undefined") {
  globalThis.requestAnimationFrame = (cb) =>
    setTimeout(() => cb(Date.now()), 0);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

const React = await import("react");
const { createRoot } = await import("react-dom/client");
const { HelmetProvider } = await import("react-helmet-async");
const { I18nProvider } = await import("../src/lib/i18n.jsx");
const { BreadcrumbJsonLd } = await import("../src/components/JsonLd.jsx");
const { urlAbsolut } = await import("../src/lib/urlSitus.js");

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

const ABSOLUT = /^https?:\/\/.+/i;

/* ---------------------------------- helper urlAbsolut */

hasil(
  "urlAbsolut('/') memakai origin jsdom dengan garis miring",
  urlAbsolut("/") === "http://localhost/"
);
hasil(
  "urlAbsolut('/media-dan-informasi') menjadi URL absolut",
  urlAbsolut("/media-dan-informasi") === "http://localhost/media-dan-informasi"
);
hasil(
  "urlAbsolut membiarkan URL absolut apa adanya",
  urlAbsolut("https://contoh.id/program-kami") === "https://contoh.id/program-kami"
);

/* ---------------------- render BreadcrumbJsonLd asli */

const root = createRoot(document.getElementById("root"));
const items = [
  { label: "Beranda", to: "/" },
  { label: "Media dan Informasi", to: "/media-dan-informasi" },
  { label: "Berita Komunitas" },
];

await act(async () => {
  root.render(
    React.createElement(
      HelmetProvider,
      null,
      React.createElement(
        I18nProvider,
        null,
        React.createElement(BreadcrumbJsonLd, { items })
      )
    )
  );
});

// Helmet v3 + React 19: title/meta/link di-hoist React ke <head>, sedangkan
// <script type="application/ld+json"> dirender di tempat komponen (dalam
// <div id=root>). Query seluruh dokumen, bukan hanya <head>.
const skrip = [
  ...document.querySelectorAll('script[type="application/ld+json"]'),
].map((el) => el.textContent);

hasil("Komponen menyuntik tepat satu skrip ld+json", skrip.length === 1);

let data = null;
try {
  data = JSON.parse(skrip[0] || "null");
} catch (e) {
  hasil("skrip ld+json adalah JSON valid", false, e.message);
}

if (data) {
  hasil("tipe data terstruktur BreadcrumbList", data["@type"] === "BreadcrumbList");
  const elemen = data.itemListElement;
  hasil("breadcrumbs punya 3 itemListElement", Array.isArray(elemen) && elemen.length === 3);

  elemen?.forEach((el, i) => {
    hasil(
      `posisi item #${i + 1} berurutan`,
      el.position === i + 1,
      `posisi sebenarnya ${el.position}`
    );
    if (el.item !== undefined) {
      hasil(
        `item "${el.name}" memakai URL absolut`,
        ABSOLUT.test(el.item),
        `nilai: ${JSON.stringify(el.item)}`
      );
    }
  });

  const terakhir = elemen?.[elemen.length - 1];
  hasil(
    "item terakhir (halaman aktif) tidak mengandung item",
    terakhir && terakhir.item === undefined
  );
  hasil(
    "item beranda menunjuk ke akar situs",
    elemen?.[0]?.item === "http://localhost/"
  );
  hasil(
    "item induk memakai path lengkap yang benar",
    elemen?.[1]?.item === "http://localhost/media-dan-informasi"
  );
}

await act(async () => {
  root.unmount();
});

console.log(`\n${gagal === 0 ? "LULUS" : "GAGAL"}: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
