import * as THREE from 'three';
import { CharacterClassId, WeaponId } from './types';
import { WeaponModel3D } from './WeaponModel3D';

export interface HumanBoneRig {
  root: THREE.Group;
  pelvis: THREE.Group;
  torso: THREE.Group;
  chest: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  leftShoulder: THREE.Group;
  leftUpperArm: THREE.Group;
  leftForearm: THREE.Group;
  leftHand: THREE.Group;
  rightShoulder: THREE.Group;
  rightUpperArm: THREE.Group;
  rightForearm: THREE.Group;
  rightHand: THREE.Group;
  weaponHolder: THREE.Group;
  leftThigh: THREE.Group;
  leftShin: THREE.Group;
  leftFoot: THREE.Group;
  rightThigh: THREE.Group;
  rightShin: THREE.Group;
  rightFoot: THREE.Group;
  muzzleAnchor?: THREE.Object3D;
  currentWeaponMesh?: THREE.Group;
  backpack?: THREE.Group;
  jacketMesh?: THREE.Mesh;
  hairGroup?: THREE.Group;
}

export class HumanModel3D {
  /**
   * Generates a fully articulated 3D realistic human character model
   */
  public static createHumanCharacter(
    options: {
      isPlayer?: boolean;
      classId?: CharacterClassId;
      isEnemy?: boolean;
      enemyType?: 'soldier' | 'scout' | 'heavy' | 'sniper';
      weaponId?: WeaponId;
      primaryColor?: string;
      accentColor?: string;
    } = {}
  ): { modelGroup: THREE.Group; rig: HumanBoneRig } {
    const {
      isPlayer = false,
      classId = 'tactical',
      isEnemy = false,
      enemyType = 'soldier',
      weaponId = 'rifle',
      primaryColor,
      accentColor,
    } = options;

    const root = new THREE.Group();
    root.name = isPlayer ? 'PlayerCharacter' : isEnemy ? `Enemy_${enemyType}` : 'AllyCharacter';

    // Skin tones, clothing tones, and hair tones
    let skinColorHex = 0xdeb887; // Warm realistic human skin
    let hairColorHex = 0x2b1d0c; // Dark brown natural hair
    let jacketColorHex = 0x2563eb; // Stylish modern blue action jacket
    let pantsColorHex = 0x1e293b; // Slate cargo pants
    let bootsColorHex = 0x0f172a; // Tactical black leather boots
    let gearColorHex = 0x18181b; // Charcoal tactical webbing
    let eyeColorHex = 0x1e40af; // Deep blue eyes
    let accentHex = 0x38bdf8; // Accent cyan trim

    if (isPlayer) {
      // Classic Arcade Operative / Street Hero (White shirt, brown harness, dark trousers)
      skinColorHex = 0xe0ac69;
      hairColorHex = 0x3d2314; // Brown hair
      jacketColorHex = 0xf8fafc; // Clean white shirt / t-shirt
      pantsColorHex = 0x0f172a; // Dark black dress trousers
      gearColorHex = 0x78350f; // Brown leather shoulder harness
      accentHex = 0x38bdf8;
    } else if (isEnemy) {
      // Mafia Gangsters / Suited Syndicate Agents with sunglasses
      if (enemyType === 'soldier') {
        skinColorHex = 0xd2996d;
        hairColorHex = 0x18181b;
        jacketColorHex = 0x0f172a; // Black tailored mafia suit jacket
        pantsColorHex = 0x0f172a; // Black suit trousers
        gearColorHex = 0x18181b; // Black tie & belt
        accentHex = 0xef4444; // Crimson indicator
      } else if (enemyType === 'scout') {
        skinColorHex = 0xf5d0a9;
        hairColorHex = 0xb45309;
        jacketColorHex = 0x1e293b; // Midnight navy suit jacket
        pantsColorHex = 0x1e293b;
        gearColorHex = 0x0f172a;
        accentHex = 0xf97316;
      } else if (enemyType === 'heavy') {
        skinColorHex = 0x96613d;
        hairColorHex = 0x000000;
        jacketColorHex = 0x09090b; // Charcoal trench coat / heavy enforcer suit
        pantsColorHex = 0x09090b;
        gearColorHex = 0x27272a;
        accentHex = 0xdc2626;
      } else if (enemyType === 'sniper') {
        skinColorHex = 0xe0bb95;
        hairColorHex = 0x451a03;
        jacketColorHex = 0x1c1917; // Dark hitman suit
        pantsColorHex = 0x1c1917;
        gearColorHex = 0x000000;
        accentHex = 0x06b6d4;
      }
    }

    if (primaryColor) {
      jacketColorHex = parseInt(primaryColor.replace('#', '0x'), 16);
    }
    if (accentColor) {
      accentHex = parseInt(accentColor.replace('#', '0x'), 16);
    }

    // --- REALISTIC MATERIALS ---
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColorHex,
      roughness: 0.55,
      metalness: 0.05,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColorHex,
      roughness: 0.75,
      metalness: 0.1,
    });
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1,
    });
    const eyeIrisMat = new THREE.MeshStandardMaterial({
      color: eyeColorHex,
      roughness: 0.2,
      metalness: 0.2,
    });
    const eyePupilMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.1,
    });
    const eyebrowMat = new THREE.MeshStandardMaterial({
      color: hairColorHex,
      roughness: 0.8,
      metalness: 0.05,
    });
    const lipMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinColorHex).multiplyScalar(0.85).getHex(),
      roughness: 0.45,
      metalness: 0.05,
    });
    const jacketMat = new THREE.MeshStandardMaterial({
      color: jacketColorHex,
      roughness: 0.65,
      metalness: 0.15,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.05,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: pantsColorHex,
      roughness: 0.8,
      metalness: 0.1,
    });
    const bootsMat = new THREE.MeshStandardMaterial({
      color: bootsColorHex,
      roughness: 0.65,
      metalness: 0.2,
    });
    const gearMat = new THREE.MeshStandardMaterial({
      color: gearColorHex,
      roughness: 0.5,
      metalness: 0.35,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.3,
      metalness: 0.85,
    });
    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.6,
      metalness: 0.2,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      roughness: 0.3,
      metalness: 0.6,
      emissive: accentHex,
      emissiveIntensity: 0.25,
    });

    // ----------------------------------------------------
    // REALISTIC HUMAN ANATOMICAL SKELETON
    // Height: ~1.80m. Ground at Y=0. Pelvis at Y=0.95m.
    // ----------------------------------------------------
    const pelvis = new THREE.Group();
    pelvis.position.set(0, 0.94, 0);
    root.add(pelvis);

    // Anatomical Pelvis (contoured human hips with cargo pants)
    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.145, 0.19, 16), pantsMat);
    pelvisMesh.scale.set(1.18, 1.0, 0.82);
    pelvis.add(pelvisMesh);

    // Tactical Webbing Belt with Metallic Buckle
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.175, 0.065, 18), gearMat);
    belt.scale.set(1.19, 1.0, 0.84);
    belt.position.set(0, 0.06, 0);
    pelvis.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.02), metalMat);
    buckle.position.set(0, 0.06, 0.155);
    pelvis.add(buckle);

    // Sidearm Holster on Right Hip with molded pistol grip
    const holsterGroup = new THREE.Group();
    holsterGroup.position.set(0.195, -0.03, 0);
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.09), gearMat);
    holsterGroup.add(holster);
    const sidearmGrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.04), gearMat);
    sidearmGrip.rotation.x = -0.3;
    sidearmGrip.position.set(0, 0.07, -0.01);
    holsterGroup.add(sidearmGrip);
    pelvis.add(holsterGroup);

    // Dump Pouch on Left Hip
    const leftPouch = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.13, 0.08), gearMat);
    leftPouch.position.set(-0.195, -0.02, 0);
    pelvis.add(leftPouch);

    // --- TORSO (CHEST & MODERN COMBAT JACKET) ---
    const torso = new THREE.Group();
    torso.position.set(0, 0.12, 0);
    pelvis.add(torso);

    // Athletic Tapered Human Torso with Modern Jacket
    const jacketTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.188, 0.152, 0.38, 18), jacketMat);
    jacketTorso.scale.set(1.18, 1.0, 0.78);
    jacketTorso.position.set(0, 0.19, 0);
    torso.add(jacketTorso);

    // Jacket Zipper line down center
    const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.36, 0.015), metalMat);
    zipper.position.set(0, 0.19, 0.148);
    torso.add(zipper);

    // Folded Jacket Collar around neck
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.07, 16), jacketMat);
    collar.position.set(0, 0.38, 0);
    torso.add(collar);

    // Inner Crew Shirt visible at collar
    const innerShirt = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.05, 14), shirtMat);
    innerShirt.position.set(0, 0.38, 0.02);
    torso.add(innerShirt);

    // Low-Profile Tactical Chest Rig / Mag Pouches (Realistic tactical wear)
    const chestRig = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.035), gearMat);
    chestRig.position.set(0, 0.17, 0.145);
    torso.add(chestRig);

    // 2x Rifle Mag Pouches
    for (let i = -1; i <= 1; i += 2) {
      const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.04), gearMat);
      magPouch.position.set(i * 0.065, 0.15, 0.165);
      torso.add(magPouch);

      const magTop = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.025, 0.035), metalMat);
      magTop.position.set(i * 0.065, 0.21, 0.165);
      torso.add(magTop);
    }

    // Modern Tactical Action Backpack
    const backpack = new THREE.Group();
    backpack.position.set(0, 0.2, -0.15);

    const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.32, 0.12), gearMat);
    backpack.add(packMain);

    const packPocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.06), jacketMat);
    packPocket.position.set(0, -0.04, -0.08);
    backpack.add(packPocket);

    // Tactical Radio Whip Antenna
    const radioAntenna = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.28, 8), metalMat);
    radioAntenna.position.set(0.09, 0.22, -0.04);
    backpack.add(radioAntenna);

    torso.add(backpack);

    // --- NECK & HUMAN HEAD (VISIBLE FACE & NATURAL HAIR) ---
    const neck = new THREE.Group();
    neck.position.set(0, 0.39, 0);
    torso.add(neck);

    // Natural human neck with throat contour
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.075, 0.09, 14), skinMat);
    neckMesh.position.set(0, 0.045, 0);
    neck.add(neckMesh);

    const head = new THREE.Group();
    head.position.set(0, 0.09, 0);
    neck.add(head);

    // Anatomical Skull
    const skullMesh = new THREE.Mesh(new THREE.SphereGeometry(0.112, 18, 16), skinMat);
    skullMesh.scale.set(0.92, 1.15, 1.05);
    skullMesh.position.set(0, 0.11, 0);
    head.add(skullMesh);

    // Sculpted Jaw and Chin
    const jawMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.05, 0.10, 14), skinMat);
    jawMesh.scale.set(1.0, 1.0, 0.85);
    jawMesh.rotation.x = 0.2;
    jawMesh.position.set(0, 0.06, 0.045);
    head.add(jawMesh);

    // Human Nose (Bridge, tip, and nostrils)
    const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.045, 0.025), skinMat);
    noseBridge.position.set(0, 0.115, 0.12);
    head.add(noseBridge);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), skinMat);
    noseTip.position.set(0, 0.095, 0.132);
    head.add(noseTip);

    // Human Lips & Mouth
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.012, 0.015), lipMat);
    upperLip.position.set(0, 0.068, 0.118);
    head.add(upperLip);

    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.012, 0.015), lipMat);
    lowerLip.position.set(0, 0.052, 0.115);
    head.add(lowerLip);

    // Expressive Human Eyes (Left & Right)
    for (let i = -1; i <= 1; i += 2) {
      const eyeSocket = new THREE.Group();
      eyeSocket.position.set(i * 0.042, 0.125, 0.102);

      // Eye White (Sclera)
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 10), eyeWhiteMat);
      eyeSocket.add(eyeWhite);

      // Colored Iris
      const eyeIris = new THREE.Mesh(new THREE.CircleGeometry(0.009, 12), eyeIrisMat);
      eyeIris.position.set(0, 0, 0.015);
      eyeSocket.add(eyeIris);

      // Dark Pupil
      const eyePupil = new THREE.Mesh(new THREE.CircleGeometry(0.004, 10), eyePupilMat);
      eyePupil.position.set(0, 0, 0.016);
      eyeSocket.add(eyePupil);

      head.add(eyeSocket);

      // Natural Human Eyebrows
      const eyebrow = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.01), eyebrowMat);
      eyebrow.rotation.z = -i * 0.15;
      eyebrow.position.set(i * 0.044, 0.148, 0.115);
      head.add(eyebrow);

      // Human Ears (Left & Right)
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), skinMat);
      ear.scale.set(0.35, 1.1, 0.7);
      ear.position.set(i * 0.108, 0.11, 0);
      head.add(ear);
    }

    // --- NATURAL HUMAN HAIR STYLING ---
    const hairGroup = new THREE.Group();

    // Sculpted Modern Action Hair (Volumetric crown & tapered sides)
    const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.118, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
    hairCrown.scale.set(0.96, 1.12, 1.06);
    hairCrown.position.set(0, 0.13, -0.01);
    hairGroup.add(hairCrown);

    // Textured hair bangs/swept clumps in front
    const hairFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.06), hairMat);
    hairFront.rotation.x = -0.3;
    hairFront.position.set(0, 0.205, 0.08);
    hairGroup.add(hairFront);

    // Sideburns
    for (let i = -1; i <= 1; i += 2) {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.04), hairMat);
      sideburn.position.set(i * 0.105, 0.14, 0.03);
      hairGroup.add(sideburn);
    }
    head.add(hairGroup);

    // Dark Action Sunglasses (Classic Aviator / Operative shades)
    const shadesGroup = new THREE.Group();
    shadesGroup.position.set(0, 0.125, 0.118);
    const shadesGlassMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.1,
      metalness: 0.9,
    });
    const shadesFrameMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.8,
    });
    // Left & Right Lenses
    for (const sx of [-0.042, 0.042]) {
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.026, 0.012), shadesGlassMat);
      lens.position.x = sx;
      shadesGroup.add(lens);
    }
    // Bridge & Temples
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.006, 0.01), shadesFrameMat);
    bridge.position.set(0, 0.006, 0.002);
    shadesGroup.add(bridge);
    for (const sx of [-0.07, 0.07]) {
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.12), shadesFrameMat);
      temple.position.set(sx, 0.002, -0.05);
      shadesGroup.add(temple);
    }
    head.add(shadesGroup);

    // Tactical Comms Earpiece on Left Ear
    const commsEarpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 12), gearMat);
    commsEarpiece.rotation.z = Math.PI / 2;
    commsEarpiece.position.set(-0.115, 0.11, 0);
    head.add(commsEarpiece);

    // Flexible boom mic curving towards mouth
    const commsMic = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 8), metalMat);
    commsMic.rotation.x = 0.7;
    commsMic.rotation.z = -0.4;
    commsMic.position.set(-0.09, 0.08, 0.06);
    head.add(commsMic);

    // --- ARMS & HANDS (DELTOIDS, JACKET SLEEVES, TACTICAL GLOVES) ---
    // Left Shoulder
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(-0.24, 0.33, 0);
    torso.add(leftShoulder);

    const leftDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), jacketMat);
    leftShoulder.add(leftDeltoid);

    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.set(-0.02, -0.05, 0);
    leftShoulder.add(leftUpperArm);

    const leftUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.048, 0.22, 14), jacketMat);
    leftUpperArmMesh.position.set(0, -0.11, 0);
    leftUpperArm.add(leftUpperArmMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.22, 0);
    leftUpperArm.add(leftForearm);

    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.04, 0.22, 14), jacketMat);
    leftForearmMesh.position.set(0, -0.11, 0);
    leftForearm.add(leftForearmMesh);

    // Tactical Wrist Compass / Watch on Left Wrist
    const wristWatch = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12), metalMat);
    wristWatch.position.set(0, -0.19, 0);
    leftForearm.add(wristWatch);

    const leftHand = new THREE.Group();
    leftHand.position.set(0, -0.22, 0);
    leftForearm.add(leftHand);

    const leftPalm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.045), gloveMat);
    leftPalm.position.set(0, -0.04, 0);
    leftHand.add(leftPalm);

    const leftFingers = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.035), gloveMat);
    leftFingers.position.set(0, -0.075, 0.015);
    leftHand.add(leftFingers);

    // Right Shoulder & Arm (Weapon Mount)
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(0.24, 0.33, 0);
    torso.add(rightShoulder);

    const rightDeltoid = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), jacketMat);
    rightShoulder.add(rightDeltoid);

    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.set(0.02, -0.05, 0);
    rightShoulder.add(rightUpperArm);

    const rightUpperArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.048, 0.22, 14), jacketMat);
    rightUpperArmMesh.position.set(0, -0.11, 0);
    rightUpperArm.add(rightUpperArmMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.22, 0);
    rightUpperArm.add(rightForearm);

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.04, 0.22, 14), jacketMat);
    rightForearmMesh.position.set(0, -0.11, 0);
    rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Group();
    rightHand.position.set(0, -0.22, 0);
    rightForearm.add(rightHand);

    const rightPalm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.045), gloveMat);
    rightPalm.position.set(0, -0.04, 0);
    rightHand.add(rightPalm);

    const rightFingers = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.045, 0.035), gloveMat);
    rightFingers.position.set(0, -0.075, 0.015);
    rightHand.add(rightFingers);

    // Weapon Holder attached to Right Hand
    const weaponHolder = new THREE.Group();
    weaponHolder.position.set(0, -0.05, 0.06);
    rightHand.add(weaponHolder);

    // Initial 3D Weapon Model
    const weaponMesh = WeaponModel3D.createWeaponMesh(weaponId, isPlayer);
    weaponHolder.add(weaponMesh);

    let muzzleAnchor: THREE.Object3D | undefined;
    weaponMesh.traverse((child) => {
      if (child.name === 'muzzle_anchor') {
        muzzleAnchor = child;
      }
    });

    // --- LEGS & COMBAT BOOTS ---
    // Left Leg
    const leftThigh = new THREE.Group();
    leftThigh.position.set(-0.115, -0.06, 0);
    pelvis.add(leftThigh);

    const leftThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.064, 0.38, 16), pantsMat);
    leftThighMesh.position.set(0, -0.19, 0);
    leftThigh.add(leftThighMesh);

    // Cargo Pocket on Thigh
    const leftCargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.11), pantsMat);
    leftCargoPocket.position.set(-0.072, -0.18, 0);
    leftThigh.add(leftCargoPocket);

    // Anatomical Knee Joint & Pad
    const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), gearMat);
    leftKnee.position.set(0, -0.38, 0.01);
    leftThigh.add(leftKnee);

    const leftShin = new THREE.Group();
    leftShin.position.set(0, -0.38, 0);
    leftThigh.add(leftShin);

    const leftShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.05, 0.38, 16), pantsMat);
    leftShinMesh.position.set(0, -0.19, 0);
    leftShin.add(leftShinMesh);

    const leftFoot = new THREE.Group();
    leftFoot.position.set(0, -0.38, 0);
    leftShin.add(leftFoot);

    // Detailed Combat Tactical Boot
    const leftBootAnkle = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.055, 0.12, 14), bootsMat);
    leftBootAnkle.position.set(0, -0.04, 0);
    leftFoot.add(leftBootAnkle);

    const leftBootSole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.24), bootsMat);
    leftBootSole.position.set(0, -0.09, 0.045);
    leftFoot.add(leftBootSole);

    const leftBootToe = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), bootsMat);
    leftBootToe.scale.set(0.95, 0.65, 1.2);
    leftBootToe.position.set(0, -0.065, 0.11);
    leftFoot.add(leftBootToe);

    // Right Leg
    const rightThigh = new THREE.Group();
    rightThigh.position.set(0.115, -0.06, 0);
    pelvis.add(rightThigh);

    const rightThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.064, 0.38, 16), pantsMat);
    rightThighMesh.position.set(0, -0.19, 0);
    rightThigh.add(rightThighMesh);

    // Cargo Pocket on Right Thigh
    const rightCargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.12, 0.11), pantsMat);
    rightCargoPocket.position.set(0.072, -0.18, 0);
    rightThigh.add(rightCargoPocket);

    const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.058, 12, 10), gearMat);
    rightKnee.position.set(0, -0.38, 0.01);
    rightThigh.add(rightKnee);

    const rightShin = new THREE.Group();
    rightShin.position.set(0, -0.38, 0);
    rightThigh.add(rightShin);

    const rightShinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.05, 0.38, 16), pantsMat);
    rightShinMesh.position.set(0, -0.19, 0);
    rightShin.add(rightShinMesh);

    const rightFoot = new THREE.Group();
    rightFoot.position.set(0, -0.38, 0);
    rightShin.add(rightFoot);

    const rightBootAnkle = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.055, 0.12, 14), bootsMat);
    rightBootAnkle.position.set(0, -0.04, 0);
    rightFoot.add(rightBootAnkle);

    const rightBootSole = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.045, 0.24), bootsMat);
    rightBootSole.position.set(0, -0.09, 0.045);
    rightFoot.add(rightBootSole);

    const rightBootToe = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), bootsMat);
    rightBootToe.scale.set(0.95, 0.65, 1.2);
    rightBootToe.position.set(0, -0.065, 0.11);
    rightFoot.add(rightBootToe);

    // Shadows
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const rig: HumanBoneRig = {
      root,
      pelvis,
      torso,
      chest: torso,
      neck,
      head,
      leftShoulder,
      leftUpperArm,
      leftForearm,
      leftHand,
      rightShoulder,
      rightUpperArm,
      rightForearm,
      rightHand,
      weaponHolder,
      leftThigh,
      leftShin,
      leftFoot,
      rightThigh,
      rightShin,
      rightFoot,
      muzzleAnchor,
      currentWeaponMesh: weaponMesh,
      backpack,
      jacketMesh: jacketTorso,
      hairGroup,
    };

    return { modelGroup: root, rig };
  }

  /**
   * Updates weapon mesh on character
   */
  public static updateWeapon(rig: HumanBoneRig, newWeaponId: WeaponId, isPlayer = true): void {
    if (rig.currentWeaponMesh) {
      rig.weaponHolder.remove(rig.currentWeaponMesh);
    }
    const newWeapon = WeaponModel3D.createWeaponMesh(newWeaponId, isPlayer);
    rig.weaponHolder.add(newWeapon);
    rig.currentWeaponMesh = newWeapon;

    let muzzle: THREE.Object3D | undefined;
    newWeapon.traverse((child) => {
      if (child.name === 'muzzle_anchor') {
        muzzle = child;
      }
    });
    rig.muzzleAnchor = muzzle;
  }

  /**
   * Evaluates natural procedural human animations
   */
  public static animateRig(
    rig: HumanBoneRig,
    animParams: {
      time: number;
      speed: number;
      isMoving: boolean;
      isSprinting: boolean;
      isCrouching: boolean;
      isAiming: boolean;
      isReloading: boolean;
      reloadProgress?: number;
      fireRecoil?: number;
      hitFlinch?: number;
      pitch?: number;
      isDead?: boolean;
      deathProgress?: number;
      isGrounded?: boolean;
    }
  ): void {
    const {
      time,
      isMoving,
      isSprinting,
      isCrouching,
      isAiming,
      isReloading,
      reloadProgress = 0,
      fireRecoil = 0,
      hitFlinch = 0,
      pitch = 0,
      isDead = false,
      deathProgress = 0,
      isGrounded = true,
    } = animParams;

    if (isDead) {
      // Natural human ragdoll collapse
      const p = Math.min(1, Math.max(0, deathProgress));
      rig.pelvis.position.y = THREE.MathUtils.lerp(0.94, 0.18, p);
      rig.root.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2.2, p);
      rig.root.rotation.z = THREE.MathUtils.lerp(0, 0.35, p);
      rig.torso.rotation.x = THREE.MathUtils.lerp(0, 0.25, p);
      rig.leftThigh.rotation.x = THREE.MathUtils.lerp(0, -0.5, p);
      rig.rightThigh.rotation.x = THREE.MathUtils.lerp(0, 0.4, p);
      rig.leftUpperArm.rotation.x = THREE.MathUtils.lerp(0, -0.7, p);
      rig.rightUpperArm.rotation.x = THREE.MathUtils.lerp(0, -0.4, p);
      return;
    }

    rig.root.rotation.set(0, 0, 0);

    // Crouch height offset
    const targetPelvisY = isCrouching ? 0.68 : 0.94;
    rig.pelvis.position.y = targetPelvisY;

    // Movement stride frequency and physics
    const strideFreq = isSprinting ? 12 : isMoving ? 8.2 : 2.2;
    const strideAngle = isSprinting ? 0.72 : 0.46;
    const legSwing = isMoving && isGrounded ? Math.sin(time * strideFreq) * strideAngle : 0;
    const bobbing = isMoving && isGrounded ? Math.abs(Math.sin(time * strideFreq)) * 0.045 : Math.sin(time * 2.2) * 0.01;

    rig.pelvis.position.y += bobbing;

    // In-air jump / fall leg pose
    if (!isGrounded) {
      rig.leftThigh.rotation.x = -0.4;
      rig.leftShin.rotation.x = 0.6;
      rig.rightThigh.rotation.x = 0.3;
      rig.rightShin.rotation.x = 0.2;
    } else if (isCrouching) {
      rig.leftThigh.rotation.x = -0.85 + legSwing * 0.4;
      rig.leftShin.rotation.x = 1.25;
      rig.rightThigh.rotation.x = -0.65 - legSwing * 0.4;
      rig.rightShin.rotation.x = 1.05;
    } else {
      rig.leftThigh.rotation.x = legSwing;
      rig.leftShin.rotation.x = legSwing < 0 ? Math.abs(legSwing) * 0.88 : 0;
      rig.rightThigh.rotation.x = -legSwing;
      rig.rightShin.rotation.x = legSwing > 0 ? legSwing * 0.88 : 0;
    }

    // Upper Torso Pitch & Direction
    const aimPitchClamped = Math.max(-0.85, Math.min(0.85, pitch));
    rig.torso.rotation.x = (isSprinting ? 0.22 : 0) + (isCrouching ? 0.18 : 0) - aimPitchClamped * 0.62;
    rig.torso.rotation.y = isMoving ? Math.sin(time * strideFreq) * 0.05 : 0;
    rig.head.rotation.x = -aimPitchClamped * 0.38;

    // Flinch reaction
    if (hitFlinch > 0) {
      rig.torso.rotation.x -= hitFlinch * 0.2;
      rig.head.rotation.y += Math.sin(time * 25) * hitFlinch * 0.18;
    }

    // Recoil kickback
    if (fireRecoil > 0) {
      rig.torso.rotation.x -= fireRecoil * 0.14;
      rig.rightUpperArm.position.z -= fireRecoil * 0.05;
    } else {
      rig.rightUpperArm.position.z = 0;
    }

    // Natural Arm Poses (Reloading, Aiming ADS, Sprinting, or Idle Stance)
    if (isReloading) {
      const reloadCycle = Math.sin(reloadProgress * Math.PI);
      rig.rightShoulder.rotation.set(-0.5, 0.2, 0);
      rig.rightUpperArm.rotation.set(-0.35, 0.1, 0.3);
      rig.rightForearm.rotation.set(-0.85, 0, 0);

      rig.leftShoulder.rotation.set(-0.2, -0.4, 0);
      rig.leftUpperArm.rotation.set(0.18 - reloadCycle * 0.55, 0.2, -0.2);
      rig.leftForearm.rotation.set(-0.75 - reloadCycle * 0.65, 0, 0);
    } else if (isAiming) {
      // ADS Precision Aim: Weapon raised to shoulder line, head tilted to sights
      rig.rightShoulder.rotation.set(0, 0.15, 0);
      rig.rightUpperArm.rotation.set(-1.48, 0.08, 0.28);
      rig.rightForearm.rotation.set(-0.48, 0.18, 0);

      rig.leftShoulder.rotation.set(0, -0.15, 0);
      rig.leftUpperArm.rotation.set(-1.32, -0.32, -0.48);
      rig.leftForearm.rotation.set(-1.08, 0.38, 0);

      // Subtle breath stabilization
      const aimBreath = Math.sin(time * 1.8) * 0.008;
      rig.rightUpperArm.rotation.x += aimBreath;
      rig.leftUpperArm.rotation.x += aimBreath;
    } else if (isSprinting) {
      // Tactical Sprint: Weapon held tight across chest
      const armSwing = Math.sin(time * strideFreq) * 0.42;
      rig.rightShoulder.rotation.set(-0.38 + armSwing * 0.25, 0.28, 0);
      rig.rightUpperArm.rotation.set(-0.78, 0.18, 0.58);
      rig.rightForearm.rotation.set(-0.68, 0, 0);

      rig.leftShoulder.rotation.set(0.28 - armSwing * 0.45, -0.18, 0);
      rig.leftUpperArm.rotation.set(0.18 - armSwing * 0.35, -0.1, -0.18);
      rig.leftForearm.rotation.set(-0.58, 0, 0);
    } else {
      // Natural Tactical Idle / Hipfire Ready
      const idleBreathe = Math.sin(time * 2.2) * 0.025;
      rig.rightShoulder.rotation.set(idleBreathe, 0.1, 0);
      rig.rightUpperArm.rotation.set(-1.18, 0.14, 0.34);
      rig.rightForearm.rotation.set(-0.64, 0.1, 0);

      rig.leftShoulder.rotation.set(idleBreathe, -0.1, 0);
      rig.leftUpperArm.rotation.set(-0.96, -0.24, -0.38);
      rig.leftForearm.rotation.set(-0.98, 0.28, 0);
    }
  }
}
