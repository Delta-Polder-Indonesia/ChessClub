/**
 * Landing page (Beranda utama).
 *
 * Struktur halaman terinspirasi pola umum situs korporat — hero besar,
 * akses cepat, sorotan kegiatan, berita terkini, statistik, dan ajakan
 * bergabung — tetapi seluruh markup, komponen, dan konten di berkas ini
 * ditulis dari nol khusus untuk Komunitas Catur Indonesia. Tidak ada
 * kode maupun teks yang disalin dari situs pihak lain.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";
import { ambilBeritaPublik, ambilPengumumanPublik } from "../../lib/api/index.js";
import { ArrowRightIcon } from "../../components/icons.jsx";

function formatTanggal(nilai, bahasa) {
  if (!nilai) return "";
  const d = new Date(`${nilai}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return nilai;
  return new Intl.DateTimeFormat(bahasa === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Hero utama — foto latar + judul + dua tombol aksi. */
function LandingHero({ t }) {
  return (
    <section className="relative w-full h-[400px] lg:h-[500px] bg-hero overflow-hidden">
      <img
        src={gambar("/images/landing-hero.jpg")}
        srcSet={`${gambar("/images/landing-hero-828.jpg")} 828w, ${gambar("/images/landing-hero.jpg")} 1280w`}
        sizes="100vw"
        alt={t("landing.heroJudul")}
        width={1280}
        height={714}
        className="absolute inset-0 w-full h-full object-cover"
        draggable="false"
        decoding="async"
        fetchpriority="high"
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(2,22,36,0.55) 0%, rgba(2,22,36,0.55) 40%, rgba(2,22,36,0.92) 100%)",
        }}
      />
      <div className="relative z-[1] w-full h-full mx-auto max-w-[1080px] xl:max-w-7xl px-6 lg:px-8 xl:px-0 flex flex-col justify-end pb-10 md:pb-14 xl:pb-16 gap-4">
        <span className="text-blue-400 font-semibold tracking-wide text-sm md:text-base">
          {t("landing.heroEyebrow")}
        </span>
        <h1 className="text-white font-bold text-3xl md:text-5xl leading-tight max-w-3xl">
          {t("landing.heroJudul")}
        </h1>
        <p className="text-white/90 text-sm md:text-base max-w-2xl">
          {t("landing.heroDeskripsi")}
        </p>
        <div className="flex flex-wrap gap-4 mt-2">
          <Link
            to="/pendaftaran-anggota"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            {t("landing.heroCtaUtama")}
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            to="/turnamen"
            className="inline-flex items-center gap-2 border border-white text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-white hover:text-primary transition-colors"
          >
            {t("landing.heroCtaSekunder")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Kartu akses cepat ke empat area utama situs. */
function AksesCepat({ t }) {
  const kartu = [
    { to: "/tentang-kami", judul: t("landing.aksesTentang"), desk: t("landing.aksesTentangDesk") },
    { to: "/program-kami", judul: t("landing.aksesProgram"), desk: t("landing.aksesProgramDesk") },
    { to: "/turnamen", judul: t("landing.aksesTurnamen"), desk: t("landing.aksesTurnamenDesk") },
    { to: "/media-dan-informasi", judul: t("landing.aksesMedia"), desk: t("landing.aksesMediaDesk") },
  ];
  return (
    <section className="relative w-full -mt-12 md:-mt-16 z-[2] px-6 md:px-8 xl:px-0">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kartu.map((k) => (
          <Link
            key={k.to}
            to={k.to}
            className="group bg-white rounded-xl shadow-lg p-6 flex flex-col gap-2 hover:shadow-xl transition-shadow"
          >
            <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
              {k.judul}
            </h3>
            <p className="text-sm text-slate-500">{k.desk}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              <ArrowRightIcon className="size-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Tiga kartu sorotan kegiatan dengan foto. */
function SorotanKegiatan({ t }) {
  const sorotan = [
    {
      img: gambar("/images/landing-sorotan-turnamen.jpg"),
      judul: t("landing.sorotan1Judul"),
      isi: t("landing.sorotan1Isi"),
    },
    {
      img: gambar("/images/landing-sorotan-program.jpg"),
      judul: t("landing.sorotan2Judul"),
      isi: t("landing.sorotan2Isi"),
    },
    {
      img: gambar("/images/landing-sorotan-media.jpg"),
      judul: t("landing.sorotan3Judul"),
      isi: t("landing.sorotan3Isi"),
    },
  ];
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 md:py-20">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-10">
        <div className="max-w-2xl">
          <h2 className="font-semibold text-2xl md:text-3xl text-black">
            {t("landing.sorotanJudul")}
          </h2>
          <p className="mt-3 text-slate-600">{t("landing.sorotanDeskripsi")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {sorotan.map((s) => (
            <article key={s.judul} className="flex flex-col gap-4">
              <img
                src={s.img}
                alt={s.judul}
                width={960}
                height={640}
                className="w-full aspect-[3/2] object-cover rounded-xl"
                loading="lazy"
                decoding="async"
              />
              <h3 className="font-semibold text-lg text-slate-900">{s.judul}</h3>
              <p className="text-sm text-slate-600 leading-6">{s.isi}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Dua kolom: berita komunitas terbaru & pengumuman terbaru. */
function BeritaTerkini({ t, bahasa }) {
  const [berita, setBerita] = useState(null);
  const [pengumuman, setPengumuman] = useState(null);

  useEffect(() => {
    let hidup = true;
    ambilBeritaPublik()
      .then((d) => hidup && setBerita(d))
      .catch(() => hidup && setBerita([]));
    ambilPengumumanPublik()
      .then((d) => hidup && setPengumuman(d))
      .catch(() => hidup && setPengumuman([]));
    return () => {
      hidup = false;
    };
  }, []);

  return (
    <section className="w-full bg-slate-50 px-6 md:px-8 xl:px-0 py-16 md:py-20">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <div className="max-w-2xl mb-10">
          <h2 className="font-semibold text-2xl md:text-3xl text-black">
            {t("landing.beritaJudul")}
          </h2>
          <p className="mt-3 text-slate-600">{t("landing.beritaDeskripsi")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-900">
                {t("nav.beritaKomunitas")}
              </h3>
              <Link
                to="/media-dan-informasi/berita-komunitas"
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("landing.beritaLihatSemua")}
              </Link>
            </div>
            <ul className="flex flex-col divide-y divide-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
              {berita === null ? (
                <li className="px-5 py-4 text-sm text-slate-500">…</li>
              ) : berita.length === 0 ? (
                <li className="px-5 py-4 text-sm text-slate-500">
                  {t("landing.beritaKosong")}
                </li>
              ) : (
                berita.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/media-dan-informasi/berita/${item.id}`}
                      className="block px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <time className="text-xs text-slate-400">
                        {formatTanggal(item.tanggal, bahasa)}
                      </time>
                      <p className="font-medium text-slate-900 mt-1 hover:text-primary">
                        {item.judul}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-900">
                {t("nav.pengumuman")}
              </h3>
              <Link
                to="/media-dan-informasi/pengumuman"
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("landing.pengumumanLihatSemua")}
              </Link>
            </div>
            <ul className="flex flex-col divide-y divide-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
              {pengumuman === null ? (
                <li className="px-5 py-4 text-sm text-slate-500">…</li>
              ) : pengumuman.length === 0 ? (
                <li className="px-5 py-4 text-sm text-slate-500">
                  {t("landing.pengumumanKosong")}
                </li>
              ) : (
                pengumuman.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/media-dan-informasi/pengumuman/${item.id}`}
                      className="block px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <time className="text-xs text-slate-400">
                        {formatTanggal(item.tanggal, bahasa)}
                      </time>
                      <p className="font-medium text-slate-900 mt-1 hover:text-primary">
                        {item.judul}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Baris statistik ringkas komunitas. */
function StatistikKomunitas({ t }) {
  const angka = [
    [t("landing.statistik1Angka"), t("landing.statistik1Label")],
    [t("landing.statistik2Angka"), t("landing.statistik2Label")],
    [t("landing.statistik3Angka"), t("landing.statistik3Label")],
    [t("landing.statistik4Angka"), t("landing.statistik4Label")],
  ];
  return (
    <section className="w-full bg-primary px-6 md:px-8 xl:px-0 py-14 md:py-16">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <h2 className="text-white font-semibold text-2xl md:text-3xl text-center mb-10">
          {t("landing.statistikJudul")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
          {angka.map(([nilai, label]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-white font-bold text-3xl md:text-4xl">{nilai}</span>
              <span className="text-blue-100 text-xs md:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Ajakan bergabung — penutup halaman. */
function AjakanBergabung({ t }) {
  return (
    <section className="w-full px-6 md:px-8 xl:px-0 py-16 md:py-20 text-center">
      <div className="mx-auto max-w-2xl flex flex-col items-center gap-5">
        <h2 className="font-semibold text-2xl md:text-3xl text-black">
          {t("landing.ajakanJudul")}
        </h2>
        <p className="text-slate-600">{t("landing.ajakanDeskripsi")}</p>
        <Link
          to="/pendaftaran-anggota"
          className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          {t("landing.ajakanTombol")}
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export default function Landing() {
  const { t, bahasa } = useI18n();

  useEffect(() => {
    document.title = t("common.namaKomunitas");
  }, [t]);

  return (
    <>
      <LandingHero t={t} />
      <AksesCepat t={t} />
      <SorotanKegiatan t={t} />
      <BeritaTerkini t={t} bahasa={bahasa} />
      <StatistikKomunitas t={t} />
      <AjakanBergabung t={t} />
    </>
  );
}
