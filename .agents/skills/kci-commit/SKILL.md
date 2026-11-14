---
name: kci-commit
description: "Tulis pesan commit dan judul PR KCI yang informatif. Menyediakan pedoman pesan commit konvensional (opsi b: anjurkan prefix EN + terima free-form yang jelas + larang placeholder), daftar scope kanonik Bahasa Indonesia yang selaras dengan struktur folder, aturan format yang menyesuaikan riwayat KCI (huruf kecil setelah ':', ~72 karakter), serta larangan yang sudah ditetapkan proyek (tanpa emoji, tanpa '<' dan '>' mentah, penulis commit = identitas pengguna). Dipakai saat akan melakukan git commit, saat diminta membantu menulis pesan commit, atau saat menyiapkan judul PR sebelum merge. Bukan untuk menulis kode atau meninjau."
metadata:
  project: chessclub-kci
  area: tooling
---

# KCI Commit — Tulis Pesan Commit dan Judul PR yang Jelas

Ikuti protokol kerja di `AGENTS.md`: pikir dulu, diff terkecil, verifikasi, tanpa emoji.

Panduan ini bertujuan menghilangkan pesan *placeholder* ("ruang kerja", "wip", "fix",
"update") yang mencemari riwayat, **tanpa** memaksa format ketat pada tim yang sudah
menulis judul PR secara jelas dalam Bahasa Indonesia. Hasil akhir yang diharapkan:
setiap baris di `git log --oneline` dan judul PR yang di-*merge* ke `main` bisa dibaca
bulan depan dan langsung menjelaskan apa yang berubah.

Skill ini hanya mengatur pesan commit dan judul PR. Untuk meninjau perubahan sebelum
dinyatakan siap, pakai `kci-review`; untuk uji yang harus jalan, pakai `kci-pengujian`.

---

## 1. Kebijakan: anjurkan prefix, terima free-form jelas, larang placeholder

Tiga tingkatan yang semuanya diterima di KCI, dari yang paling terstruktur ke yang
paling bebas:

### A. Conventional-commits (**dianjurkan** untuk perubahan yang satu topik)

Format:

```
<type>(<scope>): <deskripsi>

[isi pesan (opsional): mengapa, dampak, catatan]
```

- **`type`** memakai *keyword* EN (lihat §2).
- **`scope`** memakai *kebab-case* Bahasa Indonesia dari daftar kanonik (§3) atau nama
  folder/area baru yang paling dekat.
- **`deskripsi`** Bahasa Indonesia, huruf kecil setelah `:`, tanpa akhiran titik,
  *imperative mood* (lihat §4).
- Contoh yang sudah ada di riwayat (tidak perlu diubah):
  - `fix(papan-interaktif): rapikan logika editor posisi, tata letak, dan menu aksi`
  - `feat(analisa): panel distribusi manusia (Maia) di Deteksi engine`
  - `perf(papan-interaktif): cat papan tanpa menunggu buku pembukaan (PageSpeed 65)`
  - `fix(seo): rapikan metadata dan sitemap`

### B. Free-form Bahasa Indonesia yang jelas (**diizinkan**)

Perubahan yang sulit diringkas dalam satu kata *type* boleh memakai judul kalimat
biasa dalam Bahasa Indonesia, asalkan:

- Menyebut **apa yang berubah** dan **di mana** (minimal menyebut fitur/halaman).
- Tidak diawali kata generik tanpa isi: *"Perbaiki", "Ubah", "Update", "Tambah"*
  tanpa objek yang jelas (boleh "Perbaiki X" atau "Tambah Y", tidak boleh cuma
  "Perbaiki bug").
