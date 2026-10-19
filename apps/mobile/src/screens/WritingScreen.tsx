import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../i18n';
import { AiThinking } from '../components/AiThinking';
import {
  countWords,
  findTargetWordsUsed,
  WRITING_PROMPTS,
  type CoachFeedback,
  type WritingPrompt,
} from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { FeedbackView } from '../components/FeedbackView';
import { Badge, Body, Button, Card, Chip, Eyebrow, Muted, ProgressBar, ScreenHeader, ui } from '../components/ui';
import { getCoachFeedback } from '../services/coach';
import { speakEnglishPhrase } from '../services/speech';
import { COLORS } from '../theme/colors';

export function WritingScreen({
  promptId,
  custom,
}: {
  promptId?: string;
  custom?: { title: string; promptEn: string };
}) {
  const { goBack, completeActivity, progress } = useGame();
  const { locale } = useAppState();
  const initial: WritingPrompt = custom
    ? {
        id: 'custom',
        level: progress.level,
        emoji: '',
        type: 'opinion',
        title: custom.title,
        promptEn: custom.promptEn,
        instructionsEs: 'Da tu opinión con al menos una razón y un ejemplo.',
        minWords: 50,
        targetWords: ['in my opinion', 'however', 'for example'],
        checklist: ['Opinión clara', 'Una razón', 'Un ejemplo', 'Conclusión'],
      }
    : WRITING_PROMPTS.find((p) => p.id === promptId) ?? WRITING_PROMPTS[1]!;
  const [prompt, setPrompt] = useState<WritingPrompt>(initial);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const words = countWords(text);
  const usedTargets = findTargetWordsUsed(text, prompt.targetWords);

  const submit = async () => {
    setLoading(true);
    const fb = await getCoachFeedback({
      skill: 'writing',
      level: prompt.level,
      promptEn: prompt.promptEn,
      text,
      targetWords: prompt.targetWords,
      minWords: prompt.minWords,
    });
    setFeedback(fb);
    setLoading(false);
    if (attempt === 0) completeActivity({ kind: 'writing', title: prompt.title, score: fb.overallScore });
    setAttempt((a) => a + 1);
  };

  return (
    <View style={ui.screen}>
      <ScreenHeader title={prompt.title} subtitle={`Writing · ${prompt.type} · ${prompt.level}`} onBack={goBack} icon="create" gradient="writing" />

      <Card tone="amber">
        <Eyebrow color={COLORS.amber} icon="document-text">Consigna</Eyebrow>
        <Body style={{ fontWeight: '800' }}>{prompt.promptEn}</Body>
        <Muted>{prompt.instructionsEs}</Muted>
        <View style={ui.rowWrap}>
          {prompt.checklist.map((c) => (
            <Badge key={c} label={`☐ ${c}`} color={COLORS.inkSecondary} bg="#FFFFFF" />
          ))}
        </View>
        <Text style={styles.label}>Vocabulario sugerido</Text>
        <View style={ui.rowWrap}>
          {prompt.targetWords.map((w) => {
            const used = usedTargets.includes(w);
            return (
              <Chip
                key={w}
                label={`${used ? '✓ ' : '+ '}${w}`}
                active={used}
                color={COLORS.emerald}
                onPress={used ? undefined : () => setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}${w} `)}
              />
            );
          })}
        </View>
      </Card>

      <Card>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Start writing in English…"
          placeholderTextColor={COLORS.inkMuted}
          style={[ui.input, { minHeight: 180 }]}
          autoCorrect={false}
          spellCheck={false}
        />
        <View style={ui.rowBetween}>
          <Muted>
            {words} / {prompt.minWords} palabras
          </Muted>
          <Muted>{usedTargets.length}/{prompt.targetWords.length} palabras objetivo</Muted>
        </View>
        <ProgressBar value={words / prompt.minWords} color={words >= prompt.minWords ? COLORS.emerald : COLORS.amber} />
        <Button
          label={loading ? 'Corrigiendo…' : feedback ? 'Volver a corregir' : 'Corregir mi texto'}
          icon="sparkles"
          onPress={submit}
          disabled={loading || words < 5}
        />
        {loading ? <AiThinking /> : null}
        {words > 0 && words < 5 ? <Muted>Escribe al menos 5 palabras para recibir correcciones.</Muted> : null}
      </Card>

      {feedback ? (
        <>
          <FeedbackView feedback={feedback} onSpeak={(t) => speakEnglishPhrase(t, locale)} />
          <View style={ui.row}>
            <Button
              label="Reescribir con correcciones"
              variant="secondary"
              icon="pencil"
              onPress={() => {
                setText(feedback.correctedText);
                setFeedback(null);
              }}
              style={{ flex: 1 }}
            />
            <Button
              label="Otra consigna"
              icon="shuffle"
              onPress={() => {
                const pool = WRITING_PROMPTS.filter((p) => p.id !== prompt.id);
                setPrompt(pool[Math.floor(Math.random() * pool.length)]!);
                setText('');
                setFeedback(null);
                setAttempt(0);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '800', color: COLORS.inkMuted, textTransform: 'uppercase' },
});
