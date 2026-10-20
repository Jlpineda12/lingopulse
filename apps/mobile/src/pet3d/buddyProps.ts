import * as THREE from 'three';
import type { BackItemId, HeldItemId, NeckItemId, PatternId } from '../game/pet';
import { cylinder, ellipsoid, OUTLINE_MAT } from './toonKit';
import { ballPatch, ellipseMask, type Anchor } from './buddySpecies';

/**
 * Accesorios de los amigos: algo al cuello, algo en la mano, algo a la espalda y un dibujo
 * sobre el cuerpo. Todo se coloca con anclas de cada especie para que encaje bien.
 */

export interface PropAnchors {
  /** Cuello: altura, radios de la sección del cuerpo y punto del frente. */
  neck: { y: number; rx: number; rz: number; front: Anchor };
  /** Centro de la espalda. */
  back: Anchor;
  /** Ancho del cuerpo (para separar alas y tirantes). */
  width: number;
  /** El cuerpo es una bola (admite dibujos de patrón). */
  ball: boolean;
}

export interface BuddyProps {
  /** Mueve lo que lleva en la mano junto al brazo derecho y anima alas, globo, cascabel… */
  animate: (t: number, arm: THREE.Object3D, lively: number) => void;
}

type Toon = (c: THREE.ColorRepresentation) => THREE.MeshToonMaterial;

function outline<T extends THREE.Mesh>(m: T, k = 1.06) {
  const o = new THREE.Mesh(m.geometry, OUTLINE_MAT);
  o.scale.setScalar(k);
  m.add(o);
  return m;
}

/** Estrella plana de cinco puntas (extruida un poco para que tenga volumen). */
function starMesh(r: number, mat: THREE.Material, depth = 0.04) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 });
  geo.center();
  return new THREE.Mesh(geo, mat);
}

const place = (o: THREE.Object3D, at: Anchor, lift = 0) => {
  o.position.copy(at.p).addScaledVector(at.n, lift);
  o.lookAt(o.position.clone().add(at.n));
  return o;
};

/** Lugares de la bola donde van los dibujos (sin tapar la cara). */
const PATTERN_SPOTS: Array<[number, number, number]> = [
  [1.25, 0.5, 0.17], [-1.3, 0.45, 0.15], [1.7, -0.2, 0.2], [-1.75, -0.25, 0.18], [2.6, 0.35, 0.2],
  [-2.5, 0.6, 0.16], [3.05, -0.25, 0.2], [0.55, 0.95, 0.14], [-0.6, 1.0, 0.13], [2.1, 0.9, 0.15],
  [0.9, -0.55, 0.13], [-0.95, -0.6, 0.14],
];

function patternMask(id: PatternId): ((az: number, el: number) => number) | null {
  switch (id) {
    case 'spots': {
      const ms = PATTERN_SPOTS.map(([a, e, r], i) => ellipseMask(a, e, r, r * (0.8 + (i % 3) * 0.12), i * 0.7));
      return (a, e) => Math.max(...ms.map((m) => m(a, e)));
    }
    case 'hearts':
    case 'stars': {
      const star = id === 'stars';
      const items = PATTERN_SPOTS.filter((_, i) => i % 2 === 0);
      return (a, e) => {
        let best = 0;
        for (const [ca, ce, r] of items) {
          let da = a - ca;
          if (da > Math.PI) da -= Math.PI * 2;
          if (da < -Math.PI) da += Math.PI * 2;
          const u = (da * Math.cos(e)) / (r * 1.1);
          const v = (e - ce) / (r * 1.1);
          let inside: number;
          if (star) {
            const th = Math.atan2(v, u) - Math.PI / 2;
            const lim = 0.55 + 0.45 * Math.cos(5 * th);
            inside = 1 - Math.min(1, Math.max(0, (Math.hypot(u, v) - lim) / 0.12 + 0.5));
          } else {
            // Corazón implícito: (x²+y²−1)³ − x²y³ < 0
            const x = u * 1.25;
            const y = v * 1.25 + 0.25;
            const f = (x * x + y * y - 1) ** 3 - x * x * y ** 3;
            inside = f < -0.02 ? 1 : f < 0.02 ? 0.5 - f * 25 : 0;
          }
          best = Math.max(best, inside);
        }
        return best;
      };
    }
    case 'stripes':
      // Rayas de tigre por los costados y la espalda (la cara y la coronilla quedan libres)
      return (a, e) => {
        const sides = Math.max(0, Math.min(1, (Math.abs(a) - 1.0) * 3));
        const band = Math.sin((Math.abs(a) * 2.2 + e * 0.6) * 3.4);
        return sides * Math.max(0, Math.min(1, (band - 0.5) * 5)) * (Math.abs(e) < 0.75 ? 1 : 0);
      };
    case 'patch':
      return ellipseMask(0.33, 0.25, 0.3, 0.33, 0.2);
    default:
      return null;
  }
}

