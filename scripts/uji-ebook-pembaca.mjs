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
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

uji("urlEbook memakai proxy same-origin", () => {
  const url = asets.urlEbook(CONTOH.file);
  benar(url.startsWith("/api/ebook-preview?file="), `URL tidak same-origin: ${url}`);
  benar(!/^https?:/i.test(url), "URL tidak boleh lintas-origin");
  const parsed = new URL(url, "https://contoh.id");
  benar(
    decodeURIComponent(parsed.searchParams.get("file")) === NAMA_CONTOH,
    "parameter file tidak sesuai nama berkas"
  );
  benar(parsed.searchParams.get("tiket") === null, "membaca tidak lagi memakai tiket");
  benar(parsed.searchParams.get("unduh") === null, "urlEbook tanpa opsi.unduh tidak boleh memaksa attachment");
});

uji("tombol unduh memaksa attachment lewat ?unduh=1 + tiket", () => {
  const tiket = "tiket-uji";
  const url = asets.urlEbook(CONTOH.file, { unduh: true, tiket });
  benar(url.includes("unduh=1"), `URL unduh salah: ${url}`);
  benar(new URL(url, "https://contoh.id").searchParams.get("tiket") === tiket, "tiket tidak ikut URL unduh");
});

uji("sumberEbook: berkas statis dulu, lalu proxy tanpa tiket", () => {
  const daftar = asets.sumberEbook(CONTOH.file);
  benar(Array.isArray(daftar) && daftar.length === 2, `jumlah sumber tak terduga: ${daftar.length}`);
  benar(daftar[0] === CONTOH.file, `sumber pertama bukan berkas statis: ${daftar[0]}`);
  benar(daftar[1].startsWith("/api/ebook-preview"), "cadangan harus proxy same-origin");
  const parsed = new URL(daftar[1], "https://contoh.id");
  benar(parsed.searchParams.get("tiket") === null, "membaca via proxy tidak boleh menuntut tiket");
  benar(parsed.searchParams.get("unduh") === null, "membaca tidak boleh meminta attachment");
  for (const url of daftar) {
    benar(!url.includes("media.githubusercontent.com"), "GitHub Media tidak boleh masuk bundle browser");
    benar(!/^https?:/i.test(url), `sumber tidak same-origin: ${url}`);
  }
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

uji("/ebooks/* tetap berkas statis (mode baca) dan boleh di-cache", () => {
  const vercel = JSON.parse(readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  // Pembaca memuat berkas statis `/ebooks/<nama>.pdf`; kalau rute ini di-rewrite
  // ke API, sumber pertama pembaca mati dan pembaca jatuh ke jalur proxy terus.
  const rute = vercel.rewrites.find((r) => String(r.source).startsWith("/ebooks/"));
  benar(!rute, `rewrite /ebooks/* menghalangi mode baca: ${JSON.stringify(rute)}`);
  const header = vercel.headers.find((item) => item.source === "/ebooks/(.*)");
  benar(
    header?.headers?.some(
      (item) => item.key === "Cache-Control" && item.value.startsWith("public")
    ),
    "PDF mode baca sebaiknya boleh di-cache (berkas besar, dibaca berulang)"
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

await ujiAsync("middleware lokal meneruskan /ebooks/* (berkas statis untuk mode baca)", async () => {
  let middleware;
  pratinjauEbook({ akar: ROOT }).configureServer({
    middlewares: {
      use(fn) {
        middleware = fn;
      },
    },
  });
  const diteruskan = await new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader() {},
      end() {
        resolve(false);
      },
    };
    middleware({ method: "GET", url: `/ebooks/${encodeURIComponent(NAMA_CONTOH)}` }, res, () => {
      resolve(true);
    });
  });
  benar(diteruskan, "berkas statis /ebooks/* harus dilayani Vite, bukan ditahan middleware");
});

/* -------------------------- 4b. rahasia tiket lintas proses (dev/preview) */

console.log("Rahasia tiket lintas proses (mode pengembangan):");

const TIKET_EBOOK_URL = pathToFileURL(
  path.join(ROOT, "server/src/tiket-ebook.js")
).href;

/**
 * Jalankan skrip di proses Node TERPISAH tanpa `KCI_JWT_SECRET`.
 *
 * Inilah bentuk asli `npm run dev`: backend (8787) menerbitkan tiket, lalu
 * middleware Vite (5173) memverifikasinya di PROSES YANG BERBEDA. Bila rahasia
 * pengembangan diacak per proses, setiap tiket yang sah ditolak 403 dan tombol
 * mata hanya menampilkan "Gagal memuat dokumen PDF" walau kode aksesnya benar.
 */
function prosesNode(skrip, tambahanEnv = {}) {
  const env = { ...process.env, ...tambahanEnv };
  // Rahasia dari shell induk tidak boleh "menyelamatkan" uji ini: yang diuji
  // adalah bawaan pengembangan yang dipakai saat nilainya tidak diisi.
  delete env.KCI_JWT_SECRET;
  const anak = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", skrip],
    { cwd: ROOT, env, encoding: "utf8" }
  );
  if (anak.status !== 0) {
    throw new Error(
      `proses anak keluar dengan kode ${anak.status}: ${(anak.stderr || anak.stdout || "").trim()}`
    );
  }
  return anak.stdout.trim();
}

uji("tiket dari proses lain tetap sah di verifikator", () => {
  const tiket = prosesNode(
    `import { terbitkanTiketUnduh } from ${JSON.stringify(TIKET_EBOOK_URL)};
     process.stdout.write(terbitkanTiketUnduh(process.env.KCI_UJI_NAMA));`,
    { KCI_UJI_NAMA: NAMA_CONTOH }
  );
  benar(tiket.startsWith("kci-ebook-v1."), `bentuk tiket tidak dikenal: ${tiket.slice(0, 30)}`);

  const hasil = prosesNode(
    `import { periksaTiketUnduh } from ${JSON.stringify(TIKET_EBOOK_URL)};
     const sah = periksaTiketUnduh(process.env.KCI_UJI_TIKET, process.env.KCI_UJI_NAMA);
     process.stdout.write(sah ? "sah" : "tidak");`,
    { KCI_UJI_TIKET: tiket, KCI_UJI_NAMA: NAMA_CONTOH }
  );
  benar(
    hasil === "sah",
    `tiket yang diterbitkan proses lain ditolak (${hasil}) — rahasia JWT pengembangan harus sama antar proses`
  );
});

/* ------------------------------------------- 4c. proxy /api/ebook-preview */

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
  benar(
    res.getHeader("cache-control") === "private, max-age=300",
    `pratinjau mode baca boleh di-cache privat, dapat: ${res.getHeader("cache-control")}`
  );
  benar(
    (res.getHeader("content-disposition") || "").startsWith("inline"),
    `harus inline agar tidak terunduh: ${res.getHeader("content-disposition")}`
  );
  benar(res.badan.subarray(0, 4).toString() === "%PDF", "badan respons bukan PDF");
});

