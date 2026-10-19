/**
 * Evaluación de pronunciación: Azure AI Speech (medición acústica precisa) o
 * Gemini (estimación aproximada escuchando el audio, sin otra clave que la de Google).
 * Tipos compartidos entre backend y app, más consejos en español pensados para
 * hispanohablantes, por fonema.
 *
 * Azure devuelve los fonemas de en-US en el alfabeto SAPI ("th", "ae", "ih"…);
 * otros acentos pueden venir en IPA. `phonemeInfo` acepta ambos.
 */

export type PronunciationErrorType =
  | 'None'
  | 'Mispronunciation'
  | 'Omission'
  | 'Insertion'
  | 'UnexpectedBreak'
  | 'MissingBreak'
  | 'Monotone';

export interface PronunciationPhoneme {
  /** Símbolo tal como lo devuelve Azure (SAPI o IPA). */
  phoneme: string;
  ipa: string;
  accuracy: number;
}

export interface PronunciationWord {
  word: string;
  accuracy: number;
  errorType: PronunciationErrorType | string;
  phonemes: PronunciationPhoneme[];
  offsetMs?: number;
  durationMs?: number;
  /** Consejo directo de la IA (Gemini) cuando no hay detalle por fonema. */
  tipEs?: string;
}

export interface PronunciationReport {
  /** azure = medición acústica; gemini = estimación de una IA que escucha el audio (aproximada). */
  provider: 'azure' | 'gemini';
  approximate?: boolean;
  /** Si una IA (Gemini) revisó además la medición acústica de Azure. */
  reviewedBy?: 'gemini';
  /** true si se comparó contra una frase de referencia (lectura en voz alta). */
  scripted: boolean;
  referenceText?: string;
  recognizedText: string;
  /** Puntaje global de pronunciación (0–100). */
  pronScore: number;
  accuracy: number;
  fluency: number;
  /** Solo con frase de referencia: cuánto de la frase se dijo. */
  completeness: number | null;
  /** Entonación y ritmo (puede faltar según el idioma). */
  prosody: number | null;
  words: PronunciationWord[];
}

interface PhonemeMeta {
  ipa: string;
  example: string;
  tipEs: string;
}

/** SAPI (en-US) → IPA + consejo para hispanohablantes. */
const PHONEMES: Record<string, PhonemeMeta> = {
  th: { ipa: 'θ', example: 'think', tipEs: 'Saca un poco la punta de la lengua entre los dientes y sopla suave. No es "t" ni "s".' },
  dh: { ipa: 'ð', example: 'this', tipEs: 'Lengua entre los dientes, como la "d" suave de "nada", con vibración.' },
  v: { ipa: 'v', example: 'very', tipEs: 'El labio de abajo toca los dientes de arriba y vibra. No la cambies por "b".' },
  b: { ipa: 'b', example: 'boy', tipEs: 'Cierra los labios por completo y suelta con fuerza.' },
  z: { ipa: 'z', example: 'zoo', tipEs: 'Es una "s" que vibra, como el zumbido de una abeja (bzzz).' },
  zh: { ipa: 'ʒ', example: 'vision', tipEs: 'Como la "ll" argentina suave, con vibración.' },
  sh: { ipa: 'ʃ', example: 'she', tipEs: 'Labios hacia afuera, como cuando pides silencio: "shhh".' },
  ch: { ipa: 'tʃ', example: 'chair', tipEs: 'Como la "ch" de "chico", un poco más fuerte.' },
  jh: { ipa: 'dʒ', example: 'job', tipEs: 'Como una "y" fuerte de "yo" enfático; no lo digas como "ch".' },
  ih: { ipa: 'ɪ', example: 'ship', tipEs: '"i" corta y relajada, casi entre "i" y "e". "ship" no suena como "sheep".' },
  iy: { ipa: 'i', example: 'sheep', tipEs: '"i" larga y tensa, sonriendo un poco.' },
  ae: { ipa: 'æ', example: 'cat', tipEs: 'Abre la boca para una "a" pero estirando hacia "e".' },
  ah: { ipa: 'ʌ', example: 'cup', tipEs: '"a" corta y relajada, sin abrir mucho la boca.' },
  aa: { ipa: 'ɑ', example: 'father', tipEs: '"a" abierta y desde atrás de la boca.' },
  ao: { ipa: 'ɔ', example: 'thought', tipEs: '"o" bien abierta, con los labios un poco redondos.' },
  uh: { ipa: 'ʊ', example: 'book', tipEs: '"u" corta y relajada, labios casi sin redondear.' },
  uw: { ipa: 'u', example: 'food', tipEs: '"u" larga, con los labios redondos.' },
  er: { ipa: 'ɝ', example: 'bird', tipEs: 'La "r" inglesa: dobla la lengua hacia atrás sin tocar el paladar y sin vibrar.' },
  r: { ipa: 'ɹ', example: 'red', tipEs: 'La "r" inglesa no vibra: la lengua no toca el paladar.' },
  ax: { ipa: 'ə', example: 'about', tipEs: 'Vocal neutra y muy corta (schwa), con la boca relajada.' },
  eh: { ipa: 'ɛ', example: 'bed', tipEs: '"e" abierta, un poco más que la "e" española.' },
  ey: { ipa: 'eɪ', example: 'day', tipEs: 'Es "ei", no una "e" sola.' },
  ay: { ipa: 'aɪ', example: 'my', tipEs: '"ai" deslizando hacia la "i".' },
  aw: { ipa: 'aʊ', example: 'now', tipEs: '"au" deslizando hacia la "u".' },
  ow: { ipa: 'oʊ', example: 'go', tipEs: 'Es "ou", no una "o" pura.' },
  oy: { ipa: 'ɔɪ', example: 'boy', tipEs: '"oi" con la "o" abierta.' },
  h: { ipa: 'h', example: 'house', tipEs: 'Solo aire, como cuando empañas un vidrio. No es la "j" española.' },
  ng: { ipa: 'ŋ', example: 'sing', tipEs: 'Sonido nasal al fondo; no pronuncies la "g" final.' },
  y: { ipa: 'j', example: 'yes', tipEs: 'Como la "i" de "hielo", suave.' },
  w: { ipa: 'w', example: 'we', tipEs: 'Como "u" rápida antes de la vocal: "u-e".' },
  l: { ipa: 'l', example: 'feel', tipEs: 'Al final de palabra la "l" es más oscura: lengua más atrás.' },
  m: { ipa: 'm', example: 'man', tipEs: 'Labios cerrados.' },
  n: { ipa: 'n', example: 'no', tipEs: 'La punta de la lengua toca detrás de los dientes de arriba.' },
  p: { ipa: 'p', example: 'pen', tipEs: 'Al inicio de palabra sale con un soplo de aire.' },
  t: { ipa: 't', example: 'ten', tipEs: 'Al inicio sale con aire; la lengua va detrás de los dientes, no sobre ellos.' },
  k: { ipa: 'k', example: 'cat', tipEs: 'Al inicio de palabra sale con un soplo de aire.' },
  d: { ipa: 'd', example: 'day', tipEs: 'Más fuerte que la "d" española; en "-ed" final, que se oiga.' },
  g: { ipa: 'g', example: 'go', tipEs: '"g" fuerte, como en "gato".' },
  f: { ipa: 'f', example: 'fun', tipEs: 'Labio de abajo contra los dientes de arriba, sopla.' },
  s: { ipa: 's', example: 'school', tipEs: 'Al inicio no agregues "e": es "school", no "eschool".' },
};

