/**
 * ============================================================================
 *  DAFTAR SOAL QUIZ CATUR  (kelola di sini!)
 * ============================================================================
 *
 *  Cara menambah/mengubah soal:
 *
 *  1. Salin satu blok objek `{ ... }` di dalam array `SOAL_CATUR` di bawah.
 *  2. Isi 5 kolomnya:
 *       - kategori  : salah satu dari DAFTAR_KATEGORI.id (lihat bawah file).
 *       - soal      : teks pertanyaan (tulis dalam bahasa Indonesia).
 *       - pilihan   : 2–6 jawaban, sebagai array teks.
 *       - kunci     : INDEX (mulai dari 0) jawaban yang BENAR di `pilihan`.
 *  3. Simpan. Halaman Quiz akan otomatis memuat soal baru.
 *
 *  Aturan wajib:
 *     - `kunci` harus menunjuk salah satu indeks di `pilihan` (0 = pilihan
 *       pertama, 1 = kedua, dst.). Bila ragu, jalankan `npm run uji:quiz`.
 *     - Panjang `pilihan` minimal 2 dan konsisten antar soal (disarankan 4).
 *     - Nama kategori harus ada di `DAFTAR_KATEGORI` supaya bisa difilter.
 * ============================================================================
 */

export const DAFTAR_KATEGORI = [
  { id: "peraturan", urutan: 0 },
  { id: "bidak", urutan: 1 },
  { id: "skakmat", urutan: 2 },
  { id: "taktik", urutan: 3 },
  { id: "pembukaan", urutan: 4 },
  { id: "strategi", urutan: 5 },
  { id: "endgame", urutan: 6 },
  { id: "notasi", urutan: 7 },
  { id: "sejarah", urutan: 8 },
  { id: "umum", urutan: 9 },
  { id: "grandmaster", urutan: 10 },
];

/**
 * Ikon berwarna per kategori dari koleksi `public/images/color-icon`.
 * Setiap id di `DAFTAR_KATEGORI` sebaiknya punya entri di sini. Bila ada
 * kategori yang belum punya ikon, navigasi & area soal memakai `semua`
 * (explorer) sebagai cadangan.
 */
export const IKON_KATEGORI = {
  semua: "/images/color-icon/explorer.svg",
  peraturan: "/images/color-icon/chess-rules.svg",
  bidak: "/images/color-icon/pawn-solo.svg",
  skakmat: "/images/color-icon/game-endgames.svg",
  taktik: "/images/color-icon/puzzle-piece.svg",
  pembukaan: "/images/color-icon/book-open-aqua.svg",
  strategi: "/images/color-icon/magnifier-analysis.svg",
  endgame: "/images/color-icon/board-4x4-brown.svg",
  notasi: "/images/color-icon/pages-a-z.svg",
  sejarah: "/images/color-icon/time-clock.svg",
  umum: "/images/color-icon/globe.svg",
  grandmaster: "/images/color-icon/masters.svg",
};

