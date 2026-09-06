/**
 * Kamus Inggris (EN) · teks komentator — dipakai lewat kunci papan.komentator.* dan
 * tekaTeki.komentator.* (lihat komentator.js di berkas papan/tekaTeki).
 * Blok ini diimpor oleh papan.js dan tekaTeki.js.
 */

/** komentator untuk Papan Interaktif — kunci aslinya papan.komentator.* */
export const komentatorPapan = {
  judul: "Commentator",
  keterangan: "Live commentary on every move — from the facts on the board, plus an assessment when the engine is on.",
  nyalakan: "Turn commentator on",
  matikan: "Turn commentator off",
  gayaLabel: "Style",
  gayaSantai: "Casual",
  gayaFormal: "Formal",
  menunggu: "Make a move — commentary appears here.",
  posisiAwal: "Board is set. White moves first; let's see the plan.",
  menilai: "Assessing the move…",
  pihak: { putih: "White", hitam: "Black" },
  bidak: { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" },
  santai: {
    biasa: [
      "{pihak} plays {san}. Okay, let's see where this goes.",
      "{san} from {pihak} — calm for now, nothing's exploded yet.",
      "{pihak} slides the {bidak} to {petak}. Sensible development.",
      "Alright, {san}. {pihak} is lining up the troops.",
    ],
    buku: [
      "{san} — still in the book: {pembukaan}. Theory well memorised!",
      "This is the {pembukaan}. {pihak} follows theory with {san}.",
      "{san}, a classic. We're still in the {pembukaan}.",
    ],
    tangkap: [
      "{pihak} grabs the {korban} on {petak}! Material's shifting.",
      "Chomp! {pihak} takes the {korban} on {petak}.",
      "{san} — {pihak} picks up the {korban}. Let's see if {lawan} has a reply.",
    ],
    tangkapUntung: [
      "Whoa, {pihak} wins the {korban} with a {bidak} — big profit on {petak}!",
      "{san}! {pihak} harvests material: the {korban} goes cheaply.",
    ],
    tangkapMenteri: [
      "THE QUEEN FALLS! {pihak} takes the queen on {petak}. That's a knockout blow!",
      "Wow, {lawan}'s queen is captured on {petak}! This could be over quickly.",
    ],
    skak: [
      "Check! {pihak} plays {san} and {lawan}'s king has to run.",
      "{san}, check! {lawan}'s king is getting nervous.",
      "Check from {pihak}! {lawan} must deal with it first — nothing else allowed.",
    ],
    skakTambahan: [
      "And that's check as well! {lawan}'s king feels the heat.",
      "Plus check! Two problems at once for {lawan}.",
    ],
    skakSatuJalan: [
      "Only one way out for {lawan} — the reply is forced.",
    ],
    rokadePendek: [
      "{pihak} castles short. King safe, rook active — two birds, one stone.",
      "Castles! {pihak}'s king is now tucked away in a cosy corner.",
    ],
    rokadePanjang: [
      "Long castling from {pihak}! Bold — usually a sign of an all-out attack.",
      "{pihak} castles queenside. Opposite-side kings — this'll be spicy!",
    ],
    enPassant: [
      "En passant! {pihak} uses the rule that confuses every beginner.",
      "{san} en passant — a special move you don't see every day!",
    ],
    promosi: [
      "PROMOTION! {pihak}'s pawn reaches the end and becomes a {bidak} on {petak}!",
      "Little pawn gets promoted — {pihak} has a brand-new {bidak} on {petak}!",
    ],
    lawanMenggantung: [
      "Psst, {lawan}'s {bidak} on {petak} is hanging. Free stuff?",
      "Check out {petak} — {lawan}'s {bidak} there is under-protected.",
    ],
    sendiriMenggantung: [
      "Careful! {pihak}'s {bidak} on {petak} is hanging now — it can be taken for free.",
      "Hmm, the {bidak} on {petak} was left unguarded. {lawan} will surely notice.",
    ],
    paksa: [
      "No choice there — that was the only legal move.",
      "Forced move. Like it or not, it's {san}.",
    ],
    nilaiBrilian: [
      "BRILLIANT!! What a gorgeous sacrifice — that's master-level stuff!",
      "Wow, {san}!! Looks crazy, but it works. Brilliant!",
      "That's a brilliant move! Even the engine tips its hat.",
    ],
    nilaiHebat: [
      "Great move! {pihak} punishes {lawan}'s mistake precisely.",
      "Nice, {san} — the only good move, and {pihak} found it!",
      "Excellent! A critical moment, and {pihak} passed the test.",
    ],
    nilaiTerbaik: [
      "That's the best move! Exactly what the engine wanted.",
      "Top! {san} is the number-one choice in this position.",
      "Perfect — engine and {pihak} agree: {san}.",
    ],
    nilaiUnggul: [
      "Good move. Not the best, but almost as strong.",
      "Very nice. {san} keeps the position healthy.",
      "Solid! There might be something slightly sharper, but this is strong.",
    ],
    nilaiLayak: [
      "Decent. Not wrong, but there were more biting options.",
      "{san} is still acceptable. The position isn't damaged.",
      "Safe enough, though not the most accurate.",
    ],
    nilaiKeliru: [
      "Hmm, a slight inaccuracy. {pihak}'s edge is slowly slipping.",
      "A bit loose, {san}. The engine isn't thrilled.",
      "Not precise — {lawan} gets a little breathing room.",
    ],
    nilaiKesalahan: [
      "Ouch, that's a mistake. {pihak} hands {lawan} a golden chance.",
      "Mistake! {pihak}'s position suddenly got heavy.",
      "Oops, {san} wasn't a great idea. Momentum swings to {lawan}.",
    ],
    nilaiKelewat: [
      "Shame! A big opportunity slipped past {pihak}.",
      "Missed! {pihak} had a knockout blow but didn't see it.",
      "So close… that golden chance just went by.",
    ],
    nilaiBlunder: [
      "BLUNDER! Oh man, {san} is going to cost dearly!",
      "Oh no, a huge blunder! {lawan} is going to love this.",
      "Ouch, ouch… {san} flips the game on its head. Blunder!",
    ],
    lebihKuat: [
      "Stronger was {saran}.",
      "The engine prefers {saran} here.",
    ],
    seimbang: [
      "Still level — anyone could win this.",
      "Score near zero; the fight is wide open.",
      "Balanced. Nobody has a meaningful edge yet.",
    ],
    unggulTipis: [
      "{unggul} is slightly ahead, about {nilai} pawn(s).",
      "Leaning a little towards {unggul} (+{nilai}). Still catchable.",
    ],
    unggulJelas: [
      "{unggul} is clearly better — around {nilai} pawns. Real pressure!",
      "{unggul}'s advantage is showing: +{nilai}.",
    ],
    unggulMenang: [
      "{unggul} is winning big (+{nilai}). Just don't blunder now!",
      "This is a winning position for {unggul} — up {nilai} pawns.",
    ],
    unggulMat: [
      "There's a forced mate for {unggul} in {mat}!",
      "{unggul} has mate in {mat}. Time to execute!",
    ],
    skakmat: [
      "CHECKMATE!! {pihak} wins! What a game — thanks for playing!",
      "And that's checkmate! {pihak} wraps it up with {san}. Congrats!",
      "MATE! {lawan}'s king has nowhere to go. {pihak} wins!",
    ],
    pat: [
      "Stalemate! {lawan}'s king isn't in check but can't move — a draw. What a pity!",
      "Draw by stalemate. Careful — a classic trap when you're way ahead.",
    ],
    remis: [
      "Draw! The game ends without a winner.",
      "Both sides share the point — it's a draw.",
    ],
    remisUlang: [
      "Draw by threefold repetition.",
      "Threefold repetition — the game is drawn.",
    ],
    remisMaterial: [
      "Draw — not enough material to checkmate.",
      "Nothing left that can deliver mate. Draw.",
    ],
    ajakEngine: [
      "Want to know if that move was any good? Turn on the engine and I'll rate it.",
      "Switch the engine on above for full commentary with scores and ratings.",
    ],
  },
  formal: {
    biasa: [
      "{pihak} continues with {san}.",
      "{san}. {pihak} arranges the position without over-committing.",
      "{pihak} places the {bidak} on {petak}, a standard developing move.",
      "{san} — a quiet move that maintains the balance.",
    ],
    buku: [
      "{san} remains within theory: the {pembukaan}.",
      "This position is known as the {pembukaan}. {pihak} plays by the book.",
      "{san}, in line with {pembukaan} theory.",
    ],
    tangkap: [
      "{pihak} captures the {korban} on {petak}.",
      "{san}: {pihak} takes the {korban}. Whether {lawan} can recapture remains to be seen.",
      "Exchanges begin — {pihak} takes the {korban} on {petak}.",
    ],
    tangkapUntung: [
      "{pihak} wins material: the {korban} is captured by a {bidak} on {petak}.",
      "{san} yields a clear material gain for {pihak}.",
    ],
    tangkapMenteri: [
      "{lawan}'s queen falls on {petak}. A decisive loss of material.",
      "{pihak} captures the queen on {petak} — a loss that is hard to recover from.",
    ],
    skak: [
      "Check. {lawan}'s king must be secured immediately.",
      "{san} gives check and forces {lawan} to respond.",
      "Check from {pihak}. The initiative is in their hands.",
    ],
    skakTambahan: [
      "The move also gives check to {lawan}'s king.",
      "Check as well — {lawan} must address that threat first.",
    ],
    skakSatuJalan: [
      "{lawan} has only one legal reply.",
    ],
    rokadePendek: [
      "{pihak} castles kingside: the king is sheltered and the rooks are connected.",
      "Short castling. King safety is addressed first.",
    ],
    rokadePanjang: [
      "{pihak} castles queenside — usually a sign of an intended kingside attack.",
      "Castling queenside; the kings now stand on opposite wings.",
    ],
    enPassant: [
      "An en passant capture by {pihak}.",
      "{san} en passant — the special pawn-capture rule.",
    ],
    promosi: [
      "Promotion: {pihak}'s pawn becomes a {bidak} on {petak}.",
      "{pihak} promotes the pawn to a {bidak} on {petak}.",
    ],
    lawanMenggantung: [
      "Note {lawan}'s {bidak} on {petak}: it is insufficiently protected.",
      "{lawan}'s {bidak} on {petak} is hanging and may become a target.",
    ],
    sendiriMenggantung: [
      "A point of concern: {pihak}'s {bidak} on {petak} is now unprotected.",
      "The {bidak} on {petak} has been left unguarded — {lawan} may exploit it.",
    ],
    paksa: [
      "A forced move; there was no legal alternative.",
      "{san} is the only move available.",
    ],
    nilaiBrilian: [
      "A brilliant move — a tactically justified sacrifice.",
      "{san} is brilliant: hard to find, yet correct.",
      "Brilliant. The sacrifice yields genuine compensation.",
    ],
    nilaiHebat: [
      "An excellent move: {pihak} exploits {lawan}'s error precisely.",
      "{san} is the only strong continuation, and {pihak} found it.",
      "Very good. At the critical moment, {pihak} chose accurately.",
    ],
    nilaiTerbaik: [
      "The engine's top move.",
      "{san} is the engine's first choice in this position.",
      "Accurate — {san} is the best move.",
    ],
    nilaiUnggul: [
      "An excellent move; nearly as strong as the best.",
      "{san} keeps the position healthy.",
      "A strong choice, if not the sharpest.",
    ],
    nilaiLayak: [
      "A reasonable move, though a more accurate continuation was available.",
      "{san} is still acceptable; the position is not significantly harmed.",
      "Safe enough, though not the most precise option.",
    ],
    nilaiKeliru: [
      "A slight inaccuracy — {pihak}'s advantage diminishes.",
      "{san} lacks precision and gives {lawan} some breathing room.",
      "A minor inaccuracy that erodes {pihak}'s position.",
    ],
    nilaiKesalahan: [
      "A mistake. {pihak} gives {lawan} a real opportunity.",
      "{san} is a mistake; the balance shifts towards {lawan}.",
      "An erroneous move — the initiative now passes to {lawan}.",
    ],
    nilaiKelewat: [
      "A missed opportunity: {pihak} had a far stronger continuation.",
      "{pihak} overlooked a decisive tactical chance.",
      "A major opportunity went unused by {pihak}.",
    ],
    nilaiBlunder: [
      "A blunder. {san} changes the assessment drastically.",
      "A serious error — {lawan} now holds a decisive advantage.",
      "A costly blunder; {pihak}'s position collapses after {san}.",
    ],
    lebihKuat: [
      "Stronger was {saran}.",
      "The engine suggests {saran}.",
    ],
    seimbang: [
      "The position is balanced.",
      "The evaluation is close to zero; both sides have equal chances.",
      "Equilibrium is maintained.",
    ],
    unggulTipis: [
      "{unggul} holds a slight edge of about {nilai} pawn(s).",
      "A small advantage for {unggul} (+{nilai}).",
    ],
    unggulJelas: [
      "{unggul} holds a clear advantage: +{nilai}.",
      "The evaluation favours {unggul} by {nilai} pawns.",
    ],
    unggulMenang: [
      "{unggul} has a winning position (+{nilai}).",
      "{unggul}'s advantage is decisive: {nilai} pawns.",
    ],
    unggulMat: [
      "{unggul} has a forced mate in {mat}.",
      "There is mate in {mat} for {unggul}.",
    ],
    skakmat: [
      "Checkmate. {pihak} wins the game with {san}.",
      "The game is over — checkmate for {pihak}.",
      "Checkmate. {lawan}'s king has no escape.",
    ],
    pat: [
      "Stalemate: {lawan}'s king is not in check yet has no legal move. Draw.",
      "The game ends in a draw by stalemate.",
    ],
    remis: [
      "The game ends in a draw.",
      "Drawn; both sides share the point.",
    ],
    remisUlang: [
      "Draw by threefold repetition.",
      "The position has repeated three times — the game is drawn.",
    ],
    remisMaterial: [
      "Draw due to insufficient mating material.",
      "There is not enough material to deliver mate. Draw.",
    ],
    ajakEngine: [
      "Enable the engine to obtain move ratings and a position evaluation.",
      "Move-quality assessment is available when the engine is active.",
    ],
  },
};

/** komentator untuk halaman Teka-Teki — kunci aslinya tekaTeki.komentator.* */
export const komentatorTekaTeki = {
  santai: {
    mulaiSatu: [
      "New puzzle! {pihak} to move and mate in one. Find the finishing blow!",
      "Mate in one. {pihak} to play — one move locks {lawan}'s king. Spot it?",
    ],
    mulai: [
      "New puzzle: {pihak} to move, mate in {n}. Deep breath — look for forcing moves first.",
      "Mate in {n}. {pihak} to play — it usually starts with a check or a sacrifice. Go!",
      "{pihak} to move, {n} moves to mate. Watch {lawan}'s king: where are its escape squares?",
    ],
    mulaiSudah: [
      "You've solved this one before — remember the key?",
    ],
    benar: [
      "Correct! Now wait for {lawan}'s reply.",
      "Yes, that's it! Keep going, {lawan} will answer.",
      "Right! {lawan} is forced to respond — let's see the reply.",
    ],
    lawan: [
      "{lawan} replies. Your move again — {sisa} to go.",
      "{lawan}'s reply. Come on, {sisa} more move(s) to mate!",
    ],
    lawanTerakhir: [
      "{lawan} replies. Now the finishing blow — find the mate!",
      "One move left. {lawan}'s king is on the ropes!",
    ],
    salah: [
      "Not quite. Look for a truly forcing move — {lawan} must have no way out.",
      "Hmm, not that one. Try checking every check first.",
      "Nope. Remember, the solution has to force matters; quiet moves give {lawan} time.",
    ],
    salahSkak: [
      "Check, but {lawan}'s king still has {jalan} escape(s). Find a sharper check.",
      "Right idea — check! — but this one can still be parried. Another check?",
    ],
    salahTangkap: [
      "Taking the {korban} is tempting, but that's not the goal. Go for {lawan}'s king!",
      "Material isn't everything here — we're after checkmate, not a {korban}.",
    ],
    salahTerakhir: [
      "This is the last move: it must be mate, not just check.",
      "The final move has to be mate. Re-check every escape square.",
    ],
    ilegal: [
      "That move isn't allowed — maybe your king is in check or the piece is pinned.",
      "That's not legal. Check again: is {pihak}'s king safe after it?",
    ],
    petunjuk: [
      "Hint: the piece to move is the {bidak} on {dari}. Where should it go?",
      "Look at the {bidak} on {dari} — that's the key.",
    ],
    pengorbanan: [
      "Sacrifice! The {bidak} on {petak} is offered on purpose — take it and {lawan}'s king opens up.",
      "Whoa, the {bidak} is sacrificed on {petak}. Bold — and it's the key!",
    ],
    selesai: [
      "CHECKMATE! Puzzle solved — great job!",
      "Mate! {lawan}'s king has no escape. Solved!",
      "That's it — checkmate! Clean work.",
    ],
    selesaiTema: [
      "The pattern: {tema}. File it away — it comes up a lot.",
      "This puzzle's theme: {tema}. Once you know it, you'll spot it fast!",
    ],
    tinjau: [
      "Move {nomor} of the solution. See why {lawan} has no choice.",
      "Reviewing the solution — move {nomor}. Watch the escape squares get closed one by one.",
    ],
    engineMat: [
      "The engine sees mate in {mat} too.",
      "Engine confirms: mate in {mat}.",
    ],
  },
  formal: {
    mulaiSatu: [
      "New puzzle: {pihak} to move and mate in one.",
      "Mate in one. {pihak} to play.",
    ],
    mulai: [
      "New puzzle: {pihak} to move, mate in {n}. Begin with forcing moves.",
      "Mate in {n}. {pihak} to play; note {lawan}'s king's escape squares.",
      "{pihak} to move, {n} moves to checkmate.",
    ],
    mulaiSudah: [
      "You have solved this puzzle before.",
    ],
    benar: [
      "Correct. Awaiting {lawan}'s reply.",
      "The right move; {lawan} will respond.",
      "Correct. {lawan} is forced to respond.",
    ],
    lawan: [
      "{lawan} replies. {sisa} move(s) remaining.",
      "{lawan}'s reply. Your move; {sisa} more to mate.",
    ],
    lawanTerakhir: [
      "{lawan} replies. The next move must be checkmate.",
      "One move remains: find the checkmate.",
    ],
    salah: [
      "Incorrect. The solution must be forcing; {lawan} may have no defence.",
      "Not the solution. Review all available checks.",
      "Incorrect. A quiet move gives {lawan} time to defend.",
    ],
    salahSkak: [
      "Check, but {lawan}'s king still has {jalan} reply(ies). A more forcing check is required.",
      "The direction is right — check — but it can still be parried.",
    ],
    salahTangkap: [
      "Capturing the {korban} is tempting, but the objective is checkmate.",
      "Material gain is not the aim here; focus on {lawan}'s king.",
    ],
    salahTerakhir: [
      "The final move must deliver checkmate, not merely check.",
      "The closing move must be mate. Re-examine the king's escape squares.",
    ],
    ilegal: [
      "Illegal move — the king is likely in check or the piece is pinned.",
      "That move is not permitted. Ensure {pihak}'s king is safe afterwards.",
    ],
    petunjuk: [
      "Hint: move the {bidak} from {dari}.",
      "The key piece is the {bidak} on {dari}.",
    ],
    pengorbanan: [
      "A sacrifice: the {bidak} on {petak} is offered to expose {lawan}'s king.",
      "The {bidak} is sacrificed on {petak} — the key move of the combination.",
    ],
    selesai: [
      "Checkmate. Puzzle solved.",
      "Checkmate — {lawan}'s king has no escape.",
      "Solved by checkmate.",
    ],
    selesaiTema: [
      "Pattern used: {tema}.",
      "This puzzle's theme: {tema}.",
    ],
    tinjau: [
      "Solution review — move {nomor}.",
      "Move {nomor} of the solution; note how {lawan}'s options are restricted.",
    ],
    engineMat: [
      "The engine confirms mate in {mat}.",
      "Engine evaluation: mate in {mat}.",
    ],
  },
};

