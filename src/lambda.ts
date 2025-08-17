import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as serverless from 'serverless-http';

let handler: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar pipes globales
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  
  // Configurar CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('Wompi API')
    .setDescription('API para prueba tecnica Wompi')
    .setVersion('1.0.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'API Key para autenticación',
      },
      'api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.init();
  
  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

export const lambdaHandler = async (event: any, context: any) => {
  if (!handler) {
    handler = await bootstrap();
  }
  return handler(event, context);
};

// Para desarrollo local
if (require.main === module) {
  (async () => {
    const app = await NestFactory.create(AppModule);
    
    // Configurar pipes globales
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    
    // Configurar CORS para desarrollo local
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
      ],
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'x-api-key', 'api-key'],
      optionsSuccessStatus: 204,
    });

    // Configurar Swagger
    const config = new DocumentBuilder()
      .setTitle('Wompi API')
      .setDescription('API para prueba tecnica Wompi')
      .setVersion('1.0.0')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description: 'API Key para autenticación',
        },
        'api-key',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.listen(9000);
    console.log('Application is running on: http://localhost:9000');
    console.log('Swagger docs available at: http://localhost:9000/docs');
  })().catch(console.error);
}