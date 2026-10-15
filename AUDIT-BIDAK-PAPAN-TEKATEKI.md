# Audit Bidak — Papan Interaktif & Teka-Teki (termasuk Rush)

Tanggal: 2026-10-16 · Basis: commit `d6e93c1` (cabang `arena/f6c4659a-chessclub`)
Cakupan: `/papan-interaktif/*` (bidak + papan), `/teka-teki` + `/teka-teki/problem/<id>`, `/teka-teki-rush`.

Dokumen ini adalah hasil audit **bidak papan** (pemuat set, gestur seret/klik, tanda bantu,
animasi luncuran) dan **halaman teka-teki** (alur langkah, navigasi, promosi, Rush), lalu
**diperbarui dengan status perbaikan**: semua temuan di bawah sudah dikerjakan pada hari yang
sama di cabang ini (§7), termasuk satu cacat baru yang dilaporkan pemilik situs (BUG-4: bidak
hilang setelah langkah salah).

---

## 1. Ringkasan

| ID | Prioritas | Inti | Berkas | Bukti | Status |
| --- | --- | --- | --- | --- | --- |
| **BUG-1** | **P1** | Satu kegagalan unduh chunk aset mengunci set bidak **seumur sesi** — papan kosong, percobaan ulang sia-sia | `src/components/chess/pemuatBidak.js:99-135` | direproduksi (harness) | **DIPERBAIKI** |
| **BUG-2** | **P2** | Navigasi review teka-teki (`◀ ▶ ⏭ ⏮`) meleset satu indeks → papan «beku», posisi papan ≠ posisi yang diyakini aplikasi | `src/halaman/TekaTeki/TekaTeki.jsx:1085`, `:1134`, dipakai `:1041` | direproduksi (harness) | **DIPERBAIKI** |
| **BUG-4** | **P1** | **Laporan pemilik situs:** setelah langkah salah (klik petak tujuan kosong), bidak **hilang** dari petak asalnya — klonnya mendarat di petak yang tak pernah berisi bidak, lalu dibuang tanpa menampilkan lagi bidak asal | `src/halaman/TekaTeki/PapanTekaTeki.jsx` (`selesaikanKlon`, `mulaiTerbang`, efek `kesalahan`) | direproduksi (harness `audit-bidak-papan/audit-bidak-hilang.mjs`) | **DIPERBAIKI** |
| BUG-3 | P3 | Satu klik **di mana pun** di halaman termakan setelah seret dibatalkan (`pointercancel`) | `src/halaman/TekaTeki/PapanTekaTeki.jsx:569-609` | direproduksi (harness) | DIPERBAIKI |
| CAT-1 | P3 | Petak «Bantuan Langkah» selalu dinilai dengan promosi **menteri**, walau pemain mungkin akan memilih bidak lain | `src/lib/bantuanSeret.js:33` | baca kode | DIPERBAIKI |
| CAT-2 | P3 | Warna tanda klik-kanan: dokumentasi bilang bawaan **kuning**, kode memberi **merah**; panah tetap kuning | `src/halaman/TekaTeki/PapanTekaTeki.jsx:26-28` vs `:53-59` | baca kode | DIPERBAIKI |
| CAT-3 | P3 | Papan Interaktif bawaannya set `alpha` (lazy, 12 request) sementara hanya `merida` yang eager → bidak telat tampil di render pertama | `src/halaman/PapanInteraktif/bersama/gunakanPengaturanPapan.js:14`, `pemuatBidak.js:176-181` | baca kode | DIPERBAIKI |

Yang **tidak** ditemukan (sudah diperiksa, jangan diulang): dataset `teka-teki.json` bersih,
semua jalur aset 53 set lengkap, seluruh warna papan punya palet, dan dugaan
"klik pertama termakan setelah menyeret bidak" **tidak terbukti** (§6).

---

## 2. Cakupan & metode

Dibaca penuh: `PapanTekaTeki.jsx`, `TekaTeki.jsx`, `TekaTekiRush.jsx`, `animasiBidak.js`,
`temaPapan.js`, `PapanInteraktif.jsx` + `bersama/*`, `src/lib/{tekaTeki,suara,tandaBantu,
bantuanSeret,gunakanBantuanSeret,skakmat,asets}.js`, `components/chess/{pemuatBidak,ChessPiece}`,
`scripts/uji-*.mjs` yang relevan, `KAJIAN-KLIK-LANGKAH-ISEPIC.md`.

