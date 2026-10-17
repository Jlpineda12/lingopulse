/**
 * Modelo del compañero 3D (Tamagotchi de Aprendizaje con personalización y emociones estilo Tomodachi Life).
 * - Incluye creador físico 3D completo (especie, complexión Chibi/Redondito/Alto, cejas, boca, mejillas/pecas, ojos y gorros).
 * - Incluye personalidad Tomodachi, sintetizador de voz (tono + velocidad) y muletilla personal (catchphrase).
 * - Incluye espectro de emociones reactivas en vivo: happy, ok, hungry, sleepy (dormid@), sad,
 *   angry (enojo al fallar), rage (ira cómica con vapor y marca de enojo al fallar seguido), love (al acariciar),
 *   eating (al alimentar) y celebrate (al acertar).
 */

export type PetSpecies = 'puff' | 'cat' | 'meeseeks' | 'dragon' | 'bear' | 'bunny' | 'fox' | 'shark';

export type HairStyleId =
  | 'spiky'
  | 'bob'
  | 'afro'
  | 'ponytail'
  | 'twintails'
  | 'pompadour'
  | 'curly'
  | 'mohawk'
  | 'bun'
  | 'none';

export type EyeStyle =
  | 'round'
  | 'sparkle'
  | 'happy'
  | 'wink'
  | 'fierce'
  | 'anime'
  | 'sleepy'
  | 'heart'
  | 'cool'
  | 'starry';

export type BrowStyle =
  | 'soft'
  | 'bold'
  | 'hero'
  | 'worried'
  | 'raised'
  | 'dot'
  | 'unibrow'
  | 'slit'
  | 'short'
  | 'none';

export type MouthStyle =
  | 'smile'
  | 'cat'
  | 'grin'
  | 'smirk'
  | 'o'
  | 'tongue'
  | 'fangs'
  | 'pout'
  | 'wavy'
  | 'kiss';

export type BlushStyle =
  | 'pink'
  | 'peach'
  | 'freckles'
  | 'star'
  | 'hearts'
  | 'bandaid'
  | 'whiskers'
  | 'stripes'
  | 'dimples'
  | 'none';

export type BodyScale = 'normal' | 'chibi' | 'chubby' | 'tall';
export type PetPersonality = 'energetic' | 'sassy' | 'sweet' | 'chill' | 'genius';

export type AccessoryId =
  | 'none'
  | 'beret'
  | 'cap'
  | 'bow'
  | 'glasses'
  | 'headphones'
  | 'crown'
  | 'wizard'
  | 'halo'
  | 'flower'
  | 'strawhat'
  | 'captain'
  | 'bandana'
  | 'eyepatch';

export type OutfitId = 'none' | 'vest' | 'sailor' | 'coat' | 'hoodie' | 'scarf';

export type HabitatPropId =
  | 'none'
  | 'campfire'
  | 'boombox'
  | 'bonsai'
  | 'treasure'
  | 'telescope';

export interface PetConfig {
  name: string;
  species: PetSpecies;
  bodyColor: string;
  bellyColor: string;
  eyeStyle: EyeStyle;
  accessory: AccessoryId;
  // Rasgos 3D estilo Tomodachi Life
  hairStyle?: HairStyleId;
  hairColor?: string;
  browStyle?: BrowStyle;
  mouthStyle?: MouthStyle;
  blushStyle?: BlushStyle;
  bodyScale?: BodyScale;
  personality?: PetPersonality;
  voicePitch?: number;
  voiceRate?: number;
  catchphrase?: string;
  habitatProp?: HabitatPropId;
  customNamed?: boolean;
  /** Ropa del torso (chaleco pirata, marinero, abrigo de capitán…). */
  outfit?: OutfitId;
}

export interface PetStats {
  fullness: number;
  energy: number;
  happiness: number;
  lastUpdated: number;
}

export type PetMood =
  | 'happy'
  | 'ok'
  | 'hungry'
  | 'sleepy'
  | 'sad'
  | 'angry'
  | 'rage'
  | 'love'
  | 'eating'
  | 'celebrate';

export const DEFAULT_PET: PetConfig = {
  name: '',
  species: 'puff',
  bodyColor: '#FFB7CE',
  bellyColor: '#FF4F79',
  hairStyle: 'spiky',
  hairColor: '#5C3A21',
  eyeStyle: 'sparkle',
  accessory: 'none',
  browStyle: 'soft',
  mouthStyle: 'smile',
  blushStyle: 'pink',
  bodyScale: 'normal',
  personality: 'energetic',
  voicePitch: 1.15,
  voiceRate: 1.0,
  catchphrase: 'Let’s go!',
  habitatProp: 'campfire',
  customNamed: false,
  outfit: 'none',
};

const LEGACY_PRESET_NAMES = new Set([
  '',
  'kirby',
  'meeseeks',
  'mr. meeseeks',
  'pip',
]);

/** Verifica si el usuario aún no le ha puesto su propio nombre personalizado al muñeco. */
export function isPetUnnamed(pet: Pick<PetConfig, 'name' | 'customNamed'>): boolean {
  const trimmed = (pet.name ?? '').trim();
  if (!trimmed) return true;
  if (pet.customNamed) return false;
  return LEGACY_PRESET_NAMES.has(trimmed.toLowerCase());
}

/** Nombre visible en la UI mientras el usuario termina de bautizar a su muñeco. */
export function displayPetName(name?: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed || LEGACY_PRESET_NAMES.has(trimmed.toLowerCase())) {
    return 'Tu Muñeco';
  }
  return trimmed;
}

export const DEFAULT_STATS: PetStats = {
  fullness: 78,
  energy: 75,
  happiness: 84,
  lastUpdated: Date.now(),
};

