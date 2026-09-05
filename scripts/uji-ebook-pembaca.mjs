/**
 * Uji pembaca E-Book & Panduan (tombol "Baca" — ikon mata).
 *
 * Yang dijaga skrip ini:
 *   1. `urlEbook()` selalu menunjuk proxy same-origin `/api/ebook-preview`
 *      (bukan URL GitHub Media yang memaksa unduhan), dan `?unduh=1` dipakai
 *      hanya untuk tombol Unduh.
 *   2. `sumberEbook()` memberi beberapa URL cadangan agar pratinjau tidak mati
 *      ketika satu sumber bermasalah.
 *   3. Allowlist proxy: hanya berkas PDF yang terdaftar di DAFTAR_EBOOK yang
 *      boleh dilayani (tidak ada path traversal).
 *   4. `vercel.json`: rewrite catch-all /api TIDAK boleh menelan
 *      /api/ebook-preview — regresi ini dulu membuat pratinjau balas 404
 *      sehingga modal "Baca" tampil kosong.
 *   5. Uji asap komponen PembacaPdf di jsdom: dokumen berhasil → kanvas +
 *      navigasi halaman; semua sumber gagal → pesan galat + tombol pemulihan.
 *
 * Jalankan: node scripts/uji-ebook-pembaca.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  cariEbookTerdaftar,
  namaBerkasEbook,
  sumberEbookServer,
} from "../src/data/ebook-sumber.js";
import { DAFTAR_EBOOK } from "../src/halaman/Beranda/ebook-data.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(ROOT, "noop.js"));

let lulus = 0;
const gagal = [];

function uji(nama, fn) {
  try {
    const hasil = fn();
    if (hasil instanceof Promise) throw new Error("gunakan ujiAsync untuk uji asinkron");
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal.push(`${nama}: ${e?.message || e}`);
    console.log(`  ✗ ${nama} — ${e?.message || e}`);
  }
}

async function ujiAsync(nama, fn) {
  try {
    await fn();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal.push(`${nama}: ${e?.message || e}`);
    console.log(`  ✗ ${nama} — ${e?.message || e}`);
  }
}

function benar(syarat, pesan) {
  if (!syarat) throw new Error(pesan);
}

const CONTOH = DAFTAR_EBOOK.find((b) => b.tersedia);
const NAMA_CONTOH = namaBerkasEbook(CONTOH.file);

/* -------------------------------------------------- 1 & 2. URL e-book ---- */

console.log("URL e-book (src/lib/asets.js):");

const { build } = require("esbuild");
const berkasAsets = path.join(tmpdir(), "kci-uji-ebook-asets.cjs");
await build({
  stdin: {
    contents: 'export * from "./src/lib/asets.js";',
    resolveDir: ROOT,
    loader: "js",
    sourcefile: "uji-ebook-asets-entry.js",
  },
  bundle: true,
  format: "cjs",
  platform: "node",
  outfile: berkasAsets,
  define: {
    "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: false, PROD: true }),
  },
  logLevel: "error",
});

const asets = require(berkasAsets);

uji("pratinjau memakai proxy same-origin, bukan GitHub Media", () => {
  const url = asets.urlEbook(CONTOH.file);
  benar(url.startsWith("/api/ebook-preview?file="), `URL tidak same-origin: ${url}`);
  benar(!/^https?:/i.test(url), "URL pratinjau tidak boleh lintas-origin");
  benar(
    decodeURIComponent(new URL(url, "https://contoh.id").searchParams.get("file")) === NAMA_CONTOH,
    "parameter file tidak sesuai nama berkas"
  );
});

uji("tombol unduh memaksa attachment lewat ?unduh=1", () => {
  const url = asets.urlEbook(CONTOH.file, { unduh: true });
  benar(url.includes("unduh=1"), `URL unduh salah: ${url}`);
});

uji("sumberEbook menyediakan cadangan berlapis", () => {
  const daftar = asets.sumberEbook(CONTOH.file);
  benar(Array.isArray(daftar) && daftar.length >= 3, "minimal tiga sumber cadangan");
  benar(daftar[0].startsWith("/api/ebook-preview"), "proxy same-origin harus dicoba lebih dulu");
  benar(
    daftar.some((u) => u.includes("/ebooks/")),
    "berkas statis /ebooks/ harus menjadi cadangan"
  );
  benar(
    daftar.some((u) => u.includes("media.githubusercontent.com")),
    "isi Git LFS harus menjadi cadangan terakhir"
  );
  benar(new Set(daftar).size === daftar.length, "sumber tidak boleh duplikat");
});

