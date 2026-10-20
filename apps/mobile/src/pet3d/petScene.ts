import * as THREE from 'three';
import type { PetConfig, PetMood, PetStage } from '../game/pet';
import { box, createToonRamp, cylinder, ellipsoid, OUTLINE_MAT, toon as toonMaterial } from './toonKit';
import type { PetSceneAction, SceneNpc, UnitSceneTheme } from '../game/unitScenes';
import { buildNpc, buildUnitSceneProps } from './unitSceneProps';
import { BALL, buildBuddySpecies, onBall, type SpeciesBuild } from './buddySpecies';
import { buildBuddyProps } from './buddyProps';
import { buildFaceDecals, type FaceLayout, type MouthPose } from './faceDecals';
import {
  drawMiiFace,
  FACE_PHI_SPAN,
  FACE_THETA_SPAN,
  FACE_THETA_START,
} from './faceTexture';
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
  /** Mira hacia el dedo/cursor del jugador (coordenadas -1..1, +y arriba). */
  lookAt: (x: number, y: number) => void;
  /** Toque en un punto (-1..1, +y arriba): cabeza = caricia, barriga = cosquillas, lado = giro. */
  poke: (x: number, y: number) => void;
  /** Doble toque: voltereta. */
  flip: () => void;
  /** Mantener pulsado: abrazo. */
  hug: () => void;
  /** Frotar de un lado a otro: mimos. */
  rub: () => void;
  /** Agitar rápido: se marea. */
  dizzy: () => void;
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
  topOutline.scale.set(1.019, 1.099, 1.019);
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
  cliffOutline.scale.set(1.022, 1.033, 1.022);
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

  const woodMat = toonMaterial(0x8b5a2b, toonRamp);
  const goldMat = toonMaterial(0xf4b942, toonRamp);
  const stoneMat = toonMaterial(0x94a3b8, toonRamp);

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
    const casingMat = toonMaterial(0x2563eb, toonRamp);
    const speakerMat = toonMaterial(0x1e293b, toonRamp);
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
    const potMat = toonMaterial(0xe07a5f, toonRamp);
    const leafMat1 = toonMaterial(0x22c55e, toonRamp);
    const leafMat2 = toonMaterial(0x4ade80, toonRamp);
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
    const chestMat = toonMaterial(0x9a3412, toonRamp);
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
    const tubeMat = toonMaterial(0xfbbf24, toonRamp);
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
  /** Reproduce la eclosión: el huevo tiembla, se agrieta, estalla y sale la mascota bebé. */
  hatching?: boolean;
  /** Isla temática: decorado, personaje invitado y acción de la mascota. */
  scenario?: { theme: UnitSceneTheme; action: PetSceneAction; npc: SceneNpc };
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
  const scenario = !inHouse && !options.house ? options.scenario : undefined;
  const habitatProp3D = createHabitatProp3D(
    inHouse || scenario ? 'none' : config.habitatProp ?? 'campfire',
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
    }
    // Isla con espacio de sobra para la mascota y sus cosas (el encuadre se ajusta solo).
    if (!scenario) islandPedestal.scale.set(1.45, 1, 1.32);
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

  // --- ISLA TEMÁTICA: isla más ancha, decorado, invitado y mascota a escala diorama ---
  let sceneProps: ReturnType<typeof buildUnitSceneProps> | null = null;
  let sceneNpc: ReturnType<typeof buildNpc> | null = null;
  const propsRoot = new THREE.Group();
  if (scenario) {
    islandPedestal.scale.set(1.75, 1, 1.5);
    const k = 0.7;
    stage.scale.setScalar(k);
    stage.position.set(-0.45, -0.92 + 1.0 * k, 0.1);
    camera.position.set(0, 0.9, 8.1);
    camera.lookAt(0, -0.1, 0);
    sceneProps = buildUnitSceneProps(scenario.theme, toonRamp);
    propsRoot.add(sceneProps.group);
    if (scenario.npc) {
      sceneNpc = buildNpc(scenario.npc, toonRamp);
      sceneNpc.group.position.set(1.05, 0, 0.25);
      sceneNpc.group.rotation.y = -0.65;
      propsRoot.add(sceneNpc.group);
    }
    propsRoot.position.y = -0.92;
    scene.add(propsRoot);
  }

  const toon = (color: THREE.ColorRepresentation, ramp: THREE.DataTexture): THREE.MeshToonMaterial =>
    toonMaterial(color, ramp);
  const petStage = options.stage ?? 'adult';
  const tune = config.tuning ?? {};
  const tstep = (v?: number) => Math.max(-3, Math.min(3, Math.round(v ?? 0)));
  const eyeK =
    (petStage === 'baby' ? 1.2 : 1) *
    (1 + tstep(tune.eyeSize) * 0.09);
  const eyeDY = tstep(tune.eyeHeight) * 0.025;
  const eyeDX = tstep(tune.eyeSpacing) * 0.022;
  const glassK = 1 + tstep(tune.glassesSize) * 0.07;
  const glassDY = tstep(tune.glassesHeight) * 0.02;
  /** Parches de barriga: se ocultan cuando la ropa cubre el torso. */
  const bellyParts: THREE.Object3D[] = [];
  const faceCache = new Map<string, THREE.DataTexture>();
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
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pinkNoseMat = toon(0xff6b9d, toonRamp);
  const darkNoseMat = toon(0x28243d, toonRamp);


  const headY = isDragon ? 0.16 : 0.0;
  const faceZ = isDragon ? 0.88 : 0.95;

  let tailGroup: THREE.Group | null = null;
  let wingL: THREE.Group | null = null;
  let wingR: THREE.Group | null = null;
  const bunnyEars: THREE.Object3D[] = [];
  let buddy: SpeciesBuild | null = null;

  if (isDragon) {
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
      hornOut.scale.set(1.088, 1.044, 1.088);
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
    // Amigos redonditos con rasgos propios (gato, pingüino, rana, panda, pollito, hámster, ajolote)
    buddy = buildBuddySpecies(config.species, {
      body,
      bodyColor: baseBodyColor,
      accent,
      bodyMat,
      limbMat,
      toon: (c) => toon(c, toonRamp),
    });
    if (buddy) {
      bellyParts.push(...buddy.bellyParts);
      if (buddy.tail) tailGroup = buddy.tail;
      if (buddy.limbColor !== undefined) limbMat.color.set(buddy.limbColor);
      if (buddy.feetColor !== undefined) feetMat.color.set(buddy.feetColor);
    }

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
      earOut.scale.set(1.077, 1.044, 1.077);
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
    dorsalOut.scale.set(1.066, 1.033, 1.066);
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
  // Medidas aproximadas de la cabeza de cada silueta (para barba y gafas de nieve).
  const headInfo = isDragon ? { w: 0.88, h: 0.78, d: 0.84, y: 0.2 } : { w: 1.0, h: 0.95, d: 0.96, y: 0 };

  // --- CARA DE CALCOMANÍAS (todas las especies) ---
  const elevOf = (y: number) => Math.asin(Math.max(-0.95, Math.min(0.95, (y - headInfo.y) / headInfo.h)));
  const rowOf = (elev: number) => (Math.PI / 2 - elev - FACE_THETA_START) / FACE_THETA_SPAN;
  const decalSize = isDragon ? 1.25 : 1.38;
  const faceLayout: FaceLayout = {
    eyeElev: elevOf(headY + 0.2),
    eyeAz: Math.asin(Math.min(0.9, 0.25 / headInfo.w)),
    browElev: elevOf(headY + 0.45),
    mouthElev: elevOf(headY),
    eyeSize: buddy?.eyeSize ?? 0.3 * decalSize,
    browSize: 0.24 * decalSize,
    mouthSize: buddy?.mouthSize ?? 0.2 * decalSize,
    eyeAnchors: buddy?.eyeAnchors,
    // Hocicos: la boca va sobre el morro
    mouthAnchor: buddy?.mouthAnchor ?? (isBear
      ? { p: new THREE.Vector3(0, -0.06, 1.05), n: new THREE.Vector3(0, -0.25, 1).normalize() }
      : config.species === 'fox'
        ? { p: new THREE.Vector3(0, -0.14, 1.05), n: new THREE.Vector3(0, -0.2, 1).normalize() }
        : isDragon
          ? { p: new THREE.Vector3(0, 0.06, 0.97), n: new THREE.Vector3(0, -0.3, 1).normalize() }
          : undefined),
  };
  const face = buildFaceDecals(
    config,
    { w: headInfo.w, h: headInfo.h, d: headInfo.d, cy: headInfo.y },
    faceLayout,
    {
      humanoid: false,
      material: (map) =>
        Object.assign(toon(0xffffff, toonRamp), {
          map,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -4,
        }),
    }
  );
  body.add(face.group);
  // Rubor, maquillaje, nariz de trazo, lunar y pintura facial: una textura fija sobre la cara.
  const staticFaceTex = drawMiiFace(config, 'open', 'normal', {
    parts: { eyes: false, brows: false, mouth: false },
    nose: false,
    layout: {
      brows: rowOf(faceLayout.browElev),
      eyes: rowOf(faceLayout.eyeElev),
      nose: rowOf((faceLayout.eyeElev + faceLayout.mouthElev) / 2),
      mouth: rowOf(faceLayout.mouthElev),
      cheeks: rowOf(elevOf(headY + 0.05)),
    },
  });
  faceCache.set('static', staticFaceTex);
  const staticFace = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 24, Math.PI / 2 - FACE_PHI_SPAN / 2, FACE_PHI_SPAN, FACE_THETA_START, FACE_THETA_SPAN),
    Object.assign(toon(0xffffff, toonRamp), {
      map: staticFaceTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  staticFace.scale.set(headInfo.w * 1.004, headInfo.h * 1.004, headInfo.d * 1.004);
  staticFace.position.y = headInfo.y;
  staticFace.renderOrder = 2;
  body.add(staticFace);

  // --- GAFAS (independientes del gorro) ---
  const glassesId =
    config.glasses && config.glasses !== 'none'
      ? config.glasses
      : config.accessory === 'glasses'
        ? 'round'
        : 'none';
  if (glassesId !== 'none') {
    const gl = new THREE.Group();
    gl.position.set(0, face.eyePoint.y + eyeDY + glassDY, face.eyePoint.z + 0.04);
    gl.scale.setScalar(glassK);
    const spread = headInfo.w * Math.sin(faceLayout.eyeAz) * Math.cos(faceLayout.eyeElev) + eyeDX;
    const r = faceLayout.eyeSize * 0.52 * Math.max(1, eyeK);
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


  // --- BRAZOS Y PIES TOON ---
  // (En personas son pivotes invisibles: su ángulo mueve las manos flotantes.)
  const armL = ellipsoid(
    0.17,
    0.27,
    0.17,
    limbMat,
    20,
    true,
    0.032
  );
  const armX = isDragon ? 0.78 : 0.94;
  const armY = -0.12;
  armL.position.set(-armX, armY, 0.14);
  const armR = armL.clone();
  armR.position.x = armX;
  body.add(armL, armR);


  const footMeshes: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    const f = ellipsoid(
      0.31,
      0.17,
      0.43,
      feetMat,
      20,
      true,
      0.035
    );
    f.position.set(side * (0.42), -0.88, 0.08);
    f.rotation.y = side * (0.22);
    body.add(f);
    footMeshes.push(f);
  });

  // --- 10 ACCESORIOS / SOMBREROS 3D TOON ---
  const acc = new THREE.Group();
  acc.position.y = headY * 0.65;
  /** Piezas animadas de algunos gorros (hélice que gira, pompón/brote que se mece). */
  let hatSpinner: THREE.Group | null = null;
  let hatWobble: THREE.Object3D | null = null;
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
      // Gorra a la medida de la cabeza: copa que abraza el cráneo y visera al frente.
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.86, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
        coral
      );
      dome.scale.set(1, 0.5, 1);
      dome.position.set(0, 0.6, 0.02);
      const domeOut = new THREE.Mesh(dome.geometry, OUTLINE_MAT);
      domeOut.scale.setScalar(1.02);
      dome.add(domeOut);
      const button = ellipsoid(0.07, 0.04, 0.07, coral, 10, true, 0.015);
      button.position.set(0, 1.03, 0.02);
      acc.add(button);
      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.05, 24),
        coral
      );
      visor.scale.set(1, 1, 0.7);
      visor.position.set(0, 0.64, 0.74);
      visor.rotation.x = 0.12;
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
      haloOut.scale.setScalar(1.066);
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
      capOut.scale.setScalar(1.019);
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
    case 'jester': {
      const crownBand = cylinder(0.6, 0.6, 0.14, toon(0xfacc15, toonRamp), 28);
      crownBand.position.set(0, 0.74, 0.02);
      acc.add(crownBand);
      [-1, 1].forEach((side) => {
        const lobe = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.75, 16), toon(side < 0 ? 0x7b3fe4 : 0xe63946, toonRamp));
        lobe.position.set(side * 0.32, 1.05, 0.02);
        lobe.rotation.z = -side * 1.0;
        const lobeOut = new THREE.Mesh(lobe.geometry, OUTLINE_MAT);
        lobeOut.scale.setScalar(1.04);
        lobe.add(lobeOut);
        const pom = ellipsoid(0.1, 0.1, 0.1, toon(0xffffff, toonRamp), 10, true, 0.015);
        pom.position.set(side * 0.66, 1.1, 0.02);
        acc.add(lobe, pom);
      });
      break;
    }
    case 'chefhat': {
      const white = toon(0xffffff, toonRamp);
      const band = cylinder(0.5, 0.52, 0.18, white, 24);
      band.position.set(0, 0.84, 0.02);
      acc.add(band);
      [[0, 1.12, 0, 0.36], [-0.25, 1.05, 0.05, 0.26], [0.25, 1.05, 0.05, 0.26], [0, 1.05, -0.22, 0.26]].forEach(([x, y, z, r]) => {
        const puff = ellipsoid(r!, r! * 0.85, r!, white, 14, true, 0.02);
        puff.position.set(x!, y!, z!);
        acc.add(puff);
      });
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
      domeOut.scale.setScalar(1.022);
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
    case 'propeller': {
      // Gorra de gajos de colores con hélice que gira (más rápido cuando está feliz)
      const colors = [accent, new THREE.Color(0xffd43b), new THREE.Color(0x38bdf8), new THREE.Color(0xff5c8a)];
      for (let i = 0; i < 4; i++) {
        const gajo = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 12, 10, (i * Math.PI) / 2, Math.PI / 2, 0, Math.PI / 2),
          toon(colors[i]!, toonRamp)
        );
        gajo.position.y = 0.78;
        gajo.scale.y = 0.62;
        acc.add(gajo);
      }
      const visor = ellipsoid(0.3, 0.03, 0.2, toon(accent, toonRamp), 16, true, 0.02);
      visor.position.set(0, 0.8, 0.5);
      const stem = cylinder(0.025, 0.025, 0.14, gold, 8, 0);
      stem.position.y = 1.15;
      hatSpinner = new THREE.Group();
      hatSpinner.position.y = 1.23;
      [0, 1].forEach((k) => {
        const blade = ellipsoid(0.26, 0.02, 0.07, toon(k ? 0xff5c8a : 0x38bdf8, toonRamp), 12, true, 0.015);
        blade.position.x = k ? 0.24 : -0.24;
        blade.rotation.x = k ? 0.3 : -0.3;
        hatSpinner!.add(blade);
      });
      acc.add(visor, stem, hatSpinner);
      break;
    }
    case 'party': {
      const coneMat = toon(accent, toonRamp);
      const party = new THREE.Mesh(new THREE.ConeGeometry(0.27, 0.62, 20), coneMat);
      party.position.set(0.14, 1.18, 0.05);
      party.rotation.z = -0.22;
      const dotMat = toon(0xffffff, toonRamp);
      for (let i = 0; i < 6; i++) {
        const a = i * 2.1;
        const yy = -0.2 + (i % 3) * 0.14;
        const rr = 0.27 * (0.5 - yy / 0.62) * 0.98;
        const dot = ellipsoid(0.035, 0.035, 0.02, dotMat, 8, false);
        dot.position.set(Math.sin(a) * rr, yy, Math.cos(a) * rr);
        dot.lookAt(dot.position.clone().multiplyScalar(2));
        party.add(dot);
      }
      const pom = ellipsoid(0.09, 0.09, 0.09, toon(0xffd43b, toonRamp), 12, true, 0.02);
      pom.position.y = 0.34;
      party.add(pom);
      acc.add(party);
      hatWobble = party;
      break;
    }
    case 'sprout': {
      const leafMat = toon(0x4cc96b, toonRamp);
      const sprout = new THREE.Group();
      sprout.position.y = 0.92;
      const stemS = cylinder(0.025, 0.03, 0.22, toon(0x3fae5c, toonRamp), 8, 0);
      stemS.position.y = 0.1;
      sprout.add(stemS);
      [-1, 1].forEach((side) => {
        const leaf = ellipsoid(0.16, 0.05, 0.09, leafMat, 14, true, 0.02);
        leaf.position.set(side * 0.13, 0.22, 0);
        leaf.rotation.z = side * 0.45;
        sprout.add(leaf);
      });
      acc.add(sprout);
      hatWobble = sprout;
      break;
    }
    case 'tiara': {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 8, 30, Math.PI), gold);
      band.position.set(0, 0.74, 0.12);
      band.rotation.x = -0.55;
      band.scale.set(1, 1, 1);
      const gems = [0x7dd3fc, 0xff5c8a, 0x7dd3fc];
      [-0.6, 0, 0.6].forEach((a, i) => {
        const peak = new THREE.Mesh(new THREE.ConeGeometry(0.06, i === 1 ? 0.2 : 0.13, 6), gold);
        peak.position.set(Math.sin(a) * 0.5, Math.cos(a) * 0.5 + 0.05, 0);
        peak.rotation.z = -a;
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(i === 1 ? 0.07 : 0.05), new THREE.MeshBasicMaterial({ color: gems[i]! }));
        gem.position.set(Math.sin(a) * 0.5, Math.cos(a) * 0.5, 0.03);
        band.add(peak, gem);
      });
      acc.add(band);
      break;
    }
    case 'santa': {
      const red = toon(0xe11d48, toonRamp);
      const white = toon(0xffffff, toonRamp);
      const capS = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.8, 22), red);
      capS.position.set(0.08, 1.18, -0.02);
      capS.rotation.z = -0.5;
      const brim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.1, 10, 28), white);
      brim.rotation.x = Math.PI / 2;
      brim.position.set(0, 0.84, 0);
      const pom = ellipsoid(0.12, 0.12, 0.12, white, 12, true, 0.02);
      pom.position.set(0.5, 1.35, -0.02);
      acc.add(capS, brim, pom);
      break;
    }
    case 'mushroom': {
      const red = toon(0xef4444, toonRamp);
      const capM = new THREE.Mesh(new THREE.SphereGeometry(0.72, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2), red);
      capM.position.y = 0.8;
      capM.scale.y = 0.62;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 32), toon(0xfff2dc, toonRamp));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.8;
      acc.add(capM, rim);
      [[0, 1.2], [0.8, 0.6], [-0.9, 0.7], [2.2, 0.75], [-2.4, 0.65], [3.1, 0.9]].forEach(([a, e]) => {
        const spot = ellipsoid(0.11, 0.11, 0.03, toon(0xffffff, toonRamp), 10, false);
        const x = Math.sin(a!) * Math.cos(e!) * 0.72;
        const z = Math.cos(a!) * Math.cos(e!) * 0.72;
        const y = 0.8 + Math.sin(e!) * 0.72 * 0.62;
        spot.position.set(x, y, z);
        spot.lookAt(new THREE.Vector3(x * 2, 0.8 + (y - 0.8) * 3, z * 2));
        acc.add(spot);
      });
      break;
    }
    default:
      break;
  }
  body.add(acc);
  if (accessoryId !== 'eyepatch' && accessoryId !== 'none') {
    // Los gorros se modelaron sobre la cabeza del chibi (ancho 1, cima en 0.95):
    // se ajustan al ancho, fondo y altura de la cabeza de cada especie para que asienten bien.
    const kx = headInfo.w;
    const kz = headInfo.d / 0.96;
    const ky = (kx + kz) / 2;
    acc.scale.set(kx * 1.03, ky, kz * 1.04);
    acc.position.y = headInfo.y + headInfo.h - 0.95 * ky;
  }


  // --- ROPA DEL TORSO (chaleco pirata, marinero, abrigo, sudadera, bufanda) ---
  const outfitId = config.outfit ?? 'none';
  const torso = isDragon
    ? { y: -0.34, sx: 0.78, sy: 0.68, sz: 0.74, from: 0.3 }
    : { y: 0, sx: 1.0, sy: 0.95, sz: 0.96, from: 0.6 };
  /** Color de las mangas de cada prenda (null = prenda sin mangas). */
  const sleeveColorFor = (id: string): THREE.ColorRepresentation | null => {
    switch (id) {
      case 'none':
      case 'vest':
      case 'scarf':
      case 'tank':
        return null;
      case 'chef':
        return 0xffffff;
      case 'jester':
        return 0x7b3fe4;
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
  if (sleeveColor !== null) {
    // Mangas sobre los brazos de cualquier especie: así la ropa se lee como ropa.
    const ax = 0.17;
    const ay = 0.27;
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
      const grow = opts.grow ?? 1.05;
      const geo = new THREE.SphereGeometry(
        1,
        32,
        16,
        Math.PI / 2 + gap / 2,
        Math.PI * 2 - gap,
        Math.PI * (opts.from ?? torso.from),
        Math.PI * (1 - (opts.from ?? torso.from)) * 0.86
      );
      // Ropa holgada: el bajo se abre un poco (caída de tela), no queda pegada al cuerpo.
      const pos = geo.attributes.position!;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const k = 1 + Math.max(0, -0.15 - y) * 0.16;
        pos.setX(i, pos.getX(i) * k);
        pos.setZ(i, pos.getZ(i) * k);
      }
      geo.computeVertexNormals();
      const mat = toon(color, toonRamp);
      (mat as THREE.Material).side = THREE.DoubleSide;
      const m = new THREE.Mesh(geo, mat);
      m.scale.set(torso.sx * grow, torso.sy * grow, torso.sz * grow);
      m.position.y = torso.y;
      const out = new THREE.Mesh(geo, OUTLINE_MAT);
      out.scale.setScalar(1.014);
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
    } else if (outfitId === 'tank') {
      // Camiseta de tirantes + collar dorado
      shell(clothColor, { from: torso.from + 0.08 });
      // Tirantes por encima de los hombros
      const strapMat = toon(clothColor, toonRamp);
      [-1, 1].forEach((side) => {
        const x = side * 0.17 * Math.max(0.6, torso.sx / 0.38);
        const top = torso.y + torso.sy * 1.0;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, top - 0.16, torso.sz * 0.95),
          new THREE.Vector3(x, top - 0.02, torso.sz * 0.6),
          new THREE.Vector3(x, top + 0.02, 0),
          new THREE.Vector3(x, top - 0.02, -torso.sz * 0.6),
          new THREE.Vector3(x, top - 0.16, -torso.sz * 0.95),
        ]);
        const strap = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.024, 6, false), strapMat);
        body.add(strap);
      });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(collarR * 0.7, 0.012, 6, 32, Math.PI), gold);
      chain.rotation.set(Math.PI / 2 + 0.6, 0, Math.PI);
      chain.position.set(0, collarY - 0.06, torso.sz * 0.45);
      body.add(chain);
    } else if (outfitId === 'jester') {
      // Traje de bufón a dos colores con botones dorados y gorguera
      shell(0xe63946, { gap: Math.PI });
      const half = shell(0x7b3fe4, { gap: Math.PI });
      half.rotation.y = Math.PI;
      const ruff = new THREE.Mesh(new THREE.TorusGeometry(collarR * 1.05, 0.07, 8, 18), toon(0xfacc15, toonRamp));
      ruff.rotation.x = Math.PI / 2;
      ruff.scale.set(1, torso.sz / torso.sx, 0.7);
      ruff.position.y = collarY;
      body.add(ruff);
      [0, 1, 2].forEach((i) => {
        const y = collarY - 0.12 - i * torso.sy * 0.32;
        const btn = ellipsoid(0.045, 0.045, 0.025, gold, 10, true, 0.01);
        btn.position.set(0.04, y, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((y - torso.y) / torso.sy) ** 2)) * 1.08 + 0.03);
        body.add(btn);
      });
    } else if (outfitId === 'chef') {
      shell(0xffffff);
      [-1, 1].forEach((side) =>
        [0, 1, 2].forEach((i) => {
          const y = collarY - 0.1 - i * torso.sy * 0.28;
          const btn = ellipsoid(0.026, 0.026, 0.015, toon(0x1e2436, toonRamp), 8, false);
          btn.position.set(side * 0.1 * Math.max(0.6, torso.sx), y, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((y - torso.y) / torso.sy) ** 2 - 0.04)) * 1.08 + 0.03);
          body.add(btn);
        })
      );
      const scarfC = new THREE.Mesh(new THREE.TorusGeometry(collarR * 0.95, 0.045, 8, 30), toon(0xe11d48, toonRamp));
      scarfC.rotation.x = Math.PI / 2;
      scarfC.scale.set(1, torso.sz / torso.sx, 1);
      scarfC.position.y = collarY;
      body.add(scarfC);
    } else if (outfitId === 'hero') {
      // Superhéroe: traje del color favorito, capa roja y emblema
      shell(clothColor);
      const capeMat = toon(0xe11d48, toonRamp);
      (capeMat as THREE.Material).side = THREE.DoubleSide;
      const capeGeo = new THREE.CylinderGeometry(collarR * 1.05, torso.sx * 1.5, torso.sy * 2.2, 20, 1, true, Math.PI * 0.62, Math.PI * 0.76);
      const cape = new THREE.Mesh(capeGeo, capeMat);
      cape.position.set(0, collarY - torso.sy * 1.05, -0.04);
      const capeOut = new THREE.Mesh(capeGeo, OUTLINE_MAT);
      capeOut.scale.set(1.02, 1, 1.02);
      cape.add(capeOut);
      const emblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), toon(0xfacc15, toonRamp));
      emblem.scale.set(1.3, 1, 0.3);
      const ey = torso.y + torso.sy * 0.2;
      emblem.position.set(0, ey, torso.sz * Math.sqrt(Math.max(0.1, 1 - ((ey - torso.y) / torso.sy) ** 2)) * 1.08 + 0.03);
      body.add(cape, emblem);
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
      bladeOut.scale.setScalar(1.066);
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
      ringOut.scale.setScalar(1.033);
      ring.add(ringOut);
      const hang = ellipsoid(0.1, 0.3, 0.05, scarfMat, 12, true, 0.02);
      hang.position.set(0.28 * torso.sx, collarY - 0.28, torso.sz * 0.95);
      hang.rotation.z = 0.15;
      body.add(ring, hang);
    }
  }

  // --- ACCESORIOS DEL AMIGO: CUELLO, MANO, ESPALDA Y DIBUJO ---
  const torsoDims = isDragon ? { w: 0.78, h: 0.68, d: 0.74 } : BALL;
  const torsoCy = isDragon ? -0.34 : 0;
  const neckElev = isDragon ? 0.5 : Math.asin(-0.32 / BALL.h);
  const buddyProps = buildBuddyProps(
    body,
    {
      neck: {
        y: torsoCy + torsoDims.h * Math.sin(neckElev),
        rx: torsoDims.w * Math.cos(neckElev),
        rz: torsoDims.d * Math.cos(neckElev),
        front: onBall(0, neckElev, torsoDims, torsoCy),
      },
      back: onBall(Math.PI, isDragon ? 0.1 : 0.05, torsoDims, torsoCy),
      width: torsoDims.w,
      ball: !isDragon,
    },
    {
      neck: config.neckItem ?? 'none',
      held: config.heldItem ?? 'none',
      back: config.backItem ?? 'none',
      pattern: config.pattern ?? 'none',
      patternColor: config.patternColor ?? '#FFFFFF',
      accent,
      toon: (c) => toon(c, toonRamp),
    }
  );

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

  // --- VFX 5: GOTA DE SUDOR (¡UPS!) ---
  const sweatMat = new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.95 });
  const sweatShineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 });
  const sweatInkMat = new THREE.MeshBasicMaterial({ color: 0x1e2a4a, side: THREE.BackSide, transparent: true });
  const sweat = new THREE.Group();
  {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), sweatMat);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.1, 16, 1, true), sweatMat);
    tip.position.y = 0.075;
    const ink = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), sweatInkMat);
    ink.scale.setScalar(1.18);
    const inkTip = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.1, 16, 1, true), sweatInkMat);
    inkTip.scale.setScalar(1.18);
    inkTip.position.y = 0.08;
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), sweatShineMat);
    shine.position.set(-0.025, 0.02, 0.055);
    sweat.add(ink, inkTip, ball, tip, shine);
  }
  const sweatBase = new THREE.Vector3(headInfo.w * 0.82, headInfo.y + headInfo.h * 0.42, headInfo.d * 0.45);
  sweat.position.copy(sweatBase);
  sweat.visible = false;
  body.add(sweat);

  // --- CRECIMIENTO: HUEVO → BEBÉ → NIÑO → JOVEN → ADULTO ---
  const growth = Math.max(0, Math.min(1, options.growth ?? 0));
  const stageScale = petStage === 'baby' ? 0.62 : petStage === 'kid' ? 0.78 : petStage === 'teen' ? 0.9 : 1;
  /** Baja al personaje escalado para que siga pisando la roca. */
  const stageLift = -0.98 * (1 - stageScale);
  root.scale.setScalar(stageScale);
  const headTop = isDragon ? 0.98 : 0.95;
  const eggTint = new THREE.Color(0xfff8ec).lerp(baseBodyColor, 0.3);
  const eggMat = toon(eggTint, toonRamp);
  let eggGroup: THREE.Group | null = null;
  let eggTop: THREE.Group | null = null;
  const eggCracks: THREE.Object3D[] = [];
  const hatching = Boolean(options.hatching);

  if (petStage === 'egg' || hatching) {
    if (!hatching) body.visible = false;
    eggGroup = new THREE.Group();
    // Silueta de huevo (más estrecha arriba) con contorno toon
    const profile: THREE.Vector2[] = [];
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI;
      const y = -Math.cos(a) * 0.86;
      const r = Math.sin(a) * 0.66 * (y > 0 ? 1 - 0.2 * (y / 0.86) : 1);
      profile.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    // Cascarón en dos piezas (tapa y base) para poder romperlo al eclosionar
    const CUT = 0.04;
    eggTop = new THREE.Group();
    eggGroup.add(eggTop);
    [profile.filter((v) => v.y <= CUT + 0.04), profile.filter((v) => v.y >= CUT - 0.04)].forEach((part, i) => {
      const geo = new THREE.LatheGeometry(part, 36);
      const mesh = new THREE.Mesh(geo, eggMat);
      (eggMat as THREE.Material).side = THREE.DoubleSide;
      const out = new THREE.Mesh(geo, OUTLINE_MAT);
      out.scale.setScalar(1.025);
      mesh.add(out);
      (i === 0 ? eggGroup! : eggTop!).add(mesh);
    });
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
      (y! > 0.04 ? eggTop! : eggGroup!).add(spot);
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
      eggTop!.add(seg);
      eggCracks.push(seg);
    });
    // Nido de paja
    const straw = toon(0xd9a85b, toonRamp);
    const nest = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.15, 8, 28), straw);
    nest.rotation.x = Math.PI / 2;
    nest.position.y = -0.8;
    const nestOut = new THREE.Mesh(nest.geometry, OUTLINE_MAT);
    nestOut.scale.setScalar(1.022);
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
    if (hatching) stage.add(eggGroup);
    else root.add(eggGroup);
  }
  if (petStage === 'baby') {
    // Recién nacido: lleva la mitad del cascarón como gorrito.
    acc.visible = false;
    const capGroup = new THREE.Group();
    const capMat = toon(eggTint, toonRamp);
    (capMat as THREE.Material).side = THREE.DoubleSide;
    const capGeo = new THREE.SphereGeometry(0.5, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const cap = new THREE.Mesh(capGeo, capMat);
    const capOut = new THREE.Mesh(capGeo, OUTLINE_MAT);
    capOut.scale.setScalar(1.028);
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
    capGroup.scale.setScalar(1);
    const hasHair = (config.hairStyle ?? ('none')) !== 'none';
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

  if (scenario?.action === 'read' && petStage !== 'egg') {
    const book = new THREE.Group();
    const cover = box(0.42, 0.3, 0.05, toon(accent.clone().offsetHSL(0.4, 0, 0), toonRamp), 0.02);
    cover.rotation.x = -0.5;
    const pages = box(0.38, 0.26, 0.06, toon(0xffffff, toonRamp), 0);
    pages.position.set(0, 0.02, 0.01);
    pages.rotation.x = -0.5;
    book.add(cover, pages);
    book.position.set(0, -0.18, (torso.sz) + 0.16);
    body.add(book);
  }

  if (options.focus === 'face' && !inHouse && !options.house) {
    // Primer plano de la cara, como al editar rasgos en el Mii Maker.
    const fy = headY;
    camera.position.set(0, fy + 0.3, 4.1);
    camera.lookAt(0, fy + 0.18, 0);
  }

  // --- VFX 6: ESTRELLAS DE MAREO ---
  const dizzyStars = new THREE.Group();
  dizzyStars.position.y = headInfo.y + headInfo.h + 0.08;
  [0xffd43b, 0x7dd3fc, 0xff7aa8].forEach((c) => {
    const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), new THREE.MeshBasicMaterial({ color: c }));
    st.scale.set(1, 1, 0.4);
    dizzyStars.add(st);
  });
  dizzyStars.visible = false;
  body.add(dizzyStars);

  // --- VFX 7: DESTELLO Y CONFETI DE LA ECLOSIÓN ---
  const hatchFx = (() => {
    const g = new THREE.Group();
    g.visible = false;
    stage.add(g);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xfffbe6, transparent: true, opacity: 0, depthWrite: false });
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 14), flashMat);
    g.add(flash);
    const bits: Array<{ m: THREE.Mesh; v: THREE.Vector3 }> = [];
    const colors = [0xffd54a, 0xff6b9d, 0x47c2ff, 0x7be495, 0xb18cff, 0xff9f43];
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: colors[i % colors.length]! }));
      g.add(m);
      bits.push({ m, v: new THREE.Vector3() });
    }
    let life = -1;
    return {
      start: () => {
        g.visible = true;
        life = 0;
        bits.forEach((b, i) => {
          const a = (i / bits.length) * Math.PI * 2;
          b.m.position.set(0, 0, 0);
          b.v.set(Math.cos(a) * (1.6 + (i % 3) * 0.5), 2.4 + (i % 4) * 0.5, Math.sin(a) * 1.2);
        });
      },
      update: (dt: number) => {
        if (life < 0) return;
        life += dt;
        flash.scale.setScalar(1 + life * 7);
        flashMat.opacity = Math.max(0, 0.9 - life * 2.2);
        bits.forEach((b) => {
          b.v.y -= 6 * dt;
          b.m.position.addScaledVector(b.v, dt);
          b.m.rotation.x += dt * 8;
          b.m.rotation.y += dt * 6;
        });
        if (life > 1.6) {
          g.visible = false;
          life = -1;
        }
      },
    };
  })();

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
    squashV: 0,
    joy: 0,
    spin: 0,
    blinkAt: 2,
    blink: 0,
    lookAt: 1.5,
    look: new THREE.Vector2(),
    lookTarget: new THREE.Vector2(),
    hopAt: 4,
    syllable: 0,
    syllableAt: 0,
    pointer: new THREE.Vector2(),
    pointerAt: -10,
    eyeLook: new THREE.Vector2(),
    /** Emoción breve provocada por un gesto (caricia, abrazo…), por encima de la del juego. */
    reactMood: 'ok' as PetMood,
    reactUntil: -1,
    /** Gesto o acción espontánea en curso. */
    act: '' as '' | 'pat' | 'tickle' | 'flip' | 'hug' | 'rub' | 'dizzy' | 'yawn' | 'look' | 'wave' | 'wiggle' | 'sneeze',
    actT0: 0,
    actUntil: -1,
    lastInput: 0,
    nextIdle: 7,
    hatchT0: -1,
    hatched: false,
    hatchScale: hatching ? 0 : 1,
    hatchV: 0,
    now: 0,
    launchAt: -1,
    launchV: 0,
    /** 0..1: encogimiento e inclinación de "¡ups!" suavizados. */
    oopsK: 0,
  };

  const startAct = (a: Exclude<typeof s.act, ''>, dur: number) => {
    s.act = a;
    s.actT0 = s.now;
    s.actUntil = s.now + dur;
  };
  const react = (m: PetMood, dur: number) => {
    s.reactMood = m;
    s.reactUntil = s.now + dur;
  };

  const update = (dt: number, t: number) => {
    s.now = t;
    const mood: PetMood = t < s.reactUntil ? s.reactMood : s.mood;
    const act = t < s.actUntil ? s.act : '';
    const actK = act ? (t - s.actT0) / Math.max(0.001, s.actUntil - s.actT0) : 0;
    const sleepy = mood === 'sleepy' || act === 'yawn';
    const sad = mood === 'sad';
    const angry = mood === 'angry';
    const rage = mood === 'rage';
    const love = mood === 'love';
    const eating = mood === 'eating';
    const celebrate = mood === 'celebrate';
    const happy = mood === 'happy' || celebrate || love || s.joy > 0;

    // Acciones espontáneas cuando nadie lo toca (bostezo, saludo, saltito, bailecito…)
    if (!act && !s.speaking && t > s.nextIdle && t - s.lastInput > 4 && (mood === 'ok' || mood === 'happy')) {
      const pool = ['yawn', 'look', 'wave', 'wiggle', 'sneeze', 'hop'] as const;
      const pick = pool[Math.floor(Math.random() * pool.length)]!;
      if (pick === 'hop') {
        if (s.jumpY === 0) s.jumpV = 2.4;
      } else {
        startAct(pick, pick === 'yawn' ? 1.8 : pick === 'sneeze' ? 1.1 : 1.8);
      }
      s.nextIdle = t + 7 + Math.random() * 6;
    }
    // Eclosión: el huevo tiembla cada vez más, se agrieta y estalla
    if (hatching && eggGroup) {
      if (s.hatchT0 < 0) s.hatchT0 = t;
      const ht = t - s.hatchT0;
      if (ht < 1.6) {
        body.visible = false;
        const amp = 0.05 + ht * 0.14;
        eggGroup.rotation.z = Math.sin(t * (4 + ht * 9)) * amp;
        eggGroup.position.y = -0.08 + Math.abs(Math.sin(t * (4 + ht * 9))) * ht * 0.04;
        eggCracks.forEach((c, i) => (c.visible = ht > 0.3 + i * 0.22));
      } else {
        if (!s.hatched) {
          s.hatched = true;
          body.visible = true;
          s.hatchScale = 0.05;
          s.jumpV = 3.4;
          s.spin = 1;
          s.joy = 1.4;
          s.reactMood = 'celebrate';
          s.reactUntil = t + 2.6;
          hatchFx.start();
        }
        const k = ht - 1.6;
        eggGroup.rotation.z *= 0.85;
        if (eggTop) {
          eggTop.position.set(k * 0.9, k * 3.2 - k * k * 4.2, k * 0.3);
          eggTop.rotation.set(k * 5, 0, -k * 7);
          eggTop.visible = k < 1.1;
        }
        const fade = Math.max(0, 1 - k / 1.0);
        eggGroup.scale.setScalar(Math.max(0.001, fade));
        if (k > 1.2) eggGroup.visible = false;
      }
    }
    hatchFx.update(dt);
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
    if ((mood === 'happy' || celebrate) && t > s.hopAt && s.jumpY === 0) {
      s.jumpV = celebrate ? 3.2 : 2.4;
      s.hopAt = t + (celebrate ? 1.4 : 3 + Math.random() * 4);
    }
    if (rage && s.jumpY === 0 && Math.sin(t * 10) > 0.92) {
      // Pisotones furiosos en modo Ira
      s.jumpV = 1.65;
    }

    // Salto con anticipación: se aplasta un instante y luego despega
    if (s.launchAt > 0) {
      s.squash = Math.min(s.squash, 0.76);
      if (t >= s.launchAt) {
        s.jumpV = Math.max(s.jumpV, s.launchV);
        s.launchAt = -1;
      }
    }
    if (s.jumpY > 0 || s.jumpV > 0) {
      s.jumpV -= 9.5 * dt;
      s.jumpY += s.jumpV * dt;
      if (s.jumpY <= 0) {
        // Aterrizaje elástico: cuanto más rápido cae, más se aplasta
        s.squash = 1 - Math.min(0.26, Math.abs(s.jumpV) * 0.075);
        s.jumpY = 0;
        s.jumpV = 0;
      }
    }
    // Muelle subamortiguado: vuelve a su forma con un rebote de gelatina
    const sdt = Math.min(dt, 0.05);
    s.squashV += ((1 - s.squash) * 260 - s.squashV * 13) * sdt;
    s.squash += s.squashV * sdt;
    const stretch = s.jumpV > 0 ? 1 + Math.min(0.18, s.jumpV * 0.06) : 1;
    const b = Math.sin(t * breath) * 0.018;
    s.oopsK += ((mood === 'oops' ? 1 : 0) - s.oopsK) * Math.min(1, dt * 6);
    const shrink = 1 - s.oopsK * 0.12;
    const sy = baseScaleY * (1 + b) * s.squash * stretch * shrink;
    const sxz = ((baseScaleX * (1 - b * 0.6)) / Math.sqrt(s.squash * stretch)) * (1 - s.oopsK * 0.06);
    // Al nacer crece desde cero con rebote de gelatina
    s.hatchV += ((1 - s.hatchScale) * 140 - s.hatchV * 10) * Math.min(dt, 0.05);
    s.hatchScale += s.hatchV * Math.min(dt, 0.05);
    const hs = hatching && !s.hatched ? 0.001 : Math.max(0.001, s.hatchScale);
    body.scale.set(sxz * hs, sy * hs, sxz * hs);
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
    if (eggGroup && !hatching) {
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
    root.rotation.y =
      s.rotY + (scenario?.npc ? 0.45 : 0) + Math.sin(t * 0.7) * 0.12 + spinAngle +
      (scenario?.action === 'dance' ? Math.sin(t * 3) * 0.45 : 0);
    if (sceneProps) {
      propsRoot.position.y = islandPedestal.position.y + 0.12;
      propsRoot.rotation.y = islandPedestal.rotation.y;
      sceneProps.animate(t);
      sceneNpc?.animate(t);
    }
    root.rotation.x =
      s.rotX + (sad ? 0.12 : 0) + (sleepy ? 0.1 + Math.sin(t * 1.5) * 0.05 : 0);
    root.rotation.z =
      (love ? Math.sin(t * 3.8) * 0.09 : Math.sin(t * 0.9) * 0.025) +
      // ¡Ups!: inclinación cómica de 15° con un pequeño temblor de nervios
      s.oopsK * (0.26 + Math.sin(t * 9) * 0.015);
    // Gota de sudor: resbala por la sien y se desvanece, en bucle
    sweat.visible = s.oopsK > 0.05;
    if (sweat.visible) {
      const p = (t * 0.7) % 1;
      sweat.position.set(sweatBase.x + p * 0.03, sweatBase.y - p * 0.22, sweatBase.z);
      const pop = Math.min(1, p * 6) * 1.5;
      sweat.scale.set(pop * (1 - p * 0.15), pop * (1 + p * 0.25), pop);
      const fade = (p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1) * s.oopsK;
      sweatMat.opacity = 0.95 * fade;
      sweatShineMat.opacity = 0.95 * fade;
      sweatInkMat.opacity = fade;
    }

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
    const talking = s.speaking;
    const oops = mood === 'oops';
    // Lip-sync cómico: sílabas irregulares mientras habla
    if (talking && t > s.syllableAt) {
      s.syllable = (s.syllable + 1 + Math.floor(Math.random() * 2)) % 3;
      s.syllableAt = t + 0.07 + Math.random() * 0.09;
    }
    const mouthPose: MouthPose = talking
      ? (['rest', 'half', 'open'] as const)[s.syllable]!
      : eating
        ? Math.sin(t * 18) > 0 ? 'half' : 'rest'
        : celebrate || s.joy > 0.5 || love
          ? 'happy'
          : rage || angry
            ? 'zigzag'
            : oops
              ? 'wavy'
              : sad || mood === 'hungry'
                ? 'frown'
                : sleepy
                  ? 'half'
                  : 'rest';
    // La mirada combina el paseo de ojos con el dedo del jugador (si toca o pasa por encima)
    const pointerOn = t - s.pointerAt < 2.5;
    const lookX = Math.max(-1, Math.min(1, pointerOn ? s.pointer.x : s.look.x / 0.03));
    const lookY = Math.max(-1, Math.min(1, pointerOn ? s.pointer.y : s.look.y / 0.0175));
    // Las pupilas se deslizan suavemente hacia el objetivo
    s.eyeLook.x += (lookX - s.eyeLook.x) * Math.min(1, dt * 9);
    s.eyeLook.y += (lookY - s.eyeLook.y) * Math.min(1, dt * 9);
    // Gestos y acciones espontáneas cambian la cara un momento
    const actMouth: MouthPose | null =
      act === 'yawn' ? (actK > 0.15 && actK < 0.75 ? 'open' : 'half')
      : act === 'sneeze' ? (actK < 0.45 ? 'half' : actK < 0.6 ? 'open' : 'happy')
      : act === 'dizzy' ? 'wavy'
      : act === 'tickle' || act === 'pat' || act === 'rub' || act === 'hug' || act === 'wave' || act === 'wiggle' || act === 'flip' ? 'happy'
      : null;
    const actEyes =
      act === 'yawn' || act === 'dizzy' || (act === 'sneeze' && actK > 0.4 && actK < 0.65) ? 'closed'
      : act === 'pat' || act === 'tickle' || act === 'rub' || act === 'hug' ? 'happy'
      : null;
    if (act === 'look') s.lookTarget.set(Math.sin(actK * Math.PI * 2) * 0.03, 0.005);
    face.update({
      lookX: s.eyeLook.x,
      lookY: s.eyeLook.y,
      blink: actEyes === 'closed' ? 0 : sleepy ? 1 : 1 - blinkScale,
      eyes: actEyes ?? (sleepy ? 'closed' : celebrate || love || (happy && s.joy > 0.3) ? 'happy' : 'open'),
      mouth: actMouth ?? mouthPose,
      browTilt: rage ? 0.5 : angry ? 0.35 : oops ? -0.35 : sad ? -0.3 : 0,
      browLift: celebrate || oops ? 0.35 : angry || rage ? -0.2 : 0,
    });

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
    // Acción de la isla temática (saludar, celebrar, pensar, leer…)
    if (scenario) {
      const act = scenario.action;
      if (act === 'wave') {
        armR.rotation.z = -1.55 - Math.sin(t * 10) * 0.45;
      } else if (act === 'cheer' || act === 'stretch') {
        const up = act === 'cheer' ? 1 : Math.sin(t * 1.4) * 0.5 + 0.5;
        armL.rotation.z = 0.55 + up * 1.35 + (act === 'cheer' ? Math.sin(t * 12) * 0.15 : 0);
        armR.rotation.z = -0.55 - up * 1.35 - (act === 'cheer' ? Math.sin(t * 12) * 0.15 : 0);
        if (act === 'cheer' && s.jumpY === 0 && Math.sin(t * 3.2) > 0.97) s.jumpV = 2.6;
      } else if (act === 'think') {
        armR.rotation.z = -1.9;
        root.rotation.z = 0.12 + Math.sin(t * 0.8) * 0.04;
      } else if (act === 'dance') {
        armL.rotation.z = 0.9 + Math.sin(t * 6) * 0.6;
        armR.rotation.z = -0.9 + Math.sin(t * 6) * 0.6;
        root.rotation.z = Math.sin(t * 6) * 0.1;
      } else if (act === 'read') {
        armL.rotation.z = 1.2;
        armR.rotation.z = -1.2;
        s.lookTarget.set(0, -0.03);
      } else if (act === 'talk') {
        s.speaking = t % 2.2 < 1.4;
        armR.rotation.z = -0.9 - Math.sin(t * 4) * 0.4;
      }
    }

    if (hatSpinner) hatSpinner.rotation.y += dt * (happy || s.jumpY > 0 ? 18 : 5);
    if (hatWobble) hatWobble.rotation.z = (hatWobble.userData.baseZ ??= hatWobble.rotation.z) + Math.sin(t * 3.4) * 0.08;
    // Gestos del jugador y acciones espontáneas
    if (act === 'tickle') {
      root.rotation.z += Math.sin(t * 32) * 0.1 * (1 - actK);
      armL.rotation.z = 1.1 + Math.sin(t * 20) * 0.3;
      armR.rotation.z = -1.1 - Math.sin(t * 20) * 0.3;
    } else if (act === 'pat') {
      armL.rotation.z = 0.9;
      armR.rotation.z = -0.9;
    } else if (act === 'flip') {
      root.rotation.x -= Math.min(1, actK * 1.6) * Math.PI * 2;
    } else if (act === 'hug' || act === 'rub') {
      armL.rotation.z = 1.75 + Math.sin(t * 3) * 0.08;
      armR.rotation.z = -1.75 - Math.sin(t * 3) * 0.08;
      root.rotation.z += Math.sin(t * 4) * 0.06;
    } else if (act === 'dizzy') {
      root.rotation.z += Math.sin(t * 5) * 0.16 * (1 - actK * 0.5);
      root.rotation.y += Math.sin(t * 3) * 0.2;
      armL.rotation.z = 0.4 + Math.sin(t * 5) * 0.3;
      armR.rotation.z = -0.4 + Math.sin(t * 5) * 0.3;
    } else if (act === 'yawn') {
      const up = Math.sin(Math.min(1, actK * 1.4) * Math.PI);
      armL.rotation.z = 0.55 + up * 1.3;
      armR.rotation.z = -0.55 - up * 1.3;
    } else if (act === 'wave') {
      armR.rotation.z = -1.55 - Math.sin(t * 10) * 0.45;
    } else if (act === 'wiggle') {
      root.rotation.z += Math.sin(t * 8) * 0.12;
      armL.rotation.z = 0.9 + Math.sin(t * 8) * 0.5;
      armR.rotation.z = -0.9 + Math.sin(t * 8) * 0.5;
    }
    dizzyStars.visible = act === 'dizzy';
    if (act === 'dizzy') {
      dizzyStars.children.forEach((st, i) => {
        const a = t * 4 + (i / dizzyStars.children.length) * Math.PI * 2;
        st.position.set(Math.cos(a) * headInfo.w * 0.75, Math.sin(a * 2) * 0.05, Math.sin(a) * headInfo.d * 0.6);
        st.rotation.z = t * 6;
      });
    }
    buddyProps.animate(t, armR, happy || talking ? 1 : 0);
    // Orejas, branquias y copetes que se mecen solos (más rápido si está contento)
    buddy?.wobble.forEach((w) => {
      const k = happy || talking ? 1.6 : 1;
      w.obj.rotation[w.axis] = w.base + Math.sin(t * w.speed * k + w.phase) * w.amp * k;
    });
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

  if (options.focus !== 'face' && !scenario && !inHouse) {
    // Encuadre automático: la mascota (con gorro, globo, alas…) y su isla llenan el espacio,
    // con aire para saltar y sin que se corte nada.
    root.updateMatrixWorld(true);
    islandPedestal.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const isle = new THREE.Box3().setFromObject(islandPedestal);
    const top = Math.max(box.max.y + stageLift, 0.95) + 0.5;
    const bottom = Math.min(-1.3, isle.min.y);
    const halfW = Math.max(1.3, Math.abs(box.min.x), box.max.x, Math.abs(isle.min.x) * 0.92, isle.max.x * 0.92) + 0.08;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const center = (top + bottom) / 2;
    const dist = Math.max((top - bottom) / 2 / tanHalf, halfW / (tanHalf * camera.aspect)) * 1.12;
    camera.position.set(0, center + dist * 0.12, dist);
    camera.lookAt(0, center, 0);
  }

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
      } else if (mood === 'oops' && prev !== 'oops') {
        // Respingo: se aplasta de golpe antes de encogerse
        s.squash = 0.8;
      }
    },
    setSpeaking: (speaking) => (s.speaking = speaking),
    setEnergy: (energy01) => (s.energy = Math.max(0, Math.min(1, energy01))),
    joy: () => {
      // Anticipación (aplastado) → salto estirado → aterrizaje elástico
      s.joy = 1.3;
      s.spin = 1;
      s.squash = 0.74;
      s.launchAt = s.now + 0.09;
      s.launchV = 2.8;
    },
    lookAt: (x, y) => {
      s.pointer.set(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
      s.pointerAt = s.now;
    },
    poke: (x, y) => {
      s.lastInput = s.now;
      if (y > 0.2) {
        // Caricia en la cabeza: se aplasta contento y suelta corazones
        startAct('pat', 1.2);
        s.squash = 0.8;
        react('love', 1.4);
      } else if (y < -0.45) {
        startAct('tickle', 1.1);
        s.joy = 1;
      } else if (Math.abs(x) > 0.55) {
        s.spin = 1;
        s.joy = 0.8;
      } else {
        s.joy = 1.3;
        s.squash = 0.74;
        s.launchAt = s.now + 0.09;
        s.launchV = 2.8;
      }
    },
    flip: () => {
      s.lastInput = s.now;
      startAct('flip', 0.9);
      s.squash = 0.72;
      s.launchAt = s.now + 0.08;
      s.launchV = 3.9;
    },
    hug: () => {
      s.lastInput = s.now;
      startAct('hug', 2.2);
      s.squash = 0.86;
      react('love', 2.4);
    },
    rub: () => {
      s.lastInput = s.now;
      if (s.act !== 'rub' || s.now > s.actUntil) startAct('rub', 2.4);
      else s.actUntil = s.now + 2.4;
      react('love', 2.6);
    },
    dizzy: () => {
      s.lastInput = s.now;
      startAct('dizzy', 2.6);
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
      faceCache.forEach((tx) => tx.dispose());
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