/** 12 Colores de Cuerpo / Piel estilo Toon Luminoso (sin negros). */
export const BODY_COLORS = [
  '#FFB7CE', // Rosa Pastel
  '#FFE0C8', // Piel Durazno Claro
  '#F5C396', // Piel Miel Cálida
  '#C68B59', // Piel Canela
  '#8D5524', // Piel Cacao
  '#48CAE4', // Azul Cielo
  '#FFD59A', // Ámbar Sol
  '#9EE6C4', // Menta Glaciar
  '#A9B9FF', // Azul Lavanda
  '#C9B5FF', // Lila Mágico
  '#FFF1A8', // Crema Limón
  '#FF9E80', // Coral Suave
];

/** 12 Colores de Zapatos, Ropa y Detalles. */
export const BELLY_COLORS = [
  '#FF4F79', // Coral Intenso
  '#FF7A1A', // Naranja Cumbre
  '#5B5BD6', // Índigo Real
  '#2EC4B6', // Turquesa Isla
  '#F2A900', // Oro Sol
  '#9B5DE5', // Púrpura Cristal
  '#2563EB', // Azul Cobalto
  '#16A34A', // Verde Bosque
  '#E11D48', // Rubí
  '#0D9488', // Esmeralda
  '#D97706', // Bronce
  '#7C3AED', // Violeta
];

/** 12 Colores para el Cabello 3D. */
export const HAIR_COLORS = [
  '#4A2E1B', // Castaño Oscuro
  '#7C4A27', // Castaño Avellana
  '#F4B942', // Rubio Dorado
  '#E85D2A', // Pelirrojo Cobrizo
  '#FF6B9D', // Rosa Sakura
  '#38BDF8', // Azul Celeste
  '#8B5CF6', // Lavanda Anime
  '#22C55E', // Menta Esmeralda
  '#E2E8F0', // Plata / Blanco Nieve
  '#FB7185', // Coral Fresa
  '#FACC15', // Amarillo Eléctrico
  '#312E81', // Azul Medianoche (sin negro)
];

/** Colores base sugeridos al cambiar la silueta del muñeco (sin nombres predefinidos). */
export const SPECIES_PRESET_COLORS: Record<
  PetSpecies,
  {
    bodyColor: string;
    bellyColor: string;
    taglineEs: string;
    defaultPersonality: PetPersonality;
    defaultCatchphrase: string;
    defaultPitch: number;
  }
> = {
  puff: {
    bodyColor: '#FFE0C8',
    bellyColor: '#FF4F79',
    taglineEs: 'Silueta Chibi Redondita con zapatitos y cristal de voz',
    defaultPersonality: 'energetic',
    defaultCatchphrase: 'Let’s go!',
    defaultPitch: 1.2,
  },
  meeseeks: {
    bodyColor: '#F5C396',
    bellyColor: '#2563EB',
    taglineEs: 'Silueta Esbelta Tomodachi con cabeza y torso articulados',
    defaultPersonality: 'sassy',
    defaultCatchphrase: 'Easy peasy!',
    defaultPitch: 1.08,
  },
  cat: {
    bodyColor: '#FFD59A',
    bellyColor: '#FF4F79',
    taglineEs: 'Silueta Felina 3D con orejas puntiagudas y cola animada',
    defaultPersonality: 'sassy',
    defaultCatchphrase: 'Purr-fect English!',
    defaultPitch: 1.18,
  },
  dragon: {
    bodyColor: '#9EE6C4',
    bellyColor: '#F2A900',
    taglineEs: 'Silueta Alada 3D con cuernitos dorados y alitas',
    defaultPersonality: 'genius',
    defaultCatchphrase: 'Fire up that fluency!',
    defaultPitch: 0.92,
  },
  bear: {
    bodyColor: '#A9B9FF',
    bellyColor: '#5B5BD6',
    taglineEs: 'Silueta Alpina 3D con orejas redondas y hocico esculpido',
    defaultPersonality: 'chill',
    defaultCatchphrase: 'Stay cool and speak on!',
    defaultPitch: 0.85,
  },
  fox: {
    bodyColor: '#FFB27A',
    bellyColor: '#E63946',
    taglineEs: 'Zorro explorador con orejas en punta y cola esponjosa',
    defaultPersonality: 'sassy',
    defaultCatchphrase: 'Too easy!',
    defaultPitch: 1.12,
  },
  shark: {
    bodyColor: '#8FB8FF',
    bellyColor: '#2B3B5C',
    taglineEs: 'Grumete de los mares con aleta, cola y colmillitos',
    defaultPersonality: 'energetic',
    defaultCatchphrase: 'Full speed ahead!',
    defaultPitch: 1.0,
  },
  bunny: {
    bodyColor: '#C9B5FF',
    bellyColor: '#9B5DE5',
    taglineEs: 'Silueta Lunar 3D con orejas largas que rebotan al hablar',
    defaultPersonality: 'sweet',
    defaultCatchphrase: 'Hop into action!',
    defaultPitch: 1.24,
  },
};

export const SPECIES: Array<{
  id: PetSpecies;
  label: string;
  subtitleEs: string;
  glyph: string;
  unlockLevel: number;
}> = [
  { id: 'puff', label: 'Chibi Redondo', subtitleEs: 'Clásico compacto', glyph: 'species-puff', unlockLevel: 1 },
  { id: 'meeseeks', label: 'Muñeco Esbelto', subtitleEs: 'Torso y cuello 3D', glyph: 'species-meeseeks', unlockLevel: 1 },
  { id: 'cat', label: 'Orejitas Felinas', subtitleEs: 'Con cola 3D', glyph: 'species-cat', unlockLevel: 1 },
  { id: 'dragon', label: 'Guardián Alado', subtitleEs: 'Con alas y cuernos', glyph: 'species-dragon', unlockLevel: 1 },
  { id: 'bear', label: 'Montañero', subtitleEs: 'Orejas redondas', glyph: 'species-bear', unlockLevel: 1 },
  { id: 'bunny', label: 'Viajero Lunar', subtitleEs: 'Orejas largas', glyph: 'species-bunny', unlockLevel: 1 },
  { id: 'fox', label: 'Zorro Explorador', subtitleEs: 'Cola esponjosa', glyph: 'species-fox', unlockLevel: 2 },
  { id: 'shark', label: 'Tiburón Grumete', subtitleEs: 'Aleta y colmillitos', glyph: 'species-shark', unlockLevel: 3 },
];

