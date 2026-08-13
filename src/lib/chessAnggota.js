/** Normalisasi input: username, @user, atau tautan chess.com/member/user */
export function normalisasiUsername(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/(www\.)?chess\.com\/member\//i, "");
  s = s.replace(/^@/, "");
  s = s.split(/[/?#\s]/)[0];
  return s.toLowerCase();
}

export async function ambilDaftarAnggota() {
  const res = await fetch("/api/anggota");
  if (!res.ok) throw new Error("Gagal memuat daftar anggota.");
  return res.json();
}

export async function daftarDenganChessCom(username) {
  const res = await fetch("/api/anggota", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.pesan || "Pendaftaran gagal.");
  }
  return data;
}
