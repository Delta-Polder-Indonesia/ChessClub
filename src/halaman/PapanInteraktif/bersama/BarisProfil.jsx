import Profile from "./ikon/profile.jsx";
import TangkapanBidak from "./TangkapanBidak.jsx";

/**
 * Baris profil pemain (avatar + nama + bidak tangkapan) di atas/bawah papan.
 *
 * Dipakai empat halaman mode papan: Manusia vs Mesin, Latihan Repertoar,
 * Hand & Brain, dan Turing Test. Dulu menempel di ManusiaVsMesin.jsx dan
 * diimpor tiga mode lain dari sana; dipindah ke sini agar tiap mode punya
 * rumah sendiri tanpa mengimpor dari rumah mode lain.
 */
export function BarisProfil({ nama, putih, tangkapan, setBidak, avatar, namaDiBawah = false, className = "" }) {
  const labelNama = (
    <span
      className={`truncate text-sm font-bold text-[#fffaec] ${namaDiBawah ? "leading-tight" : ""}`}
    >
      {nama}
    </span>
  );
  const labelTangkapan = (
    <div className="flex min-h-[15px] items-center overflow-hidden">
      <TangkapanBidak daftar={tangkapan} set={setBidak} />
    </div>
  );
  return (
    <div className={`flex items-center justify-between gap-3 pl-[42px] pr-1 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-end justify-center overflow-hidden rounded-md shadow-md ${
            putih ? "bg-[#dbd9d6]" : "bg-[#474542]"
          }`}
        >
          {avatar ? (
            <img src={avatar} alt="" width={32} height={32} className="h-8 w-8 object-contain" loading="lazy" />
          ) : (
            <Profile height={32} width={32} class={putih ? "fill-[#ffffff]" : "fill-[#1d1c1a]"} />
          )}
        </div>
        <div className={`flex min-w-0 flex-col ${namaDiBawah ? "justify-end" : "justify-center"}`}>
          {namaDiBawah ? labelTangkapan : labelNama}
          {namaDiBawah ? labelNama : labelTangkapan}
        </div>
      </div>
    </div>
  );
}
