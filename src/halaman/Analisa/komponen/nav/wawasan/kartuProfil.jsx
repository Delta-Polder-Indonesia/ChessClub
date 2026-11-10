/**
 * Kartu profil Wawasan: bendera, gelar FIDE, tanggal bergabung, dan tombol
 * segarkan data pemain.
 *
 * Dipindah dari `layarWawasan.jsx` (Fase 3 lanjutan) tanpa perubahan perilaku.
 */
import { useEffect, useRef, useState } from "react";
import { segarkanKartuPemain, useKartuPemain } from "../../../../../lib/pemainCatur.js";
import LencanaGelar from "../../LencanaGelar.jsx";
import Refresh from "../../svg/refresh.jsx";
import { KELAS_RATING } from "./opsiWawasan.js";

const BENDERA = import.meta.glob("../../flags/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

function formatTanggalGabung(detik, locale) {
  if (!Number.isFinite(detik) || detik <= 0) return null;
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" })
      .format(new Date(detik * 1000));
  } catch {
    return null;
  }
}

function KartuProfilWawasan({ username, platform, t, locale }) {
  const kartuApi = useKartuPemain(username, !!username, platform);
  /*
   * Hasil muat ulang disimpan terpisah agar tidak ditimpa respons awal hook
   * yang mungkin baru tiba setelah refresh. `undefined` = belum ada override.
   */
  const [kartuUlang, setKartuUlang] = useState(undefined);
  const [memuat, setMemuat] = useState(false);
  const hidup = useRef(true);

  useEffect(() => {
    hidup.current = true;
    return () => {
      hidup.current = false;
    };
  }, []);

  async function muatUlang() {
    if (!username || memuat) return;
    setMemuat(true);
    try {
      const baru = await segarkanKartuPemain(username, platform);
      /* Ikuti acuan: kegagalan fetch mempertahankan profil yang sudah ada. */
      if (hidup.current && baru) setKartuUlang(baru);
    } catch {
      /* pertahankan kartu lama; API publik bisa gagal sementara */
    } finally {
      if (hidup.current) setMemuat(false);
    }
  }

  const kartu = kartuUlang !== undefined ? kartuUlang : kartuApi;
  const nama = String(kartu?.name || username).trim();
  const inisial = (nama || "?").slice(0, 1).toUpperCase();
  const negara = kartu?.country || (kartu?.flag ? kartu.flag.toUpperCase() : null);
  const kodeBendera = String(kartu?.flag || negara || "").trim().toLowerCase();
  const sumberBendera = kodeBendera ? BENDERA[`../../flags/${kodeBendera}.svg`] : null;
  const srcBendera = typeof sumberBendera === "string" ? sumberBendera : null;
  const bergabung = formatTanggalGabung(kartu?.joined, locale);

  return (
    <section
      className="wawasan-card flex flex-col gap-4"
      data-uji="wawasan-profil"
      aria-label={t("analisa.wawasan.profilJudul")}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-backgroundBoxBox">
          {kartu?.avatar ? (
            <img
              className="h-full w-full object-cover"
              width={56}
              height={56}
              src={kartu.avatar}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span aria-hidden="true" className="text-lg font-bold text-foregroundGrey">{inisial}</span>
          )}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-lg font-bold text-foreground">{nama}</span>
            {/* Gelar FIDE (GM, IM, FM, WGM, …) ditampilkan sebagai lencana SVG
                — bukan teks ber-border — supaya bentuknya konsisten di semua
                peramban. `null` bila pemain tidak bergelar. */}
            <LencanaGelar gelar={kartu?.title} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foregroundGrey">
            <span className="truncate font-mono">@{username}</span>
            {negara ? (
              <span className="inline-flex items-center gap-1.5 rounded-borderRoundness border border-border px-1.5 py-0.5 font-mono text-[0.65rem] font-bold">
                {srcBendera ? (
                  <img
                    src={srcBendera}
                    alt=""
                    width={16}
                    height={12}
                    className="h-3 w-4 shrink-0 rounded-[2px] object-cover ring-1 ring-black/20"
                    loading="lazy"
                  />
                ) : null}
                {negara}
              </span>
            ) : null}
            {bergabung ? (
              <span>{t("analisa.wawasan.profilBergabung", { tanggal: bergabung })}</span>
            ) : null}
            {kartu?.status ? (
              <span className="rounded-borderRoundness border border-border px-1.5 py-0.5 text-[0.65rem] font-bold capitalize">
                {kartu.status}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={muatUlang}
          disabled={memuat}
          aria-label={t("analisa.wawasan.profilMuatUlang")}
          title={memuat ? t("analisa.wawasan.profilMemuat") : t("analisa.wawasan.profilMuatUlang")}
          aria-busy={memuat}
          data-uji="wawasan-profil-refresh"
          className="ml-auto grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-borderRoundness border border-border text-foregroundGrey transition-colors hover:border-borderHighlighted hover:text-foregroundHighlighted disabled:cursor-wait disabled:opacity-60"
        >
          <Refresh className={`h-4 w-4 ${memuat ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
        role="group"
        aria-label={t("analisa.wawasan.profilRating")}
      >
        {KELAS_RATING.map(({ kunci, label }) => {
          const nilai = kartu?.ratings?.[kunci];
          const puncak = kartu?.peak?.[kunci];
          return (
            <div
              key={kunci}
              className="flex flex-col gap-0.5 rounded-borderRoundness border border-border bg-backgroundBox px-3 py-2"
              data-uji={`wawasan-rating-${kunci}`}
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-wide text-foregroundGrey">{label}</span>
              <span className="font-mono text-lg font-bold tabular-nums text-foreground">{nilai ?? "—"}</span>
              {puncak != null ? (
                <span className="font-mono text-[0.65rem] text-foregroundGrey">
                  {t("analisa.wawasan.profilPuncak", { rating: puncak })}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default KartuProfilWawasan;
