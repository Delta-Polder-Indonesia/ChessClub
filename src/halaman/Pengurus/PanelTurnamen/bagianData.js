export const LABEL_STATUS = {
  draf: { teks: "Draf", kelas: "text-slate-600" },
  pendaftaran: { teks: "Pendaftaran", kelas: "text-slate-600" },
  berlangsung: { teks: "Berlangsung", kelas: "text-slate-600" },
  selesai: { teks: "Selesai", kelas: "text-slate-600" },
  batal: { teks: "Batal", kelas: "text-slate-600" },
};

/** Apakah tanggal pembuatan akun Chess.com kurang dari 30 hari? */
export function akunMasihBaru(iso) {
  if (!iso) return false;
  const umurHari = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return Number.isFinite(umurHari) && umurHari < 30;
}
