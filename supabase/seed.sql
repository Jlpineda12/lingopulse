-- Semilla curricular inicial para LingoPulse v1.0 (Ruta MCER B1 - Módulo 1)
-- Ejecutar después de 202610130001_core.sql

begin;

-- 1. Unidad Curricular B1 Módulo 1: Coordinar planes y gestionar imprevistos
insert into public.curriculum_units (id, slug, title, track, cefr_level, position)
values (
  '11111111-1111-4111-8111-111111111101',
  'b1-mod-1-coordinar-planes',
  'Módulo 1: Coordinar planes y resolver imprevistos',
  'progression',
  'B1',
  1
) on conflict (slug) do nothing;

-- 2. Objetivos Léxicos (Lexical Targets con sense_key estable)
insert into public.lexical_targets (id, canonical_form, sense_key, meaning_en, usage_notes)
values
  (
    '22222222-2222-4222-8222-222222222201',
    'put off',
    'put_off.delay_event.v1',
    'delay an event or activity until a later time',
    'Separable phrasal verb. Object pronouns (it, them) must go between "put" and "off" (e.g., "put it off").'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    'run out of',
    'run_out_of.exhaust_supply.v1',
    'use all of something so that none is left (time, battery, budget)',
    'Inseparable three-part phrasal verb followed by a noun phrase.'
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    'bring forward',
    'bring_forward.move_earlier.v1',
    'change the date or time of an event so that it happens earlier',
    'Separable phrasal verb; common in UK/international workplace scheduling.'
  )
on conflict (canonical_form, sense_key) do nothing;

-- 3. Lección 1 (en-GB): "put off" — Reprogramar una reunión crítica
insert into public.lessons (
  id, unit_id, slug, version, locale, title, real_life_topic,
  communicative_goal, grammar_focus, position, is_checkpoint, published_at, public_content
)
values (
  '33333333-3333-4333-8333-333333333301',
  '11111111-1111-4111-8111-111111111101',
  'b1-m1-s1-put-off',
  1,
  'en-GB',
  'Sesión 1: Posponer sin perder credibilidad',
  'Coordinar reuniones cuando falta quien toma la decisión',
  'Proponer posponer una reunión y explicar el nuevo plan al equipo',
  'Phrasal verb separable: pronombre objeto antes de la partícula (put it off)',
  1,
  false,
  now(),
  '{
    "anatomy": {
      "targetExpression": "put off",
      "ipa": "/pʊt ɒf/",
      "dialectTip": "En inglés británico (en-GB), la vocal de \"off\" es corta y redondeada (/ɒf/), y la /t/ final de \"put\" suele enlazar con vocal si sigue \"it\": /pʊt‿ɪt‿ɒf/.",
      "functionalRule": "Usa \"put off\" para aplazar una reunión o decisión cuando falta una condición clave. Si usas un pronombre (it, them), colócalo siempre en medio: \"put it off\", nunca \"put off it\".",
      "modelSentence": "Since Sam is stuck at Heathrow, we should put the review off until Friday morning.",
      "modelTranslationEs": "Como Sam está retenido en Heathrow, deberíamos posponer la revisión hasta el viernes por la mañana.",
      "examples": [
        { "en": "Let''s put the meeting off until Friday.", "es": "Pospongamos la reunión hasta el viernes." },
        { "en": "We can''t put it off any longer.", "es": "No podemos posponerlo por más tiempo." }
      ]
    },
    "input": {
      "situationTitle": "Mensaje urgente antes del comité de producto",
      "microText": "Hi team — Sam''s train from Manchester has been cancelled and she won''t have stable signal until 4 p.m. Since she has the final sign-off on the Q4 budget, going ahead at 10 a.m. would mean repeating the whole discussion tomorrow. I suggest we move the session to Friday at 11 a.m.",
      "ComprehensionPrompt": "¿Por qué propone el remitente no celebrar la reunión hoy a las 10 a.m. y qué consecuencia tendría hacerla sin Sam?",
      "expectedInferenceHints": [
        "Sam tiene la aprobación final del presupuesto (final sign-off)",
        "Hacerla hoy obligaría a repetir toda la discusión mañana"
      ]
    },
    "writing": {
      "scenarioPrompt": "Escríbele un mensaje breve (1–2 frases) a tu colega Jordan proponiendo posponer la reunión de hoy para el viernes porque Sam no puede conectarse. Usa el objetivo de la sesión y un pronombre o el sustantivo correctamente ubicado.",
      "DialectNote": "Preferencia activa: UK (en-GB)"
    },
    "voiceArena": {
      "interlocutorTitle": "Jordan — Coordinador de Proyecto (London Office)",
      "briefing": "Sam no puede asistir a la reunión de hoy y es quien toma la decisión final. Habla con Jordan para acordar qué hacer con la sesión y cómo comunicárselo al equipo.",
      "interactionBudgetMs": 75000,
      "maxLearnerTurns": 5
    }
  }'::jsonb
) on conflict (slug, version, locale) do nothing;

