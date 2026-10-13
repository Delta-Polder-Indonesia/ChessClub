/**
 * Logika murni Turing test catur: pemain menebak mana dari dua langkah yang
 * dimainkan manusia dan mana yang dipilih mesin pada posisi yang sama.
 *
 * Sumber langkah manusia adalah PGN yang diberikan pemain (ditempel atau dari
 * berkas). Langkah mesin dihitung di UI dengan Stockfish (`EngineCatur.cari`)
 * lalu diteruskan ke `susunSoal`. Modul ini tanpa React, DOM, atau jaringan,
 * sehingga tabel dan urutannya bisa diuji di skrip Node.
 */
import { Chess } from "chess.js";

/** Lewati pembukaan: langkah ke-8 (ply) ke atas dianggap sudah di luar teori. */
export const PLY_MINIMAL = 8;
/** Jumlah soal per sesi. */
export const JUMLAH_SOAL = 10;

/**
 * Pisahkan teks berisi satu atau lebih partai PGN menjadi daftar partai.
 * Pemisah adalah tag `[Event ...]` di awal baris.
 * @param {string} teks
 * @returns {string[]}
 */
export function pisahPartai(teks) {
  return String(teks || "")
    .split(/(?=^\s*\[Event\s)/m)
    .map((g) => g.trim())
    .filter((g) => g.length > 0);
}

/**
 * Ambil posisi-posisi yang bisa dijadikan soal dari satu teks PGN.
 * Setiap posisi memuat FEN sebelum langkah, langkah manusia (UCI dan SAN),
 * dan nomor ply. Posisi yang tidak punya cukup pilihan legal dibuang.
 *
 * @param {string} teks
 * @param {{ minPly?: number }} [opsi]
 * @returns {{ fen: string, uci: string, san: string, ply: number }[]}
 */
export function ekstrakPosisi(teks, { minPly = PLY_MINIMAL } = {}) {
  const hasil = [];
  for (const partai of pisahPartai(teks)) {
    const pemuat = new Chess();
    try {
      pemuat.loadPgn(partai);
    } catch {
      continue; // partai rusak dilewati, bukan menggagalkan seluruh berkas
    }
    const riwayat = pemuat.history({ verbose: true });
    const papan = new Chess();
    riwayat.forEach((langkah, indeks) => {
      const ply = indeks + 1;
      if (ply >= minPly && papan.moves().length >= 2) {
        hasil.push({
          fen: papan.fen(),
          uci: langkah.from + langkah.to + (langkah.promotion || ""),
          san: langkah.san,
          ply,
        });
      }
      papan.move({ from: langkah.from, to: langkah.to, promotion: langkah.promotion });
    });
  }
  return hasil;
}

/** Konversi UCI ke SAN pada posisi tertentu. Null bila langkah tidak legal. */
export function sanDariUci(fen, uci) {
  if (!uci || uci.length < 4) return null;
  try {
    const papan = new Chess(fen);
    const langkah = papan.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    });
    return langkah ? langkah.san : null;
  } catch {
    return null;
  }
}

/**
 * Susun satu soal dari posisi manusia dan langkah mesin.
 * Mengembalikan null bila langkah mesin sama dengan langkah manusia (soal
 * tidak bisa dibedakan) atau langkah mesin tidak legal.
 *
 * Urutan dua pilihan diacak supaya posisi jawaban benar tidak selalu sama.
 *
 * @param {{ fen: string, uci: string, san: string, ply: number }} posisi
 * @param {string} uciMesin
 * @param {() => number} [acak]
 * @returns {{ fen: string, pilihan: { uci: string, san: string, manusia: boolean }[] } | null}
 */
export function susunSoal(posisi, uciMesin, acak = Math.random) {
  if (!uciMesin || uciMesin === posisi.uci) return null;
  const sanMesin = sanDariUci(posisi.fen, uciMesin);
  if (!sanMesin) return null;
  const pilihan = [
    { uci: posisi.uci, san: posisi.san, manusia: true },
    { uci: uciMesin, san: sanMesin, manusia: false },
  ];
  if (acak() < 0.5) pilihan.reverse();
  return { fen: posisi.fen, pilihan };
}

/**
 * Apakah tebakan benar. Indeks di luar daftar dianggap salah.
 * @param {{ pilihan: { manusia: boolean }[] }} soal
 * @param {number} indeks
 */
export function nilaiTebakan(soal, indeks) {
  return soal.pilihan[indeks]?.manusia === true;
}

/** Catatan skor per sesi. */
export function skorAwal() {
  return { jawab: 0, benar: 0 };
}

/** Tambahkan satu hasil tebakan ke skor. */
export function catatSkor(skor, benar) {
  return { jawab: skor.jawab + 1, benar: skor.benar + (benar ? 1 : 0) };
}

/** Persentase benar dibulatkan; 0 bila belum ada jawaban. */
export function persenBenar(skor) {
  return skor.jawab === 0 ? 0 : Math.round((skor.benar / skor.jawab) * 100);
}

/**
 * Pilih hingga `jumlah` posisi acak dari daftar tanpa pengulangan.
 * @param {T[]} daftar
 * @param {number} jumlah
 * @param {() => number} [acak]
 * @template T
 */
export function pilihAcak(daftar, jumlah, acak = Math.random) {
  const salinan = [...daftar];
  for (let i = salinan.length - 1; i > 0; i -= 1) {
    const j = Math.floor(acak() * (i + 1));
    [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
  }
  return salinan.slice(0, jumlah);
}
