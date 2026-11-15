/**
 * Kerangka ringkas untuk sisi teka-teki sebelum data dan papan selesai dimuat.
 * Diletakkan dalam kolom kanan di sebelah bagian rating pada halaman Landing.
 */
export default function KerangkaTekaTekiHarian() {
  return (
    <section
      aria-hidden="true"
      data-testid="kerangka-teka-teki-harian"
      className="w-full min-w-0"
    >
      <div className="flex flex-col gap-y-6">
        <header className="flex flex-col gap-y-3">
          <div className="h-4 w-32 animate-pulse bg-grey-200" />
          <div className="h-8 w-3/4 animate-pulse bg-grey-200" />
          <div className="h-5 w-full animate-pulse bg-grey-200" />
        </header>
        <div className="grid gap-6 xl:grid-cols-12">
          <div className="aspect-square w-full animate-pulse border border-grey-200 bg-grey-50 xl:col-span-7" />
          <div className="flex flex-col gap-y-5 xl:col-span-5">
            <div className="h-24 animate-pulse bg-grey-200" />
            <div className="mx-auto size-44 animate-pulse rounded-full bg-grey-200" />
            <div className="h-16 animate-pulse bg-grey-200" />
          </div>
        </div>
      </div>
    </section>
  );
}
