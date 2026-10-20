import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  applyActivityToStreak,
  flameTier,
  isoWeekKey,
  localDateKey,
  QUIZ_PASS,
  unitStars,
  visibleStreak,
  type FlameTier,
  type PracticeLevel,
  type StreakMilestone,
  type UnitProgress,
  type UnitStep,
} from '@lingopulse/shared';
import { currentEvent, EMPTY_EVENT_PROGRESS, type EventProgress } from '../game/events';
import { buildLeague, LEAGUE_TIERS, previousWeekKey, weekElapsed, zoneFor, type LeagueEntry } from '../game/league';
import { loadJson, removeKeys, saveJson } from '../services/storage';
import { StackActions } from '@react-navigation/native';
import { currentNavScreen, navigationRef } from '../navigation/navigationRef';
import {
  applyDecay,
  clampStat,
  DEFAULT_PET,
  DEFAULT_STATS,
  FOODS,
  getMood,
  HABITAT_PROPS,
  levelFromXp,
  petStageForXp,
  PET_STAGES,
  DEFAULT_HOUSE,
  findFurniture,
  HOUSE_TIERS,
  OUTFITS,
  STREAK_SURPRISE_GIFTS,
  TOMODACHI_DREAMS,
  type HouseState,
  type OutfitId,
  type HabitatPropId,
  type PetConfig,
  type PetMood,
  type PetSpecies,
  type PetStage,
  type PetStats,
  type StreakSurpriseGift,
} from '../game/pet';

export type ActivityKind = 'speaking' | 'listening' | 'reading' | 'writing' | 'daily' | 'lesson';

export interface ActivityEntry {
  kind: ActivityKind;
  title: string;
  score?: number;
  xp: number;
  at: number;
}

export interface Progress {
  xp: number;
  coins: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  activityLog: Record<string, ActivityEntry[]>;
  savedWordIds: string[];
  /** Ítems del Daily Drop cuyo quiz ya dio XP, por fecha. */
  dailyQuizDone: Record<string, string[]>;
  totalSpeakingSec: number;
  level: PracticeLevel;
  onboarded: boolean;
  unlockedProps?: HabitatPropId[];
  claimedGifts?: string[];
  completedDreams?: string[];
  /** Estrellas de minijuegos (moneda para mejorar la casa). */
  stars?: number;
  house?: HouseState;
  ownedOutfits?: OutfitId[];
  /** Mejor puntaje de cada minijuego por día (limita el farmeo de recompensas). */
  minigameLog?: Record<string, Record<string, number>>;
  /** Racha: escudos semanales, días protegidos e hitos cobrados. */
  streakShields?: number;
  lastShieldWeek?: string | null;
  protectedDays?: string[];
  claimedMilestones?: number[];
  /** Eventos semanales por semana ISO. */
  eventProgress?: Record<string, EventProgress>;
  /** XP ganada por semana ISO (para la liga). */
  weeklyXp?: Record<string, number>;
  leagueTier?: number;
  leagueWeek?: string;
  leagueResult?: { week: string; rank: number; zone: 'promote' | 'stay' | 'demote'; fromTier: number; toTier: number } | null;
  reminders?: { enabled: boolean; hour: number };
  /** Progreso de las islas por tema (pasos hechos, mejor quiz, estrellas). */
  units?: Record<string, UnitProgress>;
  /** Última etapa de crecimiento de la mascota que el jugador ya celebró (índice en PET_STAGES). */
  petStageSeen?: number;
  /** Tutorial interactivo de bienvenida (false = pendiente; undefined = cuentas antiguas). */
  tutorialDone?: boolean;
}

export interface PlayerAccount {
  id: string;
  playerName: string;
  handle: string;
  pin: string; // vacío si no tiene PIN
  createdAt: number;
  lastLoginAt: number;
  petSummary: {
    name: string;
    species: PetSpecies;
    bodyColor: string;
  };
  statsSummary: {
    xp: number;
    level: PracticeLevel;
    streak: number;
    coins: number;
  };
}

const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  coins: 25,
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  activityLog: {},
  savedWordIds: [],
  dailyQuizDone: {},
  totalSpeakingSec: 0,
  level: 'B1',
  onboarded: false,
  unlockedProps: ['none', 'campfire'],
  claimedGifts: [],
  completedDreams: [],
};

export const DAILY_GOAL = 3;

/* ----------------------------- Navegación ----------------------------- */

export type TabId = 'home' | 'daily' | 'practice' | 'pet';

export type Screen =
  | { name: 'tabs' }
  | { name: 'speaking'; topicId?: string }
  | { name: 'listening'; trackId?: string }
  | { name: 'reading'; passageId?: string }
  | { name: 'writing'; promptId?: string; custom?: { title: string; promptEn: string } }
  | { name: 'lesson' }
  | { name: 'minigame'; game?: 'word-rush' | 'sharp-ear' | 'sentence-builder' | 'error-hunt' | 'event-rush' }
  | { name: 'event' }
  | { name: 'league' }
  | { name: 'unit'; unitId: string }
  | { name: 'settings' }
  | { name: 'privacy' };

/** Resultado del quiz final de una isla. */
export interface UnitQuizResult {
  passed: boolean;
  stars: number;
  /** Estrellas nuevas respecto al mejor intento anterior. */
  newStars: number;
  /** Primera vez que se conquista la isla. */
  conquered: boolean;
  bonusCoins: number;
}

/** "unit:a1-03:reading" → { unitId: 'a1-03', step: 'reading' } */
function parseUnitRef(refId?: string): { unitId: string; step: UnitStep } | null {
  const m = refId?.match(/^unit:([^:]+):(speaking|listening|reading|writing)$/);
  return m ? { unitId: m[1]!, step: m[2] as UnitStep } : null;
}

function withUnitStep(p: Progress, unitId: string, step: UnitStep): Progress {
  const current = p.units?.[unitId] ?? { done: [] };
  if (current.done.includes(step)) return p;
  const updated: UnitProgress = { ...current, done: [...current.done, step] };
  return { ...p, units: { ...(p.units ?? {}), [unitId]: { ...updated, stars: unitStars(updated) } } };
}

