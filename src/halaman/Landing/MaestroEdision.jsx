/**
 * MaestroEdision — adopsi kerangka markup `.worlds-section` dari halaman
 * marketing Impeccable (bagian "Give your design a different starting point").
 *
 * Berkas ini sengaja dibangun 100% struktural sama dengan sumber sebagai
 * langkah pertama; pemetaan teks ke istilah KCI dilakukan terpisah setelah
 * kerangka ini disetujui. Yang sudah dipetakan ke token KCI:
 * - Judul seksi memakai `JUDUL_SEKSI`, kepala seksi `KEPALA_SEKSI`, pengantar
 *   `LEAD_SEKSI` — semuanya dari `./gayaTeks.jsx`, pilot yang sama seperti
 *   `TigaJalan.jsx` dan `Testimoni.jsx`.
 * - Tier kartu memakai `LABEL_SEKSI` (font mono uppercase tracking 0.14em),
 *   nama kartu memakai `JUDUL_KARTU`.
 * - Aksen hijau lumut sumber diganti `text-primary`; tidak ada bayangan
 *   dekoratif (DESIGN.md §4); font tetap serif KCI, bukan display font sumber.
 *
 * Struktur dua zona dari sumber, setelah teks yang diminta dihapus (label
 * zona "01"/"02", meta reroll, tombol "Show more", dan chip "Built with
 * Impeccable"):
 * - `<ul>` berisi 6 `<li>` kartu foto 2048x1152 dengan sudut fan per kartu
 *   (`--fan`), caption tier + nama, dan status `role=status`.
 * - `<aside>` dengan satu kartu besar 1440x1100.
 *
 * Catatan aset: gambar contoh tinggal di `public/Galeri_sample/`, di luar
 * `public/images/`, jadi `semuaWebP()` pada `scripts/optimumkan-gambar.mjs`
 * tidak memindainya dan `src/data/ukur-gambar.js` tidak memuatnya. Karena itu
 * `srcSet` tidak dibangun dan atribut `width`/`height` ditulis eksplisit di
 * sini (DESIGN.md §9 mensyaratkan dimensi untuk mencegah layout shift).
 */
import { useI18n } from "../../lib/i18n.jsx";
import {
  JUDUL_SEKSI,
  LEAD_SEKSI,
  KEPALA_SEKSI,
  LABEL_SEKSI,
  JUDUL_KARTU,
} from "./gayaTeks.jsx";

/**
 * Enam kartu arah desain. `fan` adalah sudut rotasi kartu sesuai variabel
 * `--fan` pada sumber; nilainya dipertahankan agar siluet kipas pada grid
 * tetap sama. Nama file aset persis sama dengan sumber.
 */
const ARAH = [
  {
    aset: "/Galeri_sample/cards/textiles_weave_drape_fashion_sneaker_box_stacks_hero.webp",
    nama: "Sneaker Box Stacks",
    tier: "atmosphere",
    fan: "-2.1deg",
  },
  {
    aset: "/Galeri_sample/cards/craft_making_lowicz_layered_papercut_hero.webp",
    nama: "Lowicz Layered Papercut",
    tier: "atmosphere",
    fan: "1.4deg",
  },
  {
    aset: "/Galeri_sample/cards/digital_design_canon_console_dashboard_atmosphere_hero.webp",
    nama: "Console Dashboard Atmosphere",
    tier: "graphic",
    fan: "-1.1deg",
  },
  {
    aset: "/Galeri_sample/cards/pop_culture_shelf_doujin_event_catalog_hero.webp",
    nama: "Doujin Event Catalog",
    tier: "graphic",
    fan: "1.9deg",
  },
  {
    aset: "/Galeri_sample/cards/signals_instruments_darkroom_safelight_bay_hero.webp",
    nama: "Darkroom Safelight Bay",
    tier: "interaction",
    fan: "-1.6deg",
  },
  {
    aset: "/Galeri_sample/cards/medium_native_algorave_source_floor_hero.webp",
    nama: "Algorave Source Floor",
    tier: "interaction",
    fan: "1.2deg",
  },
];

export default function MaestroEdision() {
  const { t } = useI18n();

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pb-12 md:pb-16">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
        <div className={`${KEPALA_SEKSI} max-w-none`}>
          <h2 className={JUDUL_SEKSI}>{t("landing.arahJudul")}</h2>
          <p className={LEAD_SEKSI}>{t("landing.arahLead")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8 lg:gap-10 items-start">
          {/* Zona 01 — enam kartu arah desain. */}
          <div>
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-[18px]"
              data-worlds-hand=""
              aria-label={t("landing.arahAriaLabel")}
            >
              {ARAH.map((arah) => (
                <li key={arah.aset} style={{ "--fan": arah.fan }}>
                  <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors hover:border-primary focus-within:border-primary">
                    <div className="w-full overflow-hidden bg-slate-50">
                      <img
                        src={arah.aset}
                        alt={`${arah.nama}: ${t("landing.arahAltContoh")}`}
                        width={2048}
                        height={1152}
                        decoding="async"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <span className={LABEL_SEKSI}>{arah.tier}</span>
                      <strong className={JUDUL_KARTU}>{arah.nama}</strong>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <p
              className="mt-5 font-serif text-sm text-grey-600"
              data-worlds-status=""
              role="status"
            >
              {t("landing.arahStatus")}
            </p>
          </div>

          {/* Zona 02 — satu contoh yang sudah jadi utuh. */}
          <aside aria-label={t("landing.arahAriaContoh")}>
            <a
              href="/neo-mirai/index.html"
              className="flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <img
                src="/Galeri_sample/neo_mirai/live_fold.webp"
                alt={t("landing.arahAltContoh")}
                width={1440}
                height={1100}
                loading="lazy"
                decoding="async"
                className="w-full h-auto object-cover"
              />
              <span className="flex flex-col gap-2 p-5">
                <strong className={JUDUL_KARTU}>{t("landing.arahContohJudul")}</strong>
                <span className={LEAD_SEKSI}>{t("landing.arahContohDesk")}</span>
                <span className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-primary">
                  {t("landing.arahContohCta")}
                </span>
              </span>
            </a>
            <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-serif text-sm text-black">
              <a
                href="/neo-mirai/index.html"
                className="underline decoration-black underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("landing.arahContohBuka")}
              </a>
              <a
                href="/cases/neo-mirai"
                className="underline decoration-black underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("landing.arahContohKasus")}
              </a>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}