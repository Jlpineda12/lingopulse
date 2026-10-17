import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
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
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import {
  HABITAT_PROPS,
  STREAK_SURPRISE_GIFTS,
  TOMODACHI_DREAMS,
  type HabitatPropId,
  type TomodachiDream,
} from '../game/pet';
import { playSfx } from '../services/sfx';
import { SHADOW, THEME } from '../theme/colors';
import { haptic, PressableScale } from './motion';
import { Glyph } from './Glyph';

const TOON_INK = '#1E2436';

export type IslandAtmosphereMode = 'dawn' | 'sunset' | 'twilight';

export function detectDefaultAtmosphere(): IslandAtmosphereMode {
  const h = new Date().getHours();
  if (h >= 6 && h < 17) return 'dawn';
  if (h >= 17 && h < 20) return 'sunset';
  return 'twilight';
}

export const ATMOSPHERE_META: Record<
  IslandAtmosphereMode,
  {
    labelEs: string;
    subEs: string;
    glyph: string;
    skyTop: string;
    skyBottom: string;
    accent: string;
    pillBg: string;
  }
> = {
  dawn: {
    labelEs: 'Sol Alpino',
    subEs: 'Brisa clara y polen dorado',
    glyph: 'sun',
    skyTop: '#E6F4FF',
    skyBottom: '#F5F9FF',
    accent: '#0284C7',
    pillBg: '#E0F2FE',
  },
  sunset: {
    labelEs: 'Atardecer Cairn',
    subEs: 'Cielo ámbar de cumbre',
    glyph: 'sunset',
    skyTop: '#FFEDD5',
    skyBottom: '#FFF7ED',
    accent: '#EA580C',
    pillBg: '#FFEDD5',
  },
  twilight: {
    labelEs: 'Luciérnagas',
    subEs: 'Crepúsculo pastel mágico',
    glyph: 'moon',
    skyTop: '#EDE9FE',
    skyBottom: '#F5F3FF',
    accent: '#7C3AED',
    pillBg: '#EDE9FE',
  },
};

/**
 * 1. CLIMA DINÁMICO SUAVE EN EL MAPA DE ISLAS (Regla 80% Calma):
 * Ilustración cel-shaded personalizada de cielo alpino (Cairn) con partículas suaves
 * y selector táctil de atmósfera (Día / Atardecer / Luciérnagas, sin colores negros).
 */