/* ------------------------------------------------------- 3. allowlist ---- */

console.log("Allowlist proxy (src/data/ebook-sumber.js):");

uji("berkas terdaftar dikenali walau nama ter-encode", () => {
  benar(cariEbookTerdaftar(CONTOH.file), "entri resmi seharusnya lolos");
  benar(cariEbookTerdaftar(NAMA_CONTOH), "nama polos seharusnya lolos");
});

uji("berkas di luar daftar ditolak", () => {
  benar(!cariEbookTerdaftar("rahasia.pdf"), "berkas asing tidak boleh dilayani");
  benar(!cariEbookTerdaftar("../vercel.json"), "path traversal tidak boleh dilayani");
  benar(!cariEbookTerdaftar("../../.env"), "berkas non-PDF tidak boleh dilayani");
});

uji("e-book bertanda tidak tersedia tidak dilayani", () => {
  const belum = DAFTAR_EBOOK.find((b) => !b.tersedia);
  if (!belum) return; // semua tersedia — tidak ada yang diuji
  benar(!cariEbookTerdaftar(belum.file), "dokumen 'segera hadir' tidak boleh dilayani");
});

uji("urutan sumber server: storage → statis → GitHub Media", () => {
  const daftar = sumberEbookServer(NAMA_CONTOH, { asal: "https://contoh.vercel.app" });
  benar(daftar.length >= 2, "minimal dua sumber");
  benar(
    daftar[daftar.length - 1].includes("media.githubusercontent.com"),
    "GitHub Media harus menjadi pilihan terakhir"
  );
  benar(
    daftar.some((u) => u.startsWith("https://contoh.vercel.app/ebooks/")),
    "berkas statis hasil build harus ikut dicoba"
  );
});

/* ------------------------------------------------- 4. routing Vercel ----- */

console.log("Routing Vercel (vercel.json):");

uji("/api/ebook-preview tidak tertelan rewrite catch-all", () => {
  const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  const catchAll = vercel.rewrites.find((r) => r.destination === "/api/[...jalur]");
  benar(catchAll, "rewrite catch-all /api tidak ditemukan");
  const pola = new RegExp(`^${catchAll.source}$`);
  benar(
    !pola.test("/api/ebook-preview"),
    `rewrite "${catchAll.source}" masih menelan /api/ebook-preview`
  );
  benar(pola.test("/api/kesehatan"), "rute API lain harus tetap masuk catch-all");
});

uji("CSP mengizinkan sumber cadangan PDF", () => {
  const vercel = readFileSync(path.join(ROOT, "vercel.json"), "utf8");
  const indeks = readFileSync(path.join(ROOT, "index.html"), "utf8");
  for (const [berkas, isi] of [["vercel.json", vercel], ["index.html", indeks]]) {
    const connect = /connect-src([^;]+);/.exec(isi)?.[1] || "";
    benar(
      connect.includes("media.githubusercontent.com"),
      `${berkas}: connect-src belum mengizinkan media.githubusercontent.com`
    );
  }
});

/* ------------------------------------------- 4b. proxy /api/ebook-preview */

console.log("Proxy pratinjau (api/ebook-preview.js):");

const { Writable } = await import("node:stream");

class ResPalsu extends Writable {
  constructor() {
    super();
    this.statusCode = 200;
    this.headers = {};
    this.potongan = [];
    this.selesai = new Promise((r) => {
      this._beres = r;
    });
  }
  setHeader(nama, nilai) {
    this.headers[String(nama).toLowerCase()] = String(nilai);
  }
  getHeader(nama) {
    return this.headers[String(nama).toLowerCase()];
  }
  status(kode) {
    this.statusCode = kode;
    return this;
  }
  json(isi) {
    this.badanJson = isi;
    this.end();
    return this;
  }
  _write(potongan, _enc, cb) {
    this.potongan.push(Buffer.from(potongan));
    cb();
  }
  end(...arg) {
    super.end(...arg);
    this._beres();
    return this;
  }
  get badan() {
    return Buffer.concat(this.potongan);
  }
}

const { default: penanganPratinjau } = await import("../api/ebook-preview.js");
const fetchAsli = globalThis.fetch;

