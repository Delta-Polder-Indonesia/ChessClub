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
import Testimoni from "./Testimoni.jsx";
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
  const [terjeda, setTerjeda] = useState(false);
  const kurangiGerak = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

  /* Gambar hero = elemen LCP halaman. */
  const SLIDES = useMemo(() => [
    { label: "2015 - 2016", sumber: sumberHero("/images/tonggak-2015.jpg") },
    { label: "2016 - 2017", sumber: sumberHero("/images/tonggak-2016.jpg") },
    { label: "2018 - 2019", sumber: sumberHero("/images/tonggak-2018.jpg") },
    { label: "2020 - 2021", sumber: sumberHero("/images/tonggak-2020.jpg") },
    { label: "2022 - 2023", sumber: sumberHero("/images/tonggak-2022.jpg") },
    { label: "2024 - 2025", sumber: sumberHero("/images/tonggak-2024.jpg") },
  ], []);

  useEffect(() => {
    if (terjeda || kurangiGerak) return undefined;
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [index, SLIDES.length, terjeda, kurangiGerak]);

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
    <section
      className="w-full relative bg-transparent pb-16 overflow-hidden"
      onMouseEnter={() => setTerjeda(true)}
      onMouseLeave={() => setTerjeda(false)}
      onFocus={() => setTerjeda(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setTerjeda(false);
      }}
    >
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
                  active && !terjeda && !kurangiGerak
                    ? {
                        animation: `progressbar ${SLIDE_DURATION}ms linear forwards`,
                      }
                    : { transform: active ? "scaleX(1)" : "scaleX(0)" }
                }
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Sampul e-book untuk karusel kartu — bergantian mengikuti kartu aktif. */
const KARTU_GAMBAR = DAFTAR_EBOOK.map((b) => ({
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
    <div className="relative w-full max-w-60 md:max-w-72 lg:max-w-80 xl:max-w-[340px] mx-auto md:mx-0 shrink-0 aspect-[2/3] overflow-hidden bg-black">
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

/** Karusel kartu program — kartu adalah tautan nyata ke halamannya. */
function CardCarousel({ index, setIndex, t }) {
  const kartu = DAFTAR_EBOOK.map((b) => ({
    to: `/program-kami/ebook-panduan/${b.id}`,
    judul: b.judul,
    desk: b.kategori,
  }));
  const n = kartu.length;
  const mid = n;
  const [noAnim, setNoAnim] = useState(false);
  // 320px kartu + 14px gap = 334px langkah. Jendela 2 kartu penuh +
  // 160px (= separuh kartu ketiga) = 828px: muat di kolom kanan yang
  // lebarnya sekitar 940px pada layar 1440px, dan separuh kartu ketiga
  // sekaligus memberi tanda masih ada kelanjutannya.
  const CARD_W = 334;
  const JENDELA = 828;
  // VIRTUALISASI: jangan render seluruh 3×n=96 kartu (960-an node DOM,
  // ~60% dari total DOM landing). Hanya render jendela 6 kartu di
  // sekitar posisi aktif: 1 kartu buffer ke kiri (untuk animasi keluar
  // saat klik "mundur") + 3 kartu terlihat (2 penuh + 1 separuh) +
  // 2 kartu buffer ke kanan (animasi masuk saat klik "maju"). Sisanya
  // digantikan spacer kiri dengan lebar `index * CARD_W` yang
  // mendorong window render ke offset yang benar, sehingga
  // `translateX(-index*CARD_W)` tetap mendarat pada posisi yang
  // persis sama seperti versi 96 kartu. Catatan: index bergerak dalam
  // rentang [0..3n) untuk seamless-loop, jadi kartu ke-i di track
  // virtual = kartu[(i) mod n] (bukan kartu[i] seperti tripled lama).
  const WINDOW_KIRI_BUFFER = 1;
  const WINDOW_KANAN_BUFFER = 2;
  const WINDOW_TERLIHAT = 4;
  const start = Math.max(0, index - WINDOW_KIRI_BUFFER);
  const end = Math.min(3 * n, index + WINDOW_TERLIHAT + WINDOW_KANAN_BUFFER);
  const virtualKartu = [];
  for (let i = start; i < end; i += 1) {
    virtualKartu.push({ ...kartu[i % n], i });
  }

  // Karusel tak berujung: setelah transisi selesai, bila index keluar
  // dari rentang [n..2n), lompat diam-diam ke posisi yang SETARA
  // (kartu yang sama, index digeser n) tanpa animasi. Dalam jendela
  // virtual lompatan ini seketika merender kartu yang benar pada
  // posisi start baru, dan `noAnim` mencegah transition sehingga
  // pengguna tidak melihat perubahan.
  const handleEnd = (e) => {
    if (e.propertyName !== "transform") return;
    if (index >= mid * 2) {
      setNoAnim(true);
      setIndex(index - mid);
    } else if (index < mid) {
      setNoAnim(true);
      setIndex(index + mid);
    }
  };

  useEffect(() => {
    if (!noAnim) return undefined;
    // DUA requestAnimationFrame: frame pertama menjamin lompatan tanpa
    // animasi sempat DIGAMBAR dulu sebelum kelas transisi dipasang lagi.
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setNoAnim(false));
    });
    return () => {
      cancelAnimationFrame(id1);
      if (id2) cancelAnimationFrame(id2);
    };
  }, [noAnim]);

  return (
    <div className="w-full order-2 mt-8 px-6 md:px-0 overflow-hidden">
      <div className="overflow-hidden max-w-full mx-auto" style={{ maxWidth: `${JENDELA}px` }}>
        <div
          // Jarak antar kartu WAJIB 14px — nilai ini harus cocok dengan CARD_W (320+14).
          className={`flex gap-[14px] ${noAnim ? "" : "transition-transform duration-500 ease-in-out"}`}
          style={{ transform: `translateX(-${index * CARD_W}px)` }}
          onTransitionEnd={handleEnd}
        >
          {/* Spacer kiri mengisi ruang kartu yang tidak dirender di kiri
              window. Flex gap tidak termasuk di spacer karena hanya muncul
              di antara elemen flex yang benar-benar dirender — jadi
              spacer lebarnya `start * CARD_W` (kartu 320px + gap 14px
              berikutnya) dan kartu pertama di window mulai di posisi
              yang benar. */}
          {start > 0 && <div aria-hidden="true" style={{ width: `${start * CARD_W}px`, flex: "none" }} />}
          {virtualKartu.map((k) => {
            const isActive = k.i === index;
            const terlihat = k.i >= index && k.i <= index + 2;
            return (
              <Link
                key={`${k.judul}-${k.i}`}
                to={k.to}
                title={k.judul}
                tabIndex={terlihat ? undefined : -1}
                aria-hidden={!terlihat || undefined}
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
          onClick={() => setIndex((i) => i - 1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-grey-300 rounded-lg hover:bg-primary hover:border-primary transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowRightIcon className="size-6 text-grey-600 rotate-180 group-hover:text-white transition-colors" />
        </button>
        <button
          type="button"
          aria-label={t("landing.selanjutnya")}
          onClick={() => setIndex((i) => i + 1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-grey-300 rounded-lg hover:bg-primary hover:border-primary transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowRightIcon className="size-6 text-grey-600 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}

function BagianGambarKartu({ t }) {
  const [index, setIndex] = useState(4);
  return (
    <section className="w-full relative py-16 overflow-hidden">
      <div className="w-full max-w-[1500px] mx-auto px-[clamp(22px,4vw,56px)] relative flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
        <CardGambar index={index} t={t} />
        <div className="w-full flex flex-col">
            {/* Kepala seksi disusun vertikal: judul → deskripsi.
                Label "Perpustakaan" beserta titiknya dihapus dari kartu besar
                dan dari kolom ini, jadi yang tersisa hanya judul dan
                deskripsi. Kunci terjemahan `pustakaLabel` juga dibuang karena
                tidak lagi terpakai di mana pun.
                Jarak antarbaris: 32px di bawah judul, supaya hierarkinya
                terbaca. Batas lebar `md:max-w-[620px]` milik `.hero-left`
                sumber dilepas: kartu besar di kiri hanya 340px, jadi kolom
                620px menyisakan ruang kosong besar di kanan halaman. */}
            {/* Judul dipaksa satu baris (`whitespace-nowrap`) sesuai permintaan: dengan
                lebar 620px, ukuran display sumber `clamp(3rem,9vw,4.5rem)`
                membuat "Pustaka & Modul Catur" membelah dan naik-turunnya
                terbaca sebagai teks menumpuk. Ukuran diturunkan ke
                `clamp(1.5rem,4.4vw,3.25rem)` — batas atas 52px sudah muat
                satu baris di kolom 620px, batas bawah 24px agar tetap muat di
                layar 320px setelah padding `clamp(22px,4vw,56px)`.
                Lebar 620px dianggap sebagai batas keras: kalau di layar sempit
                judul meluber, turunkan `whitespace-nowrap`. */}
            <h2 className="font-serif font-extralight text-[clamp(1.5rem,4.4vw,3.25rem)] leading-[1.1] tracking-[0em] text-grey-800 whitespace-nowrap">
              {t("landing.pustakaHeading")}
            </h2>
            {/* `.hero-body` sumber: 1rem / 300 / 1.6 / `text-wrap: pretty`.
                Batas `max-width: 56ch` milik sumber dinaikkan ke 72ch karena
                kolom kini jauh lebih lebar; 56ch akan menyisakan ruang kosong
                besar di kanan. 72ch masih di bawah ambang keterbacaan satu
                baris (sekitar 90–100ch). */}
            <p className="mt-8 font-serif text-[1rem] font-light leading-[1.6] text-grey-600 max-w-[72ch] text-pretty">
              {t("landing.pustakaKeterangan")}
            </p>
            {/* Baris syarat dan tombol "Lihat kurikulum" ikut pindah ke sini
                dari kartu unggulan seksi TigaJalan yang sudah dihapus,
                karena yang ditunjuk adalah
                katalog e-book ini sendiri: posisinya langsung di bawah
                deskripsi katalog, bukan di seksi lain. */}
            <p className="mt-6 font-serif text-[0.8125rem] text-grey-600">
              {t("landing.tigaJalanAkademiTerms")}
            </p>
            <div className="mt-4">
              <Tombol to="/program-kami/ebook-panduan" variant="garis">
                {t("landing.tigaJalanAkademiCta")}
                <ArrowRightIcon className="size-4" />
              </Tombol>
            </div>
            {/* Deretan kartu kecil pindah ke bawah deskripsi, di dalam kolom
                kanan. Sebelumnya ikut_flow penuh di bawah kartu besar, sehingga
                seksi setinggi kartu besar + carousel. Sekarang ruang kosong di
                sebelah kanan kartu besar ikut terpakai. */}
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
      <Testimoni />

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