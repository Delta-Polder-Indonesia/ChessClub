/**
 * Kartu "Deteksi engine" pada panel Ringkasan.
 *
 * Meniru `ratingCount.jsx`: satu prop `moves` (hasil `parsePGN`), satu kolom
 * `w-[85%]`, setiap baris berlabel di kiri dan dua nilai (Putih | Hitam) di
 * kanan. Semua perhitungannya di `mesin/antiCheat.js`; komponen ini hanya
 * merender angka dan sanggahan.
 *
 * WAJIB: keluaran ini indikasi statistik untuk ditinjau manusia, bukan vonis.
 * Sanggahan ditampilkan permanen di bawah angka, bukan disembunyikan di
 * tooltip, supaya tidak ada tangkapan layar yang beredar tanpa konteks.
 */
import { useMemo } from "react";
import { useI18n } from "../../../../../../lib/i18n.jsx";
import { hitungSkorKecurigaan } from "../../../../mesin/antiCheat.js";
import { MULTI_PV } from "../../../../mesin/engine.js";
import { DAFTAR_FASE } from "../../../../mesin/fase.js";
import RatingBox from "./ratingBox.jsx";

const KELAS_LEVEL = {
  rendah: "text-highlightBest",
  sedang: "text-highlightInaccuracy",
  tinggi: "text-highlightBlunder",
};

function formatSkor(nilai) {
  return Number.isFinite(nilai) ? String(nilai) : "-";
}

function formatPersen(nilai) {
  return Number.isFinite(nilai) ? `${nilai.toFixed(1)}%` : "-";
}

function formatCentipawn(nilai) {
  return Number.isFinite(nilai) ? `${nilai.toFixed(1)} cp` : "-";
}

function formatRasio(nilai) {
  return Number.isFinite(nilai) ? `${Math.round(nilai * 100)}%` : "-";
}

/** Peringkat rata-rata kandidat: "1.8" dari skala 1–MULTI_PV+1. */
function formatPeringkat(nilai) {
  return Number.isFinite(nilai) ? nilai.toFixed(1) : "-";
}

/** Korelasi Spearman waktu↔kualitas: dua desimal dengan tanda. */
function formatKorelasi(nilai) {
  return Number.isFinite(nilai) ? nilai.toFixed(2) : "-";
}

function BarisMetrik({ label, putih, hitam }) {
  return (
    <div className="flex flex-row items-center justify-between">
      <span className="text-sm font-semibold text-foregroundGrey">{label}</span>
      <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between text-sm font-bold text-foreground">
        <span className="reduceSummary:w-[124px] w-[72px] text-left">{putih}</span>
        <span className="reduceSummary:w-[124px] w-[72px] text-right">{hitam}</span>
      </div>
    </div>
  );
}

