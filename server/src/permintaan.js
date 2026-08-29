/**
 * Penanganan satu permintaan HTTP: CORS, CSRF, rate-limit, rute, galat.
 */
import { konfigurasi } from "./konfigurasi.js";
import {
  kirimJson,
  pasangCors,
  lewatBatas,
  alamatIp,
  catatPercobaanAdmin,
  statusKunciAdmin,
  identitasPengurus,
  validasiCsrfToken,
} from "./http.js";
import { GalatAplikasi, catatJejak } from "./keanggotaan.js";
import { jalurKanonik, adalahJalurPengurus } from "./jalur-api.js";

export function buatTangani(router) {
  return async function tangani(req, res) {
    const jalurAsli = (req.url || "/").split("?")[0];
    const jalur = jalurKanonik(jalurAsli);
    const metode = req.method || "GET";

    if (!pasangCors(req, res)) {
      const asal = String(req.headers.origin || "");
      return kirimJson(res, 403, {
        pesan:
          `Asal permintaan tidak diizinkan${asal ? ` (${asal})` : ""}. ` +
          "Tambahkan domain ini ke env KCI_ASAL_DIIZINKAN " +
          "(beberapa domain dipisah koma, tanpa garis miring di akhir), lalu Redeploy.",
      }, { req });
    }
    if (metode === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const rute = router.cari(metode, jalur);
    if (!rute) {
      return kirimJson(res, 404, { pesan: "Endpoint tidak ditemukan." }, { req });
    }

    // Validasi CSRF untuk request POST.
    // Login admin dikecualikan agar flow sederhana — tetap dilindungi
    // rate-limit & brute-force. Endpoint publik lain tetap wajib CSRF.
    const bebasCsrf = jalur === "/api/auth/login";

    if (metode === "POST" && !bebasCsrf) {
      const csrfToken = req.headers["x-csrf-token"];
      if (!validasiCsrfToken(csrfToken)) {
        return kirimJson(res, 403, { pesan: "Token CSRF tidak valid." }, { req });
      }
    }

    const ip = alamatIp(req);
    const maks = rute.opsi.batas ?? konfigurasi.batas.maksUmum;
    const kunci = `${ip}|${rute.opsi.batas ? jalur : "umum"}`;
    const batas = lewatBatas(kunci, maks);

    res.setHeader("X-RateLimit-Remaining", String(batas.sisa));
    if (!batas.lolos) {
      const detik = Math.ceil((batas.reset - Date.now()) / 1000);
      res.setHeader("Retry-After", String(detik));
      return kirimJson(res, 429, {
        pesan: `Terlalu banyak permintaan. Coba lagi dalam ${detik} detik.`,
      }, { req });
    }

    if (adalahJalurPengurus(jalur)) {
      const kunciAdmin = statusKunciAdmin(ip);
      if (kunciAdmin.terkunci) {
        res.setHeader("Retry-After", String(kunciAdmin.cobaLagiDetik));
        return kirimJson(res, 429, {
          pesan:
            `Terlalu banyak percobaan token pengurus yang gagal. ` +
            `Coba lagi dalam ${kunciAdmin.cobaLagiDetik} detik.`,
        }, { req });
      }
    }

    const pengguna = identitasPengurus(req);
    const konteks = { ip, pengguna };

    try {
      const hasil = await rute.penangan(req, rute.param, konteks);
      if (adalahJalurPengurus(jalur)) {
        catatPercobaanAdmin(ip, true);

        if (metode === "POST" && !jalur.endsWith("/baca")) {
          catatJejak(`admin-${metode.toLowerCase()}-${jalur}`, {
            pengguna,
            ip,
            username: pengguna,
            status: "success",
          }).catch(() => {
            /* audit tidak boleh menggagalkan permintaan */
          });
        }
      }
      if (hasil.alihkan) {
        res.writeHead(hasil.status || 302, { Location: hasil.alihkan });
        return res.end();
      }
      if (hasil.html) {
        res.writeHead(hasil.status || 200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        });
        return res.end(hasil.html);
      }
      kirimJson(res, hasil.status, hasil.isi, { req, cache: hasil.cache });
    } catch (e) {
      if ((jalur.startsWith("/api/pengurus/") || jalur === "/api/pengurus") && e?.status === 401) {
        catatPercobaanAdmin(ip, false);
        catatJejak("pengurus-akses-gagal", {
          ip,
          pengguna,
          jalur,
          status: "failed",
          reason: e.message,
        }).catch(() => {});
      }
      if (e instanceof GalatAplikasi) {
        return kirimJson(res, e.status, { pesan: e.message, ...e.tambahan }, { req });
      }
      if (e.status) {
        return kirimJson(res, e.status, { pesan: e.message }, { req });
      }
      if (e.kode === "TERLALU_BESAR") {
        return kirimJson(res, 413, { pesan: e.message }, { req });
      }
      if (e.kode === "JSON_RUSAK" || e.kode === "BUKAN_OBJEK") {
        return kirimJson(res, 400, { pesan: e.message }, { req });
      }
      if (e.name === "GalatChess") {
        return kirimJson(res, 502, {
          pesan: e.message || "Chess.com sedang tidak dapat dihubungi.",
        }, { req });
      }
      console.error(`[kci] galat tak tertangani id=${req.kciRequestId || "-"} pada ${metode} ${jalur}:`, e);
      kirimJson(res, 500, { pesan: "Kesalahan server." }, { req });
    }
  };
}
