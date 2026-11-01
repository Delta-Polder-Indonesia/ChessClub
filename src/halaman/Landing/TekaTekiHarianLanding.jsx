/**
 * "Teka-teki Hari Ini" — seksi pemikat di halaman Landing.
 *
 * Tujuan produk: memberi pengunjung sesuatu yang BISA DIMAINKAN dalam satu
 * detik pertama, tanpa login dan tanpa berpindah halaman, lalu menawarkan
 * papan penuh bila ingin menyelesaikannya.
 *
 * Data: `data/teka-teki-harian/terbaru.json` (±2 KB, snapshot statis buatan
 * `scripts/ambil-teka-teki-harian.mjs`). TIDAK ada permintaan ke Chess.com di
 * sini — posisi sudah tersimpan di repo, jadi seksi ini tetap tampil walau
 * pihak ketiga sedang gangguan.
 *
 * Komponen ini sengaja dimuat lazy dari `Landing.jsx`: `PapanStatis` menarik
 * chunk bidak (±126 KB) yang tidak diperlukan untuk elemen LCP halaman depan.
 *
 * Tipografi mengikuti `./gayaTeks.jsx` seperti seksi Landing lain; papannya
 * sendiri tetap milik domain catur (tema hijau alat latihan), sesuai
 * DESIGN.md §13.
 */
import { useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import { Tombol } from "../../components/Tombol.jsx";
import { ArrowRightIcon } from "../../components/icons.jsx";
import PapanStatis from "../../components/PapanStatis.jsx";
import { ambilSoalTerbaru, warnaGiliran } from "../../lib/tekaTekiHarian.js";
import { JUDUL_SEKSI, LEAD_SEKSI, LABEL_SEKSI } from "./gayaTeks.jsx";

const RUTE_HARIAN = "/teka-teki-harian";

export default function TekaTekiHarianLanding() {
  const { t } = useI18n();
  /** `null` = sedang memuat; `false` = tidak ada data (seksi disembunyikan). */
  const [soal, setSoal] = useState(null);

  useEffect(() => {
    let hidup = true;
    ambilSoalTerbaru()
      .then((daftar) => {
        if (hidup) setSoal(daftar[0] || false);
      })
      .catch(() => {
        // Snapshot belum dibuat / rusak: jangan tampilkan seksi kosong.
        if (hidup) setSoal(false);
      });
    return () => {
      hidup = false;
    };
  }, []);

  if (soal === false) return null;

  const orientasi = soal ? soal.orientasi || warnaGiliran(soal.fen) : "w";
  const tanggal = soal?.tanggal || "";

  return (
    <section
      aria-labelledby="teka-teki-harian-judul"
      className="w-full pl-6 md:pl-8 pr-6 md:pr-8 pb-12 xl:pb-16 pt-12 xl:pt-16 overflow-hidden"
    >
      <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px]">
        <div className="grid gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-x-12 lg:items-start">
          {/* Kiri: teks + ajakan */}
          <div className="flex flex-col gap-y-5">
            <p className={LABEL_SEKSI}>{t("landing.harianLabel")}</p>
            <h2 id="teka-teki-harian-judul" className={JUDUL_SEKSI}>
              {t("landing.harianJudul")}
            </h2>
            <p className={LEAD_SEKSI}>{t("landing.harianDesk")}</p>
            {tanggal && (
              <p className="font-mono text-[12px] uppercase tracking-wider text-grey-600">
                {t("landing.harianEdisi", { tanggal })}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-sans">
              <Tombol
                to={RUTE_HARIAN}
                variant="garis"
                className="h-12 px-4 md:px-6"
                aria-label={`${t("landing.harianCta")}: ${t("landing.harianJudul")}`}
              >
                <span className="order-1">{t("landing.harianCta")}</span>
                <ArrowRightIcon className="size-5 order-2" />
              </Tombol>
              {soal && (
                <a
                  href={soal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm font-semibold text-grey-600 underline-offset-4 transition-colors hover:text-primary hover:underline"
                >
                  {t("landing.harianSumber")}
                </a>
              )}
            </div>
          </div>

          {/* Kanan: papan posisi hari ini (statis, tanpa interaksi) */}
          <div className="w-full max-w-[420px]">
            {soal ? (
              <>
                <PapanStatis
                  fen={soal.fen}
                  orientasi={orientasi}
                  ariaLabel={t("landing.harianAriaPapan", { tanggal })}
                />
                <p className="mt-3 font-sans text-[12px] text-grey-600">
                  {t(
                    orientasi === "w"
                      ? "landing.harianGiliranPutih"
                      : "landing.harianGiliranHitam"
                  )}
                </p>
              </>
            ) : (
              <div
                aria-hidden="true"
                className="aspect-square w-full animate-pulse rounded border border-grey-200 bg-grey-50"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
