/**
*  sunfish.js
*  JavaScript port of Sunfish Python Chess Engine
*  @VERSION: sunfish 2023
*  https://github.com/foo123/sunfish.js
*
**/

/*
*  Sunfish  — © Thomas Ahle (https://github.com/thomasahle/sunfish), GPL-3.0.
*  Port JS  — © foo123 (https://github.com/foo123/sunfish.js), GPL-3.0.
*             salinan klasik (BUKAN varian sunfish_nnue), commit 27840ed.
*
*  Berkas ini adalah karya turunan dan TETAP berlisensi GPL-3.0. Teks lisensi:
*  https://www.gnu.org/licenses/gpl-3.0.txt — sumber modifikasi tersedia publik
*  di https://github.com/Delta-Polder-Indonesia/ChessClub.
*
*  ---------------------------------------------------------------------------
*  Modifikasi Komunitas Catur Indonesia (KCI). Setiap titik perubahan diberi
*  penanda komentar KCI di dalam berkas (cari: !KCI!):
*
*  1. Opsi UCI kustom lewat `setoption` (semua opsional; tanpa setoption engine
*     berperilaku persis seperti hulu):
*       QS / QS_A      — ambang quiescence search; QS besar mematikan QS
*                        (daun jadi stand-pat murni). Pada kedalaman >= 1
*                        ambangnya tidak pernah lebih ketat dari nilai hulu,
*                        jadi setelan ekstrem tidak bisa membuat engine
*                        kehabisan kandidat langkah.
*       Eval Noise     — sigma derau evaluasi dalam centipawn (0 = polos).
*       Material Only  — ratakan piece-square table jadi nilai bidak polos.
*       Tunnel Vision  — peluang 0..1 per giliran untuk menyaring kandidat
*                        langkah akar ke sekitar langkah terakhir lawan,
*                        tangkapan, dan skak saja.
*       Last Move      — petak tujuan langkah lawan terakhir (mis. "e5" atau
*                        "e7e5") untuk pemanggil yang hanya mengirim FEN.
*       Random Seed    — benih PRNG derau/terowongan (uji jadi dapat diulang).
*  2. `position fen <FEN> [moves ...]` — hulu hanya mengenal `startpos`,
*     sedangkan pembungkus UCI situs ini selalu mengirim FEN.
*  3. `go movetime <ms>` — batas waktu dinding selain `depth`, dan `go depth N`
*     kini benar-benar mencari sampai kedalaman N (hulu berhenti di kedalaman 1
*     ketika tidak ada batas waktu).
*  4. Di Web Worker, jeda antarbatch memakai `setTimeout` (bukan microtask),
*     supaya perintah `stop` benar-benar terbaca saat pencarian berjalan.
*
*  Kenapa: Stockfish Skill Level 0 masih setara ~1320 Elo, terlalu kuat untuk
*  level Beginner/Casual. Kesalahan yang otentik lahir dari PENILAIAN yang
*  rusak (konsisten, berkelanjutan), bukan dari pemilihan langkah acak di luar
*  engine — karena itu semua knob di atas bekerja di dalam evaluasi/pencarian.
*/
!function(root, name, factory) {
"use strict";
if ('object' === typeof exports)
    // CommonJS module
    module.exports = factory();
else if ('function' === typeof define && define.amd)
    // AMD. Register as an anonymous module.
    define(function(req) {return factory();});
else
    root[name] = factory();
}('undefined' !== typeof self ? self : this, 'sunfish', function(undef) {
"use strict";

// utils
function* count(start=0, step=1)
{
    //# count(10) → 10 11 12 13 14 ...
    //# count(2.5, 0.5) → 2.5 3.0 3.5 ...
    let n = start;
    while (true)
    {
        yield n;
        n += step;
    }
}
function* range(start, end=0, step=1)
{
    if (1 === arguments.length)
    {
        end = start;
        start = 0;
        step = 1;
    }
    const count = Math.floor((end-start)/step);
    let i = 0;
    while (i < count)
    {
        yield start + i*step;
        ++i;
    }
}
function islower(c)
{
    return c === c.toLowerCase() && c !== c.toUpperCase();
}
function isupper(c)
{
    return c === c.toUpperCase() && c !== c.toLowerCase();
}
const SPACE = /\s/;
function isspace(c)
{
    return SPACE.test(c);
}
function swapcase(s)
{
    return s.map(function(c) {return c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase();});
}
function sort_reverse(a, b)
{
    return b[0]-a[0];
}


//-------------------------------------------------------------------------------------------------
const sunfish = {version:"sunfish 2023"};

//###############################################################################
//# Piece-Square tables. Tune these to change sunfish's behaviour
//###############################################################################

//# With xz compression this whole section takes 652 bytes.
//# That's pretty good given we have 64*6 = 384 values.
//# Though probably we could do better...
//# For one thing, they could easily all fit into int8.
const piece = {"P": 100, "N": 280, "B": 320, "R": 479, "Q": 929, "K": 60000};
const pst = {
    'P': [   0,   0,   0,   0,   0,   0,   0,   0,
            78,  83,  86,  73, 102,  82,  85,  90,
             7,  29,  21,  44,  40,  31,  44,   7,
           -17,  16,  -2,  15,  14,   0,  15, -13,
           -26,   3,  10,   9,   6,   1,   0, -23,
           -22,   9,   5, -11, -10,  -2,   3, -19,
           -31,   8,  -7, -37, -36, -14,   3, -31,
             0,   0,   0,   0,   0,   0,   0,   0],
    'N': [ -66, -53, -75, -75, -10, -55, -58, -70,
            -3,  -6, 100, -36,   4,  62,  -4, -14,
            10,  67,   1,  74,  73,  27,  62,  -2,
            24,  24,  45,  37,  33,  41,  25,  17,
            -1,   5,  31,  21,  22,  35,   2,   0,
           -18,  10,  13,  22,  18,  15,  11, -14,
           -23, -15,   2,   0,   2,   0, -23, -20,
           -74, -23, -26, -24, -19, -35, -22, -69],
    'B': [ -59, -78, -82, -76, -23,-107, -37, -50,
           -11,  20,  35, -42, -39,  31,   2, -22,
            -9,  39, -32,  41,  52, -10,  28, -14,
            25,  17,  20,  34,  26,  25,  15,  10,
            13,  10,  17,  23,  17,  16,   0,   7,
            14,  25,  24,  15,   8,  25,  20,  15,
            19,  20,  11,   6,   7,   6,  20,  16,
            -7,   2, -15, -12, -14, -15, -10, -10],
    'R': [  35,  29,  33,   4,  37,  33,  56,  50,
            55,  29,  56,  67,  55,  62,  34,  60,
            19,  35,  28,  33,  45,  27,  25,  15,
             0,   5,  16,  13,  18,  -4,  -9,  -6,
           -28, -35, -16, -21, -13, -29, -46, -30,
           -42, -28, -42, -25, -25, -35, -26, -46,
           -53, -38, -31, -26, -29, -43, -44, -53,
           -30, -24, -18,   5,  -2, -18, -31, -32],
    'Q': [   6,   1,  -8,-104,  69,  24,  88,  26,
            14,  32,  60, -10,  20,  76,  57,  24,
            -2,  43,  32,  60,  72,  63,  43,   2,
             1, -16,  22,  17,  25,  20, -13,  -6,
           -14, -15,  -2,  -5,  -1, -10, -20, -22,
           -30,  -6, -13, -11, -16, -11, -16, -27,
           -36, -18,   0, -19, -15, -15, -21, -38,
           -39, -30, -31, -13, -31, -36, -34, -42],
    'K': [   4,  54,  47, -99, -99,  60,  83, -62,
           -32,  10,  55,  56,  56,  55,  10,   3,
           -62,  12, -57,  44, -67,  28,  37, -31,
           -55,  50,  11,  -4, -19,  13,   0, -49,
           -55, -43, -52, -28, -51, -47,  -8, -50,
           -47, -42, -43, -79, -64, -32, -29, -32,
            -4,   3, -14, -50, -57, -18,  13,   4,
            17,  30,  -3, -14,   6,  -1,  40,  18],
};

//# Pad tables and join piece and pst dictionaries
Object.keys(pst).forEach(function(k) {
    let table = pst[k];
    let padrow = function(row) {return [0].concat(row.map(function(x) {return x + piece[k];})).concat([0]);};
    let t = [], pad = Array(20).fill(0);
    for (let i of range(8)) t = t.concat(padrow(table.slice(i * 8, i * 8 + 8)));
    pst[k] = pad.concat(t).concat(pad);
});

//###############################################################################
//# Global constants
//###############################################################################

//# Our board is represented as a 120 character string. The padding allows for
//# fast detection of moves that don't stay within the board.
const A1 = 91, H1 = 98, A8 = 21, H8 = 28;
const initial = [
     "         \n"  //#   0 -  9
    ,"         \n"  //#  10 - 19
    ," rnbqkbnr\n"  //#  20 - 29
    ," pppppppp\n"  //#  30 - 39
    ," ........\n"  //#  40 - 49
    ," ........\n"  //#  50 - 59
    ," ........\n"  //#  60 - 69
    ," ........\n"  //#  70 - 79
    ," PPPPPPPP\n"  //#  80 - 89
    ," RNBQKBNR\n"  //#  90 - 99
    ,"         \n"  //# 100 -109
    ,"         \n"  //# 110 -119
].join('');

//# Lists of possible moves for each piece type.
const N = -10, E = 1, S = 10, W = -1;
const directions = {
    "P": [N, N+N, N+W, N+E],
    "N": [N+N+E, E+N+E, E+S+E, S+S+E, S+S+W, W+S+W, W+N+W, N+N+W],
    "B": [N+E, S+E, S+W, N+W],
    "R": [N, E, S, W],
    "Q": [N, E, S, W, N+E, S+E, S+W, N+W],
    "K": [N, E, S, W, N+E, S+E, S+W, N+W]
};

//# Mate value must be greater than 8*queen + 2*(rook+knight+bishop)
//# King value is set to twice this value such that if the opponent is
//# 8 queens up, but we got the king, we still exceed MATE_VALUE.
//# When a MATE is detected, we'll set the score to MATE_UPPER - plies to get there
//# E.g. Mate in 3 will be MATE_UPPER - 6
const MATE_LOWER = piece["K"] - 10 * piece["Q"], MATE_UPPER = piece["K"] + 10 * piece["Q"];

//# Constants for tuning search
/*!KCI!*/ // QS dan QS_A jadi `let` supaya bisa diubah runtime lewat setoption.
let QS = 40, QS_A = 140;
const EVAL_ROUGHNESS = 15;

/*!KCI!*/
//###############################################################################
//# Knob "pembodohan" KCI — semua netral (nol/false) secara bawaan
//###############################################################################

const QS_BAWAAN = QS, QS_A_BAWAAN = QS_A;

//# sigma derau evaluasi (centipawn), peluang tunnel vision (0..1), benih PRNG
let DERAU_SIGMA = 0, PELUANG_TEROWONGAN = 0, BENIH = 1;

//# Tabel piece-square versi asli dan versi "materi saja" (semua petak bernilai
//# sama dengan nilai bidaknya), disiapkan sekali lalu ditukar saat dibutuhkan.
const PST_ASLI = {}, PST_MATERI = {};
Object.keys(pst).forEach(function(k) {
    PST_ASLI[k] = pst[k];
    const pad = Array(20).fill(0);
    let t = [];
    for (let i of range(8)) t = t.concat([0].concat(Array(8).fill(piece[k])).concat([0]));
    PST_MATERI[k] = pad.concat(t).concat(pad);
});
function aturMateriSaja(aktif)
{
    Object.keys(pst).forEach(function(k) {pst[k] = aktif ? PST_MATERI[k] : PST_ASLI[k];});
}

//# Pengacak deterministik: derau harus SAMA untuk posisi+langkah yang sama,
//# supaya kesalahan engine konsisten (bukan berkedip antarpencarian).
function campur32(x)
{
    x = (x ^ 61) ^ (x >>> 16);
    x = (x + (x << 3)) | 0;
    x = x ^ (x >>> 4);
    x = Math.imul(x, 0x27d4eb2d);
    x = x ^ (x >>> 15);
    return x >>> 0;
}
function fnv1a(teks)
{
    let h = 0x811c9dc5;
    for (let i = 0; i < teks.length; ++i)
    {
        h ^= teks.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}
function derauLangkah(pos, i, j, prom)
{
    //# Rata-rata dua sampel seragam => distribusi segitiga: kesalahan kecil
    //# sering, kesalahan besar jarang — lebih mirip pemula daripada seragam.
    const k = campur32(
        pos.hash() ^ Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(j + 1, 0x85ebca6b)
        ^ (prom ? prom.charCodeAt(0) : 0) ^ BENIH
    );
    const u = (((k & 0xffff) / 0x10000) + ((k >>> 16) / 0x10000)) / 2;
    return Math.round((2 * u - 1) * DERAU_SIGMA);
}

//# PRNG terpisah untuk keputusan per giliran (tunnel vision).
let ACAK_KEADAAN = 1;
function acakBerikut()
{
    ACAK_KEADAAN = campur32(ACAK_KEADAAN + 0x6d2b79f5);
    return ACAK_KEADAAN / 4294967296;
}

//# Jarak petak pada papan 120 karakter (Chebyshev), dipakai tunnel vision.
function jarakPetak(a, b)
{
    const barisA = Math.floor(a / 10), barisB = Math.floor(b / 10);
    return Math.max(Math.abs(barisA - barisB), Math.abs((a - barisA * 10) - (b - barisB * 10)));
}
//# Apakah langkah ini memberi skak? Sunfish engine tangkap-raja: setelah
//# langkah dijalankan, cek apakah kita bisa memakan raja lawan.
function memberiSkak(pos, move)
{
    const balik = pos.move(move).rotate(true);
    for (let m of balik.gen_moves())
    {
        if ("k" === balik.board.charAt(m.j)) return true;
    }
    return false;
}
/**
 * Saringan "pemula tidak melihat sisi papan lain": hanya langkah di sekitar
 * langkah terakhir lawan, tangkapan, dan skak yang dipertimbangkan.
 */
function buatSaringTerowongan(pusat)
{
    return function(pos, move) {
        if (islower(pos.board.charAt(move.j))) return true;
        if (2 >= jarakPetak(move.j, pusat) || 2 >= jarakPetak(move.i, pusat)) return true;
        return memberiSkak(pos, move);
    };
}

/*const opt_ranges = {
    'QS': [0, 300],
    'QS_A': [0, 300],
    'EVAL_ROUGHNESS': [0, 50]
};*/


//###############################################################################
//# Chess logic
//###############################################################################

function Move(i, j, prom)
{
    const self = this;
    self.i = i;
    self.j = j;
    self.prom = prom;
}
Move.prototype = {
    constructor: Move,
    i: null,
    j: null,
    prom: null
};

function put(board, i, p)
{
    return board.slice(0, i) + p + board.slice(i + 1);
}

function Position(board, score, wc, bc, ep, kp)
{
    //"""A state of a chess game
    //board -- a 120 char representation of the board
    //score -- the board evaluation
    //wc -- the castling rights, [west/queen side, east/king side]
    //bc -- the opponent castling rights, [west/king side, east/queen side]
    //ep - the en passant square
    //kp - the king passant square
    //"""
    const self = this;
    self.board = board;
    self.score = score;
    self.wc = wc;
    self.bc = bc;
    self.ep = ep;
    self.kp = kp;
}
Position.prototype = {
    constructor: Position,
    board: null,
    score: null,
    wc: null,
    bc: null,
    ep: null,
    kp: null,
    _str: null,
    _hash: null,/*!KCI!*/
    toString: function() {
        const self = this;
        if (null == self._str) self._str = self.board+/*','+String(self.score)+*/','+String(self.ep)+','+String(self.kp)+','+(self.wc.map(String).join(','))+','+(self.bc.map(String).join(','));
        return self._str;
    },
    /*!KCI!*/
    //# Sidik jari papan untuk derau evaluasi; dihitung sekali per posisi.
    hash: function() {
        const self = this;
        if (null == self._hash) self._hash = fnv1a(self.board);
        return self._hash;
    },
    gen_moves: function*() {
        //# For each of our pieces, iterate through each possible 'ray' of moves,
        //# as defined in the 'directions' map. The rays are broken e.g. by
        //# captures or immediately in case of pieces such as knights.
        const self = this;
        for (let i of range(self.board.length))
        {
            let p = self.board.charAt(i);
            if (!isupper(p))
            {
                continue;
            }
            for (let d of directions[p])
            {
                for (let j of count(i + d, d))
                {
                    let q = self.board.charAt(j);
                    //# Stay inside the board, and off friendly pieces
                    if (isspace(q) || isupper(q))
                    {
                        break;
                    }
                    //# Pawn move, double move and capture
                    if (p === "P")
                    {
                        if (-1 < [N, N + N].indexOf(d) && q !== ".")
                        {
                            break;
                        }
                        if (d === N + N && (i < A1 + N || self.board.charAt(i + N) !== "."))
                        {
                            break;
                        }
                        if (
                            -1 < [N + W, N + E].indexOf(d)
                            && q === "."
                            && -1 === [self.ep, self.kp, self.kp - 1, self.kp + 1].indexOf(j)
                            //#and j != self.ep and abs(j - self.kp) >= 2
                        )
                        {
                            break;
                        }
                        //# If we move to the last row, we can be anything
                        if (A8 <= j && j <= H8)
                        {
                            for (let prom of ["N","B","R","Q"])
                            {
                                yield new Move(i, j, prom);
                            }
                            break;
                        }
                    }
                    //# Move it
                    yield new Move(i, j, "");
                    //# Stop crawlers from sliding, and sliding after captures
                    if (-1 < "PNK".indexOf(p) || islower(q))
                    {
                        break;
                    }
                    //# Castling, by sliding the rook next to the king
                    if (i === A1 && self.board.charAt(j + E) === "K" && self.wc[0])
                    {
                        yield new Move(j + E, j + W, "");
                    }
                    if (i === H1 && self.board.charAt(j + W) === "K" && self.wc[1])
                    {
                        yield new Move(j + W, j + E, "");
                    }
                }
            }
        }
    },
    rotate: function(nullmove=false) {
        //"""Rotates the board, preserving enpassant, unless nullmove"""
        const self = this;
        return new Position(
            swapcase(self.board.split('').reverse()).join(''), -self.score, self.bc, self.wc,
            self.ep && !nullmove ? 119 - self.ep : 0,
            self.kp && !nullmove ? 119 - self.kp : 0
        );
    },
    move: function(move) {
        const self = this;
        let {i, j, prom} = move;
        let p = self.board.charAt(i);
        let q = self.board.charAt(j);
        //# Copy variables and reset ep and kp
        let board = self.board;
        let wc = self.wc, bc = self.bc, ep = 0, kp = 0;
        let score = self.score + self.value(move);
        //# Actual move
        board = put(board, j, board.charAt(i));
        board = put(board, i, ".");
        //# Castling rights, we move the rook or capture the opponent's
        if (i === A1) wc = [false, wc[1]];
        if (i === H1) wc = [wc[0], false];
        if (j === A8) bc = [bc[0], false];
        if (j === H8) bc = [false, bc[1]];
        //# Castling
        if (p === "K")
        {
            wc = [false, false];
            if (Math.abs(j - i) === 2)
            {
                kp = (i + j) >>> 1;
                board = put(board, j < i ? A1 : H1, ".");
                board = put(board, kp, "R");
            }
        }
        //# Pawn promotion, double move and en passant capture
        if (p === "P")
        {
            if (A8 <= j && j <= H8)
            {
                board = put(board, j, prom);
            }
            if (j - i === 2 * N)
            {
                ep = i + N;
            }
            if (j === self.ep)
            {
                board = put(board, j + S, ".");
            }
        }
        //# We rotate the returned position, so it's ready for the next player
        return (new Position(board, score, wc, bc, ep, kp)).rotate();
    },
    value: function(move) {
        const self = this;
        let {i, j, prom} = move;
        let p = self.board.charAt(i);
        let q = self.board.charAt(j);
        //# Actual move
        let score = pst[p][j] - pst[p][i];
        //# Capture
        if (islower(q))
        {
            score += pst[q.toUpperCase()][119 - j];
        }
        //# Castling check detection
        if (Math.abs(j - self.kp) < 2)
        {
            score += pst["K"][119 - j];
        }
        //# Castling
        if (p === "K" && Math.abs(i - j) === 2)
        {
            score += pst["R"][(i + j) >>> 1];
            score -= pst["R"][j < i  ? A1 : H1];
        }
        //# Special pawn stuff
        if (p === "P")
        {
            if (A8 <= j && j <= H8)
            {
                score += pst[prom][j] - pst["P"][j];
            }
            if (j === self.ep)
            {
                score += pst["P"][119 - (j + S)];
            }
        }
        /*!KCI!*/
        //# Derau evaluasi disuntikkan di sini — bukan di pemilihan langkah.
        //# Karena skor posisi bersifat inkremental (pos.score += value(move)),
        //# satu titik ini merusak penilaian engine secara konsisten: langkah
        //# yang sama pada posisi yang sama selalu dinilai keliru dengan cara
        //# yang sama, persis seperti pemula yang salah paham berulang kali.
        if (0 < DERAU_SIGMA) score += derauLangkah(self, i, j, prom);
        return score;
    }
};

//###############################################################################
//# Search logic
//###############################################################################

//# lower <= s(pos) <= upper
function Entry(lower, upper)
{
    const self = this;
    self.lower = lower;
    self.upper = upper;
}
Entry.prototype = {
    constructor: Entry,
    lower: null,
    upper: null
};


function Searcher()
{
    const self = this;
    self.tp_score = {};
    self.tp_move = {};
    self.history = new Set([]);
    self.nodes = 0
}
Searcher.prototype = {
    constructor: Searcher,
    tp_score: null,
    tp_move: null,
    history: null,
    nodes: 0,
    saringAkar: null,/*!KCI!*/ // saringan tunnel vision, hanya di posisi akar
    kunciAkar: null,/*!KCI!*/
    bound: function(pos, gamma, depth, can_null=true) {
        const self = this;
        //""" Let s* be the "true" score of the sub-tree we are searching.
        //    The method returns r, where
        //    if gamma >  s* then s* <= r < gamma  (A better upper bound)
        //    if gamma <= s* then gamma <= r <= s* (A better lower bound) """
        self.nodes += 1;

        //# Depth <= 0 is QSearch. Here any position is searched as deeply as is needed for
        //# calmness, and from this point on there is no difference in behaviour depending on
        //# depth, so so there is no reason to keep different depths in the transposition table.
        depth = Math.max(depth, 0);

        //# Sunfish is a king-capture engine, so we should always check if we
        //# still have a king. Notice since this is the only termination check,
        //# the remaining code has to be comfortable with being mated, stalemated
        //# or able to capture the opponent king.
        if (pos.score <= -MATE_LOWER)
        {
            return -MATE_UPPER;
        }

        //# Look in the table if we have already searched this position before.
        //# We also need to be sure, that the stored search was over the same
        //# nodes as the current search.
        let pos_key = pos.toString();
        let key = pos_key+','+String(depth)+','+String(can_null);
        let entry = self.tp_score[key] || (new Entry(-MATE_UPPER, MATE_UPPER));
        if (entry.lower >= gamma) return entry.lower;
        if (entry.upper < gamma) return entry.upper;

        //# Let's not repeat positions. We don't chat
        //# - at the root (can_null=False) since it is in history, but not a draw.
        //# - at depth=0, since it would be expensive and break "futulity pruning".
        if (can_null && depth > 0 && self.history.has(pos_key))
        {
            return 0;
        }

        //# Generator of moves to search in order.
        //# This allows us to define the moves, but only calculate them if needed.
        /*!KCI!*/
        //# Tunnel vision hanya berlaku di posisi akar: yang dibatasi adalah
        //# apa yang "dilihat" pemain saat gilirannya, bukan seluruh pohon.
        const saring = self.saringAkar && pos_key === self.kunciAkar ? self.saringAkar : null;

        function* moves()
        {
            //# First try not moving at all. We only do this if there is at least one major
            //# piece left on the board, since otherwise zugzwangs are too dangerous.
            //# FIXME: We also can't null move if we can capture the opponent king.
            //# Since if we do, we won't spot illegal moves that could lead to stalemate.
            //# For now we just solve this by not using null-move in very unbalanced positions.
            //# TODO: We could actually use null-move in QS as well. Not sure it would be very useful.
            //# But still.... We just have to move stand-pat to be before null-move.
            //#if depth > 2 and can_null and any(c in pos.board for c in "RBNQ"):
            //#if depth > 2 and can_null and any(c in pos.board for c in "RBNQ") and abs(pos.score) < 500:
            if (depth > 2 && can_null && Math.abs(pos.score) < 500)
            {
                yield [null, -self.bound(pos.rotate(true), 1 - gamma, depth - 3)];
            }

            //# For QSearch we have a different kind of null-move, namely we can just stop
            //# and not capture anything else.
            if (depth === 0)
            {
                yield [null, pos.score];
            }

            //# Look for the strongest ove from last time, the hash-move.
            let killer = self.tp_move[pos_key];

            //# If there isn't one, try to find one with a more shallow search.
            //# This is known as Internal Iterative Deepening (IID). We set
            //# can_null=True, since we want to make sure we actually find a move.
            if (!killer && depth > 2)
            {
                self.bound(pos, gamma, depth - 3, false);
                killer = self.tp_move[pos_key];
            }

            //# If depth == 0 we only try moves with high intrinsic score (captures and
            //# promotions). Otherwise we do all moves. This is called quiescent search.
            /*!KCI!*/
            //# Ambang QS dinaikkan sebesar sigma derau: tanpa itu sebuah
            //# langkah tenang bisa lolos ke quiescence hanya karena derau,
            //# dan rantai langkah bolak-balik membuat QS tidak pernah selesai
            //# (RangeError: Maximum call stack size exceeded).
            let val_lower = QS - depth * QS_A + (0 === depth ? DERAU_SIGMA : 0);
            //# Ambang yang dinaikkan hanya boleh mematikan quiescence (depth 0).
            //# Pada kedalaman sungguhan ambangnya tidak pernah lebih ketat dari
            //# nilai hulu, supaya setelan QS ekstrem tidak pernah menyaring
            //# HABIS semua langkah dan membuat engine menjawab "(none)".
            if (0 < depth) val_lower = Math.min(val_lower, QS_BAWAAN - depth * QS_A_BAWAAN);

            //# Only play the move if it would be included at the current val-limit,
            //# since otherwise we'd get search instability.
            //# We will search it again in the main loop below, but the tp will fix
            //# things for us.
            if (killer && pos.value(killer) >= val_lower && (!saring || saring(pos, killer))/*!KCI!*/)
            {
                yield [killer, -self.bound(pos.move(killer), 1 - gamma, depth - 1)];
            }

            //# Then all the other moves
            let _moves = [];
            for (let m of pos.gen_moves()) _moves.push([pos.value(m), m]);
            /*!KCI!*/
            //# Saringan dilepas bila tidak menyisakan langkah apa pun —
            //# engine harus tetap punya sesuatu untuk dimainkan.
            if (saring)
            {
                const tersaring = _moves.filter(function(par) {return saring(pos, par[1]);});
                if (tersaring.length) _moves = tersaring;
            }
            _moves.sort(sort_reverse);
            for (let [val, move] of _moves)
            {
                //# Quiescent search
                if (val < val_lower)
                {
                    break;
                }

                //# If the new score is less than gamma, the opponent will for sure just
                //# stand pat, since ""pos.score + val < gamma === -(pos.score + val) >= 1-gamma""
                //# This is known as futility pruning.
                if (depth <= 1 && pos.score + val < gamma)
                {
                    //# Need special case for MATE, since it would normally be caught
                    //# before standing pat.
                    yield [move, pos.score + (val < MATE_LOWER ? val : MATE_UPPER)];
                    //# We can also break, since we have ordered the moves by value,
                    //# so it can't get any better than this.
                    break;
                }

                yield [move, -self.bound(pos.move(move), 1 - gamma, depth - 1)];
            }
        }

        //# Run through the moves, shortcutting when possible
        let best = -MATE_UPPER;
        let tp_move = self.tp_move[pos_key];/*!ADDED!*/
        for (let [move, score] of moves())
        {
            best = Math.max(best, score);
            if (best >= gamma || !tp_move/*!ADDED!*/)
            {
                //# Save the move for pv construction and killer heuristic
                if (null != move)
                {
                    self.tp_move[pos_key] = move;
                    tp_move = move;/*!ADDED!*/
                }
                if (best >= gamma) break;
            }
        }

        //# Stalemate checking is a bit tricky: Say we failed low, because
        //# we can't (legally) move and so the (real) score is -infty.
        //# At the next depth we are allowed to just return r, -infty <= r < gamma,
        //# which is normally fine.
        //# However, what if gamma = -10 and we don't have any legal moves?
        //# Then the score is actaully a draw and we should fail high!
        //# Thus, if best < gamma and best < 0 we need to double check what we are doing.

        //# We will fix this problem another way: We add the requirement to bound, that
        //# it always returns MATE_UPPER if the king is capturable. Even if another move
        //# was also sufficient to go above gamma. If we see this value we know we are either
        //# mate, or stalemate. It then suffices to check whether we're in check.

        //# Note that at low depths, this may not actually be true, since maybe we just pruned
        //# all the legal moves. So sunfish may report "mate", but then after more search
        //# realize it's not a mate after all. That's fair.

        //# This is too expensive to test at depth == 0
        if (depth > 2 && best === -MATE_UPPER)
        {
            let flipped = pos.rotate(true);
            //# Hopefully this is already in the TT because of null-move
            let in_check = self.bound(flipped, MATE_UPPER, 0) === MATE_UPPER;
            best = in_check ? -MATE_LOWER : 0;
        }

        //# Table part 2
        if (best >= gamma)
            self.tp_score[key] = new Entry(best, entry.upper);
        if (best < gamma)
            self.tp_score[key] = new Entry(entry.lower, best);

        return best;
    },
    search: function*(history, maxDepth=999/*!ADDED!*/) {
        const self = this;
        //"""Iterative deepening MTD-bi search"""
        maxDepth = Math.max(1, maxDepth); /*!ADDED!*/
        self.nodes = 0;
        self.history = new Set(history.map(function(pos) {return pos.toString();}));
        self.tp_score = {};
        self.kunciAkar = history[history.length-1].toString();/*!KCI!*/

        let gamma = 0;
        //# In finished games, we could potentially go far enough to cause a recursion
        //# limit exception. Hence we bound the ply. We also can't start at 0, since
        //# that's quiscent search, and we don't always play legal moves there.
        for (let depth of range(1, maxDepth+1/*!ADDED!*/))
        {
            //# The inner loop is a binary search on the score of the position.
            //# Inv: lower <= score <= upper
            //# 'while lower != upper' would work, but it's too much effort to spend
            //# on what's probably not going to change the move played.
            let lower = -MATE_LOWER, upper = MATE_LOWER;
            while (lower < upper - EVAL_ROUGHNESS)
            {
                let score = self.bound(history[history.length-1], gamma, depth, false);
                if (score >= gamma)
                {
                    lower = score;
                }
                if (score < gamma)
                {
                    upper = score;
                }
                yield [depth, gamma, score, self.tp_move[history[history.length-1].toString()]];
                gamma = Math.floor((lower + upper + 1) / 2);
            }
        }
        yield [maxDepth+1, 0, 0, null];/*!ADDED!*/ // signal that maxdepth exceeded
    }
};


//###############################################################################
//# UCI User interface
//###############################################################################

function parse(c)
{
    const fil = c.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(c.charAt(1), 10) - 1;
    return A1 + fil - 10 * rank;
}

function render(i)
{
    const rank = Math.floor((i - A1) / 10);
    const fil = /*(A1 > i ? 10 : 0) + ((i - A1) % 10)*/i - A1 - rank*10;
    return String.fromCharCode(fil + 'a'.charCodeAt(0)) + String(-rank + 1);
}

const startpos = new Position(initial, 0, [true, true], [true, true], 0, 0);
let hist = [startpos];

/*!KCI!*/
//# Giliran dilacak eksplisit (hulu menyimpulkannya dari panjang `hist`, yang
//# tidak berlaku lagi begitu posisi bisa dimulai dari FEN mana pun).
let giliranHitam = false;
//# Petak tujuan langkah lawan terakhir, dasar saringan tunnel vision. Diisi
//# dari daftar `moves` pada perintah position; bila pemanggil hanya mengirim
//# FEN telanjang, petaknya boleh diberitahukan lewat `setoption name Last Move`.
let terakhirLawanKe = null;
let opsiLangkahLawan = "";

/*!KCI!*/
/** Ubah FEN jadi Position sunfish (papan 120 karakter, sisi jalan di bawah). */
function posisiDariFen(fen)
{
    const bagian = String(fen).trim().split(/\s+/);
    const barisFen = (bagian[0] || '').split('/');
    if (8 !== barisFen.length) return null;
    let papan = "         \n" + "         \n";
    for (let b of barisFen)
    {
        let teks = '';
        for (let c of b.split(''))
        {
            if (/[1-8]/.test(c)) teks += '.'.repeat(parseInt(c, 10));
            else if (-1 < "pnbrqkPNBRQK".indexOf(c)) teks += c;
            else return null;
        }
        if (8 !== teks.length) return null;
        papan += ' ' + teks + '\n';
    }
    papan += "         \n" + "         \n";
    const rokade = bagian[2] || '-';
    //# wc = hak pihak yang di bawah [sisi menteri, sisi raja];
    //# bc = hak lawan dalam kerangkanya sendiri [sisi raja, sisi menteri].
    const wc = [-1 < rokade.indexOf('Q'), -1 < rokade.indexOf('K')];
    const bc = [-1 < rokade.indexOf('k'), -1 < rokade.indexOf('q')];
    const epTeks = bagian[3] || '-';
    const ep = '-' === epTeks || 2 > epTeks.length ? 0 : parse(epTeks);
    let skor = 0;
    for (let i = 0; i < papan.length; ++i)
    {
        const p = papan.charAt(i);
        if (isupper(p)) skor += pst[p][i];
        else if (islower(p)) skor -= pst[p.toUpperCase()][119 - i];
    }
    const pos = new Position(papan, skor, wc, bc, ep, 0);
    return 'b' === (bagian[1] || 'w') ? pos.rotate() : pos;
}

/*!ADDED!*/
const isNode = ("undefined" !== typeof global) && ('[object global]' === {}.toString.call(global));
const isWebWorker = !isNode && ("undefined" !== typeof WorkerGlobalScope) && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator);
/*!ADDED!*/
const perf = isNode ? require('node:perf_hooks').performance : performance;
/*!KCI!*/
//# Di worker, jeda antarbatch memakai makrotask supaya antrean pesan sempat
//# terbaca — dengan microtask, perintah `stop` baru terbaca setelah pencarian
//# selesai sehingga pembatalan pencarian tidak pernah bekerja.
const nextTick = isWebWorker ? function(then) {setTimeout(then, 0);} : function(then) {then();};

let STOPPED = false; /*!ADDED!*/

/*!KCI!*/
/**
 * Opsi UCI kustom. Nama yang tidak dikenal (Hash, Threads, Skill Level, ...)
 * sengaja diabaikan diam-diam supaya pembungkus UCI yang sama bisa dipakai
 * untuk Stockfish maupun engine ini.
 */
function aturOpsi(nama, nilai)
{
    const kunci = nama.toLowerCase();
    const angka = parseFloat(nilai);
    const nyala = /^(true|1|on|yes)$/i.test(nilai);
    if ("qs" === kunci) QS = isFinite(angka) ? angka : QS_BAWAAN;
    else if ("qs_a" === kunci) QS_A = isFinite(angka) ? angka : QS_A_BAWAAN;
    else if ("eval noise" === kunci) DERAU_SIGMA = isFinite(angka) ? Math.max(0, angka) : 0;
    else if ("material only" === kunci) aturMateriSaja(nyala);
    else if ("tunnel vision" === kunci) PELUANG_TEROWONGAN = isFinite(angka) ? Math.min(1, Math.max(0, angka)) : 0;
    else if ("last move" === kunci) opsiLangkahLawan = /^[a-h][1-8]$/.test(nilai.slice(-2)) ? nilai.slice(-2) : "";
    else if ("random seed" === kunci)
    {
        BENIH = isFinite(angka) ? (angka >>> 0) : 1;
        ACAK_KEADAAN = BENIH || 1;
    }
}

sunfish.Move = Move;
sunfish.Position = Position;
sunfish.Entry = Entry;
sunfish.Searcher = Searcher;
sunfish.engine = function(cmd, output=null) {
    const args = String(cmd).split(/\s+/g);
    const out = [];
    const defaultOutput = (msg) => {out.push(msg);};
    if (!output) output = defaultOutput;

    if (args[0] === "uci")
    {
        output("id name " + sunfish.version);
        output("uciok");
    }

    else if (args[0] === "ucinewgame")
    {
    }

    else if (args[0] === "isready")
    {
        output("readyok");
    }

    else if (args[0] === "quit")
    {
        STOPPED = true;
    }

    /*!KCI!*/
    else if (args[0] === "setoption")
    {
        const cocok = String(cmd).trim().match(/^setoption\s+name\s+(.+?)(?:\s+value\s+(.*))?$/i);
        if (cocok) aturOpsi(cocok[1].trim(), (cocok[2] || '').trim());
    }

    /*!KCI!*/ // `position fen ...` ditambahkan; `position startpos ...` tetap sama.
    else if (args[0] === "position" && (args[1] === "startpos" || args[1] === "fen"))
    {
        const batasLangkah = args.indexOf("moves");
        const moves = -1 < batasLangkah ? args.slice(batasLangkah + 1) : [];
        if (args[1] === "startpos")
        {
            hist = [startpos];
            giliranHitam = false;
        }
        else
        {
            const pos = posisiDariFen(args.slice(2, -1 < batasLangkah ? batasLangkah : args.length).join(' '));
            if (!pos) return output === defaultOutput ? out.join("\n") : undefined;
            hist = [pos];
            giliranHitam = 'b' === args[3];
        }
        terakhirLawanKe = null;
        for (let move of moves)
        {
            if (move.length >= 4)
            {
                let i = parse(move.slice(0,2)), j = parse(move.slice(2,4)), prom = move.slice(4).toUpperCase();
                if (giliranHitam)
                {
                    i = 119 - i;
                    j = 119 - j;
                }
                hist.push(hist[hist.length-1].move(new Move(i, j, prom)));
                giliranHitam = !giliranHitam;
                //# Setelah papan diputar, tujuan langkah lawan ada di 119 - j.
                terakhirLawanKe = 119 - j;
            }
        }
    }

    else if (args[0] === "go")
    {
        STOPPED = false;
        /*!ADDED!*/
        let wtime = Infinity, winc = 0, btime = Infinity, binc = 0, maxdepth = 999;
        let movetime = Infinity, batasDepth = false;/*!KCI!*/
        let i = 1;
        while (i < args.length)
        {
            switch (args[i])
            {
                case 'depth':
                if (i+1 < args.length) {maxdepth = parseInt(args[i+1]); batasDepth = true;/*!KCI!*/}
                i += 2;
                break;
                /*!KCI!*/
                case 'movetime':
                if (i+1 < args.length) movetime = parseInt(args[i+1]);
                i += 2;
                break;
                case 'wtime':
                if (i+1 < args.length) wtime = parseInt(args[i+1]);
                i += 2;
                break;
                case 'btime':
                if (i+1 < args.length) btime = parseInt(args[i+1]);
                i += 2;
                break;
                case 'winc':
                if (i+1 < args.length) winc = parseInt(args[i+1]);
                i += 2;
                break;
                case 'binc':
                if (i+1 < args.length) binc = parseInt(args[i+1]);
                i += 2;
                break;
                default:
                ++i;
                break;
            }
        }
        if (giliranHitam/*!KCI!*/)
        {
            wtime = btime;
            winc = binc;
        }
        let move_str = null, last_move_str = null;
        const searcher = new sunfish.Searcher();
        /*!KCI!*/
        //# Undian tunnel vision sekali per giliran: bila kena, saringan
        //# berlaku untuk seluruh pencarian ini sehingga kesalahannya utuh,
        //# bukan berubah-ubah di tengah jalan.
        const petakLawan = null != terakhirLawanKe
            ? terakhirLawanKe
            : (opsiLangkahLawan ? (giliranHitam ? 119 - parse(opsiLangkahLawan) : parse(opsiLangkahLawan)) : null);
        searcher.saringAkar = (null != petakLawan) && (acakBerikut() < PELUANG_TEROWONGAN)
            ? buatSaringTerowongan(petakLawan)
            : null;
        const search = searcher.search(hist, maxdepth);
        const think = isFinite(movetime)/*!KCI!*/
            ? movetime
            : (isFinite(wtime) ? 0.8 * Math.min(wtime / 40 + winc, wtime / 2 - 1) : Infinity);
        const start = perf.now();
        function done()
        {
            output("bestmove " + (move_str || last_move_str || '(none)'));
        }
        function next()
        {
            if (STOPPED) return done();
            // batch process multiple moves to avoid "Maximum call stack size exceeded" due to "next" calls
            let batch = 0;
            while (++batch <= 1000)
            {
                let nextSearch = search.next();
                if (nextSearch.done) return done();
                let [depth, gamma, score, move] = nextSearch.value;
                //# The only way we can be sure to have the real move in tp_move,
                //# is if we have just failed high.
                if (move)
                {
                    let {i, j, prom} = move;
                    if (giliranHitam/*!KCI!*/)
                    {
                        i = 119 - i;
                        j = 119 - j;
                    }
                    last_move_str = render(i) + render(j) + prom.toLowerCase();
                }
                if (move && (score >= gamma))
                {
                    move_str = last_move_str;
                    //output("info depth "+depth+" score cp "+score+" pv "+move_str);
                }
                /*!KCI!*/
                //# Hulu berhenti pada langkah pertama yang fail-high begitu
                //# tidak ada batas waktu — akibatnya `go depth N` tanpa jam
                //# selalu berakhir di kedalaman 1. Bila kedalaman diminta
                //# eksplisit, kedalaman itulah yang menentukan.
                if ((move_str && !isFinite(think) && !batasDepth) || (depth > maxdepth) || (perf.now() - start > think))
                {
                    return done();
                }
            }
            nextTick(next);
        }
        nextTick(next);
    }

    else if (args[0] === "stop")
    {
        STOPPED = true; /*!ADDED!*/
    }

    if (output === defaultOutput) return out.join("\n");
};

if (isWebWorker)
{
    /*!ADDED!*/
    onmessage = function(e) {
        if ("string" === typeof e.data) sunfish.engine(e.data, (output) => postMessage(output));
    };
}

// export it
return sunfish;
});
