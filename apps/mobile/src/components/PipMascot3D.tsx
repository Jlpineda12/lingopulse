import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { SHADOW, THEME, TYPE } from '../theme/colors';
import { PressableScale } from './motion';
import { Pet3D } from './Pet3D';

const PET_MESSAGES_ES = [
  '¡Eso hace cosquillas! Recuerda: con pronombres decimos "put it off".',
  'Cada segundo que hablas en inglés hace brillar mi orbe de voz.',
  'Cambia UK/US arriba y verás cómo cambio de sombrero y de acento.',
];

/** Mascota de la Ruta guiada: tu compañero con boina (UK) o gorra (US). */
export function PipMascot3D() {
  const { locale, pipMessage, setPipMessage, pipIsSpeaking, speakWithPip, lesson } = useAppState();
  const { pet, mood, stats, petThePet } = useGame();
  const [count, setCount] = useState(0);
  const isUK = locale === 'en-GB';

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Pet3D
          config={{ ...pet, accessory: isUK ? 'beret' : 'cap' }}
          mood={mood}
          energy={stats.energy / 100}
          speaking={pipIsSpeaking}
          size={140}
          onTap={() => {
            petThePet();
            setPipMessage(PET_MESSAGES_ES[count % PET_MESSAGES_ES.length]!);
            setCount((c) => c + 1);
          }}
        />
        <PressableScale onPress={() => speakWithPip(lesson.publicContent.anatomy.modelSentence)} style={styles.bubble}>
          <View style={styles.bubbleHeader}>
            <Text style={styles.name}>
              {pet.name} · {isUK ? 'London' : 'New York'}
            </Text>
            <Ionicons name="volume-high" size={14} color={THEME.blue} />
          </View>
          <Text style={styles.message}>{pipMessage}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: 26,
    padding: 12,
    gap: 6,
    ...SHADOW.card,
  },
  bubble: { flex: 1, backgroundColor: THEME.fill, borderRadius: 18, padding: 12, gap: 6 },
  bubbleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 12, fontWeight: '600', color: THEME.ink2 },
  message: { ...TYPE.callout, fontWeight: '500' },
});
