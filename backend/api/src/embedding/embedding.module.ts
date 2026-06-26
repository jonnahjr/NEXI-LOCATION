// ═══════════════════════════════════════════════════════════════════════════
// Embedding Module
// Registers the EmbeddingService and EmbeddingController.
// ═══════════════════════════════════════════════════════════════════════════

import { Module } from '@nestjs/common';
import { EmbeddingController } from './embedding.controller';
import { EmbeddingService } from './embedding.service';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
  imports: [BusinessesModule],
  controllers: [EmbeddingController],
  providers: [EmbeddingService],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
