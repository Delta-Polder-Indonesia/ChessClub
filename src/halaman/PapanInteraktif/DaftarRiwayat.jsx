/**
 * Daftar langkah (move log) — baris nomor + langkah Putih/Hitam yang bisa
 * diklik untuk melompat ke posisi tersebut (pola "Move Log" di prompt.md).
 * Langkah masa depan (setelah undo) dibuat redup sampai dipilih lagi.
 *
 * Setiap langkah bisa menyandang ikon klasifikasi kecil di samping SAN
 * ("1. e4 📖 e5 📖") — kosakata sama dengan ikon di petak papan & kartu
 * komentator: book/best/miss/blunder/mistake/inaccuracy/good/excellent/
 * forced. Ikon diambil dari komponen RatingSVG yang sama.
 */
import RatingSVG from "../Analisa/komponen/svg/rating.jsx";

/** Ikon klasifikasi satu langkah — null bila langkah belum dinilai. */
function IkonRating({ rating, t }) {
  if (!rating) return null;
  return (
    <span
      className="ml-0.5 inline-flex shrink-0 self-center"
      title={t ? t(`analisa.penilaian.${rating}`) : undefined}
    >
      <RatingSVG rating={rating} size={13} />
    </span>
  );
}

export default function DaftarRiwayat({ langkah, aktifPly, rating, onPilih, t }) {
  if (!langkah.length) return null;
  const baris = [];
  for (let i = 0; i < langkah.length; i += 2) {
    const hitam = i + 1 < langkah.length ? langkah[i + 1] : null;
    baris.push({ nomor: i / 2 + 1, putihI: i, putih: langkah[i], hitamI: i + 1, hitam });
  }
  const kelas = (ply) => {
    if (ply === aktifPly) return "bg-[#363431] text-white";
    if (ply > aktifPly) return "text-gray-600 hover:bg-[#2c2926] hover:text-gray-300";
    return "text-gray-300 hover:bg-[#2c2926] hover:text-white";
  };
  return (
    <div className="mt-3 space-y-0.5">
      {baris.map((b) => (
        <div
          key={b.nomor}
          className="flex items-center gap-2 rounded px-1 py-0.5 transition hover:bg-[#2c2926]"
        >
          <span className="w-6 shrink-0 text-right text-xs text-gray-500">{b.nomor}.</span>
          <button
            type="button"
            onClick={() => onPilih(b.putihI + 1)}
            className={`flex flex-1 items-center rounded px-2 py-1 text-left text-xs font-semibold transition ${kelas(
              b.putihI
            )}`}
          >
            <span className="truncate">{b.putih}</span>
            <IkonRating rating={rating?.[b.putihI]} t={t} />
          </button>
          <button
            type="button"
            onClick={() => onPilih(b.hitamI + 1)}
            disabled={b.hitam === null}
            className={`flex flex-1 items-center rounded px-2 py-1 text-left text-xs font-semibold transition ${
              b.hitam === null
                ? "cursor-default text-gray-600"
                : kelas(b.hitamI)
            }`}
          >
            <span className="truncate">{b.hitam ?? "…"}</span>
            {b.hitam !== null && <IkonRating rating={rating?.[b.hitamI]} t={t} />}
          </button>
        </div>
      ))}
    </div>
  );
}
