import { useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import DaftarAnggota from "../Keanggotaan/DaftarAnggota.jsx";
import Pengurus from "./Pengurus.jsx";
import StrukturOrganisasiCatur from "./StrukturOrganisasiCatur.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function StrukturGrupCatur() {
  const { t } = useI18n();
  const [tab, setTab] = useState("pengurus");

  const TAB_MENU = [
    { id: "pengurus", label: t("nav.pengurus") },
    { id: "organisasi", label: t("nav.strukturOrganisasiCatur") },
    { id: "keanggotaan", label: t("nav.keanggotaan") },
  ];

  return (
    <HalamanIsi
      title={t("strukturGrupCatur.judul")}
      description={t("strukturGrupCatur.deskripsi")}
      parent={t("nav.tentangKami")}
      parentPath="/tentang-kami"
      submenu={
        <StickyMenu
          sections={TAB_MENU}
          activeId={tab}
          onSelect={setTab}
        />
      }
    >
      {tab === "pengurus" && <Pengurus />}
      {tab === "organisasi" && <StrukturOrganisasiCatur />}
      {tab === "keanggotaan" && (
        <PageArtikel title={t("keanggotaan.artikel")}>
          <DaftarAnggota />
        </PageArtikel>
      )}
    </HalamanIsi>
  );
}
