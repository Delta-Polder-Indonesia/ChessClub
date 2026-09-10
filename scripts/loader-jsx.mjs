/**
 * Node loader: transform berkas .jsx (React) dengan esbuild sehingga kode
 * aplikasi bisa dijalankan di Node (dipakai scripts/uji-navigasi.mjs untuk
 * menguji gameController halaman Analisa tanpa browser).
 */
import { transformSync } from "esbuild";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export async function load(url, context, next) {
  if (url.endsWith(".jsx")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    const { code } = transformSync(source, {
      loader: "jsx",
      format: "esm",
      target: "node22",
      jsx: "automatic",
    });
    return { format: "module", source: code, shortCircuit: true };
  }
  return next(url, context);
}
