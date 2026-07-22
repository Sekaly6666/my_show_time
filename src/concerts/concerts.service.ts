import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { Concert, ConcertDocument } from './concert.schema';
import { ConcertQueryDto, CreateConcertDto, UpdateConcertDto } from './dto';
import { Review, ReviewDocument } from './review.schema';

@Injectable()
export class ConcertsService {
  constructor(
    @InjectModel(Concert.name) private readonly concertModel: Model<ConcertDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: ConcertQueryDto): Promise<any[]> {
    const filter: FilterQuery<ConcertDocument> = {};

    if (query.genre) filter.genre = new RegExp(query.genre, 'i');
    if (query.group) filter.groupName = new RegExp(query.group, 'i');
    if (query.from || query.to) {
      filter.date = {};
      if (query.from) filter.date.$gte = new Date(query.from);
      if (query.to) filter.date.$lte = new Date(query.to);
    }

    const concerts = await this.concertModel.find(filter).sort({ date: 1 }).lean();
    
    // Ajouter les stats d'avis pour chaque concert
    return Promise.all(concerts.map(async (c) => {
      const reviews = await this.reviewModel.find({ concert: c._id });
      const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
      return { ...c, avgRating: avg, reviewCount: reviews.length };
    }));
  }

  async findById(id: string): Promise<any> {
    const concert = await this.concertModel.findById(id).lean();
    if (!concert) throw new NotFoundException('Concert non trouvé.');
    
    const reviews = await this.reviewModel.find({ concert: new Types.ObjectId(id) }).populate('user', 'name').sort({ createdAt: -1 });
    const avg = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
    
    return { ...concert, reviews, avgRating: avg, reviewCount: reviews.length };
  }

  async createReview(userId: string, concertId: string, rating: number, comment: string): Promise<ReviewDocument> {
    const user = await this.usersService.findById(userId);
    const concert = await this.concertModel.findById(concertId);
    if (!concert) throw new NotFoundException('Concert non trouvé.');
    
    const review = await this.reviewModel.create({
      user: new Types.ObjectId(userId),
      concert: new Types.ObjectId(concertId),
      rating,
      comment
    });

    // Notifier les administrateurs
    const admins = await this.usersService.findAdmins();
    await this.notificationsService.createMany(admins.map(admin => ({
      user: admin._id.toString(),
      concert: concert._id.toString(),
      title: 'Nouvel Avis Client',
      message: `${user.name} a donné une note de ${rating}/5 pour "${concert.title}". Commentaire : "${comment}"`,
      category: 'review',
    })));

    return review;
  }

  async findReviewsByUser(userId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ user: new Types.ObjectId(userId) })
      .populate('concert')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllReviews(): Promise<ReviewDocument[]> {
    return this.reviewModel.find()
      .populate('concert')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async removeReview(id: string) {
    const deleted = await this.reviewModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Avis non trouvé.');
    return deleted;
  }

  async replyToReview(reviewId: string, reply: string): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId).populate('concert');
    if (!review) throw new NotFoundException('Avis non trouvé.');

    review.adminReply = reply;
    review.adminReplyAt = new Date();
    await review.save();

    // Notifier l'utilisateur
    await this.notificationsService.create({
      user: (review.user as any).toString(),
      concert: (review.concert as any)._id.toString(),
      title: 'L\'Admin vous a répondu !',
      message: `Une réponse a été apportée à votre avis sur "${(review.concert as any).title}".`,
      category: 'review',
    });

    return review;
  }

  // ... (Create, Update, Remove unchanged except for types)
  async create(dto: CreateConcertDto) {
    const concert = await this.concertModel.create({ ...dto, date: new Date(dto.date) });
    return concert;
  }

  async update(id: string, dto: UpdateConcertDto) {
    const previous = await this.findById(id);
    const updated = await this.concertModel.findByIdAndUpdate(
      id,
      { ...dto, date: dto.date ? new Date(dto.date) : previous.date },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Concert non trouvé.');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.concertModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Concert non trouvé.');
    return deleted;
  }
}
