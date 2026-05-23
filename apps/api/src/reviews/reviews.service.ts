import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { IReview, IProduct, IOrder, ReviewStatus } from '@repo/db';
import {
  CreateReviewDto,
  UpdateReviewDto,
  UpdateReviewStatusDto,
  AdminCreateReviewDto,
} from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel('Review') private reviewModel: Model<IReview>,
    @InjectModel('Product') private productModel: Model<IProduct>,
    @InjectModel('Order') private orderModel: Model<IOrder>,
  ) {}

  /**
   * Can this guest leave a review for this product?
   * Rules: they must have a DELIVERED order containing the product,
   * and they must not have already reviewed it.
   */
  async canReview(productId: string, guestId: string) {
    if (!isValidObjectId(productId) || !guestId || guestId.length < 8) {
      return { canReview: false, reason: 'invalid', orderId: null as string | null };
    }
    const productObjId = new Types.ObjectId(productId);
    const existing = await this.reviewModel.findOne({ product: productObjId, guestId });
    if (existing) {
      return { canReview: false, reason: 'already', orderId: null as string | null };
    }
    const order = await this.orderModel
      .findOne({
        guestId,
        status: 'DELIVERED',
        'items.product': productObjId,
      })
      .sort({ createdAt: -1 })
      .lean();
    if (!order) {
      return { canReview: false, reason: 'no-order', orderId: null as string | null };
    }
    return { canReview: true, reason: 'ok', orderId: order._id.toString() };
  }

  /** Recompute and persist avgRating + reviewCount on the related Product. */
  private async recalcProductRating(productId: Types.ObjectId) {
    const agg = await this.reviewModel.aggregate([
      { $match: { product: productId, status: ReviewStatus.APPROVED } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          avg: { $avg: '$rating' },
        },
      },
    ]);
    const stats = agg[0];
    await this.productModel.findByIdAndUpdate(productId, {
      $set: {
        avgRating: stats ? Number(stats.avg.toFixed(2)) : 0,
        reviewCount: stats ? stats.count : 0,
      },
    });
  }

  async create(dto: CreateReviewDto, userId?: string) {
    if (!isValidObjectId(dto.product)) {
      throw new BadRequestException('Invalid product id');
    }
    if (!dto.guestId) {
      throw new BadRequestException('guestId is required to leave a review');
    }

    // Enforce: must have a delivered order containing this product
    const eligibility = await this.canReview(dto.product, dto.guestId);
    if (!eligibility.canReview) {
      if (eligibility.reason === 'already') {
        throw new ConflictException('You have already reviewed this product');
      }
      throw new ForbiddenException(
        'Only customers who received this item can review it',
      );
    }

    const review = new this.reviewModel({
      product: new Types.ObjectId(dto.product),
      rating: dto.rating,
      comment: dto.comment,
      reviewerName: dto.reviewerName,
      reviewerEmail: dto.reviewerEmail,
      reviewerPhone: dto.reviewerPhone,
      guestId: dto.guestId,
      order: eligibility.orderId ? new Types.ObjectId(eligibility.orderId) : undefined,
      photos: dto.photos || [],
      user: userId ? new Types.ObjectId(userId) : undefined,
      status: ReviewStatus.APPROVED,
    });

    try {
      const saved = await review.save();
      await this.recalcProductRating(saved.product);
      return saved;
    } catch (e: any) {
      // unique index violation → already reviewed (race)
      if (e?.code === 11000) {
        throw new ConflictException('You have already reviewed this product');
      }
      throw e;
    }
  }

  async adminCreate(dto: AdminCreateReviewDto, adminId: string) {
    if (!isValidObjectId(dto.product)) {
      throw new BadRequestException('Invalid product id');
    }
    const review = new this.reviewModel({
      product: new Types.ObjectId(dto.product),
      rating: dto.rating,
      comment: dto.comment,
      reviewerName: dto.reviewerName || 'Aunty.pk team',
      reviewerEmail: dto.reviewerEmail,
      photos: dto.photos || [],
      ownerReply: dto.ownerReply,
      isVerified: dto.isVerified ?? true,
      status: dto.status ?? ReviewStatus.APPROVED,
      moderatedBy: new Types.ObjectId(adminId),
      moderatedAt: new Date(),
    });
    const saved = await review.save();
    await this.recalcProductRating(saved.product);
    return saved;
  }

  async findAll(query: {
    productId?: string;
    status?: ReviewStatus;
    page?: number;
    limit?: number;
  }) {
    const { productId, status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (productId && isValidObjectId(productId)) {
      filter.product = new Types.ObjectId(productId);
    }
    if (status) filter.status = status;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .populate('product', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.reviewModel.countDocuments(filter),
    ]);

    return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByProduct(productId: string) {
    if (!isValidObjectId(productId)) return [];
    return this.reviewModel
      .find({ product: new Types.ObjectId(productId), status: ReviewStatus.APPROVED })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async getProductStats(productId: string) {
    if (!isValidObjectId(productId)) {
      return { averageRating: 0, reviewCount: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }
    const agg = await this.reviewModel.aggregate([
      {
        $match: {
          product: new Types.ObjectId(productId),
          status: ReviewStatus.APPROVED,
        },
      },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const breakdown: Record<string, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let total = 0;
    let sum = 0;
    for (const row of agg) {
      breakdown[row._id] = row.count;
      total += row.count;
      sum += row._id * row.count;
    }
    return {
      averageRating: total > 0 ? sum / total : 0,
      reviewCount: total,
      breakdown,
    };
  }

  async update(id: string, dto: UpdateReviewDto, adminId: string) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment;
    if (dto.reviewerName !== undefined) review.reviewerName = dto.reviewerName;
    if (dto.ownerReply !== undefined) review.ownerReply = dto.ownerReply;
    if (dto.photos !== undefined) review.photos = dto.photos;
    if (dto.isVerified !== undefined) review.isVerified = dto.isVerified;
    if (dto.status !== undefined) review.status = dto.status;

    review.moderatedBy = new Types.ObjectId(adminId);
    review.moderatedAt = new Date();
    const saved = await review.save();
    await this.recalcProductRating(saved.product);
    return saved;
  }

  async updateStatus(id: string, dto: UpdateReviewStatusDto, adminId: string) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    review.status = dto.status;
    review.moderatedAt = new Date();
    review.moderatedBy = new Types.ObjectId(adminId);
    const saved = await review.save();
    await this.recalcProductRating(saved.product);
    return saved;
  }

  async remove(id: string) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    const productId = review.product;
    await this.reviewModel.findByIdAndDelete(id);
    await this.recalcProductRating(productId);
    return { message: 'Review deleted successfully' };
  }

  // ─── Guest-owned reviews ──────────────────────────────────────────────
  async findByGuest(guestId: string) {
    if (!guestId || guestId.length < 8) return [];
    return this.reviewModel
      .find({ guestId })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  // Customer-side review delete intentionally removed:
  // reviews are append-only and only admin moderation can hide/remove them.
}
