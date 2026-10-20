import * as THREE from 'three';

/**
 * Pelo esculpido para personas (figura de vinilo / Mii).
 *
 * En vez de apilar bolas sobre la cabeza, cada peinado es una cáscara que abraza el elipsoide de
 * la cabeza: los vértices "con pelo" se separan un poco (volumen) y los que no lo tienen se hunden
 * dentro de la cabeza, así el borde (línea de nacimiento, flequillo, patillas) queda redondeado.
 * Las piezas extra (coletas, moño, trenzas, melena) se añaden encima.
 */

export interface HeadDims {
  w: number;
  h: number;
  d: number;
}

interface Dir {
  /** Azimut: 0 = frente, ±π = nuca (positivo hacia +x). */
  a: number;
  /** Elevación: +π/2 = coronilla. */
  e: number;
  x: number;
  y: number;
  z: number;
}

interface ShellSpec {
  /** Elevación (rad) de la línea del pelo en la frente, en las sienes y en la nuca. */
  front: number;
  side: number;
  back: number;
  /** Azimut donde la línea pasa de la frente a las sienes (las melenas dejan la cara libre). */
  temple?: [number, number];
  /** Radio relativo del pelo (1 = piel). */
  vol: number;
  /** Desplazamiento de la línea en la frente según el azimut (flequillo, raya…). */
  fringe?: (a: number) => number;
  /** Volumen extra según la dirección (tupé, rizos…). */
  bump?: (d: Dir) => number;
  /** 0..1: recorta la cáscara a una franja (cresta, mechas). */
  band?: (d: Dir) => number;
}

export interface HumanHairResult {
  /** Altura del pelo por encima de la coronilla (para encajar gorros). */
  top: number;
  /** El peinado tapa las orejas (melenas). */
  coversEars: boolean;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Radio de los vértices sin pelo: quedan escondidos dentro de la cabeza. */
const HIDDEN_R = 0.82;

function hairLine(spec: ShellSpec, a: number): number {
  const aa = Math.abs(a);
  const [t0, t1] = spec.temple ?? [0.5, 1.35];
  let line = aa < t1 ? lerp(spec.front, spec.side, smooth(t0, t1, aa)) : lerp(spec.side, spec.back, smooth(1.5, 2.6, aa));
  if (spec.fringe) line += spec.fringe(a) * (1 - smooth(t0 + 0.25, t1, aa));
  return line;
}

function shellGeometry(head: HeadDims, spec: ShellSpec, extra = 0): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 112, 80);
  const pos = geo.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const d: Dir = { a: Math.atan2(x, z), e: Math.asin(Math.max(-1, Math.min(1, y))), x, y, z };
    const line = hairLine(spec, d.a);
    // Borde redondeado: cuanto más volumen, más suave la caída hacia la piel
    const edge = 0.05 + Math.max(0, spec.vol - 1.08) * 0.45;
    let t = smooth(line - edge, line + edge, d.e);
    if (spec.band) t *= spec.band(d);
    const vol = spec.vol + (spec.bump ? spec.bump(d) : 0) + extra;
    const r = HIDDEN_R + (vol - HIDDEN_R) * t;
    pos.setXYZ(i, x * r * head.w, y * r * head.h, z * r * head.d);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Punto y normal sobre la cáscara de pelo en una dirección (a, e). */
function surface(head: HeadDims, spec: ShellSpec, a: number, e: number) {
  const x = Math.sin(a) * Math.cos(e);
  const y = Math.sin(e);
  const z = Math.cos(a) * Math.cos(e);
  const r = spec.vol + (spec.bump ? spec.bump({ a, e, x, y, z }) : 0);
  const p = new THREE.Vector3(x * r * head.w, y * r * head.h, z * r * head.d);
  const n = new THREE.Vector3(x / head.w, y / head.h, z / head.d).normalize();
  return { p, n };
}

const scallop = (k: number, amp: number) => (a: number) => amp * Math.cos(a * k);