async function panggilPratinjau(query, peta) {
  globalThis.fetch = async (url) => {
    const isi = peta[String(url)];
    if (isi === undefined) return new Response("tidak ada", { status: 404 });
    return new Response(isi, { status: 200, headers: { "Content-Type": "application/pdf" } });
  };
  const req = { method: "GET", headers: { host: "contoh.vercel.app" }, query };
  const res = new ResPalsu();
  try {
    await penanganPratinjau(req, res);
    await res.selesai;
  } finally {
    globalThis.fetch = fetchAsli;
  }
  return res;
}

const STATIS = `https://contoh.vercel.app/ebooks/${encodeURIComponent(NAMA_CONTOH)}`;
const LFS = `https://media.githubusercontent.com/media/Delta-Polder-Indonesia/ChessClub/main/public/ebooks/${encodeURIComponent(NAMA_CONTOH)}`;

await ujiAsync("melewati pointer Git LFS dan memakai isi PDF asli", async () => {
  const res = await panggilPratinjau(
    { file: CONTOH.file },
    {
      // Berkas statis hasil build hanyalah pointer teks 132 byte.
      [STATIS]: "version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 10\n",
      [LFS]: "%PDF-1.7\n… isi buku …",
    }
  );
  benar(res.statusCode === 200, `status tidak 200: ${res.statusCode} ${JSON.stringify(res.badanJson || "")}`);
  benar(res.getHeader("content-type") === "application/pdf", "Content-Type bukan PDF");
  benar(
    (res.getHeader("content-disposition") || "").startsWith("inline"),
    `harus inline agar tidak terunduh: ${res.getHeader("content-disposition")}`
  );
  benar(res.badan.subarray(0, 4).toString() === "%PDF", "badan respons bukan PDF");
});

await ujiAsync("?unduh=1 mengirim attachment", async () => {
  const res = await panggilPratinjau({ file: CONTOH.file, unduh: "1" }, { [LFS]: "%PDF-1.7 x" });
  benar(
    (res.getHeader("content-disposition") || "").startsWith("attachment"),
    "tombol Unduh harus memaksa attachment"
  );
});

await ujiAsync("berkas asing ditolak 404", async () => {
  const res = await panggilPratinjau({ file: "../vercel.json" }, {});
  benar(res.statusCode === 404, `status tidak 404: ${res.statusCode}`);
});

await ujiAsync("semua sumber mati → 502 dengan pesan yang jelas", async () => {
  const res = await panggilPratinjau({ file: DAFTAR_EBOOK.filter((b) => b.tersedia)[1].file }, {});
  benar(res.statusCode === 502, `status tidak 502: ${res.statusCode}`);
  benar(String(res.badanJson?.error || "").length > 10, "pesan galat kosong");
});

