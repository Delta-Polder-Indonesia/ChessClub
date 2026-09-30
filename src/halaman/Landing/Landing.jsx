/**
 * Landing page (Beranda utama).
 *
 * Struktur halaman terinspirasi pola umum situs korporat — hero carousel
 * tonggak sejarah, sorotan kegiatan, sekilas komunitas, keberlanjutan,
 * karusel kartu program + e-book, dan ajakan bergabung — tetapi seluruh
 * markup, komponen, dan konten di berkas ini ditulis dari nol khusus
 * untuk Komunitas Catur Indonesia. Tidak ada kode maupun teks yang
 * disalin dari situs pihak lain.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar, pramuatGambar, sumberGambar, sumberHero } from "../../lib/asets.js";
import { COVER, DAFTAR_EBOOK } from "../Beranda/ebook-data.js";
import { ArrowRightIcon } from "../../components/icons.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import TigaJalan from "./TigaJalan.jsx";
import Testimoni from "./Testimoni.jsx";

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

/** Sorotan kegiatan — pola editorial: satu kartu unggulan lebar (foto + teks
 *  berdampingan) dan dua kartu sekunder (DESIGN.md §3: hindari grid tiga
 *  kartu identik). Seluruh kartu adalah tautan utuh; foto memakai alt kosong
 *  karena judul di dalam tautan yang sama sudah menyebut isinya, sehingga
 *  pembaca layar tidak membaca dua kali. */
