# Skill: Analisa Kode (Pengurus ChessClub)

Panduan analisa kode sistematis untuk semua agente/pengembang yang bekerja pada repository ChessClub, khususnya area `src/halaman/Pengurus/`. Digunakan untuk review, audit, debug, dan pemahaman codebase.

## Prinsip Utama

1. **Baca sebelum menyimpulkan.** Semua klaim harus berdasarkan kode yang benar-benar dibaca, bukan asumsi dari nama file atau fungsi.
2. **Dari luas ke sempit.** Mulai dari struktur proyek, lalu modul, lalu fungsi, lalu baris.
3. **Ikuti alur data dan alur kontrol.** Bug dan celah biasanya ada di perbatasan: input pengguna, I/O, pemanggilan antar modul, penanganan error.
4. **Verifikasi dengan menjalankan** (test, linter, type checker, build) bila memungkinkan, bukan hanya membaca.
5. **Pisahkan fakta dari dugaan.** Tandai jelas mana yang terbukti dan mana yang hipotesis.
6. **Read-only secara default.** Analisa tidak mengubah file kecuali diminta.

## Alur Kerja

### Langkah 0: Pahami permintaan
- Tentukan tujuan: *memahami*, *review*, *debug*, *audit keamanan*, atau *performa*?
- Tentukan cakupan: seluruh repo, satu modul, satu PR/diff, atau satu fungsi?
- Jika ambigu dan mahal bila salah, tanya satu pertanyaan singkat. Jika tidak, ambil asumsi paling masuk akal dan sebutkan.

### Langkah 1: Petakan proyek (orientasi)
1. Lihat struktur direktori: `src/halaman/Pengurus/` (25 berkas dashboard admin), `src/gaya/components/` (21 berkas CSS + `index.css`), `src/lib/api/`, `src/components/ui/`.
2. Baca file kunci: `package.json`, `AGENTS.md`, `DESIGN.md`, `PANDUAN-1-PINTU.md`, `REVIEW-PENGURUS.md`, `PANDUAN-PENGURUS.md`.
3. Tentukan: bahasa & framework (React + Vite), titik masuk, dependensi utama, cara menjalankan test (`npm run uji:desain`, `npm run lint`, `npm run build`).
4. Cek `git log --oneline -20` dan `git status` untuk konteks riwayat.

### Langkah 2: Temukan titik masuk dan alur utama
- Cari entry point: `Gerbang.jsx` (login dashboard), `Dashboard.jsx` (router utama tab admin).
- Telusuri alur: **input -> validasi -> logika bisnis -> penyimpanan/IO -> output**.
- Catat modul inti dan ketergantungan (siapa memanggil siapa): `Dashboard.jsx` memanggil semua panel (`Anggota`, `Larangan`, `Pesan`, `PanelTurnamen`, `PanelEbook`, `PanelKonten`, `Pengaturan`).

### Langkah 3: Baca kode yang relevan dengan teliti
- Baca file secara utuh untuk file penting; gunakan offset/limit untuk file besar.
- Cari **semua pemakaian** sebuah simbol sebelum menyimpulkan efek perubahan.
- Perhatikan: kontrak fungsi (tipe, nilai balik, exception), state bersama, urutan eksekusi, concurrency, dan kasus tepi (null, kosong, besar, unicode, zona waktu).

### Langkah 4: Periksa kategori masalah

**A. Kebenaran (bug logika)**
- Off-by-one, kondisi terbalik, kasus tepi tak tertangani, null/None tak diperiksa.
- Race condition, state bersama tanpa kunci.
- Error tertelan, return value diabaikan, resource tidak ditutup.
- Asumsi tipe/format data yang tidak divalidasi.

**B. Keamanan**
- Injeksi, XSS, SSRF, path traversal.
- Autentikasi/otorisasi lemah atau terlewat (IDOR).
- Secret hardcoded (cari `password|secret|api[_-]?key|token`).
- `rel="noreferrer"` tanpa `noopener` pada `target="_blank"`.
- Logging data sensitif, CORS terlalu longgar.

**C. Performa**
- Query N+1, loop bersarang di data besar, query tanpa indeks/limit.
- Pekerjaan berulang yang bisa di-cache, I/O sinkron di jalur panas, alokasi berlebih.
- `setInterval`/`setTimeout` tanpa cleanup (memory leak).

