import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService
  ) {}

  async authenticate(socket: Socket): Promise<boolean> {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        socket.emit('error', {
          code: 'AUTH_REQUIRED',
          message_en: 'Authentication token required',
          message_fr: "Jeton d'authentification requis",
        });
        socket.disconnect();
        return false;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const account = await this.authService.validateToken({
        sub: payload.sub,
        email: payload.email,
      });

      socket.data.account = account;
      return true;
    } catch {
      socket.emit('error', {
        code: 'AUTH_INVALID',
        message_en: 'Invalid or expired token',
        message_fr: 'Jeton invalide ou expiré',
      });
      socket.disconnect();
      return false;
    }
  }
}
