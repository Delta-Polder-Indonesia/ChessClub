export default function Marquee({ items, ringan = false }) {
  const isi = (sandi) =>
    items.map((item) => (
      <span
        key={sandi + item}
        className="mx-4 inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-700"
      >
        <svg
          className="h-3 w-3 shrink-0 text-slate-400"
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="m9.715 1.975 5.993 9.997c.799 1.333-.161 3.028-1.716 3.028H2.008C.453 15-.507 13.305.292 11.972l5.993-9.997C7.06.68 8.939.68 9.715 1.975M8 3.004 2.008 13h11.985zM8 10.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2m0-5a1.04 1.04 0 0 1 1.009 1.29l-.036.114L8 10.5l-.973-3.596A1.04 1.04 0 0 1 8 5.5"
          />
        </svg>
        {item}
      </span>
    ));

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex w-full overflow-hidden ${
        ringan ? "" : "border-y border-slate-200 bg-white"
      }`}
    >
      <div
        className={`animate-marquee flex w-max items-center whitespace-nowrap ${
          ringan ? "" : "py-1.5"
        }`}
      >
        {isi("a1-")}
        {isi("a2-")}
      </div>

      <div
        aria-hidden="true"
        className={`animate-marquee2 absolute left-0 top-0 flex w-max items-center whitespace-nowrap ${
          ringan ? "" : "py-1.5"
        }`}
      >
        {isi("b1-")}
        {isi("b2-")}
      </div>
    </div>
  );
}