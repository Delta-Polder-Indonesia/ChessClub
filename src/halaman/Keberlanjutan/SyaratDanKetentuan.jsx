import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

export default function SyaratDanKetentuan() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("syarat.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("syarat.deskripsi")}
      next={{
        to: "/keberlanjutan/kode-etik-komunitas",
        judul: t("syarat.nextJudul"),
      }}
    >
      <PageArtikel>
        <p className="text-sm text-slate-500">Terakhir diperbarui: 24 Agustus 2026</p>

        <p>
          Berikut adalah Syarat &amp; Ketentuan untuk komunitas catur Blunder Skuad, disusun secara formal dan komprehensif agar dapat berfungsi
          sebagai pedoman operasional yang jelas bagi seluruh anggota.
        </p>

        <h2>1. Ruang Lingkup dan Definisi</h2>
        <p>
          Blunder Skuad adalah komunitas catur yang dibentuk atas dasar minat
          bersama terhadap olahraga catur, baik dalam ranah rekreasi maupun
          kompetitif. Dengan bergabung dalam komunitas ini, setiap individu
          dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan
          yang tercantum dalam dokumen ini. Istilah "Anggota" merujuk pada
          setiap orang yang telah menyelesaikan proses pendaftaran dan diterima
          sebagai bagian dari Blunder Skuad, sementara "Pengurus" adalah
          individu atau kelompok yang ditunjuk untuk mengelola operasional,
          kegiatan, dan penegakan aturan dalam komunitas.
        </p>

        <h2>2. Keanggotaan dan Pendaftaran</h2>
        <p>
          Keanggotaan terbuka bagi siapa saja yang memiliki ketertarikan pada
          catur, tanpa memandang tingkat keterampilan, usia, atau latar
          belakang, asalkan memenuhi persyaratan administratif yang ditetapkan
          oleh Pengurus. Proses pendaftaran wajib dilakukan dengan memberikan
          informasi yang akurat, lengkap, dan dapat dipertanggungjawabkan.
          Blunder Skuad berhak menolak atau mencabut keanggotaan seseorang
          apabila ditemukan adanya penyalahgunaan identitas, pemalsuan data,
          atau indikasi perilaku yang tidak sesuai dengan nilai-nilai
          komunitas. Keanggotaan bersifat sukarela, namun setelah diterima,
          setiap Anggota memiliki kewajiban untuk berpartisipasi aktif dan
          mematuhi segala ketentuan yang berlaku.
        </p>

        <h2>3. Kode Etik dan Perilaku Anggota</h2>
        <p>
          Setiap Anggota wajib menjunjung tinggi sportivitas, menghormati lawan
          main, serta menghindari segala bentuk perilaku yang merendahkan,
          mengintimidasi, atau mendiskriminasi anggota lain. Dalam setiap
          pertandingan, baik formal maupun informal, dilarang keras melakukan
          kecurangan dalam bentuk apa pun, termasuk namun tidak terbatas pada
          penggunaan mesin analisis catur tanpa izin, kolusi dengan pihak
          ketiga, atau manipulasi hasil pertandingan. Komunikasi di dalam
          platform komunitas harus dilakukan dengan bahasa yang sopan dan
          konstruktif; penggunaan ujaran kebencian, provokasi, atau konten yang
          mengandung unsur SARA tidak akan ditolerir. Anggota yang merasa
          dirugikan atau mengalami perlakukan tidak menyenangkan dari anggota
          lain diharapkan untuk melaporkan kejadian tersebut kepada Pengurus
          melalui saluran resmi yang telah disediakan.
        </p>

        <h2>4. Aturan Bermain dan Turnamen</h2>
        <p>
          Seluruh kegiatan bermain dan turnamen yang diselenggarakan oleh
          Blunder Skuad mengacu pada aturan catur standar FIDE, kecuali jika
          terdapat modifikasi khusus yang diumumkan sebelumnya oleh Panitia atau
          Pengurus. Dalam turnamen daring, setiap Anggota bertanggung jawab atas
          koneksi internet dan perangkat yang digunakannya; kekalahan akibat
          gangguan teknis tidak dapat menjadi alasan untuk membatalkan atau
          mengulang pertandingan, kecuali jika ada kebijakan khusus yang
          mengaturnya. Penggunaan analisis mesin, database bukaan, atau bantuan
          pihak ketiga selama pertandingan berlangsung merupakan pelanggaran
          serius yang dapat berakibat pada diskualifikasi permanen. Keputusan
          wasit atau arbiter dalam setiap pertandingan bersifat final dan
          mengikat, namun Anggota tetap memiliki hak untuk mengajukan protes
          dalam batas waktu yang telah ditentukan apabila terdapat dugaan
          kesalahan prosedur.
        </p>

        <h2>5. Hak dan Kewajiban Anggota</h2>
        <p>
          Sebagai bagian dari komunitas, setiap Anggota berhak mengikuti seluruh
          kegiatan yang diselenggarakan oleh Blunder Skuad, mengakses sumber
          daya dan materi pembelajaran yang disediakan, serta mendapatkan
          kesempatan yang setara untuk berpartisipasi dalam turnamen dan event
          komunitas. Di sisi lain, Anggota memiliki kewajiban untuk menjaga nama
          baik komunitas, mematuhi jadwal dan tata tertib kegiatan, serta
          berkontribusi secara positif terhadap perkembangan komunitas, baik
          melalui partisipasi aktif maupun dukungan moral terhadap anggota lain.
          Setiap Anggota juga bertanggung jawab atas keamanan akun dan data
          pribadinya; kerugian yang timbul akibat kelalaian penggunaan akun
          menjadi tanggung jawab individu yang bersangkutan.
        </p>

        <h2>6. Sanksi dan Pelanggaran</h2>
        <p>
          Pelanggaran terhadap Syarat &amp; Ketentuan ini akan dikenakan sanksi
          sesuai dengan tingkat keparahan dan frekuensi pelanggaran. Sanksi
          ringan dapat berupa peringatan tertulis atau pembatasan akses
          sementara terhadap fitur-fitur tertentu dalam komunitas, sementara
          pelanggaran berat seperti kecurangan dalam pertandingan, pelecehan,
          atau tindakan kriminal dapat mengakibatkan pencabutan keanggotaan
          permanen dan pelarangan berpartisipasi dalam seluruh kegiatan Blunder Skuad. Keputusan mengenai jenis sanksi yang diberikan menjadi
          wewenang Pengurus, dan Anggota yang dikenai sanksi memiliki hak untuk
          mengajukan banding satu kali dengan menyertakan alasan dan bukti yang
          relevan.
        </p>

        <h2>7. Privasi dan Perlindungan Data</h2>
        <p>
          Blunder Skuad menghargai privasi setiap Anggota dan berkomitmen untuk
          melindungi data pribadi yang dikumpulkan selama proses pendaftaran
          maupun selama kegiatan komunitas berlangsung. Informasi pribadi Anggota
          tidak akan disebarluaskan kepada pihak ketiga tanpa persetujuan
          tertulis dari yang bersangkutan, kecuali jika diwajibkan oleh hukum
          atau untuk kepentingan investigasi pelanggaran internal. Data yang
          dikumpulkan akan digunakan semata-mata untuk keperluan administrasi
          komunitas, komunikasi, dan penyelenggaraan kegiatan. Anggota berhak
          meminta penghapusan data pribadinya dari sistem komunitas apabila
          telah mengundurkan diri, dengan memperhatikan ketentuan retensi data
          yang mungkin diperlukan untuk keperluan arsip atau hukum.
        </p>

        <h2>8. Perubahan dan Revisi</h2>
        <p>
          Syarat &amp; Ketentuan ini dapat direvisi dan diperbarui sewaktu-waktu
          oleh Pengurus Blunder Skuad untuk menyesuaikan dengan perkembangan
          kebutuhan komunitas, perubahan regulasi, atau masukan dari anggota.
          Setiap perubahan material akan diumumkan melalui saluran komunikasi
          resmi komunitas dengan jangka waktu pemberitahuan yang memadai
          sebelum berlaku efektif. Dengan tetap aktif sebagai Anggota setelah
          perubahan diumumkan, Anggota dianggap telah menerima dan menyetujui
          versi terbaru dari Syarat &amp; Ketentuan ini. Apabila terdapat
          ketentuan yang dianggap tidak lagi relevan atau bertentangan dengan
          hukum yang berlaku, ketentuan tersebut akan dianggap tidak berlaku
          tanpa mempengaruhi validitas ketentuan lainnya.
        </p>

        <h2>9. Penyelesaian Sengketa</h2>
        <p>
          Segala bentuk sengketa atau perselisihan yang timbul di antara
          anggota, atau antara anggota dan Pengurus, akan diselesaikan
          terlebih dahulu melalui musyawarah dan mufakat dalam semangat
          kekeluargaan. Apabila penyelesaian internal tidak tercapai, pihak-pihak
          yang berselisih dapat menyepakati mediator independen yang ditunjuk
          bersama. Dalam hal sengketa tidak dapat diselesaikan secara damai,
          maka penyelesaian akan mengacu pada hukum yang berlaku di wilayah
          domisili komunitas, dengan tetap mengutamakan prinsip keadilan dan
          kebenaran.
        </p>

        <h2>10. Kontak dan Saluran Komunikasi</h2>
        <p>
          Untuk pertanyaan, laporan pelanggaran, atau permohonan klarifikasi
          terkait Syarat &amp; Ketentuan ini, Anggota dapat menghubungi Pengurus
          Blunder Skuad melalui saluran resmi yang telah ditetapkan, seperti
          grup komunikasi utama, email resmi komunitas, atau media sosial yang
          dikelola langsung oleh tim Pengurus. Segala komunikasi yang
          disampaikan melalui saluran resmi akan ditanggapi dalam batas waktu
          yang wajar sesuai dengan prosedur operasional yang berlaku.
        </p>

        <p>
          <em>
            Dokumen ini disusun sebagai landasan hukum dan etika bagi seluruh
            kegiatan Blunder Skuad. Dengan bergabung, setiap individu
            menyatakan persetujuannya terhadap seluruh ketentuan di atas.
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
