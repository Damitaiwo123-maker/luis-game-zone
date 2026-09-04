import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import {
  Crosshair,
  Shield,
  Heart,
  Zap,
  RotateCcw,
  Play,
  Pause,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
  ChevronLeft,
  Eye,
  Maximize2,
  Users,
  Compass,
  Award,
  Swords,
  ChevronRight,
  HelpCircle,
  Skull,
  Radio,
  Sliders,
  CheckCircle2,
  MousePointer,
  MapPin,
  User,
} from 'lucide-react';
import { useGame } from '../../context/GameContext';
import {
  CharacterClass,
  CharacterClassId,
  CHARACTER_CLASSES,
  CoverObstacle,
  EnemyEntity,
  EnemyType,
  GAME_MAPS,
  GAME_MODES,
  GameModeId,
  GameModeInfo,
  MapId,
  ParticleEffect,
  PickupItem,
  PracticeTarget,
  Projectile,
  WeaponData,
  WeaponId,
  WEAPON_ORDER,
  WEAPON_REGISTRY,
} from './types';
import { HumanBoneRig, HumanModel3D } from './HumanModel3D';
import { CityEnvironment3D, CityEnvironmentResult } from './CityEnvironment3D';
import { FPSPhysicsEngine } from './FPSPhysicsEngine';
import { FPSAudioEngine } from './FPSAudioEngine';
import { ControlSettings, DEFAULT_CONTROL_SETTINGS } from './controlSettings';
import { TouchVirtualControls } from './components/TouchVirtualControls';
import { WeaponWheelModal } from './components/WeaponWheelModal';
import { ControlsSettingsModal } from './components/ControlsSettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';

