# Kuis Catur — panduan mengelola daftar soal

Folder ini berisi halaman **Kuis Catur** (kuis pilihan ganda). Inspirasi mekanik
dan filosofi "mudah di-update lewat file data" diambil dari repo
[`denialromeo/borders-quiz`](https://github.com/denialromeo/borders-quiz),
tetapi isinya adalah **trivia seputar catur**, bukan kuis geografi.

> Repo borders-quiz memakai grafik "wilayah → tetangga" khusus geografi, jadi
> mekaniknya tidak bisa dipakai langsung untuk catur. Yang kita warisi adalah
> **struktur kuis berbasis data** yang gampang kamu kelola.

## Berkas utama

| Berkas | Isi |
| --- | --- |
| `daftar.js` | **Semua soal catur.** Inilah "file daftar quiz" yang kamu edit. |
| `QuizCatur.jsx` | Halaman/antarmuka kuis (markup — silakan kamu rapikan). |

## Skema satu soal (di `daftar.js`)

```js
{
  kategori: "peraturan",          // harus ada di DAFTAR_KATEGORI
  soal: "Teks pertanyaan…",        // bahasa Indonesia
  pilihan: ["Jawaban A", "Jawaban B", "Jawaban C", "Jawaban D"],
  kunci: 1,                        // INDEX jawaban benar (0 = A, 1 = B, dst.)
}
```

Contoh tambahan satu soal — cukup salin blok di atas ke dalam `SOAL_CATUR`:

```js
{
  kategori: "pembukaan",
  soal: "Sebutan pembukaan yang diawali 1.e4 e5 2.Kf3 Kc6 3.Gb5 adalah?",
  pilihan: ["Ruy Lopez", "Italian Game", "Queen's Gambit", "Reti"],
  kunci: 0,
},
```

## Cara cek data tetap valid

Setelah mengedit `daftar.js`, jalankan:

```bash
npm run uji:quiz
```

Perintah itu memeriksa: `kunci` menunjuk indeks yang sah, pilihan ≥ 2 & tidak
duplikat, dan nama kategori ada di `DAFTAR_KATEGORI`.

## Menambah kategori baru

1. Tambahkan id ke array `DAFTAR_KATEGORI` di `daftar.js`
   (mis. `{ id: "taktik", urutan: 6 }`).
2. Tambahkan labelnya ke kamus terjemahan agar tampil di layar:
   - `src/lib/terjemahan/id/quiz.js` → `quiz.kategori.taktik`
   - `src/lib/terjemahan/en/quiz.js` → `quiz.kategori.taktik`
3. Tambahkan ikonnya ke peta `IKON_KATEGORI` di `daftar.js` (mis.
   `taktik: "/images/color-icon/puzzle-piece.svg"`, berkas dari
   `public/images/color-icon/`). Kategori tanpa entri ikon akan tampil
   sebagai gambar kosong di navigasi kiri.

Label kategori, tombol (Mulai, Periksa, Lanjut), dan teks antarmuka lain berada
di berkas terjemahan (`id/quiz.js` & `en/quiz.js`), bukan di `daftar.js`.
