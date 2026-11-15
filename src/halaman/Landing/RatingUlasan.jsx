/**
 * Bagian Rating dan Ulasan di Landing.
 *
 * Ajakan memberi rating dan ringkasan grafik rating menempati dua kolom
 * berdampingan pada layar lebar, lalu bertumpuk di ponsel. Kartu ulasan tidak
 * ditampilkan di bagian Landing ini.
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import { useUlasan } from "./gunakanUlasan.js";
import { DeretBintang, IkonInfo, Ringkasan } from "./komponen-rating.jsx";

const KUNCI_BINTANG_HERO = "kci-ulasan-bintang-hero";

function Toast({ terbuka, pesan, onTutup }) {
  useEffect(() => {
    if (!terbuka) return undefined;
    const id = setTimeout(onTutup, 2400);
    return () => clearTimeout(id);
  }, [terbuka, onTutup]);

  if (!terbuka) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 font-sans text-sm font-medium text-paper shadow-lg"
    >
      {pesan}
    </div>
  );
}

export default function RatingUlasan() {
  const { t, locale } = useI18n();
  const { urut } = useUlasan();
  const navigate = useNavigate();
  const location = useLocation();
  const [toast, setToast] = useState(null);

  const [bintangHero, setBintangHero] = useState(() => {
    try {
      return Number(globalThis.sessionStorage?.getItem(KUNCI_BINTANG_HERO)) || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      if (bintangHero > 0) {
        globalThis.sessionStorage?.setItem(KUNCI_BINTANG_HERO, String(bintangHero));
      } else {
        globalThis.sessionStorage?.removeItem(KUNCI_BINTANG_HERO);
      }
    } catch {
      // Penyimpanan sesi bisa tidak tersedia dalam mode privat.
    }
  }, [bintangHero]);

  useEffect(() => {
    if (!location.state?.ulasTerkirim) return;

    setToast(t("landing.rating.terkirim", { n: location.state.bintang }));
    window.history.replaceState({ ...location.state, ulasTerkirim: false }, "");
  }, [location, t]);

  const pilihBintangHero = useCallback((nilai) => {
    setBintangHero((sebelumnya) => (sebelumnya === nilai ? 0 : nilai));
  }, []);

  const bukaHalamanTulis = useCallback(() => {
    navigate("/tulis-ulasan");
  }, [navigate]);

  return (
    <section className="w-full px-6 py-16 md:px-8 xl:px-0">
      <div className="mx-auto w-full max-w-[1080px] xl:max-w-7xl">
        <div className="grid gap-x-12 gap-y-8 lg:grid-cols-2">
          <section aria-labelledby="landing-rating-ajak" className="flex min-w-0 flex-col items-start gap-3">
            <h2 id="landing-rating-ajak" className="font-sans text-xl font-semibold text-foreground md:text-2xl">
              {t("landing.rating.ajakJudul")}
            </h2>
            <p className="font-sans text-base text-foregroundGrey">
              {t("landing.rating.ajakSub")}
            </p>
            <DeretBintang
              nilai={bintangHero}
              ukuran="xl"
              bisaUbah
              onPilih={pilihBintangHero}
            />
            <button
              type="button"
              onClick={bukaHalamanTulis}
              className="font-sans text-base font-medium text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:underline"
            >
              {t("landing.rating.tulisUlasan")}
            </button>
          </section>

          <section
            aria-labelledby="landing-rating-ringkasan"
            className="min-w-0 border-t border-grey-200 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"
          >
            <h2 id="landing-rating-ringkasan" className="font-sans text-xl font-semibold text-foreground md:text-2xl">
              {t("landing.rating.judul")}
            </h2>
            <p className="mt-2 flex items-start gap-1.5 font-sans text-sm text-foregroundGrey">
              <IkonInfo className="mt-0.5 size-4 flex-none" />
              <span>{t("landing.rating.subJudul")}</span>
            </p>
            <div className="mt-6">
              <Ringkasan ulasan={urut} locale={locale} />
            </div>
          </section>
        </div>
      </div>

      <Toast terbuka={!!toast} pesan={toast || ""} onTutup={() => setToast(null)} />
    </section>
  );
}
