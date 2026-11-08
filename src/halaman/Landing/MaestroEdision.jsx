/**
 * MaestroEdision — seksi "Pengurus blunder skuad" pada Beranda.
 *
 * Tampilan mengikuti grid tim berpusat pada halaman referensi: foto bulat
 * besar, nama, peran, lalu baris meta. Seluruh pengurus ditampilkan berurutan
 * sesuai `KELOMPOK_PENGURUS`, dan setiap nama serta ikon menaut ke profil
 * Chess.com masing-masing. Rating diambil apa adanya dari `dataPengurus.js`
 * (tanpa angka karangan); pengurus tanpa rating menampilkan
 * `pengurus.belumDinilai`.
 *
 * Catatan foto: avatar Chess.com hanya tersedia dalam token `80x80o`
 * (token ukuran lain membalas 404 — sudah diuji), sehingga foto tampil
 * sedikit diperbesar. Bila gagal dimuat, kartu mundur ke huruf awal username
 * — pola yang sama dengan `Pengurus.jsx`.
 */
import { useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { LinkIcon } from "../../components/icons.jsx";
import { JUDUL_SEKSI } from "./gayaTeks.jsx";
import { KELOMPOK_PENGURUS } from "../TentangKami/StrukturGrupCatur/dataPengurus.js";

/** Seluruh pengurus, tetap berurutan seperti urutan kelompok di data. */
const SEMUA_PENGURUS = KELOMPOK_PENGURUS.flatMap((kelompok) =>
  kelompok.anggota.map((anggota) => ({ ...anggota, kelompok: kelompok.id })),
);

/** Avatar bulat dengan mundur ke huruf awal username bila foto gagal dimuat. */
function AvatarPengurus({ anggota, alt }) {
  const [gagal, setGagal] = useState(false);

  if (gagal || !anggota.foto) {
    return (
      <span
        aria-hidden="true"
        className="flex size-24 flex-none items-center justify-center rounded-full bg-grey-100 font-sans text-3xl font-light text-grey-600 md:size-40 md:text-5xl"
      >
        {anggota.username.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={anggota.foto}
      alt={alt}
      width="160"
      height="160"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setGagal(true)}
      className="size-24 flex-none rounded-full bg-grey-100 object-cover md:size-40"
    />
  );
}

/** Satu anggota: foto bulat, nama, peran, lalu rating dan tautan profil. */
function AnggotaPengurus({ pengurus, t }) {
  const tautan = `https://www.chess.com/member/${pengurus.username.toLowerCase()}`;
  const subLabel =
    pengurus.nama && pengurus.nama !== pengurus.username
      ? pengurus.nama
      : pengurus.negara;
  const aria = `${t("pengurus.bukaProfil")} ${pengurus.username}`;

  return (
    <li className="flex min-w-0 flex-col items-center gap-2">
      <AvatarPengurus
        anggota={pengurus}
        alt={`${pengurus.username}: ${t("landing.arahPengurusAlt")}`}
      />
      <div className="flex min-w-0 flex-col items-center gap-1">
        <a
          href={tautan}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={aria}
          className="break-words text-center font-sans text-sm font-semibold text-grey-800 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:text-xl"
        >
          {pengurus.username}
        </a>
        <p className="max-w-full break-words text-center font-sans text-xs text-grey-600 md:text-base">
          {subLabel}
        </p>
        <p className="text-center font-sans text-xs font-medium text-primary md:text-sm">
          {t(`pengurus.peran.${pengurus.kelompok}`)}
        </p>
        <div className="mt-1 flex items-center justify-center gap-3 font-mono text-xs text-grey-600">
          <span className="inline-flex items-center gap-1.5">
            <span>{t("pengurus.rating")}</span>
            <strong className="font-semibold text-grey-800">
              {pengurus.rating ?? t("pengurus.belumDinilai")}
            </strong>
          </span>
          <a
            href={tautan}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={aria}
            className="inline-flex size-6 items-center justify-center rounded text-grey-600 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <LinkIcon className="size-4" />
          </a>
        </div>
      </div>
    </li>
  );
}

export default function MaestroEdision() {
  const { t } = useI18n();

  return (
    <section className="w-full py-16 px-6 md:px-8 xl:px-0">
      <div className="mx-auto flex max-w-[1080px] flex-col items-center gap-8 xl:max-w-7xl">
        <header className="px-4 text-center">
          <h2 className={JUDUL_SEKSI}>{t("landing.arahJudul")}</h2>
        </header>

        <ul
          className="grid w-full grid-cols-2 gap-x-3 gap-y-8 text-center sm:grid-cols-3 md:gap-y-12 lg:grid-cols-4 xl:gap-x-8"
          aria-label={t("landing.arahAriaLabel")}
        >
          {SEMUA_PENGURUS.map((pengurus) => (
            <AnggotaPengurus key={pengurus.username} pengurus={pengurus} t={t} />
          ))}
        </ul>
      </div>
    </section>
  );
}
