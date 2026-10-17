import { Platform } from 'react-native';

/**
 * Sistema de diseño LingoPulse — Estilo Apple Arcade + Juego de Islas 3D.
 * Paleta luminosa sin bloques negros: zafiro, esmeralda, coral, ámbar real y violeta cristal.
 */
export const COLORS = {
  bgCanvas: '#F3F6FC',
  cardSurface: '#FFFFFF',
  cardMuted: '#EEF2FA',
  borderSubtle: 'rgba(45, 60, 100, 0.10)',
  inkPrimary: '#1E2436',
  inkSecondary: '#3E4863',
  inkMuted: '#7E89A6',
  accentBlue: '#007AFF',
  accentSky: '#47C2FF',
  accentSoftBg: '#EBF4FF',
  coral: '#FF4769',
  coralSoftBg: '#FFF0F3',
  emerald: '#22B567',
  emeraldSoftBg: '#E9FAF0',
  amber: '#FF9F0A',
  amberSoftBg: '#FFF6E6',
  purple: '#7B5CFF',
  purpleSoftBg: '#F2EEFF',
} as const;

export const THEME = {
  bg: '#F3F6FC',
  surface: '#FFFFFF',
  fill: '#EDF1F9',
  fill2: '#E2E8F4',
  ink: '#1E2436',
  ink2: '#5A6582',
  ink3: '#94A0B8',
  hairline: 'rgba(45, 60, 100, 0.11)',
  blue: '#007AFF',
  green: '#22B567',
  red: '#FF4769',
  orange: '#FF9500',
  violet: '#7B5CFF',
  gold: '#D99B26',
  goldLight: '#FDF3DC',
};

/** Gradientes vibrantes de juego por habilidad y categoría (sin negros). */
export const GRADIENTS = {
  speaking: ['#FF7A8A', '#FF375F'],
  listening: ['#9F85FF', '#6A4DFF'],
  reading: ['#42DF9F', '#18A86B'],
  writing: ['#FFC24B', '#FF851B'],
  daily: ['#4FACFE', '#007AFF'],
  lesson: ['#9B6BFF', '#5E35E8'],
  pet: ['#FF9EBB', '#FF4F81'],
  gold: ['#FFE082', '#D99B26'],
  ink: ['#4A8CFF', '#0062FF'],
} as const satisfies Record<string, readonly [string, string]>;

export type GradientKey = keyof typeof GRADIENTS;

export const FONT = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Inter, system-ui, sans-serif',
  default: undefined,
});

export const TYPE = {
  largeTitle: { fontSize: 31, fontWeight: '800' as const, letterSpacing: -0.8, color: THEME.ink },
  title1: { fontSize: 25, fontWeight: '800' as const, letterSpacing: -0.6, color: THEME.ink },
  title2: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.4, color: THEME.ink },
  headline: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2, color: THEME.ink },
  body: { fontSize: 16, lineHeight: 23, letterSpacing: -0.2, color: THEME.ink },
  callout: { fontSize: 15, lineHeight: 21, letterSpacing: -0.15, color: THEME.ink },
  subhead: { fontSize: 14, lineHeight: 19, color: THEME.ink2 },
  footnote: { fontSize: 13, lineHeight: 18, color: THEME.ink2 },
  caption: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.0,
    color: THEME.ink3,
    textTransform: 'uppercase' as const,
  },
};

export const SHADOW = {
  card: {
    shadowColor: '#1E3566',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  float: {
    shadowColor: '#1E3566',
    shadowOpacity: 0.14,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  }),
};

export const RADIUS = { card: 26, tile: 22, control: 16, pill: 999 };

/** Tinte sólido del color de la mascota (mezclado con blanco) para el fondo del lienzo 3D. */
export function petTint(hex: string, whiteRatio = 0.78): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * whiteRatio);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | (b & 255)).toString(16).slice(1)}`;
}
