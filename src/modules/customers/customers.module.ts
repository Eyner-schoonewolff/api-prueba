import { Module } from '@nestjs/common';
import { CustomersController } from '../../presentation/customers.controller';
import { CustomersService } from '../../services/customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService]
})
export class CustomersModule {}