# Suara papan (`public/SoundChess`)

Berkas MP3 yang dibunyikan Papan Interaktif, Teka-Teki, dan Analisa.

## Isi

- `standard/` — 34 berkas yang dipakai situs. MPEG-1 Layer III, 44,1 kHz,
  umumnya mono, durasi 0,1–1,8 detik, total ±205 KB.
- `default/illegal.mp3` — varian cadangan bunyi langkah tidak sah (belum
  dipakai; disimpan sebagai alternatif bila `standard/illegal.mp3` terasa
  kurang tegas).

Nama berkas adalah "nama bunyi" yang dipakai kode, tanpa ekstensi
(`move-self`, `capture`, `puzzle-correct`, …). Lihat peta `SUARA` di
`src/lib/suara.js`.

## Cara memakainya dari kode

```js
import { SUARA, gunakanSuara } from "../../lib/suara.js";

const { nyala, setNyala, mainkan, mainkanLangkah } = gunakanSuara();
mainkan(SUARA.ilegal);              // satu bunyi
mainkanLangkah(pindah, game);       // bunyi otomatis dari hasil chess.js move
```

Aturan penting:

- Jangan menulis `/SoundChess/...` langsung. Alamatnya dibentuk lewat
  `berkasPublik()` supaya benar di GitHub Pages (base URL bukan `/`).
- Pemutaran memakai Web Audio (`decodeAudioData` → `AudioBufferSourceNode`),
  dengan cadangan `HTMLAudioElement`. Bunyi pertama baru terdengar setelah ada
  interaksi pengguna — itu kebijakan autoplay peramban, bukan bug.
- Sakelar hidup/mati tersimpan di `localStorage` kunci `kci-suara-papan`
  (dibagi Papan Interaktif + Teka-Teki). Analisa punya sakelarnya sendiri
  (`boardSounds` di panel pengaturan).

## Lisensi

Berkas MP3 ini berasal dari **set suara papan Chess.com, LLC** (struktur dan
nama berkasnya sama dengan `chess-themes/sounds/_MP3_/…`). Hak ciptanya tetap
pada pemiliknya — bukan aset bebas lisensi. Dipakai apa adanya, tanpa
modifikasi, dengan atribusi di halaman Atribusi situs.

Jangan menyalin folder ini ke proyek lain, dan jangan menambah berkas suara
baru dari sumber berlisensi copyleft (mis. MP3 Lichess yang AGPL-3.0) tanpa
memeriksa akibatnya bagi lisensi situs.

## Kebersihan folder

Folder `__MACOSX/` bawaan hasil unzip macOS dan berkas `.DS_Store` sudah
dihapus — jangan di-commit lagi bila mengekstrak ulang arsip suara.
