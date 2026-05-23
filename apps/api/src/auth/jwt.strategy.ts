import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret || secret.startsWith('CHANGE_ME')) {
      throw new Error('JWT_ACCESS_SECRET is missing or still set to placeholder');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload);
    if (!user) throw new UnauthorizedException();
    return { ...payload, userId: payload.sub };
  }
}