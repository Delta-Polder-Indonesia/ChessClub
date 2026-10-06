/* ============================================================
 * SEMENTARA — diagnostik kegagalan gerbang rilis khusus CI (PR #172).
 *
 * Latar: langkah "Run the v1 release gate" gagal ±2 dtk di Actions (4×),
 * padahal gerbang yang sama lulus penuh (exit 0) di lingkungan lokal.
 * Log blob Actions tidak terjangkau dari agen, maka tiap tahap dibungkus
 * skrip ini: perintah dijalankan lewat shell, keluarannya diteruskan,
 * dan RINGKASAN HASILNYA dipancarkan sebagai ANOTASI check-run (::notice::
 * /::error::) yang terbaca lewat API anotasi GitHub.
 *
 * Pemakaian: node scripts/_diag-audit.mjs --tahap "<perintah shell>"
 * HAPUS BERKAS INI & kembalikan "uji:rilis:v1" setelah diagnosis selesai.
 * ============================================================
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const indeksPerintah = process.argv.indexOf("--tahap");
const perintah = indeksPerintah >= 0 ? process.argv[indeksPerintah + 1] : null;

if (!perintah) {
  console.log("::error::[diag-gerbang] dipanggil tanpa --tahap");
  process.exit(1);
}

let versiNpm = "?";
try {
  versiNpm = execFileSync("npm", ["--version"], { encoding: "utf8" }).trim();
} catch {
  /* biarkan "?" */
}

console.log(
  `::notice::[diag-gerbang] MULAI "${perintah}" node=${process.version} npm=${versiNpm} cwd=${process.cwd()} CI=${process.env.CI ?? "?"} runner=${process.env.RUNNER_OS ?? "?"}/${process.env.RUNNER_ARCH ?? "?"}`,
);

const mulai = Date.now();
const r = spawnSync(perintah, { shell: true, encoding: "utf8", timeout: 900000 });
const detik = ((Date.now() - mulai) / 1000).toFixed(1);

if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);

const potong = (s) =>
  String(s || "")
    .trim()
    .split("\n")
    .slice(-14)
    .join(" ⏎ ")
    .slice(0, 1600);

const ringkas = `HASIL "${perintah}" status=${String(r.status)} sinyal=${r.signal ?? "-"} err=${r.error?.message ?? "-"} ${detik}s | STDERR: ${potong(r.stderr) || "(kosong)"} | STDOUT(ekor): ${potong(r.stdout) || "(kosong)"}`;

if (r.status !== 0 || r.error) {
  console.log(`::error::[diag-gerbang] ${ringkas}`);
  process.exit(r.status ?? 1);
}
console.log(`::notice::[diag-gerbang] ${ringkas}`);
