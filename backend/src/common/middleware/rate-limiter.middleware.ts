import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  
  const key = req.ip || 'unknown';
  const now = Date.now();
  
  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    next();
    return;
  }
  
  store[key].count++;
  
  if (store[key].count > maxRequests) {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
    });
    return;
  }
  
  next();
}

setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);