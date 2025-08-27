import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    NestRedisModule.forRoot({
      type:"single",
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
