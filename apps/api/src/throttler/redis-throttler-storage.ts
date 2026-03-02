import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { ThrottlerStorageService } from '@nestjs/throttler/dist/throttler.service';
import { RedisService } from '../redis/redis.service';

const KEY_PREFIX = 'throttle:';

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly fallback = new ThrottlerStorageService();

  constructor(private readonly redis: RedisService) {}

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const client = this.redis.getClient();
    if (!client || !this.redis.isConnected) {
      return this.fallback.increment(key, ttl);
    }

    try {
      const redisKey = `${KEY_PREFIX}${key}`;
      const totalHits = await client.incr(redisKey);

      // Set expiry only on the first hit (when INCR creates the key)
      if (totalHits === 1) {
        await client.pexpire(redisKey, ttl);
      }

      const pttl = await client.pttl(redisKey);
      // pttl returns -1 if no expiry, -2 if key doesn't exist
      const timeToExpire = pttl > 0 ? Math.ceil(pttl / 1000) : Math.ceil(ttl / 1000);

      return { totalHits, timeToExpire };
    } catch (err) {
      this.logger.warn(
        `Redis throttle failed, using in-memory fallback: ${(err as Error).message}`
      );
      return this.fallback.increment(key, ttl);
    }
  }
}
