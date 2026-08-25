# Laporan Review: Halaman Teka-Teki & Pembukaan

Tanggal: 25 Agustus 2026 (revisi 2 — tambahan temuan panah papan terbalik + perbaikan diterapkan)
Lingkup: `/teka-teki` (pemain 5.486 soal), `/program-kami/pembukaan`, plus komponen bersama (`PapanTekaTeki`, `PanelEngine`, `gunakanEngineCatur`, `engineCatur`) dan data pendukung.

Metode: baca kode lengkap, validasi data dengan `chess.js`, replika logika komponen untuk membuktikan bug, `npm run build`, uji rute & uji i18n bawaan, dan verifikasi klaim konten terhadap `public/data/buku-pembukaan.json` milik situs sendiri.

---

## Ringkasan

| # | Berat | Lokasi | Temuan |
|---|-------|--------|--------|
| 1 | 🔴 Tinggi | `TekaTeki.jsx:1015,1025` | Tombol maju `>` dan `>\|` **tidak pernah bisa aktif** (selalu `disabled`) |
| 2 | 🔴 Tinggi | `TekaTeki.jsx:522` | Promosi di ply tengah menerima **bidak promosi apa pun** → barisan menyimpang → soal jadi tak bisa diselesaikan |
| 3 | 🟠 Sedang | `TekaTeki.jsx:604` | Balasan komputer gagal dimainkan tapi **`sisa` tetap berkurang** (catch kosong) → posisi & counter saling lepas, pemain berpindah memegang bidak lawan |
| 4 | 🟠 Sedang | `TekaTeki.jsx:351,356` | Syzygy: flag gagal **tidak direset saat sukses** + data posisi lama tampil untuk posisi baru |
| 5 | 🔴 Tinggi | `PapanTekaTeki.jsx` (`pusatPetak`) | **Panah di papan terbalik tampil di petak yang salah** (cerminan horizontal) — ✅ *sudah diperbaiki, lihat bagian 12* |
| 6 | 🟡 Ringan | `TekaTeki.jsx:164` | Default warna papan `"hijau"` tidak ada di daftar pilihan → dropdown tampil kosong |
| 7 | 🟡 Ringan | `TekaTeki.jsx` (header soal) | "Soal {problemid} / {soal.length}" salah total saat filter aktif (mis. "Soal 2451 / 1377") |
| 8 | 🟡 Ringan | `TekaTeki.jsx:1271,1294` + tombol Flip | Teks hardcoded Inggris di situs dwibahasa |
| 9 | 🔵 Minor | `Pembukaan.jsx:80,126` | Kode ECO salah: posisi 3.Bb5 adalah **C60**, bukan C70 |
| 10 | 🔵 Minor | `Pembukaan.jsx:139` | Chip langkah berikutnya mencampur langkah Putih yang belum legal |
| 11 | 🔵 Minor | `terjemahan.*.js:511-512` | Klaim "3.810 jalur" tidak cocok dengan data (18.713 baris / 3.364 nama unik) |
| 12 | ⚪ Catatan | beberapa | Timer auto-next tidak dibatalkan saat navigasi manual; dialog promosi muncul untuk drop ilegal; kedip pesan "tidak ada soal" saat filter; warna pratinjau panah selalu oranye |

Yang **sudah dicek dan baik**: seluruh 5.486 soal valid (semua langkah legal, posisi akhir skakmat, jumlah ply sesuai tipe `Mate in One/Two/Three`, giliran cocok dengan FEN, ID unik 1–5486, format `e2-e4` konsisten); paritas kunci i18n ID/EN (680 = 680) dan semua kunci dinamis (tema, syzygyKat, promosi, nama bidak) lengkap; `npm run build`, `uji:rute` (29 rute), dan `uji:i18n` lulus semua.

---

## 🔴 1. Tombol navigasi maju `>` dan `>|` tidak pernah bisa ditekan

