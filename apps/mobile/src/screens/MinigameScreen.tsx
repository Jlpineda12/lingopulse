import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { DAILY_ITEMS, ERROR_HUNT_ITEMS, localDateKey, type DailyItem } from '@lingopulse/shared';
import { currentEvent } from '../game/events';
import { useAppState } from '../context/AppStateContext';
import { useGame } from '../context/GameContext';
import { Glyph } from '../components/Glyph';
import { OptionButton } from '../components/MultipleChoice';
import { AnimatedBar, haptic, PressableScale, Reveal, usePop, useShake } from '../components/motion';
import { Button, ScreenHeader } from '../components/ui';
import { speakEnglishPhrase } from '../services/speech';
import { THEME, TYPE } from '../theme/colors';

/**
 * Minijuegos de idioma (rondas cortas, 1–2 minutos) que dan estrellas para mejorar
 * la casa de la mascota. Usan el vocabulario del Daily Drop para reforzar lo aprendido.
 */

export type GameId = 'word-rush' | 'sharp-ear' | 'sentence-builder' | 'error-hunt' | 'event-rush';

const GAMES: Array<{ id: GameId; title: string; desc: string; glyph: string; color: string; rounds: number }> = [
  { id: 'word-rush', title: 'Palabra Veloz', desc: 'Elige el significado correcto antes de que se acabe el tiempo.', glyph: 'bolt', color: '#FFE9A8', rounds: 8 },
  { id: 'sharp-ear', title: 'Oído Fino', desc: 'Escucha la palabra en inglés y toca cómo se escribe.', glyph: 'headphones', color: '#E6DCFF', rounds: 8 },
  { id: 'sentence-builder', title: 'Arma la Frase', desc: 'Ordena las palabras para formar una frase real.', glyph: 'bookshelf', color: '#D7F5E5', rounds: 5 },
  { id: 'error-hunt', title: 'Encuentra el Error', desc: 'Toca la palabra que está mal: errores típicos de hispanohablantes.', glyph: 'face-angry', color: '#FFE3E8', rounds: 6 },
];

const EVENT_GAME = { id: 'event-rush' as const, title: 'Carrera del Evento', desc: '', glyph: 'flag', color: '#FFF1C2', rounds: 6 };

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const shortSpanish = (item: DailyItem) => item.spanish.split(/[,;(]/)[0]!.trim();

export function MinigameScreen({ initialGame }: { initialGame?: GameId }) {
  const { goBack, progress } = useGame();
  const [game, setGame] = useState<GameId | null>(initialGame ?? null);
  const todayBest = progress.minigameLog?.[localDateKey()] ?? {};

  if (game) return <GamePlayer gameId={game} onExit={() => (initialGame ? goBack() : setGame(null))} />;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Minijuegos" subtitle="Gana estrellas para mejorar la casa de tu mascota" onBack={goBack} />
      <View style={styles.wallet}>
        <Glyph name="star" size={28} />
        <Text style={TYPE.title2}>{progress.stars ?? 0}</Text>
        <Text style={TYPE.footnote}>estrellas · la mejora del día cuenta, las monedas se ganan completas la 1.ª vez</Text>
      </View>
      {GAMES.map((g, i) => {
        const best = todayBest[g.id];
        return (
          <Reveal key={g.id} index={i}>
            <PressableScale onPress={() => setGame(g.id)} style={[styles.gameCard, { backgroundColor: g.color }]}>
              <Glyph name={g.glyph} size={64} tile="#FFFFFF" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={TYPE.title2}>{g.title}</Text>
                <Text style={TYPE.footnote}>{g.desc}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3].map((n) => (
                    <View key={n} style={{ opacity: best !== undefined && best >= n ? 1 : 0.25 }}>
                      <Glyph name="star" size={20} />
                    </View>
                  ))}
                  <Text style={styles.bestText}>{best !== undefined ? 'mejor de hoy' : 'sin jugar hoy'}</Text>
                </View>
              </View>
            </PressableScale>
          </Reveal>
        );
      })}
    </View>
  );
}

interface Round {
  explanation?: string;
  wrongIndex?: number;
  prompt: string;
  speak?: string;
  options: string[];
  answer: string;
  words?: string[];
}

