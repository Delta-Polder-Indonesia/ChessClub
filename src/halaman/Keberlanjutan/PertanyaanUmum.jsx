import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

/* ---------------------------------------------------------- tautan
 * Template tautan grup WhatsApp. Belum ada kode grup aslinya, jadi
 * ditandai "GANTI_KODE_GRUP". Cukup ganti satu baris di bawah ini
 * dengan tautan undangan grup Anda, mis.
 *   "https://chat.whatsapp.com/AbCd1234EfGh"
 */
const LINK_GRUP_WA = "https://chat.whatsapp.com/GANTI_KODE_GRUP";

/**
 * Daftar pertanyaan & jawaban.
 *
 * Konten diadaptasi dari dokumen anggota. Tautan eksternal memakai rel
 * noreferrer/noopener agar aman.
 */
const DAFTAR_TANYA = [
  {
    t: "Apa itu Komunitas Catur Indonesia?",
    j: (
      <p>
        Komunitas Catur Indonesia adalah tempat bermain catur bagi masyarakat
        Indonesia baik yang sudah master maupun yang bermain secara kasual dan
        amatiran. Kami merangkul semua pemain dari semua tingkat kemampuan.
        Prinsip kami, setiap pemain pasti ada kelompoknya di mana mereka bisa
        bermain secara seimbang dan menjadikan permainan catur sebagai hiburan
        semata.
      </p>
    ),
  },
  {
    t: "Bagaimana cara bermain di Komunitas Catur Indonesia?",
    j: (
      <p>
        Kami menggunakan 3 komponen situs.{" "}
        <a
          href="https://www.chess.com"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          Chess.com
        </a>{" "}
        tempat bermain,{" "}
        <Link to="/turnamen" className="text-primary">
          LigaCatur.com
        </Link>{" "}
        tempat pengaturan tim, nilai dan skor, serta{" "}
        <a
          href={LINK_GRUP_WA}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          WhatsApp
        </a>{" "}
        group tempat berkomunikasi dan bersosialisasi.
      </p>
    ),
  },
  {
    t: "Apa itu situs Chess.com?",
    j: (
      <p>
        Chess.com adalah tempat bermain catur secara online. Anda bisa membuat
        akun secara gratis, bermain lewat komputer maupun handphone Anda kapan
        pun Anda main. Syarat memiliki akun di Chess.com cukup email address dan{" "}
        <strong className="text-red-600">tidak melakukan kecurangan</strong>.
      </p>
    ),
  },
  {
    t: "Apa itu kecurangan dalam bermain catur (terutama online)?",
    j: (
      <p>
        Secara kalimat sederhana, bermainlah apa adanya. Anda, pikiran Anda dan
        tanpa bantuan orang lain (joki) maupun bantuan mesin catur (engine/jin).
        Syarat main tidak curang ini perlu digarisbawahi secara tegas karena
        bermain online bisa dilakukan dari mana saja. Tanpa kejujuran dan
        sportivitas, permainan online catur akan rusak dengan sendirinya. Mari
        kita jaga kejujuran dan sportivitas bermain.
      </p>
    ),
  },
  {
    t: "Bagaimana kecurangan bisa ketahuan?",
    j: (
      <p>
        Kecurangan dalam bermain catur online tidak bisa dibersihkan 100%,
        tetapi Chess.com dengan algoritmanya setiap saat akan melakukan
        pemeriksaan terhadap akun dan semua permainan yang dimainkan. Itu
        adalah tugas Chess.com sebagai tempat bermain. Jika akun seorang pemain
        ditutup karena melanggar kebijakan fair play atau biasa disebut
        &quot;plat merah&quot; (
        <a
          href="https://www.chess.com/member/adit_tiwari_3103"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          contoh lihat di sini
        </a>
        ) maka pemain tersebut sudah dinyatakan melakukan kecurangan oleh pihak
        Chess.com. Kami Komunitas Catur Indonesia melarang pemain yang kena plat
        merah untuk bermain (bermain kembali) dalam Komunitas Catur Indonesia
        selama-lamanya.
      </p>
    ),
  },
  {
    t: "Jika kena plat merah, kan tinggal ganti akun?",
    j: (
      <p>
        Dalam Komunitas Catur Indonesia, identitas pemain tercatat dalam
        database kami. Nama, email, nomor telepon, dan lokasi. Pemain yang sudah
        kena plat merah tidak akan bisa bermain kembali dalam Komunitas Catur
        Indonesia sebelum akunnya kembali normal. Ada kemungkinan akun kembali
        normal dengan menghubungi pihak Chess.com.
      </p>
    ),
  },
  {
    t: "Bagaimana cara bergabung di Komunitas Catur Indonesia?",
    j: (
      <p>
        Yang pertama Anda harus punya akun di Chess.com, yang kedua cukup
        kunjungi halaman{" "}
        <Link to="/beranda/peringkat" className="text-primary">
          DAFTAR
        </Link>
        , yang ketiga bergabunglah dalam{" "}
        <a
          href={LINK_GRUP_WA}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          WA Group kami
        </a>
        .
      </p>
    ),
  },
  {
    t: "Jenis turnamen di Komunitas Catur Indonesia apa saja?",
    j: (
      <p>
        Saat ini kami memiliki banyak sekali jenis turnamen. Liga Utama, Kursi
        Empat, Turnamen Langsung, Master Chess, Rolasan, Zidjian, Marroha, Arena
        Puputan, Baratayuda, Dwi Tarung, Silaturahmi Zoom, Liga Chessmen,
        Bendino. Ibarat Komunitas Catur Indonesia adalah restoran, kami memiliki
        banyak menu masakan dan setiap masakan akan memiliki rasa tersendiri.
        Silakan memilih yang Anda suka.
      </p>
    ),
  },
  {
    t: "Banyak sekali turnamen, apa waktu kita tidak habis hanya untuk bermain catur?",
    j: (
      <p>
        Saran untuk semua: keluarga, pekerjaan, kewajiban agama dan mengendarai
        kendaraan lebih utama dibandingkan bermain catur/online. Luangkanlah
        waktu dengan bijaksana. Jika jadwal turnamen berbenturan dengan jadwal
        rutinitas Anda, kami biasanya memberikan alternatifnya, dan bukan
        menggesernya karena catur online di Indonesia memiliki 3 zona waktu.
      </p>
    ),
  },
  {
    t: "Apa itu turnamen Liga Utama?",
    j: (
      <p>
        Liga Utama adalah turnamen mingguan yang dimainkan oleh anggota kami.
        Pairing yang dilakukan adalah round robin. Rentang waktu pertandingan
        biasanya 1–2 minggu; pemain boleh memainkan papannya kapan saja selama
        waktu luang mereka. Hasil akan dicatat oleh sistem dan pemain dengan
        skor terbanyak adalah pemenangnya.
      </p>
    ),
  },
  {
    t: "Apa itu turnamen Kursi Empat?",
    j: (
      <p>
        Kursi Empat adalah turnamen kecil yang diikuti hanya empat pemain.
        Prosesnya anggota di{" "}
        <a
          href={LINK_GRUP_WA}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          WA Group
        </a>{" "}
        posting ingin main Kursi Empat, dan jika dibalas pemain lain dan
        terkumpul empat pemain, mereka bisa langsung melakukan turnamen Kursi
        Empat. Pairing dibuat, ronde dan papan dimainkan, selesai.
      </p>
    ),
  },
  {
    t: "Apa itu Turnamen Langsung?",
    j: (
      <p>
        Turnamen Langsung adalah turnamen yang jadwal rondenya sudah pasti.
        Proses turnamen ini adalah pemain mendaftar, pemain siap pada jadwal
        ronde yang sudah ditentukan, memainkan papan, selesai. Menang atau
        kalah, pemain akan bermain ronde berikutnya sampai semua ronde
        dimainkan.
      </p>
    ),
  },
  {
    t: "Komunitas Catur Indonesia punya rating sendiri?",
    j: (
      <p>
        Benar. Kami mengembangkan sistem untuk mengkalkulasi rating peringkat
        pemain dalam Komunitas Catur Indonesia. Jika Anda bergabung dalam
        Komunitas Catur Indonesia dan sudah memiliki rating OTB
        (over-the-board / offline), silakan memberitahu kami untuk mengubah
        rating awal di sistem kami. Untuk pemain yang memiliki rating di US
        Chess, konversi langsung tanpa penghitungan. Untuk pemain yang memiliki
        rating di FIDE, kami menggunakan{" "}
        <a
          href="http://www.glicko.net/ratings/rating.system.pdf"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary"
        >
          kalkulasi ini
        </a>
        . Untuk konversi dari rating Chess.com, kami belum melakukannya.
        Kedepannya akan kami konversi dengan syarat-syarat tertentu yang harus
        dipenuhi, misalnya umur akun, nama akun, total permainan yang sudah
        dimainkan, dan sebagainya.
      </p>
    ),
  },
  {
    t: "Apa itu verifikasi?",
    j: (
      <p>
        Komunitas Catur Indonesia menerapkan sistem verifikasi. Setelah
        mendaftar Anda bisa chat dengan admin, dan akun Anda akan kami tandai
        dengan centang biru. Kami mempunyai kebijakan 1 identitas, 1 akun, 1
        verifikasi, 1 klub, 1 provinsi. Setiap pemain hanya bisa mempunyai 1
        identitas yang kita verifikasi menggunakan nomor telepon (WhatsApp), 1
        akun Chess.com, dan hanya 1 akun Chess.com yang kami verifikasi untuk
        bisa bermain dalam Komunitas Catur Indonesia. Setiap akun hanya berhak
        masuk ke dalam 1 klub terdaftar. Setiap pemain hanya bermain dalam 1 tim
        provinsi sesuai dengan KTP/SIM atau surat Gubernur.
      </p>
    ),
  },
  {
    t: "Hadiah lewat balance, apa itu?",
    j: (
      <p>
        Hadiah sebagian besar kami menggunakan istilah balance. Kita tidak bisa
        setiap kali hadiah yang kadang nominalnya relatif kecil, kemudian kita
        harus transfer. Bayangkan kalau hadiah &quot;permen&quot; Rp3.000 lalu
        kita harus transfer, bagaimana caranya? Untuk itu, kita menggunakan
        sistem balance, atau neraca hadiah. Setiap hadiah yang masuk kita catat
        dengan rapi dan anggota bisa mencairkan kalau nominalnya sudah $5 atau
        lebih, dan ini menghemat waktu kita semua. Jika memang harus mencairkan
        di bawah $5 maka akan dikenai biaya administrasi.
      </p>
    ),
  },
  {
    t: "Apa itu Klub? Apa itu Tim?",
    j: (
      <p>
        Komunitas Catur Indonesia membedakan istilah Klub dan Tim. Komunitas
        Catur Indonesia bukan Klub. Kami justru mewadahi klub-klub catur di
        Indonesia dalam sistem kami. Kami memiliki banyak klub catur yang sudah
        terdaftar dalam naungan Komunitas Catur Indonesia. Jika ingin
        mendaftarkan klub Anda, hubungi admin. Apa beda Klub dan Tim? Seperti di
        dalam dunia sepakbola: Klub adalah organisasi yang lebih bersifat tetap,
        sedangkan Tim adalah tim dalam sebuah pertandingan atau turnamen. Bisa
        jadi sebuah tim bermain dengan anggota yang berbeda klub, jika
        regulasinya memperbolehkan.
      </p>
    ),
  },
  {
    t: "Apa itu Rolasan?",
    j: (
      <p>
        Rolasan adalah salah satu seri turnamen di Komunitas Catur Indonesia.
        &quot;Rolas&quot; yang artinya dalam bahasa Jawa 12 menunjuk ke jam yang
        biasanya dipakai untuk turnamen. Pairing 1-2 kita gunakan dalam turnamen
        ini. Apa itu? Pemain hanya dipasangkan melawan pemain-pemain yang
        ratingnya dekat saja. Semacam virtual group/section sebenarnya.
      </p>
    ),
  },
  {
    t: "Apa itu Zidjian?",
    j: (
      <p>
        Zidjian adalah salah satu seri turnamen di Komunitas Catur Indonesia.
        Sedikit membedakan dengan Rolas, Zidjian diambil dari kata siji/hiji/satu
        dan untuk Jumat/Sabtu turnamen ini ada di jam 1. Pairing swiss normal
        dan tidak mempertemukan pemain dalam satu tim/klub.
      </p>
    ),
  },
  {
    t: "Apa itu Baratayuda?",
    j: (
      <p>
        Baratayuda adalah salah satu seri turnamen di Komunitas Catur Indonesia.
        Battle of 2 teams! Hanya tim pemenang yang mendapat hadiah. Turnamen ini
        memasang 2 nama di awal pertandingan. Misalnya Baratayuda Bakmi vs
        Nasgor, Baratayuda Mawar vs Melati, Baratayuda Batman vs Superman,
        Baratayuda Ronaldo vs Messi, dan sebagainya. Pemain sebelum masuk harus
        memilih 1 tim. Anggota dilarang melakukan kampanye di ruang publik
        (dilarang menyatakan pilihannya di ruang publik/GWA), tetapi boleh
        japri ke teman-teman dekat. Setelah pemain masuk, maka dia akan bermain
        dalam tim tersebut, dan sesama anggota tim tidak akan saling melawan.
      </p>
    ),
  },
  {
    t: "Apa itu Marroha?",
    j: (
      <p>
        Marroha adalah salah satu seri turnamen di Komunitas Catur Indonesia.
        Marroha dalam bahasa Batak berarti berpikir. Ada 2 jadwal Marroha, kita
        sebut Marroha Klasik dan Marroha Malam. Kata &quot;klasik&quot; dalam
        istilah catur digunakan untuk pertandingan yang menyediakan kontrol waktu
        relatif lama. Kata &quot;malam&quot; artinya jelas, bahwa jadwalnya
        larut malam. Tujuan ajang ini ditujukan untuk pemain yang ingin main
        menikmati catur, dan pemain yang ingin berpikir dalam. Santai tapi
        serius.
      </p>
    ),
  },
  {
    t: "Apa itu Arena Puputan?",
    j: (
      <p>
        Arena Puputan adalah salah satu seri turnamen di Komunitas Catur
        Indonesia. Kata puputan sendiri diambil dari Bali, yang artinya adalah
        pertempuran sampai darah penghabisan. Salah satu puputan dalam sejarah
        Bali adalah pertempuran Margarana yang dikomandoi oleh I Gusti Ngurah
        Rai. Arena adalah salah satu jenis turnamen di Chess.com yang sifatnya
        masal, boleh berserk (menggunakan separuh waktu), boleh streak (menang
        terus dapat nilai lebih), dan ada jenis Arena yang sifatnya Team Battle.
      </p>
    ),
  },
  {
    t: "Apa itu Silaturahmi Zoom?",
    j: (
      <p>
        Silaturahmi Zoom adalah salah satu seri turnamen di Komunitas Catur
        Indonesia dengan menggunakan Zoom (ruang virtual dan kamera) dengan
        tujuan agar anggota bisa lebih akrab dengan fasilitas visual yang
        disediakan.
      </p>
    ),
  },
  {
    t: "Apa itu Liga Antar Provinsi?",
    j: (
      <p>
        Liga adalah rangkaian turnamen beruntun dengan mengakumulasikan nilai
        pemain/tim setiap turnamen, dan mengambil juara dalam rangkaian
        tersebut. Liga Antar Provinsi adalah liga di mana pemain akan mewakili
        provinsinya untuk bermain, dan di akhir liga kita mengadakan final untuk
        mencari provinsi juara.
      </p>
    ),
  },
  {
    t: "Apa itu Liga Antar Klub?",
    j: (
      <p>
        Liga Antar Klub adalah liga di mana pemain akan mewakili klubnya untuk
        bermain, dan di akhir liga kita mengadakan final untuk mencari juara
        klub.
      </p>
    ),
  },
  {
    t: "Apa itu Liga Antar Perusahaan?",
    j: (
      <p>
        Liga Antar Perusahaan adalah liga di mana pemain akan mewakili
        perusahaannya untuk bermain, dan di akhir liga kita mengadakan final
        untuk mencari juara perusahaan. Liga ini masih dalam taraf rancangan.
      </p>
    ),
  },
  {
    t: "Apa itu Liga Antar Mahasiswa dan Pelajar?",
    j: (
      <p>
        Liga Antar Mahasiswa dan Pelajar adalah liga di mana pemain akan mewakili
        sekolahnya untuk bermain, dan di akhir liga kita mengadakan final untuk
        mencari juaranya. Liga ini masih dalam taraf rancangan.
      </p>
    ),
  },
  {
    t: "Apakah Komunitas Catur Indonesia memiliki turnamen darat?",
    j: (
      <p>
        Komunitas Catur Indonesia berencana ingin aktif juga di darat. Kami
        tidak bisa sendiri dan membutuhkan mitra lokal di darat. Sistem kami
        sangat bisa mendukung turnamen darat. Dengan data yang terintegrasi,
        rating yang aktual, sistem pendaftaran yang mudah, sistem pairing yang
        cocok, serta sistem liga/tim/klub yang tertata, Komunitas Catur Indonesia
        siap menjadi mitra turnamen-turnamen darat.
      </p>
    ),
  },
  {
    t: "Apakah boleh mendaftar Komunitas Catur Indonesia dengan dua akun?",
    j: (
      <p>
        KCI hanya mengakui satu akun, satu identitas. Jagalah baik-baik akun
        tersebut. KCI tidak mendukung duplikasi akun dan duplikasi identitas.
        Jika pemain terkena plat merah dan naik banding di Chess.com ditolak,
        mohon maaf pemain tersebut sudah tidak bisa bermain dalam turnamen online
        Komunitas Catur Indonesia. Jika KCI menyelenggarakan turnamen darat,
        pemain tersebut boleh bermain.
      </p>
    ),
  },
];

export default function PertanyaanUmum() {
  const { t } = useI18n();
  return (
    <HalamanIsi
      title={t("pertanyaan.judul")}
      parent={t("nav.keberlanjutan")}
      parentPath="/keberlanjutan"
      description={t("pertanyaan.deskripsi")}
      next={{ to: "/hubungi-kami", judul: t("pertanyaan.nextJudul") }}
    >
      <PageArtikel title={t("pertanyaan.artikel")}>
        <ol className="space-y-6">
          {DAFTAR_TANYA.map((item, index) => (
            <li key={index} className="ql-align-justify">
              <p className="font-semibold mb-1">
                {index + 1}. {item.t}
              </p>
              <div className="prose-kci max-w-none">{item.j}</div>
            </li>
          ))}
        </ol>
      </PageArtikel>
    </HalamanIsi>
  );
}
