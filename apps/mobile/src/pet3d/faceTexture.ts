import * as THREE from 'three';
import type { PetConfig } from '../game/pet';

/**
 * Cara "de diseño gráfico" para personas (estilo Mii / Tomodachi): ojos, cejas, nariz de trazo,
 * boca y maquillaje se dibujan en 2D sobre una textura que envuelve el frente de la cabeza 3D.
 * Rasterizador propio (sin canvas del DOM) para que funcione igual en web, iOS y Android.
 */

export const FACE_TEX_W = 512;
export const FACE_TEX_H = 430;
/** Ventana angular de la cabeza que cubre la textura. */
export const FACE_PHI_SPAN = 2.2;
export const FACE_THETA_START = 0.22 * Math.PI;
export const FACE_THETA_SPAN = 0.56 * Math.PI;

/** Posición vertical (0 = frente, 1 = barbilla) de cada rasgo en la textura. */
export const FACE_LAYOUT = { brows: 0.355, eyes: 0.455, nose: 0.585, mouth: 0.69 };

type RGB = [number, number, number];
const hex = (c: string): RGB => {
  const n = parseInt(c.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const INK: RGB = [40, 30, 34];
const WHITE: RGB = [255, 255, 255];

class Raster {
  readonly data = new Uint8Array(FACE_TEX_W * FACE_TEX_H * 4);

  private blend(x: number, y: number, c: RGB, a: number) {
    if (a <= 0 || x < 0 || y < 0 || x >= FACE_TEX_W || y >= FACE_TEX_H) return;
    // fila invertida: la textura empieza abajo
    const i = ((FACE_TEX_H - 1 - y) * FACE_TEX_W + x) * 4;
    const da = this.data[i + 3]! / 255;
    const oa = a + da * (1 - a);
    if (oa <= 0) return;
    for (let k = 0; k < 3; k++) {
      this.data[i + k] = Math.round((c[k]! * a + this.data[i + k]! * da * (1 - a)) / oa);
    }
    this.data[i + 3] = Math.round(oa * 255);
  }

  /** Rellena con cobertura antialias según una distancia con signo (negativa = dentro). */
  fill(bbox: [number, number, number, number], sd: (x: number, y: number) => number, c: RGB, alpha = 1, soft = 0.7) {
    const [x0, y0, x1, y1] = bbox.map(Math.round) as [number, number, number, number];
    for (let y = Math.max(0, y0 - 2); y <= Math.min(FACE_TEX_H - 1, y1 + 2); y++) {
      for (let x = Math.max(0, x0 - 2); x <= Math.min(FACE_TEX_W - 1, x1 + 2); x++) {
        const d = sd(x + 0.5, y + 0.5);
        const cov = Math.max(0, Math.min(1, 0.5 - d / soft));
        if (cov > 0) this.blend(x, y, c, cov * alpha);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB, opts: { rot?: number; alpha?: number; soft?: number; clip?: (x: number, y: number) => boolean } = {}) {
    const rot = opts.rot ?? 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const r = Math.max(rx, ry) + 2;
    this.fill(
      [cx - r, cy - r, cx + r, cy + r],
      (x, y) => {
        if (opts.clip && !opts.clip(x, y)) return 99;
        const dx = x - cx;
        const dy = y - cy;
        const lx = dx * cos + dy * sin;
        const ly = -dx * sin + dy * cos;
        const k = Math.hypot(lx / rx, ly / ry);
        return (k - 1) * Math.min(rx, ry);
      },
      c,
      opts.alpha ?? 1,
      opts.soft ?? 0.7
    );
  }

  /** Trazo grueso con extremos redondos a lo largo de una polilínea. */
  stroke(pts: Array<[number, number]>, w: number, c: RGB, alpha = 1) {
    if (pts.length < 2) return;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const h = w / 2 + 2;
    this.fill(
      [Math.min(...xs) - h, Math.min(...ys) - h, Math.max(...xs) + h, Math.max(...ys) + h],
      (x, y) => {
        let best = Infinity;
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i]!;
          const [bx, by] = pts[i + 1]!;
          const vx = bx - ax;
          const vy = by - ay;
          const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1)));
          best = Math.min(best, Math.hypot(x - (ax + vx * t), y - (ay + vy * t)));
        }
        return best - w / 2;
      },
      c,
      alpha
    );
  }

  /** Polígono relleno (con borde antialias). */
  polygon(pts: Array<[number, number]>, c: RGB, alpha = 1) {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    this.fill(
      [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      (x, y) => {
        let inside = false;
        let best = Infinity;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i]!;
          const [xj, yj] = pts[j]!;
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
          const vx = xj - xi;
          const vy = yj - yi;
          const t = Math.max(0, Math.min(1, ((x - xi) * vx + (y - yi) * vy) / (vx * vx + vy * vy || 1)));
          best = Math.min(best, Math.hypot(x - (xi + vx * t), y - (yi + vy * t)));
        }
        return inside ? -best : best;
      },
      c,
      alpha
    );
  }
}

