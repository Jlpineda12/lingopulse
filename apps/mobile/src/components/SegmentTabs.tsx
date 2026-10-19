import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { Glyph } from './Glyph';
import { PressableScale } from './motion';
import { THEME } from '../theme/colors';

export interface SegmentItem<T extends string> {
  id: T;
  label: string;
  glyph?: string;
  /** Punto rojo de "algo pendiente aquí". */
  dot?: boolean;
  /** Paso completado (muestra un check verde). */
  done?: boolean;
}

/**
 * Selector de secciones tipo Apple: muestra una sola sección a la vez para que
 * las pantallas no se vean sobrecargadas.
 */
export function SegmentTabs<T extends string>({
  items,
  value,
  onChange,
  compact = false,
}: {
  items: SegmentItem<T>[];
  value: T;
  onChange: (id: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.bar}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <PressableScale
            key={it.id}
            hapticKind="select"
            onPress={() => onChange(it.id)}
            style={[styles.tab, compact && styles.tabCompact, active && styles.tabActive]}
          >
            <View style={[styles.inner, compact && { flexDirection: 'row', gap: 6 }]}>
              {it.glyph ? (
                <View>
                  <Glyph name={it.done ? 'check' : it.glyph} size={compact ? 20 : 26} />
                  {it.dot ? <View style={styles.dot} /> : null}
                </View>
              ) : null}
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {it.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 4,
  },
  tab: { flex: 1, borderRadius: 15, paddingVertical: 7, borderWidth: 2, borderColor: 'transparent' },
  tabCompact: { paddingVertical: 8 },
  tabActive: { backgroundColor: '#EAF3FF', borderColor: THEME.blue },
  inner: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 12, fontWeight: '800', color: THEME.ink2 },
  labelActive: { color: THEME.blue, fontWeight: '900' },
  dot: {
    position: 'absolute',
    top: -2,
    right: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.red,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
