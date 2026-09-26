import { Suspense, lazy, useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import IkonTab from "./IkonTab.jsx";

const ManusiaVsMesin = lazy(() => import("./modus/ManusiaVsMesin.jsx"));
const LatihanRepertoar = lazy(() => import("./modus/LatihanRepertoar.jsx"));
const PapanBuku = lazy(() => import("./PapanInteraktif.jsx"));

function KerangkaMode() {
  return (
    <div aria-hidden="true" className="h-full animate-pulse p-5">
      <div className="h-7 w-64 rounded bg-[#312e2b]" />
      <div className="mt-4 h-4 w-96 max-w-full rounded bg-[#312e2b]" />
      <div className="mt-8 aspect-square max-h-[65vh] rounded-lg bg-[#312e2b]" />
    </div>
  );
}

export default function WorkspacePapanInteraktif() {
  const { t } = useI18n();
  const [mode, setMode] = useState("papan");

  useEffect(() => {
    document.title = `${t("papan.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  function pilihMode(berikutnya) {
    setMode(berikutnya);
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-[#262421] font-sans text-gray-200 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col justify-between overflow-y-auto border-b border-[#312e2b] bg-[#1e1c18] py-4 lg:w-[220px] lg:border-b-0 lg:border-r">
        <div>
          <div className="mb-4 flex items-center border-b border-[#312e2b] px-5 pb-4">
            <span className="text-[22px] font-bold leading-none tracking-tight text-white">
              Blunder<span className="text-[#81b64c]">Skuad</span>
            </span>
          </div>

          <nav
            aria-label={t("papan.menuMode")}
            className="flex max-w-full gap-2 overflow-x-auto px-3 pb-2 lg:flex-col lg:gap-1 lg:overflow-visible"
          >
            <button
              type="button"
              aria-pressed={mode === "papan"}
              onClick={() => pilihMode("papan")}
              className={`flex min-w-[150px] flex-1 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition lg:min-w-0 lg:flex-none ${
                mode === "papan"
                  ? "border-[#81b64c]/40 bg-[#81b64c]/10 text-white"
                  : "border-transparent text-gray-300 hover:border-[#3b3935] hover:bg-[#262421] hover:text-white"
              }`}
            >
              <IkonTab nama="analisa" className="h-5 w-5 shrink-0" />
              <span className="truncate">{t("papan.menuAnalisa")}</span>
            </button>

            <button
              type="button"
              aria-pressed={mode === "engine"}
              onClick={() => pilihMode("engine")}
              className={`flex min-w-[190px] flex-1 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition lg:min-w-0 lg:flex-none ${
                mode === "engine"
                  ? "border-[#81b64c]/40 bg-[#81b64c]/10 text-white"
                  : "border-transparent text-gray-300 hover:border-[#3b3935] hover:bg-[#262421] hover:text-white"
              }`}
            >
              <IkonTab nama="games" className="h-5 w-5 shrink-0" />
              <span className="truncate">{t("papan.menuManusiaMesin")}</span>
            </button>

            <button
              type="button"
              aria-pressed={mode === "repertoar"}
              onClick={() => pilihMode("repertoar")}
              className={`flex min-w-[190px] flex-1 items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition lg:min-w-0 lg:flex-none ${
                mode === "repertoar"
                  ? "border-[#81b64c]/40 bg-[#81b64c]/10 text-white"
                  : "border-transparent text-gray-300 hover:border-[#3b3935] hover:bg-[#262421] hover:text-white"
              }`}
            >
              <IkonTab nama="books" className="h-5 w-5 shrink-0" />
              <span className="truncate">{t("papan.menuLatihanRepertoar")}</span>
            </button>
          </nav>
        </div>

      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#262421]">
        <Suspense fallback={<KerangkaMode />}>
          {mode === "engine" ? (
            <ManusiaVsMesin />
          ) : mode === "repertoar" ? (
            <LatihanRepertoar onJelajahBuku={() => pilihMode("papan")} />
          ) : (
            <PapanBuku tertanam />
          )}
        </Suspense>
      </main>
    </div>
  );
}
