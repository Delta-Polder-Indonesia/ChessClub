# Acuan Performa Web untuk ChessClub

Gunakan prinsip caching, kompresi, optimasi aset, dan pengukuran dari artikel optimasi web yang diberikan pengguna sebagai **acuan saat tugas memang menyentuh performa**. Jangan menyalin konfigurasi generik tanpa mencocokkannya dengan arsitektur dan header yang sudah aktif di repository.

## Alur kerja wajib

1. **Ukur dan tentukan bottleneck lebih dulu.** Catat rute, kondisi uji, metrik/ukuran saat ini, dan langkah reproduksi. Gunakan build produksi, Lighthouse/PageSpeed, Network panel, atau tooling yang sudah tersedia. Hindari optimasi spekulatif dan perubahan banyak variabel sekaligus.
2. **Periksa jalur produksi yang sesungguhnya.** Baca `vite.config.js`, `vercel.json`, `plugins/performa.js`, konfigurasi server, serta header respons terkait sebelum mengubah cache, kompresi, bundling, atau infra.
3. **Pilih intervensi terkecil yang dapat diukur.** Catat efek sesudah perubahan pada ukuran transfer, permintaan jaringan, waktu render, CPU/memori, serta perilaku/correctness. Pertahankan optimasi hanya jika hasil terukur dan tidak merusak fitur.
4. **Uji keamanan data dan invalidasi.** Cache hanya data yang aman untuk dibagi; data pengguna/sesi, respons sensitif, dan operasi tulis tidak boleh tersaji dari cache publik. Pastikan umur, variasi per pengguna, dan purge/update sesuai kebutuhan.

## Pemetaan prinsip ke stack proyek

### Cache dan CDN

- Aset produksi Vite memakai nama ber-hash; konfigurasi hosting/CDN Vercel yang berjalan adalah sumber utama untuk header aset. Jangan menambah aturan `.htaccess` (hosting ini bukan Apache) atau `Cache-Control: max-age=31536000` secara membabi buta.
- Aset ber-hash dapat disimpan lama hanya bila URL berubah setiap konten berubah. HTML, manifest, respons API, dan data personal memerlukan kebijakan terpisah; jangan men-cache respons pribadi secara publik.
- Caching API/database sisi server (Redis/Memcached, full-page, query, object cache) bukan default. Tambahkan hanya bila profil menunjukkan biaya berulang yang nyata, tersedia sumber cache yang cocok untuk runtime Vercel/serverless, dan strategi TTL, invalidasi, serta isolasi pengguna sudah diuji.
- Periksa header respons yang sudah ada sebelum mengubahnya. Endpoint yang mengembalikan data sensitif atau token biasanya membutuhkan `no-store`; jangan menurunkan perlindungan demi skor performa.

### Kompresi dan transfer

- Hosting/CDN Vercel menangani negosiasi kompresi aset statis. Jangan mengonfigurasi Apache `mod_deflate` pada proyek ini.
- Server Node sudah memiliki helper respons gzip untuk payload teks yang memenuhi ambang ukurannya. Periksa dan gunakan implementasi tersebut; hindari mengompresi JSON secara manual menjadi format aplikasi lain—HTTP compression sudah menangani transfer dengan tepat.
- Periksa `Content-Encoding`, `Vary: Accept-Encoding`, dan ukuran payload aktual pada respons. Jangan mengompresi ulang berkas yang sudah dikompresi (WASM, gambar, arsip) tanpa bukti manfaat.

### Gambar, font, dan aset statis

- Pilih format sesuai isi: SVG untuk ikon/grafik vektor; WebP/AVIF untuk foto/bitmap jika alur aset mendukung fallback; PNG hanya bila perlu lossless/transparansi. Gunakan transformasi/build pipeline proyek yang tersedia, bukan konversi massal tanpa tinjauan visual.
- Sertakan ukuran intrinsik (`width`/`height` atau `aspect-ratio`) untuk mencegah layout shift; gunakan `srcset`/`sizes` ketika ada varian ukuran nyata.
- Lazy-load gambar di bawah lipatan saja. Jangan menunda gambar LCP/hero atau konten penting yang terlihat saat awal; pertimbangkan `fetchpriority="high"` hanya setelah LCP diukur.
- Geist Variable sudah dibundel untuk UI dan teks bacaan memakai stack sistem/serif. Jangan menambahkan font kustom atau subset `unicode-range` tanpa bukti bahwa font baru diperlukan dan penghematan telah diukur.

### Build, bundling, dan eksekusi

- Vite/esbuild sudah meminifikasi build produksi; proyek memiliki pemisahan chunk serta tooling performa (`plugins/performa.js`). Jangan menambahkan minifier manual, menggabungkan file secara manual, atau menambahkan atribut `async`/`defer` ke output bundler tanpa memeriksa HTML dan strategi loading Vite.
- Gunakan dynamic import/code splitting hanya jika mengurangi kerja awal rute tanpa menambah fetch waterfall atau duplikasi dependensi. Bandingkan chunk awal, chunk rute, cache antar-rute, dan waktu interaksi.
- Containerisasi bukan optimasi frontend otomatis. Deployment sudah menggunakan Vercel/serverless; jangan memindahkan arsitektur ke Docker/Redis/edge tanpa kebutuhan terukur dan persetujuan cakupan.

## Checklist selesai

- Baseline dan hasil sesudah optimasi dapat dibandingkan serta dapat direproduksi.
- Tidak ada regression pada fungsionalitas, aksesibilitas, SEO, cache pengguna, atau deployment.
- Header cache dan kompresi sesuai hosting yang benar, bukan contoh Apache generik.
- Tidak menambah dependency, layanan, atau migrasi infrastruktur tanpa manfaat terukur dan alasan operasional.
- Jalankan build dan uji yang relevan; cantumkan metrik yang berubah dan keterbatasan pengukuran.
