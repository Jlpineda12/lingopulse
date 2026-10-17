import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AlignmentResult, CoachFeedback } from '@lingopulse/shared';
import { THEME, TYPE } from '../theme/colors';
import { AnimatedBar, Reveal, ScoreRing, scoreGradient } from './motion';
import { Badge, Body, Card, Eyebrow, Muted, ui, type IconName } from './ui';

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: IconName }> = {
  grammar: { label: 'Gramática', color: THEME.red, bg: '#FFF0F3', icon: 'construct' },
  spelling: { label: 'Ortografía', color: THEME.orange, bg: '#FFF6E8', icon: 'text' },
  vocabulary: { label: 'Vocabulario', color: THEME.violet, bg: '#F3F0FF', icon: 'book' },
  punctuation: { label: 'Puntuación', color: THEME.ink2, bg: THEME.fill, icon: 'ellipsis-horizontal' },
  style: { label: 'Estilo', color: THEME.blue, bg: '#EAF3FF', icon: 'brush' },
};

const SCORE_LABELS: Array<[keyof CoachFeedback['scores'], string]> = [
  ['grammar', 'Gramática'],
  ['vocabulary', 'Vocabulario'],
  ['coherence', 'Coherencia'],
  ['task', 'Tarea'],
  ['fluency', 'Fluidez'],
  ['pronunciation', 'Claridad'],
];

function SpeakLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={ui.row}>
      <Ionicons name="volume-high" size={15} color={THEME.blue} />
      <Text style={styles.link}>Escuchar</Text>
    </Pressable>
  );
}

