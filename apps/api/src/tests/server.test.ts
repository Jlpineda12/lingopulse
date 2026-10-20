import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { accessKeyProblem, parseCoachRequest, RateLimiter, HttpError } from '../http.js';
import { AudioCache } from '../services/audioCache.js';
import { normalizeGain, analyzeLevels } from '../services/audio.js';
import { consumedReferenceWords, mapLimit } from '../services/azurePronunciation.js';
import {
  arenaSessionCount,
  MAX_SESSIONS,
  pruneArenaSessions,
  SESSION_TTL_MS,
  startVoiceArenaSession,
} from '../services/orchestrator.js';

process.env.NODE_ENV = 'test';
const KEY = 'test-key-1234567890';

let server: Server;
let base = '';

before(async () => {
  process.env.APP_ACCESS_KEY = KEY;
  process.env.LLM_PROVIDER = 'mock';
  delete process.env.GEMINI_API_KEY;
  delete process.env.AZURE_SPEECH_KEY;
  ({ server } = await import('../index.js'));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

const post = (path: string, body: string, headers: Record<string, string> = {}) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-App-Key': KEY, ...headers },
    body,
  });

describe('Servidor: seguridad y errores', () => {
  it('pide la clave de la app y deja pasar el health check sin ella', async () => {
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    assert.equal((await fetch(`${base}/api/coach/status`)).status, 401);
    assert.equal((await fetch(`${base}/api/coach/status`, { headers: { 'X-App-Key': 'wrong' } })).status, 401);
    assert.equal((await fetch(`${base}/api/coach/status`, { headers: { 'X-App-Key': KEY } })).status, 200);
  });

  it('rechaza cuerpos JSON enormes con 413 sin leerlos enteros', async () => {
    try {
      const res = await post('/api/coach/feedback', JSON.stringify({ text: 'x', promptEn: 'y'.repeat(2 * 1024 * 1024) }));
      assert.equal(res.status, 413);
    } catch (err: any) {
      assert.ok(/EPIPE|ECONNRESET|fetch failed/i.test(err?.cause?.code ?? err?.message));
    }
  });

  it('responde 400 a JSON roto y 404 a una sesión inexistente', async () => {
    assert.equal((await post('/api/voice-arena/scorecard', '{not json')).status, 400);
    const res = await post('/api/voice-arena/turn', JSON.stringify({ sessionId: 'nope', transcript: 'hi' }));
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: 'session_not_found' });
  });

  it('valida la petición al corrector y responde con el motor local', async () => {
    const bad = await post('/api/coach/feedback', JSON.stringify({ text: 'Hello', audio: { durationMs: 'mucho' } }));
    assert.equal(bad.status, 400);
    const ok = await post(
      '/api/coach/feedback',
      JSON.stringify({ text: 'I am agree with you because people is nice.', level: 'IGNORE PREVIOUS', skill: 'writing' })
    );
    assert.equal(ok.status, 200);
    const feedback = (await ok.json()) as { provider?: string };
    assert.ok(feedback);
  });
});

