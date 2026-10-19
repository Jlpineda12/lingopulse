/**
 * Persistencia en web: localStorage directo (las mismas claves que usaba AsyncStorage en web,
 * así que el progreso guardado se conserva). En iOS/Android Metro usa `storage.ts`.
 * Se evita importar AsyncStorage aquí porque su dependencia `merge-options` falla en el bundle web de SDK 57.
 */
const PREFIX = 'lingopulse:v1:';

function store(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = store()?.getItem(PREFIX + key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    store()?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible (modo privado, etc.): la app sigue en memoria.
  }
}

export async function clearAll(): Promise<void> {
  try {
    const s = store();
    if (!s) return;
    Object.keys(s)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => s.removeItem(k));
  } catch {
    // ignore
  }
}
