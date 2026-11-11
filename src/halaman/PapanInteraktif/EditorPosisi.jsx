import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { KUNCI_HAPUS_BIDAK } from "./bersama/editorPosisi.js";

const JENIS = ["k", "q", "r", "b", "n", "p"];
const BIDAK = [
  ...JENIS.map((jenis) => jenis.toUpperCase()),
  ...JENIS,
];

export default function EditorPosisi({
  terpilih,
  onPilih,
  onGiliran,
  giliran,
  onKosongkan,
  onAwal,
  onTerapkan,
  onBatal,
  setBidak,
  galat,
}) {
  const { t } = useI18n();

  return (
    <section
      aria-label={t("papan.editPosisi")}
      className="mx-auto w-full max-w-xl rounded-lg border border-[#3a3835] bg-[#262421] p-4 shadow-lg"
    >
      <div className="mb-4 border-b border-[#3a3835] pb-3">
        <h2 className="text-sm font-bold tracking-wide text-gray-100">
          {t("papan.editPosisi")}
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          {t("papan.petunjukEditPosisi")}
        </p>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTerapkan}
          className="rounded-md bg-[#e7e5e4] px-3 py-2 text-xs font-semibold text-[#262421] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
        >
          {t("papan.selesaiEditPosisi")}
        </button>
        <button
          type="button"
          onClick={onBatal}
          className="rounded-md border border-[#57534e] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        >
          {t("papan.batalEditPosisi")}
        </button>
        <button
          type="button"
          onClick={onAwal}
          className="rounded-md border border-[#57534e] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        >
          {t("papan.posisiAwal")}
        </button>
        <button
          type="button"
          onClick={onKosongkan}
          className="rounded-md border border-[#57534e] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        >
          {t("papan.kosongkanPapan")}
        </button>
        <button
          type="button"
          onClick={() => onGiliran(giliran === "w" ? "b" : "w")}
          className="rounded-md border border-[#57534e] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
        >
          {t("papan.giliranEdit", {
            warna: t(giliran === "w" ? "papan.warnaPutih" : "papan.warnaHitam"),
          })}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {BIDAK.map((simbol) => {
          const putih = simbol === simbol.toUpperCase();
          const jenis = simbol.toLowerCase();
          const dipilih = terpilih === simbol;
          const nama = t(`tekaTeki.namaBidak.${jenis}`);
          const warna = t(putih ? "papan.warnaPutih" : "papan.warnaHitam");
          return (
            <button
              key={simbol}
              type="button"
              aria-label={`${warna}: ${nama}`}
              aria-pressed={dipilih}
              onClick={() => onPilih(dipilih ? null : simbol)}
              className={`flex size-10 items-center justify-center rounded-md border transition-colors ${
                dipilih
                  ? "border-white bg-[#57534e] ring-2 ring-white/30"
                  : "border-gray-600 bg-[#302e2b] hover:bg-[#45423f]"
              }`}
            >
              <ChessPiece
                piece={simbol}
                set={setBidak}
                className="size-8"
              />
            </button>
          );
        })}
        <button
          type="button"
          aria-label={t("papan.hapusBidak")}
          aria-pressed={terpilih === KUNCI_HAPUS_BIDAK}
          onClick={() =>
            onPilih(terpilih === KUNCI_HAPUS_BIDAK ? null : KUNCI_HAPUS_BIDAK)
          }
          className={`min-h-10 rounded-md border px-3 text-xs font-semibold transition-colors ${
            terpilih === KUNCI_HAPUS_BIDAK
              ? "border-white bg-[#57534e] ring-2 ring-white/30"
              : "border-gray-600 bg-[#302e2b] text-gray-200 hover:bg-[#45423f]"
          }`}
        >
          {t("papan.hapusBidak")}
        </button>
      </div>

      {galat && (
        <p role="alert" className="mt-2 text-xs font-medium text-gray-300">
          {galat}
        </p>
      )}
    </section>
  );
}
