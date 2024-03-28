import { Redis, RedisOptions } from 'ioredis';

class RedisClient {
  private pubClient: Redis;
  private subClient: Redis;

  constructor(redisOptions: RedisOptions) {
    this.pubClient = new Redis(redisOptions);
    this.subClient = new Redis(redisOptions);

    this.pubClient.on('connect', () => {
      console.log('Publisher client connected to Redis.');
    });

    this.subClient.on('connect', () => {
      console.log('Subscriber client connected to Redis.');
    });

    // Handling error events
    this.pubClient.on('error', (err) => {
      console.error('Publisher client encountered an error:', err);
    });

    this.subClient.on('error', (err) => {
      console.error('Subscriber client encountered an error:', err);
    });
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
