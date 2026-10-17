import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import {
  addDaysKey,
  flameTier,
  localDateKey,
  nextMilestone,
  STREAK_MILESTONES,
  weekStartKey,
  type FlameTier,
} from '@lingopulse/shared';
import { useGame } from '../context/GameContext';
import { REMINDERS_SUPPORTED, scheduleReminders } from '../services/reminders';
import { THEME, TYPE } from '../theme/colors';
import { Glyph } from './Glyph';
import { AnimatedBar, AnimatedNumber, haptic, PressableScale } from './motion';
import { ShareSheet } from './ShareCard';

const NATIVE = Platform.OS !== 'web';
const INK = '#1E2436';
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/* ------------------------------------------------------------------ */
/* Llama animada                                                       */
/* ------------------------------------------------------------------ */

function useLoop(duration: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay]);
  return v;
}

function Ember({ size, color, delay, x }: { size: number; color: string; delay: number; x: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);
  const d = Math.max(3, size * 0.09);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: size * 0.45,
        left: size / 2 + x * size - d / 2,
        width: d,
        height: d,
        borderRadius: d,
        backgroundColor: color,
        opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.75] }) },
          { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, x * size * 0.25, 0] }) },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
        ],
      }}
    />
  );
}

const OUTER = 'M24 3 C30 12 40 17 38.5 30 C37.5 39 31 45 24 45 C16 45 9.5 39 9.5 30 C9.5 22 15 19 17 12 C19 16 21 18 23 18 C21.5 12 22 7 24 3Z';
const MID = 'M24 14 C28 20 34 24 33 32 C32.4 38 28.5 41.5 24 41.5 C19 41.5 15 38 15 32.5 C15 27 19 25.5 20.5 21 C21.8 23.5 23 24.5 24.5 24.5 C23.5 21 23 17.5 24 14Z';
const CORE = 'M24 25 C26.5 28.5 29 30.5 28.5 34.5 C28 37.5 26.3 39 24 39 C21.6 39 19.6 37.3 19.6 34.6 C19.6 31 22.6 29.5 24 25Z';

/**
 * Llama de 3 capas que titilan a distinto ritmo, con halo pulsante y brasas que suben.
 * El color evoluciona con la racha (brasa → llama → infierno → azul → cósmica).
 */
