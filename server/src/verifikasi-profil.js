/**
 * Verifikasi kepemilikan akun lewat kode di profil Chess.com.
 *
 * Dipakai sebagai JALUR CADANGAN bila OAuth Chess.com belum aktif
 * (client_id harus dimohon manual dan bisa memakan waktu berhari-hari).
 *
 * Cara kerja:
 *   1. Pendaftar meminta kode -> sistem memberi mis. "KCI-7F3A2B"
 *   2. Pendaftar menempelkan kode itu ke kolom "Location" profil Chess.com
 *   3. Sistem membaca profil lewat API publik dan mencocokkan kode
 *   4. Bila cocok -> terbit tiket verifikasi, kode boleh dihapus lagi
 *
 * Kenapa kolom Location? API publik Chess.com hanya mengekspos `name`,
 * `location`, dan `url` sebagai teks bebas yang bisa diedit pengguna —
 * TIDAK ADA field `bio`. Location paling aman diubah sementara karena
 * tidak memengaruhi tampilan nama pemain di papan.
 */
import crypto from "node:crypto";
import { ambilProfil } from "./chess.js";
import { normalisasiUsername } from "../../src/lib/identitas.js";

const UMUR_TANTANGAN_MS = 30 * 60 * 1000;
const JEDA_COBA_MS = 5000; // jeda minimum antar pemeriksaan

/** username -> { kode, kedaluwarsa, terakhirCek, percobaan } */
const tantangan = new Map();

const jam = setInterval(() => {
  const kini = Date.now();
  for (const [k, v] of tantangan) if (kini > v.kedaluwarsa) tantangan.delete(k);
}, 60_000);
jam.unref?.();

/** Kode pendek yang mudah disalin, tanpa karakter membingungkan (0/O, 1/I). */
function buatKode() {
  const abjad = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bita = crypto.randomBytes(6);
  let kode = "";
  for (const b of bita) kode += abjad[b % abjad.length];
  return `KCI-${kode}`;
}

/**
 * Terbitkan tantangan untuk sebuah username.
 * Memastikan akunnya benar-benar ada lebih dulu.
 */
export async function mintaKode(usernameMentah) {
  const username = normalisasiUsername(usernameMentah);
  if (!username || !/^[a-z0-9_-]{3,25}$/.test(username)) {
    throw Object.assign(new Error("Username Chess.com tidak valid."), {
      status: 400,
    });
  }

  const res = await ambilProfil(username);
  if (!res.ada) {
    throw Object.assign(
      new Error("Akun Chess.com tidak ditemukan. Periksa ejaan username."),
      { status: 404 }
    );
  }

  const adaSebelumnya = tantangan.get(username);
  if (adaSebelumnya && Date.now() < adaSebelumnya.kedaluwarsa) {
    return {
      username,
      kode: adaSebelumnya.kode,
      berlakuDetik: Math.floor((adaSebelumnya.kedaluwarsa - Date.now()) / 1000),
      diulang: true,
    };
  }

  const kode = buatKode();
  tantangan.set(username, {
    kode,
    kedaluwarsa: Date.now() + UMUR_TANTANGAN_MS,
    terakhirCek: 0,
    percobaan: 0,
  });

  return {
    username,
    kode,
    berlakuDetik: Math.floor(UMUR_TANTANGAN_MS / 1000),
    diulang: false,
  };
}

/**
 * Periksa apakah kode sudah terpasang di profil Chess.com.
 * Mengembalikan { cocok: true, username } bila berhasil.
 */
export async function periksaKode(usernameMentah) {
  const username = normalisasiUsername(usernameMentah);
  const data = tantangan.get(username);

  if (!data) {
    throw Object.assign(
      new Error("Belum ada kode aktif untuk akun ini. Minta kode terlebih dahulu."),
      { status: 400 }
    );
  }
  if (Date.now() > data.kedaluwarsa) {
    tantangan.delete(username);
    throw Object.assign(new Error("Kode sudah kedaluwarsa. Minta kode baru."), {
      status: 410,
    });
  }

  const sejakCek = Date.now() - data.terakhirCek;
  if (sejakCek < JEDA_COBA_MS) {
    throw Object.assign(
      new Error(
        `Tunggu ${Math.ceil((JEDA_COBA_MS - sejakCek) / 1000)} detik sebelum memeriksa lagi.`
      ),
      { status: 429 }
    );
  }
  data.terakhirCek = Date.now();
  data.percobaan += 1;

  if (data.percobaan > 40) {
    tantangan.delete(username);
    throw Object.assign(
      new Error("Terlalu banyak percobaan. Minta kode baru."),
      { status: 429 }
    );
  }

  // Profil harus dibaca segar — cache akan menyembunyikan perubahan terbaru.
  const res = await ambilProfil(username, { pakaiCache: false });
  if (!res.ada) {
    throw Object.assign(new Error("Akun Chess.com tidak ditemukan."), {
      status: 404,
    });
  }

  const profil = res.data;
  const ladang = [profil.location, profil.name, profil.url]
    .filter(Boolean)
    .join(" | ")
    .toUpperCase();

  if (!ladang.includes(data.kode.toUpperCase())) {
    return {
      cocok: false,
      username,
      pesan:
        "Kode belum terbaca di profil Anda. Pastikan sudah disimpan, " +
        "lalu tunggu sebentar dan periksa lagi.",
      terbaca: profil.location || "(kolom Location kosong)",
    };
  }

  tantangan.delete(username);
  return { cocok: true, username, playerId: profil.player_id ?? null };
}

export function statistikTantangan() {
  return { tantanganAktif: tantangan.size };
}
