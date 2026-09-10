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
  gayaGenZ: "Gen Z",
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
  genZ: {
    biasa: [
      "{pihak} goes with {san}. Still calm, no clip-worthy chaos yet.",
      "{san} from {pihak}. Okay, the plan is starting to show.",
      "The {bidak} lands on {petak}. Safety first, drama later.",
      "{pihak} plays {san}. Let the position cook for a minute.",
    ],
    buku: [
      "{san} is still {pembukaan} theory. Someone did the homework.",
      "This is the {pembukaan}, and {pihak} remembers the route with {san}.",
      "{san} stays in the {pembukaan} book. No wild improv yet.",
    ],
    tangkap: [
      "{pihak} takes the {korban} on {petak}. Someone lost their stuff.",
      "{san}, and the {korban} is gone. Does {lawan} have a reply?",
      "The {korban} on {petak} gets collected. Material business is open.",
    ],
    tangkapUntung: [
      "{pihak} trades up for the {korban} on {petak}. Actual material profit.",
      "{san} wins the {korban}. Free stuff is hard to decline.",
    ],
    tangkapMenteri: [
      "{lawan} loses the queen on {petak}. That is not a tiny slip, that is a disaster.",
      "{pihak} takes the queen on {petak}. {lawan} may need a miracle now.",
    ],
    skak: [
      "{san} gives check. {lawan} needs to move the king right now.",
      "Check from {pihak}. {lawan} has to cancel every other plan.",
      "{lawan} is in check. Pretending not to see it is not an option.",
    ],
    skakTambahan: [
      "It comes with check too. More trouble for {lawan}.",
      "Check included. One move, two problems for {lawan}.",
    ],
    skakSatuJalan: [
      "Only one legal reply. That menu is painfully short.",
    ],
    rokadePendek: [
      "{pihak} castles kingside. Safe king, active rook, good deal.",
      "Kingside castle. The {pihak} king finally puts on a seat belt.",
    ],
    rokadePanjang: [
      "{pihak} castles queenside. The attacking intent is obvious now.",
      "The {pihak} king heads queenside. This position is about to heat up.",
    ],
    enPassant: [
      "En passant! The rare rule finally gets screen time.",
      "{san} en passant. It is legal, even if it looks suspicious.",
    ],
    promosi: [
      "The {pihak} pawn promotes to a {bidak} on {petak}. Instant promotion at work.",
      "A new {bidak} appears on {petak}. The {pihak} pawn made it all the way.",
    ],
    lawanMenggantung: [
      "The {lawan} {bidak} on {petak} is hanging. Freebie detected.",
      "Look at {petak}. That {lawan} {bidak} is protected by good vibes only.",
    ],
    sendiriMenggantung: [
      "The {pihak} {bidak} on {petak} is hanging now. Material donation detected.",
      "Uh-oh, the {bidak} on {petak} was left behind. {lawan} definitely noticed.",
    ],
    paksa: [
      "That is the only legal move. Less of a choice, more of an order.",
      "{san} is forced. Every other option is closed.",
    ],
    nilaiBrilian: [
      "Brilliant! {san} looks reckless, but the calculation is clean.",
      "{san} is a top-tier sacrifice. Even the engine respects it.",
      "Brilliant move. The board went from quiet to highlight reel.",
    ],
    nilaiHebat: [
      "Great move! {pihak} found the answer that was easy to miss.",
      "{san} hits the mark. Tough moment, clean decision.",
      "Seriously good. {pihak} punished the position accurately.",
    ],
    nilaiTerbaik: [
      "{san} is best. The engine has no notes.",
      "Super accurate. {pihak} picked the top move here.",
      "Best move found. Clean, carry on.",
    ],
    nilaiUnggul: [
      "Strong move. Not number one, but the gap is tiny.",
      "{san} keeps the position healthy and easy to play.",
      "Good choice. The engine only has a minor suggestion.",
    ],
    nilaiLayak: [
      "{san} is fine. Something sharper existed, but the position is safe.",
      "Playable. Not special, not panic material.",
      "Solid enough, though the engine found a more ambitious choice.",
    ],
    nilaiKeliru: [
      "A slight miss. {lawan} gets some free breathing room.",
      "{san} is imprecise. Not awful, but the engine raised an eyebrow.",
      "The {pihak} edge shrinks a little. The alarm is only whispering.",
    ],
    nilaiKesalahan: [
      "That is a mistake. {lawan} just got an open invitation.",
      "{san} makes life hard for {pihak}. An unwanted plot twist.",
      "Momentum shifts to {lawan}. That move was expensive.",
    ],
    nilaiKelewat: [
      "Big chance missed. The tactic walked right past.",
      "{pihak} had a strong shot but skipped it. That hurts.",
      "The chance is gone. The engine is probably pointing at the screen.",
    ],
    nilaiBlunder: [
      "Blunder. {san} sends the evaluation down the stairs.",
      "Ouch, {lawan} just received a huge gift.",
      "{san} is a serious blunder. {pihak} enters hard mode instantly.",
    ],
    lebihKuat: [
      "{saran} was the tougher move.",
      "The engine wanted {saran}. The move played lacked bite.",
    ],
    seimbang: [
      "Still equal. Nobody gets to brag yet.",
      "The evaluation is near zero. This game belongs to anyone.",
      "Dead even. The drama has not picked a side.",
    ],
    unggulTipis: [
      "{unggul} is slightly better by about {nilai} pawns. Too early to flex.",
      "A small +{nilai} edge for {unggul}.",
    ],
    unggulJelas: [
      "{unggul} has a clear edge of about {nilai} pawns. The pressure is real.",
      "It is +{nilai} for {unggul}. More than just a feeling now.",
    ],
    unggulMenang: [
      "{unggul} is up {nilai} pawns. Just avoid making blunder content.",
      "{unggul} has a winning position. Keep the finish steady.",
    ],
    unggulMat: [
      "{unggul} has mate in {mat}. Just follow the route.",
      "Mate in {mat} for {unggul}. The other king is out of episodes.",
    ],
    skakmat: [
      "Checkmate! {pihak} closes it out cleanly.",
      "{san}, and that is it. The {lawan} king has nowhere to go.",
      "Mate! {pihak} wins, {lawan} gets a review session.",
    ],
    pat: [
      "Stalemate! A winning edge means nothing if the king gets boxed in like this.",
      "No legal move and no check. Draw, with one last plot twist.",
    ],
    remis: [
      "Draw. No winner, everyone keeps a little pride.",
      "Points shared. The game calls it right down the middle.",
    ],
    remisUlang: [
      "The position appeared three times. Draw by board replay.",
      "Same position three times, so the game is officially drawn.",
    ],
    remisMaterial: [
      "Not enough material to mate. Draw, no debate.",
      "There is no checkmating ammo left. Points shared.",
    ],
    ajakEngine: [
      "Turn on the engine to see whether that move cooked or got cooked.",
      "Want an honest rating? Enable the engine and let the numbers talk.",
    ],
  } ,
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
  genZ: {
    mulaiSatu: [
      "New puzzle, mate in one for {pihak}. Do not overthink the finish.",
      "{pihak} to move and mate in one. The {lawan} king is nearly logged out.",
    ],
    mulai: [
      "{pihak} has mate in {n}. Start with the most forcing move.",
      "Mate in {n} for {pihak}. Checks, captures, threats, start there.",
      "{pihak} to move, mate in {n}. Give the {lawan} king no air.",
    ],
    mulaiSudah: [
      "You solved this one before. Time to see if the memory is still online.",
    ],
    benar: [
      "Correct! Now wait for {lawan} to reply.",
      "That is the move. {lawan} is forced to answer.",
      "Exactly. {lawan} enters the route you prepared.",
    ],
    lawan: [
      "{lawan} replies. Only {sisa} moves left.",
      "Reply from {lawan}. {sisa} moves remain until mate.",
    ],
    lawanTerakhir: [
      "{lawan} replied. Now find the mating blow.",
      "One move left. Do not just check, end the game.",
    ],
    salah: [
      "Not quite. {lawan} still has an escape.",
      "Not that one. Check every forcing move first.",
      "That gives {lawan} too much time. Try again.",
    ],
    salahSkak: [
      "It is check, but {lawan} still has {jalan} escape route(s).",
      "That check lacks bite. The {lawan} king can still run.",
    ],
    salahTangkap: [
      "The {korban} is tempting, but the target is the {lawan} king.",
      "Material can wait. The assignment is mate, not winning the {korban}.",
    ],
    salahTerakhir: [
      "This is the last move. It must mate, not just move the king.",
      "The finish must be checkmate. Check the escape squares again.",
    ],
    ilegal: [
      "That move is illegal. Your king may still be under threat.",
      "Cannot play that. Make sure the {pihak} king stays safe.",
    ],
    petunjuk: [
      "Move the {bidak} from {dari}. You can find the rest.",
      "The key is the {bidak} on {dari}.",
    ],
    pengorbanan: [
      "The {bidak} on {petak} is deliberately sacrificed. Serious bait.",
      "Sacrifice on {petak}! If {lawan} takes it, the king opens up.",
    ],
    selesai: [
      "Checkmate! Puzzle done, and pretty clean too.",
      "Mate! The {lawan} king is officially out of squares.",
      "Finished with checkmate. Clean.",
    ],
    selesaiTema: [
      "The theme is {tema}. Save that pattern for next time.",
      "That was a {tema} pattern. It should be easier to spot now.",
    ],
    tinjau: [
      "This is move {nomor} of the solution. Watch {lawan} lose options.",
      "Reviewing move {nomor}. The king’s exits close one by one.",
    ],
    engineMat: [
      "The engine also sees mate in {mat}. Validation received.",
      "Engine confirms mate in {mat}.",
    ],
  } ,
};
