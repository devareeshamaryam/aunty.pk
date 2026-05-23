import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { UploadsModule } from './uploads/uploads.module';
import { ReviewsModule } from './reviews/reviews.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppMailerModule } from './mailer/mailer.module';
import { SettingsModule } from './settings/settings.module';
import { BannersModule } from './banners/banners.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        path.resolve(__dirname, '../.env'),
        path.resolve(process.cwd(), 'apps/api/.env'),
        '.env',
      ],
    }),
    // Global rate limiting: 100 req / 60s per IP (auth endpoints further limited locally)
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60_000, limit: 100 },
      { name: 'long', ttl: 60 * 60_000, limit: 2000 },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI is not set in environment');
        }
        return { uri };
      },
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    UploadsModule,
    ReviewsModule,
    AppMailerModule,
    SettingsModule,
    BannersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}