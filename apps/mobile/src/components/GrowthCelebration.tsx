import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { useGame } from '../context/GameContext';
import { PET_STAGES, type PetStage } from '../game/pet';
import { playSfx } from '../services/sfx';
import { Pet3D } from './Pet3D';
import { haptic } from './motion';

const NATIVE = Platform.OS !== 'web';
const CONFETTI = ['#FFD54A', '#FF6B9D', '#47C2FF', '#7BE495', '#B18CFF', '#FF9F43'];

/**
 * Momento estrella: el huevo tiembla, destella y aparece la mascota en su nueva etapa.
 * Se muestra una sola vez por etapa (GameContext guarda la última etapa celebrada).
 */
export function GrowthCelebration() {
  const { pendingGrowth, dismissGrowth, pet, petStage } = useGame();
  const [phase, setPhase] = useState<'before' | 'after'>('before');
  const flash = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pendingGrowth) return;
    setPhase('before');
    flash.setValue(0);
    burst.setValue(0);
    text.setValue(0);
    haptic('medium');
    const t1 = setTimeout(() => {
      Animated.timing(flash, { toValue: 1, duration: 260, useNativeDriver: NATIVE }).start(() => {
        setPhase('after');
        haptic('success');
        playSfx('fanfare');
        Animated.parallel([
          Animated.timing(flash, { toValue: 0, duration: 520, useNativeDriver: NATIVE }),
          Animated.timing(burst, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
          Animated.spring(text, { toValue: 1, useNativeDriver: NATIVE, speed: 8, bounciness: 10 }),
        ]).start();
      });
    }, 1700);
    return () => clearTimeout(t1);
  }, [pendingGrowth, flash, burst, text]);

  if (!pendingGrowth) return null;
  const to = PET_STAGES.find((s) => s.id === pendingGrowth.to)!;
  const hatched = pendingGrowth.from === 'egg';
  const shownStage: PetStage = phase === 'before' ? pendingGrowth.from : pendingGrowth.to;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={dismissGrowth}>
      <Pressable style={styles.backdrop} onPress={phase === 'after' ? dismissGrowth : undefined}>
        <View style={styles.center}>
          {phase === 'after'
            ? Array.from({ length: 16 }).map((_, i) => {
                const a = (i / 16) * Math.PI * 2;
                const r = 120 + (i % 3) * 26;
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.confetti,
                      {
                        backgroundColor: CONFETTI[i % CONFETTI.length],
                        opacity: burst.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
                        transform: [
                          { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * r] }) },
                          { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * r] }) },
                          { rotate: `${i * 40}deg` },
                        ],
                      },
                    ]}
                  />
                );
              })
            : null}
          <Pet3D
            key={shownStage}
            config={pet}
            mood={phase === 'after' ? 'celebrate' : 'happy'}
            stage={shownStage}
            growth={phase === 'before' ? 1 : 0}
            reactKey={phase === 'before' ? 1 : 0}
            size={250}
            backgroundColor="transparent"
          />
          <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flash }]} />
        </View>

        {phase === 'before' ? (
          <Text style={styles.title}>{hatched ? '¡Algo se mueve dentro del huevo!' : `¡${pet.name} está cambiando!`}</Text>
        ) : (
          <Animated.View
            style={{
              alignItems: 'center',
              gap: 8,
              opacity: text,
              transform: [{ scale: text.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            }}
          >
            <Text style={styles.kicker}>{hatched ? 'ECLOSIÓN' : 'NUEVA ETAPA'}</Text>
            <Text style={styles.title}>{hatched ? `¡${pet.name} nació!` : `¡${pet.name} ahora es ${to.label.toLowerCase()}!`}</Text>
            <Text style={styles.sub}>{to.descEs}</Text>
            {petStage.next ? (
              <Text style={styles.next}>
                Siguiente etapa: {petStage.next.label} · faltan {petStage.xpToNext} XP
              </Text>
            ) : null}
            <Pressable onPress={dismissGrowth} style={styles.cta} accessibilityRole="button">
              <Text style={styles.ctaText}>¡Genial!</Text>
            </Pressable>
          </Animated.View>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16,24,58,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  flash: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
  confetti: { position: 'absolute', width: 12, height: 18, borderRadius: 4 },
  kicker: { color: '#FFD54A', fontWeight: '900', letterSpacing: 2, fontSize: 13 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 15, textAlign: 'center', maxWidth: 320 },
  next: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' },
  cta: {
    marginTop: 8,
    backgroundColor: '#FFD54A',
    borderRadius: 999,
    paddingHorizontal: 34,
    paddingVertical: 14,
  },
  ctaText: { color: '#3B2A00', fontWeight: '900', fontSize: 17 },
});
