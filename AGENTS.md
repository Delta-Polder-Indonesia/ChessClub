# Agent Engineering Policy

## Authority

User instructions are the highest-priority project-specific authority.
Skills provide guidance; they do not grant permission to change scope, rewrite unrelated code, delete files, or alter existing behavior.

## Required workflow

1. Understand the user's exact request.
2. Inspect the relevant existing code, configuration, and tests before editing.
3. Classify the requested change by scope and risk before editing.
4. For medium, large, or risky changes, state the intended scope and plan and wait for explicit user approval before editing.
5. Change only what is necessary to satisfy the request.
6. Preserve existing features, APIs, UI behavior, data flow, and working code unless the user explicitly asks for a change.
7. Validate the changed area with the smallest relevant checks.
8. Report exactly what changed, what was verified, and any remaining issue.

## Scope and approval gate

- The agent may analyze, inspect, search, diagnose, and propose changes without waiting for approval.
- A clear, local, low-risk change may proceed after the relevant files and behavior have been inspected.
- A medium-scope change requires a short plan and explicit user approval before editing. Examples include changes across several files, meaningful behavior changes, or changes that affect an existing feature beyond a local fix.
- A large or risky change requires explicit approval before editing. Examples include architecture changes, database/schema changes, API contract changes, dependency changes, file deletion, history rewriting, mass replacement, or changes that may affect unrelated features.
- When approval is required, the agent must stop after presenting the plan. It must not begin editing, committing, pushing, or merging until the user approves.
- Discovering an unrelated issue does not authorize fixing it. Report it separately unless the user expands the scope.
- If the requested scope is unclear and different interpretations would change behavior or affected files, ask before editing.
- Approval for one task does not automatically authorize additional improvements discovered during implementation.

## Scope control

- Do not proactively refactor, redesign, rename, reorganize, optimize, or modernize unrelated code.
- Do not fix unrelated issues merely because they are discovered during the task.
- Do not add dependencies, files, abstractions, or features unless they are required by the user's request or explicitly approved.
- Do not replace working implementations with a preferred alternative without user approval.
- Prefer minimal, targeted diffs over broad rewrites.
- Do not change existing features or behavior merely to make code cleaner, more modern, or more consistent unless that change is requested.

## Analysis before action

- Do not edit blindly.
- First identify the relevant files and understand their current behavior.
- For bug fixes, identify the likely cause and verify it against the code before changing it.
- For multi-file changes, identify each file that will be changed and its purpose before editing.
- If the request is ambiguous in a way that could change scope or behavior, ask before making that change. Otherwise proceed with the narrowest reasonable interpretation.

## Skill invocation

- Skills are scoped tools, not global instructions.
- Use a skill only when its purpose directly matches the user's request.
- Prefer explicit invocation for documentation, archival, recording, publishing, and other side-effect-heavy skills.
- A skill must never be interpreted as permission to perform destructive or unrelated actions.
- If a skill conflicts with this policy or the user's instruction, follow the higher-priority instruction and keep the scope minimal.

## Destructive operations

Deletion, irreversible data changes, history rewriting, mass replacement, and changes outside the requested scope require explicit user approval unless the user directly requested that exact destructive action.

## Code quality

- Preserve existing conventions unless they are part of the requested change.
- Avoid speculative abstractions and AI-generated filler.
- Keep comments and documentation concise and useful.
- Do not expose hidden chain-of-thought or internal reasoning; provide concise conclusions, evidence, and verification results instead.

## Completion standard

A task is complete only when the requested change is implemented and the relevant validation has been run or its limitation is clearly reported.

## Protokol pikir-dulu (wajib sebelum setiap aksi)

1. **Pahami** — rumuskan tujuan dalam satu kalimat; temukan berkas yang tepat dengan mencari, bukan menebak.
2. **Baca sebelum menulis** — buka setiap berkas yang akan diubah (beserta pemanggil/ujiannya) sebelum menyunting.
   Dilarang mengedit berdasarkan asumsi tentang isi berkas.
3. **Rencanakan** — untuk perubahan non-trivial, sampaikan rencana 2–4 kalimat (berkas, pendekatan, cara verifikasi)
   sebelum mengeksekusi. Jika perubahan masuk kategori medium, besar, atau berisiko, tunggu persetujuan eksplisit pengguna
   sebelum menyunting. Keraguan yang mengubah cakupan → tanya dulu (lihat "Analysis before action").
4. **Eksekusi terkecil** — diff seminimal mungkin yang memenuhi permintaan; tanpa perbaikan ikutan di luar cakupan.
5. **Verifikasi** — jalankan pemeriksaan minimum yang relevan (lihat skill `kci-pengujian`); jangan klaim berhasil
   tanpa bukti (perintah yang dijalankan dan hasilnya).
6. **Laporkan faktual** — apa yang berubah, apa yang diverifikasi, apa yang tersisa. Tanpa basa-basi,
   tanpa pujian diri, tanpa janji berlebih.

## Gaya keluaran (anti "AI slop")

