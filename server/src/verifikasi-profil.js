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
 *   mengubah status anggota menjadi terverifikasi. Lihat blok "SATU mekanisme
 *   approval untuk jalur manual" di bawah: endpoint pengurus sengaja TIDAK
 *   menyerahkan tiket, supaya tidak ada dua mekanisme yang menghasilkan state
 *   yang sama lewat jalan berbeda.
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";
import { ambilProfil } from "./chess.js";
import { buatRepo } from "./simpanan.js";
import { supabaseSiap } from "./storage-supabase.js";
import { catatJejak } from "./audit.js";
import { periksaUsername } from "../../src/lib/identitas.js";

/** Umur & rem tantangan dibaca dari konfigurasi supaya pengujian dapat
 *  mempersingkatnya tanpa mengubah nilai produksi. */
const umurTantanganMs = () => konfigurasi.verifikasi.umurTantanganDetik * 1000;
const jedaCekMs = () => konfigurasi.verifikasi.jedaCekDetik * 1000;
const maksPercobaan = () => konfigurasi.verifikasi.maksPercobaan;

/**
 * username -> { kode, kedaluwarsa, terakhirCek, percobaan }
 *
 * Melalui `buatRepo` (lapisan penyimpanan yang SUDAH ada di repo ini), jadi
 * otomatis ikut pindah ke PostgreSQL/Supabase (`kci_storage`) bila dipasang.
 * Kenapa bukan `Map` di memori: pada deployment serverless dua request
 * berurutan tidak dijamin mendarat di instance yang sama, dan memori /tmp
 * hilang saat cold start — pendaftar akan kehilangan kodenya di tengah
 * alur. Tantangan sekarang berada di tempat yang sama persis dengan antrean
 * pengajuan manual, sehingga jaminannya identik dengan data aplikasi lain.
 */
const repoTantangan = buatRepo(konfigurasi.berkasTantangan, {});

/** Antrean pengajuan manual (pending) — bukan bukti keamanan. */
const repoPengajuan = buatRepo(konfigurasi.berkasPengajuan, []);

/** Entri masih berlaku? Cacat data dianggap kedaluwarsa (fail closed). */
function masihBerlaku(entri, kini = Date.now()) {
  const sampai = Number(entri?.kedaluwarsa);
  return Boolean(entri) && Number.isFinite(sampai) && sampai > kini;
}

/**
 * Hanya entri yang masih berlaku. Sekaligus menjadi pembersih: berkas
 * tantangan tidak ditumbuhi entri mati walau tidak ada timer apa pun
 * (interval pembersih sengaja tidak dipasang — pada serverless timer hanya
 * membuat instance tetap hidup tanpa menjamin apa pun).
 */
function buangKedaluwarsa(daftar, kini = Date.now()) {
  const sisa = {};
  const sumber = daftar && typeof daftar === "object" ? daftar : {};
  for (const [k, v] of Object.entries(sumber)) {
    if (v && typeof v === "object" && masihBerlaku(v, kini)) sisa[k] = v;
  }
  return sisa;
}

function tanpaEntri(daftar, username) {
  const { [username]: _buang, ...sisa } = daftar;
  return sisa;
}

/** Buang satu tantangan (bila ada). Tidak pernah melempar. */
function hapusTantangan(username) {
  return repoTantangan
    .ubah((daftar) =>
      daftar && Object.prototype.hasOwnProperty.call(daftar, username)
        ? { data: tanpaEntri(buangKedaluwarsa(daftar), username) }
        : {}
    )
    .catch(() => undefined);
}

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
 *
 * Profil Chess.com dibaca SEBELUM masuk antrean tulis: `berurutan()` dipakai
 * bersama oleh seluruh penyimpanan aplikasi, jadi jaringan tidak boleh
 * ditanggung di dalamnya.
 */
