# Audit & Review — `src/halaman/PapanInteraktif/PapanInteraktif.jsx`

Tanggal audit: 4 September 2026
Komit yang diaudit: `a4a9b75` — *"rombak jadi papan analisa gelap full-screen dengan panel tab, engine, dan katalog pembukaan"*
Berkas turutan yang ikut diperiksa: `PapanTekaTeki.jsx`, `lib/gunakanEngineCatur.js`, `components/PanelEngine.jsx`, `lib/artikelWikipedia.js`, `lib/namaPembukaan.js`, `lib/skakmat.js`, `public/data/buku-pembukaan.json`.

## Ringkasan

| Tingkat | Jumlah | Status |
|---|---|---|
| 🔴 Kritis / bug fungsional | 1 | **sudah diperbaiki + ada uji regresinya** |
| 🟠 Menengah (kinerja, i18n, kebersihan) | 4 | 2 diperbaiki, 2 jadi rekomendasi |
| 🟡 Kecil / defensif | 8 | rekomendasi |

Kesimpulan: perombakan secara keseluruhan **aman** — tidak ada risiko keamanan yang nyata, tidak ada XSS, tidak ada kebocoran fatal, dan seluruh rangkaian uji repo lulus. Namun ada **satu bug fungsional yang pasti dialami pengguna** (klik pertama setelah menyeret bidak hilang). Bug itu sudah saya perbaiki beserta uji regresinya.

---

## 🔴 P1 — Klik pertama setelah menyeret bidak hilang (SUDAH DIPERBAIKI)

**Gejala.** Setiap kali pengguna menyeret (drag) bidak, atau membatalkan seretan dengan klik kanan, **satu klik berikutnya di papan tidak melakukan apa-apa**. Pengguna harus mengklik dua kali untuk memilih bidak. Ini terjadi 100% reproduksibel di desktop maupun sentuhan.

**Akar masalah.** Ada dua penanda "abaikan klik" yang berjalan paralel:

1. `PapanTekaTeki` punya `abaikanKlikRef` sendiri. Ia memasang listener `click` di tingkat `document` (fase capture) yang mengonsumsi penanda itu dan memanggil `stopPropagation()`.
2. `PapanInteraktif` juga punya `abaikanKlikRef` sendiri yang disetel `true` di `selesaiSeret()` / `batalkanSeret()` dan baru dikonsumsi di `klikPetak()`.

Karena event `click` pasca-seretan **lebih dulu dihentikan** oleh listener milik `PapanTekaTeki`, `klikPetak()` tidak pernah dipanggil — sehingga penanda milik `PapanInteraktif` tidak pernah dibersihkan. Klik *berikutnya* lalu ikut ditelan. Pola yang sama ada di `TekaTeki.jsx`, jadi halaman Teka-Teki berpotensi kena gejala serupa.

**Perbaikan.**
- `PapanInteraktif.jsx`: penanda ganda dihapus. Penekanan klik pasca-seretan cukup ditangani oleh papan (satu sumber kebenaran).
- `PapanTekaTeki.jsx`: penanda disetel ulang di awal setiap `pointerdown`. Ini menambal kasus seretan yang berakhir di luar jendela (browser tidak pernah mengirim `click` penutup) — yang bisa membuat penanda menyala selamanya dan menelan klik pada *tombol apa pun* di halaman, bukan hanya papan. Perbaikan ini juga menguntungkan halaman Teka-Teki.

**Bukti.** Uji baru `scripts/uji-papan-interaktif.mjs`:

| Kondisi | Hasil |
|---|---|
| kode asli (`HEAD`) | 33 lulus, **2 gagal** — "klik pertama setelah seretan langsung memilih bidak" ✗ |
| setelah perbaikan | **35 lulus, 0 gagal** |

Uji ini sudah masuk ke `npm run uji` (`uji:papan-interaktif`).

---

## 🟠 P2 — Perbaikan lain yang sudah diterapkan

