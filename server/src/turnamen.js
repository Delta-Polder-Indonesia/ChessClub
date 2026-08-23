/**
 * Mesin turnamen — satu model data untuk empat jenis kompetisi.
 *
 * Keempat halaman turnamen di situs (Bulanan, Liga Musiman, Terbuka,
 * Liga Antar Komunitas) sebenarnya format berbeda dari hal yang sama:
 * sekumpulan peserta, sejumlah ronde, dan sebuah klasemen. Yang berbeda
 * hanya ATURANNYA, dan itu cukup disimpan sebagai data.
 *
 * Yang menyambungkan modul ini dengan sistem keanggotaan:
 *   - Pendaftaran turnamen menolak pemain di daftar hitam.
 *   - Setelah turnamen, peserta dapat dipindai ulang; siapa pun yang
 *     ternyata kena ban fair play hasilnya bisa dianulir.
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";
import { buatRepo } from "./simpanan.js";
import { ambilProfil } from "./chess.js";
import { daftarAnggotaKlub } from "./klub.js";
import { evaluasiStatusChess, cariDiDaftarHitam } from "./identitas-server.js";
import { normalisasiUsername } from "../../src/lib/identitas.js";
import { GalatAplikasi, repoAnggota, repoHitam, blokir } from "./keanggotaan.js";

const repoTurnamen = buatRepo(
  `${konfigurasi.dirData}/turnamen.json`,
  []
);

/* ------------------------------------------------------------- jenis */

/** Sifat bawaan tiap jenis turnamen. */
export const JENIS = {
  bulanan: {
    label: "Turnamen Bulanan",
    slug: "turnamen-bulanan",
    sistem: "swiss",
    rondeBawaan: 5,
    tempoBawaan: "15+10",
    bolehNonAnggota: false,
    beregu: false,
    klasemenBerjalan: false,
  },
  musiman: {
    label: "Liga Musiman",
    slug: "liga-musiman",
    sistem: "liga",
    rondeBawaan: 0, // berjalan terus
    tempoBawaan: "15+10",
    bolehNonAnggota: false,
    beregu: false,
    klasemenBerjalan: true,
    minPartai: 6,
  },
  terbuka: {
    label: "Turnamen Terbuka",
    slug: "turnamen-terbuka",
    sistem: "swiss",
    rondeBawaan: 7,
    tempoBawaan: "25+10",
    bolehNonAnggota: true,
    beregu: false,
    klasemenBerjalan: false,
  },
  "antar-komunitas": {
    label: "Liga Antar Komunitas",
    slug: "liga-antar-komunitas",
    sistem: "beregu",
    rondeBawaan: 0,
    tempoBawaan: "15+10",
    bolehNonAnggota: true,
    beregu: true,
    klasemenBerjalan: true,
  },
};

export const STATUS = ["draf", "pendaftaran", "berlangsung", "selesai", "batal"];

/* ------------------------------------------------------------ bantuan */

const kiniIso = () => new Date().toISOString();

function buatId(jenis) {
  const acak = crypto.randomBytes(3).toString("hex");
  return `${jenis}-${Date.now().toString(36)}-${acak}`;
}

