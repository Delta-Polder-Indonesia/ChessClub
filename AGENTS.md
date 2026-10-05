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
- Jangan sentuh `src/halaman/Landing/MaestroEdision.jsx`, `gayaTeks.jsx`, `server/`, atau aset
  `public/images/buku_tulis.webp` & `sekilas.webp` tanpa instruksi eksplisit.
- `src/halaman/ProgramKami/` sengaja di luar `AREA_KONTEN` guardrail desain — jangan tambahkan tanpa audit.
- Placeholder kontak `+62 61 123 4567` / `info@komunitascatur.or.id` adalah placeholder, bukan kontak asli.
- Progress bar Tonggak wajib merah (`text-[red]` / `border-[red]`).

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

## Commit dan push (berlaku di semua area)

Vercel terhubung ke repo ini: **setiap push memicu satu deployment**, dan deployment DITOLAK bila
penulis commit tidak cocok dengan akun GitHub yang punya akses proyek — commit-nya lalu bertanda
"Vercel — Deployment was blocked" dan pemilik proyek harus membersihkannya manual.

- **Jangan push kecuali pengguna menyuruh push.** Perbaikan kecil jangan langsung di-push:
  setiap push memicu redeploy dan mengganggu pengunjung yang sedang membuka situs. Kerjakan,
  verifikasi, lalu biarkan di working tree / commit lokal sampai ada perintah eksplisit push.
  Bila push akhirnya diizinkan, sisakan jeda minimal 5 jam sejak perubahan atau push terakhir.
- **Jangan menimpa identitas git.** `.git/config` sudah berisi identitas yang benar. Dilarang
  `git -c user.name=…`, `git -c user.email=…`, `git commit --author=…`, dan `GIT_AUTHOR_*`/
  `GIT_COMMITTER_*` beridentitas agen/bot.
- Sebelum push, pastikan `git log -1 --format='%an <%ae>'` menunjukkan identitas pemilik repo.
- Satu push per tugas selesai, bukan per commit. Jangan membuat cabang/PR tambahan tanpa diminta.
- Rincian dan cara memulihkan bila terlanjur: skill `kci-deploy`.

## Berkas sementara (wajib dihapus)

Shell di mesin ini adalah `cmd.exe`, yang tidak menerima teks panjang maupun tanda
`<` dan `>` langsung. Karena itu pesan commit, diff panjang, dan catatan hasil uji
sering harus ditulis ke berkas lebih dulu.

- Tulis hanya di `C:\Users\TRIANA~1\AppData\Local\Temp\opencode\`. Jangan pernah
  di dalam repo atau folder proyek.
- Pakai berkas itu untuk satu keperluan, lalu hapus di akhir langkah yang sama.
  Setelah selesai, folder itu harus kosong kembali.
- Kalau sebuah perintah gagal atau dihentikan di tengah dan meninggalkan log,
  hapus log itu, dan sebutkan di laporan kalau masih ada sisa yang tertinggal.
- Isi berkas sementara tidak pernah jadi sumber kebenaran. Kalau isinya masih
  dibutuhkan, pindahkan ke berkas yang benar dan ikut di-commit, jangan disisakan
  di Temp.

## Gaya keluaran (anti "AI slop")

- **Tanpa emoji** — di kode, UI/copy halaman, commit message, maupun dokumen. Emoji bukan bagian desain KCI.
- Setiap kalimat membawa informasi; tanpa kalimat pengisi ("Great question!", "Semoga membantu!", pujian kosong).
- UI mengikuti bahasa desain di skill `kci-frontend`: flat, satu aksen, border tipis, copy faktual —
  bukan gradien, glow, atau kartu berlebihan.
- Tipografi display: H1/H2 38–54px `font-serif font-light` di luar `.prose-kci`; subjudul di dalam
  `.prose-kci` 24px. Satu skala untuk semua halaman konten.
- `.font-serif` dipaksa `font-variant-numeric: lining-nums` (stack serif bawaan = Georgia/Cambria
  memakai oldstyle figures → angka seperti "5.486" tampak naik-turun).
- Ketidakpastian dinyatakan eksplisit ("belum diverifikasi", "perlu konfirmasi") — jangan mengarang faktua,
  versi, atau nama berkas.

## Konvensi kode & gotcha

- **Tombol navigasi:** `src/components/Tombol.jsx` — satu-satunya komponen tombol pintu.
  `<Tombol to="..." variant="garis|isi|terang">`. Jangan pakai `ui/button.jsx` untuk navigasi
  (itu untuk form/aksi).
- **i18n:** 2510 kunci, lebih dari 1.200 tidak terpakai (termasuk `t(\`...\`)` dinamis yang tidak
  terdeteksi uji). Jangan hapus kunci yatim — repo memang toleran.
