import React from 'react';
import { View } from 'react-native';
import Svg, {
  Circle,
  G,
  Path,
  Polygon,
  Rect,
} from 'react-native-svg';

export type TopicIllustrationKind =
  | 'coffee'
  | 'travel'
  | 'career'
  | 'tech'
  | 'culture'
  | 'shopping'
  | 'daily_life'
  | 'debate'
  | 'audio_wave'
  | 'treasure'
  | 'arena_boss'
  | 'oracle';

const INK = '#1E2436';

/**
 * Deduce automáticamente la ilustración vectorial personalizada ideal según el título o ID de la isla.
 */
export function resolveTopicIllustration(
  title: string,
  fallbackBiome?: string
): TopicIllustrationKind {
  const t = title.toLowerCase();
  if (
    t.includes('café') ||
    t.includes('coffee') ||
    t.includes('restauran') ||
    t.includes('comida') ||
    t.includes('menu') ||
    t.includes('order') ||
    t.includes('cocina')
  ) {
    return 'coffee';
  }
  if (
    t.includes('aeropuerto') ||
    t.includes('airport') ||
    t.includes('migración') ||
    t.includes('viaj') ||
    t.includes('travel') ||
    t.includes('hotel') ||
    t.includes('direcciones') ||
    t.includes('train') ||
    t.includes('vuelo')
  ) {
    return 'travel';
  }
  if (
    t.includes('entrevista') ||
    t.includes('interview') ||
    t.includes('salari') ||
    t.includes('negocia') ||
    t.includes('junta') ||
    t.includes('trabajo') ||
    t.includes('work') ||
    t.includes('ejecutiv') ||
    t.includes('email') ||
    t.includes('correo') ||
    t.includes('remoto')
  ) {
    return 'career';
  }
  if (
    t.includes('ia') ||
    t.includes('ai') ||
    t.includes('tecnolog') ||
    t.includes('algoritm') ||
    t.includes('redes') ||
    t.includes('digital') ||
    t.includes('ciencia') ||
    t.includes('futuro')
  ) {
    return 'tech';
  }
  if (
    t.includes('película') ||
    t.includes('serie') ||
    t.includes('música') ||
    t.includes('libro') ||
    t.includes('arte') ||
    t.includes('cultura') ||
    t.includes('reseña')
  ) {
    return 'culture';
  }
  if (
    t.includes('compra') ||
    t.includes('devolver') ||
    t.includes('refund') ||
    t.includes('producto') ||
    t.includes('tienda') ||
    t.includes('recibo')
  ) {
    return 'shopping';
  }
  if (
    t.includes('ética') ||
    t.includes('paradoja') ||
    t.includes('filosof') ||
    t.includes('ensayo') ||
    t.includes('debate') ||
    t.includes('opinión') ||
    t.includes('argument')
  ) {
    return 'debate';
  }
  if (t.includes('cofre') || t.includes('daily drop')) return 'treasure';
  if (t.includes('arena')) return 'arena_boss';
  if (t.includes('oráculo') || t.includes('nivel')) return 'oracle';
  if (fallbackBiome === 'listening') return 'audio_wave';
  if (fallbackBiome === 'writing') return 'debate';
  if (fallbackBiome === 'reading') return 'culture';
  return 'daily_life';
}

/**
 * Ilustración 2D vectorial multicapa con contorno de tinta estilo Toon / Cairn / Waterllama.
 */
