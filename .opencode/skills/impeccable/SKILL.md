---
name: impeccable
description: Panduan desain craft dan anti-AI-slop untuk antarmuka web KCI (landing page, halaman fitur, catur, modal, formulir) - mencakup 24 perintah Impeccable (craft, shape, polish, critique, audit, layout, typeset, colorize, clarify, distill, harden) dengan aturan baku penolakan AI-slop.
metadata:
  project: chessclub-kci
  area: design-craft
---

# Impeccable — Standar Desain Frontend & Anti AI-Slop KCI

Skill ini memberikan panduan desain profesional berstandar tinggi untuk antarmuka web Komunitas Catur Indonesia (KCI). Fokus utamanya adalah menghasilkan desain yang berkarakter kuat, tenang, kredibel, dan bersih dari **"AI slop"** (kebiasaan malas AI seperti gradien ungu/pink, glow neon, grid kartu kembar, dan teks klise).

## Prinsip Inti KCI x Impeccable

1. **Refinement preserves, Redesign replaces:** Pemolesan (*polish*) mempertahankan identitas, perilaku, dan copy yang ada. Jangan merombak struktur yang tidak diminta.
2. **The Brief Wins:** Patuhi token warna, tipografi, dan batasan produk yang sudah disepakati di `DESIGN.md` dan `PRODUCT.md`.
3. **No AI Slop:** Tolak kebiasaan otomatis AI (teks gradasi, bayangan pendar, 3 kartu identik, kicker di setiap judul, dan jargon marketing kosong).

## Mode Pengunjung (Visitor Modes)

- **Persuade (Landing Page, Halaman Promosi, Pendaftaran):** Desain bertujuan meyakinkan dan mengajak aksi nyata. Gunakan aset fotografi nyata komunitas, program unggulan, dan bukti riil.
- **Operate (Papan Interaktif, Analisa, Teka-Teki, Kuis, Dashboard):** Desain memfasilitasi tugas pengguna. Prioritaskan kejelasan tombol, scanability, tata letak papan, dan efisiensi interaksi.
- **Read (E-Book, Artikel Sejarah Catur, Panduan):** Desain memprioritaskan kenyamanan membaca. Terapkan batas lebar bacaan (*measure* 45–75ch) dan ritme paragraf yang tenang.

## Perintah Utama Impeccable

| Perintah | Kategori | Fungsi | Rujukan |
|---|---|---|---|
| `polish [target]` | Refine | Pemolesan akhir, perataan sistem desain, perbaikan state | [reference/polish.md](reference/polish.md) |
| `critique [target]` | Evaluate | Review desain UX, hierarki, dan keterbacaan | [reference/critique.md](reference/critique.md) |
| `audit [target]` | Evaluate | Pemeriksaan a11y, performa, responsivitas | [reference/audit.md](reference/audit.md) |
| `layout [target]` | Enhance | Memperbaiki jarak, ritme visual, dan hierarki wadah | [reference/layout.md](reference/layout.md) |
| `typeset [target]` | Enhance | Memperbaiki skala tipografi, line-height, dan measure | [reference/typeset.md](reference/typeset.md) |
| `colorize [target]` | Enhance | Menata warna terarah tanpa gradien/glow | [reference/colorize.md](reference/colorize.md) |
| `clarify [target]` | Fix | Membersihkan copy dari buzzword AI dan bahasa klise | [reference/clarify.md](reference/clarify.md) |
| `distill [target]` | Refine | Menyederhanakan UI, membuang dekorasi yang tidak perlu | [reference/distill.md](reference/distill.md) |
| `bolder [target]` | Refine | Menguatkan karakter bagian yang terlalu datar | [reference/bolder.md](reference/bolder.md) |
| `quieter [target]` | Refine | Menenangkan bagian yang terlalu ramai/agresif | [reference/quieter.md](reference/quieter.md) |
| `harden [target]` | Refine | Melengkapi state loading, empty, error, dan responsivitas | [reference/harden.md](reference/harden.md) |

## Quality Floor (Wajib Diperiksa Sebelum Selesai)

Sebelum menyelesaikan pekerjaan UI, baca [reference/craft-floor.md](reference/craft-floor.md):
- **Kontras:** Teks body $\ge 4.5:1$, teks besar $\ge 3:1$.
- **Lebar Teks:** Kontainer teks dibatasi 65–75 karakter per baris (`max-w-[65ch]` atau `max-w-2xl`).
- **Jarak & Ritme:** Kelompok rapat (`gap-2` s.d. `gap-4`), pemisah seksi lega (`gap-10` s.d. `gap-16`).
- **States:** Sediakan kondisi lengkap: default, hover, active, focus-visible, loading, error, empty.
- **Browser Surfaces:** Sesuaikan gaya seleksi teks dan focus ring dengan token KCI.
