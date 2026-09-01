/* Bagian pengaturan fitur Analisa — ditulis untuk ChessClub (bukan port). */
import { useContext } from "react";
import { useI18n } from "../../../../lib/i18n.jsx";
import { DAFTAR_ENGINE, cariEngine } from "../../../../lib/engineCatur.js";
import { gunakanMesin } from "../../konteks/mesin.jsx";
import { AnalyzeContext } from "../../konteks/analyze.jsx";
import { KEDALAMAN } from "../menu/analyze/form.jsx";

const KUNCI_KEDALAMAN = "kci-analisa-kedalaman";

/**
 * Pilihan engine + kedalaman analisis.
 *
 * Engine yang dipakai SELALU milik ChessClub sendiri (EngineCatur + berkas
 * wasm di /public/engines). Bagian Brilliant-Chess yang membuat Worker
 * sendiri, membaca navigator.hardwareConcurrency, dan menawarkan opsi thread
 * sengaja tidak dipindah — itulah bagian yang bug. Di sini pengguna hanya
 * memilih build Stockfish lokal; unduhan pertamanya ditangguhkan sampai
 * pengguna menekan tombol atau benar-benar membutuhkan analisis.
 */
function statusLabel(status, t) {
  return `${t("analisa.status.judul")}: ${t(`analisa.status.${status}`)}`;
}

function PengaturanMesin() {
  const { t } = useI18n();
  const { idEngine, gantiEngine, status, galat, siapkan, setop, didukung } = gunakanMesin();
  const analyzeContext = useContext(AnalyzeContext);
  const [depth, setDepth] = analyzeContext.depth;

  const aktif = cariEngine(idEngine) ?? cariEngine(undefined);
  const siapDipakai = status === "siap";

  function pilihEngine(id) {
    if (id === idEngine) return;
    setop();
    gantiEngine(id);
  }

  function pilihKedalaman(ply) {
    setDepth(ply);
    try {
      localStorage.setItem(KUNCI_KEDALAMAN, String(ply));
    } catch {
      /* mode pribadi: pilihan tidak tersimpan, tidak fatal */
    }
  }

  return (
    <section>
      <h1 className="block bg-backgroundBoxBox font-bold text-nowrap p-3 text-foreground">{t("analisa.mesin.judul")}</h1>
      <p className="px-3 py-2 text-xs text-foregroundGrey">{t("analisa.mesin.petunjuk")}</p>
      {didukung ? null : (
        <p className="mx-3 mb-2 rounded-borderRoundness bg-backgroundBoxBox p-2 text-sm text-foregroundGrey">
          {t("analisa.status.tanpaWasm")}
        </p>
      )}
      <ul className="flex flex-col">
        {DAFTAR_ENGINE.map((engine) => (
          <li key={engine.id}>
            <button
              type="button"
              onClick={() => pilihEngine(engine.id)}
              className={`flex flex-row gap-2 items-center justify-between w-full relative p-2 transition-colors hover:bg-black hover:text-foregroundHighlighted ${idEngine === engine.id ? "text-foregroundHighlighted" : "text-foreground"}`}
            >
              <span className="font-bold text-sm text-left">
                {engine.label}
                <span className="block font-normal text-xs text-foregroundGrey">
                  {statusLabel(idEngine === engine.id ? status : "mati", t)}
                </span>
              </span>
              <span className={`w-3 h-3 rounded-full ${idEngine === engine.id ? "bg-foregroundHighlighted" : "bg-transparent"}`} />
            </button>
          </li>
        ))}
      </ul>
      {status === "mati" || status === "gagal" ? (
        <div className="px-3 pb-2 flex flex-col gap-1">
          <button
            type="button"
            onClick={() => {
              siapkan().catch(() => {
                /* pesan galat sudah ditampilkan lewat status/galat */
              });
            }}
            className="w-full h-9 rounded-borderRoundness bg-backgroundBoxBox hover:bg-backgroundBoxBoxHover font-bold text-sm transition-colors"
          >
            {status === "gagal" ? t("analisa.status.cobaLagi") : t("analisa.status.muat")}
          </button>
          {status === "gagal" && galat ? <p className="text-xs text-highlightMiss break-words">{t("analisa.status.gagal")} — {aktif?.label}</p> : null}
        </div>
      ) : null}
      {!siapDipakai && status === "memuat" ? (
        <p className="px-3 pb-2 text-xs text-foregroundGrey animate-[pulse_1.25s_cubic-bezier(0.4,_0,_0.6,_1)_infinite]">{t("analisa.status.memuat")}</p>
      ) : null}
      <h1 className="mt-2 block bg-backgroundBoxBox font-bold text-nowrap p-3 text-foreground">{t("analisa.kedalaman.judul")}</h1>
      <ul className="grid grid-cols-2 gap-2 p-3">
        {KEDALAMAN.map((opsi) => (
          <li key={opsi.kunci}>
            <button
              type="button"
              onClick={() => pilihKedalaman(opsi.ply)}
              title={`${t("analisa.kedalaman.judul")}: ${opsi.ply}`}
              className={`w-full h-9 rounded-borderRoundness text-sm font-bold transition-colors bg-backgroundBoxBox hover:bg-backgroundBoxBoxHover border-backgroundBoxBoxHighlighted ${depth === opsi.ply ? "border-[2px] text-foregroundHighlighted" : "border"}`}
            >
              {t(`analisa.kedalaman.${opsi.kunci}`)}
              <span className="text-xs font-normal opacity-70"> · {opsi.ply}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="px-3 pb-2 text-xs text-foregroundGrey">{t("analisa.kedalaman.petunjuk")}</p>
    </section>
  );
}

export { PengaturanMesin as default };
