import {
  IsString,
  IsArray,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  ValidateNested,
  IsOptional,
  IsEmail,
  MaxLength,
  Min,
  Max,
  IsIn,
  ArrayMaxSize,
  ArrayNotEmpty,
  Matches,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

const ALLOWED_VOICE_MIMES = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav'];

const ORDER_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'RIDER_ON_WAY',
  'DELIVERED',
  'CANCELLED',
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

class ShippingAddressDto {
  @IsString() @IsOptional() @MaxLength(500)
  street?: string;

  @IsString() @IsOptional() @MaxLength(200)
  area?: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  city: string;

  @IsString() @IsNotEmpty() @MaxLength(30)
  phone: string;

  @IsString() @IsOptional() @MaxLength(500)
  notes?: string;
}

class DeliveryLocationDto {
  @IsNumber() @Min(-90) @Max(90)
  lat: number;

  @IsNumber() @Min(-180) @Max(180)
  lng: number;

  @IsString() @IsOptional() @MaxLength(500)
  label?: string;
}

class OrderItemDto {
  @IsString() @IsNotEmpty() @MaxLength(64)
  product: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  name: string;

  @IsNumber() @Min(0) @Max(10_000_000)
  price: number;

  @IsNumber() @Min(1) @Max(1000)
  quantity: number;

  @IsString() @IsOptional() @MaxLength(500)
  image?: string;

  @IsString() @IsOptional() @MaxLength(100)
  variantName?: string;
}

class VoiceMessageDto {
  @IsString() @IsNotEmpty() @MaxLength(15_000_000)
  data: string;

  @IsString() @IsIn(ALLOWED_VOICE_MIMES)
  mimeType: string;

  @IsNumber() @Min(0) @Max(600)
  durationSeconds: number;
}

export class CreateOrderDto {
  // Guest identifier from browser localStorage (uuid-ish). Optional for legacy clients.
  @IsString() @IsOptional() @Matches(/^[A-Za-z0-9_-]{8,64}$/)
  guestId?: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  customerName: string;

  @IsEmail() @IsOptional() @MaxLength(254)
  customerEmail?: string;

  @IsString() @IsNotEmpty() @MaxLength(30)
  customerPhone: string;

  @IsArray() @ArrayNotEmpty() @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Either deliveryLocation OR shippingAddress must be provided (validated in service).
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  deliveryLocation?: DeliveryLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VoiceMessageDto)
  voiceMessage?: VoiceMessageDto;
}

export class UpdateOrderStatusDto {
  @IsEnum(ORDER_STATUSES)
  status: OrderStatusValue;

  @IsString() @IsOptional() @MaxLength(300)
  note?: string;
}

export class UpdateOrderEtaDto {
  @IsDateString() @IsOptional()
  estimatedDeliveryAt?: string;

  @IsString() @IsOptional() @MaxLength(80)
  estimatedDeliveryText?: string;

  @IsString() @IsOptional() @MaxLength(300)
  riderNote?: string;
}
