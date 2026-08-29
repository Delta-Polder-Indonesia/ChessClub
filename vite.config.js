import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performaHalaman } from "./plugins/performa.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const TARGET_API = process.env.KCI_API_URL || "http://localhost:8787";

const BASE_PUBLIC =
  process.env.VITE_BASE_PUBLIC ||
  (process.env.NODE_ENV === "production" ? "/ChessClub/" : "/");

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
    sourcemap: true,  // <-- Ditambahkan untuk mengaktifkan source map
    minify: false,    // <-- Ditambahkan agar koordinat kolom terbaca akurat
  },
  server: {
    host: true,
    allowedHosts: true,
    cors: {
      origin: true,
    },
    headers: {
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
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
