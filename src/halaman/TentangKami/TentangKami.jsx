import StickyMenu from "../../components/StickyMenu.jsx";
import Sekilas from "../../components/Sekilas.jsx";
import Tonggak from "../../components/Tonggak.jsx";
import VisiMisi from "../../components/VisiMisi.jsx";
import MaknaLogo from "../../components/MaknaLogo.jsx";
import { HalamanIsi, PageArtikel, MastheadEditorial } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function TentangKami() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("hero.tentangKami")}
      description={t("hero.deskripsi")}
      next={{ to: "/tentang-kami/struktur-grup-catur", judul: t("nav.strukturGrupCatur") }}
      submenu={<StickyMenu />}
    >
      <div className="font-serif">
      <PageArtikel lebar>
        {/* ═══ Header Editorial / Koran ═══ */}
        <MastheadEditorial
          kicker={t("hero.tentangKami")}
          judul={t("hero.tentangKami")}
          subjudul={t("hero.deskripsi")}
        />
      </PageArtikel>

      <Sekilas />

      <div className="w-full border-t my-8 md:my-8 border-grey-200" />

      <Tonggak />

      <VisiMisi />

      <div className="w-full border-t my-24 md:my-24 border-grey-200" />

      <MaknaLogo />
      </div>
    </HalamanIsi>
  );
}