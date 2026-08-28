/**
 * FULL VERCEL — titik masuk backend KCI sebagai Vercel Serverless Function.
 *
 * Nama berkas catch-all `[...jalur]` membuat SEMUA permintaan di bawah
 * /api/* diteruskan ke handler ini (mis. /api/kesehatan, /api/anggota,
 * /api/pengurus/turnamen/abc/ubah). Logika rute tetap 100% milik
 * server/src/index.js — tidak ada duplikasi, tidak ada perubahan perilaku
 * antara mode "node server/src/index.js" (Render/VPS) dan mode serverless.
 *
 * Variabel lingkungan WAJIB (Vercel → Settings → Environment Variables):
 *   KCI_PEPPER          — min. 16 karakter (hashing identitas)
 *   KCI_TOKEN_ADMIN     — min. 24 karakter (endpoint pengurus)
 *   KCI_ASAL_DIIZINKAN  — domain frontend, mis. https://kci.vercel.app
 *
 * Vercel otomatis menyetel NODE_ENV=production di function, sehingga server
 * MENOLAK jalan bila dua variabel rahasia pertama kosong (perilaku fail-closed
 * yang disengaja — lihat server/src/konfigurasi.js).
 */
import { tangani } from "../server/src/index.js";

/** Function butuh waktu lebih untuk sinkronisasi roster pertama dari
 * Chess.com (roster + profil per anggota). 60 detik aman untuk Hobby. */
export const config = { maxDuration: 60 };

/**
 * Pastikan req.url berbentuk "/api/…" seperti yang diharapkan router.
 *
 * Pada catch-all path segment, Vercel menyerahkan URL asli lewat req.url,
 * tetapi beberapa konfigurasi rewrite dapat mengganti nilainya dengan jalur
 * tujuan function. Untuk aman, bila req.url TIDAK berawalan /api, bangun
 * ulang dari segmen catch-all yang disuntikkan Vercel di req.query.jalur
 * (query string asli tetap dipertahankan).
 */
function normalisasiUrl(req) {
  const url = req.url || "/";
  const tanya = url.indexOf("?");
  const jalur = tanya === -1 ? url : url.slice(0, tanya);
  const cari = tanya === -1 ? "" : url.slice(tanya);

  if (jalur === "/api" || jalur.startsWith("/api/")) return;

  const segmen = req.query?.jalur;
  const sisa = Array.isArray(segmen)
    ? segmen.map(String).join("/")
    : segmen
      ? String(segmen)
      : "";
  req.url = `/api/${sisa}${cari}`;
}

/** Signature klasik Node (req, res) — didukung penuh runtime Vercel. */
export default async function handler(req, res) {
  normalisasiUrl(req);
  await tangani(req, res);
}
