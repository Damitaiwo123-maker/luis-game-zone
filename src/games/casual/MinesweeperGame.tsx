import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, Bomb, RotateCcw, Trophy, Sparkles, Smile, Frown, ShieldAlert } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

interface Cell {
  r: number;
  c: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-400',
  2: 'text-emerald-400',
  3: 'text-rose-400',
  4: 'text-purple-400',
  5: 'text-amber-400',
  6: 'text-cyan-400',
  7: 'text-pink-400',
  8: 'text-slate-200',
};

export const MinesweeperGame: React.FC = () => {
  const gameMeta = getGameById('minesweeper')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [flagMode, setFlagMode] = useState<boolean>(false);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [flagsRemaining, setFlagsRemaining] = useState<number>(MINES);
  const [timer, setTimer] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  const initGame = useCallback(() => {
    // Generate empty board
    const newGrid: Cell[][] = Array(ROWS).fill(null).map((_, r) =>
      Array(COLS).fill(null).map((_, c) => ({
        r, c, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0
      }))
    );

    // Place mines randomly
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        placed++;
      }
    }

    // Compute neighbor mine counts
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }

    setGrid(newGrid);
    setGameState('playing');
    setFlagsRemaining(MINES);
    setTimer(0);
    setTimerActive(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, gameState]);

  const revealCell = (r: number, c: number) => {
    if (gameState !== 'playing' || grid[r][c].isFlagged || grid[r][c].isRevealed) return;

    if (!timerActive) setTimerActive(true);

    const cell = grid[r][c];

    // Hit Mine!
    if (cell.isMine) {
      sounds.playLose();
      setGameState('lost');
      // Reveal all mines
      setGrid(prev => prev.map(row => row.map(cell => cell.isMine ? { ...cell, isRevealed: true } : cell)));
      recordGamePlayed('minesweeper', false, 50, timer);
      return;
    }

    sounds.playClick();

    // Flood fill reveal
    const nextGrid = grid.map(row => row.map(c => ({ ...c })));

    const floodReveal = (row: number, col: number) => {
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
      const target = nextGrid[row][col];
      if (target.isRevealed || target.isFlagged || target.isMine) return;

      target.isRevealed = true;

      if (target.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            floodReveal(row + dr, col + dc);
          }
        }
      }
    };

    floodReveal(r, c);
    setGrid(nextGrid);

    // Check Victory
    const unrevealedSafe = nextGrid.flat().filter(cell => !cell.isMine && !cell.isRevealed);
    if (unrevealedSafe.length === 0) {
      sounds.playWin();
      triggerConfetti();
      setGameState('won');
      const score = Math.max(100, 500 - timer * 2);
      recordGamePlayed('minesweeper', true, score, timer);
    }
  };

  const toggleFlag = (r: number, c: number, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (gameState !== 'playing' || grid[r][c].isRevealed) return;

    sounds.playMove();
    const cell = grid[r][c];
    const isNowFlagged = !cell.isFlagged;

    if (isNowFlagged && flagsRemaining <= 0) return;

    setGrid(prev => prev.map(row => row.map(cl => (cl.r === r && cl.c === c ? { ...cl, isFlagged: isNowFlagged } : cl))));
    setFlagsRemaining(prev => isNowFlagged ? prev - 1 : prev + 1);
  };

  const handleCellClick = (r: number, c: number) => {
    if (flagMode) {
      toggleFlag(r, c);
    } else {
      revealCell(r, c);
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      score={flagsRemaining}
      scoreLabel="Mines Left"
      highScore={timer}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        
        {/* Top Control Header */}
        <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
          
          {/* Flag Mode Toggle */}
          <button
            onClick={() => setFlagMode(!flagMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              flagMode
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            {flagMode ? 'Flag Mode (ON)' : 'Dig Mode (ON)'}
          </button>

          {/* Reset Face */}
          <button
            onClick={initGame}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-lg transition-transform hover:scale-110 cursor-pointer"
          >
            {gameState === 'won' ? <Trophy className="w-5 h-5 text-amber-400" /> : gameState === 'lost' ? <Frown className="w-5 h-5 text-rose-400" /> : <Smile className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Timer Display */}
          <div className="font-mono font-bold text-sm text-indigo-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            ⏱ {timer}s
          </div>

        </div>

        {/* 9x9 Minefield Grid */}
        <div className="p-3 sm:p-4 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl">
          <div className="grid grid-cols-9 gap-1 bg-slate-950 p-2 sm:p-3 rounded-2xl border border-slate-800">
            {grid.map(row =>
              row.map(cell => (
                <button
                  key={`${cell.r}-${cell.c}`}
                  id={`minesweeper-cell-${cell.r}-${cell.c}`}
                  onClick={() => handleCellClick(cell.r, cell.c)}
                  onContextMenu={(e) => toggleFlag(cell.r, cell.c, e)}
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg font-display font-extrabold text-xs sm:text-sm flex items-center justify-center select-none transition-all cursor-pointer ${
                    cell.isRevealed
                      ? cell.isMine
                        ? 'bg-rose-700 text-white animate-bounce'
                        : 'bg-slate-900/90 text-slate-200'
                      : 'bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:border-indigo-400'
                  }`}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb className="w-4 h-4 text-white" />
                    ) : cell.neighborMines > 0 ? (
                      <span className={NUMBER_COLORS[cell.neighborMines]}>
                        {cell.neighborMines}
                      </span>
                    ) : (
                      ''
                    )
                  ) : cell.isFlagged ? (
                    <Flag className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  ) : (
                    ''
                  )}
                </button>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {gameState === 'won' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                Minefield Cleared!
              </h2>
              <p className="text-xs text-slate-300">
                You safely flagged all 10 mines in {timer} seconds!
              </p>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
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
