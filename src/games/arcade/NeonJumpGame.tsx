import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

interface Platform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'standard' | 'moving' | 'spring' | 'fragile';
  vx?: number;
  broken?: boolean;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected?: boolean;
}

export const NeonJumpGame: React.FC = () => {
  const { recordGamePlayed, setActiveGameId } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const stateRef = useRef({
    playerX: 200,
    playerY: 400,
    vx: 0,
    vy: -600,
    score: 0,
    coins: 0,
    cameraY: 0,
    platforms: [] as Platform[],
    coinsList: [] as Coin[],
    gameOver: false,
    keys: { left: false, right: false }
  });

  const startGame = useCallback(() => {
    const platforms: Platform[] = [
      { id: 0, x: 160, y: 550, w: 100, h: 14, type: 'standard' }
    ];

    // Generate initial platforms upwards
    for (let i = 1; i < 20; i++) {
      const type = Math.random() < 0.2 ? 'spring' : (Math.random() < 0.35 ? 'moving' : 'standard');
      platforms.push({
        id: i,
        x: 30 + Math.random() * 320,
        y: 550 - i * 65,
        w: 80,
        h: 14,
        type,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0
      });
    }

    stateRef.current = {
      playerX: 200,
      playerY: 450,
      vx: 0,
      vy: -550,
      score: 0,
      coins: 0,
      cameraY: 0,
      platforms,
      coinsList: [],
      gameOver: false,
      keys: { left: false, right: false }
    };

    setScore(0);
    setCoins(0);
    setGameOver(false);
    setGameStarted(true);
    sounds.playJump();
  }, []);

  // Game Loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

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

      // Update Horizontal Velocity
      if (state.keys.left) state.vx = -340;
      else if (state.keys.right) state.vx = 340;
      else state.vx *= 0.85;

      state.playerX += state.vx * dt;

      // Wrap around screen edges
      if (state.playerX < -20) state.playerX = width + 20;
      if (state.playerX > width + 20) state.playerX = -20;

      // Apply Gravity
      state.vy += 1100 * dt;
      state.playerY += state.vy * dt;

      // Scroll camera when jumping high
      if (state.playerY < height * 0.45 && state.vy < 0) {
        const scrollDelta = (height * 0.45 - state.playerY);
        state.playerY = height * 0.45;
        state.cameraY += scrollDelta;
        state.score += Math.round(scrollDelta);
        setScore(state.score);

        // Move platforms down relative to camera
        state.platforms.forEach(p => {
          p.y += scrollDelta;
        });

        // Remove old platforms and spawn new ones on top
        state.platforms = state.platforms.filter(p => p.y < height + 50);

        const highestPlatformY = Math.min(...state.platforms.map(p => p.y));
        if (highestPlatformY > 80) {
          const type = Math.random() < 0.25 ? 'spring' : (Math.random() < 0.35 ? 'moving' : 'standard');
          state.platforms.push({
            id: Date.now() + Math.random(),
            x: 30 + Math.random() * (width - 110),
            y: highestPlatformY - 60 - Math.random() * 25,
            w: 80,
            h: 14,
            type,
            vx: type === 'moving' ? (Math.random() > 0.5 ? 2.5 : -2.5) : 0
          });
        }
      }

      // Update Moving Platforms
      state.platforms.forEach(p => {
        if (p.type === 'moving' && p.vx) {
          p.x += p.vx * 60 * dt;
          if (p.x < 10 || p.x > width - p.w - 10) p.vx *= -1;
        }
      });

      // Platform Landing Collision (Only when falling down: vy > 0)
      if (state.vy > 0) {
        state.platforms.forEach(p => {
          if (
            state.playerX + 16 > p.x &&
            state.playerX - 16 < p.x + p.w &&
            state.playerY + 20 >= p.y &&
            state.playerY + 20 <= p.y + 18
          ) {
            if (p.type === 'spring') {
              sounds.playBoost();
              state.vy = -880; // High bounce
            } else {
              sounds.playJump();
              state.vy = -560; // Standard bounce
            }
          }
        });
      }

      // Game Over Check (Falling below screen)
      if (state.playerY > height + 40) {
        sounds.playLose();
        state.gameOver = true;
        setGameOver(true);
        recordGamePlayed('neon_jump', false, state.score, 30);
      }

      // --- RENDER ---
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, width, height);

      // Draw Platforms
      state.platforms.forEach(p => {
        ctx.fillStyle = p.type === 'spring' ? '#f59e0b' : (p.type === 'moving' ? '#06b6d4' : '#6366f1');
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (p.type === 'spring') {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(p.x + p.w / 2 - 8, p.y - 6, 16, 6);
        }
      });

      // Draw Player Hopper
      ctx.fillStyle = '#ec4899';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(state.playerX, state.playerY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Visor
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(state.playerX + (state.vx > 0 ? 4 : (state.vx < 0 ? -4 : 0)), state.playerY - 2, 5, 0, Math.PI * 2);
      ctx.fill();

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameStarted, gameOver, recordGamePlayed]);

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
      <div className="w-full max-w-md flex items-center justify-between py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGameId(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🦘</span>
            <span className="font-display font-extrabold text-sm text-white">Neon Jump</span>
          </div>
        </div>
        <button onClick={startGame} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-md aspect-[3/4] max-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
        {!gameStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/40 text-pink-400 text-3xl flex items-center justify-center">
              🦘
            </div>
            <h2 className="text-3xl font-black font-display text-white">Neon Jump</h2>
            <p className="text-xs text-slate-400 max-w-xs">
              Bounce ever higher onto glowing cyber platforms! Hit gold spring pads for massive sky leaps.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-sm shadow-xl shadow-pink-600/30 cursor-pointer"
            >
              START JUMPING
            </button>
          </div>
        )}

        <canvas ref={canvasRef} width={420} height={580} className="w-full h-full object-cover" />

        {/* Live HUD */}
        {gameStarted && (
          <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-20">
            <div className="px-4 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold">
              HEIGHT: <span className="text-pink-400 font-mono text-sm">{score}</span>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl max-w-xs w-full text-center space-y-4">
              <div className="text-4xl">💥</div>
              <h3 className="text-2xl font-black text-white">FALLEN!</h3>
              <p className="text-xs text-slate-400">Final Height: {score}</p>
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs"
              >
                Jump Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      {gameStarted && (
        <div className="w-full max-w-md mt-3 flex justify-between gap-4 lg:hidden">
          <button
            onTouchStart={() => (stateRef.current.keys.left = true)}
            onTouchEnd={() => (stateRef.current.keys.left = false)}
            className="flex-1 h-14 rounded-2xl bg-slate-900 border border-slate-750 active:bg-pink-600 text-white text-xl flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onTouchStart={() => (stateRef.current.keys.right = true)}
            onTouchEnd={() => (stateRef.current.keys.right = false)}
            className="flex-1 h-14 rounded-2xl bg-slate-900 border border-slate-750 active:bg-pink-600 text-white text-xl flex items-center justify-center"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};
