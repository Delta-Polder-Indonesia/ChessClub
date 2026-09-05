/*
 * Popup "Impor permainan" — meniru modal Import en-croissant:
 * tiga kartu pilihan (PGN | Online | FEN). "Online" menerima tautan partai
 * Chess.com atau Lichess, lalu PGN-nya diambil otomatis.
 *
 * Chess.com memakai endpoint callback publik yang mengembalikan moveList
 * berformat TCN (kode 2 karakter per langkah, spesifikasi publik Chess.com)
 * + pgnHeaders; langkah-langkahnya diterjemahkan ke SAN lewat chess.js.
 * Lichess memakai endpoint ekspor publik yang mengembalikan teks PGN.
 */
import { useState } from "react";
import { Chess } from "chess.js";
import Popup from "./Popup.jsx";
import ChessComLogo from "../svg/ChessComLogo.jsx";
import LichessLogo from "../svg/LichessLogo.jsx";
import { useI18n } from "../../../../lib/i18n.jsx";
import { imporPgnKeBasisData } from "../../basisData.js";

const TIPE = [
  { kunci: "pgn", ikon: "pgn" },
  { kunci: "online", ikon: "online" },
  { kunci: "fen", ikon: "fen" },
];

/* --- format TCN Chess.com (spesifikasi publik) --- */
const KODE_TCN =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?{~}(^)[_]@#$,./&-*++=";
const HURUF_PROMOSI = "qnrbkp";

function langkahDariTcn(kode) {
  if (!kode || kode.length !== 2) return null;
  const a = KODE_TCN.indexOf(kode[0]);
  let b = KODE_TCN.indexOf(kode[1]);
  if (a < 0 || b < 0) return null;
  let promosi;
  if (b > 63) {
    promosi = HURUF_PROMOSI[Math.floor((b - 64) / 3)];
    if (!promosi) return null;
    b = a + (a < 16 ? -8 : 8) + (((b - 1) % 3) - 1);
  }
  const bujur = (i) => "abcdefgh"[i % 8];
  const lintang = (i) => Math.floor(i / 8) + 1;
  return { from: bujur(a) + lintang(a), to: bujur(b) + lintang(b), promotion: promosi };
}

function susunPgnDariTcn(kepala, moveList) {
  const urutan = ["Event", "Site", "Date", "Round", "White", "Black", "Result"];
  const baris = [];
  const sudah = new Set();

  const buatHeader = (k, v) => `[${k} "${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`;
  for (const k of urutan) {
    if (kepala[k] !== undefined && kepala[k] !== "") {
      baris.push(buatHeader(k, kepala[k]));
      sudah.add(k);
    }
  }
  for (const k of Object.keys(kepala).sort()) {
    if (!sudah.has(k) && kepala[k] !== undefined && kepala[k] !== "") {
      baris.push(buatHeader(k, kepala[k]));
    }
  }
  if (!sudah.has("Event")) baris.unshift(buatHeader("Event", "Chess.com game"));
  if (!sudah.has("Site")) baris.push(buatHeader("Site", "https://www.chess.com"));

  const catur = new Chess();
  const sans = [];
  const kode2 = String(moveList ?? "");
  for (let i = 0; i < kode2.length; i += 2) {
    const tujuan = langkahDariTcn(kode2.slice(i, i + 2));
    if (!tujuan) throw new Error("tcn");
    const hasil = catur.move(tujuan);
    if (!hasil) throw new Error("tcn");
    sans.push(hasil.san);
  }
  // beri nomor langkah supaya bisa dibaca parser PGN mana pun
  const bernomor = [];
  let nomor = 1;
  sans.forEach((san, i) => {
    if (i % 2 === 0) bernomor.push(`${nomor++}.`);
    bernomor.push(san);
  });
  const hasilTag = kepala.Result && kepala.Result !== "*" ? ` ${kepala.Result}` : "";
  return `${baris.join("\n")}\n\n${bernomor.join(" ")}${hasilTag}\n`;
}

function ekstrakIdLichess(tautan) {
  try {
    const jalur = new URL(tautan).pathname.split("/").filter(Boolean);
    const diabaikan = new Set(["game", "embed", "export", "white", "black", "training"]);
    const segmen = jalur.find((s) => !diabaikan.has(s) && /^[A-Za-z0-9]{8,}$/.test(s));
    return segmen ? segmen.slice(0, 8) : null;
  } catch {
    return null;
  }
}

function ekstrakChessCom(tautan) {
  const cocok = tautan.match(/chess\.com\/game\/(?:(live|daily|master)\/)?(\d+)/i);
  if (!cocok) return null;
  return { tipe: (cocok[1] || "live").toLowerCase(), id: cocok[2] };
}

async function ambilPgn(tautan) {
  const alamat = tautan.trim();
  if (/lichess\.org\//i.test(alamat)) {
    const id = ekstrakIdLichess(alamat);
    if (!id) throw new Error("bentuk");
    const jawaban = await fetch(`https://lichess.org/game/export/${id}`, {
      headers: { Accept: "text/plain" },
    });
    if (!jawaban.ok) throw new Error("jaringan");
    return await jawaban.text();
  }
  if (/chess\.com/i.test(alamat)) {
    const info = ekstrakChessCom(alamat);
    if (!info) throw new Error("bentuk");
    const jawaban = await fetch(`https://www.chess.com/callback/${info.tipe}/game/${info.id}`);
    if (!jawaban.ok) throw new Error("jaringan");
    const isi = await jawaban.json();
    if (!isi?.game) throw new Error("bentuk");
    return susunPgnDariTcn(isi.game.pgnHeaders ?? {}, isi.game.moveList ?? "");
  }
  throw new Error("bentuk");
}

