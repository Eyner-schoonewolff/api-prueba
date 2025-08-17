import 'reflect-metadata';
import { Handler, APIGatewayProxyEvent, Context, Callback } from 'aws-lambda';
import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';

let server: any;

async function bootstrapServer() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return serverless(app.getHttpAdapter().getInstance());
}

export const handler: Handler = async (event: APIGatewayProxyEvent, context: Context, callback: Callback) => {
  if (!server) {
    server = await bootstrapServer();
  }
  return server(event, context, callback);
};  