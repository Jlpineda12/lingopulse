import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Convierte cualquier grabación (m4a del iPhone, 3gp/aac de Android, webm del navegador)
 * a WAV PCM 16 kHz mono 16 bits, el formato que piden Azure y que Gemini entiende siempre.
 * Requiere ffmpeg instalado (Mac: `brew install ffmpeg`; en Docker viene en la imagen).
 * Se usan archivos temporales porque el m4a del iPhone guarda su índice al final y
 * no se puede leer en streaming.
 */

export const WAV_SAMPLE_RATE = 16000;
const BYTES_PER_SECOND = WAV_SAMPLE_RATE * 2;
const WAV_HEADER_BYTES = 44;

function ffmpegPath(): string {
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

const EXTENSIONS: Record<string, string> = {
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/3gpp': '3gp',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
};

export async function toWav16k(audio: Buffer, mimeType: string): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), 'lingopulse-audio-'));
  const input = join(dir, `in.${EXTENSIONS[mimeType.split(';')[0]!.trim()] ?? 'bin'}`);
  const output = join(dir, 'out.wav');
  try {
    await writeFile(input, audio);
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath(), [
        '-hide_banner',
        '-loglevel',
        'error',
        '-y',
        '-i',
        input,
        '-ac',
        '1',
        '-ar',
        String(WAV_SAMPLE_RATE),
        '-sample_fmt',
        's16',
        '-map_metadata',
        '-1',
        '-fflags',
        '+bitexact',
        output,
      ]);
      let stderr = '';
      proc.stderr.on('data', (d) => (stderr += String(d)));
      proc.on('error', (err) => reject(new Error(`ffmpeg no disponible: ${err.message}`)));
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${stderr.slice(0, 300)}`))));
    });
    return await readFile(output);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Datos PCM de un WAV (ffmpeg puede añadir bloques de metadatos antes de "data"). */
function pcmOf(wav: Buffer): Buffer {
  let pos = 12;
  while (pos + 8 <= wav.length) {
    const id = wav.toString('ascii', pos, pos + 4);
    const size = wav.readUInt32LE(pos + 4);
    if (id === 'data') return wav.subarray(pos + 8, Math.min(wav.length, pos + 8 + size));
    pos += 8 + size + (size % 2);
  }
  return wav.subarray(WAV_HEADER_BYTES);
}

export function wavDurationSec(wav: Buffer): number {
  return pcmOf(wav).length / BYTES_PER_SECOND;
}

/** Cabecera WAV estándar para un trozo de PCM 16 kHz mono 16 bits. */
function wavHeader(dataBytes: number): Buffer {
  const h = Buffer.alloc(WAV_HEADER_BYTES);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + dataBytes, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(WAV_SAMPLE_RATE, 24);
  h.writeUInt32LE(BYTES_PER_SECOND, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(dataBytes, 40);
  return h;
}

/**
 * Parte un WAV en trozos de como máximo `maxSec` segundos (el servicio rápido de Azure
 * acepta hasta 60 s por petición). Busca cortar en el instante más silencioso cerca del límite
 * para no partir palabras.
 */
export function splitWav(wav: Buffer, maxSec = 50): Buffer[] {
  const pcm = pcmOf(wav);
  const maxBytes = maxSec * BYTES_PER_SECOND;
  if (pcm.length <= maxBytes) return [wav];
  const chunks: Buffer[] = [];
  let start = 0;
  while (start < pcm.length) {
    let end = Math.min(pcm.length, start + maxBytes);
    if (end < pcm.length) {
      // Busca el bloque de 50 ms más silencioso en los últimos 6 s del trozo.
      const win = BYTES_PER_SECOND / 20;
      let best = end;
      let bestEnergy = Infinity;
      for (let pos = end - 6 * BYTES_PER_SECOND; pos < end - win; pos += win) {
        if (pos <= start) continue;
        let energy = 0;
        for (let i = pos; i < pos + win; i += 2) energy += Math.abs(pcm.readInt16LE(i));
        if (energy < bestEnergy) {
          bestEnergy = energy;
          best = pos + win / 2;
        }
      }
      end = best - (best % 2);
    }
    const data = pcm.subarray(start, end);
    chunks.push(Buffer.concat([wavHeader(data.length), data]));
    start = end;
  }
  return chunks;
}

export interface AudioLevels {
  durationSec: number;
  /** Pico en dBFS (0 = máximo; < -45 prácticamente silencio). */
  peakDb: number;
  /** Volumen medio (RMS) en dBFS. */
  rmsDb: number;
  /** Segundos con voz probable (bloques de 50 ms por encima del umbral). */
  voicedSec: number;
}

const toDb = (v: number) => (v <= 0 ? -120 : 20 * Math.log10(v));

/** Mide volumen y tiempo con voz de un WAV 16 kHz mono 16 bits (rápido, sin ffmpeg). */
export function analyzeLevels(wav: Buffer): AudioLevels {
  const pcm = pcmOf(wav);
  const samples = Math.floor(pcm.length / 2);
  let peak = 0;
  let sumSq = 0;
  const block = WAV_SAMPLE_RATE / 20; // 50 ms
  let voicedBlocks = 0;
  let blockSq = 0;
  let inBlock = 0;
  for (let i = 0; i < samples; i++) {
    const v = pcm.readInt16LE(i * 2) / 32768;
    const a = Math.abs(v);
    if (a > peak) peak = a;
    sumSq += v * v;
    blockSq += v * v;
    if (++inBlock === block) {
      if (toDb(Math.sqrt(blockSq / block)) > -42) voicedBlocks++;
      blockSq = 0;
      inBlock = 0;
    }
  }
  return {
    durationSec: samples / WAV_SAMPLE_RATE,
    peakDb: Math.round(toDb(peak) * 10) / 10,
    rmsDb: Math.round(toDb(Math.sqrt(sumSq / Math.max(1, samples))) * 10) / 10,
    voicedSec: Math.round(voicedBlocks * 0.05 * 10) / 10,
  };
}

/** ¿La grabación tiene voz suficiente para analizarla? (evita que la IA invente texto con audio vacío) */
export function hasUsableSpeech(levels: AudioLevels): boolean {
  return levels.peakDb > -40 && levels.voicedSec >= 0.5;
}

/**
 * Divide un WAV en frases usando las pausas (para el servicio rápido de Azure, que solo reconoce
 * la PRIMERA frase de cada petición). Corta en silencios ≥ minSilenceMs, une trozos muy cortos y
 * parte los que superan maxSegmentSec. Cada trozo lleva un pequeño margen para no comerse sílabas.
 */
export function splitBySilence(
  wav: Buffer,
  { minSilenceMs = 450, maxSegmentSec = 25, minSegmentSec = 1.2, marginMs = 150 } = {}
): Array<{ wav: Buffer; startSec: number }> {
  const pcm = pcmOf(wav);
  const samples = Math.floor(pcm.length / 2);
  const frame = WAV_SAMPLE_RATE / 50; // 20 ms
  const frames = Math.floor(samples / frame);
  if (frames < 10) return [{ wav, startSec: 0 }];
  const db: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sq = 0;
    for (let i = f * frame; i < (f + 1) * frame; i++) {
      const v = pcm.readInt16LE(i * 2) / 32768;
      sq += v * v;
    }
    db.push(toDb(Math.sqrt(sq / frame)));
  }
  // Umbral adaptativo: ruido de fondo (percentil 10) + 12 dB, nunca por debajo de -50 dB.
  const sorted = [...db].sort((a, b) => a - b);
  const threshold = Math.max(-50, sorted[Math.floor(sorted.length * 0.1)]! + 12);
  const voiced = db.map((d) => d > threshold);

  // Puntos de corte: centro de cada silencio largo.
  const minSilenceFrames = Math.round(minSilenceMs / 20);
  const cuts: number[] = [];
  let run = 0;
  for (let f = 0; f <= frames; f++) {
    if (f < frames && !voiced[f]) run++;
    else {
      if (run >= minSilenceFrames && f - run > 0 && f < frames) cuts.push(f - Math.floor(run / 2));
      run = 0;
    }
  }
  const bounds = [0, ...cuts, frames];
  let segs: Array<[number, number]> = [];
  for (let i = 0; i < bounds.length - 1; i++) segs.push([bounds[i]!, bounds[i + 1]!]);
  // Une trozos demasiado cortos con el siguiente (o el anterior si es el último).
  const minFrames = Math.round(minSegmentSec * 50);
  const merged: Array<[number, number]> = [];
  for (const s of segs) {
    const last = merged[merged.length - 1];
    if (last && last[1] - last[0] < minFrames) last[1] = s[1];
    else merged.push([...s]);
  }
  if (merged.length > 1 && merged[merged.length - 1]![1] - merged[merged.length - 1]![0] < minFrames) {
    const tail = merged.pop()!;
    merged[merged.length - 1]![1] = tail[1];
  }
  segs = merged.filter(([a, b]) => voiced.slice(a, b).some(Boolean));

  const margin = Math.round(marginMs / 20);
  const out: Array<{ wav: Buffer; startSec: number }> = [];
  for (const [a, b] of segs) {
    const start = Math.max(0, a - margin) * frame * 2;
    const end = Math.min(frames, b + margin) * frame * 2;
    const data = pcm.subarray(start, end);
    const piece = Buffer.concat([wavHeader(data.length), data]);
    // Frases larguísimas sin pausas: se parten por el punto más silencioso.
    const parts = (b - a) / 50 > maxSegmentSec ? splitWav(piece, maxSegmentSec) : [piece];
    let offset = start / 2 / WAV_SAMPLE_RATE;
    for (const p of parts) {
      out.push({ wav: p, startSec: offset });
      offset += wavDurationSec(p);
    }
  }
  return out.length ? out : [{ wav, startSec: 0 }];
}
