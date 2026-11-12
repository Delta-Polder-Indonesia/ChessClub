import { Link } from "react-router-dom";
import {
  ChevronDown,
  Compass,
  Cpu,
  Eye,
  Layers,
  ListChecks,
  MessageSquareText,
  PlayCircle,
  Repeat,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import PapanStatis from "../../components/PapanStatis.jsx";
import { DAFTAR_TEMA } from "../TekaTeki/data/temaTekaTeki.js";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman "Teka-teki & Tips" (/program-kami/teka-teki).
 *
 * Pintu masuk ke alat latihan taktik tanpa batas waktu di /teka-teki/problem.
 * Mengikuti DESIGN.md: serif untuk bacaan, sans untuk kontrol & badge,
 * mono untuk angka & notasi; garis 1px datar tanpa gradien/glow dengan tata
 * letak kartu sorotan, langkah terstruktur, peta tema, kebiasaan kalkulasi,
 * dan tanya jawab.
 */

const RUTE_ALAT = "/teka-teki/problem";
const RUTE_SOAL_CONTOH = "/teka-teki/problem/1927";
const RUTE_RUSH_LANDING = "/program-kami/rush-teka-teki";
const RUTE_RUSH_ALAT = "/teka-teki-rush";
const RUTE_ANALISA = "/program-kami/analisa/papan";
const HERO_IMAGE = "/images/ProgramKami/teka-teki-hero.webp";

/**
 * Papan pengantar — posisi statis soal #1927 dari public/data/teka-teki.json
 * ("Mate in Two", rating 1095, French Defense: Normal Variation).
 */
const PAPAN_PENGENAL =
  "r2qrbk1/pb1n1pp1/1p1p1n1p/2pP2N1/2P5/2NBB3/PPQ2PPP/4RRK1 w - - 0 14";

export default function TekaTekiKonten() {
  const { t } = useI18n();

  const satuanSoal = t("tipsTekaTeki.kolomJumlah").toLowerCase();
  const satuanTema = t("tipsTekaTeki.temaSatuan");

  const daftarKoleksi = [
    {
      id: "lichess",
      ikon: Target,
      nama: t("tipsTekaTeki.kol1Nama"),
      jumlah: t("tipsTekaTeki.kol1Jumlah"),
      fokus: t("tipsTekaTeki.kol1Fokus"),
    },
    {
      id: "video",
      ikon: PlayCircle,
      nama: t("tipsTekaTeki.kol2Nama"),
      jumlah: t("tipsTekaTeki.kol2Jumlah"),
      fokus: t("tipsTekaTeki.kol2Fokus"),
    },
    {
      id: "legenda",
      ikon: Trophy,
      nama: t("tipsTekaTeki.kol3Nama"),
      jumlah: t("tipsTekaTeki.kol3Jumlah"),
      fokus: t("tipsTekaTeki.kol3Fokus"),
    },
    {
      id: "studi",
      ikon: Compass,
      nama: t("tipsTekaTeki.kol4Nama"),
      jumlah: t("tipsTekaTeki.kol4Jumlah"),
      fokus: t("tipsTekaTeki.kol4Fokus"),
    },
    {
      id: "arsip",
      ikon: Layers,
      nama: t("tipsTekaTeki.kol5Nama"),
      jumlah: t("tipsTekaTeki.kol5Jumlah"),
      fokus: t("tipsTekaTeki.kol5Fokus"),
    },
  ];

  const langkahLatihan = [
    {
      nomor: "01",
      judul: t("tipsTekaTeki.cara1Judul"),
      isi: t("tipsTekaTeki.cara1"),
    },
    {
      nomor: "02",
      judul: t("tipsTekaTeki.cara2Judul"),
      isi: t("tipsTekaTeki.cara2"),
    },
    {
      nomor: "03",
      judul: t("tipsTekaTeki.cara3Judul"),
      isi: t("tipsTekaTeki.cara3"),
    },
    {
      nomor: "04",
      judul: t("tipsTekaTeki.cara4Judul"),
      isi: t("tipsTekaTeki.cara4"),
    },
  ];

  const alatEvaluasi = [
    {
      id: "komentator",
      ikon: MessageSquareText,
      judul: t("tipsTekaTeki.bantu1Judul"),
      badge: t("tipsTekaTeki.bantu1Badge"),
      isi: t("tipsTekaTeki.bantu1"),
    },
    {
      id: "mesin",
      ikon: Cpu,
      judul: t("tipsTekaTeki.bantu2Judul"),
      badge: t("tipsTekaTeki.bantu2Badge"),
      isi: t("tipsTekaTeki.bantu2"),
    },
  ];

  const grupTema = DAFTAR_TEMA.map((g) => ({
    id: g.grup,
    judul: t(g.grup),
    jumlah: g.isi.length,
    item: g.isi.map(([nilai, kunci]) => ({ nilai, label: t(kunci) })),
  }));

  const pitaLevel = t("tipsTekaTeki.levelPita").split(" | ");
  const panjangLangkah = t("tipsTekaTeki.levelLangkah").split(" | ");

  const daftarTips = [
    {
      id: "urutan",
      ikon: ListChecks,
      judul: t("tipsTekaTeki.tips1Judul"),
      isi: t("tipsTekaTeki.tips1Isi"),
    },
    {
      id: "balasan",
      ikon: Eye,
      judul: t("tipsTekaTeki.tips2Judul"),
      isi: t("tipsTekaTeki.tips2Isi"),
    },
    {
      id: "motif",
      ikon: Repeat,
      judul: t("tipsTekaTeki.tips3Judul"),
      isi: t("tipsTekaTeki.tips3Isi"),
    },
    {
      id: "tingkat",
      ikon: TrendingUp,
      judul: t("tipsTekaTeki.tips4Judul"),
      isi: t("tipsTekaTeki.tips4Isi"),
    },
  ];

  const daftarFaq = [
    { id: "gratis", tanya: t("tipsTekaTeki.faq1Tanya"), jawab: t("tipsTekaTeki.faq1Jawab") },
    { id: "saring", tanya: t("tipsTekaTeki.faq2Tanya"), jawab: t("tipsTekaTeki.faq2Jawab") },
    { id: "unduh", tanya: t("tipsTekaTeki.faq3Tanya"), jawab: t("tipsTekaTeki.faq3Jawab") },
    { id: "salah", tanya: t("tipsTekaTeki.faq4Tanya"), jawab: t("tipsTekaTeki.faq4Jawab") },
    { id: "mesin", tanya: t("tipsTekaTeki.faq5Tanya"), jawab: t("tipsTekaTeki.faq5Jawab") },
  ];

  return (
    <HalamanIsi
      title={t("tipsTekaTeki.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("tipsTekaTeki.deskripsi")}
      metaDescription={t("tipsTekaTeki.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: RUTE_RUSH_LANDING, judul: t("nav.tekaTekiRush") }}
    >
      <div className="font-serif">
        {/* Pengantar — kiri: judul, narasi & aksi utama tunggal; kanan: papan contoh */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.introJudul")}
            </h2>
            <div className="mt-8 grid gap-y-10 md:grid-cols-2 md:items-start md:gap-x-12">
              <div className="flex max-w-prose flex-col gap-y-5 font-serif text-base leading-relaxed text-pretty text-grey-600">
                <p className="m-0">{t("tipsTekaTeki.intro1")}</p>
                <p className="m-0">{t("tipsTekaTeki.intro2")}</p>
                <div className="mt-2 font-sans">
                  <TombolConten to={RUTE_ALAT}>{t("tipsTekaTeki.ctaUtama")}</TombolConten>
                </div>
              </div>

              <figure className="m-0 mx-auto w-full max-w-md border border-grey-200 bg-paper p-2.5 md:mr-0">
                <PapanStatis
                  fen={PAPAN_PENGENAL}
                  terakhir={null}
                  ariaLabel={t("tipsTekaTeki.pengantarAriaPapan")}
                />
                <figcaption className="mt-2.5 flex flex-col gap-y-1 px-1 pb-0.5 text-xs leading-relaxed text-grey-600">
                  <span>{t("tipsTekaTeki.pengantarCaption")}</span>
                  <Link
                    to={RUTE_SOAL_CONTOH}
                    className="w-fit font-sans font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("tipsTekaTeki.pengantarTautan")}
                  </Link>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Lima koleksi soal — 1 kartu sorotan lebar + 4 kartu kurasi berbatas 1px */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.koleksiJudul")}
            </h2>
            <p className="mt-5 mb-0 max-w-prose text-base leading-relaxed text-pretty text-grey-600">
              {t("tipsTekaTeki.koleksiLead")}
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {daftarKoleksi.map((kol, idx) => {
                const Ikon = kol.ikon;
                const unggulan = idx === 0;
                return (
                  <article
                    key={kol.id}
                    className={`flex flex-col rounded-lg border border-grey-200 bg-paper p-6 transition-colors hover:border-grey-300 ${
                      unggulan ? "md:col-span-2 md:p-7" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grey-200 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <Ikon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                        <h3
                          className={`m-0 font-serif font-semibold leading-snug text-grey-800 ${
                            unggulan ? "text-xl" : "text-lg"
                          }`}
                        >
                          {kol.nama}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 rounded border px-2.5 py-0.5 font-mono text-sm font-medium tabular-nums ${
                          unggulan
                            ? "border-primary/25 bg-primary/5 text-primary"
                            : "border-grey-200 bg-paper text-grey-800"
                        }`}
                      >
                        {kol.jumlah} {satuanSoal}
                      </span>
                    </div>
                    <p
                      className={`m-0 mt-4 font-serif text-base leading-relaxed text-pretty text-grey-600 ${
                        unggulan ? "max-w-3xl" : "max-w-prose"
                      }`}
                    >
                      {kol.fokus}
                    </p>
                  </article>
                );
              })}
            </div>
            <p className="mt-6 mb-0 font-serif text-sm leading-relaxed text-grey-600">
              {t("tipsTekaTeki.koleksiCatatan")}
            </p>
          </div>
        </section>

        {/* Cara berlatih & alat bantu pasca-solusi — kartu langkah 01–04 + 2 kartu evaluasi */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.caraJudul")}
            </h2>

            <div className="mt-10 border-t border-grey-200 pt-10">
              <h3 className="m-0 font-serif text-xl font-semibold leading-snug text-grey-800">
                {t("tipsTekaTeki.caraSubjudul")}
              </h3>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {langkahLatihan.map((item) => (
                  <article
                    key={item.nomor}
                    className="flex flex-col rounded-lg border border-grey-200 bg-paper p-6 transition-colors hover:border-grey-300"
                  >
                    <div className="flex items-baseline gap-3 border-b border-grey-200 pb-3.5">
                      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-primary">
                        {item.nomor}
                      </span>
                      <h4 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                        {item.judul}
                      </h4>
                    </div>
                    <p className="m-0 mt-4 max-w-prose font-serif text-base leading-relaxed text-pretty text-grey-600">
                      {item.isi}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="mt-12 border-t border-grey-200 pt-10">
              <h3 className="m-0 font-serif text-xl font-semibold leading-snug text-grey-800">
                {t("tipsTekaTeki.bantuSubjudul")}
              </h3>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {alatEvaluasi.map((alat) => {
                  const Ikon = alat.ikon;
                  return (
                    <article
                      key={alat.id}
                      className="flex flex-col rounded-lg border border-grey-200 bg-paper p-6 transition-colors hover:border-grey-300"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grey-200 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <Ikon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                          <h4 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                            {alat.judul}
                          </h4>
                        </div>
                        <span className="shrink-0 rounded border border-grey-200 bg-paper px-2.5 py-0.5 font-sans text-xs font-medium text-grey-600">
                          {alat.badge}
                        </span>
                      </div>
                      <p className="m-0 mt-4 max-w-prose font-serif text-base leading-relaxed text-pretty text-grey-600">
                        {alat.isi}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Peta 18 tema & pita level — disusun sebagai kartu berlabel langsung dari data saringan */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.temaJudul")}
            </h2>
            <p className="mt-5 mb-0 max-w-prose text-base leading-relaxed text-pretty text-grey-600">
              {t("tipsTekaTeki.temaLead")}
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {grupTema.map((grup) => (
                <article
                  key={grup.id}
                  className="flex flex-col rounded-lg border border-grey-200 bg-paper p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grey-200 pb-3.5">
                    <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                      {grup.judul}
                    </h3>
                    <span className="shrink-0 rounded border border-grey-200 bg-paper px-2.5 py-0.5 font-mono text-sm font-medium tabular-nums text-grey-800">
                      {grup.jumlah} {satuanTema}
                    </span>
                  </div>
                  <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
                    {grup.item.map((motif) => (
                      <li
                        key={motif.nilai}
                        className="rounded border border-grey-200 bg-paper px-2.5 py-1 font-sans text-xs font-medium text-grey-800"
                      >
                        {motif.label}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}

              <article className="flex flex-col rounded-lg border border-grey-200 bg-paper p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grey-200 pb-3.5">
                  <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                    {t("tipsTekaTeki.levelJudul")}
                  </h3>
                  <span className="shrink-0 rounded border border-grey-200 bg-paper px-2.5 py-0.5 font-mono text-sm font-medium tabular-nums text-grey-800">
                    {t("tipsTekaTeki.levelBadge")}
                  </span>
                </div>
                <p className="m-0 mt-4 max-w-prose font-serif text-sm leading-relaxed text-pretty text-grey-600">
                  {t("tipsTekaTeki.levelRingkas")}
                </p>
                <div className="mt-3.5 flex flex-col gap-2.5">
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {pitaLevel.map((pita) => (
                      <li
                        key={pita}
                        className="rounded border border-grey-200 bg-paper px-2.5 py-1 font-mono text-xs font-medium text-grey-800"
                      >
                        {pita}
                      </li>
                    ))}
                  </ul>
                  <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                    {panjangLangkah.map((langkah) => (
                      <li
                        key={langkah}
                        className="rounded border border-primary/25 bg-primary/5 px-2.5 py-1 font-sans text-xs font-medium text-primary"
                      >
                        {langkah}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Empat kebiasaan menghitung taktik — 4 kartu kebiasaan 2×2 */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.tipsJudul")}
            </h2>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {daftarTips.map((item) => {
                const Ikon = item.ikon;
                return (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-lg border border-grey-200 bg-paper p-6 transition-colors hover:border-grey-300"
                  >
                    <div className="flex items-center gap-2.5 border-b border-grey-200 pb-3.5">
                      <Ikon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                      <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-balance text-grey-800">
                        {item.judul}
                      </h3>
                    </div>
                    <p className="m-0 mt-4 max-w-prose font-serif text-base leading-relaxed text-pretty text-grey-600">
                      {item.isi}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pertanyaan yang sering diajukan & panel penutup */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.faqJudul")}
            </h2>
            <p className="mt-5 mb-0 max-w-prose text-base leading-relaxed text-pretty text-grey-600">
              {t("tipsTekaTeki.faqLead")}
            </p>

            <div className="mt-10 flex flex-col gap-3">
              {daftarFaq.map((item) => (
                <details
                  key={item.id}
                  className="group rounded-lg border border-grey-200 bg-paper transition-colors hover:border-grey-300"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-serif text-base font-semibold leading-snug text-grey-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
                    <span>{item.tanya}</span>
                    <ChevronDown
                      className="size-4 shrink-0 text-grey-600 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="border-t border-grey-200 px-6 py-4">
                    <p className="m-0 max-w-prose font-serif text-base leading-relaxed text-pretty text-grey-600">
                      {item.jawab}
                    </p>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-12 flex flex-col gap-6 rounded-lg border border-grey-200 bg-paper p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div className="max-w-prose">
                <h3 className="m-0 font-serif text-xl font-semibold leading-snug text-grey-800">
                  {t("tipsTekaTeki.penutupJudul")}
                </h3>
                <p className="mt-3 mb-0 text-base leading-relaxed text-pretty text-grey-600">
                  {t("tipsTekaTeki.penutupAwal")}{" "}
                  <Link
                    to={RUTE_RUSH_ALAT}
                    className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("nav.tekaTekiRush")}
                  </Link>{" "}
                  {t("tipsTekaTeki.penutupTengah")}{" "}
                  <Link
                    to={RUTE_ANALISA}
                    className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {t("tipsTekaTeki.tautanAnalisa")}
                  </Link>{" "}
                  {t("tipsTekaTeki.penutupAkhir")}
                </p>
              </div>
              <div className="shrink-0 font-sans">
                <TombolConten to={RUTE_ALAT}>{t("tipsTekaTeki.ctaUtama")}</TombolConten>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
