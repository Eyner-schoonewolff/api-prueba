import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

class CreateTxDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsEmail()
  customerEmail!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}

enum TxStatus { PENDING = 'PENDING', COMPLETED = 'COMPLETED', FAILED = 'FAILED' }

class PatchTxDto {
  @IsEnum(TxStatus)
  status!: 'PENDING' | 'COMPLETED' | 'FAILED';

  @IsOptional()
  @IsString()
  wompiTransactionId?: string;
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post()
  create(@Body() body: CreateTxDto) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: PatchTxDto) {
    return this.service.update(id, body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get()
  list(@Query('customerId') customerId?: string) {
    return this.service.list(customerId);
  }
}