- **Jangan jalankan `npm run uji` penuh lokal** (35 langkah, HDD penuh); CI adalah gerbang.
  Jalankan `uji:*` tertarget.
- **`gh` tidak terpasang** — verifikasi CI/GitHub lewat pengguna.
- **localhost tidak bisa diakses** untuk verifikasi visual — nyatakan eksplisit bila belum diverifikasi.
- Guardrail desain mengizinkan `text-[clamp(2.4rem,3.6vw,3.4rem)]` + `leading-[1.04]` sebagai kelas
  display kanonik — bukan pelanggaran.

## Peta cepat — jangan menebak lokasi berkas

Nama berkas dan identifier di repo ini berbahasa Indonesia, jadi mencari dengan kata kunci Inggris
("route", "auth", "storage", "test") sering meleset dan berakhir dengan penelusuran panjang. Pakai
peta yang sudah ada:

| Kebutuhan | Buka dulu |
| --------- | --------- |
| Peta area → berkas → uji penjaga → halaman peta | `docs/PETA-KODE.md` (bangkitkan dengan `npm run peta`) |
| Rute/halaman frontend | `src/App.jsx` (semua halaman dimuat malas) |
| Registrasi rute backend | `server/src/rute.js` |
| Kontrak validasi masukan | `server/src/skema.js` |
| Baca/tulis data (berkas JSON atau Supabase) | `server/src/simpanan.js` → `server/src/storage-supabase.js` |
| Modul aturan catur murni | `src/halaman/Analisa/mesin/*` |
| Teks antarmuka ID/EN | `src/lib/terjemahan/{id,en}/` |
| Primitif UI bersama | `src/components/ui/` + `RADIX-UI.md` |
| Perintah uji per topik | blok `"scripts"` di `package.json` (semua berawalan `uji`) |

Satu kali membaca `docs/PETA-KODE.md` hampir selalu lebih murah daripada rangkaian pencarian berkas.
Jangan membuat berkas peta/panduan baru per folder: berkas itu tidak punya penjaga, sehingga akan basi
dan menyesatkan.

## Skill proyek (SKILL.md)

Skill panduan proyek ini ada di `.agents/skills/` dan diduplikasi ke `.opencode/skills/`
(isi identik; opencode membaca keduanya). Muat skill sesuai area kerja:

| Skill | Muat saat |
| ----- | --------- |
| `kci-frontend` | mengubah `src/`, `index.html`, `vite.config.js`, atau `public/` |
| `kci-anti-slop` | membuat, mengubah, atau mengaudit UI; gunakan bersama `kci-frontend` sebagai filter larangan, bukan design system kedua |
| `kci-papan-interaktif` | mengubah halaman `/papan-interaktif` atau mode Analisa/Manusia vs Mesin/Latihan Repertoar |
| `kci-backend` | mengubah `server/`, `api/`, `db/`, atau alur data/auth backend |
| `kci-database` | mengubah `db/`, penyimpanan Supabase, `simpanan.js`, skema data, atau backup |
| `kci-pengujian` | menyelesaikan perubahan apa pun, menambah uji, atau menyelidiki CI merah |
| `kci-standar-kode` | menulis atau meninjau kode di area mana pun, dan sebelum PR dinyatakan siap |
| `kci-deploy` | mengubah `vercel.json`, workflow CI, env var Vercel, atau sebelum commit/push pertama (tiap push = satu deployment Vercel) |

Sebelum menelusuri repo secara manual: jalankan `npm run peta`. Perintah itu menulis
`docs/PETA-KODE.md` (area → berkas → uji penjaga → halaman peta navigasi, serta berkas uji →
skrip npm yang menjalankannya) dan menjawab "alur uji ini kemana" tanpa menebak. Jangan
membuat berkas panduan per-folder: `npm run uji:peta` menjaga peta ini tetap akurat, dan
berkas panduan yang tersebar tidak punya penjaga seperti itu. Rincian per area ada di
`.agents/skills/kci-pengujian/references/alur-uji-per-area.md`.

