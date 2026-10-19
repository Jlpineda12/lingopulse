import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { AppStateProvider } from './src/context/AppStateContext';
import { GameProvider, useGame } from './src/context/GameContext';
import { CompanionTraveler, RewardToast, TabBar, TopBar } from './src/components/AppChrome';
import { SplashScreen } from './src/components/SplashScreen';
import { StreakCelebration } from './src/components/FireStreakCard';
import { scheduleReminders } from './src/services/reminders';
import { preloadSfx } from './src/services/sfx';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DailyScreen } from './src/screens/DailyScreen';
import { PracticeHubScreen } from './src/screens/PracticeHubScreen';
import { PetScreen } from './src/screens/PetScreen';
import { SpeakingScreen } from './src/screens/SpeakingScreen';
import { ListeningScreen } from './src/screens/ListeningScreen';
import { ReadingScreen } from './src/screens/ReadingScreen';
import { WritingScreen } from './src/screens/WritingScreen';
import { LessonScreen } from './src/screens/LessonScreen';
import { MinigameScreen } from './src/screens/MinigameScreen';
import { EventScreen } from './src/screens/EventScreen';
import { LeagueScreen } from './src/screens/LeagueScreen';
import { THEME } from './src/theme/colors';
import { setUiLanguage } from './src/i18n';
import { uiLanguageFor } from '@lingopulse/shared';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent =
    'body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;background:#F5F5F7}' +
    'input,textarea{outline:none}';
  document.head.appendChild(style);
}

function CurrentScreen() {
  const { screen, tab } = useGame();
  switch (screen.name) {
    case 'speaking':
      return <SpeakingScreen topicId={screen.topicId} />;
    case 'listening':
      return <ListeningScreen trackId={screen.trackId} />;
    case 'reading':
      return <ReadingScreen passageId={screen.passageId} />;
    case 'writing':
      return <WritingScreen promptId={screen.promptId} custom={screen.custom} />;
    case 'lesson':
      return <LessonScreen />;
    case 'minigame':
      return <MinigameScreen initialGame={screen.game} />;
    case 'event':
      return <EventScreen />;
    case 'league':
      return <LeagueScreen />;
    default:
      if (tab === 'daily') return <DailyScreen />;
      if (tab === 'practice') return <PracticeHubScreen />;
      if (tab === 'pet') return <PetScreen />;
      return <HomeScreen />;
  }
}

/** Transición suave entre pantallas (fundido + leve desplazamiento). */
function ScreenTransition({
  transitionKey,
  children,
}: {
  transitionKey: string;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [transitionKey, v]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          {
            translateY: v.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function Shell() {
  const { ready, currentAccount, progress, screen, tab, pet, streakView } = useGame();
  const [splashDone, setSplashDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const transitionKey =
    screen.name === 'tabs' ? `tab-${tab}` : JSON.stringify(screen);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [transitionKey]);

  // A1–A2: la app explica en español. B1 en adelante: toda la app en inglés.
  // El registro y el test de ubicación van en español (aún no se conoce el nivel real).
  const uiLang = progress.onboarded ? uiLanguageFor(progress.level) : 'es';
  useLayoutEffect(() => {
    setUiLanguage(uiLang);
  }, [uiLang]);

  // Audio nativo: suena aunque el iPhone esté en silencio y deja listos los efectos.
  useEffect(() => {
    preloadSfx();
  }, []);

  // Reprograma los recordatorios de la mascota cuando cambia la racha o el día practicado.
  const reminders = progress.reminders;
  useEffect(() => {
    if (!reminders?.enabled) return;
    scheduleReminders({
      enabled: true,
      hour: reminders.hour,
      petName: pet.name,
      streak: streakView.streak,
      practicedToday: streakView.activeToday,
    });
  }, [reminders?.enabled, reminders?.hour, pet.name, streakView.streak, streakView.activeToday, uiLang]);

  // Pantalla de carga profesional animada al abrir la aplicación
  if (!ready || !splashDone) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#FFD9A8" />
        <SplashScreen ready={ready} petSpecies={pet.species} onFinish={() => setSplashDone(true)} />
      </>
    );
  }

  if (!currentAccount || !progress.onboarded) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
        <AuthScreen />
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <TopBar />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.maxWidth}>
          <ScreenTransition transitionKey={`${currentAccount.id}-${transitionKey}`}>
            <CurrentScreen />
          </ScreenTransition>
        </View>
      </ScrollView>
      <CompanionTraveler />
      <TabBar />
      <RewardToast />
      <StreakCelebration />
    </View>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppStateProvider>
        <SafeAreaView style={styles.safeArea}>
          <Shell />
        </SafeAreaView>
      </AppStateProvider>
    </GameProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  scrollContent: { alignItems: 'center' },
  maxWidth: { width: '100%', maxWidth: 640 },
});
