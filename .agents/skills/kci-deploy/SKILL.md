---
name: kci-deploy
description: Deployment guidance for the KCI ChessClub site - Vercel production with the api/[...jalur].js serverless backend, required KCI_* and SUPABASE_* environment variables, fail-closed production startup, the admin dashboard, and the commit/push rules that keep Vercel from producing blocked deployments. Use when changing vercel.json, Vercel environment variables, or CI workflows, and before the first commit or push in any task because every push triggers a Vercel deployment.
metadata:
  project: chessclub-kci
  area: deployment
---

# Deploy KCI

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Jalur berkas di dokumen ini relatif terhadap **akar repo** (`vercel.json`, `api/…`, `docs/…`).

## Baca dulu sebelum menyentuh deploy

| Kebutuhan | Berkas |
| --- | --- |
| Konfigurasi Vercel (rewrite, header, function) | `vercel.json` |
| Fungsi serverless backend | `api/[...jalur].js` |
| Daftar lengkap env beserta komentar | `.env.contoh` |
| Panduan deploy lengkap | `PANDUAN-DEPLOY-FULL-VERCEL.md` |
| Workflow CI | `.github/workflows/quality.yml` (+ cermin `quality.yml`) |

## Skema production Vercel

| Skema | Kapan dipakai | Berkas kunci |
| ----- | ------------- | ------------ |
| **FULL VERCEL** — frontend + backend serverless | satu-satunya jalur production | `vercel.json`, `api/[...jalur].js`, `PANDUAN-DEPLOY-FULL-VERCEL.md` |

Catatan cepat: `varcel.md` adalah ringkasan akses dashboard; `VERCEL-LIMITATIONS.md` menjelaskan batasan
`/tmp` yang ephemeral.

## Env var wajib produksi (fail-closed)

`server/src/konfigurasi.js` (`periksaProduksi()`) **menolak menjalankan** mode produksi bila:

- `KCI_PEPPER` kosong atau < 16 karakter (hash identitas — jangan pernah diganti setelah ada data),
- `KCI_ADMIN_PASSWORD` masih bawaan `admin123` atau < 6 karakter,
- `KCI_JWT_SECRET` kosong atau < 24 karakter,
- `KCI_TOKEN_ADMIN` diisi tetapi < 24 karakter.

`server/src/index.js` menambah gerbang kedua sebelum server jalan: di produksi
`KCI_ADMIN_PASSWORD` wajib **>= 12 karakter** dan bukan bawaan. Angka 12 inilah yang
bekerja di lapangan — lebih ketat daripada `periksaProduksi()`.

Mode produksi aktif bila `NODE_ENV=production` **ATAU** `KCI_ASAL_DIIZINKAN` terisi.

## Env var lain yang sering dipakai

