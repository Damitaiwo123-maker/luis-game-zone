import * as THREE from 'three';
import { TrackConfig } from './types';

export interface BuiltTrack {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  trackLength: number;
  roadWidth: number;
  checkpoints: { position: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; index: number; distance: number }[];
  boostPads: { position: THREE.Vector3; mesh: THREE.Mesh; box: THREE.Box3 }[];
  coins: { position: THREE.Vector3; mesh: THREE.Mesh; collected: boolean }[];
  sampleCount: number;
}

export class ThreeTrackBuilder {
  /**
   * Generates a full continuous 3D circuit mesh with asphalt road, rumble kerbs,
   * guardrails, start gantry, checkpoints, 3D buildings, grandstands, trees, streetlights, and boost pads.
   */
  public static buildTrack(config: TrackConfig): BuiltTrack {
    const group = new THREE.Group();
    group.name = `Track_${config.name}`;

    // Convert config waypoints to THREE.Vector3 array
    const points = config.waypoints.map(w => new THREE.Vector3(w[0], w[1], w[2]));
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
    const trackLength = curve.getLength();
    const roadWidth = config.roadWidth;
    const halfWidth = roadWidth / 2;

    const sampleCount = 400;
    const roadPoints: { pos: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; binormal: THREE.Vector3 }[] = [];

    // Precalculate sampled curve frames (Frenet frames)
    for (let i = 0; i <= sampleCount; i++) {
      const u = i / sampleCount;
      const pos = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const binormal = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      roadPoints.push({ pos, tangent, normal, binormal });
    }

    // ==============================================================
    // 1. ASPHALT ROAD SURFACE MESH
    // ==============================================================
    const roadGeo = new THREE.BufferGeometry();
    const roadVerts: number[] = [];
    const roadNorms: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    for (let i = 0; i <= sampleCount; i++) {
      const p = roadPoints[i];
      const left = new THREE.Vector3().copy(p.pos).addScaledVector(p.binormal, -halfWidth);
      const right = new THREE.Vector3().copy(p.pos).addScaledVector(p.binormal, halfWidth);

      // Left vertex
      roadVerts.push(left.x, left.y + 0.05, left.z);
      roadNorms.push(p.normal.x, p.normal.y, p.normal.z);
      roadUvs.push(0, (i / sampleCount) * 40);

      // Right vertex
      roadVerts.push(right.x, right.y + 0.05, right.z);
      roadNorms.push(p.normal.x, p.normal.y, p.normal.z);
      roadUvs.push(1, (i / sampleCount) * 40);

      if (i < sampleCount) {
        const row1 = i * 2;
        const row2 = (i + 1) * 2;
        roadIndices.push(row1, row1 + 1, row2);
        roadIndices.push(row1 + 1, row2 + 1, row2);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeo.setIndex(roadIndices);

    const roadMat = new THREE.MeshStandardMaterial({
      color: config.asphaltColor,
      roughness: 0.85,
      metalness: 0.15
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // ==============================================================
    // 2. CENTER DASHED LANE LINE
    // ==============================================================
    const dashGeo = new THREE.BufferGeometry();
    const dashVerts: number[] = [];
    const dashIndices: number[] = [];
    let dashIdx = 0;

    for (let i = 0; i < sampleCount; i += 2) {
      const p1 = roadPoints[i];
      const p2 = roadPoints[i + 1];
      const w = 0.3;

      const l1 = new THREE.Vector3().copy(p1.pos).addScaledVector(p1.binormal, -w);
      const r1 = new THREE.Vector3().copy(p1.pos).addScaledVector(p1.binormal, w);
      const l2 = new THREE.Vector3().copy(p2.pos).addScaledVector(p2.binormal, -w);
      const r2 = new THREE.Vector3().copy(p2.pos).addScaledVector(p2.binormal, w);

      dashVerts.push(l1.x, l1.y + 0.07, l1.z);
      dashVerts.push(r1.x, r1.y + 0.07, r1.z);
      dashVerts.push(l2.x, l2.y + 0.07, l2.z);
      dashVerts.push(r2.x, r2.y + 0.07, r2.z);

      dashIndices.push(dashIdx, dashIdx + 1, dashIdx + 2);
      dashIndices.push(dashIdx + 1, dashIdx + 3, dashIdx + 2);
      dashIdx += 4;
    }

    dashGeo.setAttribute('position', new THREE.Float32BufferAttribute(dashVerts, 3));
    dashGeo.setIndex(dashIndices);
    dashGeo.computeVertexNormals();

    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dashMesh = new THREE.Mesh(dashGeo, dashMat);
    group.add(dashMesh);

    // ==============================================================
    // 3. RUMBLE KERBS (Red/White or Neon Strips on left/right borders)
    // ==============================================================
    const kerbWidth = 1.6;
    const kerbMat1 = new THREE.MeshStandardMaterial({ color: config.rumbleColor1, roughness: 0.4 });
    const kerbMat2 = new THREE.MeshStandardMaterial({ color: config.rumbleColor2, roughness: 0.4 });

    const leftKerbGeo1 = new THREE.BufferGeometry();
    const leftKerbGeo2 = new THREE.BufferGeometry();
    const lk1Verts: number[] = [], lk1Indices: number[] = [];
    const lk2Verts: number[] = [], lk2Indices: number[] = [];
    let lk1Count = 0, lk2Count = 0;

    for (let i = 0; i < sampleCount; i++) {
      const p1 = roadPoints[i];
      const p2 = roadPoints[i + 1];
      const isAlt = (Math.floor(i / 2) % 2 === 0);

      // Left Kerb
      const kl1 = new THREE.Vector3().copy(p1.pos).addScaledVector(p1.binormal, -halfWidth - kerbWidth);
      const kr1 = new THREE.Vector3().copy(p1.pos).addScaledVector(p1.binormal, -halfWidth);
      const kl2 = new THREE.Vector3().copy(p2.pos).addScaledVector(p2.binormal, -halfWidth - kerbWidth);
      const kr2 = new THREE.Vector3().copy(p2.pos).addScaledVector(p2.binormal, -halfWidth);

      // Right Kerb
      const rkl1 = new THREE.Vector3().copy(p1.pos).addScaledVector(p1.binormal, halfWidth);
      const rkr1 = new THREE.Vector3().copy(p1.pos).addScaledVector(p1.binormal, halfWidth + kerbWidth);
      const rkl2 = new THREE.Vector3().copy(p2.pos).addScaledVector(p2.binormal, halfWidth);
      const rkr2 = new THREE.Vector3().copy(p2.pos).addScaledVector(p2.binormal, halfWidth + kerbWidth);

      if (isAlt) {
        // Left
        lk1Verts.push(kl1.x, kl1.y + 0.08, kl1.z, kr1.x, kr1.y + 0.08, kr1.z, kl2.x, kl2.y + 0.08, kl2.z, kr2.x, kr2.y + 0.08, kr2.z);
        lk1Indices.push(lk1Count, lk1Count + 1, lk1Count + 2, lk1Count + 1, lk1Count + 3, lk1Count + 2);
        lk1Count += 4;
        // Right
        lk1Verts.push(rkl1.x, rkl1.y + 0.08, rkl1.z, rkr1.x, rkr1.y + 0.08, rkr1.z, rkl2.x, rkl2.y + 0.08, rkl2.z, rkr2.x, rkr2.y + 0.08, rkr2.z);
        lk1Indices.push(lk1Count, lk1Count + 1, lk1Count + 2, lk1Count + 1, lk1Count + 3, lk1Count + 2);
        lk1Count += 4;
      } else {
        // Left
        lk2Verts.push(kl1.x, kl1.y + 0.08, kl1.z, kr1.x, kr1.y + 0.08, kr1.z, kl2.x, kl2.y + 0.08, kl2.z, kr2.x, kr2.y + 0.08, kr2.z);
        lk2Indices.push(lk2Count, lk2Count + 1, lk2Count + 2, lk2Count + 1, lk2Count + 3, lk2Count + 2);
        lk2Count += 4;
        // Right
        lk2Verts.push(rkl1.x, rkl1.y + 0.08, rkl1.z, rkr1.x, rkr1.y + 0.08, rkr1.z, rkl2.x, rkl2.y + 0.08, rkl2.z, rkr2.x, rkr2.y + 0.08, rkr2.z);
        lk2Indices.push(lk2Count, lk2Count + 1, lk2Count + 2, lk2Count + 1, lk2Count + 3, lk2Count + 2);
        lk2Count += 4;
      }
    }

    leftKerbGeo1.setAttribute('position', new THREE.Float32BufferAttribute(lk1Verts, 3));
    leftKerbGeo1.setIndex(lk1Indices);
    leftKerbGeo1.computeVertexNormals();
    group.add(new THREE.Mesh(leftKerbGeo1, kerbMat1));

    leftKerbGeo2.setAttribute('position', new THREE.Float32BufferAttribute(lk2Verts, 3));
    leftKerbGeo2.setIndex(lk2Indices);
    leftKerbGeo2.computeVertexNormals();
    group.add(new THREE.Mesh(leftKerbGeo2, kerbMat2));

    // ==============================================================
    // 4. CONTINUOUS 3D GUARDRAILS & BARRIER POSTS
    // ==============================================================
    const railMat = new THREE.MeshStandardMaterial({
      color: config.barrierColor,
      metalness: 0.8,
      roughness: 0.3
    });

    const railOffset = halfWidth + kerbWidth + 0.5;

    // Build left & right guardrails
    for (let side of [-1, 1]) {
      const railGeo = new THREE.BufferGeometry();
      const rVerts: number[] = [];
      const rIndices: number[] = [];

      for (let i = 0; i <= sampleCount; i++) {
        const p = roadPoints[i];
        const base = new THREE.Vector3().copy(p.pos).addScaledVector(p.binormal, side * railOffset);
        rVerts.push(base.x, base.y + 0.2, base.z);
        rVerts.push(base.x, base.y + 1.2, base.z);

        if (i < sampleCount) {
          const idx1 = i * 2;
          const idx2 = (i + 1) * 2;
          rIndices.push(idx1, idx1 + 1, idx2);
          rIndices.push(idx1 + 1, idx2 + 1, idx2);
        }
      }

      railGeo.setAttribute('position', new THREE.Float32BufferAttribute(rVerts, 3));
      railGeo.setIndex(rIndices);
      railGeo.computeVertexNormals();
      const railMesh = new THREE.Mesh(railGeo, railMat);
      railMesh.castShadow = true;
      group.add(railMesh);
    }

    // Barrier Upright Support Posts (every 10 samples)
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < sampleCount; i += 8) {
      const p = roadPoints[i];
      for (let side of [-1, 1]) {
        const post = new THREE.Mesh(postGeo, postMat);
        const pos = new THREE.Vector3().copy(p.pos).addScaledVector(p.binormal, side * (railOffset + 0.15));
        post.position.set(pos.x, pos.y + 0.7, pos.z);
        post.castShadow = true;
        group.add(post);
      }
    }

    // ==============================================================
    // 5. START / FINISH LINE GANTRY & STARTING GRID
    // ==============================================================
    const startPoint = roadPoints[0];
    const gantryGroup = new THREE.Group();
    gantryGroup.position.copy(startPoint.pos);
    gantryGroup.lookAt(new THREE.Vector3().copy(startPoint.pos).add(startPoint.tangent));

    // Arch Pillars
    const archPillarGeo = new THREE.BoxGeometry(0.8, 8.5, 0.8);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const leftPillar = new THREE.Mesh(archPillarGeo, archMat);
    leftPillar.position.set(-halfWidth - 3, 4.25, 0);
    gantryGroup.add(leftPillar);

    const rightPillar = leftPillar.clone();
    rightPillar.position.x = halfWidth + 3;
    gantryGroup.add(rightPillar);

    // Crossbar Arch
    const crossbarGeo = new THREE.BoxGeometry(roadWidth + 8, 1.8, 1.2);
    const crossbar = new THREE.Mesh(crossbarGeo, archMat);
    crossbar.position.set(0, 8.0, 0);
    gantryGroup.add(crossbar);

    // Glowing Neon Start/Finish Banner
    const bannerGeo = new THREE.BoxGeometry(roadWidth + 4, 1.0, 0.2);
    const bannerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 8.0, 0.65);
    gantryGroup.add(banner);

    // Start Lights (5 Red/Green pods)
    for (let l = -2; l <= 2; l++) {
      const lightPodGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const lightPodMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const lightPod = new THREE.Mesh(lightPodGeo, lightPodMat);
      lightPod.position.set(l * 1.8, 6.8, 0.7);
      gantryGroup.add(lightPod);
    }

    // Checkered Start Line On Track Surface
    const startLineGeo = new THREE.PlaneGeometry(roadWidth, 2.5);
    startLineGeo.rotateX(-Math.PI / 2);
    const startLineMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      emissive: 0x333333
    });
    const startLine = new THREE.Mesh(startLineGeo, startLineMat);
    startLine.position.set(0, 0.08, 0);
    gantryGroup.add(startLine);

    group.add(gantryGroup);

    // ==============================================================
    // 6. CHECKPOINTS FOR RIGOROUS RACE PROGRESS & ANTI-CHEAT
    // ==============================================================
    const numCheckpoints = 24;
    const checkpoints: BuiltTrack['checkpoints'] = [];
    for (let c = 0; c < numCheckpoints; c++) {
      const u = c / numCheckpoints;
      const idx = Math.floor(u * sampleCount);
      const p = roadPoints[idx];
      checkpoints.push({
        position: p.pos.clone(),
        tangent: p.tangent.clone(),
        normal: p.binormal.clone(),
        index: c,
        distance: u * trackLength
      });
    }

    // ==============================================================
    // 7. INTERACTIVE SPEED BOOST PADS & COLLECTIBLE COINS
    // ==============================================================
    const boostPads: BuiltTrack['boostPads'] = [];
    const coins: BuiltTrack['coins'] = [];

    // Place speed boost pads every ~60 samples on straightaways
    const boostPadGeo = new THREE.BoxGeometry(4.5, 0.12, 6.0);
    const boostPadMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.8,
      metalness: 0.9,
      roughness: 0.1
    });

    const boostIndices = [45, 120, 210, 310];
    for (let bi of boostIndices) {
      if (bi < sampleCount) {
        const bp = roadPoints[bi];
        const boostMesh = new THREE.Mesh(boostPadGeo, boostPadMat);
        boostMesh.position.set(bp.pos.x, bp.pos.y + 0.1, bp.pos.z);
        boostMesh.lookAt(new THREE.Vector3().copy(bp.pos).add(bp.tangent));
        group.add(boostMesh);

        const box = new THREE.Box3().setFromObject(boostMesh);
        boostPads.push({ position: bp.pos.clone(), mesh: boostMesh, box });
      }
    }

    // Place collectible gold coins
    const coinGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 16);
    coinGeo.rotateX(Math.PI / 2);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.8,
      metalness: 0.95,
      roughness: 0.1
    });

    const coinIndices = [25, 75, 160, 260, 350];
    for (let ci of coinIndices) {
      if (ci < sampleCount) {
        const cp = roadPoints[ci];
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.position.set(cp.pos.x, cp.pos.y + 1.2, cp.pos.z);
        group.add(coinMesh);
        coins.push({ position: cp.pos.clone(), mesh: coinMesh, collected: false });
      }
    }

    // ==============================================================
    // 8. 3D SCENERY: BUILDINGS, GRANDSTANDS, TREES & STREETLIGHTS
    // ==============================================================
    // Ground Terrain Plane
    const groundGeo = new THREE.PlaneGeometry(2400, 2400, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: config.groundColor,
      roughness: 0.95,
      metalness: 0.05
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -0.5;
    groundMesh.receiveShadow = true;
    group.add(groundMesh);

    // Track Scenery Objects
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3f2e1e, roughness: 0.9 });
    const treeLeavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const grandstandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });

    // Place scenery items along track perimeter
    for (let i = 0; i < sampleCount; i += 12) {
      const p = roadPoints[i];
      const side = (i % 24 === 0) ? 1 : -1;
      const dist = halfWidth + 16 + (Math.sin(i * 0.7) * 8);
      const sceneryPos = new THREE.Vector3().copy(p.pos).addScaledVector(p.binormal, side * dist);

      if (config.theme === 'cyber_metropolis') {
        // Futuristic Skyscraper
        const height = 45 + ((i * 17) % 65);
        const width = 14 + ((i * 7) % 10);
        const bGeo = new THREE.BoxGeometry(width, height, width);
        const bMesh = new THREE.Mesh(bGeo, buildingMat);
        bMesh.position.set(sceneryPos.x, sceneryPos.y + height / 2, sceneryPos.z);
        bMesh.castShadow = true;
        group.add(bMesh);

        // Glowing Window Band
        const winBandGeo = new THREE.BoxGeometry(width + 0.2, 1.2, width + 0.2);
        const winBand = new THREE.Mesh(winBandGeo, windowMat);
        winBand.position.set(sceneryPos.x, sceneryPos.y + height * 0.7, sceneryPos.z);
        group.add(winBand);
      } else if (config.theme === 'sunset_canyon') {
        // Red Canyon Rocks & Mesas
        const rockHeight = 25 + ((i * 13) % 45);
        const rockGeo = new THREE.CylinderGeometry(8, 18, rockHeight, 7);
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.9 });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(sceneryPos.x, sceneryPos.y + rockHeight / 2 - 2, sceneryPos.z);
        rock.castShadow = true;
        group.add(rock);
      } else {
        // Orbital Space Pylons & Energy Rings
        const pylonGeo = new THREE.CylinderGeometry(1.2, 2.5, 38, 8);
        const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, metalness: 0.9, roughness: 0.1 });
        const pylon = new THREE.Mesh(pylonGeo, pylonMat);
        pylon.position.set(sceneryPos.x, sceneryPos.y + 19, sceneryPos.z);
        group.add(pylon);

        const ringGeo = new THREE.TorusGeometry(6, 0.4, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(sceneryPos.x, sceneryPos.y + 28, sceneryPos.z);
        group.add(ring);
      }
    }

    // Add Grandstands near Start Line
    const grandstandGeo = new THREE.BoxGeometry(16, 8, 40);
    const grandstand = new THREE.Mesh(grandstandGeo, grandstandMat);
    const gsPos = new THREE.Vector3().copy(startPoint.pos).addScaledVector(startPoint.binormal, -halfWidth - 14);
    grandstand.position.set(gsPos.x, gsPos.y + 4, gsPos.z + 10);
    grandstand.lookAt(startPoint.pos);
    group.add(grandstand);

    // Overhead Highway Streetlights (spaced every 20 samples)
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.22, 10, 8);
    const lampArmGeo = new THREE.BoxGeometry(4.5, 0.2, 0.3);
    const lampHeadGeo = new THREE.BoxGeometry(1.0, 0.3, 0.6);
    const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 8; i < sampleCount; i += 20) {
      const p = roadPoints[i];
      const polePos = new THREE.Vector3().copy(p.pos).addScaledVector(p.binormal, halfWidth + kerbWidth + 2.0);

      const lampGroup = new THREE.Group();
      lampGroup.position.copy(polePos);

      const pole = new THREE.Mesh(poleGeo, postMat);
      pole.position.y = 5;
      lampGroup.add(pole);

      const arm = new THREE.Mesh(lampArmGeo, postMat);
      arm.position.set(-1.8, 9.8, 0);
      lampGroup.add(arm);

      const bulb = new THREE.Mesh(lampHeadGeo, lampHeadMat);
      bulb.position.set(-3.6, 9.7, 0);
      lampGroup.add(bulb);

      lampGroup.lookAt(new THREE.Vector3().copy(polePos).add(p.tangent));
      group.add(lampGroup);
    }

    return {
      group,
      curve,
      trackLength,
      roadWidth,
      checkpoints,
      boostPads,
      coins,
      sampleCount
    };
  }
}
