/**
 * Lencana status turnamen — dipakai bersama oleh tab Beranda
 * (halaman/Beranda/Beranda.jsx) dan daftar jadwal turnamen
 * (components/DaftarTurnamen.jsx) agar warna dan label tidak pernah beda.
 */
import { useI18n } from "../lib/i18n.jsx";
import { TEKS_STATUS, WARNA_STATUS } from "./lencanaStatusData.js";

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
