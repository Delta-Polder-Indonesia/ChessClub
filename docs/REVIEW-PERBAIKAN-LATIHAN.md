# Review & Perbaikan Empat Fitur Latihan

**Tanggal:** 2026-09-13 · **Status:** dokumen saja — **tidak ada kode sumber yang diubah**
**Cabang/commit acuan:** `arena/01a097fc-chessclub` @ `6a97a59`

Cakupan review: empat fitur latihan di ChessClub.

| Fitur | Rute | Berkas utama |
| --- | --- | --- |
| Teka-teki Catur | `/teka-teki` | [`src/halaman/TekaTeki/TekaTeki.jsx`](../src/halaman/TekaTeki/TekaTeki.jsx) (2 363 baris) |
| Rush Teka-teki | `/teka-teki-rush` | [`src/halaman/TekaTekiRush/TekaTekiRush.jsx`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx) (1 461 baris) |
| Kuis Catur | `/quiz-catur` | [`src/halaman/QuizCatur/QuizCatur.jsx`](../src/halaman/QuizCatur/QuizCatur.jsx) (664 baris) + [`daftar.js`](../src/halaman/QuizCatur/daftar.js) |
| Pembukaan | `/program-kami/pembukaan` | [`src/halaman/ProgramKami/Pembukaan.jsx`](../src/halaman/ProgramKami/Pembukaan.jsx) (336 baris) |

