import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, RotateCcw, Bot, User, Trophy, Shield, Sparkles } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

interface PlayerConfig {
  color: PlayerColor;
  name: string;
  isAI: boolean;
  active: boolean;
}

interface Token {
  id: number;
  color: PlayerColor;
  // -1 = In Yard, 0..50 = Main Track (relative step from own start), 51..55 = Home Stretch, 56 = Finished Home
  step: number; 
}

const COLOR_THEMES: Record<PlayerColor, {
  bg: string;
  border: string;
  text: string;
  fill: string;
  ring: string;
  startTrackIndex: number;
}> = {
  red: { bg: 'bg-red-500', border: 'border-red-400', text: 'text-red-400', fill: '#ef4444', ring: 'ring-red-400', startTrackIndex: 0 },
  green: { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-emerald-400', fill: '#10b981', ring: 'ring-emerald-400', startTrackIndex: 13 },
  yellow: { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-amber-300', fill: '#f59e0b', ring: 'ring-amber-300', startTrackIndex: 26 },
  blue: { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400', fill: '#3b82f6', ring: 'ring-blue-400', startTrackIndex: 39 },
};

// Safe track indexes (0-based relative to global 52 track squares)
const GLOBAL_SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export const LudoGame: React.FC = () => {
  const gameMeta = getGameById('ludo')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [players, setPlayers] = useState<PlayerConfig[]>([
    { color: 'red', name: 'Player 1 (You)', isAI: false, active: true },
    { color: 'green', name: 'Bot Emma', isAI: true, active: true },
    { color: 'yellow', name: 'Bot Jack', isAI: true, active: true },
    { color: 'blue', name: 'Bot Luna', isAI: true, active: true },
  ]);

  const [tokens, setTokens] = useState<Token[]>(() => {
    const list: Token[] = [];
    const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    colors.forEach(col => {
      for (let i = 0; i < 4; i++) {
        list.push({ id: list.length, color: col, step: -1 });
      }
    });
    return list;
  });

  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [turnMessage, setTurnMessage] = useState<string>('Roll the dice to start!');

  const activePlayers = players.filter(p => p.active);
  const currentPlayer = activePlayers[currentTurnIndex] || activePlayers[0];

  // Global track cell coordinates on 15x15 grid
  const TRACK_COORDINATES: { r: number; c: number }[] = [
    // Red start & stretch: Top row of bottom-left
    { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
    // Turn up
    { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
    { r: 0, c: 7 }, { r: 0, c: 8 }, // Top peak
    // Turn down (Green side)
    { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
    { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
    { r: 7, c: 14 }, { r: 8, c: 14 }, // Right peak
    // Turn left (Yellow side)
    { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
    { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
    { r: 14, c: 7 }, { r: 14, c: 6 }, // Bottom peak
    // Turn up (Blue side)
    { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
    { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
    { r: 7, c: 0 }, { r: 6, c: 0 } // Left peak
  ];

  // Home stretch coordinates
  const HOME_STRETCH_COORDINATES: Record<PlayerColor, { r: number; c: number }[]> = {
    red: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }],
    green: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }],
    yellow: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }],
    blue: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }],
  };

  // Yard token base coordinates
  const YARD_TOKEN_COORDINATES: Record<PlayerColor, { r: number; c: number }[]> = {
    red: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }],
    green: [{ r: 2, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 11 }, { r: 3, c: 12 }],
    yellow: [{ r: 11, c: 11 }, { r: 11, c: 12 }, { r: 12, c: 11 }, { r: 12, c: 12 }],
    blue: [{ r: 11, c: 2 }, { r: 11, c: 3 }, { r: 12, c: 2 }, { r: 12, c: 3 }],
  };

  // Convert token step to global grid (r, c)
  const getTokenGridPosition = (token: Token): { r: number; c: number } => {
    if (token.step === -1) {
      // In Yard
      const yardIndex = token.id % 4;
      return YARD_TOKEN_COORDINATES[token.color][yardIndex];
    }
    if (token.step === 56) {
      // Finished center home
      return { r: 7, c: 7 };
    }
    if (token.step >= 51 && token.step <= 55) {
      // Home stretch
      const stretchIdx = token.step - 51;
      return HOME_STRETCH_COORDINATES[token.color][stretchIdx];
    }
    // Main track
    const offset = COLOR_THEMES[token.color].startTrackIndex;
    const globalIndex = (offset + token.step) % 52;
    return TRACK_COORDINATES[globalIndex] || { r: 7, c: 7 };
  };

  // Check valid moves for a token with the rolled dice
  const isValidMove = (token: Token, roll: number): boolean => {
    if (token.color !== currentPlayer.color) return false;
    if (token.step === 56) return false; // Already home
    if (token.step === -1) return roll === 6; // Needs 6 to exit yard
    if (token.step + roll > 56) return false; // Cannot overshoot 56
    return true;
  };

  // Get all movable tokens for current player with current dice roll
  const getMovableTokens = (roll: number): Token[] => {
    return tokens.filter(t => isValidMove(t, roll));
  };

  // Move a token
  const handleMoveToken = (token: Token) => {
    if (!hasRolled || diceValue === null || !isValidMove(token, diceValue)) {
      sounds.playError();
      return;
    }

    sounds.playMove();

    let nextStep = token.step;
    if (token.step === -1 && diceValue === 6) {
      nextStep = 0; // Move into starting track
    } else {
      nextStep = token.step + diceValue;
    }

    let capturedOpponent = false;

    // Check for capturing opponent token if on main track (0..50)
    let updatedTokens = tokens.map(t => {
      if (t.id === token.id) {
        return { ...t, step: nextStep };
      }
      return t;
    });

    if (nextStep >= 0 && nextStep <= 50) {
      const offset = COLOR_THEMES[token.color].startTrackIndex;
      const globalTargetIndex = (offset + nextStep) % 52;

      // Safe square check
      const isSafe = GLOBAL_SAFE_INDICES.includes(globalTargetIndex);

      if (!isSafe) {
        updatedTokens = updatedTokens.map(t => {
          if (t.color !== token.color && t.step >= 0 && t.step <= 50) {
            const oppOffset = COLOR_THEMES[t.color].startTrackIndex;
            const oppGlobalIndex = (oppOffset + t.step) % 52;
            if (oppGlobalIndex === globalTargetIndex) {
              capturedOpponent = true;
              sounds.playScore();
              return { ...t, step: -1 }; // Send back to yard
            }
          }
          return t;
        });
      }
    }

    setTokens(updatedTokens);

    // Check for win condition
    const playerTokens = updatedTokens.filter(t => t.color === currentPlayer.color);
    const finishedCount = playerTokens.filter(t => t.step === 56).length;

    if (finishedCount === 4) {
      setWinner(currentPlayer.color);
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('ludo', !currentPlayer.isAI, 500, 180);
      return;
    }

    // Next turn logic: Extra roll if rolled 6 or captured opponent or got token home (step === 56)
    const getsExtraRoll = diceValue === 6 || capturedOpponent || nextStep === 56;

    if (getsExtraRoll) {
      setTurnMessage(`${currentPlayer.name} gets a bonus roll! 🎲`);
      setHasRolled(false);
      setDiceValue(null);
    } else {
      advanceTurn();
    }
  };

  const advanceTurn = () => {
    setHasRolled(false);
    setDiceValue(null);
    const nextIdx = (currentTurnIndex + 1) % activePlayers.length;
    setCurrentTurnIndex(nextIdx);
    setTurnMessage(`${activePlayers[nextIdx].name}'s turn!`);
  };

  // Roll dice action
  const handleRollDice = () => {
    if (isRolling || hasRolled || winner) return;

    setIsRolling(true);
    sounds.playDice();

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);
      setIsRolling(false);
      setHasRolled(true);

      const movable = getMovableTokens(roll);
      if (movable.length === 0) {
        setTurnMessage(`No valid moves with ${roll}. Passing turn...`);
        setTimeout(() => {
          advanceTurn();
        }, 1200);
      } else if (movable.length === 1 && !currentPlayer.isAI) {
        // Auto-move single valid token for smooth UX
        setTurnMessage(`Moving token automatically (+${roll})...`);
        setTimeout(() => {
          handleMoveToken(movable[0]);
        }, 600);
      } else {
        setTurnMessage(`Select a token to move (${roll} spaces).`);
      }
    }, 450);
  };

  // AI Turn Handling
  useEffect(() => {
    if (!winner && currentPlayer.isAI && !isRolling) {
      if (!hasRolled) {
        const timer = setTimeout(() => {
          handleRollDice();
        }, 800);
        return () => clearTimeout(timer);
      } else if (diceValue !== null) {
        const timer = setTimeout(() => {
          const movable = getMovableTokens(diceValue);
          if (movable.length > 0) {
            // Smart AI heuristic: Prefer capturing > entering board on 6 > advancing furthest token
            const capturingToken = movable.find(tok => {
              const nextStep = tok.step === -1 ? 0 : tok.step + diceValue;
              if (nextStep >= 0 && nextStep <= 50) {
                const off = COLOR_THEMES[tok.color].startTrackIndex;
                const targetIdx = (off + nextStep) % 52;
                return !GLOBAL_SAFE_INDICES.includes(targetIdx) && tokens.some(other => {
                  if (other.color !== tok.color && other.step >= 0 && other.step <= 50) {
                    const otherOff = COLOR_THEMES[other.color].startTrackIndex;
                    return (otherOff + other.step) % 52 === targetIdx;
                  }
                  return false;
                });
              }
              return false;
            });

            const exitYardToken = movable.find(tok => tok.step === -1 && diceValue === 6);
            const furthestToken = [...movable].sort((a, b) => b.step - a.step)[0];

            const chosen = capturingToken || exitYardToken || furthestToken;
            if (chosen) {
              handleMoveToken(chosen);
            }
          }
        }, 900);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPlayer, hasRolled, isRolling, diceValue, winner]);

  // Restart game
  const handleRestart = () => {
    setTokens(() => {
      const list: Token[] = [];
      const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
      colors.forEach(col => {
        for (let i = 0; i < 4; i++) {
          list.push({ id: list.length, color: col, step: -1 });
        }
      });
      return list;
    });
    setCurrentTurnIndex(0);
    setDiceValue(null);
    setHasRolled(false);
    setIsRolling(false);
    setWinner(null);
    setTurnMessage('New game started! Roll the dice.');
  };

  const getDiceIcon = (val: number | null) => {
    switch (val) {
      case 1: return <Dice1 className="w-10 h-10 text-white" />;
      case 2: return <Dice2 className="w-10 h-10 text-white" />;
      case 3: return <Dice3 className="w-10 h-10 text-white" />;
      case 4: return <Dice4 className="w-10 h-10 text-white" />;
      case 5: return <Dice5 className="w-10 h-10 text-white" />;
      case 6: return <Dice6 className="w-10 h-10 text-white" />;
      default: return <Dice5 className="w-10 h-10 text-slate-500" />;
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={handleRestart}
      turnText={currentPlayer.name}
      turnColor={COLOR_THEMES[currentPlayer.color].text}
    >
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-6">
        
        {/* Main 15x15 Ludo Board */}
        <div className="relative p-2.5 sm:p-4 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl flex flex-col items-center">
          
          {/* Ludo Grid 15x15 */}
          <div className="relative grid grid-cols-15 grid-rows-15 w-[330px] h-[330px] sm:w-[450px] sm:h-[450px] md:w-[500px] md:h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            
            {/* Top-Left Red Yard Base */}
            <div className="col-span-6 row-span-6 bg-red-600/90 border-r-2 border-b-2 border-slate-900 p-3 flex flex-col justify-between relative">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-100 flex items-center gap-1">
                Red Yard
              </span>
              <div className="w-full h-3/4 bg-slate-950/80 rounded-xl border border-red-400/40 p-2 grid grid-cols-2 gap-2 place-items-center">
                {/* Yard cells */}
              </div>
            </div>

            {/* Top-Center Green Arm Track */}
            <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-b-2 border-slate-900">
              {Array.from({ length: 18 }).map((_, i) => {
                const col = i % 3;
                const isHomePath = col === 1;
                const isStart = i === 4; // Green start cell
                return (
                  <div
                    key={i}
                    className={`border border-slate-800/80 flex items-center justify-center text-[10px] ${
                      isHomePath ? 'bg-emerald-600/80' : isStart ? 'bg-emerald-500/90 font-bold' : 'bg-slate-900/60'
                    }`}
                  >
                    {isStart && '★'}
                  </div>
                );
              })}
            </div>

            {/* Top-Right Green Yard Base */}
            <div className="col-span-6 row-span-6 bg-emerald-600/90 border-l-2 border-b-2 border-slate-900 p-3 flex flex-col justify-between relative">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100 flex items-center gap-1">
                Green Yard
              </span>
              <div className="w-full h-3/4 bg-slate-950/80 rounded-xl border border-emerald-400/40 p-2 grid grid-cols-2 gap-2 place-items-center">
                {/* Yard cells */}
              </div>
            </div>

            {/* Left Red Arm Track */}
            <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-r-2 border-slate-900">
              {Array.from({ length: 18 }).map((_, i) => {
                const row = Math.floor(i / 6);
                const isHomePath = row === 1;
                const isStart = i === 1; // Red start cell
                return (
                  <div
                    key={i}
                    className={`border border-slate-800/80 flex items-center justify-center text-[10px] ${
                      isHomePath ? 'bg-red-600/80' : isStart ? 'bg-red-500/90 font-bold' : 'bg-slate-900/60'
                    }`}
                  >
                    {isStart && '★'}
                  </div>
                );
              })}
            </div>

            {/* Center Home Triangle Finish */}
            <div className="col-span-3 row-span-3 bg-slate-900 relative overflow-hidden flex items-center justify-center border border-slate-750">
              <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_50%_50%,#ef4444_0deg_90deg,#f59e0b_90deg_180deg,#3b82f6_180deg_270deg,#10b981_270deg_360deg)] opacity-80" />
              <div className="w-8 h-8 rounded-full bg-slate-950 border border-white/40 flex items-center justify-center z-10 shadow-lg">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            {/* Right Yellow Arm Track */}
            <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 border-l-2 border-slate-900">
              {Array.from({ length: 18 }).map((_, i) => {
                const row = Math.floor(i / 6);
                const isHomePath = row === 1;
                const isStart = i === 16; // Yellow start cell
                return (
                  <div
                    key={i}
                    className={`border border-slate-800/80 flex items-center justify-center text-[10px] ${
                      isHomePath ? 'bg-amber-500/80' : isStart ? 'bg-amber-400/90 font-bold text-slate-950' : 'bg-slate-900/60'
                    }`}
                  >
                    {isStart && '★'}
                  </div>
                );
              })}
            </div>

            {/* Bottom-Left Blue Yard Base */}
            <div className="col-span-6 row-span-6 bg-blue-600/90 border-r-2 border-t-2 border-slate-900 p-3 flex flex-col justify-between relative">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-100 flex items-center gap-1">
                Blue Yard
              </span>
              <div className="w-full h-3/4 bg-slate-950/80 rounded-xl border border-blue-400/40 p-2 grid grid-cols-2 gap-2 place-items-center">
                {/* Yard cells */}
              </div>
            </div>

            {/* Bottom-Center Blue Arm Track */}
            <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 border-t-2 border-slate-900">
              {Array.from({ length: 18 }).map((_, i) => {
                const col = i % 3;
                const isHomePath = col === 1;
                const isStart = i === 13; // Blue start cell
                return (
                  <div
                    key={i}
                    className={`border border-slate-800/80 flex items-center justify-center text-[10px] ${
                      isHomePath ? 'bg-blue-600/80' : isStart ? 'bg-blue-500/90 font-bold' : 'bg-slate-900/60'
                    }`}
                  >
                    {isStart && '★'}
                  </div>
                );
              })}
            </div>

            {/* Bottom-Right Yellow Yard Base */}
            <div className="col-span-6 row-span-6 bg-amber-500/90 border-l-2 border-t-2 border-slate-900 p-3 flex flex-col justify-between relative">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-950 flex items-center gap-1 font-bold">
                Yellow Yard
              </span>
              <div className="w-full h-3/4 bg-slate-950/80 rounded-xl border border-amber-300/40 p-2 grid grid-cols-2 gap-2 place-items-center">
                {/* Yard cells */}
              </div>
            </div>

            {/* Animated Rendered Token Pieces Over 15x15 Grid */}
            {tokens.map(token => {
              const pos = getTokenGridPosition(token);
              const isMovable = hasRolled && diceValue !== null && isValidMove(token, diceValue);
              const theme = COLOR_THEMES[token.color];

              return (
                <motion.div
                  key={token.id}
                  id={`ludo-token-${token.id}`}
                  onClick={() => handleMoveToken(token)}
                  animate={{
                    gridColumnStart: pos.c + 1,
                    gridRowStart: pos.r + 1,
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`relative z-20 w-5 h-5 sm:w-7 sm:h-7 rounded-full ${theme.bg} border-2 border-white flex items-center justify-center shadow-lg transition-transform ${
                    isMovable
                      ? 'cursor-pointer animate-bounce scale-110 ring-4 ring-white shadow-white/50 z-30'
                      : 'cursor-default'
                  }`}
                  style={{ margin: 'auto' }}
                  title={`${token.color} Token (Step: ${token.step})`}
                >
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white shadow-inner" />
                </motion.div>
              );
            })}

          </div>

          {/* Turn Message & Alert */}
          <div className="mt-3 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 text-center max-w-sm w-full">
            {turnMessage}
          </div>

        </div>

        {/* Right Side Control Panel & Dice Station */}
        <div className="w-full lg:w-72 space-y-4">
          
          {/* Active Player Station */}
          <div className={`p-5 rounded-2xl bg-slate-900 border-2 ${COLOR_THEMES[currentPlayer.color].border} shadow-xl flex flex-col items-center text-center space-y-3`}>
            
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${COLOR_THEMES[currentPlayer.color].bg} shadow`} />
              <h3 className="font-display font-bold text-base text-white">
                {currentPlayer.name}
              </h3>
              {currentPlayer.isAI && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300">
                  AI
                </span>
              )}
            </div>

            {/* Interactive Dice Cup / Roll Button */}
            <div className="relative my-2">
              <button
                id="ludo-roll-dice-btn"
                disabled={isRolling || hasRolled || !!winner || currentPlayer.isAI}
                onClick={handleRollDice}
                className={`w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/50 flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer ${
                  !hasRolled && !currentPlayer.isAI && !winner
                    ? 'hover:scale-105 hover:border-indigo-400 hover:shadow-indigo-500/40 ring-4 ring-indigo-500/20'
                    : 'opacity-85'
                }`}
              >
                <motion.div
                  animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 0.9, 1] } : {}}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                >
                  {getDiceIcon(diceValue)}
                </motion.div>
                <span className="text-[10px] uppercase font-bold text-indigo-300 mt-1">
                  {isRolling ? 'Rolling...' : diceValue ? `Rolled: ${diceValue}` : 'Roll Dice'}
                </span>
              </button>
            </div>

            {/* Player Progress Counters */}
            <div className="w-full grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800 text-center">
              {players.map(p => {
                const homeTokens = tokens.filter(t => t.color === p.color && t.step === 56).length;
                return (
                  <div key={p.color} className="p-1.5 rounded-lg bg-slate-950/70 border border-slate-800">
                    <div className={`w-2.5 h-2.5 rounded-full ${COLOR_THEMES[p.color].bg} mx-auto mb-1`} />
                    <span className="text-[10px] font-bold text-slate-200">{homeTokens}/4</span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Seat Player Settings (Human vs AI toggle) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Player Seats & AI
            </h4>
            <div className="space-y-1.5">
              {players.map((p, idx) => (
                <div key={p.color} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${COLOR_THEMES[p.color].bg}`} />
                    <span className="font-semibold text-slate-200">{p.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setPlayers(prev => prev.map((pl, i) => i === idx ? { ...pl, isAI: !pl.isAI } : pl));
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                      p.isAI ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/40' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {p.isAI ? 'Bot (AI)' : 'Human'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {winner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950 to-slate-900 border-2 border-indigo-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto glow-amber">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>

              <h2 className="text-2xl font-extrabold font-display text-white">
                {players.find(p => p.color === winner)?.name} Wins!
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed">
                All 4 tokens reached home safely! Victory achieved in Ludo Classic.
              </p>

              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/40 transition-colors cursor-pointer"
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
