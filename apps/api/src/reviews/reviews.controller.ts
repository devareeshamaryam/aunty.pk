import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  UpdateReviewStatusDto,
  AdminCreateReviewDto,
} from './dto/review.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user.decorator';
import { ReviewStatus } from '@repo/db';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ── Public ──
  @Public()
  @Post()
  create(@Body() dto: CreateReviewDto, @GetCurrentUserId() userId?: string) {
    return this.reviewsService.create(dto, userId);
  }

  @Public()
  @Get('product/:id')
  findByProduct(@Param('id') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Public()
  @Get('product/:id/stats')
  getStats(@Param('id') productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  // ── Guest "My Reviews" ──
  @Public()
  @Get('by-guest/:guestId')
  listByGuest(@Param('guestId') guestId: string) {
    if (!guestId || guestId.length < 8) {
      throw new BadRequestException('Invalid guestId');
    }
    return this.reviewsService.findByGuest(guestId);
  }

  @Public()
  @Get('can-review/:productId')
  canReview(
    @Param('productId') productId: string,
    @Query('guestId') guestId: string,
  ) {
    return this.reviewsService.canReview(productId, guestId);
  }

  // Note: customers cannot edit or delete their reviews.
  // Reviews are append-only — moderation is admin-only.

  // ── Admin ──
  @UseGuards(AdminGuard)
  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('status') status?: ReviewStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findAll({
      productId,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(AdminGuard)
  @Post('admin')
  adminCreate(@Body() dto: AdminCreateReviewDto, @GetCurrentUserId() adminId: string) {
    return this.reviewsService.adminCreate(dto, adminId);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @GetCurrentUserId() adminId: string,
  ) {
    return this.reviewsService.update(id, dto, adminId);
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
