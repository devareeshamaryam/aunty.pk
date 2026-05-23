import { Schema, model, models, Model, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    image: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 });

export const Category: Model<ICategory> =
  (models.Category as Model<ICategory>) || model<ICategory>('Category', categorySchema);