function bikinSlug(teks) {
  return String(teks || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Buang data yang tidak perlu dilihat publik. */
export function untukPublik(t) {
  return {
    id: t.id,
    jenis: t.jenis,
    nama: t.nama,
    slug: t.slug,
    status: t.status,
    deskripsi: t.deskripsi,
    mulai: t.mulai,
    selesai: t.selesai,
    tutupDaftar: t.tutupDaftar,
    tempo: t.tempo,
    sistem: t.sistem,
    ronde: t.ronde,
    kuota: t.kuota,
    biaya: t.biaya,
    hadiah: t.hadiah,
    tempat: t.tempat,
    tautan: t.tautan,
    juara: t.juara || null,
    jumlahPeserta: (t.peserta || []).length,
    peserta: (t.peserta || []).map((p) => ({
      username: p.username,
      panggilan: p.panggilan,
      tim: p.tim || null,
      anggota: p.anggota !== false,
      dianulir: Boolean(p.dianulir),
    })),
    klasemen: hitungKlasemen(t),
    dibuatPada: t.dibuatPada,
  };
}

export async function rincianUntukPengurus(idAtauSlug) {
  const t = await ambilTurnamen(idAtauSlug);
  const anggota = await repoAnggota.baca();
  const eloPerUsername = new Map(anggota.map((a) => [a.username, a.elo]));
  const dasar = untukPublik(t);
  return {
    ...dasar,
    klasemenTim: klasemenTim(t),
    hasil: t.hasil || [],
    pengajuan: t.pengajuan || [],
    peserta: dasar.peserta.map((p) => ({
      ...p,
      rating: eloPerUsername.get(p.username) ?? null,
    })),
    klasemen: dasar.klasemen.map((k) => ({
      ...k,
      rating: eloPerUsername.get(k.username) ?? null,
    })),
  };
}

/* --------------------------------------------------------- klasemen */

/**
 * Hitung klasemen dari daftar hasil partai.
 * Tie-break: 1) poin, 2) Sonneborn-Berger, 3) pertemuan langsung, 4) menang.
 */
export function hitungKlasemen(t) {
  const peserta = (t.peserta || []).filter((p) => !p.dianulir);
  if (!peserta.length) return [];

  const meja = new Map();
  for (const p of peserta) {
    meja.set(p.username, {
      username: p.username,
      panggilan: p.panggilan || p.username,
      tim: p.tim || null,
      main: 0,
      menang: 0,
      remis: 0,
      kalah: 0,
      poin: 0,
      sb: 0,
      lawan: [],
    });
  }

  const hasilSah = (t.hasil || []).filter(
    (h) => meja.has(h.putih) && meja.has(h.hitam)
  );

  for (const h of hasilSah) {
    const p = meja.get(h.putih);
    const hi = meja.get(h.hitam);
    p.main += 1;
    hi.main += 1;
    p.lawan.push(h.hitam);
    hi.lawan.push(h.putih);

    if (h.skor === "1-0") {
      p.menang += 1;
      p.poin += 1;
      hi.kalah += 1;
    } else if (h.skor === "0-1") {
      hi.menang += 1;
      hi.poin += 1;
      p.kalah += 1;
    } else {
      p.remis += 1;
      hi.remis += 1;
      p.poin += 0.5;
      hi.poin += 0.5;
    }
  }

  // Sonneborn-Berger: jumlah poin lawan yang dikalahkan + separuh poin lawan remis.
  for (const baris of meja.values()) {
    let sb = 0;
    for (const h of hasilSah) {
      if (h.putih === baris.username) {
        const l = meja.get(h.hitam);
        if (h.skor === "1-0") sb += l.poin;
        else if (h.skor === "0.5-0.5") sb += l.poin / 2;
      } else if (h.hitam === baris.username) {
        const l = meja.get(h.putih);
        if (h.skor === "0-1") sb += l.poin;
        else if (h.skor === "0.5-0.5") sb += l.poin / 2;
      }
    }
    baris.sb = Math.round(sb * 100) / 100;
  }

  const daftar = [...meja.values()];
  const minPartai = JENIS[t.jenis]?.minPartai ?? 0;

  daftar.sort((a, b) => {
    // Yang belum memenuhi minimal partai turun ke bawah (liga musiman).
    if (minPartai) {
      const aKurang = a.main < minPartai;
      const bKurang = b.main < minPartai;
      if (aKurang !== bKurang) return aKurang ? 1 : -1;
    }
    if (b.poin !== a.poin) return b.poin - a.poin;
    if (b.sb !== a.sb) return b.sb - a.sb;
    if (b.menang !== a.menang) return b.menang - a.menang;
    return a.panggilan.localeCompare(b.panggilan);
  });

  return daftar.map((b, i) => ({
    peringkat: i + 1,
    ...b,
    resmi: minPartai ? b.main >= minPartai : true,
    lawan: undefined,
  }));
}

/** Klasemen beregu — menjumlahkan poin pemain per tim. */
export function klasemenTim(t) {
  if (!JENIS[t.jenis]?.beregu) return [];
  const perorangan = hitungKlasemen(t);
  const tim = new Map();
  for (const p of perorangan) {
    if (!p.tim) continue;
    const data = tim.get(p.tim) || { tim: p.tim, poin: 0, pemain: 0, main: 0 };
    data.poin += p.poin;
    data.pemain += 1;
    data.main += p.main;
    tim.set(p.tim, data);
  }
  return [...tim.values()]
    .sort((a, b) => b.poin - a.poin)
    .map((x, i) => ({ peringkat: i + 1, ...x }));
}

/* ------------------------------------------------------------ CRUD */

export async function daftarTurnamen({ jenis, status } = {}) {
  const semua = await repoTurnamen.baca();
  return semua
    .filter((t) => (jenis ? t.jenis === jenis : true))
    .filter((t) => (status ? t.status === status : true))
    .sort((a, b) => String(b.mulai || "").localeCompare(String(a.mulai || "")));
}

export async function ambilTurnamen(idAtauSlug) {
  const semua = await repoTurnamen.baca();
  const t = semua.find((x) => x.id === idAtauSlug || x.slug === idAtauSlug);
  if (!t) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
  return t;
}

function validasiTurnamen(data, { baru = false } = {}) {
  const galat = {};
  if (baru) {
    if (!JENIS[data.jenis]) {
      // Kategori tulisan bebas tetap diterima agar hasil turnamen ad-hoc
      // (mis. "Turnamen Sekolah") bisa diarsipkan lewat panel Juara.
      const bebas = String(data.jenis || "").trim();
      if (!bebas) galat.jenis = "Kategori wajib dipilih atau ditulis.";
      else if (bebas.length > 60)
        galat.jenis = "Kategori terlalu panjang (maksimal 60 karakter).";
    }
  }
  if (data.nama !== undefined) {
    const nama = String(data.nama || "").trim();
    if (!nama) galat.nama = "Nama turnamen wajib diisi.";
    else if (nama.length > 100) galat.nama = "Nama terlalu panjang.";
  }
  if (data.status !== undefined && !STATUS.includes(data.status)) {
    galat.status = `Status harus salah satu dari: ${STATUS.join(", ")}.`;
  }
  if (data.ronde !== undefined && data.ronde !== null) {
    const r = Number(data.ronde);
    if (!Number.isInteger(r) || r < 0 || r > 30)
      galat.ronde = "Jumlah ronde tidak masuk akal.";
  }
  if (data.kuota !== undefined && data.kuota !== null && data.kuota !== "") {
    const k = Number(data.kuota);
    if (!Number.isInteger(k) || k < 2 || k > 1000)
      galat.kuota = "Kuota peserta tidak masuk akal.";
  }
  for (const f of ["mulai", "selesai", "tutupDaftar"]) {
    const v = data[f];
    if (v && !/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?$/.test(String(v))) {
      galat[f] = "Format tanggal harus YYYY-MM-DD atau YYYY-MM-DD HH:MM.";
    }
  }
  if (data.mulai && data.selesai && String(data.selesai) < String(data.mulai)) {
    galat.selesai = "Tanggal selesai mendahului tanggal mulai.";
  }
  if (data.tautan !== undefined && String(data.tautan || "").trim()) {
    try {
      const u = new URL(String(data.tautan).trim());
      if (u.protocol !== "https:") throw new Error("protokol");
    } catch {
      galat.tautan = "Tautan turnamen harus berupa URL HTTPS lengkap.";
    }
  }
  if (data.juara !== undefined && String(data.juara || "").trim().length > 100) {
    galat.juara = "Nama juara terlalu panjang (maksimal 100 karakter).";
  }
  return galat;
}

export async function buatTurnamen(data) {
  const galat = validasiTurnamen(data, { baru: true });
  if (Object.keys(galat).length) {
    throw new GalatAplikasi(400, "Periksa kembali isian turnamen.", { galat });
  }

  const baku = Boolean(JENIS[data.jenis]);
  const sifat = JENIS[data.jenis] || {
    sistem: "swiss",
    rondeBawaan: 0,
    tempoBawaan: "15+10",
  };
  // Kategori resmi memakai kunci bawaan; kategori bebas disimpan apa adanya
  // agar tampil rapi, sementara ID memakai versi slug agar aman di URL.
  const jenis = baku ? data.jenis : String(data.jenis).trim();
  const jenisId = baku ? data.jenis : bikinSlug(data.jenis) || "lainnya";
  const nama = String(data.nama).trim();

  return repoTurnamen.ubah(async (semua) => {
    let slug = bikinSlug(data.slug || nama);
    if (semua.some((t) => t.slug === slug)) slug = `${slug}-${semua.length + 1}`;

    const baru = {
      id: buatId(jenisId),
      jenis,
      nama,
      slug,
      status: data.status || "draf",
      deskripsi: String(data.deskripsi || "").trim(),
      mulai: data.mulai || null,
      selesai: data.selesai || null,
      tutupDaftar: data.tutupDaftar || null,
      tempo: data.tempo || sifat.tempoBawaan,
      sistem: data.sistem || sifat.sistem,
      ronde: data.ronde ?? sifat.rondeBawaan,
      kuota: data.kuota ? Number(data.kuota) : null,
      biaya: String(data.biaya || "").trim(),
      hadiah: String(data.hadiah || "").trim(),
      tempat: String(data.tempat || "Daring — Chess.com").trim(),
      tautan: String(data.tautan || "").trim(),
      juara: String(data.juara || "").trim() || null,
      peserta: [],
      hasil: [],
      dibuatPada: kiniIso(),
      diubahPada: kiniIso(),
    };
    return { data: [...semua, baru], hasil: baru };
  });
}

export async function ubahTurnamen(id, perubahan) {
  const galat = validasiTurnamen(perubahan);
  if (Object.keys(galat).length) {
    throw new GalatAplikasi(400, "Periksa kembali isian turnamen.", { galat });
  }
  const bolehUbah = [
    "nama", "status", "deskripsi", "mulai", "selesai", "tutupDaftar",
    "tempo", "sistem", "ronde", "kuota", "biaya", "hadiah", "tempat", "tautan",
    "juara",
  ];
  return repoTurnamen.ubah(async (semua) => {
    const i = semua.findIndex((t) => t.id === id);
    if (i === -1) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    const ubah = { ...semua[i] };
    for (const k of bolehUbah) {
      if (perubahan[k] !== undefined) ubah[k] = perubahan[k];
    }
    if (perubahan.tautan !== undefined) {
      ubah.tautan = String(perubahan.tautan || "").trim();
    }
    if (perubahan.juara !== undefined) {
      ubah.juara = String(perubahan.juara || "").trim() || null;
    }
    if (perubahan.kuota !== undefined) {
      ubah.kuota = perubahan.kuota ? Number(perubahan.kuota) : null;
    }
    ubah.diubahPada = kiniIso();
    const salinan = [...semua];
    salinan[i] = ubah;
    return { data: salinan, hasil: ubah };
  });
}

export async function hapusTurnamen(id) {
  return repoTurnamen.ubah(async (semua) => {
    const sisa = semua.filter((t) => t.id !== id);
    if (sisa.length === semua.length) {
      throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    }
    return { data: sisa, hasil: true };
  });
}

/* ------------------------------------------------------ pengajuan peserta */

/**
 * Player mengajukan diri dari halaman publik. Pengajuan belum menjadikannya
 * peserta; pengurus tetap harus meninjau dan menerima terlebih dahulu.
 */
export async function ajukanKeikutsertaan(id, { username }) {
  const uname = normalisasiUsername(username);
  if (!uname) throw new GalatAplikasi(400, "Username Chess.com wajib diisi.");

  const t = await ambilTurnamen(id);
  if (t.status !== "pendaftaran") {
    throw new GalatAplikasi(409, "Pendaftaran turnamen ini sedang tidak dibuka.");
  }

  const [anggotaKlub, anggotaLokal, hitam, profil] = await Promise.all([
    daftarAnggotaKlub(),
    repoAnggota.baca(),
    repoHitam.baca(),
    ambilProfil(uname, { pakaiCache: false }),
  ]);

  if (!anggotaKlub.some((a) => a.username === uname)) {
    const namaKlub = konfigurasi.chess.klub.slug.replace(/-/g, " ").toUpperCase();
    throw new GalatAplikasi(
      403,
      `"${uname}" belum terdaftar sebagai anggota ${namaKlub}. Bergabunglah ke klub dan lengkapi data diri di website terlebih dahulu.`,
      { harusDaftarAnggota: true }
    );
  }
  const rekamLokal = anggotaLokal.find((a) => a.username === uname);
  if (!rekamLokal) {
    throw new GalatAplikasi(
      403,
      `"${uname}" sudah ada di roster Chess.com, tetapi belum melengkapi data diri di website komunitas.`,
      { harusDaftarAnggota: true, dataSitusBelumLengkap: true }
    );
  }
  if (!profil.ada) throw new GalatAplikasi(404, `Akun Chess.com "${uname}" tidak ditemukan.`);

  const laranganUsername = hitam.find((h) => h.username === uname);
  const laranganIdentitas = rekamLokal?.identitas
    ? cariDiDaftarHitam(rekamLokal.identitas, hitam)
    : null;
  if (laranganUsername || laranganIdentitas) {
    throw new GalatAplikasi(
      403,
      "Pengajuan ditolak karena akun atau identitas terhubung dengan daftar larangan komunitas.",
      { diblokir: true }
    );
  }

  const kondisi = evaluasiStatusChess(profil.data.status);
  if (kondisi.diblokir) {
    throw new GalatAplikasi(403, kondisi.keterangan, {
      diblokir: true,
      alasan: kondisi.alasan,
    });
  }

  return repoTurnamen.ubah(async (semua) => {
    const indeks = semua.findIndex((x) => x.id === id);
    if (indeks === -1) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    const turnamen = { ...semua[indeks] };
    if (turnamen.status !== "pendaftaran") {
      throw new GalatAplikasi(409, "Pendaftaran turnamen ini sudah ditutup.");
    }
    if ((turnamen.peserta || []).some((p) => p.username === uname)) {
      throw new GalatAplikasi(409, `"${uname}" sudah menjadi peserta turnamen ini.`);
    }
    const lama = (turnamen.pengajuan || []).find((p) => p.username === uname);
    if (lama?.status === "menunggu") {
      throw new GalatAplikasi(409, "Pengajuan Anda masih menunggu keputusan pengurus.");
    }
    if (lama?.status === "diterima") {
      throw new GalatAplikasi(409, "Pengajuan Anda sudah diterima.");
    }

    const pengajuan = {
      username: uname,
      panggilan: rekamLokal?.panggilan || profil.data.name || uname,
      status: "menunggu",
      diajukanPada: kiniIso(),
      akunDibuatPada: profil.data.joined
        ? new Date(Number(profil.data.joined) * 1000).toISOString()
        : null,
      statusChess: profil.data.status || "premium",
      url: `https://www.chess.com/member/${encodeURIComponent(uname)}`,
    };
    turnamen.pengajuan = [
      ...(turnamen.pengajuan || []).filter((p) => p.username !== uname),
      pengajuan,
    ];
    turnamen.diubahPada = kiniIso();
    const salinan = [...semua];
    salinan[indeks] = turnamen;
    return { data: salinan, hasil: pengajuan };
  });
}

/** Terima pengajuan: pemeriksaan roster/larangan diulang oleh daftarkanPeserta. */
export async function terimaPengajuan(id, username) {
  const uname = normalisasiUsername(username);
  const t = await ambilTurnamen(id);
  const pengajuan = (t.pengajuan || []).find(
    (p) => p.username === uname && p.status === "menunggu"
  );
  if (!pengajuan) throw new GalatAplikasi(404, "Pengajuan menunggu tidak ditemukan.");

  await daftarkanPeserta(id, { username: uname });
  return repoTurnamen.ubah(async (semua) => {
    const indeks = semua.findIndex((x) => x.id === id);
    const turnamen = { ...semua[indeks] };
    turnamen.pengajuan = (turnamen.pengajuan || []).map((p) =>
      p.username === uname
        ? { ...p, status: "diterima", diputuskanPada: kiniIso(), alasan: "" }
        : p
    );
    const salinan = [...semua];
    salinan[indeks] = turnamen;
    return {
      data: salinan,
      hasil: turnamen.pengajuan.find((p) => p.username === uname),
    };
  });
}

export async function tolakPengajuan(id, { username, alasan }) {
  const uname = normalisasiUsername(username);
  const alasanRingkas = String(alasan || "")
    .trim()
    .slice(0, 300);
  return repoTurnamen.ubah(async (semua) => {
    const indeks = semua.findIndex((x) => x.id === id);
    if (indeks === -1) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    const turnamen = { ...semua[indeks] };
    const ada = (turnamen.pengajuan || []).some(
      (p) => p.username === uname && p.status === "menunggu"
    );
    if (!ada) throw new GalatAplikasi(404, "Pengajuan menunggu tidak ditemukan.");
    turnamen.pengajuan = turnamen.pengajuan.map((p) =>
      p.username === uname
        ? {
            ...p,
            status: "ditolak",
            diputuskanPada: kiniIso(),
            alasan: alasanRingkas || "Tidak lolos peninjauan pengurus.",
          }
        : p
    );
    turnamen.diubahPada = kiniIso();
    const salinan = [...semua];
    salinan[indeks] = turnamen;
    return {
      data: salinan,
      hasil: turnamen.pengajuan.find((p) => p.username === uname),
    };
  });
}

/* -------------------------------------------------------- peserta */

/**
 * Daftarkan peserta ke turnamen.
 *
 * Inilah sambungan ke sistem anti-curang: pemain di daftar hitam ditolak
 * di sini, bukan hanya saat mendaftar keanggotaan.
 */
export async function daftarkanPeserta(id, { username, tim }) {
  const uname = normalisasiUsername(username);
  if (!uname) throw new GalatAplikasi(400, "Username wajib diisi.");

  const [anggotaLokal, anggotaKlub, hitam] = await Promise.all([
    repoAnggota.baca(),
    daftarAnggotaKlub(),
    repoHitam.baca(),
  ]);

  const terlarang = hitam.find((h) => h.username === uname);
  if (terlarang) {
    throw new GalatAplikasi(
      403,
      `"${uname}" ada dalam daftar larangan komunitas dan tidak dapat mengikuti turnamen.`,
      { alasan: terlarang.alasan, diblokir: true }
    );
  }

  const rekamLokal = anggotaLokal.find((a) => a.username === uname);
  // Status anggota mengikuti roster klub publik yang sama dengan halaman
  // Keanggotaan, bukan hanya siapa yang sudah mengisi formulir lokal.
  const rekamKlub = anggotaKlub.find((a) => a.username === uname);

  let profil;
  try {
    profil = await ambilProfil(uname, { pakaiCache: false });
  } catch (e) {
    if (e?.sementara) {
      throw new GalatAplikasi(
        503,
        "Chess.com sedang tidak bisa dihubungi. Coba lagi sebentar."
      );
    }
    throw new GalatAplikasi(
      404,
      `Akun Chess.com "${uname}" tidak ditemukan. Periksa ejaan username.`
    );
  }

  return repoTurnamen.ubah(async (semua) => {
    const i = semua.findIndex((t) => t.id === id);
    if (i === -1) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    const t = { ...semua[i] };

    if (!["draf", "pendaftaran"].includes(t.status)) {
      throw new GalatAplikasi(
        409,
        `Pendaftaran turnamen ini sudah ditutup (status: ${t.status}).`
      );
    }
    if ((t.peserta || []).some((p) => p.username === uname)) {
      throw new GalatAplikasi(409, `"${uname}" sudah terdaftar di turnamen ini.`);
    }
    if (t.kuota && (t.peserta || []).length >= t.kuota) {
      throw new GalatAplikasi(409, "Kuota peserta sudah penuh.");
    }
    if (!JENIS[t.jenis].bolehNonAnggota && !rekamKlub) {
      throw new GalatAplikasi(
        403,
        `Turnamen ini khusus anggota. "${uname}" belum tercatat di klub Chess.com komunitas.`
      );
    }

    const peserta = {
      username: uname,
      panggilan: rekamLokal?.panggilan || profil.data.name || uname,
      anggota: Boolean(rekamKlub),
      tim: String(tim || "").trim() || null,
      daftarPada: kiniIso(),
    };
    t.peserta = [...(t.peserta || []), peserta];
    t.diubahPada = kiniIso();

    const salinan = [...semua];
    salinan[i] = t;
    return { data: salinan, hasil: peserta };
  });
}

export async function keluarkanPeserta(id, username) {
  const uname = normalisasiUsername(username);
  return repoTurnamen.ubah(async (semua) => {
    const i = semua.findIndex((t) => t.id === id);
    if (i === -1) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    const t = { ...semua[i] };
    const sisa = (t.peserta || []).filter((p) => p.username !== uname);
    if (sisa.length === (t.peserta || []).length) {
      throw new GalatAplikasi(404, `"${uname}" tidak terdaftar di turnamen ini.`);
    }
    t.peserta = sisa;
    t.hasil = (t.hasil || []).filter(
      (h) => h.putih !== uname && h.hitam !== uname
    );
    t.diubahPada = kiniIso();
    const salinan = [...semua];
    salinan[i] = t;
    return { data: salinan, hasil: true };
  });
}

/* ----------------------------------------------------------- hasil */

const SKOR_SAH = ["1-0", "0-1", "0.5-0.5"];

export async function catatHasil(id, { ronde, putih, hitam, skor }) {
  const p = normalisasiUsername(putih);
  const h = normalisasiUsername(hitam);
  const r = Number(ronde) || 1;

  if (!p || !h) throw new GalatAplikasi(400, "Kedua pemain wajib diisi.");
  if (p === h) throw new GalatAplikasi(400, "Pemain tidak bisa melawan dirinya sendiri.");
  if (!SKOR_SAH.includes(skor)) {
    throw new GalatAplikasi(400, `Skor harus salah satu dari: ${SKOR_SAH.join(", ")}.`);
  }

  return repoTurnamen.ubah(async (semua) => {
    const i = semua.findIndex((x) => x.id === id);
    if (i === -1) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    const t = { ...semua[i] };
    const daftarPeserta = t.peserta || [];

    for (const u of [p, h]) {
      if (!daftarPeserta.some((x) => x.username === u)) {
        throw new GalatAplikasi(400, `"${u}" bukan peserta turnamen ini.`);
      }
    }

    const sudahAda = (t.hasil || []).some(
      (x) =>
        x.ronde === r &&
        ((x.putih === p && x.hitam === h) || (x.putih === h && x.hitam === p))
    );
    if (sudahAda) {
      throw new GalatAplikasi(
        409,
        `Partai ${p} vs ${h} pada ronde ${r} sudah dicatat.`
      );
    }

    // Satu ronde = satu partai per pemain (aturan Swiss/liga). Tanpa ini
    // seorang peserta bisa bermain dua kali pada ronde yang sama melawan
    // lawan berbeda.
    const sudahMainRondeIni = (t.hasil || []).some(
      (x) =>
        x.ronde === r &&
        (x.putih === p || x.hitam === p || x.putih === h || x.hitam === h)
    );
    if (sudahMainRondeIni) {
      throw new GalatAplikasi(
        409,
        `Salah satu pemain sudah bermain pada ronde ${r}. Satu pemain hanya satu partai per ronde.`
      );
    }

    t.hasil = [
      ...(t.hasil || []),
      { ronde: r, putih: p, hitam: h, skor, dicatatPada: kiniIso() },
    ];
    t.diubahPada = kiniIso();
    const salinan = [...semua];
    salinan[i] = t;
    return { data: salinan, hasil: t.hasil.at(-1) };
  });
}

export async function hapusHasil(id, indeks) {
  return repoTurnamen.ubah(async (semua) => {
    const i = semua.findIndex((x) => x.id === id);
    if (i === -1) throw new GalatAplikasi(404, "Turnamen tidak ditemukan.");
    const t = { ...semua[i] };
    const n = Number(indeks);
    if (!Number.isInteger(n) || n < 0 || n >= (t.hasil || []).length) {
      throw new GalatAplikasi(404, "Data hasil tidak ditemukan.");
    }
    t.hasil = t.hasil.filter((_, idx) => idx !== n);
    t.diubahPada = kiniIso();
    const salinan = [...semua];
    salinan[i] = t;
    return { data: salinan, hasil: true };
  });
}

/* ------------------------------------------------- pindai fair play */

/**
 * Periksa seluruh peserta turnamen ke Chess.com.
 * Peserta yang akunnya ditutup karena pelanggaran fair play akan:
 *   - ditandai `dianulir` (hasilnya tidak dihitung di klasemen)
 *   - dimasukkan ke daftar hitam komunitas
 *
 * Inilah yang menjawab kekhawatiran awal: pemain curang di turnamen
 * tidak hanya kehilangan gelar, tetapi juga tidak bisa kembali.
 */
export async function pindaiPesertaTurnamen(id) {
  const t = await ambilTurnamen(id);
  const anggota = await repoAnggota.baca();
  const laporan = { diperiksa: 0, dianulir: [], aman: 0, gagal: [] };
  const anulir = new Set();

  for (const p of t.peserta || []) {
    laporan.diperiksa += 1;
    try {
      const res = await ambilProfil(p.username, { pakaiCache: false });
      if (!res.ada) {
        laporan.gagal.push({ username: p.username, sebab: "akun tidak ditemukan" });
        continue;
      }
      const st = evaluasiStatusChess(res.data.status);
      if (st.diblokir) {
        anulir.add(p.username);
        laporan.dianulir.push(p.username);
        const rekam = anggota.find((a) => a.username === p.username);
        await blokir({
          username: p.username,
          playerId: res.data.player_id ?? null,
          identitas: rekam?.identitas || {},
          alasan: st.alasan,
          keterangan: `${st.keterangan} Terdeteksi saat pemindaian turnamen "${t.nama}".`,
          sumber: "otomatis",
        });
      } else {
        laporan.aman += 1;
      }
    } catch (e) {
      laporan.gagal.push({ username: p.username, sebab: e.message });
    }
  }

  if (anulir.size) {
    await repoTurnamen.ubah(async (semua) => {
      const i = semua.findIndex((x) => x.id === id);
      if (i === -1) return { data: undefined, hasil: null };
      const turnamen = { ...semua[i] };
      turnamen.peserta = turnamen.peserta.map((p) =>
        anulir.has(p.username)
          ? { ...p, dianulir: true, dianulirPada: kiniIso() }
          : p
      );
      turnamen.diubahPada = kiniIso();
      const salinan = [...semua];
      salinan[i] = turnamen;
      return { data: salinan, hasil: null };
    });
  }

  laporan.selesaiPada = kiniIso();
  return laporan;
}

/* --------------------------------------------------------- ringkasan */

export async function ringkasanTurnamen() {
  const semua = await repoTurnamen.baca();
  const perJenis = {};
  for (const k of Object.keys(JENIS)) {
    perJenis[k] = semua.filter((t) => t.jenis === k).length;
  }
  return {
    total: semua.length,
    perJenis,
    pendaftaran: semua.filter((t) => t.status === "pendaftaran").length,
    berlangsung: semua.filter((t) => t.status === "berlangsung").length,
    selesai: semua.filter((t) => t.status === "selesai").length,
    totalPeserta: semua.reduce((n, t) => n + (t.peserta || []).length, 0),
  };
}

export { repoTurnamen };
