/**
 * Kamus Indonesia (ID) · teks komentator — dipakai lewat kunci papan.komentator.* dan
 * tekaTeki.komentator.* (lihat komentator.js di berkas papan/tekaTeki).
 * Blok ini diimpor oleh papan.js dan tekaTeki.js.
 *
 * Setiap kategori WAJIB punya minimal sejumlah varian yang diminta mesin
 * (lihat tambah()/tambahSoal()/peristiwaUtama()/motifPosisional() di src/lib/komentator.js):
 * mesin memilih varian lewat hash, jadi varian yang kurang membuat kunci
 * mentah bocor ke UI. Placeholder memakai nama kunci kamus ({pihak}, {san},
 * {lawan}, {petak}, {bidak}, {korban}, {pembukaan}, {unggul}, {nilai},
 * {mat}, {saran}, {awan}) — mesin komentator yang mengisinya, bukan bahasa
 * teksnya.
 */

/** komentator untuk Papan Interaktif — kunci aslinya papan.komentator.* */
export const komentatorPapan = {
  judul: "Komentator Papan",
  keterangan: "Ulasan langsung berbasis posisi papan, arsip partai grandmaster, dan evaluasi mesin.",
  nyalakan: "Nyalakan komentator",
  matikan: "Matikan komentator",
  gayaLabel: "Gaya Narasi",
  gayaSantai: "Pelatih Klub",
  gayaFormal: "Klasik Grandmaster",
  gayaGenZ: "Siaran Cepat",
  menunggu: "Menunggu langkah pembuka...",
  posisiAwal: "Papan siap. Putih memegang langkah pertama.",
  menilai: "Menelusuri jalur utama...",
  labelArsipMaster: "Catatan Master",
  labelDuelMesin: "Arsip Manusia vs Mesin",
  jejakPartaiMaster: "Jejak partai master: {partai}",
  olehKomentator: "Ulasan {komentator}",
  pihak: { putih: "Putih", hitam: "Hitam" },
  bidak: { p: "pion", n: "kuda", b: "gajah", r: "benteng", q: "menteri", k: "raja" },

  santai: {
    biasa: [
      "{pihak} menata ulang koordinasi lewat {san} sambil menunggu celah di kubu {lawan}.",
      "{san} — manuver sabar dari {pihak} untuk memperbaiki penempatan {bidak} di {petak}.",
      "{pihak} memilih {san}, menjaga struktur tetap rapat sebelum membuka konfrontasi baru.",
      "Lewat {san}, {pihak} memperkuat kontrol petak sekitar {petak} tanpa terburu-buru.",
    ],
    buku: [
      "{san} mengikuti jalur utama {pembukaan} yang sudah teruji di level turnamen.",
      "Masih di koridor teori {pembukaan} — {san} menjaga keseimbangan pengembangan kedua kubu.",
      "Langkah buku {san} dalam {pembukaan}; duel sesungguhnya baru dimulai selepas fase pembukaan ini.",
    ],
    tangkap: [
      "{pihak} menyapu {korban} di {petak} lewat {san}, mengurai ketegangan di sektor itu.",
      "Pertukaran di {petak}: {pihak} mengambil {korban} dan memaksa {lawan} menyesuaikan rencana.",
      "{san} — {korban} di {petak} berpindah tangan, membuka jalur baru bagi perwira.",
    ],
    tangkapUntung: [
      "Tangkapan bersih! {pihak} memenangkan {korban} di {petak} dengan harga jauh lebih murah.",
      "{san}! {pihak} unggul pertukaran material di {petak}, membuat tugas bertahan {lawan} kian berat.",
    ],
    tangkapMenteri: [
      "Menteri {lawan} tumbang di {petak}! Lewat {san}, {pihak} mengantongi keunggulan penentu.",
      "{san}! Menteri lawan berhasil direbut di {petak} — arah partai berubah drastis.",
    ],
    tukarMenteri: [
      "Adu menteri di {petak}! Lewat {san}, {pihak} mengajak masuk ke babak akhir yang menuntut teknik rapi.",
      "{san} menukar menteri di {petak}; tekanan serangan langsung mereda dan struktur pion kini jadi penentu.",
    ],
    tukarGajahKuda: [
      "{pihak} melepas gajah untuk kuda di {petak} lewat {san}, mengincar perubahan struktur pion {lawan}.",
      "{san} — gajah ditukar dengan kuda di {petak} demi mencuri tempo atau merusak susunan pion.",
    ],
    fianchetto: [
      "{pihak} menempatkan gajah secara fianchetto di {petak}, mengintai diagonal panjang sejak dini.",
      "{san} — gajah bersarang di {petak} untuk menekan pusat dari jarak jauh.",
    ],
    dobrakPusat: [
      "Dobrakan pion {san}! {pihak} langsung menantang rantai pion pusat {lawan} agar lajur segera terbuka.",
      "{pihak} mendorong {san}, menggoyang tumpuan pusat {lawan} dan memperebutkan inisiatif.",
    ],
    kudaPosTerdepan: [
      "Kuda {pihak} mendarat mantap di pos terdepan {petak}! Dijaga pion sendiri dan sulit diusir {lawan}.",
      "{san} menancapkan kuda di {petak} — pijakan ideal yang menekan jantung pertahanan {lawan}.",
    ],
    bentengLajurTerbuka: [
      "{pihak} menggeser benteng ke {petak} lewat {san}, langsung menguasai lajur yang terbuka.",
      "{san} — benteng {pihak} mengambil alih lajur dari {petak} untuk menyiapkan penetrasi ke wilayah lawan.",
    ],
    bentengBarisTujuh: [
      "Benteng {pihak} menyusup ke {petak}! Baris ketujuh dikuasai, mengancam barisan pion dan membatasi raja {lawan}.",
      "{san} menempatkan benteng di baris pertahanan {lawan} — motif klasik yang sangat merepotkan.",
    ],
    pionBebas: [
      "Pion bebas {pihak} melaju ke {petak}! Setiap langkah majunya makin mengikat perwira {lawan}.",
      "{san} — pion bebas di {petak} mulai menjadi aset berharga menjelang babak akhir.",
    ],
    profilaksisSayap: [
      "{san} — langkah profilaksis rapi dari {pihak}, menutup petak loncatan perwira {lawan} sekaligus memberi ruang bernapas.",
      "Sentuhan pencegahan lewat {san}: sayap dijaga lebih dulu sebelum {pihak} melanjutkan rencana utama.",
    ],
    menteriDini: [
      "Menteri {pihak} sudah keluar ke {petak} lewat {san} — agresif, tetapi rawan kehilangan tempo bila dikejar perwira ringan {lawan}.",
      "{san} mengeluarkan menteri lebih awal; {pihak} harus berhati-hati agar tidak tertinggal pengembangan.",
    ],
    kembangPerwira: [
      "{pihak} mengaktifkan {bidak} ke {petak} lewat {san}, mempercepat pengembangan menuju pusat.",
      "{san} membawa {bidak} {pihak} masuk ke permainan dan membuka jalan menuju rokade.",
      "Pengembangan wajar lewat {san}: {bidak} {pihak} kini ikut mengawasi petak-petak penting.",
    ],
    rajaAktifAkhir: [
      "Tanpa menteri di papan, raja {pihak} maju ke {petak} lewat {san} untuk ikut bertempur di babak akhir.",
      "{san} — prinsip babak akhir dijalankan: raja {pihak} bergerak aktif mendekati pusat permainan.",
    ],
    skak: [
      "Skak lewat {san}! Raja {lawan} dipaksa segera mencari jawaban.",
      "{pihak} melayangkan skak {san} dan merebut tempo dari tangan {lawan}.",
      "{san} memberi skak langsung — koordinasi pertahanan {lawan} diuji saat ini juga.",
    ],
    skakTambahan: [
      "Sekaligus skak! {lawan} tidak sempat membalas di tempat lain karena rajanya terancam.",
      "Langkah ini datang dengan tempo skak, memaksa {lawan} merespons seketika.",
    ],
    skakSatuJalan: [
      "Raja {lawan} hanya punya satu langkah balasan yang sah.",
    ],
    rokadePendek: [
      "{pihak} rokade pendek — raja menepi dengan aman dan benteng siap bekerja di jalur tengah.",
      "Rokade sayap raja dari {pihak}; raja terlindung rapi dan perwira siap disatukan.",
    ],
    rokadePanjang: [
      "{pihak} memilih rokade panjang! Benteng langsung terarah ke lajur tengah dan pertarungan tajam terbuka.",
      "Rokade sayap menteri oleh {pihak} — sinyal jelas bahwa duel serangan berlawanan sayap bisa pecah.",
    ],
    enPassant: [
      "Tangkapan en passant {san}! {pihak} tak membiarkan pion lawan menyelinap begitu saja.",
      "{pihak} mengambil pion secara en passant di {petak} untuk menjaga struktur tetap terbuka.",
    ],
    promosi: [
      "Pion {pihak} menembus baris ujung dan promosi menjadi {bidak} di {petak}!",
      "Perjuangan panjang terbayar: pion {pihak} resmi berubah menjadi {bidak} baru di {petak}!",
    ],
    lawanMenggantung: [
      "Awas di {petak} — perwira {lawan} di sana tampak berdiri tanpa penjagaan yang memadai.",
      "Ada sasaran taktis di {petak}: bidak {lawan} tertinggal tanpa pelindung.",
    ],
    sendiriMenggantung: [
      "Hati-hati, {bidak} {pihak} di {petak} kini berdiri tanpa kawalan yang cukup.",
      "Celah kecil muncul di {petak}: {bidak} {pihak} berisiko menjadi sasaran balik {lawan}.",
    ],
    paksa: [
      "Satu-satunya langkah legal di papan — {pihak} memang tak punya pilihan lain.",
      "Langkah paksa; seluruh opsi lain tertutup pada posisi ini.",
    ],
    nilaiBrilian: [
      "Langkah brilian! {san} mengorbankan materi demi membongkar pertahanan {lawan} hingga ke akar!",
      "Luar biasa tajam — {pihak} menemukan pengorbanan {san} yang benar-benar matang secara taktis!",
      "Ide kelas grandmaster lewat {san}! {pihak} menukar materi dengan serangan yang tak terbendung.",
    ],
    nilaiHebat: [
      "Langkah kunci ditemukan! {san} menjaga tekanan maksimum di titik paling peka.",
      "Sangat akurat dari {pihak} — {san} adalah satu-satunya cara mempertahankan inisiatif.",
      "Pilihan tajam! {pihak} membaca tuntutan posisi dengan sangat jernih lewat {san}.",
    ],
    nilaiTerbaik: [
      "{san} tepat menjadi pilihan terkuat mesin pada posisi ini.",
      "Eksekusi rapi — {pihak} memainkan lanjutan paling akurat lewat {san}.",
      "Tepat sasaran. {san} memaksimalkan potensi perwira {pihak}.",
    ],
    nilaiUnggul: [
      "Langkah kuat dan terkendali; {san} mempertahankan posisi baik milik {pihak}.",
      "Solid dari {pihak}. {san} menjaga ritme permainan tanpa memberi celah.",
      "Pilihan praktis yang sangat sehat dari {pihak} lewat {san}.",
    ],
    nilaiLayak: [
      "{san} cukup dapat dimainkan, walau ada jalur lain yang sedikit lebih menekan.",
      "Langkah aman dari {pihak}; posisi tetap utuh meski bukan opsi paling tajam.",
      "Masih wajar — {san} menjaga bangunan posisi {pihak} tetap terkendali.",
    ],
    nilaiKeliru: [
      "Sedikit kurang presisi. {san} melepas sebagian tekanan dan memberi waktu bagi {lawan}.",
      "Inakurasi tipis lewat {san}; {lawan} kini lebih leluasa merapikan perwiranya.",
      "{san} agak pasif pada momen ini sehingga inisiatif sedikit mengendur.",
    ],
    nilaiKesalahan: [
      "Kesalahan penting! {san} memberi peluang nyata bagi {lawan} untuk membalikkan kendali.",
      "{san} meninggalkan celah di posisi {pihak} yang bisa langsung dihukum {lawan}.",
      "Kurang teliti — lewat {san}, arah pertarungan mulai bergeser ke tangan {lawan}.",
    ],
    nilaiKelewat: [
      "Sayang sekali! Ada pukulan taktis yang jauh lebih menentukan ketimbang {san}.",
      "Peluang emas terlewat — {pihak} membiarkan {lawan} lolos dari tekanan terberat.",
      "{pihak} melewatkan lanjutan pemenang yang sudah terbuka di papan.",
    ],
    nilaiBlunder: [
      "Blunder berat! {san} langsung meruntuhkan pertahanan {pihak}.",
      "Kesalahan fatal lewat {san} — evaluasi berbalik tajam menguntungkan {lawan}!",
      "Terpeleset keras di momen kritis! {san} menyerahkan keuntungan besar kepada {lawan}.",
    ],
    lebihKuat: [
      "Jalur yang jauh lebih menggigit tadi adalah {saran}.",
      "Sebagai perbandingan, {saran} memberi tekanan yang jauh lebih kuat.",
    ],
    seimbang: [
      "Permainan masih berimbang — kedua kubu punya pegangan masing-masing.",
      "Peluang masih sama kuat; belum ada pihak yang benar-benar mendikte papan.",
      "Keseimbangan terjaga rapi, tinggal adu ketelitian rencana berikutnya.",
    ],
    unggulTipis: [
      "{unggul} memegang tepi keunggulan tipis (+{nilai}) dan mulai mendikte arah permainan.",
      "Sedikit lebih nyaman bagi {unggul} (+{nilai}), namun {lawan} masih sangat bisa bertahan.",
    ],
    unggulJelas: [
      "{unggul} unggul jelas (+{nilai}) dengan koordinasi perwira yang jauh lebih hidup.",
      "Kendali posisi berada di tangan {unggul} (+{nilai}); ruang gerak lawan kian menyempit.",
    ],
    unggulMenang: [
      "{unggul} sudah memegang posisi menang (+{nilai}) — tinggal menuntaskan keunggulan dengan tenang.",
      "Keunggulan besar untuk {unggul} (+{nilai}); pertahanan lawan berada di ambang runtuh.",
    ],
    unggulMat: [
      "Rangkaian skakmat paksa terlihat di papan: {unggul} mematikan dalam {mat} langkah!",
      "Tak ada jalan keluar lagi — {unggul} punya skakmat paksa dalam {mat} langkah.",
    ],
    skakmat: [
      "Skakmat! Lewat {san}, {pihak} menutup partai dengan tuntas.",
      "Selesai sudah — {san} mengunci raja {lawan} tanpa satu pun petak pelarian. Kemenangan untuk {pihak}!",
      "Skakmat bersih! Serangan {pihak} mencapai puncaknya lewat {san}.",
    ],
    pat: [
      "Pat! Raja tidak sedang diskak tetapi seluruh langkah legal habis — partai berakhir remis.",
      "Terjebak pat! Tidak ada langkah sah tersisa sehingga hasil berbagi angka.",
    ],
    remis: [
      "Partai berakhir remis setelah pertarungan yang seimbang.",
      "Hasil imbang — tak ada kubu yang mampu menembus pertahanan lawan.",
    ],
    remisUlang: [
      "Posisi yang sama terulang tiga kali — partai resmi remis.",
      "Remis lewat pengulangan posisi tiga kali; kedua pihak tak mau menyimpang.",
    ],
    remisMaterial: [
      "Perwira yang tersisa di papan tak lagi cukup untuk memaksakan skakmat — remis.",
      "Remis karena materi tidak mencukupi untuk mematikan raja lawan.",
    ],
    ajakEngine: [
      "Ingin melihat hitungan mendalam dan kandidat terbaik? Nyalakan engine analisis di panel ini.",
      "Aktifkan engine bila ingin membandingkan rencana ini dengan evaluasi objektif mesin.",
    ],
    awan: [
      "Referensi basis data awan menyarankan {awan} (nilai {nilai}).",
      "Menurut catatan basis data awan, kandidat utamanya adalah {awan} ({nilai}).",
    ],
    fork: [
      "Garpuan tajam! {bidak} {pihak} di {petak} mengancam dua sasaran sekaligus!",
      "Serangan ganda dari {petak} — {lawan} dipaksa merelakan salah satu perwiranya.",
      "{san} menancapkan garpuan di {petak}! Pertahanan {lawan} terbelah dua.",
    ],
    skakBayangan: [
      "Skak terbuka! Geseran {bidak} {pihak} ke {petak} membuka garis tembak langsung ke raja {lawan}!",
      "Taktik skak bayangan lewat {san} — serangan tersembunyi kini menyergap raja {lawan}!",
    ],
    terpaku: [
      "Perwira {lawan} di {petak} kini terpaku dan tak bisa bergerak bebas tanpa membuka rajanya.",
      "Ikatan pin yang menyulitkan di {petak}: perwira {lawan} lumpuh di garis serangan.",
    ],
    seimbangDinamis: [
      "Pertarungan seimbang yang hidup — kedua pihak sama-sama punya truf aktif di papan.",
      "Secara objektif setara, namun posisi masih kaya rencana bagi {pihak} maupun {lawan}.",
      "Struktur dan keaktifan perwira saling mengimbangi; akurasi manuver tengah akan menentukan.",
      "Kedua kubu berdiri kokoh dalam keseimbangan dinamis tanpa kelemahan mencolok.",
    ],
    unggulStruktur: [
      "{pihak} menikmati struktur pion yang lebih sehat sementara kubu {lawan} menyimpan petak lemah.",
      "Materi masih setara, tetapi keleluasaan ruang dan susunan pion memihak {pihak}.",
    ],
    posisiTajam: [
      "Papan memanas! Banyak jalur taktis terbuka dan satu salah hitung bisa langsung berakibat fatal.",
      "Komplikasi tajam pecah di papan — setiap tempo kini bernilai sangat mahal.",
    ],
  },

  formal: {
    biasa: [
      "{pihak} memainkan {san}, menata ulang koordinasi perwira sambil menjaga keutuhan struktur.",
      "Lewat {san}, {pihak} melakukan konsolidasi tenang untuk memperkuat penguasaan petak kunci.",
      "{pihak} menempatkan {bidak} di {petak}, memperbaiki harmoni posisi sebelum membuka aksi baru.",
      "{san} dimainkan secara profilaksis; keseimbangan strategis papan tetap terjaga.",
    ],
    buku: [
      "{san} merupakan lanjutan baku dalam teori {pembukaan} yang telah mapan di praktik turnamen.",
      "Masih mengikuti jalur utama {pembukaan}; {pihak} menjaga disiplin pembukaan lewat {san}.",
      "Dalam kerangka {pembukaan}, {san} adalah respons teoretis yang teruji oleh para grandmaster.",
    ],
    tangkap: [
      "Pertukaran di {petak}: {pihak} mengambil {korban} dan mengubah imbangan perwira di papan.",
      "Lewat {san}, {pihak} menyingkirkan {korban} di {petak} guna memperjelas struktur tengah.",
      "{pihak} mengeksekusi penangkapan {korban} di {petak}, memaksa penyesuaian taktis dari {lawan}.",
    ],
    tangkapUntung: [
      "{pihak} memperoleh keuntungan materi bersih lewat penangkapan {korban} di {petak}.",
      "Eksekusi {san} memenangkan {korban} di {petak} dengan kompensasi minimal bagi {lawan}.",
    ],
    tangkapMenteri: [
      "Titik balik partai: menteri {lawan} jatuh di {petak}, memberi keunggulan materi penentu bagi {pihak}.",
      "Menteri {lawan} tersingkir di {petak} lewat {san}; keseimbangan materi timpang secara drastis.",
    ],
    tukarMenteri: [
      "Pertukaran menteri di {petak} lewat {san} menyederhanakan posisi menuju babak akhir teknis.",
      "{pihak} menawarkan penyederhanaan menteri di {petak}; fokus beralih pada struktur pion dan keaktifan raja.",
    ],
    tukarGajahKuda: [
      "{pihak} menyerahkan gajah untuk kuda di {petak}, mengincar konsesi struktur atau kendali petak warna tertentu.",
      "Lewat {san}, pasangan gajah dilepas demi merusak koordinasi kuda atau susunan pion {lawan} di {petak}.",
    ],
    fianchetto: [
      "{pihak} mengembangkan gajah secara fianchetto ke {petak} untuk menguasai diagonal panjang.",
      "{san} menempatkan gajah di sayap guna menekan petak-petak pusat secara tidak langsung.",
    ],
    dobrakPusat: [
      "Dobrakan tematik {san}: {pihak} menantang struktur pion pusat {lawan} untuk membuka lajur permainan.",
      "Lewat {san}, {pihak} menggugat kemapanan pusat {lawan} dan memperebutkan inisiatif babak tengah.",
    ],
    kudaPosTerdepan: [
      "Kuda {pihak} menduduki pos terdepan ideal di {petak}, ditopang pion sendiri dan kebal dari usiran pion lawan.",
      "Penempatan kuda di {petak} lewat {san} memberikan pijakan strategis jangka panjang bagi {pihak}.",
    ],
    bentengLajurTerbuka: [
      "{pihak} memusatkan benteng ke {petak}, mengambil kendali atas lajur yang bebas dari pion sendiri.",
      "Lewat {san}, benteng {pihak} menguasai jalur vertikal dari {petak} sebagai persiapan invasi.",
    ],
    bentengBarisTujuh: [
      "Invasi klasik lewat {san}: benteng {pihak} menembus baris pertahanan lawan di {petak}.",
      "Benteng di {petak} menekan basis pion sekaligus membatasi ruang gerak raja {lawan}.",
    ],
    pionBebas: [
      "Kemajuan pion bebas ke {petak} lewat {san} menciptakan ancaman promosi jangka panjang yang mengikat {lawan}.",
      "Pion bebas {pihak} di {petak} kian bernilai strategis seiring berkurangnya perwira di papan.",
    ],
    profilaksisSayap: [
      "{san} berfungsi sebagai langkah profilaksis untuk membatasi akses perwira lawan di petak sayap.",
      "Langkah pencegahan {san} mengamankan petak lompatan di sayap sekaligus membuka ruang bagi raja.",
    ],
    menteriDini: [
      "Aktivasi menteri lebih awal ke {petak} lewat {san} berisiko memberi target pengembangan bagi perwira {lawan}.",
      "{san} membawa menteri keluar pada fase pembukaan; ketepatan perhitungan tempo menjadi krusial.",
    ],
    kembangPerwira: [
      "{pihak} mengembangkan {bidak} menuju {petak}, mempercepat mobilisasi perwira di fase pembukaan.",
      "Langkah pengembangan sehat {san}: {bidak} {pihak} berpartisipasi aktif dalam perebutan pusat.",
      "{san} melanjutkan pembangunan posisi {pihak} sesuai prinsip pengembangan klasik.",
    ],
    rajaAktifAkhir: [
      "Memasuki babak akhir, raja {pihak} diaktifkan menuju {petak} untuk mendukung struktur pion.",
      "Sentralisasi raja lewat {san} sejalan dengan kaidah teknik babak akhir tanpa menteri.",
    ],
    skak: [
      "Skak lewat {san}; {pihak} memaksa {lawan} segera mengamankan rajanya.",
      "{pihak} melancarkan skak yang membatasi pilihan balasan {lawan} pada giliran ini.",
      "Ancaman langsung terhadap raja melalui {san} memberi tempo penting bagi {pihak}.",
    ],
    skakTambahan: [
      "Manuver ini disertai tempo skak, sehingga {lawan} wajib menanggapi ancaman terhadap rajanya lebih dulu.",
      "Selain dampak utamanya, langkah ini sekaligus memberikan skak.",
    ],
    skakSatuJalan: [
      "Hanya tersedia satu respons sah bagi {lawan} untuk keluar dari skak.",
    ],
    rokadePendek: [
      "{pihak} melaksanakan rokade sayap raja, mengamankan raja sekaligus mengaktifkan benteng.",
      "Rokade pendek oleh {pihak}; raja kini terlindung dan benteng siap dihubungkan.",
    ],
    rokadePanjang: [
      "{pihak} melakukan rokade sayap menteri, menempatkan benteng langsung di lajur pusat.",
      "Rokade panjang dipilih {pihak}, membuka prospek pertarungan tajam dengan raja di sayap berlawanan.",
    ],
    enPassant: [
      "{pihak} mengeksekusi penangkapan en passant di {petak} untuk membongkar penjagaan pion lawan.",
      "Aturan en passant dimanfaatkan secara tepat oleh {pihak} lewat {san}.",
    ],
    promosi: [
      "Pion {pihak} menuntaskan perjalanannya di {petak} dan berpromosi menjadi {bidak}.",
      "Promosi di {petak}: {pihak} menghadirkan {bidak} baru yang mengubah imbangan materi.",
    ],
    lawanMenggantung: [
      "Catatan taktis: perwira {lawan} di {petak} berada tanpa perlindungan memadai.",
      "Kelemahan taktis terlihat pada {petak}, tempat perwira {lawan} berdiri tanpa penjaga.",
    ],
    sendiriMenggantung: [
      "Kewaspadaan diperlukan: {bidak} {pihak} di {petak} tertinggal tanpa penjagaan.",
      "Penempatan {bidak} {pihak} di {petak} menyisakan sasaran taktis bagi {lawan}.",
    ],
    paksa: [
      "Langkah tunggal yang sah pada posisi ini; {pihak} tidak memiliki alternatif lain.",
      "Respons paksa — seluruh pilihan lain tertutup oleh tuntutan aturan papan.",
    ],
    nilaiBrilian: [
      "Langkah brilian! {san} menampilkan pengorbanan jauh ke depan yang sepenuhnya teruji secara analitis.",
      "Temuan taktis kelas utama lewat {san}; materi dikorbankan demi inisiatif penentu.",
      "Konsep luar biasa dari {pihak}: {san} meruntuhkan koordinasi pertahanan lawan secara paksa.",
    ],
    nilaiHebat: [
      "Keputusan sangat kuat pada momen kritis; {san} menjaga keunggulan dengan presisi tinggi.",
      "{pihak} menemukan satu-satunya jalur paling menekan melalui {san}.",
      "Akurasi tinggi dari {pihak} — {san} memaksimalkan tuntutan konkret posisi.",
    ],
    nilaiTerbaik: [
      "{san} merupakan rekomendasi utama mesin analisis pada posisi ini.",
      "Pilihan paling presisi; {pihak} mengeksekusi lanjutan terbaik lewat {san}.",
      "Langkah optimal yang menjaga seluruh nilai tambah posisi {pihak}.",
    ],
    nilaiUnggul: [
      "Langkah kuat yang merawat keunggulan posisi {pihak} tanpa konsesi.",
      "{san} mempertahankan kendali permainan dengan sangat disiplin.",
      "Lanjutan sehat dan akurat dari {pihak} untuk menjaga inisiatif.",
    ],
    nilaiLayak: [
      "Alternatif yang dapat dimainkan; keseimbangan posisi tetap terjaga walau bukan jalur paling tajam.",
      "{san} memenuhi tuntutan dasar posisi tanpa menimbulkan kelemahan serius.",
      "Langkah praktis yang wajar meski tersedia opsi yang sedikit lebih mengikat.",
    ],
    nilaiKeliru: [
      "Ketidaktepatan tipis lewat {san}; sebagian inisiatif {pihak} memudar.",
      "Penyimpangan kecil dari jalur terkuat yang memberi ruang konsolidasi bagi {lawan}.",
      "{san} kurang menekan sehingga {lawan} memperoleh kemudahan penataan ulang.",
    ],
    nilaiKesalahan: [
      "Kesalahan posisional maupun taktis lewat {san}; evaluasi bergeser memihak {lawan}.",
      "{san} melemahkan bangunan pertahanan {pihak} dan mengundang aksi balasan lawan.",
      "Keputusan kurang tepat pada momen penting yang menyerahkan inisiatif kepada {lawan}.",
    ],
    nilaiKelewat: [
      "Peluang taktis penentu terlewatkan; {san} belum menghukum kelemahan lawan secara maksimal.",
      "Tersedia lanjutan yang jauh lebih memaksa yang gagal dimanfaatkan {pihak}.",
      "Kesempatan mengonversi keunggulan terabaikan pada giliran ini.",
    ],
    nilaiBlunder: [
      "Blunder serius lewat {san} yang membalikkan penilaian posisi secara tajam.",
      "Kesalahan berat dari {pihak}; {san} mengakibatkan kerugian materi atau serangan penentu.",
      "Keruntuhan koordinasi akibat {san} menempatkan {pihak} dalam situasi kritis.",
    ],
    lebihKuat: [
      "Lanjutan yang lebih kuat menurut analisis adalah {saran}.",
      "Mesin menunjukkan {saran} sebagai jalur yang lebih akurat.",
    ],
    seimbang: [
      "Posisi berada dalam keseimbangan objektif; kedua kubu memiliki peluang setara.",
      "Evaluasi menunjukkan kesetaraan; belum ada pihak yang mengantongi keunggulan nyata.",
      "Keseimbangan strategis terjaga, menuntut ketelitian manuver dari kedua pemain.",
    ],
    unggulTipis: [
      "{unggul} memegang keunggulan tipis (+{nilai}) berkat keaktifan perwira yang sedikit lebih baik.",
      "Inisiatif ringan berada di pihak {unggul} dengan taksiran +{nilai}.",
    ],
    unggulJelas: [
      "{unggul} mengantongi keunggulan jelas (+{nilai}) dan mengendalikan sektor kunci papan.",
      "Penilaian posisi memihak tegas kepada {unggul} pada kisaran +{nilai}.",
    ],
    unggulMenang: [
      "{unggul} mencapai posisi menang secara teknis (+{nilai}).",
      "Keunggulan penentu bagi {unggul} (+{nilai}); realisasi kemenangan tinggal menuntut ketelitian.",
    ],
    unggulMat: [
      "Terdeteksi rangkaian skakmat paksa dalam {mat} langkah untuk {unggul}.",
      "Kalkulasi mengonfirmasi mat paksa dalam {mat} langkah bagi kemenangan {unggul}.",
    ],
    skakmat: [
      "Skakmat lewat {san}. Partai tuntas untuk kemenangan {pihak}.",
      "Skakmat — raja {lawan} tak lagi memiliki jalan keluar yang sah.",
      "Penutup tuntas oleh {pihak}: {san} mengakhiri perlawanan {lawan}.",
    ],
    pat: [
      "Pat (stalemate): tiada langkah sah tanpa ancaman skak, sehingga partai berakhir remis.",
      "Kedudukan berakhir pat; hasil imbang ditetapkan sesuai aturan catur.",
    ],
    remis: [
      "Partai dinyatakan berakhir remis.",
      "Pertarungan ditutup dengan hasil imbang.",
    ],
    remisUlang: [
      "Remis ditetapkan berdasarkan pengulangan posisi tiga kali.",
      "Kedudukan identik terulang tiga kali; partai resmi berakhir imbang.",
    ],
    remisMaterial: [
      "Remis karena materi yang tersisa tidak mencukupi untuk memaksakan skakmat.",
      "Keterbatasan materi di atas papan membuat skakmat mustahil dicapai; remis.",
    ],
    ajakEngine: [
      "Nyalakan mesin analisis untuk memeriksa evaluasi mendalam serta variasi utama.",
      "Aktifkan modul engine bila memerlukan verifikasi taktis dan penilaian objektif.",
    ],
    awan: [
      "Basis data awan mencatat {awan} sebagai pilihan utama (evaluasi {nilai}).",
      "Referensi teori awan mengunggulkan langkah {awan} dengan nilai {nilai}.",
    ],
    fork: [
      "Serangan ganda oleh {bidak} {pihak} di {petak} mengancam dua perwira {lawan} sekaligus.",
      "Motif garpuan di {petak}: {lawan} tidak dapat menyelamatkan kedua sasaran secara bersamaan.",
      "{pihak} melancarkan garpuan dari {petak} yang memaksa kerugian materi bagi {lawan}.",
    ],
    skakBayangan: [
      "Skak terbuka: perpindahan {bidak} {pihak} membuka garis serangan langsung ke raja {lawan}.",
      "Taktik skak bayangan lewat {san} memaksa {lawan} menghadapi ancaman ganda.",
    ],
    terpaku: [
      "Perwira {lawan} di {petak} terikat pin terhadap rajanya sehingga kehilangan daya gerak.",
      "Ikatan taktis pada {petak} melumpuhkan perwira penjaga milik {lawan}.",
    ],
    seimbangDinamis: [
      "Kedudukan seimbang secara dinamis; keunggulan ruang dan aktivitas saling mengimbangi.",
      "Posisi menawarkan peluang timbal balik yang setara bagi {pihak} maupun {lawan}.",
      "Keseimbangan babak tengah terjaga; ketepatan rencana akan membedakan hasil akhir.",
      "Tak ada kelemahan struktural berarti di kedua kubu — pertarungan masih terbuka lebar.",
    ],
    unggulStruktur: [
      "{pihak} memiliki struktur pion yang lebih utuh, sedangkan kubu {lawan} dibebani kelemahan jangka panjang.",
      "Kendali ruang dan kesehatan rantai pion memberi modal strategis jangka panjang bagi {pihak}.",
    ],
    posisiTajam: [
      "Kedudukan memasuki komplikasi tajam; ketepatan kalkulasi konkret menjadi penentu mutlak.",
      "Ketegangan taktis memuncak di papan — setiap kesalahan kecil dapat berujung fatal.",
    ],
  },

  genZ: {
    biasa: [
      "{pihak} main {san} — rapihin barisan dulu sambil ngintip celah di pertahanan {lawan}.",
      "{san} dari {pihak}. Langkah kalem tapi terukur buat ngunci petak sekitar {petak}.",
      "{bidak} geser ke {petak}. Belum buka war, masih bangun koordinasi yang rapi.",
      "{san}. {pihak} jaga tempo tetap adem sambil nunggu {lawan} salah langkah.",
    ],
    buku: [
      "{san} masih murni jalur teori {pembukaan}. Hafalan pembukaan jalan mulus!",
      "Masuk skema {pembukaan} lewat {san} — dua-duanya masih main rapi sesuai buku.",
      "{san}, langkah klasik di {pembukaan}. Pertarungan aslinya baru mau dimulai!",
    ],
    tangkap: [
      "{pihak} sikat {korban} di {petak} lewat {san}! Papan langsung mulai kebuka.",
      "Tukar di {petak}! {pihak} ambil {korban} dan bikin {lawan} harus mikir ulang.",
      "{san} — {korban} di {petak} langsung diangkut, ritme permainan berubah.",
    ],
    tangkapUntung: [
      "Cuan bersih! {pihak} dapet {korban} di {petak} dengan modal jauh lebih kecil.",
      "{san}! Panen materi buat {pihak} di {petak}, pertahanan {lawan} kecolongan!",
    ],
    tangkapMenteri: [
      "MENTERI TUMBANG! {pihak} sikat menteri lawan di {petak} lewat {san}!",
      "{san}! Menteri {lawan} jatuh di {petak} — ini sih berat banget buat dibalikin!",
    ],
    tukarMenteri: [
      "Adu menteri di {petak}! Lewat {san}, {pihak} ajak masuk endgame adu teknik murni.",
      "{san} ngajak tukar menteri di {petak} — drama serangan reda, sekarang tinggal adu rapi!",
    ],
    tukarGajahKuda: [
      "{pihak} tukar gajah sama kuda di {petak} lewat {san}, incar struktur pion {lawan} biar rusak.",
      "{san} — gajah dilepas buat sikat kuda di {petak} demi ngambil tempo permainan.",
    ],
    fianchetto: [
      "Fianchetto rapi di {petak}! Gajah {pihak} siap nembak diagonal panjang dari jauh.",
      "{san} — gajah nongkrong manis di {petak}, ngawasin pusat diam-diam.",
    ],
    dobrakPusat: [
      "Dobrak pusat lewat {san}! {pihak} langsung goyang rantai pion {lawan}.",
      "{san}! Pion {pihak} maju nantang pusat biar jalur serangan cepet kebuka.",
    ],
    kudaPosTerdepan: [
      "Kuda {pihak} parkir cantik di pos terdepan {petak}! Dijaga pion dan susah banget diusir.",
      "{san} — kuda nangkring gagah di {petak}, bikin sesak pertahanan {lawan}!",
    ],
    bentengLajurTerbuka: [
      "Benteng {pihak} geser ke {petak} lewat {san}, langsung kuasai jalan tol lajur terbuka!",
      "{san} — lajur kosong langsung diklaim benteng {pihak} dari {petak}.",
    ],
    bentengBarisTujuh: [
      "Benteng {pihak} tembus ke {petak}! Masuk baris pertahanan lawan, pion-pion langsung gemetar.",
      "{san}! Benteng mendarat di jantung baris ketujuh — tamu paling nyebelin buat {lawan}.",
    ],
    pionBebas: [
      "Pion bebas {pihak} ngegas ke {petak}! Makin dekat kotak promosi, makin bikin panik {lawan}.",
      "{san} — pion bebas di {petak} mulai jalan terus dan mengikat perwira lawan.",
    ],
    profilaksisSayap: [
      "{san} — langkah jaga-jaga cerdas dari {pihak}, tutup petak loncatan lawan sekalian kasih napas buat raja.",
      "Sentuhan rapi {san}: kunci sayap dulu sebelum {pihak} lanjut gas rencana utama.",
    ],
    menteriDini: [
      "Menteri {pihak} udah nongol duluan ke {petak} lewat {san} — berani, tapi awas dikejar-kejar perwira lawan!",
      "{san} keluarin menteri cepat banget; jangan sampai malah rugi tempo pengembangan.",
    ],
    kembangPerwira: [
      "{pihak} keluarin {bidak} ke {petak} lewat {san} — pengembangan cepat dan sehat!",
      "{san} bikin {bidak} {pihak} langsung aktif ngincer pusat papan.",
      "Setup rapi lewat {san}: satu per satu perwira {pihak} turun ke medan tempur.",
    ],
    rajaAktifAkhir: [
      "Menteri udah nggak ada, saatnya raja {pihak} turun tangan sendiri ke {petak} lewat {san}!",
      "{san} — mode endgame aktif, raja {pihak} maju bantu kawal pertarungan di tengah.",
    ],
    skak: [
      "Skak lewat {san}! Raja {lawan} dipaksa gerak sekarang juga.",
      "{san}! Tempo langsung direbut {pihak}, pertahanan {lawan} digoyang.",
      "Skak masuk! Raja {lawan} nggak bisa santai lagi di posisinya.",
    ],
    skakTambahan: [
      "Bonus skak sekalian! {lawan} dipaksa beresin urusan rajanya dulu.",
      "Datang bareng skak — {lawan} kena dua PR sekaligus!",
    ],
    skakSatuJalan: [
      "Cuma tersisa satu petak sah buat {lawan} — benar-benar kepepet!",
    ],
    rokadePendek: [
      "{pihak} rokade pendek — raja masuk tempat aman, benteng siap tempur.",
      "Rokade sayap raja beres! Raja {pihak} udah rapi di balik kawalan pion.",
    ],
    rokadePanjang: [
      "{pihak} rokade panjang! Tanda-tanda bakal adu serang habis-habisan nih.",
      "Rokade sayap menteri dipilih {pihak} — papan siap memanas!",
    ],
    enPassant: [
      "En passant {san}! Trik klasik yang nggak pernah gagal bikin kaget.",
      "{pihak} sikat pion lewat en passant di {petak} — tajam dan sah!",
    ],
    promosi: [
      "PROMOSI! Pion {pihak} resmi naik kasta jadi {bidak} di {petak}!",
      "Tembus garis akhir! Pion {pihak} berubah jadi {bidak} baru di {petak}!",
    ],
    lawanMenggantung: [
      "Lirik petak {petak} deh — perwira {lawan} di sana lagi bengong tanpa pengawal!",
      "Ada bidak {lawan} nganggur tanpa penjaga di {petak}, rawan banget kesikat.",
    ],
    sendiriMenggantung: [
      "Waspada! {bidak} {pihak} di {petak} lagi berdiri tanpa kawalan.",
      "Awas bocor di {petak} — {bidak} {pihak} rawan dicuri balik sama {lawan}.",
    ],
    paksa: [
      "Langkah paksa — cuma ada satu jalan sah di posisi ini.",
      "Nggak ada opsi lain, papan memaksa {pihak} main langkah ini.",
    ],
    nilaiBrilian: [
      "BRILIAN! {san} itu pengorbanan kelas grandmaster yang bikin papan meledak!",
      "Gokil tajamnya! {pihak} nemu {san} yang ngorbanin materi demi serangan mematikan!",
      "Langkah mahakarya lewat {san}! Perhitungan {pihak} bener-bener di luar dugaan.",
    ],
    nilaiHebat: [
      "Langkah berkelas! {san} tepat mengunci titik paling lemah lawan.",
      "Tajam banget — {pihak} nemu satu-satunya jalur paling menekan lewat {san}!",
      "Presisi tinggi! {pihak} mainin {san} tanpa kasih napas sedikit pun.",
    ],
    nilaiTerbaik: [
      "Akurat penuh! {san} persis pilihan nomor satu dari engine.",
      "Pas di sasaran — {san} memang jawaban paling kuat di posisi ini.",
      "Nggak ada yang ngalahin {san} di momen ini, rapi banget dari {pihak}.",
    ],
    nilaiUnggul: [
      "Kuat dan rapi. {san} bikin posisi {pihak} makin enak dimainkan.",
      "Solid banget! {pihak} jaga kendali penuh lewat {san}.",
      "Pilihan matang — {san} merawat keunggulan {pihak} tanpa drama.",
    ],
    nilaiLayak: [
      "Cukup aman. {san} tetap jalan walau ada opsi lain yang lebih galak.",
      "Masih oke banget — posisi {pihak} tetap terjaga lewat {san}.",
      "Langkah praktis dari {pihak}, nggak bikin masalah baru.",
    ],
    nilaiKeliru: [
      "Agak meleset dikit — {san} kasih ruang napas buat {lawan}.",
      "Kurang menggigit di momen ini, tekanan {pihak} jadi sedikit kendor.",
      "Hampir pas, tapi {san} ngelepas sebagian inisiatif.",
    ],
    nilaiKesalahan: [
      "Kesalahan nih! {san} bikin kendali permainan mulai pindah ke {lawan}.",
      "Posisi {pihak} mulai bocor gara-gara {san}, {lawan} dapet celah serang.",
      "Kurang teliti lewat {san} — sekarang {pihak} malah harus sibuk bertahan.",
    ],
    nilaiKelewat: [
      "Sayang banget! Ada pukulan taktis emas yang kelewat ketimbang {san}.",
      "Kesempatan menang cepat lewat gitu aja — {lawan} masih dikasih selamat.",
      "Jalur paling mematikan nggak keambil sama {pihak} di giliran ini.",
    ],
    nilaiBlunder: [
      "BLUNDER BERAT! {san} langsung ngeruntuhin bangunan pertahanan {pihak}!",
      "Fatal banget! Gara-gara {san}, evaluasi langsung berbalik ke {lawan}.",
      "Kepleset parah di momen penting — {san} ngasih keuntungan gratis buat {lawan}!",
    ],
    lebihKuat: [
      "Padahal kalau jeli, {saran} jauh lebih menggigit di sini.",
      "Saran terkuat engine tadi sebenarnya {saran}.",
    ],
    seimbang: [
      "Posisi masih imbang ketat — siapa paling teliti, dia yang bakal pegang kendali.",
      "Sama kuat! Semua rencana masih terbuka lebar buat kedua kubu.",
      "Belum ada yang unggul jauh, tinggal adu sabar dan akurasi.",
    ],
    unggulTipis: [
      "{unggul} unggul tipis (+{nilai}) dan mulai enak ngatur tempo.",
      "Sedikit di atas angin buat {unggul} (+{nilai}), tapi pertarungan masih panjang.",
    ],
    unggulJelas: [
      "{unggul} pegang kendali jelas (+{nilai}) — ruang gerak lawan makin sempit.",
      "Dominasi mulai kerasa buat {unggul} (+{nilai}), perwiranya jauh lebih hidup.",
    ],
    unggulMenang: [
      "{unggul} udah unggul telak (+{nilai}), tinggal eksekusi rapi sampai tuntas.",
      "Keunggulan +{nilai} di tangan {unggul} — asal nggak blunder, kemenangan di depan mata.",
    ],
    unggulMat: [
      "Jalur mat paksa kebaca! {unggul} kunci kemenangan dalam {mat} langkah.",
      "Mat dalam {mat} langkah buat {unggul} — udah nggak ada jalan kabur lagi!",
    ],
    skakmat: [
      "SKAKMAT! Lewat {san}, {pihak} nutup partai dengan sangat bersih!",
      "Tuntas sudah! Raja {lawan} terkunci rapat, kemenangan mutlak buat {pihak}!",
      "Mat murni lewat {san}! Nggak tersisa satu petak kabur pun buat lawan.",
    ],
    pat: [
      "Pat! Raja aman tapi langkah legal habis total — otomatis remis!",
      "Kejebak pat! Nggak bisa gerak tapi nggak diskak, bagi poin deh.",
    ],
    remis: [
      "Partai tutup imbang setelah duel yang alot.",
      "Hasil remis — kedua kubu sama-sama kokoh sampai akhir.",
    ],
    remisUlang: [
      "Posisi diulang tiga kali berturut-turut — resmi remis!",
      "Tiga kali posisi kembar muncul di papan, partai langsung remis.",
    ],
    remisMaterial: [
      "Sisa bidak di papan udah nggak cukup buat maksa mat — remis otomatis.",
      "Materi tinggal tipis banget, nggak mungkin skakmat. Remis!",
    ],
    ajakEngine: [
      "Coba nyalain engine biar kelihatan skor akurat dan jalur taktis tersembunyinya!",
      "Penasaran langkah paling tajam menurut mesin? Aktifkan engine analisis sekarang.",
    ],
    awan: [
      "Catatan cloud nunjukkin {awan} sebagai opsi favorit (skor {nilai}).",
      "Referensi basis data awan: langkah {awan} dinilai {nilai}.",
    ],
    fork: [
      "GARPUAN TAJAM! {bidak} {pihak} di {petak} ngincer dua sasaran sekaligus!",
      "Serangan ganda dari {petak}! {lawan} nggak bakal sempat nyelamatin dua-duanya.",
      "{pihak} pasang garpuan maut di {petak} — satu perwira {lawan} pasti lepas!",
    ],
    skakBayangan: [
      "Skak terbuka! {bidak} {pihak} minggir dan garis tembak langsung kebuka ke raja {lawan}!",
      "Ancaman berlapis lewat {san}: perwira bergeser, skak tersembunyi langsung nyala!",
    ],
    terpaku: [
      "Perwira {lawan} di {petak} kena pin — gerak dikit aja rajanya langsung kebuka!",
      "Terkunci rapat di {petak}! Pin ini bikin perwira {lawan} mati gaya.",
    ],
    seimbangDinamis: [
      "Imbang tapi hidup banget — dua kubu sama-sama punya senjata aktif di papan.",
      "Skor setara, tapi posisi masih penuh jebakan dan ide segar buat kedua sisi.",
      "Struktur sama keaktifan perwira saling imbang; akurasi di babak tengah bakal jadi pembeda.",
      "Belum ada celah besar di dua sisi — adu manuver masih seru banget!",
    ],
    unggulStruktur: [
      "{pihak} menang struktur pion jangka panjang, sementara kubu {lawan} punya banyak petak lemah.",
      "Materi sih imbang, tapi ruang gerak dan rapi-nya pion jelas memihak {pihak}.",
    ],
    posisiTajam: [
      "Papan lagi panas banget! Salah hitung satu langkah aja evaluasi bisa langsung jungkir balik.",
      "Masuk jalur taktis beracun — sekarang waktunya kalkulasi ekstra teliti!",
    ],
  },
};

