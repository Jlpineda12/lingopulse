import { Platform } from 'react-native';
import { Audio } from 'expo-av';

export type SfxKind =
  | 'tap'
  | 'select'
  | 'correct'
  | 'wrong'
  | 'fanfare'
  | 'pet';

let sfxMuted = false;

export function isSfxMuted(): boolean {
  return sfxMuted;
}

export function toggleSfxMuted(): boolean {
  sfxMuted = !sfxMuted;
  return sfxMuted;
}

interface ToneNote {
  freq: number;
  durationMs: number;
  delayMs: number;
  volume?: number;
  type?: 'sine' | 'triangle';
}

const SFX_RECIPES: Record<SfxKind, ToneNote[]> = {
  // Toque suave de botón tipo burbuja/marimba
  tap: [
    { freq: 540, durationMs: 38, delayMs: 0, volume: 0.14, type: 'sine' },
    { freq: 760, durationMs: 32, delayMs: 14, volume: 0.1, type: 'sine' },
  ],
  // Cambio de pestaña o selección de isla
  select: [
    { freq: 620, durationMs: 42, delayMs: 0, volume: 0.15, type: 'triangle' },
    { freq: 880, durationMs: 45, delayMs: 22, volume: 0.12, type: 'sine' },
  ],
  // Sonido icónico estilo Duolingo de respuesta correcta (dos notas ascendentes alegres)
  correct: [
    { freq: 587.33, durationMs: 110, delayMs: 0, volume: 0.32, type: 'triangle' }, // D5
    { freq: 880.0, durationMs: 240, delayMs: 95, volume: 0.36, type: 'triangle' }, // A5
    { freq: 1174.66, durationMs: 210, delayMs: 105, volume: 0.16, type: 'sine' },  // D6 brillo
  ],
  // Sonido estilo Duolingo de error (dos notas graves suaves descendentes)
  wrong: [
    { freq: 246.94, durationMs: 120, delayMs: 0, volume: 0.28, type: 'triangle' }, // B3
    { freq: 174.61, durationMs: 210, delayMs: 105, volume: 0.30, type: 'triangle' }, // F3
  ],
  // Fanfarria de misión cumplida / subir de nivel / encender racha
  fanfare: [
    { freq: 523.25, durationMs: 95, delayMs: 0, volume: 0.28, type: 'triangle' },   // C5
    { freq: 659.25, durationMs: 95, delayMs: 85, volume: 0.30, type: 'triangle' },  // E5
    { freq: 783.99, durationMs: 95, delayMs: 170, volume: 0.32, type: 'triangle' }, // G5
    { freq: 1046.5, durationMs: 320, delayMs: 255, volume: 0.36, type: 'triangle' }, // C6
  ],
  // Mimo o comida para la mascota 3D
  pet: [
    { freq: 660, durationMs: 70, delayMs: 0, volume: 0.24, type: 'sine' },
    { freq: 880, durationMs: 75, delayMs: 65, volume: 0.26, type: 'sine' },
    { freq: 1320, durationMs: 150, delayMs: 130, volume: 0.22, type: 'sine' },
  ],
};

// Web Audio Context compartido
let webAudioCtx: AudioContext | null = null;

function playWebSfx(notes: ToneNote[]) {
  try {
    const AudioCtx =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined;
    if (!AudioCtx) return;
    if (!webAudioCtx) {
      webAudioCtx = new AudioCtx();
    }
    if (webAudioCtx.state === 'suspended') {
      webAudioCtx.resume();
    }
    const now = webAudioCtx.currentTime;
    for (const n of notes) {
      const osc = webAudioCtx.createOscillator();
      const gain = webAudioCtx.createGain();
      osc.type = n.type ?? 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.delayMs / 1000);

      const start = now + n.delayMs / 1000;
      const dur = n.durationMs / 1000;
      const vol = n.volume ?? 0.25;

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(vol, start + Math.min(0.012, dur * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0008, start + dur);

      osc.connect(gain);
      gain.connect(webAudioCtx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.01);
    }
  } catch {
    // Ignorar si el navegador bloquea autoplay antes del primer gesto
  }
}

// Generador de WAV PCM en memoria (base64) para iOS / Android en Expo Go
const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i]!;
    const b1 = i + 1 < len ? bytes[i + 1]! : 0;
    const b2 = i + 2 < len ? bytes[i + 2]! : 0;
    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? BASE64_CHARS[b2 & 63] : '=';
  }
  return result;
}

const nativeWavCache: Partial<Record<SfxKind, string>> = {};

function buildWavDataUri(kind: SfxKind): string {
  if (nativeWavCache[kind]) return nativeWavCache[kind]!;
  const notes = SFX_RECIPES[kind];
  const sampleRate = 22050;
  const totalMs = Math.max(...notes.map((n) => n.delayMs + n.durationMs)) + 30;
  const numSamples = Math.ceil((totalMs / 1000) * sampleRate);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const tMs = (i / sampleRate) * 1000;
    let sample = 0;
    for (const n of notes) {
      const localMs = tMs - n.delayMs;
      if (localMs >= 0 && localMs <= n.durationMs) {
        const progress = localMs / n.durationMs;
        const attack = Math.min(1, localMs / 10);
        const decay = Math.pow(1 - progress, 1.6);
        const env = attack * decay * (n.volume ?? 0.25);
        const phase = 2 * Math.PI * n.freq * (localMs / 1000);
        const wave =
          n.type === 'triangle'
            ? (2 / Math.PI) * Math.asin(Math.sin(phase))
            : Math.sin(phase);
        sample += wave * env;
      }
    }
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true);
  }

  const uri = `data:audio/wav;base64,${encodeBase64(new Uint8Array(buffer))}`;
  nativeWavCache[kind] = uri;
  return uri;
}

async function playNativeSfx(kind: SfxKind) {
  try {
    const uri = buildWavDataUri(kind);
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 0.85 }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {
    // Silencioso si el audio nativo está ocupado
  }
}

export function playSfx(kind: SfxKind) {
  if (sfxMuted) return;
  if (Platform.OS === 'web') {
    playWebSfx(SFX_RECIPES[kind]);
  } else {
    void playNativeSfx(kind);
  }
}
