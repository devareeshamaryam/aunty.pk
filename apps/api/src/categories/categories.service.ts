import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICategory } from '@repo/db';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel('Category') private categoryModel: Model<ICategory>) {}

  async findAll() {
    return this.categoryModel.find().sort({ name: 1 }).lean();
  }

  async findOne(id: string) {
    const category = await this.categoryModel.findById(id).lean();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.categoryModel.findOne({ slug }).lean();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const existing = await this.categoryModel.findOne({ slug });
    if (existing) throw new BadRequestException('Category with this slug already exists');

    const category = new this.categoryModel({
      ...dto,
      slug,
    });

    return category.save();
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel.findById(id);
    if (!category) throw new NotFoundException('Category not found');

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryModel.findOne({ slug: dto.slug });
      if (existing) throw new BadRequestException('Slug already in use');
    }

    Object.assign(category, dto);
    return category.save();
  }

  async remove(id: string) {
    const result = await this.categoryModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Category not found');
    return { message: 'Category deleted successfully' };
  }
}
