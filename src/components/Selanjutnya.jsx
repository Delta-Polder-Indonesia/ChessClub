import { ArrowRightIcon } from "./icons.jsx";

/**
 * Navigasi halaman berikutnya — identik dengan blok "Selanjutnya" Pertamina.
 */
export default function Selanjutnya() {
  return (
    <section className="w-full relative bg-transparent pl-6 md:pl-0 xl:pl-40 pr-6 md:pr-0 xl:pr-40 pb-24 md:pb-24 xl:pb-24 pt-6 md:pt-8 xl:pt-12">
      <div className="relative w-full mx-auto lg:max-w-[960px] xl:max-w-[1280px]">
        <div className="w-full border-t my-1 md:my-1 border-grey-200" />
        <nav>
          <a
            href="#"
            className="flex items-center justify-between gap-4 py-8 group"
          >
            <div className="flex flex-col">
              <span
                id="next-label"
                className="text-xs sm:text-sm text-gray-600"
              >
                Selanjutnya
              </span>
              <span className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary transition-colors duration-200">
                Dewan Pengurus dan Dewan Pembina
              </span>
            </div>
            <div className="flex-none flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-all duration-200">
              <ArrowRightIcon />
            </div>
          </a>
        </nav>
      </div>
    </section>
  );
}
