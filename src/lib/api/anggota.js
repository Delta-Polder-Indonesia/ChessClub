import { ambilCsrfToken } from "./pengurus.js";
import { GalatPendaftaran, urlApi } from "./core.js";

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
 * Cadangan untuk deployment frontend statis (mis. GitHub Pages).
 * Endpoint klub Chess.com sudah berupa data publik dan mendukung CORS, jadi
 * browser dapat mengambil roster tanpa backend. Data rinci seperti rating
 * tetap berasal dari backend saat tersedia; cadangan ini memastikan nama,
 * tanggal bergabung, dan tautan profil anggota tidak menghilang seluruhnya.
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

export async function ambilDaftarAnggota() {
  try {
    const res = await fetch(urlApi("/api/anggota"));
    if (!res.ok) throw new Error(`API anggota menjawab ${res.status}.`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Format API anggota tidak sah.");
    return data;
  } catch (galatBackend) {
    try {
      return await ambilRosterPublikChess();
    } catch {
      throw new Error(
        "Daftar anggota belum dapat dimuat dari server maupun Chess.com.",
        { cause: galatBackend }
      );
    }
  }
}

export async function ambilDaftarHitam() {
  const res = await fetch(urlApi("/api/daftar-hitam"));
  if (!res.ok) throw new Error("Gagal memuat daftar larangan.");
  return res.json();
}

/**
 * Kirim formulir pendaftaran lengkap.
 * @param {object} data - username, namaLengkap, panggilan, hp, dana, kota,
 *                        tanggalLahir, email, klub, setuju
 */
export async function daftarDenganChessCom(data) {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(urlApi("/api/anggota"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
  });
  const hasil = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatPendaftaran(hasil.pesan || "Pendaftaran gagal.", {
      galat: hasil.galat,
      diblokir: hasil.diblokir,
      alasan: hasil.alasan,
    });
  }
  return hasil;
}

/* Catatan: pemindaian fair play (POST /api/pengurus/pindai) membutuhkan
 * header token admin; satu-satunya jalur yang benar adalah apiPengurus()
 * dari panel Anggota — jangan mengatur permintaan mentah di sini. */
