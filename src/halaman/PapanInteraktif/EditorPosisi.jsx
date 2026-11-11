import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { KUNCI_HAPUS_BIDAK } from "./bersama/editorPosisi.js";

const JENIS = ["k", "q", "r", "b", "n", "p"];
const BIDAK = [
  ...JENIS.map((jenis) => jenis.toUpperCase()),
  ...JENIS,
];

export default function EditorPosisi({
  aktif,
  terpilih,
  onMulai,
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

  if (!aktif) {
    return (
      <button
        type="button"
        onClick={onMulai}
        className="mb-2 inline-flex min-h-9 items-center gap-2 rounded-md border border-[#57534e] bg-[#302e2b] px-3 py-1.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-[#3b3936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        {t("papan.editPosisi")}
      </button>
    );
  }

  return (
    <section
      aria-label={t("papan.editPosisi")}
      className="mb-3 rounded-lg border border-sky-700/70 bg-[#1d2730] p-3 shadow-lg"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTerapkan}
          className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600"
        >
          {t("papan.selesaiEditPosisi")}
        </button>
        <button
          type="button"
          onClick={onBatal}
          className="rounded-md border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
        >
          {t("papan.batalEditPosisi")}
        </button>
        <button
          type="button"
          onClick={onAwal}
          className="rounded-md border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
        >
          {t("papan.posisiAwal")}
        </button>
        <button
          type="button"
          onClick={onKosongkan}
          className="rounded-md border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
        >
          {t("papan.kosongkanPapan")}
        </button>
        <button
          type="button"
          onClick={() => onGiliran(giliran === "w" ? "b" : "w")}
          className="rounded-md border border-gray-600 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10"
        >
          {t("papan.giliranEdit", {
            warna: t(giliran === "w" ? "papan.warnaPutih" : "papan.warnaHitam"),
          })}
        </button>
      </div>

      <p className="mb-2 text-[11px] leading-relaxed text-gray-300">
        {t("papan.petunjukEditPosisi")}
      </p>

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
                  ? "border-sky-300 bg-sky-800 ring-2 ring-sky-400/50"
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
              ? "border-rose-300 bg-rose-900 ring-2 ring-rose-400/50"
              : "border-gray-600 bg-[#302e2b] text-gray-200 hover:bg-[#45423f]"
          }`}
        >
          {t("papan.hapusBidak")}
        </button>
      </div>

      {galat && (
        <p role="alert" className="mt-2 text-xs font-medium text-amber-300">
          {galat}
        </p>
      )}
    </section>
  );
}
