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
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";
import { COVER, DAFTAR_EBOOK } from "../Beranda/ebook-data.js";
import { ArrowRightIcon } from "../../components/icons.jsx";

const SLIDE_DURATION = 7000;

/** Hero carousel — slide full-width gambar + overlay gelap + navigasi garis progress. */
function LandingHero({ t }) {
  const [index, setIndex] = useState(0);

  const SLIDES = [
    { img: gambar("/images/tonggak-2015.jpg"), label: "2015 - 2016" },
    { img: gambar("/images/tonggak-2016.jpg"), label: "2016 - 2017" },
    { img: gambar("/images/tonggak-2018.jpg"), label: "2018 - 2019" },
    { img: gambar("/images/tonggak-2020.jpg"), label: "2020 - 2021" },
    { img: gambar("/images/tonggak-2022.jpg"), label: "2022 - 2023" },
    { img: gambar("/images/tonggak-2024.jpg"), label: "2024 - 2025" },
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
    pra.src = berikut.img;
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
              className={`swiper-pagination-line relative flex-1 min-w-[120px] cursor-pointer py-2 md:py-4 transition-all duration-300 text-xs md:text-sm font-medium group border-b-[3px] border-white/30 ${
                active ? "text-white" : "text-white/50"
              }`}
            >
              <div className="flex items-center gap-1 md:gap-2">
                <svg
                  className={`bullet-dot w-2 h-2 md:w-3 md:h-3 transition-all duration-300 group-hover:opacity-100 ${
                    active ? "text-red-600 opacity-100" : "opacity-10"
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
                className="bullet-progress absolute left-0 bottom-[-3px] border-b-[3px] border-red-600 pointer-events-none"
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
      to: "/turnamen",
      img: gambar("/images/landing-sorotan-turnamen.jpg"),
      judul: t("landing.sorotan1Judul"),
      isi: t("landing.sorotan1Isi"),
    },
    {
      to: "/program-kami/teka-teki",
      img: gambar("/images/landing-sorotan-program.jpg"),
      judul: t("landing.sorotan2Judul"),
      isi: t("landing.sorotan2Isi"),
    },
    {
      to: "/program-kami/pembukaan",
      img: gambar("/images/landing-sorotan-media.jpg"),
      judul: t("landing.sorotan3Judul"),
      isi: t("landing.sorotan3Isi"),
    },
  ];
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pt-4 pb-16 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-10">
        <div className="max-w-2xl">
          <h2 className="font-semibold text-2xl md:text-3xl text-black">
            {t("landing.sorotanJudul")}
          </h2>
          <p className="mt-3 text-slate-600">{t("landing.sorotanDeskripsi")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {sorotan.map((s) => {
            const gambar = (
              <img
                src={s.img}
                alt={s.judul}
                width={960}
                height={640}
                className="w-full aspect-[3/2] object-cover rounded-xl"
                loading="lazy"
                decoding="async"
              />
            );
            const teks = (
              <>
                <h3 className="font-semibold text-lg text-slate-900">{s.judul}</h3>
                <p className="text-sm text-slate-600 leading-6">{s.isi}</p>
              </>
            );
            return (
              <article key={s.judul} className="flex flex-col gap-4">
                {gambar}
                {s.to ? (
                  <Link to={s.to} className="group flex cursor-pointer flex-col gap-4">
                    {teks}
                  </Link>
                ) : (
                  <div className="flex flex-col gap-4">{teks}</div>
                )}
              </article>
            );
          })}
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
}));

function CardGambar({ index, t }) {
  const imgIndex = ((index % KARTU_GAMBAR.length) + KARTU_GAMBAR.length) % KARTU_GAMBAR.length;
  return (
    <div className="relative w-full aspect-[3/2] md:h-[520px] overflow-hidden order-1">
      {KARTU_GAMBAR.map((g, i) => (
        <img
          key={i}
          src={g.img}
          alt=""
          width={1280}
          height={714}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
            i === imgIndex ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          decoding="async"
        />
      ))}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 xl:px-10 py-10 flex flex-col items-start gap-3">
        <p className="text-white font-semibold text-xs md:text-sm uppercase tracking-wide">
          {t("landing.pustakaLabel")}
        </p>
        <h2 className="text-white font-bold text-3xl md:text-4xl mb-4 uppercase">
          {t("landing.pustakaJudul")}
        </h2>
        <p className="text-white/90 text-sm md:text-base max-w-2xl leading-6">
          {t("landing.pustakaDesk")}
        </p>
      </div>
    </div>
  );
}

/** Karusel kartu program — kartu adalah tautan nyata ke halamannya. */
function CardCarousel({ index, setIndex, t }) {
  const kartu = DAFTAR_EBOOK.map((b) => ({
    to: `/beranda/ebook-panduan?buku=${b.id}`,
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
    <div className="w-full md:w-auto px-6 md:px-0 md:absolute md:left-[30%] lg:left-[40%] md:right-0 md:top-1/2 md:-translate-y-1/2 z-10 order-2 -mt-56 md:-mt-0 py-10 md:py-0 overflow-hidden">
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
                className={`flex-none w-[250px] h-[300px] p-6 rounded-md shadow-lg gap-5 flex flex-col justify-between relative cursor-pointer ${transisi} ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-white text-slate-900 hover:bg-primary group"
                }`}
              >
                <h3 className={`text-xl font-bold ${isActive ? "text-white" : "text-slate-900 group-hover:text-white"} ${transisiWarna}`}>
                  {k.judul}
                </h3>
                <div className={`flex-none w-10 h-1 rounded ${isActive ? "bg-white" : "bg-red-600 group-hover:bg-white"} ${transisiWarna}`} />
                <p className={`text-sm leading-6 ${isActive ? "text-white/90" : "text-slate-600 group-hover:text-white"} ${transisiWarna}`}>
                  {k.desk}
                </p>
                <div className="block mt-auto ml-auto">
                  <ArrowRightIcon className={`size-6 -rotate-45 ${isActive ? "text-white" : "text-slate-600 group-hover:text-white"} ${transisiWarna}`} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4 items-center pr-8">
        <button
          type="button"
          aria-label={t("landing.sebelumnya")}
          onClick={() => setIndex((i) => i - 1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-400 rounded-lg shadow hover:bg-primary transition-colors group"
        >
          <ArrowRightIcon className="size-6 text-slate-600 rotate-180 group-hover:text-white transition-colors" />
        </button>
        <button
          type="button"
          aria-label={t("landing.selanjutnya")}
          onClick={() => setIndex((i) => i + 1)}
          className="w-10 h-10 flex items-center justify-center bg-white border border-slate-400 rounded-lg shadow hover:bg-primary transition-colors group"
        >
          <ArrowRightIcon className="size-6 text-slate-600 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}

function BagianGambarKartu({ t }) {
  const [index, setIndex] = useState(4);
  return (
    <section className="w-full bg-[#f8fafc] relative py-14 md:py-16 overflow-hidden">
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
  return (
    <section className="w-full relative bg-transparent pl-6 pr-6 pb-12 xl:pb-24 pt-12 xl:pt-24">
      <div className="relative w-full mx-auto grid grid-cols-1 lg:grid-cols-[0.678fr_1.02fr] gap-x-4 md:gap-x-8 lg:gap-x-10 gap-y-4 lg:max-w-[960px] xl:max-w-[1280px]">
        {/* Kolom foto */}
        <div className="w-full relative bg-transparent">
          <div className="relative w-full mx-auto grid place-items-center lg:min-h-[560px]">
            <div className="flex justify-center items-center">
              <a href={foto} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={foto}
                  alt={t("landing.harapanAltFoto")}
                  title={t("landing.harapanAltFoto")}
                  draggable="false"
                  decoding="async"
                  loading="lazy"
                  width={500}
                  height={700}
                  className="w-full max-w-[500px] h-auto rounded-xl object-cover object-center"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Kolom artikel */}
        <div className="w-full relative bg-transparent md:pt-4 xl:pt-4">
          <div className="relative w-full mx-auto flex flex-col gap-y-6">
            <h2 className="focus:outline-none focus:ring-0 text-black font-semibold text-2xl md:text-3xl">
              {t("landing.harapanJudul")}
            </h2>
            <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
              <div className="relative z-[1] prose-kci max-w-none">
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
              <p className="font-bold text-lg md:text-xl text-black">
                {t("landing.harapanNama")}
              </p>
              <p className="mt-1 text-sm md:text-base text-slate-600">
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
  const { t } = useI18n();

  useEffect(() => {
    document.title = t("common.namaKomunitas");
  }, [t]);

  return (
    <div className="w-full overflow-x-hidden">
      {/* H1 utama halaman — hero sengaja visual murni, jadi judul halaman
          disediakan tersembunyi untuk pembaca layar & mesin pencari. */}
      <h1 className="sr-only">{t("common.namaKomunitas")}</h1>
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
          <p className="text-white font-semibold text-xs md:text-sm uppercase tracking-wide">
            {t("landing.sekilasLabel")}
          </p>
          <h2 className="text-white font-bold text-3xl md:text-4xl mb-4">
            {t("nav.tentangKami")}
          </h2>
          <p className="text-white/90 text-sm md:text-base max-w-2xl leading-6">
            {t("landing.sekilasDesk")}
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/tentang-kami"
              className="inline-flex items-center gap-2 border border-white text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
            >
              {t("common.selengkapnya")}
              <ArrowRightIcon className="size-4 -rotate-45" />
            </Link>
            <Link
              to="/tentang-kami/struktur-grup-catur"
              className="inline-flex items-center gap-2 border border-white text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white hover:text-black transition-colors"
            >
              {t("landing.ketuaPengurus")}
              <ArrowRightIcon className="size-4 -rotate-45" />
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-white pl-6 md:pl-8 pr-6 md:pr-8 pb-12 xl:pb-16 pt-12 xl:pt-24 overflow-hidden">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] flex flex-col gap-y-4 md:gap-y-6 lg:gap-y-2">
          <div className="w-full">
            <p className="text-primary font-semibold text-xs uppercase">
              {t("nav.keberlanjutan")}
            </p>
          </div>
          <div className="w-full grid lg:grid-cols-[82%_18%] gap-x-10 gap-y-6 items-start">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-x-10 gap-y-4 md:gap-y-6 items-start">
              <h2 className="font-semibold text-3xl">{t("nav.keberlanjutan")}</h2>
              <p className="text-justify text-slate-600 leading-relaxed">
                {t("landing.keberlanjutanDesk")}
              </p>
            </div>
            <div className="flex">
              <Link
                to="/keberlanjutan"
                className="text-sm h-12 px-4 md:px-6 gap-2 hover:gap-4 font-semibold leading-relaxed flex items-center justify-center transition-all duration-200 ease-in-out border border-slate-600 text-slate-600 hover:border-primary hover:bg-primary hover:text-white rounded-full"
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

      <AjakanBergabung t={t} />
    </div>
  );
}
