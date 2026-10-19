import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  buildUnitQuiz,
  getUnit,
  isStepUnlocked,
  LISTENING_PROFILES,
  QUIZ_PASS,
  seededShuffle,
  unitActivityId,
  unitQuestionBank,
  unitsForLevel,
  unitStars,
  UNIT_STEPS,
  type Unit,
  type UnitLesson,
  type UnitQuestion,
  type UnitStep,
} from '@lingopulse/shared';
import { Text } from '../i18n';
import { useAppState } from '../context/AppStateContext';
import { useGame, type UnitQuizResult } from '../context/GameContext';
import { OptionButton } from '../components/MultipleChoice';
import { PressableScale, Reveal } from '../components/motion';
import { RecorderPanel, type RecorderOutput } from '../components/RecorderPanel';
import { Badge, Body, Button, Card, Eyebrow, Muted, ProgressBar, ScreenHeader, Title, ui } from '../components/ui';
import { playSfx } from '../services/sfx';
import { Pet3D } from '../components/Pet3D';
import { SCENE_META, unitSceneTheme } from '../game/unitScenes';
import { speakEnglishPhrase, speakSequence, stopSpeaking } from '../services/speech';
import { THEME, TYPE } from '../theme/colors';
import { ListeningScreen } from './ListeningScreen';
import { ReadingScreen } from './ReadingScreen';
import { SpeakingScreen } from './SpeakingScreen';
import { WritingScreen } from './WritingScreen';

const STEP_META: Record<UnitStep, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  vocab: { label: 'Vocabulario', icon: 'book', color: '#007AFF' },
  grammar: { label: 'Gramática', icon: 'construct', color: '#7B5CFF' },
  functions: { label: 'Situaciones', icon: 'chatbubbles', color: '#0EA5A0' },
  reading: { label: 'Reading', icon: 'newspaper', color: '#18A86B' },
  listening: { label: 'Listening', icon: 'headset', color: '#6A4DFF' },
  speaking: { label: 'Speaking', icon: 'mic', color: '#FF375F' },
  writing: { label: 'Writing', icon: 'create', color: '#FF851B' },
  quiz: { label: 'Quiz final', icon: 'trophy', color: '#D99B26' },
};

const spanishSupport = (u: Unit) => u.level === 'A1' || u.level === 'A2';

function nextStepOf(step: UnitStep): UnitStep | null {
  const i = UNIT_STEPS.indexOf(step);
  return i >= 0 && i < UNIT_STEPS.length - 1 ? UNIT_STEPS[i + 1]! : null;
}

function Speaker({ text }: { text: string }) {
  const { locale } = useAppState();
  return (
    <PressableScale onPress={() => speakEnglishPhrase(text, locale)} hapticKind="light" style={styles.speaker}>
      <Ionicons name="volume-high" size={16} color={THEME.blue} />
    </PressableScale>
  );
}

/** Pregunta de opción múltiple con explicación al responder. */
function Question({
  q,
  index,
  picked,
  onPick,
}: {
  q: UnitQuestion;
  index?: number;
  picked: number | undefined;
  onPick: (i: number) => void;
}) {
  const answered = picked !== undefined;
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.q}>
        {index !== undefined ? <Text style={{ color: THEME.ink3 }}>{index + 1}  </Text> : null}
        {q.q}
      </Text>
      {q.opts.map((opt, i) => (
        <OptionButton
          key={`${opt}-${i}`}
          label={opt}
          disabled={answered}
          state={!answered ? 'idle' : i === q.a ? (i === picked ? 'right' : 'reveal') : i === picked ? 'wrong' : 'idle'}
          onPress={() => onPick(i)}
        />
      ))}
      {answered && q.why ? <Muted>💡 {q.why}</Muted> : null}
    </View>
  );
}

/* ------------------------------ Vocabulario ------------------------------ */