/** 10 Modelos 3D de Cabello para el Creador Tomodachi Life. */
export const HAIR_STYLES: Array<{ id: HairStyleId; label: string }> = [
  { id: 'spiky', label: 'Puntas Anime' },
  { id: 'bob', label: 'Melena Bob' },
  { id: 'afro', label: 'Afro 3D' },
  { id: 'ponytail', label: 'Coleta Alta' },
  { id: 'twintails', label: 'Dos Coletas' },
  { id: 'pompadour', label: 'Copete Tupé' },
  { id: 'curly', label: 'Rizos Suaves' },
  { id: 'mohawk', label: 'Cresta Punk' },
  { id: 'bun', label: 'Chongo Alto' },
  { id: 'none', label: 'Sin Cabello' },
];

/** 10 Modelos 3D de Ojos para el Creador Tomodachi Life. */
export const EYE_STYLES: Array<{ id: EyeStyle; label: string }> = [
  { id: 'round', label: 'Clásicos' },
  { id: 'sparkle', label: 'Estrellados' },
  { id: 'happy', label: 'Arcos ^^' },
  { id: 'wink', label: 'Guiño ;)' },
  { id: 'fierce', label: 'Valientes' },
  { id: 'anime', label: 'Kawaii Grandes' },
  { id: 'sleepy', label: 'Soñolientos' },
  { id: 'heart', label: 'Corazones' },
  { id: 'cool', label: 'Mirada Cool' },
  { id: 'starry', label: 'Pupila Sol' },
];

/** 10 Modelos 3D de Cejas para el Creador Tomodachi Life. */
export const BROW_STYLES: Array<{ id: BrowStyle; label: string; glyph: string }> = [
  { id: 'soft', label: 'Suaves', glyph: 'brow-soft' },
  { id: 'bold', label: 'Cejotas Mii', glyph: 'brow-bold' },
  { id: 'hero', label: 'Valientes', glyph: 'brow-hero' },
  { id: 'worried', label: 'Tiernas', glyph: 'brow-worried' },
  { id: 'raised', label: 'Arqueadas', glyph: 'brow-raised' },
  { id: 'dot', label: 'Puntitos 3D', glyph: 'brow-dot' },
  { id: 'unibrow', label: 'Uniceja', glyph: 'brow-unibrow' },
  { id: 'slit', label: 'Corte Urbano', glyph: 'brow-slit' },
  { id: 'short', label: 'Finas Cortas', glyph: 'brow-short' },
  { id: 'none', label: 'Sin Cejas', glyph: 'brow-none' },
];

/** 10 Modelos 3D de Boca para el Creador Tomodachi Life. */
export const MOUTH_STYLES: Array<{ id: MouthStyle; label: string; glyph: string }> = [
  { id: 'smile', label: 'Sonrisa', glyph: 'mouth-smile' },
  { id: 'cat', label: 'Felina :3', glyph: 'mouth-cat' },
  { id: 'grin', label: 'Dientes :D', glyph: 'mouth-grin' },
  { id: 'smirk', label: 'Confiada', glyph: 'mouth-smirk' },
  { id: 'o', label: 'Asombro :O', glyph: 'mouth-o' },
  { id: 'tongue', label: 'Lengüita :P', glyph: 'mouth-tongue' },
  { id: 'fangs', label: 'Colmillitos', glyph: 'mouth-fangs' },
  { id: 'pout', label: 'Puchero', glyph: 'mouth-pout' },
  { id: 'wavy', label: 'Ondulada ~', glyph: 'mouth-wavy' },
  { id: 'kiss', label: 'Besito 3', glyph: 'mouth-kiss' },
];

/** 10 Modelos 3D de Mejillas y Rasgos Faciales para el Creador Tomodachi Life. */
export const BLUSH_STYLES: Array<{ id: BlushStyle; label: string; glyph: string }> = [
  { id: 'pink', label: 'Rubor Rosa', glyph: 'blush-pink' },
  { id: 'peach', label: 'Durazno', glyph: 'blush-peach' },
  { id: 'freckles', label: 'Pequitas 3D', glyph: 'blush-freckles' },
  { id: 'star', label: 'Estrellitas', glyph: 'blush-star' },
  { id: 'hearts', label: 'Corazones', glyph: 'blush-hearts' },
  { id: 'bandaid', label: 'Curita Cairn', glyph: 'blush-bandaid' },
  { id: 'whiskers', label: 'Bigotitos', glyph: 'blush-whiskers' },
  { id: 'stripes', label: 'Pintura Cumbre', glyph: 'blush-stripes' },
  { id: 'dimples', label: 'Hoyuelos', glyph: 'blush-dimples' },
  { id: 'none', label: 'Rostro Limpio', glyph: 'blush-none' },
];

export const BODY_SCALES: Array<{ id: BodyScale; label: string; glyph: string }> = [
  { id: 'normal', label: 'Balanceado', glyph: 'scale-normal' },
  { id: 'chibi', label: 'Chibi Cabezón', glyph: 'scale-chibi' },
  { id: 'chubby', label: 'Redondito', glyph: 'scale-chubby' },
  { id: 'tall', label: 'Alto Esbelto', glyph: 'scale-tall' },
];

