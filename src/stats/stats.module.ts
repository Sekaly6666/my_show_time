import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module';
import { StatsController } from './stats.controller';

@Module({
  imports: [BookingsModule],
  controllers: [StatsController],
})
export class StatsModule {}
