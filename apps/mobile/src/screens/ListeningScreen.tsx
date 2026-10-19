import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../i18n';
import {
  alignWords,
  LISTENING_TRACKS,
  type AlignmentResult,
  type ListeningTrack,
} from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { AlignmentView } from '../components/FeedbackView';
import { MultipleChoice } from '../components/MultipleChoice';
import { Badge, Body, Button, Card, Chip, Eyebrow, Muted, ScreenHeader, ui } from '../components/ui';
import { speakSequence, stopSpeaking } from '../services/speech';
import { COLORS } from '../theme/colors';

const SPEEDS = [
  { label: '0.75×', rate: 0.72 },
  { label: '1×', rate: 0.95 },
  { label: '1.15×', rate: 1.12 },
];

export function ListeningScreen({ trackId }: { trackId?: string }) {
  const { goBack, completeActivity } = useGame();
  const { locale } = useAppState();
  const [track, setTrack] = useState<ListeningTrack>(
    LISTENING_TRACKS.find((t) => t.id === trackId) ?? LISTENING_TRACKS[0]!
  );
  const [rate, setRate] = useState(0.95);
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [dictIdx, setDictIdx] = useState(0);
  const [dictText, setDictText] = useState('');
  const [dictResults, setDictResults] = useState<AlignmentResult[]>([]);
  const [finished, setFinished] = useState(false);

  const play = () => {
    setPlaying(true);
    setPlays((p) => p + 1);
    speakSequence(
      track.segments.map((s) => ({ text: s.text, voice: s.speaker === 'B' ? 1 : 0 })),
      locale,
      { rate, onDone: () => setPlaying(false) }
    );
  };

  const correct = track.questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const allAnswered = Object.keys(answers).length === track.questions.length;
  const dictationSentence = track.dictation[dictIdx];
  const dictAvg = dictResults.length
    ? Math.round(dictResults.reduce((a, r) => a + r.accuracy, 0) / dictResults.length)
    : 0;

  const finish = () => {
    const qScore = (correct / track.questions.length) * 100;
    const score = dictResults.length ? Math.round(qScore * 0.6 + dictAvg * 0.4) : Math.round(qScore);
    completeActivity({ kind: 'listening', title: track.title, score });
    setFinished(true);
  };

  const switchTrack = (t: ListeningTrack) => {
    stopSpeaking();
    setTrack(t);
    setPlays(0);
    setShowTranscript(false);
    setAnswers({});
    setDictIdx(0);
    setDictText('');
    setDictResults([]);
    setFinished(false);
  };

  return (
    <View style={ui.screen}>
      <ScreenHeader title={track.title} subtitle={`Listening · ${track.level}`} onBack={goBack} icon="headset" gradient="listening" />

      <Card tone="purple">
        <Eyebrow color={COLORS.purple} icon="information-circle">Contexto</Eyebrow>
        <Body>{track.contextEs}</Body>
        <View style={ui.rowWrap}>
          {SPEEDS.map((s) => (
            <Chip key={s.label} label={s.label} icon="speedometer-outline" active={rate === s.rate} onPress={() => setRate(s.rate)} />
          ))}
        </View>
        <View style={ui.row}>
          <Button
            label={playing ? 'Detener' : plays ? 'Escuchar otra vez' : 'Reproducir audio'}
            icon={playing ? 'stop' : 'play'}
            onPress={() => {
              if (playing) {
                stopSpeaking();
                setPlaying(false);
              } else play();
            }}
            style={{ flex: 1 }}
          />
        </View>
        <Muted>Reproducciones: {plays} · Consejo: escucha la primera vez sin leer.</Muted>
        <Pressable onPress={() => setShowTranscript((v) => !v)}>
          <Text style={styles.link}>{showTranscript ? 'Ocultar transcripción' : 'Mostrar transcripción'}</Text>
        </Pressable>
        {showTranscript ? (
          <View style={styles.transcript}>
            {track.segments.map((s, i) => (
              <Text key={i} style={styles.transcriptLine}>
                {s.speaker !== 'Narrator' ? <Text style={styles.speaker}>{s.speaker}: </Text> : null}
                {s.text}
              </Text>
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <Eyebrow icon="help-circle">Comprensión</Eyebrow>
        {track.questions.map((q, i) => (
          <MultipleChoice
            key={`${track.id}-${i}`}
            index={i}
            question={q}
            picked={answers[i]}
            onPick={(opt) => setAnswers((a) => ({ ...a, [i]: opt }))}
          />
        ))}
        {allAnswered ? (
          <Badge
            label={`${correct}/${track.questions.length} correctas`}
            color={correct === track.questions.length ? COLORS.emerald : COLORS.accentBlue}
            bg={correct === track.questions.length ? COLORS.emeraldSoftBg : COLORS.accentSoftBg}
          />
        ) : null}
      </Card>

      <Card>
        <Eyebrow icon="keypad">Dictado {Math.min(dictIdx + 1, track.dictation.length)}/{track.dictation.length}</Eyebrow>
        {dictationSentence ? (
          <>
            <Muted>Escucha la frase y escríbela exactamente.</Muted>
            <View style={ui.row}>
              <Button label="Escuchar frase" icon="volume-high" small variant="blue" onPress={() => speakSequence([{ text: dictationSentence }], locale, { rate })} />
              <Button label="Lento" icon="speedometer-outline" small variant="secondary" onPress={() => speakSequence([{ text: dictationSentence }], locale, { rate: 0.65 })} />
            </View>
            <TextInput
              value={dictText}
              onChangeText={setDictText}
              placeholder="Type what you hear…"
              placeholderTextColor={COLORS.inkMuted}
              style={[ui.input, { minHeight: 60 }]}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {dictResults[dictIdx] ? (
              <>
                <Text style={styles.accuracy}>{dictResults[dictIdx]!.accuracy}% correcto</Text>
                <AlignmentView result={dictResults[dictIdx]!} />
                <Button
                  label={dictIdx + 1 < track.dictation.length ? 'Siguiente frase' : 'Terminar dictado'}
                  small
                  onPress={() => {
                    setDictIdx((d) => d + 1);
                    setDictText('');
                  }}
                />
              </>
            ) : (
              <Button
                label="Comprobar"
                disabled={!dictText.trim()}
                onPress={() =>
                  setDictResults((r) => {
                    const copy = [...r];
                    copy[dictIdx] = alignWords(dictationSentence, dictText);
                    return copy;
                  })
                }
              />
            )}
          </>
        ) : (
          <Text style={styles.accuracy}>Promedio de dictado: {dictAvg}% ✓</Text>
        )}
      </Card>

      {!finished ? (
        <Button
          label="Terminar y guardar progreso"
          variant="success"
          icon="flag"
          disabled={!allAnswered}
          onPress={finish}
        />
      ) : (
        <Card tone="green">
          <Text style={styles.done}>Listening completado</Text>
          <Muted>Prueba otro audio:</Muted>
          <View style={ui.rowWrap}>
            {LISTENING_TRACKS.filter((t) => t.id !== track.id).map((t) => (
              <Chip key={t.id} label={t.title} icon="headset" onPress={() => switchTrack(t)} />
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 13, fontWeight: '800', color: COLORS.accentBlue },
  transcript: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, gap: 6 },
  transcriptLine: { fontSize: 15, lineHeight: 22, color: COLORS.inkPrimary },
  speaker: { fontWeight: '900', color: COLORS.purple },
  accuracy: { fontSize: 18, fontWeight: '900', color: COLORS.inkPrimary },
  done: { fontSize: 17, fontWeight: '900', color: '#047857' },
});
