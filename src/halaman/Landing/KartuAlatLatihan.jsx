/**
 * Dua alat latihan — bagian dari halaman Landing.
 *
 * Semula berada di `TigaJalan.jsx` (seksi "Tiga jalan") bersama kartu
 * unggulan e-book. Kartu unggulan itu dihapus karena isinya mendeskripsikan
 * katalog e-book yang sama dengan seksi Pustaka. Dua kartu sisanya bukan
 * "jalur belajar" melainkan alat latihan, jadi dipindahkan ke bawah katalog
 * dan tidak lagi memakai judul seksi.
 *
 * Tata letak mengikuti komposisi berpasangan: kolom kiri memuat nazwanya,
 * kolom kanan memuat daftarnya. Urutan dua kolom itu dipakai halaman ini
 * juga pada seksi Keberlanjutan, jadi bukan pola baru di halaman tersebut.
 *
 * Daftar alat memakai struktur daftar, bukan grid kartu Wilde, karena isinya
 * hanya dua item — `DESIGN.md` §3 melarang grid tiga kartu identik dan
 * menyebut "daftar terstruktur" sebagai gantinya.
 *
 * `/images/buku_tulis.webp` masih ada di `public/` dan tidak dipakai lagi
 * di halaman ini.
 */
import { useI18n } from "../../lib/i18n.jsx";
import { Link } from "react-router-dom";
import { BookOpen, Brain, Cpu, ListChecks, Timer } from "lucide-react";
import { ArrowRightIcon } from "../../components/icons.jsx";
import {
  JUDUL_SEKSI,
  JUDUL_KARTU,
  DESKRIPSI_KARTU,
} from "./gayaTeks.jsx";

/** Ikon teka-teki catur (SVG kustom). */
function IkonTekaTeki() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
      <path d="M200-200h520v-184l45-22q16-8 25.5-22t9.5-32q0-17-9.5-31.5T765-514l-45-21v-185H528l-10-68q-3-22-19.5-37T460-840q-23 0-39.5 15T401-788l-10 68H200v86q56 21 88 68t32 106q0 60-32 107t-88 68v85Zm0 80q-34 0-57-23t-23-57v-152q48 0 84-30.5t36-77.5q0-46-36-76t-84-32v-152q0-33 23.5-56.5T200-800h122q7-51 46-85.5t92-34.5q52 0 91 34.5t47 85.5h122q33 0 56.5 23.5T800-720v134q36 18 58 52t22 74q0 41-22 75t-58 51v134q0 34-23.5 57T720-120H200Zm300-340Z" />
    </svg>
  );
}

/**
 * Satu baris alat: ikon, nama, satu kalimat penjelasan, dan panah tujuan.
 * Keseluruhan baris adalah tautan, jadi teks tombol tidak diulang sebagai
 * baris terpisah — affordance-nya cukup dari border tipis dan panah yang
 * menyala saat hover.
 */
function BarisAlat({ alat }) {
  const Ikon = alat.ikon;
  return (
    <Link
      to={alat.to}
      className="group flex items-center gap-4 px-2 py-4 transition-colors hover:bg-grey-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <span className="flex size-10 flex-none items-center justify-center text-primary">
        <Ikon className="size-10" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={JUDUL_KARTU}>{alat.judul}</span>
        <span className={DESKRIPSI_KARTU}>{alat.desk}</span>
      </span>
      {/* `ArrowRightIcon` hanya menerima `className`, jadi penanda dekoratifnya
          diletakkan pada pembungkus, bukan pada SVG-nya. */}
      <span aria-hidden="true" className="flex-none text-grey-600 transition-colors group-hover:text-primary">
        <ArrowRightIcon className="size-5" />
      </span>
      {/* Tidak ditampilkan, tapi kata kerja aksinya dibawa ke nama aksesibel
          supaya pembaca layar tahu apa yang terjadi saat tautan ditekan,
          bukan sekadar nama alatnya. */}
      <span className="sr-only">{alat.cta}</span>
    </Link>
  );
}

/* Keenam kartu diarahkan ke halaman penjelasan masing-masing di
   /program-kami/*, bukan ke alatnya. Setiap halaman itu memuat cara kerja,
   contoh nyata, dan tombol ke alatnya; jadi satu klik dari Beranda selalu
   mendarat di halaman isi, dan masuk ke alat butuh klik kedua. */
function enamAlat(t) {
  return [
    {
      to: "/program-kami/teka-teki",
      ikon: IkonTekaTeki,
      judul: t("landing.alatTekaTekiJudul"),
      desk: t("landing.alatTekaTekiDesk"),
      cta: t("landing.alatTekaTekiCta"),
    },
    {
      to: "/program-kami/rush-teka-teki",
      ikon: Timer,
      judul: t("landing.alatRushJudul"),
      desk: t("landing.alatRushDesk"),
      cta: t("landing.alatRushCta"),
    },
    {
      to: "/program-kami/kuis-catur",
      ikon: ListChecks,
      judul: t("landing.alatKuisJudul"),
      desk: t("landing.alatKuisDesk"),
      cta: t("landing.alatKuisCta"),
    },
    {
      to: "/program-kami/analisa",
      ikon: Brain,
      judul: t("landing.alatAnalisaJudul"),
      desk: t("landing.alatAnalisaDesk"),
      cta: t("landing.alatAnalisaCta"),
    },
    {
      to: "/program-kami/pembukaan",
      ikon: BookOpen,
      judul: t("landing.alatPembukaanJudul"),
      desk: t("landing.alatPembukaanDesk"),
      cta: t("landing.alatPembukaanCta"),
    },
    {
      to: "/program-kami/manusia-vs-mesin",
      ikon: Cpu,
      judul: t("landing.alatManusiaVsMesinJudul"),
      desk: t("landing.alatManusiaVsMesinDesk"),
      cta: t("landing.alatManusiaVsMesinCta"),
    },
  ];
}

/** Dipakai `Landing.jsx` tepat di bawah seksi Pustaka. */
export function KartuAlatLatihan() {
  const { t } = useI18n();

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pb-12 md:pb-16 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl flex flex-col gap-8">
        <h2 className={JUDUL_SEKSI}>{t("landing.alatLatihanJudul")}</h2>

        <ul className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
          {enamAlat(t).map((alat) => (
            <li
              key={alat.to}
              className="border-b border-grey-200 [&:first-child]:border-t sm:[&:nth-child(-n+2)]:border-t"
            >
              <BarisAlat alat={alat} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}