import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { THEME } from '../theme/colors';
import { playSfx } from '../services/sfx';

const NATIVE = Platform.OS !== 'web';

export function haptic(kind: 'light' | 'medium' | 'success' | 'error' | 'select' = 'light') {
  if (kind === 'success') playSfx('correct');
  else if (kind === 'error') playSfx('wrong');
  else if (kind === 'select') playSfx('select');
  else if (kind === 'medium') playSfx('pet');
  else playSfx('tap');

  if (!NATIVE) return;
  try {
    if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (kind === 'select') Haptics.selectionAsync();
    else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // sin hápticos disponibles
  }
}

/** Entrada suave (fade + desplazamiento) escalonada por índice. */
export function Reveal({
  children,
  index = 0,
  style,
  from = 16,
}: {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  from?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 520,
      delay: Math.min(index, 10) * 70,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: NATIVE,
    }).start();
  }, [v, index]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Botón/tarjeta que se hunde con resorte al tocar (y vibra levemente en iOS/Android). */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  style,
  disabled,
  scaleTo = 0.965,
  hapticKind = 'light',
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  hapticKind?: 'light' | 'medium' | 'select' | null;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'tab' | 'link';
}) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(s, { toValue: value, useNativeDriver: NATIVE, speed: 40, bounciness: value === 1 ? 10 : 0 }).start();
  // Las propiedades de tamaño/posición van al contenedor tocable; el resto, a la vista animada.
  const flat = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
  const { flex, flexGrow, flexShrink, flexBasis, width, minWidth, maxWidth, alignSelf, margin, marginTop, marginBottom, marginHorizontal, marginVertical, ...inner } = flat;
  const outer: ViewStyle = { flex, flexGrow, flexShrink, flexBasis, width, minWidth, maxWidth, alignSelf, margin, marginTop, marginBottom, marginHorizontal, marginVertical };
  const hasFlex = flex !== undefined || flexGrow !== undefined;
  return (
    <Pressable
      style={outer}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={() => to(scaleTo)}
      onPressOut={() => to(1)}
      onLongPress={onLongPress}
      onPress={() => {
        if (hapticKind) haptic(hapticKind);
        onPress?.();
      }}
    >
      <Animated.View style={[inner, hasFlex && { flexGrow: 1 }, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Número que cuenta hasta su nuevo valor. */
export function AnimatedNumber({
  value,
  style,
  suffix = '',
  duration = 700,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <Text style={style}>
      {shown}
      {suffix}
    </Text>
  );
}

/** Barra de progreso con relleno degradado que se anima al cambiar. */
export function AnimatedBar({
  value,
  colors = [THEME.blue, THEME.blue],
  height = 8,
  track = THEME.fill2,
}: {
  value: number;
  colors?: readonly [string, string];
  height?: number;
  track?: string;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(v, {
      toValue: Math.max(0, Math.min(1, value)),
      useNativeDriver: false,
      speed: 8,
      bounciness: 4,
    }).start();
  }, [v, value]);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height,
          overflow: 'hidden',
          width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
      </Animated.View>
    </View>
  );
}

/** Interpola un número hacia `target` con easing (funciona igual en web y nativo). */
export function useTween(target: number, duration = 1000, delay = 0): number {
  const [value, setValue] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    const from = current.current;
    let raf = 0;
    let t0 = 0;
    const timer = setTimeout(() => {
      t0 = Date.now();
      const tick = () => {
        const p = Math.min(1, (Date.now() - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const v = from + (target - from) * eased;
        current.current = v;
        setValue(v);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);
  return value;
}

function Arc({
  radius,
  stroke,
  value,
  colors,
  center,
  delay = 0,
  id,
}: {
  radius: number;
  stroke: number;
  value: number;
  colors: readonly [string, string];
  center: number;
  delay?: number;
  id: string;
}) {
  const circumference = 2 * Math.PI * radius;
  const progress = useTween(Math.max(0, Math.min(1, value)), 1100, delay);
  return (
    <>
      <Defs>
        <SvgGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </SvgGradient>
      </Defs>
      <Circle cx={center} cy={center} r={radius} stroke={colors[1]} strokeOpacity={0.14} strokeWidth={stroke} fill="none" />
      {progress > 0.002 ? (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      ) : null}
    </>
  );
}

/** Anillo de puntuación con número central. */
export function ScoreRing({
  score,
  size = 96,
  stroke = 9,
  colors,
  label,
}: {
  score: number;
  size?: number;
  stroke?: number;
  colors?: readonly [string, string];
  label?: string;
}) {
  const c = colors ?? scoreGradient(score);
  const center = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Arc id={`score-${size}`} radius={center - stroke / 2 - 1} stroke={stroke} value={score / 100} colors={c} center={center} />
      </Svg>
      <AnimatedNumber value={score} style={{ fontSize: size * 0.3, fontWeight: '700', color: THEME.ink, letterSpacing: -1 }} />
      {label ? <Text style={{ fontSize: 10, fontWeight: '600', color: THEME.ink3, marginTop: -2 }}>{label}</Text> : null}
    </View>
  );
}

/** Tres anillos concéntricos (estilo Actividad de Apple) para las necesidades de la mascota. */
export function ActivityRings({
  values,
  size = 120,
  stroke = 12,
}: {
  values: Array<{ value: number; colors: readonly [string, string] }>;
  size?: number;
  stroke?: number;
}) {
  const center = size / 2;
  const gap = 3;
  return (
    <Svg width={size} height={size}>
      {values.map((ring, i) => (
        <Arc
          key={i}
          id={`ring-${size}-${i}`}
          radius={center - stroke / 2 - i * (stroke + gap) - 1}
          stroke={stroke}
          value={ring.value}
          colors={ring.colors}
          center={center}
          delay={i * 140}
        />
      ))}
    </Svg>
  );
}

export function scoreGradient(score: number): readonly [string, string] {
  if (score >= 80) return ['#5EDB8F', '#24A859'];
  if (score >= 60) return ['#6CB8FF', '#007AFF'];
  if (score >= 40) return ['#FFC15A', '#FF8A1F'];
  return ['#FF8A9B', '#FF375F'];
}

/** Ondas que se expanden alrededor del botón de micrófono mientras graba. */
export function PulseRings({ active, color, size }: { active: boolean; color: string; size: number }) {
  const rings = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    if (!active) {
      rings.forEach((r) => r.setValue(0));
      return;
    }
    const loops = rings.map((r, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 700),
          Animated.timing(r, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
          Animated.timing(r, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return (
    <>
      {rings.map((r, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            opacity: r.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] }),
            transform: [{ scale: r.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
          }}
        />
      ))}
    </>
  );
}

/** Sacudida horizontal (respuesta incorrecta). */
export function useShake() {
  const x = useRef(new Animated.Value(0)).current;
  const shake = () => {
    x.setValue(0);
    Animated.sequence(
      [10, -9, 7, -5, 3, 0].map((toValue) =>
        Animated.timing(x, { toValue, duration: 55, useNativeDriver: NATIVE })
      )
    ).start();
  };
  return { style: { transform: [{ translateX: x }] }, shake };
}

/** Pequeño "pop" de escala (respuesta correcta, recompensa). */
export function usePop() {
  const s = useRef(new Animated.Value(1)).current;
  const pop = () => {
    s.setValue(0.9);
    Animated.spring(s, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 14 }).start();
  };
  return { style: { transform: [{ scale: s }] }, pop };
}

/** Flotación suave continua (decoración). */
export function Float({ children, amplitude = 4, duration = 2600 }: { children: React.ReactNode; amplitude?: number; duration?: number }) {
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
  return (
    <Animated.View
      style={{ transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amplitude] }) }] }}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Desplazamiento interactivo tipo Waterllama (responde a inclinación del dispositivo
 * o movimiento del puntero + oscilación orgánica suave).
 */
export function useTiltOffset(amplitude = 6): { x: Animated.Value; y: Animated.Value } {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onMove = (e: MouseEvent) => {
        const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
        Animated.spring(x, {
          toValue: nx * amplitude,
          useNativeDriver: false,
          speed: 20,
          bounciness: 6,
        }).start();
        Animated.spring(y, {
          toValue: ny * amplitude * 0.6,
          useNativeDriver: false,
          speed: 20,
          bounciness: 6,
        }).start();
      };
      const onOrientation = (e: DeviceOrientationEvent) => {
        const gamma = Math.max(-30, Math.min(30, e.gamma ?? 0)) / 30;
        const beta = Math.max(-30, Math.min(30, (e.beta ?? 45) - 45)) / 30;
        x.setValue(gamma * amplitude);
        y.setValue(beta * amplitude * 0.6);
      };
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('deviceorientation', onOrientation, { passive: true });
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('deviceorientation', onOrientation);
      };
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, {
          toValue: -amplitude * 0.45,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(y, {
          toValue: amplitude * 0.45,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [amplitude, x, y]);

  return { x, y };
}

