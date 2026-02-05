import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: [
      configService.get('WEB_URL', 'http://localhost:3000'),
      // Add mobile app URLs as needed
    ],
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
    }),
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

  console.log(`
  🚀 Otantist API is running!
  
  📍 Local:    http://localhost:${port}
  📚 Swagger:  http://localhost:${port}/api/docs
  🔧 Mode:     ${configService.get('NODE_ENV', 'development')}
  `);
}

bootstrap();
