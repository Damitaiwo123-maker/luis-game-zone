import * as THREE from 'three';
import { WeaponId } from './types';

export class WeaponModel3D {
  /**
   * Builds a procedural 3D model for the given weapon ID
   */
  public static createWeaponMesh(weaponId: WeaponId, isPlayerHolding = true): THREE.Group {
    const group = new THREE.Group();
    group.name = `weapon_${weaponId}`;

    // Common materials
    const gunMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e2229,
      roughness: 0.35,
      metalness: 0.85,
    });
    const darkPolymerMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.6,
      metalness: 0.2,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.4,
      metalness: 0.5,
    });
    const glowingOpticMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
    });
    const woodStockMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.7,
      metalness: 0.1,
    });
    const hazardStripeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
      metalness: 0.3,
    });

    switch (weaponId) {
      case 'pistol': {
        // --- TACTICAL PISTOL ---
        // Lower receiver & grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.05), darkPolymerMat);
        grip.position.set(0, -0.04, -0.04);
        grip.rotation.x = -0.25;
        group.add(grip);

        // Slide (upper metal receiver)
        const slide = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.22), gunMetalMat);
        slide.position.set(0, 0.035, 0.03);
        group.add(slide);

        // Barrel muzzle
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 12), gunMetalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.035, 0.15);
        group.add(barrel);

        // Laser module under barrel
        const laserModule = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.08), accentMat);
        laserModule.position.set(0, 0.0, 0.08);
        group.add(laserModule);

        // Iron sights
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.01), glowingOpticMat);
        frontSight.position.set(0, 0.065, 0.13);
        group.add(frontSight);
        break;
      }

      case 'rifle': {
        // --- VANGUARD ASSAULT RIFLE ---
        // Main receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.35), darkPolymerMat);
        receiver.position.set(0, 0.02, 0.02);
        group.add(receiver);

        // Metal barrel & handguard
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.25), gunMetalMat);
        handguard.position.set(0, 0.03, 0.3);
        group.add(handguard);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 12), gunMetalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.035, 0.5);
        group.add(barrel);

        // Muzzle brake
        const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.02, 0.05, 12), gunMetalMat);
        muzzleBrake.rotation.x = Math.PI / 2;
        muzzleBrake.position.set(0, 0.035, 0.61);
        group.add(muzzleBrake);

        // Curved Magazine
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.08), darkPolymerMat);
        mag.position.set(0, -0.1, 0.1);
        mag.rotation.x = 0.2;
        group.add(mag);

        // Tactical Grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.055), darkPolymerMat);
        grip.position.set(0, -0.07, -0.1);
        grip.rotation.x = -0.3;
        group.add(grip);

        // Stock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.22), darkPolymerMat);
        stock.position.set(0, 0.01, -0.25);
        group.add(stock);

        // Holographic optic sight
        const opticBase = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.1), gunMetalMat);
        opticBase.position.set(0, 0.08, 0.05);
        group.add(opticBase);

        const opticLens = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.02), glowingOpticMat);
        opticLens.position.set(0, 0.09, 0.09);
        group.add(opticLens);
        break;
      }

      case 'smg': {
        // --- SPECTRE SMG ---
        // Compact frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.08, 0.26), darkPolymerMat);
        frame.position.set(0, 0.02, 0.02);
        group.add(frame);

        // Shrouded barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 12), gunMetalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.025, 0.22);
        group.add(barrel);

        // Silencer / Suppressor
        const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 16), gunMetalMat);
        suppressor.rotation.x = Math.PI / 2;
        suppressor.position.set(0, 0.025, 0.35);
        group.add(suppressor);

        // Extended stick mag
        const stickMag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.05), accentMat);
        stickMag.position.set(0, -0.1, 0.04);
        stickMag.rotation.x = -0.15;
        group.add(stickMag);

        // Ergonomic pistol grip
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), darkPolymerMat);
        grip.position.set(0, -0.06, -0.08);
        grip.rotation.x = -0.35;
        group.add(grip);

        // Folded wire stock
        const stockRod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.2, 8), gunMetalMat);
        stockRod1.rotation.x = Math.PI / 2;
        stockRod1.position.set(0.03, 0.02, -0.18);
        group.add(stockRod1);

        const stockRod2 = stockRod1.clone();
        stockRod2.position.x = -0.03;
        group.add(stockRod2);
        break;
      }

      case 'shotgun': {
        // --- BREACHER SHOTGUN ---
        // Heavy steel receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 0.32), gunMetalMat);
        receiver.position.set(0, 0.02, -0.02);
        group.add(receiver);

        // Heavy twin barrel & pump tube
        const topBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.42, 16), gunMetalMat);
        topBarrel.rotation.x = Math.PI / 2;
        topBarrel.position.set(0, 0.04, 0.3);
        group.add(topBarrel);

        const lowerTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.38, 16), gunMetalMat);
        lowerTube.rotation.x = Math.PI / 2;
        lowerTube.position.set(0, -0.005, 0.28);
        group.add(lowerTube);

        // Ribbed Pump Slide
        const pumpSlide = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 16), darkPolymerMat);
        pumpSlide.rotation.x = Math.PI / 2;
        pumpSlide.position.set(0, -0.005, 0.24);
        group.add(pumpSlide);

        // Tactical rear pistol grip or polymer stock
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), darkPolymerMat);
        grip.position.set(0, -0.07, -0.14);
        grip.rotation.x = -0.3;
        group.add(grip);

        const fullStock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.22), darkPolymerMat);
        fullStock.position.set(0, 0.01, -0.28);
        group.add(fullStock);

        // Heat shield with vent holes
        const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.28), hazardStripeMat);
        heatShield.position.set(0, 0.068, 0.24);
        group.add(heatShield);
        break;
      }

      case 'sniper': {
        // --- APEX HEAVY SNIPER ---
        // Long receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.42), gunMetalMat);
        receiver.position.set(0, 0.02, -0.04);
        group.add(receiver);

        // Long heavy fluted barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.72, 16), gunMetalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.035, 0.52);
        group.add(barrel);

        // Massive muzzle brake
        const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.09), gunMetalMat);
        muzzleBrake.position.set(0, 0.035, 0.9);
        group.add(muzzleBrake);

        // Telescopic Optical Scope
        const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.28, 16), darkPolymerMat);
        scopeTube.rotation.x = Math.PI / 2;
        scopeTube.position.set(0, 0.12, 0.04);
        group.add(scopeTube);

        // Scope bell lenses
        const frontBell = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.03, 0.08, 16), gunMetalMat);
        frontBell.rotation.x = Math.PI / 2;
        frontBell.position.set(0, 0.12, 0.2);
        group.add(frontBell);

        const scopeLens = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), glowingOpticMat);
        scopeLens.position.set(0, 0.12, 0.24);
        group.add(scopeLens);

        // Mount rings
        const scopeMount1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.02), gunMetalMat);
        scopeMount1.position.set(0, 0.075, -0.04);
        group.add(scopeMount1);
        const scopeMount2 = scopeMount1.clone();
        scopeMount2.position.z = 0.12;
        group.add(scopeMount2);

        // Heavy adjustable stock
        const sniperStock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.28), darkPolymerMat);
        sniperStock.position.set(0, -0.01, -0.35);
        group.add(sniperStock);

        // Cheek rest
        const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.12), accentMat);
        cheekRest.position.set(0, 0.06, -0.32);
        group.add(cheekRest);

        // Folded bipod under barrel
        const bipodBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.04), gunMetalMat);
        bipodBase.position.set(0, -0.01, 0.45);
        group.add(bipodBase);
        break;
      }

      case 'bazooka': {
        // --- HAVOC-X ROCKET LAUNCHER ---
        // Main large cylinder launch tube
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.95, 20), darkPolymerMat);
        tube.rotation.x = Math.PI / 2;
        tube.position.set(0, 0.04, 0.1);
        group.add(tube);

        // Front bell mouth
        const frontBell = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.085, 0.1, 20), hazardStripeMat);
        frontBell.rotation.x = Math.PI / 2;
        frontBell.position.set(0, 0.04, 0.6);
        group.add(frontBell);

        // Rear exhaust nozzle
        const rearNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.12, 20), gunMetalMat);
        rearNozzle.rotation.x = Math.PI / 2;
        rearNozzle.position.set(0, 0.04, -0.42);
        group.add(rearNozzle);

        // Shoulder rest pad
        const shoulderPad = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), darkPolymerMat);
        shoulderPad.position.set(0, -0.06, -0.15);
        group.add(shoulderPad);

        // Dual tactical grips
        const frontGrip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.05), darkPolymerMat);
        frontGrip.position.set(0, -0.1, 0.25);
        group.add(frontGrip);

        const rearGrip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.05), darkPolymerMat);
        rearGrip.position.set(0, -0.1, 0.05);
        group.add(rearGrip);

        // Side Optic sight with laser rangefinder
        const sideOptic = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.14), accentMat);
        sideOptic.position.set(0.11, 0.08, 0.12);
        group.add(sideOptic);

        const rocketHeadInside = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 16), hazardStripeMat);
        rocketHeadInside.rotation.x = -Math.PI / 2;
        rocketHeadInside.position.set(0, 0.04, 0.58);
        group.add(rocketHeadInside);
        break;
      }

      case 'machinegun': {
        // --- TITAN-MG HEAVY MACHINE GUN ---
        // Massive metal receiver
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.42), gunMetalMat);
        receiver.position.set(0, 0.03, -0.02);
        group.add(receiver);

        // Heavy cooling jacket barrel
        const barrelJacket = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.48, 16), gunMetalMat);
        barrelJacket.rotation.x = Math.PI / 2;
        barrelJacket.position.set(0, 0.04, 0.4);
        group.add(barrelJacket);

        // Heavy Flash Hider
        const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 12), gunMetalMat);
        flashHider.rotation.x = Math.PI / 2;
        flashHider.position.set(0, 0.04, 0.68);
        group.add(flashHider);

        // Large Drum Ammo Box
        const ammoDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 20), hazardStripeMat);
        ammoDrum.rotation.z = Math.PI / 2;
        ammoDrum.position.set(0, -0.12, 0.06);
        group.add(ammoDrum);

        // Top carry handle
        const carryHandle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.18), darkPolymerMat);
        carryHandle.position.set(0, 0.12, 0.08);
        group.add(carryHandle);

        // Heavy stock
        const heavyStock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.22), darkPolymerMat);
        heavyStock.position.set(0, 0.01, -0.3);
        group.add(heavyStock);

        const spadeGrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.06), darkPolymerMat);
        spadeGrip.position.set(0, -0.08, -0.14);
        spadeGrip.rotation.x = -0.25;
        group.add(spadeGrip);
        break;
      }
    }

    // Attach Muzzle Anchor Point for tracer / flash alignment
    const muzzleAnchor = new THREE.Object3D();
    muzzleAnchor.name = 'muzzle_anchor';
    switch (weaponId) {
      case 'pistol':
        muzzleAnchor.position.set(0, 0.035, 0.2);
        break;
      case 'rifle':
        muzzleAnchor.position.set(0, 0.035, 0.65);
        break;
      case 'smg':
        muzzleAnchor.position.set(0, 0.025, 0.44);
        break;
      case 'shotgun':
        muzzleAnchor.position.set(0, 0.04, 0.54);
        break;
      case 'sniper':
        muzzleAnchor.position.set(0, 0.035, 0.96);
        break;
      case 'bazooka':
        muzzleAnchor.position.set(0, 0.04, 0.68);
        break;
      case 'machinegun':
        muzzleAnchor.position.set(0, 0.04, 0.74);
        break;
    }
    group.add(muzzleAnchor);

    // Scaling
    group.scale.set(1.15, 1.15, 1.15);

    // Enable shadows on all child meshes
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return group;
  }
}
