import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

/** Posisi Ruy Lopez: 1. e4 e5 2. Nf3 Nc6 3. Bb5 */
const OPENING_BOARD_PIECES = [
  ["r", "", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "", "p", "p", "p"],
  ["", "", "n", "", "", "", "", ""],
  ["", "B", "", "", "p", "", "", ""],
  ["", "", "", "", "P", "", "", ""],
  ["", "", "", "", "", "N", "", ""],
  ["P", "P", "P", "P", "", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "", "", "R"],
];

/** Petak asal-tujuan langkah terakhir (Bf1-b5) untuk disorot. */
const OPENING_HIGHLIGHT = new Set(["b5", "f1"]);

function MiniOpeningBoard({ variant = 0 }) {
  const pieces = OPENING_BOARD_PIECES.map((row) => row.slice());
  if (variant % 3 === 1) pieces[4][4] = "";
  if (variant % 3 === 2) pieces[5][5] = "";
  return <div className="aspect-square w-full overflow-hidden rounded-[2px] border border-[#d5c4ae]/40 bg-[#d8c3a5] opacity-90">
    <div className="grid h-full w-full grid-cols-8 grid-rows-8">
      {RANKS.map((rank, rIdx) => FILES.map((file, fIdx) => {
        const piece = pieces[rIdx][fIdx] || "";
        return <div key={`${file}${rank}`} className="flex items-center justify-center" style={{ backgroundColor: (rIdx + fIdx) % 2 === 0 ? "#ead6b8" : "#b9a98d" }}>
          {piece && <div className="h-[92%] w-[92%]"><ChessPiece piece={piece} /></div>}
        </div>;
      }))}
    </div>
  </div>;
}

function OpeningBookBoardComponent() {
  return (
    <div className="relative aspect-square w-full max-w-[520px] overflow-hidden bg-transparent">
      <div className="absolute left-0 top-0 grid w-[58%] grid-cols-6 gap-1 opacity-75">
        {Array.from({ length: 36 }, (_, i) => <MiniOpeningBoard key={i} variant={i} />)}
      </div>
      <div className="absolute bottom-0 right-0 z-10 aspect-square w-[78%] overflow-hidden bg-[#d8c3a5]">
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {RANKS.map((rank, rIdx) => FILES.map((file, fIdx) => {
            const squareName = `${file}${rank}`;
            const piece = OPENING_BOARD_PIECES[rIdx][fIdx] || "";
            const highlighted = OPENING_HIGHLIGHT.has(squareName);
            return <div key={squareName} className="relative flex items-center justify-center" style={{ backgroundColor: (rIdx + fIdx) % 2 === 0 ? "#ead6b8" : "#b9a98d" }}>
              {highlighted && <span className="absolute inset-0 bg-[#c56555]/30" />}
              {rIdx === 7 && <span className="absolute bottom-0.5 right-1 text-[8px] font-bold text-slate-700/70">{file}</span>}
              {fIdx === 0 && <span className="absolute left-1 top-0.5 text-[8px] font-bold text-slate-700/70">{rank}</span>}
              {piece && <div className="relative z-10 h-[88%] w-[88%] drop-shadow-[0_2px_2px_rgba(0,0,0,.25)]"><ChessPiece piece={piece} /></div>}
            </div>;
          }))}
        </div>
        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <defs><marker id="opening-arrow-professional" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#bf5f52" /></marker></defs>
          <line x1="68.75" y1="93.75" x2="18.75" y2="43.75" stroke="#bf5f52" strokeWidth="1.4" markerEnd="url(#opening-arrow-professional)" opacity=".8" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Halaman konten Pembukaan — bagian kedua dari dua.
 * Memaparkan cara buku pembukaan bekerja (nama + kode ECO otomatis)
 * sebelum anggota masuk ke papan interaktif di /papan-interaktif.
 * Demo visual mengikuti markup aslinya di tab Beranda (bahasa Indonesia).
 */
export default function Pembukaan() {
  const { t, bahasa } = useI18n();
  return (
    <HalamanIsi
      title={t("bukuPembukaan.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("bukuPembukaan.deskripsi")}
      next={{ to: "/papan-interaktif", judul: t("papan.judul") }}
    >
      <PageArtikel title={t("bukuPembukaan.artikel")}>
        {bahasa === "en" && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            {t("bukuPembukaan.kontenHanyaId")}
          </p>
        )}
        <div className="flex w-full flex-col md:flex-row md:items-start md:gap-8 lg:gap-12">
          {/* Kolom Kiri: Teks & Tombol */}
          <div className="mb-6 w-full md:mb-0 md:w-2/5">
            <p>
              Mainkan langkah di papan bebas dan buku pembukaan akan langsung
              mengenali nama pembukaan beserta kode ECO-nya — mulai dari Ruy
              Lopez, Sicilian Najdorf, hingga Queen's Gambit.
            </p>
            <p>
              Lengkap dengan saran langkah berikutnya dan katalog 3.810 jalur
              pembukaan dari data lichess (lisensi CC0).
            </p>
            <Link
              to="/papan-interaktif"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-transparent px-6 py-3 font-medium text-gray-700 transition duration-200 hover:border-gray-500 hover:bg-gray-50 hover:text-gray-900 text-sm md:text-base no-underline"
            >
              Buka Opening Book
            </Link>
          </div>

          {/* Kolom Kanan: Papan & Info Pembukaan */}
          <div className="relative w-full md:w-3/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="mr-2 h-2.5 w-2.5 rounded-full bg-[#0b2f9f]" />
                <p className="font-semibold text-sm sm:text-base text-gray-800 m-0!">
                  Buku Pembukaan
                </p>
              </div>
              <span className="rounded bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 font-medium">
                C70
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-3 m-0!">
              Nama pembukaan muncul otomatis saat posisinya dikenali
            </p>

            <div className="flex flex-col gap-4 md:flex-row items-center md:items-start">
              {/* Sub-Kolom 1: Papan Catur (md:w-1/2) */}
              <div className="flex w-full justify-center md:w-1/2">
                <div className="w-full max-w-[304px] flex flex-col overflow-hidden rounded p-1">
                  <OpeningBookBoardComponent />
                </div>
              </div>

              {/* Sub-Kolom 2: Info Pembukaan (md:w-1/2) */}
              <div className="flex w-full flex-col md:w-1/2 gap-3">
                <div className="overflow-hidden rounded p-3 text-xs">
                  <h4 className="mb-2 text-sm font-semibold text-gray-800 m-0!">
                    Ruy Lopez
                  </h4>
                  <p className="mb-3 text-[11px] leading-relaxed text-gray-600 m-0!">
                    Setelah{" "}
                    <span className="font-mono font-semibold">
                      1. e4 e5 2. Nf3 Nc6 3. Bb5
                    </span>
                    , buku pembukaan langsung mengenali posisi ini sebagai{" "}
                    <span className="font-semibold text-gray-800">
                      Ruy Lopez (C70)
                    </span>
                    .
                  </p>

                  <p className="mb-2 text-[11px] font-semibold text-gray-700">
                    Langkah berikutnya
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Ba4", "Bxc6", "a6", "Nf6", "d6", "f5"].map((m) => (
                      <span
                        key={m}
                        className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-gray-700"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}
