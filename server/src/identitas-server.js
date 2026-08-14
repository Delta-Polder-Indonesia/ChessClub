/**
 * Sisi server: hashing identitas + evaluasi daftar hitam.
 *
 * Nomor HP/DANA dan nama tidak pernah disimpan apa adanya. Yang disimpan
 * hanya SHA-256 dari nilai yang sudah dinormalisasi, digabung "pepper"
 * rahasia milik komunitas. Tanpa pepper, hash tidak bisa ditebak balik
 * lewat daftar nomor HP Indonesia (yang jumlahnya terbatas).
 *
 * Pepper dibaca dari env KCI_PEPPER. Bila belum diatur, dipakai nilai
 * pengembangan dan server memberi peringatan sekali di konsol.
 */
import crypto from "node:crypto";
import { kunciIdentitas, ALASAN_BLOKIR } from "../../src/lib/identitas.js";

const PEPPER_DEV = "kci-pengembangan-jangan-dipakai-di-produksi";
let sudahIngatkan = false;

function pepper() {
  const p = process.env.KCI_PEPPER;
  if (p && p.length >= 16) return p;
  if (!sudahIngatkan) {
    sudahIngatkan = true;
    console.warn(
      "[kci] KCI_PEPPER belum diatur — memakai pepper pengembangan.\n" +
        "      Untuk produksi: export KCI_PEPPER=\"kalimat-acak-panjang\""
    );
  }
  return PEPPER_DEV;
}

/**
 * Namespace hash per jenis kunci.
 *
 * PENTING: "hp" dan "dana" sengaja memakai namespace yang SAMA ("telp").
 * Tanpa ini, orang yang di-ban bisa lolos hanya dengan memindahkan nomor
 * lamanya dari kolom HP ke kolom DANA — hash-nya akan berbeda meski
 * nomornya identik. Dengan namespace bersama, nomor yang sama selalu
 * menghasilkan hash yang sama di kolom mana pun ia ditulis.
 */
const NAMESPACE = {
  hp: "telp",
  dana: "telp",
  namaLahir: "namaLahir",
};

/**
 * Sidik jari pepper yang sedang dipakai (8 heksadesimal).
 *
 * Disimpan bersama daftar hitam agar ketidakcocokan pepper KETAHUAN.
 * Tanpa ini, memakai pepper yang salah membuat semua pencocokan gagal
 * secara diam-diam — pemain yang diblokir akan tampak "aman".
 */
export function sidikPepper() {
  return crypto
    .createHash("sha256")
    .update(`sidik|${pepper()}`)
    .digest("hex")
    .slice(0, 8);
}

/** Hash satu nilai identitas menjadi 16 heksadesimal (cukup, ringkas). */
export function hashIdentitas(jenis, nilai) {
  const ns = NAMESPACE[jenis] || jenis;
  return crypto
    .createHash("sha256")
    .update(`${pepper()}|${ns}|${nilai}`)
    .digest("hex")
    .slice(0, 16);
}

/** Ubah kunci mentah -> daftar hash siap simpan/bandingkan. */
export function hashKunci(data) {
  const kunci = kunciIdentitas(data);
  const hasil = {};
  for (const [jenis, nilai] of Object.entries(kunci)) {
    hasil[jenis] = hashIdentitas(jenis, nilai);
  }
  return hasil;
}

/** Semua nilai hash sebagai array datar, untuk pencocokan cepat. */
export function daftarHash(hashObj) {
  return Object.values(hashObj || {}).filter(Boolean);
}

/**
 * Cari kecocokan antara identitas pendaftar dan entri daftar hitam.
 * Mengembalikan entri pertama yang cocok beserta jenis kunci yang memicu.
 */
export function cariDiDaftarHitam(hashPendaftar, daftarHitam) {
  const milik = hashKunciKeSet(hashPendaftar);
  for (const entri of daftarHitam) {
    for (const [jenis, nilai] of Object.entries(entri.identitas || {})) {
      if (milik.has(nilai)) {
        return { entri, jenis };
      }
    }
  }
  return null;
}

/**
 * Pastikan pepper saat ini cocok dengan yang dipakai saat entri dibuat.
 * Mengembalikan daftar entri yang pepper-nya berbeda (tidak bisa dicocokkan).
 */
export function periksaPepper(daftarHitam) {
  const sekarang = sidikPepper();
  return (daftarHitam || []).filter(
    (h) => h.sidikPepper && h.sidikPepper !== sekarang
  );
}

function hashKunciKeSet(hashObj) {
  return new Set(daftarHash(hashObj));
}

/** Label ramah untuk menjelaskan kunci mana yang cocok. */
export const LABEL_KUNCI = {
  hp: "nomor HP/WhatsApp",
  dana: "nomor DANA",
  namaLahir: "kombinasi nama dan tanggal lahir",
};

/**
 * Terjemahkan status akun Chess.com menjadi keputusan komunitas.
 * status: closed, closed:fair_play_violations, basic, premium, mod, staff
 */
export function evaluasiStatusChess(status) {
  const s = String(status || "").toLowerCase();
  if (s === "closed:fair_play_violations") {
    return {
      diblokir: true,
      alasan: ALASAN_BLOKIR.FAIR_PLAY,
      keterangan:
        "Akun ditutup Chess.com karena pelanggaran fair play (indikasi penggunaan engine).",
    };
  }
  if (s === "closed") {
    return {
      diblokir: false,
      ditutup: true,
      alasan: ALASAN_BLOKIR.DITUTUP,
      keterangan: "Akun Chess.com sudah ditutup.",
    };
  }
  return { diblokir: false, ditutup: false, alasan: null, keterangan: "" };
}

export { ALASAN_BLOKIR };