const IPA_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(PHONEMES).map(([key, meta]) => [meta.ipa, key])
);

/** IPA y consejo para un fonema de Azure (SAPI o IPA). */
export function phonemeInfo(symbol: string): { ipa: string; example: string | null; tipEs: string | null } {
  const raw = symbol.trim();
  const key = PHONEMES[raw.toLowerCase()] ? raw.toLowerCase() : IPA_TO_KEY[raw];
  const meta = key ? PHONEMES[key] : undefined;
  return meta ? { ipa: meta.ipa, example: meta.example, tipEs: meta.tipEs } : { ipa: raw, example: null, tipEs: null };
}

export type PronunciationBand = 'good' | 'ok' | 'bad';

export function pronunciationBand(score: number): PronunciationBand {
  if (score >= 80) return 'good';
  if (score >= 60) return 'ok';
  return 'bad';
}

/** El fonema más débil de una palabra (si alguno baja de 75). */
export function weakestPhoneme(word: PronunciationWord): PronunciationPhoneme | null {
  const sorted = [...word.phonemes].sort((a, b) => a.accuracy - b.accuracy);
  const worst = sorted[0];
  return worst && worst.accuracy < 75 ? worst : null;
}

/** Palabras que conviene repetir, de peor a mejor. */
export function weakWords(report: PronunciationReport, max = 5): PronunciationWord[] {
  return report.words
    .filter((w) => w.errorType === 'Omission' || (w.errorType !== 'Insertion' && effectiveWordAccuracy(w) < 70))
    .sort((a, b) => effectiveWordAccuracy(a) - effectiveWordAccuracy(b))
    .slice(0, max);
}

/** Consejos cortos en español para las palabras más débiles. */
export function pronunciationTipsEs(report: PronunciationReport, max = 3): string[] {
  const tips: string[] = [];
  for (const w of weakWords(report, max)) {
    if (w.errorType === 'Omission') {
      tips.push(`Te saltaste "${w.word}": léela completa, sin comerte palabras.`);
      continue;
    }
    const ph = weakestPhoneme(w);
    const info = ph ? phonemeInfo(ph.phoneme) : null;
    tips.push(
      info?.tipEs
        ? `"${w.word}" (${effectiveWordAccuracy(w)}/100): el sonido /${info.ipa}/. ${info.tipEs}`
        : w.tipEs
          ? `"${w.word}" (${effectiveWordAccuracy(w)}/100): ${w.tipEs}`
          : `"${w.word}" (${effectiveWordAccuracy(w)}/100): escúchala en lento y repítela.`
    );
  }
  if (report.prosody !== null && report.prosody < 60)
    tips.push('Tu entonación sonó plana: sube y baja la voz como en una conversación real.');
  return tips;
}

