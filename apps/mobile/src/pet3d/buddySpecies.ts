import * as THREE from 'three';
import type { PetSpecies } from '../game/pet';
import { ellipsoid, OUTLINE_MAT } from './toonKit';

/**
 * Rasgos de los amigos redonditos (cuerpo-bola como el chibi): gato, pingüino, rana, panda,
 * pollito, hámster y ajolote. Cada especie añade orejas, hocico, manchas, cola… sobre la bola
 * del cuerpo y devuelve dónde van los ojos y la boca de calcomanía.
 */

/** Medidas del cuerpo-bola (centro en el origen). */
export const BALL = { w: 1.0, h: 0.95, d: 0.96 };

export interface Anchor {
  p: THREE.Vector3;
  n: THREE.Vector3;
}

export interface Wobble {
  obj: THREE.Object3D;
  base: number;
  amp: number;
  speed: number;
  phase: number;
  axis: 'x' | 'z';
}

export interface SpeciesBuild {
  tail?: THREE.Group;
  /** Piezas que se balancean solas (orejas, branquias, copete…). */
  wobble: Wobble[];
  bellyParts: THREE.Object3D[];
  mouthAnchor?: Anchor;
  eyeAnchors?: [Anchor, Anchor];
  eyeSize?: number;
  mouthSize?: number;
  limbColor?: THREE.ColorRepresentation;
  feetColor?: THREE.ColorRepresentation;
}

