import { useEffect, useState } from "react";

const SLIDE_DURATION = 7000;

const SLIDES = [
  {
    img: "/images/tonggak-2015.jpg",
    label: "2015 - 2016",
    title: "Perjalanan 2015-2016",
    paragraphs: [
      "Sejarah mencatat bahwa eksistensi Komunitas Catur Indonesia dibangun sejak sekitar tahun 2014, ketika sekelompok pecatur Medan berkumpul rutin di sebuah warung kopi untuk bertanding catur kilat. Kemudian kelompok tersebut resmi menjadi komunitas dengan nama Komunitas Catur Indonesia pada 10 Desember 2015, yang hingga kini diperingati sebagai hari lahir komunitas.",
      "Selama tahun pertama, komunitas memperkokoh eksistensi sebagai satu-satunya komunitas catur terpadu di Kota Medan yang mewadahi pecatur dari berbagai latar belakang, mulai dari pelajar hingga pekerja profesional.",
    ],
  },
  {
    img: "/images/tonggak-2016.jpg",
    label: "2016 - 2017",
    title: "Perjalanan 2016-2017",
    paragraphs: [
      "Memasuki tahun kedua, komunitas memaksimalkan pertumbuhan kegiatan dan memberikan kontribusi pada pembinaan catur daerah. Pada periode ini, eksistensi komunitas sebagai penggerak catur lokal mulai diakui oleh PERCASI Sumatera Utara. Perkembangan pesat tersebut salah satunya berkat kolaborasi turnamen bersama komunitas catur lain di Pulau Sumatera.",
      "Pada tahun 2017, komunitas resmi membentuk klub di Chess.com sebagai basis pertandingan daring bagi seluruh anggota, sekaligus menandai dimulainya era pertandingan daring rutin.",
    ],
  },
  {
    img: "/images/tonggak-2018.jpg",
    label: "2018 - 2019",
    title: "Perjalanan 2018-2019",
    paragraphs: [
      "Pada periode ini, komunitas untuk pertama kalinya menyelenggarakan turnamen terbuka berskala kota dengan standar regulasi internasional. Dalam rentang waktu dua tahun ini, komunitas mampu menambah frekuensi turnamen internal menjadi dua kali dalam satu bulan.",
      "Di awal 2019, komunitas mulai meletakkan dasar pembinaan usia dini melalui kelas catur gratis bagi pelajar, serta membangun perpustakaan materi latihan digital.",
    ],
  },
  {
    img: "/images/tonggak-2020.jpg",
    label: "2020 - 2021",
    title: "Perjalanan 2020-2021",
    paragraphs: [
      "Pada masa ini, komunitas menghadapi masa pandemi. Dengan dukungan para pengurus, pembenahan aspek organisasi dan platform daring dilakukan sebagai upaya komunitas untuk tetap aktif. Dalam rentang waktu ini, komunitas mampu menyelenggarakan turnamen daring mingguan yang diikuti anggota dari berbagai kota di Indonesia.",
      "Komunitas juga menginisiasi program kelas catur daring gratis bagi pelajar di tengah masa pandemi, yang menjadi cikal bakal Akademi Catur Komunitas.",
    ],
  },
  {
    img: "/images/tonggak-2022.jpg",
    label: "2022 - 2023",
    title: "Perjalanan 2022-2023",
    paragraphs: [
      "Pada periode ini, komunitas berupaya mengembangkan pembinaan catur usia muda. Selama dua tahun terakhir, komunitas melakukan kerja sama dengan sekolah-sekolah di Medan dalam bentuk ekstrakurikuler catur dan lomba antar sekolah.",
      "Komunitas menunjukkan kesungguhannya dalam menjalankan kegiatan yang berwawasan sportivitas dengan membentuk fungsi baru, yaitu Komite Etik dan Fair Play pada 2022. Komunitas juga mulai menerapkan program penilaian performa anggota untuk meningkatkan keterlibatan seluruh anggota dalam berlatih.",
    ],
  },
  {
    img: "/images/tonggak-2024.jpg",
    label: "2024 - 2025",
    title: "Perjalanan 2024-2025",
    paragraphs: [
      "Pada periode ini, tepatnya pada tahun 2024, komunitas mengubah struktur organisasi menjadi struktur kepengurusan dengan divisi-divisi fungsional guna mendukung efisiensi kegiatan. Pada 10 Desember 2024, komunitas memperbarui identitas visual dengan logo baru berwarna dasar biru, merah, dan hijau yang merefleksikan unsur dinamis dan kepedulian pada pembinaan.",
      "Komunitas juga melakukan transformasi pada 20 Juli 2025 melalui perombakan kurikulum latihan yang mengintegrasikan analisis digital dan latihan bersama pecatur bergelar, sebagai bagian dari target pencapaian 5.000 anggota aktif.",
    ],
  },
];

