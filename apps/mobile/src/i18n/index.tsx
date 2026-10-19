import React, { forwardRef, useSyncExternalStore } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import type { UiLanguage } from '@lingopulse/shared';
import EN from './en.json';

/**
 * Idioma de la interfaz según el nivel (A1–A2 español, B1+ inglés).
 * Los textos se escriben en español en el código; en modo inglés se traducen con en.json:
 *  - claves exactas ("Corregir mi texto" → "Check my text");
 *  - claves con variables ("Nivel {0} · {1} XP" → "Level {0} · {1} XP").
 * Para encontrar textos nuevos sin traducir: node apps/mobile/scripts/i18n-extract.mjs
 */

let current: UiLanguage = 'es';
const listeners = new Set<() => void>();

export function setUiLanguage(lang: UiLanguage) {
  if (lang === current) return;
  current = lang;
  listeners.forEach((l) => l());
}

export function getUiLanguage(): UiLanguage {
  return current;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Re-renderiza el componente cuando cambia el idioma. */
export function useUiLanguage(): UiLanguage {
  return useSyncExternalStore(subscribe, () => current, () => current);
}

/* ------------------------------ Diccionario ------------------------------ */

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
const DICT = EN as Record<string, string>;
const exact = new Map<string, string>();
const patterns: Array<{ re: RegExp; to: string; order: number[] }> = [];
for (const [es, en] of Object.entries(DICT)) {
  const key = norm(es);
  if (/\{\d+\}/.test(key)) {
    const order: number[] = [];
    const source = key
      .split(/(\{\d+\})/)
      .map((p) => {
        const m = p.match(/^\{(\d+)\}$/);
        if (m) {
          order.push(Number(m[1]));
          return '([\\s\\S]+?)';
        }
        return p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('');
    patterns.push({ re: new RegExp(`^${source}$`), to: en, order });
  } else {
    exact.set(key, en);
  }
}
// Las claves más largas primero: evita que un patrón genérico ("{0} días") gane a uno específico.
patterns.sort((a, b) => b.re.source.length - a.re.source.length);

const cache = new Map<string, string>();

/** Traduce un texto al idioma actual (en español lo deja igual). */
export function tr(text: string): string {
  if (current === 'es' || !text) return text;
  let hit = cache.get(text);
  if (hit === undefined) {
    hit = translate(text);
    if (cache.size > 5000) cache.clear();
    cache.set(text, hit);
  }
  return hit;
}

function translate(text: string): string {
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  const core = norm(m[2]!);
  if (!core) return text;
  const wrap = (t: string) => m[1] + t + m[3];
  const hit = exact.get(core);
  if (hit !== undefined) return wrap(hit);

  // Textos compuestos ("Arena: Sesión 1…", "B2 · Intermedio Alto"): se traduce cada pedazo.
  // Si todos los pedazos tienen traducción se usa esto antes que un patrón genérico.
  const parts = core.split(/( · |: )/);
  let partial: string | null = null;
  if (parts.length > 1) {
    let complete = true;
    const out = parts
      .map((p, i) => {
        if (i % 2) return p;
        let t = p;
        if (parts[i + 1] === ': ') {
          const withColon = tr(p + ':'); // claves guardadas como "Clima de Isla:"
          if (withColon !== p + ':') t = withColon.replace(/:$/, '');
        }
        if (t === p) t = tr(p);
        if (t === p && /[a-záéíóúñ]{3}/i.test(p) && /[áéíóúñ¿¡]|\b(de|la|el|los|las|con|para|del|y)\b/i.test(p)) complete = false;
        return t;
      })
      .join('');
    if (out !== core) {
      if (complete) return wrap(out);
      partial = out;
    }
  }

  for (const p of patterns) {
    const r = core.match(p.re);
    if (r) {
      const values: Record<number, string> = {};
      p.order.forEach((idx, i) => (values[idx] = tr(r[i + 1]!)));
      return wrap(p.to.replace(/\{(\d+)\}/g, (_, n) => values[Number(n)] ?? ''));
    }
  }
  return partial !== null ? wrap(partial) : text;
}

function translateChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === 'string') return tr(children);
  if (Array.isArray(children)) {
    // "Nivel {x} de {y}" en JSX llega en pedazos: primero se intenta la frase completa.
    if (children.every((c) => typeof c === 'string' || typeof c === 'number')) {
      const whole = children.join('');
      const t = tr(whole);
      if (t !== whole) return t;
    }
    return children.map((c) => (typeof c === 'string' ? tr(c) : c));
  }
  return children;
}

/* ------------------------- Componentes traducidos ------------------------ */

export type Text = RNText;
export const Text = forwardRef<RNText, TextProps>(function Text({ children, ...rest }, ref) {
  useUiLanguage();
  return (
    <RNText ref={ref} {...rest}>
      {translateChildren(children)}
    </RNText>
  );
});

export type TextInput = RNTextInput;
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput({ placeholder, ...rest }, ref) {
  useUiLanguage();
  return <RNTextInput ref={ref} placeholder={placeholder ? tr(placeholder) : placeholder} {...rest} />;
});
