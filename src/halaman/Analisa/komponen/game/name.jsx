/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
import Profile from "../svg/profile.jsx";
import CapturedPieces from "./capturedPieces.jsx";
import { maxVertical } from "../../konstanta.js";
import { useEffect, useState } from "react";
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
                  {flag ? <span className="ml-1">{flag}</span> : null}
                </span>
                <CapturedPieces advantage={materialAdvantage} white={white} pieces={captured} />
            </div>
        </div>;
}
export {
  Name as default
};
