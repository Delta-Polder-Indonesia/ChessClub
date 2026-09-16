import { useEffect, useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { ID } from "../../../lib/terjemahan.js";

/**
 * Utilitas data pemain catur — port mandiri dari contoh chess-community-ui-component.
 *
 * Semua data diambil langsung dari API publik Chess.com
 * (https://api.chess.com/pub/player/{username}) tanpa kunci API.
 *
 * Pesan galat mengikuti i18n situs: pemanggilan UI menyuntikkan penerjemah `t`
 * lewat opsi `ambilProfilChessCom`; tanpa `t`, teks Indonesia dari kamus ID
 * menjadi fallback yang aman (konsisten dengan perilaku i18n.jsx).
 */

const API_CHESSCOM = "https://api.chess.com/pub/player";
const BATAS_TIMEOUT = 12000;

/* Cache sederhana per-sesi supaya avatar/nama tidak diambil berulang kali. */
const CACHE_KARTU = new Map();

/* Penerjemah cadangan bila pemanggil tidak menyediakan `t` (teks ID). */
const tBawaan = (kunci, ganti = {}) => {
  let teks = kunci
    .split(".")
    .reduce((o, k) => (o ? o[k] : undefined), ID);
  teks = teks ?? kunci;
  for (const [k, v] of Object.entries(ganti)) {
    teks = teks.replaceAll(`{${k}}`, v);
  }
  return teks;
};

export function normalisasiUsername(nilai) {
  return String(nilai ?? "")
    .trim()
    .replace(/\s+/g, "");
}

export function sahUsername(nilai) {
  const bersih = normalisasiUsername(nilai);
  return /^[A-Za-z0-9_-]{3,30}$/.test(bersih);
}

/* Petakan respons mentah Chess.com menjadi kartu pemain yang mudah dipakai UI. */
function petakanProfil(data) {
  const avatar =
    typeof data.avatar === "string" && data.avatar.startsWith("http")
      ? data.avatar
      : null;

  return {
    username: data.username || "",
    nama: data.name || data.username || "",
    /* Alias agar kartu bisa dipakai di komponen berbahasa Inggris. */
    name: data.name || data.username || "",
    avatar,
    url: data.url || `https://www.chess.com/member/${data.username || ""}`,
    gelar: data.title || "",
    followers: Number(data.followers || 0),
    lokasi: data.location || "",
    negara: data.country || "",
    liga: data.league || "",
    status: data.status || "",
    terverifikasiResmi: Boolean(data.verified),
    streamer: Boolean(data.is_streamer),
    terakhirOnline: data.last_online ? data.last_online * 1000 : null,
    bergabung: data.joined ? data.joined * 1000 : null,
    mentah: data,
  };
}

/**
 * Ambil profil pemain Chess.com.
 * @param {string} usernameRaw
 * @param {{ segar?: boolean, t?: (kunci: string, ganti?: object) => string }} opsi
 *        `segar: true` melewati cache (dipakai saat verifikasi kode);
 *        `t` menerjemahkan pesan galat mengikuti bahasa aktif.
 */
export async function ambilProfilChessCom(usernameRaw, opsi = {}) {
  const t = opsi.t || tBawaan;
  const username = normalisasiUsername(usernameRaw);
  if (!username) throw new Error(t("verifikasi.profilUsernameKosong"));
  if (!sahUsername(username)) {
    throw new Error(t("verifikasi.profilUsernameSah"));
  }

  const kunci = username.toLowerCase();
  if (!opsi.segar && CACHE_KARTU.has(kunci)) return CACHE_KARTU.get(kunci);

  const pengendali = new AbortController();
  const timer = setTimeout(() => pengendali.abort(), BATAS_TIMEOUT);

  try {
    const tafsir = await fetch(`${API_CHESSCOM}/${encodeURIComponent(username)}`, {
      signal: pengendali.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!tafsir.ok) {
      if (tafsir.status === 404) {
        throw new Error(t("verifikasi.profilTidakDitemukan", { username }));
      }
      throw new Error(t("verifikasi.profilDitolak", { kode: tafsir.status }));
    }

    const kartu = petakanProfil(await tafsir.json());
    CACHE_KARTU.set(kunci, kartu);
    return kartu;
  } catch (galat) {
    if (galat?.name === "AbortError") {
      throw new Error(t("verifikasi.profilTimeout"));
    }
    if (galat instanceof TypeError) {
      throw new Error(t("verifikasi.profilJaringan"));
    }
    throw galat;
  } finally {
    clearTimeout(timer);
  }
}

export function hapusCacheProfil(usernameRaw) {
  CACHE_KARTU.delete(normalisasiUsername(usernameRaw).toLowerCase());
}

/** Kode acak yang ditempel pemain pada profil Chess.com-nya. */
export function buatKodeVerifikasi() {
  const abjad = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let isi = "";
  for (let i = 0; i < 6; i += 1) {
    isi += abjad[Math.floor(Math.random() * abjad.length)];
  }
  return `BSKUAD-${isi}`;
}

/** Cari kode verifikasi pada kolom profil publik Chess.com. */
export function cariKodeDiProfil(profil, kode) {
  if (!profil || !kode) return null;
  const target = String(kode).toUpperCase();
  const kandidat = [
    ["Lokasi", profil.lokasi],
    ["Nama profil", profil.nama],
    ["Bio", profil.mentah?.bio],
  ];
  for (const [sumber, nilai] of kandidat) {
    if (typeof nilai === "string" && nilai.toUpperCase().includes(target)) return sumber;
  }
  return null;
}

/** Ubah URL negara Chess.com menjadi emoji bendera. */
export function benderaNegara(urlNegara) {
  const cocok = String(urlNegara || "").match(/\/([A-Za-z]{2})$/);
  if (!cocok) return "";
  return cocok[1]
    .toUpperCase()
    .split("")
    .map((huruf) => String.fromCodePoint(127397 + huruf.charCodeAt(0)))
    .join("");
}

export function formatAngka(nilai, bahasa = "id") {
  try {
    return new Intl.NumberFormat(bahasa === "en" ? "en-US" : "id-ID").format(Number(nilai || 0));
  } catch {
    return String(nilai ?? 0);
  }
}

export function formatTanggal(waktu) {
  if (!waktu) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(waktu));
  } catch {
    return "—";
  }
}

