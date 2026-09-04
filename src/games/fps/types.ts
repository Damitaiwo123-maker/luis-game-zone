import * as THREE from 'three';

// --- CHARACTER CLASSES ---
export type CharacterClassId = 'tactical' | 'scout' | 'heavy' | 'specialist';

export interface CharacterClass {
  id: CharacterClassId;
  name: string;
  codename: string;
  role: string;
  description: string;
  maxHealth: number;
  maxArmor: number;
  speed: number;
  sprintMult: number;
  reloadMult: number;
  recoilMult: number;
  radarRange: number;
  color: string;
  accentColor: string;
  armorType: 'standard' | 'light' | 'heavy' | 'stealth';
  stats: {
    health: number; // 1-10
    armor: number; // 1-10
    speed: number; // 1-10
    handling: number; // 1-10
  };
}

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'tactical',
    name: 'Alex "Vanguard" Mercer',
    codename: 'VANGUARD',
    role: 'Assault Operative',
    description: 'Balanced combat specialist equipped with standard tactical body armor and versatile weapon handling.',
    maxHealth: 100,
    maxArmor: 100,
    speed: 7.5,
    sprintMult: 1.55,
    reloadMult: 1.0,
    recoilMult: 1.0,
    radarRange: 45,
    color: '#3b82f6',
    accentColor: '#60a5fa',
    armorType: 'standard',
    stats: { health: 7, armor: 7, speed: 7, handling: 8 }
  },
  {
    id: 'scout',
    name: 'Maya "Spectre" Lin',
    codename: 'SPECTRE',
    role: 'Recon & Infiltration',
    description: 'High-agility operative featuring lightweight carbon armor, rapid sprint speeds, and lightning-fast reload times.',
    maxHealth: 85,
    maxArmor: 65,
    speed: 9.0,
    sprintMult: 1.75,
    reloadMult: 1.35,
    recoilMult: 1.15,
    radarRange: 60,
    color: '#10b981',
    accentColor: '#34d399',
    armorType: 'light',
    stats: { health: 5, armor: 4, speed: 10, handling: 9 }
  },
  {
    id: 'heavy',
    name: 'Marcus "Goliath" Stone',
    codename: 'GOLIATH',
    role: 'Heavy Juggernaut',
    description: 'Fortified enforcer with reinforced titanium plating, unmatched damage soaking, and heavy recoil suppression.',
    maxHealth: 130,
    maxArmor: 150,
    speed: 6.0,
    sprintMult: 1.35,
    reloadMult: 0.85,
    recoilMult: 0.65,
    radarRange: 35,
    color: '#f59e0b',
    accentColor: '#fbbf24',
    armorType: 'heavy',
    stats: { health: 9, armor: 10, speed: 4, handling: 6 }
  },
  {
    id: 'specialist',
    name: 'Nova "Cipher" Thorne',
    codename: 'CIPHER',
    role: 'Cyber Marksman',
    description: 'Precision specialist engineered with advanced radar sensors, extreme aiming stabilization, and pinpoint precision.',
    maxHealth: 95,
    maxArmor: 85,
    speed: 7.8,
    sprintMult: 1.5,
    reloadMult: 1.1,
    recoilMult: 0.75,
    radarRange: 75,
    color: '#8b5cf6',
    accentColor: '#a78bfa',
    armorType: 'stealth',
    stats: { health: 6, armor: 6, speed: 8, handling: 10 }
  }
];

// --- WEAPON TYPES & ARSENAL ---
export type WeaponId = 'pistol' | 'rifle' | 'smg' | 'shotgun' | 'sniper' | 'bazooka' | 'machinegun';

export interface WeaponData {
  id: WeaponId;
  name: string;
  category: string;
  description: string;
  damage: number;
  headshotMultiplier: number;
  fireRateMs: number;
  magSize: number;
  maxReserve: number;
  reloadTimeMs: number;
  spread: number; // Base spread in radians
  aimSpreadMultiplier: number; // Spread when ADS
  range: number;
  bulletSpeed: number; // For raycast or projectile
  isExplosive?: boolean;
  blastRadius?: number;
  pellets?: number; // For shotgun
  recoilPitch: number; // Camera kick upward
  recoilYaw: number; // Camera kick horizontal
  color: string;
  bulletColor: string;
  icon: string;
  stats: {
    damage: number; // 1-10
    range: number; // 1-10
    accuracy: number; // 1-10
    fireRate: number; // 1-10
    magazine: number; // 1-10
    reload: number; // 1-10
  };
}

