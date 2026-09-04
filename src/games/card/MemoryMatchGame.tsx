import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, RotateCcw, Zap, Flame } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

interface MemoryCard {
  id: number;
  emoji: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJI_PAIRS = [
  { emoji: '🚀', name: 'Rocket' },
  { emoji: '⚡', name: 'Lightning' },
  { emoji: '💎', name: 'Diamond' },
  { emoji: '🔥', name: 'Flame' },
  { emoji: '🐉', name: 'Dragon' },
  { emoji: '👑', name: 'Crown' },
  { emoji: '🎯', name: 'Target' },
  { emoji: '🎮', name: 'Gamepad' },
];

function generateShuffledCards(): MemoryCard[] {
  const cards: MemoryCard[] = [];
  let id = 0;
  EMOJI_PAIRS.forEach(item => {
    cards.push({ id: id++, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false });
    cards.push({ id: id++, emoji: item.emoji, name: item.name, isFlipped: false, isMatched: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export const MemoryMatchGame: React.FC = () => {
  const gameMeta = getGameById('memory_match')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [cards, setCards] = useState<MemoryCard[]>(generateShuffledCards);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [isWon, setIsWon] = useState<boolean>(false);

  // Check matched pairs
  useEffect(() => {
    if (flippedIndices.length === 2) {
      const [first, second] = flippedIndices;
      setMoves(prev => prev + 1);

      if (cards[first].emoji === cards[second].emoji) {
        // Match!
        sounds.playScore();
        setCards(prev => prev.map((c, i) => i === first || i === second ? { ...c, isMatched: true } : c));
        setScore(prev => prev + 100 * combo);
        setCombo(prev => prev + 1);
        setFlippedIndices([]);
      } else {
        // Mismatch
        setCombo(1);
        const timer = setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === first || i === second ? { ...c, isFlipped: false } : c));
          setFlippedIndices([]);
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, [flippedIndices, cards, combo]);

  // Check victory
  useEffect(() => {
    const allMatched = cards.length > 0 && cards.every(c => c.isMatched);
    if (allMatched && !isWon) {
      setIsWon(true);
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('memory_match', true, score + 300, moves * 3);
    }
  }, [cards, isWon, recordGamePlayed, score, moves, triggerConfetti]);

  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;

    sounds.playClick();
    setCards(prev => prev.map((c, i) => i === index ? { ...c, isFlipped: true } : c));
    setFlippedIndices(prev => [...prev, index]);
  };

  const initGame = () => {
    setCards(generateShuffledCards());
    setFlippedIndices([]);
    setMoves(0);
    setScore(0);
    setCombo(1);
    setIsWon(false);
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      score={score}
      scoreLabel="Score"
      highScore={moves}
    >
      <div className="w-full max-w-xl flex flex-col items-center gap-6">
        
        {/* Status bar */}
        <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <span>Turns: <strong className="text-white font-mono">{moves}</strong></span>
          {combo > 1 && (
            <span className="flex items-center gap-1 font-bold text-amber-400 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {combo}x Combo Streak!
            </span>
          )}
          <span>Matches: <strong className="text-emerald-400 font-mono">{cards.filter(c => c.isMatched).length / 2} / 8</strong></span>
        </div>

        {/* 4x4 Card Grid */}
        <div className="grid grid-cols-4 gap-3 sm:gap-4 p-4 rounded-3xl bg-slate-900/90 border-2 border-slate-750 shadow-2xl">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              id={`memory-card-${idx}`}
              onClick={() => handleCardClick(idx)}
              disabled={card.isMatched || card.isFlipped}
              className={`w-16 h-20 sm:w-22 sm:h-28 rounded-2xl border-2 flex items-center justify-center text-3xl sm:text-4xl shadow-lg transition-all cursor-pointer ${
                card.isMatched
                  ? 'bg-emerald-950/60 border-emerald-500/60 opacity-80 cursor-default scale-95'
                  : card.isFlipped
                  ? 'bg-indigo-900 border-indigo-400 rotate-y-180 scale-105'
                  : 'bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 border-slate-700 hover:border-indigo-400 hover:scale-105'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <span className="animate-in fade-in zoom-in">{card.emoji}</span>
              ) : (
                <span className="text-slate-600 text-xl font-bold">?</span>
              )}
            </button>
          ))}
        </div>

      </div>

      {/* Win Modal */}
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
                Memory Board Cleared!
              </h2>
              <p className="text-xs text-slate-300">
                Completed in {moves} moves with {score} points!
              </p>
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
