import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";
import { KUNCI_HAPUS_BIDAK } from "./bersama/editorPosisi.js";

const JENIS = ["k", "q", "r", "b", "n", "p"];
const BIDAK_PUTIH = JENIS.map((jenis) => jenis.toUpperCase());
const BIDAK_HITAM = JENIS;

export default function EditorPosisi({
  terpilih,
  fen,
  posisiSah,
  galatLegalitas,
  onPilih,
  onGiliran,
  giliran,
  hakRokade,
  onUbahRokade,
  onEditFen,
  onSalinFen,
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
      className="w-full"
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
          disabled={!posisiSah}
          className="rounded-md bg-[#e7e5e4] px-3 py-2 text-xs font-semibold text-[#262421] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#e7e5e4]"
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
      </div>

      <div className="mb-4 grid gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold text-gray-300">
            {t("papan.giliranJalan")}:
          </span>
          <button
            type="button"
            aria-pressed={giliran === "w"}
            onClick={() => onGiliran("w")}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              giliran === "w"
                ? "border-[#a3a09b] bg-[#45423f] text-white"
                : "border-[#57534e] text-gray-300 hover:bg-white/5"
            }`}
          >
            <ChessPiece piece="K" set={setBidak} className="h-5 w-5" />
            {t("papan.warnaPutih")}
          </button>
          <button
            type="button"
            aria-pressed={giliran === "b"}
            onClick={() => onGiliran("b")}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
              giliran === "b"
                ? "border-[#a3a09b] bg-[#45423f] text-white"
                : "border-[#57534e] text-gray-300 hover:bg-white/5"
            }`}
          >
            <ChessPiece piece="k" set={setBidak} className="h-5 w-5" />
            {t("papan.warnaHitam")}
          </button>
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-xs font-semibold text-gray-300">
            {t("papan.rokade")}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { hak: "k", label: t("papan.rokadeHitamRaja"), notasi: "O-O" },
              { hak: "q", label: t("papan.rokadeHitamMenteri"), notasi: "O-O-O" },
              { hak: "K", label: t("papan.rokadePutihRaja"), notasi: "O-O" },
              { hak: "Q", label: t("papan.rokadePutihMenteri"), notasi: "O-O-O" },
            ].map(({ hak, label, notasi }) => {
              const aktif = hakRokade.includes(hak);
              return (
                <label
                  key={hak}
                  className={`flex min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                    aktif
                      ? "border-[#a3a09b] bg-[#45423f] text-white"
                      : "border-[#57534e] text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={aktif}
                      onChange={(event) => onUbahRokade(hak, event.target.checked)}
                      className="h-4 w-4 shrink-0 accent-[#d6d3d1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#262421]"
                    />
                    <span className="min-w-0 text-xs font-medium">{label}</span>
                  </span>
                  <span className="shrink-0 font-mono text-xs font-semibold">{notasi}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-1.5">
          <label htmlFor="fen-susun" className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {t("papan.fenPosisiSusun")}
          </label>
          <div className="flex min-w-0 items-center gap-2">
            <input
              id="fen-susun"
              type="text"
              readOnly
              value={fen}
              aria-label={t("papan.fenPosisiSusun")}
              className="min-w-0 flex-1 rounded-md border border-[#3a3835] bg-[#1e1c18] px-3 py-2 font-mono text-xs leading-relaxed text-gray-200 outline-none selection:bg-gray-600"
            />
            <button
              type="button"
              onClick={onEditFen}
              className="shrink-0 rounded-md border border-[#57534e] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
            >
              {t("papan.editFen")}
            </button>
            <button
              type="button"
              onClick={onSalinFen}
              className="shrink-0 rounded-md border border-[#57534e] px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
            >
              {t("papan.salin")}
            </button>
          </div>
        </div>
        {!posisiSah && (
          <p role="status" className="text-xs font-semibold text-gray-200">
            {t("papan.posisiIlegal")}: {galatLegalitas}
          </p>
        )}
        {galat && !galatLegalitas && (
          <p role="alert" className="text-xs font-medium text-gray-300">
            {galat}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {[
          { label: t("papan.warnaPutih"), daftar: BIDAK_PUTIH, putih: true },
          { label: t("papan.warnaHitam"), daftar: BIDAK_HITAM, putih: false },
        ].map(({ label, daftar, putih }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-12 shrink-0 text-xs font-semibold text-gray-300">
              {label}
            </span>
            <div className="grid min-w-0 flex-1 grid-cols-6 gap-1.5">
              {daftar.map((simbol) => {
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
                    className={`flex aspect-square min-w-0 items-center justify-center rounded-md border transition-colors ${
                      dipilih
                        ? "border-white bg-[#57534e] ring-2 ring-white/30"
                        : "border-gray-600 bg-[#302e2b] hover:bg-[#45423f]"
                    }`}
                  >
                    <ChessPiece
                      piece={simbol}
                      set={setBidak}
                      className="h-[min(2rem,80%)] w-[min(2rem,80%)]"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={t("papan.hapusBidak")}
            aria-pressed={terpilih === KUNCI_HAPUS_BIDAK}
            onClick={() =>
              onPilih(terpilih === KUNCI_HAPUS_BIDAK ? null : KUNCI_HAPUS_BIDAK)
            }
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition-colors ${
              terpilih === KUNCI_HAPUS_BIDAK
                ? "border-white bg-[#57534e] text-white ring-2 ring-white/30"
                : "border-gray-600 bg-[#302e2b] text-gray-200 hover:bg-[#45423f]"
            }`}
          >
            {t("papan.hapusBidak")}
          </button>
        </div>

      </div>

    </section>
  );
}
