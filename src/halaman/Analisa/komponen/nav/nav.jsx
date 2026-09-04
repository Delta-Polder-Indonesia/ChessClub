/*
 * Port dari Brilliant-Chess (MIT, © 2025 Delo) — src/components/nav/nav.tsx.
 *
 * Bilah navigasi kiri: logo + wordmark di atas, lalu dua tombol popup ala
 * en-croissant — "Akun" (tambah akun Chess.com/Lichess) dan "Impor
 * permainan" (PGN/Online/FEN) — diikuti tautan Source Code dan Atribusi di
 * dasar bilah. Popup dibuka di komponen ini; keduanya memakai AnalyzeContext
 * (yang kini membungkus Nav) untuk memuat partai/menganalisis.
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
import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import Gambar from "../Gambar.jsx";
import GitHub from "../svg/github.jsx";
import Lisensi from "../svg/license.jsx";
import Profile from "../svg/profile.jsx";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import PopupAkun from "./popupAkun.jsx";
import PopupImpor from "./popupImpor.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";

/** Repo upstream pemilik desain UI ini (atribusi MIT). */
export const URL_REPO = "https://delta-polder-indonesia.github.io/BintangToba/";

/** Ikon impor sederhana (monokrom, ikut warna kelas fill). */
function IkonImpor({ className }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        className={className}
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 2.5L18.5 8H15V4.5zM8 11h8v2H8v-2zm0 4h8v2H8v-2zm4-10v5h5v.5h-5V5h.75L12.5 5.5z"
      />
    </svg>
  );
}

export default function Nav() {
  const { t } = useI18n();
  const [terbuka, setTerbuka] = useState(null); // null | "akun" | "impor"
  const analyzeContext = useContext(AnalyzeContext);
  const setAkun = analyzeContext.akun[1];
  const setData = analyzeContext.data[1];

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

  const menuPop = [
    {
      label: t("analisa.nav.akun"),
      icon: (props) => <Profile width={18} height={18} class={props.className} />,
      kunci: "akun",
    },
    {
      label: t("analisa.nav.impor"),
      icon: (props) => <IkonImpor className={props.className} />,
      kunci: "impor",
    },
  ];

  const kelasTombol =
    "flex flex-row gap-2 h-full navTop:h-fit navTop:px-3 navTop:justify-start justify-center items-center navTop:py-2 p-2 group hover:bg-backgroundBoxHover text-foregroundGrey hover:text-foregroundHighlighted transition-colors cursor-pointer";

  function tambahAkun(platform, nama) {
    // Kembali ke keadaan formulir dulu, lalu tampilkan tabel partai akun itu.
    setData({ format: "fen", string: "" });
    setAkun({ platform, username: nama });
    setTerbuka(null);
  }

  function imporPartai(data) {
    setTerbuka(null);
    // Diteruskan ke Game lewat AnalyzeContext.data → langsung dianalisis.
    setData(data);
  }

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
          <div className="flex navTop:flex-col flex-row">
            {menuPop.map((item) => (
              <button
                key={item.kunci}
                type="button"
                data-uji={`nav-${item.kunci}`}
                title={item.label}
                aria-label={item.label}
                onClick={() => setTerbuka(item.kunci)}
                className={kelasTombol}
              >
                {item.icon({ className: "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" })}
                <span className="navTop:block hidden">{item.label}</span>
              </button>
            ))}
            <hr className="mx-2 my-1 border-border navTop:block hidden" />
          </div>
          <div className="flex navTop:flex-col flex-row">
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
      </div>
      {terbuka === "akun" ? (
        <PopupAkun onTutup={() => setTerbuka(null)} onTambah={tambahAkun} />
      ) : null}
      {terbuka === "impor" ? (
        <PopupImpor onTutup={() => setTerbuka(null)} onImpor={imporPartai} />
      ) : null}
    </nav>
  );
}
