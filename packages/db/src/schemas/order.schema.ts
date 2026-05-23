import { Schema, model, models, Model, Document, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  slug?: string;
  price: number;
  quantity: number;
  image?: string;
  variantName?: string;
}

export interface IVoiceMessage {
  fileUrl: string;
  mimeType: string;
  durationSeconds: number;
  uploadedAt: Date;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'RIDER_ON_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface IStatusHistoryEntry {
  status: OrderStatus;
  note?: string;
  at: Date;
}

export interface IDeliveryLocation {
  lat: number;
  lng: number;
  // Address text the customer typed OR reverse-geocoded label
  label?: string;
}

export interface IGuestAddress {
  // Customer-typed fields (used when no map pin)
  street?: string;
  area?: string;
  city: string;
  phone: string;
  notes?: string;
}

export interface IOrder extends Document {
  // Guest-first: orders are tied to a guestId stored in browser localStorage.
  // user is kept optional for legacy / admin-created orders.
  guestId?: string;
  user?: Types.ObjectId;

  customerName: string;
  customerEmail?: string;
  customerPhone: string;

  items: IOrderItem[];
  itemsTotal: number;
  deliveryFee: number;
  totalAmount: number;

  status: OrderStatus;
  statusHistory: IStatusHistoryEntry[];

  // ETA set by admin (free text like "30-45 min" OR a Date)
  estimatedDeliveryAt?: Date;
  estimatedDeliveryText?: string;
  riderNote?: string;

  // Either deliveryLocation (map pin) OR shippingAddress (typed), at least one required.
  deliveryLocation?: IDeliveryLocation;
  shippingAddress?: IGuestAddress;

  paymentMethod: 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';

  voiceMessage?: IVoiceMessage;

  /** Admin has opened/viewed this order. New orders start with `false`. */
  seenByAdmin: boolean;
  seenAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ORDER_STATUSES: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'RIDER_ON_WAY',
  'DELIVERED',
  'CANCELLED',
];

export const orderSchema = new Schema<IOrder>(
  {
    guestId: { type: String, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },

    customerName: { type: String, required: true },
    customerEmail: { type: String },
    customerPhone: { type: String, required: true },

    items: [
      {
        product: { type: Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        slug: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
        variantName: { type: String },
      },
    ],
    itemsTotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ORDER_STATUSES,
      // New flow: orders go straight to PREPARING. PLACED/CONFIRMED are kept in
      // the enum only for legacy / historical data.
      default: 'PREPARING',
    },
    statusHistory: [
      {
        status: { type: String, enum: ORDER_STATUSES, required: true },
        note: { type: String },
        at: { type: Date, default: Date.now },
      },
    ],

    estimatedDeliveryAt: { type: Date },
    estimatedDeliveryText: { type: String },
    riderNote: { type: String },

    deliveryLocation: {
      lat: { type: Number },
      lng: { type: Number },
      label: { type: String },
    },
    shippingAddress: {
      street: { type: String },
      area: { type: String },
      city: { type: String },
      phone: { type: String },
      notes: { type: String },
    },

    paymentMethod: { type: String, enum: ['COD'], default: 'COD' },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PENDING',
    },

    voiceMessage: {
      fileUrl: { type: String },
      mimeType: { type: String },
      durationSeconds: { type: Number },
      uploadedAt: { type: Date },
    },

    seenByAdmin: { type: Boolean, default: false, index: true },
    seenAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ guestId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ seenByAdmin: 1, createdAt: -1 });

export const Order: Model<IOrder> =
  (models.Order as Model<IOrder>) || model<IOrder>('Order', orderSchema);