function buildRounds(gameId: GameId): Round[] {
  if (gameId === 'error-hunt') {
    return shuffle(ERROR_HUNT_ITEMS)
      .slice(0, 6)
      .map((it) => ({
        prompt: it.sentence,
        words: it.sentence.split(' '),
        wrongIndex: it.wrongIndex,
        options: [],
        answer: it.correction,
        explanation: it.explanationEs,
      }));
  }
  if (gameId === 'event-rush') {
    const words = currentEvent().event.words;
    return shuffle(words).map((w) => {
      const others = shuffle(words.filter((o) => o.id !== w.id)).slice(0, 3).map((o) => o.meaningEs);
      return { prompt: w.term, options: shuffle([w.meaningEs, ...others]), answer: w.meaningEs };
    });
  }
  const pool = shuffle(DAILY_ITEMS);
  if (gameId === 'word-rush') {
    return pool.slice(0, 8).map((item) => {
      const others = shuffle(DAILY_ITEMS.filter((d) => d.id !== item.id)).slice(0, 3).map(shortSpanish);
      return { prompt: item.term, options: shuffle([shortSpanish(item), ...others]), answer: shortSpanish(item) };
    });
  }
  if (gameId === 'sharp-ear') {
    return pool.slice(0, 8).map((item) => {
      const others = shuffle(DAILY_ITEMS.filter((d) => d.id !== item.id && d.category === item.category))
        .slice(0, 3)
        .map((d) => d.term);
      while (others.length < 3) others.push(shuffle(DAILY_ITEMS)[0]!.term);
      return { prompt: 'Escucha y elige', speak: item.term, options: shuffle([item.term, ...others]), answer: item.term };
    });
  }
  return pool
    .map((item) => item.examples[0]!)
    .filter((s) => s && s.split(/\s+/).length <= 9)
    .slice(0, 5)
    .map((sentence) => {
      const words = sentence.replace(/[“”"]/g, '').split(/\s+/);
      return { prompt: 'Ordena la frase', options: [], answer: words.join(' '), words: shuffle(words) };
    });
}

function GamePlayer({ gameId, onExit }: { gameId: GameId; onExit: () => void }) {
  const { finishMinigame, pet } = useGame();
  const { locale } = useAppState();
  const meta = GAMES.find((g) => g.id === gameId) ?? EVENT_GAME;
  const rounds = useMemo(() => buildRounds(gameId), [gameId]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameId === 'word-rush' || gameId === 'event-rush' ? 60 : 0);
  const [result, setResult] = useState<ReturnType<typeof finishMinigame> | null>(null);
  const [built, setBuilt] = useState<string[]>([]);
  const finished = useRef(false);
  const pop = usePop();
  const shake = useShake();
  const round = rounds[index];

  const end = (finalCorrect: number) => {
    if (finished.current) return;
    finished.current = true;
    setResult(finishMinigame(gameId, finalCorrect, rounds.length));
  };

  useEffect(() => {
    if ((gameId !== 'word-rush' && gameId !== 'event-rush') || result) return;
    if (timeLeft <= 0) {
      end(correct);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, gameId, result]);

  useEffect(() => {
    if (round?.speak) speakEnglishPhrase(round.speak, locale);
  }, [round, locale]);

  const advance = (wasRight: boolean) => {
    const nextCorrect = correct + (wasRight ? 1 : 0);
    setCorrect(nextCorrect);
    setCombo((c) => (wasRight ? c + 1 : 0));
    setTimeout(() => {
      if (index + 1 >= rounds.length) end(nextCorrect);
      else {
        setIndex((i) => i + 1);
        setPicked(null);
        setBuilt([]);
      }
    }, wasRight ? 550 : 1100);
  };

  if (result) {
    const earnedStars = correct / rounds.length >= 0.9 ? 3 : correct / rounds.length >= 0.6 ? 2 : correct > 0 ? 1 : 0;
    return (
      <View style={styles.screen}>
        <Reveal index={0}>
          <View style={[styles.resultCard, { backgroundColor: meta.color }]}>
            <Glyph name={earnedStars >= 2 ? 'trophy' : 'sparkle'} size={84} />
            <Text style={TYPE.largeTitle}>{earnedStars >= 2 ? '¡Increíble!' : earnedStars === 1 ? '¡Bien hecho!' : '¡Sigue intentando!'}</Text>
            <Text style={TYPE.subhead}>
              {correct} de {rounds.length} correctas
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3].map((n) => (
                <Reveal key={n} index={n}>
                  <View style={{ opacity: earnedStars >= n ? 1 : 0.2 }}>
                    <Glyph name="star" size={52} />
                  </View>
                </Reveal>
              ))}
            </View>
            <View style={styles.rewardRow}>
              <View style={styles.rewardPill}>
                <Glyph name="star" size={18} />
                <Text style={styles.rewardText}>+{result.stars}</Text>
              </View>
              <View style={styles.rewardPill}>
                <Glyph name="coin" size={18} />
                <Text style={styles.rewardText}>+{result.coins}</Text>
              </View>
              <View style={styles.rewardPill}>
                <Glyph name="bolt" size={18} />
                <Text style={styles.rewardText}>+{result.xp} XP</Text>
              </View>
            </View>
            {!result.firstToday && result.stars === 0 ? (
              <Text style={TYPE.footnote}>Para ganar más estrellas hoy, supera tu mejor resultado.</Text>
            ) : null}
          </View>
        </Reveal>
        <Button label="Jugar otra vez" icon="refresh" variant="primary" onPress={onExit} />
      </View>
    );
  }

  if (!round) return null;
  const progressRatio = index / rounds.length;

  return (
    <View style={styles.screen}>
      <ScreenHeader title={meta.title} subtitle={`Ronda ${index + 1} de ${rounds.length}`} onBack={onExit} />
      <View style={styles.hud}>
        <View style={{ flex: 1 }}>
          <AnimatedBar value={progressRatio} colors={['#5EDB8F', '#22B567']} height={12} />
        </View>
        {gameId === 'word-rush' || gameId === 'event-rush' ? (
          <View style={[styles.timer, timeLeft <= 10 && { backgroundColor: '#FFE3E8' }]}>
            <Glyph name="flame" size={18} />
            <Text style={[styles.timerText, timeLeft <= 10 && { color: THEME.red }]}>{timeLeft}s</Text>
          </View>
        ) : null}
      </View>
      {combo >= 2 ? (
        <Animated.View style={[styles.combo, pop.style]}>
          <Glyph name="bolt" size={20} />
          <Text style={styles.comboText}>¡Combo x{combo}!</Text>
        </Animated.View>
      ) : null}

      <Reveal key={index} index={0}>
        <View style={[styles.promptCard, { backgroundColor: meta.color }]}>
          {round.speak ? (
            <PressableScale onPress={() => speakEnglishPhrase(round.speak!, locale)} style={styles.speakBtn}>
              <Glyph name="headphones" size={64} />
              <Text style={styles.speakText}>Toca para repetir</Text>
            </PressableScale>
          ) : (
            <Text style={[styles.promptText, gameId === 'error-hunt' && { fontSize: 22 }]}>
              {gameId === 'error-hunt' ? 'Encuentra el error' : round.prompt}
            </Text>
          )}
          <Text style={TYPE.footnote}>
            {gameId === 'word-rush' || gameId === 'event-rush'
              ? '¿Qué significa?'
              : gameId === 'sharp-ear'
                ? '¿Qué escuchaste?'
                : gameId === 'error-hunt'
                  ? 'Toca la palabra incorrecta'
                  : 'Toca las palabras en orden'}
          </Text>
        </View>
      </Reveal>

      {gameId === 'error-hunt' && round.words ? (
        <Animated.View style={[{ gap: 12 }, shake.style]}>
          <View style={styles.wordBank}>
            {round.words.map((w, i) => {
              const chosen = picked !== null && Number(picked) === i;
              const isWrongWord = i === round.wrongIndex;
              const reveal = picked !== null && isWrongWord;
              return (
                <PressableScale
                  key={`${w}-${i}`}
                  hapticKind="select"
                  disabled={picked !== null}
                  onPress={() => {
                    setPicked(String(i));
                    const right = isWrongWord;
                    if (right) {
                      haptic('success');
                      pop.pop();
                    } else {
                      haptic('error');
                      shake.shake();
                    }
                    advance(right);
                  }}
                  style={[
                    styles.wordChip,
                    reveal && { backgroundColor: '#FFE3E8', borderColor: THEME.red, borderBottomColor: '#CC294B' },
                    chosen && !isWrongWord && { backgroundColor: '#FFF6D6', borderColor: '#F59E0B' },
                  ]}
                >
                  <Text style={[styles.wordText, reveal && { color: THEME.red, textDecorationLine: 'line-through' }]}>{w}</Text>
                </PressableScale>
              );
            })}
          </View>
          {picked !== null ? (
            <View style={{ gap: 4, alignItems: 'center' }}>
              <Text style={[TYPE.headline, { color: Number(picked) === round.wrongIndex ? THEME.green : THEME.red, textAlign: 'center' }]}>
                {Number(picked) === round.wrongIndex ? '¡Bien visto!' : 'Ese no era…'}
              </Text>
              <Text style={[TYPE.body, { textAlign: 'center', fontWeight: '700' }]}>✓ {round.answer}</Text>
              <Text style={[TYPE.footnote, { textAlign: 'center' }]}>{round.explanation}</Text>
            </View>
          ) : null}
        </Animated.View>
      ) : gameId === 'sentence-builder' && round.words ? (
        <Animated.View style={[{ gap: 12 }, shake.style]}>
          <View style={styles.builtArea}>
            {built.length === 0 ? <Text style={TYPE.footnote}>Tu frase aparecerá aquí…</Text> : null}
            {built.map((w, i) => (
              <PressableScale key={`${w}-${i}`} hapticKind="select" onPress={() => picked === null && setBuilt((b) => b.filter((_, k) => k !== i))} style={styles.wordChipPlaced}>
                <Text style={styles.wordText}>{w}</Text>
              </PressableScale>
            ))}
          </View>
          <View style={styles.wordBank}>
            {round.words.map((w, i) => {
              const usedCount = built.filter((b) => b === w).length;
              const occurrence = round.words!.slice(0, i).filter((x) => x === w).length;
              const used = usedCount > occurrence;
              return (
                <PressableScale
                  key={`${w}-${i}`}
                  hapticKind="select"
                  disabled={used || picked !== null}
                  onPress={() => setBuilt((b) => [...b, w])}
                  style={[styles.wordChip, used && { opacity: 0.25 }]}
                >
                  <Text style={styles.wordText}>{w}</Text>
                </PressableScale>
              );
            })}
          </View>
          {picked !== null ? (
            <Text style={[TYPE.headline, { color: picked === round.answer ? THEME.green : THEME.red, textAlign: 'center' }]}>
              {picked === round.answer ? '¡Perfecto!' : `Era: “${round.answer}”`}
            </Text>
          ) : (
            <Button
              label="Comprobar"
              icon="checkmark"
              variant="success"
              disabled={built.length !== round.words.length}
              onPress={() => {
                const attempt = built.join(' ');
                const right = attempt === round.answer;
                setPicked(attempt);
                if (right) {
                  haptic('success');
                  pop.pop();
                  speakEnglishPhrase(round.answer, locale);
                } else {
                  haptic('error');
                  shake.shake();
                }
                advance(right);
              }}
            />
          )}
        </Animated.View>
      ) : (
        <View style={{ gap: 10 }}>
          {round.options.map((opt) => {
            const isAnswer = opt === round.answer;
            const state = picked === null ? 'idle' : picked === opt ? (isAnswer ? 'right' : 'wrong') : isAnswer ? 'reveal' : 'idle';
            return (
              <OptionButton
                key={opt}
                label={opt}
                state={state}
                disabled={picked !== null}
                onPress={() => {
                  setPicked(opt);
                  if (isAnswer) pop.pop();
                  advance(isAnswer);
                }}
              />
            );
          })}
        </View>
      )}
      <Text style={[TYPE.footnote, { textAlign: 'center' }]}>{pet.name} te está mirando… ¡tú puedes!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 130, gap: 16 },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 4,
    flexWrap: 'wrap',
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(30,36,54,0.08)',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(30,36,54,0.16)',
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bestText: { fontSize: 11, fontWeight: '700', color: THEME.ink2, marginLeft: 4 },
  hud: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  timerText: { fontSize: 15, fontWeight: '900', color: THEME.ink, fontVariant: ['tabular-nums'] },
  combo: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF1C2', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  comboText: { fontSize: 14, fontWeight: '900', color: '#B45309' },
  promptCard: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 18,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(30,36,54,0.08)',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(30,36,54,0.16)',
  },
  promptText: { fontSize: 34, fontWeight: '900', color: THEME.ink, letterSpacing: -0.8, textAlign: 'center' },
  speakBtn: { alignItems: 'center', gap: 6 },
  speakText: { fontSize: 13, fontWeight: '800', color: THEME.ink2 },
  builtArea: {
    minHeight: 70,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: THEME.fill2,
    alignItems: 'center',
  },
  wordBank: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wordChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: THEME.fill2,
    borderBottomWidth: 4,
  },
  wordChipPlaced: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#EAF3FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderBottomWidth: 4,
  },
  wordText: { fontSize: 16, fontWeight: '800', color: THEME.ink },
  resultCard: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(30,36,54,0.08)',
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(30,36,54,0.16)',
  },
  rewardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  rewardPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  rewardText: { fontSize: 15, fontWeight: '900', color: THEME.ink },
});
