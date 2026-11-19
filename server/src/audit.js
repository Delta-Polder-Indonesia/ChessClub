/**
 * Jejak audit terstruktur untuk aksi pengurus dan peristiwa keamanan.
 *
 * Tidak pernah menulis password, token, atau nilai rahasia. Kegagalan
 * menulis jejak TIDAK boleh menggagalkan permintaan utama.
 */
import fsp from "node:fs/promises";
import { konfigurasi } from "./konfigurasi.js";
import { tambahBaris } from "./simpanan.js";

const KUNCI_SENSITIF =
  /password|passwd|token|secret|pepper|authorization|cookie|csrf|kode|code|tiket|ticket|signature|session|api[_-]?key/i;
const KODE_EBOOK = /\bEBK-[A-Z2-9]{8}\b/g;
const KUNCI_METADATA = new Set(["timestamp", "waktu", "action", "peristiwa"]);
const BATAS_AUDIT = Object.freeze({
  kedalaman: 4,
  node: 100,
  elemenArray: 25,
  propertiObjek: 40,
  panjangString: 400,
  karakter: 5000,
  payload: 8192,
});
const RETENSI_HARI = 90;

function teksAudit(nilai, batas, keadaan) {
  const teks = String(nilai).replace(KODE_EBOOK, "[kode akses disamarkan]");
  const panjang = Math.min(teks.length, batas, keadaan.sisaKarakter);
  keadaan.sisaKarakter -= panjang;
  return teks.slice(0, panjang);
}

function bersihkanNilai(nilai, keadaan, kedalaman = 0) {
  if (keadaan.jumlahNode >= BATAS_AUDIT.node) return undefined;
  keadaan.jumlahNode += 1;

  if (nilai == null) return undefined;
  if (typeof nilai === "string") {
    return teksAudit(nilai, BATAS_AUDIT.panjangString, keadaan);
  }
  if (typeof nilai === "boolean") return nilai;
  if (typeof nilai === "number") return Number.isFinite(nilai) ? nilai : undefined;
  if (typeof nilai !== "object" || kedalaman >= BATAS_AUDIT.kedalaman) {
    return undefined;
  }
  if (keadaan.objekAktif.has(nilai)) return undefined;

  if (Array.isArray(nilai)) {
    keadaan.objekAktif.add(nilai);
    const hasil = [];
    for (const item of nilai.slice(0, BATAS_AUDIT.elemenArray)) {
      const aman = bersihkanNilai(item, keadaan, kedalaman + 1);
      if (aman !== undefined) hasil.push(aman);
      if (keadaan.jumlahNode >= BATAS_AUDIT.node || keadaan.sisaKarakter <= 0) break;
    }
    keadaan.objekAktif.delete(nilai);
    return hasil;
  }

  const prototipe = Object.getPrototypeOf(nilai);
  if (prototipe !== Object.prototype && prototipe !== null) return undefined;

  keadaan.objekAktif.add(nilai);
  const hasil = {};
  for (const [kunciMentah, isi] of Object.entries(nilai).slice(0, BATAS_AUDIT.propertiObjek)) {
    const nama = String(kunciMentah);
    if (
      KUNCI_SENSITIF.test(nama) ||
      KUNCI_METADATA.has(nama) ||
      nama === "__proto__" ||
      nama === "prototype" ||
      nama === "constructor"
    ) continue;

    const kunci = teksAudit(nama, 64, keadaan);
    if (!kunci || keadaan.sisaKarakter <= 0) break;
    const aman = bersihkanNilai(isi, keadaan, kedalaman + 1);
    if (aman !== undefined) hasil[kunci] = aman;
    if (keadaan.jumlahNode >= BATAS_AUDIT.node || keadaan.sisaKarakter <= 0) break;
  }
  keadaan.objekAktif.delete(nilai);
  return hasil;
}

/** Sanitasi rekursif rincian audit, termasuk array dan objek bersarang. */
export function bersihkanRincian(rincian = {}) {
  if (!rincian || typeof rincian !== "object" || Array.isArray(rincian)) return {};
  const keadaan = {
    jumlahNode: 0,
    sisaKarakter: BATAS_AUDIT.karakter,
    objekAktif: new WeakSet(),
  };
  return bersihkanNilai(rincian, keadaan) || {};
}

/**
 * Catat satu peristiwa audit.
 * @param {string} aksi  mis. 'admin-login', 'member-block', 'password-change'
 * @param {object} rincian  username, ip, userAgent, resourceId, status, reason, …
 */
export async function logAudit(aksi, rincian = {}) {
  try {
    const kini = new Date().toISOString();
    const rincianAman = bersihkanRincian(rincian);
    const peristiwa = String(aksi || "peristiwa").slice(0, 80);
    const entri = {
      timestamp: kini,
      waktu: kini,
      action: peristiwa,
      peristiwa,
      ...rincianAman,
    };
    while (Buffer.byteLength(JSON.stringify(entri), "utf8") + 1 > BATAS_AUDIT.payload) {
      const terakhir = Object.keys(rincianAman).at(-1);
      if (!terakhir) break;
      delete rincianAman[terakhir];
      delete entri[terakhir];
    }
    await tambahBaris(konfigurasi.berkasJejak, entri);
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
  let teks;
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
