# CSS global

`src/index.css` adalah entry point CSS yang diimpor oleh `src/main.jsx`. Isinya sengaja hanya daftar import: urutan modul global di sana harus dipertahankan karena aturan yang datang belakangan dapat mengubah cascade.

## Peta modul

- `tokens.css` — sumber pemindaian Tailwind, varian `dark`, token warna/tipografi, elevasi, dan animasi utility global.
- `base.css` — reset/aturan dasar dokumen, body, seleksi, dan properti root.
- `konten.css` — tipografi editorial serta primitif konten seperti kutipan, media, dan catatan.
- `berita.css` — tata letak editorial berita/pengumuman.
- `pengurus.css` — daftar dan identitas pengurus.
- `organisasi.css` — bagan organisasi klub.
- `tabel-anggota.css` — tabel anggota, profil, peringkat, dan tingkatan rating.
- `program-dan-animasi.css` — tampilan program unggulan dan animasi komponen terkait.
- `analisa-theme.css` — token tema khusus Analisa dan layer dasar shadcn. Untuk aturan UI spesifik Analisa, gunakan `src/halaman/Analisa/analisa.css`.
- `pendaftaran.css` — animasi khusus alur pendaftaran.
- `papan-cg.css` — elemen papan `cg-*` dan pengecualian tombol di dalam prose.
- `shadcn-tailwind.css` — salinan vendor; jangan diedit manual, ikuti header di file tersebut.

Tambahkan aturan baru ke modul yang sesuai dengan domainnya, bukan kembali menumpuk semuanya di `src/index.css`. CSS yang hanya dipakai satu komponen/fitur sebaiknya tetap dekat dengan fitur itu. Pertahankan referensi aset relatif terhadap file CSS pemakainya dan verifikasi `npm run build` setelah memindahkan aturan.
