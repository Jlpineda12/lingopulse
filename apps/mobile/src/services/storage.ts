import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persistencia local (localStorage en web, AsyncStorage en iOS/Android). */
const PREFIX = 'lingopulse:v1:';

export async function loadJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Sin almacenamiento disponible (modo privado, etc.): la app sigue en memoria.
  }
}

export async function clearAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  } catch {
    // ignore
  }
}

/** Borra varias claves (por ejemplo, todos los datos de un jugador al eliminar su cuenta). */
export async function removeKeys(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys.map((k) => PREFIX + k));
  } catch {
    // ignore
  }
}