function SorotanKegiatan({ t }) {
  const unggulan = {
    to: "/turnamen",
    // Kartu unggulan selebar setengah wadah (± 640px) di layar ke atas;
    // varian 640w dari manifest menutupinya.
    sumber: sumberGambar("/images/landing-sorotan-turnamen.jpg", {
      sizes: "(min-width: 768px) 50vw, 100vw",
    }),
    judul: t("landing.sorotan1Judul"),
    isi: t("landing.sorotan1Isi"),
    cta: t("landing.sorotan1Cta"),
  };
  const sekunder = [
    {
      to: "/program-kami/teka-teki",
      sumber: sumberGambar("/images/landing-sorotan-program.jpg", {
        sizes: "(min-width: 768px) 50vw, 100vw",
      }),
      judul: t("landing.sorotan2Judul"),
      isi: t("landing.sorotan2Isi"),
    },
    {
      to: "/program-kami/pembukaan",
      sumber: sumberGambar("/images/landing-sorotan-media.jpg", {
        sizes: "(min-width: 768px) 50vw, 100vw",
      }),
      judul: t("landing.sorotan3Judul"),
      isi: t("landing.sorotan3Isi"),
    },
  ];
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pt-4 pb-16 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-10">
        <div className="max-w-2xl">
          <h2 className="font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800">
            {t("landing.sorotanJudul")}
          </h2>
          <p className="mt-3 font-serif text-base leading-[1.6] text-grey-600">
            {t("landing.sorotanDeskripsi")}
          </p>
        </div>

        {/* Kartu unggulan — foto kiri, teks kanan; bertumpuk di ponsel. */}
        <Link
          to={unggulan.to}
          className="group grid grid-cols-1 md:grid-cols-2 border border-grey-200 rounded-lg bg-white overflow-hidden transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <img
            {...unggulan.sumber}
            alt=""
            width={640}
            height={427}
            loading="lazy"
            decoding="async"
            className="w-full aspect-[3/2] md:aspect-auto md:h-full object-cover"
          />
          <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
            <h3 className="font-serif font-semibold text-xl text-grey-800 transition-colors group-hover:text-primary">
              {unggulan.judul}
            </h3>
            <p className="font-serif text-base leading-[1.6] text-grey-600">
              {unggulan.isi}
            </p>
            <span className="mt-2 inline-flex items-center gap-2 font-sans font-semibold text-sm text-primary">
              {unggulan.cta}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </span>
          </div>
        </Link>

        {/* Dua kartu sekunder — foto di atas, teks di bawah. */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sekunder.map((s) => (
            <Link
              key={s.judul}
              to={s.to}
              className="group flex flex-col border border-grey-200 rounded-lg bg-white overflow-hidden transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <img
                {...s.sumber}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full aspect-[3/2] object-cover"
              />
              <div className="flex flex-col gap-2 p-6">
                <h3 className="font-serif font-semibold text-lg text-grey-800 transition-colors group-hover:text-primary">
                  {s.judul}
                </h3>
                <p className="font-serif text-base leading-[1.6] text-grey-600">
                  {s.isi}
                </p>
              </div>
            </Link>
          ))}
        </div>
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
    <div className="relative w-full max-w-60 md:max-w-72 lg:max-w-80 xl:max-w-[340px] mx-auto aspect-[2/3] overflow-hidden order-1 bg-black">
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
      <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 xl:px-10 py-10 flex flex-col items-start gap-3 z-10 pointer-events-none">
        <h2 className="font-serif text-white font-semibold text-2xl md:text-3xl leading-snug">
          {t("landing.pustakaJudul")}
        </h2>
        <p className="font-serif text-white/90 text-base leading-[1.6]">
          {t("landing.pustakaDesk")}
        </p>
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
  const CARD_W = 270;

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
    <div className="w-full md:w-auto px-6 md:px-0 md:absolute md:left-[24%] lg:left-[32%] md:right-0 md:top-1/2 md:-translate-y-1/2 z-10 order-2 -mt-56 md:-mt-0 py-10 md:py-0 overflow-hidden">
      <div className="overflow-hidden max-w-full" style={{ maxWidth: `${3 * CARD_W}px` }}>
        <div
          className={`flex gap-5 ${noAnim ? "" : "transition-transform duration-500 ease-in-out"}`}
          style={{ transform: `translateX(-${index * CARD_W}px)` }}
          onTransitionEnd={handleEnd}
        >
          {tripled.map((k, i) => {
            const isActive = i === index;
            // Saat lompatan reset (noAnim), kartu aktif biru "pindah" ke
            // elemen DOM lain. Bila kartu masih membawa kelas transisi,
            // perpindahan putih → biru terANIMASI ±150 ms dan tampak
            // sebagai kedipan putih. Karena itu SEMUA transisi (kartu,
            // teks, garis, ikon) dilepas selama frame lompatan.
            const transisi = noAnim ? "" : "transition-all";
            const transisiWarna = noAnim ? "" : "transition-colors";
            return (
              <Link
                key={`${k.judul}-${i}`}
                to={k.to}
                title={k.judul}
                className={`flex-none w-[250px] h-[300px] p-6 rounded-lg border gap-5 flex flex-col justify-between relative cursor-pointer ${transisi} ${
                  isActive
                    ? "bg-primary border-primary text-white"
                    : "bg-white border-grey-200 text-grey-800 hover:bg-primary hover:border-primary group"
                }`}
              >
                <h3 className={`font-serif font-semibold text-lg ${isActive ? "text-white" : "text-grey-800 group-hover:text-white"} ${transisiWarna}`}>
                  {k.judul}
                </h3>
                <div className={`flex-none w-10 h-1 rounded ${isActive ? "bg-white" : "bg-primary group-hover:bg-white"} ${transisiWarna}`} />
                <p className={`font-serif text-[13px] leading-[1.6] ${isActive ? "text-white/90" : "text-grey-600 group-hover:text-white"} ${transisiWarna}`}>
                  {k.desk}
                </p>
                <div className="block mt-auto ml-auto">
                  <ArrowRightIcon className={`size-6 -rotate-45 ${isActive ? "text-white" : "text-grey-600 group-hover:text-white"} ${transisiWarna}`} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 items-center pr-8 max-w-[810px]">
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
    <section className="w-full bg-slate-50 relative py-14 md:py-16 overflow-hidden">
      <div className="flex flex-col md:grid md:grid-cols-2 gap-6 items-center relative">
        <CardGambar index={index} t={t} />
        <CardCarousel index={index} setIndex={setIndex} t={t} />
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
    <section className="w-full relative bg-transparent pl-6 pr-6 pb-12 xl:pb-24 pt-12 xl:pt-24">
      <div className="relative w-full mx-auto grid grid-cols-1 lg:grid-cols-[0.678fr_1.02fr] gap-x-4 md:gap-x-8 lg:gap-x-10 gap-y-4 lg:max-w-[960px] xl:max-w-[1280px]">
        {/* Kolom foto */}
        <div className="w-full relative bg-transparent">
          <div className="relative w-full mx-auto grid place-items-center lg:min-h-[560px]">
            <div className="flex justify-center items-center">
              <a href={foto} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  {...sumberFoto}
                  width="409"
                  height="548"
                  alt={t("landing.harapanAltFoto")}
                  title={t("landing.harapanAltFoto")}
                  draggable="false"
                  decoding="async"
                  loading="lazy"
                  className="w-full max-w-[500px] h-auto rounded-lg object-cover object-center"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Kolom artikel */}
        <div className="w-full relative bg-transparent md:pt-4 xl:pt-4">
          <div className="relative w-full mx-auto flex flex-col gap-y-6">
            <h2 className="font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800">
              {t("landing.harapanJudul")}
            </h2>
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
              <p className="mt-1 font-serif text-[13px] text-grey-600">
                {t("landing.harapanJabatan")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Galeri kegiatan — mozaik foto editorial: satu foto besar (2×2 petak)
 *  dan empat foto kecil, ukuran bervariasi, bukan grid kartu identik.
 *
 *  GAMBAR SAMPEL SEMENTARA: kelima foto adalah foto stok publik sebagai
 *  penampung, bukan dokumentasi Blunder Skuad. Ganti dengan foto kegiatan
 *  asli begitu tersedia — cukup tukar berkas di public/images/Galeri/
 *  dengan nama yang sama. */
function GaleriKegiatan({ t }) {
  const foto = [
    {
      sumber: sumberGambar("/images/Galeri/sampel-turnamen-besar.webp", {
        sizes: "(min-width: 768px) 50vw, 100vw",
      }),
      alt: t("landing.galeriAlt1"),
      besar: true,
    },
    {
      sumber: sumberGambar("/images/Galeri/sampel-papan-1.webp", {
        sizes: "(min-width: 768px) 25vw, 50vw",
      }),
      alt: t("landing.galeriAlt2"),
    },
    {
      sumber: sumberGambar("/images/Galeri/sampel-turnamen-1.webp", {
        sizes: "(min-width: 768px) 25vw, 50vw",
      }),
      alt: t("landing.galeriAlt3"),
    },
    {
      sumber: sumberGambar("/images/Galeri/sampel-papan-2.webp", {
        sizes: "(min-width: 768px) 25vw, 50vw",
      }),
      alt: t("landing.galeriAlt4"),
    },
    {
      sumber: sumberGambar("/images/Galeri/sampel-turnamen-2.webp", {
        sizes: "(min-width: 768px) 25vw, 50vw",
      }),
      alt: t("landing.galeriAlt5"),
    },
  ];
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 md:py-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-10">
        <div className="max-w-2xl">
          <h2 className="font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800">
            {t("landing.galeriJudul")}
          </h2>
          <p className="mt-3 font-serif text-base leading-[1.6] text-grey-600">
            {t("landing.galeriDesk")}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {foto.map((f) => (
            <figure
              key={f.alt}
              className={`m-0 overflow-hidden rounded-lg ${
                f.besar ? "col-span-2 row-span-2" : ""
              }`}
            >
              <img
                {...f.sumber}
                alt={f.alt}
                loading="lazy"
                decoding="async"
                className="w-full aspect-square object-cover"
              />
            </figure>
          ))}
        </div>
        <div>
          <Link
            to="/media-dan-informasi"
            className="inline-flex items-center gap-2 font-sans font-semibold text-sm text-primary transition-colors hover:text-grey-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t("landing.galeriCta")}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Cara bergabung — tiga langkah sebagai daftar bernomor (penomoran sah
 *  karena langkah = urutan nyata; tanpa kartu, cukup garis pemisah 1px). */
function CaraBergabung({ t }) {
  const langkah = [
    { judul: t("landing.langkah1Judul"), isi: t("landing.langkah1Isi") },
    { judul: t("landing.langkah2Judul"), isi: t("landing.langkah2Isi") },
    { judul: t("landing.langkah3Judul"), isi: t("landing.langkah3Isi") },
  ];
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 md:py-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-10">
        <div className="max-w-2xl">
          <h2 className="font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800">
            {t("landing.langkahJudul")}
          </h2>
          <p className="mt-3 font-serif text-base leading-[1.6] text-grey-600">
            {t("landing.langkahDesk")}
          </p>
        </div>
        <ol className="m-0 p-0 list-none flex flex-col">
          {langkah.map((l, i) => (
            <li
              key={l.judul}
              className={`flex items-start gap-6 py-6 ${
                i > 0 ? "border-t border-grey-200" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className="font-serif text-2xl font-semibold text-primary leading-none pt-1"
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="m-0 font-serif font-semibold text-lg text-grey-800">
                  {l.judul}
                </h3>
                <p className="m-0 font-serif text-base leading-[1.6] text-grey-600">
                  {l.isi}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Ajakan bergabung — penutup halaman. */
function AjakanBergabung({ t }) {
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 md:py-20 text-center overflow-hidden">
      <div className="mx-auto max-w-2xl flex flex-col items-center gap-5">
        <h2 className="font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800">
          {t("landing.ajakanJudul")} <em className="text-primary not-italic">{t("landing.ajakanJudulAccent")}</em>
        </h2>
        <p className="font-serif text-base leading-[1.6] text-grey-600">{t("landing.ajakanDeskripsi")}</p>
        <Link
          to="/pendaftaran-anggota"
          className="inline-flex items-center gap-2 border border-primary bg-transparent font-sans text-primary font-semibold text-sm px-8 py-3 rounded transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
      <SorotanKegiatan t={t} />
      <TigaJalan />
      <Testimoni />
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        <img
          {...sumberGambar("/images/sekilas.webp", { sizes: "100vw" })}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-[1] w-full h-full mx-auto max-w-[1080px] xl:max-w-7xl px-6 lg:px-8 xl:px-0 flex flex-col justify-center gap-3">
          <h2 className="font-serif text-white font-semibold text-2xl md:text-3xl leading-snug">
            {t("nav.tentangKami")}
          </h2>
          <p className="font-serif text-white/90 text-base leading-[1.6] max-w-2xl">
            {t("landing.sekilasDesk")}
          </p>
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
      </section>

      <section className="w-full bg-white pl-6 md:pl-8 pr-6 md:pr-8 pb-12 xl:pb-16 pt-12 xl:pt-24 overflow-hidden">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] flex flex-col gap-y-4 md:gap-y-6 lg:gap-y-2">
          <div className="w-full grid lg:grid-cols-[82%_18%] gap-x-10 gap-y-6 items-start">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-x-10 gap-y-4 md:gap-y-6 items-start">
              <h2 className="font-serif font-semibold text-2xl md:text-3xl leading-snug text-grey-800">{t("nav.keberlanjutan")}</h2>
              <p className="font-serif text-base leading-[1.6] text-grey-600">
                {t("landing.keberlanjutanDesk")}
              </p>
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

      <HarapanTerimaKasih t={t} />

      <GaleriKegiatan t={t} />

      <CaraBergabung t={t} />

      <AjakanBergabung t={t} />
    </div>
  );
}