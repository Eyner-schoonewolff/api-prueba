import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DeliveriesService } from '../services/deliveries.service';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

class CreateDeliveryDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsString()
  @IsNotEmpty()
  productId!: string;
}

enum DeliveryStatus { CREATED='CREATED', IN_PROGRESS='IN_PROGRESS', DELIVERED='DELIVERED' }

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly service: DeliveriesService) {}

  @Post()
  create(@Body() body: CreateDeliveryDto) {
    return this.service.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }
}