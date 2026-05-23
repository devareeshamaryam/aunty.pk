import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { SettingsService } from './settings.service';
import { Public } from '../auth/decorators/public.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';

class DeliveryFeeDto {
  @IsBoolean() free: boolean;
  @IsNumber() @Min(0) amount: number;
  @IsNumber() @Min(0) @IsOptional() freeAbove?: number;
}

class StoreInfoDto {
  @IsString() @MaxLength(100) name: string;
  @IsString() @MaxLength(30) @IsOptional() phone?: string;
  @IsString() @MaxLength(30) @IsOptional() whatsapp?: string;
}

class UpdateSettingsDto {
  @IsOptional() @Type(() => DeliveryFeeDto) deliveryFee?: DeliveryFeeDto;
  @IsOptional() @Type(() => StoreInfoDto) store?: StoreInfoDto;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** Public: web app reads this on every page load (cached) to show delivery fee, store info. */
  @Public()
  @Get()
  async getPublic() {
    const s = await this.settingsService.get();
    return {
      deliveryFee: s.deliveryFee,
      store: s.store,
    };
  }

  @UseGuards(AdminGuard)
  @Put()
  async update(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(dto as any);
  }
}
