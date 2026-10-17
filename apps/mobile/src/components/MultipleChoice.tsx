import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MultipleChoiceQuestion } from '@lingopulse/shared';
import { useOptionalGame } from '../context/GameContext';
import { THEME, TYPE } from '../theme/colors';
import { haptic, PressableScale, usePop, useShake } from './motion';

/** Opción animada: rebota si aciertas, se sacude si fallas y activa la emoción de la mascota. */
export function OptionButton({
  label,
  state,
  onPress,
  disabled,
}: {
  label: string;
  state: 'idle' | 'right' | 'wrong' | 'reveal';
  onPress: () => void;
  disabled?: boolean;
}) {
  const shake = useShake();
  const pop = usePop();
  const game = useOptionalGame();
  const prevState = useRef(state);
  useEffect(() => {
    if (prevState.current === state) return;
    prevState.current = state;
    if (state === 'wrong') {
      shake.shake();
      haptic('error');
      game?.recordQuizOutcome(false);
    }
    if (state === 'right') {
      pop.pop();
      haptic('success');
      game?.recordQuizOutcome(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const tone =
    state === 'right' || state === 'reveal'
      ? styles.right
      : state === 'wrong'
        ? styles.wrong
        : null;
  return (
    <Animated.View style={[shake.style, pop.style]}>
      <PressableScale disabled={disabled} onPress={onPress} hapticKind={null} style={[styles.opt, tone]}>
        <View style={styles.optRow}>
          <Text style={[styles.optText, (state === 'right' || state === 'reveal') && { color: '#1F7A45' }, state === 'wrong' && { color: THEME.red }]}>
            {label}
          </Text>
          {state === 'right' || state === 'reveal' ? (
            <Ionicons name="checkmark-circle" size={20} color={THEME.green} />
          ) : state === 'wrong' ? (
            <Ionicons name="close-circle" size={20} color={THEME.red} />
          ) : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function MultipleChoice({
  index,
  question,
  picked,
  onPick,
}: {
  index: number;
  question: MultipleChoiceQuestion;
  picked: number | undefined;
  onPick: (option: number) => void;
}) {
  const answered = picked !== undefined;
  return (
    <View style={styles.wrap}>
      <Text style={styles.q}>
        <Text style={{ color: THEME.ink3 }}>{index + 1}  </Text>
        {question.question}
      </Text>
      {question.options.map((opt, i) => {
        const isAnswer = i === question.answerIndex;
        const isPicked = i === picked;
        const state = !answered ? 'idle' : isPicked ? (isAnswer ? 'right' : 'wrong') : isAnswer ? 'reveal' : 'idle';
        return <OptionButton key={opt} label={opt} state={state} disabled={answered} onPress={() => onPick(i)} />;
      })}
      {answered ? <Text style={styles.explain}>{question.explanationEn}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: THEME.hairline },
  q: { ...TYPE.headline, lineHeight: 22 },
  opt: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, backgroundColor: THEME.fill },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  right: { backgroundColor: '#E5F7EC' },
  wrong: { backgroundColor: '#FFEAEE' },
  optText: { flex: 1, fontSize: 15, fontWeight: '500', color: THEME.ink },
  explain: { fontSize: 13, color: THEME.ink2, fontStyle: 'italic', lineHeight: 18 },
});
