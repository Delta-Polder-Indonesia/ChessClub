/**
 * Kartu "Ekspor PGN beranotasi" pada panel Ringkasan.
 *
 * Hingga kartu ini ada, satu-satunya jalan membawa hasil analisis keluar
 * halaman adalah PGN mentah dari panel Basis Data — dan panel itu memang
 * hanya menyimpan teks PGN (lihat ../../../../basisData.js), bukan label
 * hasil analisis. Jadi label yang sudah dihitung di peramban hilang begitu
 * partai diunduh. Kartu ini menyusun ulang PGN dari `moves` hasil analisis
 * (NAG + `[%eval]`) lewat modul murni ../../../../mesin/pgnAnotasi.js.
 *
 * WAJIB: kartu ini dipasang PALING BAWAH di `summary.jsx`. Suite beku
 * scripts/uji-hasil.mjs mencari baris Ringkasan berdasarkan URUTAN DOM
 * (baris pertama yang cocok menang), jadi kartu baru tidak boleh menyisip di
 * tengah — aturan yang sama sudah membuat deteksiEngine.jsx ada di bawah.
 */
import { useContext, useMemo, useState } from "react";
import { AnalyzeContext } from "../../../../konteks/analyze.jsx";
import { useI18n } from "../../../../../../lib/i18n.jsx";
import Download from "../../../svg/download.jsx";
import { NAG_LABEL, bangunPgnBeranotasi, unduhPgnBeranotasi } from "../../../../mesin/pgnAnotasi.js";
import { langkahTerpaksa } from "../../../../mesin/evaluasi.js";

function EksporPgn(props) {
  const { moves } = props;
  const { t } = useI18n();
  const analyzeContext = useContext(AnalyzeContext);
  const [data] = analyzeContext.data;
  const [players] = analyzeContext.players;
  const [result] = analyzeContext.result;
  /* Setelah unduhan: tombol menampilkan konfirmasi singkat, bukan senyap. */
  const [terakhir, setTerakhir] = useState(null);

  /*
   * PGN asli hanya dipakai untuk tag header (Event/Site/Elo/…). Kalau yang
   * dianalisis adalah FEN, `data.string` berisi FEN — `bangunPgnBeranotasi`
   * menolaknya dengan aman dan menyusun header sendiri dari `pemain`.
   */
  const pgnAsal = data?.format === "pgn" ? data.string : "";

  const ringkas = useMemo(() => {
    const daftar = Array.isArray(moves) ? moves.slice(1).filter((m) => m?.san) : [];
    // Cerminan `tokenLangkah` di pgnAnotasi.js: langkah paksa tak ditandai.
    const ditandai = daftar.filter((m) => !langkahTerpaksa(m) && NAG_LABEL[m.moveRating]).length;
    return { jumlah: daftar.length, ditandai };
  }, [moves]);

  const namaBerkas = `${players?.[0]?.name || "Putih"} vs ${players?.[1]?.name || "Hitam"}`;

  function unduh(sertakanEval) {
    const berhasil = unduhPgnBeranotasi({
      namaPartai: namaBerkas,
      pgn: pgnAsal,
      moves,
      pemain: players,
      hasil: result,
      sertakanEval,
    });
    setTerakhir(berhasil ? (sertakanEval ? "denganEval" : "tanpaEval") : "gagal");
  }

  const kosong = ringkas.jumlah === 0;

  return (
    <div className="flex w-[85%] flex-col gap-3 pr-[26px] reduceSummary:pr-[35px]">
      <span className="text-sm font-semibold text-foregroundGrey">{t("analisa.ringkasan.ekspor.judul")}</span>

      {kosong ? (
        <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.ringkasan.ekspor.kosong")}</p>
      ) : (
        <>
          <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.ringkasan.ekspor.keterangan")}</p>
          <p className="text-xs leading-4 text-foregroundGrey">
            {t("analisa.ringkasan.ekspor.jumlahLabel", { n: ringkas.ditandai, total: ringkas.jumlah })}
          </p>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => unduh(true)}
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-backgroundBoxBoxHighlighted"
            >
              <Download className="h-3.5 w-3.5" />
              {t("analisa.ringkasan.ekspor.tombol")}
            </button>
            <button
              type="button"
              onClick={() => unduh(false)}
              className="inline-flex w-fit cursor-pointer items-center rounded-borderRoundness border border-border px-3 py-2 text-xs font-semibold text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
            >
              {t("analisa.ringkasan.ekspor.tombolTanpaEval")}
            </button>
          </div>
          {terakhir && terakhir !== "gagal" ? (
            <p className="text-xs leading-4 text-foregroundGrey">{t("analisa.ringkasan.ekspor.sukses")}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export { EksporPgn as default };
