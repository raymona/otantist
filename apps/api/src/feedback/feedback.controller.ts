import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { IsString, MaxLength, IsOptional, MinLength } from 'class-validator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { EmailService } from '../email/email.service';

class SubmitFeedbackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

@ApiTags('Feedback')
@ApiBearerAuth()
@Controller('feedback')
export class FeedbackController {
  constructor(private emailService: EmailService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit tester feedback' })
  async submit(@Request() req: any, @Body() dto: SubmitFeedbackDto): Promise<{ sent: boolean }> {
    const fromEmail = req.user?.email || 'unknown@test';
    await this.emailService.sendFeedbackEmail({
      name: dto.name,
      message: dto.message,
      category: dto.category || 'general',
      fromEmail,
    });
    return { sent: true };
  }
}
