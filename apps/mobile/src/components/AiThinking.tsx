import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { Text, tr } from '../i18n';
import { Glyph } from './Glyph';
import { THEME } from '../theme/colors';

const NATIVE = Platform.OS !== 'web';

const DEFAULT_STEPS = [
  'Leyendo tu respuesta…',
  'Buscando errores de gramática…',
  'Revisando tu vocabulario…',
  'Escribiendo las explicaciones en español…',
  'Preparando tu versión mejorada…',
  'Casi listo…',
];

/**
 * Indicador de "la IA está trabajando": mensajes que cambian por etapas y segundos transcurridos.
 * La corrección con IA tarda ~10-20 s; ver el progreso hace la espera más llevadera.
 */
export function AiThinking({ steps = DEFAULT_STEPS, label = 'Corrigiendo con IA' }: { steps?: string[]; label?: string }) {
  const [elapsed, setElapsed] = useState(0);
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const stepIdx = Math.min(steps.length - 1, Math.floor(elapsed / 3));

  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => {
      clearInterval(id);
      loop.stop();
    };
  }, [pulse]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: NATIVE }).start();
  }, [stepIdx, fade]);

  return (
    <View style={styles.wrap}>
      <Animated.View
        style={{
          transform: [
            { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
            { rotate: pulse.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] }) },
          ],
        }}
      >
        <Glyph name="sparkle" size={30} />
      </Animated.View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.label}>
          {label} · {elapsed} s
        </Text>
        <Animated.Text style={[styles.step, { opacity: fade }]}>{tr(steps[stepIdx] ?? '')}</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F1ECFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: { fontSize: 12, fontWeight: '900', color: '#6A4DFF', letterSpacing: 0.3 },
  step: { fontSize: 14, fontWeight: '700', color: THEME.ink },
});
