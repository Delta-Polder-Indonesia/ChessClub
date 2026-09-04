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
  tanpaBilah = false,
  tanpaTombol = false,
  tanpaJudul = false,
  tanpaDeskripsi = false,
  tanpaGaris = false,
  gelap = false,
}) {
  const tombol = gelap
    ? "border border-[#363431] bg-[#2c2926] px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-[#363431] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    : "border border-[#b8b8b8] px-3 py-1.5 text-xs font-semibold text-[#333] transition hover:bg-[#e9e9e9] disabled:cursor-not-allowed disabled:opacity-40";

  const g = gelap
    ? {
        panel: "mt-6 border-t border-[#312e2b] pt-4",
        judul: "text-sm font-bold text-white",
        sub: "ml-1 font-normal text-gray-500",
        muted: "text-xs leading-5 text-gray-400",
        metaRow: "text-xs text-gray-400",
        label: "text-[11px] font-semibold uppercase tracking-wide text-gray-500",
        pv: "mt-0.5 text-xs leading-5 text-gray-200",
        meta: "text-[10px] leading-4 text-gray-500",
        nilaiPos: "font-bold text-white",
        nilaiNeg: "font-bold text-gray-400",
        mate: "ml-1 font-semibold text-gray-300",
        pilih: "border border-[#363431] bg-[#262421] px-1.5 py-1.5 text-xs text-gray-200 outline-none focus:border-[#81b64c]",
        nyalaBg: "bg-[#363431] text-gray-200",
        matiBg: "bg-[#81b64c] text-white hover:bg-[#a3d168]",
        gagal: "text-xs leading-5 text-red-400",
        isiTombol: "bg-[#363431]",
        spinner: "border-[#81b64c]",
      }
    : {
        panel: "mt-6 border-t border-slate-200 pt-4",
        judul: "text-sm font-bold text-slate-800",
        sub: "ml-1 font-normal text-[#999]",
        muted: "text-xs leading-5 text-slate-500",
        metaRow: "text-xs text-slate-600",
        label: "text-[11px] font-semibold uppercase tracking-wide text-slate-400",
        pv: "mt-0.5 text-xs leading-5 text-slate-800",
        meta: "text-[10px] leading-4 text-slate-400",
        nilaiPos: "font-bold text-slate-900",
        nilaiNeg: "font-bold text-slate-500",
        mate: "ml-1 font-semibold text-slate-700",
        pilih: "border border-[#b8b8b8] bg-white px-1.5 py-1.5 text-xs text-[#333] outline-none focus:border-[#3977b9]",
        nyalaBg: "bg-[#f0f0f0]",
        matiBg: "bg-[#3977b9] text-white hover:bg-[#2d639c]",
        gagal: "text-xs leading-5 text-red-700",
        isiTombol: "bg-[#f7f7f7]",
        spinner: "border-[#3977b9]",
      };

  return (
    <div className={tanpaGaris ? "" : g.panel}>
      {!tanpaJudul && (
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className={g.judul}>
          {t("papan.engine")}{" "}
          <span className={g.sub}>Stockfish 18</span>
        </p>
        <div className="flex items-center gap-1.5">
          {nyala && (
            <select
              value={kecepatan}
              onChange={(e) => setKecepatan(Number(e.target.value))}
              aria-label={t("papan.engineKedalaman")}
              title={t("papan.engineKedalaman")}
              className={g.pilih}
            >
              {PILIHAN_KECEPATAN.map(([ms, kunci]) => (
                <option key={ms} value={ms}>
                  {t(kunci)}
                </option>
              ))}
            </select>
          )}
          {!tanpaTombol && (
            <button
              type="button"
              onClick={nyala ? onMatikan : onNyalakan}
              className={`${tombol} ${nyala ? g.nyalaBg : g.matiBg}`}
            >
              {nyala ? t("papan.engineMatikan") : t("papan.engineNyalakan")}
            </button>
          )}
        </div>
      </div>
      )}

      {!nyala ? (
        !tanpaDeskripsi && <p className={g.muted}>{t(kunciDeskripsi)}</p>
      ) : status === "memuat" ? (
        <p className={`flex items-center gap-2 ${g.muted}`}>
          <span
            aria-hidden="true"
            className={`inline-block h-3 w-3 animate-spin rounded-full border-2 ${g.spinner} border-t-transparent`}
          />
          {t("papan.engineMemuat")}
        </p>
      ) : status === "gagal" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className={g.gagal}>{t("papan.engineGagal")}</p>
          <button
            type="button"
            onClick={() => {
              onMatikan();
              onNyalakan();
            }}
            className={`${tombol} ${g.isiTombol}`}
          >
            {t("papan.engineCobaLagi")}
          </button>
        </div>
      ) : permainanSelesai ? (
        <p className={g.muted}>{t("papan.engineSelesai")}</p>
      ) : hasil ? (
        <div className="flex flex-col gap-2.5">
          {!tanpaBilah && (
            <>
              {/* Bilah evaluasi: porsi Putih vs Hitam ala Lichess. */}
              <div
                className="flex h-3 w-full overflow-hidden border border-[#aaa] bg-[#414141]"
                role="img"
                aria-label={`${t("papan.engineSkor")} ${hasil.teksSkor}`}
              >
                <span style={{ width: `${hasil.poinPutih * 100}%` }} className="bg-[#f4f4f4]" />
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            {/* Kotak angka evaluasi. */}
            <span
              className={`shrink-0 rounded-md border border-[#363431] bg-[#262421] px-2 py-1 text-sm leading-none ${
                hasil.cpPutih >= 0 ? g.nilaiPos : g.nilaiNeg
              }`}
            >
              {hasil.teksSkor}
            </span>
            {/* PV — di luar kotak, sejajar horizontal. */}
            {hasil.pvSan.length > 0 && (
              <p className={`min-w-0 flex-1 ${g.pv}`}>
                {barisanSan(fen, hasil.pvSan)}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className={`flex items-center gap-2 ${g.muted}`}>
          <span
            aria-hidden="true"
            className={`inline-block h-3 w-3 animate-spin rounded-full border-2 ${g.spinner} border-t-transparent`}
          />
          {t("papan.engineMenganalisis")}
        </p>
      )}
    </div>
  );
}
