/**
 * Uji DOKUMENTASI Analisa — README harus sama dengan kenyataan.
 *
 * Latar belakang (temuan F-11 pada audit modul Analisa): `README.md` sempat
 * menulis 384 pemeriksaan anti-cheat padahal kenyataannya 426, dan menyebut
 * kunci cache `kci-anticheat-cache-v2` padahal kodenya sudah `v6`. Dokumen yang
 * menyimpang lebih berbahaya daripada tidak ada dokumen: pembaca berikutnya
 * memakai angka itu sebagai dasar keputusan.
 *
 * Skrip ini membaca SEMUA angka yang diklaim README, menjalankan ulang
 * rangkaian ujinya, lalu membandingkan:
 *
 *   1. setiap baris tabel `| `uji-x.mjs` | … | N |` (tabel "Bekukan fitur
 *      Analisa v1" dan tabel baseline) — N harus sama dengan keluaran skrip;
 *   2. baris `**Total**` dan kalimat "N pemeriksaan" — harus sama dengan
 *      jumlah 18 skrip `uji:analisa-menyeluruh`;
 *   3. versi `KUNCI_SIMPANAN_CACHE` di `akun/antiCheatRiwayat.js` harus
 *      tercantum di README;
 *   4. jumlah kunci `uji-i18n` ("N kunci ID") harus sama dengan klaim.
 *
 * Jalankan: `npm run uji:dokumentasi` (±1 menit — ia benar-benar menjalankan
 * semua suite yang angkanya diklaim). Keluar 1 bila ada satu saja yang
 * menyimpang.
 */
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const README = path.join(AKAR, "src/halaman/Analisa/README.md");
const ANTICHEAT_RIWAYAT = path.join(AKAR, "src/halaman/Analisa/akun/antiCheatRiwayat.js");

const isi = readFileSync(README, "utf8");
const baris = isi.split("\n");

/* --------------------------------------------------------------- pemetik */

/**
 * Baris tabel angka:
 *   | `uji-x.mjs` | 63 |                    (tabel baseline, dua kolom)
 *   | `scripts/uji-x.mjs` | keterangan | 63 | (tabel suite, tiga kolom)
 */
const RE_BARIS_TABEL = /^\|\s*`(?:(?:scripts|src)\/)*(uji-[a-z0-9-]+\.mjs)`\s*\|(?:[^|]*\|)?\s*(\d+)\s*\|\s*$/;

/** klaim -> [{ skrip, angka, baris }] */
const klaim = new Map();
for (let i = 0; i < baris.length; i++) {
  const cocok = baris[i].match(RE_BARIS_TABEL);
  if (!cocok) continue;
  const [, skrip, angkaTeks] = cocok;
  const angka = Number(angkaTeks);
  if (!klaim.has(skrip)) klaim.set(skrip, []);
  klaim.get(skrip).push({ angka, baris: i + 1 });
}

const ambilPola = (pola) => {
  const cocok = isi.match(pola);
  return cocok ? Number(cocok[1]) : null;
};

const totalDiklaim = ambilPola(/\|\s*\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|/);
const kalimatTotal = ambilPola(/(\d+)\s+pemeriksaan,\s*0\s+gagal/);

