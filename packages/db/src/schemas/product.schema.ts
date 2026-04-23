import { Schema, model, Document, Types } from 'mongoose';

export interface IVariant {
  name: string; // e.g. "500g", "1kg"
  price: number;
  stock: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  isFeatured: boolean;
  category?: Types.ObjectId;
  variantType?: string; // e.g. "Weight", "Size"
  variants?: IVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    variantType: { type: String },
    variants: [{
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      stock: { type: Number, required: true, min: 0, default: 0 }
    }],
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 });
productSchema.index({ isFeatured: 1 });

export const Product = model<IProduct>('Product', productSchema);