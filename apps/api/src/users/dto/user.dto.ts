import { IsEmail, IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'ADMIN';
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'ADMIN';

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