export const WEAPON_REGISTRY: Record<WeaponId, WeaponData> = {
  pistol: {
    id: 'pistol',
    name: 'Enforcer-9 Pistol',
    category: 'Sidearm',
    description: 'High-precision semi-automatic tactical sidearm. Reliable backup with instant draw speed and crisp handling.',
    damage: 26,
    headshotMultiplier: 2.2,
    fireRateMs: 200,
    magSize: 15,
    maxReserve: 90,
    reloadTimeMs: 1200,
    spread: 0.025,
    aimSpreadMultiplier: 0.35,
    range: 55,
    bulletSpeed: 240,
    recoilPitch: 0.02,
    recoilYaw: 0.005,
    color: '#94a3b8',
    bulletColor: '#fde047',
    icon: 'Crosshair',
    stats: { damage: 4, range: 4, accuracy: 8, fireRate: 6, magazine: 4, reload: 9 }
  },
  rifle: {
    id: 'rifle',
    name: 'Vanguard-4 Assault Rifle',
    category: 'Assault Rifle',
    description: 'Standard issue military assault rifle. Optimal blend of cyclic rate of fire, stopping power, and mid-to-long range accuracy.',
    damage: 32,
    headshotMultiplier: 2.0,
    fireRateMs: 115,
    magSize: 30,
    maxReserve: 180,
    reloadTimeMs: 1800,
    spread: 0.035,
    aimSpreadMultiplier: 0.3,
    range: 90,
    bulletSpeed: 300,
    recoilPitch: 0.025,
    recoilYaw: 0.008,
    color: '#3b82f6',
    bulletColor: '#38bdf8',
    icon: 'Target',
    stats: { damage: 7, range: 7, accuracy: 7, fireRate: 7, magazine: 7, reload: 7 }
  },
  smg: {
    id: 'smg',
    name: 'Spectre-9 SMG',
    category: 'Submachine Gun',
    description: 'Rapid-cycling compact submachine gun with extreme close-range rate of fire and superb strafe mobility.',
    damage: 20,
    headshotMultiplier: 1.8,
    fireRateMs: 75,
    magSize: 40,
    maxReserve: 240,
    reloadTimeMs: 1400,
    spread: 0.055,
    aimSpreadMultiplier: 0.45,
    range: 45,
    bulletSpeed: 220,
    recoilPitch: 0.018,
    recoilYaw: 0.012,
    color: '#10b981',
    bulletColor: '#34d399',
    icon: 'Zap',
    stats: { damage: 4, range: 3, accuracy: 5, fireRate: 10, magazine: 8, reload: 8 }
  },
  shotgun: {
    id: 'shotgun',
    name: 'Breacher-12 Shotgun',
    category: 'Shotgun',
    description: 'Heavy 12-gauge tactical pump-action shotgun. Fires an 8-pellet lethal cone capable of annihilating close targets.',
    damage: 16, // per pellet * 8 = 128 max
    pellets: 8,
    headshotMultiplier: 1.6,
    fireRateMs: 750,
    magSize: 8,
    maxReserve: 48,
    reloadTimeMs: 2200,
    spread: 0.12,
    aimSpreadMultiplier: 0.65,
    range: 30,
    bulletSpeed: 180,
    recoilPitch: 0.08,
    recoilYaw: 0.02,
    color: '#ef4444',
    bulletColor: '#f87171',
    icon: 'Flame',
    stats: { damage: 10, range: 2, accuracy: 3, fireRate: 3, magazine: 3, reload: 5 }
  },
  sniper: {
    id: 'sniper',
    name: 'Apex-50 Heavy Sniper',
    category: 'Sniper Rifle',
    description: 'High-caliber anti-materiel marksman rifle. Delivers catastrophic single-shot damage with high-power telescopic optical scope.',
    damage: 135,
    headshotMultiplier: 2.8,
    fireRateMs: 1250,
    magSize: 5,
    maxReserve: 30,
    reloadTimeMs: 2500,
    spread: 0.08, // High hipfire spread
    aimSpreadMultiplier: 0.002, // Laser accurate when scoped!
    range: 160,
    bulletSpeed: 500,
    recoilPitch: 0.1,
    recoilYaw: 0.01,
    color: '#8b5cf6',
    bulletColor: '#c084fc',
    icon: 'Eye',
    stats: { damage: 10, range: 10, accuracy: 10, fireRate: 2, magazine: 2, reload: 4 }
  },
  bazooka: {
    id: 'bazooka',
    name: 'Havoc-X Rocket Launcher',
    category: 'Explosive Launcher',
    description: 'Shoulder-mounted rocket launcher firing high-explosive ordnance with devastating blast radius and terrain knockback.',
    damage: 160,
    headshotMultiplier: 1.0,
    fireRateMs: 1600,
    magSize: 3,
    maxReserve: 12,
    reloadTimeMs: 3000,
    spread: 0.015,
    aimSpreadMultiplier: 0.5,
    range: 120,
    bulletSpeed: 65,
    isExplosive: true,
    blastRadius: 9.5,
    recoilPitch: 0.09,
    recoilYaw: 0.015,
    color: '#f97316',
    bulletColor: '#fb923c',
    icon: 'Sparkles',
    stats: { damage: 10, range: 8, accuracy: 7, fireRate: 1, magazine: 1, reload: 2 }
  },
  machinegun: {
    id: 'machinegun',
    name: 'Titan-MG Squad Automatic',
    category: 'Heavy Machine Gun',
    description: 'Belt-fed squad support weapon with a 75-round drum magazine. Excels at continuous suppressive fire and choke point denial.',
    damage: 29,
    headshotMultiplier: 1.9,
    fireRateMs: 100,
    magSize: 75,
    maxReserve: 225,
    reloadTimeMs: 3200,
    spread: 0.05,
    aimSpreadMultiplier: 0.35,
    range: 75,
    bulletSpeed: 280,
    recoilPitch: 0.032,
    recoilYaw: 0.015,
    color: '#eab308',
    bulletColor: '#facc15',
    icon: 'Shield',
    stats: { damage: 7, range: 6, accuracy: 6, fireRate: 8, magazine: 10, reload: 2 }
  }
};

