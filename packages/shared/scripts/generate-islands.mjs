#!/usr/bin/env node
/**
 * Genera con Gemini el contenido de las islas del mapa que aún no tienen contenido,
 * con el MISMO formato del Banco de Aprendizaje Experiencial (BancodeVocabulario.txt).
 *
 * El resultado va a packages/shared/data/generated-islands.json con "approved": false.
 * Nada entra a la app hasta que se aprueba (ver import-experience-bank.mjs).
 *
 * Uso (desde la raíz, con GEMINI_API_KEY en .env):
 *   node --env-file=.env packages/shared/scripts/generate-islands.mjs [--level B1] [--limit 2] [--concurrency 3]
 *
 * Se puede interrumpir y volver a ejecutar: salta las islas ya generadas.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const outFile = resolve(here, '../data/generated-islands.json');
const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const onlyLevel = arg('level');
const limit = Number(arg('limit', '1000'));
const concurrency = Number(arg('concurrency', '3'));
const model = process.env.GEMINI_ISLANDS_MODEL || process.env.GEMINI_MODEL || 'gemini-flash-latest';
// En el nivel gratuito cada modelo tiene su propio cupo diario: si uno se agota se pasa al siguiente.
const MODELS = [model, ...(process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.5-flash,gemini-flash-lite-latest').split(',')]
  .map((m) => m.trim())
  .filter((m, i, arr) => m && arr.indexOf(m) === i);
const exhausted = new Set();
class QuotaExhausted extends Error {}
if (!process.env.GEMINI_API_KEY) {
  console.error('Falta GEMINI_API_KEY (ejecuta con node --env-file=.env ...)');
  process.exit(1);
}

/* ---------------------------- Banco de origen ---------------------------- */

const raw = JSON.parse(readFileSync(resolve(root, 'BancodeVocabulario.txt'), 'utf8'));
const md = raw.response;
const bank = JSON.parse(md.match(/```json\n([\s\S]*?)\n```/)[1]);
const map = {};
for (const m of md.matchAll(/\*\s+\*\*NIVEL (A1|A2|B1|B2|C1|C2) \(([^)]*)\):\*\*\s*(.+)/g)) {
  map[m[1]] = {
    theme: m[2].trim(),
    islands: m[3]
      .split('|')
      .map((t) => t.replace(/^\s*\d+\.\s*/, '').replace(/\.\s*$/, '').trim())
      .filter(Boolean),
  };
}

/* ------------------------------- Esquema ------------------------------- */

const IslandSchema = z.object({
  topic_context: z.string().min(20),
  speaking_module: z.object({
    prompts: z
      .array(
        z.object({
          goal: z.string(),
          instructions: z.string(),
          target_phrases: z.array(z.string()).min(3).max(4),
          model_response: z.string(),
        })
      )
      .length(2),
  }),
  listening_module: z.object({
    audio_script: z.string(),
    comprehension_questions: z
      .array(
        z.object({
          question: z.string(),
          options: z.array(z.string()).length(3),
          correct_answer: z.string(),
          explanation: z.string(),
        })
      )
      .length(2),
  }),
  writing_module: z.object({
    task_type: z.string(),
    instructions: z.string(),
    scaffolding_structures: z.array(z.string()).length(3),
  }),
  spanglish_error_lab: z
    .array(
      z.object({
        incorrect_sentence: z.string(),
        spanish_interference: z.string(),
        native_correction: z.string(),
      })
    )
    .length(2),
  lexical_toolbox: z
    .array(
      z.object({
        term: z.string(),
        type: z.string(),
        ipa: z.string(),
        explanation: z.string(),
        how_to_use: z.string(),
        example_1: z.string(),
        example_2: z.string(),
        translation_es: z.string(),
      })
    )
    .length(6),
});
const JSON_SCHEMA = z.toJSONSchema(IslandSchema);

/* ------------------------------- Prompt ------------------------------- */

