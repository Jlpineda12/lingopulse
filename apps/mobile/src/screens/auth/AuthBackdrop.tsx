import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { Text } from '../../i18n';
import { styles } from './authStyles';


/**
 * Fondo animado 2D estilo Waterllama (malla orgánica + destellos + cubos low-poly flotantes).
 */
export function AnimatedShowcaseBackdrop({
  variant,
}: {
  variant: 'pool' | 'teal' | 'pastel';
}) {
  const drift = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== 'web';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [drift, native]);

  const translateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  if (variant === 'pool') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#56C4FF', '#2D9BF0', '#1E82D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Malla ondulada tipo piscina / cielo inspirada en el video de referencia */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: 0.25, transform: [{ translateY }] },
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="none">
            {[60, 140, 220, 300, 380, 460, 540, 620, 700].map((y, idx) => (
              <Path
                key={`h-${y}`}
                d={`M 0 ${y} Q 100 ${y + (idx % 2 === 0 ? 18 : -18)}, 200 ${y} T 400 ${y}`}
                stroke="#FFFFFF"
                strokeWidth="1.6"
                fill="none"
              />
            ))}
            {[65, 135, 200, 265, 335].map((x, idx) => (
              <Path
                key={`v-${x}`}
                d={`M ${x} 0 Q ${x + (idx % 2 === 0 ? 16 : -16)} 200, ${x} 400 T ${x} 800`}
                stroke="#FFFFFF"
                strokeWidth="1.4"
                fill="none"
              />
            ))}
            {/* Estrellitas de brillo (sparkles) */}
            <Path d="M 76 110 L 80 120 L 90 124 L 80 128 L 76 138 L 72 128 L 62 124 L 72 120 Z" fill="#FFFFFF" />
            <Path d="M 326 170 L 329 177 L 336 180 L 329 183 L 326 190 L 323 183 L 316 180 L 323 177 Z" fill="#FFFFFF" />
            <Circle cx="310" cy="95" r="4" fill="#FFFFFF" />
            <Circle cx="64" cy="390" r="3.5" fill="#FFFFFF" />
          </Svg>
        </Animated.View>
        {/* Marca de agua gigante inferior como en el video */}
        <View style={styles.watermarkWrap}>
          <Text style={styles.watermarkText}>lingopulse</Text>
        </View>
      </View>
    );
  }

  if (variant === 'teal') {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#1CC5D4', '#12A8B8', '#0C8B99']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Cubos low-poly 3D flotantes como en la pantalla turquesa de objetivo del video */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { opacity: 0.32, transform: [{ translateY }] },
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 400 800">
            {/* Cubo isométrico superior derecho */}
            <Polygon points="330,110 368,128 330,146 292,128" fill="#A5F3FC" />
            <Polygon points="292,128 330,146 330,188 292,170" fill="#67E8F9" />
            <Polygon points="368,128 330,146 330,188 368,170" fill="#22D3EE" />

            {/* Cubo isométrico izquierdo */}
            <Polygon points="56,250 86,265 56,280 26,265" fill="#A5F3FC" />
            <Polygon points="26,265 56,280 56,314 26,299" fill="#67E8F9" />
            <Polygon points="86,265 56,280 56,314 86,299" fill="#22D3EE" />

            {/* Cubo isométrico inferior derecho */}
            <Polygon points="342,470 376,488 342,506 308,488" fill="#A5F3FC" />
            <Polygon points="308,488 342,506 342,544 308,526" fill="#67E8F9" />
            <Polygon points="376,488 342,506 342,544 376,526" fill="#22D3EE" />
          </Svg>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#F4F9FF', '#EBF4FF', '#F7FAFF']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

