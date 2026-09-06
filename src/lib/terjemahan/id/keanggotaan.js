/**
 * Kamus Indonesia (ID) · kelompok keanggotaan — alur Keanggotaan / Pendaftaran Anggota (daftar, verifikasi akun).
 * Kunci dalam berkas: keanggotaan, verifikasi, pendaftaran.
 */

export const keanggotaan = {
    judul: "Keanggotaan",
    deskripsi:
      "Daftar anggota yang disinkronkan otomatis dari klub BLUNDER SKUAD di Chess.com.",
    artikel: "Daftar Anggota",
    intro:
      "Daftar ini menggunakan roster publik klub BLUNDER SKUAD di Chess.com. Anggota yang sudah bergabung di Chess.com tetap perlu melengkapi pendaftaran data diri di situs ini. Data tersebut membantu pengurus mengenali pemain, memeriksa riwayat larangan, dan mencegah pemain yang terkena ban kembali memakai akun baru.",
    jumlah: "Jumlah anggota: {jumlah}",
    dataBelumLengkap: "Belum melengkapi data diri di website",
    dataBelumLengkapPenjelasan:
      "Akun ini sudah bergabung di BLUNDER SKUAD pada Chess.com, tetapi belum melengkapi data diri di website komunitas. Data diri disimpan secara privat agar pengurus dapat mengenali pemain dan mencocokkan identitas bila akun terkena ban.",
    tandaTanyaJudul: "{jumlah} anggota belum melengkapi data website",
    tandaTanyaPenjelasan:
      "Tanda tanya di samping nama berarti player sudah menjadi anggota BLUNDER SKUAD di Chess.com, tetapi belum mendaftar ulang di website. Pendaftaran ulang diperlukan untuk menyimpan data identitas secara aman, membantu pemeriksaan turnamen, dan mencegah pemain terlarang kembali dengan akun baru.",
    lengkapiData: "Lengkapi data diri di website",
    sumber: "Sumber anggota:",
    sumberCatatan: "Roster publik Chess.com diperbarui maksimal setiap 12 jam.",
    memuat: "Memuat data dari Chess.com…",
    menyegarkan: "Menyegarkan daftar anggota dari Chess.com…",
    kosongKlub: "Belum ada anggota yang terbaca dari klub Chess.com.",
    aktivitasKlub: "Aktivitas klub",
    aktivitas: {
      weekly: "Aktif mingguan",
      monthly: "Aktif bulanan",
      all_time: "Aktif sebelumnya",
    },
    kosong1: "Belum ada anggota terdaftar. Silakan ",
    kosong2: "daftar dengan akun Chess.com",
    kosong3: ".",
    no: "No.",
    foto: "Foto",
    nama: "Nama",
    akunHilang: "akun tidak ditemukan",
    gagal: "gagal memuat",
    panggilan: "Panggilan",
    kota: "Kota",
    klub: "Klub",
    kategoriUmur: "Kategori Umur",
    bergabung: "Bergabung",
    wa: "WhatsApp",
    profilJudul: "Profil Anggota",
    tutup: "Tutup",
    lihatProfil: "Klik untuk melihat profil",
    terkenaBan:
      "Akun ini diblokir dari kegiatan komunitas. Periksa keterangan pengurus atau status Chess.com.",
    tingkatanJudul: "Tingkatan Kelompok Rating",
    tingkatanRentang: "Rentang Rating",
    tingkatanKategori: "Kategori Pemain",
    tingkatanPenjelasan: "Penjelasan Kemampuan",
    tingkatanBuka: "Klik untuk membuka daftar tingkatan rating",
    tingkatanTutup: "Klik untuk melipat daftar tingkatan rating",
    tingkatan: {
      beginner: {
        label: "Beginner (Pemula)",
        deskripsi: "Baru memulai perjalanan catur dan memahami pergerakan dasar buah catur.",
      },
      novice: {
        label: "Novice (Pemula Lanjutan)",
        deskripsi: "Mulai mempelajari dasar taktik, mengamankan perwira, dan meminimalkan blunder.",
      },
      intermediate: {
        label: "Intermediate (Menengah)",
        deskripsi: "Mampu menyusun strategi, memahami taktik 2–3 langkah, dan menguasai pembukaan dasar.",
      },
      advanced: {
        label: "Advanced (Mahir)",
        deskripsi: "Memiliki pemahaman posisi yang konsisten, kalkulasi matang, dan jarang melakukan kesalahan fatal.",
      },
      expert: {
        label: "Expert (Ahli)",
        deskripsi: "Keterampilan tingkat tinggi dengan kalkulasi mendalam, manajemen waktu yang ketat, dan ketahanan mental.",
      },
      master: {
        label: "Master Level (Pakar)",
        deskripsi: "Pemain yang sangat kuat dengan kemampuan komprehensif di level turnamen nasional.",
      },
      elite: {
        label: "Elite / Grandmaster",
        deskripsi: "Kelas tertinggi tempat para pecatur profesional dunia bersaing.",
      },
    },
    nextJudul: "Pendaftaran Anggota",
  }

