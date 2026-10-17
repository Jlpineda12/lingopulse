import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  alignWords,
  DAILY_CATEGORIES,
  DAILY_CATEGORY_META,
  DAILY_ITEMS,
  findDailyItem,
  getDailyDrop,
  type AlignmentResult,
  type DailyCategory,
  type DailyItem,
} from '@lingopulse/shared';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { AlignmentView } from '../components/FeedbackView';
import { OptionButton } from '../components/MultipleChoice';
import { RecorderPanel } from '../components/RecorderPanel';
import { PressableScale, Reveal, ScoreRing } from '../components/motion';
import { Badge, Button, Card, Chip, Eyebrow, IconTile, LargeTitle, SectionHeader, ui, type IconName } from '../components/ui';
import { speakEnglishPhrase } from '../services/speech';
import { SHADOW, THEME, TYPE, type GradientKey } from '../theme/colors';

export const CATEGORY_STYLE: Record<DailyCategory, { icon: IconName; gradient: GradientKey; colors: readonly [string, string] }> = {
  phrasal_verb: { icon: 'extension-puzzle', gradient: 'daily', colors: ['#6CB8FF', '#007AFF'] },
  verb: { icon: 'flash', gradient: 'listening', colors: ['#A48BFF', '#6A4DFF'] },
  slang: { icon: 'chatbubbles', gradient: 'speaking', colors: ['#FF7A8A', '#FF375F'] },
  adjective: { icon: 'color-palette', gradient: 'writing', colors: ['#FFC15A', '#FF8A1F'] },
  idiom: { icon: 'sparkles', gradient: 'reading', colors: ['#4FD8A8', '#1FA87A'] },
  vocabulary: { icon: 'book', gradient: 'gold', colors: ['#EED9A4', '#B8924A'] },
};

