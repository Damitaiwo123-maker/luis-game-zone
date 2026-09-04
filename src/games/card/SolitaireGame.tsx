import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Sparkles, Trophy, Undo2, HelpCircle } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type CardSuit = '♠' | '♥' | '♦' | '♣';
type CardColor = 'red' | 'black';

interface PlayingCard {
  id: string;
  suit: CardSuit;
  value: number; // 1 = Ace, 11 = Jack, 12 = Queen, 13 = King
  color: CardColor;
  faceUp: boolean;
}

const SUIT_COLORS: Record<CardSuit, CardColor> = {
  '♠': 'black',
  '♣': 'black',
  '♥': 'red',
  '♦': 'red',
};

const VALUE_LABELS: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

function createDeck(): PlayingCard[] {
  const suits: CardSuit[] = ['♠', '♥', '♦', '♣'];
  const deck: PlayingCard[] = [];
  suits.forEach(suit => {
    for (let v = 1; v <= 13; v++) {
      deck.push({
        id: `${suit}-${v}`,
        suit,
        value: v,
        color: SUIT_COLORS[suit],
        faceUp: false,
      });
    }
  });
  return deck.sort(() => Math.random() - 0.5);
}

export const SolitaireGame: React.FC = () => {
  const gameMeta = getGameById('solitaire')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [stock, setStock] = useState<PlayingCard[]>([]);
  const [waste, setWaste] = useState<PlayingCard[]>([]);
  const [foundations, setFoundations] = useState<PlayingCard[][]>([[], [], [], []]);
  const [tableau, setTableau] = useState<PlayingCard[][]>([[], [], [], [], [], [], []]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<{ source: 'waste' | 'tableau' | 'foundation'; colIdx?: number; cardIdx?: number } | null>(null);

  // Initialize new game
  const initGame = () => {
    const deck = createDeck();
    const newTableau: PlayingCard[][] = [[], [], [], [], [], [], []];

    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop()!;
        card.faceUp = row === col; // Top card is face up
        newTableau[col].push(card);
      }
    }

    setTableau(newTableau);
    setStock(deck);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setMovesCount(0);
    setScore(0);
    setIsWon(false);
    setSelectedCard(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Check victory condition (all 4 foundations filled with 13 cards)
  useEffect(() => {
    const totalFoundationCards = foundations.reduce((acc, f) => acc + f.length, 0);
    if (totalFoundationCards === 52 && !isWon) {
      setIsWon(true);
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('solitaire', true, score + 500, movesCount * 2);
    }
  }, [foundations, isWon, recordGamePlayed, score, movesCount, triggerConfetti]);

  // Click stockpile to draw into waste
  const handleStockClick = () => {
    sounds.playCardDeal();
    setSelectedCard(null);

    if (stock.length === 0) {
      // Recycle waste back to stock
      if (waste.length === 0) return;
      const recycled = [...waste].reverse().map(c => ({ ...c, faceUp: false }));
      setStock(recycled);
      setWaste([]);
      setScore(prev => Math.max(0, prev - 20));
      return;
    }

    const drawnCard = { ...stock[stock.length - 1], faceUp: true };
    setStock(prev => prev.slice(0, prev.length - 1));
    setWaste(prev => [...prev, drawnCard]);
    setMovesCount(prev => prev + 1);
  };

  // Try auto-moving a card to foundations
  const tryAutoFoundation = (card: PlayingCard, sourceCol?: number): boolean => {
    for (let fIdx = 0; fIdx < 4; fIdx++) {
      const fPile = foundations[fIdx];
      const targetVal = fPile.length === 0 ? 1 : fPile[fPile.length - 1].value + 1;
      const targetSuit = fPile.length === 0 ? card.suit : fPile[0].suit;

      if (card.value === targetVal && card.suit === targetSuit) {
        // Move card to foundation
        sounds.playScore();
        setFoundations(prev => {
          const next = prev.map(p => [...p]);
          next[fIdx].push(card);
          return next;
        });

        if (sourceCol !== undefined) {
          // Remove from tableau
          setTableau(prev => {
            const next = prev.map(col => [...col]);
            next[sourceCol].pop();
            // Flip new top card if needed
            if (next[sourceCol].length > 0) {
              next[sourceCol][next[sourceCol].length - 1].faceUp = true;
            }
            return next;
          });
        } else {
          // Remove from waste
          setWaste(prev => prev.slice(0, prev.length - 1));
        }

        setScore(prev => prev + 15);
        setMovesCount(prev => prev + 1);
        setSelectedCard(null);
        return true;
      }
    }
    return false;
  };

  // Click on a tableau column or card
  const handleTableauClick = (colIdx: number, cardIdx?: number) => {
    const col = tableau[colIdx];

    // If a card is already selected, try placing it onto this column
    if (selectedCard) {
      let movingCards: PlayingCard[] = [];

      if (selectedCard.source === 'waste') {
        movingCards = [waste[waste.length - 1]];
      } else if (selectedCard.source === 'tableau' && selectedCard.colIdx !== undefined && selectedCard.cardIdx !== undefined) {
        movingCards = tableau[selectedCard.colIdx].slice(selectedCard.cardIdx);
      }

      if (movingCards.length > 0) {
        const bottomMoving = movingCards[0];
        const targetTop = col.length > 0 ? col[col.length - 1] : null;

        // Valid tableau placement: King on empty column OR descending alternate color (e.g. Red 7 on Black 8)
        const isValid = !targetTop
          ? bottomMoving.value === 13 // King
          : targetTop.color !== bottomMoving.color && targetTop.value === bottomMoving.value + 1;

        if (isValid) {
          sounds.playMove();

          // Add to target column
          setTableau(prev => {
            const next = prev.map(c => [...c]);
            next[colIdx].push(...movingCards);

            // Remove from source
            if (selectedCard.source === 'tableau' && selectedCard.colIdx !== undefined) {
              const srcCol = next[selectedCard.colIdx];
              srcCol.splice(selectedCard.cardIdx!);
              if (srcCol.length > 0) {
                srcCol[srcCol.length - 1].faceUp = true;
              }
            }
            return next;
          });

          if (selectedCard.source === 'waste') {
            setWaste(prev => prev.slice(0, prev.length - 1));
          }

          setMovesCount(prev => prev + 1);
          setScore(prev => prev + 5);
          setSelectedCard(null);
          return;
        }
      }
    }

    // Otherwise, select or auto-move card
    if (cardIdx !== undefined && col[cardIdx]?.faceUp) {
      // Double tap to send to foundation
      if (cardIdx === col.length - 1 && tryAutoFoundation(col[cardIdx], colIdx)) {
        return;
      }

      sounds.playClick();
      setSelectedCard({ source: 'tableau', colIdx, cardIdx });
    } else {
      setSelectedCard(null);
    }
  };

  // Click on top waste card
  const handleWasteClick = () => {
    if (waste.length === 0) return;
    const topCard = waste[waste.length - 1];

    if (tryAutoFoundation(topCard)) {
      return;
    }

    sounds.playClick();
    setSelectedCard({ source: 'waste' });
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      score={score}
      scoreLabel="Score"
      highScore={movesCount}
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        
        {/* Top Deck & Foundations Area */}
        <div className="w-full flex items-center justify-between gap-3">
          
          {/* Stockpile & Waste */}
          <div className="flex items-center gap-3">
            {/* Stock Deck */}
            <button
              id="solitaire-stock-deck"
              onClick={handleStockClick}
              className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br from-indigo-700 to-slate-900 border-2 border-indigo-400/50 shadow-xl flex items-center justify-center text-white text-xl cursor-pointer hover:scale-105 transition-transform"
            >
              {stock.length > 0 ? (
                <span className="font-bold font-mono text-xs opacity-80">{stock.length}</span>
              ) : (
                <RotateCcw className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {/* Waste Pile */}
            <div
              id="solitaire-waste-pile"
              onClick={handleWasteClick}
              className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                waste.length > 0
                  ? 'bg-white border-slate-300'
                  : 'bg-slate-900/60 border-slate-800'
              } ${selectedCard?.source === 'waste' ? 'ring-4 ring-indigo-500 scale-105' : ''}`}
            >
              {waste.length > 0 && (
                <div className={`flex flex-col items-center font-bold select-none ${waste[waste.length - 1].color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>
                  <span className="text-sm sm:text-base leading-none">{VALUE_LABELS[waste[waste.length - 1].value]}</span>
                  <span className="text-xl sm:text-2xl leading-none">{waste[waste.length - 1].suit}</span>
                </div>
              )}
            </div>
          </div>

          {/* 4 Foundations (Ace to King) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {foundations.map((pile, idx) => {
              const top = pile.length > 0 ? pile[pile.length - 1] : null;
              return (
                <div
                  key={idx}
                  id={`solitaire-foundation-${idx}`}
                  className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-slate-900/80 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center shadow-inner relative"
                >
                  {top ? (
                    <div className={`w-full h-full rounded-xl bg-white border border-slate-300 shadow flex flex-col items-center justify-center font-bold select-none ${top.color === 'red' ? 'text-rose-600' : 'text-slate-900'}`}>
                      <span className="text-sm sm:text-base leading-none">{VALUE_LABELS[top.value]}</span>
                      <span className="text-xl sm:text-2xl leading-none">{top.suit}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600 text-lg font-bold">A</span>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* 7 Tableau Columns */}
        <div className="w-full grid grid-cols-7 gap-2 sm:gap-3 min-h-[380px] pt-4">
          {tableau.map((col, colIdx) => (
            <div
              key={colIdx}
              id={`solitaire-tableau-col-${colIdx}`}
              onClick={() => handleTableauClick(colIdx)}
              className="relative min-h-[260px] rounded-xl bg-slate-900/30 border border-slate-800/40 p-0.5 flex flex-col items-center cursor-pointer"
            >
              {col.map((card, cardIdx) => {
                const isSelected = selectedCard?.source === 'tableau' && selectedCard.colIdx === colIdx && selectedCard.cardIdx! <= cardIdx;

                return (
                  <div
                    key={card.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTableauClick(colIdx, cardIdx);
                    }}
                    className={`absolute w-full h-24 sm:h-28 rounded-xl border-2 flex flex-col items-start p-1.5 shadow-md select-none transition-all cursor-pointer ${
                      card.faceUp
                        ? 'bg-white border-slate-300'
                        : 'bg-gradient-to-br from-indigo-800 to-slate-900 border-indigo-500/50'
                    } ${isSelected ? 'ring-4 ring-indigo-500 -translate-y-2 z-30' : ''}`}
                    style={{ top: `${cardIdx * 24}px`, zIndex: cardIdx + 1 }}
                  >
                    {card.faceUp && (
                      <div className={`flex flex-col items-center leading-none font-bold ${card.color === 'red' ? 'text-rose-600' : 'text-slate-950'}`}>
                        <span className="text-xs sm:text-sm">{VALUE_LABELS[card.value]}</span>
                        <span className="text-sm sm:text-base">{card.suit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

      </div>

      {/* Victory Banner */}
      <AnimatePresence>
        {isWon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold font-display text-white">
                Solitaire Cleared!
              </h2>
              <p className="text-xs text-slate-300">
                You stacked all 52 cards in {movesCount} moves with a score of {score}!
              </p>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
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
