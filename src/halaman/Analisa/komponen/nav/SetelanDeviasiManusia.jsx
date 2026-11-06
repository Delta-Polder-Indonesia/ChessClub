/**
 * Setelan khusus mode Maia di layar Deteksi engine.
 *
 * Ditampilkan di panel PENGATURAN (bukan panel hasil) dan hanya saat mesin
 * yang dipilih adalah Maia — menggantikan kedalaman/hash/threads yang tidak
 * berlaku untuk jalur ini. Jalur Maia tidak memakai kedalaman Stockfish:
 * biayanya jumlah partai × langkah yang dinilai, dibagi ke gelombang
 * inferensi sebesar `ukuranBatch`.
 */
import { useEffect, useState } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import SelectDaftar from "./SelectDaftar.jsx";

const PILIHAN_PARTAI = [5, 10, 20, 30, 50];

/**
 * @param {object} p
 * @param {{preset: string, jumlahPartai: number, ratingMode: string, ratingManual: number|null}} p.setelan
 * @param {(perubahan: object) => void} p.atur
 * @param {boolean} [p.nonaktif]
 */
export default function SetelanDeviasiManusia({ setelan, atur, nonaktif = false }) {
  const { t } = useI18n();
  // Kolom rating diketik bebas, jadi teksnya ditahan lokal dan baru dirapikan
  // saat fokus lepas — kalau setiap ketikan langsung dijepit, mengetik "18"
  // melompat ke 600 di tengah jalan.
  const [teksRating, setTeksRating] = useState(String(setelan.ratingManual ?? 1500));
  useEffect(() => {
    setTeksRating(String(setelan.ratingManual ?? 1500));
  }, [setelan.ratingManual]);

  return (
    <div data-uji="deviasi-setelan" className="flex flex-col gap-2 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2">
      <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.antiCheat.deviasi.setelanPetunjuk")}</p>
      <div className="flex flex-row gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.deviasi.kecepatan")}</span>
          <SelectDaftar
            labelTeks={t("analisa.antiCheat.deviasi.kecepatan")}
            dataUji="deviasi-kecepatan"
            nilai={setelan.preset}
            opsi={[
              { nilai: "hemat", label: t("analisa.antiCheat.deviasi.kecepatanHemat") },
              { nilai: "seimbang", label: t("analisa.antiCheat.deviasi.kecepatanSeimbang") },
              { nilai: "cepat", label: t("analisa.antiCheat.deviasi.kecepatanCepat") },
            ]}
            onPilih={(nilai) => atur({ preset: nilai })}
            disabled={nonaktif}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.deviasi.jumlahPartai")}</span>
          <SelectDaftar
            labelTeks={t("analisa.antiCheat.deviasi.jumlahPartai")}
            dataUji="deviasi-jumlah"
            nilai={setelan.jumlahPartai}
            opsi={PILIHAN_PARTAI.map((n) => ({ nilai: n, label: String(n) }))}
            onPilih={(nilai) => atur({ jumlahPartai: nilai })}
            disabled={nonaktif}
          />
        </div>
      </div>
      <div className="flex flex-row items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-xs font-bold text-foregroundGrey">{t("analisa.antiCheat.deviasi.rating")}</span>
          <SelectDaftar
            labelTeks={t("analisa.antiCheat.deviasi.rating")}
            dataUji="deviasi-rating-mode"
            nilai={setelan.ratingMode}
            opsi={[
              { nilai: "otomatis", label: t("analisa.antiCheat.deviasi.ratingOtomatis") },
              { nilai: "manual", label: t("analisa.antiCheat.deviasi.ratingManual") },
            ]}
            onPilih={(nilai) => atur({ ratingMode: nilai })}
            disabled={nonaktif}
          />
        </div>
        {setelan.ratingMode === "manual" ? (
          <div className="flex w-28 flex-col gap-1">
            <label htmlFor="deviasi-rating-nilai" className="text-xs font-bold text-foregroundGrey">
              {t("analisa.antiCheat.deviasi.ratingNilai")}
            </label>
            <input
              id="deviasi-rating-nilai"
              type="number"
              min={600}
              max={2600}
              step={25}
              inputMode="numeric"
              data-uji="deviasi-rating-nilai"
              value={teksRating}
              onChange={(e) => setTeksRating(e.currentTarget.value)}
              onBlur={() => atur({ ratingManual: teksRating })}
              disabled={nonaktif}
              className="rounded-borderRoundness border border-border bg-[#272727] px-2 py-1 text-sm text-foreground outline-none"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