- `KCI_ASAL_DIIZINKAN` — origin frontend, dipisah koma, tanpa trailing slash.
- `KCI_ADMIN_USER` — username dashboard `/pengurus`; `KCI_TOKEN_ADMIN` — opsional (legacy, min. 24 karakter bila diisi).
- `KCI_JUMLAH_PROXY` — `0` lokal, otomatis `1` di Vercel; `KCI_DIR_DATA` — di Vercel `/tmp/kci-data`.
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` — wajib diisi agar data awet di FULL VERCEL
  (skema: `db/supabase-schema.sql`).
- `VITE_API_DASAR` — **kosongkan** di FULL VERCEL agar frontend memakai `/api` same-origin.
- `KCI_CHESS_CLIENT_ID` / `KCI_CHESS_CLIENT_SECRET` — OAuth Chess.com; callback
  `/api/auth/chess/kembali` harus persis dengan yang terdaftar.

Daftar lengkap beserta komentarnya ada di `.env.contoh`.

## Detail yang sering salah

- `vercel.json`: build memakai `VITE_BASE_PUBLIC=/`; rewrite SPA `/(.*)` (non-`api/`) → `/index.html`;
  function `api/[...jalur].js` menyertakan `data/*.json` (`includeFiles`) dengan `maxDuration` 60.
  Jangan dipecah tanpa memahami konsekuensinya.
- Tanpa Supabase, data di Vercel hilang saat cold start/redeploy (baca `VERCEL-LIMITATIONS.md`).
- Dashboard pengurus: `<domain>/pengurus`; cek kesehatan: `GET /api/kesehatan`.
- Setelah mengubah Environment Variable di Vercel → wajib **Redeploy**.

## Commit dan push: jangan menghasilkan deployment yang diblokir

### Perintah push resmi (wajib — aturan pemilik repo)

Pemilik repo menetapkan SATU-SATUNYA urutan perintah push. Selain urutan ini, push tidak
diizinkan:

1. `git add .`
2. `git commit -m "isi sesuai kebutuhan"`
3. `git push origin main`

Konsekuensinya:

- **Semua perubahan di working tree wajib ikut ter-commit dan ter-push.** Termasuk berkas yang
  diubah pemilik repo sendiri (mis. `package.json` saat instalasi) — jangan "menyisihkan" berkas
  apa pun dengan alasan apa pun.
- **Satu-satunya pengecualian adalah yang tertulis di `.gitignore`.** Bila ada berkas yang tidak
  boleh masuk repo, pemilik repo yang menambahkannya ke `.gitignore`; agen tidak boleh membuat
  daftar pengecualian sendiri.
- Karena `git add .` menyapu seluruh working tree, pastikan tidak ada berkas/temporer tak sengaja
  di area repo sebelum commit (berkas sementara wajib di `C:\Users\TRIANA~1\AppData\Local\Temp\opencode\`,
  lihat `AGENTS.md`).

Proyek Vercel `chess-club` terhubung langsung ke repo GitHub ini, jadi **setiap push ke cabang
mana pun** (termasuk cabang kerja agen) memicu satu deployment. Vercel menolak deployment yang
penulis commit-nya tidak bisa dicocokkan ke akun GitHub yang punya akses proyek. Hasilnya adalah
status commit `Vercel — failure` dengan keterangan "GitHub couldn't verify an account for the
commit" atau "Deployment was blocked", dan pemilik proyek harus membersihkannya manual di
dashboard Vercel. Ini pernah terjadi (26 September 2026: dua commit beridentitas
`Arena Agent <agent@arena.ai>` di cabang `arena/01a0dcd3-chessclub`).

Aturan yang wajib diikuti:

- **Jangan pernah menimpa identitas git.** `.git/config` repo sudah berisi identitas yang benar
  (`Delta-Polder-Indonesia` + email `…@users.noreply.github.com`). Dilarang memakai
  `git -c user.name=… -c user.email=…`, `git commit --author=…`, atau mengisi `GIT_AUTHOR_*` /
  `GIT_COMMITTER_*` dengan identitas agen/bot. Commit memakai apa yang sudah ada di konfigurasi.
- **Periksa sebelum push:** `git log -1 --format='%an <%ae>'` harus menampilkan identitas pemilik
  repo, bukan nama agen. Bila salah: `git commit --amend --reset-author` (atau
  `git rebase -i --exec 'git commit --amend --no-edit --reset-author'` untuk beberapa commit),
  lalu push ulang cabang yang sama.
- **Satu push per tugas selesai, bukan per commit.** Tiap push = satu deployment. Commit lokal
  boleh beberapa kali; menunda push sampai pekerjaan selesai menahan jumlah deployment tetap satu.
- **Jangan membuat cabang atau PR tambahan tanpa diminta** — tiap cabang dan tiap PR menambah
  preview deployment baru.
- **Jangan "memperbaiki" masalah ini dengan menyunting `vercel.json`, `.vercelignore`, atau
  pengaturan proyek Vercel.** Penyebabnya identitas commit, bukan konfigurasi deploy.
- Memeriksa dampak sebuah push tanpa membuka dashboard:
  `gh api repos/Delta-Polder-Indonesia/ChessClub/commits/<sha>/status`.
- Bila deployment yang diblokir terlanjur dibuat, laporkan apa adanya: status pada SHA lama tetap
  ada dan hanya pemilik proyek yang bisa menghapusnya di dashboard Vercel.

## Workflow GitHub

- `.github/workflows/quality.yml` — uji + build + Playwright pada setiap PR/push `main` (lihat skill
  `kci-pengujian`).
- `.github/workflows/health.yml` — pengecekan kesehatan API; deployment production dikelola Vercel.
- `quality.yml` di akar repo adalah mirror persis `.github/workflows/quality.yml` (7 baris komentar di
  atasnya bukan bagian workflow). Fungsinya tempat menyiapkan perubahan workflow bila token tidak punya
  izin `workflows`: salin body-nya ke `.github/workflows/quality.yml`, commit, push. Ubah keduanya
  bersamaan — berkas itu bukan sumber kebenaran.
- Checkout CI sengaja TANPA `lfs: true`: repo sudah keluar dari Git LFS (`.gitattributes` kosong, PDF
  `public/ebooks/` = blob Git biasa, lihat `scripts/keluar-dari-lfs.sh`). Jangan "memperbaiki" CI dengan
  menambah LFS lagi.
