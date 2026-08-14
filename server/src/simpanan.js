/**
 * Lapisan penyimpanan berbasis berkas JSON.
 *
 * Dua hal yang membuat ini aman dipakai server:
 *
 * 1. TULIS ATOMIK — data ditulis ke berkas sementara lalu di-rename.
 *    Rename bersifat atomik di POSIX, jadi berkas tidak pernah setengah
 *    tertulis meski server mati di tengah proses.
 *
 * 2. ANTREAN SERIAL — semua operasi tulis dijalankan berurutan. Tanpa ini,
 *    dua pendaftaran yang tiba bersamaan bisa saling menimpa (baca-ubah-tulis
 *    yang balapan), sehingga satu anggota hilang.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

/* ----------------------------------------------------------- antrean */

let rantai = Promise.resolve();

/** Jalankan `tugas` setelah semua tugas sebelumnya selesai. */
export function berurutan(tugas) {
  const hasil = rantai.then(tugas, tugas);
  // Rantai tidak boleh putus karena satu tugas gagal.
  rantai = hasil.then(
    () => undefined,
    () => undefined
  );
  return hasil;
}

/* ------------------------------------------------------------ berkas */

export function bacaJsonSync(berkas, bawaan) {
  try {
    const isi = fs.readFileSync(berkas, "utf8");
    return isi.trim() ? JSON.parse(isi) : bawaan;
  } catch (e) {
    if (e.code === "ENOENT") return bawaan;
    throw new Error(`Gagal membaca ${path.basename(berkas)}: ${e.message}`);
  }
}

export async function bacaJson(berkas, bawaan) {
  try {
    const isi = await fsp.readFile(berkas, "utf8");
    return isi.trim() ? JSON.parse(isi) : bawaan;
  } catch (e) {
    if (e.code === "ENOENT") return bawaan;
    throw new Error(`Gagal membaca ${path.basename(berkas)}: ${e.message}`);
  }
}

/** Tulis JSON secara atomik (tulis sementara -> fsync -> rename). */
export async function tulisJson(berkas, isi) {
  await fsp.mkdir(path.dirname(berkas), { recursive: true });
  const sementara = `${berkas}.${process.pid}.${Date.now()}.tmp`;
  const teks = JSON.stringify(isi, null, 2) + "\n";

  let fd;
  try {
    fd = await fsp.open(sementara, "w");
    await fd.writeFile(teks, "utf8");
    await fd.sync(); // pastikan benar-benar sampai disk
  } finally {
    await fd?.close();
  }
  await fsp.rename(sementara, berkas);
}

/** Tambahkan satu baris ke berkas JSONL (untuk jejak audit). */
export async function tambahBaris(berkas, objek) {
  await fsp.mkdir(path.dirname(berkas), { recursive: true });
  await fsp.appendFile(berkas, JSON.stringify(objek) + "\n", "utf8");
}

/* ----------------------------------------------------------- repositori */

/**
 * Repositori sederhana untuk satu berkas JSON.
 * `ubah` menjamin baca-ubah-tulis berlangsung tanpa balapan.
 */
export function buatRepo(berkas, bawaan) {
  return {
    berkas,
    baca: () => bacaJson(berkas, structuredClone(bawaan)),
    bacaSync: () => bacaJsonSync(berkas, structuredClone(bawaan)),
    tulis: (isi) => berurutan(() => tulisJson(berkas, isi)),
    /** ubah(fn): fn menerima data terkini, mengembalikan {data, hasil}. */
    ubah: (fn) =>
      berurutan(async () => {
        const data = await bacaJson(berkas, structuredClone(bawaan));
        const { data: baru, hasil } = await fn(data);
        if (baru !== undefined) await tulisJson(berkas, baru);
        return hasil;
      }),
  };
}
