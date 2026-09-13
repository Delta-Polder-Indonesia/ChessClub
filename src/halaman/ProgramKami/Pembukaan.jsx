import { Link } from "react-router-dom";
import { Chess } from "chess.js";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

/**
 * Kandidat langkah lanjutan Ruy Lopez; `note` adalah kunci kamus supaya
 * catatannya ikut berganti bahasa. Daftar ini bukan penilaian langkah
 * terbaik — hanya lanjutan yang lazim dibahas di buku pembukaan.
 */
const LANJUTAN_RUY_LOPEZ = [
  { move: "a6", note: "bukuPembukaan.lanjutan.morphy" },
  { move: "Nf6", note: "bukuPembukaan.lanjutan.berlin" },
  { move: "d6", note: "bukuPembukaan.lanjutan.steinitz" },
  { move: "f5", note: "bukuPembukaan.lanjutan.schliemann" },
];

/**
 * Posisi Ruy Lopez: 1. e4 e5 2. Nf3 Nc6 3. Bb5. Papan mini di latar memakai
 * dua variannya — satu bidak diangkat supaya 36 papan kecil tidak tampak
 * seragam — sehingga posisinya disimpan sebagai FEN, bukan matriks salinan.
 */
const FEN_RUY_LOPEZ =
  "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3";
const FEN_VARIAN = [
  FEN_RUY_LOPEZ,
  // tanpa pion e4
  "r1bqkbnr/pppp1ppp/2n5/1B2p3/8/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
  // tanpa kuda f3
  "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/8/PPPP1PPP/RNBQK2R b KQkq - 3 3",
];

/** Matriks bidak (huruf besar = putih) dari sebuah FEN. */
function matriksDariFen(fen) {
  return new Chess(fen)
    .board()
    .map((baris) =>
      baris.map((petak) =>
        petak ? (petak.color === "w" ? petak.type.toUpperCase() : petak.type) : ""
      )
    );
}

/** Papan utama dan papan-papan mini, dihitung sekali saat modul dimuat. */
const PAPAN_RUY_LOPEZ = matriksDariFen(FEN_RUY_LOPEZ);
const PAPAN_VARIAN = FEN_VARIAN.map(matriksDariFen);

/** Petak asal-tujuan langkah terakhir (Bf1-b5) untuk disorot. */
const OPENING_HIGHLIGHT = new Set(["b5", "f1"]);

