/**
 * Landing page (Beranda utama).
 *
 * Struktur halaman terinspirasi pola umum situs korporat — hero besar,
 * akses cepat, sorotan kegiatan, berita terkini, statistik, dan ajakan
 * bergabung — tetapi seluruh markup, komponen, dan konten di berkas ini
 * ditulis dari nol khusus untuk Komunitas Catur Indonesia. Tidak ada
 * kode maupun teks yang disalin dari situs pihak lain.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";
import { ArrowRightIcon } from "../../components/icons.jsx";

function formatTanggal(nilai, bahasa) {
  if (!nilai) return "";
  const d = new Date(`${nilai}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return nilai;
  return new Intl.DateTimeFormat(bahasa === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

const SLIDE_DURATION = 7000;

/** Hero carousel — mirip Tonggak Bersejarah: slide full-width gambar + overlay gelap + teks putih + progress bar. */
function LandingHero({ t }) {
  const [index, setIndex] = useState(0);

  const SLIDES = [
    {
      img: gambar("/images/tonggak-2015.jpg"),
      label: "2015 - 2016",
      title: t("tonggak.t1"),
      paragraphs: [t("tonggak.p1a"), t("tonggak.p1b")],
    },
    {
      img: gambar("/images/tonggak-2016.jpg"),
      label: "2016 - 2017",
      title: t("tonggak.t2"),
      paragraphs: [t("tonggak.p2a"), t("tonggak.p2b")],
    },
    {
      img: gambar("/images/tonggak-2018.jpg"),
      label: "2018 - 2019",
      title: t("tonggak.t3"),
      paragraphs: [t("tonggak.p3a"), t("tonggak.p3b")],
    },
    {
      img: gambar("/images/tonggak-2020.jpg"),
      label: "2020 - 2021",
      title: t("tonggak.t4"),
      paragraphs: [t("tonggak.p4a"), t("tonggak.p4b")],
    },
    {
      img: gambar("/images/tonggak-2022.jpg"),
      label: "2022 - 2023",
      title: t("tonggak.t5"),
      paragraphs: [t("tonggak.p5a"), t("tonggak.p5b")],
    },
    {
      img: gambar("/images/tonggak-2024.jpg"),
      label: "2024 - 2025",
      title: t("tonggak.t6"),
      paragraphs: [t("tonggak.p6a"), t("tonggak.p6b")],
    },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_DURATION);
    return () => window.clearTimeout(timer);
  }, [index, SLIDES.length]);

  return (
    <section className="w-full relative bg-transparent pb-20 md:pb-20 xl:pb-20 overflow-hidden">
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
            <div className="w-full relative h-full min-h-[650px] bg-[#021624]">
              {i === index && (
                <img
                  src={slide.img}
                  alt=""
                  width={1280}
                  height={714}
                  decoding="async"
                  fetchpriority="high"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 pointer-events-none opacity-60 bg-[#000000CC]" />
            </div>
          </div>
        ))}
      </div>

      {/* Navigasi garis progress — di bawah gambar */}
      <div className="absolute bottom-24 left-0 right-0 z-10 lg:max-w-[960px] xl:max-w-[1280px] mx-auto flex space-x-2 carousel-pagination px-8 md:px-10 lg:px-4 xl:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              className={`swiper-pagination-line relative flex-1 min-w-[120px] cursor-pointer py-2 md:py-4 transition-all duration-300 text-xs md:text-sm font-medium group border-b-[3px] border-white/30 ${
                active ? "text-white" : "text-white/50"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <svg
                  className={`bullet-dot w-2 h-2 md:w-3 md:h-3 transition-all duration-300 group-hover:opacity-100 ${
                    active ? "text-[red] opacity-100" : "opacity-10"
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
                className="bullet-progress absolute left-0 bottom-[-3px] border-b-[3px] border-[red] pointer-events-none"
                style={
                  active
                    ? {
                        animation: `progressbar ${SLIDE_DURATION}ms linear forwards`,
                      }
                    : { width: "0%" }
                }
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Tiga kartu sorotan kegiatan dengan foto. */
function SorotanKegiatan({ t }) {
  const sorotan = [
    {
      img: gambar("/images/landing-sorotan-turnamen.jpg"),
      judul: t("landing.sorotan1Judul"),
      isi: t("landing.sorotan1Isi"),
    },
    {
      img: gambar("/images/landing-sorotan-program.jpg"),
      judul: t("landing.sorotan2Judul"),
      isi: t("landing.sorotan2Isi"),
    },
    {
      img: gambar("/images/landing-sorotan-media.jpg"),
      judul: t("landing.sorotan3Judul"),
      isi: t("landing.sorotan3Isi"),
    },
  ];
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pt-4 pb-16 md:pt-4 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-10">
        <div className="max-w-2xl">
          <h2 className="font-semibold text-2xl md:text-3xl text-black">
            {t("landing.sorotanJudul")}
          </h2>
          <p className="mt-3 text-slate-600">{t("landing.sorotanDeskripsi")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {sorotan.map((s) => (
            <article key={s.judul} className="flex flex-col gap-4">
              <img
                src={s.img}
                alt={s.judul}
                width={960}
                height={640}
                className="w-full aspect-[3/2] object-cover rounded-xl"
                loading="lazy"
                decoding="async"
              />
              <h3 className="font-semibold text-lg text-slate-900">{s.judul}</h3>
              <p className="text-sm text-slate-600 leading-6">{s.isi}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Dua kolom: berita komunitas terbaru & pengumuman terbaru. */
/** Baris statistik ringkas komunitas. */
const KARTU_GAMBAR = [
  { img: gambar("/images/tonggak-2024.webp") },
  { img: gambar("/images/tonggak-2022.webp") },
  { img: gambar("/images/tonggak-2020.webp") },
  { img: gambar("/images/tonggak-2018.webp") },
];

function CardGambar({ index }) {
  const imgIndex = ((index % KARTU_GAMBAR.length) + KARTU_GAMBAR.length) % KARTU_GAMBAR.length;
  return (
    <div className="relative w-full aspect-[4/3] md:h-[600px] overflow-hidden order-1">
      {KARTU_GAMBAR.map((g, i) => (
        <img
          key={i}
          src={g.img}
          alt=""
          width={1280}
          height={714}
          className={`absolute inset-0 w-full h-full object-cover object-top shadow-lg transition-opacity duration-500 ${
            i === imgIndex ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          decoding="async"
        />
      ))}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 xl:px-10 py-10 flex flex-col items-start gap-3">
        <h2 className="text-white font-semibold text-xs md:text-sm uppercase tracking-wide">Perpustakaan</h2>
        <h3 className="text-white font-bold text-3xl md:text-4xl mb-4">E-BOOK CATUR</h3>
        <p className="text-white/90 text-sm md:text-base max-w-2xl leading-6">
          Materi belajar yang ditulis dan dikurasi anggota, dari fundamental opening sampai endgame teoretis. Semua gratis diunduh.
        </p>
      </div>
    </div>
  );
}

