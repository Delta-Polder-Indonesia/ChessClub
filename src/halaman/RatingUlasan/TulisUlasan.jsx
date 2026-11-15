/**
 * Halaman /tulis-ulasan — halaman sendiri untuk menulis ulasan rating.
 *
 * - Menampilkan hero "Beri rating aplikasi ini" + bintang + form ulasan
 *   penuh (emoji, nama, pesan).
 * - Bintang awal diambil dari sessionStorage (dipilih di hero Landing),
 *   jika ada.
 * - Tombol Kembali (panah kiri) di pojok kiri atas.
 * - Saat Batal/Kirim: navigate(-1) kembali ke halaman sebelumnya.
 * - Saat kirim: ulasan disimpan via useUlasan.tambah, dan kita kirim
 *   location.state ke halaman tujuan supaya toast "Terima kasih!" bisa
 *   tampil di Landing saat kembali.
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FormUlasan } from "../Landing/komponen-rating.jsx";
import { useUlasan } from "../Landing/gunakanUlasan.js";
import { useI18n } from "../../lib/i18n.jsx";
import MetaHalaman from "../../components/MetaHalaman.jsx";

const KUNCI_BINTANG_HERO = "kci-ulasan-bintang-hero";

export default function TulisUlasan() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { tambah } = useUlasan();

  const [bintangAwal, setBintangAwal] = useState(0);

  useEffect(() => {
    let nilai = 0;
    try {
      nilai = Number(globalThis.sessionStorage?.getItem(KUNCI_BINTANG_HERO)) || 0;
    } catch { /* abaikan */ }
    if (location.state?.bintang) nilai = Number(location.state.bintang);
    setBintangAwal(nilai);
  }, [location.state]);

  const batal = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const kirim = useCallback(
    (data) => {
      const baru = tambah(data);
      try { globalThis.sessionStorage?.removeItem(KUNCI_BINTANG_HERO); } catch { /* abaikan */ }
      navigate(-1, { state: { ulasTerkirim: true, bintang: baru.bintang }, replace: false });
    },
    [tambah, navigate]
  );

  return (
    <>
      <MetaHalaman
        title={t("landing.rating.tulisUlasan")}
        description={t("landing.rating.ajakSub")}
      />
      <div className="mx-auto w-full max-w-2xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8">
          <div className="mb-6 flex flex-col items-start gap-2">
            <h1 className="font-sans text-2xl font-semibold text-foreground md:text-3xl">
              {t("landing.rating.ajakJudul")}
            </h1>
            <p className="font-sans text-base text-foregroundGrey">
              {t("landing.rating.ajakSub")}
            </p>
          </div>

          <FormUlasan
            t={t}
            bintangAwal={bintangAwal}
            onKirim={kirim}
            onBatal={batal}
          />
      </div>
    </>
  );
}
