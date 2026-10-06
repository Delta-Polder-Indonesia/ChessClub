/**
 * Uji pembaca E-Book & Panduan (tombol "Baca" — ikon mata).
 *
 * Yang dijaga skrip ini:
 *   1. `urlEbook()` selalu menunjuk proxy same-origin `/api/ebook-preview`
 *      (bukan URL storage/GitHub), membawa tiket, dan `?unduh=1` dipakai
 *      hanya untuk tombol Unduh.
 *   2. `sumberEbook()` hanya mengembalikan satu URL proxy bertiket sehingga
 *      browser tidak menerima fallback publik.
 *   3. Allowlist proxy: hanya berkas PDF yang terdaftar di DAFTAR_EBOOK yang
 *      boleh dilayani (tidak ada path traversal), dan tiket wajib untuk preview.
 *   4. `vercel.json`: rewrite `/ebooks/*` masuk ke endpoint dan rewrite catch-all
 *      /api TIDAK boleh menelan /api/ebook-preview.
 *   5. Uji alur UI: Baca harus melewati redemption sebelum membuka pembaca.
 *   6. Uji asap komponen PembacaPdf di jsdom: dokumen berhasil → kanvas +
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
import { pratinjauEbook } from "../plugins/ebook-preview.js";
import { sumberEbookPrivat } from "../server/src/ebook-storage.js";
import { DAFTAR_EBOOK } from "../src/halaman/Beranda/ebook-data.js";
import { terbitkanTiketUnduh } from "../server/src/tiket-ebook.js";

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

uji("pratinjau memakai proxy same-origin dan tiket", () => {
  const tiket = "tiket-uji";
  const url = asets.urlEbook(CONTOH.file, { tiket });
  benar(url.startsWith("/api/ebook-preview?file="), `URL tidak same-origin: ${url}`);
  benar(!/^https?:/i.test(url), "URL pratinjau tidak boleh lintas-origin");
  const parsed = new URL(url, "https://contoh.id");
  benar(
    decodeURIComponent(parsed.searchParams.get("file")) === NAMA_CONTOH,
    "parameter file tidak sesuai nama berkas"
  );
  benar(parsed.searchParams.get("tiket") === tiket, "tiket tidak ikut URL pratinjau");
});

uji("tombol unduh memaksa attachment lewat ?unduh=1 + tiket", () => {
  const tiket = "tiket-uji";
  const url = asets.urlEbook(CONTOH.file, { unduh: true, tiket });
  benar(url.includes("unduh=1"), `URL unduh salah: ${url}`);
  benar(new URL(url, "https://contoh.id").searchParams.get("tiket") === tiket, "tiket tidak ikut URL unduh");
});

uji("sumberEbook hanya mengembalikan proxy bertiket", () => {
  const daftar = asets.sumberEbook(CONTOH.file, { tiket: "tiket-uji" });
  benar(Array.isArray(daftar) && daftar.length === 1, "browser tidak boleh menerima fallback publik");
  benar(daftar[0].startsWith("/api/ebook-preview"), "sumber harus proxy same-origin");
  benar(new URL(daftar[0], "https://contoh.id").searchParams.get("tiket") === "tiket-uji", "tiket tidak ada");
  benar(!daftar[0].includes("media.githubusercontent.com"), "GitHub Media tidak boleh masuk bundle browser");
  benar(!daftar[0].includes("/ebooks/"), "URL statis tidak boleh masuk bundle browser");
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

uji("storage privat tidak membocorkan credential ke URL", () => {
  const baseSebelum = process.env.KCI_EBOOK_PRIVATE_BASE;
  const tokenSebelum = process.env.KCI_EBOOK_PRIVATE_TOKEN;
  process.env.KCI_EBOOK_PRIVATE_BASE = "https://storage-internal.example/ebooks";
  process.env.KCI_EBOOK_PRIVATE_TOKEN = "token-uji";
  try {
    const [kandidat] = sumberEbookPrivat(NAMA_CONTOH);
    benar(kandidat?.url.startsWith("https://storage-internal.example/ebooks/"), "basis storage privat salah");
    benar(kandidat.url.includes(encodeURIComponent(NAMA_CONTOH)), "nama PDF tidak di-encode");
    benar(kandidat.headers.Authorization === "Bearer token-uji", "token tidak dikirim sebagai header privat");
    benar(!kandidat.url.includes("token-uji"), "credential bocor ke URL");
  } finally {
    if (baseSebelum === undefined) delete process.env.KCI_EBOOK_PRIVATE_BASE;
    else process.env.KCI_EBOOK_PRIVATE_BASE = baseSebelum;
    if (tokenSebelum === undefined) delete process.env.KCI_EBOOK_PRIVATE_TOKEN;
    else process.env.KCI_EBOOK_PRIVATE_TOKEN = tokenSebelum;
  }
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

uji("/ebooks/* dirutekan ke proxy dan tidak cache publik", () => {
  const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  const rute = vercel.rewrites.find((r) => r.source === "/ebooks/:path*");
  benar(rute?.destination === "/api/ebook-preview?file=:path*", "rute /ebooks/* belum masuk proxy");
  const header = vercel.headers.find((item) => item.source === "/ebooks/(.*)");
  benar(
    header?.headers?.some((item) => item.key === "Cache-Control" && item.value === "no-store"),
    "PDF /ebooks/* tidak boleh memiliki cache publik"
  );
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

await ujiAsync("middleware lokal memblokir PDF statis langsung", async () => {
  let middleware;
  pratinjauEbook({ akar: ROOT }).configureServer({
    middlewares: {
      use(fn) {
        middleware = fn;
      },
    },
  });
  const selesai = new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(nama, nilai) {
        this.headers[nama.toLowerCase()] = String(nilai);
      },
      end(badan = "") {
        this.badan = String(badan);
        resolve(this);
      },
    };
    middleware({ method: "GET", url: `/ebooks/${encodeURIComponent(NAMA_CONTOH)}` }, res, () => {
      throw new Error("akses /ebooks/* diteruskan ke Vite");
    });
  });
  const res = await selesai;
  benar(res.statusCode === 403, `akses statis langsung harus 403, dapat ${res.statusCode}`);
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
  const tiket = terbitkanTiketUnduh(NAMA_CONTOH);
  const res = await panggilPratinjau(
    { file: CONTOH.file, tiket },
    {
      // Berkas statis hasil build hanyalah pointer teks 132 byte.
      [STATIS]: "version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 10\n",
      [LFS]: "%PDF-1.7\n… isi buku …",
    }
  );
  benar(res.statusCode === 200, `status tidak 200: ${res.statusCode} ${JSON.stringify(res.badanJson || "")}`);
  benar(res.getHeader("content-type") === "application/pdf", "Content-Type bukan PDF");
  benar(res.getHeader("cache-control") === "private, no-store", "PDF bertiket tidak boleh di-cache publik");
  benar(
    (res.getHeader("content-disposition") || "").startsWith("inline"),
    `harus inline agar tidak terunduh: ${res.getHeader("content-disposition")}`
  );
  benar(res.badan.subarray(0, 4).toString() === "%PDF", "badan respons bukan PDF");
});

await ujiAsync("preview tanpa tiket ditolak 403", async () => {
  const res = await panggilPratinjau({ file: CONTOH.file }, { [LFS]: "%PDF-1.7 x" });
  benar(res.statusCode === 403, `preview tanpa tiket harus 403, dapat ${res.statusCode}`);
});

await ujiAsync("?unduh=1 tanpa tiket ditolak 403", async () => {
  const res = await panggilPratinjau({ file: CONTOH.file, unduh: "1" }, { [LFS]: "%PDF-1.7 x" });
  benar(res.statusCode === 403, `unduh tanpa tiket harus 403, dapat ${res.statusCode}`);
});

await ujiAsync("?unduh=1 mengirim attachment setelah tiket sah", async () => {
  const tiket = terbitkanTiketUnduh(NAMA_CONTOH);
  const res = await panggilPratinjau(
    { file: CONTOH.file, unduh: "1", tiket },
    { [LFS]: "%PDF-1.7 x" }
  );
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
  const bukuLain = DAFTAR_EBOOK.filter((b) => b.tersedia)[1];
  const tiket = terbitkanTiketUnduh(namaBerkasEbook(bukuLain.file));
  const res = await panggilPratinjau({ file: bukuLain.file, tiket }, {});
  benar(res.statusCode === 502, `status tidak 502: ${res.statusCode}`);
  benar(String(res.badanJson?.error || "").length > 10, "pesan galat kosong");
});

/* ----------------------------------------------- 5. alur redemption UI -- */

