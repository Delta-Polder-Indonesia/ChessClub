/**
 * MaestroEdision — adopsi kerangka markup `.worlds-section` dari halaman
 * marketing Impeccable (bagian "Give your design a different starting point").
 *
 * Kerangka dua zona dari sumber dipertahankan utuh: kepala seksi, grid
 * `lg:grid-cols-[minmax(0,1fr)_400px]`, `<ul>` kartu ber-fan (`--fan`), dan
 * `<aside>` contoh utuh di kanan. Yang berubah hanya isi kartu kiri: mock
 * "design direction" diganti enam perwakilan pengurus BLUNDER SKUAD.
 *
 * Pemetaan field sumber ke pengurus:
 * - `tier`  -> label peran pengurus (`pengurus.peran.*`, sudah ada ID & EN).
 * - `nama`  -> username Chess.com, dipakai sebagai nama kartu.
 * - `aset`  -> `foto` pengurus dari `dataPengurus.js`.
 *
 * Enam kartu pertama sesuai urutan `KELOMPOK_PENGURUS` (Admin Utama 4,
 * Admin 1, Koordinator Acara 1); pengurus ke-7 dan ke-8 tetap tampil di
 * `/tentang-kami/struktur-grup-catur#pengurus`.
 *
 * Catatan foto: avatar Chess.com disajikan dalam token `80x80o` saja — token
 * ukuran lain membalas 404 (sudah diuji). Karena itu box gambar dikunci
 * `aspect-video` (rasio 16:9 persis seperti slot sumber 2048x1152) dan foto
 * ditampilkan `object-contain`, sehingga tinggi kartu tidak berubah. Bila foto
 * gagal dimuat, kartu mundur ke huruf awal username — pola yang sama dengan
 * `Pengurus.jsx`.
 *
 * Catatan aset: enam berkas `public/Galeri_sample/cards/*.webp` yang dulu
 * dipakai di sini kini tidak direferensikan lagi; berkas itu dibiarkan apa
 * adanya (di luar cakupan perubahan ini).
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
import { KELOMPOK_PENGURUS } from "../TentangKami/StrukturGrupCatur/dataPengurus.js";

/**
 * Sudut rotasi kartu, persis nilai `--fan` dari sumber. Dipakai ulang agar
 * siluet kipas pada grid tetap sama; urutannya menempel pada enam kartu.
 */
const FAN = ["-2.1deg", "1.4deg", "-1.1deg", "1.9deg", "-1.6deg", "1.2deg"];

/** Enam pengurus pertama, tetap berurutan seperti urutan kelompok di data. */
const PERWAKILAN = KELOMPOK_PENGURUS.flatMap((kelompok) =>
  kelompok.anggota.map((anggota) => ({ ...anggota, kelompok: kelompok.id })),
).slice(0, 6);

function FotoPengurus({ anggota, alt }) {
  const [gagal, setGagal] = useState(false);

  if (gagal || !anggota.foto) {
    return (
      <span
        aria-hidden="true"
        className="font-serif text-[3.5rem] font-light leading-none text-grey-400"
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
      className="h-full w-full object-contain"
    />
  );
}

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
          {/* Zona 01 — enam perwakilan pengurus. */}
          <div>
            <ul
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-[18px]"
              data-worlds-hand=""
              aria-label={t("landing.arahAriaLabel")}
            >
              {PERWAKILAN.map((pengurus, i) => (
                <li key={pengurus.username} style={{ "--fan": FAN[i] }}>
                  <a
                    href={`https://www.chess.com/member/${pengurus.username.toLowerCase()}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${t("pengurus.bukaProfil")} ${pengurus.username}`}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-slate-50">
                      <FotoPengurus
                        anggota={pengurus}
                        alt={`${pengurus.username}: ${t("landing.arahPengurusAlt")}`}
                      />
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <span className={LABEL_SEKSI}>
                        {t(`pengurus.peran.${pengurus.kelompok}`)}
                      </span>
                      <strong className={JUDUL_KARTU}>{pengurus.username}</strong>
                    </div>
                  </a>
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

          {/* Zona 02 — kartu klub BLUNDER SKUAD. */}
          <aside aria-label={t("landing.arahAriaContoh")}>
            <a
              href="https://www.chess.com/club/blunder-skuad"
              target="_blank"
              rel="noreferrer noopener"
              className="flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {/* Box dikunci ke rasio asli 1440x1100 (0.7639) agar tinggi kartu
                  tidak berubah walau ganti gambar. Latar hitam menyesuaikan
                  latar logo sehingga palang kiri-kanan menyatu. */}
              <div className="aspect-[1440/1100] w-full overflow-hidden bg-black">
                <img
                  src="/images/BlunderSkuad.png"
                  alt={t("landing.arahAltContoh")}
                  width={1440}
                  height={1100}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="flex flex-col gap-2 p-5">
                <strong className={JUDUL_KARTU}>{t("landing.arahContohJudul")}</strong>
                <span className={LEAD_SEKSI}>{t("landing.arahContohDesk")}</span>
                <span className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-primary">
                  {t("landing.arahContohCta")}
                </span>
              </span>
            </a>
            {/* Dua tautan ini dulu menunjuk ke /neo-mirai dan /cases/neo-mirai,
                yang keduanya tidak ada di public/ (404). Diarahkan ke rute
                struktur grup catur yang benar-benar terdaftar di App.jsx. */}
            <p className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-serif text-sm text-black">
              <Link
                to="/tentang-kami/struktur-grup-catur#pengurus"
                className="underline decoration-black underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {t("landing.arahContohBuka")}
              </Link>
              <Link
                to="/tentang-kami/struktur-grup-catur#keanggotaan"
                className="underline decoration-black underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
