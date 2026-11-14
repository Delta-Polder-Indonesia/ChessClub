/**
 * Halaman /rating-ulasan — daftar semua ulasan dalam satu halaman (vertikal).
 *
 * Pola yang dipakai adalah layout yang sekarang dipakai di kartu ulasan
 * (play-store style), tanpa carousel. Di bagian atas: tombol Kembali,
 * judul, ringkasan agregat (skor + bar distribusi), lalu daftar kartu
 * ulasan penuh (line-clamp dihapus agar pesan terbaca seluruhnya).
 */
import { useI18n } from "../../lib/i18n.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";
import { useUlasan } from "../Landing/gunakanUlasan.js";
import { KartuUlasan, Ringkasan } from "../Landing/komponen-rating.jsx";

export default function SemuaUlasan() {
  const { t, locale } = useI18n();
  const { urut, vote } = useUlasan();

  return (
    <>
      <MetaHalaman
        title={t("landing.rating.judul")}
        description={t("landing.rating.subJudul")}
      />
      <div className="min-h-screen bg-paper">
        <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-14 md:px-8 md:pt-14 md:pb-20">
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
