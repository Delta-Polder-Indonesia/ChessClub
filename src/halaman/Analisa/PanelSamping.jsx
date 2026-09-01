/* Fitur Analisa — kerangka halaman ChessClub (bukan port). */
import { useContext, useEffect, useRef } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { ConfigContext } from "./konteks/config.jsx";
import Settings from "./komponen/pengaturan/settings.jsx";

/**
 * Laci pengaturan yang menutupi tepi kanan area analisis.
 *
 * upstream menaruh panel ini di dalam `Nav` (bilah navigasi sendiri berisi
 * logo, tautan lisensi, dan atribusi). Situs ini sudah punya header sendiri,
 * jadi yang dipindah hanya lacinya: tombol di BoardMenu membuka
 * `openedMenu = "settings"` dan laci ini menutup diri begitu klik terjadi di
 * luar — persis seperti perilaku aslinya.
 */
function PanelSamping() {
  const { t } = useI18n();
  const configContext = useContext(ConfigContext);
  const [openedMenu, setOpenedMenu] = configContext.openedMenu;
  const boardMenuSettingsRef = configContext.boardMenuSettingsRef;
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (
        !menuRef.current?.contains(e.target)
        && !boardMenuSettingsRef?.current?.contains(e.target)
      ) {
        setOpenedMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [setOpenedMenu, boardMenuSettingsRef]);

  return (
    <div
      ref={menuRef}
      style={{ display: openedMenu ? "" : "none" }}
      className="absolute right-0 top-0 z-[500] h-full w-fit min-w-[300px] max-w-[92vw] overflow-y-auto bg-backgroundBoxDarker select-none flex flex-col"
    >
      <div className="flex flex-row items-center justify-between gap-2 p-2 pb-0">
        <span className="text-sm font-bold text-foregroundGrey">{t("analisa.pengaturan.judul")}</span>
        <button
          type="button"
          onClick={() => setOpenedMenu(null)}
          className="rounded-borderRoundness px-2 py-1 text-sm font-bold text-foregroundGrey hover:bg-backgroundBoxHover hover:text-foregroundHighlighted transition-colors"
        >
          {t("analisa.pengaturan.tutup")}
        </button>
      </div>
      <p className="px-2 py-1 text-xs text-foregroundGrey">{t("analisa.pengaturan.petunjuk")}</p>
      <Settings hidden={openedMenu !== "settings"} />
    </div>
  );
}

export { PanelSamping as default };
