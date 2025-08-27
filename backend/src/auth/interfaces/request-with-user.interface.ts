import { Request } from 'express';
import { LoginDto } from '../dto/login.dto';

export interface UserFromJwt {
  userId: string;
  email: string;
}

export interface UserWithRefreshToken extends UserFromJwt {
  refreshToken: string;
}

export interface RequestWithUser extends Request {
  user: UserFromJwt | UserWithRefreshToken | LoginDto;
}
