# Catatan Audit Teka-Teki — Target V1

Dokumen kerja untuk menutup audit fitur **Teka-Teki** sebelum dinyatakan siap V1. Checklist ini bukan bukti bahwa item sudah lulus: setiap item harus ditandai setelah diuji pada branch yang sedang diaudit, dengan hasil yang dapat diulang.

## Aturan pengerjaan

- Kerjakan di branch fitur dan melalui PR yang sudah ada; jangan mengubah `main` langsung.
- Jangan membuat PR baru atau merge tanpa persetujuan pemilik repo.
- Perbaiki bug yang terkonfirmasi terlebih dahulu. Jangan melakukan refactor luas atau mengubah kebijakan produk tanpa keputusan.
- Untuk setiap perbaikan: tambahkan/regresikan tes, jalankan tes terkait, lint, build, dan periksa CI terbaru.
- Catat hasil sebagai **LULUS**, **GAGAL**, **BELUM DIUJI**, atau **TERBLOKIR**. Jangan menyamakan “belum diuji” dengan “aman”.
- Jangan mengklaim dataset valid sebelum validator benar-benar dijalankan terhadap berkas dataset yang dipakai.

## 1. Integritas dataset

Berkas utama: `public/data/teka-teki.json`

- [ ] JSON dapat dibaca dan struktur akar serta setiap record sesuai dengan skema yang dipakai aplikasi.
- [ ] `problemid` ada, unik, valid, dan pemetaan ID ke URL tidak mengarah ke soal yang berbeda.
- [ ] `fen` valid dan posisi awal konsisten dengan metadata giliran.
- [ ] `moves` tidak kosong; setiap token memiliki format yang didukung parser.
- [ ] Semua langkah solusi legal jika dimainkan berurutan dari FEN awal.
- [ ] Promosi pion memiliki jenis promosi yang valid dan sesuai data.
- [ ] Jalur solusi berakhir pada skakmat yang sah.
- [ ] `type`, jumlah langkah/mate, giliran, level, dan tema konsisten dengan posisi serta solusi.
- [ ] Data duplikat, record kosong, field hilang, ID loncat, dan nilai enum tak dikenal dilaporkan dengan jelas.
- [ ] Peringatan dataset ditinjau satu per satu; jangan otomatis menghapus atau menulis ulang record tanpa bukti.
- [ ] Uji validator dijalankan pada dataset produksi yang sebenarnya dan hasil jumlah valid/gagal disimpan pada catatan audit.

Validator yang tersedia/ditambahkan: `npm run uji:integritas-data-teka-teki`. Pastikan nama skrip tersedia di `package.json` pada branch terbaru. Hasilnya masih **BELUM DIUJI** sampai eksekusi aktual berhasil dan laporannya ditinjau.

## 2. Seleksi soal, progres, dan persistensi

- [ ] Menyelesaikan soal menandai `problemid` yang benar sebagai selesai.
- [ ] Setelah keluar dari halaman dan masuk lagi, soal yang sudah selesai tidak otomatis dipilih kembali.
- [ ] Perilaku tetap benar saat filter = semua level/tema/giliran dan saat filter hanya memilih subset.
- [ ] Tombol **Berikutnya**, **Lewati**, **Acak**, dan **Baru** tidak mengembalikan soal yang sudah selesai jika alurnya dimaksudkan mencari soal baru.
- [ ] Pemulihan posisi terakhir dibedakan dari permintaan deep-link eksplisit untuk meninjau soal tertentu.
- [ ] Deep-link ke soal yang sudah selesai tetap mengikuti kebijakan produk yang disengaja, tanpa membuat soal itu muncul kembali pada pemilihan otomatis.
- [ ] Progres tersimpan dengan skema yang aman: data lokal rusak, kosong, atau versi lama tidak membuat halaman crash.
- [ ] Menghapus/reset progres (jika tersedia) benar-benar membersihkan state yang terkait.
- [ ] Tidak ada race antara penyimpanan progres, pergantian soal, dan perubahan filter.
- [ ] Tambahkan tes regresi khusus untuk skenario keluar/masuk ulang setelah soal selesai.

## 3. Kebenaran aturan catur dan validasi solusi

