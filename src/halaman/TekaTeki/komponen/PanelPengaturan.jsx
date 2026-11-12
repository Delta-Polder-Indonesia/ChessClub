/**
 * Tab "Pengaturan": set bidak, warna papan, suara, mesin, panah mesin,
 * "Ingat posisi", dan Komentator Papan — gaya selaras /papan-interaktif/pengaturan.
 */
import { useI18n } from "../../../lib/i18n.jsx";
import {
  BarisKomentatorPapan,
  BarisPilihan,
  BarisSakelar,
  KELAS_SELECT,
  KartuPengaturanPapan,
  PratinjauBidak,
  PratinjauPapan,
} from "../../PapanInteraktif/bersama/KontrolPengaturanPapan.jsx";

export default function PanelPengaturan({
  daftarSet = [],
  nilaiSetBidak = "merida",
  onGantiSetBidak = null,
  nilaiSuara = true,
  onGantiSuara = null,
  engineNyala = false,
  onGantiEngine = null,
  tampilPanahMesin = true,
  onGantiPanahMesin = null,
  labelPanahMesin = "",
  nilaiIngatPosisi = true,
  onGantiIngatPosisi = null,
  teksPosisiTersimpan = "",
  teksIngatNonaktif = "",
  komentator = null,
  pilihanWarnaPapan = [],
  nilaiWarnaPapan = "green",
  onGantiWarnaPapan = null,
}) {
  const { t } = useI18n();
  return (
    <div
      role="tabpanel"
      id="panel-teka-teki-pengaturan"
      aria-labelledby="tab-teka-teki-pengaturan"
      data-panel="pengaturan"
      className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 lg:overflow-hidden"
    >
      <KartuPengaturanPapan judul={t("papan.pengaturanPapan")} className="lg:flex-1">
        {daftarSet.length > 0 && onGantiSetBidak && (
          <BarisPilihan
            judul={t("papan.setBidak")}
            deskripsi={t("papan.setBidakDeskripsi")}
            pratinjau={<PratinjauBidak set={nilaiSetBidak} />}
          >
            <select
              id="sampel-pilih-set-bidak"
              value={nilaiSetBidak}
              onChange={(e) => onGantiSetBidak(e.target.value)}
              aria-label={t("papan.setBidak")}
              className={KELAS_SELECT}
            >
              {daftarSet.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama}
                </option>
              ))}
            </select>
          </BarisPilihan>
        )}

        {pilihanWarnaPapan.length > 0 && onGantiWarnaPapan && (
          <BarisPilihan
            judul={t("papan.warnaPapan")}
            deskripsi={t("papan.warnaPapanDeskripsi")}
            pratinjau={<PratinjauPapan tema={nilaiWarnaPapan} />}
          >
            <select
              id="sampel-warna-papan"
              value={nilaiWarnaPapan}
              onChange={(e) => onGantiWarnaPapan(e.target.value)}
              aria-label={t("papan.warnaPapan")}
              className={KELAS_SELECT}
            >
              {pilihanWarnaPapan.map(([nilai, label]) => (
                <option key={nilai} value={nilai}>
                  {label}
                </option>
              ))}
            </select>
          </BarisPilihan>
        )}

        {onGantiSuara && (
          <BarisSakelar
            judul={t("papan.suara")}
            deskripsi={t("papan.suaraDeskripsi")}
            checked={nilaiSuara}
            onCheckedChange={onGantiSuara}
          />
        )}

        {onGantiEngine && (
          <BarisSakelar
            judul={t("papan.engine")}
            deskripsi={t("papan.engineDeskripsi")}
            checked={engineNyala}
            onCheckedChange={() => onGantiEngine()}
            switchProps={{ "data-aksi": "toggle-engine" }}
          />
        )}

        {onGantiPanahMesin && (
          <BarisSakelar
            judul={labelPanahMesin}
            deskripsi={t("papan.enginePanahToggleDeskripsi")}
            checked={tampilPanahMesin}
            onCheckedChange={onGantiPanahMesin}
          />
        )}

        {onGantiIngatPosisi && (
          <BarisSakelar
            judul={t("tekaTeki.ingatPosisi")}
            deskripsi={teksPosisiTersimpan || teksIngatNonaktif}
            checked={nilaiIngatPosisi}
            onCheckedChange={onGantiIngatPosisi}
            switchProps={{ "data-aksi": "ingat-posisi" }}
          />
        )}

        {komentator && (
          <BarisKomentatorPapan
            t={t}
            nyala={komentator.nyala}
            setNyala={komentator.setNyala}
            gaya={komentator.gaya}
            setGaya={komentator.setGaya}
          />
        )}
      </KartuPengaturanPapan>
    </div>
  );
}
