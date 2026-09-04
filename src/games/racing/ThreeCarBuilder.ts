import * as THREE from 'three';
import { CarModel } from './types';

export interface BuiltCar {
  group: THREE.Group;
  carModel: CarModel;
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  wheels: THREE.Group[];
  brakeLights: THREE.Mesh[];
  headlights: THREE.Mesh[];
  exhaustPipes: THREE.Mesh[];
  nitroFlames: THREE.Mesh[];
  shadowMesh: THREE.Mesh;
  headlightLight?: THREE.SpotLight;
  brakeLight?: THREE.PointLight;
  nitroLight?: THREE.PointLight;
}

export class ThreeCarBuilder {
  /**
   * Creates an original 3D high-performance sports car model with realistic proportions,
   * 4 separate rotating wheels, steering knuckles, cockpit glass, spoiler, lights, and exhaust.
   */
  public static buildCar(car: CarModel): BuiltCar {
    const group = new THREE.Group();
    group.name = `Car_${car.name}`;

    // Standard materials for realistic automotive appearance
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.primaryColor),
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 1.2
    });

    const secondaryMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.secondaryColor),
      metalness: 0.7,
      roughness: 0.35
    });

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.accentColor),
      metalness: 0.8,
      roughness: 0.25
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.45,
      metalness: 0.5
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(car.cockpitGlassColor),
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: 0.75,
      ior: 1.5
    });

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.85,
      metalness: 0.1
    });

    const brakeLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0044,
      emissive: new THREE.Color(car.tailLightColor),
      emissiveIntensity: 1.2,
      roughness: 0.2
    });

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x60a5fa,
      emissiveIntensity: 2.0,
      roughness: 0.1
    });

    // ==============================================================
    // 1. MAIN CHASSIS & AERODYNAMIC BODYWORK
    // ==============================================================
    const carBodyGroup = new THREE.Group();
    group.add(carBodyGroup);

    // Lower Floorpan / Underbody
    const floorGeo = new THREE.BoxGeometry(1.9, 0.22, 4.4);
    const floorMesh = new THREE.Mesh(floorGeo, carbonMaterial);
    floorMesh.position.set(0, 0.28, 0);
    floorMesh.castShadow = true;
    floorMesh.receiveShadow = true;
    carBodyGroup.add(floorMesh);

    // Lower Front Splitter
    const splitterGeo = new THREE.BoxGeometry(2.02, 0.08, 0.7);
    const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitterMesh.position.set(0, 0.16, 2.05);
    splitterMesh.castShadow = true;
    carBodyGroup.add(splitterMesh);

    // Front Bumper / Nose Cone
    const noseGeo = new THREE.BoxGeometry(1.85, 0.42, 0.9);
    const noseMesh = new THREE.Mesh(noseGeo, bodyMaterial);
    noseMesh.position.set(0, 0.44, 1.85);
    noseMesh.castShadow = true;
    noseMesh.receiveShadow = true;
    carBodyGroup.add(noseMesh);

    // Front Grille Mesh / Radiator Opening
    const grilleGeo = new THREE.BoxGeometry(1.2, 0.2, 0.1);
    const grilleMesh = new THREE.Mesh(grilleGeo, carbonMaterial);
    grilleMesh.position.set(0, 0.35, 2.31);
    carBodyGroup.add(grilleMesh);

    // Front Hood (Slanted back toward cabin)
    const hoodGeo = new THREE.BoxGeometry(1.78, 0.25, 1.35);
    const hoodMesh = new THREE.Mesh(hoodGeo, bodyMaterial);
    hoodMesh.position.set(0, 0.58, 0.95);
    hoodMesh.rotation.x = 0.06;
    hoodMesh.castShadow = true;
    hoodMesh.receiveShadow = true;
    carBodyGroup.add(hoodMesh);

    // Hood Air Intake Scoop / Vent
    const hoodScoopGeo = new THREE.BoxGeometry(0.55, 0.08, 0.4);
    const hoodScoopMesh = new THREE.Mesh(hoodScoopGeo, accentMaterial);
    hoodScoopMesh.position.set(0, 0.72, 1.05);
    carBodyGroup.add(hoodScoopMesh);

    // Front Left & Right Fenders
    const fenderGeo = new THREE.BoxGeometry(0.24, 0.46, 1.4);
    const leftFrontFender = new THREE.Mesh(fenderGeo, bodyMaterial);
    leftFrontFender.position.set(-0.96, 0.48, 1.1);
    leftFrontFender.castShadow = true;
    carBodyGroup.add(leftFrontFender);

    const rightFrontFender = leftFrontFender.clone();
    rightFrontFender.position.x = 0.96;
    carBodyGroup.add(rightFrontFender);

    // Mid Section / Side Skirts & Doors
    const doorGeo = new THREE.BoxGeometry(0.18, 0.45, 1.5);
    const leftDoor = new THREE.Mesh(doorGeo, bodyMaterial);
    leftDoor.position.set(-0.92, 0.5, -0.2);
    leftDoor.castShadow = true;
    carBodyGroup.add(leftDoor);

    const rightDoor = leftDoor.clone();
    rightDoor.position.x = 0.92;
    carBodyGroup.add(rightDoor);

    // Side Skirt Aerodynamic Blades
    const sideSkirtGeo = new THREE.BoxGeometry(0.12, 0.08, 1.9);
    const leftSideSkirt = new THREE.Mesh(sideSkirtGeo, accentMaterial);
    leftSideSkirt.position.set(-0.98, 0.22, -0.1);
    carBodyGroup.add(leftSideSkirt);

    const rightSideSkirt = leftSideSkirt.clone();
    rightSideSkirt.position.x = 0.98;
    carBodyGroup.add(rightSideSkirt);

    // Rear Haunches / Muscle Fenders
    const rearFenderGeo = new THREE.BoxGeometry(0.3, 0.54, 1.4);
    const leftRearFender = new THREE.Mesh(rearFenderGeo, bodyMaterial);
    leftRearFender.position.set(-0.98, 0.54, -1.3);
    leftRearFender.castShadow = true;
    carBodyGroup.add(leftRearFender);

    const rightRearFender = leftRearFender.clone();
    rightRearFender.position.x = 0.98;
    carBodyGroup.add(rightRearFender);

    // Rear Bumper
    const rearBumperGeo = new THREE.BoxGeometry(1.9, 0.48, 0.7);
    const rearBumper = new THREE.Mesh(rearBumperGeo, bodyMaterial);
    rearBumper.position.set(0, 0.5, -1.95);
    rearBumper.castShadow = true;
    rearBumper.receiveShadow = true;
    carBodyGroup.add(rearBumper);

    // Rear Aerodynamic Underbody Diffuser & Fins
    const diffuserGeo = new THREE.BoxGeometry(1.7, 0.2, 0.55);
    const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuserMesh.position.set(0, 0.22, -2.05);
    diffuserMesh.rotation.x = -0.12;
    carBodyGroup.add(diffuserMesh);

    // 4 Diffuser Fins
    for (let f = -3; f <= 3; f += 2) {
      const finGeo = new THREE.BoxGeometry(0.04, 0.16, 0.5);
      const finMesh = new THREE.Mesh(finGeo, carbonMaterial);
      finMesh.position.set(f * 0.25, 0.2, -2.05);
      carBodyGroup.add(finMesh);
    }

    // Racing Stripes Livery
    const stripeGeo = new THREE.BoxGeometry(0.18, 0.02, 3.8);
    const stripeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(car.stripeColor),
      roughness: 0.3,
      metalness: 0.4
    });
    const stripeLeft = new THREE.Mesh(stripeGeo, stripeMat);
    stripeLeft.position.set(-0.16, 0.72, 0.1);
    carBodyGroup.add(stripeLeft);

    const stripeRight = new THREE.Mesh(stripeGeo, stripeMat);
    stripeRight.position.set(0.16, 0.72, 0.1);
    carBodyGroup.add(stripeRight);

    // ==============================================================
    // 2. COCKPIT GREENHOUSE, ROOF & GLASS
    // ==============================================================
    // Cockpit Roof
    const roofGeo = new THREE.BoxGeometry(1.35, 0.08, 1.4);
    const roofMesh = new THREE.Mesh(roofGeo, secondaryMaterial);
    roofMesh.position.set(0, 1.05, -0.3);
    roofMesh.castShadow = true;
    carBodyGroup.add(roofMesh);

    // Roof Air Scoop
    const roofScoopGeo = new THREE.BoxGeometry(0.4, 0.08, 0.45);
    const roofScoopMesh = new THREE.Mesh(roofScoopGeo, accentMaterial);
    roofScoopMesh.position.set(0, 1.12, -0.1);
    carBodyGroup.add(roofScoopMesh);

    // Front Windshield Glass
    const windshieldGeo = new THREE.BoxGeometry(1.36, 0.06, 0.95);
    const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshieldMesh.position.set(0, 0.86, 0.55);
    windshieldMesh.rotation.x = -0.52;
    carBodyGroup.add(windshieldMesh);

    // Rear Windshield / Engine Bay Glass
    const rearGlassGeo = new THREE.BoxGeometry(1.3, 0.06, 0.9);
    const rearGlassMesh = new THREE.Mesh(rearGlassGeo, glassMaterial);
    rearGlassMesh.position.set(0, 0.88, -1.1);
    rearGlassMesh.rotation.x = 0.42;
    carBodyGroup.add(rearGlassMesh);

    // Side Windows
    const sideWinGeo = new THREE.BoxGeometry(0.06, 0.32, 1.15);
    const leftSideWin = new THREE.Mesh(sideWinGeo, glassMaterial);
    leftSideWin.position.set(-0.7, 0.88, -0.28);
    carBodyGroup.add(leftSideWin);

    const rightSideWin = leftSideWin.clone();
    rightSideWin.position.x = 0.7;
    carBodyGroup.add(rightSideWin);

    // A, B, C Pillars (Dark carbon structure)
    const aPillarGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
    const leftAPillar = new THREE.Mesh(aPillarGeo, carbonMaterial);
    leftAPillar.position.set(-0.68, 0.86, 0.45);
    leftAPillar.rotation.x = -0.45;
    carBodyGroup.add(leftAPillar);

    const rightAPillar = leftAPillar.clone();
    rightAPillar.position.x = 0.68;
    carBodyGroup.add(rightAPillar);

    // Side Mirrors (Aerodynamic wings on doors)
    const mirrorGeo = new THREE.BoxGeometry(0.24, 0.1, 0.14);
    const leftMirror = new THREE.Mesh(mirrorGeo, accentMaterial);
    leftMirror.position.set(-0.95, 0.82, 0.4);
    leftMirror.rotation.y = 0.2;
    carBodyGroup.add(leftMirror);

    const rightMirror = leftMirror.clone();
    rightMirror.position.x = 0.95;
    rightMirror.rotation.y = -0.2;
    carBodyGroup.add(rightMirror);

    // ==============================================================
    // 3. LIGHTING: HEADLIGHTS & TAILLIGHTS
    // ==============================================================
    const headlights: THREE.Mesh[] = [];
    const brakeLights: THREE.Mesh[] = [];

    // Front Headlight Lenses
    const headlightGeo = new THREE.BoxGeometry(0.4, 0.12, 0.18);
    const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMaterial);
    leftHeadlight.position.set(-0.68, 0.56, 2.22);
    leftHeadlight.rotation.y = 0.18;
    carBodyGroup.add(leftHeadlight);
    headlights.push(leftHeadlight);

    const rightHeadlight = leftHeadlight.clone();
    rightHeadlight.position.x = 0.68;
    rightHeadlight.rotation.y = -0.18;
    carBodyGroup.add(rightHeadlight);
    headlights.push(rightHeadlight);

    // Rear Taillight Continuous Lightbar
    const lightbarGeo = new THREE.BoxGeometry(1.65, 0.08, 0.12);
    const taillightBar = new THREE.Mesh(lightbarGeo, brakeLightMaterial);
    taillightBar.position.set(0, 0.62, -2.27);
    carBodyGroup.add(taillightBar);
    brakeLights.push(taillightBar);

    // Additional Left & Right Brake Clusters
    const brakeClusterGeo = new THREE.BoxGeometry(0.35, 0.14, 0.12);
    const leftBrakeCluster = new THREE.Mesh(brakeClusterGeo, brakeLightMaterial);
    leftBrakeCluster.position.set(-0.7, 0.62, -2.27);
    carBodyGroup.add(leftBrakeCluster);
    brakeLights.push(leftBrakeCluster);

    const rightBrakeCluster = leftBrakeCluster.clone();
    rightBrakeCluster.position.x = 0.7;
    carBodyGroup.add(rightBrakeCluster);
    brakeLights.push(rightBrakeCluster);

    // Optional SpotLight from front for real road illumination
    const headlightLight = new THREE.SpotLight(0x93c5fd, 3.5, 55, Math.PI / 5, 0.4, 1.0);
    headlightLight.position.set(0, 0.6, 2.4);
    headlightLight.target.position.set(0, 0, 20);
    group.add(headlightLight);
    group.add(headlightLight.target);

    // PointLight for dynamic brake glow
    const brakeLight = new THREE.PointLight(0xff0044, 0.5, 8);
    brakeLight.position.set(0, 0.65, -2.4);
    group.add(brakeLight);

    // ==============================================================
    // 4. GT RACING REAR SPOILER
    // ==============================================================
    const spoilerGroup = new THREE.Group();
    spoilerGroup.position.set(0, 0.8, -1.95);
    carBodyGroup.add(spoilerGroup);

    // Spoiler Twin Carbon Stanchions (Mounts)
    const stanchionGeo = new THREE.BoxGeometry(0.06, 0.35, 0.15);
    const leftStanchion = new THREE.Mesh(stanchionGeo, carbonMaterial);
    leftStanchion.position.set(-0.55, 0.16, 0);
    leftStanchion.rotation.x = -0.15;
    spoilerGroup.add(leftStanchion);

    const rightStanchion = leftStanchion.clone();
    rightStanchion.position.x = 0.55;
    spoilerGroup.add(rightStanchion);

    // Aerodynamic Spoiler Wing Blade
    const wingWidth = car.spoilerStyle === 'gt_wing' ? 2.1 : 1.9;
    const wingGeo = new THREE.BoxGeometry(wingWidth, 0.05, 0.38);
    const wingMesh = new THREE.Mesh(wingGeo, carbonMaterial);
    wingMesh.position.set(0, 0.34, -0.05);
    wingMesh.rotation.x = 0.1;
    wingMesh.castShadow = true;
    spoilerGroup.add(wingMesh);

    // Vertical Endplates on Wing Tips
    const endplateGeo = new THREE.BoxGeometry(0.04, 0.22, 0.42);
    const leftEndplate = new THREE.Mesh(endplateGeo, accentMaterial);
    leftEndplate.position.set(-wingWidth / 2, 0.34, -0.05);
    spoilerGroup.add(leftEndplate);

    const rightEndplate = leftEndplate.clone();
    rightEndplate.position.x = wingWidth / 2;
    spoilerGroup.add(rightEndplate);

    // ==============================================================
    // 5. DUAL TITANIUM EXHAUST PIPES & NITRO FLAMES
    // ==============================================================
    const exhaustPipes: THREE.Mesh[] = [];
    const nitroFlames: THREE.Mesh[] = [];

    const exhaustPipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.2, 16);
    exhaustPipeGeo.rotateX(Math.PI / 2);

    const leftExhaust = new THREE.Mesh(exhaustPipeGeo, chromeMaterial);
    leftExhaust.position.set(-0.45, 0.32, -2.25);
    carBodyGroup.add(leftExhaust);
    exhaustPipes.push(leftExhaust);

    const rightExhaust = leftExhaust.clone();
    rightExhaust.position.x = 0.45;
    carBodyGroup.add(rightExhaust);
    exhaustPipes.push(rightExhaust);

    // Nitro Flame Cones (Hidden by default, scale up during boost)
    const flameGeo = new THREE.ConeGeometry(0.12, 0.9, 12);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9
    });

    const leftFlame = new THREE.Mesh(flameGeo, flameMat);
    leftFlame.position.set(-0.45, 0.32, -2.75);
    leftFlame.visible = false;
    carBodyGroup.add(leftFlame);
    nitroFlames.push(leftFlame);

    const rightFlame = leftFlame.clone();
    rightFlame.position.x = 0.45;
    carBodyGroup.add(rightFlame);
    nitroFlames.push(rightFlame);

    const nitroLight = new THREE.PointLight(0x00f0ff, 0, 10);
    nitroLight.position.set(0, 0.32, -2.8);
    group.add(nitroLight);

    // ==============================================================
    // 6. FOUR REALISTIC 3D WHEELS & STEERING SUSPENSION
    // ==============================================================
    // Helper to build a complete 3D wheel: Rubber Tire + Rim + Brake Disc + Caliper
    const buildWheelAssembly = (): { wheelGroup: THREE.Group; spinMesh: THREE.Group } => {
      const knuckle = new THREE.Group(); // Steers left/right
      const spinGroup = new THREE.Group(); // Spins around X axis
      knuckle.add(spinGroup);

      // Tire Rubber (Cylinder rotated sideways)
      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 24);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMaterial);
      tire.castShadow = true;
      spinGroup.add(tire);

      // Alloy Rim Hub & Spokes
      const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.29, 16);
      rimGeo.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, chromeMaterial);
      spinGroup.add(rim);

      // 5 Rim Alloy Spokes
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(0.04, 0.24, 0.05);
        const spoke = new THREE.Mesh(spokeGeo, accentMaterial);
        spoke.position.set(0.14, 0, 0);
        spoke.rotation.x = (s * Math.PI * 2) / 5;
        spinGroup.add(spoke);
      }

      // Brake Rotor Disc
      const discGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16);
      discGeo.rotateZ(Math.PI / 2);
      const disc = new THREE.Mesh(discGeo, chromeMaterial);
      disc.position.set(-0.04, 0, 0);
      spinGroup.add(disc);

      // High-Performance Painted Brake Caliper (Stationary on knuckle)
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.12, 0.16);
      const caliperMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.6 });
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(-0.06, 0.14, 0.06);
      knuckle.add(caliper);

      return { wheelGroup: knuckle, spinMesh: spinGroup };
    };

    // Front Left Wheel
    const fl = buildWheelAssembly();
    fl.wheelGroup.position.set(-0.95, 0.38, 1.35);
    group.add(fl.wheelGroup);

    // Front Right Wheel
    const fr = buildWheelAssembly();
    fr.wheelGroup.position.set(0.95, 0.38, 1.35);
    fr.wheelGroup.scale.x = -1; // Mirror outward rim
    group.add(fr.wheelGroup);

    // Rear Left Wheel (Fixed steering, wider offset)
    const rl = buildWheelAssembly();
    rl.wheelGroup.position.set(-0.98, 0.38, -1.35);
    group.add(rl.wheelGroup);

    // Rear Right Wheel (Fixed steering, wider offset)
    const rr = buildWheelAssembly();
    rr.wheelGroup.position.set(0.98, 0.38, -1.35);
    rr.wheelGroup.scale.x = -1;
    group.add(rr.wheelGroup);

    // ==============================================================
    // 7. CONTACT GROUND SHADOW PLANE
    // ==============================================================
    const shadowGeo = new THREE.PlaneGeometry(2.6, 5.0);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.55
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, 0.03, 0);
    group.add(shadowMesh);

    return {
      group,
      carModel: car,
      frontLeftWheel: fl.wheelGroup,
      frontRightWheel: fr.wheelGroup,
      rearLeftWheel: rl.wheelGroup,
      rearRightWheel: rr.wheelGroup,
      wheels: [fl.spinMesh, fr.spinMesh, rl.spinMesh, rr.spinMesh],
      brakeLights,
      headlights,
      exhaustPipes,
      nitroFlames,
      shadowMesh,
      headlightLight,
      brakeLight,
      nitroLight
    };
  }
}
