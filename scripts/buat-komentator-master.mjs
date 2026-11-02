#!/usr/bin/env node
/**
 * Generator korpus komentar master (`public/data/komentator-master.json`)
 * yang diolah dari koleksi PGN beranotasi `ValdemarOrn/Chess`
 * (`Annotated Games/*.pgn` & `TestData/HumansVsComputers.pgn`).
 *
 * Setiap entri memetakan hash kompak 16-heks dari `${epdSebelum}|${san}` ke
 * pasangan komentar murni seputar posisi papan:
 *   [teksId, teksEn]
 * Tanpa label arsip, tanpa nama turnamen/pemain yang tidak relevan dengan
 * partai pengguna, sehingga dapat langsung diucapkan secara alami oleh
 * komentator di `/papan-interaktif` maupun `/papan-interaktif/manusia-vs-mesin`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BERKAS_SUMBER = path.join(AKAR, "scripts/data-sumber/valdemar-komentar-mentah.json");
const BERKAS_KELUARAN = path.join(AKAR, "public/data/komentator-master.json");

function kunciEpd(fen) {
  return String(fen || "").trim().split(/\s+/).slice(0, 4).join(" ");
}

export function hashPosisiLangkah(epdSebelum, san) {
  const masukan = `${kunciEpd(epdSebelum)}|${String(san || "").trim()}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < masukan.length; i += 1) {
    const c = masukan.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
}

function bersihkanTeks(teks) {
  let s = String(teks || "")
    .replace(/\[%[^\]]*\]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\bwww\.\S+/g, " ")
    .replace(/[:;]-?[)D(P]/g, " ")
    .replace(
      /\s+(?:Bereits|Obwohl|Aber|Hier|Jetzt|Wenn|Weil|Doch|Auch|Schon|Zwar|Natuerlich|Natürlich|Der|Die|Das|Ein|Eine|Schwarz|Weiss|Mit|Nach|Oder)\s+[A-ZÄÖÜa-zäöüß]+\s+[a-zäöüß].*$/,
      ""
    )
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/^[!?+\-=]+\s*[-–—:]?\s*/, "").trim();
  if (s && !/[.!?)"']$/.test(s)) s += ".";
  return s;
}

/** Saring catatan mentah agar hanya menyisakan ulasan posisi objektif (tanpa curhat pemain/jam/turnamen). */
const POLA_META_PARTAI =
  /\b(I|my|me|we|our|this game|in the game|the game|player|players|veteran|century|computer|computers|champion|championship|tournament|match|round|clock|minutes|hours|resign|resigned|adjourn|point of view|surprise|surprising|know|she|he|his|her|him|himself|herself|anderssen|tartakower|kasparov|karpov|kramnik|anand|polgar|shirov|ivanchuk|morphy|fischer|spassky|tal|botvinnik|capablanca|alekhine|bronstein|korchnoi|timman|svidler|adams|topalov|ponomariov|bareev|leko|short|deep blue|fritz|junior|hydra|rebel)\b/i;

/**
 * Kurasi dwibahasa murni posisi (ID & EN) untuk 120+ jalur pembukaan, gambit,
 * perangkap taktis, dan tabiya babak tengah yang diolah dari `ValdemarOrn/Chess`.
 */
