import * as THREE from 'three';
import type { SceneNpc, UnitSceneTheme } from '../game/unitScenes';
import { box, cylinder, ellipsoid, OUTLINE_MAT, toon } from './toonKit';

/**
 * Decorados 3D de cada isla temática y personajes con los que interactúa la mascota.
 * Coordenadas: el suelo de la isla está en y = 0; la mascota ocupa el centro-izquierda
 * (x ≈ -0.45) y el personaje invitado se coloca a la derecha (x ≈ 1.15).
 */

export interface SceneProps {
  group: THREE.Group;
  animate: (t: number) => void;
}

const outlinedMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, k = 1.06) => {
  const m = new THREE.Mesh(geo, mat);
  const out = new THREE.Mesh(geo, OUTLINE_MAT);
  out.scale.setScalar(k);
  m.add(out);
  return m;
};

/* ------------------------------------------------------------------ */
/* Personajes invitados                                                */
/* ------------------------------------------------------------------ */

export function buildNpc(kind: Exclude<SceneNpc, null>, ramp: THREE.DataTexture): SceneProps {
  const g = new THREE.Group();
  const ink = new THREE.MeshBasicMaterial({ color: 0x1e2436 });
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
  let waveArm: THREE.Object3D | null = null;

  if (kind === 'robot') {
    const metal = toon(0xdbe4f0, ramp);
    const blue = toon(0x3b82f6, ramp);
    const head = box(0.52, 0.42, 0.42, metal, 0.03);
    head.position.y = 0.72;
    const screen = box(0.4, 0.26, 0.04, toon(0x1e2436, ramp), 0);
    screen.position.set(0, 0.72, 0.22);
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
      eye.position.set(side * 0.09, 0.74, 0.25);
      g.add(eye);
    });
    const antenna = cylinder(0.015, 0.015, 0.18, metal, 6, 0);
    antenna.position.y = 1.01;
    const bulb = ellipsoid(0.05, 0.05, 0.05, toon(0xff4769, ramp), 10, true, 0.015);
    bulb.position.y = 1.12;
    const bodyM = box(0.46, 0.4, 0.34, blue, 0.03);
    bodyM.position.y = 0.28;
    g.add(head, screen, antenna, bulb, bodyM);
    [-1, 1].forEach((side) => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.3, 0.42, 0);
      const a = cylinder(0.05, 0.05, 0.3, metal, 8);
      a.position.y = -0.14;
      arm.add(a);
      g.add(arm);
      if (side === -1) waveArm = arm;
      const leg = cylinder(0.06, 0.06, 0.16, metal, 8);
      leg.position.set(side * 0.12, 0.05, 0);
      g.add(leg);
    });
  } else {
    const small = kind === 'kid';
    const skin = toon(kind === 'vendor' ? 0xc68b59 : small ? 0xffdcc2 : 0xedb98a, ramp);
    const shirt = toon(kind === 'vendor' ? 0x16a34a : small ? 0xfacc15 : 0xff7a1a, ramp);
    const hair = toon(kind === 'vendor' ? 0x2b1d14 : small ? 0xe85d2a : 0x4a2e1b, ramp);
    const head = ellipsoid(0.3, 0.31, 0.28, skin, 22, true, 0.03);
    head.position.y = 0.72;
    const cap = ellipsoid(0.31, 0.15, 0.29, hair, 18, true, 0.025);
    cap.position.set(0, 0.86, -0.02);
    const torso = ellipsoid(0.2, 0.22, 0.17, shirt, 18, true, 0.025);
    torso.position.y = 0.3;
    const pants = ellipsoid(0.18, 0.08, 0.15, toon(0x3b4a6b, ramp), 14, true, 0.02);
    pants.position.y = 0.12;
    g.add(head, cap, torso, pants);
    [-1, 1].forEach((side) => {
      const eye = ellipsoid(0.032, 0.045, 0.02, ink, 10, false);
      eye.position.set(side * 0.1, 0.75, 0.27);
      const shine = ellipsoid(0.01, 0.012, 0.01, white, 6, false);
      shine.position.set(side * 0.1 - 0.01, 0.77, 0.29);
      const foot = ellipsoid(0.08, 0.05, 0.12, toon(0x1f2a44, ramp), 10, true, 0.015);
      foot.position.set(side * 0.08, 0.03, 0.03);
      g.add(eye, shine, foot);
      const arm = new THREE.Group();
      arm.position.set(side * 0.2, 0.42, 0);
      const sleeve = ellipsoid(0.06, 0.09, 0.06, shirt, 10, true, 0.015);
      sleeve.position.y = -0.06;
      const hand = ellipsoid(0.045, 0.05, 0.045, skin, 10, true, 0.012);
      hand.position.y = -0.2;
      arm.add(sleeve, hand);
      arm.rotation.z = side * 0.25;
      g.add(arm);
      if (side === -1) waveArm = arm;
    });
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 14, Math.PI), ink);
    smile.rotation.z = Math.PI;
    smile.position.set(0, 0.66, 0.28);
    g.add(smile);
    if (small) {
      [-1, 1].forEach((side) => {
        const tail = ellipsoid(0.07, 0.12, 0.07, hair, 10, true, 0.015);
        tail.position.set(side * 0.3, 0.78, -0.05);
        g.add(tail);
      });
      g.scale.setScalar(0.8);
    }
    if (kind === 'vendor') {
      const apron = ellipsoid(0.17, 0.17, 0.05, toon(0xffffff, ramp), 12, true, 0.012);
      apron.position.set(0, 0.25, 0.15);
      const hat = cylinder(0.2, 0.22, 0.1, toon(0xffffff, ramp), 16);
      hat.position.y = 0.95;
      g.add(apron, hat);
    }
  }

  return {
    group: g,
    animate: (t) => {
      g.position.y = Math.abs(Math.sin(t * 2.2)) * 0.03;
      if (waveArm) waveArm.rotation.z = -2.3 + Math.sin(t * 8) * 0.35;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Decorados                                                           */
/* ------------------------------------------------------------------ */

function house(ramp: THREE.DataTexture, wall: number, roof: number, s = 1): THREE.Group {
  const g = new THREE.Group();
  const walls = box(0.6, 0.48, 0.5, toon(wall, ramp), 0.03);
  walls.position.y = 0.24;
  const roofM = outlinedMesh(new THREE.ConeGeometry(0.5, 0.36, 4), toon(roof, ramp));
  roofM.rotation.y = Math.PI / 4;
  roofM.position.y = 0.66;
  const door = box(0.14, 0.24, 0.02, toon(0x8b5a2b, ramp), 0);
  door.position.set(0, 0.12, 0.26);
  const win = box(0.12, 0.12, 0.02, toon(0x9bd5ff, ramp), 0);
  win.position.set(0.18, 0.3, 0.26);
  g.add(walls, roofM, door, win);
  g.scale.setScalar(s);
  return g;
}

function tree(ramp: THREE.DataTexture, s = 1, leaf = 0x22b567): THREE.Group {
  const g = new THREE.Group();
  const trunk = cylinder(0.05, 0.07, 0.3, toon(0x8b5a2b, ramp), 8);
  trunk.position.y = 0.15;
  const crown = ellipsoid(0.24, 0.28, 0.24, toon(leaf, ramp), 14, true, 0.03);
  crown.position.y = 0.48;
  g.add(trunk, crown);
  g.scale.setScalar(s);
  return g;
}

function signpost(ramp: THREE.DataTexture, colors: number[]): THREE.Group {
  const g = new THREE.Group();
  const pole = cylinder(0.03, 0.03, 0.8, toon(0x8b5a2b, ramp), 8);
  pole.position.y = 0.4;
  g.add(pole);
  colors.forEach((c, i) => {
    const board = box(0.42, 0.1, 0.03, toon(c, ramp), 0.02);
    board.position.set(i % 2 ? -0.1 : 0.1, 0.68 - i * 0.15, 0.03);
    board.rotation.y = (i - 1) * 0.5;
    g.add(board);
  });
  return g;
}

export function buildUnitSceneProps(theme: UnitSceneTheme, ramp: THREE.DataTexture): SceneProps {
  const g = new THREE.Group();
  const spinners: Array<(t: number) => void> = [];
  const left = new THREE.Vector3(-1.45, 0, -0.35);
  const back = new THREE.Vector3(0.2, 0, -0.85);
  const place = (o: THREE.Object3D, p: THREE.Vector3, ry = 0) => {
    o.position.copy(p);
    o.rotation.y = ry;
    g.add(o);
    return o;
  };

  switch (theme) {
    case 'greet':
    case 'town': {
      place(signpost(ramp, [0xff7a1a, 0x2563eb, 0x22b567]), left, 0.4);
      if (theme === 'town') {
        place(house(ramp, 0xf8e3c4, 0xe63946, 0.9), back.clone().add(new THREE.Vector3(-0.5, 0, 0)), 0.3);
        const tower = box(0.36, 0.9, 0.36, toon(0x9bb4d6, ramp), 0.03);
        tower.position.y = 0.45;
        const t = new THREE.Group();
        t.add(tower);
        place(t, back.clone().add(new THREE.Vector3(0.6, 0, -0.1)));
      } else {
        place(tree(ramp, 1.1), back.clone().add(new THREE.Vector3(0.2, 0, 0)));
        const flowers = new THREE.Group();
        [0xff6b9d, 0xfacc15, 0xffffff].forEach((c, i) => {
          const f = ellipsoid(0.07, 0.07, 0.07, toon(c, ramp), 8, true, 0.015);
          f.position.set(i * 0.16, 0.08, (i % 2) * 0.1);
          flowers.add(f);
        });
        place(flowers, new THREE.Vector3(-1.2, 0, 0.55));
      }
      break;
    }
    case 'family':
    case 'home': {
      place(house(ramp, 0xfff1d6, 0xff7a1a, 1.25), new THREE.Vector3(-1.2, 0, -0.55), 0.35);
      place(tree(ramp, 0.9), new THREE.Vector3(1.4, 0, -0.7));
      break;
    }
    case 'routine': {
      const bed = new THREE.Group();
      const frame = box(0.8, 0.18, 0.5, toon(0x8b5a2b, ramp), 0.03);
      frame.position.y = 0.09;
      const mattress = box(0.76, 0.1, 0.46, toon(0x93c5fd, ramp), 0.02);
      mattress.position.y = 0.23;
      const pillow = ellipsoid(0.13, 0.06, 0.18, toon(0xffffff, ramp), 10, true, 0.015);
      pillow.position.set(-0.28, 0.32, 0);
      bed.add(frame, mattress, pillow);
      place(bed, left, 0.3);
      const clock = new THREE.Group();
      const face = outlinedMesh(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 20), toon(0xff4769, ramp));
      face.rotation.x = Math.PI / 2;
      face.position.y = 0.2;
      const dial = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      dial.position.set(0, 0.2, 0.035);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.09, 0.01), new THREE.MeshBasicMaterial({ color: 0x1e2436 }));
      hand.position.set(0, 0.2, 0.045);
      clock.add(face, dial, hand);
      place(clock, new THREE.Vector3(1.3, 0, -0.4));
      spinners.push((t) => {
        hand.rotation.z = -t * 2;
        clock.position.x = 1.3 + Math.sin(t * 30) * (Math.sin(t) > 0.7 ? 0.01 : 0);
      });
      break;
    }
    case 'cafe':
    case 'cook': {
      const table = new THREE.Group();
      const top = cylinder(0.42, 0.42, 0.05, toon(0xffffff, ramp), 24);
      top.position.y = 0.5;
      const leg = cylinder(0.04, 0.06, 0.48, toon(0x6b7280, ramp), 8);
      leg.position.y = 0.25;
      const cup = cylinder(0.08, 0.06, 0.12, toon(theme === 'cafe' ? 0xffffff : 0xe63946, ramp), 12);
      cup.position.set(0.1, 0.59, 0.05);
      const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0x6b3e1f }));
      coffee.rotation.x = -Math.PI / 2;
      coffee.position.set(0.1, 0.651, 0.05);
      table.add(top, leg, cup, coffee);
      if (theme === 'cook') {
        [0xff7a1a, 0x22b567, 0xe11d48].forEach((c, i) => {
          const veg = ellipsoid(0.07, 0.06, 0.07, toon(c, ramp), 8, true, 0.015);
          veg.position.set(-0.2 + i * 0.12, 0.57, -0.15);
          table.add(veg);
        });
      }
      place(table, left);
      const steam: THREE.Mesh[] = [];
      for (let i = 0; i < 3; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
        table.add(puff);
        steam.push(puff);
      }
      spinners.push((t) => {
        steam.forEach((p, i) => {
          const k = (t * 0.6 + i / 3) % 1;
          p.position.set(0.1 + Math.sin(t * 3 + i) * 0.03, 0.68 + k * 0.4, 0.05);
          (p.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - k);
          p.scale.setScalar(0.6 + k);
        });
      });
      if (theme === 'cafe') {
        const umbrella = new THREE.Group();
        const pole = cylinder(0.025, 0.025, 1.2, toon(0x6b7280, ramp), 8);
        pole.position.y = 0.6;
        const canopy = outlinedMesh(new THREE.ConeGeometry(0.62, 0.26, 8), toon(0xff4769, ramp));
        canopy.position.y = 1.25;
        umbrella.add(pole, canopy);
        place(umbrella, left.clone().add(new THREE.Vector3(0, 0, -0.1)));
      }
      break;
    }
    case 'market':
    case 'hotel': {
      const stall = new THREE.Group();
      const counter = box(1.0, 0.45, 0.4, toon(theme === 'hotel' ? 0x8b5a2b : 0xd9a85b, ramp), 0.03);
      counter.position.y = 0.23;
      stall.add(counter);
      if (theme === 'market') {
        [-0.5, 0.5].forEach((x) => {
          const pole = cylinder(0.025, 0.025, 1.1, toon(0x8b5a2b, ramp), 6);
          pole.position.set(x, 0.55, -0.15);
          stall.add(pole);
        });
        for (let i = 0; i < 5; i++) {
          const stripe = box(0.22, 0.04, 0.6, toon(i % 2 ? 0xffffff : 0xe63946, ramp), 0);
          stripe.position.set(-0.44 + i * 0.22, 1.1, 0.05);
          stripe.rotation.x = 0.25;
          stall.add(stripe);
        }
        [0xff7a1a, 0xe11d48, 0xfacc15, 0x22b567, 0xff7a1a].forEach((c, i) => {
          const fruit = ellipsoid(0.08, 0.08, 0.08, toon(c, ramp), 8, true, 0.015);
          fruit.position.set(-0.36 + i * 0.18, 0.52, 0.05);
          stall.add(fruit);
        });
      } else {
        const bell = new THREE.Group();
        const dome = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xf4c44e, ramp));
        bell.add(dome);
        bell.position.set(0.25, 0.46, 0.05);
        const key = box(0.16, 0.03, 0.06, toon(0xf4c44e, ramp), 0.01);
        key.position.set(-0.2, 0.47, 0.05);
        stall.add(bell, key);
      }
      place(stall, new THREE.Vector3(0.9, 0, -0.75), -0.2);
      break;
    }
    case 'weather': {
      const cloud = new THREE.Group();
      [[0, 0, 0.22], [0.2, 0.05, 0.18], [-0.2, 0.03, 0.17]].forEach(([x, y, r]) => {
        const c = ellipsoid(r!, r! * 0.8, r!, toon(0xffffff, ramp), 12, true, 0.02);
        c.position.set(x!, y!, 0);
        cloud.add(c);
      });
      place(cloud, new THREE.Vector3(-1.1, 1.5, -0.4));
      const sun = ellipsoid(0.22, 0.22, 0.22, toon(0xfacc15, ramp), 14, true, 0.03);
      place(sun, new THREE.Vector3(1.2, 1.7, -0.6));
      const umbrella = new THREE.Group();
      const pole = cylinder(0.02, 0.02, 0.7, toon(0x6b7280, ramp), 6);
      pole.position.y = 0.35;
      const canopy = outlinedMesh(new THREE.SphereGeometry(0.38, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x2563eb, ramp));
      canopy.position.y = 0.66;
      umbrella.add(pole, canopy);
      umbrella.rotation.z = -0.25;
      place(umbrella, new THREE.Vector3(1.2, 0, 0.1));
      spinners.push((t) => {
        cloud.position.x = -1.1 + Math.sin(t * 0.5) * 0.15;
        sun.rotation.z = t;
      });
      break;
    }
    case 'hobby':
    case 'party': {
      if (theme === 'party') {
        const cake = new THREE.Group();
        const layer1 = cylinder(0.3, 0.3, 0.2, toon(0xffb7ce, ramp), 20);
        layer1.position.y = 0.1;
        const layer2 = cylinder(0.2, 0.2, 0.16, toon(0xffffff, ramp), 20);
        layer2.position.y = 0.28;
        const candle = cylinder(0.02, 0.02, 0.12, toon(0x2563eb, ramp), 6, 0);
        candle.position.y = 0.42;
        const flame = ellipsoid(0.03, 0.05, 0.03, new THREE.MeshBasicMaterial({ color: 0xffb800 }), 8, false);
        flame.position.y = 0.51;
        cake.add(layer1, layer2, candle, flame);
        place(cake, new THREE.Vector3(-1.25, 0, 0.1));
      } else {
        const guitar = new THREE.Group();
        const bodyG = ellipsoid(0.2, 0.25, 0.07, toon(0xd97706, ramp), 14, true, 0.02);
        bodyG.position.y = 0.3;
        const neck = box(0.06, 0.5, 0.04, toon(0x7c4a27, ramp), 0.015);
        neck.position.y = 0.75;
        guitar.add(bodyG, neck);
        guitar.rotation.z = 0.25;
        place(guitar, new THREE.Vector3(-1.3, 0, -0.1), 0.4);
      }
      const floaters: THREE.Object3D[] = [];
      const colors = [0xff4769, 0x47c2ff, 0xfacc15, 0x7b5cff];
      for (let i = 0; i < 4; i++) {
        let o: THREE.Object3D;
        if (theme === 'party') {
          const balloon = new THREE.Group();
          const b = ellipsoid(0.13, 0.16, 0.13, toon(colors[i]!, ramp), 12, true, 0.02);
          const str = cylinder(0.005, 0.005, 0.5, toon(0xffffff, ramp), 4, 0);
          str.position.y = -0.4;
          balloon.add(b, str);
          o = balloon;
        } else {
          const note = new THREE.Group();
          const head = ellipsoid(0.06, 0.045, 0.03, toon(colors[i]!, ramp), 8, true, 0.012);
          const stem = box(0.015, 0.16, 0.015, toon(colors[i]!, ramp), 0);
          stem.position.set(0.05, 0.08, 0);
          note.add(head, stem);
          o = note;
        }
        g.add(o);
        floaters.push(o);
      }
      spinners.push((t) => {
        floaters.forEach((o, i) => {
          if (theme === 'party') {
            o.position.set(1.0 + (i % 2) * 0.35 + Math.sin(t + i) * 0.05, 1.3 + Math.sin(t * 1.3 + i) * 0.08 + (i > 1 ? 0.25 : 0), -0.5 + i * 0.1);
          } else {
            const k = (t * 0.25 + i / 4) % 1;
            o.position.set(-1.0 + k * 0.6, 0.7 + k * 1.1, -0.2 + Math.sin(t + i) * 0.2);
            o.scale.setScalar(Math.sin(k * Math.PI));
          }
        });
      });
      break;
    }
    case 'health': {
      const kit = box(0.42, 0.3, 0.22, toon(0xffffff, ramp), 0.03);
      kit.position.y = 0.15;
      const crossH = box(0.2, 0.06, 0.02, toon(0xe11d48, ramp), 0);
      crossH.position.set(0, 0.17, 0.12);
      const crossV = box(0.06, 0.2, 0.02, toon(0xe11d48, ramp), 0);
      crossV.position.set(0, 0.17, 0.12);
      const k = new THREE.Group();
      k.add(kit, crossH, crossV);
      place(k, new THREE.Vector3(-1.3, 0, 0.1), 0.4);
      const apple = ellipsoid(0.12, 0.11, 0.12, toon(0xe11d48, ramp), 12, true, 0.02);
      apple.position.y = 0.12;
      const a = new THREE.Group();
      a.add(apple);
      place(a, new THREE.Vector3(1.2, 0, 0.3));
      const mat = box(0.9, 0.03, 0.4, toon(0x7b5cff, ramp), 0.01);
      mat.position.y = 0.015;
      const m = new THREE.Group();
      m.add(mat);
      place(m, new THREE.Vector3(-0.35, 0, 0.1));
      break;
    }
    case 'memory': {
      const frame = new THREE.Group();
      const border = box(0.5, 0.4, 0.05, toon(0xd99b26, ramp), 0.02);
      const photo = box(0.4, 0.3, 0.02, toon(0x9bd5ff, ramp), 0);
      photo.position.z = 0.03;
      const sunP = ellipsoid(0.05, 0.05, 0.01, toon(0xfacc15, ramp), 8, false);
      sunP.position.set(0.1, 0.06, 0.045);
      frame.add(border, photo, sunP);
      frame.position.y = 0.6;
      const easel = cylinder(0.02, 0.02, 0.6, toon(0x8b5a2b, ramp), 6);
      easel.position.y = 0.3;
      const f = new THREE.Group();
      f.add(easel, frame);
      place(f, left, 0.35);
      const clock = new THREE.Group();
      const tower = box(0.28, 0.8, 0.24, toon(0x8b5a2b, ramp), 0.03);
      tower.position.y = 0.4;
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      face.position.set(0, 0.62, 0.125);
      clock.add(tower, face);
      place(clock, new THREE.Vector3(1.35, 0, -0.6));
      break;
    }
    case 'travel': {
      const suitcase = new THREE.Group();
      const caseM = box(0.4, 0.5, 0.2, toon(0xff7a1a, ramp), 0.03);
      caseM.position.y = 0.25;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 12, Math.PI), toon(0x1e2436, ramp));
      handle.position.y = 0.5;
      const sticker = ellipsoid(0.06, 0.06, 0.01, toon(0x47c2ff, ramp), 8, false);
      sticker.position.set(0.08, 0.3, 0.105);
      suitcase.add(caseM, handle, sticker);
      place(suitcase, new THREE.Vector3(0.95, 0, 0.25), -0.4);
      place(signpost(ramp, [0x2563eb, 0x22b567, 0xff4769]), left, 0.3);
      const plane = new THREE.Group();
      const fus = ellipsoid(0.24, 0.07, 0.07, toon(0xffffff, ramp), 12, true, 0.015);
      const wing = box(0.08, 0.02, 0.4, toon(0x47c2ff, ramp), 0.01);
      plane.add(fus, wing);
      g.add(plane);
      spinners.push((t) => {
        plane.position.set(Math.cos(t * 0.6) * 1.4, 1.8 + Math.sin(t * 1.2) * 0.08, Math.sin(t * 0.6) * 0.6 - 0.4);
        plane.rotation.y = -t * 0.6;
      });
      break;
    }
    case 'work': {
      const desk = new THREE.Group();
      const top = box(0.9, 0.05, 0.45, toon(0x8b5a2b, ramp), 0.02);
      top.position.y = 0.48;
      [-0.4, 0.4].forEach((x) => {
        const leg = box(0.05, 0.46, 0.05, toon(0x6b4423, ramp), 0);
        leg.position.set(x, 0.23, 0);
        desk.add(leg);
      });
      const screen = box(0.36, 0.24, 0.02, toon(0x1e2436, ramp), 0.015);
      screen.position.set(0, 0.64, -0.08);
      screen.rotation.x = -0.15;
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), new THREE.MeshBasicMaterial({ color: 0x47c2ff }));
      glow.position.set(0, 0.64, -0.065);
      glow.rotation.x = -0.15;
      desk.add(top, screen, glow);
      place(desk, new THREE.Vector3(0.4, 0, -0.95));
      const briefcase = box(0.36, 0.26, 0.12, toon(0x7c4a27, ramp), 0.025);
      briefcase.position.y = 0.13;
      const bc = new THREE.Group();
      bc.add(briefcase);
      place(bc, new THREE.Vector3(-1.35, 0, 0.2), 0.4);
      break;
    }
    case 'tech':
    case 'science': {
      if (theme === 'science') {
        const flask = new THREE.Group();
        const bulb = ellipsoid(0.16, 0.14, 0.16, new THREE.MeshBasicMaterial({ color: 0x86efac, transparent: true, opacity: 0.85 }), 14, true, 0.02);
        bulb.position.y = 0.14;
        const neck = cylinder(0.045, 0.045, 0.18, toon(0xe2e8f0, ramp), 10);
        neck.position.y = 0.34;
        flask.add(bulb, neck);
        place(flask, new THREE.Vector3(-1.3, 0, 0.15));
      } else {
        const laptop = new THREE.Group();
        const base = box(0.42, 0.03, 0.3, toon(0x9ca3af, ramp), 0.01);
        base.position.y = 0.32;
        const lid = box(0.42, 0.28, 0.02, toon(0x9ca3af, ramp), 0.01);
        lid.position.set(0, 0.46, -0.15);
        lid.rotation.x = -0.25;
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), new THREE.MeshBasicMaterial({ color: 0x47c2ff }));
        scr.position.set(0, 0.46, -0.137);
        scr.rotation.x = -0.25;
        const stand = cylinder(0.14, 0.18, 0.3, toon(0xffffff, ramp), 14);
        stand.position.y = 0.15;
        laptop.add(stand, base, lid, scr);
        place(laptop, left, 0.4);
      }
      const atom = new THREE.Group();
      const nucleus = ellipsoid(0.07, 0.07, 0.07, toon(0xff4769, ramp), 10, true, 0.015);
      atom.add(nucleus);
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 6, 30), toon(0x47c2ff, ramp));
        ring.rotation.set(i * 1.05, i * 0.6, 0);
        atom.add(ring);
      }
      place(atom, new THREE.Vector3(-1.0, 1.4, -0.4));
      spinners.push((t) => {
        atom.rotation.y = t * 1.2;
        atom.rotation.x = t * 0.5;
      });
      break;
    }
    case 'money': {
      const stack = (x: number, z: number, n: number) => {
        const s = new THREE.Group();
        for (let i = 0; i < n; i++) {
          const coin = cylinder(0.12, 0.12, 0.05, toon(0xf4c44e, ramp), 18);
          coin.position.y = 0.025 + i * 0.055;
          s.add(coin);
        }
        place(s, new THREE.Vector3(x, 0, z));
      };
      stack(-1.35, 0.2, 5);
      stack(-1.05, -0.2, 3);
      const pig = new THREE.Group();
      const pb = ellipsoid(0.26, 0.22, 0.32, toon(0xff9eb5, ramp), 16, true, 0.025);
      pb.position.y = 0.24;
      const snout = cylinder(0.08, 0.08, 0.06, toon(0xff7a9a, ramp), 12);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, 0.25, 0.33);
      pig.add(pb, snout);
      place(pig, new THREE.Vector3(1.25, 0, 0.0), -0.6);
      const floating = cylinder(0.1, 0.1, 0.03, toon(0xf4c44e, ramp), 18);
      floating.rotation.x = Math.PI / 2;
      g.add(floating);
      spinners.push((t) => {
        floating.position.set(1.25, 0.7 + Math.abs(Math.sin(t * 2)) * 0.25, 0.0);
        floating.rotation.y = t * 4;
      });
      break;
    }
    case 'nature': {
      place(tree(ramp, 1.2), new THREE.Vector3(-1.35, 0, -0.4));
      place(tree(ramp, 0.85, 0x16a34a), new THREE.Vector3(1.35, 0, -0.55));
      const bin = new THREE.Group();
      const can = cylinder(0.16, 0.13, 0.36, toon(0x22b567, ramp), 14);
      can.position.y = 0.18;
      const lid = cylinder(0.18, 0.18, 0.04, toon(0x168a4c, ramp), 14);
      lid.position.y = 0.38;
      bin.add(can, lid);
      place(bin, new THREE.Vector3(1.15, 0, 0.35));
      const sprout = new THREE.Group();
      const stem = cylinder(0.015, 0.015, 0.16, toon(0x16a34a, ramp), 6, 0);
      stem.position.y = 0.08;
      [-1, 1].forEach((side) => {
        const leaf = ellipsoid(0.06, 0.025, 0.035, toon(0x4ade80, ramp), 8, true, 0.01);
        leaf.position.set(side * 0.05, 0.17, 0);
        leaf.rotation.z = side * -0.5;
        sprout.add(leaf);
      });
      sprout.add(stem);
      place(sprout, new THREE.Vector3(-0.9, 0, 0.55));
      spinners.push((t) => sprout.scale.setScalar(0.9 + Math.sin(t * 2) * 0.1));
      break;
    }
    case 'mystery':
    case 'choices': {
      if (theme === 'mystery') {
        const orb = new THREE.Group();
        const stand = cylinder(0.12, 0.18, 0.2, toon(0x7c4a27, ramp), 12);
        stand.position.y = 0.1;
        const ball = ellipsoid(0.2, 0.2, 0.2, new THREE.MeshBasicMaterial({ color: 0xb18cff, transparent: true, opacity: 0.85 }), 18, true, 0.02);
        ball.position.y = 0.38;
        orb.add(stand, ball);
        place(orb, left);
        spinners.push((t) => ball.scale.setScalar(1 + Math.sin(t * 3) * 0.05));
      } else {
        place(signpost(ramp, [0x22b567, 0xff7a1a, 0x7b5cff]), new THREE.Vector3(1.2, 0, -0.3), -0.3);
      }
      const stars: THREE.Mesh[] = [];
      for (let i = 0; i < 4; i++) {
        const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), toon(0xfacc15, ramp));
        g.add(st);
        stars.push(st);
      }
      spinners.push((t) =>
        stars.forEach((st, i) => {
          const a = t * 0.8 + (i / 4) * Math.PI * 2;
          st.position.set(-0.45 + Math.cos(a) * 0.9, 1.6 + Math.sin(a * 2) * 0.1, Math.sin(a) * 0.4);
          st.rotation.y = t * 2;
        })
      );
      break;
    }
    case 'news':
    case 'books': {
      const pile = new THREE.Group();
      [0xe11d48, 0x2563eb, 0x22b567, 0xf4b942].forEach((c, i) => {
        const book = box(0.36 - i * 0.03, 0.08, 0.26, toon(c, ramp), 0.015);
        book.position.y = 0.04 + i * 0.085;
        book.rotation.y = (i % 2 ? 0.2 : -0.15);
        pile.add(book);
      });
      place(pile, left);
      if (theme === 'news') {
        const board = new THREE.Group();
        const panel = box(0.6, 0.45, 0.04, toon(0xffffff, ramp), 0.02);
        panel.position.y = 0.75;
        const headline = box(0.48, 0.06, 0.01, toon(0x1e2436, ramp), 0);
        headline.position.set(0, 0.88, 0.025);
        [0, 1, 2].forEach((i) => {
          const line = box(0.44, 0.025, 0.01, toon(0x94a0b8, ramp), 0);
          line.position.set(0, 0.76 - i * 0.07, 0.025);
          board.add(line);
        });
        const post = cylinder(0.03, 0.03, 0.55, toon(0x6b7280, ramp), 6);
        post.position.y = 0.27;
        board.add(panel, headline, post);
        place(board, new THREE.Vector3(1.2, 0, -0.5), -0.3);
      } else {
        const lamp = new THREE.Group();
        const pole = cylinder(0.02, 0.02, 0.9, toon(0x6b7280, ramp), 6);
        pole.position.y = 0.45;
        const shade = outlinedMesh(new THREE.ConeGeometry(0.2, 0.2, 14, 1, true), toon(0xfacc15, ramp));
        shade.position.y = 0.95;
        lamp.add(pole, shade);
        place(lamp, new THREE.Vector3(1.25, 0, -0.35));
      }
      break;
    }
    case 'justice':
    case 'speech': {
      const podium = new THREE.Group();
      const stand = box(0.5, 0.6, 0.3, toon(0x7c4a27, ramp), 0.03);
      stand.position.y = 0.3;
      const topP = box(0.56, 0.05, 0.36, toon(0x5c3a21, ramp), 0.015);
      topP.position.y = 0.62;
      const mic = cylinder(0.012, 0.012, 0.25, toon(0x1e2436, ramp), 6, 0);
      mic.position.set(0, 0.75, 0.05);
      mic.rotation.x = -0.4;
      const micHead = ellipsoid(0.04, 0.05, 0.04, toon(0x1e2436, ramp), 8, false);
      micHead.position.set(0, 0.87, 0.1);
      podium.add(stand, topP, mic, micHead);
      place(podium, new THREE.Vector3(1.15, 0, 0.0), -0.5);
      if (theme === 'justice') {
        const scales = new THREE.Group();
        const pillar = cylinder(0.025, 0.025, 0.7, toon(0xd99b26, ramp), 8);
        pillar.position.y = 0.35;
        const beam = box(0.6, 0.025, 0.025, toon(0xd99b26, ramp), 0);
        beam.position.y = 0.7;
        const pans: THREE.Object3D[] = [];
        [-1, 1].forEach((side) => {
          const pan = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(0xd99b26, ramp));
          pan.position.set(side * 0.28, 0.5, 0);
          scales.add(pan);
          pans.push(pan);
        });
        scales.add(pillar, beam);
        place(scales, left);
        spinners.push((t) => {
          const k = Math.sin(t * 1.5) * 0.04;
          pans[0]!.position.y = 0.5 + k;
          pans[1]!.position.y = 0.5 - k;
        });
      } else {
        const spot = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
        spot.position.set(-0.45, 0.9, 0);
        g.add(spot);
      }
      break;
    }
    default:
      break;
  }

  return {
    group: g,
    animate: (t) => spinners.forEach((fn) => fn(t)),
  };
}
