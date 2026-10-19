import type { PracticeLevel } from './types.js';

/**
 * Política de idioma de la app (directriz pedagógica del banco):
 *  - A1 y A2: explicaciones, instrucciones y correcciones en ESPAÑOL.
 *  - B1 en adelante: inmersión total, TODO en INGLÉS.
 * Sin nivel conocido (antes del test de ubicación) la app habla en español.
 */
export type UiLanguage = 'es' | 'en';

export function uiLanguageFor(level: PracticeLevel | undefined): UiLanguage {
  return !level || level === 'A1' || level === 'A2' ? 'es' : 'en';
}