export function buildBuddyProps(
  body: THREE.Group,
  anchors: PropAnchors,
  opts: {
    neck: NeckItemId;
    held: HeldItemId;
    back: BackItemId;
    pattern: PatternId;
    patternColor: string;
    accent: THREE.Color;
    toon: Toon;
  }
): BuddyProps {
  const { toon, accent } = opts;
  const gold = toon(0xf4c44e);
  const white = toon(0xffffff);
  const ink = new THREE.MeshBasicMaterial({ color: 0x2a2540 });
  const { neck } = anchors;
  const flaps: Array<{ obj: THREE.Object3D; side: number; base: number; amp: number; speed: number; axis: 'y' | 'z' }> = [];
  let swing: THREE.Object3D | null = null;
  const flames: THREE.Object3D[] = [];
  let capeMesh: THREE.Object3D | null = null;

  // ---------------- Dibujo del cuerpo ----------------
  if (anchors.ball && opts.pattern !== 'none') {
    const mask = patternMask(opts.pattern);
    if (mask) body.add(ballPatch(mask, toon(opts.patternColor), 1.006));
  }

  // ---------------- Cuello ----------------
  /** Cinta que rodea el cuello siguiendo la sección del cuerpo. */
  const band = (mat: THREE.Material, thick = 0.035) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, thick, 8, 48), mat);
    ring.rotation.x = Math.PI / 2;
    ring.scale.set(neck.rx + 0.012, neck.rz + 0.012, 1);
    ring.position.y = neck.y;
    body.add(ring);
    return ring;
  };
  const front = (o: THREE.Object3D, lift = 0.04) => {
    place(o, neck.front, lift);
    body.add(o);
    return o;
  };
  switch (opts.neck) {
    case 'bow': {
      band(toon(accent), 0.03);
      const bow = new THREE.Group();
      const mat = toon(accent);
      [-1, 1].forEach((side) => {
        const loop = ellipsoid(0.15, 0.1, 0.06, mat, 16, true, 0.02);
        loop.position.x = side * 0.13;
        loop.rotation.z = side * 0.35;
        const tail = ellipsoid(0.05, 0.12, 0.03, mat, 10, true, 0.015);
        tail.position.set(side * 0.06, -0.13, -0.01);
        tail.rotation.z = side * 0.4;
        bow.add(loop, tail);
      });
      bow.add(ellipsoid(0.06, 0.06, 0.06, mat, 12, true, 0.015));
      front(bow, 0.06);
      swing = bow;
      break;
    }
    case 'bell': {
      band(toon(0xe11d48), 0.04);
      const bell = new THREE.Group();
      const ball = outline(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), gold), 1.08);
      ball.position.y = -0.1;
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.02), ink);
      slit.position.set(0, -0.13, 0.1);
      const hole = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), ink);
      hole.position.set(0, -0.16, 0.095);
      bell.add(ball, slit, hole);
      front(bell, 0.04);
      swing = bell;
      break;
    }
    case 'bandana': {
      band(toon(accent), 0.03);
      const cloth = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.36, 3), toon(accent));
      cloth.scale.z = 0.18;
      cloth.rotation.z = Math.PI;
      const holder = new THREE.Group();
      cloth.position.y = -0.12;
      holder.add(outline(cloth, 1.04));
      [-0.1, 0.06, 0.0].forEach((x, i) => {
        const dot = ellipsoid(0.025, 0.025, 0.01, white, 8, false);
        dot.position.set(x, -0.06 - i * 0.07, 0.04);
        holder.add(dot);
      });
      front(holder, 0.02);
      break;
    }
    case 'bowtie': {
      const tie = new THREE.Group();
      const mat = toon(accent);
      [-1, 1].forEach((side) => {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 3), mat);
        wing.rotation.z = side * Math.PI / 2;
        wing.scale.z = 0.4;
        wing.position.x = side * 0.09;
        tie.add(outline(wing, 1.06));
      });
      tie.add(ellipsoid(0.045, 0.045, 0.035, mat, 10, true, 0.015));
      front(tie, 0.04);
      break;
    }
    case 'medal': {
      band(toon(accent), 0.025);
      const medal = new THREE.Group();
      const disc = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 24), gold), 1.08);
      disc.rotation.x = Math.PI / 2;
      disc.position.y = -0.16;
      const star = starMesh(0.07, toon(0xfff2a8), 0.02);
      star.position.set(0, -0.16, 0.025);
      medal.add(disc, star);
      front(medal, 0.03);
      swing = medal;
      break;
    }
    case 'lei': {
      const colors = [0xff7aa8, 0xffd43b, 0xffffff, 0xff9f1c];
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const f = ellipsoid(0.07, 0.07, 0.05, toon(colors[i % colors.length]!), 10, true, 0.015);
        f.position.set(Math.sin(a) * (neck.rx + 0.03), neck.y - Math.max(0, Math.cos(a)) * 0.05, Math.cos(a) * (neck.rz + 0.03));
        body.add(f);
      }
      break;
    }
    case 'pearls': {
      const pearl = toon(0xfffaf0);
      const n = 26;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const p = ellipsoid(0.035, 0.035, 0.035, pearl, 8, false);
        p.position.set(Math.sin(a) * (neck.rx + 0.02), neck.y - Math.max(0, Math.cos(a)) * 0.06, Math.cos(a) * (neck.rz + 0.02));
        body.add(p);
      }
      const big = ellipsoid(0.07, 0.08, 0.06, pearl, 12, true, 0.015);
      front(big, 0.0).position.y -= 0.08;
      break;
    }
    default:
      break;
  }

  // ---------------- Mano ----------------
  const held = new THREE.Group();
  /** El globo y el paraguas se mantienen derechos aunque el brazo se mueva. */
  const upright = opts.held === 'balloon' || opts.held === 'umbrella';
  switch (opts.held) {
    case 'balloon': {
      const string = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.1, 4), new THREE.MeshBasicMaterial({ color: 0x8a8aa0 }));
      string.position.y = 0.55;
      const balloon = outline(new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 16), toon(accent)), 1.04);
      balloon.scale.y = 1.15;
      balloon.position.y = 1.35;
      const shine = ellipsoid(0.06, 0.1, 0.03, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }), 8, false);
      shine.position.set(-0.12, 1.45, 0.24);
      const knot = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.06, 8), toon(accent));
      knot.position.y = 1.0;
      held.add(string, balloon, shine, knot);
      break;
    }
    case 'lollipop': {
      const stick = cylinder(0.018, 0.018, 0.5, white, 8, 0);
      stick.position.y = 0.2;
      const candy = outline(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 28), toon(0xff7aa8)), 1.05);
      candy.rotation.x = Math.PI / 2;
      candy.position.y = 0.52;
      const swirl = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 24), white);
      swirl.position.set(0, 0.52, 0.03);
      const swirl2 = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.018, 8, 16), white);
      swirl2.position.set(0, 0.52, 0.03);
      held.add(stick, candy, swirl, swirl2);
      break;
    }
    case 'wand': {
      const stick = cylinder(0.02, 0.025, 0.55, toon(0x3b2a4f), 8, 0);
      stick.position.y = 0.22;
      const star = starMesh(0.14, gold);
      star.position.y = 0.56;
      held.add(stick, star);
      flaps.push({ obj: star, side: 1, base: 0, amp: 0.4, speed: 3, axis: 'y' });
      break;
    }
    case 'flower': {
      const stem = cylinder(0.015, 0.015, 0.45, toon(0x3fae5c), 6, 0);
      stem.position.y = 0.18;
      const leaf = ellipsoid(0.08, 0.025, 0.04, toon(0x4cc96b), 8, false);
      leaf.position.set(0.06, 0.16, 0);
      leaf.rotation.z = 0.5;
      held.add(stem, leaf);
      const head = new THREE.Group();
      head.position.y = 0.45;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const petal = ellipsoid(0.07, 0.05, 0.025, toon(accent), 10, true, 0.012);
        petal.position.set(Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0);
        petal.rotation.z = a;
        head.add(petal);
      }
      head.add(ellipsoid(0.045, 0.045, 0.035, toon(0xffd43b), 10, true, 0.012));
      held.add(head);
      break;
    }
    case 'icecream': {
      const coneM = outline(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 14), toon(0xe8b46a)), 1.05);
      coneM.rotation.z = Math.PI;
      coneM.position.y = 0.15;
      const s1 = ellipsoid(0.13, 0.11, 0.13, toon(0xff9ec4), 14, true, 0.02);
      s1.position.y = 0.33;
      const s2 = ellipsoid(0.11, 0.1, 0.11, toon(0xfff3d6), 14, true, 0.02);
      s2.position.y = 0.48;
      const cherry = ellipsoid(0.04, 0.04, 0.04, toon(0xe11d48), 8, false);
      cherry.position.y = 0.6;
      held.add(coneM, s1, s2, cherry);
      break;
    }
    case 'microphone': {
      const handle = cylinder(0.035, 0.028, 0.3, toon(0x2a2540), 10, 0.02);
      handle.position.y = 0.12;
      const head = outline(new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), toon(0xc0c6d4)), 1.06);
      head.position.y = 0.32;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 16), toon(accent));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.26;
      held.add(handle, head, ring);
      break;
    }
    case 'flag': {
      const pole = cylinder(0.015, 0.015, 0.7, toon(0x8a5a32), 6, 0);
      pole.position.y = 0.3;
      const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 3), toon(accent));
      pennant.rotation.z = -Math.PI / 2;
      pennant.scale.z = 0.12;
      pennant.position.set(0.15, 0.56, 0);
      held.add(pole, outline(pennant, 1.05));
      flaps.push({ obj: pennant, side: 1, base: 0, amp: 0.35, speed: 6, axis: 'y' });
      break;
    }
    case 'teddy': {
      const brown = toon(0xb07a4a);
      const tb = ellipsoid(0.12, 0.13, 0.1, brown, 14, true, 0.02);
      tb.position.y = 0.06;
      const th = ellipsoid(0.11, 0.1, 0.1, brown, 14, true, 0.02);
      th.position.y = 0.25;
      [-1, 1].forEach((side) => {
        const ear = ellipsoid(0.04, 0.04, 0.03, brown, 8, true, 0.012);
        ear.position.set(side * 0.08, 0.34, 0);
        const eye = ellipsoid(0.014, 0.014, 0.01, ink, 6, false);
        eye.position.set(side * 0.035, 0.27, 0.095);
        held.add(ear, eye);
      });
      const snout = ellipsoid(0.04, 0.03, 0.03, toon(0xf2d3b0), 8, false);
      snout.position.set(0, 0.22, 0.09);
      held.add(tb, th, snout);
      break;
    }
    case 'umbrella': {
      const pole = cylinder(0.015, 0.015, 1.4, toon(0x6b4a2f), 6, 0);
      pole.position.y = 0.7;
      const canopy = new THREE.Group();
      canopy.position.y = 1.4;
      for (let i = 0; i < 8; i++) {
        const seg = new THREE.Mesh(
          new THREE.SphereGeometry(0.62, 6, 8, (i * Math.PI) / 4, Math.PI / 4, 0, Math.PI / 2),
          toon(i % 2 ? 0xffffff : accent)
        );
        seg.scale.y = 0.55;
        canopy.add(seg);
      }
      const tip = ellipsoid(0.03, 0.04, 0.03, gold, 6, false);
      tip.position.y = 0.36;
      canopy.add(tip);
      held.add(pole, canopy);
      break;
    }
    default:
      break;
  }
  if (held.children.length) body.add(held);

  // ---------------- Espalda ----------------
  const back = new THREE.Group();
  place(back, anchors.back, -0.02);
  // Tras `place`, +z del grupo apunta hacia atrás (fuera de la espalda).
  const wingPair = (make: (side: number) => THREE.Object3D, amp: number, speed: number) => {
    [-1, 1].forEach((side) => {
      // Alas grandes que asoman por los lados para que se vean de frente
      const pivot = new THREE.Group();
      pivot.position.set(-side * anchors.width * 0.35, 0.18, 0.02);
      const w = make(side);
      w.scale.setScalar(1.55);
      pivot.add(w);
      back.add(pivot);
      flaps.push({ obj: pivot, side, base: side * 0.35, amp, speed, axis: 'y' });
    });
  };
  switch (opts.back) {
    case 'angel':
      wingPair((side) => {
        const g = new THREE.Group();
        [0, 1, 2].forEach((i) => {
          const f = ellipsoid(0.36 - i * 0.08, 0.13, 0.05, white, 14, true, 0.02);
          f.position.set(-side * (0.3 + i * 0.04), 0.12 - i * 0.13, 0);
          f.rotation.z = side * (0.35 + i * 0.25);
          g.add(f);
        });
        return g;
      }, 0.25, 2.2);
      break;
    case 'bat':
      wingPair((side) => {
        const g = new THREE.Group();
        const mat = toon(0x4c3a78);
        [0, 1, 2].forEach((i) => {
          const f = ellipsoid(0.16, 0.3, 0.03, mat, 12, true, 0.02);
          f.position.set(-side * (0.18 + i * 0.16), 0.05 - i * 0.05, 0);
          f.rotation.z = -side * (0.4 - i * 0.25);
          g.add(f);
        });
        return g;
      }, 0.35, 3.5);
      break;
    case 'butterfly':
      wingPair((side) => {
        const g = new THREE.Group();
        const upper = ellipsoid(0.32, 0.26, 0.03, toon(accent), 16, true, 0.02);
        upper.position.set(-side * 0.32, 0.2, 0);
        upper.rotation.z = side * 0.3;
        const lower = ellipsoid(0.2, 0.17, 0.03, toon(accent.clone().offsetHSL(0.08, 0, 0.08)), 14, true, 0.02);
        lower.position.set(-side * 0.24, -0.12, 0);
        const dot = ellipsoid(0.07, 0.07, 0.01, white, 10, false);
        dot.position.set(-side * 0.38, 0.24, 0.03);
        g.add(upper, lower, dot);
        return g;
      }, 0.4, 4);
      break;
    case 'fairy':
      wingPair((side) => {
        const g = new THREE.Group();
        const mat = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
        const up = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat);
        up.scale.set(0.16, 0.36, 0.01);
        up.position.set(-side * 0.22, 0.3, 0);
        up.rotation.z = side * 0.6;
        const lo = up.clone();
        lo.scale.set(0.11, 0.24, 0.01);
        lo.position.set(-side * 0.18, -0.05, 0);
        lo.rotation.z = side * 1.6;
        g.add(up, lo);
        return g;
      }, 0.45, 9);
      break;
    case 'backpack': {
      const pack = ellipsoid(0.42, 0.44, 0.22, toon(accent), 20, true, 0.03);
      pack.position.set(0, -0.08, 0.12);
      const pocket = ellipsoid(0.26, 0.18, 0.1, toon(accent.clone().offsetHSL(0, 0, -0.1)), 14, true, 0.02);
      pocket.position.set(0, -0.2, 0.3);
      const flap = ellipsoid(0.4, 0.14, 0.2, toon(accent.clone().offsetHSL(0, 0, 0.08)), 16, true, 0.02);
      flap.position.set(0, 0.24, 0.16);
      back.add(pack, pocket, flap);
      // Tirantes que pasan por encima de los hombros
      const strapMat = toon(0x3b4a6b);
      [-1, 1].forEach((side) => {
        const x = side * anchors.width * 0.42;
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x, 0.25, -neck.rz * 0.9),
          new THREE.Vector3(x, neck.y + 0.75, -neck.rz * 0.2),
          new THREE.Vector3(x * 0.9, neck.y + 0.55, neck.rz * 0.75),
          new THREE.Vector3(x * 0.85, neck.y, neck.rz * 0.97),
        ]);
        body.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.035, 6, false), strapMat));
      });
      break;
    }
    case 'cape': {
      // Capa que cae desde el cuello por la espalda y ondea
      const mat = toon(accent);
      (mat as THREE.Material).side = THREE.DoubleSide;
      const geo = new THREE.CylinderGeometry(neck.rx * 0.98, anchors.width * 1.05, 1.15, 24, 1, true, Math.PI * 0.58, Math.PI * 0.84);
      const capeM = new THREE.Mesh(geo, mat);
      capeM.position.set(0, neck.y - 0.575, -0.03);
      body.add(capeM);
      band(mat, 0.03);
      capeMesh = capeM;
      break;
    }
    case 'jetpack': {
      const metal = toon(0xc7cfdc);
      [-1, 1].forEach((side) => {
        const tank = cylinder(0.14, 0.14, 0.62, metal, 16, 0.03);
        tank.position.set(side * 0.18, -0.02, 0.16);
        const capT = ellipsoid(0.14, 0.09, 0.14, toon(accent), 14, true, 0.02);
        capT.position.set(side * 0.18, 0.31, 0.16);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 12), new THREE.MeshBasicMaterial({ color: 0xffa52e, transparent: true, opacity: 0.85 }));
        flame.rotation.x = Math.PI;
        flame.position.set(side * 0.18, -0.48, 0.16);
        const core = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 10), new THREE.MeshBasicMaterial({ color: 0xfff3b0 }));
        core.rotation.x = Math.PI;
        core.position.set(side * 0.18, -0.42, 0.16);
        back.add(tank, capT, flame, core);
        flames.push(flame, core);
      });
      break;
    }
    case 'shell': {
      const shellMat = toon(0x5fae4c);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.62, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
      dome.rotation.x = Math.PI / 2;
      dome.scale.set(1, 0.55, 1.05);
      dome.position.z = 0.0;
      back.add(outline(dome, 1.03));
      const plate = toon(0x8fd16f);
      [[0, 0], [0.3, 0.25], [-0.3, 0.25], [0.3, -0.25], [-0.3, -0.25]].forEach(([x, y]) => {
        const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.04, 6), plate);
        hex.rotation.x = Math.PI / 2;
        hex.position.set(x!, y!, 0.3 - Math.hypot(x!, y!) * 0.25);
        back.add(hex);
      });
      break;
    }
    default:
      break;
  }
  if (back.children.length) body.add(back);

  const handTip = new THREE.Vector3();
  return {
    animate: (t, arm, lively) => {
      if (held.children.length) {
        // La mano es la punta del brazo derecho (que ya se anima con cada emoción)
        handTip.set(0, -0.22, 0.06).applyEuler(arm.rotation).add(arm.position);
        held.position.copy(handTip);
        held.position.z += 0.08;
        held.rotation.z = upright ? Math.sin(t * 1.6) * 0.08 : arm.rotation.z * 0.6 - 0.2;
        if (opts.held === 'balloon') held.position.y += Math.sin(t * 2.2) * 0.03;
      }
      flaps.forEach((f) => {
        f.obj.rotation[f.axis] = f.base + Math.sin(t * f.speed * (1 + lively)) * f.amp * f.side;
      });
      if (swing) swing.rotation.z = Math.sin(t * 2.6) * 0.12 * (1 + lively * 2);
      if (capeMesh) capeMesh.rotation.x = -0.12 - Math.sin(t * 2) * 0.05 * (1 + lively * 2);
      flames.forEach((f, i) => {
        const k = 0.8 + Math.random() * 0.4 + lively * 0.6;
        f.scale.set(1, k, 1);
        (f as THREE.Mesh).visible = i % 2 === 1 || k > 0.75;
      });
    },
  };
}
