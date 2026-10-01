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
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Puzzle } from "lucide-react";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, pramuatGambar, sumberGambar, sumberHero } from "../../lib/asets.js";
import { COVER, DAFTAR_EBOOK } from "../Beranda/ebook-data.js";
import { ArrowRightIcon } from "../../components/icons.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { KartuAlatLatihan } from "./KartuAlatLatihan.jsx";
import MaestroEdision from "./MaestroEdision.jsx";
import Testimoni from "./Testimoni.jsx";
import {
  JUDUL_SEKSI,
  JUDUL_SEKSI_TERANG,
  LEAD_SEKSI,
  LEAD_SEKSI_TERANG,
  LABEL_SEKSI_TERANG,
  JUDUL_POSTER,
  JUDUL_PANEL,
  DESKRIPSI_PANEL,
  TitikLabel,
} from "./gayaTeks.jsx";

const SLIDE_DURATION = 7000;

/** Hero carousel — slide full-width gambar + overlay gelap + navigasi garis progress. */
function LandingHero({ t }) {
  const [index, setIndex] = useState(0);

  /* Gambar hero = elemen LCP halaman. sumberHero() memberi 828w untuk ponsel
     (berkas yang sama dengan <link rel=preload> + <div id=boot-hero> di
     index.html, jadi tidak ada gambar yang diunduh dua kali) dan 1280w untuk
     layar lebar. */
  const SLIDES = [
    { label: "2015 - 2016", sumber: sumberHero("/images/tonggak-2015.jpg") },
    { label: "2016 - 2017", sumber: sumberHero("/images/tonggak-2016.jpg") },
    { label: "2018 - 2019", sumber: sumberHero("/images/tonggak-2018.jpg") },
    { label: "2020 - 2021", sumber: sumberHero("/images/tonggak-2020.jpg") },
    { label: "2022 - 2023", sumber: sumberHero("/images/tonggak-2022.jpg") },
    { label: "2024 - 2025", sumber: sumberHero("/images/tonggak-2024.jpg") },
  ];

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
  }, [index]);

  return (
    <section className="w-full relative bg-transparent pb-20 overflow-hidden">
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
              {i === index && (
                <img
                  {...slide.sumber}
                  alt=""
                  width={1280}
                  height={714}
                  decoding="async"
                  fetchpriority="high"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
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
      <div className="absolute bottom-24 left-0 right-0 z-10 lg:max-w-[960px] xl:max-w-[1280px] mx-auto flex space-x-2 px-8 md:px-10 lg:px-4 xl:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SLIDES.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.label}
              role="button"
              tabIndex={0}
              aria-label={slide.label}
              aria-current={active ? "true" : undefined}
              onClick={() => setIndex(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIndex(i);
                }
              }}
              className={`swiper-pagination-line relative flex-1 min-w-[120px] cursor-pointer py-2 md:py-4 transition-all duration-300 text-[13px] font-sans font-medium group border-b-[3px] border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                active ? "text-white" : "text-white/50"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <svg
                  className={`bullet-dot w-2 h-2 md:w-3 md:h-3 transition-all duration-300 group-hover:opacity-100 ${
                    active ? "text-blue-400 opacity-100" : "opacity-10"
                  }`}
                  viewBox="0 0 8 8"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="4" cy="4" r="4" fill="currentColor" />
                </svg>
                <div className="bullet-title transition-all duration-300 group-hover:text-white whitespace-nowrap">
                  {slide.label}
                </div>
              </div>
              <div
                key={active ? `progress-${index}` : undefined}
                className="bullet-progress absolute bottom-[-3px] border-b-[3px] border-blue-400 pointer-events-none"
                style={
                  active
                    ? {
                        animation: `progressbar ${SLIDE_DURATION}ms linear forwards`,
                      }
                    : { transform: "scaleX(0)" }
                }
              />
            </div>
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
    to: `/program-kami/ebook-panduan?buku=${b.id}`,
    judul: b.judul,
    desk: b.kategori,
  }));
  const n = kartu.length;
  const tripled = [...kartu, ...kartu, ...kartu];
  const mid = n;
  const [noAnim, setNoAnim] = useState(false);
  // 320px kartu + 14px gap = 334px langkah. Jendela 4 x 334 = 1336px -> 4 kartu
  // terlihat penuh; kartu pada `i === index` selalu berada di tepi kiri dan
  // utuh, jadi penanda biru jatuh pada kartu pertama yang tidak terpotong.
  // 320px kartu + 14px gap = 334px langkah. Jendela 2 kartu penuh +
  // 160px (= separuh kartu ketiga) = 828px: muat di kolom kanan yang
  // lebarnya sekitar 940px pada layar 1440px, dan separuh kartu ketiga
  // sekaligus memberi tanda masih ada kelanjutannya. 3 kartu utuh
  // (988px) tidak muat di lebar itu sehingga kartu ketiga terpotong penuh.
  const CARD_W = 334;
  const JENDELA = 828;

  // Karusel tak berujung: salinan tengah, dari mid sampai dua kali mid,
  // yang tampil. Setelah transisi selesai, bila index keluar dari rentang
  // itu, lompat diam-diam ke posisi yang SETARA (kartu yang sama, index
  // digeser mid) tanpa animasi. Rumus index digeser mid — bukan selalu
  // kembali ke mid seperti versi lama — memastikan klik cepat yang
  // melewati batas tetap mendarat pada kartu yang sama; versi lama
  // melompat ke kartu salah.
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
    // Dengan satu frame saja kedua pembaruan bisa menyatu dalam satu
    // paint, sehingga lompatan malah tampak sebagai geseran mundur.
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
          // Kalau hanya kartu yang diubah jadi `gap-[14px]` tetapi track tetap
          // `gap-5`, langkah sebenarnya 340px sementara transform menggeser
          // 334px: kartu aktif bergeser 6px ke kanan tiap langkah dan kartu
          // sebelumnya menyingkap dari tepi kiri.
          className={`flex gap-[14px] ${noAnim ? "" : "transition-transform duration-500 ease-in-out"}`}
          style={{ transform: `translateX(-${index * CARD_W}px)` }}
          onTransitionEnd={handleEnd}
        >
          {tripled.map((k, i) => {
            const isActive = i === index;
            // Kartu kecil TIDAK memakai transisi warna sama sekali.videMarkup
            // Alasannya: `isActive` berubah seketika ketika tombol diklik,
            // sementara posisinya masih bergeser 500 ms. Bila warna ikut
            // bertransisi 150 ms, kartu yang baru menjadi aktif masih WHITE
            // selama 500 ms pertama dan kartu yang keluar masih biru, lalu
            // garisnya memudar putih → hitam setelah penanda biru pindah —
            // terlihat seperti garis nyasar. Warna aktif kini berubah
            // seketika, jadi tidak ada yang bisa "tinggal". Yang tetap
            // dianimasikan hanya pergeseran track (lihat kelas di track).
            return (
              <Link
                key={`${k.judul}-${i}`}
                to={k.to}
                title={k.judul}
                // Kartu 320x168, padding 18/18/14, jarak 14 — nilai `.t-card--plinth`
                // di `index.duybiyfa.css`. Judul memakai skala `.t-card-quote`
                // (.94rem/1.5, clamp 4) dan kategori skala `.t-name` (.82rem).
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
                {/* Garis horizontal penuh menggantikan bar aksen pendek `w-6`:
                    kini membentang di atas baris kategori + panah, dengan
                    kategori di kiri dan panah miring di kanan. */}
                <div className="flex flex-col gap-[10px]">
                  {/* Garis hitam pada kartu biasa; pada kartu yang sedang aktif (biru
                    penuh) garis ikut putih agar kontras. `group-hover:bg-white`
                    dan `transition-colors` keduanya sudah dihapus: yang
                    pertama membuat garis ikut putih pada kartu yang kebetulan
                    lewat di bawah kursor, yang kedua membuat garis putih pada
                    kartu keluar memudar terlambat setelah penanda biru pindah. */}
                  <div className={`h-[2px] w-full rounded-sm ${isActive ? "bg-white" : "bg-black"}`} />
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
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-primary hover:border-primary transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowRightIcon className="size-6 text-grey-600 rotate-180 group-hover:text-white transition-colors" />
        </button>
        <button
          type="button"
          aria-label={t("landing.selanjutnya")}
          onClick={() => setIndex((i) => i + 1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-300 rounded-lg hover:bg-primary hover:border-primary transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
    <section className="w-full relative py-12 md:py-14 overflow-hidden">
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
            <h2 className="font-serif font-extralight text-[clamp(1.5rem,4.4vw,3.25rem)] leading-[1.1] tracking-[0em] text-grey-900 whitespace-nowrap">
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
            <p className="mt-6 font-serif text-[0.8125rem] text-slate-500">
              {t("landing.tigaJalanAkademiTerms")}
            </p>
            <div className="mt-4">
              <Link
                to="/program-kami/ebook-panduan"
                className="inline-flex items-center gap-2 border border-primary bg-transparent font-sans text-primary font-semibold text-sm px-8 py-3 rounded transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("landing.tigaJalanAkademiCta")}
                <ArrowRightIcon className="size-4" />
              </Link>
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

/** Harapan dan terima kasih — pola "pesan pimpinan" halaman korporat:
 *  foto di kiri (diklik untuk membuka ukuran penuh), artikel rata
 *  kiri-kanan di kanan, ditutup blok nama dan jabatan pengurus. */
function HarapanTerimaKasih({ t }) {
  const foto = gambar("/images/harapan-terima-kasih.jpg");
  // Kotak foto maximal 500px; tautan "buka ukuran penuh" tetap ke berkas asli.
  const sumberFoto = sumberGambar("/images/harapan-terima-kasih.jpg", {
    sizes: "(min-width: 1024px) 42vw, 92vw",
  });
  return (
    <section className="w-full relative bg-transparent pl-6 pr-6 pb-12 xl:pb-16 pt-12 xl:pt-16">
      <div className="relative w-full mx-auto grid grid-cols-1 lg:grid-cols-[0.678fr_1.02fr] gap-x-4 md:gap-x-8 lg:gap-x-10 gap-y-4 lg:max-w-[960px] xl:max-w-[1280px]">
        {/* Kolom foto */}
        <div className="w-full relative bg-transparent">
          <div className="relative w-full mx-auto grid place-items-center lg:min-h-[560px]">
            <div className="flex justify-center items-center w-full">
              <a href={foto} target="_blank" rel="noopener noreferrer" className="block">
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
              </a>
            </div>
          </div>
        </div>

        {/* Kolom artikel */}
        <div className="w-full relative bg-transparent md:pt-4 xl:pt-4">
          <div className="relative w-full mx-auto flex flex-col gap-y-6">
            <h2 className={JUDUL_SEKSI}>{t("landing.harapanJudul")}</h2>
            <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
              <div className="relative z-[1] font-serif prose-kci max-w-none">
                <p>{t("landing.harapanPembuka")}</p>
                <p>{t("landing.harapanP1")}</p>
                <p>{t("landing.harapanP2")}</p>
                <p>{t("landing.harapanP3")}</p>
                <p>{t("landing.harapanTutup1")}</p>
                <p>{t("landing.harapanTutup2")}</p>
                <p>{t("landing.harapanTutup3")}</p>
              </div>
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
    </section>
  );
}

/** Ajakan bergabung — penutup halaman. */
function AjakanBergabung({ t }) {
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-12 md:py-16 text-center overflow-hidden">
      <div className="mx-auto max-w-4xl flex flex-col items-center">
        <div className="flex flex-col items-center gap-[14px] text-center">
          <h2 className={JUDUL_SEKSI}>
            {t("landing.ajakanJudul")} <em className="text-primary not-italic">{t("landing.ajakanJudulAccent")}</em>
          </h2>
          <p className={LEAD_SEKSI}>{t("landing.ajakanDeskripsi")}</p>
        </div>
        <Link
          to="/pendaftaran-anggota"
          className="mt-8 inline-flex items-center gap-2 border border-primary bg-transparent font-sans text-primary font-semibold text-sm px-8 py-3 rounded transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t("landing.ajakanTombol")}
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t("common.namaKomunitas");
  }, [t]);

  return (
    <div className="w-full overflow-x-hidden">
      <MetaHalaman
        title={t("common.judulBeranda")}
        description="Blunder Skuad — Komunitas Catur Indonesia: wadah bermain, belajar, dan bertumbuh bagi pecatur. Ikuti jadwal turnamen, peringkat anggota, kelas pelatihan, dan kabar komunitas terbaru."
      />
      {/* H1 utama halaman — hero sengaja visual murni, jadi judul halaman
          disediakan tersembunyi untuk pembaca layar & mesin pencari. */}
      <h1 className="sr-only font-serif">{t("common.namaKomunitas")}</h1>
      <LandingHero t={t} />
      <MaestroEdision />
      <Testimoni />

      {/* `bg-white` dihapus: seksi ini satu-satunya yang berlatar putih murni,
          sedangkan seksi lain tidak punya kelas latar dan mewarisi
          `--color-paper` (#f8f8f8) dari `body`. Akibatnya di sini pernah
          muncul garis sambungan karena putih murni #fff bersebelahan
          dengan paper #f8f8f8. */}
      <section className="w-full pl-6 md:pl-8 pr-6 md:pr-8 pb-12 xl:pb-16 pt-12 xl:pt-16 overflow-hidden">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] flex flex-col gap-y-4 md:gap-y-6 lg:gap-y-2">
          <div className="w-full grid lg:grid-cols-[82%_18%] gap-x-10 gap-y-6 items-start">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-x-10 gap-y-4 md:gap-y-6 items-start">
              <h2 className={JUDUL_SEKSI}>{t("nav.keberlanjutan")}</h2>
              <p className={LEAD_SEKSI}>{t("landing.keberlanjutanDesk")}</p>
            </div>
            <div className="flex">
              <Link
                to="/keberlanjutan"
                aria-label={`${t("common.selengkapnya")}: ${t("nav.keberlanjutan")}`}
                className="text-sm h-12 px-4 md:px-6 gap-2 font-sans font-semibold leading-relaxed flex items-center justify-center border border-primary text-primary rounded transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span className="order-1">{t("common.selengkapnya")}</span>
                <ArrowRightIcon className="size-5 order-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BagianGambarKartu t={t} />

      <KartuAlatLatihan />

      <HarapanTerimaKasih t={t} />

      <AjakanBergabung t={t} />
    </div>
  );
}