export const PERSONALITIES: Array<{
  id: PetPersonality;
  labelEs: string;
  glyph: string;
  descEs: string;
}> = [
  {
    id: 'energetic',
    labelEs: 'Hiperactivo',
    glyph: 'bolt',
    descEs: 'Salta el doble de alto cuando aciertas y te anima a romper récords.',
  },
  {
    id: 'sassy',
    labelEs: 'Temperamental',
    glyph: 'anger',
    descEs: 'Al estilo Tomodachi: si fallas se enoja y echa humo cómico para que te concentres.',
  },
  {
    id: 'sweet',
    labelEs: 'Amoroso',
    glyph: 'heart',
    descEs: 'Adora que lo acaricien, lanza corazones 3D y te consuela si te equivocas.',
  },
  {
    id: 'chill',
    labelEs: 'Dormilón Zen',
    glyph: 'moon',
    descEs: 'Súper relajado; cuando baja su energía bosteza y se echa una siestecita con Zzz.',
  },
  {
    id: 'genius',
    labelEs: 'Sabio Pro',
    glyph: 'bulb',
    descEs: 'Obsesionado con el inglés nativo; celebra cada acierto como un científico.',
  },
];

export const VOICE_PRESETS: Array<{
  id: string;
  labelEs: string;
  glyph: string;
  pitch: number;
  rate: number;
}> = [
  { id: 'cute', labelEs: 'Aguda Chibi', glyph: 'balloon', pitch: 1.35, rate: 1.05 },
  { id: 'normal', labelEs: 'Natural', glyph: 'mic', pitch: 1.05, rate: 0.98 },
  { id: 'hyper', labelEs: 'Veloz Entusiasta', glyph: 'bolt', pitch: 1.26, rate: 1.16 },
  { id: 'deep', labelEs: 'Grave Heroica', glyph: 'megaphone', pitch: 0.78, rate: 0.92 },
  { id: 'sleepy', labelEs: 'Suave Zen', glyph: 'moon', pitch: 0.92, rate: 0.84 },
];

export const SUGGESTED_CATCHPHRASES = [
  'Booyah!',
  'Piece of cake!',
  'Easy peasy!',
  'Slay that English!',
  'Let’s gooo!',
  'Spot on!',
];

/** 10 Modelos 3D de Gorros y Accesorios. */
export const ACCESSORIES: Array<{
  id: AccessoryId;
  label: string;
  glyph: string;
  unlockLevel: number;
  collection?: CollectionId;
}> = [
  { id: 'none', label: 'Sin Gorro', glyph: 'clear', unlockLevel: 1 },
  { id: 'crown', label: 'Corona Real', glyph: 'crown', unlockLevel: 1 },
  { id: 'beret', label: 'Boina Artista', glyph: 'beret', unlockLevel: 1 },
  { id: 'cap', label: 'Gorra Urbana', glyph: 'cap', unlockLevel: 1 },
  { id: 'bow', label: 'Moño Gigante', glyph: 'bow', unlockLevel: 1 },
  { id: 'glasses', label: 'Gafas Redondas', glyph: 'glasses', unlockLevel: 1 },
  { id: 'headphones', label: 'Audífonos', glyph: 'headphones', unlockLevel: 1 },
  { id: 'wizard', label: 'Sombrero Mago', glyph: 'wizard', unlockLevel: 1 },
  { id: 'halo', label: 'Aureola 3D', glyph: 'halo', unlockLevel: 1 },
  { id: 'flower', label: 'Flor Alpina', glyph: 'flower', unlockLevel: 1 },
  { id: 'strawhat', label: 'Sombrero de Paja', glyph: 'strawhat', unlockLevel: 2, collection: 'pirate' },
  { id: 'bandana', label: 'Pañuelo Pirata', glyph: 'bandana', unlockLevel: 2, collection: 'pirate' },
  { id: 'eyepatch', label: 'Parche Valiente', glyph: 'eyepatch', unlockLevel: 3, collection: 'pirate' },
  { id: 'captain', label: 'Gorro de Capitán', glyph: 'captain', unlockLevel: 4, collection: 'pirate' },
];

export interface FoodItem {
  id: string;
  glyph: string;
  name: string;
  cost: number;
  fullness: number;
  energy: number;
  happiness: number;
}

export const FOODS: FoodItem[] = [
  { id: 'apple', glyph: 'apple', name: 'Apple', cost: 5, fullness: 15, energy: 0, happiness: 4 },
  { id: 'tea', glyph: 'tea', name: 'Royal Tea', cost: 8, fullness: 5, energy: 22, happiness: 5 },
  { id: 'onigiri', glyph: 'onigiri', name: 'Rice Ball', cost: 10, fullness: 24, energy: 6, happiness: 8 },
  { id: 'taco', glyph: 'taco', name: 'Crunchy Taco', cost: 12, fullness: 30, energy: 8, happiness: 8 },
  { id: 'meat', glyph: 'meat', name: 'Pirate Feast', cost: 18, fullness: 45, energy: 12, happiness: 14 },
  { id: 'cake', glyph: 'cake', name: 'Star Cake', cost: 20, fullness: 22, energy: 10, happiness: 24 },
];

const MIN_STAT = 8;

export function clampStat(n: number): number {
  return Math.max(MIN_STAT, Math.min(100, Math.round(n)));
}

/** Bajada suave por horas transcurridas (no baja de MIN_STAT). */
export function applyDecay(stats: PetStats, now = Date.now()): PetStats {
  const hours = Math.max(0, (now - stats.lastUpdated) / 3_600_000);
  if (hours < 0.02) return stats;
  return {
    fullness: clampStat(stats.fullness - hours * 3),
    energy: clampStat(stats.energy - hours * 1.5),
    happiness: clampStat(stats.happiness - hours * 2),
    lastUpdated: now,
  };
}

