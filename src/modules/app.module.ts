import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from '../presentation/health.controller';
import { ProductsModule } from './products/products.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CustomersModule } from './customers/customers.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { SupabaseModule } from './common/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    ProductsModule,
    TransactionsModule,
    CustomersModule,
    DeliveriesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}