**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx:1015` dan `:1025`

```jsx
disabled={!selesai || komputer || posisiLangkah >= langkahPenuh.length}
```

**Bukti (analisis keadaan):**
- `selesai === true` hanya disetel di `cobaLangkah` ketika `sisaBaru.length === 0` → saat itu `posisiLangkah = langkahPenuh.length` → suku ketiga membuat tombol mati.
- `mundurLangkah` (dan `keAwalLangkah`/`terapkanSoal`) menyetel `setSelesai(false)` → suku pertama `!selesai` membuat tombol mati.
- Tidak ada keadaan di mana `selesai === true` **dan** `posisiLangkah < langkahPenuh.length` tercapai bersamaan.

**Dampak:** alur "selesaikan soal → mundur untuk meninjau solusi → maju lagi" mustahil dilakukan. Dua tombol adalah elemen mati di UI.

**Saran perbaikan:** ganti syarat menjadi `disabled={komputer || posisiLangkah >= langkahPenuh.length}` (buat tombol maju hanya mengikuti posisi), dan jangan reset `selesai` di `mundurLangkah` — atau lacak "pernah selesai" terpisah dari posisi.

---

## 🔴 2. Promosi tengah barisan menerima bidak promosi salah → soal jadi tak bisa diselesaikan

**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx:520-523` (`cobaLangkah`)

```js
} else if (from === diharapkan.from && to === diharapkan.to) {
  lanjut = terapkan(fen, { from, to, promo: promo || diharapkan.promo });
}
```

Untuk ply **tengah**, hanya `from`/`to` yang dibandingkan; bidak promosi pilihan pemain diterima apa adanya. Pemain yang memilih kuda saat solusi menghendaki menteri akan dinyatakan **"Benar"**, tetapi posisi kini berbeda dari barisan solusi.

