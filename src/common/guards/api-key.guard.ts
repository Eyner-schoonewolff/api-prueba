import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Verificar si el endpoint está marcado como público
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API Key requerida');
    }

    const validApiKey = this.configService.get<string>('API_KEY');
    
    if (!validApiKey) {
      throw new UnauthorizedException('API Key no configurada en el servidor');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('API Key inválida');
    }

    return true;
  }
}
