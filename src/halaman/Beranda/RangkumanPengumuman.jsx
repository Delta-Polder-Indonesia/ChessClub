/**
 * Halaman: Rangkuman Pengumuman (item sidebar Beranda).
 *
 * Menampilkan pengumuman resmi terbaru yang dikelola pengurus, satu per satu
 * dengan markup ala section Keberlanjutan: label tanggal, judul, ringkasan,
 * dan tombol menuju detail pengumuman.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BagianBeranda } from "./TataLetakBeranda.jsx";
import { ambilPengumumanPublik } from "../../lib/api/index.js";
import { useI18n } from "../../lib/i18n.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";

export default function RangkumanPengumuman() {
  const [pengumuman, setPengumuman] = useState(null);
  const [gagal, setGagal] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    let hidup = true;
    ambilPengumumanPublik()
      .then((p) => {
        if (!hidup) return;
        setPengumuman(p);
      })
      .catch(() => {
        if (hidup) setGagal(true);
      });
    return () => {
      hidup = false;
    };
  }, []);

  return (
    <BagianBeranda id="pengumuman" title="Rangkuman Pengumuman">
      {/* Diperkecil ke text-sm & warna slate-600 agar lebih elegan */}
      <p className="ql-align-justify text-sm text-slate-600 leading-relaxed">
        Berikut rangkuman pengumuman resmi komunitas. Klik "Selengkapnya"
        untuk membuka isi pengumuman secara penuh.
      </p>

      {gagal ? (
        <p className="text-sm text-red-600 mt-4">Pengumuman sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.</p>
      ) : pengumuman === null ? (
        <p className="text-sm text-slate-500 mt-4 italic">Memuat pengumuman…</p>
      ) : pengumuman.length ? (
        <div className="mt-6 flex flex-col gap-y-8 md:gap-y-10">
          {pengumuman.map((p) => (
            <div key={p.id} className="w-full border-b border-slate-200 pb-8">
              <div className="w-full">
                {/* Ditambahkan tracking-wider agar label tanggal tampak rapi */}
                <p className="m-0 text-primary font-bold text-xs uppercase tracking-wider">
                  {p.tanggal}
                </p>
              </div>
              <div className="mt-2 w-full grid lg:grid-cols-[82%_18%] gap-x-10 md:gap-x-10 lg:gap-x-10 gap-y-6 md:gap-y-8 lg:justify-stretch lg:items-start">
                <div className="grid lg:grid-cols-[1fr_1fr] lg:max-w-[960px] xl:max-w-[1280px] gap-x-10 md:gap-x-10 lg:gap-x-10 gap-y-4 md:gap-y-6 lg:items-start">
                  {/* Diubah dari text-3xl ke text-base md:text-lg (ukuran standar akademik) */}
                  <h3 className="focus:outline-none focus:ring-0 font-semibold text-base md:text-lg text-slate-900 leading-snug">
                    {p.judul}
                  </h3>
                  <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
                    {/* Diubah ke text-sm, text-slate-600, dan leading-relaxed */}
                    <div className="relative z-1 prose prose-sm max-w-none text-justify text-sm text-slate-600 leading-relaxed">
                      <p>{p.isi}</p>
                    </div>
                  </div>
                </div>
                <div className="flex">
                  <Link
                    to={`/media-dan-informasi/pengumuman/${p.id}`}
                    title={`${t("common.selengkapnya")}: ${p.judul}`}
                    aria-label={`${t("common.selengkapnya")}: ${p.judul}`}
                    /* 
                      - Diubah dari text-sm ke text-xs
                      - Tinggi tombol dikurangi dari h-12 ke h-9
                      - Padding horizontal dikurangi dari px-6 ke px-4
                    */
                    className="text-xs h-9 px-4 gap-1.5 hover:gap-3 font-semibold leading-relaxed flex items-center justify-center transition-all duration-200 ease-in-out border border-solid border-slate-600 text-slate-600 hover:border-primary hover:bg-primary hover:text-white rounded-full flex-row"
                  >
                    <span className="order-1">{t("common.selengkapnya")}</span>
                    {/* Ukuran ikon panah diperkecil dari size-6 ke size-4 */}
                    <ArrowRightIcon className="order-2 size-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 mt-4 italic">Belum ada pengumuman.</p>
      )}
    </BagianBeranda>
  );
}