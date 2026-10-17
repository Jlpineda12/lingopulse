import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import type { SupportedLocale } from '@lingopulse/shared';
import { useOptionalGame } from '../context/GameContext';
import {
  estimatedMetricsFromText,
  useSpeechCapture,
  type CaptureResult,
} from '../hooks/useSpeechCapture';
import { GRADIENTS, SHADOW, THEME, TYPE } from '../theme/colors';
import { VoiceEnergyStreamVfx } from './GameVfx';
import { haptic, PressableScale, PulseRings } from './motion';
import { Button, Muted, ui } from './ui';

export interface RecorderOutput extends CaptureResult {
  typed: boolean;
}

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const MIC = 92;
const RING = MIC + 22;

export function RecorderPanel({
  locale,
  targetSeconds,
  onResult,
  hint = 'Toca el micrófono y habla en inglés',
  onRecordingChange,
}: {
  locale: SupportedLocale;
  targetSeconds?: number;
  onResult: (out: RecorderOutput) => void;
  hint?: string;
  onRecordingChange?: (recording: boolean) => void;
}) {
  const capture = useSpeechCapture(locale);
  const game = useOptionalGame();
  const [bars, setBars] = useState<number[]>(() => new Array(32).fill(0.05));
  const [typed, setTyped] = useState('');
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (capture.state !== 'recording') return;
    setBars((b) => [...b.slice(1), Math.max(0.05, capture.level)]);
  }, [capture.level, capture.state]);

  useEffect(() => {
    onRecordingChange?.(capture.state === 'recording');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture.state]);

  const recording = capture.state === 'recording';
  const processing = capture.state === 'processing';

  const toggle = async () => {
    if (recording) {
      haptic('medium');
      const res = await capture.stop();
      setBars(new Array(32).fill(0.05));
      onResult({ ...res, typed: false });
    } else {
      const ok = await capture.start();
      if (ok) haptic('success');
    }
  };

  if (typing || !capture.support.recording) {
    return (
      <View style={{ gap: 10 }}>
        <Muted>
          {!capture.support.recording && Platform.OS === 'web' && !capture.support.secureContext
            ? 'El micrófono del navegador solo funciona con https:// o en localhost. Mientras tanto, di tu respuesta en voz alta y escríbela.'
            : 'Modo texto: escribe lo que dirías en voz alta.'}
        </Muted>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          multiline
          placeholder="Type what you said…"
          placeholderTextColor={THEME.ink3}
          style={ui.input}
        />
        <View style={ui.row}>
          <Button
            label="Analizar"
            icon="sparkles"
            disabled={typed.trim().split(/\s+/).length < 3}
            onPress={() =>
              onResult({
                transcript: typed.trim(),
                audioUrl: null,
                metrics: estimatedMetricsFromText(typed),
                typed: true,
              })
            }
            style={{ flex: 1 }}
          />
          {capture.support.recording ? (
            <Button label="Micrófono" icon="mic" variant="secondary" onPress={() => setTyping(false)} />
          ) : null}
        </View>
      </View>
    );
  }

  const progress = targetSeconds ? Math.min(1, capture.elapsedMs / (targetSeconds * 1000)) : 0;
  const radius = RING / 2 - 3;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.wrap}>
      <View style={styles.wave}>
        {bars.map((b, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: 4 + b * 44,
                opacity: recording ? 0.35 + b * 0.65 : 0.35,
                backgroundColor: recording ? THEME.red : THEME.ink3,
              },
            ]}
          />
        ))}
      </View>

      <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
        <PulseRings active={recording} color={THEME.red} size={MIC} />
        {targetSeconds ? (
          <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
            <Circle cx={RING / 2} cy={RING / 2} r={radius} stroke={THEME.fill2} strokeWidth={4} fill="none" />
            {progress > 0 ? (
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={radius}
                stroke={progress >= 1 ? THEME.green : THEME.ink}
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - progress)}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
              />
            ) : null}
          </Svg>
        ) : null}
        <PressableScale
          onPress={toggle}
          disabled={processing}
          scaleTo={0.92}
          hapticKind={null}
          accessibilityLabel={recording ? 'Detener grabación' : 'Empezar a grabar'}
          style={[styles.mic, SHADOW.glow(recording ? THEME.red : THEME.blue)]}
        >
          <LinearGradient
            colors={recording ? GRADIENTS.speaking : GRADIENTS.ink}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.micFill}
          >
            <Ionicons name={processing ? 'hourglass' : recording ? 'stop' : 'mic'} size={recording ? 30 : 36} color="#FFFFFF" />
          </LinearGradient>
        </PressableScale>
      </View>

      <Text style={styles.timer}>
        {fmt(capture.elapsedMs)}
        {targetSeconds ? <Text style={styles.timerTarget}>  /  {fmt(targetSeconds * 1000)}</Text> : null}
      </Text>
      <Text style={styles.hint}>
        {processing
          ? Platform.OS === 'web'
            ? 'Analizando tu audio…'
            : 'Analizando y transcribiendo tu audio…'
          : recording
            ? 'Te escucho… toca para terminar'
            : hint}
      </Text>

      <VoiceEnergyStreamVfx
        active={recording}
        petName={game?.pet.name ?? 'Pip'}
        petColor={game?.pet.bodyColor ?? '#FFB7CE'}
      />

      {capture.support.liveTranscript && (recording || capture.liveTranscript) ? (
        <View style={styles.live}>
          <Text style={TYPE.caption}>Transcripción en vivo</Text>
          <Text style={styles.liveText}>{capture.liveTranscript || '…'}</Text>
        </View>
      ) : null}

      {capture.error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={THEME.red} />
          <Text style={styles.error}>{capture.error}</Text>
        </View>
      ) : null}

      {!recording && !processing ? (
        <Pressable onPress={() => setTyping(true)} hitSlop={8}>
          <Text style={styles.typeLink}>Prefiero escribir</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12, paddingVertical: 6 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 50 },
  bar: { width: 4, borderRadius: 2 },
  mic: { width: MIC, height: MIC, borderRadius: MIC / 2 },
  micFill: { flex: 1, borderRadius: MIC / 2, alignItems: 'center', justifyContent: 'center' },
  timer: { fontSize: 28, fontWeight: '600', color: THEME.ink, fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  timerTarget: { fontSize: 15, fontWeight: '500', color: THEME.ink3 },
  hint: { ...TYPE.footnote, textAlign: 'center' },
  live: { alignSelf: 'stretch', backgroundColor: THEME.fill, borderRadius: 16, padding: 14, gap: 6 },
  liveText: { ...TYPE.callout },
  errorBox: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    backgroundColor: '#FFF3F5',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  error: { flex: 1, fontSize: 13, color: THEME.red, lineHeight: 18 },
  typeLink: { fontSize: 13, color: THEME.blue, fontWeight: '500' },
});
