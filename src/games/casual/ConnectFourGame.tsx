import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Bot, User, RotateCcw, Sparkles } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type Disc = 'red' | 'yellow' | null;

const ROWS = 6;
const COLS = 7;

export const ConnectFourGame: React.FC = () => {
  const gameMeta = getGameById('connect_four')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [board, setBoard] = useState<Disc[][]>(() =>
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentTurn, setCurrentTurn] = useState<'red' | 'yellow'>('red');
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [winnerInfo, setWinnerInfo] = useState<{ winner: Disc | 'draw'; line?: { r: number; c: number }[] } | null>(null);

  // Check 4 in a row
  const checkWin = (b: Disc[][]): { winner: Disc | 'draw'; line?: { r: number; c: number }[] } | null => {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const d = b[r][c];
        if (d && d === b[r][c + 1] && d === b[r][c + 2] && d === b[r][c + 3]) {
          return { winner: d, line: [{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }, { r, c: c + 3 }] };
        }
      }
    }
    // Check vertical
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        const d = b[r][c];
        if (d && d === b[r + 1][c] && d === b[r + 2][c] && d === b[r + 3][c]) {
          return { winner: d, line: [{ r, c }, { r: r + 1, c }, { r: r + 2, c }, { r: r + 3, c }] };
        }
      }
    }
    // Check diagonal down-right
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const d = b[r][c];
        if (d && d === b[r + 1][c + 1] && d === b[r + 2][c + 2] && d === b[r + 3][c + 3]) {
          return { winner: d, line: [{ r, c }, { r: r + 1, c: c + 1 }, { r: r + 2, c: c + 2 }, { r: r + 3, c: c + 3 }] };
        }
      }
    }
    // Check diagonal up-right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const d = b[r][c];
        if (d && d === b[r - 1][c + 1] && d === b[r - 2][c + 2] && d === b[r - 3][c + 3]) {
          return { winner: d, line: [{ r, c }, { r: r - 1, c: c + 1 }, { r: r - 2, c: c + 2 }, { r: r - 3, c: c + 3 }] };
        }
      }
    }
    // Check Draw
    if (b.every(row => row.every(cell => cell !== null))) {
      return { winner: 'draw' };
    }
    return null;
  };

  const dropDisc = (colIdx: number) => {
    if (winnerInfo || (isVsAI && currentTurn === 'yellow')) return;

    // Find lowest open row in column
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][colIdx]) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      sounds.playError();
      return;
    }

    sounds.playMove();
    const nextBoard = board.map(row => [...row]);
    nextBoard[targetRow][colIdx] = currentTurn;
    setBoard(nextBoard);

    const win = checkWin(nextBoard);
    if (win) {
      handleGameOver(win);
    } else {
      setCurrentTurn(currentTurn === 'red' ? 'yellow' : 'red');
    }
  };

  // AI bot move
  useEffect(() => {
    if (isVsAI && currentTurn === 'yellow' && !winnerInfo) {
      const timer = setTimeout(() => {
        // Find valid columns
        const validCols: number[] = [];
        for (let c = 0; c < COLS; c++) {
          if (!board[0][c]) validCols.push(c);
        }

        if (validCols.length === 0) return;

        // Try to win immediately
        for (const c of validCols) {
          let tr = -1;
          for (let r = ROWS - 1; r >= 0; r--) {
            if (!board[r][c]) { tr = r; break; }
          }
          const testBoard = board.map(row => [...row]);
          testBoard[tr][c] = 'yellow';
          if (checkWin(testBoard)?.winner === 'yellow') {
            applyBotDrop(c, tr);
            return;
          }
        }

        // Try to block Player win
        for (const c of validCols) {
          let tr = -1;
          for (let r = ROWS - 1; r >= 0; r--) {
            if (!board[r][c]) { tr = r; break; }
          }
          const testBoard = board.map(row => [...row]);
          testBoard[tr][c] = 'red';
          if (checkWin(testBoard)?.winner === 'red') {
            applyBotDrop(c, tr);
            return;
          }
        }

        // Prefer center columns
        const preferred = [3, 2, 4, 1, 5, 0, 6].filter(c => validCols.includes(c));
        const chosenCol = preferred[0];
        let tr = -1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (!board[r][chosenCol]) { tr = r; break; }
        }
        applyBotDrop(chosenCol, tr);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [currentTurn, isVsAI, board, winnerInfo]);

  const applyBotDrop = (colIdx: number, targetRow: number) => {
    sounds.playMove();
    const nextBoard = board.map(row => [...row]);
    nextBoard[targetRow][colIdx] = 'yellow';
    setBoard(nextBoard);

    const win = checkWin(nextBoard);
    if (win) {
      handleGameOver(win);
    } else {
      setCurrentTurn('red');
    }
  };

  const handleGameOver = (win: { winner: Disc | 'draw'; line?: { r: number; c: number }[] }) => {
    setWinnerInfo(win);
    if (win.winner === 'red') {
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('connect_four', true, 300, 60);
    } else if (win.winner === 'yellow') {
      sounds.playLose();
      recordGamePlayed('connect_four', false, 50, 60);
    }
  };

  const initGame = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setCurrentTurn('red');
    setWinnerInfo(null);
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      turnText={winnerInfo ? 'Match Over' : currentTurn === 'red' ? 'Red (You)' : isVsAI ? 'Yellow (AI)' : 'Yellow (Player 2)'}
      turnColor={currentTurn === 'red' ? 'text-rose-400' : 'text-amber-400'}
    >
      <div className="w-full max-w-xl flex flex-col items-center gap-6">
        
        {/* Opponent Mode Selector */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          <button
            onClick={() => { setIsVsAI(true); initGame(); }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isVsAI ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Play AI
          </button>
          <button
            onClick={() => { setIsVsAI(false); initGame(); }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              !isVsAI ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            2P Local
          </button>
        </div>

        {/* 6x7 Connect 4 Grid */}
        <div className="p-3 sm:p-5 rounded-3xl bg-blue-700 border-4 border-blue-600 shadow-2xl flex flex-col items-center">
          
          {/* Column Drop Arrow Indicators */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 w-full pb-2">
            {Array.from({ length: COLS }).map((_, c) => (
              <button
                key={c}
                id={`connect4-col-${c}`}
                onClick={() => dropDisc(c)}
                disabled={!!winnerInfo || (isVsAI && currentTurn === 'yellow')}
                className="h-6 rounded-lg bg-blue-800/80 hover:bg-blue-600 text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
              >
                ▼
              </button>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3 bg-blue-900 p-3 sm:p-4 rounded-2xl border border-blue-500/40">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isWinningCell = winnerInfo?.line?.some(l => l.r === r && l.c === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => dropDisc(c)}
                    className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-950 border-2 border-blue-600/60 shadow-inner flex items-center justify-center cursor-pointer transition-transform"
                  >
                    {cell && (
                      <motion.div
                        initial={{ y: -50, scale: 0.8 }}
                        animate={{ y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className={`w-9 h-9 sm:w-13 sm:h-13 rounded-full shadow-lg ${
                          cell === 'red'
                            ? 'bg-gradient-to-tr from-rose-600 to-rose-400 border border-rose-300'
                            : 'bg-gradient-to-tr from-amber-500 to-amber-300 border border-amber-200'
                        } ${isWinningCell ? 'ring-4 ring-white animate-pulse' : ''}`}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {winnerInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white capitalize">
                {winnerInfo.winner === 'draw' ? 'Stalemate Draw!' : `${winnerInfo.winner} Connected 4!`}
              </h2>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
              >
                Play Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </GameContainer>
  );
};
