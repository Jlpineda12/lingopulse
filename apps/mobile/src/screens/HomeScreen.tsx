import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { Ionicons } from '@expo/vector-icons';
import {
  CEFR_LEVEL_META,
  DAILY_CATEGORY_META,
  getDailyDrop,
  getDailyPractice,
  SPANGLISH_TRAPS,
} from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame, type ActivityKind } from '../context/GameContext';
import {
  FloatingIslandQuestNode,
  IslandSkyBackdrop,
  RouteChestNode,
  LEVEL_DIFFICULTY_ES,
  SkyBridgeConnector,
  type IslandBiomeKey,
} from '../components/GameIslands';
import {
  ATMOSPHERE_META,
  detectDefaultAtmosphere,
  DynamicIslandAtmosphereBanner,
  TomodachiDreamModal,
  type IslandAtmosphereMode,
} from '../components/GameVfx';
import type { TopicIllustrationKind } from '../components/CustomTopicIcons';
import { OptionButton } from '../components/MultipleChoice';
import { PressableScale, Reveal } from '../components/motion';
import { Badge, Button, Card, Eyebrow, LargeTitle, SectionHeader, ui, type IconName } from '../components/ui';
import { moodMessage } from '../game/pet';
import { speakEnglishPhrase } from '../services/speech';
import { THEME, TYPE, type GradientKey } from '../theme/colors';
import { Glyph } from '../components/Glyph';
import { TodaySessionCard, type SessionStep } from '../components/TodaySessionCard';
import { eventMissions } from '../game/events';
import { LEAGUE_TIERS } from '../game/league';

export const KIND_META: Record<ActivityKind, { icon: IconName; label: string; gradient: GradientKey }> = {
  speaking: { icon: 'mic', label: 'Speaking', gradient: 'speaking' },
  listening: { icon: 'headset', label: 'Listening', gradient: 'listening' },
  reading: { icon: 'reader', label: 'Reading', gradient: 'reading' },
  writing: { icon: 'create', label: 'Writing', gradient: 'writing' },
  daily: { icon: 'sparkles', label: 'Daily Drop', gradient: 'daily' },
  lesson: { icon: 'planet', label: 'Voice Arena', gradient: 'lesson' },
};

export const NEED_RINGS = {
  fullness: ['#FF8FA8', '#FF375F'] as const,
  energy: ['#C8F56A', '#5CD62E'] as const,
  happiness: ['#7FE0FF', '#20A4F3'] as const,
};