export function CustomTopicIllustration({
  kind,
  size = 54,
}: {
  kind: TopicIllustrationKind;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {kind === 'coffee' && (
          <G>
            {/* Vapor */}
            <Path
              d="M24 14 C22 10, 27 8, 25 4 M34 15 C32 11, 37 9, 35 5 M43 14 C41 10, 46 8, 44 4"
              stroke="#FF758F"
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
            />
            {/* Plato */}
            <Path
              d="M10 50 L54 50 L48 56 L16 56 Z"
              fill="#FFD166"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            {/* Asa */}
            <Path
              d="M46 26 C55 26, 55 40, 46 40"
              stroke={INK}
              strokeWidth={4.5}
              fill="none"
            />
            <Path
              d="M46 26 C53 26, 53 40, 46 40"
              stroke="#FF8FA3"
              strokeWidth={2.2}
              fill="none"
            />
            {/* Taza */}
            <Path
              d="M16 20 L48 20 L44 46 C43 49, 40 50, 32 50 C24 50, 21 49, 20 46 Z"
              fill="#FFFFFF"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            {/* Franja decorativa coral */}
            <Path d="M18 31 L46 31 L45 38 L19 38 Z" fill="#FF4769" />
            <Circle cx="32" cy="34.5" r="4" fill="#FFD166" stroke={INK} strokeWidth={2} />
          </G>
        )}

        {kind === 'travel' && (
          <G>
            {/* Pasaporte azul detrás */}
            <Rect
              x="12"
              y="14"
              width="28"
              height="38"
              rx="5"
              fill="#3B82F6"
              stroke={INK}
              strokeWidth={2.6}
            />
            <Circle cx="26" cy="28" r="7" fill="#93C5FD" stroke={INK} strokeWidth={2} />
            {/* Avión Toon cruzando */}
            <Path
              d="M16 44 L54 18 L48 48 L36 39 L26 49 L27 38 Z"
              fill="#FFD166"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            <Path d="M36 39 L54 18 L27 38 Z" fill="#FFF3B0" />
          </G>
        )}

        {kind === 'career' && (
          <G>
            {/* Asa del maletín */}
            <Path
              d="M24 20 L24 14 C24 12, 26 11, 32 11 C38 11, 40 12, 40 14 L40 20"
              stroke={INK}
              strokeWidth={3}
              fill="none"
            />
            {/* Cuerpo del maletín */}
            <Rect
              x="10"
              y="20"
              width="44"
              height="32"
              rx="7"
              fill="#F59E0B"
              stroke={INK}
              strokeWidth={2.6}
            />
            {/* Solapa superior */}
            <Path
              d="M10 26 L32 35 L54 26 L54 23 C54 21, 52 20, 49 20 L15 20 C12 20, 10 21, 10 23 Z"
              fill="#FBBF24"
              stroke={INK}
              strokeWidth={2.4}
              strokeLinejoin="round"
            />
            {/* Broche e insignia de ascenso */}
            <Rect
              x="28"
              y="30"
              width="8"
              height="9"
              rx="2"
              fill="#FFFFFF"
              stroke={INK}
              strokeWidth={2.2}
            />
            <Circle cx="48" cy="18" r="9" fill="#22B567" stroke={INK} strokeWidth={2.4} />
            <Path
              d="M44 20 L48 15 L52 20 M48 15 L48 23"
              stroke="#FFFFFF"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        )}

        {kind === 'tech' && (
          <G>
            {/* Patitas del chip */}
            <Path
              d="M22 8 V16 M32 8 V16 M42 8 V16 M22 48 V56 M32 48 V56 M42 48 V56 M8 22 H16 M8 32 H16 M8 42 H16 M48 22 H56 M48 32 H56 M48 42 H56"
              stroke={INK}
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Chip exterior */}
            <Rect
              x="15"
              y="15"
              width="34"
              height="34"
              rx="8"
              fill="#7B5CFF"
              stroke={INK}
              strokeWidth={2.6}
            />
            {/* Cristal interior celeste */}
            <Polygon
              points="32,20 44,32 32,44 20,32"
              fill="#48CAE4"
              stroke={INK}
              strokeWidth={2.2}
            />
            <Circle cx="32" cy="32" r="4" fill="#FFE082" />
          </G>
        )}

        {kind === 'culture' && (
          <G>
            {/* Claqueta de cine / libro */}
            <Rect
              x="12"
              y="24"
              width="40"
              height="28"
              rx="5"
              fill="#3B4CCA"
              stroke={INK}
              strokeWidth={2.6}
            />
            {/* Barra superior de claqueta */}
            <Path
              d="M11 16 L51 11 L53 20 L13 25 Z"
              fill="#FFD166"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            <Path d="M22 15 L26 23 M36 13 L40 21" stroke={INK} strokeWidth={3} />
            {/* Estrella central */}
            <Polygon
              points="32,29 35,35 42,36 37,40 38,47 32,43 26,47 27,40 22,36 29,35"
              fill="#FF4769"
              stroke={INK}
              strokeWidth={2}
            />
          </G>
        )}

        {kind === 'shopping' && (
          <G>
            {/* Asas de la bolsa */}
            <Path
              d="M23 22 C23 12, 41 12, 41 22"
              stroke={INK}
              strokeWidth={3}
              fill="none"
            />
            {/* Bolsa de compras */}
            <Path
              d="M15 22 L49 22 L53 52 C53 54, 51 55, 48 55 L16 55 C13 55, 11 54, 11 52 Z"
              fill="#FF6B8B"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            {/* Pliegue lateral */}
            <Path d="M15 22 L28 22 L25 55 L14 55 Z" fill="#FF8FA3" />
            {/* Moneda dorada brillante */}
            <Circle cx="44" cy="44" r="10" fill="#FFD166" stroke={INK} strokeWidth={2.5} />
            <Circle cx="44" cy="44" r="5" fill="#F59E0B" />
          </G>
        )}

        {kind === 'daily_life' && (
          <G>
            {/* Sol */}
            <Circle cx="48" cy="16" r="8" fill="#FFD166" stroke={INK} strokeWidth={2.4} />
            {/* Casa acogedora */}
            <Rect
              x="16"
              y="30"
              width="28"
              height="24"
              rx="3"
              fill="#FFF8EB"
              stroke={INK}
              strokeWidth={2.6}
            />
            {/* Techo coral */}
            <Polygon
              points="11,32 30,15 49,32"
              fill="#FF4769"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            {/* Puerta menta */}
            <Rect
              x="26"
              y="39"
              width="8"
              height="15"
              rx="2"
              fill="#22B567"
              stroke={INK}
              strokeWidth={2.2}
            />
          </G>
        )}

        {kind === 'debate' && (
          <G>
            {/* Pergamino / Columna clásica + Rayo de elocuencia */}
            <Rect
              x="14"
              y="12"
              width="32"
              height="42"
              rx="5"
              fill="#FFFDF5"
              stroke={INK}
              strokeWidth={2.6}
            />
            <Path
              d="M21 23 H39 M21 31 H35 M21 39 H32"
              stroke="#64748B"
              strokeWidth={2.8}
              strokeLinecap="round"
            />
            {/* Rayo dorado de persuasión */}
            <Polygon
              points="45,14 33,33 43,33 37,54 55,30 44,30"
              fill="#FFD166"
              stroke={INK}
              strokeWidth={2.4}
              strokeLinejoin="round"
            />
          </G>
        )}

        {kind === 'audio_wave' && (
          <G>
            {/* Arco de audífonos */}
            <Path
              d="M14 34 C14 16, 50 16, 50 34"
              stroke={INK}
              strokeWidth={4}
              fill="none"
            />
            {/* Almohadillas */}
            <Rect
              x="9"
              y="30"
              width="10"
              height="18"
              rx="5"
              fill="#7B5CFF"
              stroke={INK}
              strokeWidth={2.5}
            />
            <Rect
              x="45"
              y="30"
              width="10"
              height="18"
              rx="5"
              fill="#7B5CFF"
              stroke={INK}
              strokeWidth={2.5}
            />
            {/* Ondas sonoras centrales */}
            <Path
              d="M25 36 V42 M32 29 V49 M39 34 V44"
              stroke="#FF4769"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
          </G>
        )}

        {kind === 'treasure' && (
          <G>
            {/* Base del cofre */}
            <Rect
              x="12"
              y="28"
              width="40"
              height="24"
              rx="5"
              fill="#D97706"
              stroke={INK}
              strokeWidth={2.6}
            />
            {/* Tapa curva del cofre */}
            <Path
              d="M12 28 C12 16, 52 16, 52 28 Z"
              fill="#FBBF24"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            {/* Banda metálica y cerradura */}
            <Rect
              x="12"
              y="26"
              width="40"
              height="6"
              fill="#FFE082"
              stroke={INK}
              strokeWidth={2.2}
            />
            <Rect
              x="27"
              y="24"
              width="10"
              height="12"
              rx="3"
              fill="#48CAE4"
              stroke={INK}
              strokeWidth={2.4}
            />
          </G>
        )}

        {kind === 'arena_boss' && (
          <G>
            {/* Escudo real */}
            <Path
              d="M32 10 L52 18 V33 C52 45, 42 53, 32 56 C22 53, 12 45, 12 33 V18 Z"
              fill="#7B5CFF"
              stroke={INK}
              strokeWidth={2.6}
              strokeLinejoin="round"
            />
            {/* Corona dorada central */}
            <Polygon
              points="20,40 22,25 28,31 32,21 36,31 42,25 44,40"
              fill="#FFD166"
              stroke={INK}
              strokeWidth={2.3}
              strokeLinejoin="round"
            />
          </G>
        )}

        {kind === 'oracle' && (
          <G>
            <Circle
              cx="32"
              cy="32"
              r="21"
              fill="#FFD166"
              stroke={INK}
              strokeWidth={2.6}
            />
            <Circle
              cx="32"
              cy="32"
              r="15"
              fill="#FFFDF5"
              stroke={INK}
              strokeWidth={2}
            />
            <Polygon
              points="32,17 37,29 47,32 37,35 32,47 27,35 17,32 27,29"
              fill="#FF4769"
              stroke={INK}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Circle cx="32" cy="32" r="3.5" fill="#3B82F6" />
          </G>
        )}
      </Svg>
    </View>
  );
}