export function AnimatedMiniFlame({
  lit,
  size = 38,
  streak,
  tier: tierProp,
}: {
  lit: boolean;
  size?: number;
  streak?: number;
  tier?: FlameTier;
}) {
  const tier = tierProp ?? flameTier(streak ?? 0);
  const [o1, o2, c1, c2, glow] = lit ? tier.colors : (['#D6DEEC', '#9AA6BF', '#EEF2FA', '#C2CBDB', '#C2CBDB'] as const);
  const a = useLoop(lit ? 420 : 1500);
  const b = useLoop(lit ? 310 : 1700, 80);
  const c = useLoop(lit ? 260 : 1900, 140);
  const halo = useLoop(lit ? 900 : 2200);
  const id = `${tier.id}-${lit ? 'on' : 'off'}`;
  const big = size >= 60;

  const layer = (v: Animated.Value, amp: number, d: string, top: string, bottom: string, sw: number, key: string) => (
    <Animated.View
      key={key}
      style={[
        StyleSheet.absoluteFill,
        {
          transform: [
            { translateY: size * 0.5 },
            { scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [1 - amp, 1 + amp * 1.4] }) },
            { scaleX: v.interpolate({ inputRange: [0, 1], outputRange: [1 + amp * 0.6, 1 - amp * 0.6] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`${-amp * 40}deg`, `${amp * 40}deg`] }) },
            { translateY: -size * 0.5 },
          ],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Defs>
          <SvgGradient id={`g-${key}-${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </SvgGradient>
        </Defs>
        <Path d={d} fill={`url(#g-${key}-${id})`} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: size * 0.12,
          top: size * 0.22,
          width: size * 0.76,
          height: size * 0.76,
          borderRadius: size,
          backgroundColor: glow,
          opacity: halo.interpolate({ inputRange: [0, 1], outputRange: lit ? [0.18, 0.4] : [0.08, 0.14] }),
          transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.25] }) }],
        }}
      />
      {layer(a, lit ? 0.06 : 0.015, OUTER, o1, o2, 2.6, 'o')}
      {layer(b, lit ? 0.08 : 0.02, MID, c2, o1, 0, 'm')}
      {layer(c, lit ? 0.1 : 0.02, CORE, c1, c2, 0, 'c')}
      {lit ? (
        <>
          <Ember size={size} color={o1} delay={0} x={-0.12} />
          <Ember size={size} color={c2} delay={500} x={0.14} />
          {big ? <Ember size={size} color={glow} delay={900} x={0.02} /> : null}
          {big ? <Ember size={size} color={o2} delay={1200} x={-0.2} /> : null}
        </>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Insignia compacta                                                   */
/* ------------------------------------------------------------------ */

export function MiniFireStreakBadge({ onPress }: { onPress?: () => void }) {
  const { streakView } = useGame();
  const pulse = useLoop(700);
  const atRisk = !streakView.activeToday && streakView.streak > 0;
  return (
    <PressableScale onPress={onPress} scaleTo={0.95} hapticKind="select" accessibilityLabel="Estado de tu racha diaria">
      <Animated.View
        style={[
          styles.miniBadge,
          streakView.activeToday ? styles.miniLit : atRisk ? styles.miniRisk : styles.miniOff,
          atRisk && { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] },
        ]}
      >
        <AnimatedMiniFlame lit={streakView.activeToday} size={36} tier={streakView.tier} />
        <View>
          <Text style={[styles.miniDays, { color: streakView.activeToday ? '#C84B00' : atRisk ? '#B45309' : THEME.ink2 }]}>
            {streakView.streak} {streakView.streak === 1 ? 'día' : 'días'}
          </Text>
          <Text style={styles.miniSub}>
            {streakView.activeToday ? 'Encendida hoy' : atRisk ? '¡Sálvala hoy!' : 'Enciéndela'}
          </Text>
        </View>
        {streakView.shields > 0 ? (
          <View style={styles.miniShield}>
            <Glyph name="shield" size={18} />
            <Text style={styles.miniShieldText}>{streakView.shields}</Text>
          </View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta completa                                                    */
/* ------------------------------------------------------------------ */

export function FireStreakCard({ compact = false, onPressAction }: { compact?: boolean; onPressAction?: () => void }) {
  const { progress, todayKey, streakView, setReminders, pet } = useGame();
  const [shareOpen, setShareOpen] = useState(false);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const tier = streakView.tier;
  const milestone = nextMilestone(streakView.streak);
  const prevMilestoneDays = [...STREAK_MILESTONES].reverse().find((m) => m.days <= streakView.streak)?.days ?? 0;
  const reminders = progress.reminders ?? { enabled: false, hour: 19 };

  const week = useMemo(() => {
    const monday = weekStartKey(todayKey);
    return DAY_LABELS.map((label, i) => {
      const key = addDaysKey(monday, i);
      const active = (progress.activityLog[key]?.length ?? 0) > 0;
      const shielded = (progress.protectedDays ?? []).includes(key);
      return { key, label, active, shielded, isToday: key === todayKey, future: key > todayKey };
    });
  }, [progress.activityLog, progress.protectedDays, todayKey]);

  const toggleReminders = async (enabled: boolean, hour = reminders.hour) => {
    setReminders({ enabled, hour });
    const res = await scheduleReminders({
      enabled,
      hour,
      petName: pet.name,
      streak: streakView.streak,
      practicedToday: streakView.activeToday,
    });
    setReminderMsg(
      res.ok ? (enabled ? `Listo: ${pet.name} te escribirá a las ${hour}:00.` : 'Recordatorios desactivados.') : res.reason ?? null
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: streakView.activeToday ? '#FFF6E9' : '#F6F8FC' }]}>
      <View style={styles.head}>
        <AnimatedMiniFlame lit={streakView.activeToday} size={84} tier={tier} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={TYPE.caption}>{tier.labelEs} · récord {Math.max(progress.bestStreak, streakView.streak)}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <AnimatedNumber value={streakView.streak} style={styles.bigNumber} />
            <Text style={styles.bigLabel}>{streakView.streak === 1 ? 'día' : 'días'}</Text>
          </View>
          <Text style={TYPE.footnote}>
            {streakView.lost
              ? 'Tu racha se apagó. ¡Empieza una nueva hoy!'
              : streakView.activeToday
                ? '¡Llama encendida hoy! Vuelve mañana para sumar.'
                : streakView.shieldsNeeded > 0
                  ? `Faltaste ${streakView.shieldsNeeded} día(s): tus escudos te cubrirán si practicas hoy.`
                  : 'Completa 1 misión hoy para no perderla.'}
          </Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {week.map((d) => (
          <View key={d.key} style={styles.dayCol}>
            <Text style={[styles.dayLabel, d.isToday && { color: '#D95B00' }]}>{d.label}</Text>
            <View
              style={[
                styles.dayDot,
                d.active && styles.dayDotLit,
                d.shielded && styles.dayDotShield,
                d.isToday && !d.active && styles.dayDotToday,
                d.future && { opacity: 0.45 },
              ]}
            >
              {d.active ? (
                <AnimatedMiniFlame lit size={24} tier={tier} />
              ) : d.shielded ? (
                <Glyph name="shield" size={22} />
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.shieldBox}>
          <Text style={TYPE.caption}>Escudos</Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {[0, 1].map((i) => (
              <Glyph key={i} name={i < streakView.shields ? 'shield' : 'shield-empty'} size={30} />
            ))}
          </View>
          <Text style={styles.smallNote}>+1 cada semana. Protegen días perdidos.</Text>
        </View>
        <View style={styles.milestoneBox}>
          <Text style={TYPE.caption}>Próximo hito</Text>
          {milestone ? (
            <>
              <Text style={styles.milestoneTitle}>
                {milestone.days} días · {milestone.titleEs}
              </Text>
              <AnimatedBar
                value={(streakView.streak - prevMilestoneDays) / (milestone.days - prevMilestoneDays)}
                colors={[tier.colors[0], tier.colors[1]]}
                height={8}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Glyph name="coin" size={16} />
                <Text style={styles.smallNote}>+{milestone.coins} monedas al llegar</Text>
              </View>
            </>
          ) : (
            <Text style={styles.milestoneTitle}>¡Todos los hitos logrados!</Text>
          )}
        </View>
      </View>

      {!compact ? (
        <View style={styles.reminderBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Glyph name="bell" size={30} />
            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneTitle}>Recordatorio de {pet.name}</Text>
              <Text style={styles.smallNote}>
                {REMINDERS_SUPPORTED ? 'Mensajes con su personalidad, a la hora que elijas.' : 'Disponible en la app del teléfono.'}
              </Text>
            </View>
            <PressableScale
              disabled={!REMINDERS_SUPPORTED}
              onPress={() => toggleReminders(!reminders.enabled)}
              style={[styles.toggle, reminders.enabled && styles.toggleOn, !REMINDERS_SUPPORTED && { opacity: 0.4 }]}
            >
              <View style={[styles.knob, reminders.enabled && { transform: [{ translateX: 20 }] }]} />
            </PressableScale>
          </View>
          {reminders.enabled ? (
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {[8, 13, 17, 19, 21].map((h) => (
                <PressableScale
                  key={h}
                  hapticKind="select"
                  onPress={() => toggleReminders(true, h)}
                  style={[styles.hourChip, reminders.hour === h && styles.hourChipOn]}
                >
                  <Text style={[styles.hourText, reminders.hour === h && { color: '#FFFFFF' }]}>{h}:00</Text>
                </PressableScale>
              ))}
            </View>
          ) : null}
          {reminderMsg ? <Text style={[styles.smallNote, { color: THEME.green }]}>{reminderMsg}</Text> : null}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {streakView.streak > 0 ? (
          <PressableScale onPress={() => setShareOpen(true)} style={[styles.action, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.actionInner}>
              <Glyph name="share" size={20} />
              <Text style={[styles.actionText, { color: THEME.ink }]}>Compartir</Text>
            </View>
          </PressableScale>
        ) : null}
        {onPressAction && !streakView.activeToday ? (
          <PressableScale onPress={onPressAction} style={[styles.action, { backgroundColor: '#FF7A1A', borderBottomColor: '#C2410C' }]}>
            <View style={styles.actionInner}>
              <Glyph name="flame" size={20} />
              <Text style={styles.actionText}>Encender ahora</Text>
            </View>
          </PressableScale>
        ) : null}
      </View>
      <ShareSheet data={shareOpen ? { kind: 'streak', days: streakView.streak } : null} onClose={() => setShareOpen(false)} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Celebración a pantalla completa                                     */
/* ------------------------------------------------------------------ */

function BurstParticle({ angle, color, run }: { angle: number; color: string; run: Animated.Value }) {
  const dist = 120 + (Math.round(angle * 10) % 3) * 26;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color,
        borderWidth: 2,
        borderColor: INK,
        opacity: run.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: run.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] }) },
          { translateY: run.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist - 30] }) },
          { scale: run.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.1] }) },
        ],
      }}
    />
  );
}

