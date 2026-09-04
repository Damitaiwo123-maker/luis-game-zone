import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Zap, Shield, Sparkles, Crosshair } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface RobotEnemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  color: string;
  size: number;
  points: number;
}

export const RobotArenaGame: React.FC = () => {
  const { recordGamePlayed, setActiveGameId } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [health, setHealth] = useState(100);
  const [dashCooldown, setDashCooldown] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const stateRef = useRef({
    playerX: 400,
    playerY: 300,
    aimAngle: 0,
    bullets: [] as Bullet[],
    enemies: [] as RobotEnemy[],
    score: 0,
    wave: 1,
    health: 100,
    dashTimer: 0,
    isDashing: false,
    gameOver: false,
    lastFire: 0,
    keys: { w: false, s: false, a: false, d: false, dash: false, shoot: false },
    mouse: { x: 400, y: 300 }
  });

  const spawnWave = useCallback((w: number) => {
    const enemies: RobotEnemy[] = [];
    const count = 6 + w * 4;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 450 + Math.random() * 200;
      const isHeavy = i % 5 === 0 && w > 1;

      enemies.push({
        id: Date.now() + i,
        x: 400 + Math.cos(angle) * dist,
        y: 300 + Math.sin(angle) * dist,
        health: isHeavy ? 80 : 25,
        maxHealth: isHeavy ? 80 : 25,
        speed: isHeavy ? 70 : 130 + w * 8,
        color: isHeavy ? '#f59e0b' : '#ec4899',
        size: isHeavy ? 20 : 13,
        points: isHeavy ? 300 : 100
      });
    }

    stateRef.current.enemies = enemies;
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = {
      playerX: 400,
      playerY: 300,
      aimAngle: 0,
      bullets: [],
      enemies: [],
      score: 0,
      wave: 1,
      health: 100,
      dashTimer: 0,
      isDashing: false,
      gameOver: false,
      lastFire: 0,
      keys: { w: false, s: false, a: false, d: false, dash: false, shoot: false },
      mouse: { x: 400, y: 300 }
    };

    setScore(0);
    setWave(1);
    setHealth(100);
    setGameOver(false);
    setGameStarted(true);

    spawnWave(1);
    sounds.playGo();
  }, [spawnWave]);

  // Main Loop
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

      // Update Aim Angle to mouse/touch pointer
      state.aimAngle = Math.atan2(state.mouse.y - state.playerY, state.mouse.x - state.playerX);

      // Update Player Movement & Dash
      let moveSpeed = state.isDashing ? 600 : 220;
      if (state.keys.w && state.playerY > 20) state.playerY -= moveSpeed * dt;
      if (state.keys.s && state.playerY < height - 20) state.playerY += moveSpeed * dt;
      if (state.keys.a && state.playerX > 20) state.playerX -= moveSpeed * dt;
      if (state.keys.d && state.playerX < width - 20) state.playerX += moveSpeed * dt;

      // Dash recharge
      if (state.dashTimer > 0) {
        state.dashTimer -= dt;
        setDashCooldown(Math.max(0, state.dashTimer));
        if (state.dashTimer < 1.3) state.isDashing = false;
      }
      if (state.keys.dash && state.dashTimer <= 0) {
        state.isDashing = true;
        state.dashTimer = 1.6;
        sounds.playBoost();
      }

      // Auto / Click Shooting
      if ((state.keys.shoot || true) && now - state.lastFire > 140) {
        state.lastFire = now;
        sounds.playShoot(1.2);
        state.bullets.push({
          x: state.playerX + Math.cos(state.aimAngle) * 20,
          y: state.playerY + Math.sin(state.aimAngle) * 20,
          vx: Math.cos(state.aimAngle) * 750,
          vy: Math.sin(state.aimAngle) * 750
        });
      }

      // Update Bullets
      state.bullets.forEach(b => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      });
      state.bullets = state.bullets.filter(b => b.x > 0 && b.x < width && b.y > 0 && b.y < height);

      // Update Enemies
      state.enemies.forEach(bot => {
        const dx = state.playerX - bot.x;
        const dy = state.playerY - bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1) {
          bot.x += (dx / dist) * bot.speed * dt;
          bot.y += (dy / dist) * bot.speed * dt;
        }

        // Enemy touches player
        if (dist < bot.size + 14 && !state.isDashing) {
          state.health -= 25 * dt;
          setHealth(Math.round(state.health));
          if (state.health <= 0 && !state.gameOver) {
            state.gameOver = true;
            setGameOver(true);
            sounds.playLose();
            recordGamePlayed('robot_arena', false, state.score, 40);
          }
        }
      });

      // Bullet Hit Collision
      state.bullets.forEach(b => {
        state.enemies.forEach(bot => {
          const dist = Math.hypot(b.x - bot.x, b.y - bot.y);
          if (dist < bot.size + 6) {
            bot.health -= 35;
            b.x = -9999;
            sounds.playTargetHit();

            if (bot.health <= 0) {
              sounds.playExplosion();
              state.score += bot.points;
              setScore(state.score);
            }
          }
        });
      });

      state.enemies = state.enemies.filter(b => b.health > 0);

      // Wave Cleared
      if (state.enemies.length === 0 && !state.gameOver) {
        state.wave += 1;
        setWave(state.wave);
        sounds.playWin();
        state.health = Math.min(100, state.health + 30);
        setHealth(Math.round(state.health));
        spawnWave(state.wave);
      }

      // --- RENDER ---
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, width, height);

      // Cyber Grid floor
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Bullets
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      state.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Enemies
      state.enemies.forEach(bot => {
        ctx.fillStyle = bot.color;
        ctx.shadowColor = bot.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bot.x, bot.y, bot.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar
        if (bot.maxHealth > 25) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(bot.x - bot.size, bot.y - bot.size - 6, (bot.size * 2) * (bot.health / bot.maxHealth), 3);
        }
      });

      // Draw Player Robot
      ctx.save();
      ctx.translate(state.playerX, state.playerY);
      ctx.rotate(state.aimAngle);

      // Gun Barrels
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(10, -3, 14, 6);

      // Body
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameStarted, gameOver, spawnWave, recordGamePlayed]);

  // Event handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    stateRef.current.mouse = {
      x: ((e.clientX - rect.left) / rect.width) * 800,
      y: ((e.clientY - rect.top) / rect.height) * 600
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') k.w = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') k.s = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') k.a = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') k.d = true;
      if (e.code === 'Space') {
        e.preventDefault();
        k.dash = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = stateRef.current.keys;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') k.w = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') k.s = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') k.a = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') k.d = false;
      if (e.code === 'Space') k.dash = false;
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
      <div className="w-full max-w-4xl flex items-center justify-between py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGameId(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="font-display font-extrabold text-sm text-white">Robot Arena</span>
          </div>
        </div>
        <button onClick={startGame} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Frame */}
      <div
        onMouseMove={handleMouseMove}
        className="relative w-full max-w-4xl aspect-[4/3] max-h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center cursor-crosshair"
      >
        {!gameStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-3xl flex items-center justify-center">
              🤖
            </div>
            <h2 className="text-3xl font-black font-display text-white">Robot Arena</h2>
            <p className="text-xs text-slate-400 max-w-md">
              Twin-stick top-down survival combat! Move with WASD, aim with your mouse, dash through swarms, and eradicate rogue droids.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              DEPLOY BATTLE DROID
            </button>
          </div>
        )}

        <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-cover" />

        {/* Live HUD */}
        {gameStarted && (
          <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-20">
            <div className="px-4 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold">
              SCORE: <span className="text-indigo-400 font-mono text-sm">{score}</span>
            </div>
            <div className="flex gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-cyan-300">
                WAVE {wave}
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-rose-400">
                ❤️ {health}% HP
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl max-w-xs w-full text-center space-y-4">
              <div className="text-4xl">💥</div>
              <h3 className="text-2xl font-black text-white">SYSTEM DESTROYED</h3>
              <p className="text-xs text-slate-400">Wave {wave} • Score: {score}</p>
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Respawn
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
