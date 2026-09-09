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
 *
 *  Menambah kategori baru:
 *     1) Tambahkan id di array `DAFTAR_KATEGORI` (mis. "taktik").
 *     2) Tambahkan label terjemahannya di:
 *           src/lib/terjemahan/id/quiz.js  →  quiz.kategori.taktik
 *           src/lib/terjemahan/en/quiz.js  →  quiz.kategori.taktik
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
];

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
    soal: "Istilah apa untuk keadaan ketika raja terancam dan tidak ada cara menyelamatkannya?",
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
      "Mempromosikannya menjadi bidak lain (biasanya menteri)",
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
    soal: "Rokade boleh dilakukan bila raja dan benteng belum pernah bergerak. Mana syarat TAMBAHAN yang benar?",
    pilihan: [
      "Petak antara harus kosong dan raja tidak dalam keadaan skak",
      "Raja boleh berada dalam skak asalkan bentengnya bebas",
      "Petak tujuan raja boleh sedang diserang bidak lawan",
      "Bidak antara boleh menyerang petak yang dilalui raja",
    ],
    kunci: 0,
  },
  {
    kategori: "peraturan",
    soal: "Berapa langkah berturut-turut tanpa bidak dimakan dan tanpa gerakan pion yang membuat partai boleh dinyatakan remis?",
    pilihan: ["10", "25", "50", "75"],
    kunci: 2,
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
    soal: "Bidak yang nilainya paling tinggi adalah?",
    pilihan: ["Raja", "Menteri", "Benteng", "Kuda"],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Gajah berjalan ke arah mana?",
    pilihan: [
      "Lurus horizontal dan vertikal",
      "Diagonal sejauh bebas",
      "Berbentuk huruf L",
      "Satu petak ke segala arah",
    ],
    kunci: 1,
  },
  {
    kategori: "bidak",
    soal: "Benteng bergerak ke arah mana?",
    pilihan: [
      "Lurus horizontal atau vertikal",
      "Diagonal sejauh bebas",
      "Berbentuk huruf L",
      "Dua petak ke depan lalu satu ke samping",
    ],
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
    pilihan: [
      "Benteng dan gajah",
      "Kuda dan benteng",
      "Pion dan raja",
      "Hanya gajah",
    ],
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
    soal: "Kuda paling kuat berada di petak mana pada papan catur?",
    pilihan: ["Sudut papan", "Tepi papan", "Tengah papan", "Baris ke-2"],
    kunci: 2,
  },

  /* ---------------------------------------------------------- skakmat */
  {
    kategori: "skakmat",
    soal: "Skakmat tercepat yang bisa terjadi disebut 'Fool's Mate'. Terjadi dalam berapa langkah?",
    pilihan: ["1 langkah", "2 langkah", "3 langkah", "4 langkah"],
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

  /* ------------------------------------------------------------ taktik */
  {
    kategori: "taktik",
    soal: "Istilah taktik saat satu bidak menyerang dua atau lebih bidak lawan sekaligus adalah?",
    pilihan: ["Pinning", "Fork", "Skewer", "Discovered attack"],
    kunci: 1,
  },
  {
    kategori: "taktik",
    soal: "Taktik ketika sebuah bidak menyerang bidak bernilai tinggi di belakang bidak yang lebih rendah disebut?",
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
    soal: "Taktik mengorbankan bidak untuk menghilangkan atau memaksa penjaga suatu bidak target disebut?",
    pilihan: ["Deflection", "Castling", "Opposition", "Development"],
    kunci: 0,
  },

  /* -------------------------------------------------------- pembukaan */
  {
    kategori: "pembukaan",
    soal: "Pembukaan 'Sicilian Defence' dimulai dengan langkah?",
    pilihan: ["1.e4 e5", "1.e4 c5", "1.d4 d5", "1.c4 e5"],
    kunci: 1,
  },
  {
    kategori: "pembukaan",
    soal: "Pembukaan 'Ruy Lopez' dimulai 1.e4 e5 2.Kf3 Kc6 lalu langkah ketiga Putih biasanya?",
    pilihan: ["3.Gb5", "3.Gc4", "3.d4", "3.Kc3"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "'Italian Game' dimulai 1.e4 e5 2.Kf3 Kc6 3.?",
    pilihan: ["3.Gc4", "3.Gb5", "3.d3", "3.c3"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "Jawaban Hitam yang paling populer menghadapi 1.e4 pada tingkat tinggi adalah?",
    pilihan: ["Sicilian Defence", "Skandinavia", "Car-Kann", "Alekhine"],
    kunci: 0,
  },
  {
    kategori: "pembukaan",
    soal: "Pembukaan yang dimulai 1.d4 d5 2.c4 disebut?",
    pilihan: ["Queen's Gambit", "King's Gambit", "Reti", "English Opening"],
    kunci: 0,
  },

  /* ----------------------------------------------------------- strategi */
  {
    kategori: "strategi",
    soal: "Apa tujuan utama menguasai petak pusat pada fase awal permainan?",
    pilihan: [
      "Membuat raja langsung aman tanpa rokade",
      "Memberi ruang dan meningkatkan aktivitas bidak",
      "Menghindari semua pertukaran",
      "Memaksa lawan memajukan pion tepi",
    ],
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
    pilihan: [
      "Benteng mendapat jalur terbuka untuk menekan posisi lawan",
      "Benteng tidak bisa diserang",
      "Benteng berubah menjadi menteri",
      "Raja otomatis terlindungi",
    ],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Istilah 'bad bishop' biasanya merujuk pada gajah yang?",
    pilihan: [
      "Terhalang oleh pion sendiri sehingga ruang geraknya terbatas",
      "Berada di warna petak yang sama dengan raja lawan",
      "Selalu bernilai kurang dari dua pion",
      "Tidak boleh bergerak diagonal",
    ],
    kunci: 0,
  },
  {
    kategori: "strategi",
    soal: "Mengapa keselamatan raja menjadi prioritas penting dalam middlegame?",
    pilihan: [
      "Raja adalah bidak dengan nilai materi tertinggi",
      "Raja yang terbuka dapat menjadi sasaran serangan langsung",
      "Raja harus selalu berada di tengah papan",
      "Raja tidak boleh bergerak setelah rokade",
    ],
    kunci: 1,
  },

  /* ------------------------------------------------------------ endgame */
  {
    kategori: "endgame",
    soal: "Dalam endgame pion dan raja, apa yang dimaksud opposition?",
    pilihan: [
      "Kedua raja saling berhadapan dengan jarak satu petak",
      "Kedua raja berada di sudut papan",
      "Satu raja menyerang menteri lawan",
      "Dua benteng berada pada file yang sama",
    ],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Pion yang tidak memiliki pion lawan di depannya maupun di file sebelah yang dapat menghentikan lajunya disebut?",
    pilihan: ["Passed pawn", "Isolated king", "Pinned pawn", "Back rank pawn"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Dalam banyak endgame, raja menjadi semakin aktif karena?",
    pilihan: [
      "Raja boleh meninggalkan aturan skak",
      "Jumlah bidak berkurang sehingga ancaman terhadap raja biasanya lebih sedikit",
      "Raja berubah menjadi benteng",
      "Raja mendapat langkah tambahan setiap giliran",
    ],
    kunci: 1,
  },
  {
    kategori: "endgame",
    soal: "Teknik dasar kemenangan endgame benteng yang terkenal dengan posisi benteng di baris keenam dan raja di depan pion disebut?",
    pilihan: ["Lucena", "Philidor", "Sicilian", "Boden"],
    kunci: 0,
  },
  {
    kategori: "endgame",
    soal: "Pertahanan Philidor dalam endgame benteng terutama bertujuan untuk?",
    pilihan: [
      "Mencegah raja lawan maju ke baris keenam/ketiga dan membantu mempertahankan remis",
      "Menukar benteng sendiri dengan pion",
      "Memaksa promosi pion sendiri",
      "Memenangkan menteri dalam tiga langkah",
    ],
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

  /* ---------------------------------------------------------- sejarah */
  {
    kategori: "sejarah",
    soal: "Catur modern dipercaya berasal dari negara mana?",
    pilihan: ["India", "Cina", "Persia", "Rusia"],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Istilah 'checkmate' dalam bahasa Indonesia, konon berasal dari bahasa Persia 'shah mat' yang berarti?",
    pilihan: [
      "Raja telah mati / raja terperangkap",
      "Putih menang",
      "Seri",
      "Waktu habis",
    ],
    kunci: 0,
  },
  {
    kategori: "sejarah",
    soal: "Berapa jumlah bidak di atas papan ketika partai baru dimulai (kedua pemain)?",
    pilihan: ["16", "24", "32", "64"],
    kunci: 2,
  },
  {
    kategori: "sejarah",
    soal: "Organisasi pecatur dunia yang menyelenggarakan kejuaraan dunia adalah?",
    pilihan: ["FIDE", "USCF", "AFC", "WCC"],
    kunci: 0,
  },

  /* ------------------------------------------------------------- umum */
  {
    kategori: "umum",
    soal: "Dalam jam catur, istilah untuk kehabisan waktu hingga kalah adalah?",
    pilihan: ["Flag fall", "Castle", "Blunder", "En prise"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Sebuah langkah yang sangat buruk dan biasanya membuat posisi langsung kalah disebut?",
    pilihan: ["Brilliancy", "Blunder", "Novelty", "Prepared line"],
    kunci: 1,
  },
  {
    kategori: "umum",
    soal: "Jenis kontrol waktu yang memberi waktu singkat tiap langkah (misal 3 menit + 2 detik/langkah) dikenal sebagai?",
    pilihan: ["Blitz", "Korespondensi", "Rapid klasik", "Sesuai keinginan"],
    kunci: 0,
  },
  {
    kategori: "umum",
    soal: "Bila seorang pemain mempromosikan pion bukan menjadi menteri (mis. kuda), istilahnya?",
    pilihan: ["Underpromotion", "Overpromotion", "Intermezzo", "Zwischenzug"],
    kunci: 0,
  },
];
