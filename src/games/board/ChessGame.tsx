import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, RotateCcw, Bot, User, Trophy, ShieldAlert, Sparkles, Volume2 } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  hasMoved?: boolean;
}

type BoardState = (ChessPiece | null)[][];

interface Move {
  from: { r: number; c: number };
  to: { r: number; c: number };
  piece: ChessPiece;
  captured?: ChessPiece | null;
  isEnPassant?: boolean;
  isCastling?: 'king' | 'queen';
  promotion?: PieceType;
}

// Unicode / High quality display pieces
const PIECE_SYMBOLS: Record<PieceColor, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Initial Standard Chess Board setup
function getInitialBoard(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));

  const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRank[c], color: 'b' };
    board[1][c] = { type: 'p', color: 'b' };
    board[6][c] = { type: 'p', color: 'w' };
    board[7][c] = { type: backRank[c], color: 'w' };
  }
  return board;
}

export const ChessGame: React.FC = () => {
  const gameMeta = getGameById('chess')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const [board, setBoard] = useState<BoardState>(getInitialBoard);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedSquare, setSelectedSquare] = useState<{ r: number; c: number } | null>(null);
  const [validMoves, setValidMoves] = useState<{ r: number; c: number }[]>([]);
  const [lastMove, setLastMove] = useState<{ from: { r: number; c: number }; to: { r: number; c: number } } | null>(null);
  const [capturedPieces, setCapturedPieces] = useState<{ w: ChessPiece[]; b: ChessPiece[] }>({ w: [], b: [] });
  const [isVsAI, setIsVsAI] = useState<boolean>(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isThinkingAI, setIsThinkingAI] = useState<boolean>(false);
  const [inCheck, setInCheck] = useState<PieceColor | null>(null);
  const [gameOverResult, setGameOverResult] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: { r: number; c: number }; to: { r: number; c: number } } | null>(null);

  // Check if position is inside 8x8 board
  const isInside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

  // Generate pseudo-legal moves without check validation
  const getPseudoMoves = useCallback((b: BoardState, r: number, c: number, checkCastle: boolean = true): { r: number; c: number }[] => {
    const piece = b[r][c];
    if (!piece) return [];
    const moves: { r: number; c: number }[] = [];
    const { type, color } = piece;
    const opp = color === 'w' ? 'b' : 'w';

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;

      // 1 square forward
      if (isInside(r + dir, c) && !b[r + dir][c]) {
        moves.push({ r: r + dir, c });
        // 2 squares forward from start
        if (r === startRow && isInside(r + 2 * dir, c) && !b[r + 2 * dir][c]) {
          moves.push({ r: r + 2 * dir, c });
        }
      }

      // Diagonal captures
      [-1, 1].forEach(dc => {
        const tr = r + dir;
        const tc = c + dc;
        if (isInside(tr, tc) && b[tr][tc] && b[tr][tc]?.color === opp) {
          moves.push({ r: tr, c: tc });
        }
      });
    } else if (type === 'n') {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      knightOffsets.forEach(([dr, dc]) => {
        const tr = r + dr;
        const tc = c + dc;
        if (isInside(tr, tc)) {
          if (!b[tr][tc] || b[tr][tc]?.color === opp) {
            moves.push({ r: tr, c: tc });
          }
        }
      });
    } else if (type === 'b' || type === 'r' || type === 'q') {
      const directions: [number, number][] = [];
      if (type === 'b' || type === 'q') {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (type === 'r' || type === 'q') {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      directions.forEach(([dr, dc]) => {
        let tr = r + dr;
        let tc = c + dc;
        while (isInside(tr, tc)) {
          if (!b[tr][tc]) {
            moves.push({ r: tr, c: tc });
          } else {
            if (b[tr][tc]?.color === opp) {
              moves.push({ r: tr, c: tc });
            }
            break;
          }
          tr += dr;
          tc += dc;
        }
      });
    } else if (type === 'k') {
      const kingOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      kingOffsets.forEach(([dr, dc]) => {
        const tr = r + dr;
        const tc = c + dc;
        if (isInside(tr, tc) && (!b[tr][tc] || b[tr][tc]?.color === opp)) {
          moves.push({ r: tr, c: tc });
        }
      });

      // Castling (Kingside & Queenside)
      if (checkCastle && !piece.hasMoved) {
        const rank = color === 'w' ? 7 : 0;
        if (r === rank && c === 4) {
          // Kingside (c=5,6 empty, rook at c=7 has not moved)
          const rookK = b[rank][7];
          if (rookK && rookK.type === 'r' && !rookK.hasMoved && !b[rank][5] && !b[rank][6]) {
            moves.push({ r: rank, c: 6 });
          }
          // Queenside (c=1,2,3 empty, rook at c=0 has not moved)
          const rookQ = b[rank][0];
          if (rookQ && rookQ.type === 'r' && !rookQ.hasMoved && !b[rank][1] && !b[rank][2] && !b[rank][3]) {
            moves.push({ r: rank, c: 2 });
          }
        }
      }
    }

    return moves;
  }, []);

  // Check if king of specific color is under attack
  const isKingInCheck = useCallback((b: BoardState, color: PieceColor): boolean => {
    let kingPos: { r: number; c: number } | null = null;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p && p.type === 'k' && p.color === color) {
          kingPos = { r, c };
          break;
        }
      }
      if (kingPos) break;
    }

    if (!kingPos) return true; // King missing is check

    const opp = color === 'w' ? 'b' : 'w';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p && p.color === opp) {
          const attacks = getPseudoMoves(b, r, c, false);
          if (attacks.some(m => m.r === kingPos!.r && m.c === kingPos!.c)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [getPseudoMoves]);

  // Generate strictly legal moves (filtered by leaving King in check)
  const getLegalMoves = useCallback((b: BoardState, r: number, c: number): { r: number; c: number }[] => {
    const pseudo = getPseudoMoves(b, r, c, true);
    const piece = b[r][c];
    if (!piece) return [];

    return pseudo.filter(m => {
      // Simulate move
      const nextBoard = b.map(row => [...row]);
      nextBoard[m.r][m.c] = piece;
      nextBoard[r][c] = null;
      return !isKingInCheck(nextBoard, piece.color);
    });
  }, [getPseudoMoves, isKingInCheck]);

  // Check all legal moves for a player color
  const getAllLegalMovesForColor = useCallback((b: BoardState, color: PieceColor) => {
    const allMoves: { from: { r: number; c: number }; to: { r: number; c: number } }[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (b[r][c]?.color === color) {
          const legal = getLegalMoves(b, r, c);
          legal.forEach(to => allMoves.push({ from: { r, c }, to }));
        }
      }
    }
    return allMoves;
  }, [getLegalMoves]);

  // Execute a move on the board
  const executeMove = (from: { r: number; c: number }, to: { r: number; c: number }, promoPiece: PieceType = 'q') => {
    const piece = board[from.r][from.c];
    if (!piece) return;

    sounds.playMove();

    const destPiece = board[to.r][to.c];
    if (destPiece) {
      sounds.playScore();
      setCapturedPieces(prev => ({
        ...prev,
        [piece.color]: [...prev[piece.color], destPiece],
      }));
    }

    const nextBoard = board.map(row => [...row]);
    
    // Check if castling
    if (piece.type === 'k' && Math.abs(to.c - from.c) === 2) {
      if (to.c === 6) { // Kingside
        const rook = nextBoard[from.r][7];
        nextBoard[from.r][5] = rook ? { ...rook, hasMoved: true } : null;
        nextBoard[from.r][7] = null;
      } else if (to.c === 2) { // Queenside
        const rook = nextBoard[from.r][0];
        nextBoard[from.r][3] = rook ? { ...rook, hasMoved: true } : null;
        nextBoard[from.r][0] = null;
      }
    }

    // Pawn Promotion
    const isPawnPromo = piece.type === 'p' && (to.r === 0 || to.r === 7);
    const movedPiece: ChessPiece = {
      type: isPawnPromo ? promoPiece : piece.type,
      color: piece.color,
      hasMoved: true,
    };

    nextBoard[to.r][to.c] = movedPiece;
    nextBoard[from.r][from.c] = null;

    setBoard(nextBoard);
    setLastMove({ from, to });
    setSelectedSquare(null);
    setValidMoves([]);

    const nextTurn = turn === 'w' ? 'b' : 'w';
    setTurn(nextTurn);

    // Record algebraic notation
    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const notation = `${piece.type.toUpperCase() !== 'P' ? piece.type.toUpperCase() : ''}${cols[from.c]}${8 - from.r}→${cols[to.c]}${8 - to.r}`;
    setMoveHistory(prev => [notation, ...prev].slice(0, 10));

    // Check & Checkmate Evaluation
    const checkOnNext = isKingInCheck(nextBoard, nextTurn);
    setInCheck(checkOnNext ? nextTurn : null);

    const nextPlayerMoves = getAllLegalMovesForColor(nextBoard, nextTurn);
    if (nextPlayerMoves.length === 0) {
      if (checkOnNext) {
        // Checkmate
        const winner = turn === 'w' ? 'White' : 'Black';
        setGameOverResult(`Checkmate! ${winner} Wins! 🏆`);
        sounds.playWin();
        triggerConfetti();
        recordGamePlayed('chess', turn === 'w', 500, 300);
      } else {
        // Stalemate
        setGameOverResult('Stalemate! The game is a Draw.');
        sounds.playLose();
        recordGamePlayed('chess', false, 200, 300);
      }
    }
  };

  // Click on board square
  const handleSquareClick = (r: number, c: number) => {
    if (gameOverResult || isThinkingAI) return;
    if (isVsAI && turn === 'b') return;

    const clickedPiece = board[r][c];

    // If a square is currently selected
    if (selectedSquare) {
      // Check if clicked square is in valid moves
      const isDestination = validMoves.some(m => m.r === r && m.c === c);
      if (isDestination) {
        const piece = board[selectedSquare.r][selectedSquare.c];
        // Check if requires pawn promotion modal
        if (piece?.type === 'p' && (r === 0 || r === 7)) {
          setPendingPromotion({ from: selectedSquare, to: { r, c } });
          return;
        }
        executeMove(selectedSquare, { r, c });
        return;
      }
    }

    // Select own piece
    if (clickedPiece && clickedPiece.color === turn) {
      setSelectedSquare({ r, c });
      const legal = getLegalMoves(board, r, c);
      setValidMoves(legal);
      sounds.playClick();
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  // AI Opponent Move Generation
  useEffect(() => {
    if (!gameOverResult && isVsAI && turn === 'b' && !pendingPromotion) {
      setIsThinkingAI(true);
      const timer = setTimeout(() => {
        const allMoves = getAllLegalMovesForColor(board, 'b');
        if (allMoves.length > 0) {
          // Score moves (evaluating piece captures & center control)
          let bestMove = allMoves[0];
          let bestScore = -99999;

          allMoves.forEach(mv => {
            const targetPiece = board[mv.to.r][mv.to.c];
            let moveScore = 0;
            if (targetPiece) {
              moveScore += PIECE_VALUES[targetPiece.type];
            }
            // Center control bonus
            if (mv.to.r >= 3 && mv.to.r <= 4 && mv.to.c >= 3 && mv.to.c <= 4) {
              moveScore += 30;
            }
            // Randomness based on difficulty
            if (aiDifficulty === 'easy') {
              moveScore += (Math.random() - 0.5) * 400;
            } else if (aiDifficulty === 'medium') {
              moveScore += (Math.random() - 0.5) * 80;
            }

            if (moveScore > bestScore) {
              bestScore = moveScore;
              bestMove = mv;
            }
          });

          executeMove(bestMove.from, bestMove.to, 'q');
        }
        setIsThinkingAI(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [turn, isVsAI, gameOverResult, pendingPromotion, board, getAllLegalMovesForColor, aiDifficulty]);

  // Restart game
  const handleRestart = () => {
    setBoard(getInitialBoard());
    setTurn('w');
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setCapturedPieces({ w: [], b: [] });
    setInCheck(null);
    setGameOverResult(null);
    setMoveHistory([]);
    setPendingPromotion(null);
    setIsThinkingAI(false);
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={handleRestart}
      turnText={turn === 'w' ? 'White (You)' : isVsAI ? 'Black (AI Thinking...)' : 'Black'}
      turnColor={turn === 'w' ? 'text-slate-100' : 'text-amber-400'}
    >
      <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-6">
        
        {/* Main 8x8 Chessboard */}
        <div className="p-3 sm:p-5 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl flex flex-col items-center">
          
          {/* Top Captured Bar (White's captures) */}
          <div className="w-full flex items-center justify-between px-2 pb-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">Black (AI)</span>
              {inCheck === 'b' && (
                <span className="px-1.5 py-0.5 rounded bg-rose-900 text-rose-300 font-bold text-[10px] animate-pulse">
                  CHECK
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm">
              {capturedPieces.w.map((p, i) => (
                <span key={i} className="text-slate-300">{PIECE_SYMBOLS[p.color][p.type]}</span>
              ))}
            </div>
          </div>

          {/* 8x8 Grid Canvas */}
          <div className="grid grid-cols-8 grid-rows-8 w-[310px] h-[310px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] rounded-xl overflow-hidden border-2 border-slate-750 shadow-2xl">
            {board.map((row, r) =>
              row.map((piece, c) => {
                const isDark = (r + c) % 2 === 1;
                const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
                const isValidDest = validMoves.some(m => m.r === r && m.c === c);
                const isLastMoveSquare = lastMove && ((lastMove.from.r === r && lastMove.from.c === c) || (lastMove.to.r === r && lastMove.to.c === c));
                const isKingCheckSquare = inCheck && piece?.type === 'k' && piece?.color === inCheck;

                return (
                  <button
                    key={`${r}-${c}`}
                    id={`chess-sq-${r}-${c}`}
                    onClick={() => handleSquareClick(r, c)}
                    className={`relative flex items-center justify-center text-2xl sm:text-3xl md:text-4xl select-none transition-colors cursor-pointer ${
                      isKingCheckSquare
                        ? 'bg-rose-700/80 animate-pulse'
                        : isSelected
                        ? 'bg-indigo-600/90 ring-2 ring-indigo-300 z-10'
                        : isLastMoveSquare
                        ? isDark ? 'bg-amber-800/60' : 'bg-amber-600/40'
                        : isDark
                        ? 'bg-slate-800'
                        : 'bg-slate-700/60'
                    } hover:opacity-90`}
                  >
                    {/* Piece Display */}
                    {piece && (
                      <span className={`transform transition-transform ${piece.color === 'w' ? 'text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-slate-950 font-bold drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]'}`}>
                        {PIECE_SYMBOLS[piece.color][piece.type]}
                      </span>
                    )}

                    {/* Valid Move Indicator Dot */}
                    {isValidDest && (
                      <div className={`absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full ${
                        piece ? 'ring-4 ring-rose-500/80 bg-transparent' : 'bg-emerald-400/90 shadow-lg shadow-emerald-400/50'
                      }`} />
                    )}

                    {/* Rank/File Coordinates Notation */}
                    {c === 0 && (
                      <span className="absolute top-0.5 left-1 text-[9px] font-mono text-slate-400/70 pointer-events-none">
                        {8 - r}
                      </span>
                    )}
                    {r === 7 && (
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-slate-400/70 pointer-events-none">
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Captured Bar (Black's captures) */}
          <div className="w-full flex items-center justify-between px-2 pt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">White (You)</span>
              {inCheck === 'w' && (
                <span className="px-1.5 py-0.5 rounded bg-rose-900 text-rose-300 font-bold text-[10px] animate-pulse">
                  CHECK
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm">
              {capturedPieces.b.map((p, i) => (
                <span key={i} className="text-slate-900 font-bold">{PIECE_SYMBOLS[p.color][p.type]}</span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side Settings & Notation History */}
        <div className="w-full lg:w-72 space-y-4">
          
          {/* Opponent Settings Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Opponent Mode
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setIsVsAI(true); handleRestart(); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  isVsAI ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Play AI
              </button>
              <button
                onClick={() => { setIsVsAI(false); handleRestart(); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  !isVsAI ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                2P Local
              </button>
            </div>

            {isVsAI && (
              <div className="pt-2 border-t border-slate-800">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  AI Difficulty:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['easy', 'medium', 'hard'] as const).map(diff => (
                    <button
                      key={diff}
                      onClick={() => setAiDifficulty(diff)}
                      className={`py-1 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                        aiDifficulty === diff
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Move History Notation Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
              Recent Moves
            </h4>
            <div className="h-28 overflow-y-auto space-y-1 text-xs font-mono text-slate-300 pr-1">
              {moveHistory.length > 0 ? (
                moveHistory.map((mv, idx) => (
                  <div key={idx} className="flex justify-between py-0.5 border-b border-slate-850">
                    <span className="text-slate-500">{moveHistory.length - idx}.</span>
                    <span className="font-semibold text-indigo-300">{mv}</span>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic text-[11px] pt-4 text-center">
                  Make your first move to see notation.
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Pawn Promotion Modal */}
      <AnimatePresence>
        {pendingPromotion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/50 shadow-2xl max-w-xs w-full text-center space-y-4"
            >
              <h3 className="font-display font-bold text-lg text-white">
                Promote Pawn
              </h3>
              <p className="text-xs text-slate-300">
                Choose your promoted piece:
              </p>
              <div className="grid grid-cols-4 gap-2 text-3xl">
                {(['q', 'r', 'b', 'n'] as PieceType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      executeMove(pendingPromotion.from, pendingPromotion.to, type);
                      setPendingPromotion(null);
                    }}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-750 hover:border-indigo-400 hover:scale-105 transition-all text-white flex items-center justify-center"
                  >
                    {PIECE_SYMBOLS.w[type]}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Over Banner */}
      <AnimatePresence>
        {gameOverResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950 to-slate-900 border-2 border-indigo-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-display text-white">
                Game Over
              </h2>
              <p className="text-sm font-semibold text-indigo-300">
                {gameOverResult}
              </p>
              <button
                onClick={handleRestart}
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
