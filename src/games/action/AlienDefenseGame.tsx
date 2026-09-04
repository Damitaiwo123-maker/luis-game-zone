import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Zap, Shield, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

interface Turret {
  id: number;
  x: number;
  y: number;
  type: 'laser' | 'plasma' | 'tesla';
  range: number;
  damage: number;
  fireRate: number; // ms
  lastFire: number;
  cost: number;
  color: string;
}

interface AlienEnemy {
  id: number;
  pathIndex: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  color: string;
}

const WAYPOINTS = [
  { x: 0, y: 150 },
  { x: 220, y: 150 },
  { x: 220, y: 350 },
  { x: 480, y: 350 },
  { x: 480, y: 180 },
  { x: 700, y: 180 },
  { x: 700, y: 480 },
  { x: 800, y: 480 }
];

export const AlienDefenseGame: React.FC = () => {
  const { recordGamePlayed, setActiveGameId } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [selectedTurretType, setSelectedTurretType] = useState<'laser' | 'plasma' | 'tesla'>('laser');

  const [credits, setCredits] = useState(250);
  const [coreHealth, setCoreHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const stateRef = useRef({
    credits: 250,
    coreHealth: 100,
    wave: 1,
    score: 0,
    turrets: [] as Turret[],
    enemies: [] as AlienEnemy[],
    gameOver: false,
    victory: false,
    selectedType: 'laser' as 'laser' | 'plasma' | 'tesla'
  });

  const spawnWave = useCallback((w: number) => {
    const enemies: AlienEnemy[] = [];
    const count = 8 + w * 4;

    for (let i = 0; i < count; i++) {
      const isBoss = i === count - 1 && w % 3 === 0;
      enemies.push({
        id: Date.now() + i,
        pathIndex: 0,
        x: -i * 60,
        y: WAYPOINTS[0].y,
        health: isBoss ? 350 : 40 + w * 12,
        maxHealth: isBoss ? 350 : 40 + w * 12,
        speed: isBoss ? 45 : 75 + Math.random() * 20,
        reward: isBoss ? 150 : 25,
        color: isBoss ? '#ec4899' : (i % 2 === 0 ? '#06b6d4' : '#f59e0b')
      });
    }

    stateRef.current.enemies = enemies;
  }, []);

  const startGame = useCallback(() => {
    stateRef.current = {
      credits: 300,
      coreHealth: 100,
      wave: 1,
      score: 0,
      turrets: [],
      enemies: [],
      gameOver: false,
      victory: false,
      selectedType: 'laser'
    };

    setCredits(300);
    setCoreHealth(100);
    setWave(1);
    setScore(0);
    setGameOver(false);
    setVictory(false);
    setGameStarted(true);

    spawnWave(1);
    sounds.playGo();
  }, [spawnWave]);

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

      // Update Enemies following Waypoints
      state.enemies.forEach(enemy => {
        if (enemy.pathIndex < WAYPOINTS.length - 1) {
          const target = WAYPOINTS[enemy.pathIndex + 1];
          const dx = target.x - enemy.x;
          const dy = target.y - enemy.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 5) {
            enemy.pathIndex += 1;
          } else {
            enemy.x += (dx / dist) * enemy.speed * dt;
            enemy.y += (dy / dist) * enemy.speed * dt;
          }
        } else {
          // Reached Core!
          enemy.health = 0;
          state.coreHealth -= 15;
          setCoreHealth(Math.max(0, state.coreHealth));
          sounds.playError();

          if (state.coreHealth <= 0 && !state.gameOver) {
            state.gameOver = true;
            setGameOver(true);
            sounds.playLose();
            recordGamePlayed('alien_defense', false, state.score, 60);
          }
        }
      });

      // Turrets Firing Logic
      state.turrets.forEach(turret => {
        if (now - turret.lastFire >= turret.fireRate) {
          // Find closest in-range enemy
          let targetEnemy: AlienEnemy | null = null;
          let minDist = turret.range;

          state.enemies.forEach(e => {
            if (e.x > 0) {
              const d = Math.hypot(e.x - turret.x, e.y - turret.y);
              if (d < minDist) {
                minDist = d;
                targetEnemy = e;
              }
            }
          });

          if (targetEnemy) {
            turret.lastFire = now;
            sounds.playLaser(turret.type === 'plasma' ? 900 : 1600);
            (targetEnemy as AlienEnemy).health -= turret.damage;

            // Draw laser line
            ctx.strokeStyle = turret.color;
            ctx.lineWidth = turret.type === 'plasma' ? 4 : 2;
            ctx.beginPath();
            ctx.moveTo(turret.x, turret.y);
            ctx.lineTo((targetEnemy as AlienEnemy).x, (targetEnemy as AlienEnemy).y);
            ctx.stroke();

            if ((targetEnemy as AlienEnemy).health <= 0) {
              sounds.playTargetHit();
              state.credits += (targetEnemy as AlienEnemy).reward;
              state.score += (targetEnemy as AlienEnemy).reward * 5;
              setCredits(state.credits);
              setScore(state.score);
            }
          }
        }
      });

      state.enemies = state.enemies.filter(e => e.health > 0);

      // Wave Cleared
      if (state.enemies.length === 0 && !state.gameOver) {
        if (state.wave >= 8) {
          state.victory = true;
          setVictory(true);
          sounds.playWin();
          recordGamePlayed('alien_defense', true, state.score + 3000, 90);
        } else {
          state.wave += 1;
          setWave(state.wave);
          sounds.playWin();
          state.credits += 100;
          setCredits(state.credits);
          spawnWave(state.wave);
        }
      }

      // --- RENDER ---
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, width, height);

      // Draw Pathway
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 42;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      WAYPOINTS.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Pathway Border Glow
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 44;
      ctx.stroke();

      // Draw Energy Core Base
      const endPt = WAYPOINTS[WAYPOINTS.length - 1];
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(endPt.x, endPt.y, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Turrets
      state.turrets.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Turret Barrel
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Enemies
      state.enemies.forEach(e => {
        if (e.x > 0) {
          ctx.fillStyle = e.color;
          ctx.shadowColor = e.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Health bar
          ctx.fillStyle = '#10b981';
          ctx.fillRect(e.x - 12, e.y - 18, 24 * (e.health / e.maxHealth), 3);
        }
      });

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameStarted, gameOver, victory, spawnWave, recordGamePlayed]);

  // Place Turret on Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameStarted || gameOver || victory) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 560;

    const costs = { laser: 100, plasma: 175, tesla: 225 };
    const cost = costs[selectedTurretType];

    if (stateRef.current.credits < cost) {
      sounds.playError();
      return;
    }

    // Check if too close to pathway
    let onPath = false;
    WAYPOINTS.forEach((p, idx) => {
      if (idx < WAYPOINTS.length - 1) {
        const next = WAYPOINTS[idx + 1];
        const dist = Math.hypot(x - p.x, y - p.y);
        if (dist < 32) onPath = true;
      }
    });

    if (onPath) {
      sounds.playError();
      return;
    }

    stateRef.current.credits -= cost;
    setCredits(stateRef.current.credits);
    sounds.playMove();

    stateRef.current.turrets.push({
      id: Date.now(),
      x,
      y,
      type: selectedTurretType,
      range: selectedTurretType === 'plasma' ? 180 : (selectedTurretType === 'tesla' ? 120 : 150),
      damage: selectedTurretType === 'plasma' ? 45 : (selectedTurretType === 'tesla' ? 65 : 20),
      fireRate: selectedTurretType === 'plasma' ? 800 : (selectedTurretType === 'tesla' ? 1200 : 350),
      lastFire: 0,
      cost,
      color: selectedTurretType === 'plasma' ? '#ec4899' : (selectedTurretType === 'tesla' ? '#f59e0b' : '#38bdf8')
    });
  };

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
            <span className="text-xl">🛡️</span>
            <span className="font-display font-extrabold text-sm text-white">Alien Defense Tactical</span>
          </div>
        </div>
        <button onClick={startGame} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[560px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center cursor-pointer">
        {!gameStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-3xl flex items-center justify-center">
              🛡️
            </div>
            <h2 className="text-3xl font-black font-display text-white">Alien Defense Tactical</h2>
            <p className="text-xs text-slate-400 max-w-md">
              Construct laser, plasma, and tesla turrets along defense choke-points to protect the energy core against alien invasion waves.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 cursor-pointer"
            >
              COMMENCE DEFENSE
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          width={800}
          height={560}
          className="w-full h-full object-cover"
        />

        {/* Live HUD */}
        {gameStarted && (
          <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-20">
            <div className="flex gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-amber-300">
                ⚡ {credits} Credits
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-cyan-300">
                WAVE {wave}/8
              </div>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-rose-400">
              🛡️ CORE: {coreHealth}%
            </div>
          </div>
        )}

        {(gameOver || victory) && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl max-w-xs w-full text-center space-y-4">
              <div className="text-4xl">{victory ? '🏆' : '💥'}</div>
              <h3 className="text-2xl font-black text-white">{victory ? 'BASE SECURED!' : 'CORE OVERRUN'}</h3>
              <p className="text-xs text-slate-400">Wave {wave} • Score: {score}</p>
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

      {/* Turret Selection Toolbar */}
      {gameStarted && (
        <div className="w-full max-w-4xl mt-3 flex items-center justify-center gap-3">
          {[
            { id: 'laser', name: 'Laser Turret', cost: 100, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
            { id: 'plasma', name: 'Plasma Cannon', cost: 175, color: 'text-pink-400 border-pink-500/40 bg-pink-950/40' },
            { id: 'tesla', name: 'Tesla Coil', cost: 225, color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTurretType(t.id as any)}
              className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                selectedTurretType === t.id ? `${t.color} ring-2 ring-indigo-500 scale-105` : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {t.name} ({t.cost}c)
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
