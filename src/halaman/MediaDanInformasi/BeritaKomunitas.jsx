import { useEffect, useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ambilBeritaPublik } from "../../lib/api/index.js";
import DaftarKontenMedia from "../../components/DaftarKontenMedia.jsx";

export default function BeritaKomunitas() {
  const { t } = useI18n();
  const [daftar, setDaftar] = useState(null);
  const [galat, setGalat] = useState(false);
  // Naikkan `percobaan` lewat tombol "Coba lagi" untuk mengulang permintaan
  // yang gagal — pengunjung tidak perlu memuat ulang seluruh halaman.
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    let batal = false;
    setDaftar(null);
    setGalat(false);
    ambilBeritaPublik()
      .then((d) => {
        if (!batal) setDaftar(d);
      })
      .catch(() => {
        if (!batal) setGalat(true);
      });
    return () => {
      batal = true;
    };
  }, [percobaan]);

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
        {galat ? (
          <div>
            <p className="text-sm text-red-600">{t("berita.gagal")}</p>
            <button
              type="button"
              onClick={() => setPercobaan((n) => n + 1)}
              className="mt-2 text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {t("common.cobaLagi")}
            </button>
          </div>
        ) : daftar === null ? (
          <p className="text-sm text-slate-500">{t("berita.memuat")}</p>
        ) : daftar.length ? (
          <DaftarKontenMedia daftar={daftar} jenis="berita" />
        ) : (
          <p className="text-sm text-slate-500">{t("berita.kosong")}</p>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
