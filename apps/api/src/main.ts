import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

function buildCorsOriginChecker(webUrl: string, extraOrigins: string[]) {
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow same-origin, server-to-server, and mobile requests (no Origin header)
    if (!origin) return callback(null, true);

    // Primary web URL
    if (origin === webUrl) return callback(null, true);

    // Additional exact origins from CORS_ORIGINS env var
    if (extraOrigins.includes(origin)) return callback(null, true);

    // Vercel preview deployments (*.vercel.app)
    if (/^https:\/\/[\w-]+\.vercel\.app$/.test(origin)) return callback(null, true);

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Trust proxy — required for correct IP detection behind Railway's proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Security
  app.use(helmet());

  const webUrl = configService.get('WEB_URL', 'http://localhost:3000');
  const extraOrigins = (configService.get('CORS_ORIGINS', '') as string)
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: buildCorsOriginChecker(webUrl, extraOrigins),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Otantist API')
      .setDescription('API documentation for Otantist platform')
      .setVersion('0.1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('preferences', 'User preferences')
      .addTag('state', 'User state and calm mode')
      .addTag('messaging', 'Messaging system')
      .addTag('safety', 'Blocking and reporting')
      .addTag('moderation', 'Moderation tools')
      .addTag('parent', 'Parent dashboard')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(
    `Otantist API running on port ${port} [${configService.get('NODE_ENV', 'development')}]`
  );
}

bootstrap();
