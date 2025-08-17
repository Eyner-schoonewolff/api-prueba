import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'Bienvenido a la API de Wompi', version: '1.0.0' };
  }
} 