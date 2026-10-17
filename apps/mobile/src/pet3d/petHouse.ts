import * as THREE from 'three';
import type { FurnitureSlot } from '../game/pet';
import { box, cylinder, ellipsoid, OUTLINE_MAT, toon } from './toonKit';

/**
 * Casa de la mascota en 3D (diorama en esquina, estilo Tomodachi Life / Animal Crossing,
 * con el sombreado toon de Cairn). Cada nivel cambia materiales y forma:
 *   1 Cabaña de troncos · 2 Casita pastel · 3 Barco pirata · 4 Castillo en las nubes.
 * Los muebles se colocan en espacios fijos para que la composición siempre se vea bien.
 */

export interface HouseSceneOptions {
  tier: number;
  placed: Partial<Record<FurnitureSlot, string>>;
}

export interface HouseDiorama {
  group: THREE.Group;
  animate: (t: number) => void;
}

const FLOOR_Y = -1.13;

interface TierLook {
  floor: number;
  wall: number;
  trim: number;
}

const LOOKS: Record<number, TierLook> = {
  1: { floor: 0xd9a066, wall: 0xb7743a, trim: 0x8b5a2b },
  2: { floor: 0xf3d9b1, wall: 0xbfe3ff, trim: 0xffffff },
  3: { floor: 0xc68b59, wall: 0x8b5a2b, trim: 0xf4c44e },
  4: { floor: 0xe8e2ff, wall: 0xf3f6fc, trim: 0xc9b5ff },
};

/** Posición base de cada espacio dentro del diorama (x, z) y rotación. */
const SLOT_POS: Record<FurnitureSlot, { x: number; z: number; ry: number; y?: number }> = {
  bed: { x: -1.75, z: -1.05, ry: 0.15 },
  floor: { x: 1.8, z: -1.0, ry: -0.35 },
  light: { x: 2.15, z: 0.75, ry: -0.6 },
  wall: { x: -0.45, z: -1.68, ry: 0, y: 0.95 },
  corner: { x: -2.15, z: 0.75, ry: 0.5 },
  special: { x: 1.0, z: -1.45, ry: -0.2 },
};

/** Posiciones sobre la isla del campamento (nivel 0). */
const ISLAND_SLOT_POS: Partial<Record<FurnitureSlot, { x: number; z: number; ry: number }>> = {
  floor: { x: 0, z: 0.12, ry: 0 },
  corner: { x: 0.95, z: -0.15, ry: -0.4 },
};

