import { ambilCsrfToken } from "./pengurus.js";
import {
  GalatApi,
  fetchApi,
  urlApi,
  bacaJsonRespons,
  galatDariRespons,
} from "./core.js";

/**
 * Konfigurasi cadangan roster yang aman untuk frontend statis. Nilai ini
 * sengaja dapat disamakan dengan KCI_CHESS_KLUB di backend lewat
 * VITE_CHESS_KLUB saat build. Hanya slug Chess.com yang diterima agar URL
 * fallback tidak dapat diarahkan ke host lain oleh konfigurasi yang keliru.
 */
const slugKlubPublik = String(import.meta.env?.VITE_CHESS_KLUB || "blunder-skuad")
  .trim()
  .toLowerCase();
const KLUB_CHESS = /^[a-z0-9][a-z0-9-]{0,99}$/.test(slugKlubPublik)
  ? slugKlubPublik
  : "blunder-skuad";
const API_KLUB_CHESS = `https://api.chess.com/pub/club/${KLUB_CHESS}/members`;
const URL_KLUB_CHESS = `https://www.chess.com/club/${KLUB_CHESS}`;

/**
 * Cadangan untuk development atau deployment frontend statis.
 * Endpoint klub Chess.com sudah berupa data publik dan mendukung CORS, jadi
 * browser dapat mengambil roster tanpa backend. Data rinci seperti rating
 * tetap berasal dari backend saat tersedia; cadangan ini memastikan nama,
 * tanggal bergabung, dan tautan profil anggota tidak menghilang seluruhnya.
 *
 * PENTING (jangan dihapus): ini HANYA roster publik Chess.com, bukan daftar
 * anggota resmi ChessClub. Barisnya ditandai `sumberData: "roster-publik"`
 * dan hasilnya disertai `sumber: "fallback"` agar UI dapat memberi label
 * yang jujur — keanggotaan resmi, hak turnamen, dan leaderboard TIDAK boleh
 * menyimpulkan sesuatu dari data ini.
 */