- [ ] Langkah ilegal tidak mengubah posisi atau progres.
- [ ] Langkah yang legal tetapi bukan bagian solusi ditangani konsisten dengan kebijakan produk.
- [ ] Langkah alternatif yang menghasilkan skakmat ditangani sesuai kebijakan eksplisit; jangan biarkan komentar/dokumentasi bertentangan dengan implementasi.
- [ ] Giliran pemain dan balasan lawan bergantian sesuai format dataset.
- [ ] Skakmat hanya dianggap berhasil pada kondisi yang benar; stalemate bukan skakmat.
- [ ] Rokade, en passant, promosi, underpromotion, dan posisi check diuji.
- [ ] Kasus langkah promosi membuka pilihan yang benar; batal memilih promosi tidak boleh memainkan langkah yang salah.
- [ ] Solusi yang berakhir pada skakmat cocok dengan jumlah ply dan label “mate dalam N langkah”.
- [ ] Klik petak dan drag-and-drop menghasilkan aturan validasi yang sama.
- [ ] Reset, menyerah, dan pindah soal tidak meninggalkan posisi papan atau pesan hasil dari soal sebelumnya.

## 4. Label langkah dan orientasi papan

- [ ] Label Mate in One/Two/Three sesuai jumlah langkah penuh yang dimaksud, bukan menghitung setengah-langkah (ply) sebagai langkah penuh.
- [ ] Label, petunjuk, ringkasan hasil, dan panel soal menggunakan definisi jumlah langkah yang sama.
- [ ] Orientasi papan benar untuk soal White to Move maupun Black to Move.
- [ ] Warna pemain, giliran, koordinat, dan highlight langkah sesuai orientasi.
- [ ] Pergantian soal dari putih ke hitam atau sebaliknya memperbarui orientasi tanpa reload penuh.
- [ ] Tampilan desktop dan mobile tidak mengubah aturan atau membuat petak sulit dipilih.

## 5. Filter, navigasi, dan URL

- [ ] Filter level, jumlah langkah, tema, dan giliran dapat digabung tanpa hasil yang salah.
- [ ] Mengubah filter mengatur ulang indeks/seleksi secara konsisten.
- [ ] Kondisi hasil kosong menampilkan keadaan kosong yang jelas, tanpa error atau indeks negatif.
- [ ] Nomor soal yang dimasukkan divalidasi; input kosong, nol, negatif, pecahan, teks, dan angka di luar rentang ditangani aman.
- [ ] URL kanonik `/teka-teki/problem/<id>` memuat soal yang sesuai.
- [ ] URL lama dan query parameter yang didukung dialihkan/dinormalkan dengan benar.
- [ ] Navigasi SPA dari satu ID ke ID lain memuat soal baru, tidak mempertahankan soal lama.
- [ ] Tombol kembali/maju browser tidak menyebabkan state dan URL berbeda.
- [ ] URL dan canonical tidak mengarah ke ID yang berbeda karena filter atau indeks relatif.
- [ ] Deep-link langsung saat refresh tetap bekerja.

## 6. Interaksi, state, dan aksesibilitas

- [ ] Klik langkah, drag bidak, pilihan promosi, petunjuk, dan navigasi tinjau berjalan konsisten.
- [ ] Klik cepat berulang tidak menggandakan langkah, menyelesaikan soal dua kali, atau merusak state.
- [ ] Dialog konfirmasi (jika ada) mendukung lanjut dan batal dengan perilaku yang benar.
- [ ] Timer/animasi/efek suara berhenti atau dibersihkan saat reset, pindah soal, unmount, dan saat soal selesai.
- [ ] Tidak ada listener, timer interval, atau observer yang bocor setelah navigasi.
- [ ] Error saat data gagal dimuat menampilkan pesan dan opsi pemulihan yang masuk akal.
- [ ] Tombol dapat digunakan dengan keyboard; fokus terlihat dan label kontrol bermakna.
- [ ] Tidak ada error React, warning penting, atau unhandled rejection pada alur normal.

## 7. Performa dan kompatibilitas

- [ ] Dataset tidak diproses ulang secara mahal pada setiap render tanpa kebutuhan.
- [ ] Memilih soal, mengganti filter, dan memainkan langkah tetap responsif pada perangkat kelas menengah.
- [ ] Tidak ada layout shift besar atau papan terpotong pada layar kecil.
- [ ] Build produksi berhasil; aset dan URL data berfungsi pada base path deployment.
- [ ] Pengujian tidak bergantung pada urutan record secara implisit kecuali urutan itu memang kontrak dataset.

