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

/** Daftar pembukaan populer (contoh statistik, mengikuti data Lichess). */
const DAFTAR_PEMBUKAAN = [
  { nama: "King's Pawn Game", san: "e4", popularitas: 59, putih: 49, seri: 4, hitam: 47, fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Queen's Pawn Game", san: "d4", popularitas: 26, putih: 50, seri: 5, hitam: 45, fen: "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Zukertort Opening", san: "Nf3", popularitas: 4, putih: 51, seri: 4, hitam: 45, fen: "rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R w KQkq - 0 1" },
  { nama: "English Opening", san: "c4", popularitas: 3, putih: 51, seri: 4, hitam: 45, fen: "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Van't Kruijs Opening", san: "e3", popularitas: 2, putih: 48, seri: 3, hitam: 49, fen: "rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Hungarian Opening", san: "g3", popularitas: 2, putih: 50, seri: 4, hitam: 46, fen: "rnbqkbnr/pppppppp/8/8/8/6P1/PPPPPP1P/RNBQKBNR w KQkq - 0 1" },
  { nama: "Nimzo-Larsen Attack", san: "b3", popularitas: 2, putih: 50, seri: 4, hitam: 46, fen: "rnbqkbnr/pppppppp/8/8/8/1P6/P1PPPPPP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Bird Opening", san: "f4", popularitas: 1, putih: 50, seri: 4, hitam: 46, fen: "rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Mieses Opening", san: "d3", popularitas: 1, putih: 48, seri: 4, hitam: 48, fen: "rnbqkbnr/pppppppp/8/8/8/3P4/PPP1PPPP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Van Geet Opening", san: "Nc3", popularitas: 1, putih: 49, seri: 4, hitam: 47, fen: "rnbqkbnr/pppppppp/8/8/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 0 1" },
  { nama: "Polish Opening", san: "b4", popularitas: 0, putih: 52, seri: 3, hitam: 45, fen: "rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR w KQkq - 0 1" },
  { nama: "Saragossa Opening", san: "c3", popularitas: 0, putih: 49, seri: 3, hitam: 48, fen: "rnbqkbnr/pppppppp/8/8/8/2P5/PP1PPPPP/RNBQKBNR w KQkq - 0 1" },
];

/** Posisi legal setelah langkah pertama; dihitung sekali, bukan setiap render. */
const RINCIAN_PEMBUKAAN = DAFTAR_PEMBUKAAN.slice(1).map((pembukaan) => {
  const permainan = new Chess();
  const langkah = permainan.move(pembukaan.san);
  return {
    ...pembukaan,
    papan: matriksDariFen(permainan.fen()),
    asal: langkah.from,
    tujuan: langkah.to,
  };
});

function PapanMini({ pieces }) {
  return (
    <div className="aspect-square w-full overflow-hidden border border-slate-300/60 bg-[#e8e8e8]">
      <div className="grid h-full w-full grid-cols-8 grid-rows-8">
        {RANKS.map((rank, rIdx) =>
          FILES.map((file, fIdx) => {
            const piece = pieces[rIdx][fIdx] || "";
            return (
              <div
                key={`${file}${rank}`}
                className="flex items-center justify-center"
                style={{
                  backgroundColor: (rIdx + fIdx) % 2 === 0 ? "#e8e8e8" : "#6ab293",
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

function MiniOpeningBoard({ variant = 0 }) {
  return <PapanMini pieces={PAPAN_VARIAN[variant % 3]} />;
}

function MiniBoardFen({ fen }) {
  return <PapanMini pieces={matriksDariFen(fen)} />;
}

/**
 * Posisi setelah 1. e4 (Pembukaan Pion Raja) untuk papan besar tambahan.
 */
const FEN_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1";
const PAPAN_E4 = matriksDariFen(FEN_E4);

/** Bar evaluasi statis di kiri papan (nilai dalam pion, putih di bawah). */
function EvalBar({ nilai = 0.3 }) {
  const putih = Math.max(2, Math.min(98, Math.round(50 + nilai * 20)));
  return (
    <div className="flex w-5 shrink-0 flex-col gap-1 self-stretch">
      <div className="relative min-h-0 flex-1 overflow-hidden border border-slate-300/60 bg-slate-900">
        <div
          className="absolute bottom-0 left-0 right-0 bg-[#e8e8e8]"
          style={{ height: `${putih}%` }}
        />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-500/70" />
      </div>
      <div className="text-center text-[10px] font-mono font-bold leading-none text-slate-700">
        {nilai > 0 ? `+${nilai.toFixed(1)}` : nilai.toFixed(1)}
      </div>
    </div>
  );
}

/** Papan artikel mengikuti contoh e4, dengan sorotan dan panah langkah pertama. */
function PapanPembukaan({
  papan = PAPAN_E4,
  asal = "e2",
  tujuan = "e4",
  notasi = "e4",
  label = "Posisi setelah 1. e4",
}) {
  const x = (petak) => FILES.indexOf(petak[0]) * 12.5 + 6.25;
  const y = (petak) => RANKS.indexOf(petak[1]) * 12.5 + 6.25;
  const idPanah = `panah-pembukaan-${notasi}`;
  const jalur = notasi.startsWith("N")
    ? `M ${x(asal)} ${y(asal)} V ${y(tujuan)} H ${x(tujuan)}`
    : `M ${x(asal)} ${y(asal)} L ${x(tujuan)} ${y(tujuan)}`;
  return (
    <div role="img" aria-label={label} className="relative min-w-0 w-full max-w-[560px] overflow-hidden border border-slate-300/60 bg-[#e8e8e8]">
      <div className="grid aspect-square w-full grid-cols-8 grid-rows-8">
        {RANKS.map((rank, rIdx) =>
          FILES.map((file, fIdx) => {
            const squareName = `${file}${rank}`;
            const piece = papan[rIdx][fIdx] || "";
            const highlighted = squareName === asal || squareName === tujuan;

            return (
              <div
                key={squareName}
                className="relative flex items-center justify-center"
                style={{
                  backgroundColor:
                    (rIdx + fIdx) % 2 === 0 ? "#e8e8e8" : "#6ab293",
                }}
              >
                {/* Sorotan petak asal dan tujuan */}
                {highlighted && (
                  <span className="absolute inset-0 bg-red-700/25 pointer-events-none" />
                )}

                {/* Koordinat File */}
                {rIdx === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[9px] font-bold uppercase leading-none"
                    style={{
                      color: (rIdx + fIdx) % 2 === 0 ? "#6ab293" : "#e8e8e8",
                    }}
                  >
                    {file}
                  </span>
                )}

                {/* Koordinat Rank */}
                {fIdx === 0 && (
                  <span
                    className="absolute left-1 top-0.5 text-[9px] font-bold leading-none"
                    style={{
                      color: (rIdx + fIdx) % 2 === 0 ? "#6ab293" : "#e8e8e8",
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

      {/* Panah langkah; jalur siku untuk kuda */}
      <svg
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={idPanah}
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
        <path
          d={jalur}
          fill="none"
          stroke="#b91c1c"
          strokeWidth="1.6"
          strokeLinecap="square"
          markerEnd={`url(#${idPanah})`}
        />
      </svg>
    </div>
  );
}

/** Notasi langkah catur ber-format dalam teks artikel. */
function Notasi({ children }) {
  return <span className="whitespace-nowrap font-mono text-[0.9em] font-semibold text-slate-900">{children}</span>;
}

/** Judul sub-bagian artikel bergaya KCI (persegi + kapital). */
function JudulBagian({ children }) {
  return (
    <div className="mt-6 flex items-center gap-3 border-b border-slate-300 pb-3">
      <span className="h-2 w-2 bg-slate-900" />
      <h4 className="m-0 text-sm font-semibold uppercase tracking-wider text-slate-900">
        {children}
      </h4>
    </div>
  );
}

/** Pembuka artikel "1. e4 · Pembukaan Pion Raja" di samping papan besar. */
function ArtikelE4Awal() {
  return (
    <article className="flex flex-col gap-4">
      <div>
        <h3 className="m-0 text-lg font-semibold text-slate-900">
          1. e4 · Pembukaan Pion Raja
        </h3>
        <blockquote className="my-5 border-l-2 border-slate-900 py-2 pl-5 font-serif text-lg italic leading-relaxed text-slate-600">
          Terbaik berdasarkan uji coba.
          <span className="mt-1 block not-italic font-semibold text-slate-900">
            — Bobby Fischer
          </span>
        </blockquote>
      </div>

      <p className="m-0 text-[15px] leading-relaxed text-slate-700">
        <Notasi>1. e4</Notasi>, Pembukaan Pion Raja, adalah langkah pertama yang
        paling populer di semua level permainan. <Notasi>1. e4</Notasi> membuka
        jalur untuk mengembangkan menteri dan gajah raja. Langkah ini juga
        memperebutkan kendali atas pusat papan.
      </p>

      <p className="m-0 text-[15px] leading-relaxed text-slate-700">
        <Notasi>1. e4</Notasi> secara langsung mengontrol d5 dan f5, yang mungkin
        relevan atau tidak relevan nanti karena Hitam, jika mereka mau, dapat
        mengambil kembali petak-petak itu dengan memainkan <Notasi>1...e6</Notasi>.
        Jika Putih ingin mengembangkan beberapa buah catur, petak terpenting yang
        mereka kendalikan dengan memainkan <Notasi>1. e4</Notasi> sebenarnya adalah
        petak e4 itu sendiri: selama ada pion putih di e4, tidak mungkin ada pion
        hitam di e4, yang berarti kuda g1 Putih dapat dikembangkan ke{" "}
        <Notasi>f3</Notasi> tanpa takut ditendang oleh pion dan kehilangan tempo.
      </p>
    </article>
  );
}

/** Papan di kiri, pembuka di kanan, dan lanjutan penuh seperti contoh e4. */
function ArtikelPembukaan({ pembukaan }) {
  const { t } = useI18n();
  const kunci = `bukuPembukaan.panduan.${pembukaan.san}`;
  const posisi = t("bukuPembukaan.posisi", { langkah: pembukaan.san });
  const idJudul = `judul-pembukaan-${pembukaan.san}`;

  return (
    <article
      aria-labelledby={idJudul}
      className="border-b border-slate-200 py-10"
    >
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12">
        <figure className="m-0 flex min-w-0 flex-col gap-3 lg:col-span-6">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900">
            <span>{t(`${kunci}.judul`)}</span>
            <span className="border border-slate-300 px-1.5 py-0.5">
              1. {pembukaan.san}
            </span>
          </div>
          <PapanPembukaan
            papan={pembukaan.papan}
            asal={pembukaan.asal}
            tujuan={pembukaan.tujuan}
            notasi={pembukaan.san}
            label={posisi}
          />
          <figcaption className="py-1.5 text-center text-xs font-semibold leading-relaxed text-slate-700">
            {posisi} · {t(`${kunci}.fokus`)}
          </figcaption>
        </figure>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-6">
          <h3 id={idJudul} className="m-0 text-lg font-semibold text-slate-900">
            1. {pembukaan.san} · {t(`${kunci}.judul`)}
          </h3>
          <p>{t(`${kunci}.pembuka1`)}</p>
          <p>{t(`${kunci}.pembuka2`)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 pt-6">
        <JudulBagian>{t(`${kunci}.responsJudul`)}</JudulBagian>
        <p>{t(`${kunci}.respons`)}</p>
        <JudulBagian>{t(`${kunci}.rencanaJudul`)}</JudulBagian>
        <p>{t(`${kunci}.rencana`)}</p>
      </div>
    </article>
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
        <div className="absolute bottom-0 right-0 z-10 aspect-square w-[80%] border-l border-t border-slate-400 bg-[#e8e8e8]">
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
                        (rIdx + fIdx) % 2 === 0 ? "#e8e8e8" : "#6ab293",
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
                          color: (rIdx + fIdx) % 2 === 0 ? "#6ab293" : "#e8e8e8",
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
                          color: (rIdx + fIdx) % 2 === 0 ? "#6ab293" : "#e8e8e8",
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
      <span className="box-decoration-clone border border-slate-300 px-1.5 py-0.5 font-mono text-sm font-semibold leading-loose text-slate-900">
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
      <aside aria-labelledby="status-pembangunan-pembukaan" className="border-b border-slate-300 bg-slate-50 px-6 py-5 text-center">
        <h2 id="status-pembangunan-pembukaan" className="m-0 text-base font-semibold text-slate-900 sm:text-lg">
          {t("bukuPembukaan.pembangunan")}
        </h2>
      </aside>
      <PageArtikel title={t("bukuPembukaan.artikel")}>
        <div className="[&_p]:!text-left [&_p]:!mb-0 [&_h3]:!mt-0 [&_h3]:!mb-3">
        {/* HERO GRID SECTION: 2 Kolom Sejajar (Corporate Flat) */}
        <div className="grid w-full grid-cols-1 gap-8 border-b border-slate-300 pb-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          
          {/* KOLOM KIRI (6/12): Deskripsi & CTA */}
          <div className="flex min-w-0 flex-col gap-7 lg:col-span-6">
            <div className="space-y-5">
              <p className="m-0 mb-4 text-[15px] leading-relaxed text-slate-700">
                {t("bukuPembukaan.paragraf1")}
              </p>
              <p className="m-0 mb-6 text-[15px] leading-relaxed text-slate-700">
                {t("bukuPembukaan.paragraf2")}
              </p>
            </div>

            <Link
              to="/papan-interaktif"
              className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded border border-slate-900 bg-slate-950 px-5 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900 sm:w-fit"
              style={{ textDecoration: "none" }}
            >
              <span>{t("bukuPembukaan.buka")}</span>
              <svg
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
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

        {/* SECTION PAPAN BESAR + ARTIKEL 1. e4 (tambahan baru) */}
        <div className="grid w-full grid-cols-1 gap-8 border-b border-slate-200 py-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* KOLOM KIRI (6/12): Bar Evaluasi + Papan Besar */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-6">
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600">
              <span className="font-bold uppercase tracking-wider text-slate-900">
                Pembukaan Pion Raja
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-black">
                C20
              </span>
            </div>

            <div className="flex w-full min-w-0 items-stretch gap-2">
              <EvalBar nilai={0.3} />
              <PapanPembukaan />
            </div>

            <div className="w-full py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-black">
              Posisi kunci: 1. e4 · kendali pusat
            </div>
          </div>

          {/* KOLOM KANAN (6/12): Pembuka Artikel 1. e4 */}
          <div className="lg:col-span-6">
            <ArtikelE4Awal />
          </div>
        </div>

        {/* SECTION DAFTAR PEMBUKAAN (Penjelajah pembukaan) */}
        <div className="grid w-full grid-cols-1 gap-8 border-b border-slate-200 py-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-12">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-slate-900" />
                  <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-black">
                    Daftar pembukaan
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  Penjelajah pembukaan · contoh statistik Lichess
                </span>
              </div>

              <ul className="!m-0 !list-none !p-0 border-t-2 border-b-2 border-slate-900">
                {DAFTAR_PEMBUKAAN.map((b) => (
                  <li
                    key={b.san}
                    className="!mb-0 grid grid-cols-[52px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-slate-200 py-4 !text-left last:border-b-0 sm:grid-cols-[52px_minmax(0,1fr)_110px_120px] lg:gap-x-6"
                  >
                    <MiniBoardFen fen={b.fen} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold leading-snug text-slate-900">
                        {b.nama}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-600">
                        {b.san}
                      </div>
                    </div>
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-slate-500">
                        <span>Popularitas</span>
                        <span className="font-bold tabular-nums text-slate-900">
                          {b.popularitas}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden bg-slate-200">
                        <div
                          className="h-full bg-slate-900"
                          style={{ width: `${Math.max(b.popularitas, 10)}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <div className="mb-1 flex items-center justify-between text-[10px] tabular-nums text-slate-500">
                        <span className="font-bold text-slate-900">{b.putih}%</span>
                        <span>{b.seri}%</span>
                        <span>{b.hitam}%</span>
                      </div>
                      <div className="flex h-1.5 w-full overflow-hidden bg-slate-100">
                        <span className="bg-slate-400" style={{ width: `${b.putih}%` }} />
                        <span className="bg-slate-200" style={{ width: `${b.seri}%` }} />
                        <span className="bg-slate-700" style={{ width: `${b.hitam}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Pembukaan lain mengikuti contoh e4; statistik tetap ada di atas. */}
        {RINCIAN_PEMBUKAAN.map((pembukaan) => (
          <ArtikelPembukaan key={pembukaan.san} pembukaan={pembukaan} />
        ))}

        {/* SECTION BOTTOM: Teori & Kandidat Langkah Berikutnya */}
        <div className="grid w-full grid-cols-1 gap-8 border-b border-slate-200 py-10 lg:grid-cols-12 lg:items-start">
          
          {/* KANAN INFORMASI (12/12 - Full Width Container untuk Teori) */}
          <div className="lg:col-span-12">
            <div className="flex flex-col gap-5 border border-slate-300 p-4 sm:p-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-slate-900" />
                  <h4 className="m-0 text-sm font-semibold uppercase tracking-wider text-slate-900">
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
                
                <div className="grid w-full grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                  {LANJUTAN_RUY_LOPEZ.map((item) => (
                    <div
                      key={item.move}
                      className="flex min-w-0 flex-col items-start gap-1 border-l-2 border-slate-300 py-2 pl-3"
                    >
                      <span className="font-mono text-xs font-bold text-black">
                        3... {item.move}
                      </span>
                      <span className="text-xs leading-relaxed text-slate-600">
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
        <div className="grid w-full grid-cols-1 gap-8 border-b border-slate-200 py-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-12">
            <div className="flex flex-col gap-4">
              <h3>{t("bukuPembukaan.sejarahJudul")}</h3>
              <p>{t("bukuPembukaan.sejarahAyat1")}</p>
              <p>{t("bukuPembukaan.sejarahAyat2")}</p>
            </div>
          </div>
        </div>
        </div>
      </PageArtikel>
    </HalamanIsi>
  );
}