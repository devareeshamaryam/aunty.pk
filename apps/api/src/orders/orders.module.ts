import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { orderSchema, productSchema } from '@repo/db';
import { AuthModule } from '../auth/auth.module';
import { AppMailerModule } from '../mailer/mailer.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: orderSchema },
      { name: 'Product', schema: productSchema },
    ]),
    AuthModule,
    AppMailerModule,
    SettingsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
