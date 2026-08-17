/**
 * Sumber anggota dari klub Chess.com.
 *
 * API Published Data Chess.com menyediakan roster publik pada
 * /club/{url-ID}/members. Responsnya mengelompokkan anggota berdasarkan
 * aktivitas klub (`weekly`, `monthly`, dan `all_time`), sehingga daftar
 * digabung dan dideduplikasi di sini sebelum dipakai layanan lain.
 *
 * Chess.com menyatakan endpoint tersebut diperbarui maksimal sekali tiap
 * 12 jam. Karena itu kita menyimpan roster selama 12 jam secara bawaan;
 * selain lebih cepat, ini juga menghormati batas API mereka.
 */
import { konfigurasi } from "./konfigurasi.js";
import { ambilAnggotaKlub, GalatChess } from "./chess.js";

const URUTAN_AKTIVITAS = ["weekly", "monthly", "all_time"];
const PRIORITAS_AKTIVITAS = new Map(
  URUTAN_AKTIVITAS.map((aktivitas, indeks) => [aktivitas, indeks])
);

let cache = null; // { anggota, kedaluwarsa }
let sedangMemuat = null;

const usernameSah = (nilai) => /^[a-z0-9_-]{3,25}$/.test(String(nilai || ""));

function tanggalDariUnix(nilai) {
  const detik = Number(nilai);
  if (!Number.isFinite(detik) || detik <= 0) return null;
  const tanggal = new Date(detik * 1000);
  return Number.isNaN(tanggal.getTime()) ? null : tanggal.toISOString();
}

/** URL publik dibuat dari slug yang tervalidasi, bukan dari respons eksternal. */
export function urlKlubChess() {
  return `https://www.chess.com/club/${encodeURIComponent(
    konfigurasi.chess.klub.slug
  )}`;
}

/**
 * Ubah bentuk respons Chess.com menjadi satu daftar tanpa username ganda.
 * Bila satu akun muncul di beberapa kelompok, kelompok aktivitas terdekat
 * (`weekly` > `monthly` > `all_time`) yang dipakai.
 */
export function normalisasiAnggotaKlub(data) {
  const perUsername = new Map();

  for (const aktivitas of URUTAN_AKTIVITAS) {
    const daftar = Array.isArray(data?.[aktivitas]) ? data[aktivitas] : [];

    for (const mentah of daftar) {
      const username = String(mentah?.username || "").trim().toLowerCase();
      if (!usernameSah(username)) continue;

      const calon = {
        username,
        daftarPada: tanggalDariUnix(mentah?.joined),
        aktivitasKlub: aktivitas,
        sumberAnggota: "chesscom-klub",
        klubChess: konfigurasi.chess.klub.slug,
        urlKlub: urlKlubChess(),
      };
      const lama = perUsername.get(username);

      if (!lama) {
        perUsername.set(username, calon);
        continue;
      }

      const prioritasCalon = PRIORITAS_AKTIVITAS.get(aktivitas);
      const prioritasLama = PRIORITAS_AKTIVITAS.get(lama.aktivitasKlub);

      // Kelompok dengan aktivitas lebih baru menang. Jika kelompoknya sama,
      // pertahankan waktu bergabung paling awal bila API mengirim duplikat.
      if (
        prioritasCalon < prioritasLama ||
        (prioritasCalon === prioritasLama &&
          calon.daftarPada &&
          (!lama.daftarPada || calon.daftarPada < lama.daftarPada))
      ) {
        perUsername.set(username, calon);
      }
    }
  }

  return [...perUsername.values()].sort((a, b) =>
    a.username.localeCompare(b.username)
  );
}

/** Kosongkan cache — terutama berguna untuk uji terisolasi. */
export function bersihkanCacheKlub() {
  cache = null;
  sedangMemuat = null;
}

/**
 * Ambil roster aktif dari klub yang dikonfigurasi.
 *
 * Jika refresh gagal tetapi roster lama masih ada di memori, roster lama
 * tetap dipakai agar halaman anggota tidak kosong hanya karena gangguan
 * singkat di Chess.com. Refresh berikutnya akan tetap mencoba lagi.
 */
export async function daftarAnggotaKlub({ paksa = false } = {}) {
  const sekarang = Date.now();
  if (!paksa && cache && sekarang < cache.kedaluwarsa) return cache.anggota;
  if (sedangMemuat) return sedangMemuat;

  sedangMemuat = (async () => {
    try {
      // Cache khusus modul ini mengikuti interval resmi roster (12 jam),
      // sehingga cache umum player/profile yang lebih pendek tidak berlaku.
      const jawaban = await ambilAnggotaKlub(konfigurasi.chess.klub.slug, {
        pakaiCache: false,
      });
      if (!jawaban.ada) {
        throw new GalatChess(
          `Klub Chess.com "${konfigurasi.chess.klub.slug}" tidak ditemukan.`,
          { status: jawaban.status }
        );
      }

      const anggota = normalisasiAnggotaKlub(jawaban.data);
      cache = {
        anggota,
        kedaluwarsa:
          Date.now() + konfigurasi.chess.klub.cacheDetik * 1000,
      };
      return anggota;
    } catch (galat) {
      if (cache?.anggota) {
        console.warn(
          `[kci] memakai cache roster klub lama: ${galat.message || galat}`
        );
        return cache.anggota;
      }
      throw galat;
    } finally {
      sedangMemuat = null;
    }
  })();

  return sedangMemuat;
}

/** Periksa keanggotaan berdasarkan roster yang sama dengan daftar publik. */
export async function anggotaAdaDiKlub(username) {
  const cari = String(username || "").trim().toLowerCase();
  if (!cari) return false;
  const anggota = await daftarAnggotaKlub();
  return anggota.some((a) => a.username === cari);
}
