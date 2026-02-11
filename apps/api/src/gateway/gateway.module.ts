import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessagingModule } from '../messaging/messaging.module';
import { StateModule } from '../state/state.module';
import { AppGateway } from './app.gateway';
import { WsAuthMiddleware } from './ws-auth.middleware';

@Module({
  imports: [AuthModule, forwardRef(() => MessagingModule), StateModule],
  providers: [AppGateway, WsAuthMiddleware],
  exports: [AppGateway],
})
export class GatewayModule {}