function VocabStep({ unit, onDone, done }: { unit: Unit; onDone: () => void; done: boolean }) {
  const showEs = spanishSupport(unit);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  // Una pregunta de significado por palabra, de 4 palabras distintas.
  const check = useMemo(
    () => seededShuffle(unitQuestionBank(unit).filter((q) => /^(¿Qué significa|Which word matches)/.test(q.q)), unit.id).slice(0, 4),
    [unit]
  );
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const allAnswered = Object.keys(answers).length === check.length;
  return (
    <View style={{ gap: 12 }}>
      <Card tone="blue">
        <Eyebrow icon="school" color={THEME.blue}>Teoría · paso 1</Eyebrow>
        <Body>
          {showEs
            ? 'Lee cada palabra, escúchala y repítela en voz alta. Fíjate en el ejemplo: así se usa de verdad.'
            : 'Read each word, listen to it and repeat it out loud. Pay attention to the example sentence.'}
        </Body>
      </Card>
      {unit.vocab.map((v, i) => (
        <Reveal key={v.term} index={Math.min(i, 8)}>
          <Card style={{ gap: 6 }}>
            <View style={ui.rowBetween}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.term}>{v.term}</Text>
                <Text style={styles.meta}>
                  {v.pos}
                  {v.ipa ? `  ·  ${v.ipa}` : ''}
                </Text>
              </View>
              <Speaker text={v.term} />
            </View>
            {showEs || revealed[v.term] ? (
              <Text style={styles.es}>🇪🇸 {v.es}</Text>
            ) : (
              <Pressable onPress={() => setRevealed((r) => ({ ...r, [v.term]: true }))}>
                <Text style={styles.link}>Ver traducción</Text>
              </Pressable>
            )}
            <Body>{v.def}</Body>
            <View style={styles.example}>
              <Text style={styles.exampleText}>“{v.ex}”</Text>
              <Speaker text={v.ex} />
            </View>
          </Card>
        </Reveal>
      ))}
      <Card style={{ gap: 14 }}>
        <Eyebrow icon="flash">Repaso rápido</Eyebrow>
        {check.map((q, i) => (
          <Question key={q.q} q={q} index={i} picked={answers[i]} onPick={(opt) => setAnswers((a) => ({ ...a, [i]: opt }))} />
        ))}
      </Card>
      <Button
        label={done ? 'Ir a la gramática' : 'Ya lo entendí → Gramática'}
        icon="arrow-forward"
        disabled={!allAnswered && !done}
        onPress={onDone}
      />
    </View>
  );
}

/* ------------------------------- Gramática ------------------------------- */

function GrammarStep({ unit, onDone, done }: { unit: Unit; onDone: () => void; done: boolean }) {
  const g = unit.grammar;
  const items = g.practice.slice(0, 4);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const allAnswered = Object.keys(picked).length === items.length;
  const correct = items.filter((it, i) => picked[i] === it.a).length;
  return (
    <View style={{ gap: 12 }}>
      <Card tone="purple" style={{ gap: 8 }}>
        <Eyebrow icon="school" color={THEME.violet}>Teoría · paso 2</Eyebrow>
        <Title>{g.title}</Title>
        {g.explain.map((p, i) => (
          <Body key={i}>{p}</Body>
        ))}
      </Card>
      <Card style={{ gap: 6 }}>
        <Eyebrow icon="grid">Forma</Eyebrow>
        {g.form.map((row) => (
          <View key={row} style={styles.formRow}>
            <Text style={styles.formText}>{row}</Text>
          </View>
        ))}
      </Card>
      <Card style={{ gap: 8 }}>
        <Eyebrow icon="chatbubbles">Ejemplos</Eyebrow>
        {g.examples.map((ex) => (
          <View key={ex} style={styles.example}>
            <Text style={styles.exampleText}>{ex}</Text>
            <Speaker text={ex} />
          </View>
        ))}
      </Card>
      {g.watchOut ? (
        <Card tone="coral" style={{ gap: 6 }}>
          <Eyebrow icon="warning" color={THEME.red}>Ojo con este error</Eyebrow>
          <Body>{g.watchOut}</Body>
        </Card>
      ) : null}
      <Card style={{ gap: 14 }}>
        <Eyebrow icon="pencil">Práctica guiada</Eyebrow>
        {items.map((it, i) => {
          const answered = picked[i] !== undefined;
          return (
            <View key={it.q} style={{ gap: 8 }}>
              <Text style={styles.q}>
                <Text style={{ color: THEME.ink3 }}>{i + 1}  </Text>
                {it.q}
              </Text>
              <View style={ui.rowWrap}>
                {it.opts.map((opt) => (
                  <View key={opt} style={{ minWidth: 92, flexGrow: 1 }}>
                    <OptionButton
                      label={opt}
                      disabled={answered}
                      state={!answered ? 'idle' : opt === it.a ? (picked[i] === opt ? 'right' : 'reveal') : picked[i] === opt ? 'wrong' : 'idle'}
                      onPress={() => setPicked((p) => ({ ...p, [i]: opt }))}
                    />
                  </View>
                ))}
              </View>
              {answered && it.why ? <Muted>💡 {it.why}</Muted> : null}
            </View>
          );
        })}
        {allAnswered ? <Badge label={`${correct}/${items.length} correctas`} icon="checkmark-done" color={THEME.green} bg="#EDFAF3" /> : null}
      </Card>
      <Button
        label={done ? 'Ir a las situaciones' : 'Continuar → Situaciones'}
        icon="arrow-forward"
        disabled={!allAnswered && !done}
        onPress={onDone}
      />
    </View>
  );
}

