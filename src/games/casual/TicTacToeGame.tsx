import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Bot, User, RotateCcw, Sparkles } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type CellValue = 'X' | 'O' | null;

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const TicTacToeGame: React.FC = () => {
  const gameMeta = getGameById('tictactoe')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [winnerInfo, setWinnerInfo] = useState<{ winner: CellValue | 'draw'; line?: number[] } | null>(null);
  const [streak, setStreak] = useState<number>(0);

  const checkWinner = (b: CellValue[]): { winner: CellValue | 'draw'; line?: number[] } | null => {
    for (const combo of WINNING_COMBOS) {
      const [a, bIdx, c] = combo;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return { winner: b[a], line: combo };
      }
    }
    if (b.every(cell => cell !== null)) {
      return { winner: 'draw' };
    }
    return null;
  };

  const handleClick = (idx: number) => {
    if (board[idx] || winnerInfo || (isVsAI && !isXNext)) return;

    sounds.playMove();
    const nextBoard = [...board];
    nextBoard[idx] = isXNext ? 'X' : 'O';
    setBoard(nextBoard);

    const win = checkWinner(nextBoard);
    if (win) {
      handleGameOver(win);
    } else {
      setIsXNext(!isXNext);
    }
  };

  // AI Move (Minimax)
  useEffect(() => {
    if (isVsAI && !isXNext && !winnerInfo) {
      const timer = setTimeout(() => {
        // Find best move
        const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null) as number[];
        if (available.length === 0) return;

        // Check if AI can win immediately
        for (const idx of available) {
          const testBoard = [...board];
          testBoard[idx] = 'O';
          if (checkWinner(testBoard)?.winner === 'O') {
            applyAIMove(idx);
            return;
          }
        }

        // Check if Player is about to win and block
        for (const idx of available) {
          const testBoard = [...board];
          testBoard[idx] = 'X';
          if (checkWinner(testBoard)?.winner === 'X') {
            applyAIMove(idx);
            return;
          }
        }

        // Take center if available
        if (available.includes(4)) {
          applyAIMove(4);
          return;
        }

        // Random pick from remaining
        const randomChoice = available[Math.floor(Math.random() * available.length)];
        applyAIMove(randomChoice);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isXNext, isVsAI, board, winnerInfo]);

  const applyAIMove = (idx: number) => {
    sounds.playClick();
    const nextBoard = [...board];
    nextBoard[idx] = 'O';
    setBoard(nextBoard);

    const win = checkWinner(nextBoard);
    if (win) {
      handleGameOver(win);
    } else {
      setIsXNext(true);
    }
  };

  const handleGameOver = (win: { winner: CellValue | 'draw'; line?: number[] }) => {
    setWinnerInfo(win);
    if (win.winner === 'X') {
      sounds.playWin();
      triggerConfetti();
      setStreak(prev => prev + 1);
      recordGamePlayed('tictactoe', true, 200, 30);
    } else if (win.winner === 'O') {
      sounds.playLose();
      setStreak(0);
      recordGamePlayed('tictactoe', false, 50, 30);
    } else {
      sounds.playScore();
      recordGamePlayed('tictactoe', false, 100, 30);
    }
  };

  const handleRestart = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={handleRestart}
      turnText={winnerInfo ? 'Match Complete' : isXNext ? 'X (You)' : isVsAI ? 'O (Bot AI)' : 'O (Player 2)'}
      turnColor={isXNext ? 'text-indigo-400' : 'text-amber-400'}
      score={streak}
      scoreLabel="Win Streak"
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        
        {/* Opponent Mode Selector */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
          <button
            onClick={() => { setIsVsAI(true); handleRestart(); }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isVsAI ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Play AI
          </button>
          <button
            onClick={() => { setIsVsAI(false); handleRestart(); }}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              !isVsAI ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-900 text-slate-400'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            2P Local
          </button>
        </div>

        {/* 3x3 Grid Board */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl">
          {board.map((cell, idx) => {
            const isWinningCell = winnerInfo?.line?.includes(idx);
            return (
              <button
                key={idx}
                id={`tictactoe-cell-${idx}`}
                onClick={() => handleClick(idx)}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-4xl sm:text-5xl font-display font-extrabold select-none transition-all cursor-pointer ${
                  isWinningCell
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-4 ring-amber-400/40'
                    : cell
                    ? 'bg-slate-950/80 border-slate-750'
                    : 'bg-slate-950/40 border-slate-800 hover:border-indigo-400 hover:scale-105'
                } ${cell === 'X' ? 'text-indigo-400' : 'text-rose-400'}`}
              >
                {cell}
              </button>
            );
          })}
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
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                {winnerInfo.winner === 'draw' ? 'Draw Match!' : `${winnerInfo.winner} Wins!`}
              </h2>
              <button
                onClick={handleRestart}
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
