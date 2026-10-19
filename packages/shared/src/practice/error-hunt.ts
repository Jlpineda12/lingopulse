import { EXPERIENCE_ERROR_HUNT_ITEMS } from './experience-bank.js';
/**
 * "Encuentra el error": frases con un error típico de hispanohablantes.
 * El jugador toca la palabra incorrecta (`wrongIndex`, contando palabras separadas por espacio)
 * y luego ve la corrección explicada.
 */
export interface ErrorHuntItem {
  sentence: string;
  wrongIndex: number;
  correction: string;
  explanationEs: string;
  /** Explicación en inglés para alumnos B1+ (app en inglés). */
  explanationEn?: string;
}

export const ERROR_HUNT_ITEMS: ErrorHuntItem[] = [
  { sentence: 'I am agree with you', wrongIndex: 1, correction: 'I agree with you', explanationEs: '"Agree" ya es verbo: no lleva "am".', explanationEn: '"Agree" is already a verb: no "am".' },
  { sentence: 'People is very friendly here', wrongIndex: 1, correction: 'People are very friendly here', explanationEs: '"People" es plural: "people are".', explanationEn: '"People" is plural: "people are".' },
  { sentence: 'She have two brothers', wrongIndex: 1, correction: 'She has two brothers', explanationEs: 'Con he/she/it: "has".', explanationEn: 'With he/she/it use "has".' },
  { sentence: 'I have 20 years old', wrongIndex: 1, correction: 'I am 20 years old', explanationEs: 'La edad se dice con "be".', explanationEn: 'Age goes with "be": "I am 20".' },
  { sentence: 'It depends of the weather', wrongIndex: 2, correction: 'It depends on the weather', explanationEs: '"Depend on", no "depend of".', explanationEn: 'We say "depend on", not "depend of".' },
  { sentence: 'Can you explain me the rule?', wrongIndex: 3, correction: 'Can you explain the rule to me?', explanationEs: '"Explain" necesita "to" antes de la persona.', explanationEn: '"Explain" needs "to" before the person.' },
  { sentence: 'I need some informations', wrongIndex: 3, correction: 'I need some information', explanationEs: '"Information" es incontable: sin -s.', explanationEn: '"Information" is uncountable: no -s.' },
  { sentence: 'We discussed about the plan', wrongIndex: 2, correction: 'We discussed the plan', explanationEs: '"Discuss" no lleva "about".', explanationEn: '"Discuss" takes no "about".' },
  { sentence: 'I look forward to see you', wrongIndex: 4, correction: 'I look forward to seeing you', explanationEs: 'Después de "look forward to" va -ing.', explanationEn: 'After "look forward to" use -ing.' },
  { sentence: 'He can to swim very well', wrongIndex: 2, correction: 'He can swim very well', explanationEs: 'Los modales no llevan "to".', explanationEn: 'Modal verbs are not followed by "to".' },
  { sentence: 'This is more better than that', wrongIndex: 2, correction: 'This is better than that', explanationEs: 'No combines "more" con "better".', explanationEn: 'Don\'t combine "more" with "better".' },
  { sentence: 'I will assist to the meeting', wrongIndex: 2, correction: 'I will attend the meeting', explanationEs: 'Falso amigo: "asistir a" = "attend".', explanationEn: 'False friend: "asistir a" = "attend".' },
  { sentence: 'Yesterday I didn’t went out', wrongIndex: 3, correction: 'Yesterday I didn’t go out', explanationEs: 'Después de "didn’t" va el verbo base.', explanationEn: 'After "didn’t" use the base verb.' },
  { sentence: 'I live here since three years', wrongIndex: 3, correction: 'I have lived here for three years', explanationEs: 'Con un periodo de tiempo se usa "for".', explanationEn: 'Use "for" with a period of time (and present perfect).' },
  { sentence: 'Is important to sleep well', wrongIndex: 0, correction: 'It is important to sleep well', explanationEs: 'En inglés el sujeto es obligatorio: "It is…".', explanationEn: 'English needs a subject: "It is…".' },
  { sentence: 'I am boring in this class', wrongIndex: 2, correction: 'I am bored in this class', explanationEs: '"Bored" = aburrido (cómo te sientes).', explanationEn: '"Bored" describes how you feel; "boring" describes the class.' },
  { sentence: 'My sister is married with a pilot', wrongIndex: 4, correction: 'My sister is married to a pilot', explanationEs: 'Se dice "married to".', explanationEn: 'We say "married to".' },
  { sentence: 'I want to listen music now', wrongIndex: 3, correction: 'I want to listen to music now', explanationEs: '"Listen to" + algo.', explanationEn: 'We say "listen to" + something.' },
];

// Contenido del Banco de Aprendizaje Experiencial (BancodeVocabulario.txt), ver experience-bank.ts.
ERROR_HUNT_ITEMS.push(...EXPERIENCE_ERROR_HUNT_ITEMS);
