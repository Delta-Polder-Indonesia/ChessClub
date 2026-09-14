import { Link } from "react-router-dom";
import { Chess } from "chess.js";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";
import { ChessPiece } from "../../components/chess/ChessPiece.jsx";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

/**
 * Posisi setelah 1. e4 (Pembukaan Pion Raja). Disimpan sebagai FEN penuh
 * supaya konsisten dengan pemakai matriksDariFen yang lain.
 */
const FEN_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1";

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

/** Matriks papan utama, dihitung sekali saat modul dimuat. */
const PAPAN_E4 = matriksDariFen(FEN_E4);

/** Petak asal-tujuan langkah 1. e4 untuk disorot. */
const HIGHLIGHT_E4 = new Set(["e2", "e4"]);

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

function MiniBoardFen({ fen }) {
  return <PapanMini pieces={matriksDariFen(fen)} />;
}

/** Bar evaluasi statis di kiri papan (nilai dalam pion, putih di bawah). */
function EvalBar({ nilai = 0.3 }) {
  const putih = Math.max(2, Math.min(98, Math.round(50 + nilai * 20)));
  return (
    <div className="flex w-5 flex-col gap-1 self-stretch">
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

/** Papan besar statis posisi 1. e4, warna hijau ala Lichess. */
function PapanPionRaja() {
  return (
    <div className="relative w-full max-w-[560px] overflow-hidden border border-slate-300/60 bg-[#e8e8e8]">
      <div className="grid aspect-square w-full grid-cols-8 grid-rows-8">
        {RANKS.map((rank, rIdx) =>
          FILES.map((file, fIdx) => {
            const squareName = `${file}${rank}`;
            const piece = PAPAN_E4[rIdx][fIdx] || "";
            const highlighted = HIGHLIGHT_E4.has(squareName);

            return (
              <div
                key={squareName}
                className="relative flex items-center justify-center"
                style={{
                  backgroundColor:
                    (rIdx + fIdx) % 2 === 0 ? "#e8e8e8" : "#6ab293",
                }}
              >
                {/* Highlight Langkah 1. e4 */}
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

      {/* Panah Langkah e2 -> e4 */}
      <svg
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <defs>
          <marker
            id="panah-pion-raja"
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
          x1="56.25"
          y1="81.25"
          x2="56.25"
          y2="56.25"
          stroke="#b91c1c"
          strokeWidth="1.6"
          strokeLinecap="square"
          markerEnd="url(#panah-pion-raja)"
        />
      </svg>
    </div>
  );
}

/** Notasi langkah catur ber-format dalam teks artikel. */
function Notasi({ children }) {
  return <span className="font-mono font-bold text-slate-900">{children}</span>;
}

/** Judul sub-bagian artikel bergaya KCI (persegi + kapital). */
function JudulBagian({ children }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
      <span className="h-2 w-2 bg-slate-900" />
      <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-black">
        {children}
      </h4>
    </div>
  );
}

/** Artikel "1. e4 · Pembukaan Pion Raja" (terjemahan dari Lichess). */
function ArtikelE4() {
  return (
    <article className="flex flex-col gap-4">
      <div>
        <h3 className="m-0 text-lg font-semibold text-slate-900">
          1. e4 · Pembukaan Pion Raja
        </h3>
        <blockquote className="mt-2 border-l-2 border-slate-900 pl-3 text-sm italic leading-relaxed text-slate-600">
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

      <p className="m-0 text-[15px] leading-relaxed text-slate-700">
        Hitam memiliki beberapa cara untuk merespons. Ide utamanya adalah menemukan
        cara untuk mencegah Putih mencapai atau mempertahankan pusat dua pion dengan{" "}
        <Notasi>e4</Notasi> dan <Notasi>d4</Notasi>. Mereka mungkin mencoba untuk:
      </p>
      <ul className="m-0 list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-slate-700">
        <li>Kuasai petak d4.</li>
        <li>Serang langsung pion e4 Putih.</li>
        <li>Bersiaplah untuk menempatkan pion mereka sendiri di d5.</li>
        <li>Biarkan Putih membangun pusat, tetapi bersiaplah untuk melemahkannya nanti.</li>
      </ul>

      <div className="flex flex-col gap-3">
        <JudulBagian>Kontrol d4</JudulBagian>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Jika Hitam dapat mengontrol d4 dengan pion, maka akan sulit bagi Putih
          untuk menempatkan pion di d4 dan e4 dan mempertahankannya di sana.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Hitam memiliki dua langkah pion yang mengontrol petak d4:{" "}
          <Notasi>1...e5</Notasi> permainan Terbuka, dan <Notasi>1...c5</Notasi>{" "}
          pertahanan Sisilia. Bukan kebetulan bahwa ini adalah kelanjutan yang
          paling populer di semua tingkatan.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...e5</Notasi> memungkinkan Hitam mengambil ruang di tengah. Ini
          adalah balasan klasik: secara tradisional pembukaan <Notasi>1. e4</Notasi>{" "}
          dibagi menjadi <Notasi>1...e5</Notasi>, permainan Terbuka, dan sisanya,
          permainan Semi-Terbuka. Sekarang jika <Notasi>2. d4</Notasi>, Hitam dapat
          mengambilnya dan mencegah Putih mengendalikan seluruh ruang tengah itu.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Sama seperti <Notasi>1. e4</Notasi> membantu Putih untuk secara tidak
          langsung mengontrol petak e4, <Notasi>1...e5</Notasi> mencegah Putih
          memainkan <Notasi>2. e5</Notasi>, dan dengan demikian memastikan Hitam
          dapat mengembangkan kudanya ke <Notasi>f6</Notasi>.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Argumen Putih adalah bahwa posisi simetris pada akhirnya akan
          menguntungkan pemain yang bergerak lebih dulu. Langkah lanjutan Putih
          biasanya adalah <Notasi>2. Nf3</Notasi>, sebuah ancaman untuk menyingkirkan
          pion e5 sehingga mereka dapat memainkan d4 dengan aman.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...c5</Notasi> adalah variasi utama dalam permainan tingkat
          master saat ini. Jika Putih memainkan d4, Hitam dapat mengambilnya dengan
          pion c di sisi sayap, mempertahankan dua pion tengahnya yang lebih
          penting. Sebagai pembukaan asimetris, variasi ini dianggap lebih agresif
          daripada <Notasi>1...e5</Notasi>.
        </p>

        <JudulBagian>Serangan e4</JudulBagian>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Hitam dapat langsung menghadapi pion e Putih untuk membuka ruang di tengah
          papan.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...d5</Notasi> adalah pertahanan Skandinavia. Hitam bermaksud
          untuk melenyapkan pusat Putih, meskipun mereka harus mengorbankan harapan
          untuk memiliki pusat yang besar sendiri. Pembukaan ini kurang populer
          dalam turnamen dibandingkan sebagai balasan di tingkat klub, di mana
          sebagian daya tariknya adalah karena sangat memaksa dan konfrontatif.
          Balasan Putih hampir selalu <Notasi>2. exd5</Notasi>, kemudian Hitam dapat
          mengambil kembali pion jika mereka mau.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...f5?</Notasi> adalah gambit Duras yang berisiko.{" "}
          <Notasi>2. exf5</Notasi> dan Hitam berhasil mengalihkan pion e dari pusat,
          tetapi dengan mengorbankan sisi raja yang melemah.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...Nf6</Notasi>, pertahanan Alekhine, juga menyerang e4, tetapi
          Putih jarang membiarkan Hitam mengambilnya. Biasanya berlanjut{" "}
          <Notasi>2. e5</Notasi> (menendang kuda) <Notasi>Nd5</Notasi>{" "}
          <Notasi>3. d4</Notasi>. Ide sebenarnya Hitam adalah membiarkan Putih
          menguasai pusat untuk saat ini dan melemahkannya nanti.
        </p>

        <JudulBagian>Dukungan d5</JudulBagian>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Jika Hitam dapat memainkan pion ke d5 dan mempertahankannya di sana,
          mereka dapat mempertahankan sebagian pusat papan. Jika Hitam mencoba
          menempatkan pion di d5 segera, Putih akan menangkapnya (pertahanan
          Skandinavia, di atas), jadi untuk mempertahankan pion di d5, Hitam perlu
          dapat menangkapnya kembali dengan pion dari c6 atau e6.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...e6</Notasi> adalah Pertahanan Prancis. Setelah{" "}
          <Notasi>2. d4</Notasi> <Notasi>d5</Notasi>, Hitam mempertahankan sebagian
          kendali atas pusat papan, dan langkah lanjutan Putih termasuk membuka
          posisi dengan <Notasi>exd5 exd5</Notasi>, atau menutup posisi dengan{" "}
          <Notasi>e5</Notasi>. Kelemahan utama Pertahanan Prancis adalah gajah
          Hitam di sisi menteri menjadi beban dan sulit dikembangkan, karena pion
          e6 menghalanginya.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...c6</Notasi> adalah Caro-Kann. Langkah ini memiliki keuntungan
          menghindari gajah Prancis yang merepotkan, tetapi sebagai gantinya,
          langkah ini mengambil petak c6 dari kuda Hitam, dan jika Hitam ingin
          memainkan c5 nanti, mereka telah kehilangan satu tempo.
        </p>

        <JudulBagian>Lepaskan pusatnya</JudulBagian>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Hitam dapat melepaskan kendali atas pusat untuk sementara waktu, dan lebih
          memilih mengembangkan buah catur. Mereka ingin kemudian melemahkan pusat
          dan mengendalikannya dari jauh dengan buah catur mereka, bukan dengan
          pion.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Salah satu cara Hitam dapat mengendalikan pusat dari jauh adalah dengan
          melakukan fianchetto pada gajah (mengembangkannya ke sisi, baik ke g7 atau
          b7, di mana ia mengendalikan diagonal panjang yang membentang melalui
          pusat).
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...g6</Notasi> adalah pertahanan Modern. Hitam akan melanjutkan
          dengan <Notasi>Bg7</Notasi> untuk mengontrol sebagian besar pusat sebelum
          melakukan langkah pion yang lebih mengikat.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...b6</Notasi> adalah pertahanan Owen. Hitam bermaksud{" "}
          <Notasi>Bb7</Notasi> untuk mengontrol diagonal panjang lainnya. Tidak
          seperti Modern, langkah ini tidak memiliki keuntungan mempersiapkan
          rokade di sisi raja.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...d6</Notasi> adalah pertahanan Pirc. Hitam ingin memainkan{" "}
          <Notasi>Nf6</Notasi> untuk mengontrol pusat. d6 adalah tindakan pencegahan
          untuk mencegah Putih memainkan e5: setelah <Notasi>1...d6</Notasi>{" "}
          <Notasi>2. d4</Notasi> <Notasi>Nf6</Notasi>, langkah <Notasi>3. e5</Notasi>{" "}
          tidak berhasil karena <Notasi>3...dxe5</Notasi> <Notasi>4. dxe5</Notasi>{" "}
          <Notasi>Qxd1+</Notasi> <Notasi>5. Kxd1</Notasi> <Notasi>Ng4!</Notasi> yang
          mengancam pion di e5 dan f2 (bandingkan dengan <Notasi>1...Nf6</Notasi>,
          pertahanan Alekhine). Hitam biasanya juga melakukan fianchetto gajah ke{" "}
          <Notasi>Bg7</Notasi> dalam pembukaan ini.
        </p>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          <Notasi>1...Nc6</Notasi>, pertahanan Nimzowitsch, mengembangkan kuda untuk
          mengontrol d4 dan e5. Ini memungkinkan <Notasi>2. d4</Notasi>, dan kemudian
          Hitam dapat memilih untuk merespons dengan <Notasi>2...d5</Notasi> atau{" "}
          <Notasi>2...e5</Notasi>.
        </p>

        <JudulBagian>Respons yang jarang terjadi</JudulBagian>
        <p className="m-0 text-[15px] leading-relaxed text-slate-700">
          Respons lainnya meliputi:
        </p>
        <ul className="m-0 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-700">
          <li>
            <Notasi>1...a6</Notasi>, pertahanan St. George, paling terkenal karena
            dimainkan oleh Tony Miles melawan Juara Dunia saat itu, Anatoly Karpov.
            Seringkali Hitam akan melanjutkan dengan <Notasi>2...b5</Notasi>,
            melakukan ekspansi di sisi menteri.
          </li>
          <li>
            <Notasi>1...f6?</Notasi>, Pertahanan Barnes. Langkah langka yang bukan
            ide bagus, karena menghilangkan petak f6 untuk kuda dan melemahkan sisi
            raja. Meskipun demikian, Thomas Wilson Barnes (yang namanya digunakan
            untuk pembukaan ini) mengalahkan Paul Morphy, salah satu pemain catur
            terkuat abad ke-19, dengan pembukaan ini. Satu-satunya keuntungannya
            adalah ia keluar dari teori.
          </li>
          <li>
            <Notasi>1...g5?</Notasi>, Pertahanan Borg (kebalikan dari Grob) adalah
            pilihan lain yang dimiliki Hitam, namun ini adalah pilihan yang buruk
            karena sangat melemahkan sisi raja. Pion g5 dapat berfungsi sebagai umpan
            bagi Putih (h4) di kemudian hari. Ini juga dapat menyebabkan Mat Bodoh
            bagi Hitam.
          </li>
          <li>
            <Notasi>1...a5?!</Notasi>, Pertahanan Ware sama lemahnya dengan{" "}
            <Notasi>1...h5</Notasi>. Itu hanya membuang tempo.
          </li>
          <li>
            <Notasi>1...h5?!</Notasi>, Pertahanan Pickering hanya membuang tempo dan
            melemahkan posisi Hitam.
          </li>
          <li>
            <Notasi>1...h6?!</Notasi>, Pertahanan Carr, adalah langkah membuang waktu
            lainnya, tetapi biasanya bertransposisi menjadi Pertahanan Borg setelah{" "}
            <Notasi>2. d4</Notasi> <Notasi>g5</Notasi>.
          </li>
          <li>
            <Notasi>1...Na6?!</Notasi> mengembangkan kuda b8 ke petak yang lebih
            rendah.
          </li>
          <li>
            <Notasi>1...Nh6?!</Notasi> mengembangkan kuda di g8 ke petak yang lebih
            rendah.
          </li>
          <li>
            <Notasi>1...b5?</Notasi> hanya akan kehilangan bidak karena{" "}
            <Notasi>2. Bxb5</Notasi>.
          </li>
        </ul>

        <p className="m-0 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-500">
          Terjemahan dari artikel "King's Pawn Game" di Penjelajah Pembukaan Lichess.
        </p>
      </div>
    </article>
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
        {/* HERO GRID: Kiri = Papan Besar + Bar Evaluasi, Kanan = Artikel */}
        <div className="grid w-full grid-cols-1 gap-10 border-b border-slate-200 pb-10 lg:grid-cols-12 lg:items-start">
          {/* KOLOM KIRI (6/12): Bar Evaluasi + Papan Besar */}
          <div className="flex flex-col gap-3 lg:col-span-6">
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-600">
              <span className="font-bold uppercase tracking-wider text-slate-900">
                Pembukaan Pion Raja
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-black">
                C20
              </span>
            </div>

            <div className="flex w-full items-stretch gap-2">
              <EvalBar nilai={0.3} />
              <PapanPionRaja />
            </div>

            <div className="w-full py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-black">
              Posisi kunci: 1. e4 · kendali pusat
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

          {/* KOLOM KANAN (6/12): Artikel 1. e4 */}
          <div className="lg:col-span-6">
            <ArtikelE4 />
          </div>
        </div>

        {/* SECTION POPULARITAS (di bawah artikel) */}
        <div className="grid w-full grid-cols-1 gap-8 pt-8 lg:grid-cols-12 lg:items-start">
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

              <ul className="m-0 list-none p-0">
                {DAFTAR_PEMBUKAAN.map((b) => (
                  <li
                    key={b.san}
                    className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-b border-slate-200 py-2.5 sm:grid-cols-[44px_minmax(0,1fr)_150px_160px]"
                  >
                    <MiniBoardFen fen={b.fen} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {b.nama}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-600">
                        {b.san}
                      </div>
                    </div>
                    <div className="hidden sm:block">
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
                    <div className="hidden sm:block">
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
      </PageArtikel>
    </HalamanIsi>
  );
}