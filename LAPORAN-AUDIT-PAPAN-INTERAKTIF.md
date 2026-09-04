# Laporan Audit — Halaman Papan Interaktif

Tanggal: 4 September 2026
Cakupan: `src/halaman/PapanInteraktif/PapanInteraktif.jsx` (2.100+ baris) beserta
ketergantungannya (`PapanTekaTeki`, `gunakanEngineCatur`, `PanelEngine`,
`artikelWikipedia`, `namaPembukaan`, kamus terjemahan) sesudah commit
`a4a9b75 feat(papan-interaktif): rombak jadi papan analisa gelap full-screen`.

Metode: pembacaan kode baris-per-baris, `npm run build`, seluruh `npm run uji`,
plus uji regresi baru yang mem-*mount* halaman sungguhan di jsdom dan
menggerakkan papan lewat klik DOM (`scripts/uji-papan-interaktif.mjs`).

---

## 1. Ringkasan

| Kategori | Status |
| --- | --- |
| Build produksi (`npm run build`) | ✅ lulus |
| Rangkaian uji repo (`npm run uji`) | ✅ lulus (termasuk uji baru) |
| Keamanan (XSS, tautan luar, rahasia, CSP) | ✅ tidak ditemukan masalah |
| Kestabilan (crash) | ❌ **1 crash berat ditemukan → sudah diperbaiki** |
| Kebenaran state papan | ❌ 3 bug ditemukan → sudah diperbaiki |
| Kontrol mati / kode mati | ❌ 1 tombol mati → sudah diperbaiki |
| Internasionalisasi (ID/EN) | ⚠️ 16 teks masih keras di kode → sudah dipindah ke kamus |
| Aksesibilitas | ⚠️ sebagian diperbaiki, sisanya jadi rekomendasi |

---

## 2. Temuan kritis (sudah diperbaiki)

### K-1 · Halaman mati total (layar putih) setelah membuat cabang baru — **berat**

Alur pengguna: main `1.e4 e5` → tekan **Mundur** → main `1…c5` → tekan **Ke akhir**.

Sebabnya, setiap langkah baru selalu *ditambahkan* ke `riwayatLengkap`
(`setRiwayatLengkap((lama) => [...lama, san])`) tanpa memotong langkah yang ada
di depan posisi sekarang. Isi `riwayatLengkap` jadi `["e4","e5","c5"]` — deret
yang tidak legal. Fungsi `keAkhir()` lalu memutar ulang deret itu **tanpa**
`try/catch`, sedangkan chess.js v1 *melempar* `Error: Invalid move: c5`. Karena
lemparan itu terjadi di dalam *updater* `setJalur`, React membongkar seluruh
pohon komponen: pengguna melihat halaman kosong dan harus me-*refresh*.

Bukti sebelum perbaikan (dari uji baru):

```
Error: Invalid move: c5
    at Chess.move (chess.js)
    at basicStateReducer → updateReducer → PapanInteraktif
```

Perbaikan:
* langkah baru sesudah *undo* memotong sisa baris (`setRiwayatLengkap([...riwayat, san])`);
* semua replay langkah lewat satu fungsi `posisiDariSan()` yang defensif —
  langkah tak legal menghentikan replay, tidak pernah melempar;
* `keAwal`/`undo`/`redo`/`keAkhir` kini hanya pembungkus tipis `keLangkah(ply)`
  sehingga `fen`, `riwayat`, dan `jalur` mustahil saling bertentangan.

### K-2 · Posisi kustom (FEN) hilang saat navigasi — **sedang-berat**

Setiap fungsi navigasi memutar ulang langkah dari **posisi awal standar**
(`new Chess()`), padahal dialog Review bisa memuat FEN apa pun. Setelah memuat
studi akhir permainan lalu menekan **Mundur** atau **Ke awal**, papan melompat
ke posisi awal catur — analisisnya hilang. Ikon kualitas langkah dan daftar
bidak tertangkap juga salah hitung untuk posisi kustom.

Perbaikan: state baru `fenDasar` menjadi titik awal semua replay
(navigasi, ikon langkah terakhir, hitung tangkapan). Posisi kustom otomatis
ditandai "di luar buku" karena pohon pembukaan tidak berlaku di sana.

### K-3 · PGN yang disalin tidak sah untuk posisi kustom — **sedang**

`susunPgn()` selalu menomori dari `1.` dan tidak pernah menulis tag `[FEN]`,
sehingga PGN hasil salinan dari posisi kustom tidak bisa dibuka kembali di
Lichess/Chess.com. Sekarang tag `[SetUp "1"]`/`[FEN "…"]` ikut ditulis dan
penomoran mengikuti posisi dasar (termasuk bentuk `12... Kd4` bila Hitam jalan).

Bonus: dialog Review kini juga **membaca** tag `[FEN "…"]` dari PGN yang
ditempel, dan PGN yang langkahnya tidak legal ditolak dengan pesan galat
(sebelumnya bisa termuat separuh tanpa pemberitahuan).

### K-4 · Tombol "Share" mati + kode tak terpakai — **ringan**

Tombol keempat di baris kontrol tidak punya `onClick` sama sekali (klik = tidak
terjadi apa-apa), sementara fungsi `salinFen()` dan state `fenTersalin` sudah
ditulis tetapi tidak pernah dipakai — sisa dari perombakan yang menghapus kotak
FEN di bawah papan. Keduanya sekarang disambungkan: tombol menyalin FEN posisi
dan memberi umpan balik "Tersalin".

---

## 3. Perbaikan lain yang ikut dikerjakan

