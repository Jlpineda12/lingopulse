import React, { useState } from 'react';
import { Animated, ScrollView, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { PracticeLevel } from '@lingopulse/shared';
import { Text } from '../i18n';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { Pet3D } from '../components/Pet3D';
import { haptic, PressableScale, Reveal, useTiltOffset } from '../components/motion';
import { DEFAULT_PET, type PetConfig } from '../game/pet';
import { speakEnglishPhrase } from '../services/speech';
import { SHADOW, THEME } from '../theme/colors';
import { AnimatedShowcaseBackdrop } from './auth/AuthBackdrop';
import { LoginStep } from './auth/LoginStep';
import { PetQuickPicker } from './auth/PetQuickPicker';
import { PlacementTestView } from './auth/PlacementTestView';
import { styles } from './auth/authStyles';

type AuthView = 'landing' | 'login' | 'pet' | 'level';

/**
 * Bienvenida y registro rápido: portada → elegir amigo (2 toques) → nivel (1 toque) → a jugar.
 * Un jugador nuevo está con su mascota y hablando en menos de un minuto.
 */
export function AuthScreen() {
  const { accounts, registerAccount } = useGame();
  const { locale, speakWithPip } = useAppState();
  const tilt = useTiltOffset(9);

  const [view, setView] = useState<AuthView>('landing');
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
  const [petName, setPetName] = useState('Puffy');
  const [playerName, setPlayerName] = useState('');
  const [pin, setPin] = useState('');
  const [level, setLevel] = useState<PracticeLevel>('A1');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [reactKey, setReactKey] = useState(0);

  const pet: PetConfig = { ...draft, name: petName.trim() || 'Puffy', customNamed: Boolean(petName.trim()) };

  const finish = (lvl: PracticeLevel) => {
    setRegisterError(null);
    // Sin nombre se crea uno por defecto que no choque con otros jugadores del dispositivo
    const name = playerName.trim() || (accounts.length ? `Jugador ${accounts.length + 1}` : 'Jugador');
    const res = registerAccount({
      playerName: name,
      handle: `@${name.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'jugador'}`,
      pin: pin.trim(),
      level: lvl,
      pet,
    });
    if (!res.ok) {
      setRegisterError(res.error ?? 'No se pudo crear tu jugador.');
      return;
    }
    haptic('success');
  };

  if (view === 'login') {
    return <LoginStep fallbackPet={pet} onBack={() => setView('landing')} onCreateNew={() => setView('pet')} />;
  }
  if (view === 'pet') {
    return (
      <PetQuickPicker
        draft={draft}
        onChangeDraft={setDraft}
        petName={petName}
        onChangePetName={setPetName}
        playerName={playerName}
        onChangePlayerName={setPlayerName}
        pin={pin}
        onChangePin={setPin}
        onSpeak={(text, pitch, rate) => speakEnglishPhrase(text, locale, { pitch, rate })}
        onBack={() => setView('landing')}
        onNext={() => {
          haptic('select');
          setView('level');
        }}
      />
    );
  }
  if (view === 'level') {
    return (
      <PlacementTestView
        pet={pet}
        level={level}
        onChangeLevel={setLevel}
        onBack={() => setView('pet')}
        onFinish={finish}
        error={registerError}
        speak={(text) => speakEnglishPhrase(text, locale)}
      />
    );
  }

  /* Portada: la mascota saluda y un botón lleva directo a elegir amigo */
  return (
    <View style={{ flex: 1 }}>
      <AnimatedShowcaseBackdrop variant="pool" />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.landingContainer} showsVerticalScrollIndicator={false}>
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

        <Reveal index={1} style={styles.landingCenterStage}>
          <PressableScale
            onPress={() => {
              speakWithPip("Hi! I'm your new buddy. Pick me and let's conquer the islands!");
              setReactKey((k) => k + 1);
            }}
            hapticKind="light"
            style={styles.floatingSpeechPill}
          >
            <Ionicons name="volume-high" size={16} color={THEME.blue} />
            <Text style={styles.floatingSpeechText}>“Hi! Tap me or tilt your phone!”</Text>
          </PressableScale>
          <Animated.View style={[styles.heroFloatRing, { transform: [{ translateX: tilt.x }, { translateY: tilt.y }] }]}>
            <View style={styles.innerTubeHalo}>
              <Pet3D config={pet} mood="happy" size={246} reactKey={reactKey} onTap={() => setReactKey((k) => k + 1)} backgroundColor="transparent" />
            </View>
          </Animated.View>
        </Reveal>

        <Reveal index={2} style={styles.landingBottomBlock}>
          <Text style={styles.poolHeroTitle}>Aprende inglés explorando islas con tu amigo 3D</Text>
          <Text style={styles.poolHeroSub}>Elige a tu compañero, cuídalo y háblale en inglés: en un minuto ya estás jugando.</Text>
          <View style={styles.landingCtaStack}>
            <PressableScale
              onPress={() => {
                haptic('select');
                setView('pet');
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
