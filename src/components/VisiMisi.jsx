export default function VisiMisi() {
  return (
    <section id="visi-misi" className="w-full relative bg-transparent">
      {/* Visi & Misi */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-6 md:pb-6 xl:pb-16">
        <div className="relative w-full mx-auto md:max-w-[1024px] flex flex-col gap-y-6 md:gap-y-6 lg:gap-y-6">
          {/* Visi */}
          <h2 className="focus:outline-none focus:ring-0 text-black font-semibold text-3xl md:text-3xl">
            Visi
          </h2>
          <div className="w-full">
            <div className="text-primary text-base md:text-base">
              Menjadi komunitas catur yang mengedepankan sportivitas, prestasi,
              dan pembinaan.
            </div>
          </div>
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p className="ql-align-justify">
                Komunitas Catur Indonesia berkomitmen untuk menjadi komunitas
                catur berskala nasional yang tidak hanya menjalankan kegiatan
                dengan landasan organisasi yang kuat, tetapi juga berperan
                strategis dalam mendukung pengembangan catur Indonesia,
                khususnya dalam memperkuat sportivitas, memastikan ketersediaan
                wadah bertanding, serta mendorong pembinaan yang berkelanjutan.
              </p>
              <ol>
                <li className="ql-align-justify">
                  <strong>Sportivitas:</strong> memperkuat budaya fair play dan
                  integritas dalam setiap pertandingan.
                </li>
                <li className="ql-align-justify">
                  <strong>Prestasi:</strong> mewujudkan lingkungan kompetitif
                  guna menjamin lahirnya pecatur berprestasi nasional dan
                  internasional.
                </li>
                <li className="ql-align-justify">
                  <strong>Pembinaan:</strong> mendorong pengembangan bakat usia
                  muda sebagai langkah strategis dalam menjaga keberlanjutan
                  regenerasi catur Indonesia.
                </li>
              </ol>
            </div>
          </div>

          <div className="w-full h-4 md:h-6 bg-transparent" />

          {/* Misi */}
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            Misi
          </h2>
          <div className="w-full">
            <div className="text-primary text-base md:text-base">
              Menyediakan wadah bermain dan belajar catur melalui program
              inovatif yang memberi nilai tambah untuk anggota dan masyarakat.
            </div>
          </div>
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p className="ql-align-justify">
                Misi untuk menyediakan wadah bermain dan belajar catur melalui
                program inovatif yang memberi nilai tambah bagi anggota dan
                masyarakat mencerminkan komitmen komunitas dalam menghadirkan
                kegiatan yang andal, berkelanjutan, dan relevan dengan dinamika
                perkembangan catur nasional dan global. Upaya tersebut dilakukan
                melalui fokus program pada <em>dual-growth strategy</em>, yaitu{" "}
                <em>Maximizing Competitive Play</em> dan{" "}
                <em>Building Grassroots Development</em>. Pilar{" "}
                <em>Maximizing Competitive Play</em> fokus pada peningkatan
                frekuensi turnamen internal, penguatan liga musiman, penguatan
                pertandingan persahabatan antar komunitas, serta pengembangan
                infrastruktur latihan. Sedangkan pilar{" "}
                <em>Building Grassroots Development</em> fokus pada pengembangan
                kelas pemula, ekosistem pelatihan daring, program sekolah catur,
                dan teknologi latihan digital.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tata Nilai — judul */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-6 md:pb-6 xl:pb-16">
        <div className="relative w-full mx-auto md:max-w-[1024px]">
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            Tata Nilai
          </h2>
        </div>
      </div>

      {/* Tata Nilai — gambar */}
      <div className="w-full relative pl-6 md:pl-8 pr-6 md:pr-8">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] border-guide flex flex justify-center items-center">
          <div className="flex justify-center items-center">
            <div className="flex flex-col justify-center items-center">
              <img
                src="/images/tata-nilai.jpg"
                alt="Tata nilai komunitas"
                className="w-full h-auto object-cover"
                draggable="false"
                loading="lazy"
              />
              <p className="text-sm font-normal text-gray-500 mt-2">
                Nilai-nilai yang dipegang teguh anggota komunitas dalam setiap
                pertandingan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
