/**
 * Gerbang unduh e-book — model perpustakaan.
 *
 * Pengunjung tidak bisa langsung mengunduh PDF. Alurnya:
 *   1. Pengurus menerbitkan kode akses atas nama panggilan peminjam
 *      (mis. "EBK-7F3K2M9Q" untuk "Budi") — kode berlaku 1 jam.
 *   2. Kode disampaikan ke peminjam lewat jalur lain (WA/grup).
 *   3. Peminjam mengisi nama asli, akun Chess.com, dan kode pada popup
 *      unduh. Bila cocok, unduhan dicatat: siapa, akunnya, dan buku apa.
 *
 * Data:
 *   data/kode-ebook.json     — daftar kode aktif/lama
 *   data/unduhan-ebook.json  — jejak unduhan (terbaru di depan)
 */

import crypto from "node:crypto";
import { buatRepo } from "./simpanan.js";
import { konfigurasi } from "./konfigurasi.js";
import { GalatAplikasi } from "./keanggotaan.js";

const repoKode = buatRepo(`${konfigurasi.dirData}/kode-ebook.json`, []);
const repoUnduhan = buatRepo(`${konfigurasi.dirData}/unduhan-ebook.json`, []);

/** Masa berlaku kode — tetap 1 jam sesuai kebijakan perpustakaan. */
const UMUR_KODE_MS = 60 * 60 * 1000;
/** Kode yang sudah lewat lebih dari 7 hari dibuang saat berkas disentuh. */
const UMUR_SIMPAN_KODE_MS = 7 * 24 * 60 * 60 * 1000;
/** Jejak unduhan disimpan maksimal sebanyak ini. */
const MAKS_UNDUHAN = 1000;

const BATAS = {
  nama: 80,
  akun: 25,
  panggilan: 30,
  catatan: 120,
  bukuId: 120,
  judul: 200,
};

const AKUN_RE = /^[a-z0-9_-]{3,25}$/;
const KODE_RE = /^EBK-[A-Z2-9]{8}$/;

/** Kode pendek tanpa karakter membingungkan (0/O, 1/I/L). */
function bikinKode() {
  const abjad = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bita = crypto.randomBytes(8);
  let isi = "";
  for (const b of bita) isi += abjad[b % abjad.length];
  return `EBK-${isi}`;
}

const idBaru = () =>
  Date.now().toString(36) + crypto.randomBytes(6).toString("hex");

function validasiPanggilan(panggilan) {
  const bersih = String(panggilan || "").trim();
  if (!bersih) {
    throw new GalatAplikasi(400, "Nama panggilan peminjam wajib diisi.");
  }
  if (bersih.length > BATAS.panggilan) {
    throw new GalatAplikasi(
      400,
      `Nama panggilan maksimal ${BATAS.panggilan} karakter.`
    );
  }
  return bersih;
}

/**
 * Terbitkan kode akses baru untuk satu peminjam.
 * Satu peminjam (panggilan) boleh punya beberapa kode yang hidup.
 */
export async function buatKodeEbook({ panggilan, catatan } = {}) {
  const siapa = validasiPanggilan(panggilan);
  const keterangan = String(catatan || "").trim();
  if (keterangan.length > BATAS.catatan) {
    throw new GalatAplikasi(400, `Catatan maksimal ${BATAS.catatan} karakter.`);
  }

  const kini = Date.now();
  const baru = {
    kode: bikinKode(),
    panggilan: siapa,
    catatan: keterangan || null,
    dibuat: new Date(kini).toISOString(),
    kedaluwarsa: new Date(kini + UMUR_KODE_MS).toISOString(),
    terakhirDipakai: null,
    jumlahUnduhan: 0,
  };

  await repoKode.ubah((semua) => ({
    data: [baru, ...basmi(semua, kini)],
    hasil: baru,
  }));
  return baru;
}

/** Daftar kode untuk dashboard pengurus (terbaru di depan). */
export async function daftarKodeEbook() {
  const kini = Date.now();
  const semua = await repoKode.baca();
  const hidup = semua.filter(
    (k) => kini - new Date(k.kedaluwarsa).getTime() <= UMUR_SIMPAN_KODE_MS
  );
  return hidup.map((k) => ({
    ...k,
    kadaluarsa: kini > new Date(k.kedaluwarsa).getTime(),
  }));
}

