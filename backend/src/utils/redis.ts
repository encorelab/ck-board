import { createClient } from 'redis';

class Redis {
  client: any;
  connected: boolean;

  constructor() {
    this.client = null;
    this.connected = false;
  }

  getConnection() {
    if (this.connected) return this.client;

    this.client = createClient();
    console.log(this.client);

    this.client.on('connect', () => {
      console.log('Client connected to Redis...');
    });
    this.client.on('ready', () => {
      console.log('Redis ready to use');
    });
    this.client.on('error', (err: string) => {
      console.error('Redis Client', err);
    });
    this.client.on('end', () => {
      console.log('Redis disconnected successfully');
    });

    return this.client;
  }
}

export default new Redis().getConnection();
