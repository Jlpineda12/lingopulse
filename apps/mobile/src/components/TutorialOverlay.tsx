import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../i18n';
import { useGame, type TabId } from '../context/GameContext';
import { unitsForLevel } from '@lingopulse/shared';
import { playSfx } from '../services/sfx';
import { Pet3D } from './Pet3D';
import { haptic } from './motion';

const NATIVE = Platform.OS !== 'web';

interface TourStep {
  title: string;
  body: string;
  /** Pestaña que se abre detrás del globo y que se resalta en la barra inferior. */
  tab?: TabId;
  /** Mini reto interactivo dentro del tutorial. */
  quiz?: { q: string; options: string[]; answer: number; praise: string };
  cta?: string;
}

const TAB_ORDER: TabId[] = ['home', 'daily', 'practice', 'pet'];

const STEPS: TourStep[] = [
  {
    title: '¡Hola! Soy tu huevo 🥚',
    body: 'Cada cosa que aprendas en inglés me dará energía. Con tu primera actividad voy a eclosionar… ¡y luego creceré contigo!',
  },
  {
    title: 'Tu Ruta de hoy',
    body: 'Aquí ves tu meta diaria, tu racha de fueguitos 🔥 y tus monedas. Practica un poco cada día para no apagar la llama.',
    tab: 'home',
  },
  {
    title: 'Una isla por día',
    body: 'Cada isla es una unidad completa: vocabulario, gramática, situaciones de la vida real, reading, listening, speaking, writing y un quiz final. La siguiente se abre mañana: así aprendes sin saturarte.',
    tab: 'practice',
  },
  {
    title: 'Mini reto ✨',
    body: 'Así se sienten las islas. Elige la respuesta correcta:',
    quiz: {
      q: 'Someone says "Nice to meet you!". You answer…',
      options: ['Nice to meet you too!', 'I am fine, thank you.', 'See you tomorrow.'],
      answer: 0,
      praise: '¡Perfecto! En las islas recibirás explicación y pronunciación de cada frase.',
    },
  },
  {
    title: 'Habla y te escucho 🎙️',
    body: 'En speaking presionas el micrófono y hablas en inglés. Te doy puntuación de pronunciación, fluidez y gramática, y te digo qué mejorar.',
    tab: 'practice',
  },
  {
    title: 'El Cofre Diario',
    body: 'Cada día trae palabras, expresiones y phrasal verbs nuevos con un mini quiz. ¡Abre el cofre y guarda tus favoritas!',
    tab: 'daily',
  },
  {
    title: 'Tu compañero',
    body: 'Aquí me cuidas, decoras mi casa y me personalizas: cara, pelo, ropa, gorros, ¡hasta pintura facial! Cuanto más aprendes, más crezco.',
    tab: 'pet',
  },
  {
    title: '¡Listo para tu primera isla!',
    body: 'Empieza ahora la isla 1. Cuando termines tu primera actividad, saldré del huevo. 🐣',
    cta: 'Ir a mi primera isla',
  },
];

/**
 * Tutorial interactivo para jugadores nuevos: la mascota (aún en su huevo) guía por la app,
 * abre cada pestaña detrás del globo, resalta el botón en la barra y propone un mini reto.
 */
