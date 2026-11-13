import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { Settings, X } from "lucide-react";
import { DAFTAR_SET } from "../../../components/chess/pemuatBidak.js";
import { useI18n } from "../../../lib/i18n.jsx";
import PanelLayar from "../../Analisa/komponen/nav/PanelLayar.jsx";
import License from "../../Analisa/komponen/svg/license.jsx";
import {
  BarisPilihan,
  BarisSakelar,
  KELAS_SELECT,
  KELAS_TOMBOL_AKSI,
  PratinjauBidak,
  PratinjauPapan,
} from "./KontrolPengaturanPapan.jsx";
import { PILIHAN_WARNA_PAPAN } from "./konstanta.js";

/**
 * Panel pengaturan papan di dalam area utama mode (bukan popup dialog),
 * mengikuti gaya kartu Pengaturan Papan di `/papan-interaktif/pengaturan`.
 *
 * Hanya menampilkan opsi yang benar-benar didukung oleh mode bersangkutan
 * (`opsi` dan `suara`) supaya tidak ada kontrol mati yang menyesatkan.
 */
function PanelPengaturanMode({
  judulMode,
  onTutup,
  nilai,
  ubah,
  suara = null,
  opsi = {},
}) {
  const { t } = useI18n();
  const idBidak = useId();
  const idWarna = useId();
  const idKoordinat = useId();

  const tampilKoordinat = nilai.tampilKoordinat ?? "tepi";
  const tampilTitikLangkah = nilai.tampilTitikLangkah !== false;
  const sorotLangkahAkhir = nilai.sorotLangkahAkhir !== false;

  return (
    <div data-panel="mode-pengaturan" className="analisa-root h-full min-h-0 w-full">
      <PanelLayar
        judul={t("papan.pengaturan")}
        subjudul={judulMode}
        lebarMaks="max-w-[720px]"
        headerKanan={
          <button
            type="button"
            onClick={onTutup}
            aria-label={t("papan.tutup")}
            className={KELAS_TOMBOL_AKSI}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            {t("papan.tutup")}
          </button>
        }
      >
        <div className="flex min-h-0 max-h-full flex-col overflow-hidden rounded-[0.4rem] border border-border bg-backgroundBox">
          <div className="shrink-0 px-4 pt-4">
            <h2 className="text-center text-xl font-bold text-foreground">
              {t("papan.pengaturanPapan")}
            </h2>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-4 [&>*:first-child]:pt-0 [&>*:last-child]:border-b-0 [&>*:last-child]:pb-0">
            <BarisPilihan
              judul={t("papan.setBidak")}
              deskripsi={t("papan.setBidakDeskripsi")}
              pratinjau={<PratinjauBidak set={nilai.bidak} />}
            >
              <select
                id={idBidak}
                value={nilai.bidak}
                onChange={(event) => ubah("bidak", event.target.value)}
                aria-label={t("papan.setBidak")}
                className={KELAS_SELECT}
              >
                {DAFTAR_SET.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.nama}
                  </option>
                ))}
              </select>
            </BarisPilihan>

            <BarisPilihan
              judul={t("papan.warnaPapan")}
              deskripsi={t("papan.warnaPapanDeskripsi")}
              pratinjau={<PratinjauPapan tema={nilai.warnaPapan} />}
            >
              <select
                id={idWarna}
                value={nilai.warnaPapan}
                onChange={(event) => ubah("warnaPapan", event.target.value)}
                aria-label={t("papan.warnaPapan")}
                className={KELAS_SELECT}
              >
                {PILIHAN_WARNA_PAPAN.map(([id, kunci]) => (
                  <option key={id} value={id}>
                    {t(kunci)}
                  </option>
                ))}
              </select>
            </BarisPilihan>

            {opsi.koordinat && (
              <BarisPilihan
                judul={t("papan.koordinatPapan")}
                deskripsi={t("papan.koordinatPapanDeskripsi")}
                sejajar
              >
                <select
                  id={idKoordinat}
                  value={tampilKoordinat}
                  onChange={(event) => ubah("tampilKoordinat", event.target.value)}
                  aria-label={t("papan.koordinatPapan")}
                  className={KELAS_SELECT}
                >
                  <option value="tidak">{t("papan.koordinatTidak")}</option>
                  <option value="tepi">{t("papan.koordinatTepi")}</option>
                  <option value="semua">{t("papan.koordinatSemua")}</option>
                </select>
              </BarisPilihan>
            )}

            {opsi.titikLangkah && (
              <BarisSakelar
                judul={t("papan.titikLangkah")}
                deskripsi={t("papan.titikLangkahDeskripsi")}
                checked={tampilTitikLangkah}
                onCheckedChange={(v) => ubah("tampilTitikLangkah", v)}
              />
            )}

            {opsi.sorotLangkahAkhir && (
              <BarisSakelar
                judul={t("papan.sorotLangkahAkhir")}
                deskripsi={t("papan.sorotLangkahAkhirDeskripsi")}
                checked={sorotLangkahAkhir}
                onCheckedChange={(v) => ubah("sorotLangkahAkhir", v)}
              />
            )}

            {suara && (
              <BarisSakelar
                judul={t("papan.suara")}
                deskripsi={t("papan.suaraDeskripsi")}
                checked={suara.nyala}
                onCheckedChange={suara.setNyala}
              />
            )}
          </div>
        </div>
      </PanelLayar>
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
 * @param {{nyala: boolean, setNyala: Function} | null} [p.suara] kontrol suara bila mode memakainya
 * @param {{koordinat?: boolean, titikLangkah?: boolean, sorotLangkahAkhir?: boolean}} [p.opsiPengaturan]
 * @param {import("react").ReactNode} p.children isi halaman
 */
