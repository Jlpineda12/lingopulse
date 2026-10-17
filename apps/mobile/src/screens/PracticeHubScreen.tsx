import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CEFR_LEVEL_META,
  CEFR_LEVELS,
  LISTENING_TRACKS,
  PLACEMENT_QUESTIONS,
  QUICK_ROLEPLAY_MISSIONS,
  READING_PASSAGES,
  scorePlacementTest,
  SPEAKING_TOPICS,
  WRITING_PROMPTS,
  type PlacementResult,
  type PracticeLevel,
  type QuickRoleplayMission,
} from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame, type ActivityKind, type Screen } from '../context/GameContext';
import {
  BIOME_PALETTES,
  FloatingIslandQuestNode,
  SkyBridgeConnector,
  WorldBiomeHeader,
  type IslandBiomeKey,
} from '../components/GameIslands';
import {
  detectDefaultAtmosphere,
  DynamicIslandAtmosphereBanner,
  type IslandAtmosphereMode,
} from '../components/GameVfx';
import { OptionButton } from '../components/MultipleChoice';
import { PressableScale, Reveal } from '../components/motion';
import {
  Badge,
  Button,
  Card,
  Chip,
  Eyebrow,
  LargeTitle,
  Title,
  ui,
} from '../components/ui';
import { playSfx } from '../services/sfx';
import { speakEnglishPhrase } from '../services/speech';
import { GRADIENTS, SHADOW, THEME, TYPE } from '../theme/colors';

const LEVEL_FILTERS: readonly PracticeLevel[] = CEFR_LEVELS;

type HubCategory =
  | 'speaking'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'roleplay'
  | 'placement';

const HUB_WORLDS: Array<{
  id: HubCategory;
  label: string;
  biome: IslandBiomeKey;
  mcIcon: keyof typeof MaterialCommunityIcons.glyphMap;
}> = [
  { id: 'speaking', label: 'Isla Voz', biome: 'speaking', mcIcon: 'microphone-variant' },
  { id: 'listening', label: 'Isla Oído', biome: 'listening', mcIcon: 'headphones-settings' },
  { id: 'reading', label: 'Isla Lectura', biome: 'reading', mcIcon: 'book-open-page-variant' },
  { id: 'writing', label: 'Isla Pluma', biome: 'writing', mcIcon: 'fountain-pen-tip' },
  { id: 'roleplay', label: 'Roleplay IA', biome: 'roleplay', mcIcon: 'drama-masks' },
  { id: 'placement', label: 'Templo Nivel', biome: 'placement', mcIcon: 'crown-circle' },
];

interface IslandItem {
  id: string;
  emoji: string;
  title: string;
  level: PracticeLevel;
  sub: string;
  xpReward: number;
  screen: Screen;
}

