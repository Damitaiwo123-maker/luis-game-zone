import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, CheckCircle, RotateCcw, Check, Clock } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

const WORD_SETS = [
  { theme: 'Gaming & Tech', words: ['CHESS', 'LUDO', 'QUEST', 'PIXEL', 'AVATAR', 'LOGIC'] },
  { theme: 'Nature & Space', words: ['SOLAR', 'ORBIT', 'COMET', 'GALAXY', 'PLANET', 'STORM'] },
  { theme: 'Ocean Wonders', words: ['CORAL', 'SHARK', 'OCEAN', 'WHALE', 'TIGER', 'RIVER'] },
];

const GRID_SIZE = 10;

interface PlacedWord {
  word: string;
  found: boolean;
  cells: { r: number; c: number }[];
}

function generateWordSearchGrid(words: string[]): { grid: string[][]; placedWords: PlacedWord[] } {
  const grid: string[][] = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
  const placedWords: PlacedWord[] = [];

  const directions = [
    [0, 1],   // Horizontal
    [1, 0],   // Vertical
    [1, 1],   // Diagonal down-right
    [-1, 1],  // Diagonal up-right
  ];

  words.forEach(word => {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 150) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const [dr, dc] = dir;

      const maxR = dr === 1 ? GRID_SIZE - word.length : dr === -1 ? GRID_SIZE - 1 : GRID_SIZE - 1;
      const minR = dr === -1 ? word.length - 1 : 0;
      const maxC = dc === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;

      if (maxR < minR || maxC < 0) continue;

      const startR = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
      const startC = Math.floor(Math.random() * (maxC + 1));

      // Check if fit without conflict
      let canFit = true;
      const cells: { r: number; c: number }[] = [];

      for (let i = 0; i < word.length; i++) {
        const r = startR + i * dr;
        const c = startC + i * dc;
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
          canFit = false;
          break;
        }
        cells.push({ r, c });
      }

      if (canFit) {
        for (let i = 0; i < word.length; i++) {
          const r = startR + i * dr;
          const c = startC + i * dc;
          grid[r][c] = word[i];
        }
        placedWords.push({ word, found: false, cells });
        placed = true;
      }
    }
  });

  // Fill remainder with random letters
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    }
  }

  return { grid, placedWords };
}

export const WordSearchGame: React.FC = () => {
  const gameMeta = getGameById('word_search')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [themeIdx, setThemeIdx] = useState<number>(0);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<PlacedWord[]>([]);
  const [selectedCells, setSelectedCells] = useState<{ r: number; c: number }[]>([]);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const initGame = (idx: number = themeIdx) => {
    const currentTheme = WORD_SETS[idx % WORD_SETS.length];
    const generated = generateWordSearchGrid(currentTheme.words);
    setGrid(generated.grid);
    setPlacedWords(generated.placedWords);
    setSelectedCells([]);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, [themeIdx]);

  // Check victory
  useEffect(() => {
    if (placedWords.length > 0 && placedWords.every(w => w.found) && !isWon) {
      setIsWon(true);
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('word_search', true, score + 400, 120);
    }
  }, [placedWords, isWon, recordGamePlayed, score, triggerConfetti]);

  // Cell Click / Selection
  const handleCellClick = (r: number, c: number) => {
    sounds.playClick();

    const alreadySelected = selectedCells.some(cell => cell.r === r && cell.c === c);

    if (alreadySelected) {
      // Deselect
      setSelectedCells(prev => prev.filter(cell => !(cell.r === r && cell.c === c)));
      return;
    }

    const nextSelected = [...selectedCells, { r, c }];
    setSelectedCells(nextSelected);

    // Check if current selected letters match any placed word (forward or backward)
    const selectedWord = nextSelected.map(cell => grid[cell.r][cell.c]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    const matchedWord = placedWords.find(
      w => !w.found && (w.word === selectedWord || w.word === reversedWord)
    );

    if (matchedWord) {
      sounds.playScore();
      setPlacedWords(prev =>
        prev.map(w => (w.word === matchedWord.word ? { ...w, found: true } : w))
      );
      setScore(prev => prev + 100);
      setSelectedCells([]);
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={() => initGame()}
      score={score}
      scoreLabel="Score"
      turnText={`Theme: ${WORD_SETS[themeIdx % WORD_SETS.length].theme}`}
      turnColor="text-indigo-400"
    >
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-6">
        
        {/* 10x10 Word Search Matrix */}
        <div className="p-3 sm:p-4 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl flex flex-col items-center">
          <div className="grid grid-cols-10 grid-rows-10 gap-1 w-[310px] h-[310px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px] bg-slate-950 p-2 rounded-2xl border border-slate-800">
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const isSelected = selectedCells.some(cell => cell.r === r && cell.c === c);
                const isFoundWordCell = placedWords.some(
                  w => w.found && w.cells.some(cell => cell.r === r && cell.c === c)
                );

                return (
                  <button
                    key={`${r}-${c}`}
                    id={`wordsearch-cell-${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`rounded-lg flex items-center justify-center font-display font-extrabold text-xs sm:text-sm select-none transition-all cursor-pointer ${
                      isFoundWordCell
                        ? 'bg-emerald-600/80 text-white font-black'
                        : isSelected
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 scale-105'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Word Checklist Panel */}
        <div className="w-full md:w-64 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center justify-between">
              <span>Words to Find ({placedWords.filter(w => w.found).length}/{placedWords.length})</span>
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {placedWords.map(w => (
                <div
                  key={w.word}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                    w.found
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 line-through opacity-70'
                      : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                >
                  <span>{w.word}</span>
                  {w.found && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
              ))}
            </div>

            <button
              onClick={() => setThemeIdx(prev => prev + 1)}
              className="w-full mt-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Next Word Theme ➔
            </button>
          </div>
        </div>

      </div>

      {/* Win Banner */}
      <AnimatePresence>
        {isWon && (
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
                Puzzle Completed!
              </h2>
              <p className="text-xs text-slate-300">
                Found all {placedWords.length} hidden words!
              </p>
              <button
                onClick={() => setThemeIdx(prev => prev + 1)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
              >
                Next Word Puzzle
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </GameContainer>
  );
};
