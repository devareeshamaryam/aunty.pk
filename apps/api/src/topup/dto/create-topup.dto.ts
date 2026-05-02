import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTopUpDto {
  @IsString()
  name: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  order?: number;
}