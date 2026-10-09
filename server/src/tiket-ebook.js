/**
 * Tiket akses untuk mode unduh e-book.
 *
 * Tiket tidak menyimpan data baru: isinya ditandatangani HMAC dengan rahasia
 * JWT yang sama, sehingga sah di Node lokal maupun Vercel Serverless. Tiket
 * terikat pada nama berkas dan kedaluwarsa singkat; URL unduh yang disalin
 * setelah itu tidak lagi dapat dipakai.
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";

const AWALAN = "kci-ebook-v1";
const UMUR_TIKET_DETIK = 15 * 60;

function rahasia() {
  const nilai = String(konfigurasi.jwtSecret || "");
  if (!nilai) throw new Error("KCI_JWT_SECRET belum dikonfigurasi.");
  return nilai;
}

function tanda(isi) {
  return crypto.createHmac("sha256", rahasia()).update(isi).digest("base64url");
}

function namaAman(nama) {
  const nilai = String(nama || "").trim();
  // Nama ini dibandingkan dengan basename yang sudah dinormalisasi endpoint.
  if (!nilai || nilai.length > 240 || nilai.includes("/") || nilai.includes("\\")) return "";
  return nilai;
}

/** Terbitkan tiket yang hanya berlaku untuk satu nama PDF. */
export function terbitkanTiketUnduh(nama) {
  const file = namaAman(nama);
  if (!file) throw new Error("Nama e-book tidak sah.");
  const muatan = {
    v: 1,
    f: file,
    x: Math.floor(Date.now() / 1000) + UMUR_TIKET_DETIK,
    j: crypto.randomBytes(12).toString("base64url"),
  };
  const isi = Buffer.from(JSON.stringify(muatan)).toString("base64url");
  return `${AWALAN}.${isi}.${tanda(isi)}`;
}

/** Validasi tiket secara konstan-waktu dan pastikan tiket cocok dengan PDF. */
export function periksaTiketUnduh(nilai, nama) {
  if (typeof nilai !== "string" || typeof nama !== "string") return false;
  const bagian = nilai.split(".");
  if (bagian.length !== 3 || bagian[0] !== AWALAN) return false;
  const [, isi, sig] = bagian;
  let sah;
  try {
    const a = Buffer.from(String(sig), "base64url");
    const b = Buffer.from(tanda(isi), "base64url");
    sah = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
  if (!sah) return false;

  try {
    const muatan = JSON.parse(Buffer.from(isi, "base64url").toString("utf8"));
    return (
      muatan?.v === 1 &&
      muatan.f === namaAman(nama) &&
      Number.isFinite(muatan.x) &&
      Math.floor(Date.now() / 1000) <= muatan.x
    );
  } catch {
    return false;
  }
}

export { UMUR_TIKET_DETIK };