async function ambilRosterPublikChess() {
  const res = await fetch(API_KLUB_CHESS, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Gagal memuat roster publik Chess.com.");

  const data = await res.json();
  const unik = new Map();
  for (const kategori of ["weekly", "monthly", "all_time"]) {
    const daftar = Array.isArray(data?.[kategori]) ? data[kategori] : [];
    for (const pemain of daftar) {
      const username = String(pemain?.username || "").trim();
      if (!username || unik.has(username.toLowerCase())) continue;
      const joined = Number(pemain.joined);
      unik.set(username.toLowerCase(), {
        username,
        nama: username,
        foto: null,
        daftarPada: Number.isFinite(joined)
          ? new Date(joined * 1000).toISOString()
          : null,
        url: `https://www.chess.com/member/${username.toLowerCase()}`,
        klubChess: KLUB_CHESS,
        urlKlub: URL_KLUB_CHESS,
        sumberAnggota: "chesscom-klub",
        // Tandai asal baris: roster publik bukan catatan resmi komunitas.
        sumberData: "roster-publik",
        // Tanpa backend kita hanya mengetahui roster Chess.com, bukan apakah
        // formulir data diri situs sudah dilengkapi.
        dataSitusLengkap: false,
        ratings: {},
        elo: null,
      });
    }
  }
  return [...unik.values()];
}

/**
 * Daftar anggota + dari mana data itu datang.
 * @returns {Promise<{anggota: Array, sumber: "api"|"fallback",
 *                    diperbaruiPada: string|null, peringatan: string}>}
 */
export async function ambilAnggotaDenganSumber() {
  let peringatan = "";
  try {
    const res = await fetchApi("/api/anggota");
    if (!res.ok) throw new Error(`API anggota menjawab ${res.status}.`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Format API anggota tidak sah.");
    // Backend menjawab dari snapshot: header ini memberitahu seberapa baru.
    const diperbaruiPada = res.headers?.get?.("X-Roster-Diperbarui") || null;
    const segar = res.headers?.get?.("X-Roster-Segar");
    if (segar === "0") {
      peringatan = "snapshot-lama";
    }
    return { anggota: data, sumber: "api", diperbaruiPada, peringatan };
  } catch (galatBackend) {
    try {
      const anggota = await ambilRosterPublikChess();
      return {
        anggota,
        sumber: "fallback",
        diperbaruiPada: null,
        peringatan: "roster-publik",
        sebab: galatBackend?.message || String(galatBackend),
      };
    } catch {
      throw new Error(
        "Daftar anggota belum dapat dimuat dari server maupun Chess.com.",
        { cause: galatBackend }
      );
    }
  }
}

export async function ambilDaftarAnggota() {
  const { anggota } = await ambilAnggotaDenganSumber();
  return anggota;
}

export async function ambilDaftarHitam() {
  const res = await fetch(urlApi("/api/daftar-hitam"));
  if (!res.ok) throw new Error("Gagal memuat daftar larangan.");
  return res.json();
}

/* ---------------------------------------------------- verifikasi akun */

/**
 * POST dengan token CSRF + pemulihan sekali.
 *
 * `sessionStorage` dapat masih menyimpan token lama setelah server
 * di-restart (token CSRF hidup di memori server) -> 403 CSRF. Dalam hal itu
 * token dibuang, diminta ulang, dan permintaan diulang sekali — pola yang
 * sama dipakai modul pengurus/pesan/ebook.
 */
async function kirimDenganCsrf(
  jalur,
  bodi,
  { pesanCadangan = "", metode = "POST", sinyal = undefined } = {}
) {
  const lakukan = async (csrfToken) => {
    const res = await fetchApi(jalur, {
      method: metode,
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: bodi === undefined ? undefined : JSON.stringify(bodi),
      signal: sinyal,
    });
    return { res, hasil: await bacaJsonRespons(res) };
  };

  let csrfToken = await ambilCsrfToken();
  let { res, hasil } = await lakukan(csrfToken);
  /* Penolakan CSRF dipulihkan sekali: pada deployment multi-instance token
     bisa terbit di instance yang berbeda dari tempat POST mendarat. Deteksi
     memakai `kode` dari server; teks pesan hanya cadangan untuk server lama. */
  if (
    res.status === 403 &&
    (hasil?.kode === "token-csrf" || /csrf/i.test(hasil?.pesan || ""))
  ) {
    try {
      sessionStorage.removeItem("kci-csrf-token");
    } catch {
      /* mode privat browser */
    }
    csrfToken = await ambilCsrfToken();
    ({ res, hasil } = await lakukan(csrfToken));
  }

  if (!res.ok) throw galatDariRespons(res, hasil, pesanCadangan);
  return hasil;
}

/** Cara verifikasi yang tersedia + apakah server mewajibkannya. */
export async function ambilCaraVerifikasi() {
  const res = await fetchApi("/api/auth/cara");
  const data = await bacaJsonRespons(res);
  if (!res.ok) throw galatDariRespons(res, data, "Konfigurasi verifikasi tidak dapat dimuat.");
  const mode = ["off", "opsional", "wajib"].includes(data.mode) ? data.mode : "opsional";
  return {
    oauth: Boolean(data.oauth),
    kodeProfil: Boolean(data.kodeProfil),
    mode,
    // Bawaan aman: server yang lama tidak mengirim `wajib`; anggap tidak wajib,
    // tetapi JANGAN pernah menganggap pendaftar otomatis terverifikasi.
    wajib: Boolean(data.wajib),
    tiketBerlakuDetik: Number(data.tiketBerlakuDetik) || 0,
  };
}

/** Mulai login Chess.com (OAuth). Mengembalikan URL pengalihan. */
export async function mulaiLoginChessCom(kembaliKe = "/pendaftaran-anggota") {
  const res = await fetchApi(
    `/api/auth/chess/mulai?kembali=${encodeURIComponent(kembaliKe)}`
  );
  const data = await bacaJsonRespons(res);
  if (!res.ok) throw galatDariRespons(res, data, "Login Chess.com tidak tersedia.");
  if (typeof data.url !== "string" || !data.url.startsWith("https://")) {
    throw new GalatApi("Respons login Chess.com tidak sah.", { status: res.status });
  }
  return data;
}

/**
 * Minta kode tantangan ke SERVER. Kodenya dibuat dan disimpan server serta
 * diikat ke username — bukan angka acak di browser.
 */
export async function mintaKodeVerifikasi(username, { paksa = false, sinyal } = {}) {
  return kirimDenganCsrf(
    "/api/auth/kode/minta",
    { username, paksa },
    {
      pesanCadangan: "Kode verifikasi tidak dapat diminta. Coba lagi.",
      sinyal,
    }
  );
}

/**
 * Minta SERVER memeriksa profil Chess.com. Bila cocok, respons membawa
 * `tiket` — tiket inilah bukti kepemilikan yang dipakai saat mendaftar.
 */
export async function periksaKodeVerifikasi(username, { sinyal } = {}) {
  return kirimDenganCsrf(
    "/api/auth/kode/periksa",
    { username },
    { pesanCadangan: "Pemeriksaan kode gagal. Coba lagi.", sinyal }
  );
}

/**
 * Pengajuan verifikasi manual. Selamanya berstatus "menunggu": jalur ini
 * sengaja tidak menghasilkan tiket maupun status terverifikasi.
 */
export async function ajukanVerifikasiManual(username, catatan = "") {
  return kirimDenganCsrf(
    "/api/auth/pengajuan-manual",
    { username, catatan },
    { pesanCadangan: "Pengajuan manual tidak dapat dikirim. Coba lagi." }
  );
}

/* -------------------------------------------------------- pendaftaran */

/**
 * Kirim formulir pendaftaran lengkap.
 * @param {object} data - username, namaLengkap, panggilan, hp, dana, kota,
 *                        tanggalLahir, email, klub, setuju, dan (opsional)
 *                        tiketVerifikasi yang DITERBITKAN SERVER.
 */
export async function daftarDenganChessCom(data) {
  return kirimDenganCsrf("/api/anggota", data, {
    pesanCadangan: "Pendaftaran gagal.",
  });
}

/**
 * Lengkapi verifikasi untuk anggota yang SUDAH terdaftar.
 *
 * Pendaftaran menolak username yang sudah ada, jadi anggota lama yang
 * `terverifikasi:false` memakai jalur ini. `tiketVerifikasi` adalah tiket
 * sekali pakai yang DITERBITKAN SERVER setelah kepemilikan akun terbukti;
 * browser tidak pernah menentukan status verifikasinya sendiri.
 *
 * @param {string} username
 * @param {string} tiketVerifikasi
 * @param {{sinyal?: AbortSignal}} [opsi]
 */
export async function lengkapiVerifikasiAnggota(username, tiketVerifikasi, { sinyal } = {}) {
  return kirimDenganCsrf(
    "/api/anggota/verifikasi-diri",
    { username, tiketVerifikasi },
    {
      pesanCadangan: "Verifikasi gagal disimpan. Ulangi verifikasi akun Anda.",
      sinyal,
    }
  );
}

/* Catatan: pemindaian fair play (POST /api/pengurus/pindai) membutuhkan
 * header token admin; satu-satunya jalur yang benar adalah apiPengurus()
 * dari panel Anggota — jangan mengatur permintaan mentah di sini. */