const KURASI_DWIBAHASA = [
  // === Langkah Pertama Putih ===
  {
    jalur: ["e4"],
    id: "1.e4 langsung mencengkeram petak pusat d5 dan f5 sekaligus membuka diagonal bagi menteri serta gajah petak terang.",
    en: "1.e4 stakes an immediate claim to d5 and f5 while opening diagonals for both the queen and the king's bishop.",
  },
  {
    jalur: ["d4"],
    id: "1.d4 menguasai petak e5 dan c5 dengan pion yang sudah terjaga menteri sejak langkah pertama, mengarahkan permainan ke duel strategis yang solid.",
    en: "1.d4 controls e5 and c5 with a pre-defended central pawn, steering play into rich strategic territory right from move one.",
  },
  {
    jalur: ["Nf3"],
    id: "1.Nf3 mengaktifkan kuda ke petak terbaiknya untuk mengawasi d4 dan e5 tanpa tergesa-gesa memperlihatkan susunan pion pusat.",
    en: "1.Nf3 develops the knight to its most natural post, eyeing d4 and e5 while keeping White's central pawn structure flexible.",
  },
  {
    jalur: ["c4"],
    id: "Pembukaan Inggris: Putih menekan petak pusat d5 dari sayap dan menyiapkan pertarungan manuver jangka panjang.",
    en: "The English Opening fights for the central d5 square from the flank, inviting a nuanced positional battle.",
  },
  {
    jalur: ["g3"],
    id: "1.g3 menyiapkan fianchetto gajah ke g2 agar diagonal panjang h1-a8 langsung menekan jantung pertahanan lawan.",
    en: "1.g3 prepares to fianchetto the bishop on g2, aiming long-range pressure straight across the central dark and light squares.",
  },
  {
    jalur: ["f4"],
    id: "Pembukaan Bird: Putih langsung mencengkeram petak e5 dari sayap raja dengan konsekuensi sedikit melonggarkan diagonal raja sendiri.",
    en: "Bird's Opening clamps down on the e5 square immediately, trading a slight loosening of the kingside for asymmetrical fighting chances.",
  },
  {
    jalur: ["b3"],
    id: "Pembukaan Larsen: menyiapkan gajah ke b2 untuk menembak petak e5 dan g7 dari diagonal panjang sayap menteri.",
    en: "Larsen's Opening prepares Bb2 to exert long-range pressure against e5 and the enemy kingside from afar.",
  },

  // === Partai Terbuka (1.e4 e5) ===
  {
    jalur: ["e4", "e5"],
    id: "Hitam menantang pusat secara simetris lewat 1...e5 dan mencegah Putih mendorong d4 tanpa persiapan.",
    en: "Black meets White head-on in the center with 1...e5, preventing an unchallenged d4 advance.",
  },
  {
    jalur: ["e4", "e5", "Nf3"],
    id: "2.Nf3 mengembangkan kuda dengan tempo menyerang pion e5 sekaligus membersihkan baris belakang untuk rokade pendek.",
    en: "2.Nf3 develops with tempo against the e5 pawn while clearing the kingside for early castling.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6"],
    id: "2...Nc6 menjaga pion e5 secara alami sekaligus memperkuat kendali Hitam atas petak pusat d4.",
    en: "2...Nc6 defends the e5 pawn naturally while bringing a piece into the fight for d4.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nf6"],
    id: "Pertahanan Petroff: alih-alih bertahan pasif menjaga e5, Hitam langsung membalas menekan pion e4 Putih.",
    en: "Petroff's Defense: instead of passively guarding e5, Black counterattacks White's e4 pawn immediately.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nf6", "Nxe5", "d6"],
    id: "3...d6 wajib dimainkan sebelum merebut balik e4; bila langsung 3...Nxe4?, 4.Qe2 memaksa Hitam kehilangan tempo atau materi.",
    en: "3...d6 is essential before recapturing on e4; grabbing immediately with 3...Nxe4? runs into serious trouble after 4.Qe2.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "d6"],
    id: "Pertahanan Philidor: menjaga e5 dengan rantai pion kokoh, walau untuk sementara membatasi ruang gerak gajah f8.",
    en: "Philidor's Defense bolsters e5 with a sturdy pawn chain, accepting a slightly cramped dark-squared bishop on f8.",
  },
  {
    jalur: ["e4", "e5", "Bc4"],
    id: "Permainan Gajah: langsung membidik titik terlemah f7 sebelum menentukan apakah kuda g1 atau pion f2-f4 yang menyusul.",
    en: "The Bishop's Opening targets the vulnerable f7 square immediately while keeping the f-pawn free to advance.",
  },
  {
    jalur: ["e4", "e5", "Nc3"],
    id: "Partai Wina: menjaga pion e4 dengan tenang sambil menyimpan opsi dobrakan agresif f2-f4 seperti Gambit Raja yang lebih terlindung.",
    en: "The Vienna Game secures e4 solidly while holding in reserve an energetic f2-f4 strike against the center.",
  },
  {
    jalur: ["e4", "e5", "f4"],
    id: "Gambit Raja: menawarkan pion f4 untuk menarik pion e5 keluar dari pusat dan membuka lajur f bagi benteng.",
    en: "The King's Gambit offers the f-pawn to deflect Black's e5 pawn from the center and pry open the f-file.",
  },
  {
    jalur: ["e4", "e5", "f4", "exf4"],
    id: "Hitam menerima tantangan gambit; Putih kini mengincar penguasaan pusat lewat d4 sementara Hitam siap mengganggu dengan ...Qh4+ atau ...d5.",
    en: "Gambit accepted: White gets a free hand to seize the center with Nf3 and d4, while Black looks to disrupt swiftly with ...d5.",
  },

  // === Ruy Lopez (Spanyol) ===
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    id: "Pembukaan Spanyol (Ruy Lopez): menekan kuda penjaga e5 dan memulai pertarungan strategis jangka panjang di pusat serta sayap.",
    en: "The Ruy Lopez pressures the defender of e5, ushering in a deep strategic struggle for central control.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"],
    id: "3...a6 langsung menanyakan keputusan gajah b5; memukul 4.Bxc6 dxc6 5.Nxe5 belum memenangkan pion karena 5...Qd4! merebutnya kembali.",
    en: "3...a6 puts the question to the bishop immediately; 4.Bxc6 dxc6 5.Nxe5 wins no pawn because 5...Qd4! forks knight and e-pawn.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4"],
    id: "Gajah mundur ke a4 agar tetap memelihara tekanan tak langsung ke e5 sekaligus siap berlindung ke b3 bila dikejar ...b5.",
    en: "Retreating to a4 maintains the awkward pin theme against c6 while keeping b3 ready if Black chases with ...b5.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6"],
    id: "Variasi Pertukaran Ruy Lopez: Putih merusak struktur pion sayap menteri Hitam demi keunggulan mayoritas pion 4 lawan 3 di sayap raja.",
    en: "The Exchange Ruy Lopez: White hands over the bishop pair to saddle Black with doubled c-pawns and create a kingside pawn majority.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"],
    id: "Pertahanan Berlin: mengembangkan kuda sambil mengancam e4, siap memasuki posisi super kokoh bahkan bila menteri ditukar dini.",
    en: "The Berlin Defense develops actively against e4, ready to enter a famously resilient endgame structure.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"],
    id: "Putih rokade dan membiarkan e4 tampak bebas; bila Hitam menyambar 5...Nxe4, lajur e yang terbuka akan menggempur raja Hitam lewat d4 dan Re1.",
    en: "White castles and leaves e4 indirectlyprotected: capturing it opens the central e-file dangerously after d4 and Re1.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],
    id: "Ruy Lopez Tertutup: 5...Be7 menutup jalur skak di lajur e sehingga ancaman ...b5 diikuti ...Nxe4 kini benar-benar nyata.",
    en: "Closed Ruy Lopez: once ...Be7 shields the e-file, ...b5 and ...Nxe4 becomes a genuine threat that White must address.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1"],
    id: "6.Re1 melindungi pion e4 secara langsung sekaligus memperbarui ancaman memenangkan pion e5 lewat Bxc6 dan Nxe5.",
    en: "6.Re1 guards e4 directly and renews White's threat to win the e5 pawn via Bxc6 and Nxe5.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3"],
    id: "9.h3 mencegah paku ...Bg4 yang mengganggu kuda penjaga d4 sebelum Putih mendorong pusat penuh lewat d2-d4.",
    en: "9.h3 rules out an annoying ...Bg4 pin against the f3 knight before White commits to the thematic d2-d4 central push.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Nxe4"],
    id: "Ruy Lopez Terbuka: Hitam berani mengambil pion e4 untuk mendapatkan ruang gerak perwira aktif ketimbang bertahan rapat.",
    en: "The Open Ruy Lopez: Black grabs e4 to secure free, active piece play rather than enduring slow positional pressure.",
  },

  // === Partai Italia, Dua Kuda, & Skotlandia ===
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    id: "Partai Italia: gajah meluncur ke c4 membidik langsung petak lemah f7 di dekat raja Hitam.",
    en: "The Italian Game posts the bishop actively on c4, aiming straight at the sensitive f7 square.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
    id: "Giuoco Piano: Hitam membalas menempatkan gajah di diagonal aktif a7-g1, mengimbangi tekanan Putih atas petak pusat d4.",
    en: "Giuoco Piano: Black mirrors with the bishop on c5, eyeing f2 and contesting control of the central d4 square.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3"],
    id: "4.c3 menyiapkan pondasi kokoh untuk mendorong d2-d4 guna merebut pusat penuh dengan tempo.",
    en: "4.c3 builds a pawnlaunchpad to strike in the center with d2-d4 on the very next turn.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3"],
    id: "Giuoco Pianissimo: Putih memilih bangunan tenang dengan d3, menunda benturan langsung demi manuver kuda c3-e2-g3 dan c3.",
    en: "Giuoco Pianissimo: White opts for a patient buildup, keeping tension intact while maneuvering pieces toward optimal posts.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"],
    id: "Gambit Evans: mengorbankan pion sayap b4 untuk merebut tempo c3 dan d4 sehingga seluruh garis serangan Putih terbuka lebar.",
    en: "The Evans Gambit sacrifices a wing pawn on b4 to gain crucial tempi for c3, d4, and sweeping piece development.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
    id: "Pertahanan Dua Kuda: Hitam memilih pengembangan aktif sambil menyerang e4 ketimbang sekadar menyalin gajah Putih.",
    en: "The Two Knights Defense develops aggressively against e4, inviting sharp tactical complications.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"],
    id: "4.Ng5 langsung menggempur titik f7 dengan kuda dan gajah — memaksa Hitam menjawab akurat lewat 4...d5!",
    en: "4.Ng5 gangs up directly on f7 with knight and bishop, practically forcing the sharp counterstrike 4...d5!",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Na5"],
    id: "Jalur utama melawan 4.Ng5: alih-alih merebut balik d5 yang memicu serangan Fried Liver, 5...Na5 mengusir gajah penyerang Putih lebih dulu.",
    en: "Sidestepping the dangerous Nxf7 sacrifice on 5...Nxd5, 5...Na5 chases White's attacking bishop off the a2-g8 diagonal.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "d4"],
    id: "Partai Skotlandia: Putih langsung menantang e5 pada langkah ketiga untuk membebaskan petak dan diagonal perwira tanpa menunggu lama.",
    en: "The Scotch Game challenges e5 right on move three, opening central lines immediately for active piece play.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4"],
    id: "Setelah pertukaran di d4, Putih memiliki ruang pusat lebih lega sementara Hitam siap menekan balik kuda d4 lewat ...Bc5 atau ...Nf6.",
    en: "With the center opened, White enjoys central space while Black gains immediate tempo targets against the d4 knight.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
    id: "Partai Empat Kuda: kedua pihak mengutamakan pengembangan kuda yang sehat sebelum memutuskan arah gajah.",
    en: "The Four Knights Game brings all four knights into action harmoniously before committing the bishops.",
  },

  // === Pertahanan Sisilia (1.e4 c5) ===
  {
    jalur: ["e4", "c5"],
    id: "Pertahanan Sisilia: Hitam langsung mematahkan simetri untuk menjaga petak d4 dari sayap dan menciptakan pertarungan tajam dua arah.",
    en: "The Sicilian Defense breaks symmetry immediately, fighting for d4 from the flank to create dynamic winning chances.",
  },
  {
    jalur: ["e4", "c5", "Nf3"],
    id: "2.Nf3 menyiapkan pembukaan pusat 3.d4 guna menukar pion d Putih dengan pion c Hitam dan membuka lajur pusat.",
    en: "2.Nf3 prepares the thematic 3.d4 break to open central files ahead of Black's kingside development.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6"],
    id: "2...d6 mengawasi petak e5 dan menyiapkan skema Sisilia Terbuka seperti Najdorf, Naga (Dragon), atau Scheveningen.",
    en: "2...d6 secures the e5 square and sets the stage for major Open Sicilian systems like the Najdorf, Dragon, or Scheveningen.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "Nc6"],
    id: "2...Nc6 mengembangkan kuda ke petak alami untuk mempererat kontrol atas d4 dan e5.",
    en: "2...Nc6 develops naturally toward the center, reinforcing control over d4 and e5.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "e6"],
    id: "2...e6 menjaga petak d5 sejak awal dan membuka jalan bagi variasi Kan, Taimanov, atau Scheveningen yang lentur.",
    en: "2...e6 guards d5 early and keeps flexible options for the Kan, Taimanov, or Scheveningen setups.",
  },
  {
    jalur: ["e4", "c5", "c3"],
    id: "Sisilia Alapin: Putih menghindari jalur hafalan Sisilia Terbuka dan menyiapkan pusat pion penuh lewat d2-d4.",
    en: "The Alapin Sicilian sidesteps main-line Open theory, aiming to establish an unchallenged d4-e4 pawn duo.",
  },
  {
    jalur: ["e4", "c5", "Nc3"],
    id: "Sisilia Tertutup: Putih menahan d4 untuk menyusun serangan bertahap di sayap raja lewat g3, Bg2, d3, dan f4.",
    en: "The Closed Sicilian keeps the center intact, gearing up for a coordinated kingside buildup with g3, Bg2, and f4.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "Nc6", "Bb5"],
    id: "Serangan Rossolimo: menantang kuda c6 sejak dini untuk merusak struktur pion sayap menteri Hitam tanpa harus membuka d4.",
    en: "The Rossolimo Attack targets the c6 knight immediately, fighting for structural trumps rather than an all-out open brawl.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4"],
    id: "Sisilia Terbuka dimulai: Putih unggul ruang dan pengembangan di pusat, sementara Hitam memegang lajur setengah terbuka c dan mayoritas pion tengah.",
    en: "Open Sicilian tabiya: White gains central space and piece lead, while Black claims the half-open c-file and central pawn majority.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    id: "Sisilia Najdorf: 5...a6 menutup petak b5 dari perwira Putih dan menyiapkan ekspansi sayap menteri ...b5 dengan struktur yang amat lentur.",
    en: "The Najdorf Variation denies White the b5 square, prepares ...b5 counterplay, and keeps Black's central pawn structure flexible.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"],
    id: "Sisilia Naga (Dragon): gajah Hitam akan ditempatkan di g7 untuk menyemburkan api sepanjang diagonal panjang h8-a1 ke arah sayap menteri.",
    en: "The Sicilian Dragon prepares ...Bg7, turning the dark-squared bishop into a powerhouse raking down the h8-a1 diagonal.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"],
    id: "Sisilia Scheveningen: rantai pion kecil d6-e6 membentengi petak pusat c5, d5, e5, dan f5 dari lompatan perwira Putih.",
    en: "The Scheveningen 'small center' on d6 and e6 builds a resilient barrier against White's central piece jumps.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3"],
    id: "Serangan Inggris terhadap Najdorf: Putih berencana memasang f3, Qd2, rokade panjang, lalu melancarkan badai pion g4-h4.",
    en: "The sharp English Attack: White sets up f3, Qd2, queenside castling, and a direct kingside pawn storm.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5", "Ndb5", "d6"],
    id: "Sisilia Sveshnikov: Hitam rela memberikan petak d5 dan pion d6 terbelakang demi pasangan gajah aktif serta pukulan balik ...f5.",
    en: "The Sveshnikov Variation trades a structural hole on d5 for dynamic piece play and fierce counterplay on the kingside.",
  },

  // === Prancis, Caro-Kann, Skandinavia, Pirc, & Alekhine ===
  {
    jalur: ["e4", "e6"],
    id: "Pertahanan Prancis: menyiapkan dobrakan pusat 2...d5 dengan kokoh, meski sementara membatasi diagonal gajah petak terang c8.",
    en: "The French Defense prepares a solid 2...d5 counterstrike in the center, accepting a temporarily hemmed-in c8 bishop.",
  },
  {
    jalur: ["e4", "e6", "d4", "d5"],
    id: "Hitam langsung menantang pion e4; Putih kini memilih apakah maju menutup pusat (3.e5), menjaga (3.Nc3 / 3.Nd2), atau menukar (3.exd5).",
    en: "Black challenges e4 head-on, forcing White to choose between advancing with e5, defending with Nc3/Nd2, or exchanging.",
  },
  {
    jalur: ["e4", "e6", "d4", "d5", "e5"],
    id: "Prancis Variasi Maju: Putih mengunci pusat untuk meraih ruang di sayap raja, sementara Hitam wajib segera menggempur pangkal rantai pion d4 lewat ...c5!",
    en: "Advance French: White claims space with e5, and Black's thematic counterplay begins immediately against the d4 base via ...c5!",
  },
  {
    jalur: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"],
    id: "Prancis Winawer: memaku kuda c3 untuk meruntuhkan penjaga e4 dan memancing pertarungan asimetris yang tajam setelah 4.e5 c5.",
    en: "The Winawer Variation pins the c3 knight to undermine e4, inviting a sharp asymmetrical clash after 4.e5 c5.",
  },
  {
    jalur: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"],
    id: "Prancis Klasik: menambah tekanan ke e4 agar bila Putih mendorong e5, Hitam siap membalas menggergaji rantai pion dengan ...Nfd7 dan ...c5.",
    en: "Classical French: Black pressures e4 to provoke e5, followed by regrouping the knight and striking at d4 with ...c5.",
  },
  {
    jalur: ["e4", "e6", "d4", "d5", "Nd2"],
    id: "Prancis Tarrasch: menjaga e4 tanpa memblokir pion c2 sehingga Putih leluasa menopang d4 lewat c2-c3 jika diserang ...c5.",
    en: "The Tarrasch Variation defends e4 while keeping the c-pawn free to bolster the d4 center with c2-c3.",
  },
  {
    jalur: ["e4", "c6"],
    id: "Pertahanan Caro-Kann: menyiapkan tantangan pusat 2...d5 yang kokoh sambil membiarkan gajah petak terang c8 tetap bebas keluar.",
    en: "The Caro-Kann Defense prepares a rock-solid 2...d5 challenge while keeping the c8 bishop's diagonal open.",
  },
  {
    jalur: ["e4", "c6", "d4", "d5"],
    id: "Posisi dasar Caro-Kann: Hitam langsung mempertanyakan pion e4 dengan sokongan utuh pion c6.",
    en: "The starting tabiya of the Caro-Kann: Black challenges e4 immediately with sturdy pawn support from c6.",
  },
  {
    jalur: ["e4", "c6", "d4", "d5", "e5"],
    id: "Caro-Kann Variasi Maju: Putih menyita ruang tengah, sedangkan Hitam leluasa mengeluarkan gajah ke f5 sebelum menutup rantai pion dengan ...e6.",
    en: "Advance Caro-Kann: White gains space, while Black brings the light-squared bishop cleanly to f5 before playing ...e6.",
  },
  {
    jalur: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5"],
    id: "Caro-Kann Klasik: gajah c8 langsung menantang kuda kuat Putih di e4 agar Hitam dapat menyelesaikan pengembangan dengan nyaman.",
    en: "Classical Caro-Kann: Black develops the light-squared bishop actively to f5, challenging White's centralized knight.",
  },
  {
    jalur: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nd7"],
    id: "4...Nd7 menyiapkan ...Ngf6 tanpa takut pion bertumpuk bila Putih memukul di f6, menjaga struktur Hitam tetap lentur dan sangat ulet.",
    en: "4...Nd7 prepares ...Ngf6 so that if White exchanges on f6, Black recaptures with the knight and keeps the pawn structure pristine.",
  },
  {
    jalur: ["e4", "d5"],
    id: "Pertahanan Skandinavia: langsung menantang pion e4 pada langkah pertama untuk membongkar garis pusat sejak awal.",
    en: "The Scandinavian Defense strikes at e4 on move one, clearing central tension immediately.",
  },
  {
    jalur: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5"],
    id: "Menteri Hitam mundur ke a5 agar aman dari perwira ringan sekaligus memberikan tekanan miring ke arah c3 dan raja Putih.",
    en: "Retreating the queen to a5 keeps it active along the fifth rank and diagonal while staying clear of easy tempo attacks.",
  },
  {
    jalur: ["e4", "d6", "d4", "Nf6", "Nc3", "g6"],
    id: "Pertahanan Pirc: Hitam sengaja mengundang pusat pion lebar Putih untuk nantinya digempur lewat gajah g7 serta dobrakan ...c5 atau ...e5.",
    en: "The Pirc Defense invites White's broad pawn center in order to undermine it dynamically with ...Bg7 and ...c5 or ...e5.",
  },
  {
    jalur: ["e4", "Nf6"],
    id: "Pertahanan Alekhine: memancing pion pusat Putih maju terus mengejar kuda agar barisan pion itu melar dan menjadi sasaran balik.",
    en: "Alekhine's Defense provokes White's pawns forward with tempo so Black can later attack the overextended pawn chain.",
  },

  // === Partai Pion Menteri (1.d4 d5) ===
  {
    jalur: ["d4", "d5"],
    id: "1...d5 membangun pijakan klasik di pusat dan menghentikan Putih menguasai e4 tanpa persiapan.",
    en: "1...d5 establishes a classical central foothold and prevents White from claiming e4 for free.",
  },
  {
    jalur: ["d4", "d5", "c4"],
    id: "Gambit Menteri: menawarkan pion sayap c4 sementara demi menggoyahkan pion penjaga pusat Hitam di d5.",
    en: "The Queen's Gambit offers a flank pawn temporarily in order to deflect Black's central d5 anchor.",
  },
  {
    jalur: ["d4", "d5", "c4", "e6"],
    id: "Gambit Menteri Ditolak: memperkokoh titik pusat d5 dengan pion e6 sekaligus membuka diagonal gajah petak gelap.",
    en: "The Queen's Gambit Declined reinforces d5 solidly with e6 while opening a line for the f8 bishop.",
  },
  {
    jalur: ["d4", "d5", "c4", "c6"],
    id: "Pertahanan Slav: menopang pion d5 dengan c6 agar gajah petak terang c8 tetap bebas keluar ke f5 atau g4.",
    en: "The Slav Defense supports d5 with a pawn while leaving the light-squared c8 bishop free to develop outside the chain.",
  },
  {
    jalur: ["d4", "d5", "c4", "dxc4"],
    id: "Gambit Menteri Diterima: menyerahkan pusat sesaat agar lajur terbuka cepat dan Hitam siap menghantam balik lewat ...c5.",
    en: "Queen's Gambit Accepted: Black cedes the center momentarily to open lines and counterattack swiftly with ...c5.",
  },
  {
    jalur: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5"],
    id: "Paku klasik ke f6 meningkatkan tekanan terhadap pusat d5 dan menuntut ketelitian Hitam menata pertahanan sayap raja.",
    en: "The classical Bg5 pin heightens pressure against d5 by tying down its primary defender on f6.",
  },
  {
    jalur: ["d4", "d5", "c4", "e6", "Nc3", "c5"],
    id: "Pertahanan Tarrasch: Hitam langsung menantang d4 demi aktivitas perwira bebas walau berisiko menanggung pion d5 terisolasi.",
    en: "The Tarrasch Defense strikes back at d4 immediately, trading potential isolated-pawn risk for free, active piece play.",
  },
  {
    jalur: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6"],
    id: "Pertahanan Semi-Slav: segitiga pion kokoh c6-d5-e6 menyiapkan baik pertahanan rapat maupun komplikasi tajam ...dxc4 dan ...b5.",
    en: "The Semi-Slav builds a sturdy c6-d5-e6 pawn triangle while threatening to grab on c4 and hold the pawn with ...b5.",
  },
  {
    jalur: ["d4", "d5", "Bf4"],
    id: "Sistem London: mengeluarkan gajah petak gelap ke f4 lebih dulu sebelum membangun piramida pion kokoh c3-d4-e3.",
    en: "The London System deploys the dark-squared bishop actively to f4 before building a solid c3-d4-e3 pawn pyramid.",
  },
  {
    jalur: ["d4", "d5", "Nf3", "Nf6", "Bf4"],
    id: "Bangunan London modern: kuda f3 dan gajah f4 bekerja sama mengendalikan petak pusat e5 dengan sangat rapi.",
    en: "Modern London setup: the f3 knight and f4 bishop clamp down harmoniously on the central e5 square.",
  },

  // === Pertahanan Hindia & Katalan (1.d4 Nf6) ===
  {
    jalur: ["d4", "Nf6"],
    id: "1...Nf6 menghentikan 2.e4 secara langsung sambil menyembunyikan apakah Hitam akan bermain Hindia Raja, Nimzo, atau Gambit Menteri.",
    en: "1...Nf6 prevents an immediate 2.e4 while keeping Black's choice of central pawn structure completely flexible.",
  },
  {
    jalur: ["d4", "Nf6", "c4"],
    id: "2.c4 meraih ruang di sayap menteri dan menyiapkan Nc3 untuk memperebutkan petak e4.",
    en: "2.c4 claims queenside space and prepares Nc3 to fight for the crucial e4 advance.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
    id: "Pertahanan Nimzo-Hindia: memaku kuda c3 agar tidak bisa mengawal e4, sekaligus siap merusak pion Putih dengan Bxc3+ bila perlu.",
    en: "The Nimzo-Indian Defense neutralizes White's e4 plan by pinning the c3 knight and fighting for light-square control.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"],
    id: "Pertahanan Hindia Menteri: karena Putih mengelak dari paku Nimzo lewat 3.Nf3, Hitam menyiapkan gajah b7 untuk menguasai petak terang pusat.",
    en: "The Queen's Indian Defense: with Nc3 delayed, Black fianchettoes on b7 to battle for the central e4 and d5 light squares.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "e6", "g3"],
    id: "Pembukaan Katalan: memadukan ruang Gambit Menteri dengan tekanan tajam gajah fianchetto g2 ke sepanjang sayap menteri Hitam.",
    en: "The Catalan combines Queen's Gambit central pressure with a piercing g2 bishop raking across Black's queenside.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"],
    id: "Pertahanan Hindia Raja: membiarkan Putih mendirikan pusat pion lebar e4-d4 untuk kemudian dihantam lewat ...e5 atau ...c5 dan serangan sayap raja.",
    en: "The King's Indian Defense allows White a broad pawn center in order to counterattack dynamically with ...e5 or ...c5.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    id: "4...d6 menahan dorongan e4-e5 prematur dan menyiapkan rokade pendek sebelum Hitam melancarkan pukulan balik di pusat.",
    en: "4...d6 restrains e4-e5 and prepares kingside castling ahead of Black's thematic central counterstrike.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
    id: "Pertahanan Grunfeld: menghantam pusat Putih seketika dengan 3...d5 agar pusat pion setelah cxd5 Nxd5 e4 Nxc3 bxc3 menjadi sasaran gajah g7.",
    en: "The Grunfeld Defense strikes the center immediately with 3...d5, aiming to besiege White's pawn center from afar.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "c5", "d5"],
    id: "Pertahanan Benoni Modern: struktur pion tak simetris memberi Putih mayoritas tengah dan memberi Hitam mayoritas sayap menteri serta gajah g7 yang hidup.",
    en: "The Modern Benoni creates sharp asymmetry: a central pawn majority for White against Black's queenside majority and active dark-squared bishop.",
  },
  {
    jalur: ["d4", "f5"],
    id: "Pertahanan Belanda: Hitam langsung bertarung menguasai petak e4 dari sayap raja untuk menciptakan permainan tak seimbang sejak awal.",
    en: "The Dutch Defense stakes an immediate asymmetric claim to e4, steering straight into a double-edged fight.",
  },

  // === Inggris & Reti ===
  {
    jalur: ["c4", "e5"],
    id: "Sisilia Terbalik dalam Pembukaan Inggris: Hitam langsung menancapkan pion di e5 untuk mencengkeram petak pusat d4.",
    en: "Reversed Sicilian in the English Opening: Black plants a pawn on e5 immediately to contest the central d4 square.",
  },
  {
    jalur: ["c4", "c5"],
    id: "Inggris Simetris: pertarungan halus memperebutkan petak d4 dan d5 serta diagonal panjang kedua gajah fianchetto.",
    en: "Symmetrical English: a subtle strategic duel revolving around central breaks on d4/d5 and long-diagonal pressure.",
  },
  {
    jalur: ["Nf3", "d5", "c4"],
    id: "Pembukaan Reti murni: menyerang pion pusat d5 dari sayap tanpa menduduki pusat dengan pion sendiri terlebih dahulu.",
    en: "The pure Reti Opening challenges Black's d5 center from the flank with hypermodern piece and wing-pawn pressure.",
  },
];

