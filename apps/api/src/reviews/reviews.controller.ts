import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewStatusDto } from './dto/review.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';
import { GetCurrentUser, GetCurrentUserId } from '../auth/decorators/get-current-user.decorator';
import { ReviewStatus } from '@repo/db';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateReviewDto, @GetCurrentUserId() userId?: string) {
    return this.reviewsService.create(dto, userId);
  }

  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('status') status?: ReviewStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findAll({ productId, status, page, limit });
  }

  @Public()
  @Get('product/:id')
  findByProduct(@Param('id') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @UseGuards(AdminGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
    @GetCurrentUserId() adminId: string,
  ) {
    return this.reviewsService.updateStatus(id, dto, adminId);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
