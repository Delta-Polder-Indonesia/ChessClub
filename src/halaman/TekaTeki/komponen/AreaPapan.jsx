/**
 * Area papan: profil pemain (hitam/putih), bilah evaluasi, papan, dan label
 * level/rating soal. Murni presentasi — tidak memegang state.
 *
 * KONTRAK TATA LETAK (dikunci uji `uji-teka-teki-regresi`):
 *
 *   [ baris profil atas ]   ← track `auto`, tinggi miliknya sendiri
 *   [ baris papan       ]   ← track `minmax(0, 1fr)`, TINGGINYA PASTI
 *   [ baris profil bawah ]  ← track `auto`, tinggi miliknya sendiri
 *
 * Kotak papan boleh lebih kecil dari track-nya, tetapi tidak boleh lebih besar:
 * baris papan memakai `overflow-hidden`, dan papan sendiri dibatasi dua sumbu
 * (`max-h-full` + `max-w-full`) di dalam pembungkus `aspect-square`.
 *
 * Sebelumnya tinggi baris papan tidak pernah pasti: kolom memakai `flex-col
 * justify-between`, kotak papan ditentukan lebarnya (`aspect-square`), dan
 * `max-h-full` tidak berlaku karena tinggi induknya `auto` (persentase terhadap
 * tinggi tak-tentu = diabaikan). Akibatnya papan tumbuh mengikuti lebar kolom
 * dan meluber ke baris profil — avatar serta nama pemain tampak berada DI ATAS
 * petak. Satu-satunya penahan saat itu adalah angka ajaib
 * `lg:max-w-[calc(100vh_-_106px)]`; angka itu sekarang tidak lagi menanggung
 * tata letak.
 */
import { useI18n } from "../../../lib/i18n.jsx";
import KerangkaPapan from "./KerangkaPapan.jsx";
import KerangkaBilahEvaluasi from "./KerangkaBilahEvaluasi.jsx";

