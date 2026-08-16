/**
 * Logika keanggotaan: pendaftaran, verifikasi, dan daftar larangan.
 *
 * Aturan identitas (normalisasi + hash) sengaja diimpor dari modul yang
 * sama dengan yang dipakai situs, agar sisi server dan sisi klien tidak
 * pernah berbeda perilaku.
 */
import { konfigurasi } from "./konfigurasi.js";
import { buatRepo, tambahBaris } from "./simpanan.js";
import { ambilProfil, ambilStatistik, ringkasRating, hapusCache } from "./chess.js";
import { pakaiTiket } from "./oauth.js";
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
  normalisasiTanggal,
  hitungUmur,
  kategoriUmur,
} from "../../src/lib/identitas.js";

const repoAnggota = buatRepo(konfigurasi.berkasAnggota, []);
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

/* --------------------------------------------------------------- audit */

async function catatJejak(peristiwa, rincian) {
  try {
    await tambahBaris(konfigurasi.berkasJejak, {
      waktu: new Date().toISOString(),
      peristiwa,
      ...rincian,
    });
  } catch {
    /* jejak audit tidak boleh menggagalkan permintaan utama */
  }
}

/* ------------------------------------------------------------ validasi */

export function validasiPendaftaran(body) {
  const galat = {};

  const username = normalisasiUsername(body.username);
  if (!username) galat.username = "Username Chess.com wajib diisi.";
  else if (!/^[a-z0-9_-]{3,25}$/.test(username))
    galat.username = "Format username Chess.com tidak valid.";

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

  const lahir = normalisasiTanggal(body.tanggalLahir);
  if (!lahir) galat.tanggalLahir = "Tanggal lahir wajib diisi.";
  else {
    const umur = hitungUmur(lahir);
    if (umur == null || umur < 5 || umur > 100)
      galat.tanggalLahir = "Tanggal lahir tidak masuk akal.";
  }

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
      tanggalLahir: lahir,
      email,
      klub,
    },
  };
}

/* ---------------------------------------------------------- pengayaan */

