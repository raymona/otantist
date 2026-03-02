import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private connected = false;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — Redis features disabled');
      this.client = null as unknown as Redis;
      return;
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: times => Math.min(times * 200, 5000),
      lazyConnect: false,
    });

    this.client.on('connect', () => {
      this.connected = true;
      this.logger.log('Connected to Redis');
    });

    this.client.on('error', err => {
      this.connected = false;
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('close', () => {
      this.connected = false;
      this.logger.warn('Redis connection closed');
    });
  }

  get isConnected(): boolean {
    return this.connected;
  }

  getClient(): Redis | null {
    return this.client ?? null;
  }

  async ping(): Promise<boolean> {
    if (!this.client || !this.connected) return false;
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
      this.logger.log('Redis connection closed gracefully');
    }
  }
}
