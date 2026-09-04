import * as THREE from 'three';
import {
  CoverObstacle,
  EnemyEntity,
  ParticleEffect,
  PickupItem,
  PracticeTarget,
  Projectile,
  WeaponData,
  WeaponId,
  WEAPON_REGISTRY,
} from './types';
import { FPSAudioEngine } from './FPSAudioEngine';

export class FPSPhysicsEngine {
  /**
   * Resolves cylinder/box player collision against all environment cover obstacles
   */
  public static resolvePlayerMovement(
    currentPos: THREE.Vector3,
    velocity: THREE.Vector3,
    delta: number,
    obstacles: CoverObstacle[],
    playerRadius = 0.45,
    playerHeight = 1.8,
    isGrounded: boolean
  ): { newPos: THREE.Vector3; newVel: THREE.Vector3; grounded: boolean } {
    const nextPos = currentPos.clone().add(velocity.clone().multiplyScalar(delta));

    // Gravity
    if (!isGrounded) {
      velocity.y -= 22 * delta; // Gravity acceleration
    }

    // Floor collision
    let grounded = false;
    if (nextPos.y <= 0) {
      nextPos.y = 0;
      velocity.y = 0;
      grounded = true;
    }

    // Obstacle Box-Cylinder Collision
    const playerMin = new THREE.Vector3();
    const playerMax = new THREE.Vector3();

    for (const obs of obstacles) {
      playerMin.set(nextPos.x - playerRadius, nextPos.y, nextPos.z - playerRadius);
      playerMax.set(nextPos.x + playerRadius, nextPos.y + playerHeight, nextPos.z + playerRadius);
      const playerBox = new THREE.Box3(playerMin, playerMax);

      if (playerBox.intersectsBox(obs.box)) {
        // Step-up mechanic for low curbs/sidewalks (< 0.35m)
        const stepHeight = obs.box.max.y - currentPos.y;
        if (stepHeight > 0 && stepHeight <= 0.35 && currentPos.y >= obs.box.min.y) {
          nextPos.y = obs.box.max.y;
          velocity.y = 0;
          grounded = true;
          continue;
        }

        // Horizontal penetration resolution
        const overlapX = Math.min(playerMax.x - obs.box.min.x, obs.box.max.x - playerMin.x);
        const overlapZ = Math.min(playerMax.z - obs.box.min.z, obs.box.max.z - playerMin.z);

        if (overlapX < overlapZ) {
          if (currentPos.x < obs.center.x) {
            nextPos.x = obs.box.min.x - playerRadius;
          } else {
            nextPos.x = obs.box.max.x + playerRadius;
          }
          velocity.x = 0;
        } else {
          if (currentPos.z < obs.center.z) {
            nextPos.z = obs.box.min.z - playerRadius;
          } else {
            nextPos.z = obs.box.max.z + playerRadius;
          }
          velocity.z = 0;
        }
      }
    }

    // Map boundary clamp
    nextPos.x = Math.max(-88, Math.min(88, nextPos.x));
    nextPos.z = Math.max(-88, Math.min(88, nextPos.z));

    return { newPos: nextPos, newVel: velocity, grounded };
  }

