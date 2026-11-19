/**
 * Uji dialog batas permintaan (HTTP 429) di dashboard Pengurus.
 *
 * Yang dikunci di sini bukan sekadar "tidak error", tetapi bentuk yang sudah
 * disepakati: galat 429 tampil sebagai dialog (role="alertdialog"), memakai
 * kelas pintu CSS, tombol coba lagi nonaktif selama hitungan mundur, dan tanpa
 * warna semantik maupun bayangan — tiga hukum mutlak Pengurus.
 *
 * Render dilakukan di server (renderToStaticMarkup) karena tidak ada DOM di
 * Node. Cukup untuk memastikan markup dan kelasnya benar.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ui = path.join(AKAR, "src/halaman/Pengurus/ui.jsx");

const entri = `
import { renderToStaticMarkup } from "react-dom/server";
import { KotakGalatMuat, Tombol } from ${JSON.stringify(ui)};

const kosong = () => {};
const kasus = {
  dialog: renderToStaticMarkup(
    React.createElement(KotakGalatMuat, {
      pesan: "Terlalu banyak permintaan. Coba lagi dalam 418 detik.",
      cobaDetik: 418,
      onCobaLagi: kosong,
    })
  ),
  galatBiasa: renderToStaticMarkup(
    React.createElement(KotakGalatMuat, {
      pesan: "Periksa koneksi lalu coba lagi.",
      onCobaLagi: kosong,
    })
  ),
  tombolAnak: renderToStaticMarkup(
    React.createElement(Tombol, null, "Coba Lagi")
  ),
};
console.log(JSON.stringify(kasus));
`;
const entriDenganReact = entri.replace(
  'import { KotakGalatMuat, Tombol }',
  'import React from "react";\nimport { KotakGalatMuat, Tombol }'
);

let lulus = 0;
let gagal = 0;
function uji(nama, kondisi, keterangan = "") {
  if (kondisi) {
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal += 1;
    console.error(`  ✗ ${nama}${keterangan ? ` — ${keterangan}` : ""}`);
  }
}

const dir = mkdtempSync(path.join(tmpdir(), "uji-dialog-"));
try {
  const jalurEntri = path.join(dir, "entri.jsx");
  const jalurKeluar = path.join(dir, "keluar.cjs");
  writeFileSync(jalurEntri, entriDenganReact);

  await build({
    entryPoints: [jalurEntri],
    outfile: jalurKeluar,
    bundle: true,
    platform: "node",
    format: "cjs",
    loader: { ".jsx": "jsx", ".js": "js" },
    jsx: "automatic",
    // Entri ditulis di direktori sementara, jadi resolusi paket harus diarahkan
    // ke node_modules repo.
    absWorkingDir: AKAR,
    nodePaths: [path.join(AKAR, "node_modules")],
    logLevel: "silent",
  });

  const keluaran = execFileSync(process.execPath, [jalurKeluar], {
    cwd: AKAR,
    encoding: "utf8",
  });
  const { dialog, galatBiasa, tombolAnak } = JSON.parse(keluaran);

  console.log("Dialog batas permintaan (429):");
  uji("tampil sebagai dialog", /role="alertdialog"/.test(dialog));
  uji("memakai latar gelap transparan", /bg-slate-900\/40/.test(dialog));
  uji("memakai kelas pintu, bukan kelas lokal", /class="btn btn-(biasa|padat|rapat|ikon)/.test(dialog));
  uji("tombol coba lagi nonaktif selama hitungan mundur", /disabled=""[^>]*>Coba lagi/.test(dialog));
  uji("hitungan mundur terlihat", /Dapat dicoba lagi dalam 418 detik/.test(dialog));
  uji("tanpa bayangan", !/shadow-/.test(dialog));
  uji(
    "tanpa warna semantik",
    !/\b(?:bg|text|border|ring)-(?:red|rose|emerald|green|amber|yellow|orange|blue|sky|indigo|violet|purple|pink|teal|lime|cyan)-/.test(dialog)
  );

  console.log("\nGalat biasa tetap baris netral:");
  uji("bukan dialog", !/role="alertdialog"/.test(galatBiasa));
  uji("menampilkan pesan", /Periksa koneksi lalu coba lagi\./.test(galatBiasa));

  console.log("\nTeks tombol dari children:");
  uji("children dirender", /Coba Lagi/.test(tombolAnak), "teks hilang, tombol kosong");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal) process.exit(1);
