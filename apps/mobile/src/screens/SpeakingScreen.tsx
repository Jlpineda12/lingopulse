import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../i18n';
import { AiThinking } from '../components/AiThinking';
import { Ionicons } from '@expo/vector-icons';
import {
  alignWords,
  analyzeSpeechFluency,
  getDailyDrop,
  LISTENING_TRACKS,
  SPEAKING_TOPICS,
  type AlignmentResult,
  type CoachFeedback,
  type PronunciationReport,
  type SpeakingTopic,
} from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { AlignmentView, FeedbackView } from '../components/FeedbackView';
import { PronunciationReportView } from '../components/PronunciationReportView';
import { RecorderPanel, type RecorderOutput } from '../components/RecorderPanel';
import { Reveal, ScoreRing } from '../components/motion';
import { Badge, Button, Card, Chip, Eyebrow, ScreenHeader, ui, type IconName } from '../components/ui';
import { playAudioUrl } from '../hooks/useSpeechCapture';
import { getCoachFeedback } from '../services/coach';
import { applyReview } from '../services/transcribe';
import { speakEnglishPhrase } from '../services/speech';
import { THEME, TYPE } from '../theme/colors';

type Mode = 'topic' | 'readaloud';

/**
 * `embedded`: la pantalla vive dentro de una isla (UnitScreen): sin cabecera propia,
 * sin cambiar de tema y sin el modo pronunciación.
 */
export function SpeakingScreen({ topicId, embedded = false }: { topicId?: string; embedded?: boolean }) {
  const { goBack } = useGame();
  const [mode, setMode] = useState<Mode>('topic');
  if (embedded) return <TopicPractice initialTopicId={topicId} embedded />;
  return (
    <View style={ui.screen}>
      <ScreenHeader title="Speaking" subtitle="Habla, grábate y recibe feedback" onBack={goBack} icon="mic" gradient="speaking" />
      <View style={ui.row}>
        <Chip label="Tema libre" icon="chatbubbles" active={mode === 'topic'} onPress={() => setMode('topic')} />
        <Chip label="Pronunciación" icon="pulse" active={mode === 'readaloud'} onPress={() => setMode('readaloud')} />
      </View>
      {mode === 'topic' ? <TopicPractice initialTopicId={topicId} /> : <ReadAloudPractice />}
    </View>
  );
}

