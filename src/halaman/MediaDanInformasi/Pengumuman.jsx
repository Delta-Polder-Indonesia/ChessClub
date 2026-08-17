import { useEffect, useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ambilPengumumanPublik } from "../../lib/chessAnggota.js";
import DaftarKontenMedia from "../../components/DaftarKontenMedia.jsx";

export default function Pengumuman() {
  const { t } = useI18n();
  const [daftar, setDaftar] = useState(null);
  const [galat, setGalat] = useState("");

  useEffect(() => {
    let batal = false;
    ambilPengumumanPublik()
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
      title={t("pengumuman.judul")}
      description={t("pengumuman.deskripsi")}
      next={{ to: "/media-dan-informasi/galeri", judul: t("pengumuman.nextJudul") }}
    >
      <PageArtikel title={t("pengumuman.artikel")}>
        {galat && <p className="text-sm text-red-600">{galat}</p>}
        {daftar === null && !galat ? (
          <p className="text-sm text-slate-500">Memuat pengumuman…</p>
        ) : daftar && daftar.length ? (
          <DaftarKontenMedia daftar={daftar} jenis="pengumuman" />
        ) : (
          <p className="text-sm text-slate-500">Belum ada pengumuman.</p>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
