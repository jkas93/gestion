import * as dotenv from 'dotenv';
import * as path from 'path';

// Carga explícita de variables de entorno antes de cualquier otra cosa
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors(); // Enable CORS for the frontend
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 API ejecutándose en: http://localhost:${port}`);
}
bootstrap();