  /**
   * Computes the Third-Person Camera position with smooth tracking and obstacle anti-clip
   */
  public static calculateThirdPersonCamera(
    playerPos: THREE.Vector3,
    yaw: number,
    pitch: number,
    isAiming: boolean,
    isCrouching: boolean,
    obstacles: CoverObstacle[]
  ): { cameraPos: THREE.Vector3; lookAtPos: THREE.Vector3 } {
    // Character eye center
    const eyeHeight = isCrouching ? 1.1 : 1.65;
    const focusTarget = playerPos.clone().add(new THREE.Vector3(0, eyeHeight, 0));

    // Direction vector from angles
    const forward = new THREE.Vector3(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    ).normalize();

    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Camera offset parameters
    // Standard TPS: 3.2m behind, 0.45m to the right shoulder, 0.25m above
    // ADS Aiming: 1.6m behind, 0.55m to the right, tighter over the shoulder
    const dist = isAiming ? 1.5 : 3.2;
    const sideOffset = isAiming ? 0.55 : 0.45;
    const heightOffset = isAiming ? 0.05 : 0.25;

    // Desired camera position
    const desiredCamPos = focusTarget
      .clone()
      .add(right.clone().multiplyScalar(sideOffset))
      .add(up.clone().multiplyScalar(heightOffset))
      .sub(forward.clone().multiplyScalar(dist));

    // Raycast anti-clipping against city obstacles
    const rayOrigin = focusTarget.clone();
    const rayDir = desiredCamPos.clone().sub(rayOrigin);
    const maxRayDist = rayDir.length();
    rayDir.normalize();

    const ray = new THREE.Ray(rayOrigin, rayDir);
    let closestHitDist = maxRayDist;

    for (const obs of obstacles) {
      if (obs.type === 'boundary' || obs.type === 'building' || obs.type === 'car' || obs.type === 'crate') {
        const hitPoint = new THREE.Vector3();
        if (ray.intersectBox(obs.box, hitPoint)) {
          const hitDist = hitPoint.distanceTo(rayOrigin);
          if (hitDist < closestHitDist) {
            closestHitDist = Math.max(0.6, hitDist - 0.25); // Buffer away from wall
          }
        }
      }
    }

    const actualCamPos = rayOrigin.clone().add(rayDir.multiplyScalar(closestHitDist));

    // Look at point slightly in front of character along aim direction
    const lookAtPos = focusTarget.clone().add(forward.clone().multiplyScalar(50));

    return { cameraPos: actualCamPos, lookAtPos };
  }

  /**
   * Fires a weapon (hitscan or projectile)
   */
  public static fireWeapon(
    weaponId: WeaponId,
    muzzlePos: THREE.Vector3,
    aimDir: THREE.Vector3,
    owner: 'player' | 'ally' | 'enemy',
    ownerId: number,
    obstacles: CoverObstacle[],
    enemies: EnemyEntity[],
    playerPos: THREE.Vector3,
    practiceTargets: PracticeTarget[] = [],
    isADS = false
  ): {
    projectiles: Projectile[];
    hitEvents: Array<{
      targetType: 'enemy' | 'player' | 'obstacle' | 'practice_target';
      targetId?: number;
      damage: number;
      isHeadshot: boolean;
      hitPoint: THREE.Vector3;
    }>;
    particles: ParticleEffect[];
  } {
    const wData = WEAPON_REGISTRY[weaponId];
    const projectiles: Projectile[] = [];
    const hitEvents: Array<{
      targetType: 'enemy' | 'player' | 'obstacle' | 'practice_target';
      targetId?: number;
      damage: number;
      isHeadshot: boolean;
      hitPoint: THREE.Vector3;
    }> = [];
    const particles: ParticleEffect[] = [];

    // Muzzle Flash particles
    particles.push({
      position: muzzlePos.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ),
      life: 0.08,
      maxLife: 0.08,
      size: 0.5,
      color: wData.bulletColor,
      type: 'muzzle',
    });

    // Determine shot count (shotgun has multiple pellets)
    const count = wData.pellets || 1;
    const baseSpread = isADS ? wData.spread * wData.aimSpreadMultiplier : wData.spread;

