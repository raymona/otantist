import { Module, forwardRef } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessageSchedulerService } from './message-scheduler.service';

@Module({
  imports: [forwardRef(() => GatewayModule)],
  controllers: [MessagingController],
  providers: [MessagingService, MessageSchedulerService],
  exports: [MessagingService],
})
export class MessagingModule {}
