import { createHash } from 'node:crypto';

/**
 * Voz neuronal expresiva de Azure (Text to Speech con SSML).
 * Usa la misma clave que la evaluación de pronunciación: AZURE_SPEECH_KEY + AZURE_SPEECH_REGION.
 * La mascota habla con estilo `cheerful` (alegre) y su propio tono; el resultado se guarda en
 * memoria porque muchas frases (saludos, ánimos, modelos de pronunciación) se repiten.
 */

export function isAzureTtsEnabled(): boolean {
  return !!process.env.AZURE_SPEECH_KEY && !!process.env.AZURE_SPEECH_REGION;
}

/** Voces neuronales con estilos expresivos (cheerful, friendly…). */
const VOICES: Record<'en-US' | 'en-GB', string> = {
  'en-US': process.env.AZURE_TTS_VOICE_US ?? 'en-US-JennyNeural',
  'en-GB': process.env.AZURE_TTS_VOICE_GB ?? 'en-GB-SoniaNeural',
};

export type TtsStyle = 'cheerful' | 'friendly' | 'excited' | 'hopeful' | 'calm';
const STYLES = new Set<TtsStyle>(['cheerful', 'friendly', 'excited', 'hopeful', 'calm']);

export interface TtsOptions {
  locale?: string;
  style?: string;
  /** Tono relativo (1 = normal). La voz de cada mascota sube o baja un poco. */
  pitch?: number;
  /** Velocidad relativa (1 = normal). */
  rate?: number;
}

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

const percent = (k: number, min: number, max: number) => {
  const v = Math.round((Math.max(min, Math.min(max, k)) - 1) * 100);
  return `${v >= 0 ? '+' : ''}${v}%`;
};

/** SSML con la voz, el estilo expresivo y la prosodia (tono y velocidad) de la mascota. */
export function buildSsml(text: string, opts: TtsOptions = {}): string {
  const locale = opts.locale === 'en-GB' ? 'en-GB' : 'en-US';
  const style: TtsStyle = STYLES.has(opts.style as TtsStyle) ? (opts.style as TtsStyle) : 'cheerful';
  const pitch = percent(opts.pitch ?? 1, 0.7, 1.4);
  const rate = percent(opts.rate ?? 1, 0.6, 1.5);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${locale}">` +
    `<voice name="${VOICES[locale]}"><mstts:express-as style="${style}" styledegree="1.3">` +
    `<prosody pitch="${pitch}" rate="${rate}">${escapeXml(text.slice(0, 800))}</prosody>` +
    `</mstts:express-as></voice></speak>`
  );
}

const cache = new Map<string, Buffer>();
const CACHE_MAX = 300;

/** Sintetiza a MP3 (24 kHz, 48 kbps: ligero para el teléfono). */
export async function synthesizeSpeech(text: string, opts: TtsOptions = {}): Promise<Buffer> {
  const ssml = buildSsml(text, opts);
  const key = createHash('sha1').update(ssml).digest('hex');
  const hit = cache.get(key);
  if (hit) return hit;
  const res = await fetch(`https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'LingoPulse',
    },
    body: ssml,
  });
  if (!res.ok) throw new Error(`Azure TTS HTTP ${res.status}`);
  const audio = Buffer.from(await res.arrayBuffer());
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, audio);
  return audio;
}