function KartuTipe({ aktif, ikon, label, tanpaLabel, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={aktif}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-borderRoundness border-2 px-2 py-2.5 transition-colors ${aktif
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
    return (
      <svg viewBox="0 0 16 16" className="h-6 w-6 fill-current" aria-hidden="true">
        <path d="M8.01005 0.858582L6.01005 14.8586L7.98995 15.1414L9.98995 1.14142L8.01005 0.858582ZM12.5 11.5L11.0858 10.0858L13.1716 8L11.0858 5.91422L12.5 4.5L16 8L12.5 11.5ZM2.82843 8L4.91421 10.0858L3.5 11.5L0 8L3.5 4.5L4.91421 5.91422L2.82843 8Z" />
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
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M18.5708 20C19.8328 20 20.8568 18.977 20.8568 17.714V13.143L21.9998 12L20.8568 10.857V6.286C20.8568 5.023 19.8338 4 18.5708 4M5.429 4C4.166 4 3.143 5.023 3.143 6.286V10.857L2 12L3.143 13.143V17.714C3.143 18.977 4.166 20 5.429 20M7.5 12H7.51M12 12H12.01M16.5 12H16.51M8 12C8 12.2761 7.77614 12.5 7.5 12.5C7.22386 12.5 7 12.2761 7 12C7 11.7239 7.22386 11.5 7.5 11.5C7.77614 11.5 8 11.7239 8 12ZM12.5 12C12.5 12.2761 12.2761 12.5 12 12.5C11.7239 12.5 11.5 12.2761 11.5 12C11.5 11.7239 11.7239 11.5 12 11.5C12.2761 11.5 12.5 11.7239 12.5 12ZM17 12C17 12.2761 16.7761 12.5 16.5 12.5C16.2239 12.5 16 12.2761 16 12C16 11.7239 16.2239 11.5 16.5 11.5C16.7761 11.5 17 11.7239 17 12Z" />
    </svg>
  );
}

export default function PopupImpor({ onTutup, onImpor, lebarKiri = 0 }) {
  const { t } = useI18n();
  const [tipe, setTipe] = useState("pgn");
  const [pgn, setPgn] = useState("");
  const [tautan, setTautan] = useState("");
  const [fen, setFen] = useState("");
  const [galat, setGalat] = useState(null);
  const [memuat, setMemuat] = useState(false);

  async function kirim() {
    setGalat(null);
    if (tipe === "pgn") {
      if (!pgn.trim()) return;
      imporPgnKeBasisData(pgn).catch(() => {});
      onImpor({ format: "pgn", string: pgn });
      return;
    }
    if (tipe === "fen") {
      if (!fen.trim()) return;
      onImpor({ format: "fen", string: fen });
      return;
    }
    if (!tautan.trim()) return;
    setMemuat(true);
    try {
      const pgn2 = await ambilPgn(tautan);
      if (!pgn2 || !pgn2.trim()) throw new Error("kosong");
      imporPgnKeBasisData(pgn2).catch(() => {});
      onImpor({ format: "pgn", string: pgn2 });
    } catch (e) {
      const bentuk = e?.message === "bentuk";
      setGalat(t(bentuk ? "analisa.impor.galatTautan" : "analisa.impor.galatAmbil"));

      setMemuat(false);
    }
  }

  const kosong =
    (tipe === "pgn" && !pgn.trim()) ||
    (tipe === "online" && !tautan.trim()) ||
    (tipe === "fen" && !fen.trim());

  const labelTombol = t(tipe === "online" ? "analisa.impor.ambil" : "analisa.impor.analisa");

  return (
    <Popup
      judul={t("analisa.impor.judul")}
      subjudul={t("analisa.impor.tipe")}
      onTutup={onTutup}
      fullLayar
      lebarKiri={lebarKiri}
      className="max-w-none"
    >
      <div className="grid grid-cols-3 gap-2">
        {TIPE.map((ti) => (
          <KartuTipe
            key={ti.kunci}
            aktif={tipe === ti.kunci}
            ikon={ti.ikon}
            tanpaLabel={ti.kunci === "online"}
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
          <textarea
            spellCheck={false}
            rows={8}
            value={pgn}
            onChange={(e) => setPgn(e.currentTarget.value)}
            data-uji="impor-pgn"
            placeholder={t("analisa.form.tempelPgn")}
            aria-label="PGN"
            className="w-full resize-y rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      ) : tipe === "online" ? (
        <div className="mt-4">
          <input
            type="url"
            value={tautan}
            onChange={(e) => setTautan(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !kosong && !memuat) {
                e.preventDefault();
                kirim();
              }
            }}
            data-uji="impor-online"
            placeholder={t("analisa.impor.onlinePlaceholder")}
            aria-label={t("analisa.impor.onlineLabel")}
            className="w-full rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
          />
          <p className="mt-1.5 text-[11px] leading-4 text-foregroundGrey">
            {t("analisa.impor.onlineBantu")}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <textarea
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
            placeholder={t("analisa.form.tempelFen")}
            aria-label="FEN"
            className="w-full resize-none rounded-borderRoundness border border-border bg-backgroundBoxBox px-3 py-2 font-mono text-xs leading-5 text-foreground outline-none transition-colors placeholder:text-foregroundGrey hover:border-borderHighlighted focus:border-borderHighlighted"
          />
        </div>
      )}

      {galat ? (
        <p data-uji="galat-impor" className="mt-2 text-xs text-lossRed">{galat}</p>
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
    </Popup>
  );
}