export interface SpeciesKit {
  body: THREE.Group;
  bodyColor: THREE.Color;
  accent: THREE.Color;
  bodyMat: THREE.Material;
  limbMat: THREE.Material;
  toon: (c: THREE.ColorRepresentation) => THREE.MeshToonMaterial;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Punto y normal sobre la bola en (acimut, elevación); acimut 0 = frente. */
export function onBall(az: number, elev: number, dims = BALL, cy = 0): Anchor {
  const p = new THREE.Vector3(
    dims.w * Math.sin(az) * Math.cos(elev),
    cy + dims.h * Math.sin(elev),
    dims.d * Math.cos(az) * Math.cos(elev)
  );
  const n = new THREE.Vector3(p.x / dims.w ** 2, (p.y - cy) / dims.h ** 2, p.z / dims.d ** 2).normalize();
  return { p, n };
}

/**
 * Parche pintado sobre la bola (máscara de pingüino, antifaz de panda, barriga…): una cáscara
 * apenas más grande que el cuerpo; fuera de la máscara los vértices se hunden dentro de la bola,
 * así el borde queda limpio y redondeado.
 */
export function ballPatch(
  mask: (az: number, elev: number) => number,
  mat: THREE.Material,
  lift = 1.012,
  dims = BALL,
  cy = 0
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(1, 96, 72);
  const pos = geo.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const az = Math.atan2(x, z);
    const el = Math.asin(Math.max(-1, Math.min(1, y)));
    const t = Math.max(0, Math.min(1, mask(az, el)));
    const r = 0.96 + (lift - 0.96) * t;
    pos.setXYZ(i, x * r * dims.w, cy + y * r * dims.h, z * r * dims.d);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

/** Máscara elíptica suave en el espacio (acimut, elevación), con giro opcional. */
export function ellipseMask(cAz: number, cEl: number, rAz: number, rEl: number, rot = 0, soft = 0.12) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return (az: number, el: number) => {
    const dx = az - cAz;
    const dy = el - cEl;
    const u = (dx * c + dy * s) / rAz;
    const v = (-dx * s + dy * c) / rEl;
    return 1 - smooth(1 - soft, 1 + soft, Math.sqrt(u * u + v * v));
  };
}

const union = (...ms: Array<(a: number, e: number) => number>) => (a: number, e: number) =>
  Math.max(...ms.map((m) => m(a, e)));

/** Orienta una malla para que su +z mire hacia la normal de la superficie. */
function stick(o: THREE.Object3D, at: Anchor, lift = 0) {
  o.position.copy(at.p).addScaledVector(at.n, lift);
  o.lookAt(o.position.clone().add(at.n));
  return o;
}

function cone(r: number, h: number, mat: THREE.Material, seg = 20, outline = true) {
  const geo = new THREE.ConeGeometry(r, h, seg);
  const m = new THREE.Mesh(geo, mat);
  if (outline) {
    const out = new THREE.Mesh(geo, OUTLINE_MAT);
    out.scale.set(1.07, 1.04, 1.07);
    m.add(out);
  }
  return m;
}

export function buildBuddySpecies(species: PetSpecies, kit: SpeciesKit): SpeciesBuild | null {
  const { body, toon } = kit;
  const out: SpeciesBuild = { wobble: [], bellyParts: [] };
  const dark = (k: number) => kit.bodyColor.clone().offsetHSL(0, 0.04, -k);
  const light = (k: number) => kit.bodyColor.clone().lerp(new THREE.Color(0xffffff), k);
  const pink = toon(0xff8fb1);

  switch (species) {
    case 'cat': {
      // Orejas triangulares con interior rosa y mechón
      [-1, 1].forEach((side) => {
        const ear = new THREE.Group();
        ear.position.set(side * 0.5, 0.84, 0.02);
        ear.rotation.set(-0.08, 0, -side * 0.34);
        const shell = cone(0.31, 0.58, kit.bodyMat);
        shell.scale.z = 0.62;
        const inner = cone(0.19, 0.38, pink, 16, false);
        inner.scale.z = 0.4;
        inner.position.set(0, -0.06, 0.07);
        const tuft = cone(0.06, 0.16, toon(0xfff5ea), 8, false);
        tuft.position.set(-side * 0.02, -0.1, 0.11);
        tuft.rotation.z = side * 0.3;
        ear.add(shell, inner, tuft);
        body.add(ear);
        out.wobble.push({ obj: ear, base: -side * 0.38, amp: 0.06, speed: 2.4, phase: side, axis: 'z' });
      });
      // Rayas atigradas en la frente y las mejillas
      const stripeMat = toon(dark(0.12));
      const stripes = ballPatch(
        union(
          ellipseMask(0, 0.82, 0.045, 0.16),
          ellipseMask(-0.2, 0.78, 0.04, 0.12, -0.3),
          ellipseMask(0.2, 0.78, 0.04, 0.12, 0.3),
          ellipseMask(-1.2, 0.1, 0.2, 0.04, 0.1),
          ellipseMask(1.2, 0.1, 0.2, 0.04, -0.1)
        ),
        stripeMat,
        1.008
      );
      body.add(stripes);
      // Hocico: dos mofletes blancos, naricita triangular y bigotes
      const muzzleMat = toon(0xfffaf2);
      [-1, 1].forEach((side) => {
        const puff = ellipsoid(0.15, 0.11, 0.08, muzzleMat, 18, true, 0.02);
        stick(puff, onBall(side * 0.13, -0.06), -0.01);
        body.add(puff);
        [-0.06, 0.02, 0.1].forEach((dy, i) => {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.005, 0.42, 6), new THREE.MeshBasicMaterial({ color: 0x2a2540 }));
          w.rotation.z = Math.PI / 2 + side * (0.16 - i * 0.14);
          w.rotation.y = -side * 0.35;
          w.position.set(side * 0.42, -0.04 + dy * 0.6, 0.86);
          body.add(w);
        });
      });
      // Naricita triangular apuntando hacia abajo, plana sobre la cara
      const nose = cone(0.055, 0.07, pink, 3, false);
      nose.scale.set(1.3, 1, 0.5);
      stick(nose, onBall(0, 0.03), 0.02);
      nose.rotateZ(Math.PI);
      body.add(nose);
      const chest = ballPatch(ellipseMask(0, -0.5, 0.55, 0.32), muzzleMat, 1.01);
      out.bellyParts.push(chest);
      body.add(chest);
      out.mouthAnchor = onBall(0, -0.13);
      out.mouthAnchor.p.addScaledVector(out.mouthAnchor.n, 0.05);
      out.feetColor = 0xfff5ea;
      // Cola larga atigrada que se curva hacia arriba
      const tail = new THREE.Group();
      tail.position.set(0.15, -0.55, -0.82);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.25, 0.1, -0.25),
        new THREE.Vector3(0.4, 0.55, -0.3),
        new THREE.Vector3(0.28, 0.9, -0.12),
      ]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.09, 12, false), kit.bodyMat);
      const tubeOut = new THREE.Mesh(tube.geometry, OUTLINE_MAT);
      tubeOut.scale.setScalar(1.03);
      tube.add(tubeOut);
      tail.add(tube);
      [0.35, 0.6].forEach((u) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.03, 8, 16), stripeMat);
        ring.position.copy(curve.getPoint(u));
        ring.lookAt(ring.position.clone().add(curve.getTangent(u)));
        tail.add(ring);
      });
      const tip = ellipsoid(0.1, 0.1, 0.1, stripeMat, 12, true, 0.02);
      tip.position.copy(curve.getPoint(1));
      tail.add(tip);
      body.add(tail);
      out.tail = tail;
      return out;
    }
    case 'penguin': {
      // Frente blanco con forma de corazón (dos lóbulos sobre los ojos y la barriga)
      const white = toon(0xfbfbf7);
      const front = ballPatch(
        union(ellipseMask(-0.25, 0.2, 0.36, 0.36), ellipseMask(0.25, 0.2, 0.36, 0.36), ellipseMask(0, -0.35, 0.78, 0.62)),
        white,
        1.01
      );
      body.add(front);
      out.bellyParts.push(front);
      const beakMat = toon(0xffa52e);
      const beak = cone(0.1, 0.2, beakMat, 16);
      beak.scale.set(1.2, 1, 0.8);
      stick(beak, onBall(0, 0.03), 0.06);
      beak.rotateX(Math.PI / 2);
      body.add(beak);
      out.mouthAnchor = onBall(0, -0.12);
      out.mouthAnchor.p.addScaledVector(out.mouthAnchor.n, 0.01);
      out.feetColor = 0xffa52e;
      // Copetito en la coronilla
      const tuft = cone(0.06, 0.18, kit.bodyMat, 10);
      tuft.position.set(0.02, 0.98, 0.1);
      tuft.rotation.z = -0.4;
      body.add(tuft);
      out.wobble.push({ obj: tuft, base: -0.4, amp: 0.15, speed: 3, phase: 0, axis: 'z' });
      return out;
    }
    case 'frog': {
      // Ojos saltones: dos cúpulas encima de la cabeza con los ojos de calcomanía en el frente
      const anchors: Anchor[] = [];
      [-1, 1].forEach((side) => {
        const dome = ellipsoid(0.31, 0.29, 0.29, kit.bodyMat, 24, true, 0.03);
        dome.position.set(side * 0.4, 0.72, 0.3);
        body.add(dome);
        const n = new THREE.Vector3(side * 0.2, 0.15, 1).normalize();
        anchors.push({ p: dome.position.clone().add(new THREE.Vector3(n.x * 0.31, n.y * 0.29, n.z * 0.29)).addScaledVector(n, 0.04), n });
      });
      out.eyeAnchors = [anchors[0]!, anchors[1]!];
      out.eyeSize = 0.4;
      out.mouthSize = 0.42;
      out.mouthAnchor = onBall(0, 0.02);
      out.mouthAnchor.p.addScaledVector(out.mouthAnchor.n, 0.02);
      const belly = ballPatch(ellipseMask(0, -0.45, 0.72, 0.42), toon(light(0.55)), 1.01);
      body.add(belly);
      out.bellyParts.push(belly);
      // Pecas en la espalda
      const spots = ballPatch(
        union(ellipseMask(2.6, 0.4, 0.14, 0.14), ellipseMask(-2.5, 0.1, 0.11, 0.11), ellipseMask(3.0, -0.2, 0.1, 0.1)),
        toon(dark(0.16)),
        1.008
      );
      body.add(spots);
      out.feetColor = dark(0.12);
      return out;
    }
    case 'panda': {
      const black = toon(0x2b2b33);
      // Antifaz caído alrededor de los ojos
      const patches = ballPatch(
        union(ellipseMask(-0.27, 0.17, 0.17, 0.23, -0.55), ellipseMask(0.27, 0.17, 0.17, 0.23, 0.55)),
        black,
        1.01
      );
      body.add(patches);
      [-1, 1].forEach((side) => {
        const ear = ellipsoid(0.22, 0.22, 0.15, black, 18, true, 0.03);
        ear.position.set(side * 0.6, 0.78, 0.02);
        body.add(ear);
        out.wobble.push({ obj: ear, base: 0, amp: 0.05, speed: 2, phase: side, axis: 'z' });
      });
      const nose = ellipsoid(0.07, 0.05, 0.04, black, 12, false);
      stick(nose, onBall(0, 0.04), 0.01);
      body.add(nose);
      // Banda negra sobre los hombros (como los pandas de verdad)
      const band = ballPatch((a, e) => smooth(0.14, 0.04, Math.abs(e + 0.2)) * smooth(0.9, 1.3, Math.abs(a)), black, 1.008);
      body.add(band);
      out.mouthAnchor = onBall(0, -0.06);
      out.mouthAnchor.p.addScaledVector(out.mouthAnchor.n, 0.01);
      out.limbColor = 0x2b2b33;
      out.feetColor = 0x2b2b33;
      return out;
    }
    case 'chick': {
      const beakMat = toon(0xff9f1c);
      const upper = cone(0.09, 0.16, beakMat, 14);
      upper.scale.set(1.3, 1, 0.7);
      stick(upper, onBall(0, 0.04), 0.05);
      upper.rotateX(Math.PI / 2);
      body.add(upper);
      // Copete de tres plumitas que se mece
      [-1, 0, 1].forEach((i) => {
        const feather = ellipsoid(0.06, 0.17, 0.05, kit.bodyMat, 12, true, 0.02);
        feather.position.set(i * 0.07, 1.0, 0.05);
        feather.rotation.z = -i * 0.45;
        body.add(feather);
        out.wobble.push({ obj: feather, base: -i * 0.45, amp: 0.18, speed: 4, phase: i, axis: 'z' });
      });
      const belly = ballPatch(ellipseMask(0, -0.45, 0.6, 0.4), toon(light(0.45)), 1.01);
      body.add(belly);
      out.bellyParts.push(belly);
      out.mouthAnchor = onBall(0, -0.1);
      out.mouthAnchor.p.addScaledVector(out.mouthAnchor.n, 0.01);
      out.feetColor = 0xff9f1c;
      return out;
    }
    case 'hamster': {
      const cream = toon(0xfff6ea);
      // Hocico y barriga blancos de una pieza
      const front = ballPatch(union(ellipseMask(0, -0.08, 0.42, 0.24), ellipseMask(0, -0.55, 0.7, 0.42)), cream, 1.01);
      body.add(front);
      out.bellyParts.push(front);
      // Mofletes gorditos
      [-1, 1].forEach((side) => {
        const cheek = ellipsoid(0.24, 0.2, 0.18, cream, 20, true, 0.025);
        stick(cheek, onBall(side * 0.48, -0.08), -0.05);
        body.add(cheek);
        const ear = ellipsoid(0.17, 0.17, 0.08, kit.bodyMat, 16, true, 0.025);
        ear.position.set(side * 0.52, 0.78, 0.16);
        ear.rotation.set(-0.2, side * 0.3, 0);
        const inner = ellipsoid(0.1, 0.1, 0.04, pink, 12, false);
        inner.position.z = 0.05;
        ear.add(inner);
        body.add(ear);
        out.wobble.push({ obj: ear, base: 0, amp: 0.08, speed: 3, phase: side, axis: 'z' });
      });
      const nose = ellipsoid(0.05, 0.04, 0.03, pink, 10, false);
      stick(nose, onBall(0, 0.06), 0.02);
      body.add(nose);
      out.mouthAnchor = onBall(0, -0.06);
      out.mouthAnchor.p.addScaledVector(out.mouthAnchor.n, 0.02);
      return out;
    }
    case 'axolotl': {
      const gillMat = toon(kit.accent.clone().lerp(new THREE.Color(0xff4f8b), 0.5));
      // Tres branquias plumosas a cada lado de la cabeza
      [-1, 1].forEach((side) => {
        [0, 1, 2].forEach((i) => {
          const g = new THREE.Group();
          g.position.set(side * 0.8, 0.5 - i * 0.2, -0.05);
          g.rotation.z = -side * (0.9 - i * 0.45);
          const stem = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.28, 6, 10), gillMat);
          stem.position.y = 0.2;
          g.add(stem);
          for (let k = 0; k < 3; k++) {
            const fr = ellipsoid(0.05, 0.03, 0.03, gillMat, 8, false);
            fr.position.set(side * 0.05, 0.12 + k * 0.1, 0);
            g.add(fr);
          }
          body.add(g);
          out.wobble.push({ obj: g, base: g.rotation.z, amp: 0.12, speed: 3.2, phase: i + side, axis: 'z' });
        });
      });
      const belly = ballPatch(ellipseMask(0, -0.5, 0.7, 0.4), toon(light(0.5)), 1.01);
      body.add(belly);
      out.bellyParts.push(belly);
      out.mouthSize = 0.36;
      // Colita de aleta que se mueve
      const tail = new THREE.Group();
      tail.position.set(0, -0.35, -0.85);
      const fin = ellipsoid(0.07, 0.3, 0.42, kit.bodyMat, 18, true, 0.025);
      fin.position.set(0, 0.05, -0.3);
      fin.rotation.x = 0.4;
      tail.add(fin);
      body.add(tail);
      out.tail = tail;
      return out;
    }
    default:
      return null;
  }
}
