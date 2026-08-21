import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function KodeEtikKomunitas() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("kodeEtik.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("kodeEtik.deskripsi")}
      next={{
        to: "/keberlanjutan/pertanyaan-umum",
        judul: t("kodeEtik.nextJudul"),
      }}
    >
      <PageArtikel title={t("kodeEtik.artikel")}>
        <p className="text-sm text-slate-500">Terakhir diperbarui: 25 Maret 2026</p>

        <p>
          Tujuan kami adalah menciptakan tempat yang menyenangkan, aman, dan adil
          bagi semua penggemar catur untuk menikmati permainan ini.
        </p>

        <p>
          Kami mengharapkan semua anggota untuk memperlakukan orang lain dengan
          hormat dan mengikuti pedoman khusus di bawah ini. Pemain dan anggota
          komunitas yang tidak dapat mengikuti aturan ini akan dikenai peringatan,
          pembatasan hak istimewa, pemisahan kelompok bermain, atau bahkan
          penutupan akun. Kami berhak untuk mengubah Kebijakan Komunitas kapan
          saja. Kepatuhan terhadap Kebijakan Komunitas tidak menjamin akses ke
          Chess.com atau penggunaan Layanan di masa mendatang.
        </p>

        <p>
          Kebijakan Komunitas ini melengkapi{" "}
          <a
            href="https://www.chess.com/legal/user-agreement"
            target="_blank"
            rel="noreferrer noopener"
          >
            Perjanjian Pengguna
          </a>{" "}
          umum kami, yang juga berlaku untuk penggunaan Anda atas Chess.com.
          Kedua kebijakan ini menetapkan aturan perilaku di platform kami.
        </p>

        <h2>Perilaku Masyarakat</h2>
        <ul>
          <li>Bersikap baik, suka membantu, dan pemaaf.</li>
          <li>Kami tidak akan mentolerir rasisme, seksisme, fanatisme, atau ancaman kekerasan.</li>
          <li>Jangan menyalahgunakan, menyerang, mengancam, mendiskriminasi, melecehkan, atau memperlakukan anggota lain dengan buruk dalam bentuk apa pun.</li>
          <li>Jangan membajak utas diskusi, melakukan trolling, atau memposting konten yang mengganggu atau tidak bermakna.</li>
          <li>Jangan memposting spam, iklan, atau menyalin/menempel komentar dan pesan.</li>
          <li>Jangan terlalu berlebihan mempromosikan klub Anda.</li>
          <li>Jangan berdebat secara terbuka tentang topik keagamaan atau politik.</li>
          <li>Jangan mengunggah konten cabul atau pornografi.</li>
          <li>Jangan terlibat atau membahas aktivitas ilegal.</li>
          <li>
            Jangan membuka lebih dari satu akun (akun kedua yang anonim
            diperbolehkan hanya untuk tujuan pelatihan, tetapi harus disetujui
            dan diotorisasi oleh Staf Dukungan Chess.com terlebih dahulu).
          </li>
          <li>Jangan menuduh lawan Anda melakukan kecurangan (sebaiknya Anda melaporkan mereka).</li>
          <li>Jangan menyalahgunakan sistem pelaporan dengan mengajukan laporan tanpa alasan atau dasar yang kuat.</li>
        </ul>

        <h2>Sikap sportif</h2>
        <ul>
          <li>Jangan sering menghentikan permainan.</li>
          <li>Jangan membuat lawan Anda menunggu tanpa alasan.</li>
          <li>Jangan memutuskan koneksi atau keluar tanpa mengundurkan diri saat tersesat.</li>
          <li>
            Jangan melakukan tindakan sengaja apa pun yang bertujuan untuk
            mengubah peringkat Anda secara artifisial, termasuk sandbagging
            (sengaja kalah dalam pertandingan untuk menurunkan peringkat Anda)
            atau memanipulasi hasil pertandingan.
          </li>
          <li>Jangan menghina atau mengejek lawan Anda.</li>
          <li>
            Ikuti aturan{" "}
            <a
              href="https://www.chess.com/legal/fair-play"
              target="_blank"
              rel="noreferrer noopener"
            >
              Kebijakan Permainan Adil kami.
            </a>
          </li>
        </ul>

        <h2>Melaporkan Pengguna</h2>
        <p>
          Pengguna yang menemukan pelanggaran terhadap kebijakan kami dapat
          melaporkan perilaku ini kepada kami dengan mengklik ikon "Laporkan" di
          samping konten yang dilaporkan atau dengan menghubungi{" "}
          <Link to="/hubungi-kami">Dukungan</Link>. Pengguna Uni Eropa dapat
          melaporkan konten ilegal berdasarkan
          Undang-Undang Layanan Digital Uni Eropa.
        </p>
        <p>
          Laporan akan diproses berdasarkan urgensi, prioritas, volume laporan,
          dan sumber daya yang tersedia. Oleh karena itu, waktu yang dibutuhkan
          untuk meninjau setiap laporan dapat bervariasi.
        </p>
        <p>
          Kami mendorong pengguna untuk memberikan informasi dan bukti sebanyak
          mungkin untuk mendukung laporan mereka.
        </p>

        <h2>Jangan menyalahgunakan sistem pelaporan kami.</h2>
        <p>
          Laporkan hanya konten yang jelas-jelas melanggar hukum atau
          bertentangan dengan kebijakan kami.
        </p>
        <p>
          Jangan membuat laporan palsu atau jahat, mengirimkan beberapa laporan
          tentang masalah yang sama, atau meminta sekelompok pengguna untuk
          melaporkan konten atau masalah yang sama. Jika pengguna melanggar
          pedoman ini, kami dapat menandai akun mereka, memberikan sanksi kepada
          pengguna, atau mengabaikan laporan selanjutnya.
        </p>

        <h2>Peraturan Acara Komunitas</h2>
        <p>
          Untuk memastikan lingkungan yang aman, adil, dan kompetitif, semua
          turnamen, pertandingan, dan liga yang diselenggarakan oleh anggota di
          Chess.com harus mematuhi aturan yang diuraikan di bawah ini.
        </p>
        <p>
          Aturan ini berlaku ketika Anda menyelenggarakan, menjalankan, atau
          berpartisipasi dalam turnamen, pertandingan, liga, atau kompetisi catur
          lainnya yang diselenggarakan di platform kami oleh anggota, bukan oleh
          Chess.com. Kami menyebutnya{" "}
          <strong>"Acara Komunitas".</strong>
        </p>
        <p>
          Siapa pun yang membuat salah satu acara ini disebut sebagai{" "}
          <strong>"Penyelenggara."</strong> Aturan ini mengikat semua anggota,
          tetapi tugas khusus terkait administrasi dan kepatuhan berlaku khusus
          untuk Penyelenggara.
        </p>

        <h3>Klasifikasi Acara</h3>
        <p>
          Chess.com mengizinkan anggotanya untuk menyelenggarakan Acara Komunitas
          secara bebas, asalkan mereka mematuhi aturan operasional kami. Kami
          mengklasifikasikan acara ke dalam dua kategori: Acara Tidak Berafiliasi
          (standar untuk sebagian besar turnamen komunitas) dan Acara Resmi
          (dikhususkan untuk kemitraan resmi tingkat tinggi).
        </p>
        <p>
          <strong>1.</strong> Penyelenggara Acara yang Tidak Berafiliasi tidak
          memerlukan izin kami untuk menyelenggarakan acara-acara ini, selama
          mereka mematuhi "Persyaratan untuk Acara yang Tidak Berafiliasi" di
          bawah ini.
        </p>
        <p>
          <strong>2. Acara yang Disetujui.</strong> Penetapan status persetujuan
          adalah status premium yang diperuntukkan bagi acara-acara penting yang
          membutuhkan keterlibatan langsung dari Chess.com. Status ini hanya
          diberikan melalui proses aplikasi dan diskusi formal. Acara yang
          Disetujui tunduk pada persyaratan permainan adil dan operasional yang
          lebih ketat serta melibatkan biaya operasional.
        </p>

        <h3>Persyaratan untuk Acara yang Tidak Berafiliasi</h3>
        <p>
          Jika Anda adalah penyelenggara acara yang tidak berafiliasi, Anda
          tetap harus mengikuti standar berikut:
        </p>
        <ul>
          <li>
            Panitia penyelenggara wajib menampilkan pernyataan penafian ini
            secara jelas di semua halaman acara, formulir pendaftaran, dan materi
            promosi:{" "}
            <i>"Acara ini tidak berafiliasi dengan atau disponsori oleh Chess.com."</i>
          </li>
          <li>
            Penyelenggara tidak boleh menyiratkan atau menyarankan bahwa kami
            mendukung, memantau, memverifikasi, atau menyetujui acara Anda.
          </li>
          <li>
            Penyelenggara mengakui bahwa Acara yang Tidak Berafiliasi hanya
            bergantung pada deteksi permainan adil otomatis standar Chess.com.
            Chess.com tidak menyediakan dukungan analis manual, pemantauan
            langsung, atau penyelesaian sengketa khusus untuk acara-acara ini.
          </li>
          <li>
            Tanggung jawab atas kelancaran, keadilan, dan keseruan acara berada
            di tangan Penyelenggara. Para peserta bergabung dalam acara-acara ini
            dengan memahami bahwa acara tersebut dikelola secara independen dari
            staf Chess.com.
          </li>
        </ul>

        <h3>Opsi Dukungan Fair Play</h3>
        <p>
          Kami menawarkan berbagai tingkat dukungan Fair Play untuk membantu
          Penyelenggara memastikan integritas permainan mereka.
        </p>
        <ol>
          <li>
            <strong>Perlindungan Standar (Default):</strong> Semua permainan di
            Chess.com diperiksa oleh sistem deteksi otomatis standar kami.
            Penyelenggara tidak perlu melakukan tindakan apa pun.
          </li>
          <li>
            <strong>Peninjauan Otomatis yang Dipercepat (Atas Permintaan):</strong>{" "}
            Penyelenggara dapat mengirimkan email kepada kami di{" "}
            <a href="mailto:events@chess.com">events@chess.com</a> untuk meminta
            peninjauan otomatis yang dipercepat. Ini memastikan algoritma kami
            memprioritaskan permainan acara Anda. Ini adalah layanan gratis yang
            ditawarkan kepada komunitas.
          </li>
          <li>
            <strong>Peninjauan Manual oleh Analis (Berbayar):</strong> Jika
            Penyelenggara Acara yang Tidak Berafiliasi menginginkan peninjauan
            oleh staf Fair Play Chess.com, mereka dapat meminta layanan ini
            dengan mengirimkan email kepada kami di{" "}
            <a href="mailto:events@chess.com">events@chess.com</a>. Layanan ini
            tergantung ketersediaan dan akan dikenakan biaya layanan (berdasarkan
            jumlah pemain/pertandingan) untuk menutupi biaya tim peninjau manual.
          </li>
        </ol>

        <h3>Persyaratan untuk Acara yang Disetujui</h3>
        <p>
          Penyelenggara yang ingin meningkatkan status acara mereka menjadi
          "Disetujui" secara resmi harus mengajukan permohonan resmi ke
          Chess.com. Persetujuan tidak otomatis dan ditujukan untuk acara yang
          mencari kemitraan formal dengan platform tersebut. Chess.com memutuskan
          apakah akan menyetujui acara tersebut atas kebijakannya sendiri.
          Chess.com akan meninjau permohonan dan menghubungi Penyelenggara untuk
          mengoordinasikan biaya yang berlaku berdasarkan karakteristik
          (misalnya, ukuran, format, hadiah) acara tersebut.
        </p>
        <p>
          Kami akan mewajibkan penggunaan{" "}
          <a
            href="https://www.chess.com/proctor"
            target="_blank"
            rel="noreferrer noopener"
          >
            Proctor
          </a>{" "}
          (perangkat lunak fair play dari Chess.com), dan Acara ini akan
          sepenuhnya didukung oleh tim fair play dan operasional kami.
        </p>
        <ul>
          <li>
            Panitia penyelenggara wajib mengirimkan rincian mengenai format,
            pembagian hadiah, jangkauan yang diharapkan, dan rencana operasional
            menggunakan{" "}
            <a
              href="https://forms.gle/wXLEPzBukFWbLLyS6"
              target="_blank"
              rel="noreferrer noopener"
            >
              formulir
            </a>{" "}
            berikut.
          </li>
          <li>
            Acara yang diselenggarakan secara resmi harus mematuhi protokol Fair
            Play dan standar operasional kami yang paling ketat.
          </li>
          <li>
            Persetujuan permohonan dikenakan biaya yang mencakup lisensi
            perangkat lunak, pemantauan Fair Play manual, dan dukungan
            operasional acara khusus.
          </li>
        </ul>
        <p>
          Jika Chess.com memberikan status resmi, penyelenggara harus menampilkan
          pernyataan penafian ini:{" "}
          <i>
            "Acara ini secara resmi disetujui oleh, tetapi tidak berafiliasi
            dengan atau disponsori oleh, Chess.com"
          </i>
        </p>

        <h3>Aturan Operasional Umum</h3>
        <p>
          Setiap Acara Komunitas, terlepas dari klasifikasinya, harus mengikuti
          aturan-aturan berikut:
        </p>
        <ul>
          <li>
            Jangan menggunakan nama acara, logo, atau merek yang meniru atau
            berasal dari kekayaan intelektual Chess.com (misalnya, jangan
            menggunakan "Chess.com" atau nama seperti "Titled Tuesday," "Speed
            Chess Championship," atau "PogChamps").
          </li>
          <li>
            Jangan menggunakan merek dagang Chess.com dengan cara yang
            membingungkan orang tentang siapa yang menjalankan atau mensponsori
            acara tersebut.
          </li>
          <li>
            Sebagai Penyelenggara, keputusan terkait diskualifikasi tidak boleh
            melanggar Kebijakan Komunitas Chess.com (misalnya, Penyelenggara
            tidak dapat mendiskualifikasi seseorang karena alasan diskriminatif).
          </li>
        </ul>

        <h3>Peraturan dan Administrasi</h3>
        <ul>
          <li>
            Jika acara tersebut memberikan hadiah, penyelenggara harus
            menerbitkan peraturan tertulis yang jelas bagi peserta sebelum
            pendaftaran dibuka.
          </li>
          <li>
            Pihak penyelenggara sepenuhnya bertanggung jawab untuk menegakkan
            peraturan acara dan menyelesaikan perselisihan antar peserta.
          </li>
          <li>
            Panitia penyelenggara sepenuhnya bertanggung jawab atas pengadaan dan
            pendistribusian semua hadiah. Chess.com tidak bertanggung jawab atas
            perselisihan hadiah atau kegagalan pembayaran hadiah.
          </li>
        </ul>

        <h3>Sponsor Terbatas</h3>
        <p>
          Panitia penyelenggara tidak dapat menerima sponsor dari, atau
          mengiklankan, entitas atau produk yang terkait dengan:
        </p>
        <ul>
          <li>Narkoba ilegal atau zat terlarang;</li>
          <li>
            Layanan perjudian atau taruhan dilarang di yurisdiksi Anda atau
            yurisdiksi peserta acara;
          </li>
          <li>Pornografi atau konten seksual eksplisit; atau</li>
          <li>Organisasi politik atau ujaran kebencian.</li>
        </ul>

        <h3>Penafian</h3>
        <p>
          Chess.com bukanlah penyelenggara, tuan rumah, atau administrator Acara
          Komunitas. Penyelenggara dan anggota mengakui bahwa mereka
          menyelenggarakan atau berpartisipasi dalam Acara Komunitas dengan
          risiko mereka sendiri.
        </p>
        <p>
          Sejauh diizinkan oleh hukum, Penyelenggara dan pemain setuju untuk
          mengganti kerugian, membela, dan membebaskan Chess.com (termasuk para
          pejabat, direktur, karyawan, dan agen kami) dari segala klaim,
          kerugian, kerusakan, kewajiban, dan pengeluaran (termasuk biaya hukum)
          yang timbul dari atau terkait dengan: (a) pelanggaran Kebijakan ini
          oleh Penyelenggara; (b) penyelenggaraan atau pengelolaan Acara
          Komunitas oleh Penyelenggara; atau (c) perselisihan apa pun mengenai
          hadiah atau administrasi acara.
        </p>
        <p>
          Chess.com berhak, atas kebijakan mereka sendiri dan tanpa pemberitahuan,
          untuk:
        </p>
        <ul>
          <li>Hapus Acara Komunitas apa pun dari Layanan Chess.com;</li>
          <li>Mencabut status sanksi dari acara apa pun; dan</li>
          <li>
            Menangguhkan atau mengakhiri akun Penyelenggara mana pun yang terbukti
            melanggar Kebijakan ini.
          </li>
        </ul>
      </PageArtikel>
    </HalamanIsi>
  );
}
