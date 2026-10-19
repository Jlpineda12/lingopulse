import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { Ionicons } from '@expo/vector-icons';
import { READING_PASSAGES, type ReadingPassage } from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { MultipleChoice } from '../components/MultipleChoice';
import { Badge, Body, Button, Card, Chip, Eyebrow, Muted, ScreenHeader, ui } from '../components/ui';
import { speakEnglishPhrase } from '../services/speech';
import { COLORS } from '../theme/colors';

type Piece = { text: string; term?: string };

/** Divide un párrafo resaltando los términos del glosario (el más largo primero). */
function splitByGlossary(paragraph: string, terms: string[]): Piece[] {
  const sorted = [...terms].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return [{ text: paragraph }];
  const re = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const pieces: Piece[] = [];
  let last = 0;
  for (const m of paragraph.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) pieces.push({ text: paragraph.slice(last, idx) });
    const term = sorted.find((t) => t.toLowerCase() === m[0].toLowerCase()) ?? m[0];
    pieces.push({ text: m[0], term });
    last = idx + m[0].length;
  }
  if (last < paragraph.length) pieces.push({ text: paragraph.slice(last) });
  return pieces;
}

export function ReadingScreen({ passageId }: { passageId?: string }) {
  const { goBack, completeActivity, openScreen } = useGame();
  const { locale } = useAppState();
  const [passage, setPassage] = useState<ReadingPassage>(
    READING_PASSAGES.find((p) => p.id === passageId) ?? READING_PASSAGES[0]!
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [readSeconds, setReadSeconds] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(Date.now());

  const terms = Object.keys(passage.glossary);
  const wordCount = useMemo(() => passage.paragraphs.join(' ').split(/\s+/).length, [passage]);
  const wpm = readSeconds ? Math.round(wordCount / (readSeconds / 60)) : null;
  const correct = passage.questions.filter((q, i) => answers[i] === q.answerIndex).length;
  const allAnswered = Object.keys(answers).length === passage.questions.length;

  const switchPassage = (p: ReadingPassage) => {
    setPassage(p);
    setSelected(null);
    setAnswers({});
    setReadSeconds(null);
    setFinished(false);
    startedAt.current = Date.now();
  };

  return (
    <View style={ui.screen}>
      <ScreenHeader title={passage.title} subtitle={`Reading · ${passage.level} · ${wordCount} palabras`} onBack={goBack} icon="reader" gradient="reading" />

      <Card>
        <Eyebrow color={COLORS.emerald} icon="reader">Lectura</Eyebrow>
        <Text style={styles.title}>{passage.title}</Text>
        <Muted>Toca las palabras subrayadas para ver su significado en inglés.</Muted>
        {passage.paragraphs.map((para, pi) => (
          <View key={pi} style={{ gap: 4 }}>
            <Text style={styles.paragraph}>
              {splitByGlossary(para, terms).map((piece, i) =>
                piece.term ? (
                  <Text
                    key={i}
                    onPress={() => setSelected(piece.term!)}
                    style={[styles.term, selected === piece.term && styles.termActive]}
                  >
                    {piece.text}
                  </Text>
                ) : (
                  <Text key={i}>{piece.text}</Text>
                )
              )}
            </Text>
            <Pressable onPress={() => speakEnglishPhrase(para, locale)}>
              <View style={ui.row}>
                <Ionicons name="volume-high" size={14} color={COLORS.accentBlue} />
                <Text style={styles.listen}>Escuchar párrafo</Text>
              </View>
            </Pressable>
          </View>
        ))}
        {selected ? (
          <View style={styles.gloss}>
            <Text style={styles.glossTerm}>
              {selected}{' '}
              <Ionicons name="volume-high" size={16} color="#065F46" onPress={() => speakEnglishPhrase(selected, locale)} />
            </Text>
            <Text style={styles.glossDef}>{passage.glossary[selected]}</Text>
          </View>
        ) : null}
        {readSeconds === null ? (
          <Button
            label="Terminé de leer"
            icon="checkmark"
            variant="success"
            onPress={() => setReadSeconds(Math.max(5, (Date.now() - startedAt.current) / 1000))}
          />
        ) : (
          <Badge
            icon="timer-outline"
            label={`${Math.round(readSeconds)} s · ${wpm} palabras/min${wpm && wpm >= 200 ? ' — ¡lectura rápida!' : ''}`}
            color={COLORS.emerald}
            bg={COLORS.emeraldSoftBg}
          />
        )}
      </Card>

      {readSeconds !== null ? (
        <Card>
          <Eyebrow icon="help-circle">Comprensión</Eyebrow>
          {passage.questions.map((q, i) => (
            <MultipleChoice
              key={`${passage.id}-${i}`}
              index={i}
              question={q}
              picked={answers[i]}
              onPick={(opt) => setAnswers((a) => ({ ...a, [i]: opt }))}
            />
          ))}
          {allAnswered && !finished ? (
            <Button
              label={`Guardar resultado (${correct}/${passage.questions.length})`}
              variant="success"
              icon="flag"
              onPress={() => {
                completeActivity({
                  kind: 'reading',
                  title: passage.title,
                  refId: passage.id,
                  score: Math.round((correct / passage.questions.length) * 100),
                });
                setFinished(true);
              }}
            />
          ) : null}
        </Card>
      ) : null}

      {finished ? (
        <>
          <Card tone="amber">
            <Eyebrow color={COLORS.amber} icon="create">Ahora tu opinión</Eyebrow>
            <Body style={{ fontWeight: '700' }}>{passage.discussionPrompt}</Body>
            <Button
              label="Responder por escrito y recibir correcciones"
              icon="create"
              onPress={() =>
                openScreen({
                  name: 'writing',
                  custom: { title: passage.title, promptEn: passage.discussionPrompt },
                })
              }
            />
          </Card>
          <Card>
            <Muted>Otras lecturas:</Muted>
            <View style={ui.rowWrap}>
              {READING_PASSAGES.filter((p) => p.id !== passage.id && p.level === passage.level).slice(0, 8).map((p) => (
                <Chip key={p.id} label={p.title} icon="reader" onPress={() => switchPassage(p)} />
              ))}
            </View>
          </Card>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '900', color: COLORS.inkPrimary },
  paragraph: { fontSize: 17, lineHeight: 27, color: COLORS.inkPrimary },
  term: {
    color: '#047857',
    fontWeight: '700',
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
  termActive: { backgroundColor: COLORS.emeraldSoftBg },
  listen: { fontSize: 12, fontWeight: '700', color: COLORS.accentBlue },
  gloss: {
    backgroundColor: COLORS.emeraldSoftBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  glossTerm: { fontSize: 16, fontWeight: '900', color: '#065F46' },
  glossDef: { fontSize: 14, color: '#065F46' },
});
