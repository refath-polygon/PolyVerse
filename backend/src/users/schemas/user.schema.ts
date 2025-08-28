import { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash?: string;
  providers?: { provider: string; id: string }[]; // oauth
  roles: string[]; // ['reader','author','editor','admin']
  bio?: string;
  avatar?: string; // media url
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: String,
    providers: [{ provider: String, id: String }],
    roles: { type: [String], default: ['reader'] },
    bio: String,
    avatar: String,
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);
