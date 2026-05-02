import { Schema, model, Document } from 'mongoose';

export interface ITopUp extends Document {
  name: string;
  price: number;
  image?: string;
  category: string;
  description: string;
  available: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export const topUpSchema = new Schema<ITopUp>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    category: { type: String, default: 'Extras' },
    description: { type: String, default: '' },
    available: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topUpSchema.index({ available: 1 });
topUpSchema.index({ order: 1 });

export const TopUp = model<ITopUp>('TopUp', topUpSchema);