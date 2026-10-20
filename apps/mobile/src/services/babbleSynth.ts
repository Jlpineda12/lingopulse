/**
 * Síntesis del balbuceo (sin dependencias de React Native, para poder probarla aparte).
 * Ver babble.ts para la reproducción.
 */

export const BABBLE_SAMPLE_RATE = 22050;
const SR = BABBLE_SAMPLE_RATE;

/** Formantes (F1, F2) de cada vocal: dan el color "a/e/i/o/u" a cada sílaba. */
const VOWELS: Record<string, [number, number]> = {
  a: [800, 1250],
  e: [480, 1900],
  i: [320, 2350],
  o: [520, 900],
  u: [360, 760],
};
const VOWEL_OF: Record<string, string> = {
  b: 'a', c: 'e', d: 'i', f: 'e', g: 'i', h: 'a', j: 'e', k: 'a', l: 'e', m: 'u', n: 'e', p: 'i',
  q: 'u', r: 'a', s: 'e', t: 'i', v: 'i', w: 'u', x: 'e', y: 'a', z: 'e',
};
/** Consonantes que suenan con un soplo de ruido al inicio. */
const HISSY = new Set(['s', 'f', 'h', 'x', 'z', 'c', 'j']);

export interface BabbleOptions {
  /** Tono de la voz de la mascota (1 = normal). */
  pitch?: number;
  /** Velocidad (1 = normal). */
  rate?: number;
}

/** Hash simple para que cada frase suene siempre igual. */
function seeded(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h >>> 0) % 1000) / 1000;
  };
}

/** Genera las muestras (mono, 22 050 Hz) del balbuceo de una frase. */
export function synthesizeBabble(text: string, opts: BabbleOptions = {}): Float32Array {
  const pitch = Math.max(0.6, Math.min(1.6, opts.pitch ?? 1));
  const rate = Math.max(0.6, Math.min(1.8, opts.rate ?? 1));
  const rand = seeded(text);
  const clean = text.toLowerCase().replace(/[^a-z.,!?¡¿ ]/g, '').slice(0, 64);
  const question = /\?\s*$/.test(text);
  const excited = /!/.test(text);
  const blipSec = 0.058 / rate;
  const segments: Array<{ ch: string; f0: number; dur: number; vowel: [number, number] | null; hiss: boolean }> = [];
  const letters = clean.replace(/[^a-z]/g, '').length || 1;
  let k = 0;
  for (const ch of clean) {
    if (ch === ' ') {
      segments.push({ ch, f0: 0, dur: 0.035 / rate, vowel: null, hiss: false });
      continue;
    }
    if (/[.,!?¡¿]/.test(ch)) {
      segments.push({ ch, f0: 0, dur: (ch === ',' ? 0.08 : 0.14) / rate, vowel: null, hiss: false });
      continue;
    }
    k += 1;
    const v = VOWELS[ch] ?? VOWELS[VOWEL_OF[ch] ?? 'a']!;
    // Melodía: pequeñas variaciones por letra; las preguntas suben al final, el entusiasmo eleva todo.
    const tail = k / letters;
    const contour = question ? 1 + Math.max(0, tail - 0.7) * 0.6 : 1 - tail * 0.08;
    const f0 = 230 * pitch * contour * (excited ? 1.08 : 1) * (0.92 + rand() * 0.18);
    segments.push({ ch, f0, dur: blipSec * (0.85 + rand() * 0.3), vowel: v, hiss: HISSY.has(ch) });
  }
  const total = Math.ceil(segments.reduce((s, g) => s + g.dur, 0) * SR) + 200;
  const out = new Float32Array(total);
  let pos = 0;
  for (const g of segments) {
    const n = Math.floor(g.dur * SR);
    if (g.vowel) {
      const [f1, f2] = g.vowel;
      // Síntesis aditiva: armónicos de f0 pesados por la resonancia de los formantes.
      const harmonics: Array<[number, number]> = [];
      for (let h = 1; h <= 14; h++) {
        const f = g.f0 * h;
        if (f > SR / 2.2) break;
        const amp = Math.exp(-(((f - f1) / 160) ** 2)) + 0.7 * Math.exp(-(((f - f2) / 260) ** 2)) + 0.12 / h;
        harmonics.push([f, amp]);
      }
      const norm = harmonics.reduce((s, [, a]) => s + a, 0) || 1;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const attack = Math.min(1, t / 0.006);
        const decay = Math.exp(-t * 26 * Math.max(1, 0.05 / g.dur));
        // Ligera caída de tono dentro de la sílaba (le da el "cuac" cantarín)
        const bend = 1 + 0.06 * Math.exp(-t * 40);
        let v = 0;
        for (const [f, a] of harmonics) v += Math.sin(2 * Math.PI * f * bend * t) * a;
        let sample = (v / norm) * attack * decay;
        if (g.hiss && t < 0.018) sample += (Math.random() * 2 - 1) * 0.18 * (1 - t / 0.018);
        out[pos + i] = sample * 0.8;
      }
    }
    pos += n;
  }
  return out;
}

/** Empaqueta muestras en un WAV PCM de 16 bits. */
export function toWavBytes(samples: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SR, true);
  view.setUint32(28, SR * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i]!)) * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}

