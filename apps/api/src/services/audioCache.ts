import { randomUUID } from 'node:crypto';

/**
 * Guarda unos minutos el WAV ya convertido de cada grabación y la revisión de pronunciación
 * que se lanzó en paralelo. Así /api/speech/review no vuelve a subir ni a convertir el audio
 * y la revisión empieza a la vez que la transcripción, no después.
 *
 * Vive en memoria de esta instancia: si el servidor se reinicia o la petición cae en otra
 * instancia, /review responde "audio_expired" y la app reenvía el audio (camino de siempre).
 */

export interface CachedAudio<R> {
  wav: Buffer;
  language: string;
  referenceText: string;
  createdAt: number;
  /** Revisión en curso o terminada (nunca rechaza: null si falló). */
  review: Promise<R | null> | null;
}

export class AudioCache<R> {
  private entries = new Map<string, CachedAudio<R>>();

  constructor(
    private readonly ttlMs = 10 * 60_000,
    private readonly maxBytes = 160 * 1024 * 1024,
    private readonly now: () => number = Date.now
  ) {}

  put(wav: Buffer, meta: { language: string; referenceText: string }): string {
    this.prune();
    const id = randomUUID();
    this.entries.set(id, { wav, ...meta, createdAt: this.now(), review: null });
    this.prune();
    return id;
  }

  get(id: unknown): CachedAudio<R> | null {
    if (typeof id !== 'string') return null;
    const entry = this.entries.get(id);
    if (!entry) return null;
    if (this.now() - entry.createdAt > this.ttlMs) {
      this.entries.delete(id);
      return null;
    }
    return entry;
  }

  /** Lanza (una sola vez) la revisión de esa grabación y devuelve la promesa compartida. */
  startReview(id: string, run: (entry: CachedAudio<R>) => Promise<R>): Promise<R | null> | null {
    const entry = this.get(id);
    if (!entry) return null;
    if (!entry.review) {
      entry.review = run(entry).catch((err) => {
        console.warn(`[LingoPulse API] revisión en paralelo falló: ${err instanceof Error ? err.message : err}`);
        return null;
      });
    }
    return entry.review;
  }

  get size(): number {
    return this.entries.size;
  }

  /** Quita lo caducado y, si se pasa de memoria, lo más antiguo. */
  private prune() {
    const t = this.now();
    let bytes = 0;
    for (const [id, e] of this.entries) {
      if (t - e.createdAt > this.ttlMs) this.entries.delete(id);
      else bytes += e.wav.length;
    }
    for (const [id, e] of this.entries) {
      if (bytes <= this.maxBytes) break;
      bytes -= e.wav.length;
      this.entries.delete(id);
    }
  }
}
