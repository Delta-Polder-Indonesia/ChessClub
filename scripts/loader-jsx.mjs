/**
 * Node loader: transform berkas .jsx (React) dengan esbuild sehingga kode
 * aplikasi bisa dijalankan di Node (dipakai scripts/uji-navigasi.mjs untuk
 * menguji gameController halaman Analisa tanpa browser).
 *
 * Karena kode aplikasi ditulis untuk Vite, loader ini juga menshim API yang
 * tidak tersedia di Node:
 *   - `import.meta.glob("…", { query: "?url", import: "default" })` → objek
 *     { jalurPola: () => Promise<url> } yang dipecah dengan glob sederhana
 *     di waktu muat (dipakai renderer bidak untuk memuat aset per-set).
 */
import { transformSync } from "esbuild";
import { readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

/** Pecah pola glob sederhana (* dan {a,b}) menjadi RegExp. */
function globKeRegExp(pola) {
  const regex = pola
    .replace(/[.+^${}()|[\]\\]/g, (c) => `\\${c}`)
    .replace(/\{([^}]+)\}/g, (_m, isi) => `(${isi.split(",").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`)
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${regex}$`);
}

/** Kumpulkan berkas yang cocok dengan pola relatif terhadap `akarDir`. */
function temukanBerkasGlob(pola, akarDir) {
  const bagian = pola.split("/").filter(Boolean);
  const hasil = [];
  let tumpuk = ["" /* jalurRelatif dari akar */];
  let dasar = [akarDir];
  for (let i = 0; i < bagian.length; i++) {
    const bp = bagian[i];
    const liar = bp === "*" || bp.includes("*") || bp.includes("{");
    const dasarBaru = [];
    const tumpukBaru = [];
    for (let j = 0; j < dasar.length; j++) {
      if (!liar) {
        const p = path.join(dasar[j], bp);
        const terakhir = i === bagian.length - 1;
        try {
          const st = statSync(p);
          if (terakhir ? st.isFile() : st.isDirectory()) {
            dasarBaru.push(p);
            tumpukBaru.push(tumpuk[j] ? `${tumpuk[j]}/${bp}` : bp);
          }
        } catch {
          /* tidak ada */
        }
        continue;
      }
      const re = globKeRegExp(bp);
      let daftar = [];
      try {
        daftar = readdirSync(dasar[j]);
      } catch {
        continue;
      }
      for (const nama of daftar) {
        if (!re.test(nama)) continue;
        const p = path.join(dasar[j], nama);
        try {
          if (!statSync(p).isFile()) continue;
        } catch {
          continue;
        }
        dasarBaru.push(p);
        tumpukBaru.push(tumpuk[j] ? `${tumpuk[j]}/${nama}` : nama);
      }
    }
    dasar = dasarBaru;
    tumpuk = tumpukBaru;
  }
  for (let k = 0; k < dasar.length; k++) {
    hasil.push({ absolut: dasar[k], relatif: tumpuk[k] });
  }
  return hasil;
}

/**
 * Ganti `import.meta.glob("POLA", { … })` dengan objek
 * { polaDenganWildcardDigantiNamaBerkas: () => Promise.resolve(urlFile) }.
 * (Kunci objek glob Vite memakai nama berkas sebenarnya, bukan polanya.)
 */
function shimGlobVite(source, urlModul) {
  if (!source.includes("import.meta.glob")) return source;
  const dirModul = path.dirname(fileURLToPath(urlModul));
  const re = /import\.meta\.glob\(\s*(['"])([^'"]+)\1\s*(?:,\s*\{[^{}]*\})?\s*\)/g;
  return source.replace(re, (_padanan, _kutip, pola) => {
    const bagianPola = pola.split("/").filter(Boolean);
    const cocok = temukanBerkasGlob(pola, dirModul);
    const entri = cocok.map((f) => {
      const namaBagian = f.relatif.split("/");
      const kunciBagian = bagianPola.map((bp, i) =>
        bp === "*" || bp.includes("*") || bp.includes("{") ? namaBagian[i] : bp
      );
      return `${JSON.stringify(kunciBagian.join("/"))}: () => Promise.resolve(${JSON.stringify(pathToFileURL(f.absolut).href)})`;
    });
    return `({ ${entri.join(", ")} })`;
  });
}

export async function load(url, context, next) {
  if (url.endsWith(".jsx")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    const denganShim = shimGlobVite(source, url);
    const { code } = transformSync(denganShim, {
      loader: "jsx",
      format: "esm",
      target: "node22",
      jsx: "automatic",
    });
    return { format: "module", source: code, shortCircuit: true };
  }
  return next(url, context);
}
