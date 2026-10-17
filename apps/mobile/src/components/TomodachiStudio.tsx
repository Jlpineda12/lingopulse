import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  ACCESSORIES,
  BELLY_COLORS,
  BLUSH_STYLES,
  BODY_COLORS,
  BODY_SCALES,
  BROW_STYLES,
  EYE_STYLES,
  HABITAT_PROPS,
  HAIR_COLORS,
  HAIR_STYLES,
  MOUTH_STYLES,
  PERSONALITIES,
  SPECIES,
  SPECIES_PRESET_COLORS,
  SUGGESTED_CATCHPHRASES,
  VOICE_PRESETS,
  type AccessoryId,
  type BlushStyle,
  type BodyScale,
  type BrowStyle,
  type EyeStyle,
  type HabitatPropId,
  type HairStyleId,
  type MouthStyle,
  type PetConfig,
  type PetSpecies,
} from '../game/pet';
import { HabitatPropIllustration } from './GameVfx';
import { Pet3D } from './Pet3D';
import { PressableScale } from './motion';
import { SHADOW, THEME, TYPE } from '../theme/colors';
import { Glyph } from './Glyph';

const TOON_INK = '#1E2436';

export type TomodachiCategoryTab =
  | 'hair'
  | 'eyes'
  | 'mouth'
  | 'brows'
  | 'cheeks'
  | 'body'
  | 'hats'
  | 'habitat'
  | 'soul';

/**
 * Renderiza el modelo en miniatura con sombreado 3D cel-shaded de cada rasgo
 * al estilo de las casillas del Mii Maker / Tomodachi Life.
 */
