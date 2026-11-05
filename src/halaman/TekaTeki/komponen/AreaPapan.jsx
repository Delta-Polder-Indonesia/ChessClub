/**
 * Area papan: profil pemain (hitam/putih), bilah evaluasi, papan, dan label
 * level/rating soal. Murni presentasi — tidak memegang state.
 */
import { useI18n } from "../../../lib/i18n.jsx";
import KerangkaPapan from "./KerangkaPapan.jsx";
import KerangkaBilahEvaluasi from "./KerangkaBilahEvaluasi.jsx";

export default function AreaPapan({
  papan = null,
  bilahEvaluasi = null,
  orientasi = "w",
  memuat = false,
  jumlahLangkah = 1,
  bukanSkakmat = false,
  teksTingkat = "",
  teksTerpecahkan = "",
  eloSoal = 1500,
  namaHitam = "",
  eloHitam = 0,
  namaPutih = "",
  eloPutih = 0,
}) {
  const { t } = useI18n();
  return (
    <main data-area="papan" className="flex-1 flex items-stretch justify-center p-6 bg-[#262421] min-w-0 overflow-hidden">
    {/* Sisakan ruang untuk padding dan dua profil; offset menyeimbangkan bilah evaluasi. */}
    <div className="flex flex-row items-stretch gap-3 w-full max-w-[720px] lg:max-w-[calc(100vh_-_106px)] lg:-translate-x-5 min-h-0">

    {/* Kolom kiri setinggi panel: profil atas → papan → profil bawah */}
    <div className="flex-1 flex min-h-0 min-w-0 flex-col justify-between">

    {/* ─── PROFIL PEMAIN HITAM (ATAS) ─── */}
    <div className={`relative z-10 flex flex-row justify-between items-center pl-[44px] pr-1 flex-shrink-0 ${orientasi === "w" ? "order-1" : "order-3"}`}>
    <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
    {/* Avatar Hitam */}
    <div className="h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end bg-[#474542] rounded-md shadow-md">
      <svg className="scale-x-[1.15]" height="32" width="32" viewBox="0 0 512 512">
        <path className="fill-[#1d1c1a]" d="M359.51,367.614c-19.106-7.148-40.877-18.276-40.877-32.676c0-9.533,0-21.444,0-37.782
        c6.996-19.393,17.51-20.781,22.768-50.546c12.254-4.379,19.258-11.384,28.009-42.026c6.574-23.064-3.112-29.254-9.382-30.905
        c0.128-1.229,0.256-2.466,0.359-3.917c2.369-34.543,22.425-137.078-47.012-149.332c-18.38-14.296-30.043-20.774-69.437-18.38
        C219.001,2.042,200.046,7.547,173.632,0c-35.245,29.565-25.561,126.66-20.63,173.504c-6.199,1.388-16.889,7.148-10.052,31.08
        c8.744,30.641,15.748,37.646,28.001,42.026c5.258,29.765,21.252,39.322,22.417,50.546c0,16.338,0,28.248,0,37.782
        c0,14.4-23.494,26.55-40.877,32.676C119.058,379.397,25.911,414.275,34.073,512h443.856
        C486.09,414.275,392.712,380.035,359.51,367.614z" />
      </svg>
    </div>
    <div className="flex flex-col justify-center min-w-0">
      <div className="flex items-center gap-2">
        {namaHitam ? (
          <span className="text-sm font-bold text-[#fffaec] truncate">{namaHitam}</span>
        ) : (
          <span className="text-sm font-bold text-[#fffaec] truncate">{t("tekaTeki.sisiHitam")}</span>
        )}
        {eloHitam > 0 && (
          <span className="text-xs text-gray-300 font-medium">({eloHitam})</span>
        )}
      </div>
      <div className="flex flex-row items-center gap-1.5 mt-0.5">
        <span className="text-[11px] text-gray-400 font-medium truncate">
          {memuat
            ? "—"
            : bukanSkakmat
              ? t("tekaTeki.taktikDalamN", { n: jumlahLangkah })
              : t("tekaTeki.skakDalamN", { n: jumlahLangkah })}
        </span>
      </div>
    </div>
    </div>
    {/* Level soal: label di samping kiri kotak */}
    <div className="flex flex-row items-center gap-2 flex-shrink-0">
    <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t("tekaTeki.levelSoal")}</span>
    <div className="flex text-nowrap justify-center items-center h-10 min-w-[100px] px-3 rounded-md bg-[#1e1d1c] text-sm font-bold shadow-inner border border-[#312e2b]">
      {teksTingkat ? (
        <span className="text-[#fffaec] truncate">{teksTingkat}</span>
      ) : (
        <span className="text-[#999]">—</span>
      )}
    </div>
    </div>
    </div>

    {/* ─── TENGAH: BAR EVALUASI + PAPAN (mengisi sisa tinggi) ─── */}
    <div className="order-2 flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
    <div className="flex w-full flex-row items-stretch gap-2">
    {/* Bar Evaluasi */}
    {bilahEvaluasi ? (
    <div className="self-stretch flex items-center justify-center">
      {bilahEvaluasi}
    </div>
    ) : memuat ? (
    <div className="self-stretch flex items-center justify-center">
      <KerangkaBilahEvaluasi />
    </div>
    ) : (
    <div className="w-[30px] flex-shrink-0 rounded-md overflow-hidden relative bg-[#ffffff] shadow-inner">
      {/* Bagian putih (atas) */}
      <div className="absolute top-0 left-0 right-0 bg-[#ffffff] transition-all duration-500" style={{ height: "48%" }}>
        <div className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-gray-700">
          +0.3
        </div>
      </div>
      {/* Bagian hitam (bawah) */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#312e2b] transition-all duration-500" style={{ height: "52%" }}>
        <div className="absolute top-1 left-0 right-0 text-center text-[9px] font-bold text-gray-400">
        </div>
      </div>
      {/* Garis tengah */}
      <div className="absolute left-0 right-0 h-[1px] bg-gray-400/30" style={{ top: "48%" }}></div>
    </div>
    )}

    {/* Papan Catur */}
    <div className="relative aspect-square max-h-full max-w-full min-h-0 min-w-0 flex-1 shadow-2xl rounded-md overflow-hidden">
    {(papan || memuat) ? (
      papan
    ) : memuat ? (
      <KerangkaPapan />
    ) : null}
    </div>
    </div>
    </div>

    {/* ─── PROFIL PEMAIN PUTIH (BAWAH) ─── */}
    <div className={`relative z-10 flex flex-row justify-between items-center pl-[44px] pr-1 flex-shrink-0 ${orientasi === "w" ? "order-3" : "order-1"}`}>
    <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
    {/* Avatar Putih */}
    <div className="h-10 w-10 flex-shrink-0 flex flex-row justify-center items-end bg-[#dbd9d6] rounded-md shadow-md">
      <svg className="scale-x-[1.15]" height="32" width="32" viewBox="0 0 512 512">
        <path className="fill-[#ffffff]" d="M359.51,367.614c-19.106-7.148-40.877-18.276-40.877-32.676c0-9.533,0-21.444,0-37.782
        c6.996-19.393,17.51-20.781,22.768-50.546c12.254-4.379,19.258-11.384,28.009-42.026c6.574-23.064-3.112-29.254-9.382-30.905
        c0.128-1.229,0.256-2.466,0.359-3.917c2.369-34.543,22.425-137.078-47.012-149.332c-18.38-14.296-30.043-20.774-69.437-18.38
        C219.001,2.042,200.046,7.547,173.632,0c-35.245,29.565-25.561,126.66-20.63,173.504c-6.199,1.388-16.889,7.148-10.052,31.08
        c8.744,30.641,15.748,37.646,28.001,42.026c5.258,29.765,21.252,39.322,22.417,50.546c0,16.338,0,28.248,0,37.782
        c0,14.4-23.494,26.55-40.877,32.676C119.058,379.397,25.911,414.275,34.073,512h443.856
        C486.09,414.275,392.712,380.035,359.51,367.614z" />
      </svg>
    </div>
    <div className="flex flex-col justify-center min-w-0">
      <div className="flex items-center gap-2">
        {namaPutih ? (
          <span className="text-sm font-bold text-[#fffaec] truncate">{namaPutih}</span>
        ) : (
          <span className="text-sm font-bold text-[#fffaec] truncate">{t("tekaTeki.sisiPutih")}</span>
        )}
        {eloPutih > 0 && (
          <span className="text-xs text-gray-300 font-medium">({eloPutih})</span>
        )}
      </div>
      <div className="flex flex-row items-center gap-1.5 mt-0.5">
        {teksTerpecahkan && (
          <span className="text-[11px] font-bold text-gray-300">{teksTerpecahkan}</span>
        )}
      </div>
    </div>
    </div>
    {/* Rating soal: label di samping kiri kotak */}
    <div className="flex flex-row items-center gap-2 flex-shrink-0">
    <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">{t("tekaTeki.ratingSoal")}</span>
    <div className="flex text-nowrap justify-center items-center h-10 min-w-[100px] px-3 rounded-md bg-[#f0f0f0] text-[#1e1d1c] text-lg font-mono font-bold shadow border border-[#81b64c] ring-2 ring-[#81b64c]/40">
      {memuat ? "—" : eloSoal}
    </div>
    </div>
    </div>
    </div>

    </div>
    </main>
  );
}
