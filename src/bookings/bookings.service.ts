import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as QRCode from 'qrcode';
import { ConcertsService } from '../concerts/concerts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { Booking, BookingDocument } from './booking.schema';
import { CreateBookingDto } from './dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    private readonly concertsService: ConcertsService,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateBookingDto): Promise<BookingDocument> {
    const user = await this.usersService.findById(userId);
    // ... logic unchanged ...
    const existing = await this.bookingModel.findOne({ 
      user: new Types.ObjectId(userId), 
      concert: new Types.ObjectId(dto.concertId) 
    });
    if (existing) throw new BadRequestException('Vous avez déjà une réservation pour ce concert.');

    const concert = await this.concertsService.findById(dto.concertId);
    const alreadyBooked = await this.bookingModel.aggregate<{ total: number }>([
      { $match: { concert: new Types.ObjectId(dto.concertId) } },
      { $group: { _id: '$concert', total: { $sum: '$quantity' } } },
    ]);
    const sold = alreadyBooked[0]?.total ?? 0;

    if (sold + dto.quantity > concert.capacity) {
      throw new BadRequestException('Places insuffisantes pour ce concert.');
    }

    const bookingCode = `MST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3001'}/verify.html?code=${bookingCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);

    const booking = await this.bookingModel.create({
      user: new Types.ObjectId(userId),
      concert: concert._id,
      quantity: dto.quantity,
      totalPrice: concert.price * dto.quantity,
      bookingCode,
      qrCodeDataUrl,
    });

    await this.notificationsService.create({
      user: userId,
      concert: concert.id,
      title: 'Réservation enregistrée !',
      message: `Votre demande pour "${concert.title}" a été envoyée. Attendez la validation admin pour télécharger votre billet.`,
      category: 'booking',
    });


    const admins = await this.usersService.findAdmins();
    await this.notificationsService.createMany(admins.map(admin => ({
      user: admin._id.toString(),
      concert: concert.id,
      title: 'Nouvelle réservation',
      message: `L'utilisateur ${user.name} a réservé ${dto.quantity} billets pour "${concert.title}".`,
      category: 'booking',
    })));

    return booking;
  }

  async validate(bookingId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).populate('concert');
    if (!booking) throw new NotFoundException('Réservation non trouvée.');
    
    if (booking.status === 'cancel_pending') {
      booking.status = 'cancelled';
      await booking.save();
      
      // Notif Utilisateur
      await this.notificationsService.create({
        user: (booking.user as any).toString(),
        title: 'Annulation confirmée',
        message: `L'annulation de votre billet pour "${(booking.concert as any).title}" a été validée.`,
        category: 'booking',
      });

      // Notif Admins
      const admins = await this.usersService.findAdmins();
      await this.notificationsService.createMany(admins.map(admin => ({
        user: admin._id.toString(),
        title: 'Annulation Terminée',
        message: `L'annulation d'un billet pour "${(booking.concert as any).title}" a été finalisée.`,
        category: 'booking',
      })));
      return booking;
    } else {
      booking.status = 'validated';
      await booking.save();
      
      // Notif Utilisateur
      await this.notificationsService.create({
        user: (booking.user as any).toString(),
        title: 'Billet prêt à télécharger !',
        message: `Votre billet pour "${(booking.concert as any).title}" a été validé. Vous pouvez le télécharger maintenant.`,
        category: 'booking',
      });
      return booking;
    }
  }

  listForUser(userId: string): Promise<any[]> {
    return this.bookingModel.find({ user: new Types.ObjectId(userId) }).populate('concert').sort({ createdAt: -1 }).exec();
  }

  async findByCode(code: string): Promise<any> {
    const booking = await this.bookingModel.findOne({ bookingCode: code }).populate('concert').populate('user', '-passwordHash');
    if (!booking) throw new NotFoundException('Réservation non trouvée.');
    return booking;
  }

  async getTicketData(userId: string, bookingId: string): Promise<any> {
    const booking = await this.bookingModel.findOne({ 
      _id: new Types.ObjectId(bookingId), 
      user: new Types.ObjectId(userId) 
    }).populate('concert').populate('user', '-passwordHash');

    if (!booking) throw new NotFoundException('Billet introuvable.');
    if (booking.status !== 'validated') {
      throw new BadRequestException('Ce billet ne peut pas être téléchargé tant qu\'il n\'a pas été validé par l\'administrateur.');
    }

    return booking;
  }

  async remove(id: string): Promise<any> {
    await this.bookingModel.deleteOne({ _id: new Types.ObjectId(id) });
    return { success: true };
  }

  async cancel(userId: string, bookingId: string): Promise<any> {
    const booking = await this.bookingModel.findOne({ 
      _id: new Types.ObjectId(bookingId), 
      user: new Types.ObjectId(userId) 
    }).populate('concert');
    
    if (!booking) throw new NotFoundException('Réservation non trouvée.');

    // Si déjà validé, on passe en attente d'annulation
    // Sinon on peut l'annuler directement (ou aussi passer par l'admin selon le souhait)
    booking.status = 'cancel_pending';
    await booking.save();

    const admins = await this.usersService.findAdmins();
    await this.notificationsService.createMany(admins.map(admin => ({
      user: admin._id.toString(),
      title: 'Demande d\'annulation',
      message: `L'utilisateur souhaite annuler son billet pour "${(booking.concert as any).title}". Référence: ${booking.bookingCode}.`,
      category: 'booking',
    })));

    return { success: true };
  }

  listAll(): Promise<any[]> {
    return this.bookingModel.find().populate('concert').populate('user', '-passwordHash').sort({ createdAt: -1 }).exec();
  }

  async stats(): Promise<any> {
    const [summary] = await this.bookingModel.aggregate([
      {
        $group: {
          _id: null,
          bookings: { $sum: 1 },
          tickets: { $sum: '$quantity' },
          revenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    const byConcert = await this.bookingModel.aggregate([
      { $group: { _id: '$concert', bookings: { $sum: 1 }, tickets: { $sum: '$quantity' }, revenue: { $sum: '$totalPrice' } } },
      { $lookup: { from: 'concerts', localField: '_id', foreignField: '_id', as: 'concert' } },
      { $unwind: '$concert' },
      { $sort: { tickets: -1 } },
    ]);

    const byGenre = await this.bookingModel.aggregate([
      { $lookup: { from: 'concerts', localField: 'concert', foreignField: '_id', as: 'concert' } },
      { $unwind: '$concert' },
      { $group: { _id: '$concert.genre', tickets: { $sum: '$quantity' }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { tickets: -1 } },
    ]);

    return { summary: summary ?? { bookings: 0, tickets: 0, revenue: 0 }, byConcert, byGenre };
  }

  async deleteByUser(userId: string, bookingId: string) {
    const booking = await this.bookingModel.findOne({ 
      _id: new Types.ObjectId(bookingId), 
      user: new Types.ObjectId(userId) 
    }).populate('concert');
    
    if (!booking) throw new NotFoundException('Réservation non trouvée.');
    if (booking) {
      const status = booking.status?.toLowerCase();
      if (status !== 'cancelled' && status !== 'cancel_pending') {
        throw new Error('Vous ne pouvez supprimer que les billets annulés ou en cours d\'annulation.');
      }
    }

    await this.bookingModel.deleteOne({ _id: booking._id });

    const admins = await this.usersService.findAdmins();
    await this.notificationsService.createMany(admins.map(admin => ({
      user: admin._id.toString(),
      title: 'Billet supprimé par l\'utilisateur',
      message: `L'utilisateur a définitivement supprimé son billet annulé pour "${(booking.concert as any).title}".`,
      category: 'booking',
    })));

    return { success: true };
  }
}