export default function DeteksiEngine({ moves }) {
  const { t } = useI18n();
  /*
   * `useMemo`, bukan `useState` + `useEffect` seperti ratingCount.jsx: skor
   * murni turunan dari `moves`, jadi tidak perlu satu render tambahan.
   */
  const hasil = useMemo(() => hitungSkorKecurigaan(moves), [moves]);
  const putih = hasil.w;
  const hitam = hasil.b;
  // Skor bisa sah dihitung dari ACPL atau MultiPV meski bestMove/top-1
  // tidak tersedia. Jangan menyembunyikan seluruh laporan hanya karena itu.
  const adaData = [putih, hitam].some((p) =>
    p.langkahDinilai > 0 || p.langkahAcpl > 0 || p.kandidatSampel > 0
  );
  // Peringatan sampel harus mengikuti metrik yang benar-benar tersedia,
  // bukan hanya top-1; jika skor bertumpu pada ACPL/MultiPV, hitungannya juga
  // harus memicu peringatan ketika jumlah posisinya kecil.
  const hitunganSampelAktif = (p) => [
    p.langkahDinilai,
    p.langkahAcpl,
    p.kandidatSampel,
  ].filter((n) => Number.isFinite(n) && n > 0);
  const sampelTersedikitPerPemain = [putih, hitam].map((p) => {
    const aktif = hitunganSampelAktif(p);
    return aktif.length ? Math.min(...aktif) : Number.POSITIVE_INFINITY;
  });
  const sampelTersedikit = Math.min(...sampelTersedikitPerPemain);

  return (
    <div className="flex w-[85%] flex-col gap-3 pr-[26px] reduceSummary:pr-[35px]">
      <span className="text-sm font-bold text-foreground">{t("analisa.antiCheat.judul")}</span>

      {!adaData ? (
        <p className="text-sm text-foregroundGrey">{t("analisa.antiCheat.tanpaData")}</p>
      ) : (
        <>
          <div className="flex flex-row items-center justify-between">
            <span className="text-sm font-semibold text-foregroundGrey">{t("analisa.antiCheat.skor")}</span>
            <div className="flex flex-row reduceSummary:w-[262px] w-[160px] justify-between">
              <RatingBox white>{formatSkor(putih.skor)}</RatingBox>
              <RatingBox>{formatSkor(hitam.skor)}</RatingBox>
            </div>
          </div>

          <BarisMetrik
            label={t("analisa.antiCheat.tingkat")}
            putih={
              <span className={KELAS_LEVEL[putih.level] ?? "text-foregroundGrey"}>
                {t(`analisa.antiCheat.level.${putih.level ?? "tidakAda"}`)}
              </span>
            }
            hitam={
              <span className={KELAS_LEVEL[hitam.level] ?? "text-foregroundGrey"}>
                {t(`analisa.antiCheat.level.${hitam.level ?? "tidakAda"}`)}
              </span>
            }
          />

          <BarisMetrik
            label={t("analisa.antiCheat.metrik.kecocokan")}
            putih={formatPersen(putih.engineMatchRate)}
            hitam={formatPersen(hitam.engineMatchRate)}
          />
          {putih.kandidatSampel > 0 || hitam.kandidatSampel > 0 ? (
            <>
              <BarisMetrik
                label={t("analisa.antiCheat.metrik.kecocokanTop3")}
                putih={formatPersen(putih.kecocokanTop3)}
                hitam={formatPersen(hitam.kecocokanTop3)}
              />
              <BarisMetrik
                label={t("analisa.antiCheat.metrik.rataPeringkat")}
                putih={formatPeringkat(putih.rataPeringkat)}
                hitam={formatPeringkat(hitam.rataPeringkat)}
              />
              <BarisMetrik
                label={t("analisa.antiCheat.metrik.acplKandidat")}
                putih={formatCentipawn(putih.acplKandidat)}
                hitam={formatCentipawn(hitam.acplKandidat)}
              />
              <BarisMetrik
                label={t("analisa.antiCheat.metrik.kecocokanSulit")}
                putih={formatPersen(putih.kecocokanSulit)}
                hitam={formatPersen(hitam.kecocokanSulit)}
              />
              <BarisMetrik
                label={t("analisa.antiCheat.metrik.kecocokanMudah")}
                putih={formatPersen(putih.kecocokanMudah)}
                hitam={formatPersen(hitam.kecocokanMudah)}
              />
              <BarisMetrik
                label={t("analisa.antiCheat.metrik.streak")}
                putih={String(putih.streakTerpanjang ?? 0)}
                hitam={String(hitam.streakTerpanjang ?? 0)}
              />
              <BarisMetrik
                label={t("analisa.antiCheat.metrik.korelasiWaktu")}
                putih={formatKorelasi(putih.korelasiWaktuKualitas)}
                hitam={formatKorelasi(hitam.korelasiWaktuKualitas)}
              />
            </>
          ) : null}
          <BarisMetrik
            label={t("analisa.antiCheat.metrik.acpl")}
            putih={formatCentipawn(putih.acpl)}
            hitam={formatCentipawn(hitam.acpl)}
          />
          {/*
           * Dua baris berikut memakai rumus lichess/en-croissant
           * (mesin/akurasi.js) — inilah angka yang bisa dibandingkan dengan
           * laporan lichess. ACPL di atas memakai konvensi lama modul ini.
           */}
          <BarisMetrik
            label={t("analisa.antiCheat.metrik.acplBaku")}
            putih={formatCentipawn(putih.acplBaku)}
            hitam={formatCentipawn(hitam.acplBaku)}
          />
          <BarisMetrik
            label={t("analisa.antiCheat.metrik.akurasi")}
            putih={formatPersen(putih.akurasi)}
            hitam={formatPersen(hitam.akurasi)}
          />
          <BarisMetrik
            label={t("analisa.antiCheat.metrik.waktu")}
            putih={formatRasio(putih.konsistensiWaktu)}
            hitam={formatRasio(hitam.konsistensiWaktu)}
          />
          <BarisMetrik
            label={t("analisa.antiCheat.metrik.langkah")}
            putih={String(putih.langkahDinilai)}
            hitam={String(hitam.langkahDinilai)}
          />

          <div className="flex flex-col gap-1 border-t border-neutral-600 pt-2">
            <span className="text-xs font-semibold text-foregroundGrey">{t("analisa.antiCheat.perFase")}</span>
            {DAFTAR_FASE.map((fase) => (
              <BarisMetrik
                key={fase}
                label={t(`analisa.antiCheat.fase.${fase}`)}
                putih={formatPersen(putih.perFase[fase].engineMatchRate)}
                hitam={formatPersen(hitam.perFase[fase].engineMatchRate)}
              />
            ))}
          </div>

          {Number.isFinite(sampelTersedikit) && sampelTersedikit < 20 ? (
            <p className="text-xs leading-4 text-foregroundGrey">
              {t("analisa.antiCheat.sampelKecil", { n: sampelTersedikit })}
            </p>
          ) : null}
          {putih.kandidatSampel > 0 || hitam.kandidatSampel > 0 ? (
            <p className="text-xs leading-4 text-foregroundGrey">
              {t("analisa.antiCheat.catatanKandidat", { n: MULTI_PV, nMax: MULTI_PV + 1 })}
            </p>
          ) : (
            <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.tanpaKandidat")}</p>
          )}
          {putih.kandidatSampel > 0 || hitam.kandidatSampel > 0 ? (
            <p className="text-xs leading-4 text-foregroundGrey">
              {t("analisa.antiCheat.catatanKondisional", { sulit: 20, mudah: 100 })}
            </p>
          ) : null}
          {!putih.rincianWaktu || !hitam.rincianWaktu ? (
            <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.tanpaJam")}</p>
          ) : null}
          {putih.akurasiSampel > 0 || hitam.akurasiSampel > 0 ? (
            <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.catatanMetrikBaku")}</p>
          ) : null}
        </>
      )}

      <p className="rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-xs leading-4 text-foregroundGrey">
        {t("analisa.antiCheat.disclaimer")}
      </p>
    </div>
  );
}
