import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Cette adresse email est déjà utilisée.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: 'user',
    });

    return this.authResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    return this.authResponse(user);
  }

  private authResponse(user: any) {
    const id = user.id ?? user._id?.toString();
    const accessToken = this.jwtService.sign({
      sub: id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id,
        email: user.email,
        name: user.name,
        role: user.role,
        favoriteEvents: user.favoriteEvents || [],
      },
    };
  }
}
