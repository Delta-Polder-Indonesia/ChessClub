/*
 * Area kerja halaman Analisis Partai.
 *
 * Tugasnya dua: menyediakan <main> yang diukur papan (papan port
 * mengukur kontainer induknya), dan menampilkan LAYAR yang sedang dipilih
 * dari bilah navigasi kiri.
 *
 * Polanya sama dengan halaman Pengurus (`src/halaman/Pengurus/Dashboard.jsx`):
 * bilah samping menyetel satu state (`tab` di sana, `tampilan` di sini) dan
 * area kerja merender panel yang sesuai. Bedanya — dan ini yang penting —
 * papan catur TIDAK pernah dilepas saat layar berganti:
 *
 *   - `tampilan` selain "bermain" hanya MENUTUPI <main> dengan lapisan
 *     `absolute inset-0` yang berlatar pekat;
 *   - <main> disembunyikan dengan `invisible` (visibility:hidden), BUKAN
 *     `hidden` (display:none). visibility:hidden tetap punya kotak ukur,
 *     jadi `updateBoardSize()` di game.jsx masih membaca lebar/tinggi yang
 *     benar dan papan tidak perlu dihitung ulang saat layar kembali;
 *   - karena komponen Game tidak pernah dibongkar, `useEffect([data])` di
 *     dalamnya tidak mengulang `handlePGN()`. Kalau sampai dilepas-pasang,
 *     setiap kali pengguna bolak-balik dari Basis Data ia akan menganalisis
 *     ULANG seluruh partai dari nol;
 *   - `visibility:hidden` juga membuat isi papan tidak bisa difokus, jadi
 *     tombol Tab tidak menyelinap ke balik lapisan, dan pintasan papan
 *     dimatikan lewat `tampilanRef` di game.jsx.
 *
 * z-[900] sengaja dipilih di bawah `PageErrors` (z-[999]) supaya pesan
 * galat analisis tetap tampil di atas layar mana pun.
 */
import { lazy, Suspense, useCallback, useContext, useEffect, useRef } from "react";
import { AnalyzeContext, TAMPILAN_ANALISA } from "../konteks/analyze.jsx";
import Game from "./game/game.jsx";
import BoardMenu from "./boardMenu/boardMenu.jsx";
import Menu from "./menu/menu.jsx";
import GameButtons from "./menu/analysis/gameButtons.jsx";
import LayarDatabase from "./nav/layarDatabase.jsx";
import LayarImpor from "./nav/layarImpor.jsx";

/*
 * LayarAkun (via DashboardAkun) mengimpor recharts ±97 KiB — bundle grafik
 * itu tidak dibutuhkan untuk membuka papan, jadi layar ini dimuat malas
 * (chunk terpisah, diunduh baru saat pengguna membuka layar Akun). Ini
 * mengeluarkan vendor-chart dari jalur kritis halaman (temuan "reduce
 * unused JavaScript" Lighthouse ±80 KiB).
 */
const LayarAkun = lazy(() => import("./nav/layarAkun.jsx"));
const LayarDeteksiEngine = lazy(() => import("./nav/layarDeteksiEngine.jsx"));

