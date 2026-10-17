import { isoWeekKey, localDateKey, weekStartKey, addDaysKey } from '@lingopulse/shared';

/**
 * Eventos semanales temáticos: cada semana ISO cambia el tema. Traen vocabulario
 * real de ese mundo, 3 misiones y un premio exclusivo para la casa de la mascota.
 */

export interface EventWord {
  id: string;
  term: string;
  meaningEs: string;
  definitionEn: string;
  example: string;
}

export interface WeeklyEvent {
  id: 'pirate' | 'gamer' | 'fandom' | 'traveler';
  titleEs: string;
  taglineEs: string;
  glyph: string;
  colors: readonly [string, string];
  soft: string;
  rewardFurnitureId: string;
  rewardCoins: number;
  speakingPromptEn: string;
  words: EventWord[];
}

export const WEEKLY_EVENTS: WeeklyEvent[] = [
  {
    id: 'pirate',
    titleEs: 'Semana Pirata',
    taglineEs: 'Zarpa con expresiones de aventura y trabajo en equipo.',
    glyph: 'ship',
    colors: ['#4FACFE', '#2B3B5C'],
    soft: '#E6F2FF',
    rewardFurnitureId: 'event-parrot',
    rewardCoins: 60,
    speakingPromptEn: 'Tell me about a big adventure you would like to go on with your friends.',
    words: [
      { id: 'pir-set-sail', term: 'set sail', meaningEs: 'zarpar, empezar un viaje', definitionEn: 'To start a journey, especially by boat.', example: "We set sail for the island at dawn." },
      { id: 'pir-all-hands', term: 'all hands on deck', meaningEs: '¡todos a ayudar!', definitionEn: 'Everyone needs to help right now.', example: "It's launch day — all hands on deck!" },
      { id: 'pir-smooth', term: 'smooth sailing', meaningEs: 'sin problemas, viento en popa', definitionEn: 'Easy progress with no problems.', example: 'After the first week, it was smooth sailing.' },
      { id: 'pir-crew', term: 'crew', meaningEs: 'tripulación, equipo', definitionEn: 'A group of people who work together.', example: 'My crew and I are going to the beach.' },
      { id: 'pir-on-board', term: 'on board', meaningEs: 'a bordo; de acuerdo con un plan', definitionEn: 'On a ship or plane; also, agreeing to a plan.', example: 'Is everyone on board with the idea?' },
      { id: 'pir-treasure', term: 'treasure', meaningEs: 'tesoro; valorar mucho', definitionEn: 'Valuable things; to value something a lot.', example: 'I treasure the memories of that trip.' },
    ],
  },
  {
    id: 'gamer',
    titleEs: 'Semana Gamer',
    taglineEs: 'El inglés que se usa en partidas, streams y chats.',
    glyph: 'bolt',
    colors: ['#A48BFF', '#5E35E8'],
    soft: '#F2EEFF',
    rewardFurnitureId: 'event-arcade',
    rewardCoins: 60,
    speakingPromptEn: 'What is your favourite video game and why do you love it?',
    words: [
      { id: 'gam-level-up', term: 'level up', meaningEs: 'subir de nivel, mejorar', definitionEn: 'To reach a higher level or improve a skill.', example: 'I want to level up my English this year.' },
      { id: 'gam-grind', term: 'grind', meaningEs: 'repetir mucho para avanzar; esfuerzo constante', definitionEn: 'To do something repetitive to make progress.', example: "I've been grinding vocabulary all week." },
      { id: 'gam-gg', term: 'GG (good game)', meaningEs: 'buena partida', definitionEn: 'A polite way to say a match was good.', example: 'GG everyone, that was close!' },
      { id: 'gam-noob', term: 'noob', meaningEs: 'novato', definitionEn: 'A beginner (can be friendly or rude).', example: "Don't worry, everyone is a noob at first." },
      { id: 'gam-respawn', term: 'respawn', meaningEs: 'reaparecer', definitionEn: 'To appear again in a game after losing.', example: 'Wait for me, I respawn in ten seconds.' },
      { id: 'gam-op', term: 'OP (overpowered)', meaningEs: 'demasiado fuerte', definitionEn: 'Much stronger than it should be.', example: 'That new character is totally OP.' },
    ],
  },
  {
    id: 'fandom',
    titleEs: 'Semana Fans',
    taglineEs: 'Anime, K-pop y series: habla como un fan de verdad.',
    glyph: 'heart',
    colors: ['#FF9EBB', '#FF4F81'],
    soft: '#FFF0F5',
    rewardFurnitureId: 'event-lantern',
    rewardCoins: 60,
    speakingPromptEn: 'Which series, band or anime are you obsessed with right now? Convince me to watch it.',
    words: [
      { id: 'fan-binge', term: 'binge-watch', meaningEs: 'ver muchos episodios seguidos', definitionEn: 'To watch many episodes in one go.', example: 'I binge-watched the whole season on Sunday.' },
      { id: 'fan-spoiler', term: 'spoiler', meaningEs: 'spoiler, revelar el final', definitionEn: 'Information that reveals what happens.', example: 'No spoilers, please! I haven’t finished it.' },
      { id: 'fan-hype', term: 'hype', meaningEs: 'emoción, expectativa', definitionEn: 'Great excitement about something new.', example: 'The hype for the new album is unreal.' },
      { id: 'fan-stan', term: 'stan', meaningEs: 'ser súper fan', definitionEn: 'To be a very devoted fan.', example: 'I stan this band so much.' },
      { id: 'fan-bias', term: 'bias', meaningEs: 'favorito de un grupo', definitionEn: 'Your favourite member of a group.', example: 'Who is your bias in the group?' },
      { id: 'fan-hooked', term: 'be hooked on', meaningEs: 'estar enganchado a', definitionEn: 'To like something so much you can’t stop.', example: "I'm totally hooked on this anime." },
    ],
  },
  {
    id: 'traveler',
    titleEs: 'Semana Viajera',
    taglineEs: 'Aeropuertos, hoteles y mochilas: inglés para viajar.',
    glyph: 'map',
    colors: ['#4FD8A8', '#1FA87A'],
    soft: '#E9FAF0',
    rewardFurnitureId: 'event-suitcase',
    rewardCoins: 60,
    speakingPromptEn: 'Describe your dream trip: where would you go and what would you do?',
    words: [
      { id: 'tra-check-in', term: 'check in', meaningEs: 'registrarse (hotel/vuelo)', definitionEn: 'To register at a hotel or airport.', example: 'We can check in after 3 p.m.' },
      { id: 'tra-layover', term: 'layover', meaningEs: 'escala', definitionEn: 'A short stop between two flights.', example: 'I have a four-hour layover in Madrid.' },
      { id: 'tra-jet-lag', term: 'jet lag', meaningEs: 'desfase horario', definitionEn: 'Tiredness after flying across time zones.', example: "I've got terrible jet lag." },
      { id: 'tra-itinerary', term: 'itinerary', meaningEs: 'itinerario', definitionEn: 'A plan of a journey.', example: 'Can you send me the itinerary?' },
      { id: 'tra-backpacking', term: 'go backpacking', meaningEs: 'viajar de mochilero', definitionEn: 'To travel cheaply with a backpack.', example: 'We went backpacking around Peru.' },
      { id: 'tra-souvenir', term: 'souvenir', meaningEs: 'recuerdo de viaje', definitionEn: 'Something you buy to remember a place.', example: 'I bought a little souvenir for my mum.' },
    ],
  },
];

