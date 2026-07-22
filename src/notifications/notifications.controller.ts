import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Routes utilisateur d'abord (pour éviter les conflits avec :id)
  @Get('me')
  mine(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.listForUser(user.sub);
  }

  @Patch('me/read')
  read(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.markAllRead(user.sub);
  }

  @Delete('me')
  removeAll(@CurrentUser() user: { sub: string }) {
    return this.notificationsService.removeAll(user.sub);
  }

  @Delete('me/:id')
  remove(@CurrentUser() user: { sub: string }, @Param('id') id: string) {
    return this.notificationsService.remove(user.sub, id);
  }

  // Routes Admin après
  @UseGuards(AdminGuard)
  @Get()
  all() {
    return this.notificationsService.findAll();
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  adminRemove(@Param('id') id: string) {
    return this.notificationsService.adminRemove(id);
  }
}
