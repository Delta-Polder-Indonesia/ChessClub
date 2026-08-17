/**
 * Konstanta dan bantuan bersama untuk panel turnamen.
 * Dipisah dari PanelTurnamen.jsx agar Formulir dan Rincian bisa
 * mengimpor tanpa menarik seluruh panel.
 */

export const LABEL_STATUS = {
  draf: { teks: "Draf", kelas: "bg-slate-100 text-slate-700" },
  pendaftaran: { teks: "Pendaftaran", kelas: "bg-blue-50 text-blue-700" },
  berlangsung: { teks: "Berlangsung", kelas: "bg-amber-50 text-amber-800" },
  selesai: { teks: "Selesai", kelas: "bg-emerald-50 text-emerald-700" },
  batal: { teks: "Batal", kelas: "bg-red-50 text-red-700" },
};

export function Lencana({ status }) {
  const s = LABEL_STATUS[status] || LABEL_STATUS.draf;
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${s.kelas}`}>
      {s.teks}
    </span>
  );
}

/** Apakah tanggal pembuatan akun Chess.com kurang dari 30 hari? */
export function akunMasihBaru(iso) {
  if (!iso) return false;
  const umurHari = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return Number.isFinite(umurHari) && umurHari < 30;
}
