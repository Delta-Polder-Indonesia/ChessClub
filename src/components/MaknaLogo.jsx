import Logo from "./Logo.jsx";

export default function MaknaLogo() {
  return (
    <section id="makna-logo" className="w-full relative bg-transparent">
      {/* Teks Makna Logo */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-40 pr-6 md:pr-8 xl:pr-40 pb-16 md:pb-16 xl:pb-16 ml-0 mr-0">
        <div className="relative w-full mx-auto md:max-w-[1024px] flex flex-col gap-y-6 md:gap-y-8 lg:gap-y-10">
          <h2 className="focus:outline-none focus:ring-0 font-semibold text-3xl md:text-3xl text-black">
            Makna Logo
          </h2>
          <div className="relative w-full overflow-x-auto xl:overflow-x-visible">
            <div className="relative z-[1] prose-kci max-w-none">
              <p>Makna dari logo Komunitas Catur Indonesia adalah:</p>
              <ol>
                <li>
                  Warna biru memiliki arti andal, dapat dipercaya, dan
                  bertanggung jawab
                </li>
                <li>
                  Warna merah memiliki arti keuletan dan ketegasan serta
                  keberanian dalam menghadapi berbagai macam kesulitan
                </li>
                <li>
                  Warna hijau memiliki arti pembinaan yang berwawasan
                  sportivitas dan berkelanjutan
                </li>
              </ol>
              <p>Simbol grafis memiliki arti:</p>
              <ol>
                <li>
                  Bentuk kuda catur menggambarkan aspirasi komunitas untuk
                  senantiasa bergerak maju dengan langkah yang cerdas, gesit, dan
                  terukur
                </li>
                <li>
                  Tiga elemen berwarna melambangkan tiga pilar komunitas:
                  pembinaan, pertandingan, dan prestasi yang menjadi satu
                  kesatuan gerakan catur Indonesia
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Blok logo */}
      <div className="w-full relative pl-6 md:pl-8 xl:pl-20 pr-6 md:pr-8 xl:pr-20 pb-24 md:pb-24 xl:pb-24">
        <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px] border-guide flex flex justify-center items-center">
          <div className="flex flex-col justify-center items-center">
            <div className="border border-slate-200 rounded-xl px-10 py-8 bg-white">
              <Logo variant="dark" />
            </div>
            <p className="text-sm font-normal text-gray-500 mt-2">
              Logo resmi Komunitas Catur Indonesia.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
