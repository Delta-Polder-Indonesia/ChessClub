import { useState } from "react";

/** Dialog Review: tempel PGN atau FEN lalu muat ke papan. */
export default function MasukanPgn({ onTerapkan, onTutup, t }) {
  const [teks, setTeks] = useState("");
  const [galat, setGalat] = useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onTutup}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("papan.inputPgnFen")}
        className="w-full max-w-md rounded-lg border border-[#312e2b] bg-[#1e1c18] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">{t("papan.inputPgnFen")}</h3>
          <button
            type="button"
            onClick={onTutup}
            aria-label={t("papan.tutup")}
            className="text-gray-400 transition hover:text-gray-200"
          >
            ✕
          </button>
        </div>
        <textarea
          value={teks}
          onChange={(e) => {
            setTeks(e.target.value);
            setGalat(false);
          }}
          rows={7}
          spellCheck={false}
          placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 … (atau tempel FEN)"
          className="w-full resize-y rounded-md border border-[#363431] bg-[#262421] p-3 font-mono text-xs leading-5 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-[#81b64c]"
        />
        {galat && (
          <p className="mt-2 text-xs font-medium text-red-400">
            PGN/FEN tidak dapat dimuat — periksa kembali isinya.
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onTutup}
            className="rounded-md border border-[#363431] bg-[#2c2926] px-4 py-2 text-xs font-semibold text-gray-300 transition hover:bg-[#363431] hover:text-white"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              if (onTerapkan(teks)) onTutup();
              else setGalat(true);
            }}
            disabled={!teks.trim()}
            className="rounded-md bg-[#81b64c] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#a3d168] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Muat
          </button>
        </div>
      </div>
    </div>
  );
}
