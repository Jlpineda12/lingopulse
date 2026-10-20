import * as THREE from 'three';
import type { PetConfig } from '../game/pet';
import { arc, hex, INK, Raster, rasterTexture, rotPts, tstep, WHITE, type RGB } from './faceTexture';

/**
 * Cara de calcomanías (estilo Mii / Tomodachi): ojos, pupilas, párpados, cejas y boca son
 * pegatinas planas con trazo negro limpio, pegadas sobre la superficie de la cabeza.
 * - Las pupilas se desplazan hacia donde mira la mascota (o hacia el dedo del jugador).
 * - El parpadeo aplasta la calcomanía del ojo.
 * - La boca cambia de forma (reposo, medio abierta, abierta…) para el lip-sync cómico.
 */

/** Elipsoide de la cabeza (centro en y = cy). */
export interface HeadShape {
  w: number;
  h: number;
  d: number;
  cy: number;
}

/** Dónde va cada rasgo, en ángulos sobre la cabeza (elevación desde el centro y acimut horizontal). */
export interface FaceLayout {
  eyeElev: number;
  eyeAz: number;
  browElev: number;
  mouthElev: number;
  /** Tamaño del lado de cada calcomanía (en unidades del mundo). */
  eyeSize: number;
  browSize: number;
  mouthSize: number;
  /** Ancla de la boca cuando va sobre un hocico (oso, zorro, dragón). */
  mouthAnchor?: { p: THREE.Vector3; n: THREE.Vector3 };
  /** Anclas propias de cada ojo (izquierdo, derecho), p. ej. sobre las cúpulas de la rana. */
  eyeAnchors?: Array<{ p: THREE.Vector3; n: THREE.Vector3 }>;
}

export type MouthPose = 'rest' | 'half' | 'open' | 'happy' | 'frown' | 'wavy' | 'zigzag';
export type EyePose = 'open' | 'happy' | 'closed';

export interface FaceFrame {
  /** Mirada: -1..1 en x (derecha del jugador) e y (arriba). */
  lookX: number;
  lookY: number;
  /** 0 = abierto, 1 = cerrado. */
  blink: number;
  eyes: EyePose;
  mouth: MouthPose;
  /** Inclinación de las cejas (+ = enojo, − = preocupación) y altura extra. */
  browTilt: number;
  browLift: number;
}

export interface FaceRig {
  group: THREE.Group;
  /** Punto (local al grupo de la cabeza) donde va la boca: sirve de ancla para el bigote. */
  mouthPoint: THREE.Vector3;
  /** Altura de los ojos (para gafas). */
  eyePoint: THREE.Vector3;
  update: (f: FaceFrame) => void;
  dispose: () => void;
}

const S = 128;
const HUMAN_EYES = new Set(['round', 'almond', 'lashes', 'narrow', 'droopy', 'calm', 'bright', 'cool']);
const LIDDED = new Set(['droopy', 'calm', 'cool']);

/** Ojo "de persona" (blanco + iris móvil) o de caricatura (óvalo oscuro con brillos). */
function eyeKind(style: string, humanoid: boolean): 'human' | 'toon' {
  if (style === 'round') return humanoid ? 'human' : 'toon';
  return HUMAN_EYES.has(style) ? 'human' : 'toon';
}

function eyeShape(style: string) {
  return style === 'almond' ? { sx: 1.18, sy: 0.72 }
    : style === 'narrow' ? { sx: 1.08, sy: 0.42 }
    : style === 'bright' ? { sx: 1.0, sy: 1.08 }
    : style === 'cool' ? { sx: 1.05, sy: 0.6 }
    : { sx: 1.0, sy: 0.92 };
}

/* ------------------------------------------------------------------ */
/* Texturas                                                            */
/* ------------------------------------------------------------------ */

