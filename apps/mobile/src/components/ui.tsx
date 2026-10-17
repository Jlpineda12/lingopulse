import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, RADIUS, SHADOW, THEME, TYPE, type GradientKey } from '../theme/colors';
import { AnimatedBar, PressableScale, ScoreRing, scoreGradient } from './motion';
import { Glyph } from './Glyph';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Icon({ name, size = 20, color = THEME.ink }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

/** Baldosa con degradado e ícono blanco (estilo iconos de Ajustes de iOS). */
export function IconTile({
  name,
  gradient = 'daily',
  size = 40,
  iconSize,
  style,
}: {
  name: IconName;
  gradient?: GradientKey;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <LinearGradient
      colors={GRADIENTS[gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Ionicons name={name} size={iconSize ?? size * 0.5} color="#FFFFFF" />
    </LinearGradient>
  );
}

type Tone = 'default' | 'blue' | 'purple' | 'green' | 'amber' | 'coral' | 'gold' | 'ink';

const TONES: Record<Exclude<Tone, 'default'>, { bg: string }> = {
  blue: { bg: '#F0F7FF' },
  purple: { bg: '#F5F2FF' },
  green: { bg: '#EDFAF3' },
  amber: { bg: '#FFF8EC' },
  coral: { bg: '#FFF2F5' },
  gold: { bg: '#FDF6E7' },
  ink: { bg: '#EEF4FF' },
};

export function Card({
  children,
  style,
  tone = 'default',
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: Tone;
}) {
  return (
    <View style={[styles.card, tone !== 'default' && { backgroundColor: TONES[tone].bg }, style]}>
      {children}
    </View>
  );
}

export function Eyebrow({
  children,
  color,
  icon,
}: {
  children: React.ReactNode;
  color?: string;
  icon?: IconName;
}) {
  return (
    <View style={styles.eyebrowRow}>
      {icon ? <Ionicons name={icon} size={13} color={color ?? THEME.ink3} /> : null}
      <Text style={[TYPE.caption, color ? { color } : null]}>{children}</Text>
    </View>
  );
}

export function LargeTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <View style={{ gap: 2 }}>
      {subtitle ? <Text style={[TYPE.caption, { color: THEME.ink2 }]}>{subtitle}</Text> : null}
      <Text style={TYPE.largeTitle}>{children}</Text>
    </View>
  );
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[TYPE.title2, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[TYPE.body, style]}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[TYPE.footnote, style]}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger' | 'dark' | 'gold' | 'blue';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  small,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  small?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const v = {
    primary: { bg: THEME.blue, fg: '#FFFFFF', borderBottom: '#0055B8' },
    dark: { bg: THEME.violet, fg: '#FFFFFF', borderBottom: '#5736D6' },
    blue: { bg: THEME.blue, fg: '#FFFFFF', borderBottom: '#0055B8' },
    secondary: { bg: THEME.fill, fg: THEME.ink, borderBottom: '#D5DFEE' },
    ghost: { bg: 'transparent', fg: THEME.blue, borderBottom: 'transparent' },
    success: { bg: THEME.green, fg: '#FFFFFF', borderBottom: '#168A4C' },
    danger: { bg: THEME.red, fg: '#FFFFFF', borderBottom: '#CC294B' },
    gold: { bg: THEME.gold, fg: '#FFFFFF', borderBottom: '#A87210' },
  }[variant];
  const content = (
    <View style={styles.buttonInner}>
      {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={v.fg} /> : null}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: v.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={[
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor: v.bg,
          borderBottomWidth: variant === 'ghost' ? 0 : 3,
          borderBottomColor: v.borderBottom,
        },
        (variant === 'primary' || variant === 'blue') && !disabled && SHADOW.glow(THEME.blue),
        variant === 'gold' && !disabled && SHADOW.glow(THEME.gold),
        disabled && { opacity: 0.35 },
        style,
      ]}
    >
      {variant === 'gold' ? (
        <LinearGradient colors={GRADIENTS.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : variant === 'primary' || variant === 'blue' ? (
        <LinearGradient colors={GRADIENTS.daily} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : null}
      {content}
    </PressableScale>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color = THEME.blue,
  icon,
  glyph,
  style,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: IconName;
  /** Ícono propio (ver Glyph). */
  glyph?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      hapticKind="select"
      scaleTo={0.94}
      accessibilityLabel={label}
      style={[
        styles.chip,
        active && {
          backgroundColor: color,
          borderBottomColor: 'rgba(0,0,0,0.18)',
        },
        style,
      ]}
    >
      <View style={styles.buttonInner}>
        {glyph ? <Glyph name={glyph} size={20} /> : null}
        {icon ? <Ionicons name={icon} size={14} color={active ? '#FFFFFF' : THEME.ink2} /> : null}
        <Text style={[styles.chipText, active && { color: '#FFFFFF', fontWeight: '700' }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

export function Badge({
  label,
  color = THEME.ink2,
  bg = THEME.fill,
  icon,
}: {
  label: string;
  color?: string;
  bg?: string;
  icon?: IconName;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={11} color={color} /> : null}
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  color = THEME.blue,
  height = 8,
  colors,
}: {
  value: number;
  color?: string;
  height?: number;
  colors?: readonly [string, string];
}) {
  return <AnimatedBar value={value} height={height} colors={colors ?? [color, color]} />;
}

export function StatBar({
  label,
  value,
  colors,
  icon,
}: {
  label: string;
  value: number;
  colors: readonly [string, string];
  icon: IconName;
}) {
  return (
    <View style={{ gap: 6 }}>
      <View style={ui.rowBetween}>
        <View style={ui.row}>
          <Ionicons name={icon} size={14} color={colors[1]} />
          <Text style={styles.statLabel}>{label}</Text>
        </View>
        <Text style={styles.statValue}>{Math.round(value)}%</Text>
      </View>
      <AnimatedBar value={value / 100} colors={value < 25 ? ['#FF8A9B', '#FF375F'] : colors} height={6} />
    </View>
  );
}

export function scoreColor(score: number): string {
  return scoreGradient(score)[1];
}

export function ScoreBubble({ score, size = 84, label }: { score: number; size?: number; label?: string }) {
  return <ScoreRing score={score} size={size} label={label} />;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[ui.rowBetween, { marginTop: 10, paddingHorizontal: 2 }]}>
      <Text style={TYPE.title2}>{title}</Text>
      {action ? (
        <PressableScale onPress={onAction} hapticKind="select">
          <View style={ui.row}>
            <Text style={styles.sectionAction}>{action}</Text>
            <Ionicons name="chevron-forward" size={14} color={THEME.blue} />
          </View>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  gradient,
  icon,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  gradient?: GradientKey;
  icon?: IconName;
}) {
  return (
    <View style={{ gap: 14 }}>
      <PressableScale onPress={onBack} accessibilityLabel="Volver" style={styles.backBtn}>
        <View style={ui.row}>
          <Ionicons name="chevron-back" size={20} color={THEME.blue} />
          <Text style={styles.backText}>Atrás</Text>
        </View>
      </PressableScale>
      <View style={[ui.row, { gap: 12 }]}>
        {icon && gradient ? <IconTile name={icon} gradient={gradient} size={46} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={TYPE.title1} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? <Text style={TYPE.subhead}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: THEME.hairline }} />;
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  screen: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 130, gap: 16 },
  input: {
    minHeight: 120,
    borderRadius: RADIUS.control,
    padding: 14,
    fontSize: 16,
    lineHeight: 23,
    color: THEME.ink,
    backgroundColor: THEME.fill,
    textAlignVertical: 'top',
  },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.card,
    padding: 18,
    gap: 12,
    ...SHADOW.card,
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonSmall: { paddingVertical: 9, paddingHorizontal: 14 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  buttonText: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  buttonTextSmall: { fontSize: 14 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: THEME.surface,
    ...SHADOW.card,
    shadowOpacity: 0.04,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: THEME.ink2, letterSpacing: -0.1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '600', letterSpacing: -0.1 },
  statLabel: { fontSize: 13, fontWeight: '500', color: THEME.ink2 },
  statValue: { fontSize: 13, fontWeight: '600', color: THEME.ink, fontVariant: ['tabular-nums'] },
  sectionAction: { fontSize: 15, fontWeight: '500', color: THEME.blue },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 4, paddingRight: 8 },
  backText: { fontSize: 16, color: THEME.blue, fontWeight: '500', marginLeft: -2 },
});

export { COLORS };
