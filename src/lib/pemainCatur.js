/**
 * Kartu profil pemain dari API publik chess.com (tanpa autentikasi).
 *
 * Ambil nama tampilan, gelar (title), avatar, bendera negara, dan rating
 * Bullet/Blitz/Rapid untuk ditampilkan di dekat papan & pada ringkasan —
 * persis seperti kartu profil pada referensi. Semua hasil di-`cache` per
 * username (Map + localStorage) supaya membuka partai lain jadi instan dan
 * tidak membanjiri API.
 */

import { useEffect, useState } from "react";

const BASE = "https://api.chess.com/pub";
const KUNCI_CACHE = "kci-analisa-pemain-";

const cache = new Map();

/** Bilangan nama yang jelas bukan akun chess.com (jangan dipakai untuk fetch). */
const NAMA_SKIP = new Set(["", "?", "unknown", "anonim", "putih", "hitam", "white", "black"]);

function bersihkanUsername(username) {
  return encodeURIComponent(String(username ?? "").trim().toLowerCase());
}

/** Kode negara dua huruf ("id") → emoji bendera. */
function benderaNegara(kode) {
  if (!kode || kode.length !== 2) return null;
  return kode
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
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

/**
 * Ambil kartu profil untuk satu username. Resolusi `null` bila tidak ada
 * (pemain anonim / bukan akun chess.com yang terindeks / offline).
 * @param {string} username
 * @returns {Promise<object|null>}
 */
export async function ambilKartuPemain(username) {
  const kunci = String(username ?? "").trim().toLowerCase();
  if (NAMA_SKIP.has(kunci)) return null;
  if (cache.has(kunci)) return cache.get(kunci);

  const dariStorage = muatStorage(kunci);
  if (dariStorage) {
    cache.set(kunci, dariStorage);
    return dariStorage;
  }

  const u = bersihkanUsername(username);
  const [profil, statistik] = await Promise.all([
    fetch(`${BASE}/player/${u}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
    fetch(`${BASE}/player/${u}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  if (!profil) {
    cache.set(kunci, null);
    return null;
  }

  const kodeNegara = profil.country ? profil.country.split("/").pop() : null;
  // Total partai = jumlah menang + kalah + seri seluruh kelas waktu (untuk
  // menampilkan "Games terunduh / total" pada kartu akun seperti En Croissant).
  const totalGame = ["chess_bullet", "chess_blitz", "chess_rapid", "chess_classical"].reduce(
    (s, k) => {
      const c = statistik?.[k]?.record;
      return s + (c ? (c.win + c.loss + c.draw) : 0);
    },
    0,
  );
  const kartu = {
    username,
    exists: true,
    name: profil.name || null,
    title: profil.title || null,
    avatar: profil.avatar || null,
    flag: benderaNegara(kodeNegara),
    url: profil.url || `https://www.chess.com/member/${username}`,
    total: totalGame || null,
    ratings: {
      bullet: statistik?.chess_bullet?.last?.rating ?? null,
      blitz: statistik?.chess_blitz?.last?.rating ?? null,
      rapid: statistik?.chess_rapid?.last?.rating ?? null,
    },
  };

  cache.set(kunci, kartu);
  simpanStorage(kunci, kartu);
  return kartu;
}

/**
 * Hook React: ambil kartu profil untuk satu nama. Kembali `undefined` saat
 * memuat, `null` bila tidak tersedia, atau objek kartu bila ada.
 *
 * @param {string|null} nama
 * @param {boolean} [aktif=true] Tahan pemanggilan API hingga partai benar-benar
 *   dimuat, supaya tidak menembak chess.com saat papan masih kosong (nama
 *   bawaan "Putih"/"Hitam") maupun untuk nama yang jelas bukan akun.
 */
export function useKartuPemain(nama, aktif = true) {
  const [kartu, setKartu] = useState(undefined);
  useEffect(() => {
    let hidup = true;
    const kunci = String(nama ?? "").trim().toLowerCase();
    setKartu(undefined);
    if (!aktif || NAMA_SKIP.has(kunci)) {
      setKartu(null);
      return undefined;
    }
    ambilKartuPemain(nama).then((k) => {
      if (hidup) setKartu(k ?? null);
    });
    return () => {
      hidup = false;
    };
  }, [nama, aktif]);
  return kartu;
}
