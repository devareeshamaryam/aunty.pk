import {
  IsNumber,
  IsString,
  IsOptional,
  IsEmail,
  Min,
  Max,
  IsArray,
  ArrayMaxSize,
  MaxLength,
  Matches,
  IsEnum,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { ReviewStatus } from '@repo/db';

export class CreateReviewDto {
  @IsMongoId()
  product: string;

  @IsNumber() @Min(1) @Max(5)
  rating: number;

  @IsString() @IsOptional() @MaxLength(2000)
  comment?: string;

  @IsString() @IsOptional() @MaxLength(100)
  reviewerName?: string;

  @IsEmail() @IsOptional() @MaxLength(254)
  reviewerEmail?: string;

  @IsString() @IsOptional() @MaxLength(30)
  reviewerPhone?: string;

  @IsString() @IsOptional() @Matches(/^[A-Za-z0-9_-]{8,64}$/)
  guestId?: string;

  @IsMongoId() @IsOptional()
  order?: string;

  @IsArray() @IsOptional() @ArrayMaxSize(5)
  @IsString({ each: true })
  photos?: string[];
}

export class UpdateReviewDto {
  @IsNumber() @IsOptional() @Min(1) @Max(5)
  rating?: number;

  @IsString() @IsOptional() @MaxLength(2000)
  comment?: string;

  @IsString() @IsOptional() @MaxLength(100)
  reviewerName?: string;

  @IsString() @IsOptional() @MaxLength(1000)
  ownerReply?: string;

  @IsArray() @IsOptional() @ArrayMaxSize(5)
  @IsString({ each: true })
  photos?: string[];

  @IsBoolean() @IsOptional()
  isVerified?: boolean;

  @IsEnum(ReviewStatus) @IsOptional()
  status?: ReviewStatus;
}

export class UpdateReviewStatusDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;
}

export class AdminCreateReviewDto extends CreateReviewDto {
  @IsString() @IsOptional() @MaxLength(1000)
  ownerReply?: string;

  @IsBoolean() @IsOptional()
  isVerified?: boolean;

  @IsEnum(ReviewStatus) @IsOptional()
  status?: ReviewStatus;
}
