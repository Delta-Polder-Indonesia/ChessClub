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
 *   - alias `@/…` → `<root>/src/…` (menyamakan `resolve.alias` vite.config.js
 *     agar komponen UI bersama bisa diimpor uji jsdom).
 *   - `import.meta.env` → objek `{ BASE_URL: "/", … }` (menyamakan `define`
 *     esbuild uji-analisa-ui; di Node `import.meta.env` adalah undefined).
 */
import { transformSync } from "esbuild";
import { readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

/**
 * Pecah pola glob sederhana (* dan {a,b}) menjadi RegExp.
 *
 * Urutan penting: `{` dan `}` SENGAJA tidak di-escape lebih dulu. Kalau
 * diescape duluan, tahap ekspansi `{a,b}` tidak menemukan kurung kurawal lagi
 * dan `*.{svg,png}` menjadi pola literal yang tidak pernah cocok — shim lalu
 * mengembalikan `{}` dan aset bidak hilang diam-diam dari seluruh uji.
 */
function globKeRegExp(pola) {
  const regex = pola
    .replace(/[.+^$()|[\]\\]/g, (c) => `\\${c}`)
    .replace(/\{([^}]+)\}/g, (_m, isi) => `(?:${isi.split(",").join("|")})`)
    .replace(/\*/g, "[^/]*");
  return new RegExp(`^${regex}$`);
}

/**
 * Kumpulkan berkas yang cocok dengan pola relatif terhadap `akarDir`.
 *
 * `*` dan `{a,b}` hanya memuat satu segmen jalur. Segmen pengganti boleh berisi
 * berkas maupun direktori, dan hanya segmen TERAKHIR yang dibatasi ke berkas —
 * itulah yang membuat pola dua tingkat `asets/<set>/<gambar>` bisa ditelusuri.
 * Versi sebelumnya hanya menerima berkas, sehingga `*` di tengah pola tidak
 * pernah menemukan folder dan peta aset bidak selalu kosong di semua uji.
 */
export function temukanBerkasGlob(pola, akarDir) {
  const bagian = pola.split("/").filter(Boolean);
  const hasil = [];
  let tumpuk = ["" /* jalurRelatif dari akar */];
  let dasar = [akarDir];
  for (let i = 0; i < bagian.length; i++) {
    const bp = bagian[i];
    const liar = bp === "*" || bp.includes("*") || bp.includes("{");
    const terakhir = i === bagian.length - 1;
    const dasarBaru = [];
    const tumpukBaru = [];
    for (let j = 0; j < dasar.length; j++) {
      if (!liar) {
        const p = path.join(dasar[j], bp);
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
          const st = statSync(p);
          if (terakhir ? !st.isFile() : !st.isDirectory()) continue;
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
 * `import.meta.glob` hanya di-expand Vite sebagai panggilan langsung
 * `import.meta.glob("pola", { … })`. Bentuk lain — `typeof import.meta.glob`,
 * alias ke variabel, lalu `alias("pola")` — tidak di-expand sama sekali, dan
 * hasil build-nya `{}`: seluruh aset bidak hilang tanpa satu pun galat
 * (regression commit 85ddcfa di PR #167).
 *
 * Shim di bawah memakai regex yang hanya mengenali panggilan langsung, jadi
 * bentuk tak langsung akan lolos tanpa dipecah dan pemanggil diam-diam
 * mendapat peta kosong. Karena itu sisa `import.meta.glob` setelah penggantian
 * diperiksa di sini. Komentar dibuang lebih dulu supaya dokumentasi yang
 * menyebut makro ini tidak dituduh sebagai pemanggilan tak langsung.
 */
export function periksaGlobLangsung(source, urlModul) {
  if (!source.includes("import.meta.glob")) return;
  const kode = transformSync(source, {
    loader: "jsx",
    format: "esm",
    target: "node22",
    jsx: "automatic",
    legalComments: "none",
  }).code;
  for (const cocok of kode.matchAll(/import\.meta\.glob/g)) {
    const sisipan = kode.slice(cocok.index + cocok[0].length).trimStart();
    if (!sisipan.startsWith("(")) {
      throw new Error(
        `${urlModul}: import.meta.glob bukan panggilan langsung — Vite hanya ` +
          `meng-expand \`import.meta.glob("pola", { … })\`. Bentuk lain membuat ` +
          `peta aset kosong di build tanpa galat.`
      );
    }
  }
}

/**
 * Ganti `import.meta.glob("POLA", { … })` dengan objek
 * { polaDenganWildcardDigantiNamaBerkas: () => Promise.resolve(urlFile) }.
 * (Kunci objek glob Vite memakai nama berkas sebenarnya, bukan polanya.)
 */
export function shimGlobVite(source, urlModul) {
  if (!source.includes("import.meta.glob")) return source;
  const dirModul = path.dirname(fileURLToPath(urlModul));
  const re = /import\.meta\.glob\(\s*(['"])([^'"]+)\1\s*(?:,\s*\{[^{}]*\})?\s*\)/g;
  const hasil = source.replace(re, (_padanan, _kutip, pola) => {
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
  periksaGlobLangsung(hasil, urlModul);
  return hasil;
}

const AKAR_REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, next) {
  if (specifier === "@" || specifier.startsWith("@/")) {
    const relatif = specifier === "@" ? "" : specifier.slice(2);
    return { url: pathToFileURL(path.join(AKAR_REPO, "src", relatif)).href, shortCircuit: true };
  }
  return next(specifier, context);
}

/** Nilai `import.meta.env` untuk uji — sama dengan `define` uji-analisa-ui. */
const SHIM_ENV = '({"BASE_URL":"/","MODE":"test","DEV":true,"PROD":false})';

function shimEnvVite(source) {
  return source.includes("import.meta.env") ? source.replaceAll("import.meta.env", SHIM_ENV) : source;
}

export async function load(url, context, next) {
  if (url.endsWith(".jsx")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    const denganShim = shimEnvVite(shimGlobVite(source, url));
    const { code } = transformSync(denganShim, {
      loader: "jsx",
      format: "esm",
      target: "node22",
      jsx: "automatic",
    });
    return { format: "module", source: code, shortCircuit: true };
  }
  // Berkas .js milik repo yang menyentuh import.meta.env (mis. lib/asets.js):
  // tanpa shim, `import.meta.env.BASE_URL` melempar di Node.
  if (url.endsWith(".js") && url.startsWith(pathToFileURL(AKAR_REPO).href)) {
    const source = await readFile(fileURLToPath(url), "utf8");
    if (!source.includes("import.meta.env")) return next(url, context);
    return { format: "module", source: shimEnvVite(source), shortCircuit: true };
  }
  return next(url, context);
}
