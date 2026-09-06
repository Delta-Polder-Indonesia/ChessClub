/*
 * Kolom kiri layar akun — meniru komponen Accounts pada En Croissant:
 * menampilkan daftar kartu akun (KartuAkun) untuk setiap pemain yang sudah
 * didaftarkan, puis tombol "Tambahkan akun". Bila belum ada akun, tampilkan
 * ajakan kosong dengan tombol tambah (gaya EmptyAccounts). Tombol tambah
 * membuka modal PopupAkun yang sudah ada.
 */
import { useState } from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import KartuAkun from "./KartuAkun.jsx";
import PopupAkun from "../komponen/nav/popupAkun.jsx";
import Profile from "../komponen/svg/profile.jsx";

export default function DaftarAkun({ daftar, aktif, onPilih, onHapus, onTambah, onRefresh }) {
  const { t } = useI18n();
  const [buka, setBuka] = useState(false);
  const list = daftar || [];

  return (
    <div className="flex h-full w-full flex-col gap-3 overflow-hidden">
      {list.length === 0 ? (
        /* Keadaan kosong — sama seperti EmptyAccounts en-croissant */
        <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-backgroundBoxBoxHighlighted/20">
            <Profile width={30} height={30} class="fill-backgroundBoxBoxHighlighted" />
          </div>
          <p className="text-base font-bold text-foreground">{t("analisa.akun.kosongJudul")}</p>
          <p className="max-w-xs text-sm leading-5 text-foregroundGrey">{t("analisa.akun.kosongIsi")}</p>
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
          <div className="flex items-center justify-between px-3 pt-1">
            <span className="text-sm font-bold text-foreground">{t("analisa.akun.daftar")}</span>
            <span className="text-xs text-foregroundGrey">{list.length}</span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-1">
            {list.map((a) => (
              <KartuAkun
                key={`${a.platform}:${a.username}`}
                platform={a.platform}
                username={a.username}
                aktif={aktif?.platform === a.platform && String(aktif?.username || "").toLowerCase() === String(a.username || "").toLowerCase()}
                onPilih={() => onPilih(a.platform, a.username)}
                onHapus={() => onHapus(a.platform, a.username)}
                onRefresh={() => onRefresh?.(a.platform, a.username)}
              />
            ))}
          </div>
          <button
            type="button"
            data-uji="tambah-akun"
            onClick={() => setBuka(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-sm font-bold text-foregroundGrey transition-colors hover:border-borderHighlighted hover:text-foregroundHighlighted"
          >
            <span className="text-base leading-none">+</span>
            {t("analisa.akun.tambahBaru")}
          </button>
        </>
      )}

      {buka ? (
        <PopupAkun
          lebarKiri={0}
          onTutup={() => setBuka(false)}
          onTambah={(platform, nama) => {
            onTambah(platform, nama);
            setBuka(false);
          }}
        />
      ) : null}
    </div>
  );
}
