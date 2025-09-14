import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../services/auth.js';

export function authRequired(req, res, next) {
  try {
    const header = String(req.headers.authorization || '');
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    return next();
  } catch (err) { return res.status(401).json({ message: 'Unauthorized' }); }
}


