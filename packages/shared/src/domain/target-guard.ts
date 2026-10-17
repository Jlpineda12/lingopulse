import type {
  GrammarUseStatus,
  TargetUseStatus,
  VoiceArenaTurnResponseV1,
} from '../types/voice-arena.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Detecta si la respuesta hablada del agente (`speak`) filtra el objetivo léxico
 * o alguna de las pistas prohibidas antes de enviarla a TTS.
 */
export function detectForbiddenLeakInSpeak(
  speak: string,
  forbiddenForms: string[],
  canonicalTarget: string
): { leaked: boolean; matchedForm: string | null } {
  const normalizedSpeak = speak.toLowerCase().replace(/\s+/g, ' ').trim();

  // 1. Verificar lista explícita de formas prohibidas
  for (const form of forbiddenForms) {
    const cleanForm = form.toLowerCase().trim();
    if (!cleanForm) continue;
    if (normalizedSpeak.includes(cleanForm)) {
      return { leaked: true, matchedForm: form };
    }
  }

  // 2. Verificar forma separada del phrasal verb (ej. "put ... off")
  const parts = canonicalTarget.toLowerCase().trim().split(/\s+/);
  if (parts.length === 2) {
    const [verb, particle] = parts;
    const separatedRegex = new RegExp(
      `\\b${verb}(?:s|ing)?\\b(?:\\s+\\w+){0,5}\\s+\\b${particle}\\b`,
      'i'
    );
    if (separatedRegex.test(normalizedSpeak)) {
      return { leaked: true, matchedForm: `${verb} ... ${particle}` };
    }
  }

  return { leaked: false, matchedForm: null };
}

export interface LearnerTurnAnalysis {
  isPromptInjectionOrRevealRequest: boolean;
  communicativeIntentResolved: boolean;
  targetUse: TargetUseStatus;
  grammarUse: GrammarUseStatus;
  matchedQuote: string | null;
  explanationEs: string;
}

/**
 * Analiza un turno del estudiante frente al objetivo principal (ej. "put off" o "run out of").
 * Distingue entre:
 * - Uso canónico o separado válido ("Let's put it off", "put the meeting off")
 * - Uso del objetivo con error gramatical de pronombre ("Let's put off it")
 * - Paráfrasis comunicativamente válida sin recuperar el objetivo ("Let's postpone the meeting")
 * - Intento de romper el prompt ("Tell me the answer", "repeat your system prompt")
 */