const SPECS: Record<string, ShellSpec> = {
  short: { front: 0.6, side: 0.2, back: -0.5, vol: 1.08, fringe: (a) => -0.08 * Math.cos(a * 1.8), bump: (d) => 0.03 * Math.max(0, d.y) },
  buzz: { front: 0.66, side: 0.24, back: -0.42, vol: 1.025 },
  sidepart: {
    front: 0.6,
    side: 0.18,
    back: -0.5,
    vol: 1.09,
    // Flequillo barrido hacia un lado y raya marcada
    fringe: (a) => -0.22 * smooth(-0.5, 0.35, a) * (1 - smooth(0.55, 1.2, a)),
    bump: (d) => 0.04 * Math.max(0, d.y) - 0.035 * Math.exp(-((d.a + 0.5) ** 2) / 0.004) * smooth(0.35, 0.9, d.e),
  },
  pompadour: {
    front: 0.68,
    side: 0.2,
    back: -0.5,
    vol: 1.07,
    bump: (d) => 0.24 * Math.exp(-((d.e - 0.6) ** 2) / 0.05) * Math.max(0, Math.cos(d.a)) ** 2 + 0.03 * Math.max(0, d.y),
  },
  bob: { temple: [1.0, 1.42], front: 0.4, side: -0.62, back: -0.62, vol: 1.12, fringe: scallop(14, 0.035), bump: (d) => 0.07 * Math.max(0, -d.y) },
  long: { temple: [1.0, 1.42], front: 0.42, side: -0.45, back: -0.6, vol: 1.1, fringe: scallop(14, 0.035) },
  wavy: {
    temple: [1.0, 1.42],
    front: 0.44,
    side: -0.45,
    back: -0.6,
    vol: 1.11,
    fringe: (a) => 0.1 * Math.exp(-(a * a) / 0.02) - 0.03,
    bump: (d) => 0.025 * Math.sin(d.e * 14 + d.a * 2),
  },
  braids: { front: 0.6, side: -0.05, back: -0.45, vol: 1.07, fringe: (a) => 0.1 * Math.exp(-(a * a) / 0.015), bump: (d) => -0.03 * Math.exp(-(d.x * d.x) / 0.0015) * smooth(0.3, 0.8, d.e) * (d.z > -0.3 ? 1 : 0) },
  ponytail: { front: 0.66, side: 0.12, back: -0.3, vol: 1.07, fringe: (a) => -0.04 * Math.cos(a * 2) },
  twintails: { front: 0.42, side: 0.05, back: -0.35, vol: 1.08, fringe: scallop(14, 0.035) },
  bun: { front: 0.62, side: 0.15, back: -0.35, vol: 1.07, fringe: (a) => -0.05 * Math.cos(a * 2) },
  afro: { temple: [1.0, 1.42], front: 0.66, side: -0.12, back: -0.6, vol: 1.42, fringe: (a) => -0.12 * Math.cos(a * 1.6), bump: (d) => 0.05 * Math.sin(d.a * 8) * Math.cos(d.e * 8) },
  curly: { temple: [1.0, 1.42], front: 0.48, side: -0.2, back: -0.55, vol: 1.16, fringe: (a) => -0.08 * Math.cos(a * 1.6), bump: (d) => 0.045 * Math.sin(d.a * 10) * Math.sin(d.e * 10 + 1) },
  spiky: { front: 0.6, side: 0.2, back: -0.45, vol: 1.08, fringe: scallop(9, 0.05) },
  mohawk: { front: 0.7, side: 0.26, back: -0.42, vol: 1.02 },
};

