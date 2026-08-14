import { useEffect } from "react";
import { ArrowRightIcon } from "./icons.jsx";
import Hero from "./Hero.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { gambar } from "../lib/asets.js";

const CAREER_BLOCKS = [
  {
    eyebrow: "Siapa Kami?",
    title: "Komunitas Catur Indonesia",
    image: gambar("/images/sekilas.jpg"),
    body: "Komunitas Catur Indonesia adalah wadah bermain, belajar, dan bertumbuh bagi pecatur dari berbagai daerah. Kami menjalankan turnamen, kelas, media, keanggotaan, dan teknologi dalam satu ekosistem yang terbuka.",
  },
  {
    eyebrow: "Bergabung Bersama Kami",
    title: "Siap Menjadi Bagian dari Perjalanan",
    image: gambar("/images/tata-nilai.jpg"),
    body: "Melalui program relawan, pelatih, media, dan sekretariat, setiap orang memiliki ruang untuk mengembangkan kemampuan sekaligus memberi dampak bagi pembinaan catur Indonesia.",
  },
  {
    eyebrow: "Nilai Kami",
    title: "Sportivitas, Prestasi, dan Pembinaan",
    image: gambar("/images/tonggak-2024.jpg"),
    body: "Kami bekerja dengan amanah, kompeten, harmonis, loyal, adaptif, dan kolaboratif. Nilai tersebut menjadi dasar dalam mengambil keputusan di papan permainan maupun di balik layar.",
  },
];

function CareerBlock({ block, reverse }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 md:px-8 md:py-24">
      <div className={`flex flex-col items-center gap-8 md:gap-14 lg:flex-row ${reverse ? "lg:flex-row-reverse" : ""}`}>
        <div className="w-full lg:w-1/2">
          <img src={block.image} alt={block.title} title={block.title} className="aspect-[4/3] w-full rounded-xl object-cover shadow-lg" loading="lazy" />
        </div>
        <div className="w-full text-justify lg:w-1/2">
          <span className="font-bold text-[#0B4D8C]">{block.eyebrow}</span>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-[#252A64] md:text-5xl">{block.title}</h2>
          <p className="mt-5 text-base leading-8 text-slate-600">{block.body}</p>
          <a href="#talenta" className="mt-6 inline-flex items-center gap-2 font-semibold text-[#0B4D8C] hover:underline"><span>Pelajari lebih lanjut</span><ArrowRightIcon className="size-5" /></a>
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
    <div className="min-h-screen bg-white text-slate-900">
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
        <section id="talenta" className="bg-white">
          {CAREER_BLOCKS.map((block, index) => <CareerBlock key={block.title} block={block} reverse={index % 2 === 1} />)}
        </section>
        <section className="bg-[#F2F5FA] px-5 py-16 text-center md:py-24">
          <span className="font-bold text-[#0B4D8C]">Bergabung Bersama Kami</span>
          <h2 className="mx-auto mt-2 max-w-3xl text-3xl font-bold text-[#252A64] md:text-5xl">Mari tumbuh dan berkontribusi untuk catur Indonesia</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">Pilih peran yang sesuai dengan kemampuan Anda, siapkan portofolio singkat, lalu kirimkan melalui email resmi komunitas.</p>
          <a href="mailto:info@komunitascatur.or.id?subject=Lamaran%20Kontribusi%20Komunitas" className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#252A64] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0B4D8C]">Kirim Lamaran <ArrowRightIcon className="size-5" /></a>
        </section>
      </main>
    </div>
  );
}
