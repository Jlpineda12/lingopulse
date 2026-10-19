import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import type { SupportedLocale } from '@lingopulse/shared';

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  /** Silencio entre fragmentos (ms). Sin él, se encadenan sin pausa. */
  gapMs?: number;
  /** Alterna acento US/UK entre la voz 0 y la voz 1 (listening B2+). */
  mixAccents?: boolean;
  onStart?: () => void;
  onDone?: () => void;
}

/** Cada reproducción nueva o stopSpeaking() invalida la anterior (corta pausas pendientes). */
let generation = 0;

const hasWebSpeech = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window;

function webVoicesFor(locale: SupportedLocale): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis.getVoices();
  const exact = voices.filter((v) => v.lang.replace('_', '-') === locale);
  const sameLang = voices.filter((v) => v.lang.startsWith('en'));
  const pool = exact.length ? exact : sameLang;
  const score = (v: SpeechSynthesisVoice) =>
    /natural|neural|google|samantha|daniel|serena|karen|aria|jenny/i.test(v.name) ? 1 : 0;
  // Prioriza voces naturales conocidas
  return [...pool].sort((a, b) => score(b) - score(a));
}

if (hasWebSpeech()) {
  // Chrome carga las voces de forma asíncrona
  window.speechSynthesis.getVoices();
}

export function stopSpeaking() {
  generation++;
  if (hasWebSpeech()) window.speechSynthesis.cancel();
  else Speech.stop();
}

export function speakEnglishPhrase(
  text: string,
  locale: SupportedLocale,
  callbacks?: SpeakOptions
) {
  speakSequence([{ text }], locale, callbacks);
}

/**
 * Reproduce varios fragmentos seguidos. `voice` 0/1 alterna voces (o tono) para
 * distinguir hablantes en los diálogos de Listening.
 */
export function speakSequence(
  segments: Array<{ text: string; voice?: number }>,
  locale: SupportedLocale,
  options: SpeakOptions = {}
) {
  const clean = segments.filter((s) => s.text.trim());
  if (!clean.length) return;
  const rate = options.rate ?? 0.95;
  const other: SupportedLocale = locale === 'en-GB' ? 'en-US' : 'en-GB';
  const localeFor = (voice: number) => (options.mixAccents && voice === 1 ? other : locale);

  // Con pausas o acentos mezclados se reproduce fragmento a fragmento (encadenado);
  // si no, todo va a la cola del sintetizador de una vez (más fluido).
  const chained = (options.gapMs ?? 0) > 0 || !!options.mixAccents;
  stopSpeaking();
  const gen = generation;

  if (hasWebSpeech()) {
    const synth = window.speechSynthesis;
    const makeUtterance = (seg: { text: string; voice?: number }) => {
      const voiceIdx = seg.voice ?? 0;
      const lang = localeFor(voiceIdx);
      const voices = webVoicesFor(lang);
      const u = new SpeechSynthesisUtterance(seg.text);
      u.lang = lang;
      u.rate = rate;
      // Con acentos mezclados cada hablante tiene su propia lista de voces: se usa la primera.
      const voice = options.mixAccents ? voices[0] : voices[voiceIdx % Math.max(voices.length, 1)];
      if (voice) u.voice = voice;
      // Si solo hay una voz, diferencia hablantes por tono
      u.pitch = options.pitch ?? (voiceIdx === 1 && voices.length < 2 ? 1.25 : 1);
      return u;
    };
    if (!chained) {
      clean.forEach((seg, idx) => {
        const u = makeUtterance(seg);
        if (idx === 0) u.onstart = () => options.onStart?.();
        if (idx === clean.length - 1) {
          u.onend = () => options.onDone?.();
          u.onerror = () => options.onDone?.();
        }
        synth.speak(u);
      });
      return;
    }
    options.onStart?.();
    const playAt = (idx: number) => {
      if (gen !== generation) return;
      if (idx >= clean.length) return options.onDone?.();
      const u = makeUtterance(clean[idx]!);
      const next = () => {
      setTimeout(() => playAt(idx + 1), idx < clean.length - 1 ? options.gapMs ?? 0 : 0);
    };
      u.onend = next;
      u.onerror = next;
      synth.speak(u);
    };
    playAt(0);
    return;
  }

  options.onStart?.();
  if (!chained) {
    clean.forEach((seg, idx) => {
      const isLast = idx === clean.length - 1;
      Speech.speak(seg.text, {
        language: locale,
        rate,
        pitch: options.pitch ?? (seg.voice === 1 ? 1.2 : 1),
        onDone: isLast ? () => options.onDone?.() : undefined,
        onStopped: isLast ? () => options.onDone?.() : undefined,
        onError: () => options.onDone?.(),
      });
    });
    return;
  }
  const playAt = (idx: number) => {
    if (gen !== generation) return;
    if (idx >= clean.length) return options.onDone?.();
    const seg = clean[idx]!;
    const next = () => {
      setTimeout(() => playAt(idx + 1), idx < clean.length - 1 ? options.gapMs ?? 0 : 0);
    };
    Speech.speak(seg.text, {
      language: localeFor(seg.voice ?? 0),
      rate,
      pitch: options.pitch ?? (seg.voice === 1 ? 1.2 : 1),
      onDone: next,
      onError: next,
      onStopped: () => {
        if (gen === generation) options.onDone?.();
      },
    });
  };
  playAt(0);
}
