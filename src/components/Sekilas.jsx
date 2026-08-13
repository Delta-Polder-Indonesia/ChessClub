export default function Sekilas() {
  return (
    <section
      id="sekilas-komunitas"
      className="w-full relative bg-transparent pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-12 md:pb-12 xl:pb-16 pt-12 md:pt-12 xl:pt-24"
    >
      <div className="relative w-full mx-auto md:max-w-[1024px] flex flex-col gap-y-6 md:gap-y-8 lg:gap-y-10">
        <h2 className="focus:outline-none focus:ring-0 font-semibold text-2xl md:text-3xl text-black">
          Sekilas Komunitas
        </h2>
        <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
          <div className="relative z-[1] prose-kci max-w-none">
            <p className="ql-align-justify">
              Komunitas Catur Indonesia senantiasa memegang teguh komitmen
              untuk menyediakan wadah bermain dan belajar catur serta
              mengembangkan pembinaan usia muda dalam rangka mendukung
              terciptanya kemandirian prestasi catur nasional. Memegang amanah
              sebagai komunitas catur terverifikasi di Chess.com sejak
              ditetapkan pada tanggal 10 Desember 2015, komunitas kini memiliki
              peran sangat strategis yang membawahi lima Divisi yang bergerak
              di bidang pengembangan catur, yaitu Divisi Turnamen yang
              menjalankan kompetisi internal dan eksternal, Divisi Pembinaan
              yang menjalankan kelas dan pelatihan, Divisi Media &amp; Humas
              yang mengelola publikasi, Divisi Keanggotaan yang mengelola
              administrasi anggota, serta Divisi Teknologi yang mengelola
              platform daring komunitas.
            </p>
            <p className="ql-align-justify">
              Peran penting yang diemban oleh komunitas ini sekaligus menandai
              tonggak sejarah baru dalam perjalanan komunitas setelah
              kontribusi nyata yang diberikan selama lebih dari satu dekade
              menyediakan wadah bertanding yang telah menggerakkan semangat
              pecatur Indonesia dari berbagai daerah.
            </p>
            <p className="ql-align-justify">
              Kemampuan komunitas yang mumpuni ini dibangun di atas fondasi
              yang solid dan sejarah panjang dalam mengawal terwujudnya
              pembinaan catur nasional. Sejarah mencatat bahwa eksistensi
              Komunitas Catur Indonesia dibangun sejak sekitar tahun 2014,
              ketika sekelompok pecatur di Medan mulai berkumpul rutin untuk
              bertanding catur kilat di sebuah warung kopi. Kemudian kelompok
              tersebut resmi menjadi komunitas pada tanggal 10 Desember 2015,
              yang hingga kini diperingati sebagai hari lahir komunitas.
            </p>
            <p className="ql-align-justify">
              Pada tahun 2018, komunitas resmi membentuk klub di Chess.com
              sebagai basis pertandingan daring seluruh anggota. Selanjutnya,
              peran komunitas semakin strategis setelah pada tahun 2020
              menginisiasi program kelas catur daring gratis bagi pelajar di
              tengah masa pandemi.
            </p>
            <p className="ql-align-justify">
              Berdasarkan kesepakatan Musyawarah Anggota tanggal 18 Juni 2023,
              komunitas mengubah struktur organisasi menjadi struktur
              kepengurusan dengan divisi-divisi fungsional. Pada tanggal 10
              Desember 2024, komunitas memperbarui identitas visual dengan logo
              kuda catur berwarna dasar biru, merah, dan hijau yang
              merefleksikan unsur dinamis dan kepedulian pada pembinaan.
            </p>
            <p>
              Bahkan setelah evolusi yang dialami selama satu dekade itu,
              komunitas berkomitmen untuk tetap menggaungkan semangat
              transformasi yang berkelanjutan guna menyempurnakan langkahnya
              menjadi komunitas catur terdepan di Indonesia yang didukung oleh
              organisasi yang semakin lincah, mudah beradaptasi, dan fokus
              untuk pengembangan pembinaan yang lebih luas.
            </p>
          </div>
        </div>

        {/* Blok gambar dengan keterangan */}
        <div className="border-guide flex justify-center">
          <div className="flex flex-col justify-center items-center">
            <img
              src="/images/sekilas.jpg"
              alt="Suasana kegiatan rutin komunitas di sekretariat Medan"
              className="w-full h-auto object-cover"
              draggable="false"
              loading="lazy"
            />
            <p className="text-sm font-normal text-gray-500 mt-2">
              Suasana kegiatan rutin komunitas di sekretariat Medan, 2025.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