## 8. Tes otomatis yang harus dijalankan

Jalankan dari root repository dengan Node sesuai versi proyek (Node >= 22):

```bash
npm ci
npm run lint
npm run uji:tekateki-solusi
npm run uji:tekateki-alur
npm run uji:tekateki-rute
npm run uji:integritas-data-teka-teki
npm run build
```

Skrip integritas data perlu dipastikan tersedia di `package.json` pada commit yang diuji. Bila satu perintah gagal, catat output lengkap, perbaiki penyebabnya, dan jalankan ulang perintah yang gagal serta tes regresi terkait.

Untuk pemeriksaan keseluruhan sebelum rilis, jalankan `npm run uji` dan workflow CI lengkap. Jangan hanya melihat satu job: periksa lint, regression tests, browser tests, release gate, dan status deployment/preview bila relevan.

## 9. Kriteria penerimaan V1

Fitur belum boleh dinyatakan siap V1 sampai semua poin wajib berikut terpenuhi:

- [ ] Tidak ada kegagalan pada lint, tes solusi, tes alur, tes rute, tes integritas dataset, build, dan CI.
- [ ] Dataset produksi tervalidasi; semua kegagalan atau pengecualian ditinjau dan disetujui secara eksplisit.
- [ ] Tidak ada bug P0/P1 yang diketahui pada pemilihan soal, progres, validasi langkah, navigasi, atau interaksi papan.
- [ ] Regresi soal selesai muncul kembali sudah memiliki tes yang gagal sebelum perbaikan dan lulus sesudahnya.
- [ ] Label Mate in N dan orientasi papan konsisten untuk kedua warna.
- [ ] Perilaku deep-link, filter, dan pemulihan sesi terdokumentasi serta diuji.
- [ ] Build preview/produksi dapat memuat data dan aset yang dibutuhkan.
- [ ] Hasil CI berasal dari commit terbaru pada PR yang akan ditinjau; tidak ada status wajib yang masih pending/failing.
- [ ] Semua risiko yang belum diselesaikan ditulis di bawah ini, dengan dampak dan keputusan yang diperlukan.

## 10. Catatan temuan dan hasil pengujian

Tambahkan entri baru setiap kali melakukan audit/perbaikan:

| Tanggal | Area / temuan | Bukti atau langkah reproduksi | Perbaikan / commit | Tes dijalankan | Status |
| --- | --- | --- | --- | --- | --- |
| 2026-10-25 | Label jumlah langkah mate | Ditemukan perbedaan hitungan langkah penuh dan setengah-langkah | `f951663b` — perubahan tampilan jumlah langkah | CI pada commit saat itu perlu dikonfirmasi terhadap branch terkini | BELUM DIVERIFIKASI ULANG |
| 2026-10-25 | Soal selesai muncul kembali saat pemulihan URL | Dilaporkan saat keluar lalu masuk kembali; pemulihan dan deep-link perlu dibedakan | `8b4e22da` — penyesuaian seleksi awal | Tes regresi keluar/masuk ulang masih harus dijalankan | BELUM DIUJI |
| 2026-10-25 | Lint validator dataset | CI melaporkan `no-useless-assignment` di `scripts/uji-integritas-data-teka-teki.mjs` | `ff9de949` — penanganan error disederhanakan | Menunggu hasil CI baru pada commit terbaru | MENUNGGU CI |

### Temuan terbuka

- [ ] Verifikasi bahwa pemulihan soal selesai benar-benar melewati soal yang telah selesai, termasuk setelah filter berubah dan ketika posisi tersimpan mengacu pada ID/indeks.
- [ ] Tambahkan/konfirmasi tes regresi otomatis untuk keluar dan masuk kembali setelah soal diselesaikan.
- [ ] Jalankan validator terhadap seluruh `public/data/teka-teki.json`; tinjau apakah pemetaan jenis soal ke jumlah ply cocok dengan skema nyata dataset.
- [ ] Pastikan kebijakan mate alternatif yang diterapkan `src/lib/tekaTeki.js` sesuai dengan komentar, terjemahan, dan pengalaman pengguna.
- [ ] Konfirmasi CI hijau pada commit terbaru, bukan hanya pada commit sebelumnya.
