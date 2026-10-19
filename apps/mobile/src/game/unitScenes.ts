import type { TopicIllustrationKind } from '../components/CustomTopicIcons';

/**
 * Escena temática de cada isla (unidad): qué decorado 3D tiene, qué hace la mascota
 * y con qué personaje interactúa. La isla actual se muestra en 3D con la mascota actuando.
 */
export type UnitSceneTheme =
  | 'greet'
  | 'family'
  | 'home'
  | 'routine'
  | 'cafe'
  | 'market'
  | 'weather'
  | 'hobby'
  | 'town'
  | 'health'
  | 'memory'
  | 'travel'
  | 'hotel'
  | 'cook'
  | 'party'
  | 'work'
  | 'tech'
  | 'money'
  | 'nature'
  | 'mystery'
  | 'news'
  | 'choices'
  | 'justice'
  | 'speech'
  | 'science'
  | 'books';

export type PetSceneAction = 'wave' | 'eat' | 'dance' | 'cheer' | 'think' | 'talk' | 'read' | 'hug' | 'stretch';
export type SceneNpc = 'friend' | 'kid' | 'robot' | 'vendor' | null;

export interface UnitSceneMeta {
  action: PetSceneAction;
  npc: SceneNpc;
  /** Ilustración 2D para las islas que no están activas. */
  illustration: TopicIllustrationKind;
  /** Frase corta del bocadillo sobre la isla activa. */
  bubbleEn: string;
}

export const SCENE_META: Record<UnitSceneTheme, UnitSceneMeta> = {
  greet: { action: 'wave', npc: 'friend', illustration: 'daily_life', bubbleEn: 'Hi! Nice to meet you!' },
  family: { action: 'hug', npc: 'kid', illustration: 'daily_life', bubbleEn: 'This is my family!' },
  home: { action: 'wave', npc: null, illustration: 'daily_life', bubbleEn: 'Welcome to my home!' },
  routine: { action: 'stretch', npc: null, illustration: 'daily_life', bubbleEn: 'Good morning!' },
  cafe: { action: 'eat', npc: 'vendor', illustration: 'coffee', bubbleEn: 'A latte, please!' },
  market: { action: 'talk', npc: 'vendor', illustration: 'shopping', bubbleEn: 'How much is it?' },
  weather: { action: 'cheer', npc: null, illustration: 'daily_life', bubbleEn: 'It’s sunny today!' },
  hobby: { action: 'dance', npc: null, illustration: 'culture', bubbleEn: 'I love music!' },
  town: { action: 'wave', npc: 'friend', illustration: 'travel', bubbleEn: 'Where is the station?' },
  health: { action: 'stretch', npc: null, illustration: 'daily_life', bubbleEn: 'Stay healthy!' },
  memory: { action: 'think', npc: null, illustration: 'culture', bubbleEn: 'I remember when…' },
  travel: { action: 'wave', npc: null, illustration: 'travel', bubbleEn: 'Let’s travel!' },
  hotel: { action: 'talk', npc: 'vendor', illustration: 'travel', bubbleEn: 'I have a reservation.' },
  cook: { action: 'eat', npc: null, illustration: 'coffee', bubbleEn: 'Yummy!' },
  party: { action: 'cheer', npc: 'friend', illustration: 'culture', bubbleEn: 'Happy birthday!' },
  work: { action: 'talk', npc: 'friend', illustration: 'career', bubbleEn: 'I’m ready for the job!' },
  tech: { action: 'wave', npc: 'robot', illustration: 'tech', bubbleEn: 'Hello, robot!' },
  money: { action: 'cheer', npc: null, illustration: 'shopping', bubbleEn: 'Save and spend wisely!' },
  nature: { action: 'cheer', npc: null, illustration: 'daily_life', bubbleEn: 'Let’s protect the planet!' },
  mystery: { action: 'think', npc: null, illustration: 'oracle', bubbleEn: 'What could it be?' },
  news: { action: 'read', npc: null, illustration: 'debate', bubbleEn: 'Is this news real?' },
  choices: { action: 'think', npc: null, illustration: 'oracle', bubbleEn: 'Which way should I go?' },
  justice: { action: 'talk', npc: null, illustration: 'debate', bubbleEn: 'Order in the court!' },
  speech: { action: 'talk', npc: null, illustration: 'debate', bubbleEn: 'Ladies and gentlemen…' },
  science: { action: 'think', npc: null, illustration: 'tech', bubbleEn: 'Let’s experiment!' },
  books: { action: 'read', npc: null, illustration: 'culture', bubbleEn: 'What a great story!' },
};

const UNIT_THEMES: Record<string, UnitSceneTheme> = {
  'a1-01': 'greet', 'a1-02': 'family', 'a1-03': 'home', 'a1-04': 'routine', 'a1-05': 'family', 'a1-06': 'cafe',
  'a1-07': 'market', 'a1-08': 'weather', 'a1-09': 'hobby', 'a1-10': 'town', 'a1-11': 'health', 'a1-12': 'memory',
  'a2-01': 'travel', 'a2-02': 'hotel', 'a2-03': 'cook', 'a2-04': 'health', 'a2-05': 'market', 'a2-06': 'travel',
  'a2-07': 'party', 'a2-08': 'town', 'a2-09': 'work', 'a2-10': 'tech', 'a2-11': 'money', 'a2-12': 'nature',
  'b1-01': 'greet', 'b1-02': 'mystery', 'b1-03': 'memory', 'b1-04': 'work', 'b1-05': 'news', 'b1-06': 'travel',
  'b1-07': 'greet', 'b1-08': 'health', 'b1-09': 'nature', 'b1-10': 'market', 'b1-11': 'home', 'b1-12': 'choices',
  'b2-01': 'work', 'b2-02': 'tech', 'b2-03': 'travel', 'b2-04': 'news', 'b2-05': 'work', 'b2-06': 'town',
  'b2-07': 'justice', 'b2-08': 'work', 'b2-09': 'health', 'b2-10': 'town', 'b2-11': 'market', 'b2-12': 'speech',
  'c1-01': 'speech', 'c1-02': 'justice', 'c1-03': 'choices', 'c1-04': 'books', 'c1-05': 'news', 'c1-06': 'science',
  'c1-07': 'speech', 'c1-08': 'money', 'c1-09': 'tech', 'c1-10': 'memory', 'c1-11': 'health', 'c1-12': 'memory',
  'c2-01': 'books', 'c2-02': 'speech', 'c2-03': 'justice', 'c2-04': 'tech', 'c2-05': 'books', 'c2-06': 'mystery',
  'c2-07': 'speech', 'c2-08': 'nature', 'c2-09': 'money', 'c2-10': 'science', 'c2-11': 'news', 'c2-12': 'books',
};

export function unitSceneTheme(unitId: string): UnitSceneTheme {
  return UNIT_THEMES[unitId] ?? 'greet';
}
