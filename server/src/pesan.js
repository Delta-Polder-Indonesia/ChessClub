/**
 * Manajemen pesan dari form "Hubungi Kami".
 *
 * Pesan disimpan di data/pesan.json (publik).
 */

import { buatRepo } from "./simpanan.js";
import { konfigurasi } from "./konfigurasi.js";
import { GalatAplikasi } from "./keanggotaan.js";

const repoPesan = buatRepo(`${konfigurasi.dirData}/pesan.json`, []);

/** Batas panjang masukan — cukup untuk pengguna jujur, menyulitkan spam. */
const BATAS = {
  nama: 80,
  email: 120,
  telepon: 40,
  organisasi: 120,
  subjek: 150,
  pesan: 5000,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Kirim pesan baru dari form "Hubungi Kami".
 */
export async function kirimPesan(data) {
  const nama = String(data?.nama || "").trim();
  const email = String(data?.email || "").trim().toLowerCase();
  const telepon = String(data?.telepon || "").trim();
  const organisasi = String(data?.organisasi || "").trim();
  const subjek = String(data?.subjek || "").trim();
  const pesan = String(data?.pesan || "").trim();

  if (!nama || !email || !pesan) {
    throw new GalatAplikasi(400, "Nama, email, dan pesan wajib diisi.");
  }
  if (nama.length > BATAS.nama) {
    throw new GalatAplikasi(400, `Nama maksimal ${BATAS.nama} karakter.`);
  }
  if (!EMAIL_RE.test(email) || email.length > BATAS.email) {
    throw new GalatAplikasi(400, "Format email tidak valid.");
  }
  if (telepon.length > BATAS.telepon) {
    throw new GalatAplikasi(400, "Nomor telepon terlalu panjang.");
  }
  if (organisasi.length > BATAS.organisasi) {
    throw new GalatAplikasi(400, "Nama organisasi terlalu panjang.");
  }
  if (subjek.length > BATAS.subjek) {
    throw new GalatAplikasi(400, "Subjek terlalu panjang.");
  }
  if (pesan.length > BATAS.pesan) {
    throw new GalatAplikasi(
      400,
      `Pesan maksimal ${BATAS.pesan.toLocaleString("id-ID")} karakter.`
    );
  }

  const pesanBaru = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    nama,
    email,
    telepon: telepon || null,
    organisasi: organisasi || null,
    subjek: subjek || "Pesan untuk Komunitas Catur Indonesia",
    pesan,
    tanggal: new Date().toISOString(),
    dibaca: false,
  };

  await repoPesan.ubah((semua) => ({
    data: [pesanBaru, ...semua],
    hasil: pesanBaru,
  }));

  return pesanBaru;
}

/**
 * Ambil semua pesan untuk pengurus.
 */
export async function daftarPesan() {
  const pesan = await repoPesan.baca();
  return pesan || [];
}

/**
 * Tandai satu pesan sebagai sudah dibaca.
 */
export async function tandaiDibaca(id) {
  await repoPesan.ubah((pesan) => ({
    data: pesan.map((p) => (p.id === id ? { ...p, dibaca: true } : p)),
    hasil: null,
  }));
}

/**
 * Tandai SEMUA pesan belum dibaca menjadi sudah dibaca. Berguna untuk
 * tombol "Tandai semua dibaca" di lonceng notifikasi.
 */
export async function tandaiSemuaDibaca() {
  await repoPesan.ubah((pesan) => ({
    data: pesan.map((p) => (p.dibaca ? p : { ...p, dibaca: true })),
    hasil: null,
  }));
}

/**
 * Hapus pesan.
 */
export async function hapusPesan(id) {
  await repoPesan.ubah((pesan) => ({
    data: pesan.filter((p) => p.id !== id),
    hasil: null,
  }));
}

/**
 * Ambil ringkasan pesan (jumlah belum dibaca).
 */
export async function ringkasanPesan() {
  const pesan = await repoPesan.baca();
  const belumDibaca = pesan?.filter((p) => !p.dibaca).length || 0;
  return {
    total: pesan?.length || 0,
    belumDibaca,
  };
}