export function buildHouseDiorama(opts: HouseSceneOptions, ramp: THREE.DataTexture): HouseDiorama {
  const group = new THREE.Group();
  const look = LOOKS[opts.tier] ?? LOOKS[1]!;
  const floorMat = toon(look.floor, ramp);
  const wallMat = toon(look.wall, ramp);
  const trimMat = toon(look.trim, ramp);
  const animators: Array<(t: number) => void> = [];

  if (opts.tier === 3) {
    buildShip(group, floorMat, wallMat, trimMat, ramp, animators);
  } else {
    // Piso
    const floor = box(5.4, 0.28, 3.8, floorMat, 0.06);
    floor.position.set(0, FLOOR_Y - 0.14, -0.1);
    group.add(floor);
    // Tablones del piso
    for (let i = -2; i <= 2; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 3.7), new THREE.MeshBasicMaterial({ color: 0x1e2436, transparent: true, opacity: 0.12 }));
      plank.position.set(i * 1.05 + 0.5, FLOOR_Y + 0.005, -0.1);
      group.add(plank);
    }
    // Paredes (fondo e izquierda)
    const back = box(5.4, 3.3, 0.22, wallMat, 0.05);
    back.position.set(0, FLOOR_Y + 1.65, -1.9);
    const left = box(0.22, 3.3, 3.8, wallMat, 0.05);
    left.position.set(-2.6, FLOOR_Y + 1.65, -0.1);
    group.add(back, left);
    // Zócalo
    const baseBack = box(5.4, 0.18, 0.08, trimMat, 0.02);
    baseBack.position.set(0, FLOOR_Y + 0.09, -1.76);
    const baseLeft = box(0.08, 0.18, 3.8, trimMat, 0.02);
    baseLeft.position.set(-2.46, FLOOR_Y + 0.09, -0.1);
    group.add(baseBack, baseLeft);
    // Ventana
    const frame = box(1.15, 0.95, 0.1, trimMat, 0.03);
    frame.position.set(1.35, FLOOR_Y + 2.0, -1.76);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.75), new THREE.MeshBasicMaterial({ color: opts.tier === 4 ? 0xd7ccff : 0x9fe3ff }));
    pane.position.set(1.35, FLOOR_Y + 2.0, -1.7);
    const cross1 = box(0.05, 0.75, 0.04, trimMat, 0);
    cross1.position.set(1.35, FLOOR_Y + 2.0, -1.68);
    const cross2 = box(0.95, 0.05, 0.04, trimMat, 0);
    cross2.position.copy(cross1.position);
    group.add(frame, pane, cross1, cross2);
    // Nube que pasa por la ventana
    const cloud = ellipsoid(0.16, 0.08, 0.02, new THREE.MeshBasicMaterial({ color: 0xffffff }), 12, false);
    cloud.position.set(1.2, FLOOR_Y + 2.1, -1.69);
    group.add(cloud);
    animators.push((t) => {
      cloud.position.x = 1.0 + ((t * 0.08) % 0.7);
    });

    if (opts.tier === 1) {
      // Troncos horizontales en las paredes
      const logMat = toon(0x9a5b2a, ramp);
      for (let i = 0; i < 6; i++) {
        const y = FLOOR_Y + 0.35 + i * 0.5;
        const logB = cylinder(0.07, 0.07, 5.4, logMat, 10, 0);
        logB.rotation.z = Math.PI / 2;
        logB.position.set(0, y, -1.77);
        const logL = cylinder(0.07, 0.07, 3.8, logMat, 10, 0);
        logL.rotation.x = Math.PI / 2;
        logL.position.set(-2.47, y, -0.1);
        group.add(logB, logL);
      }
    } else if (opts.tier === 2) {
      // Friso pastel y cenefa
      const band = box(5.4, 0.9, 0.06, toon(0xffe9c7, ramp), 0);
      band.position.set(0, FLOOR_Y + 0.6, -1.77);
      const bandL = box(0.06, 0.9, 3.8, toon(0xffe9c7, ramp), 0);
      bandL.position.set(-2.47, FLOOR_Y + 0.6, -0.1);
      group.add(band, bandL);
    } else if (opts.tier === 4) {
      // Almenas y columnas de cristal + nubes debajo
      const crenelMat = toon(0xe2e8f4, ramp);
      for (let i = -5; i <= 5; i++) {
        const c = box(0.32, 0.32, 0.26, crenelMat, 0.03);
        c.position.set(i * 0.5, FLOOR_Y + 3.45, -1.9);
        group.add(c);
      }
      [-1.9, 1.9].forEach((x) => {
        const col = cylinder(0.16, 0.18, 3.0, trimMat, 16);
        col.position.set(x, FLOOR_Y + 1.5, -1.62);
        group.add(col);
      });
      const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const clouds: THREE.Mesh[] = [];
      for (let i = 0; i < 7; i++) {
        const c = ellipsoid(0.7 + (i % 3) * 0.2, 0.32, 0.55, cloudMat, 14, true, 0.03);
        c.position.set(-2.8 + i * 0.95, FLOOR_Y - 0.45, 0.9 - (i % 2) * 0.7);
        clouds.push(c);
        group.add(c);
      }
      animators.push((t) => clouds.forEach((c, i) => (c.position.y = FLOOR_Y - 0.45 + Math.sin(t * 0.8 + i) * 0.05)));
    }
  }

  // Muebles
  (Object.keys(opts.placed) as FurnitureSlot[]).forEach((slot) => {
    const id = opts.placed[slot];
    if (!id) return;
    const built = buildFurniture3D(id, ramp);
    if (!built) return;
    const pos = slotPosition(slot, id, opts.tier);
    built.group.position.set(pos.x, pos.y, pos.z);
    built.group.rotation.y = pos.ry;
    group.add(built.group);
    if (built.animate) animators.push(built.animate);
  });

  return { group, animate: (t) => animators.forEach((a) => a(t)) };
}

