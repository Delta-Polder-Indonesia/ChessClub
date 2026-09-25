/**
 * Kamus Inggris (EN) · teks komentator — dipakai lewat kunci papan.komentator.* dan
 * tekaTeki.komentator.* (lihat komentator.js di berkas papan/tekaTeki).
 * Blok ini diimpor oleh papan.js dan tekaTeki.js.
 *
 * Setiap kategori WAJIB punya jumlah varian yang sama persis dengan kamus ID
 * (scripts/uji-i18n.mjs dan scripts/uji-komentator.mjs menolak bila berbeda),
 * dan minimal sejumlah varian yang diminta mesin (lihat tambah()/tambahSoal()/
 * peristiwaUtama() di src/lib/komentator.js). Placeholder memakai nama kunci
 * kamus ({pihak}, {san}, {lawan}, {petak}, {bidak}, {korban}, {pembukaan},
 * {unggul}, {nilai}, {mat}, {saran}, {awan}) — mesin komentator yang mengisi,
 * bukan bahasa teksnya.
 */

/** komentator untuk Papan Interaktif — kunci aslinya papan.komentator.* */
export const komentatorPapan = {
  judul: "Board Commentator",
  keterangan: "Real-time contextual analysis and narration based on the dynamics of the position.",
  nyalakan: "Turn commentator on",
  matikan: "Turn commentator off",
  gayaLabel: "Narration Style",
  gayaSantai: "Casual & Comprehensive",
  gayaFormal: "Analytical & Professional",
  gayaGenZ: "Expressive & Modern",
  menunggu: "Waiting for the first move...",
  posisiAwal: "Board is ready. White holds the initial initiative.",
  menilai: "Calculating variations...",
  pihak: { putih: "White", hitam: "Black" },
  bidak: { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" },
  santai: {
    biasa: [
      "{pihak} plays {san}. A consolidating move that creates no new weakness.",
      "{san}. {pihak} secures an important square and keeps control of the tempo.",
      "{pihak} shifts the {bidak} to {petak}. Focus on structure and piece harmony.",
      "{san} is played. Both sides are still measuring the distance to an attack.",
    ],
    buku: [
      "{san} — still inside the perimeter of {pembukaan} theory. A solid book structure.",
      "The classic move {san} from the {pembukaan}. The battle of theoretical understanding begins.",
      "Entering the {pembukaan} line via {san}. Both sides are playing a very familiar pattern.",
    ],
    tangkap: [
      "{pihak} executes the capture of the {korban} on {petak}. The exchange of material officially begins.",
      "An exchange on {petak}! {pihak} takes the {korban} and reshapes the board.",
      "{san} — the {korban} is swept away. Let's see how {lawan} restores the balance.",
    ],
    tangkapUntung: [
      "Sharp calculation from {pihak}! The {korban} falls on {petak} at a cheap price.",
      "{san}! A clean material gain for {pihak}. {lawan} is leaking on this wing.",
    ],
    tangkapMenteri: [
      "Disaster on {petak}! {lawan}'s queen is trapped and executed by {pihak}.",
      "{pihak} brings down the enemy queen with {san}. The road to victory opens wide!",
    ],
    skak: [
      "A direct threat! {san} gives check and forces an instant response from {lawan}.",
      "Check! {pihak} seizes the initiative, and {lawan}'s king loses its coordination.",
      "{san}+ — {lawan}'s king is disturbed and must accept a positional compromise.",
    ],
    skakTambahan: [
      "A double attack! On top of the tactical point, this also delivers check.",
      "Check on top of everything! Layered pressure makes it hard for {lawan} to breathe.",
    ],
    skakSatuJalan: [
      "A closed choice — {lawan} is forced into the only legal defensive move.",
    ],
    rokadePendek: [
      "{pihak} secures the king with a short castle while activating the rook.",
      "Kingside castling. {pihak}'s defensive rook structure is now solid.",
    ],
    rokadePanjang: [
      "A long castle from {pihak}! An aggressive signal for opposite-wing attacks.",
      "{pihak} chooses the queenside rook. The game is about to turn very sharp.",
    ],
    enPassant: [
      "En passant executed! A precise cross-capture tactic from {pihak}.",
      "{san} by en passant. A rare tactical moment, well exploited.",
    ],
    promosi: [
      "{pihak}'s pawn breaks through the barricade and promotes to a {bidak} on {petak}!",
      "The result of a long transformation — {pihak} welcomes a new {bidak} on the final rank!",
    ],
    lawanMenggantung: [
      "A weakness is detected: {lawan}'s {bidak} on {petak} stands without enough protection.",
      "Watch {petak} — {lawan}'s {bidak} there is exposed as a tactical target.",
    ],
    sendiriMenggantung: [
      "A gap in the defence! {pihak}'s {bidak} on {petak} is now unguarded.",
      "Stay alert: the {bidak} on {petak} invites a potential counter-attack.",
    ],
    paksa: [
      "An unavoidable move in this tactical chain.",
      "There is no alternative; {san} is a technical necessity.",
    ],
    nilaiBrilian: [
      "A brilliant move!! A calculated sacrifice that demolishes {lawan}'s defence!",
      "{san} — a fantastic idea! A move of high artistic value that reverses the logic of the position.",
      "Brilliant! A high-level tactical discovery from {pihak}.",
    ],
    nilaiHebat: [
      "Very sharp! {pihak} finds the most poisonous solution in this position.",
      "A critical move! {san} immediately exploits the smallest crack in the defence.",
      "Extraordinary precision. {pihak} executes the advantage without hesitation.",
    ],
    nilaiTerbaik: [
      "Accurate. {san} is the most optimal option according to the engine.",
      "The main choice in this position. {pihak} maximises the efficiency of the attack.",
      "An ideal move. The balance between defence and pressure is perfectly kept.",
    ],
    nilaiUnggul: [
      "Solid and strong. {pihak}'s positional advantage is well preserved.",
      "{san} keeps control of space without giving the opponent a chance to counter.",
      "A very good move for maintaining long-term pressure.",
    ],
    nilaiLayak: [
      "Reasonable enough. A safe choice, though a bolder alternative exists.",
      "{san} does not damage the structure, but it drifts slightly from the best momentum.",
      "A standard move that preserves the stability of the position.",
    ],
    nilaiKeliru: [
      "Slightly imprecise. {pihak} lets go of part of its central control.",
      "{san} gives {lawan} a little room to redeploy its pieces.",
      "Not incisive enough. The advantage that was held starts to shrink.",
    ],
    nilaiKesalahan: [
      "A tactical error! {san} opens a dangerous gap in the defensive wing.",
      "{pihak}'s position loosens. The opponent now has a clear target for an attack.",
      "An unnecessary compromise — the momentum shifts to {lawan}.",
    ],
    nilaiKelewat: [
      "A golden opportunity missed! There is a far more deadly combination in this position.",
      "{pihak} misses the decisive tactic. The pressure now drops drastically.",
      "A pity: the execution that could have ended the resistance is left unused.",
    ],
    nilaiBlunder: [
      "FATAL BLUNDER! {san} collapses the structure and hands over the advantage!",
      "Positional disaster! {pihak} commits a serious mistake that costs dearly.",
      "An oversight with fatal consequences. {pihak}'s position is now on the verge of defeat.",
    ],
    lebihKuat: [
      "A far more poisonous alternative: {saran}.",
      "Calculation shows that {saran} applies more decisive pressure.",
    ],
    seimbang: [
      "From {pihak}'s point of view, this position is essentially balanced; the game remains in a neutral dynamic.",
      "The evaluation shows a fully level position. Victory will be decided by manoeuvring precision.",
      "The board's dynamic is still equal. Both sides have balanced positional compensation.",
    ],
    unggulTipis: [
      "{unggul} holds a slight positional edge (+{nilai}). The pressure is starting to be felt.",
      "The initiative begins to tilt toward {unggul} with a margin of (+{nilai}) pawns.",
    ],
    unggulJelas: [
      "{unggul}'s domination is increasingly clear with an evaluation margin of +{nilai}.",
      "{unggul}'s position is very favourable. Space control and piece activity are overwhelmingly superior.",
    ],
    unggulMenang: [
      "A technically winning position for {unggul} (+{nilai}). Only the final conversion remains.",
      "An absolute advantage for {unggul}. The opponent's structure of resistance has collapsed.",
    ],
    unggulMat: [
      "A forced mate pattern is detected! {unggul} locks in victory in {mat} moves.",
      "An unavoidable mating line for {unggul} ({mat} more moves).",
    ],
    skakmat: [
      "CHECKMATE! The battle ends with an absolute victory for {pihak}!",
      "A beautiful closing combination — checkmate by {pihak}!",
      "It's over! {lawan}'s king is out of squares and {pihak} closes the game.",
    ],
    pat: [
      "Stalemate! The king has no legal move yet is not in check. The game ends in a draw.",
      "Tactical deadlock! The position ends in an automatic draw.",
    ],
    remis: [
      "The game is declared a draw after agreement or a dead evaluation.",
      "Eternal balance — the game ends without a winner.",
    ],
    remisUlang: [
      "An automatic draw due to threefold repetition of the position.",
      "The same position appears for the third time. The game is declared a draw.",
    ],
    remisMaterial: [
      "A draw because the material on hand is insufficient to deliver checkmate.",
      "The pieces left on the board can no longer force checkmate. Draw.",
    ],
    ajakEngine: [
      "Turn on the analysis engine to see the objective evaluation and the advantage graph.",
      "Enable the engine to compare this move with the engine's best choice.",
    ],
    awan: [
      "Cloud database note: the previous best move was {awan} (evaluation {nilai}).",
      "Cloud DB reference for the earlier position: {awan} with a score of {nilai}.",
    ],
    // Kunci taktis spesifik (fork / skak bayangan / pin) & variasi posisi.
    fork: [
      "DOUBLE ATTACK! {pihak}'s {bidak} on {petak} forks two targets at once!",
      "A deadly fork! {lawan} cannot save both pieces.",
      "{pihak} launches a double attack from {petak}. One of {lawan}'s pieces is bound to fall.",
    ],
    skakBayangan: [
      "Discovered check! {pihak}'s {bidak} moves aside and uncovers a hidden attack on {lawan}'s king!",
      "A layered threat: the piece shifts, and a direct checking line opens wide!",
    ],
    terpaku: [
      "{lawan}'s piece on {petak} is now pinned - it cannot move without giving up what stands behind it.",
      "An unpleasant pin for {lawan}. Its piece is locked in place on {petak}.",
    ],
    seimbangDinamis: [
      "From {pihak}'s point of view, this position is essentially balanced; neither side has a clear advantage.",
      "Dynamic balance is maintained. Normal development and solid play will keep the position intact.",
      "The board is in a state of complete neutralisation. Structure and activity balance each other out.",
      "The evaluation shows full equality. The contest will be decided by accuracy in the endgame.",
    ],
    unggulStruktur: [
      "{pihak} holds a long-term pawn-structure advantage. {lawan}'s position has many passive weaknesses.",
      "Even with equal material, {pihak}'s control of space and piece mobility is far more dominant.",
    ],
    posisiTajam: [
      "The position has become very sharp! One wrong move could change the evaluation drastically.",
      "The game is entering a poisonous tactical line - precise calculation is essential now.",
    ],
  },

  formal: {
    biasa: [
      "{pihak} instructs {san}. Strengthening the central defensive structure.",
      "{san} is played by {pihak}. Gradual positional consolidation.",
      "{pihak} moves the {bidak} toward {petak}. Control of a strategic square.",
      "{san} is played. The position remains stable with no meaningful evaluation change.",
    ],
    buku: [
      "The {pembukaan} family of theory. {pihak} executes {san} according to standard doctrine.",
      "A {pembukaan} variation. The structure follows grandmaster precedent.",
      "{san} remains within the theoretical corpus of the {pembukaan}.",
    ],
    tangkap: [
      "Exchange of material: {pihak} eliminates the {korban} on {petak}.",
      "{san}. The removal of a piece on {petak} changes the tactical configuration.",
      "{pihak} captures the {korban} on {petak}; the material balance begins to shift.",
    ],
    tangkapUntung: [
      "A clean material gain is achieved by {pihak} through the capture of the {korban} on {petak}.",
      "{pihak} obtains the {korban} on {petak} at minimal material cost.",
    ],
    tangkapMenteri: [
      "A critical point: {lawan}'s queen is eliminated on {petak}. Extreme material imbalance.",
      "{lawan}'s queen falls on {petak}. The material evaluation changes significantly.",
    ],
    skak: [
      "Check. {pihak} forces {lawan} to respond to the direct threat against the king.",
      "{pihak} gives check; {lawan} must address the threat to its king.",
      "Check from {pihak}. {lawan}'s response options are limited to handling the king's danger.",
    ],
    skakTambahan: [
      "This calculating move simultaneously delivers check against the enemy king.",
      "In addition to its main effect, the move also gives check.",
    ],
    skakSatuJalan: [
      "Only one legal response can be played by {lawan}.",
    ],
    rokadePendek: [
      "{pihak} castles kingside. Secure the giant and connect the rook.",
      "Kingside castling is executed by {pihak}; king and rook are now coordinated.",
    ],
    rokadePanjang: [
      "{pihak} performs queenside castling. Preparing a confrontational battle.",
      "Queenside castling by {pihak}. The structure of the position may harden.",
    ],
    enPassant: [
      "The special en passant capture is executed by {pihak}.",
      "{pihak} makes use of the en passant rule in this position.",
    ],
    promosi: [
      "{pihak}'s pawn reaches the final rank and is promoted to a {bidak} on {petak}.",
      "Promotion on {petak}: {pihak}'s pawn transforms into a {bidak}.",
    ],
    lawanMenggantung: [
      "Positional analysis: {lawan}'s piece on {petak} is in an unguarded state.",
      "{lawan}'s piece on {petak} has no adequate guard.",
    ],
    sendiriMenggantung: [
      "Vulnerability: {pihak}'s {bidak} on {petak} is isolated without protection.",
      "{pihak}'s {bidak} on {petak} is exposed as a tactical target for {lawan}.",
    ],
    paksa: [
      "A forced move based on the tactical causality of the board.",
      "The position offers no other legal alternative.",
    ],
    nilaiBrilian: [
      "A brilliant move. A sacrifice that is theoretically and mathematically valid.",
      "An extraordinary tactical find. The complexity of the position is solved precisely.",
      "The quality of the move lies beyond conventional calculation; its consequence is decisive.",
    ],
    nilaiHebat: [
      "A very strong response. {pihak} finds the most effective line in this position.",
      "High accuracy. {pihak} chooses the continuation with the best evaluation.",
      "An optimal solution at a critical moment; the pressure on {lawan} is maintained.",
    ],
    nilaiTerbaik: [
      "An optimal move according to the analysis engine's calculation.",
      "The engine's main recommendation. No alternative has an equal evaluation.",
      "{pihak} executes the variation with the smallest evaluation margin.",
    ],
    nilaiUnggul: [
      "An accurate move that consolidates the positional advantage.",
      "Precise preservation of the advantage, without meaningful positional concession.",
      "{pihak} keeps the evaluation parameters at a favourable level.",
    ],
    nilaiLayak: [
      "A flexible move; it maintains equality of position without risk.",
      "An acceptable alternative, though not the most efficient.",
      "A choice that meets the minimum requirements without losing the initiative.",
    ],
    nilaiKeliru: [
      "A small inaccuracy. It reduces the efficiency of {pihak}'s control of space.",
      "A minor deviation from the optimal line; its impact is limited but measurable.",
      "{pihak} sacrifices part of its positional precision for simplicity of execution.",
    ],
    nilaiKesalahan: [
      "A positional error. It gives the opponent a chance to take the initiative.",
      "The evaluation worsens clearly; {lawan} gains a positional advantage.",
      "A tactical mistake that opens an attacking chance for {lawan}.",
    ],
    nilaiKelewat: [
      "A missed tactical innovation. A quick win fails to be executed.",
      "A stronger continuation exists that {pihak} does not exploit.",
      "A chance to convert the advantage is left unused; the optimal line is not executed.",
    ],
    nilaiBlunder: [
      "A fatal blunder. It drastically changes the evaluation of the position toward a loss.",
      "A serious error. The evaluation of the position swings in {lawan}'s favour.",
      "A large material or positional loss that {pihak} can hardly recover.",
    ],
    lebihKuat: [
      "The engine's main recommendation: {saran}.",
      "The engine indicates {saran} as the superior alternative.",
    ],
    seimbang: [
      "Full balance is achieved. There is no significant material or positional advantage.",
      "An equal evaluation for both sides; neither party holds a firm initiative.",
      "The position is neutral in nature; the final result depends on precision of execution.",
    ],
    unggulTipis: [
      "A marginal advantage favours {unggul} with an estimate of +{nilai}.",
      "{unggul} holds a slight initiative at a margin of +{nilai}.",
    ],
    unggulJelas: [
      "A substantial advantage is obtained by {unggul} at a margin of +{nilai}.",
      "Control of the position tilts to {unggul} with an evaluation of +{nilai}.",
    ],
    unggulMenang: [
      "The position is theoretically won by {unggul} (+{nilai}).",
      "{unggul}'s edge of +{nilai} is enough to head toward a win.",
    ],
    unggulMat: [
      "A forced checkmate is calculated in {mat} moves for {unggul}.",
      "The engine detects a mating sequence of {mat} moves favouring {unggul}.",
    ],
    skakmat: [
      "Checkmate. The confrontation is over.",
      "Checkmate. {pihak} ends the game with no further response from the opponent.",
      "Terminal position: checkmate for {pihak}.",
    ],
    pat: [
      "Stalemate. The result is declared a draw according to the regulations.",
      "There is no legal move, yet the king is not in check. Draw.",
    ],
    remis: [
      "Final result: draw.",
      "The game ends without a winner by agreement or regulation.",
    ],
    remisUlang: [
      "Draw confirmed due to threefold repetition.",
      "An identical position occurs three times; the game is declared a draw.",
    ],
    remisMaterial: [
      "Draw confirmed: insufficient material.",
      "The remaining material is inadequate to force checkmate. Draw.",
    ],
    ajakEngine: [
      "Enable the engine module for precise mathematical calculation.",
      "Turn on the engine to obtain a quantitative evaluation of this position.",
    ],
    awan: [
      "Cloud Database query: the previous optimal move was {awan} (score {nilai}).",
      "The cloud database recommends {awan} with a value of {nilai}.",
    ],
    // Kunci taktis spesifik (fork / skak bayangan / pin) & variasi posisi.
    fork: [
      "Double attack: {pihak}'s {bidak} on {petak} attacks two enemy pieces simultaneously.",
      "A fork tactic is detected. {lawan} must choose which piece to sacrifice.",
      "{pihak} applies a double attack from {petak}; one of {lawan}'s pieces will be lost.",
    ],
    skakBayangan: [
      "Discovered check: the movement of {pihak}'s {bidak} opens a hidden line of attack against {lawan}'s king.",
      "A layered threat - the piece shifts and the checking line becomes open.",
    ],
    terpaku: [
      "{lawan}'s piece on {petak} is in a pinned state; moving it would expose its own king.",
      "A tactical pin against {lawan}'s piece on {petak}; its mobility is absolutely restricted.",
    ],
    seimbangDinamis: [
      "From {pihak}'s point of view, this position is essentially balanced; neither side has a clear advantage.",
      "Dynamic balance is maintained. Normal development and solid play will keep the position intact.",
      "The board is in a state of complete neutralisation. Structure and activity balance each other out.",
      "The evaluation shows full equality. The contest will be decided by accuracy in the endgame.",
    ],
    unggulStruktur: [
      "{pihak} holds a long-term pawn-structure advantage. {lawan}'s position has many passive weaknesses.",
      "Even with equivalent material, {pihak}'s control of space and piece mobility is far more dominant.",
    ],
    posisiTajam: [
      "The position has become very sharp. A single inaccurate move could change the evaluation drastically.",
      "The game is entering a poisonous tactical line; precise calculation becomes a prerequisite.",
    ],
  },

  genZ: {
    biasa: [
      "{pihak} plays {san}. Stay calm, this is just the warm-up.",
      "{san} from {pihak}. Setting up the formation without wasting moves.",
      "The {bidak} slides to {petak}. Still the setup phase, no drama yet.",
      "{san}. Securing the tempo, letting the opponent think hard.",
    ],
    buku: [
      "{san} still fits the {pembukaan} module. Basic theory done.",
      "Entering the {pembukaan} scenario. {pihak} plays cleanly to the blueprint.",
      "{san} is exactly the {pembukaan} line. Everyone knows this by heart.",
    ],
    tangkap: [
      "{pihak} wipes the {korban} off {petak} instantly. Material changes hands.",
      "{san}! The {korban} gets cleaned up. The board starts to clear.",
      "{pihak} takes the {korban} on {petak}. The material setup changes right away.",
    ],
    tangkapUntung: [
      "{pihak} farms the {korban} with a {bidak} on {petak}. Pure material profit!",
      "{san}! Free profit, the opponent leaks tactics.",
    ],
    tangkapMenteri: [
      "QUEEN GONE! {pihak} traps the queen on {petak}. Mentally game over!",
      "{pihak} grabs the queen on {petak}. The opponent loses its strongest piece!",
    ],
    skak: [
      "Check! {pihak} forces the enemy king to find shelter.",
      "{san}+! The tempo is taken over, the defence is caught off guard.",
      "Check again! The enemy king can't just sit there now.",
    ],
    skakTambahan: [
      "Double check on top! The opponent gets more confused organising the defence.",
      "Check as a bonus. The opponent gets two jobs at once.",
    ],
    skakSatuJalan: [
      "Only one legal square left. No other choice for the opponent.",
    ],
    rokadePendek: [
      "{pihak} castles short. The king goes straight into a safe bunker.",
      "Short castle done. {pihak}'s rook finally comes alive.",
    ],
    rokadePanjang: [
      "{pihak} castles long! A sign of open war on both wings.",
      "Long castle chosen. The position turns hot.",
    ],
    enPassant: [
      "En passant played! A classic tactic that always surprises.",
      "Uses en passant. A rare rule, but perfectly legal.",
    ],
    promosi: [
      "Promotion! {pihak}'s little pawn officially becomes a {bidak} on {petak}!",
      "Level up! {pihak}'s pawn becomes a {bidak} on {petak}.",
    ],
    lawanMenggantung: [
      "Look at {petak} — the opponent's {bidak} is left without a guard.",
      "The opponent's {bidak} on {petak} is just waiting to be taken.",
    ],
    sendiriMenggantung: [
      "Warning: {pihak}'s {bidak} on {petak} is at risk of being stolen.",
      "{pihak}'s {bidak} on {petak} is almost unguarded.",
    ],
    paksa: [
      "A forced move. The tactical line only has one path.",
      "No other option. The board decides.",
    ],
    nilaiBrilian: [
      "BRILLIANT! {san} is a genius-level sacrifice, grandmaster standard!",
      "A masterpiece! {pihak} blows up the board with {san}!",
      "Didn't see that coming! {pihak} finds an idea you'd never spot.",
    ],
    nilaiHebat: [
      "Classy move! {pihak} finds the key to the opponent's defence.",
      "Super sharp. {pihak} takes the most poisonous line here.",
      "Precision! {pihak} executes without hesitation.",
    ],
    nilaiTerbaik: [
      "100% accurate. {san} is the most perfect line from the engine.",
      "Right on target. {san} really is the best answer.",
      "Nothing beats {san} in this position.",
    ],
    nilaiUnggul: [
      "So strong. {san} makes {pihak}'s position even harder to break.",
      "Solid. {pihak} keeps full control.",
      "A safe move that still preserves {pihak}'s advantage.",
    ],
    nilaiLayak: [
      "Safe. Not the sharpest, but it causes no problems.",
      "Pretty normal. {san} works, though a bolder option exists.",
      "Good enough. {pihak}'s position stays intact.",
    ],
    nilaiKeliru: [
      "A bit off. The initiative drops slightly.",
      "Slightly off-target. {lawan} gets some breathing room.",
      "Almost right, but {san} lets go of a bit of control.",
    ],
    nilaiKesalahan: [
      "Mistake! {san} lets the advantage fly into the opponent's hands.",
      "{pihak}'s position starts leaking. {lawan} gets room to attack.",
      "Tactical error! {san} forces {pihak} onto the defensive.",
    ],
    nilaiKelewat: [
      "A golden chance slips away! The tactic isn't taken.",
      "A shame — {pihak} misses a far deadlier move.",
      "The key tactic is missed. {pihak}'s pressure drops instantly.",
    ],
    nilaiBlunder: [
      "SERIOUS BLUNDER! {san} wrecks the whole defensive plan!",
      "Fatal! {pihak}'s position collapses entirely because of {san}.",
      "Can't watch! {pihak} hands over its own advantage.",
    ],
    lebihKuat: [
      "The engine's actual best suggestion: {saran}.",
      "Look closely — {saran} bites far harder here.",
    ],
    seimbang: [
      "The position is genuinely balanced. Whoever is most careful wins.",
      "Nobody is ahead yet. Everything is still open.",
      "Completely level. Now it's just about who slips first.",
    ],
    unggulTipis: [
      "{unggul} is slightly better (+{nilai}). The pressure is starting to build.",
      "{unggul} is a touch on top (+{nilai}). It can still flip.",
    ],
    unggulJelas: [
      "{unggul} holds the control (+{nilai}). The opponent is running out of ideas.",
      "Clear control for {unggul} (+{nilai}). The opponent's space keeps shrinking.",
    ],
    unggulMenang: [
      "{unggul} is already on the up (+{nilai}). Just execute cleanly.",
      "A +{nilai} edge for {unggul}. Just don't throw it away.",
    ],
    unggulMat: [
      "A forced mate is detected! {unggul} locks the win in {mat} moves.",
      "A {mat}-move mating line for {unggul}. No way out.",
    ],
    skakmat: [
      "CHECKMATE! The match is closed out cleanly!",
      "Done! The enemy king is finished, {pihak} wins.",
      "Pure mate! {pihak} doesn't give even a sliver of a chance.",
    ],
    pat: [
      "Stalemate! The king is locked up without check. Instant draw!",
      "No legal move but the king is safe. Automatic draw.",
    ],
    remis: [
      "Game ends in a draw. An even fight.",
      "Level result. Nobody wanted to lose.",
    ],
    remisUlang: [
      "Threefold repetition. The game is officially a draw.",
      "The position repeats forever. Automatic draw.",
    ],
    remisMaterial: [
      "Not enough material left for mate. Auto draw.",
      "Only a few pieces left, can't force mate. Draw.",
    ],
    ajakEngine: [
      "Turn on the engine to see the accuracy score and the tactical lines.",
      "Try switching the engine on so the objective numbers show up.",
    ],
    awan: [
      "Cloud data: the most ideal move earlier was {awan} (score {nilai}).",
      "Check the cloud database: {awan} is rated {nilai}.",
    ],
    // Kunci taktis spesifik (fork / skak bayangan / pin) & variasi posisi.
    fork: [
      "DOUBLE ATTACK! {pihak}'s {bidak} on {petak} points at two targets at once!",
      "Deadly fork! {lawan} can't save both of them.",
      "{pihak} forks from {petak}. One of {lawan}'s pieces has to go.",
    ],
    skakBayangan: [
      "Discovered check! {pihak}'s {bidak} shifts and a hidden checking line opens on {lawan}'s king!",
      "Layered threat: the piece steps aside and the check goes through!",
    ],
    terpaku: [
      "{lawan}'s piece on {petak} is pinned - move it even slightly and its king is exposed.",
      "An annoying pin for {lawan}. Its piece is stuck on {petak}.",
    ],
    seimbangDinamis: [
      "From {pihak}'s point of view, this position is essentially balanced; nobody is clearly ahead.",
      "Dynamic balance holds. Play it normal and solid and the position stays safe.",
      "The board is completely neutral. Structure and activity balance each other out.",
      "The evaluation shows full equality. Accuracy in the endgame will decide it.",
    ],
    unggulStruktur: [
      "{pihak} holds a long-term pawn-structure advantage. {lawan}'s position has many passive weaknesses.",
      "Equal material, but {pihak}'s control of space and piece mobility is far more dominant.",
    ],
    posisiTajam: [
      "The position has turned very sharp! One wrong move could flip the evaluation completely.",
      "The game is entering a poisonous tactical line - precise calculation needed now.",
    ],
  },
};

/** komentator untuk halaman Teka-Teki — dinamis & suportif */
export const komentatorTekaTeki = {
  santai: {
    mulaiSatu: [
      "A new puzzle! {pihak} moves and finds checkmate in 1 move. Find the execution!",
      "A new puzzle: {pihak} moves, mate in just one. Find the finishing move!",
    ],
    mulai: [
      "A new puzzle: {pihak} moves, checkmate in {n} moves. Focus on checks and the key sacrifice.",
      "Mate in {n} starts with {pihak}. Line up the forcing moves first.",
      "{pihak} moves and needs {n} moves to mate. Watch the enemy king's escape squares.",
    ],
    mulaiSudah: [
      "This puzzle has been solved before. Test your memory!",
    ],
    benar: [
      "Exactly right! The opponent is forced to respond...",
      "Spot on! Now it's {lawan}'s turn to find a defence.",
      "Correct. The tactical line starts to open up.",
    ],
    lawan: [
      "The opponent replies. {sisa} tactical moves remain until mate!",
      "{lawan} responds. Only {sisa} moves left to close it out.",
    ],
    lawanTerakhir: [
      "The opponent has run out of options. Find the finishing move for checkmate!",
      "The opponent's reply is already maximal. One closing move remains.",
    ],
    salah: [
      "Not yet. Look for a more forcing move so the opponent has no defensive answer.",
      "The opponent can still breathe. Find a move that locks things down tighter.",
      "Not that one. Prioritise a check or a threat that cannot be avoided.",
    ],
    salahSkak: [
      "A good check, but the enemy king still has {jalan} escape squares. Find a check that locks it down!",
      "It is check, but {jalan} escape routes are still open. Narrow it further!",
    ],
    salahTangkap: [
      "Capturing the {korban} is profitable, but our main target here is the enemy king!",
      "Taking the {korban} is fine, but what we want is checkmate.",
    ],
    salahTerakhir: [
      "The closing move must seal checkmate immediately, not just give a plain check.",
      "This is the last move — it must be mate, not just check.",
    ],
    ilegal: [
      "Illegal move! Check whether your king is in check or a piece is pinned.",
      "That move is not allowed. Make sure your king is safe and nothing is pinned.",
    ],
    petunjuk: [
      "Tactical hint: focus on the {bidak} on square {dari}.",
      "Start with the {bidak} on {dari} — the attack can be built from there.",
    ],
    pengorbanan: [
      "A beautiful sacrifice! The {bidak} on {petak} is offered to demolish the enemy king's bunker!",
      "The {bidak} on {petak} is deliberately given up so the king's defences collapse.",
    ],
    selesai: [
      "OUTSTANDING! The puzzle has been solved with a perfect checkmate!",
      "Perfect! Every forcing move was executed all the way to mate.",
      "Complete! The mating pattern was executed flawlessly.",
    ],
    selesaiTema: [
      "The main tactical pattern: {tema}. Remember this pattern for real games!",
      "The pattern used: {tema}. Note it down, it comes up often.",
    ],
    tinjau: [
      "Tactical review — Move {nomor}. Notice how every enemy escape square is locked down.",
      "Move {nomor}: see why the opponent has no other answer.",
    ],
    engineMat: [
      "The engine confirms: the mating combination in {mat} moves is verified.",
      "Engine verification: this {mat}-move mating line is legal.",
    ],
  },
  formal: {
    mulaiSatu: [
      "Tactical Module: {pihak} moves. Execute checkmate in 1 move.",
      "Tactical Module: {pihak} moves. Determine the single checkmating move.",
    ],
    mulai: [
      "Tactical Module: {pihak} moves. Find the forced checkmate in {n} calculations.",
      "Task: {pihak} moves and forces checkmate in {n} moves.",
      "A {n}-move calculation begins with {pihak}. Prioritise moves that restrict the opponent's replies.",
    ],
    mulaiSudah: [
      "Records show this puzzle has been solved previously.",
    ],
    benar: [
      "The move is verified correct. Awaiting the calculation of the opponent's response.",
      "Valid calculation. Next, {lawan}'s response is computed.",
      "Precise execution. The opponent's variations are now being counted.",
    ],
    lawan: [
      "The opponent's response is accepted. {sisa} execution moves remain.",
      "{lawan} responds as calculated. {sisa} moves remain until checkmate.",
    ],
    lawanTerakhir: [
      "Conclusion phase: determine the final checkmating move.",
      "The opponent's response is maximal. One closing move is required.",
    ],
    salah: [
      "The move is not accurate. This variation gives the opponent room to defend.",
      "This variation is not forcing; {lawan} obtains defensive alternatives.",
      "The calculation does not lead to checkmate. Consider a more restrictive move.",
    ],
    salahSkak: [
      "Check is detected, but the enemy king still has {jalan} escape squares.",
      "The check is legal, but {jalan} escape squares remain open to the king.",
    ],
    salahTangkap: [
      "The material gain of the {korban} is secondary; the primary priority is the checkmate calculation.",
      "Capturing the {korban} does not contribute to the mating sequence.",
    ],
    salahTerakhir: [
      "The final move must satisfy the condition of absolute checkmate.",
      "On the closing move, check alone does not meet the requirement.",
    ],
    ilegal: [
      "The move is illegal under the rules of chess.",
      "Move rejected: it violates the legality rules of chess.",
    ],
    petunjuk: [
      "Calculation hint: move the {bidak} from square {dari}.",
      "Starting point of the calculation: the {bidak} on square {dari}.",
    ],
    pengorbanan: [
      "Piece sacrifice: the {bidak} on {petak} is allocated to destroy the defensive structure.",
      "The {bidak} on {petak} is sacrificed to open a path to the enemy king.",
    ],
    selesai: [
      "The puzzle is complete. The tactical execution is valid.",
      "Module completed. The mating sequence is verified.",
      "Complete. All variations have been calculated correctly.",
    ],
    selesaiTema: [
      "Pattern characteristic: {tema}.",
      "The identified tactical pattern: {tema}.",
    ],
    tinjau: [
      "Re-analysis of the solution — Move {nomor}.",
      "Review of move {nomor}: evaluate every response by the opponent.",
    ],
    engineMat: [
      "Analysis engine verification: mate in {mat} moves.",
      "The engine confirms checkmate in {mat} moves.",
    ],
  },
  genZ: {
    mulaiSatu: [
      "New puzzle! {pihak} moves and locks mate in 1. Find it now!",
      "New puzzle: {pihak} moves, mate in 1. One finishing move!",
    ],
    mulai: [
      "New puzzle: {pihak} moves, mate in {n} moves. Focus on locking the opponent's escape squares!",
      "Mate in {n}. {pihak} starts — find the check that boxes the opponent in!",
      "{pihak} moves, {n} moves to mate. Close off the enemy king's escape squares first!",
    ],
    mulaiSudah: [
      "You've already solved this puzzle. Test your accuracy again!",
    ],
    benar: [
      "So clean! The opponent is forced to respond...",
      "Spot on! Now {lawan} looks for a way out.",
      "Awesome! The mating line starts to open up.",
    ],
    lawan: [
      "The opponent strikes back. Only {sisa} moves left to mate!",
      "{lawan} responds. {sisa} moves left to close the game.",
    ],
    lawanTerakhir: [
      "The opponent has run out of squares. Deliver the closing checkmate!",
      "No options left for the opponent. Give the final mate!",
    ],
    salah: [
      "Still not sharp enough. The opponent can still escape from this line.",
      "Not tight enough. The opponent still has room to run.",
      "Not that. Find the check that leaves the opponent no choice.",
    ],
    salahSkak: [
      "It is check, but the enemy king still has {jalan} escape squares. Find the tight one!",
      "Check is fine, but {jalan} escape squares are still open. Shut them all!",
    ],
    salahTangkap: [
      "Grabbing the {korban} is tempting, but the main focus is the enemy king!",
      "Eating the {korban} is profit, but what we want is mate.",
    ],
    salahTerakhir: [
      "The last move must be pure mate, not just check!",
      "The closer must be mate. Check alone isn't enough!",
    ],
    ilegal: [
      "Illegal move! Your king might be in check or pinned.",
      "Can't move like that. Check if your king is in check or pinned.",
    ],
    petunjuk: [
      "Clue: the key is the {bidak} on square {dari}.",
      "Start from the {bidak} on {dari}. That's where the mating pattern opens up.",
    ],
    pengorbanan: [
      "A classy sacrifice! The {bidak} on {petak} is given away free to open up the enemy king!",
      "The {bidak} on {petak} is deliberately offered to break down the king's defences.",
    ],
    selesai: [
      "CLEAN! The puzzle is solved with a perfect checkmate!",
      "Done! Every forcing move worked all the way to mate.",
      "Totally perfect! The checkmate was executed cleanly.",
    ],
    selesaiTema: [
      "The tactical pattern: {tema}. Store it in memory for the next game!",
      "The pattern used: {tema}. Remember it, it comes up a lot.",
    ],
    tinjau: [
      "Solution review — Move {nomor}. See how the escape squares are locked down.",
      "Move {nomor}: notice why the opponent has no answer.",
    ],
    engineMat: [
      "Engine confirmation: mate in {mat} moves verified.",
      "The engine says mate in {mat} moves. Valid!",
    ],
  },
};
