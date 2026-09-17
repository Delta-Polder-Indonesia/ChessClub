/**
 * Logika keanggotaan: pendaftaran, verifikasi, dan daftar larangan.
 *
 * Aturan identitas (normalisasi + hash) sengaja diimpor dari modul yang
 * sama dengan yang dipakai situs, agar sisi server dan sisi klien tidak
 * pernah berbeda perilaku.
 */
import path from "node:path";
import { konfigurasi } from "./konfigurasi.js";
import { buatRepo, bacaJson, tulisJson } from "./simpanan.js";
import { catatJejak } from "./audit.js";
export { catatJejak };
import { ambilProfil, ambilStatistik, ringkasRating, hapusCache } from "./chess.js";
import { daftarAnggotaKlub, anggotaAdaDiKlub } from "./klub.js";
import { periksaTiket, tandaiTiketDipakai } from "./oauth.js";
import {
  statusPengajuan,
  persetujuanSiapDipakai,
  catatPersetujuanDiterapkan,
} from "./verifikasi-profil.js";
import {
  hashKunci,
  cariDiDaftarHitam,
  evaluasiStatusChess,
  sidikPepper,
  periksaPepper,
  LABEL_KUNCI,
} from "./identitas-server.js";
import {
  normalisasiUsername,
  normalisasiHp,
  hpValid,
  normalisasiNama,
  normalisasiKota,
  kategoriUmur,
  periksaUsername,
  periksaTanggalLahir,
} from "../../src/lib/identitas.js";

/**
 * Pesan validasi username. Kuncinya adalah `sebab` dari `periksaUsername()`
 * di modul bersama, sehingga browser (yang memakai fungsi yang sama) dan
 * server menjelaskan alasan yang identik.
 */
const PESAN_USERNAME = {
  kosong: "Username Chess.com wajib diisi.",
  spasi: "Username Chess.com tidak boleh mengandung spasi.",
  kependekan: "Username Chess.com terlalu pendek (minimal 3 karakter).",
  kepanjangan: "Username Chess.com terlalu panjang (maksimal 25 karakter).",
  karakter:
    "Format username Chess.com tidak valid (huruf kecil, angka, _ atau -).",
};

const PESAN_TANGGAL = {
  kosong: "Tanggal lahir wajib diisi.",
  format: "Tanggal lahir tidak valid (format YYYY-MM-DD).",
  "masa-depan": "Tanggal lahir tidak boleh di masa depan.",
  "terlalu-muda": "Pendaftar minimal 5 tahun.",
  "terlalu-tua": "Tanggal lahir tampak tidak masuk akal (umur di atas 100 tahun).",
};

/** Pesan tiket verifikasi — spesifik dan dapat ditindaklanjuti pendaftar. */
const PESAN_TIKET = {
  kosong: "Anda harus membuktikan kepemilikan akun Chess.com sebelum mendaftar.",
  "tidak-sah":
    "Tiket verifikasi tidak dikenali. Silakan ulangi verifikasi akun Chess.com Anda.",
  kedaluwarsa:
    "Sesi verifikasi telah kedaluwarsa. Silakan ulangi verifikasi akun Chess.com Anda.",
  "sudah-dipakai":
    "Tiket verifikasi sudah dipakai. Silakan ulangi verifikasi akun Chess.com Anda.",
  "username-beda":
    "Tiket verifikasi ini terbit untuk akun lain. Ulangi verifikasi dengan username yang sama.",
};

/** Versi pendek untuk ditampilkan di dekat isian username. */
const PESAN_TIKET_GALAT = {
  kosong: "Verifikasi akun Chess.com belum dilakukan.",
  "tidak-sah": "Verifikasi akun tidak dikenali. Ulangi verifikasi.",
  kedaluwarsa: "Sesi verifikasi kedaluwarsa. Ulangi verifikasi.",
  "sudah-dipakai": "Tiket verifikasi sudah terpakai. Ulangi verifikasi.",
  "username-beda": "Tiket verifikasi bukan untuk username ini.",
};


const repoAnggota = buatRepo(konfigurasi.berkasAnggota, []);
/**
 * Snapshot roster yang sudah diperkaya (nama, foto, rating, status).
 * Bentuknya: { diperbaruiPada, klubChess, anggota: [...] }.
 */
const repoRoster = buatRepo(konfigurasi.berkasRosterAnggota, {
  diperbaruiPada: null,
  klubChess: null,
  anggota: [],
});
const repoHitam = buatRepo(konfigurasi.berkasHitam, []);
const repoKontak = buatRepo(konfigurasi.berkasKontak, {});

/** Galat yang membawa kode HTTP dan rincian per-field. */
export class GalatAplikasi extends Error {
  constructor(status, pesan, tambahan = {}) {
    super(pesan);
    this.name = "GalatAplikasi";
    this.status = status;
    this.tambahan = tambahan;
  }
}

/* ------------------------------------------------------------ validasi */

/**
 * Validasi pendaftaran. Semua aturan datang dari modul bersama
 * `src/lib/identitas.js` (username kanonik, tanggal lahir, umur) sehingga
 * browser dan server tidak pernah bisa berbeda kesimpulan.
 *
 * PENTING: fungsi ini membaca ALLOW-LIST field. Field tampilan/keamanan yang
 * dikirim browser (`mode`, `sumber`, `kode`, `profil`, `terverifikasi`,
 * `usernameVerifikasi`) TIDAK dibaca sama sekali — yang dipercaya hanyalah
 * `tiketVerifikasi` hasil `terbitkanTiket()` di server, ditambah persetujuan
 * pengurus yang sudah tersimpan di antrean (ditulis endpoint pengurus, bukan
 * oleh browser).
 */