export const verifikasi = {
    judul: "Bukti Kepemilikan Akun",
    penjelasan:
      "Buktikan bahwa akun Chess.com yang Anda tulis benar-benar milik Anda. Ini mencegah orang lain mendaftarkan akun Anda, dan mencegah pendaftaran memakai akun milik pemain lain.",
    tombolLogin: "Masuk dengan Chess.com",
    catatanLogin:
      "Anda akan diarahkan ke chess.com untuk masuk. Kata sandi Anda tidak pernah kami lihat maupun simpan.",
    atau: "Atau tanpa login",
    tombolKode: "Verifikasi lewat kode profil",
    memproses: "Memproses…",
    langkah1: "Buka pengaturan profil Chess.com Anda.",
    langkah2: "Isi kolom Location dengan kode ini:",
    langkah3:
      "Simpan perubahan, lalu klik tombol di bawah. Setelah terverifikasi, kode boleh dihapus kembali.",
    bukaPengaturan: "Buka pengaturan Chess.com",
    sudahPasang: "Saya sudah memasang kode",
    memeriksa: "Memeriksa profil…",
    belumTerbaca:
      "Kode belum terbaca. Pastikan sudah tersimpan, lalu coba lagi beberapa saat.",
    isiUsernameDulu: "Isi username Chess.com Anda terlebih dahulu.",
    berhasil: "Kepemilikan akun terverifikasi:",
    ganti: "Ganti akun",
  }

export const pendaftaran = {
    judul: "Pendaftaran Anggota",
    parent: "Keanggotaan",
    deskripsi:
      "Lengkapi data administrasi dan verifikasi akun Chess.com Anda setelah bergabung ke klub BLUNDER SKUAD.",
    artikel: "Lengkapi Data Anggota",
    intro:
      "Daftar anggota situs diambil otomatis dari roster klub BLUNDER SKUAD di Chess.com. Isi formulir ini setelah akun Anda ada di klub untuk verifikasi dan administrasi tambahan. Sistem memastikan satu orang hanya menggunakan satu akun, dan akun yang ditutup Chess.com karena pelanggaran fair play tidak dapat mengikuti kegiatan komunitas.",
    klubWajibJudul: "Bergabung ke klub terlebih dahulu",
    klubWajibIsi:
      "Username harus sudah tercatat sebagai anggota BLUNDER SKUAD di Chess.com. Roster Chess.com dapat membutuhkan hingga 12 jam untuk diperbarui.",
    gabungKlub: "Buka klub BLUNDER SKUAD di Chess.com",
    label: "Username Chess.com",
    placeholder: "contoh: hikaru",
    wajib: "Masukkan username Chess.com.",
    memeriksa: "Memeriksa akun Chess.com…",
    daftar: "Daftar",
    nextJudul: "Daftar Keanggotaan",
    linkDaftar: "daftar keanggotaan",

    privasiJudul: "Data pribadi Anda aman",
    privasiIsi:
      "Nama lengkap, nomor HP/WhatsApp, dan nomor DANA hanya disimpan pada catatan pengurus dan tidak pernah ditampilkan di situs. Yang tampil publik hanya nama panggilan, kota, dan statistik Chess.com Anda. Data ini kami gunakan untuk memverifikasi bahwa satu orang hanya memiliki satu keanggotaan.",

    grupAkun: "Akun Chess.com",
    grupDiri: "Data Diri",
    grupKontak: "Kontak & Pembayaran",

    catatanUsername:
      "Gunakan username atau tautan profil chess.com/member/namaanda yang sudah bergabung di BLUNDER SKUAD.",

    labelNama: "Nama Lengkap",
    phNama: "contoh: Budi Santoso",
    catatanNama: "Sesuai identitas resmi, untuk sertifikat dan hadiah turnamen.",

    labelPanggilan: "Nama Panggilan",
    phPanggilan: "contoh: Budi",
    catatanPanggilan: "Dipakai pengurus untuk administrasi dan turnamen.",

    labelLahir: "Tanggal Lahir",
    catatanLahir: "Dipakai untuk menentukan kategori umur turnamen.",
    kategori: "Kategori",
    tahun: "tahun",

    labelKota: "Kota Asal",
    phKota: "contoh: Medan",
    catatanKota: "Untuk pembagian wilayah pada liga antar-komunitas.",

    labelHp: "Nomor HP / WhatsApp",
    phHp: "contoh: 0812-3456-7890",
    catatanHp: "Nomor aktif WhatsApp, untuk undangan turnamen dan verifikasi.",
    terbaca: "Terbaca",

    labelDana: "Nomor DANA",
    phDana: "kosongkan bila sama dengan nomor HP",
    catatanDana: "Untuk pengiriman hadiah turnamen.",

    labelEmail: "Email",
    phEmail: "contoh: budi@email.com",
    catatanEmail: "Untuk pemberitahuan resmi dari pengurus.",

    labelKlub: "Klub / Komunitas Asal",
    phKlub: "contoh: Klub Catur Medan",
    catatanKlub: "Bila Anda sudah tergabung di klub lain.",

    setuju:
      "Saya menyatakan data di atas benar, bahwa ini satu-satunya akun saya di komunitas, dan saya menyetujui Kode Etik Komunitas — termasuk larangan menggunakan bantuan engine.",

    periksaIsian: "Periksa kembali isian yang ditandai merah.",
    galatUsername: "Username Chess.com wajib diisi.",
    galatNama: "Tulis nama lengkap (minimal dua kata).",
    galatPanggilan: "Nama panggilan wajib diisi.",
    galatHp: "Nomor HP/WhatsApp tidak valid. Contoh: 0812-3456-7890.",
    galatDana: "Nomor DANA tidak valid.",
    galatKota: "Kota asal wajib diisi.",
    galatLahir: "Tanggal lahir wajib diisi.",
    galatLahirAneh: "Tanggal lahir tidak masuk akal.",
    galatEmail: "Format email tidak valid.",
    galatSetuju: "Anda harus menyetujui kode etik komunitas.",
  }
