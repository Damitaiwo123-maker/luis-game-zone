import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, AlertTriangle, Sparkles, Trophy, Bot, User, Flame } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'draw4';

interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

const COLOR_MAP: Record<CardColor, { bg: string; border: string; text: string; hex: string }> = {
  red: { bg: 'bg-rose-500', border: 'border-rose-400', text: 'text-rose-400', hex: '#f43f5e' },
  blue: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400', hex: '#3b82f6' },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400', hex: '#10b981' },
  yellow: { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-amber-400', hex: '#f59e0b' },
  wild: { bg: 'bg-gradient-to-tr from-rose-500 via-amber-400 to-blue-500', border: 'border-white', text: 'text-white', hex: '#8b5cf6' },
};

function generateUnoDeck(): UnoCard[] {
  const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
  const deck: UnoCard[] = [];
  let idCounter = 0;

  colors.forEach(col => {
    // 1 zero card
    deck.push({ id: `card-${idCounter++}`, color: col, value: '0' });
    // 2 of each 1-9
    for (let i = 1; i <= 9; i++) {
      deck.push({ id: `card-${idCounter++}`, color: col, value: `${i}` as CardValue });
      deck.push({ id: `card-${idCounter++}`, color: col, value: `${i}` as CardValue });
    }
    // Action cards: skip, reverse, draw2
    ['skip', 'reverse', 'draw2'].forEach(act => {
      deck.push({ id: `card-${idCounter++}`, color: col, value: act as CardValue });
      deck.push({ id: `card-${idCounter++}`, color: col, value: act as CardValue });
    });
  });

  // Wild & Wild Draw 4 (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card-${idCounter++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `card-${idCounter++}`, color: 'wild', value: 'draw4' });
  }

  return deck.sort(() => Math.random() - 0.5);
}

