import { Schema, Document, Model, model, models } from 'mongoose';

export interface IBanner extends Document {
  imageUrl: string;
  imageUrlMobile?: string;
  linkUrl?: string;
  alt?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const bannerSchema = new Schema<IBanner>(
  {
    imageUrl: { type: String, required: true },
    imageUrlMobile: { type: String },
    linkUrl: { type: String },
    alt: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

bannerSchema.index({ isActive: 1, order: 1 });

export const Banner: Model<IBanner> =
  (models.Banner as Model<IBanner>) || model<IBanner>('Banner', bannerSchema);
