// ═══════════════════════════════════════════════════════════════════════════
// Embedding Controller
// REST endpoints for generating and searching with vector embeddings.
// ═══════════════════════════════════════════════════════════════════════════

import { Controller, Post, Get, Body, Param, Query, Logger } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { BusinessesService } from '../businesses/businesses.service';

@Controller('embeddings')
export class EmbeddingController {
  private readonly logger = new Logger(EmbeddingController.name);

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly businessesService: BusinessesService,
  ) {}

  /**
   * Generate embedding for a single text string.
   */
  @Post('generate')
  async generateEmbedding(
    @Body() body: { text: string; model?: 'openai' | 'local' },
  ): Promise<{ embedding: number[] }> {
    const embedding = await this.embeddingService.embed(body.text, {
      model: body.model,
    });
    return { embedding };
  }

  /**
   * Generate and store embeddings for all businesses.
   * Useful for initial seeding or re-indexing after data changes.
   */
  @Post('index-all')
  async indexAllBusinesses(): Promise<{ indexed: number; failed: number }> {
    const businesses = await this.businessesService.findAll();
    let indexed = 0;
    let failed = 0;

    for (const biz of businesses) {
      try {
        const { embedding, text } = await this.embeddingService.embedBusiness({
          name: biz.name,
          category: biz.category,
          description: biz.description,
          address: biz.address,
        });

        // Store as JSON string in the embedding column
        await this.businessesService.updateEmbedding(biz.id, JSON.stringify(embedding), text);
        indexed++;
      } catch (err) {
        this.logger.error(`Failed to index business ${biz.id}: ${err}`);
        failed++;
      }
    }

    this.logger.log(`Indexed ${indexed} businesses (${failed} failed)`);
    return { indexed, failed };
  }

  /**
   * Generate embedding for a single business by ID.
   */
  @Post('index/:id')
  async indexBusiness(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      const biz = await this.businessesService.findById(id);
      const { embedding, text } = await this.embeddingService.embedBusiness({
        name: biz.name,
        category: biz.category,
        description: biz.description,
        address: biz.address,
      });
      await this.businessesService.updateEmbedding(id, JSON.stringify(embedding), text);
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to index business ${id}: ${err}`);
      return { success: false };
    }
  }

  /**
   * Generate a user preference embedding from their category likes.
   */
  @Post('user-profile')
  async generateUserEmbedding(
    @Body() body: {
      favoriteCategories: string[];
      topCategories?: string[];
      avgSpendLevel?: number;
      preferredTimeSlot?: string;
      totalInteractions?: number;
    },
  ): Promise<{ embedding: number[]; text: string }> {
    return this.embeddingService.embedUserPreferences(body);
  }

  /**
   * Search businesses by embedding similarity (semantic search).
   * Takes a text query, embeds it, then ranks businesses by cosine similarity
   * against their stored embeddings.
   */
  @Get('search')
  async semanticSearch(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    if (!query || query.trim().length === 0) return [];

    const queryEmbedding = await this.embeddingService.embed(query);
    const businesses = await this.businessesService.findAll();
    const maxResults = limit ? parseInt(limit, 10) : 20;

    // Score each business by cosine similarity
    const scored = [];
    for (const biz of businesses) {
      const storedEmbedding = (biz as any).embedding;
      if (!storedEmbedding) continue;

      try {
        const bizVector = typeof storedEmbedding === 'string'
          ? JSON.parse(storedEmbedding)
          : storedEmbedding;

        if (!Array.isArray(bizVector) || bizVector.length === 0) continue;

        const similarity = this.cosineSimilarity(queryEmbedding, bizVector);
        scored.push({
          id: biz.id,
          name: biz.name,
          category: biz.category,
          rating: biz.rating,
          reviews: biz.reviews,
          description: biz.description?.substring(0, 150),
          similarity: Number(similarity.toFixed(4)),
        });
      } catch {
        continue;
      }
    }

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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
}
