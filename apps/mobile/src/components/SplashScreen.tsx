import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { Text, tr } from '../i18n';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { Glyph } from './Glyph';
import type { PetSpecies } from '../game/pet';
import { THEME } from '../theme/colors';

/**
 * Pantalla de carga "Amanecer en la isla":
 * 1. Sale el sol y una isla emerge del mar.
 * 2. Tres compañeros caen sobre la isla con rebote (squash & stretch).
 * 3. El logo aparece letra por letra y los compañeros saltan por turnos saludando en inglés.
 * 4. Un barquito navega por la ruta como barra de progreso.
 * Solo termina cuando pasó el tiempo mínimo Y los datos ya cargaron (`ready`).
 */

const NATIVE = Platform.OS !== 'web';
const INK = '#1E2436';
const MIN_MS = 2600;
const BRAND = 'LingoPulse';
const TRACK_W = 250;

const TIPS = [
  'Tip: “I agree” es correcto; “I am agree” no.',
  'Tip: Una isla al día mantiene tu racha encendida.',
  'Tip: Tu compañero gana energía cada vez que hablas en inglés.',
  'Tip: Cambia entre acento US y UK arriba a la derecha.',
  'Tip: Los escudos de racha protegen un día perdido.',
];

const STEPS = [
  'Levantando las islas…',
  'Despertando a la tripulación…',
  'Preparando tus misiones…',
  '¡Todo listo, zarpamos!',
];

const GREETINGS = ['Hello!', '¡Hola!', "Let's go!"];

function useLoop(duration: number, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay]);
  return v;
}

/* ------------------------------------------------------------------ */
/* Compañero que cae, rebota y salta por turnos                        */
/* ------------------------------------------------------------------ */

