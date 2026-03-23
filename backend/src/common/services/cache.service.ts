import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

class CacheService {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
      
      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });
      
      this.client.on('error', (err) => {
        logger.error('Redis error', { error: err.message });
      });
    } catch (error) {
      logger.warn('Redis connection failed, using in-memory fallback');
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return inMemoryCache.get(key);
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error', { key });
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      inMemoryCache.set(key, value, ttlSeconds);
      return;
    }
    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis set error', { key });
      inMemoryCache.set(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      inMemoryCache.del(key);
      return;
    }
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error', { key });
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}

// Simple in-memory fallback
const inMemoryCache = {
  store: new Map<string, { value: string; expiry: number }>(),
  
  get(key: string): string | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  },
  
  set(key: string, value: string, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiry });
  },
  
  del(key: string): void {
    this.store.delete(key);
  }
};

export const cacheService = new CacheService();