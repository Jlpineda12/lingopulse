import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { CEFR_LEVEL_META, type PracticeLevel } from '@lingopulse/shared';
import { useGame } from '../context/GameContext';
import {
  CustomTopicIllustration,
  resolveTopicIllustration,
  type TopicIllustrationKind,
} from './CustomTopicIcons';
import { Glyph } from './Glyph';
import { Pet3D } from './Pet3D';
import { PressableScale, useTiltOffset } from './motion';
import { SHADOW, THEME } from '../theme/colors';
import type { IconName } from './ui';

/**
 * Archipiélago "Grand Line": cada isla vive en su propio mar con playa, acantilado,
 * vegetación y un monumento gigante y caprichoso (caracola parlante, monte campana,
 * árbol biblioteca, pluma en el tintero, arco del tesoro, coliseo, faro e isla del cielo).
 * Olas, gaviotas, banderas y piezas del monumento están animadas.
 */

export type IslandBiomeKey =
  | 'speaking'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'daily'
  | 'lesson'
  | 'roleplay'
  | 'placement';

type Decor = 'palms' | 'pines' | 'crystals' | 'coral' | 'cactus';
type LandmarkKind = 'conch' | 'bell' | 'tree' | 'quill' | 'arch' | 'colosseum' | 'lighthouse' | 'temple';

export interface BiomePalette {
  worldNameEs: string;
  worldTagEs: string;
  topColors: readonly [string, string];
  cliffLight: string;
  cliffMid: string;
  cliffShadow: string;
  accent: string;
  mcIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  ionIcon: IconName;
  decor: Decor;
  waterfall: boolean;
  grass: string;
  sand: string;
  landmark: LandmarkKind;
}

const INK = '#1E2436';
const NATIVE = Platform.OS !== 'web';
const VB_W = 200;
const VB_H = 196;

export const LEVEL_DIFFICULTY_ES: Record<PracticeLevel, string> = {
  A1: 'Fácil',
  A2: 'Básico',
  B1: 'Intermedio',
  B2: 'Intermedio Alto',
  C1: 'Avanzado',
  C2: 'Maestría',
};

export const BIOME_PALETTES: Record<IslandBiomeKey, BiomePalette> = {
  speaking: {
    worldNameEs: 'Isla Caracola · Speaking', worldTagEs: 'ISLA DE LA VOZ',
    topColors: ['#FFB3C4', '#FF7A93'], cliffLight: '#E2B6A6', cliffMid: '#B98473', cliffShadow: '#7E5246',
    accent: '#FF375F', mcIcon: 'microphone-variant', ionIcon: 'mic', decor: 'coral', waterfall: false, grass: '#7DDB9B',
    sand: '#FFE6B8', landmark: 'conch',
  },
  listening: {
    worldNameEs: 'Monte Campana · Listening', worldTagEs: 'ISLA DEL OÍDO',
    topColors: ['#CDBEFF', '#9D86FF'], cliffLight: '#B7AEDB', cliffMid: '#8A80B8', cliffShadow: '#5B5288',
    accent: '#6747FF', mcIcon: 'headphones-settings', ionIcon: 'headset', decor: 'pines', waterfall: true, grass: '#9EE6C4',
    sand: '#ECE8FA', landmark: 'bell',
  },
  reading: {
    worldNameEs: 'Árbol del Saber · Reading', worldTagEs: 'ISLA DE LECTURA',
    topColors: ['#A8F0C8', '#4FD8A8'], cliffLight: '#B9B08F', cliffMid: '#8E8467', cliffShadow: '#605842',
    accent: '#15A869', mcIcon: 'book-open-page-variant', ionIcon: 'reader', decor: 'palms', waterfall: false, grass: '#5ED68C',
    sand: '#FFE9B0', landmark: 'tree',
  },
  writing: {
    worldNameEs: 'Desierto de Tinta · Writing', worldTagEs: 'ISLA DE PLUMA',
    topColors: ['#FFE3A3', '#FFC15A'], cliffLight: '#E3B985', cliffMid: '#B98A5A', cliffShadow: '#7F5C3A',
    accent: '#E87A00', mcIcon: 'fountain-pen-tip', ionIcon: 'create', decor: 'cactus', waterfall: false, grass: '#F2C46B',
    sand: '#FFDB94', landmark: 'quill',
  },
  daily: {
    worldNameEs: 'Arco del Tesoro · Daily Drop', worldTagEs: 'COFRE DEL DÍA',
    topColors: ['#B9E4FF', '#6CB8FF'], cliffLight: '#B6BCCB', cliffMid: '#868FA4', cliffShadow: '#5A6278',
    accent: '#007AFF', mcIcon: 'treasure-chest', ionIcon: 'sparkles', decor: 'palms', waterfall: false, grass: '#7DDB9B',
    sand: '#FFE6A8', landmark: 'arch',
  },
  lesson: {
    worldNameEs: 'Coliseo Estelar · Voice Arena', worldTagEs: 'JEFE DE ARENA',
    topColors: ['#D9C4FF', '#A779FF'], cliffLight: '#E8DCC4', cliffMid: '#BBA98A', cliffShadow: '#7F6F57',
    accent: '#5B34EB', mcIcon: 'sword-cross', ionIcon: 'planet', decor: 'crystals', waterfall: false, grass: '#B5A6FF',
    sand: '#F3E6CB', landmark: 'colosseum',
  },
  roleplay: {
    worldNameEs: 'Cabo Faro · Roleplay IA', worldTagEs: 'SIMULACIÓN REAL',
    topColors: ['#B4E8FF', '#7AA2FF'], cliffLight: '#A9B6C9', cliffMid: '#7C8AA2', cliffShadow: '#525F78',
    accent: '#4F46E5', mcIcon: 'drama-masks', ionIcon: 'chatbubbles', decor: 'palms', waterfall: false, grass: '#7DDB9B',
    sand: '#FFE6A8', landmark: 'lighthouse',
  },
  placement: {
    worldNameEs: 'Isla del Cielo · Nivel CEFR', worldTagEs: 'RANGO OFICIAL',
    topColors: ['#FFF0B3', '#FFD166'], cliffLight: '#D9C49A', cliffMid: '#AD9670', cliffShadow: '#776548',
    accent: '#C98A14', mcIcon: 'crown-circle', ionIcon: 'compass', decor: 'crystals', waterfall: false, grass: '#9BDB7D',
    sand: '#FFF3CC', landmark: 'temple',
  },
};

/** Ida y vuelta suave 0 → 1 → 0. */
function useFloat(duration: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return v;
}

/** Ciclo lineal 0 → 1 que se repite (anillos de sonido, pulso). */
function useCycle(duration: number) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE })
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration]);
  return v;
}

/* ------------------------------------------------------------------ */
/* Capas animadas sobre el SVG (mismas coordenadas 200×196)            */
/* ------------------------------------------------------------------ */

/** Capa del tamaño de la isla: lo que dibujes usa las coordenadas del viewBox. */
function FxLayer({ size, style, children }: { size: number; style?: any; children: React.ReactNode }) {
  const h = (size * VB_H) / VB_W;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0, width: size, height: h }, style]}>
      <Svg width={size} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** Capa centrada en un pivote (x, y): rotar/escalar gira alrededor de ese punto. */
