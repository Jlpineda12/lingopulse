import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppState } from '../context/AppStateContext';
import { useOptionalGame } from '../context/GameContext';
import { checkInputComprehension } from '../services/api';
import { COLORS } from '../theme/colors';

export function Phase2InputScreen() {
  const {
    lesson,
    locale,
    speakWithPip,
    markPhaseCompleted,
    setActiveStep,
    setPipMessage,
  } = useAppState();
  const game = useOptionalGame();

  const { input } = lesson.publicContent;
  const [answer, setAnswer] = useState('');
  const [evalResult, setEvalResult] = useState<{
    passed: boolean;
    feedbackEs: string;
    sampleModelAnswer: string;
  } | null>(null);

  const handleCheck = async () => {
    const res = await checkInputComprehension({
      locale,
      learnerAnswer: answer,
    });
    setEvalResult(res);
    game?.recordQuizOutcome(res.passed);
    if (res.passed) {
      markPhaseCompleted('input');
      setPipMessage(
        '¡Muy bien inferido! Ahora pasemos a Writing para producir "put off" por escrito.'
      );
    }
  };

  const fillQuickSample = () => {
    setAnswer(
      'Because Sam has the final sign-off on the budget and meeting without her means repeating the discussion tomorrow.'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.phaseBadge}>
          <Text style={styles.phaseBadgeText}>
            FASE 2 · READING & LISTENING (2 MIN)
          </Text>
        </View>

        <Text style={styles.title}>{input.situationTitle}</Text>
        <Text style={styles.senderText}>{input.senderRole}</Text>

        {/* Microtexto + Audio sobre la misma situación */}
        <View style={styles.messageBox}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageLabel}> Mensaje del equipo</Text>
            <Pressable
              onPress={() => speakWithPip(input.microText)}
              style={styles.listenBtn}
            >
              <Text style={styles.listenBtnText}> Escuchar Audio</Text>
            </Pressable>
          </View>
          <Text style={styles.microText}>{input.microText}</Text>
        </View>

        {/* Pregunta abierta de inferencia */}
        <View style={styles.promptSection}>
          <Text style={styles.promptLabel}> Inferencia de intención y consecuencia</Text>
          <Text style={styles.promptQuestion}>{input.comprehensionPrompt}</Text>

          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Escribe tu inferencia breve aquí..."
            placeholderTextColor={COLORS.inkMuted}
            multiline
            style={styles.textInput}
          />

          <View style={styles.quickFillRow}>
            <Pressable onPress={fillQuickSample} style={styles.chipBtn}>
              <Text style={styles.chipBtnText}>
                Autocompletar respuesta de prueba
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={handleCheck} style={styles.checkBtn}>
          <Text style={styles.checkBtnText}>Verificar Comprensión</Text>
        </Pressable>

        {evalResult && (
          <View
            style={[
              styles.feedbackBox,
              evalResult.passed ? styles.feedbackPass : styles.feedbackRetry,
            ]}
          >
            <Text style={styles.feedbackTitle}>
              {evalResult.passed ? 'Comprensión verificada' : 'Pista de lectura'}
            </Text>
            <Text style={styles.feedbackText}>{evalResult.feedbackEs}</Text>
            <Text style={styles.sampleAnswerLabel}>Respuesta modelo:</Text>
            <Text style={styles.sampleAnswerText}>
              “{evalResult.sampleModelAnswer}”
            </Text>

            <Pressable
              onPress={() => {
                markPhaseCompleted('input');
                setActiveStep('writing');
              }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>
                Continuar a Fase 3: Writing →
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
  senderText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.inkMuted,
    marginTop: -8,
  },
  messageBox: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 10,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkSecondary,
  },
  listenBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  listenBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  microText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.inkPrimary,
  },
  promptSection: {
    gap: 8,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkPrimary,
    textTransform: 'uppercase',
  },
  promptQuestion: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 12,
    minHeight: 76,
    fontSize: 14,
    color: COLORS.inkPrimary,
    textAlignVertical: 'top',
  },
  quickFillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    backgroundColor: COLORS.accentSoftBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentBlue,
  },
  checkBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  feedbackBox: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  feedbackPass: {
    backgroundColor: COLORS.emeraldSoftBg,
    borderColor: '#A7F3D0',
  },
  feedbackRetry: {
    backgroundColor: COLORS.amberSoftBg,
    borderColor: '#FDE68A',
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.inkPrimary,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkPrimary,
  },
  sampleAnswerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.inkSecondary,
    marginTop: 4,
  },
  sampleAnswerText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.inkSecondary,
  },
  nextBtn: {
    marginTop: 6,
    backgroundColor: COLORS.inkPrimary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
