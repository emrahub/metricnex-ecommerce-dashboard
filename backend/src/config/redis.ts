import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

class RedisClient {
  private static instance: RedisClient;
  private client: Redis;

  private constructor() {
    this.client = new Redis(config);

    this.client.on('connect', () => {
      console.log('🔴 Connected to Redis');
    });

    this.client.on('error', (err) => {
      console.error('💥 Redis connection error:', err);
    });

    this.client.on('reconnecting', () => {
      console.log('🔄 Reconnecting to Redis...');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): Redis {
    return this.client;
  }

  // Cache management methods
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  public async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  public async flushAll(): Promise<void> {
    await this.client.flushall();
  }

  // Session management
  public async setSession(sessionId: string, userId: string, ttl: number = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, { userId, createdAt: new Date().toISOString() }, ttl);
  }

  public async getSession(sessionId: string): Promise<any> {
    return await this.get(`session:${sessionId}`);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  // Report caching
  public async cacheReport(reportId: string, data: any, ttl: number = 3600): Promise<void> {
    await this.set(`report:${reportId}`, data, ttl);
  }

  public async getCachedReport(reportId: string): Promise<any> {
    return await this.get(`report:${reportId}`);
  }

  public async invalidateReportCache(reportId: string): Promise<void> {
    await this.del(`report:${reportId}`);
  }

  public async close(): Promise<void> {
    await this.client.quit();
    console.log('🔴 Redis connection closed');
  }
}

export default RedisClient;