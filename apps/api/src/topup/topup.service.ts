// src/topup/topup.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITopUp } from '@repo/db';
import { CreateTopUpDto } from './dto/create-topup.dto';
import { UpdateTopUpDto } from './dto/update-topup.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TopUpService {
  constructor(
    @InjectModel('TopUp') private topUpModel: Model<ITopUp>,
  ) {}

  // Public: only available items
  async findAllPublic(): Promise<ITopUp[]> {
    return this.topUpModel
      .find({ available: true })
      .sort({ order: 1, createdAt: 1 })
      .exec();
  }

  // Admin: all items
  async findAll(): Promise<ITopUp[]> {
    return this.topUpModel.find().sort({ order: 1, createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<ITopUp> {
    const item = await this.topUpModel.findById(id).exec();
    if (!item) throw new NotFoundException(`TopUp item ${id} not found`);
    return item;
  }

  async create(dto: CreateTopUpDto, imageFile?: Express.Multer.File): Promise<ITopUp> {
    const count = await this.topUpModel.countDocuments();
    const created = new this.topUpModel({
      ...dto,
      image: imageFile ? `topups/${imageFile.filename}` : null,
      order: dto.order ?? count + 1,
    });
    return created.save();
  }

  async update(
    id: string,
    dto: UpdateTopUpDto,
    imageFile?: Express.Multer.File,
  ): Promise<ITopUp> {
    const item = await this.findOne(id);

    // Delete old image if new one uploaded
    if (imageFile && item.image) {
      const oldPath = path.join(process.cwd(), 'uploads', item.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updateData: any = { ...dto };
    if (imageFile) updateData.image = `topups/${imageFile.filename}`;

    const updated = await this.topUpModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updated) throw new NotFoundException(`TopUp item ${id} not found`);
    return updated;
  }

  async toggleAvailable(id: string): Promise<ITopUp> {
    const item = await this.findOne(id);
    const updated = await this.topUpModel
      .findByIdAndUpdate(id, { available: !item.available }, { new: true })
      .exec();
    return updated!;
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    // Delete image file
    if (item.image) {
      const imgPath = path.join(process.cwd(), 'uploads', item.image);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await this.topUpModel.findByIdAndDelete(id).exec();
  }
}