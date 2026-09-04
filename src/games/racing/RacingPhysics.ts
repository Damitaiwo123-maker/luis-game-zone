import * as THREE from 'three';
import { CarModel, TrackConfig, AIRacerState } from './types';
import { BuiltCar } from './ThreeCarBuilder';
import { BuiltTrack } from './ThreeTrackBuilder';

export interface PlayerPhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;             // Heading angle in radians
  pitch: number;
  roll: number;
  speed: number;           // Current forward speed (units / sec)
  speedKmh: number;        // Converted for HUD display
  steerAngle: number;      // Front wheels steering angle
  isDrifting: boolean;
  driftAngle: number;
  driftCharge: number;     // 0 to 1
  isBoosting: boolean;
  nitroFuel: number;       // 0 to 100
  boostTimer: number;
  currentLap: number;
  currentCheckpoint: number;
  totalDistanceCovered: number;
  lapTimes: number[];
  currentLapStartTime: number;
  bestLapTime: number | null;
  raceFinished: boolean;
  finishTime: number | null;
  crashImpact: number;     // Decays to 0, triggers visual shake and sound
  collectedCoins: number;
  score: number;
}

export class RacingPhysics {
  /**
   * Updates player car physics based on keyboard / touch inputs, track constraints, and car archetype stats.
   */
  public static updatePlayer(
    dt: number,
    state: PlayerPhysicsState,
    inputs: { forward: boolean; backward: boolean; left: boolean; right: boolean; drift: boolean; nitro: boolean },
    car: CarModel,
    track: BuiltTrack,
    onCrash: () => void,
    onDriftBoost: () => void,
    onCoinCollected: () => void,
    onLapComplete: (lap: number) => void
  ): void {
    if (state.raceFinished) {
      // Decelerate to stop smoothly
      state.speed *= Math.max(0, 1 - dt * 2.0);
      state.position.addScaledVector(new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw)), state.speed * dt);
      state.speedKmh = Math.round(state.speed * 3.6);
      return;
    }

    // 1. NITRO BOOST HANDLING
    let maxSpeed = car.maxSpeedKmh / 3.6; // Convert km/h to units/sec
    let accelRate = 22 * car.accelMultiplier;

    if (inputs.nitro && state.nitroFuel > 0 && state.speed > 5) {
      state.isBoosting = true;
      state.nitroFuel = Math.max(0, state.nitroFuel - dt * 28);
      maxSpeed *= 1.35;
      accelRate *= 1.8;
    } else if (state.boostTimer > 0) {
      state.isBoosting = true;
      state.boostTimer -= dt;
      maxSpeed *= 1.25;
      accelRate *= 1.5;
    } else {
      state.isBoosting = false;
      // Passive nitro refill
      state.nitroFuel = Math.min(100, state.nitroFuel + dt * 6);
    }

    // 2. ACCELERATION & BRAKING
    if (inputs.forward) {
      if (state.speed < maxSpeed) {
        state.speed += accelRate * dt;
      }
    } else if (inputs.backward) {
      if (state.speed > 0) {
        // Braking
        state.speed = Math.max(0, state.speed - 36 * dt);
      } else {
        // Reverse
        state.speed = Math.max(-18, state.speed - 14 * dt);
      }
    } else {
      // Natural rolling friction & aerodynamic drag
      const drag = 0.0015 * state.speed * state.speed;
      const friction = 5.0;
      if (state.speed > 0) {
        state.speed = Math.max(0, state.speed - (friction + drag) * dt);
      } else if (state.speed < 0) {
        state.speed = Math.min(0, state.speed + friction * dt);
      }
    }

    // 3. STEERING & DRIFTING MECHANICS
    let turnInput = 0;
    if (inputs.left) turnInput += 1;
    if (inputs.right) turnInput -= 1;

    // Target front wheel steering angle
    const targetSteer = turnInput * 0.45;
    state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1, dt * 14);

    // Drifting state
    if (inputs.drift && Math.abs(turnInput) > 0 && state.speed > 18) {
      state.isDrifting = true;
      const driftSign = turnInput > 0 ? 1 : -1;
      state.driftAngle += (driftSign * 0.38 - state.driftAngle) * dt * 5;
      state.driftCharge = Math.min(1.0, state.driftCharge + dt * 0.8 * car.driftBoostMultiplier);
      state.speed *= (1 - dt * 0.08); // Slight speed scrub during drift
    } else {
      if (state.isDrifting && state.driftCharge > 0.4) {
        // Trigger Mini-Turbo Boost reward upon exiting drift!
        state.boostTimer = 1.4 * (state.driftCharge);
        onDriftBoost();
      }
      state.isDrifting = false;
      state.driftAngle *= (1 - dt * 10);
      state.driftCharge = 0;
    }

    // Steering rate scales with speed (high-speed stability vs low-speed turning)
    if (Math.abs(state.speed) > 0.5) {
      const speedFactor = Math.min(1.2, Math.max(0.35, 1.0 - (state.speed / maxSpeed) * 0.45));
      const driftTurnMultiplier = state.isDrifting ? 1.45 : 1.0;
      const yawDelta = turnInput * 2.2 * car.handlingMultiplier * speedFactor * driftTurnMultiplier * dt;
      const moveSign = state.speed >= 0 ? 1 : -1;
      state.yaw += yawDelta * moveSign;
    }

    // 4. POSITION INTEGRATION
    const effectiveYaw = state.yaw + state.driftAngle;
    const forwardDir = new THREE.Vector3(Math.sin(effectiveYaw), 0, Math.cos(effectiveYaw));
    const deltaMove = new THREE.Vector3().copy(forwardDir).multiplyScalar(state.speed * dt);
    state.position.add(deltaMove);
    state.speedKmh = Math.round(Math.abs(state.speed) * 3.6);

    // 5. TRACK CONSTRAINTS & BARRIER COLLISION
    const closestU = track.curve.getUtoTmapping(0, 0); // Helper
    // Sample closest point along track
    const sampleP = track.curve.getPointAt(state.currentCheckpoint / track.checkpoints.length);
    const halfWidth = track.roadWidth / 2;

    // Find distance from track centerline
    let minDistance = Infinity;
    let closestPoint = track.curve.getPointAt(0);
    let closestTangent = new THREE.Vector3(0, 0, 1);
    let closestUVal = 0;

    // Fast search near current progress
    const searchStep = 1 / 100;
    const centerU = state.currentCheckpoint / track.checkpoints.length;
    for (let du = -0.08; du <= 0.08; du += searchStep) {
      let testU = (centerU + du + 1) % 1;
      const p = track.curve.getPointAt(testU);
      const d = p.distanceTo(state.position);
      if (d < minDistance) {
        minDistance = d;
        closestPoint = p;
        closestTangent = track.curve.getTangentAt(testU);
        closestUVal = testU;
      }
    }

    // Road height elevation tracking
    state.position.y += (closestPoint.y + 0.05 - state.position.y) * Math.min(1, dt * 10);

    // Lateral distance check from center
    const toCar = new THREE.Vector3().subVectors(state.position, closestPoint);
    toCar.y = 0;
    const trackUp = new THREE.Vector3(0, 1, 0);
    const trackRight = new THREE.Vector3().crossVectors(closestTangent, trackUp).normalize();
    const lateralDist = toCar.dot(trackRight);

    // Barrier boundary collision
    const barrierLimit = halfWidth + 1.2;
    if (Math.abs(lateralDist) > barrierLimit) {
      const pushSign = lateralDist > 0 ? 1 : -1;
      // Repel back inside
      state.position.sub(new THREE.Vector3().copy(trackRight).multiplyScalar((Math.abs(lateralDist) - barrierLimit) * pushSign));
      // Bounce and lose speed
      state.speed *= 0.55;
      state.crashImpact = 1.0;
      onCrash();
    }

    // 6. CHECKPOINT & LAP TRACKING
    const nextCpIdx = (state.currentCheckpoint + 1) % track.checkpoints.length;
    const nextCp = track.checkpoints[nextCpIdx];
    const distToNextCp = state.position.distanceTo(nextCp.position);

    if (distToNextCp < track.roadWidth * 1.2) {
      state.currentCheckpoint = nextCpIdx;
      if (nextCpIdx === 0) {
        // Completed a full lap!
        const lapTime = (performance.now() - state.currentLapStartTime) / 1000;
        state.lapTimes.push(lapTime);
        if (!state.bestLapTime || lapTime < state.bestLapTime) {
          state.bestLapTime = lapTime;
        }
        state.currentLapStartTime = performance.now();

        if (state.currentLap >= 3) {
          state.raceFinished = true;
          state.finishTime = state.lapTimes.reduce((a, b) => a + b, 0);
        } else {
          state.currentLap += 1;
          onLapComplete(state.currentLap);
        }
      }
    }

    // 7. BOOST PADS INTERACTION
    for (let bp of track.boostPads) {
      if (state.position.distanceTo(bp.position) < 4.0) {
        state.boostTimer = 1.8;
        state.speed = Math.max(state.speed, maxSpeed * 1.2);
        onDriftBoost();
      }
    }

    // 8. COIN COLLECTIBLES INTERACTION
    for (let coin of track.coins) {
      if (!coin.collected && state.position.distanceTo(coin.position) < 3.2) {
        coin.collected = true;
        coin.mesh.visible = false;
        state.collectedCoins += 1;
        state.score += 250;
        state.nitroFuel = Math.min(100, state.nitroFuel + 25);
        onCoinCollected();
      }
    }
  }

  /**
   * Updates AI racers along the 3D track curve with smart overtaking, curve braking, and wheel animation.
   */
  public static updateAIRacers(
    dt: number,
    aiRacers: AIRacerState[],
    track: BuiltTrack,
    playerPosition: THREE.Vector3
  ): void {
    const totalLength = track.trackLength;

    for (let ai of aiRacers) {
      if (ai.finished) {
        ai.speed *= Math.max(0, 1 - dt * 2.0);
        continue;
      }

      // Progress along track curve
      const uCurrent = (ai.distanceAlongTrack % totalLength) / totalLength;
      const currentPos = track.curve.getPointAt(uCurrent);
      const tangent = track.curve.getTangentAt(uCurrent);
      const up = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      // Determine curvature ahead to simulate AI braking on tight hairpins
      const uAhead = ((ai.distanceAlongTrack + 30) % totalLength) / totalLength;
      const tangentAhead = track.curve.getTangentAt(uAhead);
      const curveAngle = Math.abs(tangent.angleTo(tangentAhead));

      let targetSpeed = (ai.carModel.maxSpeedKmh / 3.6) * 0.92;
      if (curveAngle > 0.3) {
        // Slow down for corner
        targetSpeed *= 0.65;
      }

      // Smooth acceleration / braking
      if (ai.speed < targetSpeed) {
        ai.speed += 18 * dt;
      } else {
        ai.speed -= 22 * dt;
      }

      ai.distanceAlongTrack += ai.speed * dt;

      // Track position with lateral offset for realistic racing lanes
      const newU = (ai.distanceAlongTrack % totalLength) / totalLength;
      const trackPoint = track.curve.getPointAt(newU);
      const newTangent = track.curve.getTangentAt(newU);
      const newBinormal = new THREE.Vector3().crossVectors(newTangent, up).normalize();

      ai.position.copy(trackPoint).addScaledVector(newBinormal, ai.lateralOffset);
      ai.position.y = trackPoint.y + 0.05;

      // AI Heading yaw
      ai.yaw = Math.atan2(newTangent.x, newTangent.z);
      ai.group.position.copy(ai.position);
      ai.group.rotation.y = ai.yaw;

      // Spin AI wheels
      for (let w of ai.wheels) {
        w.rotation.x += (ai.speed / 0.38) * dt;
      }

      // Check lap completion
      const currentLap = Math.floor(ai.distanceAlongTrack / totalLength) + 1;
      if (currentLap > 3 && !ai.finished) {
        ai.finished = true;
        ai.lap = 3;
      } else {
        ai.lap = Math.min(3, currentLap);
      }
    }
  }

  /**
   * Resolves bumper collision between player and AI cars.
   */
  public static resolveCarCollisions(
    playerState: PlayerPhysicsState,
    aiRacers: AIRacerState[],
    onBump: () => void
  ): void {
    const collisionDist = 2.6;

    for (let ai of aiRacers) {
      const dist = playerState.position.distanceTo(ai.position);
      if (dist < collisionDist) {
        // Collision vector
        const pushDir = new THREE.Vector3().subVectors(playerState.position, ai.position).normalize();
        pushDir.y = 0;

        // Push player and AI apart
        const overlap = collisionDist - dist;
        playerState.position.addScaledVector(pushDir, overlap * 0.6);
        ai.position.addScaledVector(pushDir, -overlap * 0.4);

        // Momentum exchange
        playerState.speed *= 0.82;
        ai.speed *= 0.85;

        onBump();
      }
    }
  }
}
