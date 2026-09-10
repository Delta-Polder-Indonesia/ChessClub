/**
 * Variasi tambahan komentator.
 *
 * Dipisahkan dari kamus utama supaya penambahan kalimat tidak mengacak
 * struktur terjemahan yang sudah dipakai. Modul ini hanya menambah pilihan
 * kalimat ke kategori yang sudah ada; mesin komentator tetap memakai fakta
 * papan yang sama.
 *
 * Aturan: TAMBAHAN_ID dan TAMBAHAN_EN dipakai berpasangan.
 * scripts/uji-i18n.mjs menolak bila jumlah varian ID dan EN berbeda per
 * kategori, jadi menambah varian hanya untuk satu bahasa akan menjebol
 * paritas kunci. Placeholder memakai nama kunci kamus ({pihak}, {san},
 * {lawan}, {petak}, {bidak}, {korban}, {pembukaan}, {unggul}, {nilai},
 * {mat}, {saran}) — termasuk di EN, karena mesin komentator yang mengisi
 * placeholder, bukan bahasa teksnya.
 */
import { komentatorPapan as idPapan } from "./terjemahan/id/komentator.js";
import { komentatorPapan as enPapan } from "./terjemahan/en/komentator.js";

const TAMBAHAN_ID = {
  santai: {
    biasa: [
      "{pihak} jalan {san}. Belum kelihatan mau bikin apa, tapi arahnya ada.",
      "{san} dimainkan. Kita simpan dulu komentarnya, posisi masih berkembang.",
      "{pihak} pilih {san}. Pelan-pelan, semua bidak belum perlu ikut campur.",
      "Langkah {san}. Kelihatannya sederhana, tapi biasanya ada rencana di belakangnya.",
      "{pihak} lanjut dengan {san}. Belum panas, masih pemanasan.",
      "{san} membuat posisi tetap berjalan tanpa memaksa siapa pun.",
    ],
    buku: [
      "Masih teori {pembukaan}. {san} belum keluar dari jalur yang dikenal.",
      "{pihak} tetap ikut pola {pembukaan} lewat {san}. Belum ada kejutan.",
      "{san} masih bagian dari {pembukaan}. Sejauh ini semuanya masuk akal.",
      "Kita masih di wilayah {pembukaan}. {pihak} belum bikin keputusan aneh-aneh.",
    ],
    tangkap: [
      "{pihak} ambil {korban} di {petak}. Sekarang susunan material berubah.",
      "{san} berujung tangkapan. {korban} pindah tangan di {petak}.",
      "Ada pertukaran di {petak}. {pihak} memilih mengambil {korban}.",
      "{pihak} bereskan {korban} di {petak}. Sekarang kita lihat balasannya.",
    ],
    tangkapUntung: [
      "{pihak} dapat {korban} dengan harga murah di {petak}. Itu lumayan besar.",
      "Tangkapan enak buat {pihak}. {korban} hilang, bayarnya tidak seberapa.",
      "{san} ternyata menguntungkan. {pihak} keluar dengan tambahan material.",
      "Material jatuh ke pihak {pihak}. {korban} di {petak} tidak tertolong.",
    ],
    tangkapMenteri: [
      "Menteri {lawan} diambil di {petak}. Ini mulai serius.",
      "{pihak} berhasil mengamankan menteri {lawan}. Kerugiannya besar.",
      "Menteri kena di {petak}. {lawan} sekarang harus mikir ulang semuanya.",
    ],
    skak: [
      "Skak dari {pihak}. Raja {lawan} harus beresin masalah ini dulu.",
      "{san} ternyata sambil skak. Raja {lawan} tidak punya waktu santai.",
      "Raja {lawan} kena tekanan langsung. Skak.",
      "Ada skak di {petak}. {lawan} dipaksa merespons.",
    ],
    skakTambahan: [
      "Sekalian skak. {lawan} dapat dua urusan sekaligus.",
      "Belum selesai, masih ditambah skak. Raja {lawan} harus bergerak.",
      "Bonusnya skak juga. Langkah ini jadi lebih merepotkan.",
    ],
    skakSatuJalan: [
      "Pilihan {lawan} tinggal satu. Tidak banyak ruang untuk improvisasi.",
      "Balasannya cuma satu langkah legal. Posisi sedang dipaksa.",
      "{lawan} tidak punya banyak pilihan. Satu jalan saja yang terbuka.",
    ],
    rokadePendek: [
      "{pihak} rokade pendek. Raja aman, sekarang benteng bisa mulai ikut main.",
      "Raja {pihak} masuk kotak aman lewat rokade pendek.",
      "Rokade pendek selesai. Sekarang tinggal cari cara buka permainan.",
    ],
    rokadePanjang: [
      "{pihak} pilih rokade panjang. Raja menjauh, permainan bisa makin tajam.",
      "Raja {pihak} pindah ke sayap menteri. Ini bisa mengubah arah serangan.",
      "Rokade panjang. Pilihan yang biasanya punya alasan posisi yang cukup jelas.",
    ],
    enPassant: [
      "En passant muncul juga. Tidak sering kelihatan di papan.",
      "{pihak} pakai en passant. Aturannya sah, meski momennya jarang.",
      "Ada en passant. Langkah kecil, tapi aturan catur memang punya kejutan seperti ini.",
    ],
    promosi: [
      "Pion {pihak} sampai ujung dan promosi jadi {bidak} di {petak}.",
      "Akhirnya promosi. Pion tadi sekarang berubah jadi {bidak}.",
      "{pihak} naik kelas di {petak}. Promosi berhasil.",
    ],
    lawanMenggantung: [
      "{bidak} {lawan} di {petak} sedang kurang aman. Ada peluang untuk diambil.",
      "Perhatikan {petak}. {bidak} {lawan} tidak cukup terlindungi.",
      "Ada target di {petak}. {bidak} {lawan} kelihatannya bisa dipertimbangkan untuk diserang.",
    ],
    sendiriMenggantung: [
      "{bidak} {pihak} di {petak} mulai bermasalah. Jangan sampai lupa menjaganya.",
      "Ada yang tertinggal di {petak}. {lawan} bisa saja langsung memanfaatkannya.",
      "{bidak} {pihak} kurang aman di {petak}. Ini perlu diperhatikan.",
    ],
    paksa: [
      "Posisinya memaksa. Pilihan legal memang tinggal itu.",
      "Tidak banyak pilihan di sini. {san} jadi langkah yang tersedia.",
      "Keadaan papan yang menentukan. {pihak} harus memainkan {san}.",
    ],
    nilaiBrilian: [
      "Brilian. {san} bukan langkah yang kelihatan jelas, tapi hasilnya kuat sekali.",
      "Ini cerdas. {pihak} menemukan ide yang sulit dilihat sekilas.",
      "{san} benar-benar menonjol. Langkah seperti ini biasanya bikin lawan kaget.",
    ],
    nilaiHebat: [
      "Sangat kuat. {pihak} menemukan respons yang tepat di momen penting.",
      "{san} bagus sekali. Tekanannya langsung terasa.",
      "Pilihan yang tajam dari {pihak}. Tidak mudah menemukan langkah ini.",
    ],
    nilaiTerbaik: [
      "{san} adalah pilihan terbaik di posisi ini.",
      "Engine menunjuk {san} sebagai langkah utama. Masuk akal kalau dilihat posisinya.",
      "Pilihan paling akurat jatuh ke {san}.",
    ],
    nilaiUnggul: [
      "{san} kuat dan tetap menjaga kualitas posisi {pihak}.",
      "Pilihan yang sangat sehat. Keunggulan masih terjaga.",
      "Tidak banyak yang perlu dikritik dari {san}. Posisi tetap nyaman.",
    ],
    nilaiLayak: [
      "Masih aman. Ada pilihan yang lebih tepat, tapi {san} tidak merusak posisi.",
      "{san} cukup masuk akal. Belum ada masalah besar.",
      "Bukan pilihan paling tajam, tapi masih bisa dimainkan.",
    ],
    nilaiKeliru: [
      "Sedikit meleset. {san} memberi {lawan} ruang tambahan.",
      "Ada yang kurang pas dari {san}. Keunggulan mulai berkurang.",
      "Langkah ini tidak separah blunder, tapi jelas bukan pilihan terbaik.",
    ],
    nilaiKesalahan: [
      "Ini mulai jadi masalah. {san} memberi {lawan} kesempatan nyata.",
      "Kesalahan yang terasa. Posisi {pihak} sekarang lebih sulit.",
      "{san} terlalu longgar. {lawan} mendapat celah untuk masuk.",
    ],
    nilaiKelewat: [
      "Peluang bagus tadi ada, tapi {pihak} melewatkannya.",
      "Sayang, kesempatan itu tidak diambil. {lawan} masih selamat.",
      "Ada pukulan yang lebih kuat, tetapi {pihak} memilih jalan lain.",
    ],
    nilaiBlunder: [
      "Blunder besar. {san} membuka pintu lebar untuk {lawan}.",
      "Ini kesalahan mahal. Keadaan papan berubah drastis.",
      "{san} benar-benar lepas kendali. {lawan} sekarang punya peluang besar.",
    ],
    lebihKuat: [
      "Ada pilihan yang lebih kuat: {saran}.",
      "Kalau mau lebih tajam, engine memilih {saran}.",
      "Alternatif yang lebih kuat adalah {saran}.",
    ],
    seimbang: [
      "Masih seimbang. Belum ada yang berhasil mengambil kendali.",
      "Posisinya netral untuk sekarang. Pertandingan masih terbuka.",
      "Belum ada keunggulan yang benar-benar berarti.",
    ],
    unggulTipis: [
      "{unggul} sedikit lebih enak, sekitar {nilai} pion.",
      "Posisinya condong ke {unggul}, tapi selisihnya masih tipis.",
      "{unggul} punya kelebihan kecil. Belum aman dari kejaran.",
    ],
    unggulJelas: [
      "Sekarang {unggul} punya keunggulan yang cukup jelas, sekitar {nilai} pion.",
      "Tekanan mulai berat sebelah ke {unggul}.",
      "{unggul} sudah memegang kendali lebih besar di posisi ini.",
    ],
    unggulMenang: [
      "Posisi {unggul} sudah sangat nyaman. Sekitar {nilai} pion di depan.",
      "Ini sudah masuk wilayah menang untuk {unggul}. Tinggal jaga konsentrasi.",
      "{unggul} unggul jauh. Sekarang yang penting jangan memberi kesempatan balik.",
    ],
    unggulMat: [
      "{unggul} punya jalur menuju skakmat dalam {mat} langkah.",
      "Ada mat dalam {mat} untuk {unggul}. Tinggal menemukan urutannya.",
      "Posisinya sudah mengarah ke skakmat: {unggul} punya mat {mat}.",
    ],
    skakmat: [
      "Skakmat. Raja {lawan} selesai, {pihak} menang.",
      "Partainya berakhir di sini. {pihak} menutup permainan dengan skakmat.",
      "Tidak ada jalan keluar lagi. {pihak} menang lewat skakmat.",
    ],
    pat: [
      "Pat. Raja {lawan} tidak diskak, tetapi tidak punya langkah legal. Remis.",
      "Berakhir pat. Keunggulan tidak cukup untuk menghasilkan skakmat.",
      "Pat di akhir. Tidak ada langkah legal untuk {lawan}, jadi partai remis.",
    ],
    remis: [
      "Remis. Tidak ada pihak yang berhasil mengambil kemenangan.",
      "Partai selesai imbang. Poin dibagi.",
      "Berakhir remis setelah permainan yang seimbang.",
    ],
    remisUlang: [
      "Posisi terulang tiga kali. Hasilnya remis.",
      "Tiga kali posisi yang sama. Partai berakhir remis karena pengulangan.",
      "Pengulangan tiga kali mengunci hasil remis.",
    ],
    remisMaterial: [
      "Material yang tersisa tidak cukup untuk memaksakan skakmat. Remis.",
      "Tidak ada cukup tenaga di papan untuk membuat skakmat. Partai remis.",
      "Materinya sudah terlalu sedikit untuk menang secara paksa.",
    ],
    ajakEngine: [
      "Kalau penasaran seberapa akurat langkah ini, nyalakan engine.",
      "Engine bisa bantu lihat apakah {san} memang pilihan terbaik.",
      "Mau bongkar kualitas langkahnya? Nyalakan engine dan lihat penilaiannya.",
    ],
  },
  formal: {
    biasa: [
      "{pihak} memainkan {san}. Posisi masih dalam tahap pengembangan.",
      "Langkah {san} menjaga struktur permainan tetap stabil.",
      "{pihak} memilih {san}; rencana jangka panjangnya belum sepenuhnya terlihat.",
      "Tidak ada perubahan taktis besar setelah {san}.",
    ],
    buku: [
      "{san} masih sesuai dengan teori {pembukaan}.",
      "Permainan tetap berada dalam jalur umum {pembukaan}.",
      "{pihak} mempertahankan pola teoritis melalui {san}.",
    ],
    tangkap: [
      "{pihak} menangkap {korban} di {petak}. Struktur material berubah.",
      "{san} menghasilkan pertukaran material di {petak}.",
      "{korban} diambil pada {petak}; respons {lawan} menjadi penting berikutnya.",
    ],
    tangkapUntung: [
      "{pihak} memperoleh {korban} dengan keuntungan material di {petak}.",
      "Tangkapan ini menguntungkan {pihak} dari sisi material.",
      "{san} menghasilkan keuntungan material yang nyata untuk {pihak}.",
    ],
    tangkapMenteri: [
      "Menteri {lawan} ditangkap di {petak}. Kerugian materialnya sangat besar.",
      "{pihak} berhasil mengambil menteri {lawan} di {petak}.",
      "Kehilangan menteri membuat posisi {lawan} jauh lebih sulit.",
    ],
    skak: [
      "{pihak} memberikan skak melalui {san}. Raja {lawan} harus merespons.",
      "{san} memberikan tekanan langsung kepada raja {lawan}.",
      "Raja {lawan} berada dalam skak dan tidak dapat mengabaikan ancaman tersebut.",
    ],
    skakTambahan: [
      "Langkah tersebut sekaligus memberikan skak kepada raja {lawan}.",
      "Selain tujuan utamanya, {san} juga menghasilkan skak.",
      "Skak tambahan membuat respons {lawan} menjadi semakin terbatas.",
    ],
    skakSatuJalan: [
      "Raja {lawan} hanya memiliki satu respons legal.",
      "Pilihan respons {lawan} sangat terbatas: hanya satu langkah yang legal.",
      "Posisi memaksa {lawan} mengikuti satu-satunya respons yang tersedia.",
    ],
    rokadePendek: [
      "{pihak} melakukan rokade pendek untuk mengamankan raja dan mengaktifkan benteng.",
      "Rokade pendek menempatkan raja {pihak} pada posisi yang relatif aman.",
      "Dengan rokade pendek, {pihak} menyelesaikan pengamanan raja lebih awal.",
    ],
    rokadePanjang: [
      "{pihak} melakukan rokade panjang. Struktur permainan kini berpotensi lebih tajam.",
      "Raja {pihak} berpindah ke sayap menteri melalui rokade panjang.",
      "Rokade panjang menunjukkan bahwa penempatan raja menjadi bagian penting dari rencana {pihak}.",
    ],
    enPassant: [
      "{pihak} melakukan en passant, aturan khusus yang relatif jarang muncul.",
      "En passant terjadi pada {san}; langkah ini sah menurut aturan catur.",
      "Langkah khusus en passant digunakan pada posisi ini.",
    ],
    promosi: [
      "Pion {pihak} mencapai baris terakhir dan dipromosikan menjadi {bidak} di {petak}.",
      "{pihak} berhasil mempromosikan pion menjadi {bidak}.",
      "Promosi di {petak} mengubah nilai material secara signifikan.",
    ],
    lawanMenggantung: [
      "{bidak} {lawan} di {petak} tidak terlindungi dengan baik dan menjadi sasaran potensial.",
      "Petak {petak} menunjukkan kelemahan: {bidak} {lawan} berisiko kehilangan material.",
      "{bidak} {lawan} di {petak} perlu mendapat perhatian karena pertahanannya terbatas.",
    ],
    sendiriMenggantung: [
      "{bidak} {pihak} di {petak} kini kurang terlindungi dan dapat menjadi sasaran.",
      "Pertahanan terhadap {bidak} di {petak} melemah setelah langkah ini.",
      "{pihak} perlu memperhatikan {bidak} di {petak} karena {lawan} memiliki peluang menyerangnya.",
    ],
    paksa: [
      "Posisi memaksa {pihak} memilih {san}; alternatif legal sangat terbatas.",
      "{san} merupakan satu-satunya respons legal yang tersedia.",
      "Keadaan taktis menentukan langkah berikutnya dan membatasi pilihan {pihak}.",
    ],
    nilaiBrilian: [
      "{san} merupakan langkah yang sangat kuat dan sulit ditemukan secara langsung.",
      "Langkah brilian. {pihak} menemukan sumber daya taktis yang tidak mudah terlihat.",
      "Kualitas {san} sangat tinggi dan mengubah karakter posisi secara positif.",
    ],
    nilaiHebat: [
      "{san} merupakan respons yang sangat kuat pada posisi ini.",
      "{pihak} menemukan langkah yang tepat pada momen kritis.",
      "Langkah ini mempertahankan tekanan dengan tingkat akurasi yang tinggi.",
    ],
    nilaiTerbaik: [
      "{san} adalah pilihan terbaik menurut evaluasi engine.",
      "Engine menempatkan {san} sebagai langkah paling akurat.",
      "{pihak} memilih langkah utama yang tersedia pada posisi ini.",
    ],
    nilaiUnggul: [
      "{san} mempertahankan posisi dengan kualitas yang sangat baik.",
      "Langkah ini hampir setara dengan pilihan terbaik dan tetap menjaga keunggulan.",
      "Posisi tetap stabil setelah {san}.",
    ],
    nilaiLayak: [
      "{san} masih dapat diterima, meskipun terdapat pilihan yang lebih akurat.",
      "Langkah ini tidak menimbulkan masalah besar, tetapi bukan pilihan optimal.",
      "Posisi tetap dapat dimainkan setelah {san}.",
    ],
    nilaiKeliru: [
      "{san} sedikit mengurangi kualitas posisi {pihak}.",
      "Langkah ini kurang presisi dan memberi {lawan} ruang tambahan.",
      "Ada pilihan yang lebih baik; {san} membuat posisi sedikit lebih sulit.",
    ],
    nilaiKesalahan: [
      "{san} merupakan kesalahan yang memberi {lawan} peluang nyata.",
      "Kualitas posisi {pihak} menurun setelah langkah ini.",
      "Langkah tersebut memberi {lawan} kesempatan untuk mengambil alih momentum.",
    ],
    nilaiKelewat: [
      "{pihak} melewatkan peluang yang lebih kuat pada posisi ini.",
      "Kesempatan taktis tersedia, tetapi tidak dimanfaatkan.",
      "Langkah yang lebih kuat tersedia, namun {pihak} memilih alternatif lain.",
    ],
    nilaiBlunder: [
      "{san} merupakan blunder yang mengubah evaluasi secara drastis.",
      "Kesalahan besar ini memberi {lawan} keuntungan yang signifikan.",
      "Posisi {pihak} memburuk tajam setelah {san}.",
    ],
    lebihKuat: [
      "Alternatif yang lebih kuat adalah {saran}.",
      "Engine merekomendasikan {saran} sebagai pilihan yang lebih akurat.",
      "{saran} memberikan prospek posisi yang lebih baik.",
    ],
    seimbang: [
      "Posisi masih seimbang dan belum menunjukkan keunggulan yang berarti.",
      "Evaluasi tetap berada di sekitar keseimbangan.",
      "Belum ada pihak yang memperoleh keunggulan objektif yang signifikan.",
    ],
    unggulTipis: [
      "{unggul} memiliki keunggulan tipis sekitar {nilai} pion.",
      "Posisi sedikit condong kepada {unggul}, tetapi masih dapat dipertahankan oleh {lawan}.",
      "Keunggulan {unggul} masih kecil dan belum menentukan hasil.",
    ],
    unggulJelas: [
      "{unggul} memiliki keunggulan yang jelas, sekitar {nilai} pion.",
      "Tekanan posisi mulai berpihak secara nyata kepada {unggul}.",
      "{unggul} kini memiliki kendali yang lebih besar atas posisi.",
    ],
    unggulMenang: [
      "{unggul} memiliki posisi menang dengan keunggulan sekitar {nilai} pion.",
      "Keunggulan {unggul} sudah sangat besar dan secara objektif mengarah pada kemenangan.",
      "Fokus utama {unggul} sekarang adalah menyelesaikan permainan tanpa kesalahan.",
    ],
    unggulMat: [
      "{unggul} memiliki jalur skakmat dalam {mat} langkah.",
      "Engine menemukan ancaman skakmat dalam {mat} langkah untuk {unggul}.",
      "Posisi mengandung skakmat paksa dalam {mat} langkah bagi {unggul}.",
    ],
    skakmat: [
      "Skakmat. {pihak} memenangkan partai.",
      "Raja {lawan} tidak memiliki respons legal. {pihak} menang.",
      "Partai berakhir dengan skakmat setelah {san}.",
    ],
    pat: [
      "Pat. Raja {lawan} tidak berada dalam skak tetapi tidak memiliki langkah legal. Remis.",
      "Partai berakhir pat dan hasilnya remis.",
      "Tidak ada langkah legal untuk {lawan}; posisi berakhir pat.",
    ],
    remis: [
      "Partai berakhir remis tanpa pemenang.",
      "Kedua pihak berbagi hasil imbang.",
      "Permainan berakhir dengan hasil remis.",
    ],
    remisUlang: [
      "Posisi yang sama muncul tiga kali sehingga partai berakhir remis.",
      "Pengulangan tiga kali menyebabkan hasil remis.",
      "Partai dihentikan oleh aturan pengulangan posisi tiga kali.",
    ],
    remisMaterial: [
      "Material yang tersisa tidak cukup untuk memaksakan skakmat. Remis.",
      "Posisi tidak memiliki material yang memadai untuk menghasilkan skakmat.",
      "Dengan material yang tersisa, kemenangan tidak dapat dipaksakan.",
    ],
    ajakEngine: [
      "Aktifkan engine untuk melihat evaluasi objektif terhadap langkah ini.",
      "Engine dapat digunakan untuk memeriksa apakah {san} merupakan pilihan terbaik.",
      "Nyalakan engine jika ingin melihat skor dan alternatif langkah secara lebih rinci.",
    ],
  },
};