function eyeBaseTexture(style: string, side: number, kind: 'human' | 'toon', pose: EyePose): THREE.DataTexture {
  const R = new Raster(S, S);
  const c = S / 2;
  if (pose === 'happy' || style === 'happy' || (style === 'wink' && side === 1)) {
    R.stroke(arc(c, c + 14, 34, 26, Math.PI + 0.25, Math.PI * 2 - 0.25), 9, INK);
    return rasterTexture(R);
  }
  if (pose === 'closed' || style === 'sleepy') {
    R.stroke(arc(c, c - 4, 34, 12, 0.15, Math.PI - 0.15), 8, INK);
    return rasterTexture(R);
  }
  if (kind === 'human') {
    const sh = eyeShape(style);
    const rx = 44 * sh.sx;
    const ry = 46 * sh.sy;
    const rot = style === 'almond' ? -side * 0.1 : 0;
    R.ellipse(c, c, rx + 4, ry + 4, INK, { rot });
    R.ellipse(c, c, rx, ry, WHITE, { rot });
    R.stroke(rotPts(arc(c, c, rx + 2, ry + 2, Math.PI + 0.25, Math.PI * 2 - 0.25), c, c, rot), 9, INK);
    if (style === 'lashes') {
      const outer = c + side * rx;
      R.stroke([[outer - side * 6, c - ry * 0.55], [outer + side * 12, c - ry * 0.95]], 6, INK);
      R.stroke([[outer - side * 18, c - ry * 0.9], [outer - side * 6, c - ry * 1.3]], 6, INK);
    }
  } else if (style === 'fierce') {
    R.stroke([[c - 40, c - (side < 0 ? 52 : 34)], [c + 40, c - (side < 0 ? 34 : 52)]], 9, INK);
  }
  return rasterTexture(R);
}

function pupilTexture(style: string, kind: 'human' | 'toon', iris: RGB): THREE.DataTexture {
  const R = new Raster(S, S);
  const c = S / 2;
  if (kind === 'human') {
    const ir = style === 'bright' ? 30 : 26;
    R.ellipse(c, c + 3, ir, ir * 1.08, iris);
    R.ellipse(c, c + 3, ir * 0.5, ir * 0.55, INK);
    R.ellipse(c - ir * 0.38, c - ir * 0.32, ir * 0.3, ir * 0.3, WHITE);
    R.ellipse(c + ir * 0.4, c + ir * 0.48, ir * 0.14, ir * 0.14, WHITE);
    return rasterTexture(R);
  }
  // Ojo de caricatura: óvalo oscuro alto con iris de color abajo y dos brillos
  const big = style === 'anime' ? 1.12 : 1;
  const rx = 24 * big;
  const ry = 44 * big;
  R.ellipse(c, c, rx, ry, INK);
  if (style === 'heart') {
    R.ellipse(c - 9, c - 2, 11, 11, [255, 77, 121]);
    R.ellipse(c + 9, c - 2, 11, 11, [255, 77, 121]);
    R.polygon([[c - 19, c + 3], [c + 19, c + 3], [c, c + 24]], [255, 77, 121]);
  } else if (style === 'starry') {
    R.polygon(
      Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 7 : 16;
        return [c + Math.cos(a) * r, c + 8 + Math.sin(a) * r] as [number, number];
      }),
      [244, 185, 66]
    );
  } else {
    R.ellipse(c, c + ry * 0.42, rx * 0.72, ry * 0.4, iris, { clip: (x, y) => ((x - c) / rx) ** 2 + ((y - c) / ry) ** 2 <= 1 });
  }
  R.ellipse(c - rx * 0.3, c - ry * 0.45, rx * 0.36, ry * 0.24, WHITE);
  R.ellipse(c + rx * 0.3, c + ry * 0.2, rx * 0.14, ry * 0.08, WHITE);
  return rasterTexture(R);
}

