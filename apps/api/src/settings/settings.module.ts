import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { settingsSchema } from '@repo/db';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Settings', schema: settingsSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
