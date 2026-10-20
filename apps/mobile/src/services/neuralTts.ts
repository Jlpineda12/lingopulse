import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import type { SupportedLocale } from '@lingopulse/shared';
import { apiHeaders, getApiBaseUrl } from './config';
import { initAppAudio } from './sfx';
import { speakEnglishPhrase, stopSpeaking } from './speech';

/**
 * Voz neuronal expresiva (Azure, SSML con estilo `cheerful`) para la mascota y la
 * retroalimentación de pronunciación. Si el servidor no tiene voz neuronal, usa la voz del
 * dispositivo sin que el jugador note el cambio.
 */

export interface NeuralSpeakOptions {
  pitch?: number;
  rate?: number;
  style?: 'cheerful' | 'friendly' | 'excited' | 'hopeful' | 'calm';
  onStart?: () => void;
  onDone?: () => void;
}

let statusPromise: Promise<boolean> | null = null;

/** ¿El servidor tiene voz neuronal? (se pregunta una vez por sesión). */
export function neuralTtsAvailable(): Promise<boolean> {
  statusPromise ??= (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${getApiBaseUrl()}/api/tts/status`, { headers: apiHeaders(), signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) return false;
      return Boolean(((await res.json()) as { enabled?: boolean }).enabled);
    } catch {
      return false;
    }
  })();
  return statusPromise;
}

let webAudio: HTMLAudioElement | null = null;
let player: AudioPlayer | null = null;
let slot = 0;
let generation = 0;
/** Frases ya sintetizadas (URL local) para repetirlas sin volver a pedirlas. */
const cache = new Map<string, string>();

export function stopNeural() {
  generation++;
  webAudio?.pause();
  webAudio = null;
  player?.pause();
  stopSpeaking();
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = globalThis.atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Guarda el MP3 y devuelve una URL reproducible (blob en web, archivo en el teléfono). */
function storeMp3(bytes: Uint8Array): string {
  if (Platform.OS === 'web') return URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'audio/mpeg' }));
  slot = (slot + 1) % 24;
  const file = new File(Paths.cache, `lingopulse-voice-${slot}.mp3`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}

async function playUrl(url: string, opts: NeuralSpeakOptions, gen: number) {
  if (gen !== generation) return;
  opts.onStart?.();
  if (Platform.OS === 'web') {
    const el = new (window as unknown as { Audio: typeof Audio }).Audio(url);
    webAudio = el;
    el.onended = () => opts.onDone?.();
    el.onerror = () => opts.onDone?.();
    await el.play().catch(() => opts.onDone?.());
    return;
  }
  await initAppAudio();
  player?.release();
  player = createAudioPlayer({ uri: url }, { keepAudioSessionActive: true });
  const sub = player.addListener('playbackStatusUpdate', (st) => {
    if (st.didJustFinish) {
      sub.remove();
      opts.onDone?.();
    }
  });
  player.play();
}

/** Reproduce el audio que ya viene sintetizado en la respuesta del servidor. */
export function playSpeechBase64(b64: string, opts: NeuralSpeakOptions = {}) {
  stopNeural();
  const gen = generation;
  try {
    void playUrl(storeMp3(base64ToBytes(b64)), opts, gen);
  } catch {
    opts.onDone?.();
  }
}

/** Habla en inglés con la voz neuronal alegre (o la del dispositivo si no está disponible). */
export async function speakNeural(text: string, locale: SupportedLocale, opts: NeuralSpeakOptions = {}) {
  stopNeural();
  const gen = generation;
  const fallback = () => speakEnglishPhrase(text, locale, { pitch: opts.pitch, rate: opts.rate, onStart: opts.onStart, onDone: opts.onDone });
  if (!text.trim()) return;
  const key = `${locale}|${opts.style ?? 'cheerful'}|${opts.pitch ?? 1}|${opts.rate ?? 1}|${text}`;
  const cached = cache.get(key);
  if (cached) return playUrl(cached, opts, gen);
  if (!(await neuralTtsAvailable())) return fallback();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${getApiBaseUrl()}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      body: JSON.stringify({ text, locale, style: opts.style ?? 'cheerful', pitch: opts.pitch, rate: opts.rate }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return fallback();
    const url = storeMp3(new Uint8Array(await res.arrayBuffer()));
    if (cache.size > 60) cache.delete(cache.keys().next().value!);
    cache.set(key, url);
    if (gen !== generation) return;
    return playUrl(url, opts, gen);
  } catch {
    if (gen === generation) fallback();
  }
}