export function getMood(stats: PetStats): PetMood {
  if (stats.fullness < 25) return 'hungry';
  if (stats.energy < 32) return 'sleepy';
  if (stats.happiness < 30) return 'sad';
  if (stats.happiness >= 70 && stats.fullness >= 45) return 'happy';
  return 'ok';
}

export const MOOD_META: Record<
  PetMood,
  { glyph: string; labelEs: string; badgeBg: string; badgeColor: string }
> = {
  happy: { glyph: 'face-happy', labelEs: '¡Súper feliz!', badgeBg: '#E8FAF0', badgeColor: '#15803D' },
  ok: { glyph: 'face-ok', labelEs: 'Listo para explorar', badgeBg: '#EBF4FF', badgeColor: '#007AFF' },
  hungry: { glyph: 'face-hungry', labelEs: 'Con apetito', badgeBg: '#FFF4E3', badgeColor: '#D97706' },
  sleepy: { glyph: 'face-sleepy', labelEs: 'Dormid@ (Zzz)', badgeBg: '#F1F5FB', badgeColor: '#475569' },
  sad: { glyph: 'face-sad', labelEs: 'Necesita mimos', badgeBg: '#F3E8FF', badgeColor: '#6D28D9' },
  angry: { glyph: 'face-angry', labelEs: '¡Enojad@ por el fallo!', badgeBg: '#FFE4E6', badgeColor: '#BE123C' },
  rage: { glyph: 'face-rage', labelEs: '¡Ira total!', badgeBg: '#FFD1D6', badgeColor: '#9F1239' },
  love: { glyph: 'face-love', labelEs: '¡Feliz con tus caricias!', badgeBg: '#FCE7F3', badgeColor: '#BE185D' },
  eating: { glyph: 'face-eating', labelEs: '¡Comiendo delicioso!', badgeBg: '#FEF3C7', badgeColor: '#B45309' },
  celebrate: { glyph: 'face-celebrate', labelEs: '¡Celebrando tu acierto!', badgeBg: '#DCFCE7', badgeColor: '#15803D' },
};

export function moodMessage(
  rawName: string,
  mood: PetMood,
  catchphrase?: string
): { en: string; es: string } {
  const name = displayPetName(rawName);
  const tag = catchphrase?.trim() ? ` ${catchphrase.trim()}` : '';
  switch (mood) {
    case 'angry':
      return {
        en: `Hey! Watch out for that trap! Focus!${tag}`,
        es: `${name} se enojó por ese error. ¡Acarícialo en 3D o acierta la siguiente!`,
      };
    case 'rage':
      return {
        en: `GRRR! Come on, we know this one! Don't give up!${tag}`,
        es: `¡${name} echa humo cómico de coraje! Acarícialo en 3D para calmarlo.`,
      };
    case 'love':
      return {
        en: `Aww, that tickles! You're the best partner ever!${tag}`,
        es: `${name} está feliz con tus caricias.`,
      };
    case 'eating':
      return {
        en: `Nom nom nom! Delicious! I'm full of power now!${tag}`,
        es: `¡Qué rico! ${name} recuperó energías comiendo.`,
      };
    case 'celebrate':
      return {
        en: `YES! Nailed it! You're unstoppable today!${tag}`,
        es: `¡${name} celebra tu respuesta correcta!`,
      };
    case 'hungry':
      return {
        en: `I'm sooo hungry! Can you feed me a snack?${tag}`,
        es: `${name} tiene hambre. Dale algo de comer para animarlo.`,
      };
    case 'sleepy':
      return {
        en: `Zzz... Dreaming in English... tap my dream bubble!${tag}`,
        es: `${name} se quedó dormid@ porque su energía bajó. ¡Toca su burbuja de sueño para ver qué sueña!`,
      };
    case 'sad':
      return {
        en: `I missed you! Pet me or let's play a game!${tag}`,
        es: `${name} necesita que lo acaricies en 3D o juegues con él.`,
      };
    case 'happy':
      return {
        en: `I'm feeling great! Let's conquer the next island!${tag}`,
        es: `${name} está lleno de alegría para tu próxima misión.`,
      };
    default:
      return {
        en: `Hey! Which island are we exploring today?${tag}`,
        es: `Toca a ${name} para acariciarlo o elige una isla para practicar.`,
      };
  }
}

/** Genera una combinación aleatoria súper expresiva al estilo Tomodachi Life (conserva el nombre del usuario). */
export function randomizeTomodachiPet(keepName?: string): PetConfig {
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
  const sp = pick(SPECIES).id;
  const voice = pick(VOICE_PRESETS);
  return {
    name: keepName ?? '',
    customNamed: Boolean(keepName && keepName.trim().length > 0),
    species: sp,
    bodyColor: pick(BODY_COLORS),
    bellyColor: pick(BELLY_COLORS),
    hairStyle: pick(HAIR_STYLES).id,
    hairColor: pick(HAIR_COLORS),
    eyeStyle: pick(EYE_STYLES).id,
    browStyle: pick(BROW_STYLES).id,
    mouthStyle: pick(MOUTH_STYLES).id,
    blushStyle: pick(BLUSH_STYLES).id,
    bodyScale: pick(BODY_SCALES).id,
    accessory: pick(ACCESSORIES).id,
    personality: pick(PERSONALITIES).id,
    voicePitch: voice.pitch,
    voiceRate: voice.rate,
    catchphrase: pick(SUGGESTED_CATCHPHRASES),
    habitatProp: pick(HABITAT_PROPS).id,
    outfit: pick(OUTFITS).id,
  };
}

export interface HabitatPropItem {
  id: HabitatPropId;
  nameEs: string;
  descEs: string;
  cost: number;
  accentColor: string;
}

