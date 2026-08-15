import { useEffect, useRef, useState } from "react";
import { useI18n } from "../lib/i18n.jsx";
import { gambar } from "../lib/asets.js";

const SLIDE_DURATION = 7000;

/**
 * Carousel Tonggak Sejarah — identik dengan Swiper Pertamina:
 * slide full-width dengan foto + lapisan gelap, judul dan paragraf putih,
 * navigasi garis progress di atas dengan label tahun.
 */
export default function Tonggak() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const progressRef = useRef(null);

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
    const el = progressRef.current;
    if (el) el.style.width = "0%";

    const start = performance.now();
    let raf = 0;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / SLIDE_DURATION);
      if (progressRef.current) {
        progressRef.current.style.width = `${t * 100}%`;
      }
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setIndex((i) => (i + 1) % SLIDES.length);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index]);

  return (
    <section id="tonggak-sejarah" className="w-full relative bg-transparent">
      {/* Judul */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-6 md:pb-6 xl:pb-16">
        <div className="relative w-full mx-auto md:max-w-[1024px]">
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            {t("tonggak.judul")}
          </h2>
        </div>
      </div>

      {/* Carousel */}
      <div className="w-full relative bg-transparent pb-24 md:pb-24 xl:pb-24">
        <div className="w-full relative h-full min-h-[600px] overflow-hidden">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.label}
              className={`w-full absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === index ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{ zIndex: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <div className="w-full relative h-full min-h-[600px] bg-[#021624]">
                {i === index && (
                  <img
                    src={slide.img}
                    alt=""
                    width={1280}
                    height={714}
                    decoding="async"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                {/* Lapisan gelap */}
                <div className="absolute inset-0 pointer-events-none opacity-60 bg-[#000000CC]" />
                {/* Konten teks */}
                <div className="relative w-full h-full mx-auto grid grid-cols-[1fr] lg:grid-cols-[60%] lg:max-w-[960px] xl:max-w-[1280px] lg:justify-start items-end px-2 md:px-2">
                  <div className="w-full pl-6 md:pl-8 xl:pl-6 pr-6 md:pr-8 xl:pr-20 pb-12 md:pb-12 xl:pb-4 pt-12 md:pt-12 xl:pt-3.5">
                    <div className="w-full lg:max-w-[840px]">
                      <h3 className="focus:outline-none focus:ring-0 text-white font-semibold text-4xl md:text-4xl mb-6">
                        {slide.title}
                      </h3>
                      <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
                        <div className="relative z-[1]">
                          {slide.paragraphs.map((p, j) => (
                            <p
                              key={j}
                              className="text-white text-sm md:text-base leading-6 md:leading-7 mb-4"
                            >
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigasi garis progress — track putih, isi merah berjalan seperti loading bar */}
        <div className="absolute !top-5 left-0 right-0 z-10 lg:max-w-[960px] xl:max-w-[1280px] mx-auto flex space-x-2 carousel-pagination !bottom-auto px-8 md:px-10 lg:px-4 xl:px-0 overflow-x-auto [scrollbar-width:none]">
          {SLIDES.map((slide, i) => {
            const active = i === index;
            return (
              <div
                key={slide.label}
                id={`bullet-${i}`}
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
                  ref={active ? progressRef : null}
                  className="bullet-progress absolute left-0 bottom-[-3px] h-0 w-0 border-b-[3px] border-[red] pointer-events-none"
                  style={{ width: active ? undefined : "0%" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
