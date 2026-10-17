import type {
  CoachCorrection,
  CoachFeedback,
  CoachRequest,
  CorrectionType,
  PracticeLevel,
  SpeechAudioMetrics,
  VocabularyUpgrade,
} from './types.js';

/**
 * Motor local de feedback (sin red ni IA). Detecta errores frecuentes de
 * hispanohablantes con reglas explícitas y calcula métricas objetivas.
 * No pretende ser un corrector gramatical completo: cuando el backend tiene
 * Claude configurado, el cliente usa ese feedback y este motor queda de respaldo.
 */

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export function tokenizeWords(text: string): string[] {
  return (text.match(/[A-Za-zÀ-ÿ]+(?:['’][A-Za-z]+)*/g) ?? []).map((w) =>
    w.replace(/’/g, "'")
  );
}

export function countWords(text: string): number {
  return tokenizeWords(text).length;
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => tokenizeWords(s).length > 0);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function matchCase(original: string, replacement: string): string {
  if (!original || !replacement) return replacement;
  const first = original.charAt(0);
  if (first === first.toUpperCase() && first !== first.toLowerCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function previousWord(before: string): string {
  const m = before.match(/([A-Za-z']+)\s*$/);
  return (m?.[1] ?? '').toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Reglas                                                              */
/* ------------------------------------------------------------------ */

interface Rule {
  id: string;
  pattern: RegExp;
  type: CorrectionType;
  explanationEn: string;
  explanationEs: string;
  /** Devuelve la corrección o null para ignorar esa coincidencia. */
  fix: (m: RegExpMatchArray, before: string, after: string) => string | null;
  /** Reglas de forma escrita (mayúsculas, puntuación, ortografía) que no aplican a transcripciones de voz. */
  writtenOnly?: boolean;
}

const AUX_BEFORE_SUBJECT = new Set([
  'do', 'does', 'did', "doesn't", "didn't", "don't", 'can', 'could', 'will', 'would',
  'should', 'might', 'must', 'may', "can't", "won't", "wouldn't", "couldn't", "shouldn't",
  'let', 'lets', 'make', 'makes', 'made', 'help', 'helps', 'helped', 'see', 'saw', 'watch',
  'watched', 'hear', 'heard', 'to', 'had', 'has', 'have',
]);

const THIRD_PERSON: Record<string, string> = {
  like: 'likes', want: 'wants', need: 'needs', go: 'goes', have: 'has', work: 'works',
  live: 'lives', play: 'plays', study: 'studies', watch: 'watches', know: 'knows',
  think: 'thinks', say: 'says', love: 'loves', make: 'makes', take: 'takes', eat: 'eats',
  speak: 'speaks', do: 'does', try: 'tries', feel: 'feels', look: 'looks', seem: 'seems',
};

const BASE_FORM: Record<string, string> = {
  went: 'go', goes: 'go', ate: 'eat', saw: 'see', did: 'do', had: 'have', made: 'make',
  took: 'take', came: 'come', said: 'say', got: 'get', wrote: 'write', bought: 'buy',
  thought: 'think', knew: 'know', gave: 'give', found: 'find', told: 'tell', felt: 'feel',
  left: 'leave', brought: 'bring', began: 'begin', spoke: 'speak', slept: 'sleep',
  worked: 'work', played: 'play', wanted: 'want', liked: 'like', studied: 'study',
  watched: 'watch', called: 'call', finished: 'finish', started: 'start', visited: 'visit',
  travelled: 'travel', traveled: 'travel', decided: 'decide', tried: 'try', stopped: 'stop',
  used: 'use', lived: 'live', walked: 'walk', talked: 'talk', asked: 'ask', helped: 'help',
  cooked: 'cook', cleaned: 'clean', opened: 'open', moved: 'move', loved: 'love',
  enjoyed: 'enjoy', arrived: 'arrive', learned: 'learn', learnt: 'learn',
};

const GERUND: Record<string, string> = {
  see: 'seeing', meet: 'meeting', hear: 'hearing', work: 'working', visit: 'visiting',
  talk: 'talking', have: 'having', go: 'going', receive: 'receiving', start: 'starting',
  speak: 'speaking', learn: 'learning', get: 'getting', travel: 'travelling', do: 'doing',
};

const SUBJECT_BE: Record<string, string> = {
  i: 'am', you: 'are', we: 'are', they: 'are', he: 'is', she: 'is', it: 'is',
};

const SPELLING: Record<string, string> = {
  alot: 'a lot', becouse: 'because', becuase: 'because', beacuse: 'because', bacause: 'because',
  definately: 'definitely', definitly: 'definitely', recieve: 'receive', untill: 'until',
  wich: 'which', tommorow: 'tomorrow', tomorow: 'tomorrow', tommorrow: 'tomorrow',
  goverment: 'government', enviroment: 'environment', realy: 'really', beggining: 'beginning',
  begining: 'beginning', occured: 'occurred', seperate: 'separate', wierd: 'weird',
  freind: 'friend', beleive: 'believe', acomodate: 'accommodate', neccesary: 'necessary',
  necesary: 'necessary', neccessary: 'necessary', existance: 'existence', comunity: 'community',
  oportunity: 'opportunity', profesional: 'professional', adress: 'address', exemple: 'example',
  familly: 'family', responsability: 'responsibility', posible: 'possible',
  diferent: 'different', inglish: 'English', lenguage: 'language', languaje: 'language',
  thats: "that's", dont: "don't", doesnt: "doesn't", didnt: "didn't", isnt: "isn't",
  arent: "aren't", wasnt: "wasn't", cant: "can't", wont: "won't", couldnt: "couldn't",
  shouldnt: "shouldn't", wouldnt: "wouldn't", im: "I'm", ive: "I've", whats: "what's",
  becomed: 'became', teached: 'taught', buyed: 'bought', thinked: 'thought', goed: 'went',
  writed: 'wrote', speaked: 'spoke', catched: 'caught', choosed: 'chose', feeled: 'felt',
  knowed: 'knew', runned: 'ran', swimmed: 'swam', drinked: 'drank', eated: 'ate',
  hapened: 'happened', happend: 'happened', finaly: 'finally', basicly: 'basically',
  intresting: 'interesting', interesant: 'interesting', importat: 'important',
  confortable: 'comfortable', developement: 'development', succesful: 'successful',
  sucessful: 'successful', successfull: 'successful', grammer: 'grammar',
  pronounciation: 'pronunciation', knowlege: 'knowledge',
};

const PROPER_CAPS = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'april', 'june', 'july', 'august', 'september', 'october',
  'november', 'december', 'english', 'spanish', 'french', 'german', 'italian',
  'portuguese', 'chinese', 'japanese', 'american', 'british', 'mexican', 'colombian',
  'argentinian', 'peruvian', 'chilean', 'venezuelan', 'european', 'latin',
];

const UNCOUNTABLE: Record<string, string> = {
  informations: 'information', advices: 'advice', furnitures: 'furniture',
  homeworks: 'homework', luggages: 'luggage', equipments: 'equipment',
  knowledges: 'knowledge', feedbacks: 'feedback', softwares: 'software',
  peoples: 'people', moneys: 'money', researches: 'research',
};

const RULES: Rule[] = [
  {
    id: 'am-agree',
    pattern: /\b(I|we|they|you)(\s+am|\s+are|'m|'re)\s+agree\b/gi,
    type: 'grammar',
    explanationEn: '"Agree" is a verb, not an adjective, so we don\'t use "be" with it.',
    explanationEs: '"Agree" ya es verbo: se dice "I agree", no "I am agree".',
    fix: (m) => `${m[1]} agree`,
  },
  {
    id: 'have-years',
    pattern: /\b(I|you|we|they|he|she)\s+(have|has)\s+(\d{1,3}|[a-z]+ty(?:-[a-z]+)?)\s+years(?:\s+old)?\b(?!\s+(?:of|in|at|working|experience|ago))/gi,
    type: 'grammar',
    explanationEn: 'To talk about age in English we use "be": "I am 25 (years old)".',
    explanationEs: 'La edad se dice con "be": "I am 25 years old", no "I have 25 years".',
    fix: (m) => {
      const subj = m[1]!;
      const be = SUBJECT_BE[subj.toLowerCase()] ?? 'is';
      return `${subj} ${be} ${m[3]} years old`;
    },
  },
  {
    id: 'be-hungry',
    pattern: /\b(I|you|we|they|he|she)\s+(have|has)\s+(hungry|thirsty|cold|sleepy|afraid|scared|reason|fear)\b/gi,
    type: 'grammar',
    explanationEn: 'Feelings like hunger, thirst or cold use "be": "I am hungry", "you are right".',
    explanationEs: '"Tengo hambre/frío/sueño" se dice con "be": "I am hungry/cold/sleepy".',
    fix: (m) => {
      const word = m[3]!.toLowerCase();
      if (word === 'reason') return null;
      if (word === 'fear') return null;
      const be = SUBJECT_BE[m[1]!.toLowerCase()] ?? 'is';
      return `${m[1]} ${be} ${m[3]}`;
    },
  },
  {
    id: 'people-is',
    pattern: /\bpeople\s+(is|was|has)\b/gi,
    type: 'grammar',
    explanationEn: '"People" is plural, so the verb must be plural: "people are / were / have".',
    explanationEs: '"People" es plural: "people are", no "people is".',
    fix: (m) => {
      const v = m[1]!.toLowerCase();
      const map: Record<string, string> = { is: 'are', was: 'were', has: 'have' };
      return `people ${map[v]}`;
    },
  },
  {
    id: 'everybody-are',
    pattern: /\b(everybody|everyone|nobody|somebody|someone|anyone|anybody)\s+(are|were|have)\b/gi,
    type: 'grammar',
    explanationEn: 'Words like "everybody" and "someone" take a singular verb: "everyone is".',
    explanationEs: '"Everybody/someone" van con verbo en singular: "everyone is".',
    fix: (m) => {
      const map: Record<string, string> = { are: 'is', were: 'was', have: 'has' };
      return `${m[1]} ${map[m[2]!.toLowerCase()]}`;
    },
  },
  {
    id: 'he-dont',
    pattern: /\b(he|she|it)\s+don't\b/gi,
    type: 'grammar',
    explanationEn: 'With he/she/it, the negative is "doesn\'t".',
    explanationEs: 'Con he/she/it se usa "doesn\'t", no "don\'t".',
    fix: (m) => `${m[1]} doesn't`,
  },
  {
    id: 'he-have',
    pattern: /\b(he|she|it)\s+(like|want|need|go|have|work|live|play|study|watch|know|think|say|love|make|take|eat|speak|do|try|feel|look|seem)\b/gi,
    type: 'grammar',
    explanationEn: 'In the present simple, add -s/-es to the verb after he, she or it.',
    explanationEs: 'Presente simple con he/she/it: el verbo lleva -s ("she works", "he has").',
    fix: (m, before) => {
      if (AUX_BEFORE_SUBJECT.has(previousWord(before))) return null;
      const verb = m[2]!.toLowerCase();
      return `${m[1]} ${THIRD_PERSON[verb] ?? verb}`;
    },
  },
  {
    id: 'aux-past',
    pattern: /\b(didn't|did not|doesn't|does not|don't|do not)\s+([a-z]+)\b/gi,
    type: 'grammar',
    explanationEn: 'After do/does/did (and their negatives), use the base form of the verb.',
    explanationEs: 'Después de did/didn\'t/doesn\'t el verbo va en forma base: "I didn\'t go".',
    fix: (m) => {
      const verb = m[2]!.toLowerCase();
      if (verb === 'need' || verb === 'used') return null;
      const base = BASE_FORM[verb];
      return base ? `${m[1]} ${base}` : null;
    },
  },
  {
    id: 'modal-to',
    pattern: /\b(can|could|will|should|must|would|might)\s+to\s+([a-z]+)\b/gi,
    type: 'grammar',
    explanationEn: 'Modal verbs (can, must, should…) are followed by the base verb without "to".',
    explanationEs: 'Los modales no llevan "to": "I can swim", no "I can to swim".',
    fix: (m) => `${m[1]} ${m[2]}`,
  },
  {
    id: 'more-better',
    pattern: /\bmore\s+(better|worse|easier|bigger|faster|cheaper|happier|older|younger|smaller|larger|higher|lower|longer|shorter|stronger)\b/gi,
    type: 'grammar',
    explanationEn: 'Don\'t use "more" with comparatives that already end in -er.',
    explanationEs: 'No combines "more" con comparativos en -er: "better", no "more better".',
    fix: (m) => m[1]!,
  },
  {
    id: 'there-is-many',
    pattern: /\bthere\s+(is|was)\s+(many|several|lots of|a lot of|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
    type: 'grammar',
    explanationEn: 'Use "there are / there were" with plural nouns.',
    explanationEs: 'Con plurales se usa "there are / there were".',
    fix: (m) => `there ${m[1]!.toLowerCase() === 'is' ? 'are' : 'were'} ${m[2]}`,
  },
  {
    id: 'missing-it',
    pattern: /(^|[.!?]\s+)(Is|Was)\s+(important|necessary|possible|impossible|difficult|easy|hard|raining|sunny|hot|cold|good|bad|late|early|true|normal|interesting|incredible)\b/g,
    type: 'grammar',
    explanationEn: 'English sentences need a subject. Use "it" as a dummy subject: "It is important to…".',
    explanationEs: 'En inglés el sujeto es obligatorio: "It is important…", no "Is important…".',
    fix: (m, _before, after) => {
      // En preguntas el orden es "Is it possible…?"; en afirmaciones "It is possible…".
      const isQuestion = /^[^.!]*\?/.test(after);
      return isQuestion
        ? `${m[1]}${m[2]} it ${m[3]}`
        : `${m[1]}It ${m[2]!.toLowerCase()} ${m[3]}`;
    },
  },
  {
    id: 'depend-of',
    pattern: /\b(depend|depends|depended|depending)\s+of\b/gi,
    type: 'grammar',
    explanationEn: 'The preposition after "depend" is "on".',
    explanationEs: '"Depender de" = "depend on", no "depend of".',
    fix: (m) => `${m[1]} on`,
  },
  {
    id: 'its-depends',
    pattern: /\bit's\s+depends\b/gi,
    type: 'grammar',
    explanationEn: '"Depends" is already the verb: "It depends".',
    explanationEs: 'Se dice "It depends", sin "is".',
    fix: () => 'it depends',
  },
  {
    id: 'explain-me',
    pattern: /\b(explain|explains|explained|explaining)\s+(me|him|her|us|them)\b/gi,
    type: 'grammar',
    explanationEn: '"Explain" needs "to" before the person: "explain to me".',
    explanationEs: '"Explícame" = "explain to me", no "explain me".',
    fix: (m) => `${m[1]} to ${m[2]}`,
  },
  {
    id: 'say-me',
    pattern: /\b(say|says|said)\s+(me|him|her|us|them)\b/gi,
    type: 'vocabulary',
    explanationEn: 'Use "tell" when you mention the listener: "tell me", "told him".',
    explanationEs: 'Con la persona se usa "tell": "tell me", no "say me".',
    fix: (m) => {
      const map: Record<string, string> = { say: 'tell', says: 'tells', said: 'told' };
      return `${map[m[1]!.toLowerCase()]} ${m[2]}`;
    },
  },
  {
    id: 'discuss-about',
    pattern: /\b(discuss|discusses|discussed|discussing)\s+about\b/gi,
    type: 'grammar',
    explanationEn: '"Discuss" takes a direct object: "discuss the plan" (no "about").',
    explanationEs: '"Discuss" no lleva "about": "discuss the plan".',
    fix: (m) => m[1]!,
  },
  {
    id: 'listen-music',
    pattern: /\b(listen|listens|listened|listening)\s+(music|the radio|podcasts?|me|him|her|them|us|this|that)\b/gi,
    type: 'grammar',
    explanationEn: '"Listen" needs "to" before the object: "listen to music".',
    explanationEs: '"Escuchar algo" = "listen to something".',
    fix: (m) => `${m[1]} to ${m[2]}`,
  },
  {
    id: 'wait-for',
    pattern: /\b(wait|waits|waiting|waited)\s+(the|my|your|his|her|our|their|a|an|this|that)\b/gi,
    type: 'grammar',
    explanationEn: 'We "wait for" something or someone.',
    explanationEs: '"Esperar algo" = "wait for something".',
    fix: (m) => `${m[1]} for ${m[2]}`,
  },
  {
    id: 'married-with',
    pattern: /\bmarried\s+with\b/gi,
    type: 'grammar',
    explanationEn: 'We say "married to" someone.',
    explanationEs: '"Casado con" = "married to".',
    fix: () => 'married to',
  },
  {
    id: 'arrive-to',
    pattern: /\b(arrive|arrives|arrived|arriving)\s+to\b/gi,
    type: 'grammar',
    explanationEn: 'Use "arrive at" (a building, airport) or "arrive in" (a city, country).',
    explanationEs: '"Llegar a" = "arrive at" (lugar concreto) o "arrive in" (ciudad/país).',
    fix: (m) => `${m[1]} at`,
  },
  {
    id: 'assist-to',
    pattern: /\b(assist|assists|assisted|assisting)\s+to\b/gi,
    type: 'vocabulary',
    explanationEn: '"Assist" means "help". To go to an event, use "attend" (no preposition).',
    explanationEs: 'Falso amigo: "asistir a" = "attend" (sin preposición).',
    fix: (m) => {
      const map: Record<string, string> = {
        assist: 'attend', assists: 'attends', assisted: 'attended', assisting: 'attending',
      };
      return map[m[1]!.toLowerCase()] ?? 'attend';
    },
  },
  {
    id: 'make-question',
    pattern: /\b(make|makes|made|making)\s+(a\s+|some\s+|many\s+|any\s+)?(questions?)\b/gi,
    type: 'vocabulary',
    explanationEn: 'In English we "ask" a question, not "make" a question.',
    explanationEs: '"Hacer una pregunta" = "ask a question".',
    fix: (m) => {
      const map: Record<string, string> = { make: 'ask', makes: 'asks', made: 'asked', making: 'asking' };
      return `${map[m[1]!.toLowerCase()]} ${m[2] ?? ''}${m[3]}`;
    },
  },
  {
    id: 'make-homework',
    pattern: /\b(make|makes|made|making)\s+(my|your|his|her|our|their|the)?\s*(homework|exercise|sport|sports)\b/gi,
    type: 'vocabulary',
    explanationEn: 'We "do" homework, exercise and sport.',
    explanationEs: '"Hacer la tarea / ejercicio / deporte" = "do homework / exercise / sport".',
    fix: (m) => {
      const map: Record<string, string> = { make: 'do', makes: 'does', made: 'did', making: 'doing' };
      const det = m[2] ? `${m[2]} ` : '';
      return `${map[m[1]!.toLowerCase()]} ${det}${m[3]}`;
    },
  },
  {
    id: 'since-years',
    pattern: /\bsince\s+(\d+|two|three|four|five|six|seven|eight|nine|ten|many|several|a few)\s+(years|months|weeks|days|hours|minutes)\b/gi,
    type: 'grammar',
    explanationEn: 'Use "for" with a period of time (for 3 years) and "since" with a starting point (since 2020).',
    explanationEs: '"Desde hace 3 años" = "for 3 years" (mejor aún con presente perfecto: "I have lived here for 3 years"). "Since" va con un punto de inicio: "since 2020".',
    fix: (m) => `for ${m[1]} ${m[2]}`,
  },
  {
    id: 'go-to-home',
    pattern: /\b(go|goes|went|going|come|comes|came|coming|get|got|arrive|arrived)\s+to\s+home\b/gi,
    type: 'grammar',
    explanationEn: '"Home" works like an adverb here: "go home", "get home" (no "to").',
    explanationEs: '"Ir a casa" = "go home", sin "to".',
    fix: (m) => `${m[1]} home`,
  },
  {
    id: 'in-internet',
    pattern: /\bin\s+(the\s+)?internet\b/gi,
    type: 'grammar',
    explanationEn: 'We say "on the internet".',
    explanationEs: '"En internet" = "on the internet".',
    fix: () => 'on the internet',
  },
  {
    id: 'in-day',
    pattern: /\bin\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/gi,
    type: 'grammar',
    explanationEn: 'Use "on" with days: "on Monday".',
    explanationEs: 'Con días de la semana se usa "on": "on Monday".',
    fix: (m) => `on ${m[1]!.charAt(0).toUpperCase()}${m[1]!.slice(1).toLowerCase()}`,
  },
  {
    id: 'on-year',
    pattern: /\bon\s+((?:19|20)\d\d)\b/gi,
    type: 'grammar',
    explanationEn: 'Use "in" with years: "in 2020".',
    explanationEs: 'Con años se usa "in": "in 2020".',
    fix: (m) => `in ${m[1]}`,
  },
  {
    id: 'same-than',
    pattern: /\bthe\s+same\s+(than|that)\b/gi,
    type: 'grammar',
    explanationEn: 'The correct form is "the same as".',
    explanationEs: '"Igual que" = "the same as".',
    fix: () => 'the same as',
  },
  {
    id: 'different-of',
    pattern: /\bdifferent\s+(of|that)\b/gi,
    type: 'grammar',
    explanationEn: 'Use "different from" (or "different to" in British English).',
    explanationEs: '"Diferente de" = "different from".',
    fix: () => 'different from',
  },
  {
    id: 'for-verb',
    pattern: /\bfor\s+(learn|study|improve|get|buy|make|see|meet|find|visit|speak|pass|go|become)\b/gi,
    type: 'grammar',
    explanationEn: 'To express purpose before a verb, use "to": "I study to improve".',
    explanationEs: '"Para + verbo" = "to + verbo": "to learn", no "for learn".',
    fix: (m) => `to ${m[1]}`,
  },
  {
    id: 'look-forward-gerund',
    pattern: /\b(look|looks|looking|looked)\s+forward\s+to\s+(see|meet|hear|work|visit|talk|have|go|receive|start|speak|learn|get|travel|do)\b/gi,
    type: 'grammar',
    explanationEn: 'In "look forward to", "to" is a preposition, so use verb + -ing.',
    explanationEs: '"Look forward to" va seguido de -ing: "looking forward to seeing you".',
    fix: (m) => `${m[1]} forward to ${GERUND[m[2]!.toLowerCase()]}`,
  },
  {
    id: 'suggest-to',
    pattern: /\b(suggest|suggested|recommend|recommended)\s+to\s+(see|meet|go|visit|talk|have|start|speak|learn|get|travel|do)\b/gi,
    type: 'grammar',
    explanationEn: 'After "suggest" and "recommend", use verb + -ing (or "that + subject + verb").',
    explanationEs: 'Después de "suggest/recommend" usa -ing: "I suggest going".',
    fix: (m) => `${m[1]} ${GERUND[m[2]!.toLowerCase()]}`,
  },
  {
    id: 'most-of-people',
    pattern: /\bmost\s+of\s+(people|students|children|kids|teachers|companies|countries)\b/gi,
    type: 'grammar',
    explanationEn: 'Say "most people" or "most of the people" (with "the").',
    explanationEs: '"La mayoría de la gente" = "most people" (o "most of the people").',
    fix: (m) => `most ${m[1]}`,
  },
  {
    id: 'very-like',
    pattern: /\b(I|you|we|they)\s+very\s+(like|love|enjoy)\b/gi,
    type: 'grammar',
    explanationEn: '"Very" cannot modify verbs. Use "really like" or "like … very much".',
    explanationEs: '"Very" no va con verbos: "I really like", no "I very like".',
    fix: (m) => `${m[1]} really ${m[2]}`,
  },
  {
    id: 'how-is-called',
    pattern: /\bhow\s+(is|are)\s+(it|this|that|they)?\s*called\b/gi,
    type: 'grammar',
    explanationEn: 'Ask about names with "what": "What is it called?"',
    explanationEs: '"¿Cómo se llama?" (una cosa) = "What is it called?"',
    fix: (m) => `what ${m[1]} ${m[2] ?? 'it'} called`,
  },
  {
    id: 'bored-boring',
    pattern: /\b(I'm|I am|we're|we are|they're|they are)\s+(boring|interesting|tiring|confusing|exciting)\b/gi,
    type: 'vocabulary',
    explanationEn: '-ing adjectives describe the thing; -ed adjectives describe how you feel: "I\'m bored".',
    explanationEs: '"Estoy aburrido" = "I\'m bored". "I\'m boring" = "soy aburrido".',
    fix: (m) => {
      const map: Record<string, string> = {
        boring: 'bored', interesting: 'interested', tiring: 'tired', confusing: 'confused',
        exciting: 'excited',
      };
      return `${m[1]} ${map[m[2]!.toLowerCase()]}`;
    },
  },
  {
    id: 'a-an-vowel',
    pattern: /\b(a)\s+([aeio][a-z]+)\b/g,
    type: 'grammar',
    explanationEn: 'Use "an" before words that start with a vowel sound: "an apple".',
    explanationEs: 'Antes de sonido vocal se usa "an": "an idea".',
    fix: (m) => {
      const w = m[2]!.toLowerCase();
      if (/^(one|once|eu|uni|use|usu|ewe)/.test(w)) return null;
      return `an ${m[2]}`;
    },
  },
  {
    id: 'an-consonant',
    pattern: /\b(an)\s+([bcdfgjklmnpqrstvwxyz][a-z]+)\b/g,
    type: 'grammar',
    explanationEn: 'Use "a" before consonant sounds: "a book".',
    explanationEs: 'Antes de sonido consonante se usa "a": "a book".',
    fix: (m) => `a ${m[2]}`,
  },
  {
    id: 'uncountable',
    pattern: new RegExp(`\\b(${Object.keys(UNCOUNTABLE).join('|')})\\b`, 'gi'),
    type: 'grammar',
    explanationEn: 'This noun is uncountable in English, so it has no plural form.',
    explanationEs: 'Este sustantivo es incontable en inglés: no lleva -s.',
    fix: (m, before) => {
      const w = m[1]!.toLowerCase();
      // "he researches" es verbo correcto
      if (w === 'researches' && /\b(he|she|it)\s*$/i.test(before)) return null;
      return matchCase(m[1]!, UNCOUNTABLE[w]!);
    },
  },
  {
    id: 'spelling',
    pattern: new RegExp(`\\b(${Object.keys(SPELLING).join('|')})\\b`, 'gi'),
    type: 'spelling',
    explanationEn: 'Spelling mistake.',
    explanationEs: 'Error de ortografía.',
    writtenOnly: true,
    fix: (m) => {
      const w = m[1]!.toLowerCase();
      const fixed = SPELLING[w]!;
      return w === 'im' || fixed === 'English' ? fixed : matchCase(m[1]!, fixed);
    },
  },
  {
    id: 'proper-caps',
    pattern: new RegExp(`\\b(${PROPER_CAPS.join('|')})\\b`, 'g'),
    type: 'spelling',
    explanationEn: 'Days, months, languages and nationalities start with a capital letter in English.',
    explanationEs: 'En inglés, días, meses, idiomas y nacionalidades van con mayúscula.',
    writtenOnly: true,
    fix: (m) => m[1]!.charAt(0).toUpperCase() + m[1]!.slice(1),
  },
  {
    id: 'pronoun-i',
    pattern: /\bi(?=('m|'ve|'ll|'d)?\b)(?!\.e\.)('m|'ve|'ll|'d)?/g,
    type: 'spelling',
    explanationEn: 'The pronoun "I" is always a capital letter.',
    explanationEs: 'El pronombre "I" siempre va en mayúscula.',
    writtenOnly: true,
    fix: (m, before) => {
      // Evita letras sueltas dentro de palabras o listas tipo "a) i)"
      if (/[A-Za-z]$/.test(before)) return null;
      return `I${m[1] ?? ''}`;
    },
  },
  {
    id: 'space-before-punct',
    pattern: /\s+([,.!?;:])/g,
    type: 'punctuation',
    explanationEn: 'No space before punctuation marks.',
    explanationEs: 'No se deja espacio antes de los signos de puntuación.',
    writtenOnly: true,
    fix: (m) => m[1]!,
  },
  {
    id: 'spanish-question',
    pattern: /[¿¡]/g,
    type: 'punctuation',
    explanationEn: 'English only uses question/exclamation marks at the end of the sentence.',
    explanationEs: 'En inglés no se usan "¿" ni "¡" de apertura.',
    writtenOnly: true,
    fix: () => '',
  },
];

function applyRule(text: string, rule: Rule, sink: CoachCorrection[]): string {
  let out = '';
  let last = 0;
  for (const m of text.matchAll(rule.pattern)) {
    const idx = m.index ?? 0;
    const before = text.slice(0, idx);
    const replacement = rule.fix(m, before, text.slice(idx + m[0].length));
    if (replacement === null || replacement === m[0]) continue;
    const fixed = rule.id === 'missing-it' || rule.id === 'pronoun-i' || rule.id === 'proper-caps'
      ? replacement
      : matchCase(m[0], replacement);
    out += text.slice(last, idx) + fixed;
    last = idx + m[0].length;
    sink.push({
      original: m[0].replace(/^[.!?\s]+/, '').trim(),
      corrected: fixed.replace(/^[.!?\s]+/, '').trim(),
      type: rule.type,
      explanationEn: rule.explanationEn,
      explanationEs: rule.explanationEs,
    });
  }
  return out + text.slice(last);
}

function capitalizeSentences(text: string, sink: CoachCorrection[]): string {
  return text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (full: string, pre: string, ch: string, offset: number) => {
    const before = text.slice(0, offset + pre.length);
    if (/\b(a\.m|p\.m|e\.g|i\.e|etc|vs|mr|mrs|ms|dr)\.\s+$/i.test(before)) return full;
    sink.push({
      original: ch,
      corrected: ch.toUpperCase(),
      type: 'punctuation',
      explanationEn: 'Start every sentence with a capital letter.',
      explanationEs: 'Cada oración empieza con mayúscula.',
    });
    return `${pre}${ch.toUpperCase()}`;
  });
}

export interface GrammarCheckResult {
  correctedText: string;
  corrections: CoachCorrection[];
}

export function checkGrammar(
  text: string,
  options: { spoken?: boolean } = {}
): GrammarCheckResult {
  const raw: CoachCorrection[] = [];
  let working = text.replace(/[ \t]{2,}/g, ' ');
  for (const rule of RULES) {
    if (options.spoken && rule.writtenOnly) continue;
    working = applyRule(working, rule, raw);
  }
  if (!options.spoken) {
    working = capitalizeSentences(working, raw);
    const trimmed = working.trimEnd();
    if (trimmed && !/[.!?…"')\]]$/.test(trimmed)) {
      working = `${trimmed}.`;
      raw.push({
        original: trimmed.split(/\s+/).slice(-1)[0] ?? '',
        corrected: `${trimmed.split(/\s+/).slice(-1)[0] ?? ''}.`,
        type: 'punctuation',
        explanationEn: 'End your text with a full stop (or ? / !).',
        explanationEs: 'Termina el texto con punto (o ? / !).',
      });
    }
  }

  // Agrupa correcciones idénticas para no repetir la misma tarjeta.
  const seen = new Map<string, CoachCorrection>();
  for (const c of raw) {
    const key = `${c.original.toLowerCase()}→${c.corrected.toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, c);
  }
  return { correctedText: working, corrections: [...seen.values()] };
}

/* ------------------------------------------------------------------ */
/* Vocabulario y coherencia                                            */
/* ------------------------------------------------------------------ */

const INTENSIFIER_UPGRADES: Record<string, string> = {
  good: 'excellent / great',
  bad: 'terrible / awful',
  big: 'huge / enormous',
  small: 'tiny',
  tired: 'exhausted',
  happy: 'delighted / thrilled',
  sad: 'devastated / heartbroken',
  important: 'crucial / essential',
  difficult: 'challenging / tough',
  interesting: 'fascinating',
  hungry: 'starving',
  angry: 'furious',
  cold: 'freezing',
  hot: 'boiling',
  scared: 'terrified',
  beautiful: 'stunning / gorgeous',
  easy: 'effortless / straightforward',
  busy: 'swamped / snowed under',
  funny: 'hilarious',
  surprised: 'astonished',
  clean: 'spotless',
  expensive: 'overpriced / pricey',
};

const GENERIC_UPGRADES: Array<{ word: RegExp; label: string; better: string; why: string; min: number }> = [
  {
    word: /\bnice\b/gi, label: 'nice', better: 'pleasant / lovely / friendly / kind',
    why: '"Nice" is very general. Choose a word that says exactly how it is.', min: 2,
  },
  {
    word: /\bthings?\b/gi, label: 'thing', better: 'a more specific noun (issue, idea, detail, item…)',
    why: '"Thing" is vague; precise nouns make you sound more fluent.', min: 2,
  },
  {
    word: /\b(get|gets|got|getting)\b/gi, label: 'get', better: 'receive / obtain / become / buy',
    why: '"Get" is fine in speech, but repeating it sounds basic in writing.', min: 3,
  },
  {
    word: /\bgood\b/gi, label: 'good', better: 'great / helpful / valuable / solid',
    why: 'Repeating "good" makes your text sound repetitive.', min: 3,
  },
  {
    word: /\ba lot of\b/gi, label: 'a lot of', better: 'plenty of / many / numerous / a great deal of',
    why: 'Vary quantifiers; "numerous" or "a great deal of" sound more formal.', min: 2,
  },
];

const CONNECTORS = {
  basic: ['and', 'but', 'so', 'because', 'then', 'also', 'or'],
  intermediate: [
    'however', 'although', 'though', 'while', 'instead', 'for example', 'for instance',
    'on the other hand', 'in addition', 'as a result', 'eventually', 'in the end',
    'first of all', 'finally', 'after that', 'besides', 'unless', 'even though', 'actually',
    'in my opinion', 'to be honest',
  ],
  advanced: [
    'nevertheless', 'moreover', 'furthermore', 'consequently', 'therefore', 'nonetheless',
    'whereas', 'despite', 'in spite of', 'not only', 'as long as', 'provided that',
    'on top of that', 'all things considered', 'to sum up', 'in conclusion', 'ultimately',
    'it could be argued',
  ],
};

const FILLERS = [
  'um', 'uh', 'er', 'erm', 'ehm', 'emm', 'mm', 'hmm', 'ah', 'eh', 'you know', 'i mean',
  'kind of', 'sort of', 'basically', 'este', 'o sea', 'pues', 'bueno',
];

function countPhrase(text: string, phrase: string): number {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return (text.match(new RegExp(`\\b${escaped}\\b`, 'gi')) ?? []).length;
}

export function countFillers(text: string): { total: number; detail: Record<string, number> } {
  const detail: Record<string, number> = {};
  let total = 0;
  for (const f of FILLERS) {
    const n = countPhrase(text, f);
    if (n > 0) {
      detail[f] = n;
      total += n;
    }
  }
  return { total, detail };
}

export function findConnectors(text: string) {
  const found = { basic: [] as string[], intermediate: [] as string[], advanced: [] as string[] };
  (Object.keys(CONNECTORS) as Array<keyof typeof CONNECTORS>).forEach((tier) => {
    for (const c of CONNECTORS[tier]) {
      if (countPhrase(text, c) > 0) found[tier].push(c);
    }
  });
  return found;
}

export function findVocabularyUpgrades(text: string): VocabularyUpgrade[] {
  const upgrades: VocabularyUpgrade[] = [];
  for (const m of text.matchAll(/\b(very|really|so)\s+([a-z]+)\b/gi)) {
    const adj = m[2]!.toLowerCase();
    const better = INTENSIFIER_UPGRADES[adj];
    if (better && !upgrades.some((u) => u.original.toLowerCase() === m[0].toLowerCase())) {
      upgrades.push({
        original: m[0],
        better,
        why: `Instead of "${m[1]!.toLowerCase()} + ${adj}", use one strong adjective.`,
      });
    }
  }
  for (const g of GENERIC_UPGRADES) {
    const n = (text.match(g.word) ?? []).length;
    if (n >= g.min) {
      upgrades.push({ original: `${g.label} (×${n})`, better: g.better, why: g.why });
    }
  }
  return upgrades.slice(0, 6);
}

export function findTargetWordsUsed(text: string, targets: string[]): string[] {
  const lower = text.toLowerCase();
  return targets.filter((t) => {
    const core = t.toLowerCase().replace(/\s*\(.*?\)\s*/g, ' ').trim();
    // Acepta formas flexionadas simples del primer término (figure → figured / figuring)
    const parts = core.split(/\s+/);
    const first = parts[0]!;
    const stem = first.length > 4 && first.endsWith('e') ? first.slice(0, -1) : first;
    const rest = parts.slice(1).join('\\s+(?:\\w+\\s+)?');
    const pattern = new RegExp(
      `\\b${stem}\\w{0,4}${rest ? `\\s+(?:\\w+\\s+)?${rest}` : ''}\\b`,
      'i'
    );
    return pattern.test(lower);
  });
}

/* ------------------------------------------------------------------ */
/* Alineación palabra a palabra (dictado / lectura en voz alta)         */
/* ------------------------------------------------------------------ */

const SMALL_NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function numberToWords(n: number): string[] {
  if (n < 20) return [SMALL_NUMBERS[n]!];
  if (n < 100) {
    const t = TENS[Math.floor(n / 10)]!;
    return n % 10 ? [t, SMALL_NUMBERS[n % 10]!] : [t];
  }
  if (n < 1000) {
    const rest = n % 100;
    return [SMALL_NUMBERS[Math.floor(n / 100)]!, 'hundred', ...(rest ? numberToWords(rest) : [])];
  }
  return String(n).split('').map((d) => SMALL_NUMBERS[Number(d)]!);
}

export function normalizeForComparison(text: string): string[] {
  const out: string[] = [];
  const cleaned = text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/(\d+)[:.](\d+)/g, '$1 $2')
    .replace(/[-–—/]/g, ' ');
  for (const raw of cleaned.split(/\s+/)) {
    const token = raw.replace(/[^a-z0-9']/g, '').replace(/'/g, '');
    if (!token) continue;
    if (/^\d+$/.test(token)) out.push(...numberToWords(Number(token)));
    else out.push(token);
  }
  return out;
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length]![b.length]!;
}

function wordsMatch(a: string, b: string): 'exact' | 'close' | null {
  if (a === b) return 'exact';
  if (a.length >= 5 && levenshtein(a, b) <= 1) return 'close';
  return null;
}

export type AlignmentOp =
  | { kind: 'match'; ref: string; hyp: string; close: boolean }
  | { kind: 'substitution'; ref: string; hyp: string }
  | { kind: 'missing'; ref: string }
  | { kind: 'extra'; hyp: string };

export interface AlignmentResult {
  ops: AlignmentOp[];
  accuracy: number;
  matched: number;
  referenceWords: number;
}

/** Alineación tipo Levenshtein a nivel de palabra entre texto de referencia y lo dicho/escrito. */
export function alignWords(reference: string, hypothesis: string): AlignmentResult {
  const ref = normalizeForComparison(reference);
  const hyp = normalizeForComparison(hypothesis);
  const n = ref.length;
  const m = hyp.length;
  const cost: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 0; i <= n; i++) cost[i]![0] = i;
  for (let j = 0; j <= m; j++) cost[0]![j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const same = wordsMatch(ref[i - 1]!, hyp[j - 1]!) ? 0 : 1;
      cost[i]![j] = Math.min(cost[i - 1]![j]! + 1, cost[i]![j - 1]! + 1, cost[i - 1]![j - 1]! + same);
    }
  }
  const ops: AlignmentOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const match = wordsMatch(ref[i - 1]!, hyp[j - 1]!);
      const diag = cost[i - 1]![j - 1]! + (match ? 0 : 1);
      if (cost[i]![j] === diag) {
        ops.push(
          match
            ? { kind: 'match', ref: ref[i - 1]!, hyp: hyp[j - 1]!, close: match === 'close' }
            : { kind: 'substitution', ref: ref[i - 1]!, hyp: hyp[j - 1]! }
        );
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && cost[i]![j] === cost[i - 1]![j]! + 1) {
      ops.push({ kind: 'missing', ref: ref[i - 1]! });
      i--;
    } else {
      ops.push({ kind: 'extra', hyp: hyp[j - 1]! });
      j--;
    }
  }
  ops.reverse();
  const matched = ops.filter((o) => o.kind === 'match').length;
  return {
    ops,
    matched,
    referenceWords: n,
    accuracy: n === 0 ? 0 : Math.round((matched / n) * 100),
  };
}

/* ------------------------------------------------------------------ */
/* Métricas de habla                                                   */
/* ------------------------------------------------------------------ */

export interface SpeechFluencyReport {
  wordCount: number;
  wpm: number;
  articulationWpm: number | null;
  fillers: { total: number; detail: Record<string, number> };
  fillersPer100Words: number;
  pauseCount: number;
  longestPauseSec: number;
  voicedRatio: number | null;
  fluencyScore: number;
  pronunciationScore: number | null;
  notesEs: string[];
}

export function analyzeSpeechFluency(
  transcript: string,
  audio: SpeechAudioMetrics
): SpeechFluencyReport {
  const wordCount = countWords(transcript);
  const minutes = Math.max(audio.durationMs, 1) / 60_000;
  const wpm = Math.round(wordCount / minutes);
  const articulationWpm =
    audio.voicedMs > 1500 ? Math.round(wordCount / (audio.voicedMs / 60_000)) : null;
  const fillers = countFillers(transcript);
  const fillersPer100Words = wordCount ? Math.round((fillers.total / wordCount) * 1000) / 10 : 0;
  const pausesPerMinute = audio.pauseCount / Math.max(minutes, 0.25);
  const voicedRatio = audio.durationMs > 0 ? audio.voicedMs / audio.durationMs : null;

  let fluency = 100;
  if (wpm < 60) fluency -= (60 - wpm) * 0.9 + 15;
  else if (wpm < 90) fluency -= (90 - wpm) * 0.5;
  else if (wpm > 190) fluency -= (wpm - 190) * 0.4;
  fluency -= Math.max(0, pausesPerMinute - 6) * 3;
  fluency -= Math.max(0, fillersPer100Words - 3) * 2.5;
  if (audio.longestPauseMs > 3000) fluency -= Math.min(15, (audio.longestPauseMs - 3000) / 300);
  if (wordCount < 15) fluency -= 15;
  fluency = Math.round(clamp(fluency, 10, 100));

  const pronunciationScore =
    audio.recognitionConfidence !== null
      ? Math.round(clamp(audio.recognitionConfidence * 100 + 5, 0, 100))
      : null;

  const notesEs: string[] = [];
  if (wpm < 80) notesEs.push(`Ritmo de ${wpm} palabras/min: intenta encadenar ideas sin detenerte a traducir.`);
  else if (wpm <= 170) notesEs.push(`Ritmo natural de ${wpm} palabras/min.`);
  else notesEs.push(`Hablas rápido (${wpm} palabras/min): baja un poco para ganar claridad.`);
  if (audio.longestPauseMs > 3000)
    notesEs.push(
      `Tu pausa más larga fue de ${(audio.longestPauseMs / 1000).toFixed(1)} s. Usa frases puente como "Let me think…" o "What I mean is…".`
    );
  if (fillers.total > 0)
    notesEs.push(
      `Muletillas detectadas: ${Object.entries(fillers.detail)
        .map(([k, v]) => `"${k}" ×${v}`)
        .join(', ')}.`
    );
  if (['este', 'o sea', 'pues', 'bueno'].some((w) => fillers.detail[w]))
    notesEs.push('Se colaron muletillas en español: cámbialas por "well…", "I mean…" o "so…".');

  return {
    wordCount,
    wpm,
    articulationWpm,
    fillers,
    fillersPer100Words,
    pauseCount: audio.pauseCount,
    longestPauseSec: Math.round(audio.longestPauseMs / 100) / 10,
    voicedRatio,
    fluencyScore: fluency,
    pronunciationScore,
    notesEs,
  };
}

/* ------------------------------------------------------------------ */
/* Feedback completo                                                   */
/* ------------------------------------------------------------------ */

function estimateCefr(overall: number, wordCount: number): CoachFeedback['cefrEstimate'] {
  let level: CoachFeedback['cefrEstimate'] =
    overall < 40 ? 'A1' : overall < 55 ? 'A2' : overall < 68 ? 'B1' : overall < 80 ? 'B2' : overall < 90 ? 'C1' : 'C2';
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
  const cap = wordCount < 20 ? 'B1' : wordCount < 45 ? 'B2' : 'C2';
  if (order.indexOf(level) > order.indexOf(cap)) level = cap;
  return level;
}

const FOLLOW_UPS: Record<PracticeLevel, string[]> = {
  A1: [
    'What is your favorite part?',
    'When do you usually do this?',
    'Who do you do this with?',
  ],
  A2: ['Can you tell me more about that?', 'Why do you like it?', 'What did you do next?'],
  B1: [
    'What would you do differently next time?',
    'How did that make you feel?',
    'Can you give me a specific example?',
  ],
  B2: [
    'What are the main disadvantages of that?',
    'How might this change in the next few years?',
    'Would everyone agree with you? Why not?',
  ],
  C1: [
    'What evidence would make you change your mind?',
    'How does this issue affect different groups in society?',
    'What are the long-term implications?',
  ],
  C2: [
    'Which underlying assumptions in your argument could be challenged by a skeptic?',
    'How would you reconcile the ethical trade-offs with practical constraints?',
    'If you had to steelman the opposing view, what would be your strongest point?',
  ],
};

export function buildLocalFeedback(req: CoachRequest): CoachFeedback {
  const spoken = req.skill === 'speaking';
  const text = req.text.trim();
  const words = tokenizeWords(text);
  const wordCount = words.length;
  const sentences = splitSentences(text);
  const { correctedText, corrections } = checkGrammar(text, { spoken });

  const seriousErrors = corrections.filter((c) => c.type === 'grammar' || c.type === 'vocabulary').length;
  const minorErrors = corrections.length - seriousErrors;
  const errorsPer100 = wordCount ? ((seriousErrors + minorErrors * 0.35) / wordCount) * 100 : 0;
  const grammar = wordCount === 0 ? 0 : Math.round(clamp(100 - errorsPer100 * 9, 25, 100));

  const unique = new Set(words.map((w) => w.toLowerCase()));
  const guiraud = wordCount ? unique.size / Math.sqrt(wordCount) : 0;
  const longWords = words.filter((w) => w.length >= 8).length;
  const targetWordsUsed = findTargetWordsUsed(text, req.targetWords);
  const upgrades = findVocabularyUpgrades(text);
  const vocabulary = wordCount === 0
    ? 0
    : Math.round(
        clamp(
          38 + (guiraud - 3) * 11 + Math.min(12, longWords * 1.5) + targetWordsUsed.length * 4 - upgrades.length * 3,
          20,
          98
        )
      );

  const connectors = findConnectors(text);
  const avgSentenceLength = sentences.length ? wordCount / sentences.length : wordCount;
  let coherence =
    42 +
    Math.min(3, connectors.basic.length) * 4 +
    Math.min(4, connectors.intermediate.length) * 8 +
    Math.min(3, connectors.advanced.length) * 11;
  if (!spoken) {
    if (avgSentenceLength >= 8 && avgSentenceLength <= 24) coherence += 8;
    if (avgSentenceLength > 32) coherence -= 10;
    if (sentences.length >= 3) coherence += 5;
  } else if (wordCount >= 40) {
    coherence += 6;
  }
  coherence = wordCount === 0 ? 0 : Math.round(clamp(coherence, 20, 98));

  const minWords = req.minWords ?? (spoken ? 50 : 40);
  const lengthRatio = Math.min(1, wordCount / minWords);
  const targetRatio = req.targetWords.length ? targetWordsUsed.length / req.targetWords.length : 1;
  const task = Math.round(clamp(lengthRatio * 72 + targetRatio * 28, 0, 100));

  let fluency: number | undefined;
  let pronunciation: number | undefined;
  let fluencyNotes: string[] = [];
  if (spoken && req.audio) {
    const report = analyzeSpeechFluency(text, req.audio);
    fluency = report.fluencyScore;
    pronunciation = report.pronunciationScore ?? undefined;
    fluencyNotes = report.notesEs;
  }

  const parts: Array<[number, number]> = [
    [grammar, 0.3],
    [vocabulary, 0.25],
    [coherence, 0.2],
    [task, 0.25],
  ];
  if (fluency !== undefined) parts.push([fluency, 0.3]);
  if (pronunciation !== undefined) parts.push([pronunciation, 0.15]);
  const totalWeight = parts.reduce((a, [, w]) => a + w, 0);
  const overallScore = Math.round(parts.reduce((a, [s, w]) => a + s * w, 0) / totalWeight);

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (seriousErrors === 0 && wordCount >= 10) strengths.push('No detecté errores gramaticales frecuentes. ¡Muy bien!');
  const usedConnectors = [...connectors.advanced, ...connectors.intermediate];
  if (usedConnectors.length >= 2)
    strengths.push(`Buen uso de conectores: ${usedConnectors.slice(0, 4).join(', ')}.`);
  if (targetWordsUsed.length)
    strengths.push(`Usaste vocabulario objetivo: ${targetWordsUsed.join(', ')}.`);
  if (guiraud >= 6.5) strengths.push('Vocabulario variado: repites pocas palabras.');
  if (fluency !== undefined && fluency >= 75) strengths.push('Fluidez sólida: hablas con pocas interrupciones.');
  if (wordCount >= minWords) strengths.push(`Cumpliste la extensión (${wordCount} palabras).`);

  const errorTypes = new Map<string, number>();
  corrections.forEach((c) => errorTypes.set(c.explanationEs, (errorTypes.get(c.explanationEs) ?? 0) + 1));
  [...errorTypes.entries()]
    .filter(([, n]) => n >= 1)
    .slice(0, 3)
    .forEach(([exp]) => improvements.push(exp));
  if (wordCount < minWords)
    improvements.push(`Desarrolla más tus ideas: llevas ${wordCount} de ${minWords} palabras sugeridas.`);
  if (usedConnectors.length === 0)
    improvements.push('Añade conectores como "however", "for example" o "as a result" para enlazar ideas.');
  if (upgrades.length) improvements.push(`Mejora palabras genéricas: ${upgrades.map((u) => u.original).slice(0, 3).join(', ')}.`);
  const missingTargets = req.targetWords.filter((t) => !targetWordsUsed.includes(t));
  if (missingTargets.length && req.targetWords.length)
    improvements.push(`Intenta usar: ${missingTargets.slice(0, 3).join(', ')}.`);
  improvements.push(...fluencyNotes.filter((n) => !n.startsWith('Ritmo natural')));
  if (fluencyNotes.some((n) => n.startsWith('Ritmo natural')))
    strengths.push(fluencyNotes.find((n) => n.startsWith('Ritmo natural'))!);

  let upgraded = correctedText;
  for (const u of upgrades) {
    const m = u.original.match(/^(very|really|so)\s+([a-z]+)$/i);
    if (m) {
      const best = u.better.split(' / ')[0]!;
      upgraded = upgraded.replace(new RegExp(`\\b${m[0]}\\b`, 'i'), (orig) => matchCase(orig, best));
    }
  }

  const dims: Array<[string, number]> = [
    ['gramática', grammar],
    ['vocabulario', vocabulary],
    ['coherencia', coherence],
    ['cumplimiento de la tarea', task],
    ...(fluency !== undefined ? ([['fluidez', fluency]] as Array<[string, number]>) : []),
  ];
  const best = [...dims].sort((a, b) => b[1] - a[1])[0]!;
  const worst = [...dims].sort((a, b) => a[1] - b[1])[0]!;
  const summaryEs =
    wordCount === 0
      ? 'No hay texto para analizar todavía.'
      : `Puntuación global ${overallScore}/100 (nivel estimado ${estimateCefr(overallScore, wordCount)}). Punto fuerte: ${best[0]}. Siguiente foco: ${worst[0]}.`;

  const levelFollowUps = FOLLOW_UPS[req.level];
  const followUpQuestion = levelFollowUps[wordCount % levelFollowUps.length]!;

  return {
    source: 'local',
    overallScore,
    cefrEstimate: estimateCefr(overallScore, wordCount),
    scores: { grammar, vocabulary, coherence, task, fluency, pronunciation },
    summaryEs,
    correctedText,
    corrections: corrections.slice(0, 15),
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 6),
    vocabularyUpgrades: upgrades,
    targetWordsUsed,
    modelAnswer: upgraded !== correctedText ? upgraded : '',
    followUpQuestion,
  };
}
