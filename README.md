# ChessClub — Komunitas Catur Indonesia

[![Quality checks](https://github.com/Delta-Polder-Indonesia/ChessClub/actions/workflows/quality.yml/badge.svg)](https://github.com/Delta-Polder-Indonesia/ChessClub/actions/workflows/quality.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Website komunitas catur "Blunder Skuad" — profil klub, turnamen, media, dan
pusat latihan catur berbasis web. Dibangun dengan **React + Vite + Tailwind CSS v4**
di frontend dan **Node.js tanpa framework** di backend, keduanya dideploy sebagai
satu proyek Vercel.

Proyek ini terbuka untuk kolaborasi: siapa pun boleh fork, mengusulkan perubahan
lewat pull request, dan ikut menjaga kualitas melalui gerbang uji otomatis.

## Fitur

- **Papan interaktif** — mode Analisa dengan Opening Book, Manusia vs Mesin
  (Stockfish lokal / Sunfish), dan Latihan Repertoar tersimpan di IndexedDB.
- **Teka-teki catur, Quiz, dan Teka-teki Rush** — latihan taktik dengan tingkat
  kesulitan bertingkat dan progres tersimpan lokal.
- **Teka-teki Harian** (`/teka-teki-harian`) — soal harian resmi Chess.com
  beserta arsip per tanggal, dimainkan di papan situs ini. Datanya diambil
  lewat API publik Chess.com dari server (bukan arsip salinan), dengan
  atribusi dan tautan ke halaman aslinya.
- **Analisa posisi** — evaluasi engine di dalam browser (Web Worker), grafik
  evaluasi, dan bilah skor.
- **Keanggotaan otomatis dari Chess.com** — backend mengambil roster publik
  [BLUNDER SKUAD](https://www.chess.com/club/blunder-skuad), memperkaya profil dan
  rating pemain; diperbarui maksimal tiap 12 jam.
- **Turnamen, media & informasi, keberlanjutan** — halaman konten berbagi
  kerangka layout yang sama dan mendukung SEO untuk setiap rute.
- **Multibahasa** — kamus teks Indonesia/Inggris di `src/lib/terjemahan/`.
- **Responsif penuh** — desktop, tablet, dan mobile; header sticky, submenu
  scroll-spy, drawer menu mobile, dan footer akordeon.

## Tech stack

| Lapisan | Teknologi |
| ------- | --------- |
| Frontend | React 18, Vite 6, Tailwind CSS v4, react-router-dom v7 |
| Backend | Node.js (vanilla, tanpa framework), dijalankan sebagai Serverless Function Vercel |
| Database opsional | Supabase |
| Engine catur | Stockfish (stockfish.js, GPL-3.0), Sunfish |
| Logika catur | chess.js |
| Hosting & CI | Vercel, GitHub Actions |

Atribusi lengkap aset pihak ketiga (bidak, buku pembukaan, engine, suara, logo)
ada di halaman **Atribusi & lisensi** dalam aplikasi (`/program-kami/atribusi`).

## Memulai

Prasyarat: **Node.js >= 22** dan npm.

```bash
git clone https://github.com/Delta-Polder-Indonesia/ChessClub.git
cd ChessClub
npm install
npm run dev      # server development di http://localhost:5173
npm run build    # build produksi ke /dist
npm run preview  # pratinjau hasil build
```

Backend berjalan otomatis bersama frontend pada mode development. Konfigurasi
environment untuk produksi dijelaskan di [`PANDUAN-DEPLOY-FULL-VERCEL.md`](./PANDUAN-DEPLOY-FULL-VERCEL.md).

## Struktur repositori

| Path | Isi |
| ---- | --- |
| `src/halaman/` | Halaman per rute (dimuat malas via `src/App.jsx`) |
| `src/components/` | Komponen bersama (header, footer, papan, ikon, UI) |
| `src/lib/` | Utilitas: i18n, engine catur, suara, API client |
| `server/` | Kode backend (rute, skema validasi, storage) |
| `api/` | Entry point Serverless Function Vercel |
| `scripts/` | Alat bantu & skrip uji (`uji:*`) |
| `docs/` | Dokumentasi desain, audit, dan panduan deploy |

Nama berkas dan identifier berbahasa Indonesia — konvensi ini disengaja dan
menjadi bagian dari gaya kode proyek.

## Pengujian & kualitas

```bash
npm run uji:rilis:v1   # gerbang rilis lengkap (audit + seluruh uji + build)
```

Untuk perubahan kecil, jalankan uji topik terkait saja — daftar lengkapnya di
blok `"scripts"` `package.json` (semua berawalan `uji:`), misalnya:

```bash
npm run uji:rute      # rute frontend
npm run uji:i18n      # kamus teks ID/EN
npm run uji:desain    # penjaga standar desain
npm run uji:backend   # API end-to-end
```

Setiap push dan pull request memicu workflow **Quality checks** di GitHub
Actions; perubahan hanya boleh digabungkan bila gerbang itu hijau.

## Berkontribusi

Alur standar proyek ini:

1. **Fork** repositori dan buat cabang dari `main`:
   `git checkout -b fitur/nama-perubahan`.
2. **Ubah seminimal mungkin** — satu topik per pull request; jangan menyertakan
   perbaikan di luar cakupan.
3. **Jalankan uji relevan** secara lokal (lihat bagian Pengujian) dan catat
   hasilnya di deskripsi pull request.
4. **Buka pull request** ke `main`. Jelaskan apa yang berubah, mengapa, dan
   bagaimana dampaknya; sebutkan hal yang belum diverifikasi apa adanya.
5. Tinjauan akan memeriksa kecocokan konvensi, hasil CI, dan dampak performa.
   Menguji, melewati, atau melemahkan uji agar CI hijau tidak dibenarkan.

Panduan gaya kode, cakupan perubahan, dan prosedur deploy ada di berkas
[`AGENTS.md`](./AGENTS.md) dan skill di `.agents/skills/`.

## Deployment

Frontend dan backend produksi berjalan dalam satu proyek Vercel:
`api/[...jalur].js` meneruskan request `/api/*` ke kode di `server/`.

| Dokumen | Isi |
| ------- | --- |
| [`PANDUAN-DEPLOY-FULL-VERCEL.md`](./PANDUAN-DEPLOY-FULL-VERCEL.md) | Panduan langkah demi langkah: environment, Supabase, verifikasi production |
| [`DEPLOYMENT-CHECKLIST.md`](./DEPLOYMENT-CHECKLIST.md) | Checklist pra-deploy |
| [`VERCEL-LIMITATIONS.md`](./VERCEL-LIMITATIONS.md) | Batasan platform yang perlu diketahui |
| [`V1-READINESS.md`](./V1-READINESS.md) | Status audit, scope, dan definition of done v1 |

## Lisensi

Kode sumber dirilis di bawah lisensi **MIT** — lihat [`LICENSE`](./LICENSE).
© 2025-2026 Delta-Polder-Indonesia (Bintang Toba). Kode yang dipindah atau
diadaptasi dari proyek lain tetap tunduk pada lisensinya masing-masing
(mis. Stockfish di bawah GPL-3.0).