/* Rangkaian resmi: urutan di package.json `uji:analisa-menyeluruh`. */
const paket = JSON.parse(readFileSync(path.join(AKAR, "package.json"), "utf8"));
const rangkaian = paket.scripts["uji:analisa-menyeluruh"]
  .split("&&")
  .map((bagian) => bagian.trim().replace(/^node\s+scripts\//, ""))
  .filter(Boolean);

/* ------------------------------------------------------------- penjalan */

const jalankan = (skrip) => {
  const mulai = Date.now();
  const hasil = spawnSync(process.execPath, [path.join(AKAR, "scripts", skrip)], {
    cwd: AKAR,
    encoding: "utf8",
    timeout: 10 * 60 * 1000,
  });
  const keluaran = `${hasil.stdout ?? ""}${hasil.stderr ?? ""}`;
  const semua = [...keluaran.matchAll(/(\d+)\s+(?:pemeriksaan\s+lulus|lulus)/g)];
  return {
    angka: semua.length ? Number(semua[semua.length - 1][1]) : null,
    kode: hasil.status,
    ms: Date.now() - mulai,
    ekor: keluaran.trim().split("\n").slice(-1)[0] ?? "",
  };
};

let gagal = 0;
const lapor = (ok, teks) => {
  if (ok) {
    console.log(`  ✓ ${teks}`);
  } else {
    gagal++;
    console.error(`  ✗ ${teks}`);
  }
};

console.log(`== dokumentasi vs kenyataan (${klaim.size} skrip) ==`);
const terukur = new Map();
for (const skrip of [...klaim.keys()].sort()) {
  const { angka, kode, ms } = jalankan(skrip);
  terukur.set(skrip, angka);
  if (angka === null) {
    lapor(false, `${skrip} — tidak ada keluaran angka (exit ${kode})`);
    continue;
  }
  for (const { angka: klaimAngka, baris: nomorBaris } of klaim.get(skrip)) {
    lapor(
      klaimAngka === angka,
      `${skrip} — README ${klaimAngka} (baris ${nomorBaris}) vs nyata ${angka}` +
        (klaimAngka === angka ? ` (${ms} ms)` : ` — SELISIH ${angka - klaimAngka}`)
    );
  }
}

/* ----------------------------------------------------------------- total */

console.log("\n== total rangkaian uji:analisa-menyeluruh ==");
let jumlah = 0;
let totalTakLengkap = false;
for (const skrip of rangkaian) {
  const angka = terukur.get(skrip) ?? jalankan(skrip).angka;
  if (angka === null) {
    totalTakLengkap = true;
    lapor(false, `${skrip} — angka tidak terbaca, total tidak bisa dihitung`);
    continue;
  }
  jumlah += angka;
}
if (totalDiklaim !== null && !totalTakLengkap) {
  lapor(totalDiklaim === jumlah, `baris **Total** README ${totalDiklaim} vs nyata ${jumlah}`);
} else if (totalDiklaim === null) {
  lapor(false, "README tidak memuat baris `**Total**` di tabel baseline");
}
if (kalimatTotal !== null && !totalTakLengkap) {
  lapor(kalimatTotal === jumlah, `kalimat "${kalimatTotal} pemeriksaan" vs nyata ${jumlah}`);
}

/* ------------------------------------------------------------ kunci cache */

console.log("\n== kunci cache anti-cheat ==");
const sumberRiwayat = readFileSync(ANTICHEAT_RIWAYAT, "utf8");
const kunciNyata = sumberRiwayat.match(/KUNCI_SIMPANAN_CACHE\s*=\s*"([^"]+)"/)?.[1] ?? null;
if (!kunciNyata) {
  lapor(false, `${path.relative(AKAR, ANTICHEAT_RIWAYAT)} tidak memuat KUNCI_SIMPANAN_CACHE`);
} else {
  const disebut = isi.match(new RegExp(kunciNyata, "g")) ?? [];
  lapor(
    disebut.length > 0,
    `README memuat "${kunciNyata}" (${disebut.length}×)` +
      (disebut.length ? "" : " — kunci lama masih tertulis di dokumen")
  );
  const asing = [...isi.matchAll(/kci-anticheat-cache-v\d+/g)]
    .map((m) => m[0])
    .filter((k) => k !== kunciNyata);
  lapor(
    asing.length === 0,
    asing.length === 0
      ? "tidak ada versi kunci cache yang basi di README"
      : `README masih menyebut versi lain: ${[...new Set(asing)].join(", ")}`
  );
}

/* -------------------------------------------------------------- i18n */

console.log("\n== jumlah kunci i18n ==");
{
  const hasil = spawnSync(process.execPath, [path.join(AKAR, "scripts/uji-i18n.mjs")], {
    cwd: AKAR,
    encoding: "utf8",
  });
  const keluaran = `${hasil.stdout ?? ""}${hasil.stderr ?? ""}`;
  const nyata = Number(keluaran.match(/(\d+)\s+kunci ID/)?.[1] ?? NaN);
  const diklaim = ambilPola(/`uji-i18n`\s*\(?(\d+)\s+kunci/) ?? ambilPola(/(\d+)\s+kunci ID =/);
  if (Number.isNaN(nyata)) {
    lapor(false, "uji-i18n tidak mengeluarkan jumlah kunci");
  } else if (diklaim === null) {
    lapor(false, "README tidak menyebut jumlah kunci i18n");
  } else {
    lapor(diklaim === nyata, `README ${diklaim} kunci vs nyata ${nyata}`);
  }
}

console.log("");
if (gagal === 0) {
  console.log(`OK — dokumentasi cocok dengan kenyataan (${klaim.size} skrip + total + cache + i18n).`);
} else {
  console.error(`GAGAL — ${gagal} klaim di README tidak cocok dengan kenyataan.`);
  process.exitCode = 1;
}