export function TomodachiPartModelPreview({
  kind,
  value,
  bodyColor,
  hairColor,
  bellyColor,
  size = 64,
}: {
  kind: 'hair' | 'eye' | 'mouth' | 'brow' | 'blush' | 'species' | 'scale' | 'hat';
  value: string;
  bodyColor: string;
  hairColor: string;
  bellyColor: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 68 68">
      <Defs>
        <SvgLinearGradient id="headShade" x1="0" y1="0" x2="0.8" y2="1">
          <Stop offset="0%" stopColor={bodyColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={bodyColor} stopOpacity="0.84" />
        </SvgLinearGradient>
      </Defs>

      {/* Fondo de esfera de estudio 3D suave */}
      <Circle cx="34" cy="34" r="30" fill="#EFF5FF" />
      <Ellipse cx="34" cy="57" rx="18" ry="4" fill="#CBD5E1" opacity={0.65} />

      {/* ================================================================= */}
      {/* 1. PREVIEW 3D DE LOS 10 ESTILOS DE CABELLO                        */}
      {/* ================================================================= */}
      {kind === 'hair' && (
        <G>
          {/* Cabeza maniquí 3D */}
          <Circle
            cx="34"
            cy="39"
            r="16"
            fill="url(#headShade)"
            stroke={TOON_INK}
            strokeWidth="2.4"
          />
          {/* Brillo especular 3D en la cabeza */}
          <Ellipse cx="28" cy="32" rx="4.5" ry="2.5" fill="#FFFFFF" opacity={0.55} />
          {/* Ojos guía suaves */}
          <Circle cx="29" cy="40" r="1.8" fill={TOON_INK} />
          <Circle cx="39" cy="40" r="1.8" fill={TOON_INK} />
          <Path d="M 31 45 Q 34 48 37 45" stroke={TOON_INK} strokeWidth="1.8" fill="none" strokeLinecap="round" />

          {value === 'spiky' && (
            <G>
              <Polygon
                points="20,28 15,14 27,23 34,10 41,23 53,14 48,28"
                fill={hairColor}
                stroke={TOON_INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Polygon points="31,22 34,12 37,22" fill="#FFFFFF" opacity={0.28} />
            </G>
          )}

          {value === 'bob' && (
            <G>
              <Path
                d="M 16 42 C 15 22, 24 17, 34 17 C 44 17, 53 22, 52 42 L 47 44 L 46 31 L 22 31 L 21 44 Z"
                fill={hairColor}
                stroke={TOON_INK}
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <Ellipse cx="34" cy="22" rx="9" ry="3" fill="#FFFFFF" opacity={0.25} />
            </G>
          )}

          {value === 'afro' && (
            <G>
              <Circle cx="22" cy="25" r="9" fill={hairColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Circle cx="46" cy="25" r="9" fill={hairColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Circle cx="34" cy="19" r="12" fill={hairColor} stroke={TOON_INK} strokeWidth="2.3" />
              <Ellipse cx="30" cy="14" rx="5" ry="2.5" fill="#FFFFFF" opacity={0.3} />
            </G>
          )}

          {value === 'ponytail' && (
            <G>
              <Path
                d="M 44 20 Q 58 14 57 32 Q 52 30 45 26 Z"
                fill={hairColor}
                stroke={TOON_INK}
                strokeWidth="2.2"
              />
              <Circle cx="45" cy="22" r="3.5" fill={bellyColor} stroke={TOON_INK} strokeWidth="1.8" />
              <Path
                d="M 19 31 C 21 20, 47 20, 49 31 Z"
                fill={hairColor}
                stroke={TOON_INK}
                strokeWidth="2.3"
              />
            </G>
          )}

          {value === 'twintails' && (
            <G>
              <Polygon points="17,27 7,42 18,40" fill={hairColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Polygon points="51,27 61,42 50,40" fill={hairColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Circle cx="17" cy="27" r="3.2" fill={bellyColor} stroke={TOON_INK} strokeWidth="1.8" />
              <Circle cx="51" cy="27" r="3.2" fill={bellyColor} stroke={TOON_INK} strokeWidth="1.8" />
              <Path d="M 19 31 C 22 20, 46 20, 49 31 Z" fill={hairColor} stroke={TOON_INK} strokeWidth="2.2" />
            </G>
          )}

          {value === 'pompadour' && (
            <G>
              <Path
                d="M 19 30 C 17 16, 38 10, 49 18 C 54 22, 49 31, 44 31 Z"
                fill={hairColor}
                stroke={TOON_INK}
                strokeWidth="2.3"
              />
              <Ellipse cx="35" cy="18" rx="8" ry="3" fill="#FFFFFF" opacity={0.32} />
            </G>
          )}

          {value === 'curly' && (
            <G>
              {[20, 27, 34, 41, 48].map((cx, i) => (
                <Circle
                  key={cx}
                  cx={cx}
                  cy={i % 2 === 0 ? 25 : 22}
                  r="6.2"
                  fill={hairColor}
                  stroke={TOON_INK}
                  strokeWidth="2.1"
                />
              ))}
            </G>
          )}

          {value === 'mohawk' && (
            <G>
              <Polygon
                points="28,26 30,10 34,19 34,8 38,19 40,11 41,26"
                fill={hairColor}
                stroke={TOON_INK}
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </G>
          )}

          {value === 'bun' && (
            <G>
              <Circle cx="34" cy="14" r="7.5" fill={hairColor} stroke={TOON_INK} strokeWidth="2.3" />
              <Rect x="28" y="19" width="12" height="3.2" rx="1.6" fill="#FACC15" stroke={TOON_INK} strokeWidth="1.6" />
              <Path d="M 19 31 C 22 21, 46 21, 49 31 Z" fill={hairColor} stroke={TOON_INK} strokeWidth="2.2" />
            </G>
          )}
        </G>
      )}

      {/* ================================================================= */}
      {/* 2. PREVIEW 3D DE LOS 10 MODELOS DE OJOS                           */}
      {/* ================================================================= */}
      {kind === 'eye' && (
        <G>
          <Rect
            x="10"
            y="16"
            width="48"
            height="36"
            rx="18"
            fill="url(#headShade)"
            stroke={TOON_INK}
            strokeWidth="2.3"
          />
          {value === 'round' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Ellipse cx={cx} cy="34" rx="5.5" ry="8.5" fill={TOON_INK} />
                    <Ellipse cx={cx} cy="37" rx="3.8" ry="4" fill="#3B82F6" />
                    <Circle cx={cx - 1.6} cy="30.5" r="2.2" fill="#FFFFFF" />
                  </G>
                );
              })}
            </G>
          )}
          {value === 'sparkle' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Ellipse cx={cx} cy="34" rx="6.2" ry="9.5" fill={TOON_INK} />
                    <Ellipse cx={cx} cy="37.5" rx="4.5" ry="4.5" fill="#3B82F6" />
                    <Circle cx={cx - 1.8} cy="30" r="2.5" fill="#FFFFFF" />
                    <Circle cx={cx + 2} cy="38" r="1.3" fill="#FFFFFF" />
                  </G>
                );
              })}
            </G>
          )}
          {value === 'happy' && (
            <G>
              <Path d="M 17 36 Q 23 26 29 36" stroke={TOON_INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
              <Path d="M 39 36 Q 45 26 51 36" stroke={TOON_INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            </G>
          )}
          {value === 'wink' && (
            <G>
              <Ellipse cx="23" cy="34" rx="5.5" ry="8.5" fill={TOON_INK} />
              <Circle cx="21.5" cy="30.5" r="2.2" fill="#FFFFFF" />
              <Path d="M 39 35 Q 45 27 51 35" stroke={TOON_INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            </G>
          )}
          {value === 'fierce' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Ellipse cx={cx} cy="35" rx="5.2" ry="7.2" fill={TOON_INK} />
                    <Circle cx={cx - 1.2} cy="32.5" r="2" fill="#FFFFFF" />
                    <Path
                      d={`M ${cx - s * 6} 26 L ${cx + s * 6} 30`}
                      stroke={TOON_INK}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </G>
                );
              })}
            </G>
          )}
          {value === 'anime' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Ellipse cx={cx} cy="34" rx="7" ry="10.2" fill={TOON_INK} />
                    <Ellipse cx={cx} cy="37" rx="5.2" ry="5.5" fill="#60A5FA" />
                    <Circle cx={cx - 2.2} cy="29.5" r="3" fill="#FFFFFF" />
                    <Circle cx={cx + 2.2} cy="38.5" r="1.6" fill="#FFFFFF" />
                  </G>
                );
              })}
            </G>
          )}
          {value === 'sleepy' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Ellipse cx={cx} cy="35" rx="5.8" ry="7.5" fill={TOON_INK} />
                    <Path
                      d={`M ${cx - 6.2} 34 A 6 6 0 0 1 ${cx + 6.2} 34 Z`}
                      fill={bodyColor}
                      stroke={TOON_INK}
                      strokeWidth="2.2"
                    />
                  </G>
                );
              })}
            </G>
          )}
          {value === 'heart' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Ellipse cx={cx} cy="34" rx="6" ry="9" fill={TOON_INK} />
                    <Path
                      d={`M ${cx} 38 C ${cx - 4} 35, ${cx - 4} 31, ${cx} 33 C ${cx + 4} 31, ${cx + 4} 35, ${cx} 38 Z`}
                      fill="#FF4D79"
                    />
                  </G>
                );
              })}
            </G>
          )}
          {value === 'cool' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Rect x={cx - 6} y="30" width="12" height="7" rx="3.5" fill="#FFFFFF" stroke={TOON_INK} strokeWidth="2.2" />
                    <Circle cx={cx} cy="33.5" r="2.5" fill={TOON_INK} />
                  </G>
                );
              })}
            </G>
          )}
          {value === 'starry' && (
            <G>
              {[-1, 1].map((s) => {
                const cx = 34 + s * 11;
                return (
                  <G key={s}>
                    <Ellipse cx={cx} cy="34" rx="6" ry="9" fill={TOON_INK} />
                    <Polygon
                      points={`${cx},29 ${cx + 1.6},33 ${cx + 4.5},34 ${cx + 1.6},35.5 ${cx},39.5 ${cx - 1.6},35.5 ${cx - 4.5},34 ${cx - 1.6},33`}
                      fill="#FACC15"
                    />
                  </G>
                );
              })}
            </G>
          )}
        </G>
      )}

      {/* ================================================================= */}
      {/* 3. PREVIEW 3D DE LOS 10 MODELOS DE BOCA                           */}
      {/* ================================================================= */}
      {kind === 'mouth' && (
        <G>
          <Rect
            x="12"
            y="18"
            width="44"
            height="34"
            rx="17"
            fill="url(#headShade)"
            stroke={TOON_INK}
            strokeWidth="2.3"
          />
          {value === 'smile' && (
            <Path d="M 24 32 Q 34 43 44 32" stroke={TOON_INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          )}
          {value === 'cat' && (
            <Path d="M 22 34 Q 28 41 34 33 Q 40 41 46 34" stroke={TOON_INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          )}
          {value === 'grin' && (
            <Path
              d="M 22 30 Q 34 46 46 30 Z"
              fill="#FFFFFF"
              stroke={TOON_INK}
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
          )}
          {value === 'smirk' && (
            <Path d="M 23 36 Q 35 37 45 29" stroke={TOON_INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          )}
          {value === 'o' && (
            <Circle cx="34" cy="35" r="6" fill="#2B1020" stroke={TOON_INK} strokeWidth="2.5" />
          )}
          {value === 'tongue' && (
            <G>
              <Path d="M 23 31 Q 34 40 45 31" stroke={TOON_INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <Path d="M 30 35 Q 34 46 39 35 Z" fill="#FF6B8B" stroke={TOON_INK} strokeWidth="2.2" />
            </G>
          )}
          {value === 'fangs' && (
            <G>
              <Path d="M 22 32 Q 34 40 46 32" stroke={TOON_INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <Polygon points="26,34 29,41 31,35" fill="#FFFFFF" stroke={TOON_INK} strokeWidth="1.6" />
              <Polygon points="42,34 39,41 37,35" fill="#FFFFFF" stroke={TOON_INK} strokeWidth="1.6" />
            </G>
          )}
          {value === 'pout' && (
            <Path d="M 25 39 Q 34 31 43 39" stroke={TOON_INK} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          )}
          {value === 'wavy' && (
            <Path d="M 21 35 Q 27 29 34 35 Q 41 41 47 35" stroke={TOON_INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          )}
          {value === 'kiss' && (
            <Path d="M 31 29 Q 38 32 32 35 Q 38 38 31 41" stroke={TOON_INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
          )}
        </G>
      )}

      {/* ================================================================= */}
      {/* 4. PREVIEW 3D DE LOS 10 MODELOS DE CEJAS                          */}
      {/* ================================================================= */}
      {kind === 'brow' && (
        <G>
          <Rect
            x="10"
            y="18"
            width="48"
            height="34"
            rx="17"
            fill="url(#headShade)"
            stroke={TOON_INK}
            strokeWidth="2.3"
          />
          {/* Ojos de referencia suaves */}
          <Circle cx="24" cy="39" r="2.8" fill={TOON_INK} opacity={0.45} />
          <Circle cx="44" cy="39" r="2.8" fill={TOON_INK} opacity={0.45} />

          {value === 'soft' && (
            <G>
              <Path d="M 18 29 Q 24 27 29 29" stroke={TOON_INK} strokeWidth="3" fill="none" strokeLinecap="round" />
              <Path d="M 39 29 Q 44 27 50 29" stroke={TOON_INK} strokeWidth="3" fill="none" strokeLinecap="round" />
            </G>
          )}
          {value === 'bold' && (
            <G>
              <Rect x="16" y="25" width="14" height="5.5" rx="2.7" fill={TOON_INK} />
              <Rect x="38" y="25" width="14" height="5.5" rx="2.7" fill={TOON_INK} />
            </G>
          )}
          {value === 'hero' && (
            <G>
              <Path d="M 17 26 L 29 31" stroke={TOON_INK} strokeWidth="3.6" strokeLinecap="round" />
              <Path d="M 51 26 L 39 31" stroke={TOON_INK} strokeWidth="3.6" strokeLinecap="round" />
            </G>
          )}
          {value === 'worried' && (
            <G>
              <Path d="M 17 31 L 29 26" stroke={TOON_INK} strokeWidth="3.2" strokeLinecap="round" />
              <Path d="M 51 31 L 39 26" stroke={TOON_INK} strokeWidth="3.2" strokeLinecap="round" />
            </G>
          )}
          {value === 'raised' && (
            <G>
              <Path d="M 17 29 Q 23 22 29 29" stroke={TOON_INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <Path d="M 39 29 Q 45 22 51 29" stroke={TOON_INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            </G>
          )}
          {value === 'dot' && (
            <G>
              <Ellipse cx="24" cy="27" rx="4.2" ry="3.2" fill={TOON_INK} />
              <Ellipse cx="44" cy="27" rx="4.2" ry="3.2" fill={TOON_INK} />
            </G>
          )}
          {value === 'unibrow' && (
            <Path d="M 16 28 Q 34 31 52 28" stroke={TOON_INK} strokeWidth="4.6" fill="none" strokeLinecap="round" />
          )}
          {value === 'slit' && (
            <G>
              <Path d="M 17 28 L 29 28" stroke={TOON_INK} strokeWidth="3.6" strokeLinecap="round" />
              <Path d="M 39 28 L 46 28" stroke={TOON_INK} strokeWidth="3.6" strokeLinecap="round" />
              <Path d="M 49 28 L 52 28" stroke={TOON_INK} strokeWidth="3.6" strokeLinecap="round" />
            </G>
          )}
          {value === 'short' && (
            <G>
              <Path d="M 21 28 L 27 28" stroke={TOON_INK} strokeWidth="2.6" strokeLinecap="round" />
              <Path d="M 41 28 L 47 28" stroke={TOON_INK} strokeWidth="2.6" strokeLinecap="round" />
            </G>
          )}
        </G>
      )}

      {/* ================================================================= */}
      {/* 5. PREVIEW 3D DE LOS 10 MODELOS DE MEJILLAS / RASGOS              */}
      {/* ================================================================= */}
      {kind === 'blush' && (
        <G>
          <Rect
            x="10"
            y="16"
            width="48"
            height="36"
            rx="18"
            fill="url(#headShade)"
            stroke={TOON_INK}
            strokeWidth="2.3"
          />
          <Path d="M 29 36 Q 34 40 39 36" stroke={TOON_INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />

          {value === 'pink' && (
            <G>
              <Ellipse cx="20" cy="36" rx="5.5" ry="3.2" fill="#FF759F" opacity={0.85} />
              <Ellipse cx="48" cy="36" rx="5.5" ry="3.2" fill="#FF759F" opacity={0.85} />
            </G>
          )}
          {value === 'peach' && (
            <G>
              <Ellipse cx="20" cy="36" rx="5.5" ry="3.2" fill="#FF9E6D" opacity={0.88} />
              <Ellipse cx="48" cy="36" rx="5.5" ry="3.2" fill="#FF9E6D" opacity={0.88} />
            </G>
          )}
          {value === 'freckles' && (
            <G>
              {[17, 20, 23, 45, 48, 51].map((fx, i) => (
                <Circle key={fx} cx={fx} cy={i % 2 === 0 ? 35 : 37} r="1.4" fill="#8D5524" />
              ))}
            </G>
          )}
          {value === 'star' && (
            <G>
              <Polygon points="20,31 22,35 20,39 18,35" fill="#FACC15" stroke={TOON_INK} strokeWidth="1.3" />
              <Polygon points="48,31 50,35 48,39 46,35" fill="#FACC15" stroke={TOON_INK} strokeWidth="1.3" />
            </G>
          )}
          {value === 'hearts' && (
            <G>
              <Circle cx="19" cy="35" r="2.6" fill="#FF4D79" />
              <Circle cx="21.5" cy="35" r="2.6" fill="#FF4D79" />
              <Circle cx="46.5" cy="35" r="2.6" fill="#FF4D79" />
              <Circle cx="49" cy="35" r="2.6" fill="#FF4D79" />
            </G>
          )}
          {value === 'bandaid' && (
            <G transform="rotate(-18 45 34)">
              <Rect x="38" y="31" width="14" height="6" rx="2" fill="#FDE68A" stroke={TOON_INK} strokeWidth="1.8" />
              <Rect x="42.5" y="31" width="5" height="6" fill="#FEF3C7" stroke={TOON_INK} strokeWidth="1.2" />
            </G>
          )}
          {value === 'whiskers' && (
            <G>
              <Path d="M 12 33 L 22 35 M 12 38 L 22 37" stroke={TOON_INK} strokeWidth="2.2" strokeLinecap="round" />
              <Path d="M 56 33 L 46 35 M 56 38 L 46 37" stroke={TOON_INK} strokeWidth="2.2" strokeLinecap="round" />
            </G>
          )}
          {value === 'stripes' && (
            <G>
              <Rect x="15" y="33" width="8" height="2.4" rx="1.2" fill={bellyColor} />
              <Rect x="15" y="37" width="8" height="2.4" rx="1.2" fill={bellyColor} />
              <Rect x="45" y="33" width="8" height="2.4" rx="1.2" fill={bellyColor} />
              <Rect x="45" y="37" width="8" height="2.4" rx="1.2" fill={bellyColor} />
            </G>
          )}
          {value === 'dimples' && (
            <G>
              <Path d="M 24 33 Q 21 36 24 39" stroke={TOON_INK} strokeWidth="2.3" fill="none" strokeLinecap="round" />
              <Path d="M 44 33 Q 47 36 44 39" stroke={TOON_INK} strokeWidth="2.3" fill="none" strokeLinecap="round" />
            </G>
          )}
        </G>
      )}

      {/* ================================================================= */}
      {/* 6. PREVIEW 3D DE SILUETA DE CUERPO Y COMPLEXIÓN                   */}
      {/* ================================================================= */}
      {kind === 'species' && (
        <G>
          {value === 'puff' && (
            <G>
              <Circle cx="34" cy="36" r="16" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.4" />
              <Ellipse cx="26" cy="52" rx="5" ry="3" fill={bellyColor} stroke={TOON_INK} strokeWidth="2" />
              <Ellipse cx="42" cy="52" rx="5" ry="3" fill={bellyColor} stroke={TOON_INK} strokeWidth="2" />
            </G>
          )}
          {value === 'meeseeks' && (
            <G>
              <Ellipse cx="34" cy="26" rx="11" ry="12" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.3" />
              <Ellipse cx="34" cy="44" rx="8.5" ry="11" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.3" />
            </G>
          )}
          {value === 'cat' && (
            <G>
              <Polygon points="20,28 18,14 28,22" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Polygon points="48,28 50,14 40,22" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Circle cx="34" cy="36" r="15" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.4" />
            </G>
          )}
          {value === 'dragon' && (
            <G>
              <Polygon points="24,22 20,11 29,19" fill="#FACC15" stroke={TOON_INK} strokeWidth="2" />
              <Polygon points="44,22 48,11 39,19" fill="#FACC15" stroke={TOON_INK} strokeWidth="2" />
              <Circle cx="34" cy="37" r="15" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.4" />
            </G>
          )}
          {value === 'bear' && (
            <G>
              <Circle cx="21" cy="23" r="5.5" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Circle cx="47" cy="23" r="5.5" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Circle cx="34" cy="37" r="15" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.4" />
            </G>
          )}
          {value === 'bunny' && (
            <G>
              <Ellipse cx="27" cy="19" rx="3.8" ry="10" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Ellipse cx="41" cy="19" rx="3.8" ry="10" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.2" />
              <Circle cx="34" cy="39" r="14" fill={bodyColor} stroke={TOON_INK} strokeWidth="2.4" />
            </G>
          )}
          <Circle cx="29" cy="35" r="1.8" fill={TOON_INK} />
          <Circle cx="39" cy="35" r="1.8" fill={TOON_INK} />
        </G>
      )}

      {kind === 'scale' && (
        <G>
          <Ellipse
            cx="34"
            cy="36"
            rx={value === 'chubby' ? 19 : value === 'tall' ? 11.5 : 15}
            ry={value === 'tall' ? 19.5 : value === 'chibi' ? 13.5 : 15.5}
            fill={bodyColor}
            stroke={TOON_INK}
            strokeWidth="2.4"
          />
          <Circle cx="29" cy="34" r="1.8" fill={TOON_INK} />
          <Circle cx="39" cy="34" r="1.8" fill={TOON_INK} />
        </G>
      )}

      {/* ================================================================= */}
      {/* 7. PREVIEW 3D DE LOS 10 SOMBREROS / ACCESORIOS                    */}
      {/* ================================================================= */}
      {kind === 'hat' && (
        <G>
          <Circle cx="34" cy="41" r="14" fill="url(#headShade)" stroke={TOON_INK} strokeWidth="2.3" />
          <Circle cx="29" cy="41" r="1.7" fill={TOON_INK} />
          <Circle cx="39" cy="41" r="1.7" fill={TOON_INK} />

          {value === 'crown' && (
            <Polygon
              points="21,29 21,16 27,23 34,13 41,23 47,16 47,29"
              fill="#FACC15"
              stroke={TOON_INK}
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          )}
          {value === 'beret' && (
            <Ellipse cx="32" cy="26" rx="15" ry="6" fill="#3B4CCA" stroke={TOON_INK} strokeWidth="2.2" />
          )}
          {value === 'cap' && (
            <G>
              <Path d="M 20 29 A 14 11 0 0 1 48 29 Z" fill="#FF4D6D" stroke={TOON_INK} strokeWidth="2.2" />
              <Rect x="32" y="26" width="20" height="4.5" rx="2.2" fill="#FF4D6D" stroke={TOON_INK} strokeWidth="2" />
            </G>
          )}
          {value === 'bow' && (
            <G>
              <Polygon points="34,25 22,18 22,32" fill="#FF4D6D" stroke={TOON_INK} strokeWidth="2" />
              <Polygon points="34,25 46,18 46,32" fill="#FF4D6D" stroke={TOON_INK} strokeWidth="2" />
              <Circle cx="34" cy="25" r="3.5" fill="#FF4D6D" stroke={TOON_INK} strokeWidth="2" />
            </G>
          )}
          {value === 'glasses' && (
            <G>
              <Circle cx="27" cy="41" r="5.5" fill="#BAE6FD" stroke={TOON_INK} strokeWidth="2.3" />
              <Circle cx="41" cy="41" r="5.5" fill="#BAE6FD" stroke={TOON_INK} strokeWidth="2.3" />
              <Path d="M 32.5 41 L 35.5 41" stroke={TOON_INK} strokeWidth="2.3" />
            </G>
          )}
          {value === 'headphones' && (
            <G>
              <Path d="M 17 41 A 17 17 0 0 1 51 41" stroke="#3B4CCA" strokeWidth="3.5" fill="none" />
              <Rect x="13" y="35" width="6" height="12" rx="3" fill="#FF4D6D" stroke={TOON_INK} strokeWidth="2" />
              <Rect x="49" y="35" width="6" height="12" rx="3" fill="#FF4D6D" stroke={TOON_INK} strokeWidth="2" />
            </G>
          )}
          {value === 'wizard' && (
            <G>
              <Polygon points="34,9 21,29 47,29" fill="#6C47FF" stroke={TOON_INK} strokeWidth="2.2" />
              <Ellipse cx="34" cy="29" rx="17" ry="4" fill="#6C47FF" stroke={TOON_INK} strokeWidth="2.2" />
            </G>
          )}
          {value === 'halo' && (
            <Ellipse
              cx="34"
              cy="18"
              rx="13"
              ry="4"
              fill="none"
              stroke="#FACC15"
              strokeWidth="3.6"
            />
          )}
          {value === 'flower' && (
            <G>
              <Path d="M 34 27 L 34 18" stroke="#16A34A" strokeWidth="2.8" />
              <Circle cx="30" cy="16" r="4" fill="#FFFFFF" stroke={TOON_INK} strokeWidth="1.8" />
              <Circle cx="38" cy="16" r="4" fill="#FFFFFF" stroke={TOON_INK} strokeWidth="1.8" />
              <Circle cx="34" cy="12" r="4" fill="#FFFFFF" stroke={TOON_INK} strokeWidth="1.8" />
              <Circle cx="34" cy="16" r="3.2" fill="#FACC15" stroke={TOON_INK} strokeWidth="1.8" />
            </G>
          )}
        </G>
      )}
    </Svg>
  );
}

/**
 * Estudio Completo de Personalización 3D estilo Tomodachi Life / Mii Maker.
 * Muestra las miniaturas 3D de cada uno de los 10 recursos por categoría (Cabello, Ojos, Boca, Cejas, Mejillas, Cuerpo, Gorros, Isla 3D, Voz).
 */
export function TomodachiCustomStudio({
  pet,
  onChangePet,
  unlockedProps = ['campfire', 'none'],
  onSelectHabitatProp,
  showHabitatTab = true,
  onSpeakSample,
}: {
  pet: PetConfig;
  onChangePet: (patch: Partial<PetConfig>) => void;
  unlockedProps?: HabitatPropId[];
  onSelectHabitatProp?: (propId: HabitatPropId) => void;
  showHabitatTab?: boolean;
  onSpeakSample?: (text: string) => void;
}) {
  const [tab, setTab] = useState<TomodachiCategoryTab>('hair');

  const tabs: Array<{ id: TomodachiCategoryTab; label: string; count: string; glyph: string }> = [
    { id: 'hair', label: 'Cabello', count: '10', glyph: 'hair' },
    { id: 'eyes', label: 'Ojos', count: '10', glyph: 'eyes-sparkle' },
    { id: 'mouth', label: 'Boca', count: '10', glyph: 'mouth-grin' },
    { id: 'brows', label: 'Cejas', count: '10', glyph: 'brow-bold' },
    { id: 'cheeks', label: 'Mejillas', count: '10', glyph: 'blush-pink' },
    { id: 'body', label: 'Cuerpo', count: '12', glyph: 'scale-normal' },
    { id: 'hats', label: 'Gorros', count: '14', glyph: 'strawhat' },
    ...(showHabitatTab
      ? ([{ id: 'habitat', label: 'Isla 3D', count: '6', glyph: 'campfire' }] as const)
      : []),
    { id: 'soul', label: 'Voz y alma', count: '5', glyph: 'mic' },
  ];

  const currentHairColor = pet.hairColor ?? '#4A2E1B';

  return (
    <View style={styles.studioWrap}>
      {/* Barra horizontal de categorías estilo Mii Maker / Tomodachi Life */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <PressableScale
              key={t.id}
              hapticKind="select"
              onPress={() => setTab(t.id)}
              style={[styles.tabPill, active && styles.tabPillActive]}
            >
              <Glyph name={t.glyph} size={22} />
              <Text style={[styles.tabPillText, active && { color: '#FFFFFF' }]}>
                {t.label}
              </Text>
              <View
                style={[
                  styles.tabCountBadge,
                  active && { backgroundColor: 'rgba(255,255,255,0.24)' },
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    active && { color: '#FFFFFF' },
                  ]}
                >
                  {t.count}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {/* 1. PESTAÑA CABELLO (10 MODELOS 3D + 12 COLORES DE CABELLO) */}
      {tab === 'hair' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Elige el modelo 3D de cabello (10 estilos)
          </Text>
          <View style={styles.modelGrid}>
            {HAIR_STYLES.map((h) => {
              const active = (pet.hairStyle ?? 'spiky') === h.id;
              return (
                <PressableScale
                  key={h.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ hairStyle: h.id })}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="hair"
                    value={h.id}
                    bodyColor={pet.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={pet.bellyColor}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {h.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Color del cabello 3D (12 tonos)</Text>
          <View style={styles.swatchRow}>
            {HAIR_COLORS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                active={currentHairColor === c}
                onPress={() => onChangePet({ hairColor: c })}
              />
            ))}
          </View>
        </View>
      )}

      {/* 2. PESTAÑA OJOS (10 MODELOS 3D) */}
      {tab === 'eyes' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Elige el modelo 3D de ojos (10 estilos)
          </Text>
          <View style={styles.modelGrid}>
            {EYE_STYLES.map((e) => {
              const active = pet.eyeStyle === e.id;
              return (
                <PressableScale
                  key={e.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ eyeStyle: e.id })}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="eye"
                    value={e.id}
                    bodyColor={pet.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={pet.bellyColor}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {e.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. PESTAÑA BOCA (10 MODELOS 3D) */}
      {tab === 'mouth' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Elige el modelo 3D de boca (10 estilos)
          </Text>
          <View style={styles.modelGrid}>
            {MOUTH_STYLES.map((m) => {
              const active = (pet.mouthStyle ?? 'smile') === m.id;
              return (
                <PressableScale
                  key={m.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ mouthStyle: m.id })}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="mouth"
                    value={m.id}
                    bodyColor={pet.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={pet.bellyColor}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {m.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      {/* 4. PESTAÑA CEJAS (10 MODELOS 3D) */}
      {tab === 'brows' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Elige el modelo 3D de cejas (10 estilos)
          </Text>
          <View style={styles.modelGrid}>
            {BROW_STYLES.map((b) => {
              const active = (pet.browStyle ?? 'soft') === b.id;
              return (
                <PressableScale
                  key={b.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ browStyle: b.id })}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="brow"
                    value={b.id}
                    bodyColor={pet.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={pet.bellyColor}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {b.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      {/* 5. PESTAÑA MEJILLAS Y RASGOS (10 MODELOS 3D) */}
      {tab === 'cheeks' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Elige mejillas, pecas o detalles faciales 3D (10 estilos)
          </Text>
          <View style={styles.modelGrid}>
            {BLUSH_STYLES.map((bl) => {
              const active = (pet.blushStyle ?? 'pink') === bl.id;
              return (
                <PressableScale
                  key={bl.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ blushStyle: bl.id })}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="blush"
                    value={bl.id}
                    bodyColor={pet.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={pet.bellyColor}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {bl.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      {/* 6. PESTAÑA CUERPO, COMPLEXIÓN Y COLORES (6 SILUETAS + 4 COMPLEXIONES + 24 COLORES) */}
      {tab === 'body' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Silueta base del muñeco 3D</Text>
          <View style={styles.modelGrid}>
            {SPECIES.map((sp) => {
              const active = pet.species === sp.id;
              const preset = SPECIES_PRESET_COLORS[sp.id];
              return (
                <PressableScale
                  key={sp.id}
                  hapticKind="select"
                  onPress={() =>
                    onChangePet({
                      species: sp.id,
                      bodyColor: preset.bodyColor,
                      bellyColor: preset.bellyColor,
                    })
                  }
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="species"
                    value={sp.id}
                    bodyColor={active ? pet.bodyColor : preset.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={active ? pet.bellyColor : preset.bellyColor}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {sp.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Complexión física 3D</Text>
          <View style={styles.modelGrid}>
            {BODY_SCALES.map((bs) => {
              const active = (pet.bodyScale ?? 'normal') === bs.id;
              return (
                <PressableScale
                  key={bs.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ bodyScale: bs.id })}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="scale"
                    value={bs.id}
                    bodyColor={pet.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={pet.bellyColor}
                    size={54}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {bs.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>
            Color de piel / cuerpo (12 tonos)
          </Text>
          <View style={styles.swatchRow}>
            {BODY_COLORS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                active={pet.bodyColor === c}
                onPress={() => onChangePet({ bodyColor: c })}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>
            Color de calzado y detalles (12 tonos)
          </Text>
          <View style={styles.swatchRow}>
            {BELLY_COLORS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                active={pet.bellyColor === c}
                onPress={() => onChangePet({ bellyColor: c })}
              />
            ))}
          </View>
        </View>
      )}

      {/* 7. PESTAÑA GORROS Y ACCESORIOS (10 MODELOS 3D) */}
      {tab === 'hats' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Elige el modelo 3D de gorro o accesorio (10 estilos)
          </Text>
          <View style={styles.modelGrid}>
            {ACCESSORIES.map((a) => {
              const active = pet.accessory === a.id;
              return (
                <PressableScale
                  key={a.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ accessory: a.id })}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <TomodachiPartModelPreview
                    kind="hat"
                    value={a.id}
                    bodyColor={pet.bodyColor}
                    hairColor={currentHairColor}
                    bellyColor={pet.bellyColor}
                  />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {a.label}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      {/* 8. PESTAÑA ISLA CASA / SANTUARIO 3D */}
      {tab === 'habitat' && showHabitatTab && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Objetos 3D en la roca flotante junto a tu muñeco
          </Text>
          <View style={styles.habitatGrid}>
            {HABITAT_PROPS.map((prop) => {
              const isEquipped = (pet.habitatProp ?? 'campfire') === prop.id;
              const isUnlocked =
                prop.cost === 0 || unlockedProps.includes(prop.id);
              return (
                <PressableScale
                  key={prop.id}
                  hapticKind="select"
                  onPress={() => {
                    if (onSelectHabitatProp) {
                      onSelectHabitatProp(prop.id);
                    } else {
                      onChangePet({ habitatProp: prop.id });
                    }
                  }}
                  style={[
                    styles.habitatCard,
                    isEquipped && styles.modelTileActive,
                  ]}
                >
                  <HabitatPropIllustration propId={prop.id} size={48} />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      isEquipped && { color: '#FFFFFF' },
                    ]}
                    numberOfLines={1}
                  >
                    {prop.nameEs}
                  </Text>
                  <Text
                    style={[
                      styles.habitatDesc,
                      isEquipped && { color: 'rgba(255,255,255,0.88)' },
                    ]}
                    numberOfLines={2}
                  >
                    {prop.descEs}
                  </Text>
                  <View
                    style={[
                      styles.priceTag,
                      isEquipped
                        ? { backgroundColor: '#FFFFFF' }
                        : isUnlocked
                          ? { backgroundColor: '#DCFCE7' }
                          : { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priceTagText,
                        isEquipped
                          ? { color: THEME.blue }
                          : isUnlocked
                            ? { color: '#15803D' }
                            : { color: '#92400E' },
                      ]}
                    >
                      {isEquipped
                        ? '✓ En tu Isla 3D'
                        : isUnlocked
                          ? 'Colocar gratis'
                          : `${prop.cost} monedas`}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}

      {/* 9. PESTAÑA VOZ Y PERSONALIDAD TOMODACHI */}
      {tab === 'soul' && (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>
            Personalidad (define cómo reacciona sola a tus aciertos y errores)
          </Text>
          <View style={styles.habitatGrid}>
            {PERSONALITIES.map((p) => {
              const active = (pet.personality ?? 'energetic') === p.id;
              return (
                <PressableScale
                  key={p.id}
                  hapticKind="select"
                  onPress={() => onChangePet({ personality: p.id })}
                  style={[styles.habitatCard, active && styles.modelTileActive]}
                >
                  <Glyph name={p.glyph} size={37} />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                  >
                    {p.labelEs}
                  </Text>
                  <Text
                    style={[
                      styles.habitatDesc,
                      active && { color: 'rgba(255,255,255,0.88)' },
                    ]}
                    numberOfLines={2}
                  >
                    {p.descEs}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Sintetizador de Voz Tomodachi</Text>
          <View style={styles.modelGrid}>
            {VOICE_PRESETS.map((vp) => {
              const active =
                Math.abs((pet.voicePitch ?? 1.15) - vp.pitch) < 0.08 &&
                Math.abs((pet.voiceRate ?? 1.0) - vp.rate) < 0.08;
              return (
                <PressableScale
                  key={vp.id}
                  hapticKind="select"
                  onPress={() => {
                    onChangePet({ voicePitch: vp.pitch, voiceRate: vp.rate });
                    onSpeakSample?.(
                      `Hi! My name is ${pet.name.trim() || 'your friend'}. ${pet.catchphrase || "Let's go!"}`
                    );
                  }}
                  style={[styles.modelTile, active && styles.modelTileActive]}
                >
                  <Glyph name={vp.glyph} size={37} />
                  <Text
                    style={[
                      styles.modelTileLabel,
                      active && { color: '#FFFFFF' },
                    ]}
                  >
                    {vp.labelEs}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>
            Muletilla en Inglés (Catchphrase)
          </Text>
          <View style={styles.catchphraseRow}>
            <TextInput
              value={pet.catchphrase ?? "Let's go!"}
              onChangeText={(txt) =>
                onChangePet({ catchphrase: txt.slice(0, 28) })
              }
              placeholder="Ej. Piece of cake!, Booyah!"
              placeholderTextColor={THEME.ink3}
              style={styles.catchphraseInput}
            />
            {onSpeakSample ? (
              <PressableScale
                hapticKind="light"
                onPress={() =>
                  onSpeakSample(
                    `Hi! I am ${pet.name.trim() || 'your buddy'}, and I say: ${pet.catchphrase || "Let's go!"}`
                  )
                }
                style={styles.testVoiceBtn}
              >
                <Ionicons name="volume-high" size={16} color="#FFFFFF" />
                <Text style={styles.testVoiceBtnText}>Escuchar</Text>
              </PressableScale>
            ) : null}
          </View>

          <View style={styles.swatchRow}>
            {SUGGESTED_CATCHPHRASES.map((phrase) => {
              const active = pet.catchphrase === phrase;
              return (
                <PressableScale
                  key={phrase}
                  hapticKind="select"
                  onPress={() => onChangePet({ catchphrase: phrase })}
                  style={[
                    styles.phraseChip,
                    active && {
                      backgroundColor: THEME.blue,
                      borderColor: TOON_INK,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.phraseChipText,
                      active && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    “{phrase}”
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * Modal de Bautizo / Nombre Obligatorio para tu Muñeco 3D (sin nombres predefinidos como Kirby).
 * Aparece automáticamente si el muñeco aún no tiene un nombre elegido por el usuario.
 */
export function TomodachiNamingModal({
  visible,
  pet,
  onConfirmName,
}: {
  visible: boolean;
  pet: PetConfig;
  onConfirmName: (customName: string) => void;
}) {
  const [draftName, setDraftName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const clean = draftName.trim();
    if (clean.length < 2) {
      setError('Escribe un nombre de al menos 2 letras para tu muñeco.');
      return;
    }
    setError(null);
    onConfirmName(clean);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={[styles.namingCard, SHADOW.float]}>
          <View style={styles.namingBadge}>
            <Ionicons name="sparkles" size={14} color="#6D28D9" />
            <Text style={styles.namingBadgeText}>
              REGISTRO DE COMPAÑERO TOMODACHI 3D
            </Text>
          </View>

          <Text style={styles.namingTitle}>¡Ponle nombre a tu muñeco!</Text>
          <Text style={styles.namingSub}>
            Cada compañero es único. Dale el nombre que tú quieras antes de comenzar a explorar las islas.
          </Text>

          <View style={styles.namingStage}>
            <Pet3D
              config={{ ...pet, name: draftName.trim() || 'Tu Muñeco' }}
              mood="happy"
              size={175}
              backgroundColor="transparent"
            />
          </View>

          <TextInput
            value={draftName}
            onChangeText={(t) => {
              setDraftName(t.slice(0, 16));
              setError(null);
            }}
            placeholder="Escribe aquí el nombre de tu muñeco..."
            placeholderTextColor={THEME.ink3}
            autoFocus
            style={styles.namingInput}
          />

          {error ? <Text style={styles.namingError}>{error}</Text> : null}

          <PressableScale
            hapticKind="medium"
            onPress={handleSave}
            style={styles.namingConfirmBtn}
          >
            <Text style={styles.namingConfirmText}>
              Guardar nombre y continuar →
            </Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

function ColorSwatch({
  color,
  active,
  onPress,
}: {
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      hapticKind="select"
      scaleTo={0.88}
      accessibilityLabel={`Color ${color}`}
    >
      <View style={[styles.swatchOuter, active && styles.swatchOuterActive]}>
        <View style={[styles.swatchInner, { backgroundColor: color }]}>
          {active ? (
            <Ionicons name="checkmark" size={16} color={TOON_INK} />
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  studioWrap: {
    width: '100%',
    gap: 12,
  },
  tabsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F1F5FB',
    borderWidth: 1.8,
    borderColor: TOON_INK,
    borderBottomWidth: 3.5,
  },
  tabPillActive: {
    backgroundColor: THEME.blue,
    borderColor: TOON_INK,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.ink,
  },
  tabCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: THEME.ink2,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionLabel: {
    ...TYPE.caption,
    fontWeight: '800',
    color: THEME.ink2,
    marginTop: 4,
  },
  modelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modelTile: {
    width: '30%',
    minWidth: 92,
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#FAFBFD',
    borderWidth: 2,
    borderColor: TOON_INK,
    borderBottomWidth: 4,
  },
  modelTileActive: {
    backgroundColor: THEME.blue,
    borderColor: TOON_INK,
  },
  modelTileLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: THEME.ink,
    textAlign: 'center',
  },
  habitatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  habitatCard: {
    width: '47%',
    minWidth: 138,
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#FAFBFD',
    borderWidth: 2,
    borderColor: TOON_INK,
    borderBottomWidth: 4,
  },
  habitatDesc: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.ink2,
    textAlign: 'center',
  },
  priceTag: {
    marginTop: 3,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  priceTagText: {
    fontSize: 10,
    fontWeight: '900',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatchOuter: {
    padding: 2.5,
    borderRadius: 999,
    borderWidth: 2.2,
    borderColor: 'transparent',
  },
  swatchOuterActive: {
    borderColor: THEME.blue,
  },
  swatchInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.8,
    borderColor: TOON_INK,
  },
  catchphraseRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  catchphraseInput: {
    flex: 1,
    backgroundColor: '#F4F7FC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
    borderWidth: 1.8,
    borderColor: TOON_INK,
  },
  testVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.blue,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: TOON_INK,
  },
  testVoiceBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  phraseChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F4F7FC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  phraseChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.ink2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 36, 54, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  namingCard: {
    width: '100%',
    maxWidth: 410,
    backgroundColor: '#FFFDF9',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    borderWidth: 2.5,
    borderColor: TOON_INK,
    borderBottomWidth: 5,
  },
  namingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#7C3AED',
  },
  namingBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6D28D9',
  },
  namingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.ink,
    textAlign: 'center',
  },
  namingSub: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.ink2,
    textAlign: 'center',
    lineHeight: 18,
  },
  namingStage: {
    width: 190,
    height: 185,
    borderRadius: 95,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  namingInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '800',
    color: THEME.ink,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  namingError: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.red,
    textAlign: 'center',
  },
  namingConfirmBtn: {
    width: '100%',
    backgroundColor: THEME.blue,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: TOON_INK,
    borderBottomWidth: 4,
    marginTop: 4,
  },
  namingConfirmText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
