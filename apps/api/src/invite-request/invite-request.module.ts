import { Module } from '@nestjs/common';
import { InviteRequestController } from './invite-request.controller';
import { InviteRequestService } from './invite-request.service';

@Module({
  controllers: [InviteRequestController],
  providers: [InviteRequestService],
})
export class InviteRequestModule {}
