/**
 * Verifikasi kepemilikan akun lewat kode di profil Chess.com + pengajuan manual.
 *
 * Dipakai sebagai JALUR CADANGAN bila OAuth Chess.com belum aktif
 * (client_id harus dimohon manual dan bisa memakan waktu berhari-hari).
 *
 * Cara kerja (jalur "kode profil" — menghasilkan tiket server):
 *   1. Pendaftar meminta kode  -> POST /api/auth/kode/minta
 *      kode diterbitkan SERVER dan diikat ke username (mis. "KCI-7F3A2B")
 *   2. Pendaftar menempelkan kode ke kolom "Location" profil Chess.com
 *   3. SERVER membaca profil (tanpa cache) dan mencocokkan kode
 *   4. Bila cocok -> rute.js menerbitkan tiket lewat terbitkanTiket()
 *
 * Kenapa kode diterbitkan server dan bukan browser? Bila browser yang membuat
 * kode, hasil "cocok" hanya berarti pengguna mengetik ulang apa yang baru ia
 * lihat — itu bukan bukti apa pun. Dengan kode dari server, yang diperiksa
 * adalah isi profil Chess.com pada saat itu, dibaca oleh server.
 *
 * Kenapa kolom Location? API publik Chess.com hanya mengekspos `name`,
 * `location`, dan `url` sebagai teks bebas yang bisa diedit pengguna —
 * TIDAK ADA field `bio`. Location paling aman diubah sementara karena
 * tidak memengaruhi tampilan nama pemain di papan.
 *
 * Jalur "pengajuan manual" (TIDAK menghasilkan tiket/verified):
 *   Pendaftar yang tidak bisa menyunting profil mengirim pengajuan. Statusnya
 *   "menunggu" dan tercatat di berkas pengajuan untuk diperiksa pengurus.
 *   Pengurus menyetujui/menolak lewat endpoint /api/pengurus/pengajuan-verifikasi.
 *   Menyetujui lewat jalur inilah — bukan dengan mengetik ulang kode — yang
 *   dapat menerbitkan tiket (cara: "pengurus").
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";
import { ambilProfil } from "./chess.js";
import { buatRepo } from "./simpanan.js";
import { catatJejak } from "./audit.js";
import { periksaUsername } from "../../src/lib/identitas.js";

const UMUR_TANTANGAN_MS = 30 * 60 * 1000;
const JEDA_COBA_MS = 5000; // jeda minimum antar pemeriksaan
const MAKS_PERCOBAAN = 40;

/** username -> { kode, kedaluwarsa, terakhirCek, percobaan } */
const tantangan = new Map();

/** Antrean pengajuan manual (pending) — bukan bukti keamanan. */
const repoPengajuan = buatRepo(konfigurasi.berkasPengajuan, []);

const jam = setInterval(() => {
  const kini = Date.now();
  for (const [k, v] of tantangan) if (kini > v.kedaluwarsa) tantangan.delete(k);
}, 60_000);
jam.unref?.();

/** Galat dengan status HTTP + kode sebab (pesan teknis tidak bocor ke klien). */
function galatHttp(status, pesan, sebab = null) {
  return Object.assign(new Error(pesan), { status, sebab });
}

/** Kode pendek yang mudah disalin, tanpa karakter membingungkan (0/O, 1/I). */
function buatKode() {
  const abjad = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bita = crypto.randomBytes(6);
  let kode = "";
  for (const b of bita) kode += abjad[b % abjad.length];
  return `KCI-${kode}`;
}

/** Username + tantangan aktif, atau galat 400 dengan sebab yang jelas. */
function usernameTantangan(usernameMentah) {
  const diperiksa = periksaUsername(usernameMentah);
  if (!diperiksa.sah) {
    throw galatHttp(
      400,
      "Username Chess.com tidak valid (3–25 karakter: huruf kecil, angka, _ atau -).",
      `username-${diperiksa.sebab}`
    );
  }
  return diperiksa.username;
}

/**
 * Terbitkan tantangan untuk sebuah username.
 * Memastikan akunnya benar-benar ada lebih dulu.
 * `paksa: true` membuang tantangan lama dan menerbitkan kode baru.
 */
