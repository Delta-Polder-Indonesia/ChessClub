import { GalatPendaftaran, fetchApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/** Daftar jenis turnamen & status yang dikenal server. */
export async function jenisTurnamen() {
  const res = await fetchApi("/api/turnamen/jenis");
  if (!res.ok) throw new Error("Gagal memuat jenis turnamen.");
  return res.json();
}

/** Turnamen publik, boleh disaring per jenis. */
export async function ambilTurnamenPublik(jenis) {
  const q = jenis ? `?jenis=${encodeURIComponent(jenis)}` : "";
  const res = await fetchApi(`/api/turnamen${q}`);
  if (!res.ok) throw new Error("Gagal memuat turnamen.");
  return res.json();
}

/**
 * Ajukan diri sebagai peserta; pengurus akan menerima atau menolak.
 *
 * Penolakan CSRF dipulihkan sekali dengan pola yang sama seperti
 * lib/api/{ebook,pesan,anggota}.js: token CSRF server hidup di memori dan
 * hilang saat server di-restart, sehingga salinan lama di sessionStorage harus
 * dibuang lalu diambil ulang — kalau tidak, pendaftaran gagal terus tanpa
 * sebab yang terlihat pengguna.
 */
export async function ajukanPesertaTurnamen(id, username) {
  const kirim = (csrfToken) =>
    fetchApi(`/api/turnamen/${encodeURIComponent(id)}/daftar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ username }),
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
  const res = await fetchApi(`/api/turnamen/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("Turnamen tidak ditemukan.");
  return res.json();
}

