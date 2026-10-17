import { useEffect } from "react";
import { ArrowRightIcon } from "./icons.jsx";
import Hero from "./Hero.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { gambar } from "../lib/asets.js";

/* Blok konten — teks diambil dari kamus `karir.*` (id/en), gambar tetap di sini. */
const CAREER_BLOCKS = [
  { kunci: "blok1", image: gambar("/images/sekilas.jpg") },
  { kunci: "blok2", image: gambar("/images/tata-nilai.jpg") },
  { kunci: "blok3", image: gambar("/images/tonggak-2024.jpg") },
];

function CareerBlock({ block, reverse }) {
  const { t } = useI18n();
  const judul = t(`karir.${block.kunci}Judul`);
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8 md:py-24">
      <div className={`flex flex-col items-center gap-8 md:gap-14 lg:flex-row ${reverse ? "lg:flex-row-reverse" : ""}`}>
        <div className="w-full lg:w-1/2">
          <img src={block.image} alt={judul} title={judul} width={800} height={600} className="aspect-[4/3] w-full rounded-lg object-cover shadow-lift" loading="lazy" />
        </div>
        <div className="w-full lg:w-1/2">
          <span className="font-bold text-[#0B4D8C]">{t(`karir.${block.kunci}Eyebrow`)}</span>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-[#252A64] md:text-5xl">{judul}</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">{t(`karir.${block.kunci}Isi`)}</p>
          <a href="#talenta" className="mt-6 inline-flex items-center gap-2 font-semibold text-[#0B4D8C] hover:underline"><span>{t("karir.pelajari")}</span><ArrowRightIcon className="size-5" /></a>
        </div>
      </div>
    </section>
  );
}

export default function RecruitmentCareer() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t("karir.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  return (
    <div className="min-h-screen bg-paper text-slate-900">
      <Hero
        title={t("karir.judul")}
        description={t("karir.deskripsi")}
        crumbs={[
          { label: t("common.home"), to: "/" },
          { label: t("karir.judul") },
        ]}
        image={gambar("/images/hero-about.jpg")}
      />
      <main>
        <section id="talenta" className="bg-paper">
          {CAREER_BLOCKS.map((block, index) => <CareerBlock key={block.kunci} block={block} reverse={index % 2 === 1} />)}
        </section>
        <section className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8 md:py-24">
          <h2 className="text-3xl font-bold leading-tight text-[#252A64] md:text-5xl">{t("karir.artikel")}</h2>
          <ul className="mt-8 space-y-4 text-base leading-8 text-slate-600">
            <li><strong className="text-[#252A64]">{t("karir.l1a")}</strong>{t("karir.l1b")}</li>
            <li><strong className="text-[#252A64]">{t("karir.l2a")}</strong>{t("karir.l2b")}</li>
            <li><strong className="text-[#252A64]">{t("karir.l3a")}</strong>{t("karir.l3b")}</li>
          </ul>
          <p className="mt-6 text-base leading-8 text-slate-600">{t("karir.kirim")}</p>
        </section>
        <section className="bg-[#F2F5FA] px-5 py-16 text-center md:py-24">
          <span className="font-bold text-[#0B4D8C]">{t("karir.tutupEyebrow")}</span>
          <h2 className="mx-auto mt-2 max-w-3xl text-3xl font-bold text-[#252A64] md:text-5xl">{t("karir.tutupJudul")}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">{t("karir.tutupIsi")}</p>
          <a href="mailto:info@komunitascatur.or.id?subject=Lamaran%20Kontribusi%20Komunitas" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#252A64] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0B4D8C]">{t("karir.tutupTombol")} <ArrowRightIcon className="size-5" /></a>
        </section>
      </main>
    </div>
  );
}
