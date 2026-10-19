import * as THREE from 'three';

/**
 * Utilidades del estilo Toon / Cel-Shaded compartidas por la mascota y su casa:
 * rampa de luz de 4 escalones, material de contorno de tinta y primitivas con contorno.
 */

/**
 * Rampa de luz toon suave (16 pasos filtrados): sombras cálidas y degradado continuo,
 * combinada con el contorno de tinta. Es el look elegido para personajes, casa e isla.
 */
export function createToonRamp(): THREE.DataTexture {
  const n = 16;
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    // más recorrido de luz a sombra = más volumen (acabado de juguete mate)
    const k = Math.pow(i / (n - 1), 0.9);
    data[i * 4] = Math.round(146 + (255 - 146) * k);
    data[i * 4 + 1] = Math.round(136 + (255 - 136) * k);
    data[i * 4 + 2] = Math.round(172 + (255 - 172) * k);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/** Grosor relativo del contorno: fino, para un acabado de figura más limpio. */
export const OUTLINE_WEIGHT = 0.42;

export const OUTLINE_MAT = new THREE.MeshBasicMaterial({
  color: 0x2a2540,
  side: THREE.BackSide,
});

export function toon(
  color: THREE.ColorRepresentation,
  gradientMap: THREE.DataTexture
): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap,
  });
}

export function ellipsoid(
  sx: number,
  sy: number,
  sz: number,
  mat: THREE.Material,
  segments = 24,
  withOutline = true,
  outlineThickness = 0.042
) {
  const geom = new THREE.SphereGeometry(1, segments, Math.round(segments * 0.75));
  const m = new THREE.Mesh(geom, mat);
  m.scale.set(sx, sy, sz);
  if (withOutline) {
    const out = new THREE.Mesh(geom, OUTLINE_MAT);
    const ot = outlineThickness * OUTLINE_WEIGHT;
    out.scale.set(1 + ot / sx, 1 + ot / sy, 1 + ot / sz);
    m.add(out);
  }
  return m;
}


/** Agrega contorno de tinta (malla invertida un poco más grande) a cualquier malla. */
export function outlined<T extends THREE.Mesh>(mesh: T, thickness = 1.06): T {
  const out = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
  out.scale.setScalar(1 + (thickness - 1) * OUTLINE_WEIGHT);
  mesh.add(out);
  return mesh;
}

/** Caja toon con contorno. */
export function box(w: number, h: number, d: number, mat: THREE.Material, outline = 0.04): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  if (outline > 0) {
    const out = new THREE.Mesh(geo, OUTLINE_MAT);
    const ow = outline * OUTLINE_WEIGHT;
    out.scale.set(1 + ow / w, 1 + ow / h, 1 + ow / d);
    m.add(out);
  }
  return m;
}

/** Cilindro toon con contorno. */
export function cylinder(
  rt: number,
  rb: number,
  h: number,
  mat: THREE.Material,
  segments = 16,
  outline = 1.08
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rt, rb, h, segments);
  const m = new THREE.Mesh(geo, mat);
  if (outline > 0) {
    const out = new THREE.Mesh(geo, OUTLINE_MAT);
    const o = 1 + (outline - 1) * OUTLINE_WEIGHT;
    out.scale.set(o, 1 + (o - 1) * 0.6, o);
    m.add(out);
  }
  return m;
}
