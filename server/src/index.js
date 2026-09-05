/**
 * Backend Komunitas Catur Indonesia.
 *
 * Jalankan:
 *   node server/src/index.js
 *
 * Variabel lingkungan penting:
 *   PORT                 port dengar (bawaan 8787)
 *   KCI_PEPPER           kata rahasia hashing identitas  (WAJIB di produksi)
 *   KCI_ADMIN_PASSWORD   password dashboard pengurus     (WAJIB di produksi)
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

// Wajib selesai sebelum server menerima permintaan. Tanpa await, password
// env dapat tertimpa hash file admin sebelum pemeriksaan produksi berjalan.
try {
  await muatAdminFileKeKonfigurasi();
} catch (e) {
  console.error(`[kci] gagal memuat kredensial admin: ${e?.message || e}`);
  process.exit(1);
}

daftarkanRute(router, { mulaiPada });

// Hardening rute tanpa mematahkan klien lama:
// - endpoint verifikasi tiket tidak lagi mengungkap isi tiket lewat URL;
// - pemindaian otomatis tidak boleh dipicu oleh GET biasa/link/prefetch.
//   Klien resmi yang lama masih GET wajib menyertakan header khusus, yang
//   menyebabkan browser meminta CORS preflight dan mencegah CSRF sederhana.
const cariRuteAsli = router.cari.bind(router);
router.cari = (metode, jalur) => {
  if (jalur.startsWith("/api/auth/tiket/")) {
    if (metode === "GET") {
      return {
        param: {},
        opsi: { batas: 60 },
        penangan: async () => ({
          status: 410,
          isi: { pesan: "Endpoint pemeriksaan tiket melalui URL sudah dinonaktifkan." },
        }),
      };
    }
  }

  if (jalur === "/api/pengurus/pindai-otomatis") {
    if (metode === "GET") {
      const ruteLegacy = cariRuteAsli("GET", jalur);
      return {
        param: ruteLegacy?.param || {},
        opsi: ruteLegacy?.opsi || {},
        penangan: async (req, ...args) => {
          const headerAksi = String(req.headers["x-kci-action"] || "");
          if (headerAksi !== "auto-scan") {
            return {
              status: 405,
              isi: {
                pesan:
                  "Metode GET dinonaktifkan. Gunakan POST atau request resmi " +
                  "dengan header X-KCI-Action: auto-scan.",
              },
            };
          }
          return ruteLegacy?.penangan
            ? ruteLegacy.penangan(req, ...args)
            : {
                status: 405,
                isi: { pesan: "Metode tidak didukung." },
              };
        },
      };
    }
    if (metode === "POST") {
      const ruteLegacy = cariRuteAsli("GET", jalur);
      if (ruteLegacy) return ruteLegacy;
    }
  }

  return cariRuteAsli(metode, jalur);
};

const tangani = buatTangani(router);

const masalah = periksaProduksi();

// Pemeriksaan ini sengaja memakai ENV mentah, bukan konfigurasi.admin.password
// yang sudah berubah menjadi bcrypt hash oleh pemuatan admins.json.
if (konfigurasi.produksi) {
  const passwordEnv = String(process.env.KCI_ADMIN_PASSWORD || "").trim();
  if (!passwordEnv || passwordEnv.length < 12 || passwordEnv === "admin123") {
    masalah.push(
      "KCI_ADMIN_PASSWORD wajib diisi dengan password produksi minimal 12 karakter dan bukan password bawaan."
    );
  }
}

if (masalah.length) {
  console.error("\n[kci] Konfigurasi produksi belum lengkap:\n");
  for (const m of [...new Set(masalah)]) console.error(`  - ${m}`);
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
  process.env.KCI_ADMIN_PASSWORD.trim() !== process.env.KCI_ADMIN_PASSWORD
) {
  console.warn(
    "[kci] KCI_ADMIN_PASSWORD mengandung spasi/baris baru di ujung — otomatis dibersihkan.\n" +
      "      Rapikan juga nilainya di dashboard (Vercel/Render) agar tidak membingungkan."
  );
}

if (konfigurasi.supabase.url) {
  console.log(
    "[kci] Penyimpanan Supabase dikonfigurasi — data akan TERSIMPAN di tabel " +
      "kci_storage (pastikan db/supabase-schema.sql sudah dijalankan)."
  );
} else {
  console.warn(
    "[kci] Supabase belum dikonfigurasi — data Vercel disimpan di /tmp yang " +
      "sementara (hilang saat cold start/redeploy). " +
      "Set SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY agar data awet."
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

  // Panaskan snapshot roster saat server hidup, supaya pengunjung pertama
  // pun langsung melihat daftar anggota tanpa menunggu Chess.com.
  import("./keanggotaan.js")
    .then(({ rosterAnggota }) => rosterAnggota())
    .then(({ anggota, diperbaruiPada }) => {
      console.log(
        `[kci] snapshot roster siap: ${anggota.length} anggota` +
          (diperbaruiPada ? ` (diperbarui ${diperbaruiPada})` : "")
      );
    })
    .catch((e) => {
      console.warn(`[kci] snapshot roster belum siap: ${e?.message || e}`);
    });
}

export { server, tangani };