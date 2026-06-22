import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile app connections (development)
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Set global prefix for REST API
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Nexi Backend running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`🔌 WebSocket available at ws://localhost:${process.env.PORT ?? 3000}/notifications`);
}
bootstrap();
