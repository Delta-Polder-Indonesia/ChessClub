#!/usr/bin/env node
/**
 * Generator korpus komentar master (`public/data/komentator-master.json`)
 * yang diadopsi dari arsip PGN beranotasi `ValdemarOrn/Chess`
 * (`Annotated Games/*.pgn` & `TestData/HumansVsComputers.pgn`).
 *
 * Sumber mentah yang sudah divalidasi `chess.js` disimpan di
 * `scripts/data-sumber/valdemar-komentar-mentah.json` (dikecualikan dari
 * unggahan Vercel lewat `.vercelignore`).
 *
 * Keluaran `public/data/komentator-master.json` memetakan hash kompak 16-heks
 * dari `${epdSebelum}|${san}` ke tupel:
 *   [partai, komentator, teksEn, teksId, hvcFlag]
 * sehingga pencarian dari `/papan-interaktif` maupun `/manusia-vs-mesin`
 * berjalan O(1) dan deterministik tanpa membebani bundel JS utama.
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

/**
 * Hash ganda 64-bit deterministik (dua FNV-1a 32-bit dengan garam berbeda) →
 * 16 karakter heksadesimal. Identik dengan fungsi di `src/lib/korpusKomentarMaster.js`.
 */
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

function bersihkanTeksMaster(teks) {
  let s = String(teks || "")
    .replace(/\[%[^\]]*\]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\bwww\.\S+/g, " ")
    .replace(/[:;]-?[)D(P]/g, " ")
    // Hapus ekor terjemahan Jerman yang terselip pada perle.pgn
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

/**
 * Kurasi dwibahasa (ID & EN) untuk jalur pembukaan dan tabiya klasik yang
 * paling sering dimainkan di `/papan-interaktif` dan `/manusia-vs-mesin`,
 * diadaptasi langsung dari ulasan komentator di `ValdemarOrn/Chess`.
 */
