# Riset isepic-chess-ui — harness perilaku klik-langkah

Folder ini menyimpan alat bukti untuk
[`KAJIAN-KLIK-LANGKAH-ISEPIC.md`](../../KAJIAN-KLIK-LANGKAH-ISEPIC.md):
perbandingan **pada peristiwa apa** sebuah langkah dijalankan di
[isepic-chess-ui](https://github.com/ajax333221/isepic-chess-ui) versus papan
`PapanInteraktif`/`PapanTekaTeki` repositori ini.

Berkas di sini **bukan** bagian dari `npm run uji` — keduanya memerlukan klon
pihak ketiga dan hanya dijalankan manual saat kajian ini diperbarui.

| Berkas | Isi |
| --- | --- |
| `uji-isepic-klik.mjs` | Menjalankan `isepic-chess.js` + `isepic-chess-ui.js` **asli** di jsdom, lalu merekam pada event apa langkah terjadi |
| `uji-papan-klik.mjs` | Me-mount `PapanInteraktif` **asli** (esbuild + jsdom) dan merekam alur yang sama, dengan pointer capture diemulasi |
| `hasil-isepic.json` | Jejak keluaran harness isepic (versi 9.1.1 / 5.2.0) |
| `hasil-chessclub.json` | Jejak keluaran harness papan kita |

## Menjalankan

```bash
# klon referensi (MIT) — jalur bisa diganti lewat ISEPIC_SRC
git clone --depth 1 https://github.com/ajax333221/isepic-chess-ui.git /tmp/isepic-src

npm install                                # jsdom + esbuild dari devDependencies
node docs/riset-isepic/uji-isepic-klik.mjs   # → hasil-isepic.json
node docs/riset-isepic/uji-papan-klik.mjs    # → hasil-chessclub.json
```

Keduanya menulis ulang berkas JSON di folder ini; bandingkan jejaknya untuk
melihat kapan `pointerdown`/`mouseup`/`click` benar-benar mengubah posisi.

## Catatan metodologi

* jsdom tidak punya layout → kedua harness memasang **tata letak sintetis 8×8**
  (petak 80 px pada 120,60) dan `elementFromPoint` buatan.
* jsdom tidak punya `setPointerCapture` → harness papan kita **mengemulasinya**:
  selama capture aktif, `pointerup` diarahkan ke elemen papan dan `click`
  dikirim ke nenek-moyang bersama (aturan UI Events). Tanpa emulasi ini, klik
  pada bidak sendiri di jsdom tampak membatalkan pilihan — perilaku yang tidak
  terjadi di browser sungguhan.
* Yang diukur: **urutan dan pemicu** event, jumlah pembacaan
  `getBoundingClientRect`/`elementFromPoint`. Bukan latensi ms nyata di browser
  (lingkungan ini tidak punya browser; uji e2e Playwright repo yang mengisi
  celah itu).
