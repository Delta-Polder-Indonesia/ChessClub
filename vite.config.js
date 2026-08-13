import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { kciApi } from "./plugins/kci-api.js";

export default defineConfig({
  plugins: [react(), tailwindcss(), kciApi()],
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
  },
});
