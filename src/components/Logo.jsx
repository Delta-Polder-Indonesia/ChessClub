/**
 * Logo Komunitas Catur Indonesia
 * Kuda catur (biru) + surai (merah) + alas (hijau)
 * variant "light" = kuda putih untuk latar gelap, "dark" = kuda biru untuk latar terang
 */
export default function Logo({ variant = "dark", className = "" }) {
  const knight = variant === "light" ? "#FFFFFF" : "#0B2F9F";
  const eye = variant === "light" ? "#0B2F9F" : "#FFFFFF";
  return (
    <span className={`flex items-center gap-3 select-none ${className}`}>
      <svg
        width="40"
        height="48"
        viewBox="0 0 40 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Alas (hijau): pembinaan yang berkelanjutan */}
        <rect x="2" y="40" width="36" height="6" rx="3" fill="#00A651" />
        {/* Leher */}
        <path d="M16 40 L16 24 C16 24 23 25 25 23 L25 40 Z" fill={knight} />
        {/* Kepala */}
        <circle cx="14" cy="13" r="9" fill={knight} />
        {/* Moncong */}
        <rect x="4" y="9" width="13" height="8" rx="4" fill={knight} />
        {/* Telinga */}
        <rect x="11.5" y="1.5" width="3.5" height="7.5" rx="1.75" fill={knight} />
        <rect x="17.5" y="2.5" width="3.5" height="6.5" rx="1.75" fill={knight} />
        {/* Surai (merah): keuletan dan keberanian */}
        <circle cx="21.5" cy="12" r="3.4" fill="#D52B1E" />
        <circle cx="22.5" cy="19" r="3" fill="#D52B1E" />
        <circle cx="22.5" cy="26" r="2.6" fill="#D52B1E" />
        {/* Mata */}
        <circle cx="11" cy="12" r="1.5" fill={eye} />
      </svg>
      <span
        className={`flex flex-col leading-none ${
          variant === "light" ? "text-white" : "text-slate-900"
        }`}
      >
        <span className="font-extrabold tracking-wide text-[15px] md:text-[17px]">
          KOMUNITAS CATUR
        </span>
        <span className="font-semibold tracking-[0.3em] text-[9px] md:text-[10px] mt-[5px]">
          INDONESIA
        </span>
      </span>
    </span>
  );
}
