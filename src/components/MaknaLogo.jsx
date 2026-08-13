import Logo from "./Logo.jsx";
import { useI18n } from "../lib/i18n.jsx";

export default function MaknaLogo() {
  const { t } = useI18n();
  return (
    <section id="makna-logo" className="w-full relative bg-transparent">
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-16 md:pb-16 xl:pb-16 ml-0 mr-0">
        <div className="relative w-full mx-auto md:max-w-[1024px] flex flex-col gap-y-6 md:gap-y-8 lg:gap-y-10">
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            {t("maknaLogo.judul")}
          </h2>
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p>{t("maknaLogo.intro")}</p>
              <ol>
                <li>{t("maknaLogo.l1")}</li>
                <li>{t("maknaLogo.l2")}</li>
                <li>{t("maknaLogo.l3")}</li>
                <li>{t("maknaLogo.l4")}</li>
              </ol>
              <p>{t("maknaLogo.simbol")}</p>
              <ol>
                <li>{t("maknaLogo.s1")}</li>
                <li>{t("maknaLogo.s2")}</li>
                <li>{t("maknaLogo.s3")}</li>
                <li>{t("maknaLogo.s4")}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full relative pl-6 md:pl-8 xl:pl-20 pr-6 md:pr-8 xl:pr-20 pb-24 md:pb-24 xl:pb-24">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] border-guide flex flex justify-center items-center">
          <div className="flex flex-col justify-center items-center">
            <div className="rounded-xl px-12 py-10">
              <Logo variant="dark" size="lg" />
            </div>
            <p className="text-sm font-normal text-gray-500 mt-2">
              {t("maknaLogo.caption")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