export const SOAL_CATUR = [
  /* --------------------------------------------------------- peraturan */
  {
    kategori: "peraturan",
    soal: "Berapa jumlah total petak pada papan catur?",
    pilihan: ["32", "48", "64", "81"],
    kunci: 2,
  },
  {
    kategori: "peraturan",
    soal: "Siapa yang selalu melangkah lebih dulu di awal partai catur?",
    pilihan: ["Putih", "Hitam", "Ganti-gantian tiap partai", "Tergantung undian"],
    kunci: 0,
  },
  {
    kategori: "peraturan",
    soal: "Istilah apa untuk keadaan ketika raja sedang diskak dan tidak ada cara legal untuk menyelamatkannya?",
    pilihan: ["Skak", "Skakmat", "Pat", "Remis"],
    kunci: 1,
  },
  {
    kategori: "peraturan",
    soal: "Apa yang terjadi pada posisi yang disebut 'pat' (stalemate)?",
    pilihan: [
      "Pemain yang gilirannya melangkah menang",
      "Partai berakhir remis",
      "Partai dilanjutkan dengan tambahan waktu",
      "Pemain lawan dinyatakan skakmat",
    ],
    kunci: 1,
  },
  {
    kategori: "peraturan",
    soal: "Ketika pion mencapai baris terakhir lawan, pemain wajib melakukan apa?",
    pilihan: [
      "Menghentikan pion itu di petaknya",
      "Mempromosikannya menjadi menteri, benteng, gajah, atau kuda",
      "Menarik pion itu ke belakang",
      "Menukarnya dengan pion lawan",
    ],
    kunci: 1,
  },
  {
    kategori: "peraturan",
    soal: "Sebutan khusus untuk menangkap pion yang baru maju dua petak, seolah hanya maju satu petak, disebut?",
    pilihan: ["En passant", "Rokade", "Skak ganda", "Underpromotion"],
    kunci: 0,
  },
  {
    kategori: "peraturan",
    soal: "Rokade boleh dilakukan bila raja dan benteng belum pernah bergerak. Mana syarat tambahan yang benar?",
    pilihan: [
      "Petak antara harus kosong, dan raja tidak sedang diskak serta tidak melewati atau berakhir di petak yang diserang",
      "Raja boleh sedang diskak asalkan bentengnya bebas",
      "Petak tujuan raja boleh sedang diserang bidak lawan",
      "Bidak antara boleh tetap berada di antara raja dan benteng",
    ],
    kunci: 0,
  },
  {
    kategori: "peraturan",
    soal: "Berapa banyak langkah oleh masing-masing pemain tanpa gerakan pion atau penangkapan yang menjadi dasar klaim remis menurut aturan 50 langkah?",
    pilihan: ["10", "25", "50", "75"],
    kunci: 2,
  },
  {
    kategori: "peraturan",
    soal: "Apakah raja boleh ditangkap seperti bidak biasa?",
    pilihan: ["Ya, pada giliran lawan", "Tidak, permainan berakhir saat posisi skakmat tercapai", "Hanya di endgame", "Hanya jika kedua pemain setuju"],
    kunci: 1,
  },
  {
    kategori: "peraturan",
    soal: "Jika seorang pemain tidak memiliki langkah legal tetapi rajanya tidak sedang diskak, posisi tersebut disebut?",
    pilihan: ["Skakmat", "Pat", "Fork", "Rokade"],
    kunci: 1,
  },
  {
    kategori: "peraturan",
    soal: "Berapa petak yang dapat ditempuh pion dari posisi awalnya jika memilih langkah dua petak?",
    pilihan: ["1", "2", "3", "4"],
    kunci: 1,
  },
  {
    kategori: "peraturan",
    soal: "Dalam rokade panjang, raja berpindah dari file e menuju file apa?",
    pilihan: ["b", "c", "d", "f"],
    kunci: 1,
  },
  {
    kategori: "peraturan",
    soal: "Apakah dua raja boleh berdiri bersebelahan tanpa dipisahkan petak?",
    pilihan: ["Boleh", "Tidak boleh", "Boleh hanya di endgame", "Boleh jika salah satu sedang skak"],
    kunci: 1,
  },

  /* ------------------------------------------------------------- bidak */
  {
    kategori: "bidak",
    soal: "Bidak mana yang boleh melompati bidak lain?",
    pilihan: ["Benteng", "Kuda", "Gajah", "Menteri"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Di antara bidak berikut, mana yang biasanya memiliki nilai materi paling tinggi?",
    pilihan: ["Raja", "Menteri", "Benteng", "Kuda"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Gajah bergerak ke arah mana?",
    pilihan: ["Lurus horizontal dan vertikal", "Diagonal sejauh bebas", "Berbentuk huruf L", "Satu petak ke segala arah"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Benteng bergerak ke arah mana?",
    pilihan: ["Lurus horizontal atau vertikal", "Diagonal sejauh bebas", "Berbentuk huruf L", "Dua petak ke depan lalu satu ke samping"],
    kunci: 0,
  },
  {
    kategori: "bidak",
    soal: "Berapa banyak pion yang dimiliki tiap pemain di awal partai?",
    pilihan: ["4", "8", "16", "2"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Menteri (ratu) menggabungkan gerakan bidak mana saja?",
    pilihan: ["Benteng dan gajah", "Kuda dan benteng", "Pion dan raja", "Hanya gajah"],
    kunci: 0,
  },
  {
    kategori: "bidak",
    soal: "Nilai perkiraan satu kuda (dalam pion) adalah?",
    pilihan: ["1 pion", "3 pion", "5 pion", "9 pion"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Secara umum, kuda lebih efektif berada di mana?",
    pilihan: ["Di sudut papan", "Di tepi papan", "Di atau dekat pusat papan", "Selalu di baris terakhir"],
    kunci: 2,
  },
  {
    kategori: "bidak",
    soal: "Berapa nilai perkiraan sebuah benteng dalam sistem nilai bidak klasik?",
    pilihan: ["3", "5", "7", "9"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Berapa nilai perkiraan sebuah gajah dalam sistem nilai bidak klasik?",
    pilihan: ["1", "3", "5", "8"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Berapa banyak gajah yang dimiliki setiap pemain saat posisi awal?",
    pilihan: ["1", "2", "3", "4"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Bidak apa yang bergerak satu petak ke segala arah dan sangat penting untuk keselamatan posisi?",
    pilihan: ["Raja", "Kuda", "Benteng", "Pion"],
    kunci: 0,
  },
  {
    kategori: "bidak",
    soal: "Pion putih pada posisi awal berada di baris berapa?",
    pilihan: ["1", "2", "7", "8"],
    kunci: 1,
  },

  /* ---------------------------------------------------------- skakmat */
  {
    kategori: "skakmat",
    soal: "Skakmat tercepat yang dikenal sebagai Fool's Mate terjadi setelah berapa langkah?",
    pilihan: ["1 langkah Putih", "2 langkah Hitam", "3 langkah Putih", "4 langkah Hitam"],
    kunci: 1,
  },
  {
    kategori: "skakmat",
    soal: "Skakmat yang sering dipakai pemula, menyerang petak f7 dengan menteri dan gajah putih, disebut?",
    pilihan: ["Scholar's Mate", "Ruy Lopez", "Legal's Mate", "Anastasia's Mate"],
    kunci: 0,
  },
  {
    kategori: "skakmat",
    soal: "Kombinasi dua benteng untuk menggeser raja lawan ke tepi papan hingga skakmat dikenal sebagai?",
    pilihan: ["Tangga benteng", "Jepitan kuda", "Pengorbanan gajah", "Rokade ganda"],
    kunci: 0,
  },
  {
    kategori: "skakmat",
    soal: "Dalam notasi catur, lambang '#' di akhir langkah berarti?",
    pilihan: ["Skak", "Skakmat", "Promosi", "Remis"],
    kunci: 1,
  },
  {
    kategori: "skakmat",
    soal: "Skakmat ketika raja terjebak oleh bidak-bidaknya sendiri dan diserang kuda dikenal sebagai?",
    pilihan: ["Smothered Mate", "Back Rank Mate", "Opera Mate", "Arabian Mate"],
    kunci: 0,
  },
  {
    kategori: "skakmat",
    soal: "Skakmat yang memanfaatkan pion sendiri di baris belakang untuk membatasi raja disebut?",
    pilihan: ["Back Rank Mate", "Fool's Mate", "Boden's Mate", "Legal's Mate"],
    kunci: 0,
  },
  {
    kategori: "skakmat",
    soal: "Apa syarat utama agar sebuah posisi benar-benar disebut skakmat?",
    pilihan: ["Raja sedang diskak dan tidak memiliki langkah legal untuk lolos", "Menteri sudah hilang", "Pemain kehabisan waktu", "Kedua raja berada di tengah"],
    kunci: 0,
  },
  {
    kategori: "skakmat",
    soal: "Skakmat yang menggunakan dua gajah pada diagonal yang saling bersilangan dikenal sebagai?",
    pilihan: ["Boden's Mate", "Smothered Mate", "Back Rank Mate", "Fool's Mate"],
    kunci: 0,
  },
  {
    kategori: "skakmat",
    soal: "Dalam pola skakmat, mengapa raja yang memiliki sedikit ruang gerak lebih mudah dimatikan?",
    pilihan: ["Karena pilihan petak aman untuk melarikan diri lebih sedikit", "Karena raja kehilangan hak rokade", "Karena raja menjadi lebih lambat", "Karena raja tidak boleh menangkap"],
    kunci: 0,
  },

  /* ------------------------------------------------------------ taktik */
  {
    kategori: "taktik",
    soal: "Istilah taktik saat satu bidak menyerang dua atau lebih bidak lawan sekaligus adalah?",
    pilihan: ["Pinning", "Fork", "Skewer", "Discovered attack"],
    kunci: 1,
  },
  {
    kategori: "taktik",
    soal: "Taktik ketika bidak bernilai lebih tinggi dipaksa menyingkir sehingga bidak bernilai lebih rendah di belakangnya menjadi sasaran disebut?",
    pilihan: ["Fork", "Skewer", "Pin", "Zugzwang"],
    kunci: 1,
  },
  {
    kategori: "taktik",
    soal: "Apa yang disebut pin ketika sebuah bidak tidak bebas bergerak karena di belakangnya ada bidak yang lebih penting?",
    pilihan: ["Pinned piece", "Passed pawn", "Outpost", "Opposition"],
    kunci: 0,
  },
  {
    kategori: "taktik",
    soal: "Serangan yang muncul setelah sebuah bidak menyingkir dan membuka garis serangan bidak lain disebut?",
    pilihan: ["Discovered attack", "Skewer", "Fork", "Promotion"],
    kunci: 0,
  },
  {
    kategori: "taktik",
    soal: "Taktik yang memaksa bidak penjaga meninggalkan tugasnya sehingga target menjadi lebih rentan disebut?",
    pilihan: ["Deflection", "Castling", "Opposition", "Development"],
    kunci: 0,
  },
  {
    kategori: "taktik",
    soal: "Apa yang dimaksud dengan discovered check?",
    pilihan: ["Skak yang terbuka setelah bidak lain menyingkir", "Skak yang dilakukan raja", "Skak tanpa menteri", "Skak setelah promosi saja"],
    kunci: 0,
  },
  {
    kategori: "taktik",
    soal: "Taktik ketika sebuah bidak mengancam dua target sekaligus, salah satunya dapat berupa raja, disebut?",
    pilihan: ["Double attack", "Fork", "Opposition", "Fortress"],
    kunci: 0,
  },
  {
    kategori: "taktik",
    soal: "Apa tujuan utama zwischenzug atau intermezzo?",
    pilihan: ["Menyisipkan langkah kuat sebelum menjalankan pertukaran yang tampak wajib", "Memaksa rokade", "Menukar semua pion", "Mengakhiri partai dengan remis"],
    kunci: 0,
  },
  {
    kategori: "taktik",
    soal: "Sacrifice dalam taktik catur berarti?",
    pilihan: ["Sengaja memberikan materi untuk memperoleh kompensasi atau keuntungan", "Memindahkan raja dua petak", "Menghindari semua pertukaran", "Mengulang posisi"],
    kunci: 0,
  },
  {
    kategori: "taktik",
    soal: "Taktik yang memanfaatkan serangan terhadap dua target berbeda sehingga lawan sulit mempertahankan keduanya disebut?",
    pilihan: ["Double attack", "Quiet move", "Opposition", "Fortress"],
    kunci: 0,
  },

  /* -------------------------------------------------------- pembukaan */
  {
    kategori: "pembukaan",
    soal: "Manakah respons Hitam yang merupakan pilihan utama terhadap 1.e4 dan dikenal sebagai Sicilian Defence?",
    pilihan: ["1...c5", "1...e5", "1...c6", "1...d6"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "Pembukaan Queen's Gambit dimulai dengan?",
    pilihan: ["1.d4 d5 2.c4", "1.e4 e5 2.f4", "1.c4 e5", "1.Kf3 d5"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "Pembukaan Caro-Kann dimulai dari respons Hitam terhadap 1.e4 dengan?",
    pilihan: ["1...c5", "1...c6", "1...e6", "1...d5"],
    kunci: 1,
  },
  {
    kategori: "pembukaan",
    soal: "French Defence dimulai dengan langkah Hitam?",
    pilihan: ["1...e5", "1...c5", "1...e6", "1...c6"],
    kunci: 2,
  },
  {
    kategori: "pembukaan",
    soal: "King's Gambit dimulai dengan?",
    pilihan: ["1.e4 e5 2.f4", "1.d4 d5 2.c4", "1.c4 e5", "1.Kf3 d5"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "English Opening biasanya dimulai dengan langkah Putih?",
    pilihan: ["1.e4", "1.d4", "1.c4", "1.Kf3"],
    kunci: 2,
  },
  {
    kategori: "pembukaan",
    soal: "Prinsip pembukaan yang umum dianjurkan adalah?",
    pilihan: ["Kembangkan bidak, kuasai pusat, dan amankan raja", "Gerakkan menteri berkali-kali", "Majukan semua pion sayap", "Jangan pernah melakukan rokade"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "Italian Game dimulai dengan urutan langkah?",
    pilihan: ["1.e4 e5 2.Nf3 Nc6 3.Bc4", "1.d4 d5 2.c4", "1.c4 e5 2.Nc3", "1.Nf3 d5 2.g3"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "Ruy Lopez juga dikenal sebagai pembukaan apa?",
    pilihan: ["Spanish Game", "Italian Game", "English Opening", "French Defence"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "Pertahanan Scandinavian dimulai ketika Hitam merespons 1.e4 dengan?",
    pilihan: ["1...d5", "1...c5", "1...e6", "1...Nc6"],
    kunci: 0,
  },

  /* ----------------------------------------------------------- strategi */
  {
    kategori: "strategi",
    soal: "Apa tujuan utama menguasai petak pusat pada fase awal permainan?",
    pilihan: ["Membuat raja langsung aman tanpa rokade", "Memberi ruang dan meningkatkan aktivitas bidak", "Menghindari semua pertukaran", "Memaksa lawan memajukan pion tepi"],
    kunci: 1,
  },
  {
    kategori: "strategi",
    soal: "Petak kuat yang sulit diusir oleh pion lawan dan dapat menjadi tempat ideal bagi kuda disebut?",
    pilihan: ["Outpost", "Back rank", "Zugzwang", "File tertutup"],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Apa keuntungan memiliki open file untuk benteng?",
    pilihan: ["Benteng mendapat jalur terbuka untuk menekan posisi lawan", "Benteng tidak bisa diserang", "Benteng berubah menjadi menteri", "Raja otomatis terlindungi"],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Istilah 'bad bishop' biasanya merujuk pada gajah yang?",
    pilihan: ["Terhalang oleh pion sendiri sehingga ruang geraknya terbatas", "Berada di warna petak yang sama dengan raja lawan", "Selalu bernilai kurang dari dua pion", "Tidak boleh bergerak diagonal"],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Mengapa keselamatan raja menjadi prioritas penting dalam middlegame?",
    pilihan: ["Raja adalah bidak dengan nilai materi tertinggi", "Raja yang terbuka dapat menjadi sasaran serangan langsung", "Raja harus selalu berada di tengah papan", "Raja tidak boleh bergerak setelah rokade"],
    kunci: 1,
  },
  {
    kategori: "strategi",
    soal: "Apa yang dimaksud dengan pawn structure?",
    pilihan: ["Susunan pion yang memengaruhi kekuatan dan kelemahan posisi", "Jumlah waktu pada jam catur", "Urutan pertukaran menteri", "Susunan bidak di luar papan"],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Apa yang dimaksud dengan isolated pawn?",
    pilihan: ["Pion yang tidak memiliki pion kawan di file sebelah", "Pion yang sudah dipromosikan", "Pion yang sedang diskak", "Pion yang berada di baris terakhir"],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Mengapa dua benteng yang terhubung biasanya dianggap menguntungkan?",
    pilihan: ["Mereka saling melindungi dan dapat bekerja sama di sepanjang baris", "Mereka tidak bisa ditangkap", "Mereka otomatis menjadi menteri", "Mereka dapat melompati bidak"],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Apa yang dimaksud dengan piece activity?",
    pilihan: ["Seberapa aktif dan efektif bidak menguasai petak serta menyerang target", "Jumlah bidak yang dimiliki", "Jumlah langkah yang sudah dimainkan", "Kecepatan jam catur"],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Kapan pertukaran menteri sering masuk akal secara strategis?",
    pilihan: ["Ketika pertukaran mengurangi serangan lawan atau menguntungkan endgame", "Selalu pada langkah pertama", "Hanya ketika menteri berada di d1", "Tidak pernah"],
    kunci: 0,
  },

  /* ------------------------------------------------------------ endgame */
  {
    kategori: "endgame",
    soal: "Dalam endgame pion dan raja, apa yang dimaksud opposition?",
    pilihan: ["Kedua raja saling berhadapan dengan jarak satu petak", "Kedua raja berada di sudut papan", "Satu raja menyerang menteri lawan", "Dua benteng berada pada file yang sama"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Pion yang tidak dapat dihentikan oleh pion lawan di file yang sama maupun file yang berdekatan disebut?",
    pilihan: ["Passed pawn", "Isolated king", "Pinned pawn", "Back rank pawn"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Dalam banyak endgame, raja menjadi semakin aktif karena?",
    pilihan: ["Raja boleh meninggalkan aturan skak", "Jumlah bidak berkurang sehingga ancaman terhadap raja biasanya lebih sedikit", "Raja berubah menjadi benteng", "Raja mendapat langkah tambahan setiap giliran"],
    kunci: 1,
  },
  {
    kategori: "endgame",
    soal: "Teknik dasar kemenangan endgame benteng yang terkenal dengan posisi benteng membantu raja mengeluarkan pion dari posisi tertentu disebut?",
    pilihan: ["Lucena", "Philidor", "Sicilian", "Boden"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Pertahanan Philidor dalam endgame benteng terutama bertujuan untuk?",
    pilihan: ["Mencegah raja lawan maju terlalu jauh dan membantu mempertahankan remis", "Menukar benteng sendiri dengan pion", "Memaksa promosi pion sendiri", "Memenangkan menteri dalam tiga langkah"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Apa yang dimaksud dengan rule of the square dalam endgame pion?",
    pilihan: ["Cara memperkirakan apakah raja dapat mengejar pion sebelum promosi", "Aturan untuk memilih warna papan", "Teknik memaksa rokade", "Cara menghitung nilai menteri"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Dalam endgame pion, mengapa raja aktif sering menjadi faktor penentu?",
    pilihan: ["Raja dapat membantu mendorong pion dan menghalangi raja lawan", "Raja berubah menjadi menteri", "Raja boleh melompati pion", "Raja tidak bisa diskak"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Apa tujuan utama mengawal passed pawn menuju promosi?",
    pilihan: ["Membuat pion mencapai baris terakhir tanpa dapat dihentikan", "Menukar pion dengan raja", "Mengembalikan pion ke posisi awal", "Menghilangkan hak rokade"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Endgame king and queen versus king pada umumnya dimenangkan dengan?",
    pilihan: ["Menggunakan menteri dan raja bersama untuk membatasi raja lawan", "Mengorbankan menteri langsung", "Menghindari raja sendiri", "Memajukan pion h"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Apa hasil partai jika kedua pemain hanya memiliki raja tanpa bidak lain?",
    pilihan: ["Remis", "Putih menang", "Hitam menang", "Permainan dilanjutkan tanpa batas"],
    kunci: 0,
  },

  /* ------------------------------------------------------------- notasi */
  {
    kategori: "notasi",
    soal: "Dalam notasi aljabar, huruf 'N' biasanya mewakili bidak apa?",
    pilihan: ["Kuda", "Benteng", "Gajah", "Menteri"],
    kunci: 0,
  },
  {
    kategori: "notasi",
    soal: "Apa arti 'x' dalam notasi langkah catur seperti Bxe5?",
    pilihan: ["Skak", "Menangkap bidak", "Promosi", "Rokade"],
    kunci: 1,
  },
  {
    kategori: "notasi",
    soal: "Apa arti 'O-O' dalam notasi catur?",
    pilihan: ["Rokade pendek", "Rokade panjang", "Skak", "Remis"],
    kunci: 0,
  },
  {
    kategori: "notasi",
    soal: "Dalam notasi SAN, tanda '+' di akhir langkah menunjukkan?",
    pilihan: ["Skak", "Skakmat", "Promosi", "Menangkap raja"],
    kunci: 0,
  },
  {
    kategori: "notasi",
    soal: "Apa arti 'O-O-O'?",
    pilihan: ["Rokade pendek", "Rokade panjang", "Skak ganda", "Promosi"],
    kunci: 1,
  },
  {
    kategori: "notasi",
    soal: "Dalam notasi aljabar bahasa Inggris, huruf 'R' mewakili bidak apa?",
    pilihan: ["Raja", "Benteng", "Menteri", "Kuda"],
    kunci: 1,
  },
  {
    kategori: "notasi",
    soal: "Dalam notasi aljabar bahasa Inggris, huruf 'B' mewakili?",
    pilihan: ["Benteng", "Gajah", "Kuda", "Pion"],
    kunci: 1,
  },
  {
    kategori: "notasi",
    soal: "Bagaimana biasanya langkah pion ditulis dalam notasi aljabar jika tidak menangkap?",
    pilihan: ["Hanya tujuan petaknya, misalnya e4", "Selalu diawali P", "Ditulis lengkap, misalnya pawn e4", "Dengan huruf N"],
    kunci: 0,
  },
  {
    kategori: "notasi",
    soal: "Dalam notasi catur, tanda '=' yang diikuti huruf seperti '=Q' biasanya menunjukkan?",
    pilihan: ["Promosi pion menjadi menteri", "Remis", "Skak", "Pertukaran menteri"],
    kunci: 0,
  },
  {
    kategori: "notasi",
    soal: "Apa arti tanda '!' yang sering ditambahkan dalam anotasi partai catur?",
    pilihan: ["Langkah bagus atau kuat", "Langkah ilegal", "Skakmat", "Remis otomatis"],
    kunci: 0,
  },

  /* ---------------------------------------------------------- sejarah */
  {
    kategori: "sejarah",
    soal: "Permainan yang sering dianggap sebagai salah satu leluhur langsung catur berkembang di wilayah mana?",
    pilihan: ["India", "Rusia", "Spanyol", "Amerika Serikat"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Istilah 'checkmate' berkaitan dengan ungkapan Persia 'shah mat'. Makna yang sering diberikan untuk ungkapan tersebut adalah?",
    pilihan: ["Raja telah dikalahkan atau tidak berdaya", "Putih menang", "Seri", "Waktu habis"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Organisasi catur dunia yang menaungi federasi nasional adalah?",
    pilihan: ["FIDE", "USCF", "AFC", "WCC"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Apa nama permainan India kuno yang sering dianggap sebagai salah satu leluhur catur?",
    pilihan: ["Chaturanga", "Senet", "Go", "Shogi"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Siapa yang menjadi juara dunia catur pertama yang diakui secara umum pada 1886?",
    pilihan: ["Wilhelm Steinitz", "Emanuel Lasker", "José Raúl Capablanca", "Alexander Alekhine"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Siapa juara dunia yang terkenal dengan gaya permainan posisional dan menjadi juara dunia pada 1921 setelah mengalahkan Lasker?",
    pilihan: ["José Raúl Capablanca", "Bobby Fischer", "Garry Kasparov", "Mikhail Tal"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Bobby Fischer menjadi juara dunia pada 1972 setelah mengalahkan siapa?",
    pilihan: ["Boris Spassky", "Anatoly Karpov", "Tigran Petrosian", "Viktor Korchnoi"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Kejuaraan dunia catur 1972 antara Fischer dan Spassky sering dijuluki apa?",
    pilihan: ["Match of the Century", "Game of Thrones", "Battle of Queens", "Chess Renaissance"],
    kunci: 0,
  },

  /* ------------------------------------------------------------- umum */
  {
    kategori: "umum",
    soal: "Apa nama format permainan catur yang menggunakan papan dan bidak fisik secara langsung?",
    pilihan: ["Catur over-the-board (OTB)", "Catur korespondensi", "Catur simultan", "Catur blindfold"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Istilah untuk pemain yang bermain tanpa melihat papan secara langsung adalah?",
    pilihan: ["Blindfold chess", "Bullet chess", "Rapid chess", "Puzzle rush"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Apa yang dimaksud dengan underpromotion?",
    pilihan: ["Promosi pion menjadi kuda, gajah, atau benteng, bukan menteri", "Promosi menjadi dua menteri", "Memajukan pion satu petak", "Mengorbankan pion"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Istilah 'en prise' berarti sebuah bidak?",
    pilihan: ["Sedang berada dalam posisi dapat ditangkap", "Sudah dipromosikan", "Sedang melakukan rokade", "Tidak dapat bergerak"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Kontrol waktu 5 menit tanpa increment umumnya dikategorikan sebagai?",
    pilihan: ["Blitz", "Rapid", "Bullet", "Korespondensi"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Istilah 'tempo' dalam catur paling dekat berarti?",
    pilihan: ["Satu unit waktu atau kesempatan langkah yang dapat dimanfaatkan", "Nilai menteri", "Warna petak", "Jumlah pion"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Apa yang biasanya dimaksud dengan blunder dalam catur?",
    pilihan: ["Kesalahan besar yang dapat menyebabkan kerugian material atau posisi", "Langkah pembukaan wajib", "Jenis rokade", "Promosi pion"],
    kunci: 0,
  },

  /* ------------------------------------------------------ grandmaster */
  {
    kategori: "grandmaster",
    fen: "1r2k1r1/pbppnp1p/1b3P2/8/Q7/B1PB1q2/P4PPP/3R2K1 w - - 0 21",
    orientasi: "w",
    langkahBenar: { from: "a4", to: "d7" },
    soal: "Adolf Anderssen vs Jean Dufresne (Partai 'Evergreen', Berlin 1852) — Putih melangkah. Pengorbanan menteri legendaris apa yang dimainkan Anderssen?",
    pilihan: ["Qxd7+", "Qxa7", "Bxe7", "Bxh7"],
    kunci: 0,
  },
  {
    kategori: "grandmaster",
    fen: "rnbk1bBr/pp6/2p4p/2qp4/5pQP/2N5/PPPP2P1/R1BKR3 w - - 0 14",
    orientasi: "w",
    langkahBenar: { from: "e1", to: "e8" },
    soal: "Paul Morphy vs Eugene Rousseau (Partai Blindfold) — Putih melangkah. Langkah taktis tajam mana yang langsung meruntuhkan pertahanan Hitam?",
    pilihan: ["Qxc8+", "Re8+", "Bxd5", "Qxf4"],
    kunci: 1,
  },
  {
    kategori: "grandmaster",
    fen: "kr2r3/pRp3pp/Q1P5/5R2/Pp1q4/3pp2P/6PK/8 w - - 0 32",
    orientasi: "w",
    langkahBenar: { from: "b7", to: "a7" },
    soal: "Jose Raul Capablanca vs Rudolf Raubitschek (New York) — Putih melangkah. Pengorbanan pembuka mana yang dimainkan Capablanca untuk skakmat paksa?",
    pilihan: ["Rxb8+", "Qxa7+", "Rxa7+", "Rxc7"],
    kunci: 2,
  },
  {
    kategori: "grandmaster",
    fen: "r3kr2/1p1b1pp1/p1n1p2p/8/4q3/1N6/PPP1BKPP/R2Q1R2 w q - 0 17",
    orientasi: "w",
    langkahBenar: { from: "d1", to: "d7" },
    soal: "Mikhail Tal vs Georgi Tringov (Olimpiade Catur ke-13) — Putih melangkah. Pengorbanan khas 'Penyihir dari Riga' mana yang dimainkan Tal?",
    pilihan: ["Qxd7+", "Bxa6", "Na5", "Nc5"],
    kunci: 0,
  },
  {
    kategori: "grandmaster",
    fen: "2q4k/p6p/6p1/5p2/5P1P/1Bb2QP1/Pr6/3R2K1 w - - 0 38",
    orientasi: "w",
    langkahBenar: { from: "d1", to: "d8" },
    soal: "Bobby Fischer vs John Bennett (Kejuaraan Junior AS) — Putih melangkah. Langkah pengalihan mana yang dipilih Fischer untuk memenangkan materi?",
    pilihan: ["Qxc3+", "Rd8+", "Ba4", "Bc4"],
    kunci: 1,
  },
  {
    kategori: "grandmaster",
    fen: "6k1/1p3p2/p2prPq1/8/7p/2Q5/PP3RP1/6K1 w - - 0 66",
    orientasi: "w",
    langkahBenar: { from: "c3", to: "c8" },
    soal: "Boris Spassky vs Bent Larsen (Palma de Mallorca) — Putih melangkah. Langkah menteri mana yang mengawali rangkaian kemenangan Spassky?",
    pilihan: ["Qb4", "Qa5", "Qc8+", "Qc4"],
    kunci: 2,
  },
  {
    kategori: "grandmaster",
    fen: "2r5/pp1b4/4p3/3pPk2/5P2/8/1K6/3R2R1 w - - 0 35",
    orientasi: "w",
    langkahBenar: { from: "d1", to: "d4" },
    soal: "Garry Kasparov vs Alexei Shirov (Astana) — Putih melangkah. Langkah tenang namun mematikan mana yang mengurung raja Hitam di tengah papan?",
    pilihan: ["Rxd5", "Rg5+", "Ka3", "Rd4"],
    kunci: 3,
  },
  {
    kategori: "grandmaster",
    fen: "1r4k1/p5pp/4q3/2Qn1pP1/3p4/Pr2PN2/1P1B1P1P/KR6 b - - 0 26",
    orientasi: "b",
    langkahBenar: { from: "d5", to: "c3" },
    soal: "Boris Gelfand vs Vladimir Kramnik (Piala Klub Eropa) — Hitam melangkah. Manuver kuda brilian mana yang dimainkan Kramnik?",
    pilihan: ["Nc3", "Rxa3+", "Qxe3", "Nxe3"],
    kunci: 0,
  },
  {
    kategori: "grandmaster",
    fen: "5Qbk/1p6/2p4p/5Kp1/P3n3/4B2P/1P4B1/3q4 b - - 0 37",
    orientasi: "b",
    langkahBenar: { from: "d1", to: "d7" },
    soal: "Giovanni Vescovi vs Viswanathan Anand (Sao Paulo) — Hitam melangkah. Langkah perburuan raja mana yang dimainkan Juara Dunia Anand?",
    pilihan: ["Qxa4", "Qd7+", "Nd6+", "Ng3+"],
    kunci: 1,
  },
  {
    kategori: "grandmaster",
    fen: "k7/1p1q1pp1/p2p4/P2P2P1/4R2r/7r/KPP1Q1R1/8 b - - 0 33",
    orientasi: "b",
    langkahBenar: { from: "d7", to: "a4" },
    soal: "Jonathan Tisdall vs Judit Polgar (Reykjavik Open) — Hitam melangkah. Serangan menteri mana yang dipilih Judit Polgar untuk membongkar sayap ratu?",
    pilihan: ["Rxe4", "Ra3+", "Qa4+", "Kb8"],
    kunci: 2,
  },
  {
    kategori: "grandmaster",
    fen: "3R4/1r3pkp/3Np1bp/n3P3/2B5/7P/6P1/6K1 w - - 0 40",
    orientasi: "w",
    langkahBenar: { from: "d6", to: "e8" },
    soal: "Vassily Ivanchuk vs Boris Gelfand (Tal Memorial Moskow) — Putih melangkah. Lompatan kuda mana yang memaksa jaringan taktik kemenangan?",
    pilihan: ["Nxb7", "Nxf7", "Bxe6", "Ne8+"],
    kunci: 3,
  },
  {
    kategori: "grandmaster",
    fen: "8/8/8/1Q6/3N2K1/kp2P3/3n1PP1/4q3 w - - 0 55",
    orientasi: "w",
    langkahBenar: { from: "b5", to: "b3" },
    soal: "Magnus Carlsen vs Wesley So (Superbet Poland Rapid) — Putih melangkah. Pengorbanan menteri mengejutkan mana yang dimainkan Carlsen?",
    pilihan: ["Qxb3+", "Nxb3", "Qa6+", "Qc5+"],
    kunci: 0,
  },
  {
    kategori: "grandmaster",
    fen: "2b5/k2n1p2/p2q4/5R1B/2p4P/P1b5/KPQ1R3/6r1 b - - 0 37",
    orientasi: "b",
    langkahBenar: { from: "d6", to: "a3" },
    soal: "Gennadij Sagalchik vs Hikaru Nakamura (Kejuaraan Pan-Amerika) — Hitam melangkah. Pukulan pengorbanan menteri mana yang dipilih Nakamura?",
    pilihan: ["Bxb2", "Qxa3+", "Ra1+", "Bb7"],
    kunci: 1,
  },
  {
    kategori: "grandmaster",
    fen: "4r1k1/p1p3np/bp3Qq1/8/3B4/2P2P2/P4P1P/6RK b - - 2 30",
    orientasi: "b",
    langkahBenar: { from: "g6", to: "g1" },
    soal: "Alireza Firouzja vs Levon Aronian (Goldmoney Asian Rapid) — Hitam melangkah. Pengorbanan penutup mana yang mengakhiri partai seketika?",
    pilihan: ["Qxf6", "Qg2+", "Qxg1+", "Rf8"],
    kunci: 2,
  },
  {
    kategori: "grandmaster",
    fen: "r2q2k1/1pp2ppp/8/pP1b4/3Q4/P2P1PP1/4r1BP/2R2RK1 b - - 0 19",
    orientasi: "b",
    langkahBenar: { from: "e2", to: "g2" },
    soal: "Ruben Domingo Nunez vs Alireza Firouzja (2025) — Hitam melangkah. Kombinasi penghancur pelindung raja mana yang dimainkan Firouzja?",
    pilihan: ["Bxf3", "Rb8", "Rc8", "Rxg2+"],
    kunci: 3,
  },
];
