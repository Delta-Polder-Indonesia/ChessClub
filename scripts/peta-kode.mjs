#!/usr/bin/env node
/**
 * Peta kode & alur uji KCI — SATU sumber arah untuk audit.
 *
 * Mengapa ada: berkas panduan per-folder tidak bisa dijaga (125 folder × cermin
 * `.agents`/`.opencode` = ratusan berkas yang akan basi dalam hitungan hari).
 * Peta ini sebaliknya: seluruhnya diturunkan dari keadaan repo yang sebenarnya
 * (struktur folder, `package.json`, peta navigasi terkurasi), lalu dijaga agar
 * tidak pernah menyimpang dari kenyataan oleh `npm run uji:peta`.
 *
 * Keluaran: `docs/PETA-KODE.md` (deterministik — tanpa tanggal, semua urut).
 * Turunan: jalankan `npm run peta`.
 *
 * Fungsi `bangunPeta()` sengaja diekspor agar penjaga (`scripts/uji-peta.mjs`)
 * bisa membandingkan berkas di disk dengan hasil generate tanpa menulis apa pun.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BERKAS_KELUARAN = "docs/PETA-KODE.md";

/** Folder yang dipetakan: area tempat orang (dan agen) biasanya tersesat. */
const AREA = [
  "src/halaman",
  "src/components",
  "src/lib",
  "src/lib/api",
  "src/hooks",
  "src/data",
  "src/asets",
  "server/src",
  "server/uji",
  "api",
  "plugins",
  "db",
  "data",
  "scripts",
  "tests/e2e",
  "public",
];

const baca = (relatif) => readFileSync(path.join(ROOT, relatif), "utf8");

/**
 * Daftar berkas yang DILACAK git. Penting agar peta deterministik: uji backend
 * menulis state runtime di dalam repo (mis. `data/rahasia/`, `data/riwayat-masuk.json`)
 * yang diabaikan git — kalau ikut dihitung, jumlah berkas berbeda antara mesin
 * pengembang (sudah menjalankan uji) dan checkout bersih di CI, sehingga
 * `uji:peta` gagal membandingkan peta yang seharusnya sama.
 */
