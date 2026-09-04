import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Bot, User, RotateCcw, Sparkles } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type PieceColor = 'red' | 'black';

interface Piece {
  id: number;
  color: PieceColor;
  isKing: boolean;
}

type BoardState = (Piece | null)[][];

interface MoveOption {
  from: { r: number; c: number };
  to: { r: number; c: number };
  jumped?: { r: number; c: number };
}

function getInitialCheckersBoard(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
  let id = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 1) {
        if (r < 3) {
          board[r][c] = { id: id++, color: 'black', isKing: false };
        } else if (r > 4) {
          board[r][c] = { id: id++, color: 'red', isKing: false };
        }
      }
    }
  }
  return board;
}

export const CheckersGame: React.FC = () => {
  const gameMeta = getGameById('checkers')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [board, setBoard] = useState<BoardState>(getInitialCheckersBoard);
  const [turn, setTurn] = useState<PieceColor>('red');
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<MoveOption[]>([]);
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [winner, setWinner] = useState<PieceColor | null>(null);

  const getMovesForPiece = (b: BoardState, r: number, c: number): MoveOption[] => {
    const piece = b[r][c];
    if (!piece) return [];
    const moves: MoveOption[] = [];
    const opp = piece.color === 'red' ? 'black' : 'red';

    const forwardDirs = piece.color === 'red' ? [-1] : [1];
    const dirs = piece.isKing ? [-1, 1] : forwardDirs;

    dirs.forEach(dr => {
      [-1, 1].forEach(dc => {
        const tr = r + dr;
        const tc = c + dc;

        // Normal 1-step move
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && !b[tr][tc]) {
          moves.push({ from: { r, c }, to: { r: tr, c: tc } });
        }

        // Jump capture 2-step move
        const jr = r + 2 * dr;
        const jc = c + 2 * dc;
        if (
          jr >= 0 && jr < 8 && jc >= 0 && jc < 8 &&
          !b[jr][jc] &&
          b[tr]?.[tc]?.color === opp
        ) {
          moves.push({ from: { r, c }, to: { r: jr, c: jc }, jumped: { r: tr, c: tc } });
        }
      });
    });

    return moves;
  };

  const getAllMovesForColor = (b: BoardState, color: PieceColor): MoveOption[] => {
    const all: MoveOption[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.color === color) {
          all.push(...getMovesForPiece(b, r, c));
        }
      }
    }
    // Checkers rule: if any jumps exist, must jump
    const jumps = all.filter(m => m.jumped);
    return jumps.length > 0 ? jumps : all;
  };

  const handleCellClick = (r: number, c: number) => {
    if (winner || (isVsAI && turn === 'black')) return;

    const clicked = board[r][c];

    // If destination selected
    if (selectedPos) {
      const matchMove = validMoves.find(m => m.to.r === r && m.to.c === c);
      if (matchMove) {
        executeMove(matchMove);
        return;
      }
    }

    // Select piece
    if (clicked && clicked.color === turn) {
      sounds.playClick();
      setSelectedPos({ r, c });
      const available = getMovesForPiece(board, r, c);
      setValidMoves(available);
    } else {
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  const executeMove = (mv: MoveOption) => {
    sounds.playMove();

    const piece = board[mv.from.r][mv.from.c]!;
    const nextBoard = board.map(row => [...row]);

    // Kinging condition
    const crowned = piece.isKing || (piece.color === 'red' && mv.to.r === 0) || (piece.color === 'black' && mv.to.r === 7);

    nextBoard[mv.to.r][mv.to.c] = { ...piece, isKing: crowned };
    nextBoard[mv.from.r][mv.from.c] = null;

    if (mv.jumped) {
      sounds.playScore();
      nextBoard[mv.jumped.r][mv.jumped.c] = null;
    }

    setBoard(nextBoard);
    setSelectedPos(null);
    setValidMoves([]);

    const nextTurn = turn === 'red' ? 'black' : 'red';
    setTurn(nextTurn);

    // Check Win Condition
    const opponentMoves = getAllMovesForColor(nextBoard, nextTurn);
    if (opponentMoves.length === 0) {
      setWinner(turn);
      sounds.playWin();
      triggerConfetti();
      recordGamePlayed('checkers', turn === 'red', 400, 120);
    }
  };

  // AI Opponent Move
  useEffect(() => {
    if (isVsAI && turn === 'black' && !winner) {
      const timer = setTimeout(() => {
        const moves = getAllMovesForColor(board, 'black');
        if (moves.length > 0) {
          // Prefer jumps
          const jumps = moves.filter(m => m.jumped);
          const chosen = jumps.length > 0 ? jumps[0] : moves[Math.floor(Math.random() * moves.length)];
          executeMove(chosen);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [turn, isVsAI, board, winner]);

  const initGame = () => {
    setBoard(getInitialCheckersBoard());
    setTurn('red');
    setSelectedPos(null);
    setValidMoves([]);
    setWinner(null);
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      turnText={winner ? 'Match Ended' : turn === 'red' ? 'Red (You)' : isVsAI ? 'Black (AI)' : 'Black (Player 2)'}
      turnColor={turn === 'red' ? 'text-rose-400' : 'text-slate-300'}
    >
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-6">
        
        {/* 8x8 Checkers Board */}
        <div className="p-3 sm:p-5 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl flex flex-col items-center">
          <div className="grid grid-cols-8 grid-rows-8 w-[310px] h-[310px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] rounded-2xl overflow-hidden border-2 border-slate-750 shadow-2xl">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedPos?.r === r && selectedPos?.c === c;
                const isValidDest = validMoves.some(m => m.to.r === r && m.to.c === c);

                return (
                  <button
                    key={`${r}-${c}`}
                    id={`checkers-sq-${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    className={`relative flex items-center justify-center select-none transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/90'
                        : isDark
                        ? 'bg-slate-800'
                        : 'bg-slate-700/60'
                    }`}
                  >
                    {cell && (
                      <div
                        className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${
                          cell.color === 'red'
                            ? 'bg-gradient-to-tr from-rose-600 to-rose-400 border-rose-200'
                            : 'bg-gradient-to-tr from-slate-950 to-slate-900 border-slate-600'
                        }`}
                      >
                        {cell.isKing && (
                          <Crown className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                        )}
                      </div>
                    )}

                    {isValidDest && (
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/60" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Settings Card */}
        <div className="w-full md:w-64 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Checkers Mode
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setIsVsAI(true); initGame(); }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isVsAI ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Play AI
              </button>
              <button
                onClick={() => { setIsVsAI(false); initGame(); }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  !isVsAI ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-950 text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                2P Local
              </button>
            </div>
          </div>
        </div>

      </div>

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
              <h2 className="text-2xl font-bold font-display text-white capitalize">
                {winner} Conquered the Board!
              </h2>
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