await ujiAsync("membaca tanpa tiket tetap dilayani (inline)", async () => {
  const res = await panggilPratinjau({ file: CONTOH.file }, { [LFS]: "%PDF-1.7 x" });
  benar(res.statusCode === 200, `preview tanpa tiket harus 200, dapat ${res.statusCode}`);
  benar(
    (res.getHeader("content-disposition") || "").startsWith("inline"),
    "preview harus inline supaya tampil di pembaca"
  );
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

uji("Baca bebas: pembaca dibuka tanpa gerbang kode", () => {
  const halaman = readFileSync(path.join(ROOT, "src/halaman/ProgramKami/EbookPanduan.jsx"), "utf8");
  const pembaca = halaman.slice(
    halaman.indexOf("padaBaca={()"),
    halaman.indexOf("padaUnduh={")
  );
  benar(pembaca.includes("setPdfAktif({"), "aksi Baca belum membuka pembaca");
  benar(!pembaca.includes("setUnduhan("), "aksi Baca tidak boleh lagi membuka gerbang kode");
  benar(!pembaca.includes("tujuanAkses"), "aksi Baca masih memakai alur redemption lama");
  benar(
    halaman.includes("sumber={sumberEbook(pdfAktif.file)}"),
    "pembaca belum memakai sumber baca tanpa tiket"
  );
});

uji("Unduh tetap lewat gerbang kode dan tiket redemption", () => {
  const halaman = readFileSync(path.join(ROOT, "src/halaman/ProgramKami/EbookPanduan.jsx"), "utf8");
  const modal = readFileSync(path.join(ROOT, "src/halaman/ProgramKami/ModalUnduhEbook.jsx"), "utf8");
  benar(halaman.includes("padaUnduh={() => setUnduhan(buku)}"), "aksi Unduh belum membuka gerbang kode");
  benar(modal.includes("tebusUnduhanEbook("), "modal belum menebus kode di server");
  benar(halaman.includes("tiket: tiketLayak"), "tautan unduhan belum memakai tiket hasil redemption");
  benar(
    /urlUnduh=\{\s*pdfAktif\.tiketUnduh/.test(halaman),
    "tautan unduh pembaca harus kosong bila tiket unduhan tidak ada"
  );
});

uji("pembaca bisa melaporkan kegagalan (padaGagal) ke pemanggil", () => {
  const pembaca = readFileSync(path.join(ROOT, "src/components/PembacaPdf.jsx"), "utf8");
  const halaman = readFileSync(path.join(ROOT, "src/halaman/ProgramKami/EbookPanduan.jsx"), "utf8");
  benar(pembaca.includes("padaGagal?.()"), "PembacaPdf belum memanggil padaGagal saat semua sumber gagal");
  // Membaca tidak memakai tiket: kegagalan pembaca tidak boleh menghapus
  // tiket unduhan yang masih sah (dulu tiket dihapus di sini).
  benar(
    !halaman.includes("hapusTiketSesi("),
    "kegagalan pembaca tidak boleh membuang tiket unduhan yang masih sah"
  );
  // Regresi yang paling mudah terjadi: mengubah `sumber` di dalam padaGagal
  // akan memicu efek pemuatan lagi (dependensi `daftarSumber`).
  benar(
    !/padaGagal=\{\(\) => \{[\s\S]{0,400}?setPdfAktif/.test(halaman),
    "padaGagal mengubah state pembaca → berisiko pemuatan berulang tanpa henti"
  );
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
    let gagalDipanggil = false;
    mount(el, {
      sumber: ["/api/ebook-preview?file=a.pdf"],
      judul: "Contoh",
      urlUnduh: "/api/ebook-preview?file=a.pdf&unduh=1",
      padaGagal: () => {
        gagalDipanggil = true;
      },
    });

    benar(await tungguSampai(() => el.querySelector("canvas")), "kanvas halaman tidak dirender");
    benar(!gagalDipanggil, "padaGagal dipanggil saat dokumen justru berhasil dimuat");
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
    let jumlahGagal = 0;
    let jumlahPercobaan = 0;
    const stubAsli = globalThis.__pdfStub;
    globalThis.__pdfStub = async (...arg) => {
      jumlahPercobaan += 1;
      return stubAsli(...arg);
    };
    mount(el, {
      sumber: ["/api/ebook-preview?file=a.pdf", "https://cdn.contoh/a.pdf"],
      judul: "Contoh",
      urlUnduh: "/api/ebook-preview?file=a.pdf&unduh=1",
      padaGagal: () => {
        jumlahGagal += 1;
      },
    });

    const berhasil = await tungguSampai(() => el.textContent.includes("gagal dimuat"));
    const isi = el.textContent;
    benar(berhasil, `pesan galat tidak tampil: ${isi}`);
    benar(isi.includes("Coba lagi"), "tombol coba lagi tidak tersedia");
    benar(
      [...el.querySelectorAll("a")].some((a) => a.hasAttribute("download")),
      "tautan unduh cadangan tidak tersedia"
    );
    benar(jumlahGagal === 1, `padaGagal dipanggil ${jumlahGagal}× (harus tepat 1×)`);
    // `sumber` dipakai sebagai dependensi efek pemuatan; kalau pemanggil
    // mengubahnya di dalam padaGagal, percobaan akan berputar tanpa akhir.
    await tunggu(120);
    benar(
      jumlahPercobaan === 2,
      `pemuatan berulang tanpa henti: ${jumlahPercobaan} percobaan (harus 2, satu per sumber)`
    );
    benar(jumlahGagal === 1, `padaGagal berulang: ${jumlahGagal}×`);
  });

  await ujiAsync("403 / 503 → pesan sebabnya, bukan 'dokumen rusak'", async () => {
    const pasang = (status) => {
      globalThis.__pdfStub = async () => {
        // Bentuk galat pdf.js saat respons non-2xx.
        const galat = new Error(`Unexpected server response (${status}) while retrieving PDF`);
        galat.status = status;
        throw galat;
      };
      const el = window.document.createElement("div");
      window.document.body.appendChild(el);
      mount(el, { sumber: ["/api/ebook-preview?file=a.pdf"], judul: "Contoh" });
      return el;
    };

    const el403 = pasang(403);
    benar(
      await tungguSampai(() => el403.textContent.includes("403")),
      `pesan penolakan 403 tidak tampil: ${el403.textContent}`
    );

    const el503 = pasang(503);
    benar(
      await tungguSampai(() => el503.textContent.includes("belum tersedia di server")),
      `pesan berkas belum tersedia tidak tampil: ${el503.textContent}`
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
