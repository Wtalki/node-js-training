import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../services/auth.js';

export function authRequired(req, res, next) {
  try {
    const header = String(req.headers.authorization || '');
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
    return next();
  } catch (_) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function adminRequired(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  return next();
}