const KURASI_DWIBAHASA = [
  {
    jalur: ["e4"],
    partai: "Deep Blue vs Kasparov (1997)",
    komentator: "GM Gabriel Schwartzman",
    hvc: 1,
    id: "Langkah pembuka klasik yang langsung mengklaim petak d5 dan f5 sekaligus membuka diagonal menteri serta gajah f1.",
    en: "The classical king's pawn advance stakes an immediate claim to d5 and f5 while opening lines for the queen and bishop.",
  },
  {
    jalur: ["d4"],
    partai: "Rebel10 vs Anand (1998)",
    komentator: "Arsip Manusia vs Mesin",
    hvc: 1,
    id: "1.d4 membuka pertarungan strategis dengan pion pusat yang langsung terlindungi menteri — favorit pecatur posisional untuk meredam taktik prematur.",
    en: "1.d4 steers into strategic waters with a pre-defended central pawn, limiting early tactical tricks right from move one.",
  },
  {
    jalur: ["Nf3"],
    partai: "Kasparov vs Deep Blue (1997)",
    komentator: "GM Daniel King",
    hvc: 1,
    id: "Gaya fleksibel Kasparov saat menghadapi Deep Blue: mengaktifkan kuda ke f3 sambil menyembunyikan susunan pion pusat sampai lawan menunjukkan rencananya.",
    en: "Kasparov's flexible anti-computer choice against Deep Blue: developing to f3 while waiting to see Black's setup before committing central pawns.",
  },
  {
    jalur: ["c4"],
    partai: "Karpov vs Hartinov (1988)",
    komentator: "Arsip GM",
    hvc: 0,
    id: "Pembukaan Inggris: Putih menekan petak pusat d5 dari sayap tanpa buru-buru membuka lajur tengah, khas pertarungan manuver jangka panjang.",
    en: "The English Opening: White fights for the central d5 square from the flank, steering the game toward a rich positional struggle.",
  },
  {
    jalur: ["d3"],
    partai: "Kasparov vs Deep Blue (1997)",
    komentator: "GM Daniel King",
    hvc: 1,
    id: "Langkah amat tenang yang jarang dipakai di level puncak karena menyerahkan inisiatif pusat awal kepada Hitam — dipakai Kasparov semata demi mengeluarkan mesin dari buku pembukaan.",
    en: "Rarely seen at top level since it cedes early central space, though Kasparov famously used it to pull Deep Blue out of its opening book.",
  },
  {
    jalur: ["e4", "e5"],
    partai: "Deep Blue vs Kasparov (1997)",
    komentator: "GM Gabriel Schwartzman",
    hvc: 1,
    id: "Hitam menantang pusat secara simetris dan menghentikan laju d2-d4 gratis — gerbang menuju Partai Terbuka klasik.",
    en: "Black meets White head-on in the center, halting an unchallenged d4 advance and inviting classic Open Game play.",
  },
  {
    jalur: ["e4", "c5"],
    partai: "Kasparov vs Anand (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Pertahanan Sisilia: Hitam menolak simetri dan langsung bertarung memperebutkan petak d4 dengan struktur pion tak seimbang yang tajam.",
    en: "The Sicilian Defense breaks symmetry on move one, fighting for the d4 square and creating an unbalanced, fighting structure.",
  },
  {
    jalur: ["e4", "e6"],
    partai: "Ponomariov vs Ivanchuk (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Pertahanan Prancis: menyiapkan dobrakan 2...d5 untuk menantang e4, dengan konsekuensi gajah petak terang c8 sementara terkurung rantai pion.",
    en: "The French Defense prepares an immediate 2...d5 counterstrike in the center, accepting a temporarily hemmed-in c8 bishop.",
  },
  {
    jalur: ["e4", "c6"],
    partai: "Deep Blue vs Kasparov (1997)",
    komentator: "GM Daniel King",
    hvc: 1,
    id: "Pertahanan Caro-Kann: menopang dobrakan ...d5 dengan kokoh sambil membiarkan diagonal gajah c8 tetap terbuka.",
    en: "The Caro-Kann Defense supports a solid ...d5 central challenge while keeping the light-squared c8 bishop's diagonal open.",
  },
  {
    jalur: ["e4", "c6", "d4", "d5"],
    partai: "Deep Blue vs Kasparov (1997)",
    komentator: "GM Daniel King",
    hvc: 1,
    id: " Struktur inti Caro-Kann terbentuk: Hitam langsung menantang pion e4 dengan dukungan penuh pion c6.",
    en: "The main tabiya of the Caro-Kann Defense: Black challenges e4 immediately with solid support from c6.",
  },
  {
    jalur: ["e4", "c6", "d4", "d6"],
    partai: "Deep Blue vs Kasparov (1997)",
    komentator: "GM Daniel King",
    hvc: 1,
    id: "Manuver langka ala Kasparov kontra Deep Blue: membelokkan Caro-Kann ke skema tertutup demi memutus hafalan buku lawan.",
    en: "Kasparov's anti-computer sideline against Deep Blue, sidestepping standard Caro-Kann theory to force independent calculation.",
  },
  {
    jalur: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nd7"],
    partai: "Deep Blue vs Kasparov (1997)",
    komentator: "GM Daniel King",
    hvc: 1,
    id: "Variasi Karpov dalam Caro-Kann: 4...Nd7 menyiapkan ...Ngf6 tanpa merusak susunan pion bila kuda dipukul di f6.",
    en: "Anatoly Karpov's signature setup: 4...Nd7 prepares ...Ngf6 without allowing doubled pawns after Nxf6.",
  },
  {
    jalur: ["e4", "e5", "Nf3"],
    partai: "Kasparov vs Short (1993)",
    komentator: "Arsip Kejuaraan Dunia",
    hvc: 0,
    id: "Mengembangkan kuda sayap raja dengan tempo menyerang pion pusat e5 — langkah paling efisien yang sekaligus membuka jalan rokade.",
    en: "Developing the kingside knight with tempo against the e5 pawn while clearing the back rank for castling.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6"],
    partai: "Ivanchuk vs Adams (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Hitam melindungi pion e5 secara alami sambil mengawasi petak pusat d4.",
    en: "Black defends the e5 pawn naturally while bringing a knight into the fight for d4.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nf6"],
    partai: "Kasparov vs Adams (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Pertahanan Petroff (Rusia): alih-alih bertahan pasif, Hitam langsung membalas menyerang pion e4.",
    en: "Petroff's Defense: instead of passively defending e5, Black counterattacks White's e4 pawn at once.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    partai: "Deep Blue vs Kasparov (1997)",
    komentator: "GM Gabriel Schwartzman",
    hvc: 1,
    id: "Pembukaan Spanyol (Ruy Lopez): menekan kuda penjaga e5 dan memicu pertarungan posisional jangka panjang yang sarat manuver.",
    en: "The Ruy Lopez puts indirect pressure on e5 via the c6 knight, famous for its deep strategic complexity.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"],
    partai: "Kasparov vs Short (1993)",
    komentator: "Arsip Kejuaraan Dunia",
    hvc: 0,
    id: "Pertahanan Morphy: menanyakan niat gajah b5 sekarang juga. 4.Bxc6 dxc6 5.Nxe5 belum memenangkan pion karena ada 5...Qd4! yang menggarpu kuda dan e4.",
    en: "Morphy's Defense puts the question to the b5 bishop; 4.Bxc6 dxc6 5.Nxe5 fails to win a pawn because 5...Qd4 recovers it cleanly.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6"],
    partai: "Deep Fritz vs Kramnik (2002)",
    komentator: "Arsip Manusia vs Mesin",
    hvc: 1,
    id: "Pertahanan Berlin — 'Tembok Berlin' andalan Kramnik yang siap memasuki babak akhir solid meski tanpa rokade.",
    en: "The Berlin Defense — Kramnik's famous 'Berlin Wall', trading into a resilient structure that frustrates humans and engines alike.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O"],
    partai: "Kasparov vs Short (1993)",
    komentator: "Arsip Kejuaraan Dunia",
    hvc: 0,
    id: "Putih mengamankan raja dan membiarkan e4 tampak tak terjaga; bila 5...Nxe4, lajur e yang terbuka akan berbalik menekan raja Hitam via Re1 dan d4.",
    en: "White castles and leaves e4 indirectly poisoned: capturing on e4 opens the e-file against Black's uncastled king after d4 and Re1.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1"],
    partai: "Kasparov vs Short (1993)",
    komentator: "Arsip Kejuaraan Dunia",
    hvc: 0,
    id: "Setelah 5...Be7 menutup lajur e, ancaman ...Nxe4 menjadi nyata, sehingga 6.Re1 melindungi e4 sekaligus mengancam memenangkan pion lewat Bxc6 dan Nxe5.",
    en: "Once ...Be7 shields the e-file, ...Nxe4 becomes a real threat, so 6.Re1 guards e4 and renews the positional threat of Bxc6 and Nxe5.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Nxe4"],
    partai: "Olafsson vs Pyrich (1997)",
    komentator: "B. Milligan",
    hvc: 0,
    id: "Ruy Lopez Terbuka: Hitam berani menyambar pion e4 demi aktivitas perwira bebas meski harus menahan tekanan sementara di lajur pusat.",
    en: "The Open Variation of the Ruy Lopez: Black grabs e4 to secure active piece play rather than enduring a slow positional squeeze.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    partai: "Tartakower vs Euwe (1948)",
    komentator: "Arsip GM",
    hvc: 0,
    id: "Partai Italia: gajah ditempatkan agresif di c4 membidik langsung titik lemah f7 sejak dini.",
    en: "The Italian Game places the bishop aggressively on c4, eyeing the vulnerable f7 square right away.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4"],
    partai: "Marache vs Morphy (1857)",
    komentator: "Arsip Klasik",
    hvc: 0,
    id: "Gambit Evans favorit Morphy: mengorbankan pion sayap b4 demi membeli tempo c3 dan d4 untuk menguasai pusat sepenuhnya.",
    en: "The Evans Gambit sacrifices the b4 pawn to gain vital tempi with c3 and d4, building a sweeping pawn center.",
  },
  {
    jalur: ["e4", "e5", "Nf3", "Nc6", "d4"],
    partai: "Napoleon vs Bertrand (1820)",
    komentator: "Arsip Klasik",
    hvc: 0,
    id: "Partai Skotlandia: Putih langsung membongkar pusat pada langkah ketiga untuk membuka garis perwira tanpa menunggu manuver lambat.",
    en: "The Scotch Game: White blasts open the center immediately on move three to seize open lines and piece activity.",
  },
  {
    jalur: ["e4", "e5", "f4"],
    partai: "Anderssen vs Kieseritzky (1851)",
    komentator: "Arsip Immortal Game",
    hvc: 0,
    id: "Gambit Raja: menawarkan pion f4 untuk mengalihkan pion e5 dari pusat sekaligus membuka lajur f bagi benteng setelah rokade.",
    en: "The romantic King's Gambit offers a pawn to deflect e5 from the center and pry open the f-file for rapid attack.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    partai: "Ponomariov vs Karjakin (2002)",
    komentator: "Arsip Bali 2002",
    hvc: 0,
    id: "Sisilia Najdorf: 5...a6 menjaga petak b5 dari serbuan perwira Putih dan menyiapkan ekspansi ...b5 sembari menunda komitmen pion e7.",
    en: "The Najdorf Variation controls b5, prepares queenside expansion with ...b5, and keeps Black's central pawn structure flexible.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3"],
    partai: "Polgar vs Kasparov (2001)",
    komentator: "John Henderson",
    hvc: 0,
    id: "Serangan Inggris (English Attack) terhadap Najdorf: Putih menyiapkan f3, Qd2, O-O-O, dan badai pion g4-h4 di sayap raja.",
    en: "The sharp English Attack against the Najdorf: White gears up for f3, Qd2, long castling, and a direct kingside pawn storm.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "e5"],
    partai: "Karjakin vs Shirov (2002)",
    komentator: "Arsip Bali 2002",
    hvc: 0,
    id: "Jalur Kalashnikov/Lowenthal: Hitam langsung mengusir kuda d4 dengan konsekuensi meninggalkan lubang posisional di d5.",
    en: "The Kalashnikov/Lowenthal thrust kicks the d4 knight immediately, trading a hole on d5 for rapid piece activity.",
  },
  {
    jalur: ["e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5", "Ndb5", "d6"],
    partai: "Polgar vs Kasparov (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Sisilia Sveshnikov: Hitam rela menanggung pion d6 terbelakang dan lubang d5 demi pasangan perwira yang sangat dinamis.",
    en: "The Sveshnikov tabiya: Black accepts a backward d6 pawn and the d5 hole in exchange for fierce dynamic counterplay.",
  },
  {
    jalur: ["e4", "c5", "Nc3"],
    partai: "Plaskett vs Shipov (1999)",
    komentator: "Thomas Hartwig",
    hvc: 0,
    id: "Sisilia Tertutup: Putih menahan laju d2-d4 untuk membangun serangan sayap raja secara bertahap lewat g3, Bg2, dan f4.",
    en: "The Closed Sicilian: White holds back d4 in favor of a controlled buildup with g3, Bg2, and an eventual f4 advance.",
  },
  {
    jalur: ["e4", "e6", "d4", "d5", "Nc3", "Bb4"],
    partai: "Ponomariov vs Ivanchuk (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Prancis Winawer: memaku kuda c3 untuk merusak kontrol Putih atas e4, meski memberi Putih ruang dengan 4.e5 dan peluang merusak sayap raja Hitam.",
    en: "The Winawer Variation pins the c3 knight to undermine e4, inviting a sharp strategic clash after 4.e5.",
  },
  {
    jalur: ["e4", "e6", "d4", "d5", "Nc3", "Nf6"],
    partai: "Topalov vs Bareev (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Prancis Klasik: menambah tekanan ke e4 untuk memancing e4-e5, lalu membongkar rantai pion Putih lewat ...c5.",
    en: "Classical French: Black pressures e4 to provoke e5, aiming to chip away at White's pawn chain with ...c5.",
  },
  {
    jalur: ["e4", "e6", "d4", "d5", "Nd2"],
    partai: "Bell vs Watson",
    komentator: "Arsip GM",
    hvc: 0,
    id: "Prancis Tarrasch favorit Anatoly Karpov: melindungi e4 tanpa menghalangi pion c2 sehingga Putih siap menopang pusat dengan c3.",
    en: "The French Tarrasch — Anatoly Karpov's favorite — defends e4 while keeping the c-pawn free to bolster d4 with c3.",
  },
  {
    jalur: ["d4", "Nf6"],
    partai: "Botvinnik vs Capablanca (1938)",
    komentator: "Arsip AVRO 1938",
    hvc: 0,
    id: "Pertahanan Hindia yang luwes: langsung menghentikan 2.e4 tanpa mengunci struktur pion pusat Hitam terlalu dini.",
    en: "A flexible Indian reply: 1...Nf6 prevents an immediate 2.e4 while keeping Black's central pawn setup wide open.",
  },
  {
    jalur: ["d4", "Nf6", "c4"],
    partai: "Botvinnik vs Capablanca (1938)",
    komentator: "Arsip AVRO 1938",
    hvc: 0,
    id: "Lanjutan baku setelah 1.d4: memperluas ruang di sayap menteri sekaligus menyiapkan Nc3 untuk menguasai e4 dan d5.",
    en: "The standard follow-up to 1.d4, expanding on the queenside and preparing Nc3 to fight for e4 and d5.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
    partai: "Botvinnik vs Capablanca (1938)",
    komentator: "Arsip AVRO 1938",
    hvc: 0,
    id: "Pertahanan Nimzo-Hindia: menghentikan ancaman 4.e4 dengan memaku kuda c3 dan siap menukar gajah demi merusak struktur pion Putih.",
    en: "The Nimzo-Indian Defense halts 4.e4 by pinning the c3 knight, fighting for light-square control without committing central pawns.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "e6", "Nf3", "b6"],
    partai: "Kramnik vs Deep Fritz (2002)",
    komentator: "Arsip Manusia vs Mesin",
    hvc: 1,
    id: "Pertahanan Hindia Menteri: karena Putih menghindari paku Nimzo lewat 3.Nf3, Hitam menyiapkan fianchetto gajah ke b7 untuk mengawasi petak e4.",
    en: "The Queen's Indian Defense: with Nc3 avoided, Black prepares ...Bb7 to contest the crucial central light squares.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "e6", "Nf3", "b6", "g3"],
    partai: "Kramnik vs Ivanchuk (2001)",
    komentator: "GM Vladimir Barsky",
    hvc: 0,
    id: "Sistem fianchetto favorit para juara dunia melawan Hindia Menteri: gajah g2 akan beradu langsung di diagonal panjang dengan gajah b7.",
    en: "A World Championship mainstay against the Queen's Indian, opposing Black's b7 bishop directly along the long diagonal.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"],
    partai: "San Segundo vs Polgar (2002)",
    komentator: "Arsip GM",
    hvc: 0,
    id: "Pertahanan Hindia Raja senjata khas Kasparov dan Judit Polgar: membiarkan Putih menguasai pusat dulu untuk digempur balik lewat ...e5 atau ...c5.",
    en: "The King's Indian Defense — favored by Kasparov and Judit Polgar — invites White's big center in order to strike it down later.",
  },
  {
    jalur: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
    partai: "Karpov vs Kasparov (1990)",
    komentator: "Arsip Kejuaraan Dunia",
    hvc: 0,
    id: "Pertahanan Grunfeld: langsung menghantam pusat Putih dengan ...d5 agar pusat pion yang lebar menjadi sasaran tembak gajah g7.",
    en: "The Grunfeld Defense challenges the center immediately with ...d5, turning White's broad pawn center into a target for the g7 bishop.",
  },
  {
    jalur: ["d4", "d5"],
    partai: "Ivanchuk vs Shirov (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Jawab klasik 1...d5 menancapkan pijakan kokoh di pusat dan mencegah Putih menguasai e4 tanpa perlawanan.",
    en: "Classical 1...d5 plants a firm stake in the center and prevents White from seizing both central files uncontested.",
  },
  {
    jalur: ["d4", "d5", "c4"],
    partai: "X3D Fritz vs Kasparov (2003)",
    komentator: "Mig Greengard",
    hvc: 1,
    id: "Gambit Menteri: menawarkan pion sayap c4 sementara demi menggoyahkan pion pusat Hitam di d5.",
    en: "The Queen's Gambit offers a wing pawn to deflect Black's central d5 post — a cornerstone of classical chess at every level.",
  },
  {
    jalur: ["d4", "d5", "c4", "dxc4"],
    partai: "Kramnik vs Deep Fritz (2002)",
    komentator: "Arsip Manusia vs Mesin",
    hvc: 1,
    id: "Gambit Menteri Diterima: Hitam menyerahkan pusat sesaat untuk membuka lajur dan mengincar pukulan balik cepat lewat ...c5.",
    en: "The Queen's Gambit Accepted: Black cedes the center temporarily to open files and strike back quickly with ...c5.",
  },
  {
    jalur: ["d4", "d5", "c4", "e6"],
    partai: "Pillsbury vs Marco (1900)",
    komentator: "Arsip Klasik",
    hvc: 0,
    id: "Gambit Menteri Ditolak: mempertahankan titik kuat d5 dengan kokoh sembari membuka jalur gajah petak gelap.",
    en: "The Queen's Gambit Declined maintains a rock-solid pawn foothold on d5 while freeing the dark-squared bishop.",
  },
  {
    jalur: ["d4", "d5", "c4", "c6"],
    partai: "Kramnik vs Topalov (2006)",
    komentator: "Arsip GM",
    hvc: 0,
    id: "Pertahanan Slav: menopang d5 dengan pion c6 tanpa mengurung gajah petak terang c8.",
    en: "The Slav Defense bolsters the d5 pawn with c6 while keeping the light-squared c8 bishop free to develop outside the chain.",
  },
  {
    jalur: ["d4", "d5", "c4", "e6", "Nc3", "c5"],
    partai: "Kramnik vs Deep Fritz (2002)",
    komentator: "Arsip Manusia vs Mesin",
    hvc: 1,
    id: "Pertahanan Tarrasch: memilih aktivitas perwira bebas lewat ...c5 meski berisiko menyisakan pion pusat terisolasi (IQP) di d5.",
    en: "Dr. Tarrasch's energetic counter in the center: trading potential isolated-queen's-pawn risk for free, active piece play.",
  },
  {
    jalur: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5"],
    partai: "Pillsbury vs Tarrasch (1895)",
    komentator: "Arsip Hastings 1895",
    hvc: 0,
    id: "Paku klasik yang dipopulerkan Pillsbury di Hastings 1895: meningkatkan tekanan terhadap d5 dengan mengikat kuda penjaga di f6.",
    en: "Pillsbury's classic pin from Hastings 1895, heightening pressure on d5 by tying down its key defender on f6.",
  },
  {
    jalur: ["d4", "d5", "Nf3"],
    partai: "Ivanchuk vs Anand (2002)",
    komentator: "Mark Hathaway",
    hvc: 0,
    id: "Urutan luwes yang menjaga semua pintu tetap terbuka: Putih bisa beralih ke Gambit Menteri lewat c4 maupun Sistem London/Colle.",
    en: "A flexible developing move that can transpose into the Queen's Gambit with c4 or steer toward a London or Colle setup.",
  },
  {
    jalur: ["Nf3", "d5", "g3", "Bg4"],
    partai: "Kasparov vs Deep Blue (1997)",
    komentator: "GM Gabriel Schwartzman",
    hvc: 1,
    id: "Rencana Deep Blue melawan Reti Kasparov: mengeluarkan gajah ke g4 lebih dulu sebelum membangun benteng pion kokoh di c6-d5-e6.",
    en: "Deep Blue's plan against Kasparov's Reti: deploying the bishop outside to g4 before erecting a solid c6-d5-e6 pawn triangle.",
  },
  {
    jalur: ["c4", "c5", "Nf3", "Nf6", "g3", "b6", "Bg2", "Bb7"],
    partai: "Andersson vs Robatsch (1979)",
    komentator: "GM Irina Krush",
    hvc: 0,
    id: "Fianchetto ganda simetris dalam Pembukaan Inggris: tampak tenang di permukaan, tetapi menuntut akurasi tinggi dalam pertarungan diagonal panjang.",
    en: "Symmetrical Double Fianchetto in the English: deceptively quiet on the surface, yet full of subtle venom along both long diagonals.",
  },
];

