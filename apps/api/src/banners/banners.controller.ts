import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { BannersService } from './banners.service';
import { Public } from '../auth/decorators/public.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';

class BannerDto {
  @IsString() @MaxLength(2000)
  imageUrl: string;

  @IsString() @IsOptional() @MaxLength(2000)
  imageUrlMobile?: string;

  @IsString() @IsOptional() @MaxLength(500)
  linkUrl?: string;

  @IsString() @IsOptional() @MaxLength(200)
  alt?: string;

  @IsBoolean() @IsOptional()
  isActive?: boolean;

  @IsNumber() @IsOptional()
  order?: number;
}

@Controller('banners')
export class BannersController {
  constructor(private readonly service: BannersService) {}

  /** Public: home page reads active banners. */
  @Public()
  @Get()
  list() {
    return this.service.listPublic();
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  listAll() {
    return this.service.listAll();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: BannerDto) {
    return this.service.create(dto);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<BannerDto>) {
    return this.service.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
