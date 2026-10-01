import { HalamanIsi, PageArtikel } from"../../components/PageBagian.jsx";
import { useI18n } from"../../lib/i18n.jsx";

/**
 * Daftar pertanyaan & jawaban Blunder Skuad.
 */
const DAFTAR_TANYA = [
  {
    t:"Apa itu Blunder Skuad?",
    j: (
      <p className="m-0">
        Blunder Skuad adalah komunitas catur yang dibentuk sebagai wadah bagi
        para penggemar catur dari berbagai tingkat kemampuan — mulai dari pemain
        kasual yang baru mengenal permainan ini hingga mereka yang telah memiliki
        pengalaman kompetitif. Prinsip dasar kami sederhana: setiap pemain, apa
        pun tingkat kemampuannya, memiliki tempat di mana ia dapat menemukan
        lawan main yang seimbang, belajar secara berkelanjutan, dan menjadikan
        catur sebagai sumber hiburan sekaligus pengembangan diri. Kami bukan
        entitas komersial, melainkan komunitas yang dikelola secara kolektif oleh
        anggotanya, dengan pengurus yang bertugas memastikan ekosistem ini tetap
        kondusif bagi semua pihak.
      </p>
    ),
  },
  {
    t:"Bagaimana cara bergabung dengan Blunder Skuad?",
    j: (
      <p className="m-0">
        Proses keanggotaan terdiri dari beberapa langkah yang dirancang untuk
        memastikan kesesuaian antara ekspektasi calon anggota dan nilai-nilai
        komunitas. Pertama, calon anggota diharapkan untuk mengisi formulir
        pendaftaran yang tersedia di saluran resmi kami. Kedua, setelah
        pendaftaran diterima, calon anggota akan melalui proses orientasi singkat
        yang menjelaskan aturan main, kode etik, dan mekanisme kegiatan
        komunitas. Ketiga, setelah orientasi selesai, anggota baru akan diberikan
        akses ke grup komunikasi resmi komunitas, yang menjadi pusat koordinasi
        untuk seluruh kegiatan, diskusi, dan pengumuman turnamen.
      </p>
    ),
  },
  {
    t:"Di platform mana Blunder Skuad bermain?",
    j: (
      <p className="m-0">
        Blunder Skuad tidak mengunci anggotanya pada satu platform tunggal.
        Kami menggunakan berbagai platform catur daring yang umum tersedia,
        seperti Chess.com, Lichess, atau platform lainnya, tergantung pada
        kesepakatan bersama untuk setiap kegiatan tertentu. Fleksibilitas ini
        dimaksudkan untuk mengakomodasi preferensi individu anggota, selama
        platform yang dipilih memiliki mekanisme permainan adil yang memadai.
        Untuk setiap turnamen atau liga, pengurus akan mengumumkan platform resmi
        yang digunakan, dan anggota diharapkan untuk mematuhi keputusan tersebut.
      </p>
    ),
  },
  {
    t:"Apa itu kecurangan dalam bermain catur daring, dan bagaimana Blunder Skuad menyikapinya?",
    j: (
      <p className="m-0">
        Secara esensial, kecurangan adalah setiap bentuk bantuan eksternal yang
        diterima pemain selama pertandingan berlangsung, baik itu berupa mesin
        analisis catur (<em className="italic font-semibold">engine</em>), konsultasi dengan pihak ketiga (
        <em className="italic font-semibold">joki</em>), maupun akses ke database bukaan dalam format yang tidak
        diizinkan oleh aturan turnamen. Blunder Skuad menggarisbawahi bahwa
        integritas permainan adalah fondasi yang tidak dapat ditawar. Tanpa
        kejujuran dan sportivitas dari setiap individu, ekosistem kompetitif
        daring akan runtuh dengan sendirinya. Kami menerapkan kebijakan{""}
        <em className="italic font-semibold">zero tolerance</em> terhadap kecurangan dalam segala bentuknya.
      </p>
    ),
  },
  {
    t:"Bagaimana kecurangan bisa terdeteksi?",
    j: (
      <p className="m-0">
        Meskipun tidak ada sistem yang sempurna, platform-platform yang kami
        gunakan telah dilengkapi dengan algoritme deteksi otomatis yang
        menganalisis pola permainan, konsistensi waktu pemikiran, dan tingkat
        akurasi langkah untuk mengidentifikasi aktivitas yang mencurigakan.
        Selain deteksi otomatis, Blunder Skuad juga memiliki mekanisme pengawasan
        internal, termasuk peninjauan manual terhadap permainan-pertandingan yang
        dianggap tidak wajar. Apabila seorang anggota terbukti melakukan
        kecurangan, baik melalui deteksi platform maupun bukti yang diajukan oleh
        anggota lain, maka sanksi akan diberikan sesuai dengan tingkat keparahan
        pelanggaran, yang dapat berupa peringatan, suspensi sementara, atau
        pencabutan keanggotaan permanen.
      </p>
    ),
  },
  {
    t:"Apakah saya bisa bergabung kembali jika pernah terkena sanksi karena kecurangan?",
    j: (
      <p className="m-0">
        Kebijakan Blunder Skuad mengenai pelanggaran permainan adil bersifat
        tegas. Anggota yang telah terbukti melakukan kecurangan dan dikenai
        sanksi pencabutan keanggotaan tidak akan dapat bergabung kembali dalam
        komunitas ini, kecuali jika terdapat bukti baru yang secara substantif
        membatalkan dugaan pelanggaran sebelumnya. Keputusan ini diambil untuk
        menjaga kepercayaan kolektif di antara anggota, karena komunitas yang
        sehat hanya dapat berdiri di atas fondasi kejujuran yang tidak boleh
        dikompromikan.
      </p>
    ),
  },
  {
    t:"Apakah saya boleh memiliki lebih dari satu akun dalam komunitas?",
    j: (
      <p className="m-0">
        Blunder Skuad menerapkan prinsip <em className="italic font-semibold">satu identitas, satu akun</em>.
        Setiap anggota hanya diperbolehkan untuk mendaftarkan satu akun resmi
        yang terhubung dengan identitasnya dalam sistem komunitas. Akun kedua
        hanya dapat dipertimbangkan untuk tujuan pelatihan khusus dan wajib
        mendapatkan persetujuan tertulis dari pengurus sebelumnya. Duplikasi akun
        tanpa izin, terutama yang dimaksudkan untuk menghindari sanksi atau
        memanipulasi hasil pertandingan, merupakan pelanggaran serius yang akan
        dikenai sanksi administratif.
      </p>
    ),
  },
  {
    t:"Jenis turnamen apa saja yang diselenggarakan oleh Blunder Skuad?",
    j: (
      <p className="m-0">
        Blunder Skuad menyelenggarakan beragam format turnamen untuk
        mengakomodasi preferensi dan jadwal yang berbeda-beda di kalangan
        anggota. Format yang tersedia meliputi, namun tidak terbatas pada:
        turnamen <em className="italic font-semibold">round robin</em> dengan jadwal fleksibel, turnamen{""}
        <em className="italic font-semibold">swiss system</em> dengan ronde tetap, turnamen <em className="italic font-semibold">arena</em> dengan
        sifat masal dan dinamis, serta pertandingan tim antar kelompok anggota.
        Selain itu, kami juga mengadakan sesi latihan bersama, analisis permainan
        kolektif, dan pertemuan virtual untuk mempererat ikatan sosial
        antaranggota. Setiap format dirancang untuk memberikan pengalaman
        berbeda, sehingga anggota dapat memilih kegiatan yang paling sesuai
        dengan gaya bermain dan ketersediaan waktunya.
      </p>
    ),
  },
  {
    t:"Dengan banyaknya jadwal turnamen, bagaimana saya mengatur waktu?",
    j: (
      <p className="m-0">
        Kami sangat menekankan bahwa catur, meskipun menyenangkan, tetaplah
        sebuah aktivitas rekreasi dan pengembangan diri yang harus diprioritaskan
        setelah kewajiban utama. Keluarga, pekerjaan, kewajiban agama, dan
        keselamatan dalam beraktivitas harus selalu didahulukan. Blunder Skuad
        merancang jadwal turnamen dengan mempertimbangkan keragaman zona waktu
        dan rutinitas anggota, serta menyediakan alternatif format bagi mereka
        yang tidak dapat mengikuti jadwal tetap. Kami menganjurkan setiap anggota
        untuk memilih kegiatan secara selektif dan mengelola waktu dengan
        bijaksana, alih-alih berpartisipasi dalam setiap turnamen yang tersedia.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen Round Robin di Blunder Skuad?",
    j: (
      <p className="m-0">
        Turnamen <em className="italic font-semibold">round robin</em> adalah format di mana setiap peserta
        bertanding melawan seluruh peserta lainnya dalam satu siklus. Di
        Blunder Skuad, turnamen ini biasanya dijadwalkan dengan rentang waktu
        satu hingga dua minggu, di mana pemain dapat mengatur jadwal
        pertandingannya masing-masing sesuai kesepakatan dengan lawan. Hasil
        pertandingan dicatat dalam sistem internal komunitas, dan pemenang
        ditentukan berdasarkan akumulasi skor tertinggi di akhir siklus. Format
        ini ideal bagi anggota yang menginginkan pengalaman kompetitif yang
        mendalam namun tetap fleksibel dalam hal waktu.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen format kecil atau mini tournament?",
    j: (
      <p className="m-0">
        Selain turnamen besar, Blunder Skuad juga memfasilitasi turnamen mini
        yang diikuti oleh jumlah peserta terbatas, misalnya empat hingga delapan
        pemain. Turnamen ini biasanya dimulai dari inisiatif anggota di grup
        komunikasi; ketika jumlah peserta yang berminat telah terkumpul, mereka
        dapat langsung mengatur pairing dan memainkan turnamen tersebut.
        Prosesnya cepat dan tidak memerlukan birokrasi panjang, sehingga cocok
        bagi anggota yang ingin bermain secara spontan tanpa menunggu jadwal
        turnamen resmi komunitas.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen dengan jadwal ronde tetap?",
    j: (
      <p className="m-0">
        Turnamen dengan jadwal ronde tetap adalah format di mana waktu
        pertandingan untuk setiap ronde telah ditentukan sebelumnya oleh panitia
        penyelenggara. Peserta yang mendaftar wajib hadir pada jadwal yang telah
        ditetapkan, memainkan papannya sesuai pairing, dan melanjutkan ke ronde
        berikutnya apa pun hasil pertandingan sebelumnya. Format ini menuntut
        komitmen waktu yang lebih tinggi dari peserta, namun menawarkan
        intensitas kompetitif dan ritme turnamen yang lebih terstruktur
        dibandingkan dengan format fleksibel.
      </p>
    ),
  },
  {
    t:"Apakah Blunder Skuad memiliki sistem rating internal?",
    j: (
      <p className="m-0">
        Ya. Blunder Skuad mengembangkan dan memelihara sistem rating internal
        yang mencerminkan performa anggota dalam kegiatan komunitas. Sistem ini
        berfungsi sebagai alat <em className="italic font-semibold">pairing</em> untuk memastikan pertandingan
        yang seimbang, serta sebagai indikator perkembangan kemampuan anggota
        dari waktu ke waktu. Bagi anggota yang memiliki rating resmi dari
        federasi catur nasional atau internasional, rating tersebut dapat
        dijadikan acuan untuk penentuan rating awal dalam sistem kami. Namun,
        rating internal Blunder Skuad bersifat independen dan hanya mencerminkan
        hasil pertandingan yang tercatat dalam ekosistem komunitas ini.
      </p>
    ),
  },
  {
    t:"Apa itu sistem verifikasi di Blunder Skuad?",
    j: (
      <p className="m-0">
        Untuk menjaga integritas komunitas, Blunder Skuad menerapkan sistem
        verifikasi sederhana. Setelah mendaftar, anggota baru akan melalui proses
        verifikasi identitas yang dilakukan oleh pengurus, yang mencakup
        konfirmasi nama, kontak, dan akun platform catur yang didaftarkan.
        Anggota yang telah terverifikasi akan mendapatkan tanda khusus dalam
        sistem komunitas. Kebijakan kami menegaskan bahwa setiap individu hanya
        dapat memiliki satu identitas terverifikasi dan satu akun resmi dalam
        komunitas. Verifikasi ini bertujuan untuk mencegah duplikasi akun,
        penipuan identitas, dan memastikan bahwa setiap anggota dapat
        dipertanggungjawabkan atas aktivitasnya.
      </p>
    ),
  },
  {
    t:"Bagaimana sistem hadiah di Blunder Skuad?",
    j: (
      <p className="m-0">
        Sistem hadiah di Blunder Skuad dirancang dengan mempertimbangkan
        efisiensi administrasi dan kenyamanan anggota. Untuk hadiah dengan
        nominal kecil, kami menggunakan sistem <em className="italic font-semibold">balance</em> atau pencatatan
        neraca internal, di mana setiap kemenangan atau hadiah yang diperoleh
        oleh anggota dicatat secara rapi dalam sistem komunitas. Anggota dapat
        mencairkan saldo balance-nya ketika telah mencapai ambang batas nominal
        tertentu yang telah ditetapkan. Pendekatan ini mengurangi frekuensi
        transaksi kecil yang tidak efisien, sambil tetap memastikan bahwa setiap
        anggota menerima haknya secara transparan.
      </p>
    ),
  },
  {
    t:"Apa perbedaan antara Klub dan Tim dalam konteks Blunder Skuad?",
    j: (
      <p className="m-0">
        Blunder Skuad membedakan istilah <em className="italic font-semibold">klub</em> dan <em className="italic font-semibold">tim</em> untuk
        kejelasan administrasi. Sebuah <em className="italic font-semibold">klub</em> adalah entitas yang bersifat
        permanen atau semi-permanen, memiliki anggota tetap, dan beroperasi
        sebagai satuan organisasi dalam komunitas. Sementara itu, <em className="italic font-semibold">tim</em>{""}
        adalah formasi sementara yang dibentuk untuk tujuan kompetisi atau
        turnamen tertentu. Dalam sebuah turnamen, bisa saja terbentuk tim yang
        anggotanya berasal dari klub yang berbeda, tergantung pada regulasi
        turnamen yang berlaku. Blunder Skuad sendiri berfungsi sebagai payung
        komunitas yang dapat menampung berbagai klub di bawah naungannya, atau
        beroperasi sebagai tim tunggal dalam kompetisi eksternal.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen dengan pairing berbasis rating?",
    j: (
      <p className="m-0">
        Beberapa turnamen di Blunder Skuad menerapkan sistem pairing di mana
        peserta hanya dipertemukan dengan lawan yang memiliki rating dalam
        rentang tertentu. Pendekatan ini menciptakan <em className="italic font-semibold">virtual group</em>{""}
        atau seksi kompetisi internal, di mana pemain pemula tidak langsung
        berhadapan dengan pemain berpengalaman dalam tahap awal. Tujuannya adalah
        untuk memberikan pengalaman kompetitif yang adil dan mencegah frustrasi
        pada peserta yang masih dalam proses pengembangan kemampuan.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen dengan format Swiss?",
    j: (
      <p className="m-0">
        Turnamen <em className="italic font-semibold">Swiss system</em> adalah format di mana peserta tidak
        bertemu semua peserta lainnya, melainkan hanya sejumlah ronde tertentu.
        Pada setiap ronde, pairing ditentukan berdasarkan akumulasi skor
        sementara, sehingga pemain dengan skor serupa akan saling bertemu.
        Format ini efisien untuk turnamen dengan jumlah peserta besar karena
        tidak memerlukan jumlah ronde sebanyak format <em className="italic font-semibold">round robin</em>. Di
        Blunder Skuad, turnamen <em className="italic font-semibold">Swiss</em> sering kali dilengkapi dengan
        aturan tambahan, seperti larangan mempertemukan anggota dari klub atau
        tim yang sama pada ronde-ronde awal.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen format pertarungan tim?",
    j: (
      <p className="m-0">
        Turnamen pertarungan tim adalah format di mana dua kelompok pemain
        saling berhadapan dalam serangkaian pertandingan individual. Sebelum
        turnamen dimulai, nama atau tema untuk kedua tim akan ditentukan, dan
        anggota komunitas dapat memilih untuk bergabung dengan salah satu tim.
        Setelah pembagian tim selesai, anggota dalam satu tim tidak akan saling
        bertemu dalam pairing; mereka akan bertanding melawan anggota tim lawan.
        Hadiah biasanya diberikan kepada tim pemenang secara kolektif. Untuk
        menjaga sportivitas, anggota dilarang melakukan kampanye pemilihan tim
        secara berlebihan di ruang publik komunitas.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen dengan kontrol waktu klasik?",
    j: (
      <p className="m-0">
        Blunder Skuad juga mengadakan turnamen dengan kontrol waktu yang lebih
        panjang, yang dalam terminologi catur dikenal sebagai format{""}
        <em className="italic font-semibold">klasik</em>. Turnamen ini dirancang bagi anggota yang ingin menikmati
        permainan catur dengan kedalaman analisis yang lebih besar, tanpa
        tekanan waktu yang mendesak seperti dalam format <em className="italic font-semibold">blitz</em> atau{""}
        <em className="italic font-semibold">bullet</em>. Kami menyediakan jadwal yang beragam untuk format ini,
        termasuk sesi yang diadakan pada waktu-waktu tertentu untuk mengakomodasi
        anggota yang memiliki preferensi waktu bermain yang berbeda. Suasana
        turnamen klasik di Blunder Skuad cenderung lebih santai namun tetap
        serius, sesuai dengan esensi catur sebagai permainan strategis yang
        mendalam.
      </p>
    ),
  },
  {
    t:"Apa itu turnamen format Arena?",
    j: (
      <p className="m-0">
        Turnamen <em className="italic font-semibold">arena</em> adalah format kompetisi massal di mana peserta
        dapat bergabung dan keluar kapan saja selama periode turnamen
        berlangsung. Setiap kemenangan memberikan poin, dan kemenangan beruntun
        memberikan bonus poin tambahan. Di beberapa platform, format ini juga
        memungkinkan fitur <em className="italic font-semibold">berserk</em>, di mana pemain dapat mengurangi
        waktunya sendiri untuk mendapatkan poin ekstra. Blunder Skuad mengadakan
        turnamen <em className="italic font-semibold">arena</em> secara berkala sebagai ajang yang meriah dan
        inklusif, di mana anggota dapat mengikuti sebanyak atau sesedikit
        pertandingan sesuai dengan waktu luang mereka.
      </p>
    ),
  },
  {
    t:"Apakah Blunder Skuad mengadakan pertemuan virtual atau daring?",
    j: (
      <p className="m-0">
        Ya. Selain aktivitas bermain, Blunder Skuad secara rutin mengadakan
        sesi pertemuan virtual melalui platform konferensi video. Sesi ini
        bertujuan untuk mempererat ikatan sosial antaranggota, karena kami
        meyakini bahwa komunitas yang kuat dibangun tidak hanya melalui
        interaksi kompetitif, tetapi juga melalui komunikasi langsung dan
        pengenalan antarindividu. Dalam sesi virtual ini, anggota dapat saling
        berbincang, mengenal wajah satu sama lain, serta berdiskusi tentang
        strategi catur atau topik umum lainnya dalam suasana yang lebih santai.
      </p>
    ),
  },
  {
    t:"Apa itu Liga di Blunder Skuad?",
    j: (
      <p className="m-0">
        Liga adalah rangkaian turnamen beruntun yang diadakan dalam periode
        tertentu, di mana nilai atau skor dari setiap turnamen diakumulasikan
        untuk menentukan peringkat akhir. Blunder Skuad menyelenggarakan
        berbagai jenis liga, termasuk liga individu, liga antarklub, dan liga
        tematik lainnya. Di akhir siklus liga, biasanya diadakan babak final atau
        penentuan juara untuk memberikan kesempatan bagi peserta teratas untuk
        bersaing dalam format yang lebih intens. Liga dirancang untuk memberikan
        kompetisi jangka panjang yang mengukur konsistensi performa, bukan hanya
        keberhasilan dalam satu turnamen tunggal.
      </p>
    ),
  },
  {
    t:"Apakah Blunder Skuad memiliki liga antar klub?",
    j: (
      <p className="m-0">
        Ya. Bagi komunitas atau klub catur yang telah terdaftar di bawah naungan
        Blunder Skuad, kami menyediakan format liga antarklub di mana pemain
        mewakili klubnya masing-masing untuk bersaing. Sistem ini memungkinkan
        klub-klub untuk mengukur kekuatan kolektifnya, membangun rivalitas
        sehat, dan menciptakan identitas kompetitif yang lebih dalam di antara
        anggotanya. Liga antarklub menjadi salah satu ajang paling dinanti dalam
        kalender kegiatan komunitas kami.
      </p>
    ),
  },
  {
    t:"Apakah Blunder Skuad merencanakan liga untuk kalangan khusus?",
    j: (
      <p className="m-0">
        Blunder Skuad secara aktif mengembangkan format-format liga yang
        ditujukan untuk segmen anggota tertentu, seperti liga antarperusahaan,
        liga antarinstitusi pendidikan, atau liga berbasis tema lainnya.
        Beberapa format ini masih dalam tahap perancangan dan akan diluncurkan
        ketika kondisi administratif serta jumlah partisipan telah memadai. Kami
        selalu terbuka terhadap masukan dan inisiatif dari anggota untuk
        mengembangkan format kompetisi baru yang relevan dengan minat kolektif.
      </p>
    ),
  },
  {
    t:"Apakah Blunder Skuad menyelenggarakan turnamen tatap muka atau darat?",
    j: (
      <p className="m-0">
        Meskipun aktivitas utama Blunder Skuad berbasis daring, kami memiliki
        aspirasi untuk aktif juga dalam ekosistem catur tatap muka.
        Penyelenggaraan turnamen darat memerlukan kerja sama dengan mitra lokal,
        venue yang memadai, serta koordinasi logistik yang lebih kompleks.
        Sistem data dan rating internal yang kami miliki dirancang sedemikian
        rupa sehingga dapat mendukung integrasi hasil turnamen darat ke dalam
        catatan komunitas. Kami mengundang anggota yang memiliki jaringan lokal
        atau sumber daya untuk berkolaborasi dalam mewujudkan turnamen tatap
        muka di bawah bendera Blunder Skuad.
      </p>
    ),
  },
  {
    t:"Apakah saya boleh mendaftar dengan dua akun?",
    j: (
      <p className="m-0">
        Tidak. Blunder Skuad hanya mengakui satu akun per identitas. Setiap
        anggota diharapkan untuk menjaga keutuhan akun resminya dengan baik.
        Duplikasi akun, terutama yang dimaksudkan untuk menghindari sanksi,
        memanipulasi hasil pertandingan, atau mengelabui sistem pairing,
        merupakan pelanggaran yang tidak akan ditolerir. Anggota yang akunnya
        terkena sanksi permanen dari komunitas karena pelanggaran kebijakan
        permainan adil tidak akan dapat mendaftar kembali menggunakan identitas
        atau akun baru.
      </p>
    ),
  },
  {
    t:"Bagaimana jika saya memiliki pertanyaan atau masalah yang tidak tercakup dalam FAQ ini?",
    j: (
      <p className="m-0">
        Blunder Skuad menyadari bahwa tidak semua situasi dapat diantisipasi
        dalam dokumen ini. Oleh karena itu, kami menyediakan saluran komunikasi
        resmi yang dapat diakses oleh seluruh anggota untuk mengajukan
        pertanyaan, melaporkan masalah, atau memberikan masukan. Pengurus
        komunitas berkomitmen untuk merespons setiap komunikasi dalam batas
        waktu yang wajar, sesuai dengan prosedur operasional yang berlaku. Kami
        menganjurkan anggota untuk tidak ragu menghubungi pengurus apabila
        terdapat kebingungan atau kebutuhan klarifikasi terkait kebijakan
        komunitas.
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
      next={{ to:"/hubungi-kami", judul: t("pertanyaan.nextJudul") }}
    >
      <PageArtikel lebar>

        {/* ═══ Konten Pertanyaan & Jawaban ═══ */}
        <div className="flex w-full flex-col gap-y-6 pt-1 font-serif text-base leading-[1.6] text-grey-800">
          <ol className="m-0 p-0 flex flex-col gap-y-5 list-none">
            {DAFTAR_TANYA.map((item, index) => (
              <li key={index} className="flex flex-col gap-y-1">
                <h2 className="font-serif">
                  {index + 1}. {item.t}
                </h2>
                <div className="text-grey-800">
                  {index === 0 ? (
                    <div className="">
                      {item.j}
                    </div>
                  ) : (
                    item.j
                  )}
                </div>
                {index < DAFTAR_TANYA.length - 1 && (
                  <hr className="mt-4 border-t border-slate-300" />
                )}
              </li>
            ))}
          </ol>

          {/* ═══ Footer Note / Penutup Editorial ═══ */}
          <div className="mt-6 border-t border-b border-grey-200 p-4 text-center">
            <p className="m-0 font-serif text-sm leading-relaxed text-grey-800 italic">
              Dokumen ini disusun sebagai panduan praktis bagi seluruh anggota
              Blunder Skuad. Pertanyaan-pertanyaan di atas mencakup aspek-aspek
              fundamental yang sering menjadi pertanyaan bagi anggota baru maupun
              anggota yang telah lama bergabung.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-300">
              <strong className="block font-sans text-[13px] font-semibold text-grey-800">
                Blunder Skuad
              </strong>
              <span className="block font-serif text-xs italic text-grey-600 mt-0.5">
                Komunitas Catur untuk Semua
              </span>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}