/** Objetos 3D para decorar la isla-santuario del compañero (estilo Cairn + Tomodachi Life). */
export const HABITAT_PROPS: HabitatPropItem[] = [
  {
    id: 'campfire',
    nameEs: 'Fogata Alpina Cairn',
    descEs: 'Piedras talladas y fuego cálido 3D que ilumina la roca.',
    cost: 0,
    accentColor: '#FF7A1A',
  },
  {
    id: 'boombox',
    nameEs: 'Radio Lo-Fi Retro',
    descEs: 'Parlantes 3D que vibran al ritmo cuando tu mascota habla.',
    cost: 15,
    accentColor: '#3B82F6',
  },
  {
    id: 'bonsai',
    nameEs: 'Pino Bonsai de Cumbre',
    descEs: 'Arbolito alpino cel-shaded en maceta de cerámica.',
    cost: 22,
    accentColor: '#16A34A',
  },
  {
    id: 'treasure',
    nameEs: 'Cofre de Gemas Reales',
    descEs: 'Cofre 3D abierto con cristales y lingotes brillantes.',
    cost: 28,
    accentColor: '#EAB308',
  },
  {
    id: 'telescope',
    nameEs: 'Telescopio Estelar',
    descEs: 'Telescopio de bronce sobre trípode para explorar nuevas islas.',
    cost: 35,
    accentColor: '#8B5CF6',
  },
  {
    id: 'none',
    nameEs: 'Isla Despejada',
    descEs: 'Solo la roca flotante minimalista sin objetos.',
    cost: 0,
    accentColor: '#64748B',
  },
];

export interface TomodachiDream {
  id: string;
  sceneType: 'coffee_cloud' | 'cairn_peak' | 'taco_rain' | 'vinyl_concert' | 'star_crown';
  titleEs: string;
  dreamBubbleEn: string;
  questionEs: string;
  options: [string, string, string];
  correctIndex: number;
  explanationEs: string;
  rewardCoins: number;
  rewardXp: number;
}

/**
 * Mini-retos de "Espiar la Burbuja de Sueño" inspirados en Tomodachi Life:
 * Cuando la mascota duerme, el jugador puede tocar su burbuja 3D y adivinar qué sueña en inglés.
 */
export const TOMODACHI_DREAMS: TomodachiDream[] = [
  {
    id: 'dream-cairn-peak',
    sceneType: 'cairn_peak',
    titleEs: 'Sueño #1 · La Cumbre de Cairn',
    dreamBubbleEn: '“I shouldn’t put off climbing this giant mountain until tomorrow... Pass me the rope!”',
    questionEs: '¿Qué está diciendo tu mascota dormida en su sueño alpino?',
    options: [
      'Que no debe posponer escalar la montaña para mañana',
      'Que quiere apagar la fogata de la montaña hoy',
      'Que perdió su cuerda bajando de la isla',
    ],
    correctIndex: 0,
    explanationEs: '¡Exacto! "Put off" significa posponer o aplazar algo.',
    rewardCoins: 18,
    rewardXp: 25,
  },
  {
    id: 'dream-coffee-cloud',
    sceneType: 'coffee_cloud',
    titleEs: 'Sueño #2 · Cafetería en las Nubes',
    dreamBubbleEn: '“Excuse me, barista! Could I grab a giant oat latte on the house? I’m totally broke in this dream!”',
    questionEs: 'En este sueño surrealista, ¿cómo quiere conseguir su café gigante?',
    options: [
      'Quiere llevarlo a su casa flotante',
      'Lo pide gratis ("on the house") porque no tiene dinero ("broke")',
      'Quiere prepararlo él mismo encima del tejado',
    ],
    correctIndex: 1,
    explanationEs: '¡Brillante! "On the house" = invita la casa (gratis), y "broke" = sin un centavo.',
    rewardCoins: 18,
    rewardXp: 25,
  },
  {
    id: 'dream-taco-rain',
    sceneType: 'taco_rain',
    titleEs: 'Sueño #3 · Tormenta de Tacos Dorados',
    dreamBubbleEn: '“Hold your horses! Don’t eat the clouds yet, wait for the golden tacos to land!”',
    questionEs: '¿Qué te pide tu mascota cuando dice "Hold your horses!" en el sueño?',
    options: [
      'Que sujetes unos caballos voladores',
      'Que tengas paciencia / esperes un momento antes de comer',
      'Que corras más rápido hacia los tacos',
    ],
    correctIndex: 1,
    explanationEs: '¡Genial! "Hold your horses" es el modismo clásico para decir "¡Espera un momento / calma!".',
    rewardCoins: 20,
    rewardXp: 25,
  },
  {
    id: 'dream-vinyl-concert',
    sceneType: 'vinyl_concert',
    titleEs: 'Sueño #4 · Concierto en la Isla Flotante',
    dreamBubbleEn: '“We didn’t rehearse at all, so let’s just play it by ear and rock this stadium!”',
    questionEs: 'Si tu mascota dice "let’s play it by ear" en el escenario, ¿qué harán?',
    options: [
      'Improvisar sobre la marcha sin plan previo',
      'Taparse los oídos por el volumen de la radio',
      'Tocar únicamente con audífonos puestos',
    ],
    correctIndex: 0,
    explanationEs: '¡Eso es! "Play it by ear" significa improvisar según vayan saliendo las cosas.',
    rewardCoins: 20,
    rewardXp: 25,
  },
];

export interface StreakSurpriseGift {
  id: string;
  minStreak: number;
  titleEs: string;
  subtitleEs: string;
  coinsBonus: number;
  unlockProp: HabitatPropId;
  unlockCatchphrase: string;
}

