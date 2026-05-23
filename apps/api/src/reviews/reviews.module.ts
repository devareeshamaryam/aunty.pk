import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { reviewSchema, productSchema, orderSchema } from '@repo/db';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Review', schema: reviewSchema },
      { name: 'Product', schema: productSchema },
      { name: 'Order', schema: orderSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
