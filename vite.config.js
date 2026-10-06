import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performaHalaman } from "./plugins/performa.js";
import { pratinjauEbook } from "./plugins/ebook-preview.js";
import { asetPdfjs } from "./plugins/pdfjs-aset.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const TARGET_API = process.env.KCI_API_URL || "http://localhost:8787";

const BASE_PUBLIC = process.env.VITE_BASE_PUBLIC || "/";

function alamatSitus() {
  const nyaris =
    process.env.VITE_SITE_URL ||
    (process.env.VERCEL ? process.env.VERCEL_PROJECT_PRODUCTION_URL : "");
  const baku = (alamat) => (alamat.endsWith("/") ? alamat : `${alamat}/`);
  if (nyaris) return baku(nyaris.startsWith("http") ? nyaris : `https://${nyaris}`);
  return process.env.NODE_ENV === "production"
    ? "https://chess-club-weld.vercel.app/"
    : "http://localhost:5173/";
}

const SITE_URL = alamatSitus();

/**
 * Tanggal (YYYY-MM-DD) perubahan terakhir pada berkas yang memengaruhi isi
 * halaman — dipakai sebagai <lastmod> sitemap. Fallback ke tanggal build bila
 * git tidak tersedia (deployment Vercel tidak menyertakan .git).
 */
function tanggalPerubahanKonten() {
  const hariIni = new Date().toISOString().slice(0, 10);
  try {
    // Perhatikan: perintah ini dijalankan lewat shell. Di Windows shell-nya
    // cmd.exe yang mengekspansi `%…%`, sehingga format tanggal yang memuat
    // tanda persen (mis. `--date=format:%Y-%m-%d` + `%cd`) bisa rusak.
    // `--date=short` menghasilkan YYYY-MM-DD tanpa satu pun tanda persen.
    const keluaran = execSync(
      "git log -1 --date=short --format=%cd -- src public index.html",
      { cwd: __dirname, stdio: ["ignore", "pipe", "ignore"] },
    )
      .toString()
      .trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(keluaran) ? keluaran : hariIni;
  } catch {
    return hariIni;
  }
}