export function HomeScreen() {
  const { locale, speakWithPip, babbleWithPip, lesson } = useAppState();
  const {
    pet,
    mood,
    progress,
    currentAccount,
    todayKey,
    todayActivities,
    setTab,
    openScreen,
    eventState,
    league,
    replayTutorial,
    petStage,
  } = useGame();

  const [trapIdx, setTrapIdx] = useState(0);
  const [trapPicked, setTrapPicked] = useState<number | null>(null);
  const [dreamModalVisible, setDreamModalVisible] = useState(false);
  const [trapOpen, setTrapOpen] = useState(false);
  const [weatherMode, setWeatherMode] = useState<IslandAtmosphereMode>(detectDefaultAtmosphere);

  const hour = new Date().getHours();
  const drop = useMemo(() => getDailyDrop(todayKey, progress.level), [todayKey, progress.level]);
  const practice = useMemo(() => getDailyPractice(todayKey, progress.level), [todayKey, progress.level]);
  const levelInfo = CEFR_LEVEL_META[progress.level];
  const featuredMeta = DAILY_CATEGORY_META[drop.featured.category];
  const greeting = moodMessage(pet.name, mood, pet.catchphrase);

  const baseHello = hour < 12 ? 'Good morning' : hour < 19 ? 'Good afternoon' : 'Good evening';
  const hello = currentAccount ? `${baseHello}, ${currentAccount.playerName}` : baseHello;

  const levelTraps = useMemo(() => {
    const matching = SPANGLISH_TRAPS.filter((t) => t.level === progress.level);
    return matching.length > 0 ? matching : SPANGLISH_TRAPS;
  }, [progress.level]);
  const currentTrap = levelTraps[trapIdx % levelTraps.length]!;

  // Ruta Minimalista de Islas Flotantes del Día (sin cuadrículas, con iconos 2D importados arriba y Tamagotchi 3D acompañando)
  const pathIslands: Array<{
    step: number;
    biomeKey: IslandBiomeKey;
    badge: string;
    title: string;
    illustrationKind?: TopicIllustrationKind;
    done: boolean;
    onPress: () => void;
  }> = [
    {
      step: 1,
      biomeKey: 'daily',
      badge: `ISLA 1 · ${featuredMeta.labelEn.toUpperCase()}`,
      title: `Cofre: “${drop.featured.term}”`,
      illustrationKind: 'treasure',
      done: todayActivities.some((a) => a.kind === 'daily'),
      onPress: () => setTab('daily'),
    },
    {
      step: 2,
      biomeKey: 'speaking',
      badge: `ISLA 2 · SPEAKING`,
      title: practice.speaking.title,
      done: todayActivities.some((a) => a.kind === 'speaking'),
      onPress: () => openScreen({ name: 'speaking', topicId: practice.speaking.id }),
    },
    {
      step: 3,
      biomeKey: 'listening',
      badge: `ISLA 3 · LISTENING`,
      title: practice.listening.title,
      illustrationKind: 'audio_wave',
      done: todayActivities.some((a) => a.kind === 'listening'),
      onPress: () => openScreen({ name: 'listening', trackId: practice.listening.id }),
    },
    {
      step: 4,
      biomeKey: 'reading',
      badge: `ISLA 4 · READING`,
      title: practice.reading.title,
      done: todayActivities.some((a) => a.kind === 'reading') || todayActivities.some((a) => a.kind === 'writing'),
      onPress: () => openScreen({ name: 'reading', passageId: practice.reading.id }),
    },
    {
      step: 5,
      biomeKey: 'lesson',
      badge: 'ISLA 5 · JEFE DE ARENA',
      title: `Arena: ${lesson.title}`,
      illustrationKind: 'arena_boss',
      done: todayActivities.some((a) => a.kind === 'lesson'),
      onPress: () => openScreen({ name: 'lesson' }),
    },
  ];

  const activeStepNumber = pathIslands.find((n) => !n.done)?.step ?? pathIslands.length;

  // Sesión de Hoy: tres pasos cortos; hablar con la mascota es el centro.
  const voiceDone = todayActivities.some((a) => a.kind === 'speaking' || a.kind === 'lesson');
  const sessionSteps: SessionStep[] = [
    {
      id: 'word',
      icon: 'sparkles',
      title: `Palabra del día: “${drop.featured.term}”`,
      minutes: 1,
      done: todayActivities.some((a) => a.kind === 'daily'),
      onPress: () => setTab('daily'),
    },
    {
      id: 'voice',
      icon: 'mic',
      title: `Habla con ${pet.name}`,
      minutes: 3,
      done: voiceDone,
      onPress: () => openScreen({ name: 'speaking', topicId: practice.speaking.id }),
    },
    {
      id: 'listen',
      icon: 'headset',
      title: 'Escucha y responde',
      minutes: 1,
      done: todayActivities.some((a) => a.kind === 'listening'),
      onPress: () => openScreen({ name: 'listening', trackId: practice.listening.id }),
    },
  ];

  const canvasAmbientBg = ATMOSPHERE_META[weatherMode].skyBottom;

  return (
    <View style={ui.screen}>
      {/* Cabecera: Saludo a la izquierda + Fuego animado compacto al lado derecho */}
      <Reveal index={0}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <LargeTitle subtitle={`${levelInfo.titleEs} · ${LEVEL_DIFFICULTY_ES[progress.level]}`}>{hello}</LargeTitle>
          </View>
        </View>
      </Reveal>

      {/* Sesión de Hoy: la acción principal de la portada */}
      <Reveal index={1}>
        <TodaySessionCard pet={pet} mood={mood} stage={petStage.stage} steps={sessionSteps} onPetTap={() => babbleWithPip(greeting.en)} />
      </Reveal>

      {!voiceDone ? (
        // Hasta practicar la voz, la casa, la tienda y los minijuegos quedan en segundo plano.
        <Reveal index={2}>
          <View style={styles.lockedTeaser}>
            <Ionicons name="lock-closed" size={16} color={THEME.ink3} />
            <Text style={styles.lockedTeaserText}>
              Habla con {pet.name} para desbloquear hoy la ruta de islas, el evento, la liga y los minijuegos.
            </Text>
          </View>
        </Reveal>
      ) : null}

      {voiceDone ? (
      <>
      {/* Evento semanal y liga */}
      <Reveal index={2}>
        <View style={styles.liveRow}>
          <PressableScale
            onPress={() => openScreen({ name: 'event' })}
            style={[styles.liveCard, { backgroundColor: eventState.event.soft }]}
          >
            <Glyph name={eventState.event.glyph} size={40} />
            <Text style={styles.liveTag}>EVENTO</Text>
            <Text style={styles.liveTitle} numberOfLines={1}>
              {eventState.event.titleEs}
            </Text>
            <View style={styles.liveDots}>
              {eventMissions(eventState.event, eventState.progress).map((m) => (
                <View key={m.id} style={[styles.liveDot, m.done && { backgroundColor: THEME.green }]} />
              ))}
            </View>
          </PressableScale>
          <PressableScale
            onPress={() => openScreen({ name: 'league' })}
            style={[styles.liveCard, { backgroundColor: (LEAGUE_TIERS[league.tier] ?? LEAGUE_TIERS[0]!).soft }]}
          >
            <Glyph name={(LEAGUE_TIERS[league.tier] ?? LEAGUE_TIERS[0]!).glyph} size={40} />
            <Text style={styles.liveTag}>LIGA SEMANAL</Text>
            <Text style={styles.liveTitle} numberOfLines={1}>
              #{league.myRank} · {(LEAGUE_TIERS[league.tier] ?? LEAGUE_TIERS[0]!).nameEs.replace('Liga ', '')}
            </Text>
            <Text style={styles.liveSub}>{league.weekXp} XP esta semana</Text>
          </PressableScale>
        </View>
      </Reveal>

      {/* Mapa de Islas Minimalistas en Espacio Abierto (estilo Cairn + Toon 2D/3D) */}
      <Reveal index={2}>
        <SectionHeader
          title={`Ruta de Islas · Nivel ${progress.level}`}
          action="Ver mundos"
          onAction={() => setTab('practice')}
        />
      </Reveal>

      <IslandSkyBackdrop topColor={ATMOSPHERE_META[weatherMode].skyTop} bottomColor={canvasAmbientBg}>
        {pathIslands.map((island, idx) => {
          const isCurrent = island.step === activeStepNumber;
          const isLast = idx === pathIslands.length - 1;
          return (
            <Reveal key={island.step} index={3 + idx}>
              <FloatingIslandQuestNode
                index={idx}
                biomeKey={island.biomeKey}
                stepLabel={island.badge}
                title={island.title}
                level={progress.level}
                done={island.done}
                active={isCurrent && !island.done}
                showCompanion={isCurrent}
                illustrationKind={island.illustrationKind}
                onPress={island.onPress}
              />
              {!isLast ? <SkyBridgeConnector fromLeft={idx % 2 === 0} lit={island.done} /> : null}
            </Reveal>
          );
        })}
        <SkyBridgeConnector fromLeft={pathIslands.length % 2 === 1} lit={pathIslands.every((n) => n.done)} />
        <RouteChestNode done={pathIslands.every((n) => n.done)} onPress={() => setTab('practice')} />
      </IslandSkyBackdrop>

      <Reveal index={7}>
        <DynamicIslandAtmosphereBanner mode={weatherMode} onChangeMode={setWeatherMode} />
      </Reveal>

      {/* Extras: minijuegos y mini-reto, cerrados hasta que el usuario los abra */}
      <Reveal index={8}>
        <View style={styles.liveRow}>
          <PressableScale
            onPress={() => openScreen({ name: 'minigame' })}
            style={[styles.liveCard, { backgroundColor: '#EEF0FF' }]}
          >
            <Glyph name="arcade" size={40} />
            <Text style={styles.liveTag}>EXTRA</Text>
            <Text style={styles.liveTitle}>Minijuegos</Text>
            <Text style={styles.liveSub}>Gana estrellas para tu casa</Text>
          </PressableScale>
          <PressableScale
            onPress={() => setTrapOpen((v) => !v)}
            style={[styles.liveCard, { backgroundColor: '#FFF3E0' }, trapOpen && { borderColor: THEME.orange }]}
          >
            <Glyph name="bolt" size={40} />
            <Text style={styles.liveTag}>MINI-RETO</Text>
            <Text style={styles.liveTitle}>Spanglish</Text>
            <Text style={styles.liveSub}>{trapOpen ? 'Toca para cerrar' : 'Caza el error en 10 s'}</Text>
          </PressableScale>
        </View>
      </Reveal>

      {trapOpen ? (
        <Reveal index={0}>
          <Card style={styles.trapCard}>
            <View style={[ui.rowBetween, { flexWrap: 'wrap', gap: 6 }]}>
              <Eyebrow icon="flash" color={THEME.orange}>
                Mini-Juego · Cazador de Spanglish
              </Eyebrow>
              <Badge
                label={`Nivel ${currentTrap.level} · ${LEVEL_DIFFICULTY_ES[currentTrap.level]}`}
                bg="#FFF3E0"
                color="#D95B00"
                icon="flame"
              />
            </View>
            <Text style={TYPE.headline}>Encuentra cómo lo diría un hablante nativo:</Text>
            <View style={styles.trapWrongBox}>
              <Ionicons name="close-circle" size={18} color={THEME.red} />
              <Text style={styles.trapWrongText}>“{currentTrap.spanglishSentence}”</Text>
            </View>

            <View style={{ gap: 8 }}>
              {currentTrap.options.map((opt, idx) => {
                const isAnswer = idx === currentTrap.answerIndex;
                const state =
                  trapPicked === null
                    ? 'idle'
                    : trapPicked === idx
                      ? isAnswer
                        ? 'right'
                        : 'wrong'
                      : isAnswer
                        ? 'reveal'
                        : 'idle';
                return (
                  <OptionButton
                    key={opt}
                    label={opt}
                    state={state}
                    disabled={trapPicked !== null}
                    onPress={() => {
                      setTrapPicked(idx);
                    }}
                  />
                );
              })}
            </View>

            {trapPicked !== null && (
              <View style={styles.trapExplainBox}>
                <View style={ui.rowBetween}>
                  <Text style={styles.trapNaturalText}>✓ {currentTrap.naturalSentence}</Text>
                  <PressableScale
                    onPress={() => speakEnglishPhrase(currentTrap.naturalSentence, locale)}
                    hapticKind="light"
                    style={styles.listenMiniBtn}
                  >
                    <Ionicons name="volume-high" size={15} color="#176B3A" />
                    <Text style={styles.listenMiniText}>Escuchar</Text>
                  </PressableScale>
                </View>
                <Text style={TYPE.footnote}>{currentTrap.whyEs}</Text>
                <Button
                  label="Siguiente reto de Spanglish"
                  icon="arrow-forward"
                  small
                  variant="secondary"
                  onPress={() => {
                    setTrapPicked(null);
                    setTrapIdx((i) => i + 1);
                  }}
                />
              </View>
            )}
          </Card>
        </Reveal>
      ) : null}

      </>
      ) : null}

      <PressableScale onPress={replayTutorial} hapticKind="select" style={{ alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16 }}>
        <Text style={{ color: THEME.blue, fontWeight: '700', fontSize: 14 }}>¿Cómo funciona LingoPulse? Ver tutorial</Text>
      </PressableScale>

      <TomodachiDreamModal visible={dreamModalVisible} onClose={() => setDreamModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  lockedTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(30,36,54,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(30,36,54,0.06)',
    borderStyle: 'dashed',
  },
  lockedTeaserText: { flex: 1, fontSize: 13, color: THEME.ink2, lineHeight: 18 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  companionStatusBanner: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: '#1E2436',
    borderBottomWidth: 4,
  },
  companionBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  companionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companionBannerName: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.ink,
    letterSpacing: -0.3,
  },
  companionBannerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.ink2,
    marginTop: 2,
  },
  dreamMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.8,
    borderColor: '#6D28D9',
  },
  dreamMiniBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6D28D9',
  },
  customizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.8,
    borderColor: '#1E2436',
  },
  customizeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.blue,
  },
  companionBannerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  speechPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  speechPillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: THEME.ink,
  },
  miniNeedsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  miniNeedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  miniNeedText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.ink,
    fontVariant: ['tabular-nums'],
  },
  liveRow: { flexDirection: 'row', gap: 12 },
  liveCard: {
    flex: 1,
    borderRadius: 22,
    padding: 12,
    gap: 3,
    borderWidth: 2,
    borderColor: 'rgba(30,36,54,0.08)',
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(30,36,54,0.16)',
  },
  liveTag: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: THEME.ink2, marginTop: 4 },
  liveTitle: { fontSize: 15, fontWeight: '900', color: THEME.ink },
  liveSub: { fontSize: 11, fontWeight: '700', color: THEME.ink2 },
  liveDots: { flexDirection: 'row', gap: 4, marginTop: 2 },
  liveDot: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(30,36,54,0.12)' },
  archipelagoOpenCanvas: {
    paddingVertical: 6,
    gap: 0,
  },
  trapCard: {
    gap: 12,
    borderWidth: 2,
    borderColor: '#1E2436',
    borderBottomWidth: 4,
    backgroundColor: '#FFFDF9',
  },
  trapWrongBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F3',
    padding: 12,
    borderRadius: 14,
  },
  trapWrongText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#B0173A',
    fontStyle: 'italic',
  },
  trapExplainBox: {
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#E9FAF0',
  },
  trapNaturalText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#176B3A',
  },
  listenMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  listenMiniText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#176B3A',
  },
});
