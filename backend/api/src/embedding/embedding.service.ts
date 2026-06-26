// ═══════════════════════════════════════════════════════════════════════════
// Embedding Service
// Generates vector embeddings for businesses and user preferences.
// Primary: OpenAI text-embedding-3-small (1536 dims)
// Fallback: Local lightweight model via simple hash-based encoding
// ═══════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';

export interface EmbeddingOptions {
  model?: 'openai' | 'local';
  dimensions?: number;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openaiAvailable = false;

  constructor() {
    this.checkOpenAI();
  }

  /**
   * Check if OpenAI API key is available.
   * We try to load it dynamically so the app starts even without one.
   */
  private checkOpenAI(): void {
    try {
      const key = process.env.OPENAI_API_KEY;
      if (key && key.length > 0) {
        this.openaiAvailable = true;
        this.logger.log('OpenAI embedding service available (text-embedding-3-small)');
      } else {
        this.logger.warn(
          'No OPENAI_API_KEY found — using local embedding fallback. ' +
          'Set OPENAI_API_KEY for semantic vector embeddings.'
        );
      }
    } catch {
      this.openaiAvailable = false;
    }
  }

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Generate an embedding vector for a single text string.
   */
  async embed(text: string, options?: EmbeddingOptions): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return this.embedWithLocalFallback('empty');
    }

    try {
      if (this.openaiAvailable && options?.model !== 'local') {
        return await this.embedWithOpenAI(text, options?.dimensions);
      }
    } catch (err) {
      this.logger.warn(`OpenAI embedding failed, falling back to local: ${err}`);
    }

    return this.embedWithLocalFallback(text);
  }

  /**
   * Generate embeddings for multiple texts in batch.
   */
  async embedBatch(texts: string[], options?: EmbeddingOptions): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      if (this.openaiAvailable && options?.model !== 'local') {
        return await this.embedBatchWithOpenAI(texts, options?.dimensions);
      }
    } catch (err) {
      this.logger.warn(`OpenAI batch embedding failed, falling back to local: ${err}`);
    }

    // Local fallback processes sequentially
    return Promise.all(texts.map(t => this.embedWithLocalFallback(t)));
  }

  /**
   * Build the default semantic text for a business and embed it.
   */
  async embedBusiness(params: {
    name: string;
    category: string;
    description?: string;
    features?: string[];
    address?: string;
    priceLevel?: number;
  }): Promise<{ embedding: number[]; text: string }> {
    const text = this.buildBusinessText(params);
    const embedding = await this.embed(text);
    return { embedding, text };
  }

  /**
   * Build the default semantic text for a user's preferences and embed it.
   */
  async embedUserPreferences(params: {
    favoriteCategories: string[];
    topCategories?: string[];
    avgSpendLevel?: number;
    preferredTimeSlot?: string;
    totalInteractions?: number;
  }): Promise<{ embedding: number[]; text: string }> {
    const text = this.buildUserPreferenceText(params);
    const embedding = await this.embed(text);
    return { embedding, text };
  }

  // ── OpenAI Embedding ──────────────────────────────────────────────────

  private async embedWithOpenAI(text: string, dimensions?: number): Promise<number[]> {
    // Dynamic import — only resolves when OPENAI_API_KEY is set
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: dimensions ?? 1536,
    });

    return response.data[0].embedding;
  }

  private async embedBatchWithOpenAI(texts: string[], dimensions?: number): Promise<number[][]> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: dimensions ?? 1536,
    });

    // Return in the same order as input
    return response.data.map(d => d.embedding);
  }

  // ── Local Fallback ────────────────────────────────────────────────────
  // Simple hash-based embedding that produces a 384-dim vector.
  // This is NOT ML-based — it's a deterministic feature hash.
  // For real semantic matching, set OPENAI_API_KEY.
  // For a proper local model, install @xenova/transformers.

  private embedWithLocalFallback(text: string): number[] {
    const dims = 384;
    const vector = new Array(dims).fill(0);

    // Split text into words and hash each word into vector positions
    const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 0);
    const seen = new Set<string>();

    for (const word of words) {
      if (seen.has(word)) continue;
      seen.add(word);

      // Hash the word to get positions and values
      const hash1 = this.simpleHash(word);
      const hash2 = this.simpleHash(word + '_offset');

      for (let i = 0; i < 3; i++) {
        const pos = Math.abs(hash1 + i * hash2) % dims;
        vector[pos] += 0.1 + (hash2 % 10) * 0.02;
      }
    }

    // L2 normalize
    let sumSq = 0;
    for (const v of vector) sumSq += v * v;
    const mag = Math.sqrt(sumSq);
    if (mag > 0) {
      for (let i = 0; i < dims; i++) vector[i] /= mag;
    }

    return vector;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  // ── Text Builders ─────────────────────────────────────────────────────

  private buildBusinessText(params: {
    name: string;
    category: string;
    description?: string;
    features?: string[];
    address?: string;
    priceLevel?: number;
  }): string {
    const parts: string[] = [];
    parts.push(`Business Name: ${params.name}`);
    parts.push(`Category: ${params.category}`);

    if (params.description) {
      parts.push(`Description: ${params.description}`);
    }

    if (params.features?.length) {
      parts.push(`Amenities: ${params.features.join(', ')}`);
    }

    if (params.priceLevel) {
      const level = params.priceLevel === 1 ? 'Budget-friendly' :
                    params.priceLevel === 2 ? 'Mid-range' : 'Premium';
      parts.push(`Price Level: ${level}`);
    }

    if (params.address) {
      parts.push(`Location: ${params.address}`);
    }

    return parts.join('. ');
  }

  private buildUserPreferenceText(params: {
    favoriteCategories: string[];
    topCategories?: string[];
    avgSpendLevel?: number;
    preferredTimeSlot?: string;
    totalInteractions?: number;
  }): string {
    const parts: string[] = [];

    const allCats = [...new Set([
      ...(params.topCategories ?? []),
      ...params.favoriteCategories,
    ])];

    if (allCats.length > 0) {
      parts.push(`Interested in: ${allCats.join(', ')} places`);
    }

    if (params.avgSpendLevel && params.avgSpendLevel > 0) {
      const level = params.avgSpendLevel === 1 ? 'Budget-friendly' :
                    params.avgSpendLevel === 2 ? 'Mid-range' : 'Premium';
      parts.push(`Price preference: ${level}`);
    }

    if (params.preferredTimeSlot && params.preferredTimeSlot !== 'mixed') {
      parts.push(`Active during: ${params.preferredTimeSlot}`);
    }

    return parts.join('. ');
  }
}
