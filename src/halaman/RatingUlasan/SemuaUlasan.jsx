/**
 * Halaman /rating-ulasan — daftar semua ulasan dalam satu halaman (vertikal).
 *
 * Pola yang dipakai adalah layout yang sekarang dipakai di kartu ulasan
 * (play-store style), tanpa carousel. Di bagian atas: tombol Kembali,
 * judul, ringkasan agregat (skor + bar distribusi), lalu daftar kartu
 * ulasan penuh (line-clamp dihapus agar pesan terbaca seluruhnya).
 */
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { useUlasan } from "../Landing/gunakanUlasan.js";
import {
  KartuUlasan,
  PanahKiri,
  Ringkasan,
} from "../Landing/komponen-rating.jsx";

export default function SemuaUlasan() {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const { urut, vote } = useUlasan();

  const kembali = useCallback(() => navigate(-1), [navigate]);

  return (
    <>
      <MetaHalaman
        title={t("landing.rating.judul")}
        description={t("landing.rating.subJudul")}
      />
      <div className="min-h-screen bg-paper">
        <div className="mx-auto w-full max-w-3xl px-6 pt-6 pb-14 md:px-8 md:pt-8 md:pb-20">
          <button
            type="button"
            onClick={kembali}
            aria-label={t("landing.rating.kembali")}
            className="-ml-3 mb-6 inline-flex items-center gap-2 rounded-full px-3 py-2 font-sans text-sm font-medium text-foreground transition-colors hover:bg-backgroundBox"
          >
            <PanahKiri className="size-5" />
            <span>{t("landing.rating.kembali")}</span>
          </button>

        <h1 className="font-sans text-2xl font-semibold text-foreground md:text-3xl">
          {t("landing.rating.judul")}
        </h1>

        <div className="mt-6">
          <Ringkasan ulasan={urut} locale={locale} />
        </div>

        <div className="mt-8 flex flex-col gap-4">
          {urut.map((u) => (
            <KartuUlasan key={u.id} t={t} ulasan={u} padaVote={vote} />
          ))}
        </div>
        </div>
      </div>
    </>
  );
}
