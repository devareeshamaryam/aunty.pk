import { Schema, model, models, Model, Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

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

export const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

// `unique: true` on email already creates the index — no need to redeclare.

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>('User', userSchema);