import { Schema, model, models, Model, Document } from 'mongoose';

/**
 * Singleton settings document. Use `key: 'global'` for the one and only record.
 */
export interface ISettings extends Document {
  key: string;
  deliveryFee: {
    free: boolean;
    amount: number; // PKR
    freeAbove?: number; // optional: free delivery when itemsTotal >= this
  };
  store: {
    name: string;
    phone?: string;
    whatsapp?: string;
  };
  updatedAt: Date;
  createdAt: Date;
}

export const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, default: 'global' },
    deliveryFee: {
      free: { type: Boolean, default: false },
      amount: { type: Number, default: 0, min: 0 },
      freeAbove: { type: Number, min: 0 },
    },
    store: {
      name: { type: String, default: 'Aunty.pk' },
      phone: { type: String },
      whatsapp: { type: String },
    },
  },
  { timestamps: true },
);

export const Settings: Model<ISettings> =
  (models.Settings as Model<ISettings>) || model<ISettings>('Settings', settingsSchema);
