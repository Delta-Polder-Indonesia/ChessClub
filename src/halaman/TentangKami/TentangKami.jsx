import { useEffect } from "react";
import Hero from "../../components/Hero.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import Sekilas from "../../components/Sekilas.jsx";
import Tonggak from "../../components/Tonggak.jsx";
import VisiMisi from "../../components/VisiMisi.jsx";
import MaknaLogo from "../../components/MaknaLogo.jsx";
import Struktur from "../../components/Struktur.jsx";
import { PageSelanjutnya } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function TentangKami() {
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${t("nav.tentangKami")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  return (
    <>
      <Hero />
      <StickyMenu />

      <Sekilas />

      <div className="w-full border-t my-8 md:my-8 border-grey-200" />

      <Tonggak />

      <VisiMisi />

      <div className="w-full border-t my-24 md:my-24 border-grey-200" />

      <MaknaLogo />

      <div className="w-full border-t my-0 md:my-0 border-grey-200" />

      <Struktur />

      <PageSelanjutnya
        to="/tentang-kami/struktur-grup-catur"
        judul={t("nav.strukturGrupCatur")}
      />
    </>
  );
}