**Reproduksi (replika persis logika komponen + chess.js, soal #1626 `g6-g7 h8-h7 g7-g8q h7-h6 g8-g6`):**
1. Ply 1–2 benar sesuai barisan.
2. Ply 3: pemain mempromosikan `g7-g8` memilih **kuda** → diterima ("Benar") padahal solusi `q`.
3. Kini kuda di g8 menutup petak h6 → balasan komputer `h7-h6` **ilegal** → jatuh ke bug #3.
4. Barisan tak pernah sampai skakmat; langkah terakhir hanya diterima bila `isCheckmate()` → soal **tidak mungkin diselesaikan**; semua percobaan dihitung salah; pemain harus `|<` atau "Lewati".

14 soal memuat promosi di ply tengah dan terdampak: #1626, #1904, #2209, #2261, #2663, #3359, dan 8 lainnya.

**Saran perbaikan:** untuk ply tengah, paksa bidak promosi solusi (abaikan pilihan pemain) atau tolak bila `promo !== diharapkan.promo`:

```js
lanjut = terapkan(fen, { from, to, promo: sisa.length === 1 ? promo : diharapkan.promo });
```

---

## 🟠 3. Balasan komputer gagal → `sisa` tetap berkurang (desinkron posisi vs. counter)

**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx:596-611` (efek giliran komputer)

```js
try {
  const g = terapkan(fen, diharapkan);
  setFen(g.fen()); /* … */
} catch {}
setSisa((s) => s.slice(1));   // ← tetap dieksekusi walau langkah GAGAL
setKomputer(false);
```

Bila `terapkan` melempar (langkah balasan ilegal — persis skenario bug #2), `catch` kosong menelan error, lalu `sisa` tetap dipotong. Akibatnya papan (masih giliran Hitam) dan `sisa` (sudah dianggap giliran pemain lagi) saling lepas: **pemain mendadak memegang bidak lawan** (`pilihPetak` menerima bidak dengan warna `game.turn()`), dan alur solusi hangus.

**Saran perbaikan:** pindahkan pemotongan `sisa` ke dalam blok `try` setelah langkah sukses; bila gagal, kembalikan ke posisi soal (`terapkanSoal(masalah)`) sebagai jaring pengaman.

---

## 🟠 4. Panel Syzygy: flag gagal menempel & data basi antar-posisi

**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx:308-337` (efek fetch) dan blok render Syzygy

Dua masalah pada efek yang sama:

1. **Sukses tidak mereset gagal.** `catch` menyetel `setSyzygyGagal(true)`, tetapi jalur sukses (`setSyzygy(data)`, baris 351) tidak pernah memanggil `setSyzygyGagal(false)`. Render memprioritaskan `syzygyGagal`, jadi **sekali gagal, "analisis gagal" tampil terus** untuk sisa soal itu — walau request berikutnya sukses. Karena API tablebase mengembalikan 404 untuk posisi >7 bidak (mayoritas soal di awal partai), hampir semua soal mulai dengan "gagal", dan ketika barisan solusi memasuki posisi ≤7 bidak yang sebenarnya berhasil dianalisis, panel tetap menampilkan gagal.
2. **Data basi saat fen berganti.** `syzygy` tidak dibersihkan saat `fen` berubah; selama debounce 300 ms + fetch berjalan, panel menampilkan kategori/DTZ/DTM dan daftar langkah **posisi sebelumnya** untuk posisi yang baru — menyesatkan pemain.

**Saran perbaikan:** di awal efek fetch: `setSyzygy(null); setSyzygyGagal(false);` dan di jalur sukses: `setSyzygy(data); setSyzygyGagal(false);`.

---

## 🔴 5. Panah pada papan terbalik tampil di petak yang salah — ✅ SUDAH DIPERBAIKI

**Lokasi:** `src/halaman/TekaTeki/PapanTekaTeki.jsx` — fungsi `pusatPetak()` (lapisan SVG panah di atas papan)

**Gejala (laporan pengguna):** panah yang digambar dari kotak h1 muncul di kotak lain (a1/a7/dll.).

**Akar masalah:** grid CSS papan disusun oleh `daftarPetak()`, yang saat orientasi terbalik membalik urutan lajur — `[...FILE].reverse()` (kotak h berada di kolom paling kiri). Namun `pusatPetak()` — penghitung titik koordinat untuk **semua** poligon panah SVG — hanya membalik sumbu-y dan memakai `FILE.indexOf()` mentah untuk sumbu-x. Hasilnya seluruh lapisan panah **tercerminkan horizontal** terhadap gridnya sendiri.

**Bukti (simulasi koordinat, papan terbalik):**

| Panah digambar dari → ke | Pusat panah dirender jatuh di |
|---|---|
| h1 | **a1** ❌ |
| e4 | **d4** ❌ |
| a8 | **h8** ❌ |
| h1 → a8 (diagonal panjang) | **a1 → h8** (diagonal seberang) ❌ |

**Kapan terjadi:** orientasi `"b"` otomatis diterapkan untuk setiap soal "Black to Move" (**2.563 dari 5.486 soal**, 47%) dan saat tombol Flip ditekan. Orientasi normal ("w") tidak terpengaruh — itulah mengapa tidak selalu terlihat.

**Yang terdampak:** panah tanda pengguna (klik-kanan-seret), pratinjau panah saat menyeret, **dan** panah saran engine (biru) — semuanya digambar lewat `pusatPetak()`. Sorotan petak (petunjuk/langkah terakhir/kesalahan) aman karena menempel ke tombol kotak, bukan ke SVG.

**Perbaikan yang diterapkan** (satu baris + komentar):

```js
const kolomLayar = orientasi === "w" ? kolom : 7 - kolom;
return {
  x: (kolomLayar + 0.5) * 12.5,
  y: (orientasi === "w" ? 8 - baris + 0.5 : baris - 0.5) * 12.5,
};
```

**Verifikasi pasca-perbaikan:** seluruh 64 petak × 2 orientasi kini memetakan pusat panah tepat di kotaknya (cek otomatis 128 kasus lulus); contoh pengguna h1→a8 pada papan terbalik kini dirender benar di h1 → a8; `npm run build` bersih.

**Catatan kecil terkait (belum diubah):** warna pratinjau panah selalu oranye (`warna: "bawaan"`) meskipun panah final akan diberi warna merah/hijau/biru sesuai tombol pengubah (Shift/Ctrl/Alt) — kosmetik saja, posisinya sudah benar setelah perbaikan ini.

---

---

## 🟡 6. Default warna papan `"hijau"` tidak ada di daftar pilihan

**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx:152-165` (`bacaWarnaPapan`) vs. `PILIHAN_WARNA_PAPAN` (baris 96-108)

`bacaWarnaPapan()` memvalidasi nilai tersimpan terhadap `PILIHAN_WARNA_PAPAN` (blue, brown, …, metal — **tanpa** `hijau`), tetapi fallback-nya justru `"hijau"` — nilai yang sama-sama tidak ada di daftar. Akibatnya `<select>` terkontrol mendapat `value` tanpa pasangan `<option>` → **dropdown "Warna papan" tampil tanpa pilihan terpilih** saat kunjungan pertama. Papan sendiri kebetulan aman karena `PapanTekaTeki` punya fallback `TEMA_PAPAN.hijau`, tapi pilihan pengguna tidak terlihat di UI. (Halaman Papan Interaktif memakai default `"metal"` yang valid.)

**Saran perbaikan:** kembalikan `"green"` (atau tambahkan `["hijau", …]` ke `PILIHAN_WARNA_PAPAN`).

---

## 🟡 7. Penghitung "Soal n / total" salah saat filter aktif

**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx` (header soal & form "Buka")

Header memakai `{ n: masalah.problemid, total: soal.length }`. `problemid` adalah ID global (1–5486), `soal.length` adalah jumlah **hasil filter**. Contoh nyata: filter "Mate in One" → 1.377 soal, tetapi soal yang tampil bisa #2451 → header tampil **"Soal 2451 / 1377"**. Input "Buka" (1–total filter) juga memakai indeks hasil filter, tidak konsisten dengan `problemid` yang ditampilkan maupun yang disimpan di URL `?id=`.

**Saran perbaikan:** tampilkan indeks-dalam-daftar-aktif sebagai `n`, atau tampilkan total global dan sediakan input berbasis `problemid`.

---

## 🟡 8. Teks hardcoded bahasa Inggris di situs dwibahasa

**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx`

- Baris 1271: `Automatically load the next puzzle after each attempt` (label checkbox lanjut-otomatis — seluruh teks di sekitarnya sudah lewat `t()`).
- Baris 1294: judul panel `Syzygy Tablebase`.
- Tombol `Flip` (label terlihat hardcoded; `title`/`aria-label` sudah pakai `t("papan.flip")` = "Balik Papan").

Pengguna bahasa Indonesia melihat campuran Inggris. Kunci `tekaTeki.*` tinggal ditambahkan di `terjemahan.id.js`/`terjemahan.en.js`.

---

## 🔵 9. Halaman Pembukaan: kode ECO salah (C70 seharusnya C60)

**Lokasi:** `src/halaman/ProgramKami/Pembukaan.jsx:80` (`Ruy Lopez (C70)`) dan `:126` (badge `C70`)

Posisi yang dipamer adalah 1.e4 e5 2.Nf3 Nc6 3.Bb5 **sebelum** 3...a6. Verifikasi terhadap `public/data/buku-pembukaan.json` milik situs sendiri:

```
jalur 'e2e4 e7e5 g1f3 b8c6 f1b5'          → C60 Ruy Lopez
jalur yang sama + 'a7a6'                  → C70 Ruy Lopez: Morphy Defense
```

C70 baru melekat setelah 3...a6 — dan memang chip `a6` di halaman itu adalah langkah yang membawa *ke* C70. Badge dan kalimat info seharusnya **C60**.

---

## 🔵 10. Halaman Pembukaan: chip "Langkah berikutnya" mencampur langkah yang belum legal

**Lokasi:** `src/halaman/ProgramKami/Pembukaan.jsx:139-141`

Chip `Ba4` dan `Bxc6` hanya legal **setelah** 3...a6, sedangkan `a6/Nf6/d6/f5` adalah langkah Hitam; pada posisi yang dipamer giliran Hitam sehingga `Ba4/Bxc6` tidak legal. Panel saran di papan interaktif hanya menawarkan langkah legal giliran aktif — demo statis ini tidak konsisten dengannya. Saran: urutkan sebagai barisan ("3...a6 4.Ba4 …") atau tampilkan hanya langkah Hitam.

---

## 🔵 11. Klaim "katalog 3.810 jalur pembukaan" tidak cocok dengan data

**Lokasi:** `src/lib/terjemahan.id.js:512`, `terjemahan.en.js:511`

Data `buku-pembukaan.json` berisi **18.713 baris** (dengan banyak duplikat nama) dan **3.364 nama unik (ECO+nama)** — 3.810 bukan keduanya. Ubah salinannya (mis. "3.300+ nama pembukaan" atau hitung dinamis dari katalog).

---

## ⚪ 12. Catatan tambahan (minor)

- **Timer auto-next tidak dibatalkan saat navigasi manual** (`TekaTeki.jsx:549-556`): bila pemain menyelesaikan soal dengan mode otomatis lalu menekan "Lewati" dua kali dalam 1,2 detik, timer lama (dengan `indeks` basi) melompatkannya **ke belakang**. Batalkan `timerOtomatis` di `pindahSoal`.
- **Dialog promosi muncul untuk drop ilegal**: `selesaiSeret` → `cobaLangkah` memeriksa `butuhPromosi` sebelum kelegaan langkah dicek, jadi pawn yang dijatuhkan ke petak tak sah di baris terakhir tetap memunculkan dialog, baru ditolak dengan getaran "salah". Validasi `sasaran.includes(to)` dulu akan lebih rapi.
- **Kedip pesan "tidak ada soal"**: saat filter mengubah daftar menjadi lebih pendek dari `indeks`, ada satu render dengan `masalah === undefined` sebelum efek penjepit (`safeIdx`) jalan → pesan kuning "tidak ada soal" berkedip sejenak.
- **Inkonsistensi kecil `PapanTekaTeki`**: tanda klik-kanan dilarang saat `membeku` (giliran komputer) tetapi diizinkan saat `terkunci` (soal selesai) — sebaiknya diseragamkan.

---

## Yang diverifikasi dan dinyatakan BAIK

- **Data soal (5.486 entri):** semua FEN valid; seluruh langkah legal menurut `chess.js`; posisi akhir selalu skakmat; jumlah ply selalu 1/3/5 sesuai `Mate in One/Two/Three`; `first` selalu cocok dengan giliran FEN; ID unik dan berurutan; format langkah `e2-e4[qrbn]` konsisten (cocok dengan `parseLangkah`).
- **Logika pemecahan soal inti:** validasi langkah tengah `from/to`, penerimaan "skakmat apa pun" untuk langkah terakhir (menghargai solusi alternatif), jalur undo/redo `jalurFen` konsisten, pemulihan posisi via localStorage & `?id=`.
- **i18n:** 680 kunci ID = 680 EN; semua kunci statis & dinamis yang dipakai kedua halaman ada (termasuk placeholder `{x}`/`{label}` di `bukuPembukaan.infoTeks`).
- **Geometri & konten papan Pembukaan:** posisi Ruy Lopez benar; sorotan `f1`/`b5` benar; koordinat panah SVG f1→b5 akurat terhadap orientasi papan; varian thumbnail dekoratif aman.
- **Build & uji bawaan:** `npm run build` bersih; `uji:rute` (29 rute publik selaras) dan `uji:i18n` lulus.
