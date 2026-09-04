import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shuffle, RotateCcw, Check, ArrowDown, ArrowRight, Bot, User, Trophy, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';
import { isValidScrabbleWord, COMMON_WORDS_5 } from '../../data/words';

// Standard letter points
const LETTER_POINTS: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

// Tile bag distribution
const INITIAL_BAG: string[] = [
  ...'AAAAAAAAA', ...'BB', ...'CC', ...'DDDD', ...'EEEEEEEEEEEE',
  ...'FF', ...'GGG', ...'HHHH', ...'IIIIIIIII', ...'J', ...'K',
  ...'LLLL', ...'MM', ...'NNNNNN', ...'OOOOOOOO', ...'PP', ...'Q',
  ...'RRRRRR', ...'SSSS', ...'TTTTTT', ...'UUUU', ...'VV', ...'WW',
  ...'X', ...'YY', ...'Z'
];

type BonusType = 'TW' | 'DW' | 'TL' | 'DL' | 'CENTER' | 'NONE';

interface BoardCell {
  letter: string | null;
  points: number;
  bonus: BonusType;
  isPermanent: boolean; // Committed from prior turns
}

// 15x15 board bonus map
function getBonusAt(r: number, c: number): BonusType {
  if (r === 7 && c === 7) return 'CENTER';

  // Triple Word (TW)
  const twCoords = [
    [0, 0], [0, 7], [0, 14],
    [7, 0],          [7, 14],
    [14, 0], [14, 7], [14, 14]
  ];
  if (twCoords.some(([tr, tc]) => tr === r && tc === c)) return 'TW';

  // Double Word (DW)
  const dwCoords = [
    [1, 1], [2, 2], [3, 3], [4, 4],
    [1, 13], [2, 12], [3, 11], [4, 10],
    [13, 1], [12, 2], [11, 3], [10, 4],
    [13, 13], [12, 12], [11, 11], [10, 10]
  ];
  if (dwCoords.some(([tr, tc]) => tr === r && tc === c)) return 'DW';

  // Triple Letter (TL)
  const tlCoords = [
    [1, 5], [1, 9], [5, 1], [5, 5], [5, 9], [5, 13],
    [9, 1], [9, 5], [9, 9], [9, 13], [13, 5], [13, 9]
  ];
  if (tlCoords.some(([tr, tc]) => tr === r && tc === c)) return 'TL';

  // Double Letter (DL)
  const dlCoords = [
    [0, 3], [0, 11], [2, 6], [2, 8], [3, 0], [3, 7], [3, 14],
    [6, 2], [6, 6], [6, 8], [6, 12], [7, 3], [7, 11],
    [8, 2], [8, 6], [8, 8], [8, 12], [11, 0], [11, 7], [11, 14],
    [12, 6], [12, 8], [14, 3], [14, 11]
  ];
  if (dlCoords.some(([tr, tc]) => tr === r && tc === c)) return 'DL';

  return 'NONE';
}

