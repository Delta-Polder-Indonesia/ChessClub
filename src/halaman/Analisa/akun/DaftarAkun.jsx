/*
 * Kolom kiri layar akun — responsive mobile: kartu full width di HP.
 */
import { useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import KartuAkun from "./KartuAkun.jsx";
import FormulirAkun from "./FormulirAkun.jsx";
import Profile from "../komponen/svg/profile.jsx";

export default function DaftarAkun({ daftar, aktif, onPilih, onHapus, onTambah }) {
  const { t } = useI18n();
  const [buka, setBuka] = useState(false);
  const list = daftar || [];

  if (buka) {
    return (
      <div className="flex h-full w-full flex-col gap-3 overflow-y-auto rounded-borderRoundness border border-border bg-backgroundBox p-3 sm:p-4">
        <FormulirAkun
          judul={t("analisa.akun.judul")}
          subjudul={t("analisa.akun.isi")}
          onBatal={() => setBuka(false)}
          onTambah={(platform, nama) => {
            onTambah(platform, nama);
            setBuka(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden">
      {list.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-6 sm:py-8 text-center">
          <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-backgroundBoxBoxHighlighted/20">
            <Profile width={30} height={30} class="fill-backgroundBoxBoxHighlighted" />
          </div>
          <p className="text-sm sm:text-base font-bold text-foreground">{t("analisa.akun.kosongJudul")}</p>
          <p className="max-w-xs text-xs sm:text-sm leading-5 text-foregroundGrey">{t("analisa.akun.kosongIsi")}</p>
          <button
            type="button"
            data-uji="tambah-akun-kosong"
            onClick={() => setBuka(true)}
            className="mt-1 cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-4 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover"
          >
            {t("analisa.akun.tambahBaru")}
          </button>
        </div>
      ) : (
        <>
          <div className="px-2 sm:px-3 pt-1">
            <p className="text-sm font-bold text-foreground">{t("analisa.akun.daftar")}</p>
            <div className="mt-2 w-full border-b border-border" />
          </div>
          <div className="flex min-h-0 flex-1 flex-col sm:flex-wrap sm:flex-row content-start justify-start gap-2 sm:gap-3 overflow-y-auto pb-1">
            {list.map((a) => (
              <div key={`${a.platform}:${a.username}`} className="min-w-0 w-full sm:max-w-[300px]">
                <KartuAkun
                  platform={a.platform}
                  username={a.username}
                  aktif={aktif?.platform === a.platform && String(aktif?.username || "").toLowerCase() === String(a.username || "").toLowerCase()}
                  onPilih={() => onPilih(a.platform, a.username)}
                  onHapus={() => onHapus(a.platform, a.username)}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            data-uji="tambah-akun"
            onClick={() => setBuka(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2.5 text-sm font-bold text-foregroundGrey transition-colors hover:border-borderHighlighted hover:text-foregroundHighlighted"
          >
            <span className="text-base leading-none">+</span>
            {t("analisa.akun.tambahBaru")}
          </button>
        </>
      )}
    </div>
  );
}
