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
}

export const ERROR_HUNT_ITEMS: ErrorHuntItem[] = [
  { sentence: 'I am agree with you', wrongIndex: 1, correction: 'I agree with you', explanationEs: '"Agree" ya es verbo: no lleva "am".' },
  { sentence: 'People is very friendly here', wrongIndex: 1, correction: 'People are very friendly here', explanationEs: '"People" es plural: "people are".' },
  { sentence: 'She have two brothers', wrongIndex: 1, correction: 'She has two brothers', explanationEs: 'Con he/she/it: "has".' },
  { sentence: 'I have 20 years old', wrongIndex: 1, correction: 'I am 20 years old', explanationEs: 'La edad se dice con "be".' },
  { sentence: 'It depends of the weather', wrongIndex: 2, correction: 'It depends on the weather', explanationEs: '"Depend on", no "depend of".' },
  { sentence: 'Can you explain me the rule?', wrongIndex: 3, correction: 'Can you explain the rule to me?', explanationEs: '"Explain" necesita "to" antes de la persona.' },
  { sentence: 'I need some informations', wrongIndex: 3, correction: 'I need some information', explanationEs: '"Information" es incontable: sin -s.' },
  { sentence: 'We discussed about the plan', wrongIndex: 2, correction: 'We discussed the plan', explanationEs: '"Discuss" no lleva "about".' },
  { sentence: 'I look forward to see you', wrongIndex: 4, correction: 'I look forward to seeing you', explanationEs: 'Después de "look forward to" va -ing.' },
  { sentence: 'He can to swim very well', wrongIndex: 2, correction: 'He can swim very well', explanationEs: 'Los modales no llevan "to".' },
  { sentence: 'This is more better than that', wrongIndex: 2, correction: 'This is better than that', explanationEs: 'No combines "more" con "better".' },
  { sentence: 'I will assist to the meeting', wrongIndex: 2, correction: 'I will attend the meeting', explanationEs: 'Falso amigo: "asistir a" = "attend".' },
  { sentence: 'Yesterday I didn’t went out', wrongIndex: 3, correction: 'Yesterday I didn’t go out', explanationEs: 'Después de "didn’t" va el verbo base.' },
  { sentence: 'I live here since three years', wrongIndex: 3, correction: 'I have lived here for three years', explanationEs: 'Con un periodo de tiempo se usa "for".' },
  { sentence: 'Is important to sleep well', wrongIndex: 0, correction: 'It is important to sleep well', explanationEs: 'En inglés el sujeto es obligatorio: "It is…".' },
  { sentence: 'I am boring in this class', wrongIndex: 2, correction: 'I am bored in this class', explanationEs: '"Bored" = aburrido (cómo te sientes).' },
  { sentence: 'My sister is married with a pilot', wrongIndex: 4, correction: 'My sister is married to a pilot', explanationEs: 'Se dice "married to".' },
  { sentence: 'I want to listen music now', wrongIndex: 3, correction: 'I want to listen to music now', explanationEs: '"Listen to" + algo.' },
];
