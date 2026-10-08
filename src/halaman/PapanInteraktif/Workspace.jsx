import { Suspense, lazy, useEffect, useState } from "react";
import { useI18n } from "../../lib/i18n.jsx";
import IkonTab from "./IkonTab.jsx";

const ManusiaVsMesin = lazy(() => import("./modus/ManusiaVsMesin.jsx"));
const LatihanRepertoar = lazy(() => import("./modus/LatihanRepertoar.jsx"));
const PapanBuku = lazy(() => import("./PapanInteraktif.jsx"));
const LayarPengaturan = lazy(() => import("./LayarPengaturan.jsx"));

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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#262421] font-sans text-gray-200 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col justify-between border-b border-[#312e2b] bg-[#1e1c18] lg:w-[220px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-4">
        <div>
          <div className="flex items-center border-b border-[#312e2b] px-4 py-3 lg:mb-4 lg:px-5 lg:pb-4 lg:pt-0">
            <span className="text-lg font-bold leading-none lg:text-[22px] tracking-tight text-white">
              Blunder<span className="text-[#81b64c]">Skuad</span>
            </span>
          </div>

          <nav
            aria-label={t("papan.menuMode")}
            className="grid w-full grid-cols-4 gap-1 px-1 py-1.5 lg:flex lg:flex-col lg:gap-1 lg:px-3 lg:pb-2 lg:pt-0"
          >
            <button
              type="button"
              aria-pressed={mode === "papan"}
              onClick={() => pilihMode("papan")}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] font-semibold transition sm:text-xs lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-left lg:text-sm ${
                mode === "papan" ? "text-[#a3d168]" : "text-gray-300 hover:text-white"
              }`}
            >
              <IkonTab nama="analisa" className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{t("papan.menuAnalisa")}</span>
            </button>

            <button
              type="button"
              aria-pressed={mode === "engine"}
              onClick={() => pilihMode("engine")}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] font-semibold transition sm:text-xs lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-left lg:text-sm ${
                mode === "engine" ? "text-[#a3d168]" : "text-gray-300 hover:text-white"
              }`}
            >
              <IkonTab nama="users" className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{t("papan.menuManusiaMesin")}</span>
            </button>

            <button
              type="button"
              aria-pressed={mode === "repertoar"}
              onClick={() => pilihMode("repertoar")}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] font-semibold transition sm:text-xs lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-left lg:text-sm ${
                mode === "repertoar" ? "text-[#a3d168]" : "text-gray-300 hover:text-white"
              }`}
            >
              <IkonTab nama="books" className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{t("papan.menuLatihanRepertoar")}</span>
            </button>

            <button
              type="button"
              aria-pressed={mode === "pengaturan"}
              onClick={() => pilihMode("pengaturan")}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] font-semibold transition sm:text-xs lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-left lg:text-sm ${
                mode === "pengaturan" ? "text-[#a3d168]" : "text-gray-300 hover:text-white"
              }`}
            >
              <IkonTab nama="settings" className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{t("papan.pengaturan")}</span>
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
          ) : mode === "pengaturan" ? (
            <LayarPengaturan />
          ) : (
            <PapanBuku tertanam onBukaPengaturan={() => pilihMode("pengaturan")} />
          )}
        </Suspense>
      </main>
    </div>
  );
}
