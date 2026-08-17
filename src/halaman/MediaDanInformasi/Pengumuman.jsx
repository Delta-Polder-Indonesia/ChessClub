import { useEffect, useState } from "react";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ambilPengumumanPublik } from "../../lib/chessAnggota.js";

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
          <ul className="space-y-6">
            {daftar.map((p) => (
              <li
                key={p.id}
                className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3"
              >
                <h3 className="text-base font-semibold text-slate-900">
                  {p.judul}
                </h3>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {p.tanggal}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{p.isi}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Belum ada pengumuman.</p>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
