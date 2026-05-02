// src/topup/topup.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { topUpSchema } from '@repo/db';
import { TopUpService } from './topup.service';
import { TopUpController } from './topup.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'TopUp', schema: topUpSchema }]),
  ],
  controllers: [TopUpController],
  providers: [TopUpService],
  exports: [TopUpService],
})
export class TopUpModule {}