import { useEffect } from "react";
import { Link } from "react-router-dom";
import Hero from "../../components/Hero.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import { PageSelanjutnya } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

const BAGIAN_ID = [
  { id: "papan-catur", label: "Mengatur Papan" },
  { id: "gerak-buah", label: "Gerak Buah" },
  { id: "aturan-khusus", label: "Aturan Khusus" },
  { id: "giliran", label: "Giliran Pertama" },
  { id: "cara-menang", label: "Cara Menang" },
  { id: "strategi-dasar", label: "Strategi Dasar" },
  { id: "berlatih", label: "Berlatih" },
];

const BAGIAN_EN = [
  { id: "papan-catur", label: "Set Up the Board" },
  { id: "gerak-buah", label: "Piece Movement" },
  { id: "aturan-khusus", label: "Special Rules" },
  { id: "giliran", label: "First Move" },
  { id: "cara-menang", label: "How to Win" },
  { id: "strategi-dasar", label: "Basic Strategy" },
  { id: "berlatih", label: "Practice" },
];

const SUSUNAN = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  Array(8).fill("♟"),
  ...Array.from({ length: 4 }, () => Array(8).fill("")),
  Array(8).fill("♙"),
  ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
];

function PapanCatur({ caption }) {
  return (
    <figure className="my-8 mx-auto max-w-[560px]">
      <div className="grid grid-cols-8 overflow-hidden border border-slate-300">
        {SUSUNAN.flatMap((baris, row) =>
          baris.map((buah, col) => (
            <div
              key={`${row}-${col}`}
              className={`aspect-square flex items-center justify-center text-[clamp(1.6rem,6vw,3.6rem)] leading-none ${
                (row + col) % 2 === 0 ? "bg-[#eee9dc]" : "bg-[#557255]"
              }`}
            >
              <span className={row < 2 ? "text-slate-950" : "text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.55)]"}>
                {buah}
              </span>
            </div>
          ))
        )}
      </div>
      <figcaption className="mt-3 text-center text-sm leading-6 text-slate-500">
        {caption}
      </figcaption>
    </figure>
  );
}

function Bagian({ id, nomor, title, children }) {
  return (
    <section id={id} className="scroll-mt-36 border-t border-slate-200 py-12 md:py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-primary">
        {nomor}
      </p>
      <h2 className="text-2xl font-semibold leading-tight text-slate-950 md:text-3xl">
        {title}
      </h2>
      <div className="article-chess mt-6">{children}</div>
    </section>
  );
}

function Subjudul({ children }) {
  return <h3 className="mt-9 mb-3 text-xl font-semibold text-slate-950">{children}</h3>;
}

