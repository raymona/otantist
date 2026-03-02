import { RedisThrottlerStorage } from './redis-throttler-storage';
import { RedisService } from '../redis/redis.service';

describe('RedisThrottlerStorage', () => {
  let storage: RedisThrottlerStorage;
  let mockRedis: jest.Mocked<RedisService>;
  let mockClient: { incr: jest.Mock; pexpire: jest.Mock; pttl: jest.Mock };

  beforeEach(() => {
    mockClient = {
      incr: jest.fn(),
      pexpire: jest.fn(),
      pttl: jest.fn(),
    };

    mockRedis = {
      isConnected: true,
      getClient: jest.fn().mockReturnValue(mockClient),
      ping: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    storage = new RedisThrottlerStorage(mockRedis);
  });

  it('should increment via Redis when connected', async () => {
    mockClient.incr.mockResolvedValue(3);
    mockClient.pttl.mockResolvedValue(8500);

    const result = await storage.increment('test-key', 10000);

    expect(mockClient.incr).toHaveBeenCalledWith('throttle:test-key');
    expect(result.totalHits).toBe(3);
    expect(result.timeToExpire).toBe(9); // ceil(8500/1000)
  });

  it('should set pexpire only on first hit', async () => {
    mockClient.incr.mockResolvedValue(1);
    mockClient.pttl.mockResolvedValue(10000);

    await storage.increment('new-key', 10000);

    expect(mockClient.pexpire).toHaveBeenCalledWith('throttle:new-key', 10000);
  });

  it('should not set pexpire on subsequent hits', async () => {
    mockClient.incr.mockResolvedValue(5);
    mockClient.pttl.mockResolvedValue(7000);

    await storage.increment('existing-key', 10000);

    expect(mockClient.pexpire).not.toHaveBeenCalled();
  });

  it('should fall back to in-memory when Redis is disconnected', async () => {
    Object.defineProperty(mockRedis, 'isConnected', { get: () => false });

    const result = await storage.increment('key', 60000);

    expect(mockClient.incr).not.toHaveBeenCalled();
    expect(result.totalHits).toBe(1);
    expect(result.timeToExpire).toBeGreaterThan(0);
  });

  it('should fall back to in-memory when client is null', async () => {
    mockRedis.getClient = jest.fn().mockReturnValue(null);

    const result = await storage.increment('key', 60000);

    expect(result.totalHits).toBe(1);
    expect(result.timeToExpire).toBeGreaterThan(0);
  });

  it('should fall back to in-memory when Redis command throws', async () => {
    mockClient.incr.mockRejectedValue(new Error('Connection reset'));

    const result = await storage.increment('key', 60000);

    expect(result.totalHits).toBe(1);
    expect(result.timeToExpire).toBeGreaterThan(0);
  });
});
