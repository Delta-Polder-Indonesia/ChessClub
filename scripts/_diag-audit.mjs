/* ============================================================
 * SEMENTARA — diagnostik kegagalan `npm audit` khusus CI (PR #172).
 *
 * Latar: langkah "Run the v1 release gate" gagal ±2 dtk di Actions (3×),
 * padahal gerbang yang sama lulus penuh (exit 0) di lingkungan lain.
 * Log blob Actions tidak terjangkau dari agen, jadi skrip ini menangkap
 * keluaran audit dan memancarkannya sebagai ANOTASI check-run (::error::)
 * yang terbaca lewat API anotasi GitHub. HAPUS BERKAS INI dan kembalikan
 * skrip "uji:rilis:v1" ke bentuk semula setelah diagnosis selesai.
 * ============================================================
 */
import { execFileSync, spawnSync } from "node:child_process";

function panggil(cmd, args) {
  return spawnSync(cmd, args, { encoding: "utf8", timeout: 180000 });
}

let versiNpm = "?";
try {
  versiNpm = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim();
} catch {
  /* biarkan "?" */
}

const r = panggil("npm", ["audit", "--omit=dev", "--audit-level=moderate"]);
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);

const potong = (s) =>
  String(s || "")
    .trim()
    .split("\n")
    .slice(-10)
    .join(" ⏎ ")
    .slice(0, 1200);

if (r.status !== 0 || r.error) {
  let probe = "ping tidak dijalankan";
  try {
    const p = panggil("npm", ["ping", "--registry=https://registry.npmjs.org"]);
    probe = `ping status=${p.status ?? "?"} ${potong(p.stderr) || "(tanpa stderr)"}`;
  } catch (e) {
    probe = `ping melempar: ${e.message}`;
  }
  console.log(
    `::error::[diag-gerbang] npm audit GAGAL status=${r.status ?? "?"} sinyal=${r.signal ?? "-"} err=${r.error?.message ?? "-"} | node=${process.version} npm=${versiNpm} | ${probe} | STDOUT: ${potong(r.stdout)} | STDERR: ${potong(r.stderr)}`,
  );
  process.exit(r.status ?? 1);
}

console.log("[diag-gerbang] npm audit lulus — melanjutkan rantai gerbang.");
