import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 4000;

/**
 * URL del backend. En el teléfono "localhost" es el propio teléfono, así que
 * se usa la IP del Mac que sirve la app (la misma que usa Expo Go / el navegador).
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv && !/localhost|127\.0\.0\.1/.test(fromEnv)) return fromEnv;

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const { protocol, hostname } = window.location;
      return `${protocol === 'https:' ? 'https:' : 'http:'}//${hostname}:${API_PORT}`;
    }
    return fromEnv ?? `http://localhost:${API_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.split(':')[0];
  if (host && !host.includes('exp.direct')) return `http://${host}:${API_PORT}`;
  return fromEnv ?? `http://localhost:${API_PORT}`;
}