export function validasiPendaftaran(body) {
  const galat = {};

  const diperiksaUsername = periksaUsername(body.username);
  const username = diperiksaUsername.username;
  if (!diperiksaUsername.sah) {
    galat.username = PESAN_USERNAME[diperiksaUsername.sebab] || PESAN_USERNAME.karakter;
  }

  const namaLengkap = String(body.namaLengkap || "").trim();
  if (!namaLengkap) galat.namaLengkap = "Nama lengkap wajib diisi.";
  else if (namaLengkap.length > 80)
    galat.namaLengkap = "Nama lengkap terlalu panjang.";
  else if (normalisasiNama(namaLengkap).split(" ").filter(Boolean).length < 2)
    galat.namaLengkap = "Tulis nama lengkap (minimal dua kata).";

  const panggilan = String(body.panggilan || "").trim();
  if (!panggilan) galat.panggilan = "Nama panggilan wajib diisi.";
  else if (panggilan.length > 30)
    galat.panggilan = "Nama panggilan terlalu panjang.";

  if (!hpValid(body.hp))
    galat.hp = "Nomor HP/WhatsApp tidak valid. Contoh: 0812-3456-7890.";

  const danaIsi = String(body.dana || "").trim();
  if (danaIsi && !hpValid(danaIsi))
    galat.dana = "Nomor DANA tidak valid (gunakan nomor HP terdaftar DANA).";

  const kota = String(body.kota || "").trim();
  if (!kota) galat.kota = "Kota asal wajib diisi.";
  else if (kota.length > 60) galat.kota = "Nama kota terlalu panjang.";

  const lahir = periksaTanggalLahir(body.tanggalLahir);
  if (!lahir.sah) galat.tanggalLahir = PESAN_TANGGAL[lahir.sebab] || PESAN_TANGGAL.format;

  const email = String(body.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    galat.email = "Format email tidak valid.";

  const klub = String(body.klub || "").trim();
  if (klub.length > 60) galat.klub = "Nama klub terlalu panjang.";

  if (!body.setuju) galat.setuju = "Anda harus menyetujui kode etik komunitas.";

  return {
    galat,
    bersih: {
      username,
      namaLengkap,
      panggilan,
      hp: normalisasiHp(body.hp),
      dana: danaIsi ? normalisasiHp(danaIsi) : "",
      kota,
      tanggalLahir: lahir.tanggal,
      email,
      klub,
    },
  };
}

/* ---------------------------------------------------------- pengayaan */

/**
 * Lengkapi data anggota dengan profil & rating terkini dari Chess.com.
 * `cacheDetik` dipanjangkan saat memuat satu roster klub penuh agar satu
 * kunjungan halaman tidak membuat ratusan profil diambil berulang kali.
 */
export async function lengkapiAnggota(anggota, { cacheDetik } = {}) {
  const { username } = anggota;
  const opsiCache = cacheDetik ? { cacheDetik } : undefined;
  try {
    const [pRes, sRes] = await Promise.all([
      ambilProfil(username, opsiCache),
      ambilStatistik(username, opsiCache).catch(() => ({ ada: false, data: null })),
    ]);

    if (!pRes.ada) {
      return { ...anggota, nama: anggota.panggilan || username, hilang: true };
    }

    const profil = pRes.data;
    const rating = ringkasRating(sRes.ada ? sRes.data : {});
    const namaAsli = profil.name || profil.username || username;
    const nama = profil.title ? `${profil.title} ${namaAsli}` : namaAsli;
    const status = evaluasiStatusChess(profil.status);

    return {
      ...anggota,
      username: (profil.username || username).toLowerCase(),
      playerId: profil.player_id ?? anggota.playerId ?? null,
      nama,
      foto: profil.avatar || "",
      url: profil.url || `https://www.chess.com/member/${username}`,
      statusChess: profil.status || null,
      ...rating,
      ...(status.diblokir || status.ditutup
        ? { peringatan: status.keterangan, alasanStatus: status.alasan }
        : {}),
    };
  } catch {
    return { ...anggota, nama: anggota.panggilan || username, gagal: true };
  }
}

/**
 * Buang field internal/sensitif sebelum dikirim ke klien.
 *
 * Memakai ALLOW-LIST eksplisit, bukan destructuring satu field: field baru
 * yang ditambahkan ke catatan anggota tidak akan pernah bocor tanpa sengaja
 * (sidikPepper, kotaKunci, hash identitas, dan caraVerifikasi adalah data
 * internal — sidikPepper bahkan memberi sidik jari pepper rahasia ke publik).
 */
const FIELD_PUBLIK = new Set([
  "username",
  "playerId",
  "panggilan",
  "kota",
  "klub",
  "kategoriUmur",
  "terverifikasi",
  "statusChess",
  "daftarPada",
]);

function tanpaRahasia(anggota) {
  const aman = {};
  for (const k of FIELD_PUBLIK) {
    if (anggota[k] !== undefined) aman[k] = anggota[k];
  }
  return aman;
}

/* ------------------------------------------------------------- layanan */

/**
 * Susun roster lengkap dari sumbernya (Chess.com + data lokal).
 * Operasi ini MAHAL (ratusan permintaan profil), jadi hasilnya disimpan ke
 * snapshot oleh `segarkanRoster()` dan dipakai ulang oleh `daftarAnggota()`.
 */
export async function susunRosterAnggota() {
  /*
   * Roster klub adalah sumber keanggotaan publik. data/anggota.json tetap
   * dipakai untuk metadata pendaftaran (panggilan, kota, verifikasi, dan
   * hash identitas), lalu hanya menimpa data akun yang memang ada di klub.
   * Dengan begitu anggota yang baru bergabung di Chess.com langsung tampil
   * tanpa perlu mengisi formulir situs.
   */
  const [dasar, dariKlub, hitam] = await Promise.all([
    repoAnggota.baca(),
    daftarAnggotaKlub(),
    repoHitam.baca(),
  ]);
  const lokalPerUsername = new Map(
    dasar.map((a) => [String(a.username || "").toLowerCase(), a])
  );
  const hitamPerUsername = new Map(
    hitam.map((a) => [String(a.username || "").toLowerCase(), a])
  );

  const lengkap = await Promise.all(
    dariKlub.map(async (anggotaKlub) => {
      const lokal = lokalPerUsername.get(anggotaKlub.username);
      const gabung = {
        ...(lokal ? tanpaRahasia(lokal) : {}),
        ...anggotaKlub,
        // Menandai apakah anggota roster sudah melengkapi formulir data diri
        // di situs. Nilai ini aman dipublikasikan; data pribadinya tetap rahasia.
        dataSitusLengkap: Boolean(lokal),
        // Sumber klub selalu berwenang untuk username dan tanggal bergabung.
        username: anggotaKlub.username,
        daftarPada: anggotaKlub.daftarPada,
      };
      const hasil = await lengkapiAnggota(gabung, {
        cacheDetik: konfigurasi.chess.klub.profilCacheDetik,
      });
      const larangan = hitamPerUsername.get(anggotaKlub.username);

      // Daftar larangan komunitas dapat berisi blokir manual, yang tidak
      // selalu tercermin sebagai `closed:*` pada profil Chess.com.
      if (!larangan) return hasil;
      return {
        ...hasil,
        diblokirKomunitas: true,
        sumberLarangan: larangan.sumber || (hasil.alasanStatus === "fair_play_violations" ? "otomatis" : "pengurus"),
        alasanStatus: larangan.alasan || hasil.alasanStatus || null,
        peringatan:
          larangan.keterangan ||
          hasil.peringatan ||
          "Akun ini tidak dapat mengikuti kegiatan komunitas.",
      };
    })
  );

  lengkap.sort((a, b) => (b.elo || 0) - (a.elo || 0));
  // Data pribadi (nama asli, HP/WA, DANA, email, tanggal lahir) TIDAK ikut
  // ke respons publik — sesuai janji privasi pada formulir pendaftaran.
  // Kontak hanya disajikan lewat endpoint pengurus /api/pengurus/kontak/:username.
  return lengkap;
}

/* ------------------------------------------------ snapshot roster anggota */

/*
 * PRINSIP TAMPIL-SEKETIKA
 * -----------------------
 * Menyusun roster berarti memanggil Chess.com ratusan kali, sehingga
 * pengunjung pertama harus menunggu. Karena itu hasilnya disimpan ke
 * penyimpanan tetap (Supabase bila aktif, atau data/roster-anggota.json).
 *
 * GET /api/anggota kemudian bekerja seperti "stale-while-revalidate":
 *   1. Snapshot ada  → langsung dikirim (halaman terisi seketika).
 *   2. Bila snapshot sudah tua → penyegaran dijalankan di LATAR BELAKANG,
 *      jadi anggota baru/keluar tetap terdeteksi tanpa membuat pengunjung
 *      menunggu. Kunjungan berikutnya melihat data terbaru.
 *   3. Snapshot belum pernah ada (deploy pertama) → baru menunggu susunan
 *      penuh, lalu hasilnya disimpan untuk semua pengunjung berikutnya.
 */

/** Cache memori agar tidak membaca berkas/Supabase tiap permintaan. */
let rosterMemori = null; // { diperbaruiPada, anggota }
let penyegaranBerjalan = null;
/** Snapshot diketahui tertinggal dari data terbaru (mis. baru ada pendaftaran). */
let wajibSegar = false;

function umurDetik(waktuIso) {
  const t = waktuIso ? new Date(waktuIso).getTime() : 0;
  if (!Number.isFinite(t) || t <= 0) return Infinity;
  return (Date.now() - t) / 1000;
}

async function bacaSnapshotRoster() {
  if (rosterMemori) return rosterMemori;
  try {
    const isi = await repoRoster.baca();
    const anggota = Array.isArray(isi?.anggota) ? isi.anggota : [];
    rosterMemori = {
      diperbaruiPada: isi?.diperbaruiPada || null,
      klubChess: isi?.klubChess || null,
      anggota,
    };
  } catch (e) {
    console.warn(`[kci] gagal membaca snapshot roster: ${e?.message || e}`);
    rosterMemori = { diperbaruiPada: null, klubChess: null, anggota: [] };
  }
  // Snapshot dari klub lain (slug diganti) tidak boleh dipakai.
  if (
    rosterMemori.klubChess &&
    rosterMemori.klubChess !== konfigurasi.chess.klub.slug
  ) {
    rosterMemori = { diperbaruiPada: null, klubChess: null, anggota: [] };
  }
  return rosterMemori;
}

/**
 * Susun ulang roster dari Chess.com dan simpan ke snapshot.
 * Panggilan serentak digabung menjadi satu penyegaran.
 */
export function segarkanRoster() {
  if (penyegaranBerjalan) return penyegaranBerjalan;

  const tandaiMulai = wajibSegar;
  penyegaranBerjalan = (async () => {
    const anggota = await susunRosterAnggota();
    if (tandaiMulai) wajibSegar = false;
    // Jangan pernah menimpa snapshot berisi dengan hasil kosong: itu hampir
    // selalu berarti Chess.com sedang bermasalah, bukan klub jadi kosong.
    const lama = await bacaSnapshotRoster();
    if (!anggota.length && lama.anggota.length) {
      console.warn("[kci] roster kosong dari Chess.com — snapshot lama dipertahankan.");
      return lama.anggota;
    }

    const isi = {
      diperbaruiPada: new Date().toISOString(),
      klubChess: konfigurasi.chess.klub.slug,
      anggota,
    };
    rosterMemori = isi;
    try {
      await repoRoster.tulis(isi);
    } catch (e) {
      // Penyimpanan gagal (mis. /tmp penuh) tidak boleh menggagalkan situs;
      // data tetap tersedia di memori proses ini.
      console.warn(`[kci] gagal menyimpan snapshot roster: ${e?.message || e}`);
    }
    return anggota;
  })().finally(() => {
    penyegaranBerjalan = null;
  });

  return penyegaranBerjalan;
}

/**
 * Daftar anggota untuk halaman publik.
 *
 * @param {{paksa?: boolean}} opsi - `paksa: true` menunggu penyegaran penuh
 *        (dipakai tombol muat ulang pengurus), bukan menjawab dari snapshot.
 * @returns {Promise<{anggota: Array, diperbaruiPada: string|null, segar: boolean}>}
 */
export async function rosterAnggota({ paksa = false } = {}) {
  if (paksa) {
    const anggota = await segarkanRoster();
    return {
      anggota,
      diperbaruiPada: rosterMemori?.diperbaruiPada || null,
      segar: true,
    };
  }

  if (wajibSegar) {
    // Ada perubahan data yang belum masuk snapshot — tunggu penyegaran
    // (biasanya sudah berjalan sejak perubahan terjadi, jadi tinggal sisanya).
    const anggota = await segarkanRoster();
    return {
      anggota,
      diperbaruiPada: rosterMemori?.diperbaruiPada || null,
      segar: true,
    };
  }

  const snapshot = await bacaSnapshotRoster();
  const umur = umurDetik(snapshot.diperbaruiPada);

  if (!snapshot.anggota.length) {
    // Belum ada apa pun untuk ditampilkan — kali ini memang harus menunggu.
    const anggota = await segarkanRoster();
    return {
      anggota,
      diperbaruiPada: rosterMemori?.diperbaruiPada || null,
      segar: true,
    };
  }

  const segar = umur <= konfigurasi.chess.klub.snapshotSegarDetik;
  if (!segar) {
    // Tampilkan yang lama SEKARANG, perbarui di latar belakang.
    segarkanRoster().catch((e) => {
      console.warn(`[kci] penyegaran roster gagal: ${e?.message || e}`);
    });
  }

  return { anggota: snapshot.anggota, diperbaruiPada: snapshot.diperbaruiPada, segar };
}

/** Daftar anggota (bentuk lama: array saja). */
export async function daftarAnggota(opsi) {
  const { anggota } = await rosterAnggota(opsi);
  return anggota;
}

/**
 * Tandai snapshot usang setelah data anggota berubah (pendaftaran, blokir,
 * pindai). Penyegaran langsung dimulai di latar belakang; permintaan
 * berikutnya menunggu penyegaran itu selesai agar perubahan yang baru saja
 * dilakukan pengurus/pendaftar tidak tampak "hilang".
 */
export function usangkanRoster() {
  wajibSegar = true;
  segarkanRoster().catch((e) => {
    console.warn(`[kci] penyegaran roster gagal: ${e?.message || e}`);
  });
}

export async function daftarHitamPublik() {
  const hitam = await repoHitam.baca();
  return hitam.map((h) => ({
    username: h.username,
    alasan: h.alasan,
    keterangan: h.keterangan,
    sumber: h.sumber,
    diblokirPada: h.diblokirPada,
  }));
}

/**
 * Pendaftaran anggota baru — inti dari sistem anti akun-kecil.
 * Seluruh baca-ubah-tulis dijalankan dalam satu antrean sehingga dua
 * pendaftaran bersamaan tidak bisa saling menyalip.
 */
export async function daftarkan(body, konteks = {}) {
  const { galat, bersih } = validasiPendaftaran(body);
  if (Object.keys(galat).length) {
    throw new GalatAplikasi(400, "Periksa kembali isian formulir.", { galat });
  }

  /* --------------------------------------------------- bukti kepemilikan akun
   *
   * Satu-satunya bukti yang dipercaya adalah bukti yang DITERBITKAN SERVER:
   *   - "oauth"       -> login Chess.com, id_token diverifikasi ketat;
   *   - "kode-profil" -> server membaca profil publik dan menemukan kodenya;
   *   - "pengurus"    -> persetujuan pengurus yang tersimpan di antrean
   *                      pengajuan (hanya bisa ditulis endpoint pengurus yang
   *                      sudah melewati pastikanAdmin).
   *
   * Field lain dari browser — `mode`, `sumber`, `kode`, `profil`,
   * `terverifikasi`, `usernameVerifikasi` — TIDAK pernah dibaca sebagai
   * keputusan keamanan. Mengetik ulang kode yang ditampilkan di layar bukan
   * bukti penguasaan akun, karena itu jalur manual tidak menghasilkan tiket
   * sama sekali: status berubah hanya bila pengurus memindahkan pengajuan ke
   * "disetujui".
   *
   * Keputusan mode:
   *   off      -> tidak ada penilaian tiket sama sekali;
   *   opsional -> boleh mendaftar tanpa tiket (tercatat belum terverifikasi),
   *               TETAPI tiket yang dikirim dan ternyata tidak sah tetap
   *               ditolak, supaya pendaftar tidak dikira sudah terverifikasi;
   *   wajib    -> tiket sah wajib ada, ATAU pendaftar sudah disetujui pengurus
   *               lewat antrean pengajuan manual (bukti sisi server juga).
   *
   * Tiket BELUM dipakai di titik ini — pemakaiannya ditunda ke dalam antrean
   * tulis (lihat langkah 5) agar dua klik kirim tidak menghabiskan tiket yang
   * sama lalu gagal menyimpan.
   */
  const mode = konfigurasi.wajibVerifikasi;
  let bukti = null;
  /* Persetujuan pengurus yang belum diterapkan. Dibaca di SINI (sebelum
     keputusan penolakan) supaya pendaftar jalur manual yang sudah disetujui
     tidak terkunci di luar saat mode `wajib`; antrean ini hanya bisa ditulis
     endpoint pengurus yang sudah melewati pastikanAdmin — jadi ini bukti sisi
     server, bukan klaim browser. */
  let persetujuan = null;

  /** Penolakan seragam: sebab + pesan per field, tanpa detail teknis. */
  const tolakTanpaBukti = (sebab) => {
    throw new GalatAplikasi(403, PESAN_TIKET[sebab] || PESAN_TIKET["tidak-sah"], {
      kodeVerifikasi: sebab,
      perluVerifikasi: true,
      galat: { username: PESAN_TIKET_GALAT[sebab] || "Verifikasi akun perlu diulang." },
    });
  };

  if (mode !== "off") {
    const dinilai = periksaTiket(body.tiketVerifikasi, bersih.username);
    if (dinilai.sah) {
      bukti = dinilai.data;
    } else if (body.tiketVerifikasi) {
      /* Tiket dikirim tapi tidak sah -> selalu ditolak, di mode apa pun.
         Persetujuan pengurus tidak menutupi tiket rusak: kalau dibiarkan,
         pendaftar bisa mengira dirinya sudah terverifikasi. */
      tolakTanpaBukti(dinilai.sebab || "tidak-sah");
    } else if (mode === "wajib") {
      /* Tidak ada tiket sama sekali di mode `wajib`: satu-satunya jalan masuk
         yang tersisa adalah persetujuan pengurus di antrean. */
      persetujuan = await persetujuanSiapDipakai(bersih.username).catch(() => null);
      if (!persetujuan) tolakTanpaBukti(dinilai.sebab || "tidak-sah");
    }
  }

  const hitam = await repoHitam.baca();

  /* Pepper berubah? Hentikan — lebih baik menolak daripada diam-diam
     meloloskan pemain yang seharusnya dilarang. */
  const bedaPepper = periksaPepper(hitam);
  if (bedaPepper.length) {
    console.error(
      `[kci] KCI_PEPPER tidak cocok dengan ${bedaPepper.length} entri daftar hitam ` +
        `(${bedaPepper.map((h) => h.username).join(", ")}).`
    );
    throw new GalatAplikasi(
      503,
      "Sistem verifikasi keanggotaan sedang bermasalah. Silakan hubungi pengurus."
    );
  }

  const identitas = hashKunci(bersih);

  /* 1. Username ada di daftar hitam? Perbandingan memakai username yang
        sudah dinormalisasi di SISI SERVER (hasil `periksaUsername`), sehingga
        kapitalisasi berbeda, spasi awal/akhir, atau bentuk tautan tidak bisa
        dipakai untuk menyelinap. */
  const kenaUsername = hitam.find(
    (h) => String(h.username || "").trim().toLowerCase() === bersih.username
  );
  if (kenaUsername) {
    await catatJejak("tolak-daftar-hitam-username", {
      username: bersih.username,
      ip: konteks.ip,
    });
    throw new GalatAplikasi(
      403,
      "Akun ini termasuk dalam daftar larangan komunitas dan tidak dapat mendaftar.",
      { alasan: kenaUsername.alasan, diblokir: true }
    );
  }

  /* 2. Identitas cocok dengan daftar hitam? (celah "akun kecil") */
  const cocok = cariDiDaftarHitam(identitas, hitam);
  if (cocok) {
    await catatJejak("tolak-daftar-hitam-identitas", {
      username: bersih.username,
      cocokDengan: cocok.entri.username,
      jenis: cocok.jenis,
      ip: konteks.ip,
    });
    const sebab =
      cocok.entri.alasan === "fair_play_violations"
        ? "pelanggaran fair play"
        : "keputusan pengurus";
    throw new GalatAplikasi(
      403,
      `Pendaftaran ditolak. Data Anda (${LABEL_KUNCI[cocok.jenis] || "identitas"}) ` +
        `cocok dengan anggota yang sebelumnya dilarang karena ${sebab}. ` +
        `Hubungi pengurus bila Anda merasa ini keliru.`,
      { alasan: cocok.entri.alasan, diblokir: true }
    );
  }

  /* 3. Verifikasi akun ke Chess.com (di luar antrean — ini lambat) */
  const pRes = await ambilProfil(bersih.username).catch((e) => {
    // Penyebab teknis hanya masuk log; klien menerima pesan umum saja.
    console.warn(`[kci] profil Chess.com gagal untuk "${bersih.username}": ${e?.message || e}`);
    throw new GalatAplikasi(
      502,
      "Chess.com sedang tidak dapat dihubungi. Coba beberapa saat lagi."
    );
  });

  if (!pRes.ada) {
    throw new GalatAplikasi(
      404,
      "Akun Chess.com tidak ditemukan. Periksa ejaan username.",
      { galat: { username: "Akun Chess.com tidak ditemukan." } }
    );
  }

  const profil = pRes.data;
  const statusAkun = evaluasiStatusChess(profil.status);

  /* 4. Akun yang mendaftar ternyata sudah kena ban fair play */
  if (statusAkun.diblokir) {
    await blokir({
      username: (profil.username || bersih.username).toLowerCase(),
      playerId: profil.player_id ?? null,
      identitas,
      alasan: statusAkun.alasan,
      keterangan: statusAkun.keterangan,
      sumber: "otomatis",
    });
    await catatJejak("tolak-fair-play", {
      username: bersih.username,
      ip: konteks.ip,
    });
    throw new GalatAplikasi(
      403,
      "Akun Chess.com ini ditutup karena pelanggaran fair play, sehingga tidak dapat bergabung.",
      { alasan: statusAkun.alasan, diblokir: true }
    );
  }

  if (statusAkun.ditutup) {
    throw new GalatAplikasi(
      403,
      "Akun Chess.com ini sudah ditutup dan tidak dapat didaftarkan."
    );
  }

  /* Username yang disimpan harus persis akun yang baru saja diverifikasi.
     Bila profil Chess.com menjawab dengan username lain (akun diganti nama,
     diarahkan ulang, atau sumber data aneh), tiket yang tadi sah tidak lagi
     membuktikan kepemilikan username ini — maka pendaftaran ditolak. */
  const dariProfil = periksaUsername(profil.username || bersih.username);
  if (!dariProfil.sah || dariProfil.username !== bersih.username) {
    await catatJejak("tolak-username-profil-beda", {
      diminta: bersih.username,
      dibacakan: dariProfil.username || "(tidak sah)",
      ip: konteks.ip,
    });
    throw new GalatAplikasi(409,
      "Username pada profil Chess.com tidak sama dengan akun yang diverifikasi. " +
        "Periksa kembali ejaan username Anda.", {
        galat: { username: "Profil Chess.com tidak cocok dengan username yang diverifikasi." },
      });
  }
  const uname = dariProfil.username;

  /* Keanggotaan publik mengikuti roster klub, bukan sekadar formulir lokal.
     Endpoint roster Chess.com dapat membutuhkan hingga 12 jam untuk ikut
     memperbarui setelah seseorang baru bergabung. */
  if (!(await anggotaAdaDiKlub(uname))) {
    throw new GalatAplikasi(
      403,
      `Akun ini belum tercatat di klub Chess.com "${konfigurasi.chess.klub.slug}". ` +
        "Gabung ke klub tersebut terlebih dahulu, lalu coba lagi setelah daftar anggotanya diperbarui.",
      {
        galat: {
          username:
            "Username harus sudah menjadi anggota klub Chess.com yang digunakan komunitas.",
        },
        perluGabungKlub: true,
      }
    );
  }

  /* Catatan pengurus: pendaftar tanpa tiket yang masih punya pengajuan manual
     di antrean ditandai supaya tidak perlu dicari-cari lagi. Markanya sendiri
     hanya informasi tampilan BUKAN keputusan keamanan.

     Persetujuan pengurus yang BELUM diterapkan (pengurus menyetujui sebelum
     pendaftar sempat mengirim formulir) adalah bukti yang sah: status
     "disetujui" hanya bisa ditulis endpoint pengurus yang sudah melewati
     pastikanAdmin, dan tidak dapat dibuat dari browser. Pembacaannya dilakukan
     DI SINI (luar antrean tulis) agar antrean penyimpanan tidak menahan
     panggilan database. */
  const pengajuan = bukti ? null : await statusPengajuan(bersih.username).catch(() => null);
  if (!persetujuan && !bukti && mode !== "off") {
    /* Mode `opsional` (jalur `wajib` sudah membacanya di atas): pendaftar tanpa
       tiket tetap berhak atas persetujuan pengurus yang sudah ada. */
    persetujuan = await persetujuanSiapDipakai(bersih.username).catch(() => null);
  }

  /* 5. Simpan — pengecekan duplikat DAN pemakaianskan tiket dilakukan DI
        DALAM antrean yang sama, agar:
          - dua permintaan bersamaan tidak lolos berdua (username sama);
          - satu tiket tidak habis dipakai dua pendaftaran;
          - tiket baru benar-benar hangus pada saat entri ditulis, bukan
            sebelum seluruh pemeriksaan lain selesai. */
  const baru = await repoAnggota.ubah(async (daftar) => {
    if (daftar.some((a) => String(a.username || "").toLowerCase() === uname)) {
      throw new GalatAplikasi(409, "Username ini sudah terdaftar sebagai anggota.", {
        galat: { username: "Username ini sudah terdaftar." },
      });
    }

    const ganda = cariDiDaftarHitam(identitas, daftar);
    if (ganda) {
      throw new GalatAplikasi(
        409,
        `Data ini (${LABEL_KUNCI[ganda.jenis] || "identitas"}) sudah dipakai ` +
          `anggota lain (${ganda.entri.username}). Satu orang cukup satu akun.`,
        { galat: { hp: "Nomor ini sudah terdaftar atas anggota lain." } }
      );
    }

    let caraVerifikasi = null;
    if (bukti) {
      const ulang = periksaTiket(body.tiketVerifikasi, bersih.username);
      if (!ulang.sah) {
        const sebab = ulang.sebab || "tidak-sah";
        throw new GalatAplikasi(409, PESAN_TIKET[sebab] || PESAN_TIKET["tidak-sah"], {
          kodeVerifikasi: sebab,
          perluVerifikasi: true,
          galat: { username: PESAN_TIKET_GALAT[sebab] || "Verifikasi akun perlu diulang." },
        });
      }
      caraVerifikasi = ulang.data.cara;
      tandaiTiketDipakai(ulang.data.jti, ulang.data.exp);
    } else if (persetujuan) {
      // Jalur manual: keputusan pengurus yang sudah tercatat di antrean.
      caraVerifikasi = "pengurus";
    }

    const entri = {
      username: uname,
      playerId: profil.player_id ?? null,
      panggilan: bersih.panggilan,
      kota: bersih.kota,
      kotaKunci: normalisasiKota(bersih.kota),
      klub: bersih.klub || null,
      kategoriUmur: kategoriUmur(bersih.tanggalLahir),
      // Status terverifikasi HANYA boleh datang dari bukti yang diverifikasi
      // server di atas (tiket atau persetujuan pengurus di antrean) — tidak
      // dari field mana pun milik browser.
      terverifikasi: Boolean(caraVerifikasi),
      caraVerifikasi,
      ...(persetujuan && !bukti
        ? {
            diverifikasiOleh: persetujuan.diperiksaOleh || "pengurus",
            disetujuiPada: persetujuan.diperiksaPada || null,
          }
        : {}),
      identitas,
      sidikPepper: sidikPepper(),
      statusChess: profil.status || null,
      daftarPada: new Date().toISOString(),
      ...(pengajuan ? { pengajuanVerifikasi: pengajuan.status } : {}),
    };
    return { data: [...daftar, entri], hasil: entri };
  });

  /* 6. Data pribadi disimpan terpisah dari berkas publik */
  try {
    await repoKontak.ubah(async (kontak) => ({
      data: {
        ...kontak,
        [uname]: {
          namaLengkap: bersih.namaLengkap,
          panggilan: bersih.panggilan,
          hp: bersih.hp,
          dana: bersih.dana || null,
          email: bersih.email || null,
          kota: bersih.kota,
          tanggalLahir: bersih.tanggalLahir,
          klub: bersih.klub || null,
          dicatatPada: new Date().toISOString(),
        },
      },
      hasil: null,
    }));
  } catch (e) {
    // Kontak adalah bagian dari pendaftaran. Bila gagal menulisnya, batalkan
    // entri anggota yang baru saja ditambahkan agar tidak ada anggota tanpa
    // data pribadi (tidak bisa dihubungi pengurus).
    await repoAnggota
      .ubah((daftar) => ({
        data: daftar.filter((a) => String(a.username || "").toLowerCase() !== uname),
        hasil: null,
      }))
      .catch(() => {});
    console.error(`[kci] penyimpanan kontak gagal untuk "${uname}": ${e?.message || e}`);
    // KONSEKUENSI YANG DIDOKUMENTASIKAN: tiket sudah dipakai di langkah 5 dan
    // TIDAK dikembalikan — tiket sekali pakai tidak boleh dapat "dibatalkan",
    // karena pendaftar masih memegang nilainya. Pendaftar karena itu diminta
    // mengulang verifikasi (pesan di bawah + tombol "Ulangi verifikasi" di UI);
    // isian formulirnya tetap ada di layar sehingga tidak perlu mengetik ulang.
    throw new GalatAplikasi(
      503,
      bukti
        ? "Pendaftaran belum tersimpan (penyimpanan data bermasalah). Data Anda masih terisi — kirim ulang setelah mengulang verifikasi akun."
        : "Pendaftaran belum tersimpan (penyimpanan data bermasalah). Data Anda masih terisi — silakan kirim ulang.",
      { perluVerifikasi: Boolean(bukti), kodeVerifikasi: bukti ? "tiket-habis" : undefined }
    );
  }

  await catatJejak("daftar-berhasil", { username: uname, ip: konteks.ip });
  /* Persetujuan pengurus baru ditandai "sudah diterapkan" SETELAH seluruh
     penyimpanan berhasil. Bila pendaftaran gagal (mis. tulis kontak error),
     persetujuan tetap tinggal di antrean dan pendaftar cukup mengirim ulang
     formulirnya tanpa harus menemui pengurus lagi. Kegagalan penandaan tidak
     membatalkan pendaftaran: pemakaiannya tetap dibatasi cek duplikat username
     di atas, dan jejak audit utama sudah tercatat. */
  if (persetujuan && !bukti) {
    await catatPersetujuanDiterapkan(persetujuan.id, "pendaftaran").catch((e) => {
      console.warn(`[kci] gagal menandai persetujuan diterapkan: ${e?.message || e}`);
    });
  }
  // Hapus cache Chess.com agar data baru diambil pada request berikutnya
  hapusCache(uname);
  // Snapshot roster dianggap usang: permintaan berikutnya tetap dijawab
  // seketika dari snapshot lama sambil disegarkan di latar belakang.
  usangkanRoster();
  // Respons tidak menyertakan data pribadi — pengguna pun tidak perlu
  // menerima kembali apa yang baru saja ia kirim.
  return lengkapiAnggota(tanpaRahasia(baru));
}

/* --------------------------------------------------- operasi pengurus */

/** Masukkan satu entri ke daftar hitam (idempoten). */
export async function blokir({
  username,
  playerId = null,
  identitas = {},
  alasan,
  keterangan,
  sumber = "pengurus",
}) {
  return repoHitam.ubah(async (hitam) => {
    const sudah = hitam.find((h) => h.username === username);
    if (sudah) return { data: undefined, hasil: sudah };

    const entri = {
      username,
      playerId,
      identitas,
      sidikPepper: sidikPepper(),
      alasan,
      keterangan,
      sumber,
      diblokirPada: new Date().toISOString(),
    };
    return { data: [...hitam, entri], hasil: entri };
  });
}

/**
 * Blokir anggota dari roster klub. Pemblokiran membatasi kegiatan di situs
 * dan turnamen; pengurus tetap perlu mengeluarkan akun dari klub Chess.com
 * bila ingin mencabut keanggotaannya di platform Chess.com juga.
 */
export async function blokirAnggota(username, keterangan) {
  const uname = normalisasiUsername(username);
  const keter = String(keterangan || "").trim().slice(0, 500);
  const [anggotaLokal, anggotaKlub] = await Promise.all([
    repoAnggota.baca(),
    daftarAnggotaKlub(),
  ]);
  const targetLokal = anggotaLokal.find((a) => a.username === uname);
  const targetKlub = anggotaKlub.find((a) => a.username === uname);
  if (!targetKlub) {
    throw new GalatAplikasi(404, `"${uname}" tidak ada di roster anggota klub.`);
  }

  const entri = await blokir({
    username: uname,
    playerId: targetLokal?.playerId ?? null,
    identitas: targetLokal?.identitas || {},
    alasan: "keputusan_pengurus",
    keterangan: keter || "Diblokir berdasarkan keputusan pengurus.",
    sumber: "pengurus",
  });

  // Metadata pribadi tidak lagi dibutuhkan setelah hash identitas dipindah
  // ke daftar hitam; roster publik tetap ditarik dari Chess.com.
  if (targetLokal) {
    await repoAnggota.ubah(async (daftar) => ({
      data: daftar.filter((a) => a.username !== uname),
      hasil: null,
    }));
  }

  await catatJejak("blokir-manual", { username: uname, keterangan: keter });
  // Hapus cache Chess.com agar data terbaru diambil
  hapusCache(uname);
  usangkanRoster();
  return entri;
}

/**
 * Pengurus menyetujui pengajuan manual untuk anggota yang SUDAH terdaftar:
 * status resmi diperbarui di penyimpanan (bukan di browser). Hanya dipanggil
 * dari endpoint pengurus yang sudah melewati pastikanAdmin.
 * @returns {Promise<boolean>} true bila ada catatan anggota yang diperbarui.
 */
export async function tandaiAnggotaTerverifikasi(username, cara = "pengurus") {
  const uname = periksaUsername(username).username;
  if (!uname) throw new GalatAplikasi(400, "Username tidak valid.");
  const diperbarui = await repoAnggota.ubah(async (daftar) => {
    const cocok = (a) => String(a.username || "").toLowerCase() === uname;
    if (!daftar.some(cocok)) return { data: undefined, hasil: false };
    return {
      data: daftar.map((a) =>
        cocok(a)
          ? {
              ...a,
              terverifikasi: true,
              caraVerifikasi: cara,
              terverifikasiPada: new Date().toISOString(),
              pengajuanVerifikasi: "disetujui",
              // Verifikasi yang baru diberikan membersihkan penanda dari
              // pemindaian otomatis, supaya tidak terus muncul di dasbor.
              perluVerifikasiUlang: false,
            }
          : a
      ),
      hasil: true,
    };
  });
  if (diperbarui) {
    await catatJejak("anggota-verifikasi-pengurus", { username: uname, cara });
    usangkanRoster();
  }
  return diperbarui;
}

/**
 * Verifikasi mandiri untuk anggota yang SUDAH terdaftar.
 *
 * Mengapa perlu: `daftarkan()` menolak username yang sudah ada (409), jadi
 * anggota lama yang terlanjur `terverifikasi:false` tidak punya jalan untuk
 * melengkapi bukti kepemilikan akun. Tanpa endpoint ini, pengetatan mode
 * `wajib` mengunci mereka di luar kegiatan komunitas secara permanen.
 *
 * OTORISASI. Repo ini tidak punya sesi/login anggota (login hanya untuk
 * pengurus), jadi yang menjadi bukti identitas di sini adalah TIKET itu
 * sendiri: HMAC ditandatangani server, terikat ke satu username, berumur
 * pendek, dan sekali pakai. Mengetahui username orang lain tidak cukup —
 * penyerang tetap harus membuktikan kepemilikan akun Chess.com itu lewat
 * OAuth atau kode di profil. Ini bukti yang sama persis dengan yang diterima
 * `daftarkan()`.
 *
 * Endpoint ini TIDAK dapat dipakai untuk memulihkan akun bermasalah:
 *   - akun di daftar larangan (username ATAU hash identitas) ditolak;
 *   - akun yang profil Chess.com-nya kena ban fair play atau ditutup ditolak,
 *     dan ban fair play langsung dicatat ulang ke daftar larangan.
 * Jadi pencabutan otomatis dari pemindaian tidak bisa dibatalkan sendiri.
 *
 * Tiket TIDAK dikembalikan ke klien, dan pemakaiannya ditandai DI DALAM
 * antrean tulis bersama penulisan status, supaya dua klik beruntun tidak
 * menghabiskan tiket yang sama lalu gagal menyimpan.
 */
export async function verifikasiMandiri({ username, tiketVerifikasi }, konteks = {}) {
  const diperiksa = periksaUsername(username);
  if (!diperiksa.sah) {
    throw new GalatAplikasi(
      400,
      PESAN_USERNAME[diperiksa.sebab] || PESAN_USERNAME.karakter,
      {
        galat: {
          username: PESAN_USERNAME[diperiksa.sebab] || PESAN_USERNAME.karakter,
        },
      }
    );
  }
  const uname = diperiksa.username;

  const tolakTiket = (sebab, status = 403) => {
    throw new GalatAplikasi(
      status,
      PESAN_TIKET[sebab] || PESAN_TIKET["tidak-sah"],
      {
        kodeVerifikasi: sebab,
        perluVerifikasi: true,
        galat: {
          username: PESAN_TIKET_GALAT[sebab] || "Verifikasi akun perlu diulang.",
        },
      }
    );
  };

  /* 1. Tiket dinilai lebih dulu (murah, tanpa jaringan) supaya permintaan
        sampah tidak sampai membebani Chess.com maupun antrean tulis. */
  const dinilai = periksaTiket(tiketVerifikasi, uname);
  if (!dinilai.sah) {
    await catatJejak("verifikasi-mandiri-ditolak", {
      username: uname,
      sebab: dinilai.sebab || "tidak-sah",
      ip: konteks.ip,
    });
    tolakTiket(dinilai.sebab || "tidak-sah");
  }

  /* 2. Harus anggota yang sudah ada — endpoint ini melengkapi verifikasi,
        bukan membuat anggota baru. */
  const anggota = await repoAnggota.baca();
  const rekam = anggota.find(
    (a) => String(a.username || "").toLowerCase() === uname
  );
  if (!rekam) {
    throw new GalatAplikasi(
      404,
      `"${uname}" belum terdaftar sebagai anggota. Isi formulir pendaftaran terlebih dahulu.`,
      { galat: { username: "Anggota tidak ditemukan." } }
    );
  }

  /* 3. Daftar larangan. Tanpa ini, akun yang sudah diblokir karena ban engine
        bisa memulihkan statusnya sendiri dengan tiket baru. */
  const hitam = await repoHitam.baca();
  const bedaPepper = periksaPepper(hitam);
  if (bedaPepper.length) {
    console.error(
      `[kci] KCI_PEPPER tidak cocok dengan ${bedaPepper.length} entri daftar hitam ` +
        `(${bedaPepper.map((h) => h.username).join(", ")}).`
    );
    throw new GalatAplikasi(
      503,
      "Sistem verifikasi keanggotaan sedang bermasalah. Silakan hubungi pengurus."
    );
  }

  const kenaUsername = hitam.find(
    (h) => String(h.username || "").trim().toLowerCase() === uname
  );
  if (kenaUsername) {
    await catatJejak("verifikasi-mandiri-ditolak", {
      username: uname,
      sebab: "daftar-hitam-username",
      ip: konteks.ip,
    });
    throw new GalatAplikasi(
      403,
      "Akun Anda dilarang mengikuti kegiatan komunitas. Hubungi pengurus bila Anda merasa ini keliru.",
      { alasan: kenaUsername.alasan, diblokir: true }
    );
  }

  const cocok = cariDiDaftarHitam(rekam.identitas || {}, hitam);
  if (cocok) {
    await catatJejak("verifikasi-mandiri-ditolak", {
      username: uname,
      sebab: "daftar-hitam-identitas",
      cocokDengan: cocok.entri.username,
      jenis: cocok.jenis,
      ip: konteks.ip,
    });
    throw new GalatAplikasi(
      403,
      `Verifikasi ditolak. Data Anda (${LABEL_KUNCI[cocok.jenis] || "identitas"}) cocok ` +
        `dengan anggota yang sebelumnya dilarang. Hubungi pengurus bila ini keliru.`,
      { alasan: cocok.entri.alasan, diblokir: true }
    );
  }

  /* 4. Status Chess.com terkini, DI LUAR antrean tulis (ini lambat).
        Chess.com yang sedang down menjawab 502 dan TIDAK mengubah apa pun —
        jalur manual pengurus tetap terbuka sebagai rem pengaman. */
  const pRes = await ambilProfil(uname).catch((e) => {
    console.warn(`[kci] profil Chess.com gagal untuk "${uname}": ${e?.message || e}`);
    throw new GalatAplikasi(
      502,
      "Chess.com sedang tidak dapat dihubungi. Coba beberapa saat lagi."
    );
  });

  if (!pRes.ada) {
    throw new GalatAplikasi(
      404,
      "Akun Chess.com tidak ditemukan. Periksa ejaan username.",
      { galat: { username: "Akun Chess.com tidak ditemukan." } }
    );
  }

  const profil = pRes.data;
  const statusAkun = evaluasiStatusChess(profil.status);

  if (statusAkun.diblokir) {
    await blokir({
      username: uname,
      playerId: profil.player_id ?? rekam.playerId ?? null,
      identitas: rekam.identitas || {},
      alasan: statusAkun.alasan,
      keterangan: statusAkun.keterangan,
      sumber: "otomatis",
    });
    await catatJejak("verifikasi-mandiri-ditolak", {
      username: uname,
      sebab: "tolak-fair-play",
      ip: konteks.ip,
    });
    throw new GalatAplikasi(
      403,
      "Akun Chess.com ini ditutup karena pelanggaran fair play, sehingga tidak dapat diverifikasi.",
      { alasan: statusAkun.alasan, diblokir: true }
    );
  }

  if (statusAkun.ditutup) {
    throw new GalatAplikasi(
      403,
      "Akun Chess.com ini sudah ditutup dan tidak dapat diverifikasi."
    );
  }

  /* Username yang dikembalikan profil harus sama dengan yang diverifikasi.
     Bila berbeda, tiket tadi tidak lagi membuktikan kepemilikan username ini. */
  const dariProfil = periksaUsername(profil.username || uname);
  if (!dariProfil.sah || dariProfil.username !== uname) {
    await catatJejak("verifikasi-mandiri-ditolak", {
      username: uname,
      sebab: "username-profil-beda",
      ip: konteks.ip,
    });
    throw new GalatAplikasi(
      409,
      "Username pada profil Chess.com tidak sama dengan akun yang diverifikasi.",
      { galat: { username: "Profil Chess.com tidak cocok dengan username yang diverifikasi." } }
    );
  }

  /* 5. Terapkan DI DALAM antrean tulis: tiket diperiksa ulang lalu ditandai
        dipakai pada saat yang sama dengan penulisan status. */
  const hasil = await repoAnggota.ubah(async (daftar) => {
    const ulang = periksaTiket(tiketVerifikasi, uname);
    if (!ulang.sah) tolakTiket(ulang.sebab || "tidak-sah", 409);

    const i = daftar.findIndex(
      (a) => String(a.username || "").toLowerCase() === uname
    );
    if (i === -1) {
      throw new GalatAplikasi(404, "Anggota tidak ditemukan.");
    }

    tandaiTiketDipakai(ulang.data.jti, ulang.data.exp);

    const sekarang = new Date().toISOString();
    const diperbarui = {
      ...daftar[i],
      // Status terverifikasi HANYA dari bukti yang diverifikasi server.
      terverifikasi: true,
      caraVerifikasi: ulang.data.cara,
      terverifikasiPada: sekarang,
      // Bersihkan penanda pemindaian otomatis: akun ini sudah punya bukti baru.
      perluVerifikasiUlang: false,
      alasanStatus: null,
      statusChess: profil.status || null,
      playerId: profil.player_id ?? daftar[i].playerId ?? null,
      diverifikasiMandiriPada: sekarang,
      /* `pengajuanVerifikasi` sengaja tidak disetel "disetujui": itu artinya
         pengurus yang menyetujui. Jalur ini adalah bukti mandiri. */
    };
    const salinan = [...daftar];
    salinan[i] = diperbarui;
    return {
      data: salinan,
      hasil: {
        username: uname,
        terverifikasi: true,
        caraVerifikasi: ulang.data.cara,
        terverifikasiPada: sekarang,
        perluVerifikasiUlang: false,
      },
    };
  });

  await catatJejak("verifikasi-mandiri", {
    username: uname,
    cara: hasil.caraVerifikasi,
    ip: konteks.ip,
  });
  hapusCache(uname);
  usangkanRoster();
  // Tiket TIDAK ikut dikembalikan ke klien.
  return hasil;
}

/** Cabut larangan. */
export async function bukaBlokir(username) {
  const uname = normalisasiUsername(username);
  const cocok = (h) => String(h.username || "").trim().toLowerCase() === uname;
  const dicabut = await repoHitam.ubah(async (hitam) => {
    const sisa = hitam.filter((h) => !cocok(h));
    if (sisa.length === hitam.length) {
      throw new GalatAplikasi(404, `"${uname}" tidak ada di daftar hitam.`);
    }
    return { data: sisa, hasil: true };
  });
  await catatJejak("buka-blokir", { username: uname });
  usangkanRoster();
  return dicabut;
}

/**
 * Jumlah maksimum username yang diperiksa dalam SATU invokasi pemindaian.
 *
 * Setiap username = satu permintaan profil ke Chess.com, dan chess.js membatasi
 * lima koneksi keluar bersamaan. Di Vercel fungsi dibatasi `maxDuration: 60`,
 * jadi memindai roster besar sekaligus bisa timeout di tengah jalan dan tidak
 * menghasilkan apa pun. Pemindaian dipecah per batch dan dilanjutkan lewat
 * kursor yang disimpan di `terakhir-pindai.json`.
 */
export const MAKS_PINDAI_PER_JALAN = 40;

/** Kumpulkan pencabutan verifikasi satu entri untuk penulisan berikutnya. */
function kumpulkanCabut(pembaruan, rekam, alasan, hasil) {
  pembaruan.set(rekam.username, {
    ...(pembaruan.get(rekam.username) || {}),
    terverifikasi: false,
    perluVerifikasiUlang: true,
    alasanStatus: alasan || null,
    diperiksaPada: new Date().toISOString(),
  });
  // Dihitung hanya bila statusnya BENAR-BENAR turun, supaya angka di dasbor
  // tidak membengkak setiap kali pemindaian mengulang akun yang sama.
  if (rekam.terverifikasi === true) hasil.dicabut.push(rekam.username);
}

/**
 * Kumpulkan penandaan PERLU DIPERIKSA ULANG tanpa mencabut verifikasi.
 * Dipakai untuk sinyal yang tidak cukup kuat sebagai bukti.
 */
function kumpulkanTandai(pembaruan, rekam, alasan, hasil) {
  pembaruan.set(rekam.username, {
    ...(pembaruan.get(rekam.username) || {}),
    perluVerifikasiUlang: true,
    alasanStatus: alasan || null,
    diperiksaPada: new Date().toISOString(),
  });
  if (rekam.perluVerifikasiUlang !== true) hasil.ditandai.push(rekam.username);
}

/**
 * Pindai status akun Chess.com, lalu cabut verifikasi akun yang bermasalah.
 *
 * SUMBER YANG DIPINDAI adalah GABUNGAN roster klub Chess.com dan anggota yang
 * tercatat di situs (`data/anggota.json`). Sebelumnya hanya roster yang
 * dipindai, sehingga dua kelompok penting lolos dari pemeriksaan:
 *   - anggota yang keluar atau dikeluarkan dari klub Chess.com;
 *   - anggota yang dulu mendaftar tanpa bukti kepemilikan akun.
 * Justru mereka yang paling mungkin memakai engine lalu kena ban fair play,
 * dan ban semacam itu tidak akan pernah terlacak bila hanya roster yang dilihat.
 *
 * Yang ditulis balik ke entri anggota:
 *   - ban fair play, akun ditutup, atau akun hilang (404 definitif)
 *       -> `terverifikasi:false` + `perluVerifikasiUlang:true` + `alasanStatus`
 *          + `diperiksaPada`, plus jejak audit `verifikasi-dicabut`.
 *   - tidak lagi muncul di roster klub
 *       -> `perluVerifikasiUlang:true` SAJA, verifikasi TIDAK dicabut.
 *     Endpoint roster Chess.com resmi bisa tertinggal hingga 12 jam, jadi
 *     "tidak ada di roster" bukan bukti yang cukup kuat untuk mencabut
 *     verifikasi anggota yang sah. Keputusan tetap di pengurus.
 *
 * Kegagalan jaringan, timeout, atau 5xx TIDAK PERNAH mencabut apa pun — hanya
 * dihitung di `hasil.gagal`. Ini rem pengaman saat Chess.com sedang down:
 * gangguan di sisi Chess.com tidak boleh mengubah data anggota kami.
 *
 * Pencabutan bersifat satu arah. Pemindaian tidak pernah memulihkan
 * `terverifikasi:true`; pemulihan hanya lewat bukti baru (verifikasi mandiri,
 * OAuth, atau kode profil) atau tindakan pengurus.
 *
 * Semua fetch HTTP dijalankan DI LUAR antrean tulis: `berurutan()` di
 * simpanan.js adalah satu antrean global, sehingga menahan antrean sambil
 * menunggu jaringan akan menyumbat seluruh penulisan data. Hasilnya
 * dikumpulkan dulu, lalu ditulis dalam satu `repoAnggota.ubah()`.
 *
 * @param {{batas?: number, kursor?: string}} [opsi] `kursor` = username terakhir
 *   yang sudah diperiksa pada batch sebelumnya; batch ini mulai sesudahnya.
 */
export async function pindaiFairPlay({ batas = MAKS_PINDAI_PER_JALAN, kursor = "" } = {}) {
  // Data lokal dibaca lebih dulu agar hash identitas tetap ikut tercatat
  // ketika suatu akun harus diblokir.
  /* Kegagalan roster TIDAK boleh membatalkan pemindaian: anggota situs tetap
     diperiksa walau endpoint klub Chess.com sedang bermasalah. */
  const [anggotaLokal, anggotaKlub] = await Promise.all([
    repoAnggota.baca(),
    daftarAnggotaKlub().catch(() => null),
  ]);
  const rosterTersedia = Array.isArray(anggotaKlub);
  const roster = rosterTersedia ? anggotaKlub : [];
  const lokalPerUsername = new Map(anggotaLokal.map((a) => [a.username, a]));
  const rosterKlub = new Set(roster.map((a) => a.username));

  /* Gabungan roster + anggota situs, diurutkan agar kursor stabil antar
     invokasi (urutan dari Chess.com tidak dijamin sama setiap kali). */
  const gabungan = [...new Set([...rosterKlub, ...lokalPerUsername.keys()])].sort();
  const mulai = kursor ? Math.max(0, gabungan.findIndex((u) => u > kursor)) : 0;
  const batch = gabungan.slice(mulai, mulai + Math.max(1, batas));

  const hasil = {
    diperiksa: 0,
    diblokir: [],
    ditutup: [],
    hilang: [],
    gagal: [],
    dicabut: [],
    ditandai: [],
    jumlahKlub: rosterTersedia ? rosterKlub.size : null,
    jumlahSitus: lokalPerUsername.size,
    jumlahGabungan: gabungan.length,
    kursor,
    kursorLanjut: batch.length ? batch[batch.length - 1] : kursor,
    selesai: mulai + batch.length >= gabungan.length,
  };

  const pembaruanLokal = new Map();

  /* Janji seluruh batch dijalankan bersamaan, tetapi chess.js tetap membatasi
     koneksi keluar menjadi lima sehingga tidak membanjiri API. */
  await Promise.all(
    batch.map(async (username) => {
      hasil.diperiksa += 1;
      const rekamLokal = lokalPerUsername.get(username);
      try {
        const pRes = await ambilProfil(username, { pakaiCache: false });

        /* 404 DEFINITIF: permintaan berhasil dan akun memang tidak ada.
           Kegagalan jaringan ditangani blok catch, bukan di sini. */
        if (!pRes.ada) {
          hasil.hilang.push(username);
          if (rekamLokal) kumpulkanCabut(pembaruanLokal, rekamLokal, "akun-hilang", hasil);
          return;
        }

        const profil = pRes.data;
        const st = evaluasiStatusChess(profil.status);
        let alasanCabut = null;

        if (st.diblokir) {
          await blokir({
            username,
            playerId: profil.player_id ?? rekamLokal?.playerId ?? null,
            identitas: rekamLokal?.identitas || {},
            alasan: st.alasan,
            keterangan: st.keterangan,
            sumber: "otomatis",
          });
          hasil.diblokir.push(username);
          alasanCabut = st.alasan;
        } else if (st.ditutup) {
          hasil.ditutup.push(username);
          alasanCabut = "closed";
        }

        if (rekamLokal) {
          if (alasanCabut) {
            kumpulkanCabut(pembaruanLokal, rekamLokal, alasanCabut, hasil);
          } else if (rosterTersedia && !rosterKlub.has(username)) {
            /* Hanya bila roster benar-benar terbaca. Kalau endpoint klub gagal,
               "tidak ada di roster" tidak bisa dibedakan dari "roster tidak
               tersedia", dan menandai seluruh anggota akan jadi banjir
               positif palsu. */
            kumpulkanTandai(pembaruanLokal, rekamLokal, "keluar-klub", hasil);
          }
          /* Metadata Chess.com tetap disegarkan. Penandaan yang sudah
             dikumpulkan ditumpuk di atasnya supaya tidak tertimpa. */
          pembaruanLokal.set(username, {
            statusChess: profil.status || null,
            playerId: profil.player_id ?? rekamLokal.playerId ?? null,
            ...(pembaruanLokal.get(username) || {}),
          });
        }
      } catch (e) {
        /* Chess.com down / timeout / 5xx: JANGAN sentuh data anggota. */
        hasil.gagal.push({ username, sebab: e.message });
      }
    })
  );

  /* Hanya metadata anggota yang pernah mendaftar lokal yang ditulis balik;
     roster utama tidak disalin ke data/anggota.json. */
  if (pembaruanLokal.size) {
    await repoAnggota.ubah(async (daftar) => ({
      data: daftar.map((a) => ({
        ...a,
        ...(pembaruanLokal.get(a.username) || {}),
      })),
      hasil: null,
    }));
  }

  hasil.selesaiPada = new Date().toISOString();
  await catatJejak("pindai-fairplay", {
    diperiksa: hasil.diperiksa,
    diblokir: hasil.diblokir.length,
    dicabut: hasil.dicabut.length,
    ditandai: hasil.ditandai.length,
    selesai: hasil.selesai,
  });
  /* Jejak per akun ditulis SETELAH penulisan berhasil, supaya audit tidak
     mengklaim pencabutan yang ternyata gagal tersimpan. */
  for (const username of hasil.dicabut) {
    await catatJejak("verifikasi-dicabut", {
      username,
      alasan: pembaruanLokal.get(username)?.alasanStatus || null,
      sumber: "pindai-otomatis",
    });
  }
  // Hapus cache untuk anggota yang dipindai agar data terbaru diambil
  for (const username of batch) hapusCache(username);
  usangkanRoster();
  return hasil;
}

/** Periksa apakah sebuah nomor HP ada di daftar hitam. */
export async function cekNomor(hp) {
  const n = normalisasiHp(hp);
  if (!n) throw new GalatAplikasi(400, "Nomor HP wajib diisi.");
  const hitam = await repoHitam.baca();

  const bedaPepper = periksaPepper(hitam);
  if (bedaPepper.length) {
    throw new GalatAplikasi(
      503,
      "KCI_PEPPER tidak cocok dengan data daftar hitam — hasil pemeriksaan tidak dapat dipercaya."
    );
  }

  const cocok = cariDiDaftarHitam(hashKunci({ hp: n }), hitam);
  return cocok
    ? {
        diblokir: true,
        username: cocok.entri.username,
        alasan: cocok.entri.alasan,
        keterangan: cocok.entri.keterangan,
        cocokPada: LABEL_KUNCI[cocok.jenis],
      }
    : { diblokir: false };
}

/** Data pribadi anggota — hanya untuk pengurus. */
export async function kontakAnggota(username) {
  const kontak = await repoKontak.baca();
  const uname = normalisasiUsername(username);
  const data = kontak[uname];
  if (!data) throw new GalatAplikasi(404, `Kontak "${uname}" tidak ditemukan.`);
  return data;
}

export async function ringkasan() {
  const [anggotaLokal, anggotaKlub, hitam] = await Promise.all([
    repoAnggota.baca(),
    daftarAnggotaKlub().catch(() => []),
    repoHitam.baca(),
  ]);
  return {
    // Angka utama mengikuti sumber publik yang sama dengan halaman anggota.
    anggota: anggotaKlub.length,
    anggotaTerdata: anggotaLokal.length,
    klubChess: konfigurasi.chess.klub.slug,
    daftarHitam: hitam.length,
    otomatis: hitam.filter((h) => h.sumber === "otomatis").length,
    pengurus: hitam.filter((h) => h.sumber === "pengurus").length,
    /* Anggota situs yang verifikasinya perlu ditindak. `perluVerifikasiUlang`
       dipasang pemindaian otomatis; `belumTerverifikasi` adalah anggota yang
       sejak awal tidak punya bukti kepemilikan akun. Keduanya ditampilkan di
       dasbor supaya pengurus tidak perlu menunggu keluhan masuk. */
    perluVerifikasiUlang: anggotaLokal.filter((a) => a.perluVerifikasiUlang === true).length,
    belumTerverifikasi: anggotaLokal.filter((a) => a.terverifikasi !== true).length,
    // Catatan: sidikPepper() sengaja TIDAK dikirim ke klien. Ia hanya
    // dipakai server untuk mendeteksi perubahan pepper antar-berkas.
  };
}

/**
 * Pindai fair play secara otomatis — hanya jika sudah lebih dari 6 jam
 * sejak putaran terakhir, ATAU putaran sebelumnya belum tuntas.
 * Mengembalikan hasil scan bila dijalankan, atau null bila belum waktunya.
 */
const BERKAS_META_PINDAI = () => path.join(konfigurasi.dirData, "terakhir-pindai.json");

/** Baca marker putaran pemindaian. Tidak pernah melempar. */
async function bacaMetaPindai() {
  try {
    const meta = await bacaJson(BERKAS_META_PINDAI(), {});
    return meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
  } catch {
    return {}; // pertama kali — belum ada berkas
  }
}

/** Apakah masih ada sisa batch dari putaran yang belum tuntas? */
const adaSisaBatch = (meta) => meta.selesai === false && Boolean(meta.kursor);

/**
 * Jalankan SATU batch pemindaian dan simpan kemajuannya.
 *
 * Kursor ikut disimpan supaya roster yang lebih besar dari satu batch tetap
 * tuntas tergarap: batch berikutnya mulai tepat setelah username terakhir,
 * bukan mengulang dari awal. Tanpa ini, akun di ujung daftar tidak pernah
 * terperiksa dan ban-nya tidak pernah terlacak.
 */
async function jalankanSatuBatch(meta) {
  const hasil = await pindaiFairPlay({
    kursor: adaSisaBatch(meta) ? meta.kursor : "",
  });

  /* `waktu` = selesainya satu PUTARAN penuh, bukan setiap batch, supaya
     throttle 6 jam dihitung dari putaran terakhir yang tuntas. */
  await tulisJson(BERKAS_META_PINDAI(), {
    waktu: hasil.selesai ? new Date().toISOString() : meta.waktu || null,
    kursor: hasil.selesai ? "" : hasil.kursorLanjut,
    selesai: hasil.selesai,
    diperiksa: hasil.diperiksa,
    diblokir: hasil.diblokir.length,
    dicabut: hasil.dicabut.length,
    ditandai: hasil.ditandai.length,
    gagal: hasil.gagal.length,
    diperbaruiPada: new Date().toISOString(),
  });

  return hasil;
}

/**
 * Pindai fair play secara otomatis — hanya jika sudah lebih dari 6 jam
 * sejak putaran terakhir, ATAU putaran sebelumnya belum tuntas.
 * Mengembalikan hasil scan bila dijalankan, atau null bila belum waktunya.
 */
export async function pindaiFairPlayOtomatis() {
  const meta = await bacaMetaPindai();
  const ENAM_JAM = 6 * 60 * 60 * 1000;
  const terakhir = meta.waktu ? new Date(meta.waktu).getTime() : 0;
  /* Batch yang belum tuntas dilanjutkan TANPA menunggu jeda 6 jam. Kalau
     tidak, roster besar tidak akan pernah selesai dipindai. */
  if (!adaSisaBatch(meta) && Date.now() - terakhir < ENAM_JAM) {
    return null; // belum waktunya
  }
  return jalankanSatuBatch(meta);
}

/**
 * Satu batch pemindaian TANPA throttle 6 jam — dipakai tombol "Pindai sekarang"
 * di dasbor pengurus. Tetap melanjutkan kursor yang tersimpan, jadi menekan
 * tombol berulang kali benar-benar menyusuri seluruh roster, bukan mengulang
 * 40 akun pertama terus-menerus.
 */
export async function pindaiFairPlayLanjut() {
  return jalankanSatuBatch(await bacaMetaPindai());
}

/**
 * Pemindaian terjadwal: jalankan batch BERUNTUN sampai roster tuntas atau
 * anggaran waktu habis.
 *
 * Mengapa tidak satu batch saja: paket Vercel Hobby hanya mengizinkan cron
 * sekali sehari (ekspresi yang lebih sering membuat DEPLOYMENT GAGAL, bukan
 * sekadar diperlambat). Dengan satu pemanggilan per hari, satu batch 40 akun
 * berarti roster besar baru tuntas berhari-hari — dan ban di ujung daftar
 * tetap tidak terlacak. Loop beranggaran waktu menutup itu: satu pemanggilan
 * cron mengerjakan sebanyak yang muat dalam `maxDuration`.
 *
 * `anggaranMs` sengaja di bawah `maxDuration: 60` supaya fungsi sempat
 * menyimpan kursor dan menjawab 200, bukan mati dipotong di tengah.
 *
 * Throttle 6 jam diperiksa DI SINI (bukan oleh pemanggil) supaya satu
 * pemanggilan cron = tepat satu rangkaian batch. Kalau pemanggil menjalankan
 * satu batch lebih dulu lalu memanggil fungsi ini, batch pertama akan terulang.
 *
 * @param {{anggaranMs?: number, paksa?: boolean}} [opsi] `paksa:true` melewati
 *   throttle — dipakai uji dan pemulihan manual.
 */
export async function pindaiFairPlayTerjadwal({ anggaranMs = 45000, paksa = false } = {}) {
  const ENAM_JAM = 6 * 60 * 60 * 1000;
  if (!paksa) {
    const metaAwal = await bacaMetaPindai();
    const terakhir = metaAwal.waktu ? new Date(metaAwal.waktu).getTime() : 0;
    if (!adaSisaBatch(metaAwal) && Date.now() - terakhir < ENAM_JAM) {
      // Belum waktunya. Jawaban normal, bukan kegagalan.
      return { dijalankan: false, batch: 0, diperiksa: 0, selesai: false };
    }
  }

  const mulaiPada = Date.now();
  const ringkas = {
    dijalankan: true,
    batch: 0,
    diperiksa: 0,
    diblokir: [],
    ditutup: [],
    hilang: [],
    gagal: [],
    dicabut: [],
    ditandai: [],
    selesai: false,
    anggaranHabis: false,
    durasiMs: 0,
  };
  for (;;) {
    const hasil = await jalankanSatuBatch(await bacaMetaPindai());
    ringkas.batch += 1;
    ringkas.diperiksa += hasil.diperiksa;
    for (const kunci of ["diblokir", "ditutup", "hilang", "gagal", "dicabut", "ditandai"]) {
      ringkas[kunci].push(...(hasil[kunci] || []));
    }
    ringkas.selesai = hasil.selesai;

    if (hasil.selesai) break;
    /* Rem pengaman: bila kursor tidak maju (gabungan kosong, atau kursor
       tersimpan menunjuk melewati ujung daftar), berhenti daripada berputar
       selamanya sampai durasi fungsi dipotong Vercel di tengah. */
    if (hasil.kursorLanjut === hasil.kursor) break;
    if (Date.now() - mulaiPada >= anggaranMs) {
      ringkas.anggaranHabis = true;
      break;
    }
  }

  ringkas.durasiMs = Date.now() - mulaiPada;
  // Daftar username tetap dikembalikan (dipakai log/notifikasi), ditambah
  // bentuk angka supaya pemantau eksternal mudah membacanya.
  return {
    ...ringkas,
    jumlahDiblokir: ringkas.diblokir.length,
    jumlahDicabut: ringkas.dicabut.length,
    jumlahDitandai: ringkas.ditandai.length,
    jumlahGagal: ringkas.gagal.length,
  };
}

/**
 * Ringkasan pemindaian terakhir untuk dasbor pengurus dan `/api/kesehatan`.
 * Dibaca dari berkas marker yang sama dengan `pindaiFairPlayOtomatis()`.
 * Tidak pernah melempar: ketiadaan berkas berarti "belum pernah dipindai".
 */
export async function statusPindaiTerakhir() {
  const meta = await bacaMetaPindai();
  if (!meta.pernah && !meta.waktu && !meta.diperbaruiPada && meta.selesai === undefined) {
    return { pernah: false };
  }
  return {
    pernah: true,
    waktu: meta.waktu || null,
    diperbaruiPada: meta.diperbaruiPada || meta.waktu || null,
    selesai: meta.selesai !== false,
    kursor: meta.kursor || "",
    diperiksa: meta.diperiksa ?? 0,
    diblokir: meta.diblokir ?? 0,
    dicabut: meta.dicabut ?? 0,
    ditandai: meta.ditandai ?? 0,
    gagal: meta.gagal ?? 0,
  };
}

export { repoAnggota, repoHitam, repoKontak, repoRoster };