export function DynamicIslandAtmosphereBanner({
  mode,
  onChangeMode,
}: {
  mode: IslandAtmosphereMode;
  onChangeMode: (next: IslandAtmosphereMode) => void;
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== 'web';
  const meta = ATMOSPHERE_META[mode];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift, native]);

  const floatX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 6],
  });
  const floatY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 4],
  });

  return (
    <View
      style={[
        styles.atmoContainer,
        { backgroundColor: meta.skyTop, borderColor: `${meta.accent}35` },
      ]}
    >
      {/* Escena SVG Cel-Shaded de fondo (Montañas Cairn + Astro + Partículas) */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX: floatX }, { translateY: floatY }] },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 380 84" preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient id="skyGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={meta.skyTop} />
              <Stop offset="1" stopColor={meta.skyBottom} />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="380" height="84" fill="url(#skyGrad)" />

          {/* Picos facetados lejanos estilo Cairn */}
          <Polygon
            points="18,84 58,34 98,84"
            fill={mode === 'dawn' ? '#BAE6FD' : mode === 'sunset' ? '#FED7AA' : '#DDD6FE'}
            opacity={0.65}
          />
          <Polygon
            points="58,34 98,84 74,84"
            fill={mode === 'dawn' ? '#7DD3FC' : mode === 'sunset' ? '#FDBA74' : '#C4B5FD'}
            opacity={0.55}
          />
          <Polygon
            points="270,84 316,28 362,84"
            fill={mode === 'dawn' ? '#BAE6FD' : mode === 'sunset' ? '#FED7AA' : '#DDD6FE'}
            opacity={0.65}
          />

          {/* Sol / Sol poniente / Luna creciente cel-shaded */}
          {mode === 'dawn' && (
            <G transform="translate(328, 26)">
              <Circle cx="0" cy="0" r="18" fill="#FEF08A" opacity={0.6} />
              <Circle
                cx="0"
                cy="0"
                r="12"
                fill="#FACC15"
                stroke={TOON_INK}
                strokeWidth="2"
              />
            </G>
          )}
          {mode === 'sunset' && (
            <G transform="translate(328, 34)">
              <Circle cx="0" cy="0" r="22" fill="#FDBA74" opacity={0.55} />
              <Circle
                cx="0"
                cy="0"
                r="14"
                fill="#FB923C"
                stroke={TOON_INK}
                strokeWidth="2"
              />
            </G>
          )}
          {mode === 'twilight' && (
            <G transform="translate(326, 24)">
              <Path
                d="M -4 -12 A 13 13 0 1 0 10 10 A 10 10 0 1 1 -4 -12 Z"
                fill="#FDE047"
                stroke={TOON_INK}
                strokeWidth="1.8"
              />
              {/* Luciérnagas brillantes */}
              <Circle cx="-180" cy="14" r="3.5" fill="#FACC15" />
              <Circle cx="-110" cy="30" r="3" fill="#FDE047" />
              <Circle cx="-45" cy="8" r="4" fill="#FACC15" />
              <Circle cx="-230" cy="24" r="3" fill="#FDE047" />
            </G>
          )}

          {/* Nubes Toon con borde entintado */}
          <Path
            d="M 135 28 Q 142 18 152 22 Q 160 14 170 22 Q 178 22 178 30 L 132 30 Z"
            fill="#FFFFFF"
            stroke={TOON_INK}
            strokeWidth="1.6"
            opacity={0.85}
          />
          {/* Destellos de polen / brisa */}
          <Circle cx="115" cy="44" r="2.5" fill={meta.accent} opacity={0.5} />
          <Circle cx="215" cy="22" r="2.5" fill={meta.accent} opacity={0.5} />
          <Circle cx="250" cy="48" r="3" fill="#F59E0B" opacity={0.65} />
        </Svg>
      </Animated.View>

      <View style={styles.atmoContentRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.atmoTitleWrap}>
            <Glyph name={meta.glyph} size={26} />
            <Text style={[styles.atmoTitle, { color: TOON_INK }]}>
              Clima de Isla: {meta.labelEs}
            </Text>
          </View>
          <Text style={styles.atmoSub}>{meta.subEs}</Text>
        </View>

        <View style={styles.atmoPills}>
          {(['dawn', 'sunset', 'twilight'] as const).map((m) => {
            const active = mode === m;
            const itemMeta = ATMOSPHERE_META[m];
            return (
              <PressableScale
                key={m}
                hapticKind="select"
                scaleTo={0.9}
                onPress={() => onChangeMode(m)}
                style={[
                  styles.atmoChip,
                  active && {
                    backgroundColor: itemMeta.accent,
                    borderColor: TOON_INK,
                  },
                ]}
              >
                <Glyph name={itemMeta.glyph} size={22} />
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/**
 * 2. VFX REACTIVO A LA VOZ ("Flujo de Energía de Voz" · Regla 20% Impacto):
 * Mientras el usuario habla en Speaking o Voice Arena, envía partículas de luz y ondas
 * desde el micrófono hacia el cristal estelar del compañero 3D.
 */
export function VoiceEnergyStreamVfx({
  active,
  petName,
  petColor,
}: {
  active: boolean;
  petName: string;
  petColor: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== 'web';

  useEffect(() => {
    if (!active) {
      anim.stopAnimation();
      anim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: native,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [active, anim, native]);

  if (!active) return null;

  const orb1X = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 190] });
  const orb2X = anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 140] });
  const pulseScale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.92, 1.16, 0.92],
  });

  return (
    <View style={[styles.voiceStreamCard, SHADOW.card]}>
      <View style={styles.voiceStreamTrack}>
        {/* Nodo Izquierdo: Tu Voz */}
        <View style={styles.voiceNodeMic}>
          <Ionicons name="mic" size={18} color="#FFFFFF" />
        </View>

        {/* Canal de partículas viajando hacia la estrella del compañero */}
        <View style={styles.voiceBeamChannel}>
          <View style={styles.voiceBeamLine} />
          <Animated.View
            style={[
              styles.voiceEnergyParticle,
              { transform: [{ translateX: orb1X }, { scale: pulseScale }] },
            ]}
          />
          <Animated.View
            style={[
              styles.voiceEnergyParticleGold,
              { transform: [{ translateX: orb2X }] },
            ]}
          />
        </View>

        {/* Nodo Derecho: Cristal Estelar de la Mascota */}
        <Animated.View
          style={[
            styles.voiceNodeStar,
            { backgroundColor: petColor, transform: [{ scale: pulseScale }] },
          ]}
        >
          <Svg width={26} height={26} viewBox="0 0 32 32">
            <Polygon
              points="16,2 20,11 30,12 22,19 25,29 16,24 7,29 10,19 2,12 12,11"
              fill="#FFD166"
              stroke={TOON_INK}
              strokeWidth="2.2"
            />
          </Svg>
        </Animated.View>
      </View>

      <Text style={styles.voiceStreamText}>
        ¡Tu voz en inglés está recargando la estrella mágica de {petName} en vivo!
      </Text>
    </View>
  );
}