/** Lengkapi data anggota dengan profil & rating terkini dari Chess.com. */
export async function lengkapiAnggota(anggota) {
  const { username } = anggota;
  try {
    const [pRes, sRes] = await Promise.all([
      ambilProfil(username),
      ambilStatistik(username).catch(() => ({ ada: false, data: null })),
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

/** Buang field sensitif sebelum dikirim ke klien. */
function tanpaRahasia(anggota) {
  const { identitas, ...aman } = anggota;
  return aman;
}

/* ------------------------------------------------------------- layanan */

export async function daftarAnggota() {
  const dasar = await repoAnggota.baca();
  const lengkap = await Promise.all(
    dasar.map((a) => lengkapiAnggota(tanpaRahasia(a)))
  );
  lengkap.sort((a, b) => (b.elo || 0) - (a.elo || 0));
  return lengkap;
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

  /* Bukti kepemilikan akun Chess.com.
     Tiket diterbitkan setelah pendaftar login lewat OAuth Chess.com, atau
     setelah ia membuktikan menguasai profil lewat kode verifikasi. */
  const mode = konfigurasi.wajibVerifikasi;
  let caraVerifikasi = null;

  if (mode !== "off") {
    const tiket = body.tiketVerifikasi;
    if (tiket) {
      const sah = pakaiTiket(tiket, bersih.username);
      if (!sah) {
        throw new GalatAplikasi(
          403,
          "Bukti kepemilikan akun tidak sah atau sudah kedaluwarsa. " +
            "Silakan verifikasi ulang akun Chess.com Anda.",
          { galat: { username: "Verifikasi akun kedaluwarsa." } }
        );
      }
      caraVerifikasi = sah.cara;
    } else if (mode === "wajib") {
      throw new GalatAplikasi(
        403,
        "Anda harus membuktikan kepemilikan akun Chess.com sebelum mendaftar.",
        { perluVerifikasi: true }
      );
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

  /* 1. Username ada di daftar hitam? */
  const kenaUsername = hitam.find((h) => h.username === bersih.username);
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
    throw new GalatAplikasi(
      502,
      "Chess.com sedang tidak dapat dihubungi. Coba beberapa saat lagi.",
      { sebab: e.message }
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

  const uname = (profil.username || bersih.username).toLowerCase();

  /* 5. Simpan — pengecekan duplikat dilakukan DI DALAM antrean agar
        dua permintaan bersamaan tidak lolos berdua. */
  const baru = await repoAnggota.ubah(async (daftar) => {
    if (daftar.some((a) => a.username === uname)) {
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

    const entri = {
      username: uname,
      playerId: profil.player_id ?? null,
      panggilan: bersih.panggilan,
      kota: bersih.kota,
      kotaKunci: normalisasiKota(bersih.kota),
      klub: bersih.klub || null,
      kategoriUmur: kategoriUmur(bersih.tanggalLahir),
      terverifikasi: Boolean(caraVerifikasi),
      caraVerifikasi,
      identitas,
      sidikPepper: sidikPepper(),
      statusChess: profil.status || null,
      daftarPada: new Date().toISOString(),
    };
    return { data: [...daftar, entri], hasil: entri };
  });

  /* 6. Data pribadi disimpan terpisah dari berkas publik */
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

  await catatJejak("daftar-berhasil", { username: uname, ip: konteks.ip });
  // Hapus cache Chess.com agar data baru diambil pada request berikutnya
  hapusCache(uname);
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

/** Blokir anggota yang sudah terdaftar, sekaligus keluarkan dari keanggotaan. */
export async function blokirAnggota(username, keterangan) {
  const uname = normalisasiUsername(username);
  const anggota = await repoAnggota.baca();
  const target = anggota.find((a) => a.username === uname);
  if (!target) {
    throw new GalatAplikasi(404, `"${uname}" tidak ada di daftar anggota.`);
  }

  const entri = await blokir({
    username: target.username,
    playerId: target.playerId ?? null,
    identitas: target.identitas || {},
    alasan: "keputusan_pengurus",
    keterangan: keterangan || "Diblokir berdasarkan keputusan pengurus.",
    sumber: "pengurus",
  });

  await repoAnggota.ubah(async (daftar) => ({
    data: daftar.filter((a) => a.username !== uname),
    hasil: null,
  }));

  await catatJejak("blokir-manual", { username: uname, keterangan });
  // Hapus cache Chess.com agar data terbaru diambil
  hapusCache(uname);
  return entri;
}

/** Cabut larangan. */
export async function bukaBlokir(username) {
  const uname = normalisasiUsername(username);
  const dicabut = await repoHitam.ubah(async (hitam) => {
    const sisa = hitam.filter((h) => h.username !== uname);
    if (sisa.length === hitam.length) {
      throw new GalatAplikasi(404, `"${uname}" tidak ada di daftar hitam.`);
    }
    return { data: sisa, hasil: true };
  });
  await catatJejak("buka-blokir", { username: uname });
  return dicabut;
}

/**
 * Pindai seluruh anggota ke Chess.com; yang kena ban fair play otomatis
 * dipindahkan ke daftar hitam.
 */
export async function pindaiFairPlay() {
  const anggota = await repoAnggota.baca();
  const hasil = {
    diperiksa: 0,
    diblokir: [],
    ditutup: [],
    hilang: [],
    gagal: [],
  };
  const tersisa = [];

  for (const a of anggota) {
    hasil.diperiksa += 1;
    try {
      const pRes = await ambilProfil(a.username, { pakaiCache: false });
      if (!pRes.ada) {
        hasil.hilang.push(a.username);
        tersisa.push(a);
        continue;
      }
      const profil = pRes.data;
      const st = evaluasiStatusChess(profil.status);

      if (st.diblokir) {
        await blokir({
          username: a.username,
          playerId: profil.player_id ?? a.playerId ?? null,
          identitas: a.identitas || {},
          alasan: st.alasan,
          keterangan: st.keterangan,
          sumber: "otomatis",
        });
        hasil.diblokir.push(a.username);
        continue; // tidak dikembalikan ke daftar anggota
      }

      if (st.ditutup) hasil.ditutup.push(a.username);
      tersisa.push({
        ...a,
        statusChess: profil.status || null,
        playerId: profil.player_id ?? a.playerId ?? null,
      });
    } catch (e) {
      hasil.gagal.push({ username: a.username, sebab: e.message });
      tersisa.push(a);
    }
  }

  await repoAnggota.tulis(tersisa);
  hasil.selesaiPada = new Date().toISOString();
  await catatJejak("pindai-fairplay", {
    diperiksa: hasil.diperiksa,
    diblokir: hasil.diblokir.length,
  });
  // Hapus cache untuk anggota yang di-scan agar data terbaru diambil
  for (const a of tersisa) hapusCache(a.username);
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
  const [anggota, hitam] = await Promise.all([
    repoAnggota.baca(),
    repoHitam.baca(),
  ]);
  return {
    anggota: anggota.length,
    daftarHitam: hitam.length,
    otomatis: hitam.filter((h) => h.sumber === "otomatis").length,
    pengurus: hitam.filter((h) => h.sumber === "pengurus").length,
    sidikPepper: sidikPepper(),
  };
}

export { repoAnggota, repoHitam, repoKontak };
