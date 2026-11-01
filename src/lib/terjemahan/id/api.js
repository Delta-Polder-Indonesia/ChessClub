/**
 * Kamus Indonesia (ID) · kelompok api — pesan galat lapisan API.
 *
 * Standar: lapisan API tidak menulis kalimat siap-pakai; kegagalan sisi klien
 * dibawa sebagai `kodePesan` dan diterjemahkan lewat `teksGalat(err, t)` ke
 * kunci `api.*` di berkas ini. Pesan dari server (`pesan`) ditampilkan apa
 * adanya dan tidak memakai kunci mana pun di sini. Kunci dalam berkas: api.
 */

export const api = {
  umum: "Permintaan gagal. Silakan coba lagi.",
  jaringan: "Koneksi ke server gagal. Periksa internet Anda lalu coba lagi.",
  memuatRoster: "Gagal memuat roster publik Chess.com.",
  responsTidakSah: "API anggota menjawab {status}.",
  formatTidakSah: "Format API anggota tidak sah.",
  memuatAnggota: "Daftar anggota belum dapat dimuat dari server maupun Chess.com.",
  memuatLarangan: "Gagal memuat daftar larangan.",
  mintaKode: "Kode verifikasi tidak dapat diminta. Coba lagi.",
  periksaKode: "Pemeriksaan kode gagal. Coba lagi.",
  pengajuanManual: "Pengajuan manual tidak dapat dikirim. Coba lagi.",
  pendaftaran: "Pendaftaran gagal.",
  memuatCaraVerifikasi: "Konfigurasi verifikasi tidak dapat dimuat.",
  loginChesscom: "Login Chess.com tidak tersedia.",
  responsLogin: "Respons login Chess.com tidak sah.",
  tebusKode: "Kode akses tidak bisa ditebus.",
  kirimPermintaanEbook: "Permintaan tidak bisa dikirim.",
  memuatBerita: "Gagal memuat berita komunitas.",
  memuatPengumuman: "Gagal memuat pengumuman.",
  csrf: "Gagal mengambil CSRF token.",
  csrfTidakSah: "Respons CSRF token tidak sah.",
  gagalStatus: "Gagal ({status}).",
  loginGagalStatus: "Gagal login ({status}).",
  kirimPesan: "Gagal mengirim pesan.",
  papanPeringkatRush: "Gagal memuat papan peringkat Rush.",
  simpanSkorRush: "Gagal menyimpan skor ke papan peringkat.",
  memuatJenisTurnamen: "Gagal memuat jenis turnamen.",
  memuatTurnamen: "Gagal memuat turnamen.",
  tekaTekiHarian: "Teka-teki harian gagal dimuat.",
  pengajuanTurnamen: "Pengajuan turnamen gagal.",
  turnamenTidakDitemukan: "Turnamen tidak ditemukan.",
};
