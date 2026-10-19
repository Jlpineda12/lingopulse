import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  AudioModule,
  AudioQuality,
  createAudioPlayer,
  IOSOutputFormat,
  type AudioPlayer,
  type AudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import type { PronunciationReport, SpeechAudioMetrics, SupportedLocale } from '@lingopulse/shared';
import { suspendSfx } from '../services/sfx';
import { stopSpeaking } from '../services/speech';
import { reviewRecording, transcribeRecording, type PronunciationReview } from '../services/transcribe';

/**
 * Captura de voz para práctica, en web y en el teléfono:
 *
 *  Web (Chrome/Edge/Safari):
 *   - Grabación (MediaRecorder) para reescucharte.
 *   - Transcripción en vivo con el reconocedor del navegador (Web Speech API).
 *   - Análisis acústico con Web Audio (RMS por fotograma).
 *  iOS/Android (Expo Go):
 *   - Grabación con expo-audio y medición de volumen en vivo (metering en dB).
 *   - Transcripción al terminar enviando el audio al backend (Deepgram) si está
 *     configurado; si no, el usuario reescucha y escribe/corrige lo que dijo.
 *
 * En ambos casos se calculan las mismas métricas: tiempo con voz, pausas y volumen.
 */

export interface CaptureResult {
  transcript: string;
  audioUrl: string | null;
  metrics: SpeechAudioMetrics;
  /** Evaluación de pronunciación del servidor (Azure o Gemini), si está activa. */
  pronunciation: PronunciationReport | null;
  /** No se detectó voz en la grabación. */
  silent?: boolean;
  /** Revisión con IA que llega después (~20 s) para afinar pronunciación y transcripción. */
  review?: Promise<PronunciationReview | null> | null;
}

type CaptureState = 'idle' | 'recording' | 'processing';

const PAUSE_MS = 700;
const IS_WEB = Platform.OS === 'web';

/**
 * Grabación para voz: AAC mono a 22 kHz (~0,5 MB por minuto). El preset HIGH_QUALITY graba en estéreo
 * a 44 kHz y en el iPhone llegaba sin comprimir (~10 MB/min): 2 minutos superaban el límite del servidor.
 */
const SPEECH_RECORDING: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: true,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 64000 },
};

/** Detector simple de actividad de voz (umbral adaptativo al ruido de fondo). */
class VoiceActivity {
  frames = 0;
  voicedMs = 0;
  levelSum = 0;
  noiseFloor = 0.012;
  firstVoiceAt: number | null = null;
  lastVoiceAt: number | null = null;
  silenceStart: number | null = null;
  pauses: number[] = [];
  private calibration: number[] = [];
  private lastAt: number | null = null;

  push(amplitude: number, now: number) {
    const frameMs = this.lastAt === null ? 50 : Math.min(250, now - this.lastAt);
    this.lastAt = now;
    this.frames++;
    this.levelSum += amplitude;
    if (this.calibration.length < 8) {
      this.calibration.push(amplitude);
      if (this.calibration.length === 8) {
        const sorted = [...this.calibration].sort((a, b) => a - b);
        this.noiseFloor = Math.max(0.012, (sorted[3] ?? 0.01) * 2.2);
      }
    }
    if (amplitude > this.noiseFloor) {
      this.voicedMs += frameMs;
      if (this.firstVoiceAt === null) this.firstVoiceAt = now;
      if (this.silenceStart !== null && this.lastVoiceAt !== null) {
        const gap = now - this.silenceStart;
        if (gap >= PAUSE_MS) this.pauses.push(gap);
      }
      this.silenceStart = null;
      this.lastVoiceAt = now;
    } else if (this.silenceStart === null) {
      this.silenceStart = now;
    }
  }