const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 14): Array<[number, number]> =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as [number, number];
  });

const rotPts = (pts: Array<[number, number]>, cx: number, cy: number, r: number) =>
  pts.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * Math.cos(r) - dy * Math.sin(r), cy + dx * Math.sin(r) + dy * Math.cos(r)] as [number, number];
  });

export type FaceEyes = 'open' | 'closed' | 'happy';
export type FaceMouth = 'normal' | 'open';

const tstep = (v?: number) => Math.max(-3, Math.min(3, Math.round(v ?? 0)));

/** Dibuja la cara completa en una textura. */
export function drawMiiFace(config: PetConfig, eyesState: FaceEyes = 'open', mouthState: FaceMouth = 'normal'): THREE.DataTexture {
  const R = new Raster();
  const t = config.tuning ?? {};
  const W = FACE_TEX_W;
  const H = FACE_TEX_H;
  const cx = W / 2;
  const skin = hex(config.bodyColor);
  const darkSkin: RGB = [skin[0] * 0.72, skin[1] * 0.6, skin[2] * 0.58];
  const hairC = hex(config.beardColor ?? config.hairColor ?? '#4A2E1B');
  const browC: RGB = [hairC[0] * 0.8, hairC[1] * 0.8, hairC[2] * 0.8];
  const iris = hex(config.eyeColor ?? '#5B3A1E');
  const lip = hex(config.lipColor ?? '#D9606E');

  // ---------------- Mejillas / maquillaje (debajo de todo) ----------------
  const cheekY = H * 0.56;
  const cheekX = 112;
  const blush = config.blushStyle ?? 'none';
  if (blush === 'pink' || blush === 'peach') {
    const c: RGB = blush === 'pink' ? [255, 140, 170] : [255, 170, 130];
    [-1, 1].forEach((s) => R.ellipse(cx + s * cheekX, cheekY, 30, 17, c, { alpha: 0.55, soft: 9 }));
  } else if (blush === 'freckles') {
    [-1, 1].forEach((s) =>
      [[0, 0], [14, -8], [-12, -6], [8, 9], [-6, 10]].forEach(([dx, dy]) => R.ellipse(cx + s * (cheekX + dx!), cheekY + dy!, 3, 3, [176, 110, 70], { alpha: 0.85 }))
    );
  } else if (blush === 'star') {
    [-1, 1].forEach((s) => {
      const x = cx + s * cheekX;
      const pts: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 7 : 16;
        return [x + Math.cos(a) * r, cheekY + Math.sin(a) * r];
      });
      R.polygon(pts, [244, 185, 66]);
    });
  } else if (blush === 'hearts') {
    [-1, 1].forEach((s) => {
      const x = cx + s * cheekX;
      R.ellipse(x - 6, cheekY - 3, 8, 8, [255, 77, 121]);
      R.ellipse(x + 6, cheekY - 3, 8, 8, [255, 77, 121]);
      R.polygon([[x - 14, cheekY], [x + 14, cheekY], [x, cheekY + 15]], [255, 77, 121]);
    });
  } else if (blush === 'stripes') {
    [-1, 1].forEach((s) => [0, 12].forEach((dy) => R.stroke([[cx + s * (cheekX - 18), cheekY - 6 + dy], [cx + s * (cheekX + 18), cheekY - 6 + dy]], 6, [255, 71, 105])));
  } else if (blush === 'whiskers') {
    [-1, 1].forEach((s) => [-8, 6].forEach((dy) => R.stroke([[cx + s * (cheekX - 10), cheekY + dy], [cx + s * (cheekX + 30), cheekY + dy * 1.6]], 3, INK)));
  } else if (blush === 'dimples') {
    [-1, 1].forEach((s) => R.stroke(arc(cx + s * 70, H * 0.66, 6, 6, 0.2, Math.PI - 0.2, 8), 3, darkSkin));
  } else if (blush === 'bandaid') {
    const pts = rotPts([[cx + 92, cheekY - 9], [cx + 140, cheekY - 9], [cx + 140, cheekY + 9], [cx + 92, cheekY + 9]], cx + 116, cheekY, -0.35);
    R.polygon(pts, [253, 230, 138]);
  }

  // ---------------- Ojos ----------------
  const eyeK = 1 + tstep(t.eyeSize) * 0.09;
  const eyeSY = 1 + tstep(t.eyeStretch) * 0.1;
  const eyeSX = 1 - tstep(t.eyeStretch) * 0.04;
  const eyeRot = tstep(t.eyeRotation) * 0.09;
  const eyeY = H * FACE_LAYOUT.eyes - tstep(t.eyeHeight) * 10;
  const eyeDX = 74 + tstep(t.eyeSpacing) * 7;
  const style = config.eyeStyle;

  const drawEye = (side: number) => {
    const ex = cx + side * eyeDX;
    const rot = -side * eyeRot;
    const rx = 34 * eyeK * eyeSX;
    const ry = 35 * eyeK * eyeSY;
    if (eyesState === 'closed' || style === 'sleepy') {
      R.stroke(rotPts(arc(ex, eyeY + 2, rx * 0.9, ry * 0.25, 0.15, Math.PI - 0.15), ex, eyeY, rot), 5, INK);
      return;
    }
    if (eyesState === 'happy' || style === 'happy' || (style === 'wink' && side === 1)) {
      R.stroke(rotPts(arc(ex, eyeY + 8, rx * 0.85, ry * 0.6, Math.PI + 0.25, Math.PI * 2 - 0.25), ex, eyeY, rot), 6, INK);
      return;
    }
    if (style === 'sparkle' || style === 'anime' || style === 'starry' || style === 'heart' || style === 'fierce') {
      const big = style === 'anime' ? 1.2 : 1;
      R.ellipse(ex, eyeY, rx * 0.75 * big, ry * 1.05 * big, INK, { rot });
      if (style === 'heart') {
        const hx = ex;
        const hy = eyeY + 2;
        R.ellipse(hx - 6, hy - 4, 7, 7, [255, 77, 121]);
        R.ellipse(hx + 6, hy - 4, 7, 7, [255, 77, 121]);
        R.polygon([[hx - 13, hy - 1], [hx + 13, hy - 1], [hx, hy + 13]], [255, 77, 121]);
      } else if (style === 'starry') {
        R.polygon(Array.from({ length: 10 }, (_, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const r = i % 2 ? 5 : 11;
          return [ex + Math.cos(a) * r, eyeY + 4 + Math.sin(a) * r] as [number, number];
        }), [244, 185, 66]);
      } else {
        R.ellipse(ex, eyeY + ry * 0.35, rx * 0.5 * big, ry * 0.42 * big, iris, { rot });
      }
      R.ellipse(ex - rx * 0.25, eyeY - ry * 0.4, rx * 0.26, ry * 0.26, WHITE);
      R.ellipse(ex + rx * 0.22, eyeY + ry * 0.35, rx * 0.12, ry * 0.12, WHITE);
      if (style === 'fierce') R.stroke(rotPts([[ex - rx, eyeY - ry * (side < 0 ? 1.1 : 0.7)], [ex + rx, eyeY - ry * (side < 0 ? 0.7 : 1.1)]], ex, eyeY, rot), 6, INK);
      return;
    }
    // Ojo "de persona": blanco, iris, pupila, brillo y línea de párpado
    const shape =
      style === 'almond' ? { sx: 1.18, sy: 0.72 }
      : style === 'narrow' ? { sx: 1.08, sy: 0.42 }
      : style === 'bright' ? { sx: 1.0, sy: 1.08 }
      : style === 'cool' ? { sx: 1.05, sy: 0.6 }
      : { sx: 1.0, sy: 0.92 };
    const erx = rx * shape.sx;
    const ery = ry * shape.sy;
    const erot = rot + (style === 'almond' ? -side * 0.1 : 0);
    const inside = (x: number, y: number) => {
      const dx = x - ex;
      const dy = y - eyeY;
      const lx = dx * Math.cos(erot) + dy * Math.sin(erot);
      const ly = -dx * Math.sin(erot) + dy * Math.cos(erot);
      return (lx / erx) ** 2 + (ly / ery) ** 2 <= 1.02;
    };
    R.ellipse(ex, eyeY, erx + 2.5, ery + 2.5, INK, { rot: erot });
    R.ellipse(ex, eyeY, erx, ery, WHITE, { rot: erot });
    const ir = (style === 'bright' ? 24 : 20.5) * eyeK;
    R.ellipse(ex, eyeY + 2, ir, ir * 1.08, iris, { clip: inside });
    R.ellipse(ex, eyeY + 2, ir * 0.5, ir * 0.55, INK, { clip: inside });
    R.ellipse(ex - ir * 0.38, eyeY - ir * 0.35, ir * 0.3, ir * 0.3, WHITE, { clip: inside });
    R.ellipse(ex + ir * 0.4, eyeY + ir * 0.45, ir * 0.14, ir * 0.14, WHITE, { clip: inside });
    // Párpado superior marcado (como los Mii)
    R.stroke(rotPts(arc(ex, eyeY, erx + 1, ery + 1, Math.PI + 0.25, Math.PI * 2 - 0.25), ex, eyeY, erot), 7, INK);
    if (style === 'lashes') {
      const outer = ex + side * erx;
      R.stroke([[outer - side * 4, eyeY - ery * 0.55], [outer + side * 8, eyeY - ery * 0.95]], 4, INK);
      R.stroke([[outer - side * 12, eyeY - ery * 0.9], [outer - side * 4, eyeY - ery * 1.3]], 4, INK);
    }
    if (style === 'droopy' || style === 'calm' || style === 'cool') {
      // Párpado del color de la piel cubriendo la parte de arriba
      const lidCut = style === 'calm' ? 0.15 : style === 'cool' ? 0.1 : 0.0;
      const lidPts: Array<[number, number]> = [
        ...arc(ex, eyeY, erx + 3, ery + 3, Math.PI, Math.PI * 2, 12),
        [ex + erx + 3, eyeY - ery * lidCut + (style === 'droopy' ? side * ery * 0.35 : 0)],
        [ex - erx - 3, eyeY - ery * lidCut - (style === 'droopy' ? side * ery * 0.35 : 0)],
      ];
      R.polygon(rotPts(lidPts, ex, eyeY, erot), skin);
      R.stroke(rotPts([lidPts[lidPts.length - 1]!, lidPts[lidPts.length - 2]!], ex, eyeY, erot), 5, INK);
    }
  };
  drawEye(-1);
  drawEye(1);

  // ---------------- Cejas ----------------
  const brow = config.browStyle ?? 'soft';
  if (brow !== 'none') {
    const bK = 1 + tstep(t.browSize) * 0.12;
    const bSX = 1 + tstep(t.browStretch) * 0.13;
    const bRot = tstep(t.browRotation) * 0.09;
    const bY = H * FACE_LAYOUT.brows - tstep(t.eyeHeight) * 10 - tstep(t.browHeight) * 9;
    const bDX = 72 + tstep(t.eyeSpacing) * 7 + tstep(t.browSpacing) * 7;
    const w = (brow === 'bold' || brow === 'unibrow' ? 14 : brow === 'short' ? 7 : 10) * bK;
    const half = (brow === 'short' ? 19 : 30) * bSX;
    [-1, 1].forEach((side) => {
      const bx = cx + side * bDX;
      if (brow === 'dot') {
        R.ellipse(bx, bY, 7 * bK, 6 * bK, browC);
        return;
      }
      const tilt =
        (brow === 'hero' ? 0.32 : brow === 'worried' ? -0.3 : brow === 'raised' ? -0.12 : 0) * side + side * bRot;
      const lift = brow === 'raised' ? -6 : 0;
      const pts = arc(bx, bY + 8 + lift, half, 10, Math.PI + 0.45, Math.PI * 2 - 0.45, 10);
      R.stroke(rotPts(pts, bx, bY, -tilt), w, browC);
      if (brow === 'slit' && side === 1) R.stroke([[bx + 2, bY - 8], [bx + 7, bY + 6]], 4, skin);
    });
    if (brow === 'unibrow') R.stroke([[cx - bDX + 20, bY + 2], [cx + bDX - 20, bY + 2]], w, browC);
  }

  // ---------------- Nariz (trazo) ----------------
  const nose = config.noseStyle ?? 'button';
  if (nose !== 'none') {
    const nK = 1.3 * (1 + tstep(t.noseSize) * 0.12);
    const nY = H * FACE_LAYOUT.nose - tstep(t.noseHeight) * 9;
    const S = (p: Array<[number, number]>) => p.map(([x, y]) => [cx + x * nK, nY + y * nK] as [number, number]);
    if (nose === 'button') R.stroke(arc(cx, nY, 9 * nK, 7 * nK, -0.2, Math.PI + 0.2, 10), 5.5, INK);
    else if (nose === 'round') R.stroke(arc(cx, nY - 2, 13 * nK, 10 * nK, 0.1, Math.PI - 0.1, 12), 5.5, INK);
    else if (nose === 'pointy') R.stroke(S([[-2, -22], [-10, 6], [6, 6]]), 5.5, INK);
    else if (nose === 'wide') {
      R.stroke(S([[-20, 0], [-14, 7], [-6, 5]]), 5.5, INK);
      R.stroke(S([[20, 0], [14, 7], [6, 5]]), 5.5, INK);
      R.stroke(S([[-6, 5], [0, 8], [6, 5]]), 4, INK);
    } else if (nose === 'snub') R.stroke(S([[-8, -2], [0, 6], [8, -2]]), 5.5, INK);
  }

  // ---------------- Boca ----------------
  const mK = 1 + tstep(t.mouthSize) * 0.1;
  const mSX = 1 + tstep(t.mouthStretch) * 0.12;
  const mY = H * FACE_LAYOUT.mouth - tstep(t.mouthHeight) * 9;
  const mw = 36 * mK * mSX;
  const mouth = config.mouthStyle ?? 'smile';
  const open = mouthState === 'open' || mouth === 'laugh';
  if (open) {
    const pts: Array<[number, number]> = [[cx - mw, mY - 3], ...arc(cx, mY - 3, mw, 22 * mK, 0, Math.PI, 14).reverse(), [cx + mw, mY - 3]];
    R.polygon(pts, [80, 24, 36]);
    R.polygon([[cx - mw * 0.85, mY - 3], [cx + mw * 0.85, mY - 3], [cx + mw * 0.75, mY + 3], [cx - mw * 0.75, mY + 3]], WHITE);
    R.ellipse(cx, mY + 13 * mK, mw * 0.5, 6 * mK, [255, 107, 139]);
    R.stroke([[cx - mw, mY - 3], [cx + mw, mY - 3]], 3, INK);
  } else if (mouth === 'lips') {
    const up: Array<[number, number]> = [[cx - mw, mY], [cx - mw * 0.45, mY - 8 * mK], [cx, mY - 4 * mK], [cx + mw * 0.45, mY - 8 * mK], [cx + mw, mY], [cx, mY + 1]];
    R.polygon(up, lip);
    R.ellipse(cx, mY + 5 * mK, mw * 0.78, 8 * mK, lip, { clip: (x, y) => y >= mY - 1 });
    R.stroke([[cx - mw, mY], [cx, mY + 1], [cx + mw, mY]], 2.5, [lip[0] * 0.6, lip[1] * 0.5, lip[2] * 0.5]);
  } else if (mouth === 'grin' || mouth === 'teeth') {
    const pts: Array<[number, number]> = [[cx - mw, mY - 4], ...arc(cx, mY - 4, mw, 16 * mK, 0, Math.PI, 14).reverse()];
    R.polygon(pts, INK);
    R.polygon([[cx - mw * 0.9, mY - 3], [cx + mw * 0.9, mY - 3], [cx + mw * 0.7, mY + 4], [cx - mw * 0.7, mY + 4]], WHITE);
  } else if (mouth === 'o') {
    R.ellipse(cx, mY, 9 * mK, 11 * mK, INK);
    R.ellipse(cx, mY + 2, 5 * mK, 6 * mK, [255, 107, 139]);
  } else if (mouth === 'line') {
    R.stroke([[cx - mw * 0.75, mY], [cx + mw * 0.75, mY]], 5.5, INK);
  } else if (mouth === 'small') {
    R.stroke(arc(cx, mY - 4, mw * 0.45, 7 * mK, 0.3, Math.PI - 0.3, 10), 5.5, INK);
  } else if (mouth === 'smirk') {
    R.stroke([[cx - mw * 0.8, mY + 2], [cx, mY + 4], [cx + mw * 0.8, mY - 6]], 5.5, INK);
  } else if (mouth === 'pout') {
    R.stroke(arc(cx, mY + 8, mw * 0.6, 8 * mK, Math.PI + 0.4, Math.PI * 2 - 0.4, 10), 5.5, INK);
  } else if (mouth === 'cat' || mouth === 'wavy') {
    R.stroke([...arc(cx - mw * 0.4, mY - 2, mw * 0.4, 7 * mK, Math.PI, 0, 8).reverse(), ...arc(cx + mw * 0.4, mY - 2, mw * 0.4, 7 * mK, Math.PI, 0, 8).reverse()], 5.5, INK);
  } else if (mouth === 'kiss') {
    R.stroke([[cx - 2, mY - 10], [cx + 7, mY - 4], [cx - 2, mY], [cx + 7, mY + 5], [cx - 2, mY + 10]], 4.5, lip);
  } else {
    // sonrisa clásica (+ lengua o colmillos)
    R.stroke(arc(cx, mY - 8, mw * 0.85, 13 * mK, 0.35, Math.PI - 0.35, 14), 5.5, INK);
    if (mouth === 'tongue') R.ellipse(cx + 5, mY + 8, 8, 7, [255, 107, 139]);
    if (mouth === 'fangs') [-1, 1].forEach((s) => R.polygon([[cx + s * 9, mY + 2], [cx + s * 15, mY + 2], [cx + s * 12, mY + 10]], WHITE));
  }

  // ---------------- Lunar ----------------
  if (config.mole) {
    R.ellipse(cx + 92 + tstep(t.moleX) * 14, H * 0.6 - tstep(t.moleY) * 14, 4.5, 4.5, [60, 40, 36]);
  }

  const tex = new THREE.DataTexture(R.data, W, H, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