-- 4. Lección 1 (en-US): "put off" — Reprogramar una reunión crítica
insert into public.lessons (
  id, unit_id, slug, version, locale, title, real_life_topic,
  communicative_goal, grammar_focus, position, is_checkpoint, published_at, public_content
)
values (
  '33333333-3333-4333-8333-333333333302',
  '11111111-1111-4111-8111-111111111101',
  'b1-m1-s1-put-off',
  1,
  'en-US',
  'Sesión 1: Posponer sin perder credibilidad',
  'Coordinar reuniones cuando falta quien toma la decisión',
  'Proponer posponer una reunión y explicar el nuevo plan al equipo',
  'Phrasal verb separable: pronombre objeto antes de la partícula (put it off)',
  1,
  false,
  now(),
  '{
    "anatomy": {
      "targetExpression": "put off",
      "ipa": "/pʊt ɔːf/",
      "dialectTip": "En inglés americano (en-US), cuando dices \"put it off\", la /t/ entre vocales suena suave como una vibrante corta (flap T): /pʊɾ‿ɪɾ‿ɔːf/.",
      "functionalRule": "Usa \"put off\" para aplazar una reunión o decisión cuando falta una condición clave. Si usas un pronombre (it, them), colócalo siempre en medio: \"put it off\", nunca \"put off it\".",
      "modelSentence": "Since Sam''s flight out of JFK is delayed, we should put the review off until Friday morning.",
      "modelTranslationEs": "Como el vuelo de Sam desde JFK está retrasado, deberíamos posponer la revisión hasta el viernes por la mañana.",
      "examples": [
        { "en": "Let''s put the meeting off until Friday.", "es": "Pospongamos la reunión hasta el viernes." },
        { "en": "We can''t put it off any longer.", "es": "No podemos posponerlo por más tiempo." }
      ]
    },
    "input": {
      "situationTitle": "Mensaje urgente antes del comité de producto",
      "microText": "Hey team — Sam''s flight from Chicago is grounded and she won''t have reliable Wi-Fi until 4 p.m. EST. Since she has final sign-off on the Q4 budget, meeting at 10 a.m. would mean redoing the whole conversation tomorrow. I suggest we push the session to Friday at 11 a.m.",
      "ComprehensionPrompt": "¿Por qué propone el remitente no celebrar la reunión hoy a las 10 a.m. y qué consecuencia tendría hacerla sin Sam?",
      "expectedInferenceHints": [
        "Sam tiene la aprobación final del presupuesto (final sign-off)",
        "Reunirse hoy obligaría a repetir la conversación mañana"
      ]
    },
    "writing": {
      "scenarioPrompt": "Escríbele un mensaje breve (1–2 frases) a tu colega Jordan proponiendo posponer la reunión de hoy para el viernes porque Sam no puede conectarse. Usa el objetivo de la sesión y un pronombre o el sustantivo correctamente ubicado.",
      "DialectNote": "Preferencia activa: US (en-US)"
    },
    "voiceArena": {
      "interlocutorTitle": "Jordan — Product Operations (NYC Office)",
      "briefing": "Sam no puede asistir a la reunión de hoy y es quien toma la decisión final. Habla con Jordan para acordar qué hacer con la sesión y cómo comunicárselo al equipo.",
      "interactionBudgetMs": 75000,
      "maxLearnerTurns": 5
    }
  }'::jsonb
) on conflict (slug, version, locale) do nothing;