export async function mintaKode(usernameMentah, { paksa = false } = {}) {
  const username = usernameTantangan(usernameMentah);

  const res = await ambilProfil(username);
  if (!res.ada) {
    throw galatHttp(404, "Akun Chess.com tidak ditemukan. Periksa ejaan username.", "akun-tidak-ditemukan");
  }

  const adaSebelumnya = tantangan.get(username);
  if (!paksa && adaSebelumnya && Date.now() < adaSebelumnya.kedaluwarsa) {
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

/** Cari kode pada kolom teks bebas profil publik. */
function kodeTerdeteksiDiProfil(profil, kode) {
  const ladang = [profil?.location, profil?.name, profil?.url]
    .filter(Boolean)
    .join(" | ")
    .toUpperCase();
  return ladang.includes(String(kode).toUpperCase());
}

/**
 * Periksa (di SERVER) apakah kode sudah terpasang di profil Chess.com.
 * Mengembalikan { cocok: true, username, playerId } bila berhasil — pemanggil
 * rute.js yang menerbitkan tiket.
 */
export async function periksaKode(usernameMentah) {
  const username = usernameTantangan(usernameMentah);
  const data = tantangan.get(username);

  if (!data) {
    throw galatHttp(
      400,
      "Belum ada kode aktif untuk akun ini. Minta kode terlebih dahulu.",
      "tantangan-tidak-ada"
    );
  }
  if (Date.now() > data.kedaluwarsa) {
    tantangan.delete(username);
    throw galatHttp(410, "Kode sudah kedaluwarsa. Minta kode baru.", "kode-kedaluwarsa");
  }

  const sejakCek = Date.now() - data.terakhirCek;
  if (sejakCek < JEDA_COBA_MS) {
    throw galatHttp(
      429,
      `Tunggu ${Math.ceil((JEDA_COBA_MS - sejakCek) / 1000)} detik sebelum memeriksa lagi.`,
      "terlalu-cepat"
    );
  }
  data.terakhirCek = Date.now();
  data.percobaan += 1;

  if (data.percobaan > MAKS_PERCOBAAN) {
    tantangan.delete(username);
    throw galatHttp(429, "Terlalu banyak percobaan. Minta kode baru.", "terlalu-banyak-percobaan");
  }

  // Profil harus dibaca segar — cache akan menyembunyikan perubahan terbaru.
  const res = await ambilProfil(username, { pakaiCache: false });
  if (!res.ada) {
    throw galatHttp(404, "Akun Chess.com tidak ditemukan.", "akun-tidak-ditemukan");
  }

  const profil = res.data;
  if (!kodeTerdeteksiDiProfil(profil, data.kode)) {
    return {
      cocok: false,
      username,
      pesan:
        "Kode belum terbaca di profil Anda. Pastikan sudah disimpan, " +
        "lalu tunggu sebentar dan periksa lagi.",
      // Yang ditampilkan hanya kolom milik peminta sendiri, bukan data profil penuh.
      terbaca: profil.location || "(kolom Location kosong)",
    };
  }

  tantangan.delete(username);
  return { cocok: true, username, playerId: profil.player_id ?? null };
}

/* ------------------------------------------------- pengajuan verifikasi manual */

/**
 * Catat pengajuan manual. Hasilnya SELALU "menunggu" — tidak ada tiket,
 * tidak ada status terverifikasi. Pemeriksaan dilakukan pengurus terpisah
 * (lihat setujuiPengajuan/tolakPengajuan).
 */
export async function ajukanVerifikasiManual({ username: usernameMentah, catatan = "" } = {}) {
  const username = usernameTantangan(usernameMentah);

  const res = await ambilProfil(username, { pakaiCache: false });
  if (!res.ada) {
    throw galatHttp(404, "Akun Chess.com tidak ditemukan. Periksa ejaan username.", "akun-tidak-ditemukan");
  }

  const data = tantangan.get(username);
  const kodeTerdeteksi = data ? kodeTerdeteksiDiProfil(res.data, data.kode) : false;
  if (data) tantangan.delete(username); // tantangan lama tidak berlaku lagi

  const catatanBersih = String(catatan || "").trim().slice(0, 500);
  const kini = new Date().toISOString();

  const entri = await repoPengajuan.ubah(async (daftar) => {
    const lama = Array.isArray(daftar)
      ? daftar.find((p) => p.username === username && p.status === "menunggu")
      : null;
    if (lama) {
      const diperbarui = {
        ...lama,
        catatan: catatanBersih || lama.catatan,
        kodeTerdeteksi,
        namaProfil: res.data.name || username,
        diperbaruiPada: kini,
        jumlahPengajuan: (lama.jumlahPengajuan || 1) + 1,
      };
      return {
        data: daftar.map((p) => (p.id === lama.id ? diperbarui : p)),
        hasil: diperbarui,
      };
    }
    const baru = {
      id: crypto.randomUUID(),
      username,
      status: "menunggu",
      catatan: catatanBersih,
      kodeTerdeteksi,
      namaProfil: res.data.name || username,
      diajukanPada: kini,
      diperbaruiPada: kini,
      jumlahPengajuan: 1,
    };
    return { data: [...(Array.isArray(daftar) ? daftar : []), baru], hasil: baru };
  });

  await catatJejak("pengajuan-verifikasi-manual", {
    username,
    kodeTerdeteksi,
    id: entri?.id,
  }).catch(() => {});

  return {
    id: entri.id,
    status: "menunggu",
    username,
    kodeTerdeteksi,
    diajukanPada: entri.diajukanPada,
  };
}

/** Daftar pengajuan untuk pengurus. */
export async function daftarPengajuan({ status = "menunggu" } = {}) {
  const daftar = await repoPengajuan.baca();
  const arr = Array.isArray(daftar) ? daftar : [];
  return status === "semua" ? arr : arr.filter((p) => p.status === status);
}

async function ubahStatusPengajuan(id, status, { pengurus = "", alasan = "" } = {}) {
  const kini = new Date().toISOString();
  return repoPengajuan.ubah(async (daftar) => {
    const arr = Array.isArray(daftar) ? daftar : [];
    const target = arr.find((p) => p.id === id);
    if (!target) throw galatHttp(404, `Pengajuan "${id}" tidak ditemukan.`);
    if (target.status !== "menunggu") {
      throw galatHttp(409, `Pengajuan ini sudah berstatus "${target.status}".`);
    }
    const diperbarui = {
      ...target,
      status,
      diperiksaOleh: String(pengurus || "").slice(0, 40) || null,
      diperiksaPada: kini,
      ...(alasan ? { alasan: String(alasan).trim().slice(0, 300) } : {}),
    };
    return {
      data: arr.map((p) => (p.id === id ? diperbarui : p)),
      hasil: diperbarui,
    };
  });
}

/** Status pengajuan untuk satu username (informasi tampilan, bukan keputusan keamanan). */
export async function statusPengajuan(username) {
  const arr = await repoPengajuan.baca();
  const cocok = (Array.isArray(arr) ? arr : []).filter((p) => p.username === username);
  if (!cocok.length) return null;
  const terakhir = cocok.reduce((a, b) =>
    String(b.diperbaruiPada || "") > String(a.diperbaruiPada || "") ? b : a
  );
  return { status: terakhir.status, diperiksaPada: terakhir.diperiksaPada || null };
}

/**
 * Pengurus menyetujui pengajuan manual. HANYA di sinilah persetujuan pengurus
 * berubah menjadi tiket, dan nama pengurus tercatat di berkas + jejak audit.
 */
export async function setujuiPengajuan(id, { pengurus = "" } = {}) {
  const entri = await ubahStatusPengajuan(id, "disetujui", { pengurus });
  await catatJejak("pengajuan-verifikasi-disetujui", {
    username: entri.username,
    id: entri.id,
    pengurus,
  }).catch(() => {});
  return entri;
}

export async function tolakPengajuan(id, { pengurus = "", alasan = "" } = {}) {
  const entri = await ubahStatusPengajuan(id, "ditolak", { pengurus, alasan });
  await catatJejak("pengajuan-verifikasi-ditolak", {
    username: entri.username,
    id: entri.id,
    pengurus,
  }).catch(() => {});
  return entri;
}

export function statistikTantangan() {
  return { tantanganAktif: tantangan.size };
}
