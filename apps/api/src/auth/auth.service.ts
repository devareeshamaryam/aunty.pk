import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from '@repo/db';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { TokensDto } from './dto/tokens.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<IUser>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // Registration enabled for user accounts
  async register(dto: RegisterDto): Promise<TokensDto> {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new BadRequestException('Email already exists');

    const user = new this.userModel({
      email: dto.email,
      passwordHash: dto.password, // pre-save hook hashes it
      name: dto.name,
      role: 'USER', // Regular users get USER role
    });

    await user.save();

    return this.generateTokens(user);
  }

  // Auto user creation disabled - admin only system
  async findOrCreateUser(email: string, name: string, password?: string): Promise<{ user: IUser; tokens: TokensDto; isNew: boolean; tempPassword?: string }> {
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('User not found. Contact administrator.');
    }

    const tokens = await this.generateTokens(user);
    return { user, tokens, isNew: false };
  }

  async login(dto: LoginDto): Promise<TokensDto> {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokensDto> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    // Rotate refresh token (best practice)
    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $unset: { refreshToken: '' } });
  }

  async getMe(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-passwordHash -refreshToken')
      .lean();
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async generateTokens(user: IUser): Promise<TokensDto> {
    const payload = { sub: user._id, email: user.email, role: user.role };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('ACCESS_TOKEN_EXPIRY') || '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('REFRESH_TOKEN_EXPIRY') || '7d',
    });

    // Hash and store refresh token
    const hashedRt = await bcrypt.hash(refresh_token, 10);
    await this.userModel.findByIdAndUpdate(user._id, { refreshToken: hashedRt });

    return { access_token, refresh_token };
  }

  // Helper for current user (used in guards/strategies)
  async validateUser(payload: any): Promise<IUser | null> {
    return this.userModel.findById(payload.sub).select('-passwordHash -refreshToken');
  }
}