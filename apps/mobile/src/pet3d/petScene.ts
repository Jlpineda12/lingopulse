import * as THREE from 'three';
import type { PetConfig, PetMood, PetStage } from '../game/pet';
import { box, createToonRamp, cylinder, ellipsoid, OUTLINE_MAT, toon } from './toonKit';
import { buildHouseDiorama, buildIslandFurniture, type HouseDiorama, type HouseSceneOptions } from './petHouse';

/**
 * Escena 3D de la mascota con estética Toon / Cel-Shaded estilo PS2 + Cairn
 * y sistema de personalización + emociones reactivas estilo Tomodachi Life:
 * - Creador físico 3D: complexión (chibi, chubby, tall, normal), cejas 3D (soft, bold, hero, worried, raised),
 *   boca 3D (smile, cat :3, grin, smirk, o), mejillas (pink, peach, freckles, star, none), ojos (incluye wink y fierce).
 * - Emociones inmersivas con VFX 3D:
 *   · angry / rage (enojo e ira cómica con enrojecimiento, temblor, marca 💢 3D y vapor sobre la cabeza)
 *   · love (corazones 3D flotando al acariciar)
 *   · eating (masticación animada al alimentar)
 *   · celebrate (pirueta 360° y explosión de estrellas al acertar)
 *   · sleepy (ojos dormidos, cabeceo, burbuja de sueño y Zzz)
 */

export interface PetSceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update: (dt: number, t: number) => void;
  setMood: (mood: PetMood) => void;
  setSpeaking: (speaking: boolean) => void;
  setEnergy: (energy01: number) => void;
  joy: () => void;
  drag: (dx: number, dy: number) => void;
  release: () => void;
  dispose: () => void;
}

/** Roca low-poly facetada estilo Cairn (escalada / ilustración gráfica 3D). */
function createCairnRockPedestal(): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, -1.04, 0);

  const topGeo = new THREE.CylinderGeometry(1.12, 1.22, 0.16, 9);
  const topMat = new THREE.MeshLambertMaterial({
    color: 0x56d39a,
    flatShading: true,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = 0.04;

  const topOutline = new THREE.Mesh(topGeo, OUTLINE_MAT);
  topOutline.scale.set(1.035, 1.18, 1.035);
  topMesh.add(topOutline);
  g.add(topMesh);

  const cliffGeo = new THREE.CylinderGeometry(1.18, 0.42, 0.56, 8, 2);
  const pos = cliffGeo.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      const z = pos.getZ(i);
      if (y < 0.2) {
        const angle = Math.atan2(z, x);
        const jag = 1 + Math.sin(angle * 3) * 0.14 + Math.cos(angle * 5) * 0.08;
        pos.setX(i, x * jag);
        pos.setZ(i, z * jag);
      }
    }
    cliffGeo.computeVertexNormals();
  }
  const cliffMat = new THREE.MeshLambertMaterial({
    color: 0x8f9bb3,
    flatShading: true,
  });
  const cliffMesh = new THREE.Mesh(cliffGeo, cliffMat);
  cliffMesh.position.y = -0.30;
  const cliffOutline = new THREE.Mesh(cliffGeo, OUTLINE_MAT);
  cliffOutline.scale.set(1.04, 1.06, 1.04);
  cliffMesh.add(cliffOutline);
  g.add(cliffMesh);

  const stoneGeo = new THREE.DodecahedronGeometry(0.14, 0);
  const stoneMat = new THREE.MeshLambertMaterial({
    color: 0xaab6cc,
    flatShading: true,
  });
  const s1 = new THREE.Mesh(stoneGeo, stoneMat);
  s1.position.set(-0.88, 0.12, 0.28);
  s1.scale.set(1.1, 0.7, 0.9);
  const s2 = new THREE.Mesh(stoneGeo, stoneMat);
  s2.position.set(0.84, 0.11, -0.22);
  s2.scale.set(0.8, 0.65, 1.0);
  g.add(s1, s2);

  return g;
}

/** Construye un corazón 3D low-poly para el VFX de cariño (love). */
function createHeartMesh(mat: THREE.Material): THREE.Group {
  const hg = new THREE.Group();
  const l = ellipsoid(0.065, 0.085, 0.045, mat, 12, true, 0.015);
  l.position.set(-0.032, 0.02, 0);
  l.rotation.z = 0.45;
  const r = ellipsoid(0.065, 0.085, 0.045, mat, 12, true, 0.015);
  r.position.set(0.032, 0.02, 0);
  r.rotation.z = -0.45;
  hg.add(l, r);
  return hg;
}

/**
 * Construye el objeto 3D decorativo del Santuario sobre la roca flotante
 * (Estilo Cairn + Tomodachi Life, con contornos cel-shaded).
 */
function createHabitatProp3D(
  propId: string | undefined,
  toonRamp: THREE.DataTexture
): { group: THREE.Group; animate: (t: number, activePulse: boolean) => void } {
  const group = new THREE.Group();
  group.position.set(-0.92, 0.14, 0.24);
  group.rotation.y = 0.38;

  if (!propId || propId === 'none') {
    return { group, animate: () => {} };
  }

  const woodMat = toon(0x8b5a2b, toonRamp);
  const goldMat = toon(0xf4b942, toonRamp);
  const stoneMat = toon(0x94a3b8, toonRamp);

  if (propId === 'campfire') {
    // Piedras en círculo estilo Cairn + troncos + llama 3D viva
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 0), stoneMat);
      st.position.set(Math.cos(a) * 0.19, 0.03, Math.sin(a) * 0.19);
      group.add(st);
    }
    const log1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 8), woodMat);
    log1.rotation.z = Math.PI / 2;
    log1.rotation.y = 0.5;
    log1.position.y = 0.05;
    const log2 = log1.clone();
    log2.rotation.y = -0.6;
    group.add(log1, log2);

    const outerFlameMat = new THREE.MeshBasicMaterial({ color: 0xff5a1f });
    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
    const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.34, 8), outerFlameMat);
    outerFlame.position.y = 0.2;
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 8), innerFlameMat);
    innerFlame.position.set(0, 0.17, 0.02);
    const sparkOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), innerFlameMat);
    sparkOrb.position.set(0, 0.42, 0);
    group.add(outerFlame, innerFlame, sparkOrb);

    return {
      group,
      animate: (t) => {
        const flicker = 0.92 + Math.sin(t * 14) * 0.12 + Math.cos(t * 23) * 0.06;
        outerFlame.scale.set(1, flicker, 1);
        innerFlame.scale.set(1, 1.05 - (flicker - 1), 1);
        const rise = (t * 0.9) % 1;
        sparkOrb.position.y = 0.32 + rise * 0.28;
        sparkOrb.scale.setScalar(Math.sin(rise * Math.PI) * 0.9);
      },
    };
  }

  if (propId === 'boombox') {
    const casingMat = toon(0x2563eb, toonRamp);
    const speakerMat = toon(0x1e293b, toonRamp);
    const box = ellipsoid(0.24, 0.15, 0.12, casingMat, 16, true, 0.02);
    box.position.y = 0.15;
    const spL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 16), speakerMat);
    spL.rotation.x = Math.PI / 2;
    spL.position.set(-0.1, 0.14, 0.11);
    const spR = spL.clone();
    spR.position.x = 0.1;
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.018, 8, 16, Math.PI),
      goldMat
    );
    handle.position.set(0, 0.28, 0);
    group.add(box, spL, spR, handle);

    return {
      group,
      animate: (t, activePulse) => {
        const beat = Math.abs(Math.sin(t * (activePulse ? 14 : 6)));
        const bounce = 1 + beat * (activePulse ? 0.16 : 0.06);
        group.scale.set(bounce, 2 - bounce, bounce);
        spL.scale.setScalar(1 + beat * 0.22);
        spR.scale.setScalar(1 + beat * 0.22);
      },
    };
  }

  if (propId === 'bonsai') {
    const potMat = toon(0xe07a5f, toonRamp);
    const leafMat1 = toon(0x22c55e, toonRamp);
    const leafMat2 = toon(0x4ade80, toonRamp);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.14, 12), potMat);
    pot.position.y = 0.07;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.28, 8), woodMat);
    trunk.position.y = 0.24;
    trunk.rotation.z = -0.15;
    const foliage = new THREE.Group();
    foliage.position.set(-0.02, 0.38, 0);
    const c1 = ellipsoid(0.2, 0.1, 0.18, leafMat1, 14, true, 0.02);
    const c2 = ellipsoid(0.15, 0.09, 0.14, leafMat2, 14, true, 0.02);
    c2.position.set(0.06, 0.11, 0);
    const c3 = ellipsoid(0.11, 0.08, 0.11, leafMat1, 14, true, 0.02);
    c3.position.set(-0.04, 0.2, 0);
    foliage.add(c1, c2, c3);
    group.add(pot, trunk, foliage);

    return {
      group,
      animate: (t) => {
        foliage.rotation.z = Math.sin(t * 2.2) * 0.06;
      },
    };
  }

  if (propId === 'treasure') {
    const chestMat = toon(0x9a3412, toonRamp);
    const gemMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const base = ellipsoid(0.21, 0.13, 0.15, chestMat, 14, true, 0.02);
    base.position.y = 0.12;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 8, 16), goldMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.18;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), gemMat);
    gem.position.y = 0.34;
    group.add(base, rim, gem);

    return {
      group,
      animate: (t) => {
        gem.position.y = 0.34 + Math.sin(t * 3.2) * 0.05;
        gem.rotation.y = t * 2.2;
      },
    };
  }

  if (propId === 'telescope') {
    const tubeMat = toon(0xfbbf24, toonRamp);
    const lensMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 8), woodMat);
      leg.position.set(Math.cos(a) * 0.08, 0.14, Math.sin(a) * 0.08);
      leg.rotation.z = Math.cos(a) * 0.28;
      leg.rotation.x = -Math.sin(a) * 0.28;
      group.add(leg);
    }
    const barrel = new THREE.Group();
    barrel.position.set(0, 0.3, 0);
    barrel.rotation.z = 0.45;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.36, 14), tubeMat);
    tube.rotation.z = Math.PI / 2;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), lensMat);
    lens.position.set(0.185, 0, 0);
    lens.rotation.y = Math.PI / 2;
    barrel.add(tube, lens);
    group.add(barrel);

    return {
      group,
      animate: (t) => {
        barrel.rotation.y = Math.sin(t * 0.9) * 0.35;
      },
    };
  }

  return { group, animate: () => {} };
}

export interface PetSceneOptions {
  /** Casa de la mascota: nivel 0 = isla de campamento, 1–4 = diorama con paredes y muebles. */
  house?: HouseSceneOptions;
  /** Etapa de crecimiento (huevo → adulto). Por defecto adulto. */
  stage?: PetStage;
  /** 0–1: progreso hacia la siguiente etapa (el huevo se agrieta al acercarse a eclosionar). */
  growth?: number;
  /** 'face' acerca la cámara a la cara (editor de rasgos estilo Mii Maker). */
  focus?: 'face' | 'body';
}

