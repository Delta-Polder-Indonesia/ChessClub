import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HalamanIsi } from "../../../components/PageBagian.jsx";
import StickyMenu from "../../../components/StickyMenu.jsx";
import Pengurus from "./Pengurus.jsx";
import StrukturOrganisasiCatur from "./StrukturOrganisasiCatur.jsx";
import Keanggotaan from "./Keanggotaan/Keanggotaan.jsx";
import { useI18n } from "../../../lib/i18n.jsx";

const TAB_ID = ["pengurus", "organisasi", "keanggotaan"];

function tabDariHash(hash) {
  const id = String(hash || "").replace(/^#/, "");
  return TAB_ID.includes(id) ? id : "pengurus";
}

export default function StrukturGrupCatur() {
  const { t } = useI18n();
  const lokasi = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => tabDariHash(window.location.hash));

  useEffect(() => {
    setTab(tabDariHash(lokasi.hash));
  }, [lokasi.hash]);

  const pilihTab = (id) => {
    setTab(id);
    navigate(`/tentang-kami/struktur-grup-catur#${id}`, { replace: true });
  };

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
      next={{ to: "/program-kami", judul: t("nav.programKami") }}
      submenu={
        <StickyMenu
          sections={TAB_MENU}
          activeId={tab}
          onSelect={pilihTab}
        />
      }
    >
      {tab === "pengurus" && <Pengurus />}
      {tab === "organisasi" && <StrukturOrganisasiCatur />}
      {tab === "keanggotaan" && <Keanggotaan />}
    </HalamanIsi>
  );
}
