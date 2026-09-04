import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Zap, Shield, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
}

interface Alien {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  health: number;
  maxHealth: number;
  color: string;
  type: 'scout' | 'fighter' | 'boss';
  points: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export const GalaxyDefenderGame: React.FC = () => {
  const { recordGamePlayed, setActiveGameId } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(3);
  const [shield, setShield] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const stateRef = useRef({
    playerX: 400,
    playerY: 480,
    bullets: [] as Bullet[],
    aliens: [] as Alien[],
    stars: [] as Star[],
    score: 0,
    wave: 1,
    health: 3,
    shield: 100,
    gameOver: false,
    lastFire: 0,
    keys: { left: false, right: false, up: false, down: false, fire: false }
  });

  // Spawn Alien Fleet
  const spawnWave = useCallback((w: number) => {
    const aliens: Alien[] = [];
    const rows = Math.min(5, 2 + Math.floor(w / 2));
    const cols = 8;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isBoss = w % 3 === 0 && r === 0 && (c === 3 || c === 4);
        aliens.push({
          id: r * cols + c + Date.now(),
          x: 100 + c * 80,
          y: 60 + r * 50,
          vx: 1.5 + w * 0.2,
          vy: 0.1,
          radius: isBoss ? 24 : 14,
          health: isBoss ? 15 : (r === 0 ? 3 : 1),
          maxHealth: isBoss ? 15 : (r === 0 ? 3 : 1),
          color: isBoss ? '#ec4899' : (r === 0 ? '#f59e0b' : '#06b6d4'),
          type: isBoss ? 'boss' : (r === 0 ? 'fighter' : 'scout'),
          points: isBoss ? 1000 : (r === 0 ? 300 : 100)
        });
      }
    }
    stateRef.current.aliens = aliens;
  }, []);

  const startGame = useCallback(() => {
    // Generate starfield
    const stars: Star[] = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        speed: 1 + Math.random() * 3,
        size: 1 + Math.random() * 2
      });
    }

    stateRef.current = {
      playerX: 400,
      playerY: 520,
      bullets: [],
      aliens: [],
      stars,
      score: 0,
      wave: 1,
      health: 3,
      shield: 100,
      gameOver: false,
      lastFire: 0,
      keys: { left: false, right: false, up: false, down: false, fire: false }
    };

    setScore(0);
    setWave(1);
    setHealth(3);
    setShield(100);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);

    spawnWave(1);
    sounds.playGo();
  }, [spawnWave]);

  // Main Game Loop
  useEffect(() => {
    if (!gameStarted || isPaused || gameOver) return;

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

      // Update Player
      const speed = 320 * dt;
      if (state.keys.left && state.playerX > 30) state.playerX -= speed;
      if (state.keys.right && state.playerX < width - 30) state.playerX += speed;
      if (state.keys.up && state.playerY > height * 0.4) state.playerY -= speed;
      if (state.keys.down && state.playerY < height - 30) state.playerY += speed;

      // Player Firing
      if (state.keys.fire && now - state.lastFire > 180) {
        state.lastFire = now;
        sounds.playLaser(1400);
        state.bullets.push({
          x: state.playerX - 10,
          y: state.playerY - 20,
          vx: 0,
          vy: -600,
          isPlayer: true
        });
        state.bullets.push({
          x: state.playerX + 10,
          y: state.playerY - 20,
          vx: 0,
          vy: -600,
          isPlayer: true
        });
      }

      // Update Stars
      state.stars.forEach(s => {
        s.y += s.speed * 60 * dt;
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }
      });

      // Update Bullets
      state.bullets.forEach(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      });
      state.bullets = state.bullets.filter(b => b.y > -20 && b.y < height + 20);

      // Update Aliens
      let changeDir = false;
      state.aliens.forEach(a => {
        a.x += a.vx * 60 * dt;
        if (a.x < 30 || a.x > width - 30) changeDir = true;

        // Alien random laser attack
        if (Math.random() < 0.003 * state.wave) {
          state.bullets.push({
            x: a.x,
            y: a.y + a.radius,
            vx: (Math.random() - 0.5) * 60,
            vy: 280,
            isPlayer: false
          });
        }
      });

      if (changeDir) {
        state.aliens.forEach(a => {
          a.vx *= -1;
          a.y += 15;
        });
      }

      // Bullet Collisions
      state.bullets.forEach(b => {
        if (b.isPlayer) {
          state.aliens.forEach(a => {
            const dist = Math.hypot(b.x - a.x, b.y - a.y);
            if (dist < a.radius + 6) {
              a.health -= 1;
              b.y = -100; // destroy bullet
              sounds.playTargetHit();
              if (a.health <= 0) {
                sounds.playExplosion();
                state.score += a.points;
                setScore(state.score);
              }
            }
          });
        } else {
          // Enemy bullet hits player
          const pDist = Math.hypot(b.x - state.playerX, b.y - state.playerY);
          if (pDist < 20) {
            b.y = 9999;
            sounds.playError();
            if (state.shield > 0) {
              state.shield -= 25;
              setShield(state.shield);
            } else {
              state.health -= 1;
              setHealth(state.health);
              if (state.health <= 0) {
                state.gameOver = true;
                setGameOver(true);
                sounds.playLose();
                recordGamePlayed('galaxy_defender', false, state.score, 45);
              }
            }
          }
        }
      });

      state.aliens = state.aliens.filter(a => a.health > 0);

      // Wave Cleared!
      if (state.aliens.length === 0 && !state.gameOver) {
        state.wave += 1;
        setWave(state.wave);
        sounds.playWin();
        state.shield = 100;
        setShield(100);
        spawnWave(state.wave);
      }

      // --- RENDER ---
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Draw Stars
      ctx.fillStyle = '#ffffff';
      state.stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Draw Bullets
      state.bullets.forEach(b => {
        ctx.fillStyle = b.isPlayer ? '#38bdf8' : '#f43f5e';
        ctx.shadowColor = b.isPlayer ? '#38bdf8' : '#f43f5e';
        ctx.shadowBlur = 8;
        ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        ctx.shadowBlur = 0;
      });

      // Draw Aliens
      state.aliens.forEach(a => {
        ctx.fillStyle = a.color;
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health indicator on tough enemies
        if (a.maxHealth > 1) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(a.x - 12, a.y - a.radius - 6, 24 * (a.health / a.maxHealth), 3);
        }
      });

      // Draw Player Spaceship
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(state.playerX, state.playerY - 20);
      ctx.lineTo(state.playerX + 18, state.playerY + 16);
      ctx.lineTo(state.playerX, state.playerY + 10);
      ctx.lineTo(state.playerX - 18, state.playerY + 16);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Shield Aura
      if (state.shield > 0) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.playerX, state.playerY, 26, 0, Math.PI * 2);
        ctx.stroke();
      }

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameStarted, isPaused, gameOver, spawnWave, recordGamePlayed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = true;
      if (e.code === 'Space') {
        e.preventDefault();
        k.fire = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') k.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') k.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') k.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') k.down = false;
      if (e.code === 'Space') k.fire = false;
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
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGameId(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Hub
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚀</span>
            <span className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide">
              Galaxy Defender
            </span>
          </div>
        </div>

        <button
          onClick={startGame}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Canvas Frame */}
      <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
        {!gameStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-3xl flex items-center justify-center">
              🚀
            </div>
            <h2 className="text-3xl font-black font-display text-white">Galaxy Defender</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Pilot your interceptor, blast alien formations, dodge plasma bolts, and defend the quadrant.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              LAUNCH DEFENDER
            </button>
          </div>
        )}

        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-cover" />

        {/* Live HUD */}
        {gameStarted && (
          <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-20">
            <div className="px-4 py-2 rounded-xl bg-slate-950/85 border border-slate-800 flex gap-4 text-xs font-bold">
              <span>SCORE: <strong className="text-white font-mono">{score}</strong></span>
              <span>WAVE: <strong className="text-indigo-400">{wave}</strong></span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-950/85 border border-slate-800 flex gap-3 text-xs font-bold">
              <span className="text-cyan-400">🛡️ {shield}%</span>
              <span className="text-rose-400">❤️ {health} Lives</span>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl max-w-sm w-full text-center space-y-4">
              <div className="text-4xl">💥</div>
              <h3 className="text-2xl font-black text-white">DEFEAT</h3>
              <p className="text-xs text-slate-400">Final Score: {score} • Wave {wave}</p>
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      {gameStarted && (
        <div className="w-full max-w-4xl mt-3 flex justify-between items-center gap-4 lg:hidden">
          <div className="flex gap-2">
            <button
              onTouchStart={() => (stateRef.current.keys.left = true)}
              onTouchEnd={() => (stateRef.current.keys.left = false)}
              className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-xl active:bg-indigo-600"
            >
              ◀
            </button>
            <button
              onTouchStart={() => (stateRef.current.keys.right = true)}
              onTouchEnd={() => (stateRef.current.keys.right = false)}
              className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 text-white font-bold text-xl active:bg-indigo-600"
            >
              ▶
            </button>
          </div>
          <button
            onTouchStart={() => (stateRef.current.keys.fire = true)}
            onTouchEnd={() => (stateRef.current.keys.fire = false)}
            className="px-8 h-14 rounded-2xl bg-indigo-600 border border-indigo-400 text-white font-black text-sm active:bg-indigo-500"
          >
            FIRE LASER 🔥
          </button>
        </div>
      )}
    </div>
  );
};
