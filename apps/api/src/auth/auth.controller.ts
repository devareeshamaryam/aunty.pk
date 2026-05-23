import { Body, Controller, Post, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { TokensDto } from './dto/tokens.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetCurrentUser, GetCurrentUserId } from './decorators/get-current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ medium: { ttl: 60_000, limit: 5 } })
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<TokensDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ medium: { ttl: 60_000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<TokensDto> {
    return this.authService.login(dto);
  }

  @Public()
  @Throttle({ medium: { ttl: 60_000, limit: 20 } })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @GetCurrentUserId() userId: string,
    @Body('refresh_token') refreshToken: string,
  ): Promise<TokensDto> {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@GetCurrentUserId() userId: string) {
    await this.authService.logout(userId);
    return { message: 'Logged out' };
  }

  @Get('me')
  async getMe(@GetCurrentUserId() userId: string) {
    return this.authService.getMe(userId);
  }
}