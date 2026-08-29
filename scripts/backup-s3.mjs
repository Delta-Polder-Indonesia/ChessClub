#!/usr/bin/env node
/**
 * Cadangan data ke S3 / R2 / B2 yang kompatibel AWS CLI.
 *
 * 1. Membuat arsip lokal lewat logika yang sama dengan backup-data.mjs
 *    (butuh KCI_DIR_DATA + KCI_DIR_BACKUP).
 * 2. Unggah dengan `aws s3 cp` bila AWS CLI tersedia.
 *
 * Env:
 *   KCI_DIR_DATA, KCI_DIR_BACKUP   — wajib (arsip lokal)
 *   KCI_S3_URI                     — contoh s3://bucket/kci/  (wajib untuk unggah)
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION
 *   KCI_RETENSI_BACKUP             — jumlah arsip lokal (bawaan 30)
 *
 * Tidak menambah dependensi npm (aws-sdk). Pasang AWS CLI di mesin/cron.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (!process.env.KCI_DIR_DATA || !process.env.KCI_DIR_BACKUP) {
  console.error("[backup-s3] Set KCI_DIR_DATA dan KCI_DIR_BACKUP.");
  process.exit(1);
}

process.env.KCI_RETENSI_BACKUP ||= "30";

const lokal = spawnSync(process.execPath, [path.join(AKAR, "scripts/backup-data.mjs")], {
  stdio: "inherit",
  env: process.env,
});
if (lokal.error || lokal.status !== 0) {
  process.exit(lokal.status || 1);
}

const tujuan = process.env.KCI_S3_URI;
if (!tujuan) {
  console.log("[backup-s3] KCI_S3_URI kosong — arsip lokal saja. Set s3://bucket/prefix/ untuk unggah.");
  process.exit(0);
}

const aws = spawnSync("aws", ["--version"], { encoding: "utf8" });
if (aws.error || aws.status !== 0) {
  console.error("[backup-s3] AWS CLI tidak ditemukan. Instal awscli atau unggah manual arsip di KCI_DIR_BACKUP.");
  process.exit(1);
}

const unggah = spawnSync("aws", ["s3", "cp", process.env.KCI_DIR_BACKUP, tujuan, "--recursive", "--exclude", "*", "--include", "kci-data-*.tar.gz"], {
  stdio: "inherit",
  env: process.env,
});
if (unggah.error || unggah.status !== 0) {
  console.error("[backup-s3] Gagal unggah ke", tujuan);
  process.exit(unggah.status || 1);
}

console.log("[backup-s3] Selesai unggah ke", tujuan);
console.log("[backup-s3] Pulihkan: aws s3 cp <objek> - | tar -xz -C /path/tujuan-parent");
