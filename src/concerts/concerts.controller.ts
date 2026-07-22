import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ObjectIdPipe } from '../common/object-id.pipe';
import { ConcertsService } from './concerts.service';
import { ConcertQueryDto, CreateConcertDto, UpdateConcertDto } from './dto';

@Controller('concerts')
export class ConcertsController {
  constructor(private readonly concertsService: ConcertsService) {}

  @Get()
  all(@Query() query: ConcertQueryDto): Promise<any[]> {
    return this.concertsService.findAll(query);
  }

  @Get(':id')
  one(@Param('id', ObjectIdPipe) id: string): Promise<any> {
    return this.concertsService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: './public/uploads',
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  create(@UploadedFiles() files: { image?: any[], video?: any[] }, @Body() dto: CreateConcertDto) {
    console.log('--- Création Concert ---');
    console.log('Files:', files);
    console.log('Body:', dto);
    if (files.image) dto.imageUrl = `/uploads/${files.image[0].filename}`;
    if (files.video) dto.videoUrl = `/uploads/${files.video[0].filename}`;
    return this.concertsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ], {
    storage: diskStorage({
      destination: './public/uploads',
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  update(
    @Param('id', ObjectIdPipe) id: string, 
    @UploadedFiles() files: { image?: any[], video?: any[] },
    @Body() dto: UpdateConcertDto
  ) {
    console.log('--- Mise à jour Concert ---');
    console.log('Files:', files);
    console.log('Body:', dto);
    if (files.image) dto.imageUrl = `/uploads/${files.image[0].filename}`;
    if (files.video) dto.videoUrl = `/uploads/${files.video[0].filename}`;
    return this.concertsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reviews/me')
  myReviews(@CurrentUser() user: { sub: string }) {
    return this.concertsService.findReviewsByUser(user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reviews')
  addReview(
    @CurrentUser() user: { sub: string },
    @Param('id', ObjectIdPipe) id: string,
    @Body() body: { rating: number; comment: string },
  ) {
    return this.concertsService.createReview(user.sub, id, body.rating, body.comment);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('reviews/all')
  allReviews() {
    return this.concertsService.findAllReviews();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('reviews/:id')
  removeReview(@Param('id', ObjectIdPipe) id: string) {
    return this.concertsService.removeReview(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('reviews/:id/reply')
  replyToReview(@Param('id', ObjectIdPipe) id: string, @Body() body: { reply: string }) {
    return this.concertsService.replyToReview(id, body.reply);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.concertsService.remove(id);
  }
}
