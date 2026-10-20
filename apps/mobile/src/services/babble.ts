import { Platform } from 'react-native';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import { initAppAudio, isSfxMuted } from './sfx';
import { BABBLE_SAMPLE_RATE as SR, synthesizeBabble, toWavBytes, type BabbleOptions } from './babbleSynth';

/**
 * Balbuceo de la mascota (estilo Animalese / Tomodachi): cada letra del texto se convierte en
 * un "blip" cantarín con el timbre de una vocal y el tono de la voz de la mascota. Acompaña a
 * los globos de texto de la mascota; el inglés que hay que aprender se oye con la voz neuronal.
 */

let webCtx: AudioContext | null = null;
let webSource: AudioBufferSourceNode | null = null;
let nativePlayer: AudioPlayer | null = null;
let doneTimer: ReturnType<typeof setTimeout> | null = null;
let babbleSlot = 0;

export function stopBabble() {
  if (doneTimer) clearTimeout(doneTimer);
  doneTimer = null;
  try {
    webSource?.stop();
  } catch {
    // ya terminó
  }
  webSource = null;
  nativePlayer?.pause();
}

/**
 * Balbucea una frase. Llama a onStart/onDone para animar la boca de la mascota mientras suena.
 * Devuelve la duración en milisegundos.
 */
export function babble(text: string, opts: BabbleOptions & { onStart?: () => void; onDone?: () => void } = {}): number {
  stopBabble();
  const samples = synthesizeBabble(text, opts);
  const ms = Math.round((samples.length / SR) * 1000);
  const finish = () => opts.onDone?.();
  if (isSfxMuted() || !text.trim()) {
    finish();
    return 0;
  }
  opts.onStart?.();
  doneTimer = setTimeout(finish, ms);
  if (Platform.OS === 'web') {
    try {
      const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return ms;
      webCtx ??= new Ctx();
      const buf = webCtx.createBuffer(1, samples.length, SR);
      buf.copyToChannel(samples, 0);
      const src = webCtx.createBufferSource();
      src.buffer = buf;
      src.connect(webCtx.destination);
      src.start();
      webSource = src;
    } catch {
      // sin audio web
    }
    return ms;
  }
  void (async () => {
    try {
      await initAppAudio();
      // Se libera el reproductor anterior antes de escribir; el nombre rota para no leer un archivo a medias.
      nativePlayer?.release();
      nativePlayer = null;
      babbleSlot = (babbleSlot + 1) % 3;
      const file = new File(Paths.cache, `lingopulse-babble-${babbleSlot}.wav`);
      file.create({ overwrite: true });
      file.write(toWavBytes(samples));
      nativePlayer = createAudioPlayer({ uri: file.uri }, { keepAudioSessionActive: true });
      nativePlayer.volume = 0.9;
      nativePlayer.play();
    } catch {
      // silencioso si el audio está ocupado
    }
  })();
  return ms;
}
