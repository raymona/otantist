import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ParentDashboardModule } from '../parent-dashboard/parent-dashboard.module';

@Module({
  imports: [ParentDashboardModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
