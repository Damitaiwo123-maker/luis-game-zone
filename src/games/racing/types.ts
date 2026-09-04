import * as THREE from 'three';

export type CarArchetypeId = 'speedster' | 'drifter' | 'balanced' | 'heavy';

export interface CarStats {
  speed: number;       // 1 - 10
  accel: number;       // 1 - 10
  handling: number;    // 1 - 10
  drift: number;       // 1 - 10
  boost: number;       // 1 - 10
}

export interface CarModel {
  id: CarArchetypeId;
  name: string;
  categoryName: string; // 'Speedster' | 'Drifter' | 'Balanced' | 'Heavy Racer'
  description: string;
  badge: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  stripeColor: string;
  cockpitGlassColor: string;
  tailLightColor: string;
  spoilerStyle: 'gt_wing' | 'carbon_blade' | 'aerofoil' | 'twin_deck';
  bodyStyle: 'hypercar' | 'tuner' | 'prototype' | 'muscle';
  numberDecal: string;
  stats: CarStats;
  maxSpeedKmh: number;
  accelMultiplier: number;
  handlingMultiplier: number;
  driftBoostMultiplier: number;
  nitroDurationMultiplier: number;
  weightMass: number;
}

export interface TrackWaypoint {
  position: THREE.Vector3;
  width: number;
  curveAngle?: number;
}

export interface TrackConfig {
  id: string;
  name: string;
  subtitle: string;
  theme: 'cyber_metropolis' | 'sunset_canyon' | 'orbital_speedway';
  laps: number;
  difficulty: 'Rookie' | 'Pro' | 'Master';
  roadWidth: number;
  skyColor: number;
  fogColor: number;
  sunColor: number;
  groundColor: number;
  asphaltColor: number;
  rumbleColor1: number;
  rumbleColor2: number;
  barrierColor: number;
  waypoints: [number, number, number][];
}

export interface AIRacerState {
  id: string;
  name: string;
  carModel: CarModel;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  speed: number;
  maxSpeed: number;
  currentWaypointIndex: number;
  lateralOffset: number; // offset from track center line
  lap: number;
  distanceAlongTrack: number;
  wheels: THREE.Mesh[];
  finished: boolean;
  finishTime?: number;
}

export interface Particle3D {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  initialScale: number;
  color: THREE.Color;
}

export const CAR_ARCHETYPES: CarModel[] = [
  {
    id: 'speedster',
    name: 'Apex Speedster',
    categoryName: 'Speedster',
    description: 'Blistering top speed and streamlined aerodynamics for high-speed drafting and long straights.',
    badge: '🚀 High Speed',
    primaryColor: '#e11d48', // Crimson Red
    secondaryColor: '#1e293b',
    accentColor: '#fb7185',
    stripeColor: '#ffffff',
    cockpitGlassColor: '#0284c7',
    tailLightColor: '#ff0055',
    spoilerStyle: 'carbon_blade',
    bodyStyle: 'hypercar',
    numberDecal: '01',
    stats: {
      speed: 9.6,
      accel: 7.8,
      handling: 7.2,
      drift: 7.0,
      boost: 8.8
    },
    maxSpeedKmh: 240,
    accelMultiplier: 1.18,
    handlingMultiplier: 0.98,
    driftBoostMultiplier: 1.1,
    nitroDurationMultiplier: 1.0,
    weightMass: 1.0
  },
  {
    id: 'drifter',
    name: 'Phantom Drifter',
    categoryName: 'Drifter',
    description: 'Precision electronic power-steering and locked differential for tight hairpins and rapid mini-turbo boosts.',
    badge: '⚡ Max Drift',
    primaryColor: '#06b6d4', // Cyan
    secondaryColor: '#0f172a',
    accentColor: '#22d3ee',
    stripeColor: '#facc15',
    cockpitGlassColor: '#38bdf8',
    tailLightColor: '#00f0ff',
    spoilerStyle: 'gt_wing',
    bodyStyle: 'tuner',
    numberDecal: '88',
    stats: {
      speed: 8.4,
      accel: 9.2,
      handling: 9.8,
      drift: 10.0,
      boost: 9.4
    },
    maxSpeedKmh: 215,
    accelMultiplier: 1.35,
    handlingMultiplier: 1.25,
    driftBoostMultiplier: 1.5,
    nitroDurationMultiplier: 1.1,
    weightMass: 0.9
  },
  {
    id: 'balanced',
    name: 'Hyperion GT',
    categoryName: 'Balanced',
    description: 'State-of-the-art hybrid powertrain delivering rock-solid cornering, responsive acceleration, and balanced top speed.',
    badge: '⚖️ All-Rounder',
    primaryColor: '#6366f1', // Indigo Purple
    secondaryColor: '#1e1b4b',
    accentColor: '#a855f7',
    stripeColor: '#ffffff',
    cockpitGlassColor: '#60a5fa',
    tailLightColor: '#c084fc',
    spoilerStyle: 'aerofoil',
    bodyStyle: 'prototype',
    numberDecal: '07',
    stats: {
      speed: 8.8,
      accel: 8.8,
      handling: 8.8,
      drift: 8.6,
      boost: 8.8
    },
    maxSpeedKmh: 228,
    accelMultiplier: 1.22,
    handlingMultiplier: 1.12,
    driftBoostMultiplier: 1.25,
    nitroDurationMultiplier: 1.15,
    weightMass: 1.05
  },
  {
    id: 'heavy',
    name: 'Titan Vanguard',
    categoryName: 'Heavy Racer',
    description: 'Heavyweight reinforced monocoque with mammoth twin turbochargers and high impact collision resistance.',
    badge: '🛡️ Heavy Armor',
    primaryColor: '#f59e0b', // Amber Gold
    secondaryColor: '#1c1917',
    accentColor: '#fbbf24',
    stripeColor: '#18181b',
    cockpitGlassColor: '#fde047',
    tailLightColor: '#ffaa00',
    spoilerStyle: 'twin_deck',
    bodyStyle: 'muscle',
    numberDecal: '99',
    stats: {
      speed: 9.0,
      accel: 8.2,
      handling: 7.4,
      drift: 7.8,
      boost: 9.8
    },
    maxSpeedKmh: 232,
    accelMultiplier: 1.12,
    handlingMultiplier: 0.94,
    driftBoostMultiplier: 1.15,
    nitroDurationMultiplier: 1.45,
    weightMass: 1.4
  }
];

