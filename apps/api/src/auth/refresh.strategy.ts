import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private config: ConfigService) {
    const secret = config.get<string>('JWT_REFRESH_SECRET');
    if (!secret || secret.startsWith('CHANGE_ME')) {
      throw new Error('JWT_REFRESH_SECRET is missing or still set to placeholder');
    }
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.body.refresh_token; // or from cookie
    return { ...payload, refreshToken };
  }
}