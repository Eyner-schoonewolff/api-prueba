import { Module } from '@nestjs/common';
import { TransactionsController } from '../../presentation/transactions.controller';
import { TransactionsService } from '../../services/transactions.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}