/**
 * 3. ILUSTRACIÓN SVG CEL-SHADED PERSONALIZADA PARA OBJETOS 3D DEL SANTUARIO:
 * Sin iconos genéricos: cada objeto decorativo tiene su propio arte vectorial entintado.
 */
export function HabitatPropIllustration({
  propId,
  size = 54,
}: {
  propId: HabitatPropId;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {propId === 'campfire' && (
        <G>
          {/* Troncos y piedras Cairn */}
          <Rect
            x="14"
            y="44"
            width="36"
            height="8"
            rx="4"
            fill="#8B5A2B"
            stroke={TOON_INK}
            strokeWidth="2.5"
            transform="rotate(-12 32 48)"
          />
          <Rect
            x="14"
            y="44"
            width="36"
            height="8"
            rx="4"
            fill="#A0522D"
            stroke={TOON_INK}
            strokeWidth="2.5"
            transform="rotate(14 32 48)"
          />
          <Circle cx="16" cy="52" r="5.5" fill="#94A3B8" stroke={TOON_INK} strokeWidth="2.2" />
          <Circle cx="32" cy="54" r="6" fill="#CBD5E1" stroke={TOON_INK} strokeWidth="2.2" />
          <Circle cx="48" cy="52" r="5.5" fill="#94A3B8" stroke={TOON_INK} strokeWidth="2.2" />
          {/* Llama cel-shaded */}
          <Path
            d="M 32 10 C 44 22 46 34 38 44 C 34 48 28 48 24 44 C 18 34 22 22 32 10 Z"
            fill="#FF5A1F"
            stroke={TOON_INK}
            strokeWidth="2.6"
          />
          <Path
            d="M 32 20 C 38 28 39 36 34 42 C 32 44 29 44 28 42 C 25 36 27 28 32 20 Z"
            fill="#FFD166"
          />
        </G>
      )}

      {propId === 'boombox' && (
        <G>
          <Path
            d="M 22 22 L 22 14 L 42 14 L 42 22"
            stroke={TOON_INK}
            strokeWidth="3"
            fill="none"
          />
          <Rect
            x="10"
            y="22"
            width="44"
            height="28"
            rx="7"
            fill="#3B82F6"
            stroke={TOON_INK}
            strokeWidth="2.6"
          />
          <Circle cx="21" cy="36" r="8" fill="#1E293B" stroke={TOON_INK} strokeWidth="2.2" />
          <Circle cx="21" cy="36" r="3" fill="#60A5FA" />
          <Circle cx="43" cy="36" r="8" fill="#1E293B" stroke={TOON_INK} strokeWidth="2.2" />
          <Circle cx="43" cy="36" r="3" fill="#60A5FA" />
          <Rect x="29" y="27" width="6" height="6" rx="2" fill="#FACC15" />
        </G>
      )}

      {propId === 'bonsai' && (
        <G>
          <Polygon
            points="18,44 46,44 42,56 22,56"
            fill="#E07A5F"
            stroke={TOON_INK}
            strokeWidth="2.5"
          />
          <Path
            d="M 30 44 Q 26 32 34 24 L 38 44 Z"
            fill="#8B5A2B"
            stroke={TOON_INK}
            strokeWidth="2.4"
          />
          <Ellipse
            cx="26"
            cy="26"
            rx="13"
            ry="7"
            fill="#22C55E"
            stroke={TOON_INK}
            strokeWidth="2.4"
          />
          <Ellipse
            cx="38"
            cy="20"
            rx="12"
            ry="6.5"
            fill="#4ADE80"
            stroke={TOON_INK}
            strokeWidth="2.4"
          />
          <Ellipse
            cx="31"
            cy="13"
            rx="9"
            ry="5.5"
            fill="#86EFAC"
            stroke={TOON_INK}
            strokeWidth="2.4"
          />
        </G>
      )}

      {propId === 'treasure' && (
        <G>
          <Rect
            x="12"
            y="30"
            width="40"
            height="24"
            rx="5"
            fill="#9A3412"
            stroke={TOON_INK}
            strokeWidth="2.6"
          />
          <Rect
            x="12"
            y="36"
            width="40"
            height="5"
            fill="#FACC15"
            stroke={TOON_INK}
            strokeWidth="2"
          />
          {/* Gema flotando */}
          <Polygon
            points="32,8 42,18 32,28 22,18"
            fill="#38BDF8"
            stroke={TOON_INK}
            strokeWidth="2.5"
          />
          <Polygon points="32,8 37,18 32,28" fill="#BAE6FD" opacity={0.75} />
        </G>
      )}

      {propId === 'telescope' && (
        <G>
          <Path d="M 32 32 L 18 56 M 32 32 L 46 56 M 32 32 L 32 56" stroke="#8B5A2B" strokeWidth="3.2" strokeLinecap="round" />
          <G transform="rotate(-24 32 26)">
            <Polygon
              points="14,22 48,17 48,31 14,28"
              fill="#FBBF24"
              stroke={TOON_INK}
              strokeWidth="2.5"
            />
            <Circle cx="49" cy="24" r="6" fill="#7DD3FC" stroke={TOON_INK} strokeWidth="2.2" />
          </G>
        </G>
      )}

      {propId === 'none' && (
        <G>
          <Polygon
            points="12,34 32,22 52,34 44,48 20,48"
            fill="#CBD5E1"
            stroke={TOON_INK}
            strokeWidth="2.5"
          />
          <Ellipse cx="32" cy="32" rx="16" ry="6" fill="#86EFAC" stroke={TOON_INK} strokeWidth="2" />
        </G>
      )}
    </Svg>
  );
}