Suite yang dijalankan (semua **LULUS**, 0 gagal) — angka dalam tanda kurung adalah jumlah uji
**sesudah** penambahan uji regresi (§7):
`uji-render-bidak` (70), `uji-animasi-bidak` (101), `uji-glob-aset` (9), `uji-tanda-papan` (26),
`uji-tanda-bantu` (27), `uji-pratinjau-langkah` (11), `uji-seret-bidak` (27),
`uji-lencana-skakmat` (31), `uji-bantuan-langkah` (66), `uji-tekateki-solusi` (10),
`uji-tekateki-alur` (69), `uji-tekateki-rute` (12), `uji-repertoar` (OK).

Pemeriksaan data (di luar suite): seluruh 5.486 soal divalidasi dengan `python-chess`
(legalitas tiap langkah, giliran `first`, promosi selalu berhuruf, 0 rokade, 6 *en passant*,
92 promosi, **0 cacat**), dan 53 set × 12 bidak = **636 jalur aset** dicek
keberadaannya di disk (`jalurAset()` vs berkas nyata) — semuanya ada.

Harness repro dibuat di luar repo (`audit-bidak-papan/`, jsdom + esbuild memakai
`scripts/loader-jsx.mjs`) — lihat `audit-bidak-papan/README.md`. Uji regresi permanen
diletakkan di **dua suite yang sudah ada** (`scripts/uji-animasi-bidak.mjs`,
`scripts/uji-bantuan-langkah.mjs`), bukan berkas uji baru.

---

## 3. BUG-1 (P1) — cache janji gagal di `muatSet` mengunci set bidak seumur sesi

> **Status: sudah diperbaiki** (§7.1). Analisis di bawah adalah kondisi SEBELUM perbaikan.


**Lokasi:** `src/components/chess/pemuatBidak.js` — `muatSet()` baris `:99` (baca cache),
`:121` (`Promise.all`), `:127-128` (pelepasan cache), `:134` (`cacheSet.set`).

**Mekanisme.** Pelepasan cache hanya dipasang di jalur **sukses**:

```js
const janji = Promise.all(tugas).then((entri) => {
  ...
  if (Object.keys(hasil).length === 0) {     // :127 — hanya bila SEMUA 12 aset kosong
    cacheSet.delete(id); syncCache.delete(id);
    throw new Error(...);
  }
  ...
});
cacheSet.set(id, janji);                      // :134 — Promise yang GAGAL tetap tersimpan
```

Kalau **satu** loader aset menolak (chunk 404/terputus), `Promise.all` menolak **sebelum**
`.then` berjalan, sehingga cabang `:127` tidak pernah dieksekusi dan `cacheSet` menyimpan
promise yang sudah ditolak. `ChessPiece` lalu selamanya menerima promise yang sama:

```js
// src/components/chess/ChessPiece.jsx:44-61 (ringkas)
.catch(() => { ... // "Satu kali percobaan ulang; cache sudah dilepas oleh muatSet."
```

Komentar itu **tidak berlaku**: cache tidak dilepas, jadi percobaan ulang dan
`setTimeout(… 800 ms)` di dalamnya selalu gagal lagi. `PEMUAT_MERIDA` (eager) tidak bisa
gagal karena nilainya sudah berupa URL/data-URL (bukan fungsi), jadi **hanya set lazy yang
terkena** — yaitu 52 set lain, termasuk set bawaan Papan Interaktif `alpha`.

**Skenario nyata yang memicunya** (bukan sekadar teori):
1. Tab SPA dibiarkan terbuka saat Vercel men-deploy versi baru → nama chunk ber-hash lama
   hilang → unduhan aset 404 (dan `panaskanSet` di `ChessPiece.jsx` juga bisa memicu ini);
2. koneksi berkedip saat `panaskanSet` / pemuatan pertama bidak;
3. blokir sementara (proxy sekolah/kantor) pada salah satu berkas.

Akibatnya permanen sampai **reload penuh** (cache ada di level modul): papan kosong tanpa
pesan galat untuk set tersebut, mis. `/papan-interaktif` (bawaan `alpha`) hanya menampilkan
petak kosong.

**Repro (dijalankan hari ini, exit 1):**

