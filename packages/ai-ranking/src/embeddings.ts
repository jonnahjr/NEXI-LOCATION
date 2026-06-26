// ═══════════════════════════════════════════════════════════════════════════
// Vector Embeddings — Cosine Similarity & Embedding Interfaces
// Upgrades the ranking engine from static category matching → semantic vectors
// ═══════════════════════════════════════════════════════════════════════════

// ── Embedding Config ──────────────────────────────────────────────────────
export const EMBEDDING_DIMENSIONS = 384; // all-MiniLM-L6-v2 (local fallback)
export const OPENAI_EMBEDDING_DIMENSIONS = 1536; // text-embedding-3-small
export const EMBEDDING_MODEL = 'text-embedding-3-small';

// ── Embedding Vector Type ─────────────────────────────────────────────────
export type EmbeddingVector = number[];

// ── Embedding Provider Interface ───────────────────────────────────────────
// Allows swapping between OpenAI API and local model (Transformers.js)
export interface EmbeddingProvider {
  /** Generate a single embedding for a text string */
  embed(text: string): Promise<EmbeddingVector>;

  /** Generate embeddings for multiple texts (batch) */
  embedBatch(texts: string[]): Promise<EmbeddingVector[]>;

  /** Whether this provider is available/configured */
  isAvailable(): boolean;

  /** The dimension of vectors this provider produces */
  dimensions(): number;
}

// ── Cosine Similarity ─────────────────────────────────────────────────────
/**
 * Compute cosine similarity between two vectors.
 * Returns 0–1 where 1 = identical direction.
 * Handles zero-vectors gracefully (returns 0).
 */
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Compute cosine similarity between a query vector and multiple candidates.
 * Returns sorted results (highest similarity first).
 */
export function rankByCosineSimilarity(
  queryVector: EmbeddingVector,
  candidates: Array<{ id: string; vector: EmbeddingVector }>,
  topK = 50,
): Array<{ id: string; similarity: number }> {
  const scored = candidates
    .map((c) => ({
      id: c.id,
      similarity: cosineSimilarity(queryVector, c.vector),
    }))
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, topK);
}

// ── Embedding Text Construction ───────────────────────────────────────────
/**
 * Build a semantic text representation of a business for embedding.
 * This is the text that gets sent to the embedding model.
 * The richer the text, the better the semantic matching.
 */
export function buildBusinessEmbeddingText(params: {
  name: string;
  category: string;
  description: string;
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

  if (params.features && params.features.length > 0) {
    parts.push(`Amenities: ${params.features.join(', ')}`);
  }

  if (params.priceLevel && params.priceLevel > 0) {
    const level = params.priceLevel === 1 ? 'Budget-friendly' :
                  params.priceLevel === 2 ? 'Mid-range' :
                  params.priceLevel === 3 ? 'Premium' : '';
    if (level) parts.push(`Price Level: ${level}`);
  }

  if (params.address) {
    parts.push(`Location: ${params.address}`);
  }

  return parts.join('. ');
}

/**
 * Build a semantic text representation of a user's preferences for embedding.
 * This creates a "user profile query" that can be compared against business embeddings.
 */
export function buildUserEmbeddingText(params: {
  favoriteCategories: string[];
  topCategories: string[];
  categoryNames?: string[];        // resolved category labels
  totalInteractions: number;
  preferredTimeSlot?: string;
  avgSpendLevel?: number;
}): string {
  const parts: string[] = [];

  if (params.topCategories.length > 0 || params.favoriteCategories.length > 0) {
    const cats = params.categoryNames?.length
      ? params.categoryNames
      : [...params.topCategories, ...params.favoriteCategories];
    parts.push(`Preferred categories: ${[...new Set(cats)].join(', ')}`);
  }

  if (params.avgSpendLevel && params.avgSpendLevel > 0) {
    const level = params.avgSpendLevel === 1 ? 'Budget-friendly' :
                  params.avgSpendLevel === 2 ? 'Mid-range' :
                  params.avgSpendLevel === 3 ? 'Premium' : '';
    if (level) parts.push(`Prefers: ${level} places`);
  }

  if (params.preferredTimeSlot && params.preferredTimeSlot !== 'mixed') {
    parts.push(`Active during: ${params.preferredTimeSlot}`);
  }

  if (params.totalInteractions > 0) {
    parts.push(`Experience level: ${params.totalInteractions < 10 ? 'Exploring new places' : 'Experienced explorer'}`);
  }

  return parts.join('. ');
}

/**
 * Combine multiple business embeddings into a single user preference vector.
 * Uses weighted average — saved places get more weight, views get less.
 */
export function aggregateUserEmbedding(
  embeddings: Array<{ vector: EmbeddingVector; weight: number }>,
): EmbeddingVector {
  if (embeddings.length === 0) return [];
  if (embeddings.length === 1) return [...embeddings[0].vector];

  const dims = embeddings[0].vector.length;

  // Check all vectors have same dimensions
  for (const e of embeddings) {
    if (e.vector.length !== dims) return []; // dimension mismatch
  }

  const totalWeight = embeddings.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight === 0) return [];

  const result = new Array(dims).fill(0);
  for (const { vector, weight } of embeddings) {
    for (let i = 0; i < dims; i++) {
      result[i] += (vector[i] * weight) / totalWeight;
    }
  }

  return result;
}

// ── Normalization ───────────────────────────────────────────────────────────
/**
 * L2-normalize a vector (unit length). Optimized for cosine similarity
 * since cos(a,b) = dot(a_norm, b_norm) when both are normalized.
 */
export function normalizeVector(v: EmbeddingVector): EmbeddingVector {
  let sumSq = 0;
  for (const x of v) sumSq += x * x;
  const mag = Math.sqrt(sumSq);
  if (mag === 0) return v;
  return v.map((x) => x / mag);
}