**1. `new Chess(fen)` berjalan di setiap render untuk nilai yang tak terpakai.**
`giliranKini` dihitung dari `new Chess(fen)` di badan komponen — artinya berjalan pada **setiap** render, padahal nilainya tidak pernah dipakai. Hal yang sama untuk `statTampil` (useMemo) dan `jumlahNama`. Saat engine menyala halaman ini re-render sangat sering (lihat M2), jadi biayanya nyata. → dihapus.

**2. `snapshotEvalRef` (Map FEN → eval) tumbuh tanpa batas.**
Peta ini tidak pernah dikosongkan — tidak saat tombol **New**, tidak saat engine dimatikan, tidak saat memuat PGN/FEN baru. Sesi analisis panjang terus menambah entri. → dibatasi 500 entri (FIFO) dan dikosongkan saat engine dimatikan.

---

## 🟠 Rekomendasi (belum diubah — perlu keputusan Anda)

### M1 — 3.196 baris katalog di-render sekaligus di tab Books
`buku-pembukaan.json` berisi 18.713 entri / 3.196 nama unik. `BukuPembukaan` merender **semuanya** tanpa virtualisasi atau pagination — terukur ±700 ms di jsdom (tanpa layout!), yang di perangkat menengah bisa 1–3 detik dan menguras memori (≈10 ribu simpul DOM).
Saran: render bertahap (mis. 100 baris + "muat lagi") atau virtual list.

### M2 — Render ulang sangat sering saat engine menyala
`gunakanEngineCatur` meneruskan **setiap** baris `info` Stockfish ke `padaInfo` (bisa puluhan–ratusan per detik) → `setHasilEngine` → seluruh halaman re-render, termasuk 64 petak `PapanTekaTeki` (tidak dibungkus `React.memo`) dan `DaftarRiwayat`.
Saran: throttle `padaInfo` di `gunakanEngineCatur` (≥150–250 ms) dan/atau bungkus `PapanTekaTeki` dengan `React.memo`. Perubahan ini berbagi pakai dengan Teka-Teki, jadi saya tidak mengubahnya sendiri.

### M3 — Teks hardcoded di luar kamus i18n
Repo punya kamus ID/EN lengkap (`uji:i18n` hanya memeriksa kunci `t(...)`, jadi teks mentah lolos). Yang belum masuk kamus:
- Baris pemain: `Hitam`, `Putih`
- Tombol bawah: `New`, `Save`, `Review`, `Share`
- Dialog Review: `Input PGN / FEN`, `Batal`, `Muat`, `Tutup`, `PGN/FEN tidak dapat dimuat — periksa kembali isinya.`

### M4 — Tombol `Share` tidak punya aksi
`<button>` **Share** tidak punya `onClick` — tombol mati. Di sisi lain `salinFen()` dan state `fenTersalin` sudah ditulis tetapi **tidak pernah dipanggil**, sisanya dari rancangan lama.
Saran: pasang `onClick={salinFen}` pada Share (atau hapus jika belum diperlukan). Perhatikan juga tombol **Save** sebenarnya menyalin PGN (`salinPgn`) — labelnya membingungkan.

---

## 🟡 Catatan kecil / defensif

