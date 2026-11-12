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
  keterangan: "Ulasan langsung berbasis dinamika posisi, pola pembukaan, dan evaluasi mesin.",
  bicaraSaatLangkah: "Berbicara saat bidak melangkah.",
  tidakDitampilkan: "Tidak ditampilkan",
  nyalakan: "Nyalakan komentator",
  matikan: "Matikan komentator",
  gayaLabel: "Gaya Narasi",
  gayaSantai: "Pelatih Klub",
  gayaFormal: "Klasik Grandmaster",
  gayaGenZ: "Siaran Cepat",
  menunggu: "Menunggu langkah pembuka...",
  posisiAwal: "Papan siap. Putih memegang langkah pertama.",
  menilai: "Menelusuri jalur utama...",
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
      "{san} — gajah bersarang di {petak} untuk menekan petak pusat dari jarak jauh.",
      "Lewat {san}, gajah {pihak} mengambil jalur fianchetto di {petak} dan menyinari diagonal panjang.",
    ],
    dobrakPusat: [
      "Dobrakan pion {san}! {pihak} langsung menantang rantai pion pusat {lawan} agar lajur segera terbuka.",
      "{pihak} mendorong {san}, menggoyang tumpuan pusat {lawan} dan memperebutkan inisiatif.",
      "Tantangan pusat lewat {san}: {pihak} memaksa {lawan} mengambil keputusan atas ketegangan pion.",
    ],
    kudaPosTerdepan: [
      "Kuda {pihak} mendarat mantap di pos terdepan {petak}! Dijaga pion sendiri dan sulit diusir {lawan}.",
      "{san} menancapkan kuda di {petak} — pijakan ideal yang menekan jantung pertahanan {lawan}.",
      "Pos terdepan kuat di {petak}! Lewat {san}, kuda {pihak} mencengkeram petak penting di wilayah lawan.",
    ],
    bentengLajurTerbuka: [
      "{pihak} menggeser benteng ke {petak} lewat {san}, langsung menguasai lajur yang terbuka.",
      "{san} — benteng {pihak} mengambil alih lajur dari {petak} untuk menyiapkan penetrasi ke wilayah lawan.",
      "Kendali vertikal diraih: {san} menempatkan benteng {pihak} tepat di jalur terbuka pada {petak}.",
    ],
    bentengBarisTujuh: [
      "Benteng {pihak} menyusup ke {petak}! Baris pertahanan dikuasai, mengancam pion dan membatasi raja {lawan}.",
      "{san} menempatkan benteng di baris ketujuh milik {lawan} — motif klasik yang sangat merepotkan.",
      "Penetrasi tajam lewat {san}: benteng {pihak} di {petak} mulai menekan pangkal barisan pion {lawan}.",
    ],
    pionBebas: [
      "Pion bebas {pihak} melaju ke {petak}! Setiap langkah majunya makin mengikat perwira {lawan}.",
      "{san} — pion bebas di {petak} mulai menjadi aset berharga menjelang babak akhir.",
      "{pihak} mendorong pion bebasnya ke {petak}; {lawan} harus segera menyiapkan blokade.",
    ],
    profilaksisSayap: [
      "{san} — langkah profilaksis rapi dari {pihak}, menutup petak loncatan perwira {lawan} sekaligus memberi ruang bernapas.",
      "Sentuhan pencegahan lewat {san}: sayap dijaga lebih dulu sebelum {pihak} melanjutkan rencana utama.",
      "{pihak} menyelipkan {san} untuk mencegah paku atau lompatan perwira ringan {lawan} di sayap.",
    ],
    menteriDini: [
      "Menteri {pihak} sudah keluar ke {petak} lewat {san} — agresif, tetapi rawan kehilangan tempo bila dikejar perwira ringan {lawan}.",
      "{san} mengeluarkan menteri lebih awal; {pihak} harus berhati-hati agar tidak tertinggal pengembangan.",
      "Aktivasi menteri dini ke {petak} lewat {san} — menuntut akurasi agar tidak menjadi sasaran empuk tempo lawan.",
    ],
    kembangPerwira: [
      "{pihak} mengaktifkan {bidak} ke {petak} lewat {san}, mempercepat pengembangan menuju pusat.",
      "{san} membawa {bidak} {pihak} masuk ke permainan dan membuka jalan menuju rokade.",
      "Pengembangan wajar lewat {san}: {bidak} {pihak} kini ikut mengawasi petak-petak penting.",
      "Mobilisasi berlanjut — {san} menempatkan {bidak} {pihak} di petak kerja {petak}.",
    ],
    rajaAktifAkhir: [
      "Tanpa menteri di papan, raja {pihak} maju ke {petak} lewat {san} untuk ikut bertempur di babak akhir.",
      "{san} — prinsip babak akhir dijalankan: raja {pihak} bergerak aktif mendekati pusat permainan.",
      "Di babak akhir, raja adalah perwira tempur: {san} membawa raja {pihak} ke {petak}.",
    ],
    gandakanBenteng: [
      "{pihak} menyusun baterai perwira berat lewat {san} di {petak}, melipatgandakan daya dobrak vertikal!",
      "{san} menumpuk kekuatan di satu lajur dari {petak} — tekanan terhadap titik masuk lawan kian berat.",
      "Koordinasi perwira berat terbangun di {petak} lewat {san}, siap mendobrak pertahanan {lawan}.",
    ],
    gajahPin: [
      "{san} mengarahkan gajah {pihak} dari {petak} untuk memaku perwira {lawan} di sepanjang diagonal!",
      "Paku diagonal yang mengganggu lewat {san}: gajah di {petak} mengikat gerak perwira penjaga {lawan}.",
      "{pihak} menempatkan gajah di {petak} lewat {san}, menekan garis diagonal menuju perwira utama {lawan}.",
    ],
    incarTitikLemah: [
      "{san} menempatkan {bidak} {pihak} di {petak} untuk membidik langsung petak lemah di dekat raja {lawan}!",
      "Tekanan langsung dari {petak} lewat {san} — {pihak} menguji ketahanan sayap raja {lawan} sejak awal.",
      "Lewat {san}, {pihak} mengarahkan pandangan tajam ke titik paling peka di sekitar raja {lawan}.",
    ],
    hubungkanBenteng: [
      "{san} menuntaskan pembersihan baris belakang — kedua benteng {pihak} kini saling terhubung penuh!",
      "Baris pertama kini lapang setelah {san}, menyatukan kerja sama kedua benteng {pihak}.",
      "Koordinasi tuntas lewat {san}: kedua benteng {pihak} sudah saling menjaga di baris belakang.",
    ],
    kudaTepi: [
      "{san} menggeser kuda {pihak} ke tepi papan di {petak} — jangkauannya menyempit kecuali menyiapkan dobrakan sayap.",
      "Kuda {pihak} menepi ke {petak} lewat {san}; biasanya hanya sementara sebelum mencari rute baru ke tengah.",
      "Lewat {san}, kuda mendarat di pinggir papan {petak} — menuntut rencana lanjutan yang jelas agar tak terkurung.",
    ],
    kuasaiPusat: [
      "{pihak} menancapkan pion di pusat lewat {san}, mengklaim ruang penting dan membatasi perwira {lawan}.",
      "{san} mempertegas pijakan pion {pihak} di jantung papan sekaligus membuka garis bagi perwira di belakangnya.",
      "Langkah prinsipil {san}: {pihak} langsung menduduki petak pusat {petak} untuk mendikte arah permainan.",
    ],
    manuverKuda: [
      "{pihak} memutar rute kuda ke {petak} lewat {san}, mengincar pijakan yang lebih menekan di babak tengah.",
      "Manuver kuda {san}: {pihak} menggeser kudanya ke {petak} untuk membidik petak lemah di kubu {lawan}.",
      "{san} memperbaiki letak kuda {pihak} di {petak} agar lebih hidup mengawasi dua sayap.",
      "Rotasi kuda yang sabar lewat {san}, mencari pos kerja terbaik dari {petak}.",
    ],
    manuverGajah: [
      "{pihak} menggeser gajah ke {petak} lewat {san}, memindahkan bidikan ke diagonal yang lebih terbuka.",
      "{san} — gajah {pihak} berganti jalur ke {petak} untuk mengiris petak-petak penting milik {lawan}.",
      "Penyesuaian diagonal lewat {san}: gajah {pihak} kini bekerja dari {petak}.",
      "{pihak} menempatkan ulang gajahnya di {petak} agar tidak terhalang rantai pion sendiri.",
    ],
    manuverMenteri: [
      "{pihak} memindahkan menteri ke {petak} lewat {san}, menyatukan pengawasan taktis di pusat dan sayap.",
      "Manuver menteri {san}: dari {petak}, menteri {pihak} mengintip kelemahan sekaligus menopang barisan sendiri.",
      "{san} menempatkan menteri {pihak} lebih aktif di {petak} tanpa membuka celah balasan.",
      "Pergeseran halus menteri ke {petak} lewat {san} untuk meningkatkan koordinasi serangan {pihak}.",
    ],
    dorongPion: [
      "{pihak} mendorong pion lewat {san}, menyita ruang di sekitar {petak} dan membatasi pijakan perwira {lawan}.",
      "Ekspansi pion {san}: {pihak} memperbaiki struktur sekaligus menekan ruang gerak {lawan} di sektor itu.",
      "{san} menggeser garis depan pion {pihak} ke {petak} untuk menyiapkan rencana babak tengah.",
      "Langkah pion terukur lewat {san}, mengamankan petak di depan {petak} bagi manuver perwira {pihak}.",
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
      "Pengembangan fianchetto lewat {san}: gajah {pihak} di {petak} menjadi poros kekuatan jangka panjang.",
    ],
    dobrakPusat: [
      "Dobrakan tematik {san}: {pihak} menantang struktur pion pusat {lawan} untuk membuka lajur permainan.",
      "Lewat {san}, {pihak} menggugat kemapanan pusat {lawan} dan memperebutkan inisiatif babak tengah.",
      "{pihak} melancarkan tantangan pion {san} guna membongkar rantai pusat milik {lawan}.",
    ],
    kudaPosTerdepan: [
      "Kuda {pihak} menduduki pos terdepan ideal di {petak}, ditopang pion sendiri dan kebal dari usiran pion lawan.",
      "Penempatan kuda di {petak} lewat {san} memberikan pijakan strategis jangka panjang bagi {pihak}.",
      "{san} mengamankan pos terdepan pusat di {petak} yang sangat membatasi koordinasi {lawan}.",
    ],
    bentengLajurTerbuka: [
      "{pihak} memusatkan benteng ke {petak}, mengambil kendali atas lajur yang bebas dari pion sendiri.",
      "Lewat {san}, benteng {pihak} menguasai jalur vertikal dari {petak} sebagai persiapan invasi.",
      "Sentralisasi benteng lewat {san} menancapkan kontrol vertikal {pihak} di petak {petak}.",
    ],
    bentengBarisTujuh: [
      "Invasi klasik lewat {san}: benteng {pihak} menembus baris pertahanan lawan di {petak}.",
      "Benteng di {petak} menekan basis pion sekaligus membatasi ruang gerak raja {lawan}.",
      "Penetrasi baris ketujuh di {petak} memberi {pihak} inisiatif aktif yang sulit diredam.",
    ],
    pionBebas: [
      "Kemajuan pion bebas ke {petak} lewat {san} menciptakan ancaman promosi jangka panjang yang mengikat {lawan}.",
      "Pion bebas {pihak} di {petak} kian bernilai strategis seiring berkurangnya perwira di papan.",
      "{san} memajukan pion bebas ke {petak}, memaksa perwira {lawan} mengambil tugas bertahan.",
    ],
    profilaksisSayap: [
      "{san} berfungsi sebagai langkah profilaksis untuk membatasi akses perwira lawan di petak sayap.",
      "Langkah pencegahan {san} mengamankan petak lompatan di sayap sekaligus membuka ruang bagi raja.",
      "Disiplin profilaksis ditunjukkan {pihak} lewat {san} sebelum melanjutkan operasi utama.",
    ],
    menteriDini: [
      "Aktivasi menteri lebih awal ke {petak} lewat {san} berisiko memberi target pengembangan bagi perwira {lawan}.",
      "{san} membawa menteri keluar pada fase pembukaan; ketepatan perhitungan tempo menjadi krusial.",
      "Mobilisasi dini menteri ke {petak} menuntut kewaspadaan agar {pihak} tidak tertinggal perkembangan perwira ringan.",
    ],
    kembangPerwira: [
      "{pihak} mengembangkan {bidak} menuju {petak}, mempercepat mobilisasi perwira di fase pembukaan.",
      "Langkah pengembangan sehat {san}: {bidak} {pihak} berpartisipasi aktif dalam perebutan pusat.",
      "{san} melanjutkan pembangunan posisi {pihak} sesuai prinsip pengembangan klasik.",
      "Lewat {san}, {bidak} {pihak} menempati petak aktif {petak} guna menyokong kendali tengah.",
    ],
    rajaAktifAkhir: [
      "Memasuki babak akhir, raja {pihak} diaktifkan menuju {petak} untuk mendukung struktur pion.",
      "Sentralisasi raja lewat {san} sejalan dengan kaidah teknik babak akhir tanpa menteri.",
      "Raja {pihak} maju ke {petak} lewat {san}, mengambil peran aktif di panggung babak akhir.",
    ],
    gandakanBenteng: [
      "{pihak} membentuk baterai perwira berat di {petak} lewat {san} untuk melipatgandakan tekanan lajur.",
      "Penggandaan kekuatan vertikal melalui {san} di {petak} menyiapkan penetrasi ke wilayah {lawan}.",
      "Lewat {san}, {pihak} menyatukan daya gempur perwira berat di satu lajur terbuka.",
    ],
    gajahPin: [
      "{san} menempatkan gajah {pihak} di {petak} untuk memaku perwira lawan di sepanjang diagonal.",
      "Ikatan diagonal lewat {san} membatasi keluwesan perwira pertahanan {lawan} dari {petak}.",
      "Tekanan paku gajah di {petak} lewat {san} menguji keutuhan koordinasi {lawan}.",
    ],
    incarTitikLemah: [
      "{san} mengarahkan {bidak} {pihak} dari {petak} langsung ke titik rawan di sekitar raja {lawan}.",
      "Penempatan aktif di {petak} lewat {san} memberikan tekanan dini terhadap sayap raja {lawan}.",
      "Lewat {san}, {pihak} membidik petak paling peka dalam bangunan awal {lawan}.",
    ],
    hubungkanBenteng: [
      "{san} melapangkan baris belakang sehingga kedua benteng {pihak} kini saling terhubung.",
      "Mobilisasi tuntas lewat {san}; koordinasi kedua benteng {pihak} di baris pertama telah terbentuk.",
      "Dengan dimainkannya {san}, garis komunikasi antarbenteng {pihak} terbuka sepenuhnya.",
    ],
    kudaTepi: [
      "{san} menempatkan kuda di tepi papan pada {petak}, membatasi radius kontrolnya kecuali untuk tujuan konkret.",
      "Penempatan kuda di pinggir papan lewat {san} menuntut rencana lanjutan agar perwira itu tidak terpinggirkan.",
      "Kuda {pihak} bergeser ke {petak}; secara klasik tepi papan mengurangi jangkauan petak pusat.",
    ],
    kuasaiPusat: [
      "{pihak} menduduki petak pusat secara langsung lewat {san}, menetapkan klaim ruang sejak dini.",
      "Dorongan sentral {san} memperkuat cengkeraman {pihak} di pusat sekaligus membebaskan garis perwira.",
      "Prinsip klasik dijalankan melalui {san}: pion {pihak} menguasai petak inti {petak}.",
    ],
    manuverKuda: [
      "{pihak} merotasi kuda menuju {petak} lewat {san} guna mencari pijakan strategis yang lebih efektif.",
      "Manuver reposisi {san} mengarahkan kuda {pihak} ke sektor {petak} yang lebih menjanjikan.",
      "Lewat {san}, kuda {pihak} ditata ulang di {petak} untuk memperketat pengawasan petak lemah.",
      "Perputaran rute kuda melalui {san} meningkatkan harmoni perwira {pihak} di babak tengah.",
    ],
    manuverGajah: [
      "{pihak} memindahkan gajah ke {petak} lewat {san} untuk menguasai diagonal yang lebih produktif.",
      "Penyesuaian jalur diagonal lewat {san} menempatkan gajah {pihak} secara optimal di {petak}.",
      "Lewat {san}, gajah {pihak} beralih ke {petak} guna menekan struktur lawan dari sudut baru.",
      "Penataan ulang gajah ke {petak} lewat {san} menjaga pasangan perwira {pihak} tetap leluasa.",
    ],
    manuverMenteri: [
      "{pihak} memusatkan kembali menteri ke {petak} lewat {san}, menyatukan fungsi serang dan bertahan.",
      "Pergeseran menteri melalui {san} di {petak} meningkatkan kepekaan taktis di kedua sayap.",
      "Lewat {san}, menteri {pihak} mengambil kedudukan fleksibel di {petak} tanpa mengundang ancaman tempo.",
      "Penempatan ulang menteri di {petak} memperkuat koordinasi perwira berat milik {pihak}.",
    ],
    dorongPion: [
      "{pihak} memajukan pion lewat {san}, memperluas ruang sekaligus membatasi mobilitas perwira {lawan}.",
      "Langkah struktur {san} memperbaiki cengkeraman petak di sekitar {petak} bagi {pihak}.",
      "Ekspansi bertahap melalui {san} menyiapkan landasan operasi {pihak} di babak tengah.",
      "Dorongan pion {san} mengamankan ruang tambahan di sektor {petak} secara terukur.",
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
      "Jalur sniper aktif lewat {san}: gajah {pihak} di {petak} ngincer diagonal panjang!",
    ],
    dobrakPusat: [
      "Dobrak pusat lewat {san}! {pihak} langsung goyang rantai pion {lawan}.",
      "{san}! Pion {pihak} maju nantang pusat biar jalur serangan cepet kebuka.",
      "Langsung adu otot di tengah lewat {san} — {lawan} dipaksa ambil sikap!",
    ],
    kudaPosTerdepan: [
      "Kuda {pihak} parkir cantik di pos terdepan {petak}! Dijaga pion dan susah banget diusir.",
      "{san} — kuda nangkring gagah di {petak}, bikin sesak pertahanan {lawan}!",
      "Pos emas di {petak}! Kuda {pihak} lewat {san} jadi duri tajam di wilayah lawan.",
    ],
    bentengLajurTerbuka: [
      "Benteng {pihak} geser ke {petak} lewat {san}, langsung kuasai jalan tol lajur terbuka!",
      "{san} — lajur kosong langsung diklaim benteng {pihak} dari {petak}.",
      "Jalur vertikal dikunci! {san} bikin benteng {pihak} siap nyelonong dari {petak}.",
    ],
    bentengBarisTujuh: [
      "Benteng {pihak} tembus ke {petak}! Masuk baris pertahanan lawan, pion-pion langsung gemetar.",
      "{san}! Benteng mendarat di jantung baris ketujuh — tamu paling nyebelin buat {lawan}.",
      "Invasi benteng lewat {san} ke {petak}! Pertahanan belakang {lawan} mulai diacak-acak.",
    ],
    pionBebas: [
      "Pion bebas {pihak} ngegas ke {petak}! Makin dekat kotak promosi, makin bikin panik {lawan}.",
      "{san} — pion bebas di {petak} mulai jalan terus dan mengikat perwira lawan.",
      "Awas pion lari! Lewat {san}, pion bebas {pihak} di {petak} makin susah dihentikan.",
    ],
    profilaksisSayap: [
      "{san} — langkah jaga-jaga cerdas dari {pihak}, tutup petak loncatan lawan sekalian kasih napas buat raja.",
      "Sentuhan rapi {san}: kunci sayap dulu sebelum {pihak} lanjut gas rencana utama.",
      "Anti-ribet lewat {san}: {pihak} nutup akses paku atau lompatan lawan di sayap.",
    ],
    menteriDini: [
      "Menteri {pihak} udah nongol duluan ke {petak} lewat {san} — berani, tapi awas dikejar-kejar perwira lawan!",
      "{san} keluarin menteri cepat banget; jangan sampai malah rugi tempo pengembangan.",
      "Menteri turun gunung lebih awal lewat {san} ke {petak} — harus ekstra hati-hati sama tempo!",
    ],
    kembangPerwira: [
      "{pihak} keluarin {bidak} ke {petak} lewat {san} — pengembangan cepat dan sehat!",
      "{san} bikin {bidak} {pihak} langsung aktif ngincer pusat papan.",
      "Setup rapi lewat {san}: satu per satu perwira {pihak} turun ke medan tempur.",
      "Pengembangan mulus {san}: {bidak} {pihak} siap kerja dari {petak}.",
    ],
    rajaAktifAkhir: [
      "Menteri udah nggak ada, saatnya raja {pihak} turun tangan sendiri ke {petak} lewat {san}!",
      "{san} — mode endgame aktif, raja {pihak} maju bantu kawal pertarungan di tengah.",
      "Di babak akhir raja nggak boleh mager: {san} bawa raja {pihak} maju ke {petak}!",
    ],
    gandakanBenteng: [
      "Baterai meriam terpasang di {petak} lewat {san}! Daya dobrak lajur {pihak} langsung dobel!",
      "{san} numpuk perwira berat di satu jalur — {lawan} wajib siap-siap nahan gempuran!",
      "Formasi ganda lewat {san} di {petak}, siap jebol pertahanan vertikal {lawan}!",
    ],
    gajahPin: [
      "{san} langsung nge-pin perwira {lawan} dari {petak} — gerak dikit bisa bahaya!",
      "Paku tajam lewat {san}! Gajah {pihak} di {petak} bikin perwira lawan serba salah.",
      "Diagonal dikunci gajah {pihak} di {petak} lewat {san}, mengikat penjaga {lawan}!",
    ],
    incarTitikLemah: [
      "{san} taruh {bidak} di {petak}, langsung melototin titik lemah dekat raja {lawan}!",
      "Tekanan kilat lewat {san} dari {petak} — sayap raja {lawan} langsung diuji sejak dini!",
      "{pihak} ngincer titik paling rawan di kubu {lawan} lewat {san}!",
    ],
    hubungkanBenteng: [
      "Baris belakang resmi bersih setelah {san} — dua benteng {pihak} sekarang udah nyambung!",
      "{san} menuntaskan setup: duet benteng {pihak} siap kompak menguasai lajur tengah.",
      "Koordinasi beres lewat {san}, kedua benteng {pihak} sudah saling jaga!",
    ],
    kudaTepi: [
      "{san} geser kuda ke pinggir papan di {petak} — jangkauannya agak sempit kalau kelamaan di situ.",
      "Kuda {pihak} melipir dulu ke {petak} lewat {san}, biasanya cuma transit sebelum manuver lagi.",
      "Lewat {san}, kuda mendarat di tepi {petak}; harus punya rencana lanjut biar nggak mati gaya.",
    ],
    kuasaiPusat: [
      "{san}! {pihak} langsung tancap bendera di petak pusat {petak}.",
      "Pion tengah maju lewat {san}, nyita ruang penting sekaligus buka jalur perwira {pihak}!",
      "Klaim pusat tegas dari {pihak} lewat {san} — enak banget buat ngatur serangan lanjut.",
    ],
    manuverKuda: [
      "Kuda {pihak} muter rute ke {petak} lewat {san}, cari pijakan yang lebih nendang!",
      "Manuver licin {san}: kuda {pihak} pindah ke {petak} buat ngintip celah pertahanan {lawan}.",
      "{san} — rotasi kuda ke {petak} biar jangkauan serangnya makin hidup.",
      "Pelan tapi pasti, {san} nempatin kuda {pihak} di pos strategis {petak}.",
    ],
    manuverGajah: [
      "Gajah {pihak} pindah jalur ke {petak} lewat {san}, cari diagonal yang lebih segar!",
      "{san} geser gajah ke {petak} buat ngiris petak-petak penting di kubu {lawan}.",
      "Ganti sudut tembak lewat {san}: gajah {pihak} sekarang mantau dari {petak}.",
      "{pihak} rapihin posisi gajah ke {petak} lewat {san} biar makin leluasa.",
    ],
    manuverMenteri: [
      "Menteri {pihak} geser ke {petak} lewat {san}, nyatuin kontrol pusat dan sayap sekaligus!",
      "Manuver menteri {san}: dari {petak}, ancaman taktis {pihak} makin terasa.",
      "{san} bikin menteri {pihak} makin aktif di {petak} sambil tetap aman dari gangguan.",
      "Sentuhan halus {san} — menteri {pihak} siap dukung serangan dari {petak}.",
    ],
    dorongPion: [
      "Dorong pion {san}! {pihak} nyicil ruang di sekitar {petak} biar lawan makin sempit.",
      "{san} — ekspansi pion rapi dari {pihak} buat nyiapin manuver babak tengah.",
      "Garis depan maju lewat {san}, ngebatasin pijakan perwira {lawan} di dekat {petak}.",
      "Langkah pion terukur {san} dari {pihak}, perkuat struktur sambil tekan sayap.",
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

/** komentator teka-teki — ringkas, spesifik, tanpa kalimat pengisi */
export const komentatorTekaTeki = {
  santai: {
    mulaiSatu: [
      "Mat satu langkah. {pihak} jalan.",
      "{pihak} jalan; targetnya mat satu.",
    ],
    mulai: [
      "Mat dalam {n} langkah. {pihak} jalan.",
      "Target: mat {n} langkah. {pihak} mulai.",
      "{pihak} jalan. Cari mat dalam {n}.",
    ],
    mulaiSudah: ["Sudah pernah dipecahkan."],
    benar: [
      "Tepat: {san}.",
      "Langkah benar: {san}.",
      "{san} tepat.",
    ],
    lawan: [
      "Balasan: {san}. Sisa {sisa} langkah.",
      "{lawan} membalas {san}; sisa {sisa}.",
    ],
    lawanTerakhir: [
      "Balasan: {san}. Cari mat.",
      "{san}. Temukan langkah mat.",
    ],
    salah: [
      "{san} belum memaksa.",
      "{san} masih membiarkan lawan bertahan.",
      "Cari langkah paksa, bukan {san}.",
    ],
    salahSkak: [
      "Skak, tetapi lawan masih punya {jalan} balasan legal.",
      "Skak belum memaksa; lawan punya {jalan} langkah legal.",
    ],
    salahTangkap: [
      "Makan {korban} tidak memaksa mat.",
      "Tangkap {korban} bukan langkah mat.",
    ],
    salahTerakhir: [
      "Belum mat: {san}.",
      "Langkah terakhir {san} belum mat.",
    ],
    ilegal: [
      "Langkah ilegal. Cek rajamu.",
      "Tidak legal; lindungi raja.",
    ],
    petunjuk: [
      "Perhatikan {bidak} di {dari}.",
      "Fokus pada {bidak} di {dari}.",
    ],
    pengorbanan: [
      "Pengorbanan {bidak} di {petak} membuka pertahanan raja.",
      "{bidak} di {petak} dikorbankan untuk membuka raja.",
    ],
    selesai: [
      "Selesai.",
      "Taktik tuntas.",
      "Soal terpecahkan.",
    ],
    selesaiTema: [
      "Pola: {tema}.",
      "Motif: {tema}.",
    ],
    tinjau: [
      "Langkah {nomor}: {san}.",
      "{san} — langkah {nomor}.",
    ],
    engineMat: [
      "Mesin: mat dalam {mat}.",
      "Analisis: mat dalam {mat}.",
    ],
  },
  formal: {
    mulaiSatu: [
      "Mat satu langkah. {pihak} jalan.",
      "Target: mat satu; giliran {pihak}.",
    ],
    mulai: [
      "Target: mat dalam {n} langkah. {pihak} jalan.",
      "{pihak} melangkah; cari mat dalam {n}.",
      "Paksa mat dalam {n} langkah.",
    ],
    mulaiSudah: ["Soal ini pernah dipecahkan."],
    benar: [
      "Tepat: {san}.",
      "Langkah benar: {san}.",
      "{san} sesuai solusi.",
    ],
    lawan: [
      "Balasan: {san}. Sisa {sisa} langkah.",
      "{lawan} membalas {san}; sisa {sisa}.",
    ],
    lawanTerakhir: [
      "Balasan: {san}. Cari mat.",
      "{san}; temukan mat.",
    ],
    salah: [
      "{san} tidak memaksa.",
      "Lawan masih dapat bertahan setelah {san}.",
      "Pilih langkah paksa selain {san}.",
    ],
    salahSkak: [
      "Skak; lawan masih memiliki {jalan} balasan legal.",
      "Skak bukan mat; lawan punya {jalan} langkah legal.",
    ],
    salahTangkap: [
      "Makan {korban} tidak memaksa mat.",
      "Penangkapan {korban} tidak menghasilkan mat.",
    ],
    salahTerakhir: [
      "Belum mat: {san}.",
      "Langkah akhir {san} belum mat.",
    ],
    ilegal: [
      "Langkah ilegal. Lindungi raja.",
      "Langkah tersebut tidak legal.",
    ],
    petunjuk: [
      "Perhatikan {bidak} di {dari}.",
      "Kombinasi berawal dari {bidak} di {dari}.",
    ],
    pengorbanan: [
      "Pengorbanan {bidak} di {petak} membuka pertahanan raja.",
      "{bidak} di {petak} dikorbankan untuk membuka raja.",
    ],
    selesai: [
      "Selesai.",
      "Taktik tuntas.",
      "Soal terpecahkan.",
    ],
    selesaiTema: [
      "Tema: {tema}.",
      "Motif: {tema}.",
    ],
    tinjau: [
      "Langkah {nomor}: {san}.",
      "Ulasan langkah {nomor}: {san}.",
    ],
    engineMat: [
      "Analisis: mat dalam {mat}.",
      "Mesin: mat dalam {mat}.",
    ],
  },
  genZ: {
    mulaiSatu: [
      "Mat satu langkah. {pihak} jalan.",
      "{pihak} jalan; mat satu.",
    ],
    mulai: [
      "Mat {n} langkah. {pihak} jalan.",
      "Target mat: {n} langkah. {pihak} mulai.",
      "{pihak} jalan. Cari mat {n} langkah.",
    ],
    mulaiSudah: ["Sudah pernah."],
    benar: [
      "Tepat: {san}.",
      "Sip: {san}.",
      "{san} benar.",
    ],
    lawan: [
      "Balasan {san}. Sisa {sisa}.",
      "{lawan}: {san}. Sisa {sisa} langkah.",
    ],
    lawanTerakhir: [
      "{san}. Cari mat.",
      "Balasan {san}; mat berikutnya.",
    ],
    salah: [
      "{san} belum memaksa.",
      "Lawan masih bertahan setelah {san}.",
      "Cari ancaman paksa, bukan {san}.",
    ],
    salahSkak: [
      "Skak, tapi lawan masih punya {jalan} balasan legal.",
      "Skak belum memaksa; masih ada {jalan} balasan legal.",
    ],
    salahTangkap: [
      "Makan {korban} belum memaksa mat.",
      "{korban} bukan target utama; cari mat.",
    ],
    salahTerakhir: [
      "Belum mat: {san}.",
      "Langkah {san} wajib mat.",
    ],
    ilegal: [
      "Langkah ilegal. Cek raja.",
      "Tidak legal; lindungi raja.",
    ],
    petunjuk: [
      "Lihat {bidak} di {dari}.",
      "Kuncinya: {bidak} di {dari}.",
    ],
    pengorbanan: [
      "{bidak} di {petak} dikorbankan untuk membuka raja.",
      "Pengorbanan {bidak} di {petak} membuka pertahanan raja.",
    ],
    selesai: [
      "Selesai.",
      "Taktik beres.",
      "Soal terpecahkan.",
    ],
    selesaiTema: [
      "Pola: {tema}.",
      "Motif: {tema}.",
    ],
    tinjau: [
      "Langkah {nomor}: {san}.",
      "{san} — langkah {nomor}.",
    ],
    engineMat: [
      "Mesin: mat dalam {mat}.",
      "Engine: mat {mat}.",
    ],
  },
};