const LEVEL_RULES = {
  A1: 'Very short, simple sentences. Present simple, "can", basic past. Listening script 5-7 short turns. Writing 20-40 words.',
  A2: 'Simple everyday language, past simple, future with going to, comparatives. Listening script 6-8 turns. Writing 50-80 words.',
  B1: 'Everyday opinions and experiences, present perfect, conditionals, phrasal verbs. Listening 6-9 turns. Writing 120-160 words.',
  B2: 'Abstract topics, argumentation, passive, advanced connectors. Listening 6-9 rich turns. Writing 200-250 words.',
  C1: 'Nuanced, academic and professional register, hedging, inversion, collocations. Listening 5-8 long turns or a monologue. Writing 250-300 words.',
  C2: 'Near-native sophistication, rhetorical devices, rare idioms, philosophical precision. Listening 4-7 dense turns or a monologue. Writing 350-400 words.',
};

function systemPrompt(level, lang) {
  const spanish = lang.toLowerCase().startsWith('span');
  return `You are a senior ELT curriculum designer writing content for a mobile app for Spanish-speaking learners (Latin America).
You create ONE "experience island": a real-life themed unit at CEFR ${level}.

Language policy (mandatory):
${
  spanish
    ? `- Level ${level}: goals, instructions, topic_context, question texts, options, explanations, spanish_interference, lexical "explanation" and "how_to_use" are written in SPANISH (Latin American, neutral). English only where the learner must produce or hear English (target_phrases, model_response, audio_script, scaffolding_structures, sentences, terms, examples).`
    : `- Level ${level}: EVERYTHING is in ENGLISH (100% immersion), including instructions, explanations and spanish_interference (explain the Spanish interference in English).`
}

Level guidance: ${LEVEL_RULES[level]}

Content rules:
- speaking_module: 2 prompts that are realistic situations inside the island theme. target_phrases: 3 useful chunks. model_response: a natural answer at ${level}.
- listening_module.audio_script: a dialogue with lines formatted exactly "Name: text" separated by \\n (2 speakers; a monologue is fine for C1/C2). Natural, idiomatic, level-appropriate. 2 comprehension questions answerable ONLY from the script; options start with "A) ", "B) ", "C) " and correct_answer is copied EXACTLY from one option.
- writing_module: task_type in the policy language; instructions MUST include the word range in parentheses, e.g. "(120-160 words)" or "(20-35 palabras)". 3 scaffolding structures in English.
- spanglish_error_lab: 2 errors that Spanish speakers really make in this theme (false friends, prepositions, literal translations). incorrect_sentence and native_correction must be IDENTICAL except for ONE word or a very short phrase, so the learner can spot the single wrong word.
- lexical_toolbox: exactly 6 items in this order of type: "Phrasal Verb", "Slang / Colloquial", "Verb", "Adjective", "Idiom", "Useful Vocabulary". ipa between slashes (General American). example_1 and example_2 MUST contain the term written exactly as in "term" (same words, you may inflect only the verb ending: -s/-ed/-ing).
- translation_es: a SHORT Latin American Spanish translation of the term (1-5 words, e.g. "probarse (ropa)", "costar un ojo de la cara"), always in Spanish at every level.
- Do NOT reuse any term from the "already used terms" list. Be accurate: no invented idioms, correct IPA, correct grammar in every English sentence.
- Return only the JSON object for the island content.`;
}

function userPrompt(level, title, nn, theme, sample, usedTerms) {
  return `Level: ${level} — level theme: "${theme}".
Island ${nn} title: "${title}".

Already used terms at this level (do not repeat): ${usedTerms.length ? usedTerms.join(', ') : '(none)'}.

Here is the reference island for this level from the same bank. Match its style, depth and format exactly (but with completely new content for the new title):
${JSON.stringify(sample)}`;
}

/* ------------------------------ Validación ------------------------------ */

const stripOpt = (o) => o.replace(/^\s*[A-Da-d]\)\s*/, '').trim();
const looksSpanish = (t) => /[áéíóúñ¿¡]|\b(el|la|los|las|que|para|con|una|del)\b/i.test(t);

