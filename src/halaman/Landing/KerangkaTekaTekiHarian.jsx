/**
 * Kerangka dengan geometri yang sama seperti seksi teka-teki harian.
 * Berkas kecil ini diimpor terpisah dari komponen interaktif sehingga bisa
 * dirender sebagai fallback Suspense sebelum chunk papan catur terunduh.
 */
export default function KerangkaTekaTekiHarian() {
  return (
    <section
      aria-hidden="true"
      data-testid="kerangka-teka-teki-harian"
      className="w-full pl-6 md:pl-8 pr-6 md:pr-8 pb-12 xl:pb-16 pt-12 xl:pt-16 overflow-hidden"
    >
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="grid items-center gap-x-6 gap-y-10 xl:grid-cols-12 xl:gap-x-8">
          <div className="xl:col-span-3 xl:min-h-[440px] flex flex-col justify-center gap-y-6">
            <div className="h-8 w-3/4 rounded bg-grey-200 animate-pulse" />
            <div className="h-6 w-1/2 rounded bg-grey-200 animate-pulse" />
            <div className="mx-auto h-40 w-40 rounded-full bg-grey-200 animate-pulse" />
            <div className="h-12 w-full rounded bg-grey-200 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-grey-200 animate-pulse" />
          </div>
          <div className="xl:col-span-6 flex justify-center">
            <div className="aspect-square w-full max-w-lg rounded-lg border border-grey-200 bg-grey-50 animate-pulse" />
          </div>
          <div className="xl:col-span-3 xl:min-h-[440px] flex flex-col justify-center gap-y-7">
            <div className="h-6 w-1/3 rounded bg-grey-200 animate-pulse" />
            <div className="h-8 w-2/3 rounded bg-grey-200 animate-pulse" />
            <div className="h-6 w-full rounded bg-grey-200 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