- Bahasa Indonesia baku, tanpa emoji, tanpa kata klise (`supercharge`, *"lebih
  baik"* tanpa penjelasan).
- Contoh yang sudah ada di riwayat (baik):
  - `Pulihkan desain PR 257, aktifkan tanda klik kanan, & batal pilih bidak di TekaTekiHarianLanding`
  - `Lencana gelar FIDE (GM/IM/FM/WGM/…) berupa SVG di Wawasan dan baris nama papan`
  - `Kanonik dinamis: satu tag canonical per halaman, selalu origin produksi`

### C. Placeholder (**DILARANG** untuk pesan commit dan judul PR yang di-merge)

Jangan pernah memakai pesan berikut sebagai judul atau subjek:

- `ruang kerja`, `workspace`, `wip`
- `fix`, `fixes`, `perbaikan` (tanpa objek)
- `update`, `pembaruan` (tanpa objek)
- `tambah`, `hapus` (tanpa objek)
- `asd`, `test`, `coba`, `tmp`, nomor tanpa keterangan
- Pesan yang dihasilkan otomatis oleh alat tanpa ditinjau (`merge branch ...`,
  `apply patch`, dll. — boleh untuk commit *merge* GitHub yang dihasilkan sistem,
  tetapi commit yang ditulis manusia harus menjelaskan inti perubahan)

Commit *work-in-progress* di cabang sendiri selama pengembangan boleh memakai
pesan sementara, tetapi **sebelum push ke PR dan sebelum merge**, judul PR (yang
menjadi subjek *squash commit* ke `main`) HARUS diperbarui menjadi salah satu
bentuk A atau B.

---

## 2. Daftar type (dalam bahasa EN, sesuai konvensi)

| Type | Kapan dipakai | Contoh di KCI |
| --- | --- | --- |
| `feat` | Fitur atau kemampuan baru untuk pengguna | `feat(teka-teki): API untuk halaman harian` |
| `fix` | Perbaikan perilaku yang salah | `fix(analisa): papan tampil selama analisis` |
| `perf` | Perubahan yang meningkatkan kinerja (bukan perilaku baru) | `perf(papan-interaktif): cat papan tanpa menunggu buku pembukaan` |
| `refactor` | Penyusunan ulang kode tanpa mengubah perilaku (pecah fungsi, ekstrak modul) | `refactor(analisa): pecah basisData.js dan pisahkan konteks papan` |
| `style` | Penyesuaian visual/formatting yang tidak mengubah perilaku (penyelarasan tata letak, CSS, typography, spacing) | `style(pengaturan): selaraskan UI pengaturan Teka-Teki` |
| `docs` | Perubahan pada dokumentasi, README, panduan, komentar kepala modul | `docs(analisa): README jadi sumber kebenaran` |
| `test` | Menambah atau memperbaiki uji; tidak mengubah kode produksi | `test(papan-interaktif): tambah uji drag bidak dari posisi awal` |
| `ci` | Perubahan workflow CI, konfigurasi deploy, Vite/Vercel/build pipeline | `ci: naikkan timeout job quality menjadi 20 menit` |
| `build` | Perubahan dependensi, tooling build, konfigurasi paket yang memengaruhi artefak | `build(deps): naikkan vite ke 6.x` |
| `chore` | Tugas rumah tangga yang tidak menyentuh kode produksi atau uji (pembersihan file, pembaruan `.gitignore`) | `chore: hapus berkas sementara hasil uji` |
| `revert` | Mengembalikan commit sebelumnya; sebutkan SHA yang dikembalikan | `revert: pulihkan perilaku papan sebelum 85ddcfa` |

*Rule of thumb*: bila ragu antara `refactor` dan `style`/`fix`, pilih berdasarkan apa
yang pengguna lihat. Jika perilaku berubah → `fix`; jika tampilan berubah tanpa
perilaku → `style`; jika hanya kode yang dibaca pengembang yang berubah → `refactor`.

---

## 3. Daftar scope kanonik (Bahasa Indonesia, kebab-case)

Pilih scope yang paling dekat. Jika perubahan menyentuh beberapa area, pilih area
dominan (jangan dipaksa memasukkan semuanya); area lain bisa dijelaskan di isi
pesan. Scope baru boleh ditambahkan sesuai kebutuhan; gunakan nama folder di
`src/halaman/` atau area yang jelas.

**Area fitur utama (selaras `src/halaman/`):**
`analisa`, `papan-interaktif`, `teka-teki`, `teka-teki-harian`, `teka-teki-rush`,
`quiz`, `manusia-vs-mesin`, `hand-brain`, `turing`, `latihan-repertoar`, `pembukaan`,
`landing`, `beranda`, `tentang-kami`, `program-kami`, `pendaftaran`, `anggota`,
`pengurus`, `turnamen`, `media`, `hubungi-kami`, `karir`, `keberlanjutan`, `ebook`,
`wawasan`.

**Area teknis lintas-fitur:**
`ui`, `papan` (bidak, papan statis, aset set bidak), `komentator`, `engine`,
`anticheat`, `seo`, `i18n`, `database` (IndexedDB + Supabase), `api` (rute server
yang lintas domain), `auth`, `keamanan`, `css` (token desain, Tailwind,
`src/index.css`), `gambar`, `suara`, `pdf`.

**Area infra & tooling:**
`ci`, `build`, `deps`, `dokumen` (markdown, README, panduan), `skill` (berkas
di `.agents/skills/` dan `.opencode/skills/`), `skrip` (berkas di `scripts/` dan
`server/uji/`).

Scope yang sudah pernah dipakai di riwayat yang perlu diselaraskan:
- Gunakan `papan-interaktif`, bukan `papan` sendirian (kecuali benar-benar hanya
  menyentuh komponen papan generik tanpa mode).
- Gunakan `pengurus`, bukan singkatan lain untuk area dashboard admin.
- Gunakan `teka-teki` untuk area teka-teki umum, `teka-teki-harian` dan
  `teka-teki-rush` bila perubahan khusus satu mode.
- Gunakan `keamanan` (bukan `security`) dan `anggota` (bukan `member`) agar
  konsisten dengan bahasa folder dan kode.

---

## 4. Aturan penulisan

1. **Bahasa**: *type* EN; *scope* dan *deskripsi/body* Bahasa Indonesia baku.
   Istilah teknis yang tidak lazim padanannya (`worker`, *callback*, *callback*,
   `FEN`, `PGN`, `SAN`, `UCI`, *Lighthouse*, *bundle*, *squash*) boleh dipakai
   apa adanya.
2. **Huruf kecil** setelah `:` (sesuai standar *conventional-commits* dan konsisten
   dengan seluruh riwayat KCI yang sudah memakainya). Jangan kapitalisasi huruf
   pertama kecuali kata tersebut memang nama diri atau istilah (mis. *FIDE*,
   *Maia*, *Chess.com*, *Lichess*, *Stockfish*).
3. **Panjang subjek** (*subject line*) **sekitar 72 karakter**; boleh lebih jika
   kejelasan membutuhkan (mis. perlu menyebut nama dua mode atau nomor PR).
   Prioritaskan kejelasan daripada kepatuhan buta pada batas.
4. **Tanpa titik** di akhir subjek.
5. **Imperative mood** (bentuk perintah): *"tambahkan"*, *"perbaiki"*, *"pecah"*,
   *"hapus"*, *"rapikan"*, *"selaraskan"* — bukan *"menambahkan"*, *"menambah"*,
   *"telah menambahkan"*, *"ditambahkan"*.
6. **Jelaskan MENGAPA di body, bukan hanya APA**, bila perubahannya tidak jelas
   dari subjek. Bila perubahan satu-baris atau sudah jelas dari subjek, body
   tidak dibutuhkan.
7. **Tanpa emoji** di mana pun (subjek, body, PR title, komentar review) — sesuai
   `AGENTS.md`.
8. **Tanpa karakter `<` dan `>` mentah** di pesan commit (parser tooling KCI
   memperlakukan keduanya sebagai pembatas). Gunakan `-` atau tanda kurung biasa
   bila perlu mengapit sesuatu.
9. **Sebut nomor PR/issue terkait** di body bila merujuk (mis. `Memulihkan
   perubahan visual dari PR #257 yang tergeser di #259`). Nomor diawali `#`
   (yang diapit kurung, bukan `<>`).
10. **Satu perubahan logis per commit.** Bila pekerjaan menyentuh dua area yang
    tidak berhubungan, pisahkan menjadi dua commit dengan `git add -p`.

### Body pesan (opsional)

Bentuk body yang paling berguna adalah poin-poin yang menjelaskan:
- Mengapa perubahan dilakukan (bug, regresi, target Lighthouse, utang teknis).
- Bagaimana perubahan memengaruhi perilaku yang ada (breaking behavioural —
  KCI tidak punya konsumen API publik, jadi *BREAKING CHANGE* footer hampir tidak
  pernah dipakai; cukup sebut di body jika ada perilaku yang sengaja diubah).
- Apa yang *tidak* diubah (bila relevan untuk pembaca nanti).
- Perintah uji yang dijalankan (opsional; bukti verifikasi yang menyertai PR
  diatur di `kci-standar-kode`).

Contoh body yang baik:

```
fix(papan-interaktif): batal pilih bidak saat klik di luar petak

Sebelumnya bidak yang sudah diklik tetap "terpilih" sampai bidak lain
diklik, sehingga pemain pemula bisa salah langkah ketika salah klik
lalu mengira pilihan telah dibatalkan.

Perubahan ini menambahkan handler di lapisan papan yang me-reset pilihan
bila klik jatuh di petak kosong tanpa langkah sah yang sesuai warna.

Uji: npm run uji:lencana-skakmat && npm run uji:tanda-papan
```

---

## 5. Dilarang / yang harus dihindari

Selain placeholder di §1.C:

- **Emoji** di pesan commit, judul PR, atau isi PR (aturan global KCI).
- **Karakter `<` dan `>` mentah** — bisa memecah parser tooling; gunakan tanda
  kurung biasa atau strip.
- **Pesan generik** yang tidak menyebut objek: *"fix bug"*, *"update kode"*,
  *"minor changes"*, *"beberap perbaikan"*, *"penyempurnaan"*.
- **Daftar file yang diubah** di subjek (*"ubah App.jsx dan Header.jsx"*) —
  subjek harus menjelaskan perubahan, bukan lokasi; lokasi sudah ada di scope
  atau di diff. Nama file yang diubah boleh disebut di body jika membantu
  (mis. "logika dipindahkan dari `PapanTekaTeki.jsx` ke `papan/logika.js`").
- **Informasi palsu/hiperbol**: *"sangat meningkatkan performa"* tanpa ukuran,
  *"memperbaiki semua bug"*, *"refactor total"*.
- **Menyalahkan**: *"kesalahan sebelumnya"*, *"workaround karena si X"*,
  *"bodohnya saya lupa"*. Catat fakta, bukan celaan.
- **Menyertakan token, rahasia, atau data pribadi** di pesan (pesan commit
  bersifat permanen dan publik bila repo publik).
- **Commit dengan identitas agen/bot** (lihat §6).

---

## 6. Identitas penulis commit

Sesuai `AGENTS.md` bagian "Commit dan push":

- Penulis commit harus cocok dengan akun GitHub yang punya akses proyek.
  Commit dengan `user.name`/`user.email` agen atau bot akan ditolak Vercel dan
  harus dibersihkan manual oleh pemilik proyek.
- Jangan pernah commit dengan `GIT_AUTHOR_NAME`/`GIT_COMMITTER_NAME`/
  `GIT_AUTHOR_EMAIL`/`GIT_COMMITTER_EMAIL` yang beridentitas agen/bot
  (termasuk varian `git -c user.name=…` yang menyetel identitas bot).
- Jika diragukan, cek `git config user.name` dan `git config user.email`
  sebelum commit; bila belum sesuai, tanya pengguna untuk menyetelnya atau
  tunda commit sampai diizinkan.
- Jangan push kecuali diminta eksplisit. Satu push per tugas selesai, bukan
  per commit (aturan `AGENTS.md` dan `kci-deploy`).

---

## 7. Alur kerja (ketika diminta menulis pesan atau menyiapkan PR)

1. **Pastikan apa yang akan di-commit**
   - `git status` untuk melihat perubahan.
   - `git diff --staged` (bila sudah ada yang *staged*) atau `git diff` untuk
     melihat isi perubahan.
   - Jika ada berkas yang tidak seharusnya ikut (log, berkas sementara,
     *build artifact*), jangan tambahkan ke *stage*.
2. **Pastikan identitas penulis benar** (§6).
3. **Pastikan perubahan lolos uji minimum** (`kci-pengujian`, dijalankan sebelum
   commit sesuai `kci-standar-kode §3`). Jangan mengklaim uji lolos tanpa bukti
   perintah yang dijalankan.
4. **Tentukan bentuk pesan** (A atau B):
   - Gunakan bentuk A (conventional) bila perubahan memiliki satu *type* dan
     *scope* yang jelas.
   - Gunakan bentuk B (free-form) bila perubahan melintasi banyak area atau
     lebih mudah dijelaskan dalam satu kalimat panjang yang jelas.
5. **Tulis subjek** dan body (bila perlu) mengikuti aturan §4.
6. **Review ulang subjek** sebelum commit: apakah ada orang lain (atau Anda enam
   bulan lagi) bisa mengerti apa yang berubah hanya dengan membaca baris itu
   di `git log --oneline`? Jika tidak, perjelas.
7. **Ketika menyiapkan PR**:
   - Judul PR menjadi subjek *squash commit* yang masuk ke `main` (karena merge
     di repo ini memakai *squash* via GitHub). Judul PR adalah yang paling
     penting untuk dibuat jelas.
   - Deskripsi PR menyertakan bukti uji dan perubahan perilaku sesuai
     `kci-standar-kode` "Bukti yang menyertai PR" dan temuan `kci-review`.
   - **Jangan** biarkan judul PR berisi *placeholder* cabang ("ruang kerja") —
     selalu sunting sebelum meminta *review* atau menekan merge.
8. **Saat membantu menulis pesan untuk pengguna**:
   - Sajikan beberapa opsi (satu conventional, satu free-form singkat) bila
     ada keraguan.
   - Jangan jalankan `git commit` atau `git push` tanpa perintah eksplisit
     pengguna (bahkan ketika diminta bantuan menulis pesan — hasilkan
     pesannya, biarkan pengguna yang memutuskan kapan men-*commit*).
   - Jangan ubah pesan commit terakhir (`git commit --amend`) tanpa izin
     eksplisit.

---

## 8. Checklist pesan yang siap pakai

- [ ] Subjek menjelaskan apa yang berubah dan di mana (minimal menyebut fitur).
- [ ] Bukan placeholder (§1.C) dan bukan satu kata generik tanpa objek.
- [ ] *Imperative mood*, huruf kecil setelah `:`, tanpa titik di akhir.
- [ ] Bahasa Indonesia baku (kecuali *type* EN dan istilah teknis).
- [ ] Tanpa emoji dan tanpa `<` / `>` mentah.
- [ ] Tidak menyebut rahasia, token, atau celaan.
- [ ] Panjang subjek sekitar 72 karakter; lebih panjang bila demi kejelasan.
- [ ] Identitas penulis commit sesuai akun pengguna yang punya akses proyek.
- [ ] Uji minimum area terkait sudah dijalankan dan lolos (bukti dicantumkan
      di deskripsi PR, bukan di pesan commit).
- [ ] Judul PR (yang akan menjadi *squash* ke `main`) juga sudah jelas — bukan
      *placeholder* "ruang kerja" atau "wip".
