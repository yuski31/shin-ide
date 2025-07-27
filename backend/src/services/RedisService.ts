import Redis from 'ioredis';

export class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    // Redis is optional - the app should work without it
    if (process.env.REDIS_URL) {
      this.client = new Redis(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
      });
    }
  }

  async connect(): Promise<void> {
    if (!this.client) {
      console.log('⚠️  Redis not configured, skipping connection');
      return;
    }

    try {
      await this.client.connect();
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      // Don't throw error - Redis is optional
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        console.log('✅ Redis disconnected successfully');
      } catch (error) {
        console.error('❌ Redis disconnection failed:', error);
      }
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  // Cache methods
  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      return await this.client.get(key);
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttlSeconds: number = 3600): Promise<boolean> {
    return this.set(`session:${sessionId}`, JSON.stringify(data), ttlSeconds);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const data = await this.get(`session:${sessionId}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse session data:', error);
        return null;
      }
    }
    return null;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Rate limiting
  async incrementRateLimit(key: string, windowSeconds: number): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      const results = await multi.exec();
      
      if (results && results[0] && results[0][1]) {
        return results[0][1] as number;
      }
      return 0;
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return 0;
    }
  }

  // Pub/Sub for real-time features
  async publish(channel: string, message: any): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const subscriber = this.client.duplicate();
      await subscriber.subscribe(channel);
      
      subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            console.error('Failed to parse Redis message:', error);
          }
        }
      });
      
      return true;
    } catch (error) {
      console.error('Redis subscribe error:', error);
      return false;
    }
  }

  // Cache project data
  async cacheProject(projectId: string, projectData: any, ttlSeconds: number = 300): Promise<boolean> {
    return this.set(`project:${projectId}`, JSON.stringify(projectData), ttlSeconds);
  }

  async getCachedProject(projectId: string): Promise<any | null> {
    const data = await this.get(`project:${projectId}`);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse cached project data:', error);
        return null;
      }
    }
    return null;
  }

  async invalidateProject(projectId: string): Promise<boolean> {
    return this.del(`project:${projectId}`);
  }

  // Cache file content
  async cacheFile(fileId: string, content: string, ttlSeconds: number = 600): Promise<boolean> {
    return this.set(`file:${fileId}`, content, ttlSeconds);
  }

  async getCachedFile(fileId: string): Promise<string | null> {
    return this.get(`file:${fileId}`);
  }

  async invalidateFile(fileId: string): Promise<boolean> {
    return this.del(`file:${fileId}`);
  }

  // Cleanup expired keys
  async cleanup(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      // Redis automatically handles TTL expiration
      // This method can be used for custom cleanup logic if needed
      console.log('✅ Redis cleanup completed');
    } catch (error) {
      console.error('Redis cleanup failed:', error);
    }
  }
}
