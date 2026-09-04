import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useGame } from '../../context/GameContext';
import { CAR_ARCHETYPES, RACING_TRACKS, CarModel, TrackConfig, AIRacerState } from './types';
import { ThreeCarBuilder, BuiltCar } from './ThreeCarBuilder';
import { ThreeTrackBuilder, BuiltTrack } from './ThreeTrackBuilder';
import { RacingPhysics, PlayerPhysicsState } from './RacingPhysics';
import { sounds } from '../../utils/audio';
import {
  Trophy,
  RotateCcw,
  Zap,
  Gauge,
  Flag,
  Flame,
  ArrowLeft,
  Volume2,
  VolumeX,
  Sparkles,
  ChevronRight,
  Shield,
  Compass,
  Play
} from 'lucide-react';

export const TurboKartRushGame: React.FC = () => {
  const { setActiveGameId, recordGamePlayed, triggerConfetti } = useGame();

  // Selection states
  const [selectedCar, setSelectedCar] = useState<CarModel>(CAR_ARCHETYPES[0]);
  const [selectedTrack, setSelectedTrack] = useState<TrackConfig>(RACING_TRACKS[0]);
  const [gameState, setGameState] = useState<'garage' | 'countdown' | 'racing' | 'finished'>('garage');
  const [countdownNum, setCountdownNum] = useState<number | string>(3);
  const [soundMuted, setSoundMuted] = useState<boolean>(!sounds.isSoundEnabled());

  // HUD live states (updated at throttled rate for React UI)
  const [hudSpeedKmh, setHudSpeedKmh] = useState<number>(0);
  const [hudLap, setHudLap] = useState<number>(1);
  const [hudPosition, setHudPosition] = useState<number>(1);
  const [hudNitro, setHudNitro] = useState<number>(100);
  const [hudDriftCharge, setHudDriftCharge] = useState<number>(0);
  const [hudIsDrifting, setHudIsDrifting] = useState<boolean>(false);
  const [hudIsBoosting, setHudIsBoosting] = useState<boolean>(false);
  const [hudTime, setHudTime] = useState<number>(0);
  const [hudCoins, setHudCoins] = useState<number>(0);
  const [finalResults, setFinalResults] = useState<{
    rank: number;
    totalTime: number;
    lapTimes: number[];
    bestLap: number;
    coins: number;
    score: number;
  } | null>(null);

  // Canvas and Three.js references
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);

  // Engine state references (kept in refs to run 60fps smoothly without React re-renders)
  const engineRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    playerCar: BuiltCar | null;
    track: BuiltTrack | null;
    aiRacers: AIRacerState[];
    playerState: PlayerPhysicsState;
    inputs: { forward: boolean; backward: boolean; left: boolean; right: boolean; drift: boolean; nitro: boolean };
    particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[];
    animId: number | null;
    lastTime: number;
    startTime: number;
    cameraOffset: THREE.Vector3;
    shake: number;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    playerCar: null,
    track: null,
    aiRacers: [],
    playerState: {
      position: new THREE.Vector3(0, 0.5, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      roll: 0,
      speed: 0,
      speedKmh: 0,
      steerAngle: 0,
      isDrifting: false,
      driftAngle: 0,
      driftCharge: 0,
      isBoosting: false,
      nitroFuel: 100,
      boostTimer: 0,
      currentLap: 1,
      currentCheckpoint: 0,
      totalDistanceCovered: 0,
      lapTimes: [],
      currentLapStartTime: 0,
      bestLapTime: null,
      raceFinished: false,
      finishTime: null,
      crashImpact: 0,
      collectedCoins: 0,
      score: 0
    },
    inputs: { forward: false, backward: false, left: false, right: false, drift: false, nitro: false },
    particles: [],
    animId: null,
    lastTime: 0,
    startTime: 0,
    cameraOffset: new THREE.Vector3(0, 3.2, -7.5),
    shake: 0
  });

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    sounds.setSoundEnabled(!next);
  };

  // ==============================================================
  // START RACE INITIALIZATION
  // ==============================================================
  const startRace = useCallback(() => {
    setGameState('countdown');
    setCountdownNum(3);
    sounds.playCountdown();

    const e = engineRef.current;
    if (!e.scene || !e.camera || !e.renderer) return;

    // Build the Track in 3D
    if (e.track) {
      e.scene.remove(e.track.group);
    }
    const builtTrack = ThreeTrackBuilder.buildTrack(selectedTrack);
    e.scene.add(builtTrack.group);
    e.track = builtTrack;

    // Build Player Car
    if (e.playerCar) {
      e.scene.remove(e.playerCar.group);
    }
    const builtPlayerCar = ThreeCarBuilder.buildCar(selectedCar);
    e.scene.add(builtPlayerCar.group);
    e.playerCar = builtPlayerCar;

    // Reset Player State
    const startPoint = builtTrack.curve.getPointAt(0);
    const startTangent = builtTrack.curve.getTangentAt(0);
    const startYaw = Math.atan2(startTangent.x, startTangent.z);

    e.playerState = {
      position: new THREE.Vector3(startPoint.x - 3, startPoint.y + 0.05, startPoint.z - 5),
      velocity: new THREE.Vector3(0, 0, 0),
      yaw: startYaw,
      pitch: 0,
      roll: 0,
      speed: 0,
      speedKmh: 0,
      steerAngle: 0,
      isDrifting: false,
      driftAngle: 0,
      driftCharge: 0,
      isBoosting: false,
      nitroFuel: 100,
      boostTimer: 0,
      currentLap: 1,
      currentCheckpoint: 0,
      totalDistanceCovered: 0,
      lapTimes: [],
      currentLapStartTime: performance.now(),
      bestLapTime: null,
      raceFinished: false,
      finishTime: null,
      crashImpact: 0,
      collectedCoins: 0,
      score: 0
    };

    builtPlayerCar.group.position.copy(e.playerState.position);
    builtPlayerCar.group.rotation.y = startYaw;

    // Remove existing AI cars
    for (let ai of e.aiRacers) {
      e.scene.remove(ai.group);
    }
    e.aiRacers = [];

    // Build 4 AI Competitors
    const aiConfigs = [
      { name: 'Vortex Blaze', archetype: CAR_ARCHETYPES[1], lateralOffset: 4.5, distOffset: 6 },
      { name: 'Shadow Stryker', archetype: CAR_ARCHETYPES[2], lateralOffset: -4.5, distOffset: 14 },
      { name: 'Cyber Phantom', archetype: CAR_ARCHETYPES[3], lateralOffset: 2.5, distOffset: 22 },
      { name: 'Solaris Apex', archetype: CAR_ARCHETYPES[0], lateralOffset: -2.5, distOffset: 30 }
    ];

    for (let cfg of aiConfigs) {
      const aiBuilt = ThreeCarBuilder.buildCar(cfg.archetype);
      e.scene.add(aiBuilt.group);

      const u = (cfg.distOffset / builtTrack.trackLength);
      const pos = builtTrack.curve.getPointAt(u);
      const tan = builtTrack.curve.getTangentAt(u);
      const yaw = Math.atan2(tan.x, tan.z);

      aiBuilt.group.position.copy(pos);
      aiBuilt.group.rotation.y = yaw;

      e.aiRacers.push({
        id: cfg.name,
        name: cfg.name,
        carModel: cfg.archetype,
        group: aiBuilt.group,
        position: pos.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        yaw,
        speed: 0,
        maxSpeed: cfg.archetype.maxSpeedKmh / 3.6,
        currentWaypointIndex: 0,
        lateralOffset: cfg.lateralOffset,
        lap: 1,
        distanceAlongTrack: cfg.distOffset,
        wheels: aiBuilt.wheels as unknown as THREE.Mesh[],
        finished: false
      });
    }

    // Set Sky & Fog colors from track config
    e.scene.background = new THREE.Color(selectedTrack.skyColor);
    e.scene.fog = new THREE.FogExp2(selectedTrack.fogColor, 0.0035);

    // Countdown sequence (3, 2, 1, GO!)
    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNum(count);
        sounds.playCountdown();
      } else if (count === 0) {
        setCountdownNum('GO!');
        sounds.playGo();
        setGameState('racing');
        e.startTime = performance.now();
        e.playerState.currentLapStartTime = performance.now();
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }, [selectedCar, selectedTrack]);

  // Respawn / Reset position safely on track
  const handleResetCar = useCallback(() => {
    const e = engineRef.current;
    if (!e.track || !e.playerCar) return;

    const u = e.playerState.currentCheckpoint / e.track.checkpoints.length;
    const safePos = e.track.curve.getPointAt(u);
    const safeTan = e.track.curve.getTangentAt(u);

    e.playerState.position.copy(safePos);
    e.playerState.position.y += 0.05;
    e.playerState.yaw = Math.atan2(safeTan.x, safeTan.z);
    e.playerState.speed = 0;
    e.playerState.driftAngle = 0;
    e.playerState.isDrifting = false;

    e.playerCar.group.position.copy(e.playerState.position);
    e.playerCar.group.rotation.y = e.playerState.yaw;
    sounds.playMove();
  }, []);

  // ==============================================================
  // THREE.JS INITIALIZATION & GAME LOOP
  // ==============================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050814);
    scene.fog = new THREE.FogExp2(0x0a1020, 0.0035);

    // Camera
    const camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1500);
    camera.position.set(0, 4, -8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Hemisphere Sky Light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.8);
    scene.add(hemiLight);

    // Directional Sunlight with Shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(120, 240, 100);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 600;
    const d = 120;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Particle geometry pool
    const sparkGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Store in engine ref
    const e = engineRef.current;
    e.scene = scene;
    e.camera = camera;
    e.renderer = renderer;
    e.lastTime = performance.now();

    // ============================================================
    // KEYBOARD INPUT LISTENERS
    // ============================================================
    const handleKeyDown = (evt: KeyboardEvent) => {
      const code = evt.code;
      if (code === 'KeyW' || code === 'ArrowUp') e.inputs.forward = true;
      if (code === 'KeyS' || code === 'ArrowDown') e.inputs.backward = true;
      if (code === 'KeyA' || code === 'ArrowLeft') e.inputs.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') e.inputs.right = true;
      if (code === 'Space') e.inputs.drift = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') e.inputs.nitro = true;
      if (code === 'KeyR') handleResetCar();
    };

    const handleKeyUp = (evt: KeyboardEvent) => {
      const code = evt.code;
      if (code === 'KeyW' || code === 'ArrowUp') e.inputs.forward = false;
      if (code === 'KeyS' || code === 'ArrowDown') e.inputs.backward = false;
      if (code === 'KeyA' || code === 'ArrowLeft') e.inputs.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') e.inputs.right = false;
      if (code === 'Space') e.inputs.drift = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') e.inputs.nitro = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Resize Observer for responsive canvas sizing
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // ============================================================
    // MAIN 60FPS GAME LOOP
    // ============================================================
    let lastUiUpdate = 0;

    const gameLoop = (time: number) => {
      const dt = Math.min((time - e.lastTime) / 1000, 0.1);
      e.lastTime = time;

      if (e.playerCar && e.track) {
        // Physics update when racing
        if (e.playerState && !e.playerState.raceFinished) {
          RacingPhysics.updatePlayer(
            dt,
            e.playerState,
            e.inputs,
            selectedCar,
            e.track,
            () => {
              // On Crash
              e.shake = 0.8;
              sounds.playCrash();
            },
            () => {
              // On Drift Boost / Speed Pad
              sounds.playBoost();
            },
            () => {
              // On Coin Collected
              sounds.playScore();
            },
            (lap) => {
              // On Lap Complete
              sounds.playAchievement();
            }
          );

          // Update AI racers
          RacingPhysics.updateAIRacers(dt, e.aiRacers, e.track, e.playerState.position);

          // Resolve collisions between player and AI
          RacingPhysics.resolveCarCollisions(e.playerState, e.aiRacers, () => {
            e.shake = 0.4;
            sounds.playCrash();
          });
        }

        // ========================================================
        // 3D CAR TRANSFORM & ANIMATION UPDATES
        // ========================================================
        const pState = e.playerState;
        const pCar = e.playerCar;

        // Position & Yaw
        pCar.group.position.copy(pState.position);
        pCar.group.rotation.y = pState.yaw + pState.driftAngle;

        // Front wheels steering angle
        pCar.frontLeftWheel.rotation.y = pState.steerAngle;
        pCar.frontRightWheel.rotation.y = pState.steerAngle;

        // Spin all 4 wheels based on road velocity
        const wheelSpinSpeed = (pState.speed / 0.38) * dt;
        for (let wheel of pCar.wheels) {
          wheel.rotation.x += wheelSpinSpeed;
        }

        // Taillights / Brake lights intensity
        const isBraking = e.inputs.backward && pState.speed > 0;
        for (let bl of pCar.brakeLights) {
          const mat = bl.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = isBraking ? 4.5 : 1.2;
        }
        if (pCar.brakeLight) {
          pCar.brakeLight.intensity = isBraking ? 2.5 : 0.4;
        }

        // Nitro flame effect
        for (let fl of pCar.nitroFlames) {
          fl.visible = pState.isBoosting;
          if (pState.isBoosting) {
            fl.scale.set(1 + Math.random() * 0.4, 1 + Math.random() * 0.8, 1);
          }
        }
        if (pCar.nitroLight) {
          pCar.nitroLight.intensity = pState.isBoosting ? 3.0 : 0;
        }

        // ========================================================
        // DYNAMIC CHASE CAMERA (Smooth Follow + Dynamic FOV)
        // ========================================================
        const carForward = new THREE.Vector3(Math.sin(pState.yaw), 0, Math.cos(pState.yaw));
        const cameraTargetPos = new THREE.Vector3()
          .copy(pState.position)
          .addScaledVector(carForward, -6.8)
          .add(new THREE.Vector3(0, 2.7, 0));

        // Camera screen shake on crash
        if (e.shake > 0) {
          cameraTargetPos.x += (Math.random() - 0.5) * e.shake;
          cameraTargetPos.y += (Math.random() - 0.5) * e.shake;
          e.shake = Math.max(0, e.shake - dt * 2.5);
        }

        // Smooth camera lerp
        camera.position.lerp(cameraTargetPos, Math.min(1, dt * 8));

        // Look at point slightly above and ahead of car
        const lookTarget = new THREE.Vector3()
          .copy(pState.position)
          .addScaledVector(carForward, 4.0)
          .add(new THREE.Vector3(0, 1.2, 0));
        camera.lookAt(lookTarget);

        // Dynamic Field of View when boosting with Nitro
        const targetFov = pState.isBoosting ? 78 : (65 + (pState.speed / 60) * 8);
        camera.fov += (targetFov - camera.fov) * dt * 5;
        camera.updateProjectionMatrix();

        // Directional Light follow player for consistent high-quality shadows
        dirLight.position.set(pState.position.x + 80, pState.position.y + 140, pState.position.z + 60);
        dirLight.target.position.copy(pState.position);

        // Check if race just finished
        if (pState.raceFinished && !finalResults) {
          const totalRaceTime = pState.finishTime || ((performance.now() - e.startTime) / 1000);
          // Calculate final rank
          let rank = 1;
          for (let ai of e.aiRacers) {
            if (ai.finished && (ai.finishTime || 999) < totalRaceTime) {
              rank += 1;
            }
          }

          const results = {
            rank,
            totalTime: totalRaceTime,
            lapTimes: pState.lapTimes,
            bestLap: pState.bestLapTime || 0,
            coins: pState.collectedCoins,
            score: pState.score + (rank === 1 ? 5000 : rank === 2 ? 3000 : 1500)
          };

          setFinalResults(results);
          setGameState('finished');
          recordGamePlayed('turbo_kart', rank === 1, results.score, Math.round(results.totalTime));
          if (rank === 1) {
            sounds.playWin();
            triggerConfetti();
          } else {
            sounds.playWin();
          }
        }

        // ========================================================
        // THROTTLED REACT HUD UPDATES (~15 FPS)
        // ========================================================
        if (time - lastUiUpdate > 66) {
          lastUiUpdate = time;
          setHudSpeedKmh(pState.speedKmh);
          setHudLap(pState.currentLap);
          setHudNitro(Math.round(pState.nitroFuel));
          setHudDriftCharge(pState.driftCharge);
          setHudIsDrifting(pState.isDrifting);
          setHudIsBoosting(pState.isBoosting);
          setHudCoins(pState.collectedCoins);

          if (e.startTime > 0 && !pState.raceFinished) {
            setHudTime((time - e.startTime) / 1000);
          }

          // Calculate current race position
          let pos = 1;
          const playerTotalDist = ((pState.currentLap - 1) * e.track.trackLength) + (pState.currentCheckpoint * (e.track.trackLength / e.track.checkpoints.length));
          for (let ai of e.aiRacers) {
            if (ai.distanceAlongTrack > playerTotalDist) {
              pos += 1;
            }
          }
          setHudPosition(pos);

          // Draw 2D Minimap
          drawMinimap(e.track, pState.position, e.aiRacers);
        }
      }

      renderer.render(scene, camera);
      e.animId = requestAnimationFrame(gameLoop);
    };

    e.animId = requestAnimationFrame(gameLoop);

    return () => {
      if (e.animId) cancelAnimationFrame(e.animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      resizeObserver.disconnect();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedCar, selectedTrack, recordGamePlayed, triggerConfetti, handleResetCar, finalResults]);

  // ==============================================================
  // MINIMAP RENDERER
  // ==============================================================
  const drawMinimap = (track: BuiltTrack, playerPos: THREE.Vector3, aiRacers: AIRacerState[]) => {
    const canvas = minimapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Track bounds
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let cp of track.checkpoints) {
      if (cp.position.x < minX) minX = cp.position.x;
      if (cp.position.x > maxX) maxX = cp.position.x;
      if (cp.position.z < minZ) minZ = cp.position.z;
      if (cp.position.z > maxZ) maxZ = cp.position.z;
    }

    const pad = 18;
    const trackW = maxX - minX || 1;
    const trackH = maxZ - minZ || 1;
    const scale = Math.min((w - pad * 2) / trackW, (h - pad * 2) / trackH);

    const toMapX = (x: number) => pad + (x - minX) * scale;
    const toMapY = (z: number) => pad + (z - minZ) * scale;

    // Draw Track Line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const numSamples = 60;
    for (let i = 0; i <= numSamples; i++) {
      const p = track.curve.getPointAt(i / numSamples);
      const mx = toMapX(p.x);
      const my = toMapY(p.z);
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw AI Racers (Yellow dots)
    for (let ai of aiRacers) {
      const ax = toMapX(ai.position.x);
      const ay = toMapY(ai.position.z);
      ctx.beginPath();
      ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
    }

    // Draw Player (Cyan / Red pulsing dot)
    const px = toMapX(playerPos.x);
    const py = toMapY(playerPos.z);
    ctx.beginPath();
    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  // Helper formatting for race timer
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = (secs % 60).toFixed(2);
    return `${mins}:${secs % 60 < 10 ? '0' : ''}${remSecs}`;
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-950 flex flex-col select-none overflow-hidden font-sans">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* ============================================================== */}
      {/* 1. TOP HEADER & HUD STATUS BAR */}
      {/* ============================================================== */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => setActiveGameId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 backdrop-blur-md transition-all text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit to Hub</span>
          </button>

          <button
            onClick={handleToggleSound}
            className="p-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700/60 backdrop-blur-md transition-all"
            title="Toggle Audio"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Live Race HUD (Visible during active race) */}
        {gameState === 'racing' && (
          <div className="flex items-center gap-4 pointer-events-auto">
            {/* Position Pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 border border-indigo-500/40 rounded-xl backdrop-blur-md shadow-lg shadow-indigo-950/50">
              <Trophy className="w-4 h-4 text-amber-400" />
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Position</div>
                <div className="text-xl font-black text-white leading-tight">
                  {hudPosition}<span className="text-xs text-slate-400 font-normal"> / 5</span>
                </div>
              </div>
            </div>

            {/* Lap Counter */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 border border-slate-700/60 rounded-xl backdrop-blur-md shadow-lg">
              <Flag className="w-4 h-4 text-cyan-400" />
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Lap</div>
                <div className="text-xl font-black text-white leading-tight">
                  {hudLap}<span className="text-xs text-slate-400 font-normal"> / 3</span>
                </div>
              </div>
            </div>

            {/* Live Race Timer */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/90 border border-slate-700/60 rounded-xl backdrop-blur-md shadow-lg">
              <Compass className="w-4 h-4 text-purple-400" />
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">Time</div>
                <div className="text-lg font-mono font-bold text-slate-100 leading-tight">
                  {formatTime(hudTime)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. MINIMAP & SPEEDOMETER GAUGES (DURING RACE) */}
      {/* ============================================================== */}
      {gameState === 'racing' && (
        <>
          {/* Top-Right Minimap */}
          <div className="absolute top-16 right-4 p-2 bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-xl z-20 pointer-events-none">
            <canvas ref={minimapCanvasRef} width={130} height={130} className="rounded-xl" />
            <div className="text-[10px] text-center text-slate-400 font-medium mt-1">CIRCUIT RADAR</div>
          </div>

          {/* Bottom-Right Digital Speedometer & Nitro Gauge */}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-20 pointer-events-none">
            {/* Drift Charge Indicator */}
            {hudIsDrifting && (
              <div className="px-3 py-1 bg-amber-500/20 border border-amber-400/60 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Drift Boost {Math.round(hudDriftCharge * 100)}%</span>
              </div>
            )}

            {/* Speedometer Card */}
            <div className="p-4 bg-slate-900/90 border border-slate-700/70 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col items-end min-w-[170px]">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black italic tracking-tighter text-white font-mono">
                  {hudSpeedKmh}
                </span>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">KM/H</span>
              </div>

              {/* Nitro Boost Bar */}
              <div className="w-full mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Zap className="w-3 h-3" /> NITRO [SHIFT]
                  </span>
                  <span>{hudNitro}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-75 rounded-full ${
                      hudIsBoosting
                        ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 animate-pulse'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    }`}
                    style={{ width: `${hudNitro}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reset Car Button */}
            <button
              onClick={handleResetCar}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-600 text-xs font-semibold backdrop-blur-sm transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Car [R]</span>
            </button>
          </div>

          {/* Bottom-Left Keyboard Control Guide */}
          <div className="hidden lg:flex absolute bottom-6 left-6 p-3 bg-slate-900/80 border border-slate-800 rounded-xl backdrop-blur-md text-[11px] text-slate-400 flex-col gap-1 z-20 pointer-events-none">
            <div className="font-bold text-slate-300 mb-0.5">RACE CONTROLS</div>
            <div><span className="text-white font-semibold">W / ↑</span> : Accelerate</div>
            <div><span className="text-white font-semibold">S / ↓</span> : Brake / Reverse</div>
            <div><span className="text-white font-semibold">A / D / ← / →</span> : Steer</div>
            <div><span className="text-white font-semibold">SPACE</span> : Drift & Charge Turbo</div>
            <div><span className="text-white font-semibold">SHIFT</span> : Nitro Boost</div>
          </div>

          {/* ============================================================== */}
          {/* MOBILE TOUCH CONTROLS (VISIBLE ON TOUCH/SMALL SCREENS) */}
          {/* ============================================================== */}
          <div className="lg:hidden absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-30">
            {/* Left/Right Steering Buttons */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onTouchStart={() => { engineRef.current.inputs.left = true; }}
                onTouchEnd={() => { engineRef.current.inputs.left = false; }}
                onMouseDown={() => { engineRef.current.inputs.left = true; }}
                onMouseUp={() => { engineRef.current.inputs.left = false; }}
                className="w-14 h-14 bg-slate-900/80 active:bg-indigo-600 border border-slate-700 active:border-indigo-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold backdrop-blur-md shadow-lg"
              >
                ◀
              </button>
              <button
                onTouchStart={() => { engineRef.current.inputs.right = true; }}
                onTouchEnd={() => { engineRef.current.inputs.right = false; }}
                onMouseDown={() => { engineRef.current.inputs.right = true; }}
                onMouseUp={() => { engineRef.current.inputs.right = false; }}
                className="w-14 h-14 bg-slate-900/80 active:bg-indigo-600 border border-slate-700 active:border-indigo-400 rounded-2xl flex items-center justify-center text-white text-xl font-bold backdrop-blur-md shadow-lg"
              >
                ▶
              </button>
            </div>

            {/* Action Buttons: Drift & Nitro */}
            <div className="flex flex-col gap-2 pointer-events-auto items-center mb-1">
              <button
                onTouchStart={() => { engineRef.current.inputs.drift = true; }}
                onTouchEnd={() => { engineRef.current.inputs.drift = false; }}
                onMouseDown={() => { engineRef.current.inputs.drift = true; }}
                onMouseUp={() => { engineRef.current.inputs.drift = false; }}
                className="px-4 py-2 bg-amber-600/80 active:bg-amber-500 border border-amber-400 rounded-xl text-xs font-bold text-white shadow-lg"
              >
                DRIFT
              </button>
              <button
                onTouchStart={() => { engineRef.current.inputs.nitro = true; }}
                onTouchEnd={() => { engineRef.current.inputs.nitro = false; }}
                onMouseDown={() => { engineRef.current.inputs.nitro = true; }}
                onMouseUp={() => { engineRef.current.inputs.nitro = false; }}
                className="px-4 py-2 bg-cyan-600/80 active:bg-cyan-500 border border-cyan-400 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" /> NITRO
              </button>
            </div>

            {/* Gas / Brake Pedals */}
            <div className="flex gap-2 pointer-events-auto">
              <button
                onTouchStart={() => { engineRef.current.inputs.backward = true; }}
                onTouchEnd={() => { engineRef.current.inputs.backward = false; }}
                onMouseDown={() => { engineRef.current.inputs.backward = true; }}
                onMouseUp={() => { engineRef.current.inputs.backward = false; }}
                className="w-14 h-14 bg-rose-950/80 active:bg-rose-600 border border-rose-800 active:border-rose-400 rounded-2xl flex items-center justify-center text-rose-300 active:text-white text-xs font-bold backdrop-blur-md shadow-lg"
              >
                BRAKE
              </button>
              <button
                onTouchStart={() => { engineRef.current.inputs.forward = true; }}
                onTouchEnd={() => { engineRef.current.inputs.forward = false; }}
                onMouseDown={() => { engineRef.current.inputs.forward = true; }}
                onMouseUp={() => { engineRef.current.inputs.forward = false; }}
                className="w-14 h-14 bg-emerald-950/80 active:bg-emerald-600 border border-emerald-800 active:border-emerald-400 rounded-2xl flex items-center justify-center text-emerald-300 active:text-white text-xs font-bold backdrop-blur-md shadow-lg"
              >
                GAS
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* 3. 3, 2, 1, GO! COUNTDOWN OVERLAY */}
      {/* ============================================================== */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="text-8xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 drop-shadow-[0_10px_35px_rgba(244,63,94,0.6)] animate-bounce font-mono">
            {countdownNum}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. GARAGE & TRACK SELECTION SCREEN */}
      {/* ============================================================== */}
      {gameState === 'garage' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 z-40 overflow-y-auto">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 my-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-black italic tracking-tight text-white flex items-center gap-2.5">
                  <Flame className="w-7 h-7 text-rose-500" />
                  TURBO SPEEDWAY 3D
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Choose your performance sports car and racing circuit to enter the championship.
                </p>
              </div>

              <button
                onClick={startRace}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 via-rose-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-950/60 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>START RACE</span>
              </button>
            </div>

            {/* Car Selection Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-400" />
                SELECT YOUR 3D SPORTS CAR
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CAR_ARCHETYPES.map(car => {
                  const isSelected = selectedCar.id === car.id;
                  return (
                    <div
                      key={car.id}
                      onClick={() => {
                        setSelectedCar(car);
                        sounds.playClick();
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Car Badge & Name */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {car.badge}
                        </span>
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: car.primaryColor }}
                        />
                      </div>

                      <h3 className="text-sm font-black text-white">{car.name}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {car.description}
                      </p>

                      {/* Stat Bars */}
                      <div className="mt-3 space-y-1.5 text-[10px]">
                        <div>
                          <div className="flex justify-between text-slate-400 mb-0.5">
                            <span>Top Speed</span>
                            <span className="font-bold text-slate-200">{car.maxSpeedKmh} km/h</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${(car.stats.speed / 10) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-400 mb-0.5">
                            <span>Handling</span>
                            <span className="font-bold text-slate-200">{car.stats.handling}/10</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${(car.stats.handling / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Track Selection Section */}
            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                SELECT CIRCUIT
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {RACING_TRACKS.map(tr => {
                  const isSelected = selectedTrack.id === tr.id;
                  return (
                    <div
                      key={tr.id}
                      onClick={() => {
                        setSelectedTrack(tr);
                        sounds.playClick();
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/30 border-cyan-500 ring-2 ring-cyan-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white">{tr.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                          {tr.difficulty}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                        {tr.subtitle}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start CTA */}
            <div className="flex justify-end pt-2">
              <button
                onClick={startRace}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>ENTER CIRCUIT & RACE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. FINISH PODIUM RESULTS MODAL */}
      {/* ============================================================== */}
      {gameState === 'finished' && finalResults && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center space-y-6">
            {/* Trophy & Rank Badge */}
            <div className="inline-flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
                <Trophy className="w-10 h-10 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tight">
                {finalResults.rank === 1 ? '🥇 1ST PLACE CHAMPION!' : finalResults.rank === 2 ? '🥈 2ND PLACE PODIUM' : finalResults.rank === 3 ? '🥉 3RD PLACE PODIUM' : '🏁 RACE COMPLETE'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {selectedTrack.name} • 3 Laps Completed
              </p>
            </div>

            {/* Race Statistics Grid */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Race Time</div>
                <div className="text-lg font-mono font-bold text-white mt-0.5">{formatTime(finalResults.totalTime)}</div>
              </div>
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Best Lap Time</div>
                <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">{formatTime(finalResults.bestLap)}</div>
              </div>
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Coins Collected</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">🪙 {finalResults.coins}</div>
              </div>
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Final Score</div>
                <div className="text-lg font-bold text-indigo-400 mt-0.5">+{finalResults.score} PTS</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  setFinalResults(null);
                  startRace();
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Race Again</span>
              </button>

              <button
                onClick={() => {
                  setFinalResults(null);
                  setGameState('garage');
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition-all"
              >
                <span>Select Car / Track</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
