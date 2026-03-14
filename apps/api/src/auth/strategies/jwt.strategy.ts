import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; iat?: number }) {
    const account = await this.authService.validateToken(payload);

    if (!account) {
      throw new UnauthorizedException();
    }

    // Reject tokens issued before a password change
    if (account.passwordChangedAt && payload.iat) {
      if (payload.iat * 1000 < account.passwordChangedAt.getTime()) {
        throw new UnauthorizedException({
          code: 'TOKEN_INVALIDATED',
          message_en: 'Token invalidated by password change',
          message_fr: 'Jeton invalidé par un changement de mot de passe',
        });
      }
    }

    return account;
  }
}
