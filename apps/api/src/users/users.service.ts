import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from '@repo/db';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private userModel: Model<IUser>) {}

  async findAll(page = 1, limit = 10, search?: string, role?: string) {
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'ALL') {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-passwordHash -refreshToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(query),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-passwordHash -refreshToken').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // User creation disabled - admin only system
  async create(dto: CreateUserDto) {
    throw new BadRequestException('User creation is disabled. This is an admin-only system with a single admin account.');
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userModel.findOne({ email: dto.email });
      if (existing) throw new BadRequestException('Email already in use');
      user.email = dto.email;
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role) user.role = dto.role;

    if (dto.password) {
      user.passwordHash = dto.password; // pre-save hook will hash
    }

    await user.save();

    const { passwordHash, refreshToken, ...result } = user.toObject();
    return result;
  }

  // User deletion disabled - protect the only admin account
  async remove(id: string) {
    throw new BadRequestException('User deletion is disabled. This system requires the admin account to function.');
  }

  async getStats() {
    const [total, admins, users, recentUsers] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: 'ADMIN' }),
      this.userModel.countDocuments({ role: 'USER' }),
      this.userModel
        .find()
        .select('-passwordHash -refreshToken')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return { total, admins, users, recentUsers };
  }
}
