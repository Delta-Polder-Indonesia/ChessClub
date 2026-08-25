/**
 * Manajemen riwayat masuk (login history) untuk pengurus.
 *
 * Mencatat siapa saja yang login ke bagian pengurus:
 * - Akun Chess.com (username)
 * - Waktu masuk (hari, tanggal, bulan, tahun, jam - ISO string)
 * - Alamat IP
 * - User-Agent / perangkat
 * - Status sesi
 *
 * Disimpan di data/riwayat-masuk.json.
 */
import { randomUUID } from "node:crypto";
import { buatRepo } from "./simpanan.js";
import { konfigurasi } from "./konfigurasi.js";
import { normalisasiUsername } from "../../src/lib/identitas.js";
import { catatJejak } from "./keanggotaan.js";

const repoRiwayatMasuk = buatRepo(konfigurasi.berkasRiwayatMasuk, []);

/** Batas maksimal riwayat yang disimpan agar memori / berkas tidak membengkak. */
const MAKS_CATATAN = 1000;

/**
 * Catat satu sesi masuk admin baru.
 *
 * @param {object} param
 * @param {string} param.username - Nama akun Chess.com yang digunakan untuk login
 * @param {string} [param.ip] - Alamat IP pengakses
 * @param {string} [param.userAgent] - User agent browser/perangkat
 * @param {string} [param.catatan] - Catatan tambahan opsional
 * @returns {Promise<object>} Entri riwayat yang baru dibuat
 */
export async function catatRiwayatMasuk({ username, ip, userAgent, catatan } = {}) {
  const uname = normalisasiUsername(username) || "pengurus";
  const waktu = new Date().toISOString();

  const entri = {
    id: randomUUID(),
    username: uname,
    waktu,
    ip: ip ? String(ip).slice(0, 80) : "127.0.0.1",
    userAgent: userAgent ? String(userAgent).slice(0, 300) : "",
    status: "berhasil",
    ...(catatan ? { catatan: String(catatan).slice(0, 200) } : {}),
  };

  await repoRiwayatMasuk.ubah((daftar) => {
    const list = Array.isArray(daftar) ? daftar : [];
    const baru = [entri, ...list].slice(0, MAKS_CATATAN);
    return { data: baru, hasil: entri };
  });

  // Jejak audit internal juga ikut mencatat aktivitas masuk
  await catatJejak("admin-login-masuk", {
    username: uname,
    ip: entri.ip,
  }).catch(() => {});

  return entri;
}

/**
 * Ambil seluruh daftar riwayat masuk (diurutkan dari yang terbaru).
 *
 * @param {object} [opsi]
 * @param {number} [opsi.limit] - Batas jumlah data yang diambil
 * @returns {Promise<Array<object>>}
 */
export async function daftarRiwayatMasuk({ limit } = {}) {
  const daftar = await repoRiwayatMasuk.baca();
  if (!Array.isArray(daftar)) return [];
  if (limit && Number.isFinite(limit) && limit > 0) {
    return daftar.slice(0, limit);
  }
  return daftar;
}

/**
 * Hapus satu catatan riwayat masuk berdasarkan ID.
 *
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function hapusRiwayatMasuk(id) {
  if (!id) return false;
  return repoRiwayatMasuk.ubah((daftar) => {
    const list = Array.isArray(daftar) ? daftar : [];
    const sisa = list.filter((item) => item.id !== id);
    return { data: sisa, hasil: sisa.length !== list.length };
  });
}

/**
 * Bersihkan seluruh riwayat masuk.
 *
 * @returns {Promise<boolean>}
 */
export async function bersihkanRiwayatMasuk() {
  await repoRiwayatMasuk.ubah(() => ({
    data: [],
    hasil: true,
  }));
  return true;
}

/**
 * Ringkasan statistik riwayat masuk untuk dashboard.
 *
 * @returns {Promise<object>}
 */
export async function ringkasanRiwayatMasuk() {
  const daftar = await repoRiwayatMasuk.baca();
  const list = Array.isArray(daftar) ? daftar : [];
  const total = list.length;
  const akunSet = new Set(list.map((r) => r.username).filter(Boolean));
  const terakhir = list[0] || null;

  return {
    total,
    penggunaUnik: akunSet.size,
    terakhir: terakhir
      ? {
          username: terakhir.username,
          waktu: terakhir.waktu,
          ip: terakhir.ip,
        }
      : null,
    terbaru: list.slice(0, 5),
  };
}