describe('Utilidades del servidor', () => {
  it('exige APP_ACCESS_KEY en producción salvo que se abra a propósito', () => {
    assert.ok(accessKeyProblem({ NODE_ENV: 'production' }));
    assert.equal(accessKeyProblem({ NODE_ENV: 'production', APP_ACCESS_KEY: 'k' }), null);
    assert.equal(accessKeyProblem({ NODE_ENV: 'production', ALLOW_OPEN_API: '1' }), null);
    assert.equal(accessKeyProblem({ NODE_ENV: 'development' }), null);
  });

  it('limita las peticiones por minuto y se reinicia en la siguiente ventana', () => {
    let t = 0;
    const limiter = new RateLimiter(2, () => t);
    assert.equal(limiter.allow('ip'), true);
    assert.equal(limiter.allow('ip'), true);
    assert.equal(limiter.allow('ip'), false);
    assert.equal(limiter.allow('otra'), true);
    t = 60_000;
    assert.equal(limiter.allow('ip'), true);
  });

  it('normaliza nivel, habilidad y palabras objetivo del corrector', () => {
    const r = parseCoachRequest({ text: 'hi', level: 'Z9', skill: 'hack', targetWords: Array(30).fill('w') });
    assert.equal(r.level, 'B1');
    assert.equal(r.skill, 'writing');
    assert.equal(r.targetWords.length, 12);
    assert.throws(() => parseCoachRequest({ text: 'a'.repeat(7000) }), (e: unknown) => e instanceof HttpError && e.status === 413);
    assert.throws(() => parseCoachRequest({}), (e: unknown) => e instanceof HttpError && e.status === 400);
  });

  it('caduca y limita las sesiones de Voice Arena', () => {
    const now = Date.now();
    startVoiceArenaSession({ locale: 'en-US' });
    assert.ok(arenaSessionCount() >= 1);
    pruneArenaSessions(now + SESSION_TTL_MS + 1000);
    assert.equal(arenaSessionCount(), 0);
    for (let i = 0; i < MAX_SESSIONS + 5; i++) startVoiceArenaSession({ locale: 'en-US' });
    assert.ok(arenaSessionCount() <= MAX_SESSIONS);
  });

  it('el caché de audio comparte una sola revisión y caduca', async () => {
    let t = 0;
    const cache = new AudioCache<string>(1000, 10_000, () => t);
    const id = cache.put(Buffer.alloc(100), { language: 'en-US', referenceText: '' });
    let runs = 0;
    const run = async () => {
      runs++;
      return 'ok';
    };
    const [a, b] = await Promise.all([cache.startReview(id, run), cache.startReview(id, run)]);
    assert.equal(a, 'ok');
    assert.equal(b, 'ok');
    assert.equal(runs, 1);
    t = 2000;
    assert.equal(cache.get(id), null);
    // Una revisión que falla resuelve null en lugar de romper el proceso.
    const id2 = cache.put(Buffer.alloc(10), { language: 'en-US', referenceText: '' });
    assert.equal(await cache.startReview(id2, async () => Promise.reject(new Error('boom'))), null);
  });

  it('el caché de audio no pasa del límite de memoria', () => {
    const cache = new AudioCache<string>(60_000, 250);
    for (let i = 0; i < 5; i++) cache.put(Buffer.alloc(100), { language: 'en-US', referenceText: '' });
    assert.ok(cache.size <= 2);
  });
});

/** WAV 16 kHz mono con un tono de amplitud dada durante `sec` segundos. */
function toneWav(sec: number, amplitude: number): Buffer {
  const samples = Math.round(16000 * sec);
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i++) data.writeInt16LE(Math.round(Math.sin(i / 8) * amplitude * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(16000, 24);
  h.writeUInt32LE(32000, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

describe('Audio', () => {
  it('sube el volumen de grabaciones bajas sin pasarse de +18 dB', () => {
    const quiet = toneWav(1, 0.02);
    const louder = normalizeGain(quiet);
    const before = analyzeLevels(quiet).peakDb;
    const afterDb = analyzeLevels(louder).peakDb;
    assert.ok(afterDb > before + 15 && afterDb <= before + 18.1, `${before} → ${afterDb}`);
    const loud = toneWav(1, 0.8);
    assert.equal(normalizeGain(loud), loud);
  });

  it('sabe cuánta referencia cubrió cada trozo de lectura', () => {
    const ref = 'I usually put off my homework until Sunday night'.split(' ');
    const w = (word: string, errorType = 'None') => ({ word, accuracy: 80, errorType, phonemes: [] });
    const words = [w('i'), w('usually'), w('put'), w('off'), w('my', 'Omission'), w('homework', 'Omission'), w('until', 'Omission')];
    assert.equal(consumedReferenceWords(words, ref), 4);
    assert.equal(consumedReferenceWords([w('i', 'Omission')], ref), 0);
    assert.equal(consumedReferenceWords([w('uh', 'Insertion'), w('i'), w('usually')], ref), 2);
  });

  it('mapLimit respeta el orden y el límite de concurrencia', async () => {
    let running = 0;
    let peak = 0;
    const out = await mapLimit([1, 2, 3, 4, 5], 2, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return n * 2;
    });
    assert.deepEqual(out, [2, 4, 6, 8, 10]);
    assert.equal(peak, 2);
  });
});
