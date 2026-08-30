import React from 'react';
import { namaSekolahUppercase } from '../../components/Profile/dataSekolah';

export default function VisiSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(90deg,_#43AD35_0%,_#038A47_25%,_#0B6839_50%)] py-16 font-serif">
      {/* Foto nempel kiri sebagai background */}
      <a
        href="https://youtu.be/cYndxIWek0w"
        target="_blank"
        rel="noopener noreferrer"
        title={`Video Profil ${namaSekolahUppercase}`}
        className="absolute top-0 left-0 h-full w-full focus:outline-none md:w-1/2"
      >
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYNJUoAyTU0I3VY3ACaAOOV8rBkJZIMVDaEb1b1cbY72dlBs1Finp-Ers&s=10"
          alt={`Video Profil ${namaSekolahUppercase} - UNPAB TV`}
          className="h-full w-full object-cover object-center"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            t.onerror = null;
            t.src = 'https://placehold.co/600x400?text=Video+Profil';
          }}
        />
        {/* Overlay hijau biar foto nyatu ke background */}
        <div className="absolute inset-0 bg-[linear-gradient(270deg,_#0B6839_0%,_rgba(11,104,57,0.6)_30%,_rgba(11,104,57,0.2)_100%)]" />
      </a>

      <div className="relative z-10 container mx-auto px-4">
        <div className="flex flex-col items-center">
          {/* Content */}
          <div className="flex w-full flex-col items-center gap-8 md:flex-row">
            {/* Kolom kosong buat balance layout (foto ada di background kiri) */}
            <div className="hidden md:block md:w-1/2" />

            {/* Text */}
            <div className="w-full md:w-1/2" style={{ color: '#FFFFFF' }}>
              <h1 className="sec-title mb-4">
                Membangun Desa, <br /> Membangun Indonesia.
              </h1>
              <p className="sec-body text-justify" style={{ color: '#FFFFFF' }}>
                Desa merupakan garda terdepan dalam tolak ukur perkembangan Indonesia. Sehingga
                sudah selayaknya semangat dan energi pembangunan dikerahkan dari dan oleh pedesaan.
                Sebab dengan memulai dari desa, seluruh lapisan masyarakat akan dapat merasakan
                dampak dan kebaikan dari pembangunan. Kini sudah saatnya para insan terdidik
                bergerak aktif mengambil peran.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