function termInExample(term, example) {
  const words = term
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z'-]/g, ''))
    .filter(Boolean);
  const stem = (w) => (w.length > 4 ? w.replace(/(e|y)$/, '') : w);
  const pattern = words.map((w) => `${stem(w).replace(/[-']/g, "[-']?")}\\w*`).join("[\\s-]+(?:\\w+\\s+)?");
  return new RegExp(`\\b${pattern}\\b`, 'i').test(example);
}

function validate(island, level, spanish, usedTerms) {
  const problems = [];
  for (const q of island.listening_module.comprehension_questions) {
    if (!q.options.map(stripOpt).includes(stripOpt(q.correct_answer))) problems.push(`respuesta fuera de opciones: "${q.question}"`);
  }
  if (!/\d{2,3}\s*[-–]\s*\d{2,3}\s*(palabras|words)/i.test(island.writing_module.instructions))
    problems.push('writing sin rango de palabras');
  const lines = island.listening_module.audio_script.split('\n').filter((l) => l.trim());
  if (lines.length < 3) problems.push('guion de listening demasiado corto');
  for (const l of island.lexical_toolbox) {
    if (!termInExample(l.term, l.example_1)) problems.push(`"${l.term}" no aparece en example_1`);
    if (usedTerms.some((u) => u.toLowerCase() === l.term.toLowerCase())) problems.push(`término repetido: ${l.term}`);
  }
  for (const e of island.spanglish_error_lab) {
    const a = e.incorrect_sentence.toLowerCase().split(/\s+/);
    const b = new Set(e.native_correction.toLowerCase().split(/\s+/));
    const diff = a.filter((w) => !b.has(w)).length;
    if (diff === 0 || diff > 3) problems.push(`spanglish con ${diff} palabras distintas: "${e.incorrect_sentence}"`);
  }
  if (!spanish && looksSpanish(island.writing_module.instructions + ' ' + island.speaking_module.prompts[0].instructions))
    problems.push(`nivel ${level} debería estar 100% en inglés`);
  if (spanish && !looksSpanish(island.speaking_module.prompts[0].instructions)) problems.push(`nivel ${level}: instrucciones deberían ir en español`);
  return problems;
}

/* --------------------------------- Gemini --------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(system, user) {
  for (const m of MODELS) {
    if (exhausted.has(m)) continue;
    for (let attempt = 0; attempt < 4; attempt++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature: 0.8, responseMimeType: 'application/json', responseJsonSchema: JSON_SCHEMA },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
        return { json: JSON.parse(text), model: data.modelVersion ?? m };
      }
      const body = await res.text();
      if (res.status === 429 && /PerDay/i.test(body)) {
        exhausted.add(m);
        console.log(`   … ${m}: cupo diario agotado, paso al siguiente modelo`);
        break;
      }
      if ([429, 500, 503].includes(res.status)) {
        const wait = 5000 * (attempt + 1);
        console.log(`   … ${m} HTTP ${res.status}, reintento en ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      throw new Error(`Gemini ${m} HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
  }
  throw new QuotaExhausted('Todos los modelos agotaron su cupo diario. Vuelve a ejecutar mañana (o activa facturación).');
}

/* ------------------------------ Generación ------------------------------ */

const store = existsSync(outFile)
  ? JSON.parse(readFileSync(outFile, 'utf8'))
  : { generatedWith: model, note: 'Contenido generado con IA para revisión. Cambia "approved" a true en las islas que apruebes.', islands: [] };
const save = () => {
  mkdirSync(dirname(outFile), { recursive: true });
  store.islands.sort((a, b) => a.island_id.localeCompare(b.island_id));
  writeFileSync(outFile, JSON.stringify(store, null, 2));
};

