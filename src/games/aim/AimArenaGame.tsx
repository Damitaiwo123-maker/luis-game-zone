import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crosshair,
  Target,
  Zap,
  Play,
  RotateCcw,
  Trophy,
  Activity,
  Flame,
  Clock,
  Award,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  ChevronLeft
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sounds } from '../../utils/audio';

type AimMode =
  | 'static'
  | 'moving'
  | 'flick'
  | 'reaction'
  | 'precision'
  | 'speed'
  | 'survival';

type AimDifficulty = 'easy' | 'medium' | 'hard';

interface AimTarget {
  id: number;
  x: number; // percentage 5 - 95
  y: number; // percentage 5 - 95
  radius: number; // px
  vx: number;
  vy: number;
  spawnTime: number;
  maxLifeMs: number;
  currentLifeMs: number;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
}

export const AimArenaGame: React.FC = () => {
  const { recordGamePlayed, setActiveGameId } = useGame();

  // Settings
  const [mode, setMode] = useState<AimMode>('static');
  const [difficulty, setDifficulty] = useState<AimDifficulty>('medium');
  const [crosshairStyle, setCrosshairStyle] = useState<'dot' | 'cross' | 'circle'>('cross');
  const [gameActive, setGameActive] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Live Performance Stats
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lives, setLives] = useState(3);
  const [personalBest, setPersonalBest] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('aim_arena_best') || 0);
    } catch {
      return 0;
    }
  });

  // Arena Ref
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const targetsRef = useRef<AimTarget[]>([]);
  const [targets, setTargets] = useState<AimTarget[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Difficulty parameters
  const getDifficultyParams = useCallback(() => {
    switch (difficulty) {
      case 'easy':
        return { radius: 36, speed: 0.8, lifeMs: 3500, count: 4 };
      case 'hard':
        return { radius: 18, speed: 2.4, lifeMs: 1800, count: 6 };
      case 'medium':
      default:
        return { radius: 26, speed: 1.5, lifeMs: 2400, count: 5 };
    }
  }, [difficulty]);

  // Spawn a single target
  const spawnTarget = useCallback((id: number, forcedX?: number, forcedY?: number) => {
    const params = getDifficultyParams();
    const x = forcedX !== undefined ? forcedX : 10 + Math.random() * 80;
    const y = forcedY !== undefined ? forcedY : 12 + Math.random() * 76;
    const angle = Math.random() * Math.PI * 2;
    const speed = mode === 'moving' ? params.speed : 0;

    return {
      id,
      x,
      y,
      radius: mode === 'precision' ? params.radius * 0.65 : params.radius,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spawnTime: performance.now(),
      maxLifeMs: mode === 'survival' ? 2000 : params.lifeMs,
      currentLifeMs: mode === 'survival' ? 2000 : params.lifeMs,
      color: mode === 'precision' ? '#ec4899' : '#06b6d4'
    };
  }, [getDifficultyParams, mode]);

  // Start Aim Session
  const startSession = useCallback(() => {
    const params = getDifficultyParams();
    const initialTargets: AimTarget[] = [];
    const count = mode === 'flick' || mode === 'reaction' ? 1 : params.count;

    for (let i = 0; i < count; i++) {
      initialTargets.push(spawnTarget(i));
    }

    targetsRef.current = initialTargets;
    setTargets(initialTargets);
    setScore(0);
    setHits(0);
    setMisses(0);
    setCombo(0);
    setMaxCombo(0);
    setReactionTimes([]);
    setTimeLeft(mode === 'speed' ? 60 : 30);
    setLives(3);
    setGameActive(true);
    setShowSummary(false);

    sounds.playCountdown();
  }, [getDifficultyParams, mode, spawnTarget]);

  // Session End
  const endSession = useCallback(() => {
    setGameActive(false);
    setShowSummary(true);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const currentHits = hits;
    const currentMisses = misses;
    const totalShots = currentHits + currentMisses;
    const acc = totalShots > 0 ? Math.round((currentHits / totalShots) * 100) : 0;
    const avgReact = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    // Check personal best
    if (score > personalBest) {
      setPersonalBest(score);
      try {
        localStorage.setItem('aim_arena_best', String(score));
      } catch {}
      sounds.playAchievement();
    } else {
      sounds.playWin();
    }

    recordGamePlayed('aim_arena', acc >= 80, score, 30);
  }, [hits, misses, personalBest, reactionTimes, recordGamePlayed, score]);

  // Countdown Timer
  useEffect(() => {
    if (!gameActive) return;

    timerIntervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameActive, endSession]);

  // Physics & Particle animation loop
  useEffect(() => {
    if (!gameActive) return;

    let lastTick = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTick) / 1000, 0.1);
      lastTick = now;

      // Update Moving Targets & Expiring targets
      const currentList = [...targetsRef.current];
      let updated = false;

      for (let i = 0; i < currentList.length; i++) {
        const t = currentList[i];

        // Move targets
        if (mode === 'moving') {
          t.x += t.vx * dt * 25;
          t.y += t.vy * dt * 25;

          // Bounce off boundary walls
          if (t.x < 8 || t.x > 92) t.vx *= -1;
          if (t.y < 8 || t.y > 92) t.vy *= -1;
          updated = true;
        }

        // Survival / Timed expiration
        if (mode === 'survival') {
          t.currentLifeMs -= dt * 1000;
          if (t.currentLifeMs <= 0) {
            // Target expired! Lose life
            sounds.playError();
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                endSession();
              }
              return newLives;
            });
            // Respawn new target
            currentList[i] = spawnTarget(Date.now() + Math.random());
            updated = true;
          }
        }
      }

      if (updated) {
        targetsRef.current = currentList;
        setTargets([...currentList]);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameActive, mode, endSession, spawnTarget]);

  // Handle Target Click
  const handleTargetClick = (e: React.MouseEvent, target: AimTarget) => {
    e.stopPropagation();
    if (!gameActive) return;

    const clickTime = performance.now();
    const reactionMs = Math.max(1, Math.round(clickTime - target.spawnTime));

    // Reaction sound
    const newCombo = combo + 1;
    sounds.playTargetHit(Math.min(newCombo, 10));

    // Calculate score points with combo bonus
    const basePoints = mode === 'precision' ? 250 : 100;
    const speedBonus = Math.max(0, 500 - reactionMs);
    const earnedScore = Math.round((basePoints + speedBonus) * (1 + newCombo * 0.15));

    setScore(prev => prev + earnedScore);
    setHits(prev => prev + 1);
    setCombo(newCombo);
    setMaxCombo(prev => Math.max(prev, newCombo));
    setReactionTimes(prev => [...prev, reactionMs]);

    // Respawn replacement target
    const current = targetsRef.current.filter(t => t.id !== target.id);
    current.push(spawnTarget(Date.now() + Math.random()));
    targetsRef.current = current;
    setTargets([...current]);
  };

  // Handle Miss (clicking empty arena space)
  const handleArenaMiss = () => {
    if (!gameActive) return;
    sounds.playShoot(0.7);
    setMisses(prev => prev + 1);
    setCombo(0);
  };

  // Calculations
  const totalShots = hits + misses;
  const accuracy = totalShots > 0 ? Math.round((hits / totalShots) * 100) : 100;
  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;
  const targetsPerMin = timeLeft < 30 ? Math.round((hits / (30 - timeLeft)) * 60) : 0;

  return (
    <div className="relative w-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-3 sm:p-6 bg-slate-950 text-slate-100 select-none">
      
      {/* Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between py-2 px-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveGameId(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← Back to Hub
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-display font-extrabold text-sm sm:text-base text-white tracking-wide">
              Aim Arena Pro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameActive && (
            <button
              onClick={endSession}
              className="px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              End Training
            </button>
          )}
          <button
            onClick={startSession}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Restart Session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Target Arena Frame */}
      <div
        ref={arenaRef}
        onClick={handleArenaMiss}
        className={`relative w-full max-w-5xl aspect-[16/9] min-h-[380px] sm:min-h-[520px] bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center cursor-crosshair ${
          crosshairStyle === 'dot' ? 'cursor-cell' : 'cursor-crosshair'
        }`}
      >
        {/* Subtle Target Grid Lines */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* LOBBY / MODE CONFIGURATOR */}
        {!gameActive && !showSummary && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col justify-between overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Target className="w-3.5 h-3.5" /> Professional Precision Aim Trainer
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white">
                Aim Arena Pro
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                Sharpen your flick speed, tracking accuracy, micro-adjustments, and reaction times with tournament-grade scenarios.
              </p>
            </div>

            {/* Mode & Difficulty Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 max-w-4xl mx-auto w-full">
              
              {/* Training Mode */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">1. Training Mode</span>
                <div className="space-y-1.5">
                  {[
                    { id: 'static', label: 'Static Targets', desc: 'Classic target clicking' },
                    { id: 'moving', label: 'Moving Targets', desc: 'Dynamic tracking & trajectory' },
                    { id: 'flick', label: 'Flick Shots', desc: 'Rapid reflex target snaps' },
                    { id: 'precision', label: 'Precision Mode', desc: 'Tiny shrinking bullseyes' },
                    { id: 'speed', label: 'Speed Blitz', desc: '60-second high-density rush' },
                    { id: 'survival', label: 'Survival Mode', desc: '3 lives against expiring targets' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as AimMode)}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        mode === m.id
                          ? 'bg-cyan-950/70 border-cyan-500 text-white font-bold ring-1 ring-cyan-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="font-bold">{m.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">2. Target Size & Speed</span>
                <div className="space-y-2">
                  {[
                    { id: 'easy', label: 'Easy', desc: 'Large 36px targets, gentle pace' },
                    { id: 'medium', label: 'Medium', desc: 'Standard 26px targets, fast respawns' },
                    { id: 'hard', label: 'Hard', desc: 'Small 18px targets, erratic movement' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id as AimDifficulty)}
                      className={`w-full p-3 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        difficulty === d.id
                          ? 'bg-cyan-950/70 border-cyan-500 text-white font-bold ring-1 ring-cyan-500'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="font-bold">{d.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{d.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Personal Best Stat */}
                {personalBest > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" /> Personal Best:
                    </span>
                    <span className="text-base font-black text-white font-mono">{personalBest}</span>
                  </div>
                )}
              </div>

              {/* Reticle Style */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">3. Crosshair Reticle</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cross', label: 'Cross', icon: '+' },
                    { id: 'dot', label: 'Dot', icon: '•' },
                    { id: 'circle', label: 'Circle', icon: '○' },
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCrosshairStyle(c.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        crosshairStyle === c.id
                          ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl font-black block">{c.icon}</span>
                      <span className="text-[10px] uppercase mt-1 block">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Launch CTA */}
            <div className="flex justify-center pt-2">
              <button
                onClick={startSession}
                className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                START AIM TRAINING
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE LIVE TARGETS */}
        {gameActive && targets.map(target => (
          <motion.div
            key={target.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={(e) => handleTargetClick(e, target)}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.radius * 2}px`,
              height: `${target.radius * 2}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute rounded-full border-2 border-white shadow-lg cursor-pointer flex items-center justify-center active:scale-90 transition-transform group"
          >
            {/* Outer Ring */}
            <div
              className="absolute inset-0 rounded-full opacity-80 animate-pulse"
              style={{ backgroundColor: target.color }}
            />
            {/* Center Bullseye */}
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-md z-10" />
          </motion.div>
        ))}

        {/* LIVE IN-GAME HUD METRICS OVERLAYS */}
        {gameActive && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
            {/* Score & Combo */}
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">SCORE</span>
                <span className="text-xl sm:text-2xl font-black font-mono text-white leading-tight">{score}</span>
              </div>

              {combo > 1 && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1.1 }}
                  className="px-3 py-1.5 rounded-xl bg-amber-950/85 border border-amber-500/40 text-amber-300 font-extrabold text-xs shadow-xl flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  {combo}x STREAK
                </motion.div>
              )}
            </div>

            {/* Timer / Lives */}
            <div className="flex items-center gap-3">
              {mode === 'survival' ? (
                <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl flex items-center gap-1.5 text-rose-400 font-bold text-sm">
                  <span>❤️</span> {lives} Lives
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">TIME</span>
                  <span className={`text-xl font-black font-mono leading-tight ${timeLeft <= 5 ? 'text-rose-400 animate-ping' : 'text-cyan-300'}`}>
                    {timeLeft}s
                  </span>
                </div>
              )}
            </div>

            {/* Accuracy & Avg Reaction */}
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-center shadow-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">ACC</span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-400 leading-tight">
                  {accuracy}%
                </span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-center shadow-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">AVG REACTION</span>
                <span className="text-sm sm:text-base font-extrabold text-cyan-300 leading-tight font-mono">
                  {avgReactionTime}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE SUMMARY MODAL */}
        {showSummary && (
          <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-750 p-6 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-3xl flex items-center justify-center mx-auto">
                🎯
              </div>

              <div>
                <h3 className="text-2xl font-black font-display text-white">Session Complete!</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mode: {mode.toUpperCase()} • {difficulty.toUpperCase()}</p>
              </div>

              {/* Stats Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-left">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Final Score</span>
                  <p className="text-xl font-black font-mono text-white">{score}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Accuracy</span>
                  <p className="text-xl font-black font-mono text-emerald-400">{accuracy}%</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Avg Reaction</span>
                  <p className="text-xl font-black font-mono text-cyan-400">{avgReactionTime}ms</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Hits / Misses</span>
                  <p className="text-xl font-black font-mono text-slate-200">{hits} / {misses}</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={startSession}
                  className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Train Again
                </button>
                <button
                  onClick={() => setShowSummary(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  Change Mode
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};
