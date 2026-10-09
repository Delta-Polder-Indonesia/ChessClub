export function waktuRelatif(iso) {
  if (!iso) return "";
  const sekarang = Date.now();
  const waktu = new Date(iso).getTime();
  if (Number.isNaN(waktu)) return "";
  const detik = Math.max(0, Math.round((sekarang - waktu) / 1000));
  if (detik < 60) return "baru saja";
  const menit = Math.round(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.round(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.round(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

export function cuplikan(teks, maks = 80) {
  const s = String(teks || "").replace(/\s+/g, " ").trim();
  return s.length > maks ? `${s.slice(0, maks - 1)}…` : s;
}
