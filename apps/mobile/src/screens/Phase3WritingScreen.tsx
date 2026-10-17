import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { WritingEvaluationResult } from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useOptionalGame } from '../context/GameContext';
import { submitWritingPhase } from '../services/api';
import { COLORS } from '../theme/colors';

export function Phase3WritingScreen() {
  const {
    lesson,
    locale,
    speakWithPip,
    markPhaseCompleted,
    setActiveStep,
    setPipMessage,
  } = useAppState();
  const game = useOptionalGame();

  const { writing } = lesson.publicContent;
  const [text, setText] = useState('');
  const [evaluation, setEvaluation] = useState<WritingEvaluationResult | null>(
    null
  );

  const handleEvaluate = async () => {
    const res = await submitWritingPhase({ locale, text });
    setEvaluation(res);
    markPhaseCompleted('writing');

    if (res.targetUsed === 'correct') {
      game?.recordQuizOutcome(true);
      setPipMessage(
        '¡Escritura impecable! Usaste "put off" con la sintaxis correcta. ¡Vamos al Voice Arena!'
      );
    } else if (res.targetUsed === 'incorrect_grammar') {
      game?.recordQuizOutcome(false);
      setPipMessage(
        '¡Casi! Detecté "put off", pero recuerda ubicar el pronombre en medio: "put it off".'
      );
    } else {
      game?.recordQuizOutcome(false);
      setPipMessage(
        'Tu mensaje se entiende, pero revisa las reformulaciones Casual y Profesional con "put off".'
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseBadgeText}>FASE 3 · WRITING (3 MIN)</Text>
        </View>

        <Text style={styles.title}>Producción Escrita Contextual</Text>
        <Text style={styles.recipientTag}>Para: {writing.recipientName}</Text>

        <View style={styles.promptBox}>
          <Text style={styles.promptText}>{writing.scenarioPrompt}</Text>
          <Text style={styles.checklistText}>
            ✓ {writing.grammarChecklistEs}
          </Text>
        </View>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={writing.placeholderEn}
          placeholderTextColor={COLORS.inkMuted}
          multiline
          style={styles.textInput}
        />

        {/* Botones rápidos para probar los 3 escenarios del motor de evaluación */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsLabel}>
            Probar casos de evaluación (1 clic):
          </Text>
          <View style={styles.presetsRow}>
            <Pressable
              onPress={() =>
                setText(
                  "Hi Jordan, since Sam is delayed, let's put it off until Friday morning."
                )
              }
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}> Uso canónico (put it off)</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setText(
                  "Hi Jordan, Sam cannot attend today so let's put off it until Friday."
                )
              }
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>
                Error de pronombre (put off it)
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                setText(
                  "Hi Jordan, let's postpone the meeting until Friday because Sam is stuck."
                )
              }
              style={styles.presetChip}
            >
              <Text style={styles.presetChipText}>
                Paráfrasis válida (postpone)
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={handleEvaluate} style={styles.submitBtn}>
          <Text style={styles.submitBtnText}>
            Evaluar Writing y Ver Reformulaciones
          </Text>
        </Pressable>

        {evaluation && (
          <View style={styles.resultBox}>
            <View style={styles.statusRow}>
              <Text style={styles.statusTitle}>
                {evaluation.targetUsed === 'correct'
                  ? 'Objetivo y Gramática Correctos'
                  : evaluation.targetUsed === 'incorrect_grammar'
                    ? 'Objetivo Detectado · Ajuste Gramatical'
                    : 'Intención Resuelta · Falta Objetivo Léxico'}
              </Text>
              <Text style={styles.dialectPill}>
                {evaluation.locale === 'en-GB' ? '🇬🇧 UK' : '🇺🇸 US'}
              </Text>
            </View>

            <Text style={styles.explanationText}>
              {evaluation.explanationEs}
            </Text>

            <View style={styles.correctionBox}>
              <Text style={styles.subLabel}>Corrección sugerida:</Text>
              <Text style={styles.correctedSentence}>
                “{evaluation.correctedSentenceEn}”
              </Text>
            </View>

            {/* Dos reformulaciones exigidas en el backlog P0: Casual y Profesional */}
            <Text style={styles.subLabel}>
              2 Reformulaciones ({evaluation.locale}):
            </Text>

            <Pressable
              onPress={() => speakWithPip(evaluation.reformulations.casual)}
              style={styles.reformulationCard}
            >
              <Text style={styles.reformTag}>1. CASUAL / SLACK · tocar para escuchar</Text>
              <Text style={styles.reformText}>
                “{evaluation.reformulations.casual}”
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                speakWithPip(evaluation.reformulations.professional)
              }
              style={styles.reformulationCard}
            >
              <Text style={styles.reformTag}>2. PROFESIONAL / EMAIL · tocar para escuchar</Text>
              <Text style={styles.reformText}>
                “{evaluation.reformulations.professional}”
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveStep('voice')}
              style={styles.arenaNextBtn}
            >
              <Text style={styles.arenaNextBtnText}>
                Entrar a Fase 4: Voice Arena →
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 14,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoftBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentBlue,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.inkPrimary,
  },
  recipientTag: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkMuted,
    marginTop: -8,
  },
  promptBox: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 6,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.inkPrimary,
    fontWeight: '600',
  },
  checklistText: {
    fontSize: 12,
    color: COLORS.accentBlue,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 12,
    minHeight: 84,
    fontSize: 14,
    color: COLORS.inkPrimary,
    textAlignVertical: 'top',
  },
  presetsSection: {
    gap: 6,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: COLORS.accentSoftBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentBlue,
  },
  submitBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  resultBox: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.inkPrimary,
  },
  dialectPill: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentBlue,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkPrimary,
  },
  correctionBox: {
    backgroundColor: COLORS.emeraldSoftBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.inkSecondary,
    textTransform: 'uppercase',
  },
  correctedSentence: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  reformulationCard: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 4,
  },
  reformTag: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accentBlue,
  },
  reformText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.inkPrimary,
    lineHeight: 19,
  },
  arenaNextBtn: {
    marginTop: 4,
    backgroundColor: COLORS.inkPrimary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  arenaNextBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
