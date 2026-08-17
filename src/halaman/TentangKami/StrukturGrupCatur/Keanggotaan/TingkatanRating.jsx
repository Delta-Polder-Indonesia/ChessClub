import { useState } from "react";
import { ChevronDownIcon } from "../../../../components/icons.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";

export const TINGKATAN_RATING = [
  { id: "beginner", range: "0 – 800", min: 0, max: 800 },
  { id: "novice", range: "800 – 1200", min: 800, max: 1200 },
  { id: "intermediate", range: "1200 – 1600", min: 1200, max: 1600 },
  { id: "advanced", range: "1600 – 2000", min: 1600, max: 2000 },
  { id: "expert", range: "2000 – 2200", min: 2000, max: 2200 },
  { id: "master", range: "2200 – 2400", min: 2200, max: 2400 },
  { id: "elite", range: "2400+", min: 2400, max: null },
];

export default function TingkatanRating() {
  const { t } = useI18n();
  const [terbuka, setTerbuka] = useState(false);

  return (
    <section className="not-prose my-6" aria-labelledby="tingkatan-rating-title">
      <button
        type="button"
        onClick={() => setTerbuka((value) => !value)}
        aria-expanded={terbuka}
        aria-controls="tingkatan-rating-content"
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors md:px-5"
      >
        <span>
          <span id="tingkatan-rating-title" className="block text-xl font-semibold text-black md:text-2xl">
            {t("keanggotaan.tingkatanJudul")}
          </span>
          <span className="mt-1 block text-xs font-normal text-slate-500 md:text-sm">
            {terbuka ? t("keanggotaan.tingkatanTutup") : t("keanggotaan.tingkatanBuka")}
          </span>
        </span>
        <ChevronDownIcon className={`size-6 flex-none text-slate-600 transition-transform duration-200 ${terbuka ? "rotate-180" : ""}`} />
      </button>

      {terbuka && (
        <div id="tingkatan-rating-content" className="border-t border-slate-200 px-3 pb-3 pt-3 md:px-4 md:pb-4">
          <div className="overflow-x-auto">
            <table className="tingkat-rating">
              <thead>
                <tr>
                  <th scope="col">{t("keanggotaan.tingkatanRentang")}</th>
                  <th scope="col">{t("keanggotaan.tingkatanKategori")}</th>
                  <th scope="col">{t("keanggotaan.tingkatanPenjelasan")}</th>
                </tr>
              </thead>
              <tbody>
                {TINGKATAN_RATING.map((tingkat) => (
                  <tr key={tingkat.id}>
                    <td className="whitespace-nowrap font-semibold text-[#0B2F9F]">{tingkat.range}</td>
                    <td className="min-w-[190px] font-semibold text-slate-900">
                      {t(`keanggotaan.tingkatan.${tingkat.id}.label`)}
                    </td>
                    <td className="min-w-[320px] text-slate-600">
                      {t(`keanggotaan.tingkatan.${tingkat.id}.deskripsi`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
