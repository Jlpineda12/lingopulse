import {
  buildLocalFeedback,
  type CoachFeedback,
  type CoachRequest,
} from '@lingopulse/shared';

import { getApiBaseUrl } from './config';

export type CoachEngine = 'claude' | 'local';

async function fetchJson<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** ¿El backend tiene Claude activo? Si no hay backend, se usa el motor local. */
export async function getCoachEngine(): Promise<CoachEngine> {
  try {
    const status = await fetchJson<{ aiEnabled: boolean }>('/api/coach/status', { method: 'GET' }, 1500);
    return status.aiEnabled ? 'claude' : 'local';
  } catch {
    return 'local';
  }
}

/**
 * Pide feedback al backend (Claude si está activo) y, si no responde, usa el
 * motor local con las mismas reglas compartidas. Nunca deja al usuario sin feedback.
 */
export async function getCoachFeedback(req: CoachRequest): Promise<CoachFeedback> {
  try {
    return await fetchJson<CoachFeedback>(
      '/api/coach/feedback',
      { method: 'POST', body: JSON.stringify(req) },
      60_000
    );
  } catch {
    return buildLocalFeedback(req);
  }
}
