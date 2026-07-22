import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateBookingDto): Promise<any> {
    return this.bookingsService.create(user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  mine(@CurrentUser() user: { sub: string }): Promise<any[]> {
    return this.bookingsService.listForUser(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  cancel(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<any> {
    return this.bookingsService.cancel(user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/delete-me')
  deleteMe(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<any> {
    return this.bookingsService.deleteByUser(user.sub, id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/validate')
  validate(@Param('id') id: string): Promise<any> {
    return this.bookingsService.validate(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  all(): Promise<any[]> {
    return this.bookingsService.listAll();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/delete')
  remove(@Param('id') id: string): Promise<any> {
    return this.bookingsService.remove(id);
  }

  @Get('code/:code')
  byCode(@Param('code') code: string): Promise<any> {
    return this.bookingsService.findByCode(code);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download')
  download(@CurrentUser() user: { sub: string }, @Param('id') id: string): Promise<any> {
    return this.bookingsService.getTicketData(user.sub, id);
  }
}
