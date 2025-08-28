import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserService } from '../../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/redis.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let redisService: RedisService;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload, options) => {
              if (
                options.secret === (process.env.JWT_SECRET || 'test-jwt-secret')
              )
                return 'mockAccessToken';
              if (
                options.secret ===
                (process.env.JWT_REFRESH_SECRET || 'test-refresh-secret')
              )
                return 'mockRefreshToken';
              return '';
            }),
            verifyAsync: jest.fn((token, options) => {
              if (
                options.secret ===
                (process.env.JWT_REFRESH_SECRET || 'test-refresh-secret')
              ) {
                return Promise.resolve({ sub: 1, email: 'test@example.com' });
              }
              throw new UnauthorizedException('Invalid refresh token');
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest.fn(),
            get: jest.fn(),
            del: jest.fn(),
            increment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(undefined);
      jest.spyOn(userService, 'create').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual({ message: 'User registered successfully' });
      expect(userService.create).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should throw BadRequestException if user already exists', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
      });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
    };
    const loginDto = { email: 'test@example.com', password: 'password123' };

    it('should return access and refresh tokens on successful login', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(true);
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);
      jest
        .spyOn(jwtService, 'sign')
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      const result = await service.login(loginDto);
      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      expect(redisService.del).toHaveBeenCalledWith(
        `login_attempts:${loginDto.email}`,
      );
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(redisService.set).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}`,
        'refreshToken',
        7 * 24 * 60 * 60,
      );
    });

    it('should throw UnauthorizedException for invalid credentials (user not found)', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(undefined);
      jest.spyOn(redisService, 'increment').mockResolvedValue(1);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.increment).toHaveBeenCalledWith(
        `login_attempts:${loginDto.email}`,
        2 * 60 * 60,
      );
    });

    it('should throw UnauthorizedException for invalid credentials (wrong password)', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);
      jest.spyOn(redisService, 'increment').mockResolvedValue(1);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.increment).toHaveBeenCalledWith(
        `login_attempts:${loginDto.email}`,
        2 * 60 * 60,
      );
    });

    it('should throw UnauthorizedException if account is locked', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(argon2, 'verify').mockResolvedValue(false);
      jest.spyOn(redisService, 'increment').mockResolvedValue(3);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisService.increment).toHaveBeenCalledWith(
        `login_attempts:${loginDto.email}`,
        2 * 60 * 60,
      );
    });
  });

  describe('refreshTokens', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
    };
    const oldRefreshToken = 'oldRefreshToken';

    it('should return new access and refresh tokens', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(redisService, 'get').mockResolvedValue(oldRefreshToken);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);
      jest.spyOn(jwtService, 'sign').mockImplementation((p, options: any) => {
        if (
          options.secret === (process.env.JWT_SECRET || 'super-secret-jwt-key')
        )
          return 'newAccessToken';
        if (
          options.secret ===
          (process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key')
        )
          return 'newRefreshToken';
        return '';
      });
      jest.spyOn(redisService, 'set').mockResolvedValue(undefined);

      const result = await service.refreshTokens(oldRefreshToken);
      expect(result).toEqual({
        accessToken: 'newAccessToken',
        refreshToken: 'newRefreshToken',
      });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(oldRefreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key',
      });
      expect(redisService.get).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}`,
      );
      expect(redisService.del).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}`,
      );
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(redisService.set).toHaveBeenCalledWith(
        `refresh_token:${mockUser.id}`,
        'newRefreshToken',
        7 * 24 * 60 * 60,
      );
    });

    it('should throw UnauthorizedException for invalid refresh token (verification failed)', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      await expect(service.refreshTokens(oldRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token not found in Redis', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(redisService, 'get').mockResolvedValue(null);

      await expect(service.refreshTokens(oldRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token does not match stored token', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest
        .spyOn(redisService, 'get')
        .mockResolvedValue('differentRefreshToken');

      await expect(service.refreshTokens(oldRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);
      jest.spyOn(redisService, 'get').mockResolvedValue(oldRefreshToken);
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(undefined);

      await expect(service.refreshTokens(oldRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      jest.spyOn(redisService, 'del').mockResolvedValue(undefined);

      const result = await service.logout(1);
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(redisService.del).toHaveBeenCalledWith(`refresh_token:1`);
    });
  });
});
