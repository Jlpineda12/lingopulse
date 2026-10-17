import type { PracticeLevel } from './types.js';

export interface CefrLevelInfo {
  id: PracticeLevel;
  titleEs: string;
  badgeEs: string;
  summaryEs: string;
  canDoEs: string[];
  color: string;
}

export const CEFR_LEVELS: PracticeLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export const CEFR_LEVEL_META: Record<PracticeLevel, CefrLevelInfo> = {
  A1: {
    id: 'A1',
    titleEs: 'A1 · Despegue',
    badgeEs: 'Principiante',
    summaryEs: 'Frases esenciales, saludos, pedir en restaurantes, precios y rutinas básicas.',
    canDoEs: [
      'Presentarte, deletrear tu nombre y pedir comida o café.',
      'Entender indicaciones simples, horarios y precios.',
      'Hablar de tu rutina diaria en presente.',
    ],
    color: '#34C759',
  },
  A2: {
    id: 'A2',
    titleEs: 'A2 · Cotidiano',
    badgeEs: 'Básico activo',
    summaryEs: 'Conversaciones del día a día, contar experiencias pasadas, compras y viajes.',
    canDoEs: [
      'Contar qué hiciste el fin de semana o en tu último viaje.',
      'Resolver situaciones en aeropuertos, hoteles y tiendas.',
      'Escribir mensajes cortos e invitaciones naturales.',
    ],
    color: '#007AFF',
  },
  B1: {
    id: 'B1',
    titleEs: 'B1 · Independiente',
    badgeEs: 'Intermedio',
    summaryEs: 'Desenvolverte en el trabajo, explicar planes, dar opiniones y usar phrasal verbs clave.',
    canDoEs: [
      'Participar en reuniones de trabajo y reprogramar entregas.',
      'Explicar ventajas, desventajas y justificar tu opinión.',
      'Mantener conversaciones sin traducir palabra por palabra.',
    ],
    color: '#FF9500',
  },
  B2: {
    id: 'B2',
    titleEs: 'B2 · Fluidez Profesional',
    badgeEs: 'Intermedio alto',
    summaryEs: 'Argumentar con soltura, negociar acuerdos, detectar matices y hablar con ritmo natural.',
    canDoEs: [
      'Defender tu postura en debates o entrevistas laborales exigentes.',
      'Negociar plazos, salarios y alternativas bajo presión.',
      'Usar conectores avanzados y modismos sin sonar robótico.',
    ],
    color: '#AF52DE',
  },
  C1: {
    id: 'C1',
    titleEs: 'C1 · Dominio Avanzado',
    badgeEs: 'Avanzado',
    summaryEs: 'Inglés ejecutivo y académico: precisión léxica, ironía, diplomacia e improvisación.',
    canDoEs: [
      'Liderar presentaciones ejecutivas y responder preguntas difíciles.',
      'Adaptar el registro entre jerga casual y diplomacia corporativa.',
      'Expresar matices sutiles sin buscar palabras.',
    ],
    color: '#FF2D55',
  },
  C2: {
    id: 'C2',
    titleEs: 'C2 · Maestría Nativa',
    badgeEs: 'Maestría bilingüe',
    summaryEs: 'Nivel cercano al nativo culto: retórica persuasiva, sutileza estilística y fluidez total.',
    canDoEs: [
      'Debatir temas complejos filosóficos, técnicos o estratégicos al instante.',
      'Dominar inversiones gramaticales, colocaciones avanzadas y humor sutil.',
      'Reformular ideas complejas con elegancia ejecutiva.',
    ],
    color: '#B8924A',
  },
};

export type PlacementSkillTag =
  | 'grammar'
  | 'listening'
  | 'vocabulary'
  | 'pragmatics'
  | 'spanglish_trap';

