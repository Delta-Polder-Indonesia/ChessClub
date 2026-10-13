import { Suspense, lazy, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../../lib/i18n.jsx";
import IkonTab from "./bersama/IkonTab.jsx";
import { PenyediaPengaturanPapan } from "./bersama/PengaturanKonteks.jsx";

// Papan buku dimuat malas seperti mode lain — tata letak ini hanya kerangka
// (sidebar + outlet) sehingga chunk-nya tetap ringan.
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

/**
 * Isi rute `/papan-interaktif` (papan buku/bebas). Tombol gear-nya membuka
 * halaman pengaturan, bukan popup — perilaku yang sama seperti sebelum tiap
 * mode menjadi rute sendiri.
 */
export function HalamanPapanBuku() {
  const pergi = useNavigate();
  return (
    <Suspense fallback={<KerangkaMode />}>
      <PapanBuku
        tertanam
        onBukaPengaturan={() => pergi("/papan-interaktif/pengaturan")}
      />
    </Suspense>
  );
}

/** Menu mode papan — tiap mode kini rute sendiri, bukan tab state. */
const MENU_PAPAN = [
  { ke: "/papan-interaktif", akhir: true, ikon: "analisa", label: "papan.menuAnalisa" },
  { ke: "/papan-interaktif/manusia-vs-mesin", ikon: "users", label: "papan.menuManusiaMesin" },
  { ke: "/papan-interaktif/latihan-repertoar", ikon: "books", label: "papan.menuLatihanRepertoar" },
  { ke: "/papan-interaktif/hand-brain", ikon: "games", label: "papan.menuHandBrain" },
  { ke: "/papan-interaktif/turing-test", ikon: "users", label: "papan.menuTuring" },
  { ke: "/papan-interaktif/pengaturan", ikon: "settings", label: "papan.pengaturan" },
];

/**
 * Tata letak seluruh halaman di bawah `/papan-interaktif/*`: sidebar + outlet.
 * Pengaturan papan disediakan lewat konteks sehingga nilainya tetap ada saat
 * berpindah antar halaman mode (dulu ini state tab Workspace).
 */
export default function TataLetakPapan() {
  const { t } = useI18n();
  const { pathname } = useLocation();

  useEffect(() => {
    const aktif = MENU_PAPAN.find((m) => pathname === m.ke);
    document.title = `${t(aktif?.label ?? "papan.judul")} | ${t("common.namaKomunitas")}`;
  }, [pathname, t]);

  return (
    <PenyediaPengaturanPapan>
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
              className="grid w-full grid-cols-6 gap-1 px-1 py-1.5 lg:flex lg:flex-col lg:gap-1 lg:px-3 lg:pb-2 lg:pt-0"
            >
              {MENU_PAPAN.map((item) => (
                <NavLink
                  key={item.ke}
                  to={item.ke}
                  end={item.akhir}
                  className={({ isActive }) =>
                    `flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[10px] font-semibold transition sm:text-xs lg:flex-none lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-3 lg:text-left lg:text-sm ${
                      isActive ? "text-[#a3d168]" : "text-gray-300 hover:text-white"
                    }`
                  }
                >
                  <IkonTab nama={item.ikon} className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate">{t(item.label)}</span>
                </NavLink>
              ))}
            </nav>
          </div>

        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#262421]">
          <Suspense fallback={<KerangkaMode />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </PenyediaPengaturanPapan>
  );
}
