import { GalatApi, urlApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/* ----------------------------------------- papan peringkat "Rush Teka-teki" */

/** Batas tunggu tiap permintaan peringkat (mdtk) — hindari UI menggantung. */
const BATAS_WAKTU_MS = 8000;

/** fetch dengan pengaman waktu: batalkan bila server tak kunjung merespons. */
async function ambilDenganWaktu(jalur, opsi = {}) {
  const kontrol = new AbortController();
  const waktu = setTimeout(() => kontrol.abort(), BATAS_WAKTU_MS);
  try {
    return await fetch(urlApi(jalur), { ...opsi, signal: kontrol.signal });
  } finally {
    clearTimeout(waktu);
  }
}

/** Peringkat online untuk satu durasi (3 atau 5 menit). */
export async function ambilPeringkatRush(durasiMenit) {
  const res = await ambilDenganWaktu(
    `/api/rekor-rush?durasi=${encodeURIComponent(durasiMenit)}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatApi(data.pesan || "", {
      status: res.status,
      kodePesan: data.pesan ? null : "papanPeringkatRush",
    });
  }
  return data; // { durasi, peringkat }
}

/**
 * Kirim skor Rush untuk anggota. Server meminta tiket verifikasi Chess.com
 * yang terikat pada username selain memeriksa roster klub.
 *
 * Token CSRF hidup di MEMORI server (24 jam), jadi ia hilang begitu server
 * di-restart atau berpindah instance — sedangkan salinan di sessionStorage
 * tetap terpakai dan setiap kiriman ditolak 403. Karena itu penolakan CSRF
 * dipulihkan sekali: buang salinan lama, ambil token baru, ulangi kiriman.
 * (Pola yang sama dipakai lib/api/{ebook,pesan,anggota}.js.)
 */
export async function kirimSkorRush({ username, skor, durasiMenit, tiketVerifikasi }) {
  const kirim = (csrfToken) =>
    ambilDenganWaktu("/api/rekor-rush", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ username, skor, durasiMenit, tiketVerifikasi }),
    });

  let csrfToken = await ambilCsrfToken();
  let res = await kirim(csrfToken);

  if (res.status === 403) {
    const petunjuk = await res.clone().json().catch(() => ({}));
    if (petunjuk?.kode === "token-csrf" || /csrf/i.test(petunjuk?.pesan || "")) {
      try {
        sessionStorage.removeItem("kci-csrf-token");
      } catch {
        /* mode privat browser */
      }
      csrfToken = await ambilCsrfToken();
      res = await kirim(csrfToken);
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatApi(data.pesan || "", {
      status: res.status,
      kodePesan: data.pesan ? null : "simpanSkorRush",
    });
  }
  return data; // { hasil, peringkat }
}
