import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IBanner } from '@repo/db';

export interface BannerInput {
  imageUrl: string;
  imageUrlMobile?: string;
  linkUrl?: string;
  alt?: string;
  isActive?: boolean;
  order?: number;
}

@Injectable()
export class BannersService {
  constructor(@InjectModel('Banner') private model: Model<IBanner>) {}

  async listPublic() {
    return this.model.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
  }

  async listAll() {
    return this.model.find().sort({ order: 1, createdAt: 1 }).lean();
  }

  async create(dto: BannerInput) {
    return this.model.create(dto);
  }

  async update(id: string, dto: Partial<BannerInput>) {
    const banner = await this.model.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async remove(id: string) {
    const banner = await this.model.findByIdAndDelete(id);
    if (!banner) throw new NotFoundException('Banner not found');
    return { message: 'Banner deleted' };
  }
}