export function PracticeHubScreen() {
  const { locale } = useAppState();
  const { progress, setLevel, openScreen, completeActivity } = useGame();
  const [activeTab, setActiveTab] = useState<HubCategory>('speaking');
  const [weatherMode, setWeatherMode] = useState<IslandAtmosphereMode>(
    detectDefaultAtmosphere
  );

  // Estado para Misiones de Roleplay Rápidas
  const [selectedMission, setSelectedMission] = useState<QuickRoleplayMission | null>(null);
  const [missionStage, setMissionStage] = useState<0 | 1 | 2>(0);

  // Estado para Examen de Nivelación desde el Hub
  const [examIdx, setExamIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [examResult, setExamResult] = useState<PlacementResult | null>(null);

  const sections: Record<
    'speaking' | 'listening' | 'reading' | 'writing',
    { kind: ActivityKind; desc: string; islands: IslandItem[] }
  > = {
    speaking: {
      kind: 'speaking',
      desc: 'Conquista cada isla grabando tu voz. Analizamos fluidez, ritmo, gramática y palabras clave.',
      islands: SPEAKING_TOPICS.map((t) => ({
        id: t.id,
        emoji: t.emoji,
        title: t.title,
        level: t.level,
        sub: `Habla ${t.suggestedSeconds}s · Clave: ${t.targetWords.slice(0, 3).join(', ')}`,
        xpReward: 30,
        screen: { name: 'speaking', topicId: t.id },
      })),
    },
    listening: {
      kind: 'listening',
      desc: 'Navega por diálogos nativos, pódcasts y conferencias a velocidad normal o lenta + dictado.',
      islands: LISTENING_TRACKS.map((t) => ({
        id: t.id,
        emoji: t.emoji,
        title: t.title,
        level: t.level,
        sub: `${t.questions.length} retos de oído · ${t.dictation.length} dictados`,
        xpReward: 30,
        screen: { name: 'listening', trackId: t.id },
      })),
    },
    reading: {
      kind: 'reading',
      desc: 'Explora historias y artículos de tu nivel con glosario interactivo y retos de comprensión.',
      islands: READING_PASSAGES.map((p) => ({
        id: p.id,
        emoji: p.emoji,
        title: p.title,
        level: p.level,
        sub: `${p.paragraphs.join(' ').split(/\s+/).length} palabras · ${p.questions.length} preguntas`,
        xpReward: 35,
        screen: { name: 'reading', passageId: p.id },
      })),
    },
    writing: {
      kind: 'writing',
      desc: 'Domina mensajes, correos ejecutivos, reseñas y ensayos con corrección instantánea.',
      islands: WRITING_PROMPTS.map((w) => ({
        id: w.id,
        emoji: w.emoji,
        title: w.title,
        level: w.level,
        sub: `${w.type.toUpperCase()} · mín. ${w.minWords} palabras`,
        xpReward: 35,
        screen: { name: 'writing', promptId: w.id },
      })),
    },
  };

  const levelMeta = CEFR_LEVEL_META[progress.level];

  const renderSkillArchipelago = (
    catKey: 'speaking' | 'listening' | 'reading' | 'writing'
  ) => {
    const section = sections[catKey];
    // Mostrar únicamente las islas del nivel elegido por el usuario
    const filteredIslands = section.islands.filter(
      (r) => r.level === progress.level
    );

    return (
      <View style={{ gap: 14 }}>
        <Reveal index={2}>
          <WorldBiomeHeader
            biomeKey={catKey}
            description={section.desc}
            totalCount={filteredIslands.length}
          />
        </Reveal>

        <View style={styles.islandsMapContainer}>
          {filteredIslands.map((item, idx) => {
            const isCurrent = idx === 0;
            const isLast = idx === filteredIslands.length - 1;
            return (
              <Reveal key={item.id} index={3 + Math.min(idx, 8)}>
                <FloatingIslandQuestNode
                  index={idx}
                  biomeKey={catKey}
                  stepLabel={`ISLA ${idx + 1} · ${item.level}`}
                  title={item.title}
                  level={item.level}
                  xpReward={item.xpReward}
                  active={isCurrent}
                  showCompanion={isCurrent}
                  onPress={() => openScreen(item.screen)}
                />
                {!isLast ? (
                  <SkyBridgeConnector fromLeft={idx % 2 === 0} />
                ) : null}
              </Reveal>
            );
          })}
        </View>
      </View>
    );
  };

  const renderRoleplayArchipelago = () => {
    const missions = QUICK_ROLEPLAY_MISSIONS.filter(
      (m) => m.level === progress.level
    );

    if (selectedMission) {
      const lineToSay =
        missionStage === 0
          ? selectedMission.openingLineEn
          : missionStage === 1
            ? selectedMission.twistLineEn
            : selectedMission.closingLineEn;

      return (
        <Reveal index={2}>
          <Card style={{ gap: 14 }}>
            <View style={ui.rowBetween}>
              <Badge
                label={`Isla de Simulación ${selectedMission.level} · Turno ${missionStage + 1}/3`}
                bg="#F0F4FF"
                color={THEME.violet}
                icon="chatbubbles"
              />
              <Button
                label="Volver al mapa"
                small
                variant="secondary"
                onPress={() => {
                  setSelectedMission(null);
                  setMissionStage(0);
                }}
              />
            </View>
            <Title>
              {selectedMission.emoji} {selectedMission.title}
            </Title>
            <Text style={TYPE.subhead}>
              Interlocutor:{' '}
              <Text style={{ fontWeight: '800', color: THEME.ink }}>
                {selectedMission.rolePersona}
              </Text>
            </Text>
            <Text style={TYPE.footnote}>Misión: {selectedMission.scenarioEs}</Text>

            <View style={styles.npcBubble}>
              <View style={ui.rowBetween}>
                <Text style={styles.npcSpeakerLabel}>
                  {selectedMission.rolePersona} dice:
                </Text>
                <PressableScale
                  onPress={() => speakEnglishPhrase(lineToSay, locale)}
                  hapticKind="light"
                  style={styles.speakerPill}
                >
                  <Ionicons name="volume-high" size={15} color={THEME.blue} />
                  <Text style={styles.speakerPillText}>Escuchar voz</Text>
                </PressableScale>
              </View>
              <Text style={styles.npcBubbleText}>“{lineToSay}”</Text>
            </View>

            <View style={{ gap: 6 }}>
              <Text style={TYPE.caption}>
                Frases clave recomendadas (tócalas si quieres escuchar su pronunciación):
              </Text>
              <View style={ui.rowWrap}>
                {selectedMission.targetPhrases.map((p) => (
                  <PressableScale
                    key={p}
                    hapticKind="light"
                    onPress={() => speakEnglishPhrase(p, locale)}
                  >
                    <Badge
                      label={` ${p}`}
                      bg={THEME.fill}
                      color={THEME.ink}
                    />
                  </PressableScale>
                ))}
              </View>
            </View>

            {missionStage < 2 ? (
              <View style={ui.row}>
                <Button
                  label="Escuchar audio"
                  icon="volume-high"
                  variant="secondary"
                  onPress={() => speakEnglishPhrase(lineToSay, locale)}
                />
                <Button
                  label={
                    missionStage === 0
                      ? 'Superar turno 1 (Imprevisto)'
                      : 'Superar turno 2 (Cerrar trato)'
                  }
                  icon="checkmark-circle"
                  variant="gold"
                  style={{ flex: 1 }}
                  onPress={() => {
                    const nextStage = (missionStage + 1) as 1 | 2;
                    setMissionStage(nextStage);
                    if (nextStage === 1) {
                      playSfx('correct');
                    } else {
                      playSfx('fanfare');
                      completeActivity({
                        kind: 'speaking',
                        title: `Roleplay: ${selectedMission.title}`,
                        score: 95,
                        speakingSec: 45,
                      });
                    }
                  }}
                />
              </View>
            ) : (
              <View style={styles.roleplaySuccessBox}>
                <Text style={styles.roleplaySuccessTitle}>
                  ¡Isla de Roleplay conquistada! (+35 XP)
                </Text>
                <Button
                  label="Explorar otra isla de Roleplay"
                  icon="map"
                  variant="primary"
                  onPress={() => {
                    setSelectedMission(null);
                    setMissionStage(0);
                  }}
                />
              </View>
            )}
          </Card>
        </Reveal>
      );
    }

    return (
      <View style={{ gap: 14 }}>
        <Reveal index={2}>
          <PressableScale
            onPress={() => openScreen({ name: 'lesson' })}
            scaleTo={0.98}
            hapticKind="select"
          >
            <LinearGradient
              colors={GRADIENTS.lesson}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.arenaHero, SHADOW.float]}
            >
              <View style={ui.rowBetween}>
                <Badge
                  label="ISLA JEFE · SCORECARD EN VIVO"
                  bg="rgba(255, 255, 255, 0.22)"
                  color="#FFFFFF"
                  icon="sparkles"
                />
                <Ionicons name="arrow-forward-circle" size={28} color="#FFE082" />
              </View>
              <Text style={styles.arenaTitle}> Santuario Voice Arena</Text>
              <Text style={styles.arenaSub}>
                Anatomía léxica + Input + Writing + Roleplay de voz en tiempo real con métricas WPM y pronunciación.
              </Text>
            </LinearGradient>
          </PressableScale>
        </Reveal>

        <View style={styles.islandsMapContainer}>
          {missions.map((m, idx) => {
            const firstUserIdx = missions.findIndex(
              (item) => item.level === progress.level
            );
            const companionIdx = firstUserIdx >= 0 ? firstUserIdx : 0;
            const isCurrent = idx === companionIdx;
            const isLast = idx === missions.length - 1;
            return (
              <Reveal key={m.id} index={3 + idx}>
                <FloatingIslandQuestNode
                  index={idx}
                  biomeKey="roleplay"
                  stepLabel={`SIMULACIÓN · ${m.level}`}
                  title={m.title}
                  level={m.level}
                  xpReward={40}
                  active={isCurrent}
                  showCompanion={isCurrent}
                  onPress={() => {
                    setSelectedMission(m);
                    setMissionStage(0);
                  }}
                />
                {!isLast ? (
                  <SkyBridgeConnector fromLeft={idx % 2 === 0} />
                ) : null}
              </Reveal>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPlacementTab = () => {
    const q = PLACEMENT_QUESTIONS[examIdx]!;

    if (examResult) {
      return (
        <Reveal index={2}>
          <Card tone="gold" style={{ gap: 12 }}>
            <Badge
              label={`Diagnóstico Oficial · ${examResult.scorePercent}%`}
              bg="#FFFFFF"
              color={THEME.gold}
              icon="trophy"
            />
            <Title>
              Tu rango desbloqueado: {CEFR_LEVEL_META[examResult.deducedLevel].titleEs}
            </Title>
            <Text style={TYPE.body}>{examResult.summaryEs}</Text>
            <View style={{ gap: 6 }}>
              <Text style={TYPE.caption}>Fortalezas de tu perfil:</Text>
              {examResult.strengthsEs.map((s) => (
                <Text key={s} style={TYPE.subhead}>
                  ✓ {s}
                </Text>
              ))}
            </View>
            <View style={ui.row}>
              <Button
                label="Repetir prueba"
                variant="secondary"
                icon="refresh"
                onPress={() => {
                  setExamIdx(0);
                  setExamAnswers({});
                  setPickedOption(null);
                  setExamResult(null);
                }}
              />
              <Button
                label={`Explorar Islas ${examResult.deducedLevel}`}
                variant="gold"
                icon="arrow-forward"
                style={{ flex: 1 }}
                onPress={() => {
                  setLevel(examResult.deducedLevel);
                  setActiveTab('speaking');
                }}
              />
            </View>
          </Card>
        </Reveal>
      );
    }

    return (
      <View style={{ gap: 14 }}>
        <Reveal index={2}>
          <WorldBiomeHeader
            biomeKey="placement"
            description="Supera las 12 pruebas del Oráculo (A1 a C2) para calibrar automáticamente la dificultad de tus islas."
            totalCount={PLACEMENT_QUESTIONS.length}
          />
        </Reveal>

        <Reveal index={3}>
          <Card style={{ gap: 14 }}>
            <View style={ui.rowBetween}>
              <Eyebrow icon="compass" color={THEME.gold}>
                Prueba {examIdx + 1} de {PLACEMENT_QUESTIONS.length}
              </Eyebrow>
              <Badge label={`Nivel ${q.level}`} bg="#FFF6E0" color={THEME.gold} />
            </View>
            <Text style={TYPE.subhead}>{q.promptEs}</Text>

            {q.audioTextEn ? (
              <Button
                label="Escuchar pista de audio"
                variant="blue"
                small
                onPress={() => speakEnglishPhrase(q.audioTextEn!, locale)}
              />
            ) : null}

            <View style={styles.examBanner}>
              <Text style={styles.examBannerText}>{q.questionEn}</Text>
            </View>

            <View style={{ gap: 8 }}>
              {q.options.map((opt, idx) => {
                const isAnswer = idx === q.answerIndex;
                const state =
                  pickedOption === null
                    ? 'idle'
                    : pickedOption === idx
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
                    disabled={pickedOption !== null}
                    onPress={() => {
                      // OptionButton reproduce automáticamente el sonido de acierto o error estilo Duolingo
                      setPickedOption(idx);
                      setExamAnswers((prev) => ({ ...prev, [q.id]: idx }));
                    }}
                  />
                );
              })}
            </View>

            {pickedOption !== null && (
              <View style={{ gap: 10 }}>
                <Text style={TYPE.footnote}>{q.explanationEs}</Text>
                <Button
                  label={
                    examIdx >= PLACEMENT_QUESTIONS.length - 1
                      ? 'Revelar mi rango CEFR'
                      : 'Siguiente isla de prueba'
                  }
                  icon="arrow-forward"
                  variant="gold"
                  onPress={() => {
                    if (examIdx >= PLACEMENT_QUESTIONS.length - 1) {
                      const res = scorePlacementTest(examAnswers);
                      playSfx('fanfare');
                      setExamResult(res);
                      setLevel(res.deducedLevel);
                    } else {
                      setExamIdx((i) => i + 1);
                      setPickedOption(null);
                    }
                  }}
                />
              </View>
            )}
          </Card>
        </Reveal>
      </View>
    );
  };

  return (
    <View style={ui.screen}>
      {/* Cabecera de Mundos e Islas */}
      <Reveal index={0}>
        <View style={ui.rowBetween}>
          <LargeTitle subtitle={`Mostrando solo las islas de tu nivel (${progress.level})`}>
            Mundos e Islas
          </LargeTitle>
          <PressableScale
            onPress={() => setActiveTab('placement')}
            hapticKind="select"
          >
            <View
              style={[
                styles.rankPill,
                { borderColor: levelMeta.color },
              ]}
            >
              <MaterialCommunityIcons
                name="crown"
                size={15}
                color={levelMeta.color}
              />
              <Text style={styles.rankPillText}>{levelMeta.titleEs}</Text>
            </View>
          </PressableScale>
        </View>
      </Reveal>

      {/* Selector de Archipiélago / Mundo con colores vivos (Cero negro) */}
      <Reveal index={1}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 3 }}
        >
          {HUB_WORLDS.map((w) => {
            const active = activeTab === w.id;
            const palette = BIOME_PALETTES[w.biome];
            return (
              <PressableScale
                key={w.id}
                hapticKind="select"
                onPress={() => setActiveTab(w.id)}
                style={[
                  styles.worldTab,
                  active && {
                    backgroundColor: palette.accent,
                    borderColor: palette.accent,
                    borderBottomColor: palette.cliffMid,
                  },
                  SHADOW.card,
                ]}
              >
                <MaterialCommunityIcons
                  name={w.mcIcon}
                  size={17}
                  color={active ? '#FFFFFF' : palette.accent}
                />
                <Text
                  style={[
                    styles.worldTabText,
                    active && { color: '#FFFFFF' },
                  ]}
                >
                  {w.label}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </Reveal>

      {/* Selector de Nivel Activo (Muestra solo las islas del nivel elegido) */}
      {activeTab !== 'placement' && (
        <Reveal index={1}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {LEVEL_FILTERS.map((l) => (
              <Chip
                key={l}
                label={
                  l === progress.level
                    ? `Islas ${l} (Tu nivel)`
                    : `Nivel ${l}`
                }
                active={progress.level === l}
                color={CEFR_LEVEL_META[l].color}
                onPress={() => {
                  setLevel(l);
                }}
              />
            ))}
          </ScrollView>
        </Reveal>
      )}

      {activeTab !== 'placement' && (
        <Reveal index={1}>
          <DynamicIslandAtmosphereBanner
            mode={weatherMode}
            onChangeMode={setWeatherMode}
          />
        </Reveal>
      )}

      {/* Mapa de Islas Flotantes del Mundo Activo */}
      {(activeTab === 'speaking' ||
        activeTab === 'listening' ||
        activeTab === 'reading' ||
        activeTab === 'writing') &&
        renderSkillArchipelago(activeTab)}

      {activeTab === 'roleplay' && renderRoleplayArchipelago()}

      {activeTab === 'placement' && renderPlacementTab()}
    </View>
  );
}

const styles = StyleSheet.create({
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 2,
    ...SHADOW.card,
  },
  rankPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.ink,
  },
  worldTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E9F5',
    borderBottomWidth: 3.5,
    borderBottomColor: '#CBD6EC',
  },
  worldTabText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  islandsMapContainer: {
    gap: 0,
  },
  arenaHero: {
    borderRadius: 26,
    padding: 20,
    gap: 8,
    borderBottomWidth: 5,
    borderBottomColor: '#3E1DB8',
  },
  arenaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  arenaSub: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.9)',
  },
  npcBubble: {
    backgroundColor: '#EBF4FF',
    padding: 16,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#C5DFFF',
  },
  npcSpeakerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.blue,
  },
  speakerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  speakerPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.blue,
  },
  npcBubbleText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: THEME.ink,
  },
  roleplaySuccessBox: {
    backgroundColor: '#E9FAF0',
    padding: 16,
    borderRadius: 18,
    gap: 10,
    alignItems: 'center',
  },
  roleplaySuccessTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#176B3A',
  },
  examBanner: {
    padding: 15,
    borderRadius: 16,
    backgroundColor: '#FFF9EB',
    borderWidth: 1.5,
    borderColor: '#F7E3A8',
  },
  examBannerText: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
    color: THEME.ink,
  },
});
