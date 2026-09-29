/**
 * "Kabar komunitas" — pintu masuk ke isi yang sudah ada di situs.
 *
 * Landing Lama hanya menautkan Turnamen, Papan Interaktif, dan e-book. Berita,
 * Pengumuman, Daftar Juara, dan Peringkat sudah punya halaman sendiri, tetapi
 * tidak pernah disebut di halaman pertama sehingga hanya bisa ditemukan lewat
 * header atau tautan tidak langsung. Seksi ini menutup celah itu.
 *
 * Susunannya daftar bergaris, bukan kartu: DESIGN.md melarang empat kartu
 * identik sebagai struktur halaman dan memilih baris dengan pemisah 1px.
 * Tautan ditunjuk apa adanya — tidak ada permintaan jaringan di sini, supaya
 * halaman yang memuat elemen LCP tidak menambah satu panggilan API pun. Isi
 * tiap halaman dimuat oleh halaman itu sendiri ketika pengunjung membukanya.
 */
import { useI18n } from "../../lib/i18n.jsx";
import { Link } from "react-router-dom";
import { BarChart3, Megaphone, Newspaper, Trophy } from "lucide-react";
import { ArrowRightIcon } from "../../components/icons.jsx";

/** Sumber kabar: rute, ikon, dan nama kunci i18n. Urutan menentukan urutan tampil. */
const SUMBER = [
  {
    to: "/media-dan-informasi/berita-komunitas",
    ikon: Newspaper,
    judul: "landing.kabarBeritaJudul",
    desk: "landing.kabarBeritaDesk",
  },
  {
    to: "/media-dan-informasi/pengumuman",
    ikon: Megaphone,
    judul: "landing.kabarPengumumanJudul",
    desk: "landing.kabarPengumumanDesk",
  },
  {
    to: "/beranda/daftar-juara",
    ikon: Trophy,
    judul: "landing.kabarJuaraJudul",
    desk: "landing.kabarJuaraDesk",
  },
  {
    to: "/beranda/peringkat",
    ikon: BarChart3,
    judul: "landing.kabarPeringkatJudul",
    desk: "landing.kabarPeringkatDesk",
  },
];

export default function KabarKomunitas() {
  const { t } = useI18n();

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pt-0 pb-16 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="font-serif font-semibold text-2xl md:text-3xl text-slate-900">
            {t("landing.kabarJudul")}
          </h2>
          <p className="mt-3 mb-0 font-serif text-sm leading-[1.6] text-slate-600 max-w-[70ch]">
            {t("landing.kabarDesk")}
          </p>
        </div>

        {/* Baris dengan pemisah 1px; tanpa kartu, tanpa bayangan, tanpa ikon
            besar. Ikon 16px di kiri hanya penanda jenis kabar, dan sudah
            aria-hidden karena nama halaman sudah tertulis di sebelahnya. */}
        <ul className="mt-10 border-t border-slate-200">
          {SUMBER.map(({ to, ikon: Ikon, judul, desk }) => (
            <li key={to} className="border-b border-slate-200">
              <Link
                to={to}
                className="group flex items-start gap-4 py-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2F9F] focus-visible:ring-offset-2"
              >
                <span className="h-9 w-9 flex-none flex items-center justify-center rounded border border-slate-200 text-[#0B2F9F]">
                  <Ikon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-serif text-lg font-semibold text-slate-900 transition-colors group-hover:text-[#0B2F9F]">
                    {t(judul)}
                  </span>
                  <span className="font-serif text-sm leading-6 text-slate-600 max-w-[70ch]">
                    {t(desk)}
                  </span>
                </span>
                <ArrowRightIcon className="mt-1 ml-auto size-5 flex-none -rotate-45 text-slate-400 transition-colors group-hover:text-[#0B2F9F]" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