export interface PlacementQuestion {
  id: string;
  level: PracticeLevel;
  weight: number;
  skill: PlacementSkillTag;
  skillLabelEs: string;
  promptEs: string;
  /** Si existe, el usuario puede escuchar este audio en inglés para responder. */
  audioTextEn?: string;
  questionEn: string;
  options: string[];
  answerIndex: number;
  explanationEs: string;
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  {
    id: 'pl-a1-1',
    level: 'A1',
    weight: 1,
    skill: 'spanglish_trap',
    skillLabelEs: 'Gramática esencial',
    promptEs: '¿Cuál es la forma correcta de decir tu edad y ocupación en inglés?',
    questionEn: 'Hi! My name is Mateo. ___ 26 years old and I work ___ a designer.',
    options: [
      'I have / like',
      'I am / as',
      'I am / how',
      'I have / as',
    ],
    answerIndex: 1,
    explanationEs: 'En inglés la edad se expresa con el verbo "to be" ("I am 26") y la profesión con "work as" ("trabajo como").',
  },
  {
    id: 'pl-a1-2',
    level: 'A1',
    weight: 1,
    skill: 'listening',
    skillLabelEs: 'Comprensión auditiva A1',
    promptEs: 'Escucha al barista y elige qué te está preguntando:',
    audioTextEn: 'Good morning! Would you like your iced latte for here or to go?',
    questionEn: 'What is the barista asking you?',
    options: [
      'Si quieres pagar con tarjeta o efectivo.',
      'Si vas a tomar tu bebida en el local o para llevar.',
      'Si prefieres leche de almendras o entera.',
      'A qué hora cierra la cafetería hoy.',
    ],
    answerIndex: 1,
    explanationEs: '"For here or to go?" es la frase estándar para preguntar si consumes en el lugar o para llevar.',
  },
  {
    id: 'pl-a2-1',
    level: 'A2',
    weight: 2,
    skill: 'grammar',
    skillLabelEs: 'Pasado simple',
    promptEs: 'Completa la anécdota de viaje sin caer en el error típico con "didn\'t":',
    questionEn: 'We ___ to the museum yesterday because we didn’t ___ enough time.',
    options: [
      'didn’t went / had',
      'didn’t go / have',
      'don’t go / had',
      'weren’t go / have',
    ],
    answerIndex: 1,
    explanationEs: 'Después del auxiliar "didn’t" el verbo siempre va en su forma base ("didn’t go", "didn’t have").',
  },
  {
    id: 'pl-a2-2',
    level: 'A2',
    weight: 2,
    skill: 'listening',
    skillLabelEs: 'Comprensión auditiva A2',
    promptEs: 'Escucha el anuncio del aeropuerto y responde:',
    audioTextEn: 'Attention passengers on flight BA 402 to London: your boarding gate has changed from Gate 12 to Gate 28B, and boarding will begin in twenty minutes.',
    questionEn: 'Where should passengers go now?',
    options: [
      'Gate 12 immediately',
      'Gate 28B in 20 minutes',
      'Gate 402 in 12 minutes',
      'Customer service desk',
    ],
    answerIndex: 1,
    explanationEs: 'El anuncio indica que la puerta cambió de la 12 a la 28B y el embarque inicia en 20 minutos.',
  },
  {
    id: 'pl-b1-1',
    level: 'B1',
    weight: 3,
    skill: 'vocabulary',
    skillLabelEs: 'Phrasal Verbs en el trabajo',
    promptEs: 'Tu equipo aún no tiene las cifras listas. ¿Qué frase expresa "posponer la reunión hasta el jueves"?',
    questionEn: 'Since the financial report isn’t ready yet, could we ___ the meeting until Thursday?',
    options: [
      'call off',
      'put off',
      'turn down',
      'look after',
    ],
    answerIndex: 1,
    explanationEs: '"Put off" significa posponer para más adelante. "Call off" significa cancelar definitivamente.',
  },
  {
    id: 'pl-b1-2',
    level: 'B1',
    weight: 3,
    skill: 'spanglish_trap',
    skillLabelEs: 'Trampa de Falso Amigo',
    promptEs: 'Quieres decir: "Actualmente vivo en Madrid, pero asistiré a la conferencia en Londres".',
    questionEn: 'Choose the sentence that sounds 100% natural in English:',
    options: [
      'Actually I live in Madrid, but I will assist to the conference in London.',
      'Currently I live in Madrid, and I’ll attend the conference in London.',
      'Actually I am living in Madrid, and I will attend to the conference in London.',
      'Presently I live in Madrid, but I assist the conference in London.',
    ],
    answerIndex: 1,
    explanationEs: '"Currently" = actualmente ("actually" significa "de hecho/en realidad"). "Attend" = asistir a un evento (sin "to"), mientras que "assist" es ayudar.',
  },
  {
    id: 'pl-b2-1',
    level: 'B2',
    weight: 4,
    skill: 'grammar',
    skillLabelEs: 'Condicionales y estructuras B2',
    promptEs: 'Completa esta frase profesional usando la preposición y forma verbal correctas:',
    questionEn: 'Had I known about the traffic jam earlier, I ___ an earlier train. Anyway, I look forward to ___ your proposal.',
    options: [
      'would take / review',
      'would have taken / reviewing',
      'had taken / review',
      'would have took / reviewing',
    ],
    answerIndex: 1,
    explanationEs: 'Tercer condicional invertido ("Had I known..., I would have taken") + "look forward to" seguido de gerundio (-ing: "reviewing").',
  },
  {
    id: 'pl-b2-2',
    level: 'B2',
    weight: 4,
    skill: 'listening',
    skillLabelEs: 'Comprensión auditiva B2',
    promptEs: 'Escucha a una gerente hablando en una negociación:',
    audioTextEn: 'While we really appreciate your team’s proposal, the current pricing is quite a stretch for our Q3 budget. Unless we can phase the rollout over two quarters, we’ll have to hold off for now.',
    questionEn: 'What condition is the manager proposing to move forward?',
    options: [
      'Cancelar el proyecto definitivamente porque no les gusta el producto.',
      'Dividir la implementación en dos trimestres para ajustarse al presupuesto.',
      'Duplicar el presupuesto del tercer trimestre inmediatamente.',
      'Contratar a otro proveedor más barato hoy mismo.',
    ],
    answerIndex: 1,
    explanationEs: '"Phase the rollout over two quarters" significa dividir el lanzamiento en dos trimestres; de lo contrario tendrán que esperar ("hold off").',
  },
  {
    id: 'pl-c1-1',
    level: 'C1',
    weight: 5,
    skill: 'pragmatics',
    skillLabelEs: 'Registro ejecutivo y diplomacia C1',
    promptEs: 'En una junta directiva quieres discrepar con tu director sin sonar agresivo. ¿Cuál opción tiene el registro C1 más natural?',
    questionEn: 'Which response expresses polite, high-level executive pushback?',
    options: [
      'You are wrong about the timeline because engineering cannot do that.',
      'I see where you’re coming from, though I’d be remiss not to flag the bandwidth constraints on the engineering side.',
      'I am not agree with your timeline, we must change it right now.',
      'With respect, your idea is impossible for our team this month.',
    ],
    answerIndex: 1,
    explanationEs: '"I see where you’re coming from, though I’d be remiss not to flag..." valida al interlocutor y señala el riesgo con elegancia ejecutiva.',
  },
  {
    id: 'pl-c1-2',
    level: 'C1',
    weight: 5,
    skill: 'grammar',
    skillLabelEs: 'Inversión enfática C1/C2',
    promptEs: 'Completa la oración con estructura formal de inversión negativa:',
    questionEn: 'Not only ___ the quarterly targets, but the team also spearheaded two new product lines.',
    options: [
      'we exceeded',
      'did we exceed',
      'we did exceed',
      'exceeded we',
    ],
    answerIndex: 1,
    explanationEs: 'Cuando una oración comienza con una expresión restrictiva/negativa como "Not only", se invierte el auxiliar como en una pregunta: "Not only did we exceed...".',
  },
  {
    id: 'pl-c2-1',
    level: 'C2',
    weight: 6,
    skill: 'vocabulary',
    skillLabelEs: 'Precisión léxica y matices C2',
    promptEs: 'Elige la palabra precisa para describir una explicación que suena convincente superficialmente pero carece de validez real:',
    questionEn: 'His argument was rhetorically dazzling, yet upon closer scrutiny it proved entirely ___—plausible on the surface, but fundamentally flawed.',
    options: [
      'specious',
      'ubiquitous',
      'fastidious',
      'magnanimous',
    ],
    answerIndex: 0,
    explanationEs: '"Specious" describe un argumento que parece verdadero o plausible a primera vista pero es engañoso o falaz.',
  },
  {
    id: 'pl-c2-2',
    level: 'C2',
    weight: 6,
    skill: 'listening',
    skillLabelEs: 'Comprensión de matices C2',
    promptEs: 'Escucha este comentario editorial y deduce la postura real del hablante:',
    audioTextEn: 'To suggest that the policy was a qualified success is charitable to a fault; if anything, it merely papered over systemic cracks that are bound to resurface.',
    questionEn: 'What is the speaker actually implying about the policy?',
    options: [
      'Fue un éxito rotundo que resolvió los problemas de raíz.',
      'Llamarlo éxito es demasiado generoso: solo ocultó temporalmente fallas profundas.',
      'Fue una política caritativa financiada por donaciones privadas.',
      'Necesita pequeños ajustes de papelería administrativa.',
    ],
    answerIndex: 1,
    explanationEs: '"Charitable to a fault" y "papered over systemic cracks" indican que la política solo maquilló defectos estructurales que volverán a aparecer.',
  },
];

