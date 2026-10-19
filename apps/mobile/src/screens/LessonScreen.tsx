import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { derivePipEnergyState } from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { PipMascot3D } from '../components/PipMascot3D';
import { PhaseStepper } from '../components/PhaseStepper';
import { ProgressBar, ScreenHeader } from '../components/ui';
import { Phase1AnatomyScreen } from './Phase1AnatomyScreen';
import { Phase2InputScreen } from './Phase2InputScreen';
import { Phase3WritingScreen } from './Phase3WritingScreen';
import { Phase4VoiceArenaScreen } from './Phase4VoiceArenaScreen';
import { ScorecardScreen } from './ScorecardScreen';
import { COLORS } from '../theme/colors';

/** Ruta guiada B1 (flujo original de 4 fases + scorecard). */
export function LessonScreen() {
  const { activeStep, syllabus, totalVoicedMsToday, engineSource } = useAppState();
  const { goBack } = useGame();
  const energy = derivePipEnergyState(totalVoicedMsToday);

  return (
    <View style={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <ScreenHeader
          title="Ruta guiada B1"
          subtitle={`Módulo 1 · ${engineSource === 'api' ? 'API conectada' : 'motor local'}`}
          onBack={goBack}
        />
        <View style={{ gap: 4 }}>
          <View style={styles.fuelRow}>
            <Text style={styles.fuelLabel}>
              Voz válida en la sesión: {Math.round(totalVoicedMsToday / 1000)}s / 30s
            </Text>
            <Text style={styles.fuelStatus}>{energy.labelEs}</Text>
          </View>
          <ProgressBar
            value={energy.progressPercent / 100}
            color={energy.level === 'radiant' ? COLORS.emerald : COLORS.accentBlue}
          />
        </View>
      </View>

      <PipMascot3D />
      <PhaseStepper />

      {activeStep === 'anatomy' && <Phase1AnatomyScreen />}
      {activeStep === 'input' && <Phase2InputScreen />}
      {activeStep === 'writing' && <Phase3WritingScreen />}
      {activeStep === 'voice' && <Phase4VoiceArenaScreen />}
      {activeStep === 'scorecard' && <ScorecardScreen />}

      <View style={styles.syllabusCard}>
        <Text style={styles.syllabusHeader}> RUTA MCER B1 · MÓDULO 1 (4 PRÁCTICAS + 1 CHECKPOINT)</Text>
        {syllabus.map((item) => (
          <View key={item.slug} style={styles.syllabusRow}>
            <View
              style={[
                styles.badge,
                item.position === 1 && { backgroundColor: COLORS.accentBlue },
                item.isCheckpoint && { backgroundColor: COLORS.purple },
              ]}
            >
              <Text style={[styles.badgeText, (item.position === 1 || item.isCheckpoint) && { color: '#FFFFFF' }]}>
                {item.isCheckpoint ? '★' : item.position}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syllabusTitle}>
                {item.title}
                {item.position !== 1 ? '' : ''}
              </Text>
              <Text style={styles.syllabusTarget}>
                Objetivo: {item.target} · {item.grammar}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  fuelRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  fuelLabel: { fontSize: 12, fontWeight: '700', color: COLORS.inkSecondary },
  fuelStatus: { fontSize: 12, fontWeight: '700', color: COLORS.inkMuted },
  syllabusCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.cardSurface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: 10,
  },
  syllabusHeader: { fontSize: 11, fontWeight: '800', color: COLORS.inkSecondary, letterSpacing: 0.4 },
  syllabusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '800', color: COLORS.inkSecondary },
  syllabusTitle: { fontSize: 13, fontWeight: '700', color: COLORS.inkPrimary },
  syllabusTarget: { fontSize: 11, color: COLORS.inkMuted },
});
