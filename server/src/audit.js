/**
 * Jejak audit terstruktur untuk aksi pengurus dan peristiwa keamanan.
 *
 * Tidak pernah menulis password, token, atau nilai rahasia. Kegagalan
 * menulis jejak TIDAK boleh menggagalkan permintaan utama.
 */
import fsp from "node:fs/promises";
import { konfigurasi } from "./konfigurasi.js";
import { tambahBaris } from "./simpanan.js";

const KUNCI_SENSITIF = /password|passwd|token|secret|pepper|authorization|cookie|csrf/i;
const RETENSI_HARI = 90;

function bersihkanRincian(rincian = {}) {
  const aman = {};
  for (const [k, v] of Object.entries(rincian)) {
    if (KUNCI_SENSITIF.test(k)) continue;
    if (v == null) continue;
    if (typeof v === "string" && v.length > 400) {
      aman[k] = v.slice(0, 400);
    } else if (typeof v === "object" && !Array.isArray(v)) {
      aman[k] = bersihkanRincian(v);
    } else {
      aman[k] = v;
    }
  }
  return aman;
}

/**
 * Catat satu peristiwa audit.
 * @param {string} aksi  mis. 'admin-login', 'member-block', 'password-change'
 * @param {object} rincian  username, ip, userAgent, resourceId, status, reason, …
 */
export async function logAudit(aksi, rincian = {}) {
  try {
    const kini = new Date().toISOString();
    await tambahBaris(konfigurasi.berkasJejak, {
      timestamp: kini,
      waktu: kini,
      action: aksi,
      peristiwa: aksi,
      ...bersihkanRincian(rincian),
    });
  } catch {
    /* jejak audit tidak boleh menggagalkan permintaan utama */
  }
}

/** Alias lama — dipakai keanggotaan.js. */
export async function catatJejak(peristiwa, rincian) {
  return logAudit(peristiwa, rincian);
}

/**
 * Baca jejak audit (JSONL), terbaru di atas, saring opsional.
 * Entri lebih tua dari RETENSI_HARI tetap ada di berkas tetapi tidak
 * dikembalikan ke dashboard (kebijakan tampilan 90 hari).
 */
export async function bacaJejakAudit({
  limit = 200,
  aksi,
  username,
  sejak,
  hingga,
} = {}) {
  let teks = "";
  try {
    teks = await fsp.readFile(konfigurasi.berkasJejak, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }

  const batasUsia = Date.now() - RETENSI_HARI * 24 * 60 * 60 * 1000;
  const aksiFilter = aksi ? String(aksi).toLowerCase() : "";
  const userFilter = username ? String(username).toLowerCase() : "";
  const hasil = [];

  for (const baris of teks.split("\n")) {
    if (!baris.trim()) continue;
    let entri;
    try {
      entri = JSON.parse(baris);
    } catch {
      continue;
    }
    const waktu = Date.parse(entri.timestamp || entri.waktu || "") || 0;
    if (waktu && waktu < batasUsia) continue;
    if (sejak && waktu && waktu < Date.parse(sejak)) continue;
    if (hingga && waktu && waktu > Date.parse(hingga)) continue;
    const namaAksi = String(entri.action || entri.peristiwa || "").toLowerCase();
    if (aksiFilter && !namaAksi.includes(aksiFilter)) continue;
    const siapa = String(entri.username || entri.pengguna || "").toLowerCase();
    if (userFilter && siapa !== userFilter) continue;
    hasil.push(entri);
  }

  hasil.reverse();
  const n = Math.min(Math.max(1, Number(limit) || 200), 1000);
  return hasil.slice(0, n);
}

export { RETENSI_HARI };
