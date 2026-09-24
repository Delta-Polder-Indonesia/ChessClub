/**
 * Kamus Indonesia (ID) · teks komentator — dipakai lewat kunci papan.komentator.* dan
 * tekaTeki.komentator.* (lihat komentator.js di berkas papan/tekaTeki).
 * Blok ini diimpor oleh papan.js dan tekaTeki.js.
 */

/** komentator untuk Papan Interaktif — kunci aslinya papan.komentator.* */
export const komentatorPapan = {
  judul: "Komentator",
  keterangan: "Komentar langsung setiap langkah — dari fakta di papan, plus penilaian bila engine menyala.",
  nyalakan: "Nyalakan komentator",
  matikan: "Matikan komentator",
  gayaLabel: "Gaya",
  gayaSantai: "Santai",
  gayaFormal: "Formal",
  gayaGenZ: "Gen Z",
  menunggu: "Silakan melangkah — komentar muncul di sini.",
  posisiAwal: "Papan siap. Putih jalan duluan; mari kita lihat rencananya.",
  menilai: "Menilai langkah…",
  pihak: { putih: "Putih", hitam: "Hitam" },
  bidak: { p: "pion", n: "kuda", b: "gajah", r: "benteng", q: "menteri", k: "raja" },
  santai: {
    biasa: [
      "{pihak} main {san}. Oke, kita lihat ke mana arahnya.",
      "{san} dari {pihak} — tenang dulu, belum ada yang meledak.",
      "{pihak} geser {bidak} ke {petak}. Langkah pengembangan yang wajar.",
      "Oke, {san}. {pihak} lagi nyusun barisan dulu nih.",
    ],
    buku: [
      "{san} — masih di jalur buku: {pembukaan}. Teori-nya hafal, mantap!",
      "Ini {pembukaan}. {pihak} main sesuai teori dengan {san}.",
      "{san}, klasik. Kita masih di {pembukaan}.",
    ],
    tangkap: [
      "{pihak} sikat {korban} di {petak}! Materialnya bergeser nih.",
      "Hap! {pihak} makan {korban} di {petak}.",
      "{san} — {pihak} ambil {korban}-nya. Lihat apakah {lawan} punya balasan.",
    ],
    tangkapUntung: [
      "Wih, {pihak} dapat {korban} pakai {bidak} — untung besar di {petak}!",
      "{san}! {pihak} panen material: {korban} melayang dengan murah.",
    ],
    tangkapMenteri: [
      "MENTERI JATUH! {pihak} ambil menteri di {petak}. Ini pukulan telak!",
      "Wah, menteri {lawan} ditangkap di {petak}! Partai ini bisa selesai cepat.",
    ],
    skak: [
      "Skak! {pihak} main {san} dan raja {lawan} harus cari selamat.",
      "{san}, skak! Raja {lawan} mulai gelisah.",
      "Skak dari {pihak}! {lawan} wajib merespons dulu, gak boleh ngapa-ngapain lagi.",
    ],
    skakTambahan: [
      "Dan itu sekaligus skak! Raja {lawan} kena tekanan.",
      "Plus skak! Dua masalah sekaligus buat {lawan}.",
    ],
    skakSatuJalan: [
      "Cuma ada satu jalan keluar buat {lawan} — jalannya dipaksa.",
    ],
    rokadePendek: [
      "{pihak} rokade pendek. Raja aman, benteng ikut aktif — dua burung satu batu.",
      "Rokade! Raja {pihak} sekarang ngumpet di sudut yang nyaman.",
    ],
    rokadePanjang: [
      "Rokade panjang dari {pihak}! Berani — biasanya tanda mau serang habis-habisan.",
      "{pihak} rokade ke sayap menteri. Raja-raja berlawanan sayap, bakal seru ini!",
    ],
    enPassant: [
      "En passant! {pihak} pakai aturan yang sering bikin pemula bingung.",
      "{san} en passant — langkah spesial yang jarang muncul!",
    ],
    promosi: [
      "PROMOSI! Pion {pihak} sampai ujung papan dan jadi {bidak} di {petak}!",
      "Pion kecil naik pangkat — {pihak} dapat {bidak} baru di {petak}!",
    ],
    lawanMenggantung: [
      "Psst, {bidak} {lawan} di {petak} menggantung. Ada yang bisa diambil gratis?",
      "Cek {petak} — {bidak} {lawan} di sana kurang dijaga.",
    ],
    sendiriMenggantung: [
      "Hati-hati! {bidak} {pihak} di {petak} sekarang menggantung — bisa dimakan gratis.",
      "Hmm, {bidak} di {petak} ditinggal tanpa penjaga. {lawan} pasti lirik itu.",
    ],
    paksa: [
      "Gak ada pilihan lain — itu satu-satunya langkah legal.",
      "Langkah paksa. Mau gak mau, ya {san}.",
    ],
    nilaiBrilian: [
      "BRILIAN!! Pengorbanan yang cantik banget — ini langkah level master!",
      "Wow, {san}!! Kelihatannya gila, tapi ternyata jitu. Brilian!",
      "Itu langkah brilian! Engine pun angkat topi.",
    ],
    nilaiHebat: [
      "Langkah hebat! {pihak} menghukum kesalahan {lawan} dengan tepat.",
      "Mantap, {san} — satu-satunya langkah bagus, dan {pihak} menemukannya!",
      "Sangat baik! Momen kritis, dan {pihak} lulus ujiannya.",
    ],
    nilaiTerbaik: [
      "Itu langkah terbaik! Persis yang engine mau.",
      "Top! {san} adalah pilihan nomor satu di posisi ini.",
      "Sempurna — engine dan {pihak} sepakat: {san}.",
    ],
    nilaiUnggul: [
      "Langkah bagus. Bukan yang terbaik, tapi kualitasnya nyaris setara.",
      "Oke banget. {san} menjaga posisi tetap sehat.",
      "Solid! Mungkin ada yang sedikit lebih tajam, tapi ini tetap kuat.",
    ],
    nilaiLayak: [
      "Lumayan. Tidak salah, tapi ada opsi yang lebih menggigit.",
      "{san} masih bisa diterima. Posisinya gak rusak, kok.",
      "Cukup aman, walau bukan yang paling akurat.",
    ],
    nilaiKeliru: [
      "Hmm, sedikit keliru. Keunggulan {pihak} terkikis pelan-pelan.",
      "Agak longgar, {san}. Engine kurang setuju.",
      "Kurang presisi — {lawan} dapat sedikit napas.",
    ],
    nilaiKesalahan: [
      "Aduh, itu kesalahan. {pihak} kasih {lawan} kesempatan emas.",
      "Kesalahan! Posisi {pihak} tiba-tiba jadi berat.",
      "Ups, {san} bukan ide bagus. Momentumnya berpindah ke {lawan}.",
    ],
    nilaiKelewat: [
      "Sayang! Ada kesempatan besar yang kelewat buat {pihak}.",
      "Kelewat! {pihak} punya pukulan telak, tapi tidak dilihat.",
      "Hampir… peluang emas itu terlewat begitu saja.",
    ],
    nilaiBlunder: [
      "BLUNDER! Waduh, {san} itu langkah yang mahal harganya!",
      "Oh tidak, blunder besar! {lawan} pasti senang banget lihat ini.",
      "Aduh, aduh… {san} langsung membalik keadaan. Blunder!",
    ],
    lebihKuat: [
      "Lebih kuat: {saran}.",
      "Engine lebih suka {saran} di sini.",
    ],
    seimbang: [
      "Posisinya masih imbang — siapa pun bisa menang.",
      "Skor nyaris nol; pertarungan masih terbuka lebar.",
      "Seimbang. Belum ada yang unggul berarti.",
    ],
    unggulTipis: [
      "{unggul} unggul tipis, kira-kira {nilai} pion.",
      "Sedikit condong ke {unggul} (+{nilai}). Masih bisa dikejar.",
    ],
    unggulJelas: [
      "{unggul} unggul jelas — sekitar {nilai} pion. Tekanannya nyata!",
      "Keunggulan {unggul} sudah kelihatan: +{nilai}.",
    ],
    unggulMenang: [
      "{unggul} sudah menang besar (+{nilai}). Tinggal tidak blunder saja!",
      "Ini posisi menang buat {unggul} — keunggulan {nilai} pion.",
    ],
    unggulMat: [
      "Ada skakmat paksa untuk {unggul} dalam {mat} langkah!",
      "{unggul} punya mat dalam {mat}. Tinggal eksekusi!",
    ],
    skakmat: [
      "SKAKMAT!! {pihak} menang! Partai yang seru, terima kasih sudah bermain!",
      "Dan itu skakmat! {pihak} menutup partai dengan {san}. Selamat!",
      "MAT! Raja {lawan} tidak punya jalan keluar. {pihak} menang!",
    ],
    pat: [
      "Pat! Raja {lawan} tidak diskak tapi tidak bisa bergerak — remis. Sayang sekali!",
      "Remis karena pat. Hati-hati, ini jebakan klasik saat sudah unggul jauh.",
    ],
    remis: [
      "Remis! Partai berakhir tanpa pemenang.",
      "Kedua pihak berbagi poin — remis.",
    ],
    remisUlang: [
      "Remis karena posisi terulang tiga kali.",
      "Pengulangan tiga kali — partai dinyatakan remis.",
    ],
    remisMaterial: [
      "Remis — material tidak cukup untuk skakmat.",
      "Tidak ada lagi yang bisa mematikan raja. Remis.",
    ],
    ajakEngine: [
      "Mau tahu langkah ini bagus atau tidak? Nyalakan engine, aku akan menilainya.",
      "Nyalakan engine di atas kalau mau komentar lengkap dengan skor dan penilaian.",
    ],
    // Saran basis data awan (chessdb.cn) — dipakai saat engine mati dan partai
    // sudah keluar dari buku pembukaan lokal. Saran untuk pihak yang jalan.
    awan: [
      "Basis data awan menyarankan {awan} untuk {lawan}, skor {nilai}.",
      "Cloud bilang {awan} masuk akal di sini — skor {nilai} buat {lawan}.",
      "Menurut basis data awan, {lawan} sebaiknya main {awan} (skor {nilai}).",
    ],
  },
  genZ: {
    biasa: [
      "{pihak} pilih {san}. Masih kalem, belum waktunya bikin konten.",
      "{san} dari {pihak}. Oke, rencananya mulai kelihatan.",
      "{bidak} mendarat di {petak}. Aman dulu, drama belakangan.",
      "{pihak} main {san}. Posisi lagi dimasak, jangan buru-buru.",
    ],
    buku: [
      "{san} masih masuk teori {pembukaan}. PR pembukaannya dikerjain.",
      "Ini {pembukaan}, dan {pihak} masih hafal jalur lewat {san}.",
      "{san} masih sesuai buku {pembukaan}. Belum improvisasi liar.",
    ],
    tangkap: [
      "{pihak} ambil {korban} di {petak}. Ada yang kehilangan barang.",
      "{san}, {korban} langsung diamankan. {lawan} punya balasan enggak nih?",
      "{korban} di {petak} kena angkut. Transaksi material resmi dibuka.",
    ],
    tangkapUntung: [
      "{pihak} tukar murah buat {korban} di {petak}. Cuan materialnya nyata.",
      "{san} panen {korban}. Gratis begini susah ditolak.",
    ],
    tangkapMenteri: [
      "Menteri {lawan} jatuh di {petak}. Itu bukan selip kecil, itu bencana.",
      "{pihak} ambil menteri di {petak}. Posisi {lawan} langsung butuh mukjizat.",
    ],
    skak: [
      "{san} kasih skak. Raja {lawan} diminta pindah sekarang juga.",
      "Skak dari {pihak}. Agenda {lawan} terpaksa dibatalkan.",
      "Raja {lawan} kena skak. Tidak bisa pura-pura enggak lihat.",
    ],
    skakTambahan: [
      "Bonus skak juga. Raja {lawan} ikut kena repot.",
      "Sekalian skak. Satu langkah, dua masalah buat {lawan}.",
    ],
    skakSatuJalan: [
      "Cuma satu balasan legal. Pilihan menunya tipis banget.",
    ],
    rokadePendek: [
      "{pihak} rokade pendek. Raja aman, benteng ikut kerja.",
      "Rokade pendek. Raja {pihak} akhirnya pakai sabuk pengaman.",
    ],
    rokadePanjang: [
      "{pihak} rokade panjang. Niat menyerangnya mulai terang.",
      "Raja {pihak} pindah ke sayap menteri. Posisi bakal makin panas.",
    ],
    enPassant: [
      "En passant! Aturan langka akhirnya dapat jam tayang.",
      "{san} lewat en passant. Legal kok, meski kelihatan mencurigakan.",
    ],
    promosi: [
      "Pion {pihak} promosi jadi {bidak} di {petak}. Naik jabatan tanpa masa percobaan.",
      "{bidak} baru lahir di {petak}. Pion {pihak} sukses sampai garis akhir.",
    ],
    lawanMenggantung: [
      "{bidak} {lawan} di {petak} menggantung. Gratisan sedang tersedia.",
      "Cek {petak}. {bidak} {lawan} dijaga pakai doa doang.",
    ],
    sendiriMenggantung: [
      "{bidak} {pihak} di {petak} sekarang menggantung. Sedekah material terdeteksi.",
      "Waduh, {bidak} di {petak} ditinggal. {lawan} pasti sudah melirik.",
    ],
    paksa: [
      "Cuma itu langkah legal. Bukan pilihan, lebih mirip perintah.",
      "{san} terpaksa dimainkan. Menu lainnya sedang tutup.",
    ],
    nilaiBrilian: [
      "Brilian! {san} kelihatan nekat, ternyata hitungannya bersih.",
      "{san} itu pengorbanan kelas atas. Engine ikut respek.",
      "Langkah brilian. Papan tadi tenang, sekarang jadi highlight.",
    ],
    nilaiHebat: [
      "Langkah hebat! {pihak} nemu jawaban yang enggak gampang.",
      "{san} tepat sasaran. Momen sulitnya lolos tanpa lecet.",
      "Bagus banget. {pihak} menghukum posisi ini dengan akurat.",
    ],
    nilaiTerbaik: [
      "{san} pilihan terbaik. Engine tidak punya catatan.",
      "Akurat banget. {pihak} memilih nomor satu di posisi ini.",
      "Langkah terbaik ditemukan. Bersih, lanjut.",
    ],
    nilaiUnggul: [
      "Langkah kuat. Bukan nomor satu, tapi bedanya tipis banget.",
      "{san} menjaga posisi tetap enak dimainkan.",
      "Pilihan bagus. Engine cuma punya saran kecil.",
    ],
    nilaiLayak: [
      "{san} masih oke. Ada yang lebih tajam, tapi posisi aman.",
      "Layak dimainkan. Tidak istimewa, tidak bikin panik.",
      "Cukup solid, walau engine melihat pilihan yang lebih niat.",
    ],
    nilaiKeliru: [
      "Sedikit meleset. {lawan} dapat ruang bernapas gratis.",
      "{san} kurang presisi. Belum parah, tapi engine mengernyit.",
      "Keunggulan {pihak} menipis sedikit. Alarmnya baru bunyi pelan.",
    ],
    nilaiKesalahan: [
      "Itu kesalahan. {lawan} baru saja dikasih akses masuk.",
      "{san} bikin posisi {pihak} berat. Plot twist yang tidak diminta.",
      "Momentum pindah ke {lawan}. Langkah tadi mahal juga.",
    ],
    nilaiKelewat: [
      "Peluang besar kelewat. Taktiknya lewat depan mata.",
      "{pihak} punya pukulan kuat, tapi tidak diambil. Sayang banget.",
      "Kesempatannya hilang. Engine pasti sedang menunjuk layar.",
    ],
    nilaiBlunder: [
      "Blunder. {san} bikin evaluasi jatuh dari tangga.",
      "Aduh, {lawan} baru dapat hadiah besar.",
      "{san} itu blunder serius. Posisi {pihak} langsung masuk mode sulit.",
    ],
    lebihKuat: [
      "Yang lebih galak sebenarnya {saran}.",
      "Engine maunya {saran}. Yang tadi kurang menggigit.",
    ],
    seimbang: [
      "Posisi masih imbang. Belum ada yang boleh sombong.",
      "Evaluasi nyaris nol. Partainya masih milik siapa saja.",
      "Masih setara. Dramanya belum pilih kubu.",
    ],
    unggulTipis: [
      "{unggul} unggul tipis sekitar {nilai} pion. Belum aman buat flexing.",
      "Posisi condong sedikit ke {unggul}, nilainya +{nilai}.",
    ],
    unggulJelas: [
      "{unggul} unggul jelas sekitar {nilai} pion. Tekanannya mulai terasa.",
      "Nilai +{nilai} buat {unggul}. Ini sudah bukan sekadar feeling.",
    ],
    unggulMenang: [
      "{unggul} unggul {nilai} pion. Tinggal jangan bikin konten blunder.",
      "Posisi {unggul} sudah menang besar. Eksekusinya jangan goyah.",
    ],
    unggulMat: [
      "{unggul} punya mat dalam {mat}. Tinggal ikuti jalurnya.",
      "Mat dalam {mat} buat {unggul}. Raja lawan sudah kehabisan episode.",
    ],
    skakmat: [
      "Skakmat! {pihak} menutup partai dengan bersih.",
      "{san} dan selesai. Raja {lawan} resmi tidak punya jalan.",
      "Mat! {pihak} menang, {lawan} bisa review dulu.",
    ],
    pat: [
      "Pat! Unggul belum tentu menang kalau rajanya dikunci begini.",
      "Tidak ada langkah legal dan bukan skak. Remis, plot twist terakhir.",
    ],
    remis: [
      "Remis. Tidak ada pemenang, ego aman bareng-bareng.",
      "Poin dibagi. Partainya sepakat berhenti di tengah.",
    ],
    remisUlang: [
      "Posisi terulang tiga kali. Remis karena papan kena replay.",
      "Tiga kali posisi yang sama, jadi partainya resmi remis.",
    ],
    remisMaterial: [
      "Materialnya tidak cukup buat mat. Remis tanpa debat.",
      "Tidak ada amunisi untuk skakmat. Poin dibagi.",
    ],
    ajakEngine: [
      "Nyalakan engine kalau mau tahu langkah tadi masak atau malah gosong.",
      "Butuh penilaian jujur? Aktifkan engine, biar angkanya bicara.",
    ],
    awan: [
      "Basis data awan nyaranin {awan} buat {lawan}. Skornya {nilai}, lumayan.",
      "Cloud bilang {awan} — skor {nilai} buat {lawan}. Intip tab Basis Data.",
      "Kalau ikut awan, {lawan} main {awan}. Skor {nilai}.",
    ],
  } ,
  formal: {
    biasa: [
      "{pihak} melanjutkan dengan {san}.",
      "{san}. {pihak} menata posisi tanpa komitmen berlebih.",
      "{pihak} menempatkan {bidak} di {petak}, langkah pengembangan yang lazim.",
      "{san} — langkah tenang yang menjaga keseimbangan.",
    ],
    buku: [
      "{san} masih mengikuti teori: {pembukaan}.",
      "Posisi ini dikenal sebagai {pembukaan}. {pihak} bermain sesuai buku.",
      "{san}, sesuai teori pembukaan {pembukaan}.",
    ],
    tangkap: [
      "{pihak} menangkap {korban} di {petak}.",
      "{san}: {pihak} mengambil {korban}. Perlu dilihat apakah {lawan} dapat merebut kembali.",
      "Pertukaran dimulai — {pihak} mengambil {korban} di {petak}.",
    ],
    tangkapUntung: [
      "{pihak} memenangkan material: {korban} ditangkap oleh {bidak} di {petak}.",
      "{san} menghasilkan keuntungan material yang jelas bagi {pihak}.",
    ],
    tangkapMenteri: [
      "Menteri {lawan} jatuh di {petak}. Kerugian material yang menentukan.",
      "{pihak} merebut menteri di {petak} — kerugian yang sulit dipulihkan.",
    ],
    skak: [
      "Skak. Raja {lawan} harus segera diamankan.",
      "{san} memberi skak dan memaksa {lawan} merespons.",
      "Skak dari {pihak}. Inisiatif berada di tangannya.",
    ],
    skakTambahan: [
      "Langkah ini juga memberi skak pada raja {lawan}.",
      "Sekaligus skak — {lawan} harus mengatasi ancaman itu terlebih dahulu.",
    ],
    skakSatuJalan: [
      "Hanya ada satu balasan yang legal bagi {lawan}.",
    ],
    rokadePendek: [
      "{pihak} melakukan rokade pendek: raja terlindung dan benteng terhubung.",
      "Rokade pendek. Prioritas keamanan raja diselesaikan lebih dahulu.",
    ],
    rokadePanjang: [
      "{pihak} rokade panjang — biasanya menandakan rencana serangan di sayap raja.",
      "Rokade ke sayap menteri; kedua raja berada di sayap berlawanan.",
    ],
    enPassant: [
      "Penangkapan en passant oleh {pihak}.",
      "{san} en passant — aturan khusus penangkapan pion.",
    ],
    promosi: [
      "Promosi: pion {pihak} menjadi {bidak} di {petak}.",
      "{pihak} mempromosikan pion menjadi {bidak} di {petak}.",
    ],
    lawanMenggantung: [
      "Perhatikan {bidak} {lawan} di {petak}: bidak itu kurang terlindungi.",
      "{bidak} {lawan} di {petak} menggantung dan dapat menjadi sasaran.",
    ],
    sendiriMenggantung: [
      "Perlu diwaspadai: {bidak} {pihak} di {petak} kini tidak terlindungi.",
      "{bidak} di {petak} ditinggalkan tanpa penjaga — {lawan} dapat memanfaatkannya.",
    ],
    paksa: [
      "Langkah paksa; tidak ada alternatif legal.",
      "{san} adalah satu-satunya langkah yang tersedia.",
    ],
    nilaiBrilian: [
      "Langkah brilian — pengorbanan yang dibenarkan secara taktis.",
      "{san} adalah langkah brilian: sulit ditemukan, tetapi tepat.",
      "Brilian. Pengorbanan ini menghasilkan kompensasi yang nyata.",
    ],
    nilaiHebat: [
      "Langkah yang sangat baik: {pihak} memanfaatkan kesalahan {lawan} dengan tepat.",
      "{san} merupakan satu-satunya kelanjutan kuat, dan {pihak} menemukannya.",
      "Sangat baik. Pada momen kritis, {pihak} memilih dengan akurat.",
    ],
    nilaiTerbaik: [
      "Langkah terbaik menurut engine.",
      "{san} adalah pilihan utama engine pada posisi ini.",
      "Akurat — {san} adalah langkah terbaik.",
    ],
    nilaiUnggul: [
      "Langkah unggul; kekuatannya nyaris setara dengan langkah terbaik.",
      "{san} menjaga posisi tetap sehat.",
      "Pilihan yang kuat, meski bukan yang paling tajam.",
    ],
    nilaiLayak: [
      "Langkah yang layak, meski tersedia kelanjutan yang lebih akurat.",
      "{san} masih dapat diterima; posisi tidak dirugikan secara berarti.",
      "Cukup aman, walau bukan pilihan paling presisi.",
    ],
    nilaiKeliru: [
      "Sedikit keliru — keunggulan {pihak} berkurang.",
      "{san} kurang presisi dan memberi {lawan} ruang bernapas.",
      "Ketidakakuratan kecil yang mengikis posisi {pihak}.",
    ],
    nilaiKesalahan: [
      "Kesalahan. {pihak} memberi {lawan} peluang yang nyata.",
      "{san} adalah kesalahan; keseimbangan bergeser ke {lawan}.",
      "Langkah yang keliru — inisiatif kini berpindah ke {lawan}.",
    ],
    nilaiKelewat: [
      "Kesempatan terlewat: {pihak} memiliki kelanjutan yang jauh lebih kuat.",
      "{pihak} melewatkan peluang taktis yang menentukan.",
      "Peluang besar tidak dimanfaatkan oleh {pihak}.",
    ],
    nilaiBlunder: [
      "Blunder. {san} mengubah penilaian posisi secara drastis.",
      "Kesalahan serius — {lawan} kini memiliki keunggulan yang menentukan.",
      "Blunder yang mahal; posisi {pihak} runtuh setelah {san}.",
    ],
    lebihKuat: [
      "Lebih kuat adalah {saran}.",
      "Engine menyarankan {saran}.",
    ],
    seimbang: [
      "Posisi seimbang.",
      "Evaluasi mendekati nol; kedua pihak memiliki peluang setara.",
      "Keseimbangan terjaga.",
    ],
    unggulTipis: [
      "{unggul} unggul tipis, sekitar {nilai} pion.",
      "Keunggulan kecil bagi {unggul} (+{nilai}).",
    ],
    unggulJelas: [
      "{unggul} memegang keunggulan yang jelas: +{nilai}.",
      "Evaluasi condong ke {unggul} sebesar {nilai} pion.",
    ],
    unggulMenang: [
      "{unggul} berada pada posisi menang (+{nilai}).",
      "Keunggulan {unggul} sudah menentukan: {nilai} pion.",
    ],
    unggulMat: [
      "{unggul} memiliki skakmat paksa dalam {mat} langkah.",
      "Terdapat mat dalam {mat} untuk {unggul}.",
    ],
    skakmat: [
      "Skakmat. {pihak} memenangkan partai dengan {san}.",
      "Partai berakhir — skakmat untuk {pihak}.",
      "Skakmat. Raja {lawan} tidak memiliki jalan keluar.",
    ],
    pat: [
      "Pat: raja {lawan} tidak diskak namun tidak memiliki langkah legal. Remis.",
      "Partai berakhir remis karena pat.",
    ],
    remis: [
      "Partai berakhir remis.",
      "Remis; kedua pihak berbagi poin.",
    ],
    remisUlang: [
      "Remis karena pengulangan posisi tiga kali.",
      "Posisi terulang tiga kali — partai dinyatakan remis.",
    ],
    remisMaterial: [
      "Remis karena material tidak mencukupi untuk skakmat.",
      "Tidak ada material yang cukup untuk mematikan raja. Remis.",
    ],
    ajakEngine: [
      "Nyalakan engine untuk memperoleh penilaian langkah dan evaluasi posisi.",
      "Penilaian kualitas langkah tersedia bila engine diaktifkan.",
    ],
    awan: [
      "Basis data awan menyarankan {awan} untuk {lawan} dengan skor {nilai}.",
      "Data awan menunjukkan {awan} sebagai pilihan {lawan}; skor {nilai}.",
      "Saran basis data awan: {awan} untuk {lawan} (skor {nilai}).",
    ],
  },
};