**D. Kualitas & keterawatan**
- Duplikasi, fungsi terlalu besar, nama tidak jelas, kompleksitas tinggi.
- Dead code, TODO/FIXME, kopling ketat, abstraksi bocor.
- Prop yang dikirim tapi tidak terbaca (data mati).

**E. Keandalan & operasional**
- Penanganan error, retry/timeout, graceful shutdown, konfigurasi per-lingkungan.

### Langkah 5: Verifikasi (jika bisa dijalankan)
- Jalankan `npm run lint` — harapan: 0 error baru.
- Jalankan `npm run build` — harapan: build sukses.
- Jalankan `npm run uji:desain` — harapan: standar desain terjaga.
- Cek `grep title=` di `src/halaman/Pengurus/` — harapan: 0 native `title=` tersisa (semua pakai `TooltipLabel`).
- Cek `console.log|debugger` — harapan: tidak ada.
- Cek semua `setInterval`/`setTimeout`/`addEventListener` punya cleanup `clearInterval`/`clearTimeout`/`removeEventListener`.

### Langkah 6: Prioritaskan dan laporkan

Tingkat keparahan:
- **Kritis**: bisa dieksploitasi / merusak data / crash di jalur utama.
- **Tinggi**: bug nyata atau celah dengan syarat tertentu.
- **Sedang**: risiko atau masalah desain yang akan menyulitkan nanti.
- **Rendah**: gaya, keterbacaan, saran kecil.

Format laporan:
```
## Ringkasan
1-3 kalimat: apa yang dianalisa, kesimpulan utama, jumlah temuan per tingkat.

## Temuan
### [Tingkat] Judul singkat
- Lokasi: `path/file.jsx:42`
- Masalah: apa yang salah dan mengapa.
- Bukti: potongan kode singkat atau hasil perintah.
- Dampak: apa yang terjadi bila tidak diperbaiki.
- Saran perbaikan: langkah konkret.

## Yang Sudah Baik
Hal positif yang layak dipertahankan.

## Tidak Terverifikasi / Asumsi
Bagian yang tidak sempat/bisa dicek, dan asumsi yang dipakai.

## Langkah Berikutnya
1-3 tindakan yang disarankan, berurutan.
```

## Aturan Kualitas Laporan

- Setiap temuan wajib punya **lokasi `file:baris`** dan **alasan**. Tanpa bukti, jangan laporkan sebagai fakta.
- Jangan membanjiri laporan dengan hal sepele; urutkan dari yang paling penting.
- Hindari positif palsu: cek apakah kode lain (validasi di hulu, framework, test) sudah menangani masalah sebelum melaporkan bug.
- Gunakan bahasa Indonesia dan nada konstruktif, fokus pada kode bukan penulisnya.
- Jika diminta hanya "memahami", jangan berikan daftar kritik panjang; jelaskan cara kerjanya.
- Jangan mengubah file selama analisa kecuali diminta. Jika memperbaiki, tampilkan diff dan jalankan ulang test.

## Checklist Sebelum Selesai

- [ ] Apakah semua klaim didukung kode yang dibaca?
- [ ] Apakah semua pemakaian simbol relevan telah dicari?
- [ ] Apakah `eslint`, `build`, dan `uji:desain` telah dijalankan?
- [ ] Apakah tiap temuan punya lokasi, dampak, dan saran?
- [ ] Apakah asumsi dan hal tidak terverifikasi telah ditandai?

## Contoh Temuan yang Sudah Diperbaiki (referensi)

| File | Masalah | Perbaikan |
|------|---------|-----------|
| `ui.jsx:328` | `bahaya` di-destructure tapi tidak digunakan | Digunakan untuk gaya hover item "Hapus" |
| `PanelTurnamen.jsx:48` | `beriTahu` di dependency array `useCallback` tapi tidak dipakai | Dibuang dari deps |
| `Dashboard.jsx:573` | `anggota` dikirim ke `PanelTurnamen` tapi tidak terbaca | Prop dihapus |
| `Anggota.jsx` | `window.open(..., "_blank", "noopener")` kurang `noreferrer` | Ditambah `noreferrer` |
| `PanelJuara.jsx` | `rel="noreferrer"` kurang `noopener` | Ditambah `noopener noreferrer` |
| 10 file Pengurus | Native `title=` bawaan browser tidak konsisten | Semua diganti `<TooltipLabel>` |