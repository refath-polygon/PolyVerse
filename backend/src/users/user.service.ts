import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel('User') private userModel: Model<IUser>) {}

  async findByEmail(email: string): Promise<IUser | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return this.userModel.findById(id).exec();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { refreshToken }).exec();
  }

  async update(
    userId: string,
    userData: Partial<IUser>,
  ): Promise<IUser | null> {
    return this.userModel
      .findByIdAndUpdate(userId, userData, { new: true })
      .exec();
  }

  async remove(userId: string): Promise<any> {
    return this.userModel.findByIdAndDelete(userId).exec();
  }
}
