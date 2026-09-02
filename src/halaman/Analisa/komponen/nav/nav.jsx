/*
 * Port dari Brilliant-Chess (MIT, © 2025 Delo) — src/components/nav/nav.tsx.
 *
 * Bilah navigasi kiri ala aplikasi upstream: logo + wordmark di atas,
 * tombol Pengaturan di bawahnya, lalu tautan Source Code (repo upstream)
 * dan Atribusi (halaman situs sendiri — /program-kami/atribusi) di dasar
 * bilah. Panel Pengaturan itu sendiri adalah dropdown yang
 * menempel di sisi kanan bilah ini (`navTop:left-full top-0`) — persis
 * seperti upstream — jadi PanelSamping versi lama tidak diperlukan lagi.
 *
 * Dua penyesuaian dari upstream (lihat komentar di kelas):
 *  - `navTop:h-screen`  → `navTop:h-full`  (bilah tingginya area kerja,
 *    bukan layar; area kerja sudah diukur Analisa.jsx di bawah header situs)
 *  - `w-screen`         → `w-full`         (mode ponsel: selebar wadah,
 *    bukan selebar jendela, supaya tidak meluber keluar kontainer halaman)
 *
 * Tautan Source Code sengaja menunjuk ke repo upstream: sekaligus jadi
 * atribusi MIT port UI ini. Logo/wordmark juga dipertahankan sama seperti
 * aslinya.
 */
import { useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ConfigContext } from "../../konteks/config.jsx";
import Gambar from "../Gambar.jsx";
import GitHub from "../svg/github.jsx";
import Lisensi from "../svg/license.jsx";
import Settings from "../pengaturan/settings.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";

/** Repo upstream pemilik desain UI ini (atribusi MIT). */
export const URL_REPO = "https://delta-polder-indonesia.github.io/BintangToba/";

export default function Nav() {
  const { t } = useI18n();
  const configContext = useContext(ConfigContext);

  const [openedMenu, setOpenedMenu] = configContext.openedMenu;
  const boardMenuSettingsRef = configContext.boardMenuSettingsRef;

  const topLinksRef = useRef(null);
  const menuRef = useRef(null);

  const topLinks = [
    {
      label: t("analisa.nav.pengaturan"),
      hover: openSettings,
      icon: `${import.meta.env.BASE_URL}images/analisa/setting.svg`,
    },
  ];

  const botLinks = [
    {
      label: t("analisa.nav.kodeSumber"),
      href: URL_REPO,
      icon: (props) => <GitHub class={props.className} />,
    },
    {
      label: t("analisa.nav.atribusi"),
      to: "/program-kami/atribusi",
      icon: (props) => <Lisensi class={props.className} />,
    },
  ];

  function openSettings() {
    setOpenedMenu("settings");
  }

  function closeMenu() {
    setOpenedMenu(null);
  }

  useEffect(() => {
    function handleClick(e) {
      if (
        !menuRef.current?.contains(e.target)
        && !topLinksRef.current?.contains(e.target)
        && !boardMenuSettingsRef.current?.contains(e.target)
      ) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="flex flex-col navTop:h-full navTop:w-max navTop:shrink-0 w-full relative">
      <div className="navTop:pt-1 navTop:pb-6 navTop:h-full w-full overflow-y-auto bg-backgroundBox flex navTop:flex-col flex-row justify-between select-none navTop:items-start items-stretch">
        <div ref={topLinksRef} className="flex navTop:flex-col flex-row">
          <Link draggable={false} onMouseEnter={() => setOpenedMenu(null)} to="/" className="flex flex-row gap-1 font-extrabold text-xl navTop:p-3 p-1.5 transition-colors hover:bg-backgroundBoxHover hover:text-foregroundHighlighted">
            <Gambar draggable={false} height={30} width={30} alt="logo" src={`${import.meta.env.BASE_URL}images/analisa/logo.svg`} className="navTop:mt-[-2px]" />
            <div className="h-fit w-fit navTop:block hidden">Blunder<span className="text-sm font-light">Skuad</span></div>
          </Link>
          {topLinks.map((link, i) => {
            return (
              <button onClick={link?.click} onMouseEnter={link?.hover} onMouseLeave={link?.unHover} type="button" key={i} className="text-sm outline-none font-bold navTop:px-3 navTop:py-2 p-1.5 hover:bg-backgroundBoxHover hover:text-foregroundHighlighted transition-colors flex flex-row gap-2">
                <Gambar draggable={false} height={18} width={18} alt={link.label} src={link.icon} className="transition-colors" />
                <div className="h-fit w-fit navTop:block hidden">{link.label}</div>
              </button>
            );
          })}
        </div>
        <div className="flex navTop:flex-col flex-row text-sm font-bold navTop:w-full navTop:h-fit">
          {botLinks.map((link, i) => {
            const kelas = "flex flex-row gap-2 h-full navTop:h-fit navTop:px-3 navTop:justify-start justify-center items-center navTop:py-2 p-2 group hover:bg-backgroundBoxHover text-foregroundGrey hover:text-foregroundHighlighted transition-colors";
            return link.to ? (
              <Link draggable={false} key={i} to={link.to} onMouseEnter={() => setOpenedMenu(null)} className={kelas}>
                {link.icon({ className: "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" })}
                <span className="navTop:block hidden">{link.label}</span>
              </Link>
            ) : (
              <a draggable={false} key={i} target="_blank" rel="noreferrer noopener" href={link.href} className={kelas}>
                {link.icon({ className: "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" })}
                <span className="navTop:block hidden">{link.label}</span>
              </a>
            );
          })}
        </div>
      </div>
      <div ref={menuRef} style={{ display: openedMenu ? "" : "none" }} className="navTop:h-full h-fit max-h-[calc(100vh-42px)] navTop:max-h-full z-[500] p-2 bg-backgroundBoxDarker absolute navTop:left-full top-full navTop:top-0 select-none navTop:w-fit w-fit min-w-[300px] overflow-y-auto">
        <Settings hidden={openedMenu !== "settings"} />
      </div>
    </nav>
  );
}
