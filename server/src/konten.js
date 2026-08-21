/**
 * Mesin konten komunitas — berita dan pengumuman.
 *
 * Berita dan pengumuman adalah dua jenis konten yang hampir sama bentuknya
 * (judul, isi, tanggal), disimpan di berkas terpisah agar riwayatnya rapi.
 * Satu-satunya perbedaan: berita juga punya ringkasan (cuplikan pendek).
 * Karena itu kedua mesin dibuat dari satu pabrik (mesinKonten) dengan
 * satu konfigurasi kecil per jenis.
 *
 * Keduanya punya status "draf"/"publik". Konten berstatus "publik" yang
 * tampil di situs; "draf" hanya terlihat dari dashboard pengurus sehingga
 * pengurus bisa menyiapkan tulisan lebih dulu sebelum dipublikasikan.
 */
import crypto from "node:crypto";
import { konfigurasi } from "./konfigurasi.js";
import { buatRepo } from "./simpanan.js";
import { GalatAplikasi } from "./keanggotaan.js";

/* ------------------------------------------------------------ bantuan */

const kiniIso = () => new Date().toISOString();
/**
 * Tanggal "hari ini" dalam zona waktu komunitas (Asia/Jakarta, UTC+7).
 * toISOString().slice(0,10) memakai UTC — konten yang dibuat jam 00:30 WIB
 * bisa tertulis sehari sebelumnya. "en-CA" menghasilkan format YYYY-MM-DD.
 */
const hariIni = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

