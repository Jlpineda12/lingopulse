#!/usr/bin/env node
/**
 * Extrae los textos en español de la app (interfaz + contenido compartido) y lista los que
 * todavía no tienen traducción al inglés en src/i18n/en.json.
 *
 *   node apps/mobile/scripts/i18n-extract.mjs            → resumen de faltantes
 *   node apps/mobile/scripts/i18n-extract.mjs --json F   → guarda los faltantes en F para traducirlos
 *
 * Tipos de texto:
 *   - literal: "Corregir mi texto"            → clave exacta
 *   - pattern: `Nivel ${n} · ${x} XP`         → clave con {0}, {1}… ("Nivel {0} · {1} XP")
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const require = createRequire(join(root, 'package.json'));
const ts = require('typescript');

const SOURCES = [
  join(root, 'apps/mobile/App.tsx'),
  join(root, 'apps/mobile/src'),
  join(root, 'packages/shared/src/practice'),
  join(root, 'packages/shared/src/curriculum'),
];
const SKIP = [/\.test\.ts$/, /experience-bank\.data\.ts$/, /\/i18n\//];

const SPANISH_WORDS =
  /\b(el|la|los|las|de|del|para|con|por|que|qué|tu|tus|un|una|unos|es|está|son|al|sin|más|muy|hoy|cada|cómo|como|aquí|ya|y|o|en|se|te|lo|le|mi|mis|su|sus|nivel|isla|islas|racha|monedas|estrellas|palabra|palabras|frase|grabar|escribe|toca|elige|ver|volver|siguiente|listo|ahora|días|día|semana|mascota|casa|ropa|premio|premios|cuidar|estilo|correcto|incorrecto|intenta|aprende|practica|juega|abrir|cerrar|guardar|sigue|empieza|bien|casi|repite)\b/i;
const ENGLISH_HINT = /\b(the|you|your|and|with|is|are|this|that|what|how|of|to|in|it|for)\b/gi;

function isSpanish(text) {
  const t = text.trim();
  if (t.length < 2 || !/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(t)) return false;
  if (/^[\w./@:-]+$/.test(t) && !/[áéíóúñ]/i.test(t) && !SPANISH_WORDS.test(t)) return false; // ids, rutas, claves
  if (/[áéíóúñ¿¡]/i.test(t)) return true;
  const es = (t.match(new RegExp(SPANISH_WORDS.source, 'gi')) ?? []).length;
  const en = (t.match(ENGLISH_HINT) ?? []).length;
  return es > 0 && es >= en;
}

function walk(p, out) {
  const st = statSync(p);
  if (st.isDirectory()) for (const f of readdirSync(p)) walk(join(p, f), out);
  else if (/\.(ts|tsx)$/.test(p) && !SKIP.some((r) => r.test(p))) out.push(p);
  return out;
}

const found = new Map(); // key → { kind, files:Set }
function add(key, kind, file) {
  const k = key.replace(/\s+/g, ' ').trim();
  if (!k || !isSpanish(k.replace(/\{\d+\}/g, ''))) return;
  if (!found.has(k)) found.set(k, { kind, files: new Set() });
  found.get(k).files.add(file.replace(root + '/', ''));
}

for (const file of SOURCES.flatMap((s) => walk(s, []))) {
  const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // Claves de objetos/propiedades de estilo no son texto visible.
      if (!(ts.isPropertyAssignment(node.parent) && node.parent.name === node)) add(node.text, 'literal', file);
    } else if (ts.isTemplateExpression(node)) {
      let key = node.head.text;
      node.templateSpans.forEach((span, i) => (key += `{${i}}` + span.literal.text));
      add(key, 'pattern', file);
    } else if (ts.isJsxText(node)) {
      add(node.text, 'literal', file);
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
}

const dictFile = join(root, 'apps/mobile/src/i18n/en.json');
const dict = existsSync(dictFile) ? JSON.parse(readFileSync(dictFile, 'utf8')) : {};
const missing = [...found.entries()].filter(([k]) => !(k in dict));
console.log(`Textos en español: ${found.size} · traducidos: ${found.size - missing.length} · faltan: ${missing.length}`);
const outIdx = process.argv.indexOf('--json');
if (outIdx > 0) {
  const out = Object.fromEntries(missing.map(([k, v]) => [k, { kind: v.kind, files: [...v.files].slice(0, 3) }]));
  writeFileSync(process.argv[outIdx + 1], JSON.stringify(out, null, 1));
  console.log(`Faltantes guardados en ${process.argv[outIdx + 1]}`);
} else {
  for (const [k] of missing.slice(0, 40)) console.log('  · ' + k.slice(0, 100));
}
