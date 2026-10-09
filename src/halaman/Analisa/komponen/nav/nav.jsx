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
 *
 * TATA LETAK BURGER (bilah menciut) disamakan dengan blok sidebar contoh
 * (`src/components/ui/sidebar.jsx` + contoh prompt.md), tanpa memindahkan
 * bilah ini ke komponen itu:
 *  - lebar menciut 3rem (`w-12`), sama dengan `--sidebar-width-icon` di
 *    komponen sidebar;
 *  - setiap tombol menu (dan burger) menjadi kotak 2rem (`w-8 h-8`) dengan
 *    bantalan 8px yang TETAP di kedua keadaan (pola `group-data-
 *    [collapsible=icon]:size-8 p-2` di komponen sidebar), sehingga ikon
 *    duduk tepat di tengah lajur dan tidak bergeser saat burger ditekan —
 *    yang menyusut hanya lebar tombol, gap, dan labelnya (max-width +
 *    opacity);
 *  - burger duduk di baris kepala bersama wordmark; saat bilah menciut,
 *    wordmark ikut menyusut habis sehingga tidak ada teks terpotong dan
 *    burger tinggal sendiri di tengah lajur;
 *  - `title`/`aria-label` tiap tombol sudah menjadi pengganti tooltip.
 */
import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import GitHub from "../svg/github.jsx";
import Lisensi from "../svg/license.jsx";
import Profile from "../svg/profile.jsx";
import Database from "../svg/database.jsx";
import ShieldAlert from "../svg/shield-alert.jsx";
import { Settings } from "lucide-react";
import { AnalyzeContext, TAMPILAN_ANALISA } from "../../konteks/analyzeKonteks.js";
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
  const [navTerbuka, setNavTerbuka] = useState(true);
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
          width={18}
          height={18}
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
    {
      label: t("analisa.nav.deteksiEngine"),
      icon: () => <ShieldAlert className="h-[18px] w-[18px] shrink-0" />,
      tampilan: TAMPILAN_ANALISA.DETEKSI_ENGINE,
      kunci: "deteksi-engine",
    },
    {
      label: t("analisa.nav.pengaturan"),
      icon: () => <Settings className="h-[18px] w-[18px] shrink-0" />,
      tampilan: TAMPILAN_ANALISA.PENGATURAN,
      kunci: "pengaturan",
    },
  ];

  /**
   * Kelas tombol menu.
   *
   * Mode ponsel (di bawah `navTop`): bilah mendatar, tombol melebar rata
   * tanpa label (`h-full`, label memang `hidden` di lebar ini).
   *
   * Mode bilah tegak: tombol SELALU `navTop:w-full` — lebarnya mengikuti
   * bilah tanpa transisi sendiri, sama seperti Sidebar Pengurus. Saat bilah
   * menciut, kontainer yang berukuran 3rem membuat tombol ikut 2rem secara
   * otomatis (8 + 2rem + 8), jadi ikon diam total; yang beranimasi hanya
   * lebar bilah dan labelnya. Menganimasikan lebar tombol (w-full ↔ w-8)
   * justru membuat ikon berkedip: di tengah transisi tombol melebihi
   * lebar bilah yang sedang menyusut dan sesaat terpotong overflow.
   */
  // min-h-10 (40px) hanya di mode ponsel: target sentuh minimum yang nyaman
  // (audit Lighthouse "touch targets"); di bilah tegak desktop tinggi tetap h-8.
  const kelasTombol = `flex flex-row gap-2 h-full min-h-10 navTop:min-h-0 navTop:h-8 navTop:px-2 navTop:justify-start justify-center items-center navTop:py-0 p-2 group hover:bg-backgroundBoxHover text-foregroundGrey hover:text-foregroundHighlighted transition-colors cursor-pointer navTop:w-full`;

  /**
   * Label menu yang bisa menciut (max-width/opacity) saat bilah ditutup —
   * persis perilaku sidebar Pengurus: ikon diam, label menyusut.
   */
  const kelasLabelNav = `overflow-hidden whitespace-nowrap transform-gpu transition-[max-width,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hidden navTop:block text-sm font-bold ${
    navTerbuka ? "navTop:max-w-[140px] navTop:opacity-100" : "navTop:max-w-0 navTop:opacity-0"
  }`;

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
    <nav className={`flex flex-col navTop:h-full w-full relative ${navTerbuka ? "navTop:w-[210px]" : "navTop:w-12"} navTop:shrink-0 navTop:will-change-[width] navTop:transition-[width] navTop:duration-300 navTop:ease-[cubic-bezier(0.22,1,0.36,1)]`}>
      {/*
        `navTop:px-2` = bantalan 8px lajur: 3rem rail = 8 + 2rem + 8
        (sama dengan bantalan SidebarContent + SidebarMenuButton di
        `components/ui/sidebar.jsx`).
        `navTop:overflow-x-hidden`: `overflow-y-auto` menurut spesifikasi
        memaksa overflow-x jadi auto juga, sehingga overflow pecahan piksel
        selama animasi lebar memunculkan scrollbar horizontal — yang
        menggeser tata letak dan membuat ikon berkedip. Sidebar Pengurus
        memakai `overflow-hidden` untuk alasan yang sama.
      */}
      <div className="navTop:pt-1 navTop:pb-6 navTop:px-2 navTop:h-full w-full overflow-y-auto navTop:overflow-x-hidden bg-backgroundBox flex navTop:flex-col flex-row justify-between select-none navTop:items-start items-stretch">
        <div className="flex navTop:flex-col flex-row">
          {/*
            Baris kepala: burger + wordmark. Burger hanya ada di bilah tegak
            (di mode ponsel bilahnya sudah mendatar, tidak ada yang bisa
            dibuka-tutup); wordmark mengekor di sebelahnya dan menyusut
            habis saat bilah menciut, jadi tidak ada teks terpotong.
          */}
          <div className="flex flex-row items-center gap-1 navTop:w-full navTop:py-1">
            <button
              type="button"
              data-uji="nav-tutup"
              onClick={() => setNavTerbuka((t) => !t)}
              title={navTerbuka ? t("analisa.nav.tutupBilah") : t("analisa.nav.bukaBilah")}
              aria-label={navTerbuka ? t("analisa.nav.tutupBilah") : t("analisa.nav.bukaBilah")}
              aria-expanded={navTerbuka}
              className="hidden navTop:flex navTop:shrink-0 items-center justify-center w-8 h-8 navTop:px-2 group hover:bg-backgroundBoxHover text-foregroundGrey hover:text-foregroundHighlighted transition-colors cursor-pointer"
            >
              <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link
              draggable={false}
              to="/"
              /*
               * Wordmark-nya `hidden` di mode ponsel — tanpa aria-label
               * tautan ini kosong bagi pembaca layar (temuan audit
               * Lighthouse "links do not have a discernible name").
               */
              aria-label={t("analisa.nav.beranda")}
              className={`min-w-0 min-h-10 navTop:min-h-0 flex-row items-center navTop:py-1 p-1.5 transition-colors hover:bg-backgroundBoxHover ${
                navTerbuka ? "flex" : "navTop:hidden"
              }`}
            >
              <span
                className={`hidden navTop:block leading-none font-bold text-[17px] tracking-tight text-foreground overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  navTerbuka ? "max-w-[140px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Blunder<span className="text-backgroundBoxBoxHighlighted">Skuad</span>
              </span>
            </Link>
          </div>
          <hr className="border-border mx-2 navTop:mx-0 my-1 navTop:block hidden" />
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
                  {/*
                    Ikon dibungkus span `shrink-0`: UA stylesheet menyetel
                    `overflow: hidden` pada svg, sehingga menurut spesifikasi
                    flexbox ia kehilangan min-width:auto dan BISA menyusut
                    di bawah 18px saat ruang tombol sempit (rail menciut).
                  */}
                  <span className="flex shrink-0">
                    {item.icon({ className: `transition-colors group-hover:fill-foregroundHighlighted ${aktif ? "fill-foregroundHighlighted" : "fill-foregroundGrey"}` })}
                  </span>
                  <span className={kelasLabelNav}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex navTop:flex-col flex-row text-sm font-bold navTop:w-full navTop:h-fit">
          <div className="flex navTop:flex-col flex-row">
            {botLinks.map((link, i) => {
              // Kelas yang sama dengan tombol menu: selalu `navTop:w-full`,
              // ikon diam saat bilah menciut (lihat kelasTombol).
              const kelas = `flex flex-row gap-2 h-full min-h-10 navTop:min-h-0 navTop:h-8 navTop:px-2 navTop:justify-start justify-center items-center navTop:py-0 p-2 group hover:bg-backgroundBoxHover text-foregroundGrey hover:text-foregroundHighlighted transition-colors navTop:w-full`;
              // Label teksnya `hidden` di mode ponsel — aria-label wajib ada
              // supaya tautan tetap bernama bagi pembaca layar (audit
              // Lighthouse "links do not have a discernible name").
              return link.to ? (
                <Link draggable={false} key={i} to={link.to} aria-label={link.label} className={kelas}>
                  <span className="flex shrink-0">
                    {link.icon({ className: "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" })}
                  </span>
                  <span className={kelasLabelNav}>{link.label}</span>
                </Link>
              ) : (
                <a draggable={false} key={i} target="_blank" rel="noreferrer noopener" href={link.href} aria-label={link.label} className={kelas}>
                  <span className="flex shrink-0">
                    {link.icon({ className: "fill-foregroundGrey transition-colors group-hover:fill-foregroundHighlighted" })}
                  </span>
                  <span className={kelasLabelNav}>{link.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
