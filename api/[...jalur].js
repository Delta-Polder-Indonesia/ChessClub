/**
 * FULL VERCEL — titik masuk backend KCI sebagai Vercel Serverless Function.
 *
 * Nama berkas catch-all `[...jalur]` membuat SEMUA permintaan di bawah
 * /api/* diteruskan ke handler ini (mis. /api/kesehatan, /api/anggota,
 * /api/pengurus/turnamen/abc/ubah). Logika rute tetap 100% milik
 * server/src/index.js — tidak ada duplikasi, tidak ada perubahan perilaku
 * antara mode "node server/src/index.js" (Render/VPS) dan mode serverless.
 *
 * Variabel lingkungan penting (Vercel → Settings → Environment Variables):
 *   KCI_PEPPER          — min. 16 karakter (hashing identitas; wajib)
 *   KCI_ADMIN_USER      — username dashboard /pengurus (mis. admin)
 *   KCI_ADMIN_PASSWORD  — password kuat dashboard /pengurus
 *   KCI_ASAL_DIIZINKAN  — domain frontend, mis. https://kci.vercel.app
 *   KCI_TOKEN_ADMIN     — opsional; token legacy sebagai password alternatif
 *
 * Vercel otomatis menyetel NODE_ENV=production di function, sehingga server
 * MENOLAK jalan bila konfigurasi produksi penting kosong (perilaku fail-closed
 * yang disengaja — lihat server/src/konfigurasi.js).
 */
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tangani } from "../server/src/index.js";
import { konfigurasi } from "../server/src/konfigurasi.js";

/** Function butuh waktu lebih untuk sinkronisasi roster pertama dari
 * Chess.com (roster + profil per anggota). 60 detik aman untuk Hobby. */
export const config = { maxDuration: 60 };

/* ------------------------------------------------- data benih (seed) ----
 *
 * Filesystem Vercel di luar /tmp bersifat READ-ONLY, sedangkan server
 * menulis datanya ke `konfigurasi.dirData` (bawaan: /tmp/kci-data) yang
 * sementara — isinya hilang setiap instance dingin / redeploy.
 *
 * Agar data yang dikelola & di-commit ke Git TAMPIL PERMANEN, berkas
 * data/*.json yang ikut ter-bundle (lihat `includeFiles` di vercel.json)
 * disalin ke dirData saat function mulai — HANYA bila belum ada di sana,
 * jadi perubahan yang ditulis selama instance hangat tidak ditimpa.
 *
 * Alur permanen: ubah data di lokal → commit & push ke GitHub → Vercel
 * deploy ulang → data benih baru muncul. (Data yang dibuat langsung di
 * situs Vercel tetap sementara; untuk awet sepenuhnya gunakan disk
 * persisten Render atau DB eksternal.)
 */
const DIR_API = path.dirname(fileURLToPath(import.meta.url));
const DIR_BENIH = path.resolve(DIR_API, "..", "data");

let janjiBenih = null;

async function siapkanDataBenih() {
  const tujuan = konfigurasi.dirData;
  // Lokal (server membaca data/ langsung) atau sumber & tujuan sama → tak
  // ada yang perlu disalin.
  if (path.resolve(DIR_BENIH) === path.resolve(tujuan)) return;

  let berkas;
  try {
    berkas = await fsp.readdir(DIR_BENIH);
  } catch {
    // Folder benih tidak ada (mis. build tanpa data) — lewati saja.
    return;
  }

  await fsp.mkdir(tujuan, { recursive: true });
  const json = berkas.filter((n) => n.endsWith(".json"));
  for (const nama of json) {
    const sasaran = path.join(tujuan, nama);
    try {
      await fsp.access(sasaran);
      // Sudah ada di /tmp instance ini — jangan timpa tulisan runtime.
    } catch {
      await fsp.copyFile(path.join(DIR_BENIH, nama), sasaran);
    }
  }
  if (json.length) {
    console.log(`[kci] Data benih siap: ${json.length} berkas → ${tujuan}`);
  }
}

/** Pastikan penyalinan benih berjalan sekali per cold start (memoized). */
function pastikanBenih() {
  if (!janjiBenih) {
    janjiBenih = siapkanDataBenih().catch((e) => {
      // Gagal menyalin benih tidak boleh menjatuhkan function; server
      // tetap jalan dengan data kosong/bawaan.
      console.error("[kci] Gagal menyiapkan data benih:", e?.message || e);
    });
  }
  return janjiBenih;
}

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
  await pastikanBenih();
  await tangani(req, res);
}