function Hopper({
  species,
  dropDelay,
  active,
  celebrate,
  greeting,
  size,
}: {
  species: PetSpecies;
  dropDelay: number;
  active: boolean;
  celebrate: boolean;
  greeting: string;
  size: number;
}) {
  const drop = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const bubble = useRef(new Animated.Value(0)).current;

  const land = () =>
    Animated.sequence([
      Animated.timing(squash, { toValue: 1, duration: 80, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
      Animated.spring(squash, { toValue: 0, friction: 4, tension: 160, useNativeDriver: NATIVE }),
    ]);

  // Caída inicial con aplastamiento al tocar el pasto
  useEffect(() => {
    Animated.sequence([
      Animated.delay(dropDelay),
      Animated.timing(drop, { toValue: 1, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
      land(),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salto de turno + burbuja de saludo
  useEffect(() => {
    if (!active && !celebrate) return;
    const height = celebrate ? 1.6 : 1;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(hop, {
          toValue: height,
          duration: 230,
          easing: Easing.out(Easing.quad),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(hop, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
        land(),
      ]),
      Animated.sequence([
        Animated.spring(bubble, { toValue: 1, friction: 5, tension: 140, useNativeDriver: NATIVE }),
        Animated.delay(celebrate ? 200 : 420),
        Animated.timing(bubble, { toValue: 0, duration: 160, useNativeDriver: NATIVE }),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, celebrate]);

  return (
    <View style={{ width: size, alignItems: 'center', marginTop: 34 }}>
      <Animated.View
        style={{
          transform: [
            { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-320, 0] }) },
            { translateY: hop.interpolate({ inputRange: [0, 1.6], outputRange: [0, -46] }) },
            { scaleY: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.76] }) },
            { scaleX: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) },
          ],
        }}
      >
        <Glyph name={`species-${species}`} size={size} />
        <Animated.View
          style={[
            styles.bubble,
            {
              opacity: bubble,
              transform: [
                { translateY: bubble.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                { scale: bubble.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.bubblePill}>
            <Text style={styles.bubbleText} numberOfLines={1}>
              {celebrate ? '¡Vamos!' : greeting}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
      {/* Sombra que se encoge cuando salta */}
      <Animated.View
        style={[
          styles.shadow,
          {
            width: size * 0.6,
            opacity: drop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }),
            transform: [{ scaleX: hop.interpolate({ inputRange: [0, 1.6], outputRange: [1, 0.5] }) }],
          },
        ]}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Letras del logo                                                     */
/* ------------------------------------------------------------------ */

function BrandLetters({ start }: { start: number }) {
  const values = useMemo(() => BRAND.split('').map(() => new Animated.Value(0)), []);
  useEffect(() => {
    Animated.sequence([
      Animated.delay(start),
      Animated.stagger(
        55,
        values.map((v) => Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: NATIVE })),
      ),
    ]).start();
  }, [values, start]);
  return (
    <View style={styles.brandRow}>
      {BRAND.split('').map((ch, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.brandLetter,
            i >= 5 && { color: THEME.blue },
            {
              opacity: values[i],
              transform: [
                { translateY: values[i]!.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                { scale: values[i]!.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
              ],
            },
          ]}
        >
          {ch}
        </Animated.Text>
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Pantalla                                                            */
/* ------------------------------------------------------------------ */

export function SplashScreen({
  onFinish,
  ready = true,
  petSpecies = 'puff',
}: {
  onFinish: () => void;
  /** true cuando los datos guardados ya cargaron. */
  ready?: boolean;
  /** Especie del jugador: va en el centro de la tripulación. */
  petSpecies?: PetSpecies;
}) {
  const sunrise = useRef(new Animated.Value(0)).current;
  const island = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(1)).current;
  const rays = useRef(new Animated.Value(0)).current;
  const wave = useLoop(1400);
  const cloud = useLoop(5200);
  const boatBob = useLoop(700);
  const [stepIdx, setStepIdx] = useState(0);
  const [turn, setTurn] = useState(-1);
  const [minDone, setMinDone] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const finished = useRef(false);
  // Ref para que un nuevo onFinish del padre no cancele la salida ya iniciada.
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const exited = useRef(false);
  const finish = () => {
    if (exited.current) return;
    exited.current = true;
    onFinishRef.current();
  };

  const crew = useMemo<PetSpecies[]>(() => {
    const sides: PetSpecies[] = ['fox', 'shark', 'cat', 'bunny'].filter((s) => s !== petSpecies) as PetSpecies[];
    return [sides[0]!, petSpecies, sides[1]!];
  }, [petSpecies]);

  useEffect(() => {
    Animated.timing(sunrise, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
    Animated.sequence([
      Animated.delay(180),
      Animated.spring(island, { toValue: 1, friction: 6, tension: 60, useNativeDriver: NATIVE }),
    ]).start();
    Animated.loop(
      Animated.timing(rays, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: NATIVE }),
    ).start();
    Animated.timing(progress, {
      toValue: 0.92,
      duration: MIN_MS,
      easing: Easing.bezier(0.3, 0.7, 0.3, 1),
      useNativeDriver: NATIVE,
    }).start();

    const timers = [
      setTimeout(() => setStepIdx(1), 650),
      setTimeout(() => setStepIdx(2), 1500),
      setTimeout(() => setMinDone(true), MIN_MS),
    ];
    // Saltos por turnos cuando ya aterrizaron todos
    let t = 0;
    let interval: ReturnType<typeof setInterval> | undefined;
    const startTurns = setTimeout(() => {
      interval = setInterval(() => {
        setTurn(t % 3);
        t += 1;
      }, 620);
    }, 1500);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(startTurns);
      if (interval) clearInterval(interval);
    };
  }, [island, progress, rays, sunrise]);

  // Final: todos saltan juntos, el barco llega a la meta y se desvanece
  useEffect(() => {
    if (!minDone || !ready || finished.current) return;
    finished.current = true;
    setStepIdx(3);
    setCelebrate(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: NATIVE,
    }).start();
    const t = setTimeout(() => {
      Animated.timing(exit, {
        toValue: 0,
        duration: 380,
        easing: Easing.in(Easing.quad),
        useNativeDriver: NATIVE,
      }).start(finish);
      // Respaldo: si el sistema pausa las animaciones (app en segundo plano), igual se entra a la app.
      setTimeout(finish, 600);
    }, 650);
  }, [minDone, ready, exit, progress]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: exit, transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] },
      ]}
    >
      {/* Cielo al amanecer */}
      <LinearGradient
        colors={['#FFD9A8', '#FFEFD9', '#DDF2FF']}
        locations={[0, 0.35, 0.7]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sol con rayos girando */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.sun,
          {
            opacity: sunrise,
            transform: [{ translateY: sunrise.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
          },
        ]}
      >
        <Animated.View
          style={{ transform: [{ rotate: rays.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
        >
          <Svg width={180} height={180} viewBox="0 0 180 180">
            {Array.from({ length: 12 }).map((_, i) => (
              <Path
                key={i}
                d="M90 6 L97 40 L83 40 Z"
                fill="#FFE08A"
                opacity={0.55}
                transform={`rotate(${i * 30} 90 90)`}
              />
            ))}
          </Svg>
        </Animated.View>
        <View style={styles.sunCore} />
      </Animated.View>

      {/* Nubes */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.cloudA,
          { transform: [{ translateX: cloud.interpolate({ inputRange: [0, 1], outputRange: [-14, 18] }) }] },
        ]}
      >
        <CloudShape width={110} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.cloudB,
          { transform: [{ translateX: cloud.interpolate({ inputRange: [0, 1], outputRange: [12, -16] }) }] },
        ]}
      >
        <CloudShape width={78} />
      </Animated.View>

      {/* Mar */}
      <View pointerEvents="none" style={styles.sea}>
        <LinearGradient colors={['#7FDBF8', '#3FB0EC', '#2C8FD8']} style={StyleSheet.absoluteFill} />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: wave.interpolate({ inputRange: [0, 1], outputRange: [-8, 8] }) }] },
          ]}
        >
          <Svg
            width="120%"
            height={120}
            viewBox="0 0 480 120"
            preserveAspectRatio="none"
            style={{ marginLeft: '-10%' }}
          >
            {[18, 50, 82].map((y, r) =>
              Array.from({ length: 8 }).map((_, i) => (
                <Path
                  key={`${r}-${i}`}
                  d={`M${i * 64 + (r % 2) * 30} ${y} q6 -5 12 0 q6 -5 12 0`}
                  stroke="#FFFFFF"
                  strokeWidth={2.2}
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.75 - r * 0.15}
                />
              )),
            )}
          </Svg>
        </Animated.View>
      </View>

      <View style={styles.center}>
        {/* Escenario: isla que emerge + tripulación */}
        <Animated.View
          style={[
            styles.stage,
            {
              transform: [
                { translateY: island.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) },
                { scale: island.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.crewRow}>
            {crew.map((sp, i) => (
              <Hopper
                key={`${sp}-${i}`}
                species={sp}
                dropDelay={650 + i * 230}
                active={!celebrate && turn === i}
                celebrate={celebrate}
                greeting={GREETINGS[i]!}
                size={i === 1 ? 78 : 62}
              />
            ))}
          </View>
          <Svg width={260} height={92} viewBox="0 0 260 92" style={{ marginTop: -16 }}>
            <Ellipse cx={130} cy={66} rx={124} ry={20} fill="#B4F1FF" opacity={0.7} />
            <Ellipse cx={130} cy={58} rx={110} ry={18} fill="#E9C98A" stroke={INK} strokeWidth={2.4} />
            <Ellipse cx={130} cy={54} rx={108} ry={15} fill="#FFE6A8" />
            <Path
              d="M40 40 Q130 72 220 40 L220 46 Q200 56 180 50 Q160 60 140 54 Q120 62 100 54 Q80 60 62 50 Q50 54 40 46 Z"
              fill="#5ED68C"
              stroke={INK}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
            <Ellipse cx={130} cy={36} rx={92} ry={18} fill="#7DE3A0" stroke={INK} strokeWidth={2.4} />
            <Ellipse cx={110} cy={31} rx={40} ry={5} fill="#FFFFFF" opacity={0.3} />
            {/* Palmerita */}
            <G>
              <Path d="M236 58 Q238 40 246 26" stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />
              <Path d="M236 58 Q238 40 246 26" stroke="#B07A45" strokeWidth={4} strokeLinecap="round" fill="none" />
              {[
                [-16, 4],
                [-10, -9],
                [3, -12],
                [14, -6],
                [16, 6],
              ].map(([dx, dy], i) => (
                <Path
                  key={i}
                  d={`M246 26 Q${246 + dx! * 0.5} ${26 + dy! * 0.5 - 6} ${246 + dx!} ${26 + dy!} Q${246 + dx! * 0.55} ${26 + dy! * 0.5 + 1} 246 26 Z`}
                  fill={i % 2 ? '#2FB86A' : '#45D07F'}
                  stroke={INK}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
              ))}
            </G>
            <Rect x={20} y={48} width={14} height={9} rx={2} fill="#C68B59" stroke={INK} strokeWidth={1.6} />
            <Circle cx={30} cy={60} r={3} fill="#FFC94D" stroke={INK} strokeWidth={1.2} />
          </Svg>
        </Animated.View>

        <BrandLetters start={1250} />
        <Animated.Text style={[styles.tagline, { opacity: sunrise }]}>
          {tr('Aprende inglés jugando, una isla a la vez')}
        </Animated.Text>

        {/* Barco como barra de progreso */}
        <View style={styles.trackWrap}>
          <View style={styles.track}>
            <Svg width={TRACK_W} height={10} viewBox={`0 0 ${TRACK_W} 10`}>
              <Path
                d={`M4 5 H${TRACK_W - 4}`}
                stroke="#FFFFFF"
                strokeWidth={4}
                strokeDasharray="0.1 10"
                strokeLinecap="round"
              />
            </Svg>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.checkpoint,
                  { left: 8 + (i / 3) * (TRACK_W - 24) },
                  stepIdx >= i && { backgroundColor: '#FFC94D', borderColor: INK },
                ]}
              />
            ))}
            <Animated.View
              style={[
                styles.boat,
                {
                  transform: [
                    { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, TRACK_W - 30] }) },
                    { translateY: boatBob.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
                    { rotate: boatBob.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
                  ],
                },
              ]}
            >
              <Svg width={30} height={30} viewBox="0 0 24 24">
                <Path
                  d="M2 15 L22 15 L18 21 L6 21 Z"
                  fill="#B5603A"
                  stroke={INK}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
                <Path d="M12 15 V3" stroke={INK} strokeWidth={1.6} />
                <Path
                  d="M12.5 4 L20 13 L12.5 13 Z"
                  fill="#FFFFFF"
                  stroke={INK}
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                />
                <Path d="M12 3 L7 5 L12 7 Z" fill="#FF5A6E" stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
              </Svg>
            </Animated.View>
          </View>
          <Text style={styles.stepText}>{STEPS[stepIdx]}</Text>
        </View>
      </View>

      <View style={styles.tipBox}>
        <Glyph name="sparkle" size={22} />
        <Text style={styles.tipText}>{TIPS[tipIdx]}</Text>
      </View>
    </Animated.View>
  );
}

