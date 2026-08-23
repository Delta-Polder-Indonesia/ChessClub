# Browser API modules

Semua komunikasi frontend ke backend ditempatkan di folder ini dan dibagi berdasarkan domain fitur:

- `anggota.js` — roster, pendaftaran anggota, dan pemindaian fair-play.
- `verifikasi.js` — OAuth Chess.com serta kode verifikasi profil.
- `pengurus.js` — token sesi pengurus, CSRF, retry rate-limit, dan endpoint pengurus.
- `turnamen.js` — daftar, detail, dan pengajuan peserta turnamen.
- `konten.js` — berita dan pengumuman publik.
- `pesan.js` — formulir Hubungi Kami.
- `core.js` — URL API dan tipe galat bersama.
- `index.js` — facade ekspor publik untuk pemanggil yang membutuhkan lebih dari satu domain.

Jangan memanggil `fetch('/api/...')` langsung dari halaman/komponen. Tambahkan fungsi ke modul domain yang sesuai agar URL backend, CSRF, serta penanganan galat tetap konsisten.
