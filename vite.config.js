import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: true,
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
    proxy: {
      "/api": {
        target: TARGET_API,
        changeOrigin: true,
      },
    },
  },
});