Cara opencode memuat skill (diverifikasi dari sumbernya, agar perubahan berikutnya tidak salah arah):

- Berkas yang discan: `.agents/skills/**/SKILL.md` dan `.opencode/skills/**/SKILL.md`. Keduanya dibaca,
  sehingga cermin di repo ini menghasilkan nama skill ganda — opencode menyimpan satu entri per nama
  (yang terakhir discan menang), jadi isi kedua salinan wajib tetap identik. Cermin dipertahankan karena
  `npm run uji:peta` menguncinya dan tool lain membaca `.opencode/`.
- `name` **wajib sama dengan nama folder** dan hanya boleh huruf kecil/angka dengan pemisah satu tanda
  hubung (`^[a-z0-9]+(-[a-z0-9]+)*$`).
- `description` wajib ada, 1–1024 karakter. Sebelum dimuat, agen hanya melihat `name` + `description`,
  jadi deskripsi harus memuat kata kunci pemicunya (nama folder, berkas, atau perintah uji).
- `metadata` (opsional) harus peta string ke string. Field frontmatter lain diabaikan opencode.
- Pemuatan skill **tidak** meminta izin secara bawaan: aturan bawaan opencode adalah `"*": "allow"`
  (hanya `doom_loop` dan `external_directory` yang `ask`). Berkas `opencode.json` di akar repo
  menegaskan izin itu, supaya config global yang lebih ketat tidak mengubah perilaku ini.

Jangan menaruh panduan yang hanya berguna sesekali di `AGENTS.md` — berkas ini dimuat di setiap sesi,
sedangkan skill dimuat saat dibutuhkan sesuai deskripsinya.

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

---

## STRUKTUR ARTIKEL STANDAR WEBSITE 

Gunakan gaya penulisan formal, analitis, dan bernuansa semi-akademik. Pembahasan harus disusun secara runtut, logis, dan mengalir dengan transisi yang halus antargagasan. Setiap paragraf perlu dikembangkan secara utuh sehingga tidak hanya menyampaikan informasi, tetapi juga menjelaskan hubungan, alasan, implikasi, atau konteks yang mendasarinya.

Tulisan harus menunjukkan kedalaman pemahaman terhadap topik yang dibahas. Hindari penjelasan yang terlalu dangkal, repetitif, atau sekadar mendefinisikan konsep tanpa elaborasi lebih lanjut. Apabila membahas suatu gagasan, jelaskan keterkaitannya dengan faktor penyebab, dampak, tujuan, fungsi, atau perspektif yang relevan sehingga pembahasan terasa lebih komprehensif dan bernilai analitis.

Nada tulisan harus menyerupai pembahasan dalam buku, esai edukatif, atau karya ilmiah populer yang ditulis secara matang dan reflektif. Gunakan bahasa yang jelas, presisi, dan intelektual tanpa menjadi terlalu teknis atau sulit dipahami.

Hindari pola penutup yang bersifat generik, mekanis, atau terasa seperti template. Jangan menggunakan frasa seperti “Pada akhirnya”, “Pada dasarnya”, “Secara keseluruhan”, “Dengan demikian”, “Oleh karena itu”, atau bentuk kesimpulan klise lainnya. Penutup harus muncul secara alami sebagai kelanjutan logis dari pembahasan sebelumnya, dengan kalimat yang menegaskan inti gagasan secara elegan, reflektif, dan menyatu dengan alur tulisan.

Fokus utama adalah menghasilkan tulisan yang terasa seperti hasil pemikiran manusia yang memahami topik secara mendalam, bukan sekadar rangkaian informasi yang disusun secara formal.

---

# No AI slop

You are a sharp human editor. Preserve the user's point and personal voice while making the writing clearer and more alive. Remove AI patterns without turning distinctive writing into generic polished prose.

## Two jobs

**Edit (default).** The user shares a draft to fix. Make the minimum effective edit with the rules below and return the edited draft plus a What changed section.

**Detect.** The user asks whether a piece is AI slop, or asks to audit, scan, or flag a draft without rewriting. Name each pattern from this skill that appears, quote the line, and give the fix in a few words. Do not rewrite, score the draft, or guess whether AI wrote it. AI detectors guess. Named patterns are evidence the user can check. Offer to edit the draft after.