function TopicPractice({ initialTopicId, embedded = false }: { initialTopicId?: string; embedded?: boolean }) {
  const { locale } = useAppState();
  const { progress, completeActivity } = useGame();
  const initial =
    SPEAKING_TOPICS.find((t) => t.id === initialTopicId) ??
    SPEAKING_TOPICS.find((t) => t.level === progress.level) ??
    SPEAKING_TOPICS[0]!;
  const [topic, setTopic] = useState<SpeakingTopic>(initial);
  const [question, setQuestion] = useState(initial.promptEn);
  const [recording, setRecording] = useState<RecorderOutput | null>(null);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [recorderKey, setRecorderKey] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const attemptRef = useRef(0);

  const say = (t: string) => speakEnglishPhrase(t, locale);
  const fluency = useMemo(
    () => (recording && !recording.typed ? analyzeSpeechFluency(transcript || '', recording.metrics) : null),
    [recording, transcript]
  );

  const reset = () => {
    attemptRef.current += 1;
    setReviewing(false);
    setRecording(null);
    setTranscript('');
    setFeedback(null);
    setRecorderKey((k) => k + 1);
  };

  const nextTopic = () => {
    const sameLevel = SPEAKING_TOPICS.filter((t) => t.level === topic.level);
    const pool = sameLevel.length > 1 ? sameLevel : SPEAKING_TOPICS;
    const next = pool[(pool.indexOf(topic) + 1) % pool.length]!;
    setTopic(next);
    setQuestion(next.promptEn);
    reset();
  };

  const analyze = async () => {
    if (!recording) return;
    setLoading(true);
    const fb = await getCoachFeedback({
      skill: 'speaking',
      level: topic.level,
      promptEn: question,
      text: transcript.trim(),
      targetWords: topic.targetWords,
      minWords: Math.round(topic.suggestedSeconds * 1.2),
      // Solo hay métricas acústicas reales si se grabó con el micrófono.
      audio: recording.typed ? undefined : recording.metrics,
      pronunciation: recording.typed ? null : recording.pronunciation,
    });
    setFeedback(fb);
    setLoading(false);
    completeActivity({
      kind: 'speaking',
      title: topic.title,
      refId: topic.id,
      score: fb.overallScore,
      speakingSec: recording.typed ? 0 : recording.metrics.voicedMs / 1000,
    });
  };

  return (
    <View style={{ gap: 14 }}>
      <Reveal index={0}>
        <Card>
          <View style={ui.rowBetween}>
            <Badge label={`Tema · ${topic.level}`} color={THEME.red} bg="#FFF0F3" icon="chatbubbles" />
            {embedded ? null : <Button label="Otro tema" small variant="secondary" icon="shuffle" onPress={nextTopic} />}
          </View>
          <Text style={TYPE.title1}>{topic.title}</Text>
          <Text style={[TYPE.body, { fontWeight: '500' }]}>{question}</Text>
          <View style={ui.row}>
            <Button label="Escuchar pregunta" icon="volume-high" small variant="blue" onPress={() => say(question)} />
          </View>
          {question === topic.promptEn ? (
            <>
              <Text style={[TYPE.caption, { marginTop: 4 }]}>Ideas para tu respuesta</Text>
              {topic.guidingQuestions.map((q) => (
                <View key={q} style={styles.bulletRow}>
                  <View style={styles.dot} />
                  <Text style={styles.bullet}>{q}</Text>
                </View>
              ))}
              <Text style={[TYPE.caption, { marginTop: 4 }]}>Frases útiles</Text>
              <View style={ui.rowWrap}>
                {topic.usefulPhrases.map((p) => (
                  <Badge key={p} label={p} color={THEME.ink} bg={THEME.fill} />
                ))}
              </View>
            </>
          ) : null}
          <Text style={[TYPE.caption, { marginTop: 4 }]}>Intenta usar · bonus</Text>
          <View style={ui.rowWrap}>
            {topic.targetWords.map((w) => {
              const used = feedback?.targetWordsUsed.includes(w);
              return (
                <Badge
                  key={w}
                  label={w}
                  icon={used ? 'checkmark-circle' : 'add-circle-outline'}
                  color={used ? THEME.green : THEME.violet}
                  bg={used ? '#EAF8EF' : '#F3F0FF'}
                />
              );
            })}
          </View>
        </Card>
      </Reveal>

      {!recording ? (
        <Reveal index={1}>
          <Card>
            <RecorderPanel
              key={recorderKey}
              locale={locale}
              targetSeconds={topic.suggestedSeconds}
              hint={`Habla unos ${topic.suggestedSeconds} segundos`}
              onResult={(out) => {
                const attempt = ++attemptRef.current;
                setRecording(out);
                setTranscript(out.transcript);
                if (!out.review) return;
                // La revisión de IA llega después: afina la pronunciación y trae la transcripción literal.
                setReviewing(true);
                out.review.then((review) => {
                  if (attempt !== attemptRef.current) return;
                  setReviewing(false);
                  if (!review) return;
                  setRecording((prev) => {
                    if (!prev) return prev;
                    const pronunciation = applyReview(prev.pronunciation, review);
                    return {
                      ...prev,
                      pronunciation,
                      metrics: { ...prev.metrics, assessedPronunciation: pronunciation?.pronScore ?? prev.metrics.assessedPronunciation },
                    };
                  });
                  // Solo se reemplaza el texto si el usuario no lo editó mientras tanto.
                  if (review.transcript) setTranscript((t) => (t === out.transcript ? review.transcript : t));
                });
              }}
            />
          </Card>
        </Reveal>
      ) : (
        <Reveal index={0}>
          <Card>
            <View style={ui.rowBetween}>
              <Eyebrow icon="headset">Tu respuesta</Eyebrow>
              {recording.audioUrl ? (
                <Button label="Reproducir" icon="play" small variant="secondary" onPress={() => playAudioUrl(recording.audioUrl!)} />
              ) : null}
            </View>
            <Text style={TYPE.footnote}>
              {recording.typed
                ? 'Texto escrito (sin métricas de audio).'
                : transcript
                  ? 'Transcripción automática. Corrígela si se entendió mal alguna palabra.'
                  : 'Tu audio se grabó y ya está medido. Escucha la grabación y escribe lo que dijiste para analizar gramática y vocabulario.'}
            </Text>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              multiline
              placeholder="Type what you said…"
              placeholderTextColor={THEME.ink3}
              style={[ui.input, { minHeight: 90 }]}
            />

            {fluency ? (
              <View style={styles.metrics}>
                <Metric icon="time-outline" label="Duración" value={`${Math.round(recording.metrics.durationMs / 1000)} s`} />
                <Metric icon="speedometer-outline" label="Palabras/min" value={transcript ? String(fluency.wpm) : '—'} />
                <Metric icon="pause-circle-outline" label="Pausas" value={String(fluency.pauseCount)} />
                <Metric icon="mic-outline" label="Con voz" value={`${Math.round(recording.metrics.voicedMs / 1000)} s`} />
                <Metric icon="chatbubble-ellipses-outline" label="Muletillas" value={transcript ? String(fluency.fillers.total) : '—'} />
                <Metric
                  icon="sparkles-outline"
                  label="Claridad"
                  value={fluency.pronunciationScore !== null ? `${fluency.pronunciationScore}%` : '—'}
                />
              </View>
            ) : null}

            {recording.pronunciation ? (
              <PronunciationReportView report={recording.pronunciation} locale={locale} reviewing={reviewing} />
            ) : null}

            {!feedback ? (
              <View style={ui.row}>
                <Button
                  label={loading ? 'Analizando…' : 'Analizar respuesta'}
                  icon="sparkles"
                  onPress={analyze}
                  disabled={loading || transcript.trim().split(/\s+/).length < 3}
                  style={{ flex: 1 }}
                />
                <Button label="Repetir" icon="refresh" variant="secondary" onPress={reset} disabled={loading} />
              </View>
            ) : null}
            {loading ? <AiThinking label="Analizando con IA" /> : null}
          </Card>
        </Reveal>
      )}

      {feedback ? (
        <>
          <FeedbackView feedback={feedback} onSpeak={say} />
          <View style={ui.row}>
            <Button label="Otra vez" variant="secondary" icon="refresh" onPress={reset} style={{ flex: 1 }} />
            {feedback.followUpQuestion ? (
              <Button
                label="Siguiente pregunta"
                icon="chatbubble-ellipses"
                onPress={() => {
                  setQuestion(feedback.followUpQuestion);
                  reset();
                  say(feedback.followUpQuestion);
                }}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={16} color={THEME.ink2} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ReadAloudPractice() {
  const { locale } = useAppState();
  const { todayKey, completeActivity, progress } = useGame();
  const sentences = useMemo(() => {
    const drop = getDailyDrop(todayKey, progress.level);
    return [...drop.items.map((i) => i.examples[0]!).filter(Boolean), ...LISTENING_TRACKS.filter((t) => t.level === progress.level).flatMap((t) => t.dictation)];
  }, [todayKey, progress.level]);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState<AlignmentResult | null>(null);
  const [pron, setPron] = useState<PronunciationReport | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const attemptRef = useRef(0);
  const [noTranscript, setNoTranscript] = useState(false);
  const [attempts, setAttempts] = useState<number[]>([]);
  const [rewarded, setRewarded] = useState(false);
  const sentence = sentences[idx % sentences.length]!;

  const onResult = (out: RecorderOutput) => {
    const attempt = ++attemptRef.current;
    setPron(out.pronunciation);
    setReviewing(!!out.review);
    out.review?.then((review) => {
      if (attempt !== attemptRef.current) return;
      setReviewing(false);
      setPron((prev) => applyReview(prev, review));
    });
    if (!out.transcript && !out.pronunciation) {
      setNoTranscript(true);
      setResult(null);
      return;
    }
    setNoTranscript(false);
    const r = alignWords(sentence, out.transcript);
    setResult(r);
    // Con Azure, el puntaje es la pronunciación real medida en el audio; si no, la coincidencia de palabras.
    const next = [...attempts, out.pronunciation ? out.pronunciation.pronScore : r.accuracy];
    setAttempts(next);
    if (next.length >= 3 && !rewarded) {
      setRewarded(true);
      completeActivity({
        kind: 'speaking',
        title: 'Pronunciación: lectura en voz alta',
        score: Math.round(next.reduce((a, b) => a + b, 0) / next.length),
        speakingSec: next.length * 4,
      });
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Reveal index={0} key={idx}>
        <Card>
          <Eyebrow icon="pulse">
            Frase {(idx % sentences.length) + 1} de {sentences.length}
          </Eyebrow>
          <Text style={styles.sentence}>{sentence}</Text>
          <View style={ui.row}>
            <Button label="Escuchar" icon="volume-high" small variant="blue" onPress={() => speakEnglishPhrase(sentence, locale)} />
            <Button
              label="Lento"
              icon="speedometer-outline"
              small
              variant="secondary"
              onPress={() => speakEnglishPhrase(sentence, locale, { rate: 0.7 })}
            />
          </View>
          <Text style={TYPE.footnote}>Escucha el modelo y léela en voz alta. Comparo palabra por palabra lo que se entendió.</Text>
        </Card>
      </Reveal>
      <Card>
        <RecorderPanel key={idx} locale={locale} hint="Lee la frase en voz alta" onResult={onResult} referenceText={sentence} />
        {noTranscript ? (
          <Text style={TYPE.footnote}>
            Tu audio se grabó, pero el servidor de IA no está disponible. Revisa la conexión o la configuración del servidor
            (ver README) para puntuar la pronunciación.
          </Text>
        ) : null}
      </Card>
      {result ? (
        <Reveal index={0}>
          <Card>
            <View style={ui.rowBetween}>
              {pron ? (
                <Text style={TYPE.headline}>Tu pronunciación</Text>
              ) : (
                <ScoreRing score={result.accuracy} size={72} stroke={8} label="precisión" />
              )}
              <Button
                label="Siguiente"
                small
                icon="arrow-forward"
                onPress={() => {
                  setIdx((i) => i + 1);
                  setResult(null);
                  setPron(null);
                  setReviewing(false);
                  attemptRef.current += 1;
                }}
              />
            </View>
            {pron ? <PronunciationReportView report={pron} locale={locale} reviewing={reviewing} /> : <AlignmentView result={result} />}
            <Text style={TYPE.footnote}>
              Intentos: {attempts.map((a) => `${a}%`).join(' · ')}
              {attempts.length < 3 ? ` · ${3 - attempts.length} más para completar la actividad` : ' · actividad completada'}
            </Text>
          </Card>
        </Reveal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: THEME.red },
  bullet: { flex: 1, fontSize: 15, lineHeight: 21, color: THEME.ink },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: {
    flexGrow: 1,
    width: '30%',
    backgroundColor: THEME.fill,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 3,
  },
  metricValue: { fontSize: 19, fontWeight: '600', color: THEME.ink, fontVariant: ['tabular-nums'] },
  metricLabel: { fontSize: 11, fontWeight: '500', color: THEME.ink2 },
  sentence: { fontSize: 24, lineHeight: 32, fontWeight: '600', color: THEME.ink, letterSpacing: -0.4 },
});