export const ScrabbleGame: React.FC = () => {
  const gameMeta = getGameById('scrabble')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [bag, setBag] = useState<string[]>(() => [...INITIAL_BAG].sort(() => Math.random() - 0.5));
  const [board, setBoard] = useState<BoardCell[][]>(() => {
    return Array(15).fill(null).map((_, r) =>
      Array(15).fill(null).map((_, c) => ({
        letter: null,
        points: 0,
        bonus: getBonusAt(r, c),
        isPermanent: false,
      }))
    );
  });

  const [playerRack, setPlayerRack] = useState<string[]>([]);
  const [aiRack, setAiRack] = useState<string[]>([]);
  const [selectedRackIndex, setSelectedRackIndex] = useState<number | null>(null);
  const [placedThisTurn, setPlacedThisTurn] = useState<{ r: number; c: number; letter: string; rackIdx: number }[]>([]);
  
  const [scores, setScores] = useState<{ player: number; ai: number }>({ player: 0, ai: 0 });
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [statusMessage, setStatusMessage] = useState<string>('Place letters on the board to form words!');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Initialize initial 7 tiles for player and AI
  useEffect(() => {
    const newBag = [...bag];
    const pTiles = newBag.splice(0, 7);
    const aiTiles = newBag.splice(0, 7);
    setPlayerRack(pTiles);
    setAiRack(aiTiles);
    setBag(newBag);
  }, []);

  // Handle board cell click
  const handleCellClick = (r: number, c: number) => {
    if (turn !== 'player' || isGameOver) return;

    const cell = board[r][c];

    // If cell has a tile placed this turn, recall it
    const placedItem = placedThisTurn.find(p => p.r === r && p.c === c);
    if (placedItem) {
      sounds.playClick();
      // Remove from board
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      newBoard[r][c].letter = null;
      newBoard[r][c].points = 0;
      setBoard(newBoard);

      // Return to rack
      setPlayerRack(prev => [...prev, placedItem.letter]);
      setPlacedThisTurn(prev => prev.filter(p => !(p.r === r && p.c === c)));
      return;
    }

    // Place selected tile from rack
    if (selectedRackIndex !== null && !cell.letter) {
      sounds.playMove();
      const letter = playerRack[selectedRackIndex];

      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      newBoard[r][c].letter = letter;
      newBoard[r][c].points = LETTER_POINTS[letter] || 1;
      setBoard(newBoard);

      // Remove from rack
      setPlayerRack(prev => prev.filter((_, idx) => idx !== selectedRackIndex));
      setPlacedThisTurn(prev => [...prev, { r, c, letter, rackIdx: selectedRackIndex }]);
      setSelectedRackIndex(null);
    }
  };

  // Recall all placed tiles this turn
  const handleRecallTiles = () => {
    if (placedThisTurn.length === 0) return;
    sounds.playClick();
    const recalledLetters = placedThisTurn.map(p => p.letter);
    const newBoard = board.map(row => row.map(cell => ({
      ...cell,
      letter: cell.isPermanent ? cell.letter : null,
      points: cell.isPermanent ? cell.points : 0,
    })));
    setBoard(newBoard);
    setPlayerRack(prev => [...prev, ...recalledLetters]);
    setPlacedThisTurn([]);
    setSelectedRackIndex(null);
  };

  // Shuffle rack tiles
  const handleShuffleRack = () => {
    sounds.playClick();
    setPlayerRack(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  // Submit word turn
  const handleSubmitTurn = () => {
    if (placedThisTurn.length === 0) {
      sounds.playError();
      setStatusMessage('Place at least one letter tile on the board!');
      return;
    }

    // Check if initial play covers center
    const hasCommittedTiles = board.some(row => row.some(cell => cell.isPermanent));
    if (!hasCommittedTiles) {
      const coversCenter = placedThisTurn.some(p => p.r === 7 && p.c === 7);
      if (!coversCenter) {
        sounds.playError();
        setStatusMessage('First word MUST cover the central star (★) square!');
        return;
      }
    }

    // Extract word
    const isHorizontal = placedThisTurn.every(p => p.r === placedThisTurn[0].r);
    const isVertical = placedThisTurn.every(p => p.c === placedThisTurn[0].c);

    if (!isHorizontal && !isVertical && placedThisTurn.length > 1) {
      sounds.playError();
      setStatusMessage('Tiles must be placed in a single continuous row or column!');
      return;
    }

    // Calculate word and score
    let formedWord = '';
    let wordScore = 0;
    let wordMultiplier = 1;

    // Collect full word sequence across contiguous line
    const sorted = [...placedThisTurn].sort((a, b) => isHorizontal ? a.c - b.c : a.r - b.r);
    const lineRow = sorted[0].r;
    const lineCol = sorted[0].c;

    if (isHorizontal) {
      // Find start of continuous word
      let startCol = lineCol;
      while (startCol > 0 && board[lineRow][startCol - 1].letter) startCol--;
      let endCol = lineCol;
      while (endCol < 14 && board[lineRow][endCol + 1].letter) endCol++;

      for (let c = startCol; c <= endCol; c++) {
        const cell = board[lineRow][c];
        const letter = cell.letter || '';
        formedWord += letter;
        let letterScore = LETTER_POINTS[letter] || 1;

        if (!cell.isPermanent) {
          if (cell.bonus === 'DL') letterScore *= 2;
          if (cell.bonus === 'TL') letterScore *= 3;
          if (cell.bonus === 'DW' || cell.bonus === 'CENTER') wordMultiplier *= 2;
          if (cell.bonus === 'TW') wordMultiplier *= 3;
        }
        wordScore += letterScore;
      }
    } else {
      let startRow = lineRow;
      while (startRow > 0 && board[startRow - 1][lineCol].letter) startRow--;
      let endRow = lineRow;
      while (endRow < 14 && board[endRow + 1][lineCol].letter) endRow++;

      for (let r = startRow; r <= endRow; r++) {
        const cell = board[r][lineCol];
        const letter = cell.letter || '';
        formedWord += letter;
        let letterScore = LETTER_POINTS[letter] || 1;

        if (!cell.isPermanent) {
          if (cell.bonus === 'DL') letterScore *= 2;
          if (cell.bonus === 'TL') letterScore *= 3;
          if (cell.bonus === 'DW' || cell.bonus === 'CENTER') wordMultiplier *= 2;
          if (cell.bonus === 'TW') wordMultiplier *= 3;
        }
        wordScore += letterScore;
      }
    }

    wordScore *= wordMultiplier;

    // Validate Word
    if (formedWord.length < 2 || !isValidScrabbleWord(formedWord)) {
      sounds.playError();
      setStatusMessage(`"${formedWord}" is not a recognized dictionary word. Try again!`);
      return;
    }

    // Success! Lock in tiles
    sounds.playScore();
    const newBoard = board.map(row => row.map(cell => ({
      ...cell,
      isPermanent: cell.letter ? true : false,
    })));
    setBoard(newBoard);

    // Refill player rack
    const newBag = [...bag];
    const tilesNeeded = 7 - playerRack.length;
    const drawn = newBag.splice(0, tilesNeeded);
    setPlayerRack(prev => [...prev, ...drawn]);
    setBag(newBag);

    // Award score
    setScores(prev => ({ ...prev, player: prev.player + wordScore }));
    setPlacedThisTurn([]);
    setStatusMessage(`Scored +${wordScore} pts with "${formedWord}"! Bot's turn...`);

    // Advance to AI Turn
    setTurn('ai');
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn === 'ai' && !isGameOver) {
      const timer = setTimeout(() => {
        // AI selects a common valid word from word list
        const aiWord = COMMON_WORDS_5[Math.floor(Math.random() * COMMON_WORDS_5.length)];
        const aiScore = aiWord.split('').reduce((acc, ch) => acc + (LETTER_POINTS[ch] || 1), 0) + 12;

        setScores(prev => ({ ...prev, ai: prev.ai + aiScore }));
        setStatusMessage(`Bot played "${aiWord}" for +${aiScore} points. Your turn!`);
        sounds.playMove();
        setTurn('player');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [turn, isGameOver]);

  // Restart
  const handleRestart = () => {
    const newBag = [...INITIAL_BAG].sort(() => Math.random() - 0.5);
    const pTiles = newBag.splice(0, 7);
    const aiTiles = newBag.splice(0, 7);
    setBag(newBag);
    setPlayerRack(pTiles);
    setAiRack(aiTiles);
    setBoard(Array(15).fill(null).map((_, r) =>
      Array(15).fill(null).map((_, c) => ({
        letter: null,
        points: 0,
        bonus: getBonusAt(r, c),
        isPermanent: false,
      }))
    ));
    setScores({ player: 0, ai: 0 });
    setPlacedThisTurn([]);
    setSelectedRackIndex(null);
    setTurn('player');
    setIsGameOver(false);
    setStatusMessage('New Scrabble board ready! Place your first word.');
  };

  const getBonusStyle = (b: BonusType) => {
    switch (b) {
      case 'TW': return 'bg-rose-600 text-white font-bold';
      case 'DW': return 'bg-pink-500/80 text-white font-bold';
      case 'TL': return 'bg-blue-600 text-white font-bold';
      case 'DL': return 'bg-sky-500/80 text-white font-bold';
      case 'CENTER': return 'bg-amber-500 text-slate-950 font-bold';
      default: return 'bg-slate-800/80 text-slate-400';
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={handleRestart}
      score={scores.player}
      scoreLabel="Your Score"
      turnText={turn === 'player' ? 'Your Turn' : 'Bot AI Thinking...'}
      turnColor={turn === 'player' ? 'text-indigo-400' : 'text-amber-400'}
    >
      <div className="w-full max-w-5xl flex flex-col xl:flex-row items-center justify-center gap-6">
        
        {/* 15x15 Scrabble Board */}
        <div className="p-2 sm:p-4 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl flex flex-col items-center">
          
          <div className="grid grid-cols-15 grid-rows-15 w-[330px] h-[330px] sm:w-[480px] sm:h-[480px] md:w-[530px] md:h-[530px] bg-slate-950 rounded-xl overflow-hidden border border-slate-750 shadow-inner">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isTempPlaced = placedThisTurn.some(p => p.r === r && p.c === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    id={`scrabble-cell-${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`border border-slate-800/60 flex flex-col items-center justify-center relative select-none transition-all cursor-pointer ${
                      cell.letter
                        ? isTempPlaced
                          ? 'bg-amber-300 text-slate-950 ring-2 ring-indigo-400 shadow-md font-bold'
                          : 'bg-amber-100 text-slate-950 font-bold'
                        : getBonusStyle(cell.bonus)
                    }`}
                  >
                    {cell.letter ? (
                      <>
                        <span className="text-xs sm:text-base md:text-lg font-bold font-display leading-none">
                          {cell.letter}
                        </span>
                        <span className="text-[7px] sm:text-[9px] font-mono leading-none opacity-80">
                          {cell.points}
                        </span>
                      </>
                    ) : (
                      <span className="text-[7px] sm:text-[9px] font-extrabold uppercase tracking-tighter opacity-90">
                        {cell.bonus === 'CENTER' ? '★' : cell.bonus === 'NONE' ? '' : cell.bonus}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Status Message */}
          <div className="mt-3 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-indigo-300 text-center max-w-md w-full">
            {statusMessage}
          </div>

        </div>

        {/* Right Side: Player Rack & Turn Action Station */}
        <div className="w-full xl:w-80 space-y-4">
          
          {/* Scoreboard */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Scoreboard
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-400">You (Human)</span>
                <p className="text-2xl font-bold font-display text-white mt-0.5">{scores.player}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-400">Bot AI</span>
                <p className="text-2xl font-bold font-display text-amber-300 mt-0.5">{scores.ai}</p>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              Tiles in Bag: <strong className="text-slate-200">{bag.length}</strong>
            </div>
          </div>

          {/* Player Letter Rack */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-900 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                Your Tile Rack
              </h4>
              <button
                onClick={handleShuffleRack}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Shuffle Rack Tiles"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 7-tile Wooden Style Rack */}
            <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/50 shadow-inner flex items-center justify-center gap-1.5 sm:gap-2">
              {playerRack.map((letter, idx) => {
                const isSelected = selectedRackIndex === idx;
                return (
                  <button
                    key={idx}
                    id={`rack-tile-${idx}`}
                    onClick={() => {
                      sounds.playClick();
                      setSelectedRackIndex(isSelected ? null : idx);
                    }}
                    className={`w-9 h-11 sm:w-10 sm:h-12 rounded-lg bg-amber-100 text-slate-950 border-2 flex flex-col items-center justify-center shadow-md transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 -translate-y-2 ring-4 ring-indigo-400/50 scale-105'
                        : 'border-amber-300 hover:-translate-y-0.5'
                    }`}
                  >
                    <span className="font-display font-extrabold text-sm sm:text-base leading-none">
                      {letter}
                    </span>
                    <span className="font-mono text-[9px] leading-none opacity-80">
                      {LETTER_POINTS[letter] || 1}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions: Submit / Recall / Pass */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                id="scrabble-submit-btn"
                onClick={handleSubmitTurn}
                disabled={turn !== 'player'}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Submit Word
              </button>
              <button
                id="scrabble-recall-btn"
                onClick={handleRecallTiles}
                disabled={placedThisTurn.length === 0}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Recall Tiles
              </button>
            </div>
          </div>

        </div>

      </div>
    </GameContainer>
  );
};
