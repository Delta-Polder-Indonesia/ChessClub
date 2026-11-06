/**
 * Tab "Main": giliran, tingkat kesulitan, elo soal, dan catatan pelatih (PGN)
 * setelah soal selesai. Komentator menggantikan nama pembukaan saat aktif.
 */
import React from "react";
import { useI18n } from "../../../lib/i18n.jsx";
import { ChessPiece } from "../../../components/chess/ChessPiece.jsx";

export default function PanelUtama({
  memuat = false,
  memuatKoleksi = false,
  giliran = "putih",
  teksTingkat = "",
  eloSoal = 1500,
  selesai = false,
  teksPembukaan = "",
  catatanLangkah = null,
  jumlahVariasi = 0,
  simbolNag = "",
  nilaiSetBidak = "merida",
  komentatorNyala = false,
  kartu = null,
}) {
  const { t } = useI18n();
  return (
    <>
              {/* Komentator menggantikan nama opening book saat diaktifkan. */}
              {komentatorNyala && kartu ? (
                <div className="flex-shrink-0 min-w-0 border-b border-[#312e2b] bg-[#1e1c18] px-4 py-2">
                  {React.cloneElement(kartu, {
                    hanyaKontrol: false,
                    sembunyikanKontrol: true,
                    className: "w-full min-w-0",
                  })}
                </div>
              ) : teksPembukaan ? (
                <div className="flex-shrink-0 min-w-0 border-b border-[#312e2b] bg-[#1e1c18] px-4 py-2 flex items-baseline gap-2">
                  <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider flex-shrink-0">{t("papan.pembukaan")}</span>
                  <span className="text-[11px] font-medium text-gray-300 truncate min-w-0" title={teksPembukaan}>{teksPembukaan}</span>
                </div>
              ) : null}

              {/* Ringkasan soal disusun bertingkat seperti piramida. */}
              <div className="flex-1 min-h-0 flex items-center justify-center px-4 py-4">
                <div
                  data-testid="main-turn-status"
                  className="flex flex-col items-center gap-2.5 text-center"
                >
                  <span
                    data-testid="main-turn-icon"
                    data-side={memuat ? undefined : giliran}
                    data-piece={memuat ? undefined : giliran === "putih" ? "P" : "p"}
                    aria-hidden="true"
                    className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white"
                  >
                    {!memuat && (
                      <ChessPiece
                        piece={giliran === "putih" ? "P" : "p"}
                        set={nilaiSetBidak}
                        className="h-11 w-11 object-contain"
                      />
                    )}
                  </span>
                  <span
                    data-testid="main-turn-label"
                    aria-live="polite"
                    className="text-2xl font-semibold text-[#fffaec]"
                  >
                    {memuat
                      ? "—"
                      : giliran === "putih"
                        ? t("tekaTeki.giliranPutih")
                        : t("tekaTeki.giliranHitam")}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {!memuat && teksTingkat && (
                      <span
                        data-testid="main-turn-difficulty"
                        className="rounded-md bg-transparent px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        {teksTingkat}
                      </span>
                    )}
                    <span
                      data-testid="main-turn-rating"
                      className="rounded-md bg-[#312e2b] px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      Elo {memuat ? "—" : eloSoal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Konten utama panel dipertahankan seperti sebelumnya. */}
              <div className={`${selesai && !memuat && !memuatKoleksi ? "flex-1" : "hidden"} overflow-y-auto min-h-0 p-4 space-y-3 text-sm`}>
                {selesai && !memuat && !memuatKoleksi && (
                  <div className="space-y-2.5 pt-1">
                    {(Array.isArray(catatanLangkah) && catatanLangkah.length > 0 || jumlahVariasi > 0 || simbolNag) && (
                      <div
                        data-catatan-pgn="ada"
                        className="rounded-md border border-[#312e2b] bg-[#1e1c18] p-3 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-300">
                            {t("tekaTeki.catatanPelatihJudul")}
                          </span>
                          {simbolNag && (
                            <span className="rounded bg-[#81b64c]/20 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#a3d168]">
                              {simbolNag}
                            </span>
                          )}
                        </div>
                        {Array.isArray(catatanLangkah) &&
                          catatanLangkah.map((teks, idxCatatan) => (
                            <p key={idxCatatan} className="text-xs leading-5 text-gray-300">
                              {teks}
                            </p>
                          ))}
                        {jumlahVariasi > 0 && (
                          <p className="text-xs text-gray-400">
                            {t("tekaTeki.variasiCabang", { n: jumlahVariasi })}
                          </p>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>

              </>
  );
}