export function TutorialOverlay() {
  const { progress, finishTutorial, setTab, openScreen, pet, petStage } = useGame();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const visible = progress.onboarded && progress.tutorialDone === false;
  const step = STEPS[i]!;

  useEffect(() => {
    if (!visible) return;
    enter.setValue(0);
    Animated.spring(enter, { toValue: 1, useNativeDriver: NATIVE, speed: 14, bounciness: 8 }).start();
    if (step.tab) setTab(step.tab);
  }, [i, visible]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (!visible) return null;

  const last = i === STEPS.length - 1;
  const quizDone = !step.quiz || picked === step.quiz.answer;
  const next = () => {
    haptic('select');
    playSfx('tap');
    setPicked(null);
    if (last) {
      finishTutorial();
      setTab('practice');
      const first = unitsForLevel(progress.level)[0];
      if (first) openScreen({ name: 'unit', unitId: first.id });
      return;
    }
    setI((n) => n + 1);
  };
  const skip = () => {
    haptic('select');
    finishTutorial();
  };

  const tabIdx = step.tab ? TAB_ORDER.indexOf(step.tab) : -1;
  const barW = Math.min(width, 720) - 32;
  const barLeft = (width - barW) / 2;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={skip}>
      <View style={styles.backdrop}>
        {tabIdx >= 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.spot,
              {
                left: barLeft + (barW / 4) * tabIdx + barW / 8 - 42,
                opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
              },
            ]}
          />
        ) : null}

        <Animated.View
          style={[
            styles.card,
            {
              opacity: enter,
              transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.petBubble}>
              <Pet3D
                config={pet}
                mood={picked !== null && step.quiz && picked === step.quiz.answer ? 'celebrate' : 'happy'}
                stage={petStage.stage}
                growth={Math.min(1, petStage.progress + 0.3)}
                reactKey={picked === step.quiz?.answer ? 1 : 0}
                size={110}
                backgroundColor="#EAF3FF"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.kicker}>
                PASO {i + 1} DE {STEPS.length}
              </Text>
              <Text style={styles.title}>{step.title}</Text>
            </View>
          </View>
          <Text style={styles.body}>{step.body}</Text>

          {step.quiz ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.quizQ}>{step.quiz.q}</Text>
              {step.quiz.options.map((o, k) => {
                const isPicked = picked === k;
                const right = k === step.quiz!.answer;
                return (
                  <Pressable
                    key={o}
                    onPress={() => {
                      setPicked(k);
                      haptic(right ? 'success' : 'error');
                      playSfx(right ? 'correct' : 'wrong');
                    }}
                    style={[styles.option, isPicked && (right ? styles.optionRight : styles.optionWrong)]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.optionText, isPicked && { color: '#FFFFFF' }]}>{o}</Text>
                  </Pressable>
                );
              })}
              {picked !== null ? (
                <Text style={[styles.feedback, { color: picked === step.quiz.answer ? '#168A4C' : '#C2253F' }]}>
                  {picked === step.quiz.answer ? step.quiz.praise : 'Casi. Piensa: te dijeron "encantado de conocerte". ¡Inténtalo otra vez!'}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.dots}>
            {STEPS.map((_, k) => (
              <View key={k} style={[styles.dot, k === i && styles.dotOn, k < i && styles.dotDone]} />
            ))}
          </View>

          <View style={styles.actions}>
            {!last ? (
              <Pressable onPress={skip} style={styles.skip} accessibilityRole="button">
                <Text style={styles.skipText}>Saltar</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <Pressable
              onPress={next}
              disabled={!quizDone}
              style={[styles.cta, !quizDone && { opacity: 0.4 }]}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>{step.cta ?? (last ? '¡Vamos!' : 'Siguiente')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14,22,48,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 118,
  },
  spot: {
    position: 'absolute',
    bottom: 22,
    width: 84,
    height: 64,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: '#FFD54A',
    backgroundColor: 'rgba(255,213,74,0.18)',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  petBubble: { width: 96, height: 96, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EAF3FF' },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, color: '#7B5CFF' },
  title: { fontSize: 21, fontWeight: '900', color: '#1E2436', letterSpacing: -0.4 },
  body: { fontSize: 15.5, lineHeight: 22, color: '#3E4863' },
  quizQ: { fontSize: 15, fontWeight: '800', color: '#1E2436' },
  option: { borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#EEF2FA', borderWidth: 2, borderColor: 'transparent' },
  optionRight: { backgroundColor: '#22B567', borderColor: '#168A4C' },
  optionWrong: { backgroundColor: '#FF4769', borderColor: '#C2253F' },
  optionText: { fontSize: 15, fontWeight: '700', color: '#1E2436' },
  feedback: { fontSize: 13.5, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#DCE3F0' },
  dotOn: { width: 20, backgroundColor: '#007AFF' },
  dotDone: { backgroundColor: '#9CC7FF' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skip: { paddingHorizontal: 12, paddingVertical: 10 },
  skipText: { fontSize: 15, fontWeight: '700', color: '#7E89A6' },
  cta: { backgroundColor: '#007AFF', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 13 },
  ctaText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
