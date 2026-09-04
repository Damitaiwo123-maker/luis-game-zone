import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, RotateCcw, ShieldCheck, Trophy, Sparkles, AlertCircle } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type Suit = '♠' | '♥' | '♦' | '♣';

interface Card {
  suit: Suit;
  value: number; // 1 = Ace, 2-10, 11=J, 12=Q, 13=K
  hidden?: boolean;
}

const SUIT_COLORS: Record<Suit, string> = {
  '♠': 'text-slate-900',
  '♣': 'text-slate-900',
  '♥': 'text-rose-600',
  '♦': 'text-rose-600',
};

const CARD_LABELS: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
};

function createShuffledShoe(): Card[] {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const shoe: Card[] = [];
  // 4 standard decks in shoe
  for (let d = 0; d < 4; d++) {
    suits.forEach(s => {
      for (let v = 1; v <= 13; v++) {
        shoe.push({ suit: s, value: v });
      }
    });
  }
  return shoe.sort(() => Math.random() - 0.5);
}

function calculateHandValue(cards: Card[]): { total: number; isSoft: boolean } {
  let total = 0;
  let aces = 0;

  cards.forEach(c => {
    if (c.hidden) return;
    if (c.value === 1) {
      aces++;
      total += 11;
    } else if (c.value >= 10) {
      total += 10;
    } else {
      total += c.value;
    }
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return { total, isSoft: aces > 0 };
}

export const BlackjackGame: React.FC = () => {
  const gameMeta = getGameById('blackjack')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [shoe, setShoe] = useState<Card[]>(createShuffledShoe);
  const [balance, setBalance] = useState<number>(1000);
  const [currentBet, setCurrentBet] = useState<number>(50);
  const [activeBet, setActiveBet] = useState<number>(0);

  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);

  // States: 'betting' | 'playing' | 'dealerTurn' | 'roundOver'
  const [gameStage, setGameStage] = useState<'betting' | 'playing' | 'dealerTurn' | 'roundOver'>('betting');
  const [resultMessage, setResultMessage] = useState<string>('Place your bet to deal!');

  const playerHandValue = calculateHandValue(playerHand);
  const dealerHandValue = calculateHandValue(dealerHand);

  // Deal initial cards
  const handleDeal = () => {
    if (currentBet > balance || currentBet <= 0) {
      sounds.playError();
      return;
    }

    sounds.playCardDeal();
    setBalance(prev => prev - currentBet);
    setActiveBet(currentBet);

    let nextShoe = [...shoe];
    if (nextShoe.length < 20) {
      nextShoe = createShuffledShoe();
    }

    const pCard1 = nextShoe.pop()!;
    const dCard1 = nextShoe.pop()!;
    const pCard2 = nextShoe.pop()!;
    const dCard2 = { ...nextShoe.pop()!, hidden: true }; // Hole card

    const pHand = [pCard1, pCard2];
    const dHand = [dCard1, dCard2];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setShoe(nextShoe);

    const pVal = calculateHandValue(pHand).total;

    // Check for natural Blackjack
    if (pVal === 21) {
      handleNaturalBlackjack(pHand, dHand);
    } else {
      setGameStage('playing');
      setResultMessage('Hit or Stand?');
    }
  };

  const handleNaturalBlackjack = (pHand: Card[], dHand: Card[]) => {
    // Reveal dealer card
    const revealedDealer = dHand.map(c => ({ ...c, hidden: false }));
    setDealerHand(revealedDealer);
    const dVal = calculateHandValue(revealedDealer).total;

    if (dVal === 21) {
      // Push
      setBalance(prev => prev + currentBet);
      setResultMessage('Push! Both player & dealer have Blackjack.');
      sounds.playScore();
    } else {
      // 3:2 payout
      const winnings = Math.floor(currentBet * 2.5);
      setBalance(prev => prev + winnings);
      setResultMessage('Blackjack! Paid 3:2 (+$$)');
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('blackjack', true, winnings, 60);
    }
    setGameStage('roundOver');
  };

  // Player Hits
  const handleHit = () => {
    if (gameStage !== 'playing') return;

    sounds.playCardDeal();
    const nextShoe = [...shoe];
    const card = nextShoe.pop()!;
    const nextHand = [...playerHand, card];

    setPlayerHand(nextHand);
    setShoe(nextShoe);

    const nextVal = calculateHandValue(nextHand).total;
    if (nextVal > 21) {
      // Bust
      sounds.playLose();
      setResultMessage(`Bust (${nextVal})! House wins.`);
      setGameStage('roundOver');
      // Reveal dealer card
      setDealerHand(prev => prev.map(c => ({ ...c, hidden: false })));
      recordGamePlayed('blackjack', false, 0, 60);
    } else if (nextVal === 21) {
      handleStand(nextHand);
    }
  };

  // Player Stands
  const handleStand = (pHand: Card[] = playerHand) => {
    if (gameStage !== 'playing') return;

    sounds.playClick();
    setGameStage('dealerTurn');

    // Reveal dealer hole card
    let currentDHand = dealerHand.map(c => ({ ...c, hidden: false }));
    setDealerHand(currentDHand);

    let nextShoe = [...shoe];
    let dVal = calculateHandValue(currentDHand).total;
    const pVal = calculateHandValue(pHand).total;

    // Dealer draws to 17+
    const drawDealerCards = () => {
      if (dVal < 17) {
        sounds.playCardDeal();
        const card = nextShoe.pop()!;
        currentDHand = [...currentDHand, card];
        dVal = calculateHandValue(currentDHand).total;
        setDealerHand(currentDHand);
        setShoe(nextShoe);
        setTimeout(drawDealerCards, 600);
      } else {
        // Evaluate winner
        evaluateRoundEnd(pVal, dVal);
      }
    };

    setTimeout(drawDealerCards, 600);
  };

  // Double Down
  const handleDoubleDown = () => {
    if (gameStage !== 'playing' || balance < activeBet) return;

    sounds.playChip();
    setBalance(prev => prev - activeBet);
    setActiveBet(prev => prev * 2);

    const nextShoe = [...shoe];
    const card = nextShoe.pop()!;
    const nextHand = [...playerHand, card];
    setPlayerHand(nextHand);
    setShoe(nextShoe);

    const pVal = calculateHandValue(nextHand).total;
    if (pVal > 21) {
      sounds.playLose();
      setResultMessage(`Bust on Double (${pVal})!`);
      setGameStage('roundOver');
      setDealerHand(prev => prev.map(c => ({ ...c, hidden: false })));
    } else {
      handleStand(nextHand);
    }
  };

  const evaluateRoundEnd = (pVal: number, dVal: number) => {
    if (dVal > 21) {
      // Dealer Bust
      const winAmt = activeBet * 2;
      setBalance(prev => prev + winAmt);
      setResultMessage(`Dealer Busted (${dVal})! You Win +$${activeBet}!`);
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('blackjack', true, winAmt, 60);
    } else if (pVal > dVal) {
      // Player Higher
      const winAmt = activeBet * 2;
      setBalance(prev => prev + winAmt);
      setResultMessage(`You Win (${pVal} vs ${dVal})! +$${activeBet}`);
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('blackjack', true, winAmt, 60);
    } else if (pVal < dVal) {
      // Dealer Higher
      setResultMessage(`Dealer Wins (${dVal} vs ${pVal}).`);
      sounds.playLose();
      recordGamePlayed('blackjack', false, 0, 60);
    } else {
      // Push
      setBalance(prev => prev + activeBet);
      setResultMessage(`Push! Bet returned ($${activeBet}).`);
      sounds.playScore();
    }
    setGameStage('roundOver');
  };

  const handleChipClick = (amount: number) => {
    if (gameStage !== 'betting') return;
    sounds.playChip();
    setCurrentBet(amount);
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={() => {
        setGameStage('betting');
        setDealerHand([]);
        setPlayerHand([]);
        setResultMessage('Place your bet for the next hand.');
      }}
      score={balance}
      scoreLabel="Chip Bank"
      turnText={gameStage === 'playing' ? 'Your Action' : gameStage === 'dealerTurn' ? 'Dealer Drawing...' : 'Place Bet'}
      turnColor="text-emerald-400"
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        
        {/* Blackjack Casino Table Felt */}
        <div className="w-full rounded-3xl bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-950 border-4 border-amber-600/40 p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-between min-h-[440px] relative overflow-hidden">
          
          {/* Table Felt Arch Watermark */}
          <div className="absolute top-2 text-emerald-300/20 text-xs font-bold uppercase tracking-widest pointer-events-none">
            Blackjack Pays 3 to 2 • Dealer Must Draw to 16 and Stand on 17
          </div>

          {/* Dealer Area */}
          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-200">
              <span>Dealer's Hand</span>
              {dealerHand.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-emerald-400/40 text-white font-mono">
                  {dealerHand.some(c => c.hidden) ? '?' : dealerHandValue.total}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[96px]">
              {dealerHand.map((card, i) => (
                <div
                  key={i}
                  className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center shadow-xl select-none transition-all ${
                    card.hidden
                      ? 'bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/50 text-white text-2xl'
                      : 'bg-white border-slate-300 font-bold'
                  }`}
                >
                  {card.hidden ? (
                    '🂠'
                  ) : (
                    <div className={`flex flex-col items-center leading-none ${SUIT_COLORS[card.suit]}`}>
                      <span className="text-sm sm:text-base">{CARD_LABELS[card.value]}</span>
                      <span className="text-xl sm:text-2xl">{card.suit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center Message Board */}
          <div className="py-2 px-6 rounded-2xl bg-slate-950/80 border border-amber-500/40 text-center shadow-lg my-2">
            <span className="text-sm sm:text-base font-bold text-amber-300">
              {resultMessage}
            </span>
          </div>

          {/* Player Area */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[96px]">
              {playerHand.map((card, i) => (
                <div
                  key={i}
                  className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center shadow-xl select-none font-bold"
                >
                  <div className={`flex flex-col items-center leading-none ${SUIT_COLORS[card.suit]}`}>
                    <span className="text-sm sm:text-base">{CARD_LABELS[card.value]}</span>
                    <span className="text-xl sm:text-2xl">{card.suit}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-200">
              <span>Your Hand</span>
              {playerHand.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-emerald-400/40 text-emerald-300 font-mono">
                  {playerHandValue.total}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Control & Betting Station */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          
          {/* Chip Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold text-slate-400 mr-1">Bet Chips:</span>
            {[10, 25, 50, 100, 250].map(amt => (
              <button
                key={amt}
                disabled={gameStage !== 'betting'}
                onClick={() => handleChipClick(amt)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold text-xs border-2 flex items-center justify-center shadow-md transition-all cursor-pointer ${
                  currentBet === amt
                    ? 'bg-amber-500 border-white text-slate-950 scale-110 ring-4 ring-amber-400/30 font-extrabold'
                    : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-amber-400'
                }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {gameStage === 'betting' || gameStage === 'roundOver' ? (
              <button
                id="blackjack-deal-btn"
                onClick={handleDeal}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
              >
                Deal Hand (${currentBet})
              </button>
            ) : (
              <>
                <button
                  id="blackjack-hit-btn"
                  onClick={handleHit}
                  disabled={gameStage !== 'playing'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase transition-colors cursor-pointer"
                >
                  Hit
                </button>
                <button
                  id="blackjack-stand-btn"
                  onClick={() => handleStand()}
                  disabled={gameStage !== 'playing'}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase transition-colors cursor-pointer"
                >
                  Stand
                </button>
                {playerHand.length === 2 && balance >= activeBet && (
                  <button
                    id="blackjack-double-btn"
                    onClick={handleDoubleDown}
                    disabled={gameStage !== 'playing'}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase transition-colors cursor-pointer"
                  >
                    Double 2x
                  </button>
                )}
              </>
            )}
          </div>

        </div>

      </div>
    </GameContainer>
  );
};