export const NeonStrikeGame: React.FC = () => {
  const { profile, recordGamePlayed, setActiveGameId } = useGame();

  // --- MENU & SELECTION STATES ---
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'class_select' | 'weapon_select' | 'mode_select' | 'playing' | 'game_over' | 'victory'>('menu');
  const [selectedClassId, setSelectedClassId] = useState<CharacterClassId>('tactical');
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId>('rifle');
  const [selectedModeId, setSelectedModeId] = useState<GameModeId>('mission');
  const [selectedMapId, setSelectedMapId] = useState<MapId>('city_district');

  // Mode-Specific Combat States
  const [bossHealth, setBossHealth] = useState<number>(2500);
  const [bossMaxHealth, setBossMaxHealth] = useState<number>(2500);
  const [rivalHealth, setRivalHealth] = useState<number>(200);
  const [rivalMaxHealth, setRivalMaxHealth] = useState<number>(200);
  const [timeAttackSeconds, setTimeAttackSeconds] = useState<number>(60);
  const [timeAttackBest, setTimeAttackBest] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('fps_time_attack_best') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [targetsHitCount, setTargetsHitCount] = useState<number>(0);

  // First-time player guidance
  const [hasSeenHowToPlay, setHasSeenHowToPlay] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fps_has_seen_how_to_play') === 'true';
    } catch {
      return false;
    }
  });

  // --- IN-GAME RUNTIME STATES ---
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Stats
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerArmor, setPlayerArmor] = useState(100);
  const [currentAmmo, setCurrentAmmo] = useState(30);
  const [ammoReserve, setAmmoReserve] = useState(180);
  const [isReloading, setIsReloading] = useState(false);
  const [reloadProgress, setReloadProgress] = useState(0);
  const [isAiming, setIsAiming] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [isCrouching, setIsCrouching] = useState(false);
  const [stamina, setStamina] = useState(100);

  // Match Scoring
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [headshots, setHeadshots] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [shotsHit, setShotsHit] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(8);
  const [currentWave, setCurrentWave] = useState(1);
  const [survivalTime, setSurvivalTime] = useState(0);
  const [objectiveText, setObjectiveText] = useState('Neutralize all hostile targets');

  // UI Feedback
  const [hitmarkerActive, setHitmarkerActive] = useState(false);
  const [hitmarkerHeadshot, setHitmarkerHeadshot] = useState(false);
  const [damageFlash, setDamageFlash] = useState(false);
  const [isTargetLocked, setIsTargetLocked] = useState(false);
  const [killFeed, setKillFeed] = useState<Array<{ id: number; text: string; isHeadshot: boolean }>>([]);
  const [minimapEnemies, setMinimapEnemies] = useState<Array<{ x: number; z: number; isDead: boolean }>>([]);
  const [playerCoord, setPlayerCoord] = useState<{ x: number; z: number; yaw: number }>({ x: 0, z: 0, yaw: 0 });

  // Mobile & Control Settings
  const [controlSettings, setControlSettings] = useState<ControlSettings>(DEFAULT_CONTROL_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isWeaponWheelOpen, setIsWeaponWheelOpen] = useState(false);
  const virtualJoystickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // References
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Engine Internals Refs
  const threeState = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    playerRig: HumanBoneRig | null;
    envResult: CityEnvironmentResult | null;
    enemies: EnemyEntity[];
    projectiles: Projectile[];
    particles: ParticleEffect[];
    particleMeshGroup: THREE.Group | null;
    pickupMeshes: THREE.Group[];
    muzzleFlashLight: THREE.PointLight | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    playerRig: null,
    envResult: null,
    enemies: [],
    projectiles: [],
    particles: [],
    particleMeshGroup: null,
    pickupMeshes: [],
    muzzleFlashLight: null,
  });

  // Player Physics & Input State Ref
  const playerState = useRef<{
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    yaw: number;
    pitch: number;
    isGrounded: boolean;
    isSprinting: boolean;
    isCrouching: boolean;
    isAiming: boolean;
    isReloading: boolean;
    reloadTime: number;
    lastFireTime: number;
    fireRecoil: number;
    hitFlinch: number;
    health: number;
    armor: number;
    stamina: number;
    activeWeapon: WeaponId;
    ammoInMag: number;
    ammoReserve: number;
    isDead: boolean;
  }>({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    isGrounded: true,
    isSprinting: false,
    isCrouching: false,
    isAiming: false,
    isReloading: false,
    reloadTime: 0,
    lastFireTime: 0,
    fireRecoil: 0,
    hitFlinch: 0,
    health: 100,
    armor: 100,
    stamina: 100,
    activeWeapon: 'rifle',
    ammoInMag: 30,
    ammoReserve: 180,
    isDead: false,
  });

  // Input Keys Ref
  const keysRef = useRef<{
    w: boolean;
    s: boolean;
    a: boolean;
    d: boolean;
    arrowUp: boolean;
    arrowDown: boolean;
    arrowLeft: boolean;
    arrowRight: boolean;
    shoot: boolean;
    aim: boolean;
    shift: boolean;
    space: boolean;
    c: boolean;
    mouseLeft: boolean;
    mouseRight: boolean;
  }>({
    w: false,
    s: false,
    a: false,
    d: false,
    arrowUp: false,
    arrowDown: false,
    arrowLeft: false,
    arrowRight: false,
    shoot: false,
    aim: false,
    shift: false,
    space: false,
    c: false,
    mouseLeft: false,
    mouseRight: false,
  });

  // Pointer lock status and cooldown management
  const isPointerLocked = useRef(false);
  const [isPointerLockedState, setIsPointerLockedState] = useState(false);
  const lastPointerLockExitRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Safe pointer lock requester with browser cooldown rate-limit defense
  const requestPointerLockSafely = useCallback(() => {
    if (!canvasRef.current || document.pointerLockElement === canvasRef.current) return;
    // Chrome/Chromium enforces ~1.2s cooldown after unlocking; prevent calling during cooldown
    const timeSinceExit = Date.now() - lastPointerLockExitRef.current;
    if (timeSinceExit < 1300) {
      return;
    }
    try {
      const res = canvasRef.current.requestPointerLock();
      if (res && typeof (res as Promise<void>).catch === 'function') {
        (res as Promise<void>).catch(() => {
          // Ignore unhandled rejection from browser cooldown policy
        });
      }
    } catch {
      // Ignore synchronous pointer lock errors
    }
  }, []);

  // Selected class data helper
  const selectedClass = CHARACTER_CLASSES.find((c) => c.id === selectedClassId) || CHARACTER_CLASSES[0];
  const selectedWeapon = WEAPON_REGISTRY[selectedWeaponId] || WEAPON_REGISTRY.rifle;

  // --- AUDIO MUTE TOGGLE ---
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    FPSAudioEngine.setMuted(next);
  };

  // --- FULLSCREEN TOGGLE ---
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // --- START MATCH INITIALIZATION ---
  const startMatch = useCallback(() => {
    setCurrentScreen('playing');
    setIsPaused(false);
    setPlayerHealth(selectedClass.maxHealth);
    setPlayerArmor(selectedClass.maxArmor);
    setCurrentAmmo(selectedWeapon.magSize);
    setAmmoReserve(selectedWeapon.maxReserve);
    setScore(0);
    setKills(0);
    setHeadshots(0);
    setShotsFired(0);
    setShotsHit(0);
    setCurrentWave(1);
    setSurvivalTime(0);
    setKillFeed([]);

    // Reset player state ref
    playerState.current = {
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      yaw: 0,
      pitch: 0,
      isGrounded: true,
      isSprinting: false,
      isCrouching: false,
      isAiming: false,
      isReloading: false,
      reloadTime: 0,
      lastFireTime: 0,
      fireRecoil: 0,
      hitFlinch: 0,
      health: selectedClass.maxHealth,
      armor: selectedClass.maxArmor,
      stamina: 100,
      activeWeapon: selectedWeaponId,
      ammoInMag: selectedWeapon.magSize,
      ammoReserve: selectedWeapon.maxReserve,
      isDead: false,
    };

    if (selectedModeId === 'mission' || selectedModeId === 'enemy_hunt') {
      setObjectiveText('MISSION: ELIMINATE ALL HOSTILES');
      setEnemiesRemaining(8);
    } else if (selectedModeId === 'duel_1v1') {
      setObjectiveText('1 vs 1 Tactical Duel: Eliminate the Rival Operative');
      setEnemiesRemaining(1);
      setRivalHealth(200);
      setRivalMaxHealth(200);
    } else if (selectedModeId === 'boss_battle') {
      setObjectiveText('Boss Battle: Confront Titan-Warlord Kairos [Target glowing chest core]');
      setEnemiesRemaining(1);
      setBossHealth(2500);
      setBossMaxHealth(2500);
    } else if (selectedModeId === 'target_practice') {
      setObjectiveText('Target Practice: Test reaction & accuracy on reactive moving bullseyes');
      setEnemiesRemaining(4);
      setTargetsHitCount(0);
    } else if (selectedModeId === 'shooting_range') {
      setObjectiveText('Shooting Range: Test all 6 firearms on 10m, 25m, 50m, 100m distance markers');
      setEnemiesRemaining(4);
      setTargetsHitCount(0);
    } else if (selectedModeId === 'time_attack') {
      setObjectiveText('Time Attack: 60-Second Speed Elimination Trial');
      setEnemiesRemaining(8);
      setTimeAttackSeconds(60);
    } else if (selectedModeId === 'survival') {
      setObjectiveText('Survival Wave 1: Defend the Central Plaza against hostiles');
      setEnemiesRemaining(5);
    } else if (selectedModeId === 'wave_attack') {
      setObjectiveText('Wave Attack: Continuous relentless enemy assault');
      setEnemiesRemaining(8);
    } else {
      setObjectiveText('Combat Arena: Eliminate all hostile squads');
      setEnemiesRemaining(8);
    }
  }, [selectedClass, selectedWeapon, selectedWeaponId, selectedModeId]);

  // --- SWITCH WEAPON ---
  const switchWeapon = useCallback((weaponId: WeaponId) => {
    const wData = WEAPON_REGISTRY[weaponId];
    if (!wData) return;

    setSelectedWeaponId(weaponId);
    playerState.current.activeWeapon = weaponId;
    playerState.current.ammoInMag = wData.magSize;
    playerState.current.ammoReserve = wData.maxReserve;
    playerState.current.isReloading = false;
    playerState.current.reloadTime = 0;

    setCurrentAmmo(wData.magSize);
    setAmmoReserve(wData.maxReserve);
    setIsReloading(false);

    // Update 3D player mesh weapon
    if (threeState.current.playerRig) {
      HumanModel3D.updateWeapon(threeState.current.playerRig, weaponId, true);
    }
  }, []);

  // --- RELOAD WEAPON ---
  const triggerReload = useCallback(() => {
    const p = playerState.current;
    if (p.isReloading || p.isDead) return;
    const wData = WEAPON_REGISTRY[p.activeWeapon];
    if (p.ammoInMag >= wData.magSize || p.ammoReserve <= 0) return;

    p.isReloading = true;
    p.reloadTime = 0;
    setIsReloading(true);
    FPSAudioEngine.playReload();
  }, []);

  // --- THROW GRENADE ---
  const triggerGrenadeThrow = useCallback(() => {
    const p = playerState.current;
    if (p.isDead) return;

    // Calculate forward aim trajectory
    const aimDir = new THREE.Vector3(
      -Math.sin(p.yaw) * Math.cos(p.pitch),
      Math.sin(p.pitch) + 0.25, // Slight upward arc
      -Math.cos(p.yaw) * Math.cos(p.pitch)
    ).normalize();

    const startPos = p.position.clone().add(new THREE.Vector3(0, 1.5, 0));

    // Spawn explosive projectile
    if (threeState.current.projectiles && threeState.current.scene) {
      const gMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.8 })
      );
      gMesh.position.copy(startPos);
      threeState.current.scene.add(gMesh);

      threeState.current.projectiles.push({
        id: Math.random(),
        mesh: gMesh,
        velocity: aimDir.multiplyScalar(28),
        isPlayer: true,
        damage: 180,
        radius: 6,
        isExplosive: true,
        lifeTime: 0,
        maxLife: 2.5,
      });
    }

    FPSAudioEngine.playWeaponFire('bazooka');
  }, []);

  // --- KEYBOARD & MOUSE EVENT LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentScreen !== 'playing') return;

      const k = e.key.toLowerCase();
      // Grenade hotkey G
      if (k === 'g') {
        triggerGrenadeThrow();
      }
      // Forward: W or ArrowUp
      if (k === 'w') keysRef.current.w = true;
      if (e.key === 'ArrowUp') keysRef.current.arrowUp = true;

      // Backward: S or ArrowDown
      if (k === 's') keysRef.current.s = true;
      if (e.key === 'ArrowDown') keysRef.current.arrowDown = true;

      // Left: A or ArrowLeft
      if (k === 'a' || k === 'q') keysRef.current.a = true;
      if (e.key === 'ArrowLeft') keysRef.current.arrowLeft = true;

      // Right: D or ArrowRight
      if (k === 'd') keysRef.current.d = true;
      if (e.key === 'ArrowRight') keysRef.current.arrowRight = true;

      // Z = SHOOT (Fire weapon keyboard shortcut)
      if (k === 'z') {
        keysRef.current.shoot = true;
      }

      if (e.key === 'Shift') {
        keysRef.current.shift = true;
        playerState.current.isSprinting = true;
        setIsSprinting(true);
      }
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        keysRef.current.space = true;
        if (playerState.current.isGrounded && !playerState.current.isDead) {
          playerState.current.velocity.y = 8.5; // Jump impulse
          playerState.current.isGrounded = false;
          FPSAudioEngine.playJump();
        }
      }
      if (k === 'c') {
        // Toggle crouch
        playerState.current.isCrouching = !playerState.current.isCrouching;
        setIsCrouching(playerState.current.isCrouching);
      }
      if (k === 'r') {
        triggerReload();
      }
      if (k === 'p' || e.key === 'Escape') {
        setIsPaused((prev) => !prev);
      }

      // Quick weapon hotkeys 1-6
      if (k === '1') switchWeapon('pistol');
      if (k === '2') switchWeapon('rifle');
      if (k === '3') switchWeapon('smg');
      if (k === '4') switchWeapon('shotgun');
      if (k === '5') switchWeapon('sniper');
      if (k === '6') switchWeapon('bazooka');
      if (k === '7') switchWeapon('machinegun');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') keysRef.current.w = false;
      if (e.key === 'ArrowUp') keysRef.current.arrowUp = false;
      if (k === 's') keysRef.current.s = false;
      if (e.key === 'ArrowDown') keysRef.current.arrowDown = false;
      if (k === 'a' || k === 'q') keysRef.current.a = false;
      if (e.key === 'ArrowLeft') keysRef.current.arrowLeft = false;
      if (k === 'd') keysRef.current.d = false;
      if (e.key === 'ArrowRight') keysRef.current.arrowRight = false;
      if (k === 'z') {
        keysRef.current.shoot = false;
      }
      if (e.key === 'Shift') {
        keysRef.current.shift = false;
        playerState.current.isSprinting = false;
        setIsSprinting(false);
      }
      if (e.key === ' ' || e.code === 'Space') {
        keysRef.current.space = false;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (currentScreen !== 'playing' || isPaused) return;

      // Safely request pointer lock with cooldown checks
      requestPointerLockSafely();
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (e.button === 0) {
        keysRef.current.mouseLeft = true;
      } else if (e.button === 2) {
        keysRef.current.mouseRight = true;
        playerState.current.isAiming = true;
        setIsAiming(true);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      lastMousePosRef.current = null;
      if (e.button === 0) {
        keysRef.current.mouseLeft = false;
      } else if (e.button === 2) {
        keysRef.current.mouseRight = false;
        playerState.current.isAiming = false;
        setIsAiming(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (currentScreen !== 'playing' || playerState.current.isDead || isPaused) return;

      const sensitivity = playerState.current.isAiming ? 0.0016 : 0.0026;
      let dx = 0;
      let dy = 0;

      if (document.pointerLockElement === canvasRef.current) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (keysRef.current.mouseLeft || keysRef.current.mouseRight) {
        // Fallback for drag-look when pointer lock is not active or during cooldown
        if (lastMousePosRef.current) {
          dx = e.clientX - lastMousePosRef.current.x;
          dy = e.clientY - lastMousePosRef.current.y;
        }
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      } else {
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      playerState.current.yaw += dx * sensitivity;
      playerState.current.pitch -= dy * sensitivity;

      // Clamp vertical pitch (-60 deg to +60 deg)
      playerState.current.pitch = Math.max(-1.05, Math.min(1.05, playerState.current.pitch));
    };

    const handleWheel = (e: WheelEvent) => {
      if (currentScreen !== 'playing') return;
      const currentIdx = WEAPON_ORDER.indexOf(playerState.current.activeWeapon);
      const nextIdx = e.deltaY > 0 ? (currentIdx + 1) % WEAPON_ORDER.length : (currentIdx - 1 + WEAPON_ORDER.length) % WEAPON_ORDER.length;
      switchWeapon(WEAPON_ORDER[nextIdx]);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === canvasRef.current;
      isPointerLocked.current = isLocked;
      setIsPointerLockedState(isLocked);
      if (!isLocked) {
        lastPointerLockExitRef.current = Date.now();
      }
    };

    const handlePointerLockError = () => {
      // Catch and absorb browser rate limit / cooldown errors quietly
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', handlePointerLockError);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', handlePointerLockError);
    };
  }, [currentScreen, isPaused, switchWeapon, triggerReload, requestPointerLockSafely]);

  // --- THREE.JS INITIALIZATION & SCENE SETUP ---
  useEffect(() => {
    if (currentScreen !== 'playing' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc); // Bright crisp daytime sky blue
    scene.fog = new THREE.FogExp2(0xdbeafe, 0.005); // Soft distant horizon atmospheric haze

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 300);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting
    const ambientLight = new THREE.HemisphereLight(0xe0f2fe, 0xf1f5f9, 1.35); // Bright sky & ground bounce
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.2); // Warm sunlight
    sunLight.position.set(55, 95, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 200;
    sunLight.shadow.camera.left = -90;
    sunLight.shadow.camera.right = 90;
    sunLight.shadow.camera.top = 90;
    sunLight.shadow.camera.bottom = -90;
    scene.add(sunLight);

    // Muzzle Flash dynamic point light
    const muzzleFlashLight = new THREE.PointLight(0xfde047, 0, 15);
    scene.add(muzzleFlashLight);

    // 5. Build City Environment
    const envResult = CityEnvironment3D.buildCityMap(selectedModeId, selectedMapId);
    scene.add(envResult.environmentGroup);

    // 6. Build Human Player Character Model
    const { modelGroup: playerModel, rig: playerRig } = HumanModel3D.createHumanCharacter({
      isPlayer: true,
      classId: selectedClassId,
      weaponId: selectedWeaponId,
      primaryColor: selectedClass.color,
      accentColor: selectedClass.accentColor,
    });
    scene.add(playerModel);

    // 7. Spawn Enemies based on Mode
    const enemies: EnemyEntity[] = [];

    if (selectedModeId === 'duel_1v1') {
      // 1 VS 1 DUEL: Exactly 1 high-tier rival operative
      const spawnPos = new THREE.Vector3(0, 0, -35);
      const { modelGroup: enemyModel, rig: enemyRig } = HumanModel3D.createHumanCharacter({
        isPlayer: false,
        isEnemy: true,
        enemyType: 'soldier',
        weaponId: 'rifle',
        primaryColor: '#ef4444',
        accentColor: '#ffedd5',
      });
      (enemyModel as unknown as { rig: HumanBoneRig }).rig = enemyRig;
      enemyModel.position.copy(spawnPos);
      scene.add(enemyModel);

      enemies.push({
        id: 1,
        type: 'soldier',
        team: 'enemy',
        name: 'Elite Rival Operative',
        position: spawnPos,
        velocity: new THREE.Vector3(),
        yaw: 0,
        pitch: 0,
        health: 200,
        maxHealth: 200,
        armor: 100,
        maxArmor: 100,
        speed: 6.5,
        weapon: 'rifle',
        aiState: 'combat',
        stateTimer: 0,
        patrolPoints: [spawnPos, new THREE.Vector3(12, 0, -30), new THREE.Vector3(-12, 0, -30)],
        currentPatrolIdx: 0,
        targetPos: null,
        lastSeenPlayerPos: null,
        lastFireTime: 0,
        fireCooldown: 1.2,
        accuracy: 0.76,
        detectionRange: 75,
        isDead: false,
        deathTimer: 0,
        meshGroup: enemyModel,
        animState: {
          walkTime: 0,
          isMoving: false,
          isAiming: true,
          hitFlinch: 0,
          deathFallProgress: 0,
        },
      });
      setEnemiesRemaining(1);
    } else if (selectedModeId === 'boss_battle') {
      // BOSS BATTLE: Titan-Warlord Kairos (1.4x scale, 2500 HP, heavy bazooka)
      const spawnPos = new THREE.Vector3(0, 0, -32);
      const { modelGroup: enemyModel, rig: enemyRig } = HumanModel3D.createHumanCharacter({
        isPlayer: false,
        isEnemy: true,
        enemyType: 'heavy',
        weaponId: 'bazooka',
        primaryColor: '#7f1d1d',
        accentColor: '#f59e0b',
      });
      (enemyModel as unknown as { rig: HumanBoneRig }).rig = enemyRig;
      enemyModel.scale.set(1.4, 1.4, 1.4);
      enemyModel.position.copy(spawnPos);
      scene.add(enemyModel);

      enemies.push({
        id: 1,
        type: 'boss',
        team: 'enemy',
        name: 'Titan-Warlord Kairos',
        position: spawnPos,
        velocity: new THREE.Vector3(),
        yaw: 0,
        pitch: 0,
        health: 2500,
        maxHealth: 2500,
        armor: 500,
        maxArmor: 500,
        isBoss: true,
        bossPhase: 1,
        speed: 4.2,
        weapon: 'bazooka',
        aiState: 'combat',
        stateTimer: 0,
        patrolPoints: [spawnPos, new THREE.Vector3(18, 0, -25), new THREE.Vector3(-18, 0, -25)],
        currentPatrolIdx: 0,
        targetPos: null,
        lastSeenPlayerPos: null,
        lastFireTime: 0,
        fireCooldown: 2.2,
        accuracy: 0.85,
        detectionRange: 90,
        isDead: false,
        deathTimer: 0,
        meshGroup: enemyModel,
        animState: {
          walkTime: 0,
          isMoving: false,
          isAiming: true,
          hitFlinch: 0,
          deathFallProgress: 0,
        },
      });
      setEnemiesRemaining(1);
    } else if (selectedModeId === 'shooting_range' || selectedModeId === 'target_practice') {
      // Practice modes: 0 living enemies, reactive bullseye targets only
      setEnemiesRemaining(envResult.practiceTargets?.length || 4);
    } else {
      // Standard multi-enemy modes: enemy_hunt (8), survival (5), wave_attack (8), time_attack (8)
      const enemyCount = selectedModeId === 'survival' ? 5 : 8;
      const enemyTypes: ('soldier' | 'scout' | 'heavy' | 'sniper')[] = ['soldier', 'scout', 'heavy', 'sniper'];
      const enemyWeapons: WeaponId[] = ['rifle', 'smg', 'shotgun', 'sniper'];

      for (let i = 0; i < enemyCount; i++) {
        const eType = enemyTypes[i % enemyTypes.length];
        const eWeapon = enemyWeapons[i % enemyWeapons.length];

        const routeIdx = i % envResult.enemyPatrolRoutes.length;
        const spawnPos = envResult.enemyPatrolRoutes[routeIdx][0].clone();
        spawnPos.x += (Math.random() - 0.5) * 6;
        spawnPos.z += (Math.random() - 0.5) * 6;

        const { modelGroup: enemyModel, rig: enemyRig } = HumanModel3D.createHumanCharacter({
          isPlayer: false,
          isEnemy: true,
          enemyType: eType,
          weaponId: eWeapon,
        });
        (enemyModel as unknown as { rig: HumanBoneRig }).rig = enemyRig;
        enemyModel.position.copy(spawnPos);
        scene.add(enemyModel);

        enemies.push({
          id: i + 1,
          type: eType,
          team: 'enemy',
          name: `Insurgent ${eType.toUpperCase()} #${i + 1}`,
          position: spawnPos,
          velocity: new THREE.Vector3(),
          yaw: Math.random() * Math.PI * 2,
          pitch: 0,
          health: eType === 'heavy' ? 160 : eType === 'scout' ? 75 : 100,
          maxHealth: eType === 'heavy' ? 160 : eType === 'scout' ? 75 : 100,
          armor: eType === 'heavy' ? 100 : 40,
          maxArmor: eType === 'heavy' ? 100 : 40,
          speed: eType === 'scout' ? 7.5 : eType === 'heavy' ? 4.2 : 5.8,
          weapon: eWeapon,
          aiState: 'patrol',
          stateTimer: 0,
          patrolPoints: envResult.enemyPatrolRoutes[routeIdx],
          currentPatrolIdx: 0,
          targetPos: null,
          lastSeenPlayerPos: null,
          lastFireTime: 0,
          fireCooldown: eWeapon === 'smg' ? 1.2 : eWeapon === 'shotgun' ? 2.2 : eWeapon === 'sniper' ? 3.0 : 1.8,
          accuracy: eType === 'sniper' ? 0.85 : eType === 'scout' ? 0.55 : 0.68,
          detectionRange: eType === 'sniper' ? 65 : 45,
          isDead: false,
          deathTimer: 0,
          meshGroup: enemyModel,
          animState: {
            walkTime: 0,
            isMoving: false,
            isAiming: false,
            hitFlinch: 0,
            deathFallProgress: 0,
          },
        });
      }
      setEnemiesRemaining(enemyCount);
    }

    // Particle mesh group
    const particleMeshGroup = new THREE.Group();
    scene.add(particleMeshGroup);

    threeState.current = {
      scene,
      camera,
      renderer,
      playerRig,
      envResult,
      enemies,
      projectiles: [],
      particles: [],
      particleMeshGroup,
      pickupMeshes: [],
      muzzleFlashLight,
    };

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && camera && renderer) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
      renderer.dispose();
    };
  }, [currentScreen, selectedModeId, selectedClassId, selectedWeaponId, selectedClass]);

  // --- MAIN 60FPS GAMEPLAY LOOP ---
  useEffect(() => {
    if (currentScreen !== 'playing') return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      animFrameId.current = requestAnimationFrame(loop);

      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const { scene, camera, renderer, playerRig, envResult, enemies, muzzleFlashLight } = threeState.current;
      if (!scene || !camera || !renderer || !playerRig || !envResult) return;

      if (isPaused) {
        renderer.render(scene, camera);
        return;
      }

      const pState = playerState.current;
      const keys = keysRef.current;
      const wData = WEAPON_REGISTRY[pState.activeWeapon];

      // 1. Update Match Timer & Stamina
      setSurvivalTime((prev) => prev + delta);
      const joystickVec = virtualJoystickRef.current;
      const hasJoystick = Math.hypot(joystickVec.x, joystickVec.y) > 0.05;
      const isMovingInput = keys.w || keys.s || keys.d || keys.arrowUp || keys.arrowDown || keys.arrowLeft || keys.arrowRight || hasJoystick;

      // Time Attack countdown timer
      if (selectedModeId === 'time_attack' && !pState.isDead) {
        setTimeAttackSeconds((prev) => {
          const next = Math.max(0, prev - delta);
          if (next <= 0 && prev > 0) {
            recordGamePlayed('neon_strike', true);
            setTimeout(() => setCurrentScreen('victory'), 600);
          }
          return next;
        });
      }

      if (pState.isSprinting && isMovingInput) {
        pState.stamina = Math.max(0, pState.stamina - delta * 25);
        if (pState.stamina <= 0) {
          pState.isSprinting = false;
          setIsSprinting(false);
        }
      } else {
        pState.stamina = Math.min(100, pState.stamina + delta * 20);
      }
      setStamina(Math.round(pState.stamina));

      // 2. Player Movement Input & Physics
      if (!pState.isDead) {
        const forward = new THREE.Vector3(-Math.sin(pState.yaw), 0, -Math.cos(pState.yaw));
        const right = new THREE.Vector3(Math.cos(pState.yaw), 0, -Math.sin(pState.yaw));

        const moveInput = new THREE.Vector3();
        if (keys.w || keys.arrowUp) moveInput.add(forward);
        if (keys.s || keys.arrowDown) moveInput.sub(forward);
        if (keys.d || keys.arrowRight) moveInput.add(right);
        if (keys.a || keys.arrowLeft) moveInput.sub(right);

        // Analog virtual joystick input (-joystickVec.y is forward in screen coordinates)
        if (hasJoystick) {
          moveInput.addScaledVector(forward, -joystickVec.y);
          moveInput.addScaledVector(right, joystickVec.x);
        }

        const isMoving = moveInput.length() > 0.08;
        if (isMoving) {
          const joystickMag = hasJoystick ? Math.min(1, Math.hypot(joystickVec.x, joystickVec.y)) : 1;
          moveInput.normalize();
          let baseSpeed = selectedClass.speed * (hasJoystick && !keys.w && !keys.s && !keys.a && !keys.d ? joystickMag : 1);
          if (pState.isSprinting) baseSpeed *= selectedClass.sprintMult;
          if (pState.isCrouching) baseSpeed *= 0.55;
          if (pState.isAiming) baseSpeed *= 0.65;

          pState.velocity.x = moveInput.x * baseSpeed;
          pState.velocity.z = moveInput.z * baseSpeed;

          // Footstep audio cadence
          if (pState.isGrounded && Math.sin(currentTime * (pState.isSprinting ? 0.014 : 0.009)) > 0.95) {
            FPSAudioEngine.playFootstep(pState.isSprinting);
          }
        } else {
          pState.velocity.x *= 0.75;
          pState.velocity.z *= 0.75;
        }

        // Resolve Collision against City Obstacles
        const physRes = FPSPhysicsEngine.resolvePlayerMovement(
          pState.position,
          pState.velocity,
          delta,
          envResult.obstacles,
          0.45,
          1.8,
          pState.isGrounded
        );
        pState.position.copy(physRes.newPos);
        pState.velocity.copy(physRes.newVel);
        pState.isGrounded = physRes.grounded;

        // 3. Weapon Reloading Update
        if (pState.isReloading) {
          pState.reloadTime += delta * 1000 * selectedClass.reloadMult;
          const progress = Math.min(1, pState.reloadTime / wData.reloadTimeMs);
          setReloadProgress(progress);

          if (progress >= 1) {
            const needed = wData.magSize - pState.ammoInMag;
            const toLoad = Math.min(needed, pState.ammoReserve);
            pState.ammoInMag += toLoad;
            pState.ammoReserve -= toLoad;
            pState.isReloading = false;
            pState.reloadTime = 0;
            setIsReloading(false);
            setCurrentAmmo(pState.ammoInMag);
            setAmmoReserve(pState.ammoReserve);
          }
        }

        // 4. Weapon Firing Handling (Continuous auto-fire or semi-auto with MouseLeft or Z)
        if ((keys.mouseLeft || keys.shoot) && !pState.isReloading && !pState.isDead) {
          const nowMs = currentTime;
          if (nowMs - pState.lastFireTime >= wData.fireRateMs) {
            if (pState.ammoInMag > 0) {
              pState.lastFireTime = nowMs;
              pState.ammoInMag -= 1;
              pState.fireRecoil = 1.0;
              setCurrentAmmo(pState.ammoInMag);
              setShotsFired((prev) => prev + 1);

              // In shooting range, infinite ammo refills
              if (selectedModeId === 'shooting_range') {
                pState.ammoReserve = Math.max(pState.ammoReserve, 500);
                setAmmoReserve(500);
              }

              // Recoil pitch kick
              pState.pitch = Math.min(1.05, pState.pitch + wData.recoilPitch * selectedClass.recoilMult);
              pState.yaw += (Math.random() - 0.5) * wData.recoilYaw * selectedClass.recoilMult;

              // Sound
              FPSAudioEngine.playWeaponFire(pState.activeWeapon);

              // Flash light
              if (muzzleFlashLight) {
                muzzleFlashLight.position.copy(pState.position).add(new THREE.Vector3(0, 1.4, 0));
                muzzleFlashLight.intensity = 3.5;
              }

              // Muzzle position & Aim direction
              let muzzlePos = pState.position.clone().add(new THREE.Vector3(0, 1.4, 0));
              if (playerRig.muzzleAnchor) {
                const worldPos = new THREE.Vector3();
                playerRig.muzzleAnchor.getWorldPosition(worldPos);
                muzzlePos = worldPos;
              }

              const aimDir = new THREE.Vector3(
                -Math.sin(pState.yaw) * Math.cos(pState.pitch),
                Math.sin(pState.pitch),
                -Math.cos(pState.yaw) * Math.cos(pState.pitch)
              ).normalize();

              // Execute Fire
              const fireRes = FPSPhysicsEngine.fireWeapon(
                pState.activeWeapon,
                muzzlePos,
                aimDir,
                'player',
                0,
                envResult.obstacles,
                enemies,
                pState.position,
                envResult.practiceTargets || [],
                pState.isAiming
              );

              // Append projectiles & particles
              threeState.current.projectiles.push(...fireRes.projectiles);
              threeState.current.particles.push(...fireRes.particles);

              // Process Hit Events
              if (fireRes.hitEvents.length > 0) {
                setShotsHit((prev) => prev + 1);

                for (const hit of fireRes.hitEvents) {
                  if (hit.targetType === 'enemy' && hit.targetId !== undefined) {
                    const targetEnemy = enemies.find((e) => e.id === hit.targetId);
                    if (targetEnemy && !targetEnemy.isDead) {
                      setHitmarkerActive(true);
                      setHitmarkerHeadshot(hit.isHeadshot);
                      setTimeout(() => setHitmarkerActive(false), 80);

                      FPSAudioEngine.playHitMarker(hit.isHeadshot);

                      // Damage enemy armor first, then health
                      let remainingDmg = hit.damage;
                      if (targetEnemy.armor > 0) {
                        const armorDmg = Math.min(targetEnemy.armor, remainingDmg);
                        targetEnemy.armor -= armorDmg;
                        remainingDmg -= armorDmg;
                      }
                      targetEnemy.health -= remainingDmg;
                      targetEnemy.animState.hitFlinch = 1.0;

                      // Update Mode Specific HUD Status
                      if (selectedModeId === 'boss_battle') {
                        setBossHealth(Math.max(0, targetEnemy.health));
                      } else if (selectedModeId === 'duel_1v1') {
                        setRivalHealth(Math.max(0, targetEnemy.health));
                      }

                      // Score bonus
                      const pts = hit.isHeadshot ? 250 : 100;
                      setScore((prev) => prev + pts);

                      if (targetEnemy.health <= 0) {
                        targetEnemy.isDead = true;
                        targetEnemy.health = 0;
                        setKills((prev) => prev + 1);
                        if (hit.isHeadshot) setHeadshots((prev) => prev + 1);

                        // Killfeed
                        setKillFeed((prev) => [
                          ...prev.slice(-3),
                          {
                            id: Math.random(),
                            text: `${selectedClass.codename} eliminated ${targetEnemy.name} ${hit.isHeadshot ? '[HEADSHOT]' : ''}`,
                            isHeadshot: hit.isHeadshot,
                          },
                        ]);

                        // Check Win Condition
                        const aliveEnemies = enemies.filter((e) => !e.isDead && e.team === 'enemy').length;
                        setEnemiesRemaining(aliveEnemies);

                        if (selectedModeId === 'time_attack') {
                          // Fast respawn for continuous speed run scoring
                          setTimeout(() => {
                            if (!targetEnemy.isDead) return;
                            targetEnemy.isDead = false;
                            targetEnemy.health = targetEnemy.maxHealth;
                            targetEnemy.armor = targetEnemy.maxArmor;
                            targetEnemy.position.set((Math.random() - 0.5) * 60, 0, (Math.random() - 0.5) * 60);
                          }, 1500);
                        } else if (aliveEnemies === 0) {
                          if (selectedModeId === 'survival') {
                            // Advance wave
                            setCurrentWave((w) => w + 1);
                            // Respawn new wave
                            setTimeout(() => {
                              enemies.forEach((e) => {
                                e.isDead = false;
                                e.health = e.maxHealth * (1 + currentWave * 0.2);
                                e.armor = e.maxArmor;
                                e.position.set((Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 70);
                              });
                              setEnemiesRemaining(enemies.length);
                            }, 2500);
                          } else {
                            // Mission / Quick Match / 1v1 Duel / Boss Victory!
                            recordGamePlayed('neon_strike', true);
                            setTimeout(() => setCurrentScreen('victory'), 800);
                          }
                        }
                      }
                    }
                  } else if (hit.targetType === 'practice_target' && hit.targetId !== undefined) {
                    const tTarget = envResult.practiceTargets?.find((t) => t.id === hit.targetId);
                    if (tTarget) {
                      tTarget.isHit = true;
                      tTarget.hitTimer = 0;
                      setTargetsHitCount((c) => c + 1);
                      setHitmarkerActive(true);
                      setHitmarkerHeadshot(hit.isHeadshot);
                      setTimeout(() => setHitmarkerActive(false), 80);
                      FPSAudioEngine.playHitMarker(hit.isHeadshot);
                      setScore((prev) => prev + (hit.isHeadshot ? 300 : 150));
                    }
                  }
                }
              }
            } else {
              // Auto trigger reload on empty
              triggerReload();
            }
          }
        }
      }

      // Decay muzzle flash light
      if (muzzleFlashLight && muzzleFlashLight.intensity > 0) {
        muzzleFlashLight.intensity = Math.max(0, muzzleFlashLight.intensity - delta * 20);
      }

      // Decay fire recoil
      if (pState.fireRecoil > 0) {
        pState.fireRecoil = Math.max(0, pState.fireRecoil - delta * 6);
      }

      // 5. Update Projectiles & Rockets
      const projRes = FPSPhysicsEngine.updateProjectiles(
        threeState.current.projectiles,
        delta,
        envResult.obstacles,
        enemies,
        pState.position
      );
      threeState.current.projectiles = projRes.activeProjectiles;
      threeState.current.particles.push(...projRes.particles);

      // Resolve rocket explosion AOE damage
      for (const exp of projRes.explosions) {
        FPSPhysicsEngine.resolveExplosionDamage(
          exp,
          enemies,
          pState.position,
          (dmg) => {
            // Player damage
            handlePlayerDamage(dmg);
          },
          (enemyId, dmg) => {
            // Enemy damage
            const enemy = enemies.find((e) => e.id === enemyId);
            if (enemy && !enemy.isDead) {
              enemy.health -= dmg;
              enemy.animState.hitFlinch = 1.0;
              setHitmarkerActive(true);
              setTimeout(() => setHitmarkerActive(false), 80);
              if (enemy.health <= 0) {
                enemy.isDead = true;
                setKills((prev) => prev + 1);
                const alive = enemies.filter((e) => !e.isDead && e.team === 'enemy').length;
                setEnemiesRemaining(alive);
                if (alive === 0) {
                  recordGamePlayed('neon_strike', true);
                  setTimeout(() => setCurrentScreen('victory'), 800);
                }
              }
            }
          }
        );
      }

      // 6. Update Enemy AI
      enemies.forEach((enemy) => {
        FPSPhysicsEngine.updateEnemyAI(
          enemy,
          delta,
          pState.position,
          pState.isDead,
          envResult.obstacles,
          currentTime / 1000,
          (firingEnemy, aimDir) => {
            // Enemy Fires Weapon
            FPSAudioEngine.playWeaponFire(firingEnemy.weapon);

            const muzzlePos = firingEnemy.position.clone().add(new THREE.Vector3(0, 1.4, 0));
            const fireRes = FPSPhysicsEngine.fireWeapon(
              firingEnemy.weapon,
              muzzlePos,
              aimDir,
              'enemy',
              firingEnemy.id,
              envResult.obstacles,
              enemies,
              pState.position
            );

            threeState.current.projectiles.push(...fireRes.projectiles);
            threeState.current.particles.push(...fireRes.particles);

            for (const hit of fireRes.hitEvents) {
              if (hit.targetType === 'player') {
                handlePlayerDamage(hit.damage);
              }
            }
          }
        );

        // Update Enemy 3D Mesh & Bone Rig
        if (enemy.meshGroup) {
          enemy.meshGroup.position.copy(enemy.position);
          enemy.meshGroup.rotation.y = enemy.yaw;

          // Enemy Procedural Rig Animation
          const dummyRig = (enemy.meshGroup as unknown as { rig?: HumanBoneRig }).rig;
          if (dummyRig) {
            HumanModel3D.animateRig(dummyRig, {
              time: currentTime / 1000,
              speed: enemy.speed,
              isMoving: enemy.animState.isMoving,
              isSprinting: false,
              isCrouching: false,
              isAiming: enemy.animState.isAiming,
              isReloading: false,
              hitFlinch: enemy.animState.hitFlinch,
              isDead: enemy.isDead,
              deathProgress: enemy.animState.deathFallProgress,
            });
          }
        }
      });

      // 7. Update Pickups
      envResult.pickupItems.forEach((pickup) => {
        if (!pickup.active) {
          pickup.respawnTime += delta;
          if (pickup.respawnTime >= 18) {
            pickup.active = true;
            pickup.respawnTime = 0;
            if (pickup.mesh) pickup.mesh.visible = true;
          }
        } else {
          // Hover & Spin
          if (pickup.mesh) {
            pickup.mesh.rotation.y += delta * 2;
            pickup.mesh.position.y = pickup.position.y + Math.sin(currentTime * 0.003) * 0.15;
          }

          // Player Pickup Collision
          if (pState.position.distanceTo(pickup.position) < 1.6) {
            pickup.active = false;
            if (pickup.mesh) pickup.mesh.visible = false;
            FPSAudioEngine.playPickup();

            if (pickup.type === 'health') {
              pState.health = Math.min(selectedClass.maxHealth, pState.health + 45);
              setPlayerHealth(Math.round(pState.health));
            } else if (pickup.type === 'armor') {
              pState.armor = Math.min(selectedClass.maxArmor, pState.armor + 50);
              setPlayerArmor(Math.round(pState.armor));
            } else if (pickup.type === 'ammo') {
              pState.ammoReserve = Math.min(wData.maxReserve, pState.ammoReserve + wData.magSize * 2);
              setAmmoReserve(pState.ammoReserve);
            }
          }
        }
      });

      // 8. Update Target Practice Boards
      if (envResult.practiceTargets) {
        envResult.practiceTargets.forEach((target) => {
          // Slide side to side
          const tPos = target.initialPos.clone();
          tPos.x += Math.sin((currentTime / 1000) * target.moveSpeed) * target.moveRange;
          target.position.copy(tPos);

          if (target.mesh) {
            target.mesh.position.copy(tPos);
            if (target.isHit) {
              target.hitTimer += delta;
              target.mesh.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2.2, target.hitTimer * 4);
              if (target.hitTimer > 2.0) {
                target.isHit = false;
                target.hitTimer = 0;
                target.mesh.rotation.x = 0;
              }
            }
          }
        });
      }

      // 9. Update Player 3D Mesh Position & Animation
      playerRig.root.position.copy(pState.position);
      playerRig.root.rotation.y = pState.yaw;

      HumanModel3D.animateRig(playerRig, {
        time: currentTime / 1000,
        speed: selectedClass.speed,
        isMoving: pState.velocity.length() > 0.4,
        isSprinting: pState.isSprinting,
        isCrouching: pState.isCrouching,
        isAiming: pState.isAiming,
        isReloading: pState.isReloading,
        reloadProgress,
        fireRecoil: pState.fireRecoil,
        hitFlinch: pState.hitFlinch,
        pitch: pState.pitch,
        isDead: pState.isDead,
      });

      // 10. Update Third-Person Follow Camera
      const camTarget = FPSPhysicsEngine.calculateThirdPersonCamera(
        pState.position,
        pState.yaw,
        pState.pitch,
        pState.isAiming,
        pState.isCrouching,
        envResult.obstacles
      );
      camera.position.lerp(camTarget.cameraPos, 0.4);
      camera.lookAt(camTarget.lookAtPos);

      // Camera FOV zoom when ADS Aiming
      const targetFov = pState.isAiming ? (pState.activeWeapon === 'sniper' ? 30 : 48) : 65;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 12);
      camera.updateProjectionMatrix();

      // 11. Update HUD Minimap Coordinates & Target Locking Ray
      setPlayerCoord({ x: pState.position.x, z: pState.position.z, yaw: pState.yaw });
      setMinimapEnemies(
        enemies.map((e) => ({
          x: e.position.x,
          z: e.position.z,
          isDead: e.isDead,
        }))
      );

      // Enemy in crosshair center ray check for dynamic target lock feedback
      const aimRayDir = new THREE.Vector3(
        -Math.sin(pState.yaw) * Math.cos(pState.pitch),
        Math.sin(pState.pitch),
        -Math.cos(pState.yaw) * Math.cos(pState.pitch)
      ).normalize();

      let isAimingAtEnemy = false;
      const eyePos = pState.position.clone().add(new THREE.Vector3(0, 1.4, 0));
      for (const enemy of enemies) {
        if (!enemy.isDead && enemy.team === 'enemy') {
          const toEnemy = enemy.position.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(eyePos);
          const dist = toEnemy.length();
          if (dist < 80) {
            toEnemy.normalize();
            if (aimRayDir.dot(toEnemy) > 0.985) {
              isAimingAtEnemy = true;
              break;
            }
          }
        }
      }
      setIsTargetLocked(isAimingAtEnemy);

      // Render Three.js Scene
      renderer.render(scene, camera);
    };

    animFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [currentScreen, isPaused, selectedClass, selectedModeId, reloadProgress, recordGamePlayed]);

  // --- DAMAGE HANDLER ---
  const handlePlayerDamage = (damage: number) => {
    const p = playerState.current;
    if (p.isDead) return;

    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 120);

    let remaining = damage;
    if (p.armor > 0) {
      const armorDmg = Math.min(p.armor, remaining);
      p.armor -= armorDmg;
      remaining -= armorDmg;
    }
    p.health -= remaining;
    p.hitFlinch = 1.0;

    setPlayerHealth(Math.max(0, Math.round(p.health)));
    setPlayerArmor(Math.max(0, Math.round(p.armor)));

    if (p.health <= 0) {
      p.isDead = true;
      p.health = 0;
      recordGamePlayed('neon_strike', false);
      setTimeout(() => setCurrentScreen('game_over'), 1200);
    }
  };

  // --- MOBILE VIRTUAL JOYSTICK & TOUCH CALLBACKS ---
  const handleJoystickMove = useCallback((vec: { x: number; y: number }) => {
    virtualJoystickRef.current = vec;
  }, []);

  const handleLookDelta = useCallback((dx: number, dy: number) => {
    if (playerState.current.isDead || isPaused) return;
    playerState.current.yaw += dx;
    playerState.current.pitch -= dy;
    playerState.current.pitch = Math.max(-1.05, Math.min(1.05, playerState.current.pitch));
  }, [isPaused]);

  const handleShootStart = useCallback(() => {
    keysRef.current.mouseLeft = true;
    keysRef.current.shoot = true;
  }, []);

  const handleShootEnd = useCallback(() => {
    keysRef.current.mouseLeft = false;
    keysRef.current.shoot = false;
  }, []);

  const handleAimToggle = useCallback(() => {
    playerState.current.isAiming = !playerState.current.isAiming;
    keysRef.current.aim = playerState.current.isAiming;
    setIsAiming(playerState.current.isAiming);
  }, []);

  const handleJump = useCallback(() => {
    if (playerState.current.isGrounded && !playerState.current.isDead) {
      playerState.current.velocity.y = 8.5;
      playerState.current.isGrounded = false;
      FPSAudioEngine.playJump();
    }
  }, []);

  const handleCrouchToggle = useCallback(() => {
    playerState.current.isCrouching = !playerState.current.isCrouching;
    setIsCrouching(playerState.current.isCrouching);
  }, []);

  const handleSprintToggle = useCallback(() => {
    playerState.current.isSprinting = !playerState.current.isSprinting;
    setIsSprinting(playerState.current.isSprinting);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[88vh] min-h-[580px] bg-slate-950 text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans select-none border border-slate-800"
    >
      {/* ============================================================ */}
      {/* SCREEN 1: MAIN MENU / PRO SHOOTING ARENA LOBBY */}
      {/* ============================================================ */}
      {currentScreen === 'menu' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-7 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveGameId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700"
              >
                <ChevronLeft className="w-4 h-4" /> GameZone Hub
              </button>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> PRO SHOOTING ARENA
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                title="Controls & Sensitivity Settings"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Controls</span>
              </button>
              <button
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Central Arena Hero Section & Controls Guide Strip */}
          <div className="my-3 space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="inline-block px-3 py-0.5 rounded-md bg-blue-600/30 border border-blue-500/50 text-blue-400 text-[11px] font-black uppercase tracking-widest mb-1.5">
                  Realistic 3D Human Combat Engine
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
                  SHOOTING ARENA
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1">
                  Step onto the combat floor. Third-person tactical combat in a sunlit 3D city with responsive aim, cover combat, and intuitive controls.
                </p>
              </div>

              {/* Instant Start Arena Match Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => {
                    if (!hasSeenHowToPlay) {
                      setIsHowToPlayOpen(true);
                    } else {
                      startMatch();
                    }
                  }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-black font-black text-base uppercase tracking-wider shadow-xl shadow-amber-500/25 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-black" /> START GAME
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsHowToPlayOpen(true)}
                    className="px-4 py-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 font-bold text-xs tracking-wide border border-cyan-500/50 flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-400" /> How to Play
                  </button>
                  <button
                    onClick={() => setCurrentScreen('class_select')}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wide border border-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Crosshair className="w-4 h-4 text-cyan-400" /> Operative
                  </button>
                  <button
                    onClick={() => setCurrentScreen('weapon_select')}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs tracking-wide border border-slate-700 flex items-center justify-center gap-1.5 transition"
                  >
                    <Target className="w-4 h-4 text-blue-400" /> Weapons
                  </button>
                </div>
              </div>
            </div>

            {/* Fast Keyboard & Touch Controls Banner */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 backdrop-blur-md shadow-md">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-cyan-400 mb-1.5">
                <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> HOW TO PLAY & CONTROLS</span>
                <button
                  onClick={() => setIsHowToPlayOpen(true)}
                  className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline cursor-pointer"
                >
                  View Full Field Manual
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-1.5">
                  <div className="font-black text-cyan-300">WASD</div>
                  <div className="text-[10px] text-slate-400">MOVE</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-1.5">
                  <div className="font-black text-blue-300">MOUSE</div>
                  <div className="text-[10px] text-slate-400">LOOK</div>
                </div>
                <div className="bg-slate-950/70 border border-cyan-500/50 rounded-lg p-1.5 ring-1 ring-cyan-500/30">
                  <div className="font-black text-cyan-400">RIGHT CLICK</div>
                  <div className="text-[10px] text-slate-400">AIM</div>
                </div>
                <div className="bg-slate-950/70 border border-red-500/50 rounded-lg p-1.5 ring-1 ring-red-500/30">
                  <div className="font-black text-red-400">LEFT CLICK / Z</div>
                  <div className="text-[10px] text-slate-400">SHOOT</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-1.5">
                  <div className="font-bold text-amber-300">R</div>
                  <div className="text-[10px] text-slate-400">RELOAD</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-1.5">
                  <div className="font-bold text-slate-200">SPACE</div>
                  <div className="text-[10px] text-slate-400">JUMP</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-1.5">
                  <div className="font-bold text-amber-400">SHIFT</div>
                  <div className="text-[10px] text-slate-400">SPRINT</div>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-1.5">
                  <div className="font-bold text-purple-300">1 - 6</div>
                  <div className="text-[10px] text-slate-400">WEAPONS</div>
                </div>
              </div>
            </div>

            {/* ARENA MODES SELECTOR GRID */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" /> Choose Game Mode:
                </span>
                <span className="text-[11px] font-bold text-amber-400">
                  Selected: {GAME_MODES.find((m) => m.id === selectedModeId)?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {GAME_MODES.map((mode) => {
                  const isSel = mode.id === selectedModeId;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedModeId(mode.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSel
                          ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10 scale-105'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {mode.badge}
                          </span>
                          {isSel && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
                        </div>
                        <h4 className="text-xs font-black text-white mt-1.5 line-clamp-1">{mode.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{mode.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ARENA MAP & WEAPON LOADOUT STRIP */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Map Selection */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" /> COMBAT MAP
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {GAME_MAPS.map((map) => {
                    const isM = map.id === selectedMapId;
                    return (
                      <button
                        key={map.id}
                        onClick={() => setSelectedMapId(map.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isM
                            ? 'bg-emerald-950/50 border-emerald-400 text-white font-black'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px] font-bold line-clamp-1">{map.name}</div>
                        <div className="text-[9px] text-emerald-400">{map.badge}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weapon Quick Equip (1-6) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 backdrop-blur-md">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2">
                  <Target className="w-3.5 h-3.5 text-cyan-400" /> WEAPON LOADOUT (KEYS 1 - 6)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {WEAPON_ORDER.map((wId, idx) => {
                    const w = WEAPON_REGISTRY[wId];
                    const isW = w.id === selectedWeaponId;
                    return (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWeaponId(w.id)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          isW
                            ? 'bg-cyan-950/50 border-cyan-400 text-white font-black'
                            : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[9px] font-black text-cyan-400">[{idx + 1}]</div>
                        <div className="text-[11px] font-bold line-clamp-1">{w.name.split(' ')[0]}</div>
                        <div className="text-[9px] text-slate-400">{w.damage} DMG</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quick Status Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur-md">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Operative</p>
              <p className="text-xs font-bold text-cyan-400">{selectedClass.codename} ({selectedClass.name})</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Equipped Gun</p>
              <p className="text-xs font-bold text-blue-400">{selectedWeapon.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Mode</p>
              <p className="text-xs font-bold text-amber-400">{GAME_MODES.find((m) => m.id === selectedModeId)?.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Environment</p>
              <p className="text-xs font-bold text-emerald-400">{GAME_MAPS.find((m) => m.id === selectedMapId)?.name || 'City District'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 2: CHARACTER / OPERATIVE SELECTION */}
      {/* ============================================================ */}
      {currentScreen === 'class_select' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between bg-slate-950 p-6 sm:p-8 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step 1 of 3</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Select Your Operative</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('menu')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Back to Menu
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {CHARACTER_CLASSES.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: `${cls.color}20`, color: cls.color }}
                        >
                          {cls.role}
                        </span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                      </div>

                      <h3 className="text-xl font-black text-white mt-3">{cls.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3">{cls.description}</p>

                      {/* Stat Bars */}
                      <div className="space-y-2 mt-4">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                            <span>HEALTH ({cls.maxHealth})</span>
                            <span>{cls.stats.health * 10}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${cls.stats.health * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                            <span>ARMOR ({cls.maxArmor})</span>
                            <span>{cls.stats.armor * 10}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cls.stats.armor * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                            <span>SPEED & SPRINT</span>
                            <span>{cls.stats.speed * 10}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cls.stats.speed * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-0.5">
                            <span>RECOIL & HANDLING</span>
                            <span>{cls.stats.handling * 10}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${cls.stats.handling * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider mt-5 transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Choose Operative'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <span className="text-xs text-slate-400">Selected: <strong className="text-white">{selectedClass.name}</strong></span>
            <button
              onClick={() => setCurrentScreen('weapon_select')}
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition"
            >
              Continue to Weapons <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 3: WEAPON SELECTION & ARSENAL */}
      {/* ============================================================ */}
      {currentScreen === 'weapon_select' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between bg-slate-950 p-6 sm:p-8 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Step 2 of 3</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Weapon Arsenal & Loadout</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('class_select')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Back
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {WEAPON_ORDER.map((wId) => {
                const w = WEAPON_REGISTRY[wId];
                const isSelected = w.id === selectedWeaponId;
                return (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWeaponId(w.id)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-xl shadow-cyan-500/10 scale-[1.02]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {w.category}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </div>

                      <h3 className="text-lg font-black text-white mt-2">{w.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{w.description}</p>

                      {/* Stat Breakdown Bars */}
                      <div className="space-y-1.5 mt-3 text-[10px]">
                        <div>
                          <div className="flex justify-between text-slate-400">
                            <span>DAMAGE ({w.damage})</span>
                            <span>{w.stats.damage * 10}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400" style={{ width: `${w.stats.damage * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-400">
                            <span>RANGE ({w.range}m)</span>
                            <span>{w.stats.range * 10}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400" style={{ width: `${w.stats.range * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-400">
                            <span>ACCURACY</span>
                            <span>{w.stats.accuracy * 10}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${w.stats.accuracy * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-400">
                            <span>FIRE RATE</span>
                            <span>{w.stats.fireRate * 10}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${w.stats.fireRate * 10}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-slate-400">
                            <span>MAGAZINE ({w.magSize})</span>
                            <span>{w.stats.magazine * 10}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400" style={{ width: `${w.stats.magazine * 10}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      className={`w-full py-1.5 rounded-lg text-xs font-black uppercase tracking-wider mt-4 transition ${
                        isSelected
                          ? 'bg-cyan-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Equipped' : 'Equip Weapon'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <span className="text-xs text-slate-400">Equipped: <strong className="text-white">{selectedWeapon.name}</strong></span>
            <button
              onClick={() => setCurrentScreen('mode_select')}
              className="px-8 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition"
            >
              Continue to Game Modes <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 4: GAME MODE SELECTION */}
      {/* ============================================================ */}
      {currentScreen === 'mode_select' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between bg-slate-950 p-6 sm:p-8 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Step 3 of 3</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Choose Combat Mode</h2>
              </div>
              <button
                onClick={() => setCurrentScreen('weapon_select')}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {GAME_MODES.map((mode) => {
                const isSelected = mode.id === selectedModeId;
                return (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedModeId(mode.id)}
                    className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.02]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md"
                          style={{ backgroundColor: `${mode.color}20`, color: mode.color }}
                        >
                          {mode.badge}
                        </span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                      </div>

                      <h3 className="text-xl font-black text-white mt-3">{mode.name}</h3>
                      <p className="text-xs font-semibold text-slate-300 mt-1">{mode.tagline}</p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{mode.description}</p>
                    </div>

                    <button
                      className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider mt-6 transition ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Mode'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-800">
            <span className="text-xs text-slate-400">Mode: <strong className="text-white">{GAME_MODES.find((m) => m.id === selectedModeId)?.name}</strong></span>
            <button
              onClick={startMatch}
              className="px-10 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 hover:scale-105 text-white font-black text-base uppercase tracking-wider shadow-xl flex items-center gap-2 transition"
            >
              <Play className="w-5 h-5 fill-white" /> Start Match
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 5: ACTIVE 3D GAMEPLAY CANVAS & MODERN HUD */}
      {/* ============================================================ */}
      {currentScreen === 'playing' && (
        <div className="relative w-full h-full flex flex-col">
          {/* WebGL Canvas */}
          <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

          {/* Red Damage Flash Screen Vignette */}
          <AnimatePresence>
            {damageFlash && (
              <motion.div
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 pointer-events-none bg-red-600/35 z-10"
              />
            )}
          </AnimatePresence>

          {/* ========================================================== */}
          {/* HUD LAYER (Matched to User Reference Image Layout) */}
          {/* ========================================================== */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-20">
            {/* TOP BAR */}
            <div className="flex items-start justify-between w-full">
              {/* TOP LEFT: Circular Minimap Radar & Hostiles Badge */}
              <div className="flex flex-col items-start gap-2.5">
                {/* Circular Street GPS Radar */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-slate-950/90 rounded-full border-2 border-slate-700 shadow-2xl overflow-hidden p-1 backdrop-blur-md">
                  <div className="relative w-full h-full rounded-full bg-slate-900/90 flex items-center justify-center border border-slate-800 overflow-hidden">
                    {/* Street Grid Lines */}
                    <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:10px_10px] opacity-60" />
                    <div className="absolute w-full h-[1px] bg-slate-600/40" />
                    <div className="absolute h-full w-[1px] bg-slate-600/40" />
                    <div className="absolute w-14 h-14 rounded-full border border-cyan-500/30" />

                    {/* Compass North */}
                    <span className="absolute top-1 text-[10px] font-black text-cyan-400">N</span>

                    {/* Player Triangle Direction */}
                    <div
                      className="absolute w-3 h-3 z-10"
                      style={{
                        transform: `rotate(${-playerCoord.yaw}rad)`,
                      }}
                    >
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-300 shadow-[0_0_8px_#38bdf8]" />
                    </div>

                    {/* Enemy Blips */}
                    {minimapEnemies.map((e, idx) => {
                      if (e.isDead) return null;
                      const relX = (e.x - playerCoord.x) * 0.7;
                      const relZ = (e.z - playerCoord.z) * 0.7;
                      if (Math.abs(relX) > 46 || Math.abs(relZ) > 46) return null;

                      return (
                        <div
                          key={idx}
                          className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444] animate-pulse"
                          style={{
                            left: `calc(50% + ${relX}px)`,
                            top: `calc(50% + ${relZ}px)`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Red Hostiles Counter Badge (Under Radar) */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 border-2 border-red-400/80 shadow-lg text-white">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full bg-slate-950 border border-white/50 flex items-center justify-center text-[10px]">
                      🕶️
                    </div>
                    <div className="w-5 h-5 rounded-full bg-slate-900 border border-white/50 flex items-center justify-center text-[10px]">
                      🕶️
                    </div>
                  </div>
                  <span className="text-sm font-black tracking-wide">
                    x {enemiesRemaining}
                  </span>
                </div>
              </div>

              {/* TOP CENTER: TIME & SCORE ARCADE DISPLAY */}
              <div className="flex flex-col items-center">
                {/* TIME Header & Green Monospace Capsule */}
                <div className="flex flex-col items-center mb-1">
                  <span className="text-red-500 font-black text-[11px] sm:text-xs tracking-wider uppercase drop-shadow">
                    TIME
                  </span>
                  <div className="px-4 py-0.5 sm:py-1 rounded-full bg-emerald-950/90 border-2 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.35)] backdrop-blur-md">
                    <span className="font-mono text-lime-400 font-black text-lg sm:text-xl tracking-widest">
                      {Math.floor(survivalTime / 60)}:{(Math.floor(survivalTime) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* SCORE Header & Stylized Blue Score */}
                <div className="flex flex-col items-center">
                  <span className="text-cyan-400 font-black text-[11px] sm:text-xs tracking-wider uppercase drop-shadow">
                    SCORE
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-white font-display drop-shadow-[0_2px_12px_rgba(56,189,248,0.7)] tracking-wide">
                    {score}
                  </span>
                </div>

                {/* Kill Feed */}
                <div className="mt-2 space-y-1 pointer-events-none">
                  {killFeed.slice(0, 2).map((kf) => (
                    <motion.div
                      key={kf.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`text-[10px] px-2.5 py-0.5 rounded-md backdrop-blur-md font-black shadow ${
                        kf.isHeadshot ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50' : 'bg-slate-900/80 text-slate-200 border border-slate-800'
                      }`}
                    >
                      {kf.text}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* TOP RIGHT: CASH COUNTER & SHORTCUT CONTROLS */}
              <div className="flex flex-col items-end gap-2">
                {/* Cash Counter */}
                <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-emerald-500/40 text-emerald-400 shadow-lg backdrop-blur-md">
                  <span className="text-sm">💵</span>
                  <span className="text-lg sm:text-xl font-black font-display tracking-tight text-emerald-400">
                    ${profile.cash || 0}
                  </span>
                </div>

                {/* Keyboard Shortcuts Hint */}
                <div className="hidden sm:flex flex-col items-end text-[9px] font-bold text-slate-300 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800/80 shadow">
                  <span>P / ESC : PAUSE</span>
                  <span>M : MUTE AUDIO</span>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    onClick={() => setIsHowToPlayOpen(true)}
                    className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-cyan-300 transition shadow"
                    title="Controls Manual"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 transition shadow"
                    title="Settings"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => setIsPaused(true)}
                    className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-300 transition shadow"
                    title="Pause"
                  >
                    <Pause className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* CENTER: DYNAMIC CROSSHAIR & SNIPER SCOPE OVERLAY */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Sniper High-Tech Scope ADS Overlay */}
              {isAiming && playerState.current.activeWeapon === 'sniper' ? (
                <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border-4 border-cyan-500/80 bg-cyan-950/20 shadow-[0_0_50px_rgba(6,182,212,0.4)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 border border-cyan-400/40 rounded-full" />
                  {/* Crosshair lines */}
                  <div className="absolute w-full h-[2px] bg-cyan-400" />
                  <div className="absolute h-full w-[2px] bg-cyan-400" />
                  {/* Sub-range ticks */}
                  <div className="absolute w-32 h-[1px] bg-cyan-300 -translate-y-6" />
                  <div className="absolute w-24 h-[1px] bg-cyan-300 -translate-y-12" />
                  <div className="absolute w-16 h-[1px] bg-cyan-300 -translate-y-18" />
                  <div className="absolute w-32 h-[1px] bg-cyan-300 translate-y-6" />
                  <div className="absolute w-24 h-[1px] bg-cyan-300 translate-y-12" />
                  <div className="absolute w-16 h-[1px] bg-cyan-300 translate-y-18" />
                  {/* Center Dot */}
                  <div className={`w-2 h-2 rounded-full ${isTargetLocked ? 'bg-red-500 shadow-[0_0_10px_#ef4444] scale-125 animate-pulse' : 'bg-red-500 shadow-[0_0_6px_#ef4444]'}`} />
                  {/* Telemetry text */}
                  <span className={`absolute top-4 text-[10px] font-mono font-bold ${isTargetLocked ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                    {isTargetLocked ? '🎯 TARGET LOCKED [HOSTILE]' : 'RANGE: 120M | CALIBER: .50 BMG'}
                  </span>
                </div>
              ) : (
                /* Standard Dynamic Reticle */
                <div className="relative flex items-center justify-center">
                  <div
                    className={`relative transition-all duration-75 flex items-center justify-center ${
                      isSprinting ? 'w-10 h-10' : isAiming ? 'w-4 h-4' : 'w-7 h-7'
                    }`}
                  >
                    <div className={`absolute top-0 w-1 h-2.5 rounded-full transition-colors ${isTargetLocked ? 'bg-red-400 shadow-[0_0_6px_#ef4444]' : 'bg-cyan-400/80'}`} />
                    <div className={`absolute bottom-0 w-1 h-2.5 rounded-full transition-colors ${isTargetLocked ? 'bg-red-400 shadow-[0_0_6px_#ef4444]' : 'bg-cyan-400/80'}`} />
                    <div className={`absolute left-0 w-2.5 h-1 rounded-full transition-colors ${isTargetLocked ? 'bg-red-400 shadow-[0_0_6px_#ef4444]' : 'bg-cyan-400/80'}`} />
                    <div className={`absolute right-0 w-2.5 h-1 rounded-full transition-colors ${isTargetLocked ? 'bg-red-400 shadow-[0_0_6px_#ef4444]' : 'bg-cyan-400/80'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isTargetLocked ? 'bg-red-500 scale-125 shadow-[0_0_8px_#ef4444]' : 'bg-cyan-300'}`} />

                    {/* Target Lock Brackets */}
                    {isTargetLocked && (
                      <div className="absolute -inset-2 border border-red-500/80 rounded-md animate-ping pointer-events-none" />
                    )}
                  </div>
                </div>
              )}

              {/* Hitmarker confirmation */}
              {hitmarkerActive && (
                <div className="absolute w-7 h-7 flex items-center justify-center">
                  <div className={`w-full h-full border-2 rotate-45 ${hitmarkerHeadshot ? 'border-amber-400 scale-125' : 'border-red-500'}`} />
                </div>
              )}
            </div>

            {/* BOTTOM BAR */}
            <div className="flex items-end justify-between w-full">
              {/* Bottom Left: Character Portrait "Carl", Carl TIME bar, HEALTH bar */}
              <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl">
                {/* Character Portrait Box with Orange Border */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center">
                  <div className="w-full h-full rounded-[10px] bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-2xl sm:text-3xl">🕶️</span>
                    <span className="absolute bottom-0 text-[8px] font-black uppercase tracking-wider bg-orange-600/90 text-white w-full text-center py-0.5">
                      CARL
                    </span>
                  </div>
                </div>

                {/* Gauges: Carl TIME (Blue) and HEALTH (Green) */}
                <div className="flex flex-col gap-2 min-w-[130px] sm:min-w-[170px]">
                  {/* Carl TIME Bar (Blue) */}
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-sky-300 mb-0.5">
                      <span className="tracking-wider">Carl TIME</span>
                      <span>{stamina}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-sky-500/40 p-0.5">
                      <div
                        className="h-full bg-sky-400 rounded-full shadow-[0_0_8px_#38bdf8] transition-all duration-150"
                        style={{ width: `${Math.max(5, stamina)}%` }}
                      />
                    </div>
                  </div>

                  {/* HEALTH Bar (Green) */}
                  <div>
                    <div className="flex justify-between text-[10px] font-black text-emerald-300 mb-0.5">
                      <span className="tracking-wider">HEALTH</span>
                      <span>{playerHealth} / {selectedClass.maxHealth}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-emerald-500/40 p-0.5">
                      <div
                        className="h-full bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] transition-all duration-150"
                        style={{ width: `${Math.max(0, (playerHealth / selectedClass.maxHealth) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Center: Quick Select Weapon Hotbar */}
              <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-lg pointer-events-auto">
                {WEAPON_ORDER.map((wId, idx) => {
                  const w = WEAPON_REGISTRY[wId];
                  const isCurrent = w.id === selectedWeaponId;
                  return (
                    <button
                      key={w.id}
                      onClick={() => switchWeapon(w.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[10px] opacity-60">[{idx + 1}]</span>
                      {w.name.split(' ')[0]}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Right: Red Grenade Button & Blue Weapon Box */}
              <div className="flex items-center gap-3 pointer-events-auto">
                {/* Red Grenade Card */}
                <button
                  id="hud-grenade-btn"
                  onClick={() => {
                    // Trigger explosive grenade attack
                    triggerGrenadeThrow();
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 border-2 border-red-400/80 shadow-xl flex flex-col items-center justify-between p-1.5 sm:p-2 cursor-pointer transition transform active:scale-95 text-white"
                  title="Throw Grenade [G]"
                >
                  <span className="text-xl sm:text-2xl mt-0.5">💣</span>
                  <span className="text-sm sm:text-base font-black font-display leading-none">
                    5
                  </span>
                  <span className="text-[8px] font-black uppercase text-red-200 tracking-tighter">
                    GRENADE
                  </span>
                </button>

                {/* Blue Weapon Card */}
                <button
                  id="hud-weapon-card-btn"
                  onClick={() => setIsWeaponWheelOpen(true)}
                  className="w-20 h-16 sm:w-24 sm:h-20 rounded-2xl bg-gradient-to-b from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 border-2 border-blue-400/80 shadow-xl flex flex-col items-center justify-between p-1.5 sm:p-2 cursor-pointer transition transform active:scale-95 text-white"
                  title="Switch Weapon Arsenal [Q / Tab / 1-6]"
                >
                  <div className="flex items-center justify-center text-lg sm:text-xl mt-0.5">
                    🔫
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-black font-display leading-none text-white">
                      {currentAmmo}
                    </span>
                    <span className="text-[10px] text-blue-200 font-bold">
                      / {ammoReserve > 900 ? '∞' : ammoReserve}
                    </span>
                  </div>
                  <span className="text-[8px] font-black uppercase text-blue-200 tracking-tighter truncate max-w-full">
                    {selectedWeapon.name.split(' ')[0]}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* MODERN TOUCH VIRTUAL CONTROLS */}
          {/* ========================================================== */}
          <TouchVirtualControls
            onJoystickMove={handleJoystickMove}
            onLookDelta={handleLookDelta}
            onShootStart={handleShootStart}
            onShootEnd={handleShootEnd}
            onAimToggle={handleAimToggle}
            onJump={handleJump}
            onCrouchToggle={handleCrouchToggle}
            onSprintToggle={handleSprintToggle}
            onReload={triggerReload}
            onOpenWeaponWheel={() => setIsWeaponWheelOpen(true)}
            activeWeaponId={selectedWeaponId}
            isAiming={isAiming}
            isCrouching={isCrouching}
            isSprinting={isSprinting}
            isReloading={isReloading}
            settings={controlSettings}
          />

          {/* Pause Menu Modal */}
          {isPaused && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center p-6">
              <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                <h3 className="text-2xl font-black text-white">GAME PAUSED</h3>
                <p className="text-xs text-slate-400 mt-1">Tactical Combat Mission In Progress</p>

                <div className="space-y-3 mt-6">
                  <button
                    onClick={() => setIsPaused(false)}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm uppercase tracking-wider transition"
                  >
                    Resume Match
                  </button>
                  <button
                    onClick={() => setIsHowToPlayOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 font-semibold text-xs transition flex items-center justify-center gap-2 border border-cyan-500/40"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    How to Play & Controls Manual
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Controls & Sensitivity Settings
                  </button>
                  <button
                    onClick={handleToggleMute}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center justify-center gap-2"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  </button>
                  <button
                    onClick={() => setCurrentScreen('menu')}
                    className="w-full py-2.5 rounded-xl bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-semibold text-xs transition"
                  >
                    Quit to Main Menu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 6: VICTORY SCREEN */}
      {/* ============================================================ */}
      {currentScreen === 'victory' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-center overflow-y-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">MISSION COMPLETE!</h2>
          <p className="text-base text-emerald-400 font-bold mt-1">🏆 Urban Elimination Successful</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg w-full bg-slate-900/80 p-5 rounded-2xl border border-slate-800 my-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">SCORE</p>
              <p className="text-xl font-black text-amber-400">{score}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">KILLS</p>
              <p className="text-xl font-black text-emerald-400">{kills}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">ACCURACY</p>
              <p className="text-xl font-black text-cyan-400">
                {shotsFired > 0 ? `${Math.round((shotsHit / shotsFired) * 100)}%` : '100%'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">TIME</p>
              <p className="text-xl font-black text-purple-400 font-mono">
                {Math.floor(survivalTime / 60)}m {Math.floor(survivalTime % 60)}s
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={startMatch}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> PLAY AGAIN
            </button>
            <button
              onClick={() => setCurrentScreen('menu')}
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm tracking-wide border border-slate-700 transition cursor-pointer"
            >
              RETURN TO MENU
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SCREEN 7: GAME OVER SCREEN */}
      {/* ============================================================ */}
      {currentScreen === 'game_over' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-6 sm:p-10 text-center overflow-y-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
            <Skull className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">OPERATIVE DOWN</h2>
          <p className="text-base text-red-400 font-bold mt-1">Defeated in Combat Zone</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg w-full bg-slate-900/80 p-5 rounded-2xl border border-slate-800 my-6">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Score</p>
              <p className="text-xl font-black text-amber-400">{score}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Kills</p>
              <p className="text-xl font-black text-slate-300">{kills}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Headshots</p>
              <p className="text-xl font-black text-purple-400">{headshots}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Time Survived</p>
              <p className="text-xl font-black text-cyan-400">{Math.round(survivalTime)}s</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={startMatch}
              className="px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" /> Redeploy
            </button>
            <button
              onClick={() => setCurrentScreen('menu')}
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm tracking-wide border border-slate-700 transition"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS & OVERLAYS */}
      {/* ============================================================ */}
      <ControlsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={controlSettings}
        onUpdateSettings={(newSettings) => setControlSettings(newSettings)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      <WeaponWheelModal
        isOpen={isWeaponWheelOpen}
        onClose={() => setIsWeaponWheelOpen(false)}
        activeWeaponId={selectedWeaponId}
        onSelectWeapon={(wId) => switchWeapon(wId)}
      />

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
        onDeploy={currentScreen !== 'playing' ? startMatch : undefined}
        activeModeId={selectedModeId}
      />
    </div>
  );
};
