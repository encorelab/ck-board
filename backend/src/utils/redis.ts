import { Redis, RedisOptions } from 'ioredis';

class RedisClient {
  private static instance: RedisClient;
  private pubClient: Redis;
  private subClient: Redis;

  private constructor(redisOptions: RedisOptions) {
    this.pubClient = new Redis(redisOptions);
    this.subClient = new Redis(redisOptions);

    this.pubClient.on('connect', () => {
      console.log('Publisher client connected to Redis.');
    });

    this.subClient.on('connect', () => {
      console.log('Subscriber client connected to Redis.');
    });

    this.pubClient.on('error', (err) => {
      console.error('Publisher client encountered an error:', err);
    });

    this.subClient.on('error', (err) => {
      console.error('Subscriber client encountered an error:', err);
    });
  }

  static getInstance(redisOptions: RedisOptions): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(redisOptions);
    }
    return RedisClient.instance;
  }

  get getPublisher(): Redis {
    return this.pubClient;
  }

  get getSubscriber(): Redis {
    return this.subClient;
  }

  async disconnect(): Promise<void> {
    try {
      await this.pubClient.quit();
      await this.subClient.quit();
      console.log('Redis clients disconnected successfully.');
    } catch (error) {
      console.error('Error disconnecting Redis clients:', error);
    }
  }
}

export default RedisClient;
