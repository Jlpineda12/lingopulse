import type {
  PublicLessonDTO,
  TrustedLessonConfig,
} from '../types/curriculum.js';
import type { SupportedLocale } from '../types/database.js';

export interface SeededLessonBundle {
  publicLesson: PublicLessonDTO;
  privateArenaConfig: TrustedLessonConfig;
}

const B1_UNIT_ID = '11111111-1111-4111-8111-111111111101';
const B1_UNIT_TITLE = 'Módulo 1: Coordinar planes y resolver imprevistos (Ruta MCER B1)';

export const B1_MODULE_1_LESSONS: Record<SupportedLocale, SeededLessonBundle[]> = {
  'en-GB': [
    {
      publicLesson: {
        id: '33333333-3333-4333-8333-333333333301',
        unitId: B1_UNIT_ID,
        unitTitle: B1_UNIT_TITLE,
        slug: 'b1-m1-s1-put-off',
        version: 1,
        locale: 'en-GB',
        cefrLevel: 'B1',
        title: 'Sesión 1: Posponer sin perder credibilidad',
        realLifeTopic: 'Coordinar reuniones cuando falta quien toma la decisión',
        communicativeGoal:
          'Proponer posponer una reunión y explicar el nuevo plan al equipo',
        grammarFocus:
          'Phrasal verb separable: pronombre objeto antes de la partícula (put it off)',
        position: 1,
        isCheckpoint: false,
        publicContent: {
          anatomy: {
            targetExpression: 'put off',
            senseKey: 'put_off.delay_event.v1',
            meaningEn: 'delay an event or activity until a later time',
            ipa: '/pʊt‿ɪt‿ɒf/',
            dialectTip:
              'En inglés británico (UK), la vocal de "off" es corta y redondeada (/ɒf/). Al decir "put it off", enlaza suavemente las consonantes finales con las vocales.',
            functionalRule:
              'Usa "put off" cuando necesites aplazar una reunión o actividad por un obstáculo concreto. Es un phrasal verb separable: si usas un pronombre ("it" o "them"), va obligatoriamente en medio ("put it off", nunca "put off it").',
            modelSentence:
              'Since Sam is stuck at Heathrow, we should put the review off until Friday morning.',
            modelTranslationEs:
              'Como Sam está retenida en Heathrow, deberíamos posponer la revisión hasta el viernes por la mañana.',
            examples: [
              {
                en: "Let's put the meeting off until Friday.",
                es: 'Pospongamos la reunión hasta el viernes.',
              },
              {
                en: "We can't put it off any longer.",
                es: 'No podemos posponerlo por más tiempo.',
              },
            ],
            reviewTargets: [
              {
                expression: 'run out of',
                meaningEs: 'quedarse sin (tiempo, batería, presupuesto)',
              },
              {
                expression: 'by Friday morning',
                meaningEs: 'a más tardar el viernes por la mañana',
              },
            ],
          },
          input: {
            situationTitle: 'Mensaje urgente antes del comité de producto',
            senderRole: 'Alex · Product Lead (London)',
            microText:
              "Hi team — Sam's train from Manchester has been cancelled and she won't have a stable signal until 4 p.m. Since she has the final sign-off on the Q4 budget, going ahead at 10 a.m. would mean repeating the whole discussion tomorrow. I suggest we move the session to Friday at 11 a.m.",
            comprehensionPrompt:
              'En 1 frase en inglés o español: ¿Por qué no conviene hacer la reunión hoy a las 10 a.m. y qué pasaría si la hacen sin Sam?',
            expectedInferenceKeywords: [
              'sign-off',
              'budget',
              'repeat',
              'repeating',
              'decisión',
              'aprobar',
              'presupuesto',
              'repetir',
              'sam',
            ],
            sampleModelAnswer:
              'Because Sam has the final sign-off on the budget, so holding the meeting without her would force the team to repeat the whole discussion tomorrow.',
          },
          writing: {
            scenarioPrompt:
              'Escríbele un mensaje breve (1–2 frases en inglés) a tu colega Jordan proponiendo posponer la reunión de hoy para el viernes porque Sam no puede conectarse.',
            recipientName: 'Jordan (Project Coordinator, UK)',
            communicativeGoalEs:
              'Proponer aplazar la sesión al viernes y justificar brevemente por qué.',
            grammarChecklistEs:
              'Usa el objetivo de la sesión con un sustantivo o con el pronombre objeto antes de la partícula.',
            placeholderEn:
              'Hi Jordan, since Sam cannot make it today, let’s...',
          },
          voiceArena: {
            interlocutorTitle: 'Jordan — Project Coordinator (London)',
            interlocutorRole: 'Un colega coordinando una reunión importante',
            briefingEs:
              'Sam no puede asistir hoy y es quien toma la decisión final. Habla con Jordan para acordar qué hacer con la reunión y cómo comunicárselo al equipo (sin ayudas ni subtítulos con el término objetivo).',
            interactionBudgetMs: 75000,
            maxLearnerTurns: 5,
          },
        },
      },
      privateArenaConfig: {
        cefr_level: 'B1',
        locale: 'en-GB',
        agent_role: 'A colleague coordinating an important meeting',
        learner_role: 'The person responsible for telling the team what happens next',
        setting: "The decision-maker cannot attend today's meeting",
        communicative_intent:
          'Propose delaying the meeting and explain the new plan',
        primary_target: {
          canonical: 'put off',
          sense: 'delay an event or activity',
          accepted_variants: [
            'put off the meeting',
            'put the meeting off',
            'put it off',
            'putting it off',
            'puts it off',
            'put the session off',
          ],
        },
        grammar_focus:
          'separable phrasal verb; object pronoun before the particle',
        acceptance_rules: {
          require_contextual_delay_meaning: true,
          accepted_tenses: [
            'imperative',
            'present',
            'past',
            'future',
            'modal',
            'gerund',
          ],
          pronoun_must_precede_particle: true,
          paraphrase_can_resolve_task: true,
          paraphrase_demonstrates_target_recall: false,
        },
        forbidden_spoken_forms: [
          'put off',
          'put it off',
          'put the meeting off',
          'putting off',
          'puts off',
          'posponer',
          'put ... off',
          'starts with put',
        ],
        opening_scene:
          "Sam cannot attend today's meeting. We need Sam there to decide. What should we do?",
        editorial_fallback_questions: [
          'What exactly should I tell the team?',
          'Friday is possible, but the room is busy. What is your plan?',
        ],
        complications: [
          "Friday's room is unavailable; an online meeting remains possible",
        ],
        max_question_words: 25,
        max_learner_turns: 5,
        max_contextual_reframes: 2,
      },
    },
  ],
  'en-US': [
    {
      publicLesson: {
        id: '33333333-3333-4333-8333-333333333302',
        unitId: B1_UNIT_ID,
        unitTitle: B1_UNIT_TITLE,
        slug: 'b1-m1-s1-put-off',
        version: 1,
        locale: 'en-US',
        cefrLevel: 'B1',
        title: 'Sesión 1: Posponer sin perder credibilidad',
        realLifeTopic: 'Coordinar reuniones cuando falta quien toma la decisión',
        communicativeGoal:
          'Proponer posponer una reunión y explicar el nuevo plan al equipo',
        grammarFocus:
          'Phrasal verb separable: pronombre objeto antes de la partícula (put it off)',
        position: 1,
        isCheckpoint: false,
        publicContent: {
          anatomy: {
            targetExpression: 'put off',
            senseKey: 'put_off.delay_event.v1',
            meaningEn: 'delay an event or activity until a later time',
            ipa: '/pʊɾ‿ɪɾ‿ɔːf/',
            dialectTip:
              'En inglés americano (US), cuando dices "put it off" a velocidad natural, ambas /t/ entre vocales suenan como una R suave en español (Flap T): /pʊɾ‿ɪɾ‿ɔːf/.',
            functionalRule:
              'Usa "put off" cuando necesites aplazar una reunión o actividad por un obstáculo concreto. Es un phrasal verb separable: si usas un pronombre ("it" o "them"), va obligatoriamente en medio ("put it off", nunca "put off it").',
            modelSentence:
              "Since Sam's flight out of JFK is delayed, we should put the review off until Friday morning.",
            modelTranslationEs:
              'Como el vuelo de Sam desde JFK está retrasado, deberíamos posponer la revisión hasta el viernes por la mañana.',
            examples: [
              {
                en: "Let's put the meeting off until Friday.",
                es: 'Pospongamos la reunión hasta el viernes.',
              },
              {
                en: "We can't put it off any longer.",
                es: 'No podemos posponerlo por más tiempo.',
              },
            ],
            reviewTargets: [
              {
                expression: 'run out of',
                meaningEs: 'quedarse sin (tiempo, batería, presupuesto)',
              },
              {
                expression: 'by Friday morning',
                meaningEs: 'a más tardar el viernes por la mañana',
              },
            ],
          },
          input: {
            situationTitle: 'Mensaje urgente antes del comité de producto',
            senderRole: 'Alex · Product Lead (NYC)',
            microText:
              "Hey team — Sam's flight from Chicago is grounded and she won't have reliable Wi-Fi until 4 p.m. EST. Since she has final sign-off on the Q4 budget, meeting at 10 a.m. would mean redoing the whole conversation tomorrow. I suggest we push the session to Friday at 11 a.m.",
            comprehensionPrompt:
              'En 1 frase en inglés o español: ¿Por qué no conviene hacer la reunión hoy a las 10 a.m. y qué pasaría si la hacen sin Sam?',
            expectedInferenceKeywords: [
              'sign-off',
              'budget',
              'redo',
              'redoing',
              'repeat',
              'decisión',
              'aprobar',
              'presupuesto',
              'repetir',
              'sam',
            ],
            sampleModelAnswer:
              'Because Sam has final sign-off on the budget, so meeting without her today would mean redoing the entire conversation tomorrow.',
          },
          writing: {
            scenarioPrompt:
              'Escríbele un mensaje breve (1–2 frases en inglés) a tu colega Jordan proponiendo posponer la reunión de hoy para el viernes porque Sam no puede conectarse.',
            recipientName: 'Jordan (Product Operations, NYC)',
            communicativeGoalEs:
              'Proponer aplazar la sesión al viernes y justificar brevemente por qué.',
            grammarChecklistEs:
              'Usa el objetivo de la sesión con un sustantivo o con el pronombre objeto antes de la partícula.',
            placeholderEn:
              'Hey Jordan, since Sam cannot make it today, let’s...',
          },
          voiceArena: {
            interlocutorTitle: 'Jordan — Product Operations (NYC)',
            interlocutorRole: 'Un colega coordinando una reunión importante',
            briefingEs:
              'Sam no puede asistir hoy y es quien toma la decisión final. Habla con Jordan para acordar qué hacer con la reunión y cómo comunicárselo al equipo (sin ayudas ni subtítulos con el término objetivo).',
            interactionBudgetMs: 75000,
            maxLearnerTurns: 5,
          },
        },
      },
      privateArenaConfig: {
        cefr_level: 'B1',
        locale: 'en-US',
        agent_role: 'A colleague coordinating an important meeting',
        learner_role: 'The person responsible for telling the team what happens next',
        setting: "The decision-maker cannot attend today's meeting",
        communicative_intent:
          'Propose delaying the meeting and explain the new plan',
        primary_target: {
          canonical: 'put off',
          sense: 'delay an event or activity',
          accepted_variants: [
            'put off the meeting',
            'put the meeting off',
            'put it off',
            'putting it off',
            'puts it off',
            'put the session off',
          ],
        },
        grammar_focus:
          'separable phrasal verb; object pronoun before the particle',
        acceptance_rules: {
          require_contextual_delay_meaning: true,
          accepted_tenses: [
            'imperative',
            'present',
            'past',
            'future',
            'modal',
            'gerund',
          ],
          pronoun_must_precede_particle: true,
          paraphrase_can_resolve_task: true,
          paraphrase_demonstrates_target_recall: false,
        },
        forbidden_spoken_forms: [
          'put off',
          'put it off',
          'put the meeting off',
          'putting off',
          'puts off',
          'posponer',
          'put ... off',
          'starts with put',
        ],
        opening_scene:
          "Sam cannot attend today's meeting. We need Sam there to decide. What should we do?",
        editorial_fallback_questions: [
          'What exactly should I tell the team?',
          'Friday is possible, but the conference room is booked. What is your plan?',
        ],
        complications: [
          "Friday's room is unavailable; an online meeting remains possible",
        ],
        max_question_words: 25,
        max_learner_turns: 5,
        max_contextual_reframes: 2,
      },
    },
  ],
};

