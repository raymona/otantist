import { Module } from '@nestjs/common';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { ParentDashboardModule } from '../parent-dashboard/parent-dashboard.module';

@Module({
  imports: [ParentDashboardModule],
  controllers: [SafetyController],
  providers: [SafetyService],
  exports: [SafetyService],
})
export class SafetyModule {}
