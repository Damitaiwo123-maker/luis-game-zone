import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Trophy, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type Grid = number[][];

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  2: { bg: 'bg-slate-800 border-slate-700', text: 'text-slate-200' },
  4: { bg: 'bg-slate-700 border-slate-600', text: 'text-slate-100' },
  8: { bg: 'bg-amber-600 border-amber-500', text: 'text-white' },
  16: { bg: 'bg-orange-600 border-orange-500', text: 'text-white' },
  32: { bg: 'bg-rose-600 border-rose-500', text: 'text-white' },
  64: { bg: 'bg-red-600 border-red-500', text: 'text-white' },
  128: { bg: 'bg-yellow-500 border-yellow-400', text: 'text-slate-950 font-black' },
  256: { bg: 'bg-emerald-500 border-emerald-400', text: 'text-slate-950 font-black' },
  512: { bg: 'bg-cyan-500 border-cyan-400', text: 'text-slate-950 font-black' },
  1024: { bg: 'bg-indigo-500 border-indigo-400', text: 'text-white font-black' },
  2048: { bg: 'bg-purple-600 border-purple-400 shadow-purple-500/50', text: 'text-white font-black' },
};

export const Game2048: React.FC = () => {
  const gameMeta = getGameById('game_2048')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [grid, setGrid] = useState<Grid>(() => Array(4).fill(0).map(() => Array(4).fill(0)));
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hasWon2048, setHasWon2048] = useState<boolean>(false);

  const addRandomTile = useCallback((currentGrid: Grid): Grid => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length === 0) return currentGrid;

    const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    let newGrid = Array(4).fill(0).map(() => Array(4).fill(0));
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setIsGameOver(false);
    setHasWon2048(false);
  }, [addRandomTile]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const slideAndMergeRow = (row: number[]): { newRow: number[]; addedScore: number } => {
    let nonZero = row.filter(v => v !== 0);
    let addedScore = 0;
    const mergedRow: number[] = [];

    for (let i = 0; i < nonZero.length; i++) {
      if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
        const mergedVal = nonZero[i] * 2;
        mergedRow.push(mergedVal);
        addedScore += mergedVal;
        i++; // skip next merged
      } else {
        mergedRow.push(nonZero[i]);
      }
    }

    while (mergedRow.length < 4) {
      mergedRow.push(0);
    }

    return { newRow: mergedRow, addedScore };
  };

  const move = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (isGameOver) return;

    let nextGrid = grid.map(r => [...r]);
    let totalAddedScore = 0;
    let moved = false;

    if (direction === 'left' || direction === 'right') {
      for (let r = 0; r < 4; r++) {
        const originalRow = nextGrid[r];
        const rowToProcess = direction === 'right' ? [...originalRow].reverse() : originalRow;
        const { newRow, addedScore } = slideAndMergeRow(rowToProcess);
        const finalRow = direction === 'right' ? newRow.reverse() : newRow;

        if (finalRow.some((val, idx) => val !== originalRow[idx])) {
          moved = true;
        }
        nextGrid[r] = finalRow;
        totalAddedScore += addedScore;
      }
    } else {
      // Up or Down
      for (let c = 0; c < 4; c++) {
        const originalCol = [nextGrid[0][c], nextGrid[1][c], nextGrid[2][c], nextGrid[3][c]];
        const colToProcess = direction === 'down' ? [...originalCol].reverse() : originalCol;
        const { newRow, addedScore } = slideAndMergeRow(colToProcess);
        const finalCol = direction === 'down' ? newRow.reverse() : newRow;

        if (finalCol.some((val, idx) => val !== originalCol[idx])) {
          moved = true;
        }
        for (let r = 0; r < 4; r++) {
          nextGrid[r][c] = finalCol[r];
        }
        totalAddedScore += addedScore;
      }
    }

    if (moved) {
      sounds.playMove();
      const withNewTile = addRandomTile(nextGrid);
      setGrid(withNewTile);
      
      const newScore = score + totalAddedScore;
      setScore(newScore);
      if (newScore > highScore) setHighScore(newScore);

      // Check 2048 win
      if (!hasWon2048 && withNewTile.some(r => r.some(v => v >= 2048))) {
        setHasWon2048(true);
        sounds.playWin();
        triggerConfetti();
        recordGamePlayed('game_2048', true, newScore, 180);
      }

      // Check game over
      checkGameEnd(withNewTile);
    }
  }, [grid, isGameOver, score, highScore, hasWon2048, addRandomTile, recordGamePlayed, triggerConfetti]);

  const checkGameEnd = (currentGrid: Grid) => {
    // Check if any empty cell exists
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) return;
        if (r < 3 && currentGrid[r][c] === currentGrid[r + 1][c]) return;
        if (c < 3 && currentGrid[r][c] === currentGrid[r][c + 1]) return;
      }
    }
    // No moves left
    setIsGameOver(true);
    sounds.playLose();
    recordGamePlayed('game_2048', false, score, 120);
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('left');
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('right');
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('up');
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('down');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      score={score}
      scoreLabel="Score"
      highScore={highScore}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        
        {/* 4x4 2048 Board */}
        <div className="p-3 sm:p-4 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl">
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-800">
            {grid.map((row, r) =>
              row.map((val, c) => {
                const tileStyle = val > 0 ? TILE_COLORS[val] || { bg: 'bg-purple-700 border-purple-500', text: 'text-white' } : null;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-display font-black text-xl sm:text-2xl transition-all ${
                      val > 0
                        ? `${tileStyle?.bg} ${tileStyle?.text} border-2 shadow-lg animate-in zoom-in-75`
                        : 'bg-slate-900/60 border border-slate-800'
                    }`}
                  >
                    {val > 0 ? val : ''}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Mobile On-Screen Direction D-Pad */}
        <div className="grid grid-cols-3 gap-2 w-48">
          <div />
          <button
            id="btn-2048-up"
            onClick={() => move('up')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />
          <button
            id="btn-2048-left"
            onClick={() => move('left')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            id="btn-2048-down"
            onClick={() => move('down')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            id="btn-2048-right"
            onClick={() => move('right')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Game Over Banner */}
      <AnimatePresence>
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-slate-900 border-2 border-indigo-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <h2 className="text-2xl font-bold font-display text-white">
                Game Over!
              </h2>
              <p className="text-xs text-slate-300">
                Final Score: <strong className="text-indigo-400 font-mono text-base">{score}</strong>
              </p>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </GameContainer>
  );
};