- **Tanpa emoji** — di kode, UI/copy halaman, commit message, maupun dokumen. Emoji bukan bagian desain KCI.
- Setiap kalimat membawa informasi; tanpa kalimat pengisi ("Great question!", "Semoga membantu!", pujian kosong).
- UI mengikuti bahasa desain di skill `kci-frontend`: flat, satu aksen, border tipis, copy faktual —
  bukan gradien, glow, atau kartu berlebihan.
- Ketidakpastian dinyatakan eksplisit ("belum diverifikasi", "perlu konfirmasi") — jangan mengarang fakta,
  versi, atau nama berkas.

## Skill proyek (SKILL.md)

Skill panduan proyek ini ada di `.agents/skills/` dan diduplikasi ke `.opencode/skills/`
(isi identik; opencode membaca keduanya). Muat skill sesuai area kerja:

| Skill | Muat saat |
| ----- | --------- |
| `kci-frontend` | mengubah `src/`, `index.html`, `vite.config.js`, atau `public/` |
| `kci-backend` | mengubah `server/`, `api/`, `db/`, atau alur data/auth backend |
| `kci-pengujian` | menyelesaikan perubahan apa pun, menambah uji, atau menyelidiki CI merah |
| `kci-deploy` | mengubah `vercel.json`, workflow CI, atau env var Vercel |

Sebelum menelusuri repo secara manual: jalankan `npm run peta`. Perintah itu menulis
`docs/PETA-KODE.md` (area → berkas → uji penjaga → halaman peta navigasi, serta berkas uji →
skrip npm yang menjalankannya) dan menjawab "alur uji ini kemana" tanpa menebak. Jangan
membuat berkas panduan per-folder: `npm run uji:peta` menjaga peta ini tetap akurat, dan
berkas panduan yang tersebar tidak punya penjaga seperti itu. Rincian per area ada di
`.agents/skills/kci-pengujian/references/alur-uji-per-area.md`.

Catatan: panduan proyek lain (Better Auth, DSH/DeepSeek Harness) sudah dihapus dari repo.
Jangan mengikuti dokumen lama yang menyebut SvelteKit, Better Auth, MongoDB, atau OpenRouter —
bukan bagian dari proyek ini.

## Sandbox Arena: CDN Playwright diblokir (workaround e2e)

Jaringan sandbox agent (Arena/e2b) hanya mengizinkan `registry.npmjs.org`.
Host lain diblokir: `cdn.playwright.dev`, `deb.debian.org`, `api.chess.com`,
`cdn.npmmirror.com`, `storage.googleapis.com`. Akibatnya
`npx playwright install chromium` SELALU gagal (ECONNRESET sebelum TLS),
termasuk lewat `PLAYWRIGHT_DOWNLOAD_HOST` mirror atau paket
`playwright-chromium` (postinstall-nya memakai CDN yang sama).

Workaround yang TERBUKTI berfungsi (semua di luar repo, tanpa mengubah
konfigurasi proyek):

1. `npm install --no-save --ignore-scripts @sparticuz/chromium`
   — binari Chromium ikut di dalam tarball npm (sekitar 67 MB), tidak butuh CDN.
2. Ekstrak binari: `node -e "import('@sparticuz/chromium').then(m => m.default.executablePath()).then(console.log)"`
   — menghasilkan `/tmp/chromium` (Chromium 153, kompatibel dengan Playwright 1.62 yang mengharapkan 151).
3. Binari butuh `libnss3`/`libnspr4`/`libnssutil3` yang tidak ada di image.
   Library-nya tersedia DI PAKET YANG SAMA: ekstrak `node_modules/@sparticuz/chromium/bin/al2023.tar.br`
   (brotli, mis. `zlib.brotliDecompressSync`) lalu `tar -xf` ke `/tmp/chromium-libs`.
   Jalankan Chromium dengan `LD_LIBRARY_PATH=/tmp/chromium-libs`.
4. Daftarkan ke Playwright lewat cache registry (nama folder mengikuti
   `node_modules/playwright-core/browsers.json`; untuk 1.62.x revisi `1234`):
   - `~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`
   - `~/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`
   Keduanya = skrip wrapper (chmod +x):
   `#!/bin/sh` + `export LD_LIBRARY_PATH=/tmp/chromium-libs:$LD_LIBRARY_PATH` + `exec /tmp/chromium "$@"`.
   Buat juga berkas penanda `INSTALLATION_COMPLETE` (kosong) di
   `~/.cache/ms-playwright/chromium-1234/` dan `.../chromium_headless_shell-1234/`.
5. `npx playwright test` lalu berjalan normal (webServer vite dev dijalankan
   sendiri oleh config; semua API di-mock `page.route` sehingga backend tidak
   perlu hidup).

Di mesin pengguna/CI biasa cukup `npx playwright install` — workaround ini
hanya untuk sandbox yang CDN-nya diblokir. Jangan commit `@sparticuz/chromium`
ke `package.json` (pakai `--no-save`).

## roadmap ( projeck kci )

docs/roadmap/documentation-roadmap.json