/**
 * Mapa de las 5 sesiones del Módulo 1 B1 (4 prácticas + 1 checkpoint de transferencia)
 * según la especificación de `01_mvp_y_modelo.md`.
 */
export const B1_MODULE_1_SYLLABUS_OVERVIEW = [
  {
    position: 1,
    slug: 'b1-m1-s1-put-off',
    title: 'Sesión 1: Posponer sin perder credibilidad',
    target: 'put off',
    grammar: 'Phrasal verb separable + posición del pronombre objeto',
    isCheckpoint: false,
    status: 'available' as const,
  },
  {
    position: 2,
    slug: 'b1-m1-s2-run-out-of',
    title: 'Sesión 2: Gestionar límites de tiempo y recursos',
    target: 'run out of',
    grammar: 'Phrasal verb inseparable de 3 partes + sustantivos incontables',
    isCheckpoint: false,
    status: 'upcoming' as const,
  },
  {
    position: 3,
    slug: 'b1-m1-s3-bring-forward',
    title: 'Sesión 3: Adelantar entregas ante cambios de agenda',
    target: 'bring forward',
    grammar: 'Phrasal verb separable en propuestas con modales (could / should)',
    isCheckpoint: false,
    status: 'upcoming' as const,
  },
  {
    position: 4,
    slug: 'b1-m1-s4-sort-out',
    title: 'Sesión 4: Resolver bloqueos logísticos de última hora',
    target: 'sort out',
    grammar: 'Phrasal verb separable con cláusulas de propósito',
    isCheckpoint: false,
    status: 'upcoming' as const,
  },
  {
    position: 5,
    slug: 'b1-m1-s5-checkpoint',
    title: 'Sesión 5: Checkpoint de Transferencia (Módulo 1)',
    target: 'put off · run out of · bring forward · sort out',
    grammar: 'Recuperación sin pistas en escena combinada de imprevistos',
    isCheckpoint: true,
    status: 'checkpoint' as const,
  },
];

export function getSeededLessonByLocale(
  locale: SupportedLocale,
  slug = 'b1-m1-s1-put-off'
): SeededLessonBundle {
  const list = B1_MODULE_1_LESSONS[locale];
  const found = list.find((item) => item.publicLesson.slug === slug);
  return found ?? list[0]!;
}
