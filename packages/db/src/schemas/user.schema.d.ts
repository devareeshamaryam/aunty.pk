import { Schema, Document } from 'mongoose';
export interface IUser extends Document {
    email: string;
    passwordHash: string;
    name?: string;
    role: 'USER' | 'ADMIN';
    refreshToken?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidate: string): Promise<boolean>;
}
export declare const userSchema: Schema<IUser, import("mongoose").Model<IUser, any, any, any, Document<unknown, any, IUser, any, {}> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IUser, Document<unknown, {}, import("mongoose").FlatRecord<IUser>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<IUser> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const User: import("mongoose").Model<IUser, {}, {}, {}, Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, any>;
