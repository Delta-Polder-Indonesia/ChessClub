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
  keterangan: "Live commentary driven by board dynamics, opening patterns, and engine evaluation.",
  nyalakan: "Turn commentator on",
  matikan: "Turn commentator off",
  gayaLabel: "Narration Style",
  gayaSantai: "Club Coach",
  gayaFormal: "Classical Grandmaster",
  gayaGenZ: "Rapid Broadcast",
  menunggu: "Waiting for the opening move...",
  posisiAwal: "Board ready. White has the first move.",
  menilai: "Checking key continuations...",
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
      "With {san}, {pihak}'s bishop takes up a strong fianchetto post on {petak}.",
    ],
    dobrakPusat: [
      "Central pawn break {san}! {pihak} immediately challenges {lawan}'s pawn chain to open lines.",
      "{pihak} strikes with {san}, undermining {lawan}'s central foothold and fighting for the initiative.",
      "Tension in the centre via {san}: {pihak} asks {lawan} an immediate structural question.",
    ],
    kudaPosTerdepan: [
      "{pihak}'s knight lands on a superb outpost at {petak} — anchored by a pawn and immune to enemy pawn pokes.",
      "{san} plants a knight deep on {petak}, cramping the heart of {lawan}'s position.",
      "Ideal knight outpost on {petak}! With {san}, {pihak} secures a commanding central perch.",
    ],
    bentengLajurTerbuka: [
      "{pihak} swings the rook to {petak} with {san}, seizing control of the open file.",
      "{san} — {pihak}'s rook claims the file from {petak}, preparing to penetrate into enemy territory.",
      "Vertical control claimed: {san} brings {pihak}'s rook straight onto the open lane at {petak}.",
    ],
    bentengBarisTujuh: [
      "{pihak}'s rook invades {petak}! Reaching the seventh rank ties down {lawan}'s king and targets base pawns.",
      "{san} plants a rook deep in {lawan}'s back ranks — a classic endgame and middlegame trump.",
      "Incisive penetration with {san}: {pihak}'s rook on {petak} starts harassing {lawan}'s pawn base.",
    ],
    pionBebas: [
      "{pihak}'s passed pawn marches to {petak}! Every step forward ties down more of {lawan}'s pieces.",
      "{san} — the passed pawn on {petak} becomes a serious long-term asset.",
      "{pihak} pushes the passed pawn to {petak}, forcing {lawan} to organise an urgent blockade.",
    ],
    profilaksisSayap: [
      "{san} — neat prophylaxis from {pihak}, taking away a wing square from {lawan}'s pieces while creating luft.",
      "A useful preventive touch with {san}: securing the flank before {pihak} resumes the main plan.",
      "{pihak} slips in {san} to rule out annoying pins or minor-piece jumps along the wing.",
    ],
    menteriDini: [
      "{pihak} brings the queen out early to {petak} with {san} — ambitious, though minor pieces may chase it with tempo.",
      "{san} activates the queen early; {pihak} must be careful not to fall behind in development.",
      "Early queen sortie to {petak} via {san} — demanding accurate play so {lawan} doesn't gain free tempi.",
    ],
    kembangPerwira: [
      "{pihak} brings the {bidak} out to {petak} with {san}, contesting key central squares.",
      "{san} develops {pihak}'s {bidak} smoothly and clears the back rank toward castling.",
      "Natural development with {san}: {pihak}'s {bidak} joins the fight for the centre.",
      "Smooth mobilisation — {san} posts {pihak}'s {bidak} on an active square at {petak}.",
    ],
    rajaAktifAkhir: [
      "With queens off the board, {pihak}'s king steps up to {petak} via {san} to join the endgame battle.",
      "{san} — textbook endgame play as {pihak} centralises the king toward the action.",
      "In the endgame the king becomes a fighting piece: {san} brings {pihak}'s monarch to {petak}.",
    ],
    gandakanBenteng: [
      "{pihak} builds a heavy-piece battery on {petak} with {san}, doubling vertical firepower!",
      "{san} stacks heavy pieces along the file from {petak} — turning up the pressure on {lawan}'s entry points.",
      "Heavy pieces team up via {san} on {petak}, preparing a direct breakthrough.",
    ],
    gajahPin: [
      "{san} lines up {pihak}'s bishop from {petak}, pinning {lawan}'s defender along the diagonal!",
      "An uncomfortable diagonal pin with {san}: the bishop on {petak} freezes {lawan}'s piece.",
      "{pihak} posts the bishop on {petak} via {san}, sighting straight through to a major target behind.",
    ],
    incarTitikLemah: [
      "{san} places {pihak}'s {bidak} on {petak}, taking direct aim at the vulnerable square beside {lawan}'s king!",
      "Immediate pressure from {petak} with {san} — testing {lawan}'s kingside defences early.",
      "With {san}, {pihak} trains fire on the tender spot in {lawan}'s camp.",
    ],
    hubungkanBenteng: [
      "{san} finishes clearing the back rank — {pihak}'s rooks are now cleanly connected!",
      "The first rank opens up after {san}, linking both of {pihak}'s rooks into one unit.",
      "Development milestone reached with {san}: {pihak}'s rooks now support each other along the back rank.",
    ],
    kudaTepi: [
      "{san} puts {pihak}'s knight on the rim at {petak} — narrowing its scope unless a concrete wing break follows.",
      "{pihak}'s knight steps out to the edge on {petak} via {san}, usually a temporary stop before rerouting.",
      "With {san}, the knight lands on the flank at {petak}; {pihak} will want a clear follow-up so it isn't sidelined.",
    ],
    kuasaiPusat: [
      "{pihak} plants a pawn firmly in the centre with {san}, claiming space and restricting {lawan}'s pieces.",
      "{san} stakes a direct central claim on {petak} while opening lines for the pieces behind.",
      "Principled chess with {san}: {pihak} occupies the key central square {petak}.",
    ],
    manuverKuda: [
      "{pihak} reroutes the knight to {petak} with {san}, eyeing a more influential middlegame post.",
      "Knight manoeuvre {san}: {pihak} rotates the knight to {petak} to probe weak squares in {lawan}'s camp.",
      "{san} improves {pihak}'s knight on {petak}, bringing more squares under control.",
      "Patient knight regrouping via {san}, hunting for an active perch from {petak}.",
    ],
    manuverGajah: [
      "{pihak} shifts the bishop to {petak} with {san}, switching fire onto a more open diagonal.",
      "{san} — {pihak}'s bishop changes lanes to {petak}, slicing across key squares.",
      "Diagonal adjustment via {san}: {pihak}'s bishop now operates from {petak}.",
      "{pihak} repositions the bishop to {petak} so it isn't blunted by friendly pawns.",
    ],
    manuverMenteri: [
      "{pihak} shifts the queen to {petak} with {san}, coordinating threats across both flanks.",
      "Queen manoeuvre {san}: from {petak}, {pihak}'s queen eyes tactical targets while holding the structure together.",
      "{san} activates {pihak}'s queen cleanly on {petak} without walking into tempo-gaining pokes.",
      "Subtle queen repositioning to {petak} via {san}, tightening {pihak}'s attacking harmony.",
    ],
    dorongPion: [
      "{pihak} advances a pawn with {san}, gaining space around {petak} and cramping {lawan}'s pieces.",
      "Pawn expansion {san}: {pihak} improves the structure while nudging {lawan} back in that sector.",
      "{san} pushes {pihak}'s pawn front to {petak} to support upcoming middlegame plans.",
      "Measured pawn touch {san}, securing useful squares ahead of {petak} for {pihak}'s pieces.",
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
      "Fianchetto development via {san}: {pihak}'s bishop on {petak} becomes a lasting strategic asset.",
    ],
    dobrakPusat: [
      "A thematic central break with {san}: {pihak} challenges {lawan}'s pawn chain to open files.",
      "With {san}, {pihak} contests central space directly and fights for the middlegame initiative.",
      "{pihak} launches the pawn break {san} to undermine {lawan}'s central bulwark.",
    ],
    kudaPosTerdepan: [
      "{pihak}'s knight establishes an ideal outpost on {petak}, supported by a pawn and safe from enemy pawns.",
      "Posting the knight on {petak} via {san} secures a lasting strategic foothold for {pihak}.",
      "{san} anchors a central knight outpost on {petak} that cramps {lawan}'s coordination.",
    ],
    bentengLajurTerbuka: [
      "{pihak} brings the rook to {petak}, contesting a file clear of friendly pawns.",
      "With {san}, {pihak}'s rook seizes vertical control from {petak} in preparation for seventh-rank entry.",
      "Rook centralisation via {san} asserts vertical authority from {petak}.",
    ],
    bentengBarisTujuh: [
      "Classical invasion with {san}: {pihak}'s rook penetrates to {petak} deep inside enemy territory.",
      "The rook on {petak} ties down {lawan}'s king while targeting the base of the pawn chain.",
      "Seventh-rank penetration at {petak} grants {pihak} a persistent, nagging initiative.",
    ],
    pionBebas: [
      "Advancing the passed pawn to {petak} via {san} creates an enduring promotion threat against {lawan}.",
      "{pihak}'s passed pawn on {petak} grows in strategic weight with every exchange.",
      "{san} pushes the passed pawn to {petak}, obliging {lawan}'s pieces to assume blockading duty.",
    ],
    profilaksisSayap: [
      "{san} serves a prophylactic purpose, restricting enemy piece jumps along the flank.",
      "A preventive pawn touch with {san}, controlling a wing square while providing useful luft.",
      "{pihak} exercises prophylactic restraint with {san} ahead of active central plans.",
    ],
    menteriDini: [
      "Early queen activation to {petak} via {san} risks offering {lawan}'s minor pieces convenient tempo targets.",
      "{san} commits the queen early in the opening; precise handling of tempo will be required.",
      "Bringing the queen to {petak} early demands care lest {pihak} fall behind in minor-piece development.",
    ],
    kembangPerwira: [
      "{pihak} develops the {bidak} to {petak}, accelerating piece mobilisation in the opening.",
      "Sound classical development with {san}: {pihak}'s {bidak} joins the struggle for the centre.",
      "{san} continues {pihak}'s harmonious build-up along classical lines.",
      "With {san}, {pihak}'s {bidak} takes up an active post on {petak}.",
    ],
    rajaAktifAkhir: [
      "In queenless endgame fashion, {pihak} activates the king toward {petak} to support the pawns.",
      "King centralisation via {san} adheres strictly to fundamental endgame principles.",
      "{pihak}'s king steps forward to {petak} with {san}, assuming an active fighting role.",
    ],
    gandakanBenteng: [
      "{pihak} forms a heavy-piece battery on {petak} with {san}, intensifying vertical pressure.",
      "Doubling along the file via {san} at {petak} prepares deep penetration into {lawan}'s camp.",
      "With {san}, {pihak} aligns heavy pieces along a key vertical artery.",
    ],
    gajahPin: [
      "{san} places {pihak}'s bishop on {petak}, pinning an enemy defender along the diagonal.",
      "A diagonal pin via {san} restricts the flexibility of {lawan}'s defensive pieces from {petak}.",
      "Pinning pressure from {petak} with {san} puts {lawan}'s piece coordination to the test.",
    ],
    incarTitikLemah: [
      "{san} directs {pihak}'s {bidak} from {petak} straight against the sensitive point near {lawan}'s king.",
      "Active placement on {petak} via {san} exerts early kingside pressure against {lawan}.",
      "With {san}, {pihak} probes the tenderest square in {lawan}'s uncastled setup.",
    ],
    hubungkanBenteng: [
      "{san} clears the back rank, bringing both of {pihak}'s rooks into direct communication.",
      "Mobilisation is completed with {san}; {pihak}'s rooks now coordinate along the first rank.",
      "With {san} played, {pihak}'s back rank is clear and both rooks are linked.",
    ],
    kudaTepi: [
      "{san} places the knight on the rim at {petak}, curtailing its scope unless a flank break follows.",
      "Posting the knight on the edge via {san} calls for a concrete continuation to avoid passivity.",
      "{pihak}'s knight steps to the flank on {petak}; classically the rim diminishes central reach.",
    ],
    kuasaiPusat: [
      "{pihak} occupies a core central square directly with {san}, staking an immediate spatial claim.",
      "The central advance {san} tightens {pihak}'s grip on key squares while freeing piece diagonals.",
      "Classical central play with {san}: {pihak}'s pawn claims {petak}.",
    ],
    manuverKuda: [
      "{pihak} reroutes the knight toward {petak} via {san} in search of a superior strategic square.",
      "The regrouping manoeuvre {san} directs {pihak}'s knight to {petak}.",
      "With {san}, {pihak} repositions the knight on {petak} to eye weak squares in {lawan}'s structure.",
      "A patient knight rotation via {san} refines {pihak}'s middlegame harmony.",
    ],
    manuverGajah: [
      "{pihak} transfers the bishop to {petak} with {san}, contesting a more productive diagonal.",
      "Diagonal redeployment via {san} places {pihak}'s bishop effectively on {petak}.",
      "With {san}, {pihak}'s bishop shifts to {petak} to probe the opponent's camp from a fresh angle.",
      "Repositioning the bishop to {petak} via {san} preserves active scope for {pihak}'s minor pieces.",
    ],
    manuverMenteri: [
      "{pihak} centralises or regroups the queen to {petak} with {san}, uniting offensive and defensive duties.",
      "Queen redeployment via {san} on {petak} heightens tactical awareness across both wings.",
      "With {san}, {pihak}'s queen adopts a flexible post at {petak} clear of immediate harassment.",
      "Shifting the queen to {petak} strengthens {pihak}'s heavy-piece coordination.",
    ],
    dorongPion: [
      "{pihak} advances a pawn with {san}, claiming space and restricting {lawan}'s piece mobility.",
      "The structural touch {san} tightens control over the squares surrounding {petak}.",
      "Measured pawn expansion via {san} lays groundwork for {pihak}'s middlegame operations.",
      "{san} secures useful spatial gains around {petak} without overextending.",
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
      "Sniper lane unlocked with {san}: {pihak}'s bishop sets up shop on {petak}!",
    ],
    dobrakPusat: [
      "Central break {san}! {pihak} goes straight at {lawan}'s pawn chain.",
      "{san}! {pihak} challenges the centre head-on to rip open fresh files.",
      "Throwing a punch in the centre with {san} — forcing {lawan} to make a call!",
    ],
    kudaPosTerdepan: [
      "{pihak}'s knight parks on a dream outpost at {petak}! Pawn-protected and impossible to kick out.",
      "{san} — monster knight planted on {petak}, suffocating {lawan}'s camp!",
      "Prime real estate on {petak}! {pihak}'s knight via {san} is a total thorn in {lawan}'s side.",
    ],
    bentengLajurTerbuka: [
      "{pihak} swings the rook to {petak} with {san}, claiming the open highway!",
      "{san} — open file locked down by {pihak}'s rook from {petak}.",
      "Vertical lane owned! {san} lines up {pihak}'s rook at {petak} ready to invade.",
    ],
    bentengBarisTujuh: [
      "{pihak}'s rook crashes onto {petak}! Seventh-rank invasion — {lawan}'s pawns are in trouble.",
      "{san}! Rook deep on the seventh rank, the worst kind of uninvited guest for {lawan}.",
      "Back-rank raid started via {san} to {petak}! {lawan}'s pawn base is under heavy fire.",
    ],
    pionBebas: [
      "{pihak}'s passed pawn charges to {petak}! Every step closer to queening turns up the heat on {lawan}.",
      "{san} — that passed pawn on {petak} is rolling and tying down defenders.",
      "Runaway pawn alert! With {san}, {pihak}'s passer on {petak} gets harder to stop.",
    ],
    profilaksisSayap: [
      "{san} — smart preventive touch from {pihak}, shutting down wing jumps and giving the king breathing room.",
      "Neat little prophylaxis with {san}: lock the flank first, then push the main plan.",
      "Zero headaches allowed via {san}: {pihak} takes away annoying pins on the wing.",
    ],
    menteriDini: [
      "{pihak} brings the queen out early to {petak} with {san} — bold, just watch out for tempo-gaining chases!",
      "{san} puts the queen to work early; {pihak} can't afford to fall behind in development.",
      "Queen out early on {petak} with {san} — ambitious, as long as {lawan} doesn't get free tempi!",
    ],
    kembangPerwira: [
      "{pihak} gets the {bidak} out to {petak} with {san} — fast, healthy development!",
      "{san} brings {pihak}'s {bidak} straight into the central fight.",
      "Clean setup with {san}: another piece joins the party for {pihak}.",
      "Smooth mobilisation {san}: {pihak}'s {bidak} goes to work on {petak}.",
    ],
    rajaAktifAkhir: [
      "Queens are off, time for {pihak}'s king to roll up its sleeves on {petak} with {san}!",
      "{san} — endgame mode unlocked as {pihak}'s king marches toward the centre.",
      "No sitting back in the endgame: {san} brings {pihak}'s king up to {petak}!",
    ],
    gandakanBenteng: [
      "Heavy battery locked in at {petak} with {san}! Double firepower down the file!",
      "{san} stacks the heavy hitters — {lawan} better brace for impact along this lane!",
      "Cannons lined up via {san} on {petak}, ready to punch straight through!",
    ],
    gajahPin: [
      "{san} slaps a nasty pin from {petak} — {lawan}'s piece can barely twitch!",
      "Sharp diagonal pin with {san}! {pihak}'s bishop on {petak} freezes the defender.",
      "{pihak} locks down the diagonal from {petak} via {san}, tying {lawan} in knots!",
    ],
    incarTitikLemah: [
      "{san} parks {pihak}'s {bidak} on {petak}, staring straight at the soft spot by {lawan}'s king!",
      "Instant heat from {petak} with {san} — testing {lawan}'s kingside right out of the gate!",
      "{pihak} takes aim at the tenderest square in {lawan}'s camp via {san}!",
    ],
    hubungkanBenteng: [
      "Back rank officially cleared after {san} — {pihak}'s rooks are teamed up now!",
      "{san} wraps up development nicely: both of {pihak}'s rooks are connected.",
      "Clean coordination unlocked with {san} as {pihak}'s rooks link up!",
    ],
    kudaTepi: [
      "{san} sends the knight out to the rim at {petak} — cramped range unless a wing break is coming.",
      "{pihak}'s knight steps wide to {petak} with {san}, hopefully just passing through!",
      "Knight on the edge at {petak} via {san}; needs a crisp follow-up so it doesn't get stranded.",
    ],
    kuasaiPusat: [
      "{san}! {pihak} plants a flag right on the central square {petak}.",
      "Central pawn push {san}, grabbing prime real estate and opening lines for {pihak}!",
      "Big claim in the middle via {san} — setting the tone from {petak}.",
    ],
    manuverKuda: [
      "{pihak} reroutes the knight to {petak} with {san}, hunting for a juicier square!",
      "Slick knight rotation {san}: {pihak} hops to {petak} to probe weak spots in {lawan}'s camp.",
      "{san} — upgrading the knight to {petak} where it covers way more ground.",
      "Patient knight footwork via {san}, eyeing fresh targets from {petak}.",
    ],
    manuverGajah: [
      "{pihak} swings the bishop to {petak} with {san}, switching onto a cleaner diagonal!",
      "{san} shifts the bishop to {petak} to slice across {lawan}'s squares.",
      "New angle unlocked with {san}: {pihak}'s bishop now works from {petak}.",
      "{pihak} tidies up the bishop on {petak} via {san} for maximum scope.",
    ],
    manuverMenteri: [
      "{pihak} slides the queen to {petak} with {san}, linking threats across both wings!",
      "Queen shift {san}: from {petak}, {pihak} keeps tactical pressure simmering.",
      "{san} parks {pihak}'s queen actively on {petak} clear of easy pokes.",
      "Smooth queen touch {san} — tightening {pihak}'s coordination from {petak}.",
    ],
    dorongPion: [
      "Pawn push {san}! {pihak} squeezes extra space around {petak}.",
      "{san} — clean pawn expansion from {pihak} to set up the next wave.",
      "Front line moves up via {san}, taking squares away from {lawan}'s pieces near {petak}.",
      "Measured pawn touch {san} by {pihak}, tightening the grip on that sector.",
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

/** concise, specific puzzle commentary */
export const komentatorTekaTeki = {
  santai: {
    mulaiSatu: [
      "Mate in one. {pihak} to move.",
      "{pihak} to move; mate in one.",
    ],
    mulai: [
      "Mate in {n}. {pihak} to move.",
      "Target: mate in {n}; {pihak} to move.",
      "{pihak} to play. Find mate in {n}.",
    ],
    mulaiSudah: ["Solved before."],
    benar: [
      "Correct: {san}.",
      "Right move: {san}.",
      "{san} is correct.",
    ],
    lawan: [
      "Reply: {san}. {sisa} moves remain.",
      "{lawan} replies {san}; {sisa} left.",
    ],
    lawanTerakhir: [
      "Reply: {san}. Find mate.",
      "{san}. Find the mating move.",
    ],
    salah: [
      "{san} isn't forcing.",
      "{san} lets the opponent defend.",
      "Find a forcing move, not {san}.",
    ],
    salahSkak: [
      "Check, but the opponent has {jalan} legal replies.",
      "Check does not force mate; {jalan} legal replies remain.",
    ],
    salahTangkap: [
      "Taking the {korban} doesn't force mate.",
      "The {korban} isn't the target; find mate.",
    ],
    salahTerakhir: [
      "Not mate: {san}.",
      "The final move {san} isn't mate.",
    ],
    ilegal: [
      "Illegal move. Protect your king.",
      "That move is not legal.",
    ],
    petunjuk: [
      "Look at the {bidak} on {dari}.",
      "Focus on the {bidak} at {dari}.",
    ],
    pengorbanan: [
      "Sacrificing the {bidak} on {petak} opens the king's defence.",
      "The {bidak} on {petak} is sacrificed to expose the king.",
    ],
    selesai: [
      "Solved.",
      "Puzzle complete.",
      "Tactic complete.",
    ],
    selesaiTema: [
      "Pattern: {tema}.",
      "Motif: {tema}.",
    ],
    tinjau: [
      "Move {nomor}: {san}.",
      "{san} — move {nomor}.",
    ],
    engineMat: [
      "Engine: mate in {mat}.",
      "Analysis: mate in {mat}.",
    ],
  },
  formal: {
    mulaiSatu: [
      "Mate in one. {pihak} to move.",
      "Target: mate in one; {pihak} to move.",
    ],
    mulai: [
      "Target: mate in {n}. {pihak} to move.",
      "{pihak} to move; find mate in {n}.",
      "Force mate in {n} moves.",
    ],
    mulaiSudah: ["This puzzle was solved before."],
    benar: [
      "Correct: {san}.",
      "Accurate move: {san}.",
      "{san} matches the solution.",
    ],
    lawan: [
      "Reply: {san}. {sisa} moves remain.",
      "{lawan} replies {san}; {sisa} remain.",
    ],
    lawanTerakhir: [
      "Reply: {san}. Find mate.",
      "{san}; deliver mate next.",
    ],
    salah: [
      "{san} does not force the win.",
      "The opponent can defend after {san}.",
      "Choose a forcing move instead of {san}.",
    ],
    salahSkak: [
      "Check; the opponent still has {jalan} legal replies.",
      "Check does not force mate; {jalan} legal moves remain.",
    ],
    salahTangkap: [
      "Taking the {korban} does not force mate.",
      "Capturing the {korban} does not deliver mate.",
    ],
    salahTerakhir: [
      "Not mate yet.",
      "The final move must be mate.",
    ],
    ilegal: [
      "Illegal move. Keep your king safe.",
      "That move is not legal.",
    ],
    petunjuk: [
      "Examine the {bidak} on {dari}.",
      "The combination starts with the {bidak} on {dari}.",
    ],
    pengorbanan: [
      "The {bidak} sacrifice on {petak} exposes the king.",
      "Sacrificing the {bidak} on {petak} opens the king's defence.",
    ],
    selesai: [
      "Solved.",
      "Puzzle complete.",
      "Tactic complete.",
    ],
    selesaiTema: [
      "Theme: {tema}.",
      "Motif: {tema}.",
    ],
    tinjau: [
      "Move {nomor}: {san}.",
      "Review move {nomor}: {san}.",
    ],
    engineMat: [
      "Analysis: mate in {mat}.",
      "Engine: mate in {mat}.",
    ],
  },
  genZ: {
    mulaiSatu: [
      "Mate in one. {pihak} to move.",
      "{pihak} to move; mate in one.",
    ],
    mulai: [
      "Mate in {n}. {pihak} to move.",
      "Mate target: {n} moves. {pihak} to play.",
      "{pihak} to play. Find mate in {n}.",
    ],
    mulaiSudah: ["Solved already."],
    benar: [
      "Nice: {san}.",
      "Correct: {san}.",
      "{san} works.",
    ],
    lawan: [
      "Reply {san}. {sisa} left.",
      "{lawan}: {san}. {sisa} moves remain.",
    ],
    lawanTerakhir: [
      "{san}. Find mate.",
      "Reply {san}; mate next.",
    ],
    salah: [
      "{san} isn't forcing.",
      "The opponent still holds after {san}.",
      "Find a forcing threat, not {san}.",
    ],
    salahSkak: [
      "Check, but {jalan} legal replies remain.",
      "Check still allows {jalan} legal replies.",
    ],
    salahTangkap: [
      "Taking the {korban} doesn't force mate.",
      "The {korban} isn't the target; find mate.",
    ],
    salahTerakhir: [
      "Not mate: {san}.",
      "The last move {san} must be mate.",
    ],
    ilegal: [
      "Illegal. Keep your king safe.",
      "That move isn't legal.",
    ],
    petunjuk: [
      "Look at the {bidak} on {dari}.",
      "Key piece: the {bidak} on {dari}.",
    ],
    pengorbanan: [
      "The {bidak} on {petak} is sacrificed to expose the king.",
      "Sacrifice the {bidak} on {petak} to open the king's defence.",
    ],
    selesai: [
      "Solved.",
      "Tactic complete.",
      "Puzzle done.",
    ],
    selesaiTema: [
      "Pattern: {tema}.",
      "Motif: {tema}.",
    ],
    tinjau: [
      "Move {nomor}: {san}.",
      "{san} — move {nomor}.",
    ],
    engineMat: [
      "Engine: mate in {mat}.",
      "Analysis: mate in {mat}.",
    ],
  },
};