## What to ask for

If the user has not provided a draft, ask them to paste it.

If the audience or format is unclear, ask one question: Who is this for and where will it be published?

If the goal is unclear, ask what the reader should think, feel, or do after reading it.

## Editing principles

- **Preserve the writer's real voice.** First notice the draft's vocabulary, cadence, bluntness, humor, uncertainty, digressions, and level of polish. Keep the traits that feel personal to the writer. Do not make every paragraph equally tidy or rewrite distinctive lines merely for consistency.
- **Make the minimum effective edit.** Fix AI patterns, errors, repetition, and unclear passages. Leave strong human sentences alone. A rough draft with a real voice should still sound like the same person after editing.
- **Lead with the point when the setup adds nothing.** Cut generic throat-clearing. Keep a personal aside, story, or admission when it creates context, tension, or character.
- **Front-load only when it improves clarity.** Put conclusions early when that helps the reader. Do not force every section and paragraph into the same point-detail-background shape.
- **Keep the user's meaning.** Don't invent claims, examples, stats, or opinions. If something is unclear, ask.
- **Open it up, don't dumb it down.** Keep the substance, nuance, and precision. Strip out only what makes it hard to read: jargon, long sentences, abstract nouns, and tangled structure.
- **Use active voice.** "The team shipped it Tuesday" beats "the decision emerged." Never let inanimate things do human verbs.
- **Make every sentence earn its place.** Cut empty qualifiers and throat-clearing. Keep phrases such as "I think," "maybe," or "to be honest" when they express real uncertainty, self-awareness, or the writer's spoken rhythm.
- **Untangle sentences without flattening the cadence.** Split sentences and paragraphs when they are genuinely hard to follow. Keep longer spoken sentences, fragments, and changes in pace when they are clear and characteristic of the writer.
- **Be concrete and specific.** Abstraction is where writing goes to die. "The integration improved efficiency" becomes "The integration cut deploy time from 40 minutes to 4." Names, numbers, dates, mechanisms, and examples beat abstractions.
- **Use the portability test.** If a sentence could move unchanged to another person, company, country, or product, it is probably filler. Cut it or replace it with a fact, example, mechanism, consequence, or judgment specific to this subject.
- **Always show, don't tell the reader what to think.** Make facts, actions, examples, and consequences carry the emphasis. Cut commentary that labels a point important, surprising, subtle, or obvious instead of demonstrating why. If the surrounding prose already shows the point, trust the reader and delete the commentary.
- **Protect the specific fact.** Don't smooth a useful detail into generic importance. "The tool significantly improves engineering productivity" becomes "The tool cut review time from 30 minutes to 8."
- **Make verbs do the work.** Replace weak verb phrases with direct verbs. "Made a decision" becomes "decided." "Has the ability to" becomes "can."
- **Know the job.** Before structure or word choice, know what the piece is trying to do and who it is for.
- **Preserve useful edge and character.** Keep strong opinions, blunt language, humor, profanity, self-interruptions, and honest admissions when they belong to the writer. Don't replace them with safer or more professional wording.
- **Keep structure unless it's hurting the piece.** Preserve the writer's progression and detours when they carry personality. If you reorganize, say why in the What changed section.

## Words to cut

Banned outright: delve, foster, leverage, utilize, facilitate, empower, streamline, robust, cutting-edge, paradigm shift, game changer, this is huge, this changes everything, tapestry, realm, beacon, multifaceted, meticulous, intricate, paramount, transformative, elevate, embark, supercharge, harness, ever-evolving.

Often-empty adverbs: just, literally, honestly, simply, actually, truly, fundamentally, importantly, crucially, inherently, inevitably. Cut them when they add nothing. Keep them when they carry emphasis, uncertainty, contrast, or the writer's natural spoken rhythm.

Often-empty phrases: it's worth noting, it's important to note, at the end of the day, when it comes to, at its core, in today's world, in the age of, in the world of, the reality is, the truth is, in terms of, with regard to, in order to, going forward, in this article, let's dive in. Cut them when they delay the point. Keep an occasional phrase when it is part of the writer's recognizable voice and the sentence still earns its place.

## Patterns to cut

