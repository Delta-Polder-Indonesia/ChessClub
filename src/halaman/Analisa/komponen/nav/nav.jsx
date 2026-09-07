/*
 * Port dari Brilliant-Chess (MIT, © 2025 Delo) — src/components/nav/nav.tsx.
 *
 * Bilah navigasi kiri: logo + wordmark di atas, lalu menu area kerja
 * (Bermain / Baru / Akun / Basis Data / Impor), diikuti tautan Source Code
 * dan Atribusi di dasar bilah.
 *
 * PERUBAHAN BESAR dari upstream (dan dari versi port sebelumnya):
 * menu-menu itu dulu membuka popup modal yang menutupi papan. Sekarang
 * setiap menu memilih LAYAR yang mengisi area kerja — pola yang sama dengan
 * halaman Pengurus (`src/halaman/Pengurus/Dashboard.jsx`): `Sidebar`
 * menyetel `tab`, `<main>` merender panel sesuai `tab`. Di sini `tab`-nya
 * bernama `tampilan` dan hidup di AnalyzeContext, bilah ini hanya
 * menyetelnya. Tidak ada lagi modal: tidak ada latar digelapkan, tidak ada
 * tombol tutup, tidak ada pembajakan tombol Escape (Escape tetap milik
 * pintasan pemutar partai di papan).
 *
 * Konsekuensi penting: papan catur TIDAK pernah dilepas saat layar berganti
 * (lihat `komponen/areaKerja.jsx`), jadi analisis yang sedang berjalan dan
 * panah yang sudah digambar pengguna tetap utuh.
 *
 * Dua penyesuaian lain dari upstream (lihat komentar di kelas):
 *  - `navTop:h-screen`  → `navTop:h-full`  (bilah tingginya area kerja,
 *    bukan layar; area kerja sudah diukur Analisa.jsx di bawah header situs)
 *  - `w-screen`         → `w-full`         (mode ponsel: selebar wadah,
 *    bukan selebar jendela, supaya tidak meluber keluar kontainer halaman)
 *
 * Tautan Source Code sengaja menunjuk ke repo upstream: sekaligus jadi
 * atribusi MIT port UI ini. Logo/wordmark juga dipertahankan sama seperti
 * aslinya.
 */
import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import GitHub from "../svg/github.jsx";
import Lisensi from "../svg/license.jsx";
import Profile from "../svg/profile.jsx";
import Database from "../svg/database.jsx";
import { AnalyzeContext, TAMPILAN_ANALISA } from "../../konteks/analyze.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { berkasPublik } from "../../../../lib/asets.js";

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

/** Ikon "Baru" — papan kosong dengan tanda plus (monokrom, ikut fill). */
function IkonBaru({ className }) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
      <path
        className={className}
        d="M4 3h10a1 1 0 0 1 0 2H5v14h14v-9a1 1 0 0 1 2 0v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm14 0a1 1 0 0 1 1 1v2h2a1 1 0 0 1 0 2h-2v2a1 1 0 0 1-2 0V8h-2a1 1 0 0 1 0-2h2V4a1 1 0 0 1 1-1z"
      />
    </svg>
  );
}

