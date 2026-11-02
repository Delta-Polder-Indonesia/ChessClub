/**
 * Kamus Inggris (EN) · teks komentator — dipakai lewat kunci papan.komentator.* dan
 * tekaTeki.komentator.* (lihat komentator.js di berkas papan/tekaTeki).
 * Blok ini diimpor oleh papan.js dan tekaTeki.js.
 *
 * Setiap kategori WAJIB punya jumlah varian yang sama persis dengan kamus ID
 * (scripts/uji-i18n.mjs dan scripts/uji-komentator.mjs menolak bila berbeda),
 * dan minimal sejumlah varian yang diminta mesin (lihat tambah()/tambahSoal()/
 * peristiwaUtama()/motifPosisional() di src/lib/komentator.js). Placeholder
 * memakai nama kunci kamus ({pihak}, {san}, {lawan}, {petak}, {bidak},
 * {korban}, {pembukaan}, {unggul}, {nilai}, {mat}, {saran}, {awan}) — mesin
 * komentator yang mengisi, bukan bahasa teksnya.
 */

/** komentator untuk Papan Interaktif — kunci aslinya papan.komentator.* */
export const komentatorPapan = {
  judul: "Board Commentator",
  keterangan: "Live commentary driven by board structure, grandmaster game archives, and engine evaluation.",
  nyalakan: "Turn commentator on",
  matikan: "Turn commentator off",
  gayaLabel: "Narration Style",
  gayaSantai: "Club Coach",
  gayaFormal: "Classical Grandmaster",
  gayaGenZ: "Rapid Broadcast",
  menunggu: "Waiting for the opening move...",
  posisiAwal: "Board ready. White has the first move.",
  menilai: "Checking key continuations...",
  labelArsipMaster: "Master Note",
  labelDuelMesin: "Human vs Computer Archive",
  jejakPartaiMaster: "Master game precedent: {partai}",
  olehKomentator: "Notes by {komentator}",
  pihak: { putih: "White", hitam: "Black" },
  bidak: { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" },

  santai: {
    biasa: [
      "{pihak} improves piece coordination with {san}, waiting for a target in {lawan}'s camp.",
      "{san} — a patient manoeuvre by {pihak} to improve the {bidak} on {petak}.",
      "{pihak} chooses {san}, keeping the structure compact before opening up the fight.",
      "With {san}, {pihak} tightens control around {petak} without overextending.",
    ],
    buku: [
      "{san} follows a well-tested tournament line of the {pembukaan}.",
      "Still inside {pembukaan} theory — {san} keeps development harmonious for both sides.",
      "A standard book continuation in the {pembukaan} with {san}; the real middlegame test lies just ahead.",
    ],
    tangkap: [
      "{pihak} captures the {korban} on {petak} with {san}, resolving the tension on that square.",
      "An exchange on {petak}: {pihak} removes the {korban} and asks {lawan} how to recapture.",
      "{san} — the {korban} comes off {petak}, opening fresh lines for the remaining pieces.",
    ],
    tangkapUntung: [
      "Clean material gain! {pihak} wins the {korban} on {petak} on very favourable terms.",
      "{san}! {pihak} comes out ahead in the exchange on {petak}, leaving {lawan} with a tough defence.",
    ],
    tangkapMenteri: [
      "{lawan}'s queen falls on {petak}! With {san}, {pihak} claims a decisive material advantage.",
      "{san}! The enemy queen goes down on {petak} — the whole complexion of the game changes.",
    ],
    tukarMenteri: [
      "Queens come off on {petak}! With {san}, {pihak} steers play into an endgame where technique counts.",
      "{san} trades queens on {petak}; immediate mating threats fade and pawn structure takes centre stage.",
    ],
    tukarGajahKuda: [
      "{pihak} parts with the bishop for the knight on {petak} via {san}, eyeing structural concessions from {lawan}.",
      "{san} — bishop takes knight on {petak} to fight for tempo or inflict doubled pawns.",
    ],
    fianchetto: [
      "{pihak} fianchettoes the bishop on {petak}, eyeing the long diagonal from afar.",
      "{san} — the bishop settles on {petak} to exert long-range pressure on the centre.",
    ],
    dobrakPusat: [
      "Central pawn break {san}! {pihak} immediately challenges {lawan}'s pawn chain to open lines.",
      "{pihak} strikes with {san}, undermining {lawan}'s central foothold and fighting for the initiative.",
    ],
    kudaPosTerdepan: [
      "{pihak}'s knight lands on a superb outpost at {petak} — anchored by a pawn and immune to enemy pawn pokes.",
      "{san} plants a knight deep on {petak}, cramping the heart of {lawan}'s position.",
    ],
    bentengLajurTerbuka: [
      "{pihak} swings the rook to {petak} with {san}, seizing control of the open file.",
      "{san} — {pihak}'s rook claims the file from {petak}, preparing to penetrate into enemy territory.",
    ],
    bentengBarisTujuh: [
      "{pihak}'s rook invades {petak}! Reaching the seventh rank ties down {lawan}'s king and targets base pawns.",
      "{san} plants a rook deep in {lawan}'s back ranks — a classic endgame and middlegame trump.",
    ],
    pionBebas: [
      "{pihak}'s passed pawn marches to {petak}! Every step forward ties down more of {lawan}'s pieces.",
      "{san} — the passed pawn on {petak} becomes a serious long-term asset.",
    ],
    profilaksisSayap: [
      "{san} — neat prophylaxis from {pihak}, taking away a wing square from {lawan}'s pieces while creating luft.",
      "A useful preventive touch with {san}: securing the flank before {pihak} resumes the main plan.",
    ],
    menteriDini: [
      "{pihak} brings the queen out early to {petak} with {san} — ambitious, though minor pieces may chase it with tempo.",
      "{san} activates the queen early; {pihak} must be careful not to fall behind in development.",
    ],
    kembangPerwira: [
      "{pihak} brings the {bidak} out to {petak} with {san}, contesting key central squares.",
      "{san} develops {pihak}'s {bidak} smoothly and clears the back rank toward castling.",
      "Natural development with {san}: {pihak}'s {bidak} joins the fight for the centre.",
    ],
    rajaAktifAkhir: [
      "With queens off the board, {pihak}'s king steps up to {petak} via {san} to join the endgame battle.",
      "{san} — textbook endgame play as {pihak} centralises the king toward the action.",
    ],
    skak: [
      "Check with {san}! {lawan}'s king has to deal with the threat right away.",
      "{pihak} throws in {san} with check, seizing the tempo from {lawan}.",
      "{san} delivers direct check — testing {lawan}'s defensive coordination immediately.",
    ],
    skakTambahan: [
      "And it comes with check! {lawan} has no time for counterplay elsewhere.",
      "Delivered with tempo on the king, forcing {lawan} to respond on the spot.",
    ],
    skakSatuJalan: [
      "{lawan}'s king has only one legal reply.",
    ],
    rokadePendek: [
      "{pihak} castles kingside — tucking the king away safely and bringing the rook toward the centre.",
      "Kingside castling from {pihak}; the king is sheltered and the rooks are ready to connect.",
    ],
    rokadePanjang: [
      "{pihak} castles queenside! The rook lands straight on a central file and sharp play beckons.",
      "Queenside castling by {pihak} — often the prelude to a fierce opposite-side wing race.",
    ],
    enPassant: [
      "En passant capture {san}! {pihak} refuses to let the enemy pawn slip past unchallenged.",
      "{pihak} captures en passant on {petak}, keeping the files open.",
    ],
    promosi: [
      "{pihak}'s pawn reaches the back rank and promotes to a {bidak} on {petak}!",
      "The long march pays off: {pihak} crowns a new {bidak} on {petak}!",
    ],
    lawanMenggantung: [
      "Keep an eye on {petak} — {lawan} has left a piece standing loose there.",
      "Tactical alert on {petak}: one of {lawan}'s pieces is undefended.",
    ],
    sendiriMenggantung: [
      "Careful — {pihak}'s {bidak} on {petak} has been left without adequate protection.",
      "A loose thread appears on {petak}: {pihak}'s {bidak} could become an immediate target for {lawan}.",
    ],
    paksa: [
      "Strictly forced — {pihak} had only one legal move on the board.",
      "A forced reply; every other option was ruled out.",
    ],
    nilaiBrilian: [
      "Brilliant move! {san} sacrifices material to rip open {lawan}'s defences!",
      "Superb tactical vision — {pihak} uncovers a deeply calculated sacrifice with {san}!",
      "Grandmaster-class inspiration with {san}! Material goes into the fire for an unstoppable initiative.",
    ],
    nilaiHebat: [
      "Key move found! {san} keeps maximum pressure on the critical point.",
      "Clinical accuracy from {pihak} — {san} was the only way to keep the initiative alive.",
      "Incisive choice! {pihak} reads the concrete demands of the position clearly with {san}.",
    ],
    nilaiTerbaik: [
      "{san} matches the engine's top choice in this position.",
      "Clean execution — {pihak} finds the most accurate continuation with {san}.",
      "Spot on. {san} gets the very most out of {pihak}'s pieces.",
    ],
    nilaiUnggul: [
      "Strong, controlled chess; {san} preserves {pihak}'s healthy position.",
      "Solid play from {pihak}. {san} keeps the rhythm without granting counterplay.",
      "A sound practical decision by {pihak} with {san}.",
    ],
    nilaiLayak: [
      "{san} is perfectly playable, even if a slightly more testing try existed.",
      "A safe continuation from {pihak}; the position holds together well.",
      "Sensible enough — {san} keeps {pihak}'s structure under control.",
    ],
    nilaiKeliru: [
      "A slight inaccuracy. {san} eases the pressure and gives {lawan} a breather.",
      "Minor slip with {san}; {lawan} gets welcome time to untangle.",
      "{san} is a touch passive here, letting some of the initiative slip.",
    ],
    nilaiKesalahan: [
      "A serious mistake! {san} gives {lawan} a clear chance to take over.",
      "{san} leaves a structural or tactical hole that {lawan} can punish right away.",
      "Loose play — after {san}, the momentum swings toward {lawan}.",
    ],
    nilaiKelewat: [
      "Missed opportunity! There was a far more decisive punch available than {san}.",
      "A golden tactical shot goes begging, letting {lawan} off the hook.",
      "{pihak} overlooks a winning continuation that was right there on the board.",
    ],
    nilaiBlunder: [
      "Heavy blunder! {san} blows a hole straight through {pihak}'s position.",
      "Disaster strikes with {san} — the evaluation swings sharply in {lawan}'s favour!",
      "A costly slip at a critical moment! {san} hands a major advantage to {lawan}.",
    ],
    lebihKuat: [
      "Much more incisive here was {saran}.",
      "By comparison, {saran} posed far tougher problems.",
    ],
    seimbang: [
      "The game remains level — both sides have plenty to play with.",
      "Chances are balanced; neither player has seized control yet.",
      "An even struggle so far, coming down to whose middlegame plan proves sharper.",
    ],
    unggulTipis: [
      "{unggul} holds a slight pull (+{nilai}) and starts asking the questions.",
      "A nagging edge for {unggul} (+{nilai}), though {lawan} remains well within reach.",
    ],
    unggulJelas: [
      "{unggul} enjoys a clear advantage (+{nilai}) with noticeably more active pieces.",
      "Firm control for {unggul} (+{nilai}) as the opponent's counterplay dries up.",
    ],
    unggulMenang: [
      "{unggul} has a winning position (+{nilai}) — now it is all about clean technique.",
      "A commanding lead for {unggul} (+{nilai}); the defence is on the verge of collapse.",
    ],
    unggulMat: [
      "Forced mate is on the board: {unggul} finishes the game in {mat}!",
      "No escape left — {unggul} has a forced checkmate in {mat} moves.",
    ],
    skakmat: [
      "Checkmate! With {san}, {pihak} brings down the curtain decisively.",
      "Game over — {san} traps {lawan}'s king with nowhere left to run. Victory to {pihak}!",
      "Clean checkmate! {pihak}'s attack reaches its target with {san}.",
    ],
    pat: [
      "Stalemate! Not in check, yet without a single legal move — the game is drawn.",
      "Caught in a stalemate net! With no legal move available, the point is shared.",
    ],
    remis: [
      "The game ends in a draw after a hard-fought battle.",
      "Honours even — neither side could break the deadlock.",
    ],
    remisUlang: [
      "The exact same position has appeared three times — drawn by repetition.",
      "Threefold repetition seals the draw, with neither player willing to deviate.",
    ],
    remisMaterial: [
      "There is no longer enough material on the board to force checkmate — draw.",
      "Drawn by insufficient mating material.",
    ],
    ajakEngine: [
      "Curious about the deepest tactical lines here? Switch on the analysis engine in this panel.",
      "Enable the engine if you want an objective evaluation alongside the commentary.",
    ],
    awan: [
      "Cloud theory favours {awan} from the previous position (eval {nilai}).",
      "According to the cloud book, {awan} was the main try ({nilai}).",
    ],
    fork: [
      "Sharp fork! {pihak}'s {bidak} on {petak} hits two targets at once!",
      "Double attack from {petak} — {lawan} will have to part with material.",
      "{san} lands a fork on {petak}! {lawan}'s defence is stretched in two directions.",
    ],
    skakBayangan: [
      "Discovered check! Moving {pihak}'s {bidak} to {petak} unleashes a hidden line against {lawan}'s king!",
      "Deadly discovered check via {san} — uncovering a direct shot at {lawan}'s monarch!",
    ],
    terpaku: [
      "{lawan}'s piece on {petak} is pinned and cannot budge without exposing the king.",
      "An awkward pin on {petak} freezes {lawan}'s defender in its tracks.",
    ],
    seimbangDinamis: [
      "A lively dynamic balance — both players hold active trumps of their own.",
      "Objectively level, yet rich with plans for both {pihak} and {lawan}.",
      "Piece activity and structure offset each other; middlegame accuracy will tell.",
      "Both camps stand healthy in dynamic equilibrium with everything to play for.",
    ],
    unggulStruktur: [
      "{pihak} enjoys the healthier pawn structure while {lawan} is saddled with long-term weaknesses.",
      "Material is level, but space and pawn cohesion clearly favour {pihak}.",
    ],
    posisiTajam: [
      "The board catches fire! Concrete calculation is paramount now — one slip could decide the game.",
      "Sharp tactical waters ahead, where every single tempo counts.",
    ],
  },

  formal: {
    biasa: [
      "{pihak} plays {san}, regrouping harmoniously while keeping the pawn structure intact.",
      "With {san}, {pihak} consolidates quietly and reinforces key squares.",
      "{pihak} places the {bidak} on {petak}, improving piece coordination ahead of active operations.",
      "{san} is played with prophylactic restraint, maintaining the strategic balance.",
    ],
    buku: [
      "{san} is a standard theoretical continuation in the {pembukaan}, well established in master praxis.",
      "Remaining on the main highway of the {pembukaan}, {pihak} maintains opening discipline with {san}.",
      "Within the {pembukaan}, {san} follows well-trodden grandmaster precedent.",
    ],
    tangkap: [
      "Exchange on {petak}: {pihak} removes the {korban} and clarifies the central tension.",
      "With {san}, {pihak} captures the {korban} on {petak}, altering the piece configuration.",
      "{pihak} executes the capture of the {korban} on {petak}, demanding a concrete recapture from {lawan}.",
    ],
    tangkapUntung: [
      "{pihak} achieves a clean material gain by winning the {korban} on {petak}.",
      "{san} nets the {korban} on {petak} with insufficient compensation for {lawan}.",
    ],
    tangkapMenteri: [
      "A decisive turning point: {lawan}'s queen falls on {petak}, leaving {pihak} with a winning material edge.",
      "With {san}, {lawan}'s queen is eliminated on {petak}, creating an overwhelming imbalance.",
    ],
    tukarMenteri: [
      "The exchange of queens on {petak} via {san} steers the struggle into a technical endgame.",
      "{pihak} trades queens on {petak}; pawn structure and king activity now assume primary importance.",
    ],
    tukarGajahKuda: [
      "{pihak} cedes the bishop for the knight on {petak}, playing for structural damage or colour-complex control.",
      "By playing {san}, {pihak} parts with the bishop pair to disrupt {lawan}'s coordination around {petak}.",
    ],
    fianchetto: [
      "{pihak} fianchettoes the bishop to {petak}, contesting the long diagonal.",
      "{san} posts the bishop on the flank to exert indirect pressure against the centre.",
    ],
    dobrakPusat: [
      "A thematic central break with {san}: {pihak} challenges {lawan}'s pawn chain to open files.",
      "With {san}, {pihak} contests central space directly and fights for the middlegame initiative.",
    ],
    kudaPosTerdepan: [
      "{pihak}'s knight establishes an ideal outpost on {petak}, supported by a pawn and safe from enemy pawns.",
      "Posting the knight on {petak} via {san} secures a lasting strategic foothold for {pihak}.",
    ],
    bentengLajurTerbuka: [
      "{pihak} brings the rook to {petak}, contesting a file clear of friendly pawns.",
      "With {san}, {pihak}'s rook seizes vertical control from {petak} in preparation for seventh-rank entry.",
    ],
    bentengBarisTujuh: [
      "Classical invasion with {san}: {pihak}'s rook penetrates to {petak} deep inside enemy territory.",
      "The rook on {petak} ties down {lawan}'s king while targeting the base of the pawn chain.",
    ],
    pionBebas: [
      "Advancing the passed pawn to {petak} via {san} creates an enduring promotion threat against {lawan}.",
      "{pihak}'s passed pawn on {petak} grows in strategic weight with every exchange.",
    ],
    profilaksisSayap: [
      "{san} serves a prophylactic purpose, restricting enemy piece jumps along the flank.",
      "A preventive pawn touch with {san}, controlling a wing square while providing useful luft.",
    ],
    menteriDini: [
      "Early queen activation to {petak} via {san} risks offering {lawan}'s minor pieces convenient tempo targets.",
      "{san} commits the queen early in the opening; precise handling of tempo will be required.",
    ],
    kembangPerwira: [
      "{pihak} develops the {bidak} to {petak}, accelerating piece mobilisation in the opening.",
      "Sound classical development with {san}: {pihak}'s {bidak} joins the struggle for the centre.",
      "{san} continues {pihak}'s harmonious build-up along classical lines.",
    ],
    rajaAktifAkhir: [
      "In queenless endgame fashion, {pihak} activates the king toward {petak} to support the pawns.",
      "King centralisation via {san} adheres strictly to fundamental endgame principles.",
    ],
    skak: [
      "Check via {san}; {pihak} compels {lawan} to attend immediately to king safety.",
      "{pihak} delivers check, narrowing {lawan}'s legal options on this turn.",
      "Direct check with {san} gains an important tempo for {pihak}.",
    ],
    skakTambahan: [
      "The manoeuvre arrives with check, obliging {lawan} to safeguard the king first.",
      "Beyond its primary point, the move simultaneously delivers check.",
    ],
    skakSatuJalan: [
      "{lawan} has only a single legal reply to meet the check.",
    ],
    rokadePendek: [
      "{pihak} castles kingside, safeguarding the king and bringing the rook toward central files.",
      "Short castling by {pihak} completes king safety and prepares rook coordination.",
    ],
    rokadePanjang: [
      "{pihak} castles queenside, placing the rook immediately on a central file.",
      "Long castling by {pihak} signals sharp strategic intentions, often with opposite-wing attacks.",
    ],
    enPassant: [
      "{pihak} captures en passant on {petak}, preventing {lawan} from keeping files closed.",
      "The en passant privilege is exercised accurately by {pihak} with {san}.",
    ],
    promosi: [
      "{pihak}'s pawn completes its advance on {petak}, promoting to a {bidak}.",
      "Promotion on {petak}: {pihak} introduces a new {bidak}, transforming the material balance.",
    ],
    lawanMenggantung: [
      "Tactical note: {lawan}'s piece on {petak} stands without adequate protection.",
      "A loose piece appears on {petak}, where {lawan} lacks sufficient defence.",
    ],
    sendiriMenggantung: [
      "Caution is warranted: {pihak}'s {bidak} on {petak} has been left unguarded.",
      "The placement of {pihak}'s {bidak} on {petak} leaves a tactical target for {lawan}.",
    ],
    paksa: [
      "The sole legal continuation in the position; {pihak} has no alternative.",
      "Strictly forced — all other tries are ruled out by the demands of the board.",
    ],
    nilaiBrilian: [
      "A brilliant stroke! {san} uncovers a deep, analytically sound sacrifice.",
      "First-rate tactical artistry with {san}, investing material for a decisive attack.",
      "A remarkable conception from {pihak}: {san} shatters the opponent's defensive coordination by force.",
    ],
    nilaiHebat: [
      "A powerful decision at a critical juncture; {san} maintains maximum pressure.",
      "{pihak} finds the most demanding continuation on the board with {san}.",
      "High precision from {pihak} — {san} meets the concrete requirements of the position.",
    ],
    nilaiTerbaik: [
      "{san} is the analysis engine's principal recommendation here.",
      "Optimal play; {pihak} selects the most accurate continuation in {san}.",
      "An exact move that preserves every asset of {pihak}'s position.",
    ],
    nilaiUnggul: [
      "A strong continuation that nurses {pihak}'s advantage without concession.",
      "{san} maintains firm positional control.",
      "Sound, disciplined play by {pihak} to keep the initiative in hand.",
    ],
    nilaiLayak: [
      "A playable alternative that preserves the balance, albeit not the most testing try.",
      "{san} meets the essential needs of the position without creating weaknesses.",
      "A sensible practical choice, though a slightly more incisive line was available.",
    ],
    nilaiKeliru: [
      "A minor inaccuracy with {san}, allowing part of {pihak}'s initiative to dissipate.",
      "A slight imprecision from the optimal path that grants {lawan} time to consolidate.",
      "{san} exerts insufficient pressure, easing {lawan}'s defensive task.",
    ],
    nilaiKesalahan: [
      "A notable mistake with {san}; the evaluation tilts in {lawan}'s favour.",
      "{san} compromises {pihak}'s structure and invites immediate counterplay.",
      "An instructive error at an important moment, handing the initiative over to {lawan}.",
    ],
    nilaiKelewat: [
      "A decisive tactical opportunity slips past; {san} lets the opponent survive.",
      "A far more forcing continuation was available that {pihak} failed to exploit.",
      "An immediate winning chance goes uncollected on this turn.",
    ],
    nilaiBlunder: [
      "A grave blunder in {san} that overturns the assessment of the game.",
      "A costly oversight by {pihak}; {san} drops decisive material or allows a mating attack.",
      "Positional collapse follows {san}, leaving {pihak} in critical trouble.",
    ],
    lebihKuat: [
      "Analysis points to {saran} as the stronger continuation.",
      "The engine prefers {saran} as the cleanest path.",
    ],
    seimbang: [
      "Objective equality holds; both sides retain balanced prospects.",
      "The position stands level, with neither player claiming a tangible pull.",
      "Strategic equilibrium is maintained, demanding accurate handling from both sides.",
    ],
    unggulTipis: [
      "{unggul} holds a slight pull (+{nilai}) thanks to marginally superior piece activity.",
      "A modest initiative favours {unggul} at roughly +{nilai}.",
    ],
    unggulJelas: [
      "{unggul} commands a clear advantage (+{nilai}) across the key sectors of the board.",
      "The assessment favours {unggul} distinctly at +{nilai}.",
    ],
    unggulMenang: [
      "{unggul} has reached a technically winning position (+{nilai}).",
      "A decisive advantage for {unggul} (+{nilai}); conversion now rests on clean technique.",
    ],
    unggulMat: [
      "A forced mating net in {mat} moves is on the board for {unggul}.",
      "Analysis confirms forced checkmate in {mat} for {unggul}.",
    ],
    skakmat: [
      "Checkmate by {san}, concluding the game in {pihak}'s favour.",
      "Checkmate — {lawan}'s king has no legal flight square remaining.",
      "Decisive finish by {pihak}: {san} brings resistance to an end.",
    ],
    pat: [
      "Stalemate: with no legal move and the king unattacked, the game is drawn.",
      "The game concludes in stalemate in accordance with the laws of chess.",
    ],
    remis: [
      "The game ends in a draw.",
      "Play concludes peacefully with honours shared.",
    ],
    remisUlang: [
      "Draw confirmed by threefold repetition of position.",
      "The identical position having occurred three times, the game is drawn.",
    ],
    remisMaterial: [
      "Drawn due to insufficient material to construct a mating net.",
      "Neither side possesses sufficient mating material; draw.",
    ],
    ajakEngine: [
      "Enable the analysis engine to inspect concrete variations and objective evaluations.",
      "Switch on the engine module for deeper tactical verification of this position.",
    ],
    awan: [
      "Cloud database reference lists {awan} as the main try (eval {nilai}).",
      "Opening cloud records favour {awan} with an assessment of {nilai}.",
    ],
    fork: [
      "Double attack by {pihak}'s {bidak} on {petak}, threatening two of {lawan}'s pieces simultaneously.",
      "A fork on {petak}: {lawan} cannot rescue both attacked units at once.",
      "{pihak} executes a tactical fork from {petak}, winning material by force.",
    ],
    skakBayangan: [
      "Discovered check: moving {pihak}'s {bidak} opens a direct line of fire against {lawan}'s king.",
      "A discovered check via {san} confronts {lawan} with simultaneous threats.",
    ],
    terpaku: [
      "{lawan}'s piece on {petak} is pinned to the king and deprived of mobility.",
      "A binding tactical pin on {petak} paralyses {lawan}'s defender.",
    ],
    seimbangDinamis: [
      "Dynamic equilibrium prevails, with structural trumps and piece activity counterbalancing one another.",
      "The position offers reciprocal chances for both {pihak} and {lawan}.",
      "Middlegame balance holds; superior strategic planning will tip the scales.",
      "Neither camp suffers from chronic weaknesses — a rich fight lies ahead.",
    ],
    unggulStruktur: [
      "{pihak} possesses the sounder pawn structure, whereas {lawan} nurses lasting static weaknesses.",
      "Superior space and pawn cohesion grant {pihak} a durable long-term edge.",
    ],
    posisiTajam: [
      "Play enters a razor-sharp phase where concrete calculation outweighs general principles.",
      "Tactical tension reaches a peak — a single imprecision could prove fatal.",
    ],
  },

  genZ: {
    biasa: [
      "{pihak} plays {san} — tidying up the coordination while scouting for weaknesses in {lawan}'s camp.",
      "{san} from {pihak}. Calm, measured chess to lock down the squares around {petak}.",
      "The {bidak} slides to {petak}. No fireworks yet, just clean piece improvement.",
      "{san}. {pihak} keeps the tempo steady and waits for {lawan} to blink first.",
    ],
    buku: [
      "{san} is pure {pembukaan} book theory. Opening prep running smoothly!",
      "Right down the {pembukaan} main highway with {san} — both sides know their lines.",
      "{san}, classic {pembukaan} stuff. The real fight starts once book runs out!",
    ],
    tangkap: [
      "{pihak} snaps up the {korban} on {petak} with {san}! Lines are opening fast.",
      "Trade on {petak}! {pihak} clears the {korban} and forces {lawan} to rethink.",
      "{san} — the {korban} on {petak} comes off the board and the rhythm shifts.",
    ],
    tangkapUntung: [
      "Clean profit! {pihak} pockets the {korban} on {petak} on great terms.",
      "{san}! Big material pickup for {pihak} on {petak} — {lawan}'s defence sprung a leak!",
    ],
    tangkapMenteri: [
      "QUEEN DOWN! {pihak} snags the enemy queen on {petak} with {san}!",
      "{san}! {lawan}'s queen drops on {petak} — coming back from that is brutal!",
    ],
    tukarMenteri: [
      "Queen trade on {petak}! With {san}, {pihak} takes it straight into a pure endgame grind.",
      "{san} swaps queens on {petak} — attacking fireworks cool off and endgame technique takes over!",
    ],
    tukarGajahKuda: [
      "{pihak} trades bishop for knight on {petak} with {san}, aiming to mess up {lawan}'s pawn structure.",
      "{san} — cashing in the bishop for the knight on {petak} to grab tempo.",
    ],
    fianchetto: [
      "Clean fianchetto on {petak}! {pihak}'s bishop is laser-beaming the long diagonal.",
      "{san} — tucked neatly on {petak}, that bishop eyes the whole centre from afar.",
    ],
    dobrakPusat: [
      "Central break {san}! {pihak} goes straight at {lawan}'s pawn chain.",
      "{san}! {pihak} challenges the centre head-on to rip open fresh files.",
    ],
    kudaPosTerdepan: [
      "{pihak}'s knight parks on a dream outpost at {petak}! Pawn-protected and impossible to kick out.",
      "{san} — monster knight planted on {petak}, suffocating {lawan}'s camp!",
    ],
    bentengLajurTerbuka: [
      "{pihak} swings the rook to {petak} with {san}, claiming the open highway!",
      "{san} — open file locked down by {pihak}'s rook from {petak}.",
    ],
    bentengBarisTujuh: [
      "{pihak}'s rook crashes onto {petak}! Seventh-rank invasion — {lawan}'s pawns are in trouble.",
      "{san}! Rook deep on the seventh rank, the worst kind of uninvited guest for {lawan}.",
    ],
    pionBebas: [
      "{pihak}'s passed pawn charges to {petak}! Every step closer to queening turns up the heat on {lawan}.",
      "{san} — that passed pawn on {petak} is rolling and tying down defenders.",
    ],
    profilaksisSayap: [
      "{san} — smart preventive touch from {pihak}, shutting down wing jumps and giving the king breathing room.",
      "Neat little prophylaxis with {san}: lock the flank first, then push the main plan.",
    ],
    menteriDini: [
      "{pihak} brings the queen out early to {petak} with {san} — bold, just watch out for tempo-gaining chases!",
      "{san} puts the queen to work early; {pihak} can't afford to fall behind in development.",
    ],
    kembangPerwira: [
      "{pihak} gets the {bidak} out to {petak} with {san} — fast, healthy development!",
      "{san} brings {pihak}'s {bidak} straight into the central fight.",
      "Clean setup with {san}: another piece joins the party for {pihak}.",
    ],
    rajaAktifAkhir: [
      "Queens are off, time for {pihak}'s king to roll up its sleeves on {petak} with {san}!",
      "{san} — endgame mode unlocked as {pihak}'s king marches toward the centre.",
    ],
    skak: [
      "Check with {san}! {lawan}'s king has to move right now.",
      "{san}! {pihak} snatches the tempo and rattles {lawan}'s setup.",
      "Check incoming! No quiet moves allowed for {lawan} on this turn.",
    ],
    skakTambahan: [
      "Bonus check on top! {lawan} has to rescue the king before anything else.",
      "Arrives with check — handing {lawan} two problems at once!",
    ],
    skakSatuJalan: [
      "Only one legal square left for {lawan} — boxed right in!",
    ],
    rokadePendek: [
      "{pihak} castles short — king tucked away safely and rook ready for action.",
      "Kingside castle done! {pihak}'s king is cosy behind the pawn shield.",
    ],
    rokadePanjang: [
      "{pihak} castles long! Buckle up, opposite-side attacks could get wild.",
      "Queenside castling from {pihak} — the board is about to heat up fast!",
    ],
    enPassant: [
      "En passant {san}! Classic chess rule and always a crowd-pleaser.",
      "{pihak} takes en passant on {petak} — sharp and clean!",
    ],
    promosi: [
      "PROMOTION! {pihak}'s pawn goes all the way and turns into a {bidak} on {petak}!",
      "Touchdown on {petak}! {pihak} crowns a brand-new {bidak}!",
    ],
    lawanMenggantung: [
      "Check out {petak} — {lawan} left a piece hanging out to dry there!",
      "Loose piece alert on {petak}: {lawan} forgot a bodyguard.",
    ],
    sendiriMenggantung: [
      "Heads up! {pihak}'s {bidak} on {petak} is sitting unguarded.",
      "Careful on {petak} — {pihak}'s {bidak} is looking mighty loose.",
    ],
    paksa: [
      "Strictly forced — literally the only legal move on the board.",
      "Zero choice here, the board makes {pihak}'s decision automatically.",
    ],
    nilaiBrilian: [
      "BRILLIANT! {san} is a grandmaster-level sacrifice that blows the board wide open!",
      "Unreal vision! {pihak} drops {san}, giving up material for a knockout attack!",
      "Showstopper move with {san}! Deep calculation from {pihak} pays off big.",
    ],
    nilaiHebat: [
      "Big-time move! {san} hits the exact pressure point.",
      "Razor sharp — {pihak} threads the needle with {san}!",
      "Clutch precision! {pihak} plays {san} without giving an inch.",
    ],
    nilaiTerbaik: [
      "Top engine choice! {san} nails the best line on the board.",
      "Dead on target — {san} is the strongest answer here.",
      "Can't play it better than {san} in this spot.",
    ],
    nilaiUnggul: [
      "Strong and clean. {san} keeps {pihak}'s position super comfortable.",
      "Rock solid! {pihak} stays firmly in the driver's seat with {san}.",
      "Smart chess — {san} nurses {pihak}'s edge with zero drama.",
    ],
    nilaiLayak: [
      "Playable enough. {san} holds up fine even if something spicier existed.",
      "Totally fine — {pihak} keeps everything together with {san}.",
      "Practical move from {pihak}, causing zero self-inflicted headaches.",
    ],
    nilaiKeliru: [
      "Slight slip — {san} gives {lawan} a little room to breathe.",
      "A touch soft here, letting {pihak}'s pressure cool off a bit.",
      "Close, though {san} lets some of the initiative slip away.",
    ],
    nilaiKesalahan: [
      "Oof, mistake! {san} lets momentum swing over to {lawan}.",
      "Cracks are showing after {san} — {lawan} gets real counterplay now.",
      "Loose touch with {san}, forcing {pihak} onto the back foot.",
    ],
    nilaiKelewat: [
      "Huge miss! There was a knockout tactical shot instead of {san}.",
      "Golden chance slips right by — {lawan} lives to fight on.",
      "{pihak} walks past a winning continuation that was begging to be played.",
    ],
    nilaiBlunder: [
      "MASSIVE BLUNDER! {san} blows up {pihak}'s own defences!",
      "Ouch! After {san}, the eval bar slams straight toward {lawan}.",
      "Heartbreaker at a key moment — {san} gifts {lawan} a huge advantage!",
    ],
    lebihKuat: [
      "Look closely — {saran} packed way more punch here.",
      "The engine's top try instead was {saran}.",
    ],
    seimbang: [
      "Dead even right now — whoever calculates cleaner takes the wheel.",
      "All square! Plenty of fight left for both sides.",
      "Nobody ahead yet, just a tense battle of plans.",
    ],
    unggulTipis: [
      "{unggul} has a slight edge (+{nilai}) and starts dictating the pace.",
      "Small pull for {unggul} (+{nilai}), though anything can still happen.",
    ],
    unggulJelas: [
      "{unggul} is clearly in charge (+{nilai}) — the opponent is running low on active ideas.",
      "Real pressure from {unggul} (+{nilai}), with much livelier pieces.",
    ],
    unggulMenang: [
      "{unggul} is cruising (+{nilai}), just needs clean conversion from here.",
      "A +{nilai} lead for {unggul} — keep it tidy and the point is in the bag.",
    ],
    unggulMat: [
      "Forced mate spotted! {unggul} wraps this up in {mat} moves.",
      "Mate in {mat} on the board for {unggul} — no escape!",
    ],
    skakmat: [
      "CHECKMATE! {pihak} slams the door shut with {san}!",
      "All over! {lawan}'s king is out of squares — clean win for {pihak}!",
      "Pure mate with {san}! Not a single flight square left.",
    ],
    pat: [
      "Stalemate! Safe king, zero legal moves — instant half-point each!",
      "Stalemate trap! Nowhere legal to go, so the game is drawn.",
    ],
    remis: [
      "Drawn game after a tough back-and-forth scrap.",
      "Split point — neither side budged an inch.",
    ],
    remisUlang: [
      "Same position three times in a row — draw by repetition!",
      "Threefold repetition on the board, and that's a wrap.",
    ],
    remisMaterial: [
      "Not enough pieces left on the board to ever force mate — automatic draw.",
      "Bare bones material left, no mating net possible. Draw!",
    ],
    ajakEngine: [
      "Flip on the engine to check the eval bar and hidden tactical lines!",
      "Want to see the sharpest machine line here? Turn on the engine panel.",
    ],
    awan: [
      "Cloud book likes {awan} from the last position (eval {nilai}).",
      "Cloud theory check: {awan} scores {nilai}.",
    ],
    fork: [
      "NASTY FORK! {pihak}'s {bidak} on {petak} hits two targets at once!",
      "Double attack from {petak}! {lawan} can't save both pieces.",
      "{pihak} drops a fork on {petak} — something in {lawan}'s camp has to give!",
    ],
    skakBayangan: [
      "Discovered check! {pihak}'s {bidak} steps aside and unleashes a hidden laser on {lawan}'s king!",
      "Double trouble via {san}: the piece moves and a hidden check fires straight through!",
    ],
    terpaku: [
      "{lawan}'s piece on {petak} is pinned solid — move it and the king gets sniped!",
      "Locked down on {petak}! That pin freezes {lawan}'s piece completely.",
    ],
    seimbangDinamis: [
      "Level on the eval bar, electric on the board — both sides have real trumps.",
      "Even score, yet packed with tricks and active plans for both players.",
      "Structure and piece activity cancel out; middlegame accuracy decides it from here.",
      "No big cracks on either side yet — still a great fight!",
    ],
    unggulStruktur: [
      "{pihak} owns the cleaner pawn structure while {lawan} is stuck nursing weak squares.",
      "Material is even, but space and pawn health clearly favour {pihak}.",
    ],
    posisiTajam: [
      "Board on fire! Miss one detail here and the whole evaluation flips.",
      "Walking a tactical tightrope now — pure calculation time!",
    ],
  },
};

/** komentator untuk halaman Teka-Teki — dinamis & suportif */
export const komentatorTekaTeki = {
  santai: {
    mulaiSatu: [
      "New puzzle! {pihak} to move and deliver checkmate in 1. Spot the finishing blow!",
      "Fresh puzzle! {pihak} plays and mates in 1 move. Find the knockout!",
    ],
    mulai: [
      "New puzzle: {pihak} to move, checkmate in {n}. Look first at checks and forcing sacrifices.",
      "Mate in {n} starting with {pihak}. Map out the forcing sequence step by step.",
      "{pihak} to play and force mate in {n}. Watch every flight square around the enemy king.",
    ],
    mulaiSudah: [
      "You have solved this puzzle before — test your pattern recognition again!",
    ],
    benar: [
      "Spot on! Now your opponent is forced to reply...",
      "Right on the mark! Let's see how {lawan} tries to defend.",
      "Correct. The mating net is opening up.",
    ],
    lawan: [
      "Opponent replies. {sisa} forcing moves left to checkmate!",
      "{lawan} responds. Just {sisa} more moves to seal the mate.",
    ],
    lawanTerakhir: [
      "The defence is out of resources. Find the mating finish!",
      "Last reply played — one final blow delivers checkmate.",
    ],
    salah: [
      "Not quite. Look for something more forcing that leaves no defensive resource.",
      "That gives the opponent breathing room. Search for a tighter forcing try.",
      "Not that one. Prioritise checks or unstoppable mating threats.",
    ],
    salahSkak: [
      "It is check, but {lawan}'s king still has {jalan} escape squares. Cut them off!",
      "Good check, yet the king still finds {jalan} flight squares. Look for a cleaner net!",
    ],
    salahTangkap: [
      "Winning the {korban} is tempting, but the real prize here is the enemy king!",
      "Taking the {korban} grabs material, yet forced checkmate is on the board.",
    ],
    salahTerakhir: [
      "The final move must deliver outright checkmate, not merely another check.",
      "Last step of the combination — it has to be checkmate.",
    ],
    ilegal: [
      "Illegal move! Check whether your king is in check or your piece is pinned.",
      "That move isn't legal. Make sure your own king stays safe.",
    ],
    petunjuk: [
      "Tactical hint: take a closer look at your {bidak} on {dari}.",
      "Start with the {bidak} on {dari} — that is where the combination begins.",
    ],
    pengorbanan: [
      "Beautiful sacrifice! Giving up the {bidak} on {petak} rips open the king's shelter!",
      "Bold sacrifice! The {bidak} lands on {petak} to smash open the defensive wall.",
    ],
    selesai: [
      "Superb! Puzzle solved with a clean checkmate!",
      "Flawless calculation! Every forcing move found right down to mate.",
      "Solved! You executed the mating pattern cleanly.",
    ],
    selesaiTema: [
      "Key tactical motif: {tema}. Keep this pattern in mind for your own games!",
      "Motif featured: {tema}. A classic tactical theme worth remembering.",
    ],
    tinjau: [
      "Tactical review — Move {nomor}. Notice how every escape square gets sealed off.",
      "Move {nomor}: see why the defender had no better reply.",
    ],
    engineMat: [
      "Engine verified: forced mate in {mat} confirmed.",
      "Analysis check: this {mat}-move mating net is completely sound.",
    ],
  },
  formal: {
    mulaiSatu: [
      "Tactical Exercise: {pihak} to move and mate in 1.",
      "Tactical Exercise: {pihak} to play and deliver checkmate in one move.",
    ],
    mulai: [
      "Tactical Exercise: {pihak} to move and force checkmate in {n} moves.",
      "Assignment: {pihak} plays and forces mate in {n}.",
      "Calculate the {n}-move mating sequence for {pihak}, prioritising forcing checks.",
    ],
    mulaiSudah: [
      "Records show this tactical problem has been solved previously.",
    ],
    benar: [
      "Move verified. Awaiting the defensive reply.",
      "Accurate continuation. Observing {lawan}'s forced response.",
      "Correct execution. Playing out the main defensive try.",
    ],
    lawan: [
      "Reply played. {sisa} moves remain in the mating line.",
      "{lawan} responds according to the main line; {sisa} moves to mate.",
    ],
    lawanTerakhir: [
      "Concluding phase: deliver the final checkmating move.",
      "Defensive resources are exhausted; one finishing move remains.",
    ],
    salah: [
      "Inaccurate continuation; the opponent retains a viable defence.",
      "Insufficiently forcing — {lawan} obtains defensive counterplay.",
      "This line falls short of forced mate. Re-examine more restrictive checks.",
    ],
    salahSkak: [
      "Check delivered, yet the enemy king retains {jalan} legal flight squares.",
      "A legal check, though {jalan} escape squares remain unguarded.",
    ],
    salahTangkap: [
      "Capturing the {korban} is secondary; the objective is forced checkmate.",
      "Winning the {korban} diverges from the mating sequence.",
    ],
    salahTerakhir: [
      "The concluding move must establish checkmate.",
      "On the final move, an ordinary check is insufficient.",
    ],
    ilegal: [
      "Illegal move under the laws of chess.",
      "Move rejected due to king exposure or pin restrictions.",
    ],
    petunjuk: [
      "Calculation hint: examine the {bidak} standing on {dari}.",
      "The combination originates with the {bidak} on {dari}.",
    ],
    pengorbanan: [
      "Piece sacrifice: the {bidak} on {petak} is invested to dismantle the king's cover.",
      "The {bidak} is sacrificed on {petak} to pry open critical mating lines.",
    ],
    selesai: [
      "Exercise complete. Tactical combination verified.",
      "Solved. The forced mating sequence has been executed accurately.",
      "Complete. Every critical variation has been calculated.",
    ],
    selesaiTema: [
      "Primary tactical motif: {tema}.",
      "Classified theme: {tema}.",
    ],
    tinjau: [
      "Solution review — Move {nomor}.",
      "Move {nomor}: observe how the king's flight squares are systematically eliminated.",
    ],
    engineMat: [
      "Engine verification: forced mate in {mat} moves.",
      "The analysis engine confirms checkmate in {mat}.",
    ],
  },
  genZ: {
    mulaiSatu: [
      "New puzzle! {pihak} to move, mate in 1. Spot it fast!",
      "Fresh puzzle: {pihak} plays and drops mate in 1!",
    ],
    mulai: [
      "New puzzle: {pihak} to move, mate in {n}. Lock down every flight square!",
      "Mate in {n}. {pihak} starts — look for checks that leave zero breathing room!",
      "{pihak} to play, {n} moves to mate. Cut off the king's escape routes first!",
    ],
    mulaiSudah: [
      "You've cracked this puzzle before — let's see if your vision is still sharp!",
    ],
    benar: [
      "Clean! Opponent has to answer...",
      "Nailed it! Now {lawan} scrambles for a reply.",
      "Nice! The mating net is coming together.",
    ],
    lawan: [
      "Opponent answers back. {sisa} moves left to finish the mate!",
      "{lawan} replies. Just {sisa} steps left to close it out.",
    ],
    lawanTerakhir: [
      "Opponent is out of squares. Drop the checkmate!",
      "Zero options left for the defence — finish with mate!",
    ],
    salah: [
      "Not forcing enough — the king still slips out in this line.",
      "Too loose. Your opponent still finds a way to survive.",
      "Not that move. Hunt for a check or threat they can't ignore.",
    ],
    salahSkak: [
      "Check, sure, but the enemy king still has {jalan} escape squares. Tighten the net!",
      "Good check, except {jalan} flight squares are still wide open!",
    ],
    salahTangkap: [
      "Grabbing the {korban} looks juicy, but we're hunting the king here!",
      "Taking the {korban} wins material, yet clean mate is right there.",
    ],
    salahTerakhir: [
      "Last move has to be pure checkmate, not just another check!",
      "Finishing blow needs to be mate — a regular check won't cut it!",
    ],
    ilegal: [
      "Illegal move! Your king might be in check or that piece is pinned.",
      "Can't play that — double-check pins and checks on your king.",
    ],
    petunjuk: [
      "Clue: the key piece is your {bidak} on {dari}.",
      "Start with the {bidak} on {dari} — that's what unlocks the mate.",
    ],
    pengorbanan: [
      "Classy sacrifice! Tossing the {bidak} onto {petak} rips the king's shelter wide open!",
      "Boom — sacrificing the {bidak} on {petak} smashes straight through the defence.",
    ],
    selesai: [
      "CLEAN! Puzzle solved with a picture-perfect mate!",
      "Done and dusted! Every forcing move nailed right to checkmate.",
      "Flawless finish! Mating net executed to perfection.",
    ],
    selesaiTema: [
      "Tactical theme: {tema}. Lock that pattern in for your next game!",
      "Pattern unlocked: {tema}. You'll spot this one over the board.",
    ],
    tinjau: [
      "Solution replay — Move {nomor}. Watch how every escape square disappears.",
      "Move {nomor}: see why the defender had zero counterplay.",
    ],
    engineMat: [
      "Engine check: forced mate in {mat} verified.",
      "Engine confirms mate in {mat}. Ice cold!",
    ],
  },
};
