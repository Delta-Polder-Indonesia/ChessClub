/**
 * Pekerjaan latar belakang yang tetap hidup setelah respons terkirim.
 *
 * MASALAH NYATA DI SERVERLESS
 * ---------------------------
 * Di Vercel, instance function DIBEKUKAN begitu respons dikirim. Janji
 * (`Promise`) yang tidak ditunggu — pola "jawab snapshot lama, segarkan di
 * latar belakang" — jadi pekerjaan yatim: penyegarannya tidak pernah selesai
 * dan snapshot roster anggota bisa tertinggal berhari-hari. Gejalanya persis:
 * daftar anggota tidak lagi sama dengan klub di Chess.com dan foto profil
 * tidak pernah berubah.
 *
 * SOLUSI
 * ------
 * Runtime Node.js Vercel menyediakan konteks permintaan di global
 * `Symbol.for("@vercel/request-context")` dengan `waitUntil(janji)`. Itu
 * saluran resmi yang dipakai paket `@vercel/functions`, jadi modul ini tidak
 * menambah dependensi: bila `waitUntil` ada, janji didaftarkan ke sana dan
 * function ditahan sampai pekerjaannya selesai (tetap dibatasi maxDuration
 * function). Bila tidak ada (server Node biasa, pengembangan lokal, uji),
 * janji tetap berjalan seperti biasa karena prosesnya memang hidup terus.
 *
 * Pemakaian:
 *   teruskanSetelahRespons(segarkanRoster().catch(() => {}));
 */

const SIMBOL_KONTEKS = Symbol.for("@vercel/request-context");

/** Ambil `waitUntil` runtime, atau null bila lingkungannya tidak punya. */
function waitUntilRuntime() {
  try {
    const konteks = globalThis[SIMBOL_KONTEKS]?.get?.();
    return typeof konteks?.waitUntil === "function" ? konteks.waitUntil.bind(konteks) : null;
  } catch {
    // Konteks runtime bisa berubah bentuk antar-versi; kegagalan membaca
    // konteks tidak boleh menggagalkan permintaan pengguna.
    return null;
  }
}

/**
 * Daftarkan pekerjaan latar belakang agar tidak dipotong saat respons
 * terkirim. Mengembalikan `true` bila runtime menerimanya.
 */
export function teruskanSetelahRespons(janji) {
  const maunya = Promise.resolve(janji).catch(() => {});
  const waitUntil = waitUntilRuntime();
  if (!waitUntil) return false;
  try {
    waitUntil(maunya);
    return true;
  } catch {
    return false;
  }
}