function lidTexture(style: string, side: number, skin: RGB): THREE.DataTexture {
  const R = new Raster(S, S);
  const c = S / 2;
  const sh = eyeShape(style);
  const rx = 44 * sh.sx + 5;
  const ry = 46 * sh.sy + 5;
  const cut = style === 'calm' ? 0.15 : style === 'cool' ? 0.1 : 0;
  const tiltR = style === 'droopy' ? side * ry * 0.35 : 0;
  const pts: Array<[number, number]> = [
    ...arc(c, c, rx, ry, Math.PI, Math.PI * 2, 14),
    [c + rx, c - ry * cut + tiltR],
    [c - rx, c - ry * cut - tiltR],
  ];
  R.polygon(pts, skin);
  R.stroke([pts[pts.length - 1]!, pts[pts.length - 2]!], 8, INK);
  return rasterTexture(R);
}

function browTexture(style: string, color: RGB, k: number): THREE.DataTexture {
  const R = new Raster(S, 64);
  const w = (style === 'bold' || style === 'unibrow' ? 18 : style === 'short' ? 9 : 13) * k;
  const half = style === 'short' ? 30 : 48;
  if (style === 'dot') {
    R.ellipse(S / 2, 32, 12 * k, 10 * k, color);
  } else {
    R.stroke(arc(S / 2, 44, half, 18, Math.PI + 0.45, Math.PI * 2 - 0.45, 12), w, color);
  }
  return rasterTexture(R);
}

function mouthTexture(style: string, pose: MouthPose, lip: RGB): THREE.DataTexture {
  const R = new Raster(S, 96);
  const c = S / 2;
  const cy = 40;
  const mw = 40;
  const dark: RGB = [80, 24, 36];
  const pink: RGB = [255, 107, 139];
  const openShape = (depth: number, teeth: boolean) => {
    const pts: Array<[number, number]> = [[c - mw, cy - 4], ...arc(c, cy - 4, mw, depth, 0, Math.PI, 16).reverse()];
    R.polygon(pts, dark);
    if (teeth) R.polygon([[c - mw * 0.85, cy - 4], [c + mw * 0.85, cy - 4], [c + mw * 0.72, cy + 4], [c - mw * 0.72, cy + 4]], WHITE);
    if (depth > 18) R.ellipse(c, cy - 4 + depth * 0.62, mw * 0.5, depth * 0.24, pink);
    R.stroke([[c - mw, cy - 4], [c + mw, cy - 4]], 4, INK);
  };
  switch (pose) {
    case 'half':
      R.ellipse(c, cy + 4, mw * 0.42, 13, dark);
      R.ellipse(c, cy + 11, mw * 0.28, 5, pink);
      R.stroke(arc(c, cy + 4, mw * 0.42 + 1, 14, 0, Math.PI * 2, 24), 4, INK);
      return rasterTexture(R);
    case 'open':
      openShape(26, false);
      return rasterTexture(R);
    case 'happy':
      openShape(32, true);
      return rasterTexture(R);
    case 'frown':
      R.stroke(arc(c, cy + 22, mw * 0.7, 16, Math.PI + 0.35, Math.PI * 2 - 0.35, 14), 7, INK);
      return rasterTexture(R);
    case 'wavy':
      R.stroke(Array.from({ length: 13 }, (_, i) => [c - mw * 0.7 + (i * mw * 1.4) / 12, cy + 6 + Math.sin(i * 1.3) * 5] as [number, number]), 6, INK);
      return rasterTexture(R);
    case 'zigzag':
      R.stroke([[c - mw * 0.7, cy + 8], [c - mw * 0.35, cy], [c, cy + 8], [c + mw * 0.35, cy], [c + mw * 0.7, cy + 8]], 6, INK);
      return rasterTexture(R);
    default:
      break;
  }
  // Reposo: el estilo de boca elegido
  if (style === 'lips') {
    R.polygon([[c - mw, cy], [c - mw * 0.45, cy - 11], [c, cy - 5], [c + mw * 0.45, cy - 11], [c + mw, cy], [c, cy + 1]], lip);
    R.ellipse(c, cy + 7, mw * 0.78, 11, lip, { clip: (_x, y) => y >= cy - 1 });
    R.stroke([[c - mw, cy], [c, cy + 1], [c + mw, cy]], 3.5, [lip[0] * 0.6, lip[1] * 0.5, lip[2] * 0.5]);
  } else if (style === 'grin' || style === 'teeth') {
    openShape(22, true);
  } else if (style === 'laugh') {
    openShape(30, true);
  } else if (style === 'o') {
    R.ellipse(c, cy + 2, 13, 16, INK);
    R.ellipse(c, cy + 5, 7, 8, pink);
  } else if (style === 'line') {
    R.stroke([[c - mw * 0.75, cy + 2], [c + mw * 0.75, cy + 2]], 7, INK);
  } else if (style === 'small') {
    R.stroke(arc(c, cy - 4, mw * 0.45, 10, 0.3, Math.PI - 0.3, 10), 7, INK);
  } else if (style === 'smirk') {
    R.stroke([[c - mw * 0.8, cy + 4], [c, cy + 7], [c + mw * 0.8, cy - 7]], 7, INK);
  } else if (style === 'pout') {
    R.stroke(arc(c, cy + 12, mw * 0.6, 11, Math.PI + 0.4, Math.PI * 2 - 0.4, 10), 7, INK);
  } else if (style === 'cat' || style === 'wavy') {
    R.stroke([...arc(c - mw * 0.4, cy - 2, mw * 0.4, 10, Math.PI, 0, 8).reverse(), ...arc(c + mw * 0.4, cy - 2, mw * 0.4, 10, Math.PI, 0, 8).reverse()], 7, INK);
  } else if (style === 'kiss') {
    R.stroke([[c - 3, cy - 14], [c + 10, cy - 6], [c - 3, cy], [c + 10, cy + 7], [c - 3, cy + 14]], 7, lip);
  } else {
    R.stroke(arc(c, cy - 12, mw * 0.85, 19, 0.35, Math.PI - 0.35, 16), 7, INK);
    if (style === 'tongue') R.ellipse(c + 7, cy + 12, 11, 10, pink);
    if (style === 'fangs') [-1, 1].forEach((s) => R.polygon([[c + s * 12, cy + 3], [c + s * 20, cy + 3], [c + s * 16, cy + 14]], WHITE));
  }
  return rasterTexture(R);
}

