/**
 * Lencana status turnamen — dipakai bersama oleh tab Beranda
 * (halaman/Beranda/Beranda.jsx) dan daftar jadwal turnamen
 * (components/DaftarTurnamen.jsx) agar warna dan label tidak pernah beda.
 */
import { useI18n } from "../lib/i18n.jsx";

export const WARNA_STATUS = {
  // Satu gaya netral untuk semua status — sesuai bahasa desain KCI (flat,
  // satu aksen, tanpa pelangi warna). Makna dibawa oleh teks, bukan warna.
  pendaftaran: "bg-slate-100 text-slate-700",
  berlangsung: "bg-slate-100 text-slate-700",
  selesai: "bg-slate-100 text-slate-700",
  batal: "bg-slate-100 text-slate-700",
};

export const TEKS_STATUS = {
  id: {
    pendaftaran: "Pendaftaran",
    berlangsung: "Berlangsung",
    selesai: "Selesai",
    batal: "Batal",
  },
  en: {
    pendaftaran: "Registration open",
    berlangsung: "In progress",
    selesai: "Finished",
    batal: "Cancelled",
  },
};

/** Lencana status turnamen; bahasa bisa dipaksa lewat prop. */
export default function LencanaStatus({ status, bahasa }) {
  const { bahasa: bahasaKonteks } = useI18n();
  const bhs = bahasa || bahasaKonteks || "id";
  const teks = (TEKS_STATUS[bhs] || TEKS_STATUS.id)[status] || status;
  return (
    <span
      className={`px-2.5 py-0.5 text-xs font-semibold ${
        WARNA_STATUS[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {teks}
    </span>
  );
}
