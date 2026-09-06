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
import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import GitHub from "../svg/github.jsx";
import Lisensi from "../svg/license.jsx";
import Profile from "../svg/profile.jsx";
import Database from "../svg/database.jsx";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import PopupAkun from "./popupAkun.jsx";
import { bacaDaftarAkun, tambahKeDaftar } from "../../akun/daftarAkun.js";
import PopupDatabase from "./popupDatabase.jsx";
import PopupImpor from "./popupImpor.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { berkasPublik } from "../../../../lib/asets.js";

/** Repo upstream pemilik desain UI ini (atribusi MIT). */
export const URL_REPO = "https://delta-polder-indonesia.github.io/BintangToba/";

/** Batas minimal lebar layar saat Nav jadi bilah kiri (lihat --breakpoint-navTop). */
const LEBAR_NAV_TOP = 516;

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
  const [terbuka, setTerbuka] = useState(null); // null | "akun" | "database" | "impor"
  const analyzeContext = useContext(AnalyzeContext);
  const setAkun = analyzeContext.akun[1];
  const setData = analyzeContext.data[1];
  const [pageState, setPageState] = analyzeContext.pageState;
  const setPlaying = analyzeContext.playing[1];
  const [game] = analyzeContext.game;

  // Konfirmasi dua langkah untuk tombol "Baru": klik pertama bertanya,
  // klik kedua benar-benar mengosongkan papan. Mencegah analisis panjang
  // hilang hanya karena salah tekan.
  const [konfirmasiBaru, setKonfirmasiBaru] = useState(false);
  const timerKonfirmasi = useRef(null);
  useEffect(() => () => window.clearTimeout(timerKonfirmasi.current), []);

  const navRef = useRef(null);
  const [lebarNav, setLebarNav] = useState(0);

  // Lebar bilah kiri dipakai popup Database full layar supaya sisinya
  // "mentok" mengikuti navbar, bukan mereka mengikuti tepi layar.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    function ukur() {
      setLebarNav(window.innerWidth >= LEBAR_NAV_TOP ? el.offsetWidth : 0);
    }
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    window.addEventListener("resize", ukur);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", ukur);
    };
  }, []);

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
    label: t("analisa.nav.play"),
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
    kunci: "akun",
  },
    {
      label: t("analisa.nav.database"),
      icon: (props) => <Database width={18} height={18} class={props.className} />,
      kunci: "database",
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
    // Kembali ke keadaan formulir dulu, lalu tampilkan statistik akun itu.
    // Akun juga dicatat ke daftar (kolom kiri layar akun) agar selalu tampil.
    setData({ format: "fen", string: "" });
    tambahKeDaftar({ platform, username: nama });
    setAkun({ platform, username: nama });
    setTerbuka(null);
  }

  function imporPartai(data) {
    setTerbuka(null);
    // Diteruskan ke Game lewat AnalyzeContext.data → langsung dianalisis.
    setData(data);
  }

  /**
   * Menu "Akun" — membuka LAYAR AKUN (daftar + statistik dua kolom) bila sudah
   * ada akun tersimpan, bukan selalu modal "Tambah akun". Ini meniru perilaku
   * menu Accounts pada En Croissant (halaman /accounts yang persisten): sekali
   * akun didaftarkan & datanya ditarik, kembali ke "Akun" tetap menampilkan
   * daftar + statistik yang sama — tidak reset ke formulir tambah.
   */
  function bukaAkun() {
    setKonfirmasiBaru(false);
    const daftar = bacaDaftarAkun();
    const aktif = analyzeContext.akun[0];
    if (daftar.length === 0 && !aktif?.username) {
      // Belum ada akun sama sekali → modal tambah akun (keadaan awal).
      setTerbuka("akun");
      return;
    }
    // Ada akun tersimpan → tampilkan layar akun; pilih akun pertama bila belum
    // ada yang aktif, sehingga statistiknya langsung tampil.
    setTerbuka(null);
    setData({ format: "fen", string: "" });
    if (!aktif?.username) {
      const pertama = daftar[0] || aktif;
      setAkun({ platform: pertama.platform, username: pertama.username });
    }
    setPlaying(false);
    setPageState("default");
  }

  /**
   * Tombol "Bermain" = kembali ke papan, BUKAN tombol reset.
   *
   * Dulu tombol ini selalu mengosongkan `data`, `akun`, dan `pageState`,
   * sehingga menekannya sesudah mereview partai membuang seluruh hasil
   * analisis dan papan kembali ke keadaan awal. Sekarang urutannya:
   *
   *  1. Ada popup terbuka  → cukup tutup popup. Analisis yang sedang
   *     direview tetap utuh — inilah gunanya: keluar dari popup Database
   *     tanpa harus mencari tombol tutup.
   *  2. Tidak ada popup, tapi ada partai yang sedang/sudah dianalisis →
   *     tidak melakukan apa pun; papannya memang sudah tampil.
   *  3. Tidak ada popup dan belum ada analisis (mis. masih melihat daftar
   *     partai sebuah akun) → bersihkan pilihan itu supaya kembali ke papan
   *     awal. Tidak ada analisis yang hilang karena memang belum ada.
   */
  const adaAnalisa =
    game.length > 0 ||
    pageState === "analyze" ||
    pageState === "analyzeCustom" ||
    pageState === "loading";

  /** Kosongkan papan untuk analisis baru (dengan konfirmasi bila ada isinya). */
  function mulaiBaru() {
    setTerbuka(null);
    if (adaAnalisa && !konfirmasiBaru) {
      setKonfirmasiBaru(true);
      window.clearTimeout(timerKonfirmasi.current);
      timerKonfirmasi.current = window.setTimeout(() => setKonfirmasiBaru(false), 4000);
      return;
    }
    window.clearTimeout(timerKonfirmasi.current);
    setKonfirmasiBaru(false);
    setData({ format: "fen", string: "" });
    setAkun({ platform: "", username: "" });
    setPlaying(false);
    setPageState("default");
  }

  function kePapan() {
    setKonfirmasiBaru(false);
    if (terbuka) {
      setTerbuka(null);
      return;
    }
    if (adaAnalisa) return;
    setData({ format: "fen", string: "" });
    setAkun({ platform: "", username: "" });
    setPlaying(false);
    setPageState("default");
  }

  return (
    <nav ref={navRef} className="flex flex-col navTop:h-full navTop:w-max navTop:shrink-0 w-full relative">
      <div className="navTop:pt-1 navTop:pb-6 navTop:h-full w-full overflow-y-auto bg-backgroundBox flex navTop:flex-col flex-row justify-between select-none navTop:items-start items-stretch">
        <div className="flex navTop:flex-col flex-row">
          <Link draggable={false} to="/" className="flex flex-row items-center gap-1 navTop:py-2.5 navTop:px-3 p-1.5 transition-colors hover:bg-backgroundBoxHover">
            <span className="navTop:block hidden leading-none font-bold text-[22px] tracking-tight text-foreground">
              Blunder<span className="text-backgroundBoxBoxHighlighted">Skuad</span>
            </span>
          </Link>
          <hr className="border-border mx-2 my-1 navTop:block hidden" />
          <div className="flex navTop:flex-col flex-row">
            {menuPop.map((item) => {
              // Saat popup terbuka, "Bermain" adalah jalan keluarnya —
              // ditonjolkan supaya terlihat sebagai tombol kembali ke papan.
              const jalanKeluar = item.kunci === "play" && Boolean(terbuka);
              // "Baru" menunggu konfirmasi bila ada analisis yang akan hilang.
              const menungguKonfirmasi = item.kunci === "baru" && konfirmasiBaru;
              const label = menungguKonfirmasi ? t("analisa.nav.baruKonfirmasi") : item.label;
              const keterangan =
                item.kunci === "play"
                  ? t("analisa.nav.playKeterangan")
                  : item.kunci === "baru"
                    ? t("analisa.nav.baruKeterangan")
                    : item.label;
              const aksi =
                item.kunci === "play"
                  ? kePapan
                  : item.kunci === "baru"
                    ? mulaiBaru
                    : item.kunci === "akun"
                      ? bukaAkun
                      : () => {
                          setKonfirmasiBaru(false);
                          setTerbuka(item.kunci);
                        };
              return (
              <button
                key={item.kunci}
                type="button"
                data-uji={`nav-${item.kunci}`}
                title={keterangan}
                aria-label={keterangan}
                onClick={aksi}
                className={`${kelasTombol}${jalanKeluar ? " bg-backgroundBoxHover text-foregroundHighlighted" : ""}${
                  menungguKonfirmasi ? " bg-backgroundBoxHover text-lossRed" : ""
                }`}
              >
                {item.icon({ className: "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" })}
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
      {terbuka === "akun" ? (
        <PopupAkun onTutup={() => setTerbuka(null)} onTambah={tambahAkun} lebarKiri={lebarNav} />
      ) : null}
      {terbuka === "database" ? (
        <PopupDatabase
          onTutup={() => setTerbuka(null)}
          onAnalisa={imporPartai}
          onBukaAkun={bukaAkun}
          lebarKiri={lebarNav}
        />
      ) : null}
      {terbuka === "impor" ? (
        <PopupImpor onTutup={() => setTerbuka(null)} onImpor={imporPartai} lebarKiri={lebarNav} />
      ) : null}
    </nav>
  );
}