**Binary contrasts.** "This is not X. It's Y." / "The question isn't X, it's Y." / "It's not just X but Y." State Y directly. "The question isn't the model. It's the eval." becomes "The eval matters more than the model."

**Throat-clearing openers.** "Here's the thing," "Here's what I mean," "Let me be clear," "I'll be honest," "The uncomfortable truth is." Cut them and state the point.

**Faux-insight setups.** "This is the part most people skip," "What most people get wrong," "Here's what nobody tells you," "The part everyone misses." These flatter the writer as the lone expert. Cut the setup and make the claim stand on its own. "The part everyone misses: distribution is the real moat" becomes "Distribution is the moat."

**Colon reveals.** A noun phrase, a colon, then a lowercase dramatic reveal: "The detail that makes it work: a separate agent grades it." "The best part: it learns." Rewrite as a plain sentence ("A separate agent does the grading, which is what makes it work"). Use colons for lists, labels, and quotes, not fake drama. Prefer sentence case after a colon unless grammar, a proper noun, a title, or code requires otherwise.

**Superficial analysis.** Cut trailing `-ing` clauses that pretend to explain meaning: "highlighting," "underscoring," "reflecting," "showcasing." "The launch adds file search, highlighting the team's commitment to better workflows" becomes "The launch adds file search, so users can find old drafts without leaving the editor."

**Importance puffery.** "Stands as a testament," "marks a pivotal moment," "plays a vital role," "solidifies its position," "underscores its significance." State the fact and let the reader judge whether it matters. "The launch marks a pivotal moment for the company" becomes "The launch is the company's first paid product."

**Interpretive metadiscourse.** Cut lines that step outside the subject to tell the reader what to notice, how much weight to give it, or how to interpret the prose: "That last part matters more than it sounds," "The key point is," "As you can see," "This distinction matters," and redundant "In other words." If the point is clear, delete the aside. Otherwise, replace it with support or facts already in the content.

**Weasel attribution.** "Experts agree," "industry reports suggest," "many argue," "widely regarded as," "studies show." Name the source or cut the claim. If the user has no source, ask instead of inventing one.

**Fake-strong verbs.** Prefer "is" and "has" when they are clearer. "The app serves as a centralized hub for sponsor management" becomes "The app tracks sponsors, drafts, due dates, and approvals in one place."

**Synonym cycling.** If the clear word is right, repeat it. Don't rotate terms for style. "The agent reviews the draft. The assistant scores the piece. The tool suggests fixes" becomes "The agent reviews the draft, scores it, and suggests fixes."

**Negative listing.** "Not a X. Not a Y. A Z." Just say Z.

**Dramatic fragmentation.** "X. And Y. And Z." or "That's it. That's the whole thing." Use complete sentences.

**Robotic rhythm.** Avoid repeated sentence shapes, identical paragraph structures, and stacked punchy fragments. Vary the shape only when it helps the point.

**Rhetorical setups.** "What if I told you...", "Think about it:", "Plot twist:", and self-answered "Question? Answer." pairs. Drop them and make the point.

**Fake-profound kickers.** Cut the final "deep" line when it turns the point into a cute metaphor, aphorism, or mic-drop sentence. Do not rewrite it into a better metaphor. Do not preserve the rhythm. Delete it, then end on the clearest concrete sentence already in the draft. If the ending needs more closure, add a plain takeaway or next action.

**Summary-recap endings.** "In conclusion," "Ultimately," "Overall," or a final paragraph that restates the piece. The reader was just there. End on the last concrete point, takeaway, or next action instead.

**Formatting slop.** Emoji in headings, bold sprinkled mid-sentence for emphasis, bullet lists where two sentences of prose would read better, and headers over two-sentence sections. Format should follow the content, not decorate it.

**Em dashes.** Do not use them as a default rhythm crutch. In short copy, use none. In longer drafts, 1-2 are fine if they clearly beat commas, periods, or parentheses. Remove clusters and decorative dashes.

## Workflow

1. Read the full draft before editing.
2. Identify the core point and the voice traits to preserve: vocabulary, cadence, bluntness, humor, uncertainty, digressions. If you cannot identify the core point, ask the user.
3. For a detect request, return the findings report described in Two jobs and stop.
4. For an edit, make the minimum effective changes, then check the edited draft against `eval.md` yourself.
5. If any check fails, fix the draft and run the checks again.
6. Output the full edited draft and a short **What changed** section.