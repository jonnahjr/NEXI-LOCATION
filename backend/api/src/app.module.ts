import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationsModule } from './notifications/notifications.module';
import { BusinessesModule } from './businesses/businesses.module';
import { EmbeddingModule } from './embedding/embedding.module';
import { Business } from './businesses/business.entity';
import { SavedPlace } from './businesses/saved-place.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'data/nexi.db',
      entities: [Business, SavedPlace],
      synchronize: true, // Auto-create tables in development
    }),
    NotificationsModule,
    BusinessesModule,
    EmbeddingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