/** Tanggal konten baku YYYY-MM-DD (tanpa waktu), atau false bila tidak sah. */
function tanggalSah(v) {
  const s = String(v || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : false;
}

function buatId(kunci) {
  const acak = crypto.randomBytes(3).toString("hex");
  return `${kunci}-${Date.now().toString(36)}-${acak}`;
}

function statusBoleh(s) {
  return s === "publik" ? "publik" : s === "draf" ? "draf" : undefined;
}

/**
 * Gambar boleh berupa URL HTTPS atau data URL gambar hasil kompresi dashboard.
 * Skema lain (javascript:, file:, data:text/html) ditolak agar nilai ini aman
 * dipasang langsung pada atribut src di halaman publik.
 */
function gambarAman(nilai) {
  const gambar = String(nilai || "").trim();
  if (!gambar) return "";
  if (/^https:\/\/[^\s]+$/i.test(gambar) && gambar.length <= 2048) return gambar;
  if (
    /^data:image\/(?:jpeg|png|webp|gif);base64,[a-z0-9+/=\r\n]+$/i.test(gambar) &&
    gambar.length <= 1_900_000
  ) {
    return gambar;
  }
  throw new GalatAplikasi(
    400,
    "Gambar harus berupa JPG, PNG, WebP, GIF, atau URL HTTPS yang sah."
  );
}

/* ----------------------------------------------------------- pabrik */

/**
 * Satu mesin CRUD untuk satu jenis konten.
 * @param {object} opsi
 * @param {string} opsi.kunci      - awalan id ("berita" / "pengumuman")
 * @param {string} opsi.namaFile   - nama berkas JSON di dirData
 * @param {string} opsi.label      - label untuk pesan galat
 * @param {boolean} opsi.punyaRingkasan - berita memakai ringkasan
 */
function mesinKonten({ kunci, namaFile, label, punyaRingkasan }) {
  const repo = buatRepo(`${konfigurasi.dirData}/${namaFile}.json`, []);

  /** Buang data internal yang tidak perlu dilihat siapa pun. */
  function untukPublik(x) {
    return {
      id: x.id,
      judul: x.judul,
      ...(punyaRingkasan ? { ringkasan: x.ringkasan || "" } : {}),
      isi: x.isi,
      gambar: x.gambar || "",
      altGambar: x.altGambar || x.judul,
      tanggal: x.tanggal,
      status: x.status,
    };
  }

  /** Daftar, boleh disaring per status; terbaru lebih dulu. */
  async function daftar({ status } = {}) {
    const semua = await repo.baca();
    return semua
      .filter((x) => !status || x.status === status)
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)));
  }

  async function ambil(id) {
    const x = (await repo.baca()).find((e) => e.id === id);
    if (!x) throw new GalatAplikasi(404, `${label} tidak ditemukan.`);
    return x;
  }

  async function buat(data) {
    if (!String(data.judul || "").trim()) {
      throw new GalatAplikasi(400, "Judul wajib diisi.");
    }
    if (!String(data.isi || "").trim()) {
      throw new GalatAplikasi(400, "Isi wajib diisi.");
    }
    const item = {
      id: buatId(kunci),
      judul: String(data.judul).trim(),
      ...(punyaRingkasan
        ? { ringkasan: String(data.ringkasan || "").trim() }
        : {}),
      isi: String(data.isi).trim(),
      gambar: gambarAman(data.gambar),
      altGambar: String(data.altGambar || data.judul).trim().slice(0, 180),
      tanggal: tanggalSah(data.tanggal) || hariIni(),
      status: statusBoleh(data.status) || "publik",
      dibuatPada: kiniIso(),
    };
    return repo.ubah((daftar) => {
      daftar.unshift(item);
      return { data: daftar, hasil: item };
    });
  }

  async function ubah(id, data) {
    return repo.ubah(async (daftar) => {
      const entri = daftar.find((e) => e.id === id);
      if (!entri) throw new GalatAplikasi(404, `${label} tidak ditemukan.`);
      if (data.judul !== undefined) entri.judul = String(data.judul).trim();
      if (punyaRingkasan && data.ringkasan !== undefined) {
        entri.ringkasan = String(data.ringkasan).trim();
      }
      if (data.isi !== undefined) entri.isi = String(data.isi).trim();
      if (data.gambar !== undefined) entri.gambar = gambarAman(data.gambar);
      if (data.altGambar !== undefined) {
        entri.altGambar = String(data.altGambar || entri.judul).trim().slice(0, 180);
      }
      if (data.tanggal !== undefined) {
        const t = tanggalSah(data.tanggal);
        if (!t) throw new GalatAplikasi(400, "Format tanggal harus YYYY-MM-DD.");
        entri.tanggal = t;
      }
      if (data.status !== undefined) {
        const s = statusBoleh(data.status);
        if (!s) throw new GalatAplikasi(400, "Status tidak dikenal.");
        entri.status = s;
      }
      return { data: daftar, hasil: entri };
    });
  }

  async function hapus(id) {
    await repo.ubah((daftar) => {
      const tersisa = daftar.filter((e) => e.id !== id);
      if (tersisa.length === daftar.length) {
        throw new GalatAplikasi(404, `${label} tidak ditemukan.`);
      }
      return { data: tersisa, hasil: true };
    });
  }

  async function jumlah() {
    return (await repo.baca()).length;
  }

  return { untukPublik, daftar, ambil, buat, ubah, hapus, jumlah };
}

/* -------------------------------------------------------------- mesin */

export const berita = mesinKonten({
  kunci: "berita",
  namaFile: "berita",
  label: "Berita",
  punyaRingkasan: true,
});

export const pengumuman = mesinKonten({
  kunci: "pengumuman",
  namaFile: "pengumuman",
  label: "Pengumuman",
  punyaRingkasan: false,
});

/* --------------------------------------------------------- ringkasan */

export async function ringkasanKonten() {
  const [jumlahBerita, jumlahPengumuman] = await Promise.all([
    berita.jumlah(),
    pengumuman.jumlah(),
  ]);
  return {
    berita: jumlahBerita,
    beritaPublik: (await berita.daftar({ status: "publik" })).length,
    pengumuman: jumlahPengumuman,
    pengumumanPublik: (await pengumuman.daftar({ status: "publik" })).length,
  };
}
