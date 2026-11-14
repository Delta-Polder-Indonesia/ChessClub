/*
 * Layar "Impor permainan" — meniru modal Import en-croissant, kini tanpa
 * modal: tiga kartu pilihan (PGN | Online | FEN). "Online" menerima tautan
 * partai Chess.com atau Lichess, lalu PGN-nya diambil otomatis.
 *
 * Chess.com memakai endpoint callback publik yang mengembalikan moveList
 * berformat TCN (kode 2 karakter per langkah, spesifikasi publik Chess.com)
 * + pgnHeaders; langkah-langkahnya diterjemahkan ke SAN lewat chess.js.
 * Lichess memakai endpoint ekspor publik yang mengembalikan teks PGN.
 */
import { useEffect, useRef, useState } from "react";
import PanelLayar from "./PanelLayar.jsx";
import ChessComLogo from "../svg/ChessComLogo.jsx";
import LichessLogo from "../svg/LichessLogo.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { imporPgnKeBasisData } from "../../basisData.js";
import { BATAS_IMPOR, KODE_GALAT, ambilPgn, galatImpor, validasiFen, validasiPgn } from "./validasiImpor.js";

const TIPE = [
  { kunci: "pgn", ikon: "pgn" },
  { kunci: "online", ikon: "online" },
  { kunci: "fen", ikon: "fen" },
];