export const STREAK_SURPRISE_GIFTS: StreakSurpriseGift[] = [
  {
    id: 'gift-welcome',
    minStreak: 0,
    titleEs: 'Cofre de Bienvenida de la Isla',
    subtitleEs: 'Un regalo inicial de tu compañero 3D para decorar su santuario.',
    coinsBonus: 20,
    unlockProp: 'boombox',
    unlockCatchphrase: 'Rock and roll!',
  },
  {
    id: 'gift-streak-1',
    minStreak: 1,
    titleEs: 'Regalo de Llamita Encendida (1+ día)',
    subtitleEs: '¡Encendiste tu fuego de práctica! Tu mascota encontró esto en la cumbre.',
    coinsBonus: 25,
    unlockProp: 'bonsai',
    unlockCatchphrase: 'Unstoppable!',
  },
  {
    id: 'gift-streak-3',
    minStreak: 3,
    titleEs: 'Cofre Real de Racha (3+ días)',
    subtitleEs: '¡3 días seguidos dominando tus islas! Recompensa épica desbloqueada.',
    coinsBonus: 40,
    unlockProp: 'treasure',
    unlockCatchphrase: 'Legend in the making!',
  },
  {
    id: 'gift-streak-7',
    minStreak: 7,
    titleEs: 'Reliquia Astral (7+ días)',
    subtitleEs: '¡Una semana entera de fuego encendido! El telescopio estelar es tuyo.',
    coinsBonus: 65,
    unlockProp: 'telescope',
    unlockCatchphrase: 'To the stars and beyond!',
  },
];

/* ------------------------------------------------------------------ */
/* Ropa y colecciones                                                  */
/* ------------------------------------------------------------------ */

export type CollectionId = 'pirate' | 'mountain' | 'royal';

export const COLLECTIONS: Record<CollectionId, { labelEs: string; descEs: string; glyph: string; color: string }> = {
  pirate: {
    labelEs: 'Tripulación del Mar',
    descEs: 'Sombrero de paja, pañuelo, parche, abrigo de capitán y el barco como casa.',
    glyph: 'anchor',
    color: '#E63946',
  },
  mountain: {
    labelEs: 'Montañeros de Cairn',
    descEs: 'Bufanda, sudadera y cabaña para escalar cumbres de vocabulario.',
    glyph: 'flame',
    color: '#FF7A1A',
  },
  royal: {
    labelEs: 'Academia Real',
    descEs: 'Corona, aureola y castillo en las nubes para los más constantes.',
    glyph: 'crown',
    color: '#7B5CFF',
  },
};

export const OUTFITS: Array<{
  id: OutfitId;
  label: string;
  glyph: string;
  cost: number;
  color: string;
  collection?: CollectionId;
}> = [
  { id: 'none', label: 'Sin ropa', glyph: 'outfit-none', cost: 0, color: '#EDF1F9' },
  { id: 'vest', label: 'Chaleco Pirata', glyph: 'outfit-vest', cost: 30, color: '#E63946', collection: 'pirate' },
  { id: 'sailor', label: 'Marinero', glyph: 'outfit-sailor', cost: 25, color: '#2563EB', collection: 'pirate' },
  { id: 'coat', label: 'Abrigo de Capitán', glyph: 'outfit-coat', cost: 60, color: '#2B3B5C', collection: 'pirate' },
  { id: 'hoodie', label: 'Sudadera Cumbre', glyph: 'outfit-hoodie', cost: 25, color: '#22B567', collection: 'mountain' },
  { id: 'scarf', label: 'Bufanda Alpina', glyph: 'outfit-scarf', cost: 15, color: '#FF7A1A', collection: 'mountain' },
];

/* ------------------------------------------------------------------ */
/* Casa de la mascota                                                  */
/* ------------------------------------------------------------------ */

export type FurnitureSlot = 'bed' | 'floor' | 'light' | 'wall' | 'corner' | 'special';

export interface HouseTier {
  tier: number;
  id: 'tent' | 'cabin' | 'cottage' | 'ship' | 'castle';
  nameEs: string;
  descEs: string;
  glyph: string;
  coinCost: number;
  starCost: number;
  /** Colores de la escena 3D */
  floor: string;
  wall: string;
  trim: string;
  slots: FurnitureSlot[];
}

export const HOUSE_TIERS: HouseTier[] = [
  {
    tier: 0,
    id: 'tent',
    nameEs: 'Campamento del Explorador',
    descEs: 'Una isla con fogata y una carpa. ¡Todo gran viaje empieza aquí!',
    glyph: 'tent',
    coinCost: 0,
    starCost: 0,
    floor: '#7DDB9B',
    wall: '#56D39A',
    trim: '#8F9BB3',
    slots: ['floor', 'corner'],
  },
  {
    tier: 1,
    id: 'cabin',
    nameEs: 'Cabaña de Madera',
    descEs: 'Paredes de troncos, ventana y espacio para una cama y una lámpara.',
    glyph: 'cabin',
    coinCost: 60,
    starCost: 3,
    floor: '#D9A066',
    wall: '#B7743A',
    trim: '#8B5A2B',
    slots: ['bed', 'floor', 'light', 'corner'],
  },
  {
    tier: 2,
    id: 'cottage',
    nameEs: 'Casita del Valle',
    descEs: 'Paredes pastel, cuadros y un rincón de estudio para practicar inglés.',
    glyph: 'cottage',
    coinCost: 150,
    starCost: 8,
    floor: '#F3D9B1',
    wall: '#BFE3FF',
    trim: '#FFFFFF',
    slots: ['bed', 'floor', 'light', 'wall', 'corner'],
  },
  {
    tier: 3,
    id: 'ship',
    nameEs: 'Barco Pirata',
    descEs: '¡Zarpa con tu tripulación! Cubierta de madera, timón y bandera propia.',
    glyph: 'ship',
    coinCost: 320,
    starCost: 15,
    floor: '#C68B59',
    wall: '#8B5A2B',
    trim: '#F4C44E',
    slots: ['bed', 'floor', 'light', 'wall', 'corner', 'special'],
  },
  {
    tier: 4,
    id: 'castle',
    nameEs: 'Castillo en las Nubes',
    descEs: 'Para leyendas del inglés: torres de cristal, alfombra real y vistas al cielo.',
    glyph: 'castle',
    coinCost: 650,
    starCost: 30,
    floor: '#E8E2FF',
    wall: '#F3F6FC',
    trim: '#C9B5FF',
    slots: ['bed', 'floor', 'light', 'wall', 'corner', 'special'],
  },
];

