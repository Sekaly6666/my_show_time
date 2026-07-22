import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from '../bookings/bookings.service';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  bookings(): Promise<any> {
    return this.bookingsService.stats();
  }
}
