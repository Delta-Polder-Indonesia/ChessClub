import React, { useState } from 'react';
import { 
  Play, 
  Puzzle, 
  GraduationCap, 
  Dumbbell, 
  Tv, 
  Users, 
  MoreHorizontal, 
  Search, 
  UserPlus, 
  LogIn, 
  HelpCircle, 
  Globe, 
  BarChart2, 
  Gamepad2, 
  Compass, 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward, 
  Plus, 
  Bookmark, 
  RotateCw, 
  Settings,
  Share2
} from 'lucide-react';

export default function App() {
  // Posisi awal catur klasik
  const initialBoard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ];

  // State untuk pergerakan pion e2-e4 dan N-f3 seperti di gambar
  const [activeStep, setActiveStep] = useState(2); // Step 0: start, 1: e4, 2: e5 + Nf3
  const [activeTab, setActiveTab] = useState('Analysis');

  // Mapping simbol Unicode buah catur
  const pieceSymbols = {
    'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
    'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
  };

  // Render Papan Catur Sesuai Step
  const getBoardState = () => {
    let board = JSON.parse(JSON.stringify(initialBoard));
    if (activeStep >= 1) {
      // 1. e4 e5
      board[6][4] = null; // e2 kosong
      board[4][4] = 'P';  // e4
      board[1][4] = null; // e7 kosong
      board[3][4] = 'p';  // e5
    }
    if (activeStep >= 2) {
      // 2. Nf3
      board[7][6] = null; // g1 kosong
      board[5][5] = 'N';  // f3
    }
    return board;
  };

  const currentBoard = getBoardState();

  // Highlight petak langkah terakhir (f3 dan g1) jika step == 2
  const isHighlighted = (r, c) => {
    if (activeStep === 2) {
      return (r === 7 && c === 6) || (r === 5 && c === 5);
    }
    if (activeStep === 1) {
      return (r === 6 && c === 4) || (r === 4 && c === 4);
    }
    return false;
  };

  return (
    <div className="flex h-screen w-screen bg-[#262421] text-gray-200 font-sans overflow-hidden select-none">
      
      {/* 1. SIDEBAR KIRI (Chess.com Style) */}
      <aside className="w-44 bg-[#1e1c18] flex flex-col justify-between py-3 border-r border-[#312e2b] flex-shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="px-4 mb-4 flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 bg-[#81b64c] rounded flex items-center justify-center font-bold text-white text-xl shadow">
              ♟
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Chess<span className="text-[#81b64c]">.com</span></span>
          </div>

          {/* Navigasi Utama */}
          <nav className="space-y-0.5 px-2">
            {[
              { icon: Gamepad2, label: 'Play' },
              { icon: Puzzle, label: 'Puzzles' },
              { icon: GraduationCap, label: 'Learn' },
              { icon: Dumbbell, label: 'Train' },
              { icon: Tv, label: 'Watch' },
              { icon: Users, label: 'Community' },
              { icon: MoreHorizontal, label: 'Other' },
            ].map((item, idx) => (
              <a
                key={idx}
                href="#"
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-300 hover:bg-[#312e2b] hover:text-white font-semibold text-sm transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Tombol Bagian Bawah Sidebar */}
        <div className="px-2 space-y-2">
          {/* Search Box */}
          <div className="relative px-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-[#262421] text-xs text-gray-200 pl-8 pr-3 py-2 rounded border border-[#363431] focus:outline-none focus:border-[#81b64c]"
            />
          </div>

          <button className="w-full bg-[#81b64c] hover:bg-[#a3d168] text-white font-bold py-2 px-3 rounded text-sm transition shadow flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" /> Sign Up
          </button>
          
          <button className="w-full bg-[#363431] hover:bg-[#45423e] text-white font-semibold py-2 px-3 rounded text-sm transition flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Log In
          </button>

          {/* Footer Icons */}
          <div className="pt-2 flex justify-around text-gray-400 text-xs border-t border-[#312e2b]">
            <button className="hover:text-white flex items-center gap-1"><HelpCircle className="w-4 h-4" /> Help</button>
            <button className="hover:text-white flex items-center gap-1"><Globe className="w-4 h-4" /> English</button>
          </div>
        </div>
      </aside>

      {/* 2. AREA UTAMA (Papan Catur + Bar Evaluasi) */}
      <main className="flex-1 flex items-center justify-center p-4 gap-4 overflow-hidden bg-[#262421]">
        <div className="flex flex-col items-center max-w-[620px] w-full">
          
          {/* Info Pemain Atas (Black) */}
          <div className="w-full flex items-center justify-between pb-2 text-sm text-gray-300 font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#312e2b] rounded flex items-center justify-center text-lg">♟</div>
              <span>Black</span>
            </div>
            <div className="text-xs text-gray-400 bg-[#1e1c18] px-2 py-1 rounded border border-[#363431]">
              Stockfish 16 Lite
            </div>
          </div>

          {/* Papan Catur & Engine Eval Bar */}
          <div className="flex w-full aspect-square max-h-[560px] shadow-2xl rounded overflow-hidden relative">
            
            {/* Bar Evaluasi Tipis di Kiri Papan */}
            <div className="w-3 bg-[#e0e0e0] relative flex flex-col justify-end">
              <div className="w-full bg-[#312e2b] transition-all duration-300" style={{ height: '52%' }}></div>
            </div>

            {/* Grid 8x8 Papan Catur */}
            <div className="flex-1 grid grid-cols-8 grid-rows-8 relative">
              {currentBoard.map((row, rowIndex) =>
                row.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const highlighted = isHighlighted(rowIndex, colIndex);
                  
                  // Label Koordinat
                  const showRank = colIndex === 0;
                  const showFile = rowIndex === 7;
                  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`relative flex items-center justify-center text-5xl font-bold select-none transition-colors ${
                        highlighted
                          ? 'bg-[#f7f769]'
                          : isLight
                          ? 'bg-[#eeeed2]'
                          : 'bg-[#769656]'
                      }`}
                    >
                      {/* Teks Angka Rank (1-8) */}
                      {showRank && (
                        <span
                          className={`absolute top-0.5 left-1 text-[10px] font-bold ${
                            isLight ? 'text-[#769656]' : 'text-[#eeeed2]'
                          }`}
                        >
                          {8 - rowIndex}
                        </span>
                      )}

                      {/* Simbol Buah Catur */}
                      {piece && (
                        <span
                          className={`cursor-pointer transform hover:scale-105 transition-transform ${
                            piece === piece.toUpperCase()
                              ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                              : 'text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]'
                          }`}
                        >
                          {pieceSymbols[piece]}
                        </span>
                      )}

                      {/* Teks Huruf File (a-h) */}
                      {showFile && (
                        <span
                          className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${
                            isLight ? 'text-[#769656]' : 'text-[#eeeed2]'
                          }`}
                        >
                          {files[colIndex]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Info Pemain Bawah (White) */}
          <div className="w-full flex items-center justify-between pt-2 text-sm text-gray-300 font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#e0e0e0] text-black rounded flex items-center justify-center text-lg font-bold">♙</div>
              <span>White</span>
            </div>
            <div className="flex gap-2">
              <button className="p-1 hover:bg-[#312e2b] rounded text-gray-400 hover:text-white">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* 3. PANEL ANALISIS KANAN (Move Log & Tab Kontrol) */}
      <aside className="w-96 bg-[#211f1c] border-l border-[#312e2b] flex flex-col justify-between flex-shrink-0">
        
        {/* Header Tab Navigasi */}
        <div>
          <div className="flex border-b border-[#312e2b] bg-[#1e1c18]">
            {[
              { id: 'Analysis', icon: BarChart2, label: 'Analysis' },
              { id: 'Games', icon: Gamepad2, label: 'Games' },
              { id: 'Explore', icon: Compass, label: 'Explore' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#81b64c] text-white bg-[#262421]'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#262421]'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub Bar Info Pembukaan / Engine */}
          <div className="p-3 bg-[#262421] border-b border-[#312e2b] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>King's Pawn Opening: King's Knight Variation</span>
            </div>
            <button className="text-gray-400 hover:text-white">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Player Names Header dalam Move Log */}
          <div className="px-4 py-2 text-xs font-bold text-gray-400 border-b border-[#312e2b] flex justify-between bg-[#1e1c18]">
            <span>White - Black</span>
            <span className="text-gray-500">1/2</span>
          </div>

          {/* Move Log Table */}
          <div className="p-2 space-y-1 text-sm font-semibold max-h-[360px] overflow-y-auto">
            {/* Step 1: e4 e5 */}
            <div className="flex items-center rounded py-1 px-2 hover:bg-[#2c2926]">
              <span className="w-8 text-gray-500 text-xs">1.</span>
              <span 
                onClick={() => setActiveStep(1)}
                className={`flex-1 cursor-pointer px-2 py-0.5 rounded ${
                  activeStep === 1 ? 'bg-[#363431] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                e4
              </span>
              <span 
                onClick={() => setActiveStep(1)}
                className={`flex-1 cursor-pointer px-2 py-0.5 rounded ${
                  activeStep === 1 ? 'bg-[#363431] text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                e5
              </span>
            </div>

            {/* Step 2: Nf3 */}
            <div className="flex items-center rounded py-1 px-2 hover:bg-[#2c2926]">
              <span className="w-8 text-gray-500 text-xs">2.</span>
              <span 
                onClick={() => setActiveStep(2)}
                className={`flex-1 cursor-pointer px-2 py-0.5 rounded ${
                  activeStep === 2 ? 'bg-[#363431] text-white font-bold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Nf3
              </span>
              <span className="flex-1 text-gray-600">...</span>
            </div>
          </div>
        </div>

        {/* Panel Kontrol Bawah (Tombol Navigasi Langkah) */}
        <div className="p-3 bg-[#1e1c18] border-t border-[#312e2b] space-y-3">
          {/* Tombol Aksi Kiri-Kanan Navigasi Papan */}
          <div className="flex items-center justify-between gap-1 bg-[#262421] p-1 rounded-lg border border-[#312e2b]">
            <button 
              onClick={() => setActiveStep(0)} 
              className="flex-1 py-2 flex justify-center items-center hover:bg-[#363431] rounded text-gray-300 hover:text-white transition"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))} 
              className="flex-1 py-2 flex justify-center items-center hover:bg-[#363431] rounded text-gray-300 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveStep(Math.min(2, activeStep + 1))} 
              className="flex-1 py-2 flex justify-center items-center hover:bg-[#363431] rounded text-gray-300 hover:text-white transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveStep(2)} 
              className="flex-1 py-2 flex justify-center items-center hover:bg-[#363431] rounded text-gray-300 hover:text-white transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Action Row 2 (New, Save, Review, Flip) */}
          <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-300">
            <button className="flex flex-col items-center gap-1 p-2 bg-[#262421] hover:bg-[#312e2b] rounded transition border border-[#312e2b]">
              <Plus className="w-4 h-4 text-gray-400" />
              <span>New</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 bg-[#262421] hover:bg-[#312e2b] rounded transition border border-[#312e2b]">
              <Bookmark className="w-4 h-4 text-gray-400" />
              <span>Save</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 bg-[#262421] hover:bg-[#312e2b] rounded transition border border-[#312e2b]">
              <RotateCw className="w-4 h-4 text-gray-400" />
              <span>Review</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-2 bg-[#262421] hover:bg-[#312e2b] rounded transition border border-[#312e2b]">
              <Share2 className="w-4 h-4 text-gray-400" />
              <span>Share</span>
            </button>
          </div>
        </div>

      </aside>

    </div>
  );
}