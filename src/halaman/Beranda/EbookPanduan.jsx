import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";

/** Pusat belajar yang hanya menautkan materi yang benar-benar tersedia. */
export default function EbookPanduan() {
  const panduan = [
    {
      title: "Belajar dasar catur",
      description: "Kenali papan, gerakan bidak, notasi, dan aturan permainan.",
      to: "/program-kami/sekolah-catur/cara-bermain-catur",
    },
    {
      title: "Panduan pembukaan",
      description: "Pelajari prinsip pembukaan dan ide strategis yang dapat dipraktikkan.",
      to: "/program-kami/pembukaan",
    },
    {
      title: "Latihan teka-teki",
      description: "Asah perhitungan variasi melalui koleksi teka-teki interaktif.",
      to: "/teka-teki",
    },
  ];

  return (
    <BagianBeranda id="ebook-catur" title="E-Book & Panduan">
      <p>
        Gunakan materi belajar berikut untuk membangun dasar permainan, menguji
        pemahaman, dan berlatih secara mandiri. Semua tautan mengarah ke materi
        yang sudah tersedia di situs.
      </p>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {panduan.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="block text-base font-bold text-slate-900 group-hover:text-primary">
              {item.title}
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-slate-600">
              {item.description}
            </span>
            <span className="mt-4 inline-block text-sm font-semibold text-primary">
              Buka materi →
            </span>
          </Link>
        ))}
      </div>
    </BagianBeranda>
  );
}