export default function CaraBermainCatur() {
  const { t, bahasa } = useI18n();
  const isEN = bahasa === "en";
  const tx = (id, en) => (isEN ? en : id);

  useEffect(() => {
    document.title = `${t("caraBermain.judul")} | ${t("common.namaKomunitas")}`;
  }, [t]);

  const crumbs = [
    { label: t("common.home"), to: "/" },
    { label: t("nav.programKami"), to: "/program-kami" },
    { label: t("nav.sekolahCatur"), to: "/program-kami/sekolah-catur" },
    { label: t("caraBermain.judul") },
  ];

  return (
    <>
      <Hero
        title={t("caraBermain.judul")}
        description={t("caraBermain.deskripsi")}
        crumbs={crumbs}
      />
      <StickyMenu sections={isEN ? BAGIAN_EN : BAGIAN_ID} />

      <main className="px-6 md:px-8">
        <article className="mx-auto max-w-[860px] py-12 md:py-20">
          <header className="pb-12 md:pb-16">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
              {tx("Panduan Pemula", "Beginner's Guide")}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
              {tx("Cara Bermain Catur: 7 Langkah untuk Memulai", "How to Play Chess: 7 Steps to Get Started")}
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              {tx(
                "Catur dimainkan oleh dua orang di atas papan 8 × 8. Setiap pemain memulai dengan 16 buah dan berusaha membuat raja lawan tidak memiliki jalan keluar dari serangan. Panduan ini menjelaskan aturan yang perlu dipahami sebelum memainkan partai pertama.",
                "Chess is played by two people on an 8 × 8 board. Each player starts with 16 pieces and aims to leave the opposing king with no escape from attack. This guide covers the rules needed before playing a first game."
              )}
            </p>

            <nav aria-label={tx("Daftar isi", "Table of contents")} className="mt-10 border-y border-slate-200 py-6">
              <p className="mb-4 text-sm font-semibold text-slate-950">
                {tx("Dalam panduan ini", "In this guide")}
              </p>
              <ol className="grid gap-x-8 gap-y-2 pl-5 text-[15px] leading-7 text-slate-700 md:grid-cols-2">
                {(isEN ? BAGIAN_EN : BAGIAN_ID).map((bagian, index) => (
                  <li key={bagian.id} className="list-decimal pl-1">
                    <a href={`#${bagian.id}`} className="hover:text-primary hover:underline">
                      {bagian.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </header>

          <Bagian
            id="papan-catur"
            nomor={tx("Langkah 1", "Step 1")}
            title={tx("Mengatur papan dan buah catur", "Set up the board and pieces")}
          >
            <p>
              {tx(
                "Letakkan papan dengan petak terang berada di sudut kanan setiap pemain. Cara mengingatnya sederhana: petak kanan bawah harus berwarna terang.",
                "Place the board so that each player has a light square in the bottom-right corner. A simple reminder is that the square on the right must be light."
              )}
            </p>
            <PapanCatur
              caption={tx(
                "Posisi awal: putih berada di sisi bawah dan hitam di sisi atas.",
                "Starting position: White is shown at the bottom and Black at the top."
              )}
            />
            <p>
              {tx(
                "Delapan pion mengisi baris kedua. Pada baris belakang, susun benteng di kedua sudut, lalu kuda, kemudian gajah. Menteri ditempatkan pada petak yang sama dengan warnanya: menteri putih di petak terang dan menteri hitam di petak gelap. Raja menempati petak yang tersisa.",
                "The eight pawns fill the second rank. On the back rank, place rooks in both corners, followed by knights and then bishops. The queen starts on a square matching her colour: the white queen on a light square and the black queen on a dark square. The king takes the remaining square."
              )}
            </p>
          </Bagian>

          <Bagian
            id="gerak-buah"
            nomor={tx("Langkah 2", "Step 2")}
            title={tx("Memahami gerak setiap buah", "Understand how every piece moves")}
          >
            <p>
              {tx(
                "Sebuah buah tidak boleh berhenti di petak yang ditempati buah sendiri. Buah lawan ditangkap dengan memindahkan buah kita ke petaknya. Selain kuda, tidak ada buah yang boleh melompati buah lain.",
                "A piece cannot finish on a square occupied by a friendly piece. An opposing piece is captured by moving onto its square. No piece may jump over another piece except the knight."
              )}
            </p>

            <Subjudul>{tx("Raja", "King")}</Subjudul>
            <p>
              {tx(
                "Raja bergerak satu petak ke segala arah. Raja tidak boleh masuk ke petak yang diserang lawan. Serangan langsung terhadap raja disebut skak dan wajib dijawab pada langkah berikutnya.",
                "The king moves one square in any direction. It may not enter a square attacked by the opponent. A direct attack on the king is called check and must be answered immediately."
              )}
            </p>

            <Subjudul>{tx("Menteri", "Queen")}</Subjudul>
            <p>
              {tx(
                "Menteri bergerak sejauh mungkin secara lurus maupun diagonal, selama jalurnya tidak terhalang. Karena menggabungkan gerak benteng dan gajah, menteri merupakan perwira dengan jangkauan terluas.",
                "The queen moves any distance along a rank, file, or diagonal as long as the path is clear. By combining the movement of a rook and bishop, it has the widest range of any piece."
              )}
            </p>

            <Subjudul>{tx("Benteng", "Rook")}</Subjudul>
            <p>
              {tx(
                "Benteng bergerak mendatar atau tegak sejauh jalurnya terbuka. Benteng biasanya semakin kuat ketika papan mulai kosong dan garis-garis terbuka tersedia.",
                "The rook moves horizontally or vertically for any unobstructed distance. Rooks generally become stronger as the board clears and open lines become available."
              )}
            </p>

            <Subjudul>{tx("Gajah", "Bishop")}</Subjudul>
            <p>
              {tx(
                "Gajah bergerak diagonal sejauh jalurnya terbuka. Gajah yang memulai permainan di petak terang akan selalu berada di petak terang; demikian pula gajah petak gelap.",
                "The bishop moves diagonally for any unobstructed distance. A bishop that starts on a light square always remains on light squares, and the same applies to a dark-squared bishop."
              )}
            </p>

            <Subjudul>{tx("Kuda", "Knight")}</Subjudul>
            <p>
              {tx(
                "Kuda bergerak membentuk huruf L: dua petak ke satu arah lalu satu petak ke arah samping. Kuda adalah satu-satunya buah yang dapat melompati buah lain.",
                "The knight moves in an L shape: two squares in one direction followed by one square to the side. It is the only piece that can jump over other pieces."
              )}
            </p>

            <Subjudul>{tx("Pion", "Pawn")}</Subjudul>
            <p>
              {tx(
                "Pion berjalan satu petak ke depan dan boleh berjalan dua petak pada langkah pertamanya. Pion menangkap satu petak secara diagonal ke depan. Pion tidak dapat berjalan atau menangkap ke belakang.",
                "A pawn advances one square and may advance two squares on its first move. It captures one square diagonally forward and can never move or capture backward."
              )}
            </p>
          </Bagian>

          <Bagian
            id="aturan-khusus"
            nomor={tx("Langkah 3", "Step 3")}
            title={tx("Mengenal tiga aturan khusus", "Learn the three special rules")}
          >
            <Subjudul>{tx("Promosi pion", "Pawn promotion")}</Subjudul>
            <p>
              {tx(
                "Pion yang mencapai baris terakhir harus diganti menjadi menteri, benteng, gajah, atau kuda. Pilihan tidak bergantung pada buah yang sudah ditangkap. Dalam kebanyakan posisi, pemain memilih menteri karena nilainya paling tinggi.",
                "A pawn reaching the final rank must be replaced by a queen, rook, bishop, or knight. The choice does not depend on pieces already captured. A queen is selected most often because of its greater value."
              )}
            </p>

            <Subjudul>En passant</Subjudul>
            <p>
              {tx(
                "Jika sebuah pion maju dua petak dari posisi awal dan berhenti tepat di samping pion lawan, pion lawan boleh menangkapnya seolah-olah pion tersebut hanya maju satu petak. Hak ini hanya berlaku pada langkah yang langsung menyusul.",
                "If a pawn advances two squares from its starting position and stops beside an opposing pawn, that opposing pawn may capture it as though it had advanced only one square. This option exists only on the immediately following move."
              )}
            </p>

            <Subjudul>{tx("Rokade", "Castling")}</Subjudul>
            <p>
              {tx(
                "Rokade memindahkan raja dua petak ke arah benteng, kemudian benteng ditempatkan di sebelah raja pada sisi yang berlawanan. Langkah ini tidak sah apabila raja atau benteng sudah pernah bergerak, terdapat buah di antara keduanya, raja sedang diskak, atau raja melewati maupun berakhir di petak yang diserang.",
                "Castling moves the king two squares toward a rook, after which the rook is placed beside the king on the opposite side. It is not legal if the king or rook has moved before, pieces stand between them, the king is in check, or the king crosses or finishes on an attacked square."
              )}
            </p>
          </Bagian>

          <Bagian
            id="giliran"
            nomor={tx("Langkah 4", "Step 4")}
            title={tx("Menentukan giliran pertama", "Know who moves first")}
          >
            <p>
              {tx(
                "Putih selalu menjalankan langkah pertama, kemudian kedua pemain bergantian satu langkah. Warna biasanya ditentukan secara acak sebelum permainan. Kesempatan bergerak lebih dahulu memberi putih sedikit keuntungan dalam mengambil ruang atau memulai serangan.",
                "White always makes the first move, after which the players alternate one move at a time. Colours are usually assigned at random before the game. Moving first gives White a small advantage in claiming space or beginning an attack."
              )}
            </p>
          </Bagian>

          <Bagian
            id="cara-menang"
            nomor={tx("Langkah 5", "Step 5")}
            title={tx("Mengakhiri dan memenangkan permainan", "Finish and win the game")}
          >
            <Subjudul>{tx("Skak dan skakmat", "Check and checkmate")}</Subjudul>
            <p>
              {tx(
                "Ketika raja diserang, pemain harus menghilangkan skak dengan memindahkan raja ke petak aman, menutup jalur serangan, atau menangkap buah penyerang. Jika tidak satu pun dapat dilakukan, posisi tersebut adalah skakmat dan permainan selesai.",
                "When the king is attacked, the player must answer by moving the king to safety, blocking the attack, or capturing the attacking piece. If none of these responses is legal, the position is checkmate and the game ends."
              )}
            </p>

            <Subjudul>{tx("Remis", "Draws")}</Subjudul>
            <p>{tx("Permainan dapat berakhir remis dalam keadaan berikut:", "A game may end in a draw under the following conditions:")}</p>
            <ul>
              <li>{tx("pemain yang mendapat giliran tidak sedang diskak tetapi tidak memiliki langkah sah (stalemate);", "the player to move is not in check but has no legal move (stalemate);")}</li>
              <li>{tx("kedua pemain menyetujui hasil remis;", "both players agree to a draw;")}</li>
              <li>{tx("tidak tersedia cukup buah untuk menghasilkan skakmat;", "there is insufficient material to produce checkmate;")}</li>
              <li>{tx("posisi yang sama muncul untuk ketiga kalinya; atau", "the same position occurs for the third time; or")}</li>
              <li>{tx("lima puluh langkah setiap pemain berlalu tanpa gerakan pion dan tanpa penangkapan.", "fifty moves by each player pass without a pawn move or capture.")}</li>
            </ul>
            <p>
              {tx(
                "Permainan juga selesai ketika seorang pemain menyerah. Dalam permainan dengan jam, kehabisan waktu biasanya berarti kalah, kecuali lawan tidak memiliki cukup buah untuk memungkinkan skakmat.",
                "A game also ends when a player resigns. In timed play, running out of time normally loses the game unless the opponent lacks enough material for checkmate to be possible."
              )}
            </p>
          </Bagian>

          <Bagian
            id="strategi-dasar"
            nomor={tx("Langkah 6", "Step 6")}
            title={tx("Menerapkan strategi dasar", "Apply basic strategy")}
          >
            <Subjudul>{tx("Amankan raja", "Keep the king safe")}</Subjudul>
            <p>
              {tx(
                "Lakukan rokade ketika keadaan memungkinkan dan hindari membuka terlalu banyak jalur menuju raja. Keselamatan raja harus didahulukan sebelum memulai serangan.",
                "Castle when circumstances allow and avoid opening too many lines toward the king. King safety should be established before beginning an attack."
              )}
            </p>

            <Subjudul>{tx("Perhatikan nilai buah", "Understand piece values")}</Subjudul>
            <p>
              {tx(
                "Nilai berikut digunakan sebagai pedoman ketika mempertimbangkan pertukaran. Nilai bukan skor akhir permainan dan dapat berubah menurut posisi.",
                "The values below are a guide when considering exchanges. They are not a final score and their practical importance changes with the position."
              )}
            </p>
            <div className="my-6 overflow-x-auto">
              <table className="w-full border-collapse text-left text-[15px] text-slate-700">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-950">
                    <th className="py-3 pr-6 font-semibold">{tx("Buah", "Piece")}</th>
                    <th className="py-3 font-semibold">{tx("Nilai umum", "Typical value")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [tx("Pion", "Pawn"), "1"],
                    [tx("Kuda", "Knight"), "3"],
                    [tx("Gajah", "Bishop"), "3"],
                    [tx("Benteng", "Rook"), "5"],
                    [tx("Menteri", "Queen"), "9"],
                  ].map(([piece, value]) => (
                    <tr key={piece} className="border-b border-slate-200">
                      <td className="py-3 pr-6">{piece}</td>
                      <td className="py-3">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Subjudul>{tx("Kuasai pusat", "Control the centre")}</Subjudul>
            <p>
              {tx(
                "Petak pusat memberi buah lebih banyak pilihan gerak. Gunakan pion tengah untuk mengambil ruang dan tempatkan kuda serta gajah pada petak aktif yang mengarah ke pusat.",
                "Central squares give pieces more choices. Use central pawns to claim space and develop knights and bishops to active squares that influence the centre."
              )}
            </p>

            <Subjudul>{tx("Kembangkan seluruh perwira", "Develop all your pieces")}</Subjudul>
            <p>
              {tx(
                "Jangan mengandalkan menteri untuk menyerang sendirian. Keluarkan kuda dan gajah, hubungkan kedua benteng, lalu cari rencana yang melibatkan beberapa buah sekaligus.",
                "Do not rely on the queen to attack alone. Bring out the knights and bishops, connect the rooks, and then look for plans involving several pieces together."
              )}
            </p>
          </Bagian>

          <Bagian
            id="berlatih"
            nomor={tx("Langkah 7", "Step 7")}
            title={tx("Berlatih melalui permainan", "Improve through practice")}
          >
            <p>
              {tx(
                "Pemahaman aturan akan menjadi kebiasaan setelah digunakan dalam permainan. Mulailah dengan tempo yang cukup panjang agar tersedia waktu untuk memeriksa ancaman, buah yang tidak terlindungi, dan keselamatan raja sebelum menjalankan langkah.",
                "The rules become familiar once they are used in real games. Begin with a time control long enough to check threats, undefended pieces, and king safety before making each move."
              )}
            </p>
            <p>
              {tx(
                "Setelah permainan selesai, lihat kembali posisi ketika terjadi kehilangan buah atau perubahan besar. Catat satu hal yang sudah dilakukan dengan baik dan satu hal yang perlu diperbaiki pada permainan berikutnya.",
                "After the game, revisit positions where material was lost or the balance changed significantly. Record one thing done well and one point to improve in the next game."
              )}
            </p>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-8 sm:flex-row">
              <Link
                to="/keanggotaan/pendaftaran-anggota"
                className="inline-flex items-center justify-center bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#08267f]"
              >
                {tx("Daftar sebagai anggota", "Register as a member")}
              </Link>
              <a
                href="https://www.chess.com/id/play/online"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-500"
              >
                {tx("Mainkan partai daring", "Play an online game")}
              </a>
            </div>
          </Bagian>

          <section className="border-t border-slate-200 py-12 md:py-16">
            <h2 className="text-2xl font-semibold text-slate-950 md:text-3xl">
              {tx("Pertanyaan yang sering diajukan", "Frequently asked questions")}
            </h2>
            <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {[
                [
                  tx("Apa tujuan permainan catur?", "What is the goal of chess?"),
                  tx("Tujuannya adalah membuat raja lawan skakmat: raja sedang diserang dan tidak memiliki jawaban yang sah.", "The goal is to checkmate the opposing king: the king is under attack and has no legal response."),
                ],
                [
                  tx("Buah mana yang bergerak lebih dahulu?", "Which colour moves first?"),
                  tx("Putih selalu menjalankan langkah pertama.", "White always makes the first move."),
                ],
                [
                  tx("Apakah pion dapat bergerak mundur?", "Can a pawn move backward?"),
                  tx("Tidak. Pion hanya berjalan dan menangkap ke arah depan. Setelah promosi, buah penggantinya mengikuti aturan gerak buah tersebut.", "No. A pawn only moves and captures forward. After promotion, the replacement follows the movement rules of the selected piece."),
                ],
                [
                  tx("Apakah dua buah dapat digerakkan dalam satu giliran?", "Can two pieces move in one turn?"),
                  tx("Hanya pada saat rokade, ketika raja dan satu benteng dipindahkan sebagai bagian dari satu langkah.", "Only during castling, when the king and one rook are moved as part of a single move."),
                ],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="cursor-pointer list-none pr-8 font-semibold text-slate-950 marker:hidden">
                    {question}
                  </summary>
                  <p className="mt-3 max-w-[760px] text-[16px] leading-7 text-slate-600">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <footer className="border-t border-slate-200 pt-8 text-sm leading-6 text-slate-500">
            <p>
              {tx("Referensi lanjutan: ", "Further reference: ")}
              <a
                href="https://www.chess.com/id/cara-bermain-catur"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-4"
              >
                Chess.com — {tx("Cara Bermain Catur", "How to Play Chess")}
              </a>
              .
            </p>
          </footer>
        </article>
      </main>

      <PageSelanjutnya to="/turnamen" judul={t("sekolahCatur.nextJudul")} />
    </>
  );
}
