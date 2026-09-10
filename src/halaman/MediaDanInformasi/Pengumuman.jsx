import { useEffect, useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ambilPengumumanPublik } from "../../lib/api/index.js";
import DaftarKontenMedia from "../../components/DaftarKontenMedia.jsx";

export default function Pengumuman() {
  const { t } = useI18n();
  const [daftar, setDaftar] = useState(null);
  const [galat, setGalat] = useState(false);
  // Tombol "Coba lagi" mengulang permintaan yang gagal tanpa memuat ulang halaman.
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    let batal = false;
    setDaftar(null);
    setGalat(false);
    ambilPengumumanPublik()
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
      title={t("pengumuman.judul")}
      description={t("pengumuman.deskripsi")}
      next={{ to: "/media-dan-informasi/galeri", judul: t("pengumuman.nextJudul") }}
    >
      <PageArtikel title={t("pengumuman.artikel")}>
        {galat ? (
          <div>
            <p className="text-sm text-red-600">{t("pengumuman.gagal")}</p>
            <button
              type="button"
              onClick={() => setPercobaan((n) => n + 1)}
              className="mt-2 text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {t("common.cobaLagi")}
            </button>
          </div>
        ) : daftar === null ? (
          <p className="text-sm text-slate-500">{t("pengumuman.memuat")}</p>
        ) : daftar.length ? (
          <DaftarKontenMedia daftar={daftar} jenis="pengumuman" />
        ) : (
          <p className="text-sm text-slate-500">{t("pengumuman.kosong")}</p>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