/* ------------------------------------------- 5. uji asap komponen (DOM) -- */

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  console.log("lewati uji DOM pembaca — pasang `npm i -D jsdom esbuild` untuk menjalankannya.");
} else {
  console.log("Komponen PembacaPdf (jsdom):");

  const { JSDOM } = require("jsdom");

  const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import PembacaPdf from "./src/components/PembacaPdf.jsx";

export function mount(el, props) {
  const root = createRoot(el);
  root.render(<PembacaPdf {...props} />);
  return root;
}
`;

  // pdf.js diganti tiruan: yang diuji adalah alur komponen, bukan mesin PDF.
  const stubPdfjs = {
    name: "stub-pdfjs",
    setup(bangun) {
      bangun.onResolve({ filter: /^pdfjs-dist/ }, (arg) => ({
        path: arg.path,
        namespace: "stub-pdfjs",
      }));
      bangun.onLoad({ filter: /.*/, namespace: "stub-pdfjs" }, (arg) => {
        if (arg.path.includes("worker")) {
          return { contents: 'export default "/stub/pdf.worker.mjs";', loader: "js" };
        }
        return {
          contents: `
            export const GlobalWorkerOptions = { workerSrc: "" };
            export function getDocument(opsi) {
              const tugas = { onProgress: null, destroy() {} };
              tugas.promise = globalThis.__pdfStub(opsi);
              return tugas;
            }
          `,
          loader: "js",
        };
      });
    },
  };

  const berkasBundel = path.join(tmpdir(), "kci-uji-ebook-pembaca.cjs");
  await build({
    stdin: {
      contents: MASUK,
      resolveDir: ROOT,
      loader: "jsx",
      sourcefile: "uji-ebook-pembaca-entry.jsx",
    },
    bundle: true,
    format: "cjs",
    platform: "browser",
    outfile: berkasBundel,
    plugins: [stubPdfjs],
    loader: { ".css": "empty", ".svg": "text", ".png": "dataurl", ".webp": "dataurl" },
    define: {
      "process.env.NODE_ENV": '"development"',
      "import.meta.env": JSON.stringify({ BASE_URL: "/", MODE: "test", DEV: true, PROD: false }),
    },
    logLevel: "error",
  });

  const dom = new JSDOM("<!doctype html><html><body><div id='akar'></div></body></html>", {
    url: "https://contoh.id/program-kami/ebook-panduan",
    pretendToBeVisual: true,
  });

  const { window } = dom;
  window.ResizeObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe() {
      this.cb([{ contentRect: { width: 800 } }]);
    }
    unobserve() {}
    disconnect() {}
  };
  window.HTMLCanvasElement.prototype.getContext = () => ({
    setTransform() {},
    fillRect() {},
    drawImage() {},
    save() {},
    restore() {},
  });

  for (const kunci of [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "ResizeObserver",
    "getComputedStyle",
  ]) {
    if (!window[kunci]) continue;
    try {
      globalThis[kunci] = window[kunci];
    } catch {
      // Node >= 21 sudah punya `navigator` bawaan yang read-only — biarkan.
    }
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  // React memperingatkan pembaruan state di luar act(); tidak relevan untuk
  // uji asap ini dan hanya membuat keluaran berisik.
  const galatAsli = console.error;
  console.error = (...arg) => {
    if (String(arg[0] || "").includes("not wrapped in act")) return;
    galatAsli(...arg);
  };

  const { mount } = require(berkasBundel);

  const tunggu = (ms = 30) => new Promise((r) => setTimeout(r, ms));
  const teks = () => window.document.getElementById("akar").textContent;

  await ujiAsync("dokumen berhasil dimuat → kanvas & navigasi halaman tampil", async () => {
    globalThis.__pdfStub = async () => ({
      numPages: 3,
      destroy() {},
      getPage: async () => ({
        getViewport: ({ scale }) => ({ width: 600 * scale, height: 800 * scale, scale }),
        render: () => ({ promise: Promise.resolve(), cancel() {} }),
      }),
    });

    const el = window.document.getElementById("akar");
    mount(el, {
      sumber: ["/api/ebook-preview?file=a.pdf"],
      judul: "Contoh",
      urlUnduh: "/api/ebook-preview?file=a.pdf&unduh=1",
    });
    await tunggu(80);

    benar(el.querySelector("canvas"), "kanvas halaman tidak dirender");
    benar(teks().includes("/ 3"), `jumlah halaman tidak tampil: ${teks()}`);
    const nomor = el.querySelector('input[type="number"]');
    benar(nomor && Number(nomor.value) === 1, "penunjuk halaman awal bukan 1");

    const berikutnya = [...el.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === "Halaman berikutnya"
    );
    benar(berikutnya, "tombol halaman berikutnya tidak ada");
    berikutnya.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await tunggu(60);
    benar(
      Number(el.querySelector('input[type="number"]').value) === 2,
      "tombol berikutnya tidak memindahkan halaman"
    );
  });

  await ujiAsync("semua sumber gagal → pesan galat + tombol pemulihan", async () => {
    globalThis.__pdfStub = async () => {
      throw new Error("sumber mati");
    };

    const el = window.document.createElement("div");
    window.document.body.appendChild(el);
    mount(el, {
      sumber: ["/api/ebook-preview?file=a.pdf", "https://cdn.contoh/a.pdf"],
      judul: "Contoh",
      urlUnduh: "/api/ebook-preview?file=a.pdf&unduh=1",
    });
    await tunggu(120);

    const isi = el.textContent;
    benar(isi.includes("gagal dimuat"), `pesan galat tidak tampil: ${isi}`);
    benar(isi.includes("Coba lagi"), "tombol coba lagi tidak tersedia");
    benar(
      [...el.querySelectorAll("a")].some((a) => a.hasAttribute("download")),
      "tautan unduh cadangan tidak tersedia"
    );
  });
}

/* --------------------------------------------------------------- hasil -- */

console.log("");
if (gagal.length) {
  console.error(`${lulus} lulus, ${gagal.length} gagal`);
  for (const g of gagal) console.error(`  - ${g}`);
  process.exit(1);
}
console.log(`${lulus} lulus, 0 gagal — pembaca e-book aman.`);
