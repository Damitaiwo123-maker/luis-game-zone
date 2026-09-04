import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles, Trophy, Delete, CornerDownLeft, AlertCircle } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';
import { COMMON_WORDS_5, isValid5LetterWord } from '../../data/words';

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

interface GuessRow {
  letters: string[];
  statuses: LetterStatus[];
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

export const WordGuessGame: React.FC = () => {
  const gameMeta = getGameById('word_guess')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [targetWord, setTargetWord] = useState<string>('BRAIN');
  const [guesses, setGuesses] = useState<GuessRow[]>(() =>
    Array(6).fill(null).map(() => ({
      letters: Array(5).fill(''),
      statuses: Array(5).fill('empty')
    }))
  );
  const [currentRow, setCurrentRow] = useState<number>(0);
  const [currentCol, setCurrentCol] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [message, setMessage] = useState<string>('Guess the 5-letter mystery word!');
  const [keyboardStatuses, setKeyboardStatuses] = useState<Record<string, LetterStatus>>({});

  const initGame = () => {
    const word = COMMON_WORDS_5[Math.floor(Math.random() * COMMON_WORDS_5.length)];
    setTargetWord(word);
    setGuesses(
      Array(6).fill(null).map(() => ({
        letters: Array(5).fill(''),
        statuses: Array(5).fill('empty')
      }))
    );
    setCurrentRow(0);
    setCurrentCol(0);
    setGameState('playing');
    setMessage('Guess the 5-letter secret word in 6 tries!');
    setKeyboardStatuses({});
  };

  useEffect(() => {
    initGame();
  }, []);

  // Handle Key Press
  const handleKeyPress = (key: string) => {
    if (gameState !== 'playing') return;

    if (key === 'BACK' || key === 'BACKSPACE') {
      if (currentCol > 0) {
        sounds.playClick();
        const nextGuesses = [...guesses];
        nextGuesses[currentRow].letters[currentCol - 1] = '';
        setGuesses(nextGuesses);
        setCurrentCol(prev => prev - 1);
      }
      return;
    }

    if (key === 'ENTER') {
      if (currentCol < 5) {
        sounds.playError();
        setMessage('Word must be 5 letters!');
        return;
      }

      const guessWord = guesses[currentRow].letters.join('');
      if (!isValid5LetterWord(guessWord)) {
        sounds.playError();
        setMessage(`"${guessWord}" is not in word list!`);
        return;
      }

      // Evaluate Guess
      sounds.playMove();
      const targetLetters = targetWord.split('');
      const guessLetters = guessWord.split('');
      const newStatuses: LetterStatus[] = Array(5).fill('absent');
      const targetLetterCounts: Record<string, number> = {};

      targetLetters.forEach(l => {
        targetLetterCounts[l] = (targetLetterCounts[l] || 0) + 1;
      });

      // Green pass (exact position)
      guessLetters.forEach((l, i) => {
        if (l === targetLetters[i]) {
          newStatuses[i] = 'correct';
          targetLetterCounts[l]--;
        }
      });

      // Yellow pass (present elsewhere)
      guessLetters.forEach((l, i) => {
        if (newStatuses[i] !== 'correct' && targetLetterCounts[l] > 0) {
          newStatuses[i] = 'present';
          targetLetterCounts[l]--;
        }
      });

      // Update Guesses and Keyboard
      const nextGuesses = [...guesses];
      nextGuesses[currentRow].statuses = newStatuses;
      setGuesses(nextGuesses);

      const nextKeyStatuses = { ...keyboardStatuses };
      guessLetters.forEach((l, i) => {
        const current = nextKeyStatuses[l];
        const status = newStatuses[i];
        if (status === 'correct' || current !== 'correct') {
          nextKeyStatuses[l] = status;
        }
      });
      setKeyboardStatuses(nextKeyStatuses);

      // Check Win or Lose
      if (guessWord === targetWord) {
        setGameState('won');
        sounds.playWin();
        triggerConfetti();
        const score = (7 - currentRow) * 150;
        setMessage(`Genius! You cracked the word "${targetWord}" in ${currentRow + 1} tries!`);
        recordGamePlayed('word_guess', true, score, (currentRow + 1) * 20);
      } else if (currentRow === 5) {
        setGameState('lost');
        sounds.playLose();
        setMessage(`Game Over! The word was "${targetWord}".`);
        recordGamePlayed('word_guess', false, 50, 120);
      } else {
        setCurrentRow(prev => prev + 1);
        setCurrentCol(0);
        setMessage('Good guess! Keep going.');
      }
      return;
    }

    // Letter key
    if (/^[A-Z]$/.test(key) && currentCol < 5) {
      sounds.playClick();
      const nextGuesses = [...guesses];
      nextGuesses[currentRow].letters[currentCol] = key;
      setGuesses(nextGuesses);
      setCurrentCol(prev => prev + 1);
    }
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        handleKeyPress(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRow, currentCol, guesses, gameState, targetWord]);

  const getTileBg = (status: LetterStatus) => {
    switch (status) {
      case 'correct': return 'bg-emerald-600 border-emerald-500 text-white shadow-md';
      case 'present': return 'bg-amber-500 border-amber-400 text-slate-950 shadow-md';
      case 'absent': return 'bg-slate-800 border-slate-700 text-slate-400';
      default: return 'bg-slate-950/80 border-slate-800 text-white';
    }
  };

  const getKeyBg = (status?: LetterStatus) => {
    switch (status) {
      case 'correct': return 'bg-emerald-600 text-white font-bold';
      case 'present': return 'bg-amber-500 text-slate-950 font-bold';
      case 'absent': return 'bg-slate-800 text-slate-500 font-normal';
      default: return 'bg-slate-750 text-slate-200 hover:bg-slate-700 font-bold';
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      turnText={gameState === 'playing' ? `Guess ${currentRow + 1} of 6` : gameState === 'won' ? 'Victory!' : 'Round Over'}
      turnColor={gameState === 'won' ? 'text-emerald-400' : 'text-indigo-400'}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        
        {/* Status Message */}
        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-300 text-center w-full">
          {message}
        </div>

        {/* 6x5 Letter Tile Grid */}
        <div className="grid grid-rows-6 gap-1.5 sm:gap-2">
          {guesses.map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {row.letters.map((letter, cIdx) => {
                const status = row.statuses[cIdx];
                const isCurrent = rIdx === currentRow && cIdx === currentCol;

                return (
                  <motion.div
                    key={cIdx}
                    animate={letter ? { scale: [1, 1.1, 1] } : {}}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center font-display font-extrabold text-xl sm:text-2xl uppercase select-none transition-all ${
                      getTileBg(status)
                    } ${isCurrent ? 'border-indigo-400 ring-2 ring-indigo-400/40' : ''}`}
                  >
                    {letter}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Virtual Keyboard */}
        <div className="w-full space-y-1.5 pt-2">
          {KEYBOARD_ROWS.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map(key => {
                const status = keyboardStatuses[key];
                const isAction = key === 'ENTER' || key === 'BACK';

                return (
                  <button
                    key={key}
                    id={`word-key-${key}`}
                    onClick={() => handleKeyPress(key)}
                    className={`h-11 sm:h-12 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer ${
                      isAction ? 'px-3 sm:px-4 bg-slate-800 text-slate-200 font-bold' : 'w-8 sm:w-10'
                    } ${getKeyBg(status)}`}
                  >
                    {key === 'BACK' ? <Delete className="w-4 h-4" /> : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

      </div>

      {/* Won Modal */}
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
                Word Solved!
              </h2>
              <p className="text-xs text-slate-300">
                You solved <strong>{targetWord}</strong> in {currentRow + 1} guesses!
              </p>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
              >
                Play Next Word
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </GameContainer>
  );
};
