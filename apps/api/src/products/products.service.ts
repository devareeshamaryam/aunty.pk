import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProduct } from '@repo/db';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(@InjectModel('Product') private productModel: Model<IProduct>) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const { page = 1, limit = 10, category, search, featured, minPrice, maxPrice } = query;
    const filter: any = {};

    if (category) filter.category = category;
    if (featured !== undefined) filter.isFeatured = featured;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const product = await this.productModel.findById(id).populate('category').lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.productModel.findOne({ slug }).populate('category').lean();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    
    const existing = await this.productModel.findOne({ slug });
    if (existing) throw new BadRequestException('Product with this slug already exists');

    const product = new this.productModel({
      ...dto,
      slug,
    });

    return (await product.save()).populate('category');
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productModel.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.productModel.findOne({ slug: dto.slug });
      if (existing) throw new BadRequestException('Slug already in use');
    }

    Object.assign(product, dto);
    return (await product.save()).populate('category');
  }

  async remove(id: string) {
    const result = await this.productModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Product not found');
    return { message: 'Product deleted successfully' };
  }

  async getFeatured() {
    return this.productModel.find({ isFeatured: true }).populate('category', 'name slug').limit(8).lean();
  }

  async getLatest(limit: number = 8) {
    return this.productModel
      .find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
