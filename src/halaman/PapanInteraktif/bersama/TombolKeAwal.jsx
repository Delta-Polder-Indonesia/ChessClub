import { ChevronStartIcon } from "../../../components/icons.jsx";

/**
 * Tombol "Ke Awal" pada navigasi langkah. Dipakai mode Buku Pembukaan
 * (PapanInteraktif.jsx) dan Manusia vs Mesin dengan tampilan identik:
 * ikon ChevronStartIcon, kelas hover/disabled sama persis seperti
 * tombol ◀ ▶ ⏭ di sebelahnya.
 */
export default function TombolKeAwal({ onClick, disabled, t }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={t("papan.keAwal")}
      aria-label={t("papan.keAwal")}
      className="flex flex-1 items-center justify-center rounded py-2.5 text-lg font-bold text-gray-400 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
    >
      <ChevronStartIcon className="size-5" />
    </button>
  );
}
