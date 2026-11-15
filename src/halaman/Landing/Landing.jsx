/**
 * Landing page (Beranda utama).
 *
 * Struktur halaman terinspirasi pola umum situs korporat — hero carousel
 * tonggak sejarah, tiga jalan belajar, testimoni, sekilas komunitas,
 * keberlanjutan, karusel kartu program + e-book, harapan pengurus, dan ajakan
 * bergabung — tetapi seluruh
 * markup, komponen, dan konten di berkas ini ditulis dari nol khusus
 * untuk Komunitas Catur Indonesia. Tidak ada kode maupun teks yang
 * disalin dari situs pihak lain.
 *
 * TIPOGRAFI SEKSI — pilot "adopsi Impeccable" (2026-09-30, direvisi dengan
 * token asli): seluruh judul seksi (`h2`), label kecil beraksen, paragraf
 * pengantar, dan judul/deskripsi kartu di halaman ini memakai gaya bersama
 * dari `./gayaTeks.jsx`. Nilainya BUKAN perkiraan — disalin literal dari
 * token desain situs sumber (`_astro/kinpaku_tokens.czfxn__5.css` +
 * `base.dh9lpkoi.css` + `sub_pages.dr6kqi_x.css` pada
 * `Delta-Polder-Indonesia/Halaman_sample`), dengan satu penyimpangan sengaja
 * (ukuran label dibulatkan ke 12px, floor DESIGN.md). Ini pengecualian
 * tercatat terhadap skala H2 global DESIGN.md §2/§6, khusus halaman ini;
 * rincian lengkap dan batasnya ada di
 * `.agents/skills/kci-frontend/references/standar-galeri.md` §2b. Skala ini
 * TIDAK berlaku untuk halaman lain dan TIDAK PERNAH untuk komponen catur.
 */
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Tombol } from "../../components/Tombol.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, pramuatGambar, sumberGambar, sumberHero } from "../../lib/asets.js";
import { COVER, DAFTAR_EBOOK } from "../Beranda/ebook-data.js";
import { ArrowRightIcon, CloseIcon } from "../../components/icons.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { KartuAlatLatihan } from "./KartuAlatLatihan.jsx";

/*
 * Seksi "Teka-teki Hari Ini" dimuat lazy: ia menarik `PapanStatis` → chunk
 * bidak (±126 KB) yang tidak dibutuhkan elemen LCP halaman depan. Dengan
 * `lazy`, pengunjung yang langsung menggulir tetap melihat seksi ini, tetapi
 * gambar hero tidak lagi bersaing dengan potongan JS tersebut.
 */
const TekaTekiHarianLanding = lazy(() => import("./TekaTekiHarianLanding.jsx"));
import MaestroEdision from "./MaestroEdision.jsx";
import KerangkaTekaTekiHarian from "./KerangkaTekaTekiHarian.jsx";
import RatingUlasan from "./RatingUlasan.jsx";
import {
  JUDUL_SEKSI,
  JUDUL_SEKSI_TERANG,
  LEAD_SEKSI,
  LEAD_SEKSI_TERANG,
  LABEL_SEKSI_TERANG,
  JUDUL_POSTER,
  TitikLabel,
} from "./gayaTeks.jsx";

const SLIDE_DURATION = 7000;

