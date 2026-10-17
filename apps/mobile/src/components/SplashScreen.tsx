import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pet3D } from './Pet3D';
import { DEFAULT_PET } from '../game/pet';
import { GRADIENTS, SHADOW, THEME } from '../theme/colors';

const TIPS = [
  'Tip: Decir “I agree” suena mucho más natural que “I am agree”.',
  'Tip: Conquista al menos 1 isla al día para encender tu racha de fuego.',
  'Tip: Tu compañero 3D se recarga de energía cada vez que hablas en inglés.',
  'Tip: Alterna entre acento US y UK arriba a la derecha para entrenar tu oído.',
];

const LOADING_STEPS = [
  'Desplegando archipiélago de islas 3D…',
  'Despertando a tus compañeros (Kirby, Michi y Meeseeks)…',
  'Cargando misiones CEFR A1 a C2…',
  '¡Mundos listos para explorar!',
];

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const scaleLogo = useRef(new Animated.Value(0.88)).current;
  const [stepIdx, setStepIdx] = useState(0);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const useNative = Platform.OS !== 'web';

    Animated.spring(scaleLogo, {
      toValue: 1,
      friction: 6,
      tension: 50,
      useNativeDriver: useNative,
    }).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: 2100,
      easing: Easing.bezier(0.25, 0.8, 0.25, 1),
      useNativeDriver: false,
    }).start();

    const t1 = setTimeout(() => setStepIdx(1), 520);
    const t2 = setTimeout(() => setStepIdx(2), 1100);
    const t3 = setTimeout(() => setStepIdx(3), 1650);
    const t4 = setTimeout(() => {
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 320,
        useNativeDriver: useNative,
      }).start(() => onFinish());
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [fadeOut, onFinish, progress, scaleLogo]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      <LinearGradient
        colors={['#E6F2FF', '#F5F7FF', '#FFF8EB']}
        style={StyleSheet.absoluteFill}
      />

      {/* Orbes de cielo luminoso */}
      <View style={styles.skySunGlow} />
      <View style={styles.skyMintGlow} />

      <Animated.View
        style={[
          styles.centerContent,
          { transform: [{ scale: scaleLogo }] },
        ]}
      >
        {/* Insignia superior estilo Apple Arcade */}
        <View style={[styles.arcadePill, SHADOW.card]}>
          <MaterialCommunityIcons name="island" size={16} color={THEME.blue} />
          <Text style={styles.arcadePillText}>ENGLISH ISLAND ADVENTURE · A1–C2</Text>
        </View>

        {/* Escenario 3D luminoso sobre isla flotante */}
        <View style={styles.petHeroWrap}>
          <View style={[styles.petOrbFrame, SHADOW.float]}>
            <Pet3D
              config={{
                ...DEFAULT_PET,
                accessory: 'crown',
              }}
              mood="happy"
              size={182}
              backgroundColor="#FFF4F8"
            />
          </View>
          {/* Base de isla flotante bajo el escenario */}
          <View style={styles.islandPedestalTop} />
          <View style={styles.islandPedestalRock} />
        </View>

        {/* Nombre y eslogan */}
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>LingoPulse</Text>
          <Text style={styles.brandTagline}>
            Explora islas, cuida a tu compañero 3D y domina el inglés jugando
          </Text>
        </View>

        {/* Barra de progreso 3D táctil */}
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFillWrap, { width: barWidth }]}>
              <LinearGradient
                colors={GRADIENTS.daily}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={styles.loadingStepText}>{LOADING_STEPS[stepIdx]}</Text>
        </View>
      </Animated.View>

      {/* Tarjeta inferior con consejo del día */}
      <View style={[styles.tipBox, SHADOW.card]}>
        <Text style={styles.tipText}>{TIPS[tipIdx]}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 44,
    paddingHorizontal: 24,
  },
  skySunGlow: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 204, 102, 0.25)',
  },
  skyMintGlow: {
    position: 'absolute',
    bottom: -60,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(79, 172, 254, 0.18)',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  arcadePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D6E8FF',
  },
  arcadePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.0,
    color: THEME.blue,
  },
  petHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  petOrbFrame: {
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: '#FFF4F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  islandPedestalTop: {
    marginTop: -14,
    width: 150,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  islandPedestalRock: {
    marginTop: -6,
    width: 110,
    height: 16,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#0E7D4D',
  },
  titleBlock: {
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.2,
    color: THEME.ink,
  },
  brandTagline: {
    fontSize: 15,
    lineHeight: 22,
    color: THEME.ink2,
    textAlign: 'center',
    maxWidth: 310,
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    maxWidth: 290,
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  progressTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#DCE7F7',
    overflow: 'hidden',
    padding: 2,
  },
  progressFillWrap: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  loadingStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.blue,
  },
  tipBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#E2ECFA',
  },
  tipText: {
    fontSize: 13,
    lineHeight: 19,
    color: THEME.ink2,
    textAlign: 'center',
    fontWeight: '600',
  },
});
