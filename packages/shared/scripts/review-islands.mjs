#!/usr/bin/env node
/**
 * Revisión de las islas generadas con IA (packages/shared/data/generated-islands.json).
 *
 *   node packages/shared/scripts/review-islands.mjs render                 → docs/06_revision_islas_generadas.md
 *   node packages/shared/scripts/review-islands.mjs approve --all          → aprueba todas
 *   node packages/shared/scripts/review-islands.mjs approve A1-ISL-01,B2-ISL-03
 *   node packages/shared/scripts/review-islands.mjs unapprove C2-ISL-07    → la saca de la app
 *   node packages/shared/scripts/review-islands.mjs discard C2-ISL-07      → la borra (se regenera con generate-islands)
 *
 * approve / unapprove vuelven a ejecutar el importador para que la app quede actualizada.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const dataFile = resolve(here, '../data/generated-islands.json');
const docFile = resolve(root, 'docs/06_revision_islas_generadas.md');
const [cmd, target] = process.argv.slice(2);

const store = JSON.parse(readFileSync(dataFile, 'utf8'));
const save = () => writeFileSync(dataFile, JSON.stringify(store, null, 2));
const ids = (t) =>
  t === '--all' ? store.islands.map((g) => g.island_id) : String(t ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const reimport = () => execFileSync(process.execPath, [resolve(here, 'import-experience-bank.mjs')], { stdio: 'inherit' });

function render() {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const out = [];
  out.push('# Revisión de islas generadas con IA (Gemini)');
  out.push('');
  out.push(
    `Generadas: **${store.islands.length}** · aprobadas: **${store.islands.filter((g) => g.approved).length}**. ` +
      'Este contenido NO aparece en la app hasta que se aprueba. Para aprobar, dile a Claude qué islas aprobar ' +
      '(o "todas"), o ejecuta `node packages/shared/scripts/review-islands.mjs approve --all`.'
  );
  out.push('');
  out.push('Qué revisar: que el inglés sea natural y correcto, que las respuestas del listening sean las correctas, que los errores de Spanglish sean reales y que el vocabulario corresponda al nivel.');
  out.push('');
  out.push('| Nivel | ID | Isla | Estado | Avisos |');
  out.push('|---|---|---|---|---|');
  for (const g of store.islands) {
    out.push(`| ${g.level} | ${g.island_id} | ${g.title} | ${g.approved ? '✅ aprobada' : '⏳ pendiente'} | ${(g.warnings ?? []).join('; ') || '—'} |`);
  }
  for (const level of levels) {
    const list = store.islands.filter((g) => g.level === level);
    if (!list.length) continue;
    out.push('', `## Nivel ${level}`, '');
    for (const g of list) {
      const i = g.island;
      out.push(`### ${g.island_id} · ${g.title} ${g.approved ? '✅' : '⏳'}`, '');
      out.push(`*${i.topic_context}*`, '');
      out.push('**Speaking**', '');
      for (const p of i.speaking_module.prompts) {
        out.push(`- **${p.goal}** — ${p.instructions}`);
        out.push(`  - Frases: ${p.target_phrases.map((t) => `\`${t}\``).join(', ')}`);
        out.push(`  - Modelo: _${p.model_response}_`);
      }
      out.push('', '**Listening**', '', '```', i.listening_module.audio_script, '```', '');
      for (const q of i.listening_module.comprehension_questions) {
        out.push(`- ${q.question}`);
        for (const o of q.options) out.push(`  - ${o === q.correct_answer ? `**${o}** ✔` : o}`);
        out.push(`  - _${q.explanation}_`);
      }
      const w = i.writing_module;
      out.push('', `**Writing** · ${w.task_type}`, '', w.instructions, '', `Estructuras: ${w.scaffolding_structures.map((s) => `\`${s}\``).join(' · ')}`, '');
      out.push('**Spanglish**', '');
      for (const e of i.spanglish_error_lab) out.push(`- ❌ ${e.incorrect_sentence} → ✅ ${e.native_correction}  \n  _${e.spanish_interference}_`);
      out.push('', '**Vocabulario**', '', '| Término | Tipo | IPA | Explicación | Ejemplo |', '|---|---|---|---|---|');
      for (const l of i.lexical_toolbox) {
        const cell = (t) => String(t).replace(/\|/g, '/').replace(/\n/g, ' ');
        out.push(`| **${cell(l.term)}** | ${cell(l.type)} | ${cell(l.ipa)} | ${cell(l.explanation)} | ${cell(l.example_1)} |`);
      }
      out.push('');
    }
  }
  writeFileSync(docFile, out.join('\n') + '\n');
  console.log(`Documento de revisión → ${docFile} (${store.islands.length} islas)`);
}

if (cmd === 'render') render();
else if (cmd === 'approve' || cmd === 'unapprove') {
  const set = new Set(ids(target));
  let n = 0;
  for (const g of store.islands) if (set.has(g.island_id)) (g.approved = cmd === 'approve'), n++;
  save();
  console.log(`${cmd === 'approve' ? 'Aprobadas' : 'Retiradas'}: ${n}`);
  reimport();
  render();
} else if (cmd === 'discard') {
  const set = new Set(ids(target));
  const before = store.islands.length;
  store.islands = store.islands.filter((g) => !set.has(g.island_id));
  save();
  console.log(`Descartadas: ${before - store.islands.length} (se regeneran con generate-islands.mjs)`);
  reimport();
  render();
} else {
  console.log('Uso: review-islands.mjs render | approve --all|IDs | unapprove IDs | discard IDs');
}