-- 5. Relación Lección ↔ Objetivos Léxicos
insert into public.lesson_targets (lesson_id, target_id, target_role)
values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'primary'),
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222202', 'review'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222201', 'primary'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222202', 'review')
on conflict (lesson_id, target_id) do nothing;

-- 6. Configuración privada del servidor para Voice Arena (NUNCA expuesta en PostgREST)
insert into private.arena_configs (lesson_id, prompt_version, rubric_version, lesson_config, rubric)
values
  (
    '33333333-3333-4333-8333-333333333301',
    'voice-arena-prompt-v1.0',
    'b1-speaking-rubric-v1.0',
    '{
      "cefr_level": "B1",
      "locale": "en-GB",
      "agent_role": "A colleague coordinating an important meeting",
      "learner_role": "The person responsible for telling the team what happens next",
      "setting": "The decision-maker cannot attend today''s meeting",
      "communicative_intent": "Propose delaying the meeting and explain the new plan",
      "primary_target": {
        "canonical": "put off",
        "sense": "delay an event or activity",
        "accepted_variants": ["put off the meeting", "put the meeting off", "put it off", "putting it off", "puts it off", "put today''s meeting off", "put the session off"]
      },
      "grammar_focus": "separable phrasal verb; object pronoun before the particle",
      "acceptance_rules": {
        "require_contextual_delay_meaning": true,
        "accepted_tenses": ["imperative", "present", "past", "future", "modal", "gerund"],
        "pronoun_must_precede_off": true,
        "paraphrase_can_resolve_task": true,
        "paraphrase_demonstrates_target_recall": false
      },
      "forbidden_spoken_forms": ["put off", "put it off", "put the meeting off", "putting off", "puts off", "posponer", "put ... off", "starts with put"],
      "opening_scene": "Sam cannot attend today''s meeting. We need Sam there to decide. What should we do?",
      "editorial_fallback_questions": [
        "What exactly should I tell the team?",
        "Friday is possible, but the room is busy. What is your plan?"
      ],
      "complications": ["Friday''s room is unavailable; an online meeting remains possible"],
      "max_question_words": 25,
      "max_learner_turns": 5,
      "max_contextual_reframes": 2
    }'::jsonb,
    '{
      "scale": "0-4 ordinal",
      "dimensions": ["communicative_score", "target_score", "grammar_score"]
    }'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    'voice-arena-prompt-v1.0',
    'b1-speaking-rubric-v1.0',
    '{
      "cefr_level": "B1",
      "locale": "en-US",
      "agent_role": "A colleague coordinating an important meeting",
      "learner_role": "The person responsible for telling the team what happens next",
      "setting": "The decision-maker cannot attend today''s meeting",
      "communicative_intent": "Propose delaying the meeting and explain the new plan",
      "primary_target": {
        "canonical": "put off",
        "sense": "delay an event or activity",
        "accepted_variants": ["put off the meeting", "put the meeting off", "put it off", "putting it off", "puts it off", "put today''s meeting off", "put the session off"]
      },
      "grammar_focus": "separable phrasal verb; object pronoun before the particle",
      "acceptance_rules": {
        "require_contextual_delay_meaning": true,
        "accepted_tenses": ["imperative", "present", "past", "future", "modal", "gerund"],
        "pronoun_must_precede_off": true,
        "paraphrase_can_resolve_task": true,
        "paraphrase_demonstrates_target_recall": false
      },
      "forbidden_spoken_forms": ["put off", "put it off", "put the meeting off", "putting off", "puts off", "posponer", "put ... off", "starts with put"],
      "opening_scene": "Sam cannot attend today''s meeting. We need Sam there to decide. What should we do?",
      "editorial_fallback_questions": [
        "What exactly should I tell the team?",
        "Friday is possible, but the conference room is booked. What is your plan?"
      ],
      "complications": ["Friday''s room is unavailable; an online meeting remains possible"],
      "max_question_words": 25,
      "max_learner_turns": 5,
      "max_contextual_reframes": 2
    }'::jsonb,
    '{
      "scale": "0-4 ordinal",
      "dimensions": ["communicative_score", "target_score", "grammar_score"]
    }'::jsonb
  )
on conflict (lesson_id) do nothing;

commit;
