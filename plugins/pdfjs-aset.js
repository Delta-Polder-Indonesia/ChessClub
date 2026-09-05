/**
 * Sajikan aset pendukung pdf.js (cMaps & font standar) tanpa menyalinnya
 * ke dalam repositori.
 *
 * pdf.js membutuhkan dua folder data agar dokumen dengan font non-embedded
 * atau encoding CJK tetap tampil benar:
 *   - `cmaps/`          → tabel encoding karakter
 *   - `standard_fonts/` → font bawaan PDF (Helvetica, Times, dst.)
 *
 * Keduanya ikut terpasang bersama paket `pdfjs-dist` di node_modules. Plugin
 * ini menyajikannya di `/vendor/pdfjs/…` saat dev/preview, dan menyalinnya ke
 * `dist/vendor/pdfjs/…` saat build — jadi tidak ada berkas biner yang perlu
 * di-commit.
 */
import fsp from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const PREFIKS = "/vendor/pdfjs/";
const FOLDER = ["cmaps", "standard_fonts"];

const TIPE = {
  ".bcmap": "application/octet-stream",
  ".pfb": "application/octet-stream",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

function akarPdfjs() {
  try {
    return path.dirname(require_.resolve("pdfjs-dist/package.json"));
  } catch {
    return "";
  }
}

async function salinFolder(asal, tujuan) {
  await fsp.mkdir(tujuan, { recursive: true });
  const isi = await fsp.readdir(asal, { withFileTypes: true });
  for (const entri of isi) {
    const dari = path.join(asal, entri.name);
    const ke = path.join(tujuan, entri.name);
    if (entri.isDirectory()) await salinFolder(dari, ke);
    else await fsp.copyFile(dari, ke);
  }
}

export function asetPdfjs({ akar = process.cwd(), outDir = "dist" } = {}) {
  const basisPaket = akarPdfjs();

  const middleware = async (req, res, next) => {
    const jalur = (req.url || "/").split("?")[0];
    const indeks = jalur.indexOf(PREFIKS);
    if (indeks === -1 || !basisPaket) return next();

    const relatif = decodeURIComponent(jalur.slice(indeks + PREFIKS.length));
    const folder = relatif.split("/")[0];
    if (!FOLDER.includes(folder) || relatif.includes("..")) return next();

    const berkas = path.join(basisPaket, relatif);
    try {
      const data = await fsp.readFile(berkas);
      res.statusCode = 200;
      res.setHeader("Content-Type", TIPE[path.extname(berkas)] || "application/octet-stream");
      res.setHeader("Content-Length", data.length);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.end(data);
    } catch {
      next();
    }
  };

  return {
    name: "kci-aset-pdfjs",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
    async closeBundle() {
      if (!basisPaket) return;
      for (const folder of FOLDER) {
        const asal = path.join(basisPaket, folder);
        try {
          await fsp.access(asal);
        } catch {
          continue;
        }
        await salinFolder(asal, path.resolve(akar, outDir, "vendor/pdfjs", folder));
      }
    },
  };
}

export default asetPdfjs;