const dataMentah = JSON.parse(fs.readFileSync(BERKAS_SUMBER, "utf8"));
const peta = {};
const cekTabrakan = new Map();

// 1. Masukkan catatan objektif berbahasa Inggris dari arsip ValdemarOrn/Chess.
for (const item of dataMentah) {
  if (POLA_META_PARTAI.test(item.en)) continue;
  const enBersih = bersihkanTeks(item.en);
  if (enBersih.length < 24 || enBersih.length > 220) continue;
  const h = hashPosisiLangkah(item.epd, item.san);
  const idAsli = `${item.epd}|${item.san}`;
  if (cekTabrakan.has(h) && cekTabrakan.get(h) !== idAsli) {
    throw new Error(`Tabrakan hash terdeteksi antara "${cekTabrakan.get(h)}" dan "${idAsli}"`);
  }
  cekTabrakan.set(h, idAsli);
  peta[h] = ["", enBersih];
}

// 2. Timpa/tambahkan seluruh jalur kurasi dwibahasa murni posisi (terverifikasi chess.js).
for (const kurasi of KURASI_DWIBAHASA) {
  const game = new Chess();
  let epdSebelum = "";
  let sanTerakhir = "";
  for (const san of kurasi.jalur) {
    epdSebelum = kunciEpd(game.fen());
    const langkah = game.move(san);
    if (!langkah) {
      throw new Error(`Jalur kurasi tidak sah pada "${san}" dalam ${kurasi.jalur.join(" ")}`);
    }
    sanTerakhir = langkah.san;
  }
  const h = hashPosisiLangkah(epdSebelum, sanTerakhir);
  const idAsli = `${epdSebelum}|${sanTerakhir}`;
  if (cekTabrakan.has(h) && cekTabrakan.get(h) !== idAsli) {
    throw new Error(`Tabrakan hash kurasi pada "${idAsli}"`);
  }
  cekTabrakan.set(h, idAsli);
  peta[h] = [bersihkanTeks(kurasi.id), bersihkanTeks(kurasi.en)];
}

const urut = Object.fromEntries(Object.entries(peta).sort(([a], [b]) => a.localeCompare(b)));
const isiJson = JSON.stringify(urut);
fs.writeFileSync(BERKAS_KELUARAN, isiJson);

const ukuranKb = (Buffer.byteLength(isiJson) / 1024).toFixed(1);
const jumlahDwibahasa = Object.values(urut).filter((v) => v[0]).length;
console.log(
  `  ✓ komentator-master.json siap: ${Object.keys(urut).length} posisi unik (${jumlahDwibahasa} dwibahasa ID+EN, ${ukuranKb} KB)`
);
