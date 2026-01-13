
import React, { useState, useEffect, useCallback } from 'react';
import { Player, GameMode, Difficulty, GameState, Move } from './types';
import { audioService } from './services/audioService';
import { getBestMove, checkWinner } from './services/aiService';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    board: Array(9).fill(null),
    isXNext: true,
    winner: null,
    winningLine: null,
    scores: { X: 0, O: 0 },
    history: [],
    gameMode: GameMode.PVP,
    difficulty: Difficulty.EASY
  });

  const handleSquareClick = useCallback((index: number) => {
    if (state.board[index] || state.winner) return;

    const currentPlayer = state.isXNext ? 'X' : 'O';
    const newBoard = [...state.board];
    newBoard[index] = currentPlayer;

    if (currentPlayer === 'X') audioService.playMoveX();
    else audioService.playMoveO();

    const { winner, winningLine } = checkWinner(newBoard, state.difficulty);
    const newMove: Move = { player: currentPlayer, index, timestamp: Date.now() };

    setState(prev => {
      const nextState = {
        ...prev,
        board: newBoard,
        isXNext: !prev.isXNext,
        winner,
        winningLine,
        history: [...prev.history, newMove],
        scores: winner === 'X' 
          ? { ...prev.scores, X: prev.scores.X + 1 } 
          : winner === 'O' 
          ? { ...prev.scores, O: prev.scores.O + 1 } 
          : prev.scores
      };
      return nextState;
    });

    if (winner === 'X' || winner === 'O') audioService.playWin();
    else if (winner === 'Draw') audioService.playDraw();
  }, [state.board, state.winner, state.isXNext, state.difficulty]);

  // AI Turn Handling
  useEffect(() => {
    if (state.gameMode === GameMode.PVE && !state.isXNext && !state.winner) {
      const timer = setTimeout(() => {
        const bestMoveIndex = getBestMove(state.board, state.difficulty);
        if (bestMoveIndex !== -1) {
          handleSquareClick(bestMoveIndex);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.isXNext, state.gameMode, state.board, state.winner, state.difficulty, handleSquareClick]);

  const resetGame = () => {
    const boardSize = state.difficulty === Difficulty.HARD ? 16 : 9;
    setState(prev => ({
      ...prev,
      board: Array(boardSize).fill(null),
      isXNext: true,
      winner: null,
      winningLine: null,
      history: []
    }));
  };

  const resetScores = () => {
    setState(prev => ({
      ...prev,
      scores: { X: 0, O: 0 }
    }));
  };

  const setMode = (mode: GameMode) => {
    if (state.gameMode === mode) return;
    const boardSize = state.difficulty === Difficulty.HARD ? 16 : 9;
    setState(prev => ({
      ...prev,
      gameMode: mode,
      board: Array(boardSize).fill(null),
      isXNext: true,
      winner: null,
      winningLine: null,
      history: []
    }));
  };

  const setDifficulty = (diff: Difficulty) => {
    if (state.difficulty === diff) return;
    const boardSize = diff === Difficulty.HARD ? 16 : 9;
    setState(prev => ({
      ...prev,
      difficulty: diff,
      board: Array(boardSize).fill(null),
      isXNext: true,
      winner: null,
      winningLine: null,
      history: []
    }));
  };

  const gridSize = state.difficulty === Difficulty.HARD ? 4 : 3;

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 blur-[120px] rounded-full"></div>

      {/* Header */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl md:text-7xl font-orbitron font-bold tracking-[0.2em] text-white mb-2 uppercase italic">
          TIC-<span className="text-cyan-400">TAC</span>
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-fuchsia-500 mx-auto rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
        {state.difficulty === Difficulty.HARD && (
          <p className="text-[10px] font-orbitron text-fuchsia-400 mt-2 tracking-widest animate-pulse uppercase">3-IN-A-ROW PROTOCOL ACTIVE (4x4 GRID)</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl z-10">
        
        {/* Left Panel: Controls & Info */}
        <div className="order-2 lg:order-1 flex flex-col gap-6">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-orbitron font-semibold text-zinc-400 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full"></span> MATCH SETTINGS
            </h2>
            
            <div className="space-y-6">
              {/* Uplink Type Selector */}
              <div>
                <label className="text-[10px] font-orbitron uppercase text-zinc-500 tracking-widest mb-2 block">Link Protocol</label>
                <div className="grid grid-cols-2 p-1 bg-black/40 border border-zinc-800 rounded-xl">
                  <button 
                    onClick={() => setMode(GameMode.PVP)}
                    className={`py-2 text-xs font-orbitron rounded-lg transition-all ${state.gameMode === GameMode.PVP ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    FRIENDS
                  </button>
                  <button 
                    onClick={() => setMode(GameMode.PVE)}
                    className={`py-2 text-xs font-orbitron rounded-lg transition-all ${state.gameMode === GameMode.PVE ? 'bg-cyan-500 text-black font-bold shadow-lg shadow-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    AI
                  </button>
                </div>
              </div>

              {/* AI Config Selector */}
              <div>
                <label className="text-[10px] font-orbitron uppercase text-zinc-500 tracking-widest mb-2 block">AI Config</label>
                <div className="grid grid-cols-2 p-1 bg-black/40 border border-zinc-800 rounded-xl">
                  <button 
                    onClick={() => setDifficulty(Difficulty.EASY)}
                    className={`py-2 text-xs font-orbitron rounded-lg transition-all ${state.difficulty === Difficulty.EASY ? 'bg-fuchsia-500 text-white font-bold shadow-lg shadow-fuchsia-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    EASY
                  </button>
                  <button 
                    onClick={() => setDifficulty(Difficulty.HARD)}
                    className={`py-2 text-xs font-orbitron rounded-lg transition-all ${state.difficulty === Difficulty.HARD ? 'bg-fuchsia-500 text-white font-bold shadow-lg shadow-fuchsia-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    HARD
                  </button>
                </div>
                <p className="text-[9px] text-zinc-600 mt-2 font-orbitron uppercase">
                  {state.difficulty === Difficulty.EASY ? '3x3 Grid | 3 to Win' : '4x4 Grid | 3 to Win'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-orbitron font-semibold text-zinc-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-fuchsia-400 rounded-full"></span> Commands
            </h2>
            <div className="flex flex-col gap-3">
              <button 
                onClick={resetGame}
                className="w-full py-3 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-white transition-all transform active:scale-95 shadow-lg shadow-white/10"
              >
                Reset Board
              </button>
              <button 
                onClick={resetScores}
                className="w-full py-3 border border-zinc-700 text-zinc-400 font-bold rounded-xl hover:bg-zinc-800 transition-all transform active:scale-95"
              >
                Clear Stats
              </button>
            </div>
          </div>
        </div>

        {/* Center Panel: Game Board */}
        <div className="order-1 lg:order-2 flex flex-col items-center gap-6">
          {/* Status Indicator */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-full px-8 py-3 flex items-center gap-8 shadow-xl">
             <div className={`flex flex-col items-center transition-all duration-300 ${state.isXNext && !state.winner ? 'scale-110 opacity-100' : 'opacity-40 scale-90'}`}>
                <span className={`text-2xl font-bold font-orbitron ${state.isXNext ? 'text-cyan-400 neon-text-cyan' : 'text-zinc-500'}`}>P1 (X)</span>
                {state.isXNext && !state.winner && <div className="h-0.5 w-8 bg-cyan-400 mt-1 shadow-[0_0_10px_rgba(34,211,238,0.8)] animate-pulse"></div>}
             </div>
             <div className="h-6 w-px bg-zinc-700"></div>
             <div className={`flex flex-col items-center transition-all duration-300 ${!state.isXNext && !state.winner ? 'scale-110 opacity-100' : 'opacity-40 scale-90'}`}>
                <span className={`text-2xl font-bold font-orbitron ${!state.isXNext ? 'text-fuchsia-500 neon-text-pink' : 'text-zinc-500'}`}>
                  {state.gameMode === GameMode.PVE ? 'AI (O)' : 'P2 (O)'}
                </span>
                {!state.isXNext && !state.winner && <div className="h-0.5 w-8 bg-fuchsia-500 mt-1 shadow-[0_0_10px_rgba(217,70,239,0.8)] animate-pulse"></div>}
             </div>
          </div>

          {/* Grid Container */}
          <div className="relative p-3 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
            <div 
              className={`grid gap-2 md:gap-3 ${gridSize === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}
            >
              {state.board.map((square, i) => {
                const isWinningSquare = state.winningLine?.includes(i);
                const cellSize = gridSize === 4 ? 'w-16 h-16 md:w-24 md:h-24' : 'w-24 h-24 md:w-32 md:h-32';
                const iconSize = gridSize === 4 ? 'text-3xl md:text-5xl' : 'text-5xl md:text-7xl';
                
                return (
                  <button
                    key={i}
                    onClick={() => handleSquareClick(i)}
                    className={`
                      ${cellSize} rounded-lg md:rounded-2xl flex items-center justify-center ${iconSize} font-orbitron transition-all duration-300
                      ${!square && !state.winner ? 'bg-zinc-800/40 hover:bg-zinc-800 cursor-pointer hover:scale-[1.02] active:scale-95' : 'bg-zinc-900 cursor-default'}
                      ${isWinningSquare && square === 'X' ? 'bg-cyan-500/20 neon-border-cyan border-2' : ''}
                      ${isWinningSquare && square === 'O' ? 'bg-fuchsia-500/20 neon-border-pink border-2' : ''}
                      border border-zinc-800/50
                    `}
                  >
                    {square === 'X' && (
                      <span className="text-cyan-400 neon-text-cyan drop-shadow-lg scale-in">X</span>
                    )}
                    {square === 'O' && (
                      <span className="text-fuchsia-500 neon-text-pink drop-shadow-lg scale-in">O</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Winner Overlay */}
            {state.winner && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl animate-fade-in border-2 border-white/5">
                <div className="text-white font-orbitron text-center px-4 py-8">
                  {state.winner === 'Draw' ? (
                    <p className="text-4xl md:text-5xl font-bold mb-4 uppercase text-zinc-300">Stalemate</p>
                  ) : (
                    <>
                      <p className="text-lg tracking-widest uppercase opacity-80 mb-2">Victory</p>
                      <p className={`text-6xl md:text-7xl font-black mb-6 ${state.winner === 'X' ? 'text-cyan-400 neon-text-cyan' : 'text-fuchsia-500 neon-text-pink'}`}>
                        {state.winner} WINS
                      </p>
                    </>
                  )}
                  <button 
                    onClick={resetGame}
                    className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:scale-110 active:scale-95 transition-transform"
                  >
                    Next Round
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scores Row */}
          <div className="flex gap-4 w-full justify-between max-w-sm">
            <div className="flex-1 bg-zinc-900 border border-cyan-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs uppercase font-orbitron text-cyan-400/60 mb-1">X-STATS</p>
              <p className="text-3xl font-orbitron font-bold text-white">{state.scores.X}</p>
            </div>
            <div className="flex-1 bg-zinc-900 border border-fuchsia-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs uppercase font-orbitron text-fuchsia-400/60 mb-1">O-STATS</p>
              <p className="text-3xl font-orbitron font-bold text-white">{state.scores.O}</p>
            </div>
          </div>
        </div>

        {/* Right Panel: Move History */}
        <div className="order-3 flex flex-col gap-6">
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl shadow-2xl h-[400px] flex flex-col">
            <h2 className="text-xl font-orbitron font-semibold text-zinc-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Event Log
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {state.history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                   <div className="w-12 h-12 border-2 border-dashed border-zinc-700 rounded-full mb-4 animate-spin-slow"></div>
                   <p className="text-zinc-500 italic text-sm text-center">Awaiting initial move...</p>
                </div>
              ) : (
                state.history.slice().reverse().map((move, idx) => {
                   const row = Math.floor(move.index / gridSize) + 1;
                   const col = (move.index % gridSize) + 1;
                   return (
                    <div key={move.timestamp} className="bg-zinc-800/40 border border-zinc-800/50 p-3 rounded-xl flex items-center justify-between animate-fade-in">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-orbitron text-xs 
                          ${move.player === 'X' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30'}`}>
                          {move.player}
                        </span>
                        <span className="text-zinc-300 font-orbitron text-xs">
                          {row}:{col}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        #{state.history.length - idx}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 z-10 text-center">
        <p className="text-zinc-500 font-orbitron text-xs tracking-[0.2em] uppercase opacity-60">
          Build by <span className="text-cyan-400 font-bold">Mohammad Ishraq</span> &copy; 2026
        </p>
      </footer>

      <style>{`
        .scale-in {
          animation: scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
