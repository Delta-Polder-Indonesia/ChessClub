#!/usr/bin/env node
/**
 * Cadangan terkompresi data backend ke direktori privat di luar repo.
 *
 * Wajib set KCI_DIR_DATA dan KCI_DIR_BACKUP eksplisit agar data pribadi
 * tidak tanpa sengaja masuk folder proyek atau artefak CI.
 */
import { readdir, mkdir, chmod, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const sumberEnv = process.env.KCI_DIR_DATA;
const tujuanEnv = process.env.KCI_DIR_BACKUP;
if (!sumberEnv || !tujuanEnv) {
  console.error("[backup] Set KCI_DIR_DATA dan KCI_DIR_BACKUP terlebih dahulu.");
  process.exit(1);
}

const sumber = path.resolve(sumberEnv);
const tujuan = path.resolve(tujuanEnv);
const relatif = path.relative(sumber, tujuan);
if (relatif === "" || (!relatif.startsWith("..") && !path.isAbsolute(relatif))) {
  console.error("[backup] KCI_DIR_BACKUP harus berada di luar KCI_DIR_DATA.");
  process.exit(1);
}

try {
  if (!(await stat(sumber)).isDirectory()) throw new Error("bukan direktori");
} catch {
  console.error(`[backup] Direktori data tidak dapat dibaca: ${sumber}`);
  process.exit(1);
}

await mkdir(tujuan, { recursive: true, mode: 0o700 });
const capWaktu = new Date().toISOString().replace(/[:.]/g, "-");
const arsip = path.join(tujuan, `kci-data-${capWaktu}.tar.gz`);
const hasil = spawnSync("tar", ["-czf", arsip, "-C", path.dirname(sumber), path.basename(sumber)], {
  stdio: "inherit",
});
if (hasil.error || hasil.status !== 0) {
  console.error("[backup] Gagal membuat arsip cadangan.");
  process.exit(1);
}
await chmod(arsip, 0o600);

const retensi = Math.max(1, Number.parseInt(process.env.KCI_RETENSI_BACKUP || "14", 10) || 14);
const arsipLama = (await readdir(tujuan, { withFileTypes: true }))
  .filter((item) => item.isFile() && /^kci-data-.*\.tar\.gz$/.test(item.name))
  .map(async (item) => ({ path: path.join(tujuan, item.name), waktu: (await stat(path.join(tujuan, item.name))).mtimeMs }));
const urut = (await Promise.all(arsipLama)).sort((a, b) => b.waktu - a.waktu);
await Promise.all(urut.slice(retensi).map(({ path: file }) => unlink(file)));

console.log(`[backup] Selesai: ${path.basename(arsip)} (retensi ${retensi} arsip).`);
