import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performaHalaman } from "./plugins/performa.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

/**
 * Panggilan /api/* diteruskan ke backend (server/src/index.js).
 *
 * Browser pengguna TIDAK boleh memanggil localhost:8787 langsung — di
 * produksi browser berada di komputer lain. Karena itu frontend selalu
 * memakai URL relatif "/api/…", dan yang meneruskannya adalah:
 *   - saat pengembangan : proxy Vite di bawah ini
 *   - saat produksi     : Netlify/Vercel/Nginx (lihat PANDUAN-DEPLOY.md)
 */
const TARGET_API = process.env.KCI_API_URL || "http://localhost:8787";

/**
 * Dasar alamat aset publik.
 *
 * Saat build produksi, disetel "/ChessClub/" supaya gambar, JS, dan CSS
 * ikut memuat saat disajikan di GitHub Pages
 * (https://delta-polder-indonesia.github.io/ChessClub/). Bila nama
 * repositori berbeda, set VITE_BASE_PUBLIC, misalnya:
 *   VITE_BASE_PUBLIC=/nama-repo/ npm run build
 * Saat pengembangan tetap "/" agar URL dev tidak berubah.
 */
const BASE_PUBLIC =
  process.env.VITE_BASE_PUBLIC ||
  (process.env.NODE_ENV === "production" ? "/ChessClub/" : "/");

/**
 * Alamat situs produksi — dasar canonical, og:url, sitemap.xml, robots.txt
 * dan llms.txt.
 *
 * Nilai ini dulu HARUS disetel manual, sehingga deploy Vercel tanpa
 * VITE_SITE_URL mengirim `<link rel="canonical">` ke GitHub Pages: mesin
 * pencari menganggap salinan Vercel sebagai duplikat dan tidak mengindeksnya.
 * Kini alamat diambil otomatis dari variabel lingkungan Vercel
 * (VERCEL_PROJECT_PRODUCTION_URL untuk deploy produksi, VERCEL_URL untuk
 * pratinjau), dan VITE_SITE_URL tetap menang bila disetel eksplisit.
 */
function alamatSitus() {
  const nyaris =
    process.env.VITE_SITE_URL ||
    (process.env.VERCEL
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : "");
  const baku = (alamat) => (alamat.endsWith("/") ? alamat : `${alamat}/`);
  if (nyaris) return baku(nyaris.startsWith("http") ? nyaris : `https://${nyaris}`);
  return process.env.NODE_ENV === "production"
    ? "https://delta-polder-indonesia.github.io/ChessClub/"
    : "http://localhost:5173/";
}

const SITE_URL = alamatSitus();

export default defineConfig({
  base: BASE_PUBLIC,
  build: {
    modulePreload: { polyfill: false },
    cssCodeSplit: false,
  },
  server: {
    host: true,
    allowedHosts: true,
    // Panel pratinjau menyematkan situs di dalam <iframe sandbox="allow-scripts">.
    // Iframe seperti itu ber-origin "null", sehingga permintaan modul ESM-nya
    // tergolong lintas-origin. Tanpa header CORS, Vite 6 menolaknya dan
    // halaman jadi putih total — HTML termuat tetapi tidak satu pun skrip
    // dieksekusi. Mengizinkan semua origin aman di sini karena server dev
    // hanya hidup di sandbox pengembangan, bukan produksi.
    cors: {
      origin: true,
    },
    // Sumber daya juga perlu boleh disematkan lintas-origin.
    headers: {
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
    // Backend menulis ke data/*.json setiap kali pengurus mengubah sesuatu.
    // Tanpa pengecualian ini Vite menganggapnya perubahan sumber lalu
    // me-reload halaman penuh — dashboard kehilangan state di tengah kerja.
    watch: {
      ignored: ["**/data/**"],
    },
    proxy: {
      "/api": {
        target: TARGET_API,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    cors: { origin: true },
    headers: {
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
    proxy: {
      "/api": {
        target: TARGET_API,
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    performaHalaman(),
    {
      name: "inject-site-url",
      transformIndexHtml(html) {
        return html.replace(/%%SITE_URL%%/g, SITE_URL);
      },
      // Ganti %%SITE_URL%% di file public yang di-copy ke dist. llms.txt ikut
      // karena tautan untuk agen/crawler harus menunjuk host yang benar-benar
      // dipakai, bukan default GitHub Pages.
      closeBundle() {
        const outDir = resolve(__dirname, "dist");
        for (const name of ["sitemap.xml", "robots.txt", "llms.txt"]) {
          try {
            const filePath = resolve(outDir, name);
            let content = readFileSync(filePath, "utf8");
            if (content.includes("%%SITE_URL%%")) {
              writeFileSync(filePath, content.replace(/%%SITE_URL%%/g, SITE_URL), "utf8");
            }
          } catch {
            /* file tidak ada — lewati */
          }
        }
      },
    },
    {
      name: "alihkan-akar-preview",
      configurePreviewServer(server) {
        const dasar = BASE_PUBLIC.replace(/\/+$/, "") || "";
        if (!dasar) return;
        server.middlewares.use((req, res, next) => {
          const url = req.url || "/";
          if (url === "/" || url === "") {
            res.statusCode = 302;
            res.setHeader("Location", `${dasar}/`);
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
});
