import { Document, Types } from 'mongoose';
export interface IProduct extends Document {
    name: string;
    slug: string;
    description?: string;
    price: number;
    stock: number;
    images: string[];
    isFeatured: boolean;
    category?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Product: import("mongoose").Model<IProduct, {}, {}, {}, Document<unknown, {}, IProduct, {}, {}> & IProduct & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
