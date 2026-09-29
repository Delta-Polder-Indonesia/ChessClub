/**
 * "Tiga jalan ke depan" — jalur belajar, berlatih, dan bertanding.
 *
 * Komponen sengaja terpisah dari Landing.jsx supaya mudah diubah sendiri:
 * teks, tautan, atau susunan kartu cukup disentuh di sini tanpa mengusik
 * kerangka halaman. Seluruh copy ditulis asli untuk KCI, mengikuti bahasa
 * desain datar KCI: border tipis, satu aksen, tanpa emoji dan tanpa gradien.
 */
import { useI18n } from "../../lib/i18n.jsx";
import { Link } from "react-router-dom";
import { Brain, GraduationCap, Puzzle } from "lucide-react";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { gambar } from "../../lib/asets.js";

const GAMBAR_BUKU_TULIS = gambar("/images/buku_tulis.webp");

function KartuUnggulan({ jalan, t }) {
  const Ikon = jalan.ikon;
  return (
    <article className="grid grid-cols-1 md:grid-cols-[1fr_563px] border border-slate-300 rounded-lg bg-white overflow-hidden">
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 flex items-center justify-center rounded border border-slate-200 text-primary">
            <Ikon className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="font-serif font-semibold text-xl text-slate-900">{jalan.judul}</h3>
        </div>
        <p className="font-serif text-sm text-slate-600 leading-6">{jalan.desk}</p>
        <p className="font-serif text-xs text-slate-500">{jalan.terms}</p>
        <div>
          <Link
            to={jalan.to}
            className="inline-flex items-center gap-2 border border-black bg-transparent font-serif text-black font-semibold text-sm px-8 py-3 rounded transition-colors hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {jalan.cta}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </div>
      <img
        src={GAMBAR_BUKU_TULIS}
        alt="Materi belajar catur berjudul Buku Tulis"
        width={600}
        height={448}
        loading="lazy"
        decoding="async"
        className="w-full h-auto object-contain"
      />
    </article>
  );
}

function KartuKecil({ jalan, t }) {
  const Ikon = jalan.ikon;
  return (
    <Link
      to={jalan.to}
      className="group flex flex-col gap-3 border border-slate-300 rounded-lg bg-white p-6 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 flex items-center justify-center rounded border border-slate-200 text-primary">
          <Ikon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="font-serif font-semibold text-lg text-slate-900">{jalan.judul}</h3>
      </div>
      <p className="font-serif text-sm text-slate-600 leading-6">{jalan.desk}</p>
      <p className="flex items-center gap-2 mt-auto font-serif font-semibold text-sm text-slate-900 group-hover:text-primary">
        {jalan.cta}
        <ArrowRightIcon className="size-4" />
      </p>
    </Link>
  );
}

export default function TigaJalan() {
  const { t } = useI18n();

  const unggulan = {
    to: "/program-kami/ebook-panduan",
    ikon: GraduationCap,
    judul: t("landing.tigaJalanAkademiJudul"),
    desk: t("landing.tigaJalanAkademiDesk"),
    terms: t("landing.tigaJalanAkademiTerms"),
    cta: t("landing.tigaJalanAkademiCta"),
  };

  const sekunder = [
    {
      to: "/papan-interaktif",
      ikon: Puzzle,
      judul: t("landing.tigaJalanLatihanJudul"),
      desk: t("landing.tigaJalanLatihanDesk"),
      cta: t("landing.tigaJalanLatihanCta"),
    },
    {
      to: "/program-kami/analisa",
      ikon: Brain,
      judul: t("landing.tigaJalanAnalisaJudul"),
      desk: t("landing.tigaJalanAnalisaDesk"),
      cta: t("landing.tigaJalanAnalisaCta"),
    },
  ];

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pt-0 pb-16 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-10">
        <div className="max-w-2xl">
          <h2 className="font-serif font-semibold text-2xl md:text-3xl text-slate-900">
            {t("landing.tigaJalanJudul")}{" "}
            <em className="font-serif text-primary not-italic">{t("landing.tigaJalanJudulAccent")}</em>
          </h2>
        </div>
        <div className="flex flex-col gap-6 md:gap-8">
          <KartuUnggulan jalan={unggulan} t={t} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {sekunder.map((jalan) => (
              <KartuKecil key={jalan.to} jalan={jalan} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}