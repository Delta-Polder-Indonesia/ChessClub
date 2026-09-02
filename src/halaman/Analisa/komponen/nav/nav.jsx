/*
 * Port dari Brilliant-Chess (MIT, © 2025 Delo) — src/components/nav/nav.tsx.
 *
 * Bilah navigasi kiri: logo + wordmark di atas, lalu tautan Source Code
 * (repo) dan Atribusi (halaman situs sendiri — /program-kami/atribusi)
 * di dasar bilah. Panel pengaturan (Tema papan, Label, Langkah, Langkah
 * terbaik) dipindah ke popup gear BoardMenu, jadi tidak ada lagi tombol
 * Pengaturan di bilah ini.
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
import { Link } from "react-router-dom";
import Gambar from "../Gambar.jsx";
import GitHub from "../svg/github.jsx";
import Lisensi from "../svg/license.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";

/** Repo upstream pemilik desain UI ini (atribusi MIT). */
export const URL_REPO = "https://delta-polder-indonesia.github.io/BintangToba/";

export default function Nav() {
  const { t } = useI18n();

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

  return (
    <nav className="flex flex-col navTop:h-full navTop:w-max navTop:shrink-0 w-full relative">
      <div className="navTop:pt-1 navTop:pb-6 navTop:h-full w-full overflow-y-auto bg-backgroundBox flex navTop:flex-col flex-row justify-between select-none navTop:items-start items-stretch">
        <div className="flex navTop:flex-col flex-row">
          <Link draggable={false} to="/" className="flex flex-row gap-1 font-extrabold text-xl navTop:p-3 p-1.5 transition-colors hover:bg-backgroundBoxHover hover:text-foregroundHighlighted">
            <Gambar draggable={false} height={30} width={30} alt="logo" src={`${import.meta.env.BASE_URL}images/analisa/logo.svg`} className="navTop:mt-[-2px]" />
            <div className="h-fit w-fit navTop:block hidden">Blunder<span className="text-sm font-light">Skuad</span></div>
          </Link>
        </div>
        <div className="flex navTop:flex-col flex-row text-sm font-bold navTop:w-full navTop:h-fit">
          {botLinks.map((link, i) => {
            const kelas = "flex flex-row gap-2 h-full navTop:h-fit navTop:px-3 navTop:justify-start justify-center items-center navTop:py-2 p-2 group hover:bg-backgroundBoxHover text-foregroundGrey hover:text-foregroundHighlighted transition-colors";
            return link.to ? (
              <Link draggable={false} key={i} to={link.to} className={kelas}>
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
    </nav>
  );
}
