import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { useAppState } from '../context/AppStateContext';
import { COLORS } from '../theme/colors';

export function ScorecardScreen() {
  const {
    lastScorecard,
    setActiveStep,
    speakWithPip,
    totalVoicedMsToday,
  } = useAppState();

  if (!lastScorecard) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Scorecard aún sin sesión</Text>
          <Text style={styles.subtitle}>
            Completa al menos un intercambio en la Fase 4 (Voice Arena) para
            generar tu Scorecard con evidencia verificada y programación FSRS.
          </Text>
          <Pressable
            onPress={() => setActiveStep('voice')}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Ir a Voice Arena </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const formatScore = (s: number | null) =>
    s === null ? 'No evaluable' : `${s} / 4`;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>
              ★ SCORECARD CON EVIDENCIA VERIFICADA
            </Text>
          </View>
          <Text style={styles.statusTag}>
            {lastScorecard.status === 'ready'
              ? 'Evaluado'
              : 'Audio insuficiente'}
          </Text>
        </View>

        <Text style={styles.title}>Resultados de la Sesión</Text>
        <Text style={styles.summaryText}>
          {lastScorecard.summaryFeedbackEs}
        </Text>

        {/* 3 Dimensiones separadas 0–4 (Sin score global opaco, según 01_mvp_y_modelo.md) */}
        <View style={styles.dimensionsGrid}>
          <View style={styles.dimensionBox}>
            <Text style={styles.dimLabel}>Intención Comunicativa</Text>
            <Text style={styles.dimValue}>
              {formatScore(lastScorecard.communicativeScore)}
            </Text>
          </View>

          <View style={styles.dimensionBox}>
            <Text style={styles.dimLabel}>Objetivo Léxico (put off)</Text>
            <Text style={styles.dimValue}>
              {formatScore(lastScorecard.targetScore)}
            </Text>
          </View>

          <View style={styles.dimensionBox}>
            <Text style={styles.dimLabel}>Gramática Objetivo</Text>
            <Text style={styles.dimValue}>
              {formatScore(lastScorecard.grammarScore)}
            </Text>
          </View>
        </View>

        {/* Métricas Acústicas y de Habla Válida */}
        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricTitle}>WPM de Respuesta</Text>
            <Text style={styles.metricNumber}>
              {lastScorecard.wpm !== null ? `${lastScorecard.wpm} WPM` : 'N/A'}
            </Text>
            <Text style={styles.metricSub}>
              {lastScorecard.learnerWordCount} palabras en{' '}
              {(lastScorecard.learnerResponseMs / 1000).toFixed(1)}s
            </Text>
          </View>

          <View style={styles.metricPill}>
            <Text style={styles.metricTitle}>Habla Válida (Fuel)</Text>
            <Text style={styles.metricNumber}>
              +{lastScorecard.fuelAwardedSeconds}s 
            </Text>
            <Text style={styles.metricSub}>
              Total hoy: {Math.round(totalVoicedMsToday / 1000)}s / 30s
            </Text>
          </View>
        </View>

        {/* Evidencias Textuales Literales por Turno */}
        <View style={styles.evidenceSection}>
          <Text style={styles.sectionHeader}>
            Evidencia Textual Extraída de tus Turnos
          </Text>
          {lastScorecard.evidences.length === 0 ? (
            <Text style={styles.emptyEvidence}>
              No se registraron turnos con audio utilizable en esta sesión.
            </Text>
          ) : (
            lastScorecard.evidences.map((ev, idx) => (
              <View key={ev.turnId} style={styles.evidenceCard}>
                <View style={styles.evidenceTop}>
                  <Text style={styles.evidenceTurnLabel}>Turno #{idx + 1}</Text>
                  <Text style={styles.evidenceStatusPill}>
                    Objetivo: {ev.useStatus} · Gramática: {ev.grammarStatus}
                  </Text>
                </View>
                <Text style={styles.evidenceQuote}>“{ev.quote}”</Text>
                <Text style={styles.evidenceFeedback}>{ev.feedbackEs}</Text>
              </View>
            ))
          )}
        </View>

        {/* Oración de mejora modelo */}
        <Pressable
          onPress={() => speakWithPip(lastScorecard.modelUpgradeExampleEn)}
          style={styles.upgradeBox}
        >
          <Text style={styles.sectionHeader}>
            Versión Modelo de Referencia (Toca para escuchar)
          </Text>
          <Text style={styles.upgradeSentence}>
            “{lastScorecard.modelUpgradeExampleEn}”
          </Text>
        </Pressable>

        {/* Estado del Scheduler FSRS (Repaso Espaciado) */}
        <View style={styles.fsrsBox}>
          <Text style={styles.sectionHeader}>
            Scheduler FSRS (Recuperación Diferida)
          </Text>
          <Text style={styles.fsrsDetail}>
            Objetivo:{' '}
            <Text style={styles.fsrsBold}>
              {lastScorecard.fsrsNextReview.targetExpression}
            </Text>{' '}
            · Rating:{' '}
            <Text style={styles.fsrsBold}>
              {lastScorecard.fsrsNextReview.ratingLabel} (
              {lastScorecard.fsrsNextReview.rating}/4)
            </Text>
          </Text>
          <Text style={styles.fsrsDetail}>
            Próxima escena de transferencia en:{' '}
            <Text style={styles.fsrsBold}>
              {lastScorecard.fsrsNextReview.nextDueDays} día(s)
            </Text>{' '}
            (Estado: {lastScorecard.fsrsNextReview.state})
          </Text>
        </View>

        <Pressable
          onPress={() => setActiveStep('anatomy')}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>
            Volver al Inicio de la Lección ↺
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: COLORS.cardSurface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    backgroundColor: COLORS.emeraldSoftBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.emerald,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.inkPrimary,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.inkSecondary,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.inkPrimary,
    fontWeight: '600',
  },
  dimensionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionBox: {
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: COLORS.accentSoftBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    gap: 4,
  },
  dimLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkSecondary,
    textAlign: 'center',
  },
  dimValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.accentBlue,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricPill: {
    flex: 1,
    backgroundColor: COLORS.cardMuted,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 2,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.inkPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.inkMuted,
  },
  evidenceSection: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.inkPrimary,
    textTransform: 'uppercase',
  },
  emptyEvidence: {
    fontSize: 12,
    color: COLORS.inkMuted,
    fontStyle: 'italic',
  },
  evidenceCard: {
    backgroundColor: COLORS.cardMuted,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 4,
  },
  evidenceTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  evidenceTurnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentBlue,
  },
  evidenceStatusPill: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  evidenceQuote: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.inkPrimary,
  },
  evidenceFeedback: {
    fontSize: 12,
    color: COLORS.inkSecondary,
    lineHeight: 18,
  },
  upgradeBox: {
    backgroundColor: COLORS.emeraldSoftBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
  },
  upgradeSentence: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  fsrsBox: {
    backgroundColor: COLORS.purpleSoftBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 4,
  },
  fsrsDetail: {
    fontSize: 13,
    color: COLORS.inkPrimary,
  },
  fsrsBold: {
    fontWeight: '800',
    color: COLORS.purple,
  },
  primaryBtn: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
