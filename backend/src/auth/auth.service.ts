import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UserService } from '../users/user.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IUser } from '../users/schemas/user.schema';
import { ObjectId } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const existingUserByEmail = await this.userService.findByEmail(
      registerDto.email,
    );
    if (existingUserByEmail) {
      throw new BadRequestException('User with this email already exists');
    }

    const existingUserByUsername = await this.userService.findByUsername(
      registerDto.username,
    );
    if (existingUserByUsername) {
      throw new BadRequestException('User with this username already exists');
    }

    const passwordHash = await argon2.hash(registerDto.password);

    await this.userService.create({
      name: registerDto.name,
      username: registerDto.username,
      email: registerDto.email,
      passwordHash,
    });
    return { message: 'User registered successfully' };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    await this.checkLoginAttempts(loginDto.email); // Check attempts before any other logic

    const user = await this.userService.findByEmail(loginDto.email);
    if (!user || !user.passwordHash) {
      await this.handleFailedLoginAttempt(loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );
    if (!passwordMatches) {
      await this.handleFailedLoginAttempt(loginDto.email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const loginAttemptsKey = `login_attempts:${loginDto.email}`;
    await this.redisService.del(loginAttemptsKey); // Clear attempts on successful login

    return this.generateTokens((user._id as ObjectId).toString(), user.email);
  }

  async refreshTokens(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const email = payload.email;

    const storedRefreshToken = await this.redisService.get(
      `refresh_token:${userId}`,
    );

    if (!storedRefreshToken || storedRefreshToken !== oldRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.redisService.del(`refresh_token:${userId}`); // Invalidate old refresh token
    return this.generateTokens((user._id as ObjectId).toString(), user.email);
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.redisService.del(`refresh_token:${userId}`);
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
    }); // Refresh token valid for 7 days

    await this.redisService.set(
      `refresh_token:${userId}`,
      refreshToken,
      7 * 24 * 60 * 60,
    ); // Store refresh token for 7 days

    return { accessToken, refreshToken };
  }

  private async handleFailedLoginAttempt(email: string): Promise<void> {
    await this.redisService.increment(
      `login_attempts:${email}`,
      Number(process.env.BLOCK_DURATION),
    ); // Increment and set expiry
  }

  private async checkLoginAttempts(email: string): Promise<void> {
    const loginAttemptsKey = `login_attempts:${email}`;
    const currentAttemptsStr = await this.redisService.get(loginAttemptsKey);
    const currentAttempts = currentAttemptsStr
      ? parseInt(currentAttemptsStr, 10)
      : 0;

    if (currentAttempts >= Number(process.env.MAX_ATTEMPTS || 3)) {
      throw new UnauthorizedException(
        `Account locked due to too many failed login attempts. Try again in ${Number(process.env.BLOCK_DURATION) / 3600} hr.`,
      );
    }
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (
      user &&
      user.passwordHash &&
      (await argon2.verify(user.passwordHash, pass))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user.toObject();
      return result;
    }
    return null;
  }
}
