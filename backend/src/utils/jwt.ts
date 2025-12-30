import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import config from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (payload: JWTPayload): string => {
  // Use type assertion to handle jsonwebtoken's strict typing
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload');
    }
    return decoded;
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw new Error('Invalid or expired token');
  }
};

