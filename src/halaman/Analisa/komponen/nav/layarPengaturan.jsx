/**
 * Layar "Pengaturan" Report Analisa — pengganti popup gear di BoardMenu.
 * Tata letak dan perilaku mengikuti Pengaturan Papan Interaktif: layar penuh
 * di area kerja dengan tab pengaturan. Isi tiap tab memakai komponen
 * pengaturan Analisa yang sama (tema, label, langkah, langkah terbaik, mesin),
 * sehingga nilainya tetap sinkron dengan papan.
 */
import { useState } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import PanelLayar from "./PanelLayar.jsx";
import Themes from "../pengaturan/themes.jsx";
import Ratings from "../pengaturan/ratings.jsx";
import Moves from "../pengaturan/moves.jsx";
import BestMoves from "../pengaturan/bestMoves.jsx";
import PengaturanMesin from "../pengaturan/mesin.jsx";

const TAB_PENGATURAN = ["temaPapan", "penilaian", "langkah", "langkahTerbaik", "mesin"];

export default function LayarPengaturan({ onTutup }) {
  const { t } = useI18n();
  const [tabAktif, setTabAktif] = useState(0);

  return (
    <PanelLayar
      judul={t("analisa.pengaturan.judul")}
      headerKanan={
        <button
          type="button"
          onClick={onTutup}
          data-uji="pengaturan-tutup"
          className="cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted"
        >
          {t("analisa.pengaturan.tutup")}
        </button>
      }
    >
      <menu role="tablist" className="flex shrink-0 flex-row border-b border-border select-none">
        {TAB_PENGATURAN.map((kunci, i) => (
          <button
            role="tab"
            key={kunci}
            type="button"
            aria-selected={tabAktif === i}
            onClick={() => setTabAktif(i)}
            className={`flex-1 cursor-pointer py-2 text-xs font-bold outline-none transition-colors ${
              tabAktif === i
                ? "text-foreground border-b-2 border-foregroundHighlighted"
                : "text-foregroundGrey hover:text-foregroundHighlighted"
            }`}
          >
            {t(`analisa.pengaturan.${kunci}`)}
          </button>
        ))}
      </menu>
      <div className="min-h-0 flex-1 select-text overflow-y-auto p-4 sm:p-5">
        {tabAktif === 0 ? <Themes /> : null}
        {tabAktif === 1 ? <Ratings /> : null}
        {tabAktif === 2 ? <Moves /> : null}
        {tabAktif === 3 ? <BestMoves /> : null}
        {tabAktif === 4 ? <PengaturanMesin /> : null}
      </div>
    </PanelLayar>
  );
}
