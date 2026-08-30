import { Link } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

const BOARD_PIECES = [
  ["r", "", "", "", "", "r", "k", ""],
  ["", "", "p", "", "", "p", "b", "p"],
  ["", "", "p", "q", "", "B", "p", ""],
  ["p", "", "N", "", "p", "", "", ""],
  ["", "", "", "p", "P", "", "b", ""],
  ["", "P", "", "P", "", "", "Q", ""],
  ["P", "", "P", "", "N", "P", "P", "P"],
  ["R", "", "", "", "K", "", "", "R"],
];

const HIGHLIGHTED_SQUARES = new Set(["g4", "e2", "g7", "f6"]);

function ChessBoardComponent() {
  return (
    /* Container Papan: Dibatasi max-w-[380px] agar ukurannya pas & kompak seperti ChessPuzzle.net */
    <div className="w-full max-w-[380px] mx-auto lg:ml-auto lg:mr-0 flex flex-col">
      {/* Header Informasi Partai (Persis seperti judul match di ChessPuzzle.net) */}
      <div className="flex items-center justify-between pb-1 text-[11px] font-mono text-slate-500 font-medium">
        <span>Bazyrsyrenov - Yashmetov</span>
        <span>Moscow 2020</span>
      </div>

      {/* Frame Papan Catur */}
      <div className="relative w-full aspect-square select-none overflow-hidden border border-slate-400 bg-white">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {RANKS.map((rank, rIdx) =>
            FILES.map((file, fIdx) => {
              const isLight = (rIdx + fIdx) % 2 === 0;
              const piece = BOARD_PIECES[rIdx][fIdx] || "";
              const squareName = `${file}${rank}`;
              const isHighlighted = HIGHLIGHTED_SQUARES.has(squareName);

              return (
                <div
                  key={squareName}
                  className="relative flex items-center justify-center"
                  style={{ backgroundColor: isLight ? "#f0d9b5" : "#b58863" }}
                >
                  {/* Highlight Taktis */}
                  {isHighlighted && (
                    <span className="absolute inset-0 bg-yellow-400/25 pointer-events-none" />
                  )}

                  {/* Koordinat File (a-h) */}
                  {rIdx === 7 && (
                    <span
                      className="absolute bottom-0.5 right-1 text-[8px] font-bold leading-none uppercase"
                      style={{ color: isLight ? "#b58863" : "#f0d9b5" }}
                    >
                      {file}
                    </span>
                  )}

                  {/* Koordinat Rank (1-8) */}
                  {fIdx === 0 && (
                    <span
                      className="absolute top-0.5 left-1 text-[8px] font-bold leading-none"
                      style={{ color: isLight ? "#b58863" : "#f0d9b5" }}
                    >
                      {rank}
                    </span>
                  )}

                  {/* Bidak Catur */}
                  {piece && (
                    <div className="w-[82%] h-[82%] flex items-center justify-center pointer-events-none">
                      <ChessPiece piece={piece} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Panah Taktis */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox="0 0 100 100"
        >
          <defs>
            <marker
              id="arrowhead-red"
              viewBox="0 0 8 8"
              orient="auto"
              markerWidth="4"
              markerHeight="4"
              refX="7"
              refY="4"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#b91c1c" />
            </marker>
            <marker
              id="arrowhead-blue"
              viewBox="0 0 8 8"
              orient="auto"
              markerWidth="4"
              markerHeight="4"
              refX="7"
              refY="4"
            >
              <path d="M0,0 L8,4 L0,8 Z" fill="#1d4ed8" />
            </marker>
          </defs>

          <line
            x1="81.25"
            y1="56.25"
            x2="57.5"
            y2="78.75"
            stroke="#b91c1c"
            strokeWidth="1.6"
            strokeLinecap="square"
            markerEnd="url(#arrowhead-red)"
          />

          <line
            x1="81.25"
            y1="18.75"
            x2="69.5"
            y2="30.5"
            stroke="#1d4ed8"
            strokeWidth="1.6"
            strokeLinecap="square"
            markerEnd="url(#arrowhead-blue)"
          />
        </svg>
      </div>

      {/* Footer Indikator Giliran Melangkah (Gaya ChessPuzzle.net) */}
      <div className="mt-1.5 w-full py-1.5 px-3 text-center text-xs font-semibold uppercase tracking-wider text-black">
        Hitam Melangkah (Black to win)
      </div>
    </div>
  );
}

function KalimatDenganLangkah({ template, langkah, warna }) {
  const [pra, pasca = ""] = template.split("{x}");
  return (
    <>
      {pra}
      <span
        className="font-mono font-bold px-1.5 py-[1px] text-xs bg-slate-100 border border-slate-200"
        style={{ color: warna }}
      >
        {langkah}
      </span>
      {pasca}
    </>
  );
}

function MovesByRatingChartComponent() {
  const { t } = useI18n();
  return (
    <div id="analysis-moves-by-rating" className="flex h-full w-full flex-col">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-2">
        <span className="text-[11px] font-bold tracking-wider uppercase text-slate-800">
          {t("tipsTekaTeki.grafikJudul")}
        </span>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#fcbba1]" /> Bxe2
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#238b45]" /> Bxf6
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#cb181d]" /> Qxf6
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 bg-[#fc9272]" /> Qxc5
          </span>
        </div>
      </div>

      <div className="relative w-full flex-1 min-h-[170px] pt-3">
        <svg
          viewBox="0 0 309 180"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <line stroke="#94A3B8" strokeWidth="1" x1="60" y1="15" x2="60" y2="155" />
          <line stroke="#94A3B8" strokeWidth="1" x1="60" y1="155" x2="259" y2="155" />

          <g>
            <line stroke="#E2E8F0" strokeWidth="1" x1="60" y1="155" x2="259" y2="155" />
            <line stroke="#E2E8F0" strokeWidth="1" x1="60" y1="120" x2="259" y2="120" />
            <line stroke="#E2E8F0" strokeWidth="1" x1="60" y1="85" x2="259" y2="85" />
            <line stroke="#E2E8F0" strokeWidth="1" x1="60" y1="50" x2="259" y2="50" />
            <line stroke="#E2E8F0" strokeWidth="1" x1="60" y1="15" x2="259" y2="15" />
          </g>

          <g>
            <line stroke="#E2E8F0" strokeWidth="1" x1="84.875" y1="15" x2="84.875" y2="155" />
            <line stroke="#E2E8F0" strokeWidth="1" x1="134.625" y1="15" x2="134.625" y2="155" />
            <line stroke="#E2E8F0" strokeWidth="1" x1="184.375" y1="15" x2="184.375" y2="155" />
            <line stroke="#E2E8F0" strokeWidth="1" x1="234.125" y1="15" x2="234.125" y2="155" />
          </g>

          <text x="52" y="158" fill="#475569" fontSize="9" fontWeight="500" textAnchor="end">0%</text>
          <text x="52" y="123" fill="#475569" fontSize="9" fontWeight="500" textAnchor="end">25%</text>
          <text x="52" y="88" fill="#475569" fontSize="9" fontWeight="500" textAnchor="end">50%</text>
          <text x="52" y="53" fill="#475569" fontSize="9" fontWeight="500" textAnchor="end">75%</text>
          <text x="52" y="18" fill="#475569" fontSize="9" fontWeight="500" textAnchor="end">100%</text>

          <text
            x="-85"
            y="12"
            transform="rotate(-90)"
            fill="#475569"
            fontSize="9"
            fontWeight="600"
            textAnchor="middle"
            className="tracking-wider uppercase"
          >
            {t("tipsTekaTeki.grafikSumbuY")}
          </text>

          <text x="84.875" y="170" fill="#475569" fontSize="9" fontWeight="500" textAnchor="middle">1200</text>
          <text x="134.625" y="170" fill="#475569" fontSize="9" fontWeight="500" textAnchor="middle">1400</text>
          <text x="184.375" y="170" fill="#475569" fontSize="9" fontWeight="500" textAnchor="middle">1600</text>
          <text x="234.125" y="170" fill="#475569" fontSize="9" fontWeight="500" textAnchor="middle">1800</text>

          <path
            stroke="#fcbba1"
            fill="none"
            strokeWidth="2"
            strokeLinecap="square"
            d="M60,110 L84.875,100 L109.75,90 L134.625,82 L159.5,75 L184.375,66 L209.25,62 L234.125,57 L259,55"
          />
          <circle cx="84.875" cy="100" r="2.5" fill="#fcbba1" />
          <circle cx="134.625" cy="82" r="2.5" fill="#fcbba1" />
          <circle cx="184.375" cy="66" r="2.5" fill="#fcbba1" />
          <circle cx="234.125" cy="57" r="2.5" fill="#fcbba1" />
          <text x="265" y="58" fill="#475569" fontSize="10" fontWeight="600">Bxe2</text>

          <path
            stroke="#238b45"
            fill="none"
            strokeWidth="2"
            strokeLinecap="square"
            d="M60,105 L84.875,112 L109.75,118 L134.625,123 L159.5,127 L184.375,132 L209.25,135 L234.125,138 L259,140"
          />
          <circle cx="84.875" cy="112" r="2.5" fill="#238b45" />
          <circle cx="134.625" cy="123" r="2.5" fill="#238b45" />
          <circle cx="184.375" cy="132" r="2.5" fill="#238b45" />
          <circle cx="234.125" cy="138" r="2.5" fill="#238b45" />
          <text x="265" y="142" fill="#238b45" fontSize="10" fontWeight="600">Bxf6</text>

          <path
            stroke="#cb181d"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="square"
            d="M60,135 L84.875,137 L109.75,140 L134.625,142 L159.5,144 L184.375,146 L209.25,147 L234.125,148 L259,149"
          />
          <text x="265" y="151" fill="#cb181d" fontSize="9" fontWeight="600">Qxf6</text>

          <path
            stroke="#fc9272"
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="square"
            d="M60,140 L84.875,142 L109.75,144 L134.625,145 L159.5,146 L184.375,147 L209.25,147 L234.125,148 L259,147"
          />
          <text x="265" y="161" fill="#fc9272" fontSize="9" fontWeight="600">Qxc5</text>
        </svg>
      </div>
    </div>
  );
}

export default function TekaTekiKonten() {
  const { t } = useI18n();

  const poinLatihan = [
    "Pilih tingkat kesulitan",
    "Kuasai motif-motif spesifik seperti garpu kuda.",
    "Latih pola skakmat, seperti skakmat tertutup.",
    "Jelajahi taktik dari pembukaan favorit Anda",
    "Buka berbagai kemungkinan untuk pelatihan yang dipersonalisasi.",
  ];

  return (
    <HalamanIsi
      title={t("tipsTekaTeki.judul")}
      parent={t("nav.programKami")}
      parentPath="/program-kami"
      description={t("tipsTekaTeki.deskripsi")}
      next={{ to: "/teka-teki", judul: t("tekaTeki.judul") }}
    >
      <PageArtikel title={t("tipsTekaTeki.artikel")}>
        {/* HERO SECTION: GRID 2 KOLOM SEPERTI CHESSPUZZLE.NET */}
        <div className="grid w-full grid-cols-1 gap-8 border-b border-slate-200 pb-10 lg:grid-cols-12 lg:items-center">
          
          {/* KOLOM KIRI: TEKS DESKRIPSI & CTA (6/12) */}
          <div className="flex flex-col justify-center lg:col-span-6">
            <h3 className="m-0 mb-4 text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              Latih Taktik Catur dengan Ribuan Posisi Realistis
            </h3>
            
            <ul className="m-0 mb-6 space-y-2.5 list-none p-0">
              {poinLatihan.map((teks, idx) => (
                <li
                  key={teks}
                  className="flex items-start gap-3 text-[14px] leading-relaxed text-slate-700"
                >
                  <span className="font-mono font-bold text-slate-400 text-xs mt-0.5">
                    0{idx + 1}
                  </span>
                  <span>{teks}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/teka-teki"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-none border border-slate-900 bg-slate-950 px-6 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-slate-800 no-underline"
              style={{ textDecoration: "none" }}
            >
              <span>{t("tipsTekaTeki.mulai")}</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {/* KOLOM KANAN: PAPAN CATUR (6/12) */}
          <div className="flex flex-col items-center lg:col-span-6 lg:items-end">
            <ChessBoardComponent />
          </div>
        </div>

        {/* SECTION BOTTOM: DATA & ANALISIS */}
        <div className="grid w-full grid-cols-1 gap-10 pt-10 lg:grid-cols-12 lg:items-start">
          
          {/* GRAFIK (6 Kolom) */}
          <div className="lg:col-span-6">
            <MovesByRatingChartComponent />
          </div>

          {/* ANALISIS (6 Kolom) */}
          <div className="flex flex-col lg:col-span-6">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h4 className="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-800">
                  {t("tipsTekaTeki.analisisJudul")}
                </h4>
              </div>

              {/* Metrik — sejajar, tanpa latar belakang */}
              <div className="grid grid-cols-1 sm:grid-cols-3 font-mono text-xs items-center mb-4 border-b border-slate-200 pb-1">
                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                    {t("tipsTekaTeki.langkahTerbaik")}
                  </span>
                  <span className="text-sm font-bold text-emerald-700">Bxf6</span>
                </div>

                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                    {t("tipsTekaTeki.kesalahanUmum")}
                  </span>
                  <span className="text-sm font-bold text-amber-700">Bxe2</span>
                </div>

                <div className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-sans font-bold">
                    {t("tipsTekaTeki.kesalahanLain")}
                  </span>
                  <span className="text-sm font-bold text-red-700">Qxf6</span>
                </div>
              </div>

              <p className="m-0 text-justify text-[13px] leading-relaxed text-slate-600">
                <KalimatDenganLangkah
                  template={t("tipsTekaTeki.analisisBag1")}
                  langkah="Bxe2"
                  warna="#dc2626"
                />{" "}
                <KalimatDenganLangkah
                  template={t("tipsTekaTeki.analisisBag2")}
                  langkah="Bxf6"
                  warna="#16a34a"
                />
              </p>
            </div>
          </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}