/**
 * Kartu "Wawasan rating" pada panel Ringkasan.
 *
 * Satu prop `moves` (hasil `parsePGN`). Semua perhitungannya di
 * `mesin/wawasanRating.js`; komponen ini hanya merender angka dan kalimat.
 * Layout mengikuti `deteksiEngine.jsx`: baris per fase, dua kolom Putih | Hitam.
 */
import { useMemo } from "react";
import { useI18n } from "../../../../../../lib/i18n.jsx";
import { MIN_LANGKAH_FASE, wawasanPemain } from "../../../../mesin/wawasanRating.js";
import { DAFTAR_FASE, FASE_AKHIR, FASE_MENENGAH, FASE_PEMBUKAAN } from "../../../../mesin/fase.js";

/** Label fase memakai kunci yang sudah ada di `analisa.ringkasan`. */
function labelFase(t, fase) {
  if (fase === FASE_PEMBUKAAN) return t("analisa.ringkasan.pembukaan");
  if (fase === FASE_MENENGAH) return t("analisa.ringkasan.menengah");
  if (fase === FASE_AKHIR) return t("analisa.ringkasan.akhir");
  return fase;
}

function formatAkurasi(nilai) {
  return Number.isFinite(nilai) ? nilai.toFixed(1) : "-";
}

/** Teks sel satu fase: "akurasi · kesalahan berat", atau "-" bila langkahnya terlalu sedikit. */
function teksSel(f) {
  if (f.jumlah < MIN_LANGKAH_FASE) return "-";
  return `${formatAkurasi(f.akurasi)} · ${f.blunder + f.kesalahan}`;
}

/** Kalimat kelemahan/kekuatan satu pemain. */
function kalimatPemain(t, hasil) {
  const bagian = [];
  if (hasil.kelemahan) bagian.push(t("analisa.ringkasan.wawasan.kelemahan", { fase: labelFase(t, hasil.kelemahan) }));
  else if (hasil.total.jumlah < MIN_LANGKAH_FASE) bagian.push(t("analisa.ringkasan.wawasan.kurangLangkah"));
  else bagian.push(t("analisa.ringkasan.wawasan.tanpaKelemahan"));
  if (hasil.kekuatan) bagian.push(t("analisa.ringkasan.wawasan.kekuatan", { fase: labelFase(t, hasil.kekuatan) }));
  return bagian.join(" ");
}

export default function WawasanRating({ moves }) {
  const { t } = useI18n();
  const putih = useMemo(() => wawasanPemain(moves, "w"), [moves]);
  const hitam = useMemo(() => wawasanPemain(moves, "b"), [moves]);

  return (
    <div className="w-[85%] flex flex-col gap-2">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-foreground">{t("analisa.ringkasan.wawasan.judul")}</span>
        <p className="text-xs text-foregroundGrey">{t("analisa.ringkasan.wawasan.deskripsi")}</p>
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 text-sm">
        <span className="text-foregroundGrey font-semibold">{t("analisa.ringkasan.pemain")}</span>
        <span className="text-foregroundGrey font-semibold text-right">{t("analisa.pemain.putih")}</span>
        <span className="text-foregroundGrey font-semibold text-right">{t("analisa.pemain.hitam")}</span>
        {DAFTAR_FASE.map((fase) => (
          <div key={fase} className="contents">
            <span className="text-foregroundGrey">{labelFase(t, fase)}</span>
            <span className="text-foreground text-right tabular-nums">{teksSel(putih.perFase[fase])}</span>
            <span className="text-foreground text-right tabular-nums">{teksSel(hitam.perFase[fase])}</span>
          </div>
        ))}
        <span className="text-foregroundGrey text-xs col-span-3 pt-1">{t("analisa.ringkasan.wawasan.keterangan")}</span>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-foreground">
          {t("analisa.pemain.putih")}: {kalimatPemain(t, putih)}
        </span>
        <span className="text-foreground">
          {t("analisa.pemain.hitam")}: {kalimatPemain(t, hitam)}
        </span>
      </div>
    </div>
  );
}
