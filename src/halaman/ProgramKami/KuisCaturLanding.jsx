import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { TombolConten } from "../../components/TombolConten.jsx";
import {
  TabelKonten,
  KepalaTabelKonten,
  BadanTabelKonten,
  BarisTabelKonten,
  JudulKolomKonten,
  SelTabelKonten,
} from "../../components/konten/TabelKonten.jsx";
import PapanStatis from "../../components/PapanStatis.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman landing "Kuis Catur" (/program-kami/kuis-catur).
 *
 * Halaman penjelas untuk kuis pilihan ganda 115 soal dalam 11 kategori di
 * /quiz-catur. Mengikuti DESIGN.md: serif untuk bacaan, sans untuk kontrol &
 * tabel ringkas, mono untuk angka & notasi; garis 1px datar tanpa gradien/glow
 * dan tanpa tumpukan kartu.
 */

const RUTE_ALAT = "/quiz-catur";
const RUTE_PEMBUKAAN = "/program-kami/pembukaan";
const RUTE_EBOOK = "/program-kami/ebook-panduan";
const RUTE_TEKA_TEKI = "/teka-teki/problem";
const HERO_IMAGE = "/images/ProgramKami/kuis-catur-hero.webp";

/**
 * Contoh soal berdiagram dari src/halaman/QuizCatur/daftar.js
 * (kategori "grandmaster": Adolf Anderssen vs Jean Dufresne, Berlin 1852).
 */
const FEN_CONTOH =
  "1r2k1r1/pbppnp1p/1b3P2/8/Q7/B1PB1q2/P4PPP/3R2K1 w - - 0 21";
const OPSI_CONTOH = [
  ["A", "Qxd7+"],
  ["B", "Qxa7"],
  ["C", "Bxe7"],
  ["D", "Bxh7"],
];

