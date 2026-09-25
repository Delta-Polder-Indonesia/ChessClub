/**
 * Kamus Indonesia (ID) · teks komentator — dipakai lewat kunci papan.komentator.* dan
 * tekaTeki.komentator.* (lihat komentator.js di berkas papan/tekaTeki).
 * Blok ini diimpor oleh papan.js dan tekaTeki.js.
 *
 * Setiap kategori WAJIB punya minimal sejumlah varian yang diminta mesin
 * (lihat tambah()/tambahSoal()/peristiwaUtama() di src/lib/komentator.js):
 * mesin memilih varian lewat hash, jadi varian yang kurang membuat kunci
 * mentah bocor ke UI. Placeholder memakai nama kunci kamus ({pihak}, {san},
 * {lawan}, {petak}, {bidak}, {korban}, {pembukaan}, {unggul}, {nilai},
 * {mat}, {saran}, {awan}) — mesin komentator yang mengisinya, bukan bahasa
 * teksnya.
 */

/** komentator untuk Papan Interaktif — kunci aslinya papan.komentator.* */
export const komentatorPapan = {
  judul: "Komentator Papan",
  keterangan: "Analisis dan narasi kontekstual real-time berdasarkan dinamika posisi.",
  nyalakan: "Nyalakan komentator",
  matikan: "Matikan komentator",
  gayaLabel: "Gaya Narasi",
  gayaSantai: "Kasual & Komprehensif",
  gayaFormal: "Analitis & Profesional",
  gayaGenZ: "Ekspresif & Modern",
  menunggu: "Menunggu langkah pertama...",
  posisiAwal: "Papan siap. Putih memegang inisiatif awal.",
  menilai: "Menghitung variasi...",
  pihak: { putih: "Putih", hitam: "Hitam" },
  bidak: { p: "pion", n: "kuda", b: "gajah", r: "benteng", q: "menteri", k: "raja" },
  santai: {
    biasa: [
      "{pihak} memainkan {san}. Langkah penguatan posisi tanpa menciptakan kelemahan baru.",
      "{san}. {pihak} mengamankan petak penting dan mengontrol tempo.",
      "{pihak} menggeser {bidak} ke {petak}. Fokus pada struktur dan harmonisasi perwira.",
      "{san} dimainkan. Kedua pihak masih saling mengukur jarak serangan.",
    ],
    buku: [
      "{san} — masih dalam perimeter teori {pembukaan}. Struktur baku yang kokoh.",
      "Langkah klasik {san} dari {pembukaan}. Pertarungan pemahaman teori dimulai.",
      "Memasuki jalur {pembukaan} via {san}. Kedua pihak memainkan pola yang sangat dikenal.",
    ],
    tangkap: [
      "{pihak} mengeksekusi {korban} di {petak}. Pertukaran material resmi dimulai.",
      "Pertukaran di {petak}! {pihak} mengambil {korban} dan mengubah konfigurasi papan.",
      "{san} — {korban} tersapu. Kita lihat bagaimana {lawan} menyeimbangkan kembali posisi.",
    ],
    tangkapUntung: [
      "Kalkulasi jitu dari {pihak}! {korban} jatuh di {petak} dengan harga murah.",
      "{san}! Keuntungan material bersih untuk {pihak}. {lawan} kebobolan di sayap ini.",
    ],
    tangkapMenteri: [
      "Bencana di {petak}! Menteri {lawan} terperangkap dan berhasil dieksekusi {pihak}.",
      "{pihak} menjatuhkan menteri lawan lewat {san}. Jalur kemenangan terbuka lebar!",
    ],
    skak: [
      "Ancaman langsung! {san} memberi skak dan memaksa respon instan dari {lawan}.",
      "Skak! {pihak} mengambil alih inisiatif, raja {lawan} kehilangan koordinasi.",
      "{san}+ — raja {lawan} terusik dan harus melakukan kompromi posisi.",
    ],
    skakTambahan: [
      "Serangan ganda! Selain langkah taktis, ini juga memberi skak langsung.",
      "Plus skak! Tekanan berlapis yang membuat {lawan} kesulitan bernapas.",
    ],
    skakSatuJalan: [
      "Pilihan tertutup — {lawan} dipaksa melakukan satu-satunya langkah pertahanan yang sah.",
    ],
    rokadePendek: [
      "{pihak} mengamankan raja lewat rokade pendek sekaligus mengaktifkan benteng.",
      "Rokade sayap raja. Struktur benteng pertahanan {pihak} kini solid.",
    ],
    rokadePanjang: [
      "Rokade panjang dari {pihak}! Sinyal agresif untuk saling serang di sayap berlawanan.",
      "{pihak} memilih benteng sayap menteri. Permainan akan berubah menjadi sangat tajam.",
    ],
    enPassant: [
      "Eksekusi en passant! Taktik penangkapan pion melintas yang presisi dari {pihak}.",
      "{san} via en passant. Momen taktis langka yang dimanfaatkan dengan baik.",
    ],
    promosi: [
      "Pion {pihak} berhasil menembus barikade dan berpromosi menjadi {bidak} di {petak}!",
      "Hasil transformasi panjang — {pihak} menyambut {bidak} baru di baris akhir!",
    ],
    lawanMenggantung: [
      "Kelemahan terdeteksi: {bidak} {lawan} di {petak} berdiri tanpa perlindungan yang cukup.",
      "Perhatikan {petak} — {bidak} {lawan} di sana rawan menjadi sasaran taktis.",
    ],
    sendiriMenggantung: [
      "Celah pertahanan! {bidak} {pihak} di {petak} kini tidak terjaga.",
      "Perlu waspada: posisi {bidak} di {petak} memicu potensi counter-attack lawan.",
    ],
    paksa: [
      "Langkah yang tak terhindarkan dalam rantai taktis ini.",
      "Tidak ada opsi alternatif; {san} adalah keharusan teknis.",
    ],
    nilaiBrilian: [
      "Langkah brilian!! Pengorbanan kalkulatif yang membongkar pertahanan {lawan}!",
      "{san} — ide fantastis! Langkah bernilai seni tinggi yang memutarbalikkan logika posisi.",
      "Brilian! Sebuah penemuan taktis tingkat tinggi dari {pihak}.",
    ],
    nilaiHebat: [
      "Sangat tajam! {pihak} menemukan solusi paling beracun di posisi ini.",
      "Langkah kritis! {san} langsung mengeksploitasi celah terkecil dari lawan.",
      "Presisi luar biasa. {pihak} mengeksekusi keunggulan tanpa ragu.",
    ],
    nilaiTerbaik: [
      "Akurat. {san} adalah opsi paling optimal menurut kalkulasi mesin.",
      "Pilihan utama di posisi ini. {pihak} menjaga efisiensi serangan secara maksimal.",
      "Langkah ideal. Keseimbangan antara pertahanan dan tekanan terjaga sempurna.",
    ],
    nilaiUnggul: [
      "Solid dan kuat. Keunggulan posisi {pihak} terjaga dengan baik.",
      "{san} mempertahankan kontrol ruang tanpa memberi lawan peluang balasan.",
      "Langkah yang sangat baik untuk menjaga tekanan jangka panjang.",
    ],
    nilaiLayak: [
      "Cukup wajar. Pilihan yang aman walau ada alternatif yang lebih berani.",
      "{san} tidak merusak struktur, tetapi sedikit meleset dari momentum terbaik.",
      "Langkah standar yang mempertahankan stabilitas posisi.",
    ],
    nilaiKeliru: [
      "Sedikit tidak presisi. {pihak} melepaskan sebagian kontrol pusat.",
      "{san} memberi {lawan} sedikit ruang untuk menata ulang perwiranya.",
      "Kurang menggigit. Keunggulan yang tadinya dipegang mulai menyusut.",
    ],
    nilaiKesalahan: [
      "Kesalahan taktis! {san} membuka celah berbahaya di sayap pertahanan.",
      "Posisi {pihak} melonggar. Lawan kini memiliki target serangan yang jelas.",
      "Kompromi yang tidak perlu — momentum bergeser ke pihak {lawan}.",
    ],
    nilaiKelewat: [
      "Peluang emas terlewat! Ada kombinasi yang jauh lebih mematikan di posisi ini.",
      "{pihak} melewatkan taktik penentu. Tekanan kini berkurang drastis.",
      "Sayang sekali, eksekusi yang bisa mengakhiri perlawanan justru terabaikan.",
    ],
    nilaiBlunder: [
      "BLUNDER FATAL! {san} meruntuhkan struktur dan menyerahkan keunggulan!",
      "Bencana posisi! {pihak} melakukan kesalahan berat yang berharga mahal.",
      "Pengawasan yang berakibat fatal. Posisi {pihak} kini berada di ambang kekalahan.",
    ],
    lebihKuat: [
      "Langkah alternatif yang jauh lebih beracun: {saran}.",
      "Kalkulasi menunjukkan {saran} memberikan tekanan yang lebih menentukan.",
    ],
    seimbang: [
      "Dari sudut pandang {pihak}, posisi ini pada dasarnya seimbang; permainan tetap berada dalam dinamika yang netral.",
      "Evaluasi menunjukkan posisi imbang penuh. Kemenangan akan ditentukan oleh ketelitian manuver.",
      "Dinamika papan masih setara. Kedua pihak memiliki kompensasi posisional yang seimbang.",
    ],
    unggulTipis: [
      "{unggul} memegang keunggulan posisional tipis (+{nilai}). Tekanan mulai terasa.",
      "Inisiatif mulai condong ke {unggul} dengan marjin (+{nilai}) pion.",
    ],
    unggulJelas: [
      "Dominasi {unggul} semakin terlihat tegas dengan marjin evaluasi +{nilai}.",
      "Posisi {unggul} sangat menguntungkan. Kontrol ruang dan aktivitas perwira unggul mutlak.",
    ],
    unggulMenang: [
      "Posisi menang teknis untuk {unggul} (+{nilai}). Tinggal masalah konversi akhir.",
      "Keunggulan mutlak bagi {unggul}. Struktur perlawanan lawan sudah hancur.",
    ],
    unggulMat: [
      "Pola mat paksa terdeteksi! {unggul} mengunci kemenangan dalam {mat} langkah.",
      "Jalur mat tak terhindarkan untuk {unggul} ({mat} langkah lagi).",
    ],
    skakmat: [
      "SKAKMAT! Pertarungan berakhir dengan kemenangan mutlak untuk {pihak}!",
      "Kombinasi penutup yang indah — skakmat oleh {pihak}!",
      "Selesai! Raja {lawan} kehabisan ruang gerak — skakmat untuk {pihak}.",
    ],
    pat: [
      "Pat (Stalemate)! Raja tidak memiliki langkah legal namun tidak diskak. Partai berakhir remis.",
      "Kebuntuan taktis! Posisi berakhir remis secara otomatis.",
    ],
    remis: [
      "Partai dinyatakan remis setelah kesepakatan atau evaluasi mati.",
      "Keseimbangan abadi — partai selesai tanpa pemenang.",
    ],
    remisUlang: [
      "Remis otomatis akibat pengulangan posisi (Threefold Repetition).",
      "Posisi yang sama muncul untuk ketiga kalinya. Partai dinyatakan remis.",
    ],
    remisMaterial: [
      "Remis karena amunisi material tidak mencukupi untuk melakukan skakmat.",
      "Sisa bidak di papan tidak lagi cukup untuk memaksa skakmat. Remis.",
    ],
    ajakEngine: [
      "Aktifkan mesin analisis untuk melihat evaluasi objektif dan grafik keunggulan.",
      "Nyalakan engine untuk membandingkan langkah ini dengan pilihan terbaik mesin.",
    ],
    awan: [
      "Catatan basis data cloud: Langkah terbaik sebelumnya adalah {awan} (evaluasi {nilai}).",
      "Rujukan Cloud DB untuk posisi tadi: {awan} dengan skor {nilai}.",
    ],
    // Kunci taktis spesifik (fork / skak bayangan / pin) & variasi posisi.
    fork: [
      "SERANGAN GANDA! {bidak} {pihak} di {petak} menggarpu dua sasaran sekaligus!",
      "Taktik fork yang mematikan! {lawan} tidak bisa menyelamatkan kedua perwiranya.",
      "{pihak} meluncurkan serangan ganda di {petak}. Salah satu perwira {lawan} pasti jatuh.",
    ],
    skakBayangan: [
      "Skak bayangan! Geseran {bidak} {pihak} membongkar serangan tersembunyi ke raja {lawan}!",
      "Ancaman berlapis: perwira bergeser, dan jalur skak langsung terbuka lebar!",
    ],
    terpaku: [
      "Perwira {lawan} di {petak} kini terpaku (pin) - tidak bisa bergerak tanpa mengorbankan sasaran di belakangnya.",
      "Pin yang tidak menyenangkan bagi {lawan}. Perwiranya terkunci di {petak}.",
    ],
    seimbangDinamis: [
      "Dari sudut pandang {pihak}, posisi ini pada dasarnya seimbang; tidak ada pihak yang memiliki keunggulan yang jelas.",
      "Keseimbangan dinamis terjaga. Perkembangan normal dan permainan yang solid akan menjaga posisi tetap utuh.",
      "Papan berada dalam status penetralan mutlak. Struktur dan aktivitas kedua pihak saling mengimbangi.",
      "Evaluasi menunjukkan kesetaraan penuh. Pertarungan akan ditentukan oleh akurasi di babak akhir (endgame).",
    ],
    unggulStruktur: [
      "{pihak} memegang keunggulan struktur pion jangka panjang. Posisi {lawan} memiliki banyak celah pasif.",
      "Meski material sama, kontrol ruang dan mobilitas perwira {pihak} jauh lebih dominan.",
    ],
    posisiTajam: [
      "Posisi menjadi sangat tajam! Satu langkah salah bisa langsung mengubah evaluasi secara drastis.",
      "Permainan memasuki jalur taktis beracun - kalkulasi presisi sangat dibutuhkan sekarang.",
    ],
  },

  formal: {
    biasa: [
      "{pihak} menginstruksikan {san}. Menguatkan struktur pertahanan pusat.",
      "{san} dimainkan oleh {pihak}. Konsolidasi posisional secara bertahap.",
      "{pihak} memindahkan {bidak} menuju {petak}. Penguasaan petak strategis.",
      "{san} dimainkan. Posisi tetap stabil tanpa perubahan evaluasi yang berarti.",
    ],
    buku: [
      "Keluarga teori {pembukaan}. {pihak} mengeksekusi {san} sesuai doktrin baku.",
      "Variasi {pembukaan}. Struktur permainan mengikuti rekam jejak grandmaster.",
      "{san} tetap berada dalam korpus teori {pembukaan}.",
    ],
    tangkap: [
      "Pertukaran material: {pihak} mengeliminasi {korban} di petak {petak}.",
      "{san}. Penghapusan perwira di {petak} merubah konfigurasi taktis.",
      "{pihak} menangkap {korban} di {petak}; keseimbangan material mulai bergeser.",
    ],
    tangkapUntung: [
      "Keuntungan material bersih diraih {pihak} melalui penangkapan {korban} di {petak}.",
      "{pihak} memperoleh {korban} di {petak} dengan imbalan material yang minimal.",
    ],
    tangkapMenteri: [
      "Poin kritis: Menteri {lawan} tereliminasi di {petak}. Ketimpangan material ekstrim.",
      "Menteri {lawan} gugur di {petak}. Evaluasi material berubah secara signifikan.",
    ],
    skak: [
      "Skak. {pihak} memaksa {lawan} merespon ancaman langsung terhadap raja.",
      "{pihak} memberikan skak; {lawan} wajib menanggulangi ancaman terhadap rajanya.",
      "Skak dari {pihak}. Opsi respons {lawan} terbatas pada penanganan ancaman raja.",
    ],
    skakTambahan: [
      "Langkah kalkulatif ini sekaligus melayangkan skak terhadap raja lawan.",
      "Selain efek utamanya, langkah ini turut memberikan skak.",
    ],
    skakSatuJalan: [
      "Hanya terdapat satu respon legal yang dapat dimainkan oleh {lawan}.",
    ],
    rokadePendek: [
      "{pihak} melakukan rokade sayap raja. Amankan raksasa dan hubungkan benteng.",
      "Rokade sayap raja dieksekusi {pihak}; raja dan benteng kini terkoordinasi.",
    ],
    rokadePanjang: [
      "{pihak} melaksanakan rokade sayap menteri. Mempersiapkan perang konfrontatif.",
      "Rokade sayap menteri oleh {pihak}. Struktur posisi berpotensi mengeras.",
    ],
    enPassant: [
      "Penangkapan khusus en passant dieksekusi oleh {pihak}.",
      "{pihak} memanfaatkan aturan en passant pada posisi ini.",
    ],
    promosi: [
      "Pion {pihak} mencapai baris akhir dan dipromosikan menjadi {bidak} di {petak}.",
      "Promosi pada {petak}: pion {pihak} bertransformasi menjadi {bidak}.",
    ],
    lawanMenggantung: [
      "Analisis posisi: Perwira {lawan} di {petak} berada dalam status tidak dijaga.",
      "Perwira {lawan} pada {petak} tidak memiliki penjaga yang memadai.",
    ],
    sendiriMenggantung: [
      "Kerentanan: {bidak} {pihak} pada petak {petak} terisolasi tanpa perlindungan.",
      "{bidak} {pihak} di {petak} rentan menjadi target taktis {lawan}.",
    ],
    paksa: [
      "Langkah paksa berdasarkan kausalitas taktis papan.",
      "Kondisi papan tidak menyediakan alternatif lain yang sah.",
    ],
    nilaiBrilian: [
      "Langkah brilian. Pengorbanan yang valid secara teoritis dan matematis.",
      "Temuan taktis luar biasa. Kompleksitas posisi dipecahkan dengan tepat.",
      "Kualitas langkah berada di luar perhitungan konvensional; konsekuensinya menentukan.",
    ],
    nilaiHebat: [
      "Respon sangat kuat. {pihak} menemukan jalur paling efektif di posisi ini.",
      "Akurasi tinggi. {pihak} memilih kontinuasi dengan evaluasi terbaik.",
      "Solusi optimal pada momen kritis; tekanan terhadap {lawan} terjaga.",
    ],
    nilaiTerbaik: [
      "Langkah optimal sesuai perhitungan mesin analisis.",
      "Rekomendasi utama mesin. Tidak terdapat alternatif dengan evaluasi setara.",
      "{pihak} mengeksekusi varian dengan selisih evaluasi terkecil.",
    ],
    nilaiUnggul: [
      "Langkah akurat yang mengonsolidasi keunggulan posisi.",
      "Pemeliharaan keunggulan yang tepat; tanpa konsesi posisional berarti.",
      "{pihak} mempertahankan parameter evaluasi pada tingkat menguntungkan.",
    ],
    nilaiLayak: [
      "Langkah fleksibel; mempertahankan kesetaraan posisi tanpa risiko.",
      "Alternatif yang dapat diterima, walau bukan yang paling efisien.",
      "Pilihan yang memenuhi syarat minimal tanpa kehilangan inisiatif.",
    ],
    nilaiKeliru: [
      "Inakurasi kecil. Mengurangi efisiensi kontrol ruang milik {pihak}.",
      "Deviasi minor dari garis optimal; dampaknya terbatas namun terukur.",
      "{pihak} mengorbankan sebagian presisi posisi demi kesederhanaan eksekusi.",
    ],
    nilaiKesalahan: [
      "Kesalahan posisional. Memberi peluang lawan untuk mengambil inisiatif.",
      "Evaluasi memburuk secara jelas; {lawan} memperoleh keuntungan posisional.",
      "Kesalahan taktis yang membuka peluang serangan bagi {lawan}.",
    ],
    nilaiKelewat: [
      "Inovasi taktis terlewatkan. Kemenangan cepat gagal dieksekusi.",
      "Terdapat kontinuasi lebih kuat yang tidak dimanfaatkan {pihak}.",
      "Peluang konversi keunggulan terabaikan; jalur optimal tidak dieksekusi.",
    ],
    nilaiBlunder: [
      "Blunder fatal. Mengubah evaluasi posisi secara drastis ke arah kerugian.",
      "Kesalahan berat. Evaluasi posisi berbalik menguntungkan {lawan}.",
      "Kerugian material atau posisional besar yang sulit dipulihkan {pihak}.",
    ],
    lebihKuat: [
      "Rekomendasi mesin utama: {saran}.",
      "Mesin mengindikasikan {saran} sebagai alternatif superior.",
    ],
    seimbang: [
      "Keseimbangan penuh tercapai. Tidak ada keunggulan material maupun posisional yang signifikan.",
      "Evaluasi setara bagi kedua belah pihak; tidak ada pihak yang memegang inisiatif tegas.",
      "Posisi bersifat netral; hasil akhir ditentukan oleh ketelitian eksekusi.",
    ],
    unggulTipis: [
      "Keunggulan marginal memihak {unggul} dengan estimasi +{nilai}.",
      "{unggul} memegang inisiatif tipis pada marjin +{nilai}.",
    ],
    unggulJelas: [
      "Keunggulan subtansial diraih oleh {unggul} pada marjin +{nilai}.",
      "Kontrol posisi berpihak pada {unggul} dengan evaluasi +{nilai}.",
    ],
    unggulMenang: [
      "Posisi dimenangkan secara teoritis oleh {unggul} (+{nilai}).",
      "Keunggulan {unggul} pada +{nilai} cukup untuk mengarah pada kemenangan.",
    ],
    unggulMat: [
      "Skakmat paksa dihitung dalam {mat} langkah untuk {unggul}.",
      "Mesin mendeteksi rangkaian mat dalam {mat} langkah yang menguntungkan {unggul}.",
    ],
    skakmat: [
      "Skakmat. Konfrontasi berakhir.",
      "Skakmat. {pihak} mengakhiri permainan tanpa respons lanjutan dari lawan.",
      "Posisi terminal: skakmat untuk {pihak}.",
    ],
    pat: [
      "Stalemate. Hasil dinyatakan remis berdasarkan regulasi.",
      "Tidak terdapat langkah legal, namun raja tidak dalam keadaan skak. Remis.",
    ],
    remis: [
      "Hasil akhir: Remis.",
      "Permainan berakhir tanpa pemenang berdasarkan kesepakatan atau regulasi.",
    ],
    remisUlang: [
      "Remis terkonfirmasi akibat Threefold Repetition.",
      "Posisi identik terjadi tiga kali; partai dinyatakan remis.",
    ],
    remisMaterial: [
      "Remis terkonfirmasi: Insufficient Material.",
      "Material tersisa tidak memadai untuk memaksakan skakmat. Remis.",
    ],
    ajakEngine: [
      "Aktifkan modul engine untuk kalkulasi matematis yang presisi.",
      "Nyalakan engine untuk memperoleh evaluasi kuantitatif atas posisi ini.",
    ],
    awan: [
      "Kueri Cloud Database: Langkah optimal sebelumnya {awan} (skor {nilai}).",
      "Basis data awan merekomendasikan {awan} dengan nilai {nilai}.",
    ],
    // Kunci taktis spesifik (fork / skak bayangan / pin) & variasi posisi.
    fork: [
      "Serangan ganda: {bidak} {pihak} di {petak} menyerang dua perwira lawan secara simultan.",
      "Taktik fork terdeteksi. {lawan} harus memilih perwira mana yang dikorbankan.",
      "{pihak} menerapkan serangan ganda dari {petak}; salah satu perwira {lawan} akan hilang.",
    ],
    skakBayangan: [
      "Skak bayangan: pergeseran {bidak} {pihak} membuka jalur serangan tersembunyi terhadap raja {lawan}.",
      "Ancaman berlapis - perwira bergeser dan garis skak menjadi terbuka.",
    ],
    terpaku: [
      "Perwira {lawan} di {petak} berada dalam status terpaku (pin); pergerakannya membuka rajanya.",
      "Pin taktis terhadap perwira {lawan} di {petak}; mobilitasnya terbatas secara absolut.",
    ],
    seimbangDinamis: [
      "Dari sudut pandang {pihak}, posisi ini pada dasarnya seimbang; tidak ada pihak yang memiliki keunggulan yang jelas.",
      "Keseimbangan dinamis terjaga. Perkembangan normal dan permainan yang solid akan menjaga posisi tetap utuh.",
      "Papan berada dalam status penetralan mutlak. Struktur dan aktivitas kedua pihak saling mengimbangi.",
      "Evaluasi menunjukkan kesetaraan penuh. Pertarungan akan ditentukan oleh akurasi di babak akhir (endgame).",
    ],
    unggulStruktur: [
      "{pihak} memegang keunggulan struktur pion jangka panjang. Posisi {lawan} memiliki banyak celah pasif.",
      "Meski material setara, kontrol ruang dan mobilitas perwira {pihak} jauh lebih dominan.",
    ],
    posisiTajam: [
      "Posisi menjadi sangat tajam. Satu langkah tidak akurat dapat mengubah evaluasi secara drastis.",
      "Permainan memasuki jalur taktis beracun; kalkulasi presisi menjadi prasyarat.",
    ],
  },

  genZ: {
    biasa: [
      "{pihak} main {san}. Tetap tenang, baru pemanasan.",
      "{san} dari {pihak}. Menyusun formasi tanpa bikin gerakan sia-sia.",
      "{bidak} geser ke {petak}. Masih fase setup, belum ada drama.",
      "{san}. Mengamankan tempo, membiarkan lawan mikir keras.",
    ],
    buku: [
      "{san} masih sesuai modul {pembukaan}. Teori dasar tuntas.",
      "Masuk skenario {pembukaan}. {pihak} maen rapi sesuai blueprint.",
      "{san} persis jalur {pembukaan}. Semua orang hafal ini.",
    ],
    tangkap: [
      "{pihak} langsung sikat {korban} di {petak}. Material berpindah tangan.",
      "{san}! {korban} kena bersihkan. Papan mulai bersih.",
      "{pihak} ambil {korban} di {petak}. Susunan material langsung berubah.",
    ],
    tangkapUntung: [
      "{pihak} panen {korban} pakai {bidak} di {petak}. Cuan material murni!",
      "{san}! Dapet untung gratisan, lawan kebobolan taktik.",
    ],
    tangkapMenteri: [
      "MENTERI HILANG! {pihak} jebak menteri di {petak}. Game over secara mental!",
      "{pihak} raih menteri di {petak}. Lawan kehilangan bidak terkuatnya!",
    ],
    skak: [
      "Skak! {pihak} maksa raja lawan buat cari tempat berlindung.",
      "{san}+! Tempo diambil alih, pertahanan lawan dikagetkan.",
      "Skak lagi! Raja lawan nggak bisa diem aja sekarang.",
    ],
    skakTambahan: [
      "Plus skak ganda! Lawan makin pusing ngatur pertahanan.",
      "Bonus skak di atasnya. Lawan dapat dua tugas sekaligus.",
    ],
    skakSatuJalan: [
      "Tersisa satu petak legal. Nggak ada pilihan lain buat lawan.",
    ],
    rokadePendek: [
      "{pihak} rokade pendek. Raja langsung masuk bunker aman.",
      "Rokade pendek beres. Benteng {pihak} akhirnya ikut hidup.",
    ],
    rokadePanjang: [
      "{pihak} rokade panjang! Tanda perang terbuka di kedua sayap.",
      "Rokade panjang dipilih. Posisi berubah jadi panas.",
    ],
    enPassant: [
      "En passant dimainkan! Taktik klasik yang selalu bikin kaget.",
      "Pakai en passant. Aturan langka tapi tetap sah.",
    ],
    promosi: [
      "Promosi! Pion keci {pihak} resmi jadi {bidak} di {petak}!",
      "Level up! Pion {pihak} naik jadi {bidak} di {petak}.",
    ],
    lawanMenggantung: [
      "Lihat {petak} — {bidak} lawan ditinggal tanpa pengawal.",
      "{bidak} lawan di {petak} kayak nunggu diambil aja.",
    ],
    sendiriMenggantung: [
      "Warning: {bidak} {pihak} di {petak} rawan dicuri lawan.",
      "{bidak} {pihak} di {petak} hampir nggak ada yang jagain.",
    ],
    paksa: [
      "Langkah paksa. Garis taktisnya cuma punya satu jalur.",
      "Nggak ada pilihan lain. Papan yang mutusin.",
    ],
    nilaiBrilian: [
      "BRILIAN! {san} itu pengorbanan genius level Grandmaster!",
      "Langkah mahakarya! {pihak} bikin papan meledak lewat {san}!",
      "Nggak nyangka! {pihak} nemu ide yang mustahil kelihatan biasa.",
    ],
    nilaiHebat: [
      "Langkah berkelas! {pihak} nemu kunci pembuka pertahanan lawan.",
      "Tajam banget. {pihak} ambil jalur paling beracun di sini.",
      "Presisi! {pihak} eksekusi tanpa ragu-ragu.",
    ],
    nilaiTerbaik: [
      "Akurat 100%. {san} itu jalur paling sempurna dari engine.",
      "Pas di target. {san} memang jawaban terbaiknya.",
      "Nggak ada yang lebih baik dari {san} di posisi ini.",
    ],
    nilaiUnggul: [
      "Kuat banget. {san} bikin posisi {pihak} makin susah ditembus.",
      "Solid. {pihak} tetap pegang kendali penuh.",
      "Langkah aman yang tetap menjaga keunggulan {pihak}.",
    ],
    nilaiLayak: [
      "Aman. Bukan yang paling tajam, tapi tidak bikin masalah.",
      "Wajar aja. {san} jalan, walau ada opsi lebih berani.",
      "Cukup oke. Posisi {pihak} tetap terjaga.",
    ],
    nilaiKeliru: [
      "Agak meleset. Inisiatifnya jadi sedikit berkurang.",
      "Kurang pas dikit. {lawan} dapet ruang napas.",
      "Hampir tepat, tapi {san} sedikit melepas kontrol.",
    ],
    nilaiKesalahan: [
      "Mistake! {san} bikin keunggulan melayang ke tangan lawan.",
      "Posisi {pihak} mulai bocor. {lawan} dapet lahan serangan.",
      "Kesalahan taktis! {san} bikin {pihak} harus bertahan.",
    ],
    nilaiKelewat: [
      "Kesempatan emas lewat begitu saja! Taktiknya nggak terambil.",
      "Sayang, {pihak} melewatkan langkah yang jauh lebih mematikan.",
      "Taktik kunci kelewat. Tekanan {pihak} langsung turun.",
    ],
    nilaiBlunder: [
      "BLUNDER PARAH! {san} merusak seluruh rencana pertahanan!",
      "Fatal! Posisi {pihak} runtuh total gara-gara {san}.",
      "Nggak ketahan lihat! {pihak} nyerahin keunggulan sendiri.",
    ],
    lebihKuat: [
      "Saran terbaik engine sebenarnya: {saran}.",
      "Kalau teliti, {saran} jauh lebih mengigit di sini.",
    ],
    seimbang: [
      "Posisi benar-benar imbang. Siapa yang paling teliti dia yang menang.",
      "Belum ada yang unggul. Semua masih terbuka.",
      "Setara total. Sekarang tinggal soal siapa salah dulu.",
    ],
    unggulTipis: [
      "{unggul} unggul tipis (+{nilai}). Tekanan mulai dibangun.",
      "Sedikit di atas angin {unggul} (+{nilai}). Masih bisa berbalik.",
    ],
    unggulJelas: [
      "{unggul} memegang kendali (+{nilai}). Lawan mulai kehabisan ide.",
      "Kendali jelas di tangan {unggul} (+{nilai}). Ruang gerak lawan makin sempit.",
    ],
    unggulMenang: [
      "{unggul} sudah di atas angin (+{nilai}). Tinggal eksekusi rapi.",
      "Positiv +{nilai} buat {unggul}. Tinggal jangan sampai dibuang.",
    ],
    unggulMat: [
      "Mat paksa terdeteksi! {unggul} kunci kemenangan dalam {mat} langkah.",
      "Jalur mat {mat} langkah buat {unggul}. Nggak ada jalan lolos.",
    ],
    skakmat: [
      "SKAKMAT! Pertandingan ditutup dengan bersih!",
      "Selesai! Raja lawan habis, {pihak} menang.",
      "Mat murni! {pihak} nggak kasih kesempatan sedikit pun.",
    ],
    pat: [
      "Pat! Raja terkunci tanpa skak. Remis instan!",
      "Nggak ada langkah sah tapi raja aman. Otomatis remis.",
    ],
    remis: [
      "Game selesai remis. Pertarungan yang seimbang.",
      "Hasil imbang. Nggak ada yang mau mengalah.",
    ],
    remisUlang: [
      "Pengulangan 3x. Game resmi remis.",
      "Posisi diulang terus. Remis otomatis.",
    ],
    remisMaterial: [
      "Sisa material nggak cukup buat mat. Auto remis.",
      "Bidak tinggal sedikit, nggak bisa maksa mat. Remis.",
    ],
    ajakEngine: [
      "Nyalakan engine buat ngeliat skor akurasi dan garis taktisnya.",
      "Coba nyalain engine, biar keliatan angka objektifnya.",
    ],
    awan: [
      "Data cloud: Langkah paling ideal tadi {awan} (skor {nilai}).",
      "Cek basis data awan: {awan} dinilai {nilai}.",
    ],
    // Kunci taktis spesifik (fork / skak bayangan / pin) & variasi posisi.
    fork: [
      "SERANGAN GANDA! {bidak} {pihak} di {petak} ngarah ke dua sasaran sekaligus!",
      "Fork mematikan! {lawan} nggak bisa nyelamatin dua-duanya.",
      "{pihak} gasang ganda dari {petak}. Satu perwira {lawan} harus dikorbankan.",
    ],
    skakBayangan: [
      "Skak bayangan! {bidak} {pihak} geser dan jalur skak tersembunyi kebuka ke raja {lawan}!",
      "Ancaman berlapis: perwira minggir, skak langsung jalan!",
    ],
    terpaku: [
      "Perwira {lawan} di {petak} kepaku (pin) - gerak sedikit saja rajanya kebuka.",
      "Pin nyebelin buat {lawan}. Perwiranya mentok di {petak}.",
    ],
    seimbangDinamis: [
      "Dari sudut pandang {pihak}, posisi ini pada dasarnya seimbang; nggak ada yang unggul jelas.",
      "Imbang dinamis terjaga. Main normal dan solid, posisi aman.",
      "Papan netral total. Struktur dan aktivitas dua sisi saling imbang.",
      "Evaluasi menunjukkan kesetaraan penuh. Yang menentukan akurasi di endgame.",
    ],
    unggulStruktur: [
      "{pihak} pegang keunggulan struktur pion jangka panjang. Posisi {lawan} banyak celah pasif.",
      "Material sama, tapi kontrol ruang dan mobilitas perwira {pihak} jauh lebih dominan.",
    ],
    posisiTajam: [
      "Posisi jadi sangat tajam! Satu langkah salah bisa langsung mengubah evaluasi total.",
      "Game masuk jalur taktis beracun - butuh kalkulasi presisi sekarang.",
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
      "Teka-teki ini sudah pernah dipecahkan sebelumnya. Uji ketajaman memori kamu!",
    ],
    benar: [
      "Tepat sekali! Lawan terpaksa merespon...",
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
      "Pengorbanan cantik! {bidak} di {petak} diumpankan untuk membongkar bunker raja lawan!",
      "Pengorbanan berani! {bidak} di {petak} sengaja dikorbankan agar benteng pertahanan raja jebol.",
    ],
    selesai: [
      "LUAR BIASA! Teka-teki berhasil dipecahkan dengan skakmat sempurna!",
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
      "Modul Taktis: {pihak} melangkah. Cari skakmat paksa dalam {n} kalkulasi.",
      "Tugas: {pihak} melangkah dan memaksa skakmat dalam {n} langkah.",
      "Kalkulasi {n} langkah dimulai dari {pihak}. Utamakan langkah yang membatasi respons lawan.",
    ],
    mulaiSudah: [
      "Rekam data menunjukkan puzzle ini telah terselesaikan sebelumnya.",
    ],
    benar: [
      "Langkah terverifikasi benar. Menunggu kalkulasi respon lawan.",
      "Kalkulasi valid. Selanjutnya menghitung respons {lawan}.",
      "Eksekusi tepat. Variasi lawan kini dihitung.",
    ],
    lawan: [
      "Respon lawan diterima. Tersisa {sisa} langkah eksekusi.",
      "{lawan} merespons sesuai variasi. Tersisa {sisa} langkah hingga skakmat.",
    ],
    lawanTerakhir: [
      "Fase konklusi: Tentukan langkah akhir skakmat.",
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
      "Keuntungan material {korban} sekunder; prioritas utama adalah kalkulasi skakmat.",
      "Penangkapan {korban} tidak berkontribusi pada rangkaian skakmat.",
    ],
    salahTerakhir: [
      "Langkah akhir wajib memenuhi syarat skakmat mutlak.",
      "Pada langkah penutup, skak saja tidak memenuhi syarat.",
    ],
    ilegal: [
      "Langkah tidak sah secara regulasi catur.",
      "Gerakan ditolak: melanggar aturan legalitas catur.",
    ],
    petunjuk: [
      "Petunjuk kalkulasi: Gerakkan {bidak} dari petak {dari}.",
      "Titik awal kalkulasi: {bidak} pada petak {dari}.",
    ],
    pengorbanan: [
      "Pengorbanan perwira: {bidak} di {petak} dialokasikan untuk destruksi struktur pertahanan.",
      "Dengan sengaja {bidak} di {petak} dikorbankan guna membuka jalur menuju raja lawan.",
    ],
    selesai: [
      "Teka-teki selesai. Eksekusi taktis valid.",
      "Modul diselesaikan. Rangkaian skakmat terverifikasi.",
      "Selesai. Seluruh variasi telah dikalkulasi dengan benar.",
    ],
    selesaiTema: [
      "Karakteristik pola: {tema}.",
      "Pola taktis yang teridentifikasi: {tema}.",
    ],
    tinjau: [
      "Analisis ulang solusi — Langkah {nomor}.",
      "Tinjauan langkah {nomor}: evaluasi setiap respons lawan.",
    ],
    engineMat: [
      "Verifikasi mesin analisis: Mat dalam {mat} langkah.",
      "Mesin mengonfirmasi skakmat dalam {mat} langkah.",
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
      "Puzzle ini udah pernah kamu selesaikan. Coba tes akurasi lagi!",
    ],
    benar: [
      "Rapi banget! Lawan terpaksa respon...",
      "Pas! Sekarang {lawan} cari jalan keluar.",
      "Mantap! Garis matnya mulai kebuka.",
    ],
    lawan: [
      "Lawan balasa. Tinggal {sisa} langkah lagi menuju mat!",
      "{lawan} respon. Sisa {sisa} langkah buat nutup partai.",
    ],
    lawanTerakhir: [
      "Lawan udah kehabisan petak. Kasih skakmat penutup!",
      "Nggak ada opsi buat lawan. Kasih mat penutup!",
    ],
    salah: [
      "Masih kurang tajam. Lawan masih bisa escape dari jalur ini.",
      "Belum rapat. Lawan masih punya ruang buat kabur.",
      "Bukan itu. Cari skak yang bikin lawan nggak bisa milih.",
    ],
    salahSkak: [
      "Skak sih, tapi raja lawan masih punya {jalan} petak kabur. Cari yang rapat!",
      "Skak oke, tapi masih ada {jalan} petak kabur. Tutup semuanya!",
    ],
    salahTangkap: [
      "Ambil {korban} emang menggiurkan, tapi fokus utamanya raja lawan!",
      "Makan {korban} sih cuan, tapi yang dicari mat.",
    ],
    salahTerakhir: [
      "Langkah terakhir wajib mat murni, bukan sekadar skak!",
      "Penutup harus mat. Skak doang nggak cukup!",
    ],
    ilegal: [
      "Langkah ilegal! Raja kamu mungkin lagi kena skak atau terikat.",
      "Nggak bisa gerak gitu. Cek raja kamu lagi diskak atau pin.",
    ],
    petunjuk: [
      "Clue: Kuncinya ada di {bidak} petak {dari}.",
      "Mulai dari {bidak} di {dari}. Dari situ pola matnya kebuka.",
    ],
    pengorbanan: [
      "Pengorbanan berkelas! {bidak} di {petak} dikasih gratis buat ngebuka raja lawan!",
      "Sengaja {bidak} di {petak} diumpan buat bongkar benteng raja lawan.",
    ],
    selesai: [
      "CLEAN! Puzzle selesai dengan skakmat sempurna!",
      "Beress! Semua langkah paksa jalan sampai mat.",
      "Sempurna total! Skakmat-nya dieksekusi rapi.",
    ],
    selesaiTema: [
      "Pola taktiknya: {tema}. Simpan di memori buat game berikutnya!",
      "Pola yang kepakai: {tema}. Ingat, ini sering kepakai.",
    ],
    tinjau: [
      "Review solusi — Langkah {nomor}. Lihat gimana petak kaburnya dikunci.",
      "Langkah {nomor}: perhatikan kenapa lawan nggak punya jawaban.",
    ],
    engineMat: [
      "Konfirmasi engine: Mat {mat} langkah terverifikasi.",
      "Engine bilang mat {mat} langkah. Valid!",
    ],
  },
};