/* ----------------------- Funciones comunicativas ----------------------- */

function LessonCard({ unit, lesson, onAnswered }: { unit: Unit; lesson: UnitLesson; onAnswered: () => void }) {
  const { locale } = useAppState();
  const profile = LISTENING_PROFILES[unit.level];
  const [playing, setPlaying] = useState(false);
  const [showScript, setShowScript] = useState(profile.transcript === 'always');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [said, setSaid] = useState<RecorderOutput | null>(null);
  const speakers = useMemo(() => [...new Set(lesson.dialogue.map(([who]) => who))], [lesson]);

  const play = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speakSequence(
      lesson.dialogue.map(([who, text]) => ({ text, voice: speakers.indexOf(who) === 1 ? 1 : 0 })),
      locale,
      {
        rate: profile.rate,
        gapMs: profile.gapMs,
        mixAccents: profile.mixAccents,
        onDone: () => {
          setPlaying(false);
          setShowScript(true);
        },
      }
    );
  };

  return (
    <View style={{ gap: 12 }}>
      <Card tone="ink" style={{ gap: 6 }}>
        <Eyebrow icon="location" color="#0EA5A0">Situación</Eyebrow>
        <Title>{lesson.title}</Title>
        <Text style={styles.es}>{lesson.titleEs}</Text>
        <Body>{lesson.situation}</Body>
      </Card>

      <Card style={{ gap: 8 }}>
        <Eyebrow icon="sparkles">Expresiones clave</Eyebrow>
        {lesson.phrases.map((ph) => (
          <View key={ph.en} style={styles.phraseRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.phraseEn}>{ph.en}</Text>
              <Text style={styles.phraseEs}>{ph.es}</Text>
              {ph.note ? <Muted>💡 {ph.note}</Muted> : null}
            </View>
            <Speaker text={ph.en} />
          </View>
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <View style={ui.rowBetween}>
          <Eyebrow icon="people">Diálogo modelo</Eyebrow>
          <Button label={playing ? 'Detener' : 'Escuchar'} icon={playing ? 'stop' : 'play'} small variant="blue" onPress={play} />
        </View>
        {showScript ? (
          lesson.dialogue.map(([who, text], i) => (
            <View key={i} style={[styles.bubble, speakers.indexOf(who) === 1 && styles.bubbleRight]}>
              <Text style={styles.bubbleWho}>{who}</Text>
              <Text style={styles.bubbleText}>{text}</Text>
            </View>
          ))
        ) : (
          <Muted>Escucha primero; el texto aparece al terminar el audio.</Muted>
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <Eyebrow icon="checkmark-circle">¿Qué dirías?</Eyebrow>
        {lesson.practice.map((q, i) => (
          <Question
            key={q.q}
            q={q}
            index={i}
            picked={answers[i]}
            onPick={(opt) => {
              const next = { ...answers, [i]: opt };
              setAnswers(next);
              if (Object.keys(next).length === lesson.practice.length) onAnswered();
            }}
          />
        ))}
      </Card>

      <Card tone="coral" style={{ gap: 8 }}>
        <Eyebrow icon="mic" color={THEME.red}>Ahora tú</Eyebrow>
        <Body>{lesson.task}</Body>
        <RecorderPanel locale={locale} hint="Grábate diciéndolo con las expresiones de arriba" onResult={setSaid} />
        {said?.transcript ? (
          <View style={styles.example}>
            <Text style={styles.exampleText}>“{said.transcript}”</Text>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

function FunctionsStep({ unit, onDone, done }: { unit: Unit; onDone: () => void; done: boolean }) {
  const lessons = unit.lessons ?? [];
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState<Record<number, boolean>>({});
  const allAnswered = lessons.every((_, i) => answered[i]);
  const lesson = lessons[idx];
  if (!lesson) return null;
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 8 }}>
        <Eyebrow icon="chatbubbles" color="#0EA5A0">Situaciones de la vida diaria · paso 3</Eyebrow>
        <Muted>Practica {lessons.length} situaciones del tema. Responde cada una para continuar.</Muted>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {lessons.map((l, i) => (
            <PressableScale
              key={l.title}
              hapticKind="select"
              onPress={() => setIdx(i)}
              style={[styles.railItem, i === idx && { borderColor: '#0EA5A0', backgroundColor: '#FFFFFF' }]}
            >
              <View style={[styles.railIcon, { backgroundColor: answered[i] ? THEME.green : '#0EA5A0' }]}>
                {answered[i] ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : <Text style={styles.railNum}>{i + 1}</Text>}
              </View>
              <Text style={[styles.railLabel, i === idx && { color: THEME.ink }]} numberOfLines={1}>
                {l.titleEs}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>
      </Card>
      <LessonCard key={`${unit.id}-${idx}`} unit={unit} lesson={lesson} onAnswered={() => setAnswered((a) => ({ ...a, [idx]: true }))} />
      {idx + 1 < lessons.length ? (
        <Button label="Siguiente situación" icon="arrow-forward" variant="secondary" onPress={() => setIdx(idx + 1)} />
      ) : null}
      <Button
        label={done ? 'Ir al reading' : 'Terminé las situaciones → Reading'}
        icon="arrow-forward"
        disabled={!allAnswered && !done}
        onPress={onDone}
      />
    </View>
  );
}

/* --------------------- Reading / Listening / Speaking / Writing --------------------- */

/** Las habilidades se hacen dentro de la isla: la pantalla de cada una va incrustada aquí. */
function SkillStep({
  unit,
  step,
  done,
  onNext,
}: {
  unit: Unit;
  step: 'reading' | 'listening' | 'speaking' | 'writing';
  done: boolean;
  onNext: () => void;
}) {
  const id = unitActivityId(unit.id, step);
  const meta = STEP_META[step];
  const n = UNIT_STEPS.indexOf(step) + 1;
  return (
    <View style={{ gap: 12 }}>
      <Card style={{ gap: 6 }}>
        <View style={ui.rowBetween}>
          <Eyebrow icon={meta.icon} color={meta.color}>
            {meta.label} · paso {n}
          </Eyebrow>
          {done ? <Badge label="Hecho" icon="checkmark-circle" color={THEME.green} bg="#EDFAF3" /> : null}
        </View>
        {step === 'listening' ? (
          <Badge label={LISTENING_PROFILES[unit.level].labelEs} icon="speedometer-outline" color={THEME.violet} bg="#F3EEFF" />
        ) : null}
        {step === 'speaking' || step === 'writing' ? (
          <Muted>Usa el vocabulario, la gramática y las expresiones de la isla. Este paso da la 3.ª estrella ⭐</Muted>
        ) : null}
      </Card>
      {step === 'reading' ? <ReadingScreen passageId={id} embedded /> : null}
      {step === 'listening' ? <ListeningScreen trackId={id} embedded /> : null}
      {step === 'speaking' ? <SpeakingScreen topicId={id} embedded /> : null}
      {step === 'writing' ? <WritingScreen promptId={id} embedded /> : null}
      {done ? (
        <Reveal index={0}>
          <Button label={`Continuar → ${STEP_META[nextStepOf(step) ?? 'quiz'].label}`} icon="arrow-forward" variant="success" onPress={onNext} />
        </Reveal>
      ) : null}
    </View>
  );
}

/* -------------------------------- Quiz final -------------------------------- */

function QuizStep({ unit }: { unit: Unit }) {
  const { finishUnitQuiz, goBack } = useGame();
  const [attempt, setAttempt] = useState(0);
  const quiz = useMemo(() => buildUnitQuiz(unit, attempt), [unit, attempt]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | undefined>(undefined);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<(UnitQuizResult & { score: number }) | null>(null);
  const q = quiz[idx]!;

  const next = () => {
    const nowCorrect = correct + (picked === q.a ? 1 : 0);
    if (idx + 1 < quiz.length) {
      setCorrect(nowCorrect);
      setIdx(idx + 1);
      setPicked(undefined);
      return;
    }
    const score = Math.round((nowCorrect / quiz.length) * 100);
    const r = finishUnitQuiz(unit.id, `Isla: ${unit.title}`, score);
    playSfx(r.passed ? 'fanfare' : 'wrong');
    setCorrect(nowCorrect);
    setResult({ ...r, score });
  };

  if (result) {
    const nextUnit = unitsForLevel(unit.level).find((u) => u.n === unit.n + 1);
    return (
      <Card tone={result.passed ? 'gold' : 'coral'} style={{ gap: 12, alignItems: 'center' }}>
        <Text style={{ fontSize: 44 }}>{result.passed ? '🏝️' : '🌊'}</Text>
        <Title>{result.passed ? (result.conquered ? '¡Isla conquistada!' : '¡Quiz aprobado!') : 'Casi lo logras'}</Title>
        <Text style={styles.bigScore}>{result.score}%</Text>
        <View style={ui.row}>
          {[1, 2, 3].map((s) => (
            <Ionicons key={s} name={s <= result.stars ? 'star' : 'star-outline'} size={34} color={THEME.gold} />
          ))}
        </View>
        {result.bonusCoins ? <Badge label={`+${result.bonusCoins} monedas de bonificación`} icon="cash" color={THEME.gold} bg="#FFFFFF" /> : null}
        <Muted style={{ textAlign: 'center' }}>
          {result.passed
            ? result.stars < 3
              ? 'Saca 90% o más y completa Speaking y Writing para ganar las 3 estrellas.'
              : '¡Perfecto! Tienes las 3 estrellas de esta isla.'
            : `Necesitas ${QUIZ_PASS}% para conquistar la isla. Repasa la teoría y vuelve a intentarlo (las preguntas cambian).`}
        </Muted>
        {result.passed && nextUnit ? (
          <View style={styles.tomorrow}>
            <Ionicons name="moon" size={18} color={THEME.violet} />
            <Text style={[TYPE.callout, { flex: 1 }]}>
              Mañana se abre la isla {nextUnit.n}: “{nextUnit.title}”. Una isla por día para que lo aprendido se quede contigo.
            </Text>
          </View>
        ) : null}
        <View style={[ui.rowWrap, { justifyContent: 'center' }]}>
          <Button
            label="Intentar otra vez"
            icon="refresh"
            variant="secondary"
            onPress={() => {
              setAttempt((a) => a + 1);
              setIdx(0);
              setPicked(undefined);
              setCorrect(0);
              setResult(null);
            }}
          />
          <Button label="Volver al mapa" icon="map" onPress={goBack} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ gap: 14 }}>
      <View style={ui.rowBetween}>
        <Eyebrow icon="trophy" color={THEME.gold}>
          Pregunta {idx + 1} de {quiz.length}
        </Eyebrow>
        <Text style={styles.meta}>Aprobado con {QUIZ_PASS}%</Text>
      </View>
      <ProgressBar value={idx / quiz.length} color={THEME.gold} />
      <Question key={`${attempt}-${idx}`} q={q} picked={picked} onPick={setPicked} />
      <Button label={idx + 1 < quiz.length ? 'Siguiente' : 'Ver resultado'} icon="arrow-forward" disabled={picked === undefined} onPress={next} />
    </Card>
  );
}

/* ------------------------------ Pantalla ------------------------------ */

export function UnitScreen({ unitId }: { unitId: string }) {
  const { progress, goBack, markUnitStep, pet, petStage, petThePet } = useGame();
  const unit = getUnit(unitId);
  const up = progress.units?.[unitId];
  const done = up?.done ?? [];
  const firstPending = UNIT_STEPS.find((s) => !done.includes(s) && isStepUnlocked(s, up)) ?? 'quiz';
  const [step, setStep] = useState<UnitStep>(firstPending);

  if (!unit) {
    return (
      <View style={ui.screen}>
        <ScreenHeader title="Isla no encontrada" onBack={goBack} icon="map" gradient="lesson" />
      </View>
    );
  }

  const sceneTheme = unitSceneTheme(unit.id);
  const sceneMeta = SCENE_META[sceneTheme];
  const stars = unitStars(up);
  const progressRatio = done.filter((s) => s !== 'quiz').length / (UNIT_STEPS.length - 1);
  const complete = (s: UnitStep, nextStep: UnitStep) => {
    markUnitStep(unit.id, s);
    playSfx('correct');
    setStep(nextStep);
  };

  return (
    <View style={ui.screen}>
      <ScreenHeader
        title={`${unit.emoji} ${unit.title}`}
        subtitle={`Isla ${unit.n} · ${unit.level} · ${unit.titleEs}`}
        onBack={goBack}
        icon="map"
        gradient="lesson"
      />

      {/* La isla temática en 3D con la mascota actuando el tema */}
      <View style={styles.islandStage}>
        <Pet3D
          config={pet}
          mood={sceneMeta.action === 'eat' ? 'eating' : sceneMeta.action === 'hug' ? 'love' : 'happy'}
          stage={petStage.stage}
          growth={petStage.progress}
          size={300}
          aspectRatio={0.62}
          scenario={{ theme: sceneTheme, action: sceneMeta.action, npc: sceneMeta.npc }}
          onTap={petThePet}
          backgroundColor="#DDF3FF"
        />
        <View style={styles.islandBubble}>
          <Text style={styles.islandBubbleText}>{sceneMeta.bubbleEn}</Text>
        </View>
      </View>

      <Card style={{ gap: 10 }}>
        <View style={ui.rowBetween}>
          <Eyebrow icon="flag">En esta isla aprenderás a…</Eyebrow>
          <View style={ui.row}>
            {[1, 2, 3].map((s) => (
              <Ionicons key={s} name={s <= stars ? 'star' : 'star-outline'} size={18} color={THEME.gold} />
            ))}
          </View>
        </View>
        {unit.goals.map((g) => (
          <View key={g} style={styles.goalRow}>
            <Ionicons name="checkmark-circle" size={16} color={THEME.green} />
            <Text style={[TYPE.callout, { flex: 1 }]}>{g}</Text>
          </View>
        ))}
        <ProgressBar value={progressRatio} color="#0EA5A0" />
        {done.length === 0 ? (
          <View style={styles.warmUp}>
            <Text style={styles.warmUpLabel}>Para entrar en calor</Text>
            <Body>{unit.warmUp}</Body>
          </View>
        ) : null}
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {UNIT_STEPS.map((s) => {
          const unlocked = isStepUnlocked(s, up);
          const isDone = done.includes(s);
          const active = s === step;
          return (
            <PressableScale
              key={s}
              disabled={!unlocked}
              onPress={() => setStep(s)}
              hapticKind="select"
              style={[
                styles.railItem,
                active && { borderColor: STEP_META[s].color, backgroundColor: '#FFFFFF' },
                !unlocked && { opacity: 0.45 },
              ]}
            >
              <View style={[styles.railIcon, { backgroundColor: isDone ? THEME.green : unlocked ? STEP_META[s].color : THEME.ink3 }]}>
                <Ionicons name={isDone ? 'checkmark' : unlocked ? STEP_META[s].icon : 'lock-closed'} size={14} color="#FFFFFF" />
              </View>
              <Text style={[styles.railLabel, active && { color: THEME.ink }]} numberOfLines={1}>
                {STEP_META[s].label}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      {step === 'vocab' ? <VocabStep unit={unit} done={done.includes('vocab')} onDone={() => complete('vocab', 'grammar')} /> : null}
      {step === 'grammar' ? <GrammarStep unit={unit} done={done.includes('grammar')} onDone={() => complete('grammar', 'functions')} /> : null}
      {step === 'functions' ? <FunctionsStep unit={unit} done={done.includes('functions')} onDone={() => complete('functions', 'reading')} /> : null}
      {step === 'reading' || step === 'listening' || step === 'speaking' || step === 'writing' ? (
        <SkillStep key={step} unit={unit} step={step} done={done.includes(step)} onNext={() => setStep(nextStepOf(step) ?? 'quiz')} />
      ) : null}
      {step === 'quiz' ? <QuizStep unit={unit} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  speaker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  q: { fontSize: 16, fontWeight: '700', color: THEME.ink, lineHeight: 22 },
  term: { fontSize: 22, fontWeight: '800', color: THEME.ink, letterSpacing: -0.4 },
  meta: { fontSize: 12, fontWeight: '600', color: THEME.ink3 },
  es: { fontSize: 15, fontWeight: '700', color: THEME.violet },
  link: { fontSize: 13, fontWeight: '800', color: THEME.blue },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.fill,
    borderRadius: 12,
    padding: 10,
  },
  exampleText: { flex: 1, fontSize: 15, fontStyle: 'italic', color: THEME.ink, lineHeight: 21 },
  formRow: { backgroundColor: '#F5F2FF', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  formText: { fontSize: 15, fontWeight: '700', color: '#4B32C3' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  islandStage: {
    alignItems: 'center',
    backgroundColor: '#DDF3FF',
    borderRadius: 26,
    overflow: 'hidden',
  },
  islandBubble: {
    position: 'absolute',
    top: 12,
    left: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#1E2436',
  },
  islandBubbleText: { fontSize: 13, fontWeight: '800', color: '#1E2436' },
  warmUp: { backgroundColor: '#FFF8EC', borderRadius: 12, padding: 12, gap: 4 },
  warmUpLabel: { fontSize: 12, fontWeight: '800', color: THEME.orange, textTransform: 'uppercase', letterSpacing: 0.6 },
  rail: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: THEME.fill,
  },
  railIcon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  railNum: { fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
  railLabel: { fontSize: 12, fontWeight: '800', color: THEME.ink2, maxWidth: 160 },
  bigScore: { fontSize: 48, fontWeight: '900', color: THEME.ink, letterSpacing: -1 },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.hairline,
  },
  phraseEn: { fontSize: 16, fontWeight: '800', color: THEME.ink },
  phraseEs: { fontSize: 14, color: THEME.ink2 },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    backgroundColor: THEME.fill,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#E6F7F6',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  bubbleWho: { fontSize: 11, fontWeight: '900', color: '#0EA5A0', textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleText: { fontSize: 15, lineHeight: 21, color: THEME.ink },
  tomorrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3EEFF',
    borderRadius: 12,
    padding: 12,
    alignSelf: 'stretch',
  },
});