| # | Temuan | Tindakan |
| --- | --- | --- |
| L-1 | 16 teks antarmuka keras di kode (`Analisa/Books/Explorer/Games`, `New/Save/Review/Share`, `Hitam/Putih`, judul & tombol dialog Review, "Lisensi & Atribusi") — situs dwibahasa, jadi versi EN tetap berbahasa Indonesia/Inggris campur | dipindah ke `papan.*` di `terjemahan.id.js` + `terjemahan.en.js` (paritas kunci diperiksa `npm run uji:i18n`) |
| L-2 | Dialog Review tidak bisa ditutup dengan **Esc** dan tidak memindahkan fokus ke dalam dialog | ditambah penanganan Esc + fokus awal ke area teks |
| L-3 | Tidak ada pintasan papan; papan analisa lazimnya bisa dinavigasi ←/→ | ditambah pintasan panah kiri/kanan (dinonaktifkan saat mengetik atau saat dialog terbuka) |
| L-4 | `select-none` di akar halaman membuat artikel Wikibooks di tab Penjelajah tidak bisa diseleksi/disalin | panel kanan diberi `select-text` |
| L-5 | Halaman tampil tanpa header situs (`PageLayout` → `TANPA_KERANGKA`), satu-satunya tautan keluar adalah "Lisensi & Atribusi" | brand di sidebar dijadikan tautan ke beranda |
| L-6 | Label engine tertulis "Stockfish 18", padahal yang dimuat `stockfish-18-lite-single` | diperbaiki jadi "Stockfish 18 Lite" |

---

## 4. Pemeriksaan keamanan (tidak ada temuan)

* **XSS** — tidak ada `dangerouslySetInnerHTML`/`innerHTML`/`eval` di halaman ini.
  Teks artikel Wikibooks dibersihkan (`bersihTeksArtikel`: buang tag HTML,
  komentar, templat wiki) lalu dirender sebagai teks React biasa.
* **Tautan luar** — `target="_blank"` selalu berpasangan dengan
  `rel="noopener noreferrer"`.
* **Gambar & jaringan** — hanya `wikibooks.org`/`wikipedia.org` dan aset sendiri;
  sudah masuk `connect-src`/`img-src` pada CSP di `vercel.json`.
* **Rahasia** — tidak ada kunci/token di halaman ini; engine berjalan lokal di
  peramban (Web Worker + WASM, `worker-src 'self' blob:` sudah diizinkan).
* **Masukan pengguna** — PGN/FEN hanya diproses chess.js dan tidak pernah
  dieksekusi; parser sudah dibungkus `try/catch`.
* **Penyimpanan** — halaman tidak menulis apa pun ke `localStorage`/cookie.

---

## 5. Rekomendasi lanjutan (belum diubah — perlu keputusan Anda)

1. **Nama brand "BlunderSkuad"** di sidebar. Nama ini tidak muncul di berkas lain
   mana pun dan tampak bawaan tata letak contoh yang dimigrasi. Bila memang bukan
   sub-brand resmi, ganti ke `t("common.namaKomunitas")` ("Komunitas Catur
   Indonesia"). Sengaja tidak saya ubah karena ini keputusan produk.
2. **Nama tab tertukar secara makna.** Tab "Penjelajah/Explorer" menampilkan
   artikel Wikibooks, sedangkan tabel statistik langkah lanjutan (yang di
   Lichess disebut *explorer*) ada di tab "Partai/Games". Pertimbangkan menukar
   label: Penjelajah = tabel langkah, Referensi/Teori = artikel.
3. **Preferensi papan tidak tersimpan.** Halaman Teka-Teki menyimpan set bidak &
   warna papan ke `localStorage`; papan interaktif melupakannya tiap kali dibuka.
   Menyamakan keduanya (pakai kunci yang sama) akan terasa lebih konsisten.
4. **Muatan data pembukaan 4,6 MB** (`public/data/buku-pembukaan.json`) diunduh
   dan diolah jadi pohon di *main thread* setiap kunjungan. Di ponsel kelas
   menengah ini terasa sebagai jeda awal. Opsi: pra-bangun pohonnya saat build,
   pecah per huruf ECO, atau pindahkan `pohonDariDaftar`+`susunKatalog` ke Web Worker.
5. **`snapshotEvalRef`** (Map FEN → evaluasi) tidak pernah dipangkas; pada sesi
   analisis panjang ia tumbuh terus. Cukup batasi mis. 500 entri (FIFO).
6. **Aksesibilitas tab**: bar tab memakai `<button>` polos. Menambahkan
   `role="tablist"/"tab"`, `aria-selected`, dan `aria-controls` akan membuat
   pembaca layar mengumumkan panel dengan benar. Dialog juga belum
   *focus-trap* penuh (Esc & fokus awal sudah ada).
7. **Duplikasi kode papan** dengan halaman Teka-Teki (promosi, tanda panah,
   pengaturan) sudah cukup besar; bila akan dikembangkan lagi, pertimbangkan
   mengangkatnya ke satu hook bersama.

---

## 6. Cara memverifikasi

```bash
npm run uji:papan     # uji regresi khusus papan interaktif (10 pemeriksaan)
npm run uji           # seluruh rangkaian uji repo — sudah termasuk uji di atas
npm run build         # build produksi
```

Uji `scripts/uji-papan-interaktif.mjs` mem-*mount* halaman sungguhan di jsdom
dengan buku pembukaan mini, lalu memeriksa: render papan 8×8, label tab dari
kamus, cabang baru sesudah *undo* tidak merobohkan halaman, tidak ada galat
konsol, FEN kustom bertahan saat navigasi mundur, dan pintasan panah bekerja.
Skrip melewati dirinya sendiri (exit 0) bila `jsdom`/`esbuild` tidak terpasang,
mengikuti pola `uji-analisa-ui.mjs`.