/** komentator untuk halaman Teka-Teki — dinamis & suportif */
export const komentatorTekaTeki = {
  santai: {
    mulaiSatu: [
      "Teka-teki baru! {pihak} melangkah dan menemukan skakmat dalam 1 langkah. Temukan eksekusinya!",
      "Soal baru! {pihak} jalan dan langsung skakmat dalam 1 langkah. Cari pukulan penutupnya!",
    ],
    mulai: [
      "Teka-teki baru: {pihak} melangkah, skakmat dalam {n} langkah. Fokus pada skak dan pengorbanan kunci.",
      "Mat dalam {n} dimulai dari {pihak}. Susun urutan langkah paksa dulu.",
      "{pihak} jalan dan butuh {n} langkah untuk mat. Perhatikan petak pelarian raja lawan.",
    ],
    mulaiSudah: [
      "Teka-teki ini sudah pernah dipecahkan sebelumnya. Uji ketajaman pola kamu lagi!",
    ],
    benar: [
      "Tepat sekali! Lawan terpaksa merespons...",
      "Pas! Sekarang giliran {lawan} mencari pertahanan.",
      "Benar. Jalur taktisnya mulai terbuka.",
    ],
    lawan: [
      "Lawan membalas. Tersisa {sisa} langkah taktis menuju mat!",
      "{lawan} merespons. Tinggal {sisa} langkah lagi sampai mat.",
    ],
    lawanTerakhir: [
      "Lawan kehabisan opsi. Cari langkah penutup untuk skakmat!",
      "Balasan lawan sudah maksimal. Sisa satu langkah penutup.",
    ],
    salah: [
      "Belum tepat. Cari langkah yang lebih memaksa agar lawan tidak memiliki jawaban pertahanan.",
      "Masih ada ruang bagi lawan bernapas. Cari langkah yang lebih mengunci.",
      "Bukan itu. Utamakan skak atau ancaman yang tidak bisa dielakkan.",
    ],
    salahSkak: [
      "Sudah skak, namun raja {lawan} masih memiliki {jalan} jalan kabur. Persempit lagi!",
      "Skak yang bagus, tapi raja lawan masih memiliki {jalan} petak pelarian. Cari skak yang mengunci rapat!",
    ],
    salahTangkap: [
      "Menangkap {korban} memang menguntungkan, tapi target utama kita di sini adalah raja lawan!",
      "Ambil {korban} bisa, tapi skakmat tetap yang dicari.",
    ],
    salahTerakhir: [
      "Langkah penutup harus langsung menyegel skakmat, bukan sekadar skak biasa.",
      "Ini langkah terakhir — harus mat, bukan cuma memberi skak.",
    ],
    ilegal: [
      "Langkah tidak sah! Periksa apakah raja kamu sedang diskak atau perwira terikat (pin).",
      "Gerakan itu tidak diizinkan. Pastikan rajamu aman dan tidak sedang terikat.",
    ],
    petunjuk: [
      "Petunjuk taktis: Fokuskan perhatian pada {bidak} di petak {dari}.",
      "Mulailah dari {bidak} di {dari} — dari sana serangan bisa dibangun.",
    ],
    pengorbanan: [
      "Pengorbanan cantik! {bidak} di {petak} diumpankan untuk membongkar pertahanan raja lawan!",
      "Pengorbanan berani! {bidak} di {petak} sengaja dikorbankan agar benteng pertahanan raja jebol.",
    ],
    selesai: [
      "Luar biasa! Teka-teki berhasil dipecahkan dengan skakmat sempurna!",
      "Sempurna! Semua langkah paksa tereksekusi sampai skakmat.",
      "Tuntas! Pola skakmatnya dieksekusi tanpa cela.",
    ],
    selesaiTema: [
      "Pola taktis utama: {tema}. Ingat pola ini untuk permainan nyata!",
      "Pola yang dipakai: {tema}. Catat, nanti sering muncul.",
    ],
    tinjau: [
      "Tinjauan taktis — Langkah {nomor}. Perhatikan bagaimana setiap ruang gerak lawan dikunci rapat.",
      "Langkah {nomor}: lihat mengapa lawan tidak punya jawaban lain.",
    ],
    engineMat: [
      "Mesin mengonfirmasi: Kombinasi mat dalam {mat} langkah terverifikasi.",
      "Verifikasi mesin: rangkaian mat {mat} langkah ini memang sah.",
    ],
  },
  formal: {
    mulaiSatu: [
      "Modul Taktis: {pihak} melangkah. Eksekusi skakmat dalam 1 langkah.",
      "Modul Taktis: {pihak} melangkah. Tentukan satu langkah skakmat.",
    ],
    mulai: [
      "Modul Taktis: {pihak} melangkah. Cari skakmat paksa dalam {n} langkah.",
      "Tugas: {pihak} melangkah dan memaksa skakmat dalam {n} langkah.",
      "Kalkulasi {n} langkah dimulai dari {pihak}. Utamakan langkah yang membatasi respons lawan.",
    ],
    mulaiSudah: [
      "Catatan menunjukkan teka-teki ini telah diselesaikan sebelumnya.",
    ],
    benar: [
      "Langkah terverifikasi benar. Menunggu respons lawan.",
      "Kalkulasi tepat. Selanjutnya mengamati respons {lawan}.",
      "Eksekusi akurat. Variasi balasan lawan kini dijalankan.",
    ],
    lawan: [
      "Respons lawan diterima. Tersisa {sisa} langkah eksekusi.",
      "{lawan} merespons sesuai variasi. Tersisa {sisa} langkah hingga skakmat.",
    ],
    lawanTerakhir: [
      "Fase penutup: tentukan langkah akhir skakmat.",
      "Respons lawan telah maksimal. Satu langkah penutup diperlukan.",
    ],
    salah: [
      "Langkah kurang tepat. Variasi ini memberikan ruang pertahanan bagi lawan.",
      "Variasi ini tidak memaksa; {lawan} memperoleh alternatif pertahanan.",
      "Kalkulasi tidak mengarah pada skakmat. Pertimbangkan langkah yang lebih membatasi.",
    ],
    salahSkak: [
      "Skak terdeteksi, namun raja lawan masih memiliki {jalan} akses petak pelarian.",
      "Skak sah, tetapi {jalan} petak pelarian masih terbuka bagi raja lawan.",
    ],
    salahTangkap: [
      "Keuntungan materi {korban} bersifat sekunder; prioritas utama adalah skakmat.",
      "Penangkapan {korban} tidak berkontribusi pada rangkaian skakmat.",
    ],
    salahTerakhir: [
      "Langkah akhir wajib menghasilkan skakmat tuntas.",
      "Pada langkah penutup, skak biasa belum mencukupi.",
    ],
    ilegal: [
      "Langkah tidak sah menurut aturan catur.",
      "Gerakan ditolak karena melanggar legalitas langkah.",
    ],
    petunjuk: [
      "Petunjuk kalkulasi: perhatikan {bidak} pada petak {dari}.",
      "Titik awal kombinasi berada pada {bidak} di petak {dari}.",
    ],
    pengorbanan: [
      "Pengorbanan perwira: {bidak} di {petak} diserahkan untuk membongkar struktur pertahanan raja.",
      "Dengan terukur {bidak} di {petak} dikorbankan guna membuka jalur menuju raja lawan.",
    ],
    selesai: [
      "Teka-teki selesai. Kombinasi taktis terverifikasi.",
      "Tuntas. Rangkaian skakmat paksa berhasil dijalankan.",
      "Selesai. Seluruh variasi kunci telah dipecahkan dengan tepat.",
    ],
    selesaiTema: [
      "Motif taktis utama: {tema}.",
      "Pola taktis yang teridentifikasi: {tema}.",
    ],
    tinjau: [
      "Tinjauan solusi — Langkah {nomor}.",
      "Langkah {nomor}: amati setiap pembatasan petak pelarian lawan.",
    ],
    engineMat: [
      "Verifikasi mesin analisis: mat dalam {mat} langkah.",
      "Mesin mengonfirmasi skakmat paksa dalam {mat} langkah.",
    ],
  },
  genZ: {
    mulaiSatu: [
      "Puzzle baru! {pihak} jalan dan kunci mat 1 langkah. Temukan sekarang!",
      "Puzzle baru: {pihak} jalan, mat 1 langkah. Satu gerakan penutup!",
    ],
    mulai: [
      "Puzzle baru: {pihak} jalan, mat dalam {n} langkah. Fokus kunci petak kabur lawan!",
      "Mat dalam {n}. {pihak} mulai — cari skak yang bikin lawan mentok!",
      "{pihak} jalan, {n} langkah menuju mat. Petak kabur raja lawan tutup dulu!",
    ],
    mulaiSudah: [
      "Puzzle ini udah pernah kamu selesaikan. Coba tes ketajaman lagi!",
    ],
    benar: [
      "Rapi banget! Lawan terpaksa merespons...",
      "Pas! Sekarang {lawan} cari jalan keluar.",
      "Mantap! Garis matnya mulai kebuka.",
    ],
    lawan: [
      "Lawan membalas. Tinggal {sisa} langkah lagi menuju mat!",
      "{lawan} merespons. Sisa {sisa} langkah buat nutup partai.",
    ],
    lawanTerakhir: [
      "Lawan udah kehabisan petak. Kasih skakmat penutup!",
      "Nggak ada opsi buat lawan. Kasih mat penutup!",
    ],
    salah: [
      "Masih kurang tajam. Lawan masih bisa lolos dari jalur ini.",
      "Belum rapat. Lawan masih punya ruang buat bertahan.",
      "Bukan itu. Cari skak atau ancaman yang bikin lawan nggak bisa milih.",
    ],
    salahSkak: [
      "Skak sih, tapi raja lawan masih punya {jalan} petak kabur. Cari yang rapat!",
      "Skak oke, tapi masih ada {jalan} petak kabur. Tutup semuanya!",
    ],
    salahTangkap: [
      "Ambil {korban} emang menggiurkan, tapi fokus utamanya raja lawan!",
      "Makan {korban} sih cuan, tapi yang dicari skakmat.",
    ],
    salahTerakhir: [
      "Langkah terakhir wajib mat murni, bukan sekadar skak!",
      "Penutup harus mat. Skak doang nggak cukup!",
    ],
    ilegal: [
      "Langkah tidak sah! Raja kamu mungkin lagi kena skak atau perwira terikat.",
      "Nggak bisa gerak ke situ. Cek apakah rajamu aman dari skak.",
    ],
    petunjuk: [
      "Petunjuk: kuncinya ada pada {bidak} di petak {dari}.",
      "Mulai dari {bidak} di {dari}. Dari situ pola matnya kebuka.",
    ],
    pengorbanan: [
      "Pengorbanan berkelas! {bidak} di {petak} dilepas buat ngebuka raja lawan!",
      "Sengaja {bidak} di {petak} diumpankan buat bongkar benteng raja lawan.",
    ],
    selesai: [
      "Tuntas! Puzzle selesai dengan skakmat sempurna!",
      "Beres! Semua langkah paksa jalan sampai mat.",
      "Sempurna! Skakmatnya dieksekusi rapi tanpa cela.",
    ],
    selesaiTema: [
      "Pola taktiknya: {tema}. Simpan di ingatan buat partai berikutnya!",
      "Pola yang kepakai: {tema}. Ingat baik-baik, ini sering muncul.",
    ],
    tinjau: [
      "Tinjau solusi — Langkah {nomor}. Lihat gimana petak kaburnya dikunci.",
      "Langkah {nomor}: perhatikan kenapa lawan nggak punya jawaban.",
    ],
    engineMat: [
      "Konfirmasi engine: mat {mat} langkah terverifikasi.",
      "Engine konfirmasi mat {mat} langkah. Akurat!",
    ],
  },
};
