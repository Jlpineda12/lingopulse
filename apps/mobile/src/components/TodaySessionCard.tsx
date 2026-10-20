import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../i18n';
import type { PetConfig, PetMood, PetStage } from '../game/pet';
import { Pet3D } from './Pet3D';
import { PressableScale } from './motion';
import { petTint, SHADOW, THEME } from '../theme/colors';

export interface SessionStep {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  minutes: number;
  done: boolean;
  onPress: () => void;
}

/**
 * «Sesión de Hoy (5 min)»: la única llamada a la acción grande de la portada.
 * Tres pasos cortos (palabra del día, hablar con la mascota, escuchar) y un botón que
 * siempre lleva al siguiente paso pendiente.
 */
export function TodaySessionCard({
  pet,
  mood,
  stage,
  steps,
  onPetTap,
}: {
  pet: PetConfig;
  mood: PetMood;
  stage: PetStage;
  steps: SessionStep[];
  onPetTap: () => void;
}) {
  const next = steps.find((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = !next;
  const minutes = steps.reduce((m, s) => m + s.minutes, 0);

  return (
    <View style={[styles.card, SHADOW.float, { backgroundColor: petTint(pet.bodyColor, 0.9) }]}>
      <View style={styles.top}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.kicker}>SESIÓN DE HOY · {minutes} MIN</Text>
          <Text style={styles.title}>{allDone ? '¡Sesión completada!' : doneCount ? 'Sigue donde ibas' : `Practica con ${pet.name}`}</Text>
          <Text style={styles.sub}>
            {allDone
              ? `${pet.name} está orgulloso. Ya puedes decorar su casa y jugar.`
              : `${doneCount}/${steps.length} pasos · ${pet.name} te espera para hablar en inglés.`}
          </Text>
        </View>
        <Pet3D config={pet} mood={allDone ? 'celebrate' : mood} stage={stage} size={124} onTap={onPetTap} backgroundColor="transparent" />
      </View>

      <View style={styles.steps}>
        {steps.map((s, i) => {
          const isNext = s === next;
          return (
            <PressableScale key={s.id} onPress={s.onPress} hapticKind="select" style={[styles.step, isNext && styles.stepNext]}>
              <View style={[styles.stepIcon, s.done && styles.stepIconDone, isNext && styles.stepIconNext]}>
                <Ionicons name={s.done ? 'checkmark' : s.icon} size={16} color={s.done || isNext ? '#FFFFFF' : THEME.ink2} />
              </View>
              <Text style={[styles.stepText, s.done && styles.stepTextDone]} numberOfLines={1}>
                {i + 1}. {s.title}
              </Text>
              <Text style={styles.stepMin}>{s.minutes} min</Text>
            </PressableScale>
          );
        })}
      </View>

      <PressableScale
        onPress={() => (next ?? steps[1]!).onPress()}
        scaleTo={0.96}
        hapticKind="medium"
        style={[styles.cta, allDone && { backgroundColor: THEME.green }]}
        accessibilityRole="button"
      >
        <Ionicons name={allDone ? 'mic' : doneCount ? 'play-forward' : 'play'} size={20} color="#FFFFFF" />
        <Text style={styles.ctaText}>
          {allDone ? 'Practicar un poco más' : doneCount ? `Continuar: ${next!.title}` : 'Sesión de Hoy (5 min)'}
        </Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 28, padding: 16, gap: 12, borderWidth: 2, borderColor: 'rgba(30,36,54,0.06)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { fontSize: 12, fontWeight: '900', letterSpacing: 1.2, color: THEME.blue },
  title: { fontSize: 24, fontWeight: '900', color: THEME.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: THEME.ink2, lineHeight: 19 },
  steps: { gap: 6 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  stepNext: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: THEME.blue },
  stepIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EDF6' },
  stepIconDone: { backgroundColor: THEME.green },
  stepIconNext: { backgroundColor: THEME.blue },
  stepText: { flex: 1, fontSize: 15, fontWeight: '700', color: THEME.ink },
  stepTextDone: { color: THEME.ink3, textDecorationLine: 'line-through' },
  stepMin: { fontSize: 12, fontWeight: '800', color: THEME.ink3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: THEME.blue,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', flexShrink: 1 },
});