let singgahanTerlacak;
function berkasTerlacak() {
  if (singgahanTerlacak !== undefined) return singgahanTerlacak;
  try {
    singgahanTerlacak = execFileSync("git", ["ls-files", "-z"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\0")
      .filter(Boolean);
  } catch {
    singgahanTerlacak = null; // tanpa git (mis. di dalam build): pakai filesystem
  }
  return singgahanTerlacak;
}

/** Daftar berkas (rekursif) di dalam satu folder, relatif terhadap ROOT. */
function berkasDalam(folder) {
  const terlacak = berkasTerlacak();
  if (terlacak) {
    const awalan = `${folder.replace(/\/$/, "")}/`;
    return terlacak.filter((f) => f.startsWith(awalan)).sort();
  }
  const akar = path.join(ROOT, folder);
  if (!existsSync(akar)) return [];
  const hasil = [];
  const tumpuk = [akar];
  while (tumpuk.length) {
    const kini = tumpuk.pop();
    for (const nama of readdirSync(kini)) {
      const penuh = path.join(kini, nama);
      const st = statSync(penuh);
      if (st.isDirectory()) tumpuk.push(penuh);
      else hasil.push(path.relative(ROOT, penuh).split(path.sep).join("/"));
    }
  }
  return hasil.sort();
}

/** Semua berkas uji (relatif) beserta isinya, dibaca sekali agar murah. */
export function berkasUji() {
  const kandidat = [
    ...berkasDalam("scripts").filter((f) => /\/uji-.*\.mjs$/.test(`/${f}`)),
    ...berkasDalam("server/uji").filter((f) => /\/uji-.*\.mjs$/.test(`/${f}`)),
    ...berkasDalam("tests/e2e").filter((f) => f.endsWith(".spec.js")),
  ];
  return kandidat
    .sort()
    .map((relatif) => ({ relatif, isi: baca(relatif) }));
}

/** Skrip npm yang memanggil setiap berkas uji (nama berkas → daftar skrip). */
export function petaSkripUji() {
  const skrip = JSON.parse(baca("package.json")).scripts;
  const peta = new Map();
  const tambah = (berkas, nama) => {
    if (!peta.has(berkas)) peta.set(berkas, []);
    if (!peta.get(berkas).includes(nama)) peta.get(berkas).push(nama);
  };
  for (const nama of Object.keys(skrip).sort()) {
    for (const bagian of skrip[nama].split(/&&|\|\|/)) {
      const cocok = bagian.match(/(?:scripts|server\/uji|tests\/e2e)\/([\w.-]+\.(?:mjs|js))/);
      if (cocok) {
        tambah(cocok[1], nama);
        continue;
      }
      // `playwright test` tidak menyebut nama berkas: ia menjalankan seluruh
      // tests/e2e/*.spec.js, jadi spesifikasi di folder itu dianggap dipanggil.
      if (/playwright\s+test/.test(bagian)) {
        for (const spesifikasi of berkasDalam("tests/e2e")) {
          if (spesifikasi.endsWith(".spec.js")) tambah(spesifikasi.split("/").pop(), nama);
        }
      }
    }
  }
  return peta;
}

/** Uji yang menyentuh sebuah area: berkas uji yang menyebut jalurnya. */
export function ujiUntukArea(namaArea, daftarUji, berkasArea) {
  const penanda = [namaArea, ...berkasArea.map((b) => b.split("/").pop()).filter(Boolean)];
  if (berkasArea.length > 60) penanda.length = 1; // area besar: cukup cocokkan jalurnya
  return daftarUji
    .filter((u) => penanda.some((p) => u.isi.includes(`${p}/`) || u.isi.includes(`"${p}"`)))
    .map((u) => u.relatif)
    .sort();
}

/** Halaman peta yang mencakup sebuah area (cocokkan awalan jalur). */
export function halamanUntukArea(namaArea, halaman) {
  return halaman
    .filter((p) => (p.key_files || []).some((f) => f.replace(/\/$/, "").startsWith(namaArea)))
    .map((p) => p.title);
}

/** Susun isi `docs/PETA-KODE.md` — deterministik, tanpa tanggal. */
export function bangunPeta() {
  const skrip = JSON.parse(baca("package.json")).scripts;
  const navigasi = JSON.parse(baca("docs/roadmap/documentation-roadmap.json"));
  const halaman = navigasi.pages;
  const daftarUji = berkasUji();
  const petaUji = petaSkripUji();

  const baris = [];
  baris.push("# Peta Kode & Alur Uji");
  baris.push("");
  baris.push("Berkas ini DI-GENERATE dari keadaan repo (struktur folder, `package.json`,");
  baris.push("`docs/roadmap/documentation-roadmap.json`). Jangan disunting manual:");
  baris.push("jalankan `npm run peta` untuk membangkitkan ulang, dan `npm run uji:peta`");
  baris.push("untuk memeriksa bahwa peta ini tidak menyimpang dari kenyataan.");
  baris.push("");
  baris.push("Cara pakai saat audit: cari nama folder/berkas yang Anda curigai di tabel");
  baris.push("\"Peta area\" → lihat kolom \"uji penjaga\" → jalankan perintah di kolom itu.");
  baris.push("");

  /* ---------- 1. Alur uji utama ---------- */
  baris.push("## 1. Alur uji utama");
  baris.push("");
  const rantai = (skrip.uji || "").split("&&").map((s) => s.trim()).filter(Boolean);
  baris.push("`npm run uji` menjalankan rangkaian berikut secara berurutan (berhenti di");
  baris.push("kegagalan pertama karena dirangkai dengan `&&`):");
  baris.push("");
  rantai.forEach((perintah, i) => {
    const nama = perintah.replace(/^npm run /, "");
    baris.push(`${i + 1}. \`${perintah}\`${skrip[nama] ? "" : " (langsung)"}`);
  });
  baris.push("");
  const diLuar = Object.keys(skrip)
    .filter((n) => n.startsWith("uji") && n !== "uji" && !rantai.includes(`npm run ${n}`))
    .sort();
  baris.push("Skrip uji di luar rantai di atas (dijalankan terpisah / oleh CI):");
  baris.push("");
  for (const nama of diLuar) baris.push(`- \`npm run ${nama}\` → \`${skrip[nama]}\``);
  baris.push("");

  /* ---------- 2. Berkas uji → skrip npm ---------- */
  baris.push("## 2. Berkas uji dan siapa yang menjalankannya");
  baris.push("");
  baris.push("| Berkas uji | Dijalankan oleh |");
  baris.push("| --- | --- |");
  for (const u of daftarUji) {
    const nama = u.relatif.split("/").pop();
    const pemanggil = petaUji.get(nama) || [];
    baris.push(`| \`${u.relatif}\` | ${pemanggil.length ? pemanggil.map((p) => `\`npm run ${p}\``).join(", ") : "**tidak dipanggil skrip npm mana pun**"} |`);
  }
  baris.push("");

  /* ---------- 3. Peta area ---------- */
  baris.push("## 3. Peta area");
  baris.push("");
  baris.push("| Area | Berkas | Uji penjaga | Halaman peta |");
  baris.push("| --- | --- | --- | --- |");
  for (const area of AREA) {
    if (!existsSync(path.join(ROOT, area))) continue;
    const berkasArea = berkasDalam(area);
    const uji = ujiUntukArea(area, daftarUji, berkasArea);
    const hlm = halamanUntukArea(area, halaman);
    const daftarUjiTeks = uji.length
      ? uji.slice(0, 4).map((u) => `\`${u.split("/").pop()}\``).join(", ") + (uji.length > 4 ? `, +${uji.length - 4}` : "")
      : "—";
    const daftarHlm = hlm.length
      ? hlm.slice(0, 3).join("; ") + (hlm.length > 3 ? `, +${hlm.length - 3}` : "")
      : "—";
    baris.push(`| \`${area}\` | ${berkasArea.length} | ${daftarUjiTeks} | ${daftarHlm} |`);
  }
  baris.push("");

  /* ---------- 4. Cermin ---------- */
  baris.push("## 4. Cermin yang dijaga `uji:peta`");
  baris.push("");
  baris.push("- `.agents/skills/**` ⇄ `.opencode/skills/**` (isi identik, byte per byte).");
  baris.push("- `quality.yml` (root) ⇄ `.github/workflows/quality.yml` (mulai baris `name:`).");
  baris.push("- `.devin/wiki.json` ⇄ `docs/roadmap/documentation-roadmap.json` (jumlah halaman,");
  baris.push("  `key_files`, dan `keywords` per indeks sama).");
  baris.push("- Berkas ini ⇄ hasil `npm run peta`.");
  baris.push("");
  baris.push("## 5. Aturan yang ditegakkan `uji:peta`");
  baris.push("");
  baris.push("1. Setiap `key_files` di peta navigasi benar-benar ada di repo.");
  baris.push("2. Setiap skrip `uji:*` di `package.json` tercatat di skill `kci-pengujian`.");
  baris.push("3. Setiap berkas uji dipanggil minimal satu skrip npm (tidak ada uji yatim).");
  baris.push("4. Setiap folder di `src/halaman/` terdaftar di peta navigasi.");
  baris.push("5. Keempat cermin pada bagian 4 tetap sinkron.");
  baris.push("6. Frontmatter setiap `SKILL.md` memenuhi syarat pemuatan opencode: `name` sama dengan nama");
  baris.push("   folder, `description` 1–1024 karakter tanpa `\": \"`, dan `metadata` peta string ke string.");
  baris.push("");
  return baris.join("\n");
}

/* Jalankan sebagai skrip: tulis berkasnya. */
const dijalankanLangsung =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (dijalankanLangsung) {
  const { writeFileSync } = await import("node:fs");
  const isi = bangunPeta();
  const tujuan = path.join(ROOT, BERKAS_KELUARAN);
  const lama = existsSync(tujuan) ? readFileSync(tujuan, "utf8") : null;
  writeFileSync(tujuan, isi, "utf8");
  console.log(
    lama === isi
      ? `${BERKAS_KELUARAN} sudah sinkron (${isi.split("\n").length} baris).`
      : `${BERKAS_KELUARAN} ditulis ulang (${isi.split("\n").length} baris).`
  );
}
