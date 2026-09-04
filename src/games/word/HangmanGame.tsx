import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, HelpCircle, Heart, HeartCrack } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

const HANGMAN_WORDS = [
  { word: 'GALAXY', hint: 'Cosmic structure with billions of stars' },
  { word: 'PYRAMID', hint: 'Ancient monument in Egypt' },
  { word: 'CHESS', hint: 'Grandmaster strategy board game' },
  { word: 'VOLCANO', hint: 'Mountain that erupts molten lava' },
  { word: 'DOLPHIN', hint: 'Highly intelligent marine mammal' },
  { word: 'AVATAR', hint: 'Digital representation of a user' },
  { word: 'DIAMOND', hint: 'Hardest known natural mineral' },
  { word: 'TREASURE', hint: 'Buried pirate gold or jewels' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const HangmanGame: React.FC = () => {
  const gameMeta = getGameById('hangman')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [currentWordItem, setCurrentWordItem] = useState(HANGMAN_WORDS[0]);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuessesCount, setWrongGuessesCount] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const maxWrong = 6;

  const initGame = () => {
    const item = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
    setCurrentWordItem(item);
    setGuessedLetters([]);
    setWrongGuessesCount(0);
    setGameState('playing');
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleGuessLetter = (letter: string) => {
    if (gameState !== 'playing' || guessedLetters.includes(letter)) return;

    sounds.playClick();
    const nextGuessed = [...guessedLetters, letter];
    setGuessedLetters(nextGuessed);

    const isCorrect = currentWordItem.word.includes(letter);

    if (isCorrect) {
      sounds.playScore();
      // Check win
      const allRevealed = currentWordItem.word.split('').every(l => nextGuessed.includes(l));
      if (allRevealed) {
        setGameState('won');
        sounds.playWin();
        triggerConfetti();
        recordGamePlayed('hangman', true, 400 - wrongGuessesCount * 50, 60);
      }
    } else {
      sounds.playError();
      const nextWrong = wrongGuessesCount + 1;
      setWrongGuessesCount(nextWrong);
      if (nextWrong >= maxWrong) {
        setGameState('lost');
        sounds.playLose();
        recordGamePlayed('hangman', false, 50, 60);
      }
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      turnText={gameState === 'playing' ? `Remaining Lives: ${maxWrong - wrongGuessesCount}` : gameState === 'won' ? 'Victory!' : 'Game Over'}
      turnColor={gameState === 'won' ? 'text-emerald-400' : 'text-indigo-400'}
    >
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        
        {/* SVG Hangman Gallows Canvas */}
        <div className="w-64 h-56 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl flex items-center justify-center p-4">
          <svg viewBox="0 0 200 200" className="w-full h-full stroke-slate-300 stroke-[4] fill-none">
            {/* Gallows Base */}
            <line x1="20" y1="180" x2="180" y2="180" />
            <line x1="50" y1="180" x2="50" y2="20" />
            <line x1="50" y1="20" x2="130" y2="20" />
            <line x1="130" y1="20" x2="130" y2="45" />

            {/* Head */}
            {wrongGuessesCount >= 1 && (
              <circle cx="130" cy="65" r="20" className="stroke-indigo-400" />
            )}
            {/* Body */}
            {wrongGuessesCount >= 2 && (
              <line x1="130" y1="85" x2="130" y2="130" className="stroke-indigo-400" />
            )}
            {/* Left Arm */}
            {wrongGuessesCount >= 3 && (
              <line x1="130" y1="95" x2="105" y2="115" className="stroke-indigo-400" />
            )}
            {/* Right Arm */}
            {wrongGuessesCount >= 4 && (
              <line x1="130" y1="95" x2="155" y2="115" className="stroke-indigo-400" />
            )}
            {/* Left Leg */}
            {wrongGuessesCount >= 5 && (
              <line x1="130" y1="130" x2="110" y2="165" className="stroke-indigo-400" />
            )}
            {/* Right Leg */}
            {wrongGuessesCount >= 6 && (
              <line x1="130" y1="130" x2="150" y2="165" className="stroke-rose-500" />
            )}
          </svg>
        </div>

        {/* Hint Box */}
        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-indigo-300 text-center max-w-md">
          💡 Hint: {currentWordItem.hint}
        </div>

        {/* Word Display Slots */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-2">
          {currentWordItem.word.split('').map((letter, idx) => {
            const isRevealed = guessedLetters.includes(letter) || gameState === 'lost';
            return (
              <div
                key={idx}
                className={`w-10 h-14 sm:w-12 sm:h-16 rounded-xl border-b-4 flex items-center justify-center font-display font-extrabold text-2xl sm:text-3xl select-none ${
                  isRevealed
                    ? 'border-indigo-400 bg-slate-900 text-white'
                    : 'border-slate-700 bg-slate-950/60 text-transparent'
                }`}
              >
                {isRevealed ? letter : ''}
              </div>
            );
          })}
        </div>

        {/* 26-Letter Virtual Keyboard */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-lg">
          {ALPHABET.map(letter => {
            const isGuessed = guessedLetters.includes(letter);
            const isMatch = currentWordItem.word.includes(letter);

            return (
              <button
                key={letter}
                id={`hangman-key-${letter}`}
                onClick={() => handleGuessLetter(letter)}
                disabled={isGuessed || gameState !== 'playing'}
                className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isGuessed
                    ? isMatch
                      ? 'bg-emerald-600 text-white opacity-80'
                      : 'bg-slate-800 text-slate-500 opacity-40'
                    : 'bg-slate-900 border border-slate-750 text-slate-200 hover:border-indigo-400 hover:text-white hover:scale-105'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

      </div>

      {/* Game Over / Won Modal */}
      <AnimatePresence>
        {gameState !== 'playing' && (
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
                {gameState === 'won' ? 'You Saved the Man!' : 'Hangman Out of Lives!'}
              </h2>
              <p className="text-xs text-slate-300">
                The mystery word was <strong className="text-indigo-400">{currentWordItem.word}</strong>.
              </p>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
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
