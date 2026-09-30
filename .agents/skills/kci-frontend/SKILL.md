---
name: kci-frontend
description: Frontend conventions for the Komunitas Catur Indonesia (KCI) ChessClub site - React 18, Vite 6, Tailwind CSS v4, react-router-dom v7 with lazy routes in src/App.jsx, Indonesian naming, i18n dictionaries in src/lib/terjemahan/, standard page markup from existing components (src/components/PageBagian.jsx, src/halaman/BACA-DULU.md), shared UI primitives in src/components/ui/ plus RADIX-UI.md, board/engine render and memoization rules, grafik lazy loading, and a restrained corporate design language (no emoji, no gradients, single accent, thin borders - anti AI-slop) with Lighthouse 100 as the performance target. Use when editing anything under src/, index.html, vite.config.js, or public/.
metadata:
  project: chessclub-kci
  area: frontend
---

# Frontend KCI — Komunitas Catur Indonesia

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Jalur berkas di dokumen ini relatif terhadap **akar repo** (`src/…`, `server/src/…`, `public/…`).
Hanya jalur yang diawali `references/` yang relatif terhadap folder skill ini.

## Baca dulu sebelum menyentuh `src/`

| Kebutuhan | Berkas |
| --- | --- |
| Rute, halaman, dan pemuatan malas | `src/App.jsx` |
| Peta menu sebelum menambah halaman | `src/halaman/BACA-DULU.md` |
| Kerangka halaman standar | `src/components/PageBagian.jsx` + `references/standar-markup.md` |
| Primitif UI dan aturan Radix | `src/components/ui/` + `RADIX-UI.md` |
| Kamus teks ID/EN | `src/lib/terjemahan/{id,en}/` |
| Uji penjaga halaman/logika | `docs/PETA-KODE.md` kolom "uji penjaga" |

## Stack (jangan diganti tanpa persetujuan pengguna)

- React 18 + Vite 6 + Tailwind CSS v4 (plugin `@tailwindcss/vite`) + react-router-dom v7.
- `lucide-react` (ikon), `react-helmet-async` (meta/SEO), `pdfjs-dist` (pembaca PDF e-book), `chess.js` (logika catur), `zod` (validasi).
- Node >= 22. Tanpa TypeScript, tanpa framework CSS lain, tanpa state library eksternal.

## Bahasa & penamaan

- Semua nama berkas, komponen, fungsi, variabel, dan komentar memakai **Bahasa Indonesia**:
  komponen `VerifikasiAkun.jsx`, hook diawali `gunakan` (`src/lib/gunakanEngineCatur.js`), modul `src/lib/terjemahan.js`.
- Komponen umum → `src/components/`; halaman → folder sendiri di `src/halaman/`
  (baca `src/halaman/BACA-DULU.md` untuk peta menu sebelum menambah halaman).
- Keanggotaan hanya menjadi tab di `StrukturGrupCatur/`; `PendaftaranAnggota` adalah halaman aksi terpisah.

## Bahasa desain — sumber aturan tunggal

`DESIGN.md` adalah satu-satunya sumber kebenaran visual KCI. Skill ini mengatur cara
implementasi frontend; skill `kci-anti-slop` hanya mengaudit pola yang harus dihindari.
Jangan membuat palet, skala tipografi, aturan tombol, font, radius, atau layout kedua di sini.

Urutan keputusan visual:

1. Ikuti permintaan eksplisit pengguna untuk tugas aktif.
2. Ikuti `DESIGN.md` untuk token dan keputusan visual.
3. Ikuti komponen/pola existing yang masih sesuai `DESIGN.md`.
4. Gunakan `kci-anti-slop` sebagai filter audit, bukan sebagai gaya pengganti.

Jika implementasi existing bertentangan dengan `DESIGN.md`, jangan menyalin penyimpangan itu
ke komponen baru. Jangan pula memperbaiki semua pemakaian lama tanpa persetujuan cakupan.

Sebelum membuat atau mengubah UI:

- baca `DESIGN.md`;
- buka `references/standar-markup.md`, `references/standar-visual.md`, dan contoh source terdekat;
- gunakan kerangka halaman serta primitif bersama yang sudah ada;
- muat `kci-anti-slop` dan jalankan checklist-nya sebelum selesai;
- gunakan Bahasa Indonesia untuk identifier dan copy sesuai konvensi proyek.

Larangan ringkas: tanpa emoji, gradien dekoratif, glow, glassmorphism, card bertumpuk,
ukuran teks ad-hoc, copy generik, atau motion tanpa fungsi. Rincian dan pengecualian ada di
`kci-anti-slop`; nilai positif yang harus dipakai tetap berasal dari `DESIGN.md`.

