import { IsNumber, IsString, IsOptional, IsEmail, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  reviewerName?: string;

  @IsEmail()
  @IsOptional()
  reviewerEmail?: string;

  @IsString()
  @IsNotEmpty()
  product: string;
}

export class UpdateReviewStatusDto {
  @IsString()
  status: 'approved' | 'rejected' | 'pending';
}
