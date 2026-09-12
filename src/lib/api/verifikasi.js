import { fetchApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/* --------------------------------- verifikasi kepemilikan akun Chess.com */

/** Cara verifikasi apa saja yang tersedia di server. */
export async function caraVerifikasi() {
  const res = await fetchApi("/api/auth/cara");
  if (!res.ok) throw new Error("Gagal memeriksa cara verifikasi.");
  return res.json();
}

/** Ambil URL login Chess.com; pemanggil yang melakukan pengalihan. */
export async function mulaiLoginChess(kembaliKe) {
  const q = kembaliKe ? `?kembali=${encodeURIComponent(kembaliKe)}` : "";
  const res = await fetchApi(`/api/auth/chess/mulai${q}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.pesan || "Login Chess.com belum tersedia.");
  return data;
}

/** Minta kode untuk ditempel di profil Chess.com. */
export async function mintaKodeProfil(username) {
  const kirim = async (csrfToken) => {
    const res = await fetchApi("/api/auth/kode/minta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ username }),
    });
    return { res, data: await res.json().catch(() => ({})) };
  };

  let csrfToken = await ambilCsrfToken();
  let { res, data } = await kirim(csrfToken);
  if (res.status === 403 && /csrf/i.test(data.pesan || "")) {
    sessionStorage.removeItem("kci-csrf-token");
    csrfToken = await ambilCsrfToken();
    ({ res, data } = await kirim(csrfToken));
  }
  if (!res.ok) throw new Error(data.pesan || "Gagal meminta kode.");
  return data;
}

/** Periksa apakah kode sudah terpasang di profil. */
export async function periksaKodeProfil(username) {
  const kirim = async (csrfToken) => {
    const res = await fetchApi("/api/auth/kode/periksa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ username }),
    });
    return { res, data: await res.json().catch(() => ({})) };
  };

  let csrfToken = await ambilCsrfToken();
  let { res, data } = await kirim(csrfToken);
  if (res.status === 403 && /csrf/i.test(data.pesan || "")) {
    sessionStorage.removeItem("kci-csrf-token");
    csrfToken = await ambilCsrfToken();
    ({ res, data } = await kirim(csrfToken));
  }
  if (!res.ok) throw new Error(data.pesan || "Gagal memeriksa kode.");
  return data;
}

