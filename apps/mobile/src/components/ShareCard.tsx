import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { useGame } from '../context/GameContext';
import { displayPetName } from '../game/pet';
import { THEME, TYPE } from '../theme/colors';
import { Glyph } from './Glyph';
import { haptic, PressableScale, Reveal } from './motion';
import { Button } from './ui';

/**
 * Tarjetas para compartir en redes (Instagram, TikTok, WhatsApp…):
 * en iOS/Android se captura como imagen y se abre el menú del sistema;
 * en web se usa el menú de compartir del navegador o se copia el texto.
 */

export type ShareKind =
  | { kind: 'streak'; days: number }
  | { kind: 'word'; term: string; meaningEs: string; example?: string }
  | { kind: 'league'; rank: number; leagueName: string }
  | { kind: 'house'; houseName: string };

const THEMES: Record<ShareKind['kind'], { colors: readonly [string, string]; glyph: string }> = {
  streak: { colors: ['#FFB547', '#FF3B30'], glyph: 'flame' },
  word: { colors: ['#6CB8FF', '#5E35E8'], glyph: 'sparkle' },
  league: { colors: ['#FFE082', '#D99B26'], glyph: 'trophy' },
  house: { colors: ['#4FD8A8', '#1FA87A'], glyph: 'house' },
};

function shareText(data: ShareKind, petName: string): string {
  switch (data.kind) {
    case 'streak':
      return `🔥 ¡Llevo ${data.days} días seguidos practicando inglés con ${petName} en LingoPulse!`;
    case 'word':
      return `✨ Hoy ${petName} y yo aprendimos "${data.term}" (${data.meaningEs}) en LingoPulse.`;
    case 'league':
      return `🏆 Quedé #${data.rank} en la ${data.leagueName} de LingoPulse esta semana.`;
    case 'house':
      return `🏠 ${petName} ya vive en ${data.houseName} gracias a mi práctica de inglés en LingoPulse.`;
  }
}

function CardBody({ data }: { data: ShareKind }) {
  const { pet, progress } = useGame();
  const theme = THEMES[data.kind];
  const petName = displayPetName(pet.name);
  return (
    <LinearGradient colors={theme.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.cardTop}>
        <Glyph name="sparkle" size={20} />
        <Text style={styles.brand}>LingoPulse</Text>
      </View>
      <View style={styles.hero}>
        <Glyph name={`species-${pet.species}`} size={110} />
        <View style={styles.badge}>
          <Glyph name={theme.glyph} size={40} />
        </View>
      </View>
      {data.kind === 'streak' ? (
        <>
          <Text style={styles.big}>{data.days}</Text>
          <Text style={styles.title}>{data.days === 1 ? 'día de racha' : 'días de racha'}</Text>
        </>
      ) : data.kind === 'word' ? (
        <>
          <Text style={styles.word}>{data.term}</Text>
          <Text style={styles.title}>{data.meaningEs}</Text>
          {data.example ? <Text style={styles.example}>“{data.example}”</Text> : null}
        </>
      ) : data.kind === 'league' ? (
        <>
          <Text style={styles.big}>#{data.rank}</Text>
          <Text style={styles.title}>{data.leagueName}</Text>
        </>
      ) : (
        <>
          <Text style={styles.word}>{data.houseName}</Text>
          <Text style={styles.title}>Nuevo hogar desbloqueado</Text>
        </>
      )}
      <Text style={styles.footer}>
        {petName} · Nivel {progress.level} · aprendiendo inglés cada día
      </Text>
    </LinearGradient>
  );
}

export function ShareSheet({ data, onClose }: { data: ShareKind | null; onClose: () => void }) {
  const { pet } = useGame();
  const ref = useRef<View>(null);
  const [status, setStatus] = useState<string | null>(null);
  if (!data) return null;
  const text = shareText(data, displayPetName(pet.name));

  const share = async () => {
    haptic('medium');
    try {
      if (Platform.OS !== 'web') {
        const uri = await captureRef(ref, { format: 'png', quality: 1 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { dialogTitle: 'Compartir mi progreso', mimeType: 'image/png' });
          return;
        }
      }
      const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: { text: string }) => Promise<void> }) : null;
      if (nav?.share) {
        await nav.share({ text });
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(text);
        setStatus('Texto copiado: pégalo en tu red social favorita.');
      }
    } catch {
      setStatus('No se pudo compartir en este dispositivo.');
    }
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => undefined} style={styles.sheet}>
          <Reveal index={0}>
            <View ref={ref} collapsable={false}>
              <CardBody data={data} />
            </View>
          </Reveal>
          <Text style={[TYPE.footnote, { textAlign: 'center' }]}>{text}</Text>
          {status ? <Text style={[TYPE.footnote, { color: THEME.green, textAlign: 'center' }]}>{status}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cerrar" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            <Button label="Compartir" icon="share-social" onPress={share} style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Botón pequeño "Compartir" que abre la tarjeta. */
export function ShareButton({ data, label = 'Compartir' }: { data: ShareKind; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PressableScale onPress={() => setOpen(true)} hapticKind="select" style={styles.shareBtn}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Glyph name="share" size={20} />
          <Text style={styles.shareBtnText}>{label}</Text>
        </View>
      </PressableScale>
      <ShareSheet data={open ? data : null} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,20,36,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 30, padding: 16, gap: 12 },
  card: { borderRadius: 26, padding: 20, alignItems: 'center', gap: 4, aspectRatio: 0.8, justifyContent: 'center' },
  cardTop: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 },
  hero: { width: 150, height: 130, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(30,36,54,0.12)',
  },
  big: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, lineHeight: 70 },
  word: { fontSize: 34, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -1 },
  title: { fontSize: 17, fontWeight: '800', color: 'rgba(255,255,255,0.95)', textAlign: 'center' },
  example: { fontSize: 14, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
  footer: { position: 'absolute', bottom: 14, fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  shareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 4,
  },
  shareBtnText: { fontSize: 13, fontWeight: '800', color: THEME.ink },
});
