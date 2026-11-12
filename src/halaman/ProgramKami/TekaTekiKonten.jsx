import { Link } from "react-router-dom";
import { Compass, Layers, PlayCircle, Target, Trophy } from "lucide-react";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import PapanStatis from "../../components/PapanStatis.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman "Teka-teki & Tips" (/program-kami/teka-teki).
 *
 * Pintu masuk ke alat latihan taktik tanpa batas waktu di /teka-teki/problem.
 * Mengikuti DESIGN.md: serif untuk bacaan, sans untuk kontrol & badge,
 * mono untuk angka & notasi; garis 1px datar tanpa gradien/glow dengan tata
 * letak 1 kartu sorotan lebar + 4 kartu kurasi.
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
    t("tipsTekaTeki.cara1"),
    t("tipsTekaTeki.cara2"),
    t("tipsTekaTeki.cara3"),
    t("tipsTekaTeki.cara4"),
  ];

  const daftarTips = [
    { judul: t("tipsTekaTeki.tips1Judul"), isi: t("tipsTekaTeki.tips1Isi") },
    { judul: t("tipsTekaTeki.tips2Judul"), isi: t("tipsTekaTeki.tips2Isi") },
    { judul: t("tipsTekaTeki.tips3Judul"), isi: t("tipsTekaTeki.tips3Isi") },
    { judul: t("tipsTekaTeki.tips4Judul"), isi: t("tipsTekaTeki.tips4Isi") },
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

        {/* Cara berlatih & alat bantu pasca-solusi */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.caraJudul")}
            </h2>

            <div className="mt-10 grid gap-x-12 gap-y-10 border-t border-grey-200 pt-10 md:grid-cols-2">
              <div>
                <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                  {t("tipsTekaTeki.caraSubjudul")}
                </h3>
                <ol className="mt-4 mb-0 flex list-decimal flex-col gap-y-3.5 pl-5 text-base leading-relaxed text-pretty text-grey-600">
                  {langkahLatihan.map((langkah, idx) => (
                    <li key={idx} className="pl-1">
                      {langkah}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex max-w-prose flex-col gap-y-4">
                <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                  {t("tipsTekaTeki.bantuSubjudul")}
                </h3>
                <p className="m-0 text-base leading-relaxed text-pretty text-grey-600">
                  {t("tipsTekaTeki.bantu1")}
                </p>
                <p className="m-0 text-base leading-relaxed text-pretty text-grey-600">
                  {t("tipsTekaTeki.bantu2")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tips menghitung taktik & tautan ke mode latihan terkait */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("tipsTekaTeki.tipsJudul")}
            </h2>

            <dl className="mt-10 grid gap-x-12 gap-y-9 border-t border-grey-200 pt-10 md:grid-cols-2">
              {daftarTips.map((item) => (
                <div key={item.judul} className="flex flex-col gap-y-2">
                  <dt className="font-serif text-lg font-semibold leading-snug text-balance text-grey-800">
                    {item.judul}
                  </dt>
                  <dd className="m-0 max-w-prose font-serif text-base leading-relaxed text-pretty text-grey-600">
                    {item.isi}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-12 border-t border-grey-200 pt-8">
              <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                {t("tipsTekaTeki.penutupJudul")}
              </h3>
              <p className="mt-3 mb-0 max-w-prose text-base leading-relaxed text-pretty text-grey-600">
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
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