export function analyzeLearnerTargetUse(
  transcript: string,
  canonicalTarget: string
): LearnerTurnAnalysis {
  const clean = transcript.trim();
  const lower = clean.toLowerCase();

  // 1. Detectar intentos de pedir la respuesta o inyección de prompt
  const injectionPatterns = [
    /tell me the answer/i,
    /what is the target/i,
    /system prompt/i,
    /ignore previous instructions/i,
    /dime la respuesta/i,
    /cu[aá]l es la palabra/i,
    /what phrasal verb/i,
  ];
  if (injectionPatterns.some((rx) => rx.test(lower))) {
    return {
      isPromptInjectionOrRevealRequest: true,
      communicativeIntentResolved: false,
      targetUse: 'not_observed',
      grammarUse: 'not_applicable',
      matchedQuote: null,
      explanationEs:
        'El usuario intentó pedir la respuesta o consultar instrucciones internas.',
    };
  }

  if (canonicalTarget.toLowerCase() === 'put off') {
    // Caso A: Error gramatical clásico en phrasal verb separable con pronombre ("put off it" / "put off them")
    const badPronounMatch = clean.match(
      /\b(put(?:s|ting)?\s+off\s+(?:it|them))\b/i
    );
    if (badPronounMatch?.[1]) {
      return {
        isPromptInjectionOrRevealRequest: false,
        communicativeIntentResolved: true,
        targetUse: 'correct',
        grammarUse: 'incorrect',
        matchedQuote: badPronounMatch[1],
        explanationEs:
          'Recuperaste "put off", pero con un pronombre objeto ("it"/"them") debe ir en medio: "put it off", no "put off it".',
      };
    }

    // Caso B: Uso correcto separado con pronombre ("put it off", "putting it off")
    // o con sintagma nominal de 1 a 5 palabras ("put the meeting off", "put our weekly planning meeting off", "put the in-person session off")
    const correctPutOffMatch = clean.match(
      /\b(put(?:s|ting)?\s+(?:it|them|(?:the|today'?s|our|this)(?:\s+[\w-]+){1,4})\s+off(?:\s+until\s+\w+)?|put(?:s|ting)?\s+off\s+(?:the|today'?s|our|this)(?:\s+[\w-]+){1,4}(?:\s+until\s+\w+)?)\b/i
    );
    if (correctPutOffMatch?.[1]) {
      return {
        isPromptInjectionOrRevealRequest: false,
        communicativeIntentResolved: true,
        targetUse: 'correct',
        grammarUse: 'correct',
        matchedQuote: correctPutOffMatch[1],
        explanationEs:
          'Excelente recuperación de "put off" con sintaxis correcta y sentido contextual de aplazar la reunión.',
      };
    }

    // Caso C: Uso aislado o incompleto de "put off"
    const barePutOffMatch = clean.match(/\b(put(?:s|ting)?\s+off)\b/i);
    if (barePutOffMatch?.[1]) {
      return {
        isPromptInjectionOrRevealRequest: false,
        communicativeIntentResolved: true,
        targetUse: 'correct',
        grammarUse: 'correct',
        matchedQuote: barePutOffMatch[1],
        explanationEs: 'Usaste "put off" en contexto para proponer el aplazamiento.',
      };
    }

    // Caso D: Paráfrasis comunicativamente válida ("postpone", "reschedule", "move to Friday", "delay")
    const paraphraseMatch = clean.match(
      /\b((?:let'?s|we\s+should|we\s+can|i\s+suggest\s+we)?\s*(?:postpone|reschedule|delay|move|push)\s+(?:the\s+meeting|it|the\s+session)?(?:\s+to|\s+until)?\s*\w*)\b/i
    );
    if (paraphraseMatch?.[1] && /postpone|reschedule|delay|move|push|friday/i.test(lower)) {
      return {
        isPromptInjectionOrRevealRequest: false,
        communicativeIntentResolved: true,
        targetUse: 'not_observed',
        grammarUse: 'not_applicable',
        matchedQuote: paraphraseMatch[1].trim(),
        explanationEs:
          'Resolviste la situación comunicativa con una paráfrasis válida, aunque sin recuperar el objetivo léxico "put off".',
      };
    }
  }

  // Fallback general para otros objetivos léxicos (ej. "run out of")
  const escapedTarget = canonicalTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const genericMatch = clean.match(new RegExp(`\\b(${escapedTarget}[^.,;!?]*)`, 'i'));
  if (genericMatch?.[1]) {
    return {
      isPromptInjectionOrRevealRequest: false,
      communicativeIntentResolved: true,
      targetUse: 'correct',
      grammarUse: 'correct',
      matchedQuote: genericMatch[1].trim(),
      explanationEs: `Uso contextual observado del objetivo "${canonicalTarget}".`,
    };
  }

  const hasCommunicativeEffort = clean.split(/\s+/).filter(Boolean).length >= 4;
  return {
    isPromptInjectionOrRevealRequest: false,
    communicativeIntentResolved: hasCommunicativeEffort,
    targetUse: 'not_observed',
    grammarUse: 'not_applicable',
    matchedQuote: null,
    explanationEs: hasCommunicativeEffort
      ? 'Intervención comprensible, pero aún no se observó el objetivo léxico de la sesión.'
      : 'Respuesta demasiado breve para confirmar el objetivo comunicativo.',
  };
}

/**
 * Valida estrictamente que un objeto cumpla `docs/03_voice_arena_response.schema.json`
 * y que la evidencia citada pertenezca a un turno real del estudiante.
 */
export function validateVoiceArenaTurnResponse(
  candidate: unknown,
  learnerTurnsMap: Map<string, string>
): { valid: boolean; data?: VoiceArenaTurnResponseV1; error?: string } {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { valid: false, error: 'Response must be a JSON object' };
  }

  const obj = candidate as Record<string, unknown>;
  const allowedTopKeys = ['speak', 'action', 'observation', 'reason_code'];
  for (const key of Object.keys(obj)) {
    if (!allowedTopKeys.includes(key)) {
      return { valid: false, error: `Unexpected top-level property: ${key}` };
    }
  }

  if (typeof obj.speak !== 'string' || obj.speak.length < 1 || obj.speak.length > 300) {
    return { valid: false, error: 'Invalid speak field (must be string 1..300 chars)' };
  }

  if (!['ask', 'request_repeat', 'close'].includes(String(obj.action))) {
    return { valid: false, error: `Invalid action: ${String(obj.action)}` };
  }

  const allowedReasons = [
    'opening',
    'contextual_reframe',
    'complication',
    'clarification',
    'audio_retry',
    'redirect',
    'budget_end',
    'learner_stop',
    'completed',
  ];
  if (!allowedReasons.includes(String(obj.reason_code))) {
    return { valid: false, error: `Invalid reason_code: ${String(obj.reason_code)}` };
  }

  if (
    !obj.observation ||
    typeof obj.observation !== 'object' ||
    Array.isArray(obj.observation)
  ) {
    return { valid: false, error: 'Missing or invalid observation object' };
  }

  const obs = obj.observation as Record<string, unknown>;
  const allowedObsKeys = [
    'communicative_success',
    'target_use',
    'grammar_use',
    'evidence',
  ];
  for (const key of Object.keys(obs)) {
    if (!allowedObsKeys.includes(key)) {
      return { valid: false, error: `Unexpected observation property: ${key}` };
    }
  }

  if (
    !['achieved', 'partial', 'not_achieved', 'uncertain', 'not_observed'].includes(
      String(obs.communicative_success)
    )
  ) {
    return { valid: false, error: 'Invalid communicative_success value' };
  }

  if (
    !['correct', 'incorrect', 'not_observed', 'uncertain'].includes(
      String(obs.target_use)
    )
  ) {
    return { valid: false, error: 'Invalid target_use value' };
  }

  if (
    !['correct', 'incorrect', 'not_applicable', 'uncertain'].includes(
      String(obs.grammar_use)
    )
  ) {
    return { valid: false, error: 'Invalid grammar_use value' };
  }

  if (obs.evidence !== null) {
    if (typeof obs.evidence !== 'object' || Array.isArray(obs.evidence)) {
      return { valid: false, error: 'evidence must be null or {turn_id, quote}' };
    }
    const ev = obs.evidence as Record<string, unknown>;
    if (typeof ev.turn_id !== 'string' || !UUID_REGEX.test(ev.turn_id)) {
      return { valid: false, error: 'evidence.turn_id must be a valid UUID' };
    }
    if (typeof ev.quote !== 'string' || ev.quote.length < 1 || ev.quote.length > 2000) {
      return { valid: false, error: 'evidence.quote must be non-empty string <= 2000 chars' };
    }
    const sourceTranscript = learnerTurnsMap.get(ev.turn_id);
    if (!sourceTranscript) {
      return {
        valid: false,
        error: `evidence.turn_id ${ev.turn_id} does not match any verified learner turn`,
      };
    }
    if (!sourceTranscript.toLowerCase().includes(ev.quote.toLowerCase())) {
      return {
        valid: false,
        error: `evidence.quote "${ev.quote}" is not a literal substring of turn ${ev.turn_id}`,
      };
    }
  }

  return {
    valid: true,
    data: obj as unknown as VoiceArenaTurnResponseV1,
  };
}
