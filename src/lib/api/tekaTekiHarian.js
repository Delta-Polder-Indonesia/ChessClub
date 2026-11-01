import { GalatApi, KODE_PESAN_JARINGAN, urlApi } from "./core.js";

/** Batas tunggu permintaan teka-teki harian (mdtk). */
const BATAS_WAKTU_MS = 10000;

/**
 * Ambil teka-teki harian untuk satu tanggal (`YYYY-MM-DD`).
 * Tanpa `tanggal` → soal hari ini (UTC) menurut server.
 *
 * Selalu mengembalikan objek:
 *   { tersedia: true, tanggal, judul, fen, pgn, url, gambar, terbitPada }
 *   { tersedia: false, tanggal, alasan }
 *
 * Kegagalan transport tetap dilempar sebagai `GalatApi` supaya halaman bisa
 * membedakan "soal belum ada" (200, tersedia:false) dari "gagal memuat".
 */
export async function ambilTekaTekiHarian(tanggal) {
  const kueri = tanggal ? `?tanggal=${encodeURIComponent(tanggal)}` : "";
  const kontrol = new AbortController();
  const jam = setTimeout(() => kontrol.abort(), BATAS_WAKTU_MS);

  let res;
  try {
    res = await fetch(urlApi(`/api/teka-teki-harian${kueri}`), {
      signal: kontrol.signal,
      headers: { Accept: "application/json" },
    });
  } catch (cause) {
    throw new GalatApi("", {
      kodePesan: KODE_PESAN_JARINGAN,
      status: 0,
      cause,
    });
  } finally {
    clearTimeout(jam);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatApi(data.pesan || "", {
      status: res.status,
      kode: data.kode || null,
      kodePesan: data.pesan ? null : "tekaTekiHarian",
    });
  }
  return data;
}
