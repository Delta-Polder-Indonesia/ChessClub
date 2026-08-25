import { Chess } from "chess.js";

/** Pilihan durasi analisis (milidetik) + kunci terjemahannya. */
export const PILIHAN_KECEPATAN = [
  [300, "papan.engineCepat"],
  [800, "papan.engineSeimbang"],
  [2000, "papan.engineDalam"],
];

/**
 * Deret SAN → teks bernomor yang benar walau barisan dimulai dari giliran
 * Hitam, mis. "1… e5 2. Nf3 Nc6".
 */
function barisanSan(fen, daftarSan) {
  const game = new Chess(fen);
  let nomor = game.moveNumber();
  const putihJalan = game.turn() === "w";
  const bagian = [];
  daftarSan.forEach((san, i) => {
    if (i === 0 && !putihJalan) {
      bagian.push(`${nomor}… ${san}`);
    } else if ((i + (putihJalan ? 0 : 1)) % 2 === 0) {
      bagian.push(`${nomor}. ${san}`);
    } else {
      bagian.push(san);
    }
    if ((i + (putihJalan ? 1 : 0)) % 2 === 1) nomor += 1;
  });
  return bagian.join(" ");
}

/**
 * Panel "Analisis Engine" — Stockfish berjalan di peramban pengguna.
 * Dimatikan secara bawaan; worker (±7 MB) baru diunduh saat pertama
 * dinyalakan supaya kunjungan biasa tidak menanggung bebannya.
 *
 * Dipakai bersama oleh halaman Papan Interaktif dan Teka-Teki. Teks judul
 * dan deskripsi bisa disesuaikan per halaman lewat kunci terjemahan.
 */
export default function PanelEngine({
  nyala,
  status,
  hasil,
  fen,
  kecepatan,
  setKecepatan,
  permainanSelesai,
  onNyalakan,
  onMatikan,
  onMainkan,
  t,
  kunciDeskripsi = "papan.engineDeskripsi",
}) {
  const tombol =
    "border border-[#b8b8b8] px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="mt-6 border-t border-slate-200 pt-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-800">
          {t("papan.engine")}{" "}
          <span className="ml-1 font-normal text-[#999]">Stockfish 18</span>
        </p>
        <div className="flex items-center gap-1.5">
          {nyala && (
            <select
              value={kecepatan}
              onChange={(e) => setKecepatan(Number(e.target.value))}
              aria-label={t("papan.engineKedalaman")}
              title={t("papan.engineKedalaman")}
              className="border border-[#b8b8b8] bg-white px-1.5 py-1.5 text-xs text-[#333] outline-none focus:border-[#3977b9]"
            >
              {PILIHAN_KECEPATAN.map(([ms, kunci]) => (
                <option key={ms} value={ms}>
                  {t(kunci)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={nyala ? onMatikan : onNyalakan}
            className={`${tombol} ${nyala ? "bg-[#f0f0f0]" : "bg-[#3977b9] text-white hover:bg-[#2d639c]"}`}
          >
            {nyala ? t("papan.engineMatikan") : t("papan.engineNyalakan")}
          </button>
        </div>
      </div>

      {!nyala ? (
        <p className="text-xs leading-5 text-slate-500">{t(kunciDeskripsi)}</p>
      ) : status === "memuat" ? (
        <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#3977b9] border-t-transparent"
          />
          {t("papan.engineMemuat")}
        </p>
      ) : status === "gagal" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs leading-5 text-red-700">{t("papan.engineGagal")}</p>
          <button
            type="button"
            onClick={() => {
              onMatikan();
              onNyalakan();
            }}
            className={`${tombol} bg-[#f7f7f7]`}
          >
            {t("papan.engineCobaLagi")}
          </button>
        </div>
      ) : permainanSelesai ? (
        <p className="text-xs leading-5 text-slate-500">{t("papan.engineSelesai")}</p>
      ) : hasil ? (
        <div className="flex flex-col gap-2.5">
          {/* Bilah evaluasi: porsi Putih vs Hitam ala Lichess. */}
          <div
            className="flex h-3 w-full overflow-hidden border border-[#aaa] bg-[#414141]"
            role="img"
            aria-label={`${t("papan.engineSkor")} ${hasil.teksSkor}`}
          >
            <span style={{ width: `${hasil.poinPutih * 100}%` }} className="bg-[#f4f4f4]" />
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-slate-600">
            <span>
              {t("papan.engineSkor")}{" "}
              <span
                className={
                  hasil.cpPutih >= 0
                    ? "font-bold text-slate-900"
                    : "font-bold text-slate-500"
                }
              >
                {hasil.teksSkor}
              </span>
            </span>
            <span>
              {t("papan.engineKedalamanN", { n: hasil.kedalaman })}
              {hasil.matePutih !== null && (
                <span className="ml-1 font-semibold text-slate-700">
                  ({t("papan.engineMate")})
                </span>
              )}
            </span>
          </div>

          {hasil.pvSan.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("papan.engineBarisan")}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-800">
                {barisanSan(fen, hasil.pvSan)}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {hasil.pvSan.length > 0 && onMainkan && (
              <button
                type="button"
                onClick={() => onMainkan(hasil.pvSan[0])}
                className={`${tombol} bg-[#f7f7f7]`}
              >
                {t("papan.engineMainkan")} ({hasil.pvSan[0]})
              </button>
            )}
            <span className="text-[10px] leading-4 text-slate-400">
              {t("papan.enginePanah")}
            </span>
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-2 text-xs leading-5 text-slate-500">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#3977b9] border-t-transparent"
          />
          {t("papan.engineMenganalisis")}
        </p>
      )}
    </div>
  );
}