export default function AreaKerja() {
  const analyzeContext = useContext(AnalyzeContext);
  const [tampilan, setTampilan] = analyzeContext.tampilan;
  const setData = analyzeContext.data[1];

  const wadahRef = useRef(null);
  const lapisanRef = useRef(null);
  const awalRef = useRef(true);

  const kePapan = useCallback(
    () => setTampilan(TAMPILAN_ANALISA.BERMAIN),
    [setTampilan],
  );

  const keAkun = useCallback(
    () => setTampilan(TAMPILAN_ANALISA.AKUN),
    [setTampilan],
  );

  const keDeteksiEngine = useCallback(
    () => setTampilan(TAMPILAN_ANALISA.DETEKSI_ENGINE),
    [setTampilan],
  );

  /**
   * Partai dipilih dari layar Basis Data / Impor. Data PGN-nya dilempar ke
   * AnalyzeContext (itu yang memicu Game menganalisis) lalu area kerja
   * kembali ke papan supaya hasilnya terlihat.
   */
  const muatPartai = useCallback(
    (dataPartai) => {
      setData(dataPartai);
      setTampilan(TAMPILAN_ANALISA.BERMAIN);
    },
    [setData, setTampilan],
  );

  const papanAktif = tampilan === TAMPILAN_ANALISA.BERMAIN;

  /*
   * Fokus mengikuti layar: saat lapisan non-papan muncul, fokus dibawa ke
   * lapisan supaya pembaca layar mengumumkannya dan tombol Tab mulai dari
   * dalamnya (bukan tersesat di papan `invisible` yang tak bisa difokus).
   * Render pertama dilewati — pengguna belum berpindah ke mana-mana.
   */
  useEffect(() => {
    if (awalRef.current) {
      awalRef.current = false;
      return;
    }
    if (!papanAktif) lapisanRef.current?.focus({ preventScroll: true });
  }, [tampilan, papanAktif]);

  // Escape menutup lapisan kembali ke papan (pintasan papan sendiri sudah
  // dimatikan lewat `tampilanRef` di game.jsx, jadi tak ada konflik).
  useEffect(() => {
    if (papanAktif) return undefined;
    const tekan = (e) => {
      if (e.key === "Escape") kePapan();
    };
    document.addEventListener("keydown", tekan);
    return () => document.removeEventListener("keydown", tekan);
  }, [papanAktif, kePapan]);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 w-full flex-1 flex-col">
      <main
        ref={wadahRef}
        aria-hidden={papanAktif ? undefined : true}
        className={`relative h-full min-w-0 w-full overflow-y-auto overflow-x-hidden ${papanAktif ? "" : "invisible"}`}
      >
        <div className="flex h-full w-full flex-col items-center justify-start gap-4 overflow-y-auto p-2 vertical:flex-row vertical:justify-start vertical:gap-2 vertical:overflow-visible vertical:p-4">
          <div className="flex h-full w-min flex-col navTop:flex-row vertical:gap-[10px] gap-[6px]">
            <Game wadah={wadahRef} />
            <BoardMenu />
            <div className="bg-backgroundBox flex-row justify-center rounded-borderRoundness w-full navTop:hidden flex h-12">
              <div className="max-w-[500px] w-full flex flex-row justify-center scale-75">
                <GameButtons />
              </div>
            </div>
          </div>
          <Menu />
        </div>
      </main>

      {papanAktif ? null : (
        <div
          ref={lapisanRef}
          tabIndex={-1}
          data-uji={`layar-${tampilan}`}
          data-layar={tampilan}
          className="absolute inset-0 z-[900] min-h-0 overflow-y-auto overflow-x-hidden"
        >
          {tampilan === TAMPILAN_ANALISA.AKUN ? (
            <Suspense fallback={<div className="h-full min-h-0 w-full bg-backgroundBox" />}>
              <LayarAkun onTutup={kePapan} onDeteksiEngine={keDeteksiEngine} />
            </Suspense>
          ) : null}
          {tampilan === TAMPILAN_ANALISA.DETEKSI_ENGINE ? (
            <Suspense fallback={<div className="h-full min-h-0 w-full bg-backgroundBox" />}>
              <LayarDeteksiEngine onBukaAkun={keAkun} />
            </Suspense>
          ) : null}
          {tampilan === TAMPILAN_ANALISA.BASIS_DATA ? (
            <LayarDatabase onTutup={kePapan} onAnalisa={muatPartai} onBukaAkun={keAkun} />
          ) : null}
          {tampilan === TAMPILAN_ANALISA.IMPOR ? <LayarImpor onTutup={kePapan} onImpor={muatPartai} /> : null}
        </div>
      )}
    </div>
  );
}
