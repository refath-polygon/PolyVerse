import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/user.module';
import { RedisModule } from '../redis/redis.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
// import { GoogleStrategy } from './strategies/google.strategy';
// import { GithubStrategy } from './strategies/github.strategy';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@Module({
  imports: [
    UsersModule,
    RedisModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, RefreshTokenGuard],
  controllers: [AuthController],
})
export class AuthModule {}
