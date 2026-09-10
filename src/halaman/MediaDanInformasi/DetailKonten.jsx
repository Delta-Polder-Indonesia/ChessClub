import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { ArticleJsonLd } from "../../components/JsonLd.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import {
  ambilBeritaPublik,
  ambilPengumumanPublik,
} from "../../lib/api/index.js";

/**
 * Halaman detail satu berita / pengumuman.
 *
 * Mengikuti tata letak korporat yang dipakai halaman lain (Hero +
 * PageArtikel + navigasi "Selanjutnya"). Untuk daftar dipakai
 * DaftarKontenMedia; di sini judul di daftar bisa diklik ke halaman
 * ini sehingga pembaca tidak dibanjiri seluruh isi artikel sekaligus.
 */
function formatTanggal(tanggal, bahasa) {
  if (!tanggal) return "";
  const nilai = new Date(`${tanggal}T00:00:00Z`);
  if (Number.isNaN(nilai.getTime())) return tanggal;
  return new Intl.DateTimeFormat(bahasa === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(nilai);
}

export default function DetailKonten({ jenis }) {
  const { id } = useParams();
  const { t, bahasa } = useI18n();
  const [item, setItem] = useState(null);
  const [galat, setGalat] = useState(false); // konten tidak ditemukan
  const [gagal, setGagal] = useState(false); // permintaan ke server gagal
  // Tombol "Coba lagi" mengulang permintaan yang gagal tanpa memuat ulang halaman.
  const [percobaan, setPercobaan] = useState(0);

  const judulHalaman =
    jenis === "berita" ? t("nav.beritaKomunitas") : t("nav.pengumuman");
  const pathInduk =
    jenis === "berita"
      ? "/media-dan-informasi/berita-komunitas"
      : "/media-dan-informasi/pengumuman";
  const ambil =
    jenis === "berita" ? ambilBeritaPublik : ambilPengumumanPublik;

  useEffect(() => {
    let batal = false;
    setItem(null);
    setGalat(false);
    setGagal(false);
    ambil()
      .then((daftar) => {
        if (batal) return;
        const ketemu = (daftar || []).find((x) => x.id === id);
        if (!ketemu) {
          setGalat(true);
          return;
        }
        setItem(ketemu);
      })
      .catch(() => {
        if (!batal) setGagal(true);
      });
    return () => {
      batal = true;
    };
  }, [id, ambil, percobaan]);

  const next =
    jenis === "berita"
      ? { to: "/media-dan-informasi/pengumuman", judul: t("nav.pengumuman") }
      : { to: "/media-dan-informasi/galeri", judul: t("nav.galeri") };

  return (
    <HalamanIsi
      title={item?.judul || judulHalaman}
      parent={t("nav.mediaDanInformasi")}
      parentPath="/media-dan-informasi"
      description={item?.ringkasan || item?.judul || ""}
      next={next}
    >
      <PageArtikel title={item?.judul || judulHalaman}>
        {item && jenis === "berita" && (
          <ArticleJsonLd
            title={item.judul}
            description={item.ringkasan || item.judul}
            datePublished={item.tanggal}
            image={item.gambar || undefined}
          />
        )}
        {gagal && (
          <div>
            <p className="text-sm text-red-600">
              {jenis === "berita" ? t("berita.gagal") : t("pengumuman.gagal")}
            </p>
            <button
              type="button"
              onClick={() => setPercobaan((n) => n + 1)}
              className="mt-2 text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {t("common.cobaLagi")}
            </button>
          </div>
        )}
        {galat && <p className="text-sm text-red-600">{t("media.tidakDitemukan")}</p>}
        {!item && !galat && !gagal && (
          <p className="text-sm text-slate-500">{t("common.memuat")}</p>
        )}
        {item && (
          <article className="space-y-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {jenis === "berita" ? "Berita Komunitas" : "Pengumuman"}
              </span>
              <time dateTime={item.tanggal}>
                {formatTanggal(item.tanggal, bahasa)}
              </time>
            </div>

            {item.ringkasan && (
              <p className="text-base font-medium text-slate-700 md:text-lg">
                {item.ringkasan}
              </p>
            )}

            {item.gambar && (
              <figure>
                <img
                  src={item.gambar}
                  alt={item.altGambar || item.judul}
                  width="1280"
                  height="720"
                  className="h-auto w-full rounded-lg object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {item.altGambar &&
                  item.altGambar !== item.judul && (
                    <figcaption className="mt-2 text-sm text-slate-500">
                      {item.altGambar}
                    </figcaption>
                  )}
              </figure>
            )}

            <div
              className="prose-kci max-w-none whitespace-pre-wrap text-slate-700"
            >
              {item.isi}
            </div>

            <p className="pt-4">
              <Link
                to={pathInduk}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                ← {jenis === "berita" ? "Semua berita" : "Semua pengumuman"}
              </Link>
            </p>
          </article>
        )}
      </PageArtikel>
    </HalamanIsi>
  );
}