const TAMBAHAN_EN = {
  santai: {
    biasa: ["{pihak} plays {san}. Still early, so let's see where it goes.", "{san} from {pihak}. Nothing dramatic yet.", "{pihak} keeps developing with {san}.", "A quiet {san}. The position is still taking shape.", "{pihak} keeps the move simple with {san}.", "{san} keeps the position moving without forcing anything."],
    buku: ["Still theory in {pembukaan}: {san}.", "{pihak} follows the usual {pembukaan} path with {san}.", "{san} keeps the game inside {pembukaan} theory.", "{san} is still part of the known {pembukaan} line."],
    tangkap: ["{pihak} takes {korban} on {petak}. Material shifts.", "{korban} comes off on {petak}. Now we wait for the reply.", "{pihak} grabs {korban} with {san}.", "{pihak} takes {korban} on {petak}; the material count changes."],
    tangkapUntung: ["{pihak} wins {korban} cheaply on {petak}.", "That capture is good business for {pihak}.", "{pihak} gets extra material from {san}.", "{pihak} comes out ahead after taking {korban} on {petak}."],
    tangkapMenteri: ["The {lawan}'s queen falls on {petak}. That's a serious loss.", "{pihak} takes the queen on {petak}. This changes the game.", "The queen is gone. {lawan} has a major problem now."],
    skak: ["Check. {lawan}'s king has to deal with this first.", "{san} comes with check. No time to ignore it.", "{pihak} checks the king and forces a response.", "{pihak} gives check with {san}, so {lawan} has to respond."],
    skakTambahan: ["And it comes with check too.", "Check on top of everything else.", "The extra check makes the reply even more urgent."],
    skakSatuJalan: ["Only one legal reply is left.", "{lawan} has exactly one way out.", "The position leaves {lawan} with a single legal move."],
    rokadePendek: ["{pihak} castles short. King safe, rook ready.", "Short castling gets the king out of the center.", "The king finds safety with a short castle."],
    rokadePanjang: ["{pihak} castles long. Things may get sharper now.", "The king heads to the queenside with a long castle.", "Long castling changes the shape of the position."],
    enPassant: ["En passant. You don't see that every day.", "{pihak} uses the en passant rule.", "A rare little rule makes an appearance: en passant."],
    promosi: ["{pihak}'s pawn promotes to a {bidak} on {petak}.", "Promotion. That pawn just got a new job.", "The pawn reaches the end and becomes a {bidak}."],
    lawanMenggantung: ["The {lawan}'s {bidak} on {petak} is loose.", "Keep an eye on {petak}; that {bidak} is vulnerable.", "{lawan} has a loose {bidak} on {petak}."],
    sendiriMenggantung: ["The {pihak}'s {bidak} on {petak} is getting loose.", "That {bidak} on {petak} needs protection.", "{lawan} may be able to target the {bidak} on {petak}."],
    paksa: ["The position forces this move.", "There isn't much choice here. {san} is the legal reply.", "The board is making the decision for {pihak}."],
    nilaiBrilian: ["Brilliant. {san} is easy to miss but very strong.", "That's a sharp idea from {pihak}.", "{san} is a standout move. Hard to spot, even harder to punish."],
    nilaiHebat: ["Excellent find. {pihak} got the timing right.", "{san} is a very strong response.", "A strong move at an important moment."],
    nilaiTerbaik: ["{san} is the engine's top choice.", "Best move: {san}.", "The most accurate option here is {san}."],
    nilaiUnggul: ["{san} keeps the position in great shape.", "A very solid choice from {pihak}.", "Strong enough to keep the advantage."],
    nilaiLayak: ["Playable. There is a cleaner option, but this holds together.", "{san} is fine, just not the sharpest.", "Nothing serious is wrong with {san}."],
    nilaiKeliru: ["A little inaccurate. {lawan} gets some room.", "{san} gives away a bit of the advantage.", "Not a disaster, but {san} is less precise."],
    nilaiKesalahan: ["That is a real mistake. {lawan} gets a chance.", "{san} makes the position harder for {pihak}.", "The momentum starts moving toward {lawan}."],
    nilaiKelewat: ["A stronger chance was there, but {pihak} missed it.", "That opportunity slips away.", "{pihak} had a tactical shot and let it pass."],
    nilaiBlunder: ["Big blunder. {san} changes everything.", "That's expensive. {lawan} gets a huge chance now.", "{san} drops the position badly."],
    lebihKuat: ["A stronger option is {saran}.", "The engine prefers {saran} here.", "{saran} gives a better version of the position."],
    seimbang: ["Still balanced. Nobody has taken control yet.", "The position remains level.", "No meaningful advantage for either side yet."],
    unggulTipis: ["{unggul} is slightly better, about {nilai} pawns.", "A small edge for {unggul}, but the game is far from over.", "{unggul} has the easier position for now."],
    unggulJelas: ["{unggul} has a clear edge of about {nilai} pawns.", "The pressure is starting to favor {unggul}.", "{unggul} is taking more control of the position."],
    unggulMenang: ["{unggul} is well ahead, around {nilai} pawns.", "This is a winning position for {unggul} if they stay careful.", "{unggul} has a huge advantage. The main job now is not to throw it away."],
    unggulMat: ["{unggul} has mate in {mat}.", "There is a mate in {mat} for {unggul}.", "The position contains a forced mate in {mat} for {unggul}."],
    skakmat: ["Checkmate. {pihak} wins.", "That's mate. {lawan}'s king has nowhere to go.", "Game over by checkmate. {pihak} takes it."],
    pat: ["Stalemate. No legal moves, no check, so it's a draw.", "That ends in stalemate. A draw.", "No legal move for {lawan}; the game is drawn by stalemate."],
    remis: ["Draw. Neither side gets the win.", "The game ends level.", "A draw after the fight."],
    remisUlang: ["Threefold repetition. The game is a draw.", "The position repeats three times, so it's drawn.", "Three repetitions settle the game as a draw."],
    remisMaterial: ["Not enough material to force mate. Draw.", "There isn't enough material left to checkmate.", "The remaining material cannot force a win."],
    ajakEngine: ["Turn on the engine if you want an objective check of {san}.", "Want to see how accurate that was? Turn on the engine.", "Enable the engine to see the score and stronger alternatives."],
  },
  formal: {
    biasa: ["{pihak} plays {san}. The position remains in a developmental phase.", "{san} keeps the position structurally stable.", "{pihak} chooses {san}; the longer-term plan is not yet fully clear.", "{pihak} plays {san}, maintaining the current structure."],
    buku: ["{san} remains within {pembukaan} theory.", "The game continues along a known {pembukaan} line.", "{pihak} maintains the theoretical structure with {san}."],
    tangkap: ["{pihak} captures {korban} on {petak}. The material balance changes.", "{san} produces a material exchange on {petak}.", "{korban} is captured on {petak}; the reply will be important."],
    tangkapUntung: ["{pihak} gains {korban} with a material advantage.", "The capture favors {pihak} materially.", "{san} produces a tangible material gain for {pihak}."],
    tangkapMenteri: ["The queen is captured on {petak}, a major material loss.", "{pihak} takes the queen on {petak}.", "Losing the queen leaves {lawan} in serious difficulty."],
    skak: ["{pihak} gives check with {san}. The king must respond.", "{san} places the {lawan} king in check.", "The {lawan} king is under direct pressure and must respond."],
    skakTambahan: ["The move also gives check.", "In addition to its main purpose, {san} checks the king.", "The additional check further limits the opponent's response."],
    skakSatuJalan: ["The {lawan} king has only one legal response.", "Only one legal reply is available.", "The position forces a single legal response."],
    rokadePendek: ["{pihak} castles short, securing the king and activating the rook.", "Short castling improves the king's safety.", "{pihak} completes king safety with a short castle."],
    rokadePanjang: ["{pihak} castles long, creating a sharper structure.", "The {pihak} king moves to the queenside through long castling.", "Long castling changes the strategic balance of the position."],
    enPassant: ["{pihak} uses the en passant rule, an uncommon occurrence.", "En passant is played in this position.", "The special en passant capture is legally available and has been used."],
    promosi: ["The {pihak} pawn promotes to a {bidak} on {petak}.", "{pihak} completes a promotion to a {bidak}.", "Promotion on {petak} significantly changes the material balance."],
    lawanMenggantung: ["The {lawan} {bidak} on {petak} is insufficiently protected.", "The {bidak} on {petak} is a potential tactical target.", "The {lawan} should address the vulnerability of the {bidak} on {petak}."],
    sendiriMenggantung: ["The {pihak} {bidak} on {petak} is insufficiently protected.", "The {bidak} on {petak} may become a tactical target.", "{pihak} should be aware that the {lawan} can target the {bidak} on {petak}."],
    paksa: ["The position forces this move.", "The legal alternatives are very limited.", "The tactical situation leaves {pihak} with little choice."],
    nilaiBrilian: ["{san} is an exceptionally strong and difficult move to find.", "A brilliant tactical resource from {pihak}.", "The quality of {san} is unusually high for this position."],
    nilaiHebat: ["{san} is a very strong response at a critical moment.", "{pihak} finds an accurate solution to the position.", "The move maintains strong pressure with high precision."],
    nilaiTerbaik: ["{san} is the engine's best move.", "The engine identifies {san} as the most accurate choice.", "{pihak} selects the principal engine line with {san}."],
    nilaiUnggul: ["{san} maintains the position at a very high level of quality.", "The move is close to optimal and preserves the advantage.", "The position remains stable after {san}."],
    nilaiLayak: ["{san} remains playable, although a more accurate option exists.", "The move is acceptable but not optimal.", "The position remains defensible after {san}."],
    nilaiKeliru: ["{san} slightly reduces the quality of {pihak}'s position.", "The move is less precise and gives {lawan} additional room.", "A stronger choice exists; {san} makes the position somewhat harder."],
    nilaiKesalahan: ["{san} is a significant mistake that gives {lawan} a real opportunity.", "The position deteriorates after this move.", "The move allows {lawan} to take over the initiative."],
    nilaiKelewat: ["{pihak} misses a stronger opportunity.", "A tactical chance was available but not used.", "A stronger continuation existed, but {pihak} chose another line."],
    nilaiBlunder: ["{san} is a major blunder that changes the evaluation sharply.", "This error gives {lawan} a decisive opportunity.", "The position deteriorates dramatically after {san}."],
    lebihKuat: ["A stronger alternative is {saran}.", "The engine recommends {saran} as the more accurate choice.", "{saran} offers better prospects."],
    seimbang: ["The position remains objectively balanced.", "The evaluation is still close to equal.", "Neither side has established a significant objective advantage."],
    unggulTipis: ["{unggul} has a small advantage of about {nilai} pawns.", "The position slightly favors {unggul}, but remains defensible.", "{unggul} has a modest edge that is not yet decisive."],
    unggulJelas: ["{unggul} has a clear advantage of about {nilai} pawns.", "The position now favors {unggul} in a meaningful way.", "{unggul} has gained greater control of the position."],
    unggulMenang: ["{unggul} has a winning advantage of about {nilai} pawns.", "The position is objectively winning for {unggul}.", "The main task for {unggul} is now accurate conversion."],
    unggulMat: ["{unggul} has a forced mate in {mat}.", "The engine finds mate in {mat} for {unggul}.", "A forced mating sequence exists in {mat} moves."],
    skakmat: ["Checkmate. {pihak} wins the game.", "The {lawan} king has no legal response. {pihak} wins.", "The game ends with checkmate after {san}."],
    pat: ["Stalemate. The king is not in check but has no legal move. Draw.", "The game ends in stalemate and is drawn.", "No legal move remains for {lawan}; the result is a stalemate draw."],
    remis: ["The game ends in a draw.", "Neither side secures a win.", "The final result is a draw."],
    remisUlang: ["The position has repeated three times, resulting in a draw.", "Threefold repetition determines the result.", "The game is drawn by threefold repetition."],
    remisMaterial: ["The remaining material is insufficient to force checkmate.", "There is not enough material to produce a forced mate.", "A win cannot be forced with the remaining material."],
    ajakEngine: ["Enable the engine for an objective evaluation of {san}.", "Turn on the engine to check the accuracy of this move.", "The engine can provide the score and stronger alternatives."],
  },
};

function tambahkan(target, tambahan) {
  for (const [gaya, kategori] of Object.entries(tambahan)) {
    if (!target[gaya]) continue;
    for (const [kunci, kalimat] of Object.entries(kategori)) {
      if (!Array.isArray(target[gaya][kunci])) continue;
      target[gaya][kunci].push(...kalimat);
    }
  }
}

tambahkan(idPapan, TAMBAHAN_ID);
tambahkan(enPapan, TAMBAHAN_EN);