export function FeedbackView({ feedback, onSpeak }: { feedback: CoachFeedback; onSpeak?: (text: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  const corrections = showAll ? feedback.corrections : feedback.corrections.slice(0, 5);
  let i = 0;

  return (
    <View style={{ gap: 14 }}>
      <Reveal index={i++}>
        <Card>
          <View style={[ui.row, { gap: 16 }]}>
            <ScoreRing score={feedback.overallScore} size={96} label="de 100" />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={ui.rowWrap}>
                <Badge label={`Nivel ${feedback.cefrEstimate}`} color={THEME.gold} bg={THEME.goldLight} icon="ribbon" />
                <Badge
                  label={feedback.source === 'claude' ? 'Coach IA' : 'Motor local'}
                  icon={feedback.source === 'claude' ? 'sparkles' : 'hardware-chip-outline'}
                />
              </View>
              <Text style={TYPE.subhead}>{feedback.summaryEs}</Text>
            </View>
          </View>
          <View style={{ gap: 10, marginTop: 4 }}>
            {SCORE_LABELS.map(([key, label]) => {
              const value = feedback.scores[key];
              if (value === undefined || value === null) return null;
              return (
                <View key={key} style={{ gap: 5 }}>
                  <View style={ui.rowBetween}>
                    <Text style={styles.scoreLabel}>{label}</Text>
                    <Text style={styles.scoreValue}>{value}</Text>
                  </View>
                  <AnimatedBar value={value / 100} colors={scoreGradient(value)} height={6} />
                </View>
              );
            })}
          </View>
        </Card>
      </Reveal>

      <Reveal index={i++}>
        {feedback.corrections.length > 0 ? (
          <Card>
            <Eyebrow icon="create">Correcciones · {feedback.corrections.length}</Eyebrow>
            {corrections.map((c, idx) => {
              const meta = TYPE_META[c.type] ?? TYPE_META.grammar!;
              return (
                <Reveal key={`${c.original}-${idx}`} index={idx} from={8}>
                  <View style={styles.correction}>
                    <Badge label={meta.label} color={meta.color} bg={meta.bg} icon={meta.icon} />
                    <Text style={styles.correctionLine}>
                      <Text style={styles.wrong}>{c.original}</Text>
                      <Text style={styles.arrow}>   →   </Text>
                      <Text style={styles.right}>{c.corrected}</Text>
                    </Text>
                    <Text style={styles.explainEn}>{c.explanationEn}</Text>
                    <Text style={styles.explainEs}>{c.explanationEs}</Text>
                  </View>
                </Reveal>
              );
            })}
            {feedback.corrections.length > 5 ? (
              <Pressable onPress={() => setShowAll((v) => !v)}>
                <Text style={styles.link}>
                  {showAll ? 'Ver menos' : `Ver las ${feedback.corrections.length} correcciones`}
                </Text>
              </Pressable>
            ) : null}
          </Card>
        ) : (
          <Card tone="green">
            <View style={ui.row}>
              <Ionicons name="checkmark-circle" size={22} color={THEME.green} />
              <Text style={styles.allGood}>Sin errores detectados. Excelente trabajo.</Text>
            </View>
          </Card>
        )}
      </Reveal>

      {feedback.correctedText && feedback.corrections.length > 0 ? (
        <Reveal index={i++}>
          <Card tone="blue">
            <View style={ui.rowBetween}>
              <Eyebrow color={THEME.blue} icon="document-text">Tu texto corregido</Eyebrow>
              {onSpeak ? <SpeakLink onPress={() => onSpeak(feedback.correctedText)} /> : null}
            </View>
            <Body>{feedback.correctedText}</Body>
          </Card>
        </Reveal>
      ) : null}

      {(feedback.strengths.length > 0 || feedback.improvements.length > 0) && (
        <Reveal index={i++}>
          <Card>
            {feedback.strengths.length > 0 && (
              <View style={{ gap: 8 }}>
                <Eyebrow color={THEME.green} icon="trending-up">Lo que hiciste bien</Eyebrow>
                {feedback.strengths.map((s, k) => (
                  <View key={k} style={styles.bulletRow}>
                    <Ionicons name="checkmark" size={16} color={THEME.green} style={{ marginTop: 2 }} />
                    <Text style={styles.bullet}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
            {feedback.improvements.length > 0 && (
              <View style={{ gap: 8, marginTop: 6 }}>
                <Eyebrow color={THEME.orange} icon="locate">Para mejorar</Eyebrow>
                {feedback.improvements.map((s, k) => (
                  <View key={k} style={styles.bulletRow}>
                    <Ionicons name="arrow-forward" size={15} color={THEME.orange} style={{ marginTop: 2 }} />
                    <Text style={styles.bullet}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </Reveal>
      )}

      {feedback.vocabularyUpgrades.length > 0 && (
        <Reveal index={i++}>
          <Card tone="purple">
            <Eyebrow color={THEME.violet} icon="rocket">Sube de nivel tu vocabulario</Eyebrow>
            {feedback.vocabularyUpgrades.map((u, k) => (
              <View key={k} style={{ gap: 2 }}>
                <Text style={styles.correctionLine}>
                  <Text style={{ color: THEME.ink2 }}>{u.original}</Text>
                  <Text style={styles.arrow}>   →   </Text>
                  <Text style={{ color: THEME.violet, fontWeight: '600' }}>{u.better}</Text>
                </Text>
                <Muted>{u.why}</Muted>
              </View>
            ))}
          </Card>
        </Reveal>
      )}

      {feedback.modelAnswer ? (
        <Reveal index={i++}>
          <Card tone="gold">
            <View style={ui.rowBetween}>
              <Eyebrow color={THEME.gold} icon="star">Versión mejorada</Eyebrow>
              {onSpeak ? <SpeakLink onPress={() => onSpeak(feedback.modelAnswer)} /> : null}
            </View>
            <Body>{feedback.modelAnswer}</Body>
          </Card>
        </Reveal>
      ) : null}

      {feedback.followUpQuestion ? (
        <Reveal index={i++}>
          <Card>
            <Eyebrow icon="chatbubble-ellipses">Siguiente pregunta</Eyebrow>
            <Text style={[TYPE.headline, { fontSize: 18 }]}>{feedback.followUpQuestion}</Text>
          </Card>
        </Reveal>
      ) : null}
    </View>
  );
}

/** Texto de referencia coloreado según lo que dijiste/escribiste. */
export function AlignmentView({ result }: { result: AlignmentResult }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.wordWrap}>
        {result.ops.map((op, k) => {
          if (op.kind === 'match')
            return (
              <Text key={k} style={[styles.word, op.close ? styles.wordClose : styles.wordOk]}>
                {op.ref}
              </Text>
            );
          if (op.kind === 'substitution')
            return (
              <Text key={k} style={[styles.word, styles.wordBad]}>
                {op.ref} <Text style={styles.heard}>({op.hyp})</Text>
              </Text>
            );
          if (op.kind === 'missing')
            return (
              <Text key={k} style={[styles.word, styles.wordMissing]}>
                {op.ref}
              </Text>
            );
          return (
            <Text key={k} style={[styles.word, styles.wordExtra]}>
              +{op.hyp}
            </Text>
          );
        })}
      </View>
      <View style={ui.rowWrap}>
        <Legend color="#DDF6E6" label="Correcta" />
        <Legend color="#FFF1D6" label="Casi" />
        <Legend color="#FFE3E8" label="Se entendió otra" />
        <Legend color={THEME.fill2} label="Faltó" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={ui.row}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
      <Text style={{ fontSize: 11, color: THEME.ink2 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreLabel: { fontSize: 13, fontWeight: '500', color: THEME.ink2 },
  scoreValue: { fontSize: 13, fontWeight: '600', color: THEME.ink, fontVariant: ['tabular-nums'] },
  correction: { gap: 6, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: THEME.hairline },
  correctionLine: { fontSize: 16, lineHeight: 23 },
  wrong: { color: THEME.red, textDecorationLine: 'line-through', fontWeight: '500' },
  arrow: { color: THEME.ink3 },
  right: { color: THEME.green, fontWeight: '600' },
  explainEn: { fontSize: 14, color: THEME.ink, lineHeight: 20 },
  explainEs: { fontSize: 13, color: THEME.ink2, lineHeight: 18 },
  link: { fontSize: 14, fontWeight: '500', color: THEME.blue },
  allGood: { fontSize: 15, fontWeight: '600', color: '#1F8A4C' },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bullet: { flex: 1, fontSize: 15, lineHeight: 21, color: THEME.ink },
  wordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { fontSize: 16, fontWeight: '500', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  wordOk: { backgroundColor: '#DDF6E6', color: '#1F7A45' },
  wordClose: { backgroundColor: '#FFF1D6', color: '#9A5B00' },
  wordBad: { backgroundColor: '#FFE3E8', color: '#C4183C' },
  wordMissing: { backgroundColor: THEME.fill2, color: THEME.ink3, textDecorationLine: 'line-through' },
  wordExtra: { backgroundColor: THEME.fill, color: THEME.ink3, fontStyle: 'italic' },
  heard: { fontSize: 12, fontWeight: '500', color: '#C4183C' },
});
