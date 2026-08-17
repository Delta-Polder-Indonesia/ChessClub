/**
 * Manajemen pesan dari form "Hubungi Kami".
 *
 * Pesan disimpan di data/pesan.json (publik).
 */

import { buatRepo } from "./simpanan.js";
import { konfigurasi } from "./konfigurasi.js";
import { GalatAplikasi } from "./keanggotaan.js";

const repoPesan = buatRepo(`${konfigurasi.dirData}/pesan.json`, []);

/**
 * Kirim pesan baru dari form "Hubungi Kami".
 */
export async function kirimPesan(data) {
  const { nama, email, telepon, organisasi, subjek, pesan } = data;

  if (!nama || !email || !pesan) {
    throw new GalatAplikasi(400, "Nama, email, dan pesan wajib diisi.");
  }

  const pesanBaru = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    nama: nama.trim(),
    email: email.trim(),
    telepon: telepon?.trim() || null,
    organisasi: organisasi?.trim() || null,
    subjek: subjek?.trim() || "Pesan untuk Komunitas Catur Indonesia",
    pesan: pesan.trim(),
    tanggal: new Date().toISOString(),
    dibaca: false,
  };

  await repoPesan.ubah((pesan) => {
    return [pesanBaru, ...pesan];
  });

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
 * Tandai pesan sebagai sudah dibaca.
 */
export async function tandaiDibaca(id) {
  await repoPesan.ubah((pesan) => {
    return pesan.map((p) => {
      if (p.id === id) {
        return { ...p, dibaca: true };
      }
      return p;
    });
  });
}

/**
 * Hapus pesan.
 */
export async function hapusPesan(id) {
  await repoPesan.ubah((pesan) => {
    return pesan.filter((p) => p.id !== id);
  });
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