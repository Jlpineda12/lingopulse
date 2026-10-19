#!/usr/bin/env node
/**
 * Importa el "Banco de Aprendizaje Experiencial" (BancodeVocabulario.txt en la raíz del proyecto)
 * y genera src/practice/experience-bank.data.ts con los datos tal cual.
 * La conversión a los formatos de la app vive en src/practice/experience-bank.ts.
 *
 * Uso (desde la raíz del proyecto):
 *   node packages/shared/scripts/import-experience-bank.mjs [ruta/al/banco.txt]
 *
 * Además incluye las islas generadas con IA (packages/shared/data/generated-islands.json)
 * que estén marcadas con "approved": true.
 *
 * Acepta tanto el archivo original ({"response": "...markdown con un bloque ```json```..."})
 * como un JSON plano con { "levels": [...] }.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const input = resolve(process.argv[2] ?? resolve(root, 'BancodeVocabulario.txt'));
const output = resolve(here, '../src/practice/experience-bank.data.ts');

const raw = JSON.parse(readFileSync(input, 'utf8'));
let bank = raw;
let islandMap = {};
if (typeof raw.response === 'string') {
  const md = raw.response;
  const block = md.match(/```json\n([\s\S]*?)\n```/);
  if (!block) throw new Error('No encontré el bloque ```json``` dentro de "response".');
  bank = JSON.parse(block[1]);
  // Mapa de islas: líneas "* **NIVEL A1 (Subtítulo):** 01. Título | 02. Título | ..."
  for (const m of md.matchAll(/\*\s+\*\*NIVEL (A1|A2|B1|B2|C1|C2) \(([^)]*)\):\*\*\s*(.+)/g)) {
    const titles = m[3]
      .split('|')
      .map((t) => t.replace(/^\s*\d+\.\s*/, '').replace(/\.\s*$/, '').trim())
      .filter(Boolean);
    islandMap[m[1]] = { theme: m[2].trim(), islands: titles };
  }
}
if (!Array.isArray(bank.levels)) throw new Error('El banco no tiene "levels".');

const generatedFile = resolve(here, '../data/generated-islands.json');
const generated = existsSync(generatedFile) ? JSON.parse(readFileSync(generatedFile, 'utf8')).islands ?? [] : [];
const approved = generated.filter((g) => g.approved === true).map((g) => ({ level: g.level, island: g.island }));

const header = `/**
 * GENERADO por packages/shared/scripts/import-experience-bank.mjs — no editar a mano.
 * Fuente: ${input.split('/').pop()} (${bank.levels.length} niveles).
 */
/* eslint-disable */
`;
const body =
  `export const EXPERIENCE_BANK_RAW = ${JSON.stringify(bank, null, 2)} as const;\n\n` +
  `export const EXPERIENCE_ISLAND_MAP_RAW: Record<string, { theme: string; islands: string[] }> = ${JSON.stringify(islandMap, null, 2)};\n\n` +
  `/** Islas generadas con IA y aprobadas (${approved.length} de ${generated.length}). */\n` +
  `export const EXPERIENCE_EXTRA_ISLANDS_RAW = ${JSON.stringify(approved, null, 2)};\n`;
writeFileSync(output, header + body);

const count = (k) => bank.levels.reduce((a, l) => a + (k(l.sample_island) ?? 0), 0);
console.log(`Banco importado → ${output}`);
console.log(`  islas generadas con IA: ${approved.length} aprobadas de ${generated.length}`);
console.log(
  `  niveles ${bank.levels.length} · speaking ${count((i) => i.speaking_module?.prompts?.length)} · listening ${count((i) => (i.listening_module ? 1 : 0))} · writing ${count((i) => (i.writing_module ? 1 : 0))} · spanglish ${count((i) => i.spanglish_error_lab?.length)} · léxico ${count((i) => i.lexical_toolbox?.length)} · islas en el mapa ${Object.values(islandMap).reduce((a, v) => a + v.islands.length, 0)}`
);