/**
 * Hook profil pemain lengkap (kartu + status pemuatan).
 * @param {string} username
 * @param {boolean} aktif  aktifkan pengambilan data
 * @param {"chessCom"|"lichess"} platform
 * @returns {{ kartu: object|null, memuat: boolean, galat: string }}
 */
export function useProfilPemain(username, aktif = true, platform = "chessCom") {
  const { t } = useI18n();
  const [kartu, setKartu] = useState(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    const bersih = normalisasiUsername(username);
    /* Jangan kirim permintaan untuk username yang jelas belum lengkap. */
    if (!aktif || !bersih || !sahUsername(bersih)) {
      setKartu(null);
      setGalat("");
      setMemuat(false);
      return;
    }

    let dibatalkan = false;
    setMemuat(true);

    const timer = setTimeout(async () => {
      try {
        const hasil = await ambilProfilChessCom(bersih, { t });
        if (!dibatalkan) {
          setKartu(hasil);
          setGalat("");
        }
      } catch (galatBaru) {
        if (!dibatalkan) {
          setKartu(null);
          setGalat(galatBaru?.message || t("verifikasi.profilGagalMuat"));
        }
      } finally {
        if (!dibatalkan) setMemuat(false);
      }
    }, 550);

    return () => {
      dibatalkan = true;
      clearTimeout(timer);
    };
  }, [username, aktif, platform]);

  return { kartu, memuat, galat };
}

export default useProfilPemain;