/** Hero carousel — slide full-width gambar + overlay gelap + navigasi garis progress. */
function LandingHero({ t }) {
  const [index, setIndex] = useState(0);

  /* Gambar hero = elemen LCP halaman. */
  const SLIDES = useMemo(() => [
    { label: "2015 - 2016", sumber: sumberHero("/images/tonggak-2015.jpg") },
    { label: "2016 - 2017", sumber: sumberHero("/images/tonggak-2016.jpg") },
    { label: "2018 - 2019", sumber: sumberHero("/images/tonggak-2018.jpg") },
    { label: "2020 - 2021", sumber: sumberHero("/images/tonggak-2020.jpg") },
    { label: "2022 - 2023", sumber: sumberHero("/images/tonggak-2022.jpg") },
    { label: "2024 - 2025", sumber: sumberHero("/images/tonggak-2024.jpg") },
  ], []);

  // Selaraskan dengan carousel Tonggak: setTimeout berjalan tetap,
  // tidak bergantung pada hover/fokus atau preferensi gerak sistem.
  // CSS progress bar di-reset melalui key saat index berubah.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [index, SLIDES.length]);

  // Pra-unduh gambar slide BERIKUTNYA. Tanpa ini, peralihan slide pertama
  // kali sempat memperlihatkan latar gelap kosong karena gambar slide
  // baru baru mulai dimuat tepat saat crossfade berlangsung.
  useEffect(() => {
    const berikut = SLIDES[(index + 1) % SLIDES.length];
    const pra = new window.Image();
    pra.decoding = "async";
    pra.src = berikut.sumber.src;
  }, [index, SLIDES]);

  return (
    /* TANPA padding atas: header publik `fixed` dan `bg-transparent` selama
       40px guliran pertama, jadi foto hero harus mulai tepat di y=0 — sama
       seperti `components/Hero.jsx` di halaman lain. Dulu seksi ini `py-16`,
       sehingga 64px teratas halaman memperlihatkan kanvas `body` (putih) di
       belakang header: tautan top-bar putih tak terbaca dan logo terpotong
       dua warna. Padding bawah tetap `pb-16` untuk jarak ke seksi berikut.
       Tinggi 650px juga harus sama dengan `#boot-hero` di index.html dan
       `PlaceholderHalaman`, supaya tidak ada lompatan saat React mount. */
    <section className="w-full relative bg-transparent pb-16 overflow-hidden">
      <div className="w-full relative h-full min-h-[650px] overflow-hidden">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.label}
            className={`w-full absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            style={{ zIndex: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <div className="w-full relative h-full min-h-[650px] bg-hero">
              <img
                {...slide.sumber}
                alt=""
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchpriority={i === 0 ? "high" : undefined}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none bg-black/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Blok "Sekilas / Tentang Kami" dipindahkan ke paling atas hero.
          Foto `/images/sekilas.webp` tidak lagi dipakai di sini: hero sudah
          memakai foto tonggak sebagai latar dengan `bg-black/50`, jadi blok
          ini menjadi teks putih di atas foto itu. Token `_TERANG` tetap
          dipakai karena latar hero gelap. */}
      <div className="absolute inset-x-0 top-0 z-10 w-full mx-auto max-w-[1080px] xl:max-w-7xl px-6 lg:px-8 xl:px-0 pt-56 md:pt-64 flex flex-col items-start gap-[14px]">
        <p className={LABEL_SEKSI_TERANG}>
          <TitikLabel terang />
          {t("landing.sekilasLabel")}
        </p>
        <h2 className={JUDUL_SEKSI_TERANG}>{t("nav.tentangKami")}</h2>
        <p className={`${LEAD_SEKSI_TERANG} max-w-2xl`}>{t("landing.sekilasDesk")}</p>
        <div className="flex flex-wrap gap-4 mt-8">
          <Link
            to="/tentang-kami"
            // Label "Selengkapnya" dipakai lebih dari satu tautan di halaman
            // ini; tanpa konteks, pembaca layar (dan audit
            // identical-links-same-purpose) tidak bisa membedakan tujuannya.
            aria-label={`${t("common.selengkapnya")}: ${t("nav.tentangKami")}`}
            className="inline-flex items-center gap-2 border border-white font-sans text-white font-semibold text-sm px-6 py-3 rounded hover:bg-white hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            {t("common.selengkapnya")}
            <ArrowRightIcon className="size-4 -rotate-45" />
          </Link>
          <Link
            to="/tentang-kami/struktur-grup-catur"
            className="inline-flex items-center gap-2 border border-white font-sans text-white font-semibold text-sm px-6 py-3 rounded hover:bg-white hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
          >
            {t("landing.ketuaPengurus")}
            <ArrowRightIcon className="size-4 -rotate-45" />
          </Link>
        </div>
      </div>

      {/* Navigasi garis progress — di bawah gambar */}
      <div className="absolute bottom-24 left-0 right-0 z-10 lg:max-w-[960px] xl:max-w-[1280px] mx-auto flex gap-2 px-8 md:px-10 lg:px-4 xl:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <button
              key={slide.label}
              type="button"
              aria-label={slide.label}
              aria-current={active ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={`swiper-pagination-line relative flex-1 min-w-[120px] cursor-pointer py-2 md:py-4 transition-colors duration-300 text-left text-[13px] font-sans font-medium group border-b-[3px] border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                active ? "text-white" : "text-white/50"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <svg
                  className={`bullet-dot w-2 h-2 md:w-3 md:h-3 transition-opacity duration-300 group-hover:opacity-100 ${
                    active ? "text-blue-400 opacity-100" : "opacity-10"
                  }`}
                  viewBox="0 0 8 8"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="4" cy="4" r="4" fill="currentColor" />
                </svg>
                <div className="bullet-title transition-colors duration-300 group-hover:text-white whitespace-nowrap">
                  {slide.label}
                </div>
              </div>
              <div
                key={active ? `progress-${index}` : undefined}
                className="bullet-progress absolute bottom-[-3px] border-b-[3px] border-blue-400 pointer-events-none"
                style={
                  active
                    ? { animation: `progressbar ${SLIDE_DURATION}ms linear forwards` }
                    : { transform: "scaleX(0)" }
                }
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Sampul e-book untuk karusel kartu — bergantian mengikuti kartu aktif.
 *  Dibatasi 4 judul pertama agar selaras dengan karusel di bawahnya
 *  (4 kartu e-book + 1 kartu penutup "Lihat Semua Ebook"). */
const KARTU_GAMBAR = DAFTAR_EBOOK.slice(0, 4).map((b) => ({
  id: b.id,
  judul: b.judul,
  img: gambar(COVER[b.id]),
  // `sizes` dipakai browser untuk memilih kandidat: di ponsel sampul ini
  // selebar kotak potret (± 288px), di layar sedang dibatasi max-w 400px.
  // Keduanya tertutup oleh varian 640w dari manifest, jadi ponsel tidak lagi
  // menarik berkas 1024px.
  sumber: sumberGambar(COVER[b.id], { sizes: "(min-width: 768px) 340px, 240px" }),
}));

function CardGambar({ index, t }) {
  const total = KARTU_GAMBAR.length;
  const aktif = ((index % total) + total) % total;

  // Double-buffer state management
  const [currentImg, setCurrentImg] = useState(aktif);
  const [nextImg, setNextImg] = useState(null);
  const [animating, setAnimating] = useState(false);

  // Deteksi perubahan indeks aktif dari karusel
  useEffect(() => {
    if (aktif !== currentImg) {
      setNextImg(aktif);
      setAnimating(false); // Jangan animasi dulu sebelum gambar baru benar-benar di-load browser
    }
  }, [aktif, currentImg]);

  // Hangatkan dua sampul tetangga (maju & mundur) di latar belakang
  useEffect(() => {
    const berikut = (aktif + 1) % total;
    const sebelum = (aktif - 1 + total) % total;
    pramuatGambar(KARTU_GAMBAR[berikut].sumber);
    pramuatGambar(KARTU_GAMBAR[sebelum].sumber);
  }, [aktif, total]);

  // Handler ketika gambar baru pada transition-layer telah sepenuhnya dimuat browser
  const handleImageLoad = () => {
    setAnimating(true); // Mulai transisi fade-in
  };

  // Handler ketika transisi css selesai
  const handleTransitionEnd = () => {
    if (animating && nextImg !== null) {
      setCurrentImg(nextImg); // Jadikan gambar baru sebagai gambar dasar (base)
      setNextImg(null); // Kosongkan lapisan transisi
      setAnimating(false); // Reset status animasi
    }
  };

  return (
    <div className="relative hidden w-full max-w-60 shrink-0 aspect-[2/3] overflow-hidden bg-black md:block md:max-w-72 lg:max-w-80 xl:max-w-[340px]">
      {/* LAPISAN DASAR: Selalu stabil dan terlihat di bawah */}
      <img
        key={`base-${KARTU_GAMBAR[currentImg].id}`}
        {...KARTU_GAMBAR[currentImg].sumber}
        alt=""
        draggable="false"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{ opacity: 1 }}
      />

      {/* LAPISAN TRANSISI: Muncul di atas lapisan dasar hanya saat memuat gambar baru */}
      {nextImg !== null && (
        <img
          key={`next-${KARTU_GAMBAR[nextImg].id}`}
          {...KARTU_GAMBAR[nextImg].sumber}
          alt=""
          draggable="false"
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageLoad} // Fail-safe jika terjadi error, agar transisi tidak macet
          onTransitionEnd={handleTransitionEnd}
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ease-in-out"
          style={{
            opacity: animating ? 1 : 0,
            pointerEvents: "none",
          }}
        />
      )}

      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 xl:px-10 py-10 flex flex-col items-start gap-[14px] z-10 pointer-events-none">
        <h2 className={JUDUL_POSTER}>{t("landing.pustakaJudul")}</h2>
        <p className={LEAD_SEKSI_TERANG}>{t("landing.pustakaDesk")}</p>
      </div>
    </div>
  );
}

