import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../i18n';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { Glyph } from '../components/Glyph';
import { OptionButton } from '../components/MultipleChoice';
import { AnimatedBar, PressableScale, Reveal } from '../components/motion';
import { ShareButton } from '../components/ShareCard';
import { Button, ScreenHeader } from '../components/ui';
import { eventMissions, eventTimeLeft, type EventWord } from '../game/events';
import { findFurniture } from '../game/pet';
import { speakEnglishPhrase } from '../services/speech';
import { THEME, TYPE } from '../theme/colors';

/** Evento semanal: banner, misiones, palabras con mini-quiz y premio exclusivo. */
export function EventScreen() {
  const { goBack, eventState, openScreen, claimEventReward } = useGame();
  const { event, progress } = eventState;
  const [notice, setNotice] = useState<string | null>(null);
  const left = eventTimeLeft();
  const missions = eventMissions(event, progress);
  const reward = findFurniture(event.rewardFurnitureId);
  const allDone = missions.every((m) => m.done);

  return (
    <View style={styles.screen}>
      <ScreenHeader title={event.titleEs} subtitle={`Evento semanal · quedan ${left.days} d ${left.hours} h`} onBack={goBack} />
      <Reveal index={0}>
        <LinearGradient colors={event.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <Glyph name={event.glyph} size={78} tile="#FFFFFF" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.bannerTitle}>{event.titleEs}</Text>
            <Text style={styles.bannerSub}>{event.taglineEs}</Text>
          </View>
        </LinearGradient>
      </Reveal>

      <Reveal index={1}>
        <View style={[styles.card, { backgroundColor: event.soft }]}>
          <Text style={TYPE.title2}>Misiones</Text>
          {missions.map((m) => (
            <View key={m.id} style={styles.mission}>
              <Glyph name={m.done ? 'check' : m.glyph} size={34} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.missionText, m.done && { color: THEME.green }]}>{m.labelEs}</Text>
                <AnimatedBar value={m.progress} colors={m.done ? ['#5EDB8F', '#22B567'] : event.colors} height={7} />
              </View>
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Carrera del evento" icon="flag" variant="primary" onPress={() => openScreen({ name: 'minigame', game: 'event-rush' })} style={{ flex: 1 }} />
            <Button label="Speaking" icon="mic" variant="secondary" onPress={() => openScreen({ name: 'speaking' })} style={{ flex: 1 }} />
          </View>
        </View>
      </Reveal>

      <Reveal index={2}>
        <View style={styles.rewardCard}>
          <Glyph name={reward?.glyph ?? 'gift'} size={64} tile="#FFFFFF" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={TYPE.caption}>Premio exclusivo</Text>
            <Text style={TYPE.headline}>{reward?.nameEs ?? 'Mueble sorpresa'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Glyph name="coin" size={16} />
              <Text style={styles.small}>+{event.rewardCoins} monedas · solo esta semana</Text>
            </View>
          </View>
          <Button
            label={progress.claimed ? 'Tuyo' : 'Abrir'}
            icon={progress.claimed ? 'checkmark' : 'gift'}
            variant={allDone && !progress.claimed ? 'gold' : 'secondary'}
            disabled={progress.claimed}
            small
            onPress={() => {
              const res = claimEventReward();
              setNotice(res.ok ? `¡${reward?.nameEs ?? 'Premio'} ya está en tu casa!` : res.reason ?? null);
            }}
          />
        </View>
        {notice ? <Text style={[styles.small, { color: THEME.blue, marginTop: 6 }]}>{notice}</Text> : null}
      </Reveal>

      <Text style={TYPE.title2}>Palabras del evento</Text>
      {event.words.map((w, i) => (
        <Reveal key={w.id} index={3 + i}>
          <WordCard word={w} learned={progress.learned.includes(w.id)} others={event.words} />
        </Reveal>
      ))}
    </View>
  );
}

function WordCard({ word, learned, others }: { word: EventWord; learned: boolean; others: EventWord[] }) {
  const { locale } = useAppState();
  const { learnEventWord } = useGame();
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(() => {
    const pool = others.filter((o) => o.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 2).map((o) => o.meaningEs);
    return [word.meaningEs, ...pool].sort(() => Math.random() - 0.5);
  }, [word, others]);

  return (
    <View style={[styles.card, learned && { borderColor: THEME.green, borderBottomColor: '#168A4C' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.term}>{word.term}</Text>
        {learned ? <Glyph name="check" size={24} /> : null}
        <View style={{ flex: 1 }} />
        <PressableScale onPress={() => speakEnglishPhrase(word.term, locale)} hapticKind="select">
          <Glyph name="headphones" size={30} />
        </PressableScale>
      </View>
      <Text style={TYPE.body}>{word.definitionEn}</Text>
      <PressableScale onPress={() => speakEnglishPhrase(word.example, locale)} style={styles.example}>
        <Text style={styles.exampleText}>“{word.example}”</Text>
      </PressableScale>
      {learned ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.small, { color: THEME.green }]}>Aprendida · {word.meaningEs}</Text>
          <ShareButton data={{ kind: 'word', term: word.term, meaningEs: word.meaningEs, example: word.example }} />
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <Text style={TYPE.caption}>¿Qué significa?</Text>
          {options.map((o) => {
            const isAns = o === word.meaningEs;
            const state = picked === null ? 'idle' : picked === o ? (isAns ? 'right' : 'wrong') : isAns ? 'reveal' : 'idle';
            return (
              <OptionButton
                key={o}
                label={o}
                state={state}
                disabled={picked !== null && picked === word.meaningEs}
                onPress={() => {
                  setPicked(o);
                  if (isAns) setTimeout(() => learnEventWord(word.id), 700);
                  else setTimeout(() => setPicked(null), 1100);
                }}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 130, gap: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(30,36,54,0.15)',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(30,36,54,0.25)',
  },
  bannerTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.6 },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.95)', fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 5,
  },
  mission: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  missionText: { fontSize: 14, fontWeight: '800', color: THEME.ink },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF8E6',
    borderRadius: 24,
    padding: 14,
    borderWidth: 2,
    borderColor: '#F6D98B',
    borderBottomWidth: 5,
    borderBottomColor: '#E9C46A',
  },
  small: { fontSize: 12, fontWeight: '700', color: THEME.ink2 },
  term: { fontSize: 24, fontWeight: '900', color: THEME.ink, letterSpacing: -0.5 },
  example: { backgroundColor: THEME.fill, borderRadius: 14, padding: 12 },
  exampleText: { fontSize: 15, fontStyle: 'italic', color: THEME.ink },
});
