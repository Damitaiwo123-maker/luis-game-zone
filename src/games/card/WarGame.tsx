import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, RotateCcw, Trophy, Sparkles, Bot, User, Flame } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type Suit = '♠' | '♥' | '♦' | '♣';

interface Card {
  id: string;
  suit: Suit;
  value: number; // 2..14 (14 = Ace)
}

const SUIT_COLORS: Record<Suit, string> = {
  '♠': 'text-slate-950',
  '♣': 'text-slate-950',
  '♥': 'text-rose-600',
  '♦': 'text-rose-600',
};

const CARD_LABELS: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

function createShuffledDeck(): Card[] {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const deck: Card[] = [];
  let id = 0;
  suits.forEach(s => {
    for (let v = 2; v <= 14; v++) {
      deck.push({ id: `war-${id++}`, suit: s, value: v });
    }
  });
  return deck.sort(() => Math.random() - 0.5);
}

export const WarGame: React.FC = () => {
  const gameMeta = getGameById('war')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [botDeck, setBotDeck] = useState<Card[]>([]);
  const [playerCard, setPlayerCard] = useState<Card | null>(null);
  const [botCard, setBotCard] = useState<Card | null>(null);
  const [warPot, setWarPot] = useState<Card[]>([]);
  
  const [roundMessage, setRoundMessage] = useState<string>('Click "Battle" to draw cards!');
  const [isWarActive, setIsWarActive] = useState<boolean>(false);
  const [winner, setWinner] = useState<'player' | 'bot' | null>(null);

  const initGame = () => {
    const deck = createShuffledDeck();
    setPlayerDeck(deck.slice(0, 26));
    setBotDeck(deck.slice(26));
    setPlayerCard(null);
    setBotCard(null);
    setWarPot([]);
    setRoundMessage('Click "Battle" to draw cards!');
    setIsWarActive(false);
    setWinner(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleBattle = () => {
    if (playerDeck.length === 0 || botDeck.length === 0 || winner) return;

    sounds.playCardDeal();

    const pDeck = [...playerDeck];
    const bDeck = [...botDeck];

    const pCard = pDeck.shift()!;
    const bCard = bDeck.shift()!;

    setPlayerCard(pCard);
    setBotCard(bCard);

    const currentPot = [...warPot, pCard, bCard];

    if (pCard.value > bCard.value) {
      // Player wins round
      sounds.playScore();
      setPlayerDeck([...pDeck, ...currentPot]);
      setBotDeck(bDeck);
      setWarPot([]);
      setIsWarActive(false);
      setRoundMessage(`You won the battle (+${currentPot.length} cards)!`);
    } else if (bCard.value > pCard.value) {
      // Bot wins round
      sounds.playMove();
      setBotDeck([...bDeck, ...currentPot]);
      setPlayerDeck(pDeck);
      setWarPot([]);
      setIsWarActive(false);
      setRoundMessage(`Bot Emma won the battle (+${currentPot.length} cards).`);
    } else {
      // WAR! Tie
      sounds.playError();
      setIsWarActive(true);
      setRoundMessage('⚔️ WAR DECLARED! Tie values! Draw 3 cards to fight!');

      // Burn 3 cards from each if available
      const pBurn = pDeck.splice(0, Math.min(3, pDeck.length - 1));
      const bBurn = bDeck.splice(0, Math.min(3, bDeck.length - 1));

      setWarPot([...currentPot, ...pBurn, ...bBurn]);
      setPlayerDeck(pDeck);
      setBotDeck(bDeck);
    }

    // Check game over
    if (pDeck.length === 0) {
      setWinner('bot');
      sounds.playLose();
      recordGamePlayed('war', false, 100, 120);
    } else if (bDeck.length === 0) {
      setWinner('player');
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('war', true, 500, 120);
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      score={playerDeck.length}
      scoreLabel="Your Cards"
      highScore={botDeck.length}
    >
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        
        {/* Battle Arena */}
        <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl flex flex-col items-center gap-6">
          
          {/* Bot Card Area */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Bot Emma ({botDeck.length} cards)</span>
            </div>
            <div className="w-20 h-28 sm:w-24 sm:h-34 rounded-2xl border-2 flex items-center justify-center shadow-xl bg-white border-slate-300 font-bold select-none">
              {botCard ? (
                <div className={`flex flex-col items-center leading-none ${SUIT_COLORS[botCard.suit]}`}>
                  <span className="text-base sm:text-lg">{CARD_LABELS[botCard.value]}</span>
                  <span className="text-2xl sm:text-3xl">{botCard.suit}</span>
                </div>
              ) : (
                <span className="text-slate-400 text-xs">🂠 Back</span>
              )}
            </div>
          </div>

          {/* Center VS Clash Bar */}
          <div className="flex items-center gap-4">
            <div className="h-0.5 w-16 bg-slate-800" />
            <div className={`px-4 py-1.5 rounded-full border text-xs font-extrabold flex items-center gap-1.5 ${
              isWarActive ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse' : 'bg-slate-950 border-slate-850 text-slate-300'
            }`}>
              <Swords className="w-4 h-4 text-amber-400" />
              {isWarActive ? 'WAR!' : 'VS'}
            </div>
            <div className="h-0.5 w-16 bg-slate-800" />
          </div>

          {/* Player Card Area */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-28 sm:w-24 sm:h-34 rounded-2xl border-2 flex items-center justify-center shadow-xl bg-white border-slate-300 font-bold select-none">
              {playerCard ? (
                <div className={`flex flex-col items-center leading-none ${SUIT_COLORS[playerCard.suit]}`}>
                  <span className="text-base sm:text-lg">{CARD_LABELS[playerCard.value]}</span>
                  <span className="text-2xl sm:text-3xl">{playerCard.suit}</span>
                </div>
              ) : (
                <span className="text-slate-400 text-xs">🂠 Back</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <User className="w-4 h-4 text-emerald-400" />
              <span>You ({playerDeck.length} cards)</span>
            </div>
          </div>

        </div>

        {/* Message and Battle Trigger Button */}
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-indigo-300 text-center">
            {roundMessage}
          </p>

          <button
            id="war-battle-btn"
            onClick={handleBattle}
            disabled={!!winner}
            className="w-full max-w-xs py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105"
          >
            {isWarActive ? 'Fight the War!' : 'Battle Next Card'}
          </button>
        </div>

      </div>

      {/* Win Banner */}
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
                {winner === 'player' ? 'War Won! All 52 Cards Captured!' : 'Bot Emma Conquered the Deck.'}
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