export default function AreaPapan({
  papan = null,
  bilahEvaluasi = null,
  status = null,
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
    <main
      data-area="papan"
      className="flex min-w-0 flex-1 items-stretch justify-center overflow-hidden bg-[#262421] p-6"
    >
      {/* Sisakan ruang untuk padding dan dua profil; offset menyeimbangkan bilah evaluasi. */}
      {/*
       * `max-w-[720px]` hanya untuk layar sempit (kolom tunggal). Mulai `lg`
       * batas lebar dilepas: tinggi baris papan sudah menentukan ukuran papan,
       * jadi papan tetap persegi dan mengisi ruang yang benar-benar tersedia.
       */}
      <div className="flex min-h-0 w-full max-w-[720px] flex-row items-stretch gap-3 lg:max-w-none lg:-translate-x-5">
        {/* Tiga baris eksplisit: profil atas → papan → profil bawah. */}
        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-2">
          {/* ─── PROFIL PEMAIN HITAM (ATAS) ─── */}
          <div
            data-baris="profil-atas"
            className={`flex min-h-10 flex-row items-center justify-between gap-3 pl-[44px] pr-1 ${
              orientasi === "w" ? "order-1" : "order-3"
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-row items-center gap-3">
              {/* Avatar Hitam */}
              <div className="flex h-10 w-10 flex-shrink-0 flex-row items-end justify-center rounded-md bg-[#474542] shadow-md">
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
              <div className="flex min-w-0 flex-col justify-center">
                <div className="flex items-center gap-2">
                  {namaHitam ? (
                    <span className="truncate text-sm font-bold text-[#fffaec]">{namaHitam}</span>
                  ) : (
                    <span className="truncate text-sm font-bold text-[#fffaec]">
                      {t("tekaTeki.sisiHitam")}
                    </span>
                  )}
                  {eloHitam > 0 && (
                    <span className="text-xs font-medium text-gray-300">({eloHitam})</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-row items-center gap-1.5">
                  <span className="truncate text-[11px] font-medium text-gray-400">
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
            <div className="flex flex-shrink-0 flex-row items-center gap-2">
              <span className="whitespace-nowrap text-[11px] font-medium text-gray-400">
                {t("tekaTeki.levelSoal")}
              </span>
              <div className="flex h-10 min-w-[100px] items-center justify-center rounded-md border border-[#312e2b] bg-[#1e1d1c] px-3 text-sm font-bold text-nowrap shadow-inner">
                {teksTingkat ? (
                  <span className="truncate text-[#fffaec]">{teksTingkat}</span>
                ) : (
                  <span className="text-[#999]">—</span>
                )}
              </div>
            </div>
          </div>

          {/* ─── TENGAH: STATUS + BAR EVALUASI + PAPAN ─── */}
          <div
            data-baris="papan"
            className="order-2 flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden"
          >
            {/* Status gameplay tampil DI ALIRAN (bukan lapisan absolut), supaya
                tidak pernah menutupi baris profil maupun petak papan. */}
            {status ? <div className="shrink-0">{status}</div> : null}

            <div className="flex min-h-0 w-full flex-row items-stretch justify-center gap-2">
              {/* Bar Evaluasi */}
              {bilahEvaluasi ? (
                <div className="flex shrink-0 items-center justify-center self-stretch">
                  {bilahEvaluasi}
                </div>
              ) : memuat ? (
                <div className="flex shrink-0 items-center justify-center self-stretch">
                  <KerangkaBilahEvaluasi />
                </div>
              ) : (
                <div className="relative w-[30px] flex-shrink-0 overflow-hidden rounded-md bg-[#ffffff] shadow-inner">
                  {/* Bagian putih (atas) */}
                  <div
                    className="absolute top-0 left-0 right-0 bg-[#ffffff] transition-all duration-500"
                    style={{ height: "48%" }}
                  >
                    <div className="absolute bottom-1 left-0 right-0 text-center text-[9px] font-bold text-gray-700">
                      +0.3
                    </div>
                  </div>
                  {/* Bagian hitam (bawah) */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-[#312e2b] transition-all duration-500"
                    style={{ height: "52%" }}
                  >
                    <div className="absolute top-1 left-0 right-0 text-center text-[9px] font-bold text-gray-400"></div>
                  </div>
                  {/* Garis tengah */}
                  <div
                    className="absolute left-0 right-0 h-[1px] bg-gray-400/30"
                    style={{ top: "48%" }}
                  ></div>
                </div>
              )}

              {/* Papan Catur — pembungkus ber-tinggi pasti; papan dibatasi dua sumbu. */}
              <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md shadow-2xl">
                <div className="relative flex aspect-square w-full min-w-0 max-w-full items-center justify-center lg:h-full lg:w-auto lg:max-h-full">
                  {papan ? papan : memuat ? <KerangkaPapan /> : null}
                </div>
              </div>
            </div>
          </div>

          {/* ─── PROFIL PEMAIN PUTIH (BAWAH) ─── */}
          <div
            data-baris="profil-bawah"
            className={`flex min-h-10 flex-row items-center justify-between gap-3 pl-[44px] pr-1 ${
              orientasi === "w" ? "order-3" : "order-1"
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-row items-center gap-3">
              {/* Avatar Putih */}
              <div className="flex h-10 w-10 flex-shrink-0 flex-row items-end justify-center rounded-md bg-[#dbd9d6] shadow-md">
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
              <div className="flex min-w-0 flex-col justify-center">
                <div className="flex items-center gap-2">
                  {namaPutih ? (
                    <span className="truncate text-sm font-bold text-[#fffaec]">{namaPutih}</span>
                  ) : (
                    <span className="truncate text-sm font-bold text-[#fffaec]">
                      {t("tekaTeki.sisiPutih")}
                    </span>
                  )}
                  {eloPutih > 0 && (
                    <span className="text-xs font-medium text-gray-300">({eloPutih})</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-row items-center gap-1.5">
                  {teksTerpecahkan && (
                    <span className="text-[11px] font-bold text-gray-300">{teksTerpecahkan}</span>
                  )}
                </div>
              </div>
            </div>
            {/* Rating soal: label di samping kiri kotak */}
            <div className="flex flex-shrink-0 flex-row items-center gap-2">
              <span className="whitespace-nowrap text-[11px] font-medium text-gray-400">
                {t("tekaTeki.ratingSoal")}
              </span>
              <div className="flex h-10 min-w-[100px] items-center justify-center rounded-md border border-[#81b64c] bg-[#f0f0f0] px-3 font-mono text-lg font-bold text-nowrap text-[#1e1d1c] shadow ring-2 ring-[#81b64c]/40">
                {memuat ? "—" : eloSoal}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