export function StreakCelebration() {
  const { streakCelebration, dismissStreakCelebration, pet } = useGame();
  const [shareOpen, setShareOpen] = useState(false);
  const flame = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const [lit, setLit] = useState(0);
  const to = streakCelebration?.streakTo ?? 0;
  const from = streakCelebration?.streakFrom ?? 0;
  const tier = flameTier(to);

  useEffect(() => {
    if (!streakCelebration) return;
    haptic('success');
    flame.setValue(0);
    burst.setValue(0);
    text.setValue(0);
    setLit(0);
    Animated.sequence([
      Animated.spring(flame, { toValue: 1, useNativeDriver: NATIVE, speed: 6, bounciness: 14 }),
      Animated.parallel([
        Animated.timing(burst, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.timing(text, { toValue: 1, duration: 500, useNativeDriver: NATIVE }),
      ]),
    ]).start();
    const timers = Array.from({ length: 7 }).map((_, i) => setTimeout(() => setLit(i + 1), 700 + i * 110));
    return () => timers.forEach(clearTimeout);
  }, [streakCelebration, flame, burst, text]);

  if (!streakCelebration) return null;
  const today = localDateKey();
  const monday = weekStartKey(today);
  const todayIdx = DAY_LABELS.findIndex((_, i) => addDaysKey(monday, i) === today);
  const backdrop =
    tier.id === 'azure' ? 'rgba(8,30,70,0.84)' : tier.id === 'cosmic' ? 'rgba(40,10,70,0.86)' : 'rgba(60,20,8,0.82)';

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismissStreakCelebration}>
      <Pressable style={[styles.celebrateBackdrop, { backgroundColor: backdrop }]} onPress={dismissStreakCelebration}>
        <View style={styles.celebrateCenter}>
          {Array.from({ length: 12 }).map((_, i) => (
            <BurstParticle key={i} angle={(i / 12) * Math.PI * 2} color={i % 2 ? tier.colors[0] : tier.colors[2]} run={burst} />
          ))}
          <Animated.View
            style={{
              transform: [
                { scale: flame.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                { rotate: flame.interpolate({ inputRange: [0, 0.6, 1], outputRange: ['-20deg', '8deg', '0deg'] }) },
              ],
            }}
          >
            <AnimatedMiniFlame lit size={190} tier={tier} />
          </Animated.View>
        </View>
        <Animated.View
          style={{
            alignItems: 'center',
            gap: 6,
            opacity: text,
            transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}
        >
          <AnimatedNumber value={to} duration={900} style={styles.celebrateNumber} />
          <Text style={styles.celebrateTitle}>{to === 1 ? '¡Racha encendida!' : `¡${to} días de racha!`}</Text>
          <Text style={styles.celebrateSub}>
            {from > 0 && to > from ? `${pet.name} está orgulloso: de ${from} a ${to} días.` : `${pet.name} encendió la llama contigo.`}
          </Text>
          <View style={styles.celebrateWeek}>
            {DAY_LABELS.map((d, i) => {
              const on = i < lit && i <= todayIdx;
              return (
                <View key={i} style={[styles.celebrateDay, on && { backgroundColor: tier.colors[0] }]}>
                  <Text style={[styles.celebrateDayText, on && { color: '#FFFFFF' }]}>{d}</Text>
                </View>
              );
            })}
          </View>
          {streakCelebration.shieldsUsed ? (
            <View style={styles.celebratePill}>
              <Glyph name="shield" size={22} />
              <Text style={styles.celebratePillText}>
                ¡Tu escudo salvó la racha! ({streakCelebration.shieldsUsed} día{streakCelebration.shieldsUsed > 1 ? 's' : ''})
              </Text>
            </View>
          ) : null}
          {streakCelebration.shieldGranted ? (
            <View style={styles.celebratePill}>
              <Glyph name="shield" size={22} />
              <Text style={styles.celebratePillText}>Ganaste el escudo de esta semana</Text>
            </View>
          ) : null}
          {streakCelebration.milestone ? (
            <View style={[styles.celebratePill, { backgroundColor: '#FFE9A8' }]}>
              <Glyph name="trophy" size={22} />
              <Text style={styles.celebratePillText}>
                Hito “{streakCelebration.milestone.titleEs}” · +{streakCelebration.milestone.coins} monedas
              </Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, alignSelf: 'stretch' }}>
            <PressableScale onPress={() => setShareOpen(true)} style={[styles.action, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.actionInner}>
                <Glyph name="share" size={20} />
                <Text style={[styles.actionText, { color: THEME.ink }]}>Compartir</Text>
              </View>
            </PressableScale>
            <PressableScale
              onPress={dismissStreakCelebration}
              style={[styles.action, { backgroundColor: tier.colors[1], borderBottomColor: 'rgba(0,0,0,0.25)' }]}
            >
              <View style={styles.actionInner}>
                <Text style={styles.actionText}>¡Seguir!</Text>
              </View>
            </PressableScale>
          </View>
        </Animated.View>
      </Pressable>
      <ShareSheet data={shareOpen ? { kind: 'streak', days: to } : null} onClose={() => setShareOpen(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 4,
  },
  miniLit: { backgroundColor: '#FFF1E0', borderColor: '#FFC48A', borderBottomColor: '#F59E0B' },
  miniRisk: { backgroundColor: '#FFF7D6', borderColor: '#FDE68A', borderBottomColor: '#F59E0B' },
  miniOff: { backgroundColor: '#F3F6FC', borderColor: THEME.fill2, borderBottomColor: '#CBD5E8' },
  miniDays: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },
  miniSub: { fontSize: 10, fontWeight: '700', color: THEME.ink2 },
  miniShield: { flexDirection: 'row', alignItems: 'center', marginLeft: 2 },
  miniShieldText: { fontSize: 11, fontWeight: '900', color: '#2563EB', marginLeft: -2 },
  card: {
    borderRadius: 28,
    padding: 16,
    gap: 14,
    borderWidth: 2,
    borderColor: 'rgba(30,36,54,0.08)',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(30,36,54,0.14)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bigNumber: { fontSize: 46, fontWeight: '900', color: THEME.ink, letterSpacing: -1.5, lineHeight: 50 },
  bigLabel: { fontSize: 18, fontWeight: '800', color: THEME.ink2, marginBottom: 8 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 6 },
  dayLabel: { fontSize: 12, fontWeight: '800', color: THEME.ink3 },
  dayDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.fill2,
  },
  dayDotLit: { backgroundColor: '#FFE7CC', borderColor: '#FFB066' },
  dayDotShield: { backgroundColor: '#E6F0FF', borderColor: '#93C5FD' },
  dayDotToday: { borderColor: '#FF7A1A', borderStyle: 'dashed' },
  row: { flexDirection: 'row', gap: 10 },
  shieldBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 10, gap: 6 },
  milestoneBox: { flex: 1.4, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 10, gap: 6 },
  milestoneTitle: { fontSize: 13, fontWeight: '800', color: THEME.ink },
  smallNote: { fontSize: 11, fontWeight: '600', color: THEME.ink2 },
  reminderBox: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 10, gap: 8 },
  toggle: { width: 50, height: 30, borderRadius: 15, backgroundColor: THEME.fill2, padding: 3 },
  toggleOn: { backgroundColor: THEME.green },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' },
  hourChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: THEME.fill },
  hourChipOn: { backgroundColor: THEME.blue },
  hourText: { fontSize: 12, fontWeight: '800', color: THEME.ink2 },
  action: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(30,36,54,0.08)',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(30,36,54,0.18)',
  },
  actionInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
  celebrateBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  celebrateCenter: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  celebrateNumber: { fontSize: 72, fontWeight: '900', color: '#FFFFFF', letterSpacing: -3, lineHeight: 78 },
  celebrateTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.6, textAlign: 'center' },
  celebrateSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
  celebrateWeek: { flexDirection: 'row', gap: 6, marginTop: 6 },
  celebrateDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrateDayText: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.7)' },
  celebratePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  celebratePillText: { fontSize: 13, fontWeight: '800', color: THEME.ink },
});
