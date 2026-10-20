import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../i18n';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import {
  CEFR_LEVEL_META,
  CEFR_LEVELS,
  PLACEMENT_QUESTIONS,
  scorePlacementTest,
  type PlacementResult,
  type PracticeLevel,
} from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame, type PlayerAccount } from '../context/GameContext';
import { AnimatedMiniFlame } from '../components/FireStreakCard';
import { LEVEL_DIFFICULTY_ES } from '../components/GameIslands';
import { OptionButton } from '../components/MultipleChoice';
import { Pet3D } from '../components/Pet3D';
import {
  AnimatedBar,
  Float,
  haptic,
  PressableScale,
  Reveal,
  useTiltOffset,
} from '../components/motion';
import {
  Badge,
  Button,
  Chip,
  ui,
} from '../components/ui';
import {
  DEFAULT_PET,
  levelFromXp,
  randomizeTomodachiPet,
  SPECIES,
  SPECIES_PRESET_COLORS,
  type PetConfig,
  type PetSpecies,
  type PetMood,
} from '../game/pet';
import { MiiCreator } from '../components/MiiCreator';
import { playSfx } from '../services/sfx';
import { speakEnglishPhrase } from '../services/speech';
import { GRADIENTS, petTint, SHADOW, THEME, TYPE } from '../theme/colors';
import { Glyph } from '../components/Glyph';

const SUGGESTED_PET_NAMES = ['Puffy', 'Michi', 'Lumo', 'Draco', 'Pip', 'Mochi', 'Kiko', 'Bruma'];
const TOON_INK = '#1E2436';

type AuthView = 'landing' | 'login' | 'register';
type RegisterStep = 1 | 2 | 3 | 4 | 5;

/**
 * Fondo animado 2D estilo Waterllama (malla orgánica + destellos + cubos low-poly flotantes).
 */
