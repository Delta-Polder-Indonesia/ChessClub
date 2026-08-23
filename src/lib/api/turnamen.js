import { GalatPendaftaran, urlApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/** Daftar jenis turnamen & status yang dikenal server. */
export async function jenisTurnamen() {
  const res = await fetch(urlApi("/api/turnamen/jenis"));
  if (!res.ok) throw new Error("Gagal memuat jenis turnamen.");
  return res.json();
}

/** Turnamen publik, boleh disaring per jenis. */
export async function ambilTurnamenPublik(jenis) {
  const q = jenis ? `?jenis=${encodeURIComponent(jenis)}` : "";
  const res = await fetch(urlApi(`/api/turnamen${q}`));
  if (!res.ok) throw new Error("Gagal memuat turnamen.");
  return res.json();
}

/** Ajukan diri sebagai peserta; pengurus akan menerima atau menolak. */
export async function ajukanPesertaTurnamen(id, username) {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(urlApi(`/api/turnamen/${encodeURIComponent(id)}/daftar`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ username }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GalatPendaftaran(data.pesan || "Pengajuan turnamen gagal.", {
      diblokir: data.diblokir,
      alasan: data.alasan,
      status: res.status,
      galat: { harusDaftarAnggota: data.harusDaftarAnggota },
    });
  }
  return data;
}

/** Satu turnamen beserta klasemen. */
export async function ambilSatuTurnamen(id) {
  const res = await fetch(urlApi(`/api/turnamen/${encodeURIComponent(id)}`));
  if (!res.ok) throw new Error("Turnamen tidak ditemukan.");
  return res.json();
}

