/**
 * Kartu profil pemain dari API publik chess.com / lichess.org (tanpa autentikasi).
 *
 * Ambil nama tampilan, gelar (title), avatar, bendera negara, tanggal
 * bergabung, status akun, serta rating Bullet/Blitz/Rapid/Daily (beserta
 * puncaknya bila tersedia) untuk ditampilkan di dekat papan, pada ringkasan,
 * dan pada kartu profil Wawasan. Semua hasil di-`cache` per (platform,
 * username) (Map + localStorage) supaya membuka partai lain jadi instan dan
 * tidak membanjiri API. `segarkanKartuPemain` membuang cache itu lebih dulu.
 *
 * PENTING: platform wajib diteruskan untuk akun yang sudah diketahui
 * situsnya (kartu akun di layar Akun). Tanpa platform, nama akun Lichess
 * ikut ditembak ke api.chess.com dan selalu 404 — kartunya kosong melulu.
 */

import { useEffect, useState } from "react";

const BASE_CHESSCOM = "https://api.chess.com/pub";
const BASE_LICHESS = "https://lichess.org/api";
/*
 * Prefiks v2: kartu lama tidak menyimpan `joined`/`status`/`peak`/`daily`,
 * sehingga dibiarkan terbaca akan menampilkan kolom kosong tanpa alasan.
 * Naikkan versi agar entri lama diabaikan, bukan dihapus paksa.
 */
const KUNCI_CACHE = "kci-analisa-pemain-v2-";

const cache = new Map();

/** Bilangan nama yang jelas bukan akun (jangan dipakai untuk fetch). */
const NAMA_SKIP = new Set(["", "?", "unknown", "anonim", "putih", "hitam", "white", "black"]);

function bersihkanUsername(username) {
  return encodeURIComponent(String(username ?? "").trim().toLowerCase());
}

function normalisasiPlatform(platform) {
  return platform === "lichessOrg" ? "lichessOrg" : "chessCom";
}

/** Kode negara ("id", "gb-eng") → kode lowercase untuk nama file SVG bendera. */
function benderaNegara(kode) {
  if (!kode) return null;
  const normal = String(kode).trim().toLowerCase();
  return /^[a-z]{2}(?:-[a-z]{3})?$/.test(normal) ? normal : null;
}