export const RACING_TRACKS: TrackConfig[] = [
  {
    id: 'cyber_metropolis',
    name: 'Neo Tokyo Circuit',
    subtitle: 'High-speed cyberpunk highways amidst towering illuminated skyscrapers.',
    theme: 'cyber_metropolis',
    laps: 3,
    difficulty: 'Rookie',
    roadWidth: 26,
    skyColor: 0x050814,
    fogColor: 0x0a1020,
    sunColor: 0x38bdf8,
    groundColor: 0x040812,
    asphaltColor: 0x1e293b,
    rumbleColor1: 0x6366f1,
    rumbleColor2: 0xec4899,
    barrierColor: 0x818cf8,
    waypoints: [
      [0, 0, 0],
      [0, 0, 180],
      [40, 2, 340],
      [140, 6, 480],
      [280, 8, 560],
      [420, 5, 520],
      [520, 1, 400],
      [540, 0, 240],
      [480, 2, 80],
      [360, 4, -40],
      [220, 3, -120],
      [80, 1, -160],
      [-60, 0, -120],
      [-140, 2, 0],
      [-120, 1, 140],
      [-50, 0, 80]
    ]
  },
  {
    id: 'sunset_canyon',
    name: 'Redline Sunset Ridge',
    subtitle: 'Golden-hour desert speedway with winding hairpins and sweeping cliffside drops.',
    theme: 'sunset_canyon',
    laps: 3,
    difficulty: 'Pro',
    roadWidth: 24,
    skyColor: 0x2e1065,
    fogColor: 0x4c1d95,
    sunColor: 0xf97316,
    groundColor: 0x1c100b,
    asphaltColor: 0x27201c,
    rumbleColor1: 0xf59e0b,
    rumbleColor2: 0xef4444,
    barrierColor: 0xfb923c,
    waypoints: [
      [0, 0, 0],
      [0, 0, 200],
      [-80, 6, 360],
      [-200, 14, 480],
      [-340, 20, 440],
      [-400, 16, 300],
      [-320, 10, 140],
      [-180, 5, 40],
      [-40, 8, -80],
      [120, 15, -160],
      [280, 18, -120],
      [380, 12, 20],
      [340, 6, 180],
      [220, 2, 260],
      [100, 0, 160]
    ]
  },
  {
    id: 'orbital_speedway',
    name: 'Orbital Zenith Grand Prix',
    subtitle: 'Zero-gravity planetary ring raceway featuring extreme elevation drops and neon speed tunnels.',
    theme: 'orbital_speedway',
    laps: 3,
    difficulty: 'Master',
    roadWidth: 26,
    skyColor: 0x020617,
    fogColor: 0x030712,
    sunColor: 0x06b6d4,
    groundColor: 0x02040a,
    asphaltColor: 0x0f172a,
    rumbleColor1: 0x06b6d4,
    rumbleColor2: 0xa855f7,
    barrierColor: 0x38bdf8,
    waypoints: [
      [0, 0, 0],
      [0, 0, 220],
      [100, 8, 400],
      [240, 18, 540],
      [420, 24, 580],
      [580, 18, 460],
      [640, 8, 280],
      [560, 0, 100],
      [400, -6, 0],
      [240, -10, -100],
      [60, -8, -180],
      [-120, -4, -220],
      [-260, 2, -160],
      [-320, 8, -20],
      [-240, 6, 140],
      [-100, 2, 100]
    ]
  }
];
