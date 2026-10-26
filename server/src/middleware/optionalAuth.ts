import { Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth.js';
import { AuthedRequest } from './requireAuth.js';

/**
 * Like `requireAuth`, but anonymous requests pass through: sets `req.userId`
 * when a valid session cookie is present and otherwise leaves it undefined.
 */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.token;
  if (token) {
    try {
      req.userId = verifyToken(token).userId;
    } catch {
      req.userId = undefined;
    }
  }
  next();
}
