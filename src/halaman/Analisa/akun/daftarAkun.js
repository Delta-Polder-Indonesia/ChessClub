/**
 * Daftar akun yang pernah dipakai pada halaman Analisa (memakai penyimpanan.js).
 *
 * Meniru atom `sessions` pada En Croissant: daftar akun { platform, username }
 * yang ditampilkan sebagai kartu profil di kolom kiri layar akun. Disimpan
 * sebagai JSON di localStorage (kunci `kci-analisa-daftar-akun`) sehingga daftar
 * tetap ada meski halaman dimuat ulang — persis seperti perilaku akun pada
 * halaman akun referensi.
 */
import { bacaTeks, tulis } from "../penyimpanan.js";

const KEY = "daftar-akun";

/** Baca daftar akun; kembalikan [] bila rusak/penyimpanan diblokir. */
export function bacaDaftarAkun() {
  try {
    const mentah = bacaTeks(KEY, "[]");
    const pars = JSON.parse(mentah || "[]");
    return Array.isArray(pars) ? pars : [];
  } catch {
    return [];
  }
}

/** Tulis daftar akun penuh. */
export function simpanDaftarAkun(list) {
  tulis(KEY, JSON.stringify(list));
}

/** Tambah akun bila belum ada; kembalikan daftar terbaru. */
export function tambahKeDaftar(akun) {
  const list = bacaDaftarAkun();
  const ada = list.some(
    (a) =>
      a.platform === akun.platform &&
      String(a.username || "").toLowerCase() === String(akun.username || "").toLowerCase(),
  );
  const baru = ada ? list : [...list, akun];
  simpanDaftarAkun(baru);
  return baru;
}

/** Hapus akun dari daftar; kembalikan daftar terbaru. */
export function hapusDariDaftar(platform, username) {
  const list = bacaDaftarAkun().filter(
    (a) =>
      !(
        a.platform === platform &&
        String(a.username || "").toLowerCase() === String(username || "").toLowerCase()
      ),
  );
  simpanDaftarAkun(list);
  return list;
}