/** Resumen en inglés para que el coach de IA tenga en cuenta la pronunciación. */
export function pronunciationSummaryEn(report: PronunciationReport): string {
  const weak = weakWords(report, 6)
    .map((w) => {
      const ph = weakestPhoneme(w);
      return `${w.word} (${w.errorType === 'Omission' ? 'omitted' : `${w.accuracy}/100`}${ph ? `, weak /${phonemeInfo(ph.phoneme).ipa}/` : ''})`;
    })
    .join('; ');
  return [
    `${report.approximate ? 'Approximate AI estimate' : 'Automatic acoustic assessment'} of the pronunciation: overall ${report.pronScore}/100, accuracy ${report.accuracy}, fluency ${report.fluency}` +
      (report.prosody !== null ? `, prosody ${report.prosody}` : '') +
      (report.completeness !== null ? `, completeness ${report.completeness}` : '') +
      '.',
    weak ? `Weakest words: ${weak}.` : 'No clearly mispronounced words.',
  ].join(' ');
}

/* ------------------------------------------------------------------ */
/* Combinación Azure (acústica, rápida) + Gemini (escucha, detallada)  */
/* ------------------------------------------------------------------ */

const norm = (w: string) => w.toLowerCase().replace(/[^a-z']/g, '');

/**
 * Puntaje efectivo de una palabra: Azure a veces da 80+ a la palabra aunque un sonido
 * clave esté en 0 (p. ej. "weather" con /ð/ = 0). Se baja al promedio de sus sonidos.
 */
export function effectiveWordAccuracy(word: PronunciationWord): number {
  if (!word.phonemes.length || word.errorType === 'Omission') return word.accuracy;
  const avg = word.phonemes.reduce((a, p) => a + p.accuracy, 0) / word.phonemes.length;
  return Math.round(Math.min(word.accuracy, avg));
}

/** Empareja palabras en orden (tolera palabras extra o faltantes en cualquiera de las dos listas). */
function alignWords(a: PronunciationWord[], b: PronunciationWord[]): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  let j = 0;
  for (let i = 0; i < a.length && j < b.length; i++) {
    const target = norm(a[i]!.word);
    for (let k = j; k < Math.min(b.length, j + 4); k++) {
      if (norm(b[k]!.word) === target) {
        pairs.push([i, k]);
        j = k + 1;
        break;
      }
    }
  }
  return pairs;
}

/**
 * Funde la medición de Azure con la revisión de Gemini:
 *  - se conservan fluidez, entonación y completitud de Azure (son acústicas);
 *  - si Gemini oye un error en una palabra (p. ej. "tink" por "think"), la palabra baja a su puntaje,
 *    se marca el sonido y se agrega su consejo en español;
 *  - en habla libre, la transcripción de Gemini (literal, con los errores del estudiante) reemplaza a la de Azure.
 */
export function mergePronunciation(azure: PronunciationReport, review: PronunciationReport): PronunciationReport {
  const words = azure.words.map((w) => ({ ...w, phonemes: w.phonemes.map((p) => ({ ...p })) }));
  let changed = false;
  for (const [i, k] of alignWords(words, review.words)) {
    const g = review.words[k]!;
    const w = words[i]!;
    if (g.tipEs && !w.tipEs) w.tipEs = g.tipEs;
    if (g.errorType !== 'Mispronunciation' || g.accuracy >= effectiveWordAccuracy(w)) continue;
    w.accuracy = g.accuracy;
    changed = true;
    if (w.errorType === 'None') w.errorType = 'Mispronunciation';
    const issue = g.phonemes[0];
    if (issue) {
      const same = w.phonemes.find((p) => p.ipa === issue.ipa);
      if (same) same.accuracy = Math.min(same.accuracy, issue.accuracy);
      else w.phonemes.unshift({ ...issue });
    }
  }
  const scored = words.filter((w) => w.errorType !== 'Insertion');
  const meanWords = scored.length ? scored.reduce((a, w) => a + effectiveWordAccuracy(w), 0) / scored.length : azure.accuracy;
  const accuracy = Math.round(Math.min(azure.accuracy, meanWords));
  // Solo se recalcula el global si la revisión encontró errores que Azure no vio.
  const pronScore =
    changed || accuracy < azure.accuracy
      ? Math.round(Math.min(azure.pronScore, accuracy * 0.5 + azure.fluency * 0.25 + (azure.prosody ?? azure.fluency) * 0.25))
      : azure.pronScore;
  return {
    ...azure,
    reviewedBy: 'gemini',
    recognizedText: azure.scripted ? azure.recognizedText : review.recognizedText || azure.recognizedText,
    accuracy,
    pronScore,
    words,
  };
}
