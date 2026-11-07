import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, X } from "lucide-react";
import { DAFTAR_SET } from "../../../components/chess/pemuatBidak.js";
import { useI18n } from "../../../lib/i18n.jsx";
import License from "../../Analisa/komponen/svg/license.jsx";
import { PILIHAN_WARNA_PAPAN } from "./konstanta.js";
import { useDialog } from "./gunakanDialog.js";

/**
 * Dialog pengaturan ringkas untuk mode papan yang berdiri sendiri.
 *
 * Mode di luar tata letak Workspace tidak lagi berbagi state pengaturan lewat
 * `PenyediaPengaturanPapan`, jadi opsi yang benar-benar dibaca halamannya
 * disediakan sendiri di sini: set bidak dan warna papan. Pilihan lain
 * (suara, panah mesin, komentator) tidak dipakai mode-mode ini sehingga tidak
 * ditampilkan agar tidak menyesatkan.
 */
function DialogPengaturan({ onTutup, nilai, ubah }) {
  const { t } = useI18n();
  const refDialog = useDialog(onTutup);
  const idBidak = useId();
  const idWarna = useId();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onTutup}
    >
      <div
        ref={refDialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t("papan.pengaturanPapan")}
        className="w-full max-w-sm rounded-lg border border-[#312e2b] bg-[#1e1c18] p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">{t("papan.pengaturanPapan")}</h2>
          <button
            type="button"
            onClick={onTutup}
            aria-label={t("papan.tutup")}
            className="rounded-md p-1.5 text-gray-400 transition hover:bg-[#312e2b] hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={idBidak} className="text-xs font-bold text-gray-400">
              {t("papan.setBidak")}
            </label>
            <select
              id={idBidak}
              data-autofokus
              value={nilai.bidak}
              onChange={(event) => ubah("bidak", event.target.value)}
              className="w-full rounded-md border border-[#363431] bg-[#262421] px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-[#81b64c]"
            >
              {DAFTAR_SET.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={idWarna} className="text-xs font-bold text-gray-400">
              {t("papan.warnaPapan")}
            </label>
            <select
              id={idWarna}
              value={nilai.warnaPapan}
              onChange={(event) => ubah("warnaPapan", event.target.value)}
              className="w-full rounded-md border border-[#363431] bg-[#262421] px-2 py-1.5 text-sm text-gray-200 outline-none focus:border-[#81b64c]"
            >
              {PILIHAN_WARNA_PAPAN.map(([id, kunci]) => (
                <option key={id} value={id}>
                  {t(kunci)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Kerangka halaman mode papan yang BERDIRI SENDIRI — pola yang sama dengan
 * Manusia vs Mesin: bukan anggota sidebar `Workspace.jsx`, melainkan halaman
 * dengan sidebar, navigasi, judul dokumen, dan pintu pengaturannya sendiri.
 *
 * Alamat rutenya tetap di bawah `/papan-interaktif/*` supaya URL publik tidak
 * berubah; yang berpindah hanya pemilik tata letaknya.
 *
 * @param {object} p
 * @param {string} p.judul            label mode (dipakai juga sebagai judul tab)
 * @param {{to: string, label: string}} [p.tautan] tautan balik ke halaman Program Kami
 * @param {{nilai: object, ubah: Function}} [p.pengaturan] state pengaturan papan halaman ini
 * @param {import("react").ReactNode} p.children isi halaman
 */
export default function TataLetakModePapan({ judul, tautan = null, pengaturan = null, children }) {
  const { t } = useI18n();
  const [tampilPengaturan, setTampilPengaturan] = useState(false);

  // Judul tab diatur di sini — halaman mandiri tidak lagi dilalui tata letak
  // Workspace yang dulu menulis document.title untuk semua mode.
  useEffect(() => {
    document.title = `${judul} | ${t("common.namaKomunitas")}`;
  }, [judul, t]);

  const bisaPengaturan = Boolean(pengaturan?.ubah);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#262421] font-sans text-gray-200 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col justify-between border-b border-[#312e2b] bg-[#1e1c18] lg:w-[220px] lg:border-b-0 lg:border-r">
        <div>
          <div className="border-b border-[#312e2b] px-4 py-4">
            <span className="text-[22px] font-bold leading-none text-white">
              Blunder<span className="text-[#81b64c]">Skuad</span>
            </span>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {judul}
            </p>
          </div>

          {/* Navigasi samping mode ini. Diberi nama mode supaya pembaca layar
              dan uji tata letak (`nav[aria-label]`) bisa membedakannya dari
              sidebar Workspace, yang labelnya "Mode papan". */}
          <nav aria-label={judul} className="flex flex-col gap-1 px-5 py-2">
            {bisaPengaturan && (
              <button
                type="button"
                onClick={() => setTampilPengaturan(true)}
                className="flex w-full items-center gap-2 py-1.5 text-left text-sm font-bold text-slate-300 transition hover:text-white"
              >
                <Settings size={20} className="shrink-0" aria-hidden="true" />
                {t("papan.pengaturan")}
              </button>
            )}
            {tautan && (
              <Link
                to={tautan.to}
                className="flex w-full items-center gap-2 py-1.5 text-sm font-semibold text-slate-400 transition hover:text-white"
              >
                {tautan.label}
              </Link>
            )}
          </nav>
        </div>

        <div className="border-t border-[#312e2b] px-4 py-3">
          <Link
            to="/program-kami/atribusi"
            className="flex items-center justify-center gap-1.5 text-xs text-gray-300 transition hover:text-white"
          >
            <License size={14} className="fill-current" />
            {t("papan.menuAtribusi")}
          </Link>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#262421]">
        {children}
      </main>

      {tampilPengaturan && bisaPengaturan && (
        <DialogPengaturan
          onTutup={() => setTampilPengaturan(false)}
          nilai={pengaturan.nilai}
          ubah={pengaturan.ubah}
        />
      )}
    </div>
  );
}
