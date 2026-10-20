import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  B1_MODULE_1_SYLLABUS_OVERVIEW,
  getSeededLessonByLocale,
  type LessonPhase,
  type PublicLessonDTO,
  type SupportedLocale,
  type VoiceScorecardDTO,
} from '@lingopulse/shared';
import { fetchCurriculumByLocale } from '../services/api';
import { babble, stopBabble } from '../services/babble';
import { playSpeechBase64, speakNeural, stopNeural } from '../services/neuralTts';
import { useGame } from './GameContext';

export type ActiveStep = LessonPhase | 'scorecard';

interface AppStateContextValue {
  locale: SupportedLocale;
  toggleLocale: () => void;
  activeStep: ActiveStep;
  setActiveStep: (step: ActiveStep) => void;
  completedPhases: LessonPhase[];
  markPhaseCompleted: (phase: LessonPhase) => void;
  lesson: PublicLessonDTO;
  syllabus: typeof B1_MODULE_1_SYLLABUS_OVERVIEW;
  engineSource: 'api' | 'local_engine';
  pipMessage: string;
  setPipMessage: (msg: string) => void;
  pipIsSpeaking: boolean;
  /** La mascota dice algo en inglés con voz neuronal alegre (o la del dispositivo). */
  speakWithPip: (textEn: string, audioBase64?: string | null) => void;
  /** La mascota "habla" en su idioma (balbuceo estilo Animalese) mientras se ve el texto. */
  babbleWithPip: (text: string) => void;
  totalVoicedMsToday: number;
  addVoicedFuelMs: (ms: number) => void;
  streakDays: number;
  lastScorecard: VoiceScorecardDTO | null;
  setLastScorecard: (scorecard: VoiceScorecardDTO | null) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

const PIP_GREETINGS: Record<SupportedLocale, string> = {
  'en-GB':
    'Cheerio! Soy Pip 🇬🇧. Hoy dominaremos "put off" para reprogramar reuniones en equipo.',
  'en-US':
    'Hey there! Soy Pip 🇺🇸. Hoy dominaremos "put off" con ritmo natural americano.',
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const game = useGame();
  const [locale, setLocale] = useState<SupportedLocale>('en-GB');
  const [activeStep, setActiveStep] = useState<ActiveStep>('anatomy');
  const [completedPhases, setCompletedPhases] = useState<LessonPhase[]>([]);
  const [lesson, setLesson] = useState<PublicLessonDTO>(
    () => getSeededLessonByLocale('en-GB').publicLesson
  );
  const [syllabus, setSyllabus] = useState(B1_MODULE_1_SYLLABUS_OVERVIEW);
  const [engineSource, setEngineSource] = useState<'api' | 'local_engine'>(
    'local_engine'
  );
  const [pipMessage, setPipMessage] = useState<string>(PIP_GREETINGS['en-GB']);
  const [pipIsSpeaking, setPipIsSpeaking] = useState(false);
  const [totalVoicedMsToday, setTotalVoicedMsToday] = useState<number>(0);
  const streakDays = game.progress.streak;
  const [lastScorecard, setLastScorecard] = useState<VoiceScorecardDTO | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    fetchCurriculumByLocale(locale).then((res) => {
      if (!mounted) return;
      setLesson(res.activeLesson);
      setSyllabus(res.unitSyllabus);
      setEngineSource(res.source);
    });
    return () => {
      mounted = false;
    };
  }, [locale]);

  const toggleLocale = () => {
    const next: SupportedLocale = locale === 'en-GB' ? 'en-US' : 'en-GB';
    setLocale(next);
    setPipMessage(PIP_GREETINGS[next]);
  };

  const markPhaseCompleted = (phase: LessonPhase) => {
    if (completedPhases.includes(phase)) return;
    setCompletedPhases((prev) =>
      prev.includes(phase) ? prev : [...prev, phase]
    );
    // Cerrar la Voice Arena completa el ciclo de la lección: cuenta como actividad del día.
    if (phase === 'voice') {
      game.completeActivity({
        kind: 'lesson',
        title: lesson.title,
        speakingSec: totalVoicedMsToday / 1000,
      });
    }
  };

  const addVoicedFuelMs = (ms: number) => {
    if (ms <= 0) return;
    setTotalVoicedMsToday((prev) => prev + ms);
    game.addSpeechEnergy(ms / 1000);
  };

  const speakWithPip = (textEn: string, audioBase64?: string | null) => {
    stopBabble();
    const opts = {
      pitch: game.pet.voicePitch ?? 1.15,
      rate: game.pet.voiceRate ?? 1.0,
      style: 'cheerful' as const,
      onStart: () => setPipIsSpeaking(true),
      onDone: () => setPipIsSpeaking(false),
    };
    if (audioBase64) playSpeechBase64(audioBase64, opts);
    else void speakNeural(textEn, locale, opts);
  };

  const babbleWithPip = (text: string) => {
    stopNeural();
    babble(text, {
      pitch: game.pet.voicePitch ?? 1.15,
      rate: game.pet.voiceRate ?? 1.0,
      onStart: () => setPipIsSpeaking(true),
      onDone: () => setPipIsSpeaking(false),
    });
  };

  return (
    <AppStateContext.Provider
      value={{
        locale,
        toggleLocale,
        activeStep,
        setActiveStep,
        completedPhases,
        markPhaseCompleted,
        lesson,
        syllabus,
        engineSource,
        pipMessage,
        setPipMessage,
        pipIsSpeaking,
        speakWithPip,
        babbleWithPip,
        totalVoicedMsToday,
        addVoicedFuelMs,
        streakDays,
        lastScorecard,
        setLastScorecard,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return ctx;
}
