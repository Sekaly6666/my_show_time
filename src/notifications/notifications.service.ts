import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationsService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>) {}

  create(input: { user: string; title: string; message: string; category?: string; concert?: string }) {
    return this.notificationModel.create({
      ...input,
      user: new Types.ObjectId(input.user),
      concert: input.concert ? new Types.ObjectId(input.concert) : undefined,
    });
  }

  async createMany(inputs: { user: string; title: string; message: string; category?: string; concert?: string }[]) {
    const formatted = inputs.map(input => ({
      ...input,
      user: new Types.ObjectId(input.user),
      concert: input.concert ? new Types.ObjectId(input.concert) : undefined,
    }));
    return this.notificationModel.insertMany(formatted);
  }

  listForUser(userId: string) {
    return this.notificationModel.find({ user: new Types.ObjectId(userId) }).populate('concert').sort({ createdAt: -1 });
  }

  findAll() {
    return this.notificationModel.find().populate('concert').sort({ createdAt: -1 });
  }

  async adminRemove(notificationId: string) {
    await this.notificationModel.deleteOne({ _id: new Types.ObjectId(notificationId) });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notificationModel.updateMany({ user: userId }, { read: true });
    return this.listForUser(userId);
  }

  async remove(userId: string, notificationId: string) {
    await this.notificationModel.deleteOne({ 
      _id: new Types.ObjectId(notificationId), 
      user: new Types.ObjectId(userId) 
    });
    return { success: true };
  }

  async removeAll(userId: string) {
    await this.notificationModel.deleteMany({ 
      user: new Types.ObjectId(userId) 
    });
    return { success: true };
  }
}