const jobs = [];
for (const lv of bank.levels) {
  const level = lv.level_code;
  if (onlyLevel && level !== onlyLevel) continue;
  const sample = lv.sample_island;
  (map[level]?.islands ?? []).forEach((title, idx) => {
    const nn = String(idx + 1).padStart(2, '0');
    const island_id = `${level}-ISL-${nn}`;
    if (island_id === sample.island_id || sample.title.toLowerCase().startsWith(title.toLowerCase().slice(0, 12))) return;
    if (store.islands.some((g) => g.island_id === island_id)) return;
    jobs.push({ level, lang: lv.instructional_language, title, nn, island_id, sample, theme: map[level].theme });
  });
}
const todo = jobs.slice(0, limit);
console.log(`Modelo ${model} · ${todo.length} islas por generar (${store.islands.length} ya generadas) · concurrencia ${concurrency}`);

const usedByLevel = {};
for (const lv of bank.levels) usedByLevel[lv.level_code] = lv.sample_island.lexical_toolbox.map((l) => l.term);
for (const g of store.islands) usedByLevel[g.level].push(...g.island.lexical_toolbox.map((l) => l.term));

// Las islas de un mismo nivel se generan en orden (para no repetir vocabulario); los niveles en paralelo.
const queues = {};
for (const j of todo) (queues[j.level] ??= []).push(j);
const levelsQueue = Object.values(queues);
let done = 0;
let failed = 0;

async function runLevel(queue) {
  for (const job of queue) {
    const spanish = job.lang.toLowerCase().startsWith('span');
    const started = Date.now();
    let feedback = '';
    let island = null;
    let problems = [];
    for (let attempt = 0; attempt < 2 && !island; attempt++) {
      try {
        const out = await callGemini(
          systemPrompt(job.level, job.lang),
          userPrompt(job.level, job.title, job.nn, job.theme, job.sample, usedByLevel[job.level]) + feedback
        );
        job.model = out.model;
        const candidate = IslandSchema.parse(out.json);
        problems = validate(candidate, job.level, spanish, usedByLevel[job.level]);
        if (problems.length && attempt === 0) {
          feedback = `\n\nYour previous attempt had these problems, fix them all: ${problems.join('; ')}`;
          continue;
        }
        island = candidate;
      } catch (err) {
        if (err instanceof QuotaExhausted) throw err;
        problems = [String(err.message ?? err).slice(0, 160)];
      }
    }
    if (!island) {
      failed++;
      console.log(`✗ ${job.island_id} ${job.title}: ${problems.join(' | ')}`);
      continue;
    }
    const pre = job.island_id.replace('-ISL-', '-I');
    const full = {
      island_id: job.island_id,
      title: job.title,
      topic_context: island.topic_context,
      speaking_module: { prompts: island.speaking_module.prompts.map((p, i) => ({ id: `${pre}-SPK-0${i + 1}`, ...p })) },
      listening_module: { id: `${pre}-LIS-01`, ...island.listening_module },
      writing_module: { id: `${pre}-WRT-01`, ...island.writing_module },
      spanglish_error_lab: island.spanglish_error_lab.map((e, i) => ({ error_id: `${pre}-SPA-0${i + 1}`, ...e })),
      lexical_toolbox: island.lexical_toolbox,
    };
    store.islands.push({ level: job.level, island_id: job.island_id, title: job.title, model: job.model, approved: false, warnings: problems, island: full });
    usedByLevel[job.level].push(...island.lexical_toolbox.map((l) => l.term));
    save();
    done++;
    console.log(
      `✓ ${job.island_id} ${job.title} (${((Date.now() - started) / 1000).toFixed(0)} s)${problems.length ? ` · avisos: ${problems.join(' | ')}` : ''} [${done}/${todo.length}]`
    );
  }
}

// Concurrencia: como máximo `concurrency` niveles a la vez.
const pool = [...levelsQueue];
let stopped = null;
await Promise.all(
  Array.from({ length: Math.min(concurrency, pool.length) }, async () => {
    while (pool.length && !stopped) {
      try {
        await runLevel(pool.shift());
      } catch (err) {
        if (err instanceof QuotaExhausted) stopped = err.message;
        else throw err;
      }
    }
  })
);
if (stopped) console.log(`⏸ ${stopped}`);
console.log(`Listo: ${done} generadas, ${failed} con error, ${store.islands.length} en total. Archivo: ${outFile}`);