export async function mintaKode(usernameMentah, { paksa = false } = {}) {
  const username = usernameTantangan(usernameMentah);

  const res = await ambilProfil(username);
  if (!res.ada) {
    throw galatHttp(404, "Akun Chess.com tidak ditemukan. Periksa ejaan username.", "akun-tidak-ditemukan");
  }

  const umurMs = umurTantanganMs();
  return repoTantangan.ubah((daftar) => {
    const simpanan = buangKedaluwarsa(daftar);
    const lama = simpanan[username];
    if (!paksa && lama) {
      // Tantangan masih berlaku: kembalikan yang sama TANPA menulis ulang.
      return {
        hasil: {
          username,
          kode: lama.kode,
          berlakuDetik: Math.max(0, Math.floor((lama.kedaluwarsa - Date.now()) / 1000)),
          diulang: true,
        },
      };
    }

    const kode = buatKode();
    const entri = {
      kode,
      kedaluwarsa: Date.now() + umurMs,
      terakhirCek: 0,
      percobaan: 0,
    };
    return {
      data: { ...simpanan, [username]: entri },
      hasil: {
        username,
        kode,
        berlakuDetik: Math.floor(umurMs / 1000),
        diulang: false,
      },
    };
  });
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
 *
 * Urutan disengaja: baca cepat -> jaringan (di luar antrean) -> KEPUTUSAN
 * AKHIR di dalam antrean tulis. Dengan begitu dua permintaan pemeriksaan yang
 * datang bersamaan tidak bisa sama-sama menang: yang kedua melihat tantangan
 * sudah terpakai/habis jeda, sehingga hanya satu tiket yang terbit.
 */
export async function periksaKode(usernameMentah) {
  const username = usernameTantangan(usernameMentah);
  const jedaMs = jedaCekMs();

  /* Penolakan awal: hemat satu panggilan API Chess.com untuk kasus yang jelas.
     Berkas dibaca MENTAH (tanpa penyaringan) supaya "sudah kedaluwarsa" tetap
     bisa dibedakan dari "tidak pernah minta kode" — keduanya butuh tindakan
     pengguna yang berbeda. */
  const mentah = await repoTantangan.baca();
  const entriAwal = mentah && typeof mentah === "object" ? mentah[username] : null;
  if (!entriAwal) {
    throw galatHttp(
      400,
      "Belum ada kode aktif untuk akun ini. Minta kode baru, tempelkan ke profil, lalu periksa lagi.",
      "tantangan-tidak-ada"
    );
  }
  const kiniAwal = Date.now();
  if (!masihBerlaku(entriAwal, kiniAwal)) {
    await hapusTantangan(username);
    throw galatHttp(410, "Kode sudah kedaluwarsa. Minta kode baru.", "kode-kedaluwarsa");
  }
  if (kiniAwal - Number(entriAwal.terakhirCek || 0) < jedaMs) {
    const tunggu = Math.ceil((jedaMs - (kiniAwal - Number(entriAwal.terakhirCek || 0))) / 1000);
    throw galatHttp(429, `Tunggu ${tunggu} detik sebelum memeriksa lagi.`, "terlalu-cepat");
  }

  // Profil harus dibaca segar — cache akan menyembunyikan perubahan terbaru.
  const res = await ambilProfil(username, { pakaiCache: false });
  if (!res.ada) {
    throw galatHttp(404, "Akun Chess.com tidak ditemukan.", "akun-tidak-ditemukan");
  }

  const profil = res.data;
  const keputusan = await repoTantangan.ubah((daftar) => {
    const kini = Date.now();
    const asal = daftar && typeof daftar === "object" ? daftar : {};
    const simpanan = buangKedaluwarsa(asal, kini); // kunci lain ikut dibersihkan
    const e = asal[username]; // kunci ini dinilai mentah, bukan hasil saringan

    if (!e) return { hasil: { jenis: "tidak-ada" } };
    if (!masihBerlaku(e, kini)) {
      return { data: tanpaEntri(simpanan, username), hasil: { jenis: "kedaluwarsa" } };
    }
    if (kini - Number(e.terakhirCek || 0) < jedaMs) {
      return {
        hasil: {
          jenis: "terlalu-cepat",
          tungguDetik: Math.ceil((jedaMs - (kini - Number(e.terakhirCek || 0))) / 1000),
        },
      };
    }

    const percobaan = Number(e.percobaan || 0) + 1;
    if (percobaan > maksPercobaan()) {
      return { data: tanpaEntri(simpanan, username), hasil: { jenis: "terlalu-banyak" } };
    }

    if (!kodeTerdeteksiDiProfil(profil, e.kode)) {
      return {
        data: { ...simpanan, [username]: { ...e, terakhirCek: kini, percobaan } },
        hasil: {
          jenis: "belum",
          // Yang ditampilkan hanya kolom milik peminta sendiri, bukan data profil penuh.
          terbaca: profil.location || "(kolom Location kosong)",
        },
      };
    }

    // Sekali pakai: tantangan dihapus pada saat keberhasilan diputuskan,
    // sehingga hasil "cocok" tidak dapat ditukar jadi tiket kedua.
    return {
      data: tanpaEntri(simpanan, username),
      hasil: { jenis: "cocok", playerId: profil.player_id ?? null },
    };
  });

  switch (keputusan.jenis) {
    case "cocok":
      return { cocok: true, username, playerId: keputusan.playerId };
    case "belum":
      return {
        cocok: false,
        username,
        pesan:
          "Kode belum terbaca di profil Anda. Pastikan sudah disimpan, " +
          "lalu tunggu sebentar dan periksa lagi.",
        terbaca: keputusan.terbaca,
      };
    case "terlalu-cepat":
      throw galatHttp(
        429,
        `Tunggu ${keputusan.tungguDetik} detik sebelum memeriksa lagi.`,
        "terlalu-cepat"
      );
    case "kedaluwarsa":
      throw galatHttp(410, "Kode sudah kedaluwarsa. Minta kode baru.", "kode-kedaluwarsa");
    case "terlalu-banyak":
      throw galatHttp(429, "Terlalu banyak percobaan. Minta kode baru.", "terlalu-banyak-percobaan");
    default:
      throw galatHttp(
        400,
        "Belum ada kode aktif untuk akun ini. Minta kode baru, tempelkan ke profil, lalu periksa lagi.",
        "tantangan-tidak-ada"
      );
  }
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

  const data = buangKedaluwarsa(await repoTantangan.baca())[username] || null;
  const kodeTerdeteksi = data ? kodeTerdeteksiDiProfil(res.data, data.kode) : false;
  // Tantangan lama tidak berlaku lagi begitu pengguna memilih jalur manual.
  if (data) await hapusTantangan(username);

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

/**
 * Status pengajuan untuk satu username (informasi tampilan, bukan keputusan
 * keamanan — keputusan hanya diambil lewat `persetujuanSiapDipakai`).
 */
export async function statusPengajuan(username) {
  const arr = await repoPengajuan.baca();
  const cocok = (Array.isArray(arr) ? arr : []).filter((p) => p.username === username);
  if (!cocok.length) return null;
  const terakhir = cocok.reduce((a, b) =>
    String(b.diperbaruiPada || "") > String(a.diperbaruiPada || "") ? b : a
  );
  return { status: terakhir.status, diperiksaPada: terakhir.diperiksaPada || null };
}

/* ------------------ SATU mekanisme approval untuk jalur manual --------------
 *
 * Status "terverifikasi" dari jalur manual lahir dari SATU peristiwa: sebuah
 * pengajuan dipindahkan ke "disetujui" oleh endpoint pengurus yang sudah
 * melewati `pastikanAdmin`. Tidak ada mekanisme kedua, dan sengaja tidak ada
 * lagi tiket yang diserahkan ke respons pengurus — tiket adalah bukti untuk
 * jalur otomatis (OAuth / kode profil), dan menyalurkannya ke manusia lalu ke
 * formulir pendaftar hanya menciptakan jalan kedua yang menghasilkan state
 * yang sama tetapi lewat pihak yang berbeda (membingungkan dan lebih mudah
 * salah pakai).
 *
 * Persetujuan berlaku untuk SATU username dan sekali pakai:
 *   - pendaftar sudah mengirim formulir -> `tandaiAnggotaTerverifikasi()`
 *     menulis status ke catatan anggota (di endpoint pengurus);
 *   - pendaftar belum sempat mengirim formulir -> persetujuan tetap ada di
 *     antrean dan dipakai OTOMATIS pada saat pendaftaran (server yang membaca
 *     antrean, bukan browser), lalu ditandai `diterapkanPada` supaya tidak
 *     dapat dipakai dua kali.
 */

/** Entri persetujuan "disetujui" yang masih boleh dipakai untuk username ini. */
export async function persetujuanSiapDipakai(usernameMentah) {
  const diperiksa = periksaUsername(usernameMentah);
  if (!diperiksa.sah) return null;
  const arr = await repoPengajuan.baca().catch(() => []);
  const kandidat = (Array.isArray(arr) ? arr : []).filter(
    (p) => p?.username === diperiksa.username && p?.status === "disetujui" && !p?.diterapkanPada
  );
  if (!kandidat.length) return null;
  return kandidat.reduce((a, b) =>
    String(b.diperiksaPada || "") > String(a.diperiksaPada || "") ? b : a
  );
}

/** Tandai persetujuan sudah diterapkan, agar tidak dipakai ulang diam-diam. */
export async function catatPersetujuanDiterapkan(id, cara = "pendaftaran") {
  if (!id) return false;
  const diterapkan = await repoPengajuan
    .ubah((daftar) => {
      const arr = Array.isArray(daftar) ? daftar : [];
      const target = arr.find((p) => p?.id === id);
      if (!target) return { hasil: false };
      return {
        data: arr.map((p) =>
          p.id === id
            ? { ...p, diterapkanPada: new Date().toISOString(), diterapkanCara: cara }
            : p
        ),
        hasil: true,
      };
    })
    .catch(() => false);
  if (diterapkan) {
    await catatJejak("pengajuan-verifikasi-diterapkan", { id, cara }).catch(() => {});
  }
  return diterapkan;
}

/**
 * Pengurus menyetujui pengajuan manual. Persetujuan ini adalah satu-satunya
 * titik di jalur manual yang mengubah status anggota; nama pengurus tercatat
 * di berkas antrean + jejak audit.
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

/**
 * Statistik untuk dasbor pengurus. `tantanganPenyimpanan` melaporkan APAKAH
 * tantangan benar-benar terlihat oleh instance lain: hanya bila lapisan
 * penyimpanan bersama (Supabase `kci_storage`) terpasang. Tanpa itu berkas
 * berada di direktori data instance (`/tmp` di Vercel) dan tantangan bisa
 * hilang saat cold start — gagal dengan pesan yang bisa ditindaklanjuti,
 * bukan lolos verifikasi.
 */
export async function statistikTantangan() {
  let aktif = 0;
  try {
    aktif = Object.keys(buangKedaluwarsa(await repoTantangan.baca())).length;
  } catch {
    /* penyimpanan bermasalah -> laporkan 0, jangan gagalkan dasbor */
  }
  let penyimpanan = "berkas-per-instance";
  try {
    penyimpanan = (await supabaseSiap()) ? "penyimpanan-bersama" : "berkas-per-instance";
  } catch {
    /* sama: jangan gagalkan dasbor */
  }
  return { tantanganAktif: aktif, tantanganPenyimpanan: penyimpanan };
}