export default function TataLetakModePapan({
  judul,
  tautan = null,
  pengaturan = null,
  suara = null,
  opsiPengaturan = null,
  children,
}) {
  const { t } = useI18n();
  const [tampilPengaturan, setTampilPengaturan] = useState(false);

  // Judul tab diatur di sini — halaman mandiri tidak lagi dilalui tata letak
  // Workspace yang dulu menulis document.title untuk semua mode.
  useEffect(() => {
    document.title = `${judul} | ${t("common.namaKomunitas")}`;
  }, [judul, t]);

  useEffect(() => {
    if (!tampilPengaturan) return undefined;
    const padaTombol = (event) => {
      if (event.key === "Escape") setTampilPengaturan(false);
    };
    window.addEventListener("keydown", padaTombol);
    return () => window.removeEventListener("keydown", padaTombol);
  }, [tampilPengaturan]);

  const bisaPengaturan = Boolean(pengaturan?.ubah);
  const opsiAktif = {
    koordinat: true,
    titikLangkah: false,
    sorotLangkahAkhir: true,
    ...opsiPengaturan,
  };

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
                onClick={() => setTampilPengaturan((tampil) => !tampil)}
                aria-expanded={tampilPengaturan}
                className={`flex w-full items-center gap-2 py-1.5 text-left text-sm font-bold transition ${
                  tampilPengaturan ? "text-[#a3d168]" : "text-slate-300 hover:text-white"
                }`}
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
        {/* Isi mode tetap terpasang (disembunyikan lewat CSS saat pengaturan
            dibuka) supaya permainan, tebakan Turing, maupun sesi repertoar
            tidak ter-reset ketika pengguna mengganti preferensi papan. */}
        <div
          className={
            tampilPengaturan
              ? "hidden"
              : "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          }
          aria-hidden={tampilPengaturan || undefined}
        >
          {children}
        </div>

        {tampilPengaturan && bisaPengaturan && (
          <PanelPengaturanMode
            judulMode={judul}
            onTutup={() => setTampilPengaturan(false)}
            nilai={pengaturan.nilai}
            ubah={pengaturan.ubah}
            suara={suara}
            opsi={opsiAktif}
          />
        )}
      </main>
    </div>
  );
}
