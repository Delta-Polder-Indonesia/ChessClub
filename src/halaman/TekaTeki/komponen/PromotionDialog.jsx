/**
 * Dialog pemilihan bidak promosi.
 *
 * Sebelumnya dialog ini hidup di dalam `LayoutTekaTeki` sebagai `div` ber-
 * `role="dialog"` tanpa jebakan fokus, tanpa fokus awal, dan tanpa pemulihan
 * fokus — `Escape` pun ditangani listener global. Versi ini:
 *   - dirender lewat portal ke `document.body` (tidak terpotong `overflow`);
 *   - memindahkan fokus ke pilihan pertama, menjebaknya selama terbuka, dan
 *     mengembalikan fokus ke elemen pemicu saat ditutup;
 *   - menangani `Escape` dan klik latar sebagai batal;
 *   - tetap memakai markup/tombol yang sama (uji lama tetap berlaku).
 */
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../../lib/i18n.jsx";
import { ChessPiece } from "../../../components/chess/ChessPiece.jsx";
import { KUCI_NAMA_PROMOSI, PILIHAN_PROMOSI } from "../../../lib/pilihanPapan.js";

export default function PromotionDialog({
  promosi,
  setBidak = "merida",
  onPilih,
  onBatal,
  judul = "",
}) {
  const { t } = useI18n();
  const kotakRef = useRef(null);
  const fokusSebelum = useRef(null);

  const tutup = useCallback(() => onBatal?.(), [onBatal]);

  useEffect(() => {
    fokusSebelum.current = document.activeElement;
    const pertama = kotakRef.current?.querySelector("button");
    pertama?.focus();
    return () => {
      // Kembalikan fokus ke pemicu (papan) supaya pengguna keyboard tidak
      // kehilangan posisi setelah dialog ditutup.
      const el = fokusSebelum.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, []);

  const padaKeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      tutup();
      return;
    }
    if (e.key !== "Tab") return;
    const fokusabel = kotakRef.current?.querySelectorAll("button");
    if (!fokusabel?.length) return;
    const pertama = fokusabel[0];
    const terakhir = fokusabel[fokusabel.length - 1];
    if (e.shiftKey && document.activeElement === pertama) {
      e.preventDefault();
      terakhir.focus();
    } else if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault();
      pertama.focus();
    }
  };

  if (!promosi) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={tutup}
    >
      <div
        ref={kotakRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("tekaTeki.promosiJudul")}
        data-dialog="promosi"
        className="flex flex-col items-center gap-3 rounded-lg bg-white/95 p-4 shadow-xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={padaKeydown}
      >
        <p className="text-sm font-semibold text-slate-700">{judul}</p>
        <div className="flex gap-2">
          {PILIHAN_PROMOSI.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => onPilih?.(p)}
              aria-label={t(KUCI_NAMA_PROMOSI[p])}
              title={t(KUCI_NAMA_PROMOSI[p])}
              data-promosi={p}
              className={`flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 p-1.5 transition hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                i === 0 ? "" : ""
              }`}
            >
              <ChessPiece
                piece={promosi.warna === "w" ? p.toUpperCase() : p}
                set={setBidak}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={tutup}
          className="text-xs font-medium text-slate-500 underline-offset-2 transition hover:text-slate-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("tekaTeki.promosiBatal")}
        </button>
      </div>
    </div>,
    document.body
  );
}
