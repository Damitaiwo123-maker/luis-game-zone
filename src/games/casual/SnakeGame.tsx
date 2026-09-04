import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Trophy, Sparkles, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause } from 'lucide-react';
import { GameContainer } from '../../components/games/GameContainer';
import { getGameById } from '../../data/games';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

export const SnakeGame: React.FC = () => {
  const gameMeta = getGameById('snake')!;
  const { recordGamePlayed, triggerConfetti } = useGame();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  const directionRef = useRef<Direction>('UP');
  directionRef.current = direction;

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(seg => seg.x === newFood.x && seg.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const initGame = useCallback(() => {
    const initialSnake: Point[] = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setDirection('UP');
    directionRef.current = 'UP';
    setFood(generateFood(initialSnake));
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
  }, [generateFood]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Game Loop
  useEffect(() => {
    if (isPaused || isGameOver) return;

    const speed = Math.max(70, 140 - Math.floor(score / 30) * 10);

    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };

        switch (directionRef.current) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check Wall Collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          handleGameOver();
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check Eat Food
        if (head.x === food.x && head.y === food.y) {
          sounds.playScore();
          const newScore = score + 10;
          setScore(newScore);
          if (newScore > highScore) setHighScore(newScore);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [isPaused, isGameOver, food, score, highScore, generateFood]);

  const handleGameOver = () => {
    setIsGameOver(true);
    sounds.playLose();
    recordGamePlayed('snake', score >= 100, score, 90);
  };

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw Subtle Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food (Glowing Apple)
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    snake.forEach((seg, idx) => {
      const isHead = idx === 0;
      ctx.fillStyle = isHead ? '#10b981' : '#34d399';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = isHead ? 10 : 4;

      ctx.beginPath();
      ctx.roundRect(
        seg.x * CELL_SIZE + 1.5,
        seg.y * CELL_SIZE + 1.5,
        CELL_SIZE - 3,
        CELL_SIZE - 3,
        isHead ? 6 : 4
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }, [snake, food]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current !== 'LEFT') setDirection('RIGHT');
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const changeDirection = (newDir: Direction) => {
    if (
      (newDir === 'UP' && directionRef.current !== 'DOWN') ||
      (newDir === 'DOWN' && directionRef.current !== 'UP') ||
      (newDir === 'LEFT' && directionRef.current !== 'RIGHT') ||
      (newDir === 'RIGHT' && directionRef.current !== 'LEFT')
    ) {
      sounds.playClick();
      setDirection(newDir);
    }
  };

  return (
    <GameContainer
      game={gameMeta}
      onRestart={initGame}
      score={score}
      scoreLabel="Score"
      highScore={highScore}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        
        {/* Canvas Screen */}
        <div className="p-3 sm:p-4 rounded-3xl bg-slate-900 border-2 border-slate-750 shadow-2xl relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] rounded-2xl shadow-inner block"
          />

          {isPaused && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs rounded-3xl flex items-center justify-center">
              <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white font-bold text-sm">
                PAUSED (Press Space)
              </span>
            </div>
          )}
        </div>

        {/* D-Pad Buttons */}
        <div className="grid grid-cols-3 gap-2 w-48">
          <div />
          <button
            id="btn-snake-up"
            onClick={() => changeDirection('UP')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />
          <button
            id="btn-snake-left"
            onClick={() => changeDirection('LEFT')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            id="btn-snake-down"
            onClick={() => changeDirection('DOWN')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            id="btn-snake-right"
            onClick={() => changeDirection('RIGHT')}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isGameOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/50 shadow-2xl max-w-sm w-full text-center space-y-4"
            >
              <h2 className="text-2xl font-bold font-display text-white">
                Snake Crashed!
              </h2>
              <p className="text-xs text-slate-300">
                Final Score: <strong className="text-emerald-400 font-mono text-base">{score}</strong>
              </p>
              <button
                onClick={initGame}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-colors cursor-pointer"
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