function slotPosition(slot: FurnitureSlot, id: string, tier: number) {
  if (slot === 'floor' && id === 'rug-round') return { x: 0, y: FLOOR_Y + 0.01, z: 0.15, ry: 0 };
  const p = SLOT_POS[slot];
  const y = p.y !== undefined ? FLOOR_Y + p.y + (tier === 3 ? 0.2 : 0) : FLOOR_Y;
  return { x: p.x, y, z: p.z + (slot === 'wall' && tier === 3 ? 0.1 : 0), ry: p.ry };
}

/** Muebles que se pueden poner sobre la isla del campamento (nivel 0). */
export function buildIslandFurniture(
  placed: Partial<Record<FurnitureSlot, string>>,
  ramp: THREE.DataTexture
): HouseDiorama {
  const group = new THREE.Group();
  const animators: Array<(t: number) => void> = [];
  (Object.keys(ISLAND_SLOT_POS) as FurnitureSlot[]).forEach((slot) => {
    const id = placed[slot];
    const pos = ISLAND_SLOT_POS[slot];
    if (!id || !pos) return;
    const built = buildFurniture3D(id, ramp);
    if (!built) return;
    const scale = id === 'rug-round' ? 0.55 : 0.6;
    built.group.scale.setScalar(scale);
    const sideFloor = slot === 'floor' && id !== 'rug-round';
    built.group.position.set(sideFloor ? -0.85 : pos.x, id === 'rug-round' ? 0.115 : 0.1, sideFloor ? -0.25 : pos.z);
    built.group.rotation.y = pos.ry;
    group.add(built.group);
    if (built.animate) animators.push(built.animate);
  });
  // Carpa de explorador detrás de la isla
  const tentMat = toon(0x22b567, ramp);
  const tent = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.62, 4), tentMat);
  const tentOut = new THREE.Mesh(tent.geometry, OUTLINE_MAT);
  tentOut.scale.setScalar(1.08);
  tent.add(tentOut);
  tent.rotation.y = Math.PI / 4;
  tent.position.set(0.62, 0.42, -0.62);
  const door = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 3), toon(0x178a4c, ramp));
  door.position.set(0.62, 0.32, -0.32);
  group.add(tent, door);
  return { group, animate: (t) => animators.forEach((a) => a(t)) };
}

