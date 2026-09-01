/* Port dari Brilliant-Chess (MIT, © 2025 Delo) — jangan sunting massal tanpa cek README. */
/**
 * Kalimat pembuka panel "Langkah" (mis. “Andini mengklaim kemenangan…”).
 *
 * upstream menyimpan teksnya di berkas ini dan menyuntik nama pemain lewat
 * placeholder __WINNER__/__LOSER__. Teksnya sekarang hidup di kamus
 * terjemahan (analisa.komentarPartai.*), jadi fungsi ini menerima `t` dari
 * pemanggil, memilih varian acak, dan mengisi placeholder {menang}/{kalah}.
 *
 * Nama pemain dibungkus <span> tebal — sengaja, karena pemanggil merender
 * hasilnya dengan dangerouslySetInnerHTML; nilai yang disisipkan sudah
 * di-escape lebih dulu lewat `escapeHtml` agar PGN pihak ketiga tidak bisa
 * menyuntik markup.
 */

const JUMLAH_VARIAN = 4;
const TEBAL_AWAL = '<span class="font-extrabold" style="color: var(--foregroundBlackDark);">';
const TEBAL_AKHIR = "</span>";

function escapeHtml(teks) {
  return String(teks ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function tebakUrutan(putih, hitam) {
  return Math.random() < 0.5 ? [putih, hitam] : [hitam, putih];
}

export default function getOverallGameComment(playerNames, result, t) {
  const [white = "", black = ""] = playerNames ?? [];
  const acak = Math.floor(Math.random() * JUMLAH_VARIAN);

  let kunci;
  let menang;
  let kalah;
  switch (result) {
    case "1-0":
      [kunci, menang, kalah] = ["menang", white, black];
      break;
    case "0-1":
      [kunci, menang, kalah] = ["menang", black, white];
      break;
    case "1/2-1/2":
      [kunci, menang, kalah] = ["seri", ...tebakUrutan(white, black)];
      break;
    default:
      [kunci, menang, kalah] = ["netral", ...tebakUrutan(white, black)];
  }

  return t(`analisa.komentarPartai.${kunci}.${acak}`, {
    menang: TEBAL_AWAL + escapeHtml(menang) + TEBAL_AKHIR,
    kalah: TEBAL_AWAL + escapeHtml(kalah) + TEBAL_AKHIR,
  });
}