export function currentEvent(dateKey: string = localDateKey()): { event: WeeklyEvent; weekKey: string } {
  const weekKey = isoWeekKey(dateKey);
  const weekNum = Number(weekKey.split('W')[1] ?? 0);
  return { event: WEEKLY_EVENTS[weekNum % WEEKLY_EVENTS.length]!, weekKey };
}

/** Días y horas que quedan hasta el lunes siguiente. */
export function eventTimeLeft(now = new Date()): { days: number; hours: number } {
  const nextMonday = addDaysKey(weekStartKey(localDateKey(now)), 7);
  const [y, m, d] = nextMonday.split('-').map(Number);
  const end = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getTime();
  const ms = Math.max(0, end - now.getTime());
  return { days: Math.floor(ms / 86_400_000), hours: Math.floor((ms % 86_400_000) / 3_600_000) };
}

export interface EventProgress {
  learned: string[];
  minigame: boolean;
  speaking: boolean;
  claimed: boolean;
}

export const EMPTY_EVENT_PROGRESS: EventProgress = { learned: [], minigame: false, speaking: false, claimed: false };

export function eventMissions(event: WeeklyEvent, p: EventProgress) {
  return [
    { id: 'words', labelEs: `Aprende las ${event.words.length} palabras del evento`, done: p.learned.length >= event.words.length, progress: p.learned.length / event.words.length, glyph: 'sparkle' },
    { id: 'minigame', labelEs: 'Gana la Carrera del Evento (minijuego)', done: p.minigame, progress: p.minigame ? 1 : 0, glyph: 'bolt' },
    { id: 'speaking', labelEs: 'Completa 1 práctica de Speaking esta semana', done: p.speaking, progress: p.speaking ? 1 : 0, glyph: 'mic' },
  ];
}