export default defineConfig({
  base: BASE_PUBLIC,
  define: {
    "import.meta.env.VITE_SITE_URL": JSON.stringify(SITE_URL),
  },
  // Pre-bundle SEMUA dependensi runtime sejak server dev start. Tanpa ini,
  // dependensi yang baru pertama kali ditemukan (mis. dari rute/komponen
  // yang dimuat lazy) membuat Vite meng-optimasi ulang dependensi DI TENGAH
  // sesi: URL `/node_modules/.vite/deps/*.js?v=…` berganti, browser sempat
  // memuat dua instance React sekaligus, dan muncul "Invalid hook call /
  // Cannot read properties of null (reading 'useState')". Dengan
  // menyertakannya sejak awal, optimasi ulang di tengah sesi tidak terjadi.
  resolve: {
    alias: {
      // Menyamakan alias Vite dengan jsconfig agar impor seperti
      // `@/components/ui/button` juga bekerja di dev dan production build.
      "@": resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  optimizeDeps: {
    /*
     * SEMUA paket yang diimpor kode klien (`src/**`) harus ada di sini.
     * Kalau ada satu saja yang belum, Vite meng-optimasi ulang dependensi saat
     * paket itu pertama kali diimpor: hash URL dependensi berganti di tengah
     * sesi, dan modul yang masih dipegang browser dari generasi lama membuat
     * React termuat DUA kali — gejalanya "Invalid hook call" lalu
     * "Cannot read properties of null (reading 'useState')" dan halaman mati
     * di ErrorBoundary. Kejadian persis itu menimpa sesi review (dialog/menu
     * Radix + lucide-react pertama kali dibuka).
     *
     * Daftar ini dihasilkan dari pemindaian impor `src/**` — spesifier ditulis
     * apa adanya, termasuk sub-path (`@base-ui/react/separator`,
     * `@tanstack/react-table/legacy`), karena setiap sub-path adalah entri
     * optimasi tersendiri. Kalau menambah paket baru di kode klien, tambahkan
     * juga di sini.
     */
    include: [
      // Inti React & router
      "react",
      "react-dom",
      "react-dom/client",
      "react-helmet-async",
      "react-router-dom",
      "react/jsx-dev-runtime",
      "react/jsx-runtime",

      // Kit UI (neobrutalism, src/components/ui + tools)
      "@base-ui/react/preview-card",
      "@base-ui/react/progress",
      "@base-ui/react/separator",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",

      // Data, papan, berkas
      "@tanstack/react-table",
      "@tanstack/react-table/legacy",
      "chess.js",
      "pdfjs-dist",
      "recharts",

      // Lain-lain
      "@vercel/speed-insights/react",
      "class-variance-authority",
      "cn",
      "embla-carousel-react",
      "input-otp",
      "lucide-react",
    ],
  },
  build: {
    modulePreload: { polyfill: false },
    cssCodeSplit: false,
    // "hidden": berkas .map TETAP dibuat di dist untuk debug/Sentry, tetapi
    // komentar `//# sourceMappingURL=` tidak disisipkan ke bundle — browser
    // (dan audit Lighthouse) berhenti meminta .map yang memang tidak kami
    // unggah ke produksi, jadi tidak ada lagi ratusan 404/noise.
    sourcemap: "hidden",
    // esbuild adalah minify bawaan Vite: turun ~30–50% vs minify:false
    // tanpa mengubah perilaku runtime. Jangan matikan di produksi hanya
    // demi keterbacaan; pakai source map untuk debug.
    minify: "esbuild",
    // Target browser modern → output lebih kecil (esbuild downlevel)
    target: "es2020",
    // Hapus console.log/debug/info di produksi → bundle lebih kecil
    // dan main thread tidak terbebani logging.
    esbuild: {
      drop: ["debugger"],
      pure: ["console.log", "console.debug", "console.info"],
    },
    rollupOptions: {
      output: {
        /**
         * Pisahkan vendor library ke chunk terpisah supaya browser
         * meng-cache React, react-router, dan lib lain secara independen
         * dari kode aplikasi yang sering berubah.
         *
         * Bentuk FUNGSI (bukan objek) dipakai dengan sengaja: bentuk objek
         * `{ "vendor-chart": ["recharts"] }` menyeret SELURUH subtree
         * dependensi recharts — termasuk `clsx` dan `es-toolkit` yang dipakai
         * nyaris semua komponen shadcn. Akibatnya `dashboard`, dialog
         * (`alert`), hingga halaman Pendaftaran ikut mengunduh recharts
         * (351 kB) hanya karena butuh `clsx`. Dengan mencocokkan jalur paket,
         * hanya paket khusus grafik yang dipindahkan; pembantu bersama tetap
         * di tempat asalnya.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          const paket = id.split("node_modules/").pop();
          if (
            /^(react|react-dom|react-router|react-router-dom|scheduler|use-sync-external-store)\//.test(
              paket
            )
          ) {
            return "vendor-react";
          }
          // Pembantu super kecil (penggabung className) dipakai nyaris semua
          // komponen. Tanpa penugasan eksplisit, Rollup menitipkannya ke
          // chunk vendor-chart sehingga `alert`/dialog ikut mengunduh
          // recharts hanya demi `clsx`.
          if (/^(clsx|tailwind-merge|cn|es-toolkit)\//.test(paket)) {
            return "vendor-alat";
          }
          if (
            /^(recharts|victory-vendor|d3-[a-z-]+|internmap|react-redux|redux|redux-thunk|immer|reselect|decimal\.js-light|eventemitter3)\//.test(
              paket
            )
          ) {
            return "vendor-chart";
          }
          return undefined;
        },
      },
    },
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
    /**
     * HANYA saat `vite dev` (apply: "serve"): longgarkan `connect-src` di CSP
     * supaya websocket HMR diizinkan.
     *
     * Meta CSP di index.html sengaja ketat dan TIDAK memuat skema ws:/wss:,
     * sehingga browser memblokir websocket Vite: "Connecting to
     * 'wss://localhost:5173/?token=…' violates … connect-src". Akibatnya HMR
     * tidak pernah menyambung, invalidasi modul tidak sampai, dan modul yang
     * sudah berubah tetap dipakai dari cache browser — gejalanya baru muncul
     * sebagai galat seperti "does not provide an export named 'AVATAR_BUKU'"
     * (KartuKomentator versi baru + komentator.js versi lama). Di lingkungan
     * pratinjau/proxy, host websocket-nya bukan localhost, jadi yang
     * ditambahkan adalah SKEMA-nya, bukan satu alamat.
     *
     * Produksi tidak disentuh sedikit pun: build tetap memakai CSP dari
     * index.html apa adanya (Vercel juga mengirimnya sebagai header).
     */
    {
      name: "kci-csp-dev-websocket",
      apply: "serve",
      transformIndexHtml(html) {
        return html.replace(/(connect-src [^;]*)/, "$1 ws: wss:");
      },
    },
    performaHalaman({ siteUrl: SITE_URL }),
    // Pratinjau e-book: /api/ebook-preview harus dilayani lokal (bukan
    // diteruskan ke backend Node), persis seperti function di Vercel.
    pratinjauEbook({ akar: __dirname }),
    // cMaps & font standar pdf.js disajikan dari /vendor/pdfjs/.
    asetPdfjs({ akar: __dirname }),
    {
      name: "inject-site-url",
      transformIndexHtml(html) {
        return html.replace(/%%SITE_URL%%/g, SITE_URL);
      },
      closeBundle() {
        const outDir = resolve(__dirname, "dist");
        // <lastmod> sitemap diisi tanggal perubahan konten terakhir, bukan
        // tanggal build: Google mengabaikan (dan bisa menghukum) sitemap yang
        // seluruh lastmod-nya berganti di setiap deploy. Tanpa .git (build
        // Vercel tidak menyertainya) → pakai tanggal hari itu.
        const tanggal = tanggalPerubahanKonten();
        for (const name of ["sitemap.xml", "robots.txt", "llms.txt"]) {
          try {
            const filePath = resolve(outDir, name);
            let content = readFileSync(filePath, "utf8");
            content = content.replace(/%%SITE_URL%%/g, SITE_URL).replace(/%%LASTMOD%%/g, tanggal);
            writeFileSync(filePath, content, "utf8");
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
