# Browser API modules

Semua komunikasi frontend ke backend ditempatkan di folder ini dan dibagi berdasarkan domain fitur:

- `anggota.js` — roster, pendaftaran anggota, verifikasi (OAuth/kode profil), dan pemindaian fair-play.
- `pengurus.js` — token sesi pengurus, CSRF, retry rate-limit, dan endpoint pengurus.
- `turnamen.js` — daftar, detail, dan pengajuan peserta turnamen.
- `konten.js` — berita dan pengumuman publik.
- `pesan.js` — formulir Hubungi Kami.
- `ebook.js` — tebus kode unduh dan pengajuan permintaan e-book.
- `rekorRush.js` — papan peringkat Rush Teka-teki.
- `core.js` — URL API, tipe galat bersama (`GalatApi`), dan `teksGalat`.
- `index.js` — facade ekspor publik untuk pemanggil yang membutuhkan lebih dari satu domain.

Jangan memanggil `fetch('/api/...')` langsung dari halaman/komponen. Tambahkan fungsi ke modul domain yang sesuai agar URL backend, CSRF, serta penanganan galat tetap konsisten.

## Standar pesan galat

Berlaku untuk SEMUA modul di folder ini:

1. **`message` hanya diisi dari `pesan` milik server.** Pesan server adalah konten
   nyata dan ditampilkan apa adanya. Pesan cadangan sisi klien tidak lagi ditulis
   dalam bahasa apa pun di lapisan ini.
2. **Kegagalan sisi klien** (jaringan, format respons tidak sah, dsb.) dibawa lewat
   `GalatApi.kodePesan` — kunci terjemahan `api.<kodePesan>` (kamus
   `src/lib/terjemahan/{id,en}/api.js`).
3. **Lapisan tampilan** menampilkan galat lewat `teksGalat(err, t, kunciCadangan?)`
   dengan urutan baku: `err.message` (pesan server) → `api.<kodePesan>` →
   `kunciCadangan` (kunci domain bila ada) → `api.umum`.
4. Situs dengan penyebab spesifik yang diketahui alurnya (mis. tiket verifikasi
   kedaluwarsa) boleh memakai `err.message || t("kunci.semantik")` — pesan server
   tetap menang.

Contoh penulisan modul:

```js
if (!res.ok) {
  throw new GalatApi(data.pesan || "", {
    status: res.status,
    kodePesan: data.pesan ? null : "namaKegagalan",
  });
}
```

Tambahkan pasangan kunci `namaKegagalan` di `id/api.js` dan `en/api.js` setiap
menambah `kodePesan` baru.