export interface StreakView {
  streak: number;
  atRisk: boolean;
  lost: boolean;
  shieldsNeeded: number;
  shields: number;
  tier: FlameTier;
  activeToday: boolean;
}

export interface Reward {
  xp: number;
  coins: number;
  leveledUp: boolean;
  newLevel: number;
  streakIncreased: boolean;
  goalReached: boolean;
  streakFrom?: number;
  streakTo?: number;
  shieldsUsed?: number;
  shieldGranted?: boolean;
  milestone?: StreakMilestone | null;
}

export interface RegisterAccountInput {
  playerName: string;
  handle: string;
  pin?: string;
  level: PracticeLevel;
  pet: Partial<PetConfig>;
}

interface GameContextValue {
  ready: boolean;
  accounts: PlayerAccount[];
  currentAccount: PlayerAccount | null;
  progress: Progress;
  pet: PetConfig;
  stats: PetStats;
  mood: PetMood;
  playerLevel: number;
  /** Etapa de crecimiento actual (huevo → adulto) y progreso hacia la siguiente. */
  petStage: ReturnType<typeof petStageForXp>;
  /** La mascota acaba de eclosionar o crecer y falta celebrarlo. */
  pendingGrowth: { from: PetStage; to: PetStage } | null;
  dismissGrowth: () => void;
  finishTutorial: () => void;
  replayTutorial: () => void;
  todayKey: string;
  todayActivities: ActivityEntry[];
  tab: TabId;
  setTab: (tab: TabId) => void;
  screen: Screen;
  openScreen: (screen: Screen) => void;
  goBack: () => void;
  /** La pila nativa cambió: actualiza `screen` (lo llama el NavigationContainer). */
  syncNavigation: () => void;
  lastReward: Reward | null;
  dismissReward: () => void;
  /** `refId` = id del ejercicio; si es de una isla ("unit:a1-03:reading") marca ese paso. */
  completeActivity: (entry: { kind: ActivityKind; title: string; score?: number; speakingSec?: number; refId?: string }) => Reward;
  /** Marca un paso de teoría de una isla (vocabulario o gramática). */
  markUnitStep: (unitId: string, step: UnitStep) => void;
  /** Registra el quiz final de una isla: XP, monedas y estrellas. */
  finishUnitQuiz: (unitId: string, title: string, score: number) => UnitQuizResult;
  awardDailyQuiz: (itemId: string, correct: boolean) => boolean;
  toggleSavedWord: (itemId: string) => void;
  updatePet: (patch: Partial<PetConfig>) => void;
  feedPet: (foodId: string) => { ok: boolean; reason?: string };
  playWithPet: () => { ok: boolean; reason?: string };
  petThePet: () => void;
  buyOrEquipProp: (propId: HabitatPropId) => { ok: boolean; reason?: string; unlockedNow?: boolean };
  streakView: StreakView;
  dismissStreakCelebration: () => void;
  streakCelebration: Reward | null;
  league: { tier: number; entries: LeagueEntry[]; myRank: number; weekXp: number };
  dismissLeagueResult: () => void;
  eventState: ReturnType<typeof currentEvent> & { progress: EventProgress };
  learnEventWord: (wordId: string) => void;
  claimEventReward: () => { ok: boolean; reason?: string };
  setReminders: (prefs: { enabled: boolean; hour: number }) => void;
  house: HouseState;
  upgradeHouse: () => { ok: boolean; reason?: string };
  buyOrPlaceFurniture: (itemId: string) => { ok: boolean; reason?: string; boughtNow?: boolean };
  removeFurniture: (slot: keyof HouseState['placed']) => void;
  buyOrWearOutfit: (outfitId: OutfitId) => { ok: boolean; reason?: string; boughtNow?: boolean };
  finishMinigame: (gameId: string, correct: number, total: number) => { stars: number; coins: number; xp: number; firstToday: boolean };
  solveDreamBubble: (dreamId: string, correct: boolean) => { ok: boolean; coins: number; xp: number };
  claimSurpriseGift: (giftId: string) => { ok: boolean; reason?: string; gift?: StreakSurpriseGift };
  triggerPetEmotion: (emotion: PetMood, durationMs?: number) => void;
  recordQuizOutcome: (correct: boolean) => void;
  addSpeechEnergy: (seconds: number) => void;
  setLevel: (level: PracticeLevel) => void;
  completeOnboarding: (config: Partial<PetConfig>, level: PracticeLevel) => void;
  registerAccount: (input: RegisterAccountInput) => { ok: boolean; error?: string; account?: PlayerAccount };
  loginWithAccount: (accountId: string, pin?: string) => { ok: boolean; error?: string };
  loginWithCredentials: (handleOrName: string, pin?: string) => { ok: boolean; error?: string };
  logout: () => void;
  deleteAccount: (accountId: string) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function yesterdayKey(todayKey: string): string {
  const [y, m, d] = todayKey.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

function baseXp(kind: ActivityKind, score?: number): number {
  const base: Record<ActivityKind, number> = {
    speaking: 30, writing: 25, listening: 20, reading: 20, daily: 10, lesson: 60,
  };
  const bonus = score !== undefined ? Math.round((score / 100) * 15) : 0;
  return base[kind] + bonus;
}

function userKey(accountId: string, suffix: 'progress' | 'pet' | 'petStats'): string {
  return `user:${accountId}:${suffix}`;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<PlayerAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [pet, setPet] = useState<PetConfig>(DEFAULT_PET);
  const [streakCelebration, setStreakCelebration] = useState<Reward | null>(null);
  const [stats, setStats] = useState<PetStats>(DEFAULT_STATS);
  const [tab, setTab] = useState<TabId>('home');
  // La pila de pantallas vive en React Navigation (pila nativa); aquí solo se refleja la visible.
  const [screen, setScreen] = useState<Screen>({ name: 'tabs' });
  const pendingScreensRef = useRef<Screen[]>([]);
  const resetToTabs = useCallback(() => {
    pendingScreensRef.current = [];
    if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.dispatch(StackActions.popToTop());
    setScreen({ name: 'tabs' });
  }, []);
  const syncNavigation = useCallback(() => {
    // Pantallas pedidas antes de que la pila estuviera lista (p. ej. al terminar el registro)
    if (navigationRef.isReady() && pendingScreensRef.current.length) {
      const queued = pendingScreensRef.current;
      pendingScreensRef.current = [];
      queued.forEach((sc) => navigationRef.dispatch(StackActions.push('screen', { screen: sc })));
    }
    setScreen(currentNavScreen());
  }, []);
  const [lastReward, setLastReward] = useState<Reward | null>(null);
  const [todayKey, setTodayKey] = useState(localDateKey());
  const [emotionOverride, setEmotionOverride] = useState<PetMood | null>(null);
  const emotionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mistakesRef = useRef(0);

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const petRef = useRef(pet);
  petRef.current = pet;
  const activeAccountIdRef = useRef(activeAccountId);
  activeAccountIdRef.current = activeAccountId;

  const triggerPetEmotion = useCallback((emotion: PetMood, durationMs = 4500) => {
    if (emotionTimerRef.current) {
      clearTimeout(emotionTimerRef.current);
    }
    setEmotionOverride(emotion);
    emotionTimerRef.current = setTimeout(() => {
      setEmotionOverride(null);
      emotionTimerRef.current = null;
    }, durationMs);
  }, []);

  const recordQuizOutcome = useCallback(
    (correct: boolean) => {
      if (correct) {
        mistakesRef.current = 0;
        triggerPetEmotion('celebrate', 4200);
      } else {
        mistakesRef.current += 1;
        const isTemperamental = petRef.current.personality === 'sassy';
        // Primeros fallos: "¡ups!" (se encoge, ladea la cabeza y suda); si se acumulan, se enfada.
        if (mistakesRef.current >= (isTemperamental ? 2 : 3)) {
          triggerPetEmotion(mistakesRef.current >= 4 ? 'rage' : 'angry', 4500);
        } else {
          triggerPetEmotion('oops', 3200);
        }
      }
    },
    [triggerPetEmotion]
  );

  const loadAccountBundle = useCallback(async (accountId: string) => {
    const [p, c, s] = await Promise.all([
      loadJson<Progress>(userKey(accountId, 'progress'), { ...DEFAULT_PROGRESS, onboarded: true }),
      loadJson<PetConfig>(userKey(accountId, 'pet'), DEFAULT_PET),
      loadJson<PetStats>(userKey(accountId, 'petStats'), DEFAULT_STATS),
    ]);
    setProgress({ ...p, onboarded: true });
    setPet({ ...DEFAULT_PET, ...c });
    setStats(applyDecay(s));
    setEmotionOverride(null);
    setTab('home');
    resetToTabs();
  }, []);

  useEffect(() => {
    (async () => {
      const savedAccounts = await loadJson<{ list: PlayerAccount[] }>('accounts_v1', { list: [] });
      const savedActive = await loadJson<{ id: string | null }>('active_account_v1', { id: null });

      let list = Array.isArray(savedAccounts.list) ? savedAccounts.list : [];
      let currentId = savedActive.id;

      // Migración automática si había datos previos de un solo jugador
      if (list.length === 0) {
        const [legacyP, legacyPet, legacyStats] = await Promise.all([
          loadJson('progress', DEFAULT_PROGRESS),
          loadJson('pet', DEFAULT_PET),
          loadJson('petStats', DEFAULT_STATS),
        ]);
        if (legacyP.onboarded || legacyP.xp > 0) {
          const migratedId = 'player-1';
          const migratedAccount: PlayerAccount = {
            id: migratedId,
            playerName: 'Jugador 1',
            handle: '@jugador1',
            pin: '',
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            petSummary: {
              name: legacyPet.name,
              species: legacyPet.species,
              bodyColor: legacyPet.bodyColor,
            },
            statsSummary: {
              xp: legacyP.xp,
              level: legacyP.level,
              streak: legacyP.streak,
              coins: legacyP.coins,
            },
          };
          list = [migratedAccount];
          currentId = migratedId;
          await Promise.all([
            saveJson(userKey(migratedId, 'progress'), { ...legacyP, onboarded: true }),
            saveJson(userKey(migratedId, 'pet'), legacyPet),
            saveJson(userKey(migratedId, 'petStats'), legacyStats),
            saveJson('accounts_v1', { list }),
            saveJson('active_account_v1', { id: currentId }),
          ]);
        }
      }

      setAccounts(list);
      if (currentId && list.some((a) => a.id === currentId)) {
        setActiveAccountId(currentId);
        await loadAccountBundle(currentId);
      } else {
        setActiveAccountId(null);
      }
      setReady(true);
    })();
  }, [loadAccountBundle]);

  // Guardar progreso, mascota y resumen de la cuenta activa
  useEffect(() => {
    if (!ready || !activeAccountId) return;
    saveJson(userKey(activeAccountId, 'progress'), progress);
    setAccounts((prev) => {
      const next = prev.map((a) =>
        a.id === activeAccountId
          ? {
              ...a,
              statsSummary: {
                xp: progress.xp,
                level: progress.level,
                streak: progress.streak,
                coins: progress.coins,
              },
            }
          : a
      );
      saveJson('accounts_v1', { list: next });
      return next;
    });
  }, [progress, ready, activeAccountId]);

  useEffect(() => {
    if (!ready || !activeAccountId) return;
    saveJson(userKey(activeAccountId, 'pet'), pet);
    setAccounts((prev) => {
      const next = prev.map((a) =>
        a.id === activeAccountId
          ? {
              ...a,
              petSummary: {
                name: pet.name,
                species: pet.species,
                bodyColor: pet.bodyColor,
              },
            }
          : a
      );
      saveJson('accounts_v1', { list: next });
      return next;
    });
  }, [pet, ready, activeAccountId]);

  useEffect(() => {
    if (!ready || !activeAccountId) return;
    saveJson(userKey(activeAccountId, 'petStats'), stats);
  }, [stats, ready, activeAccountId]);

  // Paso del tiempo: necesidades y cambio de día
  useEffect(() => {
    const id = setInterval(() => {
      setStats((s) => applyDecay(s));
      setTodayKey(localDateKey());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Al empezar una semana nueva se cierra la liga anterior: top 5 sube, últimos 5 bajan.
  useEffect(() => {
    if (!ready || !activeAccountId) return;
    const week = isoWeekKey(todayKey);
    if (progress.leagueWeek === week) return;
    setProgress((p) => {
      if (p.leagueWeek === week) return p;
      if (!p.leagueWeek) return { ...p, leagueWeek: week, leagueTier: p.leagueTier ?? 0 };
      const prevWeek = p.leagueWeek;
      const fromTier = p.leagueTier ?? 0;
      const prevXp = p.weeklyXp?.[prevWeek] ?? 0;
      const standings = buildLeague({
        weekKey: prevWeek,
        tier: fromTier,
        userXp: prevXp,
        userName: 'me',
        userSpecies: 'puff',
        elapsed: 1,
      });
      const rank = standings.findIndex((e) => e.isUser) + 1;
      const zone = prevXp === 0 ? 'demote' : zoneFor(rank);
      const toTier = Math.max(0, Math.min(LEAGUE_TIERS.length - 1, fromTier + (zone === 'promote' ? 1 : zone === 'demote' ? -1 : 0)));
      return {
        ...p,
        leagueWeek: week,
        leagueTier: toTier,
        leagueResult: prevWeek === previousWeekKey(todayKey) || prevXp > 0 ? { week: prevWeek, rank, zone, fromTier, toTier } : null,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, activeAccountId, todayKey, progress.leagueWeek]);

  const bumpStats = useCallback((delta: Partial<Omit<PetStats, 'lastUpdated'>>) => {
    setStats((s) => {
      const d = applyDecay(s);
      return {
        fullness: clampStat(d.fullness + (delta.fullness ?? 0)),
        energy: clampStat(d.energy + (delta.energy ?? 0)),
        happiness: clampStat(d.happiness + (delta.happiness ?? 0)),
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const registerAccount: GameContextValue['registerAccount'] = useCallback(
    (input) => {
      const cleanName = input.playerName.trim();
      const rawHandle = input.handle.trim() || cleanName.toLowerCase().replace(/\s+/g, '');
      const cleanHandle = rawHandle.startsWith('@') || rawHandle.includes('@') ? rawHandle : `@${rawHandle}`;

      if (!cleanName) {
        return { ok: false, error: 'Escribe tu nombre de jugador.' };
      }

      const duplicate = accounts.find(
        (a) =>
          a.handle.toLowerCase() === cleanHandle.toLowerCase() ||
          a.playerName.toLowerCase() === cleanName.toLowerCase()
      );
      if (duplicate) {
        return {
          ok: false,
          error: `Ya existe un jugador llamado "${duplicate.playerName}" (${duplicate.handle}). Elige otro nombre o inicia sesión.`,
        };
      }

      const id = `player-${Date.now()}`;
      const newPet: PetConfig = {
        ...DEFAULT_PET,
        ...input.pet,
        name: input.pet.name?.trim() || 'Pip',
      };
      const newProgress: Progress = {
        ...DEFAULT_PROGRESS,
        level: input.level,
        onboarded: true,
        petStageSeen: 0,
        tutorialDone: false,
      };
      const newStats: PetStats = {
        ...DEFAULT_STATS,
        lastUpdated: Date.now(),
      };

      const account: PlayerAccount = {
        id,
        playerName: cleanName,
        handle: cleanHandle,
        pin: (input.pin ?? '').trim(),
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        petSummary: {
          name: newPet.name,
          species: newPet.species,
          bodyColor: newPet.bodyColor,
        },
        statsSummary: {
          xp: newProgress.xp,
          level: newProgress.level,
          streak: newProgress.streak,
          coins: newProgress.coins,
        },
      };

      const nextAccounts = [account, ...accounts];
      setAccounts(nextAccounts);
      setActiveAccountId(id);
      setProgress(newProgress);
      setPet(newPet);
      setStats(newStats);
      setTab('home');
      resetToTabs();

      saveJson(userKey(id, 'progress'), newProgress);
      saveJson(userKey(id, 'pet'), newPet);
      saveJson(userKey(id, 'petStats'), newStats);
      saveJson('accounts_v1', { list: nextAccounts });
      saveJson('active_account_v1', { id });

      return { ok: true, account };
    },
    [accounts]
  );

  const loginWithAccount: GameContextValue['loginWithAccount'] = useCallback(
    (accountId, pin) => {
      const target = accounts.find((a) => a.id === accountId);
      if (!target) {
        return { ok: false, error: 'No encontramos esa cuenta de jugador.' };
      }
      if (target.pin && target.pin !== (pin ?? '').trim()) {
        return { ok: false, error: 'PIN incorrecto. Inténtalo de nuevo.' };
      }
      setActiveAccountId(target.id);
      saveJson('active_account_v1', { id: target.id });
      const updated = accounts.map((a) =>
        a.id === target.id ? { ...a, lastLoginAt: Date.now() } : a
      );
      setAccounts(updated);
      saveJson('accounts_v1', { list: updated });
      loadAccountBundle(target.id);
      return { ok: true };
    },
    [accounts, loadAccountBundle]
  );

  const loginWithCredentials: GameContextValue['loginWithCredentials'] = useCallback(
    (handleOrName, pin) => {
      const q = handleOrName.trim().toLowerCase();
      if (!q) {
        return { ok: false, error: 'Escribe tu nombre de jugador o usuario.' };
      }
      const target = accounts.find(
        (a) =>
          a.playerName.toLowerCase() === q ||
          a.handle.toLowerCase() === q ||
          a.handle.toLowerCase() === `@${q}`
      );
      if (!target) {
        return {
          ok: false,
          error: 'No encontramos ese jugador en este dispositivo. Crea tu cuenta primero.',
        };
      }
      return loginWithAccount(target.id, pin);
    },
    [accounts, loginWithAccount]
  );

  const logout = useCallback(() => {
    setActiveAccountId(null);
    saveJson('active_account_v1', { id: null });
    setLastReward(null);
    setTab('home');
    resetToTabs();
  }, []);

  const deleteAccount = useCallback(
    (accountId: string) => {
      const next = accounts.filter((a) => a.id !== accountId);
      setAccounts(next);
      saveJson('accounts_v1', { list: next });
      // Eliminar la cuenta borra de verdad todos sus datos del dispositivo.
      void removeKeys([userKey(accountId, 'progress'), userKey(accountId, 'pet'), userKey(accountId, 'petStats')]);
      if (activeAccountId === accountId) {
        setActiveAccountId(null);
        saveJson('active_account_v1', { id: null });
      }
    },
    [accounts, activeAccountId]
  );

  const completeActivity: GameContextValue['completeActivity'] = useCallback(
    ({ kind, title, score, speakingSec, refId }) => {
      const unitRef = parseUnitRef(refId);
      const p = unitRef ? withUnitStep(progressRef.current, unitRef.unitId, unitRef.step) : progressRef.current;
      const key = localDateKey();
      const today = p.activityLog[key] ?? [];
      const xp = baseXp(kind, score);
      const goalReached = today.length + 1 === DAILY_GOAL;
      const coins = Math.round(xp / 3) + (goalReached ? 20 : 0);
      const oldLevel = levelFromXp(p.xp);
      const newLevel = levelFromXp(p.xp + xp);

      const su = applyActivityToStreak(
        {
          streak: p.streak,
          bestStreak: p.bestStreak,
          lastActiveDate: p.lastActiveDate,
          shields: p.streakShields ?? 0,
          lastShieldWeek: p.lastShieldWeek ?? null,
          protectedDays: p.protectedDays ?? [],
          claimedMilestones: p.claimedMilestones ?? [],
        },
        key
      );
      const streak = su.state.streak;
      const streakIncreased = su.increased;
      const milestoneCoins = su.milestone?.coins ?? 0;
      const week = isoWeekKey(key);
      const ev = currentEvent(key);
      const evProgress = p.eventProgress?.[ev.weekKey] ?? EMPTY_EVENT_PROGRESS;

      const next: Progress = {
        ...p,
        xp: p.xp + xp,
        coins: p.coins + coins + milestoneCoins,
        streak,
        bestStreak: su.state.bestStreak,
        lastActiveDate: key,
        streakShields: su.state.shields,
        lastShieldWeek: su.state.lastShieldWeek,
        protectedDays: su.state.protectedDays,
        claimedMilestones: su.state.claimedMilestones,
        weeklyXp: { ...(p.weeklyXp ?? {}), [week]: (p.weeklyXp?.[week] ?? 0) + xp },
        eventProgress:
          kind === 'speaking'
            ? { ...(p.eventProgress ?? {}), [ev.weekKey]: { ...evProgress, speaking: true } }
            : p.eventProgress,
        totalSpeakingSec: p.totalSpeakingSec + Math.round(speakingSec ?? 0),
        activityLog: {
          ...p.activityLog,
          [key]: [...today, { kind, title, score, xp, at: Date.now() }],
        },
      };
      progressRef.current = next;
      setProgress(next);
      bumpStats({
        happiness: 8,
        energy: speakingSec ? Math.min(30, speakingSec / 2) : 4,
        fullness: -2,
      });
      const reward: Reward = {
        xp,
        coins,
        leveledUp: newLevel > oldLevel,
        newLevel,
        streakIncreased,
        goalReached,
        streakFrom: su.from,
        streakTo: streak,
        shieldsUsed: su.shieldsUsed,
        shieldGranted: su.shieldGranted,
        milestone: su.milestone,
      };
      setLastReward(reward);
      if (streakIncreased) setStreakCelebration(reward);
      setTodayKey(key);
      triggerPetEmotion('celebrate', 5200);
      return reward;
    },
    [bumpStats, triggerPetEmotion]
  );

  const awardDailyQuiz = useCallback(
    (itemId: string, correct: boolean) => {
      recordQuizOutcome(correct);
      const key = localDateKey();
      const done = progressRef.current.dailyQuizDone[key] ?? [];
      if (done.includes(itemId)) return false;
      setProgress((p) => ({
        ...p,
        dailyQuizDone: { ...p.dailyQuizDone, [key]: [...(p.dailyQuizDone[key] ?? []), itemId] },
        xp: p.xp + (correct ? 5 : 2),
        coins: p.coins + (correct ? 2 : 0),
      }));
      return true;
    },
    [recordQuizOutcome]
  );

  const currentAccount = useMemo(
    () => accounts.find((a) => a.id === activeAccountId) ?? null,
    [accounts, activeAccountId]
  );

  const petStage = useMemo(() => petStageForXp(progress.xp), [progress.xp]);
  // Cuentas antiguas: dan por vista su etapa actual (sin celebración retroactiva).
  useEffect(() => {
    if (ready && activeAccountId && progress.petStageSeen === undefined) {
      setProgress((p) => (p.petStageSeen === undefined ? { ...p, petStageSeen: petStageForXp(p.xp).index } : p));
    }
  }, [ready, activeAccountId, progress.petStageSeen]);
  const pendingGrowth = useMemo(() => {
    const seen = progress.petStageSeen;
    if (seen === undefined || petStage.index <= seen) return null;
    return { from: PET_STAGES[seen]!.id, to: petStage.stage };
  }, [progress.petStageSeen, petStage]);
  const dismissGrowth = useCallback(() => {
    setProgress((p) => ({ ...p, petStageSeen: petStageForXp(p.xp).index }));
  }, []);

  const value = useMemo<GameContextValue>(() => {
    const todayActivities = progress.activityLog[todayKey] ?? [];
    const effectiveMood: PetMood = emotionOverride ?? getMood(stats);
    return {
      ready,
      accounts,
      currentAccount,
      progress,
      pet,
      stats,
      mood: effectiveMood,
      playerLevel: levelFromXp(progress.xp),
      petStage,
      pendingGrowth,
      dismissGrowth,
      finishTutorial: () => setProgress((p) => ({ ...p, tutorialDone: true })),
      replayTutorial: () => setProgress((p) => ({ ...p, tutorialDone: false })),
      todayKey,
      todayActivities,
      tab,
      setTab: (t) => {
        resetToTabs();
        setTab(t);
      },
      screen,
      openScreen: (sc) => {
        if (navigationRef.isReady()) navigationRef.dispatch(StackActions.push('screen', { screen: sc }));
        else pendingScreensRef.current.push(sc);
      },
      goBack: () => {
        if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
      },
      syncNavigation,
      lastReward,
      dismissReward: () => setLastReward(null),
      completeActivity,
      markUnitStep: (unitId, step) => {
        const next = withUnitStep(progressRef.current, unitId, step);
        progressRef.current = next;
        setProgress(next);
      },
      finishUnitQuiz: (unitId, title, score) => {
        const before = progressRef.current.units?.[unitId] ?? { done: [] };
        const prevStars = unitStars(before);
        const passed = score >= QUIZ_PASS;
        // El quiz cuenta como actividad (XP, racha y meta diaria) aunque no se apruebe.
        completeActivity({ kind: 'lesson', title, score });
        const p = progressRef.current;
        const withQuiz = passed ? withUnitStep(p, unitId, 'quiz') : p;
        const cur = withQuiz.units?.[unitId] ?? { done: [] };
        const updated: UnitProgress = {
          ...cur,
          bestQuiz: Math.max(cur.bestQuiz ?? 0, score),
          completedAt: passed ? cur.completedAt ?? Date.now() : cur.completedAt,
        };
        const stars = unitStars(updated);
        const newStars = Math.max(0, stars - prevStars);
        const conquered = passed && prevStars === 0;
        const bonusCoins = (conquered ? 30 : 0) + newStars * 10;
        const next: Progress = {
          ...withQuiz,
          coins: withQuiz.coins + bonusCoins,
          stars: (withQuiz.stars ?? 0) + newStars,
          units: { ...(withQuiz.units ?? {}), [unitId]: { ...updated, stars } },
        };
        progressRef.current = next;
        setProgress(next);
        if (passed) triggerPetEmotion('celebrate', 5200);
        return { passed, stars, newStars, conquered, bonusCoins };
      },
      awardDailyQuiz,
      toggleSavedWord: (id) =>
        setProgress((p) => ({
          ...p,
          savedWordIds: p.savedWordIds.includes(id)
            ? p.savedWordIds.filter((w) => w !== id)
            : [id, ...p.savedWordIds],
        })),
      updatePet: (patch) => setPet((c) => ({ ...c, ...patch })),
      feedPet: (foodId) => {
        const food = FOODS.find((f) => f.id === foodId);
        if (!food) return { ok: false, reason: 'Comida desconocida' };
        if (progress.coins < food.cost) return { ok: false, reason: 'No tienes suficientes monedas. ¡Practica para ganar más!' };
        if (stats.fullness >= 98) return { ok: false, reason: `${pet.name} está lleno. ¡Mejor juega con él!` };
        setProgress((p) => ({ ...p, coins: p.coins - food.cost }));
        bumpStats({ fullness: food.fullness, energy: food.energy, happiness: food.happiness });
        mistakesRef.current = 0;
        triggerPetEmotion('eating', 4400);
        return { ok: true };
      },
      playWithPet: () => {
        if (stats.energy < 15) {
          triggerPetEmotion('sleepy', 4500);
          return { ok: false, reason: `${pet.name} está muy cansado. Habla en inglés para recargar su energía.` };
        }
        bumpStats({ happiness: 12, energy: -6, fullness: -3 });
        triggerPetEmotion('celebrate', 4000);
        return { ok: true };
      },
      petThePet: () => {
        bumpStats({ happiness: 2 });
        mistakesRef.current = 0;
        triggerPetEmotion('love', 4000);
      },
      buyOrEquipProp: (propId) => {
        const propItem = HABITAT_PROPS.find((hp) => hp.id === propId);
        if (!propItem) return { ok: false, reason: 'Objeto desconocido' };
        const owned = progress.unlockedProps ?? ['none', 'campfire'];
        if (owned.includes(propId) || propItem.cost === 0) {
          setPet((c) => ({ ...c, habitatProp: propId }));
          triggerPetEmotion('love', 3000);
          return { ok: true, unlockedNow: false };
        }
        if (progress.coins < propItem.cost) {
          return {
            ok: false,
            reason: `Necesitas ${propItem.cost} monedas para desbloquear ${propItem.nameEs}.`,
          };
        }
        setProgress((p) => ({
          ...p,
          coins: p.coins - propItem.cost,
          unlockedProps: Array.from(new Set([...(p.unlockedProps ?? ['none', 'campfire']), propId])),
        }));
        setPet((c) => ({ ...c, habitatProp: propId }));
        triggerPetEmotion('celebrate', 4500);
        return { ok: true, unlockedNow: true };
      },
      solveDreamBubble: (dreamId, correct) => {
        const dream = TOMODACHI_DREAMS.find((d) => d.id === dreamId) ?? TOMODACHI_DREAMS[0]!;
        if (!correct) {
          recordQuizOutcome(false);
          return { ok: false, coins: 0, xp: 0 };
        }
        mistakesRef.current = 0;
        bumpStats({ energy: 25, happiness: 16 });
        setProgress((p) => ({
          ...p,
          coins: p.coins + dream.rewardCoins,
          xp: p.xp + dream.rewardXp,
          completedDreams: Array.from(new Set([...(p.completedDreams ?? []), dreamId])),
        }));
        triggerPetEmotion('celebrate', 5000);
        return { ok: true, coins: dream.rewardCoins, xp: dream.rewardXp };
      },
      claimSurpriseGift: (giftId) => {
        const gift = STREAK_SURPRISE_GIFTS.find((g) => g.id === giftId);
        if (!gift) return { ok: false, reason: 'Regalo no encontrado.' };
        const claimed = progress.claimedGifts ?? [];
        if (claimed.includes(giftId)) {
          return { ok: false, reason: 'Ya abriste este cofre sorpresa.' };
        }
        if (progress.streak < gift.minStreak) {
          return {
            ok: false,
            reason: `Encendamos una racha de ${gift.minStreak} días para abrir este regalo.`,
          };
        }
        setProgress((p) => ({
          ...p,
          coins: p.coins + gift.coinsBonus,
          unlockedProps: Array.from(
            new Set([...(p.unlockedProps ?? ['none', 'campfire']), gift.unlockProp])
          ),
          claimedGifts: [...(p.claimedGifts ?? []), giftId],
        }));
        setPet((c) => ({
          ...c,
          habitatProp: gift.unlockProp,
          catchphrase: gift.unlockCatchphrase,
        }));
        bumpStats({ happiness: 22, energy: 15 });
        triggerPetEmotion('celebrate', 5200);
        return { ok: true, gift };
      },
      streakView: (() => {
        const v = visibleStreak(
          {
            streak: progress.streak,
            bestStreak: progress.bestStreak,
            lastActiveDate: progress.lastActiveDate,
            shields: progress.streakShields ?? 0,
            lastShieldWeek: progress.lastShieldWeek ?? null,
            protectedDays: progress.protectedDays ?? [],
            claimedMilestones: progress.claimedMilestones ?? [],
          },
          todayKey
        );
        return {
          ...v,
          shields: progress.streakShields ?? 0,
          tier: flameTier(v.streak),
          activeToday: progress.lastActiveDate === todayKey,
        };
      })(),
      streakCelebration,
      dismissStreakCelebration: () => setStreakCelebration(null),
      league: (() => {
        const week = isoWeekKey(todayKey);
        const tier = progress.leagueTier ?? 0;
        const weekXp = progress.weeklyXp?.[week] ?? 0;
        const entries = buildLeague({
          weekKey: week,
          tier,
          userXp: weekXp,
          userName: currentAccount?.playerName ?? 'Tú',
          userSpecies: pet.species,
          elapsed: weekElapsed(),
        });
        return { tier, entries, myRank: entries.findIndex((e) => e.isUser) + 1, weekXp };
      })(),
      dismissLeagueResult: () => setProgress((p) => ({ ...p, leagueResult: null })),
      eventState: (() => {
        const ev = currentEvent(todayKey);
        return { ...ev, progress: progress.eventProgress?.[ev.weekKey] ?? EMPTY_EVENT_PROGRESS };
      })(),
      learnEventWord: (wordId) => {
        const ev = currentEvent(todayKey);
        setProgress((p) => {
          const cur = p.eventProgress?.[ev.weekKey] ?? EMPTY_EVENT_PROGRESS;
          if (cur.learned.includes(wordId)) return p;
          return {
            ...p,
            xp: p.xp + 3,
            eventProgress: { ...(p.eventProgress ?? {}), [ev.weekKey]: { ...cur, learned: [...cur.learned, wordId] } },
          };
        });
      },
      claimEventReward: () => {
        const ev = currentEvent(todayKey);
        const cur = progress.eventProgress?.[ev.weekKey] ?? EMPTY_EVENT_PROGRESS;
        if (cur.claimed) return { ok: false, reason: 'Ya reclamaste el premio de esta semana.' };
        const allDone = cur.learned.length >= ev.event.words.length && cur.minigame && cur.speaking;
        if (!allDone) return { ok: false, reason: 'Completa las 3 misiones del evento para abrir el premio.' };
        setProgress((p) => {
          const h = p.house ?? DEFAULT_HOUSE;
          return {
            ...p,
            coins: p.coins + ev.event.rewardCoins,
            house: { ...h, owned: Array.from(new Set([...h.owned, ev.event.rewardFurnitureId])) },
            eventProgress: { ...(p.eventProgress ?? {}), [ev.weekKey]: { ...cur, claimed: true } },
          };
        });
        bumpStats({ happiness: 25 });
        triggerPetEmotion('celebrate', 5200);
        return { ok: true };
      },
      setReminders: (prefs) => setProgress((p) => ({ ...p, reminders: prefs })),
      house: progress.house ?? DEFAULT_HOUSE,
      upgradeHouse: () => {
        const house = progress.house ?? DEFAULT_HOUSE;
        const next = HOUSE_TIERS.find((t) => t.tier === house.tier + 1);
        if (!next) return { ok: false, reason: 'Tu casa ya está al máximo nivel.' };
        const stars = progress.stars ?? 0;
        if (progress.coins < next.coinCost) {
          return { ok: false, reason: `Te faltan ${next.coinCost - progress.coins} monedas. ¡Practica para ganar más!` };
        }
        if (stars < next.starCost) {
          return { ok: false, reason: `Te faltan ${next.starCost - stars} estrellas. Gánalas en los minijuegos.` };
        }
        setProgress((p) => ({
          ...p,
          coins: p.coins - next.coinCost,
          stars: (p.stars ?? 0) - next.starCost,
          house: { ...(p.house ?? DEFAULT_HOUSE), tier: next.tier },
        }));
        bumpStats({ happiness: 30, energy: 10 });
        triggerPetEmotion('celebrate', 5200);
        return { ok: true };
      },
      buyOrPlaceFurniture: (itemId) => {
        const item = findFurniture(itemId);
        if (!item) return { ok: false, reason: 'Mueble no encontrado.' };
        const house = progress.house ?? DEFAULT_HOUSE;
        const tier = HOUSE_TIERS.find((t) => t.tier === house.tier) ?? HOUSE_TIERS[0]!;
        if (house.tier < item.minTier) {
          const needed = HOUSE_TIERS.find((t) => t.tier === item.minTier);
          return { ok: false, reason: `Necesitas la ${needed?.nameEs ?? 'siguiente casa'} para este mueble.` };
        }
        if (!tier.slots.includes(item.slot)) {
          return { ok: false, reason: 'Tu casa actual no tiene espacio para este mueble.' };
        }
        const owned = house.owned.includes(itemId);
        if (!owned && item.eventOnly) {
          return { ok: false, reason: 'Premio exclusivo de un evento semanal. ¡Completa sus misiones!' };
        }
        if (!owned) {
          if (item.starCost && (progress.stars ?? 0) < item.starCost) {
            return { ok: false, reason: `Necesitas ${item.starCost} estrellas (minijuegos).` };
          }
          if (progress.coins < item.cost) {
            return { ok: false, reason: `Te faltan ${item.cost - progress.coins} monedas.` };
          }
        }
        setProgress((p) => {
          const h = p.house ?? DEFAULT_HOUSE;
          return {
            ...p,
            coins: owned ? p.coins : p.coins - item.cost,
            stars: owned ? p.stars : (p.stars ?? 0) - (item.starCost ?? 0),
            house: {
              ...h,
              owned: owned ? h.owned : [...h.owned, itemId],
              placed: { ...h.placed, [item.slot]: itemId },
            },
          };
        });
        bumpStats({ happiness: owned ? 3 : 12 });
        triggerPetEmotion(owned ? 'happy' : 'celebrate', 3200);
        return { ok: true, boughtNow: !owned };
      },
      removeFurniture: (slot) =>
        setProgress((p) => {
          const h = p.house ?? DEFAULT_HOUSE;
          const placed = { ...h.placed };
          delete placed[slot];
          return { ...p, house: { ...h, placed } };
        }),
      buyOrWearOutfit: (outfitId) => {
        const outfit = OUTFITS.find((o) => o.id === outfitId);
        if (!outfit) return { ok: false, reason: 'Ropa no encontrada.' };
        const ownedList = progress.ownedOutfits ?? ['none'];
        const owned = ownedList.includes(outfitId) || outfit.cost === 0;
        if (!owned && progress.coins < outfit.cost) {
          return { ok: false, reason: `Te faltan ${outfit.cost - progress.coins} monedas.` };
        }
        if (!owned) {
          setProgress((p) => ({
            ...p,
            coins: p.coins - outfit.cost,
            ownedOutfits: Array.from(new Set([...(p.ownedOutfits ?? ['none']), outfitId])),
          }));
        }
        setPet((c) => ({ ...c, outfit: outfitId }));
        triggerPetEmotion(owned ? 'happy' : 'celebrate', 3000);
        return { ok: true, boughtNow: !owned };
      },
      finishMinigame: (gameId, correct, total) => {
        const ratio = total > 0 ? correct / total : 0;
        const stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : ratio > 0 ? 1 : 0;
        const key = localDateKey();
        const prevBest = progress.minigameLog?.[key]?.[gameId] ?? -1;
        const firstToday = prevBest < 0;
        // Estrellas: solo cuenta la mejora sobre el mejor resultado del día; monedas: completas la 1.ª vez.
        const starGain = Math.max(0, stars - Math.max(0, prevBest));
        const coins = firstToday ? 6 + correct * 2 : Math.round(correct * 0.5);
        const xp = firstToday ? 10 + correct * 2 : correct;
        const wk = isoWeekKey(key);
        const ev = currentEvent(key);
        setProgress((p) => ({
          ...p,
          stars: (p.stars ?? 0) + starGain,
          coins: p.coins + coins,
          xp: p.xp + xp,
          weeklyXp: { ...(p.weeklyXp ?? {}), [wk]: (p.weeklyXp?.[wk] ?? 0) + xp },
          eventProgress:
            gameId === 'event-rush' && ratio >= 0.6
              ? {
                  ...(p.eventProgress ?? {}),
                  [ev.weekKey]: { ...(p.eventProgress?.[ev.weekKey] ?? EMPTY_EVENT_PROGRESS), minigame: true },
                }
              : p.eventProgress,
          minigameLog: {
            ...(p.minigameLog ?? {}),
            [key]: { ...(p.minigameLog?.[key] ?? {}), [gameId]: Math.max(prevBest, stars) },
          },
        }));
        bumpStats({ happiness: 6 + stars * 3, energy: 4 });
        triggerPetEmotion(stars >= 2 ? 'celebrate' : 'happy', 4200);
        return { stars: starGain, coins, xp, firstToday };
      },
      triggerPetEmotion,
      recordQuizOutcome,
      addSpeechEnergy: (seconds) => {
        bumpStats({ energy: Math.min(20, seconds / 2) });
        triggerPetEmotion('celebrate', 3800);
      },
      setLevel: (level) => setProgress((p) => ({ ...p, level })),
      completeOnboarding: (config, level) => {
        registerAccount({
          playerName: config.name ?? 'Jugador',
          handle: `@${(config.name ?? 'jugador').toLowerCase()}`,
          level,
          pet: config,
        });
      },
      registerAccount,
      loginWithAccount,
      loginWithCredentials,
      logout,
      deleteAccount,
    };
  }, [
    ready,
    accounts,
    currentAccount,
    progress,
    pet,
    stats,
    emotionOverride,
    streakCelebration,
    petStage,
    pendingGrowth,
    dismissGrowth,
    todayKey,
    tab,
    screen,
    resetToTabs,
    syncNavigation,
    lastReward,
    completeActivity,
    awardDailyQuiz,
    bumpStats,
    triggerPetEmotion,
    recordQuizOutcome,
    registerAccount,
    loginWithAccount,
    loginWithCredentials,
    logout,
    deleteAccount,
  ]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

export function useOptionalGame(): GameContextValue | null {
  return useContext(GameContext);
}

