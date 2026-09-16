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
    belumTerbacaJudul: "Kode belum terbaca",
    belumTerbacaKet: "Pastikan sudah tersimpan, lalu coba lagi beberapa saat.",
    gagalMemintaKode: "Gagal meminta kode",
    gagalMemintaKodeKet:
      "Kode tidak dapat dibuat saat ini. Coba lagi beberapa saat.",
    isiUsernameDulu: "Isi username Chess.com Anda terlebih dahulu.",
    berhasil: "Kepemilikan akun terverifikasi:",
    ganti: "Ganti akun",
    judulKosong: "Username belum diisi",
    mengerti: "Mengerti",
    akunTerverifikasi: "Akun berikut milik Anda:",
    lanjut: "Lanjut",
    batal: "Batal",

    langkahSalinJudul: "Salin kode verifikasi Anda",
    langkahSalinRincian: "Kode di bawah bersifat unik untuk pendaftaran ini.",
    langkahTempelJudul: "Tempel pada profil Chess.com",
    langkahTempelRincian:
      "Buka Settings → Profile, isi kolom Location (Lokasi) dengan kode tersebut, lalu tekan Save.",
    langkahPeriksaJudul: "Periksa kembali di sini",
    langkahPeriksaRincian:
      "Tekan Periksa Kode. Kami membaca profil publik Anda untuk mencocokkan kode.",
    kodeAnda: "Kode verifikasi Anda",
    salinKode: "Salin kode",
    salinKodeVerifikasi: "Salin kode verifikasi",
    buatKodeBaru: "Buat kode baru",
    bukaPengaturanProfil: "Buka pengaturan profil Chess.com",
    menghubungi: "Menghubungi Chess.com dan memeriksa profil {username}…",
    profilTerverifikasi: "Profil Chess.com terverifikasi. Melanjutkan pendaftaran…",
    periksaKode: "Periksa Kode",
    sedangMemeriksa: "Memeriksa…",
    verifCepatGunakan: "Gunakan verifikasi cepat",
    verifCepatToggle: "Tidak bisa menyunting profil? Verifikasi cepat",
    tutup: "Tutup",
    buka: "Buka",
    verifCepatKeterangan:
      "Bila profil Chess.com Anda belum dapat disunting atau cache masih menyimpan data lama, ketik ulang kode di atas untuk menyelesaikan verifikasi (mode konfirmasi manual).",
    kodeManual: "Kode verifikasi manual",
    phKodeCepat: "BSKUAD-XXXXXX",
    konfirmasiKode: "Konfirmasi Kode",
    catatanPrivasi:
      "Kami hanya membaca profil publik Chess.com. Kode boleh Anda hapus kembali setelah verifikasi selesai.",
    belumTerbacaProfil:
      "Kode belum terbaca pada profil {username}. Pastikan sudah ditekan Save di Chess.com, lalu periksa lagi. Profil Chess.com dapat tersimpan di cache hingga beberapa jam.",
    usernameKosong: "Username Chess.com masih kosong.",
    kodeTidakCocok:
      "Kode yang Anda masukkan tidak cocok. Salin kode di atas, lalu tempel kembali.",
    galatMemeriksa: "Gagal memeriksa profil Chess.com.",
    galatUmum: "Verifikasi gagal. Coba lagi.",

    profilUsernameKosong: "Username masih kosong.",
    profilUsernameSah:
      "Username hanya boleh berisi huruf, angka, tanda hubung, atau garis bawah (3–30 karakter).",
    profilTidakDitemukan: "Username \"{username}\" tidak ditemukan di Chess.com.",
    profilDitolak: "Chess.com menolak permintaan (kode {kode}). Coba beberapa saat lagi.",
    profilTimeout: "Waktu koneksi ke Chess.com habis. Periksa jaringan Anda lalu coba lagi.",
    profilJaringan: "Tidak dapat menghubungi Chess.com dari perangkat ini.",
    profilGagalMuat: "Profil tidak dapat dimuat.",
    oauthGagal: "Verifikasi Chess.com gagal: {sebab}",
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

    penutup:
      "Dengan menyelesaikan pendaftaran, Anda tercatat sebagai anggota Blunder Skuad dan akan diarahkan kembali ke halaman Keanggotaan.",

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

    brandLine2: "INDONESIA",
    subjudulAkun:
      "Gunakan akun Chess.com Anda. Data pendaftaran akan tersimpan aman di Komunitas Catur Indonesia.",
    labelUsernameAkun: "Nama Lengkap / Username",
    phUsername: "Username Chess.com",
    mencariProfil: "Mencari profil Chess.com…",
    profilGagalLanjut:
      "Periksa ejaan username, atau lanjutkan bila profil baru saja dibuat.",
    pengikut: "pengikut",
    profil: "Profil",
    catatanRoster:
      "Username harus sudah tercatat sebagai anggota Blunder Skuad di Chess.com. Roster Chess.com dapat membutuhkan hingga 12 jam untuk diperbarui.",
    bukaKlub: "Buka klub Blunder Skuad di Chess.com",
    berikutnya: "Berikutnya",
    verifJudul: "Verifikasi diri Anda",
    verifDeskripsi:
      "Untuk membantu menjaga keamanan akun Anda, kami ingin memastikan bahwa memang Anda yang mencoba mendaftar.",
    ubah: "Ubah",
    verifTanpaSandi:
      "Kami tidak meminta kata sandi Chess.com Anda. Verifikasi cukup dilakukan dengan menempelkan kode sekali pakai pada profil publik Anda.",
    verifLewatKode: "Verifikasi lewat kode profil",
    verifBerhasil: "Verifikasi Berhasil!",
    akunSiap:
      "Akun {username} sudah terverifikasi dan siap melanjutkan pendaftaran anggota.",
    gantiAkun: "Ganti Akun",
    lanjutkanPendaftaran: "Lanjutkan Pendaftaran",
    judulDataDiri: "Data Diri",
    deskDataDiri:
      "Isi satu data per langkah. Data disimpan secara privat oleh pengurus untuk administrasi dan turnamen.",
    judulNama: "Nama Lengkap Anda",
    judulPanggilan: "Nama Panggilan Anda",
    judulKota: "Kota Asal Anda",
    judulEmail: "Alamat Email",
    judulKontak: "Kontak & Pembayaran",
    deskKontak:
      "Isi satu data per langkah. Nomor HP/WhatsApp dan DANA hanya disimpan pada catatan pengurus dan tidak pernah ditampilkan di situs.",
    langkahDari: "Langkah {n} dari {total}",
    kembali: "Kembali",
    lanjutkan: "Lanjutkan",
    selesai: "Selesai",
    lewati: "Lewati",
    opsional: "(opsional)",
    toastDiriSelesai: "Data diri selesai. Lanjut ke Kontak & Pembayaran...",
    toastKontakSelesai: "Data kontak selesai. Periksa kembali lalu kirim pendaftaran.",
    finalIdle: "Semua data sudah lengkap. Klik tombol untuk mengirim pendaftaran.",
    finalSukses:
      "Selamat datang, {username}. Anda kini tercatat sebagai anggota Blunder Skuad.",
    finalGagal: "Ada kesalahan saat mengirim. Coba lagi.",
    mendaftarkan: "Mendaftarkan anggota...",
    pendaftaranBerhasil: "Pendaftaran Berhasil!",
    pendaftaranGagal: "Pendaftaran Gagal",
    keluarGantiAkun: "Keluar / Ganti Akun",
    ulangiAwal: "Ulangi dari Awal",
    cobaLagi: "Coba Lagi",
    kirimPendaftaran: "Kirim Pendaftaran",
    hakCipta:
      "© {tahun} Komunitas Catur Indonesia · Blunder Skuad. Pendaftaran diproses oleh pengurus klub.",
    tautanKlub: "Klub Chess.com",

    spinnerMemproses: "Memproses...",
    spinnerBerhasil: "Berhasil",
    spinnerGagal: "Gagal",
    spinnerStatus: "Status",
  }
