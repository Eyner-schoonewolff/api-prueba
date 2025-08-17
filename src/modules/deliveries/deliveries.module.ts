import { Module } from '@nestjs/common';
import { DeliveriesController } from '../../presentation/deliveries.controller';
import { DeliveriesService } from '../../services/deliveries.service';

@Module({
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}