| # | Temuan | Catatan |
|---|---|---|
| M5 | `artikelWikipedia.js` memakai `halaman.fullurl` & `thumbnail.source` terus dari API untuk `href`/`src` | React tidak menahan `href="javascript:…"`. Risiko rendah (HTTPS + Wikimedia), tapi murah diamankan: hanya terima skema `http(s):`. |
| M6 | `CACHE` di `artikelWikipedia.js` tidak pernah dibuang | Batas wajar per sesi; tidak kritis. |
| M7 | `id="sampel-toggle-engine"` pada saklar engine | Sisa penamaan dari layout "sampel" yang dimigrasikan. Ganti bila tidak direferensikan pengujian/analytics. |
| M8 | Terjemahan memakai endpoint tak resmi `translate.googleapis.com/…client=gtx` | Sudah ada fallback yang benar (tetap versi Inggris + ditandai "otomatis"). Hanya catatan: endpoint bisa berubah/diblokir. |
| M9 | Kunci pohon pembukaan tidak menyimpan akhiran promosi | `kuciDariPindahan` memakai `from+to` ("e7e8") sedangkan format Lichess menulis "e7e8q". Saat ini **aman**: 0 dari 185.955 token langkah adalah promosi. Bila dataset diregenerasi, kunci tak akan cocok → `cocok=false`, tab Games menampilkan "e7e8q" mentah, dan `mainkanSan` gagal. |
| M10 | Klik bidak yang sama dua kali tidak membatalkan pilihan | chess.com membatalkan pilihan pada klik kedua. Sekadar UX. |
| M11 | `pilihan` (sorotan buku di tab Books) tidak dibersihkan saat undo/ke-awal/lompat langkah | Bisa menyorot entri yang sudah tidak sesuai posisi. `reset()` dan `terapkanTeks()` sudah benar memanggil `setPilihan(-1)`. |
| M12 | `reset()` dan `keAwal()` duplikat | Dua fungsi nyaris identik (bedanya hanya `riwayatLengkap`). Bisa disatukan dengan parameter. |
| M13 | Bilah evaluasi menampilkan `1-0` / `0-1` bila `matePutih === 0` | Secara praktis tak pernah terjadi (`susunHasilEngine` tidak pernah menghasilkan 0). Murni defensif. |

---

## ✅ Yang sudah diverifikasi AMAN

- **Build** Vite lolos tanpa error; bundle `PapanInteraktif` 49,62 kB (gzip 15,64 kB) — wajar dan sudah terpecah jadi chunk sendiri.
- **Seluruh rangkaian uji repo lulus** (`npm run uji`, 12 suite) termasuk 35 pemeriksaan baru untuk halaman ini.
- **i18n**: semua 38 kunci `papan.*` / `tekaTeki.promosi*` ada di `terjemahan.id.js` dan `terjemahan.en.js`.
- **Tidak ada XSS**: ringkasan Wikibooks dibersihkan (`bersihTeksArtikel`) lalu dirender sebagai teks (React escaping). Satu-satunya `target="_blank"` selalu berpasangan dengan `rel="noopener noreferrer"`.
- **Validasi masukan**: PGN/FEN diparsing dengan chess.js; masukan tidak valid ditolak tanpa mengubah papan (dites).
- **Jaringan**: artikel Wikibooks hanya diminta saat tab Explorer aktif (dites); ada debounce 300 ms + `AbortController` + penjaga `untuk === identitasArtikel` sehingga undo/redo cepat tidak memicu permintaan beruntun.
- **Kebersihan hidup komponen**: timer `timerSalah`/`timerSalin` dibersihkan saat unmount; worker engine di-`terminate()` saat halaman ditutup; fetch pohon pembukaan dijaga flag `aktif`.
- **Alur yang diuji dan lulus**: klik-pilih → klik-tujuan, seret, batal seret, undo/redo/ke-awal/ke-akhir, tombol New, lompat lewat daftar langkah, dialog Review (PGN valid, PGN rusak, FEN), promosi (4 pilihan terjemahan + Escape), lencana skakmat, tab Books/Explorer/Games, dan toggle engine.
- **Tidak ada galat render React** di sepanjang pengujian.

### Batasan pengujian
Chromium tidak tersedia di lingkungan ini, sehingga pengujian memakai **jsdom + React sungguhan** (bukan peramban nyata). Hal-hal berikut **belum** terverifikasi dan sebaiknya dicek manual di peramban:
- gerakan seret pada perangkat sentuh (touch) dan perilaku `setPointerCapture` sesungguhnya;
- kinerja render nyata tab Books (M1) dan saat engine menyala (M2);
- tampilan visual/responsif panel tab pada layar kecil.

---

## Cara menjalankan

```bash
npm run uji:papan-interaktif   # 35 pemeriksaan halaman ini
npm run uji                    # seluruh rangkaian uji repo
```
