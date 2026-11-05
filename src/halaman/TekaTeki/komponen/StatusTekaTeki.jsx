/**
 * Wilayah status permainan sebagai satu `aria-live` region.
 *
 * Audit menemukan dua hal: (1) pesan status tidak pernah dibacakan pembaca
 * layar karena tidak ada wilayah `aria-live`, dan (2) pesan tuntas hanya
 * menjadi teks dekoratif tanpa cara menutupnya.
 *
 * Kebijakan tampilan yang dipertahankan dari versi lama: halaman Teka-Teki
 * hanya menampilkan pesan TUNTAS sebagai teks — umpan balik langkah benar/salah
 * tetap berupa sorotan petak di papan (kontrak uji alur), sehingga kartu ini
 * tidak menutupi papan saat pemain mencoba langkah. Komponennya sendiri tetap
 * menerima semua jenis pesan agar bisa dipakai ulang dengan aman.
 */
import { useI18n } from "../../../lib/i18n.jsx";

const GAYA = {
  benar: "border-[#81b64c]/60 bg-[#1e2a15]/95 text-[#c8e6a0]",
  salah: "border-red-900 bg-red-950/95 text-red-200",
  selesai: "border-[#81b64c]/70 bg-[#233015]/95 text-[#d6efb2]",
  peringatan: "border-amber-900 bg-amber-950/95 text-amber-200",
  info: "border-[#49443b] bg-[#1e1c18]/95 text-gray-200",
};

export default function StatusTekaTeki({ pesan = null, onTutup = null, melayang = true }) {
  const { t } = useI18n();
  const jenis = pesan?.jenis || "info";
  // "benar"/"salah" bersifat sementara (diatur timer di hook permainan);
  // "selesai" dan "peringatan" tetap sampai pengguna berpindah soal.
  const sementara = jenis === "benar" || jenis === "salah";
  const teks = pesan?.teks || "";

  return (
    <div
      // Satu wilayah live untuk semua status; `aria-live` selalu terpasang
      // supaya perubahan teks dibacakan (bukan hanya saat elemen baru muncul).
      aria-live="polite"
      aria-atomic="true"
      data-status-permainan={jenis}
      className={melayang ? "pointer-events-none absolute inset-x-3 top-3 z-30" : ""}
    >
      {teks && (
        <div
          className={`pointer-events-auto flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-xs font-semibold shadow-lg ${
            GAYA[jenis] || GAYA.info
          }`}
        >
          <span className="leading-5">{teks}</span>
          {!sementara && onTutup && (
            <button
              type="button"
              onClick={onTutup}
              className="shrink-0 rounded px-1 text-[11px] font-bold opacity-70 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
              aria-label={t("tekaTeki.tutupStatus")}
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