export const ColorClashGame: React.FC = () => {
  const gameMeta = getGameById('color_clash')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [drawPile, setDrawPile] = useState<UnoCard[]>([]);
  const [topDiscard, setTopDiscard] = useState<UnoCard | null>(null);
  const [currentColor, setCurrentColor] = useState<CardColor>('red');
  
  const [playerHand, setPlayerHand] = useState<UnoCard[]>([]);
  const [aiHand, setAiHand] = useState<UnoCard[]>([]);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [calledUno, setCalledUno] = useState<boolean>(false);
  const [isChoosingWildColor, setIsChoosingWildColor] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [statusText, setStatusText] = useState<string>('Match color or number!');

  const initGame = () => {
    const deck = generateUnoDeck();
    const pCards = deck.splice(0, 7);
    const aiCards = deck.splice(0, 7);

    // Initial discard top (non-wild preferred)
    let firstDiscard = deck.pop()!;
    while (firstDiscard.color === 'wild') {
      deck.unshift(firstDiscard);
      firstDiscard = deck.pop()!;
    }

    setPlayerHand(pCards);
    setAiHand(aiCards);
    setDrawPile(deck);
    setTopDiscard(firstDiscard);
    setCurrentColor(firstDiscard.color);
    setTurn('player');
    setWinner(null);
    setCalledUno(false);
    setIsChoosingWildColor(false);
    setStatusText('Match color, number, or play a Wild card!');
  };

  useEffect(() => {
    initGame();
  }, []);

  // Check if a card is legally playable
  const isValidPlay = (card: UnoCard): boolean => {
    if (!topDiscard) return false;
    if (card.color === 'wild') return true;
    if (card.color === currentColor) return true;
    if (card.value === topDiscard.value) return true;
    return false;
  };

  // Play a card from hand
  const executePlay = (card: UnoCard, chosenColor?: CardColor) => {
    sounds.playMove();

    const isPlayer = turn === 'player';
    const activeColor = chosenColor || card.color;
    setCurrentColor(activeColor);
    setTopDiscard(card);

    let nextDrawPile = [...drawPile];
    let nextAiHand = [...aiHand];
    let nextPlayerHand = [...playerHand];

    if (isPlayer) {
      nextPlayerHand = nextPlayerHand.filter(c => c.id !== card.id);
      setPlayerHand(nextPlayerHand);
    } else {
      nextAiHand = nextAiHand.filter(c => c.id !== card.id);
      setAiHand(nextAiHand);
    }

    // Check Win
    if (isPlayer && nextPlayerHand.length === 0) {
      setWinner('player');
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('color_clash', true, 500, 150);
      return;
    } else if (!isPlayer && nextAiHand.length === 0) {
      setWinner('ai');
      sounds.playLose();
      recordGamePlayed('color_clash', false, 150, 150);
      return;
    }

    // Action Card Effects
    let nextTurn: 'player' | 'ai' = isPlayer ? 'ai' : 'player';

    if (card.value === 'draw2') {
      sounds.playScore();
      // Opponent draws 2 and skips turn
      const drawn = nextDrawPile.splice(0, 2);
      if (isPlayer) {
        nextAiHand.push(...drawn);
        setAiHand(nextAiHand);
        setStatusText('Bot drew 2 cards and skips turn!');
      } else {
        nextPlayerHand.push(...drawn);
        setPlayerHand(nextPlayerHand);
        setStatusText('You drew 2 cards and skipped turn!');
      }
      nextTurn = isPlayer ? 'player' : 'ai'; // skips
    } else if (card.value === 'draw4') {
      sounds.playScore();
      const drawn = nextDrawPile.splice(0, 4);
      if (isPlayer) {
        nextAiHand.push(...drawn);
        setAiHand(nextAiHand);
        setStatusText(`Bot drew 4 cards! Color is now ${activeColor.toUpperCase()}.`);
      } else {
        nextPlayerHand.push(...drawn);
        setPlayerHand(nextPlayerHand);
        setStatusText(`You drew 4 cards! Color is now ${activeColor.toUpperCase()}.`);
      }
      nextTurn = isPlayer ? 'player' : 'ai'; // skips
    } else if (card.value === 'skip' || card.value === 'reverse') {
      sounds.playScore();
      setStatusText(`${isPlayer ? 'You' : 'Bot'} played ${card.value.toUpperCase()}! Turn skipped.`);
      nextTurn = isPlayer ? 'player' : 'ai';
    } else {
      setStatusText(`${isPlayer ? 'Your' : "Bot's"} play complete.`);
    }

    setDrawPile(nextDrawPile);
    setTurn(nextTurn);
  };

  // Player clicks a card
  const handlePlayerCardClick = (card: UnoCard) => {
    if (turn !== 'player' || winner || isChoosingWildColor) return;

    if (!isValidPlay(card)) {
      sounds.playError();
      setStatusText("Invalid card! Must match current color or number.");
      return;
    }

    if (card.color === 'wild') {
      setPendingWildCard(card);
      setIsChoosingWildColor(true);
      return;
    }

    executePlay(card);
  };

  // Player draws a card from deck
  const handleDrawCard = () => {
    if (turn !== 'player' || winner) return;

    sounds.playCardDeal();
    const newPile = [...drawPile];
    if (newPile.length === 0) return;

    const drawn = newPile.pop()!;
    setDrawPile(newPile);
    setPlayerHand(prev => [...prev, drawn]);

    setStatusText(`You drew a card (${drawn.color} ${drawn.value}).`);
    
    // If playable, allow or pass
    if (isValidPlay(drawn)) {
      setStatusText(`Drew a playable card! Click it or pass turn.`);
    } else {
      setTimeout(() => {
        setTurn('ai');
      }, 700);
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn === 'ai' && !winner) {
      const timer = setTimeout(() => {
        const playableCards = aiHand.filter(isValidPlay);

        if (playableCards.length > 0) {
          // AI selects best card (Action/Wild cards prioritized)
          const chosenCard = playableCards[0];
          let chosenColor: CardColor = 'red';

          if (chosenCard.color === 'wild') {
            // Pick color most frequent in AI hand
            const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
            chosenColor = colors[Math.floor(Math.random() * colors.length)];
          }

          executePlay(chosenCard, chosenCard.color === 'wild' ? chosenColor : undefined);
        } else {
          // AI draws a card
          const newPile = [...drawPile];
          if (newPile.length > 0) {
            const drawn = newPile.pop()!;
            setDrawPile(newPile);
            if (isValidPlay(drawn)) {
              setAiHand(prev => [...prev, drawn]);
              setTimeout(() => {
                executePlay(drawn, drawn.color === 'wild' ? 'blue' : undefined);
              }, 600);
            } else {
              setAiHand(prev => [...prev, drawn]);
              setStatusText("Bot couldn't play and drew a card.");
              setTurn('player');
            }
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [turn, aiHand, drawPile, winner]);

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      turnText={turn === 'player' ? 'Your Turn' : 'Bot AI Playing...'}
      turnColor={turn === 'player' ? 'text-indigo-400' : 'text-amber-400'}
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        
        {/* Opponent (AI) Hand */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span>Bot Emma ({aiHand.length} cards)</span>
          </div>
          <div className="flex items-center justify-center -space-x-3 sm:-space-x-4">
            {aiHand.map((_, i) => (
              <div
                key={i}
                className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 border-2 border-indigo-500/50 shadow-md flex items-center justify-center text-xs text-white/50"
              >
                🂠
              </div>
            ))}
          </div>
        </div>

        {/* Center Arena (Draw Deck + Discard Pile + Current Color Indicator) */}
        <div className="flex items-center justify-center gap-6 p-6 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl">
          
          {/* Draw Deck */}
          <button
            id="colorclash-draw-pile"
            onClick={handleDrawCard}
            disabled={turn !== 'player' || !!winner}
            className="w-20 h-28 sm:w-24 sm:h-34 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 border-2 border-indigo-400/60 shadow-xl flex flex-col items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform"
          >
            <span className="font-extrabold text-sm uppercase text-indigo-300">Draw</span>
            <span className="text-xs text-slate-400 font-mono mt-1">({drawPile.length})</span>
          </button>

          {/* Current Discard Top Card */}
          {topDiscard && (
            <div
              className={`w-20 h-28 sm:w-24 sm:h-34 rounded-2xl ${COLOR_MAP[topDiscard.color].bg} border-2 border-white shadow-2xl flex flex-col items-center justify-center text-white font-extrabold select-none`}
            >
              <span className="text-xl sm:text-2xl leading-none uppercase">
                {topDiscard.value}
              </span>
            </div>
          )}

          {/* Active Color Ring Indicator */}
          <div className="flex flex-col items-center gap-1.5 pl-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Color</span>
            <div
              className={`w-8 h-8 rounded-full border-2 border-white shadow-lg ${COLOR_MAP[currentColor].bg}`}
              title={`Active Color: ${currentColor}`}
            />
          </div>

        </div>

        {/* Status Text */}
        <div className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-indigo-300 text-center max-w-sm">
          {statusText}
        </div>

        {/* Player Hand Cards */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="flex items-center justify-between w-full max-w-md px-2">
            <span className="text-xs font-semibold text-slate-300">Your Hand ({playerHand.length} cards)</span>
            
            {playerHand.length === 2 && !calledUno && (
              <button
                onClick={() => {
                  sounds.playWin();
                  setCalledUno(true);
                  setStatusText('YOU SHOUTED UNO! 🔥');
                }}
                className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-lg animate-pulse"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                SHOUT UNO!
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
            {playerHand.map(card => {
              const playable = isValidPlay(card) && turn === 'player';
              return (
                <button
                  key={card.id}
                  onClick={() => handlePlayerCardClick(card)}
                  disabled={!playable}
                  className={`w-14 h-20 sm:w-16 sm:h-24 rounded-2xl ${COLOR_MAP[card.color].bg} border-2 border-white shadow-lg flex flex-col items-center justify-center text-white font-extrabold transition-all cursor-pointer ${
                    playable
                      ? 'hover:-translate-y-2 hover:scale-105 ring-4 ring-white/70'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <span className="text-sm sm:text-base uppercase leading-none">{card.value}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Wild Color Choice Modal */}
      <AnimatePresence>
        {isChoosingWildColor && pendingWildCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl max-w-xs w-full text-center space-y-4"
            >
              <h3 className="font-display font-bold text-base text-white">
                Choose Wild Color
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(['red', 'blue', 'green', 'yellow'] as CardColor[]).map(c => (
                  <button
                    key={c}
                    onClick={() => {
                      setIsChoosingWildColor(false);
                      executePlay(pendingWildCard, c);
                      setPendingWildCard(null);
                    }}
                    className={`py-3 rounded-xl ${COLOR_MAP[c].bg} text-white font-bold text-xs uppercase shadow-md hover:scale-105 transition-transform`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Victory Banner */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-slate-900 border-2 border-amber-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                {winner === 'player' ? 'You Won Color Clash!' : 'Bot Emma Won!'}
              </h2>
              <p className="text-xs text-slate-300">
                {winner === 'player' ? 'Cleared your hand completely. Outstanding victory!' : 'Better luck next hand!'}
              </p>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
              >
                Play Another Match
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </GameContainer>
  );
};
