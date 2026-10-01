import { Link } from "react-router-dom";
import { HalamanIsi } from "../../components/PageBagian.jsx";
import { Tombol } from "../../components/Tombol.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman "Program Kami" (/program-kami).
 *
 * Mengikuti DESIGN.md + craft-floor: palet biru/abu/putih tanpa gradien/glow,
 * garis 1px tegas, satu elevasi. Tanpa kicker/eyebrow, tanpa penomoran seksi
 * hiasan, dan tanpa mono sebagai kostum "teknis". Hierarki dibangun lewat
 * satu program sorotan lebar + daftar definisi sekunder. Konten dari `program.*`.
 */

/** Tautan teks dengan panah — affordance "buka halaman" yang konsisten. */
function TautanBuka({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex w-fit items-center gap-1.5 rounded text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {children}
      <ArrowRightIcon className="size-4" />
    </Link>
  );
}

export default function ProgramKami() {
  const { t } = useI18n();

  // Sorotan = program pertama (kelas berjenjang, titik masuk semua anggota).
  // Sisanya tampil sebagai daftar definisi dua kolom — bukan kartu kembar.
  const sekunder = [
    { kunci: "clinic" },
    { kunci: "sekolah" },
    { kunci: "panduan", to: "/program-kami/ebook-panduan", label: t("nav.eBookPanduan") },
    { kunci: "simultan" },
    { kunci: "tekaTeki", to: "/program-kami/teka-teki", label: t("nav.tekaTeki") },
  ];

  return (
    <HalamanIsi
      title={t("program.judul")}
      description={t("program.deskripsi")}
      next={{
        to: "/program-kami/teka-teki",
        judul: t("nav.tekaTeki"),
      }}
    >
      <div className="font-serif">
      {/* ═══ Sekilas Program — judul di atas, narasi di bawahnya ═══ */}
      <section className="w-full border-t border-grey-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <div className="flex flex-col gap-y-8">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("program.artikel")}
            </h2>
            <div className="flex flex-col gap-y-5 text-[1rem] leading-[1.8] text-pretty text-grey-600">
              <p className="m-0">{t("program.p1")}</p>
              <p className="m-0">{t("program.p2")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Program Unggulan — sorotan lebar + daftar definisi sekunder ═══ */}
      <section className="w-full border-t border-grey-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
            {t("program.programJudul")}
          </h2>

          {/* Program sorotan — foto + narasi, memberi hierarki yang jelas. */}
          <article className="mt-10 grid items-center gap-8 border-t border-grey-200 pt-10 md:mt-12 md:grid-cols-2 md:gap-12">
            <figure className="order-2 m-0 border border-grey-200 bg-white p-1.5 md:order-1">
              <img
                src={gambar("/images/landing-sorotan-program.webp")}
                alt="Sesi latihan berjenjang bersama pelatih Komunitas Catur Indonesia"
                width={640}
                height={427}
                draggable="false"
                decoding="async"
                loading="lazy"
                className="aspect-[3/2] w-full object-cover object-center"
              />
            </figure>
            <div className="order-1 md:order-2">
              <h3 className="font-serif text-[clamp(1.5rem,2vw,1.85rem)] font-light leading-[1.04] tracking-normal text-balance text-grey-800">
                {t("program.kartu.kelas.judul")}
              </h3>
              <p className="mt-3 text-[1rem] leading-[1.65] text-pretty text-grey-600">
                {t("program.kartu.kelas.deskripsi")}
              </p>
            </div>
          </article>

          {/* Program sekunder — daftar definisi dua kolom (tanpa kartu/nomor). */}
          <dl className="mt-12 grid gap-x-12 gap-y-9 border-t border-grey-200 pt-10 sm:grid-cols-2 md:mt-14">
            {sekunder.map((item) => (
              <div key={item.kunci} className="flex flex-col gap-y-2">
                <dt className="font-serif text-[1.0625rem] font-semibold leading-[1.35] text-balance text-grey-800">
                  {t(`program.kartu.${item.kunci}.judul`)}
                </dt>
                <dd className="m-0 text-sm leading-[1.6] text-pretty text-grey-600">
                  {t(`program.kartu.${item.kunci}.deskripsi`)}
                </dd>
                {item.to && (
                  <TautanBuka to={item.to}>
                    {t("common.selengkapnya")}: {item.label}
                  </TautanBuka>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ═══ Panduan dan Latihan Mandiri — panel ajakan datar + tautan ═══ */}
      <section className="w-full bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
          <div className="rounded-lg border border-grey-200 p-8 md:p-10">
            <h2 className="font-serif font-light text-[clamp(2.4rem,3.6vw,3.4rem)] leading-[1.04] tracking-normal text-grey-800">
              {t("program.h1")}
            </h2>
            <p className="mt-4 text-[1rem] leading-[1.8] text-pretty text-grey-600">
              {t("program.p3a")}{" "}
              <Link
                to="/program-kami/ebook-panduan"
                className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("nav.eBookPanduan")}
              </Link>{" "}
              {t("program.p3b")}{" "}
              <Link
                to="/program-kami/teka-teki"
                className="font-semibold text-primary underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("nav.tekaTeki")}
              </Link>{" "}
              {t("program.p3c")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Tombol to="/program-kami/ebook-panduan" variant="garis">
                {t("nav.eBookPanduan")}
                <ArrowRightIcon className="size-4" />
              </Tombol>
              <Tombol to="/program-kami/teka-teki" variant="garis">
                {t("nav.tekaTeki")}
                <ArrowRightIcon className="size-4" />
              </Tombol>
            </div>
          </div>
        </div>
      </section>
      </div>
    </HalamanIsi>
  );
}
