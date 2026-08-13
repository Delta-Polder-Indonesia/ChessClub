import { Link } from "react-router-dom";

/**
 * Hero halaman — latar gelap + foto + breadcrumb + judul.
 */
export default function Hero({
  title = "Tentang Kami",
  description = "Telusuri sejarah perjalanan, visi, dan misi komunitas kami yang menjadi fondasi kegiatan, filosofi logo, serta struktur pengurus yang mendukung pengembangan catur Indonesia.",
  crumbs = [
    { label: "Home", to: "/" },
    { label: "Tentang Kami" },
  ],
  image = "/images/hero-about.jpg",
}) {
  return (
    <section className="relative w-full h-[400px] lg:h-[500px] bg-hero">
      <div className="absolute w-full max-w-full left-1/2 -translate-x-1/2 h-full overflow-hidden">
        <img
          src={image}
          alt=""
          className="w-full h-full object-cover"
          draggable="false"
          decoding="async"
        />
      </div>
      <div
        className="absolute w-full max-w-full left-1/2 -translate-x-1/2 h-full z-[2]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.16) 30.31%, rgba(0, 0, 0, 0.8) 101.05%)",
        }}
      />
      <div className="relative w-full mx-auto max-w-[1080px] xl:max-w-7xl 2xl:max-w-8xl px-6 lg:px-8 xl:px-0 2xl:px-0 h-full flex flex-col justify-end gap-4 xl:gap-6 z-3 pb-6 lg:pb-16 xl:pb-[72px]">
        <div className="flex gap-2 items-center text-xs md:text-sm text-white flex-wrap">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span>/</span>}
              {c.to ? (
                <Link to={c.to} title={c.label} className="hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
            </span>
          ))}
        </div>
        <h1 className="text-white w-full lg:w-1/2 text-3xl md:text-[38px] leading-normal xl:leading-normal font-bold line-clamp-2">
          {title}
        </h1>
        {description && (
          <p className="w-full max-w-[840px] text-sm md:text-base font-normal text-white">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