## Komponen satu pintu per domain

Jangan menyamakan bentuk seluruh aplikasi. Gunakan rumah komponen sesuai domain:

- halaman konten publik: `src/components/PageBagian.jsx` dan `src/components/konten/`;
- Program Kami non-catur: komponen fitur di `src/halaman/ProgramKami/`;
- seluruh visual catur: `src/halaman/Analisa/komponen/`, termasuk `game/`, `svg/`, panel, evaluasi, jam, dan elemen papan;
- Papan Interaktif, Teka-teki, Quiz, dan Rush: folder sendiri hanya untuk orkestrasi/state/logika mode; visual catur reusable tetap mengambil dari `Analisa/komponen/`;
- dashboard Pengurus: primitif `src/components/ui/` dan komponen Pengurus.

Ikon umum non-catur boleh berasal dari `lucide-react` atau `src/components/icons.jsx`; ikon catur berasal
dari `src/halaman/Analisa/komponen/svg/`. Dilarang membuat salinan komponen catur di setiap mode atau
memaksakan gaya artikel ke fitur catur. Keseragaman diwajibkan di dalam masing-masing keluarga.

## Komponen, state, dan render

Prinsipnya: perubahan state yang tidak berhubungan tidak boleh menggetarkan papan catur, dan komponen
yang mahal hanya dihitung ulang bila masukannya memang berubah.

- **Pisahkan state papan dari state UI global.** State visual papan (posisi, riwayat langkah, sorotan,
  orientasi, pilihan petak) hidup di komponennya sendiri; perubahan sidebar, tema, notifikasi kuis, atau
  bahasa tidak boleh memaksa petak dan bidak dirender ulang. Jangan mengangkat state papan ke konteks
  global kecuali dua mode benar-benar membutuhkannya bersamaan.
- **Turunan dihitung saat render, bukan disimpan ganda.** FEN aktif, daftar langkah, bidak tertangkap, dan
  katalog pembukaan adalah turunan dari posisi/riwayat. Menyimpannya sebagai state kedua menciptakan dua
  kebenaran yang bisa melenceng setelah satu langkah salah.
- **Memoisasi berdasarkan pengukuran, bukan kebiasaan.** Di repo ini belum ada satu pun `React.memo`;
  papan mengandalkan `useMemo`/`useCallback` untuk nilai yang benar-benar dialokasikan ulang tiap render
  (mis. daftar langkah sah di `src/halaman/Analisa/komponen/game/board.jsx` — ada komentar alasan di
  sana — dan `PapanInteraktif.jsx`). Pakai memo bila profiler (React DevTools) menunjukkan render
  berulang yang mahal; jangan menaburkannya ke semua petak dan bidak karena biaya perbandingan props dan
  kebisingan kode tumbuh tanpa manfaat terukur.
- **Grafik dan visualisasi berat dimuat saat dibutuhkan.** Komponen grafik
  (`src/components/tools/GrafikTools.jsx`) dan visualisasi besar lain hanya diunduh ketika tab atau
  bagian pemakainya dibuka (`React.lazy`/dynamic import), bukan ikut bundel awal — target Lighthouse 100
  dan LCP tidak boleh mundur. Pola serupa sudah dipakai untuk seluruh rute (`src/App.jsx`), pustaka
  pembaca PDF (`pdfjs-dist` diimpor dinamis di `src/components/PembacaPdf.jsx`), dan engine. Catatan:
  sampai sekarang `GrafikTools` belum dipakai halaman mana pun, jadi aturan ini berlaku begitu ia mulai
  dipakai.
- **Satu bahasa visual untuk komponen bersama.** Tombol, kartu, input, tab, dan popup memakai primitif di
  `src/components/ui/` (pembungkus Radix + `cn()` dari `@/lib/utils`), bukan gaya ad-hoc per halaman.
  Belum ada `Avatar` maupun pemilih tanggal di repo — bila dibutuhkan, buat primitifnya di
  `src/components/ui/` mengikuti pola yang ada (baca `RADIX-UI.md`), jangan menulis komponen sekali pakai
  di dalam berkas halaman.

## Referensi visual

