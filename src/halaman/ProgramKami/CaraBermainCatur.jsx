import { useEffect } from "react";
import { Link } from "react-router-dom";
import Hero from "../../components/Hero.jsx";
import StickyMenu from "../../components/StickyMenu.jsx";
import { PageArtikel, PageSelanjutnya } from "../../components/PageBagian.jsx";
import { useI18n } from "../../lib/i18n.jsx";

const SECTIONS_ID = [
  { id: "pengantar", label: "Pengantar" },
  { id: "papan-catur", label: "1. Papan Catur" },
  { id: "gerak-buah", label: "2. Gerak Buah" },
  { id: "aturan-khusus", label: "3. Aturan Khusus" },
  { id: "giliran", label: "4. Giliran Awal" },
  { id: "cara-menang", label: "5. Cara Menang" },
  { id: "strategi-dasar", label: "6. Strategi Dasar" },
  { id: "banyak-bermain", label: "7. Banyak Bermain" },
  { id: "varian", label: "Varian Catur" },
  { id: "aturan-turnamen", label: "Aturan Turnamen" },
  { id: "faq", label: "FAQ" },
];

const SECTIONS_EN = [
  { id: "pengantar", label: "Intro" },
  { id: "papan-catur", label: "1. The Board" },
  { id: "gerak-buah", label: "2. How Pieces Move" },
  { id: "aturan-khusus", label: "3. Special Rules" },
  { id: "giliran", label: "4. Who Moves First" },
  { id: "cara-menang", label: "5. How to Win" },
  { id: "strategi-dasar", label: "6. Basic Strategy" },
  { id: "banyak-bermain", label: "7. Practice" },
  { id: "varian", label: "Variants" },
  { id: "aturan-turnamen", label: "Tournament Rules" },
  { id: "faq", label: "FAQ" },
];

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700 ring-1 ring-inset ring-slate-200">
      {children}
    </span>
  );
}

function PieceCard({ icon, name, gerak, point }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-slate-900 text-white text-xl">
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{name}</h4>
            {point && <span className="text-xs text-slate-500">Nilai: {point}</span>}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{gerak}</p>
    </div>
  );
}