/** komentator untuk halaman Teka-Teki — kunci aslinya tekaTeki.komentator.* */
export const komentatorTekaTeki = {
  santai: {
    mulaiSatu: [
      "Soal baru! {pihak} jalan dan langsung skakmat dalam satu langkah. Cari pukulan penutupnya!",
      "Mat dalam satu. {pihak} melangkah — ada satu langkah yang mengunci raja {lawan}. Ketemu?",
    ],
    mulai: [
      "Soal baru: {pihak} melangkah, skakmat dalam {n} langkah. Tarik napas, cari langkah paksa dulu.",
      "Mat dalam {n}. Giliran {pihak} — biasanya dimulai dari skak atau pengorbanan. Coba!",
      "{pihak} jalan, {n} langkah menuju mat. Perhatikan raja {lawan}: petak pelariannya di mana?",
    ],
    mulaiSudah: [
      "Kamu sudah pernah memecahkan yang ini — masih ingat kuncinya?",
    ],
    benar: [
      "Tepat! Sekarang tunggu balasan {lawan}.",
      "Yes, itu dia! Lanjut, {lawan} akan menjawab.",
      "Betul! {lawan} terpaksa merespons — kita lihat jawabannya.",
    ],
    lawan: [
      "{lawan} membalas. Giliranmu lagi — tinggal {sisa} langkah lagi.",
      "Balasan {lawan}. Ayo, sisa {sisa} langkah lagi sampai mat!",
    ],
    lawanTerakhir: [
      "{lawan} membalas. Sekarang pukulan penutup — cari skakmatnya!",
      "Tinggal satu langkah lagi. Raja {lawan} sudah di ujung tanduk!",
    ],
    salah: [
      "Belum tepat. Cari langkah yang benar-benar memaksa — {lawan} tidak boleh punya jalan keluar.",
      "Hmm, bukan itu. Coba lihat semua skak yang mungkin dulu.",
      "Belum. Ingat, solusinya harus memaksa; langkah tenang biasanya kasih {lawan} waktu.",
    ],
    salahSkak: [
      "Skak, tapi raja {lawan} masih punya {jalan} jalan lolos. Cari skak yang lebih menggigit.",
      "Idenya sudah benar — skak! — tapi ini masih bisa ditangkis. Ada skak lain?",
    ],
    salahTangkap: [
      "Makan {korban}-nya menggoda, tapi bukan itu tujuannya. Fokus ke raja {lawan}!",
      "Material bukan segalanya di sini — yang dicari skakmat, bukan {korban}.",
    ],
    salahTerakhir: [
      "Ini langkah terakhir: harus langsung skakmat, bukan sekadar skak.",
      "Langkah penutup wajib mat. Periksa lagi semua petak pelarian raja.",
    ],
    ilegal: [
      "Langkah itu tidak boleh — mungkin rajamu sedang diskak atau bidaknya terpaku.",
      "Itu tidak legal. Cek lagi: apakah raja {pihak} aman setelah langkah itu?",
    ],
    petunjuk: [
      "Petunjuk: bidak yang harus bergerak adalah {bidak} di {dari}. Ke mana dia harus pergi?",
      "Lihat {bidak} di {dari} — di situlah kuncinya.",
    ],
    pengorbanan: [
      "Pengorbanan! {bidak} di {petak} sengaja diumpankan — kalau diambil, raja {lawan} terbuka.",
      "Wah, {bidak} dikorbankan di {petak}. Berani, dan itu memang kuncinya!",
    ],
    selesai: [
      "SKAKMAT! Soal terpecahkan — bagus banget!",
      "Mat! Raja {lawan} tidak punya jalan keluar. Terpecahkan!",
      "Itu dia — skakmat! Kerja rapi.",
    ],
    selesaiTema: [
      "Polanya: {tema}. Simpan di memori, ini sering muncul lagi.",
      "Tema soal ini: {tema}. Sekali kenal, seterusnya cepat terlihat!",
    ],
    tinjau: [
      "Langkah {nomor} dari solusi. Lihat kenapa {lawan} tidak punya pilihan.",
      "Meninjau solusi — langkah {nomor}. Perhatikan bagaimana pelarian raja ditutup satu per satu.",
    ],
    engineMat: [
      "Engine juga melihat mat dalam {mat}.",
      "Konfirmasi engine: mat dalam {mat}.",
    ],
  },
  formal: {
    mulaiSatu: [
      "Soal baru: {pihak} melangkah dan memberi skakmat dalam satu langkah.",
      "Mat dalam satu langkah. {pihak} yang bergerak.",
    ],
    mulai: [
      "Soal baru: {pihak} melangkah, skakmat dalam {n} langkah. Mulailah dari langkah yang memaksa.",
      "Mat dalam {n}. Giliran {pihak}; perhatikan petak pelarian raja {lawan}.",
      "{pihak} melangkah, {n} langkah menuju skakmat.",
    ],
    mulaiSudah: [
      "Soal ini sudah pernah Anda pecahkan.",
    ],
    benar: [
      "Tepat. Menunggu balasan {lawan}.",
      "Langkah yang benar; {lawan} akan menjawab.",
      "Benar. {lawan} dipaksa merespons.",
    ],
    lawan: [
      "{lawan} membalas. Tersisa {sisa} langkah.",
      "Balasan {lawan}. Giliran Anda; {sisa} langkah lagi menuju mat.",
    ],
    lawanTerakhir: [
      "{lawan} membalas. Langkah berikutnya harus skakmat.",
      "Tersisa satu langkah: temukan skakmatnya.",
    ],
    salah: [
      "Belum tepat. Solusi harus memaksa; {lawan} tidak boleh memiliki pertahanan.",
      "Bukan langkah solusi. Tinjau seluruh skak yang tersedia.",
      "Belum tepat. Langkah tenang memberi {lawan} waktu untuk bertahan.",
    ],
    salahSkak: [
      "Skak, namun raja {lawan} masih memiliki {jalan} balasan. Diperlukan skak yang lebih memaksa.",
      "Arahnya benar — skak — tetapi masih dapat ditangkis.",
    ],
    salahTangkap: [
      "Menangkap {korban} menggoda, tetapi tujuan soal adalah skakmat.",
      "Keuntungan material bukan sasaran di sini; fokus pada raja {lawan}.",
    ],
    salahTerakhir: [
      "Langkah terakhir harus langsung skakmat, bukan sekadar skak.",
      "Langkah penutup wajib mat. Periksa kembali petak pelarian raja.",
    ],
    ilegal: [
      "Langkah tidak legal — kemungkinan raja sedang diskak atau bidak terpaku.",
      "Langkah itu tidak diizinkan. Pastikan raja {pihak} aman setelahnya.",
    ],
    petunjuk: [
      "Petunjuk: gerakkan {bidak} dari {dari}.",
      "Bidak kunci adalah {bidak} di {dari}.",
    ],
    pengorbanan: [
      "Pengorbanan: {bidak} di {petak} ditawarkan untuk membuka raja {lawan}.",
      "{bidak} dikorbankan di {petak} — langkah kunci kombinasi ini.",
    ],
    selesai: [
      "Skakmat. Soal terpecahkan.",
      "Skakmat — raja {lawan} tidak memiliki jalan keluar.",
      "Terpecahkan dengan skakmat.",
    ],
    selesaiTema: [
      "Pola yang digunakan: {tema}.",
      "Tema soal ini: {tema}.",
    ],
    tinjau: [
      "Tinjauan solusi — langkah {nomor}.",
      "Langkah {nomor} dari solusi; perhatikan bagaimana pilihan {lawan} dibatasi.",
    ],
    engineMat: [
      "Engine mengonfirmasi mat dalam {mat}.",
      "Evaluasi engine: mat dalam {mat}.",
    ],

  },
  genZ: {
    mulaiSatu: [
      "Soal baru, mat satu buat {pihak}. Jangan overthinking, tinggal cari penutupnya.",
      "{pihak} jalan dan mat dalam satu. Raja {lawan} sudah hampir logout.",
    ],
    mulai: [
      "{pihak} punya mat dalam {n}. Cari langkah yang paling memaksa dulu.",
      "Mat dalam {n} buat {pihak}. Cek, tangkap, ancam, mulai dari sana.",
      "Giliran {pihak}, targetnya mat dalam {n}. Raja {lawan} jangan dikasih napas.",
    ],
    mulaiSudah: [
      "Soal ini pernah kamu pecahkan. Coba buktikan memorinya masih online.",
    ],
    benar: [
      "Benar! Sekarang tunggu balasan {lawan}.",
      "Nah, itu langkahnya. {lawan} terpaksa menjawab.",
      "Tepat. {lawan} masuk jalur yang sudah disiapkan.",
    ],
    lawan: [
      "{lawan} membalas. Tinggal {sisa} langkah lagi.",
      "Balasan {lawan} masuk. Sisa {sisa} langkah menuju mat.",
    ],
    lawanTerakhir: [
      "{lawan} sudah membalas. Sekarang cari pukulan matnya.",
      "Satu langkah lagi. Jangan cuma skak, tutup partainya.",
    ],
    salah: [
      "Belum tepat. {lawan} masih punya jalan keluar.",
      "Bukan itu. Cek semua langkah paksa dulu.",
      "Langkahnya kasih {lawan} terlalu banyak waktu. Coba lagi.",
    ],
    salahSkak: [
      "Memang skak, tapi {lawan} masih punya {jalan} jalan keluar.",
      "Skaknya belum cukup galak. Raja {lawan} masih bisa kabur.",
    ],
    salahTangkap: [
      "{korban} memang menggoda, tapi targetnya raja {lawan}.",
      "Material nanti dulu. Menunya skakmat, bukan ambil {korban}.",
    ],
    salahTerakhir: [
      "Ini langkah terakhir. Harus mat, bukan sekadar bikin raja pindah.",
      "Penutupnya wajib skakmat. Cek lagi petak kaburnya.",
    ],
    ilegal: [
      "Langkah itu ilegal. Rajamu mungkin masih terancam.",
      "Tidak bisa dimainkan. Pastikan raja {pihak} tetap aman.",
    ],
    petunjuk: [
      "Gerakkan {bidak} dari {dari}. Sisanya coba kamu temukan.",
      "Kuncinya ada pada {bidak} di {dari}.",
    ],
    pengorbanan: [
      "{bidak} di {petak} sengaja dikorbankan. Umpannya bukan kaleng-kaleng.",
      "Pengorbanan di {petak}! Kalau {lawan} ambil, rajanya malah terbuka.",
    ],
    selesai: [
      "Skakmat! Soalnya beres, rapi juga.",
      "Mat! Raja {lawan} resmi kehabisan petak.",
      "Selesai dengan skakmat. Clean.",
    ],
    selesaiTema: [
      "Temanya {tema}. Simpan polanya, nanti muncul lagi.",
      "Itu pola {tema}. Sekarang harusnya makin gampang dikenali.",
    ],
    tinjau: [
      "Ini langkah {nomor} dari solusi. Perhatikan pilihan {lawan} yang dipangkas.",
      "Review langkah {nomor}. Jalur kabur raja ditutup satu-satu.",
    ],
    engineMat: [
      "Engine juga melihat mat dalam {mat}. Validasi diterima.",
      "Konfirmasi engine, mat dalam {mat}.",
    ],
  } ,
};
