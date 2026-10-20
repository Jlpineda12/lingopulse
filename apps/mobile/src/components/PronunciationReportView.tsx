import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { Ionicons } from '@expo/vector-icons';
import {
  effectiveWordAccuracy,
  phonemeInfo,
  pronunciationBand,
  weakestPhoneme,
  weakWords,
  type PronunciationReport,
  type PronunciationWord,
  type SupportedLocale,
} from '@lingopulse/shared';
import { AnimatedBar, PressableScale, ScoreRing } from './motion';
import { speakNeural } from '../services/neuralTts';
import { THEME, TYPE } from '../theme/colors';

const BAND_STYLE = {
  good: { bg: '#E9FAF0', border: '#22B567', text: '#167A45' },
  ok: { bg: '#FFF6E0', border: '#F5A623', text: '#9A6200' },
  bad: { bg: '#FFECEF', border: '#FF375F', text: '#C2183F' },
} as const;

function wordStyle(w: PronunciationWord) {
  if (w.errorType === 'Omission') return { bg: THEME.fill, border: THEME.ink3, text: THEME.ink3 };
  return BAND_STYLE[pronunciationBand(effectiveWordAccuracy(w))];
}

/** Retroalimentación hablada en inglés, con tono alegre y las palabras a pulir como modelo. */
function feedbackSpeech(report: PronunciationReport): string {
  const score = Math.round(report.pronScore);
  const opener =
    score >= 85 ? `Awesome! Your pronunciation score is ${score}.` : score >= 65 ? `Nice work! You got ${score}.` : `Good try! You got ${score}, and we can make it better together.`;
  const toPolish = weakWords(report, 3)
    .filter((w) => w.errorType !== 'Omission')
    .map((w) => w.word.replace(/[^A-Za-z'-]/g, ''))
    .filter(Boolean);
  if (!toPolish.length) return `${opener} Every word sounded clear. Keep it up!`;
  const list = toPolish.map((w) => `"${w}"`).join(', ');
  return `${opener} Let's polish ${list}. Listen: ${toPolish.join('... ')}. Now you try!`;
}

/**
 * Reporte de pronunciación (Azure): puntaje global, sub-puntajes, palabras coloreadas
 * y detalle por sonido con consejo en español al tocar una palabra.
 */
export function PronunciationReportView({
  report,
  locale,
  reviewing = false,
}: {
  report: PronunciationReport;
  locale: SupportedLocale;
  /** La revisión detallada con IA todavía está en camino. */
  reviewing?: boolean;
}) {
  const words = useMemo(() => report.words.filter((w) => w.word.trim()), [report.words]);
  // Abre en la palabra peor pronunciada (con consejo de sonido); si no hay, en la primera omitida.
  const firstWeak = useMemo(() => {
    const weak = weakWords(report, 8);
    return weak.find((w) => w.errorType !== 'Omission') ?? weak[0] ?? null;
  }, [report]);
  const [selected, setSelected] = useState<PronunciationWord | null>(firstWeak);

  const bars: Array<[string, number | null]> = [
    ['Precisión', report.accuracy],
    ['Fluidez', report.fluency],
    ['Entonación', report.prosody],
    ['Completitud', report.completeness],
  ];

  const weak = selected ? weakestPhoneme(selected) : null;
  const tip = weak ? phonemeInfo(weak.phoneme) : null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.sourceTag, report.approximate && styles.sourceTagApprox]}>
        <Ionicons name={report.approximate ? 'sparkles' : 'analytics'} size={13} color={report.approximate ? '#7A4DFF' : THEME.green} />
        <Text style={[styles.sourceText, { color: report.approximate ? '#7A4DFF' : '#167A45' }]}>
          {report.approximate
            ? 'Estimación de IA (Gemini) · aproximada'
            : report.reviewedBy
              ? 'Medición acústica (Azure) + revisión de IA'
              : 'Medición acústica (Azure) · precisa'}
        </Text>
      </View>
      {reviewing ? (
        <View style={styles.reviewing}>
          <Ionicons name="ear-outline" size={15} color="#6A4DFF" />
          <Text style={styles.reviewingText}>La IA está escuchando sonido por sonido para afinar el resultado…</Text>
        </View>
      ) : null}
      <PressableScale onPress={() => void speakNeural(feedbackSpeech(report), locale, { style: 'cheerful' })} hapticKind="light" style={styles.feedbackBtn}>
        <Ionicons name="volume-high" size={16} color="#FFFFFF" />
        <Text style={styles.feedbackBtnText}>Escuchar mi retroalimentación</Text>
      </PressableScale>
      <View style={styles.top}>
        <ScoreRing score={report.pronScore} size={78} stroke={8} label="pronunc." />
        <View style={{ flex: 1, gap: 6 }}>
          {bars
            .filter(([, v]) => v !== null)
            .map(([label, v]) => (
              <View key={label} style={{ gap: 2 }}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>{label}</Text>
                  <Text style={styles.barValue}>{v}</Text>
                </View>
                <AnimatedBar
                  value={(v as number) / 100}
                  colors={(v as number) >= 80 ? ['#5EDB8F', '#22B567'] : (v as number) >= 60 ? ['#FFD36B', '#F5A623'] : ['#FF8FA3', '#FF375F']}
                  height={6}
                />
              </View>
            ))}
        </View>
      </View>

      <Text style={TYPE.caption}>Toca una palabra para ver cómo mejorarla</Text>
      <View style={styles.words}>
        {words.map((w, i) => {
          const st = wordStyle(w);
          const active = selected === w;
          return (
            <PressableScale key={`${w.word}-${i}`} onPress={() => setSelected(w)} hapticKind="select">
              <View
                style={[
                  styles.word,
                  { backgroundColor: st.bg, borderColor: active ? THEME.ink : st.border },
                  active && { borderWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.wordText,
                    { color: st.text },
                    w.errorType === 'Omission' && { textDecorationLine: 'line-through' },
                  ]}
                >
                  {w.word}
                </Text>
              </View>
            </PressableScale>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Legend color={BAND_STYLE.good.border} label="Bien" />
        <Legend color={BAND_STYLE.ok.border} label="Casi" />
        <Legend color={BAND_STYLE.bad.border} label="Repite" />
        {report.scripted ? <Legend color={THEME.ink3} label="Omitida" /> : null}
      </View>

      {selected ? (
        <View style={styles.detail}>
          <View style={styles.detailHead}>
            <Text style={styles.detailWord}>{selected.word}</Text>
            <Text style={styles.detailScore}>
              {selected.errorType === 'Omission' ? 'no se escuchó' : `${effectiveWordAccuracy(selected)}/100`}
            </Text>
            <View style={{ flex: 1 }} />
            <PressableScale onPress={() => void speakNeural(selected.word, locale, { style: 'friendly' })} hapticKind="light" style={styles.listen}>
              <Ionicons name="volume-high" size={16} color={THEME.blue} />
            </PressableScale>
            <PressableScale
              onPress={() => void speakNeural(selected.word, locale, { style: 'calm', rate: 0.65 })}
              hapticKind="light"
              style={styles.listen}
            >
              <Ionicons name="speedometer-outline" size={16} color={THEME.blue} />
            </PressableScale>
          </View>
          {selected.phonemes.length ? (
            <View style={styles.phonemes}>
              {selected.phonemes.map((p, i) => {
                const st = BAND_STYLE[pronunciationBand(p.accuracy)];
                return (
                  <View key={`${p.phoneme}-${i}`} style={[styles.phoneme, { backgroundColor: st.bg, borderColor: st.border }]}>
                    <Text style={[styles.phonemeText, { color: st.text }]}>/{p.ipa}/</Text>
                    <Text style={styles.phonemeScore}>{p.accuracy}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
          {tip?.tipEs ? (
            <Text style={styles.tip}>
              <Text style={{ fontWeight: '900' }}>Sonido /{tip.ipa}/</Text>
              {tip.example ? ` (como en "${tip.example}")` : ''}: {tip.tipEs}
              {selected.tipEs ? `\n${selected.tipEs}` : ''}
            </Text>
          ) : selected.tipEs ? (
            <Text style={styles.tip}>{selected.tipEs}</Text>
          ) : selected.errorType === 'Omission' ? (
            <Text style={styles.tip}>Esta palabra no se escuchó. Léela completa, sin comértela.</Text>
          ) : (
            <Text style={styles.tip}>¡Bien pronunciada! Escúchala en lento si quieres pulirla.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  feedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: THEME.blue,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  feedbackBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  wrap: { gap: 12 },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E9FAF0',
  },
  sourceTagApprox: { backgroundColor: '#F1ECFF' },
  sourceText: { fontSize: 11, fontWeight: '800' },
  reviewing: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  reviewingText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#6A4DFF' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontSize: 12, fontWeight: '700', color: THEME.ink2 },
  barValue: { fontSize: 12, fontWeight: '900', color: THEME.ink, fontVariant: ['tabular-nums'] },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5 },
  wordText: { fontSize: 15, fontWeight: '800' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '700', color: THEME.ink2 },
  detail: { backgroundColor: THEME.fill, borderRadius: 16, padding: 12, gap: 10 },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailWord: { fontSize: 20, fontWeight: '900', color: THEME.ink },
  detailScore: { fontSize: 13, fontWeight: '800', color: THEME.ink2 },
  listen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonemes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phoneme: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1.5 },
  phonemeText: { fontSize: 15, fontWeight: '900' },
  phonemeScore: { fontSize: 10, fontWeight: '800', color: THEME.ink2 },
  tip: { fontSize: 14, lineHeight: 20, color: THEME.ink },
});