```bash
node /tmp/uji-muat-cache-galat.mjs
  ✓ muatSet menolak saat chunk aset gagal
  ✗ cache dilepas setelah gagal: pemanggilan kedua mencoba unduh ulang — pemuat dipanggil 12 kali (sebelumnya 12)
  ✗ pemanggilan kedua berhasil setelah koneksi pulih — masih menolak: chunk gagal (simulasi)
BUG TERBUKTI: 1 lulus, 2 gagal
```

Harness membundel `pemuatBidak.js` apa adanya (glob Vite di-shim) dan mengganti pemanggil
chunk dengan fungsi yang bisa disuruh gagal, lalu memanggil `muatSet("bidak")` dua kali.

**Usulan perbaikan minimal** (butuh persetujuan sebelum diedit): lepaskan cache pada SETIAP
penolakan, bukan hanya saat hasilnya kosong —

```js
const janji = Promise.all(tugas).then((entri) => { ...isi seperti sekarang... });
cacheSet.set(id, janji);
janji.catch(() => { cacheSet.delete(id); syncCache.delete(id); });   // ← tambahan
return janji;
```

Tambahan yang sekalian menutup celah halus: hasil **sebagian** (`hasil` tidak kosong tapi ada
bidak `null`) juga terkunci selamanya; sebaiknya aset yang gagal tidak di-cache agar
panggilan berikutnya mencoba lagi.

---

## 4. BUG-2 (P2) — navigasi review teka-teki meleset satu indeks (`jalurFen`)

> **Status: sudah diperbaiki** (§7.2). Analisis di bawah adalah kondisi SEBELUM perbaikan.


**Lokasi:** `src/halaman/TekaTeki/TekaTeki.jsx`
`:1085` (`majuLangkah`), `:1134` (`keAkhirLangkah`), pengguna `:1041` (`mundurLangkah`).

**Mekanisme.** Bila dua penunjuk mundur di **papan** (`◀`/`⏮`) membaca `jalurFen` dengan
indeks `baru`, maka invariannya wajib: `jalurFen[i]` = posisi **setelah** langkah ke-`i`
(perhatikan `:722` `setJalurFen([m.fen])` — indeks 0 = posisi awal). Dua cabang maju
mematahkan invarian itu dengan memotong satu elemen terlalu banyak:

```js
// :1085 majuLangkah      (fenBaru = posisi setelah langkah ke-`posisi`)
setJalurFen((l) => [...l.slice(0, posisi), fenBaru]);   // ← `jalurFen[posisi]` hilang
// :1134 keAkhirLangkah
setJalurFen((l) => [...l.slice(0, posisi), ...fens]);   // ← sama
```

Seharusnya `l.slice(0, posisi + 1)`: dengan `jalurFen` = `[F0]` dan `posisi = 0`, `▶` harus
menghasilkan `[F0, F1]`, bukan `[F1]`. Karena `F_posisi` hilang, seluruh indeks setelahnya
tergeser, sedangkan `mundurLangkah` (`:1041`) memakai `jalurFen[baru]` sebagai posisi baru —
maka `◀` mengembalikan papan ke posisi **yang sedang tampil**, bukan ke posisi sebelumnya,
sementara `sisa`/`posisiLangkah` tetap diperbarui seolah papan benar-benar mundur.

