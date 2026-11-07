# Latihan Repertoar — catatan modul

Rute alat: `/papan-interaktif/latihan-repertoar` · halaman penjelas: `/program-kami/latihan-repertoar`
Satu rumah folder, tanpa impor dari rumah mode lain (`ManusiaVsMesin/`, `HandBrain/`, `TuringTest/`, `Analisa/`).

## Peta berkas

| Berkas | Isi |
| --- | --- |
| `LatihanRepertoar.jsx` | Halaman + lima tampilan: `koleksi`, `tambah`, `pembukaan`, `latihan`, `tantangan`, `statistik`. Semua state UI ada di sini. |
| `repertoarLogika.js` | Fungsi murni: pemilihan jalur buku, kartu per warna, jadwal SRS, progres, `rekonstruksiJalur`, `susunPohonCabang`, `ringkasStatistik`. |
| `repertoarStorage.js` | IndexedDB `kci-papan-repertoar` (store `kartu`) + cermin `localStorage` + tombstone. Satu-satunya tempat yang menulis kartu. |
| `tantanganLogika.js` | Aturan Mode Tantangan: susun soal, nilai langkah (benar/salah/waktu), poin, ringkasan, rekor `localStorage`. |
| `scripts/uji-repertoar.mjs` | Uji aturan murni (assert, tanpa DOM). |
| `scripts/uji-tantangan.mjs` | Uji Mode Tantangan di jsdom + IndexedDB palsu. |
| `scripts/uji-repertoar-ui.mjs` | Uji pohon cabang, latihan massal, statistik di jsdom + penjaga kunci i18n mentah. |

## Penyimpanan (jangan diganti tanpa migrasi)

| Kunci | Bentuk | Ditulis oleh |
| --- | --- | --- |
| IndexedDB `kci-papan-repertoar` / `kartu` | satu rekaman per kartu (`id` = `lineId:ply`) | `simpanKartuRepertoar` |
| `kci.papan.repertoar.v1` | cermin `localStorage` dari tabel di atas | `simpanKartuRepertoar`, `hapusJalurRepertoar` |
| `kci.papan.repertoar.hapus.v1` | tombstone `{ [lineId]: waktu }` | `hapusJalurRepertoar` |
| `kci.papan.tantangan.v1` | `{ [lineId]: { streakTerbaik, poin } }` | hanya `catatRekor` (dipanggil saat percobaan tantangan berakhir) |

Pembacaan kartu menggabungkan IndexedDB + cermin per `id` dengan rekaman ber-`diperbarui` terbaru menang. Jangan kembali ke pola "fallback hanya saat gagal" — kartu akan hilang setelah muat ulang. Kunci `KUNCI_REKOR` diambil dari `tantanganLogika.js`, jangan menulis string `"kci.papan.tantangan.v1"` di tempat lain.

## Aturan yang tidak boleh dilanggar

1. **SRS tidak berubah.** Hanya `jadwalkanKartu` yang menentukan `dueAt`/`intervalMs`/`repetitions`. Mode Tantangan, latihan massal, pohon cabang, dan statistik **membaca** kartu; tidak ada yang menjadwalkan ulang selain penilaian `lagi/sulit/baik/mudah`.
2. **Latihan massal hanya mengganti sumber kartu berikutnya.** Mode per jalur tetap memakai `kartuBerikutnya`; penjadwalan tetap satu pintu (`nilaiKartu` → `jadwalkanKartu` → `simpanKartuRepertoar`).
3. **Tantangan tidak menyentuh kartu.** Soal disusun dari kartu tersimpan; rekor disimpan terpisah supaya tantangan bisa dimainkan walau belum ada kartu jatuh tempo.
4. **Statistik tidak menulis.** `ringkasStatistik(kartu, { sekarang, rekor })` murni; layar katalog juga hanya membaca rekor.
5. **Semua teks lewat i18n** (`papan.*`, id + en). `uji:i18n` tidak melihat `t(kunci)` yang kuncinya dari variabel/daftar, jadi `scripts/uji-repertoar-ui.mjs` menolak teks `papan.*` mentah di layar. Kalau menambah daftar label dinamis, tambahkan pemeriksaan serupa.
6. **Papan mengikuti `/papan-interaktif` apa adanya** — tanpa kartu/bingkai/ring/bayangan baru; panel latihan memakai `data-dasbor-latihan`, panel tantangan `data-dasbor-tantangan`.
7. **Tanpa rute baru** untuk statistik/pohon/latihan massal: semuanya tampilan di halaman yang sama.

## Jebakan teknis yang sudah pernah menggigit

