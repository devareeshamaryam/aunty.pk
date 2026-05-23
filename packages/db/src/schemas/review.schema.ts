import { Schema, Document, Model, model, models, Types } from "mongoose";

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface IReview extends Document {
  user?: Types.ObjectId;
  guestId?: string;
  reviewerName?: string;
  reviewerEmail?: string;
  reviewerPhone?: string;
  product: Types.ObjectId;
  /** The delivered order that granted permission to leave this review. */
  order?: Types.ObjectId;
  rating: number;
  comment?: string;
  photos: string[];
  ownerReply?: string;
  isVerified?: boolean;
  status: ReviewStatus;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  guestId: { type: String, index: true },
  reviewerName: { type: String },
  reviewerEmail: { type: String },
  reviewerPhone: { type: String },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 2000 },
  photos: { type: [String], default: [] },
  ownerReply: { type: String, maxlength: 1000 },
  isVerified: { type: Boolean, default: false },
  status: {
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.APPROVED,
  },
  moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
}, { timestamps: true });

reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
// One review per guest per product
reviewSchema.index(
  { guestId: 1, product: 1 },
  { unique: true, partialFilterExpression: { guestId: { $exists: true } } },
);

export const Review: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>("Review", reviewSchema);
