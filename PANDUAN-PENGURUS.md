# Panduan Pengurus — Keanggotaan & Larangan Pemain

Dokumen ini menjelaskan cara kerja sistem pendaftaran anggota dan
pencegahan pemain curang kembali bergabung lewat "akun kecil".

> **Sumber anggota:** daftar publik situs mengikuti roster klub
> [BLUNDER SKUAD di Chess.com](https://www.chess.com/club/blunder-skuad),
> bukan `data/anggota.json`. Chess.com memperbarui roster publik maksimal
> setiap 12 jam. Berkas lokal tetap dipakai untuk metadata formulir,
> verifikasi, dan perlindungan identitas.

---

## 1. Masalah yang diselesaikan

Username Chess.com adalah identitas yang **lemah**: siapa pun bisa membuat
akun baru dalam satu menit. Jika kita hanya mencatat username, pemain yang
di-ban karena engine tinggal daftar ulang dengan akun lain.

Yang jauh lebih sulit diganti oleh seseorang adalah:

| Data | Kenapa efektif |
| ---- | -------------- |
| Nomor HP/WhatsApp | Terikat kartu SIM & registrasi NIK |
| Nomor DANA | Terikat nomor HP yang sama |
| Nama lengkap + tanggal lahir | Dipakai untuk hadiah & sertifikat |

Sistem ini mengunci **orang**-nya, bukan sekadar akunnya.

---

## 2. Pemeriksaan perlindungan

Saat seseorang mengirim formulir administrasi, sistem memeriksa berurutan:

1. **Username ada di daftar hitam?** → ditolak.
2. **Identitas cocok dengan daftar hitam?** → ditolak.
   Inilah yang menutup celah akun kecil. Cocok bila **salah satu** sama:
   - nomor HP/WA (format apa pun: `0812…`, `+62812…`, `62812…`)
   - nomor DANA — termasuk bila nomor lama dipindah ke kolom DANA
   - kombinasi nama lengkap + tanggal lahir
3. **Akun Chess.com ada dan aktif?** → diverifikasi langsung ke Chess.com.
4. **Akun ditutup karena fair play?** → ditolak **dan langsung masuk daftar hitam**.
5. **Akun ada di roster BLUNDER SKUAD?** → wajib; bila belum, formulir ditolak.
6. **Username sudah pernah mengisi formulir?** → ditolak.
7. **Identitas dipakai anggota aktif lain?** → ditolak (cegah akun ganda).

---

## 3. Privasi — penting

Repositori ini **publik**. Karena itu data dipisah:

| Berkas | Isi | Masuk Git? |
| ------ | --- | ---------- |
| `data/anggota.json` | metadata formulir: panggilan, kota, kategori umur, **hash** identitas; bukan roster aktif | ya (aman) |
| `data/daftar-hitam.json` | username, alasan, **hash** identitas | ya (aman) |
| `data/rahasia/kontak.json` | nama asli, HP, DANA, email, tanggal lahir | **tidak** (di-`.gitignore`) |

Nomor HP tidak pernah disimpan apa adanya di berkas publik. Yang tersimpan
hanya sidik jari seperti `a31d0ce267e7947c`. Sidik jari ini tetap bisa
mendeteksi orang yang sama, tetapi tidak bisa dibaca balik menjadi nomor.

### KCI_PEPPER — wajib diatur di produksi

Hash diperkuat dengan kata rahasia ("pepper"). Tanpa pepper, nomor HP
Indonesia bisa ditebak satu per satu karena jumlah kombinasinya terbatas.

```bash
export KCI_PEPPER="kalimat-rahasia-panjang-milik-pengurus"
npm run dev
```

> **Jangan pernah mengganti pepper setelah ada data.** Semua hash lama akan
> menjadi tidak cocok. Sistem mendeteksi hal ini dan akan menolak
> pendaftaran (galat 503) daripada diam-diam meloloskan pemain terlarang.
> Simpan pepper di tempat aman — kehilangan pepper = kehilangan daftar hitam.

---

## 4. Dashboard pengurus (cara termudah)

Buka **`/pengurus`** di peramban — misalnya
`https://komunitascatur.or.id/pengurus`. Halaman ini sengaja **tidak
ditautkan dari menu mana pun**; hanya yang tahu alamatnya yang bisa
membukanya, dan tetap harus memasukkan token.

1. Tempelkan `KCI_TOKEN_ADMIN` pada kotak "Token pengurus", tekan **Masuk**.
2. Token disimpan di `sessionStorage` — hilang begitu tab ditutup. Di
   komputer bersama, tekan **Keluar** setelah selesai.

Isi dashboard:

| Bagian | Fungsi |
| ------ | ------ |
| Kartu ringkasan | Jumlah anggota roster klub, larangan, turnamen, mode verifikasi |
| Tab **Anggota & Larangan** | Tabel anggota roster (Elo & status verifikasi), tombol **Blokir**, tabel larangan dengan tombol **Cabut**, cek nomor HP, dan **Pindai ban fair play** |
| Tab **Turnamen** | Buat & kelola keempat jenis turnamen |

Semua yang bisa dilakukan lewat terminal (bagian 6) juga bisa dilakukan di
sini. Terminal tetap berguna untuk otomatisasi dan saat situs sedang mati.

> Tombol **Blokir** membatasi akun dari situs dan turnamen. Tombol itu tidak
> dapat mengeluarkan akun dari klub Chess.com; lakukan penghapusan anggota
> tersebut langsung di Chess.com bila diperlukan.

---

## 5. Mengelola turnamen

Keempat halaman turnamen publik — Turnamen Bulanan, Liga Musiman, Turnamen
Terbuka, dan Liga Antar Komunitas — **mengambil isinya dari dashboard**.
Artikel penjelasan aturan di halaman itu tetap statis; yang dinamis adalah
blok "Jadwal & Klasemen" di bawahnya.

### Alur satu turnamen

1. **Buat** — tab Turnamen → **+ Turnamen baru**. Pilih jenisnya; tempo,
   sistem, dan jumlah ronde terisi otomatis sesuai aturan jenis tersebut.
   Turnamen baru berstatus **Draf** dan **belum terlihat publik**.
2. **Pendaftaran** — ubah status ke *Pendaftaran*. Sejak titik ini turnamen
   muncul di halaman publik dengan tombol **Daftar sebagai peserta**. Player
   memasukkan username Chess.com; sistem menolak non-anggota, akun tertutup,
   username terlarang, serta identitas terverifikasi yang cocok dengan daftar
   larangan. Pengajuan yang lolos pemeriksaan awal masuk ke tabel **Pengajuan
   Peserta** dan belum menjadi peserta sampai pengurus menekan **Terima**.
   Periksa profil serta tanggal pembuatan akun sebelum menerima, atau tekan
   **Tolak** dan berikan alasan. Pengurus tetap dapat menambahkan peserta
   langsung lewat username bila diperlukan.
3. **Berlangsung** — ubah status. Pendaftaran dan pengajuan baru ditutup, hasil mulai dicatat
   per ronde. Klasemen dihitung ulang setiap kali hasil disimpan.
4. **Selesai** — klasemen akhir tetap tampil di halaman publik.

Status **Batal** menyembunyikan turnamen dari daftar aktif tanpa menghapus
riwayatnya. **Hapus** bersifat permanen — pakai hanya untuk turnamen yang
salah dibuat.

### Perbedaan keempat jenis

| Jenis | Sistem | Siapa yang boleh ikut | Catatan |
| ----- | ------ | --------------------- | ------- |
| Turnamen Bulanan | Swiss, 5 ronde | Anggota saja | Rutin tiap bulan |
| Liga Musiman | Liga | Anggota saja | Minimal 6 partai agar peringkat resmi; klasemen berjalan |
| Turnamen Terbuka | Swiss | Umum, termasuk non-anggota | Untuk pemain luar kota/komunitas |
| Liga Antar Komunitas | Beregu | Umum | Peserta diberi nama **tim**; ada klasemen tim |

Pemain yang belum memenuhi minimal partai tetap tampil di klasemen, tetapi
ditandai "belum memenuhi minimal partai" dan diletakkan di bawah.

### Pindai peserta

Tombol **Pindai peserta** di dalam rincian turnamen memeriksa setiap peserta
ke Chess.com. Yang akunnya ditutup karena pelanggaran fair play akan:

- ditandai **dianulir** — namanya dicoret dan dikeluarkan dari klasemen,
- otomatis masuk daftar larangan komunitas.

Jalankan ini **sebelum mengumumkan juara**. Chess.com kerap menutup akun
curang beberapa minggu setelah kejadian, jadi pemenang bisa berubah.

---

## 6. Perintah pengurus lewat terminal

Selalu jalankan dengan `KCI_PEPPER` yang sama seperti server.

```bash
# Periksa seluruh roster BLUNDER SKUAD ke Chess.com.
# Yang akunnya ditutup karena fair play otomatis masuk daftar hitam.
node scripts/pengurus.mjs pindai

# Blokir manual dari kegiatan situs/turnamen (mis. terbukti curang)
node scripts/pengurus.mjs blokir namauser "Terbukti memakai engine, Turnamen Agustus."

# Cek apakah sebuah nomor HP ada di daftar hitam (sebelum menerima pemain)
node scripts/pengurus.mjs cek 0812-3456-7890

# Lihat isi daftar hitam
node scripts/pengurus.mjs daftar-hitam

# Cabut larangan (banding diterima)
node scripts/pengurus.mjs buka namauser
```

Disarankan menjalankan `pindai` **sebelum setiap turnamen** — Chess.com
sering menutup akun curang beberapa minggu setelah kejadian.

---

## 7. Keterbatasan yang perlu disadari

Sistem ini **mempersulit**, bukan membuat mustahil. Yang masih bisa terjadi:

- Pendaftar memakai nomor HP baru **dan** memalsukan nama serta tanggal lahir.
- Nomor HP milik orang lain (anggota keluarga) dipinjam.

**Sudah ditambahkan:** verifikasi kepemilikan akun Chess.com — pendaftar
membuktikan akun itu benar miliknya, lewat login Chess.com (OAuth) atau
kode di profil. Lihat `PANDUAN-VERIFIKASI-AKUN.md`.

Nomor HP/WA dan DANA sengaja **tidak** diverifikasi OTP — keduanya bersifat
administratif untuk pendataan identitas dan pengiriman hadiah.

---

## 8. Catatan hukum (UU PDP)

Karena mengumpulkan data pribadi, sebaiknya komunitas:

- Menyatakan tujuan pengumpulan pada formulir (sudah ada di kotak "Data pribadi Anda aman").
- Menyediakan cara anggota meminta datanya dihapus.
- Membatasi akses `data/rahasia/` hanya untuk pengurus inti.
