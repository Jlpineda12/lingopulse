import * as THREE from 'three';

/**
 * Utilidades del estilo Toon / Cel-Shaded compartidas por la mascota y su casa:
 * rampa de luz de 4 escalones, material de contorno de tinta y primitivas con contorno.
 */

/** Rampa de iluminación cel-shaded de 4 escalones nítidos (estilo PS2 / Cairn / Wind Waker). */
export function createToonRamp(): THREE.DataTexture {
  const steps = new Uint8Array([
    105, 105, 120, 255,
    165, 168, 182, 255,
    222, 224, 232, 255,
    255, 255, 255, 255,
  ]);
  const tex = new THREE.DataTexture(steps, 4, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export const OUTLINE_MAT = new THREE.MeshBasicMaterial({
  color: 0x1e2436,
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
    out.scale.set(
      1 + outlineThickness / sx,
      1 + outlineThickness / sy,
      1 + outlineThickness / sz
    );
    m.add(out);
  }
  return m;
}


/** Agrega contorno de tinta (malla invertida un poco más grande) a cualquier malla. */
export function outlined<T extends THREE.Mesh>(mesh: T, thickness = 1.06): T {
  const out = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
  out.scale.setScalar(thickness);
  mesh.add(out);
  return mesh;
}

/** Caja toon con contorno. */
export function box(w: number, h: number, d: number, mat: THREE.Material, outline = 0.04): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  if (outline > 0) {
    const out = new THREE.Mesh(geo, OUTLINE_MAT);
    out.scale.set(1 + outline / w, 1 + outline / h, 1 + outline / d);
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
    out.scale.set(outline, 1 + (outline - 1) * 0.6, outline);
    m.add(out);
  }
  return m;
}
