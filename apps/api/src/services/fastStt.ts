import { isSpeechToTextEnabled, transcribeAudio } from './speechToText.js';
import { analyzeLevels, hasUsableSpeech, normalizeGain, toWav16k } from './audio.js';
import { isGeminiEnabled, transcribeWithGemini } from './gemini.js';

/**
 * Transcripción rápida para la conversación de la Voice Arena: solo el texto, sin evaluación de
 * pronunciación (que es lo que tarda). Usa el proveedor más veloz disponible:
 * Deepgram (sin convertir el audio) → Azure STT corto → Gemini Flash-Lite.
 */

export function isFastSttEnabled(): boolean {
  return isSpeechToTextEnabled() || (!!process.env.AZURE_SPEECH_KEY && !!process.env.AZURE_SPEECH_REGION) || isGeminiEnabled();
}

export interface FastTranscript {
  transcript: string;
  silent: boolean;
  provider: 'deepgram' | 'azure' | 'gemini';
}

async function azureShortStt(wav: Buffer, language: string): Promise<string> {
  const params = new URLSearchParams({ language: language === 'en-GB' ? 'en-GB' : 'en-US', format: 'simple' });
  const res = await fetch(
    `https://${process.env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?${params}`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        Accept: 'application/json',
      },
      body: wav,
    }
  );
  if (!res.ok) throw new Error(`Azure STT HTTP ${res.status}`);
  const data = (await res.json()) as { RecognitionStatus?: string; DisplayText?: string };
  return data.RecognitionStatus === 'Success' ? (data.DisplayText ?? '').trim() : '';
}

export async function fastTranscribe(audio: Buffer, mimeType: string, language: string): Promise<FastTranscript> {
  if (isSpeechToTextEnabled()) {
    const r = await transcribeAudio(audio, mimeType, language);
    return { transcript: r.transcript, silent: !r.transcript, provider: 'deepgram' };
  }
  const raw = await toWav16k(audio, mimeType);
  if (!hasUsableSpeech(analyzeLevels(raw))) {
    return { transcript: '', silent: true, provider: process.env.AZURE_SPEECH_KEY ? 'azure' : 'gemini' };
  }
  const wav = normalizeGain(raw);
  if (process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION) {
    return { transcript: await azureShortStt(wav, language), silent: false, provider: 'azure' };
  }
  return { transcript: await transcribeWithGemini(wav, { fast: true }), silent: false, provider: 'gemini' };
}
