/**
 * Area papan: profil pemain (hitam/putih), bilah evaluasi, papan, dan label
 * level/rating soal. Murni presentasi — tidak memegang state.
 *
 * KONTRAK TATA LETAK (dikunci uji `uji-teka-teki-regresi`):
 *
 *   kolom 1 (2.25rem) │ kolom 2 (papan + profil)
 *   ──────────────────┼──────────────────────────
 *   baris 1 auto      │  profil atas
 *   baris 2 1fr       │  [bilah] papan   ← tinggi PASTI
 *   baris 3 auto      │  profil bawah
 *
 * Kolom 1 hanya MENYEDIAKAN ruang selebar bilah; elemen bilahnya sendiri
 * diikat ke kotak papan dengan `absolute inset-y-0 right-full mr-2`. Dengan
 * begitu tinggi bilah SELALU sama dengan tinggi papan (bukan tinggi track
 * baris, yang bisa lebih tinggi saat papan dibatasi lebar) dan jaraknya ke
 * papan selalu `gap-2`.
 *
 * Baris profil duduk di KOLOM YANG SAMA dengan papan, jadi lebarnya selalu
 * sama dengan lebar papan (`w-0 min-w-full`: tidak menyumbang lebar intrinsik,
 * tetapi mengisi penuh kolom).
 *
 * Kotak papan boleh lebih kecil dari track-nya, tetapi tidak boleh lebih besar:
 * baris papan memakai track `minmax(0,1fr)`, dan papan sendiri dibatasi dua
 * sumbu (`max-h-full` + `max-w-full`) di dalam pembungkus `aspect-square`.
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
      className="flex min-w-0 flex-1 items-stretch justify-center overflow-hidden bg-[#262421] p-6 lg:[container-type:size]"
    >
      {/*
       * `--sisi-papan` = sisi papan terbesar yang muat di area: lebar area
       * dikurangi kolom bilah (2.25rem) + jarak (0.5rem), dan tinggi area
       * dikurangi dua baris profil (2×2.5rem) + dua jarak (2×0.5rem). Angka
       * itu bukan angka ajaib viewport — ia penjumlahan token yang sama
       * dengan markup di bawah (`w-9`, `gap-2`, `min-h-10`), dan satuannya
       * `cqw`/`cqh` milik AREA ini (`[container-type:size]`), bukan `vh`.
       *
       * Kolom papan memakai panjang itu, bukan `1fr`, supaya baris profil
       * selalu selebar papan — juga saat papan dibatasi tinggi (layar lebar
       * pendek), yang dulu membuat profil lebih lebar daripada papan.
       */}
      <div className="grid min-h-0 w-full max-w-[720px] grid-cols-[2.25rem_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] gap-2 lg:w-fit lg:max-w-none lg:grid-cols-[2.25rem_var(--sisi-papan)] lg:[--sisi-papan:min(calc(100cqw-2.75rem),calc(100cqh-6rem))]">
          {/* ─── PROFIL PEMAIN HITAM (ATAS) ─── */}
          <div
            data-baris="profil-atas"
            className={`col-start-2 flex min-h-10 w-0 min-w-full flex-row items-center justify-between gap-3 overflow-hidden pr-1 ${
              orientasi === "w" ? "row-start-1" : "row-start-3"
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
                <div className="flex min-w-0 items-center gap-2">
                  {namaHitam ? (
                    <span className="truncate text-sm font-bold text-[#fffaec]">{namaHitam}</span>
                  ) : (
                    <span className="truncate text-sm font-bold text-[#fffaec]">
                      {t("tekaTeki.sisiHitam")}
                    </span>
                  )}
                  {eloHitam > 0 && (
                    <span className="shrink-0 text-xs font-medium text-gray-300">({eloHitam})</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-row items-center gap-1.5">
                  <span className="min-w-0 truncate text-[11px] font-medium text-gray-400">
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
              <span className="hidden whitespace-nowrap text-[11px] font-medium text-gray-400 sm:inline">
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

          {/*
           * Kolom 1 sengaja kosong: ia hanya menyediakan ruang selebar bilah
           * (2.25rem) + `gap-2` agar bilah punya tempat sendiri tanpa mengurangi
           * lebar papan. Elemen bilahnya sendiri diikat ke kotak papan di bawah.
           */}

          {/* Baris papan: status (di aliran) + papan. Lebar kolom = lebar papan. */}
          <div
            data-baris="papan"
            className="col-start-2 row-start-2 flex min-h-0 min-w-0 flex-col"
          >
            {/* Status gameplay tampil DI ALIRAN (bukan lapisan absolut), supaya
                tidak pernah menutupi baris profil maupun petak papan.
                `has-[>div>div]:mb-2` = jarak ke papan hanya muncul saat wilayah
                status benar-benar memuat chip pesan (anak kedua). Wilayah
                `aria-live`-nya SELALU terpasang meski kosong; kalau jaraknya
                dipasang tetap, ia menyisakan 8px kosong di atas papan dan papan
                tampak turun dari titik tengah baris. */}
            {status ? (
              <div className="w-0 min-w-full shrink-0 has-[>div>div]:mb-2">{status}</div>
            ) : null}

            {/*
             * Dua lapis, dan keduanya punya tugas:
             *  - lapis luar (`lg:h-full lg:w-auto`) memutuskan dimensi mana yang
             *    mengalah saat ruang tidak simetris: tinggi dulu, lalu lebar;
             *  - lapis dalam (`aspect-square w-full`) adalah KOTAK PAPAN yang
             *    sebenarnya — selalu persis sebesar papan yang dirender, karena
             *    keduanya memakai aturan yang sama (`w-full aspect-square`) di
             *    dalam wadah yang sama. Bilah evaluasi diikat ke lapis ini,
             *    sehingga tingginya tidak pernah mengikuti tinggi track.
             */}
            <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center rounded-md shadow-2xl">
              <div className="relative flex aspect-square w-full min-w-0 max-w-full items-center justify-center lg:h-full lg:w-auto lg:max-h-full">
                <div className="relative flex aspect-square w-full min-w-0 max-w-full items-center justify-center">
                  {/*
                   * Bilah evaluasi DIKAT ke kotak papan (bukan ke track baris):
                   * `inset-y-0` membuat tingginya selalu sama dengan tinggi papan,
                   * `right-full` + `mr-2` menempelkannya tepat di kiri papan
                   * dengan jarak `gap-2`, dan ia mengisi kolom 1 (2.25rem) yang
                   * sudah disediakan grid.
                   */}
                  <div className="absolute inset-y-0 right-full mr-2 flex w-9 shrink-0 flex-col justify-center">
                    {bilahEvaluasi ? (
                      bilahEvaluasi
                    ) : memuat ? (
                      <KerangkaBilahEvaluasi />
                    ) : (
                      /* Cadangan netral 50/50 bila halaman tidak mengirim bilah. */
                      <div
                        data-bilah-evaluasi="true"
                        className="relative flex h-full w-9 flex-col overflow-hidden rounded-sm bg-[#403d39]"
                      >
                        <div className="h-1/2 w-full bg-[#f0f0f0]" />
                        <div className="h-1/2 w-full bg-[#312e2b]" />
                      </div>
                    )}
                  </div>
                  {papan ? papan : memuat ? <KerangkaPapan /> : null}
                </div>
              </div>
            </div>
          </div>

          {/* ─── PROFIL PEMAIN PUTIH (BAWAH) ─── */}
          <div
            data-baris="profil-bawah"
            className={`col-start-2 flex min-h-10 w-0 min-w-full flex-row items-center justify-between gap-3 overflow-hidden pr-1 ${
              orientasi === "w" ? "row-start-3" : "row-start-1"
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
                <div className="flex min-w-0 items-center gap-2">
                  {namaPutih ? (
                    <span className="truncate text-sm font-bold text-[#fffaec]">{namaPutih}</span>
                  ) : (
                    <span className="truncate text-sm font-bold text-[#fffaec]">
                      {t("tekaTeki.sisiPutih")}
                    </span>
                  )}
                  {eloPutih > 0 && (
                    <span className="shrink-0 text-xs font-medium text-gray-300">({eloPutih})</span>
                  )}
                </div>
                <div className="mt-0.5 flex flex-row items-center gap-1.5">
                  {teksTerpecahkan && (
                    <span className="truncate text-[11px] font-bold text-gray-300">{teksTerpecahkan}</span>
                  )}
                </div>
              </div>
            </div>
            {/* Rating soal: label di samping kiri kotak */}
            <div className="flex flex-shrink-0 flex-row items-center gap-2">
              <span className="hidden whitespace-nowrap text-[11px] font-medium text-gray-400 sm:inline">
                {t("tekaTeki.ratingSoal")}
              </span>
              <div className="flex h-10 min-w-[100px] items-center justify-center rounded-md border border-[#81b64c] bg-[#f0f0f0] px-3 font-mono text-lg font-bold text-nowrap text-[#1e1d1c] shadow ring-2 ring-[#81b64c]/40">
                {memuat ? "—" : eloSoal}
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}