function MiniOpeningBoard({ variant = 0 }) {
  const pieces = PAPAN_VARIAN[variant % 3];

  return (
    <div className="aspect-square w-full overflow-hidden border border-slate-300/60 bg-[#f0d9b5]">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {RANKS.map((rank, rIdx) =>
          FILES.map((file, fIdx) => {
            const piece = pieces[rIdx][fIdx] || "";
            return (
              <div
                key={`${file}${rank}`}
                className="flex items-center justify-center"
                style={{
                  backgroundColor: (rIdx + fIdx) % 2 === 0 ? "#f0d9b5" : "#b58863",
                }}
              >
                {piece && (
                  <div className="h-[90%] w-[92%]">
                    <ChessPiece piece={piece} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function OpeningBookBoardComponent() {
  return (
    <div className="w-full max-w-[380px] mx-auto lg:ml-auto lg:mr-0 flex flex-col">
      {/* Header Nama Opening & Kode ECO */}
      <div className="flex items-center gap-3 pb-1.5 text-[11px] font-mono text-slate-600">
        <span className="font-bold text-slate-900 uppercase tracking-wider">
          Ruy Lopez
        </span>
        <span className="font-bold px-1.5 py-0.5 text-[10px] text-black">
          C60
        </span>
      </div>

      {/* Frame Visual Papan Catur Utama & Mini Board Stack */}
      <div className="relative aspect-square w-full overflow-hidden">
        {/* Layer Mini Boards (Latar Belakang Eksplorasi) */}
        <div className="absolute left-0 top-0 grid w-[58%] grid-cols-6 gap-0.5 opacity-40 pointer-events-none">
          {Array.from({ length: 36 }, (_, i) => (
            <MiniOpeningBoard key={i} variant={i} />
          ))}
        </div>

        {/* Papan Catur Utama (Overlapping) */}
        <div className="absolute bottom-0 right-0 z-10 aspect-square w-[80%] border-l border-t border-slate-400 bg-[#f0d9b5]">
          <div className="grid h-full w-full grid-cols-8 grid-rows-8">
            {RANKS.map((rank, rIdx) =>
              FILES.map((file, fIdx) => {
                const squareName = `${file}${rank}`;
                const piece = PAPAN_RUY_LOPEZ[rIdx][fIdx] || "";
                const highlighted = OPENING_HIGHLIGHT.has(squareName);

                return (
                  <div
                    key={squareName}
                    className="relative flex items-center justify-center"
                    style={{
                      backgroundColor:
                        (rIdx + fIdx) % 2 === 0 ? "#f0d9b5" : "#b58863",
                    }}
                  >
                    {/* Highlight Langkah Bb5 */}
                    {highlighted && (
                      <span className="absolute inset-0 bg-red-700/25 pointer-events-none" />
                    )}

                    {/* Koordinat File */}
                    {rIdx === 7 && (
                      <span
                        className="absolute bottom-0.5 right-1 text-[8px] font-bold uppercase leading-none"
                        style={{
                          color: (rIdx + fIdx) % 2 === 0 ? "#b58863" : "#f0d9b5",
                        }}
                      >
                        {file}
                      </span>
                    )}

                    {/* Koordinat Rank */}
                    {fIdx === 0 && (
                      <span
                        className="absolute left-1 top-0.5 text-[8px] font-bold leading-none"
                        style={{
                          color: (rIdx + fIdx) % 2 === 0 ? "#b58863" : "#f0d9b5",
                        }}
                      >
                        {rank}
                      </span>
                    )}

                    {/* Bidak Catur */}
                    {piece && (
                      <div className="relative z-10 h-[86%] w-[86%] pointer-events-none">
                        <ChessPiece piece={piece} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Panah Langkah Bf1 -> b5 */}
          <svg
            className="pointer-events-none absolute inset-0 z-20 h-full w-full"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="opening-arrow-professional"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="4"
                markerHeight="4"
                orient="auto"
              >
                <path d="M0 0L10 5L0 10Z" fill="#b91c1c" />
              </marker>
            </defs>
            <line
              x1="68.75"
              y1="93.75"
              x2="18.75"
              y2="43.75"
              stroke="#b91c1c"
              strokeWidth="1.6"
              strokeLinecap="square"
              markerEnd="url(#opening-arrow-professional)"
            />
          </svg>
        </div>
      </div>

      {/* Footer Status Pembukaan */}
      <div className="mt-1.5 w-full py-1.5 px-3 text-center text-xs font-semibold uppercase tracking-wider text-black">
        Posisi Kunci: 3. Bb5
      </div>
    </div>
  );
}

/** Kalimat info Ruy Lopez dengan sisipan notasi ber-format. */
function KalimatInfo({ t }) {
  const [pra, sisa = ""] = t("bukuPembukaan.infoTeks").split("{x}");
  const [tengah, akhir = ""] = sisa.split("{label}");
  return (
    <>
      {pra}
      <span className="font-mono font-bold px-1.5 py-[1px] text-xs border border-slate-200 text-black mx-1">
        1. e4 e5 2. Nf3 Nc6 3. Bb5
      </span>
      {tengah}
      <span className="font-bold text-black underline decoration-slate-300">
        Ruy Lopez (C60)
      </span>
      {akhir}
    </>
  );
}

export default function Pembukaan() {
  const { t } = useI18n();

  return (
    <HalamanIsi
      title={t("bukuPembukaan.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("bukuPembukaan.deskripsi")}
      next={{ to: "/papan-interaktif", judul: t("papan.judul") }}
    >
      <PageArtikel title={t("bukuPembukaan.artikel")}>
        {/* HERO GRID SECTION: 2 Kolom Sejajar (Corporate Flat) */}
        <div className="grid w-full grid-cols-1 gap-8 border-b border-slate-200 pb-10 lg:grid-cols-12 lg:items-start">
          
          {/* KOLOM KIRI (6/12): Deskripsi & CTA */}
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="m-0 mb-4 text-[15px] leading-relaxed text-slate-700">
                {t("bukuPembukaan.paragraf1")}
              </p>
              <p className="m-0 mb-6 text-[15px] leading-relaxed text-slate-700">
                {t("bukuPembukaan.paragraf2")}
              </p>
            </div>

            <Link
              to="/papan-interaktif"
              className="inline-flex w-fit items-center justify-center gap-2.5 rounded-none border border-slate-900 bg-slate-950 px-6 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-slate-800 no-underline"
              style={{ textDecoration: "none" }}
            >
              <span>{t("bukuPembukaan.buka")}</span>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeWidth="2.5"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>

          {/* KOLOM KANAN (6/12): Demo Papan Catur Pembukaan */}
          <div className="flex flex-col items-center lg:col-span-6 lg:items-end">
            <OpeningBookBoardComponent />
          </div>
        </div>

        {/* SECTION BOTTOM: Teori & Kandidat Langkah Berikutnya */}
        <div className="grid w-full grid-cols-1 gap-8 pt-8 lg:grid-cols-12 lg:items-start">
          
          {/* KANAN INFORMASI (12/12 - Full Width Container untuk Teori) */}
          <div className="lg:col-span-12">
            <div className="flex flex-col gap-4 p-5">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-slate-900" />
                  <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-black">
                    {t("bukuPembukaan.demoJudul")}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-black">
                  {t("bukuPembukaan.demoTantangan")}
                </span>
              </div>

              {/* Deskripsi Teori Notasi */}
              <p className="m-0 text-xs sm:text-sm leading-relaxed text-black">
                <KalimatInfo t={t} />
              </p>

              {/* Kandidat Langkah Berikutnya (Main Continuation Moves) */}
              <div className="mt-2 border-t border-slate-200 pt-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-black mb-2">
                  {t("papan.langkahBerikutnya")}
                </span>
                
                <div className="grid w-full grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-4">
                  {LANJUTAN_RUY_LOPEZ.map((item) => (
                    <div
                      key={item.move}
                      className="flex items-center gap-2 border-b border-slate-300 py-1.5"
                    >
                      <span className="font-mono text-xs font-bold text-black">
                        3... {item.move}
                      </span>
                      <span className="text-[10px] text-black pl-2">
                        {t(item.note)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* SEJARAH RUY LOPEZ */}
        <div className="grid w-full grid-cols-1 gap-8 pt-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-12">
            <div className="flex flex-col gap-4">
              <h3>{t("bukuPembukaan.sejarahJudul")}</h3>
              <p>{t("bukuPembukaan.sejarahAyat1")}</p>
              <p>{t("bukuPembukaan.sejarahAyat2")}</p>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}