export function DailyScreen() {
  const { todayKey, progress, awardDailyQuiz, completeActivity, todayActivities, toggleSavedWord } = useGame();
  const drop = useMemo(() => getDailyDrop(todayKey), [todayKey]);
  const [category, setCategory] = useState<DailyCategory>(drop.featured.category);
  const [libraryItem, setLibraryItem] = useState<DailyItem | null>(null);
  const [libraryCategory, setLibraryCategory] = useState<DailyCategory | 'saved'>('saved');
  const done = progress.dailyQuizDone[todayKey] ?? [];
  const dropDone = drop.items.filter((i) => done.includes(i.id)).length;

  // Completar los 6 quizzes del día cuenta como actividad (una vez por día).
  useEffect(() => {
    if (dropDone === drop.items.length && !todayActivities.some((a) => a.kind === 'daily')) {
      completeActivity({ kind: 'daily', title: 'Daily Drop completo (6/6)', score: 100 });
    }
  }, [dropDone, drop.items.length, todayActivities, completeActivity]);

  const item = libraryItem ?? drop.items.find((i) => i.category === category) ?? drop.featured;
  const savedItems = progress.savedWordIds.map(findDailyItem).filter(Boolean) as DailyItem[];
  const libraryList =
    libraryCategory === 'saved' ? savedItems : DAILY_ITEMS.filter((i) => i.category === libraryCategory);

  return (
    <View style={ui.screen}>
      <Reveal index={0}>
        <View style={ui.rowBetween}>
          <LargeTitle subtitle={new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}>
            Daily Drop
          </LargeTitle>
          <ScoreRing score={Math.round((dropDone / drop.items.length) * 100)} size={56} stroke={6} label={`${dropDone}/6`} />
        </View>
      </Reveal>

      <Reveal index={1}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {DAILY_CATEGORIES.map((c) => {
            const meta = DAILY_CATEGORY_META[c];
            const st = CATEGORY_STYLE[c];
            const dropItem = drop.items.find((i) => i.category === c)!;
            const isDone = done.includes(dropItem.id);
            const active = !libraryItem && category === c;
            return (
              <PressableScale
                key={c}
                hapticKind="select"
                onPress={() => {
                  setLibraryItem(null);
                  setCategory(c);
                }}
                style={[
                  styles.cat,
                  active && {
                    backgroundColor: st.colors[1],
                    borderColor: st.colors[1],
                  },
                  SHADOW.card,
                ]}
              >
                <IconTile name={st.icon} gradient={st.gradient} size={36} />
                <Text style={[styles.catLabel, active && { color: '#FFFFFF', fontWeight: '800' }]} numberOfLines={1}>
                  {meta.labelEn}
                </Text>
                {isDone ? (
                  <View style={styles.catDone}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                ) : null}
              </PressableScale>
            );
          })}
        </ScrollView>
      </Reveal>

      {libraryItem ? (
        <PressableScale onPress={() => setLibraryItem(null)} style={{ alignSelf: 'flex-start' }}>
          <View style={ui.row}>
            <Ionicons name="chevron-back" size={16} color={THEME.blue} />
            <Text style={{ color: THEME.blue, fontSize: 15 }}>Volver al Daily Drop de hoy</Text>
          </View>
        </PressableScale>
      ) : null}

      <DailyItemCard
        key={item.id}
        item={item}
        saved={progress.savedWordIds.includes(item.id)}
        onToggleSave={() => toggleSavedWord(item.id)}
        quizAlreadyDone={done.includes(item.id)}
        onQuizAnswered={(correct) => awardDailyQuiz(item.id, correct)}
      />

      <SectionHeader title="Mi vocabulario" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        <Chip
          label={`Guardadas · ${savedItems.length}`}
          icon="bookmark"
          active={libraryCategory === 'saved'}
          onPress={() => setLibraryCategory('saved')}
        />
        {DAILY_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={DAILY_CATEGORY_META[c].labelEs}
            icon={CATEGORY_STYLE[c].icon}
            active={libraryCategory === c}
            onPress={() => setLibraryCategory(c)}
          />
        ))}
      </ScrollView>
      <Card style={{ gap: 0, paddingVertical: 6 }}>
        {libraryList.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={26} color={THEME.ink3} />
            <Text style={TYPE.footnote}>Toca el marcador de una tarjeta para guardarla aquí.</Text>
          </View>
        ) : (
          libraryList.map((i, k) => (
            <PressableScale key={i.id} onPress={() => setLibraryItem(i)} scaleTo={0.98} hapticKind="select">
              <View style={[styles.libRow, k === libraryList.length - 1 && { borderBottomWidth: 0 }]}>
                <IconTile name={CATEGORY_STYLE[i.category].icon} gradient={CATEGORY_STYLE[i.category].gradient} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.libTerm}>{i.term}</Text>
                  <Text style={TYPE.footnote} numberOfLines={1}>
                    {i.spanish}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={THEME.ink3} />
              </View>
            </PressableScale>
          ))
        )}
      </Card>
    </View>
  );
}