export const WEAPON_ORDER: WeaponId[] = ['pistol', 'rifle', 'smg', 'shotgun', 'sniper', 'bazooka', 'machinegun'];

// --- GAME MODES ---
export type GameModeId =
  | 'duel_1v1'
  | 'enemy_hunt'
  | 'target_practice'
  | 'survival'
  | 'shooting_range'
  | 'time_attack'
  | 'wave_attack'
  | 'boss_battle'
  // Compatibility aliases
  | 'quick_match'
  | 'mission'
  | 'team_battle';

export interface GameModeInfo {
  id: GameModeId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
  color: string;
  rules: string[];
}

export const GAME_MODES: GameModeInfo[] = [
  {
    id: 'mission',
    name: 'MISSION',
    tagline: 'Urban Elimination: Neutralize all 8 hostiles',
    description: 'Deploy into the city district with a clear mission: Eliminate all 8 hostile operatives. Use streets, cars, and barriers for cover, track hostiles on your minimap, and secure the city.',
    icon: 'Shield',
    badge: 'Primary Mission',
    color: '#3b82f6',
    rules: ['Objective: Eliminate 8 Hostiles', 'Move through city streets & take cover', 'Check radar minimap for enemy locations', 'Complete mission to view combat report']
  },
  {
    id: 'duel_1v1',
    name: '1 VS 1',
    tagline: 'High-stakes combat duel in tactical arena',
    description: 'Face off against an elite rival operative in a dedicated cover-heavy arena. Use barriers, cars, and flanking to eliminate your opponent.',
    icon: 'Swords',
    badge: 'Competitive',
    color: '#3b82f6',
    rules: ['1v1 Tactical Duel', 'Equal Loadouts', 'First to eliminate claims Victory', 'Online Sync Ready']
  },
  {
    id: 'enemy_hunt',
    name: 'ENEMY HUNT',
    tagline: 'Urban sweep and neutralize 8 hostiles',
    description: 'Deploy into the combat zone to track and neutralize 8 hostile operatives patrolling the streets. Check corners and clear cover.',
    icon: 'Target',
    badge: 'Search & Destroy',
    color: '#10b981',
    rules: ['8 Hostile Operatives', 'Patrolling AI squads', 'Use cover and tactical flanking', 'Neutralize all to win']
  },
  {
    id: 'target_practice',
    name: 'TARGET PRACTICE',
    tagline: 'Precision drills & reactive pop-up targets',
    description: 'Test your flick accuracy, recoil control, and reaction timing on reactive moving and stationary bullseye targets with precision scoring.',
    icon: 'Crosshair',
    badge: 'Mastery',
    color: '#8b5cf6',
    rules: ['Reactive target boards', 'Accuracy & flick tracking', 'Dynamic distance targets', 'Speed and accuracy multipliers']
  },
  {
    id: 'survival',
    name: 'SURVIVAL',
    tagline: 'Escalating waves of hostile reinforcements',
    description: 'Hold the central plaza as waves of enemies escalate in strength, numbers, and firepower. Collect dropped armaments and survive.',
    icon: 'Flame',
    badge: 'Wave Defense',
    color: '#ef4444',
    rules: ['Wave 1: 5 Hostiles', 'Wave 2: 8 Hostiles', 'Wave 3: 12 Hostiles', 'Ammo & Health resupplies between waves']
  },
  {
    id: 'shooting_range',
    name: 'SHOOTING RANGE',
    tagline: 'Distance lanes at 10m, 25m, 50m, and 100m',
    description: 'Stand at the firing line to test bullet drop, spread, and recoil for all 6 weapons. Free weapon testing bench with instant ammo refills.',
    icon: 'Zap',
    badge: 'Testing Bench',
    color: '#06b6d4',
    rules: ['Marked 10m, 25m, 50m, 100m lanes', 'Instant ammo refills', 'Test all 6 firearms', 'Damage and spread diagnostics']
  },
  {
    id: 'time_attack',
    name: 'TIME ATTACK',
    tagline: '60-second speed elimination trial',
    description: 'Race against the clock! You have 60 seconds to neutralize as many targets and hostiles as possible. Highest score wins bragging rights.',
    icon: 'Sparkles',
    badge: 'High Score',
    color: '#f59e0b',
    rules: ['60-second countdown', 'Eliminations grant bonus score', 'Multiplier for headshots', 'Best score recorded locally']
  },
  {
    id: 'wave_attack',
    name: 'WAVE ATTACK',
    tagline: 'Relentless non-stop enemy onslaught',
    description: 'A continuous, relentless combat storm. Enemies spawn rapidly with escalating armor, aggressive push maneuvers, and heavy support.',
    icon: 'Shield',
    badge: 'Intense',
    color: '#ec4899',
    rules: ['Non-stop enemy reinforcement', 'Aggressive flanking AI', 'Rapid multiplier chains', 'Survive as long as possible']
  },
  {
    id: 'boss_battle',
    name: 'BOSS BATTLE',
    tagline: 'Confront Titan-Warlord Kairos',
    description: 'A colossal 3.5m cybernetic titan equipped with dual Vulcan cannons, shoulder rocket pods, and kinetic shockwave stomps. Aim for the glowing core!',
    icon: 'Skull',
    badge: 'Epic Boss',
    color: '#dc2626',
    rules: ['Towering 3-Phase Boss', 'Glowing core weak point (2.5x damage)', 'Vulcan & Rocket barrage attacks', 'Kinetic shockwave stomp']
  }
];

