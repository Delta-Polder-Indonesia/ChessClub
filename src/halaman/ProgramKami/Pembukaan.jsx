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
                const piece = OPENING_BOARD_PIECES[rIdx][fIdx] || "";
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
                  {[
                    { move: "a6", note: "Morphy Defense (Utama)" },
                    { move: "Nf6", note: "Berlin Defense" },
                    { move: "d6", note: "Steinitz Defense" },
                    { move: "f5", note: "Schliemann Gambit" },
                  ].map((item) => (
                    <div
                      key={item.move}
                      className="flex items-center gap-2 border-b border-slate-300 py-1.5"
                    >
                      <span className="font-mono text-xs font-bold text-black">
                        3... {item.move}
                      </span>
                      <span className="text-[10px] text-black pl-2">
                        {item.note}
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
              <h3>Sejarah</h3>
              <p>
                Ruy Lopez dinamai menurut Ruy López de Segura, seorang pendeta Spanyol abad ke-16 yang secara
                sistematis mempelajari pembukaan ini dan pembukaan lainnya dalam buku catur setebal 150 halaman,
                Libro del Axedrez, yang ditulis pada tahun 1561. Lopez menganjurkan 3.Bb5 sebagai langkah yang lebih
                unggul daripada 3.Bc4, dan berpendapat bahwa Hitam harus memainkan 2...d6 (Pertahanan Philidor) untuk
                menghindarinya. Meskipun menyandang namanya, pembukaan khusus ini termasuk dalam manuskrip Göttingen,
                yang berasal dari sekitar tahun 1490. Ruy Lopez tidak mendapatkan popularitas luas hingga pertengahan
                abad ke-19, ketika ahli teori Finlandia-Rusia Carl Jaenisch menerbitkan artikel terperinci tentang
                1.e4 e5 dalam edisi Desember 1847 dari Le Palamède, majalah catur pertama di dunia. Versi ringkasnya
                muncul di Chess Player's Chronicle pada tahun 1848, diikuti oleh artikel tambahan di publikasi yang
                sama pada tahun 1849.
              </p>
              <p>
                Ruy Lopez telah lama dianggap sebagai pembukaan terpenting di antara Permainan Terbuka pada tingkat
                master. Hampir setiap pemain telah menggunakannya pada suatu titik dalam karier mereka, seringkali
                dengan kedua warna. Karena kesulitan bagi Hitam dalam mencapai kesetaraan, julukan umum untuk pembukaan
                ini adalah "Penyiksaan Spanyol".
              </p>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}