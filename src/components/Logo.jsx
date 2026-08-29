/**
 * Logo resmi Komunitas Catur Indonesia — mark transparan (tanpa disc).
 * variant "light" = kuda putih + wordmark putih (header di atas hero)
 * variant "dark"  = kuda navy + wordmark gelap (header scroll, footer, drawer)
 */
import { sumberGambar } from "../lib/asets.js";

const SIZES = {
  sm: 40,
  md: 52,
  lg: 168,
};

export default function Logo({
  variant = "dark",
  className = "",
  size = "md",
  showWordmark = true,
  priority = false,
}) {
  const px = SIZES[size] || SIZES.md;
  const light = variant === "light";
  const jalur = light ? "/images/logo-mark-light.png" : "/images/logo-mark-dark.png";
  // Mark aslinya 336×336 (± 14 KiB) untuk boks 52–91 px saja. Varian 200w
  // dari manifest cukup untuk retina, jadi header tidak mengunduh gambar
  // empat kali lebih besar dari kotak yang menampilkannya.
  const sumber = sumberGambar(jalur, { sizes: `${px * 2}px` });

  return (
    <span className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src={sumber.src}
        srcSet={sumber.srcSet}
        sizes={sumber.sizes}
        alt=""
        width={px}
        height={px}
        draggable="false"
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchpriority={priority ? "high" : "auto"}
        className="flex-none object-contain"
        style={{ width: px, height: px }}
      />
      {showWordmark && (
        <span
          className={`flex flex-col leading-none ${
            light ? "text-white" : "text-slate-900"
          }`}
        >
          <span className="font-extrabold tracking-wide text-[15px] md:text-[17px]">
            KOMUNITAS CATUR
          </span>
          <span className="font-semibold tracking-[0.3em] text-[9px] md:text-[10px] mt-[5px]">
            INDONESIA
          </span>
        </span>
      )}
    </span>
  );
}