- `jalur.moves` **harus array** (`indeksJalurPembukaan` yang membuatnya). Memberi string membuat `buatKartuDariJalur` mengiterasi huruf dan menghasilkan nol kartu.
- `kelompokkanPerPembukaan` mengelompokkan `eco|nama`, sehingga satu pembukaan hanya punya satu garis per warna dan **pohon per pembukaan selalu berupa rantai**. Karena itu pohon cabang digambar dari **seluruh** garis katalog — di situlah percabangan (`e4 e5` vs `e4 c5`) benar-benar muncul.
- Kartu tidak menyimpan langkah lawan. `rekonstruksiJalur` mencarinya dengan mencoba langkah sah sampai ada yang menghasilkan FEN kartu berikutnya; jalur rusak dipotong, bukan melempar galat.
- Petak papan adalah `<button data-petak="e2">`; di jsdom cukup `el.click()`. Fokus/klik petak lewat `onKlik`, seret lewat `onJatuh`.
- Harness jsdom: buat `<div>` baru per kasus, `root.unmount()` lalu `process.exit()` di akhir — interval jam Mode Tantangan membuat proses Node tidak keluar sendiri.
- Jam tantangan menurunkan sisa waktu dari `mulaiMs` + `Date.now()`, bukan hitungan mundur per tick (tab beku tidak boleh menambah waktu).

## Perintah uji

```bash
npm run uji:repertoar        # aturan murni (cepat, tanpa DOM)
npm run uji:tantangan        # Mode Tantangan di jsdom
npm run uji:repertoar-ui     # pohon cabang + latihan massal + statistik
npm run uji:i18n             # setelah menyunting kunci papan.*
npx eslint src/halaman/LatihanRepertoar scripts tests
npm run build
npx playwright test tests/e2e/pembukaan.spec.js tests/e2e/landing-program.spec.js
```

## Status (per 2026-11-07, PR #242)

Sudah ada: katalog jalur tersimpan, tambah jalur dari buku pembukaan, halaman pembukaan gaya "Garis 1/2", latihan berjadwal (SRS), **Mode Tantangan** (seluruh jalur, 30 dtk/langkah, rekor terpisah), **latihan massal** lintas jalur, **pohon cabang** di katalog, **layar statistik**, dan halaman penjelas yang menerangkan ketiganya.

## Pekerjaan tertunda / ide lanjutan

Diurutkan dari yang paling siap dikerjakan. Belum ada yang mulai.

1. **Ekspor/impor repertoar (cadangan data).** Semua progres hanya ada di perangkat; satu pembersihan data peramban menghapusnya.
   - Bentuk berkas: `{ versi: 1, kartu: [...], rekor: {...} }`.
   - Impor lewat `simpanKartuRepertoar` saja (peleburan `diperbarui` terbaru menang sudah ada di storage) — jangan menulis IndexedDB langsung.
   - Rekor digabung `Math.max` per `lineId`, sama seperti `catatRekor`.
   - Validasi ketat: tolak berkas tanpa `versi`, kartu tanpa `id`/`fen`/`expectedUci`, dan `lineId` yang tidak cocok dengan `id`.
2. **Rekor tantangan & statistik ke akun.** Butuh keputusan skema server (tabel `tantangan_rekor`: `user_id`, `line_id`, `streak_terbaik`, `poin`, `diperbarui`). Klien harus offline-first: tulis lokal dulu, kirim belakangan, konflik diselesaikan `Math.max`. Jangan menaruh aturan skor di server — aturan tetap di `tantanganLogika.js`.
3. **Tantangan lintas beberapa jalur.** Antrean seperti latihan massal, tetapi tanpa batas SRS: satu percobaan memuat langkah pertama beberapa jalur berurutan. Aturan skor tetap di `tantanganLogika.js` (jangan di komponen).
4. **Pohon cabang lanjutan.** Klik simpul saat ini membuka halaman pembukaan; alternatif yang lebih langsung: mulai latihan kartu simpul itu. Juga bisa mengingat status buka/tutup pohon dan menyorot kartu jatuh tempo di jalur yang sedang dibuka.
5. **Aksesibilitas.** `role="tree"` belum mendukung navigasi panah kiri/kanan/atas/bawah; timer belum mengumumkan sisa waktu kritis. Tambahkan `aria-activedescendant` atau ubah menjadi daftar bertingkat biasa bila navigasi keyboard tidak dikerjakan.
6. **E2E khusus Mode Tantangan.** Saat ini bagian tantangan menempel di `tests/e2e/pembukaan.spec.js` (sudah jalan di desktop + mobile). Kalau bagian itu makin panjang, pecah ke `tests/e2e/tantangan.spec.js` dan siapkan data lewat UI (bukan menyuntik IndexedDB) supaya alurnya realistis.
7. **Papan peringkat lokal antar jalur.** Statistik sudah punya poin per jalur; tinggal mengurutkan jalur menurut rekor di layar statistik.
