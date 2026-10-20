import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  CEFR_LEVEL_META,
  CEFR_LEVELS,
  PLACEMENT_QUESTIONS,
  scorePlacementTest,
  type PlacementResult,
  type PracticeLevel,
} from '@lingopulse/shared';
import { Text } from '../../i18n';
import { LEVEL_DIFFICULTY_ES } from '../../components/GameIslands';
import { OptionButton } from '../../components/MultipleChoice';
import { Pet3D } from '../../components/Pet3D';
import { AnimatedBar, Float, haptic, PressableScale, Reveal } from '../../components/motion';
import { Badge, Button, Chip, ui } from '../../components/ui';
import type { PetConfig } from '../../game/pet';
import { playSfx } from '../../services/sfx';
import { GRADIENTS, SHADOW, THEME, TYPE } from '../../theme/colors';
import { AnimatedShowcaseBackdrop } from './AuthBackdrop';
import { styles } from './authStyles';

/**
 * Último paso del registro: empezar desde cero en un toque, hacer el examen rápido o
 * elegir el nivel a mano. Lo más rápido (A1) va primero para llegar enseguida a la mascota.
 */
export function PlacementTestView({
  pet,
  level,
  onChangeLevel,
  onBack,
  onFinish,
  error,
  speak,
}: {
  pet: PetConfig;
  level: PracticeLevel;
  onChangeLevel: (l: PracticeLevel) => void;
  onBack: () => void;
  onFinish: (level: PracticeLevel) => void;
  error: string | null;
  speak: (text: string) => void;
}) {
  const [mode, setMode] = useState<'choose' | 'exam' | 'result'>('choose');
  const [examIdx, setExamIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [reactKey, setReactKey] = useState(0);

  const startExam = () => {
    haptic('select');
    setExamIdx(0);
    setAnswers({});
    setPicked(null);
    setResult(null);
    setMode('exam');
  };
  const next = (finishEarly = false) => {
    if (examIdx >= PLACEMENT_QUESTIONS.length - 1 || finishEarly) {
      const r = scorePlacementTest(answers);
      setResult(r);
      onChangeLevel(r.deducedLevel);
      setMode('result');
      playSfx('fanfare');
      return;
    }
    setExamIdx((i) => i + 1);
    setPicked(null);
  };

  if (mode === 'choose') {
    const meta = CEFR_LEVEL_META[level];
    return (
      <View style={{ flex: 1 }}>
        <AnimatedShowcaseBackdrop variant="teal" />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tealGoalContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.topNavRow}>
            <PressableScale onPress={onBack} style={styles.tealRoundBackBtn} accessibilityLabel="Volver">
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </PressableScale>
            <Text style={[styles.navPillLabel, { color: '#FFFFFF' }]}>PASO 2 DE 2</Text>
            <View style={{ width: 42 }} />
          </View>

          <Reveal index={0} style={styles.tealMascotStage}>
            <Float amplitude={7} duration={2400}>
              <Pet3D config={pet} stage="egg" growth={0.5} mood="happy" size={160} reactKey={reactKey} onTap={() => setReactKey((k) => k + 1)} backgroundColor="transparent" />
            </Float>
          </Reveal>

          <Reveal index={1} style={[styles.tealGoalCenter, { gap: 12 }]}>
            <Text style={styles.tealLevelTitleText}>¿Cuánto inglés sabes?</Text>
            {error ? <Text style={[styles.errorText, { color: '#FFE4E6', textAlign: 'center' }]}>{error}</Text> : null}

            {/* Lo más rápido primero: empezar ya desde A1 */}
            <PressableScale
              onPress={() => {
                haptic('success');
                onChangeLevel('A1');
                onFinish('A1');
              }}
              scaleTo={0.96}
              style={[styles.whiteHeroCta, SHADOW.float]}
            >
              <Text style={[styles.whiteHeroCtaText, { color: '#0C8B99' }]}>Empiezo desde cero (A1)</Text>
              <View style={[styles.whiteHeroCtaArrow, { backgroundColor: '#0C8B99' }]}>
                <Ionicons name="play" size={18} color="#FFFFFF" />
              </View>
            </PressableScale>

            <PressableScale onPress={startExam} scaleTo={0.96} style={styles.calculateGoalPill}>
              <Ionicons name="compass" size={18} color="#FFE082" />
              <Text style={styles.calculateGoalText}>Ya sé algo: test rápido de 2 minutos</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </PressableScale>

            <Text style={[styles.tealEyebrowText, { marginTop: 6 }]}>O elige tu nivel</Text>
            <View style={styles.tealLevelPillsRow}>
              {CEFR_LEVELS.map((lvlId) => {
                const active = level === lvlId;
                return (
                  <PressableScale
                    key={lvlId}
                    onPress={() => {
                      haptic('select');
                      onChangeLevel(lvlId);
                      setReactKey((k) => k + 1);
                    }}
                    scaleTo={0.92}
                    style={[styles.tealLevelOrb, active && styles.tealLevelOrbActive]}
                  >
                    <Text style={[styles.tealLevelOrbText, active && styles.tealLevelOrbTextActive]}>{lvlId}</Text>
                    <Text style={[styles.tealLevelOrbSub, active && { color: '#0C8B99' }]}>{LEVEL_DIFFICULTY_ES[lvlId].split(' ')[0]}</Text>
                  </PressableScale>
                );
              })}
            </View>
            <Text style={styles.tealLevelSummaryText}>{meta.summaryEs}</Text>
            {level !== 'A1' ? (
              <Button label={`Entrar a mis islas ${level}`} icon="checkmark" variant="gold" onPress={() => onFinish(level)} />
            ) : null}
          </Reveal>
        </ScrollView>
      </View>
    );
  }

  const q = PLACEMENT_QUESTIONS[examIdx]!;
  return (
    <View style={{ flex: 1, backgroundColor: '#F4F9FF' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.openCanvasContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topNavRow}>
          <PressableScale onPress={() => setMode('choose')} style={styles.roundNavBtn} accessibilityLabel="Volver">
            <Ionicons name="arrow-back" size={20} color={THEME.ink} />
          </PressableScale>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <AnimatedBar value={mode === 'result' ? 1 : (examIdx + 1) / PLACEMENT_QUESTIONS.length} colors={GRADIENTS.daily} height={9} />
          </View>
          <Text style={styles.stepCounterText}>{mode === 'result' ? '✓' : `${examIdx + 1}/${PLACEMENT_QUESTIONS.length}`}</Text>
        </View>

        {mode === 'exam' ? (
          <Reveal index={0} key={q.id} style={styles.openStepWrap}>
            <View style={[ui.rowBetween, { width: '100%' }]}>
              <Badge label={`Nivel ${q.level} · ${q.skillLabelEs}`} bg="#EAF3FF" color={THEME.blue} icon="compass" />
              {examIdx >= 3 ? (
                <PressableScale onPress={() => next(true)}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.blue }}>Ver resultado ya →</Text>
                </PressableScale>
              ) : null}
            </View>
            <Text style={styles.openCanvasTitle}>{q.questionEn}</Text>
            <Text style={styles.openCanvasSubtitle}>{q.promptEs}</Text>
            {q.audioTextEn ? (
              <PressableScale onPress={() => speak(q.audioTextEn!)} style={styles.examAudioPill}>
                <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                <Text style={styles.examAudioPillText}>Escuchar pista de voz</Text>
              </PressableScale>
            ) : null}
            <View style={{ width: '100%', gap: 10 }}>
              {q.options.map((opt, idx) => {
                const isAnswer = idx === q.answerIndex;
                const state = picked === null ? 'idle' : picked === idx ? (isAnswer ? 'right' : 'wrong') : isAnswer ? 'reveal' : 'idle';
                return (
                  <OptionButton
                    key={opt}
                    label={opt}
                    state={state}
                    disabled={picked !== null}
                    onPress={() => {
                      if (picked !== null) return;
                      setPicked(idx);
                      setAnswers((prev) => ({ ...prev, [q.id]: idx }));
                    }}
                  />
                );
              })}
            </View>
            {picked !== null ? (
              <View style={styles.examNextBox}>
                <Text style={TYPE.footnote}>{q.explanationEs}</Text>
                <Button
                  label={examIdx >= PLACEMENT_QUESTIONS.length - 1 ? 'Revelar mi nivel de islas' : 'Siguiente pregunta'}
                  icon="arrow-forward"
                  variant="gold"
                  onPress={() => next(false)}
                />
              </View>
            ) : null}
          </Reveal>
        ) : (
          <Reveal index={0} style={styles.openStepWrap}>
            <Badge
              label={result ? `Nivel deducido · ${result.scorePercent}%` : `Nivel seleccionado · ${level}`}
              bg="#FFF6E0"
              color={THEME.gold}
              icon="trophy"
            />
            <Pet3D config={pet} stage="egg" growth={0.6} mood="happy" size={190} backgroundColor="transparent" />
            <Text style={styles.openCanvasTitle}>
              {CEFR_LEVEL_META[level].titleEs} ({LEVEL_DIFFICULTY_ES[level]})
            </Text>
            <Text style={styles.openCanvasSubtitle}>Hemos preparado las islas de nivel {level} para ti y {pet.name}.</Text>
            <View style={[ui.rowWrap, { justifyContent: 'center' }]}>
              {CEFR_LEVELS.map((l) => (
                <Chip key={l} label={`${l} · ${LEVEL_DIFFICULTY_ES[l]}`} active={level === l} onPress={() => onChangeLevel(l)} />
              ))}
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <PressableScale onPress={() => onFinish(level)} scaleTo={0.96} style={[styles.primaryToonCta, SHADOW.float]}>
              <Text style={styles.primaryToonCtaText}>Entrar a mis Islas {level}</Text>
              <Ionicons name="rocket" size={18} color="#FFFFFF" />
            </PressableScale>
          </Reveal>
        )}
      </ScrollView>
    </View>
  );
}
