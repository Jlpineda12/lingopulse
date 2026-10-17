import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LessonPhase } from '@lingopulse/shared';
import { useAppState, type ActiveStep } from '../context/AppStateContext';
import { COLORS } from '../theme/colors';

const STEPS: Array<{
  key: ActiveStep;
  phase?: LessonPhase;
  number: string;
  label: string;
  duration: string;
}> = [
  { key: 'anatomy', phase: 'anatomy', number: '1', label: 'Anatomía', duration: '2m' },
  { key: 'input', phase: 'input', number: '2', label: 'Input', duration: '2m' },
  { key: 'writing', phase: 'writing', number: '3', label: 'Writing', duration: '3m' },
  { key: 'voice', phase: 'voice', number: '4', label: 'Voice Arena', duration: '3m' },
  { key: 'scorecard', number: '★', label: 'Scorecard', duration: 'Evidencia' },
];

export function PhaseStepper() {
  const { activeStep, setActiveStep, completedPhases } = useAppState();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STEPS.map((step) => {
          const isActive = activeStep === step.key;
          const isCompleted =
            step.phase ? completedPhases.includes(step.phase) : false;

          return (
            <Pressable
              key={step.key}
              onPress={() => setActiveStep(step.key)}
              style={[
                styles.stepPill,
                isActive && styles.stepPillActive,
                !isActive && isCompleted && styles.stepPillCompleted,
              ]}
            >
              <View
                style={[
                  styles.stepBadge,
                  isActive && styles.stepBadgeActive,
                  !isActive && isCompleted && styles.stepBadgeCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.stepBadgeText,
                    (isActive || isCompleted) && { color: '#FFFFFF' },
                  ]}
                >
                  {isCompleted ? '✓' : step.number}
                </Text>
              </View>
              <View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
                <Text style={styles.stepDuration}>{step.duration}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardSurface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  stepPillActive: {
    backgroundColor: COLORS.accentSoftBg,
    borderColor: COLORS.accentBlue,
  },
  stepPillCompleted: {
    backgroundColor: COLORS.emeraldSoftBg,
    borderColor: '#A7F3D0',
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: COLORS.accentBlue,
  },
  stepBadgeCompleted: {
    backgroundColor: COLORS.emerald,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.inkSecondary,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  stepLabelActive: {
    color: COLORS.accentBlue,
    fontWeight: '800',
  },
  stepDuration: {
    fontSize: 10,
    color: COLORS.inkMuted,
  },
});