  metrics(startedAt: number, endedAt: number, confidence: number | null): SpeechAudioMetrics {
    const durationMs =
      this.firstVoiceAt !== null && this.lastVoiceAt !== null
        ? Math.max(1000, this.lastVoiceAt - this.firstVoiceAt + 300)
        : endedAt - startedAt;
    return {
      durationMs,
      voicedMs: Math.round(this.voicedMs),
      pauseCount: this.pauses.length,
      longestPauseMs: this.pauses.length ? Math.max(...this.pauses) : 0,
      recognitionConfidence: confidence,
      averageLevel: this.frames ? Math.min(1, (this.levelSum / this.frames) * 6) : 0,
    };
  }
}

interface MinimalRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
}

function getRecognitionCtor(): (new () => MinimalRecognition) | null {
  if (!IS_WEB || typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function getCaptureSupport() {
  if (!IS_WEB) {
    return { recording: true, recognition: false, liveTranscript: false, secureContext: true };
  }
  const secure = typeof window !== 'undefined' ? window.isSecureContext !== false : true;
  return {
    recording:
      secure &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined',
    recognition: !!getRecognitionCtor(),
    liveTranscript: !!getRecognitionCtor(),
    secureContext: secure,
  };
}

export function useSpeechCapture(locale: SupportedLocale, options: { referenceText?: string } = {}) {
  // La frase de referencia puede cambiar entre grabaciones: se lee al detener.
  const referenceRef = useRef(options.referenceText);
  referenceRef.current = options.referenceText;
  const [state, setState] = useState<CaptureState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [level, setLevel] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const support = getCaptureSupport();

  const r = useRef<{
    vad: VoiceActivity;
    startedAt: number;
    active: boolean;
    // web
    stream: MediaStream | null;
    recorder: MediaRecorder | null;
    chunks: Blob[];
    audioCtx: AudioContext | null;
    timer: ReturnType<typeof setInterval> | null;
    recognition: MinimalRecognition | null;
    finals: string[];
    confidences: number[];
    interim: string;
    // nativo
    nativeRec: AudioRecorder | null;
  }>({
    vad: new VoiceActivity(),
    startedAt: 0,
    active: false,
    stream: null,
    recorder: null,
    chunks: [],
    audioCtx: null,
    timer: null,
    recognition: null,
    finals: [],
    confidences: [],
    interim: '',
    nativeRec: null,
  });

  const cleanupWeb = useCallback(() => {
    const c = r.current;
    c.active = false;
    if (c.timer) clearInterval(c.timer);
    c.timer = null;
    try {
      c.recognition?.abort();
    } catch {
      // ignore
    }
    c.recognition = null;
    c.stream?.getTracks().forEach((t) => t.stop());
    c.stream = null;
    c.audioCtx?.close().catch(() => undefined);
    c.audioCtx = null;
  }, []);

  useEffect(
    () => () => {
      cleanupWeb();
      r.current.nativeRec?.stop().catch(() => undefined);
      suspendSfx(false);
    },
    [cleanupWeb]
  );

  /* ------------------------------ Inicio ------------------------------ */

  const startNative = async (): Promise<boolean> => {
    const c = r.current;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Necesito permiso del micrófono. Actívalo en Ajustes > Expo Go > Micrófono.');
        return false;
      }
      // Silencio total antes de abrir el micrófono: efectos y voz de la mascota pueden interrumpir la grabación en iOS.
      suspendSfx(true);
      stopSpeaking();
      await AudioModule.setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      const recorder = new AudioModule.AudioRecorder(SPEECH_RECORDING);
      await recorder.prepareToRecordAsync();
      recorder.record();
      c.nativeRec = recorder;
      // Medidor en vivo: dB → amplitud lineal (misma escala que el RMS de la web) para el VAD y la onda.
      c.timer = setInterval(() => {
        const db = recorder.getStatus().metering ?? -160;
        const amp = Math.pow(10, Math.max(-160, Math.min(0, db)) / 20);
        const now = Date.now();
        c.vad.push(amp, now);
        setLevel(Math.min(1, amp * 6));
        setElapsedMs(now - c.startedAt);
      }, 80);
      return true;
    } catch {
      suspendSfx(false);
      setError('No pude iniciar la grabación. Cierra otras apps que usen el micrófono e inténtalo de nuevo.');
      return false;
    }
  };

  const startWeb = async (): Promise<boolean> => {
    const c = r.current;
    if (!support.secureContext) {
      setError('El navegador solo permite el micrófono en https:// o localhost. Abre la app con el enlace https (ver README).');
      return false;
    }
    try {
      c.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setError('No pude acceder al micrófono. Revisa los permisos del navegador.');
      return false;
    }
    Object.assign(c, { chunks: [], finals: [], confidences: [], interim: '' });

    try {
      c.recorder = new MediaRecorder(c.stream);
      c.recorder.ondataavailable = (e) => e.data.size && c.chunks.push(e.data);
      c.recorder.start(250);
    } catch {
      c.recorder = null;
    }

    try {
      const Ctx = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      c.audioCtx = new Ctx() as AudioContext;
      const source = c.audioCtx.createMediaStreamSource(c.stream);
      const analyser = c.audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      c.timer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i]! * buf[i]!;
        const rms = Math.sqrt(sum / buf.length);
        const now = Date.now();
        c.vad.push(rms, now);
        setLevel(Math.min(1, rms * 6));
        setElapsedMs(now - c.startedAt);
      }, 50);
    } catch {
      // sin Web Audio
    }

    const Ctor = getRecognitionCtor();
    if (Ctor) {
      const rec = new Ctor();
      rec.lang = locale;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) {
            c.finals.push(res[0].transcript.trim());
            if (typeof res[0].confidence === 'number' && res[0].confidence > 0) c.confidences.push(res[0].confidence);
          } else interim += res[0].transcript;
        }
        c.interim = interim;
        setLiveTranscript([...c.finals, interim.trim()].filter(Boolean).join(' '));
      };
      rec.onerror = (e: any) => {
        if (e?.error === 'not-allowed') setError('El reconocimiento de voz está bloqueado en este navegador.');
      };
      // Chrome corta el reconocimiento tras silencios: lo reanudamos mientras grabamos.
      rec.onend = () => {
        if (c.active && c.recognition === rec) {
          try {
            rec.start();
          } catch {
            // ignore
          }
        }
      };
      c.recognition = rec;
      try {
        rec.start();
      } catch {
        c.recognition = null;
      }
    }
    return true;
  };

  const start = useCallback(async () => {
    setError(null);
    setLiveTranscript('');
    setElapsedMs(0);
    const c = r.current;
    c.vad = new VoiceActivity();
    c.startedAt = Date.now();
    c.active = true;
    const ok = IS_WEB ? await startWeb() : await startNative();
    if (!ok) {
      c.active = false;
      cleanupWeb();
      return false;
    }
    setState('recording');
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, cleanupWeb]);

  /* ------------------------------ Fin ------------------------------ */

  const stopNative = async (): Promise<CaptureResult> => {
    const c = r.current;
    const endedAt = Date.now();
    let uri: string | null = null;
    if (c.timer) clearInterval(c.timer);
    c.timer = null;
    try {
      if (c.nativeRec) {
        await c.nativeRec.stop();
        uri = c.nativeRec.uri ?? null;
      }
    } catch {
      uri = null;
    }
    c.nativeRec = null;
    // Devuelve el audio al altavoz para escuchar la grabación y la voz de la mascota.
    await AudioModule.setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    suspendSfx(false);
    const server = uri ? await transcribeRecording(uri, locale, referenceRef.current) : null;
    return {
      transcript: server?.transcript ?? '',
      audioUrl: uri,
      metrics: {
        ...c.vad.metrics(c.startedAt, endedAt, server?.confidence ?? null),
        assessedPronunciation: server?.pronunciation?.pronScore ?? null,
      },
      pronunciation: server?.pronunciation ?? null,
      silent: server?.silent ?? false,
      review: uri && server?.reviewAvailable ? reviewRecording(uri, locale, referenceRef.current) : null,
    };
  };

  const stopWeb = async (): Promise<CaptureResult> => {
    const c = r.current;
    const endedAt = Date.now();
    const recognition = c.recognition;
    const recognitionDone = new Promise<void>((resolve) => {
      if (!recognition) return resolve();
      const t = setTimeout(resolve, 1500);
      recognition.onend = () => {
        clearTimeout(t);
        resolve();
      };
      try {
        recognition.stop();
      } catch {
        clearTimeout(t);
        resolve();
      }
    });
    const recorderDone = new Promise<Blob | null>((resolve) => {
      const rec = c.recorder;
      if (!rec || rec.state === 'inactive') return resolve(null);
      rec.onstop = () => {
        const blob = new Blob(c.chunks, { type: rec.mimeType || 'audio/webm' });
        resolve(blob.size ? blob : null);
      };
      rec.stop();
    });
    const [, blob] = await Promise.all([recognitionDone, recorderDone]);
    const audioUrl = blob ? URL.createObjectURL(blob) : null;
    if (c.interim.trim()) c.finals.push(c.interim.trim());
    const confidence = c.confidences.length
      ? c.confidences.reduce((a, b) => a + b, 0) / c.confidences.length
      : null;
    const webTranscript = c.finals.join(' ').replace(/\s+/g, ' ').trim();
    const vadMetrics = c.vad.metrics(c.startedAt, endedAt, confidence);
    cleanupWeb();
    // Si el backend tiene voz configurada, también evalúa la pronunciación de la grabación web.
    const server = blob ? await transcribeRecording(blob, locale, referenceRef.current) : null;
    return {
      transcript: server?.transcript || webTranscript,
      audioUrl,
      metrics: { ...vadMetrics, assessedPronunciation: server?.pronunciation?.pronScore ?? null },
      pronunciation: server?.pronunciation ?? null,
      silent: !!server?.silent && !webTranscript,
      review: blob && server?.reviewAvailable ? reviewRecording(blob, locale, referenceRef.current) : null,
    };
  };

  const stop = useCallback(async (): Promise<CaptureResult> => {
    setState('processing');
    r.current.active = false;
    const result = IS_WEB ? await stopWeb() : await stopNative();
    setLevel(0);
    setState('idle');
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanupWeb, locale]);

  const cancel = useCallback(() => {
    try {
      r.current.recorder?.stop();
    } catch {
      // ignore
    }
    r.current.nativeRec?.stop().catch(() => undefined);
    r.current.nativeRec = null;
    suspendSfx(false);
    cleanupWeb();
    setLevel(0);
    setState('idle');
  }, [cleanupWeb]);

  return { state, start, stop, cancel, liveTranscript, level, elapsedMs, error, support };
}

/** Métricas estimadas cuando el usuario escribe lo que dijo (sin micrófono). */
export function estimatedMetricsFromText(text: string): SpeechAudioMetrics {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const durationMs = Math.max(4000, words * 520);
  return {
    durationMs,
    voicedMs: Math.round(durationMs * 0.8),
    pauseCount: Math.floor(words / 14),
    longestPauseMs: 900,
    recognitionConfidence: null,
    averageLevel: 0,
  };
}

let currentPlayer: AudioPlayer | null = null;

/** Reproduce una grabación (blob URL en web, archivo local en el teléfono). */
export async function playAudioUrl(url: string) {
  if (IS_WEB) {
    if (typeof window === 'undefined' || !(window as any).Audio) return;
    const el = new (window as any).Audio(url) as HTMLAudioElement;
    el.play().catch(() => undefined);
    return;
  }
  try {
    currentPlayer?.release();
    const player = createAudioPlayer({ uri: url }, { keepAudioSessionActive: true });
    player.play();
    currentPlayer = player;
  } catch {
    // ignore
  }
}
