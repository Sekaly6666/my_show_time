import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConcertDocument = HydratedDocument<Concert>;

@Schema({ timestamps: true })
export class Concert {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  groupName: string;

  @Prop({ required: true })
  genre: string;

  @Prop({ required: true })
  venue: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  capacity: number;

  @Prop({ default: '' })
  imageUrl: string;

  @Prop({ default: '' })
  videoUrl: string;

  @Prop({ default: '' })
  description: string;
}

export const ConcertSchema = SchemaFactory.createForClass(Concert);
ConcertSchema.index({ groupName: 'text', genre: 'text', title: 'text', city: 'text' });
