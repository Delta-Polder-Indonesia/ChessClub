import { useEffect, useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { ID } from "../../../lib/terjemahan.js";
import {
  normalisasiUsernameKanonik,
  periksaUsername,
} from "../../../lib/identitas.js";

/**
 * Utilitas data pemain catur — port mandiri dari contoh chess-community-ui-component.
 *
 * Semua data yang diambil di sini berasal dari API publik Chess.com
 * (https://api.chess.com/pub/player/{username}) tanpa kunci API, dan hanya
 * untuk kebutuhan PRATINJAU profil. Yang membuktikan kepemilikan akun bukan
 * bagian modul ini, melainkan tiket yang diterbitkan server (lihat
 * `src/lib/api/anggota.js`).
 *
 * Pesan galat mengikuti i18n situs: pemanggilan UI menyuntikkan penerjemah `t`
 * lewat opsi `ambilProfilChessCom`; tanpa `t`, teks Indonesia dari kamus ID
 * menjadi fallback yang aman (konsisten dengan perilaku i18n.jsx).
 */

/** Platform yang didukung modul ini. Lichess TIDAK didukung di sini. */
export const PLATFORM_DI_DUKUNG = ["chessCom"];

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

/**
 * Aturan username: DIIMPOR dari `src/lib/identitas.js`, modul yang sama juga
 * dipakai `server/src/keanggotaan.js`. Karena itu tidak mungkin lagi terjadi
 * isian yang lolos frontend lalu ditolak backend (dulu: 3–30 di sini,
 * 3–25 + huruf kecil di server).
 */
export const normalisasiUsername = normalisasiUsernameKanonik;
export const sahUsername = (nilai) => periksaUsername(nilai).sah;
export { periksaUsername };

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
 * Ambil profil pemain Chess.com (pratinjau saja — bukan bukti kepemilikan).
 *
 * @param {string} usernameRaw
 * @param {{ segar?: boolean, t?: Function, sinyal?: AbortSignal }} opsi
 *        `segar: true` melewati cache;
 *        `t` menerjemahkan pesan galat mengikuti bahasa aktif;
 *        `sinyal` membatalkan permintaan (dipakai hook saat komponen
 *        dibongkar atau saat username berubah, agar permintaan lama tidak
 *        menimpa hasil terbaru).
 */
export async function ambilProfilChessCom(usernameRaw, opsi = {}) {
  const t = opsi.t || tBawaan;
  const diperiksa = periksaUsername(usernameRaw);
  if (!diperiksa.username) throw new Error(t("verifikasi.profilUsernameKosong"));
  if (!diperiksa.sah) throw new Error(t("verifikasi.profilUsernameSah"));
  const username = diperiksa.username;

  const kunci = username.toLowerCase();
  if (!opsi.segar && CACHE_KARTU.has(kunci)) return CACHE_KARTU.get(kunci);

  const pengendali = new AbortController();
  const timer = setTimeout(() => pengendali.abort(), BATAS_TIMEOUT);
  const batalkanLuar = () => pengendali.abort();
  if (opsi.sinyal) {
    if (opsi.sinyal.aborted) pengendali.abort();
    else opsi.sinyal.addEventListener("abort", batalkanLuar, { once: true });
  }

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

    let data;
    try {
      data = await tafsir.json();
    } catch {
      // Respons tidak terurai: jangan diteruskan sebagai SyntaxError mentah.
      throw new Error(t("verifikasi.profilGagalMuat"));
    }
    const kartu = petakanProfil(data);
    CACHE_KARTU.set(kunci, kartu);
    return kartu;
  } catch (galat) {
    if (galat?.name === "AbortError") {
      throw new Error(
        opsi.sinyal?.aborted
          ? t("verifikasi.profilDibatalkan")
          : t("verifikasi.profilTimeout")
      );
    }
    if (galat instanceof TypeError) {
      throw new Error(t("verifikasi.profilJaringan"));
    }
    throw galat;
  } finally {
    clearTimeout(timer);
    opsi.sinyal?.removeEventListener?.("abort", batalkanLuar);
  }
}

export function hapusCacheProfil(usernameRaw) {
  CACHE_KARTU.delete(normalisasiUsername(usernameRaw).toLowerCase());
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
 * Hook profil pemain untuk PRATINJAU formulir (kartu + status pemuatan).
 *
 * `platform` sengaja dibatasi: modul ini HANYA bicara ke Chess.com. Jika
 * suatu hari ada platform lain, tambahkan cabang yang benar-benar mengambil
 * datanya — jangan biarkan pemanggil mengira Lichess sudah didukung hanya
 * karena argumennya diterima.
 *
 * Daur hidup:
 *  - permintaan ditunda 550 ms (debounce) lalu dibatalkan saat username
 *    berubah atau komponen dibongkar, sehingga permintaan lama tidak pernah
 *    menimpa hasil permintaan terbaru;
 *  - hasil hanya dipakai bila nomor permintaan masih yang terbaru.
 *
 * @param {string} username
 * @param {boolean} aktif  aktifkan pengambilan data
 * @param {"chessCom"} platform
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
      return undefined;
    }
    if (!PLATFORM_DI_DUKUNG.includes(platform)) {
      setKartu(null);
      setMemuat(false);
      setGalat(t("verifikasi.profilPlatformTidakDidukung"));
      return undefined;
    }

    let hidup = true;
    const kendali = new AbortController();
    setMemuat(true);

    const jam = setTimeout(() => {
      ambilProfilChessCom(bersih, { t, sinyal: kendali.signal })
        .then((hasil) => {
          if (!hidup) return;
          setKartu(hasil);
          setGalat("");
        })
        .catch((galatBaru) => {
          if (!hidup) return;
          if (galatBaru?.name === "AbortError") return; // dibatalkan: bukan galat
          setKartu(null);
          setGalat(galatBaru?.message || t("verifikasi.profilGagalMuat"));
        })
        .finally(() => {
          if (hidup) setMemuat(false);
        });
    }, 550);

    return () => {
      hidup = false;
      clearTimeout(jam);
      kendali.abort();
    };
  }, [username, aktif, platform, t]);

  return { kartu, memuat, galat };
}

export default useProfilPemain;