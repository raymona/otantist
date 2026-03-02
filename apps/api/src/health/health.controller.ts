import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  @Get()
  async check() {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    // Redis check
    try {
      const pong = await this.redis.ping();
      checks.redis = pong ? 'ok' : 'disconnected';
    } catch {
      checks.redis = 'error';
    }

    const allOk = Object.values(checks).every(v => v === 'ok');
    const anyError = checks.database === 'error'; // DB down = error, Redis down = degraded
    const status = allOk ? 'ok' : anyError ? 'error' : 'degraded';

    return { status, checks, timestamp: new Date().toISOString() };
  }
}
