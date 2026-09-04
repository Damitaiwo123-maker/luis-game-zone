import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Zap, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  health: number;
  maxHealth: number;
  color: string;
  points: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export const QuantumBreakerGame: React.FC = () => {
  const { recordGamePlayed, setActiveGameId } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const stateRef = useRef({
    paddleX: 350,
    paddleW: 110,
    paddleH: 14,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    victory: false,
    keys: { left: false, right: false }
  });

  const buildLevel = useCallback((lvl: number) => {
    const bricks: Brick[] = [];
    const rows = 5 + lvl;
    const cols = 8;
    const brickW = 85;
    const brickH = 22;
    const padding = 8;
    const startX = 35;
    const startY = 60;

    const colors = ['#6366f1', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#a855f7'];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hp = r === 0 ? 2 : 1;
        bricks.push({
          x: startX + c * (brickW + padding),
          y: startY + r * (brickH + padding),
          w: brickW,
          h: brickH,
          health: hp,
          maxHealth: hp,
          color: colors[r % colors.length],
          points: (rows - r) * 50
        });
      }
    }
    stateRef.current.bricks = bricks;
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = {
      paddleX: 350,
      paddleW: 110,
      paddleH: 14,
      balls: [{ x: 400, y: 480, vx: 260, vy: -320, radius: 7 }],
      bricks: [],
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      victory: false,
      keys: { left: false, right: false }
    };

    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setVictory(false);
    setGameStarted(true);

    buildLevel(1);
    sounds.playGo();
  }, [buildLevel]);

  // Main Loop
  useEffect(() => {
    if (!gameStarted || gameOver || victory) return;

    let lastTick = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTick) / 1000, 0.1);
      lastTick = now;

      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Update Paddle
      const paddleSpeed = 480 * dt;
      if (state.keys.left && state.paddleX > 0) state.paddleX -= paddleSpeed;
      if (state.keys.right && state.paddleX < width - state.paddleW) state.paddleX += paddleSpeed;

      // Update Balls
      state.balls.forEach(ball => {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // Bounce off walls
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx *= -1;
          sounds.playMove();
        }
        if (ball.x + ball.radius > width) {
          ball.x = width - ball.radius;
          ball.vx *= -1;
          sounds.playMove();
        }
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy *= -1;
          sounds.playMove();
        }

        // Paddle Collision
        const paddleY = height - 40;
        if (
          ball.y + ball.radius >= paddleY &&
          ball.y - ball.radius <= paddleY + state.paddleH &&
          ball.x >= state.paddleX &&
          ball.x <= state.paddleX + state.paddleW &&
          ball.vy > 0
        ) {
          sounds.playMove();
          const hitOffset = (ball.x - (state.paddleX + state.paddleW / 2)) / (state.paddleW / 2);
          ball.vx = hitOffset * 380;
          ball.vy = -Math.abs(ball.vy);
        }

        // Brick Collisions
        state.bricks.forEach(brick => {
          if (brick.health > 0) {
            if (
              ball.x + ball.radius > brick.x &&
              ball.x - ball.radius < brick.x + brick.w &&
              ball.y + ball.radius > brick.y &&
              ball.y - ball.radius < brick.y + brick.h
            ) {
              brick.health -= 1;
              ball.vy *= -1;
              sounds.playTargetHit();

              if (brick.health <= 0) {
                state.score += brick.points;
                setScore(state.score);
              }
            }
          }
        });
      });

      // Filter destroyed bricks
      state.bricks = state.bricks.filter(b => b.health > 0);

      // Check Level Clear
      if (state.bricks.length === 0 && !state.gameOver) {
        sounds.playWin();
        if (state.level >= 3) {
          state.victory = true;
          setVictory(true);
          recordGamePlayed('quantum_breaker', true, state.score + 2000, 60);
        } else {
          state.level += 1;
          setLevel(state.level);
          buildLevel(state.level);
          state.balls = [{ x: width / 2, y: height - 80, vx: 260, vy: -340, radius: 7 }];
        }
      }

      // Ball loss check
      state.balls = state.balls.filter(b => b.y < height + 20);
      if (state.balls.length === 0 && !state.gameOver && !state.victory) {
        state.lives -= 1;
        setLives(state.lives);
        sounds.playError();

        if (state.lives <= 0) {
          state.gameOver = true;
          setGameOver(true);
          sounds.playLose();
          recordGamePlayed('quantum_breaker', false, state.score, 45);
        } else {
          state.balls = [{ x: width / 2, y: height - 80, vx: 260, vy: -320, radius: 7 }];
        }
      }

      // --- RENDER ---
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, width, height);

      // Draw Bricks
      state.bricks.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Paddle
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(state.paddleX, height - 40, state.paddleW, state.paddleH, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Balls
      state.balls.forEach(ball => {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameStarted, gameOver, victory, buildLevel, recordGamePlayed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-3 sm:p-6 bg-slate-950 text-slate-100 select-none">
      {/* Top Bar */}
      <div className="w-full max-w-3xl flex items-center justify-between py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGameId(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧱</span>
            <span className="font-display font-extrabold text-sm text-white">Quantum Breaker</span>
          </div>
        </div>
        <button onClick={startGame} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-3xl aspect-[4/3] max-h-[560px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
        {!gameStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-3xl flex items-center justify-center">
              🧱
            </div>
            <h2 className="text-3xl font-black font-display text-white">Quantum Breaker</h2>
            <p className="text-xs text-slate-400 max-w-sm">
              Shatter neon energy bricks with precision paddle deflections! Clear multiple layers to advance.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm shadow-xl shadow-cyan-600/30 cursor-pointer"
            >
              LAUNCH QUANTUM BALL
            </button>
          </div>
        )}

        <canvas ref={canvasRef} width={780} height={560} className="w-full h-full object-cover" />

        {/* Live HUD */}
        {gameStarted && (
          <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-20">
            <div className="px-4 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold">
              SCORE: <span className="text-cyan-400 font-mono text-sm">{score}</span>
            </div>
            <div className="flex gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-indigo-300">
                LEVEL {level}
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-rose-400">
                ❤️ {lives} Balls
              </div>
            </div>
          </div>
        )}

        {(gameOver || victory) && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl max-w-xs w-full text-center space-y-4">
              <div className="text-4xl">{victory ? '🏆' : '💀'}</div>
              <h3 className="text-2xl font-black text-white">{victory ? 'GRID CLEARED!' : 'GAME OVER'}</h3>
              <p className="text-xs text-slate-400">Final Score: {score}</p>
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      {gameStarted && (
        <div className="w-full max-w-3xl mt-3 flex justify-between gap-4 lg:hidden">
          <button
            onTouchStart={() => (stateRef.current.keys.left = true)}
            onTouchEnd={() => (stateRef.current.keys.left = false)}
            className="flex-1 h-14 rounded-2xl bg-slate-900 border border-slate-750 active:bg-cyan-600 text-white text-xl flex items-center justify-center"
          >
            ◀ LEFT
          </button>
          <button
            onTouchStart={() => (stateRef.current.keys.right = true)}
            onTouchEnd={() => (stateRef.current.keys.right = false)}
            className="flex-1 h-14 rounded-2xl bg-slate-900 border border-slate-750 active:bg-cyan-600 text-white text-xl flex items-center justify-center"
          >
            RIGHT ▶
          </button>
        </div>
      )}
    </div>
  );
};