/** Hapus kode (mis. salah ketik atau dicabut sebelum waktunya). */
export async function hapusKodeEbook(kodeMentah) {
  const kode = rapikanKode(kodeMentah);
  let ketemu = false;
  await repoKode.ubah((semua) => {
    const sisa = semua.filter((k) => k.kode !== kode);
    ketemu = sisa.length !== semua.length;
    return { data: sisa, hasil: null };
  });
  if (!ketemu) {
    throw new GalatAplikasi(404, "Kode tidak ditemukan.");
  }
}

function rapikanKode(kodeMentah) {
  const kode = String(kodeMentah || "").trim().toUpperCase();
  if (!KODE_RE.test(kode)) {
    throw new GalatAplikasi(
      400,
      "Format kode tidak dikenal. Kode berbentuk EBK-XXXXXXXX."
    );
  }
  return kode;
}

/** Buang kode yang kedaluwarsanya lebih tua dari 7 hari. */
function basmi(daftar, kini) {
  return daftar.filter(
    (k) => kini - new Date(k.kedaluwarsa).getTime() <= UMUR_SIMPAN_KODE_MS
  );
}

/**
 * Tebus kode untuk membuka satu unduhan.
 * Mengembalikan catatan unduhan yang tersimpan (termasuk panggilan peminjam
 * dari kode, sehingga pengurus tahu siapa mengambil buku apa).
 */
export async function tebusUnduhanEbook({ kode, nama, akunChess, bukuId, judul } = {}) {
  const kodeBersih = rapikanKode(kode);

  const namaBersih = String(nama || "").trim();
  if (!namaBersih) {
    throw new GalatAplikasi(400, "Nama asli wajib diisi.");
  }
  if (namaBersih.length > BATAS.nama) {
    throw new GalatAplikasi(400, `Nama maksimal ${BATAS.nama} karakter.`);
  }

  const akun = String(akunChess || "").trim().toLowerCase();
  if (!AKUN_RE.test(akun)) {
    throw new GalatAplikasi(
      400,
      "Akun Chess.com tidak valid (3-25 karakter: huruf, angka, _ atau -)."
    );
  }

  const idBuku = String(bukuId || "").trim().slice(0, BATAS.bukuId);
  const judulBuku = String(judul || "").trim().slice(0, BATAS.judul);
  if (!idBuku) {
    throw new GalatAplikasi(400, "Buku yang diunduh tidak teridentifikasi.");
  }

  const kini = Date.now();
  let catatanUnduhan = null;

  await repoKode.ubah((semua) => {
    const indeks = semua.findIndex((k) => k.kode === kodeBersih);
    if (indeks < 0) {
      throw new GalatAplikasi(
        404,
        "Kode akses tidak dikenal. Periksa ejaan atau minta kode baru ke pengurus."
      );
    }
    const target = semua[indeks];
    if (kini > new Date(target.kedaluwarsa).getTime()) {
      throw new GalatAplikasi(
        410,
        "Kode akses sudah kedaluwarsa (berlaku 1 jam). Minta kode baru ke pengurus."
      );
    }

    const diperbarui = {
      ...target,
      terakhirDipakai: new Date(kini).toISOString(),
      jumlahUnduhan: (target.jumlahUnduhan || 0) + 1,
    };
    const sisa = [...semua];
    sisa[indeks] = diperbarui;

    catatanUnduhan = {
      id: idBaru(),
      waktu: new Date(kini).toISOString(),
      nama: namaBersih,
      akunChess: akun,
      kode: kodeBersih,
      panggilan: target.panggilan,
      bukuId: idBuku,
      judul: judulBuku || idBuku,
    };

    return { data: basmi(sisa, kini), hasil: catatanUnduhan };
  });

  await repoUnduhan.ubah((semua) => ({
    data: [catatanUnduhan, ...semua].slice(0, MAKS_UNDUHAN),
    hasil: catatanUnduhan,
  }));

  return catatanUnduhan;
}

/** Jejak unduhan untuk dashboard pengurus (terbaru di depan). */
export async function daftarUnduhanEbook() {
  return repoUnduhan.baca();
}
