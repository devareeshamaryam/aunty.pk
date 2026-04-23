import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IReview, ReviewStatus } from '@repo/db';
import { CreateReviewDto, UpdateReviewStatusDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel('Review') private reviewModel: Model<IReview>) {}

  async create(dto: CreateReviewDto, userId?: string) {
    const review = new this.reviewModel({
      ...dto,
      user: userId ? new Types.ObjectId(userId) : undefined,
      status: ReviewStatus.PENDING,
    });
    return review.save();
  }

  async findAll(query: {
    productId?: string;
    status?: ReviewStatus;
    page?: number;
    limit?: number;
  }) {
    const { productId, status, page = 1, limit = 10 } = query;
    const filter: any = {};

    if (productId) filter.product = new Types.ObjectId(productId);
    if (status) filter.status = status;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('user', 'name email')
        .populate('product', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProduct(productId: string) {
    return this.reviewModel
      .find({ product: new Types.ObjectId(productId), status: ReviewStatus.APPROVED })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  async updateStatus(id: string, dto: UpdateReviewStatusDto, adminId: string) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    review.status = dto.status as ReviewStatus;
    review.moderatedAt = new Date();
    review.moderatedBy = new Types.ObjectId(adminId);

    return review.save();
  }

  async remove(id: string) {
    const result = await this.reviewModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Review not found');
    return { message: 'Review deleted successfully' };
  }
}
