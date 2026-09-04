import * as THREE from 'three';
import { CoverObstacle, PickupItem, PracticeTarget } from './types';

export interface CityEnvironmentResult {
  environmentGroup: THREE.Group;
  obstacles: CoverObstacle[];
  spawnPoints: THREE.Vector3[];
  enemyPatrolRoutes: THREE.Vector3[][];
  pickupItems: PickupItem[];
  practiceTargets?: PracticeTarget[];
  cityBounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export class CityEnvironment3D {
  /**
   * Procedurally generates a vibrant, detailed, and playable modern 3D City District
   */
  public static buildCityMap(mode: string = 'enemy_hunt', mapId: string = 'city_district'): CityEnvironmentResult {
    const root = new THREE.Group();
    root.name = 'ModernCityDistrict';

    const obstacles: CoverObstacle[] = [];
    const spawnPoints: THREE.Vector3[] = [];
    const enemyPatrolRoutes: THREE.Vector3[][] = [];
    const pickupItems: PickupItem[] = [];
    const practiceTargets: PracticeTarget[] = [];

    // Map bounds: 180m x 180m
    const minX = -90;
    const maxX = 90;
    const minZ = -90;
    const maxZ = 90;

    // --- PROCEDURAL & RICH MATERIALS ---
    // Daylight road asphalt with realistic fine roughness
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean dark slate asphalt
      roughness: 0.85,
      metalness: 0.1,
    });
    // Sidewalk light paving stone
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8, // Light gray concrete pavers
      roughness: 0.75,
      metalness: 0.1,
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Darker curb edge
      roughness: 0.8,
      metalness: 0.15,
    });
    const roadLineMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright yellow lane dividing line
      roughness: 0.4,
      metalness: 0.1,
    });
    const whiteStripeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1,
    });
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Vibrant lush grass
      roughness: 0.9,
      metalness: 0.05,
    });
    const modernGlassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85,
    });
    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.7,
    });
    const concreteWallMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Clean light urban concrete
      roughness: 0.8,
      metalness: 0.1,
    });
    const brickWallMat = new THREE.MeshStandardMaterial({
      color: 0xb45309, // Warm red-brown brick
      roughness: 0.85,
      metalness: 0.05,
    });
    const darkBuildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Midnight slate architectural panels
      roughness: 0.6,
      metalness: 0.3,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Polished wood bench / trunks
      roughness: 0.7,
      metalness: 0.05,
    });
    const treeFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x15803d, // Rich leafy green
      roughness: 0.85,
      metalness: 0.05,
    });
    const barrierMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.7,
      metalness: 0.2,
    });
    const hazardStripeMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.5,
      metalness: 0.2,
    });
    const metalSteelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.8,
    });
    const lampGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
    });

    // Helper to register physical cover obstacle
    const addObstacleBox = (
      mesh: THREE.Object3D,
      type: CoverObstacle['type'],
      size: THREE.Vector3,
      pos: THREE.Vector3
    ) => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);

      const half = size.clone().multiplyScalar(0.5);
      const min = pos.clone().sub(half);
      const max = pos.clone().add(half);
      obstacles.push({
        id: `obs_${type}_${obstacles.length}`,
        box: new THREE.Box3(min, max),
        type,
        center: pos.clone(),
        size: size.clone(),
      });
    };

    // --- 1. BASE GROUND & ROAD NETWORK ---
    // Broad ground plane
    const groundGeo = new THREE.PlaneGeometry(240, 240);
    const ground = new THREE.Mesh(groundGeo, asphaltMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    root.add(ground);

    // 4 Major Quadrant Sidewalk Islands (leaving 16m wide Main Avenues along X=0 and Z=0, plus alleys)
    const blocks = [
      { x: 44, z: 44, w: 68, d: 68, type: 'financial' },
      { x: -44, z: 44, w: 68, d: 68, type: 'park' },
      { x: -44, z: -44, w: 68, d: 68, type: 'industrial' },
      { x: 44, z: -44, w: 68, d: 68, type: 'commercial' },
    ];

    blocks.forEach((b) => {
      // Raised sidewalk block (0.22m high)
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, 0.22, b.d),
        b.type === 'park' ? grassMat : sidewalkMat
      );
      slab.position.set(b.x, 0.11, b.z);
      slab.receiveShadow = true;
      root.add(slab);

      // Beveled curb rim
      const curbFrame = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.3, 0.23, b.d + 0.3), curbMat);
      curbFrame.position.set(b.x, 0.1, b.z);
      curbFrame.receiveShadow = true;
      root.add(curbFrame);
    });

    // Yellow Double Centerlines on Main Avenues
    for (let z = -84; z <= 84; z += 5) {
      if (Math.abs(z) > 10) {
        for (const offset of [-0.25, 0.25]) {
          const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 3.2), roadLineMat);
          line.rotation.x = -Math.PI / 2;
          line.position.set(offset, 0.02, z);
          root.add(line);
        }
      }
    }
    for (let x = -84; x <= 84; x += 5) {
      if (Math.abs(x) > 10) {
        for (const offset of [-0.25, 0.25]) {
          const line = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.18), roadLineMat);
          line.rotation.x = -Math.PI / 2;
          line.position.set(x, 0.02, offset);
          root.add(line);
        }
      }
    }

    // Pedestrian Zebra Crosswalks at Central Intersection
    const crosswalkLocations = [
      { x: 0, z: 9.8, rot: 0 },
      { x: 0, z: -9.8, rot: 0 },
      { x: 9.8, z: 0, rot: Math.PI / 2 },
      { x: -9.8, z: 0, rot: Math.PI / 2 },
    ];
    crosswalkLocations.forEach((cw) => {
      for (let i = -5; i <= 5; i += 1.3) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 4.2), whiteStripeMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.rotation.z = cw.rot;
        if (cw.rot === 0) {
          stripe.position.set(cw.x + i, 0.025, cw.z);
        } else {
          stripe.position.set(cw.x, 0.025, cw.z + i);
        }
        root.add(stripe);
      }
    });

    // Helper to generate painted road text texture (e.g. "BUS")
    const createRoadTextDecal = (text: string, w = 3.5, h = 6): THREE.Mesh => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 512, 512);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '900 130px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.letterSpacing = '10px';
        ctx.fillText(text, 256, 256);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.rotation.x = -Math.PI / 2;
      return mesh;
    };

    // Painted "BUS" Road Text Decals on the street
    const busDecalLocations = [
      { x: 4.2, z: 18, rot: 0 },
      { x: -4.2, z: -18, rot: Math.PI },
      { x: 4.2, z: -42, rot: 0 },
      { x: -4.2, z: 42, rot: Math.PI },
    ];
    busDecalLocations.forEach((loc) => {
      const busMarking = createRoadTextDecal('BUS', 3.6, 6.2);
      busMarking.position.set(loc.x, 0.03, loc.z);
      busMarking.rotation.z = loc.rot;
      root.add(busMarking);
    });

    // Stylized Cartoon Fluffy White Clouds in the Sky
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.2,
    });
    const cloudPositions = [
      { x: -40, y: 70, z: -60, s: 1.4 },
      { x: 30, y: 80, z: -80, s: 1.8 },
      { x: 70, y: 75, z: 20, s: 1.2 },
      { x: -60, y: 85, z: 50, s: 1.6 },
      { x: 0, y: 90, z: -100, s: 2.2 },
      { x: -20, y: 65, z: 80, s: 1.3 },
    ];
    cloudPositions.forEach((cp) => {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(cp.x, cp.y, cp.z);
      // Puffy cloud spheres composite
      const puffs = [
        { x: 0, y: 0, z: 0, r: 9 },
        { x: 7, y: -1, z: 1, r: 7.5 },
        { x: -7, y: -1.5, z: -1, r: 7 },
        { x: 3.5, y: 3.5, z: 0, r: 6.5 },
        { x: -4, y: 3, z: 1, r: 6 },
        { x: 0, y: -2, z: 4, r: 6 },
      ];
      puffs.forEach((pf) => {
        const puffMesh = new THREE.Mesh(new THREE.SphereGeometry(pf.r * cp.s, 12, 10), cloudMat);
        puffMesh.position.set(pf.x * cp.s, pf.y * cp.s, pf.z * cp.s);
        puffMesh.scale.y = 0.65;
        cloudGroup.add(puffMesh);
      });
      root.add(cloudGroup);
    });

    // --- 2. MODERN CITY BUILDINGS & MULTI-TIER ARCHITECTURE ---
    // A. Financial Modern Highrises (Quadrant 1: +X, +Z)
    const financialBuildings = [
      { x: 30, z: 30, w: 20, h: 46, d: 20, style: 'glass_tower' },
      { x: 60, z: 30, w: 22, h: 36, d: 18, style: 'corporate' },
      { x: 30, z: 60, w: 18, h: 32, d: 22, style: 'corporate' },
      { x: 60, z: 60, w: 20, h: 28, d: 20, style: 'glass_tower' },
    ];

    financialBuildings.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);

      // Main structural volume
      const mainMesh = new THREE.Mesh(
        new THREE.BoxGeometry(b.w, b.h, b.d),
        b.style === 'glass_tower' ? darkBuildingMat : concreteWallMat
      );
      mainMesh.position.y = b.h / 2;
      bGroup.add(mainMesh);

      // Glass facade panels
      if (b.style === 'glass_tower') {
        const glassFront = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.92, b.h * 0.88, 0.3), modernGlassMat);
        glassFront.position.set(0, b.h / 2, b.d / 2 + 0.1);
        bGroup.add(glassFront);

        const glassBack = glassFront.clone();
        glassBack.position.z = -b.d / 2 - 0.1;
        bGroup.add(glassBack);
      } else {
        // Grid of modern office windows
        for (let y = 6; y < b.h - 4; y += 4) {
          for (let gx = -b.w / 2 + 3; gx < b.w / 2 - 2; gx += 4.5) {
            const win = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 0.25), modernGlassMat);
            win.position.set(gx, y, b.d / 2 + 0.1);
            bGroup.add(win);
          }
        }
      }

      // Rooftop Equipment & Access Penthouse
      const rooftopHut = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), concreteWallMat);
      rooftopHut.position.set(0, b.h + 2, 0);
      bGroup.add(rooftopHut);

      // AC Chiller Units on Roof
      const chiller = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 4), metalSteelMat);
      chiller.position.set(4, b.h + 1, 3);
      bGroup.add(chiller);

      addObstacleBox(bGroup, 'building', new THREE.Vector3(b.w, b.h, b.d), new THREE.Vector3(b.x, b.h / 2, b.z));
    });

    // B. Commercial Retail & Shop Strip (Quadrant 4: +X, -Z)
    const commercialBuildings = [
      { x: 30, z: -30, w: 22, h: 22, d: 20, name: 'METRO BISTRO' },
      { x: 60, z: -30, w: 20, h: 26, d: 18, name: 'TECH SHOP' },
      { x: 30, z: -60, w: 20, h: 20, d: 22, name: 'CYBER PHARMACY' },
      { x: 60, z: -60, w: 22, h: 24, d: 20, name: 'URBAN MART' },
    ];

    commercialBuildings.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);

      // Brick & Concrete facade
      const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), brickWallMat);
      mainMesh.position.y = b.h / 2;
      bGroup.add(mainMesh);

      // Ground-Floor Storefront Window
      const storefront = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.82, 3.8, 0.3), modernGlassMat);
      storefront.position.set(0, 2.2, b.d / 2 + 0.12);
      bGroup.add(storefront);

      // Fabric Store Awning (Striped roof shelter over sidewalk)
      const awning = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.86, 0.4, 2.4), hazardStripeMat);
      awning.rotation.x = 0.22;
      awning.position.set(0, 4.3, b.d / 2 + 1.2);
      bGroup.add(awning);

      // Commercial Signboard
      const sign = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.6, 1.2, 0.25), darkBuildingMat);
      sign.position.set(0, 5.2, b.d / 2 + 0.15);
      bGroup.add(sign);

      addObstacleBox(bGroup, 'building', new THREE.Vector3(b.w, b.h, b.d), new THREE.Vector3(b.x, b.h / 2, b.z));
    });

    // C. Industrial Depot & Logistics Warehouses (Quadrant 3: -X, -Z)
    const industrialBuildings = [
      { x: -32, z: -32, w: 24, h: 14, d: 22 },
      { x: -64, z: -32, w: 22, h: 16, d: 20 },
      { x: -32, z: -64, w: 20, h: 18, d: 24 },
      { x: -64, z: -64, w: 24, h: 16, d: 22 },
    ];

    industrialBuildings.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);

      const mainMesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), darkBuildingMat);
      mainMesh.position.y = b.h / 2;
      bGroup.add(mainMesh);

      // Steel Roller Shutter Garage Door
      const garageDoor = new THREE.Mesh(new THREE.BoxGeometry(6.5, 4.5, 0.2), metalSteelMat);
      garageDoor.position.set(0, 2.25, b.d / 2 + 0.1);
      bGroup.add(garageDoor);

      addObstacleBox(bGroup, 'building', new THREE.Vector3(b.w, b.h, b.d), new THREE.Vector3(b.x, b.h / 2, b.z));
    });

    // --- 3. DETAILED 3D MODERN CARS (FOR COVER & VISUAL REALISM) ---
    const carSpecs = [
      // Parked along main avenues & parking bays
      { x: 8, z: 16, yaw: 0, color: 0x2563eb }, // Blue sedan
      { x: 8, z: 28, yaw: 0, color: 0xdc2626 }, // Red sports coupe
      { x: -8, z: 18, yaw: Math.PI, color: 0x0f172a }, // Black tactical SUV
      { x: -8, z: -22, yaw: Math.PI, color: 0x94a3b8 }, // Silver sedan
      { x: 18, z: 8, yaw: Math.PI / 2, color: 0x16a34a }, // Green compact
      { x: -26, z: 8, yaw: -Math.PI / 2, color: 0xeab308 }, // Yellow cab
      { x: 38, z: -10, yaw: 0, color: 0x7c3aed }, // Purple roadster
      { x: -18, z: -8, yaw: -Math.PI / 2, color: 0x475569 }, // Gray SUV
    ];

    const carWheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
    const carWindshieldMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 });

    carSpecs.forEach((c) => {
      const carGroup = new THREE.Group();
      carGroup.position.set(c.x, 0, c.z);
      carGroup.rotation.y = c.yaw;

      const carPaintMat = new THREE.MeshStandardMaterial({
        color: c.color,
        roughness: 0.25,
        metalness: 0.75,
      });

      // Lower Car Body
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.4), carPaintMat);
      chassis.position.y = 0.65;
      carGroup.add(chassis);

      // Upper Cabin / Roof
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.3), carPaintMat);
      cabin.position.set(0, 1.3, -0.2);
      carGroup.add(cabin);

      // Windshields (Front & Rear)
      const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 0.2), carWindshieldMat);
      frontGlass.rotation.x = -0.35;
      frontGlass.position.set(0, 1.25, 0.95);
      carGroup.add(frontGlass);

      const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.2), carWindshieldMat);
      rearGlass.rotation.x = 0.35;
      rearGlass.position.set(0, 1.25, -1.35);
      carGroup.add(rearGlass);

      // 4 Wheels
      const wheelOffsets = [
        { x: -1.05, z: 1.3 },
        { x: 1.05, z: 1.3 },
        { x: -1.05, z: -1.3 },
        { x: 1.05, z: -1.3 },
      ];
      wheelOffsets.forEach((wo) => {
        const wheel = new THREE.Mesh(carWheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wo.x, 0.38, wo.z);
        carGroup.add(wheel);
      });

      // Headlights & Taillights
      const headL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.05), lampGlowMat);
      headL.position.set(-0.7, 0.65, 2.22);
      carGroup.add(headL);
      const headR = headL.clone();
      headR.position.x = 0.7;
      carGroup.add(headR);

      addObstacleBox(carGroup, 'car', new THREE.Vector3(2.2, 1.6, 4.5), new THREE.Vector3(c.x, 0.8, c.z));
    });

    // --- 4. TACTICAL COVER: CONCRETE JERSEY BARRIERS, CRATES & PALLETS ---
    const barrierPositions = [
      { x: 0, z: 5.5, rot: 0 },
      { x: -3.5, z: 5.5, rot: 0 },
      { x: 3.5, z: 5.5, rot: 0 },
      { x: 0, z: -5.5, rot: 0 },
      { x: -3.5, z: -5.5, rot: 0 },
      { x: 3.5, z: -5.5, rot: 0 },
      { x: 5.5, z: 0, rot: Math.PI / 2 },
      { x: -5.5, z: 0, rot: Math.PI / 2 },
    ];

    barrierPositions.forEach((bp) => {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 0.6), barrierMat);
      bMesh.position.set(bp.x, 0.55, bp.z);
      bMesh.rotation.y = bp.rot;

      // Hazard stripe warning line
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.22, 0.62), hazardStripeMat);
      stripe.position.set(bp.x, 0.55, bp.z);
      stripe.rotation.y = bp.rot;
      root.add(stripe);

      addObstacleBox(bMesh, 'barrier', new THREE.Vector3(2.8, 1.1, 0.6), new THREE.Vector3(bp.x, 0.55, bp.z));
    });

    // Shipping Containers in Industrial Depot
    const containers = [
      { x: -16, z: -16, w: 3.0, h: 2.8, d: 7.0, color: 0xdc2626 },
      { x: -24, z: -16, w: 3.0, h: 2.8, d: 7.0, color: 0x2563eb },
      { x: -16, z: -26, w: 7.0, h: 2.8, d: 3.0, color: 0xd97706 },
    ];
    containers.forEach((ct) => {
      const cMat = new THREE.MeshStandardMaterial({ color: ct.color, roughness: 0.5, metalness: 0.6 });
      const cMesh = new THREE.Mesh(new THREE.BoxGeometry(ct.w, ct.h, ct.d), cMat);
      cMesh.position.set(ct.x, ct.h / 2, ct.z);
      addObstacleBox(cMesh, 'crate', new THREE.Vector3(ct.w, ct.h, ct.d), new THREE.Vector3(ct.x, ct.h / 2, ct.z));
    });

    // Wooden logistics crates for low cover
    const cratePositions = [
      { x: 12, z: 12 },
      { x: 14, z: 12 },
      { x: 13, z: 14 },
      { x: -12, z: 12 },
      { x: 12, z: -12 },
    ];
    cratePositions.forEach((cp) => {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), woodMat);
      crate.position.set(cp.x, 0.6, cp.z);
      addObstacleBox(crate, 'crate', new THREE.Vector3(1.2, 1.2, 1.2), new THREE.Vector3(cp.x, 0.6, cp.z));
    });

    // --- 5. URBAN PARK, LEAFY TREES & PARK BENCHES (QUADRANT 2: -X, +Z) ---
    const treePositions = [
      { x: -20, z: 20 },
      { x: -35, z: 20 },
      { x: -20, z: 35 },
      { x: -35, z: 35 },
      { x: -50, z: 25 },
      { x: -25, z: 50 },
      { x: -45, z: 45 },
      // Trees along avenue sidewalks
      { x: 10, z: 40 },
      { x: 10, z: -40 },
      { x: -10, z: -40 },
    ];

    treePositions.forEach((tp) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tp.x, 0, tp.z);

      // Wooden Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 4.5, 12), woodMat);
      trunk.position.y = 2.25;
      treeGroup.add(trunk);

      // Layered Organic Foliage Spheres (Full, bushy green canopy)
      const foliage1 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 14, 12), treeFoliageMat);
      foliage1.position.y = 4.8;
      treeGroup.add(foliage1);

      const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(1.7, 12, 10), treeFoliageMat);
      foliage2.position.set(0.6, 5.8, 0.4);
      treeGroup.add(foliage2);

      const foliage3 = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 10), treeFoliageMat);
      foliage3.position.set(-0.7, 5.4, -0.5);
      treeGroup.add(foliage3);

      addObstacleBox(treeGroup, 'barrier', new THREE.Vector3(1.2, 5.0, 1.2), new THREE.Vector3(tp.x, 2.5, tp.z));
    });

    // Park Benches
    const benchPositions = [
      { x: -22, z: 14, rot: 0 },
      { x: -32, z: 14, rot: 0 },
      { x: -14, z: 22, rot: Math.PI / 2 },
      { x: 14, z: 22, rot: -Math.PI / 2 },
    ];
    benchPositions.forEach((bp) => {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 0.7), woodMat);
      bench.position.set(bp.x, 0.35, bp.z);
      bench.rotation.y = bp.rot;
      addObstacleBox(bench, 'barrier', new THREE.Vector3(2.0, 0.7, 0.7), new THREE.Vector3(bp.x, 0.35, bp.z));
    });

    // --- 6. MODERN STREET LIGHTS & SIGNPOSTS ---
    const streetLights = [
      { x: 9.5, z: 10, rot: Math.PI },
      { x: 9.5, z: 35, rot: Math.PI },
      { x: 9.5, z: -25, rot: Math.PI },
      { x: -9.5, z: 10, rot: 0 },
      { x: -9.5, z: 35, rot: 0 },
      { x: -9.5, z: -25, rot: 0 },
      { x: 25, z: 9.5, rot: -Math.PI / 2 },
      { x: -25, z: 9.5, rot: -Math.PI / 2 },
    ];

    streetLights.forEach((sl) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(sl.x, 0, sl.z);
      poleGroup.rotation.y = sl.rot;

      // Vertical Steel Post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6.0, 10), metalSteelMat);
      post.position.y = 3.0;
      poleGroup.add(post);

      // Curved Horizontal Arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.1), metalSteelMat);
      arm.position.set(0.7, 5.9, 0);
      poleGroup.add(arm);

      // Lamp Head & Glowing Diffuser
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.35), darkBuildingMat);
      lampHead.position.set(1.4, 5.85, 0);
      poleGroup.add(lampHead);

      const lampGlow = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.3), lampGlowMat);
      lampGlow.position.set(1.4, 5.76, 0);
      poleGroup.add(lampGlow);

      root.add(poleGroup);
    });

    // --- 6B. DISTANT METROPOLIS SKYLINE (GIGANTIC CARTOON-REALISTIC TOWERS ON HORIZON) ---
    const skylineMatLight = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Distant slate blue concrete
      roughness: 0.85,
      metalness: 0.1,
    });
    const skylineMatGlass = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Distant cyan glass tower
      roughness: 0.3,
      metalness: 0.7,
    });
    const skylineMatWarm = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Warm terracotta highrise
      roughness: 0.8,
      metalness: 0.05,
    });

    const distantTowers = [
      // North Horizon (Z = -120 to -150)
      { x: -80, z: -130, w: 28, h: 72, d: 26, mat: skylineMatGlass, spire: true },
      { x: -40, z: -135, w: 32, h: 54, d: 30, mat: skylineMatLight, spire: false },
      { x: 0, z: -140, w: 36, h: 90, d: 34, mat: skylineMatGlass, spire: true },
      { x: 45, z: -132, w: 26, h: 62, d: 28, mat: skylineMatWarm, spire: false },
      { x: 85, z: -138, w: 34, h: 80, d: 30, mat: skylineMatGlass, spire: true },

      // South Horizon (Z = +120 to +150)
      { x: -75, z: 132, w: 30, h: 68, d: 28, mat: skylineMatLight, spire: false },
      { x: -30, z: 138, w: 28, h: 84, d: 30, mat: skylineMatGlass, spire: true },
      { x: 15, z: 140, w: 34, h: 58, d: 32, mat: skylineMatWarm, spire: false },
      { x: 60, z: 135, w: 30, h: 76, d: 28, mat: skylineMatGlass, spire: true },

      // East Horizon (X = +120 to +150)
      { x: 135, z: -60, w: 28, h: 65, d: 32, mat: skylineMatLight, spire: false },
      { x: 140, z: -10, w: 32, h: 88, d: 30, mat: skylineMatGlass, spire: true },
      { x: 136, z: 45, w: 30, h: 70, d: 34, mat: skylineMatWarm, spire: false },

      // West Horizon (X = -120 to -150)
      { x: -135, z: -50, w: 30, h: 78, d: 32, mat: skylineMatGlass, spire: true },
      { x: -140, z: 5, w: 34, h: 85, d: 30, mat: skylineMatLight, spire: false },
      { x: -136, z: 55, w: 28, h: 64, d: 28, mat: skylineMatWarm, spire: true },
    ];

    distantTowers.forEach((dt) => {
      const tower = new THREE.Group();
      tower.position.set(dt.x, 0, dt.z);

      const body = new THREE.Mesh(new THREE.BoxGeometry(dt.w, dt.h, dt.d), dt.mat);
      body.position.y = dt.h / 2;
      tower.add(body);

      // Antenna spire on tall landmarks
      if (dt.spire) {
        const spireMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 16, 8), metalSteelMat);
        spireMesh.position.set(0, dt.h + 8, 0);
        tower.add(spireMesh);

        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        beacon.position.set(0, dt.h + 16, 0);
        tower.add(beacon);
      }

      root.add(tower);
    });

    // --- 6C. FLUFFY 3D WHITE DAYLIGHT CLOUDS IN SKY ---
    const skyCloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
    });

    const cloudClusterCenters = [
      { x: -50, y: 55, z: -40, scale: 1.2 },
      { x: 40, y: 62, z: -60, scale: 1.5 },
      { x: -30, y: 58, z: 45, scale: 1.1 },
      { x: 60, y: 65, z: 30, scale: 1.4 },
      { x: 0, y: 70, z: 0, scale: 1.3 },
      { x: -70, y: 60, z: 10, scale: 1.0 },
      { x: 75, y: 56, z: -20, scale: 1.2 },
    ];

    cloudClusterCenters.forEach((cc) => {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(cc.x, cc.y, cc.z);
      cloudGroup.scale.set(cc.scale, cc.scale * 0.65, cc.scale);

      // Clustered rounded spheres
      const offsets = [
        { x: 0, y: 0, z: 0, r: 8 },
        { x: 5, y: -1, z: 2, r: 6.5 },
        { x: -5, y: -1, z: -1, r: 6.8 },
        { x: 2, y: 2, z: 3, r: 5.5 },
        { x: -3, y: 1, z: 3, r: 6.0 },
        { x: 0, y: -2, z: -4, r: 5.8 },
      ];

      offsets.forEach((o) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(o.r, 10, 8), skyCloudMat);
        puff.position.set(o.x, o.y, o.z);
        cloudGroup.add(puff);
      });

      root.add(cloudGroup);
    });

    // --- 6D. TRAFFIC SIGNS & STREET PLATES ---
    const signPostMat = metalSteelMat;
    const stopSignMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const speedSignMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const blueStreetSignMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });

    const streetSigns = [
      // Central crossroads
      { x: 8.5, z: 8.5, type: 'stop' },
      { x: -8.5, z: -8.5, type: 'stop' },
      { x: 8.5, z: -8.5, type: 'speed' },
      { x: -8.5, z: 8.5, type: 'speed' },
      // Avenue entries
      { x: 0, z: 25, type: 'street' },
      { x: 0, z: -25, type: 'street' },
    ];

    streetSigns.forEach((ss) => {
      const signGroup = new THREE.Group();
      signGroup.position.set(ss.x, 0, ss.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 8), signPostMat);
      post.position.y = 1.3;
      signGroup.add(post);

      if (ss.type === 'stop') {
        const stopPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 8), stopSignMat);
        stopPlate.rotation.x = Math.PI / 2;
        stopPlate.position.set(0, 2.3, 0.04);
        signGroup.add(stopPlate);
      } else if (ss.type === 'speed') {
        const speedPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.04), speedSignMat);
        speedPlate.position.set(0, 2.3, 0.04);
        signGroup.add(speedPlate);
      } else {
        const streetPlate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.04), blueStreetSignMat);
        streetPlate.position.set(0, 2.4, 0.04);
        signGroup.add(streetPlate);
      }

      root.add(signGroup);
    });

    // --- 6E. FIRE HYDRANTS ---
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4, metalness: 0.4 });
    const hydrantPositions = [
      { x: 8.8, z: 12 },
      { x: -8.8, z: -14 },
      { x: 14, z: -8.8 },
      { x: -14, z: 8.8 },
    ];
    hydrantPositions.forEach((hp) => {
      const hydrant = new THREE.Group();
      hydrant.position.set(hp.x, 0, hp.z);

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.7, 10), hydrantMat);
      body.position.y = 0.35;
      hydrant.add(body);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), hydrantMat);
      cap.position.y = 0.72;
      hydrant.add(cap);

      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8), metalSteelMat);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.y = 0.45;
      hydrant.add(nozzle);

      root.add(hydrant);
    });

    // --- 7. BOUNDARY WALLS (INVISIBLY CONTAIN PLAYABLE AREA) ---
    const boundaryWallMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.1,
    });
    // North, South, East, West boundary walls
    const bWalls = [
      { x: 0, z: -89, w: 180, h: 10, d: 2 },
      { x: 0, z: 89, w: 180, h: 10, d: 2 },
      { x: -89, z: 0, w: 2, h: 10, d: 180 },
      { x: 89, z: 0, w: 2, h: 10, d: 180 },
    ];
    bWalls.forEach((bw) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(bw.w, bw.h, bw.d), boundaryWallMat);
      wall.position.set(bw.x, bw.h / 2, bw.z);
      addObstacleBox(wall, 'boundary', new THREE.Vector3(bw.w, bw.h, bw.d), new THREE.Vector3(bw.x, bw.h / 2, bw.z));
    });

    // --- 8. TACTICAL PICKUP ITEMS ---
    const pickups: { type: 'health' | 'armor' | 'ammo'; pos: THREE.Vector3 }[] = [
      { type: 'health', pos: new THREE.Vector3(0, 0.5, 12) },
      { type: 'armor', pos: new THREE.Vector3(0, 0.5, -12) },
      { type: 'ammo', pos: new THREE.Vector3(12, 0.5, 0) },
      { type: 'health', pos: new THREE.Vector3(-18, 0.5, 20) },
      { type: 'armor', pos: new THREE.Vector3(-20, 0.5, -20) },
      { type: 'ammo', pos: new THREE.Vector3(20, 0.5, -20) },
    ];

    pickups.forEach((p, idx) => {
      const pGroup = new THREE.Group();
      pGroup.position.copy(p.pos);

      let pColor = 0x22c55e; // Green health
      if (p.type === 'armor') pColor = 0x3b82f6; // Blue armor
      if (p.type === 'ammo') pColor = 0xf59e0b; // Gold ammo

      const pMat = new THREE.MeshStandardMaterial({
        color: pColor,
        roughness: 0.3,
        metalness: 0.6,
        emissive: pColor,
        emissiveIntensity: 0.4,
      });

      const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), pMat);
      pGroup.add(pMesh);
      root.add(pGroup);

      pickupItems.push({
        id: idx + 1,
        type: p.type,
        position: p.pos.clone(),
        mesh: pGroup,
        active: true,
        respawnTime: 0,
      });
    });

    // --- 9. TARGET PRACTICE TARGETS (FOR TARGET_PRACTICE & SHOOTING_RANGE MODES) ---
    if (mode === 'target_practice' || mode === 'shooting_range') {
      const targetCoords = [
        { x: -15, z: 25, dist: 25 },
        { x: -5, z: 32, dist: 32 },
        { x: 5, z: 28, dist: 28 },
        { x: 15, z: 35, dist: 35 },
        { x: 0, z: 45, dist: 45 },
        { x: -10, z: 50, dist: 50 },
        { x: 10, z: 55, dist: 55 },
        { x: 0, z: 65, dist: 65 },
      ];

      targetCoords.forEach((tc, idx) => {
        const tGroup = new THREE.Group();
        tGroup.position.set(tc.x, 1.4, tc.z);

        // Target Stand Pole
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8), metalSteelMat);
        stand.position.y = -0.7;
        tGroup.add(stand);

        // Bullseye Board (Red/White concentric discs)
        const outerDisc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.7, 0.7, 0.08, 24),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 })
        );
        outerDisc.rotation.x = Math.PI / 2;
        tGroup.add(outerDisc);

        const midDisc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.48, 0.48, 0.09, 24),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        );
        midDisc.rotation.x = Math.PI / 2;
        tGroup.add(midDisc);

        const bullseye = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.24, 0.1, 24),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
        );
        bullseye.rotation.x = Math.PI / 2;
        tGroup.add(bullseye);

        root.add(tGroup);

        practiceTargets.push({
          id: idx + 1,
          position: new THREE.Vector3(tc.x, 1.4, tc.z),
          initialPos: new THREE.Vector3(tc.x, 1.4, tc.z),
          health: 100,
          maxHealth: 100,
          distance: tc.dist,
          moveSpeed: idx % 2 === 1 ? 2.2 : 0,
          moveRange: idx % 2 === 1 ? 4.5 : 0,
          isHit: false,
          hitTimer: 0,
          mesh: tGroup,
        });
      });
    }

    // --- 10. SPAWN POINTS & ENEMY PATROL ROUTES ---
    // Player starts in the open central plaza (0, 0, -5)
    spawnPoints.push(new THREE.Vector3(0, 0, -4));

    // Enemy spawn locations in tactical spots
    const enemySpawns = [
      new THREE.Vector3(18, 0, 18),
      new THREE.Vector3(-18, 0, 18),
      new THREE.Vector3(22, 0, -18),
      new THREE.Vector3(-22, 0, -18),
      new THREE.Vector3(0, 0, 36),
      new THREE.Vector3(36, 0, 0),
      new THREE.Vector3(-36, 0, 0),
      new THREE.Vector3(0, 0, -36),
    ];
    spawnPoints.push(...enemySpawns);

    // Patrol routes
    enemySpawns.forEach((sp) => {
      enemyPatrolRoutes.push([
        sp.clone(),
        sp.clone().add(new THREE.Vector3(10, 0, 0)),
        sp.clone().add(new THREE.Vector3(10, 0, 10)),
        sp.clone().add(new THREE.Vector3(0, 0, 10)),
      ]);
    });

    return {
      environmentGroup: root,
      obstacles,
      spawnPoints,
      enemyPatrolRoutes,
      pickupItems,
      practiceTargets,
      cityBounds: { minX, maxX, minZ, maxZ },
    };
  }
}
