import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { Text } from '../i18n';
import {
  ACCESSORIES,
  BELLY_COLORS,
  BLUSH_STYLES,
  BODY_COLORS,
  BROW_STYLES,
  EAR_STYLES,
  EYE_COLORS,
  EYE_STYLES,
  FACE_SHAPES,
  FACIAL_HAIR,
  FAVORITE_COLORS,
  GLASSES_COLORS,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  LIP_COLORS,
  MOUTH_STYLES,
  NOSE_STYLES,
  OUTFITS,
  PANTS_COLORS,
  PANTS_STYLES,
  PERSONALITIES,
  SKIN_TONES,
  SPECIES,
  SPECIES_PRESET_COLORS,
  SUGGESTED_CATCHPHRASES,
  TUNING_MAX,
  TUNING_MIN,
  VOICE_PRESETS,
  type FaceTuning,
  type PetConfig,
  type PetMood,
} from '../game/pet';
import { Pet3D } from './Pet3D';
import { Glyph } from './Glyph';
import { haptic, PressableScale } from './motion';
import { SHADOW, THEME } from '../theme/colors';

/**
 * Creador de personajes estilo Mii Maker / Tomodachi Life:
 * categorías grandes, rejilla de piezas, paleta de colores y ajustes finos (tamaño, altura,
 * separación) con flechas. La cámara se acerca a la cara al editar rasgos.
 * Todo el catálogo es apto para todo público.
 */

export type MiiCategory =
  | 'body'
  | 'face'
  | 'hair'
  | 'brows'
  | 'eyes'
  | 'nose'
  | 'mouth'
  | 'beard'
  | 'glasses'
  | 'clothes'
  | 'hats'
  | 'voice';

const INK = '#1E2436';
const FACE_CATEGORIES: MiiCategory[] = ['face', 'hair', 'brows', 'eyes', 'nose', 'mouth', 'beard', 'glasses'];

const CATEGORIES: Array<{ id: MiiCategory; label: string; tint: string }> = [
  { id: 'body', label: 'Cuerpo', tint: '#5B8CFF' },
  { id: 'face', label: 'Cara', tint: '#FF9F6B' },
  { id: 'hair', label: 'Pelo', tint: '#B07A4A' },
  { id: 'brows', label: 'Cejas', tint: '#7B5CFF' },
  { id: 'eyes', label: 'Ojos', tint: '#2EA8FF' },
  { id: 'nose', label: 'Nariz', tint: '#FF7A8A' },
  { id: 'mouth', label: 'Boca', tint: '#FF4769' },
  { id: 'beard', label: 'Barba', tint: '#8B5A2B' },
  { id: 'glasses', label: 'Gafas', tint: '#1FB5A8' },
  { id: 'clothes', label: 'Ropa', tint: '#22B567' },
  { id: 'hats', label: 'Gorros', tint: '#FF9500' },
  { id: 'voice', label: 'Voz', tint: '#E0559B' },
];

/* ------------------------------------------------------------------ */
/* Íconos de piezas (SVG con contorno de tinta y brillo, estilo sticker) */
/* ------------------------------------------------------------------ */

type IconKind =
  | 'category'
  | 'species'
  | 'face'
  | 'hair'
  | 'brows'
  | 'eyes'
  | 'nose'
  | 'mouth'
  | 'beard'
  | 'glasses'
  | 'cheeks'
  | 'outfit'
  | 'hat';

const faceShapePath = (shape: string) => {
  switch (shape) {
    case 'oval':
      return 'M34 15 C46 15 50 26 50 37 C50 49 43 57 34 57 C25 57 18 49 18 37 C18 26 22 15 34 15 Z';
    case 'square':
      return 'M20 22 C20 17 25 16 34 16 C43 16 48 17 48 22 L49 44 C49 52 44 56 34 56 C24 56 19 52 19 44 Z';
    case 'long':
      return 'M34 12 C45 12 48 24 48 36 C48 50 42 59 34 59 C26 59 20 50 20 36 C20 24 23 12 34 12 Z';
    case 'heart':
      return 'M34 17 C46 17 51 25 51 34 C51 44 42 53 34 58 C26 53 17 44 17 34 C17 25 22 17 34 17 Z';
    case 'wide':
      return 'M34 19 C49 19 54 28 54 37 C54 48 45 55 34 55 C23 55 14 48 14 37 C14 28 19 19 34 19 Z';
    default:
      return 'M34 17 C46 17 51 26 51 37 C51 48 44 56 34 56 C24 56 17 48 17 37 C17 26 22 17 34 17 Z';
  }
};

function HeadBase({ skin, shape = 'round', faint = false }: { skin: string; shape?: string; faint?: boolean }) {
  return (
    <G opacity={faint ? 0.55 : 1}>
      <Circle cx="16.5" cy="38" r="4" fill={skin} stroke={INK} strokeWidth="2" />
      <Circle cx="51.5" cy="38" r="4" fill={skin} stroke={INK} strokeWidth="2" />
      <Path d={faceShapePath(shape)} fill={skin} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <Ellipse cx="27" cy="25" rx="5" ry="2.6" fill="#FFFFFF" opacity={0.45} />
    </G>
  );
}

