import { urlApi } from "./core.js";
import { ambilCsrfToken } from "./pengurus.js";

/* ----------------------------------------- papan peringkat "Rush Teka-teki" */

/** Peringkat online untuk satu durasi (3 atau 5 menit). */
export async function ambilPeringkatRush(durasiMenit) {
  const res = await fetch(
    urlApi(`/api/rekor-rush?durasi=${encodeURIComponent(durasiMenit)}`)
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
 * Kirim skor Rush untuk anggota. Hanya username dalam roster klub yang
 * diterima server. Mengembalikan peringkat terkini durasi tsb.
 */
export async function kirimSkorRush({ username, skor, durasiMenit }) {
  const csrfToken = await ambilCsrfToken();
  const res = await fetch(urlApi("/api/rekor-rush"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ username, skor, durasiMenit }),
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
