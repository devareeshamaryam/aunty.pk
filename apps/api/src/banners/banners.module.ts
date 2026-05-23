import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { bannerSchema } from '@repo/db';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Banner', schema: bannerSchema }])],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