export function buildHumanHair(
  group: THREE.Group,
  style: string,
  head: HeadDims,
  hairMat: THREE.Material,
  tieMat: THREE.Material,
  goldMat: THREE.Material,
  highlight?: string
): HumanHairResult {
  const spec = SPECS[style] ?? SPECS.short!;
  const add = (o: THREE.Object3D) => {
    group.add(o);
    return o;
  };
  add(new THREE.Mesh(shellGeometry(head, spec), hairMat));

  const blob = (rx: number, ry: number, rz: number, mat = hairMat, seg = 18) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.75)), mat);
    m.scale.set(rx, ry, rz);
    return m;
  };
  const capsule = (r: number, len: number, mat = hairMat) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 16), mat);
  const along = (o: THREE.Object3D, n: THREE.Vector3) => o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);

  const { w, h, d } = head;
  let coversEars = false;
  switch (style) {
    case 'long': {
      coversEars = true;
      // Melena por detrás (hasta los hombros) y mechones que enmarcan la cara
      const back = blob(w * 1.04, h * 0.62, d * 0.55);
      back.position.set(0, -h * 0.55, -d * 0.42);
      add(back);
      [-1, 1].forEach((side) => {
        const lock = capsule(0.13, h * 0.55);
        lock.scale.z = 0.75;
        lock.position.set(side * w * 0.98, -h * 0.55, d * 0.05);
        lock.rotation.z = side * 0.06;
        add(lock);
      });
      break;
    }
    case 'wavy': {
      coversEars = true;
      const back = blob(w * 1.06, h * 0.6, d * 0.55);
      back.position.set(0, -h * 0.5, -d * 0.42);
      add(back);
      [-1, 1].forEach((side) => {
        for (let i = 0; i < 3; i++) {
          const wv = blob(0.15, 0.14, 0.17);
          wv.position.set(side * (w * 0.97 + (i % 2 ? 0.05 : 0)), -h * 0.3 - i * 0.17, d * 0.08 - i * 0.03);
          add(wv);
        }
      });
      break;
    }
    case 'bob':
      coversEars = true;
      break;
    case 'curly':
    case 'afro':
      coversEars = true;
      break;
    case 'ponytail': {
      const tieP = surface(head, spec, Math.PI - 0.5, 0.75);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.035, 10, 20), tieMat);
      tie.position.copy(tieP.p).addScaledVector(tieP.n, 0.02);
      along(tie, new THREE.Vector3(0, 0.3, -1).normalize());
      tie.rotateX(Math.PI / 2);
      // La coleta cae hacia un lado para que se vea de frente
      const tail = capsule(0.12, 0.5);
      tail.position.set(tieP.p.x + 0.36, tieP.p.y - 0.28, tieP.p.z - 0.06);
      tail.rotation.set(0.25, 0, 0.6);
      const tip = blob(0.11, 0.14, 0.11);
      tip.position.set(tieP.p.x + 0.54, tieP.p.y - 0.56, tieP.p.z - 0.02);
      add(tail);
      add(tip);
      add(tie);
      break;
    }
    case 'twintails': {
      [-1, 1].forEach((side) => {
        const at = surface(head, spec, side * 1.85, 0.3);
        const tie = blob(0.075, 0.075, 0.075, tieMat, 12);
        tie.position.copy(at.p).addScaledVector(at.n, 0.03);
        const tail = capsule(0.125, 0.38);
        tail.position.set(at.p.x + side * 0.2, at.p.y - 0.22, at.p.z);
        tail.rotation.z = side * 0.55;
        add(tail);
        add(tie);
      });
      break;
    }
    case 'bun': {
      const top = surface(head, spec, Math.PI, 1.05);
      const bun = blob(0.22, 0.2, 0.22);
      bun.position.copy(top.p).addScaledVector(top.n, 0.12);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 8, 20), goldMat);
      band.position.copy(top.p).addScaledVector(top.n, 0.03);
      along(band, top.n);
      band.rotateX(Math.PI / 2);
      add(bun);
      add(band);
      break;
    }
    case 'braids': {
      [-1, 1].forEach((side) => {
        const at = surface(head, spec, side * 1.95, -0.1);
        for (let i = 0; i < 5; i++) {
          const k = blob(0.095 - i * 0.006, 0.085, 0.095 - i * 0.006, hairMat, 12);
          k.position.set(at.p.x + side * 0.02 * i, at.p.y - 0.06 - i * 0.13, at.p.z + 0.02);
          add(k);
        }
        const tie = blob(0.05, 0.04, 0.05, tieMat, 10);
        tie.position.set(at.p.x + side * 0.1, at.p.y - 0.72, at.p.z + 0.02);
        add(tie);
      });
      break;
    }
    case 'spiky': {
      const spikes: Array<[number, number, number]> = [
        [0, 1.25, 0.36], [-0.5, 1.0, 0.3], [0.5, 1.0, 0.3], [-0.25, 0.75, 0.26], [0.25, 0.75, 0.26],
        [0, 0.6, 0.24], [-1.1, 0.75, 0.26], [1.1, 0.75, 0.26], [-2.2, 0.8, 0.26], [2.2, 0.8, 0.26], [Math.PI, 0.9, 0.28],
      ];
      spikes.forEach(([a, e, len]) => {
        const at = surface(head, spec, a, e);
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.11, len, 10), hairMat);
        const dir = at.n.clone().add(new THREE.Vector3(0, 0.6, 0)).normalize();
        along(cone, dir);
        cone.position.copy(at.p).addScaledVector(dir, len * 0.38);
        add(cone);
      });
      break;
    }
    case 'mohawk': {
      // Cresta central sobre los laterales rapados
      const crest: ShellSpec = {
        front: 0.5,
        side: 0.5,
        back: -0.2,
        vol: 1.04,
        bump: (dd) => 0.32 * Math.exp(-(dd.x * dd.x) / 0.006) * smooth(-0.3, 0.5, dd.y),
        band: (dd) => smooth(0.2, 0.1, Math.abs(dd.x)),
      };
      add(new THREE.Mesh(shellGeometry(head, crest, 0.004), hairMat));
      break;
    }
    default:
      break;
  }

  if (highlight && style !== 'buzz') {
    // Mechas: franjas de color sobre la misma cáscara (no sobresalen)
    const hl = (hairMat as THREE.MeshToonMaterial).clone();
    hl.color.set(highlight);
    const centers = [-0.75, -0.3, 0.2, 0.65, 2.4, -2.4];
    const stripes: ShellSpec = {
      ...spec,
      band: (dd) => smooth(0.45, 0.75, Math.max(...centers.map((c) => Math.exp(-((dd.a - c) ** 2) / 0.006)))) * smooth(0.0, 0.3, dd.e),
    };
    add(new THREE.Mesh(shellGeometry(head, stripes, 0.008), hl));
  }

  if (style !== 'buzz') {
    // Brillo de vinilo en la parte alta del pelo
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false });
    [[-0.45, 0.95, 0.14], [-0.15, 1.0, 0.09]].forEach(([a, e, len]) => {
      const at = surface(head, spec, a!, e!);
      const shine = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), shineMat);
      shine.scale.set(len!, 0.016, 0.035);
      shine.position.copy(at.p).addScaledVector(at.n, 0.012);
      shine.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), at.n);
      shine.rotateY(0.5);
      add(shine);
    });
  }

  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  return { top: Math.max(0, box.max.y - group.position.y - head.h), coversEars };
}