function buildShip(
  group: THREE.Group,
  floorMat: THREE.Material,
  hullMat: THREE.Material,
  trimMat: THREE.Material,
  ramp: THREE.DataTexture,
  animators: Array<(t: number) => void>
) {
  // Mar
  const sea = new THREE.Mesh(new THREE.CircleGeometry(4.6, 40), new THREE.MeshBasicMaterial({ color: 0x4facfe }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, FLOOR_Y - 0.62, -0.2);
  group.add(sea);
  const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const foams: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const f = ellipsoid(0.32, 0.03, 0.08, foamMat, 10, false);
    f.position.set(-3 + i * 1.2, FLOOR_Y - 0.6, 1.5 - (i % 2) * 0.4);
    foams.push(f);
    group.add(f);
  }
  // Casco
  const hull = box(5.2, 0.6, 3.4, hullMat, 0.06);
  hull.position.set(0, FLOOR_Y - 0.3, -0.15);
  // Proa: cuña triangular extruida (vista desde arriba) pegada al casco.
  const prowShape = new THREE.Shape();
  prowShape.moveTo(0, -1.7);
  prowShape.lineTo(1.35, 0);
  prowShape.lineTo(0, 1.7);
  prowShape.closePath();
  const prowGeo = new THREE.ExtrudeGeometry(prowShape, { depth: 0.6, bevelEnabled: false });
  const bow = new THREE.Mesh(prowGeo, hullMat);
  bow.rotation.x = -Math.PI / 2;
  bow.position.set(2.6, FLOOR_Y - 0.6, -0.15);
  const bowOut = new THREE.Mesh(prowGeo, OUTLINE_MAT);
  bowOut.scale.setScalar(1.02);
  bow.add(bowOut);
  const prowDeck = new THREE.Mesh(new THREE.ExtrudeGeometry(prowShape, { depth: 0.12, bevelEnabled: false }), floorMat);
  prowDeck.rotation.x = -Math.PI / 2;
  prowDeck.scale.set(0.94, 0.94, 1);
  prowDeck.position.set(2.5, FLOOR_Y - 0.1, -0.15);
  group.add(prowDeck);
  const deck = box(5.0, 0.12, 3.2, floorMat, 0.03);
  deck.position.set(0, FLOOR_Y - 0.04, -0.15);
  group.add(hull, bow, deck);
  // Barandal
  const railMat = trimMat;
  [-1.65, 1.35].forEach((z) => {
    const rail = box(5.0, 0.07, 0.07, railMat, 0.02);
    rail.position.set(0, FLOOR_Y + 0.45, z);
    group.add(rail);
    for (let i = -6; i <= 6; i++) {
      const post = cylinder(0.035, 0.035, 0.45, toon(0x8b5a2b, ramp), 6, 0);
      post.position.set(i * 0.4, FLOOR_Y + 0.22, z);
      group.add(post);
    }
  });
  // Mástil y vela
  const mast = cylinder(0.09, 0.11, 4.0, toon(0x8b5a2b, ramp), 12);
  mast.position.set(-0.9, FLOOR_Y + 2.0, -1.45);
  const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.6, 8, 4), toon(0xf4f1ea, ramp));
  (sail.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
  sail.position.set(-0.9, FLOOR_Y + 2.4, -1.35);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), toon(0xe63946, ramp));
  (flag.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
  flag.position.set(-0.62, FLOOR_Y + 3.85, -1.45);
  group.add(mast, sail, flag);
  const sailPos = sail.geometry.attributes.position!;
  const base = Float32Array.from(sailPos.array as Float32Array);
  animators.push((t) => {
    for (let i = 0; i < sailPos.count; i++) {
      const x = base[i * 3]!;
      const y = base[i * 3 + 1]!;
      sailPos.setZ(i, Math.sin(t * 1.6 + x * 1.4) * 0.08 * (1 - Math.abs(y) / 1.6) + 0.15 * Math.cos(x * 0.8));
    }
    sailPos.needsUpdate = true;
    flag.rotation.y = Math.sin(t * 6) * 0.25;
    group.rotation.z = Math.sin(t * 0.9) * 0.012;
    foams.forEach((f, i) => (f.position.x = -3 + ((i * 1.2 + t * 0.35) % 7.2)));
  });
}

/* ------------------------------------------------------------------ */
/* Muebles 3D                                                          */
/* ------------------------------------------------------------------ */