export interface FurnitureItem {
  id: string;
  slot: FurnitureSlot;
  nameEs: string;
  glyph: string;
  cost: number;
  minTier: number;
  color: string;
  collection?: CollectionId;
  /** Se gana con estrellas de minijuegos en vez de monedas. */
  starCost?: number;
  /** Premio exclusivo de un evento semanal (no se vende). */
  eventOnly?: boolean;
}

export const FURNITURE: FurnitureItem[] = [
  { id: 'rug-round', slot: 'floor', nameEs: 'Alfombra Arcoíris', glyph: 'rug', cost: 15, minTier: 0, color: '#FF7AA2' },
  { id: 'plant-pot', slot: 'corner', nameEs: 'Planta Monstera', glyph: 'plant', cost: 12, minTier: 0, color: '#22B567' },
  { id: 'barrel', slot: 'corner', nameEs: 'Barril de Ron… de Mango', glyph: 'barrel', cost: 18, minTier: 0, color: '#B7743A', collection: 'pirate' },
  { id: 'bed-cozy', slot: 'bed', nameEs: 'Cama Nube', glyph: 'bed', cost: 30, minTier: 1, color: '#4FACFE' },
  { id: 'hammock', slot: 'bed', nameEs: 'Hamaca Marinera', glyph: 'hammock', cost: 40, minTier: 1, color: '#FFC94D', collection: 'pirate' },
  { id: 'lamp-star', slot: 'light', nameEs: 'Lámpara Estrella', glyph: 'lamp', cost: 20, minTier: 1, color: '#FFE08A' },
  { id: 'bookshelf', slot: 'corner', nameEs: 'Librero de Idiomas', glyph: 'bookshelf', cost: 35, minTier: 1, color: '#B7743A' },
  { id: 'desk', slot: 'floor', nameEs: 'Escritorio de Estudio', glyph: 'desk', cost: 45, minTier: 2, color: '#B7743A' },
  { id: 'sofa', slot: 'floor', nameEs: 'Sofá Lavanda', glyph: 'sofa', cost: 50, minTier: 2, color: '#7B5CFF' },
  { id: 'poster', slot: 'wall', nameEs: 'Póster de Montaña', glyph: 'poster', cost: 15, minTier: 2, color: '#4FACFE', collection: 'mountain' },
  { id: 'world-map', slot: 'wall', nameEs: 'Mapa del Tesoro', glyph: 'map', cost: 25, minTier: 2, color: '#FFE9C7', collection: 'pirate' },
  { id: 'globe', slot: 'light', nameEs: 'Globo Terráqueo', glyph: 'globe', cost: 30, minTier: 2, color: '#4FACFE' },
  { id: 'aquarium', slot: 'corner', nameEs: 'Acuario Tropical', glyph: 'aquarium', cost: 0, starCost: 6, minTier: 2, color: '#9FE3FF' },
  { id: 'ship-wheel', slot: 'special', nameEs: 'Timón del Capitán', glyph: 'wheel', cost: 60, minTier: 3, color: '#B7743A', collection: 'pirate' },
  { id: 'jolly-flag', slot: 'special', nameEs: 'Bandera de la Tripulación', glyph: 'flag', cost: 0, starCost: 10, minTier: 3, color: '#2B3B5C', collection: 'pirate' },
  { id: 'treasure', slot: 'special', nameEs: 'Cofre del Tesoro', glyph: 'chest', cost: 90, minTier: 3, color: '#FFC94D', collection: 'pirate' },
  { id: 'trophy', slot: 'wall', nameEs: 'Vitrina de Trofeos', glyph: 'trophy', cost: 0, starCost: 14, minTier: 3, color: '#FFC94D' },
  { id: 'event-parrot', slot: 'corner', nameEs: 'Loro Parlanchín', glyph: 'parrot', cost: 0, minTier: 0, color: '#22B567', eventOnly: true, collection: 'pirate' },
  { id: 'event-arcade', slot: 'floor', nameEs: 'Máquina Arcade', glyph: 'arcade', cost: 0, minTier: 1, color: '#7B5CFF', eventOnly: true },
  { id: 'event-lantern', slot: 'light', nameEs: 'Farolillo de Festival', glyph: 'lantern', cost: 0, minTier: 1, color: '#FF4F81', eventOnly: true },
  { id: 'event-suitcase', slot: 'corner', nameEs: 'Maleta del Viajero', glyph: 'suitcase', cost: 0, minTier: 0, color: '#FF8A3D', eventOnly: true },
  { id: 'royal-crown', slot: 'special', nameEs: 'Trono de la Corona', glyph: 'crown', cost: 200, minTier: 4, color: '#FFC94D', collection: 'royal' },
];

export interface HouseState {
  tier: number;
  owned: string[];
  placed: Partial<Record<FurnitureSlot, string>>;
}

export const DEFAULT_HOUSE: HouseState = { tier: 0, owned: [], placed: {} };

export function findFurniture(id?: string): FurnitureItem | undefined {
  return id ? FURNITURE.find((f) => f.id === id) : undefined;
}

/** Nivel n requiere 50·n·(n−1) XP acumulada (100, 300, 600, 1000…). */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, needed: next - base, ratio: (xp - base) / (next - base) };
}

