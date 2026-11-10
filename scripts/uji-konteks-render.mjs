/**
 * Uji optimasi Context — render ulang papan tidak diperlukan saat progres berubah.
 */
import assert from "node:assert/strict";
import fs from "node:fs";

let lulus = 0, gagal = 0;
async function uji(nama, fn) {
  try { await fn(); lulus++; console.log(`  ✓ ${nama}`); }
  catch (e) { gagal++; console.error(`  ✗ ${nama}\n    ${e?.stack ?? e?.message}`); process.exitCode = 1; }
}

console.log("Context — optimasi render");

await uji("AnalyzeContext masih ada sebagai lapisan kompatibilitas", () => {
  assert.ok(fs.existsSync("src/halaman/Analisa/konteks/analyze.jsx"));
  assert.ok(fs.existsSync("src/halaman/Analisa/konteks/analyzeKonteks.js"));
  const src = fs.readFileSync("src/halaman/Analisa/konteks/analyze.jsx", "utf8");
  assert.ok(src.includes("AnalyzeContext.Provider"), "harus tetap provide AnalyzeContext");
});

await uji("Konsumen yang hanya butuh Import sudah dimigrasi ke useImport", () => {
  const loading = fs.readFileSync("src/halaman/Analisa/komponen/menu/loading/loading.jsx", "utf8");
  assert.ok(loading.includes("useImport()"), "loading.jsx harus pakai useImport");
  assert.ok(!loading.includes("AnalyzeContext"), "loading.jsx tidak boleh lagi pakai AnalyzeContext");
  const chessCom = fs.readFileSync("src/halaman/Analisa/komponen/menu/analyze/selectChessCom.jsx", "utf8");
  assert.ok(chessCom.includes("useImport()"), "selectChessCom harus pakai useImport");
  const lichess = fs.readFileSync("src/halaman/Analisa/komponen/menu/analyze/selectLichessOrg.jsx", "utf8");
  assert.ok(lichess.includes("useImport()"), "selectLichessOrg harus pakai useImport");
});

await uji("Konsumen yang butuh Board + Import sudah dimigrasi atau tetap kompatibel", () => {
  const ekspor = fs.readFileSync("src/halaman/Analisa/komponen/menu/analysis/summary/eksporPgn.jsx", "utf8");
  assert.ok(ekspor.includes("useBoard()") || ekspor.includes("useImport()"), "eksporPgn harus pakai Board/Import");
  assert.ok(!ekspor.includes("AnalyzeContext"), "eksporPgn tidak boleh pakai AnalyzeContext lagi");
});

await uji("BoardContext dan ImportContext menggunakan useMemo untuk nilai", () => {
  const board = fs.readFileSync("src/halaman/Analisa/konteks/board.jsx", "utf8");
  assert.ok(board.includes("useMemo"), "BoardProvider harus memoize nilai");
  const imp = fs.readFileSync("src/halaman/Analisa/konteks/import.jsx", "utf8");
  assert.ok(imp.includes("useMemo"), "ImportProvider harus memoize nilai");
  const analyze = fs.readFileSync("src/halaman/Analisa/konteks/analyze.jsx", "utf8");
  assert.ok(analyze.includes("useMemo"), "PenyambungKonteks harus memoize nilaiKonteks");
});

await uji("Board component dimemoize agar tidak re-render saat parent memuat", () => {
  const boardSrc = fs.readFileSync("src/halaman/Analisa/komponen/game/board.jsx", "utf8");
  assert.ok(boardSrc.includes("memo(Board)") || boardSrc.includes("memo("), "Board harus dibungkus memo");
});

await uji("Game memoisasi callback papan (pushArrow, cleanArrows, arrowsMemo)", () => {
  const gameSrc = fs.readFileSync("src/halaman/Analisa/komponen/game/game.jsx", "utf8");
  assert.ok(gameSrc.includes("useCallback") && gameSrc.includes("pushArrow"), "pushArrow harus useCallback");
  assert.ok(gameSrc.includes("useMemo") && gameSrc.includes("arrowsMemo"), "arrows harus useMemo");
});

await uji("AreaKerja sudah terpisah: BoardContext untuk tampilan, ImportContext untuk PGN titipan", () => {
  const area = fs.readFileSync("src/halaman/Analisa/komponen/areaKerja.jsx", "utf8");
  assert.ok(area.includes("useBoard().tampilan"), "AreaKerja harus pakai useBoard untuk tampilan");
  assert.ok(area.includes("useImport().data"), "PenitipPgn harus pakai useImport untuk data");
});

await uji("BoardMenu, GameButtons, Nav sudah pakai BoardContext langsung", () => {
  for (const p of [
    "src/halaman/Analisa/komponen/boardMenu/boardMenu.jsx",
    "src/halaman/Analisa/komponen/menu/analysis/gameButtons.jsx",
    "src/halaman/Analisa/komponen/nav/nav.jsx",
  ]) {
    const src = fs.readFileSync(p, "utf8");
    assert.ok(src.includes("useBoard()"), `${p} harus pakai useBoard`);
    assert.ok(!src.includes("useContext(AnalyzeContext)"), `${p} tidak boleh pakai AnalyzeContext`);
  }
});

await uji("Render dinamis: progress tidak menyentuh konsumen Board (static)", async () => {
  const impSrc = fs.readFileSync("src/halaman/Analisa/konteks/import.jsx", "utf8");
  assert.ok(impSrc.includes("const [progress"), "ImportProvider harus memiliki progress");
  const boardSrc = fs.readFileSync("src/halaman/Analisa/konteks/board.jsx", "utf8");
  assert.ok(!boardSrc.includes("const [progress"), "BoardProvider tidak boleh memiliki progress");
});

console.log(`\n${lulus} pemeriksaan lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
