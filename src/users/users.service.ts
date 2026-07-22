import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { FilterQuery, Model } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminUpdateUserDto, CreateUserDto, FavoriteEventsDto, UpdateMeDto } from './dto';
import { User, UserDocument } from './user.schema';

type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
};

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    const adminEmail = 'admin@myshowtime.local';
    const admin = await this.userModel.findOne({ email: adminEmail });
    const passwordHash = await bcrypt.hash('admin123', 10);

    if (!admin) {
      console.log('--- Création du compte administrateur par défaut (admin123) ---');
      await this.userModel.create({
        name: 'Administrateur',
        email: adminEmail,
        passwordHash,
        role: 'admin',
      });
    } else {
      console.log('--- Mise à jour du mot de passe admin par défaut (admin123) ---');
      admin.passwordHash = passwordHash;
      admin.role = 'admin'; // S'assurer qu'il est bien admin
      await admin.save();
    }
  }

  create(input: CreateUserInput) {
    return this.userModel.create(input);
  }

  async adminCreate(dto: CreateUserDto) {
    if (await this.findByEmail(dto.email)) {
      throw new ConflictException('Cette adresse email est déjà utilisée.');
    }

    return this.sanitize(
      await this.userModel.create({
        name: dto.name,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: dto.role ?? 'user',
      }),
    );
  }

  findAll() {
    return this.userModel.find().select('-passwordHash').sort({ createdAt: -1 });
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findAdmins() {
    return this.userModel.find({ role: 'admin' });
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }
    return user;
  }

  async getMe(id: string) {
    const user = await this.userModel.findById(id).populate('favoriteEvents');
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');
    return this.sanitize(user);
  }

  async updateMe(id: string, dto: UpdateMeDto) {
    const user = await this.findById(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      if (await this.findByEmail(dto.email)) {
        throw new ConflictException('Cette adresse email est déjà utilisée.');
      }
      user.email = dto.email.toLowerCase();
    }

    if (dto.name) user.name = dto.name;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.sanitize(await user.save());
  }

  async updateFavorites(id: string, dto: FavoriteEventsDto) {
    const user = await this.findById(id);
    if (dto.favoriteEvents) {
      user.favoriteEvents = [...new Set(dto.favoriteEvents)];
    }
    const saved = await user.save();
    
    const admins = await this.findAdmins();
    await this.notificationsService.createMany(admins.map(admin => ({
      user: admin._id.toString(),
      title: 'Favoris mis à jour',
      message: `L'utilisateur ${user.name} a mis à jour ses événements favoris.`,
      category: 'favorite',
    })));

    return this.sanitize(saved);
  }

  async toggleFavoriteEvent(id: string, eventId: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Utilisateur non trouvé.');
    const index = user.favoriteEvents.findIndex(id => id.toString() === eventId);
    if (index === -1) {
      user.favoriteEvents.push(eventId as any);
    } else {
      user.favoriteEvents.splice(index, 1);
    }
    await user.save();

    const admins = await this.findAdmins();
    await this.notificationsService.createMany(admins.map(admin => ({
      user: admin._id.toString(),
      title: 'Action utilisateur : Favoris',
      message: `L'utilisateur ${user.name} a ${index === -1 ? 'ajouté un concert à' : 'retiré un concert de'} ses favoris.`,
      category: 'favorite',
    })));

    return this.getMe(id);
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto) {
    const user = await this.findById(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      if (await this.findByEmail(dto.email)) {
        throw new ConflictException('Cette adresse email est déjà utilisée.');
      }
      user.email = dto.email.toLowerCase();
    }

    if (dto.name) user.name = dto.name;
    if (dto.role) user.role = dto.role;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.sanitize(await user.save());
  }

  async remove(id: string) {
    const deleted = await this.userModel.findByIdAndDelete(id).select('-passwordHash');
    if (!deleted) {
      throw new NotFoundException('Utilisateur non trouvé.');
    }
    return deleted;
  }

  sanitize(user: UserDocument) {
    const { passwordHash: _passwordHash, ...safeUser } = user.toJSON();
    return safeUser;
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
