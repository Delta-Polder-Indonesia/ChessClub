/**
 * Lencana gelar catur (GM, IM, FM, CM, WGM, WIM, WFM, WCM, NM, AGM, …).
 *
 * Gelar ditulis sebagai SVG, bukan teks ber-border, supaya bentuknya identik
 * di semua peramban dan tidak bergantung pada font yang kebetulan tersedia:
 * kotak sudut membulat dengan huruf putih tebal di atasnya.
 *
 * Semua gelar memakai satu warna (#A62424) seperti lencana gelar pada
 * antarmuka catur pada umumnya — gelar dibedakan oleh hurufnya, bukan oleh
 * warna yang berbeda-beda. Bila suatu saat perlu warna per tingkat
 * (mis. GM emas), tambahkan pemetaannya di `WARNA_GELAR`.
 */

/** Warna latar lencana. Satu warna untuk seluruh gelar. */
const WARNA_LATAR = "#A62424";

/** Warna huruf — putih agar kontras 4.5:1 terhadap #A62424. */
const WARNA_TEKS = "#FFFFFF";

/** Keluarga huruf mengikuti tumpukan sans sistem, tanpa ketergantungan font. */
const HURUF =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Ukuran huruf menurut panjang gelar. Kotaknya tetap 400×250 unit, jadi
 * gelar tiga huruf (WGM, WIM, WFM, WCM) tidak meluber keluar lencana.
 */
function ukuranHuruf(panjang) {
  if (panjang <= 2) return 140;
  if (panjang === 3) return 112;
  return 92;
}

/*
 * Geser turun sepertiga tinggi huruf kapital agar tinta huruf benar-benar
 * berada di tengah kotak.
 *
 * `dominant-baseline="middle"` menengahkan kotak em, bukan tinggi huruf
 * kapital (cap height), sehingga huruf duduk ~13 unit (5% tinggi lencana)
 * terlalu tinggi — terukur dari piksel tinta pada berkas SVG yang
 * dirasterisasi. Karena posisinya dinyatakan dalam `em`, hasilnya tetap
 * seimbang di font apa pun (bedanya < 1,5% tinggi huruf antar font sans).
 */
const GESER_TENGAH = "0.37em";

/**
 * Lencana gelar satu pemain.
 *
 * Mengembalikan `null` bila gelar kosong, sehingga pemanggil cukup menulis
 * `{gelar ? <LencanaGelar gelar={gelar} /> : null}` — atau langsung
 * `<LencanaGelar gelar={kartu?.title} />` tanpa pengecekan.
 */
export default function LencanaGelar({ gelar, className = "h-[1.05rem] w-auto shrink-0" }) {
  const bersih = String(gelar ?? "").trim().toUpperCase();
  if (!bersih) return null;

  const font = ukuranHuruf(bersih.length);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 250"
      className={className}
      role="img"
      aria-label={bersih}
      data-uji="lencana-gelar"
      data-gelar={bersih}
    >
      <title>{bersih}</title>
      <rect x="0" y="0" width="400" height="250" rx="50" ry="50" fill={WARNA_LATAR} />
      <text
        x="200"
        y="125"
        dy={GESER_TENGAH}
        fontFamily={HURUF}
        fontSize={font}
        fontWeight="bold"
        fill={WARNA_TEKS}
        textAnchor="middle"
      >
        {bersih}
      </text>
    </svg>
  );
}
