import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { Request } from 'express';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: LocalAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: RefreshTokenGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      jest
        .spyOn(service, 'register')
        .mockResolvedValue({ message: 'User registered successfully' });

      expect(await controller.register(registerDto)).toEqual({
        message: 'User registered successfully',
      });
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should log in a user and return tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      jest.spyOn(service, 'login').mockResolvedValue(tokens);

      const req = { user: loginDto } as unknown as Request;
      expect(await controller.login(loginDto, req)).toEqual(tokens);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens', async () => {
      const tokens = { accessToken: 'newAccess', refreshToken: 'newRefresh' };
      jest.spyOn(service, 'refreshTokens').mockResolvedValue(tokens);

      const req = {
        user: { refreshToken: 'oldRefresh' },
      } as unknown as Request;
      expect(await controller.refresh(req)).toEqual(tokens);
      expect(service.refreshTokens).toHaveBeenCalledWith('oldRefresh');
    });
  });

  describe('logout', () => {
    it('should log out a user', async () => {
      jest
        .spyOn(service, 'logout')
        .mockResolvedValue({ message: 'Logged out successfully' });

      const req = { user: { userId: 1 } } as unknown as Request;
      expect(await controller.logout(req)).toEqual({
        message: 'Logged out successfully',
      });
      expect(service.logout).toHaveBeenCalledWith(1);
    });
  });

  describe('googleAuth', () => {
    it('should initiate google auth', async () => {
      // This is a redirect, so no direct return value to test
      const req = {} as Request;
      expect(await controller.googleAuth(req)).toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should handle google auth redirect', async () => {
      const user = { email: 'google@example.com' };
      const req = { user } as unknown as Request;
      expect(await controller.googleAuthRedirect(req)).toEqual({
        message: 'Google OAuth successful',
        user,
      });
    });
  });

  describe('githubAuth', () => {
    it('should initiate github auth', async () => {
      // This is a redirect, so no direct return value to test
      const req = {} as Request;
      expect(await controller.githubAuth(req)).toBeUndefined();
    });
  });

  describe('githubAuthRedirect', () => {
    it('should handle github auth redirect', async () => {
      const user = { email: 'github@example.com' };
      const req = { user } as unknown as Request;
      expect(await controller.githubAuthRedirect(req)).toEqual({
        message: 'GitHub OAuth successful',
        user,
      });
    });
  });
});
