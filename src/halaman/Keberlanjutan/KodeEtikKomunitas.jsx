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
        <p className="text-sm text-slate-500">Terakhir diperbarui: 24 Agustus 2026</p>

        <h2>1. Tujuan dan Ruang Lingkup</h2>
        <p>
          Kebijakan ini disusun sebagai landasan operasional Blunder Skuad
          dalam menciptakan ekosistem catur yang menyenangkan, aman, dan adil
          bagi seluruh anggota. Dokumen ini berlaku untuk setiap individu yang
          tercatat sebagai anggota komunitas, baik dalam interaksi di platform
          daring maupun dalam kegiatan luring yang diselenggarakan atas nama
          Blunder Skuad. Kami berhak untuk merevisi kebijakan ini sewaktu-waktu
          guna menyesuaikan dengan perkembangan komunitas dan kebutuhan
          pengaturan yang lebih baik. Kepatuhan terhadap kebijakan ini merupakan
          prasyarat mutlak bagi setiap anggota, namun kepatuhan tersebut tidak
          serta-merta menjamin kelangsungan keanggotaan di masa mendatang
          apabila terdapat pertimbangan administratif atau etis lainnya.
        </p>

        <h2>2. Perilaku dalam Komunitas</h2>
        <p>
          Setiap anggota diharapkan untuk memperlakukan sesama dengan hormat,
          bersikap suka membantu, dan memaafkan ketika diperlukan. Blunder Skuad tidak akan mentolerir segala bentuk rasisme, seksisme,
          fanatisme, maupun ancaman kekerasan dalam bentuk apa pun. Dilarang
          keras untuk menyalahgunakan, menyerang, mengancam, mendiskriminasi,
          melecehkan, atau memperlakukan anggota lain dengan cara yang
          merendahkan, baik melalui pesan teks, ucapan langsung, maupun simbol
          dan gestur. Anggota juga dilarang untuk membajak jalannya diskusi,
          melakukan trolling, atau memposting konten yang tidak bermakna dan
          mengganggu kenyamanan bersama. Spam, iklan komersial, serta penyalinan
          dan penempelan komentar secara berulang tidak diperbolehkan dalam
          ruang komunikasi komunitas. Promosi berlebihan terhadap klub atau
          komunitas lain juga perlu dihindari agar ruang ini tetap terfokus pada
          tujuan bersama. Topik keagamaan dan politik tidak diperbolehkan untuk
          diperdebatkan secara terbuka, mengingat kedua ranah tersebut memiliki
          potensi tinggi untuk memecah belah. Konten yang mengandung unsur
          cabul, pornografi, maupun pembahasan aktivitas ilegal sama sekali
          tidak dapat diterima. Setiap anggota hanya diperbolehkan memiliki satu
          akun resmi dalam sistem komunitas; akun kedua hanya dapat
          dipertimbangkan untuk tujuan pelatihan khusus dan wajib mendapatkan
          persetujuan tertulis dari pengurus terlebih dahulu. Apabila Anda
          mencurigai adanya kecurangan dari lawan, jangan menuduh secara
          terbuka, melainkan laporkan melalui saluran resmi yang telah
          disediakan. Penyalahgunaan sistem pelaporan dengan mengajukan laporan
          tanpa dasar yang kuat juga merupakan pelanggaran yang akan dikenai
          sanksi.
        </p>

        <h2>3. Sikap Sportif dalam Bermain</h2>
        <p>
          Catur adalah permainan yang lahir dari tradisi kehormatan, dan
          Blunder Skuad berkomitmen untuk menjaga warisan tersebut. Anggota
          dilarang menghentikan permainan secara berulang kali tanpa alasan
          yang jelas, membuat lawan menunggu dengan sengaja, atau memutuskan
          koneksi dan keluar dari pertandingan tanpa mengundurkan diri ketika
          posisi sudah kalah. Tindakan apa pun yang bertujuan untuk memanipulasi
          peringkat secara artifisial, termasuk sengaja kalah dalam pertandingan
          untuk menurunkan rating (<em>sandbagging</em>) atau memanipulasi hasil
          pertandingan dengan cara apa pun, merupakan pelanggaran serius.
          Menghina, mengejek, atau merendahkan lawan main, baik sebelum, selama,
          maupun setelah pertandingan, tidak sesuai dengan nilai-nilai
          komunitas ini. Seluruh anggota wajib mematuhi protokol Permainan Adil
          yang berlaku di Blunder Skuad, yang mencakup larangan penggunaan
          mesin analisis, database bukaan, atau bantuan pihak ketiga selama
          pertandingan berlangsung kecuali dalam format yang secara eksplisit
          mengizinkannya.
        </p>

        <h2>4. Mekanisme Pelaporan</h2>
        <p>
          Anggota yang menemukan pelanggaran terhadap kebijakan ini dapat
          melaporkannya kepada pengurus melalui saluran pelaporan resmi yang
          telah ditetapkan. Setiap laporan akan diproses berdasarkan tingkat
          urgensi, prioritas, volume laporan yang masuk, serta sumber daya yang
          tersedia pada saat itu, sehingga waktu peninjauan dapat bervariasi.
          Kami sangat menganjurkan agar pelapor menyertakan informasi
          selengkap-lengkapnya beserta bukti yang mendukung, sehingga proses
          verifikasi dapat berjalan dengan lebih efektif. Sistem pelaporan
          disediakan untuk konten yang jelas-jelas melanggar hukum atau
          bertentangan dengan kebijakan komunitas; laporan palsu, laporan yang
          dibuat dengan niat jahat, pengiriman laporan berulang untuk masalah
          yang sama, atau koordinasi dengan sekelompok anggota untuk melaporkan
          konten yang sama secara serentak merupakan tindakan yang tidak akan
          ditolerir. Pengguna yang terbukti menyalahgunakan sistem pelaporan
          dapat dikenai penandaan pada akunnya, sanksi administratif, atau
          pengabaian terhadap laporan selanjutnya yang berasal dari akun
          tersebut.
        </p>

        <h2>5. Peraturan Acara Komunitas</h2>
        <p>
          Untuk menjamin lingkungan yang aman, adil, dan kompetitif, seluruh
          turnamen, pertandingan, liga, serta kompetisi catur lainnya yang
          diselenggarakan oleh anggota atas nama Blunder Skuad wajib mematuhi
          aturan yang diuraikan dalam bagian ini. Ketentuan ini mengikat semua
          anggota, namun tanggung jawab khusus terkait administrasi dan
          kepatuhan berlaku secara spesifik bagi individu atau kelompok yang
          bertindak sebagai penyelenggara acara.
        </p>

        <h3>Klasifikasi Acara</h3>
        <p>
          Blunder Skuad mengklasifikasikan acara ke dalam dua kategori utama.
          Pertama, <strong>Acara Internal</strong>, yang merupakan format standar
          bagi sebagian besar turnamen dan kegiatan komunitas. Penyelenggara
          acara internal tidak memerlukan izin khusus dari pengurus utama selama
          mematuhi persyaratan operasional yang telah ditetapkan. Kedua,{" "}
          <strong>Acara Resmi</strong>, yang merupakan status premium
          diperuntukkan bagi kegiatan penting yang memerlukan keterlibatan
          langsung dan dukungan penuh dari pengurus Blunder Skuad. Status ini
          hanya dapat diperoleh melalui proses pengajuan formal, diskusi, dan
          persetujuan pengurus.
        </p>

        <h3>Persyaratan untuk Acara Internal</h3>
        <p>
          Penyelenggara acara internal wajib menampilkan pernyataan berikut
          secara jelas di semua halaman acara, formulir pendaftaran, dan materi
          promosi:{" "}
          <em>
            "Acara ini diselenggarakan secara mandiri oleh anggota Blunder Skuad dan merupakan tanggung jawab penuh penyelenggara."
          </em>{" "}
          Penyelenggara tidak boleh menyiratkan atau menyarankan bahwa pengurus
          utama secara langsung mendukung, memantau, memverifikasi, atau
          menyetujui acara tersebut kecuali jika terdapat pernyataan tertulis
          yang menyatakan sebaliknya. Acara internal mengandalkan pada mekanisme
          deteksi permainan adil standar yang diterapkan dalam komunitas ini;
          pengurus utama tidak menyediakan dukungan analisis manual, pemantauan
          langsung, atau penyelesaian sengketa khusus untuk acara-acara ini.
          Tanggung jawab atas kelancaran, keadilan, dan keseruan acara berada
          sepenuhnya di tangan penyelenggara, dan para peserta bergabung dengan
          pemahaman bahwa acara tersebut dikelola secara independen oleh anggota
          yang bersangkutan.
        </p>

        <h3>Opsi Dukungan Permainan Adil</h3>
        <p>
          Blunder Skuad menyediakan berbagai tingkat dukungan permainan adil
          untuk membantu penyelenggara menjaga integritas acara mereka.{" "}
          <strong>Perlindungan Standar</strong> adalah mekanisme default yang
          berlaku untuk seluruh pertandingan di dalam komunitas, di mana setiap
          permainan diperiksa oleh sistem deteksi otomatis standar.
          Penyelenggara tidak perlu melakukan tindakan tambahan untuk
          mengaktifkan perlindungan ini. <strong>Peninjauan Prioritas</strong>{" "}
          dapat diminta oleh penyelenggara kepada pengurus apabila ingin
          algoritme deteksi memprioritaskan pertandingan dalam acara mereka;
          layanan ini dapat disediakan secara gratis sesuai ketersediaan sumber
          daya. <strong>Peninjauan Manual</strong> oleh tim analisis internal
          Blunder Skuad dapat diminta oleh penyelenggara acara internal apabila
          diperlukan investigasi yang lebih mendalam; layanan ini tergantung
          pada ketersediaan tim dan dapat dikenakan biaya operasional untuk
          menutupi jam kerja analisis manual.
        </p>

        <h3>Persyaratan untuk Acara Resmi</h3>
        <p>
          Penyelenggara yang ingin mengajukan status resmi untuk acaranya harus
          mengirimkan permohonan formal kepada pengurus Blunder Skuad.
          Persetujuan tidak bersifat otomatis dan ditujukan bagi acara yang
          mencari kemitraan formal dengan komunitas ini. Pengurus akan meninjau
          permohonan dan menghubungi penyelenggara untuk mengoordinasikan
          detail operasional, termasuk biaya yang mungkin berlaku berdasarkan
          karakteristik acara seperti ukuran peserta, format pertandingan, dan
          struktur hadiah. Acara resmi akan sepenuhnya didukung oleh tim
          permainan adil dan operasional kami, dengan penerapan protokol
          pemantauan yang paling ketat. Apabila status resmi diberikan,
          penyelenggara wajib menampilkan pernyataan:{" "}
          <em>
            "Acara ini secara resmi didukung oleh, namun tetap merupakan
            tanggung jawab penyelenggara, Blunder Skuad."
          </em>
        </p>

        <h3>Aturan Operasional Umum</h3>
        <p>
          Setiap acara komunitas, terlepas dari klasifikasinya, harus mematuhi
          aturan operasional berikut. Penyelenggara dilarang menggunakan nama
          acara, logo, atau identitas visual yang meniru atau berasal dari
          kekayaan intelektual pihak lain, termasuk merek dagang yang terdaftar.
          Sebagai penyelenggara, keputusan terkait diskualifikasi tidak boleh
          melanggar kebijakan komunitas yang lebih besar; diskualifikasi atas
          dasar diskriminatif dalam bentuk apa pun tidak dapat diterima. Jika
          acara memberikan hadiah, penyelenggara wajib menerbitkan peraturan
          tertulis yang jelas sebelum pendaftaran dibuka. Penyelenggara
          sepenuhnya bertanggung jawab untuk menegakkan peraturan acara dan
          menyelesaikan perselisihan antarpeserta. Pengadaan dan pendistribusian
          seluruh hadiah menjadi tanggung jawab penuh panitia penyelenggara;
          Blunder Skuad dalam kapasitasnya sebagai komunitas induk tidak
          bertanggung jawab atas perselisihan hadiah atau kegagalan pembayaran.
        </p>

        <h3>Sponsor dan Promosi</h3>
        <p>
          Panitia penyelenggara tidak diperbolehkan untuk menerima sponsor dari,
          atau mengiklankan, entitas atau produk yang terkait dengan narkoba
          ilegal atau zat terlarang, layanan perjudian atau taruhan yang
          dilarang dalam yurisdiksi relevan, pornografi atau konten seksual
          eksplisit, serta organisasi politik atau kelompok yang menyebarkan
          ujaran kebencian. Pembatasan ini diterapkan untuk menjaga citra dan
          nilai-nilai komunitas agar tetap kondusif bagi seluruh anggota.
        </p>

        <h2>6. Penafian dan Tanggung Jawab</h2>
        <p>
          Blunder Skuad dalam kapasitasnya sebagai komunitas induk bukanlah
          penyelenggara, tuan rumah, atau administrator langsung dari setiap
          acara komunitas yang diselenggarakan oleh anggota secara mandiri.
          Penyelenggara dan peserta mengakui bahwa mereka menyelenggarakan atau
          berpartisipasi dalam acara tersebut dengan risiko mereka sendiri.
          Sejauh diizinkan oleh hukum yang berlaku, penyelenggara dan pemain
          setuju untuk membebaskan Blunder Skuad, termasuk para pengurus,
          koordinator, dan perwakilan komunitas, dari segala klaim, kerugian,
          kerusakan, kewajiban, dan pengeluaran yang timbul dari atau terkait
          dengan pelanggaran kebijakan ini oleh penyelenggara, penyelenggaraan
          atau pengelolaan acara komunitas, maupun perselisihan apa pun
          mengenai hadiah atau administrasi acara. Pengurus Blunder Skuad
          berhak, atas kebijakan sendiri dan tanpa pemberitahuan sebelumnya,
          untuk menghapus acara komunitas apa pun dari jadwal resmi, mencabut
          status acara, serta menangguhkan atau mengakhiri keanggotaan
          penyelenggara yang terbukti melanggar kebijakan ini.
        </p>

        <p>
          <em>
            Dokumen ini disusun sebagai pedoman hidup komunitas Blunder Skuad.
            Dengan tetap aktif sebagai anggota, Anda dianggap telah membaca,
            memahami, dan menyetujui seluruh ketentuan yang tercantum di atas.
          </em>
        </p>

        <p>
          <strong>Blunder Skuad</strong>
          <br />
          <em>Komunitas Catur untuk Semua</em>
        </p>
      </PageArtikel>
    </HalamanIsi>
  );
}
