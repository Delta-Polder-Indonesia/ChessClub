/**
 * MaestroEdision — seksi "Pengurus blunder skuad" pada Beranda.
 *
 * Kerangka dua zona dari sumber `.worlds-section` dipertahankan: kepala seksi,
 * grid `lg:grid-cols-[minmax(0,1fr)_400px]`, dan `<aside>` kartu klub BLUNDER
 * SKUAD di kanan. Isi zona kiri adalah enam perwakilan pengurus pertama sesuai
 * urutan `KELOMPOK_PENGURUS` (Admin Utama 4, Admin 1, Koordinator Acara 1);
 * pengurus ke-7 dan ke-8 tetap tampil di
 * `/tentang-kami/struktur-grup-catur#pengurus`.
 *
 * Kartu pengurus: avatar bulat, label peran, username Chess.com, lalu baris meta
 * berisi bendera negara dan rating. Rating dan bendera diambil apa adanya dari
 * `dataPengurus.js` (tanpa angka karangan); pengurus tanpa rating menampilkan
 * `pengurus.belumDinilai`. Seluruh kartu adalah tautan ke profil Chess.com.
 *
 * Catatan foto: avatar Chess.com disajikan dalam token `80x80o` saja (token
 * ukuran lain membalas 404 — sudah diuji). Foto ditampilkan `object-cover` di
 * dalam lingkaran `size-14`; bila gagal dimuat, kartu mundur ke huruf awal
 * username — pola yang sama dengan `Pengurus.jsx`.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import {
  JUDUL_SEKSI,
  LEAD_SEKSI,
  KEPALA_SEKSI,
  LABEL_SEKSI,
  JUDUL_KARTU,
} from "./gayaTeks.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import {
  BENDERA_PENGURUS,
  KELOMPOK_PENGURUS,
} from "../TentangKami/StrukturGrupCatur/dataPengurus.js";

/** Enam pengurus pertama, tetap berurutan seperti urutan kelompok di data. */
const PERWAKILAN = KELOMPOK_PENGURUS.flatMap((kelompok) =>
  kelompok.anggota.map((anggota) => ({ ...anggota, kelompok: kelompok.id })),
).slice(0, 6);

/** Avatar bulat dengan mundur ke huruf awal username bila foto gagal dimuat. */
function AvatarPengurus({ anggota, alt }) {
  const [gagal, setGagal] = useState(false);

  if (gagal || !anggota.foto) {
    return (
      <span
        aria-hidden="true"
        className="flex size-14 flex-none items-center justify-center rounded-full bg-grey-100 font-sans text-xl font-light text-grey-600"
      >
        {anggota.username.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={anggota.foto}
      alt={alt}
      width="80"
      height="80"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setGagal(true)}
      className="size-14 flex-none rounded-full bg-grey-100 object-cover ring-1 ring-grey-200"
    />
  );
}

/** Satu kartu pengurus — seluruh kartu adalah tautan ke profil Chess.com. */
function KartuPengurus({ pengurus, t }) {
  const bendera = BENDERA_PENGURUS[pengurus.kodeNegara];

  return (
    <li className="h-full">
      <a
        href={`https://www.chess.com/member/${pengurus.username.toLowerCase()}`}
        target="_blank"
        rel="noreferrer noopener"
        aria-label={`${t("pengurus.bukaProfil")} ${pengurus.username}`}
        className="group flex h-full flex-col gap-3 rounded-lg border border-grey-200 bg-white p-5 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:p-6"
      >
        <AvatarPengurus
          anggota={pengurus}
          alt={`${pengurus.username}: ${t("landing.arahPengurusAlt")}`}
        />
        <div className="flex flex-col gap-1.5">
          <span className={LABEL_SEKSI}>
            {t(`pengurus.peran.${pengurus.kelompok}`)}
          </span>
          <strong className={JUDUL_KARTU}>{pengurus.username}</strong>
        </div>
        <div className="mt-auto flex w-full items-center justify-between gap-2 pt-1">
          <span className="flex items-center gap-1.5 font-mono text-xs text-grey-600">
            {bendera && (
              <span aria-hidden="true" className="text-sm leading-none">
                {bendera}
              </span>
            )}
            <span>{t("pengurus.rating")}</span>
            <strong className="font-semibold text-grey-800">
              {pengurus.rating ?? t("pengurus.belumDinilai")}
            </strong>
          </span>
          <ArrowRightIcon className="size-4 shrink-0 -rotate-45 text-grey-600 transition-colors group-hover:text-primary" />
        </div>
      </a>
    </li>
  );
}

export default function MaestroEdision() {
  const { t } = useI18n();

  return (
    <section className="w-full px-6 md:px-8 xl:px-0 pb-12 md:pb-16">
      <div className="mx-auto max-w-[1080px] xl:max-w-7xl">
          <div className={KEPALA_SEKSI}>
          <h2 className={JUDUL_SEKSI}>{t("landing.arahJudul")}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-8 lg:gap-10 items-start">
          {/* Zona 01 — enam perwakilan pengurus. */}
          <div>
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5"
              aria-label={t("landing.arahAriaLabel")}
            >
              {PERWAKILAN.map((pengurus) => (
                <KartuPengurus key={pengurus.username} pengurus={pengurus} t={t} />
              ))}
            </ul>

            <p
              className="mt-5 font-sans text-sm text-grey-600"
              role="status"
            >
              {t("landing.arahStatus")}
            </p>
          </div>

          {/* Zona 02 — kartu klub BLUNDER SKUAD. */}
          <aside aria-label={t("landing.arahAriaContoh")}>
            <a
              href="https://www.chess.com/club/blunder-skuad"
              target="_blank"
              rel="noreferrer noopener"
              className="group flex flex-col overflow-hidden rounded-lg border border-primary/40 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
               {/* Kotak mempertahankan proporsi kartu klub. Latar hero
                   menyatu dengan latar logo, sementara aset WebP menghemat
                   unduhan dibanding PNG sebelumnya. */}
               <div className="aspect-[1440/1100] w-full overflow-hidden bg-hero">
                <img
                  src="/images/BlunderSkuad.webp"
                  alt={t("landing.arahAltContoh")}
                  width={1440}
                  height={1100}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="flex flex-col gap-2 p-5 md:p-6">
                <strong className={JUDUL_KARTU}>{t("landing.arahContohJudul")}</strong>
                <span className={LEAD_SEKSI}>{t("landing.arahContohDesk")}</span>
                <span className="mt-1 flex items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.14em] text-primary">
                  {t("landing.arahContohCta")}
                  <ArrowRightIcon className="size-4 shrink-0 -rotate-45" />
                </span>
              </span>
            </a>
            {/* Dua tautan ini dulu menunjuk ke /neo-mirai dan /cases/neo-mirai,
                yang keduanya tidak ada di public/ (404). Diarahkan ke rute
                struktur grup catur yang benar-benar terdaftar di App.jsx. */}
            <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm text-grey-800">
              <Link
                to="/tentang-kami/struktur-grup-catur#pengurus"
                className="inline-flex min-h-11 items-center underline decoration-grey-500 underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("landing.arahContohBuka")}
              </Link>
              <Link
                to="/tentang-kami/struktur-grup-catur#keanggotaan"
                className="inline-flex min-h-11 items-center underline decoration-grey-500 underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("landing.arahContohKasus")}
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
