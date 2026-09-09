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

  const DAFTAR_NAV = [
    {
      to: "/pendaftaran-anggota",
      judul: "Pendaftaran Anggota",
      img: "/images/Turnamen/daftar.png",
    },
    {
      to: "/turnamen/turnamen-bulanan",
      judul: "Turnamen Bulanan",
      img: "/images/Turnamen/skor.png",
    },
    {
      to: "/turnamen/turnamen-terbuka",
      judul: "Turnamen Terbuka",
      img: "/images/Turnamen/live.png",
    },
    {
      to: "/turnamen/liga-antar-komunitas",
      judul: "Liga Antar Komunitas",
      img: "/images/Turnamen/chairs.png",
    },
    {
      to: "/turnamen/liga-musiman",
      judul: "Liga Musiman",
      img: "/images/Turnamen/hasil.png",
    },
  ];

  return (
    <HalamanIsi
      title={t("turnamen.judul")}
      description={t("turnamen.deskripsi")}
      next={{ to: "/turnamen/turnamen-bulanan", judul: t("turnamen.nextJudul") }}
    >
      <PageArtikel lebar>
        {/* ═══ Header Editorial / Koran ═══ */}
        <section className="-mt-8 md:-mt-12 relative w-full overflow-hidden bg-white">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-2 md:px-8 md:py-3 xl:px-0">
            <div className="relative mb-6 border-b-4 border-double border-gray-900 pb-3 text-center">
              <p className="mb-1 font-sans text-xs font-bold tracking-widest text-gray-900 uppercase">
                {t("turnamen.judul")}
              </p>
              <h1 className="mb-2 text-3xl leading-none font-black tracking-tight text-gray-900 uppercase md:text-4xl">
                Turnamen Komunitas
              </h1>
              <p className="m-0 text-sm text-gray-900 italic">
                {t("turnamen.deskripsi")}
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Direct Tautan / Navigation Grid Editorial ═══ */}
        <nav className="mb-8 border-y-2 border-gray-900 py-4 bg-stone-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {DAFTAR_NAV.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className="group flex flex-col items-center justify-center p-3 text-center border border-gray-300 hover:border-gray-900 hover:bg-white transition-all duration-150"
              >
                <img
                  src={gambar(item.img)}
                  alt={item.judul}
                  width="60"
                  height="60"
                  className="h-12 w-12 object-contain mb-2 group-hover:scale-105 transition-transform duration-150"
                />
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-gray-900 group-hover:underline">
                  {item.judul}
                </span>
              </Link>
            ))}
          </div>
        </nav>

        {/* ═══ Konten Artikel Editorial ═══ */}
        <div className="flex w-full flex-col gap-y-6 pt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
          <p className="m-0 first-letter:float-left first-letter:mr-3 first-letter:text-4xl first-letter:font-black first-letter:leading-none first-letter:text-gray-900">
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

          <p className="m-0">
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

          <p className="m-0">
            Dalam hal format kompetisi, Blunder Skuad mengadopsi dua sistem utama
            yang masing-masing memiliki karakteristik dan tujuan berbeda. Sistem{" "}
            <em className="italic font-semibold">Swiss</em> menjadi pilihan utama ketika jumlah peserta relatif
            besar, karena format ini memungkinkan penentuan juara tanpa
            mengharuskan setiap peserta bertemu dengan seluruh peserta lainnya.
            Pada setiap ronde, pairing ditentukan berdasarkan akumulasi skor
            sementara, sehingga pemain dengan performa serupa akan saling
            berhadapan. Di sisi lain, sistem <em className="italic font-semibold">round robin</em> diterapkan
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

          <p className="m-0">
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

          <p className="m-0">
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

          <p className="m-0">
            Selain format turnamen konvensional, Blunder Skuad juga memfasilitasi
            format kompetisi yang lebih intim dan cepat, yang dalam terminologi
            komunitas ini dikenal sebagai pertandingan empat pemain atau{" "}
            <em className="italic font-semibold">quad</em>. Format ini melibatkan empat peserta yang saling
            bertanding dalam skema <em className="italic font-semibold">round robin</em> mini, di mana setiap pemain
            menghadapi tiga lawan dalam satu sesi. Warna bidak diatur dan diacak
            oleh panitia, dan seluruh pertandingan diselesaikan dalam waktu serta
            jadwal yang telah ditentukan. Kelebihan format ini terletak pada
            efisiensinya; tidak ada waktu tunggu yang berkepanjangan, dan para
            peserta dapat langsung merasakan hasil kompetisi dalam satu sesi tanpa
            harus menunggu berhari-hari. Hadiah untuk format ini, jika ada, akan
            diumumkan oleh pengurus sebelum turnamen dimulai, sehingga transparansi
            mengenai insentif tetap terjaga.
          </p>

          <p className="m-0">
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
            <em className="italic font-semibold">pairing</em> untuk menciptakan pertandingan yang seimbang,
            sekaligus sebagai indikator perkembangan kemampuan anggota dari waktu
            ke waktu. Bagi anggota yang memiliki rating resmi dari federasi catur
            nasional atau internasional, konversi dapat dilakukan untuk menentukan
            posisi awal yang lebih merepresentasikan kemampuan aktual mereka.
          </p>

          <p className="m-0">
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

          <p className="m-0">
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

          <p className="m-0">
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

          <p className="m-0">
            Secara keseluruhan, turnamen di Blunder Skuad adalah ekspresi dari
            komitmen komunitas untuk menjadikan catur sebagai pengalaman yang
            inklusif, terstruktur, dan bermakna. Setiap aspek — mulai dari
            fleksibilitas jadwal, variasi format, protokol verifikasi, hingga
            mekanisme penyelesaian sengketa — dirancang untuk mendukung tujuan
            tersebut. Bagi anggota, berpartisipasi dalam turnamen bukan hanya
            tentang mencari kemenangan, tetapi tentang menjadi bagian dari ritme
            kolektif yang terus berkembang dan saling memperkaya.
          </p>

          <hr className="my-4 border-t border-gray-300" />

          {/* ═══ Seksi Hasil Turnamen ═══ */}
          <section className="flex flex-col gap-y-3 pt-2">
            <h2
              id="history"
              className="m-0 font-sans text-lg font-black tracking-tight text-gray-900 uppercase border-b-2 border-gray-900 pb-1"
            >
              Hasil Turnamen
            </h2>
            <p className="m-0 font-serif text-sm">
              Rekap hasil turnamen komunitas dipublikasikan pada tabel berikut
              setiap kali sebuah rangkaian selesai. Nama juara diisikan oleh
              pengurus melalui dashboard internal.
            </p>

            <div className="my-2">
              <TabelHasilTurnamen />
            </div>

            <p className="m-0 font-serif text-xs italic text-gray-700">
              Keterangan: Turnamen Bulanan adalah liga yang dimainkan rutin oleh
              anggota. Kursi Empat adalah turnamen mini yang diikuti oleh empat
              pemain. Turnamen Terbuka adalah turnaman langsung dengan ronde
              terjadwal. Untuk detail selengkapnya bisa dilihat di halaman{" "}
              <Link
                to="/keberlanjutan/pertanyaan-umum"
                className="underline font-bold text-gray-900 hover:text-black"
              >
                tanya jawab
              </Link>
              .
            </p>
          </section>

          {/* ═══ Footer Note / Penutup Editorial ═══ */}
          <div className="mt-8 border-t-2 border-b-2 border-gray-900 p-4 text-center">
            <strong className="block font-sans text-xs font-black tracking-widest uppercase text-gray-900">
              Blunder Skuad
            </strong>
            <span className="block font-serif text-xs italic text-gray-700 mt-0.5">
              Komunitas Catur untuk Semua
            </span>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}