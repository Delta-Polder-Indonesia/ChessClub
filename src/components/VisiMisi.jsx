import { useI18n } from "../lib/i18n.jsx";
import { gambar } from "../lib/asets.js";

export default function VisiMisi() {
  const { t } = useI18n();
  return (
    <section id="visi-misi" className="w-full relative bg-transparent">
      {/* Visi & Misi */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-6 md:pb-6 xl:pb-16">
        <div className="relative w-full mx-auto md:max-w-[1024px] flex flex-col gap-y-6 md:gap-y-6 lg:gap-y-6">
          {/* Visi */}
          <h2 className="focus:outline-none focus:ring-0 text-black font-semibold text-3xl md:text-3xl">
            {t("visimisi.visi")}
          </h2>
          <div className="w-full">
            <div className="text-primary text-base md:text-base">
              {t("visimisi.visiLead")}
            </div>
          </div>
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p className="ql-align-justify">{t("visimisi.visiP1")}</p>
              <ol>
                <li className="ql-align-justify">{t("visimisi.visiL1")}</li>
                <li className="ql-align-justify">{t("visimisi.visiL2")}</li>
                <li className="ql-align-justify">{t("visimisi.visiL3")}</li>
              </ol>
            </div>
          </div>

          <div className="w-full h-4 md:h-6 bg-transparent" />

          {/* Misi */}
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            {t("visimisi.misi")}
          </h2>
          <div className="w-full">
            <div className="text-primary text-base md:text-base">
              {t("visimisi.misiLead")}
            </div>
          </div>
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p className="ql-align-justify">{t("visimisi.misiP1")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tata Nilai — judul */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-6 md:pb-6 xl:pb-16">
        <div className="relative w-full mx-auto md:max-w-[1024px]">
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            {t("visimisi.tataNilai")}
          </h2>
        </div>
      </div>

      {/* Tata Nilai — gambar */}
      <div className="w-full relative pl-6 md:pl-8 pr-6 md:pr-8">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] border-guide flex flex justify-center items-center">
          <div className="flex justify-center items-center">
            <div className="flex flex-col justify-center items-center">
              <img
                src={gambar("/images/tata-nilai.jpg")}
                alt={t("visimisi.nilaiImgAlt")}
                className="w-full h-auto object-cover"
                draggable="false"
                loading="lazy"
              />
              <p className="text-sm font-normal text-gray-500 mt-2">
                {t("visimisi.nilaiImgCaption")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