- Sumber kebenaran aktif: [`DESIGN.md`](../../../DESIGN.md).
- Kerangka halaman: [`references/standar-markup.md`](references/standar-markup.md).
- Tipografi, layout, dan anatomi konten: [`references/standar-konten.md`](references/standar-konten.md).
- Gambar, ilustrasi, diagram, dan dokumentasi: [`references/standar-media.md`](references/standar-media.md).
- Penerapan visual: [`references/standar-visual.md`](references/standar-visual.md).
- Contoh source existing: [`references/contoh-komponen.md`](references/contoh-komponen.md).
- `references/Design-System-Reference.md` hanya penunjuk sejarah dan tidak memuat aturan aktif.
- Filter larangan: skill `kci-anti-slop`.

Jangan memilih referensi berbeda untuk membenarkan gaya yang bertentangan. Bila pola yang
dibutuhkan belum diatur, ajukan pilihan kepada pengguna atau usulkan penambahan ke `DESIGN.md`
sebelum menjadikannya standar baru.

## Standar markup halaman (WAJIB sebelum membuat/porting halaman)

Sebelum menulis satu baris JSX untuk halaman baru atau porting, baca
[`references/standar-markup.md`](references/standar-markup.md) — isinya: langkah mencari halaman
pembanding, kerangka wajib (`HalamanIsi` + `PageArtikel`/`PageGambar` dari
`src/components/PageBagian.jsx`; `StickyMenu` ada di `src/components/StickyMenu.jsx` sebagai
*default export* — bukan bagian `PageBagian.jsx`), tipografi `prose-kci`, enam titik pendaftaran rute/menu/terjemahan,
dan larangan membuat komponen `Hero`/`Section`/`Card` versi sendiri. Intinya: **salin pola rumah,
jangan mengarang struktur baru.**

## i18n

- Bahasa bawaan `id`; kamus di `src/lib/terjemahan/{id,en}/`; kamus `en` di-lazy-load oleh `src/lib/i18n.jsx`
  (disimpan di localStorage `kci-bahasa`).
- Kunci terjemahan baru wajib ada di **kedua** bahasa → jalankan `npm run uji:i18n`.

## Jaringan & keamanan

- API dipanggil memakai `VITE_API_DASAR` (kosong = same-origin `/api`). Jangan pernah hardcode `localhost`
  untuk kode yang sampai ke produksi.
- **CSP `connect-src` di `vercel.json` adalah allowlist tertutup.** Domain eksternal baru (API, gambar, font)
  wajib didaftarkan di sana atau request diblokir di produksi. Yang sudah diizinkan: `api.chess.com`,
  `lichess.org`/`tablebase.lichess.ovh`, `*.supabase.co`, `media.githubusercontent.com`, `*.wikipedia.org`/
  `*.wikibooks.org`, `translate.googleapis.com`, `va.vercel-scripts.com`.

## Performa (target Lighthouse 100 di keempat kategori)

- Foto: WebP + `srcset` (828/1280); kompres dengan `npm run gambar:optimum`, verifikasi `npm run uji:gambar`.
- LCP adalah `/images/tonggak-2015.webp`: di-`preload` di `<head>` `index.html` dan dilukis lebih dulu lewat
  `#boot-hero` (`hero-about.jpg/.webp` hanyalah nilai bawaan komponen `Hero`/`CorporatePage`, bukan aset
  LCP beranda) — pertahankan pola preload + paint awal ini untuk LCP baru.
- Engine catur selalu berjalan di worker lewat `src/lib/engineCatur.js` (build single-thread di
  `public/engines/`), dinyalakan saat dibutuhkan dan dihentikan saat mode/partai selesai — pencarian di
  thread utama membekukan halaman. Siklus hidup per mode ada di `kci-papan-interaktif`.
- Jangan menambah dependensi runtime baru tanpa alasan kuat dan persetujuan pengguna.

## Sebelum selesai

- Minimum: `npm run uji:rute && npm run uji:i18n` lalu `npm run build` harus lulus.
- Menyentuh halaman analisa/engine → tambah `npm run uji:analisa-ui`.

## Radix UI dan markup interaktif

Saat mengubah Tabs, Card, Button, Label, Input, popup, atau komponen UI di `src/components/ui/`, baca panduan root [`RADIX-UI.md`](../../../RADIX-UI.md). Panduan tersebut menjelaskan wrapper Radix yang tersedia, alias `@`, `cn()`, kontrak controlled Tabs, aksesibilitas popup, diagnosis error, dan checklist verifikasi untuk AI/Opencode. Catatan: dari 35 berkas di `src/components/ui/`, 3 memakai `@base-ui/react` (`hover-card.jsx`, `progress.jsx`, `separator.jsx`) dan tidak dibahas di `RADIX-UI.md` — selalu cek baris `import` berkas sebelum meniru pola Radix.

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