export default function KuisCaturLanding() {
  const { t } = useI18n();

  const daftarKategori = [
    {
      nama: t("kuisLanding.kat1Nama"),
      jumlah: t("kuisLanding.kat1Jumlah"),
      isi: t("kuisLanding.kat1Isi"),
    },
    {
      nama: t("kuisLanding.kat2Nama"),
      jumlah: t("kuisLanding.kat2Jumlah"),
      isi: t("kuisLanding.kat2Isi"),
    },
    {
      nama: t("kuisLanding.kat3Nama"),
      jumlah: t("kuisLanding.kat3Jumlah"),
      isi: t("kuisLanding.kat3Isi"),
    },
    {
      nama: t("kuisLanding.kat4Nama"),
      jumlah: t("kuisLanding.kat4Jumlah"),
      isi: t("kuisLanding.kat4Isi"),
    },
    {
      nama: t("kuisLanding.kat5Nama"),
      jumlah: t("kuisLanding.kat5Jumlah"),
      isi: t("kuisLanding.kat5Isi"),
    },
    {
      nama: t("kuisLanding.kat6Nama"),
      jumlah: t("kuisLanding.kat6Jumlah"),
      isi: t("kuisLanding.kat6Isi"),
    },
    {
      nama: t("kuisLanding.kat7Nama"),
      jumlah: t("kuisLanding.kat7Jumlah"),
      isi: t("kuisLanding.kat7Isi"),
    },
    {
      nama: t("kuisLanding.kat8Nama"),
      jumlah: t("kuisLanding.kat8Jumlah"),
      isi: t("kuisLanding.kat8Isi"),
    },
    {
      nama: t("kuisLanding.kat9Nama"),
      jumlah: t("kuisLanding.kat9Jumlah"),
      isi: t("kuisLanding.kat9Isi"),
    },
    {
      nama: t("kuisLanding.kat10Nama"),
      jumlah: t("kuisLanding.kat10Jumlah"),
      isi: t("kuisLanding.kat10Isi"),
    },
    {
      nama: t("kuisLanding.kat11Nama"),
      jumlah: t("kuisLanding.kat11Jumlah"),
      isi: t("kuisLanding.kat11Isi"),
    },
  ];

  const langkahSesi = [
    t("kuisLanding.langkah1"),
    t("kuisLanding.langkah2"),
    t("kuisLanding.langkah3"),
    t("kuisLanding.langkah4"),
  ];

  return (
    <HalamanIsi
      title={t("kuisLanding.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("kuisLanding.deskripsi")}
      metaDescription={t("kuisLanding.metaDeskripsi")}
      image={gambar(HERO_IMAGE)}
      imageWidth={1672}
      imageHeight={941}
      heroImage={HERO_IMAGE}
      next={{ to: RUTE_PEMBUKAAN, judul: t("nav.pembukaan") }}
    >
      <div className="font-serif">
        {/* Pengantar — kiri: judul, narasi & aksi utama; kanan: cuplikan soal berdiagram */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("kuisLanding.introJudul")}
            </h2>
            <div className="mt-8 grid gap-y-10 md:grid-cols-2 md:items-start md:gap-x-12">
              <div className="flex max-w-prose flex-col gap-y-5 font-serif text-base leading-relaxed text-pretty text-grey-600">
                <p className="m-0">{t("kuisLanding.intro1")}</p>
                <p className="m-0">{t("kuisLanding.intro2")}</p>
                <div className="mt-2 font-sans">
                  <TombolConten to={RUTE_ALAT}>{t("kuisLanding.cta")}</TombolConten>
                </div>
              </div>

              <figure className="m-0 mx-auto w-full max-w-md border border-grey-200 bg-paper p-4 md:mr-0">
                <p className="m-0 font-sans text-xs font-medium text-grey-600">
                  {t("kuisLanding.contohKategori")}
                </p>
                <PapanStatis
                  fen={FEN_CONTOH}
                  terakhir={null}
                  ariaLabel={t("kuisLanding.contohAriaPapan")}
                  className="mx-auto mt-3 max-w-64"
                />
                <p className="mt-3.5 mb-0 font-serif text-sm font-semibold leading-snug text-pretty text-grey-800">
                  {t("kuisLanding.contohSoal")}
                </p>
                <ol className="mt-2.5 mb-0 grid list-none grid-cols-2 gap-2 p-0 font-mono text-xs text-grey-800">
                  {OPSI_CONTOH.map(([huruf, san]) => (
                    <li
                      key={huruf}
                      className="flex items-center gap-2 border border-grey-200 px-2.5 py-1.5"
                    >
                      <span className="font-sans font-semibold text-grey-600">
                        {huruf}.
                      </span>
                      <span>{san}</span>
                    </li>
                  ))}
                </ol>
                <figcaption className="mt-3 border-t border-grey-200 pt-2.5 text-xs leading-relaxed text-grey-600">
                  {t("kuisLanding.contohCaption")}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* Sebelas kategori materi — tabel datar 1px sesuai data daftar.js */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("kuisLanding.kategoriJudul")}
            </h2>
            <p className="mt-5 mb-0 max-w-prose text-base leading-relaxed text-pretty text-grey-600">
              {t("kuisLanding.kategoriLead")}
            </p>

            <div className="mt-10 border-t border-grey-200 pt-4">
              <TabelKonten>
                <KepalaTabelKonten>
                  <BarisTabelKonten>
                    <JudulKolomKonten className="py-3 font-medium text-grey-800">
                      {t("kuisLanding.kolomKategori")}
                    </JudulKolomKonten>
                    <JudulKolomKonten className="py-3 text-right font-medium text-grey-800">
                      {t("kuisLanding.kolomJumlah")}
                    </JudulKolomKonten>
                    <JudulKolomKonten className="py-3 font-medium text-grey-800">
                      {t("kuisLanding.kolomCakupan")}
                    </JudulKolomKonten>
                  </BarisTabelKonten>
                </KepalaTabelKonten>
                <BadanTabelKonten>
                  {daftarKategori.map((kat) => (
                    <BarisTabelKonten key={kat.nama}>
                      <SelTabelKonten className="py-3.5 align-top font-serif text-base font-semibold whitespace-nowrap text-grey-800">
                        {kat.nama}
                      </SelTabelKonten>
                      <SelTabelKonten className="py-3.5 text-right align-top font-mono text-sm font-medium tabular-nums whitespace-nowrap text-grey-800">
                        {kat.jumlah}
                      </SelTabelKonten>
                      <SelTabelKonten className="py-3.5 align-top font-serif text-sm leading-relaxed text-pretty text-grey-600">
                        {kat.isi}
                      </SelTabelKonten>
                    </BarisTabelKonten>
                  ))}
                </BadanTabelKonten>
              </TabelKonten>
              <p className="mt-4 mb-0 text-xs leading-relaxed text-grey-600">
                {t("kuisLanding.kategoriCatatan")}
              </p>
            </div>
          </div>
        </section>

        {/* Aturan sesi, peringkat lokal, & tautan ke materi pendalaman */}
        <section className="w-full border-t border-grey-200 bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-balance text-grey-800">
              {t("kuisLanding.caraJudul")}
            </h2>

            <div className="mt-10 grid gap-x-12 gap-y-10 border-t border-grey-200 pt-10 md:grid-cols-2">
              <div>
                <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                  {t("kuisLanding.caraSubjudul")}
                </h3>
                <ol className="mt-4 mb-0 flex list-decimal flex-col gap-y-3.5 pl-5 text-base leading-relaxed text-pretty text-grey-600">
                  {langkahSesi.map((langkah, idx) => (
                    <li key={idx} className="pl-1">
                      {langkah}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex max-w-prose flex-col gap-y-4">
                <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                  {t("kuisLanding.skorSubjudul")}
                </h3>
                <p className="m-0 text-base leading-relaxed text-pretty text-grey-600">
                  {t("kuisLanding.skor1")}
                </p>
                <p className="m-0 text-base leading-relaxed text-pretty text-grey-600">
                  {t("kuisLanding.skor2")}
                </p>
              </div>
            </div>

            <div className="mt-12 border-t border-grey-200 pt-8">
              <h3 className="m-0 font-serif text-lg font-semibold leading-snug text-grey-800">
                {t("kuisLanding.penutupJudul")}
              </h3>
              <p className="mt-3 mb-0 max-w-prose text-base leading-relaxed text-pretty text-grey-600">
                {t("kuisLanding.penutupAwal")}{" "}
                <Link
                  to={RUTE_EBOOK}
                  className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("nav.eBookPanduan")}
                </Link>
                , {t("kuisLanding.penutupTengah1")}{" "}
                <Link
                  to={RUTE_PEMBUKAAN}
                  className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("nav.pembukaan")}
                </Link>
                , {t("kuisLanding.penutupTengah2")}{" "}
                <Link
                  to={RUTE_TEKA_TEKI}
                  className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {t("nav.tekaTeki")}
                </Link>{" "}
                {t("kuisLanding.penutupAkhir")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </HalamanIsi>
  );
}
