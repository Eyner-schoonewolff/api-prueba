import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  create(@Body() body: CreateCustomerDto) {
    return this.service.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }
}