function AnimatedShowcaseBackdrop({
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

export function AuthScreen() {
  const { accounts, loginWithAccount, loginWithCredentials, registerAccount } =
    useGame();
  const { locale, speakWithPip } = useAppState();
  const tilt = useTiltOffset(9);

  const [view, setView] = useState<AuthView>('landing');
  const [step, setStep] = useState<RegisterStep>(1);

  // Estado de Login
  const [selectedAccount, setSelectedAccount] = useState<PlayerAccount | null>(
    accounts[0] ?? null
  );
  const [showManualLogin, setShowManualLogin] = useState(accounts.length === 0);
  const [loginInput, setLoginInput] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Paso 1: Identidad del jugador
  const [playerName, setPlayerName] = useState('');
  const [handle, setHandle] = useState('');
  const [showPinField, setShowPinField] = useState(false);
  const [pin, setPin] = useState('');

  // Paso 2: Mascota 3D estilo Tomodachi Life
  const [petName, setPetName] = useState(DEFAULT_PET.name);
  // Lo que nacerá del huevo: por defecto el chibi redondito, que el jugador viste a su gusto.
  const [draft, setDraft] = useState<PetConfig>(() => ({
    ...DEFAULT_PET,
    species: 'puff',
    eyeStyle: 'sparkle',
    blushStyle: 'pink',
    browStyle: 'none',
    mouthStyle: 'smile',
    outfit: 'none',
    accessory: 'none',
    height: 0.5,
    weight: 0.5,
  }));
  const [reactKey, setReactKey] = useState(0);

  const currentPetDraft: PetConfig = { ...draft, name: petName.trim() || 'Pip', customNamed: Boolean(petName.trim()) };

  // Paso 3 y 4: Nivel o Examen de Nivelación
  const [level, setLevel] = useState<PracticeLevel>('B1');
  const [examIdx, setExamIdx] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [pickedOption, setPickedOption] = useState<number | null>(null);
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);

  const [registerError, setRegisterError] = useState<string | null>(null);

  const previewTint = petTint(draft.bodyColor, 0.85);
  const autoHandle =
    handle.trim() ||
    (playerName.trim()
      ? `@${playerName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')}`
      : '@jugador');

  const handleSelectSpeciesPreset = (spId: PetSpecies) => {
    const preset = SPECIES_PRESET_COLORS[spId];
    haptic('select');
    setDraft((d) => ({
      ...d,
      species: spId,
      bodyColor: preset.bodyColor,
      bellyColor: preset.bellyColor,
    }));
    setReactKey((k) => k + 1);
  };

  const handleRandomizeTomodachi = () => {
    haptic('success');
    setDraft(randomizeTomodachiPet(petName));
    setReactKey((k) => k + 1);
  };

  const handleQuickAccountSelect = (acc: PlayerAccount) => {
    setLoginError(null);
    setSelectedAccount(acc);
    if (!acc.pin) {
      haptic('success');
      loginWithAccount(acc.id);
    } else {
      setLoginInput(acc.handle);
      setLoginPin('');
    }
  };

  const handleManualLogin = () => {
    setLoginError(null);
    if (
      selectedAccount &&
      (!loginInput.trim() || loginInput === selectedAccount.handle)
    ) {
      const res = loginWithAccount(selectedAccount.id, loginPin);
      if (!res.ok) setLoginError(res.error ?? 'No se pudo iniciar sesión.');
      else haptic('success');
      return;
    }
    const res = loginWithCredentials(loginInput, loginPin);
    if (!res.ok) setLoginError(res.error ?? 'No se pudo iniciar sesión.');
    else haptic('success');
  };

  const startExam = () => {
    haptic('select');
    setExamIdx(0);
    setExamAnswers({});
    setPickedOption(null);
    setPlacementResult(null);
    setStep(4);
  };

  const handleExamPick = (optIdx: number) => {
    if (pickedOption !== null) return;
    const currentQ = PLACEMENT_QUESTIONS[examIdx]!;
    setPickedOption(optIdx);
    setExamAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
  };

  const handleNextExamQuestion = (finishEarly = false) => {
    const isLast = examIdx >= PLACEMENT_QUESTIONS.length - 1 || finishEarly;
    if (isLast) {
      const result = scorePlacementTest(examAnswers);
      setPlacementResult(result);
      setLevel(result.deducedLevel);
      setStep(5);
      playSfx('fanfare');
      return;
    }
    setExamIdx((i) => i + 1);
    setPickedOption(null);
  };

  const handleFinishRegistration = () => {
    setRegisterError(null);
    const res = registerAccount({
      playerName: playerName.trim() || 'Jugador',
      handle: autoHandle,
      pin: showPinField ? pin.trim() : '',
      level,
      pet: currentPetDraft,
    });
    if (!res.ok) {
      setRegisterError(res.error ?? 'Error al crear la cuenta.');
      return;
    }
    haptic('success');
  };

  /* ===================================================================== */
  /* VISTA 0: BIENVENIDA INTERACTIVA INSPIRADA EN EL VIDEO (POOL/SKY CANVAS)*/
  /* ===================================================================== */
  if (view === 'landing') {
    return (
      <View style={{ flex: 1 }}>
        <AnimatedShowcaseBackdrop variant="pool" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.landingContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Barra superior flotante minimalista */}
          <Reveal index={0} style={styles.landingTopBar}>
            <View style={styles.brandGlassPill}>
              <MaterialCommunityIcons name="island" size={18} color="#FFFFFF" />
              <Text style={styles.brandGlassText}>LingoPulse</Text>
            </View>

            {accounts.length > 0 ? (
              <PressableScale
                onPress={() => {
                  haptic('select');
                  setView('login');
                }}
                style={styles.skipGlassPill}
              >
                <Text style={styles.skipGlassText}>ENTRAR ({accounts.length})</Text>
              </PressableScale>
            ) : null}
          </Reveal>

          {/* Escenario 3D interactivo central (sin cajas pesadas, flotando con física de inclinación) */}
          <Reveal index={1} style={styles.landingCenterStage}>
            <PressableScale
              onPress={() => {
                speakWithPip(
                  `Hi! I'm ${petName.trim() || 'your new buddy'}. Pick your favorite 3D companion and let's conquer the islands!`
                );
                setReactKey((k) => k + 1);
              }}
              hapticKind="light"
              style={styles.floatingSpeechPill}
            >
              <Ionicons name="volume-high" size={16} color={THEME.blue} />
              <Text style={styles.floatingSpeechText}>
                “{petName.trim() ? `Hi! I’m ${petName.trim()}. ` : 'Hi! '}Tap me or tilt your phone!”
              </Text>
            </PressableScale>

            <Animated.View
              style={[
                styles.heroFloatRing,
                { transform: [{ translateX: tilt.x }, { translateY: tilt.y }] },
              ]}
            >
              {/* Salvavidas / Halo 2D colorido detrás del modelo 3D como en el video */}
              <View style={styles.innerTubeHalo}>
                <Pet3D
                  config={currentPetDraft}
                  mood="happy"
                  size={246}
                  reactKey={reactKey}
                  onTap={() => setReactKey((k) => k + 1)}
                  backgroundColor="transparent"
                />
              </View>
            </Animated.View>

            {/* Selector rápido de personaje 3D en vivo desde la portada */}
            <View style={styles.speciesQuickRow}>
              {SPECIES.map((sp) => {
                const active = draft.species === sp.id;
                return (
                  <PressableScale
                    key={sp.id}
                    onPress={() => handleSelectSpeciesPreset(sp.id)}
                    scaleTo={0.9}
                    hapticKind="select"
                    style={[
                      styles.speciesQuickOrb,
                      active && styles.speciesQuickOrbActive,
                    ]}
                  >
                    <Glyph name={sp.glyph} size={31} />
                  </PressableScale>
                );
              })}
            </View>
          </Reveal>

          {/* Copy + Botones inferiores tipo píldora limpia como en el video */}
          <Reveal index={2} style={styles.landingBottomBlock}>
            <Text style={styles.poolHeroTitle}>
              Aprende inglés explorando islas con tu compañero 3D
            </Text>
            <Text style={styles.poolHeroSub}>
              Islas minimalistas por nivel, voz con IA, efectos de juego y tu mascota acompañándote en cada paso.
            </Text>

            <View style={styles.landingCtaStack}>
              <PressableScale
                onPress={() => {
                  haptic('select');
                  setView('register');
                  setStep(1);
                }}
                scaleTo={0.96}
                style={[styles.whiteHeroCta, SHADOW.float]}
              >
                <Text style={styles.whiteHeroCtaText}>Comenzar aventura</Text>
                <View style={styles.whiteHeroCtaArrow}>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              </PressableScale>

              <PressableScale
                onPress={() => {
                  haptic('select');
                  setView('login');
                }}
                scaleTo={0.97}
                style={styles.translucentSecondaryCta}
              >
                <Ionicons name="person-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.translucentSecondaryCtaText}>
                  {accounts.length > 0
                    ? `Ya tengo cuenta (${accounts.length} ${accounts.length === 1 ? 'jugador' : 'jugadores'})`
                    : 'Ya tengo una cuenta'}
                </Text>
              </PressableScale>
            </View>
          </Reveal>
        </ScrollView>
      </View>
    );
  }

  /* ===================================================================== */
  /* VISTA 1: LOGIN MINIMALISTA EN ESPACIO ABIERTO CON COMPAÑERO 3D         */
  /* ===================================================================== */
  if (view === 'login') {
    const previewAcc = selectedAccount ?? accounts[0] ?? null;

    return (
      <View style={{ flex: 1 }}>
        <AnimatedShowcaseBackdrop variant="pastel" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.openCanvasContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topNavRow}>
            <PressableScale
              onPress={() => setView('landing')}
              style={styles.roundNavBtn}
            >
              <Ionicons name="arrow-back" size={20} color={THEME.ink} />
            </PressableScale>
            <Text style={styles.navPillLabel}>BIENVENIDO DE VUELTA</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* El Tamagotchi del jugador seleccionado te recibe en 3D */}
          <Reveal index={0} style={styles.centerHeroBlock}>
            <Pet3D
              config={
                previewAcc
                  ? {
                      name: previewAcc.petSummary.name,
                      species: previewAcc.petSummary.species,
                      bodyColor: previewAcc.petSummary.bodyColor,
                      bellyColor: '#FFF5D6',
                      eyeStyle: 'sparkle',
                      accessory: 'crown',
                    }
                  : currentPetDraft
              }
              mood="happy"
              size={165}
              reactKey={reactKey}
              onTap={() => setReactKey((k) => k + 1)}
              backgroundColor="transparent"
            />
            <Text style={styles.openCanvasTitle}>Elige tu isla de jugador</Text>
            <Text style={styles.openCanvasSubtitle}>
              Toca tu perfil para retomar tus islas del nivel elegido y tu racha.
            </Text>
          </Reveal>

          {accounts.length > 0 ? (
            <Reveal index={1} style={{ width: '100%', gap: 10 }}>
              {accounts.map((acc) => {
                const isSelected = selectedAccount?.id === acc.id;
                const playerLvl = levelFromXp(acc.statsSummary.xp);
                const spMeta =
                  SPECIES.find((s) => s.id === acc.petSummary.species) ?? SPECIES[0]!;
                return (
                  <PressableScale
                    key={acc.id}
                    onPress={() => handleQuickAccountSelect(acc)}
                    style={[
                      styles.floatingAccountPill,
                      isSelected && styles.floatingAccountPillSelected,
                      SHADOW.card,
                    ]}
                  >
                    <View
                      style={[
                        styles.accountPetOrb,
                        { backgroundColor: acc.petSummary.bodyColor },
                      ]}
                    >
                      <Glyph name={spMeta.glyph} size={37} />
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={ui.row}>
                        <Text style={styles.accountName}>{acc.playerName}</Text>
                        <View
                          style={[
                            styles.accountLevelChip,
                            {
                              backgroundColor: `${CEFR_LEVEL_META[acc.statsSummary.level].color}20`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.accountLevelChipText,
                              { color: CEFR_LEVEL_META[acc.statsSummary.level].color },
                            ]}
                          >
                            Islas {acc.statsSummary.level}
                          </Text>
                        </View>
                        {acc.pin ? (
                          <Ionicons name="lock-closed" size={13} color={THEME.ink3} />
                        ) : null}
                      </View>
                      <Text style={styles.accountSub}>
                        {acc.petSummary.name} · Nv. {playerLvl} · {acc.statsSummary.xp} XP
                      </Text>
                    </View>

                    {/* Mini fueguito animado en cada perfil */}
                    <View style={styles.accountFlameBox}>
                      <AnimatedMiniFlame lit={acc.statsSummary.streak > 0} size={26} />
                      <Text style={styles.accountFlameDays}>
                        {acc.statsSummary.streak}d
                      </Text>
                    </View>
                  </PressableScale>
                );
              })}

              {selectedAccount?.pin ? (
                <View style={styles.openPinSheet}>
                  <Text style={TYPE.headline}>
                    PIN de {selectedAccount.playerName}
                  </Text>
                  <TextInput
                    value={loginPin}
                    onChangeText={setLoginPin}
                    placeholder="Ingresa tu PIN"
                    placeholderTextColor={THEME.ink3}
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={8}
                    style={styles.pillInput}
                  />
                  {loginError ? (
                    <Text style={styles.errorText}>{loginError}</Text>
                  ) : null}
                  <Button
                    label={`Entrar como ${selectedAccount.playerName}`}
                    icon="arrow-forward"
                    variant="gold"
                    onPress={handleManualLogin}
                  />
                </View>
              ) : null}
            </Reveal>
          ) : null}

          <Reveal index={2} style={{ width: '100%', gap: 12 }}>
            {accounts.length > 0 && !showManualLogin ? (
              <Button
                label="Ingresar con otro @usuario"
                icon="key-outline"
                variant="secondary"
                onPress={() => setShowManualLogin(true)}
              />
            ) : (
              <View style={styles.openFormBox}>
                <TextInput
                  value={loginInput}
                  onChangeText={(t) => {
                    setLoginInput(t);
                    setLoginError(null);
                  }}
                  placeholder="Tu nombre o @usuario"
                  placeholderTextColor={THEME.ink3}
                  autoCapitalize="none"
                  style={styles.pillInput}
                />
                <TextInput
                  value={loginPin}
                  onChangeText={(t) => {
                    setLoginPin(t);
                    setLoginError(null);
                  }}
                  placeholder="PIN (dejar vacío si no tienes)"
                  placeholderTextColor={THEME.ink3}
                  secureTextEntry
                  style={styles.pillInput}
                />
                {loginError ? (
                  <Text style={styles.errorText}>{loginError}</Text>
                ) : null}
                <Button
                  label="Entrar a mi cuenta"
                  icon="arrow-forward"
                  variant="primary"
                  onPress={handleManualLogin}
                />
              </View>
            )}

            <Button
              label="Crear nuevo jugador y compañero 3D"
              icon="sparkles"
              variant="ghost"
              onPress={() => {
                setView('register');
                setStep(1);
              }}
            />
          </Reveal>
        </ScrollView>
      </View>
    );
  }

  /* ===================================================================== */
  /* PASO 3 DE REGISTRO: PANTALLA TURQUESA "TU META / NIVEL CEFR"           */
  /* (Inspirada directamente en la pantalla turquesa 2,000ml del video)    */
  /* ===================================================================== */
  if (step === 3) {
    const meta = CEFR_LEVEL_META[level];
    const diffLabel = LEVEL_DIFFICULTY_ES[level];

    return (
      <View style={{ flex: 1 }}>
        <AnimatedShowcaseBackdrop variant="teal" />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.tealGoalContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Barra superior con botón atrás y botón SKIP como en el video */}
          <View style={styles.topNavRow}>
            <PressableScale
              onPress={() => setStep(2)}
              style={styles.tealRoundBackBtn}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </PressableScale>

            <View style={styles.stepDotsRow}>
              {[1, 2, 3, 4].map((d) => (
                <View
                  key={d}
                  style={[
                    styles.stepDot,
                    d === 3 && styles.stepDotActiveWhite,
                  ]}
                />
              ))}
            </View>

            <PressableScale
              onPress={handleFinishRegistration}
              style={styles.tealSkipBtn}
            >
              <Text style={styles.tealSkipText}>SKIP</Text>
            </PressableScale>
          </View>

          {/* Compañero 3D flotando arriba como el Capibara en la pantalla turquesa */}
          <Reveal index={0} style={styles.tealMascotStage}>
            <Float amplitude={7} duration={2400}>
              <Pet3D
                config={currentPetDraft}
                mood="happy"
                size={172}
                reactKey={reactKey}
                onTap={() => setReactKey((k) => k + 1)}
                backgroundColor="transparent"
              />
            </Float>
          </Reveal>

          {/* Indicador Gigante Central del Nivel Elegido (estilo "2,000ml" del video) */}
          <Reveal index={1} style={styles.tealGoalCenter}>
            <View style={styles.tealEyebrowRow}>
              <Text style={styles.tealEyebrowText}>
                Nivel de islas seleccionado
              </Text>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="rgba(255,255,255,0.85)"
              />
            </View>

            <Text style={styles.tealGiantLevelText}>
              {level} · {diffLabel}
            </Text>

            <Text style={styles.tealLevelTitleText}>{meta.titleEs}</Text>
            <Text style={styles.tealLevelSummaryText}>
              {meta.summaryEs} Solo se mostrarán las islas de nivel {level} en tu mapa.
            </Text>

            {/* Selector táctil horizontal A1 a C2 */}
            <View style={styles.tealLevelPillsRow}>
              {CEFR_LEVELS.map((lvlId) => {
                const active = level === lvlId;
                return (
                  <PressableScale
                    key={lvlId}
                    onPress={() => {
                      haptic('select');
                      setLevel(lvlId);
                      setReactKey((k) => k + 1);
                    }}
                    scaleTo={0.92}
                    style={[
                      styles.tealLevelOrb,
                      active && styles.tealLevelOrbActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tealLevelOrbText,
                        active && styles.tealLevelOrbTextActive,
                      ]}
                    >
                      {lvlId}
                    </Text>
                    <Text
                      style={[
                        styles.tealLevelOrbSub,
                        active && { color: '#0C8B99' },
                      ]}
                    >
                      {LEVEL_DIFFICULTY_ES[lvlId].split(' ')[0]}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>

            {/* Botón "Calculate your goal" -> Examen de Nivelación Adaptativo */}
            <PressableScale
              onPress={startExam}
              scaleTo={0.96}
              style={styles.calculateGoalPill}
            >
              <Ionicons name="compass" size={18} color="#FFE082" />
              <Text style={styles.calculateGoalText}>
                ¿No sabes tu nivel? Calcúlalo con el Examen Rápido
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </PressableScale>
          </Reveal>

          {/* CTA Blanco en forma de píldora inferior */}
          <Reveal index={2} style={{ width: '100%' }}>
            {registerError ? (
              <Text style={[styles.errorText, { color: '#FFE4E6', textAlign: 'center', marginBottom: 8 }]}>
                {registerError}
              </Text>
            ) : null}
            <PressableScale
              onPress={handleFinishRegistration}
              scaleTo={0.96}
              style={[styles.whiteHeroCta, SHADOW.float]}
            >
              <Text style={[styles.whiteHeroCtaText, { color: '#0C8B99' }]}>
                Entrar a mis Islas {level} ({diffLabel})
              </Text>
              <View style={[styles.whiteHeroCtaArrow, { backgroundColor: '#0C8B99' }]}>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </View>
            </PressableScale>
          </Reveal>
        </ScrollView>
      </View>
    );
  }

  /* ===================================================================== */
  /* PASOS 1, 2, 4 y 5 DE REGISTRO EN LIENZO ABIERTO (ESTILO WATERLLAMA)   */
  /* ===================================================================== */
  const progressRatio =
    step === 1 ? 0.25 : step === 2 ? 0.5 : step === 4 ? 0.85 : 1;

  const handleBackInRegister = () => {
    setRegisterError(null);
    if (step === 1) setView('landing');
    else if (step === 2) setStep(1);
    else if (step === 4) setStep(3);
    else if (step === 5) setStep(3);
  };

  const currentExamQ = PLACEMENT_QUESTIONS[examIdx]!;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: step === 2 ? previewTint : '#F4F9FF',
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.openCanvasContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de navegación limpia con progreso */}
        <View style={styles.topNavRow}>
          <PressableScale onPress={handleBackInRegister} style={styles.roundNavBtn}>
            <Ionicons name="arrow-back" size={20} color={THEME.ink} />
          </PressableScale>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <AnimatedBar value={progressRatio} colors={GRADIENTS.daily} height={9} />
          </View>
          <Text style={styles.stepCounterText}>
            {step === 4
              ? `${examIdx + 1}/${PLACEMENT_QUESTIONS.length}`
              : `${Math.min(step, 4)}/4`}
          </Text>
        </View>

        {/* PASO 1: IDENTIDAD EN ESPACIO ABIERTO CON TU COMPAÑERO 3D */}
        {step === 1 && (
          <Reveal index={0} style={styles.openStepWrap}>
            <Pet3D
              config={currentPetDraft}
              stage="egg"
              growth={0.2}
              mood="happy"
              size={170}
              reactKey={reactKey}
              onTap={() => setReactKey((k) => k + 1)}
              backgroundColor="transparent"
            />

            <Text style={styles.openCanvasTitle}>¿Cómo te llamas?</Text>
            <Text style={styles.openCanvasSubtitle}>
              Tu compañero 3D te acompañará por cada isla guardando tu progreso y tu racha.
            </Text>

            <View style={styles.openInputsStack}>
              <TextInput
                value={playerName}
                onChangeText={(t) => {
                  setPlayerName(t.slice(0, 24));
                  setRegisterError(null);
                }}
                placeholder="Tu nombre (ej. Luis, Valentina...)"
                placeholderTextColor={THEME.ink3}
                style={[styles.pillInput, styles.pillInputLarge]}
              />

              <TextInput
                value={handle}
                onChangeText={setHandle}
                placeholder={`Alias opcional (${autoHandle})`}
                placeholderTextColor={THEME.ink3}
                autoCapitalize="none"
                style={styles.pillInput}
              />

              <PressableScale
                onPress={() => setShowPinField((v) => !v)}
                style={styles.optionalToggle}
              >
                <Ionicons
                  name={showPinField ? 'lock-closed' : 'lock-open-outline'}
                  size={15}
                  color={THEME.ink2}
                />
                <Text style={styles.optionalToggleText}>
                  {showPinField
                    ? 'Ocultar PIN opcional'
                    : 'Añadir PIN opcional (si compartes el dispositivo)'}
                </Text>
              </PressableScale>

              {showPinField && (
                <TextInput
                  value={pin}
                  onChangeText={(t) => setPin(t.slice(0, 8))}
                  placeholder="PIN de 4 dígitos"
                  placeholderTextColor={THEME.ink3}
                  secureTextEntry
                  keyboardType="number-pad"
                  style={styles.pillInput}
                />
              )}
            </View>

            {registerError ? (
              <Text style={styles.errorText}>{registerError}</Text>
            ) : null}

            <PressableScale
              onPress={() => {
                if (!playerName.trim()) {
                  setRegisterError('Escribe tu nombre para comenzar.');
                  return;
                }
                haptic('select');
                setStep(2);
                setReactKey((k) => k + 1);
              }}
              scaleTo={0.96}
              style={[styles.primaryToonCta, SHADOW.float]}
            >
              <Text style={styles.primaryToonCtaText}>Elegir mi compañero 3D</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </PressableScale>
          </Reveal>
        )}

        {/* PASO 2: CREADOR DE MASCOTA 3D ESTILO TOMODACHI LIFE */}
        {step === 2 && (
          <Reveal index={0} style={styles.openStepWrap}>
            <View style={[ui.rowBetween, { width: '100%' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.openCanvasTitle, { textAlign: 'left', fontSize: 24 }]}>
                  Crea tu compañero
                </Text>
                <Text style={[styles.openCanvasSubtitle, { textAlign: 'left' }]}>
                  Diseña quién nacerá de tu huevo: cara, pelo, ropa y voz.
                </Text>
              </View>
              <PressableScale
                onPress={handleRandomizeTomodachi}
                hapticKind="medium"
                style={{
                  backgroundColor: '#FFF3D6',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: '#F5B841',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#A16207' }}>
                  Sorpréndeme
                </Text>
              </PressableScale>
            </View>

            <View style={{ width: '100%', gap: 10 }}>
              <TextInput
                value={petName}
                onChangeText={(t) => {
                  setPetName(t.slice(0, 14));
                  setRegisterError(null);
                }}
                placeholder="Nombre de tu compañero"
                placeholderTextColor={THEME.ink3}
                style={[styles.pillInput, styles.pillInputCentered]}
              />
              <View style={[ui.rowWrap, { justifyContent: 'center' }]}>
                {SUGGESTED_PET_NAMES.map((n) => (
                  <Chip
                    key={n}
                    label={n}
                    active={petName === n}
                    onPress={() => {
                      setPetName(n);
                      setReactKey((k) => k + 1);
                    }}
                  />
                ))}
              </View>
            </View>

            <MiiCreator
              pet={currentPetDraft}
              onChangePet={(patch) => {
                setDraft((d) => ({ ...d, ...patch }));
                setRegisterError(null);
              }}
              playerLevel={1}
              previewSize={230}
              onSpeakSample={(text, pitch, rate) =>
                speakEnglishPhrase(`Hi! I am ${petName.trim() || 'Pip'}. ${text}`, locale, { pitch, rate })
              }
            />

            {registerError ? <Text style={styles.errorText}>{registerError}</Text> : null}

            <PressableScale
              onPress={() => {
                if (!petName.trim()) {
                  setRegisterError('Ponle un nombre a tu mascota.');
                  return;
                }
                haptic('select');
                setStep(3);
              }}
              scaleTo={0.96}
              style={[styles.primaryToonCta, SHADOW.float]}
            >
              <Text style={styles.primaryToonCtaText}>Elegir mi nivel de islas</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </PressableScale>
          </Reveal>
        )}

        {/* PASO 4: EXAMEN RÁPIDO ADAPTATIVO */}
        {step === 4 && (
          <Reveal index={0} key={currentExamQ.id} style={styles.openStepWrap}>
            <View style={[ui.rowBetween, { width: '100%' }]}>
              <Badge
                label={`Nivel ${currentExamQ.level} · ${currentExamQ.skillLabelEs}`}
                bg="#EAF3FF"
                color={THEME.blue}
                icon="compass"
              />
              {examIdx >= 3 && (
                <PressableScale onPress={() => handleNextExamQuestion(true)}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: THEME.blue }}>
                    Ver resultado ya →
                  </Text>
                </PressableScale>
              )}
            </View>

            <Text style={styles.openCanvasTitle}>{currentExamQ.questionEn}</Text>
            <Text style={styles.openCanvasSubtitle}>{currentExamQ.promptEs}</Text>

            {currentExamQ.audioTextEn ? (
              <PressableScale
                onPress={() => speakEnglishPhrase(currentExamQ.audioTextEn!, locale)}
                style={styles.examAudioPill}
              >
                <Ionicons name="volume-high" size={20} color="#FFFFFF" />
                <Text style={styles.examAudioPillText}>Escuchar pista de voz</Text>
              </PressableScale>
            ) : null}

            <View style={{ width: '100%', gap: 10 }}>
              {currentExamQ.options.map((opt, idx) => {
                const isAnswer = idx === currentExamQ.answerIndex;
                const state =
                  pickedOption === null
                    ? 'idle'
                    : pickedOption === idx
                      ? isAnswer
                        ? 'right'
                        : 'wrong'
                      : isAnswer
                        ? 'reveal'
                        : 'idle';
                return (
                  <OptionButton
                    key={opt}
                    label={opt}
                    state={state}
                    disabled={pickedOption !== null}
                    onPress={() => handleExamPick(idx)}
                  />
                );
              })}
            </View>

            {pickedOption !== null && (
              <View style={styles.examNextBox}>
                <Text style={TYPE.footnote}>{currentExamQ.explanationEs}</Text>
                <Button
                  label={
                    examIdx >= PLACEMENT_QUESTIONS.length - 1
                      ? 'Revelar mi nivel de islas'
                      : 'Siguiente pregunta'
                  }
                  icon="arrow-forward"
                  variant="gold"
                  onPress={() => handleNextExamQuestion(false)}
                />
              </View>
            )}
          </Reveal>
        )}

        {/* PASO 5: RESULTADO DEL EXAMEN Y LANZAMIENTO */}
        {step === 5 && (
          <Reveal index={0} style={styles.openStepWrap}>
            <Badge
              label={
                placementResult
                  ? `Nivel deducido · ${placementResult.scorePercent}%`
                  : `Nivel seleccionado · ${level}`
              }
              bg="#FFF6E0"
              color={THEME.gold}
              icon="trophy"
            />
            <Pet3D
              config={currentPetDraft}
              stage="egg"
              growth={0.6}
              mood="happy"
              size={190}
              reactKey={reactKey}
              backgroundColor="transparent"
            />
            <Text style={styles.openCanvasTitle}>
              {CEFR_LEVEL_META[level].titleEs} ({LEVEL_DIFFICULTY_ES[level]})
            </Text>
            <Text style={styles.openCanvasSubtitle}>
              Hemos preparado únicamente las islas de nivel {level} para ti y {petName}.
            </Text>

            <View style={[ui.rowWrap, { justifyContent: 'center' }]}>
              {CEFR_LEVELS.map((l) => (
                <Chip
                  key={l}
                  label={`${l} · ${LEVEL_DIFFICULTY_ES[l]}`}
                  active={level === l}
                  onPress={() => setLevel(l)}
                />
              ))}
            </View>

            <PressableScale
              onPress={handleFinishRegistration}
              scaleTo={0.96}
              style={[styles.primaryToonCta, SHADOW.float]}
            >
              <Text style={styles.primaryToonCtaText}>
                Entrar a mis Islas {level}
              </Text>
              <Ionicons name="rocket" size={18} color="#FFFFFF" />
            </PressableScale>
          </Reveal>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  watermarkWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 65,
    alignItems: 'center',
  },
  watermarkText: {
    fontSize: 64,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.14)',
    letterSpacing: -2,
  },
  landingContainer: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 16,
  },
  landingTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  brandGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  brandGlassText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  skipGlassPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  skipGlassText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  landingCenterStage: {
    alignItems: 'center',
    gap: 10,
  },
  floatingSpeechPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 2.2,
    borderColor: TOON_INK,
    borderBottomWidth: 4,
    ...SHADOW.card,
  },
  floatingSpeechText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
  },
  heroFloatRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerTubeHalo: {
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speciesQuickRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  speciesQuickOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  speciesQuickOrbActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: TOON_INK,
    transform: [{ scale: 1.08 }],
  },
  landingBottomBlock: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  poolHeroTitle: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  poolHeroSub: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  landingCtaStack: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  whiteHeroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingLeft: 22,
    paddingRight: 10,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: TOON_INK,
    borderBottomWidth: 5,
  },
  whiteHeroCtaText: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.ink,
    letterSpacing: -0.3,
  },
  whiteHeroCtaArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translucentSecondaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  translucentSecondaryCtaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  openCanvasContainer: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 38,
    gap: 18,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  roundNavBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TOON_INK,
    borderBottomWidth: 3.5,
  },
  navPillLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: THEME.ink2,
    letterSpacing: 0.8,
  },
  stepCounterText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink2,
    minWidth: 36,
    textAlign: 'right',
  },
  centerHeroBlock: {
    alignItems: 'center',
    gap: 6,
  },
  openStepWrap: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  openCanvasTitle: {
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
    color: THEME.ink,
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  openCanvasSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: THEME.ink2,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  openInputsStack: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  pillInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.ink,
    borderWidth: 2.2,
    borderColor: TOON_INK,
    borderBottomWidth: 4,
  },
  pillInputLarge: {
    fontSize: 18,
    fontWeight: '800',
  },
  pillInputCentered: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '900',
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  optionalToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.ink2,
  },
  primaryToonCta: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: THEME.blue,
    paddingVertical: 15,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: TOON_INK,
    borderBottomWidth: 5,
    marginTop: 4,
  },
  primaryToonCtaText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  floatingAccountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 13,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#DCE5F5',
    borderBottomWidth: 4,
  },
  floatingAccountPillSelected: {
    borderColor: TOON_INK,
    backgroundColor: '#FFFDF7',
  },
  accountPetOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '900',
    color: THEME.ink,
  },
  accountLevelChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  accountLevelChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  accountSub: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.ink2,
  },
  accountFlameBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  accountFlameDays: {
    fontSize: 11,
    fontWeight: '900',
    color: '#C84B00',
    marginTop: -2,
  },
  openPinSheet: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 24,
    gap: 10,
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  openFormBox: {
    gap: 10,
    width: '100%',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.red,
  },
  customTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    padding: 4,
    gap: 4,
    width: '100%',
    borderWidth: 1.8,
    borderColor: TOON_INK,
  },
  customTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  customTabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOW.card,
  },
  customTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.ink2,
  },
  customTabTextActive: {
    color: THEME.ink,
    fontWeight: '900',
  },
  customPanelGlass: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  swatchRing: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: TOON_INK,
  },
  /* Estilos de la pantalla turquesa de Meta / Nivel CEFR (inspirada en el video) */
  tealGoalContainer: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 14,
  },
  tealRoundBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  stepDotActiveWhite: {
    width: 22,
    backgroundColor: '#FFFFFF',
  },
  tealSkipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tealSkipText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  tealMascotStage: {
    alignItems: 'center',
    marginVertical: -6,
  },
  tealGoalCenter: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  tealEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tealEyebrowText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  tealGiantLevelText: {
    fontSize: 44,
    lineHeight: 50,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    textAlign: 'center',
  },
  tealLevelTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E0F2FE',
    textAlign: 'center',
  },
  tealLevelSummaryText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  tealLevelPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  tealLevelOrb: {
    minWidth: 68,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    alignItems: 'center',
  },
  tealLevelOrbActive: {
    backgroundColor: '#FFFFFF',
    borderColor: TOON_INK,
    borderBottomWidth: 4,
    transform: [{ scale: 1.06 }],
  },
  tealLevelOrbText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tealLevelOrbTextActive: {
    color: '#0C8B99',
  },
  tealLevelOrbSub: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  calculateGoalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  calculateGoalText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  examAudioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.violet,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TOON_INK,
  },
  examAudioPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  examNextBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 22,
    gap: 10,
    borderWidth: 2,
    borderColor: TOON_INK,
  },
});
