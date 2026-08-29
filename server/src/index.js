/**
 * Backend Komunitas Catur Indonesia.
 *
 * Jalankan:
 *   node server/src/index.js
 *
 * Variabel lingkungan penting:
 *   PORT                 port dengar (bawaan 8787)
 *   KCI_PEPPER           kata rahasia hashing identitas  (WAJIB di produksi)
 *   KCI_ADMIN_PASSWORD   password dashboard pengurus     (WAJIB diganti di produksi)
 *   KCI_TOKEN_ADMIN      token legacy pengurus           (opsional)
 *   KCI_ASAL_DIIZINKAN   daftar origin dipisah koma
 *   KCI_JWT_SECRET       rahasia tanda tangan JWT        (WAJIB di produksi)
 */
import { konfigurasi, periksaProduksi } from "./konfigurasi.js";
import { buatRouter } from "./http.js";
import { muatAdminFileKeKonfigurasi } from "./admin-file.js";
import { daftarkanRute } from "./rute.js";
import { buatTangani } from "./permintaan.js";
import { buatServerHttp, mulaiServer } from "./server.js";

const mulaiPada = Date.now();
const router = buatRouter();

muatAdminFileKeKonfigurasi().catch(() => {});
daftarkanRute(router, { mulaiPada });
const tangani = buatTangani(router);

const masalah = periksaProduksi();
if (masalah.length) {
  console.error("\n[kci] Konfigurasi produksi belum lengkap:\n");
  for (const m of masalah) console.error(`  - ${m}`);
  console.error("");
  process.exit(1);
}

if (!konfigurasi.pepper) {
  console.warn(
    "[kci] KCI_PEPPER belum diatur — memakai pepper pengembangan.\n" +
      '      Untuk produksi: export KCI_PEPPER="kalimat-acak-panjang"'
  );
}

if (
  process.env.KCI_ADMIN_PASSWORD &&
  process.env.KCI_ADMIN_PASSWORD !== konfigurasi.admin.password
) {
  console.warn(
    "[kci] KCI_ADMIN_PASSWORD mengandung spasi/baris baru di ujung — otomatis dibersihkan.\n" +
      "      Rapikan juga nilainya di dashboard (Vercel/Render) agar tidak membingungkan."
  );
}

if (konfigurasi.admin?.password === "admin123") {
  console.warn(
    "[kci] KCI_ADMIN_PASSWORD masih bawaan admin123 — segera ganti di produksi!\n" +
      '      Setel: export KCI_ADMIN_PASSWORD="password-baru-yang-kuat"'
  );
}

/**
 * Di serverless TIDAK ADA port untuk didengarkan — Vercel memanggil
 * handler per permintaan. Maka di sana modul ini hanya mengekspor
 * `tangani` (lihat api/[...jalur].js) tanpa membuat server HTTP.
 */
const diVercel = Boolean(process.env.VERCEL);

let server = null;
if (!diVercel) {
  server = buatServerHttp(tangani);
  mulaiServer(server);
}

export { server, tangani };
