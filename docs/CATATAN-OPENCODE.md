# Catatan untuk opencode: langkah uji di laptop

Branch: `arena/3abd72f8-chessclub` (PR #185). Dokumen ini menjelaskan apa yang
sudah diuji di sandbox, apa yang harus diuji di laptop, dan perintahnya.

## 1. Ringkasan perubahan

| Fitur | Berkas utama | Status di sandbox |
|---|---|---|
| Hand & Brain | `src/halaman/HandBrain/HandBrain.jsx`, `handBrainLogika.js` | Lulus (unit 18/18, e2e 4/4) |
| Turing test (tempel PGN) | `TuringTest/TuringTest.jsx`, `TuringTest/turingLogika.js` | Lulus (unit 12/12, e2e 2/2) |
| Turing test: impor Lichess | `TuringTest/turingLichess.js` | Unit 10/10 dan e2e (dengan `page.route`) lulus. **Belum diuji ke Lichess asli.** |
| Rating insights (kartu Ringkasan) | `mesin/wawasanRating.js`, `summary/wawasanRating.jsx` | Unit 10/10, e2e 1/1 lulus. **Belum dilihat dengan mata.** |

## 2. Yang WAJIB diuji di laptop

### 2a. Impor Lichess untuk Turing test (paling penting)
Sandbox tidak bisa mengakses `lichess.org`, jadi ini belum pernah jalan sungguhan.

1. `npm run dev`, buka `http://localhost:5173/program-kami/turing-test` (halaman penjelas mode),
   lalu klik tombol masuk — atau langsung `http://localhost:5173/papan-interaktif/turing-test`
   (sejak 2026-11-07 mode ini halaman mandiri, bukan lagi item sidebar Workspace).
2. Isi "Atau ambil dari Lichess" dengan nama akun publik yang punya banyak partai, misalnya `DrNykterstein`.
3. Klik **Ambil partai**. Kotak PGN harus terisi teks PGN (berisi `[Event ...]`).
4. Klik **Mulai tebak**. Soal pertama harus muncul dalam beberapa detik sampai puluhan detik.

Yang perlu dicek:
- Di tab Network, permintaan ke `https://lichess.org/api/games/user/<nama>?moves=true&pgnInJson=false...` harus berstatus 200.
- Header `Accept: application/x-chess-pgn` harus diterima. Jika Lichess mengembalikan NDJSON atau format lain, parser `ekstrakPosisi` tidak akan menemukan langkah dan kotak akan terisi tetapi "Mulai tebak" memunculkan pesan "Tidak ada posisi yang bisa dipakai". Jika ini terjadi, perbaiki `urlPartaiLichess` di `turingLichess.js`.
- Cek CORS: browser tidak boleh memblokir respons. Repo sudah memanggil endpoint yang sama dari `muatPartaiAkun.js`, jadi seharusnya aman.
- Coba nama yang tidak ada (misalnya `tidak-ada-kali-xyz`): harus muncul pesan "Pengguna tidak ditemukan atau belum punya partai."
- Coba nama yang tidak sah (misalnya `a` atau `nama spasi`): tombol **Ambil partai** harus nonaktif, atau pesan "Nama pengguna Lichess tidak sah." muncul.

### 2b. Kartu Wawasan rating di tab Ringkasan Analisa
1. Buka `/program-kami/analisa/papan`, klik **Impor** (`data-uji="nav-impor"`), tempel PGN, klik kirim.
2. Ringkasan harus menampilkan kartu **Wawasan rating** setelah Deteksi Engine dan sebelum Ekspor.
3. Periksa tata letak: tabel tiga baris fase (Pembukaan, Menengah, Akhir) dengan kolom Putih dan Hitam; teks di bawahnya "Perlu dilatih: ..." dan "Paling kuat: ...". Tidak boleh terpotong di layar sempit (cek juga lebar mobile).
4. Angka akurasi baru terisi setelah engine menganalisis. Sebelum itu kolom menampilkan `-`, dan itu normal.

### 2c. Turing test: kecepatan engine di laptop
Setiap soal memanggil Stockfish dengan kedalaman 10. Di laptop biasanya cepat, tetapi jika terasa lambat, catat berapa lama "Menyiapkan soal…" bertahan. Batas kedalaman ada di konstanta `KEDALAMAN_MESIN` di `TuringTest.jsx`.

## 3. Perintah uji

Jalankan dari akar repo. Pastikan dependensi sudah terpasang dengan `npm ci --include=dev`.

```bash
# Tes unit per fitur (cepat)
npm run uji:repertoar        # aturan latihan + tantangan (murni, tanpa DOM)
npm run uji:tantangan        # Mode Tantangan di jsdom (butuh jsdom + fake-indexeddb)
npm run uji:repertoar-ui     # pohon cabang + latihan massal + statistik di jsdom
npm run uji:hand-brain
npm run uji:turing            # turingLogika + turingLichess
npm run uji:wawasan-rating

# Konsistensi terjemahan (wajib setelah menyunting kunci i18n)
npm run uji:i18n

# Lint dan build
npx eslint src scripts tests
npm run build

# E2E (butuh Chromium Playwright: npx playwright install chromium)
npx playwright test tests/e2e/turing-test.spec.js tests/e2e/hand-brain.spec.js tests/e2e/landing-program.spec.js tests/e2e/wawasan-rating.spec.js --project=desktop-chromium

# Gerbang rilis lengkap (termasuk npm audit, butuh internet)
npm run uji:rilis:v1
```

Catatan:
- `pw-local.config.js` dibuat hanya untuk sandbox (Chromium khusus). **Jangan** dipakai di laptop; pakai konfigurasi Playwright bawaan repo.
- Jika `npx playwright test` gagal karena browser belum terpasang, jalankan `npx playwright install chromium` dulu.
- E2E Turing test lewat Lichess memakai `page.route`, jadi tidak butuh internet untuk tes itu sendiri.

## 4. Yang belum dikerjakan (sengaja)

- **Lawan Maia (CSSLab)**: ditunda. Bobot `maia3_simplified.onnx` (sekitar 45 MB) berasal dari repositori GPL-3.0 dan lisensi bobotnya belum diverifikasi. Jangan menyalin kode mereka; hanya idenya yang boleh dipakai. Sandbox juga tidak bisa mengunduh bobot dari host model.
- **Opening drill**: belum dikerjakan sebagai mode terpisah. Kebutuhannya sudah dijawab dua cara di Latihan Repertoar: latihan berjadwal (SRS) dan **Mode Tantangan** (seluruh jalur berurutan, tanpa petunjuk, batas waktu 30 detik per langkah, rekor terpisah di `localStorage` `kci.papan.tantangan.v1`).
- **Halaman penjelas repertoar** (`/program-kami/latihan-repertoar`) kini menjelaskan tiga cara berlatih (berjadwal, tantangan, massal) dan statistik/pohon cabang. Itu satu-satunya penjelasan publik untuk mode-mode tersebut, jadi teksnya dijaga e2e `landing-program.spec.js`; ubah kunci i18n-nya bersamaan dengan uji itu.
- **P2 repertoar — pohon cabang, latihan massal, statistik: SELESAI.** Pohon cabang menempelkan awalan langkah yang sama antar jalur dan membuka garis saat simpulnya diklik; langkah lawan direkonstruksi dari FEN kartu, jadi data lama tetap terbaca tanpa migrasi. Latihan massal hanya mengganti sumber kartu berikutnya (antrean lintas jalur); penjadwalan tetap `jadwalkanKartu`. Statistik adalah tampilan di halaman yang sama, bukan rute baru.
- **Mode Tantangan — rekor hanya lokal**: rekor dan poin belum dikirim ke akun/server (sama seperti jadwal SRS repertoar) dan belum ada papan peringkat. Kalau nanti dipusatkan, `tantanganLogika.js` adalah satu-satunya tempat aturan skor; jangan menaruh logika skor di komponen.

## 5. Yang perlu dilaporkan kembali

Jika ada yang gagal di laptop, catat:
1. Perintah yang dijalankan dan keluarannya (potongan yang relevan).
2. Untuk impor Lichess: status HTTP dan beberapa baris pertama respons dari tab Network.
3. Untuk kartu Ringkasan: screenshot tampilan kartu, dan lebar layar.

Setelah itu, perbaikan dilakukan di branch yang sama dan di-push ke `origin arena/3abd72f8-chessclub`.