export interface PlacementResult {
  deducedLevel: PracticeLevel;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  strengthsEs: string[];
  focusAreasEs: string[];
  summaryEs: string;
}

export function scorePlacementTest(answers: Record<string, number>): PlacementResult {
  let earnedWeight = 0;
  let totalWeight = 0;
  let correctCount = 0;

  const skillStats: Record<PlacementSkillTag, { right: number; total: number; label: string }> = {
    grammar: { right: 0, total: 0, label: 'Estructuras gramaticales' },
    listening: { right: 0, total: 0, label: 'Comprensión auditiva (Listening)' },
    vocabulary: { right: 0, total: 0, label: 'Phrasal verbs y precisión léxica' },
    pragmatics: { right: 0, total: 0, label: 'Tono y diplomacia profesional' },
    spanglish_trap: { right: 0, total: 0, label: 'Detección de falsos amigos (Spanglish)' },
  };

  for (const q of PLACEMENT_QUESTIONS) {
    totalWeight += q.weight;
    skillStats[q.skill].total += 1;
    const picked = answers[q.id];
    if (picked === q.answerIndex) {
      earnedWeight += q.weight;
      correctCount += 1;
      skillStats[q.skill].right += 1;
    }
  }

  const ratio = totalWeight > 0 ? earnedWeight / totalWeight : 0;
  const scorePercent = Math.round(ratio * 100);

  let deducedLevel: PracticeLevel = 'A1';
  if (scorePercent >= 90) deducedLevel = 'C2';
  else if (scorePercent >= 74) deducedLevel = 'C1';
  else if (scorePercent >= 56) deducedLevel = 'B2';
  else if (scorePercent >= 36) deducedLevel = 'B1';
  else if (scorePercent >= 18) deducedLevel = 'A2';
  else deducedLevel = 'A1';

  const strengthsEs: string[] = [];
  const focusAreasEs: string[] = [];

  for (const stat of Object.values(skillStats)) {
    if (stat.total === 0) continue;
    const r = stat.right / stat.total;
    if (r >= 0.65) strengthsEs.push(stat.label);
    else focusAreasEs.push(stat.label);
  }

  if (strengthsEs.length === 0) {
    strengthsEs.push('Intuición comunicativa inicial');
  }
  if (focusAreasEs.length === 0) {
    focusAreasEs.push('Retos de elocuencia ejecutiva C2 y matices nativos');
  }

  const meta = CEFR_LEVEL_META[deducedLevel];
  const summaryEs = `Obtuviste ${correctCount}/${PLACEMENT_QUESTIONS.length} aciertos (${scorePercent}% ponderado). Tu perfil corresponde a ${meta.titleEs}: ${meta.summaryEs}`;

  return {
    deducedLevel,
    scorePercent,
    correctCount,
    totalQuestions: PLACEMENT_QUESTIONS.length,
    strengthsEs,
    focusAreasEs,
    summaryEs,
  };
}

