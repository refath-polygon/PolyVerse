import { Injectable,  } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis,  } from '@nestjs-modules/ioredis';

@Injectable()
export class RedisService {
  constructor( @InjectRedis() private readonly redis: Redis,) {}

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1 && ttlSeconds) {
      await this.redis.expire(key, ttlSeconds);
    }
    return count;
  }
}
