import type { DailyCategory, DailyItem, PracticeLevel } from './types.js';
import { EXPERIENCE_DAILY_ITEMS } from './experience-bank.js';
import { uiLanguageFor } from './language.js';

export const DAILY_CATEGORY_META: Record<
  DailyCategory,
  { labelEn: string; labelEs: string; emoji: string; color: string }
> = {
  phrasal_verb: { labelEn: 'Phrasal verb', labelEs: 'Phrasal verb', emoji: '🧩', color: '#2563EB' },
  verb: { labelEn: 'Verb', labelEs: 'Verbo', emoji: '⚡', color: '#7C3AED' },
  slang: { labelEn: 'Slang', labelEs: 'Slang', emoji: '😎', color: '#FF2D55' },
  adjective: { labelEn: 'Adjective', labelEs: 'Adjetivo', emoji: '🎨', color: '#F59E0B' },
  idiom: { labelEn: 'Idiom', labelEs: 'Expresión', emoji: '💬', color: '#10B981' },
  vocabulary: { labelEn: 'Useful vocab', labelEs: 'Vocabulario útil', emoji: '📚', color: '#0EA5E9' },
};

export const DAILY_CATEGORIES: DailyCategory[] = [
  'phrasal_verb',
  'verb',
  'slang',
  'adjective',
  'idiom',
  'vocabulary',
];