/* ------------------------------------------------------------------ */
/* INNOVACIÓN 1: CAZADOR DE SPANGLISH & FALSE FRIENDS (60s RADAR)     */
/* ------------------------------------------------------------------ */

export interface SpanglishTrap {
  id: string;
  level: PracticeLevel;
  spanglishSentence: string;
  trapWord: string;
  naturalSentence: string;
  naturalReplacement: string;
  options: string[];
  answerIndex: number;
  whyEs: string;
}

export const SPANGLISH_TRAPS: SpanglishTrap[] = [
  {
    id: 'trap-1',
    level: 'A1',
    spanglishSentence: 'I have 28 years old and I live in Bogotá.',
    trapWord: 'have 28 years old',
    naturalSentence: 'I am 28 years old and I live in Bogotá.',
    naturalReplacement: 'am 28 years old',
    options: ['I am 28 years old', 'I have 28 years', 'I counts 28 years'],
    answerIndex: 0,
    whyEs: 'En inglés la edad es un estado ("I am 28"), nunca una posesión con "have".',
  },
  {
    id: 'trap-2',
    level: 'A2',
    spanglishSentence: 'Can you explain me how this app works?',
    trapWord: 'explain me',
    naturalSentence: 'Can you explain to me how this app works?',
    naturalReplacement: 'explain to me',
    options: ['explain to me', 'explain at me', 'tell to me'],
    answerIndex: 0,
    whyEs: 'El verbo "explain" SIEMPRE requiere "to" antes de la persona ("explain to me / to her").',
  },
  {
    id: 'trap-3',
    level: 'A2',
    spanglishSentence: 'Yes, I am totally agree with your idea!',
    trapWord: 'am totally agree',
    naturalSentence: 'Yes, I totally agree with your idea!',
    naturalReplacement: 'totally agree',
    options: ['I totally agree', 'I am agree', 'I have agreement'],
    answerIndex: 0,
    whyEs: '"Agree" ya es un verbo ("estar de acuerdo"), por lo que poner "I am agree" duplica el verbo.',
  },
  {
    id: 'trap-4',
    level: 'B1',
    spanglishSentence: 'Actually, I am working on two different projects this month.',
    trapWord: 'Actually (para decir "actualmente")',
    naturalSentence: 'Currently, I am working on two different projects this month.',
    naturalReplacement: 'Currently / Right now',
    options: ['Currently', 'Actually', 'Eventually'],
    answerIndex: 0,
    whyEs: 'Falso amigo clásico: "Actually" significa "en realidad / de hecho". Para decir "actualmente", usa "Currently" o "Right now".',
  },
  {
    id: 'trap-5',
    level: 'B1',
    spanglishSentence: 'We need to discuss about the budget before Friday.',
    trapWord: 'discuss about',
    naturalSentence: 'We need to discuss the budget before Friday.',
    naturalReplacement: 'discuss the budget',
    options: ['discuss the budget', 'discuss about of the budget', 'discuss on the budget'],
    answerIndex: 0,
    whyEs: '"Discuss" nunca lleva "about". O dices "discuss the budget" o dices "talk about the budget".',
  },
  {
    id: 'trap-6',
    level: 'B1',
    spanglishSentence: 'More than 200 people assisted to the technology conference.',
    trapWord: 'assisted to',
    naturalSentence: 'More than 200 people attended the technology conference.',
    naturalReplacement: 'attended',
    options: ['attended', 'assisted to', 'went at'],
    answerIndex: 0,
    whyEs: '"Assist" significa "ayudar/asistir a alguien". Para "asistir a un lugar o evento", se usa "attend" (sin "to").',
  },
  {
    id: 'trap-7',
    level: 'B2',
    spanglishSentence: 'Don’t criticize him too hard, he is very sensible.',
    trapWord: 'sensible (para decir "sensible")',
    naturalSentence: 'Don’t criticize him too hard, he is very sensitive.',
    naturalReplacement: 'sensitive',
    options: ['sensitive', 'sensible', 'sentimentalist'],
    answerIndex: 0,
    whyEs: 'Falso amigo: "Sensible" en inglés significa "sensato/razonable". Para emociones ("sensible"), la palabra es "sensitive".',
  },
  {
    id: 'trap-8',
    level: 'B2',
    spanglishSentence: 'I look forward to meet your team next week.',
    trapWord: 'to meet',
    naturalSentence: 'I look forward to meeting your team next week.',
    naturalReplacement: 'to meeting',
    options: ['to meeting', 'to meet', 'for meeting'],
    answerIndex: 0,
    whyEs: 'En "look forward to", la palabra "to" es una preposición, por lo que el verbo siguiente va con "-ing" ("meeting").',
  },
  {
    id: 'trap-9',
    level: 'B2',
    spanglishSentence: 'Eventually, you can call support if the screen freezes, or just restart it.',
    trapWord: 'Eventually (para decir "eventualmente / si acaso")',
    naturalSentence: 'If necessary, you can call support if the screen freezes, or just restart it.',
    naturalReplacement: 'If necessary / Potentially',
    options: ['If necessary', 'Eventually', 'Casually'],
    answerIndex: 0,
    whyEs: '"Eventually" significa "al final / tarde o temprano (después de mucho tiempo)", NO "posiblemente / en caso necesario".',
  },
  {
    id: 'trap-10',
    level: 'C1',
    spanglishSentence: 'Thank you for your compromise with our company’s mission.',
    trapWord: 'compromise (para decir "compromiso/dedicación")',
    naturalSentence: 'Thank you for your commitment to our company’s mission.',
    naturalReplacement: 'commitment to',
    options: ['commitment to', 'compromise with', 'obligation in'],
    answerIndex: 0,
    whyEs: '"Compromise" significa "concesión mutua / acuerdo donde ambos ceden" (o poner en riesgo). Para "compromiso/lealtad", usa "commitment".',
  },
];