Setiap nomor baris di dokumen ini **dibaca ulang dari berkas pada commit acuan** (bukan disalin dari
laporan awal) — koreksi terhadap laporan awal dikumpulkan di
[bagian Koreksi](#koreksi-terhadap-daftar-temuan-awal). Perintah untuk menandai-ulang nomor baris ada di
[Lampiran](#lampiran-perintah-verifikasi).

**Skala prioritas.** *Tinggi* = berdampak ke pengguna atau ke benar/salahnya hasil; *Sedang* = biaya
perawatan / risiko regresi saat menyunting; *Rendah* = kerapian dan kejelasan.

## Ringkasan

| Fitur | Tinggi | Sedang | Rendah | Total |
| --- | :-: | :-: | :-: | :-: |
| A. Teka-teki Catur | 1 | 3 | 2 | 6 |
| B. Rush Teka-teki | 0 | 1 | 2 | 3 |
| C. Kuis Catur | 1 | 2 | 3 | 6 |
| D. Pembukaan | 0 | 2 | 1 | 3 |
| **Jumlah** | **2** | **8** | **8** | **18** |

Dua temuan *Tinggi*: ikon kategori hilang di Kuis (C1) dan state pengaturan mati yang membuat pintasan papan
tidak terkunci di Teka-teki (A6 — temuan hasil verifikasi ini, tidak ada di daftar awal).

---

## A. Teka-teki Catur — `src/halaman/TekaTeki/TekaTeki.jsx`

| # | Temuan | Lokasi | Prioritas | Usulan perbaikan konkret |
| --- | --- | --- | :-: | --- |
| A1 | Langkah penutup menerima **skakmat legal apa pun**, bukan langkah solusi | [`:698-712`](../src/halaman/TekaTeki/TekaTeki.jsx#L698-L712) | Sedang | Putuskan produk dulu: (a) samakan dengan Rush → hapus cabang `if (sisa.length === 1)`; (b) pertahankan → tulis alasannya sebagai komentar `//` + uji. Rush sendiri menuntut solusi persis ([`:620-628`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L620-L628)) |
| A2 | `parseLangkah` + `terapkan` diduplikasi persis dengan Rush | [`:121-127` & `:138-147`](../src/halaman/TekaTeki/TekaTeki.jsx#L121-L147) vs Rush [`:54-72`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L54-L72) | Sedang | Ekstrak ke modul baru `src/lib/tekaTeki.js`; jangan gabung `cobaLangkah`-nya (perilakunya beda — lihat A1) |
| A3 | 7 `catch {}` senyap pada akses `localStorage` | `:185`, `:195`, `:440`, `:554`, `:560`, `:566`, [`:1076`](../src/halaman/TekaTeki/TekaTeki.jsx#L1069-L1079) | Rendah | Satu helper `cobaTulisStorage(kunci, nilai, t)` di `src/lib/utils.js` yang memanggil `console.debug` sekali saat gagal (mode privat/kuota penuh) |
| A4 | `keAwalLangkah` menyalin ulang 14 setter milik `terapkanSoal` | [`:871-893`](../src/halaman/TekaTeki/TekaTeki.jsx#L871-L893) vs [`:569-588`](../src/halaman/TekaTeki/TekaTeki.jsx#L569-L588) | Rendah | `terapkanSoal(m, { pertahankanSelesai = false })` — salinan ini memang sengaja (komentar `:867-870`, `:889`), jadi perbaiki lewat opsi, bukan dengan menghapusnya |
| A5 | Efek re-filter & 4 efek lain menelan aturan React (`exhaustive-deps`) | [`:487-497`](../src/halaman/TekaTeki/TekaTeki.jsx#L487-L497); juga `:484`, `:794`, `:1114`, `:1129` | Sedang | Tiap `// eslint-disable-next-line` diberi komentar alasan + daftar dependensi tersembunyi (mis. efek `:487` diam-diam bergantung pada `terapkanSoal`, `setParams`, `simpanPosisi`) |
| A6 | State `bukaPengaturan` versi halaman **tidak pernah nilainya `true`**, padahal panel gear hidup di `LayoutTekaTeki` | [`:263`](../src/halaman/TekaTeki/TekaTeki.jsx#L263), `:797-804`, `:1028` vs [`:1546-1554`](../src/halaman/TekaTeki/TekaTeki.jsx#L1545-L1554) | **Tinggi** | Angkat state ke komponen halaman, kirim ke layout sebagai prop `bukaPengaturan`/`onTutupPengaturan`; hapus duplikatnya. Efek Escape `:797-804` mati (selalu `return` lebih awal), dan `blokir: !!promosi \|\| !!bukaPengaturan` (`:1028`) **tidak pernah** menahan panah keyboard saat panel pengaturan terbuka |

**Catatan A6 (temuan baru, tidak ada di laporan awal).** Grep `setBukaPengaturan` di seluruh berkas hanya
menemukan tiga pemakaian: `:800` (menutup, di efek yang tidak pernah aktif) dan `:1906`/`:1944` (dua-duanya
di dalam `LayoutTekaTeki`, yang mulai baris 1537). Jadi salinan state di halaman (baris 263) adalah kode mati,
dan konsekuensinya nyata bagi pengguna: selama panel pengaturan terbuka, tombol panah tetap menggerakkan
bidak/level karena gerbang `blokir` membaca state yang salah.

**Yang sudah benar dan jangan ikut "dirapikan".** Percabangan warna `warnaiPromosi`/`PILIHAN_PROMOSI`
(`:129-136`), pemisahan suara "ilegal" vs "keliru" ([`:714-719`](../src/halaman/TekaTeki/TekaTeki.jsx#L714-L719)),
dan `kunciNavigasiRef` (`:1020-1029`) yang sengaja dipakai supaya pendengar `keydown` tidak dipasang-ulang
tiap render.

---

## B. Rush Teka-teki — `src/halaman/TekaTekiRush/TekaTekiRush.jsx`

| # | Temuan | Lokasi | Prioritas | Usulan perbaikan konkret |
| --- | --- | --- | :-: | --- |
| B1 | Logika inti (`cobaLangkah`, validasi legalitas, promosi) berjalan paralel dengan Teka-teki | [`:587-688`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L587-L688) vs TekaTeki `:660-780` | Sedang | Pindahkan bagian yang identik ke `src/lib/tekaTeki.js` (lihat A2): `parseLangkah`, `terapkan`, dan `apakahLangkahSesuai(fen, from, to, promo, diharapkan)` |
| B2 | Kegagalan `localStorage` berkomentar tapi tanpa jejak | [`:326-339`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L325-L339) (juga `:607-609`) | Rendah | Sama seperti A3; di Rush gaya penulisannya `catch { /* abaikan */ }`, jadi cukup tambahkan `console.debug` di helper yang sama |
| B3 | Dependensi `promo` tidak dipakai di badan `cobaLangkah` | deps [`:675-687`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L675-L688) (`promo` di `:681`) | Rendah | Hapus `promo` dari array dependensi. Badan fungsi hanya memakai `promoBidak` (param) dan `setPromo`, tidak membaca state `promo` — verifikasinya: `grep -n promo` pada rentang 589-674 |

**Kekuatan yang wajib dipertahankan** (jangan "disederhanakan" saat mengerjakan B1):

| Bagian | Lokasi | Kenapa penting |
| --- | --- | --- |
| Tenggat absolut `berakhirPadaRef` (sisa waktu dihitung ulang dari `Date.now()`, tidak didekremen) | [`:315-319`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L315-L319), dibaca `:481`, `:503` | Tab di latar belakang/mesin sibuk tidak membuat penghitung melambat. Sudah dikunci [`scripts/uji-rush-waktu.mjs`](../scripts/uji-rush-waktu.mjs) |
| `akhiri()` idempoten lewat `endedRef` | [`:398-414`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L397-L414) (jaga tambahan di `:446`, `:534`, `:576`, `:668`) | Skor/layar hasil tidak ditulis dua kali saat timer dan langkah terakhir berbarengan |
| Pembersihan `timerRef`/`delayRef` saat unmount | [`:389-395`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L388-L395) | Menutup rute tidak menyisakan `setTimeout` yang memanggil `setState` |
| Skor tersegel `simpanBungkus`/`bacaBungkus` (`{ n, c }`) | [`:82-110`](../src/halaman/TekaTekiRush/TekaTekiRush.jsx#L82-L110) | Mencegah pemain mengetik skor besar di `localStorage` |

---

## C. Kuis Catur — `src/halaman/QuizCatur/QuizCatur.jsx`

| # | Temuan | Lokasi | Prioritas | Usulan perbaikan konkret |
| --- | --- | --- | :-: | --- |
| C1 | `IKON_KATEGORI` tidak punya entri `taktik`, `strategi`, `endgame`, `notasi`; navigasi kiri memakai `IKON_KATEGORI[k]` tanpa fallback | peta ikon [`:69-77`](../src/halaman/QuizCatur/QuizCatur.jsx#L68-L77), navigasi [`:337-342`](../src/halaman/QuizCatur/QuizCatur.jsx#L330-L348), contoh fallback [`:542`](../src/halaman/QuizCatur/QuizCatur.jsx#L540-L545) | **Tinggi** | (1) Tambahkan 4 entri ikon; (2) pasang fallback `|| IKON_KATEGORI.semua` di `:339`; (3) pindahkan peta ikon ke sebelah `DAFTAR_KATEGORI` di [`daftar.js`](../src/halaman/QuizCatur/daftar.js#L25-L34) supaya menambah kategori memaksa menambah ikon; (4) tambahkan langkah ke-3 di README ("setelah menambah id, tambahkan ikon + periksa ikon di `IKON_KATEGORI`") |
| C2 | Penulisan `localStorage` redundan di `catatHasil`, padahal efek persistensi sudah ada | [`:204-208`](../src/halaman/QuizCatur/QuizCatur.jsx#L194-L211) vs efek [`:122-128`](../src/halaman/QuizCatur/QuizCatur.jsx#L122-L128) | Rendah | Hapus `setItem` di `:204-208`. Bonus: sisi efek itu sekarang menulis **di dalam** pembaruan state (`setPeringkat((sebelumnya) => …)`), yang di `StrictMode` dipanggil dua kali — menghapusnya sekaligus menghilangkan efek samping di dalam *updater* |
| C3 | Logika dedup/merge peringkat ada di dua tempat dengan aturan sedikit beda | inisialisasi [`:99-116`](../src/halaman/QuizCatur/QuizCatur.jsx#L99-L116) (`Object.assign` max-per-nama) vs `catatHasil` [`:198-203`](../src/halaman/QuizCatur/QuizCatur.jsx#L198-L203) (ganti kalau lebih baik) | Sedang | Ekstrak `gabungPeringkat(daftar, masuk)` + `rapikanPeringkat(daftar)` (urut desc) di satu modul kecil, mis. `src/lib/peringkatKuis.js`; pakai untuk keduanya |
| C4 | `mulai` memakai `eslint-disable exhaustive-deps` | [`:165-177`](../src/halaman/QuizCatur/QuizCatur.jsx#L165-L177) (`:176`) | Rendah | Dependensinya (`daftar`, `total`, `mainkan`) tampaknya sudah lengkap — coba hapus baris `disable` dan lihat apakah aturan complain. Catatan: repo **tidak punya konfigurasi ESLint**, jadi `disable` ini kini tidak ditegakkan alat apa pun (lihat Tema lintas-fitur c) |
| C5 | Papan peringkat hanya lokal (`localStorage`), berbeda dari Rush yang punya API | `:9` (`KUNCI_PERINGKAT`), muat `:99-116`, render [`:271-278`](../src/halaman/QuizCatur/QuizCatur.jsx#L271-L278) — Rush: `src/lib/api/rekorRush.js` → `/api/rekor-rush` | Sedang | Konfirmasi maksud: kalau memang "kuis santai, tanpa akun", tulis di README; kalau ingin daring, pola Rush bisa dipakai ulang (`ambilPeringkatRush`/`kirimSkorRush`) + segel anti-curang seperti `simpanBungkus` |
| C6 | `npm run uji:quiz` ada, tapi tidak ikut rantai `npm run uji` sehingga tidak jalan di CI | [`package.json:20`](../package.json) vs skrip [`scripts/uji-quiz.mjs`](../scripts/uji-quiz.mjs) | Rendah | Tambahkan `&& node scripts/uji-quiz.mjs` ke rantai `uji`, dan perluas isinya dengan pemeriksaan "tiap `id` di `DAFTAR_KATEGORI` punya ikon" (pola yang sama dengan `uji:i18n`: *"876 kunci terpakai semuanya ada"*) |

**Dampak terukur C1.** `DAFTAR_KATEGORI` berisi 10 kategori ([`daftar.js:25-34`](../src/halaman/QuizCatur/daftar.js#L25-L34));
`IKON_KATEGORI` hanya 7. Yang hilang: `taktik` (10 soal), `strategi` (10), `endgame` (10), `notasi` (10) =
**40 dari 100 soal**. Label teksnya aman (kunci `quiz.kategori.*` lengkap di [`id/quiz.js:47-58`](../src/lib/terjemahan/id/quiz.js)
dan [`en/quiz.js:47-58`](../src/lib/terjemahan/en/quiz.js)), jadi yang rusak hanya ikonnya. Karena
`berkasPublik(undefined)` mengubah nilai tak ada menjadi `String(undefined || "")` = `""`
([`src/lib/asets.js:27-30`](../src/lib/asets.js#L27-L30)), `<img src>` jatuh ke akar situs → ikon kosong di
empat baris navigasi. Kandidat ikon dari aset yang sudah ada di `public/images/color-icon/`:
`taktik → puzzle-piece.svg`, `strategi → magnifier-analysis.svg`, `endgame → board-4x4-brown.svg`,
`notasi → pages-a-z.svg` (alternatif: `puzzle-hint.svg`, `lessons.svg`, `board-vision-coordinate.svg`).

---

## D. Pembukaan — `src/halaman/ProgramKami/Pembukaan.jsx`

| # | Temuan | Lokasi | Prioritas | Usulan perbaikan konkret |
| --- | --- | --- | :-: | --- |
| D1 | Teks "Sejarah" dua paragraf di-hardcode, tanpa `t()` | [`:312-330`](../src/halaman/ProgramKami/Pembukaan.jsx#L308-L331) (`<h3>Sejarah</h3>` di `:312`) | Sedang | Pindahkan ke kamus (`program.pembukaan.sejarah.judul`/`.ayat1`/`.ayat2`) di `src/lib/terjemahan/{id,en}/program.js`. Berkas ini **sudah** memakai `t()` di 12 tempat (12 baris pemanggilan `t("…")`), jadi polanya tinggal diikuti |
| D2 | Kandidat langkah lanjutan + catatannya di-hardcode di JSX | [`:282-299`](../src/halaman/ProgramKami/Pembukaan.jsx#L275-L301) (data di `:283-286`) | Sedang | Naikkan ke data (konstanta di kepala berkas atau kamus): `{ move, note }` dengan `note` sebagai kunci terjemahan — sekarang campur aduk ("Morphy Defense (Utama)") |
| D3 | Matriks papan Ruy Lopez ditulis tangan | [`:9-24`](../src/halaman/ProgramKami/Pembukaan.jsx#L6-L24) + variasi manual `pieces[4][4]`/`pieces[5][5]` (`:28-29`) | Rendah | Ganti dengan `new Chess(FEN)` → `board()`. Simpan 3 FEN (posisi utama + 2 varian) alih-alih menghapus sel manual. **Matriks saat ini sudah benar** — cocok 100% dengan `chess.js` untuk FEN `r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3`, jadi perubahannya murni pemindahan data |

**Catatan arsitektur (benar, sudah diverifikasi).** Logika pembukaan yang sebenarnya ada di
[`src/halaman/PapanInteraktif/PapanInteraktif.jsx`](../src/halaman/PapanInteraktif/PapanInteraktif.jsx):
`pohonDariDaftar` (`:185`), `susunKatalog` (`:145`), `setPohon(pohonDariDaftar(data))` (`:394`), dan
`BukuPembukaan` (`:2008`, dipakai `:1628`). Halaman `Pembukaan.jsx` hanya presentasi + tautan, sehingga
perbaikan D1–D3 tidak menyentuh mesin pembukaan. Kalau nanti data kandidat langkah (D2) perlu disamakan dengan
buku pembukaan, letak modul bersamanya sudah ada: `src/lib/namaPembukaan.js` dan `data/` (buku pembukaan),
bukan membuat berkas baru lagi.

---

## Koreksi terhadap daftar temuan awal

Semua lokasi di atas sudah diverifikasi ulang; ini selisihnya dengan laporan awal.

| Klaim awal | Hasil verifikasi |
| --- | --- |
| A: `catch {}` localStorage di 2 tempat (`437-441`, `1074-1076`) | **Benar tapi kurang lengkap** — ada **7** `catch {}` yang membalut `localStorage` (`:185`, `:195`, `:440`, `:554`, `:560`, `:566`, `:1076`) dari total 14 `catch {}` di berkas itu; 7 sisanya membalut parsing catur (`:679`, `:687`, `:702`, `:711`, `:844`, `:907`, `:964`). Tiga helper baca (`:163-170`, `:172-178`, `:199-203`) memakai `catch { return … }` dan sudah mengembalikan nilai cadangan |
| A: duplikasi "parseLangkah/terapkan/cobaLangkah" di `121-147` | Rentang itu hanya memuat `parseLangkah` + `terapkan`. `cobaLangkah` ada di `:660` ke bawah dan **tidak identik** dengan punyanya Rush (cabang mate di `:698-712` tidak ada di Rush) → yang bisa diekstrak hanya dua helper pertama |
| A: "efek re-filter memakai eslint-disable" (1 tempat) | Ada **5** `eslint-disable-next-line react-hooks/exhaustive-deps` di berkas itu: `:484`, `:496`, `:794`, `:1114`, `:1129` |
| A: "dua state `bukaPengaturan` + handler Escape terpisah" | Benar, dan lebih buruk dari deskripsinya: state di `:263` **tidak pernah** di-set `true`, jadi efek `:797-804` mati dan gerbang `blokir` (`:1028`) tidak menutupi panel yang terbuka. Lihat A6 |
| B: `catch {}` localStorage Rush | Di Rush tidak ada `catch {}` satu baris; polanya `catch { /* abaikan */ }` (`:329-331`, `:336-338`) — komentar ada, jejak tetap tidak ada |
| B: `1547-1554` adalah "state kedua di halaman" | Nomor itu benar, tapi lokasinya di komponen `LayoutTekaTeki` (mulai `:1537`) pada **berkas yang sama**, bukan di berkas lain |
| C: "ikon rusak untuk 4 kategori" | Benar; dilokalkan: 40/100 soal, `src` jatuh ke akar situs, label teksnya tetap aman |
| D: "Sejarah" di `312-324` | Baru satu paragraf; blok hardcode lengkapnya `:312-330` (dua `<p>`) |
| D: matriks papan `9-22` | `:9-24` (docstring `:9`, matriks `:10-21`, `OPENING_HIGHLIGHT` `:24`), plus dua penyesuaian varian di `:28-29` yang ikut terhapus kalau matriksnya dibuang tanpa FEN pengganti |

---

## Tema lintas-fitur

**(a) `catch` senyap pada `localStorage`.** Dua halaman latihan itu punya **45 blok `catch`** (Teka-teki 29,
Rush 16); **17 di antaranya** membalut akses `localStorage` (Teka-teki 10 — `:167`, `:176`, `:185`, `:195`,
`:202`, `:440`, `:554`, `:560`, `:566`, `:1076`; Rush 7 — `:108`, `:117`, `:128`, `:137`, `:329`, `:336`, `:810`).
Gayanya tidak seragam: Teka-teki 14× `catch {}` satu baris, Rush 9× `catch { /* abaikan */ }`. Tenang soal ketahanannya (mode privat, kuota penuh, dan
`localStorage` yang diblokir memang harus non-fatal) — yang hilang cuma jejak. Rekomendasi: satu helper
`coba(fn, label)` di `src/lib/utils.js` yang menelan kesalahan **tetapi** memanggil `console.debug` sekali;
pakai di semua titik itu. Tidak ada perubahan perilaku yang terlihat pengguna.

**(b) Duplikasi logika langkah antar halaman latihan.** Teka-teki dan Rush punya `parseLangkah`/`terapkan` yang
identik dan kerangka `cobaLangkah` yang paralel (deteksi kebutuhan promosi, cek legalitas, pembandingan dengan
`diharapkan`). Langkah aman: buat `src/lib/tekaTeki.js` berisi yang benar-benar sama saja
(`parseLangkah`, `terapkan`, `butuhPromosi`, `apakahSesuai`), biarkan tiap halaman punya kebijakan hasil
(mate-apa-pun vs skor-+-nyawa). Nama `tekaTeki.js` mengikuti konvensi `src/lib` yang sudah ada
(`namaPembukaan.js`, `skakmat.js`, `waktu.js`) — modul itu **belum** ada, jadi tidak ada tabrakan.
Uji yang harus tetap hijau setelah ekstraksi: `node scripts/uji-rush-waktu.mjs`, `scripts/uji-komentator.mjs`,
`scripts/uji-suara.mjs`, `scripts/uji-tanda-papan.mjs`, `scripts/uji-lencana-skakmat.mjs`.

**(c) `eslint-disable-next-line react-hooks/exhaustive-deps` sebagai satu-satunya "dokumentasi".** Tujuh
pemakaian di tiga halaman: Teka-teki 5 (`:484`, `:496`, `:794`, `:1114`, `:1129`), Rush 1 (`:551`), Kuis 1
(`:176`); halaman Pembukaan nol. Catatan penting saat menindaklanjuti:
repo ini **tidak memasang ESLint** (tidak ada `.eslintrc*`/`eslint.config.*`, dan `eslint` tidak ada di
`package.json`), jadi baris `disable` itu tidak ditegakkan alat apa pun — maknanya murni untuk manusia. Dua
pilihan: (1) tiap `disable` diikuti komentar "dependensi yang sengaja dilepas: …", atau (2) pasang ESLint
+ `react-hooks` dan biarkan aturan itu yang menjelaskan dirinya sendiri (perubahan lebih besar, perlu
persetujuan terpisah karena menyentuh seluruh repo). Untuk dokumen ini, (1) yang direkomendasikan.

---

## Urutan pengerjaan yang disarankan

1. **C1 — ikon kategori Kuis** (±30 menit, dampak langsung ke pengguna). Empat entri ikon + fallback `:339` +
   peta ikon pindah ke `daftar.js` + README "Menambah kategori baru" ditambah langkah ikon.
   *Verifikasi:* `npm run uji:quiz`, muat halaman `/quiz-catur` dan lihat baris Taktik/Strategi/Endgame/Notasi.
2. **A6 — satu sumber kebenaran untuk `bukaPengaturan`** (±1 jam). Angkat state ke halaman, hapus efek mati
   `:797-804`, sambungkan `blokir` ke state yang sama. *Verifikasi:* buka panel gear lalu tekan panah —
   tidak boleh ada langkah; `npm run uji:analisa-ui && node scripts/uji-suara.mjs`.
3. **C2 + C3 — persistensi peringkat Kuis** (±45 menit). Buang `setItem` ganda, satu helper merge.
   *Verifikasi:* mainkan kuis dua kali dengan nama sama, `localStorage["blunderskuad.quiz.peringkat"]` hanya
   ditulis oleh efek `:122-128` (patch `console.count` sementara saat pengujian lokal), nilai tetap max-per-nama.
4. **A3 + B2 — jejak kegagalan storage** (±1 jam, nol perubahan perilaku). Helper `coba()` + ganti 17 titik
   akses `localStorage` (10 di Teka-teki, 7 di Rush).
   *Verifikasi:* `npm run uji` (rantai penuh) dan `npm run build`.
5. **B3 + C4 — dependensi `useCallback`** (±15 menit). *Verifikasi:* hasil render tidak berubah; jalankan
   `node scripts/uji-rush-waktu.mjs`.
6. **A2 + B1 — `src/lib/tekaTeki.js`** (±2–3 jam, perubahan terbesar di daftar ini). Lakukan setelah 3–5 supaya
   diff-nya kecil. *Verifikasi:* kelima uji di tema (b) plus `npm run uji:e2e`.
7. **A4 + A5 — opsi `pertahankanSelesai` & komentar dependensi tersembunyi** (±1 jam).
8. **A1 — keputusan produk soal mate-apa-pun.** Jangan dikerjakan sebelum ada keputusan; kalau disamakan dengan
   Rush, itu **perubahan perilaku** yang perlu uji baru di `scripts/uji-*` dan catatan di CHANGELOG/rilis.
9. **C5 — peringkat Kuis lokal vs daring** (keputusan produk; kalau daring, kerjakan sebagai fitur terpisah
   dengan endpoint sendiri seperti `/api/rekor-rush`).
10. **D1–D3 — i18n & data halaman Pembukaan** (±1,5 jam, risiko rendah). *Verifikasi:* `npm run uji:i18n`
    (penjaga kelengkapan kunci) lalu `npm run build`.

## Lampiran: perintah verifikasi

```bash
# batas fungsi + lokasi simbol (nomor baris berubah saat berkas diedit — perbarui dokumen ini setelahnya)
grep -n "function parseLangkah\|function terapkan\|cobaLangkah\|bukaPengaturan\|eslint-disable\|catch {}" \
  src/halaman/TekaTeki/TekaTeki.jsx src/halaman/TekaTekiRush/TekaTekiRush.jsx

# peta kategori vs ikon, dan jumlah soal per kategori
grep -n "id:" src/halaman/QuizCatur/daftar.js | head -12
grep -n "IKON_KATEGORI" src/halaman/QuizCatur/QuizCatur.jsx
ls public/images/color-icon/

# cek matriks papan Pembukaan terhadap chess.js (harus "true")
node --input-type=module -e "
import { Chess } from 'chess.js';
const c = new Chess(); for (const s of ['e4','e5','Nf3','Nc6','Bb5']) c.move(s);
console.log(JSON.stringify(c.board().map(r=>r.map(x=>x?(x.color==='w'?x.type.toUpperCase():x.type):''))));"

# uji yang relevan
npm run uji:quiz && npm run uji:analisa-menyeluruh && node scripts/uji-rush-waktu.mjs
```
