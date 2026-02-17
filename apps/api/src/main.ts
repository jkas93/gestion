import * as dotenv from 'dotenv';
import * as path from 'path';

// Carga explícita de variables de entorno (Robustez para Monorepo)
const envPaths = [
  path.join(__dirname, '..', '.env'),           // apps/api/.env
  path.join(__dirname, '..', '..', '..', '.env'), // Root .env (workspace)
];
envPaths.forEach(p => dotenv.config({ path: p }));

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const bootstrapStartTime = Date.now();
  const logger = new Logger('Bootstrap');

  logger.log('🚀 Iniciando Golden Tower ERP API...');

  // Fase 1: Carga de variables de entorno
  logger.log(`✅ Variables de entorno cargadas desde: ${__dirname}/../.env`);
  logger.log(`📌 Puerto configurado: ${process.env.PORT ?? 3000}`);

  // Fase 2: Creación de aplicación NestJS
  const appStartTime = Date.now();
  const app = await NestFactory.create(AppModule);
  const appCreationTime = Date.now() - appStartTime;
  logger.log(`✅ Aplicación NestJS creada en ${appCreationTime}ms`);

  // Fase 3: Configuración de middleware
  const middlewareStartTime = Date.now();
  app.enableCors(); // Enable CORS for the frontend
  app.useGlobalFilters(new AllExceptionsFilter());
  const middlewareTime = Date.now() - middlewareStartTime;
  logger.log(`✅ Middleware configurado (CORS + ExceptionFilter) en ${middlewareTime}ms`);

  // Fase 4: Iniciar servidor
  const port = process.env.PORT ?? 3000;
  const listenStartTime = Date.now();
  await app.listen(port);
  const listenTime = Date.now() - listenStartTime;

  const totalBootstrapTime = Date.now() - bootstrapStartTime;

  logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  logger.log(`🚀 API ejecutándose en: http://localhost:${port}`);
  logger.log(`⏱️  Tiempo total de arranque: ${totalBootstrapTime}ms`);
  logger.log(`   ├─ Creación NestJS: ${appCreationTime}ms`);
  logger.log(`   ├─ Middleware: ${middlewareTime}ms`);
  logger.log(`   └─ Listen: ${listenTime}ms`);
  logger.log(`📊 Health checks disponibles:`);
  logger.log(`   ├─ GET http://localhost:${port}/health`);
  logger.log(`   ├─ GET http://localhost:${port}/health/firebase`);
  logger.log(`   └─ GET http://localhost:${port}/health/detailed`);
  logger.log(`💾 Memoria actual: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}
bootstrap();
