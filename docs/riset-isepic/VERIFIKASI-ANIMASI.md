# Verifikasi animasi luncuran bidak (anti-"roket")

Dokumen ini untuk **membuktikan sendiri** kecepatan luncuran bidak di papan —
di peramban Anda, halaman Anda, perangkat Anda. Tidak perlu mempercayai
laporan siapa pun: angkanya keluar dari peramban yang sama dengan yang Anda
pakai bermain.

Referensi kebenaran: **isepic-chess-ui** (`_animatePiece`) =
`transition: top 300ms, left 300ms` tanpa timing function alias kurva CSS
`ease`, jarak berapa pun petaknya. Papan kita wajib sama.

---

## 1. Cara tercepat: tempel di DevTools (10 detik)

1. Buka halaman papan, mis. `/papan-interaktif`, `/teka-teki/problem`, atau
   halaman mana pun yang memakai papan (Manusia vs Mesin, Hand Brain, Turing
   Test, Rush).
2. Buka DevTools → tab **Console**.
3. Buka `docs/riset-isepic/cek-animasi-konsol.js`, salin **seluruh isinya**,
   tempel ke Console, tekan Enter.
4. Klik bidak asal (`e2`), lalu klik petak tujuan (`e4`), tunggu ±2 detik.

Console akan mencetak tabel + satu vonis:

| Vonis console | Artinya |
| --- | --- |
| `✓ sama dengan isepic-chess-ui (300 ms, ease)` | Peramban Anda memuat versi yang benar. Kalau gerakannya masih terasa terlalu cepat, itu soal selera — katakan angkanya, bukan bug. |
| `⚠ MENYIMPANG — terlalu cepat / kurva linear (kaku)` | Peramban Anda memuat **bundel lama**. Tekan `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac), ulangi langkah 3–4. |
| `✗ tidak ada luncuran — bidak berpindah seketika (lompat)` | Bidak melompat tanpa animasi sama sekali: kirim hasilnya ke saya. |

Tabelnya juga melaporkan `prefers-reduced-motion` (setelan sistem), ukuran
petak, dan nama bundel JS yang sedang dimuat — tiga hal yang membuat laporan
Anda bisa ditindaklanjuti tanpa menebak.

---

## 2. Cara lengkap: ukur otomatis dari terminal

Skrip `ukur-animasi-peramban.mjs` membuka halaman di peramban sungguhan
(Chromium/Chrome), menjalankan langkah klik `e2 → e4` dengan event mouse asli,
lalu mencatat posisi elemen luncuran **setiap frame**.

```bash
# Siapkan peramban sekali saja (salah satu):
npm i -D puppeteer-core @sparticuz/chromium     # Chromium bawaan paket
# atau pakai Chrome/Chromium sistem Anda lewat CHROME_EXE

# Ukur situs lokal (dev server Anda):
CHROME_EXE=/usr/bin/google-chrome \
  node docs/riset-isepic/ukur-animasi-peramban.mjs http://localhost:5173/papan-interaktif

# Ukur situs produksi — inilah yang dilihat pengunjung:
CHROME_EXE=/usr/bin/google-chrome \
  node docs/riset-isepic/ukur-animasi-peramban.mjs https://chess-club-weld.vercel.app/papan-interaktif

# Bandingkan langsung dengan isepic (butuh klon isepic disajikan lokal):
git clone --depth 1 https://github.com/ajax333221/isepic-chess-ui.git /tmp/isepic-src
CHROME_EXE=/usr/bin/google-chrome \
  node docs/riset-isepic/ukur-animasi-peramban.mjs \
    http://localhost:5173/papan-interaktif http://localhost:5173/isepic/index.html
```

Opsi: `--petak=e2,e4`, `--kurangi-gerak` (paksa setelan sistem "kurangi
gerak"), `--json=hasil.json`.

Contoh keluaran (dari run nyata, Chromium 153, 15 Okt 2026):

```
▸ /papan-interaktif  (petak 59.8 px)
   durasi CSS   : 0.3s, 0.3s   kurva: ease, ease
   terukur      : 295 ms, 119.3 px (2.27 petak), 20 frame
   kurva p(t)   : 0ms=0%  46ms=11%  79ms=35%  112ms=58%  145ms=74%  178ms=85%  245ms=97%  278ms=99%
   vonis        : ✓ 300 ms ease (sama dengan isepic)

▸ /isepic/index.html  (petak 67.7 px)
   durasi CSS   : 0.3s, 0.3s   kurva: ease, ease
   terukur      : 294 ms, 135.1 px (1.99 petak), 19 frame
   kurva p(t)   : 0ms=0%  27ms=4%  60ms=22%  94ms=47%  127ms=67%  160ms=80%  194ms=89%  260ms=99%
   vonis        : ✓ 300 ms ease (sama dengan isepic)
```

Catatan: sandbox pengembangan tidak bisa membuka `*.vercel.app` (jaringan
terbatas), jadi laporan ini **tidak** mengklaim hasil apa pun tentang situs
produksi. Untuk itu, jalankan perintah kedua di atas dari komputer Anda.

---

## 3. Kenapa perlu diukur, bukan dibaca kodenya saja

Riwayat menunjukkan tiga hal yang tidak terlihat dari membaca kode:

1. **Gaya "roket" pernah hidup di produksi.** Commit `ee2a3319` (8 Okt 2026)
   membuat semua papan memakai gaya Report Analisa: `duration: 150, easing:
   "linear"` — dua kali lebih cepat dan tanpa melandai (kaku). Inilah bunyi
   "melesat seperti roket" yang dilaporkan. Dibalik pada `ab906ebd` (15 Okt
   2026), tetapi **papan Report Analisa sendiri masih tertinggal di 150 ms
   linear** sampai diperbaiki.
2. **jsdom tidak menjalankan transisi CSS.** Uji `npm run uji:animasi-bidak`
   membuktikan klon terbang terbentuk dan bergeser, tetapi tidak bisa
   mengukur durasi/kurva sungguhan — karena itu ada skrip di dokumen ini.
3. **Shorthand `transition` menyembunyikan kurva.** `getComputedStyle(el).
   transition` di Chromium berbunyi `top 0.3s, left 0.3s` (kata `ease`
   hilang karena itu nilai bawaan). Pemeriksa harus membaca
   `transitionDuration` + `transitionTimingFunction`, bukan shorthand — jebakan
   yang sempat membuat snippet ini salah memberi vonis sebelum diperbaiki.
