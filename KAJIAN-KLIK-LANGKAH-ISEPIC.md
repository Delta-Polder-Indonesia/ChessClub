# KAJIAN: cara "klik-langkah" isepic-chess-ui vs papan ChessClub

Tinjauan atas **[isepic-chess-ui](https://github.com/ajax333221/isepic-chess-ui)**
(referensi: demo <https://ajax333221.github.io/isepic-chess-ui/>) dibandingkan
dengan papan `PapanInteraktif`/`PapanTekaTeki` di repositori ini.

Pertanyaan yang dijawab: **pada peristiwa apa sebuah langkah benar-benar
dijalankan?** Jawaban singkat:

| | isepic-chess-ui | ChessClub |
| --- | --- | --- |
| Klik-langkah (klik asal → klik tujuan) | dijalankan pada **`mousedown` petak tujuan** | dijalankan pada **`click` petak tujuan** (setelah tombol dilepas) |
| Seret-langkah | `mouseup` di petak tujuan | `pointerup` di petak tujuan |
| Masih bisa dibatalkan setelah menekan tujuan? | **tidak** — langkah sudah jadi | **ya** — lepas di luar petak tujuan = batal |
| Promosi | muncul saat `mousedown`, pilihan **di dalam papan** (satu lajur) | muncul setelah `click`, **dialog di tengah** papan |
| Langkah ilegal | pilihan dihapus diam-diam | petak kilat merah + suara + pulih 700 ms |

---

## 1. Metode (bukan sekadar baca kode)

Dua harness jsdom yang menjalankan **kode asli** kedua pihak, bukan tiruan logika:

| Harness | Yang dijalankan | Keluaran |
| --- | --- | --- |
| [`docs/riset-isepic/uji-isepic-klik.mjs`](./docs/riset-isepic/uji-isepic-klik.mjs) | `js/isepic-chess.js` + `js/isepic-chess-ui.js` (v9.1.1 / v5.2.0) apa adanya | `docs/riset-isepic/hasil-isepic.json` |
| [`docs/riset-isepic/uji-papan-klik.mjs`](./docs/riset-isepic/uji-papan-klik.mjs) | `PapanInteraktif.jsx` + `PapanTekaTeki.jsx` asli, dibundel esbuild lalu di-mount di jsdom | `docs/riset-isepic/hasil-chessclub.json` |

Keduanya: tata letak sintetis 8×8 (jsdom tidak punya layout), pengiriman event
`pointerdown → pointerup → click` seperti browser, dan pada harness ChessClub
**pointer capture diemulasi** (`setPointerCapture` jsdom tidak ada): selama
capture aktif, `pointerup` dan `click` diarahkan ke elemen papan, bukan ke
tombol petak — persis Chromium/Firefox. Tanpa emulasi itu jsdom memberi
perilaku palsu (klik pada bidak sendiri seolah langsung membatalkan pilihan).

**Batasan:** tidak ada browser sungguhan di lingkungan ini (unduhan Chromium
Playwright diblokir), jadi *lama* jeda antar-event tidak diukur dalam ms nyata,
hanya **urutan** dan **pemicunya**. Bahwa alur klik tetap bekerja di Chromium
dibuktikan oleh uji e2e repo ini sendiri
([`tests/e2e/pembukaan.spec.js`](./tests/e2e/pembukaan.spec.js) baris 115–117,
200–207: `click('[data-petak="e2"]')` → `click('[data-petak="e4"]')` → langkah
terjadi, di proyek `desktop-chromium` **dan** `mobile-chromium`).

---

## 2. isepic-chess-ui: alur klik

Sumber: lisensi MIT, satu berkas `js/isepic-chess-ui.js` (2.396 baris).

* Pendengar event dipasang di **`document`**, bukan per petak:
  `mousedown` (`js/isepic-chess-ui.js:1461`), `mouseup` (`:1366`),
  `mousemove` (`:1345`), `wheel`, `contextmenu`.
* Petak yang berada di bawah kursor dicari dengan **memindai 64 petak dan
  membaca `getBoundingClientRect()` masing-masing** (`_getHoverElement`, `:661`).
* `mousedown` (`:1461`): seleksi lama dibatalkan dulu, lalu — bila ada seleksi
  sebelumnya dan petaknya berbeda — langkah **langsung dimainkan**:

  ```js
  if (old_sel && old_sel !== current_bos) {
    mock_move = board.playMove([old_sel, current_bos], { isMockMove: true });
    // …promosi ditangani di sini…
    if (!board.playMove(cache_move_uci, { isLegalMove: true, playSounds: true })) {
      _cancelSelected();
    }
  }
  ```

* `mouseup` (`:1366`) hanya menangani **seret** (`_DRAGGING_BOS`); bila tujuan
  tidak sah → `_cancelSelected()` (tanpa umpan balik visual/suara).
* Seleksi: kelas `.ic_selected` → **warna latar penuh** (kuning `#fdde1b` /
  `#f1d30b`, `css/isepic-chess-ui.css:255`). Petak tujuan legal: kelas
  `.ic_highlight` → titik radial (`:223`), dst.
* Promosi: `_enterPromotionMode` (`:399`) membuat overlay di dalam papan dan
  menaruh 4 bidak **di lajur yang sama** dengan petak promosi
  (`_promotionSquaresHelper`, `:561`), muncul **saat `mousedown`** (klik) atau
  `mouseup` (seret).

### Hasil uji (harness, kode asli)

| Skenario | Hasil terukur |
| --- | --- |
| klik e2 → tekan e4 | FEN **sudah berubah sebelum tombol dilepas** → langkah di `mousedown` tujuan |
| tekan e4 lalu lepas **di luar papan** | langkah tetap jadi (tidak bisa dibatalkan) |
| seret e2 → e4 | langkah di `mouseup` tujuan |
| klik bidak yang sama 2× | pilihan batal |
| klik bidak sendiri lain | pilihan pindah (`d2`), sorotan ikut pindah |
| klik tujuan tidak sah (petak kosong) | pilihan dibatalkan, **tanpa** isyarat galat |
| klik tujuan tidak sah (bidak lawan, `e7`) | pilihan **berpindah ke bidak lawan** itu (sorotan kosong) — perilaku janggal |
| promosi | 4 opsi muncul di `mousedown`, langkah menunggu pilihan |
| biaya layout | **147 pembacaan `getBoundingClientRect`** untuk satu klik-langkah (5×64 petak dipindai per event + refresh UI); 214 untuk pindah pilihan |

---

## 3. ChessClub: alur klik

* Handler **per petak** (React) di `src/halaman/TekaTeki/PapanTekaTeki.jsx`:
  `onPointerDown={(e) => onTekan(e, sq)}` dan `onClick={() => onKlik(sq)}`
  (baris 256–257).
* `padaTekan` (`:838`): klik kanan → tanda/panah; klik kiri → hapus tanda,
  lalu bila bidak milik giliran → `mulaiSeret` (`:811`) yang memasang
  `setPointerCapture` di elemen papan + bidak hantu.
* `padaLepas` (`:918`): akhir seret → `onSelesaiSeret(dari, tujuan, klikUlang)`;
  klik kanan → panah/mark.
* Pemicu langkah ada **di induk**: `klikPetak` (`PapanInteraktif.jsx:499`)
  menjalankan `cobaLangkah` (`:521`) hanya ketika `terpilih && sasaran.includes(petak)`
  — yaitu pada `click` petak tujuan.
* `cobaLangkah`: promosi → dialog; langkah ilegal → `setKesalahan` + suara
  `SUARA.ilegal` + dibersihkan 700 ms (`:555`).
* Bidak asal **disembunyikan** selama seret (`sedangDiseret`), petak tujuan
  legal ditandai titik `rounded-full`, pilihan kuning transparan
  `rgba(255,255,0,0.45)`.

### Hasil uji (harness, komponen asli)

| Skenario | Hasil terukur |
| --- | --- |
| klik e2 → tekan e4 → lepas | **belum** jadi; langkah baru terjadi saat `click` e4 |
| tekan e4 lalu lepas di luar papan | **batal**, pilihan `e2` tetap hidup |
| seret e2 → e4 | langkah di `pointerup` tujuan |
| klik bidak yang sama 2× | pilihan batal |
| klik bidak sendiri lain | pilihan pindah (`d2`, sasaran `d3`,`d4`) |
| klik tujuan tidak sah (petak kosong) | pilihan dibatalkan, **tanpa** isyarat galat |
| klik tujuan tidak sah (bidak lawan `e7`) | pilihan dibatalkan (tidak menyeleksi bidak lawan) |
| seret ke petak ilegal (`e5`) | petak `e2`+`e5` kilat merah, hilang setelah ±700 ms |
| promosi | pilihan muncul **setelah klik tujuan dilepas** (4 tombol), langkah selesai setelah memilih; `a8=Q` |
| biaya layout | **2** pembacaan `getBoundingClientRect` untuk satu klik-langkah; hit-test arah seret memakai `document.elementFromPoint` |
| `pointercancel` saat seret → klik tombol “Baru” | klik **pertama tertelan**, klik kedua baru bekerja (lihat §5.2) |

---

## 4. Perbandingan langsung

| Aspek | isepic-chess-ui | ChessClub (punya kita) | Penilaian |
| --- | --- | --- | --- |
| Pemicu langkah klik-klik | `mousedown` tujuan (tekan = jadi) | `click` tujuan (lepas = jadi) | selera; isepic ~1 event lebih cepat, kita bisa dibatalkan |
| Bisa dibatalkan setelah menekan tujuan | tidak | ya | **kita lebih baik** |
| Umpan balik langkah ilegal | tidak ada | kilat merah + suara | **kita lebih baik** |
| Seleksi bidak lawan | bisa terseleksi tanpa sorotan | ditolak | **kita lebih baik** |
| Biaya layout per interaksi | 147 `getBoundingClientRect` (pindai 64 petak tiap event) | 2 (`elementFromPoint` saat seret) | **kita lebih jauh lebih ringan** |
| Cara menandai pilihan | warna latar penuh (`#fdde1b`) | overlay kuning 45% | seragam; isepic lebih kontras |
| Promosi | opsi di dalam papan pada lajur bidak | dialog tengah papan | isepic lebih dekat ke bidak yang dipromosikan |
| Tanda klik kanan | 1 lingkaran SVG (panah butuh seret) | panah poligon persis chess.com + mark | kita lebih kaya |
| Bidak “terbang” | klon `cloneNode` + transisi `top/left` | pola sama (`animasiBidak.js`), 300 ms | setara; sudah disengaja sama |
| Tombol/komponen | satu berkas 2.396 baris, event di `document` | React per petak + memoisasi | kita lebih teruji (`uji:tanda-papan`, dll.) |
| Jalan pintas keyboard/gulir | ada (`scrollNavigation`, `arrowKeysNavigation`) | navigasi lewat tombol/tab panel | isepic lebih banyak jalan pintas |

---

## 5. Temuan yang layak ditindaklanjuti

### 5.1 (Opsional, ide) geser pemicu langkah ke `pointerdown` petak tujuan

Kalau ingin rasa “senyap-klik” seperti isepic (langkah dieksekusi begitu petak
tujuan ditekan, tanpa menunggu lepas), perubahannya kecil: di `PapanTekaTeki`,
tambahkan jalur `onTekan` yang memanggil `onKlik` **hanya bila** petak itu sudah
menjadi sasaran (`sasaran.includes(petak)`), lalu tandai klik berikutnya agar
diabaikan (pola `abaikanKlikRef` sudah ada).

**Risikonya nyata** dan itu sebabnya isepic membayarnya: langkah tidak bisa
dibatalkan lagi setelah tujuan tersentuh, dan di perangkat sentuh salah tekan =
langkah langsung jadi. Saran: tahan dulu sebagai opsi pengaturan bila memang
diinginkan; jangan dijadikan perilaku tunggal.

Uji e2e yang bisa membedakan kedua perilaku (uji repo saat ini **tidak** bisa —
`locator.click()` tidak punya jeda tekan–lepas):

```js
const tujuan = await page.locator('[data-petak="e4"]').boundingBox();
await page.mouse.move(tujuan.x + tujuan.width / 2, tujuan.y + tujuan.height / 2);
await page.mouse.down();                       // tekan saja
await expect(page.getByRole("tabpanel")).toContainText("e4"); // lulus = perilaku isepic
await page.mouse.up();
```

### 5.2 (Perbaikan kecil, terbukti) satu klik di mana pun tertelan setelah seret dibatalkan

`padaBatal` (`PapanTekaTeki.jsx:960`) — dipanggil saat `pointercancel` /
`lostpointercapture` — memasang `abaikanKlikRef.current = true`, sedangkan
pembersihnya adalah pendengar `click` tingkat `document` (`:581`) yang
**menelan satu klik berikutnya di mana pun di halaman**. Pada kasus normal
(browser mengirim `click` setelah seret) penjaga itu memang disengaja dan aman —
tetapi saat `pointercancel` **tidak ada** `click` menyusul (gulir/gesture OS,
tab berpindah, jendela kehilangan fokus), bendera tetap terpasang dan **klik
berikutnya pada tombol apa pun hilang tanpa reaksi**.

Dibuktikan di harness (`uji-papan-klik.mjs`, skenario 10): setelah
`pointercancel`, klik pertama pada tombol “Baru” tidak berefek, klik kedua baru
bekerja (`klikPertamaTertelan: true`).

Usulan perbaikan minimal — bersihkan bendera tanpa bergantung pada `click`
berikutnya:

```js
// di dalam padaBatal(), setelah abaikanKlikRef.current = true;
window.setTimeout(() => { abaikanKlikRef.current = false; }, 300);
```

(atau batasi penelan hanya untuk klik yang benar-benar satu rangkaian dengan
gesture, mis. hanya bila `e.detail === 1` dan target masih di dalam papan).

### 5.3 (Tidak perlu diubah) yang sudah lebih baik dari isepic

* **Batal-klik**: tekan tujuan lalu lepas di luar papan → batal, pilihan utuh.
  isepic tidak punya kemampuan ini.
* **Umpan balik ilegal**: kilat merah + suara (isepic diam saja).
* **Bidak lawan tidak bisa “terseleksi”** seperti di isepic (`e7` di skenario 7).
* **Beban layout**: 2 vs 147 pembacaan `getBoundingClientRect` per langkah —
  pada perangkat kelas bawah perbedaan ini terasa saat menggulir/menyeret cepat.
* Perilaku yang sudah **sama** dan tidak perlu diutak-atik: klik ulang batal
  pilih, pindah pilihan ke bidak lain, batas gerak 5 px sebelum dianggap seret,
  bidak hantu mengikuti kursor, bidak asal disembunyikan saat diseret.

### 5.4 (Opsional) pilihan promosi menempel di petak

isepic menaruh 4 opsi promosi di lajur bidak (`_promotionSquaresHelper`) sehingga
mata tidak perlu berpindah ke tengah layar. Dialog tengah kita lebih mudah
diakses (fokus, Escape, klik luar) dan konsisten dengan halaman teka-teki —
pertukaran yang wajar; tidak perlu diubah kecuali ingin nuansa isepic.

---

## 6. Yang belum diverifikasi

* **Latensi nyata** perbedaan `mousedown` vs `click` (perlu Playwright dengan
  `page.mouse.down()`/`up()` berjeda; di sini hanya urutan event yang diukur).
* Perilaku **sentuh** (`pointerType: "touch"`) — harness memakai mouse; uji e2e
  `mobile-chromium` repo ini sudah mencakup alur klik dasar.
* **Safari/WebKit** (khususnya urutan `lostpointercapture` vs `click`) — repo
  ini baru menguji Chromium.
* Kinerja 147 `getBoundingClientRect` isepic diukur di jsdom (tanpa layout
  nyata); di browser angka absolutnya akan berbeda, tetapi polanya
  (pindai 64 petak tiap event) tetap sama.

---

## 7. Lampiran — menjalankan harness

```bash
# 1. kode isepic (MIT) ke /tmp
git clone --depth 1 https://github.com/ajax333221/isepic-chess-ui.git /tmp/isepic-src

# 2. prasyarat harness (jsdom + esbuild sudah ada di devDependencies repo)
npm install

# 3. jalankan (dari akar repo)
node docs/riset-isepic/uji-isepic-klik.mjs    # → hasil-isepic.json
node docs/riset-isepic/uji-papan-klik.mjs     # → hasil-chessclub.json
```

Kedua skrip menulis jejak JSON (tiap tahap: FEN/petak terpilih/sasaran/bidak)
sehingga hasil di dokumen ini bisa direproduksi ulang tanpa membaca ulang kode.
