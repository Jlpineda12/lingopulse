import { useSyncExternalStore } from 'react';
import { loadJson, saveJson } from './storage';

/**
 * Consentimiento para enviar voz y textos a servicios de IA de terceros (requisito de
 * App Store 5.1.2 y de la sección de seguridad de datos de Google Play).
 * Se pide una sola vez, justo antes del primer envío, y se puede retirar en Ajustes.
 */
const KEY = 'ai_consent_v1';
let granted: boolean | null = null;
let pending: Array<(ok: boolean) => void> = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

async function load(): Promise<boolean> {
  if (granted === null) granted = (await loadJson<{ granted: boolean }>(KEY, { granted: false })).granted;
  return granted;
}

/** Resuelve true si el jugador ya aceptó o acepta ahora; false si lo rechaza. */
export async function ensureAiConsent(): Promise<boolean> {
  if (await load()) return true;
  return new Promise((resolve) => {
    pending.push(resolve);
    notify();
  });
}

export function answerAiConsent(ok: boolean) {
  granted = ok;
  if (ok) void saveJson(KEY, { granted: true });
  const waiting = pending;
  pending = [];
  waiting.forEach((r) => r(ok));
  notify();
}

export async function revokeAiConsent() {
  granted = false;
  await saveJson(KEY, { granted: false });
  notify();
}

export async function hasAiConsent(): Promise<boolean> {
  return load();
}

/** true mientras haya una petición esperando la respuesta del jugador. */
export function useAiConsentRequested(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pending.length > 0,
    () => false
  );
}
