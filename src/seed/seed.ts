import { config } from 'dotenv';
import { connect, model, Schema } from 'mongoose';
import * as bcrypt from 'bcryptjs';

config();

const userSchema = new Schema(
  {
    name: String,
    email: String,
    passwordHash: String,
    role: String,
  },
  { timestamps: true },
);

const concertSchema = new Schema(
  {
    title: String,
    groupName: String,
    genre: String,
    venue: String,
    city: String,
    date: Date,
    price: Number,
    capacity: Number,
    imageUrl: String,
    description: String,
  },
  { timestamps: true },
);

async function seed() {
  await connect(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/my_show_time');
  const User = model('User', userSchema);
  const Concert = model('Concert', concertSchema);

  await User.deleteMany({});
  await Concert.deleteMany({});

  await User.create([
    {
      name: 'Admin MyShowTime',
      email: 'admin@myshowtime.local',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
    {
      name: 'Demo User',
      email: 'user@myshowtime.local',
      passwordHash: await bcrypt.hash('user123', 10),
      role: 'user',
    },
  ]);

  await Concert.create([
    {
      title: 'Phoenix Night Session',
      groupName: 'Phoenix',
      genre: 'Indie pop',
      venue: 'Accor Arena',
      city: 'Paris',
      date: new Date('2026-07-18T20:00:00Z'),
      price: 65,
      capacity: 12000,
      imageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
      description: 'An electric summer show for fans of polished French indie pop.',
    },
    {
      title: 'Afro Pop Festival',
      groupName: 'Aya Nakamura',
      genre: 'Afro pop',
      venue: 'Orange Velodrome',
      city: 'Marseille',
      date: new Date('2026-08-03T19:30:00Z'),
      price: 49,
      capacity: 30000,
      imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80',
      description: 'A bright festival night with dance, vocals and a huge crowd.',
    },
    {
      title: 'Electronic Legacy',
      groupName: 'Daft Punk',
      genre: 'Electronic',
      venue: 'La Seine Musicale',
      city: 'Boulogne-Billancourt',
      date: new Date('2026-09-12T21:00:00Z'),
      price: 89,
      capacity: 6000,
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
      description: 'A fictional tribute night dedicated to electronic music history.',
    },
  ]);

  await Promise.resolve();
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