/* ------------------------------------------------------------------ */
/* INNOVACIÓN 2: MISIONES RÁPIDAS DE ROLEPLAY POR NIVEL (A1 a C2)     */
/* ------------------------------------------------------------------ */

export interface QuickRoleplayMission {
  id: string;
  level: PracticeLevel;
  emoji: string;
  title: string;
  rolePersona: string;
  scenarioEs: string;
  openingLineEn: string;
  twistLineEn: string;
  closingLineEn: string;
  targetPhrases: string[];
}

export const QUICK_ROLEPLAY_MISSIONS: QuickRoleplayMission[] = [
  {
    id: 'rp-a1-coffee',
    level: 'A1',
    emoji: '☕',
    title: 'Specialty Coffee Order',
    rolePersona: 'Maya · Barista en Seattle',
    scenarioEs: 'Pide un café frío, pregunta qué leche vegetal tienen y pide un croissant para llevar.',
    openingLineEn: 'Hey there! Welcome to Pulse Roasters. What can I get started for you today?',
    twistLineEn: 'Oh, we actually just ran out of almond milk! We have oat milk or regular milk—which one works for you, and is that for here or to go?',
    closingLineEn: 'Awesome! One oat iced latte and a warm croissant to go. That’ll be ready at the end of the counter!',
    targetPhrases: ['Could I get', 'oat milk', 'to go', 'please'],
  },
  {
    id: 'rp-a2-immigration',
    level: 'A2',
    emoji: '🛂',
    title: 'Airport Border Control',
    rolePersona: 'Officer Miller · Heathrow Airport',
    scenarioEs: 'Explica el motivo de tu viaje, cuántos días te quedas y dónde te vas a hospedar.',
    openingLineEn: 'Good afternoon. Passport, please. What is the purpose of your visit to the United Kingdom, and how long will you be staying?',
    twistLineEn: 'I see. Do you have your hotel reservation address and a return ticket confirmed? What places are you planning to visit?',
    closingLineEn: 'Thank you. Everything looks in order. Enjoy your stay in London!',
    targetPhrases: ['on vacation', 'staying for', 'return ticket', 'looking forward to'],
  },
  {
    id: 'rp-b1-deadline',
    level: 'B1',
    emoji: '📅',
    title: 'Postponing a Client Demo',
    rolePersona: 'Hannah · Product Director',
    scenarioEs: 'Pospón la demo del cliente para el jueves porque falta validar un dato clave.',
    openingLineEn: 'Hi! Are we still on track for the client demo tomorrow morning, or do we need to adjust the plan?',
    twistLineEn: 'Wait—if we push it back, the client might worry about the launch date. How can we reassure them and what exact time on Thursday do you propose?',
    closingLineEn: 'Fair enough. Putting it off until Thursday afternoon with a preview deck tomorrow sounds like a solid plan.',
    targetPhrases: ['put off', 'figure out', 'make sure', 'by Thursday'],
  },
  {
    id: 'rp-b2-salary',
    level: 'B2',
    emoji: '💼',
    title: 'Salary & Remote Work Negotiation',
    rolePersona: 'David · VP of Engineering',
    scenarioEs: 'Negocia un ajuste del 12% sobre la oferta inicial o dos días adicionales de trabajo remoto.',
    openingLineEn: 'We’re thrilled to offer you the Senior role! Based on our standard band, we’ve set the base offer at $85,000. How does that sound to you?',
    twistLineEn: 'Our cash budget for this quarter is fairly tight. If we can only move halfway on the base salary, what flexibility on remote work or signing bonus would make this a win-win?',
    closingLineEn: 'You make a compelling case given your track record. Let me take this package to HR so we can lock it in today.',
    targetPhrases: ['track record', 'meet halfway', 'flexibility', 'value I bring'],
  },
  {
    id: 'rp-c1-pitch',
    level: 'C1',
    emoji: '🚀',
    title: 'Venture Capital 60s Pitch',
    rolePersona: 'Elena · Sequoia Partner',
    scenarioEs: 'Defiende la ventaja competitiva de tu startup frente a gigantes tecnológicos.',
    openingLineEn: 'Your traction is impressive, but what stops a tech giant from building this exact feature in six months and squeezing your margins?',
    twistLineEn: 'Proprietary data is a good start, yet enterprise sales cycles are notoriously slow. How are you mitigating burn rate while scaling upmarket?',
    closingLineEn: 'That’s a remarkably well-thought-out moat. Let’s schedule a deep-dive with the rest of the partnership on Monday.',
    targetPhrases: ['competitive moat', 'switching costs', 'unit economics', 'sustainable'],
  },
  {
    id: 'rp-c2-crisis',
    level: 'C2',
    emoji: '🎙️',
    title: 'Executive Crisis Briefing',
    rolePersona: 'Marcus · Financial Times Journalist',
    scenarioEs: 'Responde con precisión diplomática sobre una interrupción del servicio sin evadir la responsabilidad.',
    openingLineEn: 'Critics argue today’s outage exposes systemic underinvestment in your core infrastructure. Isn’t your apology merely papering over deeper governance flaws?',
    twistLineEn: 'Transparency is welcome, but institutional investors want concrete safeguards. What structural changes are you instituting to ensure this isn’t a recurring vulnerability?',
    closingLineEn: 'A candid and thorough breakdown. We’ll quote your commitment to independent audits in tomorrow’s edition.',
    targetPhrases: ['accountability', 'root-cause analysis', 'safeguards', 'unequivocally'],
  },
];
