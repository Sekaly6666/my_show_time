import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Concert', required: true })
  concert: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({ required: true, unique: true })
  bookingCode: string;

  @Prop({ required: true })
  qrCodeDataUrl: string;

  @Prop({ default: 'pending' })
  status: string; // pending, validated, cancelled
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
