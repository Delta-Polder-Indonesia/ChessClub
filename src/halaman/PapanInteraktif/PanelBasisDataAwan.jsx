import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { formatSkorAwan } from "../../lib/basisDataAwan.js";
import { sanDiPosisi } from "./utilPapan.js";

/**
 * Panel basis data awan (Chess Cloud Database — chessdb.cn) untuk tab "Partai".
 *
 * Dipakai SETELAH buku pembukaan lokal habis: buku lokal hanya memuat teori,
 * sedangkan CDB menyimpan penilaian mesin posisi lanjutan. Permintaan jaringan
 * dilakukan satuan tugas di atas (hanya saat keluar buku); komponen ini murni
 * menampilkan hasilnya — termasuk saat data belum ada / layanan tak terjangkau,
 * karena pengguna tetap perlu tahu kenapa daftarnya kosong.
 */
export default function PanelBasisDataAwan({
  awan,
  fen,
  onPilih,
  onCobaLagi,
  onNyalakanEngine,
  engineNyala,
  tampilanPenuh,
  t,
}) {
  // Langkah "??" (belum dinilai CDB) dilipat supaya tabel utama tetap ringkas.
  const [tampilkanBelumDinilai, setTampilkanBelumDinilai] = useState(false);
  const { bernilai, belumDinilai } = useMemo(() => {
    let game = null;
    try {
      game = new Chess(fen);
    } catch {
      game = null;
    }
    const keBaris = (l) => ({
      uci: l.uci,
      // CDB mengirim SAN saat `json=1`; konversi manual hanya jaring pengaman.
      san: l.san || (game ? sanDiPosisi(game, l.uci) : l.uci),
      skor: l.dinilai === false ? "??" : l.mat ? t("papan.awanMat") : formatSkorAwan(l.skorCp) ?? "—",
      winrate:
        l.winrate === null || l.winrate === undefined
          ? "—"
          : `${Math.round(l.winrate * 10) / 10}%`,
      catatan: l.dinilai === false ? "—" : l.catatan || "—",
    });
    const bernilai = [];
    const belumDinilai = [];
    for (const l of awan.langkah || []) {
      (l.dinilai === false ? belumDinilai : bernilai).push(keBaris(l));
    }
    return { bernilai, belumDinilai };
  }, [awan.langkah, fen, t]);

  if (awan.status === "memuat") {
    return <p className="mt-1.5 text-sm font-medium text-gray-400">{t("papan.awanMemuat")}</p>;
  }

  // Mode RINGKAS (sakelar "tampilkan semua langkah" di Pengaturan Papan mati):
  // cukup SATU langkah terbaik saja, tanpa tabel & daftar "??" — hemat
  // tampilan. Bawaannya sakelar itu NYALA, jadi tab Partai memperlihatkan
  // daftar lengkap; mode ringkas hanya bila pengguna mematikannya sendiri.
  if (!tampilanPenuh) {
    const terbaik = bernilai[0] || null;
    if (terbaik) {
      return (
        <p className="mt-1.5 text-xs text-gray-300">
          {t("papan.awanRingkas", { langkah: terbaik.san, nilai: terbaik.skor })}
        </p>
      );
    }
    if (belumDinilai.length && !engineNyala && onNyalakanEngine) {
      return (
        <div className="mt-1.5 space-y-1">
          <p className="text-[11px] text-gray-500">{t("papan.awanBelumAdaDinilai")}</p>
          <button
            type="button"
            onClick={onNyalakanEngine}
            className="text-xs font-bold text-[#a3d168] hover:underline"
          >
            {t("papan.awanNyalakanEngine")}
          </button>
        </div>
      );
    }
    // Tanpa langkah bernilai → jatuh ke blok kosong/galat di bawah.
  }

  if (bernilai.length || belumDinilai.length) {
    // Jumlah bernilai dari server (bisa lebih besar dari yang tampil bila
    // terkena batas kirim) — dipakai catatan "hanya N langkah yang dinilai".
    const jumlahDinilai = awan.jumlahDinilai ?? bernilai.length;
    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-gray-100">{t("papan.daftarLangkah")}</p>
          <span className="shrink-0 text-xs text-gray-500">{t("papan.awanSumber")}</span>
        </div>
        {bernilai.length > 0 && <TabelLangkahAwan baris={bernilai} onPilih={onPilih} t={t} />}
        {/* Langkah "??": sama seperti queryc_en ikut ditampilkan, tetapi
            terlipat & abu-abu — tetap bisa diklik untuk dimainkan. */}
        {belumDinilai.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setTampilkanBelumDinilai((v) => !v)}
              aria-expanded={tampilkanBelumDinilai}
              className="text-xs font-bold text-gray-400 hover:text-gray-200 hover:underline"
            >
              {tampilkanBelumDinilai
                ? t("papan.awanSembunyikanBelumDinilai")
                : t("papan.awanTampilkanBelumDinilai", { jumlah: belumDinilai.length })}
            </button>
            {tampilkanBelumDinilai && (
              <div className="mt-1.5">
                <TabelLangkahAwan baris={belumDinilai} redup onPilih={onPilih} t={t} />
              </div>
            )}
          </div>
        )}
        {/* Catatan opsi B: nilai yang tersedia masih sedikit — tawarkan engine
            untuk menilai sisanya (hanya saat engine belum menyala). */}
        {!engineNyala && onNyalakanEngine && belumDinilai.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[11px] text-gray-500">
              {bernilai.length > 0
                ? t("papan.awanCatatanDinilai", { jumlah: jumlahDinilai })
                : t("papan.awanBelumAdaDinilai")}
            </p>
            <button
              type="button"
              onClick={onNyalakanEngine}
              className="shrink-0 text-xs font-bold text-[#a3d168] hover:underline"
            >
              {t("papan.awanNyalakanEngine")}
            </button>
          </div>
        )}
        {/* Skor CDB dilihat dari sisi yang sedang jalan — beri keterangan agar
            angka positif tidak disalahartikan sebagai keunggulan Putih. */}
        <p className="mt-2 text-[10px] text-gray-500">{t("papan.awanCatatanSkor")}</p>
      </div>
    );
  }

  return (
    <div className="mt-1.5 space-y-1">
      <p className="text-sm font-medium text-gray-400">{t("papan.diLuarBuku")}</p>
      {awan.status === "kosong" && (
        <p className="text-xs text-gray-500">{t("papan.awanKosong")}</p>
      )}
      {awan.status === "galat" && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">{t("papan.awanGalat")}</p>
          {/* Pesan + kode penyebab dari server — tanpa ini laporan "tidak bisa"
              dari produksi tidak dapat dibedakan (DNS, blokir, lambat, …). */}
          {(awan.pesan || awan.kode) && (
            <p className="text-[10px] text-gray-500">
              {awan.pesan}
              {awan.kode ? <span className="ml-1 font-mono">({awan.kode})</span> : null}
            </p>
          )}
          {onCobaLagi && (
            <button
              type="button"
              onClick={onCobaLagi}
              className="text-xs font-bold text-[#a3d168] hover:underline"
            >
              {t("papan.awanCobaLagi")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Tabel satu kelompok langkah CDB — `redup` = gaya abu-abu untuk langkah
 *  "??" yang belum dianalisis (skor "??" di kolom skor). */
function TabelLangkahAwan({ baris, redup = false, onPilih, t }) {
  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full min-w-[420px] border-collapse text-left text-xs ${
          redup ? "text-gray-500" : "text-gray-300"
        }`}
      >
        <thead className="bg-[#2c2926] text-gray-200">
          <tr>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">
              {t("papan.kolomLangkah")}
            </th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">
              {t("papan.awanKolomSkor")}
            </th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">
              {t("papan.awanKolomWinrate")}
            </th>
            <th className="border-b border-[#363431] px-3 py-2 font-bold">
              {t("papan.awanKolomCatatan")}
            </th>
          </tr>
        </thead>
        <tbody>
          {baris.map((item, indeks) => (
            <tr
              key={`${item.uci}-${indeks}`}
              className="border-b border-[#312e2b] last:border-b-0 hover:bg-[#2c2926]"
            >
              <td className="px-3 py-2 align-top">
                <button
                  type="button"
                  onClick={() => onPilih(item.san)}
                  className={
                    redup
                      ? "font-bold text-gray-400 hover:text-[#a3d168] hover:underline"
                      : "font-bold text-[#a3d168] hover:underline"
                  }
                >
                  {item.san}
                </button>
              </td>
              <td className="px-3 py-2 align-top tabular-nums">{item.skor}</td>
              <td className="px-3 py-2 align-top tabular-nums">{item.winrate}</td>
              <td className={`px-3 py-2 align-top ${redup ? "" : "text-gray-400"}`}>
                {item.catatan}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