function muatStorage(kunci) {
  try {
    const raw = localStorage.getItem(KUNCI_CACHE + kunci);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function simpanStorage(kunci, nilai) {
  try {
    localStorage.setItem(KUNCI_CACHE + kunci, JSON.stringify(nilai));
  } catch {
    /* cache bersifat best-effort */
  }
}

async function ambilDariChessCom(username) {
  const u = bersihkanUsername(username);
  const [profil, statistik] = await Promise.all([
    fetch(`${BASE_CHESSCOM}/player/${u}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`${BASE_CHESSCOM}/player/${u}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  if (!profil) return null;

  const kodeNegara = profil.country ? profil.country.split("/").pop() : null;
  const bendera = benderaNegara(kodeNegara);
  // Total partai = jumlah menang + kalah + seri seluruh kelas waktu (untuk
  // menampilkan "Games terunduh / total" pada kartu akun seperti En Croissant).
  const totalGame = ["chess_bullet", "chess_blitz", "chess_rapid", "chess_classical", "chess_daily"].reduce(
    (s, k) => {
      const c = statistik?.[k]?.record;
      return s + (c ? (c.win + c.loss + c.draw) : 0);
    },
    0
  );
  return {
    username,
    exists: true,
    name: profil.name || null,
    title: profil.title || null,
    avatar: profil.avatar || null,
    flag: bendera,
    country: bendera ? bendera.toUpperCase() : null,
    joined: Number.isFinite(profil.joined) ? profil.joined : null,
    status: profil.status || null,
    url: profil.url || `https://www.chess.com/member/${username}`,
    total: totalGame || null,
    ratings: {
      bullet: statistik?.chess_bullet?.last?.rating ?? null,
      blitz: statistik?.chess_blitz?.last?.rating ?? null,
      rapid: statistik?.chess_rapid?.last?.rating ?? null,
      daily: statistik?.chess_daily?.last?.rating ?? null,
      classical: statistik?.chess_classical?.last?.rating ?? null,
    },
    peak: {
      bullet: statistik?.chess_bullet?.best?.rating ?? null,
      blitz: statistik?.chess_blitz?.best?.rating ?? null,
      rapid: statistik?.chess_rapid?.best?.rating ?? null,
      daily: statistik?.chess_daily?.best?.rating ?? null,
      classical: statistik?.chess_classical?.best?.rating ?? null,
    },
  };
}

async function ambilDariLichess(username) {
  const u = bersihkanUsername(username);
  let data;
  try {
    const r = await fetch(`${BASE_LICHESS}/user/${u}`, {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    data = await r.json();
  } catch {
    return null;
  }
  if (!data || !data.id) return null;

  const perfs = data.perfs || {};
  // Lichess tidak menyediakan avatar publik — kartu memakai ikon profil.
  return {
    username,
    exists: true,
    name: data.profile?.firstName && data.profile?.lastName
      ? `${data.profile.firstName} ${data.profile.lastName}`
      : null,
    title: data.title || null,
    avatar: null,
    flag: null,
    country: null,
    joined: Number.isFinite(data.createdAt) ? Math.floor(data.createdAt / 1000) : null,
    status: null,
    url: data.url || `https://lichess.org/@/${username}`,
    total: Number(data.count?.all) || null,
    ratings: {
      bullet: perfs.bullet?.rating ?? null,
      blitz: perfs.blitz?.rating ?? null,
      rapid: perfs.rapid?.rating ?? null,
      daily: perfs.correspondence?.rating ?? null,
      classical: perfs.classical?.rating ?? null,
    },
    peak: {
      bullet: null,
      blitz: null,
      rapid: null,
      daily: null,
      classical: null,
    },
  };
}

/**
 * Ambil kartu profil untuk satu username. Resolusi `null` bila tidak ada
 * (pemain anonim / bukan akun terindeks / offline).
 * @param {string} username
 * @param {string} [platform="chessCom"] "chessCom" | "lichessOrg"
 * @returns {Promise<object|null>}
 */
export async function ambilKartuPemain(username, platform = "chessCom") {
  const nama = String(username ?? "").trim().toLowerCase();
  if (NAMA_SKIP.has(nama)) return null;
  const plat = normalisasiPlatform(platform);
  const kunci = `${plat}:${nama}`;
  if (cache.has(kunci)) return cache.get(kunci);

  const dariStorage = muatStorage(kunci);
  if (dariStorage) {
    cache.set(kunci, dariStorage);
    return dariStorage;
  }

  const kartu = plat === "lichessOrg"
    ? await ambilDariLichess(username)
    : await ambilDariChessCom(username);

  cache.set(kunci, kartu);
  if (kartu) simpanStorage(kunci, kartu);
  return kartu;
}

/**
 * Buang cache (Map + localStorage) satu pemain lalu ambil ulang dari API.
 * Dipakai tombol "Muat ulang profil"; kegagalan jaringan tetap menghasilkan
 * `null` seperti `ambilKartuPemain`.
 *
 * @param {string} username
 * @param {string} [platform="chessCom"] "chessCom" | "lichessOrg"
 * @returns {Promise<object|null>}
 */
export async function segarkanKartuPemain(username, platform = "chessCom") {
  const nama = String(username ?? "").trim().toLowerCase();
  if (NAMA_SKIP.has(nama)) return null;
  const kunci = `${normalisasiPlatform(platform)}:${nama}`;
  cache.delete(kunci);
  try {
    localStorage.removeItem(KUNCI_CACHE + kunci);
  } catch {
    /* cache bersifat best-effort */
  }
  return ambilKartuPemain(username, platform);
}

/**
 * Hook React: ambil kartu profil untuk satu nama. Kembali `undefined` saat
 * memuat, `null` bila tidak tersedia, atau objek kartu bila ada.
 *
 * @param {string|null} nama
 * @param {boolean} [aktif=true] Tahan pemanggilan API hingga partai benar-benar
 *   dimuat, supaya tidak menembak API saat papan masih kosong (nama
 *   bawaan "Putih"/"Hitam") maupun untuk nama yang jelas bukan akun.
 * @param {string} [platform="chessCom"] Situs akun ("chessCom" | "lichessOrg").
 */
export function useKartuPemain(nama, aktif = true, platform = "chessCom") {
  const [kartu, setKartu] = useState(undefined);
  useEffect(() => {
    let hidup = true;
    const kunci = String(nama ?? "").trim().toLowerCase();
    setKartu(undefined);
    if (!aktif || NAMA_SKIP.has(kunci)) {
      setKartu(null);
      return undefined;
    }
    ambilKartuPemain(nama, platform).then((k) => {
      if (hidup) setKartu(k ?? null);
    });
    return () => {
      hidup = false;
    };
  }, [nama, aktif, platform]);
  return kartu;
}
