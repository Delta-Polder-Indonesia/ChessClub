/**
 * HTTP server mandiri (Render / VPS / pengembangan lokal).
 * Di Vercel, modul ini tidak dipanggil — function memakai `tangani` langsung.
 */
import http from "node:http";
import { randomUUID } from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";
import { kirimJson } from "./http.js";

export function buatServerHttp(tangani) {
  return http.createServer((req, res) => {
    const mulai = performance.now();
    const requestId = randomUUID();
    req.kciRequestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    // Log terstruktur sengaja tidak memuat query string, body, token, atau IP.
    // Aktifkan dengan KCI_LOG_PERMINTAAN=1 bila journal/log collector tersedia.
    res.on("finish", () => {
      if (!konfigurasi.logPermintaan) return;
      const jalur = (req.url || "/").split("?")[0];
      console.log(JSON.stringify({
        event: "http_request",
        requestId,
        method: req.method || "GET",
        path: jalur,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - mulai),
      }));
    });

    tangani(req, res).catch((e) => {
      console.error(`[kci] galat fatal id=${requestId}:`, e);
      if (!res.headersSent) kirimJson(res, 500, { pesan: "Kesalahan server." }, { req });
    });
  });
}

export function mulaiServer(server) {
  server.listen(konfigurasi.port, konfigurasi.host, () => {
    console.log(
      `[kci] Backend berjalan di http://${konfigurasi.host}:${konfigurasi.port}` +
        ` (${konfigurasi.lingkungan})`
    );
    console.log(`[kci] Data: ${konfigurasi.dirData}`);
    if (konfigurasi.asalDiizinkan.length) {
      console.log(`[kci] Asal diizinkan: ${konfigurasi.asalDiizinkan.join(", ")}`);
    }
  });

  for (const sinyal of ["SIGINT", "SIGTERM"]) {
    process.on(sinyal, () => {
      console.log(`\n[kci] ${sinyal} diterima, menutup server…`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 5000).unref();
    });
  }
  return server;
}