/* ------------------------------------------------------------------ */
/* Ensamblado                                                          */
/* ------------------------------------------------------------------ */

/** Punto y normal de la superficie del elipsoide de la cabeza para un acimut/elevación dados. */
export function headSurface(head: HeadShape, az: number, elev: number) {
  const p = new THREE.Vector3(
    head.w * Math.sin(az) * Math.cos(elev),
    head.cy + head.h * Math.sin(elev),
    head.d * Math.cos(az) * Math.cos(elev)
  );
  const n = new THREE.Vector3(p.x / head.w ** 2, (p.y - head.cy) / head.h ** 2, p.z / head.d ** 2).normalize();
  return { p, n };
}

export function buildFaceDecals(
  config: PetConfig,
  head: HeadShape,
  layout: FaceLayout,
  opts: {
    humanoid: boolean;
    material: (map: THREE.Texture) => THREE.Material;
  }
): FaceRig {
  const group = new THREE.Group();
  const t = config.tuning ?? {};
  const textures: THREE.Texture[] = [];
  const mats: THREE.Material[] = [];
  const keep = <T extends THREE.Texture>(tx: T) => {
    textures.push(tx);
    return tx;
  };
  const plane = (size: number, tex: THREE.Texture, w = 1, h = 1) => {
    const mat = opts.material(tex);
    mats.push(mat);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size * w, size * h), mat);
    m.renderOrder = 3;
    return m;
  };
  /** Coloca un grupo pegado a la cabeza, orientado según la normal. */
  const stick = (g: THREE.Object3D, az: number, elev: number, lift = 0.006) => {
    const { p, n } = headSurface(head, az, elev);
    g.position.copy(p).addScaledVector(n, lift);
    g.lookAt(p.clone().addScaledVector(n, 2));
    return { p, n };
  };

  const style = config.eyeStyle;
  const kind = eyeKind(style, opts.humanoid);
  const skin = hex(config.bodyColor);
  const iris = hex(config.eyeColor ?? (opts.humanoid ? '#5B3A1E' : '#3B7BFF'));
  const lipC = hex(config.lipColor ?? '#D9606E');

  const eyeK = 1 + tstep(t.eyeSize) * 0.09;
  const eyeSY = 1 + tstep(t.eyeStretch) * 0.1;
  const eyeSX = 1 - tstep(t.eyeStretch) * 0.04;
  const eyeRot = tstep(t.eyeRotation) * 0.09;
  const eyeAz = layout.eyeAz * (1 + tstep(t.eyeSpacing) * 0.08);
  const eyeElev = layout.eyeElev + tstep(t.eyeHeight) * 0.03;

  // ---------------- Ojos ----------------
  interface EyeParts {
    root: THREE.Group;
    base: THREE.Mesh;
    pupil: THREE.Mesh;
    lid?: THREE.Mesh;
    side: number;
    happyTex: THREE.Texture;
    openTex: THREE.Texture;
    closedTex: THREE.Texture;
  }
  const eyes: EyeParts[] = [-1, 1].map((side) => {
    const root = new THREE.Group();
    const own = layout.eyeAnchors?.[side < 0 ? 0 : 1];
    if (own) {
      root.position.copy(own.p).addScaledVector(own.n, 0.006);
      root.lookAt(root.position.clone().add(own.n));
    } else {
      stick(root, side * eyeAz, eyeElev);
    }
    const inner = new THREE.Group();
    inner.rotation.z = side * eyeRot;
    inner.scale.set(eyeK * eyeSX, eyeK * eyeSY, 1);
    root.add(inner);
    const openTex = keep(eyeBaseTexture(style, side, kind, 'open'));
    const happyTex = keep(eyeBaseTexture(style, side, kind, 'happy'));
    const closedTex = keep(eyeBaseTexture(style, side, kind, 'closed'));
    const base = plane(layout.eyeSize, openTex);
    const pupil = plane(layout.eyeSize, keep(pupilTexture(style, kind, iris)));
    pupil.position.z = 0.002;
    // Orden fijo de capas (blanco → pupila → párpado): sin escritura de profundidad,
    // el orden por distancia podía tapar la pupila de un ojo.
    pupil.renderOrder = 4;
    inner.add(base, pupil);
    let lid: THREE.Mesh | undefined;
    if (kind === 'human' && LIDDED.has(style)) {
      lid = plane(layout.eyeSize, keep(lidTexture(style, side, skin)));
      lid.position.z = 0.004;
      lid.renderOrder = 5;
      inner.add(lid);
    }
    group.add(root);
    return { root, base, pupil, lid, side, happyTex, openTex, closedTex };
  });
  const arcOnly = style === 'happy' || style === 'sleepy';

  // ---------------- Cejas ----------------
  const browStyle = config.browStyle ?? 'soft';
  const browK = 1 + tstep(t.browSize) * 0.12;
  const browSX = 1 + tstep(t.browStretch) * 0.13;
  const browRot = tstep(t.browRotation) * 0.09;
  const browAz = layout.eyeAz * (1 + tstep(t.eyeSpacing) * 0.08 + tstep(t.browSpacing) * 0.08);
  const browElev = layout.browElev + tstep(t.eyeHeight) * 0.03 + tstep(t.browHeight) * 0.03;
  const hair = hex(config.hairColor ?? '#4A2E1B');
  const browColor: RGB = [hair[0] * 0.75, hair[1] * 0.75, hair[2] * 0.75];
  const brows: Array<{ root: THREE.Group; mesh: THREE.Mesh; side: number; baseTilt: number }> = [];
  if (browStyle !== 'none') {
    const browTex = keep(browTexture(browStyle, browColor, browK));
    const baseTilt =
      browStyle === 'hero' ? 0.32 : browStyle === 'worried' ? -0.3 : browStyle === 'raised' ? -0.12 : 0;
    [-1, 1].forEach((side) => {
      const root = new THREE.Group();
      stick(root, side * browAz, browElev, 0.008);
      const mesh = plane(layout.browSize, browTex, 1, 0.5);
      mesh.scale.x = browSX * (browStyle === 'unibrow' ? 1.25 : 1);
      root.add(mesh);
      group.add(root);
      brows.push({ root, mesh, side, baseTilt: baseTilt + browRot });
    });
  }

  // ---------------- Boca ----------------
  const mouthStyle = config.mouthStyle ?? 'smile';
  const mK = 1 + tstep(t.mouthSize) * 0.1;
  const mSX = 1 + tstep(t.mouthStretch) * 0.12;
  const mouthRoot = new THREE.Group();
  let mouthPoint: THREE.Vector3;
  if (layout.mouthAnchor) {
    mouthRoot.position.copy(layout.mouthAnchor.p).addScaledVector(layout.mouthAnchor.n, 0.006);
    mouthRoot.lookAt(layout.mouthAnchor.p.clone().addScaledVector(layout.mouthAnchor.n, 2));
    mouthPoint = layout.mouthAnchor.p.clone();
  } else {
    mouthPoint = stick(mouthRoot, 0, layout.mouthElev + tstep(t.mouthHeight) * 0.03).p;
  }
  const mouthTex = new Map<MouthPose, THREE.Texture>();
  const mouthTexFor = (pose: MouthPose) => {
    let tx = mouthTex.get(pose);
    if (!tx) {
      tx = keep(mouthTexture(mouthStyle, pose, lipC));
      mouthTex.set(pose, tx);
    }
    return tx;
  };
  const mouth = plane(layout.mouthSize, mouthTexFor('rest'), 1, 0.75);
  mouth.scale.set(mK * mSX, mK, 1);
  mouthRoot.add(mouth);
  group.add(mouthRoot);

  const eyePoint = headSurface(head, 0, eyeElev).p;
  const setMap = (m: THREE.Mesh, tx: THREE.Texture) => {
    const mat = m.material as THREE.MeshBasicMaterial;
    if (mat.map !== tx) {
      mat.map = tx;
      mat.needsUpdate = true;
    }
  };

  return {
    group,
    mouthPoint,
    eyePoint,
    update: (f) => {
      const pupilRange = kind === 'human' ? 0.14 : 0.11;
      eyes.forEach((e) => {
        const pose: EyePose = arcOnly ? 'open' : f.eyes;
        const showPupil = pose === 'open' && !arcOnly && !(style === 'wink' && e.side === 1);
        setMap(e.base, pose === 'happy' ? e.happyTex : pose === 'closed' ? e.closedTex : e.openTex);
        e.pupil.visible = showPupil;
        if (e.lid) e.lid.visible = showPupil;
        e.pupil.position.x = f.lookX * pupilRange * layout.eyeSize;
        e.pupil.position.y = f.lookY * pupilRange * layout.eyeSize * 0.8;
        // Parpadeo: la calcomanía se aplasta verticalmente
        e.root.scale.y = pose === 'open' ? Math.max(0.08, 1 - f.blink) : 1;
      });
      brows.forEach((b) => {
        b.mesh.rotation.z = -b.side * (b.baseTilt + f.browTilt);
        b.mesh.position.y = f.browLift * layout.browSize * 0.25;
      });
      setMap(mouth, mouthTexFor(f.mouth));
    },
    dispose: () => {
      textures.forEach((tx) => tx.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}