uji("Baca menebus tiket sebelum membuka pembaca", () => {
  const halaman = readFileSync(path.join(ROOT, "src/halaman/ProgramKami/EbookPanduan.jsx"), "utf8");
  const modal = readFileSync(path.join(ROOT, "src/halaman/ProgramKami/ModalUnduhEbook.jsx"), "utf8");
  benar(halaman.includes('setUnduhan({ ...buku, tujuanAkses: "baca" })'), "aksi Baca belum membuka gerbang redemption");
  benar(halaman.includes("tiketUnduh: catatan.tiketUnduh"), "tiket redemption belum diteruskan ke pembaca");
  benar(modal.includes('buku.tujuanAkses === "baca"'), "modal belum membedakan tujuan Baca");
  benar(modal.includes("onTebusSukses?.(catatan)"), "callback tiket ke pembaca belum dipanggil");
});

/* ------------------------------------------- 6. uji asap komponen (DOM) -- */

function ada(nama) {
  try {
    require.resolve(nama);
    return true;
  } catch {
    return false;
  }
}

if (!ada("jsdom") || !ada("esbuild")) {
  gagal.push("uji DOM pembaca tidak berjalan: jsdom atau esbuild tidak terpasang");
  console.error("  ✗ uji DOM pembaca tidak berjalan — jsdom dan esbuild wajib terpasang.");
} else {
  console.log("Komponen PembacaPdf (jsdom):");

  const { JSDOM } = require("jsdom");

  const MASUK = `
import React from "react";
import { createRoot } from "react-dom/client";
import PembacaPdf from "./src/components/PembacaPdf.jsx";
import { I18nProvider } from "./src/lib/i18n.jsx";

export function mount(el, props) {
  const root = createRoot(el);
  root.render(
    <I18nProvider>
      <PembacaPdf {...props} />
    </I18nProvider>
  );
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

  // Menunggu hingga kondisi terpenuhi, bukan tidur dengan durasi tetap: di
  // jsdom, reaksi komponen (React 19) tidak selalu selesai dalam satu tick
  // grafis sehingga tidur tetap bisa membaca DOM terlalu dini.
  const tungguSampai = async (ketika, tenggat = 2000, selang = 15) => {
    const mulai = Date.now();
    for (;;) {
      if (ketika()) return true;
      if (Date.now() - mulai > tenggat) return false;
      await tunggu(selang);
    }
  };

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

    benar(await tungguSampai(() => el.querySelector("canvas")), "kanvas halaman tidak dirender");
    await tunggu(20);
    benar(teks().includes("/ 3"), `jumlah halaman tidak tampil: ${teks()}`);
    const nomor = el.querySelector('input[type="number"]');
    benar(nomor && Number(nomor.value) === 1, "penunjuk halaman awal bukan 1");

    const berikutnya = [...el.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === "Halaman berikutnya"
    );
    benar(berikutnya, "tombol halaman berikutnya tidak ada");
    berikutnya.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    benar(
      await tungguSampai(() => Number(el.querySelector('input[type="number"]')?.value) === 2),
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

    const berhasil = await tungguSampai(() => el.textContent.includes("gagal dimuat"));
    const isi = el.textContent;
    benar(berhasil, `pesan galat tidak tampil: ${isi}`);
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
