import { useId } from "react";
import { DAFTAR_SET } from "../../components/chess/pemuatBidak.js";
import KartuKomentator from "../../components/KartuKomentator.jsx";
import { Switch } from "../../components/ui/switch.jsx";
import { useDialog } from "./bersama/gunakanDialog.js";
import { PILIHAN_WARNA_PAPAN } from "./bersama/konstanta.js";

/**
 * Isi pengaturan papan TANPA bingkai dialog — dipakai LayarPengaturan
 * (sidebar Pengaturan, khusus mode Analisa) dan PopupPengaturan.
 *
 * @param {object} p
 * @param {string} p.t                 fungsi terjemahan
 * @param {string} p.bidak             id set bidak yang sedang aktif
 * @param {(id: string) => void} p.setBidak  ganti set bidak
 * @param {object} p.kartuKomentator   properti yang diteruskan apa adanya ke
 *        <KartuKomentator> (nyala, setNyala, gaya, setGaya, t)
 */
export function IsiPengaturanPapan({
  t,
  bidak,
  setBidak,
  suaraNyala,
  setSuaraNyala,
  tampilPanahMesin,
  setTampilPanahMesin,
  awanTampilanPenuh,
  setAwanTampilanPenuh,
  bantuanNyala,
  setBantuanNyala,
  warnaPapan,
  setWarnaPapan,
  kartuKomentator,
}) {
  const idSetBidak = useId();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={idSetBidak} className="text-xs font-bold text-foregroundGrey">
            {t("papan.setBidak")}
          </label>
          <select
            id={idSetBidak}
            data-autofokus
            value={bidak}
            onChange={(e) => setBidak(e.target.value)}
            className="w-full rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
          >
            {DAFTAR_SET.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor="warna-papan" className="text-xs font-bold text-foregroundGrey">{t("papan.warnaPapan")}</label>
          <select
            id="warna-papan"
            value={warnaPapan}
            onChange={(e) => setWarnaPapan(e.target.value)}
            className="w-full rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
          >
            {PILIHAN_WARNA_PAPAN.map(([nilai, kunci]) => <option key={nilai} value={nilai}>{t(kunci)}</option>)}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-foregroundGrey">
          {t("papan.suara")}
        </span>
        <Switch
          size="sm"
          checked={suaraNyala}
          onCheckedChange={setSuaraNyala}
          aria-label={t("papan.suara")}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-foregroundGrey">
          {t("papan.enginePanahToggle")}
        </span>
        <Switch
          size="sm"
          checked={tampilPanahMesin}
          onCheckedChange={setTampilPanahMesin}
          aria-label={t("papan.enginePanahToggle")}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-foregroundGrey">
          {t("papan.bantuanToggle")}
        </span>
        <Switch
          size="sm"
          checked={bantuanNyala}
          onCheckedChange={setBantuanNyala}
          aria-label={t("papan.bantuanToggle")}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-foregroundGrey">
          {t("papan.awanTampilanPenuh")}
        </span>
        <Switch
          size="sm"
          checked={awanTampilanPenuh}
          onCheckedChange={setAwanTampilanPenuh}
          aria-label={t("papan.awanTampilanPenuh")}
        />
      </div>
      <div className="border-t border-border pt-3">
        <KartuKomentator {...kartuKomentator} hanyaKontrol />
      </div>
    </div>
  );
}

/**
 * Popup "Pengaturan Papan" — set bidak, suara, panah engine, tampilan penuh
 * basis data awan, warna papan, plus kontrol komentator. Dipisah dari
 * PapanInteraktif.jsx agar modal pengaturan mudah dirawat sendiri.
 *
 * @param {object} p
 * @param {() => void} p.onTutup                 tutup popup
 * @param {string} p.bidak                       id set bidak yang sedang aktif
 * @param {(id: string) => void} p.setBidak   ganti set bidak
 * @param {object} p.kartuKomentator properti yang diteruskan apa adanya ke
 *        <KartuKomentator> (nyala, setNyala, gaya, setGaya, t)
 */
export default function PopupPengaturan({
  onTutup,
  t,
  ...sisa
}) {
  const refDialog = useDialog(onTutup);
  return (
    <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={onTutup}
                  ><div ref={refDialog}
                      tabIndex={-1}
                      role="dialog"
                      aria-modal="true"
                      aria-label={t("papan.pengaturanPapan")}
                      className="w-full max-w-sm rounded-lg border border-[#312e2b] bg-[#1e1c18] p-5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">{t("papan.pengaturanPapan")}</h3>
                        <button
                          type="button"
                          onClick={onTutup}
                          className="text-gray-400 transition hover:text-gray-200"
                          title={t("papan.tutup")}
                          aria-label={t("papan.tutup")}
                        >
                          ✕
                        </button>
                      </div>
                      <IsiPengaturanPapan t={t} {...sisa} />
                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={onTutup}
                          className="rounded-md border border-[#81b64c] bg-[#81b64c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a3d168]"
                        >
                          {t("papan.tutup")}
                        </button>
                      </div>
                    </div>
                  </div>
  );
}