function GuideFace({ show = { eyes: true, mouth: true, brows: false } }: { show?: { eyes?: boolean; mouth?: boolean; brows?: boolean } }) {
  return (
    <G opacity={0.4}>
      {show.eyes ? (
        <>
          <Ellipse cx="28" cy="38" rx="2" ry="3" fill={INK} />
          <Ellipse cx="40" cy="38" rx="2" ry="3" fill={INK} />
        </>
      ) : null}
      {show.brows ? (
        <>
          <Path d="M24 32 L31 31" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <Path d="M37 31 L44 32" stroke={INK} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : null}
      {show.mouth ? <Path d="M30 48 Q34 51 38 48" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" /> : null}
    </G>
  );
}

function HairShape({ style, color }: { style: string; color: string }) {
  const p = { fill: color, stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  switch (style) {
    case 'spiky':
      return <Polygon points="17,32 13,16 24,24 30,10 36,22 44,11 46,24 55,17 51,32" {...p} />;
    case 'bob':
      return <Path d="M15 44 C13 22 23 15 34 15 C45 15 55 22 53 44 L47 45 L46 29 L22 29 L21 45 Z" {...p} />;
    case 'afro':
      return <Path d="M14 36 C8 26 14 12 26 12 C30 6 40 6 43 12 C55 12 60 26 54 36 C50 30 44 26 34 26 C24 26 18 30 14 36 Z" {...p} />;
    case 'ponytail':
      return (
        <G>
          <Path d="M52 26 C62 30 62 44 56 50 C56 42 54 36 49 32 Z" {...p} />
          <Path d="M17 32 C17 20 25 15 34 15 C43 15 51 20 51 32 C44 26 26 26 17 32 Z" {...p} />
        </G>
      );
    case 'twintails':
      return (
        <G>
          <Path d="M17 30 C8 34 7 48 12 54 C13 46 15 40 19 36 Z" {...p} />
          <Path d="M51 30 C60 34 61 48 56 54 C55 46 53 40 49 36 Z" {...p} />
          <Path d="M17 32 C17 20 25 15 34 15 C43 15 51 20 51 32 C44 27 26 27 17 32 Z" {...p} />
        </G>
      );
    case 'pompadour':
      return <Path d="M18 31 C16 18 26 9 38 10 C48 11 52 18 50 31 C46 24 38 22 30 24 C24 25 20 27 18 31 Z" {...p} />;
    case 'curly':
      return (
        <G>
          {[18, 24, 30, 36, 42, 48].map((x, i) => (
            <Circle key={x} cx={x + 1} cy={i % 2 ? 19 : 23} r="6" {...p} />
          ))}
        </G>
      );
    case 'mohawk':
      return <Polygon points="30,30 28,8 34,4 40,8 38,30" {...p} />;
    case 'bun':
      return (
        <G>
          <Circle cx="34" cy="11" r="6.5" {...p} />
          <Path d="M17 31 C17 20 25 16 34 16 C43 16 51 20 51 31 C44 25 26 25 17 31 Z" {...p} />
        </G>
      );
    case 'long':
      return (
        <G>
          <Path d="M15 32 C14 20 24 14 34 14 C44 14 54 20 53 32 L55 60 L45 60 L46 32 L22 32 L23 60 L13 60 Z" {...p} />
        </G>
      );
    case 'short':
      return <Path d="M17 33 C16 20 25 15 34 15 C43 15 52 20 51 33 L48 31 C45 25 38 24 30 26 C25 27 21 29 19 33 Z" {...p} />;
    case 'buzz':
      return <Path d="M17.5 33 C17 21 25 17 34 17 C43 17 51 21 50.5 33 C45 27 23 27 17.5 33 Z" fill={color} stroke={INK} strokeWidth={2.2} opacity={0.85} />;
    case 'sidepart':
      return (
        <G>
          <Path d="M17 33 C16 20 25 15 34 15 C43 15 52 20 51 33 L48 31 C45 25 40 23 36 23 C30 24 24 27 19 33 Z" {...p} />
          <Path d="M24 17.5 L26 25" stroke={INK} strokeWidth="1.4" opacity={0.5} />
        </G>
      );
    case 'wavy':
      return (
        <G>
          <Path d="M15 32 C14 20 24 14 34 14 C44 14 54 20 53 32 C56 38 51 42 54 48 C55 54 49 56 47 52 L46 32 L22 32 L21 52 C19 56 13 54 14 48 C17 42 12 38 15 32 Z" {...p} />
        </G>
      );
    case 'braids':
      return (
        <G>
          {[0, 1, 2, 3].map((i) => (
            <G key={i}>
              <Circle cx={17 - i * 0.5} cy={36 + i * 6} r="3.6" {...p} />
              <Circle cx={51 + i * 0.5} cy={36 + i * 6} r="3.6" {...p} />
            </G>
          ))}
          <Path d="M17 32 C17 20 25 15 34 15 C43 15 51 20 51 32 C44 26 26 26 17 32 Z" {...p} />
          <Path d="M34 16 L34 24" stroke={INK} strokeWidth="1.4" opacity={0.5} />
        </G>
      );
    default:
      return null;
  }
}

function EyesShape({ style, iris }: { style: string; iris: string }) {
  const one = (cx: number, side: number) => {
    switch (style) {
      case 'happy':
        return <Path d={`M${cx - 4} 39 Q${cx} 33 ${cx + 4} 39`} stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
      case 'wink':
        return side > 0 ? (
          <Path d={`M${cx - 4} 38 Q${cx} 34 ${cx + 4} 38`} stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
        ) : (
          <G>
            <Ellipse cx={cx} cy="38" rx="3.4" ry="4.8" fill={INK} />
            <Circle cx={cx - 1} cy="36" r="1.3" fill="#FFF" />
          </G>
        );
      case 'sleepy':
        return (
          <G>
            <Ellipse cx={cx} cy="39" rx="3.6" ry="3" fill={INK} />
            <Path d={`M${cx - 4.5} 37.5 L${cx + 4.5} 37.5`} stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          </G>
        );
      case 'heart':
        return <Path d={`M${cx} 42 C${cx - 6} 37 ${cx - 4} 32 ${cx} 35 C${cx + 4} 32 ${cx + 6} 37 ${cx} 42 Z`} fill="#FF4D79" stroke={INK} strokeWidth="1.6" />;
      case 'cool':
        return (
          <G>
            <Ellipse cx={cx} cy="38.5" rx="4.4" ry="2.6" fill="#FFF" stroke={INK} strokeWidth="1.6" />
            <Circle cx={cx} cy="39" r="1.8" fill={INK} />
            <Path d={`M${cx - 5} 36 L${cx + 5} 36`} stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          </G>
        );
      case 'starry':
        return (
          <G>
            <Ellipse cx={cx} cy="38" rx="3.4" ry="5" fill={INK} />
            <Polygon points={`${cx},35 ${cx + 1.4},38 ${cx},41 ${cx - 1.4},38`} fill="#F4B942" />
          </G>
        );
      case 'fierce':
        return (
          <G>
            <Ellipse cx={cx} cy="38.5" rx="3.2" ry="4" fill={INK} />
            <Path d={`M${cx - 4} ${side < 0 ? 33 : 35} L${cx + 4} ${side < 0 ? 35 : 33}`} stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          </G>
        );
      case 'almond':
      case 'lashes':
      case 'narrow':
      case 'droopy':
      case 'bright':
      case 'calm': {
        const ry = style === 'narrow' ? 2.2 : style === 'almond' ? 3.2 : style === 'bright' ? 5 : 4.2;
        const rx = style === 'almond' ? 5.2 : 4.4;
        const ir = style === 'bright' ? 3.2 : style === 'narrow' ? 1.9 : 2.5;
        return (
          <G>
            <Ellipse cx={cx} cy="38" rx={rx} ry={ry} fill="#FFF" stroke={INK} strokeWidth="1.6" transform={style === 'almond' ? `rotate(${side * -8} ${cx} 38)` : undefined} />
            <Circle cx={cx} cy="38.3" r={Math.min(ir, ry)} fill={iris} />
            <Circle cx={cx} cy="38.3" r={Math.min(ir, ry) * 0.5} fill={INK} />
            <Circle cx={cx - 1} cy="37" r="0.8" fill="#FFF" />
            {style === 'lashes' ? (
              <Path d={`M${cx + side * 3} 34 L${cx + side * 5.5} 31.5 M${cx + side * 1} 33.2 L${cx + side * 2.5} 30.5`} stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
            ) : null}
            {style === 'droopy' || style === 'calm' ? (
              <Path
                d={style === 'calm' ? `M${cx - rx} 37.5 Q${cx} ${38 - ry - 1} ${cx + rx} 37.5 Z` : `M${cx - rx} ${side > 0 ? 36 : 38} Q${cx} ${38 - ry - 1} ${cx + rx} ${side > 0 ? 38 : 36} Z`}
                fill="#E8C3A0"
                stroke={INK}
                strokeWidth="1.4"
              />
            ) : null}
          </G>
        );
      }
      case 'round':
        return (
          <G>
            <Ellipse cx={cx} cy="38" rx="4.2" ry="5" fill="#FFF" stroke={INK} strokeWidth="1.6" />
            <Circle cx={cx} cy="38.5" r="2.6" fill={iris} />
            <Circle cx={cx} cy="38.5" r="1.3" fill={INK} />
            <Circle cx={cx - 1} cy="37" r="0.8" fill="#FFF" />
          </G>
        );
      default: {
        const big = style === 'anime' ? 1.3 : style === 'sparkle' ? 1.15 : 1;
        return (
          <G>
            <Ellipse cx={cx} cy="38" rx={3.2 * big} ry={5 * big} fill={INK} />
            <Ellipse cx={cx} cy={39.5 + big} rx={2.4 * big} ry={2.4 * big} fill={iris} />
            <Circle cx={cx - 1} cy={36 - big} r={1.3 * big} fill="#FFF" />
            {style === 'sparkle' || style === 'anime' ? <Circle cx={cx + 1.4} cy={40} r="0.8" fill="#FFF" /> : null}
          </G>
        );
      }
    }
  };
  return (
    <G>
      {one(28, -1)}
      {one(40, 1)}
    </G>
  );
}

function BrowsShape({ style, color }: { style: string; color: string }) {
  const st = { stroke: color === '#E2E8F0' ? INK : color, strokeLinecap: 'round' as const, fill: 'none' };
  switch (style) {
    case 'none':
      return null;
    case 'dot':
      return (
        <G>
          <Circle cx="28" cy="31" r="1.8" fill={st.stroke} />
          <Circle cx="40" cy="31" r="1.8" fill={st.stroke} />
        </G>
      );
    case 'unibrow':
      return <Path d="M23 32 Q34 28 45 32" strokeWidth="3.4" {...st} />;
    default: {
      const w = style === 'bold' ? 3.6 : style === 'short' ? 1.8 : 2.4;
      const tilt = style === 'hero' ? 2 : style === 'worried' ? -2 : style === 'raised' ? -1 : 0;
      const half = style === 'short' ? 2.5 : 4;
      return (
        <G>
          <Path d={`M${28 - half} ${31 - tilt} L${28 + half} ${31 + tilt}`} strokeWidth={w} {...st} />
          <Path d={`M${40 - half} ${31 + tilt} L${40 + half} ${31 - tilt}`} strokeWidth={w} {...st} />
          {style === 'slit' ? <Path d="M42 29 L43 33" stroke="#FFF" strokeWidth="1.6" /> : null}
        </G>
      );
    }
  }
}

function NoseShape({ style, skin }: { style: string; skin: string }) {
  const shade = { fill: skin, stroke: INK, strokeWidth: 1.8 };
  switch (style) {
    case 'button':
      return <Ellipse cx="34" cy="43" rx="2.4" ry="2" {...shade} />;
    case 'round':
      return <Circle cx="34" cy="43" r="3.6" {...shade} />;
    case 'pointy':
      return <Path d="M34 37 L38 45 L32 45 Z" {...shade} strokeLinejoin="round" />;
    case 'wide':
      return (
        <G>
          <Ellipse cx="34" cy="44" rx="5.5" ry="2.4" {...shade} />
          <Circle cx="31.5" cy="44.5" r="0.8" fill={INK} />
          <Circle cx="36.5" cy="44.5" r="0.8" fill={INK} />
        </G>
      );
    case 'snub':
      return (
        <G>
          <Path d="M31 45 Q34 39 37 45 Z" {...shade} />
          <Circle cx="32.8" cy="44.6" r="0.7" fill={INK} />
          <Circle cx="35.2" cy="44.6" r="0.7" fill={INK} />
        </G>
      );
    default:
      return <Path d="M30 44 L38 44" stroke={INK} strokeWidth="1.2" opacity={0.25} />;
  }
}

function MouthShape({ style, lip }: { style: string; lip: string }) {
  const s = { stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' as const };
  switch (style) {
    case 'cat':
      return <Path d="M29 48 Q31.5 51 34 48 Q36.5 51 39 48" fill="none" {...s} />;
    case 'wavy':
      return <Path d="M28 49 Q31 46 34 49 Q37 52 40 49" fill="none" {...s} />;
    case 'grin':
      return (
        <G>
          <Path d="M27 47 Q34 56 41 47 Z" fill="#FFF" {...s} strokeLinejoin="round" />
          <Path d="M28 48 L40 48" stroke={INK} strokeWidth="1" />
        </G>
      );
    case 'smirk':
      return <Path d="M29 49 Q35 51 40 46" fill="none" {...s} />;
    case 'o':
      return <Ellipse cx="34" cy="49" rx="2.8" ry="3.4" fill={lip} {...s} />;
    case 'tongue':
      return (
        <G>
          <Path d="M29 47 Q34 51 39 47" fill="none" {...s} />
          <Path d="M32 49 Q34 54 36 49 Z" fill="#FF6B8B" stroke={INK} strokeWidth="1.4" />
        </G>
      );
    case 'fangs':
      return (
        <G>
          <Path d="M28 47 Q34 51 40 47" fill="none" {...s} />
          <Polygon points="30.5,48.5 32,51.5 33,49" fill="#FFF" stroke={INK} strokeWidth="1" />
          <Polygon points="35,49 36,51.5 37.5,48.5" fill="#FFF" stroke={INK} strokeWidth="1" />
        </G>
      );
    case 'pout':
      return <Path d="M30 50 Q34 46 38 50" fill="none" {...s} />;
    case 'line':
      return <Path d="M29 48.5 L39 48.5" {...s} />;
    case 'small':
      return <Path d="M31.5 47.5 Q34 50 36.5 47.5" fill="none" {...s} />;
    case 'lips':
      return (
        <G>
          <Path d="M28 48 Q31 45.5 34 47 Q37 45.5 40 48 Q34 49.5 28 48 Z" fill={lip} stroke={INK} strokeWidth="1.2" />
          <Path d="M28 48 Q34 53 40 48 Q34 49.5 28 48 Z" fill={lip} stroke={INK} strokeWidth="1.2" />
        </G>
      );
    case 'teeth':
      return (
        <G>
          <Path d="M27.5 46.5 Q34 53 40.5 46.5 Z" fill="#3A1A22" {...s} strokeLinejoin="round" />
          <Path d="M28.5 46.8 L39.5 46.8 L38.5 48.6 L29.5 48.6 Z" fill="#FFF" />
        </G>
      );
    case 'laugh':
      return (
        <G>
          <Path d="M27 45.5 Q34 58 41 45.5 Z" fill="#3A1A22" {...s} strokeLinejoin="round" />
          <Path d="M28 46 L40 46 L39 48 L29 48 Z" fill="#FFF" />
          <Ellipse cx="34" cy="52.5" rx="3.6" ry="1.8" fill="#FF6B8B" />
        </G>
      );
    case 'kiss':
      return <Path d="M33 46 Q37 47.5 34 49 Q37 50.5 33 52" fill="none" stroke={lip} strokeWidth={2.4} strokeLinecap="round" />;
    default:
      return <Path d="M28 47 Q34 53 40 47" fill="none" {...s} stroke={lip === '#B23A48' ? INK : lip} />;
  }
}

function BeardShape({ style, color }: { style: string; color: string }) {
  const p = { fill: color, stroke: INK, strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  const mustache = (
    <Path d="M27 46 Q31 42 34 45 Q37 42 41 46 Q37 47 34 46 Q31 47 27 46 Z" {...p} />
  );
  switch (style) {
    case 'stubble':
      return <Path d="M19 42 Q22 56 34 57 Q46 56 49 42 Q44 52 34 52 Q24 52 19 42 Z" fill={color} opacity={0.35} />;
    case 'mustache':
      return mustache;
    case 'curly':
      return (
        <G>
          {mustache}
          <Path d="M27 46 Q23 46 24 42" fill="none" stroke={INK} strokeWidth="1.6" />
          <Path d="M41 46 Q45 46 44 42" fill="none" stroke={INK} strokeWidth="1.6" />
        </G>
      );
    case 'goatee':
      return <Path d="M30 52 Q34 50 38 52 Q37 58 34 59 Q31 58 30 52 Z" {...p} />;
    case 'beard':
      return (
        <G>
          <Path d="M18 40 Q19 58 34 60 Q49 58 50 40 Q47 52 40 51 Q34 49 28 51 Q21 52 18 40 Z" {...p} />
          {mustache}
        </G>
      );
    default:
      return null;
  }
}

function GlassesShape({ style }: { style: string }) {
  const frame = style === 'star' ? '#F4B942' : style === 'heart' ? '#FF4D79' : style === 'goggles' ? '#FF7A1A' : INK;
  const lens = style === 'sun' ? INK : style === 'goggles' ? '#7DD3FC' : style === 'heart' ? '#FF9EB5' : '#BFD8FF';
  const op = style === 'sun' ? 0.9 : 0.55;
  const lensAt = (cx: number) => {
    switch (style) {
      case 'square':
        return <Rect x={cx - 5.5} y="34" width="11" height="8" rx="1.5" fill={lens} fillOpacity={op} stroke={frame} strokeWidth="2" />;
      case 'star':
        return (
          <Polygon
            points={`${cx},32 ${cx + 2},36 ${cx + 6},36.5 ${cx + 3},39.5 ${cx + 4},44 ${cx},41.5 ${cx - 4},44 ${cx - 3},39.5 ${cx - 6},36.5 ${cx - 2},36`}
            fill={lens}
            fillOpacity={op}
            stroke={frame}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        );
      case 'heart':
        return <Path d={`M${cx} 44 C${cx - 8} 38 ${cx - 5} 31 ${cx} 35 C${cx + 5} 31 ${cx + 8} 38 ${cx} 44 Z`} fill={lens} fillOpacity={op} stroke={frame} strokeWidth="1.8" />;
      default:
        return <Circle cx={cx} cy="38" r={style === 'goggles' ? 6.4 : 5.4} fill={lens} fillOpacity={op} stroke={frame} strokeWidth={style === 'goggles' ? 3 : 2} />;
    }
  };
  if (style === 'none') return null;
  return (
    <G>
      {style === 'goggles' ? <Path d="M15 37 L53 37" stroke={frame} strokeWidth="2.6" /> : null}
      {lensAt(27.5)}
      {lensAt(40.5)}
      {style !== 'goggles' && style !== 'heart' ? <Path d="M32.5 37 Q34 35.5 35.5 37" stroke={frame} strokeWidth="1.8" fill="none" /> : null}
    </G>
  );
}

function CheeksShape({ style }: { style: string }) {
  switch (style) {
    case 'pink':
    case 'peach':
      return (
        <G opacity={0.75}>
          <Ellipse cx="23" cy="45" rx="3.6" ry="2.2" fill={style === 'pink' ? '#FF8FB1' : '#FFB38A'} />
          <Ellipse cx="45" cy="45" rx="3.6" ry="2.2" fill={style === 'pink' ? '#FF8FB1' : '#FFB38A'} />
        </G>
      );
    case 'freckles':
      return (
        <G fill="#B9784A">
          {[21, 24, 23, 44, 47, 45].map((x, i) => (
            <Circle key={i} cx={x} cy={i % 3 === 1 ? 43 : 45.5} r="0.9" />
          ))}
        </G>
      );
    case 'star':
      return (
        <G fill="#F4B942">
          <Polygon points="22,42 23,44.5 25.5,45 23.5,46.5 24,49 22,47.5 20,49 20.5,46.5 18.5,45 21,44.5" />
          <Polygon points="46,42 47,44.5 49.5,45 47.5,46.5 48,49 46,47.5 44,49 44.5,46.5 42.5,45 45,44.5" />
        </G>
      );
    case 'hearts':
      return (
        <G fill="#FF4D79">
          <Path d="M22 48 C18 45 20 42 22 44 C24 42 26 45 22 48 Z" />
          <Path d="M46 48 C42 45 44 42 46 44 C48 42 50 45 46 48 Z" />
        </G>
      );
    case 'bandaid':
      return <Rect x="40" y="42" width="9" height="4" rx="1.6" fill="#FDE68A" stroke={INK} strokeWidth="1.2" transform="rotate(-20 44 44)" />;
    case 'whiskers':
      return (
        <G stroke={INK} strokeWidth="1.2" strokeLinecap="round">
          <Path d="M16 43 L23 44" />
          <Path d="M16 47 L23 46" />
          <Path d="M52 43 L45 44" />
          <Path d="M52 47 L45 46" />
        </G>
      );
    case 'stripes':
      return (
        <G stroke="#FF4769" strokeWidth="1.8" strokeLinecap="round">
          <Path d="M20 43 L25 43" />
          <Path d="M20 46 L25 46" />
          <Path d="M43 43 L48 43" />
          <Path d="M43 46 L48 46" />
        </G>
      );
    case 'dimples':
      return (
        <G stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round">
          <Path d="M25 47 Q26 49 27 47" />
          <Path d="M41 47 Q42 49 43 47" />
        </G>
      );
    default:
      return null;
  }
}

function HatShape({ id, accent }: { id: string; accent: string }) {
  const s = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  switch (id) {
    case 'crown':
      return <Polygon points="20,24 20,10 27,17 34,7 41,17 48,10 48,24" fill="#F4C44E" {...s} />;
    case 'beret':
      return <Path d="M16 24 C16 13 30 10 44 13 C52 15 54 22 50 25 Z" fill="#3B4CCA" {...s} />;
    case 'cap':
      return <Path d="M18 26 C18 14 26 10 34 10 C42 10 50 14 50 26 L58 27 L58 30 L18 30 Z" fill="#FF4D6D" {...s} />;
    case 'bow':
      return (
        <G>
          <Path d="M34 16 L20 9 L20 23 Z" fill="#FF4D6D" {...s} />
          <Path d="M34 16 L48 9 L48 23 Z" fill="#FF4D6D" {...s} />
          <Circle cx="34" cy="16" r="3.5" fill="#FF4D6D" {...s} />
        </G>
      );
    case 'headphones':
      return (
        <G>
          <Path d="M16 38 C14 18 54 18 52 38" fill="none" stroke="#3B4CCA" strokeWidth="3.4" />
          <Rect x="11" y="33" width="8" height="12" rx="3" fill="#3B4CCA" {...s} />
          <Rect x="49" y="33" width="8" height="12" rx="3" fill="#3B4CCA" {...s} />
        </G>
      );
    case 'wizard':
      return (
        <G>
          <Polygon points="34,2 46,24 22,24" fill="#7B5CFF" {...s} />
          <Ellipse cx="34" cy="25" rx="18" ry="3.5" fill="#7B5CFF" {...s} />
          <Polygon points="34,10 35,13 38,13 35.5,15 36.5,18 34,16 31.5,18 32.5,15 30,13 33,13" fill="#F4C44E" />
        </G>
      );
    case 'halo':
      return <Ellipse cx="34" cy="10" rx="13" ry="3.5" fill="none" stroke="#F4C44E" strokeWidth="3.4" />;
    case 'flower':
      return (
        <G>
          {[0, 72, 144, 216, 288].map((a) => (
            <Circle key={a} cx={44 + 4 * Math.cos((a * Math.PI) / 180)} cy={20 + 4 * Math.sin((a * Math.PI) / 180)} r="3.4" fill="#FF8FB1" stroke={INK} strokeWidth="1.2" />
          ))}
          <Circle cx="44" cy="20" r="2.6" fill="#F4C44E" />
        </G>
      );
    case 'strawhat':
      return (
        <G>
          <Ellipse cx="34" cy="25" rx="24" ry="5" fill="#F6D27A" {...s} />
          <Path d="M22 25 C22 12 46 12 46 25 Z" fill="#F6D27A" {...s} />
          <Rect x="22" y="20" width="24" height="4" fill="#E63946" />
        </G>
      );
    case 'captain':
      return (
        <G>
          <Path d="M14 24 Q34 4 54 24 Q34 18 14 24 Z" fill="#2B3B5C" {...s} />
          <Circle cx="34" cy="17" r="3" fill="#F4C44E" />
        </G>
      );
    case 'bandana':
      return <Path d="M16 26 C16 14 52 14 52 26 L58 32 L52 30 Z" fill="#E63946" {...s} />;
    case 'eyepatch':
      return (
        <G>
          <Path d="M17 30 L51 40" stroke={INK} strokeWidth="1.6" />
          <Ellipse cx="40" cy="38" rx="5" ry="4.2" fill="#22263A" />
        </G>
      );
    case 'jester':
      return (
        <G>
          <Path d="M18 26 Q12 12 6 18 L18 30 Z" fill="#7B3FE4" {...s} />
          <Path d="M50 26 Q56 12 62 18 L50 30 Z" fill="#E63946" {...s} />
          <Rect x="17" y="22" width="34" height="7" rx="2" fill="#FACC15" {...s} />
          <Circle cx="6" cy="18" r="3" fill="#FFF" {...s} />
          <Circle cx="62" cy="18" r="3" fill="#FFF" {...s} />
        </G>
      );
    case 'chefhat':
      return (
        <G>
          <Rect x="23" y="18" width="22" height="9" fill="#FFF" {...s} />
          <Path d="M22 19 C14 16 18 4 26 8 C28 2 40 2 42 8 C50 4 54 16 46 19 Z" fill="#FFF" {...s} />
        </G>
      );
    case 'beanie':
      return (
        <G>
          <Path d="M18 28 C18 12 50 12 50 28 Z" fill={accent} {...s} />
          <Rect x="17" y="24" width="34" height="6" rx="2.5" fill={accent} {...s} />
          <Circle cx="34" cy="10" r="4" fill="#FFF" {...s} />
        </G>
      );
    case 'grad':
      return (
        <G>
          <Rect x="24" y="16" width="20" height="9" fill="#1F2A44" {...s} />
          <Polygon points="34,6 56,13 34,20 12,13" fill="#1F2A44" {...s} />
          <Path d="M48 15 L50 26" stroke="#F4C44E" strokeWidth="2.2" />
        </G>
      );
    case 'tophat':
      return (
        <G>
          <Rect x="24" y="3" width="20" height="20" rx="1.5" fill="#22263A" {...s} />
          <Rect x="24" y="17" width="20" height="4" fill="#FF4D6D" />
          <Ellipse cx="34" cy="24" rx="16" ry="3" fill="#22263A" {...s} />
        </G>
      );
    case 'cowboy':
      return (
        <G>
          <Path d="M8 22 Q34 32 60 22 Q56 28 34 29 Q12 28 8 22 Z" fill="#A0673A" {...s} />
          <Path d="M22 24 C21 10 28 8 34 12 C40 8 47 10 46 24 Z" fill="#A0673A" {...s} />
        </G>
      );
    default:
      return null;
  }
}

function OutfitShape({ id, color, pants }: { id: string; color: string; pants: string }) {
  const s = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: 'round' as const };
  const torso = 'M20 28 L28 22 L40 22 L48 28 L52 40 L45 42 L45 56 L23 56 L23 42 L16 40 Z';
  switch (id) {
    case 'none':
      return <Circle cx="34" cy="38" r="12" fill="none" stroke={THEME.ink3} strokeWidth="2.4" strokeDasharray="4 4" />;
    case 'tank':
      return (
        <G>
          <Path d="M24 26 L28 22 L31 22 Q34 30 37 22 L40 22 L44 26 L45 56 L23 56 Z" fill={color} {...s} />
          <Path d="M29 24 Q34 36 39 24" stroke="#F4C44E" strokeWidth="1.8" fill="none" />
        </G>
      );
    case 'jester':
      return (
        <G>
          <Path d={torso} fill="#E63946" {...s} />
          <Path d="M34 22 L40 22 L48 28 L52 40 L45 42 L45 56 L34 56 Z" fill="#7B3FE4" {...s} />
          <Ellipse cx="34" cy="23" rx="10" ry="3" fill="#FACC15" stroke={INK} strokeWidth="1.4" />
          {[32, 40, 48].map((y) => (
            <Circle key={y} cx="35" cy={y} r="2.2" fill="#F4C44E" stroke={INK} strokeWidth="1" />
          ))}
        </G>
      );
    case 'chef':
      return (
        <G>
          <Path d={torso} fill="#FFFFFF" {...s} />
          <Ellipse cx="34" cy="23" rx="8" ry="2.5" fill="#E11D48" />
          {[30, 37, 44].map((y) => (
            <G key={y}>
              <Circle cx="30" cy={y} r="1.3" fill={INK} />
              <Circle cx="38" cy={y} r="1.3" fill={INK} />
            </G>
          ))}
        </G>
      );
    case 'hero':
      return (
        <G>
          <Path d="M24 24 L12 60 L56 60 L44 24 Z" fill="#E11D48" {...s} />
          <Path d={torso} fill={color} {...s} />
          <Polygon points="34,30 39,35 34,42 29,35" fill="#FACC15" stroke={INK} strokeWidth="1.2" />
        </G>
      );
    case 'polo':
      return (
        <G>
          <Path d={torso} fill={color} {...s} />
          <Path d="M28 22 L34 30 L40 22 Z" fill="#FFF" stroke={INK} strokeWidth="1.4" />
          <Circle cx="34" cy="34" r="1.2" fill="#FFF" />
        </G>
      );
    case 'stripes':
      return (
        <G>
          <Path d={torso} fill="#FFF" {...s} />
          {[30, 36, 42, 48, 53].map((y) => (
            <Path key={y} d={`M${y < 40 ? 20 : 23} ${y} L${y < 40 ? 48 : 45} ${y}`} stroke={color} strokeWidth="3" />
          ))}
        </G>
      );
    case 'blazer':
      return (
        <G>
          <Path d={torso} fill={color} {...s} />
          <Path d="M30 22 L34 40 L38 22 Z" fill="#FFF" stroke={INK} strokeWidth="1.4" />
          <Circle cx="27" cy="36" r="2" fill="#F4C44E" />
        </G>
      );
    case 'jersey':
      return (
        <G>
          <Path d={torso} fill={color} {...s} />
          <Path d="M25 40 L43 40" stroke="#FFF" strokeWidth="3" />
          <Path d="M32 30 L34 28 L34 37" stroke="#FFF" strokeWidth="2.2" fill="none" />
        </G>
      );
    case 'labcoat':
      return (
        <G>
          <Path d="M20 28 L28 22 L40 22 L48 28 L52 40 L46 41 L48 60 L20 60 L22 41 L16 40 Z" fill="#FFF" {...s} />
          <Path d="M31 22 L34 45 L37 22 Z" fill={color} stroke={INK} strokeWidth="1.2" />
          <Rect x="24" y="34" width="5" height="4" fill="#60A5FA" />
        </G>
      );
    case 'raincoat':
      return (
        <G>
          <Path d={torso} fill={color} {...s} />
          <Path d="M26 22 C26 14 42 14 42 22" fill={color} stroke={INK} strokeWidth="2" />
          {[30, 38, 46].map((y) => (
            <Path key={y} d={`M32 ${y} L36 ${y}`} stroke="#7C4A27" strokeWidth="2.2" strokeLinecap="round" />
          ))}
        </G>
      );
    case 'shirttie':
      return (
        <G>
          <Path d={torso} fill="#FFFFFF" {...s} />
          <Polygon points="34,24 37,27 35.5,29 38,46 34,51 30,46 32.5,29 31,27" fill={color} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        </G>
      );
    case 'dress':
      return (
        <G>
          <Path d="M25 22 L43 22 L46 36 L54 58 L14 58 L22 36 Z" fill={color} {...s} />
          <Path d="M22 36 L46 36" stroke="#FFF" strokeWidth="2" />
        </G>
      );
    case 'overalls':
      return (
        <G>
          <Path d={torso} fill="#FFF" {...s} />
          <Path d="M25 34 L43 34 L45 58 L23 58 Z" fill={color} {...s} />
          <Path d="M27 34 L26 22 M41 34 L42 22" stroke={color} strokeWidth="3" />
        </G>
      );
    case 'sweater':
      return (
        <G>
          <Path d={torso} fill={color} {...s} />
          <Path d="M23 44 L45 44 M23 49 L45 49" stroke="#FFF" strokeWidth="2.2" />
        </G>
      );
    case 'jacket':
      return (
        <G>
          <Path d={torso} fill={color} {...s} />
          <Path d="M31 22 L34 56 L37 22 Z" fill="#FFF" stroke={INK} strokeWidth="1.4" />
        </G>
      );
    case 'tshirt':
      return (
        <G>
          <Path d={torso} fill={color} {...s} />
          <Polygon points="38,30 39.5,33 42.5,33.3 40.2,35.3 41,38.3 38,36.6 35,38.3 35.8,35.3 33.5,33.3 36.5,33" fill="#FFF" />
          <Rect x="25" y="56" width="18" height="4" fill={pants} />
        </G>
      );
    default: {
      const o = OUTFITS.find((x) => x.id === id);
      return <Path d={torso} fill={o?.color ?? color} {...s} />;
    }
  }
}

/** Ícono de una pieza del creador. `value` es el id de la pieza. */
export function MiiPartIcon({ kind, value, pet, size = 56 }: { kind: IconKind; value: string; pet: PetConfig; size?: number }) {
  const skin = pet.bodyColor;
  const hair = pet.hairColor ?? '#4A2E1B';
  const iris = pet.eyeColor ?? '#3B7BFF';
  const lip = pet.lipColor ?? '#B23A48';
  const shape = pet.species === 'human' ? pet.faceShape ?? 'round' : 'round';
  const body = (() => {
    switch (kind) {
      case 'species':
        if (value !== 'human') return null;
        return (
          <G>
            <HeadBase skin={SPECIES_PRESET_COLORS.human.bodyColor} />
            <HairShape style="short" color="#7C4A27" />
            <EyesShape style="round" iris="#5B3A1E" />
            <MouthShape style="smile" lip="#B23A48" />
          </G>
        );
      case 'face':
        return (
          <G>
            <HeadBase skin={skin} shape={value} />
            <GuideFace />
          </G>
        );
      case 'hair':
        return (
          <G>
            {value === 'long' || value === 'braids' ? <HairShape style={value} color={hair} /> : null}
            <HeadBase skin={skin} shape={shape} />
            <GuideFace />
            {value !== 'long' && value !== 'braids' ? <HairShape style={value} color={hair} /> : null}
            {value === 'long' ? <Path d="M17 32 C17 20 25 15 34 15 C43 15 51 20 51 32 C44 26 26 26 17 32 Z" fill={hair} stroke={INK} strokeWidth={2.2} /> : null}
            {value === 'none' ? <Path d="M24 22 L44 46" stroke={THEME.ink3} strokeWidth="2" opacity={0.5} /> : null}
          </G>
        );
      case 'brows':
        return (
          <G>
            <HeadBase skin={skin} shape={shape} faint />
            <GuideFace />
            <BrowsShape style={value} color={hair} />
          </G>
        );
      case 'eyes':
        return (
          <G>
            <HeadBase skin={skin} shape={shape} faint />
            <EyesShape style={value} iris={iris} />
          </G>
        );
      case 'nose':
        return (
          <G>
            <HeadBase skin={skin} shape={shape} faint />
            <GuideFace />
            <NoseShape style={value} skin={skin} />
          </G>
        );
      case 'mouth':
        return (
          <G>
            <HeadBase skin={skin} shape={shape} faint />
            <GuideFace show={{ eyes: true }} />
            <MouthShape style={value} lip={lip} />
          </G>
        );
      case 'beard':
        return (
          <G>
            <HeadBase skin={skin} shape={shape} faint />
            <GuideFace />
            <BeardShape style={value} color={hair} />
          </G>
        );
      case 'glasses':
        return (
          <G>
            <HeadBase skin={skin} shape={shape} faint />
            <GuideFace show={{ eyes: true, mouth: true }} />
            <GlassesShape style={value} />
          </G>
        );
      case 'cheeks':
        return (
          <G>
            <HeadBase skin={skin} shape={shape} faint />
            <GuideFace />
            <CheeksShape style={value} />
          </G>
        );
      case 'hat':
        return (
          <G transform="translate(0 6)">
            <HeadBase skin={skin} shape={shape} faint />
            <GuideFace />
            <HatShape id={value} accent={pet.bellyColor} />
          </G>
        );
      case 'outfit':
        return <OutfitShape id={value} color={pet.bellyColor} pants={pet.pantsColor ?? '#3B4A6B'} />;
      default:
        return null;
    }
  })();
  if (kind === 'species' && value !== 'human') {
    return <Glyph name={`species-${value}`} size={size} />;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 68 68">
      <Circle cx="34" cy="36" r="31" fill="#EEF4FF" />
      <Ellipse cx="34" cy="62" rx="16" ry="3" fill="#CBD5E1" opacity={0.6} />
      {body}
    </Svg>
  );
}

/* ------------------------------------------------------------------ */
/* Controles                                                           */
/* ------------------------------------------------------------------ */

function Swatches({ colors, value, onPick }: { colors: readonly string[]; value?: string; onPick: (c: string) => void }) {
  return (
    <View style={styles.swatchRow}>
      {colors.map((c) => {
        const active = value?.toLowerCase() === c.toLowerCase();
        return (
          <PressableScale key={c} scaleTo={0.86} hapticKind="select" onPress={() => onPick(c)} accessibilityLabel={c}>
            <View style={[styles.swatchRing, active && styles.swatchRingActive]}>
              <View style={[styles.swatch, { backgroundColor: c }]} />
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Ajuste fino con flechas, como en el Mii Maker (−3 … +3). */
function Stepper({
  label,
  value,
  onChange,
  minLabel,
  maxLabel,
  min = TUNING_MIN,
  max = TUNING_MAX,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
  min?: number;
  max?: number;
}) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const set = (v: number) => {
    const next = Math.max(min, Math.min(max, v));
    if (next !== value) {
      haptic('select');
      onChange(next);
    }
  };
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <PressableScale onPress={() => set(value - 1)} disabled={value <= min} style={[styles.stepBtn, value <= min && { opacity: 0.35 }]} accessibilityLabel={`${label}: ${minLabel}`}>
          <Text style={styles.stepBtnText}>−</Text>
        </PressableScale>
        <View style={styles.stepTrack}>
          {steps.map((v) => (
            <PressableScale key={v} hapticKind={null} onPress={() => set(v)} style={styles.stepHit}>
              <View style={[styles.stepDot, v === value && styles.stepDotActive, v === 0 && v !== value && styles.stepDotCenter]} />
            </PressableScale>
          ))}
        </View>
        <PressableScale onPress={() => set(value + 1)} disabled={value >= max} style={[styles.stepBtn, value >= max && { opacity: 0.35 }]} accessibilityLabel={`${label}: ${maxLabel}`}>
          <Text style={styles.stepBtnText}>+</Text>
        </PressableScale>
      </View>
      <View style={styles.stepEnds}>
        <Text style={styles.stepEndText}>{minLabel}</Text>
        <Text style={styles.stepEndText}>{maxLabel}</Text>
      </View>
    </View>
  );
}

function PartGrid<T extends string>({
  items,
  value,
  onPick,
  icon,
  locked,
}: {
  items: Array<{ id: T; label: string }>;
  value: T | undefined;
  onPick: (id: T) => void;
  icon: (id: T) => React.ReactNode;
  locked?: (id: T) => string | null;
}) {
  return (
    <View style={styles.grid}>
      {items.map((it) => {
        const active = value === it.id;
        const lock = locked?.(it.id) ?? null;
        return (
          <PressableScale
            key={it.id}
            hapticKind="select"
            disabled={Boolean(lock)}
            onPress={() => onPick(it.id)}
            style={[styles.tile, active && styles.tileActive, lock ? { opacity: 0.45 } : null]}
            accessibilityLabel={it.label}
          >
            {icon(it.id)}
            <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={1}>
              {lock ?? it.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ gap: 8 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

/* ------------------------------------------------------------------ */
/* Creador                                                             */
/* ------------------------------------------------------------------ */

export function MiiCreator({
  pet,
  onChangePet,
  playerLevel = 99,
  showPreview = true,
  showVoice = true,
  previewSize = 230,
  onSpeakSample,
  initialCategory,
}: {
  pet: PetConfig;
  onChangePet: (patch: Partial<PetConfig>) => void;
  playerLevel?: number;
  showPreview?: boolean;
  showVoice?: boolean;
  previewSize?: number;
  onSpeakSample?: (text: string, pitch: number, rate: number) => void;
  initialCategory?: MiiCategory;
}) {
  const [cat, setCat] = useState<MiiCategory>(initialCategory ?? (pet.species === 'human' ? 'face' : 'body'));
  const [mood, setMood] = useState<PetMood>('happy');
  const [reactKey, setReactKey] = useState(0);
  const isHuman = pet.species === 'human';
  /** Nariz y barba solo para siluetas humanas; el chibi y los animales conservan su cara. */
  const humanoid = isHuman || pet.species === 'meeseeks';
  const tune = pet.tuning ?? {};

  const change = (patch: Partial<PetConfig>) => {
    onChangePet(patch);
    setReactKey((k) => k + 1);
  };
  const setTune = (key: keyof FaceTuning, v: number) => change({ tuning: { ...tune, [key]: v } });
  const categories = CATEGORIES.filter(
    (c) => (showVoice || c.id !== 'voice') && (humanoid || (c.id !== 'nose' && c.id !== 'beard' && c.id !== 'hair'))
  );
  const activeCat: MiiCategory = categories.some((c) => c.id === cat) ? cat : 'body';
  const faceFocus = FACE_CATEGORIES.includes(activeCat);

  return (
    <View style={styles.wrap}>
      {showPreview ? (
        <View style={styles.stage}>
          <Pet3D
            config={pet}
            mood={mood}
            size={previewSize}
            reactKey={reactKey}
            focus={faceFocus ? 'face' : 'body'}
            backgroundColor="transparent"
            onTap={() => {
              setMood('love');
              setReactKey((k) => k + 1);
              setTimeout(() => setMood('happy'), 1600);
            }}
          />
          <View style={styles.zoomPill}>
            <Text style={styles.zoomPillText}>{faceFocus ? 'Primer plano' : 'Cuerpo completo'}</Text>
          </View>
        </View>
      ) : null}

      {/* Categorías: fichas grandes como en el Mii Maker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {categories.map((c) => {
          const active = c.id === activeCat;
          const iconKind: IconKind | null =
            c.id === 'face' ? 'face'
            : c.id === 'hair' ? 'hair'
            : c.id === 'brows' ? 'brows'
            : c.id === 'eyes' ? 'eyes'
            : c.id === 'nose' ? 'nose'
            : c.id === 'mouth' ? 'mouth'
            : c.id === 'beard' ? 'beard'
            : c.id === 'glasses' ? 'glasses'
            : c.id === 'clothes' ? 'outfit'
            : c.id === 'hats' ? 'hat'
            : null;
          const iconValue =
            c.id === 'face' ? pet.faceShape ?? 'round'
            : c.id === 'hair' ? pet.hairStyle ?? 'short'
            : c.id === 'brows' ? pet.browStyle ?? 'soft'
            : c.id === 'eyes' ? pet.eyeStyle
            : c.id === 'nose' ? pet.noseStyle ?? 'button'
            : c.id === 'mouth' ? pet.mouthStyle ?? 'smile'
            : c.id === 'beard' ? (pet.facialHair && pet.facialHair !== 'none' ? pet.facialHair : 'mustache')
            : c.id === 'glasses' ? (pet.glasses && pet.glasses !== 'none' ? pet.glasses : 'round')
            : c.id === 'clothes' ? pet.outfit ?? 'tshirt'
            : c.id === 'hats' ? (pet.accessory !== 'none' ? pet.accessory : 'cap')
            : '';
          return (
            <PressableScale
              key={c.id}
              hapticKind="select"
              onPress={() => setCat(c.id)}
              style={[styles.catTile, active && { backgroundColor: c.tint, borderColor: c.tint }]}
              accessibilityRole="tab"
              accessibilityLabel={c.label}
            >
              <View style={styles.catIcon}>
                {iconKind ? (
                  <MiiPartIcon kind={iconKind} value={iconValue} pet={pet} size={40} />
                ) : (
                  <Glyph name={c.id === 'body' ? `species-${pet.species === 'human' ? 'meeseeks' : pet.species}` : 'mic'} size={34} />
                )}
              </View>
              <Text style={[styles.catLabel, active && { color: '#FFFFFF' }]}>{c.label}</Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      <View style={styles.panel}>
        {activeCat === 'body' ? (
          <>
            <Section title="¿Qué vas a crear?">
              <PartGrid
                items={SPECIES.map((s) => ({ id: s.id, label: s.label }))}
                value={pet.species}
                locked={(id) => {
                  const sp = SPECIES.find((s) => s.id === id);
                  return sp && playerLevel < sp.unlockLevel ? `Nivel ${sp.unlockLevel}` : null;
                }}
                onPick={(id) => {
                  const preset = SPECIES_PRESET_COLORS[id];
                  change({
                    species: id,
                    bodyColor: id === 'human' ? SKIN_TONES[3]! : preset.bodyColor,
                    bellyColor: preset.bellyColor,
                    ...(id === 'human'
                      ? {
                          outfit: pet.outfit && pet.outfit !== 'none' ? pet.outfit : 'tshirt',
                          hairStyle: pet.hairStyle && pet.hairStyle !== 'none' ? pet.hairStyle : 'short',
                          noseStyle: 'button' as const,
                          eyeStyle: 'round' as const,
                        }
                      : id === 'puff'
                        ? {
                            // El chibi redondo se queda como es: sin pelo, nariz, barba ni ropa (se pueden añadir después).
                            hairStyle: 'none' as const,
                            noseStyle: 'none' as const,
                            facialHair: 'none' as const,
                            outfit: 'none' as const,
                            glasses: 'none' as const,
                            eyeStyle: 'sparkle' as const,
                            blushStyle: 'pink' as const,
                            browStyle: 'none' as const,
                          }
                        : id === 'meeseeks'
                          ? {}
                          : { hairStyle: 'none' as const, noseStyle: 'none' as const, facialHair: 'none' as const }),
                  });
                }}
                icon={(id) => <MiiPartIcon kind="species" value={id} pet={pet} size={48} />}
              />
            </Section>
            <Stepper label="Altura" value={Math.round(((pet.height ?? 0.5) - 0.5) * 6)} onChange={(v) => change({ height: 0.5 + v / 6 })} minLabel="Bajito" maxLabel="Alto" />
            <Stepper label="Complexión" value={Math.round(((pet.weight ?? 0.5) - 0.5) * 6)} onChange={(v) => change({ weight: 0.5 + v / 6 })} minLabel="Delgado" maxLabel="Robusto" />
            <Section title="Color favorito (tiñe su ropa)">
              <Swatches colors={FAVORITE_COLORS} value={pet.bellyColor} onPick={(c) => change({ bellyColor: c })} />
            </Section>
            {!isHuman ? (
              <Section title="Color del cuerpo">
                <Swatches colors={BODY_COLORS} value={pet.bodyColor} onPick={(c) => change({ bodyColor: c })} />
              </Section>
            ) : null}
          </>
        ) : null}

        {activeCat === 'face' ? (
          <>
            {isHuman ? (
              <Section title="Forma de la cara">
                <PartGrid items={FACE_SHAPES} value={pet.faceShape ?? 'round'} onPick={(id) => change({ faceShape: id })} icon={(id) => <MiiPartIcon kind="face" value={id} pet={pet} />} />
              </Section>
            ) : null}
            <Section title={isHuman ? 'Tono de piel' : 'Color del cuerpo'}>
              <Swatches colors={isHuman ? SKIN_TONES : [...BODY_COLORS, ...SKIN_TONES]} value={pet.bodyColor} onPick={(c) => change({ bodyColor: c })} />
            </Section>
            {isHuman ? (
              <Section title="Orejas">
                <View style={styles.chipRow}>
                  {EAR_STYLES.map((e) => {
                    const active = (pet.earStyle ?? 'normal') === e.id;
                    return (
                      <PressableScale key={e.id} hapticKind="select" onPress={() => change({ earStyle: e.id })} style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{e.label}</Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </Section>
            ) : null}
            <Section title="Rasgos y maquillaje">
              <PartGrid items={BLUSH_STYLES} value={pet.blushStyle ?? 'pink'} onPick={(id) => change({ blushStyle: id })} icon={(id) => <MiiPartIcon kind="cheeks" value={id} pet={pet} />} />
            </Section>
            <PressableScale hapticKind="select" onPress={() => change({ mole: !pet.mole })} style={[styles.toggle, pet.mole && styles.toggleOn]}>
              <View style={[styles.toggleDot, pet.mole && styles.toggleDotOn]} />
              <Text style={[styles.toggleText, pet.mole && { color: '#FFFFFF' }]}>Lunar</Text>
            </PressableScale>
            {pet.mole ? (
              <>
                <Stepper label="Lunar: lado" value={tune.moleX ?? 0} onChange={(v) => setTune('moleX', v)} minLabel="Hacia el centro" maxLabel="Hacia afuera" />
                <Stepper label="Lunar: altura" value={tune.moleY ?? 0} onChange={(v) => setTune('moleY', v)} minLabel="Abajo" maxLabel="Arriba" />
              </>
            ) : null}
          </>
        ) : null}

        {activeCat === 'hair' ? (
          <>
            <Section title="Peinado">
              <PartGrid items={HAIR_STYLES} value={pet.hairStyle ?? (isHuman ? 'short' : 'none')} onPick={(id) => change({ hairStyle: id })} icon={(id) => <MiiPartIcon kind="hair" value={id} pet={pet} />} />
            </Section>
            <Section title="Color del pelo">
              <Swatches colors={HAIR_COLORS} value={pet.hairColor} onPick={(c) => change({ hairColor: c })} />
            </Section>
          </>
        ) : null}

        {activeCat === 'brows' ? (
          <>
            <Section title="Tipo de cejas">
              <PartGrid items={BROW_STYLES} value={pet.browStyle ?? 'soft'} onPick={(id) => change({ browStyle: id })} icon={(id) => <MiiPartIcon kind="brows" value={id} pet={pet} />} />
            </Section>
            <Stepper label="Tamaño" value={tune.browSize ?? 0} onChange={(v) => setTune('browSize', v)} minLabel="Finas" maxLabel="Gruesas" />
            <Stepper label="Largo" value={tune.browStretch ?? 0} onChange={(v) => setTune('browStretch', v)} minLabel="Cortas" maxLabel="Largas" />
            <Stepper label="Inclinación" value={tune.browRotation ?? 0} onChange={(v) => setTune('browRotation', v)} minLabel="Tristes" maxLabel="Decididas" />
            <Stepper label="Separación" value={tune.browSpacing ?? 0} onChange={(v) => setTune('browSpacing', v)} minLabel="Juntas" maxLabel="Separadas" />
            <Stepper label="Altura" value={tune.browHeight ?? 0} onChange={(v) => setTune('browHeight', v)} minLabel="Abajo" maxLabel="Arriba" />
          </>
        ) : null}

        {activeCat === 'eyes' ? (
          <>
            <Section title="Tipo de ojos">
              <PartGrid
                items={humanoid ? EYE_STYLES : [...EYE_STYLES.slice(6), ...EYE_STYLES.slice(0, 6)]}
                value={pet.eyeStyle} onPick={(id) => change({ eyeStyle: id })} icon={(id) => <MiiPartIcon kind="eyes" value={id} pet={pet} />} />
            </Section>
            <Section title="Color de ojos">
              <Swatches colors={EYE_COLORS} value={pet.eyeColor} onPick={(c) => change({ eyeColor: c })} />
            </Section>
            <Stepper label="Tamaño" value={tune.eyeSize ?? 0} onChange={(v) => setTune('eyeSize', v)} minLabel="Pequeños" maxLabel="Grandes" />
            <Stepper label="Forma" value={tune.eyeStretch ?? 0} onChange={(v) => setTune('eyeStretch', v)} minLabel="Anchos" maxLabel="Alargados" />
            <Stepper label="Inclinación" value={tune.eyeRotation ?? 0} onChange={(v) => setTune('eyeRotation', v)} minLabel="Caídos" maxLabel="Rasgados" />
            <Stepper label="Separación" value={tune.eyeSpacing ?? 0} onChange={(v) => setTune('eyeSpacing', v)} minLabel="Juntos" maxLabel="Separados" />
            <Stepper label="Altura" value={tune.eyeHeight ?? 0} onChange={(v) => setTune('eyeHeight', v)} minLabel="Abajo" maxLabel="Arriba" />
          </>
        ) : null}

        {activeCat === 'nose' ? (
          <>
            <Section title="Tipo de nariz">
              <PartGrid items={NOSE_STYLES} value={pet.noseStyle ?? (isHuman ? 'button' : 'none')} onPick={(id) => change({ noseStyle: id })} icon={(id) => <MiiPartIcon kind="nose" value={id} pet={pet} />} />
            </Section>
            {!isHuman && pet.species !== 'puff' && pet.species !== 'meeseeks' ? (
              <Text style={styles.hint}>Esta especie ya tiene su propio hocico; la nariz se ve en Persona, Chibi y Muñeco.</Text>
            ) : null}
            <Stepper label="Tamaño" value={tune.noseSize ?? 0} onChange={(v) => setTune('noseSize', v)} minLabel="Pequeña" maxLabel="Grande" />
            <Stepper label="Altura" value={tune.noseHeight ?? 0} onChange={(v) => setTune('noseHeight', v)} minLabel="Abajo" maxLabel="Arriba" />
          </>
        ) : null}

        {activeCat === 'mouth' ? (
          <>
            <Section title="Tipo de boca">
              <PartGrid items={MOUTH_STYLES} value={pet.mouthStyle ?? 'smile'} onPick={(id) => change({ mouthStyle: id })} icon={(id) => <MiiPartIcon kind="mouth" value={id} pet={pet} />} />
            </Section>
            <Section title="Color de labios">
              <Swatches colors={LIP_COLORS} value={pet.lipColor} onPick={(c) => change({ lipColor: c })} />
            </Section>
            <Stepper label="Tamaño" value={tune.mouthSize ?? 0} onChange={(v) => setTune('mouthSize', v)} minLabel="Pequeña" maxLabel="Grande" />
            <Stepper label="Ancho" value={tune.mouthStretch ?? 0} onChange={(v) => setTune('mouthStretch', v)} minLabel="Estrecha" maxLabel="Ancha" />
            <Stepper label="Altura" value={tune.mouthHeight ?? 0} onChange={(v) => setTune('mouthHeight', v)} minLabel="Abajo" maxLabel="Arriba" />
          </>
        ) : null}

        {activeCat === 'beard' ? (
          <>
            <Section title="Barba y bigote">
              <PartGrid items={FACIAL_HAIR} value={pet.facialHair ?? 'none'} onPick={(id) => change({ facialHair: id })} icon={(id) => <MiiPartIcon kind="beard" value={id} pet={pet} />} />
            </Section>
            <Section title="Color de barba y bigote">
              <Swatches colors={HAIR_COLORS} value={pet.beardColor ?? pet.hairColor} onPick={(c) => change({ beardColor: c })} />
            </Section>
            <Stepper label="Tamaño del bigote" value={tune.mustacheSize ?? 0} onChange={(v) => setTune('mustacheSize', v)} minLabel="Pequeño" maxLabel="Grande" />
            <Stepper label="Ancho del bigote" value={tune.mustacheStretch ?? 0} onChange={(v) => setTune('mustacheStretch', v)} minLabel="Estrecho" maxLabel="Ancho" />
            <Stepper label="Altura del bigote" value={tune.mustacheHeight ?? 0} onChange={(v) => setTune('mustacheHeight', v)} minLabel="Abajo" maxLabel="Arriba" />
          </>
        ) : null}

        {activeCat === 'glasses' ? (
          <>
            <Section title="Gafas (se combinan con cualquier gorro)">
              <PartGrid items={GLASSES} value={pet.glasses ?? 'none'} onPick={(id) => change({ glasses: id })} icon={(id) => <MiiPartIcon kind="glasses" value={id} pet={pet} />} />
            </Section>
            {pet.glasses && pet.glasses !== 'none' ? (
              <>
                <Section title="Color de la montura">
                  <Swatches colors={GLASSES_COLORS} value={pet.glassesColor} onPick={(c) => change({ glassesColor: c })} />
                </Section>
                <Stepper label="Tamaño" value={tune.glassesSize ?? 0} onChange={(v) => setTune('glassesSize', v)} minLabel="Pequeñas" maxLabel="Grandes" />
                <Stepper label="Altura" value={tune.glassesHeight ?? 0} onChange={(v) => setTune('glassesHeight', v)} minLabel="Abajo" maxLabel="Arriba" />
              </>
            ) : null}
          </>
        ) : null}

        {activeCat === 'clothes' ? (
          <>
            <Section title="Ropa (usa tu color favorito)">
              <PartGrid
                items={OUTFITS.filter((o) => o.cost === 0).map((o) => ({ id: o.id, label: o.label }))}
                value={pet.outfit ?? 'none'}
                onPick={(id) => change({ outfit: id })}
                icon={(id) => <MiiPartIcon kind="outfit" value={id} pet={pet} />}
              />
            </Section>
            <Section title="Color favorito">
              <Swatches colors={FAVORITE_COLORS} value={pet.bellyColor} onPick={(c) => change({ bellyColor: c })} />
            </Section>
            {isHuman ? (
              <Section title="Parte de abajo">
                <View style={styles.chipRow}>
                  {PANTS_STYLES.map((ps) => {
                    const active = (pet.pantsStyle ?? 'jeans') === ps.id;
                    return (
                      <PressableScale key={ps.id} hapticKind="select" onPress={() => change({ pantsStyle: ps.id })} style={[styles.chip, active && styles.chipActive]}>
                        <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{ps.label}</Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </Section>
            ) : null}
            {isHuman ? (
              <Section title="Color del pantalón y zapatos">
                <Swatches colors={PANTS_COLORS} value={pet.pantsColor} onPick={(c) => change({ pantsColor: c })} />
              </Section>
            ) : (
              <Section title="Zapatos y detalles">
                <Swatches colors={BELLY_COLORS} value={pet.bellyColor} onPick={(c) => change({ bellyColor: c })} />
              </Section>
            )}
            <Text style={styles.hint}>Los trajes especiales (pirata, capitán, montaña…) se consiguen con monedas en la tienda de tu mascota.</Text>
          </>
        ) : null}

        {activeCat === 'hats' ? (
          <Section title="Gorros y accesorios">
            <PartGrid
              items={ACCESSORIES.filter((a) => a.id !== 'glasses').map((a) => ({ id: a.id, label: a.label }))}
              value={pet.accessory === 'glasses' ? 'none' : pet.accessory}
              locked={(id) => {
                const a = ACCESSORIES.find((x) => x.id === id);
                return a && playerLevel < a.unlockLevel ? `Nivel ${a.unlockLevel}` : null;
              }}
              onPick={(id) => change({ accessory: id })}
              icon={(id) => <MiiPartIcon kind="hat" value={id} pet={pet} />}
            />
          </Section>
        ) : null}

        {activeCat === 'voice' ? (
          <>
            <Section title="Voz">
              <View style={styles.chipRow}>
                {VOICE_PRESETS.map((v) => {
                  const active = Math.abs((pet.voicePitch ?? 1) - v.pitch) < 0.01 && Math.abs((pet.voiceRate ?? 1) - v.rate) < 0.01;
                  return (
                    <PressableScale
                      key={v.id}
                      hapticKind="select"
                      onPress={() => {
                        change({ voicePitch: v.pitch, voiceRate: v.rate });
                        onSpeakSample?.(pet.catchphrase ?? 'Hello!', v.pitch, v.rate);
                      }}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Glyph name={v.glyph} size={18} />
                      <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{v.labelEs}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </Section>
            <Stepper
              label="Tono"
              value={Math.round(((pet.voicePitch ?? 1) - 1.05) / 0.1)}
              onChange={(v) => change({ voicePitch: Math.round((1.05 + v * 0.1) * 100) / 100 })}
              minLabel="Grave"
              maxLabel="Agudo"
            />
            <Stepper
              label="Velocidad"
              value={Math.round(((pet.voiceRate ?? 1) - 1) / 0.07)}
              onChange={(v) => change({ voiceRate: Math.round((1 + v * 0.07) * 100) / 100 })}
              minLabel="Lenta"
              maxLabel="Rápida"
            />
            {onSpeakSample ? (
              <PressableScale hapticKind="medium" onPress={() => onSpeakSample(pet.catchphrase ?? 'Hello!', pet.voicePitch ?? 1, pet.voiceRate ?? 1)} style={styles.listenBtn}>
                <Glyph name="mic" size={20} />
                <Text style={styles.listenText}>Escuchar su voz</Text>
              </PressableScale>
            ) : null}
            <Section title="Personalidad">
              <View style={styles.chipRow}>
                {PERSONALITIES.map((p) => {
                  const active = (pet.personality ?? 'energetic') === p.id;
                  return (
                    <PressableScale key={p.id} hapticKind="select" onPress={() => change({ personality: p.id })} style={[styles.chip, active && styles.chipActive]}>
                      <Glyph name={p.glyph} size={18} />
                      <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{p.labelEs}</Text>
                    </PressableScale>
                  );
                })}
              </View>
              <Text style={styles.hint}>{PERSONALITIES.find((p) => p.id === (pet.personality ?? 'energetic'))?.descEs}</Text>
            </Section>
            <Section title="Frase favorita">
              <View style={styles.chipRow}>
                {SUGGESTED_CATCHPHRASES.map((c) => {
                  const active = pet.catchphrase === c;
                  return (
                    <PressableScale key={c} hapticKind="select" onPress={() => change({ catchphrase: c })} style={[styles.chip, active && styles.chipActive]}>
                      <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{c}</Text>
                    </PressableScale>
                  );
                })}
              </View>
            </Section>
          </>
        ) : null}
      </View>

      {showPreview ? (
        <View style={styles.moodRow}>
          {(['happy', 'love', 'celebrate', 'sleepy'] as const).map((m) => (
            <PressableScale
              key={m}
              hapticKind="select"
              onPress={() => {
                setMood(m);
                setReactKey((k) => k + 1);
              }}
              style={[styles.moodChip, mood === m && styles.chipActive]}
            >
              <Glyph name={`face-${m}`} size={20} />
            </PressableScale>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 12 },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF3FF',
    borderRadius: 28,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  zoomPill: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  zoomPillText: { fontSize: 11, fontWeight: '800', color: THEME.ink2 },
  catRow: { gap: 8, paddingHorizontal: 2, paddingVertical: 2 },
  catTile: {
    width: 74,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.surface,
    borderWidth: 2,
    borderColor: THEME.fill2,
    ...SHADOW.card,
  },
  catIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontSize: 12, fontWeight: '800', color: THEME.ink },
  panel: {
    backgroundColor: THEME.surface,
    borderRadius: 24,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: THEME.hairline,
  },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: THEME.ink3, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: 76,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: THEME.fill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tileActive: { backgroundColor: '#FFF7E0', borderColor: '#F5B841' },
  tileLabel: { fontSize: 10.5, fontWeight: '700', color: THEME.ink2, paddingHorizontal: 4 },
  tileLabelActive: { color: '#A16207', fontWeight: '800' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchRing: { padding: 3, borderRadius: 999, borderWidth: 2.5, borderColor: 'transparent' },
  swatchRingActive: { borderColor: THEME.blue },
  swatch: { width: 30, height: 30, borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(30,36,54,0.25)' },
  stepper: { gap: 4 },
  stepperLabel: { fontSize: 13, fontWeight: '800', color: THEME.ink },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: THEME.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: -2 },
  stepTrack: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.fill,
    borderRadius: 999,
    paddingHorizontal: 6,
    height: 30,
  },
  stepHit: { padding: 6 },
  stepDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: THEME.fill2 },
  stepDotCenter: { backgroundColor: '#C7D2E6' },
  stepDotActive: { width: 18, height: 18, backgroundColor: '#F5B841', borderWidth: 2, borderColor: '#FFFFFF' },
  stepEnds: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 46 },
  stepEndText: { fontSize: 10.5, color: THEME.ink3, fontWeight: '700' },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: THEME.fill,
  },
  toggleOn: { backgroundColor: THEME.blue },
  toggleDot: { width: 14, height: 14, borderRadius: 999, borderWidth: 2, borderColor: THEME.ink3 },
  toggleDotOn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  toggleText: { fontSize: 13, fontWeight: '800', color: THEME.ink },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: THEME.fill,
  },
  chipActive: { backgroundColor: THEME.blue },
  chipText: { fontSize: 13, fontWeight: '700', color: THEME.ink },
  hint: { fontSize: 12.5, color: THEME.ink2, lineHeight: 17 },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFF0F6',
    borderWidth: 1.5,
    borderColor: '#F9A8D4',
  },
  listenText: { fontSize: 13, fontWeight: '800', color: '#BE185D' },
  moodRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  moodChip: { padding: 8, borderRadius: 999, backgroundColor: THEME.fill },
});
