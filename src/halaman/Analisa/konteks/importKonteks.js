/**
 * Kontrak ImportContext — state MUATAN PGN & JALANNYA ANALISIS.
 *
 * Isi: `data` (PGN/FEN yang dimuat), `pageState` (default | loading | …),
 * `progress` (persen analisis), `analyzeController` (AbortController analisis
 * berjalan), `analyzingMove` (sedang menghitung satu langkah), dan
 * `langkahSementara` (posisi + eval sementara selama analisis berjalan).
 *
 * Keenam field ini berubah SANGAT sering dibanding state papan: `progress`
 * dan `langkahSementara` berubah tiap langkah analisis, `analyzingMove` tiap
 * klik "analisa langkah". Karena itu ia dipisahkan dari `BoardContext`
 * supaya perubahan itu tidak lagi menyentuh provider papan.
 *
 * Bentuk nilai tetap pasangan `[nilai, setter]` seperti konvensi lama.
 *
 * CATATAN FASE 2: belum ada komponen yang memakai konteks ini. Komponen lama
 * tetap membaca `AnalyzeContext` (lapisan kompatibilitas) sehingga tidak ada
 * perubahan perilaku; migrasi konsumen dikerjakan pada fase berikutnya.
 */
import { createContext, useContext } from "react";

const TIDAK_ADA = () => {};

/*
 * Controller bawaan untuk render di luar provider. Sama seperti di
 * `analyzeKonteks.js`: satu instance bersama untuk nilai bawaan, sedangkan
 * provider selalu membuat controller baru per-mount (StrictMode ganda tidak
 * boleh berbagi controller yang bisa di-abort).
 */
const abortControllerInstance = new AbortController();

export const ImportContext = createContext({
  data: [{ format: "fen", string: "" }, TIDAK_ADA],
  pageState: ["default", TIDAK_ADA],
  progress: [0, TIDAK_ADA],
  analyzeController: [abortControllerInstance, TIDAK_ADA],
  analyzingMove: [false, TIDAK_ADA],
  langkahSementara: [[], TIDAK_ADA],
});

/** Baca ImportContext. Setara `useContext(ImportContext)` dengan nama pendek. */
export function useImport() {
  return useContext(ImportContext);
}