function DailyItemCard({
  item,
  saved,
  onToggleSave,
  quizAlreadyDone,
  onQuizAnswered,
}: {
  item: DailyItem;
  saved: boolean;
  onToggleSave: () => void;
  quizAlreadyDone: boolean;
  onQuizAnswered: (correct: boolean) => boolean;
}) {
  const { locale } = useAppState();
  const meta = DAILY_CATEGORY_META[item.category];
  const st = CATEGORY_STYLE[item.category];
  const [picked, setPicked] = useState<string | null>(null);
  const [rewarded, setRewarded] = useState(false);
  const [showSpanish, setShowSpanish] = useState(false);
  const [practicing, setPracticing] = useState(false);
  const [alignment, setAlignment] = useState<AlignmentResult | null>(null);
  const [noTranscript, setNoTranscript] = useState(false);
  const practiceSentence = item.examples[0] ?? item.term;
  const say = (t: string, slow = false) => speakEnglishPhrase(t, locale, { rate: slow ? 0.7 : 0.95 });

  return (
    <View style={{ gap: 14 }}>
      <Reveal index={2}>
        <View style={[styles.hero, SHADOW.float]}>
          <LinearGradient colors={st.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBand}>
            <View style={ui.rowBetween}>
              <View style={ui.row}>
                <Ionicons name={st.icon} size={15} color="rgba(255,255,255,0.9)" />
                <Text style={styles.heroCaption}>{meta.labelEn}</Text>
              </View>
              <PressableScale onPress={onToggleSave} accessibilityLabel={saved ? 'Quitar de guardadas' : 'Guardar'} hapticKind="medium">
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color="#FFFFFF" />
              </PressableScale>
            </View>
            <Text style={styles.term}>{item.term}</Text>
            <View style={ui.rowWrap}>
              {item.ipa ? <Text style={styles.ipa}>{item.ipa}</Text> : null}
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{item.partOfSpeech}</Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{item.register}</Text>
              </View>
              {item.region && item.region !== 'Global' ? (
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>{item.region}</Text>
                </View>
              ) : null}
            </View>
            <View style={ui.row}>
              <PressableScale onPress={() => say(item.term)} style={styles.audioBtn}>
                <View style={ui.row}>
                  <Ionicons name="volume-high" size={16} color={THEME.ink} />
                  <Text style={styles.audioText}>Escuchar</Text>
                </View>
              </PressableScale>
              <PressableScale onPress={() => say(item.term, true)} style={[styles.audioBtn, styles.audioBtnGhost]}>
                <View style={ui.row}>
                  <Ionicons name="speedometer-outline" size={16} color="#FFFFFF" />
                  <Text style={[styles.audioText, { color: '#FFFFFF' }]}>Lento</Text>
                </View>
              </PressableScale>
            </View>
          </LinearGradient>

          <View style={styles.heroBody}>
            <Block label="Definition">
              <Text style={[TYPE.body, { fontWeight: '600' }]}>{item.definitionEn}</Text>
            </Block>
            <Block label="How to use it">
              <Text style={TYPE.body}>{item.usageEn}</Text>
            </Block>
            <Block label="Examples">
              {item.examples.map((ex) => (
                <PressableScale key={ex} onPress={() => say(ex)} scaleTo={0.98} style={styles.example}>
                  <View style={[ui.row, { alignItems: 'flex-start' }]}>
                    <Text style={styles.exampleText}>{ex}</Text>
                    <Ionicons name="play-circle" size={22} color={THEME.blue} />
                  </View>
                </PressableScale>
              ))}
            </Block>
            {item.synonyms?.length ? (
              <View style={ui.rowWrap}>
                {item.synonyms.map((sy) => (
                  <Badge key={sy} label={sy} color={THEME.blue} bg="#EAF3FF" />
                ))}
              </View>
            ) : null}
            <PressableScale onPress={() => setShowSpanish((v) => !v)} scaleTo={0.98} style={styles.spanish}>
              <View style={ui.row}>
                <Ionicons name={showSpanish ? 'eye' : 'eye-off'} size={16} color={THEME.gold} />
                <Text style={styles.spanishText}>
                  {showSpanish ? item.spanish : 'Ver traducción · intenta entenderlo primero en inglés'}
                </Text>
              </View>
            </PressableScale>
            {item.watchOutEs ? (
              <View style={styles.watch}>
                <Ionicons name="alert-circle" size={16} color={THEME.red} />
                <Text style={styles.watchText}>{item.watchOutEs}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Reveal>

      <Reveal index={3}>
        <Card>
          <Eyebrow icon="help-circle">Quick quiz</Eyebrow>
          <Text style={[TYPE.headline, { fontSize: 18, lineHeight: 25 }]}>{item.quiz.sentence}</Text>
          <View style={{ gap: 8 }}>
            {item.quiz.options.map((opt) => {
              const isAnswer = opt === item.quiz.answer;
              const state =
                picked === null ? 'idle' : picked === opt ? (isAnswer ? 'right' : 'wrong') : isAnswer ? 'reveal' : 'idle';
              return (
                <OptionButton
                  key={opt}
                  label={opt}
                  state={state}
                  disabled={picked !== null}
                  onPress={() => {
                    setPicked(opt);
                    const correct = opt === item.quiz.answer;
                    if (correct) say(item.quiz.sentence.replace('___', item.quiz.answer));
                    setRewarded(onQuizAnswered(correct));
                  }}
                />
              );
            })}
          </View>
          {picked !== null ? (
            <View style={ui.rowBetween}>
              <Text style={[TYPE.footnote, { flex: 1 }]}>
                {picked === item.quiz.answer ? 'Correcto. ' : `La respuesta es "${item.quiz.answer}". `}
                {rewarded
                  ? picked === item.quiz.answer
                    ? '+5 XP · +2 monedas'
                    : '+2 XP por intentarlo'
                  : quizAlreadyDone
                    ? 'Ya sumaste XP hoy.'
                    : ''}
              </Text>
              <Button label="Repetir" small variant="secondary" icon="refresh" onPress={() => setPicked(null)} />
            </View>
          ) : null}
        </Card>
      </Reveal>

      <Reveal index={4}>
        <Card>
          <Eyebrow icon="mic">Dilo en voz alta</Eyebrow>
          <Text style={[TYPE.headline, { fontSize: 18, lineHeight: 25 }]}>“{practiceSentence}”</Text>
          {!practicing ? (
            <View style={ui.rowWrap}>
              <Button label="Modelo" icon="volume-high" small variant="secondary" onPress={() => say(practiceSentence)} />
              <Button label="Practicar pronunciación" icon="mic" small onPress={() => setPracticing(true)} />
            </View>
          ) : (
            <>
              <RecorderPanel
                locale={locale}
                hint="Lee la frase en voz alta"
                onResult={(out) => {
                  setNoTranscript(!out.transcript);
                  setAlignment(out.transcript ? alignWords(practiceSentence, out.transcript) : null);
                }}
              />
              {noTranscript ? (
                <Text style={TYPE.footnote}>
                  Tu audio se grabó, pero este dispositivo no pudo transcribirlo. Activa la transcripción en el
                  backend (Deepgram) o abre la app en el navegador para obtener el puntaje.
                </Text>
              ) : null}
              {alignment ? (
                <View style={{ gap: 10 }}>
                  <View style={[ui.row, { gap: 14 }]}>
                    <ScoreRing score={alignment.accuracy} size={64} stroke={7} />
                    <Text style={[TYPE.subhead, { flex: 1 }]}>
                      Palabras reconocidas. Las rojas o grises son las que conviene repetir despacio.
                    </Text>
                  </View>
                  <AlignmentView result={alignment} />
                </View>
              ) : null}
            </>
          )}
        </Card>
      </Reveal>
    </View>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={TYPE.caption}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  catRow: { gap: 10, paddingVertical: 6, paddingHorizontal: 2 },
  cat: {
    width: 108,
    padding: 12,
    gap: 10,
    borderRadius: 22,
    backgroundColor: THEME.surface,
  },
  catActive: { backgroundColor: THEME.ink },
  catLabel: { fontSize: 13, fontWeight: '600', color: THEME.ink },
  catDone: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: THEME.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { borderRadius: 30, backgroundColor: THEME.surface, overflow: 'hidden' },
  heroBand: { padding: 20, gap: 10 },
  heroCaption: { ...TYPE.caption, color: 'rgba(255,255,255,0.9)' },
  term: { fontSize: 38, fontWeight: '700', color: '#FFFFFF', letterSpacing: -1.2 },
  ipa: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '500', marginRight: 4 },
  heroPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)' },
  heroPillText: { fontSize: 12, color: '#FFFFFF', fontWeight: '500' },
  audioBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  audioBtnGhost: { backgroundColor: 'rgba(255,255,255,0.22)' },
  audioText: { fontSize: 14, fontWeight: '600', color: THEME.ink },
  heroBody: { padding: 20, gap: 16 },
  example: { backgroundColor: THEME.fill, borderRadius: 16, padding: 14 },
  exampleText: { flex: 1, fontSize: 16, lineHeight: 23, color: THEME.ink, fontStyle: 'italic' },
  spanish: { backgroundColor: THEME.goldLight, borderRadius: 14, padding: 12 },
  spanishText: { flex: 1, fontSize: 14, color: '#7A5B1E', fontWeight: '500' },
  watch: { flexDirection: 'row', gap: 8, backgroundColor: '#FFF0F3', borderRadius: 14, padding: 12 },
  watchText: { flex: 1, fontSize: 14, color: '#B0173A', lineHeight: 19 },
  empty: { alignItems: 'center', gap: 6, paddingVertical: 20 },
  libRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.hairline,
  },
  libTerm: { fontSize: 16, fontWeight: '600', color: THEME.ink },
});
