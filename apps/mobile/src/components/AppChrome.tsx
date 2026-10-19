import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../i18n';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState } from '../context/AppStateContext';
import { useGame, type TabId } from '../context/GameContext';
import { isSfxMuted, playSfx, toggleSfxMuted } from '../services/sfx';
import { GRADIENTS, SHADOW, THEME } from '../theme/colors';
import { AnimatedMiniFlame, FireStreakCard } from './FireStreakCard';
import { AnimatedNumber, haptic, PressableScale } from './motion';
import { Pet3D } from './Pet3D';

export function TopBar() {
  const { locale, toggleLocale } = useAppState();
  const { progress, currentAccount, logout, setTab, streakView } = useGame();
  const [showStreakPopover, setShowStreakPopover] = useState(false);
  // En teléfonos angostos (≤ 410 px) solo se muestra el logo para que quepan todas las píldoras.
  const compact = useWindowDimensions().width <= 410;
  const [muted, setMuted] = useState(() => isSfxMuted());
  const isUK = locale === 'en-GB';
  // La llama solo se enciende cuando la racha de hoy ya cuenta (misma regla que el contador).
  const activeToday = streakView.activeToday;

  return (
    <View style={styles.topWrapper}>
      <View style={styles.top}>
        <View style={styles.brand}>
          <LinearGradient colors={GRADIENTS.daily} style={styles.logo}>
            <MaterialCommunityIcons name="island" size={18} color="#FFFFFF" />
          </LinearGradient>
          {compact ? null : (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={styles.brandName}>LingoPulse</Text>
              <View style={styles.levelTag}>
                <Text style={styles.levelTagText}>{progress.level}</Text>
              </View>
            </View>
            {currentAccount ? (
              <Text style={styles.playerSub} numberOfLines={1}>
                {currentAccount.playerName} · {currentAccount.handle}
              </Text>
            ) : null}
          </View>
          )}
        </View>

        <View style={styles.pills}>
          {/* Racha compacta con mini llama animada (encendida o apagada) */}
          <PressableScale
            onPress={() => {
              haptic('select');
              setShowStreakPopover((v) => !v);
            }}
            accessibilityLabel="Ver estado de tu racha de fueguitos"
            style={[
              styles.pill,
              activeToday ? styles.firePillLit : styles.firePillOff,
            ]}
          >
            <View style={styles.pillInner}>
              <AnimatedMiniFlame lit={activeToday} size={22} tier={streakView.tier} />
              <AnimatedNumber
                value={streakView.streak}
                style={[
                  styles.pillText,
                  activeToday
                    ? { color: '#C84B00', fontWeight: '900' }
                    : { color: THEME.ink2, fontWeight: '700' },
                ]}
              />
              {compact ? null : <Text
                style={[
                  styles.fireStateMicro,
                  { color: activeToday ? '#E06D00' : THEME.ink3 },
                ]}
              >
                {activeToday ? 'ON' : 'OFF'}
              </Text>}
            </View>
          </PressableScale>

          {/* Monedas */}
          <View style={styles.pill}>
            <LinearGradient colors={GRADIENTS.gold} style={styles.coin} />
            <AnimatedNumber value={progress.coins} style={styles.pillText} />
          </View>

          {/* Sonidos de juego estilo Duolingo (ON / OFF) */}
          <PressableScale
            onPress={() => {
              const nextMuted = toggleSfxMuted();
              setMuted(nextMuted);
              if (!nextMuted) playSfx('correct');
            }}
            accessibilityLabel="Activar o silenciar efectos de sonido"
            style={[styles.pill, !muted && styles.sfxPillActive]}
          >
            <View style={styles.pillInner}>
              <Ionicons
                name={muted ? 'volume-mute' : 'musical-notes'}
                size={14}
                color={muted ? THEME.ink3 : THEME.blue}
              />
            </View>
          </PressableScale>

          {/* Selector UK / US (luminoso sin negro) */}
          <PressableScale
            onPress={toggleLocale}
            accessibilityLabel="Cambiar acento"
            style={[styles.pill, styles.localePill]}
          >
            <View style={styles.pillInner}>
              <Ionicons name="globe-outline" size={13} color={THEME.blue} />
              <Text style={[styles.pillText, { color: THEME.blue, fontWeight: '800' }]}>
                {isUK ? 'UK' : 'US'}
              </Text>
            </View>
          </PressableScale>

          {/* Cambiar de jugador / Salir */}
          {currentAccount ? (
            <PressableScale
              onPress={logout}
              accessibilityLabel="Cambiar de jugador"
              style={styles.pill}
            >
              <View style={styles.pillInner}>
                <Ionicons name="people-outline" size={15} color={THEME.ink} />
              </View>
            </PressableScale>
          ) : null}
        </View>
      </View>

      {/* Desplegable compacto si el usuario toca la llamita superior */}
      {showStreakPopover ? (
        <View style={styles.popoverWrap}>
          <FireStreakCard
            onPressAction={() => {
              setShowStreakPopover(false);
              setTab('practice');
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

import { MOOD_META } from '../game/pet';
import { Glyph } from './Glyph';

/**
 * Compañero Tamagotchi 3D Viajero:
 * Acompaña al usuario durante todo su recorrido por las pantallas de práctica,
 * retos diarios y lecciones (cuando no está ya posado en el mapa principal o en su santuario).
 * Reacciona en tiempo real con enojo (😠), ira (🤬 💢), sueño (😴), amor (💖) o festejo (🎉).
 */
export function CompanionTraveler() {
  const { screen, tab, pet, mood, stats, petThePet, setTab, lastReward } = useGame();
  const [minimized, setMinimized] = useState(false);
  const [reactKey, setReactKey] = useState(0);

  useEffect(() => {
    if (lastReward || mood === 'celebrate' || mood === 'love') {
      setReactKey((k) => k + 1);
    }
  }, [lastReward, mood]);

  // En el Santuario de Mascota ('pet') o en la Ruta Principal ('home') ya se muestra en grande
  if (screen.name === 'tabs' && (tab === 'pet' || tab === 'home')) {
    return null;
  }

  // En el mapa de Islas ('practice') ya está posado junto a la isla activa, salvo si estamos dentro de una pantalla de actividad
  if (screen.name === 'tabs' && tab === 'practice') {
    return null;
  }

  const moodInfo = MOOD_META[mood] ?? MOOD_META.happy;

  const companionLine =
    mood === 'rage'
      ? `¡OTRO ERROR! "${pet.catchphrase ?? 'Focus!'}"`
      : mood === 'angry'
        ? '¡Ups! Lee bien antes de elegir'
        : mood === 'celebrate'
          ? `"${pet.catchphrase ?? 'Awesome!'}" ¡Genial!`
          : mood === 'love'
            ? '¡Gracias por las caricias!'
            : mood === 'eating'
              ? '¡Qué rico snack! +Energía'
              : mood === 'sleepy'
                ? 'Zzz... ¡Tócame para despertar!'
                : screen.name === 'speaking'
                  ? '¡Habla con confianza!'
                  : screen.name === 'listening'
                    ? '¡Afina el oído!'
                    : screen.name === 'reading'
                      ? '¡Toca cualquier palabra!'
                      : screen.name === 'writing'
                        ? '¡Escribe tus ideas!'
                        : screen.name === 'lesson'
                          ? '¡A vencer la Arena!'
                          : '¡Exploremos el cofre!';

  if (minimized) {
    return (
      <View style={styles.travelerMinimizedWrap} pointerEvents="box-none">
        <PressableScale
          onPress={() => setMinimized(false)}
          hapticKind="light"
          style={[styles.travelerMiniPill, SHADOW.float]}
        >
          <Glyph name={moodInfo.glyph} size={24} />
          <Text style={styles.travelerMiniPillText}>{pet.name}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.travelerWrap} pointerEvents="box-none">
      <View
        style={[
          styles.travelerDock,
          SHADOW.float,
          (mood === 'angry' || mood === 'rage') && {
            borderColor: moodInfo.badgeColor,
            backgroundColor: moodInfo.badgeBg,
          },
          mood === 'celebrate' && {
            borderColor: '#FF9F0A',
            backgroundColor: '#FFFBEB',
          },
          mood === 'love' && {
            borderColor: '#FF375F',
            backgroundColor: '#FFF0F5',
          },
        ]}
      >
        <View style={styles.travelerHeaderRow}>
          <PressableScale
            onPress={() => setTab('pet')}
            hapticKind="select"
            style={[
              styles.travelerNameChip,
              { backgroundColor: moodInfo.badgeBg },
            ]}
          >
            <Glyph name={moodInfo.glyph} size={19} />
            <Text style={[styles.travelerNameText, { color: moodInfo.badgeColor }]}>
              {pet.name}
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => setMinimized(true)}
            hapticKind="light"
            style={styles.travelerCloseBtn}
          >
            <Ionicons name="chevron-down" size={13} color={THEME.ink2} />
          </PressableScale>
        </View>

        <PressableScale
          onPress={() => {
            petThePet();
            setReactKey((k) => k + 1);
          }}
          scaleTo={0.95}
          hapticKind="light"
          style={styles.travelerStage}
        >
          <Pet3D
            config={pet}
            mood={mood}
            size={88}
            energy={stats.energy / 100}
            reactKey={reactKey}
            onTap={() => {
              petThePet();
              setReactKey((k) => k + 1);
            }}
            backgroundColor="transparent"
          />
        </PressableScale>

        <Text
          style={[
            styles.travelerTipText,
            (mood === 'angry' || mood === 'rage') && { color: moodInfo.badgeColor },
          ]}
          numberOfLines={2}
        >
          {companionLine}
        </Text>
      </View>
    </View>
  );
}

const TABS: Array<{
  id: TabId;
  mcIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  activeColor: string;
  activeBg: string;
}> = [
  {
    id: 'home',
    mcIcon: 'map-marker-path',
    label: 'Ruta',
    activeColor: '#007AFF',
    activeBg: '#EBF4FF',
  },
  {
    id: 'daily',
    mcIcon: 'treasure-chest',
    label: 'Cofre Diario',
    activeColor: '#E87A00',
    activeBg: '#FFF4E3',
  },
  {
    id: 'practice',
    mcIcon: 'island',
    label: 'Islas',
    activeColor: '#15A869',
    activeBg: '#E8FAF0',
  },
  {
    id: 'pet',
    mcIcon: 'paw',
    label: 'Mascota',
    activeColor: '#FF375F',
    activeBg: '#FFF0F3',
  },
];

export function TabBar() {
  const { tab, setTab, screen, pet } = useGame();
  const [width, setWidth] = useState(0);
  const activeIndex = screen.name === 'tabs' ? TABS.findIndex((t) => t.id === tab) : -1;
  const activeTabMeta = TABS[activeIndex] ?? TABS[0]!;
  const x = useRef(new Animated.Value(0)).current;
  const itemW = width / TABS.length;

  useEffect(() => {
    if (activeIndex < 0 || !itemW) return;
    Animated.spring(x, {
      toValue: activeIndex * itemW,
      useNativeDriver: Platform.OS !== 'web',
      speed: 18,
      bounciness: 8,
    }).start();
  }, [activeIndex, itemW, x]);

  const content = (
    <View style={styles.tabRow} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {itemW > 0 && activeIndex >= 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: itemW - 10,
              backgroundColor: activeTabMeta.activeBg,
              transform: [{ translateX: x }],
            },
          ]}
        />
      ) : null}
      {TABS.map((t) => {
        const active = screen.name === 'tabs' && tab === t.id;
        return (
          <PressableScale
            key={t.id}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            hapticKind="select"
            scaleTo={0.9}
            onPress={() => setTab(t.id)}
            style={styles.tab}
          >
            <View style={styles.tabInner}>
              <MaterialCommunityIcons
                name={t.mcIcon}
                size={23}
                color={active ? t.activeColor : THEME.ink3}
              />
              <Text
                style={[
                  styles.tabLabel,
                  active && { color: t.activeColor, fontWeight: '800' },
                ]}
                numberOfLines={1}
              >
                {t.id === 'pet' ? pet.name : t.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );

  return (
    <View style={styles.tabWrap} pointerEvents="box-none">
      <View style={[styles.tabShell, SHADOW.float]}>
        <BlurView intensity={65} tint="light" style={styles.blur}>
          {content}
        </BlurView>
      </View>
    </View>
  );
}

export function RewardToast() {
  const { lastReward, dismissReward, pet } = useGame();
  const y = useRef(new Animated.Value(140)).current;
  const native = Platform.OS !== 'web';

  useEffect(() => {
    if (!lastReward) return;
    playSfx('fanfare');
    y.setValue(140);
    Animated.spring(y, {
      toValue: 0,
      useNativeDriver: native,
      speed: 12,
      bounciness: 10,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(y, {
        toValue: 160,
        duration: 260,
        useNativeDriver: native,
      }).start(() => dismissReward());
    }, 3600);
    return () => clearTimeout(t);
  }, [lastReward, dismissReward, y, native]);

  if (!lastReward) return null;
  return (
    <Animated.View style={[styles.toastWrap, { transform: [{ translateY: y }] }]}>
      <PressableScale onPress={dismissReward} style={[styles.toast, SHADOW.float]}>
        <View style={styles.toastRow}>
          <LinearGradient colors={GRADIENTS.gold} style={styles.toastIcon}>
            <Ionicons
              name={lastReward.leveledUp ? 'trophy' : 'flame'}
              size={22}
              color="#FFFFFF"
            />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>
              {lastReward.leveledUp
                ? `¡Nivel ${lastReward.newLevel} desbloqueado!`
                : lastReward.streakIncreased
                  ? '¡Fueguito de racha encendido!'
                  : '¡Isla superada con éxito!'}
            </Text>
            <Text style={styles.toastText}>
              +{lastReward.xp} XP · +{lastReward.coins} monedas
              {lastReward.streakIncreased ? '· racha +1': ''}
              {lastReward.goalReached ? ' · meta diaria cumplida' : ''}
            </Text>
            <Text style={styles.toastSub}>
              {pet.name} recibió energía gracias a tu práctica
            </Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topWrapper: {
    backgroundColor: THEME.bg,
    zIndex: 20,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: THEME.bg,
  },
  popoverWrap: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.4,
  },
  levelTag: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  levelTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.blue,
  },
  playerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.ink2,
    marginTop: -2,
  },
  pills: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: THEME.surface,
    ...SHADOW.card,
    shadowOpacity: 0.05,
  },
  firePillLit: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1.5,
    borderColor: '#FF9F1C',
  },
  firePillOff: {
    backgroundColor: '#F1F5FB',
    borderWidth: 1.5,
    borderColor: '#CBD5E8',
  },
  fireStateMicro: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  sfxPillActive: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#C5DFFF',
  },
  pillInner: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  localePill: {
    backgroundColor: '#EBF4FF',
    borderWidth: 1,
    borderColor: '#C5DFFF',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.ink,
    fontVariant: ['tabular-nums'],
  },
  coin: { width: 13, height: 13, borderRadius: 7 },
  travelerWrap: {
    position: 'absolute',
    right: 14,
    bottom: 88,
    zIndex: 18,
  },
  travelerDock: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E2436',
    borderBottomWidth: 4,
    width: 124,
  },
  travelerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: -4,
    zIndex: 5,
  },
  travelerNameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  travelerNameText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.blue,
  },
  travelerCloseBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  travelerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -4,
  },
  travelerTipText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.ink,
    textAlign: 'center',
    marginTop: -2,
  },
  travelerMinimizedWrap: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    zIndex: 18,
  },
  travelerMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#1E2436',
  },
  travelerMiniPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
  },
  tabShell: {
    width: '92%',
    maxWidth: 460,
    borderRadius: 30,
    overflow: Platform.OS === 'web' ? 'hidden' : 'visible',
  },
  blur: {
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor:
      Platform.OS === 'web'
        ? 'rgba(255,255,255,0.88)'
        : 'rgba(255,255,255,0.75)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  tabRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 0 },
  indicator: {
    position: 'absolute',
    left: 5,
    top: 6,
    bottom: 6,
    borderRadius: 24,
  },
  tab: { flex: 1 },
  tabInner: { alignItems: 'center', gap: 2, paddingVertical: 6 },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.ink3,
    letterSpacing: 0.1,
  },
  toastWrap: { position: 'absolute', left: 16, right: 16, bottom: 96, zIndex: 30 },
  toast: {
    backgroundColor: '#FFFDF7',
    borderRadius: 24,
    padding: 15,
    borderWidth: 2,
    borderColor: '#F5D488',
  },
  toastRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toastIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: { color: THEME.ink, fontSize: 15, fontWeight: '800' },
  toastText: {
    color: '#B87800',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  toastSub: { color: THEME.ink2, fontSize: 12, marginTop: 1, fontWeight: '500' },
});