export const DAILY_ITEMS: DailyItem[] = [
  /* ----------------------------- PHRASAL VERBS ----------------------------- */
  {
    id: 'pv-figure-out',
    category: 'phrasal_verb',
    term: 'figure out',
    partOfSpeech: 'phrasal verb (separable)',
    ipa: '/ˈfɪɡ.jər aʊt/',
    definitionEn: 'To understand something or find the answer to a problem after thinking about it.',
    usageEn:
      'Use it when you finally understand how something works or how to solve a problem. With a pronoun, put it in the middle: "figure it out".',
    examples: [
      "I can't figure out how this app works.",
      "Don't worry, we'll figure it out together.",
    ],
    spanish: 'descifrar, entender, averiguar',
    register: 'neutral',
    region: 'Global',
    synonyms: ['work out', 'solve', 'understand'],
    watchOutEs: 'Con pronombre: "figure it out", nunca "figure out it".',
    quiz: {
      sentence: "It took me an hour, but I finally ___ how to fix the bug.",
      options: ['figured out', 'figured in', 'figured up'],
      answer: 'figured out',
    },
  },
  {
    id: 'pv-come-up-with',
    category: 'phrasal_verb',
    term: 'come up with',
    partOfSpeech: 'phrasal verb (inseparable)',
    ipa: '/kʌm ʌp wɪð/',
    definitionEn: 'To think of an idea, a plan or a solution.',
    usageEn:
      'Perfect for brainstorming and work meetings. It always stays together: "come up with an idea", "come up with it".',
    examples: [
      'She came up with a brilliant name for the project.',
      'We need to come up with a plan before Friday.',
    ],
    spanish: 'idear, ocurrírsele algo a alguien',
    register: 'neutral',
    region: 'Global',
    synonyms: ['think of', 'devise', 'invent'],
    quiz: {
      sentence: "Who ___ the idea of a team trip to the mountains?",
      options: ['came up with', 'came down to', 'came across'],
      answer: 'came up with',
    },
  },
  {
    id: 'pv-run-out-of',
    category: 'phrasal_verb',
    term: 'run out of',
    partOfSpeech: 'phrasal verb (inseparable)',
    ipa: '/rʌn aʊt əv/',
    definitionEn: 'To use all of something so that there is none left.',
    usageEn:
      'Use it for time, money, battery, patience, ideas, coffee... Anything that can be finished.',
    examples: [
      "My phone is about to run out of battery.",
      "We ran out of time, so we'll continue tomorrow.",
    ],
    spanish: 'quedarse sin, acabarse',
    register: 'neutral',
    region: 'Global',
    synonyms: ['use up', 'be out of'],
    quiz: {
      sentence: "Can you buy some milk? We've ___ it.",
      options: ['run out of', 'run into', 'run over'],
      answer: 'run out of',
    },
  },
  {
    id: 'pv-get-over',
    category: 'phrasal_verb',
    term: 'get over',
    partOfSpeech: 'phrasal verb (inseparable)',
    ipa: '/ɡet ˈoʊ.vər/',
    definitionEn: 'To recover from an illness, a difficult experience or a bad feeling.',
    usageEn:
      'Common when talking about breakups, colds, disappointments or bad news. "Get over it" can sound rude if you say it to someone who is sad.',
    examples: [
      'It took him months to get over the breakup.',
      "I'm still getting over this cold.",
    ],
    spanish: 'superar, recuperarse de',
    register: 'neutral',
    region: 'Global',
    synonyms: ['recover from', 'move on from'],
    quiz: {
      sentence: "She was sad about losing the match, but she ___ it quickly.",
      options: ['got over', 'got off', 'got along'],
      answer: 'got over',
    },
  },
  {
    id: 'pv-look-forward-to',
    category: 'phrasal_verb',
    term: 'look forward to',
    partOfSpeech: 'phrasal verb',
    ipa: '/lʊk ˈfɔːr.wərd tuː/',
    definitionEn: 'To feel happy and excited about something that is going to happen.',
    usageEn:
      '"To" is a preposition here, so it is followed by a noun or a verb + -ing: "I look forward to seeing you." Very common at the end of emails.',
    examples: [
      "I'm really looking forward to the weekend.",
      'I look forward to hearing from you.',
    ],
    spanish: 'tener muchas ganas de, esperar con ilusión',
    register: 'neutral',
    region: 'Global',
    watchOutEs: 'Error típico: "look forward to see you". Lo correcto es "to seeing you".',
    quiz: {
      sentence: 'We look forward to ___ you at the conference.',
      options: ['meeting', 'meet', 'met'],
      answer: 'meeting',
    },
  },
  {
    id: 'pv-turn-down',
    category: 'phrasal_verb',
    term: 'turn down',
    partOfSpeech: 'phrasal verb (separable)',
    ipa: '/tɜːrn daʊn/',
    definitionEn: 'To refuse an offer, request or invitation; also, to reduce the volume or heat.',
    usageEn:
      'Two meanings: "turn down a job offer" (reject) and "turn down the music" (lower). With pronouns: "turn it down".',
    examples: [
      'She turned down the job because the salary was too low.',
      "Could you turn the TV down? I'm on a call.",
    ],
    spanish: 'rechazar; bajar (volumen, temperatura)',
    register: 'neutral',
    region: 'Global',
    synonyms: ['reject', 'decline', 'lower'],
    quiz: {
      sentence: 'He ___ the invitation because he had to work.',
      options: ['turned down', 'turned up', 'turned on'],
      answer: 'turned down',
    },
  },
  {
    id: 'pv-catch-up',
    category: 'phrasal_verb',
    term: 'catch up (with/on)',
    partOfSpeech: 'phrasal verb',
    ipa: '/kætʃ ʌp/',
    definitionEn:
      'To reach the same level as others; to talk with a friend about what has happened since you last met.',
    usageEn:
      '"Catch up on work/sleep" = do what you missed. "Let\'s catch up!" = let\'s meet and talk. "A catch-up" is also a noun for an informal meeting.',
    examples: [
      "Let's grab a coffee and catch up!",
      'I need to catch up on my emails after the holiday.',
    ],
    spanish: 'ponerse al día, alcanzar',
    register: 'informal',
    region: 'Global',
    quiz: {
      sentence: "I missed two classes, so I have to ___ on the homework.",
      options: ['catch up', 'catch on', 'catch out'],
      answer: 'catch up',
    },
  },
  {
    id: 'pv-end-up',
    category: 'phrasal_verb',
    term: 'end up',
    partOfSpeech: 'phrasal verb (intransitive)',
    ipa: '/end ʌp/',
    definitionEn: 'To finally be in a place or situation, often without planning it.',
    usageEn:
      'Great for storytelling: "We ended up + -ing / + place / + adjective". It shows the unexpected result of a story.',
    examples: [
      'We wanted to go to the beach, but we ended up watching movies at home.',
      'He took the wrong train and ended up in Brighton.',
    ],
    spanish: 'acabar (haciendo / en un lugar)',
    register: 'neutral',
    region: 'Global',
    quiz: {
      sentence: "We didn't plan to stay late, but we ___ talking until 2 a.m.",
      options: ['ended up', 'ended off', 'ended in'],
      answer: 'ended up',
    },
  },
  {
    id: 'pv-bring-up',
    category: 'phrasal_verb',
    term: 'bring up',
    partOfSpeech: 'phrasal verb (separable)',
    ipa: '/brɪŋ ʌp/',
    definitionEn: 'To mention a topic in a conversation; also, to raise a child.',
    usageEn:
      '"Bring up a topic" is very useful in meetings. "I was brought up in Bogotá" = I grew up / was raised there.',
    examples: [
      "I'd like to bring up something we discussed last week.",
      'She was brought up by her grandparents.',
    ],
    spanish: 'sacar un tema; criar',
    register: 'neutral',
    region: 'Global',
    synonyms: ['mention', 'raise'],
    quiz: {
      sentence: "Please don't ___ politics at dinner tonight.",
      options: ['bring up', 'bring out', 'bring about'],
      answer: 'bring up',
    },
  },

  /* --------------------------------- VERBS --------------------------------- */
  {
    id: 'v-cope',
    category: 'verb',
    term: 'cope (with)',
    partOfSpeech: 'verb (intransitive)',
    ipa: '/koʊp/',
    definitionEn: 'To deal successfully with a difficult situation.',
    usageEn:
      'Use it with stress, pressure, change, workload... "How do you cope with stress?" is a classic interview question.',
    examples: [
      "How do you cope with so much pressure at work?",
      "She's coping really well with her new job.",
    ],
    spanish: 'sobrellevar, lidiar con, arreglárselas',
    register: 'neutral',
    synonyms: ['deal with', 'handle', 'manage'],
    quiz: {
      sentence: 'It was hard to ___ with the noise in the new apartment.',
      options: ['cope', 'coop', 'cape'],
      answer: 'cope',
    },
  },
  {
    id: 'v-struggle',
    category: 'verb',
    term: 'struggle',
    partOfSpeech: 'verb / noun',
    ipa: '/ˈstrʌɡ.əl/',
    definitionEn: 'To try very hard to do something that is difficult.',
    usageEn:
      'Patterns: "struggle to + verb" or "struggle with + noun". Very natural for talking about learning: "I struggle with phrasal verbs."',
    examples: [
      'I struggle to understand fast native speakers.',
      'Many students struggle with pronunciation at first.',
    ],
    spanish: 'costarle a uno, luchar, batallar',
    register: 'neutral',
    synonyms: ['find it hard', 'have difficulty'],
    quiz: {
      sentence: 'I ___ to wake up early on Mondays.',
      options: ['struggle', 'strangle', 'stumble'],
      answer: 'struggle',
    },
  },
  {
    id: 'v-thrive',
    category: 'verb',
    term: 'thrive',
    partOfSpeech: 'verb',
    ipa: '/θraɪv/',
    definitionEn: 'To grow, develop or be successful, especially in good conditions.',
    usageEn:
      'A positive, slightly advanced verb (B2). "She thrives under pressure" = she performs better when there is pressure.',
    examples: [
      'Some people thrive in busy cities.',
      'Small businesses need support to thrive.',
    ],
    spanish: 'prosperar, crecer, florecer',
    register: 'neutral',
    synonyms: ['flourish', 'prosper', 'do well'],
    watchOutEs: 'Practica el sonido /θ/ (como la "z" en España): /θraɪv/.',
    quiz: {
      sentence: 'Plants ___ when they get enough light and water.',
      options: ['thrive', 'drive', 'dive'],
      answer: 'thrive',
    },
  },
  {
    id: 'v-acknowledge',
    category: 'verb',
    term: 'acknowledge',
    partOfSpeech: 'verb',
    ipa: '/əkˈnɑː.lɪdʒ/',
    definitionEn: 'To accept or admit that something is true; to show that you have received something.',
    usageEn:
      'Professional verb: "I acknowledge the mistake", "Please acknowledge receipt of this email". The "k" is silent!',
    examples: [
      'He acknowledged that the plan had some problems.',
      'Thanks for acknowledging my message so quickly.',
    ],
    spanish: 'reconocer, admitir; acusar recibo',
    register: 'formal',
    synonyms: ['admit', 'recognize', 'confirm'],
    quiz: {
      sentence: 'The manager ___ that the deadline was unrealistic.',
      options: ['acknowledged', 'knowledged', 'acknowledging'],
      answer: 'acknowledged',
    },
  },
  {
    id: 'v-hesitate',
    category: 'verb',
    term: 'hesitate',
    partOfSpeech: 'verb',
    ipa: '/ˈhez.ɪ.teɪt/',
    definitionEn: 'To pause before doing or saying something because you are unsure or nervous.',
    usageEn:
      '"Don\'t hesitate to contact me" is a polite, very common phrase in emails and customer service.',
    examples: [
      "Don't hesitate to ask if you have any questions.",
      'She hesitated for a moment before answering.',
    ],
    spanish: 'dudar, vacilar',
    register: 'neutral',
    quiz: {
      sentence: 'If you need help, please don’t ___ to call me.',
      options: ['hesitate', 'hesitating', 'hesitation'],
      answer: 'hesitate',
    },
  },
  {
    id: 'v-achieve',
    category: 'verb',
    term: 'achieve',
    partOfSpeech: 'verb',
    ipa: '/əˈtʃiːv/',
    definitionEn: 'To succeed in doing something good, usually after a lot of effort.',
    usageEn:
      'Use it with goals, results, success, dreams: "achieve a goal". The noun is "achievement".',
    examples: [
      'She achieved her goal of running a marathon.',
      'What do you want to achieve this year?',
    ],
    spanish: 'lograr, conseguir, alcanzar',
    register: 'neutral',
    synonyms: ['accomplish', 'reach', 'attain'],
    quiz: {
      sentence: 'With daily practice, you can ___ fluency faster.',
      options: ['achieve', 'archive', 'arrive'],
      answer: 'achieve',
    },
  },
  {
    id: 'v-rely-on',
    category: 'verb',
    term: 'rely on',
    partOfSpeech: 'verb + preposition',
    ipa: '/rɪˈlaɪ ɑːn/',
    definitionEn: 'To need or trust someone or something to help you or work correctly.',
    usageEn:
      'Always with "on": "You can rely on me." Adjective: "reliable" (confiable).',
    examples: [
      'You can always rely on her to finish on time.',
      'We rely too much on our phones.',
    ],
    spanish: 'depender de, contar con, confiar en',
    register: 'neutral',
    synonyms: ['count on', 'depend on', 'trust'],
    quiz: {
      sentence: "Don't worry, you can ___ me.",
      options: ['rely on', 'rely of', 'rely in'],
      answer: 'rely on',
    },
  },
  {
    id: 'v-wander',
    category: 'verb',
    term: 'wander',
    partOfSpeech: 'verb',
    ipa: '/ˈwɑːn.dər/',
    definitionEn: 'To walk slowly around a place without a clear direction or purpose.',
    usageEn:
      'Lovely verb for travel stories. Your mind can also wander when you lose concentration. Don\'t confuse it with "wonder" /ˈwʌn.dər/ (preguntarse).',
    examples: [
      'We spent the afternoon wandering around the old town.',
      'Sorry, my mind was wandering. What did you say?',
    ],
    spanish: 'pasear sin rumbo, deambular',
    register: 'neutral',
    watchOutEs: '"Wander" (vagar) ≠ "wonder" (preguntarse). La vocal cambia.',
    quiz: {
      sentence: 'On holiday, I love to ___ around new cities without a map.',
      options: ['wander', 'wonder', 'wonderful'],
      answer: 'wander',
    },
  },

  /* --------------------------------- SLANG --------------------------------- */
  {
    id: 's-low-key',
    category: 'slang',
    term: 'low-key',
    partOfSpeech: 'adverb / adjective (slang)',
    ipa: '/ˌloʊˈkiː/',
    definitionEn: 'Slightly, secretly or quietly; also, relaxed and not fancy.',
    usageEn:
      'Gen Z and millennials use "low-key" before an opinion to make it softer: "I low-key love this song" = I secretly kind of love it. "A low-key party" = small and relaxed.',
    examples: [
      "I'm low-key nervous about the interview.",
      'We had a low-key birthday dinner at home.',
    ],
    spanish: 'medio, un poco, en secreto; tranqui, sin lujos',
    register: 'informal',
    region: 'US',
    synonyms: ['kind of', 'secretly'],
    quiz: {
      sentence: "Honestly, that movie was ___ amazing. I didn't expect it.",
      options: ['low-key', 'low-cost', 'low-level'],
      answer: 'low-key',
    },
  },
  {
    id: 's-no-cap',
    category: 'slang',
    term: 'no cap',
    partOfSpeech: 'expression (slang)',
    definitionEn: 'No lie; I am being completely honest.',
    usageEn:
      'Very informal, popular on social media and with younger people. "Cap" means a lie. Use only with friends.',
    examples: [
      "That was the best pizza I've ever had, no cap.",
      'No cap, I studied for six hours today.',
    ],
    spanish: 'en serio, sin mentir, de verdad',
    register: 'informal',
    region: 'US',
    synonyms: ['for real', 'seriously', 'honestly'],
    quiz: {
      sentence: 'This app helped me so much, ___ .',
      options: ['no cap', 'no hat', 'no top'],
      answer: 'no cap',
    },
  },
  {
    id: 's-bail',
    category: 'slang',
    term: 'bail (on someone)',
    partOfSpeech: 'verb (slang)',
    ipa: '/beɪl/',
    definitionEn: 'To leave suddenly or to cancel plans at the last minute.',
    usageEn:
      '"I have to bail" = I have to leave now. "He bailed on us" = he cancelled our plans.',
    examples: [
      'Sorry guys, I have to bail. Early meeting tomorrow!',
      'She bailed on the party at the last minute.',
    ],
    spanish: 'irse de repente, dejar plantado, cancelar',
    register: 'informal',
    region: 'US',
    synonyms: ['take off', 'cancel', 'flake'],
    quiz: {
      sentence: "Mark was supposed to come, but he ___ on us again.",
      options: ['bailed', 'boiled', 'bowled'],
      answer: 'bailed',
    },
  },
  {
    id: 's-gutted',
    category: 'slang',
    term: 'gutted',
    partOfSpeech: 'adjective (British slang)',
    ipa: '/ˈɡʌt.ɪd/',
    definitionEn: 'Extremely disappointed or sad.',
    usageEn:
      'Very British and very common, especially about football, exams or cancelled plans: "I was gutted when they lost."',
    examples: [
      "I was absolutely gutted when the concert was cancelled.",
      "She's gutted she missed the trip.",
    ],
    spanish: 'destrozado, muy decepcionado',
    register: 'informal',
    region: 'UK',
    synonyms: ['devastated', 'really disappointed'],
    quiz: {
      sentence: "We lost the final in the last minute. I'm ___!",
      options: ['gutted', 'gifted', 'guided'],
      answer: 'gutted',
    },
  },
  {
    id: 's-knackered',
    category: 'slang',
    term: 'knackered',
    partOfSpeech: 'adjective (British slang)',
    ipa: '/ˈnæk.ərd/',
    definitionEn: 'Extremely tired; also, broken or in bad condition.',
    usageEn:
      'UK informal. Americans usually say "beat" or "wiped out". The "k" at the start is silent.',
    examples: [
      "I'm knackered after that run.",
      'My old laptop is completely knackered.',
    ],
    spanish: 'reventado, molido, hecho polvo',
    register: 'informal',
    region: 'UK',
    synonyms: ['exhausted', 'wiped out', 'beat'],
    quiz: {
      sentence: 'After a 12-hour shift, I was absolutely ___.',
      options: ['knackered', 'knocked', 'knitted'],
      answer: 'knackered',
    },
  },
  {
    id: 's-salty',
    category: 'slang',
    term: 'salty',
    partOfSpeech: 'adjective (slang)',
    ipa: '/ˈsɑːl.ti/',
    definitionEn: 'Annoyed, bitter or upset, usually about something small.',
    usageEn:
      'Used jokingly: "Why are you so salty?" = why are you so annoyed? Popular in gaming and sports.',
    examples: [
      "He's still salty about losing the game.",
      "Don't be salty, it was just a joke!",
    ],
    spanish: 'picado, resentido, ardido',
    register: 'informal',
    region: 'US',
    synonyms: ['bitter', 'annoyed', 'upset'],
    quiz: {
      sentence: "She's ___ because nobody saved her a slice of cake.",
      options: ['salty', 'sweety', 'spicy'],
      answer: 'salty',
    },
  },
  {
    id: 's-my-bad',
    category: 'slang',
    term: 'my bad',
    partOfSpeech: 'expression (informal)',
    definitionEn: 'My mistake; sorry, it was my fault.',
    usageEn:
      'Quick, casual apology for small mistakes. Not for serious situations or formal emails.',
    examples: [
      'Oh, that was your coffee? My bad!',
      'My bad, I sent the wrong file.',
    ],
    spanish: 'culpa mía, perdón',
    register: 'informal',
    region: 'US',
    synonyms: ['my mistake', 'sorry about that'],
    quiz: {
      sentence: "I forgot to text you back — ___ !",
      options: ['my bad', 'my wrong', 'my sorry'],
      answer: 'my bad',
    },
  },
  {
    id: 's-spill-the-tea',
    category: 'slang',
    term: 'spill the tea',
    partOfSpeech: 'expression (slang)',
    definitionEn: 'To share gossip or interesting private information.',
    usageEn:
      '"Tea" means gossip. "Spill the tea!" = tell me everything! Playful and very informal.',
    examples: [
      'You went on a date last night? Spill the tea!',
      "Come on, spill the tea — what happened at the party?",
    ],
    spanish: 'soltar el chisme, contar el chisme',
    register: 'informal',
    region: 'US',
    synonyms: ['dish the dirt', 'tell me everything'],
    quiz: {
      sentence: 'I heard something happened at the office. ___ !',
      options: ['Spill the tea', 'Pour the coffee', 'Drop the milk'],
      answer: 'Spill the tea',
    },
  },

  /* ------------------------------- ADJECTIVES ------------------------------ */
  {
    id: 'a-overwhelmed',
    category: 'adjective',
    term: 'overwhelmed',
    partOfSpeech: 'adjective',
    ipa: '/ˌoʊ.vərˈwelmd/',
    definitionEn: 'Feeling that you have too much to deal with, or feeling a very strong emotion.',
    usageEn:
      'Use it for stress ("overwhelmed with work") and strong positive emotion ("overwhelmed by the support"). Much more precise than "very stressed".',
    examples: [
      "I feel a bit overwhelmed with all these deadlines.",
      'She was overwhelmed by everyone’s kindness.',
    ],
    spanish: 'abrumado, agobiado, desbordado',
    register: 'neutral',
    synonyms: ['swamped', 'stressed out', 'snowed under'],
    quiz: {
      sentence: 'With three exams in one week, he felt completely ___.',
      options: ['overwhelmed', 'overjoyed', 'overcooked'],
      answer: 'overwhelmed',
    },
  },
  {
    id: 'a-reliable',
    category: 'adjective',
    term: 'reliable',
    partOfSpeech: 'adjective',
    ipa: '/rɪˈlaɪ.ə.bəl/',
    definitionEn: 'Can be trusted to work well or to behave as you expect.',
    usageEn:
      'For people, cars, internet connections, sources of information... A great word for job interviews: "I\'m reliable and organised."',
    examples: [
      "He's the most reliable person on the team.",
      'We need a reliable internet connection for the call.',
    ],
    spanish: 'confiable, fiable, cumplido',
    register: 'neutral',
    synonyms: ['dependable', 'trustworthy'],
    quiz: {
      sentence: 'I always ask Ana for help because she is very ___.',
      options: ['reliable', 'relying', 'reliant'],
      answer: 'reliable',
    },
  },
  {
    id: 'a-awkward',
    category: 'adjective',
    term: 'awkward',
    partOfSpeech: 'adjective',
    ipa: '/ˈɑː.kwərd/',
    definitionEn: 'Embarrassing and uncomfortable; or difficult to use or deal with.',
    usageEn:
      'An "awkward silence" is when nobody knows what to say. You can also feel awkward in a new social situation.',
    examples: [
      'There was an awkward silence after his joke.',
      'I felt a bit awkward because I didn’t know anyone at the party.',
    ],
    spanish: 'incómodo, embarazoso, torpe',
    register: 'neutral',
    synonyms: ['uncomfortable', 'embarrassing', 'clumsy'],
    quiz: {
      sentence: 'It was so ___ when I called my teacher "Mum".',
      options: ['awkward', 'awful', 'awake'],
      answer: 'awkward',
    },
  },
  {
    id: 'a-straightforward',
    category: 'adjective',
    term: 'straightforward',
    partOfSpeech: 'adjective',
    ipa: '/ˌstreɪtˈfɔːr.wərd/',
    definitionEn: 'Easy to understand or do; also, honest and direct (for people).',
    usageEn:
      'A more natural alternative to "easy" or "simple" in work contexts: "The process is pretty straightforward."',
    examples: [
      'The instructions are quite straightforward.',
      'I like her because she’s very straightforward — she says what she thinks.',
    ],
    spanish: 'sencillo, claro; directo, franco',
    register: 'neutral',
    synonyms: ['simple', 'clear', 'direct'],
    quiz: {
      sentence: "Don't worry, signing up is ___. It takes two minutes.",
      options: ['straightforward', 'straight ahead', 'forward'],
      answer: 'straightforward',
    },
  },
  {
    id: 'a-eager',
    category: 'adjective',
    term: 'eager',
    partOfSpeech: 'adjective',
    ipa: '/ˈiː.ɡər/',
    definitionEn: 'Wanting very much to do or have something.',
    usageEn:
      'Patterns: "eager to + verb" or "eager for + noun". Shows motivation: "I\'m eager to learn."',
    examples: [
      "I'm eager to start my new job.",
      'The kids were eager for the holidays to begin.',
    ],
    spanish: 'ansioso (en sentido positivo), con muchas ganas',
    register: 'neutral',
    synonyms: ['keen', 'enthusiastic'],
    quiz: {
      sentence: 'The new students were ___ to make friends.',
      options: ['eager', 'angry', 'eagle'],
      answer: 'eager',
    },
  },
  {
    id: 'a-resourceful',
    category: 'adjective',
    term: 'resourceful',
    partOfSpeech: 'adjective',
    ipa: '/rɪˈsɔːrs.fəl/',
    definitionEn: 'Good at finding clever ways to solve problems, even with few resources.',
    usageEn:
      'A strong compliment and a great CV word. It means you are creative and practical when things go wrong.',
    examples: [
      "She's incredibly resourceful — she fixed the car with a hair clip!",
      'Startups need resourceful people.',
    ],
    spanish: 'ingenioso, recursivo, con iniciativa',
    register: 'neutral',
    synonyms: ['inventive', 'creative', 'clever'],
    quiz: {
      sentence: 'Our guide was very ___ and found a hotel in the middle of the night.',
      options: ['resourceful', 'resentful', 'restful'],
      answer: 'resourceful',
    },
  },
  {
    id: 'a-picky',
    category: 'adjective',
    term: 'picky',
    partOfSpeech: 'adjective (informal)',
    ipa: '/ˈpɪk.i/',
    definitionEn: 'Very difficult to please because you only like specific things.',
    usageEn:
      'Most common with food: "a picky eater". British English also says "fussy".',
    examples: [
      "My nephew is a really picky eater.",
      "Don't be so picky — the hotel is fine!",
    ],
    spanish: 'quisquilloso, exigente, mañoso (con la comida)',
    register: 'informal',
    synonyms: ['fussy', 'choosy'],
    quiz: {
      sentence: "He's so ___ — he only eats pasta without sauce.",
      options: ['picky', 'pinky', 'peaky'],
      answer: 'picky',
    },
  },
  {
    id: 'a-thoughtful',
    category: 'adjective',
    term: 'thoughtful',
    partOfSpeech: 'adjective',
    ipa: '/ˈθɑːt.fəl/',
    definitionEn: 'Kind and always thinking about what other people need; or showing careful thought.',
    usageEn:
      '"That\'s so thoughtful of you!" is a warm way to thank someone for a kind gesture.',
    examples: [
      "Thanks for the flowers — that's so thoughtful of you.",
      'She gave a very thoughtful answer.',
    ],
    spanish: 'considerado, atento, detallista; reflexivo',
    register: 'neutral',
    synonyms: ['considerate', 'kind', 'caring'],
    quiz: {
      sentence: 'He remembered my birthday. He’s really ___.',
      options: ['thoughtful', 'thoughtless', 'thinking'],
      answer: 'thoughtful',
    },
  },

  /* --------------------------------- IDIOMS -------------------------------- */
  {
    id: 'i-break-the-ice',
    category: 'idiom',
    term: 'break the ice',
    partOfSpeech: 'idiom',
    definitionEn: 'To say or do something to make people feel more relaxed when they first meet.',
    usageEn:
      'Typical in meetings, parties and first dates. An "icebreaker" is an activity or question that does this.',
    examples: [
      'He told a funny story to break the ice.',
      "Let's start with a quick game to break the ice.",
    ],
    spanish: 'romper el hielo',
    register: 'neutral',
    quiz: {
      sentence: 'The teacher asked everyone their favourite food to ___.',
      options: ['break the ice', 'break a leg', 'break the bank'],
      answer: 'break the ice',
    },
  },
  {
    id: 'i-under-the-weather',
    category: 'idiom',
    term: 'under the weather',
    partOfSpeech: 'idiom',
    definitionEn: 'Feeling slightly ill.',
    usageEn:
      'A polite, soft way to say you are a bit sick, perfect for messages to your boss or friends.',
    examples: [
      "I'm feeling a bit under the weather today, so I'll work from home.",
      'She looks under the weather.',
    ],
    spanish: 'estar indispuesto, sentirse mal',
    register: 'neutral',
    quiz: {
      sentence: "I won't come to the gym today. I'm a bit ___.",
      options: ['under the weather', 'over the moon', 'on the ball'],
      answer: 'under the weather',
    },
  },
  {
    id: 'i-call-it-a-day',
    category: 'idiom',
    term: 'call it a day',
    partOfSpeech: 'idiom',
    definitionEn: 'To stop working on something, usually because you are tired or have done enough.',
    usageEn:
      'Very common at the end of the workday: "Let\'s call it a day." The night version is "call it a night".',
    examples: [
      "We've been working for ten hours. Let's call it a day.",
      'After three hours of practice, I called it a day.',
    ],
    spanish: 'dar por terminado (el día), dejarlo por hoy',
    register: 'neutral',
    quiz: {
      sentence: "It's 7 p.m. and I'm exhausted. I think I'll ___.",
      options: ['call it a day', 'call it off', 'call the shots'],
      answer: 'call it a day',
    },
  },
  {
    id: 'i-piece-of-cake',
    category: 'idiom',
    term: 'a piece of cake',
    partOfSpeech: 'idiom',
    definitionEn: 'Something very easy to do.',
    usageEn: 'Informal and friendly. "The exam was a piece of cake!"',
    examples: [
      'Don’t worry, the test will be a piece of cake.',
      'Setting up the app was a piece of cake.',
    ],
    spanish: 'pan comido, muy fácil',
    register: 'informal',
    quiz: {
      sentence: 'For her, solving that puzzle was ___.',
      options: ['a piece of cake', 'a piece of work', 'a slice of life'],
      answer: 'a piece of cake',
    },
  },
  {
    id: 'i-on-the-fence',
    category: 'idiom',
    term: 'on the fence',
    partOfSpeech: 'idiom',
    definitionEn: 'Unable to decide between two options.',
    usageEn: 'Useful in debates and decisions: "I\'m still on the fence about it."',
    examples: [
      "I'm on the fence about moving to another city.",
      'Most voters are still on the fence.',
    ],
    spanish: 'indeciso, sin decidirse',
    register: 'neutral',
    synonyms: ['undecided', 'torn'],
    quiz: {
      sentence: "Should I buy the iPhone or the Android? I'm still ___.",
      options: ['on the fence', 'on the road', 'on fire'],
      answer: 'on the fence',
    },
  },
  {
    id: 'i-ball-in-your-court',
    category: 'idiom',
    term: 'the ball is in your court',
    partOfSpeech: 'idiom',
    definitionEn: 'It is your turn to take action or make a decision.',
    usageEn: 'From tennis. Common in negotiations: "We sent our offer — now the ball is in their court."',
    examples: [
      "I've apologised. The ball is in your court now.",
      'We sent the proposal, so the ball is in their court.',
    ],
    spanish: 'la pelota está en tu tejado, te toca a ti',
    register: 'neutral',
    quiz: {
      sentence: "I've given you all the information. The ___ .",
      options: ['ball is in your court', 'cat is out of the bag', 'sky is the limit'],
      answer: 'ball is in your court',
    },
  },
  {
    id: 'i-cost-an-arm-and-a-leg',
    category: 'idiom',
    term: 'cost an arm and a leg',
    partOfSpeech: 'idiom',
    definitionEn: 'To be extremely expensive.',
    usageEn: 'Informal exaggeration for prices: "That jacket cost an arm and a leg."',
    examples: [
      'Renting in London costs an arm and a leg.',
      'The repair cost me an arm and a leg.',
    ],
    spanish: 'costar un ojo de la cara',
    register: 'informal',
    quiz: {
      sentence: 'We loved the restaurant, but it ___.',
      options: ['cost an arm and a leg', 'broke the ice', 'hit the books'],
      answer: 'cost an arm and a leg',
    },
  },
  {
    id: 'i-hit-the-books',
    category: 'idiom',
    term: 'hit the books',
    partOfSpeech: 'idiom',
    definitionEn: 'To start studying hard.',
    usageEn: 'Informal, used by students: "Exams are next week — time to hit the books!"',
    examples: [
      "I can't go out tonight, I need to hit the books.",
      'She hit the books all weekend.',
    ],
    spanish: 'ponerse a estudiar en serio, quemarse las pestañas',
    register: 'informal',
    region: 'US',
    quiz: {
      sentence: 'My exam is tomorrow, so I have to ___ tonight.',
      options: ['hit the books', 'hit the road', 'hit the sack'],
      answer: 'hit the books',
    },
  },

  /* --------------------------- USEFUL VOCABULARY --------------------------- */
  {
    id: 'w-actually',
    category: 'vocabulary',
    term: 'actually',
    partOfSpeech: 'adverb (false friend!)',
    ipa: '/ˈæk.tʃu.ə.li/',
    definitionEn: 'In fact; really (used to add surprising or correcting information).',
    usageEn:
      '"Actually" does NOT mean "actualmente". Use it to correct or add a surprising fact: "Actually, I\'m from Medellín, not Bogotá." For "actualmente" say "currently" or "nowadays".',
    examples: [
      "Actually, I don't like coffee.",
      'I currently live in Madrid. (= actualmente)',
    ],
    spanish: 'en realidad, de hecho (≠ actualmente)',
    register: 'neutral',
    watchOutEs: 'Falso amigo: "actualmente" = currently / nowadays.',
    quiz: {
      sentence: "I thought the movie would be boring, but ___ it was great.",
      options: ['actually', 'currently', 'nowadays'],
      answer: 'actually',
    },
  },
  {
    id: 'w-embarrassed',
    category: 'vocabulary',
    term: 'embarrassed',
    partOfSpeech: 'adjective (false friend!)',
    ipa: '/ɪmˈber.əst/',
    definitionEn: 'Feeling ashamed or shy because of something silly you did.',
    usageEn:
      'It does NOT mean "embarazada" (pregnant). "I was so embarrassed when I fell in the street."',
    examples: [
      'I felt so embarrassed when I forgot his name.',
      'She is pregnant. (= embarazada)',
    ],
    spanish: 'avergonzado, apenado (≠ embarazada)',
    register: 'neutral',
    watchOutEs: 'Falso amigo clásico: "embarazada" = pregnant.',
    quiz: {
      sentence: 'He was really ___ when he called his boss "Mom".',
      options: ['embarrassed', 'pregnant', 'excited'],
      answer: 'embarrassed',
    },
  },
  {
    id: 'w-eventually',
    category: 'vocabulary',
    term: 'eventually',
    partOfSpeech: 'adverb (false friend!)',
    ipa: '/ɪˈven.tʃu.ə.li/',
    definitionEn: 'In the end, after a long time or after many problems.',
    usageEn:
      '"Eventually" ≠ "eventualmente" (possibly/occasionally). It means "finalmente, al final": "We eventually found the hotel."',
    examples: [
      'After two hours, we eventually found a parking space.',
      "Don't worry, you'll eventually get used to it.",
    ],
    spanish: 'al final, finalmente (≠ eventualmente)',
    register: 'neutral',
    watchOutEs: '"Eventualmente" = possibly / occasionally.',
    quiz: {
      sentence: 'The bus was very late, but it ___ arrived.',
      options: ['eventually', 'possibly', 'occasionally'],
      answer: 'eventually',
    },
  },
  {
    id: 'w-deadline',
    category: 'vocabulary',
    term: 'deadline',
    partOfSpeech: 'noun',
    ipa: '/ˈded.laɪn/',
    definitionEn: 'The time or date by which something must be finished.',
    usageEn:
      'Collocations: "meet a deadline" (cumplir), "miss a deadline" (no cumplir), "a tight deadline" (ajustado).',
    examples: [
      "The deadline for the report is Friday at noon.",
      "We worked all night to meet the deadline.",
    ],
    spanish: 'fecha límite, plazo',
    register: 'neutral',
    quiz: {
      sentence: "If we don't hurry, we're going to miss the ___.",
      options: ['deadline', 'headline', 'timeline'],
      answer: 'deadline',
    },
  },
  {
    id: 'w-commute',
    category: 'vocabulary',
    term: 'commute',
    partOfSpeech: 'noun / verb',
    ipa: '/kəˈmjuːt/',
    definitionEn: 'The regular journey between your home and your place of work or study.',
    usageEn:
      '"My commute takes 40 minutes." "I commute by bike." There is no single word in Spanish — very useful!',
    examples: [
      'My daily commute is about an hour each way.',
      'Do you commute by bus or by car?',
    ],
    spanish: 'el trayecto diario casa–trabajo; desplazarse al trabajo',
    register: 'neutral',
    quiz: {
      sentence: 'Working from home means I don’t have a long ___ anymore.',
      options: ['commute', 'compute', 'comment'],
      answer: 'commute',
    },
  },
  {
    id: 'w-assist',
    category: 'vocabulary',
    term: 'attend (vs. assist)',
    partOfSpeech: 'verb (false friend!)',
    ipa: '/əˈtend/',
    definitionEn: 'To go to an event such as a meeting, class or wedding.',
    usageEn:
      '"Asistir a una reunión" = "attend a meeting" (no preposition!). "Assist" means "help": "Can I assist you?"',
    examples: [
      'More than 200 people attended the conference.',
      'The nurse assisted the doctor during the operation.',
    ],
    spanish: 'asistir a (un evento) = attend',
    register: 'neutral',
    watchOutEs: '"Assist" = ayudar. "Asistir a clase" = "attend class".',
    quiz: {
      sentence: 'Will you ___ the meeting tomorrow?',
      options: ['attend', 'assist to', 'attend to'],
      answer: 'attend',
    },
  },
  {
    id: 'w-nevertheless',
    category: 'vocabulary',
    term: 'nevertheless',
    partOfSpeech: 'linking adverb',
    ipa: '/ˌnev.ər.ðəˈles/',
    definitionEn: 'Despite what has just been said; however.',
    usageEn:
      'A formal connector for writing. Put it at the start of a sentence followed by a comma: "It was raining. Nevertheless, we went out."',
    examples: [
      'The plan was risky. Nevertheless, it worked.',
      'I was tired; nevertheless, I finished the essay.',
    ],
    spanish: 'sin embargo, no obstante',
    register: 'formal',
    synonyms: ['however', 'even so', 'nonetheless'],
    quiz: {
      sentence: 'The test was difficult. ___, most students passed.',
      options: ['Nevertheless', 'Because', 'Therefore'],
      answer: 'Nevertheless',
    },
  },
  {
    id: 'w-workload',
    category: 'vocabulary',
    term: 'workload',
    partOfSpeech: 'noun',
    ipa: '/ˈwɝːk.loʊd/',
    definitionEn: 'The amount of work a person or organization has to do.',
    usageEn:
      'Collocations: "a heavy workload", "manage my workload", "reduce the workload".',
    examples: [
      'My workload has doubled since my colleague left.',
      'How do you manage such a heavy workload?',
    ],
    spanish: 'carga de trabajo',
    register: 'neutral',
    quiz: {
      sentence: 'I can’t take another project — my ___ is already too heavy.',
      options: ['workload', 'workshop', 'workout'],
      answer: 'workload',
    },
  },
  /* -------------------- EXPANDED BANK (ALL CEFR LEVELS) -------------------- */
  {
    id: 'pv-follow-up',
    category: 'phrasal_verb',
    term: 'follow up (on)',
    partOfSpeech: 'phrasal verb',
    ipa: '/ˈfɑː.loʊ ʌp/',
    definitionEn: 'To check the progress of something or contact someone again after an earlier meeting or email.',
    usageEn: 'Essential in professional English: "I\'m just following up on my last email."',
    examples: [
      'I’m writing to follow up on our conversation from Tuesday.',
      'Could you follow up with the client tomorrow morning?',
    ],
    spanish: 'hacer seguimiento, dar seguimiento',
    register: 'neutral',
    synonyms: ['check in on', 'pursue'],
    quiz: {
      sentence: 'Hi Sarah, I just wanted to ___ on the proposal I sent last week.',
      options: ['follow up', 'give up', 'make up'],
      answer: 'follow up',
    },
  },
  {
    id: 'pv-narrow-down',
    category: 'phrasal_verb',
    term: 'narrow down',
    partOfSpeech: 'phrasal verb (separable)',
    ipa: '/ˈnær.oʊ daʊn/',
    definitionEn: 'To reduce a large number of options or possibilities to a much smaller number.',
    usageEn: 'Great for decision-making: "We narrowed down the list to three candidates."',
    examples: [
      'We’ve narrowed down our vacation options to Italy or Portugal.',
      'Let’s narrow it down to the two best designs.',
    ],
    spanish: 'reducir opciones, acotar, filtrar',
    register: 'neutral',
    synonyms: ['shortlist', 'filter'],
    quiz: {
      sentence: 'We had 50 applicants and ___ the list to five finalists.',
      options: ['narrowed down', 'broke down', 'turned down'],
      answer: 'narrowed down',
    },
  },
  {
    id: 'pv-brush-up-on',
    category: 'phrasal_verb',
    term: 'brush up on',
    partOfSpeech: 'phrasal verb',
    ipa: '/brʌʃ ʌp ɑːn/',
    definitionEn: 'To quickly improve a skill or knowledge you learned in the past but have partly forgotten.',
    usageEn: 'Always followed by "on + noun": "I need to brush up on my English before the trip."',
    examples: [
      'I’m brushing up on my spoken English before the conference.',
      'She brushed up on her coding skills over the weekend.',
    ],
    spanish: 'repasar, refrescar, desempolvar (un idioma o habilidad)',
    register: 'neutral',
    synonyms: ['review', 'refresh'],
    quiz: {
      sentence: 'Before moving to London, I want to ___ my pronunciation.',
      options: ['brush up on', 'catch up with', 'get away with'],
      answer: 'brush up on',
    },
  },
  {
    id: 'pv-iron-out',
    category: 'phrasal_verb',
    term: 'iron out',
    partOfSpeech: 'phrasal verb (separable)',
    ipa: '/ˈaɪ.ərn aʊt/',
    definitionEn: 'To resolve small problems, disagreements or details so a plan works smoothly.',
    usageEn: 'High-value B2/C1 business phrase: "We still need to iron out a few details."',
    examples: [
      'Let’s meet tomorrow to iron out the remaining bugs before launch.',
      'They ironed out their differences and signed the contract.',
    ],
    spanish: 'limar asperezas, resolver detalles pendientes, pulir',
    register: 'neutral',
    synonyms: ['resolve', 'smooth over'],
    quiz: {
      sentence: 'The contract is almost ready; we just need to ___ a few minor details.',
      options: ['iron out', 'burn out', 'walk out'],
      answer: 'iron out',
    },
  },
  {
    id: 'v-leverage',
    category: 'verb',
    term: 'leverage',
    partOfSpeech: 'verb / noun',
    ipa: '/ˈlev.ər.ɪdʒ/',
    definitionEn: 'To use something that you already have in order to achieve a better result or maximum advantage.',
    usageEn: 'Very common in business and tech: "leverage our existing network", "leverage AI tools".',
    examples: [
      'How can we leverage our customer data to improve retention?',
      'She leveraged her bilingual skills to land an international role.',
    ],
    spanish: 'aprovechar al máximo, apalancar',
    register: 'formal',
    synonyms: ['utilize', 'capitalize on', 'make the most of'],
    quiz: {
      sentence: 'We should ___ our social media community to launch the new product.',
      options: ['leverage', 'leave', 'level'],
      answer: 'leverage',
    },
  },
  {
    id: 'v-streamline',
    category: 'verb',
    term: 'streamline',
    partOfSpeech: 'verb',
    ipa: '/ˈstriːm.laɪn/',
    definitionEn: 'To make a system, process or organization work more simply and effectively.',
    usageEn: 'Used for workflows, onboarding, or daily routines: "streamline the checkout process".',
    examples: [
      'The new app streamlined our expense approval workflow.',
      'We need to streamline how we onboard new team members.',
    ],
    spanish: 'agilizar, optimizar, simplificar procesos',
    register: 'neutral',
    synonyms: ['simplify', 'optimize'],
    quiz: {
      sentence: 'Automating invoices helped us ___ the entire accounting department.',
      options: ['streamline', 'daydream', 'underline'],
      answer: 'streamline',
    },
  },
  {
    id: 'v-spearhead',
    category: 'verb',
    term: 'spearhead',
    partOfSpeech: 'verb',
    ipa: '/ˈspɪr.hed/',
    definitionEn: 'To lead an importanti initiative, project, or campaign from the front.',
    usageEn: 'C1 power verb for resumes and interviews instead of repeating "lead" or "manage".',
    examples: [
      'Elena spearheaded the company’s expansion into Latin America.',
      'Who is spearheading the sustainability initiative this year?',
    ],
    spanish: 'encabezar, liderar (un proyecto o iniciativa)',
    register: 'formal',
    synonyms: ['lead', 'champion', 'pioneer'],
    quiz: {
      sentence: 'He was hired to ___ the new AI research division.',
      options: ['spearhead', 'forehead', 'overhead'],
      answer: 'spearhead',
    },
  },
  {
    id: 'v-skyrocket',
    category: 'verb',
    term: 'skyrocket',
    partOfSpeech: 'verb',
    ipa: '/ˈskaɪˌrɑː.kɪt/',
    definitionEn: 'To rise extremely quickly to a very high level.',
    usageEn: 'Used for prices, demand, popularity, or energy bills: "Sales skyrocketed in December."',
    examples: [
      'Flight prices always skyrocket during the summer holidays.',
      'User engagement skyrocketed after we redesigned the app.',
    ],
    spanish: 'dispararse, subir como la espuma',
    register: 'neutral',
    synonyms: ['soar', 'surge', 'shoot up'],
    quiz: {
      sentence: 'Rent in the city center has ___ over the past two years.',
      options: ['skyrocketed', 'skydived', 'skylighted'],
      answer: 'skyrocketed',
    },
  },
  {
    id: 's-touch-grass',
    category: 'slang',
    term: 'touch grass',
    partOfSpeech: 'slang phrase',
    definitionEn: 'To go outside and disconnect from screens, social media, or obsessive work.',
    usageEn: 'Playful internet/Gen-Z expression: "I’ve been coding for 9 hours, I need to go touch grass."',
    examples: [
      'I’ve been staring at spreadsheets all day—time to go touch grass.',
      'Stop arguing in the comments and go touch some grass!',
    ],
    spanish: 'salir al mundo real, desconectarse de las pantallas',
    register: 'informal',
    region: 'Global',
    synonyms: ['unplug', 'get some fresh air'],
    quiz: {
      sentence: 'You’ve been online since 7 a.m.! Close the laptop and go ___.',
      options: ['touch grass', 'eat leaves', 'kick stones'],
      answer: 'touch grass',
    },
  },
  {
    id: 's-rent-free',
    category: 'slang',
    term: 'live rent-free in my head',
    partOfSpeech: 'slang idiom',
    definitionEn: 'Something you cannot stop thinking about, even when you try.',
    usageEn: 'Used for a catchy song, a funny memory, or an awkward moment.',
    examples: [
      'That song has been living rent-free in my head all week.',
      'The dessert we had in Rome still lives rent-free in my mind.',
    ],
    spanish: 'no poder sacarse algo de la cabeza',
    register: 'informal',
    region: 'US',
    quiz: {
      sentence: 'That chorus is so catchy—it’s living ___ in my head!',
      options: ['rent-free', 'tax-free', 'hands-free'],
      answer: 'rent-free',
    },
  },
  {
    id: 's-game-changer',
    category: 'slang',
    term: 'game-changer',
    partOfSpeech: 'noun',
    ipa: '/ˈɡeɪm ˌtʃeɪn.dʒər/',
    definitionEn: 'A new idea, product, or habit that completely transforms a situation for the better.',
    usageEn: 'Works in both casual and startup/work conversations: "Noise-cancelling headphones are a game-changer."',
    examples: [
      'Getting an espresso machine at home was a total game-changer.',
      'Voice recognition has been a game-changer for language learners.',
    ],
    spanish: 'un antes y un después, cambio revolucionario',
    register: 'neutral',
    synonyms: ['breakthrough', 'turning point'],
    quiz: {
      sentence: 'Working four days a week has been a real ___ for my mental health.',
      options: ['game-changer', 'name-caller', 'time-waster'],
      answer: 'game-changer',
    },
  },
  {
    id: 's-on-point',
    category: 'slang',
    term: 'on point',
    partOfSpeech: 'slang adjective',
    definitionEn: 'Exactly right, impressively good, or perfectly suited to the moment.',
    usageEn: 'Compliment food, style, presentations, or advice: "Your presentation today was on point!"',
    examples: [
      'The tacos at that little place on 5th Street are always on point.',
      'Her analysis of the market was completely on point.',
    ],
    spanish: 'impecable, en su punto, acertadísimo',
    register: 'informal',
    synonyms: ['spot-on', 'flawless'],
    quiz: {
      sentence: 'The coffee at this café is always ___.',
      options: ['on point', 'in line', 'at corner'],
      answer: 'on point',
    },
  },
  {
    id: 'a-seamless',
    category: 'adjective',
    term: 'seamless',
    partOfSpeech: 'adjective',
    ipa: '/ˈsiːm.ləs/',
    definitionEn: 'Happening smoothly and continuously, with no awkward pauses, gaps, or problems.',
    usageEn: 'Top-tier word for technology, travel, and teamwork: "a seamless transition", "a seamless user experience".',
    examples: [
      'Check-in at the airport was surprisingly seamless.',
      'We want the onboarding experience to feel effortless and seamless.',
    ],
    spanish: 'fluido, sin interrupciones, impecable',
    register: 'neutral',
    synonyms: ['smooth', 'effortless', 'flawless'],
    quiz: {
      sentence: 'Switching between my phone and laptop is completely ___.',
      options: ['seamless', 'careless', 'sleepless'],
      answer: 'seamless',
    },
  },
  {
    id: 'a-compelling',
    category: 'adjective',
    term: 'compelling',
    partOfSpeech: 'adjective',
    ipa: '/kəmˈpel.ɪŋ/',
    definitionEn: 'Very persuasive, convincing, or holding your attention because it is so interesting.',
    usageEn: 'C1 upgrade for "very interesting" or "very convincing": "a compelling argument", "a compelling story".',
    examples: [
      'She made a compelling case for expanding the engineering team.',
      'The documentary was so compelling that I watched it twice.',
    ],
    spanish: 'convincente, cautivador, de gran peso',
    register: 'formal',
    synonyms: ['convincing', 'persuasive', 'gripping'],
    quiz: {
      sentence: 'There is ___ evidence that sleeping well improves memory.',
      options: ['compelling', 'complaining', 'competing'],
      answer: 'compelling',
    },
  },
  {
    id: 'a-far-fetched',
    category: 'adjective',
    term: 'far-fetched',
    partOfSpeech: 'adjective',
    ipa: '/ˌfɑːrˈfetʃt/',
    definitionEn: 'Unlikely to be true; difficult to believe.',
    usageEn: 'Use it for excuses, movie plots, or predictions that sound unrealistic.',
    examples: [
      'His excuse about the dog eating his passport sounded a bit far-fetched.',
      'Ten years ago, talking to an AI tutor seemed far-fetched.',
    ],
    spanish: 'descabellado, inverosímil, poco creíble',
    register: 'neutral',
    synonyms: ['unlikely', 'implausible'],
    quiz: {
      sentence: 'The movie was fun, even though the plot was a little ___.',
      options: ['far-fetched', 'well-known', 'short-lived'],
      answer: 'far-fetched',
    },
  },
  {
    id: 'a-candid',
    category: 'adjective',
    term: 'candid',
    partOfSpeech: 'adjective (false friend!)',
    ipa: '/ˈkæn.dɪd/',
    definitionEn: 'Honest and truthful, even about difficult or uncomfortable subjects.',
    usageEn: 'False friend alert! "Candid" in English does NOT mean "naive/innocent" (cándido). It means "franco, sincero, directo".',
    examples: [
      'Thank you for your candid feedback during the review.',
      'To be completely candid with you, the timeline is unrealistic.',
    ],
    spanish: 'franco, sincero, honesto (≠ ingenuo/cándido)',
    register: 'formal',
    watchOutEs: 'Falso amigo: "candid" = sincero/directo. Para "cándido/ingenuo" se dice "naive".',
    synonyms: ['frank', 'forthright', 'honest'],
    quiz: {
      sentence: 'We had a very ___ conversation about what went wrong.',
      options: ['candid', 'candy', 'candle'],
      answer: 'candid',
    },
  },
  {
    id: 'i-cut-corners',
    category: 'idiom',
    term: 'cut corners',
    partOfSpeech: 'idiom',
    definitionEn: 'To do something in the easiest, cheapest, or fastest way by skipping important steps, hurting quality.',
    usageEn: 'Common in business and engineering: "We never cut corners on security."',
    examples: [
      'If you cut corners on the foundation, the building won’t last.',
      'They tried to cut corners to save money, and it backfired.',
    ],
    spanish: 'tomar atajos chapuceros, escatimar en calidad',
    register: 'neutral',
    quiz: {
      sentence: 'When it comes to customer safety, we cannot afford to ___.',
      options: ['cut corners', 'cut the cheese', 'square the circle'],
      answer: 'cut corners',
    },
  },
  {
    id: 'i-same-page',
    category: 'idiom',
    term: 'on the same page',
    partOfSpeech: 'idiom',
    definitionEn: 'Understanding a situation in the same way and agreeing on the plan.',
    usageEn: 'A staple of meetings and teamwork: "Let\'s have a quick call to make sure we\'re on the same page."',
    examples: [
      'Before we email the client, let’s make sure we’re all on the same page.',
      'Are we on the same page about the launch date?',
    ],
    spanish: 'estar en sintonía, estar de acuerdo en el plan',
    register: 'neutral',
    quiz: {
      sentence: 'Let’s review the checklist so the whole team is ___.',
      options: ['on the same page', 'in the same book', 'under the same roof'],
      answer: 'on the same page',
    },
  },
  {
    id: 'i-play-it-by-ear',
    category: 'idiom',
    term: 'play it by ear',
    partOfSpeech: 'idiom',
    definitionEn: 'To decide what to do as a situation develops, rather than making a strict plan in advance.',
    usageEn: 'Very natural for weekend plans or uncertain schedules: "We don\'t have reservations, let\'s just play it by ear."',
    examples: [
      'I’m not sure what time my flight lands, so let’s play it by ear.',
      'If it rains on Saturday, we’ll just play it by ear.',
    ],
    spanish: 'improvisar sobre la marcha, ir viendo cómo se da',
    register: 'neutral',
    quiz: {
      sentence: 'We haven’t booked any tours yet—we’re going to ___.',
      options: ['play it by ear', 'listen by eye', 'sing by heart'],
      answer: 'play it by ear',
    },
  },
  {
    id: 'i-blessing-in-disguise',
    category: 'idiom',
    term: 'a blessing in disguise',
    partOfSpeech: 'idiom',
    definitionEn: 'Something that seems bad or unlucky at first, but results in something good later on.',
    usageEn: 'Great for storytelling and reflections: "Missing that flight turned out to be a blessing in disguise."',
    examples: [
      'Losing that boring job was a blessing in disguise—it pushed me to start my own studio.',
      'The rain was a blessing in disguise because we discovered a wonderful museum.',
    ],
    spanish: 'no hay mal que por bien no venga, una bendición disfrazada',
    register: 'neutral',
    quiz: {
      sentence: 'Getting rejected from that role turned out to be ___.',
      options: ['a blessing in disguise', 'a storm in a teacup', 'a drop in the ocean'],
      answer: 'a blessing in disguise',
    },
  },
  {
    id: 'w-sensible',
    category: 'vocabulary',
    term: 'sensible (vs. sensitive)',
    partOfSpeech: 'adjective (false friend!)',
    ipa: '/ˈsen.sə.bəl/',
    definitionEn: 'Based on good judgment and practical ideas; reasonable.',
    usageEn: '"Sensible" means "sensato / prudente". If someone feels emotions deeply or gets hurt easily ("sensible" in Spanish), use "sensitive".',
    examples: [
      'Wearing comfortable shoes for a 10 km walk is a sensible decision.',
      'He is very sensitive to criticism. (= sensible emocionalmente)',
    ],
    spanish: 'sensato, prudente, razonable (≠ sensible)',
    register: 'neutral',
    watchOutEs: 'Falso amigo: "sensible" en español = "sensitive". "Sensato" = "sensible".',
    quiz: {
      sentence: 'Saving 20% of your income is a very ___ financial habit.',
      options: ['sensible', 'sensitive', 'sensory'],
      answer: 'sensible',
    },
  },
  {
    id: 'w-compromise',
    category: 'vocabulary',
    term: 'compromise (vs. commitment)',
    partOfSpeech: 'noun / verb (false friend!)',
    ipa: '/ˈkɑːm.prə.maɪz/',
    definitionEn: 'An agreement in an argument in which both sides give up something they wanted.',
    usageEn: 'In English, "compromise" is a mutual concession ("ceder de parte y parte"). For "compromiso / dedicación / obligación", use "commitment".',
    examples: [
      'After hours of negotiation, both teams reached a fair compromise.',
      'Thank you for your commitment to the project. (= compromiso/dedicación)',
    ],
    spanish: 'acuerdo mutuo / punto medio (≠ compromiso de lealtad)',
    register: 'neutral',
    watchOutEs: '"Tener compromiso con el equipo" = "have commitment to the team", no "compromise".',
    quiz: {
      sentence: 'Neither side got 100% of what they wanted, but they reached a good ___.',
      options: ['compromise', 'commitment', 'compliment'],
      answer: 'compromise',
    },
  },
  {
    id: 'w-trade-off',
    category: 'vocabulary',
    term: 'trade-off',
    partOfSpeech: 'noun',
    ipa: '/ˈtreɪd.ɑːf/',
    definitionEn: 'A balance achieved between two desirable but incompatible features; a compromise.',
    usageEn: 'Essential B2/C1/C2 word for analyzing pros and cons: "There is always a trade-off between speed and quality."',
    examples: [
      'Living outside the city is cheaper, but the trade-off is a longer commute.',
      'Every engineering decision involves a trade-off between cost and speed.',
    ],
    spanish: 'contrapartida, equilibrio de pros y contras, sacrificio a cambio de algo',
    register: 'neutral',
    synonyms: ['balance', 'compromise'],
    quiz: {
      sentence: 'There is a clear ___ between battery life and screen brightness.',
      options: ['trade-off', 'take-off', 'spin-off'],
      answer: 'trade-off',
    },
  },
  {
    id: 'w-bottleneck',
    category: 'vocabulary',
    term: 'bottleneck',
    partOfSpeech: 'noun',
    ipa: '/ˈbɑː.təl.nek/',
    definitionEn: 'A point of congestion or delay that slows down an entire process or project.',
    usageEn: 'Used in operations, tech, and traffic: "The legal review has become the main bottleneck."',
    examples: [
      'We identified the approval stage as the biggest bottleneck in our workflow.',
      'Hiring another designer will remove the bottleneck before launch.',
    ],
    spanish: 'cuello de botella, punto de atasco',
    register: 'neutral',
    quiz: {
      sentence: 'Waiting for manual sign-offs is the main ___ slowing down our release.',
      options: ['bottleneck', 'turtleneck', 'paperback'],
      answer: 'bottleneck',
    },
  },
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayNumberFromKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000);
}

