/**
 * Hero section — identik dengan hero "Tentang Kami" Pertamina:
 * latar gelap #021624 + foto + gradasi hitam, breadcrumb, judul, deskripsi.
 */
export default function Hero() {
  return (
    <section className="relative w-full h-[400px] lg:h-[500px] bg-hero">
      {/* Latar foto */}
      <div className="absolute w-full max-w-full left-1/2 -translate-x-1/2 h-full overflow-hidden">
        <img
          src="/images/hero-about.jpg"
          alt=""
          className="w-full h-full object-cover"
          draggable="false"
          decoding="async"
        />
      </div>
      {/* Gradasi gelap */}
      <div
        className="absolute w-full max-w-full left-1/2 -translate-x-1/2 h-full z-[2]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.16) 30.31%, rgba(0, 0, 0, 0.8) 101.05%)",
        }}
      />
      {/* Konten */}
      <div className="relative w-full mx-auto max-w-[1080px] xl:max-w-7xl 2xl:max-w-8xl px-6 lg:px-8 xl:px-0 2xl:px-0 h-full flex flex-col justify-end gap-4 xl:gap-6 z-3 pb-6 lg:pb-16 xl:pb-[72px]">
        <div className="flex gap-2 items-center text-xs md:text-sm text-white">
          <a href="/" title="Home" aria-label="Home" className="hover:underline">
            Home
          </a>
          <span>/</span>
          <span>Tentang Kami</span>
        </div>
        <h1 className="text-white w-full lg:w-1/2 text-3xl md:text-[38px] leading-normal xl:leading-normal font-bold line-clamp-2">
          Tentang Kami
        </h1>
        <p className="w-full max-w-[840px] text-sm md:text-base font-normal text-white">
          Telusuri sejarah perjalanan, visi, dan misi komunitas kami yang
          menjadi fondasi kegiatan, filosofi logo, serta struktur pengurus yang
          mendukung pengembangan catur Indonesia.
        </p>
      </div>
    </section>
  );
}