function KartuTipe({ aktif, ikon, label, tanpaLabel, disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={aktif}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-borderRoundness border-2 px-2 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${aktif
        ? "border-backgroundBoxBoxHighlighted bg-backgroundBoxBox text-foreground"
        : "border-border bg-backgroundBoxBox text-foregroundGrey hover:border-borderHighlighted hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"}`}
    >
      <GambarIkon ikon={ikon} />
      {tanpaLabel ? null : <span className="text-[13px] font-bold">{label}</span>}
    </button>
  );
}

function GambarIkon({ ikon }) {
  if (ikon === "pgn") {
    // Ikon dokumen berlabel "PGN" — isi dokumen fill currentColor
    // (mengikuti warna tombol: abu saat non-aktif, foreground saat aktif),
    // label "PGN" memakai warna latar kartu (bg-backgroundBox) agar
    // kontras seperti efek "terpotong" dari dokumen.
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
        <path d="M6 22q-.82 0-1.41-.59T4 20V4q0-.83.59-1.41T6 2h8l6 6v12q0 .82-.59 1.41T18 22zm7-13V4H6v16h12V9zM6 4v5zv16z" />
        <text x="12" y="16" fontFamily="Arial, sans-serif" fontSize="5" fontWeight="bold" textAnchor="middle" className="fill-backgroundBoxBox">PGN</text>
      </svg>
    );
  }
  if (ikon === "online") {
    return (
      <div className="flex items-center gap-1.5">
        <ChessComLogo className="h-[20px] w-auto fill-current" />
        <span className="h-4 w-px bg-border" />
        <LichessLogo className="h-[20px] w-auto fill-current" />
      </div>
    );
  }
  // Ikon pensil/edit untuk FEN (mengganti ikon dokumen), fill
  // currentColor agar mengikuti warna tombol (abu non-aktif, highlight
  // saat aktif).
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
      <path d="M10.05,21l2-2H22v2H10.05ZM5,19H6.43L16.2,9.23L14.78,7.8L5,17.58V19ZM3,21V16.75L16.2,3.57q0.28-0.28 0.65-0.43T17.63,3q0.4,0 0.76,0.16T19.05,3.6L20.43,5q0.28,0.3 0.43,0.66T21,6.4q0,0.4-0.14,0.76T20.43,7.82L7.25,21H3Z" />
    </svg>
  );
}

export default function LayarImpor({ onTutup, onImpor }) {
  const { t } = useI18n();
  const [tipe, setTipe] = useState("pgn");
  const [pgn, setPgn] = useState("");
  const [tautan, setTautan] = useState("");
  const [fen, setFen] = useState("");
  const [galat, setGalat] = useState(null);
  const [memuat, setMemuat] = useState(false);
  const controllerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
    const controller = controllerRef.current;
    controllerRef.current = null;
    controller?.abort();
  }, []);

  function pesanGalat(kode) {
    const kunci = {
      [KODE_GALAT.TAUTAN]: "galatTautan",
      [KODE_GALAT.JARINGAN]: "galatAmbil",
      [KODE_GALAT.TIMEOUT]: "galatTimeout",
      [KODE_GALAT.RESPONS]: "galatRespons",
      [KODE_GALAT.PGN]: "galatPgn",
      [KODE_GALAT.FEN]: "galatFen",
      [KODE_GALAT.UKURAN]: "galatUkuran",
      [KODE_GALAT.LANGKAH]: "galatLangkah",
      [KODE_GALAT.TCN]: "galatRespons",
    }[kode] ?? "galatAmbil";
    return t(`analisa.impor.${kunci}`, {
      byteMaks: Math.round(BATAS_IMPOR.bytePGN / 1024),
      plyMaks: BATAS_IMPOR.ply,
    });
  }

  async function kirim() {
    setGalat(null);
    if (tipe === "pgn") {
      if (!pgn.trim()) return;
      try {
        validasiPgn(pgn);
      } catch (e) {
        setGalat(pesanGalat(e?.code));
        return;
      }
      imporPgnKeBasisData(pgn).catch(() => {});
      onImpor({ format: "pgn", string: pgn });
      return;
    }
    if (tipe === "fen") {
      if (!fen.trim()) return;
      try {
        const fenValid = validasiFen(fen);
        onImpor({ format: "fen", string: fenValid });
      } catch (e) {
        setGalat(pesanGalat(e?.code));
      }
      return;
    }
    if (!tautan.trim() || controllerRef.current) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    setMemuat(true);
    let timeoutTerjadi = false;
    timerRef.current = window.setTimeout(() => {
      timeoutTerjadi = true;
      controller.abort();
    }, BATAS_IMPOR.waktuMs);

    try {
      const pgn2 = await ambilPgn(tautan, { signal: controller.signal });
      if (controllerRef.current !== controller || controller.signal.aborted) return;
      if (!pgn2.trim()) throw galatImpor(KODE_GALAT.RESPONS);
      validasiPgn(pgn2);
      imporPgnKeBasisData(pgn2).catch(() => {});
      onImpor({ format: "pgn", string: pgn2 });
    } catch (e) {
      if (controllerRef.current !== controller) return;
      const kode = timeoutTerjadi ? KODE_GALAT.TIMEOUT : e?.code;
      setGalat(pesanGalat(kode));
    } finally {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setMemuat(false);
      }
    }
  }

  const kosong =
    (tipe === "pgn" && !pgn.trim()) ||
    (tipe === "online" && !tautan.trim()) ||
    (tipe === "fen" && !fen.trim());

  const labelTombol = t(tipe === "online" ? "analisa.impor.ambil" : "analisa.impor.analisa");

  return (
    <PanelLayar
      judul={t("analisa.impor.judul")}
      subjudul={t("analisa.impor.tipe")}
      lebarMaks="max-w-[720px]"
    >
      <div className="grid grid-cols-3 gap-2">
        {TIPE.map((ti) => (
          <KartuTipe
            key={ti.kunci}
            aktif={tipe === ti.kunci}
            ikon={ti.ikon}
            tanpaLabel={false}
            disabled={memuat}
            label={ti.kunci === "online" ? t("analisa.impor.online") : ti.kunci.toUpperCase()}
            onClick={() => {
              setTipe(ti.kunci);
              setGalat(null);
            }}
          />
        ))}
      </div>

      {tipe === "pgn" ? (
        <div className="mt-4">
          <label htmlFor="impor-pgn" className="mb-1.5 block text-xs font-bold text-foregroundGrey">
            PGN GAMES
          </label>
          <textarea
            id="impor-pgn"
            spellCheck={false}
            rows={8}
            value={pgn}
            onChange={(e) => setPgn(e.currentTarget.value)}
            data-uji="impor-pgn"
            aria-label="PGN"
            className="w-full resize-y rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      ) : tipe === "online" ? (
        <div className="mt-4">
          <label htmlFor="impor-online" className="mb-1.5 block text-xs font-bold text-foregroundGrey">
            GAME URL (lichess or chess.com)
          </label>
          <input
            id="impor-online"
            type="url"
            value={tautan}
            disabled={memuat}
            onChange={(e) => setTautan(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !kosong && !memuat) {
                e.preventDefault();
                kirim();
              }
            }}
            data-uji="impor-online"
            aria-label={t("analisa.impor.onlineLabel")}
            className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor="impor-fen" className="mb-1.5 block text-xs font-bold text-foregroundGrey">
            FEN
          </label>
          <textarea
            id="impor-fen"
            spellCheck={false}
            rows={2}
            value={fen}
            onChange={(e) => setFen(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!kosong && !memuat) kirim();
              }
            }}
            data-uji="impor-fen"
            aria-label="FEN"
            className="w-full resize-none rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none transition-colors hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      )}

      {galat ? (
        <p data-uji="galat-impor" role="alert" aria-live="assertive" className="mt-2 text-xs text-lossRed">{galat}</p>
      ) : null}

      <div className="mt-5 flex flex-row justify-end gap-2">
        <button
          type="button"
          onClick={onTutup}
          className="cursor-pointer rounded-borderRoundness border border-border bg-backgroundBoxBox px-3.5 py-2 text-sm text-foregroundGrey transition-colors hover:bg-backgroundBoxBoxHover hover:text-foregroundHighlighted"
        >
          {t("analisa.akun.batal")}
        </button>
        <button
          type="button"
          data-uji="kirim-impor"
          disabled={kosong || memuat}
          onClick={kirim}
          className="cursor-pointer rounded-borderRoundness bg-backgroundBoxBoxHighlighted px-3.5 py-2 text-sm font-bold text-foregroundBlackDark transition-colors hover:bg-backgroundBoxBoxHighlightedHover disabled:cursor-default disabled:opacity-40"
        >
          {memuat ? t("analisa.impor.memuat") : labelTombol}
        </button>
      </div>
    </PanelLayar>
  );
}