/**
 * 4. VENTANA INTERACTIVA DE "BURBUJA DE SUEÑO" ESTILO TOMODACHI LIFE:
 * Permite espiar qué está soñando la mascota en inglés y resolver el acertijo del sueño
 * para despertarla feliz (+25% Energía, +Monedas, +XP y VFX de celebración).
 */
export function TomodachiDreamModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { pet, progress, solveDreamBubble } = useGame();
  const { speakWithPip } = useAppState();
  const [dreamIdx, setDreamIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [rewardBanner, setRewardBanner] = useState<string | null>(null);

  const dream: TomodachiDream =
    TOMODACHI_DREAMS[dreamIdx % TOMODACHI_DREAMS.length]!;
  const isCompleted = (progress.completedDreams ?? []).includes(dream.id);

  const handleSelectOption = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    const isRight = idx === dream.correctIndex;
    if (isRight) {
      playSfx('fanfare');
      haptic('success');
      const res = solveDreamBubble(dream.id, true);
      setRewardBanner(
        `¡Despertaste a ${pet.name} feliz! +${res.coins} monedas · +${res.xp} XP · +25% Energía`
      );
    } else {
      playSfx('wrong');
      haptic('error');
      solveDreamBubble(dream.id, false);
      setRewardBanner(
        `¡Ups! Ese ruido en el sueño hizo fruncir el ceño a ${pet.name}. ¡Mira la pista!`
      );
    }
  };

  const handleNextDream = () => {
    setPicked(null);
    setRewardBanner(null);
    setDreamIdx((i) => i + 1);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.dreamSheet, SHADOW.float]}>
          {/* Cabecera de Nube de Sueño Tomodachi */}
          <View style={styles.dreamHeader}>
            <View style={styles.dreamBadgePill}>
              <Glyph name="moon" size={24} />
              <Text style={styles.dreamBadgeText}>
                ESPIANDO EL SUEÑO DE {pet.name.toUpperCase()}
              </Text>
            </View>
            <PressableScale onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={TOON_INK} />
            </PressableScale>
          </View>

          {/* Escena Ilustrada del Sueño Surrealista */}
          <View style={styles.dreamCloudStage}>
            <Svg width={120} height={82} viewBox="0 0 120 82">
              <Path
                d="M 22 64 Q 10 64 10 50 Q 10 37 23 35 Q 29 16 50 18 Q 68 8 84 24 Q 106 24 108 44 Q 112 64 92 64 Z"
                fill="#E0F2FE"
                stroke={TOON_INK}
                strokeWidth="2.8"
              />
              {dream.sceneType === 'cairn_peak' && (
                <G>
                  <Polygon
                    points="36,60 60,22 84,60"
                    fill="#94A3B8"
                    stroke={TOON_INK}
                    strokeWidth="2.4"
                  />
                  <Polygon points="51,36 60,22 69,36" fill="#FFFFFF" />
                  <Circle cx="76" cy="26" r="7" fill="#FACC15" stroke={TOON_INK} strokeWidth="2" />
                </G>
              )}
              {dream.sceneType === 'coffee_cloud' && (
                <G>
                  <Rect
                    x="44"
                    y="30"
                    width="28"
                    height="26"
                    rx="6"
                    fill="#F59E0B"
                    stroke={TOON_INK}
                    strokeWidth="2.4"
                  />
                  <Path
                    d="M 72 36 Q 82 36 82 43 Q 82 50 72 50"
                    stroke={TOON_INK}
                    strokeWidth="2.4"
                    fill="none"
                  />
                  <Path d="M 52 24 Q 55 18 52 14 M 62 24 Q 65 18 62 14" stroke="#0284C7" strokeWidth="2.2" fill="none" />
                </G>
              )}
              {dream.sceneType === 'taco_rain' && (
                <G>
                  <Path
                    d="M 38 52 A 22 22 0 0 1 82 52 Z"
                    fill="#FACC15"
                    stroke={TOON_INK}
                    strokeWidth="2.5"
                  />
                  <Circle cx="52" cy="42" r="4" fill="#EF4444" />
                  <Circle cx="62" cy="39" r="4" fill="#22C55E" />
                  <Circle cx="68" cy="44" r="3.5" fill="#EF4444" />
                </G>
              )}
              {dream.sceneType === 'vinyl_concert' && (
                <G>
                  <Circle cx="60" cy="42" r="18" fill="#1E293B" stroke={TOON_INK} strokeWidth="2.4" />
                  <Circle cx="60" cy="42" r="6" fill="#F43F5E" stroke={TOON_INK} strokeWidth="2" />
                </G>
              )}
            </Svg>

            <Text style={styles.dreamTitle}>{dream.titleEs}</Text>
            {isCompleted ? (
              <Text style={styles.dreamCompletedTag}>✓ Sueño dominado</Text>
            ) : null}

            <PressableScale
              onPress={() => speakWithPip(dream.dreamBubbleEn)}
              hapticKind="light"
              style={styles.dreamSpeechBubble}
            >
              <Ionicons name="volume-high" size={18} color={THEME.blue} />
              <Text style={styles.dreamSpeechText}>{dream.dreamBubbleEn}</Text>
            </PressableScale>
          </View>

          <Text style={styles.dreamQuestion}>{dream.questionEs}</Text>

          <View style={{ gap: 8 }}>
            {dream.options.map((opt, idx) => {
              const isChosen = picked === idx;
              const isRight = idx === dream.correctIndex;
              const bg =
                picked === null
                  ? '#F1F5FB'
                  : isRight
                    ? '#DCFCE7'
                    : isChosen
                      ? '#FFE4E6'
                      : '#F8FAFC';
              const border =
                picked === null
                  ? '#CBD5E1'
                  : isRight
                    ? '#16A34A'
                    : isChosen
                      ? '#E11D48'
                      : '#E2E8F0';
              return (
                <PressableScale
                  key={opt}
                  disabled={picked !== null}
                  onPress={() => handleSelectOption(idx)}
                  style={[
                    styles.dreamOptionBtn,
                    { backgroundColor: bg, borderColor: border },
                  ]}
                >
                  <Text style={styles.dreamOptionText}>{opt}</Text>
                </PressableScale>
              );
            })}
          </View>

          {picked !== null ? (
            <View style={styles.dreamFeedbackBox}>
              {rewardBanner ? (
                <Text style={styles.dreamRewardHeadline}>{rewardBanner}</Text>
              ) : null}
              <Text style={styles.dreamExplanationText}>{dream.explanationEs}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <PressableScale
                  onPress={handleNextDream}
                  style={[styles.dreamActionBtn, { backgroundColor: THEME.blue }]}
                >
                  <Text style={styles.dreamActionBtnText}>Siguiente sueño </Text>
                </PressableScale>
                <PressableScale
                  onPress={onClose}
                  style={[styles.dreamActionBtn, { backgroundColor: '#E2E8F0' }]}
                >
                  <Text style={[styles.dreamActionBtnText, { color: TOON_INK }]}>
                    Volver al Santuario
                  </Text>
                </PressableScale>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/**
 * 5. COFRES DE REGALO SORPRESA POR RACHA ENTREGADOS POR TU MASCOTA (Regla 20% Impacto):
 */
export function StreakSurpriseGiftsSection({
  onNotice,
}: {
  onNotice?: (msg: string) => void;
}) {
  const { progress, pet, claimSurpriseGift } = useGame();
  const claimed = progress.claimedGifts ?? [];

  return (
    <View style={styles.giftSectionWrap}>
      <View style={styles.giftHeaderRow}>
        <Text style={styles.giftSectionTitle}>
          Regalos Sorpresa de {pet.name} por tu Racha
        </Text>
        <View style={styles.streakCountPill}>
          <Text style={styles.streakCountPillText}> Racha: {progress.streak}d</Text>
        </View>
      </View>

      <View style={styles.giftsGrid}>
        {STREAK_SURPRISE_GIFTS.map((g) => {
          const isClaimed = claimed.includes(g.id);
          const canClaim = !isClaimed && progress.streak >= g.minStreak;
          return (
            <PressableScale
              key={g.id}
              hapticKind="medium"
              onPress={() => {
                const res = claimSurpriseGift(g.id);
                if (res.ok && res.gift) {
                  playSfx('fanfare');
                  onNotice?.(
                    `¡Abriste "${res.gift.titleEs}"! +${res.gift.coinsBonus} monedas y nuevo objeto 3D equipado.`
                  );
                } else if (res.reason) {
                  playSfx('tap');
                  onNotice?.(res.reason);
                }
              }}
              style={[
                styles.giftCard,
                canClaim && styles.giftCardReady,
                isClaimed && styles.giftCardClaimed,
              ]}
            >
              {/* Ilustración SVG de Caja de Regalo Cel-Shaded */}
              <Svg width={44} height={44} viewBox="0 0 56 56">
                <Rect
                  x="10"
                  y="22"
                  width="36"
                  height="26"
                  rx="5"
                  fill={isClaimed ? '#CBD5E1' : canClaim ? '#FF4D6D' : '#94A3B8'}
                  stroke={TOON_INK}
                  strokeWidth="2.4"
                />
                <Rect
                  x="8"
                  y="15"
                  width="40"
                  height="9"
                  rx="4"
                  fill={isClaimed ? '#E2E8F0' : canClaim ? '#FF758F' : '#CBD5E1'}
                  stroke={TOON_INK}
                  strokeWidth="2.4"
                />
                <Rect
                  x="25"
                  y="15"
                  width="6"
                  height="33"
                  fill={isClaimed ? '#94A3B8' : '#FFD166'}
                  stroke={TOON_INK}
                  strokeWidth="1.8"
                />
                {canClaim ? (
                  <Circle cx="44" cy="12" r="5" fill="#FACC15" stroke={TOON_INK} strokeWidth="1.8" />
                ) : null}
              </Svg>

              <View style={{ flex: 1 }}>
                <Text style={styles.giftCardTitle}>{g.titleEs}</Text>
                <Text style={styles.giftCardSub}>{g.subtitleEs}</Text>
                <Text
                  style={[
                    styles.giftStatusLabel,
                    canClaim && { color: '#E11D48' },
                    isClaimed && { color: '#15803D' },
                  ]}
                >
                  {isClaimed
                    ? `✓ Abierto (+${g.coinsBonus} monedas · "${g.unlockCatchphrase}")`
                    : canClaim
                      ? `¡TOCA PARA ABRIR! (+${g.coinsBonus} monedas + Objeto 3D)`
                      : `Requiere ${g.minStreak} días de racha`}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  atmoContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  atmoContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  atmoTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  atmoTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  atmoSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  atmoPills: {
    flexDirection: 'row',
    gap: 6,
  },
  atmoChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(30,36,54,0.15)',
  },
  voiceStreamCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: '#38BDF8',
    gap: 8,
  },
  voiceStreamTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voiceNodeMic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  voiceBeamChannel: {
    flex: 1,
    height: 22,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  voiceBeamLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#BAE6FD',
  },
  voiceEnergyParticle: {
    position: 'absolute',
    left: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0EA5E9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  voiceEnergyParticleGold: {
    position: 'absolute',
    left: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FACC15',
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  voiceNodeStar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  voiceStreamText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  dreamSheet: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    borderWidth: 3,
    borderColor: TOON_INK,
    gap: 12,
  },
  dreamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dreamBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  dreamBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0369A1',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dreamCloudStage: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dreamTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: TOON_INK,
  },
  dreamCompletedTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  dreamSpeechBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    marginTop: 4,
  },
  dreamSpeechText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    color: TOON_INK,
    lineHeight: 18,
  },
  dreamQuestion: {
    fontSize: 14,
    fontWeight: '800',
    color: TOON_INK,
  },
  dreamOptionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  dreamOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: TOON_INK,
  },
  dreamFeedbackBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  dreamRewardHeadline: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0369A1',
  },
  dreamExplanationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dreamActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  dreamActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  giftSectionWrap: {
    gap: 10,
  },
  giftHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  giftSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: TOON_INK,
  },
  streakCountPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FF9F1C',
  },
  streakCountPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C84B00',
  },
  giftsGrid: {
    gap: 8,
  },
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  giftCardReady: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FB7185',
  },
  giftCardClaimed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  giftCardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: TOON_INK,
  },
  giftCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  giftStatusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 3,
  },
});