/** Karusel kartu e-book — 4 kartu e-book + 1 kartu penutup
 *  "Lihat Semua Ebook" di ujungnya. Kartu adalah tautan nyata ke
 *  halamannya; kartu penutup menuju katalog /program-kami/ebook-panduan.
 *  Karusel ini berujung (finite): tombol mundur/maju nonaktif di
 *  ujungnya, tidak berputar tak berujung seperti versi sebelumnya. */
function CardCarousel({ index, setIndex, t }) {
  const kartu = [
    ...DAFTAR_EBOOK.slice(0, 4).map((b, i) => ({
      to: `/program-kami/ebook-panduan/${b.id}`,
      judul: b.judul,
      desk: b.kategori,
      sumber: KARTU_GAMBAR[i].sumber,
      penghujung: false,
    })),
    {
      to: "/program-kami/ebook-panduan",
      judul: t("landing.lihatSemuaEbookJudul"),
      desk: t("landing.lihatSemuaEbookDesk"),
      penghujung: true,
    },
  ];
  const n = kartu.length;
  const aktif = Math.min(Math.max(index, 0), n - 1);
  // 320px kartu + 14px gap = 334px langkah. Jendela 2 kartu penuh +
  // 160px (= separuh kartu ketiga) = 828px: muat di kolom kanan yang
  // lebarnya sekitar 940px pada layar 1440px, dan separuh kartu ketiga
  // sekaligus memberi tanda masih ada kelanjutannya.
  const CARD_W = 334;
  const JENDELA = 828;
  // Geseran maksimum supaya kartu penutup berhenti pas di tepi kanan
  // jendela, bukan melompat jauh menyisakan ruang kosong.
  const GESER_MAKS = Math.max(0, n * CARD_W - JENDELA);
  const geser = Math.min(aktif * CARD_W, GESER_MAKS);

  return (
    <>
      {/* Di ponsel, gunakan pola katalog buku: grid dua kolom dengan sampul
          dan metadata. Ini menggantikan kartu 320px yang terpotong di jendela
          carousel desktop. Terinspirasi tata letak produk Book Hub, bukan
          menyalin markup atau asetnya. */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:hidden">
        {kartu.map((k, i) => (
          k.penghujung ? (
            <Link
              key="lihat-semua-ebook-mobile"
              to={k.to}
              className="col-span-2 flex min-h-[112px] items-center justify-between gap-4 rounded-xl bg-primary px-5 py-4 text-white shadow-sm transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span className="min-w-0">
                <span className="block font-sans text-lg font-semibold leading-tight">{k.judul}</span>
                <span className="mt-1 block font-serif text-sm leading-snug text-white/80">{k.desk}</span>
              </span>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                <ArrowRightIcon className="size-5 text-white" />
              </span>
            </Link>
          ) : (
            <Link
              key={`ebook-mobile-${i}`}
              to={k.to}
              title={k.judul}
              className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-grey-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-grey-100 p-2.5">
                <img
                  {...k.sumber}
                  sizes="(max-width: 639px) 44vw, 220px"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex min-h-[112px] flex-1 flex-col p-3">
                <span className="mb-1.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.08em] text-primary">
                  {k.desk}
                </span>
                <h3 className="line-clamp-3 font-sans text-sm font-semibold leading-snug text-grey-800">
                  {k.judul}
                </h3>
                <span className="mt-auto flex items-center justify-end pt-2 text-grey-500 group-hover:text-primary" aria-hidden="true">
                  <ArrowRightIcon className="size-4 -rotate-45" />
                </span>
              </div>
            </Link>
          )
        ))}
      </div>

      <div className="hidden w-full order-2 mt-8 overflow-hidden md:block">
      <div className="overflow-hidden max-w-full mx-auto" style={{ maxWidth: `${JENDELA}px` }}>
        <div
          // Jarak antar kartu WAJIB 14px — nilai ini harus cocok dengan CARD_W (320+14).
          className="flex gap-[14px] transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${geser}px)` }}
        >
          {kartu.map((k, i) => {
            const isActive = i === aktif;
            if (k.penghujung) {
              return (
                <Link
                  key="lihat-semua-ebook"
                  to={k.to}
                  title={k.judul}
                  className="flex-none w-[320px] h-[168px] pt-[18px] px-[18px] pb-[14px] rounded-lg border gap-[14px] flex flex-col items-center justify-center text-center relative cursor-pointer bg-primary border-primary text-white hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <h3 className="font-sans text-[1.0625rem] font-semibold leading-[1.35] text-balance text-white">
                    {k.judul}
                  </h3>
                  <p className="font-serif text-sm leading-[1.6] text-pretty text-white/80">
                    {k.desk}
                  </p>
                  <ArrowRightIcon className="size-6 shrink-0 text-white" />
                </Link>
              );
            }
            return (
              <Link
                key={`${k.judul}-${i}`}
                to={k.to}
                title={k.judul}
                className={`flex-none w-[320px] h-[168px] pt-[18px] px-[18px] pb-[14px] rounded-lg border gap-[14px] flex flex-col justify-between relative cursor-pointer ${
                  isActive
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-grey-200 text-grey-800 hover:bg-primary hover:border-primary group"
                }`}
              >
                <h3
                  className={`font-sans text-[0.94rem] leading-[1.5] text-balance -tracking-[0.01em] line-clamp-4 ${isActive ? "text-white" : "text-grey-800 group-hover:text-white"}`}
                >
                  {k.judul}
                </h3>
                <div className="flex flex-col gap-[10px]">
                  <div className={`h-[2px] w-full rounded-sm ${isActive ? "bg-white" : "bg-grey-800"}`} />
                  <div className="flex items-end justify-between gap-3">
                    <p className={`font-mono text-[0.82rem] leading-[1.2] tracking-[0.01em] truncate ${isActive ? "text-white/90" : "text-grey-600 group-hover:text-white"}`}>
                      {k.desk}
                    </p>
                    <ArrowRightIcon className={`size-6 shrink-0 -rotate-45 ${isActive ? "text-white" : "text-grey-600 group-hover:text-white"}`} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 items-center pr-[18px] mx-auto" style={{ maxWidth: `${JENDELA}px` }}>
        <button
          type="button"
          aria-label={t("landing.sebelumnya")}
          disabled={aktif <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="w-10 h-10 flex items-center justify-center bg-white border border-grey-300 rounded-lg hover:bg-primary hover:border-primary transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-grey-300"
        >
          <ArrowRightIcon className="size-6 text-grey-600 rotate-180 group-hover:text-white transition-colors" />
        </button>
        <button
          type="button"
          aria-label={t("landing.selanjutnya")}
          disabled={aktif >= n - 1}
          onClick={() => setIndex((i) => Math.min(n - 1, i + 1))}
          className="w-10 h-10 flex items-center justify-center bg-white border border-grey-300 rounded-lg hover:bg-primary hover:border-primary transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-grey-300"
        >
          <ArrowRightIcon className="size-6 text-grey-600 group-hover:text-white transition-colors" />
        </button>
      </div>
      </div>
    </>
  );
}

function BagianGambarKartu({ t }) {
  const [index, setIndex] = useState(0);
  return (
    <section className="relative w-full overflow-hidden py-10 md:py-16">
      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-center md:gap-12 md:px-[clamp(22px,4vw,56px)]">
        <CardGambar index={index} t={t} />
        <div className="flex w-full flex-col">
        <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-primary md:hidden">
          {t("landing.pustakaJudul")}
        </p>
        <h2 className="font-serif font-extralight text-[clamp(1.65rem,7.5vw,2.5rem)] leading-[1.08] tracking-normal text-grey-800 lg:text-[clamp(1.5rem,4.4vw,3.25rem)] lg:whitespace-nowrap">
          {t("landing.pustakaHeading")}
        </h2>
        <p className="mt-4 max-w-[72ch] font-serif text-base font-light leading-[1.65] text-grey-600 text-pretty md:mt-8">
          {t("landing.pustakaKeterangan")}
        </p>
        <p className="mt-4 font-serif text-[0.8125rem] text-grey-600 md:mt-6">
          {t("landing.tigaJalanAkademiTerms")}
        </p>
        <CardCarousel index={index} setIndex={setIndex} t={t} />
          </div>
      </div>
    </section>
  );
}

/** Pratinjau foto di dalam halaman — pengganti tautan ke berkas gambar mentah.
 *  Fokus masuk ke tombol tutup, Tab berputar di dalam dialog, Escape dan klik
 *  latar menutup, lalu fokus kembali ke tombol pemicu. */
function PratinjauFoto({ terbuka, foto, alt, onTutup, t }) {
  const tutupRef = useRef(null);

  useEffect(() => {
    if (!terbuka) return undefined;
    const pemicu = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onTutup();
      else if (e.key === "Tab") {
        e.preventDefault();
        tutupRef.current?.focus();
      }
    };
    const overflowSebelum = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    tutupRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflowSebelum;
      if (pemicu instanceof HTMLElement) pemicu.focus();
    };
  }, [terbuka, onTutup]);

  if (!terbuka) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onTutup}
    >
      <button
        type="button"
        ref={tutupRef}
        onClick={onTutup}
        aria-label={t("landing.harapanTutupFoto")}
        className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <CloseIcon className="size-6" />
      </button>
      <img
        src={foto}
        alt={alt}
        decoding="async"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-auto max-w-[92vw] rounded-lg object-contain"
      />
    </div>
  );
}

/** Harapan dan terima kasih — pola "pesan pimpinan" halaman korporat:
 *  foto di kiri (diklik untuk pratinjau besar di dalam halaman), artikel rata
 *  kiri-kanan di kanan, ditutup blok nama dan jabatan pengurus. */
function HarapanTerimaKasih({ t }) {
  const foto = gambar("/images/harapan-terima-kasih.jpg");
  // Kotak foto maximal 500px; pratinjau besar memakai berkas WebP penuh.
  const sumberFoto = sumberGambar("/images/harapan-terima-kasih.jpg", {
    sizes: "(min-width: 1024px) 42vw, 92vw",
  });
  const [pratinjau, setPratinjau] = useState(false);
  const tutupPratinjau = useCallback(() => setPratinjau(false), []);
  return (
    <section className="w-full relative bg-transparent py-16 pl-6 pr-6 md:pl-8 md:pr-8">
      <div className="relative w-full mx-auto grid grid-cols-1 lg:grid-cols-[0.678fr_1.02fr] gap-x-4 md:gap-x-8 lg:gap-x-10 gap-y-4 lg:max-w-[960px] xl:max-w-[1280px]">
        {/* Kolom foto */}
        <div className="w-full relative bg-transparent">
          <div className="relative w-full mx-auto grid place-items-center lg:min-h-[560px]">
            <div className="flex justify-center items-center w-full">
              <button
                type="button"
                onClick={() => setPratinjau(true)}
                aria-label={t("landing.harapanBukaFoto")}
                className="block cursor-zoom-in rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <img
                  {...sumberFoto}
                  width="836"
                  height="1254"
                  alt={t("landing.harapanAltFoto")}
                  title={t("landing.harapanAltFoto")}
                  draggable="false"
                  decoding="async"
                  loading="lazy"
                  className="w-full max-w-[400px] h-auto rounded-lg object-cover object-center"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Kolom artikel */}
        <div className="w-full relative bg-transparent md:pt-4 xl:pt-4">
          <div className="relative w-full mx-auto flex flex-col gap-y-6">
            <h2 className={JUDUL_SEKSI}>{t("landing.harapanJudul")}</h2>
            <div className="relative z-[1] font-serif prose-kci max-w-none">
              <p>{t("landing.harapanPembuka")}</p>
              <p>{t("landing.harapanP1")}</p>
              <p>{t("landing.harapanP2")}</p>
              <p>{t("landing.harapanP3")}</p>
              <p>{t("landing.harapanTutup1")}</p>
              <p>{t("landing.harapanTutup2")}</p>
              <p>{t("landing.harapanTutup3")}</p>
            </div>
            <div className="w-full relative bg-transparent">
              <p className="font-serif font-semibold text-lg text-grey-800">
                {t("landing.harapanNama")}
              </p>
              <p className="mt-1 font-serif text-[0.8125rem] text-grey-600">
                {t("landing.harapanJabatan")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <PratinjauFoto
        terbuka={pratinjau}
        foto={foto}
        alt={t("landing.harapanAltFoto")}
        onTutup={tutupPratinjau}
        t={t}
      />
    </section>
  );
}

/** Ajakan bergabung — penutup halaman. */
function AjakanBergabung({ t }) {
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 text-center overflow-hidden">
      <div className="mx-auto max-w-4xl flex flex-col items-center">
        <div className="flex flex-col items-center gap-[14px] text-center">
          <h2 className={JUDUL_SEKSI}>
            {t("landing.ajakanJudul")} <em className="text-primary not-italic">{t("landing.ajakanJudulAccent")}</em>
          </h2>
          <p className={LEAD_SEKSI}>{t("landing.ajakanDeskripsi")}</p>
        </div>
        <Tombol to="/pendaftaran-anggota" variant="garis" className="mt-8">
          {t("landing.ajakanTombol")}
          <ArrowRightIcon className="size-4" />
        </Tombol>
      </div>
    </section>
  );
}

export default function Landing() {
  const { t } = useI18n();

  return (
    <div className="w-full overflow-x-hidden">
      <MetaHalaman
        title={t("common.judulBeranda")}
        description={t("landing.metaDeskripsi")}
      />
      {/* H1 utama halaman — hero sengaja visual murni, jadi judul halaman
          disediakan tersembunyi untuk pembaca layar & mesin pencari. */}
      <h1 className="sr-only font-serif">{t("common.namaKomunitas")}</h1>
      <LandingHero t={t} />
      <Suspense fallback={<KerangkaTekaTekiHarian />}>
        <TekaTekiHarianLanding />
      </Suspense>
      <RatingUlasan />

      {/* `bg-white` dihapus: seksi ini satu-satunya yang berlatar putih murni,
          sedangkan seksi lain tidak punya kelas latar dan mewarisi
          `--color-paper` (#f8f8f8) dari `body`. Akibatnya di sini pernah
          muncul garis sambungan karena putih murni #fff bersebelahan
          dengan paper #f8f8f8. */}
      <section className="w-full pl-6 md:pl-8 pr-6 md:pr-8 py-16 overflow-hidden">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] flex flex-col gap-y-4 md:gap-y-6 lg:gap-y-2">
          <div className="w-full grid lg:grid-cols-[82%_18%] gap-x-10 gap-y-6 items-start">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-x-10 gap-y-4 md:gap-y-6 items-start">
              <h2 className={JUDUL_SEKSI}>{t("nav.keberlanjutan")}</h2>
              <p className={LEAD_SEKSI}>{t("landing.keberlanjutanDesk")}</p>
            </div>
            <div className="flex">
              <Tombol
                to="/keberlanjutan"
                variant="garis"
                aria-label={`${t("common.selengkapnya")}: ${t("nav.keberlanjutan")}`}
                className="h-12 px-4 md:px-6"
              >
                <span className="order-1">{t("common.selengkapnya")}</span>
                <ArrowRightIcon className="size-5 order-2" />
              </Tombol>
            </div>
          </div>
        </div>
      </section>

      <BagianGambarKartu t={t} />

      <KartuAlatLatihan />

      <HarapanTerimaKasih t={t} />

      <MaestroEdision />

      <AjakanBergabung t={t} />
    </div>
  );
}