function PivotLayer({
  size,
  x,
  y,
  r,
  style,
  children,
}: {
  size: number;
  x: number;
  y: number;
  r: number;
  style?: any;
  children: React.ReactNode;
}) {
  const k = size / VB_W;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: (x - r) * k, top: (y - r) * k, width: 2 * r * k, height: 2 * r * k }, style]}
    >
      <Svg width={2 * r * k} height={2 * r * k} viewBox={`${x - r} ${y - r} ${2 * r} ${2 * r}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

function sparkle(x: number, y: number, r: number) {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
}

/* ------------------------------------------------------------------ */
/* Vegetación                                                          */
/* ------------------------------------------------------------------ */

function Palm({ x, y, lean, s = 1 }: { x: number; y: number; lean: number; s?: number }) {
  const tx = x + lean * 10 * s;
  const ty = y - 34 * s;
  const trunk = `M${x} ${y} Q${x + lean * 2 * s} ${y - 18 * s} ${tx} ${ty}`;
  const leaves: Array<[number, number]> = [
    [-19, 5],
    [-13, -9],
    [1, -14],
    [14, -9],
    [19, 5],
  ];
  return (
    <G>
      <Path d={trunk} stroke={INK} strokeWidth={8 * s} strokeLinecap="round" fill="none" />
      <Path d={trunk} stroke="#B07A45" strokeWidth={5 * s} strokeLinecap="round" fill="none" />
      <Path d={trunk} stroke="#8A5A30" strokeWidth={5 * s} strokeDasharray={`${1.6 * s} ${4 * s}`} fill="none" />
      {leaves.map(([ex, ey], i) => {
        const lx = ex * s;
        const ly = ey * s;
        return (
          <Path
            key={i}
            d={`M${tx} ${ty} Q${tx + lx * 0.5} ${ty + ly * 0.5 - 7 * s} ${tx + lx} ${ty + ly} Q${tx + lx * 0.55} ${ty + ly * 0.5 + 1.5 * s} ${tx} ${ty} Z`}
            fill={i % 2 ? '#2FB86A' : '#45D07F'}
            stroke={INK}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        );
      })}
      <Circle cx={tx - 2 * s} cy={ty + 3 * s} r={2.6 * s} fill="#8A5A30" stroke={INK} strokeWidth={1.2} />
      <Circle cx={tx + 2.5 * s} cy={ty + 3.5 * s} r={2.4 * s} fill="#9C6838" stroke={INK} strokeWidth={1.2} />
    </G>
  );
}

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const st = { stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  return (
    <G>
      <Rect x={x - 2 * s} y={y - 6 * s} width={4 * s} height={6 * s} fill="#8B5A2B" {...st} />
      <Polygon points={`${x},${y - 30 * s} ${x + 11 * s},${y - 6 * s} ${x - 11 * s},${y - 6 * s}`} fill="#2FA36B" {...st} />
      <Polygon points={`${x},${y - 38 * s} ${x + 8 * s},${y - 20 * s} ${x - 8 * s},${y - 20 * s}`} fill="#3CC07E" {...st} />
      <Path d={`M${x - 4 * s} ${y - 31 * s} L${x} ${y - 38 * s} L${x + 4 * s} ${y - 31 * s} Q${x} ${y - 28 * s} ${x - 4 * s} ${y - 31 * s} Z`} fill="#FFFFFF" {...st} />
    </G>
  );
}

function DecorSet({ decor }: { decor: Decor }) {
  const st = { stroke: INK, strokeWidth: 1.8, strokeLinejoin: 'round' as const };
  switch (decor) {
    case 'palms':
      return (
        <G>
          <Palm x={50} y={120} lean={-1} />
          <Palm x={166} y={146} lean={1} s={0.9} />
        </G>
      );
    case 'pines':
      return (
        <G>
          <Pine x={52} y={122} />
          <Pine x={166} y={146} s={0.8} />
          <Pine x={154} y={142} s={0.6} />
        </G>
      );
    case 'crystals':
      return (
        <G>
          <Polygon points="44,124 40,104 47,94 53,106 51,124" fill="#B9E4FF" {...st} />
          <Polygon points="52,124 54,112 60,108 61,124" fill="#D8C4FF" {...st} />
          <Polygon points="160,150 158,134 165,126 170,138 168,150" fill="#FFC6E3" {...st} />
          <Path d="M44 104 L47 96" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
        </G>
      );
    case 'coral':
      return (
        <G>
          <Path d="M46 124 V108 M46 114 L40 106 M46 112 L52 102 M52 102 V98 M40 106 V101" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M46 124 V108 M46 114 L40 106 M46 112 L52 102 M52 102 V98 M40 106 V101" stroke="#FF7A93" strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Path d="M164 150 V138 M164 142 L170 134 M164 141 L158 133" stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M164 150 V138 M164 142 L170 134 M164 141 L158 133" stroke="#FFB547" strokeWidth={3.4} strokeLinecap="round" fill="none" />
          <Path d={sparkle(150, 156, 5)} fill="#FF9A5A" {...st} />
        </G>
      );
    default:
      return (
        <G>
          {[[48, 122, 1], [166, 148, 0.8]].map(([x, y, s], i) => (
            <G key={i}>
              <Path
                d={`M${x} ${y} V${y! - 22 * s!} M${x} ${y! - 8 * s!} H${x! - 7 * s!} V${y! - 16 * s!} M${x} ${y! - 12 * s!} H${x! + 7 * s!} V${y! - 19 * s!}`}
                stroke={INK}
                strokeWidth={8 * s!}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <Path
                d={`M${x} ${y} V${y! - 22 * s!} M${x} ${y! - 8 * s!} H${x! - 7 * s!} V${y! - 16 * s!} M${x} ${y! - 12 * s!} H${x! + 7 * s!} V${y! - 19 * s!}`}
                stroke="#3FBF6E"
                strokeWidth={5 * s!}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </G>
          ))}
          <Circle cx={48} cy={99} r={2.4} fill="#FF7AA8" stroke={INK} strokeWidth={1} />
        </G>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Monumentos (uno por mundo)                                          */
/* ------------------------------------------------------------------ */

function Landmark({ b }: { b: BiomePalette }) {
  const st = (w = 2.4) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
  switch (b.landmark) {
    case 'conch':
      return (
        <G>
          <Path d="M70 116 Q60 84 78 58 Q90 38 100 14 Q110 38 122 58 Q140 84 130 116 Q100 124 70 116 Z" fill={b.topColors[0]} {...st(3)} />
          <Path d="M100 16 Q110 38 122 58 Q140 84 130 116 Q117 120 105 121 Q118 80 100 16 Z" fill={b.topColors[1]} opacity={0.5} />
          <Path d="M72 98 Q100 108 130 96 M76 78 Q100 88 126 76 M84 58 Q100 66 118 56 M92 38 Q100 44 108 36" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <Polygon points="72,96 61,91 70,86" fill={b.topColors[0]} {...st(2)} />
          <Polygon points="128,94 139,88 130,84" fill={b.topColors[0]} {...st(2)} />
          <Polygon points="77,76 67,70 76,67" fill={b.topColors[0]} {...st(2)} />
          <Polygon points="124,74 134,68 125,65" fill={b.topColors[0]} {...st(2)} />
          <Ellipse cx={114} cy={100} rx={11} ry={13} fill="#FFE1EA" {...st()} />
          <Ellipse cx={115} cy={101} rx={6} ry={8} fill={b.accent} opacity={0.75} />
          <Path d="M82 119 V107 Q88 99 94 107 V119 Z" fill="#8B5A2B" {...st(2)} />
          <Circle cx={96} cy={70} r={3.4} fill="#FFE08A" {...st(1.6)} />
          <Circle cx={104} cy={49} r={3} fill="#FFE08A" {...st(1.6)} />
          <Path d="M78 70 Q80 64 84 62" stroke="#FFFFFF" strokeWidth={2} opacity={0.7} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'bell':
      return (
        <G>
          <Path d="M70 120 L74 46 Q100 38 126 46 L130 120 Q100 128 70 120 Z" fill={b.cliffLight} {...st(3)} />
          <Path d="M102 42 Q115 42 126 46 L130 120 Q117 124 105 124 Z" fill={b.cliffMid} opacity={0.75} />
          <Path d="M82 62 V112 M93 58 V116 M116 60 V114" stroke={INK} strokeWidth={1.3} opacity={0.3} />
          <Rect x={83} y={84} width={6} height={8} rx={2} fill="#FFE08A" {...st(1.4)} />
          <Rect x={106} y={96} width={6} height={8} rx={2} fill="#FFE08A" {...st(1.4)} />
          <Rect x={95} y={70} width={6} height={8} rx={2} fill="#FFE08A" {...st(1.4)} />
          {/* Cascada que cae del monte al mar */}
          <Rect x={124} y={70} width={10} height={82} fill="#7FD3FF" {...st(2)} />
          <Path d="M127 74 V148 M131 78 V150" stroke="#FFFFFF" strokeWidth={1.6} strokeDasharray="5 6" />
          <Ellipse cx={129} cy={153} rx={11} ry={4} fill="#E6F7FF" {...st(1.6)} />
          {/* Gorro de nieve */}
          <Path d="M72 48 Q100 36 128 48 Q126 58 120 52 Q114 62 108 54 Q100 62 92 54 Q86 62 80 52 Q74 58 72 48 Z" fill="#FFFFFF" {...st(2.2)} />
          {/* Arco de la campana */}
          <Rect x={82} y={16} width={6} height={30} fill="#C98A5B" {...st(2)} />
          <Rect x={112} y={16} width={6} height={30} fill="#C98A5B" {...st(2)} />
          <Path d="M74 19 Q100 7 126 19 L126 24 Q100 13 74 24 Z" fill="#B5603A" {...st(2)} />
        </G>
      );
    case 'tree': {
      const blobs: Array<[number, number, number]> = [
        [100, 42, 30],
        [70, 54, 20],
        [130, 54, 20],
        [80, 28, 17],
        [120, 28, 17],
        [100, 16, 14],
      ];
      return (
        <G>
          <Path d="M82 120 Q72 120 62 126 M118 120 Q128 120 138 126" stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />
          <Path d="M82 120 Q72 120 62 126 M118 120 Q128 120 138 126" stroke="#B07444" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M80 122 Q86 92 88 62 L112 62 Q114 92 120 122 Q100 128 80 122 Z" fill="#B07444" {...st(3)} />
          <Path d="M104 62 L112 62 Q114 92 120 122 Q112 124 106 124 Q110 90 104 62 Z" fill="#8A5530" opacity={0.6} />
          <Path d="M93 123 V112 Q100 104 107 112 V123 Z" fill="#5C3A1E" {...st(2)} />
          <Path d="M92 96 V89 Q95 85 98 89 V96 Z" fill="#FFE08A" {...st(1.6)} />
          <Path d="M103 82 V75 Q106 71 109 75 V82 Z" fill="#FFE08A" {...st(1.6)} />
          {blobs.map(([x, y, r], i) => (
            <Circle key={`o${i}`} cx={x} cy={y} r={r} fill={INK} stroke={INK} strokeWidth={6} />
          ))}
          {blobs.map(([x, y, r], i) => (
            <Circle key={`f${i}`} cx={x} cy={y} r={r} fill={i % 2 ? '#2FB86A' : '#45D07F'} />
          ))}
          <Circle cx={88} cy={34} r={8} fill="#8BEBB0" opacity={0.7} />
          <Circle cx={114} cy={22} r={5} fill="#8BEBB0" opacity={0.7} />
          {/* Libros colgando de las ramas */}
          <Path d="M66 70 V76 M134 70 V78" stroke={INK} strokeWidth={1.4} />
          <Rect x={61} y={76} width={10} height={12} rx={1.5} fill="#FF7A93" {...st(1.8)} />
          <Rect x={129} y={78} width={10} height={12} rx={1.5} fill="#6CB8FF" {...st(1.8)} />
          <Path d="M66 77 V87 M134 79 V89" stroke="#FFFFFF" strokeWidth={1.4} />
          <Circle cx={100} cy={46} r={4} fill="#FFC94D" {...st(1.4)} />
          <Circle cx={76} cy={56} r={3} fill="#FF7AA8" {...st(1.2)} />
          <Circle cx={124} cy={40} r={3} fill="#FFC94D" {...st(1.2)} />
        </G>
      );
    }
    case 'quill':
      return (
        <G>
          {/* Lago de tinta y dunas */}
          <Ellipse cx={156} cy={153} rx={17} ry={5.5} fill="#2B2F5C" {...st(2)} />
          <Ellipse cx={151} cy={151.5} rx={6} ry={1.6} fill="#8C93E0" opacity={0.8} />
          <Path d="M36 146 Q46 136 58 146 Z" fill="#FFCF7A" {...st(1.8)} />
          {/* Tintero gigante */}
          <Path d="M76 120 L79 96 Q80 90 88 90 L112 90 Q120 90 121 96 L124 120 Q100 126 76 120 Z" fill="#3A3F75" {...st(3)} />
          <Rect x={89} y={80} width={22} height={11} rx={3} fill="#2B2F5C" {...st(2.4)} />
          <Rect x={86} y={77} width={28} height={5} rx={2.5} fill="#4A5090" {...st(2)} />
          <Rect x={86} y={100} width={28} height={12} rx={2} fill="#FFF6DD" {...st(1.6)} />
          <Path d="M90 106 q3 -4 6 0 t6 0 t6 0" stroke={b.accent} strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M82 99 Q82 95 86 94" stroke="#FFFFFF" strokeWidth={2} opacity={0.6} fill="none" strokeLinecap="round" />
          <Path d="M121 104 q4 6 2 12" stroke="#2B2F5C" strokeWidth={4} strokeLinecap="round" fill="none" />
        </G>
      );
    case 'arch':
      return (
        <G>
          <Path d="M60 120 Q56 66 100 44 Q144 66 140 120 L122 120 Q122 80 100 70 Q78 80 78 120 Z" fill={b.cliffLight} {...st(3)} />
          <Path d="M100 44 Q144 66 140 120 L122 120 Q122 80 100 70 Z" fill={b.cliffMid} opacity={0.7} />
          <Path d="M66 92 L76 96 M128 84 L136 90 M95 55 L104 59" stroke={INK} strokeWidth={1.4} opacity={0.4} />
          <Path d="M74 60 Q100 38 126 60 Q120 55 113 58 Q106 50 100 56 Q94 50 87 58 Q80 55 74 60 Z" fill={b.grass} {...st(2)} />
          <Palm x={108} y={52} lean={1} s={0.55} />
          {/* Cofre bajo el arco */}
          <Rect x={86} y={102} width={28} height={18} rx={3} fill="#C68B59" {...st(2.4)} />
          <Path d="M86 103 Q86 90 100 90 Q114 90 114 103 Z" fill="#D9A066" {...st(2.4)} />
          <Rect x={92} y={90.5} width={4} height={29} fill="#FFC94D" {...st(1.2)} />
          <Rect x={104} y={90.5} width={4} height={29} fill="#FFC94D" {...st(1.2)} />
          <Rect x={97} y={100} width={6} height={7} rx={1.5} fill="#FFC94D" {...st(1.4)} />
          <Circle cx={82} cy={120} r={4} fill="#FFC94D" {...st(1.4)} />
          <Circle cx={119} cy={121} r={3.5} fill="#FFC94D" {...st(1.4)} />
          <Circle cx={124} cy={118} r={3} fill="#FFE08A" {...st(1.2)} />
          {/* La X del mapa */}
          <Path d="M146 150 l9 6 M155 150 l-9 6" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <Path d="M146 150 l9 6 M155 150 l-9 6" stroke="#E5484D" strokeWidth={3} strokeLinecap="round" />
        </G>
      );
    case 'colosseum': {
      const arches = Array.from({ length: 7 }).map((_, i) => 62 + i * 11.4);
      const sag = (x: number) => 7 * (1 - Math.pow((x + 4 - 100) / 46, 2));
      return (
        <G>
          <Path d="M56 120 L58 74 Q100 58 142 74 L144 120 Q100 132 56 120 Z" fill={b.cliffLight} {...st(3)} />
          <Path d="M100 66 Q122 66 142 74 L144 120 Q124 127 104 128 Z" fill={b.cliffMid} opacity={0.45} />
          <Ellipse cx={100} cy={73} rx={42} ry={10} fill={b.cliffShadow} {...st(2.6)} />
          <Ellipse cx={100} cy={76} rx={33} ry={5.5} fill="#F1DFA8" />
          <Path d="M57 97 Q100 112 143 97" stroke={INK} strokeWidth={2} fill="none" />
          {arches.map((x) => {
            const d = sag(x);
            return (
              <G key={x}>
                <Path d={`M${x} ${93 + d} V${84 + d} Q${x + 4} ${79 + d} ${x + 8} ${84 + d} V${93 + d} Z`} fill={b.cliffShadow} {...st(1.4)} />
                <Path d={`M${x} ${115 + d} V${106 + d} Q${x + 4} ${101 + d} ${x + 8} ${106 + d} V${115 + d} Z`} fill={b.cliffShadow} {...st(1.4)} />
              </G>
            );
          })}
          {[[62, 70, b.accent], [100, 63, '#FFC94D'], [138, 70, '#FF5A6E']].map(([x, y, c]) => (
            <G key={String(x)}>
              <Path d={`M${x} ${y} V${(y as number) - 16}`} stroke={INK} strokeWidth={2} />
              <Path d={`M${(x as number) + 1} ${(y as number) - 16} L${(x as number) + 12} ${(y as number) - 12} L${(x as number) + 1} ${(y as number) - 8} Z`} fill={c as string} {...st(1.6)} />
            </G>
          ))}
        </G>
      );
    }
    case 'lighthouse':
      return (
        <G>
          {/* Muelle */}
          <Polygon points="146,148 190,160 188,167 144,155" fill="#C68B59" {...st(2)} />
          <Path d="M156 151 l-1.5 7 M168 154 l-1.5 7 M180 157 l-1.5 7" stroke={INK} strokeWidth={1.3} opacity={0.6} />
          <Path d="M150 156 V166 M186 166 V176" stroke={INK} strokeWidth={3} strokeLinecap="round" />
          {/* Casita del farero */}
          <Rect x={122} y={106} width={18} height={14} fill="#FFF3E0" {...st(2)} />
          <Polygon points="119,107 131,96 143,107" fill={b.accent} {...st(2)} />
          <Rect x={128} y={111} width={6} height={9} fill="#8B5A2B" {...st(1.4)} />
          {/* Torre */}
          <Path d="M88 120 L93 42 L107 42 L112 120 Z" fill="#FFFFFF" {...st(3)} />
          <Polygon points="89.6,96 90.6,82 109.4,82 110.4,96" fill="#FF5A6E" {...st(1.6)} />
          <Polygon points="91.4,68 92.2,56 107.8,56 108.6,68" fill="#FF5A6E" {...st(1.6)} />
          <Path d="M100 42 L107 42 L112 120 L101 120 Z" fill={INK} opacity={0.08} />
          <Path d="M96 120 V111 Q100 107 104 111 V120 Z" fill="#8B5A2B" {...st(1.6)} />
          <Rect x={87} y={36} width={26} height={6} rx={2} fill="#3B4462" {...st(2)} />
          <Rect x={93} y={22} width={14} height={14} fill="#FFE08A" {...st(2)} />
          <Path d="M97.6 22 V36 M102.4 22 V36" stroke={INK} strokeWidth={1.3} />
          <Path d="M91 23 Q100 10 109 23 Z" fill="#FF5A6E" {...st(2)} />
          <Circle cx={100} cy={12} r={2.2} fill="#FFC94D" {...st(1.4)} />
        </G>
      );
    default:
      return (
        <G>
          <Rect x={68} y={108} width={64} height={9} rx={2} fill="#FFE7A0" {...st(2)} />
          <Rect x={74} y={100} width={52} height={9} rx={2} fill="#FFF0BF" {...st(2)} />
          <Rect x={80} y={70} width={40} height={30} fill="#E9B949" opacity={0.6} />
          {[80, 92, 104, 116].map((x) => (
            <Rect key={x} x={x} y={70} width={6} height={30} fill="#FFF6DA" {...st(1.8)} />
          ))}
          <Rect x={72} y={64} width={56} height={7} rx={1.5} fill="#FFD166" {...st(2)} />
          <Polygon points="70,65 100,44 130,65" fill="#FFC94D" {...st(2.4)} />
          <Circle cx={100} cy={57} r={4} fill="#FFFFFF" {...st(1.4)} />
          <Path d="M87 44 L89 29 L95 37 L100 25 L105 37 L111 29 L113 44 Z" fill="#FFC94D" {...st(2)} />
          <Circle cx={100} cy={38} r={2.4} fill="#FF5A6E" {...st(1)} />
          <Circle cx={92} cy={40} r={1.8} fill="#6CB8FF" {...st(1)} />
          <Circle cx={108} cy={40} r={1.8} fill="#6CB8FF" {...st(1)} />
        </G>
      );
  }
}

/** Partes animadas de cada monumento. */
function LandmarkFx({ b, size, fx, ring }: { b: BiomePalette; size: number; fx: Animated.Value; ring: Animated.Value }) {
  const st = (w = 2) => ({ stroke: INK, strokeWidth: w, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const });
  const twinkle = (pts: Array<[number, number, number]>) => (
    <FxLayer size={size} style={{ opacity: fx.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }) }}>
      {pts.map(([x, y, r], i) => (
        <Path key={i} d={sparkle(x, y, r)} fill="#FFF3B0" {...st(1.2)} />
      ))}
    </FxLayer>
  );
  switch (b.landmark) {
    case 'conch':
      return (
        <PivotLayer
          size={size}
          x={128}
          y={100}
          r={18}
          style={{
            opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.35] }) }],
          }}
        >
          <Path d="M124 92 Q130 100 124 108 M130 87 Q139 100 130 113" stroke={b.accent} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </PivotLayer>
      );
    case 'bell':
      return (
        <PivotLayer
          size={size}
          x={100}
          y={21}
          r={26}
          style={{ transform: [{ rotate: fx.interpolate({ inputRange: [0, 1], outputRange: ['-13deg', '13deg'] }) }] }}
        >
          <Path d="M100 21 V26" stroke={INK} strokeWidth={2} />
          <Path d="M91 41 Q91 27 100 26 Q109 27 109 41 L112 43 L88 43 Z" fill="#FFC94D" {...st(2.2)} />
          <Path d="M94 39 Q94 31 99 29" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.75} fill="none" />
          <Circle cx={100} cy={44.5} r={2.2} fill="#B8860B" {...st(1.4)} />
        </PivotLayer>
      );
    case 'tree':
      return (
        <PivotLayer
          size={size}
          x={154}
          y={72}
          r={14}
          style={{
            transform: [
              { translateY: fx.interpolate({ inputRange: [0, 1], outputRange: [0, -5 * (size / VB_W)] }) },
              { rotate: fx.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) },
            ],
          }}
        >
          <Path d="M144 70 Q149 66 154 69 Q159 66 164 70 L164 80 Q159 76 154 79 Q149 76 144 80 Z" fill="#FFFFFF" {...st(1.8)} />
          <Path d="M154 69 V79 M147 72 H151 M157 72 H161 M147 75 H151 M157 75 H161" stroke={INK} strokeWidth={1} />
        </PivotLayer>
      );
    case 'quill':
      return (
        <PivotLayer
          size={size}
          x={100}
          y={82}
          r={76}
          style={{ transform: [{ rotate: fx.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '5deg'] }) }] }}
        >
          <Path d="M100 81 Q112 56 128 36 Q140 20 156 9 Q151 28 141 44 Q125 66 103 83 Z" fill="#FFF4DC" {...st(2.6)} />
          <Path d="M156 9 Q151 28 141 44 Q125 66 103 83 Q118 62 130 44 Q142 26 156 9 Z" fill={b.accent} opacity={0.85} />
          <Path d="M101 83 Q125 50 156 9" stroke={INK} strokeWidth={1.6} fill="none" />
          <Path d="M131 40 l6 1.5 M119 55 l6 1.5 M142 26 l5 1" stroke={INK} strokeWidth={1.5} />
          <Path d="M98 80 L101 86 L104 80 Z" fill="#FFC94D" {...st(1.4)} />
        </PivotLayer>
      );
    case 'arch':
      return twinkle([[84, 88, 5], [118, 86, 4], [100, 80, 3], [72, 112, 3]]);
    case 'colosseum':
      return twinkle([[50, 60, 4], [150, 56, 5], [100, 38, 4], [80, 46, 3]]);
    case 'lighthouse':
      return (
        <>
          <PivotLayer
            size={size}
            x={100}
            y={29}
            r={64}
            style={{
              opacity: fx.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }),
              transform: [{ rotate: fx.interpolate({ inputRange: [0, 1], outputRange: ['-16deg', '16deg'] }) }],
            }}
          >
            <Path d="M100 29 L162 14 L162 44 Z" fill="#FFF3B0" opacity={0.7} />
            <Path d="M100 29 L38 14 L38 44 Z" fill="#FFF3B0" opacity={0.7} />
          </PivotLayer>
          <PivotLayer
            size={size}
            x={40}
            y={170}
            r={20}
            style={{
              transform: [
                { translateY: fx.interpolate({ inputRange: [0, 1], outputRange: [0, -2.5 * (size / VB_W)] }) },
                { rotate: fx.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
              ],
            }}
          >
            <Path d="M26 172 L54 172 L48 180 L32 180 Z" fill="#B5603A" {...st(2)} />
            <Path d="M40 172 V152" stroke={INK} strokeWidth={2} />
            <Path d="M41 154 L53 169 L41 169 Z" fill="#FFFFFF" {...st(1.6)} />
            <Path d="M41 162 L47 162" stroke={b.accent} strokeWidth={2} />
            <Path d="M40 152 L33 155 L40 157 Z" fill="#FF5A6E" {...st(1.2)} />
          </PivotLayer>
        </>
      );
    default:
      return twinkle([[56, 50, 4], [146, 44, 5], [100, 14, 4], [132, 90, 3]]);
  }
}

/* ------------------------------------------------------------------ */
/* Isla                                                                */
/* ------------------------------------------------------------------ */

export function FloatingIslandArt({
  biomeKey,
  illustrationKind,
  size = 156,
  done = false,
  active = false,
  upcoming = false,
  floatPhase = 0,
}: {
  biomeKey: IslandBiomeKey;
  illustrationKind?: TopicIllustrationKind;
  size?: number;
  done?: boolean;
  active?: boolean;
  upcoming?: boolean;
  floatPhase?: number;
}) {
  const b = BIOME_PALETTES[biomeKey];
  const skyIsland = b.landmark === 'temple';
  const k = size / VB_W;
  const h = size * (VB_H / VB_W);
  const bob = useFloat(2300 + (floatPhase % 3) * 260);
  const wave = useFloat(1500 + (floatPhase % 2) * 260);
  const fx = useFloat(b.landmark === 'bell' ? 1100 : b.landmark === 'lighthouse' ? 1800 : 1300);
  const ring = useCycle(1700);
  const flap = useFloat(260 + (floatPhase % 3) * 40);
  const gid = `isl-${biomeKey}`;
  const kind = illustrationKind ?? resolveTopicIllustration('', biomeKey);
  const rock = [b.cliffLight, b.cliffMid, b.cliffShadow] as const;
  const sticker = Math.round(size * 0.25);

  return (
    <Animated.View
      style={{
        width: size,
        height: h,
        opacity: upcoming && !done ? 0.96 : 1,
        transform: [{ translateY: skyIsland ? bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) : 0 }],
      }}
    >
      {/* Anillo pulsante de la isla activa, sobre el agua */}
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeRing,
            {
              left: size * 0.04,
              top: 150 * k - size * 0.15,
              width: size * 0.92,
              height: size * 0.3,
              borderColor: skyIsland ? b.accent : '#FFFFFF',
              opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0.15] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1.1] }) }],
            },
          ]}
        />
      ) : null}

      <Svg width={size} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <SvgGradient id={`${gid}-top`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={b.topColors[0]} />
            <Stop offset="1" stopColor={b.topColors[1]} />
          </SvgGradient>
          <SvgGradient id={`${gid}-sea`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8BE6FF" />
            <Stop offset="1" stopColor="#2F9FEA" />
          </SvgGradient>
        </Defs>

        {skyIsland ? (
          <G>
            <Ellipse cx={100} cy={188} rx={46} ry={5} fill="rgba(30,36,54,0.10)" />
            {/* Roca invertida flotando en el cielo */}
            <Polygon points="44,116 76,150 100,184 100,128" fill={rock[0]} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <Polygon points="100,128 100,184 124,150 156,116" fill={rock[1]} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <Path d="M58 130 L80 140 L98 142 M104 142 L124 136 L142 128 M84 158 L98 162" stroke={INK} strokeWidth={1.2} opacity={0.35} fill="none" />
            <Path d="M66 124 q-3 12 2 20 M134 124 q4 12 -1 22" stroke="#3B9C5E" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          </G>
        ) : (
          <G>
            {/* Mar propio con laguna, espuma y arrecifes */}
            <Ellipse cx={100} cy={164} rx={98} ry={30} fill={`url(#${gid}-sea)`} stroke={INK} strokeWidth={2.5} />
            <Ellipse cx={100} cy={158} rx={84} ry={22} fill="#B4F1FF" opacity={0.55} />
            <Ellipse cx={100} cy={152} rx={81} ry={19} fill="none" stroke="#FFFFFF" strokeWidth={3} strokeDasharray="10 7" strokeLinecap="round" opacity={0.9} />
            <Path d="M12 168 l6 -7 l7 5 l-2 5 z" fill={rock[1]} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            <Path d="M180 176 l5 -6 l6 6 l-3 4 z" fill={rock[2]} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            {/* Playa */}
            <Ellipse cx={100} cy={150} rx={76} ry={17} fill="#E9C98A" stroke={INK} strokeWidth={2.4} />
            <Ellipse cx={100} cy={146.5} rx={74} ry={15} fill={b.sand} />
            <Path d="M40 150 q4 -2 8 0 M150 156 q4 -2 8 0 M62 158 q3 -2 6 0" stroke="#D9B26A" strokeWidth={1.4} fill="none" strokeLinecap="round" />
            {/* Acantilado facetado */}
            <Polygon points="46,116 40,134 62,148 100,152 100,128" fill={rock[0]} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <Polygon points="100,128 100,152 138,148 160,134 154,116" fill={rock[1]} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
            <Path d="M50 128 L74 137 L98 139 M106 139 L132 135 L152 126" stroke={INK} strokeWidth={1.2} opacity={0.35} fill="none" />
            <Path d="M92 150 L97 146 L103 150" fill="none" stroke={rock[2]} strokeWidth={2} strokeLinecap="round" />
          </G>
        )}

        {/* Borde de pasto con goteo + meseta */}
        <Path
          d="M44 116 Q100 142 156 116 L156 122 Q150 128 142 124 Q132 132 122 127 Q112 134 100 129 Q88 134 78 127 Q68 132 58 124 Q50 128 44 122 Z"
          fill={b.grass}
          stroke={INK}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
        <Ellipse cx={100} cy={114} rx={56} ry={15} fill={`url(#${gid}-top)`} stroke={INK} strokeWidth={2.6} />
        <Ellipse cx={86} cy={109} rx={26} ry={5} fill="#FFFFFF" opacity={0.3} />

        <DecorSet decor={b.decor} />
        <Landmark b={b} />

        {skyIsland ? (
          <G>
            {/* Mar de nubes */}
            {[[52, 166, 18], [76, 174, 20], [104, 178, 22], [132, 172, 19], [154, 164, 15], [30, 160, 12], [174, 156, 11]].map(([x, y, r], i) => (
              <Circle key={`o${i}`} cx={x} cy={y} r={r} fill={INK} stroke={INK} strokeWidth={5} />
            ))}
            {[[52, 166, 18], [76, 174, 20], [104, 178, 22], [132, 172, 19], [154, 164, 15], [30, 160, 12], [174, 156, 11]].map(([x, y, r], i) => (
              <Circle key={`f${i}`} cx={x} cy={y} r={r} fill={i % 2 ? '#F4FAFF' : '#FFFFFF'} />
            ))}
            <Path d="M40 176 Q100 192 166 174" stroke="#CFE6FF" strokeWidth={6} fill="none" strokeLinecap="round" />
          </G>
        ) : null}

        {/* Mástil de la bandera de isla completada */}
        {done ? <Path d="M58 116 V84" stroke={INK} strokeWidth={2.6} strokeLinecap="round" /> : null}
      </Svg>

      {/* Olas que se mecen */}
      {!skyIsland ? (
        <>
          <FxLayer
            size={size}
            style={{
              opacity: wave.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [-3 * k, 3 * k] }) }],
            }}
          >
            <Path d="M18 178 q3 -3 6 0 q3 -3 6 0 M60 188 q3 -3 6 0 q3 -3 6 0 M134 188 q3 -3 6 0 q3 -3 6 0 M170 170 q3 -3 6 0" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />
          </FxLayer>
          <FxLayer
            size={size}
            style={{
              opacity: wave.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
              transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [3 * k, -3 * k] }) }],
            }}
          >
            <Path d="M34 186 q3 -3 6 0 q3 -3 6 0 M98 191 q3 -3 6 0 q3 -3 6 0 M156 182 q3 -3 6 0 q3 -3 6 0 M8 160 q3 -3 6 0" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />
          </FxLayer>
        </>
      ) : null}

      <LandmarkFx b={b} size={size} fx={fx} ring={ring} />

      {/* Gaviota */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 150 * k,
          top: 22 * k,
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6 * k] }) },
            { translateX: bob.interpolate({ inputRange: [0, 1], outputRange: [0, 8 * k] }) },
            { scaleY: flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) },
          ],
        }}
      >
        <Svg width={20 * k} height={8 * k} viewBox="0 0 20 8">
          <Path d="M1 6 Q5.5 0 10 5.5 Q14.5 0 19 6" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* Bandera ondeando cuando la isla está completa */}
      {done ? (
        <PivotLayer size={size} x={58} y={89} r={16} style={{ transform: [{ scaleX: flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.82] }) }] }}>
          <Path d="M59 84 L73 88 L59 94 Z" fill="#22B567" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
          <Circle cx={64} cy={89} r={2} fill="#FFE08A" />
        </PivotLayer>
      ) : null}

      {/* Cartel con el tema de la isla */}
      <View pointerEvents="none" style={[styles.signWrap, { left: 30 * k - sticker / 2 - 4, top: 128 * k - sticker / 2 }]}>
        <View style={[styles.signBoard, { width: sticker + 8, height: sticker + 8 }]}>
          <CustomTopicIllustration kind={kind} size={sticker} />
        </View>
        <View style={styles.signPost} />
        {done ? (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Ruta marina punteada (como en un mapa del tesoro)                   */
/* ------------------------------------------------------------------ */

function bezier(t: number, p0: number[], p1: number[], p2: number[], p3: number[]) {
  const u = 1 - t;
  const x = u * u * u * p0[0]! + 3 * u * u * t * p1[0]! + 3 * u * t * t * p2[0]! + t * t * t * p3[0]!;
  const y = u * u * u * p0[1]! + 3 * u * u * t * p1[1]! + 3 * u * t * t * p2[1]! + t * t * t * p3[1]!;
  return [x, y] as const;
}

export function SkyBridgeConnector({ fromLeft, lit = false }: { fromLeft: boolean; lit?: boolean }) {
  const p0 = fromLeft ? [62, 6] : [148, 6];
  const p3 = fromLeft ? [148, 56] : [62, 56];
  const p1 = fromLeft ? [96, 34] : [114, 34];
  const p2 = fromLeft ? [120, 30] : [90, 30];
  const boat = useMemo(() => {
    const [x, y] = bezier(0.5, p0, p1, p2, p3);
    return { x, y };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLeft]);
  const bob = useFloat(900);
  const d = `M ${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
  return (
    <View style={styles.bridgeWrap} pointerEvents="none">
      <Svg width={210} height={62} viewBox="0 0 210 62">
        <Path d="M20 20 q3 -3 6 0 q3 -3 6 0 M176 44 q3 -3 6 0 q3 -3 6 0 M30 50 q3 -3 6 0" stroke="#FFFFFF" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.7} />
        {lit ? (
          <>
            <Path d={d} stroke={INK} strokeWidth={7.5} strokeDasharray="0.1 11" strokeLinecap="round" fill="none" />
            <Path d={d} stroke="#FFC94D" strokeWidth={4.5} strokeDasharray="0.1 11" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <Path d={d} stroke="#FFFFFF" strokeWidth={4} strokeDasharray="0.1 11" strokeLinecap="round" fill="none" opacity={0.8} />
        )}
      </Svg>
      {lit ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: boat.x - 12,
            top: boat.y - 22,
            transform: [
              { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
              { rotate: bob.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) },
            ],
          }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M2 15 L22 15 L18 21 L6 21 Z" fill="#B5603A" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
            <Path d="M12 15 V3" stroke={INK} strokeWidth={1.6} />
            <Path d="M12.5 4 L20 13 L12.5 13 Z" fill="#FFFFFF" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
            <Path d="M12 3 L7 5 L12 7 Z" fill="#FF5A6E" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Nodo de isla de la ruta                                             */
/* ------------------------------------------------------------------ */

export function FloatingIslandQuestNode({
  index,
  biomeKey,
  stepLabel,
  title,
  level,
  done = false,
  active = false,
  showCompanion = false,
  illustrationKind,
  onPress,
}: {
  index: number;
  biomeKey: IslandBiomeKey;
  stepLabel?: string;
  title: string;
  subtitle?: string;
  level?: PracticeLevel;
  xpReward?: number;
  done?: boolean;
  active?: boolean;
  showCompanion?: boolean;
  illustrationKind?: TopicIllustrationKind;
  onPress: () => void;
}) {
  const { pet, mood, stats, petThePet, setTab } = useGame();
  const b = BIOME_PALETTES[biomeKey];
  const isLeft = index % 2 === 0;
  const effectiveLevel: PracticeLevel = level ?? 'B1';
  const lvlMeta = CEFR_LEVEL_META[effectiveLevel];
  const tilt = useTiltOffset(active ? 7 : 4);
  const hop = useFloat(520);
  const cleanTitle = title.replace(/^[^\w¡¿ÁÉÍÓÚáéíóúÑñ"'“”]+\s*/, '').trim() || title;
  const kind = illustrationKind ?? resolveTopicIllustration(cleanTitle, biomeKey);
  const upcoming = !done && !active;
  const companionHere = showCompanion && active;

  return (
    <Animated.View
      style={[
        styles.row,
        isLeft ? styles.rowLeft : styles.rowRight,
        { transform: [{ translateX: tilt.x }, { translateY: tilt.y }] },
      ]}
    >
      <PressableScale onPress={onPress} scaleTo={0.94} hapticKind="select" style={styles.islandTouch}>
        {active ? (
          <Animated.View
            style={[
              styles.startTag,
              { backgroundColor: b.accent, transform: [{ translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] },
            ]}
          >
            <Text style={styles.startTagText}>¡EMPIEZA!</Text>
            <View style={[styles.startTagTip, { borderTopColor: b.accent }]} />
          </Animated.View>
        ) : null}
        <FloatingIslandArt
          biomeKey={biomeKey}
          illustrationKind={kind}
          size={active ? 184 : 166}
          done={done}
          active={active}
          upcoming={upcoming}
          floatPhase={index}
        />
        <View
          style={[
            styles.plaque,
            active && { borderColor: b.accent, borderBottomColor: b.accent },
            done && { borderColor: THEME.green, borderBottomColor: '#168A4C', backgroundColor: '#F2FFF8' },
          ]}
        >
          <View style={styles.plaqueTop}>
            <View style={[styles.stepCoin, { backgroundColor: done ? THEME.green : active ? b.accent : '#CBD5E8' }]}>
              {done ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : <Text style={styles.stepCoinText}>{index + 1}</Text>}
            </View>
            <Text style={styles.plaqueTitle} numberOfLines={1}>
              {cleanTitle}
            </Text>
          </View>
          <View style={styles.plaqueBottom}>
            <View style={[styles.levelPill, { backgroundColor: `${lvlMeta.color}1A` }]}>
              <View style={[styles.levelDot, { backgroundColor: lvlMeta.color }]} />
              <Text style={[styles.levelText, { color: lvlMeta.color }]}>
                {effectiveLevel} · {LEVEL_DIFFICULTY_ES[effectiveLevel]}
              </Text>
            </View>
            {stepLabel ? <Text style={styles.stepLabel} numberOfLines={1}>{stepLabel.split('·')[1]?.trim() ?? ''}</Text> : null}
          </View>
        </View>
      </PressableScale>

      {companionHere ? (
        <View style={styles.companion}>
          <View style={styles.companionBubble}>
            <Text style={styles.companionBubbleText} numberOfLines={1}>
              ¡Vamos aquí!
            </Text>
          </View>
          <View style={styles.porthole}>
            <View style={styles.portholeInner}>
              <Pet3D config={pet} mood={mood} size={96} energy={stats.energy / 100} onTap={petThePet} backgroundColor="#CDEFFF" />
            </View>
          </View>
          <PressableScale onPress={() => setTab('pet')} hapticKind="select" style={styles.companionTag}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Glyph name={`species-${pet.species}`} size={14} />
              <Text style={styles.companionTagText}>{pet.name}</Text>
            </View>
          </PressableScale>
        </View>
      ) : null}
    </Animated.View>
  );
}


/* ------------------------------------------------------------------ */
/* Cofre final de la ruta (en su banco de arena)                       */
/* ------------------------------------------------------------------ */

export function RouteChestNode({ done, onPress }: { done: boolean; onPress?: () => void }) {
  const wobble = useFloat(done ? 1400 : 380);
  return (
    <PressableScale onPress={onPress} style={styles.chestWrap} hapticKind="medium">
      <View style={styles.chestIsland}>
        <Svg width={170} height={56} viewBox="0 0 170 56" style={StyleSheet.absoluteFill}>
          <Ellipse cx={85} cy={36} rx={80} ry={17} fill="#7FE0FF" stroke={INK} strokeWidth={2.2} />
          <Ellipse cx={85} cy={32} rx={62} ry={12} fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeDasharray="8 6" strokeLinecap="round" />
          <Ellipse cx={85} cy={30} rx={50} ry={11} fill="#E9C98A" stroke={INK} strokeWidth={2.2} />
          <Ellipse cx={85} cy={28} rx={48} ry={9} fill="#FFE6A8" />
        </Svg>
        <View style={styles.chestPalm}>
          <Svg width={40} height={49} viewBox="22 70 44 54">
            <Palm x={34} y={122} lean={1} />
          </Svg>
        </View>
        <Animated.View
          style={{
            marginBottom: 14,
            transform: [
              { rotate: wobble.interpolate({ inputRange: [0, 1], outputRange: done ? ['0deg', '0deg'] : ['-4deg', '4deg'] }) },
              { scale: wobble.interpolate({ inputRange: [0, 1], outputRange: done ? [1, 1.06] : [1, 1] }) },
            ],
          }}
        >
          <Glyph name={done ? 'gift' : 'chest'} size={70} />
        </Animated.View>
      </View>
      <View style={[styles.chestLabel, done && { backgroundColor: '#FFF1C2', borderColor: '#E9C46A' }]}>
        <Text style={styles.chestLabelText}>{done ? '¡Ruta completa! Bonus de meta diaria' : 'Tesoro al final de la ruta'}</Text>
      </View>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ */
/* Fondo: cielo con horizonte y gran océano con destellos              */
/* ------------------------------------------------------------------ */

function Cloud({ top, width, duration, delay, opacity }: { top: number; width: number; duration: number; delay: number; opacity: number }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(x, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: NATIVE }),
        Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [x, duration, delay]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top,
        left: 0,
        opacity,
        transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [-width, 420] }) }],
      }}
    >
      <Svg width={width} height={width * 0.45} viewBox="0 0 100 45">
        <Path d="M10 40 Q4 40 4 33 Q4 25 13 25 Q15 13 29 14 Q36 3 52 8 Q64 2 72 14 Q88 12 90 26 Q97 28 96 35 Q95 40 88 40 Z" fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

const SEA_MARKS = Array.from({ length: 34 }).map((_, i) => ({
  top: 190 + i * 74 + ((i * 29) % 30),
  left: `${4 + ((i * 37) % 86)}%` as const,
  w: 14 + ((i * 7) % 3) * 4,
  even: i % 2 === 0,
}));

function SeaShimmer() {
  const v = useFloat(1700);
  const layer = (even: boolean) => (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: v.interpolate({ inputRange: [0, 1], outputRange: even ? [0.25, 0.85] : [0.85, 0.25] }),
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: even ? [-3, 3] : [3, -3] }) }],
        },
      ]}
    >
      {SEA_MARKS.filter((m) => m.even === even).map((m, i) => (
        <View key={i} style={{ position: 'absolute', top: m.top, left: m.left }}>
          <Svg width={m.w} height={6} viewBox="0 0 18 6">
            <Path d="M1 5 Q4.5 0 9 4 Q13.5 0 17 5" stroke="#FFFFFF" strokeWidth={2} fill="none" strokeLinecap="round" />
          </Svg>
        </View>
      ))}
    </Animated.View>
  );
  return (
    <>
      {layer(true)}
      {layer(false)}
    </>
  );
}

export function IslandSkyBackdrop({
  children,
  topColor = '#DDF0FF',
  style,
}: {
  children: React.ReactNode;
  topColor?: string;
  /** Se mantiene por compatibilidad; el océano usa su propia paleta. */
  bottomColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.sky, style]}>
      <LinearGradient
        colors={[topColor, '#CFF3FF', '#7FDBF8', '#45B8EE', '#2C8FD8']}
        locations={[0, 0.05, 0.085, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Islas lejanas en el horizonte */}
      <View pointerEvents="none" style={styles.horizon}>
        <Svg width="100%" height={56} viewBox="0 0 400 56" preserveAspectRatio="none">
          <Path d="M10 56 Q34 24 62 40 Q76 30 92 56 Z" fill="#8FCFE6" />
          <Path d="M250 56 L274 18 L284 26 L300 12 L330 56 Z" fill="#8FCFE6" />
          <Path d="M296 13 L300 4 L304 13" stroke="#8FCFE6" strokeWidth={3} fill="none" />
          <Path d="M150 56 Q170 40 196 50 Q206 44 214 56 Z" fill="#A9DCEE" />
          <Path d="M0 54 H400" stroke="#FFFFFF" strokeWidth={2} opacity={0.7} />
        </Svg>
      </View>
      <Cloud top={8} width={110} duration={38000} delay={0} opacity={0.9} />
      <Cloud top={46} width={70} duration={30000} delay={9000} opacity={0.75} />
      <SeaShimmer />
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Cabecera de mundo                                                   */
/* ------------------------------------------------------------------ */

export function WorldBiomeHeader({
  biomeKey,
  description,
  totalCount,
}: {
  biomeKey: IslandBiomeKey;
  description: string;
  totalCount: number;
}) {
  const b = BIOME_PALETTES[biomeKey];
  return (
    <LinearGradient colors={[b.topColors[1], b.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.worldBanner, SHADOW.card]}>
      <View style={styles.worldBannerInfo}>
        <View style={styles.worldBadge}>
          <MaterialCommunityIcons name="island" size={13} color="#FFFFFF" />
          <Text style={styles.worldBadgeText}>
            {b.worldTagEs} · {totalCount} ISLAS
          </Text>
        </View>
        <Text style={styles.worldBannerTitle}>{b.worldNameEs}</Text>
        <Text style={styles.worldBannerDesc}>{description}</Text>
      </View>
      <View style={{ width: 92, height: 90, alignItems: 'center', justifyContent: 'center' }}>
        <FloatingIslandArt biomeKey={biomeKey} size={92} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  activeRing: { position: 'absolute', borderRadius: 999, borderWidth: 3, borderStyle: 'dashed' },
  signWrap: { position: 'absolute', alignItems: 'center' },
  signBoard: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#C68B59',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  signPost: { width: 5, height: 10, backgroundColor: '#A0703C', borderWidth: 1.4, borderColor: INK, borderTopWidth: 0 },
  porthole: { padding: 4, borderRadius: 999, backgroundColor: '#E9C46A', borderWidth: 2.2, borderColor: INK },
  portholeInner: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', borderWidth: 2, borderColor: '#B8892E' },
  doneBadge: {
    position: 'absolute',
    right: -6,
    top: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.green,
    borderWidth: 2,
    borderColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bridgeWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: -8 },
  row: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 4 },
  rowLeft: { paddingRight: 26 },
  rowRight: { flexDirection: 'row-reverse', paddingLeft: 26 },
  islandTouch: { alignItems: 'center', justifyContent: 'center', maxWidth: 230 },
  startTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: INK,
    marginBottom: -4,
    zIndex: 6,
  },
  startTagText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  startTagTip: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  plaque: {
    marginTop: -4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2.2,
    borderColor: INK,
    borderBottomWidth: 5,
    gap: 5,
    minWidth: 172,
    maxWidth: 228,
  },
  plaqueTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stepCoin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: INK,
  },
  stepCoinText: { fontSize: 11, fontWeight: '900', color: '#FFFFFF' },
  plaqueTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: THEME.ink, letterSpacing: -0.2 },
  plaqueBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  levelPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  levelDot: { width: 7, height: 7, borderRadius: 4 },
  levelText: { fontSize: 11, fontWeight: '800' },
  stepLabel: { fontSize: 10, fontWeight: '800', color: THEME.ink3, flexShrink: 1 },
  companion: { alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  companionBubble: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: INK,
    marginBottom: -8,
    zIndex: 4,
  },
  companionBubbleText: { fontSize: 10, fontWeight: '800', color: THEME.ink },
  companionTag: {
    marginTop: -4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1.8,
    borderColor: INK,
  },
  companionTagText: { fontSize: 11, fontWeight: '800', color: THEME.ink },
  chestWrap: { alignItems: 'center', gap: 4, paddingVertical: 10 },
  chestIsland: { width: 170, height: 88, alignItems: 'center', justifyContent: 'flex-end' },
  chestPalm: { position: 'absolute', right: 18, bottom: 14 },
  chestLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 4,
  },
  chestLabelText: { fontSize: 12, fontWeight: '800', color: THEME.ink },
  sky: { borderRadius: 30, overflow: 'hidden', paddingVertical: 14, paddingHorizontal: 6 },
  horizon: { position: 'absolute', left: 0, right: 0, top: 44 },
  worldBanner: {
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2.2,
    borderColor: INK,
    borderBottomWidth: 5,
  },
  worldBannerInfo: { flex: 1, gap: 3 },
  worldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  worldBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },
  worldBannerTitle: { fontSize: 19, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.4 },
  worldBannerDesc: { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.94)' },
});
