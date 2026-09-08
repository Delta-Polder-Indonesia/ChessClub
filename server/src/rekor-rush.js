/**
 * Papan peringkat "Rush Teka-teki" (mode PuzzleDash).
 *
 * Skor dicatat per anggota klub yang sudah TERDAFTAR (lihat roster anggota di
 * anggota.json) supaya hanya pecatur komunitas yang bisa masuk peringkat.
 * Penyimpanan memakai repo JSON key-value yang sama dengan modul lain
 * (berkas lokal /tmp → otomatis ke Supabase `kci_storage` saat dikonfigurasi),
 * jadi TIDAK perlu tabel/database baru.
 *
 * Batasan keamanan v1: membatasi agar hanya username dalam roster yang bisa
 * mencatat skor. Untuk mencegah pemalsuan atas nama anggota lain, langkah
 * lanjutnya adalah mewajibkan login OAuth Chess.com per pengiriman — modul ini
 * sengaja dibuat murni & mudah diuji sehingga logika peringkat aman di-refactor.
 */
import { buatRepo } from "./simpanan.js";
import { konfigurasi } from "./konfigurasi.js";
import { normalisasiUsername } from "../../src/lib/identitas.js";
import { daftarAnggota } from "./keanggotaan.js";

const DURASI_SAH = new Set([3, 5]);
const BATAS_TAMPIL = 20;

export const repoRekorRush = buatRepo(
  `${konfigurasi.dirData}/rekor-rush.json`,
  []
);

/* ------------------------------------------------------------- logika murni */

/**
 * Masukkan skor satu anggota untuk satu durasi. Hanya skor TERBAIK per
 * (username, durasi) yang disimpan; nilai lebih rendah diabaikan.
 * @returns {{daftar:Array, hasil:{baru:boolean, skor:number, username:string}}}
 */
export function perbaruiRekor(daftar, { username, skor, durasiMenit }) {
  const u = normalisasiUsername(username);
  const nilai = Math.floor(Number(skor) || 0);
  if (!u || !DURASI_SAH.has(Number(durasiMenit))) {
    throw new Error("username/durasi tidak sah.");
  }
  if (nilai < 0) throw new Error("skor tidak sah.");
  const durasi = Number(durasiMenit);
  const lama = daftar.find(
    (e) => e.username === u && Number(e.durasi) === durasi
  );
  if (lama && nilai <= Number(lama.skor)) {
    // Nilai lebih rendah / sama → tidak mengubah peringkat.
    return { daftar, hasil: { baru: false, username: u, skor: Number(lama.skor), durasi } };
  }
  const entri = { username: u, skor: nilai, durasi, dibuatPada: new Date().toISOString() };
  const baru = lama ? daftar.map((e) => (e === lama ? entri : e)) : [...daftar, entri];
  // Urutkan skor turun; ambil N teratas untuk mencegah berkas membengkak.
  const terpotong = baru
    .sort((a, b) => Number(b.skor) - Number(a.skor))
    .slice(0, 100);
  return { daftar: terpotong, hasil: { baru: !lama, username: u, skor: nilai, durasi } };
}

/** Susun peringkat untuk satu durasi, teratas → {username, skor, peringkat}. */
export function susunPeringkat(daftar, durasiMenit, batas = BATAS_TAMPIL) {
  const durasi = Number(durasiMenit);
  const terfilter = daftar
    .filter((e) => Number(e.durasi) === durasi)
    .sort((a, b) => Number(b.skor) - Number(a.skor))
    .slice(0, Math.max(1, Number(batas) || BATAS_TAMPIL));
  return terfilter.map((e, i) => ({
    peringkat: i + 1,
    username: e.username,
    skor: Number(e.skor),
  }));
}

/* -------------------------------------------------------------- sisi data */

/** Baca daftar rekor terkini (mentah, tak dipotong untuk pemakaian internal). */
export async function bacaSemuaRekor() {
  return (await repoRekorRush.baca()) || [];
}

/** Catat skor baru. Mengembalikan peringkat durasi tsb sesudahnya. */
export async function catatRekorRush({ username, skor, durasiMenit }) {
  const { daftar, hasil } = await repoRekorRush.ubah((list) =>
    perbaruiRekor(list, { username, skor, durasiMenit })
  );
  const peringkat = susunPeringkat(daftar, durasiMenit);
  return { hasil, peringkat };
}

/** Cek apakah username adalah anggota klub yang terdaftar (dari roster). */
export async function anggotaTerdafatar(username) {
  const u = normalisasiUsername(username);
  if (!u) return false;
  // Fail-closed: bila roster gagal dimuat (mis. jaringan Chess.com terganggu),
  // tolak penulisan daripada berisiko mengizinkan username tak dikenal.
  try {
    const anggota = await daftarAnggota();
    return Array.isArray(anggota)
      ? anggota.some((a) => normalisasiUsername(a?.username) === u)
      : false;
  } catch {
    return false;
  }
}