export function buildFurniture3D(
  id: string,
  ramp: THREE.DataTexture
): { group: THREE.Group; animate?: (t: number) => void } | null {
  const g = new THREE.Group();
  const wood = toon(0xb7743a, ramp);
  const darkWood = toon(0x8b5a2b, ramp);
  const gold = toon(0xf4c44e, ramp);
  switch (id) {
    case 'rug-round': {
      const rug = cylinder(1.25, 1.25, 0.03, toon(0xff7aa2, ramp), 32, 1.02);
      const ring = cylinder(0.8, 0.8, 0.035, toon(0xffc94d, ramp), 32, 0);
      const center = cylinder(0.38, 0.38, 0.04, toon(0x4facfe, ramp), 24, 0);
      rug.scale.set(1, 1, 0.75);
      ring.scale.set(1, 1, 0.75);
      center.scale.set(1, 1, 0.75);
      g.add(rug, ring, center);
      return { group: g };
    }
    case 'plant-pot': {
      const pot = cylinder(0.24, 0.18, 0.36, toon(0xff8a5b, ramp), 16);
      pot.position.y = 0.18;
      g.add(pot);
      const leafMat = toon(0x22b567, ramp);
      for (let i = 0; i < 5; i++) {
        const leaf = ellipsoid(0.12, 0.34, 0.05, leafMat, 12, true, 0.02);
        const a = (i / 5) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 0.14, 0.6, Math.sin(a) * 0.14);
        leaf.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6);
        g.add(leaf);
      }
      return { group: g, animate: (t) => (g.rotation.z = Math.sin(t * 1.3) * 0.03) };
    }
    case 'barrel': {
      const b = cylinder(0.3, 0.3, 0.7, wood, 16);
      b.scale.set(1.05, 1, 1.05);
      b.position.y = 0.35;
      const hoopMat = toon(0x8f9bb3, ramp);
      [0.15, 0.55].forEach((y) => {
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.025, 6, 20), hoopMat);
        hoop.rotation.x = Math.PI / 2;
        hoop.position.y = y;
        g.add(hoop);
      });
      g.add(b);
      return { group: g };
    }
    case 'bed-cozy': {
      const frame = box(1.15, 0.3, 1.6, wood);
      frame.position.y = 0.2;
      const mattress = box(1.05, 0.18, 1.5, toon(0xffffff, ramp), 0.03);
      mattress.position.y = 0.42;
      const blanket = box(1.08, 0.12, 0.95, toon(0x4facfe, ramp), 0.03);
      blanket.position.set(0, 0.5, 0.25);
      const pillow = ellipsoid(0.36, 0.1, 0.2, toon(0xffe9c7, ramp), 14, true, 0.02);
      pillow.position.set(0, 0.56, -0.5);
      const head = box(1.15, 0.7, 0.12, darkWood);
      head.position.set(0, 0.45, -0.8);
      g.add(frame, mattress, blanket, pillow, head);
      return { group: g };
    }
    case 'hammock': {
      [-0.7, 0.7].forEach((x) => {
        const post = cylinder(0.05, 0.06, 1.3, darkWood, 8);
        post.position.set(x, 0.65, 0);
        g.add(post);
      });
      const net = ellipsoid(0.68, 0.14, 0.3, toon(0xffc94d, ramp), 16, true, 0.02);
      net.position.y = 0.55;
      g.add(net);
      return { group: g, animate: (t) => (net.rotation.x = Math.sin(t * 1.4) * 0.08) };
    }
    case 'lamp-star': {
      const base = cylinder(0.2, 0.24, 0.06, toon(0xaab6cc, ramp), 16);
      base.position.y = 0.03;
      const pole = cylinder(0.03, 0.03, 0.9, toon(0x8f9bb3, ramp), 8, 0);
      pole.position.y = 0.5;
      const shade = cylinder(0.14, 0.28, 0.3, toon(0xffe08a, ramp), 16);
      shade.position.y = 1.0;
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.25, depthWrite: false }));
      glow.position.y = 0.95;
      g.add(base, pole, shade, glow);
      return { group: g, animate: (t) => ((glow.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 2) * 0.06) };
    }
    case 'bookshelf': {
      const frame = box(0.9, 1.5, 0.35, wood);
      frame.position.y = 0.75;
      g.add(frame);
      const colors = [0xff4f81, 0x4facfe, 0x22b567, 0xffc94d, 0x7b5cff, 0xff7a1a];
      [0.45, 0.95].forEach((y, row) => {
        const shelf = box(0.86, 0.04, 0.33, darkWood, 0);
        shelf.position.set(0, y - 0.2, 0.02);
        g.add(shelf);
        for (let i = 0; i < 5; i++) {
          const h = 0.26 + ((i + row) % 3) * 0.05;
          const book = box(0.11, h, 0.24, toon(colors[(i + row * 2) % colors.length]!, ramp), 0.015);
          book.position.set(-0.3 + i * 0.14, y - 0.18 + h / 2, 0.06);
          g.add(book);
        }
      });
      return { group: g };
    }
    case 'desk': {
      const top = box(1.2, 0.08, 0.6, wood);
      top.position.y = 0.65;
      g.add(top);
      [[-0.52, -0.22], [0.52, -0.22], [-0.52, 0.22], [0.52, 0.22]].forEach(([x, z]) => {
        const leg = box(0.06, 0.62, 0.06, darkWood, 0.01);
        leg.position.set(x!, 0.31, z!);
        g.add(leg);
      });
      const screen = box(0.5, 0.34, 0.04, toon(0x2b3b5c, ramp));
      screen.position.set(0, 0.9, -0.12);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x7fd3ff });
      const display = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), glowMat);
      display.position.set(0, 0.9, -0.095);
      const book = box(0.22, 0.05, 0.16, toon(0xff4f81, ramp), 0.01);
      book.position.set(0.38, 0.72, 0.08);
      g.add(screen, display, book);
      return { group: g, animate: (t) => glowMat.color.setHSL(0.55, 0.9, 0.7 + Math.sin(t * 3) * 0.05) };
    }
    case 'sofa': {
      const seat = box(1.4, 0.32, 0.65, toon(0x9f85ff, ramp));
      seat.position.y = 0.32;
      const backrest = box(1.4, 0.55, 0.2, toon(0x7b5cff, ramp));
      backrest.position.set(0, 0.62, -0.25);
      const armL = box(0.2, 0.45, 0.65, toon(0x7b5cff, ramp));
      armL.position.set(-0.72, 0.4, 0);
      const armR = armL.clone();
      armR.position.x = 0.72;
      const cushion = ellipsoid(0.18, 0.15, 0.06, toon(0xffc94d, ramp), 12, true, 0.02);
      cushion.position.set(0.42, 0.62, -0.08);
      g.add(seat, backrest, armL, armR, cushion);
      return { group: g };
    }
    case 'poster':
    case 'world-map':
    case 'trophy': {
      if (id === 'trophy') {
        const shelf = box(1.2, 0.08, 0.3, wood);
        g.add(shelf);
        const cup = cylinder(0.12, 0.06, 0.22, gold, 14);
        cup.position.set(-0.25, 0.17, 0);
        const cup2 = cylinder(0.09, 0.05, 0.18, toon(0xaab6cc, ramp), 14);
        cup2.position.set(0.25, 0.14, 0);
        const medal = cylinder(0.1, 0.1, 0.03, gold, 16);
        medal.rotation.x = Math.PI / 2;
        medal.position.set(0.02, 0.15, 0);
        g.add(cup, cup2, medal);
        return { group: g };
      }
      const frame = box(1.1, 0.8, 0.05, id === 'poster' ? toon(0xffffff, ramp) : toon(0xffe9c7, ramp), 0.02);
      g.add(frame);
      if (id === 'poster') {
        const sky = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.62), new THREE.MeshBasicMaterial({ color: 0x4facfe }));
        sky.position.z = 0.03;
        const peak = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.38, 3), new THREE.MeshBasicMaterial({ color: 0x22b567 }));
        peak.position.set(-0.1, -0.12, 0.04);
        const snow = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 3), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        snow.position.set(-0.1, 0.01, 0.045);
        g.add(sky, peak, snow);
      } else {
        const route = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 6, 24, Math.PI * 1.2), new THREE.MeshBasicMaterial({ color: 0xff4f81 }));
        route.position.z = 0.03;
        const x1 = box(0.12, 0.02, 0.01, new THREE.MeshBasicMaterial({ color: 0xff3b30 }), 0);
        x1.rotation.z = Math.PI / 4;
        x1.position.set(0.28, 0.12, 0.035);
        const x2 = x1.clone();
        x2.rotation.z = -Math.PI / 4;
        g.add(route, x1, x2);
      }
      return { group: g };
    }
    case 'globe': {
      const stand = cylinder(0.18, 0.22, 0.06, darkWood, 16);
      stand.position.y = 0.03;
      const axis = cylinder(0.02, 0.02, 0.4, gold, 6, 0);
      axis.position.y = 0.25;
      const ball = ellipsoid(0.3, 0.3, 0.3, toon(0x4facfe, ramp), 20, true, 0.02);
      ball.position.y = 0.6;
      const land = ellipsoid(0.16, 0.12, 0.08, toon(0x22b567, ramp), 10, false);
      land.position.set(0.1, 0.05, 0.24);
      ball.add(land);
      g.add(stand, axis, ball);
      return { group: g, animate: (t) => (ball.rotation.y = t * 0.6) };
    }
    case 'aquarium': {
      const stand = box(0.9, 0.4, 0.45, darkWood);
      stand.position.y = 0.2;
      const tank = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.4), new THREE.MeshBasicMaterial({ color: 0x9fe3ff, transparent: true, opacity: 0.55 }));
      tank.position.y = 0.68;
      const fish = ellipsoid(0.08, 0.05, 0.03, toon(0xff8a3d, ramp), 10, true, 0.01);
      fish.position.set(0, 0.7, 0);
      const weed = cylinder(0.02, 0.02, 0.3, toon(0x22b567, ramp), 6, 0);
      weed.position.set(-0.28, 0.6, 0);
      g.add(stand, tank, fish, weed);
      return {
        group: g,
        animate: (t) => {
          fish.position.x = Math.sin(t * 0.9) * 0.28;
          fish.rotation.y = Math.cos(t * 0.9) > 0 ? 0 : Math.PI;
          fish.position.y = 0.7 + Math.sin(t * 2.3) * 0.06;
        },
      };
    }
    case 'ship-wheel': {
      const stand = box(0.18, 0.7, 0.18, darkWood, 0.02);
      stand.position.y = 0.35;
      const wheel = new THREE.Group();
      wheel.position.set(0, 0.85, 0.12);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 8, 24), wood);
      wheel.add(rim);
      for (let i = 0; i < 8; i++) {
        const spoke = box(0.04, 0.82, 0.04, wood, 0.01);
        spoke.rotation.z = (i / 8) * Math.PI;
        wheel.add(spoke);
      }
      const hub = cylinder(0.07, 0.07, 0.08, gold, 12);
      hub.rotation.x = Math.PI / 2;
      wheel.add(hub);
      g.add(stand, wheel);
      return { group: g, animate: (t) => (wheel.rotation.z = Math.sin(t * 0.7) * 0.6) };
    }
    case 'jolly-flag': {
      const pole = cylinder(0.035, 0.04, 1.8, darkWood, 8);
      pole.position.y = 0.9;
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5, 6, 2), toon(0x2b3b5c, ramp));
      (cloth.material as THREE.MeshToonMaterial).side = THREE.DoubleSide;
      cloth.position.set(0.42, 1.5, 0);
      const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.12, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
      emblem.position.set(0.42, 1.5, 0.01);
      g.add(pole, cloth, emblem);
      const pos = cloth.geometry.attributes.position!;
      const base = Float32Array.from(pos.array as Float32Array);
      return {
        group: g,
        animate: (t) => {
          for (let i = 0; i < pos.count; i++) {
            const x = base[i * 3]!;
            pos.setZ(i, Math.sin(t * 5 + x * 6) * 0.05 * (x + 0.4));
          }
          pos.needsUpdate = true;
        },
      };
    }
    case 'treasure': {
      const chest = box(0.7, 0.4, 0.45, wood);
      chest.position.y = 0.2;
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.7, 16, 1, false, 0, Math.PI), wood);
      lid.rotation.z = Math.PI / 2;
      lid.position.set(0, 0.4, 0);
      const band = box(0.72, 0.06, 0.47, gold, 0.01);
      band.position.y = 0.38;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: 0x4fd1ff }));
      gem.position.set(0, 0.68, 0);
      g.add(chest, lid, band, gem);
      return { group: g, animate: (t) => { gem.rotation.y = t * 1.5; gem.position.y = 0.7 + Math.sin(t * 2) * 0.05; } };
    }
    case 'event-parrot': {
      const perch = cylinder(0.04, 0.05, 1.0, darkWood, 8);
      perch.position.y = 0.5;
      const bar = cylinder(0.03, 0.03, 0.5, wood, 8, 0);
      bar.rotation.z = Math.PI / 2;
      bar.position.y = 1.0;
      const base = cylinder(0.22, 0.26, 0.06, darkWood, 16);
      base.position.y = 0.03;
      const bird = new THREE.Group();
      bird.position.set(0, 1.18, 0);
      const bodyB = ellipsoid(0.13, 0.18, 0.12, toon(0x22b567, ramp), 14, true, 0.02);
      const head = ellipsoid(0.1, 0.1, 0.1, toon(0xff4f5e, ramp), 12, true, 0.02);
      head.position.set(0, 0.2, 0.02);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 8), toon(0xffc94d, ramp));
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.19, 0.12);
      const eye = ellipsoid(0.018, 0.018, 0.01, new THREE.MeshBasicMaterial({ color: 0x1e2436 }), 8, false);
      eye.position.set(0.05, 0.23, 0.08);
      const tail = ellipsoid(0.05, 0.16, 0.03, toon(0x4facfe, ramp), 10, true, 0.015);
      tail.position.set(0, -0.2, -0.06);
      tail.rotation.x = 0.4;
      bird.add(bodyB, head, beak, eye, tail);
      g.add(perch, bar, base, bird);
      return { group: g, animate: (t) => { head.rotation.z = Math.sin(t * 2.2) * 0.25; bird.position.y = 1.18 + Math.abs(Math.sin(t * 1.5)) * 0.02; } };
    }
    case 'event-arcade': {
      const cab = box(0.6, 1.3, 0.5, toon(0x7b5cff, ramp));
      cab.position.y = 0.65;
      const screenMat = new THREE.MeshBasicMaterial({ color: 0x4fd1ff });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.34), screenMat);
      screen.position.set(0, 0.95, 0.26);
      const panel = box(0.6, 0.08, 0.3, toon(0x2b3b5c, ramp), 0.02);
      panel.position.set(0, 0.62, 0.32);
      panel.rotation.x = -0.3;
      const stick = ellipsoid(0.04, 0.04, 0.04, toon(0xff4f5e, ramp), 8, true, 0.01);
      stick.position.set(-0.12, 0.7, 0.36);
      const btnA = ellipsoid(0.03, 0.02, 0.03, toon(0xffc94d, ramp), 8, false);
      btnA.position.set(0.1, 0.67, 0.36);
      g.add(cab, screen, panel, stick, btnA);
      return { group: g, animate: (t) => screenMat.color.setHSL((t * 0.15) % 1, 0.8, 0.6) };
    }
    case 'event-lantern': {
      const pole = cylinder(0.03, 0.03, 1.4, darkWood, 8);
      pole.position.y = 0.7;
      const arm = cylinder(0.02, 0.02, 0.4, darkWood, 6, 0);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(0.2, 1.38, 0);
      const lantern = new THREE.Group();
      lantern.position.set(0.38, 1.16, 0);
      const paper = ellipsoid(0.17, 0.2, 0.17, toon(0xff4f5e, ramp), 16, true, 0.02);
      const capTop = cylinder(0.08, 0.08, 0.04, gold, 10, 0);
      capTop.position.y = 0.2;
      const capBot = capTop.clone();
      capBot.position.y = -0.2;
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd6a0, transparent: true, opacity: 0.25, depthWrite: false }));
      lantern.add(paper, capTop, capBot, glow);
      g.add(pole, arm, lantern);
      return { group: g, animate: (t) => { lantern.rotation.z = Math.sin(t * 1.3) * 0.12; (glow.material as THREE.MeshBasicMaterial).opacity = 0.2 + Math.sin(t * 3) * 0.06; } };
    }
    case 'event-suitcase': {
      const caseBox = box(0.55, 0.42, 0.24, toon(0xff8a3d, ramp));
      caseBox.position.y = 0.21;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.018, 6, 16, Math.PI), darkWood);
      handle.position.set(0, 0.44, 0);
      const stickerA = cylinder(0.06, 0.06, 0.01, toon(0x4facfe, ramp), 12, 0);
      stickerA.rotation.x = Math.PI / 2;
      stickerA.position.set(-0.12, 0.25, 0.125);
      const stickerB = box(0.12, 0.08, 0.01, toon(0xffffff, ramp), 0);
      stickerB.position.set(0.13, 0.15, 0.125);
      const strap = box(0.04, 0.43, 0.25, toon(0x8b5a2b, ramp), 0);
      strap.position.set(0.05, 0.21, 0);
      g.add(caseBox, handle, stickerA, stickerB, strap);
      return { group: g };
    }
    case 'royal-crown': {
      const seat = box(0.8, 0.5, 0.7, toon(0x7b5cff, ramp));
      seat.position.y = 0.25;
      const back = box(0.8, 1.1, 0.14, gold);
      back.position.set(0, 0.8, -0.3);
      const cushion = box(0.7, 0.1, 0.6, toon(0xff4f81, ramp), 0.02);
      cushion.position.y = 0.55;
      g.add(seat, back, cushion);
      for (let i = -1; i <= 1; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), gold);
        spike.position.set(i * 0.28, 1.45, -0.3);
        g.add(spike);
      }
      return { group: g };
    }
    default:
      return null;
  }
}
