import { Type } from 'class-transformer';
import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateBookingDto {
  @IsMongoId()
  concertId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}