// --- MAP ENVIRONMENTS ---
export type MapId = 'city_district' | 'warehouse' | 'training_range' | 'rooftops' | 'desert_outpost';

export interface MapInfo {
  id: MapId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  color: string;
}

export const GAME_MAPS: MapInfo[] = [
  {
    id: 'city_district',
    name: 'City District',
    tagline: 'Modern urban avenues, skyscrapers, & crosswalks',
    description: 'Bustling metropolis with multi-story office towers, asphalt avenues, pedestrian crossings, parked civilian vehicles, and street lights.',
    badge: 'Urban',
    color: '#3b82f6',
  },
  {
    id: 'warehouse',
    name: 'Industrial Depot',
    tagline: 'Shipping container labyrinth & cargo gantries',
    description: 'Sprawling logistics hub filled with towering stacks of colorful freight containers, cargo crates, forklifts, and industrial floodlights.',
    badge: 'Industrial',
    color: '#f97316',
  },
  {
    id: 'training_range',
    name: 'Tactical Firing Range',
    tagline: 'Dedicated distance lanes & moving targets',
    description: 'Military proving ground featuring marked shooting bays, distance markers from 10m to 100m, motorized target tracks, and sand barriers.',
    badge: 'Range',
    color: '#8b5cf6',
  },
  {
    id: 'rooftops',
    name: 'Skyline Rooftops',
    tagline: 'High-altitude building rooftops & cover',
    description: 'Elevated combat arena atop skyscrapers with HVAC ventilation units, water towers, solar arrays, satellite dishes, and parapet walls.',
    badge: 'High Ground',
    color: '#06b6d4',
  },
  {
    id: 'desert_outpost',
    name: 'Desert FOB Outpost',
    tagline: 'Sun-baked military base & sandbag nests',
    description: 'Remote forward operating base in arid canyon terrain with sandbag bunkers, military watchtowers, camouflage netting, and military transports.',
    badge: 'Military',
    color: '#eab308',
  },
];