export function getItemsByCategory(category: DailyCategory): DailyItem[] {
  return DAILY_ITEMS.filter((item) => item.category === category);
}

export interface DailyDrop {
  dateKey: string;
  featured: DailyItem;
  items: DailyItem[];
}

/**
 * Selección determinista por fecha local: un elemento por categoría y una
 * categoría destacada que rota cada día. Mismo día ⇒ misma selección.
 */
const CEFR_ORDER: PracticeLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

/** Ítems útiles para un nivel: los generales + los de ese nivel y los adyacentes (±1). */
function poolForLevel(category: DailyCategory, level?: PracticeLevel): DailyItem[] {
  const all = getItemsByCategory(category);
  if (!level) return all.filter((item) => !item.level);
  const i = CEFR_ORDER.indexOf(level);
  const near = new Set(CEFR_ORDER.slice(Math.max(0, i - 1), i + 2));
  // B1+: la app va en inglés, así que no se mezclan ítems A1–A2 (traen explicaciones en español).
  if (uiLanguageFor(level) === 'en') {
    near.delete('A1');
    near.delete('A2');
  }
  const pool = all.filter((item) => !item.level || near.has(item.level));
  return pool.length ? pool : all;
}

/** Todos los ítems útiles para un nivel (todas las categorías), para minijuegos y repasos. */
export function getItemsForLevel(level?: PracticeLevel): DailyItem[] {
  return DAILY_CATEGORIES.flatMap((category) => poolForLevel(category, level));
}

export function getDailyDrop(dateKey: string = localDateKey(), level?: PracticeLevel): DailyDrop {
  const day = dayNumberFromKey(dateKey);
  const items = DAILY_CATEGORIES.map((category, idx) => {
    const pool = poolForLevel(category, level);
    const offset = hashString(category) % pool.length;
    return pool[(day + offset + idx) % pool.length]!;
  });
  const featured = items[day % items.length]!;
  return { dateKey, featured, items };
}

export function findDailyItem(id: string): DailyItem | undefined {
  return DAILY_ITEMS.find((item) => item.id === id);
}

// Contenido del Banco de Aprendizaje Experiencial (BancodeVocabulario.txt), ver experience-bank.ts.
DAILY_ITEMS.push(...EXPERIENCE_DAILY_ITEMS.filter((item) => !DAILY_ITEMS.some((d) => d.term.toLowerCase() === item.term.toLowerCase())));