export default function Nav() {
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const [tampilan, setTampilan] = analyzeContext.tampilan;
  const setAkun = analyzeContext.akun[1];
  const setData = analyzeContext.data[1];
  const setPlaying = analyzeContext.playing[1];
  const setPageState = analyzeContext.pageState[1];
  const [game] = analyzeContext.game;
  const [pageState] = analyzeContext.pageState;

  // Konfirmasi dua langkah untuk tombol "Baru": klik pertama bertanya,
  // klik kedua benar-benar mengosongkan papan. Mencegah analisis panjang
  // hilang hanya karena salah tekan.
  const [konfirmasiBaru, setKonfirmasiBaru] = useState(false);
  const timerKonfirmasi = useRef(null);
  useEffect(() => () => window.clearTimeout(timerKonfirmasi.current), []);

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

  /*
   * `kunci` adalah penanda menu yang stabil (dipakai data-uji), sedangkan
   * `tampilan` adalah layar yang dipilihnya. Sengaja dipisah: tombol
   * "Bermain" memilih layar papan, tapi tombol "Baru" bukan layar — ia
   * aksi yang mengosongkan papan lalu kembali ke layar papan.
   */
  const menu = [
    {
      label: t("analisa.nav.play"),
      tampilan: TAMPILAN_ANALISA.BERMAIN,
      icon: () => (
        <img
          src={berkasPublik("/images/color-icon/play-white.svg")}
          alt=""
          draggable="false"
          loading="lazy"
          decoding="async"
          className="h-[18px] w-[18px] shrink-0"
        />
      ),
      kunci: "play",
    },
    {
      label: t("analisa.nav.baru"),
      icon: (props) => <IkonBaru className={props.className} />,
      kunci: "baru",
    },
    {
      label: t("analisa.nav.akun"),
      icon: (props) => <Profile width={18} height={18} class={props.className} />,
      tampilan: TAMPILAN_ANALISA.AKUN,
      kunci: "akun",
    },
    {
      label: t("analisa.nav.database"),
      icon: (props) => <Database width={18} height={18} class={props.className} />,
      tampilan: TAMPILAN_ANALISA.BASIS_DATA,
      kunci: "database",
    },
    {
      label: t("analisa.nav.impor"),
      icon: (props) => <IkonImpor className={props.className} />,
      tampilan: TAMPILAN_ANALISA.IMPOR,
      kunci: "impor",
    },
  ];

  const kelasTombol =
    "flex flex-row gap-2 h-full navTop:h-fit navTop:px-3 navTop:justify-start justify-center items-center navTop:py-2 p-2 group hover:bg-backgroundBoxHover text-foregroundGrey hover:text-foregroundHighlighted transition-colors cursor-pointer";

  /**
   * Tombol "Bermain" = memilih layar papan. Ia TIDAK lagi mengosongkan
   * `data`, `akun`, dan `pageState`: karena papan tidak pernah dilepas,
   * berpindah layar tidak boleh membuang analisis yang sedang direview.
   * Pengosongan papan adalah urutan tombol "Baru".
   */
  function kePapan() {
    setKonfirmasiBaru(false);
    setTampilan(TAMPILAN_ANALISA.BERMAIN);
  }

  /* Ada hasil analisis yang akan hilang bila papan dikosongkan. */
  const adaAnalisa =
    game.length > 0 ||
    pageState === "analyze" ||
    pageState === "analyzeCustom" ||
    pageState === "loading";

  /** Kosongkan papan dan kembali ke layar papan. */
  function kosongkanPapan() {
    window.clearTimeout(timerKonfirmasi.current);
    setKonfirmasiBaru(false);
    setData({ format: "fen", string: "" });
    setAkun({ platform: "", username: "" });
    setPlaying(false);
    setPageState("default");
    setTampilan(TAMPILAN_ANALISA.BERMAIN);
  }

  /**
   * Tombol "Baru" = buang analisis yang ada dan mulai dari posisi awal.
   * Klik pertama hanya bertanya (bila memang ada yang akan hilang); klik
   * kedua baru menjalankannya. Papan kosong tidak perlu ditanya.
   */
  function mulaiBaru() {
    if (!adaAnalisa || konfirmasiBaru) {
      kosongkanPapan();
      return;
    }
    setKonfirmasiBaru(true);
    window.clearTimeout(timerKonfirmasi.current);
    timerKonfirmasi.current = window.setTimeout(() => setKonfirmasiBaru(false), 4000);
  }

  return (
    <nav className="flex flex-col navTop:h-full navTop:w-max navTop:shrink-0 w-full relative">
      <div className="navTop:pt-1 navTop:pb-6 navTop:h-full w-full overflow-y-auto bg-backgroundBox flex navTop:flex-col flex-row justify-between select-none navTop:items-start items-stretch">
        <div className="flex navTop:flex-col flex-row">
          <Link draggable={false} to="/" className="flex flex-row items-center gap-1 navTop:py-2.5 navTop:px-3 p-1.5 transition-colors hover:bg-backgroundBoxHover">
            <span className="navTop:block hidden leading-none font-bold text-[22px] tracking-tight text-foreground">
              Blunder<span className="text-backgroundBoxBoxHighlighted">Skuad</span>
            </span>
          </Link>
          <hr className="border-border mx-2 my-1 navTop:block hidden" />
          <div className="flex navTop:flex-col flex-row">
            {menu.map((item) => {
              // Layar yang sedang tampil ditandai di bilah, persis seperti
              // sidebar dashboard Pengurus menandai tab aktifnya.
              const aktif = Boolean(item.tampilan) && tampilan === item.tampilan;
              // "Baru" menunggu konfirmasi kedua sebelum benar-benar mereset.
              const menungguKonfirmasi = item.kunci === "baru" && konfirmasiBaru;
              const label = menungguKonfirmasi ? t("analisa.nav.baruKonfirmasi") : item.label;
              const keterangan =
                item.kunci === "play"
                  ? t("analisa.nav.playKeterangan")
                  : item.kunci === "baru"
                    ? t("analisa.nav.baruKeterangan")
                    : item.label;
              const aksi =
                item.kunci === "baru"
                  ? mulaiBaru
                  : item.kunci === "play"
                    ? kePapan
                    : () => {
                        setKonfirmasiBaru(false);
                        setTampilan(item.tampilan);
                      };
              return (
                <button
                  key={item.kunci}
                  type="button"
                  data-uji={`nav-${item.kunci}`}
                  title={keterangan}
                  aria-label={keterangan}
                  aria-current={aktif ? "true" : undefined}
                  onClick={aksi}
                  className={`${kelasTombol}${aktif ? " bg-backgroundBoxHover text-foregroundHighlighted" : ""}${
                    menungguKonfirmasi ? " bg-backgroundBoxHover text-lossRed" : ""
                  }`}
                >
                  {item.icon({ className: `transition-colors group-hover:fill-foregroundHighlighted ${aktif ? "fill-foregroundHighlighted" : "fill-foregroundGrey"}` })}
                  <span className="navTop:block hidden">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex navTop:flex-col flex-row text-sm font-bold navTop:w-full navTop:h-fit">
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
    </nav>
  );
}
