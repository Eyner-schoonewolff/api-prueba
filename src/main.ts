import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // Enable CORS for local frontend (Next.js on 3000/3001) and handle preflight requests
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    optionsSuccessStatus: 204,
  });

  const config = new DocumentBuilder()
    .setTitle('Wompi API')
    .setDescription('API para prueba tecnica Wompi')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(9000);
}

if (require.main === module) {
  bootstrap();
}