/**
 * Carousel Tonggak Sejarah — identik dengan Swiper Pertamina:
 * slide full-width dengan foto + lapisan gelap, judul dan paragraf putih,
 * navigasi garis progress di atas dengan label tahun.
 */
export default function Tonggak() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      SLIDE_DURATION
    );
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <section id="tonggak-sejarah" className="w-full relative bg-transparent">
      {/* Judul */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-6 md:pb-6 xl:pb-16">
        <div className="relative w-full mx-auto md:max-w-[1024px]">
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            Tonggak Sejarah
          </h2>
        </div>
      </div>

      {/* Carousel */}
      <div className="w-full relative bg-transparent pb-24 md:pb-24 xl:pb-24">
        <div className="w-full relative h-full min-h-[600px] overflow-hidden">
          {SLIDES.map((slide, i) => (
            <div
              key={slide.label}
              className={`w-full absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === index ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{ zIndex: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            >
              <div
                className="w-full relative h-full min-h-[600px]"
                style={{ backgroundImage: `url(${slide.img})`, backgroundSize: "cover", backgroundPosition: "center" }}
              >
                {/* Lapisan gelap */}
                <div className="absolute inset-0 pointer-events-none opacity-60 bg-[#000000CC]" />
                {/* Konten teks */}
                <div className="relative w-full h-full mx-auto grid grid-cols-[1fr] lg:grid-cols-[60%] lg:max-w-[960px] xl:max-w-[1280px] lg:justify-start items-end px-2 md:px-2">
                  <div className="w-full pl-6 md:pl-8 xl:pl-6 pr-6 md:pr-8 xl:pr-20 pb-12 md:pb-12 xl:pb-4 pt-12 md:pt-12 xl:pt-3.5">
                    <div className="w-full lg:max-w-[840px]">
                      <h3 className="focus:outline-none focus:ring-0 text-white font-semibold text-4xl md:text-4xl mb-6">
                        {slide.title}
                      </h3>
                      <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
                        <div className="relative z-[1]">
                          {slide.paragraphs.map((p, j) => (
                            <p
                              key={j}
                              className="text-white text-sm md:text-base leading-6 md:leading-7 mb-4"
                            >
                              {p}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigasi garis progress */}
        <div className="absolute top-5 left-0 right-0 z-10 lg:max-w-[960px] xl:max-w-[1280px] mx-auto px-8 md:px-10 lg:px-4 xl:px-0 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={slide.label}
              className={`group relative flex-1 text-left cursor-pointer whitespace-nowrap transition-all duration-300 text-xs md:text-sm font-medium border-b-[3px] ${
                index === i
                  ? "text-white border-[red]"
                  : "text-white/50 border-white/30 hover:text-white"
              }`}
            >
              <div className="relative flex items-center gap-1 md:gap-2 py-2 md:py-4">
                <span
                  className={`bullet-dot size-2 md:size-3 rounded-full transition-all duration-300 ${
                    index === i
                      ? "bg-[red] opacity-100"
                      : "bg-current opacity-10 group-hover:opacity-100"
                  }`}
                />
                <span className="bullet-title transition-all duration-300 group-hover:text-white whitespace-nowrap">
                  {slide.label}
                </span>
                {index === i && (
                  <span
                    key={`progress-${i}-${index}`}
                    className="bullet-progress absolute bottom-[-3px] left-0 h-[3px] w-0 bg-[red]"
                    style={{
                      animation: `progressbar ${SLIDE_DURATION}ms linear forwards`,
                    }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
