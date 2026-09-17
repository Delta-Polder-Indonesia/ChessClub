/**
 * Hasil verifikasi OAuth Chess.com yang mengalir lewat sessionStorage.
 *
 * Dipakai halaman pendaftaran DAN halaman "lengkapi verifikasi" untuk anggota
 * lama. Sengaja dijadikan satu modul: aturan penguraiannya menyangkut keamanan
 * dan tidak boleh berbeda di dua tempat.
 */

/** Kunci sessionStorage tempat halaman perantara OAuth menulis hasilnya. */
export const KUNCI_HASIL_OAUTH = "kci-hasil-verifikasi";

/**
 * Hasil OAuth mengalir lewat sessionStorage karena Chess.com mengembalikan
 * pengguna ke URL server, bukan langsung ke komponen ini. Isinya TIDAK
 * dipercaya begitu saja:
 *  - dibaca dalam try/catch, DAN dibersihkan HANYA setelah JSON-nya terurai
 *    (rusak -> bersihkan + laporkan, tanpa crash dan tanpa data hilang);
 *  - struktur dan tipe field divalidasi lebih dulu;
 *  - tetap bukan bukti keamanan apa pun: status "terverifikasi" hanya lahir
 *    bila ada `tiket` yang diterbitkan server (tiket itulah yang diverifikasi
 *    ulang oleh backend saat formulir dikirim).
 */
export function bacaHasilOauth(session) {
  let mentah = null;
  try {
    mentah = session?.getItem?.(KUNCI_HASIL_OAUTH) ?? null;
  } catch {
    return { hasil: null, rusak: false };
  }
  if (!mentah) return { hasil: null, rusak: false };

  let data = null;
  try {
    data = JSON.parse(mentah);
  } catch {
    // Hanya buang setelah diketahui isinya memang tidak dapat diurai.
    try {
      session.removeItem(KUNCI_HASIL_OAUTH);
    } catch {
      /* mode privat */
    }
    return { hasil: null, rusak: true };
  }

  try {
    session.removeItem(KUNCI_HASIL_OAUTH);
  } catch {
    /* mode privat */
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { hasil: null, rusak: true };
  }
  if (data.sukses === true) {
    const ok =
      typeof data.username === "string" &&
      data.username.length > 0 &&
      typeof data.tiket === "string" &&
      data.tiket.length > 0;
    // Tanpa tiket, "sukses" dari browser tidak berarti apa-apa.
    if (!ok) return { hasil: null, rusak: true };
    return {
      hasil: {
        sukses: true,
        username: data.username,
        tiket: data.tiket,
        cara: typeof data.cara === "string" ? data.cara : "oauth",
        berlakuDetik: Number(data.berlakuDetik) || 0,
      },
      rusak: false,
    };
  }
  if (data.sukses === false) {
    return {
      hasil: {
        sukses: false,
        // Sebab sudah dipetakan ke kode aman di server (rute.js).
        sebab: typeof data.sebab === "string" ? data.sebab : "token",
      },
      rusak: false,
    };
  }
  return { hasil: null, rusak: true };
}
