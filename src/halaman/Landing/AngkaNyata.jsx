/**
 * "Portal ini dalam angka" — empat penghitung yang bisa diverifikasi.
 *
 * Seksi ini menggantikan blok testimoni lama. Testimoni itu berisi nama dan
 * rating rekaan, dan PRODUCT.md melarang keras mengarang angka, testimoni,
 * klien, atau studi kasus. Yang bisa diunjukkan hari ini hanyalah isi
 * repositori: jumlah soal teka-teki, jalur buku pembukaan, berkas PDF
 * e-book, dan kunci FEN peta posisi. Angka dan labelnya diambil dari kamus
 * `landing` agar ID dan EN memakai sumber teks yang sama.
 *
 * Catatan jujur di bawah blok sengaja menyebut apa yang BELUM ada — galeri
 * masih sampel dan belum ada testimoni terkumpul — supaya halaman ini tidak
 * menjanjikan bukti yang tidak dimiliki klub.
 */
import { useI18n } from "../../lib/i18n.jsx";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../../components/icons.jsx";

/** Pasangan (nilai, label) per bahasa; urutan menentukan urutan tampil. */
const PENGHITUNG = [
  ["landing.angkaSoalNilai", "landing.angkaSoalLabel"],
  ["landing.angkaBukaNilai", "landing.angkaBukaLabel"],
  ["landing.angkaEbookNilai", "landing.angkaEbookLabel"],
  ["landing.angkaPetaNilai", "landing.angkaPetaLabel"],
];

export default function AngkaNyata() {
  const { t } = useI18n();

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pt-0 pb-16 md:pb-20 overflow-hidden">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <div className="max-w-2xl">
          <h2 className="font-serif font-semibold text-2xl md:text-3xl text-slate-900">
            {t("landing.angkaJudul")}
          </h2>
          <p className="mt-3 mb-0 font-serif text-sm leading-[1.6] text-slate-600 max-w-[65ch]">
            {t("landing.angkaDesk")}
          </p>
        </div>

        {/* Daftar bergaris, bukan kartu: satu garis rambut di atas, angka
            rata kiri tanpa warna aksen, label memakai token label. */}
        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-slate-200 pt-8 lg:grid-cols-4">
          {PENGHITUNG.map(([nilai, label]) => (
            <div key={label} className="flex flex-col gap-1.5">
              <dd className="m-0 font-serif text-[2rem] font-semibold leading-none tabular-nums text-slate-900">
                {t(nilai)}
              </dd>
              <dt className="font-sans text-xs font-medium uppercase tracking-[0.06em] text-slate-600">
                {t(label)}
              </dt>
            </div>
          ))}
        </dl>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="m-0 max-w-[75ch] font-serif text-sm leading-[1.6] text-slate-600">
            {t("landing.angkaCatatan")}
          </p>
          <Link
            to="/program-kami/atribusi"
            className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-[#0B2F9F] underline decoration-[#0B2F9F]/40 underline-offset-4 hover:decoration-[#0B2F9F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B2F9F] focus-visible:ring-offset-2"
          >
            {t("landing.angkaCatatanTautan")}
            <ArrowRightIcon className="size-4 -rotate-45" />
          </Link>
        </div>
      </div>
    </section>
  );
}