    for (let p = 0; p < count; p++) {
      // Calculate spread jitter
      const spreadX = (Math.random() - 0.5) * baseSpread;
      const spreadY = (Math.random() - 0.5) * baseSpread;
      const shotDir = aimDir.clone();
      const right = new THREE.Vector3().crossVectors(shotDir, new THREE.Vector3(0, 1, 0)).normalize();
      const up = new THREE.Vector3().crossVectors(right, shotDir).normalize();
      shotDir.add(right.multiplyScalar(spreadX)).add(up.multiplyScalar(spreadY)).normalize();

      if (wData.isExplosive) {
        // Physical Rocket Projectile
        projectiles.push({
          id: Math.random(),
          startPos: muzzlePos.clone(),
          currentPos: muzzlePos.clone(),
          prevPos: muzzlePos.clone(),
          velocity: shotDir.clone().multiplyScalar(wData.bulletSpeed),
          distanceTraveled: 0,
          maxDistance: wData.range,
          damage: wData.damage,
          headshotMultiplier: 1.0,
          owner,
          ownerId,
          isExplosive: true,
          blastRadius: wData.blastRadius || 8.0,
          color: wData.bulletColor,
        });
      } else {
        // Instant Hitscan Raycast
        const ray = new THREE.Ray(muzzlePos, shotDir);
        let closestHitDist = wData.range;
        let hitType: 'enemy' | 'player' | 'obstacle' | 'practice_target' | null = null;
        let hitTargetId: number | undefined;
        let isHeadshot = false;
        let hitPoint = muzzlePos.clone().add(shotDir.clone().multiplyScalar(wData.range));

        // Check Obstacles
        for (const obs of obstacles) {
          const pt = new THREE.Vector3();
          if (ray.intersectBox(obs.box, pt)) {
            const dist = pt.distanceTo(muzzlePos);
            if (dist < closestHitDist) {
              closestHitDist = dist;
              hitPoint = pt;
              hitType = 'obstacle';
              hitTargetId = undefined;
            }
          }
        }

        // Check Enemies (if owner is player or ally)
        if (owner === 'player' || owner === 'ally') {
          for (const enemy of enemies) {
            if (enemy.isDead || (owner === 'ally' && enemy.team === 'ally')) continue;

            // Head Box (Headshot detection)
            const headCenter = enemy.position.clone().add(new THREE.Vector3(0, 1.65, 0));
            const headBox = new THREE.Box3().setFromCenterAndSize(headCenter, new THREE.Vector3(0.4, 0.4, 0.4));
            const ptHead = new THREE.Vector3();

            if (ray.intersectBox(headBox, ptHead)) {
              const dist = ptHead.distanceTo(muzzlePos);
              if (dist < closestHitDist) {
                closestHitDist = dist;
                hitPoint = ptHead;
                hitType = 'enemy';
                hitTargetId = enemy.id;
                isHeadshot = true;
              }
            } else {
              // Body Box
              const bodyCenter = enemy.position.clone().add(new THREE.Vector3(0, 0.9, 0));
              const bodyBox = new THREE.Box3().setFromCenterAndSize(bodyCenter, new THREE.Vector3(0.65, 1.4, 0.65));
              const ptBody = new THREE.Vector3();

              if (ray.intersectBox(bodyBox, ptBody)) {
                const dist = ptBody.distanceTo(muzzlePos);
                if (dist < closestHitDist) {
                  closestHitDist = dist;
                  hitPoint = ptBody;
                  hitType = 'enemy';
                  hitTargetId = enemy.id;
                  isHeadshot = false;
                }
              }
            }
          }

          // Check Target Practice Boards
          for (const target of practiceTargets) {
            if (target.isHit) continue;
            const tBox = new THREE.Box3().setFromCenterAndSize(target.position, new THREE.Vector3(1.6, 1.6, 0.4));
            const ptTarget = new THREE.Vector3();

            if (ray.intersectBox(tBox, ptTarget)) {
              const dist = ptTarget.distanceTo(muzzlePos);
              if (dist < closestHitDist) {
                closestHitDist = dist;
                hitPoint = ptTarget;
                hitType = 'practice_target';
                hitTargetId = target.id;
                // Check if bullseye
                isHeadshot = ptTarget.distanceTo(target.position) < 0.35;
              }
            }
          }
        } else if (owner === 'enemy') {
          // Check Player Hitbox
          const pCenter = playerPos.clone().add(new THREE.Vector3(0, 0.9, 0));
          const pBox = new THREE.Box3().setFromCenterAndSize(pCenter, new THREE.Vector3(0.7, 1.8, 0.7));
          const ptPlayer = new THREE.Vector3();

          if (ray.intersectBox(pBox, ptPlayer)) {
            const dist = ptPlayer.distanceTo(muzzlePos);
            if (dist < closestHitDist) {
              closestHitDist = dist;
              hitPoint = ptPlayer;
              hitType = 'player';
              isHeadshot = ptPlayer.y > playerPos.y + 1.45;
            }
          }
        }

        // Add Hit Event
        if (hitType) {
          const dmg = isHeadshot ? wData.damage * wData.headshotMultiplier : wData.damage;
          hitEvents.push({
            targetType: hitType,
            targetId: hitTargetId,
            damage: Math.round(dmg),
            isHeadshot,
            hitPoint,
          });

          // Impact Sparks / Debris Particles
          const particleCount = hitType === 'enemy' || hitType === 'player' ? 6 : 4;
          for (let s = 0; s < particleCount; s++) {
            particles.push({
              position: hitPoint.clone(),
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 3 + 1,
                (Math.random() - 0.5) * 4
              ),
              life: 0.35,
              maxLife: 0.35,
              size: 0.15,
              color: hitType === 'enemy' || hitType === 'player' ? '#ef4444' : '#facc15',
              type: hitType === 'enemy' || hitType === 'player' ? 'blood' : 'spark',
            });
          }
        }
      }
    }

    return { projectiles, hitEvents, particles };
  }

  /**
   * Updates in-flight rockets and handles explosive detonations
   */
  public static updateProjectiles(
    projectiles: Projectile[],
    delta: number,
    obstacles: CoverObstacle[],
    enemies: EnemyEntity[],
    playerPos: THREE.Vector3
  ): {
    activeProjectiles: Projectile[];
    explosions: Array<{
      position: THREE.Vector3;
      damage: number;
      radius: number;
      owner: 'player' | 'ally' | 'enemy';
    }>;
    particles: ParticleEffect[];
  } {
    const activeProjectiles: Projectile[] = [];
    const explosions: Array<{
      position: THREE.Vector3;
      damage: number;
      radius: number;
      owner: 'player' | 'ally' | 'enemy';
    }> = [];
    const particles: ParticleEffect[] = [];

    for (const proj of projectiles) {
      proj.prevPos.copy(proj.currentPos);
      proj.currentPos.add(proj.velocity.clone().multiplyScalar(delta));
      proj.distanceTraveled += proj.velocity.length() * delta;

      // Rocket smoke trail
      particles.push({
        position: proj.currentPos.clone(),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.5, (Math.random() - 0.5) * 0.5),
        life: 0.45,
        maxLife: 0.45,
        size: 0.35,
        color: '#94a3b8',
        type: 'smoke',
      });

      let detonated = false;

      // Check ground hit
      if (proj.currentPos.y <= 0.1) {
        detonated = true;
        proj.currentPos.y = 0.1;
      }

      // Check max distance
      if (proj.distanceTraveled >= proj.maxDistance) {
        detonated = true;
      }

      // Check obstacle collision
      if (!detonated) {
        for (const obs of obstacles) {
          if (obs.box.containsPoint(proj.currentPos)) {
            detonated = true;
            break;
          }
        }
      }

      // Check Enemy collision
      if (!detonated && (proj.owner === 'player' || proj.owner === 'ally')) {
        for (const enemy of enemies) {
          if (enemy.isDead) continue;
          if (proj.currentPos.distanceTo(enemy.position.clone().add(new THREE.Vector3(0, 0.9, 0))) < 1.2) {
            detonated = true;
            break;
          }
        }
      }

      // Check Player collision
      if (!detonated && proj.owner === 'enemy') {
        if (proj.currentPos.distanceTo(playerPos.clone().add(new THREE.Vector3(0, 0.9, 0))) < 1.2) {
          detonated = true;
        }
      }

      if (detonated) {
        // Trigger Explosion
        explosions.push({
          position: proj.currentPos.clone(),
          damage: proj.damage,
          radius: proj.blastRadius || 8.0,
          owner: proj.owner,
        });

        FPSAudioEngine.playExplosion();

        // Explosion Particles
        for (let i = 0; i < 20; i++) {
          particles.push({
            position: proj.currentPos.clone(),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 12,
              Math.random() * 8 + 2,
              (Math.random() - 0.5) * 12
            ),
            life: 0.65,
            maxLife: 0.65,
            size: Math.random() * 1.2 + 0.4,
            color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
            type: 'explosion',
          });
        }
      } else {
        activeProjectiles.push(proj);
      }
    }

    return { activeProjectiles, explosions, particles };
  }

  /**
   * Applies area-of-effect blast damage to enemies and player
   */
  public static resolveExplosionDamage(
    explosion: { position: THREE.Vector3; damage: number; radius: number; owner: string },
    enemies: EnemyEntity[],
    playerPos: THREE.Vector3,
    onPlayerDamage: (dmg: number) => void,
    onEnemyDamage: (enemyId: number, dmg: number) => void
  ): void {
    // Enemies
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      const enemyCenter = enemy.position.clone().add(new THREE.Vector3(0, 0.9, 0));
      const dist = explosion.position.distanceTo(enemyCenter);
      if (dist <= explosion.radius) {
        const falloff = 1 - dist / explosion.radius;
        const dmg = Math.round(explosion.damage * falloff);
        onEnemyDamage(enemy.id, dmg);
      }
    }

    // Player
    const pCenter = playerPos.clone().add(new THREE.Vector3(0, 0.9, 0));
    const distToP = explosion.position.distanceTo(pCenter);
    if (distToP <= explosion.radius) {
      const falloff = 1 - distToP / explosion.radius;
      const dmg = Math.round(explosion.damage * falloff * 0.75); // slight self-damage resistance
      onPlayerDamage(dmg);
    }
  }

  /**
   * Advanced Enemy AI behavior updates
   */
  public static updateEnemyAI(
    enemy: EnemyEntity,
    delta: number,
    playerPos: THREE.Vector3,
    playerDead: boolean,
    obstacles: CoverObstacle[],
    currentTime: number,
    onEnemyFire: (enemy: EnemyEntity, aimDir: THREE.Vector3) => void
  ): void {
    if (enemy.isDead) {
      enemy.deathTimer += delta;
      enemy.animState.deathFallProgress = Math.min(1, enemy.deathTimer / 0.6);
      return;
    }

    // Hit flinch decay
    if (enemy.animState.hitFlinch > 0) {
      enemy.animState.hitFlinch = Math.max(0, enemy.animState.hitFlinch - delta * 3);
    }

    const distToPlayer = enemy.position.distanceTo(playerPos);
    let canSeePlayer = false;

    // Line of sight check
    if (!playerDead && distToPlayer <= enemy.detectionRange) {
      const eyePos = enemy.position.clone().add(new THREE.Vector3(0, 1.6, 0));
      const targetEye = playerPos.clone().add(new THREE.Vector3(0, 1.5, 0));
      const rayDir = targetEye.clone().sub(eyePos);
      const totalDist = rayDir.length();
      rayDir.normalize();

      const losRay = new THREE.Ray(eyePos, rayDir);
      let blocked = false;

      for (const obs of obstacles) {
        const pt = new THREE.Vector3();
        if (losRay.intersectBox(obs.box, pt)) {
          if (pt.distanceTo(eyePos) < totalDist - 0.5) {
            blocked = true;
            break;
          }
        }
      }

      canSeePlayer = !blocked;
    }

    // AI State Transitions
    if (canSeePlayer) {
      enemy.aiState = 'combat';
      enemy.lastSeenPlayerPos = playerPos.clone();
    } else if (enemy.lastSeenPlayerPos && enemy.aiState === 'combat') {
      enemy.aiState = 'alert';
    }

    // Movement & Combat execution
    let moveTarget: THREE.Vector3 | null = null;
    let isShooting = false;

    switch (enemy.aiState) {
      case 'patrol': {
        // Move between patrol waypoints
        if (enemy.patrolPoints.length > 0) {
          const currentWp = enemy.patrolPoints[enemy.currentPatrolIdx];
          if (enemy.position.distanceTo(currentWp) < 1.5) {
            enemy.currentPatrolIdx = (enemy.currentPatrolIdx + 1) % enemy.patrolPoints.length;
          }
          moveTarget = enemy.patrolPoints[enemy.currentPatrolIdx];
        }
        break;
      }

      case 'alert': {
        // Move towards last seen player position
        if (enemy.lastSeenPlayerPos) {
          moveTarget = enemy.lastSeenPlayerPos;
          if (enemy.position.distanceTo(enemy.lastSeenPlayerPos) < 2.0) {
            enemy.lastSeenPlayerPos = null;
            enemy.aiState = 'patrol';
          }
        }
        break;
      }

      case 'combat': {
        // Combat engagement
        // Rotate towards player
        const toPlayer = playerPos.clone().sub(enemy.position);
        enemy.yaw = Math.atan2(-toPlayer.x, -toPlayer.z);

        // Optimal combat distance depends on weapon/type
        const desiredDist = enemy.type === 'sniper' ? 35 : enemy.type === 'heavy' ? 12 : 18;

        if (distToPlayer > desiredDist + 3) {
          // Advance towards player
          moveTarget = playerPos;
        } else if (distToPlayer < desiredDist - 4) {
          // Tactical retreat
          moveTarget = enemy.position.clone().sub(toPlayer.clone().normalize().multiplyScalar(4));
        } else {
          // Tactical strafing
          const strafeDir = new THREE.Vector3(Math.cos(currentTime * 1.5), 0, Math.sin(currentTime * 1.5));
          moveTarget = enemy.position.clone().add(strafeDir.multiplyScalar(3));
        }

        // Fire weapon when ready
        if (canSeePlayer && currentTime - enemy.lastFireTime >= enemy.fireCooldown) {
          isShooting = true;
          enemy.lastFireTime = currentTime;

          // Add aiming inaccuracy
          const aimJitter = (1 - enemy.accuracy) * 0.12;
          const aimDir = playerPos
            .clone()
            .add(new THREE.Vector3(0, 1.2, 0))
            .sub(enemy.position.clone().add(new THREE.Vector3(0, 1.4, 0)))
            .normalize();

          aimDir.x += (Math.random() - 0.5) * aimJitter;
          aimDir.y += (Math.random() - 0.5) * aimJitter;
          aimDir.z += (Math.random() - 0.5) * aimJitter;
          aimDir.normalize();

          onEnemyFire(enemy, aimDir);
        }
        break;
      }
    }

    // Execute Move
    let isMoving = false;
    if (moveTarget) {
      const moveDir = moveTarget.clone().sub(enemy.position);
      moveDir.y = 0;
      if (moveDir.length() > 0.4) {
        moveDir.normalize();
        const moveSpeed = enemy.aiState === 'combat' ? enemy.speed * 0.9 : enemy.speed * 0.6;
        enemy.velocity.x = moveDir.x * moveSpeed;
        enemy.velocity.z = moveDir.z * moveSpeed;

        if (enemy.aiState !== 'combat') {
          enemy.yaw = Math.atan2(-moveDir.x, -moveDir.z);
        }

        const moveRes = this.resolvePlayerMovement(
          enemy.position,
          enemy.velocity,
          delta,
          obstacles,
          0.45,
          1.8,
          true
        );
        enemy.position.copy(moveRes.newPos);
        isMoving = true;
      }
    }

    enemy.animState.isMoving = isMoving;
    enemy.animState.isAiming = isShooting || enemy.aiState === 'combat';
    if (isMoving) {
      enemy.animState.walkTime += delta;
    }
  }
}
