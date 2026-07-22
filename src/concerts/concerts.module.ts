import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { Concert, ConcertSchema } from './concert.schema';
import { ConcertsController } from './concerts.controller';
import { ConcertsService } from './concerts.service';
import { Review, ReviewSchema } from './review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Concert.name, schema: ConcertSchema },
      { name: Review.name, schema: ReviewSchema }
    ]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [ConcertsController],
  providers: [ConcertsService],
  exports: [ConcertsService, MongooseModule],
})
export class ConcertsModule {}
