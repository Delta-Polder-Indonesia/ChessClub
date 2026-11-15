/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
/* Tombol gear membuka layar Pengaturan penuh (TAMPILAN_ANALISA.PENGATURAN),
   bukan popup — sama seperti tombol gear di Papan Interaktif. */
import { TAMPILAN_ANALISA } from "../../konteks/analyzeKonteks.js";
import { useBoard } from "../../konteks/boardKonteks.js";
import Image from "../Gambar.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { TooltipLabel } from "../../../../components/ui/tooltip.jsx";

function BoardMenu() {
  const { t } = useI18n();
  /*
   * Hanya memakai state papan (white/animation/tampilan), jadi ia berlangganan
   * BoardContext — bukan AnalyzeContext. Dengan begitu tombol balik papan &
   * gear tidak ikut di-render setiap `progress` analisis berubah.
   */
  const papan = useBoard();
  const setWhite = papan.white[1];
  const setAnimation = papan.animation[1];
  const setTampilan = papan.tampilan[1];

  function flipBoard() {
    setAnimation(false);
    setWhite((prev) => !prev);
  }

  return <div className="relative flex h-full flex-col justify-between">
            <div className='flex navTop:flex-col flex-row-reverse gap-2'>
                <TooltipLabel label={t("analisa.papan.pengaturan")}>
                  <button className='outline-none' aria-label={t("analisa.papan.pengaturan")} onClick={() => setTampilan(TAMPILAN_ANALISA.PENGATURAN)} type='button'>
                    <Image className='min-w-[17px]' src={`${import.meta.env.BASE_URL}images/analisa/settings.svg`} alt="" width={17} height={17} />
                  </button>
                </TooltipLabel>
                <TooltipLabel label={t("analisa.papan.balik")}>
                  <button className='outline-none' aria-label={t("analisa.papan.balik")} onClick={flipBoard} type='button'>
                    <Image src={`${import.meta.env.BASE_URL}images/analisa/flip.svg`} alt="" width={17} height={17} className='min-w-[17px]' />
                  </button>
                </TooltipLabel>
            </div>
            <div>

            </div>
        </div>;
}

export { BoardMenu as default };