const dataMentah = JSON.parse(fs.readFileSync(BERKAS_SUMBER, "utf8"));
const peta = {};
const cekTabrakan = new Map();

// 1. Masukkan seluruh entri arsip ValdemarOrn/Chess terlebih dahulu.
for (const item of dataMentah) {
  const enBersih = bersihkanTeksMaster(item.en);
  if (enBersih.length < 24 || enBersih.length > 240) continue;
  const h = hashPosisiLangkah(item.epd, item.san);
  const idAsli = `${item.epd}|${item.san}`;
  if (cekTabrakan.has(h) && cekTabrakan.get(h) !== idAsli) {
    throw new Error(`Tabrakan hash terdeteksi antara "${cekTabrakan.get(h)}" dan "${idAsli}"`);
  }
  cekTabrakan.set(h, idAsli);
  peta[h] = [
    item.partai || "",
    item.komentator || "",
    enBersih,
    "",
    item.hvc ? 1 : 0,
  ];
}

// 2. Timpa/tambahkan jalur kurasi dwibahasa (terverifikasi lewat chess.js).
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
  peta[h] = [
    kurasi.partai,
    kurasi.komentator,
    bersihkanTeksMaster(kurasi.en),
    bersihkanTeksMaster(kurasi.id),
    kurasi.hvc ? 1 : 0,
  ];
}

const urut = Object.fromEntries(Object.entries(peta).sort(([a], [b]) => a.localeCompare(b)));
const isiJson = JSON.stringify(urut);
fs.writeFileSync(BERKAS_KELUARAN, isiJson);

const ukuranKb = (Buffer.byteLength(isiJson) / 1024).toFixed(1);
const jumlahDwibahasa = Object.values(urut).filter((v) => v[3]).length;
const jumlahHvc = Object.values(urut).filter((v) => v[4] === 1).length;
console.log(
  `  ✓ komentator-master.json siap: ${Object.keys(urut).length} posisi unik (${jumlahDwibahasa} dwibahasa penuh, ${jumlahHvc} duel Manusia vs Mesin, ${ukuranKb} KB)`
);