export function createPetScene(
  config: PetConfig,
  aspect: number,
  options: PetSceneOptions = {}
): PetSceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 100);
  camera.position.set(0, 0.45, 7.55);
  camera.lookAt(0, 0.1, 0);

  const toonRamp = createToonRamp();

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  // Relleno de cielo/suelo para un sombreado limpio y suave.
  scene.add(new THREE.HemisphereLight(0xfff7ee, 0xc9d6ff, 0.55));
  const key = new THREE.DirectionalLight(0xfff6e5, 1.85);
  key.position.set(3.2, 4.8, 5.0);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xa8d0ff, 0.9);
  rim.position.set(-3.5, 2.2, -2.8);
  scene.add(rim);

  const houseTier = options.house?.tier ?? 0;
  const inHouse = houseTier > 0;
  const islandPedestal = createCairnRockPedestal();
  const habitatProp3D = createHabitatProp3D(
    inHouse ? 'none' : config.habitatProp ?? 'campfire',
    toonRamp
  );
  islandPedestal.add(habitatProp3D.group);
  let houseDiorama: HouseDiorama | null = null;
  if (inHouse && options.house) {
    houseDiorama = buildHouseDiorama(options.house, toonRamp);
    scene.add(houseDiorama.group);
    // Cámara más abierta para ver la habitación completa (vista "casita de muñecas").
    camera.position.set(0, 2.3, 11.6);
    camera.lookAt(0, 0.35, -0.55);
  } else {
    if (options.house) {
      houseDiorama = buildIslandFurniture(options.house.placed, toonRamp);
      islandPedestal.add(houseDiorama.group);
      // Plano un poco más abierto para ver el campamento completo.
      camera.position.set(0, 1.25, 9.0);
      camera.lookAt(0, -0.05, -0.2);
    }
    scene.add(islandPedestal);
  }

  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  // Contenedor: dentro de la casa la mascota se ve a escala de la habitación y con los pies en el piso.
  const stage = new THREE.Group();
  stage.add(root);
  scene.add(stage);
  if (inHouse) {
    const k = 0.82;
    stage.scale.setScalar(k);
    stage.position.y = -1.13 + 1.05 * k;
  }

  const isMeeseeks = config.species === 'meeseeks';
  const isHuman = config.species === 'human';
  /** Siluetas con cabeza pequeña sobre torso (muñeco esbelto y persona). */
  const isSlim = isMeeseeks || isHuman;
  const petStage = options.stage ?? 'adult';
  const tune = config.tuning ?? {};
  const tstep = (v?: number) => Math.max(-3, Math.min(3, Math.round(v ?? 0)));
  // Las personas llevan ojos algo más pequeños, como los Mii.
  const eyeK =
    (config.species === 'human' ? 0.82 : 1) *
    (petStage === 'baby' ? 1.2 : 1) *
    (1 + tstep(tune.eyeSize) * 0.09);
  const eyeDY = tstep(tune.eyeHeight) * 0.025;
  const eyeDX = tstep(tune.eyeSpacing) * 0.022;
  const browK = 1 + tstep(tune.browSize) * 0.12;
  const browDY = tstep(tune.browHeight) * 0.022;
  const noseK = 1 + tstep(tune.noseSize) * 0.12;
  const noseDY = tstep(tune.noseHeight) * 0.022;
  const mouthK = 1 + tstep(tune.mouthSize) * 0.1;
  const mouthDY = tstep(tune.mouthHeight) * 0.022;
  const eyeSY = 1 + tstep(tune.eyeStretch) * 0.1;
  const eyeSX = 1 - tstep(tune.eyeStretch) * 0.04;
  const eyeRot = tstep(tune.eyeRotation) * 0.09;
  const browSX = 1 + tstep(tune.browStretch) * 0.13;
  const browRot = tstep(tune.browRotation) * 0.09;
  const browDX = tstep(tune.browSpacing) * 0.022;
  const mouthSX = 1 + tstep(tune.mouthStretch) * 0.12;
  const mustK = 1 + tstep(tune.mustacheSize) * 0.12;
  const mustSX = 1 + tstep(tune.mustacheStretch) * 0.12;
  const mustDY = tstep(tune.mustacheHeight) * 0.02;
  const glassK = 1 + tstep(tune.glassesSize) * 0.07;
  const glassDY = tstep(tune.glassesHeight) * 0.02;
  /** Forma de la cara (solo personas): ancho, alto y fondo de la cabeza. */
  const faceShape = config.faceShape ?? 'round';
  const humanHead =
    faceShape === 'oval'
      ? { w: 0.64, h: 0.76, d: 0.64 }
      : faceShape === 'square'
        ? { w: 0.72, h: 0.7, d: 0.66 }
        : faceShape === 'long'
          ? { w: 0.62, h: 0.82, d: 0.62 }
          : faceShape === 'wide'
            ? { w: 0.8, h: 0.66, d: 0.68 }
            : faceShape === 'heart'
              ? { w: 0.72, h: 0.72, d: 0.66 }
              : { w: 0.7, h: 0.72, d: 0.66 };
  /**
   * Proporciones de persona: la cara se modela a escala "chibi" (centro en y = 0.42) y luego
   * toda la cabeza se reduce y se sube sobre un cuerpo más largo, como un Mii.
   */
  const HUMAN_HEAD_K = 0.74;
  const HUMAN_HEAD_Y = 0.74;
  const rigY = isHuman ? 0.42 : 0;
  const humanHeadParts: THREE.Object3D[] = [];
  /** Parches de barriga: se ocultan cuando la ropa cubre el torso. */
  const bellyParts: THREE.Object3D[] = [];
  const humanSleeves: THREE.Mesh[] = [];
  let humanArms: THREE.Group[] | null = null;
  const isCat = config.species === 'cat';
  const isDragon = config.species === 'dragon';
  const isBear = config.species === 'bear';
  const isBunny = config.species === 'bunny';

  const baseBodyColor = new THREE.Color(config.bodyColor);
  const rageFlushColor = new THREE.Color(0xff3b30);
  const angryFlushColor = new THREE.Color(0xff6b52);
  const accent = new THREE.Color(config.bellyColor);
  const accentHsl = { h: 0, s: 0, l: 0 };
  accent.getHSL(accentHsl);
  const feetColor =
    accentHsl.l > 0.9 ? baseBodyColor.clone().offsetHSL(0, 0.05, -0.22) : accent;

  const bodyMat = toon(baseBodyColor, toonRamp);
  const limbMat = toon(baseBodyColor.clone().offsetHSL(0, 0.02, -0.04), toonRamp);
  const feetMat = toon(feetColor, toonRamp);
  const creamBellyMat = toon(0xfff7eb, toonRamp);
  const goldMat = toon(0xf4b942, toonRamp);
  const customHairColor = new THREE.Color(config.hairColor ?? '#4A2E1B');
  const hairMat = toon(customHairColor, toonRamp);
  const pinkNoseMat = toon(0xff6b9d, toonRamp);
  const darkNoseMat = toon(0x28243d, toonRamp);
  const whiskerMat = new THREE.MeshBasicMaterial({ color: 0x1e2436 });

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x151a3d });
  const irisMat = new THREE.MeshBasicMaterial({
    color: config.eyeColor ? new THREE.Color(config.eyeColor) : isMeeseeks ? 0x151a3d : 0x3b7bff,
  });
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mouthMat = new THREE.MeshBasicMaterial({
    color: config.lipColor ? new THREE.Color(config.lipColor).multiplyScalar(0.7) : 0x2b1020,
  });
  const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff6b8b });

  const headY = isHuman ? 0.42 : isSlim ? 0.36 : isCat ? 0.24 : isDragon ? 0.16 : 0.0;
  const faceZ = isSlim ? 0.66 : isCat ? 0.82 : isDragon ? 0.88 : 0.95;

  let tailGroup: THREE.Group | null = null;
  let wingL: THREE.Group | null = null;
  let wingR: THREE.Group | null = null;
  const bunnyEars: THREE.Object3D[] = [];

  if (isHuman) {
    // Persona estilo Mii: cabeza redonda, torso con camiseta, pantalón, piernas y zapatos.
    // Con camisa y corbata u overol, la camiseta de base es blanca.
    const shirtMat = toon(
      config.outfit === 'shirttie' || config.outfit === 'overalls' || config.outfit === 'stripes' ? 0xffffff : accent,
      toonRamp
    );
    const pantsMat = toon(new THREE.Color(config.pantsColor ?? '#3B4A6B'), toonRamp);
    const headMesh = ellipsoid(humanHead.w, humanHead.h, humanHead.d, bodyMat, 28, true, 0.045);
    headMesh.position.set(0, 0.42, 0);
    humanHeadParts.push(headMesh);
    if (faceShape === 'square') {
      // Mandíbula marcada
      const jaw = ellipsoid(humanHead.w * 0.95, 0.36, humanHead.d * 0.9, bodyMat, 24, true, 0.04);
      jaw.position.set(0, 0.12, 0.02);
      humanHeadParts.push(jaw);
    } else if (faceShape === 'heart') {
      // Barbilla en punta suave
      const chin = ellipsoid(0.28, 0.24, 0.36, bodyMat, 18, true, 0.035);
      chin.position.set(0, -0.12, 0.28);
      humanHeadParts.push(chin);
    }
    [-1, 1].forEach((side) => {
      const ear = ellipsoid(0.11, 0.15, 0.08, bodyMat, 14, true, 0.022);
      ear.position.set(side * (humanHead.w - 0.01), 0.38, 0.02);
      humanHeadParts.push(ear);
    });
    body.add(...humanHeadParts);
    const neck = cylinder(0.1, 0.11, 0.18, bodyMat, 14, 0);
    neck.position.set(0, 0.17, 0);
    const shirt = ellipsoid(0.38, 0.36, 0.28, shirtMat, 26, true, 0.04);
    shirt.position.set(0, -0.19, 0);
    const hips = ellipsoid(0.33, 0.15, 0.25, pantsMat, 22, true, 0.035);
    hips.position.set(0, -0.47, 0);
    body.add(neck, shirt, hips);
    [-1, 1].forEach((side) => {
      const leg = cylinder(0.105, 0.095, 0.36, pantsMat, 14);
      leg.position.set(side * 0.13, -0.66, 0.0);
      body.add(leg);
    });
    // Brazos con hombro como pivote: manga del color favorito, brazo y mano.
    humanArms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.33, 0.0, 0.0);
      const sleeve = ellipsoid(0.105, 0.15, 0.105, toon(accent, toonRamp), 16, true, 0.025);
      sleeve.position.y = -0.1;
      humanSleeves.push(sleeve);
      const arm = cylinder(0.062, 0.056, 0.3, bodyMat, 12, 1.12);
      arm.position.y = -0.32;
      const hand = ellipsoid(0.078, 0.085, 0.072, bodyMat, 14, true, 0.02);
      hand.position.y = -0.5;
      pivot.add(arm, sleeve, hand);
      body.add(pivot);
      return pivot;
    });
  } else if (isMeeseeks) {
    const headMesh = ellipsoid(0.68, 0.76, 0.64, bodyMat, 28, true, 0.045);
    headMesh.position.set(0, 0.36, 0);
    const neckTorso = ellipsoid(0.52, 0.78, 0.46, bodyMat, 28, true, 0.045);
    neckTorso.position.set(0, -0.28, 0);
    body.add(headMesh, neckTorso);
  } else if (isCat) {
    const catHead = ellipsoid(0.86, 0.74, 0.80, bodyMat, 28, true, 0.045);
    catHead.position.set(0, 0.24, 0);
    [-1, 1].forEach((side) => {
      const puffCheek = ellipsoid(0.35, 0.28, 0.32, bodyMat, 18, false);
      puffCheek.position.set(side * 0.52, 0.12, 0.32);
      body.add(puffCheek);
    });
    const catTorso = ellipsoid(0.72, 0.66, 0.68, bodyMat, 28, true, 0.045);
    catTorso.position.set(0, -0.36, -0.02);
    const bellyPatch = ellipsoid(0.48, 0.44, 0.22, creamBellyMat, 20, false);
    bellyPatch.position.set(0, -0.36, 0.5);
    bellyParts.push(bellyPatch);
    body.add(catHead, catTorso, bellyPatch);

    [-1, 1].forEach((side) => {
      const earGeo = new THREE.ConeGeometry(0.26, 0.48, 16);
      const ear = new THREE.Mesh(earGeo, limbMat);
      ear.position.set(side * 0.48, 0.88, 0.02);
      ear.rotation.z = -side * 0.36;
      const earOut = new THREE.Mesh(earGeo, OUTLINE_MAT);
      earOut.scale.set(1.14, 1.08, 1.14);
      ear.add(earOut);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.28, 12), pinkNoseMat);
      inner.position.set(0, -0.03, 0.11);
      ear.add(inner);
      body.add(ear);
    });

    const nose = ellipsoid(0.065, 0.048, 0.045, pinkNoseMat, 12, false);
    nose.position.set(0, 0.22, 0.82);
    body.add(nose);

    [-1, 1].forEach((side) => {
      [-0.08, 0, 0.08].forEach((angleOffset, idx) => {
        const w = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.007, 0.38, 6),
          whiskerMat
        );
        w.rotation.z = Math.PI / 2 + side * (0.12 + angleOffset);
        w.rotation.y = -side * 0.28;
        w.position.set(side * 0.66, 0.16 + (idx - 1) * 0.055, 0.66);
        body.add(w);
      });
    });

    tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.52, -0.58);
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.18, 0.18, -0.28),
      new THREE.Vector3(0.38, 0.55, -0.32),
      new THREE.Vector3(0.26, 0.88, -0.18),
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 20, 0.095, 10, false);
    const tailMesh = new THREE.Mesh(tailGeo, feetMat);
    const tailTip = ellipsoid(0.11, 0.11, 0.11, creamBellyMat, 12, true, 0.03);
    tailTip.position.set(0.26, 0.88, -0.18);
    tailGroup.add(tailMesh, tailTip);
    body.add(tailGroup);
  } else if (isDragon) {
    const dracoHead = ellipsoid(0.88, 0.78, 0.84, bodyMat, 28, true, 0.045);
    dracoHead.position.set(0, 0.2, 0);
    const dracoTorso = ellipsoid(0.78, 0.68, 0.74, bodyMat, 28, true, 0.045);
    dracoTorso.position.set(0, -0.34, -0.02);
    const dracoBelly = ellipsoid(0.54, 0.48, 0.24, creamBellyMat, 20, false);
    dracoBelly.position.set(0, -0.34, 0.56);
    bellyParts.push(dracoBelly);
    const snout = ellipsoid(0.28, 0.18, 0.22, limbMat, 18, false);
    snout.position.set(0, 0.14, 0.78);
    body.add(dracoHead, dracoTorso, dracoBelly, snout);

    [-1, 1].forEach((side) => {
      const hornGeo = new THREE.ConeGeometry(0.11, 0.38, 10);
      const horn = new THREE.Mesh(hornGeo, goldMat);
      horn.position.set(side * 0.36, 0.92, -0.04);
      horn.rotation.z = -side * 0.28;
      horn.rotation.x = -0.18;
      const hornOut = new THREE.Mesh(hornGeo, OUTLINE_MAT);
      hornOut.scale.set(1.16, 1.08, 1.16);
      horn.add(hornOut);
      body.add(horn);

      [0, 1].forEach((fIdx) => {
        const frill = ellipsoid(0.18, 0.07, 0.05, feetMat, 12, true, 0.025);
        frill.position.set(side * 0.84, 0.38 - fIdx * 0.18, 0.05);
        frill.rotation.z = side * (0.35 - fIdx * 0.2);
        body.add(frill);
      });
    });

    const makeWing = (side: number) => {
      const wg = new THREE.Group();
      wg.position.set(side * 0.45, -0.08, -0.62);
      const wingMain = ellipsoid(0.38, 0.26, 0.06, feetMat, 18, true, 0.03);
      wingMain.position.set(side * 0.28, 0.14, -0.05);
      wingMain.rotation.z = side * 0.35;
      const wingInner = ellipsoid(0.26, 0.16, 0.07, goldMat, 14, false);
      wingInner.position.set(side * 0.24, 0.1, -0.03);
      wingInner.rotation.z = side * 0.35;
      wg.add(wingMain, wingInner);
      return wg;
    };
    wingL = makeWing(-1);
    wingR = makeWing(1);
    body.add(wingL, wingR);

    tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.55, -0.62);
    const dTail = ellipsoid(0.18, 0.16, 0.45, bodyMat, 16, true, 0.035);
    dTail.position.set(0, -0.04, -0.25);
    dTail.rotation.x = 0.35;
    const spikeTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), goldMat);
    spikeTip.position.set(0, 0.08, -0.58);
    tailGroup.add(dTail, spikeTip);
    body.add(tailGroup);
  } else {
    const torso = ellipsoid(1.0, 0.95, 0.96, bodyMat, 36, true, 0.045);
    body.add(torso);

    if (isBear) {
      const bearBelly = ellipsoid(0.46, 0.36, 0.2, creamBellyMat, 22, false);
      bearBelly.position.set(0, -0.5, 0.74);
      bellyParts.push(bearBelly);
      const muzzle = ellipsoid(0.24, 0.18, 0.16, creamBellyMat, 18, false);
      muzzle.position.set(0, 0.04, 0.92);
      const bearNose = ellipsoid(0.08, 0.06, 0.05, darkNoseMat, 12, false);
      bearNose.position.set(0, 0.09, 1.05);
      body.add(bearBelly, muzzle, bearNose);

      [-1, 1].forEach((side) => {
        const ear = ellipsoid(0.24, 0.24, 0.15, limbMat, 18, true, 0.035);
        ear.position.set(side * 0.62, 0.76, 0);
        const inner = ellipsoid(0.13, 0.13, 0.06, pinkNoseMat, 14, false);
        inner.position.set(0, 0, 0.1);
        ear.add(inner);
        body.add(ear);
      });
    } else if (isBunny) {
      const bunnyBelly = ellipsoid(0.44, 0.36, 0.18, creamBellyMat, 22, false);
      bunnyBelly.position.set(0, -0.5, 0.74);
      bellyParts.push(bunnyBelly);
      const bunnyNose = ellipsoid(0.065, 0.05, 0.05, pinkNoseMat, 12, false);
      bunnyNose.position.set(0, 0.1, 0.97);
      const cottonTail = ellipsoid(0.22, 0.22, 0.22, creamBellyMat, 16, true, 0.035);
      cottonTail.position.set(0, -0.45, -0.92);
      body.add(bunnyBelly, bunnyNose, cottonTail);

      [-1, 1].forEach((side) => {
        const ear = ellipsoid(0.17, 0.54, 0.12, limbMat, 20, true, 0.035);
        ear.position.set(side * 0.32, 1.2, -0.05);
        ear.rotation.z = -side * 0.14;
        const inner = ellipsoid(0.09, 0.38, 0.05, pinkNoseMat, 14, false);
        inner.position.set(0, 0, 0.08);
        ear.add(inner);
        body.add(ear);
        bunnyEars.push(ear);
      });
    }
  }

  // --- ESPECIES EXTRA: ZORRO EXPLORADOR Y TIBURÓN GRUMETE ---
  if (config.species === 'fox') {
    const foxOrange = toon(baseBodyColor, toonRamp);
    const foxWhite = toon(0xfff3e0, toonRamp);
    const foxDark = toon(0x2b1d14, toonRamp);
    const muzzle = ellipsoid(0.42, 0.3, 0.2, foxWhite, 20, false);
    muzzle.position.set(0, -0.08, 0.86);
    const chest = ellipsoid(0.5, 0.42, 0.18, foxWhite, 20, false);
    chest.position.set(0, -0.42, 0.8);
    bellyParts.push(chest);
    const nose = ellipsoid(0.07, 0.05, 0.05, foxDark, 12, false);
    nose.position.set(0, 0.06, 1.02);
    body.add(muzzle, chest, nose);
    [-1, 1].forEach((side) => {
      const earGeo = new THREE.ConeGeometry(0.27, 0.6, 4);
      const ear = new THREE.Mesh(earGeo, foxOrange);
      ear.position.set(side * 0.5, 0.95, -0.02);
      ear.rotation.set(0, Math.PI / 4, -side * 0.3);
      const earOut = new THREE.Mesh(earGeo, OUTLINE_MAT);
      earOut.scale.set(1.14, 1.08, 1.14);
      ear.add(earOut);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), foxDark);
      tip.position.y = 0.22;
      ear.add(tip);
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 4), foxWhite);
      inner.position.set(0, -0.05, 0.1);
      ear.add(inner);
      body.add(ear);
    });
    tailGroup = new THREE.Group();
    tailGroup.position.set(0.1, -0.55, -0.8);
    const tailFluff = ellipsoid(0.3, 0.3, 0.62, foxOrange, 20, true, 0.04);
    tailFluff.position.set(0.18, 0.22, -0.3);
    tailFluff.rotation.x = -0.7;
    const tailTip = ellipsoid(0.2, 0.2, 0.24, foxWhite, 16, true, 0.03);
    tailTip.position.set(0.24, 0.58, -0.66);
    tailGroup.add(tailFluff, tailTip);
    body.add(tailGroup);
  } else if (config.species === 'shark') {
    const finMat = toon(baseBodyColor.clone().offsetHSL(0, 0.05, -0.12), toonRamp);
    const sharkBelly = toon(0xf2f7ff, toonRamp);
    const belly = ellipsoid(0.66, 0.6, 0.22, sharkBelly, 22, false);
    belly.position.set(0, -0.28, 0.78);
    bellyParts.push(belly);
    body.add(belly);
    const dorsalGeo = new THREE.ConeGeometry(0.26, 0.62, 3);
    const dorsal = new THREE.Mesh(dorsalGeo, finMat);
    dorsal.scale.set(0.55, 1, 1.4);
    dorsal.rotation.set(-0.35, 0, 0);
    dorsal.position.set(0, 1.08, -0.2);
    const dorsalOut = new THREE.Mesh(dorsalGeo, OUTLINE_MAT);
    dorsalOut.scale.set(1.12, 1.06, 1.12);
    dorsal.add(dorsalOut);
    body.add(dorsal);
    [-1, 1].forEach((side) => {
      for (let i = 0; i < 3; i++) {
        const gill = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.2, 0.05),
          new THREE.MeshBasicMaterial({ color: 0x1e2436 })
        );
        gill.position.set(side * (0.86 - i * 0.04), -0.02, 0.36 + i * 0.1);
        gill.rotation.y = side * 0.9;
        body.add(gill);
      }
    });
    tailGroup = new THREE.Group();
    tailGroup.position.set(0, -0.35, -0.92);
    const upper = ellipsoid(0.08, 0.36, 0.2, finMat, 14, true, 0.03);
    upper.position.set(0, 0.24, -0.15);
    upper.rotation.x = 0.6;
    const lower = ellipsoid(0.08, 0.24, 0.16, finMat, 14, true, 0.03);
    lower.position.set(0, -0.12, -0.12);
    lower.rotation.x = -0.7;
    tailGroup.add(upper, lower);
    body.add(tailGroup);
  }

  // A partir de aquí y hasta los brazos, todo lo que se añade es parte de la cabeza.
  const headStartIdx = body.children.length;
  // --- 10 MODELOS DE CABELLO 3D ESTILO TOMODACHI LIFE ---
  // Solo las siluetas humanas llevan pelo: el chibi y los animales conservan su forma.
  const hairStyle = isSlim ? config.hairStyle ?? (isHuman ? 'short' : 'spiky') : 'none';
  if (hairStyle !== 'none') {
    const hairGroup = new THREE.Group();
    const hairCrownY = isHuman ? 1.0 : isSlim ? 1.02 : isCat ? 0.9 : isDragon ? 0.92 : 0.88;
    const hairScale = isHuman ? 0.96 : isMeeseeks ? 0.88 : 1.05;
    hairGroup.position.set(0, hairCrownY, 0.04);
    hairGroup.scale.setScalar(hairScale);

    if (hairStyle === 'spiky') {
      const spikes = [
        { rx: 0.15, rz: 0, sx: 0.15, sy: 0.38, x: 0, z: 0.04 },
        { rx: 0.24, rz: 0.44, sx: 0.13, sy: 0.34, x: -0.14, z: 0.06 },
        { rx: 0.24, rz: -0.44, sx: 0.13, sy: 0.34, x: 0.14, z: 0.06 },
        { rx: -0.18, rz: 0.68, sx: 0.11, sy: 0.28, x: -0.24, z: -0.02 },
        { rx: -0.18, rz: -0.68, sx: 0.11, sy: 0.28, x: 0.24, z: -0.02 },
        { rx: 0.42, rz: 0.18, sx: 0.11, sy: 0.29, x: -0.06, z: 0.16 },
        { rx: 0.42, rz: -0.18, sx: 0.11, sy: 0.29, x: 0.06, z: 0.16 },
      ];
      spikes.forEach((h) => {
        const coneGeo = new THREE.ConeGeometry(h.sx, h.sy, 8);
        const spike = new THREE.Mesh(coneGeo, hairMat);
        spike.position.set(h.x, h.sy * 0.35, h.z);
        spike.rotation.set(h.rx, 0, h.rz);
        const out = new THREE.Mesh(coneGeo, OUTLINE_MAT);
        out.scale.set(1.16, 1.08, 1.16);
        spike.add(out);
        hairGroup.add(spike);
      });
    } else if (hairStyle === 'bob') {
      const cap = ellipsoid(0.72, 0.34, 0.68, hairMat, 22, true, 0.032);
      cap.position.set(0, -0.02, -0.04);
      hairGroup.add(cap);
      // Flequillo frontal esculpido
      [-0.22, -0.07, 0.08, 0.22].forEach((bx, idx) => {
        const bang = ellipsoid(0.11, 0.16, 0.08, hairMat, 12, true, 0.02);
        bang.position.set(bx, -0.12, 0.56 - Math.abs(bx) * 0.25);
        bang.rotation.z = (idx - 1.5) * 0.08;
        hairGroup.add(bang);
      });
      // Mechones laterales Bob
      [-1, 1].forEach((side) => {
        const lock = ellipsoid(0.16, 0.42, 0.22, hairMat, 16, true, 0.028);
        lock.position.set(side * 0.68, -0.34, 0.12);
        lock.rotation.z = side * 0.12;
        hairGroup.add(lock);
      });
    } else if (hairStyle === 'afro') {
      const puffs = [
        { x: 0, y: 0.18, z: 0, r: 0.42 },
        { x: -0.34, y: 0.08, z: 0.08, r: 0.32 },
        { x: 0.34, y: 0.08, z: 0.08, r: 0.32 },
        { x: 0, y: 0.1, z: 0.32, r: 0.3 },
        { x: 0, y: 0.08, z: -0.3, r: 0.32 },
        { x: -0.24, y: 0.24, z: -0.16, r: 0.28 },
        { x: 0.24, y: 0.24, z: -0.16, r: 0.28 },
      ];
      puffs.forEach((p) => {
        const orb = ellipsoid(p.r, p.r * 0.92, p.r, hairMat, 18, true, 0.032);
        orb.position.set(p.x, p.y, p.z);
        hairGroup.add(orb);
      });
    } else if (hairStyle === 'ponytail') {
      const baseCap = ellipsoid(0.62, 0.24, 0.58, hairMat, 18, true, 0.028);
      baseCap.position.set(0, -0.02, 0);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 10, 18), feetMat);
      tie.position.set(0, 0.18, -0.38);
      tie.rotation.x = 0.6;
      const tail = ellipsoid(0.22, 0.46, 0.2, hairMat, 18, true, 0.03);
      tail.position.set(0, 0.28, -0.62);
      tail.rotation.x = -0.65;
      hairGroup.add(baseCap, tie, tail);
    } else if (hairStyle === 'twintails') {
      const bangs = ellipsoid(0.54, 0.2, 0.48, hairMat, 18, true, 0.025);
      bangs.position.set(0, -0.02, 0.08);
      hairGroup.add(bangs);
      [-1, 1].forEach((side) => {
        const ribbon = ellipsoid(0.11, 0.11, 0.11, feetMat, 12, true, 0.02);
        ribbon.position.set(side * 0.62, -0.02, -0.04);
        const tailCone = new THREE.ConeGeometry(0.2, 0.58, 12);
        const tailMesh = new THREE.Mesh(tailCone, hairMat);
        tailMesh.position.set(side * 0.82, -0.24, -0.04);
        tailMesh.rotation.z = side * 2.45;
        const out = new THREE.Mesh(tailCone, OUTLINE_MAT);
        out.scale.set(1.15, 1.08, 1.15);
        tailMesh.add(out);
        hairGroup.add(ribbon, tailMesh);
      });
    } else if (hairStyle === 'pompadour') {
      const wave = ellipsoid(0.36, 0.28, 0.54, hairMat, 20, true, 0.032);
      wave.position.set(0, 0.14, 0.24);
      wave.rotation.x = -0.25;
      const sideSlick = ellipsoid(0.56, 0.2, 0.48, hairMat, 16, true, 0.026);
      sideSlick.position.set(0, -0.02, -0.05);
      hairGroup.add(sideSlick, wave);
    } else if (hairStyle === 'curly') {
      const curlCoords = [
        [-0.38, -0.04, 0.34],
        [-0.18, 0.06, 0.46],
        [0.0, 0.1, 0.48],
        [0.18, 0.06, 0.46],
        [0.38, -0.04, 0.34],
        [-0.48, -0.1, 0.1],
        [0.48, -0.1, 0.1],
        [0, 0.16, 0.16],
      ] as const;
      curlCoords.forEach(([cx, cy, cz]) => {
        const c = ellipsoid(0.18, 0.17, 0.18, hairMat, 14, true, 0.025);
        c.position.set(cx, cy, cz);
        hairGroup.add(c);
      });
    } else if (hairStyle === 'mohawk') {
      for (let i = 0; i < 5; i++) {
        const coneGeo = new THREE.ConeGeometry(0.12, 0.38 - i * 0.03, 8);
        const mSpike = new THREE.Mesh(coneGeo, hairMat);
        const zOff = 0.36 - i * 0.2;
        mSpike.position.set(0, 0.16 - Math.abs(i - 1.5) * 0.03, zOff);
        mSpike.rotation.x = (1.5 - i) * 0.22;
        const out = new THREE.Mesh(coneGeo, OUTLINE_MAT);
        out.scale.set(1.16, 1.08, 1.16);
        mSpike.add(out);
        hairGroup.add(mSpike);
      }
    } else if (hairStyle === 'bun') {
      const base = ellipsoid(0.58, 0.22, 0.54, hairMat, 18, true, 0.026);
      base.position.set(0, -0.04, 0);
      const bunBall = ellipsoid(0.28, 0.26, 0.28, hairMat, 18, true, 0.03);
      bunBall.position.set(0, 0.28, -0.08);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 18), goldMat);
      band.rotation.x = Math.PI / 2;
      band.position.set(0, 0.14, -0.08);
      hairGroup.add(base, bunBall, band);
    } else if (hairStyle === 'short') {
      const cap = ellipsoid(0.7, 0.3, 0.66, hairMat, 22, true, 0.03);
      cap.position.set(0, -0.04, -0.04);
      const fringe = ellipsoid(0.46, 0.13, 0.16, hairMat, 16, true, 0.022);
      fringe.position.set(0.06, -0.08, 0.5);
      fringe.rotation.z = -0.12;
      hairGroup.add(cap, fringe);
      [-1, 1].forEach((side) => {
        const side_ = ellipsoid(0.12, 0.24, 0.3, hairMat, 14, true, 0.02);
        side_.position.set(side * 0.64, -0.24, -0.04);
        hairGroup.add(side_);
      });
    } else if (hairStyle === 'long') {
      const cap = ellipsoid(0.72, 0.32, 0.68, hairMat, 22, true, 0.03);
      cap.position.set(0, -0.02, -0.04);
      const back = ellipsoid(0.7, 0.78, 0.3, hairMat, 22, true, 0.03);
      back.position.set(0, -0.62, -0.36);
      hairGroup.add(cap, back);
      [-0.24, -0.08, 0.08, 0.24].forEach((bx, idx) => {
        const bang = ellipsoid(0.11, 0.15, 0.08, hairMat, 12, true, 0.02);
        bang.position.set(bx, -0.12, 0.56 - Math.abs(bx) * 0.25);
        bang.rotation.z = (idx - 1.5) * 0.08;
        hairGroup.add(bang);
      });
      [-1, 1].forEach((side) => {
        const lock = ellipsoid(0.15, 0.62, 0.2, hairMat, 16, true, 0.026);
        lock.position.set(side * 0.68, -0.56, 0.08);
        lock.rotation.z = side * 0.06;
        hairGroup.add(lock);
      });
    } else if (hairStyle === 'buzz') {
      // Pelo al ras: casquete que sigue la forma de la cabeza
      const hd = isHuman ? humanHead : { w: 0.68, h: 0.76, d: 0.64 };
      const hcY = isHuman ? 0.42 : 0.36;
      const buzz = new THREE.Mesh(
        new THREE.SphereGeometry(1, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.4),
        hairMat
      );
      buzz.scale.set((hd.w * 1.03) / hairScale, (hd.h * 1.03) / hairScale, (hd.d * 1.03) / hairScale);
      buzz.position.set(0, (hcY - hairCrownY) / hairScale, -0.04 / hairScale);
      buzz.rotation.x = -0.18;
      const out = new THREE.Mesh(buzz.geometry, OUTLINE_MAT);
      out.scale.setScalar(1.02);
      buzz.add(out);
      hairGroup.add(buzz);
    } else if (hairStyle === 'sidepart') {
      const cap = ellipsoid(0.7, 0.3, 0.66, hairMat, 22, true, 0.03);
      cap.position.set(0, -0.04, -0.04);
      const swoop = ellipsoid(0.42, 0.17, 0.3, hairMat, 18, true, 0.025);
      swoop.position.set(0.16, 0.02, 0.38);
      swoop.rotation.z = -0.3;
      const part = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.5), toon(customHairColor.clone().offsetHSL(0, 0, -0.12), toonRamp));
      part.position.set(-0.22, 0.25, 0.05);
      hairGroup.add(cap, swoop, part);
      [-1, 1].forEach((side) => {
        const sd = ellipsoid(0.12, 0.24, 0.3, hairMat, 14, true, 0.02);
        sd.position.set(side * 0.64, -0.24, -0.04);
        hairGroup.add(sd);
      });
    } else if (hairStyle === 'wavy') {
      const cap = ellipsoid(0.72, 0.32, 0.68, hairMat, 22, true, 0.03);
      cap.position.set(0, -0.02, -0.04);
      hairGroup.add(cap);
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 3; i++) {
          const wave = ellipsoid(0.17, 0.17, 0.2, hairMat, 14, true, 0.022);
          wave.position.set(side * (0.66 + (i % 2) * 0.05), -0.28 - i * 0.2, 0.06 - i * 0.04);
          hairGroup.add(wave);
        }
      });
      const back = ellipsoid(0.68, 0.55, 0.28, hairMat, 20, true, 0.03);
      back.position.set(0, -0.45, -0.36);
      hairGroup.add(back);
      const fringe = ellipsoid(0.5, 0.14, 0.18, hairMat, 16, true, 0.022);
      fringe.position.set(-0.08, -0.07, 0.48);
      fringe.rotation.z = 0.15;
      hairGroup.add(fringe);
    } else if (hairStyle === 'braids') {
      const cap = ellipsoid(0.7, 0.3, 0.66, hairMat, 22, true, 0.03);
      cap.position.set(0, -0.03, -0.02);
      const part = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.6), toon(customHairColor.clone().offsetHSL(0, 0, -0.12), toonRamp));
      part.position.set(0, 0.27, 0.02);
      hairGroup.add(cap, part);
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 5; i++) {
          const knot = ellipsoid(0.12 - i * 0.008, 0.11, 0.12 - i * 0.008, hairMat, 12, true, 0.02);
          knot.position.set(side * (0.62 + i * 0.02), -0.3 - i * 0.17, 0.04);
          hairGroup.add(knot);
        }
        const tie = ellipsoid(0.06, 0.05, 0.06, feetMat, 10, true, 0.015);
        tie.position.set(side * 0.72, -1.15, 0.04);
        hairGroup.add(tie);
      });
    }

    body.add(hairGroup);
  }

  // --- 10 MODELOS DE OJOS 3D ESTILO TOMODACHI LIFE ---
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.2 + headY + eyeDY, 0);
  body.add(eyes);
  const eyeParts: THREE.Group[] = [];
  const makeEye = (side: number) => {
    const g = new THREE.Group();
    const eyeSpread = (isSlim ? 0.2 : 0.25) + eyeDX;
    g.position.set(side * eyeSpread, 0, faceZ - 0.04);
    // Inclinación tipo Mii: rasgos positivos suben la esquina exterior.
    g.rotation.set(-0.14, side * 0.25, -side * eyeRot);

    const isWinkRightEye = config.eyeStyle === 'wink' && side === 1;

    if (config.eyeStyle === 'happy' || isWinkRightEye) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(0.1, 0.028, 10, 20, Math.PI),
        eyeMat
      );
      arc.position.z = 0.03;
      g.add(arc);
    } else if (config.eyeStyle === 'cool') {
      const sclera = ellipsoid(0.13, 0.075, 0.045, whiteMat, 16, true, 0.018);
      const pupil = ellipsoid(0.055, 0.055, 0.035, eyeMat, 14, false);
      pupil.position.set(0, -0.005, 0.035);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.04, 0.08), eyeMat);
      lid.position.set(0, 0.055, 0.03);
      g.add(sclera, pupil, lid);
    } else if (config.eyeStyle === 'sleepy') {
      const eye = ellipsoid(0.1, 0.16, 0.06, eyeMat, 18, false);
      const lid = ellipsoid(0.115, 0.095, 0.07, limbMat, 16, true, 0.018);
      lid.position.set(0, 0.065, 0.01);
      const shine = ellipsoid(0.028, 0.035, 0.02, whiteMat, 10, false);
      shine.position.set(-0.02, -0.02, 0.05);
      g.add(eye, lid, shine);
    } else if (config.eyeStyle === 'heart') {
      const eye = ellipsoid(0.115, 0.195, 0.065, eyeMat, 20, false);
      const heartPupil = createHeartMesh(toon(0xff4d79, toonRamp));
      heartPupil.scale.setScalar(0.55);
      heartPupil.position.set(0, -0.01, 0.055);
      const shine = ellipsoid(0.03, 0.04, 0.02, whiteMat, 10, false);
      shine.position.set(-0.035, 0.08, 0.05);
      g.add(eye, heartPupil, shine);
    } else if (config.eyeStyle === 'starry') {
      const eye = ellipsoid(0.11, 0.19, 0.065, eyeMat, 20, false);
      const starPupil = new THREE.Mesh(new THREE.OctahedronGeometry(0.052, 0), goldMat);
      starPupil.scale.set(1, 1, 0.45);
      starPupil.position.set(0, -0.01, 0.05);
      const shine = ellipsoid(0.028, 0.04, 0.02, whiteMat, 10, false);
      shine.position.set(-0.03, 0.08, 0.055);
      g.add(eye, starPupil, shine);
    } else if (
      config.eyeStyle === 'almond' ||
      config.eyeStyle === 'lashes' ||
      config.eyeStyle === 'narrow' ||
      config.eyeStyle === 'droopy' ||
      config.eyeStyle === 'bright' ||
      config.eyeStyle === 'calm'
    ) {
      // Ojos "de persona": esclerótica, iris del color elegido, pupila y brillo.
      const st = config.eyeStyle;
      const dims =
        st === 'almond' ? { w: 0.14, h: 0.09, ir: 0.062 }
        : st === 'narrow' ? { w: 0.13, h: 0.055, ir: 0.048 }
        : st === 'bright' ? { w: 0.125, h: 0.145, ir: 0.085 }
        : { w: 0.12, h: 0.125, ir: 0.068 };
      const sclera = ellipsoid(dims.w, dims.h, 0.05, whiteMat, 18, true, 0.018);
      const iris = ellipsoid(dims.ir, Math.min(dims.ir * 1.12, dims.h * 0.95), 0.035, irisMat, 16, false);
      iris.position.set(0, -0.004, 0.032);
      const pupil = ellipsoid(dims.ir * 0.5, Math.min(dims.ir * 0.56, dims.h * 0.5), 0.03, eyeMat, 12, false);
      pupil.position.set(0, -0.004, 0.048);
      const shine = ellipsoid(0.02, 0.024, 0.012, whiteMat, 8, false);
      shine.position.set(-dims.ir * 0.35, dims.h * 0.25, 0.062);
      g.add(sclera, iris, pupil, shine);
      if (st === 'bright') {
        const s2 = ellipsoid(0.012, 0.012, 0.01, whiteMat, 8, false);
        s2.position.set(dims.ir * 0.35, -dims.h * 0.25, 0.062);
        g.add(s2);
      }
      if (st === 'almond') sclera.rotation.z = side * 0.12;
      if (st === 'lashes') {
        [0, 1, 2].forEach((i) => {
          const lash = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.04, 4, 6), eyeMat);
          const a = 0.5 + i * 0.35;
          lash.position.set(side * Math.cos(a) * dims.w * 0.95, Math.sin(a) * dims.h * 0.95, 0.03);
          lash.rotation.z = side * (a - Math.PI / 2);
          g.add(lash);
        });
      }
      if (st === 'droopy' || st === 'calm') {
        // Párpado superior del color de la piel
        const lid = ellipsoid(dims.w * 1.06, dims.h * 0.62, 0.06, limbMat, 16, true, 0.016);
        lid.position.set(0, dims.h * (st === 'calm' ? 0.5 : 0.62), 0.012);
        if (st === 'droopy') lid.rotation.z = side * -0.35;
        g.add(lid);
      }
    } else if (isSlim && config.eyeStyle === 'round') {
      const sclera = ellipsoid(0.135, 0.165, 0.06, whiteMat, 18, true, 0.02);
      if (isHuman) {
        const ring = ellipsoid(0.08, 0.095, 0.035, irisMat, 16, false);
        ring.position.set(0, -0.005, 0.04);
        g.add(ring);
      }
      const pupil = ellipsoid(0.055, 0.065, 0.04, eyeMat, 14, false);
      pupil.position.set(0, 0, 0.045);
      const shine = ellipsoid(0.022, 0.028, 0.02, whiteMat, 10, false);
      shine.position.set(-0.02, 0.03, 0.075);
      g.add(sclera, pupil, shine);
    } else {
      const big =
        config.eyeStyle === 'anime'
          ? 1.26
          : config.eyeStyle === 'sparkle'
            ? 1.15
            : config.eyeStyle === 'fierce'
              ? 0.95
              : 1;
      const eye = ellipsoid(0.1 * big, 0.19 * big, 0.065, eyeMat, 20, false);
      const iris = ellipsoid(0.074 * big, 0.09 * big, 0.05, irisMat, 18, false);
      iris.position.set(0, -0.072 * big, 0.022);
      const shine = ellipsoid(0.037 * big, 0.06 * big, 0.025, whiteMat, 14, false);
      shine.position.set(-0.028 * big, 0.08 * big, 0.05);
      g.add(eye, iris, shine);
      if (config.eyeStyle === 'sparkle' || config.eyeStyle === 'anime') {
        const s2 = ellipsoid(0.022, 0.022, 0.012, whiteMat, 10, false);
        s2.position.set(0.036, -0.09, 0.055);
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.024), whiteMat);
        star.position.set(0.036, 0.05, 0.055);
        g.add(s2, star);
      }
    }
    eyeParts.push(g);
    return g;
  };
  eyes.add(makeEye(-1), makeEye(1));

  // --- 10 MODELOS DE CEJAS 3D ESTILO TOMODACHI LIFE ---
  const browStyle = config.browStyle ?? 'soft';
  const browSpread = (isSlim ? 0.21 : 0.26) + eyeDX + browDX;
  const browBaseY = headY + (isSlim ? 0.34 : 0.43) + eyeDY + browDY;
  const browThickness =
    browStyle === 'bold' || browStyle === 'unibrow'
      ? 0.038
      : browStyle === 'short'
        ? 0.018
        : 0.022;
  const browWidth =
    browStyle === 'bold'
      ? 0.13
      : browStyle === 'short'
        ? 0.065
        : browStyle === 'unibrow'
          ? 0.16
          : 0.11;

  const makeBrow = (side: number) => {
    const bg = new THREE.Group();
    bg.position.set(side * browSpread, browBaseY, faceZ - 0.03);
    bg.rotation.y = side * 0.25;
    if (browStyle === 'none') {
      return bg;
    }
    if (browStyle === 'dot') {
      const dot = ellipsoid(0.048, 0.038, 0.025, eyeMat, 12, false);
      bg.add(dot);
      return bg;
    }
    if (browStyle === 'slit' && side === 1) {
      const mainSeg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.022, 0.065, 8, 12),
        eyeMat
      );
      mainSeg.rotation.z = Math.PI / 2;
      mainSeg.position.x = -0.025;
      const tipSeg = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.022, 0.02, 8, 12),
        eyeMat
      );
      tipSeg.rotation.z = Math.PI / 2;
      tipSeg.position.x = 0.055;
      bg.add(mainSeg, tipSeg);
      return bg;
    }
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(browThickness, browWidth, 8, 12),
      eyeMat
    );
    mesh.rotation.z = Math.PI / 2;
    bg.add(mesh);
    return bg;
  };
  const browL = makeBrow(-1);
  const browR = makeBrow(1);
  browL.scale.set(browK * browSX, browK, browK);
  browR.scale.set(browK * browSX, browK, browK);
  body.add(browL, browR);

  if (browStyle === 'unibrow') {
    const bridge = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.032, 0.16, 8, 12),
      eyeMat
    );
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, browBaseY - 0.01, faceZ - 0.01);
    body.add(bridge);
  }

  const baseBrowAngle =
    browStyle === 'hero' || config.eyeStyle === 'fierce'
      ? -0.26
      : browStyle === 'worried'
        ? 0.24
        : browStyle === 'raised'
          ? 0.14
          : 0.04;

  // --- 10 MODELOS DE MEJILLAS Y RASGOS FACIALES 3D ---
  const blushStyle = config.blushStyle ?? 'pink';
  const cheekX = isSlim ? 0.36 : 0.45;
  if (blushStyle !== 'none') {
    if (blushStyle === 'bandaid') {
      const bandGroup = new THREE.Group();
      bandGroup.position.set(0.28, headY + 0.06, faceZ - 0.03);
      bandGroup.rotation.y = 0.34;
      bandGroup.rotation.z = -0.24;
      const stripGeo = new THREE.BoxGeometry(0.22, 0.075, 0.025);
      const strip = new THREE.Mesh(stripGeo, toon(0xfde68a, toonRamp));
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.065, 0.03),
        toon(0xfef3c7, toonRamp)
      );
      const out = new THREE.Mesh(stripGeo, OUTLINE_MAT);
      out.scale.set(1.12, 1.18, 1.2);
      bandGroup.add(strip, pad, out);
      body.add(bandGroup);
    } else {
      [-1, 1].forEach((side) => {
        if (blushStyle === 'freckles') {
          const freckleMat = new THREE.MeshBasicMaterial({ color: 0x8d5524 });
          [-0.04, 0, 0.04].forEach((ox, idx) => {
            const dot = ellipsoid(0.018, 0.018, 0.012, freckleMat, 8, false);
            dot.position.set(
              side * cheekX + ox,
              headY + 0.02 + (idx % 2 === 0 ? -0.015 : 0.015),
              faceZ - 0.08
            );
            body.add(dot);
          });
        } else if (blushStyle === 'star') {
          const starCheek = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.055, 0),
            goldMat
          );
          starCheek.position.set(side * cheekX, headY + 0.02, faceZ - 0.08);
          starCheek.scale.set(1, 1, 0.35);
          body.add(starCheek);
        } else if (blushStyle === 'hearts') {
          const hc = createHeartMesh(toon(0xff4d79, toonRamp));
          hc.scale.setScalar(0.45);
          hc.position.set(side * cheekX, headY + 0.02, faceZ - 0.07);
          hc.rotation.y = side * 0.4;
          body.add(hc);
        } else if (blushStyle === 'whiskers') {
          [-0.04, 0.04].forEach((wy) => {
            const w = new THREE.Mesh(
              new THREE.CapsuleGeometry(0.01, 0.14, 6, 8),
              whiskerMat
            );
            w.rotation.z = Math.PI / 2 + side * (wy * 2.2);
            w.rotation.y = side * 0.38;
            w.position.set(side * (cheekX + 0.04), headY + 0.02 + wy, faceZ - 0.09);
            body.add(w);
          });
        } else if (blushStyle === 'stripes') {
          [-0.025, 0.025].forEach((sy) => {
            const stripe = new THREE.Mesh(
              new THREE.CapsuleGeometry(0.014, 0.11, 6, 8),
              feetMat
            );
            stripe.rotation.z = Math.PI / 2;
            stripe.rotation.y = side * 0.42;
            stripe.position.set(side * cheekX, headY + 0.02 + sy, faceZ - 0.09);
            body.add(stripe);
          });
        } else if (blushStyle === 'dimples') {
          const dimple = new THREE.Mesh(
            new THREE.TorusGeometry(0.036, 0.011, 8, 14, Math.PI * 0.8),
            mouthMat
          );
          dimple.position.set(side * (cheekX - 0.12), headY - 0.02, faceZ - 0.03);
          dimple.rotation.z = side > 0 ? -0.4 : Math.PI + 0.4;
          body.add(dimple);
        } else {
          const cheekColor = blushStyle === 'peach' ? 0xff9e6d : 0xff759f;
          const cheekMat = new THREE.MeshBasicMaterial({
            color: cheekColor,
            transparent: true,
            opacity: 0.68,
            depthWrite: false,
          });
          const c = ellipsoid(0.12, 0.06, 0.02, cheekMat, 16, false);
          c.position.set(side * cheekX, headY + 0.02, faceZ - 0.1);
          c.rotation.y = side * 0.48;
          body.add(c);
        }
      });
    }
  }

  // --- 10 MODELOS DE BOCA 3D PERSONALIZABLES ---
  const mouth = new THREE.Group();
  mouth.position.set(0, headY + (isSlim ? -0.04 : 0.02) + mouthDY, faceZ + 0.01);
  mouth.scale.set(mouthK * mouthSX, mouthK, mouthK);
  mouth.rotation.x = -0.05;
  body.add(mouth);

  const mouthStyle = config.mouthStyle ?? 'smile';
  const smileGroup = new THREE.Group();

  if (mouthStyle === 'cat' || mouthStyle === 'wavy') {
    [-1, 1].forEach((side) => {
      const lobe = new THREE.Mesh(
        new THREE.TorusGeometry(0.044, 0.016, 10, 18, Math.PI),
        mouthMat
      );
      lobe.rotation.z = mouthStyle === 'wavy' && side === 1 ? 0 : Math.PI;
      lobe.position.x = side * 0.042;
      smileGroup.add(lobe);
    });
  } else if (mouthStyle === 'o') {
    const oRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.016, 10, 20),
      mouthMat
    );
    smileGroup.add(oRing);
  } else if (mouthStyle === 'kiss') {
    [-1, 1].forEach((sy) => {
      const lip = new THREE.Mesh(
        new THREE.TorusGeometry(0.032, 0.014, 8, 16, Math.PI),
        mouthMat
      );
      lip.rotation.z = -Math.PI / 2;
      lip.position.y = sy * 0.024;
      smileGroup.add(lip);
    });
  } else if (mouthStyle === 'line') {
    const line = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.09, 4, 8), mouthMat);
    line.rotation.z = Math.PI / 2;
    smileGroup.add(line);
  } else if (mouthStyle === 'small') {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.015, 8, 16, Math.PI), mouthMat);
    arc.rotation.z = Math.PI;
    smileGroup.add(arc);
  } else if (mouthStyle === 'lips') {
    const lipMat = toon(new THREE.Color(config.lipColor ?? '#D9606E'), toonRamp);
    const upper = ellipsoid(0.075, 0.022, 0.025, lipMat, 12, true, 0.008);
    upper.position.y = 0.014;
    const lower = ellipsoid(0.068, 0.03, 0.025, lipMat, 12, true, 0.008);
    lower.position.y = -0.02;
    const seam = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.11, 4, 8), mouthMat);
    seam.rotation.z = Math.PI / 2;
    seam.position.z = 0.02;
    smileGroup.add(upper, lower, seam);
  } else if (mouthStyle === 'teeth' || mouthStyle === 'laugh') {
    const big = mouthStyle === 'laugh';
    const cav = ellipsoid(big ? 0.09 : 0.08, big ? 0.07 : 0.042, 0.02, mouthMat, 16, false);
    cav.position.y = big ? -0.03 : -0.018;
    const teeth = ellipsoid(big ? 0.074 : 0.072, 0.022, 0.02, whiteMat, 12, false);
    teeth.position.set(0, big ? 0.012 : -0.006, 0.012);
    smileGroup.add(cav, teeth);
    if (big) {
      const tng = ellipsoid(0.045, 0.024, 0.016, tongueMat, 12, false);
      tng.position.set(0, -0.07, 0.014);
      smileGroup.add(tng);
    }
  } else if (mouthStyle === 'pout') {
    const poutArc = new THREE.Mesh(
      new THREE.TorusGeometry(0.056, 0.017, 10, 20, Math.PI),
      mouthMat
    );
    poutArc.position.y = -0.04;
    smileGroup.add(poutArc);
  } else {
    const smileRadius =
      isMeeseeks ? 0.18 : mouthStyle === 'grin' ? 0.098 : 0.066;
    const smileTube = isMeeseeks ? 0.02 : 0.018;
    const smileArc = new THREE.Mesh(
      new THREE.TorusGeometry(smileRadius, smileTube, 10, 24, Math.PI),
      mouthMat
    );
    smileArc.rotation.z =
      Math.PI + (mouthStyle === 'smirk' ? 0.24 : 0);
    smileGroup.add(smileArc);

    if (mouthStyle === 'grin') {
      const teeth = ellipsoid(smileRadius * 0.78, 0.032, 0.016, whiteMat, 14, false);
      teeth.position.set(0, -0.028, 0.005);
      smileGroup.add(teeth);
    } else if (mouthStyle === 'tongue') {
      const outTongue = ellipsoid(0.038, 0.048, 0.02, tongueMat, 12, true, 0.012);
      outTongue.position.set(0.015, -0.068, 0.012);
      smileGroup.add(outTongue);
    } else if (mouthStyle === 'fangs') {
      [-1, 1].forEach((side) => {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.042, 8), whiteMat);
        fang.rotation.x = Math.PI;
        fang.position.set(side * 0.042, -0.045, 0.012);
        smileGroup.add(fang);
      });
    }
  }

  const open = new THREE.Group();
  const cavity = ellipsoid(
    isMeeseeks ? 0.15 : 0.08,
    isMeeseeks ? 0.095 : 0.068,
    0.028,
    mouthMat,
    16,
    false
  );
  const tongue = ellipsoid(
    isMeeseeks ? 0.09 : 0.048,
    0.026,
    0.02,
    tongueMat,
    14,
    false
  );
  tongue.position.set(0, -0.028, 0.01);
  open.add(cavity, tongue);

  const frown = new THREE.Mesh(
    new THREE.TorusGeometry(isMeeseeks ? 0.14 : 0.065, 0.02, 10, 20, Math.PI),
    mouthMat
  );
  frown.position.y = -0.055;
  mouth.add(smileGroup, open, frown);

  // Medidas aproximadas de la cabeza de cada silueta (para barba y gafas de nieve).
  const headInfo = isHuman
    ? { w: humanHead.w, h: humanHead.h, d: humanHead.d, y: 0.42 }
    : isMeeseeks
      ? { w: 0.68, h: 0.76, d: 0.64, y: 0.36 }
      : isCat
        ? { w: 0.86, h: 0.74, d: 0.8, y: 0.24 }
        : isDragon
          ? { w: 0.88, h: 0.78, d: 0.84, y: 0.2 }
          : { w: 1.0, h: 0.95, d: 0.96, y: 0 };

  // --- NARIZ (personas, chibi y muñeco esbelto) ---
  const noseStyle = config.noseStyle ?? (isHuman ? 'button' : 'none');
  if (noseStyle !== 'none' && isSlim) {
    const noseMat = toon(baseBodyColor.clone().offsetHSL(0, 0.05, -0.08), toonRamp);
    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x5a2e2a });
    const nose = new THREE.Group();
    nose.position.set(0, headY + (isSlim ? 0.08 : 0.11) + noseDY, faceZ + 0.02);
    nose.scale.setScalar(noseK);
    if (noseStyle === 'button') {
      nose.add(ellipsoid(0.045, 0.04, 0.04, noseMat, 12, true, 0.012));
    } else if (noseStyle === 'round') {
      nose.add(ellipsoid(0.075, 0.065, 0.06, noseMat, 14, true, 0.014));
    } else if (noseStyle === 'pointy') {
      const geo = new THREE.ConeGeometry(0.05, 0.15, 10);
      const cone = new THREE.Mesh(geo, noseMat);
      cone.rotation.x = Math.PI / 2;
      cone.position.z = 0.05;
      const out = new THREE.Mesh(geo, OUTLINE_MAT);
      out.scale.set(1.2, 1.08, 1.2);
      cone.add(out);
      nose.add(cone);
    } else if (noseStyle === 'wide' || noseStyle === 'snub') {
      const n = noseStyle === 'wide'
        ? ellipsoid(0.1, 0.045, 0.045, noseMat, 14, true, 0.012)
        : ellipsoid(0.055, 0.05, 0.055, noseMat, 12, true, 0.012);
      if (noseStyle === 'snub') n.rotation.x = -0.5;
      nose.add(n);
      [-1, 1].forEach((side) => {
        const nostril = ellipsoid(0.014, 0.01, 0.01, nostrilMat, 8, false);
        nostril.position.set(side * (noseStyle === 'wide' ? 0.045 : 0.022), -0.025, 0.035);
        nose.add(nostril);
      });
    }
    body.add(nose);
  }

  // --- BARBA Y BIGOTE (mismo color que el cabello) ---
  // Barba y bigote solo en siluetas humanas: los animales y el chibi conservan su cara.
  const facialHair = isSlim ? config.facialHair ?? 'none' : 'none';
  const fhColor = config.beardColor ? new THREE.Color(config.beardColor) : customHairColor;
  const fhMat = config.beardColor ? toon(fhColor, toonRamp) : hairMat;
  if (facialHair !== 'none') {
    const fh = new THREE.Group();
    fh.position.copy(mouth.position);
    fh.position.y += mustDY;
    fh.scale.set(mustK * mustSX * (isSlim ? 1 : 1.1), mustK * (isSlim ? 1 : 1.1), mustK);
    const addMustache = () => {
      [-1, 1].forEach((side) => {
        const half = ellipsoid(0.085, 0.035, 0.03, fhMat, 12, true, 0.012);
        half.position.set(side * 0.06, 0.06, 0.02);
        half.rotation.z = side * 0.25;
        fh.add(half);
        if (facialHair === 'curly') {
          const curl = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.012, 6, 14, Math.PI * 1.5), fhMat);
          curl.position.set(side * 0.155, 0.075, 0.015);
          curl.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI;
          fh.add(curl);
        }
      });
    };
    if (facialHair === 'mustache' || facialHair === 'curly') addMustache();
    if (facialHair === 'goatee') {
      const g = ellipsoid(0.06, 0.08, 0.04, fhMat, 12, true, 0.012);
      g.position.set(0, -0.11, -0.01);
      fh.add(g);
    }
    if (facialHair === 'beard') {
      addMustache();
    }
    body.add(fh);
    if (facialHair === 'beard') {
      // Barba completa: casquete que abraza la mandíbula por debajo de la boca.
      const beardGeo = new THREE.SphereGeometry(1, 30, 10, Math.PI / 2 - 1.3, 2.6, Math.PI * 0.58, Math.PI * 0.34);
      const beardMat = toon(fhColor, toonRamp);
      (beardMat as THREE.Material).side = THREE.DoubleSide;
      const beard = new THREE.Mesh(beardGeo, beardMat);
      beard.scale.set(headInfo.w * 1.06, headInfo.h * 1.08, headInfo.d * 1.1);
      beard.position.y = headInfo.y + mouthDY;
      const out = new THREE.Mesh(beardGeo, OUTLINE_MAT);
      out.scale.setScalar(1.03);
      beard.add(out);
      body.add(beard);
      // Patillas que unen la barba con el pelo
      [-1, 1].forEach((side) => {
        const burn = ellipsoid(0.06, 0.2, 0.13, fhMat, 12, true, 0.015);
        burn.position.set(side * (headInfo.w - 0.04), headInfo.y - 0.08, headInfo.d * 0.3);
        burn.rotation.y = side * 0.5;
        body.add(burn);
      });
    } else if (facialHair === 'stubble') {
      const stubbleMat = new THREE.MeshBasicMaterial({
        color: fhColor,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      });
      const shadow = new THREE.Mesh(
        new THREE.SphereGeometry(1, 28, 10, Math.PI / 2 - 1.1, 2.2, Math.PI * 0.62, Math.PI * 0.28),
        stubbleMat
      );
      shadow.scale.set(headInfo.w * 1.012, headInfo.h * 1.012, headInfo.d * 1.012);
      shadow.position.y = headInfo.y;
      body.add(shadow);
    }
  }

  // --- LUNAR ---
  if (config.mole) {
    const moleMesh = ellipsoid(0.024, 0.024, 0.012, darkNoseMat, 10, false);
    const mx = (isSlim ? 0.27 : 0.36) + tstep(tune.moleX) * 0.05;
    moleMesh.position.set(mx, headY + tstep(tune.moleY) * 0.05, faceZ * Math.sqrt(Math.max(0.2, 1 - (mx / headInfo.w) ** 2)) + 0.01);
    body.add(moleMesh);
  }

  // --- GAFAS (independientes del gorro) ---
  const glassesId =
    config.glasses && config.glasses !== 'none'
      ? config.glasses
      : config.accessory === 'glasses'
        ? 'round'
        : 'none';
  if (glassesId !== 'none') {
    const gl = new THREE.Group();
    gl.position.set(0, 0.2 + headY + eyeDY + glassDY, faceZ + 0.04);
    gl.scale.setScalar(glassK);
    const spread = (isSlim ? 0.2 : 0.25) + eyeDX;
    const r = (isSlim ? 0.13 : 0.15) * Math.max(1, eyeK);
    const frameMat = new THREE.MeshBasicMaterial({
      color: config.glassesColor
        ? new THREE.Color(config.glassesColor)
        : glassesId === 'star' ? 0xf4b942 : glassesId === 'heart' ? 0xff4d79 : glassesId === 'goggles' ? 0xff7a1a : 0x1e2436,
    });
    const lensMat = new THREE.MeshBasicMaterial({
      color:
        glassesId === 'sun' ? 0x1e2436 : glassesId === 'goggles' ? 0x7dd3fc : glassesId === 'heart' ? 0xff9eb5 : 0xbfd8ff,
      transparent: true,
      opacity: glassesId === 'sun' ? 0.9 : glassesId === 'goggles' || glassesId === 'heart' ? 0.6 : 0.28,
      depthWrite: false,
    });
    [-1, 1].forEach((side) => {
      const lensG = new THREE.Group();
      lensG.position.set(side * spread, 0, 0);
      lensG.rotation.y = side * 0.24;
      if (glassesId === 'heart') {
        const h = createHeartMesh(lensMat);
        h.scale.setScalar(r / 0.075);
        lensG.add(h);
      } else {
        const segs = glassesId === 'square' ? 4 : glassesId === 'star' ? 5 : 28;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(r, glassesId === 'goggles' ? 0.045 : 0.024, 8, segs),
          frameMat
        );
        const lens = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, segs), lensMat);
        const spin = glassesId === 'square' ? Math.PI / 4 : glassesId === 'star' ? Math.PI / 2 : 0;
        ring.rotation.z = spin;
        lens.rotation.z = spin;
        if (glassesId === 'square') {
          ring.scale.set(1.1, 0.8, 1);
          lens.scale.set(1.1, 0.8, 1);
        }
        lensG.add(ring, lens);
      }
      gl.add(lensG);
    });
    if (glassesId !== 'goggles') {
      // Patillas: siguen la curva de la cabeza desde la montura hasta la oreja.
      const ew = headInfo.w + 0.035;
      const ed = headInfo.d + 0.035;
      [-1, 1].forEach((side) => {
        const pts = [new THREE.Vector3(side * (spread + r * 0.97), 0, 0)];
        const a0 = Math.asin(Math.min(0.98, (spread + r) / ew));
        for (let i = 0; i <= 6; i++) {
          const a = a0 + ((Math.PI / 2 - a0) * i) / 6;
          pts.push(new THREE.Vector3(side * ew * Math.sin(a), 0.01 * i, ed * Math.cos(a) - (faceZ + 0.04)));
        }
        const arm = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.014, 5, false),
          frameMat
        );
        gl.add(arm);
      });
    }
    if (glassesId === 'goggles') {
      const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 48), frameMat);
      band.rotation.x = Math.PI / 2;
      band.scale.set(headInfo.w + 0.03, headInfo.d + 0.03, 1);
      band.position.z = -(faceZ + 0.04);
      gl.add(band);
    } else if (glassesId !== 'heart') {
      const bridge = new THREE.Mesh(new THREE.TorusGeometry(spread - r, 0.018, 8, 14, Math.PI), frameMat);
      bridge.position.set(0, 0.02, 0.02);
      gl.add(bridge);
    }
    body.add(gl);
  }

  const headEndIdx = body.children.length;

  // --- BRAZOS Y PIES TOON ---
  // (En personas son pivotes invisibles: la animación se copia a los brazos con hombro.)
  const armL = isHuman ? new THREE.Mesh() : ellipsoid(
    isHuman ? 0.11 : isSlim ? 0.13 : 0.17,
    isHuman ? 0.25 : isSlim ? 0.42 : 0.27,
    isHuman ? 0.11 : isSlim ? 0.13 : 0.17,
    limbMat,
    20,
    true,
    0.032
  );
  const armX = isHuman ? 0.52 : isSlim ? 0.62 : isCat || isDragon ? 0.78 : 0.94;
  const armY = isHuman ? -0.4 : isSlim ? -0.18 : -0.12;
  armL.position.set(-armX, armY, 0.14);
  const armR = armL.clone();
  armR.position.x = armX;
  body.add(armL, armR);

  const footMeshes: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const f = ellipsoid(
      isHuman ? 0.16 : isSlim ? 0.22 : 0.31,
      isHuman ? 0.12 : isSlim ? 0.15 : 0.17,
      isHuman ? 0.27 : isSlim ? 0.36 : 0.43,
      isHuman
        ? toon(new THREE.Color(config.pantsColor ?? '#3B4A6B').multiplyScalar(0.5), toonRamp)
        : feetMat,
      20,
      true,
      0.035
    );
    f.position.set(side * (isHuman ? 0.14 : isSlim ? 0.28 : 0.42), -0.88, 0.12);
    f.rotation.y = side * 0.22;
    body.add(f);
    footMeshes.push(f);
  });

  // --- ANTENA CON CRISTAL LOW-POLY DE VOZ ---
  const antenna = new THREE.Group();
  antenna.position.set(0.02, isMeeseeks ? 1.08 : 0.9, -0.14);
  const stalkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.02, 0.22, -0.04),
    new THREE.Vector3(0.12, 0.42, 0.0),
    new THREE.Vector3(0.24, 0.5, 0.1),
  ]);
  const stalk = new THREE.Mesh(
    new THREE.TubeGeometry(stalkCurve, 16, 0.026, 8, false),
    limbMat
  );
  const orbMat = new THREE.MeshBasicMaterial({ color: 0xffc94d });
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xffb800,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), orbMat);
  orb.position.set(0.25, 0.52, 0.11);
  const halo = new THREE.Mesh(new THREE.OctahedronGeometry(0.21, 0), haloMat);
  halo.position.copy(orb.position);
  antenna.add(stalk, orb, halo);
  // Solo el muñeco esbelto lleva antena de voz; personas, chibi y animales hablan con la boca.
  antenna.visible = isMeeseeks;
  body.add(antenna);

  // --- 10 ACCESORIOS / SOMBREROS 3D TOON ---
  const acc = new THREE.Group();
  acc.position.y = headY * 0.65;
  const royalIndigo = toon(0x3b4cca, toonRamp);
  const coral = toon(0xff4d6d, toonRamp);
  const gold = toon(0xf4c44e, toonRamp);
  // Las gafas antiguas ahora viven en su propia casilla (ver arriba).
  const accessoryId: PetConfig['accessory'] = config.accessory === 'glasses' ? 'none' : config.accessory;
  switch (accessoryId) {
    case 'beret': {
      const b = ellipsoid(0.56, 0.17, 0.52, royalIndigo, 20, true, 0.03);
      b.position.set(-0.08, 0.93, 0.08);
      b.rotation.z = 0.18;
      const nub = ellipsoid(0.05, 0.06, 0.05, royalIndigo, 10, false);
      nub.position.set(-0.08, 1.1, 0.08);
      acc.add(b, nub);
      break;
    }
    case 'cap': {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
        coral
      );
      dome.scale.set(1, 0.62, 1);
      dome.position.set(0, 0.78, 0.04);
      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.045, 24),
        coral
      );
      visor.scale.set(1, 1, 0.7);
      visor.position.set(0, 0.8, 0.46);
      visor.rotation.x = 0.18;
      acc.add(dome, visor);
      break;
    }
    case 'bow': {
      const bow = new THREE.Group();
      bow.position.set(0.48, 0.78, 0.45);
      bow.rotation.z = -0.4;
      const l = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 14), coral);
      l.rotation.z = -Math.PI / 2;
      l.position.x = -0.1;
      const r = l.clone();
      r.rotation.z = Math.PI / 2;
      r.position.x = 0.1;
      bow.add(l, r, ellipsoid(0.055, 0.055, 0.055, coral, 10, false));
      acc.add(bow);
      break;
    }
    case 'headphones': {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(0.98, 0.055, 12, 36, Math.PI),
        royalIndigo
      );
      band.position.set(0, 0.05, -0.05);
      acc.add(band);
      [-1, 1].forEach((side) => {
        const cup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.24, 0.18, 24),
          coral
        );
        cup.rotation.z = Math.PI / 2;
        cup.position.set(side * 0.98, 0.05, -0.05);
        const pad = new THREE.Mesh(
          new THREE.TorusGeometry(0.17, 0.05, 10, 20),
          royalIndigo
        );
        pad.rotation.y = Math.PI / 2;
        pad.position.set(side * 0.9, 0.05, -0.05);
        acc.add(cup, pad);
      });
      break;
    }
    case 'crown': {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.37, 0.2, 16, 1, true),
        gold
      );
      ring.position.set(-0.12, 0.98, 0.1);
      ring.rotation.z = 0.15;
      acc.add(ring);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.19, 8), gold);
        spike.position.set(Math.sin(a) * 0.35, 0.18, Math.cos(a) * 0.35);
        const gem = ellipsoid(0.04, 0.04, 0.04, coral, 10, false);
        gem.position.set(Math.sin(a) * 0.37, 0, Math.cos(a) * 0.37);
        ring.add(spike, gem);
      }
      break;
    }
    case 'wizard': {
      const purple = toon(0x6c47ff, toonRamp);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.0, 18), purple);
      cone.position.set(-0.15, 1.35, 0.05);
      cone.rotation.z = 0.28;
      const brim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 0.04, 24),
        purple
      );
      brim.position.set(-0.05, 0.88, 0.05);
      brim.rotation.z = 0.12;
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.085), gold);
      star.position.set(-0.05, 1.3, 0.48);
      acc.add(cone, brim, star);
      break;
    }
    case 'halo': {
      const haloRingGeo = new THREE.TorusGeometry(0.42, 0.055, 12, 32);
      const haloRing = new THREE.Mesh(haloRingGeo, gold);
      haloRing.rotation.x = Math.PI / 2 - 0.15;
      haloRing.position.set(0, 1.26, 0.05);
      const haloOut = new THREE.Mesh(haloRingGeo, OUTLINE_MAT);
      haloOut.scale.setScalar(1.12);
      haloRing.add(haloOut);
      acc.add(haloRing);
      break;
    }
    case 'flower': {
      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(-0.22, 0.96, 0.18);
      flowerGroup.rotation.z = 0.25;
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.022, 0.24, 8),
        toon(0x22c55e, toonRamp)
      );
      stem.position.y = 0.1;
      flowerGroup.add(stem);
      const center = ellipsoid(0.08, 0.05, 0.08, gold, 12, true, 0.015);
      center.position.y = 0.22;
      flowerGroup.add(center);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const petal = ellipsoid(0.07, 0.03, 0.11, whiteMat, 12, true, 0.015);
        petal.position.set(Math.sin(a) * 0.12, 0.21, Math.cos(a) * 0.12);
        petal.rotation.y = a;
        flowerGroup.add(petal);
      }
      acc.add(flowerGroup);
      break;
    }
    case 'strawhat': {
      const straw = toon(0xf6d27a, toonRamp);
      const brim = cylinder(0.95, 0.95, 0.05, straw, 32);
      brim.position.set(0, 0.86, 0.02);
      brim.rotation.x = 0.08;
      const crownH = cylinder(0.46, 0.52, 0.34, straw, 24);
      crownH.position.set(0, 1.04, 0.02);
      const band = cylinder(0.525, 0.525, 0.1, toon(0xe63946, toonRamp), 24, 0);
      band.position.set(0, 0.94, 0.02);
      acc.add(brim, crownH, band);
      break;
    }
    case 'captain': {
      const navy = toon(0x2b3b5c, toonRamp);
      const tri = new THREE.Group();
      tri.position.set(0, 0.92, 0.02);
      for (let i = 0; i < 3; i++) {
        const lobe = ellipsoid(0.62, 0.2, 0.34, navy, 18, true, 0.03);
        const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
        lobe.position.set(Math.cos(a) * 0.22, 0.04, Math.sin(a) * 0.22);
        lobe.rotation.y = -a + Math.PI / 2;
        lobe.rotation.z = 0.25;
        tri.add(lobe);
      }
      const top = ellipsoid(0.44, 0.24, 0.42, navy, 18, true, 0.03);
      top.position.y = 0.14;
      const trim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 6, 32), gold);
      trim.rotation.x = Math.PI / 2;
      trim.position.y = 0.03;
      const emblem = cylinder(0.11, 0.11, 0.03, toon(0xffffff, toonRamp), 16);
      emblem.rotation.x = Math.PI / 2;
      emblem.position.set(0, 0.18, 0.44);
      const feather = ellipsoid(0.07, 0.32, 0.04, coral, 12, true, 0.015);
      feather.position.set(0.32, 0.38, -0.05);
      feather.rotation.z = -0.6;
      tri.add(top, trim, emblem, feather);
      acc.add(tri);
      break;
    }
    case 'bandana': {
      const red = toon(0xe63946, toonRamp);
      const capB = new THREE.Mesh(
        new THREE.SphereGeometry(0.98, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.36),
        red
      );
      capB.position.set(0, 0.0, -0.02);
      const capOut = new THREE.Mesh(capB.geometry, OUTLINE_MAT);
      capOut.scale.setScalar(1.035);
      capB.add(capOut);
      const knot = ellipsoid(0.12, 0.1, 0.1, red, 12, true, 0.02);
      knot.position.set(0.0, 0.62, -0.78);
      const tailA = ellipsoid(0.08, 0.24, 0.05, red, 12, true, 0.02);
      tailA.position.set(-0.1, 0.42, -0.85);
      tailA.rotation.z = 0.4;
      const tailB = tailA.clone();
      tailB.position.x = 0.12;
      tailB.rotation.z = -0.3;
      acc.add(capB, knot, tailA, tailB);
      for (let i = 0; i < 6; i++) {
        const dot = ellipsoid(0.035, 0.035, 0.02, whiteMat, 8, false);
        const a = -0.9 + i * 0.36;
        dot.position.set(Math.sin(a) * 0.62, 0.78, Math.cos(a) * 0.62);
        acc.add(dot);
      }
      break;
    }
    case 'eyepatch': {
      const patchMat = toon(0x22263a, toonRamp);
      const patch = ellipsoid(0.17, 0.15, 0.05, patchMat, 16, true, 0.02);
      patch.position.set(0.25, headY + 0.2, faceZ + 0.02);
      patch.rotation.y = 0.28;
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.98, 0.02, 6, 48), patchMat);
      strap.position.set(0, headY + 0.24, 0);
      strap.rotation.set(Math.PI / 2 - 0.15, 0.3, 0);
      acc.add(patch, strap);
      acc.position.y = 0;
      break;
    }
    case 'beanie': {
      const wool = toon(accent, toonRamp);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.62, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
        wool
      );
      dome.scale.set(1, 0.85, 1);
      dome.position.set(0, 0.6, 0.02);
      const domeOut = new THREE.Mesh(dome.geometry, OUTLINE_MAT);
      domeOut.scale.setScalar(1.04);
      dome.add(domeOut);
      const cuff = cylinder(0.63, 0.63, 0.16, toon(accent.clone().offsetHSL(0, 0, -0.1), toonRamp), 28);
      cuff.position.set(0, 0.6, 0.02);
      const pom = ellipsoid(0.13, 0.13, 0.13, toon(0xffffff, toonRamp), 12, true, 0.02);
      pom.position.set(0, 1.18, 0.02);
      acc.add(dome, cuff, pom);
      break;
    }
    case 'grad': {
      const ink = toon(0x1f2a44, toonRamp);
      const cap = cylinder(0.42, 0.46, 0.22, ink, 24);
      cap.position.set(0, 0.88, 0.02);
      const board = box(0.98, 0.05, 0.98, ink);
      board.position.set(0, 1.01, 0.02);
      board.rotation.y = Math.PI / 4;
      const button = ellipsoid(0.05, 0.03, 0.05, gold, 8, false);
      button.position.set(0, 1.05, 0.02);
      const tassel = cylinder(0.02, 0.02, 0.32, gold, 6, 0);
      tassel.position.set(0.42, 0.88, 0.3);
      acc.add(cap, board, button, tassel);
      break;
    }
    case 'tophat': {
      const ink = toon(0x22263a, toonRamp);
      const brim = cylinder(0.62, 0.62, 0.05, ink, 28);
      brim.position.set(0, 0.88, 0.02);
      const tube = cylinder(0.4, 0.42, 0.58, ink, 24);
      tube.position.set(0, 1.18, 0.02);
      const band = cylinder(0.425, 0.425, 0.1, coral, 24, 0);
      band.position.set(0, 0.96, 0.02);
      acc.add(brim, tube, band);
      break;
    }
    case 'cowboy': {
      const leather = toon(0xa0673a, toonRamp);
      const brim = cylinder(0.98, 0.98, 0.05, leather, 32);
      brim.scale.set(1, 1, 0.82);
      brim.position.set(0, 0.86, 0.02);
      const crownC = ellipsoid(0.46, 0.3, 0.42, leather, 20, true, 0.03);
      crownC.position.set(0, 1.04, 0.02);
      const dent = ellipsoid(0.12, 0.05, 0.3, toon(0x7c4a27, toonRamp), 12, false);
      dent.position.set(0, 1.3, 0.02);
      const band = cylinder(0.46, 0.46, 0.08, toon(0x3b2416, toonRamp), 24, 0);
      band.position.set(0, 0.93, 0.02);
      acc.add(brim, crownC, dent, band);
      break;
    }
    default:
      break;
  }
  body.add(acc);
  if (accessoryId !== 'eyepatch' && accessoryId !== 'none') {
    // Los gorros se modelaron sobre la cabeza del chibi (ancho 1, cima en 0.95):
    // se ajustan al ancho, fondo y altura de la cabeza de cada especie para que asienten bien.
    // El pelo da volumen: el gorro se apoya encima y algo más ancho.
    const hairLift: Record<string, number> = {
      none: 0, short: 0.15, bob: 0.15, long: 0.15, braids: 0.14, ponytail: 0.13, twintails: 0.13,
      spiky: 0.2, curly: 0.2, bun: 0.16, pompadour: 0.22, mohawk: 0.24, afro: 0.38,
    };
    const lift = hairLift[hairStyle] ?? 0.15;
    const widen = 1 + lift * 0.6;
    const kx = (headInfo.w / 1.0) * widen;
    const kz = (headInfo.d / 0.96) * widen;
    const ky = (kx + kz) / 2;
    acc.scale.set(kx * 1.03, ky, kz * 1.04);
    acc.position.y = headInfo.y + headInfo.h + lift - 0.95 * ky;
  }
  if (isHuman) {
    // Reunimos la cabeza (cara, pelo, gafas, gorro…) y la ponemos a escala Mii sobre el cuerpo.
    const headRig = new THREE.Group();
    const parts = [...humanHeadParts, ...body.children.slice(headStartIdx, headEndIdx), acc];
    parts.forEach((o) => {
      body.remove(o);
      o.position.y -= rigY;
      headRig.add(o);
    });
    headRig.scale.setScalar(HUMAN_HEAD_K);
    headRig.position.y = HUMAN_HEAD_Y;
    body.add(headRig);
  }

  // --- ROPA DEL TORSO (chaleco pirata, marinero, abrigo, sudadera, bufanda) ---
  const outfitId = config.outfit ?? 'none';
  const torso =
      isHuman
        ? { y: -0.19, sx: 0.38, sy: 0.36, sz: 0.28, from: 0.3 }
        : isMeeseeks
        ? { y: -0.28, sx: 0.52, sy: 0.78, sz: 0.46, from: 0.3 }
        : isCat
          ? { y: -0.36, sx: 0.72, sy: 0.66, sz: 0.68, from: 0.3 }
          : isDragon
            ? { y: -0.34, sx: 0.78, sy: 0.68, sz: 0.74, from: 0.3 }
            : { y: 0, sx: 1.0, sy: 0.95, sz: 0.96, from: 0.53 };
  /** Color de las mangas de cada prenda (null = prenda sin mangas). */
  const sleeveColorFor = (id: string): THREE.ColorRepresentation | null => {
    switch (id) {
      case 'none':
      case 'vest':
      case 'scarf':
        return null;
      case 'sailor':
      case 'shirttie':
      case 'overalls':
      case 'labcoat':
      case 'stripes':
        return 0xffffff;
      case 'coat':
        return 0x2b3b5c;
      case 'hoodie':
        return 0x22b567;
      default:
        return accent;
    }
  };
  const sleeveColor = sleeveColorFor(outfitId);
  if (isHuman) {
    humanSleeves.forEach((sl) => {
      (sl.material as THREE.MeshToonMaterial).color.set(sleeveColor ?? accent);
    });
  } else if (sleeveColor !== null) {
    // Mangas sobre los brazos de cualquier especie: así la ropa se lee como ropa.
    const ax = isSlim ? 0.13 : 0.17;
    const ay = isSlim ? 0.42 : 0.27;
    [armL, armR].forEach((arm) => {
      const sl = ellipsoid(ax * 1.14, ay * 0.58, ax * 1.14, toon(sleeveColor, toonRamp), 16, true, 0.025);
      sl.position.y = ay * 0.45;
      arm.add(sl);
    });
  }
  if (outfitId !== 'none' && outfitId !== 'scarf' && outfitId !== 'vest') {
    bellyParts.forEach((b) => (b.visible = false));
  }
  if (outfitId !== 'none') {
    const shell = (
      color: THREE.ColorRepresentation,
      opts: { gap?: number; from?: number; grow?: number } = {}
    ) => {
      const gap = opts.gap ?? 0;
      const grow = opts.grow ?? 1.035;
      const geo = new THREE.SphereGeometry(
        1,
        32,
        16,
        Math.PI / 2 + gap / 2,
        Math.PI * 2 - gap,
        Math.PI * (opts.from ?? torso.from),
        Math.PI * (1 - (opts.from ?? torso.from)) * 0.86
      );
      const mat = toon(color, toonRamp);
      (mat as THREE.Material).side = THREE.DoubleSide;
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(torso.sx * grow, torso.sy * grow, torso.sz * grow);
      m.position.y = torso.y;
      const out = new THREE.Mesh(geo, OUTLINE_MAT);
      out.scale.setScalar(1.025);
      m.add(out);
      body.add(m);
      return m;
    };
    const collarY = torso.y + torso.sy * Math.cos(Math.PI * torso.from) * 1.03;
    const collarR = Math.sqrt(Math.max(0.05, 1 - Math.cos(Math.PI * torso.from) ** 2)) * torso.sx * 1.04;
    const clothColor = accent.clone();
    if (outfitId === 'tshirt') {
      shell(clothColor);
      const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), toon(0xffffff, toonRamp));
      emblem.scale.set(1, 1, 0.35);
      emblem.position.set(0.12 * torso.sx, torso.y - 0.05 * torso.sy + 0.12 * torso.sy, torso.sz * 1.02);
      body.add(emblem);
    } else if (outfitId === 'polo') {
      shell(clothColor);
      const collarMat = toon(clothColor.clone().offsetHSL(0, 0, 0.12), toonRamp);
      [-1, 1].forEach((side) => {
        const flap = ellipsoid(0.11 * Math.max(0.6, torso.sx), 0.05, 0.08, collarMat, 10, true, 0.015);
        flap.position.set(side * collarR * 0.45, collarY - 0.02, torso.sz * 0.78);
        flap.rotation.set(0.5, side * 0.4, side * -0.4);
        body.add(flap);
      });
      [0, 1].forEach((i) => {
        const btn = ellipsoid(0.022, 0.022, 0.012, toon(0xffffff, toonRamp), 8, false);
        const y = collarY - 0.08 - i * 0.07;
        btn.position.set(0, y, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((y - torso.y) / torso.sy) ** 2)) + 0.025);
        body.add(btn);
      });
    } else if (outfitId === 'stripes') {
      shell(0xffffff);
      const stripeMat = toon(clothColor, toonRamp);
      [0.42, 0.52, 0.62, 0.72, 0.82].forEach((f) => {
        const y = torso.y + torso.sy * Math.cos(Math.PI * f) * 1.035;
        const r = Math.sin(Math.PI * f) * torso.sx * 1.04;
        if (f < torso.from) return;
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(r, 0.03, 6, 40), stripeMat);
        stripe.rotation.x = Math.PI / 2;
        stripe.scale.set(1, torso.sz / torso.sx, 1);
        stripe.position.y = y;
        body.add(stripe);
      });
    } else if (outfitId === 'blazer') {
      shell(0xffffff, { grow: 1.02 });
      shell(clothColor, { gap: 0.7, grow: 1.06 });
      const lapelMat = toon(clothColor.clone().offsetHSL(0, 0, -0.12), toonRamp);
      [-1, 1].forEach((side) => {
        const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.06, torso.sy * 0.55, 0.03), lapelMat);
        const y = collarY - torso.sy * 0.3;
        lapel.position.set(side * 0.1 * Math.max(0.6, torso.sx), y, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((y - torso.y) / torso.sy) ** 2)) + 0.04);
        lapel.rotation.z = side * 0.35;
        body.add(lapel);
      });
      const crest = ellipsoid(0.045, 0.05, 0.015, gold, 8, false);
      const cy = torso.y + torso.sy * 0.25;
      crest.position.set(-0.24 * torso.sx, cy, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((cy - torso.y) / torso.sy) ** 2 - 0.06)) + 0.04);
      body.add(crest);
    } else if (outfitId === 'jersey') {
      shell(clothColor);
      const white = toon(0xffffff, toonRamp);
      const band = new THREE.Mesh(new THREE.TorusGeometry(Math.sin(Math.PI * 0.62) * torso.sx * 1.045, 0.045, 6, 40), white);
      band.rotation.x = Math.PI / 2;
      band.scale.set(1, torso.sz / torso.sx, 1);
      band.position.y = torso.y + torso.sy * Math.cos(Math.PI * 0.62) * 1.035;
      const neck = new THREE.Mesh(new THREE.TorusGeometry(collarR * 0.95, 0.04, 8, 36), white);
      neck.rotation.x = Math.PI / 2;
      neck.scale.set(1, torso.sz / torso.sx, 1);
      neck.position.y = collarY;
      body.add(band, neck);
    } else if (outfitId === 'labcoat') {
      shell(clothColor, { grow: 1.02 });
      shell(0xffffff, { gap: 0.5, grow: 1.07 });
      const coatMat = toon(0xffffff, toonRamp);
      (coatMat as THREE.Material).side = THREE.DoubleSide;
      const tailGeo = new THREE.CylinderGeometry(torso.sx * 1.02, torso.sx * 1.12, torso.sy * 0.7, 28, 1, true, 0.35, Math.PI * 2 - 0.7);
      const tails = new THREE.Mesh(tailGeo, coatMat);
      tails.position.y = torso.y - torso.sy * 0.95;
      const tailsOut = new THREE.Mesh(tailGeo, OUTLINE_MAT);
      tailsOut.scale.set(1.03, 1, 1.03);
      tails.add(tailsOut);
      const pocket = ellipsoid(0.07, 0.05, 0.015, toon(0x60a5fa, toonRamp), 8, false);
      const py = torso.y + torso.sy * 0.2;
      pocket.position.set(-0.26 * torso.sx, py, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((py - torso.y) / torso.sy) ** 2 - 0.08)) + 0.05);
      body.add(tails, pocket);
    } else if (outfitId === 'raincoat') {
      shell(clothColor, { grow: 1.05 });
      const hood = ellipsoid(0.55 * torso.sx, 0.28, 0.28, toon(clothColor, toonRamp), 16, true, 0.03);
      hood.position.set(0, collarY + 0.04, -torso.sz * 0.72);
      body.add(hood);
      [0, 1, 2].forEach((i) => {
        const toggle = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.05, 4, 8), toon(0x7c4a27, toonRamp));
        toggle.rotation.z = Math.PI / 2;
        const y = collarY - 0.1 - i * torso.sy * 0.28;
        toggle.position.set(0, y, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((y - torso.y) / torso.sy) ** 2)) + 0.05);
        body.add(toggle);
      });
    } else if (outfitId === 'shirttie') {
      shell(0xffffff);
      const tieMat = toon(clothColor, toonRamp);
      const knot = ellipsoid(0.05, 0.045, 0.035, tieMat, 10, true, 0.012);
      knot.position.set(0, collarY - 0.05, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((collarY - 0.05 - torso.y) / torso.sy) ** 2)) + 0.03);
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.07, torso.sy * 0.9, 4), tieMat);
      blade.rotation.z = Math.PI;
      blade.rotation.y = Math.PI / 4;
      blade.scale.set(1, 1, 0.35);
      const by = collarY - 0.07 - torso.sy * 0.45;
      blade.position.set(0, by, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((by - torso.y) / torso.sy) ** 2)) + 0.03);
      const bladeOut = new THREE.Mesh(blade.geometry, OUTLINE_MAT);
      bladeOut.scale.setScalar(1.12);
      blade.add(bladeOut);
      const collar = new THREE.Mesh(new THREE.TorusGeometry(collarR * 0.98, 0.04, 8, 36), toon(0xffffff, toonRamp));
      collar.rotation.x = Math.PI / 2;
      collar.scale.set(1, torso.sz / torso.sx, 1);
      collar.position.y = collarY;
      body.add(knot, blade, collar);
    } else if (outfitId === 'dress') {
      shell(clothColor);
      const skirtMat = toon(clothColor, toonRamp);
      (skirtMat as THREE.Material).side = THREE.DoubleSide;
      const skirtGeo = new THREE.CylinderGeometry(torso.sx * 0.9, torso.sx * 1.35, torso.sy * 1.1, 28, 1, true);
      const skirt = new THREE.Mesh(skirtGeo, skirtMat);
      skirt.position.y = torso.y - torso.sy * 0.75;
      const skirtOut = new THREE.Mesh(skirtGeo, OUTLINE_MAT);
      skirtOut.scale.set(1.03, 1, 1.03);
      skirt.add(skirtOut);
      const belt = new THREE.Mesh(new THREE.TorusGeometry(torso.sx * 0.9, 0.03, 6, 36), toon(0xffffff, toonRamp));
      belt.rotation.x = Math.PI / 2;
      belt.position.y = torso.y - torso.sy * 0.2;
      body.add(skirt, belt);
    } else if (outfitId === 'overalls') {
      shell(0xffffff, { grow: 1.02 });
      shell(clothColor, { from: 0.55, grow: 1.05 });
      const denim = toon(clothColor, toonRamp);
      const bib = ellipsoid(0.42 * torso.sx, 0.3 * torso.sy, 0.05, denim, 14, true, 0.015);
      bib.position.set(0, torso.y + 0.08 * torso.sy, torso.sz * 0.97);
      body.add(bib);
      [-1, 1].forEach((side) => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, torso.sy * 0.75, 0.03), denim);
        strap.position.set(side * 0.28 * torso.sx, torso.y + 0.45 * torso.sy, torso.sz * 0.86);
        strap.rotation.x = -0.35;
        const btn = ellipsoid(0.03, 0.03, 0.02, gold, 8, false);
        btn.position.set(side * 0.28 * torso.sx, torso.y + 0.22 * torso.sy, torso.sz * 1.0);
        body.add(strap, btn);
      });
    } else if (outfitId === 'sweater') {
      shell(clothColor);
      const knit = toon(0xffffff, toonRamp);
      [0.6, 0.7].forEach((f) => {
        const y = torso.y + torso.sy * Math.cos(Math.PI * f) * 1.035;
        const r = Math.sin(Math.PI * f) * torso.sx * 1.04;
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(r, 0.026, 6, 40), knit);
        stripe.rotation.x = Math.PI / 2;
        stripe.scale.set(1, torso.sz / torso.sx, 1);
        stripe.position.y = y;
        body.add(stripe);
      });
      const neck = new THREE.Mesh(new THREE.TorusGeometry(collarR * 0.95, 0.05, 8, 36), toon(clothColor.clone().offsetHSL(0, 0, -0.1), toonRamp));
      neck.rotation.x = Math.PI / 2;
      neck.scale.set(1, torso.sz / torso.sx, 1);
      neck.position.y = collarY;
      body.add(neck);
    } else if (outfitId === 'jacket') {
      shell(0xffffff, { grow: 1.02 });
      shell(clothColor, { gap: 0.55, grow: 1.06 });
      const collar = new THREE.Mesh(new THREE.TorusGeometry(collarR * 1.02, 0.055, 8, 36), toon(clothColor.clone().offsetHSL(0, 0, -0.14), toonRamp));
      collar.rotation.x = Math.PI / 2;
      collar.scale.set(1, torso.sz / torso.sx, 1);
      collar.position.y = collarY;
      body.add(collar);
    } else if (outfitId === 'vest') {
      shell(0xe63946, { gap: 0.9 });
      [-1, 1].forEach((side) => {
        const btn = ellipsoid(0.035, 0.035, 0.02, gold, 8, false);
        btn.position.set(side * 0.3 * torso.sx, torso.y - 0.35 * torso.sy, torso.sz * 0.98);
        body.add(btn);
      });
    } else if (outfitId === 'sailor') {
      shell(0xffffff);
      const stripeMat = toon(0x2563eb, toonRamp);
      [0.62, 0.72, 0.82].forEach((f) => {
        const y = torso.y + torso.sy * Math.cos(Math.PI * f) * 1.035;
        const r = Math.sin(Math.PI * f) * torso.sx * 1.04;
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 6, 40), stripeMat);
        stripe.rotation.x = Math.PI / 2;
        stripe.scale.set(1, torso.sz / torso.sx, 1);
        stripe.position.y = y;
        body.add(stripe);
      });
      const tie = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 3), stripeMat);
      tie.rotation.z = Math.PI;
      tie.position.set(0, collarY - 0.12, torso.sz * 0.9 + 0.02);
      body.add(tie);
    } else if (outfitId === 'coat') {
      shell(0x2b3b5c, { gap: 0.35, from: torso.from - 0.08 });
      const lapel = new THREE.Mesh(new THREE.TorusGeometry(collarR, 0.05, 8, 40), gold);
      lapel.rotation.x = Math.PI / 2;
      lapel.scale.set(1, torso.sz / torso.sx, 1);
      lapel.position.y = collarY;
      body.add(lapel);
      [-0.16, 0.16].forEach((x) =>
        [0, 1].forEach((row) => {
          const btn = ellipsoid(0.04, 0.04, 0.025, gold, 8, false);
          btn.position.set(x * torso.sx, torso.y - (0.25 + row * 0.25) * torso.sy, torso.sz * 1.0);
          body.add(btn);
        })
      );
      [-1, 1].forEach((side) => {
        const ep = ellipsoid(0.2, 0.06, 0.16, gold, 12, true, 0.02);
        ep.position.set(side * collarR * 0.95, collarY + 0.02, 0);
        body.add(ep);
      });
    } else if (outfitId === 'hoodie') {
      shell(0x22b567);
      const pocket = ellipsoid(0.32 * torso.sx, 0.12, 0.05, toon(0x178a4c, toonRamp), 14, true, 0.015);
      pocket.position.set(0, torso.y - 0.5 * torso.sy, torso.sz * 0.92);
      const hood = ellipsoid(0.55 * torso.sx, 0.3, 0.3, toon(0x22b567, toonRamp), 16, true, 0.03);
      hood.position.set(0, collarY + 0.05, -torso.sz * 0.72);
      body.add(pocket, hood);
    } else if (outfitId === 'scarf') {
      const scarfMat = toon(0xff7a1a, toonRamp);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(collarR * 0.98, 0.1, 10, 40), scarfMat);
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1, torso.sz / torso.sx, 1);
      ring.position.y = collarY;
      const ringOut = new THREE.Mesh(ring.geometry, OUTLINE_MAT);
      ringOut.scale.setScalar(1.06);
      ring.add(ringOut);
      const hang = ellipsoid(0.1, 0.3, 0.05, scarfMat, 12, true, 0.02);
      hang.position.set(0.28 * torso.sx, collarY - 0.28, torso.sz * 0.95);
      hang.rotation.z = 0.15;
      body.add(ring, hang);
    }
  }
  if (['cap', 'wizard', 'crown', 'beret', 'halo', 'strawhat', 'captain', 'bandana', 'beanie', 'grad', 'tophat', 'cowboy'].includes(accessoryId)) {
    antenna.rotation.z = -0.35;
  }

  // --- VFX 1: ESTRELLAS DE CELEBRACIÓN Y ALEGRÍA ---
  const sparkles = new THREE.Group();
  const sparkleMat = new THREE.MeshBasicMaterial({
    color: 0xffd15c,
    transparent: true,
    opacity: 0,
  });
  for (let i = 0; i < 8; i++) {
    const sMesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.065 + (i % 3) * 0.018),
      sparkleMat
    );
    sparkles.add(sMesh);
  }
  scene.add(sparkles);

  // --- VFX 2: CORAZONES 3D (EMOCIÓN LOVE AL ACARICIAR) ---
  const heartsGroup = new THREE.Group();
  const heartMat = toon(0xff4d79, toonRamp);
  for (let i = 0; i < 5; i++) {
    heartsGroup.add(createHeartMesh(heartMat));
  }
  scene.add(heartsGroup);

  // --- VFX 3: VAPOR Y VENITA DE IRA CÓMICA 3D (EMOCIÓN ANGRY / RAGE ESTILO TOMODACHI) ---
  const rageGroup = new THREE.Group();
  const rageVeinMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
  // Símbolo 💢 en la frente
  const veinCross = new THREE.Group();
  veinCross.position.set(0.38, headY + 0.56, faceZ - 0.02);
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sy) => {
      const bar = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.018, 0.075, 6, 8),
        rageVeinMat
      );
      bar.position.set(sx * 0.045, sy * 0.045, 0);
      bar.rotation.z = sx * sy > 0 ? Math.PI / 4 : -Math.PI / 4;
      veinCross.add(bar);
    });
  });
  body.add(veinCross);

  // Nubes de vapor/humo 3D saliendo de la cabeza cuando tiene ira (rage)
  const steamMat = toon(0xffe4e6, toonRamp);
  for (let i = 0; i < 5; i++) {
    const puff = ellipsoid(0.11, 0.09, 0.1, steamMat, 12, true, 0.02);
    rageGroup.add(puff);
  }
  scene.add(rageGroup);

  // --- VFX 4: ZZZ Y BURBUJA DE SUEÑO (EMOCIÓN SLEEPY DORMID@) ---
  const zzz = new THREE.Group();
  const zMat = new THREE.MeshBasicMaterial({
    color: 0x67769c,
    transparent: true,
    opacity: 0.85,
  });
  for (let i = 0; i < 3; i++) {
    zzz.add(
      new THREE.Mesh(new THREE.TorusGeometry(0.05 + i * 0.022, 0.016, 8, 16), zMat)
    );
  }
  scene.add(zzz);

  const sleepBubbleMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.65,
  });
  const sleepBubble = ellipsoid(0.11, 0.11, 0.11, sleepBubbleMat, 16, true, 0.015);
  sleepBubble.position.set(0.16, headY + 0.08, faceZ + 0.08);
  body.add(sleepBubble);

  // --- CRECIMIENTO: HUEVO → BEBÉ → NIÑO → JOVEN → ADULTO ---
  const growth = Math.max(0, Math.min(1, options.growth ?? 0));
  const stageScale = petStage === 'baby' ? 0.62 : petStage === 'kid' ? 0.78 : petStage === 'teen' ? 0.9 : 1;
  /** Baja al personaje escalado para que siga pisando la roca. */
  const stageLift = -0.98 * (1 - stageScale);
  root.scale.setScalar(stageScale);
  const headTop = isHuman ? HUMAN_HEAD_Y + humanHead.h * HUMAN_HEAD_K : isSlim ? 1.12 : isCat || isDragon ? 0.98 : 0.95;
  const eggTint = new THREE.Color(0xfff8ec).lerp(baseBodyColor, 0.3);
  const eggMat = toon(eggTint, toonRamp);
  let eggGroup: THREE.Group | null = null;
  const eggCracks: THREE.Object3D[] = [];

  if (petStage === 'egg') {
    body.visible = false;
    eggGroup = new THREE.Group();
    // Silueta de huevo (más estrecha arriba) con contorno toon
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI;
      const y = -Math.cos(a) * 0.86;
      const r = Math.sin(a) * 0.66 * (y > 0 ? 1 - 0.2 * (y / 0.86) : 1);
      profile.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    const eggGeo = new THREE.LatheGeometry(profile, 36);
    const shellMesh = new THREE.Mesh(eggGeo, eggMat);
    const shellOut = new THREE.Mesh(eggGeo, OUTLINE_MAT);
    shellOut.scale.setScalar(1.045);
    shellMesh.add(shellOut);
    eggGroup.add(shellMesh);
    const radiusAt = (y: number) => {
      const a = Math.acos(Math.max(-1, Math.min(1, -y / 0.86)));
      return Math.sin(a) * 0.66 * (y > 0 ? 1 - 0.2 * (y / 0.86) : 1);
    };
    // Manchas del color de los detalles
    const spotMat = toon(accent, toonRamp);
    [
      [-0.45, 0.4], [0.35, 1.3], [0.2, 2.5], [-0.25, 3.4], [0.5, 4.4], [-0.5, 5.3], [0.05, 0.1], [0.55, 2.0],
    ].forEach(([y, th]) => {
      const r = radiusAt(y!);
      const spot = ellipsoid(0.1, 0.085, 0.03, spotMat, 12, false);
      spot.position.set(Math.sin(th!) * r, y!, Math.cos(th!) * r);
      spot.lookAt(spot.position.clone().multiplyScalar(2));
      eggGroup!.add(spot);
    });
    // Franja en zigzag del color principal
    const zigMat = toon(baseBodyColor, toonRamp);
    const band = new THREE.Mesh(new THREE.TorusGeometry(radiusAt(-0.02) + 0.005, 0.035, 8, 48), zigMat);
    band.rotation.x = Math.PI / 2;
    band.position.y = -0.04;
    eggGroup.add(band);
    for (let i = 0; i < 16; i++) {
      const th = (i / 16) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.13, 4), zigMat);
      const r = radiusAt(0.04);
      tooth.position.set(Math.sin(th) * r, 0.04, Math.cos(th) * r);
      tooth.rotation.y = th;
      tooth.scale.set(1, 1, 0.3);
      eggGroup.add(tooth);
    }
    // Grietas que aparecen al acercarse a la eclosión
    const crackMat = new THREE.MeshBasicMaterial({ color: 0x3a2a1e });
    const crackPath = [
      [-0.26, 0.36, 0.5], [-0.12, 0.28, -0.6], [0.0, 0.38, 0.6], [0.13, 0.28, -0.6], [0.26, 0.37, 0.5],
    ];
    crackPath.forEach(([x, y, rot], i) => {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.022, 0.02), crackMat);
      const r = radiusAt(y!);
      const z = Math.sqrt(Math.max(0, r * r - x! * x!)) + 0.005;
      seg.position.set(x!, y!, z);
      seg.lookAt(new THREE.Vector3(x! * 2, y!, z * 2));
      seg.rotateZ(rot!);
      seg.visible = growth > 0.25 + i * 0.12;
      eggGroup!.add(seg);
      eggCracks.push(seg);
    });
    // Nido de paja
    const straw = toon(0xd9a85b, toonRamp);
    const nest = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.15, 8, 28), straw);
    nest.rotation.x = Math.PI / 2;
    nest.position.y = -0.8;
    const nestOut = new THREE.Mesh(nest.geometry, OUTLINE_MAT);
    nestOut.scale.setScalar(1.04);
    nest.add(nestOut);
    eggGroup.add(nest);
    for (let i = 0; i < 9; i++) {
      const th = (i / 9) * Math.PI * 2;
      const twig = cylinder(0.018, 0.018, 0.34, toon(0xb7853f, toonRamp), 6, 0);
      twig.position.set(Math.sin(th) * 0.6, -0.74, Math.cos(th) * 0.6);
      twig.rotation.set(Math.PI / 2, 0, th + 0.6);
      eggGroup.add(twig);
    }
    eggGroup.position.y = -0.08;
    root.add(eggGroup);
  } else if (petStage === 'baby') {
    // Recién nacido: lleva la mitad del cascarón como gorrito.
    acc.visible = false;
    const capGroup = new THREE.Group();
    const capMat = toon(eggTint, toonRamp);
    (capMat as THREE.Material).side = THREE.DoubleSide;
    const capGeo = new THREE.SphereGeometry(0.5, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const cap = new THREE.Mesh(capGeo, capMat);
    const capOut = new THREE.Mesh(capGeo, OUTLINE_MAT);
    capOut.scale.setScalar(1.05);
    cap.add(capOut);
    capGroup.add(cap);
    const rimY = 0.5 * Math.cos(Math.PI * 0.42);
    const rimR = 0.5 * Math.sin(Math.PI * 0.42);
    for (let i = 0; i < 12; i++) {
      const th = (i / 12) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), capMat);
      tooth.position.set(Math.sin(th) * rimR, rimY - 0.05, Math.cos(th) * rimR);
      tooth.rotation.set(Math.PI, th, 0);
      tooth.scale.set(1, 1, 0.35);
      capGroup.add(tooth);
    }
    const spot = ellipsoid(0.09, 0.08, 0.03, toon(accent, toonRamp), 10, false);
    spot.position.set(0.18, 0.4, 0.22);
    spot.lookAt(spot.position.clone().multiplyScalar(2));
    capGroup.add(spot);
    capGroup.scale.setScalar(isSlim ? 0.8 : 1);
    const hasHair = (config.hairStyle ?? (isHuman ? 'short' : isMeeseeks ? 'spiky' : 'none')) !== 'none';
    capGroup.position.set(0, headTop - (hasHair ? 0.16 : 0.32), -0.02);
    capGroup.rotation.z = 0.22;
    body.add(capGroup);
    if (config.species === 'puff' && !hasHair) {
      // Rizo de recién nacido
      const curl = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 8, 18, Math.PI * 1.6), toon(baseBodyColor.clone().offsetHSL(0, 0.05, -0.1), toonRamp));
      curl.position.set(-0.22, headTop + 0.02, 0.2);
      curl.rotation.set(0, 0.4, 0.6);
      body.add(curl);
    }
  } else if (petStage === 'kid') {
    // Pequeño explorador: mochila escolar a la espalda.
    const packMat = toon(accent.clone().offsetHSL(0.5, 0, 0), toonRamp);
    const pack = ellipsoid(0.36 * Math.max(0.7, torso.sx), 0.34, 0.16, packMat, 18, true, 0.025);
    pack.position.set(0, torso.y + 0.04, -torso.sz - 0.08);
    const flap = ellipsoid(0.3 * Math.max(0.7, torso.sx), 0.14, 0.06, toon(accent.clone().offsetHSL(0.5, 0, -0.1), toonRamp), 14, true, 0.015);
    flap.position.set(0, torso.y + 0.24, -torso.sz - 0.2);
    body.add(pack, flap);
  }

  if (options.focus === 'face' && !inHouse && !options.house) {
    // Primer plano de la cara, como al editar rasgos en el Mii Maker.
    const fy = isHuman ? HUMAN_HEAD_Y : headY;
    camera.position.set(0, fy + 0.3, isHuman ? 3.4 : 4.1);
    camera.lookAt(0, fy + 0.18, 0);
  }

  // Multiplicadores de complexión física (bodyScale)
  const scaleConfig = config.bodyScale ?? 'normal';
  // Altura y peso estilo Mii Maker (si existen) o la complexión clásica.
  const baseScaleX =
    config.weight !== undefined
      ? 0.86 + Math.max(0, Math.min(1, config.weight)) * 0.3
      : scaleConfig === 'chubby' ? 1.15 : scaleConfig === 'tall' ? 0.9 : scaleConfig === 'chibi' ? 1.05 : 1;
  // El chibi bebé es todavía más redondito.
  const babyRound = petStage === 'baby' && config.species === 'puff' ? 0.92 : 1;
  const baseScaleY =
    babyRound *
    (config.height !== undefined
      ? 0.86 + Math.max(0, Math.min(1, config.height)) * 0.28
      : scaleConfig === 'tall' ? 1.13 : scaleConfig === 'chibi' ? 0.92 : scaleConfig === 'chubby' ? 0.95 : 1);

  const s = {
    mood: 'ok' as PetMood,
    speaking: false,
    energy: 0.7,
    rotY: 0,
    rotX: 0,
    dragging: false,
    jumpY: 0,
    jumpV: 0,
    squash: 1,
    joy: 0,
    spin: 0,
    blinkAt: 2,
    blink: 0,
    lookAt: 1.5,
    look: new THREE.Vector2(),
    lookTarget: new THREE.Vector2(),
    antennaAngle: 0,
    antennaVel: 0,
    lastRootY: 0,
    hopAt: 4,
  };

  const update = (dt: number, t: number) => {
    const sleepy = s.mood === 'sleepy';
    const sad = s.mood === 'sad';
    const angry = s.mood === 'angry';
    const rage = s.mood === 'rage';
    const love = s.mood === 'love';
    const eating = s.mood === 'eating';
    const celebrate = s.mood === 'celebrate';
    const happy = s.mood === 'happy' || celebrate || love || s.joy > 0;
    const breath = sleepy ? 1.0 : rage ? 6.5 : angry ? 4.2 : 2.2;

    // Color del cuerpo según enojo / ira
    if (rage) {
      bodyMat.color.lerpColors(
        baseBodyColor,
        rageFlushColor,
        0.55 + Math.sin(t * 14) * 0.2
      );
    } else if (angry) {
      bodyMat.color.lerpColors(baseBodyColor, angryFlushColor, 0.35);
    } else {
      bodyMat.color.copy(baseBodyColor);
    }

    // Saltos automáticos según estado
    if ((s.mood === 'happy' || celebrate) && t > s.hopAt && s.jumpY === 0) {
      s.jumpV = celebrate ? 3.2 : 2.4;
      s.hopAt = t + (celebrate ? 1.4 : 3 + Math.random() * 4);
    }
    if (rage && s.jumpY === 0 && Math.sin(t * 10) > 0.92) {
      // Pisotones furiosos en modo Ira
      s.jumpV = 1.65;
    }

    if (s.jumpY > 0 || s.jumpV > 0) {
      s.jumpV -= 9.5 * dt;
      s.jumpY += s.jumpV * dt;
      if (s.jumpY <= 0) {
        s.jumpY = 0;
        s.jumpV = 0;
        s.squash = 0.82;
      }
    }
    s.squash += (1 - s.squash) * Math.min(1, dt * 9);
    const stretch = s.jumpV > 0 ? 1 + Math.min(0.12, s.jumpV * 0.04) : 1;
    const b = Math.sin(t * breath) * 0.018;
    const sy = baseScaleY * (1 + b) * s.squash * stretch;
    const sxz = (baseScaleX * (1 - b * 0.6)) / Math.sqrt(s.squash * stretch);
    body.scale.set(sxz, sy, sxz);
    body.position.y = -(1 - s.squash) * 0.35;

    // Temblor horizontal cuando está enojado o con ira
    const rageJitterX = rage
      ? Math.sin(t * 48) * 0.055
      : angry
        ? Math.sin(t * 28) * 0.022
        : love
          ? Math.sin(t * 4.5) * 0.04
          : 0;

    root.position.x = rageJitterX;
    root.position.y =
      stageLift + s.jumpY + Math.sin(t * breath) * 0.03 - (sad || sleepy ? 0.04 : 0);
    if (eggGroup) {
      // El huevo se mece; más fuerte cuanto más cerca está de eclosionar o al tocarlo.
      const shake = 0.05 * (1 + growth * 2.2) + s.joy * 0.12 + (s.speaking ? 0.05 : 0);
      eggGroup.rotation.z = Math.sin(t * (2.2 + growth * 3)) * shake;
      eggGroup.rotation.x = Math.sin(t * 1.7) * 0.03;
      eggCracks.forEach((c, i) => (c.visible = growth > 0.25 + i * 0.12 || s.joy > 0.5));
    }

    islandPedestal.position.y = -1.04 + Math.sin(t * 1.4) * 0.025;
    islandPedestal.rotation.y = s.rotY * 0.35;
    habitatProp3D.animate(t, s.speaking || celebrate);
    houseDiorama?.animate(t);

    if (!s.dragging) {
      s.rotY *= Math.pow(0.04, dt);
      s.rotX *= Math.pow(0.02, dt);
    }
    if (s.spin > 0) s.spin = Math.max(0, s.spin - dt * 2.2);
    const spinAngle =
      (1 - Math.pow(s.spin, 2)) * Math.PI * 2 * (s.spin > 0 ? 1 : 0);
    root.rotation.y = s.rotY + Math.sin(t * 0.7) * 0.12 + spinAngle;
    root.rotation.x =
      s.rotX + (sad ? 0.12 : 0) + (sleepy ? 0.1 + Math.sin(t * 1.5) * 0.05 : 0);
    root.rotation.z =
      love ? Math.sin(t * 3.8) * 0.09 : Math.sin(t * 0.9) * 0.025;

    // Parpadeo y apertura de ojos
    if (t > s.blinkAt) {
      s.blink = 1;
      s.blinkAt = t + 2 + Math.random() * 3.5;
    }
    s.blink = Math.max(0, s.blink - dt * 7);
    const blinkScale = s.blink > 0 ? 1 - Math.sin(s.blink * Math.PI) * 0.92 : 1;
    if (t > s.lookAt) {
      s.lookTarget.set(
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.035
      );
      s.lookAt = t + 1.2 + Math.random() * 2.5;
    }
    s.look.lerp(s.lookTarget, Math.min(1, dt * 6));
    eyes.position.set(s.look.x, 0.17 + headY + eyeDY - rigY + s.look.y, 0);

    const eyeOpen = sleepy
      ? 0.16
      : love
        ? 0.28
        : rage
          ? 0.72
          : happy && config.eyeStyle !== 'happy' && s.joy > 0
            ? 0.45
            : 1;
    eyeParts.forEach((e) => e.scale.set(eyeK * eyeSX, blinkScale * eyeOpen * eyeK * eyeSY, eyeK));

    // Cejas expresivas 3D según emoción (enojo \ /, tristeza / \, normal)
    const targetBrowTilt =
      rage
        ? -0.52
        : angry
          ? -0.38
          : sad || sleepy
            ? 0.32
            : celebrate || love
              ? 0.16
              : baseBrowAngle;
    browL.rotation.z = targetBrowTilt - browRot;
    browR.rotation.z = -targetBrowTilt + browRot;
    browL.position.y = browBaseY - rigY + (rage || angry ? -0.05 : celebrate ? 0.04 : 0);
    browR.position.y = browL.position.y;

    // Boca según estado (hablando, comiendo, enojado, feliz)
    const talking = s.speaking;
    const chomping = eating;
    smileGroup.visible =
      !talking && !chomping && !sad && !angry && !rage && s.mood !== 'hungry';
    open.visible =
      talking || chomping || s.mood === 'hungry' || celebrate || s.joy > 0.3 || rage;
    frown.visible = (sad || angry) && !talking && !chomping;

    if (open.visible) {
      const o = chomping
        ? 0.35 + Math.abs(Math.sin(t * 20)) * 0.85
        : talking
          ? 0.55 + Math.abs(Math.sin(t * 16)) * 0.65
          : rage
            ? 0.75 + Math.abs(Math.sin(t * 18)) * 0.4
            : s.mood === 'hungry'
              ? 0.8 + Math.sin(t * 3) * 0.1
              : 1;
      open.scale.set(1, o, 1);
    }
    smileGroup.scale.setScalar(happy ? 1.16 : 1);

    // Brazos y pies animados
    const wave = s.joy > 0 || talking || celebrate || love;
    if (rage || angry) {
      armL.rotation.z = 0.95 + Math.sin(t * 22) * 0.35;
      armR.rotation.z = -0.95 - Math.sin(t * 22) * 0.35;
      footMeshes[0]!.position.y = -0.88 + Math.max(0, Math.sin(t * 16)) * 0.08;
      footMeshes[1]!.position.y = -0.88 + Math.max(0, -Math.sin(t * 16)) * 0.08;
    } else if (eating) {
      armL.rotation.z = 0.35 + Math.sin(t * 12) * 0.25;
      armR.rotation.z = -0.35 - Math.sin(t * 12) * 0.25;
      footMeshes[0]!.position.y = -0.88;
      footMeshes[1]!.position.y = -0.88;
    } else {
      armL.rotation.z =
        0.55 + (wave ? Math.sin(t * 14) * 0.55 + 0.45 : Math.sin(t * breath) * 0.08);
      armR.rotation.z =
        -0.55 -
        (wave ? Math.sin(t * 14 + 1) * 0.55 + 0.45 : Math.sin(t * breath) * 0.08);
      footMeshes[0]!.position.y = -0.88;
      footMeshes[1]!.position.y = -0.88;
    }
    if (humanArms) {
      // Brazos colgando desde el hombro (el ángulo base de la animación es para brazos-bolita).
      humanArms[0]!.rotation.z = -armL.rotation.z + 0.42;
      humanArms[1]!.rotation.z = -armR.rotation.z - 0.42;
    }

    if (tailGroup) {
      tailGroup.rotation.z =
        Math.sin(t * (rage ? 10 : happy ? 4.8 : 2.8)) * 0.26;
      tailGroup.rotation.x = Math.cos(t * 2.1) * 0.08;
    }

    if (wingL && wingR) {
      const flap = Math.sin(t * (happy || rage || s.jumpY > 0 ? 9 : 4.2)) * 0.32;
      wingL.rotation.y = flap;
      wingR.rotation.y = -flap;
    }

    if (bunnyEars.length === 2) {
      bunnyEars[0]!.rotation.z = 0.14 + Math.sin(t * 3.2) * 0.06;
      bunnyEars[1]!.rotation.z = -0.14 - Math.sin(t * 3.2) * 0.06;
    }

    const rootVel = (root.position.y - s.lastRootY) / Math.max(dt, 0.001);
    s.lastRootY = root.position.y;
    const targetAngle =
      Math.sin(t * 1.6) * 0.06 +
      (s.joy > 0 ? Math.sin(t * 18) * 0.15 : 0) +
      (sleepy ? 0.25 : 0);
    s.antennaVel +=
      ((targetAngle - s.antennaAngle) * 60 - s.antennaVel * 7 - rootVel * 1.2) *
      dt;
    s.antennaAngle += s.antennaVel * dt;
    antenna.rotation.x = s.antennaAngle;
    orb.rotation.y = t * 1.8;

    const base = 0.35 + s.energy * 0.65;
    const pulse = talking
      ? 0.35 + Math.abs(Math.sin(t * 10)) * 0.65
      : Math.sin(t * 2) * 0.08;
    const glow = Math.min(1.4, base + pulse * 0.6);
    orbMat.color.setRGB(1, 0.68 + glow * 0.14, 0.15 + glow * 0.22);
    haloMat.opacity = 0.08 + glow * 0.16;
    halo.scale.setScalar(0.8 + glow * 0.4);

    // --- VFX: Estrellas de celebración ---
    s.joy = Math.max(0, s.joy - dt * 0.8);
    const showSparkles = s.joy > 0.01 || celebrate || eating;
    sparkleMat.opacity = celebrate ? 0.95 : eating ? 0.8 : Math.min(1, s.joy * 1.6);
    sparkles.visible = showSparkles;
    if (showSparkles) {
      sparkles.children.forEach((sp, i) => {
        const a = t * 2.2 + (i / sparkles.children.length) * Math.PI * 2;
        const r = 1.25 + Math.sin(t * 3 + i) * 0.12;
        sp.position.set(
          Math.cos(a) * r,
          0.2 + Math.sin(a * 2) * 0.35 + root.position.y,
          Math.sin(a) * r * 0.6
        );
        sp.rotation.set(t * 3, t * 2, 0);
      });
    }

    // --- VFX: Corazones 3D flotando (love) ---
    heartsGroup.visible = love;
    if (love) {
      heartsGroup.children.forEach((hMesh, i) => {
        const phase = (t * 0.6 + i * 0.2) % 1;
        const angle = (i / heartsGroup.children.length) * Math.PI * 2 + t * 0.8;
        hMesh.position.set(
          Math.cos(angle) * 1.15,
          -0.2 + phase * 1.6,
          Math.sin(angle) * 0.65
        );
        hMesh.scale.setScalar(Math.sin(phase * Math.PI) * 1.2);
        hMesh.rotation.y = Math.sin(t * 2 + i) * 0.4;
      });
    }

    // --- VFX: Venita 💢 y Vapor de Ira Cómica (angry / rage) ---
    veinCross.visible = angry || rage;
    if (veinCross.visible) {
      const vPulse = 0.9 + Math.abs(Math.sin(t * 14)) * 0.35;
      veinCross.scale.setScalar(rage ? vPulse * 1.25 : vPulse * 0.95);
    }
    rageGroup.visible = rage;
    if (rage) {
      rageGroup.children.forEach((puff, i) => {
        const p = (t * 0.9 + i * 0.2) % 1;
        const side = i % 2 === 0 ? 1 : -1;
        puff.position.set(
          side * (0.35 + p * 0.45),
          0.95 + p * 0.85,
          (i - 2) * 0.12
        );
        puff.scale.setScalar((1 - p * 0.4) * 0.16);
      });
    }

    // --- VFX: Dormid@ (Zzz + burbuja de sueño Tomodachi) ---
    zzz.visible = sleepy;
    sleepBubble.visible = sleepy;
    if (sleepy) {
      const bScale = 0.08 + (Math.sin(t * 2.2) * 0.5 + 0.5) * 0.09;
      sleepBubble.scale.setScalar(bScale);
      zzz.children.forEach((z, i) => {
        const p = (t * 0.35 + i * 0.33) % 1;
        z.position.set(0.7 + p * 0.5, 1.0 + p * 0.9, 0.2);
        (z as THREE.Mesh).scale.setScalar(0.6 + p * 0.8);
      });
      zMat.opacity = 0.85;
    }
  };

  return {
    scene,
    camera,
    update,
    setMood: (mood) => {
      const prev = s.mood;
      s.mood = mood;
      if (mood === 'celebrate' && prev !== 'celebrate') {
        s.joy = 1.4;
        s.spin = 1;
        s.jumpV = Math.max(s.jumpV, 3.2);
      } else if (mood === 'rage' && prev !== 'rage') {
        s.jumpV = Math.max(s.jumpV, 2.2);
      }
    },
    setSpeaking: (speaking) => (s.speaking = speaking),
    setEnergy: (energy01) => (s.energy = Math.max(0, Math.min(1, energy01))),
    joy: () => {
      s.joy = 1.3;
      s.spin = 1;
      s.jumpV = Math.max(s.jumpV, 2.8);
    },
    drag: (dx, dy) => {
      s.dragging = true;
      s.rotY += dx * 0.014;
      s.rotX = Math.max(-0.5, Math.min(0.5, s.rotX + dy * 0.01));
    },
    release: () => {
      s.dragging = false;
    },
    dispose: () => {
      toonRamp.dispose();
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose?.();
        if (Array.isArray(m.material)) {
          m.material.forEach((mt) => mt !== OUTLINE_MAT && mt.dispose?.());
        } else if (m.material && m.material !== OUTLINE_MAT) {
          m.material.dispose?.();
        }
      });
    },
  };
}