function CardCarousel({ index, setIndex }) {
  const kartu = [
    { judul: "Program Sekolah Catur", desk: "Jelajahi program pendidikan dan pelatihan catur yang kami sediakan untuk seluruh kalangan." },
    { judul: "Turnamen Berkala", desk: "Ikuti kompetisi catur rutin yang kami adakan untuk mengasah kemampuan dan sportivitas." },
    { judul: "Komunitas dan Relasi", desk: "Bergabung dengan jaringan pecatur dari berbagai daerah di seluruh Indonesia." },
    { judul: "Panduan Bermain Catur", desk: "Pelajari strategi, taktik, dan tips bermain catur dari dasar hingga tingkat lanjut." },
  ];
  const n = kartu.length;
  const tripled = [...kartu, ...kartu, ...kartu];
  const mid = n;
  const [noAnim, setNoAnim] = useState(false);
  const CARD_W = 310;

  const handleEnd = (e) => {
    if (e.propertyName !== "transform") return;
    if (index >= mid * 2 || index <= 0) {
      setNoAnim(true);
      setIndex(mid);
    }
  };

  useEffect(() => {
    if (noAnim) {
      const id = requestAnimationFrame(() => setNoAnim(false));
      return () => cancelAnimationFrame(id);
    }
  }, [noAnim]);

  return (
    <div className="w-full md:w-auto px-6 md:px-0 md:absolute md:left-[30%] lg:left-[40%] md:right-0 md:top-1/2 md:-translate-y-1/2 z-10 order-2 -mt-56 md:-mt-0 py-10 md:py-0 overflow-hidden">
      <div className="overflow-hidden max-w-full" style={{ maxWidth: `${3 * CARD_W - 20}px` }}>
        <div
          className={`flex gap-5 ${noAnim ? "" : "transition-transform duration-500 ease-in-out"}`}
          style={{ transform: `translateX(-${index * CARD_W}px)` }}
          onTransitionEnd={handleEnd}
        >
          {tripled.map((k, i) => {
            const isActive = i === index;
            const isLast = i === index + 2;
            return (
              <div
                key={`${k.judul}-${i}`}
                className={`flex-none w-[290px] h-[360px] p-8 rounded-md shadow-lg gap-5 flex flex-col justify-between relative cursor-pointer transition-all ${
                  isActive
                    ? "bg-primary text-white"
                    : isLast
                      ? "bg-white text-slate-900 blur-[1px] opacity-70"
                      : "bg-white text-slate-900 hover:bg-primary group"
                }`}
              >
                <h3 className={`text-2xl font-bold ${isActive ? "text-white" : "text-slate-900 group-hover:text-white"} transition-colors`}>
                  {k.judul}
                </h3>
                <div className={`flex-none w-10 h-1 rounded ${isActive ? "bg-white" : "bg-red-600 group-hover:bg-white"} transition-colors`} />
                <p className={`text-sm leading-6 ${isActive ? "text-white/90" : "text-slate-600 group-hover:text-white"} transition-colors`}>
                  {k.desk}
                </p>
                <div className="block mt-auto ml-auto">
                  <ArrowRightIcon className={`size-6 -rotate-45 transition-colors ${isActive ? "text-white" : "text-slate-600 group-hover:text-white"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 items-center pr-8">
        <button
          type="button"
          aria-label="Sebelumnya"
          onClick={() => setIndex((i) => i - 1)}
          className="w-12 h-12 flex items-center justify-center bg-white border border-slate-400 rounded-lg shadow hover:bg-primary transition-colors group"
        >
          <ArrowRightIcon className="size-6 text-slate-600 rotate-180 group-hover:text-white transition-colors" />
        </button>
        <button
          type="button"
          aria-label="Selanjutnya"
          onClick={() => setIndex((i) => i + 1)}
          className="w-12 h-12 flex items-center justify-center bg-white border border-slate-400 rounded-lg shadow hover:bg-primary transition-colors group"
        >
          <ArrowRightIcon className="size-6 text-slate-600 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}

function BagianGambarKartu() {
  const [index, setIndex] = useState(4);
  return (
    <section className="w-full bg-[#f8fafc] relative py-16 md:py-20 overflow-hidden">
      <div className="flex flex-col md:grid md:grid-cols-2 gap-6 items-center relative">
        <CardGambar index={index} />
        <CardCarousel index={index} setIndex={setIndex} />
      </div>
    </section>
  );
}

/** Ajakan bergabung — penutup halaman. */
function AjakanBergabung({ t }) {
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 md:py-20 text-center overflow-hidden">
      <div className="mx-auto max-w-2xl flex flex-col items-center gap-5">
        <h2 className="font-semibold text-2xl md:text-3xl text-black">
          {t("landing.ajakanJudul")}
        </h2>
        <p className="text-slate-600">{t("landing.ajakanDeskripsi")}</p>
        <Link
          to="/pendaftaran-anggota"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          {t("landing.ajakanTombol")}
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const { t, bahasa } = useI18n();

  useEffect(() => {
    document.title = t("common.namaKomunitas");
  }, [t]);

  return (
    <div className="w-full overflow-x-hidden">
      <LandingHero t={t} />
      <SorotanKegiatan t={t} />
      <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
        <img
          src={gambar("/images/sekilas.webp")}
          alt=""
          width={1280}
          height={540}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-[1] w-full h-full mx-auto max-w-[1080px] xl:max-w-7xl px-6 lg:px-8 xl:px-0 flex flex-col justify-center gap-3">
          <h2 className="text-white font-semibold text-xs md:text-sm uppercase tracking-wide">SEKILAS BLUNDER SKUAD</h2>
          <h3 className="text-white font-bold text-3xl md:text-4xl mb-4">Tentang Kami</h3>
          <p className="text-white/90 text-sm md:text-base max-w-2xl leading-6">
            Lebih dari satu tahun menyediakan tempat untuk seluruh penjuru negri dan sejumlah wilayah di indonesia
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/tentang-kami"
              className="inline-flex items-center gap-2 border border-white text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
            >
              Selengkapnya
              <ArrowRightIcon className="size-4 -rotate-45" />
            </Link>
            <Link
              to="/tentang-kami/struktur-grup-catur"
              className="inline-flex items-center gap-2 border border-white text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
            >
              Ketua dan Pengurus
              <ArrowRightIcon className="size-4 -rotate-45" />
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-white pl-6 md:pl-8 pr-6 md:pr-8 pb-12 md:pb-12 xl:pb-16 pt-12 md:pt-12 xl:pt-24 overflow-hidden">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] flex flex-col gap-y-4 md:gap-y-6 lg:gap-y-2">
          <div className="w-full">
            <p className="text-primary font-semibold text-xs md:text-xs">KEBERLANJUTAN</p>
          </div>
          <div className="w-full grid lg:grid-cols-[82%_18%] gap-x-10 gap-y-6 items-start">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-x-10 gap-y-4 md:gap-y-6 items-start">
              <h2 className="font-semibold text-3xl md:text-3xl">Keberlanjutan</h2>
              <p className="text-justify text-slate-600 leading-relaxed">
                Komunitas Catur Indonesia berkomitmen membangun ekosistem catur yang berkelanjutan melalui pendidikan, pembinaan bakat, dan penguatan jejaring pecatur di seluruh Indonesia. Kami percaya bahwa konsistensi dalam program dan kebersamaan adalah kunci kemajuan catur nasional.
              </p>
            </div>
            <div className="flex">
              <Link
                to="/keberlanjutan"
                className="text-sm h-12 px-4 md:px-6 gap-2 hover:gap-4 font-semibold leading-relaxed flex items-center justify-center transition-all duration-200 ease-in-out border border-slate-600 text-slate-600 hover:border-primary hover:bg-primary hover:text-white rounded-full"
              >
                <span className="order-1">Selengkapnya</span>
                <ArrowRightIcon className="size-5 order-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BagianGambarKartu />

      <AjakanBergabung t={t} />
    </div>
  );
}