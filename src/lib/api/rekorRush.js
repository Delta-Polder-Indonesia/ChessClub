import { urlApi } from "./core.js";
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
    const e = new Error(data.pesan || "Gagal memuat papan peringkat Rush.");
    e.status = res.status;
    throw e;
  }
  return data; // { durasi, peringkat }
}

/**
 * Kirim skor Rush untuk anggota. Server meminta tiket verifikasi Chess.com
 * yang terikat pada username selain memeriksa roster klub.
 */
export async function kirimSkorRush({ username, skor, durasiMenit, tiketVerifikasi }) {
  const csrfToken = await ambilCsrfToken();
  const res = await ambilDenganWaktu("/api/rekor-rush", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ username, skor, durasiMenit, tiketVerifikasi }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(
      data.pesan || "Gagal menyimpan skor ke papan peringkat."
    );
    e.status = res.status;
    throw e;
  }
  return data; // { hasil, peringkat }
}