// --- COVER & OBSTACLE TYPES ---
export interface CoverObstacle {
  id: string;
  box: THREE.Box3;
  type: 'building' | 'car' | 'barrier' | 'crate' | 'dumpster' | 'tree' | 'pillar' | 'boundary';
  center: THREE.Vector3;
  size: THREE.Vector3;
  canShootThrough?: boolean;
}

// --- PROJECTILES & PARTICLES ---
export interface Projectile {
  id: number;
  startPos: THREE.Vector3;
  currentPos: THREE.Vector3;
  prevPos: THREE.Vector3;
  velocity: THREE.Vector3;
  distanceTraveled: number;
  maxDistance: number;
  damage: number;
  headshotMultiplier: number;
  owner: 'player' | 'ally' | 'enemy';
  ownerId?: number;
  isExplosive?: boolean;
  blastRadius?: number;
  color: string;
  mesh?: THREE.Object3D;
}

export interface ParticleEffect {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'smoke' | 'spark' | 'blood' | 'muzzle' | 'explosion';
}

export interface PickupItem {
  id: number;
  type: 'health' | 'armor' | 'ammo';
  position: THREE.Vector3;
  active: boolean;
  respawnTime: number;
  mesh?: THREE.Object3D;
}

// --- ENEMY AI STATE ---
export type EnemyType = 'soldier' | 'scout' | 'heavy' | 'sniper' | 'boss';
export type EnemyAIState = 'patrol' | 'alert' | 'combat' | 'cover' | 'dead';

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  team: 'enemy' | 'ally';
  name: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  pitch: number;
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  speed: number;
  weapon: WeaponId;
  aiState: EnemyAIState;
  stateTimer: number;
  patrolPoints: THREE.Vector3[];
  currentPatrolIdx: number;
  targetPos: THREE.Vector3 | null;
  lastSeenPlayerPos: THREE.Vector3 | null;
  lastFireTime: number;
  fireCooldown: number;
  accuracy: number;
  detectionRange: number;
  isDead: boolean;
  deathTimer: number;
  meshGroup?: THREE.Group;
  isBoss?: boolean;
  bossPhase?: number;
  bossShield?: number;
  bossMaxShield?: number;
  specialAttackTimer?: number;
  animState: {
    walkTime: number;
    isMoving: boolean;
    isAiming: boolean;
    hitFlinch: number;
    deathFallProgress: number;
  };
}

// --- TARGET PRACTICE ENTITY ---
export interface PracticeTarget {
  id: number;
  position: THREE.Vector3;
  initialPos: THREE.Vector3;
  health: number;
  maxHealth: number;
  distance: number;
  moveSpeed: number;
  moveRange: number;
  isHit: boolean;
  hitTimer: number;
  isBullseye?: boolean;
  mesh?: THREE.Object3D;
}
