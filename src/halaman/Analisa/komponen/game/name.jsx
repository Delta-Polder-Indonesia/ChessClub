/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import Profile from "../svg/profile.jsx";
import CapturedPieces from "./capturedPieces.jsx";
import { maxVertical } from "../../konstanta.js";
import { useEffect, useState } from "react";
const BENDERA = import.meta.glob("/src/halaman/Analisa/komponen/flags/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
// Data kartu pemain lama di localStorage menyimpan emoji; data baru menyimpan
// kode dua huruf. Terima keduanya agar cache lama tidak membuat bendera hilang.
function kodeBendera(nilai) {
  if (!nilai) return null;
  if (/^[a-z]{2}$/i.test(nilai)) return nilai.toLowerCase();
  const huruf = [...nilai];
  if (
    huruf.length === 2 &&
    huruf.every((c) => {
      const kode = c.codePointAt(0);
      return kode >= 0x1f1e6 && kode <= 0x1f1ff;
    })
  ) {
    return huruf
      .map((c) => String.fromCharCode(c.codePointAt(0) - 0x1f1e6 + 97))
      .join("");
  }
  return null;
}
function Name(props) {
  const [profileSize, setProfileSize] = useState(40);
  const [imgError, setImgError] = useState(false);
  const { white, captured, materialAdvantage, avatar, title, flag } = props;
  const name = props.children;
  useEffect(() => {
    function resizeProfile() {
      setProfileSize(window.innerWidth < maxVertical ? 24 : 40);
    }
    resizeProfile();
    window.addEventListener("resize", resizeProfile);
    return () => window.removeEventListener("resize", resizeProfile);
  }, []);
  // Avatar baru → hapus tanda galat agar bisa dicoba lagi.
  useEffect(() => setImgError(false), [avatar]);
  const showAvatar = avatar && !imgError;
  const kode = kodeBendera(flag);
  const srcBendera = kode
    ? BENDERA[`/src/halaman/Analisa/komponen/flags/${kode}.svg`]
    : null;
  return <div className="flex flex-row items-start vertical:text-sm text-[10px] font-bold text-foregroundHighlighted vertical:gap-2 gap-[6px] flex-grow overflow-x-auto overflow-y-hidden">
            <div className={`vertical:h-11 vertical:w-11 h-7 w-7 flex flex-row justify-center items-end overflow-hidden ${white ? "bg-backgroundProfileWhite" : "bg-backgroundProfileBlack"}`}>
                {showAvatar ? (
                  <img className="h-full w-full object-cover" src={avatar} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setImgError(true)} />
                ) : (
                  <Profile width={profileSize} height={profileSize} class={`${white ? "fill-foregroundProfileWhite" : "fill-foregroundProfileBlack"}`} />
                )}
            </div>
            <div className="flex flex-col justify-between h-7 vertical:h-11">
                <span className="h-fit vertical:pb-[1px] vertical:pt-[2px] select-text text-nowrap">
                  {title ? <em className="mr-1 not-italic font-bold text-foregroundGrey">{title}</em> : null}
                  {name}
                   {srcBendera ? (
                     <img
                       src={srcBendera}
                       alt=""
                       width={16}
                       height={12}
                       className="ml-1 inline-block h-3 w-4 rounded-[2px] object-cover align-[-1px] ring-1 ring-black/20"
                       loading="lazy"
                     />
                   ) : null}
                </span>
                <CapturedPieces advantage={materialAdvantage} white={white} pieces={captured} />
            </div>
        </div>;
}
export {
  Name as default
};