**Langkah pengguna (sama di peramban; dicoba di masalah #1 "Mate in Three"):**
1. buka `/teka-teki/problem/1`, tuntaskan soalnya;
2. tekan `⏮` (Ke awal) → papan kembali ke F0;
3. tekan `⏭` (Ke akhir) **atau** `▶` (Maju satu langkah);
4. tekan `◀` (Mundur satu langkah) → **papan tidak bergerak**, padahal seharusnya mundur satu ply.

**Hasil harness** (`/tmp/audit-nav-tekateki3.mjs`, siklus yang sama, tiap tekan ditunggu 700 ms):

```
✓ papan = F5 (posisi akhir)
✓ ◀ → F4      ✓ ◀ → F3      ✓ ⏮ → F0      ✓ ⏭ → F5
✗ ◀ → F4 (harus mundur satu ply)   papan tetap = F5
✓ ⏮ → F0 (pemulihan)     ✓ ▶ → F1
✗ ◀ → F0 (harus mundur satu ply)   papan tetap = F1
✗ ⏮ → F0                           papan tetap = F1
✗ ⏭ → F5                           papan tetap = F1
```

**Dampak lanjutan (lebih buruk dari sekadar "tombol tidak jalan").** Setelah `◀` yang gagal
itu, aplikasi mengira sedang di `posisi = 0` (F0) padahal papan menampilkan F1:
- `bisaMundur` (`TekaTeki.jsx:1643`) menjadi `false` → tombol `⏮` dan `◀` **nonaktif**;
- `▶`/`⏭` «jalan» tetapi tidak menghasilkan apa pun (replay dari FEN yang salah, mis. `c4-c8`
  dijalankan dari posisi F1 → `terapkan()` melempar, gerak maju dibatalkan);
- langkah yang diklik pemain di papan dinilai dari `fen` yang salah melawan `sisa[0]` yang
  salah → setiap langkah jadi «bukan solusi» (kilat merah), padahal soalnya sudah tuntas.

Artinya sesi review bisa buntu total (butuh reload, atau ganti soal lewat Acak/Lewati/nomor).
Ini muncul di **happy path**: tombol `⏭`/`▶` memang baru aktif setelah soal terpecahkan,
yakni tepat saat pemain ingin meninjau solusinya.

**Usulan perbaikan minimal:** ganti kedua irisan menjadi `l.slice(0, posisi + 1)`
(satu karakter per baris), lalu tambahkan uji regresi: *tuntaskan soal → `⏮` → `⏭` → `◀`
harus kembali ke `F(n-1)`*, dan *`⏮` → `▶` → `◀` harus kembali ke `F0`*. Jalur mundur/maju
di Papan Interaktif (`undo`/`redo`/`keAkhir`/`keLangkah`) sudah benar karena selalu
menghitung ulang posisi awal, jadi hanya halaman Teka-Teki yang perlu disentuh.

---

## 5. Catatan prioritas rendah

### BUG-3 (P3) — satu klik di mana pun termakan setelah seret dibatalkan

> **Status: sudah diperbaiki** (§7.3).


`PapanTekaTeki.jsx:569` (`batalkanSeretInternal`) dan `:1251` (`padaBatal`, dipanggil
`pointercancel`/`lostpointercapture`) menyalakan `abaikanKlikRef`, sedangkan yang mematikannya
adalah pendengar `click` **tingkat dokumen** (`:605-609`) yang menelan **klik berikutnya di
mana pun** — bukan hanya klik di papan. Saat `pointercancel` tidak diikuti `click` (gestur
gulir/OS, jendela kehilangan fokus, tab berpindah), bendera itu menyala menunggu korban:
klik pertama pada tombol apa pun (menu, pengaturan, soal berikutnya, "Baru") hilang tanpa
reaksi. Ini persis risiko yang sudah dicatat di `KAJIAN-KLIK-LANGKAH-ISEPIC.md` §5.2.

Bukti langsung (harness `PapanTekaTeki` asli, `/tmp/audit-telan-klik.mjs`):

```
A. pointercancel saat menyeret bidak → klik tombol 'Ke awal'
   klik ke-1: sampai ke pendengar dokumen = false   ← DITELAN
   klik ke-2: sampai = true
B. seret bidak (dengan gerak) → click bawaan → klik tombol
   click sisa sesudah jatuh: sampai = false          ← benar: ditelan papan
   klik tombol berikutnya: sampai = true             ← benar
```

Usulan: batasi penelan ke klik yang targetnya masih di dalam papan (`akar.current.contains(e.target)`)
**atau** matikan bendera dengan pengaman waktu (`setTimeout(() => abaikanKlikRef.current = false, 300)`),
seperti saran §5.2 dokumen itu.

### CAT-1 (P3) — pratinjau Bantuan Langkah menganggap semua promosi = menteri

> **Status: sudah diperbaiki** (§7.5).


`src/lib/bantuanSeret.js:33`: `susunFenHipotetis(fen, from, to, promosi = "q")`, dan
`gunakanBantuanSeret.js` memanggilnya tanpa argumen promosi. Saat pemain menyeret pion ke
baris terakhir, petak tujuan tetap diberi warna hijau/kuning/merah beserta panah balasan
lawan — tetapi untuk **posisi hasil promosi menteri**, yang belum tentu langkah yang akan
dipilih pemain (`PILIHAN_PROMOSI` = q/r/b/n). Efeknya salah label «aman» pada promosi kuda/
gajah/benteng. Perbaikan kecil: kirim bidak promosi yang sedang dipilih, atau lewati
bantuan untuk petak promosi.

### CAT-2 (P3) — tanda klik-kanan: dokumen bertentangan dengan kode

> **Status: sudah diperbaiki** (§7.6).


Kepala berkas `PapanTekaTeki.jsx:26-28` menulis *«Petak: warna bawaan KUNING;
Shift/Ctrl/Alt → merah/hijau/biru»*, sedangkan implementasinya (`:53-59`, dipakai di `:1139`)
mengembalikan **merah** sebagai warna bawaan, kuning untuk Shift, hijau untuk Ctrl/cmd, biru
untuk Alt. Panah (seret klik kanan) tetap memakai `"bawaan"` (kuning/oranye) di `:1237`.
Bukan kerusakan fungsi (tanda tetap muncul dan tetap bisa dihapus dengan warna yang sama),
tetapi dua sumber di berkas yang sama menyatakan hal berbeda — pilih satu lalu selaraskan
komentar `tandaBantu.js` juga.

### CAT-3 (P3) — set bawaan Papan Interaktif adalah `alpha` (lazy), bidak telat tampil

> **Status: sudah diperbaiki** (§7.7).


`PENGATURAN_AWAL.bidak = "alpha"` (juga `ManusiaVsMesin.jsx:385`), sementara
`pemuatBidak.js` hanya meng-`eager` set `merida`; 12 SVG `alpha` (≈13,7 KB total, masing-masing
di bawah `assetsInlineLimit`) karena itu menjadi **12 chunk request** di render pertama —
bidak tampil setelah seluruhnya mendarat. Halaman teka-teki (bawaan `merida`) tidak terkena.
Bila BUG-1 terjadi pada momen itu, papan tetap kosong seumur sesi. Usulan: jadikan `alpha`
eager seperti `merida`, atau ubah bawaan Papan Interaktif ke `merida`.

---

## 6. Sudah diperiksa — tidak ada temuan (agar tidak diulang)

| Area | Hasil pemeriksaan |
| --- | --- |
| Dataset `public/data/teka-teki.json` | 5.486 soal: semua langkah legal, giliran `first` konsisten, promosi selalu berhuruf, jumlah langkah selalu ganjil (langkah terakhir milik pemain), 0 rokade, 6 *en passant* — **0 cacat** |
| Jalur aset bidak | 53 set × 12 bidak = 636 jalur `jalurAset()` semuanya ada di `src/asets/`; `idSet()` selalu jatuh ke set sah |
| Warna papan | 11 nilai `PILIHAN_WARNA_PAPAN` semuanya ada di `TEMA_PAPAN` (+`klasik`, `hijau`) — tidak ada yang diam-diam jatuh ke hijau. Rush memakai daftar 11 yang sama |
| "Klik pertama termakan setelah menyeret bidak" | **Tidak terbukti.** Probe dengan model peramban nyata (pointer capture me-retarget `click` ke elemen papan) lulus: kontrol klik-klik, seret, lalu klik-klik sesudah seret semuanya jalan pada percobaan pertama (`3 lulus, 0 gagal`). Kekhawatiran lama di `KAJIAN-…` §5.2 tetap nyata, tetapi hanya untuk seret yang **dibatalkan** (BUG-3) |
| Bidak tangkapan (`susunTangkapan`) | Urutan nilai `p1 n3 b3 r5 q9 k0` dan warna sisi benar; bidak Putih yang tertangkap dirender huruf kecil |
| Klik dobel / langkah ganda | Penjaga `tundaKlikRef`, `klonJalanRef`, dan `lewatiGeserRef` mencegah dua penerbangan untuk satu klik; uji animasi (101) lulus |
| Langkah ditolak di tengah penerbangan | Cacat **BARU** (BUG-4, laporan pemilik situs) — lihat §7.4; sekarang dijaga uji bagian G `uji-animasi-bidak` |
| Petunjuk (`petunjuk`) | Satu panah petunjuk tetap tampil setelah percobaan salah (disengaja: petunjuk hidup sampai soalnya selesai) dan dibersihkan saat soal berganti/selesai |
| Promosi | Dialog muncul hanya untuk langkah **legal** menuju baris terakhir; huruf promosi di tengah varian wajib sama dengan solusi (`apakahLangkahSesuai`); batal lewat Escape, klik latar, atau tombol. Teka-Teki & Rush konsisten |
| Navigasi Papan Interaktif | `undo`, `redo`, `keAwal`, `keAkhir`, `keLangkah`, `reset` semuanya menghitung ulang posisi dari `fenAwal`/`riwayatLengkap` — tidak ada masalah indeks seperti BUG-2 |
| `suara.js` | Kebal jebakan BUG-1: `unduh()` (`:131-140`) menghapus entri yang gagal dan `muat()` (`:147-168`) menghapus `bufferCache` **dan** `byteCache` di `.catch` — unduhan berikutnya dicoba lagi |
| Rush | Pembagian nyawa, tenggat absolut (`berakhirPadaRef`), anti-edit skor tersegel, dan urutan `fase` konsisten; tidak ada temuan |

---

## 7. Perbaikan yang dikerjakan (hari yang sama)

Ringkas: **7 berkas** diubah (5 berkas sumber + 2 suite uji), **tidak ada berkas uji baru** di
repo, **18 uji regresi** ditambahkan (11 di `uji-animasi-bidak`, 7 di `uji-bantuan-langkah`). Semua keputusan di bawah minimal — tidak ada perbaikan
"sekalian" di luar temuan.

### 7.1 BUG-1 — cache dilepas untuk SETIAP penolakan

`src/components/chess/pemuatBidak.js`:

```js
const janji = Promise.all(tugas).then((entri) => { ... });
// SETIAP penolakan melepas cache — bukan hanya "semua aset kosong":
janji.catch(() => { cacheSet.delete(id); syncCache.delete(id); });
cacheSet.set(id, janji);
```

Sekaligus: hasil **sebagian** (`Object.keys(hasil).length < entri.length`) tidak lagi dikunci —
aset yang berhasil tetap dipakai sekarang, pemanggilan berikutnya boleh mencoba lagi. Dengan
begitu percobaan ulang `ChessPiece` (800 ms) benar-benar bekerja seperti komentarnya.

Bukti: `node audit-bidak-papan/uji-muat-cache-galat.mjs` → **LULUS: 3 lulus, 0 gagal**
(sebelum: "BUG TERBUKTI: 1 lulus, 2 gagal", pemuat dipanggil 12 kali padahal seharusnya 24).

### 7.2 BUG-2 — `slice(0, posisi + 1)` di dua cabang maju

`src/halaman/TekaTeki/TekaTeki.jsx` (`majuLangkah`, `keAkhirLangkah`):

```js
setJalurFen((l) => [...l.slice(0, posisi + 1), fenBaru]);        // majuLangkah
setJalurFen((l) => [...l.slice(0, posisi + 1), ...fens]);        // keAkhirLangkah
```

Komentar invarian (`jalurFen[i]` = posisi setelah langkah ke-`i`) ditulis di kedua tempat supaya
tidak terulang.

Bukti: `node audit-bidak-papan/audit-nav-tekateki3.mjs` → **14/14 baris ✓** (sebelum: empat ✗ —
dua `◀` yang tidak mundur, lalu `⏮`/`⏭` yang ikut beku karena `bisaMundur` sudah `false`).

### 7.3 BUG-3 — penelan klik dibatasi ke papan, dan dilepas saat kontak baru

`src/halaman/TekaTeki/PapanTekaTeki.jsx`:

- pendengar `pointerdown` tingkat dokumen sekarang **membersihkan** `abaikanKlikRef` untuk tombol
  selain kanan ("kontak baru = niat baru"; klik hantu sesudah seret tidak pernah didahului
  `pointerdown` baru — sifat itulah yang dipakai, bukan timer);
- penelan `click` hanya berlaku bila `akar.current.contains(e.target)` — klik pada tombol
  navigasi/menu di luar papan tidak akan pernah termakan lagi;
- klik hantu sesudah seret **tetap** ditelan (targetnya di-retarget peramban ke elemen papan),
  jadi perilaku yang diinginkan tidak hilang.

Bukti: `node audit-bidak-papan/audit-telan-klik.mjs` → skenario A "klik ke-1 … = **true**"
(sebelum: `false`), skenario B tetap "click sisa = `false`, klik tombol berikutnya = `true`".
Di suite repo, uji lama untuk perilaku yang sama tetap lulus: "satu langkah = tepat satu
penerbangan" dan "klik dobel di petak tujuan" (bagian D/F `uji-animasi-bidak`) serta
`npm run uji:seret-bidak` (27 lulus).

### 7.4 BUG-4 (P1) — **bidak hilang setelah langkah salah** (laporan pemilik situs)

> "Setelah salah langkah/blunder, bidak kembali ke petak asal — tapi bidaknya tidak kelihatan."

**Mekanisme (jalur klik, petak tujuan kosong).**

1. Klik bidak → terpilih; klik petak tujuan **kosong** → `padaKlikPetak` memulai penerbangan klon
   ke petak itu (`mulaiTerbang(..., { intent: true })`) **lalu** memanggil induk 3 frame kemudian.
2. Karena petak tujuan kosong, sumber klon = bidak di petak **asal** → elemen itu disembunyikan
   (`asli.style.visibility = "hidden"`).
3. Induk menolak langkah (salah) → `setKesalahan({from,to})` dan **FEN tidak berubah**.
4. ±300 ms: transisi klon selesai (`fase = "landas"`) → `rapikanKlonLandas` menunggu bidak di
   petak tujuan — yang tidak akan pernah datang. Pemain melihat bidak "hantu" berhenti di petak
   yang salah.
5. ±1,2 detik: jaring pengaman memanggil `selesaikanKlon`; pemulihan petak asal waktu itu hanya
   berlaku bila `entri.fase !== "landas"`, jadi dilewati → klon dibuang, **bidak asal tetap
   `visibility: hidden`** → bidak hilang dari papan sampai soal dimuat ulang.

Jalur seret tidak terkena (tidak ada penerbangan klon di jalur itu), jadi gejalanya hanya muncul
pada pemain yang memindahkan bidak dengan klik-klik — persis seperti laporan.

**Perbaikan.**

1. `selesaikanKlon` sekarang memulihkan elemen **yang benar-benar disembunyikan penerbangan itu**
   (`entri.tersembunyi`, dicatat di `mulaiTerbang`) setiap kali pendaratan tidak terbukti
   (`!mendarat` — petak tujuan tidak berisi bidak yang dibawa). Ini juga menutup kasus "posisi
   berubah lagi sebelum klon mendarat" dan langkah tangkap yang ditolak.
2. Prop `kesalahan` dipakai sebagai sinyal penolakan: efek baru menutup penerbangan klik yang
   cocok (`dari` & `petak`) **seketika** — bidak kembali terlihat sebarengan kilatan merah, tanpa
   menunggu 1,2 detik (Teka-Teki, Papan Interaktif, dan Rush semuanya mengirim prop ini).
3. Jalur klik memilih sumber klon dari petak **asal** (`intent ? asliAsal || asliTujuan : …`):
   pada langkah tangkap, yang meluncur kini bidak yang benar-benar berjalan — dulu gambar bidak
   lawan yang terbang sementara bidak kita diam lalu melompat. Klon juga dipaksa
   `visibility: ""` supaya tidak pernah mewarisi `hidden` dari elemen sumber.

**Bukti.** Harness baru `audit-bidak-papan/audit-bidak-hilang.mjs` (model peramban nyata:
klik bidak → klik petak salah → `transitionend`):

```
SEBELUM:  ✗ klon penerbangan sudah dibuang — sisa 1 klon
          ✗ BIDAK TERLIHAT LAGI DI PETAK ASAL — elemen ada tapi visibility="hidden"
SESUDAH:  ✓ 5 lulus, 0 gagal (SEMUA LULUS)
```

Uji regresi permanen ada di `scripts/uji-animasi-bidak.mjs` **bagian G** (8 uji: dua varian —
induk mengabarkan `kesalahan`, dan induk diam sehingga jaring pengaman 1,2 detik yang bekerja) dan
**bagian H** (3 uji: langkah tangkap lewat klik).

### 7.5 CAT-1 — Bantuan Langkah sadar promosi

`src/lib/bantuanSeret.js` menambah fungsi murni `promosiLangkah(fen, dari, tujuan)` (pion ke baris
terakhir), dan `gunakanBantuanSeret.panggil({ dari, tujuan, promosi })`:

- selama bidak promosi belum diketahui (baru ditanya sesudah seret dilepas) → **dilewati**:
  tanpa warna petak, tanpa panah, engine tidak dipanggil (menilai posisi promosi menteri lalu
  menamai promosi kuda/gajah/benteng "aman" hanya menyesatkan);
- bila pemanggil sudah tahu bidaknya → `susunFenHipotetis(fen, dari, tujuan, promosi)`.

Bukti: `npm run uji:bantuan-langkah` → **66 lulus** (sebelum 59): 4 uji murni `promosiLangkah` +
3 uji hook ("promosi tanpa pilihan bidak: engine TIDAK dipanggil", "…bantuan dilewati",
"promosi dengan bidak yang dikirim: bantuan tetap dihitung").

### 7.6 CAT-2 — bawaan tanda klik-kanan diselaraskan jadi KUNING

Dua sumber (kepala `PapanTekaTeki.jsx:26-28` dan teks bantuan yang dibaca pemain di
`terjemahan/{id,en}/tekaTeki.js`) menyebut **kuning** sebagai warna bawaan; hanya implementasinya
yang menyimpang. Implementasi yang diselaraskan:

```js
function warnaDariPeristiwa(e) {
  if (e.shiftKey) return "merah";
  if (e.ctrlKey || e.metaKey) return "hijau";
  if (e.altKey) return "biru";
  return "bawaan";            // kuning — sama dengan warna panah bawaan
}
```

Karena panah bawaan memang kuning/oranye, tanda petak dan panah sekarang senada.

### 7.7 CAT-3 — `merida` **dan** `alpha` di-`eager`

`pemuatBidak.js`: `PEMUAT_MERIDA` → `PEMUAT_BAWAAN` berisi `merida` + `alpha` (`eager: true`), dan
glob lazy mengecualikan keduanya. Papan Interaktif (bawaan `alpha`) karena itu tidak lagi memuat 12
chunk terpisah di render pertama — papan tidak lagi sempat tampil kosong. Set lain tetap lazy.
`npm run uji:glob-aset` tetap **LULUS 9/9** (jumlah kunci hasil transform sama dengan 648 berkas
di disk).

### 7.8 Verifikasi

| Bukti | Sebelum | Sesudah |
| --- | --- | --- |
| `audit-bidak-papan/uji-muat-cache-galat.mjs` (BUG-1) | BUG TERBUKTI: 1 lulus, 2 gagal | LULUS: 3 lulus, 0 gagal |
| `audit-bidak-papan/audit-nav-tekateki3.mjs` (BUG-2) | 4 ✗ (papan beku) | 14/14 ✓ |
| `audit-bidak-papan/audit-telan-klik.mjs` (BUG-3) | "klik ke-1 … = false" | "klik ke-1 … = true" (sisa klik sesudah seret tetap ditelan) |
| `audit-bidak-papan/audit-bidak-hilang.mjs` (BUG-4) | 2 gagal (bidak `visibility="hidden"`) | 5 lulus, 0 gagal |
| `audit-bidak-papan/audit-klik-papan2.mjs` (kontrol) | 3 lulus, 0 gagal | 3 lulus, 0 gagal |

Semua suite repo dijalankan ulang setelah perbaikan: **13/13 LULUS** (angka pada §2), termasuk
`uji-animasi-bidak` 90 → **101** dan `uji-bantuan-langkah` 59 → **66**. `npx eslint` pada seluruh
berkas yang diubah bersih; dua galat lint yang tersisa berada di
`docs/riset-isepic/uji-isepic-klik.mjs` (berkas lama, tidak disentuh).

**Uji regresi baru tidak lulus hampa** — dibuktikan dengan mengembalikan perbaikan secara
sementara: mengembalikan `selesaikanKlon` + mematikan efek `kesalahan` membuat **tepat 4 uji
bagian G gagal** (94 lulus, 4 gagal); mengembalikan pemilihan sumber klon membuat **1 uji bagian H
gagal** ("data-bidak=p" — bidak lawan yang meluncur).

---

## 8. Saran urutan penanganan (semua **sudah dikerjakan** — §7)

1. **BUG-1** (P1): satu `janji.catch(...)` di `muatSet` — memperbaiki 52 set bidak di semua
   halaman papan, sekaligus membuat percobaan ulang `ChessPiece` benar-benar bekerja.
2. **BUG-2** (P2): `l.slice(0, posisi + 1)` di dua tempat, plus uji regresi navigasi review.
3. **BUG-3** (P3): batasi penelan klik ke papan, atau beri pengaman waktu 300 ms.
4. CAT-1 s/d CAT-3: perbaikan kecil terpisah (tidak mendesak), masing-masing satu baris
   sampai beberapa baris.

Urutan di atas diikuti apa adanya; BUG-4 (laporan pemilik situs) dikerjakan bersama BUG-1 di
awal karena sama-sama membuat papan "kosong/bidak hilang" tanpa pesan galat. Seluruh perbaikan
sudah masuk di cabang ini; yang **belum** dilakukan hanyalah `push`/PR — menunggu perintah.
