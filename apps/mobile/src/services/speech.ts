import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import type { SupportedLocale } from '@lingopulse/shared';

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onDone?: () => void;
}

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

  if (hasWebSpeech()) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const voices = webVoicesFor(locale);
    clean.forEach((seg, idx) => {
      const u = new SpeechSynthesisUtterance(seg.text);
      u.lang = locale;
      u.rate = rate;
      const voiceIdx = seg.voice ?? 0;
      const voice = voices[voiceIdx % Math.max(voices.length, 1)];
      if (voice) u.voice = voice;
      // Si solo hay una voz, diferencia hablantes por tono
      u.pitch = options.pitch ?? (voiceIdx === 1 && voices.length < 2 ? 1.25 : 1);
      if (idx === 0) u.onstart = () => options.onStart?.();
      if (idx === clean.length - 1) {
        u.onend = () => options.onDone?.();
        u.onerror = () => options.onDone?.();
      }
      synth.speak(u);
    });
    return;
  }

  Speech.stop();
  options.onStart?.();
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
}