export default function CaraBermainCatur() {
  const { t, bahasa } = useI18n();
  const isEN = bahasa === "en";
  const sections = isEN ? SECTIONS_EN : SECTIONS_ID;

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
      <StickyMenu sections={sections} />

      {/* Pengantar */}
      <div id="pengantar" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Start Playing Chess in 7 Steps" : "Cara Bermain Catur: 7 Aturan untuk Memulai"} lead={t("caraBermain.lead")}>
          {isEN ? (
            <>
              <p>
                It&apos;s never too late to learn chess — the most popular game in the world! Understanding chess is easy.
                This guide is adapted from <a href="https://www.chess.com/lessons/how-to-play-chess" target="_blank" rel="noreferrer" className="text-primary underline">Chess.com</a> and structured for our Chess School program.
              </p>
              <div className="not-prose mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">7 steps overview:</p>
                <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                  <li><a href="#papan-catur" className="text-primary hover:underline">Set up the board</a></li>
                  <li><a href="#gerak-buah" className="text-primary hover:underline">How each piece moves</a></li>
                  <li><a href="#aturan-khusus" className="text-primary hover:underline">Special moves</a></li>
                  <li><a href="#giliran" className="text-primary hover:underline">Who moves first</a></li>
                  <li><a href="#cara-menang" className="text-primary hover:underline">How to win — checkmate & draw</a></li>
                  <li><a href="#strategi-dasar" className="text-primary hover:underline">Basic strategy</a></li>
                  <li><a href="#banyak-bermain" className="text-primary hover:underline">Play as much as possible</a></li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <p>
                Tidak pernah ada kata terlambat untuk belajar bermain catur—permainan yang paling populer di dunia! Memahami catur itu mudah. Panduan ini diadaptasi dari{" "}
                <a href="https://www.chess.com/id/cara-bermain-catur" target="_blank" rel="noreferrer" className="text-primary underline">Chess.com – Cara Bermain Catur</a>{" "}
                dan disusun ulang untuk program Sekolah Catur Komunitas Catur Indonesia.
              </p>
              <div className="not-prose mt-6 grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-900">Ringkasan 7 langkah:</p>
                <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-1">
                  <li><a href="#papan-catur" className="text-primary hover:underline">Pelajari cara mengatur papan catur</a></li>
                  <li><a href="#gerak-buah" className="text-primary hover:underline">Kenali bagaimana setiap buah catur bergerak</a></li>
                  <li><a href="#aturan-khusus" className="text-primary hover:underline">Temukan aturan khusus dalam catur</a></li>
                  <li><a href="#giliran" className="text-primary hover:underline">Ketahui siapa yang bergerak lebih dulu</a></li>
                  <li><a href="#cara-menang" className="text-primary hover:underline">Pahami aturan tentang cara memenangkan permainan</a></li>
                  <li><a href="#strategi-dasar" className="text-primary hover:underline">Pelajari strategi dasar</a></li>
                  <li><a href="#banyak-bermain" className="text-primary hover:underline">Berlatihlah dengan bermain sebanyak mungkin</a></li>
                </ol>
              </div>
              <div className="not-prose mt-6 overflow-hidden rounded-xl">
                <div className="aspect-video w-full bg-slate-900 flex items-center justify-center relative">
                  <iframe
                    className="h-full w-full"
                    src="https://www.youtube-nocookie.com/embed/ej_fnsdsksA"
                    title="Cara Bermain Catur - Video Panduan"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">Video oleh IM Danny Rensch – pengantar aturan dasar (sumber: Chess.com).</p>
              </div>
            </>
          )}
        </PageArtikel>
      </div>

      {/* Langkah 1 - Papan Catur */}
      <div id="papan-catur" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Step 1. How to Set Up the Chessboard" : "Langkah 1. Pelajari Cara Mengatur Papan Catur"}>
          <p>
            {isEN
              ? "Always place the board so each player has a light square on the bottom-right corner (h1 for White). White on right!"
              : "Permainan diawali dengan membentangkan papan catur sehingga setiap pemain memiliki petak berwarna putih (atau terang) di sisi kanan bawah (petak h1 untuk Putih). Aturan mudah: putih di kanan!"}
          </p>
          <div className="not-prose my-6 grid md:grid-cols-2 gap-6 items-start">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-8 aspect-square overflow-hidden rounded-lg ring-1 ring-slate-200">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const isLight = (row + col) % 2 === 0;
                  const isSecondRow = row === 6 || row === 1;
                  const isFirstRow = row === 7 || row === 0;
                  let piece = "";
                  if (isFirstRow) {
                    const order = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
                    piece = order[col];
                  } else if (isSecondRow) piece = "♟";
                  return (
                    <div key={i} className={`flex items-center justify-center text-[10px] md:text-xs ${isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"} ${row < 2 ? "text-slate-900" : "text-white"}`}>
                      {piece}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-500 text-center">{isEN ? "Initial setup: second rank pawns, rooks on corners, knights next to them, bishops, queen on its color, king on the remaining square." : "Setup awal: baris kedua pion, benteng di sudut, kuda di sebelahnya, gajah, menteri di warna sesuai, raja di petak sisa."}</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900">{isEN ? "Setup order (from a1 / a8)" : "Urutan susunan (dari a1 / a8):"}</h4>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                <li>{isEN ? "Second rank: 8 pawns" : "Baris kedua: 8 pion"}</li>
                <li>{isEN ? "Corners: Rooks" : "Sudut: Benteng"}</li>
                <li>{isEN ? "Next to rooks: Knights, then Bishops" : "Sebelah benteng: Kuda, lalu Gajah"}</li>
                <li>{isEN ? "Queen always on its own color (white queen on white, black queen on black), king on remaining square" : "Menteri selalu di warna senada (menteri putih di petak putih, menteri hitam di petak hitam), raja di petak sisa"}</li>
              </ul>
              <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                💡 {isEN ? "Tip from our Chess School: practice board vision with coordinates on. Trainer: " : "Tips dari Sekolah Catur: latih visi papan dengan koordinat menyala. Coba: "}
                <a href="https://www.chess.com/id/vision" target="_blank" rel="noreferrer" className="font-semibold underline">Vision Trainer Chess.com</a>
              </div>
            </div>
          </div>
        </PageArtikel>
      </div>

      {/* Langkah 2 - Gerak Buah */}
      <div id="gerak-buah" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Step 2. How the Pieces Move" : "Langkah 2. Kenali Bagaimana Setiap Buah Catur Bergerak"}>
          <p>
            {isEN
              ? "Each of 6 piece types moves differently. Pieces can't jump over others (except knights), can't land on own pieces, but can capture opponents by moving onto their square."
              : "Masing-masing dari 6 jenis buah memiliki cara bergerak berbeda. Buah tidak dapat melewati buah lain (kecuali kuda yang bisa melompat), tidak bisa menempati petak yang sudah diisi buah sendiri, namun bisa memakan lawan dengan menempati petaknya."}
          </p>

          <div className="not-prose mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PieceCard icon="♔" name={isEN ? "King" : "Raja"} gerak={isEN ? "One square any direction. Never move into check. When attacked, it's called 'check'." : "Hanya 1 petak ke segala arah - atas, bawah, samping, diagonal. Tidak boleh melangkah ke petak yang diserang lawan (skak)."} point={isEN ? "Invaluable" : "Tak ternilai"} />
            <PieceCard icon="♕" name={isEN ? "Queen" : "Menteri / Ratu"} gerak={isEN ? "Most powerful. Any number of squares straight or diagonal, as long as path is clear." : "Paling kuat. Bisa lurus ke segala arah - maju, mundur, samping, diagonal - sejauh apapun selama tidak melewati buah sendiri."} point="9" />
            <PieceCard icon="♖" name={isEN ? "Rook" : "Benteng"} gerak={isEN ? "Any number of squares vertically or horizontally. Very strong when protecting each other!" : "Sejauh apapun, tetapi hanya maju, mundur, dan ke samping. Sangat kuat saat saling melindungi!"} point="5" />
            <PieceCard icon="♗" name={isEN ? "Bishop" : "Gajah"} gerak={isEN ? "Any distance diagonally. Each bishop stays forever on its starting color. Two bishops cover each other's weakness." : "Sejauh apapun tetapi hanya diagonal. Setiap gajah mulai di satu warna dan harus tetap di warna itu. Dua gajah saling menutupi kelemahan."} point="3" />
            <PieceCard icon="♘" name={isEN ? "Knight" : "Kuda"} gerak={isEN ? "Moves in an L: 2 squares in one direction + 1 square at 90 degrees. The only piece that can jump over others." : "Bergerak sangat unik: 2 petak ke satu arah + 1 petak lagi 90 derajat, membentuk huruf L. Satu-satunya buah yang bisa melompati buah lain."} point="3" />
            <PieceCard icon="♙" name={isEN ? "Pawn" : "Pion"} gerak={isEN ? "Moves forward 1, first move can move 2. Captures diagonally 1 square. Can't move or capture backwards." : "Bergerak maju 1 petak, langkah pertama boleh 2 petak. Memakan 1 petak diagonal. Tidak bisa mundur atau memakan mundur."} point="1" />
          </div>

          <div className="mt-8 rounded-xl bg-slate-900 p-4 text-white">
            <h4 className="font-semibold">{isEN ? "Interactive lesson" : "Video gerakan buah"}</h4>
            <div className="mt-3 grid md:grid-cols-2 gap-4">
              <div className="aspect-video overflow-hidden rounded-lg bg-slate-800">
                <iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/ZWjDKiHBvZo" title="Raja" allowFullScreen loading="lazy"></iframe>
              </div>
              <div className="aspect-video overflow-hidden rounded-lg bg-slate-800">
                <iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/vwgwI0wnULU" title="Menteri" allowFullScreen loading="lazy"></iframe>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">{isEN ? "Source videos: Chess.com – piece movement. Embedded for educational purpose." : "Sumber video: Chess.com – gerakan buah. Ditampilkan untuk tujuan edukasi Sekolah Catur."}</p>
          </div>
        </PageArtikel>
      </div>

      {/* Langkah 3 - Aturan Khusus */}
      <div id="aturan-khusus" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Step 3. Special Rules" : "Langkah 3. Temukan Aturan Khusus dalam Catur"}>
          <p>{isEN ? "Some rules may seem illogical at first, they were made to make the game more fun." : "Ada beberapa aturan khusus dalam catur yang mungkin terlihat tidak logis pada awalnya. Aturan ini dibuat untuk membuat permainan lebih seru."}</p>

          <h3 className="mt-8 text-xl font-bold text-slate-900">{isEN ? "Pawn Promotion" : "Cara Promosi Pion"}</h3>
          <p>
            {isEN
              ? "When a pawn reaches the far side, it must promote to another piece (except king or pawn) – usually queen. You can promote even if the piece is not captured before."
              : "Pion memiliki kemampuan khusus: jika mencapai sisi seberang papan, pion dapat menjadi perwira lain (disebut promosi) – kecuali raja atau pion itu sendiri. Biasanya dipromosikan menjadi menteri. Kesalahpahaman umum: pion hanya bisa ditukar dengan perwira yang sudah dimakan – itu TIDAK benar."}
          </p>

          <h3 className="mt-8 text-xl font-bold text-slate-900">En Passant</h3>
          <p>
            {isEN
              ? "French for 'in passing'. If a pawn moves 2 squares on its first move and lands beside an opponent pawn, that opponent pawn can capture it as if it had moved only 1 square. This must be done immediately on the next move, otherwise the right is lost."
              : "Aturan Prancis 'sambil lewat'. Jika pion melangkah 2 petak di langkah pertama dan berhenti di samping pion lawan (menghindari dimakan), maka pion lawan punya opsi memakannya seolah-olah pion tersebut hanya maju 1 petak. Gerakan khusus ini harus dilakukan segera di langkah berikutnya, jika tidak opsi hilang."}
          </p>

          <h3 className="mt-8 text-xl font-bold text-slate-900">{isEN ? "Castling" : "Rokade"}</h3>
          <p>
            {isEN
              ? "The only move where you move two pieces at once: king 2 squares toward a rook, and that rook jumps to the square next to king on opposite side. It helps bring king to safety and rook into play."
              : "Satu-satunya langkah di mana Anda menggerakkan dua buah sekaligus: raja 2 petak ke arah benteng, lalu benteng melompat ke petak sebelah raja di sisi berlawanan. Tujuannya mengamankan raja dan mengeluarkan benteng."}
          </p>
          <div className="not-prose mt-4 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold">{isEN ? "Requirements for castling:" : "Syarat rokade:"}</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                <li>{isEN ? "King has never moved" : "Raja belum pernah bergerak"}</li>
                <li>{isEN ? "The rook you castle with has never moved" : "Benteng yang digunakan belum pernah bergerak"}</li>
                <li>{isEN ? "No pieces between king and rook" : "Tidak ada buah lain di antara raja dan benteng"}</li>
                <li>{isEN ? "King not in check, not passing through check, not ending in check" : "Raja tidak dalam skak, tidak melewati petak yang diserang, tidak berakhir di petak skak"}</li>
              </ul>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200">
              <p className="text-sm font-semibold text-blue-900">{isEN ? "Short vs Long" : "Pendek vs Panjang"}</p>
              <p className="mt-1 text-sm text-blue-800">{isEN ? "Castling kingside (to g1/g8) is called short, queenside (to c1/c8) is long. King always moves 2 squares." : "Rokade ke sayap raja (ke g1/g8) disebut pendek, ke sayap menteri (ke c1/c8) disebut panjang. Raja selalu bergerak 2 petak saat rokade."}</p>
            </div>
          </div>
        </PageArtikel>
      </div>

      {/* Langkah 4 */}
      <div id="giliran" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Step 4. Who Moves First" : "Langkah 4. Ketahui Siapa yang Bergerak Lebih Dulu"}>
          <p>
            {isEN
              ? "White always moves first. Players usually decide color randomly – coin toss or hidden pawn. Moving first is a small advantage because White gets to attack first."
              : "Pemain dengan buah putih selalu bergerak lebih dulu. Pemain biasanya memutuskan siapa putih secara acak – lempar koin atau menebak warna pion yang disembunyikan. Bergerak pertama adalah keuntungan kecil karena Putih bisa menyerang lebih dulu."}
          </p>
          <div className="not-prose mt-4 flex items-center gap-3 rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200">
            <span className="text-2xl">♔</span>
            <p className="text-sm text-slate-700">{isEN ? "Then turn order: White, Black, White, Black until game ends." : "Urutan: Putih, Hitam, Putih, Hitam, dan seterusnya hingga akhir permainan."}</p>
          </div>
        </PageArtikel>
      </div>

      {/* Langkah 5 */}
      <div id="cara-menang" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Step 5. How to Win a Chess Game" : "Langkah 5. Pahami Aturan Tentang Cara Memenangkan Permainan"}>
          <p>{isEN ? "There are several ways a game can end: checkmate, draw, resignation, or timeout." : "Ada beberapa cara mengakhiri permainan: skakmat, remis, menyerah, atau kalah waktu."}</p>

          <h3 className="mt-6 text-lg font-bold">{isEN ? "How to Checkmate" : "Cara Skakmat"}</h3>
          <p>{isEN ? "Goal is to checkmate opponent king: king is in check and cannot escape." : "Tujuan permainan adalah menskakmat raja lawan. Ini terjadi jika raja diskak dan tidak dapat keluar."}</p>
          <div className="not-prose mt-4 grid md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 p-3 text-sm"><Badge>1</Badge><p className="mt-2 font-semibold">{isEN ? "Move king away" : "Raja bergerak keluar dari skak"}</p><p className="text-xs text-slate-600">{isEN ? "(but can't castle out of check)" : "(tidak boleh rokade untuk keluar skak!)"}</p></div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm"><Badge>2</Badge><p className="mt-2 font-semibold">{isEN ? "Block the check" : "Blokir skak dengan buah lain"}</p></div>
            <div className="rounded-lg border border-slate-200 p-3 text-sm"><Badge>3</Badge><p className="mt-2 font-semibold">{isEN ? "Capture attacker" : "Memakan buah yang menyakak"}</p></div>
          </div>
          <p className="mt-4 text-sm italic text-slate-600">{isEN ? "If none possible, it's checkmate – game ends, king is not actually captured." : "Jika raja tidak bisa keluar, permainan berakhir. Biasanya raja tidak dimakan atau dikeluarkan dari papan, permainan hanya dinyatakan berakhir."}</p>

          <h3 className="mt-8 text-lg font-bold">{isEN ? "How to Draw" : "Bagaimana Hasil Remis"}</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Stalemate</strong> – {isEN ? "player to move is NOT in check but has no legal move." : "giliran pemain bergerak, tetapi rajanya TIDAK dalam skak dan tidak punya langkah legal."}</li>
            <li>{isEN ? "Both players agree to a draw" : "Kedua pemain sepakat untuk remis"}</li>
            <li>{isEN ? "Insufficient material (e.g., king + bishop vs king)" : "Tidak cukup perwira untuk memaksa skakmat (contoh: raja + gajah vs raja)"}</li>
            <li>{isEN ? "Same position repeated three times" : "Posisi sama persis terulang tiga kali (tidak harus berturut-turut)"}</li>
            <li>{isEN ? "Fifty moves without pawn move or capture" : "50 langkah berturut-turut tanpa gerakan pion atau pertukaran"}</li>
          </ul>
        </PageArtikel>
      </div>

      {/* Langkah 6 */}
      <div id="strategi-dasar" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Step 6. Basic Strategy" : "Langkah 6. Pelajari Strategi Dasar Catur"}>
          <p>{isEN ? "Four simple things every player should know:" : "Ada empat hal sederhana yang harus diketahui setiap pemain:"}</p>

          <div className="not-prose mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <h4 className="font-bold text-slate-900">🛡️ {isEN ? "Protect your King" : "Lindungi Raja"}</h4>
              <p className="mt-2 text-sm text-slate-700">{isEN ? "Castle as soon as possible, usually to the corner where it's safer. No point attacking opponent if your own king gets mated first!" : "Tempatkan raja ke sudut papan yang biasanya lebih aman. Jangan menunda rokade. Tidak ada gunanya hampir skakmat lawan jika raja Anda yang diskakmat lebih dulu!"}</p>
            </div>
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <h4 className="font-bold text-slate-900">💎 {isEN ? "Don't give away pieces" : "Jangan Buang Buah"}</h4>
              <p className="mt-2 text-sm text-slate-700">{isEN ? "Every piece is valuable. Use point system to decide trades." : "Jangan ceroboh kehilangan buah! Gunakan sistem nilai:"}</p>
              <ul className="mt-2 text-xs text-slate-700 space-y-1 list-disc pl-4">
                <li>Pion = 1, Kuda = 3, Gajah = 3, Benteng = 5, Menteri = 9, Raja = ∞</li>
                <li>{isEN ? "Points only help decision-making, not endgame." : "Di akhir permainan poin tak berarti – ini hanya sistem bantu keputusan saat makan, menukar, atau melangkah."}</li>
              </ul>
            </div>
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <h4 className="font-bold text-slate-900">🎯 {isEN ? "Control the Center" : "Kuasai Pusat"}</h4>
              <p className="mt-2 text-sm text-slate-700">{isEN ? "Control center with pawns and pieces. More space = more good squares, harder for opponent." : "Usahakan kuasai pusat papan dengan perwira dan pion. Jika menguasai pusat, lebih banyak ruang gerak dan menyulitkan lawan."}</p>
            </div>
            <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <h4 className="font-bold text-slate-900">⚔️ {isEN ? "Use all your pieces" : "Gunakan Semua Buah"}</h4>
              <p className="mt-2 text-sm text-slate-700">{isEN ? "Don't leave pieces on first rank. Develop all so you have many resources when attacking. One or two pieces won't beat a strong opponent." : "Perwira tidak berguna jika duduk di baris pertama. Kembangkan semua agar banyak sumber daya saat menyerang raja. Satu-dua perwira tidak akan menang lawan kuat."}</p>
            </div>
          </div>
        </PageArtikel>
      </div>

      {/* Langkah 7 */}
      <div id="banyak-bermain" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Step 7. Play as Much as Possible" : "Langkah 7. Berlatihlah dengan Bermain Sebanyak Mungkin"}>
          <p>{isEN ? "Most important to improve: play a lot! Home, club, or online – frequency matters. Nowadays finding a game online is easy!" : "Hal terpenting untuk meningkatkan kemampuan: banyak bermain! Tidak masalah di rumah dengan teman/keluarga atau online, Anda harus banyak bermain untuk berkembang. Zaman sekarang mudah menemukan permainan online!"}</p>
          <div className="not-prose mt-4 flex flex-col md:flex-row gap-3">
            <Link to="/keanggotaan/pendaftaran-anggota" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors">
              {isEN ? "Join as Member – Play Now" : "Daftar Anggota – Mulai Bermain"}
            </Link>
            <a href="https://www.chess.com/id/play/online" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
              {isEN ? "Play on Chess.com" : "Bermain di Chess.com"}
            </a>
          </div>
        </PageArtikel>
      </div>

      {/* Varian */}
      <div id="varian" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Chess Variants" : "Cara Memainkan Varian Catur"}>
          <p>{isEN ? "Most play standard, but some enjoy variants. Each has its own rules:" : "Kebanyakan bermain aturan standar, beberapa suka perubahan aturan – disebut varian catur."}</p>
          <div className="not-prose mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-4"><h4 className="font-bold">Chess960 (Fischer Random)</h4><p className="mt-1 text-sm text-slate-600">{isEN ? "Back rank shuffled randomly among 960 positions. Pawns stay normal. More opening variety." : "Posisi awal perwira diacak dalam 960 kemungkinan. Pion tetap normal, tetapi lebih banyak variasi pembukaan."}</p></div>
            <div className="rounded-xl border border-slate-200 p-4"><h4 className="font-bold">King of the Hill</h4><p className="mt-1 text-sm text-slate-600">{isEN ? "Goal is to bring your king to center (d4,e4,d5,e5)." : "Tujuan membawa raja ke pusat papan / puncak bukit (d4,e4,d5,e5)."}</p></div>
            <div className="rounded-xl border border-slate-200 p-4"><h4 className="font-bold">Bughouse</h4><p className="mt-1 text-sm text-slate-600">{isEN ? "Played in pairs. When you capture, partner can drop that piece on his board." : "Dimainkan berpasangan. Saat memakan buah, rekan setim bisa menggunakan buah itu di papannya sendiri."}</p></div>
            <div className="rounded-xl border border-slate-200 p-4"><h4 className="font-bold">Crazyhouse</h4><p className="mt-1 text-sm text-slate-600">{isEN ? "Captured pieces become yours – you can drop them on your turn." : "Buah yang dimakan berbalik menjadi milik Anda dan bisa ditempatkan di papan kapan saja saat giliran."}</p></div>
            <div className="rounded-xl border border-slate-200 p-4 md:col-span-2"><h4 className="font-bold">3-Check</h4><p className="mt-1 text-sm text-slate-600">{isEN ? "First to give check 3 times wins." : "Pemain pertama yang melakukan skak tiga kali terhadap raja lawan menang."}</p></div>
          </div>
        </PageArtikel>
      </div>

      {/* Aturan Turnamen */}
      <div id="aturan-turnamen" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Tournament Rules" : "Cara Bermain dengan Aturan Turnamen"}>
          <p>{isEN ? "Many tournaments follow similar common rules. They may not apply at home or online, but practice them." : "Banyak turnamen mengikuti aturan umum serupa. Aturan ini tidak selalu berlaku saat di rumah atau online, tapi Anda mungkin ingin berlatih."}</p>
          <ul className="mt-4 space-y-4">
            <li className="rounded-lg bg-amber-50 p-4 ring-1 ring-amber-200"><strong>Pegang-Jalan / Touch-Move</strong> – {isEN ? "If you touch your piece, you must move it if legal. If you touch opponent's piece, must capture it. Say 'I adjust' / 'J'adoube' if just adjusting." : "Jika menyentuh buah sendiri, wajib menjalankannya selama langkah legal. Jika menyentuh buah lawan, wajib memakannya. Jika ingin memperbaiki posisi, ucapkan 'membetulkan' terlebih dahulu."}</li>
            <li className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-200"><strong>{isEN ? "Clock" : "Kontrol Waktu"}</strong> – {isEN ? "Most events use chess clocks. Each gets same time for whole game. After a move, press clock to start opponent's time. Flagged player loses unless opponent lacks sufficient material to mate – then draw." : "Sebagian besar turnamen menggunakan jam catur. Tiap pemain mendapat jumlah waktu sama untuk seluruh permainan. Setelah melangkah, tekan jam untuk memulai waktu lawan. Jika waktu habis dan lawan mengklaim, pemain yang habis waktu kalah (kecuali lawan tidak cukup perwira untuk skakmat – maka remis)."}</li>
          </ul>
        </PageArtikel>
      </div>

      {/* FAQ */}
      <div id="faq" className="scroll-mt-24">
        <PageArtikel title={isEN ? "Chess FAQ" : "Tanya Jawab Catur (FAQ)"}>
          <div className="space-y-6">
            <details className="group rounded-xl border border-slate-200 open:bg-slate-50 p-4">
              <summary className="flex cursor-pointer items-center justify-between font-semibold">{isEN ? "How to improve quickly?" : "Bagaimana cara meningkatkan kemampuan?"}<span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span></summary>
              <div className="mt-3 text-sm text-slate-700 space-y-2">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>{isEN ? "Play a lot, learn from wins and losses" : "Banyak bermain – belajar dari menang & kalah"}</li>
                  <li>{isEN ? "Take online lessons" : "Ikuti pelajaran online"} – <a href="https://www.chess.com/id/lessons" target="_blank" rel="noreferrer" className="text-primary underline">Chess.com Lessons</a></li>
                  <li>{isEN ? "Have fun – everyone loses, even World Champions" : "Bersenang-senang – jangan patah semangat, semua pernah kalah bahkan juara dunia"}</li>
                </ol>
              </div>
            </details>

            <details className="group rounded-xl border border-slate-200 open:bg-slate-50 p-4">
              <summary className="flex cursor-pointer items-center justify-between font-semibold">{isEN ? "Best first move?" : "Langkah pertama terbaik?"}<span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span></summary>
              <p className="mt-3 text-sm text-slate-700">{isEN ? "No consensus, but fight for center. Most play 1.e4 (king pawn two squares) or 1.d4, some 1.c4 or 1.Nf3. Fischer believed 1.e4 best." : "Tidak ada yang disepakati sebagai terbaik, tapi penting menguasai pusat. Kebanyakan memainkan pion tengah maju 2 petak: 1.d4 atau 1.e4, beberapa 1.c4 atau 1.Kf3. Bobby Fischer percaya 1.e4 terbaik."}</p>
            </details>

            <details className="group rounded-xl border border-slate-200 open:bg-slate-50 p-4">
              <summary className="flex cursor-pointer items-center justify-between font-semibold">{isEN ? "What is notation?" : "Apa itu notasi catur?"}<span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span></summary>
              <p className="mt-3 text-sm text-slate-700">{isEN ? "Notation lets you record & replay games. Each square has coordinate, each piece has initial (K,N,B,R,Q,K). Essential for analysis." : "Notasi memungkinkan menyimpan dan memutar kembali permainan. Setiap petak memiliki koordinat dan setiap perwira diwakili inisial (K untuk Kuda, G untuk Gajah, M untuk Menteri, B untuk Benteng, R untuk Raja)."}</p>
            </details>

            <details className="group rounded-xl border border-slate-200 open:bg-slate-50 p-4">
              <summary className="flex cursor-pointer items-center justify-between font-semibold">
                {isEN ? "Can pawns move backwards?" : "Bisakah pion bergerak mundur?"}<span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span></summary>
              <p className="mt-3 text-sm text-slate-700">{isEN ? "No. But when pawn promotes, the new piece can move backwards (if queen, rook, bishop...)." : "Tidak. Namun saat pion promosi menjadi perwira lain (mis. menteri), buah baru itu bisa bergerak mundur."}</p>
            </details>

            <div className="not-prose mt-8 rounded-xl bg-primary p-6 text-white">
              <h4 className="text-lg font-bold">{isEN ? "Ready to start?" : "Siap untuk mulai bermain catur?"}</h4>
              <p className="mt-2 text-sm text-white/90">{isEN ? "Register free on Chess.com and join our community tournaments!" : "Daftarkan diri gratis di Chess.com dan mulailah menikmati permainan bersama Komunitas Catur Indonesia!"}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a href="https://www.chess.com/id/register" target="_blank" rel="noreferrer" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-primary hover:bg-slate-100">{isEN ? "Register Now – Free!" : "Daftar Sekarang – Gratis!"}</a>
                <Link to="/program-kami/sekolah-catur" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">← {t("nav.sekolahCatur")}</Link>
              </div>
              <p className="mt-4 text-[11px] text-white/60">{isEN ? "Content adapted from Chess.com Indonesian article 'Cara Bermain Catur' for educational use in our Chess School program. Original: https://www.chess.com/id/cara-bermain-catur" : "Konten diadaptasi dari artikel Chess.com Indonesia 'Cara Bermain Catur: 7 Aturan untuk Memulai' untuk tujuan edukasi program Sekolah Catur. Sumber asli: https://www.chess.com/id/cara-bermain-catur"}</p>
            </div>
          </div>
        </PageArtikel>
      </div>

      <PageSelanjutnya to="/turnamen" judul={t("sekolahCatur.nextJudul")} />
    </>
  );
}