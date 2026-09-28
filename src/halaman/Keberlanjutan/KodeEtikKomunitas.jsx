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
      <PageArtikel lebar>
        {/* ═══ Header Editorial / Koran ═══ */}
        <section className="font-serif -mt-8 md:-mt-12 relative w-full overflow-hidden bg-white">
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-2 md:px-8 md:py-3 xl:px-0">
            <div className="relative mb-6 border-b-4 border-double border-gray-900 pb-3 text-center">
              <p className="mb-1 text-xs font-bold tracking-widest text-gray-900 uppercase">
                {t("kodeEtik.judul")}
              </p>
              <h1 className="mb-2 text-3xl leading-none font-black tracking-tight text-gray-900 uppercase md:text-4xl">
                {t("kodeEtik.artikel")}
              </h1>
              <p className="m-0 text-sm text-gray-900 italic">
                {t("kodeEtik.deskripsi")}
              </p>
            </div>
          </div>
        </section>

        {/* ═══ Konten Paragraf Utama & Sub-bagian ═══ */}
        <div className="flex w-full flex-col gap-y-4 pt-1 font-serif text-sm leading-relaxed text-justify text-gray-800">
          <p className="m-0 font-sans text-xs font-semibold text-gray-500">
            Terakhir diperbarui: 24 Agustus 2026
          </p>

          <div className="pt-2">
            <h2 className="m-0 mb-2 border-b border-gray-900 pb-1 font-sans text-base font-black tracking-tight text-gray-900 uppercase">
              1. Tujuan dan Ruang Lingkup
            </h2>
            <p className="m-0 first-letter:float-left first-letter:mr-3 first-letter:text-4xl first-letter:font-black first-letter:leading-none first-letter:text-gray-900">
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
          </div>

          <hr className="my-2 border-t border-gray-300" />

          <div>
            <h2 className="m-0 mb-2 border-b border-gray-900 pb-1 font-sans text-base font-black tracking-tight text-gray-900 uppercase">
              2. Perilaku dalam Komunitas
            </h2>
            <p className="m-0">
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
          </div>

          <hr className="my-2 border-t border-gray-300" />

          <div>
            <h2 className="m-0 mb-2 border-b border-gray-900 pb-1 font-sans text-base font-black tracking-tight text-gray-900 uppercase">
              3. Sikap Sportif dalam Bermain
            </h2>
            <p className="m-0">
              Catur adalah permainan yang lahir dari tradisi kehormatan, dan
              Blunder Skuad berkomitmen untuk menjaga warisan tersebut. Anggota
              dilarang menghentikan permainan secara berulang kali tanpa alasan
              yang jelas, membuat lawan menunggu dengan sengaja, atau memutuskan
              koneksi dan keluar dari pertandingan tanpa mengundurkan diri ketika
              posisi sudah kalah. Tindakan apa pun yang bertujuan untuk memanipulasi
              peringkat secara artifisial, termasuk sengaja kalah dalam pertandingan
              untuk menurunkan rating (<em className="italic font-semibold">sandbagging</em>) atau memanipulasi hasil
              pertandingan dengan cara apa pun, merupakan pelanggaran serius.
              Menghina, mengejek, atau merendahkan lawan main, baik sebelum, selama,
              maupun setelah pertandingan, tidak sesuai dengan nilai-nilai
              komunitas ini. Seluruh anggota wajib mematuhi protokol Permainan Adil
              yang berlaku di Blunder Skuad, yang mencakup larangan penggunaan
              mesin analisis, database bukaan, atau bantuan pihak ketiga selama
              pertandingan berlangsung kecuali dalam format yang secara eksplisit
              mengizinkannya.
            </p>
          </div>

          <hr className="my-2 border-t border-gray-300" />

          <div>
            <h2 className="m-0 mb-2 border-b border-gray-900 pb-1 font-sans text-base font-black tracking-tight text-gray-900 uppercase">
              4. Mekanisme Pelaporan
            </h2>
            <p className="m-0">
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
          </div>

          <hr className="my-2 border-t border-gray-300" />

          <div className="flex flex-col gap-y-3">
            <h2 className="m-0 mb-1 border-b border-gray-900 pb-1 font-sans text-base font-black tracking-tight text-gray-900 uppercase">
              5. Peraturan Acara Komunitas
            </h2>
            <p className="m-0">
              Untuk menjamin lingkungan yang aman, adil, dan kompetitif, seluruh
              turnamen, pertandingan, liga, serta kompetisi catur lainnya yang
              diselenggarakan oleh anggota atas nama Blunder Skuad wajib mematuhi
              aturan yang diuraikan dalam bagian ini. Ketentuan ini mengikat semua
              anggota, namun tanggung jawab khusus terkait administrasi dan
              kepatuhan berlaku secara spesifik bagi individu atau kelompok yang
              bertindak sebagai penyelenggara acara.
            </p>

            <div className="mt-1">
              <h3 className="m-0 mb-1 font-sans text-xs font-bold tracking-wide text-gray-900 uppercase">
                Klasifikasi Acara
              </h3>
              <p className="m-0">
                Blunder Skuad mengklasifikasikan acara ke dalam dua kategori utama.
                Pertama, <strong className="font-bold text-gray-900">Acara Internal</strong>, yang merupakan format standar
                bagi sebagian besar turnamen dan kegiatan komunitas. Penyelenggara
                acara internal tidak memerlukan izin khusus dari pengurus utama selama
                mematuhi persyaratan operasional yang telah ditetapkan. Kedua,{" "}
                <strong className="font-bold text-gray-900">Acara Resmi</strong>, yang merupakan status premium
                diperuntukkan bagi kegiatan penting yang memerlukan keterlibatan
                langsung dan dukungan penuh dari pengurus Blunder Skuad. Status ini
                hanya dapat diperoleh melalui proses pengajuan formal, diskusi, dan
                persetujuan pengurus.
              </p>
            </div>

            <div className="mt-1">
              <h3 className="m-0 mb-1 font-sans text-xs font-bold tracking-wide text-gray-900 uppercase">
                Persyaratan untuk Acara Internal
              </h3>
              <p className="m-0">
                Penyelenggara acara internal wajib menampilkan pernyataan berikut
                secara jelas di semua halaman acara, formulir pendaftaran, dan materi
                promosi:{" "}
                <em className="italic font-semibold">
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
            </div>

            <div className="mt-1">
              <h3 className="m-0 mb-1 font-sans text-xs font-bold tracking-wide text-gray-900 uppercase">
                Opsi Dukungan Permainan Adil
              </h3>
              <p className="m-0">
                Blunder Skuad menyediakan berbagai tingkat dukungan permainan adil
                untuk membantu penyelenggara menjaga integritas acara mereka.{" "}
                <strong className="font-bold text-gray-900">Perlindungan Standar</strong> adalah mekanisme default yang
                berlaku untuk seluruh pertandingan di dalam komunitas, di mana setiap
                permainan diperiksa oleh sistem deteksi otomatis standar.
                Penyelenggara tidak perlu melakukan tindakan tambahan untuk
                mengaktifkan perlindungan ini. <strong className="font-bold text-gray-900">Peninjauan Prioritas</strong>{" "}
                dapat diminta oleh penyelenggara kepada pengurus apabila ingin
                algoritme deteksi memprioritaskan pertandingan dalam acara mereka;
                layanan ini dapat disediakan secara gratis sesuai ketersediaan sumber
                daya. <strong className="font-bold text-gray-900">Peninjauan Manual</strong> oleh tim analisis internal
                Blunder Skuad dapat diminta oleh penyelenggara acara internal apabila
                diperlukan investigasi yang lebih mendalam; layanan ini tergantung
                pada ketersediaan tim dan dapat dikenakan biaya operasional untuk
                menutupi jam kerja analisis manual.
              </p>
            </div>

            <div className="mt-1">
              <h3 className="m-0 mb-1 font-sans text-xs font-bold tracking-wide text-gray-900 uppercase">
                Persyaratan untuk Acara Resmi
              </h3>
              <p className="m-0">
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
                <em className="italic font-semibold">
                  "Acara ini secara resmi didukung oleh, namun tetap merupakan
                  tanggung jawab penyelenggara, Blunder Skuad."
                </em>
              </p>
            </div>

            <div className="mt-1">
              <h3 className="m-0 mb-1 font-sans text-xs font-bold tracking-wide text-gray-900 uppercase">
                Aturan Operasional Umum
              </h3>
              <p className="m-0">
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
            </div>

            <div className="mt-1">
              <h3 className="m-0 mb-1 font-sans text-xs font-bold tracking-wide text-gray-900 uppercase">
                Sponsor dan Promosi
              </h3>
              <p className="m-0">
                Panitia penyelenggara tidak diperbolehkan untuk menerima sponsor dari,
                atau mengiklankan, entitas atau produk yang terkait dengan narkoba
                ilegal atau zat terlarang, layanan perjudian atau taruhan yang
                dilarang dalam yurisdiksi relevan, pornografi atau konten seksual
                eksplisit, serta organisasi politik atau kelompok yang menyebarkan
                ujaran kebencian. Pembatasan ini diterapkan untuk menjaga citra dan
                nilai-nilai komunitas agar tetap kondusif bagi seluruh anggota.
              </p>
            </div>
          </div>

          <hr className="my-2 border-t border-gray-300" />

          <div>
            <h2 className="m-0 mb-2 border-b border-gray-900 pb-1 font-sans text-base font-black tracking-tight text-gray-900 uppercase">
              6. Penafian dan Tanggung Jawab
            </h2>
            <p className="m-0">
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
          </div>

          {/* ═══ Footer Note / Penutup Editorial ═══ */}
          <div className="mt-6 border-t-2 border-b-2 border-gray-900 p-4 text-center">
            <p className="m-0 font-serif text-sm leading-relaxed text-gray-900 italic">
              Dokumen ini disusun sebagai pedoman hidup komunitas Blunder Skuad.
              Dengan tetap aktif sebagai anggota, Anda dianggap telah membaca,
              memahami, dan menyetujui seluruh ketentuan yang tercantum di atas.
            </p>
            <div className="mt-4 pt-3 border-t border-gray-300">
              <strong className="block font-sans text-xs font-black tracking-widest uppercase text-gray-900">
                Blunder Skuad
              </strong>
              <span className="block font-serif text-xs italic text-gray-700 mt-0.5">
                Komunitas Catur untuk Semua
              </span>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}