
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Notification } from './notifications/notification.schema';
import { Model } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationModel = app.get<Model<any>>(getModelToken(Notification.name));

  const all = await notificationModel.find();
  console.log(`Updating ${all.length} notifications...`);

  for (const n of all) {
    if (!n.category) {
      let category = 'system';
      const title = n.title.toLowerCase();
      if (title.includes('réservation') || title.includes('billet validé') || title.includes('billet validé')) {
        category = 'booking';
      } else if (title.includes('avis') || title.includes('note')) {
        category = 'review';
      } else if (title.includes('favoris')) {
        category = 'favorite';
      }
      
      await notificationModel.updateOne({ _id: n._id }, { $set: { category } });
    }
  }

  console.log('Done!');
  await app.close();
}

bootstrap();
