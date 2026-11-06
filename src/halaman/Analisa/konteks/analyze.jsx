/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
/**
 * Lapisan kompatibilitas AnalyzeContext (Fase 2).
 *
 * State halaman kini tinggal di dua provider yang lebih sempit:
 *
 *   BoardProvider  — state papan & navigasi (game, players, moveNumber,
 *                    forward, animation, white, playing, time,
 *                    materialAdvantage, result, tab, customLine,
 *                    returnedToNormalGame, depth, tampilan, gameController)
 *   ImportProvider — state muatan PGN & analisis (data, pageState, progress,
 *                    analyzeController, analyzingMove, langkahSementara)
 *
 * Berkas ini menyusun keduanya kembali menjadi SATU nilai `AnalyzeContext`
 * dengan bentuk yang persis sama seperti sebelumnya (22 slot `[nilai,
 * setter]` + `gameController`, `players` sudah dinormalisasi). Karena itu
 * SELURUH komponen lama — dan seluruh uji UI yang menyuntik nilai lewat
 * `AnalyzeContext.Provider` — tetap berjalan tanpa disentuh.
 *
 * `akun` sengaja tetap di sini: ia bukan state papan maupun state impor, dan
 * pemecahan konteks akun di luar lingkup fase ini.
 *
 * Efek samping yang perlu diketahui: nilai gabungan tetap dibuat ulang
 * setiap kali salah satu dari 22 slot berubah — itu yang membuat perilaku
 * identik. Pengurangan render baru terasa ketika komponen memakai
 * `useBoard()` / `useImport()` langsung (fase berikutnya), karena saat itu
 * perubahan `progress` tidak lagi me-render konsumen papan.
 */
import { useMemo, useState } from "react";
import { AnalyzeContext } from "./analyzeKonteks.js";
import { BoardProvider } from "./board.jsx";
import { ImportProvider } from "./import.jsx";
import { useBoard } from "./boardKonteks.js";
import { useImport } from "./importKonteks.js";

/**
 * Penyusun nilai gabungan. Harus berada DI DALAM kedua provider supaya bisa
 * membaca keduanya. Satu-satunya state miliknya sendiri: `akun`.
 */
function PenyambungKonteks({ children }) {
  const board = useBoard();
  const imp = useImport();
  const [akun, setAkun] = useState({ platform: "chessCom", username: "" });

  /*
   * Urutan field dipertahankan sama dengan versi lama supaya diff mudah
   * dibaca; dependensinya cukup ketiga sumber (board, imp, akun) karena
   * masing-masing sudah di-memo di providernya.
   */
  const nilaiKonteks = useMemo(
    () => ({
      data: imp.data,
      pageState: imp.pageState,
      game: board.game,
      players: board.players,
      moveNumber: board.moveNumber,
      forward: board.forward,
      white: board.white,
      animation: board.animation,
      playing: board.playing,
      time: board.time,
      materialAdvantage: board.materialAdvantage,
      result: board.result,
      progress: imp.progress,
      langkahSementara: imp.langkahSementara,
      tab: board.tab,
      analyzeController: imp.analyzeController,
      customLine: board.customLine,
      returnedToNormalGame: board.returnedToNormalGame,
      analyzingMove: imp.analyzingMove,
      akun: [akun, setAkun],
      depth: board.depth,
      tampilan: board.tampilan,
      gameController: board.gameController,
    }),
    [board, imp, akun]
  );

  return <AnalyzeContext.Provider value={nilaiKonteks}>{children}</AnalyzeContext.Provider>;
}

function AnalyzeContextProvider(props) {
  return (
    <BoardProvider>
      <ImportProvider>
        <PenyambungKonteks>{props.children}</PenyambungKonteks>
      </ImportProvider>
    </BoardProvider>
  );
}

export default AnalyzeContextProvider;
