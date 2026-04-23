import { Schema, Document, Model, model, Types } from "mongoose";

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface IReview extends Document {
  user?: Types.ObjectId;
  reviewerName?: string;
  reviewerEmail?: string;
  product: Types.ObjectId;
  rating: number;
  comment?: string;
  status: ReviewStatus;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewerName: { type: String },
  reviewerEmail: { type: String },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  status: { 
    type: String, 
    enum: Object.values(ReviewStatus), 
    default: ReviewStatus.PENDING 
  },
  moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
}, { timestamps: true });

export const Review: Model<IReview> = model<IReview>("Review", reviewSchema);
