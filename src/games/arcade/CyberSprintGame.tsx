import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Pause, Trophy, Zap, Shield, Sparkles, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

interface Obstacle {
  id: number;
  z: number; // distance ahead
  lane: number; // -1 (left), 0 (center), 1 (right)
  type: 'barrier' | 'high_barrier' | 'coin' | 'powerup';
}

export const CyberSprintGame: React.FC = () => {
  const { recordGamePlayed, setActiveGameId } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [distanceMeters, setDistanceMeters] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const stateRef = useRef({
    lane: 0, // -1, 0, 1
    targetX: 0,
    currentX: 0,
    isJumping: false,
    jumpY: 0,
    jumpVelocity: 0,
    isSliding: false,
    slideTimer: 0,
    speed: 350,
    distance: 0,
    coins: 0,
    score: 0,
    multiplier: 1,
    shieldActive: false,
    obstacles: [] as Obstacle[],
    gameOver: false,
    nextObstacleZ: 600
  });

  const startGame = useCallback(() => {
    stateRef.current = {
      lane: 0,
      targetX: 0,
      currentX: 0,
      isJumping: false,
      jumpY: 0,
      jumpVelocity: 0,
      isSliding: false,
      slideTimer: 0,
      speed: 350,
      distance: 0,
      coins: 0,
      score: 0,
      multiplier: 1,
      shieldActive: false,
      obstacles: [],
      gameOver: false,
      nextObstacleZ: 600
    };

    setScore(0);
    setCoins(0);
    setMultiplier(1);
    setDistanceMeters(0);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);

    sounds.playGo();
  }, []);

  // Lane Change
  const moveLeft = useCallback(() => {
    const s = stateRef.current;
    if (s.lane > -1) {
      s.lane -= 1;
      s.targetX = s.lane * 140;
      sounds.playMove();
    }
  }, []);

  const moveRight = useCallback(() => {
    const s = stateRef.current;
    if (s.lane < 1) {
      s.lane += 1;
      s.targetX = s.lane * 140;
      sounds.playMove();
    }
  }, []);

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.isJumping && !s.isSliding) {
      s.isJumping = true;
      s.jumpVelocity = 480;
      sounds.playJump();
    }
  }, []);

  const slide = useCallback(() => {
    const s = stateRef.current;
    if (!s.isSliding && !s.isJumping) {
      s.isSliding = true;
      s.slideTimer = 0.6;
      sounds.playMove();
    }
  }, []);

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

      // Update Player Position
      state.currentX += (state.targetX - state.currentX) * 15 * dt;

      // Jump Physics
      if (state.isJumping) {
        state.jumpY += state.jumpVelocity * dt;
        state.jumpVelocity -= 1200 * dt; // Gravity
        if (state.jumpY <= 0) {
          state.jumpY = 0;
          state.isJumping = false;
        }
      }

      // Slide Timer
      if (state.isSliding) {
        state.slideTimer -= dt;
        if (state.slideTimer <= 0) {
          state.isSliding = false;
        }
      }

      // Progress Distance & Speed
      state.distance += state.speed * dt;
      state.score += Math.round(state.speed * state.multiplier * dt * 0.1);
      state.speed = Math.min(750, state.speed + dt * 6); // Gradual acceleration

      setDistanceMeters(Math.floor(state.distance / 10));
      setScore(state.score);

      // Spawn Obstacles & Pickups
      if (state.distance > state.nextObstacleZ) {
        state.nextObstacleZ += 200 + Math.random() * 150;
        const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const rand = Math.random();
        let type: Obstacle['type'] = 'barrier';
        if (rand < 0.45) type = 'barrier';
        else if (rand < 0.7) type = 'high_barrier';
        else if (rand < 0.9) type = 'coin';
        else type = 'powerup';

        state.obstacles.push({
          id: Date.now() + Math.random(),
          z: state.distance + 1200,
          lane,
          type
        });
      }

      // Update & Check Obstacles Collisions
      state.obstacles = state.obstacles.filter(obs => {
        const relativeZ = obs.z - state.distance;
        
        // Collision check when obstacle reaches player (around relativeZ = 0)
        if (relativeZ < 40 && relativeZ > -40) {
          if (obs.lane === state.lane) {
            if (obs.type === 'coin') {
              sounds.playScore();
              state.coins += 1;
              state.score += 50 * state.multiplier;
              setCoins(state.coins);
              return false;
            } else if (obs.type === 'powerup') {
              sounds.playBoost();
              state.multiplier = Math.min(5, state.multiplier + 1);
              setMultiplier(state.multiplier);
              return false;
            } else if (obs.type === 'barrier') {
              // Barrier can be jumped over
              if (state.jumpY < 35) {
                // Hit!
                sounds.playError();
                state.gameOver = true;
                setGameOver(true);
                recordGamePlayed('cyber_sprint', false, state.score, Math.floor(state.distance / 100));
              }
            } else if (obs.type === 'high_barrier') {
              // High barrier can be slid under
              if (!state.isSliding) {
                // Hit!
                sounds.playError();
                state.gameOver = true;
                setGameOver(true);
                recordGamePlayed('cyber_sprint', false, state.score, Math.floor(state.distance / 100));
              }
            }
          }
        }

        return relativeZ > -100;
      });

      // --- 3D PERSPECTIVE RENDERING ---
      ctx.fillStyle = '#050814';
      ctx.fillRect(0, 0, width, height);

      // Distant Horizon & Grid
      const horizonY = height * 0.4;
      const vanishingX = width / 2;

      // Draw 3 Running Lanes
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineWidth = 2;
      [-210, -70, 70, 210].forEach(laneOffset => {
        ctx.beginPath();
        ctx.moveTo(vanishingX + laneOffset * 0.1, horizonY);
        ctx.lineTo(vanishingX + laneOffset * 2.2, height);
        ctx.stroke();
      });

      // Perspective Grid Horizontal Lines
      const gridOffset = (state.distance % 100) / 100;
      for (let g = 0; g < 12; g++) {
        const p = Math.pow((g + gridOffset) / 12, 2.5);
        const gy = horizonY + (height - horizonY) * p;
        ctx.strokeStyle = `rgba(99, 102, 241, ${p * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Draw Obstacles (Far to Near)
      const sortedObs = [...state.obstacles].sort((a, b) => b.z - a.z);
      sortedObs.forEach(obs => {
        const relativeZ = obs.z - state.distance;
        if (relativeZ <= 0 || relativeZ > 1200) return;

        const scale = Math.pow(1 - relativeZ / 1200, 2);
        const obsX = vanishingX + (obs.lane * 140) * (scale * 2.2);
        const obsY = horizonY + (height - horizonY) * scale;
        const obsW = Math.max(10, 80 * scale);
        const obsH = Math.max(10, 70 * scale);

        if (obs.type === 'barrier') {
          // Low Barrier (Must jump)
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f87171';
          ctx.shadowBlur = 10;
          ctx.fillRect(obsX - obsW / 2, obsY - obsH * 0.5, obsW, obsH * 0.5);
          ctx.shadowBlur = 0;
        } else if (obs.type === 'high_barrier') {
          // Overhead Barrier (Must slide)
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fillRect(obsX - obsW / 2, obsY - obsH * 1.4, obsW, obsH * 0.6);
          ctx.shadowBlur = 0;
        } else if (obs.type === 'coin') {
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#fde047';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(obsX, obsY - obsH * 0.4, obsW * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (obs.type === 'powerup') {
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(obsX, obsY - obsH * 0.5, obsW * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Player Runner
      const playerScreenX = vanishingX + state.currentX * 1.8;
      const playerBaseY = height * 0.86;
      const playerDrawY = playerBaseY - state.jumpY;
      const playerW = state.isSliding ? 44 : 32;
      const playerH = state.isSliding ? 22 : 54;

      // Player Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(playerScreenX, playerBaseY + 10, playerW * 0.8, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cyber Runner Body
      ctx.fillStyle = '#6366f1';
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(playerScreenX - playerW / 2, playerDrawY - playerH, playerW, playerH, 8);
      ctx.fill();

      // Runner Visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(playerScreenX - playerW * 0.35, playerDrawY - playerH + 6, playerW * 0.7, 8);
      ctx.shadowBlur = 0;

      animFrameId.current = requestAnimationFrame(loop);
    };

    animFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [gameStarted, isPaused, gameOver, recordGamePlayed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || isPaused) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft();
      if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight();
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') jump();
      if (e.code === 'ArrowDown' || e.code === 'KeyS') slide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, isPaused, moveLeft, moveRight, jump, slide]);

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-3 sm:p-6 bg-slate-950 text-slate-100 select-none">
      {/* Top Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGameId(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Hub
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide">
              Cyber Sprint 3D
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
      <div className="relative w-full max-w-4xl aspect-[16/9] min-h-[380px] sm:min-h-[500px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
        {!gameStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-3xl flex items-center justify-center">
              ⚡
            </div>
            <h2 className="text-3xl font-black font-display text-white">Cyber Sprint 3D</h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              Dash through neon cyberspace! Jump over laser barriers, slide under high walls, collect cyber coins, and build massive speed multipliers.
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm shadow-xl shadow-cyan-600/30 cursor-pointer"
            >
              START SPRINT
            </button>
          </div>
        )}

        <canvas ref={canvasRef} width={860} height={500} className="w-full h-full object-cover" />

        {/* Live HUD */}
        {gameStarted && (
          <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-20">
            <div className="flex gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold">
                SCORE: <span className="text-white font-mono">{score}</span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-amber-400">
                🪙 {coins}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="px-3.5 py-1.5 rounded-xl bg-cyan-950/85 border border-cyan-500/40 text-cyan-300 text-xs font-bold">
                {multiplier}x MULTIPLIER
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 border border-slate-800 text-xs font-bold text-slate-300">
                {distanceMeters}m
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl max-w-sm w-full text-center space-y-4">
              <div className="text-4xl">💥</div>
              <h3 className="text-2xl font-black text-white">RUN OVER</h3>
              <p className="text-xs text-slate-400">Distance: {distanceMeters}m • Final Score: {score}</p>
              <button
                onClick={startGame}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
              >
                Sprint Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      {gameStarted && (
        <div className="w-full max-w-4xl mt-3 flex justify-between items-center gap-4 lg:hidden">
          <div className="flex gap-2">
            <button onClick={moveLeft} className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-750 active:bg-cyan-600 text-white text-xl flex items-center justify-center">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button onClick={moveRight} className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-750 active:bg-cyan-600 text-white text-xl flex items-center justify-center">
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={slide} className="w-16 h-14 rounded-2xl bg-amber-950 border border-amber-500/40 active:bg-amber-600 text-amber-300 active:text-white text-xs font-bold flex flex-col items-center justify-center">
              <ArrowDown className="w-5 h-5" />
              SLIDE
            </button>
            <button onClick={jump} className="w-16 h-14 rounded-2xl bg-cyan-600 border border-cyan-400 active:bg-cyan-500 text-white text-xs font-bold flex flex-col items-center justify-center">
              <ArrowUp className="w-5 h-5" />
              JUMP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
