/**
 * Lapisan penyimpanan halaman Teka-Teki — satu-satunya pintu ke `localStorage`.
 *
 * Sebelumnya kunci dan pembacaan/penulisan tersebar di dalam komponen halaman
 * (14 pemanggilan `localStorage` langsung). Akibatnya format tidak divalidasi,
 * tipe entri tidak diperiksa, dan penulisan "daftar terpecahkan" sempat
 * dilakukan di dalam updater `setState` (efek samping wajib murni).
 *
 * Kontrak modul ini:
 *   1. Semua akses penyimpanan melewati `coba()` — peramban mode privasi atau
 *      kuota penuh tidak boleh menjatuhkan halaman.
 *   2. Nilai yang dibaca selalu divalidasi sebelum dipakai; nilai rusak
 *      dianggap "belum ada" (bukan melempar, bukan menebak).
 *   3. Format yang ditulis tetap kompatibel dengan versi lama (array id untuk
 *      daftar terpecahkan, string id untuk posisi), sehingga pengguna lama
 *      tidak kehilangan progres. Pembaca menerima bentuk lama maupun baru.
 */
import { coba } from "../../../lib/utils.js";

/** Kunci penyimpanan. Diekspor untuk uji; jangan ditulis langsung di komponen. */
export const KUNCI = {
  terpecahkan: "kci-teka-teki-terpecahkan",
  posisi: "kci-teka-teki-posisi",
  koleksiPosisi: "kci-teka-teki-posisi-koleksi",
  setBidak: "kci-teka-teki-set-bidak",
  warnaPapan: "kci-teka-teki-warna-papan",
  otomatis: "kci-teka-teki-otomatis",
  ingatPosisi: "kci-teka-teki-ingat-posisi",
};

/** Koleksi sah untuk posisi tersimpan; nilai lain diperlakukan sebagai "lichess". */
export const KOLEKSI_SAH = ["lichess", "video", "legenda", "studi", "arsip"];

const angkaPositif = (nilai) => Number.isInteger(nilai) && nilai >= 1;

/* --------------------------------------------------------------- terpecahkan */

/**
 * Daftar `problemid` yang sudah terpecahkan.
 *
 * Menerima dua bentuk tersimpan: array angka (format lama & format tulis saat
 * ini) atau objek `{ ids: [...] }` (cadangan bila skema kelak berversi).
 * Entri non-angka dibuang supaya `Set.has()` tidak gagal karena string `"1"`.
 */
export function bacaTerpecahkan() {
  const mentah = coba(
    () => JSON.parse(localStorage.getItem(KUNCI.terpecahkan) || "[]"),
    "baca daftar teka-teki terpecahkan"
  );
  const daftar = Array.isArray(mentah)
    ? mentah
    : Array.isArray(mentah?.ids)
      ? mentah.ids
      : [];
  const bersih = daftar
    .map((nilai) => Number(nilai))
    .filter((nilai) => angkaPositif(nilai));
  return new Set(bersih);
}

/** Simpan himpunan terpecahkan (ditulis sebagai array angka, format lama). */
export function simpanTerpecahkan(himpunan) {
  const daftar = [...himpunan].filter((id) => angkaPositif(id)).sort((a, b) => a - b);
  return coba(
    () => localStorage.setItem(KUNCI.terpecahkan, JSON.stringify(daftar)),
    "simpan daftar teka-teki terpecahkan"
  );
}

/* -------------------------------------------------------------------- posisi */

/**
 * Posisi terakhir: `{ id, koleksi }` atau `null`.
 *
 * Koleksi disimpan terpisah (`KUNCI.koleksiPosisi`) agar pembaca lama yang
 * hanya mengenal `KUNCI.posisi` tetap bekerja. Bila kunci koleksi kosong —
 * termasuk pengguna lama — posisi dianggap milik koleksi Lichess.
 */
export function bacaPosisi() {
  const id = Number(
    coba(() => localStorage.getItem(KUNCI.posisi), "baca posisi terakhir")
  );
  if (!angkaPositif(id)) return null;
  const koleksiMentah = coba(
    () => localStorage.getItem(KUNCI.koleksiPosisi),
    "baca koleksi posisi terakhir"
  );
  const koleksi = KOLEKSI_SAH.includes(koleksiMentah) ? koleksiMentah : "lichess";
  return { id, koleksi };
}

/** Simpan posisi terakhir beserta koleksinya. */
export function simpanPosisi(id, koleksi = "lichess") {
  if (!angkaPositif(id)) return undefined;
  const hasil = coba(
    () => localStorage.setItem(KUNCI.posisi, String(id)),
    "simpan posisi terakhir"
  );
  coba(
    () =>
      localStorage.setItem(
        KUNCI.koleksiPosisi,
        KOLEKSI_SAH.includes(koleksi) ? koleksi : "lichess"
      ),
    "simpan koleksi posisi terakhir"
  );
  return hasil;
}

/** Hapus posisi tersimpan (dipakai saat "Ingat posisi" dimatikan). */
export function hapusPosisi() {
  coba(() => localStorage.removeItem(KUNCI.posisi), "hapus posisi tersimpan");
  coba(
    () => localStorage.removeItem(KUNCI.koleksiPosisi),
    "hapus koleksi posisi tersimpan"
  );
}

/* --------------------------------------------------------------- preferensi */

/** Id set bidak tersimpan, atau `bawaan` bila kosong/tidak dikenal. */
export function bacaSetBidak(daftarId, bawaan = "merida") {
  const simpan = coba(() => localStorage.getItem(KUNCI.setBidak), "baca set bidak");
  const sah = Array.isArray(daftarId) ? daftarId : [];
  return simpan && sah.includes(simpan) ? simpan : bawaan;
}

export function simpanSetBidak(id) {
  return coba(() => localStorage.setItem(KUNCI.setBidak, String(id)), "simpan set bidak");
}

/** Tema papan tersimpan (nilai harus ada di daftar pilihan). */
export function bacaWarnaPapan(pilihan, bawaan = "green") {
  const simpan = coba(
    () => localStorage.getItem(KUNCI.warnaPapan),
    "baca warna papan"
  );
  const sah = Array.isArray(pilihan) ? pilihan : [];
  return simpan && sah.includes(simpan) ? simpan : bawaan;
}

export function simpanWarnaPapan(nilai) {
  return coba(
    () => localStorage.setItem(KUNCI.warnaPapan, String(nilai)),
    "simpan warna papan"
  );
}

export function bacaOtomatis() {
  return (
    coba(() => localStorage.getItem(KUNCI.otomatis), "baca mode otomatis") === "1"
  );
}

export function simpanOtomatis(nilai) {
  return coba(
    () => localStorage.setItem(KUNCI.otomatis, nilai ? "1" : "0"),
    "simpan mode otomatis"
  );
}

/**
 * "Ingat posisi terakhir". Bawaannya AKTIF (perilaku lama): hanya nilai "0"
 * yang mematikan, sehingga pengguna lama tanpa kunci ini tetap dilanjutkan.
 */
export function bacaIngatPosisi() {
  return (
    coba(() => localStorage.getItem(KUNCI.ingatPosisi), "baca ingat posisi") !== "0"
  );
}

export function simpanIngatPosisi(nilai) {
  return coba(
    () => localStorage.setItem(KUNCI.ingatPosisi, nilai ? "1" : "0"),
    "simpan preferensi ingat posisi"
  );
}
