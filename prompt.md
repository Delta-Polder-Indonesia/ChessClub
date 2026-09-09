// TutorialModal.tsx
import { BookOpen, GraduationCap, User, Shield, Users, Globe } from 'lucide-react';
import { namaSekolah } from '../halaman/components/Profile/dataSekolah';

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TutorialModal({ open, onClose }: TutorialModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex w-full max-w-none flex-col overflow-hidden bg-white font-serif text-gray-900">
      {/* Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-8 sm:px-6">
        <div className="relative w-full max-w-none">
          {/* Banner / Judul Utama */}
          <div className="relative mb-6 border-b-4 border-double border-gray-900 pt-14 pb-5 text-center md:pt-10">
            <div className="absolute top-14 right-0 z-10 md:top-10">
              <button type="button"
                onClick={onClose}
                className="mr-0 cursor-pointer text-sm font-medium text-slate-700 transition hover:text-slate-900"
              >
                Tutup
              </button>
            </div>

            <p className="mb-1 font-sans text-xs font-bold tracking-widest text-gray-900 uppercase">
              Petunjuk Resmi • Jurnal Academic
            </p>
            <h1 className="mb-2 pr-24 pl-24 text-3xl leading-none font-black tracking-tight text-gray-900 uppercase md:text-4xl">
              PANDUAN AKSES PORTAL
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-gray-900 italic">
              Tata Cara dan Langkah-Langkah Memasuki Sistem Informasi {namaSekolah}
            </p>
          </div>

          {/* Intro Artikel */}
          <div className="mb-6 border-b border-gray-400 pb-6">
            <p className="first-letter:line-height-none text-justify text-sm leading-relaxed text-gray-900 first-letter:float-left first-letter:mr-2 first-letter:text-4xl first-letter:font-bold">
              Portal informasi ini dirancang khusus untuk memfasilitasi seluruh warga sekolah dalam
              mengakses informasi akademik, rekapitulasi nilai, jadwal pelajaran berkala, serta
              kelengkapan administrasi. Demi kelancaran bersama, diharapkan seluruh pengguna
              mengikuti instruksi otentikasi di bawah ini dengan saksama.
            </p>
          </div>

          {/* Seksi Utama: Langkah-Langkah Masuk */}
          <div className="space-y-6 border-b border-gray-400 pb-6">
            <h3 className="mb-4 border-b border-gray-900 pb-1 font-serif text-base font-black tracking-tight text-gray-900 uppercase">
              I. Prosedur Otentikasi Pengguna
            </h3>

            {/* Langkah 1 */}
            <div className="text-justify">
              <h4 className="mb-1 font-sans text-sm font-bold text-gray-900 uppercase">
                Langkah 1: Penentuan Peran Pengguna
              </h4>
              <p className="border-l-2 border-gray-900 pl-4 text-sm leading-relaxed text-gray-900">
                Pada halaman muka sistem, Anda diwajibkan untuk memilih salah satu dari empat
                kategori peran yang tersedia: <span className="font-bold">Guru</span>,{' '}
                <span className="font-bold">Siswa</span>,{' '}
                <span className="font-bold">Orang Tua</span>, atau{' '}
                <span className="font-bold">Tamu</span>. Klik tombol atau tab yang sesuai dengan
                identitas Anda untuk memunculkan formulir masuk yang tepat.
                <span className="mt-1 block text-xs text-gray-900 italic">
                  *Catatan: Memilih peran yang salah akan mengakibatkan kredensial Anda tidak
                  dikenali oleh sistem.
                </span>
              </p>
            </div>

            {/* Langkah 2 */}
            <div className="text-justify">
              <h4 className="mb-1 font-sans text-sm font-bold text-gray-900 uppercase">
                Langkah 2: Pengisian Kredensial Resmi
              </h4>
              <div className="mb-2 space-y-2 border-l-2 border-gray-900 pl-4 text-sm leading-relaxed text-gray-900">
                <p>Isilah kolom identitas sesuai dengan peran yang telah Anda pilih sebelumnya:</p>
                <ul className="ml-2 list-inside list-disc space-y-1">
                  <li>
                    <span className="font-bold">Guru:</span> Gunakan Nomor Induk Pegawai (NIP).
                  </li>
                  <li>
                    <span className="font-bold">Siswa:</span> Gunakan Nomor Induk Siswa (NIS) atau
                    NISN (4–10 digit angka).
                  </li>
                  <li>
                    <span className="font-bold">Orang Tua:</span> Gunakan{' '}
                    <span className="font-bold">Nama Lengkap Orang Tua</span> yang terdaftar (Login
                    ID).
                  </li>
                  <li>
                    <span className="font-bold">Tamu:</span> Gunakan{' '}
                    <span className="font-bold">Kode Akses Khusus</span> atau alamat Email aktif.
                  </li>
                </ul>
                <p>Masukkan kata sandi (password) Anda pada kolom kedua dengan teliti.</p>
              </div>
            </div>

            {/* Langkah Tambahan: Integrasi Perpustakaan */}
            <div className="rounded border border-gray-300 bg-white p-2 text-justify">
              <h4 className="mb-1 flex items-center gap-2 font-sans text-sm font-bold text-gray-900 uppercase">
                <BookOpen className="h-4 w-4" /> Integrasi Akun Perpustakaan
              </h4>
              <p className="border-l-2 border-gray-900 pl-4 text-sm leading-relaxed text-gray-900">
                Akun perpustakaan kini telah <span className="font-bold">terintegrasi</span> dengan
                portal utama. Anda tidak perlu mendaftar ulang. Gunakan{' '}
                <span className="font-bold">Password yang sama</span> dengan portal utama untuk
                mengakses layanan perpustakaan digital.
              </p>
            </div>

            {/* Langkah 3 */}
            <div className="text-justify">
              <h4 className="mb-1 font-sans text-sm font-bold text-gray-900 uppercase">
                Langkah 3: Pernyataan Masuk & Bantuan
              </h4>
              <p className="border-l-2 border-gray-900 pl-4 text-sm leading-relaxed text-gray-900">
                Tekan tombol{' '}
                <span className="border border-gray-900 px-1 font-sans text-xs font-bold uppercase">
                  Masuk
                </span>{' '}
                untuk validasi. Jika Anda mengalami kendala login atau lupa password, silakan
                hubungi petugas Tata Usaha untuk reset kata sandi.
              </p>
            </div>

            {/* Langkah 4 (Pindahan Narahubung Baru) */}
            <div className="text-justify">
              <h4 className="mb-1 font-sans text-sm font-bold text-gray-900 uppercase">
                Langkah 4: Hubungi Narahubung Jam Kerja
              </h4>
              <div className="border-l-2 border-gray-900 pl-4 text-sm leading-relaxed text-gray-900">
                <p className="mb-2">
                  Jika masih menemui kendala teknis atau masalah otentikasi login, Anda dapat
                  menghubungi tim narahubung resmi pada{' '}
                  <span className="font-bold">Jam Kerja {namaSekolah}</span> (Senin - Jum'at: 08.30
                  - 15.30 WIB). Harap sebutkan Nama, NIM/NIP, Program Studi, beserta detail
                  pertanyaan Anda secara jelas:
                </p>
                <ul
                  className="mt-3 grid grid-cols-1 gap-3 font-sans sm:grid-cols-3"
                  id="list-narahubung"
                >
                  <li
                    className="rounded border border-gray-400 bg-white p-3"
                    data-phone="085179611794"
                  >
                    <h5 className="text-xs font-bold tracking-wide uppercase">nama (Layanan I)</h5>
                    <p className="mt-0.5 font-mono text-xs text-gray-800">isi no hp di sini</p>
                  </li>
                  <li
                    className="rounded border border-gray-400 bg-white p-3"
                    data-phone="082173777307"
                  >
                    <h5 className="text-xs font-bold tracking-wide uppercase">nama (Layanan II)</h5>
                    <p className="mt-0.5 font-mono text-xs text-gray-800">isi no hp di sini</p>
                  </li>
                  <li
                    className="rounded border border-gray-400 bg-white p-3"
                    data-phone="081325030289"
                  >
                    <h5 className="text-xs font-bold tracking-wide uppercase">
                      nama (Layanan III)
                    </h5>
                    <p className="mt-0.5 font-mono text-xs text-gray-800">isi no hp di sini</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Seksi Akun Uji Coba */}
          <div className="border-b border-gray-400 pt-6 pb-6">
            <h3 className="mb-4 border-b border-gray-900 pb-1 font-serif text-base font-black tracking-tight text-gray-900 uppercase">
              II. Lampiran Akun Uji Coba (Demo) jika sudah release hapus
            </h3>
            <p className="mb-4 text-xs text-gray-900 italic">
              *Tabel di bawah ini memuat data akun percontohan guna keperluan pengujian sistem oleh
              pihak internal:
            </p>

            {/* A. ADMIN MASTER */}
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold text-gray-900 uppercase">
                <Shield className="h-4 w-4" /> A. Administrator Master
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
                      <th className="w-2/5 py-2 pr-4">Peran</th>
                      <th className="w-2/5 py-2 pr-4">Username</th>
                      <th className="w-1/5 py-2 text-right">Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2.5 font-bold text-gray-900">Admin PPDB</td>
                      <td className="py-2.5 font-mono text-xs text-gray-900">admin</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">(env)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-xs text-gray-900 italic">
                *Akun admin PPDB dikonfigurasi administrator melalui variabel{' '}
                <code className="font-mono">VITE_ADMIN_PIN</code> — tidak dicantumkan di dalam
                aplikasi. Akses tersedia hanya melalui panel penerimaan siswa baru.
              </p>
            </div>

            {/* B. GURU */}
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold text-gray-900 uppercase">
                <GraduationCap className="h-4 w-4" /> B. Tenaga Pendidik (Guru)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
                      <th className="w-2/5 py-2 pr-4">Nama</th>
                      <th className="w-2/5 py-2 pr-4">NIP (Username)</th>
                      <th className="w-1/5 py-2 text-right">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr>
                      <td className="truncate py-2.5 font-bold text-gray-900">
                        Bapak Andi Pratama
                      </td>
                      <td className="py-2.5 font-mono text-xs text-gray-900">198501012010011001</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">guru123</td>
                    </tr>
                    <tr>
                      <td className="truncate py-2.5 font-bold text-gray-900">Ibu Rina Kartika</td>
                      <td className="py-2.5 font-mono text-xs text-gray-900">198701022012012002</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">guru123</td>
                    </tr>
                    <tr>
                      <td className="truncate py-2.5 font-bold text-gray-900">
                        Bapak Dedi Saputra
                      </td>
                      <td className="py-2.5 font-mono text-xs text-gray-900">198901032014013003</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">guru123</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* C. SISWA */}
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold text-gray-900 uppercase">
                <User className="h-4 w-4" /> C. Siswa Aktif
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
                      <th className="w-2/5 py-2 pr-4">Nama</th>
                      <th className="w-2/5 py-2 pr-4">NIS (Username)</th>
                      <th className="w-1/5 py-2 text-right">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr>
                      <td className="truncate py-2.5 font-bold text-gray-900">Siti Rahma</td>
                      <td className="py-2.5 font-mono text-xs text-gray-900">2024001</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">
                        siswa123
                      </td>
                    </tr>
                    <tr>
                      <td className="truncate py-2.5 font-bold text-gray-900">Budi Santoso</td>
                      <td className="py-2.5 font-mono text-xs text-gray-900">2024002</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">
                        siswa123
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* D. ORANG TUA */}
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold text-gray-900 uppercase">
                <Users className="h-4 w-4" /> D. Wali Murid (Orang Tua)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
                      <th className="w-2/5 py-2 pr-4">Nama Wali</th>
                      <th className="w-2/5 py-2 pr-4">Wali Dari</th>
                      <th className="w-1/5 py-2 text-right">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr>
                      <td className="truncate py-2.5 font-bold text-gray-900">Bpk. Ahmad</td>
                      <td className="py-2.5 text-xs text-gray-900 italic">Siti Rahma</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">ortu123</td>
                    </tr>
                    <tr>
                      <td className="truncate py-2.5 font-bold text-gray-900">Ibu Sumiyati</td>
                      <td className="py-2.5 text-xs text-gray-900 italic">Budi Santoso</td>
                      <td className="py-2.5 text-right font-mono text-xs text-gray-900">ortu123</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-xs text-gray-900 italic">
                *Cara login: Pilih peran <span className="font-bold">Orang Tua</span>, masukkan Nama
                Wali di kolom ID.
              </p>
            </div>

            {/* E. TAMU */}
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-2 font-sans text-sm font-bold text-gray-900 uppercase">
                <Globe className="h-4 w-4" /> E. Pengunjung (Tamu)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse border-t-2 border-b-2 border-gray-900 text-left font-sans text-sm">
                  <thead>
                    <tr className="border-b border-gray-900 bg-gray-50 text-xs font-bold text-gray-900 uppercase">
                      <th className="w-2/5 py-2 pr-4">Kategori</th>
                      <th className="w-2/5 py-2 pr-4">Kode Akses</th>
                      <th className="w-1/5 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2.5 font-bold text-gray-900">Umum</td>
                      <td className="py-2.5 font-mono text-xs text-gray-900">TAMU2026</td>
                      <td className="py-2.5 text-right text-xs font-bold text-emerald-600">
                        AKTIF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-1 text-xs text-gray-900 italic">
                *Cara login: Pilih peran <span className="font-bold">Tamu</span>, masukkan Kode
                Akses di kolom Password.
              </p>
            </div>
          </div>

          {/* Seksi Maklumat Keamanan */}
          <div className="border-b-2 border-gray-950 pt-6 pb-8">
            <div className="border border-gray-950 p-4">
              <h4 className="mb-3 text-center font-sans text-sm font-bold tracking-wide text-gray-900 uppercase">
                ! MAKLUMAT PENTING PERLINDUNGAN DATA !
              </h4>
              <ul className="space-y-2 text-justify text-xs text-gray-900">
                <li className="list-inside list-disc">
                  <span className="font-bold">Kerahasiaan Sandi:</span> Dilarang keras membagikan
                  ataupun memperlihatkan kombinasi kata sandi Anda kepada pihak lain demi
                  menghindari penyalahgunaan wewenang berkas.
                </li>
                <li className="list-inside list-disc">
                  <span className="font-bold">Terminasi Sesi:</span> Pastikan Anda selalu menekan
                  opsi <span className="italic">Log Out</span> (Keluar Sistem) secara sempurna
                  setelah selesai mengoperasikan portal, terutama jika menggunakan perangkat
                  komputer umum.
                </li>
                <li className="list-inside list-disc">
                  <span className="font-bold">Pemulihan Akun:</span> Apabila terjadi kendala
                  hilangnya akses atau lupa kata sandi, segeralah melapor ke ruang Tata Usaha untuk
                  dilakukan penyetelan ulang oleh petugas operator.
                </li>
              </ul>
            </div>
          </div>

          {/* Catatan Kaki */}
          <p className="pt-4 text-center font-sans text-[11px] text-gray-900 italic">
            Layanan Bantuan Terintegrasi • Sekretariat {namaSekolah}
          </p>
        </div>
      </div>
    </div>
  );
}