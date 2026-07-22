import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ObjectIdPipe } from '../common/object-id.pipe';
import { AdminUpdateUserDto, CreateUserDto, FavoriteEventsDto, UpdateMeDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { sub: string }) {
    return this.usersService.getMe(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: { sub: string }, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/favorites')
  updateFavorites(@CurrentUser() user: { sub: string }, @Body() dto: FavoriteEventsDto) {
    return this.usersService.updateFavorites(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/favorites/events/:id')
  toggleFavorite(@CurrentUser() user: { sub: string }, @Param('id', ObjectIdPipe) eventId: string) {
    return this.usersService.toggleFavoriteEvent(user.sub, eventId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  all() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.adminCreate(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  update(@Param('id', ObjectIdPipe) id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdate(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.usersService.remove(id);
  }
}
