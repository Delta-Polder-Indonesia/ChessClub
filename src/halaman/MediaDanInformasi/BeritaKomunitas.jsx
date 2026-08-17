import { useEffect, useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ambilBeritaPublik } from "../../lib/chessAnggota.js";
import DaftarKontenMedia from "../../components/DaftarKontenMedia.jsx";

export default function BeritaKomunitas() {
  const { t } = useI18n();
  const [daftar, setDaftar] = useState(null);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    let batal = false;
    ambilBeritaPublik()
      .then((d) => {
        if (!batal) setDaftar(d);
      })
      .catch((e) => {
        if (!batal) setGalat(e.message);
      });
    return () => {
      batal = true;
    };
  }, []);

  return (
    <HalamanIsi
      title={t("berita.judul")}
      parent={t("nav.mediaDanInformasi")}
      parentPath="/media-dan-informasi"
      description={t("berita.deskripsi")}
      next={{
        to: "/media-dan-informasi/pengumuman",
        judul: t("nav.pengumuman"),
      }}
    >
      <PageArtikel title={t("berita.artikel")}>
        {galat && <p className="text-sm text-red-600">{galat}</p>}
        {daftar === null && !galat ? (
          <p className="text-sm text-slate-500">Memuat berita…</p>
        ) : daftar && daftar.length ? (
          <DaftarKontenMedia daftar={daftar} jenis="berita" />
        ) : (
          <p className="text-sm text-slate-500">Belum ada berita komunitas.</p>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
