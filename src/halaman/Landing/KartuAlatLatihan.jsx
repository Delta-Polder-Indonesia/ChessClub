/**
 * Dua kartu alat latihan — bagian dari halaman Landing.
 *
 * Semula berada di `TigaJalan.jsx` (seksi "Tiga jalan") bersama kartu
 * unggulan e-book. Kartu unggulan itu dihapus karena isinya mendeskripsikan
 * katalog e-book yang sama dengan seksi Pustaka. Dua kartu sisanya bukan
 * "jalur belajar" melainkan alat latihan, jadi dipindahkan ke bawah katalog
 * dan tidak lagi memakai judul seksi.
 *
 * `/images/buku_tulis.webp` masih ada di `public/` dan tidak dipakai lagi
 * di halaman ini.
 */
import { useI18n } from "../../lib/i18n.jsx";
import { Link } from "react-router-dom";
import { Brain, Puzzle } from "lucide-react";
import { ArrowRightIcon } from "../../components/icons.jsx";
import { JUDUL_PANEL, DESKRIPSI_PANEL } from "./gayaTeks.jsx";

function KartuKecil({ jalan }) {
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
        <h3 className={JUDUL_PANEL}>{jalan.judul}</h3>
      </div>
      <p className={DESKRIPSI_PANEL}>{jalan.desk}</p>
      <p className="flex items-center gap-2 mt-auto font-sans font-semibold text-sm text-grey-800 group-hover:text-primary">
        {jalan.cta}
        <ArrowRightIcon className="size-4" />
      </p>
    </Link>
  );
}

/* Kedua kartu diarahkan ke halaman penjelasan, bukan ke alatnya.
   "/program-kami/pembukaan" menjelaskan buku openings lalu memberi
   tautan ke papan interaktif; "/program-kami/analisa" menjelaskan Report
   Analisa lalu punya tombol ke "/program-kami/analisa/papan". Jadi satu
   klik dari Beranda selalu mendarat di halaman isi, dan masuk ke alat
   butuh klik kedua. */
function duaAlat(t) {
  return [
    {
      to: "/program-kami/pembukaan",
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
}

/** Dipakai `Landing.jsx` tepat di bawah seksi Pustaka. */
export function KartuAlatLatihan() {
  const { t } = useI18n();

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pb-12 md:pb-16 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {duaAlat(t).map((jalan) => (
          <KartuKecil key={jalan.to} jalan={jalan} />
        ))}
      </div>
    </section>
  );
}