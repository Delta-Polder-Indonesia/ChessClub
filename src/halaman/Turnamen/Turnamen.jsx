import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import TabelHasilTurnamen from "../../components/TabelHasilTurnamen.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { gambar } from "../../lib/asets.js";

/**
 * Halaman Turnamen — pintu masuk seluruh agenda kompetitif komunitas.
 * Lima tautan cepat mengarah ke layanan internal situs ini, sedangkan
 * artikel "Turnamen Komunitas" memuat kebijakan turnamen Blunder Skuad.
 */
export default function Turnamen() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("turnamen.judul")}
      description={t("turnamen.deskripsi")}
      next={{ to: "/turnamen/turnamen-bulanan", judul: t("turnamen.nextJudul") }}
    >
      <PageArtikel title="Turnamen Komunitas">
        <h3><img src={gambar("/images/Turnamen/daftar.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/pendaftaran-anggota">Pendaftaran Anggota</Link></h3>
        <h3><img src={gambar("/images/Turnamen/skor.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/turnamen-bulanan">Turnamen Bulanan</Link></h3>
        <h3><img src={gambar("/images/Turnamen/live.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/turnamen-terbuka">Turnamen Terbuka</Link></h3>
        <h3><img src={gambar("/images/Turnamen/chairs.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/liga-antar-komunitas">Liga Antar Komunitas</Link></h3>
        <h3><img src={gambar("/images/Turnamen/hasil.png")} alt="" style={{display:"inline",height:60,marginRight:6}}/><Link to="/turnamen/liga-musiman">Liga Musiman</Link></h3>

        <p>
          Turnamen bukan sekadar ajang mencari pemenang; dalam konteks komunitas
          catur yang hidup, turnamen adalah medium di mana hubungan antaranggota
          diuji, strategi berkembang, dan nilai-nilai kolektif diaktualisasikan
          dalam bentuk yang konkret. Di Blunder Skuad, penyelenggaraan turnamen
          tidak dimaksudkan untuk menciptakan hierarki elitisme, melainkan untuk
          membangun ritme komunal yang memberi struktur pada interaksi anggota
          dari waktu ke waktu. Tanpa turnamen, komunitas catur berisiko meluruh
          menjadi sekadar grup obrolan yang sesekali membahas bukaan terkini.
          Dengan turnamen, catur kembali ke fungsi utamanya sebagai bahasa
          interaktif yang menghubungkan individu-individu dengan latar belakang
          dan kemampuan berbeda dalam satu arena yang setara.
        </p>

        <p>
          Fleksibilitas menjadi ciri khas pertama dari ekosistem turnamen
          Blunder Skuad. Kami menyadari bahwa anggota komunitas ini tersebar
          dalam berbagai zona waktu, rutinitas pekerjaan, dan komitmen personal
          yang tidak dapat diabaikan. Oleh karena itu, jadwal turnamen dirancang
          sedemikian rupa untuk mengakomodasi keterbatasan waktu tanpa
          mengorbankan intensitas kompetitif. Sebagian besar turnamen diadakan
          dalam format daring, memungkinkan peserta untuk memainkan
          pertandingannya kapan saja selama periode turnamen berlangsung,
          asalkan koordinasi dengan lawan telah tercapai. Pendekatan ini sedikit
          berbeda dengan turnamen tatap muka yang menuntut kehadiran fisik pada
          waktu tertentu; di sini, yang diutamakan adalah kenyamanan peserta
          dalam menjalankan kewajiban utamanya — keluarga, pekerjaan, dan
          ibadah — sementara tetap memiliki ruang untuk berkompetisi. Namun
          demikian, fleksibilitas ini bukan berarti bebas tanpa aturan; setiap
          pertandingan tetap harus diselesaikan dalam batas waktu yang telah
          ditetapkan panitia, dan komunikasi antarpeserta mengenai jadwal menjadi
          tanggung jawab bersama yang tidak dapat dialihkan.
        </p>

        <p>
          Dalam hal format kompetisi, Blunder Skuad mengadopsi dua sistem utama
          yang masing-masing memiliki karakteristik dan tujuan berbeda. Sistem{" "}
          <em>Swiss</em> menjadi pilihan utama ketika jumlah peserta relatif
          besar, karena format ini memungkinkan penentuan juara tanpa
          mengharuskan setiap peserta bertemu dengan seluruh peserta lainnya.
          Pada setiap ronde, pairing ditentukan berdasarkan akumulasi skor
          sementara, sehingga pemain dengan performa serupa akan saling
          berhadapan. Di sisi lain, sistem <em>round robin</em> diterapkan
          ketika jumlah peserta lebih terbatas dan komunitas menginginkan
          kedalaman kompetisi di mana setiap individu merasakan secara langsung
          gaya bermain dari seluruh peserta lain. Pemilihan antara kedua format
          ini bukan keputusan sembarangan; ia didasarkan pada pertimbangan jumlah
          anggota yang aktif, durasi turnamen yang diinginkan, dan tingkat
          interaksi sosial yang ingin dicapai. Dalam kedua format tersebut,
          kontrol waktu pertandingan dapat disesuaikan dengan kesepakatan
          bersama, memberikan ruang bagi anggota yang menyukai permainan kilat
          maupun mereka yang lebih menikmati analisis mendalam dalam format
          klasik.
        </p>

        <p>
          Integritas permainan merupakan fondasi yang tidak dapat ditawar dalam
          setiap turnamen yang diselenggarakan oleh Blunder Skuad. Kami berpegang
          teguh pada prinsip bahwa catur daring hanya akan bermakna jika setiap
          peserta bermain dengan kemampuan aslinya, tanpa bantuan mesin analisis,
          database bukaan dalam format yang tidak diizinkan, maupun intervensi
          pihak ketiga. Pelanggaran terhadap prinsip ini bukan hanya merugikan
          lawan main secara langsung, tetapi juga merusak kepercayaan kolektif
          yang menjadi perekat komunitas. Oleh karena itu, setiap anggota yang
          ingin berpartisipasi dalam turnamen wajib menjalani proses verifikasi
          identitas sederhana pada saat pendaftaran. Proses ini bertujuan untuk
          memastikan bahwa setiap akun yang bertanding dapat dipertanggungjawabkan
          kepada individu yang sebenarnya, mencegah duplikasi akun, dan membangun
          sistem pertanggungjawaban yang transparan. Ke depannya, verifikasi ini
          dapat dikembangkan lebih lanjut, misalnya melalui konfirmasi visual
          dalam pertemuan virtual, untuk memperkuat jaminan kejujuran dalam
          kompetisi.
        </p>

        <p>
          Protokol bermain di Blunder Skuad dirancang untuk menjaga ketertiban
          administratif sekaligus menghormati otonomi peserta. Setelah pengundian
          pairing dilakukan oleh panitia, kedua pemain yang berpasangan
          bertanggung jawab untuk berkomunikasi dan menentukan waktu bermain yang
          disepakati bersama selama periode turnamen berlangsung. Komunikasi ini
          dilakukan melalui saluran resmi komunitas yang telah ditetapkan. Dalam
          setiap pertandingan, pemain yang ditunjuk memegang bidak putih wajib
          untuk membuat ruang permainan dan melakukan langkah pertama.
          Pertandingan dianggap resmi ketika pemain bidak hitam telah merespons
          dengan langkah pertamanya; sebelum titik ini, pembatalan masih
          dimungkinkan apabila terdapat kesalahan teknis atau ketidakhadiran
          salah satu pihak. Setelah permainan selesai, hasil wajib direkap, baik
          oleh peserta itu sendiri maupun oleh panitia dalam periode rekapitulasi
          berkala. Sistem ini mengandalkan kesadaran dan kejujuran setiap
          individu, karena tidak ada wasit fisik yang mengawasi setiap papan
          secara langsung.
        </p>

        <p>
          Selain format turnamen konvensional, Blunder Skuad juga memfasilitasi
          format kompetisi yang lebih intim dan cepat, yang dalam terminologi
          komunitas ini dikenal sebagai pertandingan empat pemain atau{" "}
          <em>quad</em>. Format ini melibatkan empat peserta yang saling
          bertanding dalam skema <em>round robin</em> mini, di mana setiap pemain
          menghadapi tiga lawan dalam satu sesi. Warna bidak diatur dan diacak
          oleh panitia, dan seluruh pertandingan diselesaikan dalam waktu serta
          jadwal yang telah ditentukan. Kelebihan format ini terletak pada
          efisiensinya; tidak ada waktu tunggu yang berkepanjangan, dan para
          peserta dapat langsung merasakan hasil kompetisi dalam satu sesi tanpa
          harus menunggu berhari-hari. Hadiah untuk format ini, jika ada, akan
          diumumkan oleh pengurus sebelum turnamen dimulai, sehingga transparansi
          mengenai insentif tetap terjaga.
        </p>

        <p>
          Sistem penghitungan skor di Blunder Skuad mengikuti konvensi universal
          dalam catur: kemenangan memberikan satu poin, hasil imbang setengah
          poin, dan kekalahan nol poin. Jika sebuah pertandingan tidak dimainkan
          sama sekali karena ketidakhadiran atau kegagalan koordinasi, kedua
          pemain akan menerima skor nol. Ke depan, komunitas ini terbuka untuk
          mengembangkan variasi penghitungan yang lebih kaya, misalnya dengan
          mempertimbangkan performa berdasarkan kelompok usia, afiliasi klub,
          atau format tim tertentu. Namun, prinsip dasarnya tetap sama: skor
          adalah refleksi dari aktivitas dan konsistensi, bukan sekadar angka
          untuk diperebutkan. Terkait dengan hal ini, Blunder Skuad juga
          mengimplementasikan sistem rating internal yang menggunakan metodologi
          Elo dengan nilai awal seribu. Sistem ini berfungsi sebagai alat{" "}
          <em>pairing</em> untuk menciptakan pertandingan yang seimbang,
          sekaligus sebagai indikator perkembangan kemampuan anggota dari waktu
          ke waktu. Bagi anggota yang memiliki rating resmi dari federasi catur
          nasional atau internasional, konversi dapat dilakukan untuk menentukan
          posisi awal yang lebih merepresentasikan kemampuan aktual mereka.
        </p>

        <p>
          Hadiah dalam turnamen Blunder Skuad bukanlah tujuan utama, melainkan
          simbol apresiasi terhadap dedikasi dan performa. Di akhir setiap
          turnamen, pemain-pemain dengan akumulasi skor tertinggi akan menerima
          hadiah yang telah diumumkan sebelumnya. Dalam situasi di mana terdapat
          pembagian skor identik, hadiah akan dibagi rata di antara pemenang yang
          bersangkutan. Mekanisme distribusi hadiah dirancang untuk efisiensi
          administrasi; untuk nominal yang relatif kecil, komunitas menggunakan
          sistem pencatatan internal yang memungkinkan anggota mengakumulasikan
          kemenangannya hingga mencapai ambang batas pencairan tertentu.
          Pendekatan ini mengurangi beban transaksi berulang yang tidak efisien,
          sambil tetap memastikan bahwa setiap anggota menerima haknya secara
          transparan.
        </p>

        <p>
          Meskipun tidak ada wasit resmi yang duduk di setiap pertandingan
          daring, Blunder Skuad mempercayakan beberapa anggota yang lebih
          berpengalaman untuk berperan sebagai penengah apabila timbul
          perselisihan. Peran ini bukanlah posisi otoriter, melainkan fasilitator
          yang membantu menyelesaikan konflik dengan cara kekeluargaan dan
          berdasarkan fakta. Jika terdapat sengketa mengenai hasil pertandingan,
          jadwal, atau dugaan pelanggaran, maka penengah akan meninjau bukti yang
          ada dan mengajukan rekomendasi kepada pengurus. Proses ini sengaja
          dirancang untuk tidak kaku dan birokratis, namun tetap memiliki bobot
          yang cukup untuk menegakkan keadilan bagi semua pihak.
        </p>

        <p>
          Di tengah perkembangan komunitas, Blunder Skuad juga membuka peluang
          kolaborasi dengan pihak eksternal yang ingin mendukung ekosistem catur
          ini. Baik itu individu, komunitas lain, lembaga, maupun perusahaan yang
          berminat untuk mensponsori atau memfasilitasi turnamen, kami sambut
          dengan terbuka. Sponsor yang diterima harus selaras dengan nilai-nilai
          komunitas, dan penyelenggaraan turnamen bersama akan tetap berada di
          bawah supervisi kebijakan internal Blunder Skuad untuk menjaga
          integritas acara. Komunitas ini percaya bahwa kemitraan yang sehat dapat
          memperluas jangkauan dan kualitas turnamen, tanpa mengorbankan esensi
          komunal yang menjadi identitas kami.
        </p>

        <p>
          Secara keseluruhan, turnamen di Blunder Skuad adalah ekspresi dari
          komitmen komunitas untuk menjadikan catur sebagai pengalaman yang
          inklusif, terstruktur, dan bermakna. Setiap aspek — mulai dari
          fleksibilitas jadwal, variasi format, protokol verifikasi, hingga
          mekanisme penyelesaian sengketa — dirancang untuk mendukung tujuan
          tersebut. Bagi anggota, berpartisipasi dalam turnamen bukan hanya
          tentang mencari kemenangan, tetapi tentang menjadi bagian dari ritme
          kolektif yang terus berkembang dan saling memperkaya.
        </p>

        <h2 id="history">Hasil Turnamen</h2>
        <p>Rekap hasil turnamen komunitas dipublikasikan pada tabel berikut setiap kali sebuah rangkaian selesai. Nama juara diisikan oleh pengurus melalui dashboard internal.</p>
        <TabelHasilTurnamen />

        <p>Keterangan: Turnamen Bulanan adalah liga yang dimainkan rutin oleh anggota. Kursi Empat adalah turnamen mini yang diikuti oleh empat pemain. Turnamen Terbuka adalah turnaman langsung dengan ronde terjadwal. Untuk detail selengkapnya bisa dilihat di halaman <Link to="/keberlanjutan/pertanyaan-umum">tanya jawab</Link>.</p>
      </PageArtikel>
    </HalamanIsi>
  );
}
