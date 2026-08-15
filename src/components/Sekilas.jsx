import { useI18n } from "../lib/i18n.jsx";
import { gambar } from "../lib/asets.js";

export default function Sekilas() {
  const { t } = useI18n();
  return (
    <section
      id="sekilas-komunitas"
      className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-12 md:pb-12 xl:pb-16 pt-12 md:pt-12 xl:pt-24"
    >
      <div className="relative w-full mx-auto md:max-w-[1024px] flex flex-col gap-y-6 md:gap-y-8 lg:gap-y-10">
        <h2 className="focus:outline-none focus:ring-0 font-semibold text-2xl md:text-3xl text-black">
          {t("sekilas.judul")}
        </h2>
        <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
          <div className="relative z-[1] prose-kci max-w-none">
            <p className="ql-align-justify">{t("sekilas.p1")}</p>
            <p className="ql-align-justify">{t("sekilas.p2")}</p>
            <p className="ql-align-justify">{t("sekilas.p3")}</p>
            <p className="ql-align-justify">{t("sekilas.p4")}</p>
            <p className="ql-align-justify">{t("sekilas.p5")}</p>
            <p>{t("sekilas.p6")}</p>
          </div>
        </div>

        {/* Blok gambar dengan keterangan */}
        <div className="border-guide flex justify-center">
          <div className="flex flex-col justify-center items-center">
            <img
              src={gambar("/images/sekilas.jpg")}
              alt={t("sekilas.imgAlt")}
              width={1280}
              height={714}
              className="w-full h-auto object-cover"
              draggable="false"
              decoding="async"
              loading="lazy"
            />
            <p className="text-sm font-normal text-gray-500 mt-2">
              {t("sekilas.imgCaption")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