function CloudShape({ width }: { width: number }) {
  return (
    <Svg width={width} height={width * 0.45} viewBox="0 0 100 45">
      <Path
        d="M10 40 Q4 40 4 33 Q4 25 13 25 Q15 13 29 14 Q36 3 52 8 Q64 2 72 14 Q88 12 90 26 Q97 28 96 35 Q95 40 88 40 Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
    paddingBottom: 28,
  },
  sun: {
    position: 'absolute',
    top: 18,
    right: -34,
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunCore: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#FFC94D',
    borderWidth: 6,
    borderColor: '#FFE7A8',
  },
  cloudA: { position: 'absolute', top: 96, left: 18, opacity: 0.95 },
  cloudB: { position: 'absolute', top: 190, right: 40, opacity: 0.8 },
  sea: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', overflow: 'hidden' },
  center: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  stage: { alignItems: 'center', marginBottom: 4 },
  crewRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, zIndex: 2 },
  shadow: { height: 7, borderRadius: 4, backgroundColor: INK, marginTop: -2 },
  bubble: { position: 'absolute', top: -30, left: -34, right: -34, alignItems: 'center', zIndex: 3 },
  bubblePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: INK,
  },
  bubbleText: { fontSize: 12, fontWeight: '900', color: INK },
  brandRow: { flexDirection: 'row' },
  brandLetter: { fontSize: 44, fontWeight: '900', letterSpacing: -1.4, color: INK },
  tagline: { fontSize: 15, fontWeight: '700', color: THEME.ink2, textAlign: 'center', marginTop: -6 },
  trackWrap: { alignItems: 'center', gap: 8, marginTop: 8 },
  track: {
    width: TRACK_W,
    height: 34,
    justifyContent: 'center',
    backgroundColor: 'rgba(44,143,216,0.55)',
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  checkpoint: {
    position: 'absolute',
    top: 11,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  boat: { position: 'absolute', left: 0, top: -4 },
  stepText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 4,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '88%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: INK,
    borderBottomWidth: 5,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18, color: INK, fontWeight: '700' },
});
