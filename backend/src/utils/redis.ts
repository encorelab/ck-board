import { Redis, RedisOptions } from 'ioredis';

class RedisClient {
  private static pubClient: Redis;
  private static subClient: Redis;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {} // Prevent direct instantiation

  static init(redisOptions: RedisOptions): void {
    if (!RedisClient.pubClient || !RedisClient.subClient) {
      RedisClient.pubClient = new Redis({
        ...redisOptions,
        enableAutoPipelining: true, // Optimize multiple requests into a single pipeline
        maxRetriesPerRequest: null, // Prevent unnecessary reconnections
      });
      RedisClient.subClient = new Redis({
        ...redisOptions,
        enableAutoPipelining: true, // Optimize multiple requests into a single pipeline
        maxRetriesPerRequest: null, // Prevent unnecessary reconnections
      });

      RedisClient.pubClient.on('connect', () => {
        console.log('Publisher client connected to Redis.');
        setInterval(async () => {
          try {
            await RedisClient.pubClient.ping(); //Keeps the client connected, preventing from idle timeout
          } catch (error) {
            console.error('❌ Redis PING failed:', error);
          }
        }, 240000); // Every 4 minutes (240,000 ms)
      });

      RedisClient.subClient.on('connect', () => {
        console.log('Subscriber client connected to Redis.');
        setInterval(async () => {
          try {
            await RedisClient.subClient.ping(); //Keeps the client connected, preventing from idle timeout
          } catch (error) {
            console.error('❌ Redis PING failed:', error);
          }
        }, 240000); // Every 4 minutes (240,000 ms)
      });

      RedisClient.pubClient.on('error', (err) => {
        console.error('Publisher client encountered an error:', err);
      });

      RedisClient.subClient.on('error', (err) => {
        console.error('Subscriber client encountered an error:', err);
      });
    }
  }

  static getPublisher(): Redis {
    if (!RedisClient.pubClient) {
      throw new Error(
        'RedisClient not initialized. Call RedisClient.init() first.'
      );
    }
    return RedisClient.pubClient;
  }

  static getSubscriber(): Redis {
    if (!RedisClient.subClient) {
      throw new Error(
        'RedisClient not initialized. Call RedisClient.init() first.'
      );
    }
    return RedisClient.subClient;
  }

  static async disconnect(): Promise<void> {
    try {
      if (RedisClient.pubClient) await RedisClient.pubClient.quit();
      if (RedisClient.subClient) await RedisClient.subClient.quit();
      console.log('Redis clients disconnected successfully.');
    } catch (error) {
      console.error('Error disconnecting Redis clients:', error);
    }
  }
}

export default RedisClient;
