import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { join } from 'path';
import * as express from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
  });

  // Body size limit (covers base64 voice uploads)
  const bodyLimit = process.env.BODY_LIMIT || '20mb';
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ limit: bodyLimit, extended: true }));

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow static uploads to be embedded
    }),
  );

  // CORS - origins driven by env
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Id'],
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter (consistent error responses, hides internals in prod)
  app.useGlobalFilters(new AllExceptionsFilter());

  app.setGlobalPrefix('api');

  // Serve static uploads
  app.useStaticAssets(join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'), {
    prefix: '/uploads',
    maxAge: '7d',
    index: false,
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}`);
  logger.log(`CORS origins: ${corsOrigins.join(', ')}`);
}
bootstrap();
