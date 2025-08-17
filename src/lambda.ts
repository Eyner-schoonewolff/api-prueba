import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import * as serverless from 'serverless-http';

let handler: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS si es necesario
  app.enableCors({
    origin: true,
    credentials: true,
  });

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